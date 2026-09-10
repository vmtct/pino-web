import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const ci = readFileSync(".github/workflows/ci.yml", "utf8");
const release = readFileSync(".github/workflows/production-release.yml", "utf8");
const buildBoundary = JSON.parse(
  readFileSync("ops/web-production-build-boundary.json", "utf8"),
) as {
  featureCode: string;
  deployCommand: string;
  automaticTrafficPromotion: boolean;
  promotionAuthority: string;
  externalConfigStatus: string;
};

const boundedReleaseTest =
  "node --test --experimental-strip-types test/production-release-governance.test.ts";

test("main CI validates an immutable candidate without promoting production", () => {
  assert.match(ci, /candidate:/);
  assert.match(ci, /Production traffic: not authorized by this workflow/);
  assert.match(ci, new RegExp(boundedReleaseTest.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(ci, /bun run test/);
  assert.doesNotMatch(ci, /wrangler versions deploy/);
  assert.doesNotMatch(ci, /Verify deployed Worker identity/);
  assert.doesNotMatch(ci, /Run production smoke tests/);
});

test("production release requires Founder exact-SHA provenance and explicit confirmation", () => {
  assert.match(release, /issue\.user\.login == 'vmtct'/);
  assert.match(release, /WEB_SHA:/);
  assert.match(release, /CONFIRM:\[\[:space:\]\]\*RELEASE_PRODUCTION/);
  assert.match(release, /merge_commit_sha == \$sha/);
  assert.match(release, /No successful completed CI run exists/);
  assert.match(release, /Workers Builds: pino-web/);
  assert.match(release, new RegExp(boundedReleaseTest.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(release, /bun run test/);
  assert.doesNotMatch(release, /workflow_dispatch:/);
  assert.doesNotMatch(release, /^\s+push:/m);
});

test("promotion is forward-only, SHA-tagged, config-preserving, rollback-capable, and post-verified", () => {
  assert.match(release, /git merge-base --is-ancestor "\$current_sha" "\$WEB_SHA"/);
  assert.match(release, /--version-tag "\$\{WEB_SHA\}@100%"/);
  assert.match(release, /unapproved production Wrangler config delta/);
  assert.match(release, /PINO_CORE_PUBLIC -> pino-core\/PublicOpenStudioControlPlane/);
  assert.match(release, /forbidden dev-Core URL binding/);
  assert.match(release, /changes production bindings outside the one approved Core service-binding cutover/);
  assert.match(release, /rollback\(\)/);
  assert.match(release, /Production identity does not match the approved SHA/);
  assert.match(release, /main moved during promotion; rollback/);
  assert.match(release, /X-PINO-Schedule-Source/);
  assert.match(release, /pinohouse\.art\/artchitect/);
  assert.match(release, /www\.pinohouse\.art\/little-piner/);
});

test("repository records the required external Cloudflare Builds decoupling", () => {
  assert.equal(buildBoundary.featureCode, "PLT-RELEASE");
  assert.equal(buildBoundary.automaticTrafficPromotion, false);
  assert.equal(
    buildBoundary.deployCommand,
    'npx wrangler versions upload --tag "$WORKERS_CI_COMMIT_SHA" --message "pino-web candidate $WORKERS_CI_COMMIT_SHA"',
  );
  assert.equal(
    buildBoundary.promotionAuthority,
    ".github/workflows/production-release.yml",
  );
  assert.equal(
    buildBoundary.externalConfigStatus,
    "VERIFIED_NON_PROMOTING",
  );
});
function rollbackDecision(input: Record<string, string>): string {
  return execFileSync(
    process.execPath,
    ["scripts/web-production-release-fence.mjs", JSON.stringify(input)],
    { encoding: "utf8" },
  ).trim();
}

const rollbackBase = {
  oldDeploymentId: "d-old", oldVersion: "v-old", candidateDeploymentId: "",
  candidateVersion: "v-new", candidateMarker: "run-marker",
  currentDeploymentId: "d-new", currentVersion: "v-new",
  currentMarker: "run-marker", previousDeploymentId: "d-old",
};

test("Web rollback restores only the exact run-owned successor", () => {
  assert.equal(rollbackDecision(rollbackBase), "RESTORE");
  assert.equal(rollbackDecision({ ...rollbackBase, currentMarker: "external" }), "REFUSE");
  assert.equal(rollbackDecision({ ...rollbackBase, previousDeploymentId: "d-external" }), "REFUSE");
  assert.equal(rollbackDecision({ ...rollbackBase, candidateDeploymentId: "d-new" }), "RESTORE");
});

test("Web rollback refuses same-version external redeploy and different-version drift", () => {
  assert.equal(rollbackDecision({ ...rollbackBase, currentVersion: "v-old", currentDeploymentId: "d-old" }), "NOOP");
  assert.equal(rollbackDecision({ ...rollbackBase, currentVersion: "v-old", currentDeploymentId: "d-external" }), "REFUSE");
  assert.equal(rollbackDecision({ ...rollbackBase, currentVersion: "v-third" }), "REFUSE");
});
test("Web production workflow binds terminal PASS to immutable deployment identity", () => {
  for (const token of [
    "old_deployment_id", "candidate_deployment_id", "deployment_marker",
    "promotion_attempted=1", "main_predeploy", "final_deployments",
    "PINO_WEB_PRODUCTION_RELEASE:", "web-production-release-fence.mjs",
  ]) assert.ok(release.includes(token), `missing ${token}`);
  assert.ok(release.indexOf("promotion_attempted=1") < release.indexOf("WRANGLER_OUTPUT_FILE_PATH=\"$deploy_output\""));
  assert.match(release, /PASS_ALREADY_ACTIVE[\s\S]*Deployment ID/);
});

test("Web hard-kill recovery is durable and route evidence is replayed on already-active retries", () => {
  const watchdog = readFileSync(".github/workflows/production-release-recovery-watchdog.yml", "utf8");
  const recovery = readFileSync("scripts/recover-worker-promotion.sh", "utf8");
  const armedAt = release.indexOf("PINO_WEB_PRODUCTION_RELEASE: **RECOVERY_ARMED**");
  const deployAt = release.indexOf("--version-tag \"${WEB_SHA}@100%\"");
  assert.ok(armedAt > 0 && deployAt > armedAt);
  assert.match(watchdog, /workflow_run:/);
  assert.match(watchdog, /Web Production Release/);
  assert.match(watchdog, /recover-worker-promotion\.sh/);
  assert.match(watchdog, /WATCHDOG_RECOVERED/);
  assert.match(recovery, /current_marker/);
  assert.match(recovery, /previous_deployment/);
  assert.match(recovery, /REFUSE_OWNERSHIP/);
  const alreadyAt = release.indexOf("PASS_ALREADY_ACTIVE");
  assert.ok(alreadyAt > 0);
  const prior = release.slice(Math.max(0, alreadyAt - 5000), alreadyAt);
  assert.match(prior, /api\/pino-core\/open-studio\/sessions/);
  assert.match(prior, /pinohouse\.art\/artchitect/);
  assert.match(prior, /www\.pinohouse\.art\/little-piner/);
});

test("production Web source no longer points Open Studio at dev Core", () => {
  const wrangler = readFileSync("wrangler.toml", "utf8");
  const adapter = readFileSync("lib/pino-core-public-adapter.ts", "utf8");
  assert.doesNotMatch(wrangler, /pino-core-dev|PINO_CORE_BASE_URL/);
  assert.match(wrangler, /binding = "PINO_CORE_PUBLIC"/);
  assert.match(wrangler, /service = "pino-core"/);
  assert.match(wrangler, /entrypoint = "PublicOpenStudioControlPlane"/);
  assert.doesNotMatch(adapter, /pino-core-dev|PINO_CORE_BASE_URL|DEFAULT_CORE_BASE_URL/);
  assert.match(adapter, /env\.PINO_CORE_PUBLIC\?\.fetch/);
});

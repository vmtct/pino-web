import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
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
  assert.match(ci, /Verify private Core release-read credential/);
  assert.match(ci, /PINO_CORE_RELEASE_READ_TOKEN/);
  assert.match(ci, /actions\/workflows\/core-production-release\.yml/);
  assert.match(ci, /issues\?per_page=1/);
});

test("production release requires Founder exact-SHA provenance and explicit confirmation", () => {
  assert.match(release, /issue\.user\.login == 'vmtct'/);
  assert.match(release, /WEB_SHA:/);
  assert.match(release, /CONFIRM:\[\[:space:\]\]\*RELEASE_PRODUCTION/);
  assert.match(release, /merge_commit_sha == \$sha/);
  assert.match(release, /Newest same-SHA Web CI attempt is not terminal success/);
  assert.match(release, /Workers Builds: pino-web/);
  assert.match(release, new RegExp(boundedReleaseTest.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(release, /bun run test/);
  assert.doesNotMatch(release, /workflow_dispatch:/);
  assert.doesNotMatch(release, /^\s+push:/m);
});

test("promotion is forward-only, SHA-tagged, config-preserving, rollback-capable, and post-verified", () => {
  assert.match(release, /git merge-base --is-ancestor "\$current_sha" "\$WEB_SHA"/);
  assert.match(release, /versions deploy "\$\{candidate_id\}@100%"/);
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
  assert.match(release, /retroactive production authorization is forbidden/);
  assert.doesNotMatch(release, /PASS_ALREADY_ACTIVE/);
});

test("Web hard-kill recovery is durable and terminal ingress proves immutable static assets", () => {
  const watchdog = readFileSync(".github/workflows/production-release-recovery-watchdog.yml", "utf8");
  const recovery = readFileSync("scripts/recover-worker-promotion.sh", "utf8");
  const armedAt = release.indexOf("PINO_WEB_PRODUCTION_RELEASE: **RECOVERY_ARMED**");
  const deployAt = release.indexOf('versions deploy "${candidate_id}@100%"');
  assert.ok(armedAt > 0 && deployAt > armedAt);
  assert.match(watchdog, /workflow_run:/);
  assert.match(watchdog, /Web Production Release/);
  assert.match(watchdog, /recover-worker-promotion\.sh/);
  assert.match(watchdog, /WATCHDOG_RECOVERED/);
  assert.match(watchdog, /assert-no-core-verification-in-flight\.sh/);
  assert.match(watchdog, /overlap_clear/);
  assert.match(recovery, /current_marker/);
  assert.match(recovery, /previous_deployment/);
  assert.match(recovery, /REFUSE_OWNERSHIP/);
  assert.ok(release.includes("pinohouse.art/_next/static/*"));
  assert.ok(release.includes("www.pinohouse.art/_next/static/*"));
  assert.match(release, /exposed no immutable Next static asset reference/);
  assert.match(release, /immutable Next static asset routes: PASS/);
});

test("Web release rebuilds and uploads the exact approved source under the trusted release recipe", () => {
  assert.match(release, /latest_build_check/);
  assert.match(release, /external_id/);
  assert.match(release, /bun install --frozen-lockfile/);
  assert.match(release, /bun run build/);
  assert.match(release, /wrangler@4\.126\.0 versions upload -c wrangler\.toml/);
  assert.match(release, /pino-web-trusted-\$\{WEB_SHA\}/);
  assert.match(release, /PINO trusted Web release/);
  assert.match(release, /External Web build UUID \(signal only\)/);
  assert.match(release, /Candidate: trusted exact-source release-job upload/);
  assert.doesNotMatch(release, /Candidate Worker version is not immutably joined to the authorized Cloudflare build UUID/);
  assert.match(release, /builds\/workers\/\$\{worker_tag\}\/triggers/);
  assert.match(release, /canonical non-serving candidate command/);
  assert.match(release, /retroactive production authorization is forbidden/);
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


test("production worker fails closed for legacy booking/member mutation authorities", () => {
  const worker = readFileSync(new URL("../worker-entry.ts", import.meta.url), "utf8");
  assert.match(worker, /ENVIRONMENT === "production"/);
  assert.match(worker, /LEGACY_MUTATION_DISABLED/);
  assert.match(worker, /isLegacyProductionAuthority\(url\.pathname\)/);
  for (const path of ["/api/open-studio/book", "/api/open-studio/eligibility", "/api/open-studio/interest", "/api/open-studio/hold-request", "/api/passes/issue"]) assert.ok(worker.includes(`"${path}"`), `missing production legacy-authority fence for ${path}`);
  assert.match(worker, /pathname\.startsWith\("\/api\/member"\)/);
});


test("H6 Web release recovery binds run attempt and workflow run-name stays YAML-safe", () => {
  const watchdog = readFileSync(new URL("../.github/workflows/production-release-recovery-watchdog.yml", import.meta.url), "utf8");
  const unresolved = readFileSync(new URL("../scripts/assert-no-unresolved-recovery.sh", import.meta.url), "utf8");
  assert.match(watchdog, /CORE_RELEASE_GH_TOKEN: \$\{\{ secrets\.PINO_CORE_RELEASE_READ_TOKEN \}\}/);
  assert.match(watchdog, /run_attempt/); assert.match(watchdog, /Workflow attempt:/); assert.match(unresolved, /run_attempt/);
  for (const name of readdirSync(new URL("../.github/workflows/", import.meta.url)).filter((v:string)=>v.endsWith(".yml"))) assert.doesNotMatch(readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url),"utf8"), /^run-name:\s+\$\{\{/m);
});

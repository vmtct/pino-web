import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { resolveWebProductionCandidate } from "../scripts/web-production-candidate-check.ts";
import { assertApprovedProductionWranglerDiff } from "../scripts/web-production-config-diff-check.ts";
import { validateServingRebindProof } from "../scripts/web-production-serving-rebind.ts";

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

const candidateWebSha = "a".repeat(40);
const candidateAccount = "9".repeat(32);
const candidateBuildUuid = "11111111-1111-4111-8111-111111111111";
const candidateVersion = "22222222-2222-4222-8222-222222222222";
const candidatePreview = "https://22222222-pino-web.minhtri-van42.workers.dev";

function cloudflareCheck(overrides: Record<string, any> = {}) {
  const base = {
    id: 100,
    name: "Workers Builds: pino-web",
    head_sha: candidateWebSha,
    status: "completed",
    conclusion: "success",
    started_at: "2026-09-17T10:14:57Z",
    app: { slug: "cloudflare-workers-and-pages" },
    external_id: candidateBuildUuid,
    details_url: `https://dash.cloudflare.com/${candidateAccount}/workers/services/view/pino-web/production/builds/${candidateBuildUuid}`,
    output: { summary: `Version ID: ${candidateVersion}\nPreview URL: ${candidatePreview}\n` },
  };
  return { ...base, ...overrides, output: { ...base.output, ...(overrides.output || {}) } };
}

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
  assert.match(release, /web-production-candidate-check\.ts/);
  assert.match(release, new RegExp(boundedReleaseTest.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(release, /bun run test/);
  assert.doesNotMatch(release, /workflow_dispatch:/);
  assert.doesNotMatch(release, /^\s+push:/m);
});

test("promotion is forward-only, SHA-tagged, config-preserving, rollback-capable, and post-verified", () => {
  assert.match(release, /git merge-base --is-ancestor "\$current_sha" "\$WEB_SHA"/);
  assert.match(release, /versions deploy "\$\{candidate_id\}@100%"/);
  assert.match(release, /unapproved production Wrangler config delta/);
  assert.match(release, /web-production-config-diff-check\.ts/);
  assert.match(release, /PINO_CORE_PUBLIC -> pino-core\/PublicOpenStudioControlPlane/);
  assert.match(release, /forbidden dev-Core URL binding/);
  assert.match(release, /changes production bindings outside the one approved Core service-binding cutover/);
  assert.match(release, /rollback\(\)/);
  assert.match(release, /Production identity did not converge to the approved SHA within the bounded verification window/);
  assert.match(release, /build-info\.json\?pino-release-proof=\$\{GITHUB_RUN_ID\}-\$\{GITHUB_RUN_ATTEMPT\}-preflight/);
  assert.match(release, /for identity_attempt in \$\(seq 1 12\); do/);
  assert.match(release, /pino-release-proof=\$\{candidate_deployment_id\}-\$\{identity_attempt\}/);
  assert.match(release, /sleep 5/);
  assert.match(release, /main moved during Web release verification; rollback/);
  assert.match(release, /X-PINO-Schedule-Source/);
  assert.match(release, /pinohouse\.art\/policy/);
  assert.match(release, /www\.pinohouse\.art\/term/);
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
    "CANONICAL_REBIND_NO_TRAFFIC_MUTATION", "web-production-serving-rebind.ts",
  ]) assert.ok(release.includes(token), `missing ${token}`);
  assert.ok(release.indexOf("promotion_attempted=1") < release.indexOf("WRANGLER_OUTPUT_FILE_PATH=\"$deploy_output\""));
  assert.match(release, /if \[ "\$rebind_mode" -eq 0 \]; then/);
  assert.match(release, /Serving candidate is not bound to an exact prior canonical Web PASS receipt/);
  assert.doesNotMatch(release, /retroactive production authorization is forbidden/);
  assert.doesNotMatch(release, /PASS_ALREADY_ACTIVE/);
});

const priorWebIssueBody = [
  `WEB_SHA: ${candidateWebSha}`,
  "CORE_RELEASE_ISSUE: 746",
  "CORE_RELEASE_RUN_ID: 35165095880",
  "CONFIRM: RELEASE_PRODUCTION",
].join("\n");
const priorWebIssueHash = createHash("sha256").update(priorWebIssueBody, "utf8").digest("hex");
const priorWebDeployment = "33333333-3333-4333-8333-333333333333";
const priorWebRunId = 35244398333;
const currentWebRunId = 35266012759;
const priorWebRun = {
  id: priorWebRunId,
  repository: { full_name: "vmtct/pino-web" },
  event: "issues", run_attempt: 1, status: "completed", conclusion: "success",
  actor: { login: "vmtct" }, triggering_actor: { login: "vmtct" },
  path: ".github/workflows/production-release.yml", head_sha: candidateWebSha,
  display_title: `Web production release #99 @ ${candidateWebSha}`,
};
const priorWebIssue = { number: 99, user: { login: "vmtct" }, title: "[GPT] Web production release", body: priorWebIssueBody };
function priorWebReceipt(overrides: { runId?: number; deployment?: string; version?: string; hash?: string } = {}) {
  const runId = overrides.runId ?? priorWebRunId;
  const deployment = overrides.deployment ?? priorWebDeployment;
  const version = overrides.version ?? candidateVersion;
  const hash = overrides.hash ?? priorWebIssueHash;
  return {
    id: 1, created_at: "2026-09-17T16:10:00Z", user: { login: "github-actions[bot]" },
    body: [
      "WEB_PRODUCTION_RELEASE: **PASS**", "",
      `- Web source: ${candidateWebSha}`, `- Workflow run: ${runId}`,
      "- Workflow attempt: 1", `- Authorization body hash: ${hash}`,
      `- Canonical Cloudflare candidate version: ${version}`,
      `- Worker version: ${version}`, `- Deployment ID: ${deployment}`,
      "- Traffic: 100%",
    ].join("\n"),
  };
}
function validRebindInput() {
  return {
    webSha: candidateWebSha, candidateVersion, activeVersion: candidateVersion,
    activeDeploymentId: priorWebDeployment, currentRunId: currentWebRunId,
    priorRun: priorWebRun, priorIssue: priorWebIssue, priorComments: [priorWebReceipt()],
  };
}

test("already-serving Web candidate rebind requires exact prior canonical release proof", () => {
  assert.deepEqual(validateServingRebindProof(validRebindInput()), {
    priorIssueNumber: 99, priorRunId: priorWebRunId,
    priorDeploymentId: priorWebDeployment, priorAuthorizationHash: priorWebIssueHash,
  });
  assert.throws(() => validateServingRebindProof({ ...validRebindInput(), activeDeploymentId: "44444444-4444-4444-8444-444444444444" }), /RECEIPT_DEPLOYMENT_MISMATCH/);
  assert.throws(() => validateServingRebindProof({ ...validRebindInput(), activeVersion: "55555555-5555-4555-8555-555555555555" }), /ACTIVE_VERSION_NOT_CANDIDATE/);
  assert.throws(() => validateServingRebindProof({ ...validRebindInput(), priorRun: { ...priorWebRun, display_title: `Web production release #98 @ ${candidateWebSha}` } }), /INVALID_PRIOR_ISSUE/);
  assert.throws(() => validateServingRebindProof({ ...validRebindInput(), priorComments: [priorWebReceipt({ runId: priorWebRunId + 1 })] }), /RECEIPT_RUN_MISMATCH/);
  assert.throws(() => validateServingRebindProof({ ...validRebindInput(), priorComments: [priorWebReceipt({ hash: "f".repeat(64) })] }), /RECEIPT_AUTH_HASH_MISMATCH/);
});

test("already-serving Web candidate rebind fails closed on a newer non-PASS terminal receipt", () => {
  const rejected = { id: 2, created_at: "2026-09-17T16:11:00Z", user: { login: "github-actions[bot]" }, body: "WEB_PRODUCTION_RELEASE: **FAIL_SAFE**\n\nnewer terminal" };
  assert.throws(() => validateServingRebindProof({ ...validRebindInput(), priorComments: [priorWebReceipt(), rejected] }), /PRIOR_TERMINAL_NOT_PASS/);
});

test("Web hard-kill recovery is durable and terminal ingress proves immutable static assets", () => {
  const watchdog = readFileSync(".github/workflows/production-release-recovery-watchdog.yml", "utf8");
  const recovery = readFileSync("scripts/recover-worker-promotion.sh", "utf8");
  const armedAt = release.indexOf("PINO_WEB_PRODUCTION_RELEASE: **RECOVERY_ARMED**");
  const deployAt = release.indexOf('versions deploy "${candidate_id}@100%"');
  const identityPollAt = release.indexOf("for identity_attempt in $(seq 1 12); do");
  assert.ok(armedAt > 0 && deployAt > armedAt && identityPollAt > deployAt);
  assert.match(watchdog, /workflow_run:/);
  assert.match(watchdog, /Web Production Release/);
  assert.match(watchdog, /recover-worker-promotion\.sh/);
  assert.match(watchdog, /WATCHDOG_RECOVERED/);
  assert.match(watchdog, /assert-no-core-verification-in-flight\.sh/);
  assert.match(watchdog, /overlap_clear/);
  assert.match(recovery, /current_marker/);
  assert.match(recovery, /previous_deployment/);
  assert.match(recovery, /REFUSE_OWNERSHIP/);
  assert.match(release, /web-production-route-transition\.ts apply/);
  assert.match(release, /web-production-route-transition\.ts rollback/);
  assert.match(release, /https:\/\/pinohouse\.art\/policy/);
  assert.match(release, /homepage \+ legal \+ learning surfaces routed ingress: PASS/);
  assert.match(release, /exposed no immutable Next static asset reference/);
});

test("Web release consumes only a semantically validated canonical Cloudflare candidate", () => {
  assert.match(release, /node --experimental-strip-types scripts\/web-production-candidate-check\.ts/);
  assert.match(release, /WEB_CANDIDATE_VERSION/);
  assert.match(release, /WEB_CANDIDATE_PREVIEW/);
  assert.doesNotMatch(release, /candidate_version_lines|build_summary=/);
  assert.match(release, /wrangler@4\.126\.0 versions view "\$candidate_id"/);
  assert.match(release, /Canonical Cloudflare candidate tag does not bind the exact approved Web SHA/);
  assert.match(release, /candidate preview did not execute against the exact Core release version/);
  assert.match(release, /Candidate: exact immutable version from canonical Cloudflare Workers Build check/);
  assert.match(release, /Candidate preview exact-SHA\/Core smoke: PASS/);

  const normalizeShellContinuations = (source: string) => source.replace(/\\\r?\n[ \t]*/g, " ");
  const countVersionUploads = (source: string) =>
    (normalizeShellContinuations(source).match(/\bversions\s+upload\b/g) ?? []).length;
  const allowedBoundary = `[ "$expected_deploy" = 'npx wrangler versions upload --tag "$WORKERS_CI_COMMIT_SHA" --message "pino-web candidate $WORKERS_CI_COMMIT_SHA"' ] || fail "Repository build boundary does not match the canonical non-serving candidate command."`;
  const normalizedRelease = normalizeShellContinuations(release);
  assert.equal(countVersionUploads(release), 1);
  assert.ok(normalizedRelease.includes(allowedBoundary));

  const splitUploadBypass = release.replace(
    'WRANGLER_OUTPUT_FILE_PATH="$deploy_output" npx wrangler versions deploy',
    'npx wrangler versions \\\n            upload -c wrangler.toml >/dev/null\n          WRANGLER_OUTPUT_FILE_PATH="$deploy_output" npx wrangler versions deploy',
  );
  assert.equal(countVersionUploads(splitUploadBypass), 2);

  const resolverAt = release.indexOf("web-production-candidate-check.ts");
  const previewAt = release.indexOf('preview_info="$(curl -fsS');
  const armedAt = release.indexOf("PINO_WEB_PRODUCTION_RELEASE: **RECOVERY_ARMED**");
  const deployAt = release.indexOf('versions deploy "${candidate_id}@100%"');
  assert.ok(resolverAt > 0 && previewAt > resolverAt && armedAt > previewAt && deployAt > armedAt);
});

test("candidate resolver binds exact head, canonical app, build UUID, version, and preview", () => {
  const result = resolveWebProductionCandidate(
    { check_runs: [cloudflareCheck()] },
    { webSha: candidateWebSha, accountId: candidateAccount },
  );
  assert.deepEqual(result, {
    buildUuid: candidateBuildUuid,
    candidateVersion,
    previewUrl: candidatePreview,
  });
  assert.throws(() => resolveWebProductionCandidate(
    { check_runs: [cloudflareCheck({ head_sha: "b".repeat(40) })] },
    { webSha: candidateWebSha, accountId: candidateAccount },
  ), /No exact-head/);
  assert.throws(() => resolveWebProductionCandidate(
    { check_runs: [cloudflareCheck({ app: { slug: "github-actions" } })] },
    { webSha: candidateWebSha, accountId: candidateAccount },
  ), /canonical Cloudflare app/);
  assert.throws(() => resolveWebProductionCandidate(
    { check_runs: [cloudflareCheck({ details_url: "https://example.invalid/build" })] },
    { webSha: candidateWebSha, accountId: candidateAccount },
  ), /details URL/);
});

test("candidate resolver rejects duplicate or mismatched immutable summary identity", () => {
  const duplicateVersion = `Version ID: ${candidateVersion}\nVersion ID: ${candidateVersion}\nPreview URL: ${candidatePreview}\n`;
  assert.throws(() => resolveWebProductionCandidate(
    { check_runs: [cloudflareCheck({ output: { summary: duplicateVersion } })] },
    { webSha: candidateWebSha, accountId: candidateAccount },
  ), /exactly one Worker Version ID claim/);

  const malformedAndValidVersion = `  Version ID: not-a-uuid\nVersion ID: ${candidateVersion}\nPreview URL: ${candidatePreview}\n`;
  assert.throws(() => resolveWebProductionCandidate(
    { check_runs: [cloudflareCheck({ output: { summary: malformedAndValidVersion } })] },
    { webSha: candidateWebSha, accountId: candidateAccount },
  ), /exactly one Worker Version ID claim/);

  const malformedOnlyVersion = `Version ID: not-a-uuid\nPreview URL: ${candidatePreview}\n`;
  assert.throws(() => resolveWebProductionCandidate(
    { check_runs: [cloudflareCheck({ output: { summary: malformedOnlyVersion } })] },
    { webSha: candidateWebSha, accountId: candidateAccount },
  ), /malformed Worker Version ID claim/);

  const duplicatePreview = `Version ID: ${candidateVersion}\nPreview URL: ${candidatePreview}\nPreview URL: ${candidatePreview}\n`;
  assert.throws(() => resolveWebProductionCandidate(
    { check_runs: [cloudflareCheck({ output: { summary: duplicatePreview } })] },
    { webSha: candidateWebSha, accountId: candidateAccount },
  ), /exactly one expected immutable preview URL/);

  const wrongPreview = `Version ID: ${candidateVersion}\nPreview URL: https://deadbeef-pino-web.minhtri-van42.workers.dev\n`;
  assert.throws(() => resolveWebProductionCandidate(
    { check_runs: [cloudflareCheck({ output: { summary: wrongPreview } })] },
    { webSha: candidateWebSha, accountId: candidateAccount },
  ), /expected immutable preview URL/);
});

test("candidate resolver fails closed on the newest exact-head Cloudflare attempt", () => {
  const older = cloudflareCheck({ id: 99, started_at: "2026-09-17T10:14:56Z" });
  const newerFailed = cloudflareCheck({
    id: 101,
    started_at: "2026-09-17T10:14:58Z",
    conclusion: "failure",
  });
  assert.throws(() => resolveWebProductionCandidate(
    { check_runs: [older, newerFailed] },
    { webSha: candidateWebSha, accountId: candidateAccount },
  ), /not terminal success/);
});

function wranglerUnifiedDiff(path: string, changes: string[]): string {
  return [
    `diff --git a/${path} b/${path}`,
    "index 1111111..2222222 100644",
    `--- a/${path}`,
    `+++ b/${path}`,
    "@@ -1 +1 @@",
    ...changes,
  ].join("\n");
}

test("production Wrangler diff permits only exact approved cutover deltas", () => {
  const exactChanges = [
    "-keep_vars = true",
    "+keep_vars = false",
    '-PINO_CORE_BASE_URL = "https://pino-core-dev.minhtri-van42.workers.dev"',
    "-# Keep false while production pino-web reads from pino-core-dev. Change only after",
    "-# an explicitly approved production pino-core cutover.",
    "+[[services]]",
    '+binding = "PINO_CORE_PUBLIC"',
    '+service = "pino-core"',
    '+entrypoint = "PublicOpenStudioControlPlane"',
  "+",
  ];
  const routeChanges = [
    "-# Incremental production cutover: Artchitect and Little Piner are served by",
    "-# pino-web while the remaining pinohouse.art pages continue to resolve to",
    "-# Webflow. Next static assets are routed separately because exported pages",
    "-# reference /_next/*.",
    "+# Canonical public-site ownership: Webflow is retired. Route the full",
    "+# pinohouse.art surface through pino-web so homepage, legal pages, and",
    "+# all exported Next.js assets share one production authority.",
    '-  { pattern = "pinohouse.art/artchitect*", zone_name = "pinohouse.art" },',
    '-  { pattern = "www.pinohouse.art/artchitect*", zone_name = "pinohouse.art" },',
    '-  { pattern = "pinohouse.art/little-piner*", zone_name = "pinohouse.art" },',
    '-  { pattern = "www.pinohouse.art/little-piner*", zone_name = "pinohouse.art" },',
    '-  { pattern = "pinohouse.art/_next/static/*", zone_name = "pinohouse.art" },',
    '-  { pattern = "www.pinohouse.art/_next/static/*", zone_name = "pinohouse.art" }',
    '+  { pattern = "pinohouse.art/*", zone_name = "pinohouse.art" },',
    '+  { pattern = "www.pinohouse.art/*", zone_name = "pinohouse.art" }',
  ];
  const exact = wranglerUnifiedDiff("wrangler.toml", exactChanges);
  const exactRoute = wranglerUnifiedDiff("wrangler.toml", routeChanges);
  assert.doesNotThrow(() => assertApprovedProductionWranglerDiff(""));
  assert.doesNotThrow(() => assertApprovedProductionWranglerDiff(exact));
  assert.doesNotThrow(() => assertApprovedProductionWranglerDiff(exactRoute));

  const splitAcrossFiles = [
    wranglerUnifiedDiff("wrangler.toml", exactChanges.slice(0, 2)),
    wranglerUnifiedDiff("wrangler.piner.production.toml", exactChanges.slice(2)),
  ].join("\n");
  const duplicateSection = `${exact}\n${wranglerUnifiedDiff("wrangler.toml", [])}`;
  const renamedHeader = exact.replace(
    "diff --git a/wrangler.toml b/wrangler.toml",
    "diff --git a/wrangler.toml b/wrangler.piner.production.toml",
  );

  for (const invalid of [
    wranglerUnifiedDiff("wrangler.toml", ["-keep_vars = false", "+keep_vars = true"]),
    wranglerUnifiedDiff("wrangler.toml", ["+keep_vars = false"]),
    wranglerUnifiedDiff("wrangler.toml", [...exactChanges, '+compatibility_date = "2099-01-01"']),
    wranglerUnifiedDiff("wrangler.toml", [...routeChanges, '+compatibility_date = "2099-01-01"']),
    wranglerUnifiedDiff("wrangler.piner.production.toml", exactChanges),
    splitAcrossFiles,
    duplicateSection,
    renamedHeader,
    wranglerUnifiedDiff("wrangler.toml", exactChanges.map((line) =>
      line === '+binding = "PINO_CORE_PUBLIC"' ? '-binding = "PINO_CORE_PUBLIC"' : line)),
    wranglerUnifiedDiff("wrangler.toml", exactChanges.flatMap((line) =>
      line === '+binding = "PINO_CORE_PUBLIC"' ? [line, line] : [line])),
  ]) {
    assert.throws(() => assertApprovedProductionWranglerDiff(invalid), /unapproved production Wrangler config delta/);
  }
});

test("production Web source no longer points Open Studio at dev Core", () => {
  const wrangler = readFileSync("wrangler.toml", "utf8");
  const adapter = readFileSync("lib/pino-core-public-adapter.ts", "utf8");
  assert.doesNotMatch(wrangler, /pino-core-dev|PINO_CORE_BASE_URL/);
  assert.match(wrangler, /^keep_vars = false$/m);
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

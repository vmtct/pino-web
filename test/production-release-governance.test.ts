import assert from "node:assert/strict";
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
  assert.match(release, /git diff --quiet "\$current_sha" "\$WEB_SHA" -- wrangler\.toml wrangler\.piner\.production\.toml/);
  assert.match(release, /Candidate changes production bindings\/vars/);
  assert.match(release, /rollback\(\)/);
  assert.match(release, /Production identity does not match the approved SHA/);
  assert.match(release, /main moved during promotion; rollback/);
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
    "PENDING_CLOUDFLARE_BUILDS_CONFIG_EDIT",
  );
});

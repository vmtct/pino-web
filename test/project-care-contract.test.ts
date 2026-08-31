import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const agents = readFileSync("AGENTS.md", "utf8");
const ci = readFileSync(".github/workflows/ci.yml", "utf8");
const careWrapper = readFileSync("scripts/delivery-care.mjs", "utf8");
const verifier = "scripts/verify-pr-project-code.mjs";

test("web exposes Core-owned PLT-CARE coordination", () => {
  assert.equal(pkg.scripts["delivery:care"], "node scripts/delivery-care.mjs");
  assert.equal(pkg.scripts["delivery:claim"], "node scripts/delivery-care.mjs claim");
  assert.match(careWrapper, /slice-care\.mjs/);
  assert.match(careWrapper, /PINO_CORE_PATH/);
  assert.match(agents, /Cross-Project slice care/);
  assert.match(agents, /Fresh foreign care blocks duplicate material edits/);
});

test("web care wrapper fails closed without Core", () => {
  const env = { ...process.env };
  delete env.PINO_CORE_PATH;
  const result = spawnSync(process.execPath, ["scripts/delivery-care.mjs", "status", "--feature", "PLT-CARE"], { encoding: "utf8", env });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /set PINO_CORE_PATH or pass --core/);
});

function verify(body: string, createdAt: string) {
  return spawnSync(process.execPath, [verifier], {
    encoding: "utf8",
    env: { ...process.env, PINO_PR_BODY: body, PINO_PR_CREATED_AT: createdAt },
  });
}

test("web CI enforces Project-Code metadata without replacing PLT-RELEASE candidate flow", () => {
  assert.match(ci, /Verify Project-Code metadata/);
  assert.match(ci, /scripts\/verify-pr-project-code\.mjs/);
  assert.match(ci, /candidate:/);
  assert.match(ci, /Production traffic: not authorized by this workflow/);
});

test("web PR metadata requires Project-Code after care cutover", () => {
  const missing = verify(
    "Feature-Code: TPP-ENR\nFeature-Id: toppi-enrollment-management\nFeature-Domain: TOPPI\nEntry-Class: EXISTING_GOVERNED_FEATURE\n",
    "2026-08-31T02:16:00Z",
  );
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /requires Project-Code/);

  const valid = verify(
    "Feature-Code: TPP-ENR\nFeature-Id: toppi-enrollment-management\nFeature-Domain: TOPPI\nProject-Code: PRJ-TPP\nEntry-Class: EXISTING_GOVERNED_FEATURE\n",
    "2026-08-31T02:16:00Z",
  );
  assert.equal(valid.status, 0, valid.stderr);
});

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const agents = readFileSync("AGENTS.md", "utf8");
const ci = readFileSync(".github/workflows/ci.yml", "utf8");
const careWrapper = readFileSync("scripts/delivery-care.mjs", "utf8");
const template = readFileSync(".github/pull_request_template.md", "utf8");

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

test("web CI retires Project-Code gate without changing release validation", () => {
  assert.doesNotMatch(ci, /Verify Project-Code metadata|verify-pr-project-code/);
  assert.doesNotMatch(template, /Project-Code:/);
  assert.match(ci, /run: bun run typecheck/);
  assert.match(ci, /run: bun run build/);
  assert.match(ci, /Production release boundary contract tests/);
  assert.match(ci, /failure-intake:/);
});

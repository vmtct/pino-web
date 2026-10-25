import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const agents = readFileSync("AGENTS.md", "utf8");
const ci = readFileSync(".github/workflows/ci.yml", "utf8");
const template = readFileSync(".github/pull_request_template.md", "utf8");

test("Web follows Jira authority instead of historical PLT-CARE claims", () => {
  assert.match(agents, /Jira Job and applicable Directives/);
  assert.match(agents, /read-only compatibility fact inspectors/);
  assert.match(agents, /Do not claim, heartbeat, reclaim, transfer, release or require historical PLT-CARE leases/);
  assert.doesNotMatch(agents, /Before material edits run|Fresh foreign care blocks duplicate material edits|Unclaimed work requires a claim/);
  for (const key of ["delivery:care","delivery:claim","delivery:heartbeat","delivery:release","delivery:care:list"]) {
    assert.equal(pkg.scripts[key], undefined);
  }
  assert.equal(existsSync("scripts/delivery-care.mjs"), false);
});

test("Web CI retires Project-Code gate without changing release validation", () => {
  assert.doesNotMatch(ci, /Verify Project-Code metadata|verify-pr-project-code/);
  assert.doesNotMatch(template, /Project-Code:/);
  assert.match(ci, /run: bun run typecheck/);
  assert.match(ci, /run: bun run build/);
  assert.match(ci, /Production release boundary contract tests/);
  assert.match(ci, /failure-intake:/);
});

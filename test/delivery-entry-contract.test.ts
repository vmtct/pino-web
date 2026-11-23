import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const agents = readFileSync("AGENTS.md", "utf8");
const wrapper = readFileSync("scripts/delivery-entry.mjs", "utf8");

test("web exposes the Core-owned Drift Protocol entry wrapper", () => {
  assert.equal(pkg.scripts["pino:resume"], "node scripts/delivery-entry.mjs");
  assert.equal(pkg.scripts["delivery:enter"], "node scripts/delivery-entry.mjs");
  assert.match(wrapper, /PINO_CORE_PATH/);
  assert.match(wrapper, /--worktree/);
});

test("web working contract defines current Jira-owned continuation behavior", () => {
  assert.match(agents, /optional pino:resume and delivery:enter scripts are read-only compatibility fact inspectors/i);
  assert.match(agents, /live Jira Job and applicable Directives/i);
  assert.match(agents, /conversation history is non-authoritative/i);
});

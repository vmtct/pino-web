import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("Piner Open Studio retirement guard passes current source", () => {
  const result = spawnSync(process.execPath, ["scripts/assert-piner-open-studio-retired.mjs"], { encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /PINER_OPEN_STUDIO_RETIREMENT_GUARD: PASS/);
});

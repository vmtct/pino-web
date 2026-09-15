import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const r=(p:string)=>readFileSync(p,"utf8");
const flow=r(".github/workflows/piner-production-release.yml");
const watch=r(".github/workflows/piner-production-release-recovery-watchdog.yml");
const unresolved=r("scripts/assert-no-unresolved-recovery.sh");
const coreAuthority=r("scripts/assert-core-provider-authority.sh");

test("H7 Piner production promotion is Founder-deferred from the current release",()=>{
  assert.match(flow,/Founder scope decision 2026-09-15/);
  assert.match(flow,/if: \$\{\{ false \}\}/);
  assert.doesNotMatch(flow,/TOPPI_RELEASE_GH_TOKEN/);
  assert.doesNotMatch(flow,/assert-toppi-provider-authority\.sh/);
});

test("H7 Core provider same-SHA jq filter is executable",()=>{
  const match=coreAuthority.match(/latest="\$\(jq -r --arg sha "\$sha" '([^']+)' <<<"\$runs"\)"/);
  const filter=match?.[1] ?? "";
  assert.ok(filter,"latest same-SHA jq filter missing");
  const result=spawnSync("jq",["-n","--arg","sha","a".repeat(40),filter],{encoding:"utf8"});
  assert.equal(result.status,0,result.stderr || result.stdout);
});

test("H7 R005 Piner hard-kill recovery is durable and cross-fenced",()=>{
  for(const token of ["Piner Production Release","run_attempt","Workflow attempt:","PINO_PINER_PRODUCTION_RELEASE: **RECOVERY_ARMED**","recover-worker-promotion.sh 'piner'","WATCHDOG_RECOVERED"]) assert.ok(watch.includes(token),token);
  assert.match(watch, /CORE_RELEASE_GH_TOKEN: \$\{\{ secrets\.PINO_CORE_RELEASE_READ_TOKEN \}\}/);
  assert.match(watch,/group: web-production-release-recovery/);
  assert.match(unresolved,/piner-production-release\.yml/);
  assert.match(unresolved,/PINO_PINER_PRODUCTION_RELEASE/);
  assert.match(unresolved,/PINER_PRODUCTION_RELEASE/);
});

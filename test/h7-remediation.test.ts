import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const r=(p:string)=>readFileSync(p,"utf8");
const flow=r(".github/workflows/piner-production-release.yml");
const watch=r(".github/workflows/piner-production-release-recovery-watchdog.yml");
const unresolved=r("scripts/assert-no-unresolved-recovery.sh");

test("H7 R005 Piner has governed exact-head promotion authority",()=>{
  for(const token of ["WEB_SHA","RELEASE_PINER_PRODUCTION","merged-PR provenance","Newest same-SHA Web CI","WORKERS_CI_COMMIT_SHA=\"$WEB_SHA\"","wrangler.piner.production.toml","piner-trusted-${WEB_SHA}","PINO_MEMBER_CORE","ParentMemberControlPlane","TOPPI_MEMBER","PINO_PINER_PRODUCTION_RELEASE: **RECOVERY_ARMED**","piner.pinohouse.art/build-info.json","PINER_PRODUCTION_RELEASE: **PASS**"]) assert.ok(flow.includes(token),token);
  assert.match(flow,/group: web-production-release/);
  assert.match(flow,/retroactive authorization is forbidden/);
});

test("H7 R005 Piner hard-kill recovery is durable and cross-fenced",()=>{
  for(const token of ["Piner Production Release","run_attempt","Workflow attempt:","PINO_PINER_PRODUCTION_RELEASE: **RECOVERY_ARMED**","recover-worker-promotion.sh 'piner'","WATCHDOG_RECOVERED"]) assert.ok(watch.includes(token),token);
  assert.match(watch, /CORE_RELEASE_GH_TOKEN: \$\{\{ secrets\.PINO_CORE_RELEASE_READ_TOKEN \}\}/);
  assert.match(watch,/group: web-production-release-recovery/);
  assert.match(unresolved,/piner-production-release\.yml/);
  assert.match(unresolved,/PINO_PINER_PRODUCTION_RELEASE/);
  assert.match(unresolved,/PINER_PRODUCTION_RELEASE/);
});

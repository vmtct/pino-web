import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const r=(p:string)=>readFileSync(p,"utf8");
const flow=r(".github/workflows/piner-production-release.yml");
const watch=r(".github/workflows/piner-production-release-recovery-watchdog.yml");
const unresolved=r("scripts/assert-no-unresolved-recovery.sh");
const coreAuthority=r("scripts/assert-core-provider-authority.sh");
const toppiAuthority=r("scripts/assert-toppi-provider-authority.sh");

test("H7 R005 Piner has governed exact-head promotion authority",()=>{
  for(const token of ["WEB_SHA","RELEASE_PINER_PRODUCTION","CORE_RELEASE_ISSUE","CORE_RELEASE_RUN_ID","TOPPI_SHA","TOPPI_DEPLOY_RUN_ID","TOPPI_DEPLOY_RUN_ATTEMPT","assert-core-provider-authority.sh","assert-toppi-provider-authority.sh","CORE_DEPLOYMENT_ID","CORE_VERSION","merged-PR provenance","Newest same-SHA Web CI","WORKERS_CI_COMMIT_SHA=\"$WEB_SHA\"","wrangler.piner.production.toml","piner-trusted-${WEB_SHA}","PINO_MEMBER_CORE","ParentMemberControlPlane","TOPPI_MEMBER","PINO_PINER_PRODUCTION_RELEASE: **RECOVERY_ARMED**","piner.pinohouse.art/build-info.json","PINER_PRODUCTION_RELEASE: **PASS**"]) assert.ok(flow.includes(token),token);
  assert.match(flow,/group: web-production-release/);
  assert.match(flow,/retroactive authorization is forbidden/);
  assert.ok(coreAuthority.includes(String.raw`gsub("\\\\n"; "\n")`));
  assert.ok((flow.match(/assert-core-provider-authority\.sh/g) ?? []).length >= 2);
  assert.ok((flow.match(/assert-toppi-provider-authority\.sh/g) ?? []).length >= 3);
  for(const token of ["vmtct/toppi",".github/workflows/deploy.yml","Deploy toppi-web","Production smoke test","build-info.json"]) assert.ok(toppiAuthority.includes(token),token);
  assert.match(flow,/workers\/scripts\/pino-core\/deployments/);
  assert.match(flow,/workers\/scripts\/toppi-web\/deployments/);
  assert.match(flow,/api\/piner\/students\/probe\/toppi/);
  assert.match(flow,/Toppi provider changed during Piner release/);
  assert.match(flow,/Core provider deployment no longer matches selected Core release/);
  assert.match(flow,/Core provider changed during Piner release/);
  assert.match(flow,/api\/piner\/session/);
  assert.match(flow,/__Host-piner_session/);
  assert.match(flow,/PARENT_AUTH_SESSION_INVALID/);
  const deployAt=flow.indexOf('versions deploy "${candidate_id}@100%"');
  const memberSmokeAt=flow.indexOf('PARENT_AUTH_SESSION_INVALID');
  const finalCoreAt=flow.indexOf('assert-core-provider-authority.sh "$CORE_RELEASE_ISSUE"');
  assert.ok(deployAt>0 && memberSmokeAt>deployAt && finalCoreAt>memberSmokeAt);
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

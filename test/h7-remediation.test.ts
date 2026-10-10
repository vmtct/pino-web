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
  assert.match(flow,/for convergence_attempt in 1 2 3 4 5; do/);
  assert.match(flow,/final_deployment_converged=1/);
  assert.match(flow,/Piner deployment did not converge to exact run-owned identity before PASS/);
  const convergenceAt=flow.indexOf('for convergence_attempt in 1 2 3 4 5; do');
  const finalAuthorityAt=flow.indexOf('assert-live-issue-authority.sh "$repo" "$ISSUE_NUMBER"',convergenceAt);
  assert.ok(convergenceAt>memberSmokeAt && finalAuthorityAt>convergenceAt);
  assert.match(flow,/terminal_main=/);
  assert.match(flow,/terminal_piner=/);
  assert.match(flow,/main moved after Piner convergence\/provider verification; rollback required/);
  assert.match(flow,/Piner deployment changed after provider verification/);
  const finalToppiAt=flow.indexOf('Toppi provider changed during Piner release.', convergenceAt);
  const terminalMainAt=flow.indexOf('terminal_main=', finalToppiAt);
  const terminalPinerAt=flow.indexOf('terminal_piner=', terminalMainAt);
  const releaseDisarmAt=flow.indexOf('promotion_attempted=0', terminalPinerAt);
  assert.ok(finalToppiAt>finalAuthorityAt && terminalMainAt>finalToppiAt && terminalPinerAt>terminalMainAt && releaseDisarmAt>terminalPinerAt);
});

test("H7 Core provider same-SHA jq filter is executable",()=>{
  const match=coreAuthority.match(/latest="\$\(jq -r --arg sha "\$sha" '([^']+)' <<<"\$runs"\)"/);
  const filter=match?.[1] ?? "";
  assert.ok(filter,"latest same-SHA jq filter missing");
  const result=spawnSync("jq",["-n","--arg","sha","a".repeat(40),filter],{encoding:"utf8"});
  assert.equal(result.status,0,result.stderr || result.stdout);
});

test("H7 Core provider authority ignores skipped unrelated issue runs but preserves real newer attempts",()=>{
  const match=coreAuthority.match(/latest="\$\(jq -r --arg sha "\$sha" '([^']+)' <<<"\$runs"\)"/);
  const filter=match?.[1] ?? "";
  const sha="a".repeat(40);
  const base={head_sha:sha,event:"issues",actor:{login:"vmtct"}};
  const oldPass={...base,id:100,display_title:`Core production release #746 @ ${sha}`,status:"completed",conclusion:"success",updated_at:"2026-09-17T00:17:26Z"};
  const skippedCare={...base,id:101,display_title:`Core production release #747 @ ${sha}`,status:"completed",conclusion:"skipped",updated_at:"2026-09-17T10:33:40Z"};
  const failedRelease={...base,id:102,display_title:`Core production release #748 @ ${sha}`,status:"completed",conclusion:"failure",updated_at:"2026-09-17T11:00:00Z"};
  const evaluate=(workflow_runs:Record<string,unknown>[])=>spawnSync("jq",["-r","--arg","sha",sha,filter],{encoding:"utf8",input:JSON.stringify([{workflow_runs}])});
  const skipped=evaluate([oldPass,skippedCare]);
  assert.equal(skipped.status,0,skipped.stderr || skipped.stdout);
  assert.equal(skipped.stdout.trim(),"100");
  const failed=evaluate([oldPass,skippedCare,failedRelease]);
  assert.equal(failed.status,0,failed.stderr || failed.stdout);
  assert.equal(failed.stdout.trim(),"102");
});

test("H7 R005 Piner hard-kill recovery is durable and cross-fenced",()=>{
  for(const token of ["Piner Production Release","run_attempt","Workflow attempt:","PINO_PINER_PRODUCTION_RELEASE: **RECOVERY_ARMED**","recover-worker-promotion.sh 'piner'","WATCHDOG_RECOVERED"]) assert.ok(watch.includes(token),token);
  assert.match(watch, /CORE_RELEASE_GH_TOKEN: \$\{\{ secrets\.PINO_CORE_RELEASE_READ_TOKEN \}\}/);
  assert.match(watch,/group: web-production-release-recovery/);
  assert.match(unresolved,/piner-production-release\.yml/);
  assert.match(unresolved,/PINO_PINER_PRODUCTION_RELEASE/);
  assert.match(unresolved,/PINER_PRODUCTION_RELEASE/);
});

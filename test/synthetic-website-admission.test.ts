import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createWebsiteQaAdmission, parseWebsiteQaMapperPolicy, websiteQaStagingOrigin, type WebsiteQaAdmissionConfig } from "../lib/synthetic-website-admission.ts";

const qaPath = "/api/qa/website-registration-interest";
const capability = "fake-staging-test-capability-".repeat(2);
const body = {surface:"MYTIME",name:"Synthetic QA",phone:"0900000001",accepted:true,consentVersion:"qa-v1",program:"piano",interest:"qa-piano"};
const policy = {consentVersion:"qa-v1",favoriteRefs:{acrylic:["qa-art"],piano:["qa-piano"]}};

function setup(){
  const sent: Array<{request:Request;capability:string}> = [];
  let operatorCalls = 0;
  const env: WebsiteQaAdmissionConfig = {
    ENVIRONMENT:"staging",WEBSITE_SYNTHETIC_ENABLED:"true",WEBSITE_SYNTHETIC_WEB_POLICY_JSON:JSON.stringify(policy),
    WEBSITE_SYNTHETIC_CAPABILITY:capability,
    PINO_WEBSITE_SYNTHETIC_CORE:{async executePrivate(request,capability){
      sent.push({request,capability});
      return Response.json({data:{status:"SUBMITTED",nextStep:"MANUAL_CONTACT",id:"never-forward"}},{status:201});
    }},
  };
  const verify = async () => {operatorCalls++; return true;};
  const requests = (url = websiteQaStagingOrigin + qaPath, origin = websiteQaStagingOrigin, extra = {}) =>
    new Request(url,{method:"POST",headers:{origin,"content-type":"application/json","idempotency-key":"synthetic-admission-key-01",...extra},body:JSON.stringify(body)});
  return {env,sent,verify,requests,operatorCalls:()=>operatorCalls};
}

test("PAP-2424 admission default-OFF and missing bindings fail without operator or Core call",async()=>{
  const s=setup();
  for (const override of [
    {ENVIRONMENT:"production"},{ENVIRONMENT:"preview"},{ENVIRONMENT:undefined},
    {WEBSITE_SYNTHETIC_ENABLED:"false"},{WEBSITE_SYNTHETIC_ENABLED:undefined},{WEBSITE_SYNTHETIC_ENABLED:true},
    {WEBSITE_SYNTHETIC_ENABLED:"TRUE"},{WEBSITE_SYNTHETIC_CAPABILITY:undefined},{WEBSITE_SYNTHETIC_CAPABILITY:"short"},
    {PINO_WEBSITE_SYNTHETIC_CORE:undefined},{WEBSITE_SYNTHETIC_WEB_POLICY_JSON:undefined},
  ]) assert.equal((await createWebsiteQaAdmission({...s.env,...override},s.verify)(s.requests())).status,404);
  assert.equal((await createWebsiteQaAdmission(s.env)(s.requests())).status,404);
  assert.equal(s.operatorCalls(),0);
  assert.equal(s.sent.length,0);
});

test("PAP-2424 exact Staging host/path and same-origin POST with no aliases or browser trust headers",async()=>{
  const s=setup(),handle=createWebsiteQaAdmission(s.env,s.verify);
  for (const url of ["https://pinohouse.art"+qaPath, "https://www.pinohouse.art"+qaPath, "http://pino-web-staging.minhtri-van42.workers.dev"+qaPath,
    websiteQaStagingOrigin+qaPath+"/",websiteQaStagingOrigin+qaPath+"?center=any",websiteQaStagingOrigin+qaPath+"#other",
    websiteQaStagingOrigin+"/api/registration-preview-disabled"]) {
    assert.equal((await handle(s.requests(url))).status,404);
  }
  assert.equal((await handle(s.requests(undefined,"https://wrong.invalid"))).status,403);
  assert.equal((await handle(new Request(websiteQaStagingOrigin+qaPath,{method:"OPTIONS",headers:{origin:websiteQaStagingOrigin}}))).status,405);
  assert.equal(s.operatorCalls(),0);
  const forged = s.requests(undefined,undefined,{"cf-access-authenticated-user-email":"forged@example.invalid","authorization":"Bearer "+capability});
  assert.equal((await createWebsiteQaAdmission(s.env,async()=>false)(forged)).status,401);
  assert.equal((await createWebsiteQaAdmission(s.env,async()=>{throw Error("private error");})(s.requests())).status,503);
  assert.equal(s.sent.length,0);
});

test("PAP-2424 accepted fixture reaches only named private Core call and gets no credentials or IDs back",async()=>{
  const s=setup(),response=await createWebsiteQaAdmission(s.env,s.verify)(s.requests(undefined,undefined,{
    "authorization":"Bearer synthetic-operator-input","cookie":"not-for-core=1","x-private-fixture":"not-for-core",
  }));
  assert.equal(response.status,201);
  assert.equal(response.headers.get("cache-control"),"no-store");
  assert.equal(response.headers.has("access-control-allow-origin"),false);
  assert.equal(s.operatorCalls(),1);
  assert.equal(s.sent.length,1);
  const {request,capability:passed} = s.sent[0];
  assert.equal(request.url,"https://core.internal/private/website/registration-interest");
  assert.equal(request.method,"POST");
  assert.equal(passed,capability);
  assert.equal(request.headers.get("idempotency-key"),"synthetic-admission-key-01");
  assert.equal(request.headers.has("authorization"),false);
  assert.equal(request.headers.has("cookie"),false);
  assert.equal(request.headers.has("x-private-fixture"),false);
  assert.deepEqual(await response.json(),{data:{status:"SUBMITTED",nextStep:"MANUAL_CONTACT"}});
});

test("PAP-2424 mapper policy is bounded and rejects Core-only contact/rate configuration",()=>{
  assert.deepEqual(parseWebsiteQaMapperPolicy(JSON.stringify(policy)),{consentVersion:"qa-v1",favoriteRefs:{acrylic:new Set(["qa-art"]),piano:new Set(["qa-piano"])}});
  for(const invalid of [
    {...policy,contacts:[]},{...policy,rateKey:"qa"},{...policy,consentVersion:" qa-v1 "},
    {...policy,favoriteRefs:{acrylic:["qa","qa"],piano:[]}},{...policy,favoriteRefs:{acrylic:["x".repeat(161)],piano:[]}},
    {...policy,favoriteRefs:{acrylic:[],piano:[],advice:[]}},{...policy,favoriteRefs:{acrylic:["bad\nref"],piano:[]}},
    {...policy,favoriteRefs:{acrylic:Array.from({length:21},(_,i)=>String(i)),piano:[]}},
  ]) assert.equal(parseWebsiteQaMapperPolicy(JSON.stringify(invalid)),undefined);
  for(const invalid of ["","{"," ".repeat(8193),null,{}]) assert.equal(parseWebsiteQaMapperPolicy(invalid),undefined);
});

test("PAP-2424 public and preview entries remain unmounted even with the admission helper present",()=>{
  const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
  for(const path of ["worker-entry.ts","worker.ts","worker-member.ts","worker-member-v2.ts","worker-piner.ts","wrangler.toml","wrangler.piner-preview.toml","wrangler.piner.production.toml"]){
    assert.doesNotMatch(read(path),/synthetic-website-admission|createWebsiteQaAdmission|executeSyntheticWebsiteBff|WEBSITE_SYNTHETIC_(ENABLED|CAPABILITY|WEB_POLICY_JSON)|PINO_WEBSITE_SYNTHETIC_CORE/);
  }
  for(const path of ["app/registration-interest.tsx","app/mytime/v3.tsx"]){
    const source=read(path);
    assert.match(source,/action="\/api\/registration-preview-disabled"/);
    assert.doesNotMatch(source,/api\/qa\/website-registration-interest|WEBSITE_SYNTHETIC_CAPABILITY/);
  }
  assert.match(read("wrangler.staging.toml"),/WEBSITE_SYNTHETIC_ENABLED = "false"/);
});

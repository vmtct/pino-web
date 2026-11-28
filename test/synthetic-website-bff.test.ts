import { test } from "node:test";
import assert from "node:assert/strict";
import { executeSyntheticWebsiteBff, type SyntheticWebsiteBff } from "../lib/synthetic-website-bff.ts";
const origin="https://fixture.invalid";
const key="synthetic-idempotency-key-01";
const capability="qa-test-capability-".repeat(3);
const base={surface:"AFTERSCHOOL",name:"Synthetic QA",phone:"0900000001",accepted:true,consentVersion:"qa-v1",branch:"little-piner",plan:"36"};
function setup(){
  const calls: Array<{request:Request;capability:string}>=[];
  const config:SyntheticWebsiteBff={environment:"staging",enabled:true,expectedOrigin:origin,authorizeSynthetic:()=>Promise.resolve(true),serviceCapability:capability,
    policy:{consentVersion:"qa-v1",favoriteRefs:{acrylic:new Set(["qa-art"]),piano:new Set(["qa-piano"])}},
    core:{executePrivate:(request,capability)=>{calls.push({request,capability});return Promise.resolve(Response.json({data:{status:"SUBMITTED",nextStep:"MANUAL_CONTACT",leadId:"not-for-browser"}},{status:201}));}},
  };
  const req=(body:unknown=base,from=origin,url=origin+"/api/qa/website-registration-interest",type="application/json",id=key)=>new Request(url,{method:"POST",headers:{origin:from,"content-type":type,"idempotency-key":id},body:JSON.stringify(body)});
  return {config,calls,req};
}
test("PAP-2159 maps approved synthetic same-origin request through private RPC, strips receipt IDs",async()=>{
  const s=setup();
  const response=await executeSyntheticWebsiteBff(s.req(),s.config);
  assert.equal(response.status,201);
  assert.equal(response.headers.get("cache-control"),"no-store");
  assert.deepEqual(await response.json(),{data:{status:"SUBMITTED",nextStep:"MANUAL_CONTACT"}});
  assert.equal(s.calls.length,1);
  assert.equal(s.calls[0].capability,capability);
  assert.equal(s.calls[0].request.headers.get("idempotency-key"),key);
  assert.equal(s.calls[0].request.headers.has("authorization"),false);
  assert.deepEqual(await s.calls[0].request.json(),{phone:base.phone,contactName:base.name,interest:{program:"AFTERSCHOOL",path:"little-piner",planSessions:36},consent:{accepted:true,version:"qa-v1"}});
});
test("PAP-1680 maps only selected catalog favorite and rejects stale or foreign fields",async()=>{
  const s=setup();
  const my={surface:"MYTIME",name:base.name,phone:base.phone,accepted:true,consentVersion:"qa-v1",program:"piano",interest:"qa-piano"};
  assert.equal((await executeSyntheticWebsiteBff(s.req(my),s.config)).status,201);
  assert.deepEqual((await s.calls[0].request.json()).interest,{program:"MYTIME",activity:"piano",favoriteRef:"qa-piano"});
  for(const body of [{...my,interest:"qa-art"},{...my,consentVersion:"old"},{...my,centerId:"forged"},{...my,accepted:false},{...my,name:"x".repeat(9000)}]) assert.equal((await executeSyntheticWebsiteBff(s.req(body),s.config)).status,400);
  assert.equal(s.calls.length,1);
});
test("PAP-2424 denies unauthorized, production, origin, missing binding and unexpected receipt",async()=>{
  const s=setup();
  assert.equal((await executeSyntheticWebsiteBff(s.req(),{...s.config,environment:"production"})).status,503);
  assert.equal((await executeSyntheticWebsiteBff(s.req(),{...s.config,core:undefined})).status,503);
  assert.equal((await executeSyntheticWebsiteBff(s.req(),{...s.config,authorizeSynthetic:()=>Promise.resolve(false)})).status,401);
  assert.equal((await executeSyntheticWebsiteBff(s.req(base,"https://foreign.invalid"),s.config)).status,403);
  assert.equal((await executeSyntheticWebsiteBff(s.req(base,origin,origin+"/api/registration-preview-disabled"),s.config)).status,404);
  assert.equal((await executeSyntheticWebsiteBff(s.req(base,origin,undefined,"text/plain"),s.config)).status,415);
  assert.equal((await executeSyntheticWebsiteBff(s.req(base,origin,undefined,undefined,""),s.config)).status,400);
  assert.equal(s.calls.length,0);
  assert.equal((await executeSyntheticWebsiteBff(s.req(),{...s.config,core:{executePrivate:()=>Promise.resolve(Response.json({data:{status:"INVALID"}},{status:201}))}})).status,503);
  const limited=await executeSyntheticWebsiteBff(s.req(),{...s.config,core:{executePrivate:()=>Promise.resolve(Response.json({sensitive:"not forwarded"},{status:429}))}});
  assert.equal(limited.status,429);assert.deepEqual(await limited.json(),{error:{code:"WEBSITE_INTAKE_REJECTED"}});
});

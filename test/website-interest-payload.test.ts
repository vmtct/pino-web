import { test } from "node:test";
import assert from "node:assert/strict";
import { mapAfterschoolInterest, mapMyTimeInterest } from "../lib/website-interest-payload.ts";
const policy = { consentVersion: "synthetic-qa-v1", favoriteRefs: { acrylic: new Set(["qa-art"]), piano: new Set(["qa-piano"]) } };
const base = { name: " Synthetic QA ", phone: "+84 900 000 001", accepted: true };
test("PAP-2159 maps exact Afterschool fields and optional plan", () => {
  assert.deepEqual(mapAfterschoolInterest({...base,branch:"little-piner",plan:"36"},policy), {
    phone:"+84900000001",contactName:"Synthetic QA",interest:{program:"AFTERSCHOOL",path:"little-piner",planSessions:36},consent:{accepted:true,version:"synthetic-qa-v1"},
  });
  assert.deepEqual(mapAfterschoolInterest({...base,branch:"advice",plan:""},policy).interest,{program:"AFTERSCHOOL",path:"advice",planSessions:null});
  assert.throws(()=>mapAfterschoolInterest({...base,branch:"open-studio",plan:"36"},policy));
  assert.throws(()=>mapAfterschoolInterest({...base,branch:"artchitect",plan:"12"},policy));
});
test("PAP-1680 maps only program-specific approved favorites", () => {
  assert.deepEqual(mapMyTimeInterest({...base,program:"piano",interest:"qa-piano"},policy).interest,{program:"MYTIME",activity:"piano",favoriteRef:"qa-piano"});
  assert.deepEqual(mapMyTimeInterest({...base,program:"advice",interest:""},policy).interest,{program:"MYTIME",activity:"advice",favoriteRef:null});
  assert.throws(()=>mapMyTimeInterest({...base,program:"acrylic",interest:"qa-piano"},policy));
  assert.throws(()=>mapMyTimeInterest({...base,program:"advice",interest:"qa-art"},policy));
  assert.throws(()=>mapMyTimeInterest({...base,program:"piano",interest:"retired"},policy));
});
test("PAP-2424 rejects missing consent, invalid contact and unsupported values", () => {
  const a={...base,branch:"pianohouse",plan:"24"};
  for (const changed of [{accepted:false},{name:""},{name:"x".repeat(101)},{phone:"123"},{phone:"09\n00000000"},{plan:36}]) assert.throws(()=>mapAfterschoolInterest({...a,...changed},policy));
  assert.throws(()=>mapAfterschoolInterest(a,{...policy,consentVersion:""}));
  assert.deepEqual(Object.keys(mapAfterschoolInterest(a,policy)).sort(),["consent","contactName","interest","phone"]);
});

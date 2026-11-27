import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path: string) => readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("PAP-2159 PAP-1680 private named binding is staging-only and disabled",()=>{
  const stage=read("wrangler.staging.toml").replace(/\r\n/g,"\n");
  assert.ok(stage.includes('WEBSITE_SYNTHETIC_ENABLED = "false"'));
  assert.ok(stage.includes('[[services]]\nbinding = "PINO_WEBSITE_SYNTHETIC_CORE"\nservice = "pino-core-staging"\nentrypoint = "WebsiteSyntheticIntakeControlPlane"'));
  for(const path of ["wrangler.toml","worker-entry.ts"]){
    assert.doesNotMatch(read(path),/PINO_WEBSITE_SYNTHETIC_CORE|WebsiteSyntheticIntakeControlPlane|executeSyntheticWebsiteBff|WEBSITE_SYNTHETIC_ENABLED/);
  }
  for(const path of ["app/registration-interest.tsx","app/mytime/v3.tsx"]){
    const text=read(path);
    assert.ok(text.includes('action="/api/registration-preview-disabled"'));
    assert.ok(!text.includes("/api/qa/website-registration-interest"));
  }
});

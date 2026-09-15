import test from 'node:test'; import assert from 'node:assert/strict'; import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url); const r=(p:string)=>readFileSync(new URL(p,root),'utf8');
const watchdog=r('.github/workflows/production-release-recovery-watchdog.yml'); const unresolved=r('scripts/assert-no-unresolved-recovery.sh');
test('H3 F02 Web non-success release cannot be resolved by ordinary PASS',()=>{assert.doesNotMatch(watchdog,/terminal PASS; watchdog/); assert.doesNotMatch(watchdog,/already has terminal PASS/); assert.doesNotMatch(unresolved,/WEB_PRODUCTION_RELEASE: \*\*PASS/); assert.match(unresolved,/WATCHDOG_RECOVERED/);});
test('H3 remediation regression tests are repository-relative',()=>{assert.doesNotMatch(r('test/h2-remediation.test.ts'),/\/home\/tri\/pino-work/);});

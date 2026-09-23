import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../e2e/piner-open-studio-staging-live.spec.ts', import.meta.url), 'utf8');

test('live Open Studio journey is hard-bound to canonical staging before fixture credentials are read', () => {
  assert.match(source, /STAGING_ORIGIN = 'https:\/\/pino-web-staging\.minhtri-van42\.workers\.dev'/);
  const guard = source.indexOf("expect(new URL(baseURL).origin");
  const credentials = source.indexOf('readFileSync(authFile');
  assert.ok(guard >= 0 && credentials > guard);
});

test('live Open Studio journey disables retries for one-shot PIN credentials', () => {
  assert.match(source, /test\.describe\.configure\(\{ retries: 0 \}\)/);
});

test('live Open Studio journey fail-safe cancels the exact created claim', () => {
  assert.match(source, /let createdClaimId: string \| null = null/);
  assert.match(source, /finally \{/);
  assert.match(source, /if \(createdClaimId && !cancellationConfirmed\)/);
  assert.match(source, /claims\/\$\{createdClaimId\}\/cancel/);
  assert.match(source, /PINER_STAGING_CLEANUP_FAILED/);
});

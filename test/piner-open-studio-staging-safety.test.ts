import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { withFailSafeClaimCleanup } from '../lib/piner-open-studio-staging-safety.ts';

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

test('claim id is captured before admission assertions that can throw', () => {
  const capture = source.indexOf('const createdClaimId =');
  const statusAssertion = source.indexOf('expect(admitted.status()).toBe(201)');
  const payloadAssertion = source.indexOf('expect(admitted.request().postDataJSON())');
  assert.ok(capture >= 0 && capture < statusAssertion && capture < payloadAssertion);
});

test('successful admission followed by assertion failure still cleans the exact claim', async () => {
  const claimId = '018f7f5a-4321-7abc-8def-999999999999';
  const cleaned: string[] = [];
  await assert.rejects(
    withFailSafeClaimCleanup(
      claimId,
      async () => {
        assert.deepEqual({ passId: 'wrong' }, { passId: 'expected' });
      },
      async (id) => {
        cleaned.push(id);
      },
    ),
    assert.AssertionError,
  );
  assert.deepEqual(cleaned, [claimId]);
});

test('confirmed normal cancellation suppresses fail-safe duplicate cleanup', async () => {
  const cleaned: string[] = [];
  await withFailSafeClaimCleanup(
    '018f7f5a-4321-7abc-8def-aaaaaaaaaaaa',
    async (markCancellationConfirmed) => {
      markCancellationConfirmed();
    },
    async (id) => {
      cleaned.push(id);
    },
  );
  assert.deepEqual(cleaned, []);
});

test('cleanup failure is propagated instead of being hidden', async () => {
  await assert.rejects(
    withFailSafeClaimCleanup(
      '018f7f5a-4321-7abc-8def-bbbbbbbbbbbb',
      async () => {
        throw new Error('POST_ADMISSION_ASSERTION_FAILED');
      },
      async () => {
        throw new Error('PINER_STAGING_CLEANUP_FAILED');
      },
    ),
    /PINER_STAGING_CLEANUP_FAILED/,
  );
});

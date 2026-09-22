import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const staging = readFileSync(new URL('../wrangler.staging.toml', import.meta.url), 'utf8');

test('Piner staging member bridge targets the canonical Core staging control plane', () => {
  const memberBlock = [
    'binding = "PINO_MEMBER_CORE"',
    'service = "pino-core-staging"',
    'entrypoint = "ParentMemberControlPlane"',
  ].join('\n');
  assert.equal(staging.includes(memberBlock), true);
});

test('Piner staging member bridge is configured exactly once', () => {
  assert.equal((staging.match(/binding = "PINO_MEMBER_CORE"/g) ?? []).length, 1);
  assert.equal((staging.match(/entrypoint = "ParentMemberControlPlane"/g) ?? []).length, 1);
});

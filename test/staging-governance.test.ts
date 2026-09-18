import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const staging = readFileSync(new URL('../wrangler.staging.toml', import.meta.url), 'utf8');
const production = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');

const has = (text: string, value: string) => text.includes(value);

test('canonical Web staging has isolated worker identity and no production route surface', () => {
  assert.equal(has(staging, 'name = "pino-web-staging"'), true);
  assert.equal(has(staging, 'workers_dev = true'), true);
  assert.equal(/\broutes\s*=|\[\[routes\]\]|custom_domain\s*=/.test(staging), false);
  assert.equal(has(staging, 'ENVIRONMENT = "staging"'), true);
});

test('canonical Web staging binds only to Core staging and excludes production data bindings', () => {
  assert.equal(has(staging, 'binding = "PINO_CORE_PUBLIC"'), true);
  assert.equal(has(staging, 'service = "pino-core-staging"'), true);
  assert.equal(has(staging, 'entrypoint = "PublicOpenStudioControlPlane"'), true);
  assert.equal(/NOTION_|send_email|OS_NOTIFY_TO/.test(staging), false);
});

test('production Web config does not consume Core staging', () => {
  assert.equal(has(production, 'service = "pino-core-staging"'), false);
  assert.equal(has(production, 'ENVIRONMENT = "production"'), true);
});

import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const privacy = readFileSync(new URL("../app/policy/page.tsx", import.meta.url), "utf8");
const terms = readFileSync(new URL("../app/term/page.tsx", import.meta.url), "utf8");

test("homepage exposes OAuth branding identity and legal destinations", () => {
  assert.match(home, /PINO Notifier is the email notification service operated by PINO House/);
  assert.match(home, /href="\/policy"/);
  assert.match(home, /href="\/term"/);
});

test("privacy policy describes PINO Notifier and Google account data handling", () => {
  assert.match(privacy, /Privacy Policy/);
  assert.match(privacy, /PINO Notifier/);
  assert.match(privacy, /Google account data/);
  assert.match(privacy, /We do not sell/);
  assert.match(privacy, /Limited Use requirements/);
});

test("terms identify PINO Notifier and link back to privacy policy", () => {
  assert.match(terms, /Terms of Service/);
  assert.match(terms, /PINO Notifier/);
  assert.match(terms, /href="\/policy"/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(new URL("../.github/workflows/production-release.yml", import.meta.url), "utf8");

test("PAP-818 removes functional Web/Core smoke as release admission", () => {
  assert.doesNotMatch(workflow, /candidate-core-sessions|preview_core_header|\/tmp\/core-sessions|\/tmp\/home\.html/);
  assert.doesNotMatch(workflow, /Production root smoke failed|Web->Core smoke did not execute|Public production route/);
  assert.match(workflow, /Founder manual Production acceptance/);
  assert.match(workflow, /Public route and page content: NOT_RUN/);
});
test("PAP-818 retains immutable candidate and protected Core binding authority", () => {
  assert.match(workflow, /Canonical Cloudflare candidate preview identity drifted/);
  assert.match(workflow, /build-info\.json/);
  assert.match(workflow, /Candidate lacks exact PINO_CORE_PUBLIC/);
  assert.match(workflow, /Candidate lacks exact PINO_WEB_CMS_CORE/);
  assert.match(workflow, /Candidate changes production bindings outside the approved Core service bindings/);
  assert.match(workflow, /Production identity did not converge to the approved SHA/);
  assert.match(workflow, /web-production-route-transition\.ts verify/);
});

test("PAP-819 Piner release leaves homepage acceptance to Founder and preserves auth-denial safety", () => {
  const piner = readFileSync(new URL("../.github/workflows/piner-production-release.yml", import.meta.url), "utf8");
  assert.doesNotMatch(piner, /Piner root smoke failed|\/tmp\/piner-home\.html/);
  assert.match(piner, /Piner homepage manual acceptance: PENDING_FOUNDER/);
  assert.match(piner, /Piner member provider smoke returned HTTP/);
  assert.match(piner, /Piner Toppi provider smoke returned HTTP/);
  assert.match(piner, /PARENT_AUTH_SESSION_INVALID/);
  assert.match(piner, /Piner deployment did not converge to exact run-owned identity/);
});

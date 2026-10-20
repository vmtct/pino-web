import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(new URL("../.github/workflows/production-release.yml", import.meta.url), "utf8");

test("PAP-818 removes functional Web/Core smoke as release admission", () => {
  assert.doesNotMatch(workflow, /candidate-core-sessions|preview_core_header|\/tmp\/core-sessions|\/tmp\/home\.html/);
  assert.doesNotMatch(workflow, /Production root smoke failed|Web->Core smoke did not execute/);
  assert.match(workflow, /Founder manual Production acceptance/);
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

import assert from "node:assert/strict";
import test from "node:test";
import { CANONICAL_PATTERNS, LEGACY_PATTERNS, planRouteTransition } from "../scripts/web-production-route-transition.ts";

const script = "pino-web";

test("route transition creates full-domain routes and retires only pino-web legacy routes", () => {
  const legacy = LEGACY_PATTERNS.map((pattern, index) => ({ id: `legacy-${index}`, pattern, script }));
  const plan = planRouteTransition([...legacy, { id: "other", pattern: "example.com/*", script: "other-worker" }], script);
  assert.deepEqual(plan.createPatterns, CANONICAL_PATTERNS);
  assert.deepEqual(plan.deleteRoutes.map((route) => route.pattern), LEGACY_PATTERNS);
});

test("route transition is idempotent once canonical routes are live", () => {
  const routes = CANONICAL_PATTERNS.map((pattern, index) => ({ id: `canonical-${index}`, pattern, script }));
  assert.deepEqual(planRouteTransition(routes, script), { createPatterns: [], deleteRoutes: [] });
});

test("route transition refuses to steal a canonical pattern from another worker", () => {
  assert.throws(() => planRouteTransition([{ id: "foreign", pattern: CANONICAL_PATTERNS[0], script: "foreign" }], script), /owned by foreign/);
});

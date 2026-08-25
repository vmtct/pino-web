import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PINER_DESTINATIONS, PINER_PROTOTYPE_HOUSEHOLD } from "../lib/piner-space-contract.ts";

const pinerUi = readFileSync(new URL("../app/piner/piner-space.tsx", import.meta.url), "utf8");
const pinerSource = readFileSync(new URL("../lib/piner-space-source.ts", import.meta.url), "utf8");

test("Piner v1 exposes exactly the four approved learner destinations", () => {
  assert.deepEqual(PINER_DESTINATIONS.map((item) => item.label), ["Trang chủ", "Hành trình", "Thành quả", "Khám phá"]);
});

test("prototype keeps each Student scene isolated", () => {
  const scenes = PINER_PROTOTYPE_HOUSEHOLD.students;
  assert.ok(scenes.length >= 2);
  assert.equal(new Set(scenes.map((scene) => scene.student.id)).size, scenes.length);
  for (const scene of scenes) {
    assert.ok(scene.home.nextAction.title.length > 0);
    assert.ok(scene.journey.pathTitle.length > 0);
    assert.ok(scene.collection.items.every((item) => item.id.startsWith(scene.student.shortName.toLowerCase()) || item.id.length > 0));
  }
  assert.notDeepEqual(scenes[0]?.journey, scenes[1]?.journey);
});

test("member-facing tier vocabulary does not render Free or Miễn phí", () => {
  const serialized = JSON.stringify(PINER_PROTOTYPE_HOUSEHOLD);
  assert.equal(/\bFree\b|Miễn phí/i.test(serialized), false);
  const approved = new Set(["Premium", "Khám Phá", "Trải nghiệm", "Trải nghiệm đã kết thúc", "Premium đã kết thúc"]);
  for (const scene of PINER_PROTOTYPE_HOUSEHOLD.students) assert.ok(approved.has(scene.home.membership.label));
});

test("Piner consumer stays presentation-only before Core Slice F wiring", () => {
  assert.equal(/\bfetch\s*\(/.test(pinerUi), false);
  assert.equal(/localStorage|sessionStorage/.test(pinerUi), false);
  assert.equal(/method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)/i.test(pinerUi), false);
  assert.equal(/\/api\/pinoria-prototype|controller-command|shop-relay|tv-relay/i.test(`${pinerUi}\n${pinerSource}`), false);
});

test("fixtures do not revive superseded Trial or weekly Explore-claim semantics", () => {
  const serialized = JSON.stringify(PINER_PROTOTYPE_HOUSEHOLD);
  assert.equal(/weekly\s+explore|weekly\s+claim|14[- ]day\s+trial|automatic\s+trial/i.test(serialized), false);
});

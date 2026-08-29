import assert from "node:assert/strict";
import test from "node:test";
import {
  parseHomeProjection,
  parseJourneyProjection,
  projectionResponseIsCurrent,
} from "../lib/piner-member-projections.ts";

const studentId = "018f7f5a-4321-7abc-8def-1234567890ab";
const student = { id: studentId, displayName: "Piner A" };

test("accepts canonical Home states without recomputing action priority", () => {
  const home = parseHomeProjection({
    state: "DEGRADED",
    student,
    primaryAction: null,
    nextTouchpoint: null,
    journey: { journeyId: "j1", pathProgramId: "p1", pathDisplayName: "PianoHouse", focusLabel: "Always With Me", currentMilestoneLabel: "Hai tay" },
    recentOutcome: null,
    asOf: "2026-08-29T06:00:00.000Z",
    resolverVersion: "f0-v1",
  }, studentId);
  assert.equal(home?.state, "DEGRADED");
  assert.equal(home?.primaryAction, null);
});
test("accepts canonical Journey empty and ready states without mastery inference", () => {
  const empty = parseJourneyProjection({
    state: "NO_ACTIVE_JOURNEY",
    student,
    paths: [],
    journeys: [],
    asOf: "2026-08-29T06:00:00.000Z",
  }, studentId);
  assert.equal(empty?.state, "NO_ACTIVE_JOURNEY");

  const ready = parseJourneyProjection({
    state: "READY",
    student,
    paths: [],
    journeys: [{
      journeyId: "j1",
      path: { id: "p1", key: "pianohouse", displayName: "PianoHouse" },
      grammar: "REPERTOIRE_PIECE",
      focus: { id: "r1", label: "Always With Me", note: null },
      progress: { kind: "REPERTOIRE_PIECE", achievedMilestoneCount: 3, totalMilestoneCount: 10, currentMilestone: { number: 4, code: "L4", label: "Hai tay" } },
      lastRecognizedAt: null,
    }],
    asOf: "2026-08-29T06:00:00.000Z",
  }, studentId);
  assert.equal(ready?.journeys[0]?.progress.achievedMilestoneCount, 3);
});
test("rejects malformed or cross-sibling projections", () => {
  assert.equal(parseHomeProjection({ state: "READY", student: { id: "other", displayName: "B" } }, studentId), null);
  assert.equal(parseJourneyProjection({ state: "READY", student, paths: "not-array", journeys: [] }, studentId), null);
  assert.equal(parseHomeProjection({ state: "READY", student, primaryAction: { kind: "FAKE", reasonCode: "x", target: {} }, nextTouchpoint: null, journey: null, asOf: "x", resolverVersion: "x" }, studentId), null);
});

test("late sibling responses cannot overwrite the active Student projection", () => {
  assert.equal(projectionResponseIsCurrent(studentId, studentId, studentId, 4, 4), true);
  assert.equal(projectionResponseIsCurrent(studentId, studentId, "018f7f5a-4321-7abc-8def-000000000000", 4, 4), false);
  assert.equal(projectionResponseIsCurrent(studentId, studentId, studentId, 3, 4), false);
  assert.equal(projectionResponseIsCurrent(studentId, "018f7f5a-4321-7abc-8def-000000000000", studentId, 4, 4), false);
});

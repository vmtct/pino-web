import assert from "node:assert/strict";
import test from "node:test";
import {
  parseHomeProjection,
  parseJourneyProjection,
  parseMemberOpenStudioProjection,
  parseOwnerOpenStudioCancellation,
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

test("rejects malformed nested Home and Journey contract shapes", () => {
  assert.equal(parseHomeProjection({
    state: "READY", student, primaryAction: null,
    nextTouchpoint: { sessionId: "s1", commitment: "CONFIRMED", scheduledStartsAt: "not-time", scheduledEndsAt: "2026-08-29T07:00:00.000Z", pathProgramId: "p1" },
    journey: null, recentOutcome: null, asOf: "2026-08-29T06:00:00.000Z", resolverVersion: "f0-v1",
  }, studentId), null);

  assert.equal(parseJourneyProjection({
    state: "READY", student, paths: [],
    journeys: [{ journeyId: "j1", path: { id: "p1", key: "pianohouse", displayName: "PianoHouse" }, grammar: "REPERTOIRE_PIECE", focus: null, progress: {}, lastRecognizedAt: null }],
    asOf: "2026-08-29T06:00:00.000Z",
  }, studentId), null);
});


test("validates member session, Student list, and OWNER admission envelopes", async () => {
  const { parseOwnerOpenStudioAdmission, parseParentSession, parseStudentList } = await import("../lib/piner-member-projections.ts");
  const parentId = "018f7f5a-4321-7abc-8def-111111111111";
  const sessionId = "018f7f5a-4321-7abc-8def-222222222222";
  assert.ok(parseParentSession({
    principalType: "PARENT_USER",
    parent: { id: parentId, displayName: "Gia đình A" },
    session: { id: sessionId, issuedAt: "2026-08-29T06:00:00.000Z", expiresAt: "2026-11-29T06:00:00.000Z" },
  }));
  assert.equal(parseParentSession({ principalType: "PARENT_USER", parent: null, session: {} }), null);

  assert.deepEqual(parseStudentList([student]), [student]);
  assert.equal(parseStudentList([{ id: studentId, displayName: "A" }, { id: studentId, displayName: "B" }]), null);

  const listingId = "018f7f5a-4321-7abc-8def-333333333333";
  const sessionTarget = "018f7f5a-4321-7abc-8def-444444444444";
  assert.ok(parseOwnerOpenStudioAdmission({
    claimId: "018f7f5a-4321-7abc-8def-555555555555",
    reservation: { id: "018f7f5a-4321-7abc-8def-666666666666", type: "BOOKING", status: "CONFIRMED" },
    claimStatus: "RESERVED", listingId, session: { id: sessionTarget }, participantMode: "OWNER",
  }, listingId, sessionTarget));
  assert.equal(parseOwnerOpenStudioAdmission({ claimId: "bad" }, listingId, sessionTarget), null);
});
test("accepts canonical Open Studio opportunities and active OWNER reservations", () => {
  const listingId = "018f7f5a-4321-7abc-8def-333333333333";
  const sessionTarget = "018f7f5a-4321-7abc-8def-444444444444";
  const item = {
    passId: "018f7f5a-4321-7abc-8def-777777777777",
    listingId,
    experienceType: "KHAM_PHA",
    session: { id: sessionTarget, localDate: "2026-09-12", scheduledStartsAt: "2026-09-12T10:00:00.000Z", scheduledEndsAt: "2026-09-12T11:30:00.000Z" },
    path: { id: "018f7f5a-4321-7abc-8def-888888888888", code: "PIANO", displayName: "PianoHouse" },
    syllabus: { id: "018f7f5a-4321-7abc-8def-999999999999", title: "Always With Me" },
  };
  const result = parseMemberOpenStudioProjection({
    student,
    opportunities: [item],
    reservations: [{ ...item, claimId: "018f7f5a-4321-7abc-8def-aaaaaaaaaaaa", reservation: { id: "018f7f5a-4321-7abc-8def-bbbbbbbbbbbb", type: "BOOKING", status: "CONFIRMED" }, claimStatus: "RESERVED" }],
    asOf: "2026-08-29T06:00:00.000Z",
  }, studentId);
  assert.equal(result?.opportunities[0]?.syllabus.title, "Always With Me");
  assert.equal(result?.reservations[0]?.claimStatus, "RESERVED");
});

test("validates bounded OWNER Open Studio cancellation result", () => {
  const claimId = "018f7f5a-4321-7abc-8def-aaaaaaaaaaaa";
  const listingId = "018f7f5a-4321-7abc-8def-333333333333";
  const sessionTarget = "018f7f5a-4321-7abc-8def-444444444444";
  assert.ok(parseOwnerOpenStudioCancellation({
    claimId,
    reservation: { id: "018f7f5a-4321-7abc-8def-bbbbbbbbbbbb", type: "BOOKING", status: "CANCELLED" },
    claimStatus: "RELEASED",
    listingId,
    session: { id: sessionTarget },
    participantMode: "OWNER",
    cancellationResult: "RELEASED_CANCELLED",
  }, claimId, listingId, sessionTarget));
  assert.equal(parseOwnerOpenStudioCancellation({ claimId, claimStatus: "RESERVED" }, claimId, listingId, sessionTarget), null);
});

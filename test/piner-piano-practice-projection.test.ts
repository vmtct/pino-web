import assert from "node:assert/strict";
import test from "node:test";
import { parsePianoPracticeProjection } from "../lib/piner-piano-practice-projection.ts";

const studentId = "018f7f5a-4321-7abc-8def-1234567890ab";

function fixture() {
  return {
    state: "READY",
    student: { id: studentId, displayName: "Chây" },
    resource: {
      id: "practice_always_with_me",
      title: "Always With Me",
      family: "JOURNEY",
      context: { label: "PianoHouse · Level 3" },
      version: { id: "practice_version_2", number: 2 },
      pages: [
        { id: "page_1", order: 1, sheet: { url: "/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/piano/repertoire/018f7f5a-aaaa-7abc-8def-123456789001/practice-pages/018f7f5a-bbbb-7abc-8def-123456789001/media/SHEET" }, worksheet: { url: "/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/piano/repertoire/018f7f5a-aaaa-7abc-8def-123456789001/practice-pages/018f7f5a-bbbb-7abc-8def-123456789001/media/WORKSHEET" } },
        { id: "page_2", order: 2, sheet: { url: "/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/piano/repertoire/018f7f5a-aaaa-7abc-8def-123456789001/practice-pages/018f7f5a-bbbb-7abc-8def-123456789002/media/SHEET" }, worksheet: null },
        { id: "page_3", order: 3, sheet: { url: "/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/piano/repertoire/018f7f5a-aaaa-7abc-8def-123456789001/practice-pages/018f7f5a-bbbb-7abc-8def-123456789003/media/SHEET" }, worksheet: { url: "/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/piano/repertoire/018f7f5a-aaaa-7abc-8def-123456789001/practice-pages/018f7f5a-bbbb-7abc-8def-123456789003/media/WORKSHEET" } },
      ],
    },
    reasonCode: null,
    asOf: "2026-08-31T13:30:00.000Z",
  };
}

test("accepts the frozen three-page F0 fixture and preserves missing Worksheet", () => {
  const parsed = parsePianoPracticeProjection(fixture(), studentId);
  assert.ok(parsed);
  assert.equal(parsed.state, "READY");
  assert.equal(parsed.resource?.title, "Always With Me");
  assert.equal(parsed.resource?.pages.length, 3);
  assert.equal(parsed.resource?.pages[1].worksheet, null);
  assert.ok(parsed.resource?.pages[0].worksheet);
  assert.ok(parsed.resource?.pages[2].worksheet);
});

test("rejects cross-Student projections", () => {
  assert.equal(parsePianoPracticeProjection(fixture(), "different-student"), null);
});

test("rejects non-deterministic page order", () => {
  const value = fixture();
  value.resource.pages[1].order = 3;
  assert.equal(parsePianoPracticeProjection(value, studentId), null);
});

test("rejects duplicate page identity", () => {
  const value = fixture();
  value.resource.pages[2].id = value.resource.pages[0].id;
  assert.equal(parsePianoPracticeProjection(value, studentId), null);
});

test("accepts only contextual same-origin protected Practice media", () => {
  const external = fixture();
  external.resource.pages[0].sheet.url = "https://media.pinohouse.art/sheet-1.png";
  assert.equal(parsePianoPracticeProjection(external, studentId), null);

  const rawProxy = fixture();
  rawProxy.resource.pages[0].sheet.url = "/api/piner/media/sheet-1";
  assert.equal(parsePianoPracticeProjection(rawProxy, studentId), null);

  const wrongStudent = fixture();
  wrongStudent.resource.pages[0].sheet.url = "/api/piner/students/018f7f5a-4321-7abc-8def-000000000000/piano/repertoire/018f7f5a-aaaa-7abc-8def-123456789001/practice-pages/018f7f5a-bbbb-7abc-8def-123456789001/media/SHEET";
  assert.equal(parsePianoPracticeProjection(wrongStudent, studentId), null);

  const wrongRole = fixture();
  wrongRole.resource.pages[0].worksheet!.url = wrongRole.resource.pages[0].sheet.url;
  assert.equal(parsePianoPracticeProjection(wrongRole, studentId), null);
});

test("requires locked and unavailable projections to omit resource data", () => {
  const locked = fixture() as any;
  locked.state = "LOCKED";
  locked.reasonCode = "PRACTICE_LOCKED";
  assert.equal(parsePianoPracticeProjection(locked, studentId), null);
  locked.resource = null;
  assert.ok(parsePianoPracticeProjection(locked, studentId));
});

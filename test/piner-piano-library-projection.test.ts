import assert from "node:assert/strict";
import test from "node:test";
import { parsePianoLibraryPathSummary, parsePianoLibraryProjection } from "../lib/piner-piano-library-projection.ts";

const studentId = "018f7f5a-4321-7abc-8def-1234567890ab";
const pathProgramId = "018f7f5a-aaaa-7abc-8def-123456789002";
const itemId = "018f7f5a-aaaa-7abc-8def-123456789003";
const resourceId = "018f7f5a-aaaa-7abc-8def-123456789004";
const effectiveAt = "2026-09-02T00:00:00.000Z";

function library() {
  return {
    studentId,
    pathProgramId,
    targetedPreviewItemId: null,
    effectiveAt,
    items: [{
      id: itemId,
      pathProgramId,
      title: "Always With Me",
      explicitAccessGrant: true,
      publishedPracticeResourceId: resourceId,
      access: {
        state: "FULL",
        action: "NONE",
        capabilities: { VIEW_LIBRARY_CARD: "ALLOWED", OPEN_VIEWER: "ALLOWED" },
      },
    }],
  };
}
test("parses explicit repertoire grant library with published Practice resource", () => {
  const parsed = parsePianoLibraryProjection(library(), studentId, pathProgramId);
  assert.ok(parsed);
  assert.deepEqual(parsed.items[0], {
    id: itemId,
    pathProgramId,
    title: "Always With Me",
    explicitAccessGrant: true,
    publishedPracticeResourceId: resourceId,
    access: {
      state: "FULL",
      action: "NONE",
      capabilities: { VIEW_LIBRARY_CARD: "ALLOWED", OPEN_VIEWER: "ALLOWED" },
    },
  });
});

test("parses summary Path discovery and rejects mismatched or malformed authority", () => {
  assert.deepEqual(parsePianoLibraryPathSummary({ student: { id: studentId }, paths: [{ pathProgramId, hasActiveSubscription: false, hasPriorSubscription: false }] }, studentId), [pathProgramId]);
  assert.equal(parsePianoLibraryPathSummary({ student: { id: "other" }, paths: [] }, studentId), null);
  assert.equal(parsePianoLibraryProjection({ ...library(), pathProgramId: "bad" }, studentId, pathProgramId), null);
  const invalid = library();
  invalid.items[0]!.publishedPracticeResourceId = "not-a-canonical-id";
  assert.equal(parsePianoLibraryProjection(invalid, studentId, pathProgramId), null);
});

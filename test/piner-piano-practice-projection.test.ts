import assert from "node:assert/strict";
import test from "node:test";
import { parsePianoPracticeProjection, pinerPracticeMediaPath } from "../lib/piner-piano-practice-projection.ts";

const studentId = "018f7f5a-4321-7abc-8def-1234567890ab";
const resourceId = "018f7f5a-aaaa-7abc-8def-123456789001";
const pathProgramId = "018f7f5a-aaaa-7abc-8def-123456789002";
const repertoireItemId = "018f7f5a-aaaa-7abc-8def-123456789003";
const page1 = "018f7f5a-bbbb-7abc-8def-123456789001";
const page2 = "018f7f5a-bbbb-7abc-8def-123456789002";
const page3 = "018f7f5a-bbbb-7abc-8def-123456789003";

function media(pageId: string, role: "SHEET" | "WORKSHEET") {
  return `/v1/member/students/${studentId}/piano/practice-resources/${resourceId}/pages/${pageId}/media/${role}`;
}

function fixture() {
  return {
    resourceId,
    pathProgramId,
    pianoRepertoireItemId: repertoireItemId,
    family: "JOURNEY",
    version: {
      id: "018f7f5a-cccc-7abc-8def-123456789002",
      number: 2,
      title: "Always With Me",
      formatDefinition: "PIANO_SHEET_176X250_8ROW_V1",
      publishedAt: "2026-08-31T13:30:00.000Z",
    },
    pages: [
      { id: page1, order: 1, sheetMediaPath: media(page1, "SHEET"), worksheetMediaPath: media(page1, "WORKSHEET") },
      { id: page2, order: 2, sheetMediaPath: media(page2, "SHEET"), worksheetMediaPath: null },
      { id: page3, order: 3, sheetMediaPath: media(page3, "SHEET"), worksheetMediaPath: media(page3, "WORKSHEET") },
    ],
  };
}

test("accepts the exact Core F0 resource DTO and preserves missing Worksheet", () => {
  const parsed = parsePianoPracticeProjection(fixture(), studentId, resourceId);
  assert.ok(parsed);
  assert.equal(parsed.resourceId, resourceId);
  assert.equal(parsed.version.title, "Always With Me");
  assert.equal(parsed.pages.length, 3);
  assert.equal(parsed.pages[1].worksheetMediaPath, null);
});

test("maps validated Core member media paths to the same-origin Piner proxy", () => {
  assert.equal(
    pinerPracticeMediaPath(media(page1, "SHEET")),
    media(page1, "SHEET").replace(/^\/v1\/member/, "/api/piner"),
  );
  assert.equal(pinerPracticeMediaPath("https://media.pinohouse.art/sheet.png"), null);
});

test("rejects resource, ordering, and page-identity drift", () => {
  const wrongResource = fixture();
  wrongResource.resourceId = "018f7f5a-aaaa-7abc-8def-123456789009";
  assert.equal(parsePianoPracticeProjection(wrongResource, studentId, resourceId), null);

  const wrongOrder = fixture();
  wrongOrder.pages[1].order = 3;
  assert.equal(parsePianoPracticeProjection(wrongOrder, studentId, resourceId), null);

  const duplicate = fixture();
  duplicate.pages[2].id = duplicate.pages[0].id;
  assert.equal(parsePianoPracticeProjection(duplicate, studentId, resourceId), null);
});

test("rejects legacy, external, wrong-Student and wrong-role media shapes", () => {
  const external = fixture();
  external.pages[0].sheetMediaPath = "https://media.pinohouse.art/sheet.png";
  assert.equal(parsePianoPracticeProjection(external, studentId, resourceId), null);

  const legacy = fixture();
  legacy.pages[0].sheetMediaPath = `/v1/member/students/${studentId}/piano/repertoire/${repertoireItemId}/practice-pages/${page1}/media/SHEET`;
  assert.equal(parsePianoPracticeProjection(legacy, studentId, resourceId), null);

  const wrongStudent = fixture();
  wrongStudent.pages[0].sheetMediaPath = wrongStudent.pages[0].sheetMediaPath.replace(studentId, "018f7f5a-4321-7abc-8def-000000000000");
  assert.equal(parsePianoPracticeProjection(wrongStudent, studentId, resourceId), null);

  const wrongRole = fixture();
  wrongRole.pages[0].worksheetMediaPath = media(page1, "SHEET");
  assert.equal(parsePianoPracticeProjection(wrongRole, studentId, resourceId), null);
});

test("rejects the obsolete state/resource wrapper instead of compatibility-parsing it", () => {
  assert.equal(parsePianoPracticeProjection({
    state: "READY",
    student: { id: studentId, displayName: "Piner" },
    resource: fixture(),
    reasonCode: null,
    asOf: "2026-08-31T13:30:00.000Z",
  }, studentId, resourceId), null);
});

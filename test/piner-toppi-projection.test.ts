import assert from "node:assert/strict";
import test from "node:test";
import { parseToppiProjection } from "../lib/piner-toppi-projection.ts";

const STUDENT = "018f7f5a-4321-7abc-8def-1234567890ab";

function fixture(studentId = STUDENT) {
  return {
    student: { id: studentId, displayName: "Mori Cross-App" },
    programs: [{
      enrollment_id: "top_enr_1",
      enrollment_status: "active",
      program: { code: "TOPPI_ENGLISH", name: "Toppi English" },
      stage: { code: "FOUNDATION", name: "Nền tảng" },
      level: { code: "L4", number: 4, name: "Level 4" },
      class_lens: { code: "CONFIDENT_COMMUNICATION", name: "Tự tin giao tiếp" },
      next_level: { code: "L5", number: 5, name: "Level 5" },
      progression: { state: "in_progress", latest_promotion_at: null },
      evidence_summary: { published_count: 3, latest_at: "2026-08-29T06:00:00.000Z" },
      assessment_summary: { published_count: 2, latest_at: "2026-08-28T06:00:00.000Z" },
      competencies: [{ code: "response", name: "Phản hồi", state: "developing", assessed_at: "2026-08-28T06:00:00.000Z" }],
    }],
  };
}
test("accepts a bounded Toppi program projection for the selected Student", () => {
  const parsed = parseToppiProjection(fixture(), STUDENT);
  assert.ok(parsed);
  assert.equal(parsed.student.id, STUDENT);
  assert.equal(parsed.programs[0]?.level.number, 4);
  assert.equal(parsed.programs[0]?.class_lens.name, "Tự tin giao tiếp");
});

test("rejects cross-sibling and malformed Toppi projections", () => {
  assert.equal(
    parseToppiProjection(fixture("018f7f5a-4321-7abc-8def-000000000002"), STUDENT),
    null,
  );
  const malformed = fixture();
  malformed.programs[0]!.level.number = 0;
  assert.equal(parseToppiProjection(malformed, STUDENT), null);
});

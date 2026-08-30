import assert from "node:assert/strict";
import test from "node:test";
import {
  parseToppiPracticeCompletion,
  parseToppiPracticeProjection,
} from "../lib/piner-toppi-practice-projection.ts";

const STUDENT = "019d2000-0001-7000-8000-000000000001";

function practice(studentId = STUDENT) {
  return {
    student: { id: studentId, displayName: "Mori Cross-App" },
    rewardSummary: { code: "PLS", earnedTotal: 10 },
    sets: [{
      id: "top_prs_test",
      enrollmentId: "top_enr_test",
      code: "L4_STORY_01",
      title: "Kể lại một khoảnh khắc đáng nhớ",
      level: { code: "L4", number: 4, name: "Level 4" },
      reward: { code: "PLS", amount: 10 },
      options: [
        { id: "top_pro_s", kind: "SPEAKING", title: "Nói 60 giây", prompt: "Kể lại câu chuyện.", instructions: "Nói 3–5 câu." },
        { id: "top_pro_w", kind: "WORKSHEET", title: "Viết 3–5 câu", prompt: "Viết lại câu chuyện.", instructions: "Viết đủ ý chính." },
      ],
      completion: null,
    }],
  };
}
test("accepts a bounded Practice projection for the selected Student", () => {
  const parsed = parseToppiPracticeProjection(practice(), STUDENT);
  assert.ok(parsed);
  assert.equal(parsed.student.id, STUDENT);
  assert.equal(parsed.sets[0]?.options.length, 2);
  assert.equal(parsed.sets[0]?.reward.amount, 10);
});

test("rejects sibling or malformed Practice projections", () => {
  assert.equal(parseToppiPracticeProjection(practice("sibling"), STUDENT), null);
  const bad = practice();
  bad.sets[0]!.options[0]!.kind = "VIDEO" as "SPEAKING";
  assert.equal(parseToppiPracticeProjection(bad, STUDENT), null);
});

test("accepts the immutable completion receipt projection", () => {
  const parsed = parseToppiPracticeCompletion({
    completion: { id: "top_prc_1", practiceSetId: "top_prs_test", optionId: "top_pro_s", completedAt: "2026-08-30T09:00:00.000Z" },
    reward: { code: "PLS", amount: 10 },
    replayed: false,
  });
  assert.ok(parsed);
  assert.equal(parsed.reward.code, "PLS");
  assert.equal(parsed.replayed, false);
});
export type ToppiPracticeOption = {
  id: string;
  kind: "SPEAKING" | "WORKSHEET";
  title: string;
  prompt: string;
  instructions: string;
};
export type ToppiPracticeCompletion = {
  id: string;
  optionId: string;
  completedAt: string;
  reward: { code: "PLS"; amount: number } | null;
};
export type ToppiPracticeSet = {
  id: string;
  enrollmentId: string;
  code: string;
  title: string;
  level: { code: string; number: number; name: string };
  reward: { code: "PLS"; amount: number };
  options: ToppiPracticeOption[];
  completion: ToppiPracticeCompletion | null;
};
export type ToppiPracticeProjection = {
  student: { id: string; displayName: string };
  sets: ToppiPracticeSet[];
  rewardSummary: { code: "PLS"; earnedTotal: number; pinoriaBalance: number | null; syncState: "SYNCED" | "PENDING" | "UNAVAILABLE" };
};
export function parseToppiPracticeProjection(value: unknown, expectedStudentId: string): ToppiPracticeProjection | null {
  if (!record(value) || !record(value.student) || value.student.id !== expectedStudentId || !text(value.student.displayName)) return null;
  if (!Array.isArray(value.sets) || !value.sets.every(practiceSet)) return null;
  if (!record(value.rewardSummary) || value.rewardSummary.code !== "PLS" || !nonNegativeInteger(value.rewardSummary.earnedTotal)) return null;
  if (!(value.rewardSummary.pinoriaBalance === null || nonNegativeInteger(value.rewardSummary.pinoriaBalance))) return null;
  if (value.rewardSummary.syncState !== "SYNCED" && value.rewardSummary.syncState !== "PENDING" && value.rewardSummary.syncState !== "UNAVAILABLE") return null;
  return value as ToppiPracticeProjection;
}

export function parseToppiPracticeCompletion(value: unknown) {
  if (!record(value) || !record(value.completion) || !record(value.reward)) return null;
  if (!text(value.completion.id) || !text(value.completion.practiceSetId) || !text(value.completion.optionId) || !time(value.completion.completedAt)) return null;
  if (value.reward.code !== "PLS" || !positiveInteger(value.reward.amount) || typeof value.replayed !== "boolean") return null;
  return value as {
    completion: { id: string; practiceSetId: string; optionId: string; completedAt: string };
    reward: { code: "PLS"; amount: number };
    replayed: boolean;
  };
}

function practiceSet(value: unknown): value is ToppiPracticeSet {
  if (!record(value) || !text(value.id) || !text(value.enrollmentId) || !text(value.code) || !text(value.title)) return false;
  if (!level(value.level) || !reward(value.reward) || !Array.isArray(value.options) || !value.options.every(option)) return false;
  return value.completion === null || completion(value.completion);
}
function option(value: unknown): value is ToppiPracticeOption {
  return record(value)
    && text(value.id)
    && (value.kind === "SPEAKING" || value.kind === "WORKSHEET")
    && text(value.title)
    && text(value.prompt)
    && text(value.instructions);
}
function completion(value: unknown): value is ToppiPracticeCompletion {
  return record(value)
    && text(value.id)
    && text(value.optionId)
    && time(value.completedAt)
    && (value.reward === null || reward(value.reward));
}
function level(value: unknown) {
  return record(value) && text(value.code) && positiveInteger(value.number) && text(value.name);
}
function reward(value: unknown) {
  return record(value) && value.code === "PLS" && positiveInteger(value.amount);
}
function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
function nonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}
function time(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}
function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

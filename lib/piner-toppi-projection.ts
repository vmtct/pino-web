export type ToppiCompetency = {
  code: string;
  name: string;
  state: string;
  assessed_at: string;
};

export type ToppiProgramProgress = {
  enrollment_id: string;
  enrollment_status: string;
  program: { code: string; name: string };
  stage: { code: string; name: string };
  level: { code: string; number: number; name: string };
  class_lens: { code: string; name: string };
  next_level: { code: string; number: number; name: string } | null;
  progression: { state: string; latest_promotion_at: string | null };
  evidence_summary: { published_count: number; latest_at: string | null };
  assessment_summary: { published_count: number; latest_at: string | null };
  competencies: ToppiCompetency[];
};

export type ToppiMemberProjection = {
  student: { id: string; displayName: string };
  programs: ToppiProgramProgress[];
};
export function parseToppiProjection(value: unknown, expectedStudentId: string): ToppiMemberProjection | null {
  if (!record(value) || !record(value.student) || value.student.id !== expectedStudentId || !text(value.student.displayName)) return null;
  if (!Array.isArray(value.programs) || !value.programs.every(program)) return null;
  return value as ToppiMemberProjection;
}

function program(value: unknown): value is ToppiProgramProgress {
  if (!record(value) || !text(value.enrollment_id) || !text(value.enrollment_status)) return false;
  if (!named(value.program) || !named(value.stage) || !namedLevel(value.level) || !named(value.class_lens)) return false;
  if (value.next_level !== null && !namedLevel(value.next_level)) return false;
  if (!record(value.progression) || !text(value.progression.state) || !nullableTime(value.progression.latest_promotion_at)) return false;
  if (!summary(value.evidence_summary) || !summary(value.assessment_summary)) return false;
  return Array.isArray(value.competencies) && value.competencies.every(competency);
}

function competency(value: unknown): value is ToppiCompetency {
  return record(value) && text(value.code) && text(value.name) && text(value.state) && time(value.assessed_at);
}

function named(value: unknown): value is { code: string; name: string } {
  return record(value) && text(value.code) && text(value.name);
}

function namedLevel(value: unknown): value is { code: string; number: number; name: string } {
  return record(value)
    && text(value.code)
    && text(value.name)
    && integer(value.number)
    && value.number >= 1
    && value.number <= 100;
}
function summary(value: unknown) {
  return record(value)
    && integer(value.published_count)
    && value.published_count >= 0
    && nullableTime(value.latest_at);
}

function nullableTime(value: unknown) {
  return value === null || time(value);
}

function time(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function integer(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

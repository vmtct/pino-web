export type PianoPracticeFamily = "STARTER" | "JOURNEY" | "SPECIALTY";
export type PianoPracticeProjectionState = "READY" | "LOCKED" | "UNAVAILABLE";

export type PianoPracticeMedia = {
  url: string;
};

export type PianoPracticePage = {
  id: string;
  order: number;
  sheet: PianoPracticeMedia;
  worksheet: PianoPracticeMedia | null;
};

export type PianoPracticeResource = {
  id: string;
  title: string;
  family: PianoPracticeFamily;
  context: { label: string | null };
  version: { id: string; number: number };
  pages: PianoPracticePage[];
};

export type PianoPracticeProjection = {
  state: PianoPracticeProjectionState;
  student: { id: string; displayName: string };
  resource: PianoPracticeResource | null;
  reasonCode: string | null;
  asOf: string;
};

const STATES = new Set<PianoPracticeProjectionState>(["READY", "LOCKED", "UNAVAILABLE"]);
const FAMILIES = new Set<PianoPracticeFamily>(["STARTER", "JOURNEY", "SPECIALTY"]);

export function parsePianoPracticeProjection(
  value: unknown,
  expectedStudentId: string,
): PianoPracticeProjection | null {
  if (!isRecord(value) || !STATES.has(value.state as PianoPracticeProjectionState)) return null;
  if (!sameStudent(value.student, expectedStudentId) || !isTimestamp(value.asOf)) return null;
  if (!(value.reasonCode === null || nonEmptyString(value.reasonCode))) return null;

  if (value.state === "READY") {
    if (!isResource(value.resource, expectedStudentId)) return null;
  } else if (value.resource !== null) {
    return null;
  }

  return value as PianoPracticeProjection;
}

function isResource(value: unknown, expectedStudentId: string): value is PianoPracticeResource {
  if (!isRecord(value) || !nonEmptyString(value.id) || !nonEmptyString(value.title)) return false;
  if (!FAMILIES.has(value.family as PianoPracticeFamily)) return false;
  if (!isRecord(value.context) || !(value.context.label === null || nonEmptyString(value.context.label))) return false;
  if (!isRecord(value.version) || !nonEmptyString(value.version.id) || !positiveInteger(value.version.number)) return false;
  if (!Array.isArray(value.pages) || value.pages.length < 1) return false;

  const seen = new Set<string>();
  for (let index = 0; index < value.pages.length; index += 1) {
    const page = value.pages[index];
    if (!isRecord(page) || !nonEmptyString(page.id) || seen.has(page.id)) return false;
    seen.add(page.id);
    if (page.order !== index + 1) return false;
    if (!isMedia(page.sheet, expectedStudentId, "SHEET")) return false;
    if (!(page.worksheet === null || isMedia(page.worksheet, expectedStudentId, "WORKSHEET"))) return false;
  }
  return true;
}

function isMedia(
  value: unknown,
  expectedStudentId: string,
  expectedRole: "SHEET" | "WORKSHEET",
): value is PianoPracticeMedia {
  return isRecord(value) && protectedPracticeMediaPath(value.url, expectedStudentId, expectedRole);
}

function protectedPracticeMediaPath(
  value: unknown,
  expectedStudentId: string,
  expectedRole: "SHEET" | "WORKSHEET",
): value is string {
  if (typeof value !== "string" || !value.trim() || value.includes("?") || value.includes("#")) return false;
  const match = /^\/api\/piner\/students\/([0-9a-f-]{36})\/piano\/repertoire\/([0-9a-f-]{36})\/practice-pages\/([0-9a-f-]{36})\/media\/(SHEET|WORKSHEET)$/.exec(value);
  return Boolean(match && match[1] === expectedStudentId && match[4] === expectedRole);
}

function sameStudent(value: unknown, expectedStudentId: string): boolean {
  return isRecord(value) && value.id === expectedStudentId && nonEmptyString(value.displayName);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

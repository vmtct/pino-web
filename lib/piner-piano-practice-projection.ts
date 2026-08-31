export type PianoPracticeFamily = "STARTER" | "JOURNEY" | "SPECIALTY";
export type PianoPracticeMediaRole = "SHEET" | "WORKSHEET";

export type PianoPracticePage = {
  id: string;
  order: number;
  sheetMediaPath: string;
  worksheetMediaPath: string | null;
};

export type PianoPracticeProjection = {
  resourceId: string;
  pathProgramId: string;
  pianoRepertoireItemId: string;
  family: PianoPracticeFamily;
  version: {
    id: string;
    number: number;
    title: string;
    formatDefinition: "PIANO_SHEET_176X250_8ROW_V1";
    publishedAt: string;
  };
  pages: PianoPracticePage[];
};

const FAMILIES = new Set<PianoPracticeFamily>(["STARTER", "JOURNEY", "SPECIALTY"]);
const FORMAT = "PIANO_SHEET_176X250_8ROW_V1";
export function parsePianoPracticeProjection(
  value: unknown,
  expectedStudentId: string,
  expectedResourceId: string,
): PianoPracticeProjection | null {
  if (!isRecord(value) || !canonicalId(expectedStudentId) || !canonicalId(expectedResourceId)) return null;
  if (value.resourceId !== expectedResourceId || !canonicalId(value.resourceId)) return null;
  if (!canonicalId(value.pathProgramId) || !canonicalId(value.pianoRepertoireItemId)) return null;
  if (!FAMILIES.has(value.family as PianoPracticeFamily)) return null;
  if (!isVersion(value.version)) return null;
  if (!Array.isArray(value.pages) || value.pages.length < 1) return null;

  const seen = new Set<string>();
  for (let index = 0; index < value.pages.length; index += 1) {
    const page = value.pages[index];
    if (!isRecord(page) || !canonicalId(page.id) || seen.has(page.id)) return null;
    seen.add(page.id);
    if (page.order !== index + 1) return null;
    if (!coreMediaPath(page.sheetMediaPath, expectedStudentId, expectedResourceId, page.id, "SHEET")) return null;
    if (!(page.worksheetMediaPath === null
      || coreMediaPath(page.worksheetMediaPath, expectedStudentId, expectedResourceId, page.id, "WORKSHEET"))) return null;
  }

  return value as PianoPracticeProjection;
}
export function pinerPracticeMediaPath(value: string): string | null {
  if (!/^\/v1\/member\/students\/[0-9a-f-]{36}\/piano\/practice-resources\/[0-9a-f-]{36}\/pages\/[0-9a-f-]{36}\/media\/(SHEET|WORKSHEET)$/.test(value)) {
    return null;
  }
  return value.replace(/^\/v1\/member/, "/api/piner");
}

function isVersion(value: unknown): boolean {
  return isRecord(value)
    && canonicalId(value.id)
    && positiveInteger(value.number)
    && nonEmptyString(value.title)
    && value.formatDefinition === FORMAT
    && isTimestamp(value.publishedAt);
}

function coreMediaPath(
  value: unknown,
  studentId: string,
  resourceId: string,
  pageId: string,
  role: PianoPracticeMediaRole,
): value is string {
  return value === `/v1/member/students/${studentId}/piano/practice-resources/${resourceId}/pages/${pageId}/media/${role}`;
}
function canonicalId(value: unknown): value is string {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
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

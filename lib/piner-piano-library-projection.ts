export type PianoLibraryAccessState = "HIDDEN" | "BASELINE" | "PARTIAL_PREVIEW" | "LOCKED_DISCOVERABLE" | "FULL";
export type PianoLibraryCapability = "ALLOWED" | "LOCKED" | "HIDDEN";

export type PianoLibraryItem = {
  id: string;
  pathProgramId: string;
  title: string;
  explicitAccessGrant: boolean;
  publishedPracticeResourceId: string | null;
  access: {
    state: PianoLibraryAccessState;
    action: string;
    capabilities: Record<string, PianoLibraryCapability>;
  };
};

export type PianoLibraryProjection = {
  studentId: string;
  pathProgramId: string;
  items: PianoLibraryItem[];
  effectiveAt: string;
};

export function parsePianoLibraryProjection(value: unknown, expectedStudentId: string, expectedPathProgramId: string): PianoLibraryProjection | null {
  if (!isRecord(value) || value.studentId !== expectedStudentId || value.pathProgramId !== expectedPathProgramId || !Array.isArray(value.items) || !isTimestamp(value.effectiveAt)) return null;
  const items: PianoLibraryItem[] = [];
  for (const raw of value.items) {
    const item = parseItem(raw, expectedPathProgramId);
    if (!item) return null;
    items.push(item);
  }
  return { studentId: expectedStudentId, pathProgramId: expectedPathProgramId, items, effectiveAt: value.effectiveAt };
}

function parseItem(value: unknown, expectedPathProgramId: string): PianoLibraryItem | null {
  if (!isRecord(value) || !canonicalId(value.id) || value.pathProgramId !== expectedPathProgramId || typeof value.title !== "string" || typeof value.explicitAccessGrant !== "boolean") return null;
  if (!(value.publishedPracticeResourceId === null || canonicalId(value.publishedPracticeResourceId))) return null;
  if (!isRecord(value.access) || !accessState(value.access.state) || typeof value.access.action !== "string" || !isRecord(value.access.capabilities)) return null;
  const capabilities: Record<string, PianoLibraryCapability> = {};
  for (const [key, decision] of Object.entries(value.access.capabilities)) {
    if (!capability(decision)) return null;
    capabilities[key] = decision;
  }
  if (!capabilities.OPEN_VIEWER) return null;
  return { id: value.id, pathProgramId: value.pathProgramId, title: value.title, explicitAccessGrant: value.explicitAccessGrant, publishedPracticeResourceId: value.publishedPracticeResourceId, access: { state: value.access.state, action: value.access.action, capabilities } };
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function canonicalId(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value); }
function isTimestamp(value: unknown): value is string { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
function accessState(value: unknown): value is PianoLibraryAccessState { return value === "HIDDEN" || value === "BASELINE" || value === "PARTIAL_PREVIEW" || value === "LOCKED_DISCOVERABLE" || value === "FULL"; }
function capability(value: unknown): value is PianoLibraryCapability { return value === "ALLOWED" || value === "LOCKED" || value === "HIDDEN"; }

export function parsePianoLibraryPathSummary(value: unknown, expectedStudentId: string): string[] | null {
  if (!isRecord(value) || !isRecord(value.student) || value.student.id !== expectedStudentId || !Array.isArray(value.paths)) return null;
  const paths: string[] = [];
  for (const raw of value.paths) {
    if (!isRecord(raw) || !canonicalId(raw.pathProgramId) || typeof raw.hasActiveSubscription !== "boolean" || typeof raw.hasPriorSubscription !== "boolean") return null;
    paths.push(raw.pathProgramId);
  }
  return [...new Set(paths)];
}

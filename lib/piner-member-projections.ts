export type PinerStudentSummary = { id: string; displayName: string };

export type JourneyState = "READY" | "NO_ACTIVE_JOURNEY" | "NO_SUPPORTED_PATH";
export type JourneyPathIdentity = { id: string; key: string; displayName: string };
export type JourneyMilestone = { number: number; code: string; label: string };

export type MemberJourneySummary = {
  journeyId: string;
  path: JourneyPathIdentity;
  grammar: string;
  focus: { id: string; label: string; note: string | null };
  progress: {
    kind: string;
    achievedMilestoneCount: number;
    totalMilestoneCount: number;
    currentMilestone: JourneyMilestone | null;
  };
  lastRecognizedAt: string | null;
};

export type MemberJourneyProjection = {
  state: JourneyState;
  student: PinerStudentSummary;
  paths: Array<{
    path: JourneyPathIdentity;
    support: "SUPPORTED" | "UNSUPPORTED";
    unsupportedReason: string | null;
    journeys: MemberJourneySummary[];
  }>;
  journeys: MemberJourneySummary[];
  asOf: string;
};
export type HomeSceneState = "READY" | "NEUTRAL" | "DEGRADED";
export type HomeActionKind =
  | "RECOVERY"
  | "PHYSICAL_TOUCHPOINT"
  | "VIEW_FRESH_OUTCOME"
  | "CONTINUE_JOURNEY"
  | "EXPLORE_RETURN"
  | "VIEW_RETAINED_VALUE";

export type HomeActionTarget =
  | { kind: "MEMBER_CONTEXT"; recovery: string }
  | { kind: "SESSION"; sessionId: string }
  | { kind: "LEARNER_OUTCOME"; outcomeId: string }
  | { kind: "JOURNEY"; journeyId: string; pathProgramId: string }
  | {
      kind: "OPEN_STUDIO";
      passId: string;
      listingId: string;
      sessionId: string;
      pathProgramId: string;
    }
  | { kind: "MEMBER_CONTENT_LIBRARY"; pathProgramId: string };

export type HomePrimaryAction = {
  kind: HomeActionKind;
  reasonCode: string;
  target: HomeActionTarget;
  effectiveAt: string;
};
export type MemberHomeProjection = {
  state: HomeSceneState;
  student: PinerStudentSummary;
  primaryAction: HomePrimaryAction | null;
  nextTouchpoint: {
    sessionId: string;
    commitment: "CONFIRMED" | "COMMITTED" | "PENDING";
    scheduledStartsAt: string;
    scheduledEndsAt: string;
    pathProgramId: string;
  } | null;
  journey: {
    journeyId: string;
    pathProgramId: string;
    pathDisplayName: string;
    focusLabel: string;
    currentMilestoneLabel: string | null;
  } | null;
  recentOutcome: null;
  asOf: string;
  resolverVersion: string;
};

const JOURNEY_STATES = new Set<JourneyState>(["READY", "NO_ACTIVE_JOURNEY", "NO_SUPPORTED_PATH"]);
const HOME_STATES = new Set<HomeSceneState>(["READY", "NEUTRAL", "DEGRADED"]);
const HOME_ACTIONS = new Set<HomeActionKind>([
  "RECOVERY", "PHYSICAL_TOUCHPOINT", "VIEW_FRESH_OUTCOME",
  "CONTINUE_JOURNEY", "EXPLORE_RETURN", "VIEW_RETAINED_VALUE",
]);
export function parseJourneyProjection(value: unknown, expectedStudentId: string): MemberJourneyProjection | null {
  if (!isRecord(value) || !JOURNEY_STATES.has(value.state as JourneyState)) return null;
  if (!sameStudent(value.student, expectedStudentId)) return null;
  if (!Array.isArray(value.paths) || !Array.isArray(value.journeys) || typeof value.asOf !== "string") return null;
  return value as MemberJourneyProjection;
}

export function parseHomeProjection(value: unknown, expectedStudentId: string): MemberHomeProjection | null {
  if (!isRecord(value) || !HOME_STATES.has(value.state as HomeSceneState)) return null;
  if (!sameStudent(value.student, expectedStudentId)) return null;
  if (typeof value.asOf !== "string" || typeof value.resolverVersion !== "string") return null;
  if (value.primaryAction !== null) {
    if (!isRecord(value.primaryAction)) return null;
    if (!HOME_ACTIONS.has(value.primaryAction.kind as HomeActionKind)) return null;
    if (typeof value.primaryAction.reasonCode !== "string" || !isRecord(value.primaryAction.target)) return null;
  }
  if (value.nextTouchpoint !== null && !isRecord(value.nextTouchpoint)) return null;
  if (value.journey !== null && !isRecord(value.journey)) return null;
  return value as MemberHomeProjection;
}

export function projectionResponseIsCurrent(
  requestedStudentId: string,
  responseStudentId: string,
  activeStudentId: string,
  requestVersion: number,
  currentVersion: number,
): boolean {
  return requestedStudentId === responseStudentId
    && requestedStudentId === activeStudentId
    && requestVersion === currentVersion;
}
function sameStudent(value: unknown, expectedStudentId: string): boolean {
  return isRecord(value)
    && value.id === expectedStudentId
    && typeof value.displayName === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

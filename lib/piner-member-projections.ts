export type PinerStudentSummary = { id: string; displayName: string };
export type PinerParentSession = {
  principalType: "PARENT_USER";
  parent: { id: string; displayName: string };
  session: { id: string; issuedAt: string; expiresAt: string };
};

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

export type OwnerOpenStudioAdmissionResult = {
  claimId: string;
  reservation: { id: string; type: "BOOKING"; status: "CONFIRMED" };
  claimStatus: "RESERVED";
  listingId: string;
  session: { id: string };
  participantMode: "OWNER";
};
export type OwnerOpenStudioCancellationResult = {
  claimId: string;
  reservation: { id: string; type: "BOOKING"; status: "CANCELLED" };
  claimStatus: "RELEASED";
  listingId: string;
  session: { id: string };
  participantMode: "OWNER";
  cancellationResult: "RELEASED_CANCELLED";
};

export type OpenStudioExperienceType = "KHAM_PHA" | "CAO_CAP" | "CHUYEN_DE";
export type MemberOpenStudioExploreItem = {
  passId: string;
  listingId: string;
  experienceType: OpenStudioExperienceType;
  session: { id: string; localDate: string; scheduledStartsAt: string; scheduledEndsAt: string };
  path: { id: string; code: string; displayName: string };
  syllabus: { id: string; title: string };
};
export type MemberOpenStudioReservation = MemberOpenStudioExploreItem & {
  claimId: string;
  reservation: { id: string; type: "BOOKING"; status: string };
  claimStatus: "RESERVED";
};
export type MemberOpenStudioProjection = {
  student: PinerStudentSummary;
  opportunities: MemberOpenStudioExploreItem[];
  reservations: MemberOpenStudioReservation[];
  asOf: string;
};

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
const TOUCHPOINT_COMMITMENTS = new Set(["CONFIRMED", "COMMITTED", "PENDING"]);

export function parseOwnerOpenStudioAdmission(
  value: unknown,
  expectedListingId: string,
  expectedSessionId: string,
): OwnerOpenStudioAdmissionResult | null {
  if (!isRecord(value) || !canonicalId(value.claimId)) return null;
  if (value.claimStatus !== "RESERVED" || value.participantMode !== "OWNER") return null;
  if (value.listingId !== expectedListingId) return null;
  if (!isRecord(value.session) || value.session.id !== expectedSessionId) return null;
  if (!isRecord(value.reservation) || !canonicalId(value.reservation.id)) return null;
  if (value.reservation.type !== "BOOKING" || value.reservation.status !== "CONFIRMED") return null;
  return value as OwnerOpenStudioAdmissionResult;
}
export function parseOwnerOpenStudioCancellation(
  value: unknown,
  expectedClaimId: string,
  expectedListingId: string,
  expectedSessionId: string,
): OwnerOpenStudioCancellationResult | null {
  if (!isRecord(value) || value.claimId !== expectedClaimId) return null;
  if (value.claimStatus !== "RELEASED" || value.participantMode !== "OWNER") return null;
  if (value.listingId !== expectedListingId || value.cancellationResult !== "RELEASED_CANCELLED") return null;
  if (!isRecord(value.session) || value.session.id !== expectedSessionId) return null;
  if (!isRecord(value.reservation) || !canonicalId(value.reservation.id)) return null;
  if (value.reservation.type !== "BOOKING" || value.reservation.status !== "CANCELLED") return null;
  return value as OwnerOpenStudioCancellationResult;
}

export function parseMemberOpenStudioProjection(value: unknown, expectedStudentId: string): MemberOpenStudioProjection | null {
  if (!isRecord(value) || !sameStudent(value.student, expectedStudentId) || !isTimestamp(value.asOf)) return null;
  if (!Array.isArray(value.opportunities) || !value.opportunities.every(isOpenStudioExploreItem)) return null;
  if (!Array.isArray(value.reservations) || !value.reservations.every((item) => {
    if (!isOpenStudioExploreItem(item) || !isRecord(item)) return false;
    if (!canonicalId(item.claimId) || item.claimStatus !== "RESERVED") return false;
    return isRecord(item.reservation)
      && canonicalId(item.reservation.id)
      && item.reservation.type === "BOOKING"
      && nonEmptyString(item.reservation.status);
  })) return null;
  return value as MemberOpenStudioProjection;
}

export function parseParentSession(value: unknown): PinerParentSession | null {
  if (!isRecord(value) || value.principalType !== "PARENT_USER") return null;
  if (!isRecord(value.parent) || !canonicalId(value.parent.id) || !nonEmptyString(value.parent.displayName)) return null;
  if (!isRecord(value.session) || !canonicalId(value.session.id)) return null;
  if (!isTimestamp(value.session.issuedAt) || !isTimestamp(value.session.expiresAt)) return null;
  if (Date.parse(value.session.expiresAt) <= Date.parse(value.session.issuedAt)) return null;
  return value as PinerParentSession;
}

export function parseStudentList(value: unknown): PinerStudentSummary[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((item) => isRecord(item) && canonicalId(item.id) && nonEmptyString(item.displayName))) return null;
  const ids = new Set(value.map((item) => (item as { id: string }).id));
  if (ids.size !== value.length) return null;
  return value as PinerStudentSummary[];
}
export function parseJourneyProjection(value: unknown, expectedStudentId: string): MemberJourneyProjection | null {
  if (!isRecord(value) || !JOURNEY_STATES.has(value.state as JourneyState)) return null;
  if (!sameStudent(value.student, expectedStudentId) || !isTimestamp(value.asOf)) return null;
  if (!Array.isArray(value.paths) || !value.paths.every(isJourneyPathProjection)) return null;
  if (!Array.isArray(value.journeys) || !value.journeys.every(isJourneySummary)) return null;
  return value as MemberJourneyProjection;
}

export function parseHomeProjection(value: unknown, expectedStudentId: string): MemberHomeProjection | null {
  if (!isRecord(value) || !HOME_STATES.has(value.state as HomeSceneState)) return null;
  if (!sameStudent(value.student, expectedStudentId) || !isTimestamp(value.asOf) || !nonEmptyString(value.resolverVersion)) return null;
  if (value.primaryAction !== null && !isHomeAction(value.primaryAction)) return null;
  if (value.nextTouchpoint !== null && !isHomeTouchpoint(value.nextTouchpoint)) return null;
  if (value.journey !== null && !isHomeJourney(value.journey)) return null;
  if (value.recentOutcome !== null) return null;
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

function isJourneyPathProjection(value: unknown): boolean {
  return isRecord(value)
    && isPathIdentity(value.path)
    && (value.support === "SUPPORTED" || value.support === "UNSUPPORTED")
    && (value.unsupportedReason === null || typeof value.unsupportedReason === "string")
    && Array.isArray(value.journeys)
    && value.journeys.every(isJourneySummary);
}

function isJourneySummary(value: unknown): boolean {
  if (!isRecord(value) || !nonEmptyString(value.journeyId) || !isPathIdentity(value.path)) return false;
  if (!nonEmptyString(value.grammar) || !isRecord(value.focus) || !nonEmptyString(value.focus.id) || !nonEmptyString(value.focus.label)) return false;
  if (value.focus.note !== null && typeof value.focus.note !== "string") return false;
  if (!isRecord(value.progress) || !nonEmptyString(value.progress.kind)) return false;
  if (!nonNegativeInteger(value.progress.achievedMilestoneCount) || !nonNegativeInteger(value.progress.totalMilestoneCount)) return false;
  if (value.progress.achievedMilestoneCount > value.progress.totalMilestoneCount) return false;
  if (value.progress.currentMilestone !== null && !isMilestone(value.progress.currentMilestone)) return false;
  return value.lastRecognizedAt === null || isTimestamp(value.lastRecognizedAt);
}

function isMilestone(value: unknown): boolean {
  return isRecord(value) && positiveInteger(value.number) && nonEmptyString(value.code) && nonEmptyString(value.label);
}

function isPathIdentity(value: unknown): boolean {
  return isRecord(value) && nonEmptyString(value.id) && nonEmptyString(value.key) && nonEmptyString(value.displayName);
}

function isHomeAction(value: unknown): boolean {
  if (!isRecord(value) || !HOME_ACTIONS.has(value.kind as HomeActionKind)) return false;
  if (!nonEmptyString(value.reasonCode) || !isTimestamp(value.effectiveAt) || !isRecord(value.target)) return false;
  switch (value.kind as HomeActionKind) {
    case "RECOVERY":
      return value.target.kind === "MEMBER_CONTEXT" && nonEmptyString(value.target.recovery);
    case "PHYSICAL_TOUCHPOINT":
      return value.target.kind === "SESSION" && nonEmptyString(value.target.sessionId);
    case "VIEW_FRESH_OUTCOME":
      return value.target.kind === "LEARNER_OUTCOME" && nonEmptyString(value.target.outcomeId);
    case "CONTINUE_JOURNEY":
      return value.target.kind === "JOURNEY" && nonEmptyString(value.target.journeyId) && nonEmptyString(value.target.pathProgramId);
    case "EXPLORE_RETURN":
      return value.target.kind === "OPEN_STUDIO"
        && nonEmptyString(value.target.passId)
        && nonEmptyString(value.target.listingId)
        && nonEmptyString(value.target.sessionId)
        && nonEmptyString(value.target.pathProgramId);
    case "VIEW_RETAINED_VALUE":
      return value.target.kind === "MEMBER_CONTENT_LIBRARY" && nonEmptyString(value.target.pathProgramId);
  }
}

function isHomeTouchpoint(value: unknown): boolean {
  return isRecord(value)
    && nonEmptyString(value.sessionId)
    && TOUCHPOINT_COMMITMENTS.has(value.commitment as string)
    && isTimestamp(value.scheduledStartsAt)
    && isTimestamp(value.scheduledEndsAt)
    && nonEmptyString(value.pathProgramId);
}

function isHomeJourney(value: unknown): boolean {
  return isRecord(value)
    && nonEmptyString(value.journeyId)
    && nonEmptyString(value.pathProgramId)
    && nonEmptyString(value.pathDisplayName)
    && nonEmptyString(value.focusLabel)
    && (value.currentMilestoneLabel === null || typeof value.currentMilestoneLabel === "string");
}

function isOpenStudioExploreItem(value: unknown): boolean {
  if (!isRecord(value) || !canonicalId(value.passId) || !canonicalId(value.listingId)) return false;
  if (value.experienceType !== "KHAM_PHA" && value.experienceType !== "CAO_CAP" && value.experienceType !== "CHUYEN_DE") return false;
  if (!isRecord(value.session) || !canonicalId(value.session.id) || !nonEmptyString(value.session.localDate)) return false;
  if (!isTimestamp(value.session.scheduledStartsAt) || !isTimestamp(value.session.scheduledEndsAt)) return false;
  if (!isRecord(value.path) || !canonicalId(value.path.id) || !nonEmptyString(value.path.code) || !nonEmptyString(value.path.displayName)) return false;
  return isRecord(value.syllabus) && canonicalId(value.syllabus.id) && nonEmptyString(value.syllabus.title);
}

function sameStudent(value: unknown, expectedStudentId: string): boolean {
  return isRecord(value) && value.id === expectedStudentId && nonEmptyString(value.displayName);
}

function canonicalId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
}
function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}
function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function nonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}
function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

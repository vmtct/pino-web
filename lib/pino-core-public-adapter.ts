import { getPublicSessions } from "./open-studio-public";

const DEFAULT_CORE_BASE_URL = "https://pino-core-dev.minhtri-van42.workers.dev";

export type PinoCorePublicEnv = {
  PINO_CORE_BASE_URL?: string;
  PINO_CORE_REGISTRATION_ENABLED?: string;
};

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type LegacySession = {
  id?: string;
  topic?: string;
  path?: string | null;
  date?: string | null;
  availableSeats?: number | null;
  capacity?: number | null;
  confirmedCount?: number | null;
  syllabus?: {
    id?: string;
    name?: string;
    shortDescription?: string | null;
    skillSummary?: string | null;
  } | null;
};

const responseHeaders = (request: Request, cacheControl: string) => ({
  "Content-Type": "application/json",
  "Cache-Control": cacheControl,
  "Access-Control-Allow-Origin": new URL(request.url).origin,
});

const disabledResponse = (request: Request) => new Response(JSON.stringify({
  error: {
    code: "REGISTRATION_DISABLED",
    message: "Online registration is not available.",
  },
}), { status: 503, headers: responseHeaders(request, "no-store") });

export const registrationEnabled = (env: PinoCorePublicEnv) => env.PINO_CORE_REGISTRATION_ENABLED === "true";

const baseUrl = (env: PinoCorePublicEnv) => (env.PINO_CORE_BASE_URL || DEFAULT_CORE_BASE_URL).replace(/\/$/, "");

export const registrationCapability = (request: Request, env: PinoCorePublicEnv) => new Response(JSON.stringify({
  registrationEnabled: registrationEnabled(env),
}), { status: 200, headers: responseHeaders(request, "no-store") });

const normalizeLegacyStart = (value: string | null | undefined) => {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T18:00:00+07:00` : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const legacyPath = (value: string | null | undefined) => {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("little")) return { id: "legacy-little-piner", code: "little-piner", displayName: "Little Piner", ageMin: 4, ageMax: 6 };
  if (normalized.includes("piano") || normalized.includes("music")) return { id: "legacy-pianohouse", code: "piano-house", displayName: "PianoHouse", ageMin: 7, ageMax: 10 };
  return { id: "legacy-artchitect", code: "artchitect", displayName: "Artchitect", ageMin: 7, ageMax: 10 };
};

const toCoreSession = (session: LegacySession) => {
  if (!session.id) return null;
  const start = normalizeLegacyStart(session.date);
  if (!start) return null;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const path = legacyPath(session.path);
  const inferredRemaining = typeof session.availableSeats === "number"
    ? session.availableSeats
    : typeof session.capacity === "number"
      ? Math.max(0, session.capacity - (session.confirmedCount || 0))
      : 6;
  const remainingSeats = Math.max(0, Math.floor(inferredRemaining));
  const title = session.syllabus?.name?.trim() || session.topic?.trim() || "Open Studio";

  return {
    id: session.id,
    path: { id: path.id, code: path.code, displayName: path.displayName },
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    bookingClosesAt: start.toISOString(),
    timezone: "Asia/Ho_Chi_Minh",
    availability: { remainingSeats, isFull: remainingSeats <= 0 },
    access: { kind: "legacy-read-only", trialPremium: false },
    syllabus: {
      id: session.syllabus?.id || `legacy-syllabus-${session.id}`,
      title,
      shortDescription: session.syllabus?.shortDescription || null,
      publicDescription: session.syllabus?.shortDescription || null,
      skillSummary: session.syllabus?.skillSummary || null,
      ageMin: path.ageMin,
      ageMax: path.ageMax,
      thumbnailUrl: null,
      coverUrl: null,
    },
  };
};

async function legacyScheduleFallback(request: Request, env: PinoCorePublicEnv) {
  try {
    const legacyResponse = await getPublicSessions(env as any, new URLSearchParams({ type: "Open Studio" }));
    if (!legacyResponse.ok) return null;
    const legacyData = await legacyResponse.json() as { sessions?: LegacySession[] };
    const sessions = (Array.isArray(legacyData.sessions) ? legacyData.sessions : [])
      .map(toCoreSession)
      .filter((session): session is NonNullable<ReturnType<typeof toCoreSession>> => Boolean(session))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return new Response(JSON.stringify({ sessions }), {
      status: 200,
      headers: {
        ...responseHeaders(request, "public, max-age=30, stale-while-revalidate=120"),
        "X-PINO-Schedule-Source": "legacy-fallback",
      },
    });
  } catch {
    return null;
  }
}

export async function proxyCoreSessions(request: Request, env: PinoCorePublicEnv, fetcher: Fetcher = fetch) {
  try {
    const upstream = await fetcher(`${baseUrl(env)}/v1/open-studio/sessions`, {
      headers: { Accept: "application/json" },
      cf: { cacheEverything: true, cacheTtl: 60 },
    } as RequestInit);
    const body = await upstream.text();
    if (upstream.ok) {
      return new Response(body, {
        status: upstream.status,
        headers: {
          "Content-Type": upstream.headers.get("Content-Type") || "application/json",
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
          "Access-Control-Allow-Origin": new URL(request.url).origin,
          "X-PINO-Schedule-Source": "core",
        },
      });
    }

    const fallback = await legacyScheduleFallback(request, env);
    if (fallback) return fallback;

    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": new URL(request.url).origin,
      },
    });
  } catch {
    const fallback = await legacyScheduleFallback(request, env);
    if (fallback) return fallback;
    return new Response(JSON.stringify({ error: "Open Studio schedule is temporarily unavailable." }), {
      status: 502,
      headers: responseHeaders(request, "no-store"),
    });
  }
}

export async function proxyCoreRegistration(request: Request, env: PinoCorePublicEnv, fetcher: Fetcher = fetch) {
  // This check intentionally happens before the body is read or any upstream call is made.
  // Production remains safe while PINO_CORE_BASE_URL points at pino-core-dev.
  if (!registrationEnabled(env)) return disabledResponse(request);

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
  if (!idempotencyKey) {
    return new Response(JSON.stringify({ error: { code: "PLATFORM_INVALID_INPUT", message: "Idempotency-Key is required." } }), {
      status: 400,
      headers: responseHeaders(request, "no-store"),
    });
  }

  try {
    const body = await request.text();
    const upstream = await fetcher(`${baseUrl(env)}/v1/open-studio/registrations`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body,
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        ...responseHeaders(request, "no-store"),
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: { code: "UPSTREAM_UNAVAILABLE", message: "Registration is temporarily unavailable." } }), {
      status: 502,
      headers: responseHeaders(request, "no-store"),
    });
  }
}

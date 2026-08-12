import memberWorker from "./worker-member-v2";
import { getMember } from "./lib/member";
import { validateMemberBooking } from "./lib/member-booking-validation";

type Env = {
  ENVIRONMENT?: string;
  NOTION_TOKEN: string;
  NOTION_PARENT_DATA_SOURCE_ID: string;
  NOTION_STUDENT_DATA_SOURCE_ID: string;
  NOTION_OS_SESSION_DATA_SOURCE_ID: string;
  NOTION_OS_SESSION_DATABASE_ID?: string;
  NOTION_OS_BOOKING_DATA_SOURCE_ID: string;
  NOTION_OS_PASS_DATA_SOURCE_ID: string;
  NOTION_RUNNING_CLASS_DATA_SOURCE_ID: string;
  NOTION_PATH_PROGRAM_DATA_SOURCE_ID: string;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache, must-revalidate", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" } });
const notionHeaders = (env: Env, version = "2026-03-11") => ({ Authorization: `Bearer ${env.NOTION_TOKEN}`, "Content-Type": "application/json", "Notion-Version": version });
const isProduction = (env: Env) => (env.ENVIRONMENT || "production") === "production";
const text = (p: any) => p?.title?.[0]?.plain_text || p?.rich_text?.[0]?.plain_text || p?.select?.name || p?.status?.name || "";
const date = (p: any) => p?.date?.start || null;

async function querySessions(env: Env) {
  const body = "{}";
  const primary = await fetch(`https://api.notion.com/v1/data_sources/${env.NOTION_OS_SESSION_DATA_SOURCE_ID}/query`, { method: "POST", headers: notionHeaders(env), body });
  if (primary.ok) return primary;
  if (env.NOTION_OS_SESSION_DATABASE_ID) {
    return fetch(`https://api.notion.com/v1/databases/${env.NOTION_OS_SESSION_DATABASE_ID}/query`, { method: "POST", headers: notionHeaders(env, "2022-06-28"), body });
  }
  return primary;
}

async function notionPage(env: Env, pageId: string) {
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, { headers: notionHeaders(env) });
  if (!response.ok) return null;
  return await response.json() as any;
}

async function fallbackSessions(env: Env) {
  try {
    const response = await querySessions(env);
    if (!response.ok) return null;
    const data = await response.json() as any;
    const sessions = (data.results || []).map((page: any) => ({
      id: page.id,
      topic: text(page.properties?.Topic) || "Untitled session",
      type: text(page.properties?.Type),
      path: null,
      date: date(page.properties?.Date),
      capacity: null,
      confirmedCount: null,
      availableSeats: null,
    })).sort((a: any, b: any) => (a.date || "9999").localeCompare(b.date || "9999"));
    return json({ sessions });
  } catch {
    return null;
  }
}

function isMock(page: any) { return page?.properties?.["Mock Data"]?.checkbox === true; }

async function rejectMockSessionInProduction(env: Env, sessionId: string | null) {
  if (!isProduction(env) || !sessionId) return null;
  const page = await notionPage(env, sessionId);
  if (!page) return null;
  if (isMock(page)) return json({ error: "This session is not available in production." }, 404);
  return null;
}

async function filterProductionSessions(env: Env, response: Response, requestedId: string | null = null) {
  if (!isProduction(env)) return response;
  let payload: any;
  try { payload = await response.clone().json(); } catch { return response; }
  if (!Array.isArray(payload?.sessions)) return response;
  const sourceSessions: any[] = requestedId ? payload.sessions.filter((session: any) => session?.id === requestedId) : payload.sessions;
  const sessions: any[] = [];
  for (const session of sourceSessions) {
    const page = await notionPage(env, session.id);
    if (!page) { sessions.push(session); continue; }
    if (isMock(page)) continue;
    sessions.push(session);
  }
  if (requestedId && sessions.length === 0) return json({ error: "Session not found." }, 404);
  return json({ ...payload, sessions });
}

const handler = {
  async fetch(request: Request, env: Env) {
    if (request.method === "OPTIONS") return memberWorker.fetch(request, env as any);
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/member") {
      let body: any;
      try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
      const result = await getMember(env, typeof body?.phone === "string" ? body.phone : "");
      return result.ok ? json(result) : json(result, result.status);
    }

    if (request.method === "POST" && url.pathname === "/api/member/book/validate") {
      let body: any;
      try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
      const result = await validateMemberBooking(env, body);
      return result.ok ? json(result) : json(result, result.status);
    }

    if (isProduction(env) && url.pathname === "/api/os-sessions" && request.method === "GET") {
      let response: Response;
      try {
        response = await memberWorker.fetch(request, env as any);
      } catch {
        response = json({ error: "Could not load sessions." }, 502);
      }
      if (!response.ok && !url.searchParams.get("id")) {
        const fallback = await fallbackSessions(env);
        if (fallback) return fallback;
      }
      return filterProductionSessions(env, response, url.searchParams.get("id"));
    }

    if (isProduction(env) && request.method === "POST" && (url.pathname === "/api/member/book" || url.pathname === "/api/open-studio/book")) {
      let body: any = null;
      try { body = await request.clone().json(); } catch { body = null; }
      const sessionId = typeof body?.sessionId === "string" ? body.sessionId : typeof body?.osSessionId === "string" ? body.osSessionId : typeof body?.session === "string" ? body.session : null;
      const blocked = await rejectMockSessionInProduction(env, sessionId);
      if (blocked) return blocked;
    }

    return memberWorker.fetch(request, env as any);
  },
};

export default handler;

import memberWorker from "./worker-member-v2";

type Env = {
  ENVIRONMENT?: string;
  NOTION_TOKEN: string;
  NOTION_OS_SESSION_DATA_SOURCE_ID: string;
  NOTION_OS_BOOKING_DATA_SOURCE_ID: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });

const notionHeaders = (env: Env) => ({
  Authorization: `Bearer ${env.NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2026-03-11",
});

const isProduction = (env: Env) => (env.ENVIRONMENT || "production") === "production";

async function notionPage(env: Env, pageId: string) {
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: notionHeaders(env),
  });
  if (!response.ok) return null;
  return (await response.json()) as any;
}

async function notionQuery(env: Env, dataSourceId: string, filter: unknown) {
  const response = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
    method: "POST",
    headers: notionHeaders(env),
    body: JSON.stringify({ filter }),
  });
  if (response.ok) return response;
  return null;
}

function isMock(page: any) {
  return page?.properties?.["Mock Data"]?.checkbox === true;
}

async function rejectMockSessionInProduction(env: Env, sessionId: string | null) {
  if (!isProduction(env) || !sessionId) return null;
  const page = await notionPage(env, sessionId);
  if (!page) return null;
  if (isMock(page)) {
    return json({ error: "This session is not available in production." }, 404);
  }
  return null;
}

async function filterProductionSessions(env: Env, response: Response) {
  if (!isProduction(env)) return response;

  let payload: any;
  try {
    payload = await response.clone().json();
  } catch {
    return response;
  }

  if (!Array.isArray(payload?.sessions)) return response;

  const sessions: any[] = [];
  for (const session of payload.sessions) {
    const page = await notionPage(env, session.id);
    if (!page) {
      return json({ error: "Could not validate production session data." }, 502);
    }
    if (isMock(page)) continue;

    const bookingResponse = await notionQuery(env, env.NOTION_OS_BOOKING_DATA_SOURCE_ID, {
      and: [
        { property: "OS Session", relation: { contains: session.id } },
        { property: "Status", select: { equals: "Confirmed" } },
        { property: "Mock Data", checkbox: { equals: false } },
      ],
    });

    if (!bookingResponse) {
      return json({ error: "Could not validate production booking data." }, 502);
    }

    const bookingData = (await bookingResponse.json()) as any;
    const confirmedCount = bookingData.results?.length || 0;
    sessions.push({
      ...session,
      confirmedCount,
      availableSeats:
        typeof session.capacity === "number"
          ? Math.max(0, session.capacity - confirmedCount)
          : session.availableSeats,
    });
  }

  return json({ ...payload, sessions });
}

const handler = {
  async fetch(request: Request, env: Env) {
    if (request.method === "OPTIONS") {
      return memberWorker.fetch(request, env as any);
    }

    const url = new URL(request.url);

    if (isProduction(env) && url.pathname === "/api/os-sessions" && request.method === "GET") {
      const response = await memberWorker.fetch(request, env as any);
      return filterProductionSessions(env, response);
    }

    if (
      isProduction(env) &&
      request.method === "POST" &&
      (url.pathname === "/api/member/book" || url.pathname === "/api/open-studio/book")
    ) {
      let body: any = null;
      try {
        body = await request.clone().json();
      } catch {
        body = null;
      }
      const sessionId =
        typeof body?.sessionId === "string"
          ? body.sessionId
          : typeof body?.osSessionId === "string"
            ? body.osSessionId
            : typeof body?.session === "string"
              ? body.session
              : null;
      const blocked = await rejectMockSessionInProduction(env, sessionId);
      if (blocked) return blocked;
    }

    return memberWorker.fetch(request, env as any);
  },
};

export default handler;

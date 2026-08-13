import memberWorker from "./worker-member";
import { createPublicBooking, getPublicSessions } from "./lib/open-studio-public";
import { getWebContent } from "./lib/web-content";
import { getWebImages } from "./lib/web-images";
import { WORKER_BUILD_INFO } from "./worker-build-info";

type Env = Record<string, any>;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    "Access-Control-Allow-Origin": "*",
  },
});

const PINO_CORE_OPEN_STUDIO_SESSIONS = "https://pino-core-dev.minhtri-van42.workers.dev/v1/open-studio/sessions";

async function getCoreOpenStudioSessions(request: Request) {
  try {
    const upstream = await fetch(PINO_CORE_OPEN_STUDIO_SESSIONS, {
      headers: { Accept: "application/json" },
      cf: { cacheEverything: true, cacheTtl: 60 },
    } as RequestInit);
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
        "Cache-Control": upstream.ok ? "public, max-age=60, stale-while-revalidate=300" : "no-store",
        "Access-Control-Allow-Origin": new URL(request.url).origin,
      },
    });
  } catch {
    return json({ error: "Open Studio schedule is temporarily unavailable." }, 502);
  }
}

const handler = {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/build-info.json") return json(WORKER_BUILD_INFO);
    if (request.method === "GET" && url.pathname === "/api/pino-core/open-studio/sessions") return getCoreOpenStudioSessions(request);
    if (request.method === "GET" && url.pathname === "/api/os-sessions") return getPublicSessions(env as any, url.searchParams);
    if (request.method === "GET" && url.pathname === "/api/web-content") {
      try { return json({ content: await getWebContent(env as any) }); }
      catch { return json({ error: "Could not load web content." }, 502); }
    }
    if (request.method === "GET" && url.pathname === "/api/web-images") {
      try { return json({ images: await getWebImages(env as any) }); }
      catch { return json({ error: "Could not load web images." }, 502); }
    }
    if (request.method === "POST" && url.pathname === "/api/open-studio/book") {
      let body: any;
      try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: "Invalid request." }), { status: 400, headers: { "Content-Type": "application/json" } }); }
      if (typeof body?.studentId === "string" && body.studentId.trim() && typeof body?.passId === "string" && body.passId.trim()) return memberWorker.fetch(request, env as any);
      const phone = typeof body?.phone === "string" ? body.phone : typeof body?.zaloPhone === "string" ? body.zaloPhone : "";
      const sessionId = typeof body?.sessionId === "string" ? body.sessionId : typeof body?.session === "string" ? body.session : "";
      return createPublicBooking(env as any, phone.trim(), sessionId.trim());
    }
    return memberWorker.fetch(request, env as any);
  },
};

export default handler;

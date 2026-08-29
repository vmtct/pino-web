import memberWorker from "./worker-member";
import { createPublicBooking, getPublicSessions } from "./lib/open-studio-public";
import { createOpenStudioHoldRequest } from "./lib/open-studio-hold-request";
import { getWebContent } from "./lib/web-content";
import { getWebImages } from "./lib/web-images";
import { WORKER_BUILD_INFO } from "./worker-build-info";
import { proxyCoreRegistration, proxyCoreSessions, registrationCapability } from "./lib/pino-core-public-adapter";
import { proxyPinerMemberRequest } from "./lib/piner-member-core-adapter";

type Env = Record<string, any>;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    "Access-Control-Allow-Origin": "*",
  },
});

const cmsJson = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=60, stale-while-revalidate=240",
    "Access-Control-Allow-Origin": "*",
  },
});

const handler = {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/build-info.json") return json(WORKER_BUILD_INFO);
    if (url.pathname.startsWith("/api/piner/")) return proxyPinerMemberRequest(request, env);
    if (request.method === "GET" && url.pathname === "/api/pino-core/open-studio/sessions") return proxyCoreSessions(request, env);
    if (request.method === "GET" && url.pathname === "/api/pino-core/open-studio/capabilities") return registrationCapability(request, env);
    if (request.method === "POST" && url.pathname === "/api/pino-core/open-studio/registrations") return proxyCoreRegistration(request, env);
    if (request.method === "POST" && url.pathname === "/api/open-studio/hold-request") return createOpenStudioHoldRequest(request, env as any);
    if (request.method === "GET" && url.pathname === "/api/os-sessions") return getPublicSessions(env as any, url.searchParams);
    if (request.method === "GET" && url.pathname === "/api/web-content") {
      try { return cmsJson({ content: await getWebContent(env as any) }); }
      catch { return cmsJson({ error: "Could not load web content." }, 502); }
    }
    if (request.method === "GET" && url.pathname === "/api/web-images") {
      try { return cmsJson({ images: await getWebImages(env as any) }); }
      catch { return cmsJson({ error: "Could not load web images." }, 502); }
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

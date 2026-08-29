import { proxyPinerMemberRequest, type ParentMemberCoreBinding } from "./lib/piner-member-core-adapter.ts";
import { redeemPinerHandoffRequest, type PinerHandoffCoreBinding } from "./lib/piner-handoff-adapter.ts";
import { WORKER_BUILD_INFO } from "./worker-build-info.ts";

interface PinerAssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface PinerEnv {
  PINO_MEMBER_CORE?: ParentMemberCoreBinding;
  PINO_PINER_HANDOFF?: PinerHandoffCoreBinding;
  ASSETS: PinerAssetsBinding;
}

const noStoreJson = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  },
});

function assetRequest(request: Request, pathname: string): Request {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return new Request(url, request);
}
const handler = {
  async fetch(request: Request, env: PinerEnv): Promise<Response> {
    const url = new URL(request.url);

    const handoff = await redeemPinerHandoffRequest(request, env);
    if (handoff) return handoff;

    if (request.method === "GET" && url.pathname === "/build-info.json") {
      return noStoreJson(WORKER_BUILD_INFO);
    }
    if (url.pathname.startsWith("/api/piner/")) {
      return proxyPinerMemberRequest(request, env);
    }
    if (url.pathname.startsWith("/api/")) {
      return noStoreJson({ error: { code: "PINER_OPERATION_NOT_FOUND", message: "Piner operation not found" } }, 404);
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return noStoreJson({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
    }
    if (url.pathname === "/" || url.pathname === "/piner" || url.pathname === "/piner/") {
      return env.ASSETS.fetch(assetRequest(request, "/piner"));
    }
    if (url.pathname.startsWith("/_next/")) {
      return env.ASSETS.fetch(request);
    }
    return noStoreJson({ error: { code: "PINER_SURFACE_NOT_FOUND", message: "Piner surface not found" } }, 404);
  },
};

export default handler;

export interface ParentMemberCoreBinding {
  fetch(request: Request): Promise<Response>;
}

export interface PinerMemberCoreEnv {
  PINO_MEMBER_CORE?: ParentMemberCoreBinding;
}

type RouteContract = {
  method: "GET" | "POST";
  upstreamPath: string;
};

const ROUTES: Readonly<Record<string, RouteContract>> = Object.freeze({
  "/api/piner/auth/login": { method: "POST", upstreamPath: "/v1/parent-auth/pin/login" },
  "/api/piner/auth/change-pin": { method: "POST", upstreamPath: "/v1/parent-auth/pin/change" },
  "/api/piner/session": { method: "GET", upstreamPath: "/v1/member/session" },
  "/api/piner/logout": { method: "POST", upstreamPath: "/v1/member/session/logout" },
  "/api/piner/students": { method: "GET", upstreamPath: "/v1/member/students" },
});

const json = (body: unknown, status: number) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  },
});

function forwardedHeaders(request: Request): Headers {
  const headers = new Headers();
  for (const name of ["authorization", "content-type", "accept"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

function downstreamHeaders(response: Response): Headers {
  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const name of ["content-type", "x-request-id", "retry-after", "www-authenticate"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

/**
 * Private Piner BFF seam.
 *
 * The /api/piner namespace is deliberately fail-closed and must never fall
 * through to the legacy member/Notion worker. Only explicitly governed Core
 * operations are mapped here.
 */
export async function proxyPinerMemberRequest(request: Request, env: PinerMemberCoreEnv): Promise<Response> {
  const url = new URL(request.url);
  const contract = ROUTES[url.pathname];

  if (!contract) {
    return json({ error: { code: "PINER_OPERATION_NOT_FOUND", message: "Piner operation not found" } }, 404);
  }
  if (request.method !== contract.method) {
    return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
  }
  if (!env.PINO_MEMBER_CORE) {
    return json({ error: { code: "PINER_MEMBER_CORE_UNAVAILABLE", message: "Member service is unavailable" } }, 503);
  }

  const body = request.method === "GET" ? undefined : await request.arrayBuffer();
  const upstream = new Request(`https://pino-member-core.internal${contract.upstreamPath}${url.search}`, {
    method: contract.method,
    headers: forwardedHeaders(request),
    body,
  });

  const response = await env.PINO_MEMBER_CORE.fetch(upstream);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: downstreamHeaders(response),
  });
}

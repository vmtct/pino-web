export interface ParentMemberCoreBinding {
  fetch(request: Request): Promise<Response>;
}

export interface PinerMemberCoreEnv {
  PINO_MEMBER_CORE?: ParentMemberCoreBinding;
}

type AuthMode = "none" | "session" | "pin-change";
type AuthResult = "login" | "full-session" | "none";
type RouteContract = {
  method: "GET" | "POST";
  upstreamPath: string;
  auth: AuthMode;
  result: AuthResult;
  body: "forward" | "none";
};

const SESSION_COOKIE = "__Host-piner_session";
const PIN_CHANGE_COOKIE = "__Host-piner_pin_change";
const COOKIE_ATTRIBUTES = "Path=/; HttpOnly; Secure; SameSite=Lax";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const STATIC_ROUTES: Readonly<Record<string, RouteContract>> = Object.freeze({
  "/api/piner/auth/login": {
    method: "POST",
    upstreamPath: "/v1/parent-auth/pin/login",
    auth: "none",
    result: "login",
    body: "forward",
  },
  "/api/piner/auth/change-pin": {
    method: "POST",
    upstreamPath: "/v1/parent-auth/pin/change",
    auth: "pin-change",
    result: "full-session",
    body: "forward",
  },
  "/api/piner/session": {
    method: "GET",
    upstreamPath: "/v1/member/session",
    auth: "session",
    result: "none",
    body: "none",
  },
  "/api/piner/logout": {
    method: "POST",
    upstreamPath: "/v1/member/session/logout",
    auth: "session",
    result: "none",
    body: "none",
  },
  "/api/piner/students": {
    method: "GET",
    upstreamPath: "/v1/member/students",
    auth: "session",
    result: "none",
    body: "none",
  },
});

function routeFor(pathname: string): RouteContract | null {
  const exact = STATIC_ROUTES[pathname];
  if (exact) return exact;

  const admission = /^\/api\/piner\/students\/([^/]+)\/open-studio\/admissions$/.exec(pathname);
  if (admission) {
    return {
      method: "POST",
      upstreamPath: `/v1/member/students/${admission[1]}/open-studio/admissions`,
      auth: "session",
      result: "none",
      body: "forward",
    };
  }
  const pianoPractice = /^\/api\/piner\/students\/([0-9a-f-]{36})\/piano\/practice-resources\/([0-9a-f-]{36})$/.exec(pathname);
  if (pianoPractice) {
    return {
      method: "GET",
      upstreamPath: pathname.replace(/^\/api\/piner/, "/v1/member"),
      auth: "session",
      result: "none",
      body: "none",
    };
  }
  const protectedPracticeMedia = /^\/api\/piner\/students\/([0-9a-f-]{36})\/piano\/practice-resources\/([0-9a-f-]{36})\/pages\/([0-9a-f-]{36})\/media\/(SHEET|WORKSHEET)$/.exec(pathname);
  if (protectedPracticeMedia) {
    return {
      method: "GET",
      upstreamPath: pathname.replace(/^\/api\/piner/, "/v1/member"),
      auth: "session",
      result: "none",
      body: "none",
    };
  }
  const projection = /^\/api\/piner\/students\/([^/]+)\/(journey|home)$/.exec(pathname);
  if (!projection) return null;
  const [, studentId, resource] = projection;
  return {
    method: "GET",
    upstreamPath: `/v1/member/students/${studentId}/${resource}`,
    auth: "session",
    result: "none",
    body: "none",
  };
}

const json = (body: unknown, status: number, headers = new Headers()) => {
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
};

function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [cookieName, ...rest] = part.trim().split("=");
    if (cookieName === name) return rest.join("=");
  }
  return null;
}

function requiredToken(request: Request, auth: AuthMode): string | null {
  if (auth === "none") return null;
  const name = auth === "session" ? SESSION_COOKIE : PIN_CHANGE_COOKIE;
  const token = readCookie(request, name);
  return token && TOKEN_PATTERN.test(token) ? token : null;
}

function forwardedHeaders(request: Request, token: string | null): Headers {
  const headers = new Headers();
  for (const name of ["content-type", "accept", "idempotency-key"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (token) headers.set("authorization", `Bearer ${token}`);
  return headers;
}

function downstreamHeaders(response: Response): Headers {
  const upstreamCacheControl = response.headers.get("cache-control");
  const headers = new Headers({
    "Cache-Control": upstreamCacheControl === "private, no-store" ? upstreamCacheControl : "no-store",
  });
  for (const name of ["content-type", "content-length", "x-content-type-options", "x-request-id", "retry-after", "www-authenticate"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

function sessionCookie(token: string, expiresAt: string): string {
  return `${SESSION_COOKIE}=${token}; Expires=${new Date(expiresAt).toUTCString()}; ${COOKIE_ATTRIBUTES}`;
}

function pinChangeCookie(token: string, expiresAt: string): string {
  return `${PIN_CHANGE_COOKIE}=${token}; Expires=${new Date(expiresAt).toUTCString()}; ${COOKIE_ATTRIBUTES}`;
}

function clearCookie(name: string): string {
  return `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${COOKIE_ATTRIBUTES}`;
}

function authRequired(auth: Exclude<AuthMode, "none">): Response {
  const headers = new Headers();
  headers.append("Set-Cookie", clearCookie(auth === "session" ? SESSION_COOKIE : PIN_CHANGE_COOKIE));
  return json({ error: { code: "PINER_AUTH_REQUIRED", message: "Member authentication is required" } }, 401, headers);
}

async function translateAuthSuccess(response: Response, result: Exclude<AuthResult, "none">): Promise<Response> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return json({ error: { code: "PINER_MEMBER_AUTH_RESPONSE_INVALID", message: "Member authentication response is invalid" } }, 502, downstreamHeaders(response));
  }

  const data = payload && typeof payload === "object" && "data" in payload
    ? (payload as { data?: Record<string, unknown> }).data
    : undefined;
  const authState = data?.authState;
  const token = data?.token;
  const expiresAt = data?.expiresAt;
  const expires = typeof expiresAt === "string" ? Date.parse(expiresAt) : Number.NaN;

  if (
    typeof authState !== "string"
    || typeof token !== "string"
    || !TOKEN_PATTERN.test(token)
    || typeof expiresAt !== "string"
    || !Number.isFinite(expires)
  ) {
    return json({ error: { code: "PINER_MEMBER_AUTH_RESPONSE_INVALID", message: "Member authentication response is invalid" } }, 502, downstreamHeaders(response));
  }

  const headers = downstreamHeaders(response);
  if (result === "login" && authState === "PIN_CHANGE_REQUIRED") {
    headers.append("Set-Cookie", pinChangeCookie(token, expiresAt));
    headers.append("Set-Cookie", clearCookie(SESSION_COOKIE));
  } else if (authState === "AUTHENTICATED") {
    headers.append("Set-Cookie", sessionCookie(token, expiresAt));
    headers.append("Set-Cookie", clearCookie(PIN_CHANGE_COOKIE));
  } else {
    return json({ error: { code: "PINER_MEMBER_AUTH_RESPONSE_INVALID", message: "Member authentication response is invalid" } }, 502, headers);
  }

  const sanitized = Object.fromEntries(Object.entries(data ?? {}).filter(([key]) => key !== "token" && key !== "tokenType"));
  return json({ data: sanitized }, response.status, headers);
}

/**
 * Private Piner BFF seam.
 *
 * The /api/piner namespace is deliberately fail-closed and must never fall
 * through to the legacy member/Notion worker. Core bearer tokens are converted
 * into same-origin HttpOnly cookies and are never returned to browser JS.
 */
export async function proxyPinerMemberRequest(request: Request, env: PinerMemberCoreEnv): Promise<Response> {
  const url = new URL(request.url);
  const contract = routeFor(url.pathname);

  if (!contract) {
    return json({ error: { code: "PINER_OPERATION_NOT_FOUND", message: "Piner operation not found" } }, 404);
  }
  if (request.method !== contract.method) {
    return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
  }

  const token = requiredToken(request, contract.auth);
  if (contract.auth !== "none" && !token) return authRequired(contract.auth);
  if (!env.PINO_MEMBER_CORE) {
    return json({ error: { code: "PINER_MEMBER_CORE_UNAVAILABLE", message: "Member service is unavailable" } }, 503);
  }

  const body = contract.body === "forward" ? await request.arrayBuffer() : undefined;
  const upstream = new Request(`https://pino-member-core.internal${contract.upstreamPath}${url.search}`, {
    method: contract.method,
    headers: forwardedHeaders(request, token),
    body,
  });

  const response = await env.PINO_MEMBER_CORE.fetch(upstream);
  if (response.ok && contract.result !== "none") return translateAuthSuccess(response, contract.result);

  const headers = downstreamHeaders(response);
  if (response.status === 401 && contract.auth !== "none") {
    headers.append("Set-Cookie", clearCookie(contract.auth === "session" ? SESSION_COOKIE : PIN_CHANGE_COOKIE));
  }
  if (response.ok && url.pathname === "/api/piner/logout") {
    headers.append("Set-Cookie", clearCookie(SESSION_COOKIE));
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

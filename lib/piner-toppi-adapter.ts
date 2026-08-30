export interface ToppiMemberBinding {
  fetch(request: Request): Promise<Response>;
}

export interface PinerToppiEnv {
  TOPPI_MEMBER?: ToppiMemberBinding;
}

const SESSION_COOKIE = "__Host-piner_session";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const COOKIE_ATTRIBUTES = "Path=/; HttpOnly; Secure; SameSite=Lax";

function readCookie(request: Request, name: string) {
  const raw = request.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [cookieName, ...rest] = part.trim().split("=");
    if (cookieName === name) return rest.join("=");
  }
  return "";
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${COOKIE_ATTRIBUTES}`;
}

function json(body: unknown, status: number, headers = new Headers()) {
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
}
function downstreamHeaders(response: Response) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const name of ["content-type", "x-request-id", "retry-after"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

export function isPinerToppiPath(pathname: string) {
  return /^\/api\/piner\/students\/[^/]+\/toppi$/.test(pathname);
}

export async function proxyPinerToppiRequest(request: Request, env: PinerToppiEnv) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/piner\/students\/([^/]+)\/toppi$/);
  if (!match) return json({ error: { code: "PINER_TOPPI_OPERATION_NOT_FOUND", message: "Toppi operation not found" } }, 404);
  if (request.method !== "GET") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);

  const token = readCookie(request, SESSION_COOKIE);
  if (!TOKEN_PATTERN.test(token)) {
    const headers = new Headers();
    headers.append("Set-Cookie", clearSessionCookie());
    return json({ error: { code: "PINER_AUTH_REQUIRED", message: "Member authentication is required" } }, 401, headers);
  }
  if (!env.TOPPI_MEMBER) {
    return json({ error: { code: "PINER_TOPPI_UNAVAILABLE", message: "Toppi is unavailable" } }, 503);
  }
  const upstreamPath = `/api/v1/integrations/piner/member/students/${encodeURIComponent(match[1])}/progress`;
  let response: Response;
  try {
    response = await env.TOPPI_MEMBER.fetch(new Request(`https://toppi-member.internal${upstreamPath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }));
  } catch {
    return json({ error: { code: "PINER_TOPPI_UNAVAILABLE", message: "Toppi is unavailable" } }, 503);
  }

  const headers = downstreamHeaders(response);
  if (response.status === 401) headers.append("Set-Cookie", clearSessionCookie());
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

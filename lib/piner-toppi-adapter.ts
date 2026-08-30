export interface ToppiMemberBinding {
  fetch(request: Request): Promise<Response>;
}
export interface PinerToppiEnv {
  TOPPI_MEMBER?: ToppiMemberBinding;
}

const SESSION_COOKIE = "__Host-piner_session";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{16,128}$/;
const COOKIE_ATTRIBUTES = "Path=/; HttpOnly; Secure; SameSite=Lax";

type ToppiOperation = "progress" | "practice" | "complete";

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
function operation(pathname: string): { studentId: string; kind: ToppiOperation } | null {
  let match = pathname.match(/^\/api\/piner\/students\/([^/]+)\/toppi$/);
  if (match) return { studentId: match[1], kind: "progress" };
  match = pathname.match(/^\/api\/piner\/students\/([^/]+)\/toppi\/practice$/);
  if (match) return { studentId: match[1], kind: "practice" };
  match = pathname.match(/^\/api\/piner\/students\/([^/]+)\/toppi\/practice\/completions$/);
  if (match) return { studentId: match[1], kind: "complete" };
  return null;
}
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

export function isPinerToppiPath(pathname: string) {
  return operation(pathname) !== null;
}

export async function proxyPinerToppiRequest(request: Request, env: PinerToppiEnv) {
  const url = new URL(request.url);
  const route = operation(url.pathname);
  if (!route) return json({ error: { code: "PINER_TOPPI_OPERATION_NOT_FOUND", message: "Toppi operation not found" } }, 404);
  if (route.kind !== "complete" && request.method !== "GET") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
  if (route.kind === "complete" && request.method !== "POST") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
  const token = readCookie(request, SESSION_COOKIE);
  if (!TOKEN_PATTERN.test(token)) {
    const headers = new Headers();
    headers.append("Set-Cookie", clearSessionCookie());
    return json({ error: { code: "PINER_AUTH_REQUIRED", message: "Member authentication is required" } }, 401, headers);
  }
  if (!env.TOPPI_MEMBER) return json({ error: { code: "PINER_TOPPI_UNAVAILABLE", message: "Toppi is unavailable" } }, 503);

  const suffix = route.kind === "progress" ? "progress" : route.kind === "practice" ? "practice" : "practice/completions";
  const upstreamPath = `/api/v1/integrations/piner/member/students/${encodeURIComponent(route.studentId)}/${suffix}`;
  const headers = new Headers({ Authorization: `Bearer ${token}`, Accept: "application/json" });
  let body: ArrayBuffer | undefined;
  if (route.kind === "complete") {
    if (!sameOrigin(request)) return json({ error: { code: "PINER_ORIGIN_REQUIRED", message: "Same-origin request required" } }, 403);
    const key = request.headers.get("Idempotency-Key") ?? "";
    if (!IDEMPOTENCY_PATTERN.test(key)) return json({ error: { code: "IDEMPOTENCY_KEY_REQUIRED", message: "Idempotency-Key required" } }, 400);
    const contentType = request.headers.get("Content-Type") ?? "";
    const maxBytes = contentType.toLowerCase().startsWith("multipart/form-data") ? 6 * 1024 * 1024
      : contentType.toLowerCase().startsWith("application/json") ? 8192 : 0;
    if (!maxBytes) return json({ error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Unsupported Practice submission" } }, 415);
    body = await request.arrayBuffer();
    if (body.byteLength < 1 || body.byteLength > maxBytes) return json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Practice completion payload too large" } }, 413);
    headers.set("Content-Type", contentType);
    headers.set("Idempotency-Key", key);
  }
  let response: Response;
  try {
    response = await env.TOPPI_MEMBER.fetch(new Request(`https://toppi-member.internal${upstreamPath}`, {
      method: request.method,
      headers,
      body,
    }));
  } catch {
    return json({ error: { code: "PINER_TOPPI_UNAVAILABLE", message: "Toppi is unavailable" } }, 503);
  }
  const outgoing = downstreamHeaders(response);
  if (response.status === 401) outgoing.append("Set-Cookie", clearSessionCookie());
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: outgoing });
}

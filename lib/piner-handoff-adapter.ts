export interface PinerHandoffCoreBinding {
  redeemPinerHandoff(request: { token: string }): Promise<{
    token: string;
    expiresAt: string;
    parentUserId: string;
    selectedStudentId: string;
  }>;
}

export interface PinerHandoffEnv {
  PINO_PINER_HANDOFF?: PinerHandoffCoreBinding;
}

const SESSION_COOKIE = "__Host-piner_session";
const PIN_CHANGE_COOKIE = "__Host-piner_pin_change";
const COOKIE_ATTRIBUTES = "Path=/; HttpOnly; Secure; SameSite=Lax";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const HANDOFF_PATH = /^\/handoff\/([A-Za-z0-9_-]{43})$/;

function sessionCookie(token: string, expiresAt: string): string {
  return `${SESSION_COOKIE}=${token}; Expires=${new Date(expiresAt).toUTCString()}; ${COOKIE_ATTRIBUTES}`;
}

function clearCookie(name: string): string {
  return `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${COOKIE_ATTRIBUTES}`;
}
function errorResponse(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function redeemPinerHandoffRequest(request: Request, env: PinerHandoffEnv): Promise<Response | null> {
  const url = new URL(request.url);
  const match = HANDOFF_PATH.exec(url.pathname);
  if (!match) return null;
  if (request.method !== "GET") return errorResponse(405, "METHOD_NOT_ALLOWED", "Method not allowed");
  if (!env.PINO_PINER_HANDOFF) {
    return errorResponse(503, "PINER_HANDOFF_UNAVAILABLE", "Piner handoff is unavailable");
  }

  const handoffToken = match[1]!;
  try {
    const redeemed = await env.PINO_PINER_HANDOFF.redeemPinerHandoff({ token: handoffToken });
    if (!TOKEN_PATTERN.test(redeemed.token) || !Number.isFinite(Date.parse(redeemed.expiresAt))) {
      return errorResponse(502, "PINER_HANDOFF_RESPONSE_INVALID", "Piner handoff response is invalid");
    }
    const headers = new Headers({
      Location: "/piner",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    });
    headers.append("Set-Cookie", sessionCookie(redeemed.token, redeemed.expiresAt));
    headers.append("Set-Cookie", clearCookie(PIN_CHANGE_COOKIE));
    return new Response(null, { status: 303, headers });
  } catch {
    return errorResponse(401, "PINER_HANDOFF_INVALID", "Piner handoff is invalid or expired");
  }
}

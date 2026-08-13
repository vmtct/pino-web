const DEFAULT_CORE_BASE_URL = "https://pino-core-dev.minhtri-van42.workers.dev";

export type PinoCorePublicEnv = {
  PINO_CORE_BASE_URL?: string;
  PINO_CORE_REGISTRATION_ENABLED?: string;
};

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const responseHeaders = (request: Request, cacheControl: string) => ({
  "Content-Type": "application/json",
  "Cache-Control": cacheControl,
  "Access-Control-Allow-Origin": new URL(request.url).origin,
});

const disabledResponse = (request: Request) => new Response(JSON.stringify({
  error: {
    code: "REGISTRATION_DISABLED",
    message: "Online registration is not available.",
  },
}), { status: 503, headers: responseHeaders(request, "no-store") });

export const registrationEnabled = (env: PinoCorePublicEnv) => env.PINO_CORE_REGISTRATION_ENABLED === "true";

const baseUrl = (env: PinoCorePublicEnv) => (env.PINO_CORE_BASE_URL || DEFAULT_CORE_BASE_URL).replace(/\/$/, "");

export const registrationCapability = (request: Request, env: PinoCorePublicEnv) => new Response(JSON.stringify({
  registrationEnabled: registrationEnabled(env),
}), { status: 200, headers: responseHeaders(request, "no-store") });

export async function proxyCoreSessions(request: Request, env: PinoCorePublicEnv, fetcher: Fetcher = fetch) {
  try {
    const upstream = await fetcher(`${baseUrl(env)}/v1/open-studio/sessions`, {
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
    return new Response(JSON.stringify({ error: "Open Studio schedule is temporarily unavailable." }), {
      status: 502,
      headers: responseHeaders(request, "no-store"),
    });
  }
}

export async function proxyCoreRegistration(request: Request, env: PinoCorePublicEnv, fetcher: Fetcher = fetch) {
  // This check intentionally happens before the body is read or any upstream call is made.
  // Production remains safe while PINO_CORE_BASE_URL points at pino-core-dev.
  if (!registrationEnabled(env)) return disabledResponse(request);

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
  if (!idempotencyKey) {
    return new Response(JSON.stringify({ error: { code: "PLATFORM_INVALID_INPUT", message: "Idempotency-Key is required." } }), {
      status: 400,
      headers: responseHeaders(request, "no-store"),
    });
  }

  try {
    const body = await request.text();
    const upstream = await fetcher(`${baseUrl(env)}/v1/open-studio/registrations`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body,
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        ...responseHeaders(request, "no-store"),
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: { code: "UPSTREAM_UNAVAILABLE", message: "Registration is temporarily unavailable." } }), {
      status: 502,
      headers: responseHeaders(request, "no-store"),
    });
  }
}

type AssetFetcher = { fetch(request: Request): Promise<Response> };

type R2ObjectBodyLike = {
  body: ReadableStream;
  httpEtag?: string;
  writeHttpMetadata?: (headers: Headers) => void;
};

type R2BucketLike = {
  get(key: string): Promise<R2ObjectBodyLike | null>;
};

type Env = {
  ASSETS: AssetFetcher;
  TOPPI_ASSETS: R2BucketLike;
};

const contentTypeFor = (path: string) => {
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".avif")) return "image/avif";
  return "application/octet-stream";
};

async function serveR2Visual(request: Request, env: Env, pathname: string) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const key = decodeURIComponent(pathname.replace(/^\//, ""));
  const object = await env.TOPPI_ASSETS.get(key);
  if (!object) return new Response("Visual not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata?.(headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", contentTypeFor(pathname));
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  if (object.httpEtag) headers.set("ETag", object.httpEtag);

  return new Response(request.method === "HEAD" ? null : object.body, { status: 200, headers });
}

const handler = {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/visuals/")) {
      return serveR2Visual(request, env, url.pathname);
    }

    // Next static chunks are emitted at the site root and should not be rewritten.
    if (url.pathname.startsWith("/_next/") || url.pathname === "/favicon.ico") {
      return env.ASSETS.fetch(request);
    }

    // Allow the generated /toppi route to remain directly previewable on pino-web.
    if (url.pathname === "/toppi" || url.pathname.startsWith("/toppi/")) {
      return env.ASSETS.fetch(request);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Public TOPPI URLs are clean at toppi.pinohouse.art. Internally the Next
    // export lives under /toppi so it can coexist safely with pino-web.
    const rewritten = new URL(request.url);
    rewritten.pathname = url.pathname === "/" ? "/toppi" : `/toppi${url.pathname}`;

    const response = await env.ASSETS.fetch(new Request(rewritten.toString(), request));
    if (response.status !== 404) return response;

    return new Response("TOPPI page not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};

export default handler;

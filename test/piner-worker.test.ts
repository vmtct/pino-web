import assert from "node:assert/strict";
import test from "node:test";
import pinerWorker from "../worker-piner.ts";

function fixture() {
  const assetUrls: string[] = [];
  const env = {
    ASSETS: {
      async fetch(request: Request) {
        assetUrls.push(request.url);
        return new Response("asset", { status: 200 });
      },
    },
  };
  return { env, assetUrls };
}

test("serves only the Piner shell at the first-class root", async () => {
  const { env, assetUrls } = fixture();
  const response = await pinerWorker.fetch(new Request("https://piner.pinohouse.art/"), env);
  assert.equal(response.status, 200);
  assert.deepEqual(assetUrls, ["https://piner.pinohouse.art/piner"]);
});

test("passes only Next static assets outside the Piner shell", async () => {
  const { env, assetUrls } = fixture();
  const staticResponse = await pinerWorker.fetch(
    new Request("https://piner.pinohouse.art/_next/static/chunk.js"),
    env,
  );
  const pageResponse = await pinerWorker.fetch(
    new Request("https://piner.pinohouse.art/open-studio"),
    env,
  );

  assert.equal(staticResponse.status, 200);
  assert.equal(pageResponse.status, 404);
  assert.deepEqual(assetUrls, ["https://piner.pinohouse.art/_next/static/chunk.js"]);
});

test("does not expose legacy pino-web APIs on the Piner host", async () => {
  const { env, assetUrls } = fixture();
  const response = await pinerWorker.fetch(
    new Request("https://piner.pinohouse.art/api/web-content"),
    env,
  );

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(assetUrls, []);
});


test("fails closed for every retired Piner Open Studio API shape", async () => {
  const { env, assetUrls } = fixture();
  const paths = [
    "/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/open-studio",
    "/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/open-studio/admissions",
    "/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/open-studio/claims/018f7f5a-4321-7abc-8def-333333333333/cancel",
  ];
  for (const path of paths) {
    const response = await pinerWorker.fetch(new Request(`https://piner.pinohouse.art${path}`, { method: path.endsWith("open-studio") ? "GET" : "POST" }), env);
    assert.equal(response.status, 410);
    assert.deepEqual(await response.json(), { error: { code: "PINER_OPEN_STUDIO_RETIRED", message: "Open Studio is retired from Piner" } });
  }
  assert.deepEqual(assetUrls, []);
});

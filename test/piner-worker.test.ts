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

test("redeems a Toppi handoff into an HttpOnly Piner session and redirects to a clean URL", async () => {
  const handoffToken = "h".repeat(43);
  const sessionToken = "s".repeat(43);
  const seen: string[] = [];
  const env = {
    ASSETS: { async fetch() { return new Response("asset"); } },
    PINO_PINER_HANDOFF: {
      async redeemPinerHandoff(request: { token: string }) {
        seen.push(request.token);
        return {
          token: sessionToken,
          expiresAt: "2026-11-27T12:00:00.000Z",
          parentUserId: "018f7f5a-4321-7abc-8def-111111111111",
          selectedStudentId: "018f7f5a-4321-7abc-8def-222222222222",
        };
      },
    },
  };
  const response = await pinerWorker.fetch(new Request(`https://piner.pinohouse.art/handoff/${handoffToken}`), env);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/piner");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  const cookies = response.headers.get("set-cookie") ?? "";
  assert.match(cookies, /__Host-piner_session=s{43}/);
  assert.match(cookies, /HttpOnly/);
  assert.match(cookies, /Secure/);
  assert.match(cookies, /SameSite=Lax/);
  assert.match(cookies, /__Host-piner_pin_change=; Max-Age=0/);
  assert.deepEqual(seen, [handoffToken]);
  assert.doesNotMatch(response.headers.get("location") ?? "", /handoff|h{43}/);
  assert.equal(await response.text(), "");
});

test("fails closed for missing or invalid Piner handoff authority", async () => {
  const token = "h".repeat(43);
  const base = { ASSETS: { async fetch() { return new Response("asset"); } } };
  const missing = await pinerWorker.fetch(new Request(`https://piner.pinohouse.art/handoff/${token}`), base);
  assert.equal(missing.status, 503);
  const invalid = await pinerWorker.fetch(new Request(`https://piner.pinohouse.art/handoff/${token}`), {
    ...base,
    PINO_PINER_HANDOFF: { async redeemPinerHandoff() { throw new Error("replayed"); } },
  });
  assert.equal(invalid.status, 401);
  assert.deepEqual(await invalid.json(), { error: { code: "PINER_HANDOFF_INVALID", message: "Piner handoff is invalid or expired" } });
});

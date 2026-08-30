import assert from "node:assert/strict";
import test from "node:test";
import { proxyPinerToppiRequest, type ToppiMemberBinding } from "../lib/piner-toppi-adapter.ts";

const TOKEN = "s".repeat(43);
const SPOOFED = "x".repeat(43);
const STUDENT = "019d2000-0001-7000-8000-000000000001";

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });
}

test("forwards only the HttpOnly Piner session to the private Toppi binding", async () => {
  let seen: Request | undefined;
  const binding: ToppiMemberBinding = {
    async fetch(request) {
      seen = request;
      return response({ student: { id: STUDENT, displayName: "Mori" }, programs: [] });
    },
  };
  const result = await proxyPinerToppiRequest(new Request(`https://piner.pinohouse.art/api/piner/students/${STUDENT}/toppi`, {
    headers: {
      cookie: `__Host-piner_session=${TOKEN}`,
      authorization: `Bearer ${SPOOFED}`,
    },
  }), { TOPPI_MEMBER: binding });

  assert.equal(result.status, 200);
  assert.ok(seen);
  assert.equal(seen.url, `https://toppi-member.internal/api/v1/integrations/piner/member/students/${STUDENT}/progress`);
  assert.equal(seen.headers.get("authorization"), `Bearer ${TOKEN}`);
  assert.equal(result.headers.get("access-control-allow-origin"), null);
});

test("fails closed without the Piner session or Toppi service binding", async () => {
  const missingSession = await proxyPinerToppiRequest(
    new Request(`https://piner.pinohouse.art/api/piner/students/${STUDENT}/toppi`),
    {},
  );
  assert.equal(missingSession.status, 401);
  assert.match(missingSession.headers.get("set-cookie") ?? "", /__Host-piner_session=; Max-Age=0/);
  const missingBinding = await proxyPinerToppiRequest(
    new Request(`https://piner.pinohouse.art/api/piner/students/${STUDENT}/toppi`, {
      headers: { cookie: `__Host-piner_session=${TOKEN}` },
    }),
    {},
  );
  assert.equal(missingBinding.status, 503);
  assert.deepEqual(await missingBinding.json(), {
    error: { code: "PINER_TOPPI_UNAVAILABLE", message: "Toppi is unavailable" },
  });
});

test("clears the local Piner cookie when Toppi reports the Core session invalid", async () => {
  const binding: ToppiMemberBinding = { async fetch() { return response({ error: "unauthorized" }, 401); } };
  const result = await proxyPinerToppiRequest(
    new Request(`https://piner.pinohouse.art/api/piner/students/${STUDENT}/toppi`, {
      headers: { cookie: `__Host-piner_session=${TOKEN}` },
    }),
    { TOPPI_MEMBER: binding },
  );
  assert.equal(result.status, 401);
  assert.match(result.headers.get("set-cookie") ?? "", /__Host-piner_session=; Max-Age=0/);
});


test("maps Practice reads through the same private Toppi member binding", async () => {
  let seen: Request | undefined;
  const binding: ToppiMemberBinding = { async fetch(request) { seen = request; return response({ student: { id: STUDENT, displayName: "Mori" }, sets: [], rewardSummary: { code: "PLS", earnedTotal: 0 } }); } };
  const result = await proxyPinerToppiRequest(new Request(`https://piner.pinohouse.art/api/piner/students/${STUDENT}/toppi/practice`, {
    headers: { cookie: `__Host-piner_session=${TOKEN}` },
  }), { TOPPI_MEMBER: binding });
  assert.equal(result.status, 200);
  assert.equal(seen?.url, `https://toppi-member.internal/api/v1/integrations/piner/member/students/${STUDENT}/practice`);
  assert.equal(seen?.headers.get("authorization"), `Bearer ${TOKEN}`);
});

test("forwards a same-origin Practice completion with cookie-derived bearer and idempotency only", async () => {
  let seen: Request | undefined;
  const binding: ToppiMemberBinding = { async fetch(request) { seen = request; return response({ completion: { id: "top_prc_1", practiceSetId: "set-1", optionId: "option-1", completedAt: "2026-08-30T09:00:00.000Z" }, reward: { code: "PLS", amount: 10 }, replayed: false }, 201); } };
  const payload = JSON.stringify({ practiceSetId: "set-1", optionId: "option-1", kind: "WORKSHEET", textResponse: "A long enough worksheet answer for Practice V1." });
  const result = await proxyPinerToppiRequest(new Request(`https://piner.pinohouse.art/api/piner/students/${STUDENT}/toppi/practice/completions`, {
    method: "POST",
    headers: { cookie: `__Host-piner_session=${TOKEN}`, authorization: `Bearer ${SPOOFED}`, origin: "https://piner.pinohouse.art", "content-type": "application/json", "idempotency-key": "practice-key-000001" },
    body: payload,
  }), { TOPPI_MEMBER: binding });
  assert.equal(result.status, 201);
  assert.equal(seen?.url, `https://toppi-member.internal/api/v1/integrations/piner/member/students/${STUDENT}/practice/completions`);
  assert.equal(seen?.headers.get("authorization"), `Bearer ${TOKEN}`);
  assert.equal(seen?.headers.get("idempotency-key"), "practice-key-000001");
  assert.equal(await seen?.text(), payload);
});

test("blocks cross-origin or non-idempotent Practice completion before Toppi", async () => {
  let calls = 0;
  const binding: ToppiMemberBinding = { async fetch() { calls += 1; return response({}); } };
  const make = (origin: string, key?: string) => new Request(`https://piner.pinohouse.art/api/piner/students/${STUDENT}/toppi/practice/completions`, {
    method: "POST",
    headers: { cookie: `__Host-piner_session=${TOKEN}`, origin, "content-type": "application/json", ...(key ? { "idempotency-key": key } : {}) },
    body: JSON.stringify({ practiceSetId: "set-1", optionId: "option-1" }),
  });
  const crossOrigin = await proxyPinerToppiRequest(make("https://evil.invalid", "practice-key-000002"), { TOPPI_MEMBER: binding });
  assert.equal(crossOrigin.status, 403);
  const missingKey = await proxyPinerToppiRequest(make("https://piner.pinohouse.art"), { TOPPI_MEMBER: binding });
  assert.equal(missingKey.status, 400);
  assert.equal(calls, 0);
});

test("preserves multipart Speaking audio and boundary through the private binding", async () => {
  let seen: Request | undefined;
  const binding: ToppiMemberBinding = { async fetch(request) { seen = request; return response({ completion: { id: "top_prc_audio", practiceSetId: "set-1", optionId: "speaking-1", completedAt: "2026-08-30T09:00:00.000Z" }, reward: { code: "PLS", amount: 10 }, replayed: false }, 201); } };
  const form = new FormData();
  form.set("practiceSetId", "set-1");
  form.set("optionId", "speaking-1");
  form.set("kind", "SPEAKING");
  form.set("audio", new Blob([new Uint8Array([1, 2, 3, 4])], { type: "audio/webm" }), "practice.webm");
  const result = await proxyPinerToppiRequest(new Request(`https://piner.pinohouse.art/api/piner/students/${STUDENT}/toppi/practice/completions`, {
    method: "POST",
    headers: { cookie: `__Host-piner_session=${TOKEN}`, origin: "https://piner.pinohouse.art", "idempotency-key": "practice-key-audio-01" },
    body: form,
  }), { TOPPI_MEMBER: binding });
  assert.equal(result.status, 201);
  assert.match(seen?.headers.get("content-type") ?? "", /^multipart\/form-data; boundary=/);
  const forwarded = await seen?.formData();
  const audio = forwarded?.get("audio");
  assert.ok(audio && typeof audio !== "string");
  assert.equal(audio.type, "audio/webm");
  assert.equal(audio.size, 4);
});
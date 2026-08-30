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

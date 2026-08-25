import assert from "node:assert/strict";
import test from "node:test";
import { proxyPinerMemberRequest, type ParentMemberCoreBinding } from "../lib/piner-member-core-adapter.ts";

test("maps only allowlisted Piner auth routes to the private member control plane", async () => {
  let seen: Request | undefined;
  const binding: ParentMemberCoreBinding = {
    async fetch(request) {
      seen = request;
      return new Response(JSON.stringify({ data: { authState: "AUTHENTICATED" } }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-request-id": "req_core_1",
          "access-control-allow-origin": "*",
        },
      });
    },
  };

  const response = await proxyPinerMemberRequest(
    new Request("https://pinohouse.art/api/piner/session", {
      headers: { authorization: `Bearer ${"a".repeat(43)}` },
    }),
    { PINO_MEMBER_CORE: binding },
  );

  assert.ok(seen);
  assert.equal(seen.url, "https://pino-member-core.internal/v1/member/session");
  assert.equal(seen.method, "GET");
  assert.equal(seen.headers.get("authorization"), `Bearer ${"a".repeat(43)}`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-request-id"), "req_core_1");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("fails closed when the private member binding is absent", async () => {
  const response = await proxyPinerMemberRequest(
    new Request("https://pinohouse.art/api/piner/students"),
    {},
  );

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    error: {
      code: "PINER_MEMBER_CORE_UNAVAILABLE",
      message: "Member service is unavailable",
    },
  });
});

test("reserves unknown Piner routes and methods instead of falling through to legacy member authority", async () => {
  const missing = await proxyPinerMemberRequest(
    new Request("https://pinohouse.art/api/piner/not-governed"),
    {},
  );
  assert.equal(missing.status, 404);

  const wrongMethod = await proxyPinerMemberRequest(
    new Request("https://pinohouse.art/api/piner/auth/login"),
    {},
  );
  assert.equal(wrongMethod.status, 405);
});

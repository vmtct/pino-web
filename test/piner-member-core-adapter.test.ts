import assert from "node:assert/strict";
import test from "node:test";
import { proxyPinerMemberRequest, type ParentMemberCoreBinding } from "../lib/piner-member-core-adapter.ts";

const SESSION_TOKEN = "s".repeat(43);
const CHANGE_TOKEN = "c".repeat(43);
const SPOOFED_TOKEN = "x".repeat(43);
const EXPIRES_AT = "2026-11-23T12:00:00.000Z";

function jsonResponse(body: unknown, status = 200, requestId = "req_core_1") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "x-request-id": requestId,
      "access-control-allow-origin": "*",
    },
  });
}

test("converts an authenticated Core login token into an HttpOnly host cookie", async () => {
  let seen: Request | undefined;
  const binding: ParentMemberCoreBinding = {
    async fetch(request) {
      seen = request;
      return jsonResponse({ data: { authState: "AUTHENTICATED", token: SESSION_TOKEN, tokenType: "Bearer", expiresAt: EXPIRES_AT } });
    },
  };

  const response = await proxyPinerMemberRequest(
    new Request("https://pinohouse.art/api/piner/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${SPOOFED_TOKEN}` },
      body: JSON.stringify({ identifierType: "PHONE", identifierValue: "0900000000", pin: "123456" }),
    }),
    { PINO_MEMBER_CORE: binding },
  );

  assert.ok(seen);
  assert.equal(seen.url, "https://pino-member-core.internal/v1/parent-auth/pin/login");
  assert.equal(seen.headers.get("authorization"), null, "browser Authorization must never be trusted on login");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { authState: "AUTHENTICATED", expiresAt: EXPIRES_AT } });
  const cookies = response.headers.get("set-cookie") ?? "";
  assert.match(cookies, /__Host-piner_session=s{43}/);
  assert.match(cookies, /HttpOnly/);
  assert.match(cookies, /Secure/);
  assert.match(cookies, /SameSite=Lax/);
  assert.doesNotMatch(JSON.stringify(await response.clone().text()), /token/i);
});

test("keeps temporary PIN change authorization separate from the full member session", async () => {
  const loginBinding: ParentMemberCoreBinding = {
    async fetch() {
      return jsonResponse({ data: { authState: "PIN_CHANGE_REQUIRED", token: CHANGE_TOKEN, tokenType: "Bearer", expiresAt: EXPIRES_AT } });
    },
  };
  const login = await proxyPinerMemberRequest(
    new Request("https://pinohouse.art/api/piner/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifierType: "PHONE", identifierValue: "0900000000", pin: "123456" }),
    }),
    { PINO_MEMBER_CORE: loginBinding },
  );
  const loginCookies = login.headers.get("set-cookie") ?? "";
  assert.match(loginCookies, /__Host-piner_pin_change=c{43}/);
  assert.match(loginCookies, /__Host-piner_session=; Max-Age=0/);
  assert.deepEqual(await login.json(), { data: { authState: "PIN_CHANGE_REQUIRED", expiresAt: EXPIRES_AT } });

  let changeSeen: Request | undefined;
  const changeBinding: ParentMemberCoreBinding = {
    async fetch(request) {
      changeSeen = request;
      return jsonResponse({ data: { authState: "AUTHENTICATED", token: SESSION_TOKEN, tokenType: "Bearer", expiresAt: EXPIRES_AT } });
    },
  };
  const changed = await proxyPinerMemberRequest(
    new Request("https://pinohouse.art/api/piner/auth/change-pin", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `__Host-piner_pin_change=${CHANGE_TOKEN}`,
        authorization: `Bearer ${SPOOFED_TOKEN}`,
      },
      body: JSON.stringify({ newPin: "654321" }),
    }),
    { PINO_MEMBER_CORE: changeBinding },
  );

  assert.ok(changeSeen);
  assert.equal(changeSeen.headers.get("authorization"), `Bearer ${CHANGE_TOKEN}`);
  const changedCookies = changed.headers.get("set-cookie") ?? "";
  assert.match(changedCookies, /__Host-piner_session=s{43}/);
  assert.match(changedCookies, /__Host-piner_pin_change=; Max-Age=0/);
  assert.deepEqual(await changed.json(), { data: { authState: "AUTHENTICATED", expiresAt: EXPIRES_AT } });
});

test("uses only the HttpOnly session cookie for protected member reads", async () => {
  let seen: Request | undefined;
  const binding: ParentMemberCoreBinding = {
    async fetch(request) {
      seen = request;
      return jsonResponse({ data: { parent: { id: "parent_1" } } });
    },
  };

  const response = await proxyPinerMemberRequest(
    new Request("https://pinohouse.art/api/piner/session", {
      headers: {
        cookie: `__Host-piner_session=${SESSION_TOKEN}`,
        authorization: `Bearer ${SPOOFED_TOKEN}`,
      },
    }),
    { PINO_MEMBER_CORE: binding },
  );

  assert.ok(seen);
  assert.equal(seen.url, "https://pino-member-core.internal/v1/member/session");
  assert.equal(seen.headers.get("authorization"), `Bearer ${SESSION_TOKEN}`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-request-id"), "req_core_1");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("fails closed before Core when the required member cookie is absent", async () => {
  let calls = 0;
  const binding: ParentMemberCoreBinding = {
    async fetch() {
      calls += 1;
      return jsonResponse({});
    },
  };
  const response = await proxyPinerMemberRequest(
    new Request("https://pinohouse.art/api/piner/students"),
    { PINO_MEMBER_CORE: binding },
  );

  assert.equal(response.status, 401);
  assert.equal(calls, 0);
  assert.deepEqual(await response.json(), {
    error: { code: "PINER_AUTH_REQUIRED", message: "Member authentication is required" },
  });
});

test("fails closed when the private member binding is absent", async () => {
  const response = await proxyPinerMemberRequest(
    new Request("https://pinohouse.art/api/piner/students", {
      headers: { cookie: `__Host-piner_session=${SESSION_TOKEN}` },
    }),
    {},
  );

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    error: { code: "PINER_MEMBER_CORE_UNAVAILABLE", message: "Member service is unavailable" },
  });
});

test("forwards logout idempotency and clears the local session only after Core succeeds", async () => {
  let seen: Request | undefined;
  const binding: ParentMemberCoreBinding = {
    async fetch(request) {
      seen = request;
      return jsonResponse({ data: { revoked: true } });
    },
  };
  const response = await proxyPinerMemberRequest(
    new Request("https://pinohouse.art/api/piner/logout", {
      method: "POST",
      headers: {
        cookie: `__Host-piner_session=${SESSION_TOKEN}`,
        "idempotency-key": "logout-1",
      },
    }),
    { PINO_MEMBER_CORE: binding },
  );

  assert.ok(seen);
  assert.equal(seen.headers.get("authorization"), `Bearer ${SESSION_TOKEN}`);
  assert.equal(seen.headers.get("idempotency-key"), "logout-1");
  assert.equal(seen.body, null, "logout must not synthesize an empty JSON body");
  assert.match(response.headers.get("set-cookie") ?? "", /__Host-piner_session=; Max-Age=0/);
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

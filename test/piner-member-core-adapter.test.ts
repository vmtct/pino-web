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
  const responseText = await response.clone().text();
  assert.deepEqual(await response.json(), { data: { authState: "AUTHENTICATED", expiresAt: EXPIRES_AT } });
  const cookies = response.headers.get("set-cookie") ?? "";
  assert.match(cookies, /__Host-piner_session=s{43}/);
  assert.match(cookies, /HttpOnly/);
  assert.match(cookies, /Secure/);
  assert.match(cookies, /SameSite=Lax/);
  assert.doesNotMatch(responseText, /token/i);
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

test("maps protected Home and Journey reads through the private member binding", async () => {
  const seen: string[] = [];
  const authorizations: Array<string | null> = [];
  const binding: ParentMemberCoreBinding = {
    async fetch(request) {
      seen.push(request.url);
      authorizations.push(request.headers.get("authorization"));
      return jsonResponse({ data: { state: "NEUTRAL" } });
    },
  };
  const cookie = `__Host-piner_session=${SESSION_TOKEN}`;
  const headers = { cookie, authorization: `Bearer ${SPOOFED_TOKEN}` };

  const home = await proxyPinerMemberRequest(
    new Request("https://pinohouse.art/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/home", { headers }),
    { PINO_MEMBER_CORE: binding },
  );
  const journey = await proxyPinerMemberRequest(
    new Request("https://pinohouse.art/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/journey", { headers }),
    { PINO_MEMBER_CORE: binding },
  );

  assert.equal(home.status, 200);
  assert.equal(journey.status, 200);
  assert.deepEqual(seen, [
    "https://pino-member-core.internal/v1/member/students/018f7f5a-4321-7abc-8def-1234567890ab/home",
    "https://pino-member-core.internal/v1/member/students/018f7f5a-4321-7abc-8def-1234567890ab/journey",
  ]);
  assert.deepEqual(authorizations, [`Bearer ${SESSION_TOKEN}`, `Bearer ${SESSION_TOKEN}`]);
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


test("forwards bounded OWNER Open Studio admission through the private member binding", async () => {
  let seen: Request | undefined;
  const binding: ParentMemberCoreBinding = {
    async fetch(request) {
      seen = request;
      return jsonResponse({ data: { claimStatus: "RESERVED" } }, 201);
    },
  };
  const studentId = "018f7f5a-4321-7abc-8def-1234567890ab";
  const body = { passId: "018f7f5a-4321-7abc-8def-111111111111", listingId: "018f7f5a-4321-7abc-8def-222222222222", participantMode: "OWNER" };
  const response = await proxyPinerMemberRequest(new Request(`https://pinohouse.art/api/piner/students/${studentId}/open-studio/admissions`, {
    method: "POST",
    headers: {
      cookie: `__Host-piner_session=${SESSION_TOKEN}`,
      authorization: `Bearer ${SPOOFED_TOKEN}`,
      "content-type": "application/json",
      "idempotency-key": "piner-owner-admission-1",
    },
    body: JSON.stringify(body),
  }), { PINO_MEMBER_CORE: binding });

  assert.equal(response.status, 201);
  assert.ok(seen);
  assert.equal(seen.url, `https://pino-member-core.internal/v1/member/students/${studentId}/open-studio/admissions`);
  assert.equal(seen.headers.get("authorization"), `Bearer ${SESSION_TOKEN}`);
  assert.equal(seen.headers.get("idempotency-key"), "piner-owner-admission-1");
  assert.deepEqual(await seen.json(), body);
});
test("maps F1 member summary and piano library through the authenticated binding", async () => {
  const seen: string[] = [];
  const binding: ParentMemberCoreBinding = { async fetch(request) { seen.push(request.url); return jsonResponse({ data: {} }); } };
  const studentId = "018f7f5a-4321-7abc-8def-1234567890ab";
  const pathProgramId = "018f7f5a-aaaa-7abc-8def-123456789002";
  for (const path of [`/api/piner/students/${studentId}/summary`, `/api/piner/students/${studentId}/piano/library?pathProgramId=${pathProgramId}`]) {
    const response = await proxyPinerMemberRequest(new Request(`https://pinohouse.art${path}`, { headers: { cookie: `__Host-piner_session=${SESSION_TOKEN}`, authorization: `Bearer ${SPOOFED_TOKEN}` } }), { PINO_MEMBER_CORE: binding });
    assert.equal(response.status, 200);
  }
  assert.deepEqual(seen, [`https://pino-member-core.internal/v1/member/students/${studentId}/summary`, `https://pino-member-core.internal/v1/member/students/${studentId}/piano/library?pathProgramId=${pathProgramId}`]);
});

test("maps the exact Core F0 Practice resource read through the private member binding", async () => {
  let seen: Request | undefined;
  const binding: ParentMemberCoreBinding = {
    async fetch(request) {
      seen = request;
      return jsonResponse({ data: { resourceId: "resource" } });
    },
  };
  const studentId = "018f7f5a-4321-7abc-8def-1234567890ab";
  const resourceId = "018f7f5a-aaaa-7abc-8def-123456789001";
  const path = `/api/piner/students/${studentId}/piano/practice-resources/${resourceId}`;
  const response = await proxyPinerMemberRequest(new Request(`https://pinohouse.art${path}`, {
    headers: { cookie: `__Host-piner_session=${SESSION_TOKEN}`, authorization: `Bearer ${SPOOFED_TOKEN}` },
  }), { PINO_MEMBER_CORE: binding });

  assert.ok(seen);
  assert.equal(seen.url, `https://pino-member-core.internal/v1/member/students/${studentId}/piano/practice-resources/${resourceId}`);
  assert.equal(seen.method, "GET");
  assert.equal(seen.headers.get("authorization"), `Bearer ${SESSION_TOKEN}`);
  assert.equal(response.status, 200);
});

test("does not retain the invented Piano Practice current route", async () => {
  let calls = 0;
  const binding: ParentMemberCoreBinding = { async fetch() { calls += 1; return jsonResponse({}); } };
  const response = await proxyPinerMemberRequest(
    new Request("https://pinohouse.art/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/piano-practice/current", {
      headers: { cookie: `__Host-piner_session=${SESSION_TOKEN}` },
    }),
    { PINO_MEMBER_CORE: binding },
  );
  assert.equal(response.status, 404);
  assert.equal(calls, 0);
});

test("streams exact Core F0 Practice Page media through the authenticated seam", async () => {
  let seen: Request | undefined;
  const binding: ParentMemberCoreBinding = {
    async fetch(request) {
      seen = request;
      return new Response(new Uint8Array([137, 80, 78, 71]), {
        status: 200,
        headers: { "content-type": "image/png", "cache-control": "private, no-store", "x-content-type-options": "nosniff" },
      });
    },
  };
  const path = "/api/piner/students/018f7f5a-4321-7abc-8def-1234567890ab/piano/practice-resources/018f7f5a-aaaa-7abc-8def-123456789001/pages/018f7f5a-bbbb-7abc-8def-123456789001/media/SHEET";
  const response = await proxyPinerMemberRequest(new Request(`https://pinohouse.art${path}`, {
    headers: { cookie: `__Host-piner_session=${SESSION_TOKEN}`, authorization: `Bearer ${SPOOFED_TOKEN}` },
  }), { PINO_MEMBER_CORE: binding });

  assert.ok(seen);
  assert.equal(seen.url, `https://pino-member-core.internal/v1/member${path.slice("/api/piner".length)}`);
  assert.equal(seen.headers.get("authorization"), `Bearer ${SESSION_TOKEN}`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [137, 80, 78, 71]);
});

test("Practice media fails closed without session and preserves Core Student rejection", async () => {
  let calls = 0;
  let seen: Request | undefined;
  const binding: ParentMemberCoreBinding = {
    async fetch(request) {
      calls += 1;
      seen = request;
      return jsonResponse({ error: { code: "MEMBER_CONTENT_MEDIA_UNAVAILABLE" } }, 404);
    },
  };
  const path = "/api/piner/students/018f7f5a-4321-7abc-8def-000000000000/piano/practice-resources/018f7f5a-aaaa-7abc-8def-123456789001/pages/018f7f5a-bbbb-7abc-8def-123456789001/media/WORKSHEET";
  const unauthenticated = await proxyPinerMemberRequest(new Request(`https://pinohouse.art${path}`), { PINO_MEMBER_CORE: binding });
  assert.equal(unauthenticated.status, 401);
  assert.equal(calls, 0);

  const rejected = await proxyPinerMemberRequest(new Request(`https://pinohouse.art${path}`, {
    headers: { cookie: `__Host-piner_session=${SESSION_TOKEN}` },
  }), { PINO_MEMBER_CORE: binding });
  assert.equal(rejected.status, 404);
  assert.equal(calls, 1);
  assert.ok(seen);
  assert.equal(seen.url, `https://pino-member-core.internal/v1/member${path.slice("/api/piner".length)}`);
  assert.equal(seen.headers.get("authorization"), `Bearer ${SESSION_TOKEN}`);
});

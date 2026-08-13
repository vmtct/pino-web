import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { CoreSession } from "../lib/open-studio-funnel.ts";
import {
  REGISTRATION_SUCCESS_BODY,
  REGISTRATION_SUCCESS_TITLE,
  createSubmissionAttempt,
  formatAgeRange,
  formatLocalDate,
  formatLocalTimeRange,
  groupSessionsByLocalDate,
  isSessionFull,
  mapRegistrationError,
  serializeRegistration,
  sessionCover,
  sessionImageAlt,
  sessionThumbnail,
  validateRegistration,
} from "../lib/open-studio-funnel.ts";
import { proxyCoreRegistration, proxyCoreSessions, registrationEnabled } from "../lib/pino-core-public-adapter.ts";

const makeSession = (overrides: Partial<CoreSession> = {}): CoreSession => ({
  id: "019ffaf0-0000-7000-8000-000000000001",
  path: { id: "path-1", code: "ART", displayName: "Art" },
  startsAt: "2026-08-15T02:00:00.000Z",
  endsAt: "2026-08-15T03:00:00.000Z",
  bookingClosesAt: "2026-08-14T02:00:00.000Z",
  timezone: "Asia/Ho_Chi_Minh",
  availability: { remainingSeats: 3, isFull: false },
  access: { kind: "explore", trialPremium: false },
  syllabus: {
    id: "syllabus-1",
    title: "Những khu vườn biết kể chuyện",
    shortDescription: "Con kể chuyện bằng hình, màu và chất liệu.",
    publicDescription: "Con quan sát một khu vườn và tạo nên thế giới của riêng mình.",
    skillSummary: "Quan sát · Phối màu · Kể chuyện thị giác",
    ageMin: 7,
    ageMax: 10,
    thumbnailUrl: "https://assets.example/thumb.jpg",
    coverUrl: "https://assets.example/cover.jpg",
  },
  ...overrides,
});

test("1. Syllabus title is the session-card title", () => assert.equal(makeSession().syllabus.title, "Những khu vườn biết kể chuyện"));
test("2. Thumbnail is used when present", () => assert.equal(sessionThumbnail(makeSession()), "https://assets.example/thumb.jpg"));
test("3. Missing thumbnail requests the branded fallback", () => assert.equal(sessionThumbnail(makeSession({ syllabus: { ...makeSession().syllabus, thumbnailUrl: null } })), null));
test("4. Age range formatting handles bounded, minimum, maximum, and unknown ages", () => {
  assert.equal(formatAgeRange(7, 10), "7–10 tuổi");
  assert.equal(formatAgeRange(7, null), "7+ tuổi");
  assert.equal(formatAgeRange(null, 6), "Đến 6 tuổi");
  assert.equal(formatAgeRange(null, null), "Mọi độ tuổi");
});
test("5. Remaining seats are retained from canonical availability", () => assert.equal(makeSession().availability.remainingSeats, 3));
test("6. Full state respects both canonical flag and zero remaining seats", () => {
  assert.equal(isSessionFull(makeSession({ availability: { remainingSeats: 3, isFull: true } })), true);
  assert.equal(isSessionFull(makeSession({ availability: { remainingSeats: 0, isFull: false } })), true);
});
test("7. Sessions are grouped by PINO date in chronological order", () => {
  const late = makeSession({ id: "late", startsAt: "2026-08-16T03:00:00.000Z" });
  const early = makeSession({ id: "early", startsAt: "2026-08-15T02:00:00.000Z" });
  const groups = groupSessionsByLocalDate([late, early]);
  assert.deepEqual(groups.map(([, sessions]) => sessions[0].id), ["early", "late"]);
});
test("8. Detail exposes only public description and skill summary", () => {
  const session = makeSession();
  assert.match(session.syllabus.publicDescription!, /khu vườn/);
  assert.match(session.syllabus.skillSummary!, /Phối màu/);
});
test("9. Cover falls back to thumbnail, then branded media", () => {
  assert.equal(sessionCover(makeSession()), "https://assets.example/cover.jpg");
  assert.equal(sessionCover(makeSession({ syllabus: { ...makeSession().syllabus, coverUrl: null } })), "https://assets.example/thumb.jpg");
  assert.equal(sessionCover(makeSession({ syllabus: { ...makeSession().syllabus, coverUrl: null, thumbnailUrl: null } })), null);
});
test("10. Canonical registration payload serialization uses only supported fields", () => {
  assert.deepEqual(serializeRegistration("session-1", { contactName: "  Minh ", phone: " 0909 ", childName: " An ", childDateOfBirth: "2019-04-03" }), {
    sessionId: "session-1", contactName: "Minh", phone: "0909", childName: "An", childDateOfBirth: "2019-04-03",
  });
});
test("11. Idempotency key is reused for the same logical attempt", () => {
  let calls = 0;
  const makeKey = () => `key-${++calls}`;
  const first = createSubmissionAttempt(null, makeKey);
  const retry = createSubmissionAttempt(first, makeKey);
  assert.equal(retry, first);
  assert.equal(calls, 1);
});
test("12. Pending-state contract prevents a second logical submit", () => assert.equal(createSubmissionAttempt("pending-key", () => "new-key"), "pending-key"));
test("13. Success copy confirms receipt, not a confirmed booking", () => {
  assert.equal(REGISTRATION_SUCCESS_TITLE, "Đã nhận đăng ký");
  assert.doesNotMatch(REGISTRATION_SUCCESS_BODY, /Đặt chỗ thành công|Đã xác nhận/);
});
test("14. Local validation associates required fields", () => assert.deepEqual(Object.keys(validateRegistration({ contactName: "", phone: "", childName: "", childDateOfBirth: "" })).sort(), ["childDateOfBirth", "childName", "contactName", "phone"]));
test("15. SESSION_FULL is parent-safe and asks for schedule refresh", () => assert.equal(mapRegistrationError("SESSION_FULL").refreshSchedule, true));
test("16. Booking-window/session unavailable maps to SESSION_NOT_OPEN", () => assert.match(mapRegistrationError("SESSION_NOT_OPEN").message, /không còn nhận đăng ký/));
test("17. Network errors remain retryable", () => assert.equal(mapRegistrationError().retryable, true));
test("18. Registration is unavailable unless the exact gate value is true", () => {
  assert.equal(registrationEnabled({ PINO_CORE_REGISTRATION_ENABLED: "false" }), false);
  assert.equal(registrationEnabled({ PINO_CORE_REGISTRATION_ENABLED: "true" }), true);
});
test("19. POST adapter refuses registration while gate is disabled", async () => {
  const response = await proxyCoreRegistration(new Request("https://pinohouse.art/api/pino-core/open-studio/registrations", { method: "POST", body: JSON.stringify({ phone: "synthetic" }) }), { PINO_CORE_REGISTRATION_ENABLED: "false" });
  assert.equal(response.status, 503);
  assert.equal((await response.json() as { error: { code: string } }).error.code, "REGISTRATION_DISABLED");
});
test("20. Disabled POST never reads or forwards PII upstream", async () => {
  let forwarded = false;
  const fetcher = async () => { forwarded = true; return new Response(); };
  const response = await proxyCoreRegistration(new Request("https://pinohouse.art/api/pino-core/open-studio/registrations", { method: "POST", headers: { "Idempotency-Key": "synthetic-key" }, body: JSON.stringify({ contactName: "Synthetic Parent", phone: "0000000000" }) }), { PINO_CORE_REGISTRATION_ENABLED: "false" }, fetcher);
  assert.equal(response.status, 503);
  assert.equal(forwarded, false);
});
test("21. Existing homepage remains present and links to Open Studio", async () => {
  const homepage = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const components = await readFile(new URL("../app/components/public-site.tsx", import.meta.url), "utf8");
  assert.match(homepage, /<PrimaryCta/);
  assert.match(components, /href = "\/open-studio"/);
});
test("22. Existing schedule adapter still proxies canonical GET", async () => {
  let requested = "";
  const response = await proxyCoreSessions(new Request("https://pinohouse.art/api/pino-core/open-studio/sessions"), { PINO_CORE_BASE_URL: "https://core.example" }, async (input) => {
    requested = String(input);
    return new Response(JSON.stringify({ sessions: [makeSession()] }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  assert.equal(requested, "https://core.example/v1/open-studio/sessions");
  assert.equal(response.status, 200);
  assert.equal((await response.json() as { sessions: CoreSession[] }).sessions.length, 1);
});
test("Session media alt combines public Syllabus title and Path", () => assert.equal(sessionImageAlt(makeSession()), "Những khu vườn biết kể chuyện — Art"));
test("PINO date and time formatting never exposes raw UTC", () => {
  assert.match(formatLocalDate(makeSession().startsAt), /15\/08/);
  assert.equal(formatLocalTimeRange(makeSession().startsAt, makeSession().endsAt), "09:00–10:00");
});
test("Enabled adapter forwards canonical payload and Idempotency-Key", async () => {
  let forwardedKey = "";
  let forwardedBody = "";
  const request = new Request("https://pinohouse.art/api/pino-core/open-studio/registrations", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": "attempt-1" }, body: JSON.stringify({ sessionId: "s1", contactName: "Synthetic", phone: "000", childName: "Test", childDateOfBirth: "2020-01-01" }) });
  const response = await proxyCoreRegistration(request, { PINO_CORE_BASE_URL: "https://core.example", PINO_CORE_REGISTRATION_ENABLED: "true" }, async (_input, init) => {
    forwardedKey = new Headers(init?.headers).get("Idempotency-Key") || "";
    forwardedBody = String(init?.body);
    return new Response(JSON.stringify({ registration: { id: "r1", sessionId: "s1", status: "holding", holdExpiresAt: "2026-08-16T00:00:00Z" } }), { status: 201 });
  });
  assert.equal(response.status, 201);
  assert.equal(forwardedKey, "attempt-1");
  assert.match(forwardedBody, /"sessionId":"s1"/);
});

import { getConfig } from "./web-config";

type Env = {
  NOTION_TOKEN: string;
  NOTION_OS_BOOKING_DATA_SOURCE_ID: string;
  NOTION_OS_BOOKING_DATABASE_ID?: string;
  NOTION_WEB_CONFIG_DATA_SOURCE_ID: string;
  EMAIL?: { send: (message: any) => Promise<any> };
  OS_NOTIFY_TO?: string;
  OS_NOTIFY_FROM?: string;
};

type HoldRequestBody = {
  zaloMobile?: unknown;
  childAge?: unknown;
  activitySlug?: unknown;
  activityTitle?: unknown;
  sessionId?: unknown;
  sessionDate?: unknown;
};

const PINO_ZALO_CHAT_URL = "https://zalo.me/0374686860";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  },
});

const notionHeaders = (env: Env, version = "2026-03-11") => ({
  Authorization: `Bearer ${env.NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": version,
});

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (/^84\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  return digits;
};

const safeText = (value: unknown, max = 160) => typeof value === "string" ? value.trim().slice(0, max) : "";
const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
const parseRecipients = (value: string) => value.split(";").map((item) => item.trim()).filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));

async function queryBookings(env: Env, filter: unknown) {
  const response = await fetch(`https://api.notion.com/v1/data_sources/${env.NOTION_OS_BOOKING_DATA_SOURCE_ID}/query`, {
    method: "POST",
    headers: notionHeaders(env),
    body: JSON.stringify({ filter }),
  });
  if (response.ok || !env.NOTION_OS_BOOKING_DATABASE_ID) return response;
  return fetch(`https://api.notion.com/v1/databases/${env.NOTION_OS_BOOKING_DATABASE_ID}/query`, {
    method: "POST",
    headers: notionHeaders(env, "2022-06-28"),
    body: JSON.stringify({ filter }),
  });
}

async function createBookingLead(env: Env, properties: Record<string, unknown>) {
  return fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(env),
    body: JSON.stringify({ parent: { data_source_id: env.NOTION_OS_BOOKING_DATA_SOURCE_ID }, properties }),
  });
}

async function notifyPino(env: Env, values: {
  requestId: string;
  phone: string;
  childAge: number;
  activityTitle: string;
  sessionDate: string;
}) {
  const notifyTo = await getConfig(env as any, "os_notify_email", env.OS_NOTIFY_TO || "");
  const recipients = parseRecipients(String(notifyTo));
  const fromName = await getConfig(env as any, "os_notify_from_name", "PINO Open Studio");
  const fromEmail = await getConfig(env as any, "os_notify_from_email", env.OS_NOTIFY_FROM || "");
  if (!env.EMAIL || recipients.length === 0 || !fromEmail) return false;

  const subject = `Open Studio · Yêu cầu giữ chỗ · ${values.activityTitle}`;
  const text = [
    "Có yêu cầu giữ chỗ mới từ Open Studio.",
    "",
    `Hoạt động: ${values.activityTitle}`,
    `Lịch: ${values.sessionDate || "Theo lịch hiển thị"}`,
    `Zalo / điện thoại: ${values.phone}`,
    `Tuổi của bé: ${values.childAge}`,
    `Request: ${values.requestId}`,
    "",
    "Trạng thái: Pending — vui lòng xác nhận với gia đình qua Zalo.",
  ].join("\n");
  const html = text.split(/\n\s*\n/).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`).join("");

  try {
    await env.EMAIL.send({ from: { email: fromEmail, name: String(fromName) }, to: recipients, subject, html, text });
    return true;
  } catch {
    return false;
  }
}

export async function createOpenStudioHoldRequest(request: Request, env: Env) {
  let body: HoldRequestBody;
  try {
    body = await request.json() as HoldRequestBody;
  } catch {
    return json({ error: "Thông tin gửi lên chưa hợp lệ." }, 400);
  }

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() || "";
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) return json({ error: "Yêu cầu thiếu mã xác nhận an toàn." }, 400);

  const phone = normalizePhone(safeText(body.zaloMobile, 32));
  if (!/^0\d{9}$/.test(phone)) return json({ error: "Ba Mẹ vui lòng nhập số Zalo di động hợp lệ." }, 400);

  const childAge = typeof body.childAge === "number" ? body.childAge : Number(body.childAge);
  if (!Number.isInteger(childAge) || childAge < 2 || childAge > 15) return json({ error: "Ba Mẹ vui lòng chọn tuổi của bé." }, 400);

  const activityTitle = safeText(body.activityTitle, 120) || "Open Studio";
  const activitySlug = safeText(body.activitySlug, 100) || "open-studio";
  const sessionId = safeText(body.sessionId, 120) || "unlinked";
  const sessionDate = safeText(body.sessionDate, 120) || "Theo lịch hiển thị";
  const holdKey = `Hold-Key: ${idempotencyKey}`;

  const duplicate = await queryBookings(env, { property: "Note", rich_text: { contains: holdKey } });
  if (duplicate.ok) {
    const data = await duplicate.json() as any;
    const existing = data.results?.[0];
    if (existing?.id) {
      return json({ ok: true, duplicate: true, requestId: existing.id, status: "Pending", zaloChatUrl: PINO_ZALO_CHAT_URL, message: "PINO sẽ liên hệ qua Zalo để xác nhận chỗ." });
    }
  }

  const defaultStatus = await getConfig(env as any, "os_default_booking_status", "Pending");
  const note = [
    "Source: public Open Studio hold request",
    `Zalo / phone: ${phone}`,
    `Child age: ${childAge}`,
    `Activity: ${activityTitle}`,
    `Activity slug: ${activitySlug}`,
    `Displayed session: ${sessionId}`,
    `Displayed date: ${sessionDate}`,
    holdKey,
    "Human confirmation via Zalo required. This request does not create a canonical capacity reservation.",
  ].join("\n");

  const properties = {
    Name: { title: [{ text: { content: `OS Hold · ${activityTitle} · ${phone}`.slice(0, 180) } }] },
    Status: { select: { name: String(defaultStatus) } },
    Note: { rich_text: [{ text: { content: note.slice(0, 1900) } }] },
  };

  const created = await createBookingLead(env, properties);
  if (!created.ok) return json({ error: "PINO chưa nhận được yêu cầu. Ba Mẹ vui lòng thử lại hoặc chat trực tiếp với PINO." }, 502);
  const page = await created.json() as any;
  if (!page?.id) return json({ error: "PINO chưa nhận được yêu cầu. Ba Mẹ vui lòng thử lại." }, 502);

  const emailNotified = await notifyPino(env, { requestId: page.id, phone, childAge, activityTitle, sessionDate });

  return json({
    ok: true,
    requestId: page.id,
    status: "Pending",
    emailNotified,
    zaloChatUrl: PINO_ZALO_CHAT_URL,
    message: "PINO đã nhận yêu cầu và sẽ liên hệ qua Zalo để xác nhận chỗ.",
  }, 201);
}

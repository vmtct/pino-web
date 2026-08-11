import worker from "./worker";
import { getMember } from "./lib/member";

type Env = {
  NOTION_TOKEN: string;
  NOTION_PARENT_DATA_SOURCE_ID: string;
  NOTION_STUDENT_DATA_SOURCE_ID: string;
  NOTION_OS_PASS_DATA_SOURCE_ID: string;
  NOTION_OS_BOOKING_DATA_SOURCE_ID: string;
  NOTION_OS_BOOKING_DATABASE_ID?: string;
  NOTION_OS_SESSION_DATA_SOURCE_ID: string;
  NOTION_OS_SESSION_DATABASE_ID?: string;
  NOTION_RUNNING_CLASS_DATA_SOURCE_ID: string;
  NOTION_PATH_PROGRAM_DATA_SOURCE_ID: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });
const headers = (env: Env, version = "2026-03-11") => ({ Authorization: `Bearer ${env.NOTION_TOKEN}`, "Content-Type": "application/json", "Notion-Version": version });
const query = async (env: Env, dataSourceId: string, filter?: unknown) => {
  const response = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, { method: "POST", headers: headers(env), body: JSON.stringify(filter ? { filter } : {}) });
  if (response.ok) return response;
  if (dataSourceId === env.NOTION_OS_SESSION_DATA_SOURCE_ID && env.NOTION_OS_SESSION_DATABASE_ID) return fetch(`https://api.notion.com/v1/databases/${env.NOTION_OS_SESSION_DATABASE_ID}/query`, { method: "POST", headers: headers(env, "2022-06-28"), body: JSON.stringify(filter ? { filter } : {}) });
  if (dataSourceId === env.NOTION_OS_BOOKING_DATA_SOURCE_ID && env.NOTION_OS_BOOKING_DATABASE_ID) return fetch(`https://api.notion.com/v1/databases/${env.NOTION_OS_BOOKING_DATABASE_ID}/query`, { method: "POST", headers: headers(env, "2022-06-28"), body: JSON.stringify(filter ? { filter } : {}) });
  return response;
};
const createPage = (env: Env, dataSourceId: string, properties: Record<string, unknown>) => fetch("https://api.notion.com/v1/pages", { method: "POST", headers: headers(env), body: JSON.stringify({ parent: { data_source_id: dataSourceId }, properties }) });
const updatePage = (env: Env, pageId: string, properties: Record<string, unknown>) => fetch(`https://api.notion.com/v1/pages/${pageId}`, { method: "PATCH", headers: headers(env), body: JSON.stringify({ properties }) });
const text = (p: any) => p?.title?.[0]?.plain_text || p?.rich_text?.[0]?.plain_text || p?.select?.name || "";
const date = (p: any) => p?.date?.start || null;
const select = (p: any) => p?.select?.name || null;
const relationIds = (p: any): string[] => p?.relation?.map((r: any) => r.id).filter(Boolean) || [];
const number = (p: any) => typeof p?.number === "number" ? p.number : typeof p?.formula?.number === "number" ? p.formula.number : typeof p?.rollup?.number === "number" ? p.rollup.number : null;
const normalizePhone = (value: string) => { const digits = value.replace(/\D/g, ""); return digits.replace(/^84(?=0)/, "0").replace(/^0/, ""); };
const publicPath = (value: string | null) => { const v = (value || "").trim().toLowerCase().replace(/\s+/g, " "); if (v === "pianohouse") return "Piano"; if (v === "architect") return "Mỹ thuật"; if (v === "little piner") return "Little Piner"; return null; };

async function getProgramContext(env: Env) {
  const [classesResponse, programsResponse] = await Promise.all([query(env, env.NOTION_RUNNING_CLASS_DATA_SOURCE_ID), query(env, env.NOTION_PATH_PROGRAM_DATA_SOURCE_ID)]);
  if (!classesResponse.ok || !programsResponse.ok) return { classPaths: new Map<string, string>(), classCapacities: new Map<string, number>() };
  const classes = await classesResponse.json() as { results?: any[] };
  const programs = await programsResponse.json() as { results?: any[] };
  const paths = new Map<string, string>();
  for (const page of programs.results || []) { const path = publicPath(select(page.properties?.["Master Path"])); if (path) paths.set(page.id, path); }
  const classPaths = new Map<string, string>();
  const classCapacities = new Map<string, number>();
  for (const page of classes.results || []) { const pathId = relationIds(page.properties?.["Path Program"])[0]; if (pathId && paths.get(pathId)) classPaths.set(page.id, paths.get(pathId)!); const capacity = number(page.properties?.Capacity); if (capacity !== null) classCapacities.set(page.id, capacity); }
  return { classPaths, classCapacities };
}

async function getSession(env: Env, sessionId: string) {
  const response = await query(env, env.NOTION_OS_SESSION_DATA_SOURCE_ID, { property: "id", title: { equals: sessionId } });
  if (!response.ok) {
    const fallback = await fetch(`https://api.notion.com/v1/pages/${sessionId}`, { headers: headers(env) });
    if (!fallback.ok) return { ok: false as const, status: 502, error: "Could not load session." };
    const page = await fallback.json() as any;
    return buildSession(env, page);
  }
  const data = await response.json() as { results?: any[] };
  const page = data.results?.[0];
  if (!page) return { ok: false as const, status: 404, error: "Session not found." };
  return buildSession(env, page);
}

async function buildSession(env: Env, page: any) {
  const context = await getProgramContext(env);
  const runningClassIds = relationIds(page.properties?.["Running Class"]);
  const paths = runningClassIds.map(id => context.classPaths.get(id)).filter(Boolean) as string[];
  const capacities = runningClassIds.map(id => context.classCapacities.get(id)).filter((v): v is number => typeof v === "number");
  const capacity = capacities.length ? capacities.reduce((a, b) => a + b, 0) : null;
  const countResponse = await query(env, env.NOTION_OS_BOOKING_DATA_SOURCE_ID, { and: [{ property: "OS Session", relation: { contains: page.id } }, { property: "Status", select: { equals: "Confirmed" } }] });
  if (!countResponse.ok) return { ok: false as const, status: 502, error: "Could not check session capacity." };
  const countData = await countResponse.json() as { results?: any[] };
  return { ok: true as const, session: { id: page.id, topic: text(page.properties?.Topic) || "Open Studio session", type: text(page.properties?.Type), path: paths[0] || null, date: date(page.properties?.Date), capacity, confirmedCount: countData.results?.length || 0, availableSeats: capacity === null ? null : Math.max(0, capacity - (countData.results?.length || 0)) } };
}

async function createMemberBooking(env: Env, phone: string, studentId: string, sessionId: string, passId: string) {
  const member = await getMember(env, phone);
  if (!member.ok) return member;
  if (!member.member.students.some(student => student.id === studentId)) return { ok: false as const, status: 403, error: "This student does not belong to this member." };

  const passResponse = await query(env, env.NOTION_OS_PASS_DATA_SOURCE_ID, { and: [{ property: "Student", relation: { contains: studentId } }, { property: "Status", select: { equals: "Available" } }] });
  if (!passResponse.ok) return { ok: false as const, status: 502, error: "Could not validate Open Studio pass." };
  const passData = await passResponse.json() as { results?: any[] };
  const pass = passData.results?.find(page => page.id === passId);
  if (!pass) return { ok: false as const, status: 409, error: "This Open Studio pass is not available." };
  const validUntil = date(pass.properties?.["Valid Until"]);
  if (validUntil && validUntil < new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date())) return { ok: false as const, status: 409, error: "This Open Studio pass has expired." };

  const sessionResult = await getSession(env, sessionId);
  if (!sessionResult.ok) return sessionResult;
  const session = sessionResult.session;
  if (session.availableSeats !== null && session.availableSeats <= 0) return { ok: false as const, status: 409, error: "This session is sold out." };

  const duplicateResponse = await query(env, env.NOTION_OS_BOOKING_DATA_SOURCE_ID, { and: [{ property: "Student", relation: { contains: studentId } }, { property: "OS Session", relation: { contains: sessionId } }, { property: "Status", select: { equals: "Confirmed" } }] });
  if (!duplicateResponse.ok) return { ok: false as const, status: 502, error: "Could not check existing booking." };
  const duplicateData = await duplicateResponse.json() as { results?: any[] };
  if ((duplicateData.results?.length || 0) > 0) return { ok: false as const, status: 409, error: "This student is already booked for this session." };

  const passType = select(pass.properties?.["Pass Type"]);
  const allowed = passType === "Bring-a-Friend" || (session.type === "Open Studio" || session.type === "Premium");
  if (!allowed) return { ok: false as const, status: 409, error: "This pass cannot access this session." };

  const bookingResponse = await createPage(env, env.NOTION_OS_BOOKING_DATA_SOURCE_ID, { Name: { title: [{ text: { content: `${session.topic} · ${studentId.slice(0, 6)}` } }] }, Student: { relation: [{ id: studentId }] }, "OS Session": { relation: [{ id: sessionId }] }, "OS Pass": { relation: [{ id: passId }] }, Status: { select: { name: "Confirmed" } } });
  if (!bookingResponse.ok) return { ok: false as const, status: 502, error: "Could not create booking.", detail: (await bookingResponse.text()).slice(0, 500) };
  const booking = await bookingResponse.json() as { id?: string };
  if (!booking.id) return { ok: false as const, status: 502, error: "Booking created without an ID." };
  const passUpdate = await updatePage(env, passId, { Status: { select: { name: "Used" } } });
  if (!passUpdate.ok) return { ok: false as const, status: 502, error: "Booking was created but pass could not be consumed.", bookingId: booking.id };
  return { ok: true as const, bookingId: booking.id, studentId, sessionId, passId, status: "Confirmed", sessionTopic: session.topic, sessionDate: session.date };
}

const memberHandler = {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (url.pathname === "/api/member") {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      let body: any; try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
      const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
      if (!phone) return json({ error: "phone is required." }, 400);
      const result = await getMember(env, phone);
      return result.ok ? json(result) : json(result, result.status);
    }
    if (url.pathname === "/api/member/book") {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      let body: any; try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
      const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
      const studentId = typeof body?.studentId === "string" ? body.studentId : "";
      const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
      const passId = typeof body?.passId === "string" ? body.passId : "";
      if (!phone || !studentId || !sessionId || !passId) return json({ error: "phone, studentId, sessionId and passId are required." }, 400);
      const result = await createMemberBooking(env, phone, studentId, sessionId, passId);
      return result.ok ? json(result) : json(result, result.status);
    }
    return worker.fetch(request, env as any);
  },
};

export default memberHandler;

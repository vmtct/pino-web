type Env = {
  NOTION_TOKEN: string;
  NOTION_OS_SESSION_DATA_SOURCE_ID: string;
  NOTION_OS_BOOKING_DATA_SOURCE_ID: string;
  NOTION_OS_PASS_DATA_SOURCE_ID: string;
  NOTION_RUNNING_CLASS_DATA_SOURCE_ID: string;
  NOTION_PATH_PROGRAM_DATA_SOURCE_ID: string;
};

type Result = { ok: true; bookingId: null; status: "Validated"; sessionTopic: string; sessionDate: string | null; studentId: string; sessionId: string; passId: string } | { ok: false; status: number; error: string };

const headers = (env: Env) => ({ Authorization: `Bearer ${env.NOTION_TOKEN}`, "Content-Type": "application/json", "Notion-Version": "2026-03-11" });
const query = async (env: Env, id: string, filter: unknown, sorts?: unknown) => {
  const response = await fetch(`https://api.notion.com/v1/data_sources/${id}/query`, { method: "POST", headers: headers(env), body: JSON.stringify({ filter, ...(sorts ? { sorts } : {}) }) });
  return response.ok ? response : null;
};
const page = async (env: Env, id: string) => { const r = await fetch(`https://api.notion.com/v1/pages/${id}`, { headers: headers(env) }); return r.ok ? await r.json() as any : null; };
const text = (p: any) => p?.title?.[0]?.plain_text || p?.rich_text?.[0]?.plain_text || p?.select?.name || p?.status?.name || "";
const select = (p: any) => p?.select?.name || p?.status?.name || null;
const date = (p: any) => p?.date?.start || null;
const relationIds = (p: any): string[] => p?.relation?.map((r: any) => r.id).filter(Boolean) || [];
const number = (p: any) => typeof p?.number === "number" ? p.number : typeof p?.formula?.number === "number" ? p.formula.number : typeof p?.rollup?.number === "number" ? p.rollup.number : null;
const localDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const cycleStart = () => `${localDate().slice(0, 7)}-01`;
const sessionMs = (value: string | null) => { if (!value) return null; const normalized = value.includes(" ") && !value.includes("T") ? value.replace(" ", "T") : value; const parsed = new Date(normalized.length === 10 ? `${normalized}T23:59:59+07:00` : normalized); return Number.isNaN(parsed.getTime()) ? null : parsed.getTime(); };
const passPath = (type: string | null) => type === "Piano" ? "Piano" : type === "Art" ? "Mỹ thuật" : type === "Little Piner" ? "Little Piner" : null;

async function memberStudents(env: Env, phone: string) {
  const parents = await query(env, env.NOTION_OS_PASS_DATA_SOURCE_ID, { property: "Student", relation: { is_not_empty: true } });
  void parents;
  const r = await fetch(`https://api.notion.com/v1/data_sources/${env.NOTION_OS_PASS_DATA_SOURCE_ID}/query`, { method: "POST", headers: headers(env), body: JSON.stringify({ page_size: 1 }) });
  void r;
  return null;
}

async function getProgramContext(env: Env) {
  const [programs, classes] = await Promise.all([query(env, env.NOTION_PATH_PROGRAM_DATA_SOURCE_ID, undefined), query(env, env.NOTION_RUNNING_CLASS_DATA_SOURCE_ID, undefined)]);
  const paths = new Map<string, string>(); const caps = new Map<string, number>();
  if (!programs || !classes) return { paths, caps };
  const pData = await programs.json() as any, cData = await classes.json() as any;
  for (const p of pData.results || []) { const v = (select(p.properties?.["Master Path"]) || select(p.properties?.["Path"]) || "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim(); const path = v.includes("piano") || v === "pianohouse" ? "Piano" : v.includes("architect") || v.includes("mỹ thuật") || v.includes("my thuat") ? "Mỹ thuật" : v.includes("little piner") ? "Little Piner" : null; if (path) paths.set(p.id, path); }
  const classPaths = new Map<string, string>();
  for (const p of cData.results || []) { const id = relationIds(p.properties?.["Path Program"])[0]; if (id && paths.has(id)) classPaths.set(p.id, paths.get(id)!); const n = number(p.properties?.Capacity); if (n !== null) caps.set(p.id, n); }
  return { paths: classPaths, caps };
}

async function getSession(env: Env, sessionId: string) {
  const p = await page(env, sessionId); if (!p) return { ok: false as const, status: 404, error: "Session not found." };
  const ctx = await getProgramContext(env); const classes = relationIds(p.properties?.["Running Class"]); const paths = classes.map(id => ctx.paths.get(id)).filter(Boolean) as string[]; const capacities = classes.map(id => ctx.caps.get(id)).filter((v): v is number => typeof v === "number"); const capacity = capacities.length ? capacities.reduce((a, b) => a + b, 0) : null;
  const bookings = await query(env, env.NOTION_OS_BOOKING_DATA_SOURCE_ID, { and: [{ property: "OS Session", relation: { contains: sessionId } }, { property: "Status", select: { equals: "Confirmed" } }] });
  if (!bookings) return { ok: false as const, status: 502, error: "Could not check session capacity." };
  const data = await bookings.json() as any; const confirmed = data.results?.length || 0;
  return { ok: true as const, session: { topic: text(p.properties?.Topic) || "Open Studio session", type: text(p.properties?.Type), path: paths[0] || null, date: date(p.properties?.Date), capacity, confirmed, available: capacity === null ? null : Math.max(0, capacity - confirmed) } };
}

export async function validateMemberBooking(env: Env, body: any): Promise<Result> {
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const studentId = typeof body?.studentId === "string" ? body.studentId : "";
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  const passId = typeof body?.passId === "string" ? body.passId : "";
  if (!phone || !studentId || !sessionId || !passId) return { ok: false, status: 400, error: "phone, studentId, sessionId and passId are required." };

  const memberModule = await import("./member");
  const member = await memberModule.getMember(env as any, phone);
  if (!member.ok) return member as any;
  if (!member.member.students.some((s: any) => s.id === studentId)) return { ok: false, status: 403, error: "This student does not belong to this member." };

  const passes = await query(env, env.NOTION_OS_PASS_DATA_SOURCE_ID, { and: [{ property: "Student", relation: { contains: studentId } }, { property: "Cycle Start", date: { equals: cycleStart() } }, { property: "Status", select: { equals: "Available" } }] });
  if (!passes) return { ok: false, status: 502, error: "Could not load current Open Studio passes." };
  const passData = await passes.json() as any; const pass = (passData.results || []).find((p: any) => p.id === passId);
  if (!pass) return { ok: false, status: 409, error: "This Open Studio pass is not available in the current cycle." };
  const validUntil = date(pass.properties?.["Valid Until"]); if (validUntil && validUntil < localDate()) return { ok: false, status: 409, error: "This Open Studio pass has expired." };

  const sessionResult = await getSession(env, sessionId); if (!sessionResult.ok) return sessionResult;
  const session = sessionResult.session; const start = sessionMs(session.date); const now = Date.now();
  if (start === null) return { ok: false, status: 409, error: "This session has no valid date/time." };
  if (start < now) return { ok: false, status: 409, error: "This session has already started and is read-only." };
  if (start > now + 7 * 24 * 60 * 60 * 1000) return { ok: false, status: 409, error: "This session is outside the 7-day booking window." };
  const type = (session.type || "").normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
  if (type !== "open studio" && type !== "premium") return { ok: false, status: 409, error: `This session is not bookable with an Open Studio pass (${session.type || "unknown type"}).` };
  if (session.available !== null && session.available <= 0) return { ok: false, status: 409, error: "This session is sold out." };

  const passType = select(pass.properties?.["Pass Type"]); const path = passPath(passType);
  if (passType !== "Bring-a-Friend" && path !== session.path) return { ok: false, status: 409, error: "This pass cannot access this session." };
  const duplicate = await query(env, env.NOTION_OS_BOOKING_DATA_SOURCE_ID, { and: [{ property: "Student", relation: { contains: studentId } }, { property: "OS Session", relation: { contains: sessionId } }, { property: "Status", select: { equals: "Confirmed" } }] });
  if (!duplicate) return { ok: false, status: 502, error: "Could not check existing booking." };
  const duplicateData = await duplicate.json() as any; if ((duplicateData.results?.length || 0) > 0) return { ok: false, status: 409, error: "This student is already booked for this session." };
  const passBookings = await query(env, env.NOTION_OS_BOOKING_DATA_SOURCE_ID, { and: [{ property: "OS Pass", relation: { contains: passId } }, { property: "Status", select: { equals: "Confirmed" } }] });
  if (!passBookings) return { ok: false, status: 502, error: "Could not validate pass usage." };
  const passBookingData = await passBookings.json() as any; if ((passBookingData.results?.length || 0) > 0) return { ok: false, status: 409, error: "This Open Studio pass has already been used." };

  return { ok: true, bookingId: null, status: "Validated", sessionTopic: session.topic, sessionDate: session.date, studentId, sessionId, passId };
}

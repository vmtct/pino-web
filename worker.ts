type AssetFetcher = { fetch(request: Request): Promise<Response> };

interface Env {
  ASSETS: AssetFetcher;
  NOTION_TOKEN: string;
  NOTION_PARENT_DATA_SOURCE_ID: string;
  NOTION_STUDENT_DATA_SOURCE_ID: string;
  NOTION_OS_PASS_DATA_SOURCE_ID: string;
  NOTION_OS_SESSION_DATA_SOURCE_ID: string;
}

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });
const notionHeaders = (env: Env) => ({ Authorization: `Bearer ${env.NOTION_TOKEN}`, "Content-Type": "application/json", "Notion-Version": "2026-03-11" });

async function notionQuery(env: Env, dataSourceId: string, filter?: unknown) {
  return fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, { method: "POST", headers: notionHeaders(env), body: JSON.stringify(filter ? { filter } : {}) });
}

const text = (p: any, fallback = "") => p?.title?.[0]?.plain_text || p?.rich_text?.[0]?.plain_text || p?.select?.name || fallback;
const date = (p: any) => p?.date?.start || null;
const number = (p: any) => typeof p?.number === "number" ? p.number : null;
const files = (p: any) => p?.files?.map((f: any) => f.file?.url || f.external?.url).filter(Boolean) || [];

async function sessions(env: Env, searchParams: URLSearchParams) {
  const filterParts: any[] = [];
  const type = searchParams.get("type");
  const path = searchParams.get("path");
  if (type) filterParts.push({ property: "Type", select: { equals: type } });
  if (path) filterParts.push({ property: "Path - Program", select: { equals: path } });
  const filter = filterParts.length === 0 ? undefined : filterParts.length === 1 ? filterParts[0] : { and: filterParts };
  const response = await notionQuery(env, env.NOTION_OS_SESSION_DATA_SOURCE_ID, filter);
  if (!response.ok) return { ok: false as const, status: 502, error: "Could not load Open Studio sessions.", detail: (await response.text()).slice(0, 1000) };
  const result = await response.json() as { results?: any[] };
  const items = (result.results || []).map((page: any) => ({
    id: page.id,
    name: text(page.properties?.Name, "Untitled session"),
    topic: text(page.properties?.Topic),
    type: text(page.properties?.Type),
    path: text(page.properties?.["Path - Program"]),
    date: date(page.properties?.Date),
    duration: number(page.properties?.Duration),
    maxSeats: number(page.properties?.["Max Seats"]),
    availableSeats: number(page.properties?.["Available Seats"]),
    confirmedCount: number(page.properties?.["Confirmed Count"]),
    cover: files(page.properties?.Cover)[0] || null,
    avatar: files(page.properties?.Avatar)[0] || null,
  }));
  items.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  return { ok: true as const, sessions: items };
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    if (url.pathname === "/api/open-studio/sessions") {
      if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
      if (!env.NOTION_TOKEN || !env.NOTION_OS_SESSION_DATA_SOURCE_ID) return json({ error: "Session feed is not configured yet." }, 503);
      const result = await sessions(env, url.searchParams);
      return result.ok ? json(result) : json(result, result.status);
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;

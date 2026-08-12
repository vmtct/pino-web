type ContentEnv = {
  NOTION_TOKEN: string;
  NOTION_WEB_CONTENT_DATA_SOURCE_ID?: string;
};

type ContentItem = {
  key: string;
  type: string;
  content: string;
  group: string;
  language: string;
  usage: string;
  context: string;
};

const DEFAULT_CONTENT_DATA_SOURCE_ID = "0469b0c0-5fb8-40d2-a5e1-e20c1dc62e1e";
const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { expiresAt: number; values: Record<string, string> } | null = null;

const headers = (env: ContentEnv) => ({
  Authorization: `Bearer ${env.NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2026-03-11",
});

const text = (property: any) =>
  property?.title?.[0]?.plain_text ||
  property?.rich_text?.[0]?.plain_text ||
  property?.select?.name ||
  property?.status?.name ||
  "";

export async function getWebContent(env: ContentEnv): Promise<Record<string, string>> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.values;

  const dataSourceId = env.NOTION_WEB_CONTENT_DATA_SOURCE_ID || DEFAULT_CONTENT_DATA_SOURCE_ID;
  const response = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
    method: "POST",
    headers: headers(env),
    body: JSON.stringify({
      filter: {
        and: [
          { property: "Environment", select: { equals: "Production" } },
          { property: "Status", status: { equals: "Published" } },
          { property: "Active", checkbox: { equals: true } },
          { property: "Language", select: { equals: "vi" } },
        ],
      },
    }),
  });

  if (!response.ok) throw new Error(`Web content query failed: ${response.status}`);

  const data = (await response.json()) as any;
  const values: Record<string, string> = {};
  for (const page of data.results || []) {
    const props = page.properties || {};
    const key = text(props["Content Key"]).trim();
    if (!key) continue;
    values[key] = text(props.Content);
  }

  cache = { expiresAt: now + CACHE_TTL_MS, values };
  return values;
}

export async function getContent(env: ContentEnv, key: string, fallback: string): Promise<string> {
  try {
    const values = await getWebContent(env);
    return values[key] ?? fallback;
  } catch {
    return fallback;
  }
}

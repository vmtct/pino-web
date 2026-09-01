type ContentEnv = {
  NOTION_TOKEN: string;
  NOTION_WEB_CONTENT_DATA_SOURCE_ID?: string;
};

export type NotionContentRow = { properties?: Record<string, unknown> };

const DEFAULT_CONTENT_DATA_SOURCE_ID = "0469b0c0-5fb8-40d2-a5e1-e20c1dc62e1e";
export const CMS_CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { expiresAt: number; values: Record<string, string> } | null = null;

const headers = (env: ContentEnv) => ({
  Authorization: `Bearer ${env.NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2026-03-11",
});

const value = (property: any) =>
  property?.title?.map((item: any) => item?.plain_text || "").join("") ||
  property?.rich_text?.map((item: any) => item?.plain_text || "").join("") ||
  property?.select?.name ||
  property?.status?.name ||
  "";

const checkbox = (property: any) => property?.checkbox === true;

export const WEB_CONTENT_LANGUAGES = ["vi", "en"] as const;
const webContentLanguages = new Set<string>(WEB_CONTENT_LANGUAGES);

function localizedContentKey(key: string, language: string): string {
  const suffixed = key.match(/^(.*)__(vi|en)$/);
  if (suffixed) {
    const [, baseKey, suffixLanguage] = suffixed;
    if (!baseKey || suffixLanguage !== language) return "";
    return suffixLanguage === "en" ? `${baseKey}__en` : baseKey;
  }
  return language === "en" ? `${key}__en` : key;
}

export function publishedContentQueryFilter() {
  return { and: [
    { property: "Environment", select: { equals: "Production" } },
    { property: "Status", select: { equals: "Published" } },
    { property: "Active", checkbox: { equals: true } },
    { or: WEB_CONTENT_LANGUAGES.map((language) => ({ property: "Language", select: { equals: language } })) },
  ] };
}

export function selectPublishedContent(rows: NotionContentRow[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const row of rows) {
    const props = row?.properties as Record<string, any> | undefined;
    if (!props) continue;
    const language = value(props.Language).trim().toLowerCase();
    if (value(props.Environment) !== "Production"
      || value(props.Status) !== "Published"
      || !webContentLanguages.has(language)
      || !checkbox(props.Active)) continue;

    const rawKey = value(props["Content Key"]).trim();
    const key = localizedContentKey(rawKey, language);
    const content = value(props.Content).trim();
    if (!key || !content) continue;
    if (Object.prototype.hasOwnProperty.call(values, key)) throw new Error(`Duplicate published CMS key: ${key}`);
    values[key] = content;
  }
  return values;
}

async function queryAllRows(env: ContentEnv, dataSourceId: string): Promise<NotionContentRow[]> {
  const rows: NotionContentRow[] = [];
  let startCursor: string | undefined;
  do {
    const response = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
      method: "POST",
      headers: headers(env),
      body: JSON.stringify({
        page_size: 100,
        ...(startCursor ? { start_cursor: startCursor } : {}),
        filter: publishedContentQueryFilter(),
      }),
    });
    if (!response.ok) throw new Error(`Web content query failed: ${response.status}`);
    const data = await response.json() as { results?: NotionContentRow[]; has_more?: boolean; next_cursor?: string | null };
    rows.push(...(data.results || []));
    startCursor = data.has_more && data.next_cursor ? data.next_cursor : undefined;
  } while (startCursor);
  return rows;
}

export async function getWebContent(env: ContentEnv): Promise<Record<string, string>> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.values;
  const dataSourceId = env.NOTION_WEB_CONTENT_DATA_SOURCE_ID || DEFAULT_CONTENT_DATA_SOURCE_ID;
  const values = selectPublishedContent(await queryAllRows(env, dataSourceId));
  cache = { expiresAt: now + CMS_CACHE_TTL_MS, values };
  return values;
}

export async function getContent(env: ContentEnv, key: string, fallback: string): Promise<string> {
  try {
    const content = (await getWebContent(env))[key]?.trim();
    return content || fallback;
  } catch {
    return fallback;
  }
}

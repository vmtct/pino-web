type ImageEnv = {
  NOTION_TOKEN: string;
  NOTION_WEB_IMAGE_DATA_SOURCE_ID?: string;
};

export type ImageAsset = {
  key: string;
  url: string;
  alt: string;
  aspectRatio: string;
  type: string;
  group: string;
};

export type NotionImageRow = { properties?: Record<string, unknown> };

const DEFAULT_IMAGE_DATA_SOURCE_ID = "153da689-1870-4495-9ad7-4564bb08c199";
const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { expiresAt: number; values: Record<string, ImageAsset> } | null = null;

const headers = (env: ImageEnv) => ({
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

const isCanonicalMediaUrl = (candidate: string) => {
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" && url.hostname === "assets.pinohouse.art" && url.pathname !== "/";
  } catch {
    return false;
  }
};

export function selectReadyImages(rows: NotionImageRow[]): Record<string, ImageAsset> {
  const values: Record<string, ImageAsset> = {};
  for (const row of rows) {
    const props = row?.properties as Record<string, any> | undefined;
    if (!props) continue;
    if (value(props.Environment) !== "Production"
      || value(props.Status) !== "Ready"
      || props.Active?.checkbox !== true) continue;

    const key = value(props["Asset Key"]).trim();
    const url = typeof props["CDN Link"]?.url === "string" ? props["CDN Link"].url.trim() : "";
    if (!key || !isCanonicalMediaUrl(url)) continue;
    if (Object.prototype.hasOwnProperty.call(values, key)) throw new Error(`Duplicate ready CMS image key: ${key}`);
    values[key] = {
      key,
      url,
      alt: value(props["Alt Text"]).trim(),
      aspectRatio: value(props["Aspect Ratio"]).trim(),
      type: value(props.Type).trim(),
      group: value(props.Group).trim(),
    };
  }
  return values;
}

async function queryAllRows(env: ImageEnv, dataSourceId: string): Promise<NotionImageRow[]> {
  const rows: NotionImageRow[] = [];
  let startCursor: string | undefined;
  do {
    const response = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
      method: "POST",
      headers: headers(env),
      body: JSON.stringify({
        page_size: 100,
        ...(startCursor ? { start_cursor: startCursor } : {}),
        filter: { and: [
          { property: "Environment", select: { equals: "Production" } },
          { property: "Status", select: { equals: "Ready" } },
          { property: "Active", checkbox: { equals: true } },
        ] },
      }),
    });
    if (!response.ok) throw new Error(`Web image query failed: ${response.status}`);
    const data = await response.json() as { results?: NotionImageRow[]; has_more?: boolean; next_cursor?: string | null };
    rows.push(...(data.results || []));
    startCursor = data.has_more && data.next_cursor ? data.next_cursor : undefined;
  } while (startCursor);
  return rows;
}

export async function getWebImages(env: ImageEnv): Promise<Record<string, ImageAsset>> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.values;
  const dataSourceId = env.NOTION_WEB_IMAGE_DATA_SOURCE_ID || DEFAULT_IMAGE_DATA_SOURCE_ID;
  const values = selectReadyImages(await queryAllRows(env, dataSourceId));
  cache = { expiresAt: now + CACHE_TTL_MS, values };
  return values;
}

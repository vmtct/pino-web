type ImageEnv = {
  NOTION_TOKEN: string;
  NOTION_WEB_IMAGE_DATA_SOURCE_ID?: string;
};

type ImageAsset = {
  key: string;
  url: string;
  alt: string;
  aspectRatio: string;
  type: string;
  group: string;
};

const DEFAULT_IMAGE_DATA_SOURCE_ID = "153da689-1870-4495-9ad7-4564bb08c199";
const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { expiresAt: number; values: Record<string, ImageAsset> } | null = null;

const headers = (env: ImageEnv) => ({
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

export async function getWebImages(env: ImageEnv): Promise<Record<string, ImageAsset>> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.values;

  const dataSourceId = env.NOTION_WEB_IMAGE_DATA_SOURCE_ID || DEFAULT_IMAGE_DATA_SOURCE_ID;
  const response = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
    method: "POST",
    headers: headers(env),
    body: JSON.stringify({
      filter: {
        and: [
          { property: "Environment", select: { equals: "Production" } },
          { property: "Active", checkbox: { equals: true } },
        ],
      },
    }),
  });

  if (!response.ok) throw new Error(`Web image query failed: ${response.status}`);

  const data = (await response.json()) as any;
  const values: Record<string, ImageAsset> = {};
  for (const page of data.results || []) {
    const props = page.properties || {};
    const key = text(props["Asset Key"]).trim();
    const url = props["CDN Link"]?.url || props["Cloudinary Secure URL"]?.url || "";
    if (!key || !url) continue;
    values[key] = {
      key,
      url,
      alt: text(props["Alt Text"]),
      aspectRatio: text(props["Aspect Ratio"]),
      type: text(props.Type),
      group: text(props.Group),
    };
  }

  cache = { expiresAt: now + CACHE_TTL_MS, values };
  return values;
}

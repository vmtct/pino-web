type ConfigEnv = {
  NOTION_TOKEN: string;
  NOTION_WEB_CONFIG_DATA_SOURCE_ID: string;
};

type ConfigValue = string | number | boolean;

const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { expiresAt: number; values: Record<string, ConfigValue> } | null = null;

const notionHeaders = (env: ConfigEnv) => ({
  Authorization: `Bearer ${env.NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2026-03-11",
});

const richText = (property: any) =>
  property?.title?.[0]?.plain_text ||
  property?.rich_text?.[0]?.plain_text ||
  property?.select?.name ||
  property?.status?.name ||
  "";

const parseValue = (raw: string, type: string): ConfigValue => {
  if (type === "number") {
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  }
  if (type === "boolean") return ["true", "1", "yes", "on"].includes(raw.trim().toLowerCase());
  return raw;
};

export async function getWebConfig(env: ConfigEnv): Promise<Record<string, ConfigValue>> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.values;

  const response = await fetch(
    `https://api.notion.com/v1/data_sources/${env.NOTION_WEB_CONFIG_DATA_SOURCE_ID}/query`,
    {
      method: "POST",
      headers: notionHeaders(env),
      body: JSON.stringify({
        filter: {
          and: [
            { property: "Environment", select: { equals: "Production" } },
            { property: "Active", checkbox: { equals: true } },
          ],
        },
      }),
    },
  );

  if (!response.ok) throw new Error(`Web config query failed: ${response.status}`);

  const data = (await response.json()) as any;
  const values: Record<string, ConfigValue> = {};

  for (const page of data.results || []) {
    const props = page.properties || {};
    const key = richText(props.Key).trim();
    if (!key) continue;
    const type = richText(props.Type) || "text";
    values[key] = parseValue(richText(props.Value), type);
  }

  cache = { expiresAt: now + CONFIG_CACHE_TTL_MS, values };
  return values;
}

export async function getConfig<T extends ConfigValue>(
  env: ConfigEnv,
  key: string,
  fallback: T,
): Promise<T> {
  try {
    const values = await getWebConfig(env);
    const value = values[key];
    return (value === undefined ? fallback : value) as T;
  } catch {
    // Config is operationally useful, but a Notion outage must not take OS down.
    return fallback;
  }
}

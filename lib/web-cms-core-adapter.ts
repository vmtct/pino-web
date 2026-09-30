export type WebCmsCoreEnv = {
  PINO_WEB_CMS_CORE?: { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> };
};

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type Locale = "vi" | "en";
type BundleSlot = { key?: unknown; kind?: unknown; source?: unknown; value?: unknown };
type BundlePage = { page?: unknown; slots?: unknown };
type Bundle = { site?: unknown; locale?: unknown; pages?: unknown };

const TEXT_KINDS = new Set(["HEADING", "BODY", "LABEL", "CTA_LABEL", "SEO_TITLE", "SEO_DESCRIPTION"]);

async function readBundle(locale: Locale, env: WebCmsCoreEnv, fetcher?: Fetcher): Promise<Bundle> {
  const upstreamFetch = fetcher ?? env.PINO_WEB_CMS_CORE?.fetch.bind(env.PINO_WEB_CMS_CORE);
  if (!upstreamFetch) throw new Error("PINO_WEB_CMS_CORE service binding unavailable");
  const response = await upstreamFetch(`https://pino-core.internal/v1/web-cms/bundles/PINOHOUSE?locale=${locale}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Core Web CMS bundle unavailable: ${response.status}`);
  const payload = await response.json() as { data?: Bundle };
  const bundle = payload.data;
  if (!bundle || bundle.site !== "PINOHOUSE" || bundle.locale !== locale || !Array.isArray(bundle.pages)) {
    throw new Error("Invalid Core Web CMS bundle");
  }
  return bundle;
}

function textValues(bundle: Bundle): Map<string, string> {
  const values = new Map<string, string>();
  for (const rawPage of bundle.pages as BundlePage[]) {
    if (!rawPage || typeof rawPage !== "object" || !Array.isArray(rawPage.slots)) throw new Error("Invalid Core Web CMS page");
    for (const rawSlot of rawPage.slots as BundleSlot[]) {
      if (!rawSlot || typeof rawSlot !== "object") throw new Error("Invalid Core Web CMS slot");
      if (!TEXT_KINDS.has(String(rawSlot.kind))) continue;
      if (typeof rawSlot.key !== "string" || !rawSlot.key.trim() || typeof rawSlot.value !== "string" || !rawSlot.value.trim()) {
        throw new Error("Invalid Core Web CMS text slot");
      }
      if (rawSlot.source !== "PUBLISHED" && rawSlot.source !== "FALLBACK") throw new Error("Invalid Core Web CMS source");
      const key = rawSlot.key.trim();
      if (values.has(key)) throw new Error(`Duplicate Core Web CMS key: ${key}`);
      values.set(key, rawSlot.value);
    }
  }
  return values;
}

export async function getCoreWebContent(env: WebCmsCoreEnv, fetcher?: Fetcher): Promise<Record<string, string>> {
  const [viBundle, enBundle] = await Promise.all([
    readBundle("vi", env, fetcher),
    readBundle("en", env, fetcher),
  ]);
  const vi = textValues(viBundle);
  const en = textValues(enBundle);
  if (vi.size !== en.size || [...vi.keys()].some((key) => !en.has(key))) {
    throw new Error("Core Web CMS locale slot identity mismatch");
  }
  const content: Record<string, string> = {};
  for (const [key, value] of vi) content[key] = value;
  for (const [key, value] of en) content[`${key}__en`] = value;
  return content;
}

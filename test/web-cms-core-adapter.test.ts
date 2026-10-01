import assert from "node:assert/strict";
import test from "node:test";
import { getCoreWebContent } from "../lib/web-cms-core-adapter.ts";

const bundle = (locale: "vi" | "en", slots: unknown[]) => ({
  data: { site: "PINOHOUSE", locale, pages: [{ page: "home", slots }] },
});
const slot = (key: string, value: string, source = "FALLBACK") => ({
  key, kind: "BODY", source, value,
});

test("canonical CMS adapter maps VI and EN bundles into existing hydration keys", async () => {
  const fetcher = async (input: RequestInfo | URL) => {
    const locale = new URL(String(input)).searchParams.get("locale") as "vi" | "en";
    const body = locale === "vi"
      ? bundle("vi", [slot("hero", "Xin chào"), slot("cta", "Khám phá", "PUBLISHED")])
      : bundle("en", [slot("hero", "Hello"), slot("cta", "Explore", "PUBLISHED")]);
    return Response.json(body);
  };
  assert.deepEqual(await getCoreWebContent({}, fetcher), {
    hero: "Xin chào", cta: "Khám phá", hero__en: "Hello", cta__en: "Explore",
  });
});

test("canonical CMS adapter ignores image slots while image cutover remains separate", async () => {
  const fetcher = async (input: RequestInfo | URL) => {
    const locale = new URL(String(input)).searchParams.get("locale") as "vi" | "en";
    return Response.json(bundle(locale, [
      slot("hero", locale === "vi" ? "Xin chào" : "Hello"),
      { key: "hero_image", kind: "IMAGE", source: "FALLBACK", value: { url: "https://assets.pinohouse.art/x.webp" } },
    ]));
  };
  assert.deepEqual(await getCoreWebContent({}, fetcher), { hero: "Xin chào", hero__en: "Hello" });
});

test("canonical CMS adapter fails closed on dependency and bundle drift", async () => {
  await assert.rejects(
    () => getCoreWebContent({}, async () => new Response("upstream", { status: 503 })),
    /unavailable/,
  );
  const duplicateFetcher = async (input: RequestInfo | URL) => {
    const locale = new URL(String(input)).searchParams.get("locale") as "vi" | "en";
    return Response.json(bundle(locale, [slot("hero", "A"), slot("hero", "B")]));
  };
  await assert.rejects(() => getCoreWebContent({}, duplicateFetcher), /Duplicate/);

  const mismatchFetcher = async (input: RequestInfo | URL) => {
    const locale = new URL(String(input)).searchParams.get("locale") as "vi" | "en";
    return Response.json(bundle(locale, locale === "vi" ? [slot("hero", "A")] : [slot("different", "B")]));
  };
  await assert.rejects(() => getCoreWebContent({}, mismatchFetcher), /locale slot identity mismatch/);
});

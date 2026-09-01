import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { publishedContentQueryFilter, selectPublishedContent } from "../lib/web-content.ts";
import { selectReadyImages } from "../lib/web-images.ts";

const text = (value: string) => ({ rich_text: [{ plain_text: value }] });
const title = (value: string) => ({ title: [{ plain_text: value }] });
const select = (name: string) => ({ select: { name } });
const contentRow = (key: string, content: string, overrides: Record<string, unknown> = {}) => ({ properties: {
  "Content Key": title(key), Content: text(content), Environment: select("Production"),
  Status: select("Published"), Language: select("vi"), Active: { checkbox: true }, ...overrides,
} });
const imageRow = (key: string, url: string, overrides: Record<string, unknown> = {}) => ({ properties: {
  "Asset Key": title(key), "CDN Link": { url }, "Alt Text": text("PINO artwork"),
  Environment: select("Production"), Status: select("Ready"), Active: { checkbox: true }, ...overrides,
} });

test("published CMS selection accepts active Production Vietnamese and English content", () => {
  assert.deepEqual(selectPublishedContent([
    contentRow("hero", "Đã duyệt"),
    contentRow("hero", "Approved", { Language: select("en") }),
    contentRow("cta__en", "Explore", { Language: select("en") }),
    contentRow("wrong__vi", "No", { Language: select("en") }),
    contentRow("draft", "No", { Status: select("Draft") }),
    contentRow("inactive", "No", { Active: { checkbox: false } }),
  ]), { hero: "Đã duyệt", hero__en: "Approved", cta__en: "Explore" });
});

test("published CMS query requests both supported locales", () => {
  const filter = JSON.stringify(publishedContentQueryFilter());
  assert.match(filter, /\"Language\"/);
  assert.match(filter, /\"vi\"/);
  assert.match(filter, /\"en\"/);
});

test("empty and malformed content are ignored so UI fallbacks remain intact", () => {
  assert.deepEqual(selectPublishedContent([contentRow("empty", "  "), {}, { properties: null } as never]), {});
});

test("duplicate active production content keys fail closed after locale normalization", () => {
  assert.throws(() => selectPublishedContent([contentRow("hero", "One"), contentRow("hero", "Two")]), /Duplicate/);
  assert.throws(() => selectPublishedContent([
    contentRow("hero", "One", { Language: select("en") }),
    contentRow("hero__en", "Two", { Language: select("en") }),
  ]), /Duplicate/);
});

test("ready media selection accepts only the canonical asset host", () => {
  const result = selectReadyImages([
    imageRow("hero", "https://assets.pinohouse.art/home/hero.webp"),
    imageRow("mock", "https://res.cloudinary.com/demo/image/upload/sample.jpg"),
    imageRow("draft", "https://assets.pinohouse.art/draft.webp", { Status: select("Mock") }),
  ]);
  assert.equal(result.hero.url, "https://assets.pinohouse.art/home/hero.webp");
  assert.equal(result.mock, undefined);
  assert.equal(result.draft, undefined);
});

test("duplicate ready media keys fail closed", () => {
  assert.throws(() => selectReadyImages([
    imageRow("hero", "https://assets.pinohouse.art/a.webp"),
    imageRow("hero", "https://assets.pinohouse.art/b.webp"),
  ]), /Duplicate/);
});

test("public pages use explicit CMS keys and retain canonical session ownership", () => {
  const home = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const openStudio = readFileSync(new URL("../app/open-studio/page.tsx", import.meta.url), "utf8");
  const hydrator = readFileSync(new URL("../app/cms-hydrator.tsx", import.meta.url), "utf8");
  assert.match(home, /homepage_v2_hero_title_line_1/);
  assert.match(openStudio, /os_v2_schedule_label/);
  assert.match(openStudio, /publicSyllabusTitle\(session\.syllabus\.title\)/);
  assert.doesNotMatch(openStudio, /contentKey="[^"]*(?:syllabus_title|syllabus_description|session_title|session_date|session_time|remaining_seats|is_full)/i);
  assert.doesNotMatch(hydrator, /createTreeWalker|nodeValue/);
  assert.doesNotMatch(hydrator, /NOTION_TOKEN|api\.notion\.com/);
});

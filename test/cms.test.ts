import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { selectPublishedContent } from "../lib/web-content.ts";
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

test("published CMS selection accepts only active Production Vietnamese content", () => {
  assert.deepEqual(selectPublishedContent([
    contentRow("hero", "Approved"),
    contentRow("draft", "No", { Status: select("Draft") }),
    contentRow("english", "No", { Language: select("en") }),
    contentRow("inactive", "No", { Active: { checkbox: false } }),
  ]), { hero: "Approved" });
});

test("empty and malformed content are ignored so UI fallbacks remain intact", () => {
  assert.deepEqual(selectPublishedContent([contentRow("empty", "  "), {}, { properties: null } as never]), {});
});

test("duplicate active production content keys fail closed", () => {
  assert.throws(() => selectPublishedContent([contentRow("hero", "One"), contentRow("hero", "Two")]), /Duplicate/);
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
  assert.match(home, /homepage_hero_title_lead/);
  assert.match(openStudio, /os_schedule_title_lead/);
  assert.match(openStudio, /publicSyllabusTitle\(session\.syllabus\.title\)/);
  assert.doesNotMatch(openStudio, /contentKey="[^"]*(?:syllabus_title|syllabus_description|session_title|session_date|session_time|remaining_seats|is_full)/i);
  assert.doesNotMatch(hydrator, /createTreeWalker|nodeValue/);
  assert.doesNotMatch(hydrator, /NOTION_TOKEN|api\.notion\.com/);
});

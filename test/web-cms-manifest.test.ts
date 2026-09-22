import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../public/cms-manifest.json", import.meta.url), "utf8")) as {
  schemaVersion: number;
  site: string;
  slots: Array<{ page: string; key: string; kind: string; fallback: { type: "TEXT"; values: { vi: string; en: string } } }>;
};

test("PINOHOUSE CMS manifest is unique, locale-complete, and business-authority safe", () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.site, "PINOHOUSE");
  const ids = new Set<string>();
  const reserved = new Set(["price","pricing","schedule","capacity","availability","registration","enrollment","access","entitlement","payment","deposit","refund","policy","featureflag","feature_flag"]);
  for (const slot of manifest.slots) {
    const id = `${slot.page}\0${slot.key}`;
    assert.equal(ids.has(id), false, id);
    ids.add(id);
    assert.ok(slot.fallback.values.vi.trim(), `${slot.key}:vi`);
    assert.ok(slot.fallback.values.en.trim(), `${slot.key}:en`);
    for (const segment of `${slot.page}_${slot.key}`.split(/[._-]/)) assert.equal(reserved.has(segment), false, `${slot.key} contains reserved segment ${segment}`);
  }
});

test("rendered canonical CMS keys are represented by the manifest", () => {
  const source = ["../app/page.tsx", "../app/components/public-site.tsx", "../app/open-studio/page.tsx"]
    .map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");
  const rendered = new Set([...source.matchAll(/contentKey="([^"]+)"/g)].map((match) => match[1]));
  const declared = new Set(manifest.slots.map((slot) => slot.key));
  for (const key of rendered) assert.equal(declared.has(key), true, `missing manifest slot: ${key}`);
});

import { readFileSync } from "node:fs";

const worker = readFileSync("worker-piner.ts", "utf8");
const ui = readFileSync("app/piner/piner-member-entry.tsx", "utf8");
const adapter = readFileSync("lib/piner-member-core-adapter.ts", "utf8");

const fail = (message) => { console.error(`PINER_OPEN_STUDIO_RETIREMENT_GUARD: FAIL — ${message}`); process.exit(1); };
if (!worker.includes("PINER_OPEN_STUDIO_RETIRED") || !worker.includes("open-studio(?:\\/|$)")) fail("worker-level 410 retirement guard missing");
for (const marker of ["/open-studio", "ExploreSurface", "Giữ chỗ Open Studio", "readExploreProjection"]) {
  if (ui.includes(marker)) fail(`Piner UI still contains retired runtime marker: ${marker}`);
}
if (adapter.includes("/open-studio")) fail("private Piner adapter still forwards retired Open Studio routes");
console.log("PINER_OPEN_STUDIO_RETIREMENT_GUARD: PASS");

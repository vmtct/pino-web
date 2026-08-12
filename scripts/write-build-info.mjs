import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const publicDir = join(root, "public");
mkdirSync(publicDir, { recursive: true });

// Workers Builds injects WORKERS_CI_COMMIT_SHA at build time. Keep the
// GitHub/Pages fallbacks for local and GitHub Actions builds.
let commit =
  process.env.WORKERS_CI_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.CF_PAGES_COMMIT_SHA ||
  "unknown";

if (commit === "unknown") {
  try {
    commit = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    // Keep a deterministic fallback for environments without git metadata.
  }
}

const builtAt = new Date().toISOString();
const info = { commit, builtAt };

// Keep a public artifact for diagnostics and a Worker-native copy because the
// production smoke test verifies the deployed Worker, not the static export.
writeFileSync(join(publicDir, "build-info.json"), `${JSON.stringify(info, null, 2)}\n`);
writeFileSync(
  join(root, "worker-build-info.ts"),
  `export const WORKER_BUILD_INFO = ${JSON.stringify(info)} as const;\n`,
);

console.log(`Build info written for ${commit}`);

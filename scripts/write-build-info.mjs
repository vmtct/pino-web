import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const publicDir = join(root, "public");
mkdirSync(publicDir, { recursive: true });

let commit = process.env.GITHUB_SHA || process.env.CF_PAGES_COMMIT_SHA || "unknown";

if (commit === "unknown") {
  try {
    commit = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    // Keep a deterministic fallback for environments without git metadata.
  }
}

const builtAt = new Date().toISOString();
const info = { commit, builtAt };

// Keep a public artifact for Next/static deployments and a Worker-native copy
// because the production smoke test runs against the Cloudflare Worker route.
writeFileSync(join(publicDir, "build-info.json"), `${JSON.stringify(info, null, 2)}\n`);
writeFileSync(
  join(root, "worker-build-info.ts"),
  `export const WORKER_BUILD_INFO = ${JSON.stringify(info)} as const;\n`,
);

console.log(`Build info written for ${commit}`);

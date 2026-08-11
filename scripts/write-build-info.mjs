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

const info = {
  commit,
  builtAt: new Date().toISOString(),
};

writeFileSync(join(publicDir, "build-info.json"), `${JSON.stringify(info, null, 2)}\n`);
console.log(`Build info written for ${commit}`);

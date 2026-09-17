import { readFileSync } from "node:fs";

const APPROVED_PRODUCTION_CUTOVER = [
  "-keep_vars = true",
  "+keep_vars = false",
  '-PINO_CORE_BASE_URL = "https://pino-core-dev.minhtri-van42.workers.dev"',
  "-# Keep false while production pino-web reads from pino-core-dev. Change only after",
  "-# an explicitly approved production pino-core cutover.",
  "+[[services]]",
  '+binding = "PINO_CORE_PUBLIC"',
  '+service = "pino-core"',
  '+entrypoint = "PublicOpenStudioControlPlane"',
] as const;

export function assertApprovedProductionWranglerDiff(diff: string): void {
  const changes = diff.split(/\r?\n/).filter((line) => /^[-+][^-+]/.test(line));
  if (changes.length === 0) return;
  const exactCutover = changes.length === APPROVED_PRODUCTION_CUTOVER.length
    && APPROVED_PRODUCTION_CUTOVER.every((line, index) => changes[index] === line);
  if (!exactCutover) {
    throw new Error(`Candidate contains an unapproved production Wrangler config delta: ${changes.join(" | ")}`);
  }
}

if (process.argv[1]?.endsWith("web-production-config-diff-check.ts")) {
  try {
    assertApprovedProductionWranglerDiff(readFileSync(0, "utf8"));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

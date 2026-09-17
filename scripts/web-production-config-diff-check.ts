import { readFileSync } from "node:fs";

const ALLOWED_CORE_CUTOVER = [
  /PINO_CORE_BASE_URL/,
  /Keep false while production pino-web reads from pino-core-dev/,
  /explicitly approved production pino-core cutover/,
  /^[-+]\[\[services\]\]$/,
  /^[-+]binding = "PINO_CORE_PUBLIC"$/,
  /^[-+]service = "pino-core"$/,
  /^[-+]entrypoint = "PublicOpenStudioControlPlane"$/,
];

export function assertApprovedProductionWranglerDiff(diff: string): void {
  const changes = diff.split(/\r?\n/).filter((line) => /^[-+][^-+]/.test(line));
  const keepVars = changes.filter((line) => /^[-+]keep_vars\s*=/.test(line));
  if (keepVars.length > 0) {
    const exactTransition = keepVars.length === 2
      && keepVars.includes("-keep_vars = true")
      && keepVars.includes("+keep_vars = false");
    if (!exactTransition) throw new Error("Production keep_vars delta is not the approved true-to-false transition.");
  }
  const unexpected = changes.filter((line) => {
    if (line === "-keep_vars = true" || line === "+keep_vars = false") return false;
    return !ALLOWED_CORE_CUTOVER.some((pattern) => pattern.test(line));
  });
  if (unexpected.length > 0) {
    throw new Error(`Candidate contains an unapproved production Wrangler config delta: ${unexpected.join(" | ")}`);
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

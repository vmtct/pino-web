import { readFileSync } from "node:fs";

const APPROVED_FILE = "wrangler.toml";
const SCOPED_FILES = new Set(["wrangler.toml", "wrangler.piner.production.toml"]);
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
  "+",
] as const;
const APPROVED_PUBLIC_ROUTE_RETIREMENT = [
  "-# Incremental production cutover: Artchitect and Little Piner are served by",
  "-# pino-web while the remaining pinohouse.art pages continue to resolve to",
  "-# Webflow. Next static assets are routed separately because exported pages",
  "-# reference /_next/*.",
  "+# Canonical public-site ownership: Webflow is retired. Route the full",
  "+# pinohouse.art surface through pino-web so homepage, legal pages, and",
  "+# all exported Next.js assets share one production authority.",
  '-  { pattern = "pinohouse.art/artchitect*", zone_name = "pinohouse.art" },',
  '-  { pattern = "www.pinohouse.art/artchitect*", zone_name = "pinohouse.art" },',
  '-  { pattern = "pinohouse.art/little-piner*", zone_name = "pinohouse.art" },',
  '-  { pattern = "www.pinohouse.art/little-piner*", zone_name = "pinohouse.art" },',
  '-  { pattern = "pinohouse.art/_next/static/*", zone_name = "pinohouse.art" },',
  '-  { pattern = "www.pinohouse.art/_next/static/*", zone_name = "pinohouse.art" }',
  '+  { pattern = "pinohouse.art/*", zone_name = "pinohouse.art" },',
  '+  { pattern = "www.pinohouse.art/*", zone_name = "pinohouse.art" }',
] as const;


type DiffSection = {
  path: string;
  oldHeader: boolean;
  newHeader: boolean;
  changes: string[];
};

function reject(detail: string): never {
  throw new Error(`Candidate contains an unapproved production Wrangler config delta: ${detail}`);
}

export function assertApprovedProductionWranglerDiff(diff: string): void {
  const changedSections: DiffSection[] = [];
  const seen = new Set<string>();
  let current: DiffSection | undefined;

  const finish = () => {
    if (!current) return;
    if (!current.oldHeader || !current.newHeader) reject(`malformed headers for ${current.path}`);
    if (!SCOPED_FILES.has(current.path)) reject(`out-of-scope file ${current.path}`);
    if (seen.has(current.path)) reject(`duplicate diff section for ${current.path}`);
    seen.add(current.path);
    if (current.changes.length > 0) changedSections.push(current);
    current = undefined;
  };


  for (const line of diff.split(/\r?\n/)) {
    if (line.startsWith("diff --git ")) {
      finish();
      const match = /^diff --git a\/(\S+) b\/(\S+)$/.exec(line);
      if (!match || match[1] !== match[2]) reject(`malformed or renamed diff header: ${line}`);
      current = { path: match[1], oldHeader: false, newHeader: false, changes: [] };
      continue;
    }
    if (!current) {
      if (line.trim() !== "") reject(`content outside a diff section: ${line}`);
      continue;
    }
    if (line.startsWith("--- ")) {
      if (line !== `--- a/${current.path}`) reject(`old-file header mismatch: ${line}`);
      current.oldHeader = true;
      continue;
    }
    if (line.startsWith("+++ ")) {
      if (line !== `+++ b/${current.path}`) reject(`new-file header mismatch: ${line}`);
      current.newHeader = true;
      continue;
    }
    if (line.startsWith("+") || line.startsWith("-")) current.changes.push(line);
  }
  finish();

  if (changedSections.length === 0) return;
  if (changedSections.length !== 1 || changedSections[0].path !== APPROVED_FILE) {
    reject(`changes must be confined to ${APPROVED_FILE}`);
  }

  const changes = changedSections[0].changes;
  const exactCutover = changes.length === APPROVED_PRODUCTION_CUTOVER.length
    && APPROVED_PRODUCTION_CUTOVER.every((line, index) => changes[index] === line);
  const exactRouteRetirement = changes.length === APPROVED_PUBLIC_ROUTE_RETIREMENT.length
    && APPROVED_PUBLIC_ROUTE_RETIREMENT.every((line, index) => changes[index] === line);
  if (!exactCutover && !exactRouteRetirement) reject(changes.join(" | "));
}

if (process.argv[1]?.endsWith("web-production-config-diff-check.ts")) {
  try {
    assertApprovedProductionWranglerDiff(readFileSync(0, "utf8"));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

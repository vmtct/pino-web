import { readFileSync } from "node:fs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SHA = /^[0-9a-f]{40}$/;

export type CandidateCheckInput = {
  check_runs?: Array<Record<string, any>>;
};

export type CandidateIdentity = {
  buildUuid: string;
  candidateVersion: string;
  previewUrl: string;
};

function fail(message: string): never {
  throw new Error(message);
}

function latest(checks: Array<Record<string, any>>) {
  return [...checks].sort((a, b) => {
    const ad = String(a.started_at ?? a.completed_at ?? "");
    const bd = String(b.started_at ?? b.completed_at ?? "");
    return ad.localeCompare(bd) || Number(a.id ?? 0) - Number(b.id ?? 0);
  }).at(-1);
}

export function resolveWebProductionCandidate(
  payload: CandidateCheckInput,
  options: { webSha: string; accountId: string; worker?: string; previewAccount?: string },
): CandidateIdentity {
  const worker = options.worker ?? "pino-web";
  const previewAccount = options.previewAccount ?? "minhtri-van42";
  if (!SHA.test(options.webSha)) fail("WEB_SHA must be lowercase 40-hex.");
  if (!/^[0-9a-f]{32}$/.test(options.accountId)) fail("Cloudflare account ID is invalid.");
  if (!/^[a-z0-9-]+$/.test(worker)) fail("Worker name is invalid.");

  const runs = Array.isArray(payload?.check_runs) ? payload.check_runs : [];
  const check = latest(runs.filter((item) =>
    item?.name === `Workers Builds: ${worker}` && item?.head_sha === options.webSha
  ));
  if (!check) fail("No exact-head canonical Cloudflare Workers Build check found.");
  if (check.status !== "completed" || check.conclusion !== "success") {
    fail("Newest exact-head Cloudflare Workers Build check is not terminal success.");
  }
  if (check.app?.slug !== "cloudflare-workers-and-pages") {
    fail("Cloudflare Workers Build check did not come from the canonical Cloudflare app.");
  }
  const buildUuid = String(check.external_id ?? "");
  if (!UUID.test(buildUuid)) fail("Cloudflare build check lacks immutable build UUID.");
  const expectedDetails = `https://dash.cloudflare.com/${options.accountId}/workers/services/view/${worker}/production/builds/${buildUuid}`;
  if (check.details_url !== expectedDetails) fail("Cloudflare build details URL does not bind the same build UUID.");

  const summary = typeof check.output?.summary === "string" ? check.output.summary : "";
  const lines = summary.split(/\r?\n/);
  const versionIds = lines.flatMap((line) => {
    const match = /^Version ID:\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s*$/.exec(line);
    return match ? [match[1]] : [];
  });
  if (versionIds.length !== 1) fail("Cloudflare build summary must expose exactly one immutable Worker Version ID.");
  const candidateVersion = versionIds[0];
  const prefix = candidateVersion.slice(0, 8);
  const previewUrl = `https://${prefix}-${worker}.${previewAccount}.workers.dev`;
  const previewLines = lines.filter((line) => line.startsWith("Preview URL:"));
  if (previewLines.length !== 1 || previewLines[0].trim() !== `Preview URL: ${previewUrl}`) {
    fail("Cloudflare build summary must bind exactly one expected immutable preview URL.");
  }
  return { buildUuid, candidateVersion, previewUrl };
}

if (process.argv[1]?.endsWith("web-production-candidate-check.ts")) {
  const [webSha, accountId, worker = "pino-web"] = process.argv.slice(2);
  try {
    const payload = JSON.parse(readFileSync(0, "utf8")) as CandidateCheckInput;
    process.stdout.write(`${JSON.stringify(resolveWebProductionCandidate(payload, { webSha, accountId, worker }))}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

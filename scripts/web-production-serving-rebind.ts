import { createHash } from "node:crypto";

type Actor = { login?: unknown };
type PriorRun = {
  id?: unknown; repository?: { full_name?: unknown }; event?: unknown; run_attempt?: unknown;
  status?: unknown; conclusion?: unknown; actor?: Actor; triggering_actor?: Actor;
  path?: unknown; head_sha?: unknown; display_title?: unknown;
};
type PriorIssue = { number?: unknown; user?: Actor; title?: unknown; body?: unknown };
type PriorComment = { id?: unknown; created_at?: unknown; user?: Actor; body?: unknown };
export type ServingRebindInput = {
  webSha?: unknown; candidateVersion?: unknown; activeVersion?: unknown; activeDeploymentId?: unknown;
  currentRunId?: unknown; priorRun?: PriorRun; priorIssue?: PriorIssue; priorComments?: PriorComment[];
};

const REPO = "vmtct/pino-web";
const WORKFLOW_PATH = ".github/workflows/production-release.yml";
const ISSUE_TITLE = "[GPT] Web production release";

function fail(code: string): never { throw new Error(code); }
function oneLine(body: unknown, regex: RegExp, code: string): string {
  const matches: RegExpMatchArray[] = [];
  for (const line of String(body ?? "").split(/\r?\n/)) {
    const match = line.match(regex);
    if (match) matches.push(match);
  }
  if (matches.length !== 1 || matches[0][1] === undefined) fail(code);
  return matches[0][1];
}
function exactCount(body: unknown, value: string): number {
  return String(body ?? "").split(/\r?\n/).filter((line) => line.trim() === value).length;
}
function sha(value: unknown, code = "INVALID_SHA"): string {
  const result = String(value ?? "").toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(result)) fail(code);
  return result;
}
function uuid(value: unknown, code = "INVALID_UUID"): string {
  const result = String(value ?? "").toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(result)) fail(code);
  return result;
}
function positive(value: unknown, code: string): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 1) fail(code);
  return result;
}

export function validateServingRebindProof(input: ServingRebindInput) {
  const webSha = sha(input.webSha, "INVALID_WEB_SHA");
  const candidateVersion = uuid(input.candidateVersion, "INVALID_CANDIDATE_VERSION");
  const activeVersion = uuid(input.activeVersion, "INVALID_ACTIVE_VERSION");
  const activeDeploymentId = uuid(input.activeDeploymentId, "INVALID_ACTIVE_DEPLOYMENT");
  if (activeVersion !== candidateVersion) fail("ACTIVE_VERSION_NOT_CANDIDATE");
  const currentRunId = positive(input.currentRunId, "INVALID_CURRENT_RUN_ID");

  const run = input.priorRun ?? {};
  const priorRunId = positive(run.id, "INVALID_PRIOR_RUN_ID");
  if (priorRunId === currentRunId) fail("PRIOR_RUN_IS_CURRENT_RUN");
  if (run.repository?.full_name !== REPO || run.event !== "issues" || run.run_attempt !== 1 || run.status !== "completed" || run.conclusion !== "success") fail("INVALID_PRIOR_RUN");
  if (run.actor?.login !== "vmtct" || run.triggering_actor?.login !== "vmtct" || run.path !== WORKFLOW_PATH || sha(run.head_sha, "INVALID_PRIOR_RUN_SHA") !== webSha) fail("UNTRUSTED_PRIOR_RUN");
  const display = String(run.display_title ?? "");
  const displayMatch = display.match(new RegExp(`^Web production release #([1-9][0-9]*) @ ${webSha}$`));
  if (!displayMatch?.[1]) fail("INVALID_PRIOR_RUN_DISPLAY");
  const issueNumber = positive(displayMatch[1], "INVALID_PRIOR_ISSUE_NUMBER");

  const issue = input.priorIssue ?? {};
  if (Number(issue.number) !== issueNumber || issue.user?.login !== "vmtct" || issue.title !== ISSUE_TITLE) fail("INVALID_PRIOR_ISSUE");
  const issueBody = String(issue.body ?? "");
  if (oneLine(issueBody, /^WEB_SHA:\s*([0-9a-fA-F]{40})\s*$/, "INVALID_PRIOR_ISSUE_WEB_SHA").toLowerCase() !== webSha) fail("PRIOR_ISSUE_SHA_MISMATCH");
  if (exactCount(issueBody, "CONFIRM: RELEASE_PRODUCTION") !== 1) fail("INVALID_PRIOR_ISSUE_CONFIRMATION");
  const authHash = createHash("sha256").update(issueBody, "utf8").digest("hex");

  const terminals = (input.priorComments ?? [])
    .filter((comment) => comment.user?.login === "github-actions[bot]")
    .filter((comment) => /^WEB_PRODUCTION_RELEASE: \*\*(?:PASS|FAIL_SAFE|REJECTED)\*\*/.test(String(comment.body ?? "")))
    .toSorted((a, b) => String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")) || Number(a.id ?? 0) - Number(b.id ?? 0));
  if (!terminals.length) fail("MISSING_PRIOR_TERMINAL");
  const body = String(terminals.at(-1)?.body ?? "").replaceAll("\\n", "\n");
  if (!body.startsWith("WEB_PRODUCTION_RELEASE: **PASS**")) fail("PRIOR_TERMINAL_NOT_PASS");
  if (oneLine(body, /^- Web source:\s*([0-9a-f]{40})\s*$/, "INVALID_RECEIPT_WEB_SHA") !== webSha) fail("RECEIPT_WEB_SHA_MISMATCH");
  if (positive(oneLine(body, /^- Workflow run:\s*([1-9][0-9]*)\s*$/, "INVALID_RECEIPT_RUN"), "INVALID_RECEIPT_RUN") !== priorRunId) fail("RECEIPT_RUN_MISMATCH");
  if (positive(oneLine(body, /^- Workflow attempt:\s*([1-9][0-9]*)\s*$/, "INVALID_RECEIPT_ATTEMPT"), "INVALID_RECEIPT_ATTEMPT") !== 1) fail("RECEIPT_ATTEMPT_MISMATCH");
  if (oneLine(body, /^- Authorization body hash:\s*([0-9a-f]{64})\s*$/, "INVALID_RECEIPT_AUTH_HASH") !== authHash) fail("RECEIPT_AUTH_HASH_MISMATCH");
  const canonicalVersion = uuid(oneLine(body, /^- Canonical Cloudflare candidate version:\s*([0-9a-f-]{36})\s*$/, "INVALID_RECEIPT_CANDIDATE_VERSION"));
  const workerVersion = uuid(oneLine(body, /^- Worker version:\s*([0-9a-f-]{36})\s*$/, "INVALID_RECEIPT_WORKER_VERSION"));
  const deployment = uuid(oneLine(body, /^- Deployment ID:\s*([0-9a-f-]{36})\s*$/, "INVALID_RECEIPT_DEPLOYMENT"));
  if (canonicalVersion !== candidateVersion || workerVersion !== candidateVersion) fail("RECEIPT_VERSION_MISMATCH");
  if (deployment !== activeDeploymentId) fail("RECEIPT_DEPLOYMENT_MISMATCH");
  if (exactCount(body, "- Traffic: 100%") !== 1) fail("INVALID_RECEIPT_TRAFFIC");

  return { priorIssueNumber: issueNumber, priorRunId, priorDeploymentId: deployment, priorAuthorizationHash: authHash };
}

if (process.argv[1]?.endsWith("web-production-serving-rebind.ts")) {
  let inputText = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) inputText += String(chunk);
  process.stdout.write(`${JSON.stringify(validateServingRebindProof(JSON.parse(inputText) as ServingRebindInput))}\n`);
}

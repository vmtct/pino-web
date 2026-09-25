import { readFileSync, writeFileSync } from "node:fs";

export const CANONICAL_PATTERNS = ["pinohouse.art/*", "www.pinohouse.art/*"];
export const LEGACY_PATTERNS = [
  "pinohouse.art/artchitect*",
  "www.pinohouse.art/artchitect*",
  "pinohouse.art/little-piner*",
  "www.pinohouse.art/little-piner*",
  "pinohouse.art/_next/static/*",
  "www.pinohouse.art/_next/static/*",
];

type WorkerRoute = { id: string; pattern: string; script?: string | null };
type TransitionPlan = { createPatterns: string[]; deleteRoutes: Array<{ id: string; pattern: string }> };
type RouteReceipt = { schemaVersion: 1; zoneId: string; script: string; created: Array<{ id: string; pattern: string }>; deleted: Array<{ id: string; pattern: string }>; complete: boolean };

export function planRouteTransition(routes: WorkerRoute[], script: string): TransitionPlan {
  const createPatterns = [];
  const deleteRoutes = [];
  for (const pattern of CANONICAL_PATTERNS) {
    const matches = routes.filter((route) => route.pattern === pattern);
    if (matches.length > 1) throw new Error(`duplicate route ${pattern}`);
    if (matches.length === 1 && matches[0].script !== script) throw new Error(`route ${pattern} is owned by ${matches[0].script || "another authority"}`);
    if (matches.length === 0) createPatterns.push(pattern);
  }
  for (const pattern of LEGACY_PATTERNS) {
    const matches = routes.filter((route) => route.pattern === pattern && route.script === script);
    if (matches.length > 1) throw new Error(`duplicate legacy route ${pattern}`);
    if (matches.length === 1) deleteRoutes.push({ id: matches[0].id, pattern });
  }
  return { createPatterns, deleteRoutes };
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function api(path: string, init: RequestInit = {}): Promise<any> {
  const token = required("CLOUDFLARE_API_TOKEN");
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success === false) throw new Error(`Cloudflare API ${init.method || "GET"} ${path} failed (${response.status})`);
  return body;
}

function save(path: string, receipt: unknown): void {
  writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`);
}

async function listRoutes(zoneId: string): Promise<WorkerRoute[]> {
  const body = await api(`/zones/${zoneId}/workers/routes`);
  return body.result || [];
}

async function apply(receiptPath: string): Promise<void> {
  const zoneId = required("ZONE_ID");
  const script = required("WEB_WORKER");
  const before = await listRoutes(zoneId);
  const plan = planRouteTransition(before, script);
  const receipt: RouteReceipt = { schemaVersion: 1, zoneId, script, created: [], deleted: [], complete: false };
  save(receiptPath, receipt);

  for (const pattern of plan.createPatterns) {
    const body = await api(`/zones/${zoneId}/workers/routes`, { method: "POST", body: JSON.stringify({ pattern, script }) });
    const id = body?.result?.id;
    if (!id) throw new Error(`Cloudflare did not return an id for created route ${pattern}`);
    receipt.created.push({ id, pattern });
    save(receiptPath, receipt);
  }
  for (const route of plan.deleteRoutes) {
    await api(`/zones/${zoneId}/workers/routes/${route.id}`, { method: "DELETE" });
    receipt.deleted.push(route);
    save(receiptPath, receipt);
  }
  receipt.complete = true;
  save(receiptPath, receipt);
  await verifyCanonical(zoneId, script);
  process.stdout.write(`${JSON.stringify(receipt)}\n`);
}

async function rollback(receiptPath: string): Promise<void> {
  const receipt = JSON.parse(readFileSync(receiptPath, "utf8")) as RouteReceipt;
  const zoneId = receipt.zoneId;
  const script = receipt.script;
  let routes = await listRoutes(zoneId);
  for (const created of [...receipt.created].reverse()) {
    const live = routes.find((route) => route.id === created.id);
    if (!live) continue;
    if (live.script !== script || live.pattern !== created.pattern) throw new Error(`refusing to delete drifted created route ${created.id}`);
    await api(`/zones/${zoneId}/workers/routes/${created.id}`, { method: "DELETE" });
    routes = routes.filter((route) => route.id !== created.id);
  }
  for (const deleted of receipt.deleted) {
    const matches = routes.filter((route) => route.pattern === deleted.pattern);
    if (matches.length === 1 && matches[0].script === script) continue;
    if (matches.length) throw new Error(`refusing to overwrite externally restored route ${deleted.pattern}`);
    const body = await api(`/zones/${zoneId}/workers/routes`, { method: "POST", body: JSON.stringify({ pattern: deleted.pattern, script }) });
    const id = body?.result?.id;
    if (!id) throw new Error(`Cloudflare did not return an id while restoring ${deleted.pattern}`);
    routes.push({ id, pattern: deleted.pattern, script });
  }
}

async function verifyCanonical(zoneId: string = required("ZONE_ID"), script: string = required("WEB_WORKER")): Promise<void> {
  const routes = await listRoutes(zoneId);
  for (const pattern of CANONICAL_PATTERNS) {
    const matches = routes.filter((route) => route.pattern === pattern && route.script === script);
    if (matches.length !== 1) throw new Error(`canonical route ${pattern} is not attached exactly once to ${script}`);
  }
  for (const pattern of LEGACY_PATTERNS) {
    if (routes.some((route) => route.pattern === pattern && route.script === script)) throw new Error(`legacy route ${pattern} remains attached to ${script}`);
  }
}

if (process.argv[1]?.endsWith("web-production-route-transition.ts")) {
  const [mode, receiptPath] = process.argv.slice(2);
  try {
    if (mode === "apply") {
      if (!receiptPath) throw new Error("receipt path is required");
      await apply(receiptPath);
    } else if (mode === "rollback") {
      if (!receiptPath) throw new Error("receipt path is required");
      await rollback(receiptPath);
    } else if (mode === "verify") {
      await verifyCanonical();
    } else {
      throw new Error("mode must be apply, rollback, or verify");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

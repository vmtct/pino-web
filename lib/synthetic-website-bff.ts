// PAP-2159 / PAP-1680 · PLT-WEB-CMS. Core contract PAP-2424.
// Unmounted synthetic-only BFF candidate. No public dispatch or form activation.
import { mapAfterschoolInterest, mapMyTimeInterest, type WebsiteInterestPolicy } from "./website-interest-payload.ts";

export interface SyntheticWebsiteBff {
  environment: string;
  enabled: boolean;
  expectedOrigin: string;
  authorizeSynthetic(request: Request): Promise<boolean>;
  serviceCapability: string | undefined;
  policy: WebsiteInterestPolicy;
  core: { executePrivate(request: Request, capability: string): Promise<Response> } | undefined;
}
const noStore = {"cache-control":"no-store","x-content-type-options":"nosniff"};
const deny = (status: number) => Response.json({error:{code:"WEBSITE_INTAKE_REJECTED"}},{status,headers:noStore});
const maxBytes = 8192;
async function boundedBody(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Invalid body");
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new Error("Invalid body"); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { bytes.set(part,offset); offset += part.byteLength; }
  const value: unknown = JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid body");
  return value as Record<string, unknown>;
}
function exactFields(body: Record<string,unknown>, expected: string[]): boolean {
  const keys = Object.keys(body);
  return keys.length === expected.length && expected.every(key => Object.hasOwn(body,key));
}
export async function executeSyntheticWebsiteBff(request: Request, config: SyntheticWebsiteBff): Promise<Response> {
  if (config.environment !== "staging" || config.enabled !== true || !config.core ||
      !config.serviceCapability || config.serviceCapability.length < 32 || config.serviceCapability.length > 256) return deny(503);
  const url = new URL(request.url);
  if (url.origin !== config.expectedOrigin || url.pathname !== "/api/qa/website-registration-interest" || url.search) return deny(404);
  if (request.method !== "POST") return deny(405);
  if (request.headers.get("origin") !== config.expectedOrigin) return deny(403);
  try { if (await config.authorizeSynthetic(request) !== true) return deny(401); }
  catch { return deny(503); }
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get("content-type") ?? "")) return deny(415);
  const key = request.headers.get("idempotency-key");
  if (!key || !/^[A-Za-z0-9_-]{16,200}$/.test(key)) return deny(400);
  let payload;
  try {
    const body = await boundedBody(request);
    if (body.consentVersion !== config.policy.consentVersion) return deny(400);
    const common = {name:body.name,phone:body.phone,accepted:body.accepted};
    if (body.surface === "AFTERSCHOOL" && exactFields(body,["surface","name","phone","accepted","consentVersion","branch","plan"])) {
      payload = mapAfterschoolInterest({...common,branch:body.branch,plan:body.plan},config.policy);
    } else if (body.surface === "MYTIME" && exactFields(body,["surface","name","phone","accepted","consentVersion","program","interest"])) {
      payload = mapMyTimeInterest({...common,program:body.program,interest:body.interest},config.policy);
    } else return deny(400);
  } catch { return deny(400); }
  try {
    const upstream = await config.core.executePrivate(new Request("https://core.internal/private/website/registration-interest",{
      method:"POST",headers:{"content-type":"application/json","idempotency-key":key},body:JSON.stringify(payload),
    }),config.serviceCapability);
    if (upstream.status !== 201) return deny([400,401,403,409,429].includes(upstream.status) ? upstream.status : 503);
    const receipt: unknown = await upstream.json();
    if (!receipt || typeof receipt !== "object" || !("data" in receipt)) return deny(503);
    const data = receipt.data;
    if (!data || typeof data !== "object" || !("status" in data) || !("nextStep" in data) ||
        data.status !== "SUBMITTED" || data.nextStep !== "MANUAL_CONTACT") return deny(503);
    return Response.json({data:{status:"SUBMITTED",nextStep:"MANUAL_CONTACT"}},{status:201,headers:noStore});
  } catch { return deny(503); }
}

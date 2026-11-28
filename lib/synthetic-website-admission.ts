// PAP-2424 · PLT-LEAD / shared-acquisition-lead: unmounted Web-side admission.
// Do not wire to the public worker or forms. The operator verifier must be
// supplied by the independently admitted Staging authorization boundary.
import { executeSyntheticWebsiteBff, type SyntheticWebsiteBff } from "./synthetic-website-bff.ts";
import type { WebsiteInterestPolicy } from "./website-interest-payload.ts";

export const websiteQaStagingOrigin = "https://pino-web-staging.minhtri-van42.workers.dev";
const qaPath = "/api/qa/website-registration-interest";
const disabled = () => Response.json({error:{code:"WEBSITE_INTAKE_REJECTED"}},{
  status:404,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"},
});

export interface WebsiteQaAdmissionConfig {
  ENVIRONMENT?: unknown;
  WEBSITE_SYNTHETIC_ENABLED?: unknown;
  WEBSITE_SYNTHETIC_CAPABILITY?: unknown;
  WEBSITE_SYNTHETIC_WEB_POLICY_JSON?: unknown;
  PINO_WEBSITE_SYNTHETIC_CORE?: SyntheticWebsiteBff["core"];
}

function boundedText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max &&
    value === value.trim() && !/[\x00-\x1f\x7f]/.test(value);
}
function exactRecord(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value,key));
}

export function parseWebsiteQaMapperPolicy(raw: unknown): WebsiteInterestPolicy | undefined {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 8192) return;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return; }
  if (!exactRecord(value,["consentVersion","favoriteRefs"]) || !boundedText(value.consentVersion,80) ||
      !exactRecord(value.favoriteRefs,["acrylic","piano"])) return;
  const refs = (candidate: unknown): ReadonlySet<string> | undefined => {
    if (!Array.isArray(candidate) || candidate.length > 20 ||
        !candidate.every(item => boundedText(item,160))) return;
    const set = new Set<string>(candidate);
    return set.size === candidate.length ? set : undefined;
  };
  const acrylic = refs(value.favoriteRefs.acrylic), piano = refs(value.favoriteRefs.piano);
  if (!acrylic || !piano) return;
  return {consentVersion:value.consentVersion,favoriteRefs:{acrylic,piano}};
}

export function createWebsiteQaAdmission(
  env: WebsiteQaAdmissionConfig,
  verifyOperator?: SyntheticWebsiteBff["authorizeSynthetic"],
): (request: Request) => Promise<Response> {
  // Evaluate both deployment and exact origin; no host inferred from request headers.
  const policy = env.ENVIRONMENT === "staging" && env.WEBSITE_SYNTHETIC_ENABLED === "true"
    ? parseWebsiteQaMapperPolicy(env.WEBSITE_SYNTHETIC_WEB_POLICY_JSON) : undefined;
  const capability = env.WEBSITE_SYNTHETIC_CAPABILITY;
  const core = env.PINO_WEBSITE_SYNTHETIC_CORE;
  const admitted = policy && typeof verifyOperator === "function" && typeof core?.executePrivate === "function" &&
    boundedText(capability,256) && capability.length >= 32;
  return async request => {
    const url = new URL(request.url);
    if (!admitted || !policy || !verifyOperator || !core || typeof capability !== "string" ||
        url.origin !== websiteQaStagingOrigin || url.pathname !== qaPath || url.search || url.hash) return disabled();
    return executeSyntheticWebsiteBff(request,{
      environment:"staging",enabled:true,expectedOrigin:websiteQaStagingOrigin,
      authorizeSynthetic:verifyOperator,serviceCapability:capability,policy,core,
    });
  };
}

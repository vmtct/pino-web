// PAP-2159 / PAP-1680 · PLT-WEB-CMS; Core contract PAP-2424.
// Pure candidate only. No transport, persistence, or form activation.
type Path = "little-piner" | "artchitect" | "pianohouse" | "advice";
type Activity = "acrylic" | "piano" | "advice";
type Interest =
  | { program: "AFTERSCHOOL"; path: Path; planSessions: 24 | 36 | null }
  | { program: "MYTIME"; activity: Activity; favoriteRef: string | null };
export interface WebsiteInterestPayload {
  phone: string;
  contactName: string;
  interest: Interest;
  consent: { accepted: true; version: string };
}
export interface WebsiteInterestPolicy {
  consentVersion: string;
  favoriteRefs: Readonly<Record<"acrylic" | "piano", ReadonlySet<string>>>;
}
function invalid(): never { throw new Error("Invalid registration interest"); }
function text(value: unknown, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max || /[\x00-\x1f\x7f]/.test(value)) invalid();
  return value.trim();
}
function common(name: unknown, phone: unknown, accepted: unknown, policy: WebsiteInterestPolicy) {
  if (accepted !== true) invalid();
  const normalized = text(phone, 20).replace(/[ ().-]/g, "");
  if (!/^(?:0|\+84)[35789]\d{8}$/.test(normalized)) invalid();
  return { phone: normalized, contactName: text(name, 100), consent: { accepted: true as const, version: text(policy.consentVersion, 80) } };
}
export function mapAfterschoolInterest(
  input: { name: unknown; phone: unknown; branch: unknown; plan: unknown; accepted: unknown },
  policy: WebsiteInterestPolicy,
): WebsiteInterestPayload {
  const path = input.branch;
  if (path !== "little-piner" && path !== "artchitect" && path !== "pianohouse" && path !== "advice") invalid();
  const plan = input.plan;
  if (plan !== "" && plan !== null && plan !== "24" && plan !== "36") invalid();
  return { ...common(input.name, input.phone, input.accepted, policy),
    interest: { program: "AFTERSCHOOL", path, planSessions: plan === "24" ? 24 : plan === "36" ? 36 : null } };
}
export function mapMyTimeInterest(
  input: { name: unknown; phone: unknown; program: unknown; interest: unknown; accepted: unknown },
  policy: WebsiteInterestPolicy,
): WebsiteInterestPayload {
  const activity = input.program;
  if (activity !== "acrylic" && activity !== "piano" && activity !== "advice") invalid();
  const favoriteRef = input.interest === "" || input.interest === null ? null : text(input.interest, 160);
  if (favoriteRef !== null && (activity === "advice" || !policy.favoriteRefs[activity].has(favoriteRef))) invalid();
  return { ...common(input.name, input.phone, input.accepted, policy), interest: { program: "MYTIME", activity, favoriteRef } };
}

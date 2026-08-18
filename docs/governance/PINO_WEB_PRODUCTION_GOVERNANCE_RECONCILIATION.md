# PINO Web Production Governance Reconciliation

**Repository:** `vmtct/pino-web`  
**Reconciliation base:** `main` at `f0c844357ab43831b0aef228aba293c692104511`  
**Document type:** repository-local governance/reconciliation evidence  
**Runtime impact:** none  

## 1. Purpose and authority

This document materializes the accepted canonical PINO governance inside `pino-web` before further production feature work.

Current `pino-web/main` is treated as **legacy production evidence**, not as automatic approval of future architecture. This document does not redesign Core contracts. Shared business truth remains governed by `pino-core`; `pino-web` owns public/member presentation and intentionally thin adapters only.

Canonical Core contracts consumed by this reconciliation:

- `public-open-studio-acquisition` — `pino-core/docs/features/approved/public-open-studio-acquisition.md`
- `member-authentication` — `pino-core/docs/features/approved/member-authentication.md`
- `membership-continuity` — `pino-core/docs/features/approved/membership-continuity.md`
- `member-session-access` — `pino-core/docs/features/approved/member-session-access.md`

Implementation readiness must always be re-read from the canonical Core registry/handoff at implementation time. This web document does not promote a Core feature to implementation-ready status.

The target delivery lifecycle for `pino-web` is:

```text
LOCAL
  -> PRE-MAIN AUDIT
  -> MAIN
  -> PRE-PROD AUDIT
  -> explicit PROD RELEASE
  -> POST-RELEASE VERIFY
```

`main` is a deployable source of truth. It is not itself a production authorization event.

---

## 2. Current-state evidence summary

The following current-main behavior is accepted only as evidence of what production has historically run:

- `.github/workflows/ci.yml` runs on PRs and pushes to `main`; a `main` push waits for `Workers Builds: pino-web`, verifies the deployed Worker SHA, then runs production smoke and Playwright E2E.
- `main` currently has no branch protection/required status checks.
- `POST /api/member` accepts a phone and resolves private member/family data directly from Notion.
- `app/open-studio/member/page.tsx` stores the submitted phone in `sessionStorage` as `pino_member_phone` and treats a successful phone lookup as Member Space login.
- legacy member routes advertise wildcard CORS.
- `worker-member-v2.ts` owns membership/pass/session eligibility, booking-window, capacity, duplicate-booking, pass-consumption and Notion booking behavior.
- `worker-entry.ts` exposes both Core Open Studio adapters and legacy Notion-backed Open Studio routes.
- the legacy `/api/open-studio/book` path may create a Notion OS Booking from phone + Session and may return a matched internal Parent ID to the public caller.
- `lib/pino-core-public-adapter.ts` is already directionally correct as a same-origin thin Core adapter and independently gates Core registration.
- `.github/workflows/patch-os-booking-diagnostic.yml` has `contents: write`, patches `worker-member-v2.ts`, commits, and performs `git push` from the workflow branch.
- `agent/dev_agent.py` contains useful recovery-branch safety guards, but its pipeline assumptions still describe main-push production deployment; `agent/README.md` also refers to an `autonomous-recovery.yml` workflow that is not present on current main.

These observations are not future architectural authority.

---

## 3. Current-runtime disposition matrix

Classification meanings:

- `TEMPORARY_LEGACY` — current behavior may exist as transition evidence but is not future authority and must be contained/removed on cutover.
- `APP_PRESENTATION` — valid app-local UI/content/presentation responsibility.
- `CORE_ADAPTER` — intentionally thin trust-zone adapter to canonical Core.
- `REIMPLEMENT` — user-facing capability remains useful, but the current implementation must be rebuilt against Core authority.
- `RETIRE` — current implementation/business behavior should not be carried forward.

| Current area / implementation | Disposition | Governed direction |
|---|---|---|
| Homepage/public React layout and visual components | `APP_PRESENTATION` | Keep app-local; consume Core/CMS data without owning shared rules. |
| Open Studio public card/detail/form presentation | `APP_PRESENTATION` | Keep/rework presentation against canonical public Session/acquisition contracts. |
| Generic website copy/images via web CMS adapters | `APP_PRESENTATION` | Keep as editorial CMS concern; do not turn editorial CMS into business authority. |
| `lib/pino-core-public-adapter.ts` public Sessions/Registration proxy pattern | `CORE_ADAPTER` | Keep thin, same-origin and release-gated; extend only from approved Core contracts. |
| `/api/pino-core/open-studio/*` route shell | `CORE_ADAPTER` | Keep as the public trust-zone transport boundary. |
| `/api/os-sessions` + Notion Session projection | `TEMPORARY_LEGACY` | Retire after all consumers use canonical Core Session projection. |
| `lib/open-studio-public.ts:createPublicBooking` | `RETIRE` | Replace with canonical `public-open-studio-acquisition`; do not port Notion Booking/Parent-matching logic. |
| legacy `/api/open-studio/book` public Notion write | `RETIRE` | Fail closed during P0 containment, then remove after canonical public acquisition cutover. |
| `POST /api/member` phone-only private profile lookup | `TEMPORARY_LEGACY` | Fail closed immediately in production; later replace with member-authenticated Core adapter. |
| `sessionStorage` phone used as Member Space login state | `TEMPORARY_LEGACY` | Remove as authentication state. Presentation may keep non-sensitive navigation state only. |
| `lib/member.ts` Notion Parent/Student/subscription/pass/booking aggregation | `REIMPLEMENT` | Replace with authenticated Core member-context/read projections; no direct private Notion authority. |
| Member Space React surfaces | `APP_PRESENTATION` | Keep UX surface, but rewire login/data/actions to canonical Core member session and authorized Student context. |
| `lib/member-booking-validation.ts` web-owned booking/access checks | `RETIRE` | Canonical access/eligibility/capacity belongs to Core `member-session-access`. |
| `worker-member-v2.ts` pass creation/consumption, booking, eligibility, window, capacity and compensation logic | `RETIRE` | Do not translate this logic into a new web-local implementation. |
| web-side subscription active-state reconstruction from Notion | `REIMPLEMENT` | Consume canonical Membership continuity/provenance from Core. |
| web-side monthly OS Pass generation and path/pass eligibility | `RETIRE` | Replace with canonical Membership/Access/Session contracts. |
| `worker-entry.ts` as an application route shell | `APP_PRESENTATION` | Keep only as transport/composition shell while removing legacy business-rule branches. |

---

## 4. Core cutover dependency map

| Business capability currently touched by pino-web | Current web ownership | Canonical Core contract | Web target | Dependency / cutover rule |
|---|---|---|---|---|
| Identity / member authentication | Phone lookup acts as login and private-data gate | `member-authentication` | `CORE_ADAPTER` + `APP_PRESENTATION` | OTP -> PINO-owned member session -> canonical Parent -> authorized Student. Do not invent web-local authentication/session authority. |
| Membership / subscription continuity | Notion date/relation logic reconstructs active subscription | `membership-continuity` | `CORE_ADAPTER` + presentation | Web consumes canonical lifecycle/provenance; it must not infer continuity from one active/inactive flag. |
| Open Studio pass / entitlement | `worker-member-v2.ts` creates monthly passes and hard-codes pass/path rules | `membership-continuity` + owning access feature | `RETIRE` | Do not carry pass-generation logic forward. Exact learner Session access is resolved by the owning Core access contract. |
| Authenticated booking / access / capacity | Web validates 7-day window, pass, path, duplicate, capacity and creates direct-confirm Notion Booking | `member-session-access` | `CORE_ADAPTER` + presentation | Future current-Student flow is canonical Booking lifecycle; web availability is advisory and Core remains database-authoritative. |
| Public Open Studio acquisition | Legacy phone + Session creates Notion OS Booking; newer Core proxy also exists | `public-open-studio-acquisition` | `CORE_ADAPTER` + presentation | Commercial lead lane may remain phone-only, but creates canonical Public Registration/seat hold, not private Member access or Student Booking. Existing PINO Space route returns only coarse `PINER_AUTH` and then uses OTP. |
| CMS / editorial content | Notion web content/images + React composition | app-local editorial CMS | `APP_PRESENTATION` | Keep content presentation app-local. Syllabus/Session/capacity/member state stays Core-owned. |

### Required trust-lane split

```text
COMMERCIAL / NEW LEAD
Public Session -> phone -> Core coarse route
  PUBLIC_LEAD -> canonical Public Registration / seat hold / lead verification

EXISTING PINO SPACE
Public Session -> phone -> Core coarse route
  PINER_AUTH -> PINO Space/Piner -> OTP -> member session -> authorized Student -> member Session access
```

Phone-only public lead acquisition is explicitly allowed by the approved Core contract. Phone-only **private Member Space access is not**.

---

## 5. P0 / P1 register

### P0-1 — Release boundary: `main` is coupled to production deployment

**Evidence:** current CI on a `main` push waits for the Cloudflare `Workers Builds: pino-web` check, verifies the deployed Worker SHA, then runs production smoke/E2E. Current `main` is unprotected.

**Risk:** merge-to-main currently functions as an implicit production promotion path and collapses MAIN, PRE-PROD AUDIT, release authorization and post-release verification.

**Required containment:** before the next material runtime merge, disable Cloudflare automatic production promotion from `main`. Then implement an explicit release workflow for an exact SHA already present on `main`.

**Founder approval required?** No. This enforces the already-accepted canonical lifecycle and does not change product semantics.

### P0-2 — Phone-only Member Space exposes private family/member state

**Evidence:** `POST /api/member` uses only phone to resolve a Parent and returns Parent/Student/subscription/pass/booking context; client code stores the phone in `sessionStorage` and proceeds as Member login. Wildcard CORS is advertised by legacy member routes.

**Risk:** phone is functioning as a credential for private data even though canonical `member-authentication` defines phone as an identifier only.

**Required containment:** fail closed production private Member Space read/write routes before parsing/using private input or querying Notion. Do not build a temporary OTP/session architecture inside `pino-web`.

At minimum contain:

- `POST /api/member`
- `POST /api/member/book`
- `POST /api/member/book/validate`
- the member branch of legacy `/api/open-studio/book`

Private member endpoints should no longer advertise wildcard CORS; same-origin/no-CORS is the intended web boundary.

**Founder approval required?** No. This is a security containment required by the already-approved `member-authentication` contract. Keeping phone-only private access live would require an explicit security-risk exception, not an ordinary product decision.

### P0-3 — Legacy public `/api/open-studio/book` bypasses the canonical acquisition boundary

**Evidence:** current legacy public booking reads/writes Notion directly, matches Parent records by phone, creates OS Booking records, owns booking-window/duplicate behavior and may return an internal `parentId` to the public caller.

**Risk:** public acquisition business truth remains in web/Notion, can leak account-resolution detail, and is independent from the canonical Core public-registration gate.

**Required containment:** fail closed the legacy Notion write path in production and move the low-friction phone-only UX to the canonical `public-open-studio-acquisition` adapter when Core runtime readiness permits.

**Important:** the P0 is the legacy implementation/trust leakage, **not** the phone-only public lead UX. The approved acquisition contract intentionally permits phone-only `PUBLIC_LEAD` submission while forbidding private member exposure.

### P0-4 — Self-patching diagnostic workflow can bypass normal review

**Evidence:** `.github/workflows/patch-os-booking-diagnostic.yml` has write permission, edits `worker-member-v2.ts`, commits and runs `git push` from a marker-triggered workflow.

**Risk:** repository source can be mutated by a diagnostic mechanism outside the governed PRE-MAIN audit path; under the current release boundary this can compound production risk.

**Required containment:** disable/remove the workflow in the first runtime governance slice. Preserve useful findings as evidence/tests, not as an auto-patcher.

### P1-1 — PR validation gate is incomplete

Current PR CI runs frozen install + build but does not explicitly run the available `typecheck` and `test` scripts.

**Target:** required pre-main checks include typecheck, tests, build, safe E2E where applicable, plus governance evidence.

### P1-2 — `main` lacks branch protection/required checks

**Target:** PR required, governed checks required, no force push/direct bot mutation to `main`.

### P1-3 — Core adapter release configuration remains transitional

`lib/pino-core-public-adapter.ts` defaults to a dev Core upstream and uses an independent registration gate. This is useful containment evidence, not final release configuration.

**Target:** production Core upstream and write capability are changed only through PRE-PROD audit + explicit production release after the relevant Core feature/runtime is ready.

### P1-4 — Autonomous recovery tooling is stale/dormant

The agent code contains useful branch safety guards, but its docs/prompt still assume main-push production behavior; README references an absent workflow and README/agent behavior also drift on draft-vs-non-draft PR creation.

**Target:** keep dormant until the governed release lifecycle exists, then rework it to consume PRE-MAIN evidence and open reviewable recovery PRs only.

---

## 6. Release-boundary migration plan

### Phase R0 — Governance evidence

This reconciliation PR is docs-only. No deployment or runtime mutation occurs.

### Phase R1 — Operational release stop

Before the first runtime governance PR merges:

1. disable Cloudflare automatic production deployment from `main`;
2. verify a push/merge to `main` no longer changes production;
3. preserve the current production SHA as rollback evidence.

### Phase R2 — PRE-MAIN gate

Replace build-only PR validation with required checks:

```text
frozen install
-> typecheck
-> unit/behavior tests
-> production build / Worker dry-run as applicable
-> safe local/preview E2E where applicable
-> governance evidence check
-> independent PRE-MAIN audit for material behavior
```

Governance evidence for material behavior must include:

- canonical Core `featureId`;
- spec path/status;
- handoff/readiness when runtime integration is requested;
- web disposition (`APP_PRESENTATION`, `CORE_ADAPTER`, etc.);
- confirmation that no new shared business truth is being implemented locally.

Production smoke/E2E must not be the first integration gate.

### Phase R3 — MAIN

`main` receives only reviewed, pre-main-green commits. `main` does not deploy.

Add branch protection/ruleset:

- PR required;
- required validation checks;
- no force push;
- no direct diagnostic/self-patch commits;
- emergency procedure, if ever required, must be an explicit separately governed process.

### Phase R4 — PRE-PROD audit

Select an exact commit already on `main` and record:

- exact SHA;
- config/binding diff;
- Core dependency/readiness state;
- safety switches/write enablement;
- rollback SHA;
- independent pre-prod audit result.

### Phase R5 — explicit PROD release

Use an explicit manual release mechanism (for example `workflow_dispatch`) that deploys the exact approved `main` SHA. Approval must not silently retarget to a newer moving `main` head.

### Phase R6 — post-release verification

After deploy only:

- verify `/build-info.json` exact SHA;
- public health/smoke;
- read-only Core-adapter smoke;
- controlled write smoke only when that production mutation is explicitly approved;
- production Playwright verification;
- structured failure intake.

Post-release smoke verifies a release; it does not authorize the merge that preceded it.

---

## 7. Member Space containment and cutover plan

### Current legacy behavior

Current Member Space effectively performs:

```text
phone
-> Notion Parent lookup
-> private Parent/Student/member state
-> store phone in sessionStorage
-> client submits phone + Student/pass/Session IDs
-> web-owned ownership/access/capacity logic
```

Some current code checks that a supplied Student ID belongs to the Parent resolved from the supplied phone. This is a consistency check, not valid authentication/authorization, because the phone itself is not authenticated.

### P0 containment

Introduce a narrow production security gate, default closed, around all private legacy Member Space routes. While disabled:

- reject before private Notion queries or mutations;
- return no member/Student/subscription/pass/booking state;
- do not present phone-only lookup as authenticated Member login;
- do not replace it with a web-local OTP/session mechanism.

Public acquisition remains a separate lane and is not disabled merely because it accepts phone.

### Canonical cutover target — `member-authentication`

The web target is:

```text
phone
-> OTP through approved Core/provider boundary
-> canonical Parent resolution
-> PINO-owned member session
-> server-authorized Student set
-> active Student presentation context
```

Rules carried into web integration:

- phone is an identifier, never private authorization;
- OTP/provider identity is not canonical Parent identity;
- private member routes derive Parent principal from a validated PINO member session;
- caller-supplied phone, Student ID, Booking ID or subscription ID never proves ownership;
- relationship/entitlement state is checked server-side and is not frozen into client state;
- the exact session/cookie/token implementation is Core technical authority, not a web-local design decision.

### Commercial Open Studio routing interaction

Under `public-open-studio-acquisition`:

- new/pre-member lead may submit phone-only Public Registration;
- if Core returns coarse `PINER_AUTH`, web navigates to the canonical PINO Space/Piner OTP entry;
- pre-auth web never receives Parent/Student/member details from the routing decision.

### Later authenticated booking cutover

Do not map the current direct-confirm Notion booking behavior into a new Core call mechanically.

`member-session-access` owns the future authenticated Student Session-access and Booking lifecycle. Web waits for that canonical runtime/readiness and becomes presentation + adapter only.

---

## 8. PR CI hardening plan

### Required PRE-MAIN validation

For normal PRs:

1. `bun install --frozen-lockfile`
2. `bun run typecheck`
3. `bun run test`
4. `bun run build`
5. safe E2E where the changed surface can run against local/disposable preview state without production writes
6. governance evidence check for material/shared behavior
7. independent PRE-MAIN audit for security/trust/business-boundary changes

Existing scripts already expose `typecheck`, `test`, `build` and `e2e`; CI should use them explicitly rather than treating build as a substitute for the first two.

### Production verification belongs after release

Production smoke/Playwright remain valuable, but only after explicit release. They must not be used as the first validation of a merged runtime change.

### Safe E2E doctrine

- prefer local/preview/disposable fixtures;
- never mutate production merely to reproduce an integration failure;
- direct-server deny cases are required where security/ownership is involved;
- public write smoke must be controlled and explicitly approved.

---

## 9. Diagnostic/self-patch and recovery tooling disposition

### `.github/workflows/patch-os-booking-diagnostic.yml`

**Disposition: RETIRE.**

Reason:

- source-writing diagnostic automation is incompatible with PRE-MAIN review discipline;
- it patches a legacy file whose business semantics are being retired;
- its useful historical discoveries should become tests/evidence, not self-modifying production workflow behavior.

No replacement auto-patcher should be created.

### `agent/dev_agent.py` + `agent/README.md`

**Disposition: keep as dormant tooling evidence, then REWORK before re-enabling.**

Useful properties to preserve:

- isolated recovery branch;
- explicit block on push-to-main, force push, hard reset and PR merge;
- evidence-first failed-run inspection;
- bounded fix attempts;
- no production data mutation.

Required rework before enablement:

- remove assumption that `main` push implies production deployment;
- distinguish PRE-MAIN CI, PRE-PROD audit and post-release smoke;
- never treat production as the first reproduction/integration environment;
- require Core governance evidence for material behavior;
- reconcile README/agent drift and the currently absent `autonomous-recovery.yml` workflow;
- recovery success opens a reviewable PR only; it never authorizes merge or production release.

Recovery branches and diagnostic outputs are evidence, not feature authority.

---

## 10. Technical execution sequence

### Slice 0 — production governance/security containment

First implementation slice from then-current `pino-web/main`:

1. operationally disable automatic `main` -> production Cloudflare deployment;
2. create a fresh runtime branch;
3. default-close private legacy Member Space production routes;
4. default-close legacy Notion `/api/open-studio/book` writes;
5. remove wildcard CORS from private Member endpoints / enforce same-origin boundary;
6. replace phone-only Member login UX with a neutral unavailable/security-upgrade state until canonical auth is ready;
7. retire `patch-os-booking-diagnostic.yml`;
8. harden PR CI with typecheck + tests + build + safe E2E/governance evidence;
9. add branch protection and an explicit exact-SHA production release workflow;
10. PRE-MAIN audit;
11. merge to main without deploy;
12. PRE-PROD audit;
13. explicit release of the containment SHA;
14. post-release smoke/E2E.

No new product semantics are introduced by Slice 0.

### Slice 1 — canonical public acquisition Core runtime dependency

Consume `public-open-studio-acquisition` only when its Core readiness/handoff authorizes the requested implementation slice. Web must not recreate Lead/Registration/quota/capacity logic.

### Slice 2 — public Open Studio web cutover

After canonical Core public acquisition runtime is available:

- use Core intake routing (`PUBLIC_LEAD | PINER_AUTH`);
- use Core Public Registration for new leads;
- preserve low-friction phone-only commercial UX;
- surface quota warning + `Chat với PINO` as presentation;
- retire legacy Notion `/api/os-sessions` / `/api/open-studio/book` paths as their consumers reach zero.

Production write enablement occurs only via explicit release governance.

### Slice 3 — Core Member Authentication implementation/release

Outside `pino-web`, implement/release canonical `member-authentication` according to Core governance. Web does not invent substitute auth.

### Slice 4 — Member Space authentication adapter

Once canonical member auth is available:

- implement same-origin member-auth adapter/presentation;
- restore private member context only from validated member session;
- resolve authorized Students server-side;
- remove `sessionStorage` phone-as-login behavior and direct private Notion member reads.

### Slice 5 — Membership Continuity cutover

Once canonical Membership runtime is ready, remove web subscription reconstruction and consume canonical continuity/provenance projections.

### Slice 6 — Member Session Access cutover

Once canonical authenticated Session-access/Booking runtime is ready:

- move member Session access/Booking to Core;
- remove web pass generation/consumption, access checks, booking-window and capacity authority;
- retire `worker-member-v2.ts` and `lib/member-booking-validation.ts` when no live path depends on them.

### Slice 7 — cleanup

- remove obsolete Notion member/booking environment bindings and legacy routes only after verified zero use;
- rework or delete dormant recovery tooling based on governed need;
- keep editorial CMS separate from Core business truth;
- keep production release explicit.

---

## 11. Founder decision gates

### Immediate P0 Member Space containment

**Founder/product approval is not required.**

The canonical `member-authentication` contract is already approved and explicitly states that phone alone does not authenticate a Parent or authorize private member state. Immediate fail-closed containment enforces that accepted security boundary without inventing new product behavior.

A decision to intentionally keep phone-only private Member Space live would instead require an explicit security-risk exception.

### Public phone-only acquisition

No exception is needed for the commercial Lead lane. The approved `public-open-studio-acquisition` contract explicitly permits phone-only public lead registration while keeping private member authentication separate.

### Future runtime implementation

Return to Founder/product review only when Core governance identifies a genuinely unresolved product-policy choice. Do not use `pino-web` implementation convenience to manufacture a new business rule.

---

## 12. Definition of reconciliation complete

This repository reconciliation is complete when:

- this document is reviewed/accepted on `pino-web`;
- no runtime/deployment change was bundled into the reconciliation PR;
- the first runtime slice is limited to P0 containment + release-boundary hardening;
- subsequent feature work names the canonical Core `featureId` and readiness evidence;
- `main` no longer implies production deployment;
- production is reached only through PRE-PROD audit + explicit release + post-release verification.

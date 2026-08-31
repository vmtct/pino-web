# PINO Web — AI Working Contract

`pino-web` is a public/member-facing application surface. It does not own shared PINO business truth merely because a flow begins on the website.

## Read order for material behavior

Before changing a material business rule, public/member data contract, eligibility/booking behavior, or a capability shared with another PINO surface:

1. inspect the relevant pino-web source/tests and current transport contract;
2. resolve the canonical Core `featureId` in `pino-core/docs/features/feature-registry.json`;
3. read `pino-core/docs/feature-governance.md` and `pino-core/docs/platform-foundations.md`;
4. read the registered feature spec and relevant accepted ADRs;
5. if readiness is `READY_FOR_CODEX`, read the registered handoff before canonical runtime integration.

If the required Core governance/spec material is unavailable, stop before inventing shared business semantics and report the missing dependency.

## Continuation entry gate

For material continuation intent (`continue`, `triển`, `triển tiếp`, `ok triển`, `finish`, or equivalent), conversation history is non-authoritative. Before material edits run `npm run pino:resume -- --core <current-pino-core-worktree>` or set `PINO_CORE_PATH`. Supply `--feature <featureCode|featureId>` only when branch/checkpoint resolution cannot identify one canonical feature.

Obey the Core Drift Protocol result: `NONE` continues; `SAFE` continues without a forced sync; `CONTRACT` is reconciled by the coding agent in the same work session and the gate is rerun; `DESTRUCTIVE` or genuinely ambiguous state requires human review. Never ask the Founder to reconcile merely because `main` advanced, and never treat pino-web chat context as a substitute for Core registry/checkpoint authority.

### Cross-Project slice care

Material Web work must identify the coordinating ChatGPT Project with one canonical Project Code: `PRJ-TPP`, `PRJ-PSP`, `PRJ-PNR`, `PRJ-WFM`, or `PRJ-PLT`. Pass it through `--project` or `PINO_PROJECT_CODE`.

Before material edits, Core PLT-CARE must report the current owner transparently. Unclaimed work requires a claim. Fresh foreign care blocks duplicate material edits and must surface owner, branch, PR, and freshness. Stale care requires explicit reclaim. Fresh foreign transfer requires explicit Founder approval plus a reason.

Care ownership is coordination metadata only; it never authorizes staging or production.

## Feature readiness is implementation authority

- `READY_FOR_CODEX` — implementation may proceed against the registered approved spec/handoff.
- `READY_WITH_PREREQUISITES` — UI/product review may continue, but blocked runtime integration waits for named prerequisites.
- `PROPOSAL_ONLY` — prototype/product exploration only; do not turn mock/local rules into canonical runtime behavior.
- `RECONSTRUCTED_ONLY` — current-state evidence only; not Founder approval for future changes.

A working page, prototype, local constant, existing worker route, or merged UI branch is not canonical product authority by itself.

## Core ownership boundary

- Core-owned identity, membership, trial, access, booking, capacity, delivery, policy, and other shared invariants remain authoritative in pino-core.
- pino-web may adapt presentation and user experience but must not maintain a competing business-rule implementation for convenience.
- Use public/member Core contracts intentionally exposed for this trust zone. Never reach into Core D1 or private Founder transports.
- External/Notion identifiers, slugs, phone numbers, email addresses, record IDs, URL knowledge, or client state do not become canonical identity or authorization credentials.
- When a flow remains explicitly unmigrated, document that authority rather than silently mixing Notion and Core truth.

## Public/member trust boundary

Public and authenticated-member contracts are distinct from Founder/internal contracts.

- Expose only fields intentionally approved for the relevant trust zone.
- Authentication is not authorization or ownership proof.
- Server-side ownership/access validation is required for private member resources and mutations.
- Do not expose private Founder control-plane operations, privileged audit data, internal policy-management commands, or TOS authorization internals through public routes.
- Do not return raw vendor/D1 errors, tokens, secrets, stack traces, or unnecessary child/family data.
- Retriable public mutations that can duplicate business effects must follow the canonical idempotency/concurrency contract.

## Prototype discipline

A local landing page/member prototype may use mock data when clearly isolated from canonical runtime behavior.

Product discoveries follow:

```text
prototype finding
  -> canonical Core feature spec
  -> Founder approval when behavior changed
  -> technical readiness / READY_FOR_CODEX handoff
  -> canonical implementation
```

Do not let a convenient React state shape, route parameter, or mock object become a new domain entity or security model without the Core spec.

Presentation-only changes that genuinely alter no business semantics may remain app-local, but the implementation should state why no Core feature contract is affected.

## Change discipline

For a material cross-repository feature:

1. name the Core `featureId` in PR/implementation notes;
2. verify registry readiness before runtime work;
3. preserve F1–F7 decisions from the canonical spec;
4. keep public/member field exposure intentionally bounded;
5. use canonical Core IDs/contracts where the domain is Core-owned;
6. update app tests/E2E for public/member behavior and direct-server deny/failure cases where applicable;
7. surface spec/code drift rather than silently choosing one side;
8. require independent spec ↔ Core/web code ↔ tests review before staging/production readiness.

A green build, successful local preview, or merged PR does not itself authorize production deployment.

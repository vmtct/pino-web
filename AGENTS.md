# PINO Web — AI Working Contract

`pino-web` is a public/member-facing application surface. It does not own shared PINO business truth merely because a flow begins on the website.

## Read order for material behavior

Before changing a material business rule, public/member data contract, eligibility/booking behavior, or a capability shared with another PINO surface:

1. inspect the relevant pino-web source/tests and current transport contract;
2. resolve the canonical Core `featureId` in `pino-core/docs/features/feature-registry.json`;
3. read `pino-core/docs/feature-governance.md` and `pino-core/docs/platform-foundations.md`;
4. read the registered feature spec and relevant accepted ADRs;
5. if readiness is `READY_FOR_IMPLEMENTATION`, read the registered handoff before canonical runtime integration.

If the required Core governance/spec material is unavailable, stop before inventing shared business semantics and report the missing dependency.

## Continuation facts and retired PLT-CARE

The live Jira Job and applicable Directives (PAP-184, PAP-512 and PAP-596) govern DEV/review authority. Conversation history is non-authoritative delivery memory. Inspect exact worktree, branch, head, current main, merge-base, dirty state, changed paths, exact-head CI and real conflicting writers before material side effects.

The optional pino:resume and delivery:enter scripts are read-only compatibility fact inspectors, never mandatory continuation gates. Legacy allowedMode, implementationAuthority, needsReconcile, Project-Code, PLT-CARE materialEditGuard and stale checkpoint/lease fields cannot grant or block Jira-authorized DEV/review.

Do not claim, heartbeat, reclaim, transfer, release or require historical PLT-CARE leases. Historical records are for forensic inspection only. Protect actual shared side effects with narrowly scoped single-writer/idempotency safety; retain Git freshness, auth, security and release gates. Merge, Staging, D1 and Production require their own applicable Jira authority.

## Feature maturity is product evidence, not execution authority

- `READY_FOR_IMPLEMENTATION` — implementation may proceed against the registered approved spec/handoff.
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
  -> technical readiness / READY_FOR_IMPLEMENTATION handoff
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
8. hand off at `DEV_HANDOFF_READY`; Core `PLT-MERGE` owns current-main reconcile, exact candidate CI, authoritative independent PRE-MAIN review, freshness, and `MERGE_READY`.

## Codex hard limit

Codex is permitted only as the fresh independent PRE-MAIN reviewer launched by the canonical Core audit runner. GPT owns implementation, bug/audit-finding fixes, reconcile/restack/rebase, conflict resolution, evidence repair, merge orchestration, and release preparation. Do not invoke Codex for any of those non-audit activities.

A green build, successful local preview, or merged PR does not itself authorize production deployment.

# PINO Web — AI Working Contract

`pino-web` is the public application surface. Before changing behavior, determine whether the change is web-owned presentation/composition or a Core-owned domain rule.

## Read order

1. `docs/architecture.md`
2. relevant source/tests in this repository
3. `pino-core/docs/system-context.md`, `pino-core/docs/principles.md`, and relevant accepted Core ADRs when the change touches a Core-owned capability
4. `agent/README.md` only for autonomous CI recovery behavior

## Invariants

- Keep public UX and presentation concerns in `pino-web`.
- Do not redefine canonical Core identities, access rules, booking rules, capacity rules, attendance rules, or other Core-owned domain invariants in the web layer.
- Use established Core adapters/contracts for Core-owned capabilities.
- Notion-backed CMS/configuration is allowed for explicitly designated web content concerns; do not generalize that into global operational authority.
- Treat web-local caches, projections, slugs, URLs, phone/email lookup keys, and vendor IDs as non-canonical unless an architecture decision explicitly says otherwise.
- Preserve safety gates around Core registration and environment configuration; do not silently route production writes to a development Core environment.
- Public endpoints are a trust boundary. Do not surface private Founder/internal Core capabilities through the public Worker.
- If a cross-repository contract changes, update the relevant architecture documentation in both repositories in the same delivery window.

## Autonomous recovery agent

The workflow under `agent/` is a repo-local CI recovery execution plane. It is not the canonical architecture authority and must follow this contract plus Core architecture when repairing integration code.

# pino-web Architecture

## Responsibility

`pino-web` is PINO's public web/application surface. It owns public UI, page composition, customer funnel behavior, web delivery, and transport adaptation.

It must not become a second canonical domain layer beside `pino-core`.

## Core integration

For Core-owned Open Studio capabilities, `lib/pino-core-public-adapter.ts` proxies the Core public API. Session availability originates from Core and registration submissions are sent to Core with an idempotency key when registration is enabled.

The web layer may:

- shape presentation;
- proxy and cache safe public reads;
- enforce transport requirements;
- expose a web-specific capability signal;
- handle upstream-unavailable presentation.

The web layer must not independently recreate Core-owned capacity, identity, attendance, access, membership, or booking invariants.

## Notion usage

Notion remains an integration source for explicitly designated web CMS/configuration concerns, including content and image asset readers currently present in the repository. This is intentionally separate from canonical operational-domain authority.

Do not interpret “this page reads Notion” as “Notion owns every domain represented on the page.” Authority must be checked per capability.

## Other existing web behavior

The repository also contains member and booking-related web code. Before changing those paths, determine whether the behavior is still web/Notion-owned, transitional, or already represented canonically in Core. Do not perform an implicit migration through a UI refactor.

## Trust boundary

Only public Core contracts belong behind public web routes. Private Founder/internal Core service capabilities must not be exposed through `pino-web`.

## Cross-repository authority

The canonical cross-repository model is maintained in `pino-core/docs/system-context.md`. A material contract change between this repo and Core should update documentation in both repositories and use an ADR when it changes an accepted architectural decision.

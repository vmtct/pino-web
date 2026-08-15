# pino-web

Public PINO House web application and customer-facing experience surface.

## Role

`pino-web` owns public presentation, landing/funnel UX, web-specific composition, and delivery concerns. It is not the canonical owner of domain rules that have moved into `pino-core`.

For Core-owned Open Studio behavior, the web application uses the Core public contract through `lib/pino-core-public-adapter.ts`. Session reads and registration submission are upstream Core capabilities; the web layer may proxy, cache, validate transport requirements, and present them, but must not fork their canonical business rules.

Notion is still used for explicitly designated web CMS/configuration concerns such as content and image assets. That does not make Notion the global source of truth for PINO operational domains.

## Start here

Architecture-aware work should read:

1. `AGENTS.md`
2. `docs/architecture.md`
3. the relevant integration/feature code and tests
4. `agent/README.md` when changing autonomous CI recovery
5. `pino-core/docs/system-context.md` and accepted Core ADRs when touching a Core-owned domain contract

## Architecture rule

Authority is per domain. UI code, caches, Notion CMS data, and external IDs must not become competing canonical state for a domain owned by Core.

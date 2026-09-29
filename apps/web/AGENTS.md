# @invoicing/web — Agent Guide

Scaffold Remix untuk MVP invoicing. **Prioritas workspace saat ini: dokumentasi** — lihat [docs/invoicing/BRD-DEFINITION-OF-DONE.md](../../docs/invoicing/BRD-DEFINITION-OF-DONE.md).

Requirement: [docs/invoicing/BRD.md](../../docs/invoicing/BRD.md) · Architecture: [docs/invoicing/ARCHITECTURE.md](../../docs/invoicing/ARCHITECTURE.md) · TDD: [docs/invoicing/engineering/TECHNICAL-DESIGN.md](../../docs/invoicing/engineering/TECHNICAL-DESIGN.md)

## Commands *(saat fase implementasi)*

Perintah di [docs/invoicing/engineering/STACK-INTEGRATION.md](../../docs/invoicing/engineering/STACK-INTEGRATION.md). Ringkas: `npm run dev` dari root monorepo `Agentic/`.

## Building Features

Refer to ./.agents/skills/remix/SKILL.md for the Remix mental model and how to find guides and API READMEs through `node_modules/remix/INDEX.md`.

## Starter Layout

- `app/routes.ts` defines the shared route contract used by server and browser modules for type-safe hrefs
- `app/router.ts` wires routes to controllers and installs the standard Remix UI renderer used by actions
- Put top-level route actions in `app/actions/controller.tsx`; add `app/actions/<route-key>/controller.tsx` for nested route maps. `app/actions/controller.test.ts` is the root controller's router smoke test
- `app/actions/home-page.tsx` and `app/actions/document.tsx` render the route-owned starter UI
- `app/actions/public/` contains the browser runtime entry and interactive prompt button
- `app/assets.ts` owns the server-side asset pipeline used by the asset route and render middleware
- Root `public/` contains static files served unchanged from the app root

- Shared logic: `@invoicing/domain` · DB: `@invoicing/database` (not in this app)
- `app/styles/app.css` — Tailwind → `public/app.css`
- Backend JSON: `@invoicing/api` — [API.md](../../docs/invoicing/engineering/API.md)

This starter intentionally begins small; add `app/middleware/`, `app/ui/`, and `test/` as features grow.

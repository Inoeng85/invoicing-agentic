# ADR-0004 — Lokasi design token bersama

| Status | Accepted |
|--------|----------|
| Tanggal | 2026-09-30 |
| Konteks | Q-04 · PS-41 |

## Keputusan

Token semantik (`:root`, `.dark`, `@theme inline`) berada di **`packages/design-tokens/tokens.css`**.

- Prototype: `docs/design/prototype/src/tailwind.css` meng-import file tersebut.
- App: `apps/web/app/styles/app.css` meng-import token + `--color-brand: var(--primary)`.
- **Dark mode di app nonaktif** (D-11); class `.dark` hanya prototype.

## Konsekuensi

Satu sumber untuk PS-41/PS-42; komponen `@layer components` tetap di prototype hingga porting layar (G-07).

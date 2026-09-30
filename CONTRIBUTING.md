# Contributing — Invoicing (Agentic)

## Branch

| Pola | Pakai untuk |
|------|-------------|
| `feature/*` | Fitur / platform (FR, PS) |
| `fix/*` | Bugfix |
| `release/*` | Persiapan tag |

## Commit

Format: `type(scope): ringkasan`

Contoh: `feat(invoices): FR-05 send email` · `fix(ci): quote env URLs`

## Pull request

Gunakan template PR. Wajib:

- `npm run verify` hijau (lokal)
- Cantumkan FR/PS terkait

## Release

- Tag SemVer: `v0.1.0`, `v0.1.0-rc.1`
- Production deploy dari tag (Phase 3)

## Dev

[STACK-INTEGRATION.md](docs/invoicing/engineering/STACK-INTEGRATION.md)

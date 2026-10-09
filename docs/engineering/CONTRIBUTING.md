# Contributing — Invoicing (Agentic)

## Branch

Branch utama dan target integrasi adalah `develop`. Semua pekerjaan dilakukan di branch `feat/*`, termasuk bugfix, dokumentasi, dan infrastruktur; setelah selesai, merge melalui pull request ke `develop`.

| Pola | Pakai untuk |
|------|-------------|
| `develop` | Branch utama dan integrasi; tidak untuk commit langsung |
| `feat/*` | Semua perubahan, dibuat dari `develop` terbaru |

```sh
git switch develop
git pull --ff-only origin develop
git switch -c feat/nama-pekerjaan
```

## Commit

Format: `type(scope): ringkasan`

Contoh: `feat(invoices): FR-05 send email` · `fix(ci): quote env URLs`

## Pull request

Gunakan template PR. Wajib:

- Source branch `feat/*`, target branch `develop`
- `npm run verify` hijau (lokal)
- Cantumkan FR/PS terkait

## Release

- Tag SemVer: `v0.1.0`, `v0.1.0-rc.1`
- Buat tag dari hasil integrasi di `develop`
- Production deploy dari tag (Phase 3)

## Dev

[STACK-INTEGRATION.md](STACK-INTEGRATION.md)

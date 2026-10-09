# Contributing — Invoicing (Agentic)

## Branch

`develop` = branch utama (default + protected). Semua pekerjaan di branch `feat/*`, lalu merge ke `develop`.

| Pola | Pakai untuk |
|------|-------------|
| `develop` | Branch utama — integrasi semua pekerjaan, deploy otomatis ke staging |
| `main` | Cadangan / garis rilis — di-promote dari `develop` |
| `feat/*` | Semua pekerjaan: fitur, platform (FR, PS), bugfix |
| `release/*` | Persiapan tag |

```sh
git switch develop && git pull
git switch -c feat/<topik>
# ... kerja, commit ...
git switch develop && git merge feat/<topik>
```

## Commit

Format: `type(scope): ringkasan`

Contoh: `feat(invoices): FR-05 send email` · `fix(ci): quote env URLs`

## Pull request

Gunakan template PR. Wajib:

- `npm run verify` hijau (lokal)
- Cantumkan FR/PS terkait

## Release

- Staging deploy otomatis dari `develop` setelah CI hijau
- Tag SemVer: `v0.1.0`, `v0.1.0-rc.1`
- Production deploy dari tag (Phase 3)

## Dev

[STACK-INTEGRATION.md](docs/invoicing/engineering/STACK-INTEGRATION.md)

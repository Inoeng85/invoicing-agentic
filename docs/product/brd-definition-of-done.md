---
status: draft
owner: repository-maintainers
reviewed: 2026-10-10
review-scope: structure-and-links
---

# Definition of Done — Paket Dokumentasi Invoicing

**Entry point** workspace dokumentasi produk.

| Meta | Nilai |
|------|--------|
| Tanggal | 2026-09-29 |
| Status paket BRD | **Complete** |
| Status system architecture | **Complete** (v1.5), selaras [brd/architecture-alignment.md](brd/architecture-alignment.md) v2.0 |
| Status basecode | **MVP implemented** — FR-01–FR-08 (gate G0–G5 Pass); Phase 6 pending |

---

## Dokumen utama

| # | Dokumen | Isi |
|---|---------|-----|
| 1 | [brd.md](brd.md) | Requirement bisnis |
| 2 | [ARCHITECTURE.md](../architecture/README.md) | System architecture |
| 3 | [engineering/technical-design.md](../engineering/technical-design.md) | TDD monorepo |
| 4 | [engineering/technology-stack.md](../engineering/technology-stack.md) | Technology stack (BRD + architecture) |
| 5 | [engineering/api.md](../engineering/api.md) | Spesifikasi backend JSON |

---

## Monorepo (kode)

```
Agentic/
├── apps/
│   ├── web/              @invoicing/web   — UI :44100
│   └── api/              @invoicing/api   — JSON :44101
├── packages/
│   ├── database/         @invoicing/database — Prisma
│   └── domain/           @invoicing/domain   — logic shared
├── docs/product/       ← dokumentasi
└── package.json          npm workspaces
```

| App / package | README |
|---------------|--------|
| Web | [apps/web/README.md](../engineering/apps/web/README.md) |
| API | [apps/api/README.md](../engineering/apps/api/README.md) |
| Packages | [packages/README.md](../engineering/packages/README.md) |

Operasi dev: [engineering/stack-integration.md](../engineering/stack-integration.md)

---

## Peta dokumentasi

```
docs/product/
├── brd-definition-of-done.md
├── brd.md
├── ARCHITECTURE.md
├── brd/                  # artefak BRD + architecture-alignment.md
├── design/               # design-guidelines.md
├── engineering/            # TECHNOLOGY-STACK, TDD, API, STACK-INTEGRATION
└── legal/
```

---

## Checklist dokumentasi

| Kriteria | Status |
|----------|--------|
| BRD + MoSCoW | Done |
| System architecture (CI/CD, QA, observability) | Done |
| BRD ↔ Architecture ↔ Stack ↔ Design alignment | Done | [brd/architecture-alignment.md](brd/architecture-alignment.md) |
| Prototype HTML design system | Done | [../design/prototype/](../design/prototype/README.md) |
| TDD monorepo web + API | Done |
| Technology stack (BRD + architecture) | Done | [engineering/technology-stack.md](../engineering/technology-stack.md) |
| API specification | Done |
| Legal draft | Done |
| Design guidelines | Done | [design/design-guidelines.md](../design/design-guidelines.md) |

---

## Checklist basecode

| Item | Status |
|------|--------|
| `@invoicing/database` + migrasi | Done |
| `@invoicing/domain` | Done |
| `@invoicing/api` health + v1 (auth, profile, clients, invoices, public) | Done |
| `@invoicing/web` → shared domain | Done |
| FR-01–FR-08 fitur bisnis | **Implemented** (gate: `npm run gate`) |
| Development phases + gates | Done | [engineering/development-phases.md](../engineering/development-phases.md) |

---

## Sebelum production

- [x] Auth on API (session cookie / Bearer)
- [x] CI workflow (`.github/workflows/ci.yml`)
- [ ] UAT FR Pass ([brd/user-stories-uat.md](brd/user-stories-uat.md))
- [ ] Legal review ([legal/](legal))
- [ ] Gap Must ditutup: G-01, G-02, G-04, G-05, G-13 ([alignment §6](brd/architecture-alignment.md#6-register-gap-dokumen--kode))

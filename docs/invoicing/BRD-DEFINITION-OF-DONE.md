# Definition of Done — Paket Dokumentasi Invoicing

**Entry point** workspace dokumentasi produk.

| Meta | Nilai |
|------|--------|
| Tanggal | 2026-09-29 |
| Status paket BRD | **Complete** |
| Status system architecture | **Complete** (v1.5), selaras [brd/ARCHITECTURE-ALIGNMENT.md](./brd/ARCHITECTURE-ALIGNMENT.md) v2.0 |
| Status basecode | **MVP implemented** — FR-01–FR-08 (gate G0–G5 Pass); Phase 6 pending |

---

## Dokumen utama

| # | Dokumen | Isi |
|---|---------|-----|
| 1 | [BRD.md](./BRD.md) | Requirement bisnis |
| 2 | [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture |
| 3 | [engineering/TECHNICAL-DESIGN.md](./engineering/TECHNICAL-DESIGN.md) | TDD monorepo |
| 4 | [engineering/TECHNOLOGY-STACK.md](./engineering/TECHNOLOGY-STACK.md) | Technology stack (BRD + architecture) |
| 5 | [engineering/API.md](./engineering/API.md) | Spesifikasi backend JSON |

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
├── docs/invoicing/       ← dokumentasi
└── package.json          npm workspaces
```

| App / package | README |
|---------------|--------|
| Web | [apps/web/README.md](../../apps/web/README.md) |
| API | [apps/api/README.md](../../apps/api/README.md) |
| Packages | [packages/README.md](../../packages/README.md) |

Operasi dev: [engineering/STACK-INTEGRATION.md](./engineering/STACK-INTEGRATION.md)

---

## Peta dokumentasi

```
docs/invoicing/
├── BRD-DEFINITION-OF-DONE.md
├── BRD.md
├── ARCHITECTURE.md
├── brd/                  # artefak BRD + ARCHITECTURE-ALIGNMENT.md
├── design/               # DESIGN-GUIDELINES.md
├── engineering/            # TECHNOLOGY-STACK, TDD, API, STACK-INTEGRATION
└── legal/
```

---

## Checklist dokumentasi

| Kriteria | Status |
|----------|--------|
| BRD + MoSCoW | Done |
| System architecture (CI/CD, QA, observability) | Done |
| BRD ↔ Architecture ↔ Stack ↔ Design alignment | Done | [brd/ARCHITECTURE-ALIGNMENT.md](./brd/ARCHITECTURE-ALIGNMENT.md) |
| Prototype HTML design system | Done | [../design/prototype/](../design/prototype/README.md) |
| TDD monorepo web + API | Done |
| Technology stack (BRD + architecture) | Done | [engineering/TECHNOLOGY-STACK.md](./engineering/TECHNOLOGY-STACK.md) |
| API specification | Done |
| Legal draft | Done |
| Design guidelines | Done | [design/DESIGN-GUIDELINES.md](./design/DESIGN-GUIDELINES.md) |

---

## Checklist basecode

| Item | Status |
|------|--------|
| `@invoicing/database` + migrasi | Done |
| `@invoicing/domain` | Done |
| `@invoicing/api` health + v1 (auth, profile, clients, invoices, public) | Done |
| `@invoicing/web` → shared domain | Done |
| FR-01–FR-08 fitur bisnis | **Implemented** (gate: `npm run gate`) |
| Development phases + gates | Done | [engineering/DEVELOPMENT-PHASES.md](./engineering/DEVELOPMENT-PHASES.md) |

---

## Sebelum production

- [x] Auth on API (session cookie / Bearer)
- [x] CI workflow (`.github/workflows/ci.yml`)
- [ ] UAT FR Pass ([brd/USER-STORIES-UAT.md](./brd/USER-STORIES-UAT.md))
- [ ] Legal review ([legal/](./legal/))
- [ ] Gap Must ditutup: G-01, G-02, G-04, G-05, G-13 ([alignment §6](./brd/ARCHITECTURE-ALIGNMENT.md#6-register-gap-dokumen--kode))

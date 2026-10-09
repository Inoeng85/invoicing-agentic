# Dokumentasi proyek

Dokumentasi PuraPuraLupa / Komando: requirement produk, implementasi invoicing, operasional, dan workflow pengembangan.

## Struktur

| Folder | Isi | Mulai dari |
|---|---|---|
| `product/` | BRD, scope, user stories, legal, dan PRD per epic | [Produk](product/README.md) · [Requirement](product/requirements/README.md) |
| `architecture/` | Arsitektur sistem dan keputusan teknis | [Arsitektur](architecture/README.md) · [ADR](architecture/decisions/) |
| `engineering/` | Setup developer, API, desain teknis, aplikasi, dan shared packages | [Engineering](engineering/README.md) |
| `design/` | Guideline, modul desain, contoh layar, dan prototype | [Desain](design/README.md) · [Prototype](design/prototype/index.html) |
| `operations/` | Deployment, runbook, provisioning, launch, dan branch protection | [Launch lane](operations/LAUNCH-LANE.md) · [Deployment](operations/deployment/railway/README.md) |
| `workflow/` | Proses agentic, skills, template, backlog, plan, hasil task, dan dashboard | [Workflow](workflow/README.md) · [Kanban](workflow/dashboard/kanban-board.html) |
| `reports/` | Output pemeriksaan gate yang dihasilkan otomatis | [Panduan laporan](reports/README.md) |
| `archive/` | Catatan dan log sesi agent terdahulu | [Panduan arsip](archive/README.md) |

## Jalur baca

- **Mulai development:** [kontribusi](engineering/CONTRIBUTING.md) → [setup dan perintah](engineering/STACK-INTEGRATION.md) → [panduan web](engineering/apps/web/README.md) / [API](engineering/apps/api/README.md).
- **Memahami produk:** [BRD](product/BRD.md) → [scope MVP](product/brd/MVP-SCOPE-LOCK.md) → [PRD per epic](product/requirements/README.md).
- **Merancang implementasi:** [arsitektur](architecture/README.md) → [keputusan teknis](architecture/decisions/) → [desain teknis](engineering/TECHNICAL-DESIGN.md) → [spesifikasi API](engineering/API.md).
- **Menjalankan task:** [feature backlog](workflow/features/README.md) → [plan](workflow/plans/README.md) → [hasil task](workflow/results/README.md) → [dashboard](workflow/dashboard/kanban-board.html).
- **Menyiapkan rilis:** [release readiness](engineering/RELEASE-READINESS.md) → [staging](operations/STAGING-PROVISION-CHECKLIST.md) → [production](operations/PRODUCTION-PROVISION-CHECKLIST.md).

## Penempatan dokumen

Gunakan folder sesuai fungsi dokumen. ID epic dan task tetap dipertahankan agar katalog, plan, dan laporan saling terhubung. Saat memindahkan dokumen, perbarui tautan, template, dan skrip yang membaca path tersebut.

File `AGENTS.md`, skill aktif di `.cursor/skills/`, template PR di `.github/`, dan state runtime di `.agentic/` tetap berada di lokasi operasionalnya.

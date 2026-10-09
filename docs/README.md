# Dokumentasi proyek

Dokumentasi PuraPuraLupa / Komando: requirement produk, implementasi invoicing, operasional, dan workflow pengembangan.

## Struktur

| Folder | Isi | Mulai dari |
|---|---|---|
| `product/` | BRD, scope, user stories, legal, dan PRD per epic | [Produk](product/README.md) · [Requirement](product/requirements/README.md) |
| `architecture/` | Arsitektur sistem dan keputusan teknis | [Arsitektur](architecture/README.md) · [ADR](architecture/decisions/) |
| `engineering/` | Setup developer, API, desain teknis, aplikasi, dan shared packages | [Engineering](engineering/README.md) |
| `design/` | Guideline, modul desain, contoh layar, dan prototype | [Desain](design/README.md) · [Prototype](design/prototype/index.html) |
| `operations/` | Deployment, runbook, provisioning, launch, dan branch protection | [Operations](operations/README.md) · [Deployment](operations/deployment/railway/README.md) |
| `workflow/` | Proses agentic, skills, template, backlog, plan, hasil task, dan dashboard | [Workflow](workflow/README.md) · [Dashboard](workflow/dashboard/README.md) |
| `reports/` | Output pemeriksaan gate yang dihasilkan otomatis | [Panduan laporan](reports/README.md) |
| `archive/` | Catatan dan log sesi agent terdahulu | [Panduan arsip](archive/README.md) |

## Jalur baca

- **Mulai development:** [kontribusi](engineering/contributing.md) → [setup dan perintah](engineering/stack-integration.md) → [panduan web](engineering/apps/web/README.md) / [API](engineering/apps/api/README.md).
- **Memahami produk:** [BRD](product/brd.md) → [scope MVP](product/brd/mvp-scope-lock.md) → [PRD per epic](product/requirements/README.md).
- **Merancang implementasi:** [arsitektur](architecture/README.md) → [keputusan teknis](architecture/decisions/) → [desain teknis](engineering/technical-design.md) → [spesifikasi API](engineering/api.md).
- **Menjalankan task:** [feature backlog](workflow/features/README.md) → [plan](workflow/plans/README.md) → [hasil task](workflow/results/README.md) → [dashboard](workflow/dashboard/kanban-board.html).
- **Menyiapkan rilis:** [release readiness](engineering/release-readiness.md) → [staging](operations/staging-provision-checklist.md) → [production](operations/production-provision-checklist.md).

## Penempatan dokumen

Gunakan folder sesuai fungsi dokumen. ID epic dan task tetap dipertahankan agar katalog, plan, dan laporan saling terhubung. Saat memindahkan dokumen, perbarui tautan, template, dan skrip yang membaca path tersebut.

File `AGENTS.md`, skill aktif di `.cursor/skills/`, template PR di `.github/`, dan state runtime di `.agentic/` tetap berada di lokasi operasionalnya.

## Dokumentasi yang dipelihara

- Gunakan filename `lowercase-kebab-case`, misalnya `technical-design.md`. Pertahankan `README.md`, `SKILL.md`, dan `AGENTS.md` karena berfungsi sebagai entry point konvensional.
- README tiap bagian berisi tujuan, jalur baca, dan tautan dokumen utama. Gunakan tautan relatif, bukan path workstation pribadi.
- Spesifikasi utama memakai frontmatter `status` (`draft`, `approved`, `archived`), `owner`, `reviewed` (`YYYY-MM-DD`), dan `review-scope`. Review struktur dan tautan tidak mengubah persetujuan produk atau legal.
- Snapshot otomatis berada di `reports/`; ubah sumber lalu regenerate. Arsip task selesai berada di [completed tasks](archive/completed-tasks/README.md); log sesi lokal tetap di `archive/agent-sessions/`.
- Jalankan `npm run docs:check` sebelum PR. Pemeriksaan ini memvalidasi target tautan lokal Markdown, referensi HTML, dan URL data dashboard; tautan eksternal dan fragment heading tidak diperiksa.

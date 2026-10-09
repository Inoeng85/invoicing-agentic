---
name: feature-audit
description: Checklist review & uji untuk Agent Audit dalam satu phase — backend, web, integration, gate.
---

# Feature — Audit (phase)

Gunakan bersama [agent-audit/SKILL.md](../../audit/SKILL.md). Satu phase, banyak task.

## Checklist review code

- [ ] Semua **Files** task phase di-review (diff vs baseline branch).
- [ ] Tidak ada secret, env sample aman, error handling konsisten.
- [ ] API kontrak selaras PRD; migrasi DB reversible bila ada.
- [ ] Frontend: state, routing, i18n/a11y sesuai gate epic.
- [ ] Cross-task: tidak ada duplikasi atau konflik antar task dalam phase.

## Checklist uji

| Area | Contoh perintah / bukti |
|------|-------------------------|
| Backend | test package API/domain, endpoint health, skema |
| Web | `npm run test -w @invoicing/web`, smoke halaman kritis |
| Integration | alur E2E / staging smoke / skrip di PRD phase |
| Gate epic | `npm run gate`, `npm run ci:local` bila scope phase menyentuh gate |

Catat **perintah**, **exit code**, dan **ringkasan** di `audit/report.md`.

## Dokumen wajib di-update

- `docs/development/Plan/{epic}/phase-{nn}/audit.md`
- `devPhasePath` dari catalog task (development phase PRD)
- PRD epic canonical di `docs/PRD/`

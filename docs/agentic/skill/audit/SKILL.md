---
name: agent-audit
description: Agent Audit — 1 session = 1 phase/card; review code seluruh task phase, uji backend/web/integration; commit lokal, laporan, update PRD; kolom Audit → Human QA.
---

# Agent Audit

## Prasyarat

- **Satu phase / satu card kanban** — semua task dalam phase sudah **QA pass** + laporan QA per task.
- Gate QA: `npm run agentic:validate-qa` untuk setiap task phase (atau cek kanban `qaPhaseComplete`).
- Konteks: `docs/development/Plan/{epic}/phase-{nn}/`, semua `tasks/*/plan.md`, laporan dev/QA, **dev phase PRD** (`devPhasePath` dari catalog), epic PRD di `docs/PRD/`.

## Aturan session (wajib)

| # | Aturan |
|---|--------|
| A1 | **Satu session = satu phase (satu card)** — tidak campur phase atau epic lain. |
| A2 | **Review code** untuk **seluruh task** dalam phase (Files PRD, diff git, feature docs). |
| A3 | Jalankan **uji backend**, **uji web (frontend)**, **integration test**, dan uji lain yang relevan (gate epic, smoke, perintah di PRD phase). |
| A4 | Auditor **tidak menulis kode produk**; hanya laporan, update dokumen PRD/plan, dan commit **artefak audit + doc** bila perlu. |
| A5 | Setelah **seluruh** checklist audit selesai: **commit git lokal** (pesan jelas, scope phase) → **laporan audit** → update **PRD epic**, **PRD development phase**, dan **audit.md** plan phase. |
| A6 | Hasil **`pass`** → phase/task ke **Human QA**. **`needs_clarify`** → **Human Clarify**. **`fail`** tanpa ambigu → catat temuan; eskalasi human atau task kembali Development sesuai kebijakan epic. |

## Alur per phase

1. Buka `docs/development/Plan/{epic}/phase-{nn}/audit.md` (buat dari template bila belum ada); isi rencana audit.
2. Inventaris task phase + kumpulkan laporan `development/` dan `qa/` per task.
3. **Code review** lintas task (API, DB, UI, keamanan, konvensi repo).
4. **Uji** (contoh, sesuaikan epic):
   - Backend: unit/integration API, health, skema DB bila relevan.
   - Web: smoke UI, alur kritis, a11y dasar bila gate mensyaratkan.
   - Integration: alur end-to-end antar modul yang disentuh phase.
   - Lainnya: `npm run gate`, `npm run ci:local`, perintah verify di development phase PRD.
5. Tulis laporan:

   ```text
   docs/development/Result/{epic}/phase-{nn}/audit/report.md
   ```

   Template: [audit-report.template.md](../../../development/Result/_templates/audit-report.template.md).

6. Update dokumen:
   - `docs/development/Plan/{epic}/phase-{nn}/audit.md` — section **Audit** status `pass` | `fail` | `needs_clarify`.
   - **PRD development phase** — path dari task catalog `devPhasePath` (contoh `docs/.../PRD_*_development_phase.md`): tambah ringkasan audit + link laporan.
   - **PRD epic** — folder `docs/PRD/{epic}-*/` file PRD utama: catatan audit phase (tanggal, hasil, link).
7. **Git commit lokal** — minimal laporan audit + perubahan doc plan/PRD; jangan commit secret.

   ```bash
   git add docs/development/Result/.../audit/report.md docs/development/Plan/.../audit.md docs/...
   git commit -m "audit({epic}-P{n}): phase audit pass — …"
   ```

8. Validasi handoff:

   ```bash
   npm run agentic:validate-audit -- --epic {epic} --phase {n}
   ```

## Phase selesai

- Semua task tetap QA pass + **audit phase `pass`** → kolom kanban **Human QA** (gate release manusia).
- Ada **`needs_clarify`** di laporan atau plan → **Human Clarify** untuk phase.

## UI progress

Kanban (tampilan phase + panel progress): status **audit phase**, link laporan · `npm run agentic:kanban-data`.

## Yang tidak boleh

- Satu session untuk dua phase/card.
- Audit sebelum semua task QA pass.
- Menandai `pass` tanpa bukti uji dan review di laporan.
- Menulis kode fitur produk (gunakan Agent Development / QA untuk perbaikan).
- Lompati Human QA setelah audit pass.

Kontrak feature review: [feature/audit/SKILL.md](../feature/audit/SKILL.md).

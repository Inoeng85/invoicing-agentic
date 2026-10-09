---
name: agent-qa
description: Agent QA — 1 session = 1 feature + 1 task; uji terkecil per plan; laporan + update plan; boleh fix dalam boundary feature. Kolom Test.
---

# Agent QA

## Prasyarat

- Task **Development** selesai (`plan.md` section Development = `complete`, laporan development ada).
- Feature doc: [docs/agentic/development/features/](../../development/features/) — **session boundary sama** seperti Agent Development.
- Masukan: `plan.md`, `skills/qa.md`, laporan development, acceptance PRD.

## Aturan session (wajib)

| # | Aturan |
|---|--------|
| Q1 | **Satu session = satu feature + satu task** (sama dengan Development). |
| Q2 | Jalankan **uji terkecil** yang tercantum di `skills/qa.md` (perintah, data, expected) — tidak melewati step. |
| Q3 | Setiap butir uji punya bukti (exit code, cuplikan log) di laporan. |
| Q4 | Selesai task: **laporan QA** + update section **QA** di `plan.md`. |
| Q5 | **Gagal + perlu perbaikan:** agent QA **boleh memperbaiki kode** hanya dalam path feature doc + **Files** PRD; uji ulang dalam session yang sama sampai lulus atau eskalasi. |
| Q6 | Instruksi/expected ambigu → **Human Clarify** (phase/task), jangan tebak. |

## Alur per task

1. Buka feature doc + plan + `skills/qa.md` + hasil development.
2. Jalankan setiap uji terkecil; catat hasil.
3. Jika gagal dan fix jelas: perbaiki kode → commit → uji ulang (masih session yang sama).
4. Tulis laporan:

   ```text
   docs/development/Result/{epic}/phase-{nn}/qa/{task-id}.md
   ```

   Template: [qa-report.template.md](../../../development/Result/_templates/qa-report.template.md).

5. Update **plan.md**:

   ```markdown
   ## QA

   | Field | Nilai |
   |-------|-------|
   | Status | `pass` · `fail` · `needs_clarify` |
   | Laporan | docs/development/Result/.../qa/{task-id}.md |
   | Fix dalam session | ya/tidak + ringkas |
   | Selesai | ISO-8601 |
   ```

6. Task lulus (`pass`) → kolom **Audit** (task). Gagal tanpa fix path → tetap **Test** atau Human Clarify.

## Phase QA selesai

Semua task dalam **satu phase/card** punya QA `pass` + laporan → phase/card pindah ke **Agent Audit**.

Jika ada task `needs_clarify` → phase ke **Human Clarify** sampai human menjawab.

Manifest opsional: `docs/development/Result/{epic}/phase-{nn}/qa/phase-qa-summary.md`.

## UI progress

Kanban panel **Progress task dalam phase** menampilkan `qaStatus` per task · data dari `npm run agentic:kanban-data`.

Validasi:

```bash
npm run agentic:validate-qa -- --task 0702-task-01 --epic 0702 --phase 1
```

## Yang tidak boleh

- Satu session untuk dua task.
- Fix di luar feature doc / **Files** task.
- Menandai `pass` tanpa bukti uji di laporan.
- Lompati Audit sebelum semua task phase lulus QA.

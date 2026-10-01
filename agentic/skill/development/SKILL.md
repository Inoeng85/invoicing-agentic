---
name: agent-development
description: Agent Development — 1 session = 1 feature + 1 task plan; laporan + update plan.md; kolom Development.
---

# Agent Development

## Prasyarat

- Phase di kolom **Development** (plan task `defined` di `Development/Plan/.../tasks/{task-id}/plan.md`).
- Feature doc ada di [agentic/development/features/](../../development/features/) — dibuat Agent Plan, dirujuk field **Feature** di plan task.

## Aturan session (wajib)

| # | Aturan |
|---|--------|
| S1 | **Satu session = satu feature + satu task.** Tidak ganti task di tengah session. |
| S2 | **Satu feature** = satu file `agentic/development/features/{feature-id}.md` berisi **semua path** backend, frontend, docs yang boleh diubah session itu. |
| S3 | Eksekusi **persis** dari plan task + skill files (`skills/backend.md`, `skills/frontend.md`, …). |
| S4 | Urutan dalam phase: kerjakan task sesuai urutan di `plan-manifest.json` / intake phase kecuali human mengubah. |
| S5 | Setelah task selesai: **laporan** + **update plan** sebelum session berakhir. |

## Alur per task

1. Buka `plan.md` + feature doc + skill files.
2. Kerjakan implementasi; commit/PR sesuai Global Constraints PRD.
3. Tulis laporan:

   ```text
   Development/Result/{epic}/phase-{nn}/development/{task-id}.md
   ```

   Template: [development-report.template.md](../../../Development/Result/_templates/development-report.template.md).

4. Update **plan task** — tambah atau isi section:

   ```markdown
   ## Development

   | Field | Nilai |
   |-------|-------|
   | Status | `complete` |
   | Laporan | Development/Result/.../development/{task-id}.md |
   | Commit/PR | … |
   | Selesai | ISO-8601 |

   ### Catatan implementasi
   …
   ```

5. Update baris status di feature doc (tabel task) → `complete`.
6. Orchestrator/kanban: task bergerak ke **Test** (Agent QA).
7. **Autopilot chain:** `npm run agentic:validate-dev -- --task {task-id} --epic {epic} --phase {n}` lalu `npm run agentic:autopilot -- complete --task {task-id}` (atau biarkan `npm run agentic:autopilot:watch` memicu task Development berikutnya).

## Yang tidak boleh

- Satu session untuk dua task atau dua feature.
- Mengubah file di luar feature doc dan **Files** PRD.
- Menandai selesai tanpa laporan dan tanpa update `plan.md`.
- Menjalankan QA penuh (itu Agent QA).

## UI progress

Progress task dalam phase: kanban board → panel **Progress per phase** atau `npm run agentic:kanban-data` (field `phaseProgress` di `kanban-board.json`).

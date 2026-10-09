---
name: agent-intake
description: Agent Intake — antrian semua phase dari satu/beberapa PRD Development phase di docs/product/requirements. Kolom kanban Intake (sub-step queue).
---

# Agent Intake

## Tujuan

Membangun **daftar phase** yang akan diorkestrasi (satu kartu kanban = satu phase), dari instruksi human dan dokumen di `Agentic/docs/product/requirements`.

## Masukan

1. Instruksi human: epic, folder PRD, dan/atau path `*_Development_phase.md` (boleh **beberapa** PRD dalam satu scope).
2. Opsional: `.agentic/catalog/index.json` dan `tasks.json` untuk task id dan epic.
3. Gate urutan: phase dengan `ordinal` lebih besar **tidak** boleh masuk Agent Plan sampai phase `ordinal - 1` berstatus **`released`** (Human QA selesai).

## Keluaran utama

File antrian scope (satu run aktif):

```text
docs/workflow/plans/intake-queue.json
```

Generate dari catalog + [intake-scope.json](../../plans/intake-scope.json):

```bash
npm run agentic:intake-queue
```

Struktur: lihat [intake-scope.example.json](../../plans/_templates/intake-scope.example.json).

Setiap entri `phases[]` minimal:

| Field | Isi |
|-------|-----|
| `phaseId` | Stabil, contoh `0702-P1`, `0000-P0` |
| `epic` | Empat digit |
| `ordinal` | Urutan eksekusi (1, 2, 3…) |
| `title` | Judul phase |
| `devPhasePath` | Path relatif repo ke Development phase |
| `taskIds` | Daftar task id dalam phase (dari parse PRD atau slice human) |
| `intakeStatus` | `queued` → `intake_complete` |
| `planStatus` | `blocked` · `ready_for_plan` · `in_plan` · `plan_complete` · `needs_human_clarify` |
| `intakeSubStep` | `queue` (Agent Intake) · `plan` (handoff ke Agent Plan) |
| `kanbanColumn` | `intake` · `plan` · `development` (mirror kolom kanban) |

Per phase, ringkasan:

```text
docs/workflow/plans/{epic}/phase-{nn}/intake-summary.md
```

## Cara menemukan phase

1. **Tabel fase** di Development phase (contoh PRD-0000: baris `Phase 0`…`Phase 3`).
2. **Slice task** human: rentang `### Task N` atau gate milestone (G0, PG-1, …).
3. **Satu file dev phase tanpa tabel fase:** treat sebagai **phase tunggal** `{{epic}}-P1` berisi semua task agentic-ready.

Jangan menulis kode produk. Jangan menulis plan per task (itu Agent Plan).

## Selesai (Agent Intake)

- Semua phase dalam scope punya `taskIds` non-kosong **atau** alasan eksplisit `taskIds: []` + human clarify.
- `intakeStatus: intake_complete` untuk phase yang antriannya valid.
- `planStatus: ready_for_plan` **hanya** jika:
  - `ordinal === 1`, **atau**
  - phase `ordinal - 1` punya `intakeStatus: released` (sudah Human QA).

Phase yang masih `planStatus: blocked` tetap di kolom Intake dengan label **Menunggu phase sebelumnya**.

## Handoff ke Agent Plan (kolom terpisah)

Setelah intake phase valid, `tick-intake` set `intakeSubStep: plan` dan **`kanbanColumn: plan`**. Kartu/task pindah ke kolom **Plan** (bukan sub-label di Intake). Gate: `planStatus === ready_for_plan` atau `in_plan`.

## Orkestrasi berurutan (otomatis)

Pipeline CLI (tanpa menulis kode produk):

```bash
npm run agentic:intake-run -- status    # phase aktif + langkah berikutnya
npm run agentic:intake-run -- next      # JSON: run_intake | run_plan_task | wait_…
npm run agentic:intake-run -- tick-intake --phase-id 0702-P1
npm run agentic:intake-run -- tick --task <id> --phase-id 0702-P1
npm run agentic:intake-run -- sync-gates   # setelah Human QA release phase sebelumnya
```

- **Task plan** dijalankan **berurutan** sesuai `taskIds` (task N+1 hanya setelah task N `defined`).
- Phase selesai plan → `plan_complete` + kanban **Development**; phase berikutnya (epic sama) otomatis **start intake** jika gate `released` terpenuhi.
- Gate: phase `ordinal > 1` menunggu phase sebelumnya **`released`** (Human QA) — gunakan `sync-gates` setelah release.

Ambigu scope (PRD bentrok, task id tidak ada, phase tidak jelas) → set `planStatus: needs_human_clarify` dan pindah kartu ke **Human Clarify** dengan pertanyaan di `docs/workflow/plans/clarify/{phaseId}.md`.

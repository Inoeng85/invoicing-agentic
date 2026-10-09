---
name: agent-plan
description: Agent Plan — plan per task (ID, penjelasan, tujuan, feature, skill terpisah). Selesai bila siap Development; ambigu → Human Clarify.
---

# Agent Plan

## Prasyarat

- `docs/workflow/plans/intake-queue.json`: phase ini `planStatus: ready_for_plan` atau `in_plan`.
- Phase sebelumnya (`ordinal - 1`) sudah `released` (Human QA).
- Kolom kanban: **Plan** (terpisah dari Intake).

## Keluaran wajib per task

Untuk **setiap** `taskId` dalam phase:

```text
docs/workflow/plans/{epic}/phase-{nn}/tasks/{task-id}/plan.md
docs/workflow/plans/{epic}/phase-{nn}/tasks/{task-id}/skills/{skill}.md
```

Template plan: [task-plan.template.md](../../plans/_templates/task-plan.template.md).

### Field wajib di `plan.md`

| Field | Requirement |
|-------|-------------|
| **Task** | Judul task (dari heading PRD) |
| **Task ID** | Id kanonik (format epic, contoh `070201-stack-…`) |
| **Penjelasan** | Apa yang dikerjakan; merujuk PRD, tanpa `[TBD]` |
| **Tujuan** | Outcome terukur + taut ke Produces/acceptance |
| **Feature** | Nama feature/modul + **Feature ID** (slug) |
| **Skill yang digunakan** | Daftar: Frontend, Backend, QA, Infra, Docs, … — **masing-masing file sendiri** di `skills/` |

**Feature doc (wajib untuk Development):** `docs/workflow/features/{feature-id}.md` — berisi semua file backend/frontend/docs untuk **satu session**. Template: [FEATURE.template.md](../../features/FEATURE.template.md).

Skill eksekusi per area: [docs/workflow/skills/feature/](../feature/) (rincian teknis); boundary file ada di feature doc.

Tambah skill di luar daftar hanya jika dibuat dulu folder `docs/workflow/skills/feature/{nama}/SKILL.md` dan direferensikan di plan.

**Setiap task** dalam phase wajib punya feature doc (boleh feature id sama jika task share boundary file, tapi tabel task di feature doc harus mencantumkan task id):

```text
docs/workflow/features/{feature-id}.md
```

Isi: daftar path backend, frontend, docs — ini boundary **Agent Development** (1 session).

## Manifest phase

```text
docs/workflow/plans/{epic}/phase-{nn}/plan-manifest.json
```

```json
{
  "phaseId": "0702-P1",
  "tasks": [
    { "taskId": "…", "planPath": "…/plan.md", "status": "defined" }
  ],
  "allDefined": true
}
```

`status` per task: `draft` · `defined` · `needs_human_clarify`.

## Urutan task (wajib)

Dalam satu phase, kerjakan task **satu per satu** sesuai urutan `taskIds` di `intake-queue.json`. Setelah satu task `defined`:

```bash
npm run agentic:validate-plan -- --task {task-id}
npm run agentic:intake-run -- tick --task {task-id} --phase-id {phase-id}
```

Perintah `tick` memvalidasi plan + memajukan `currentTaskId` ke task berikutnya. Jangan lompat task kecuali human mengubah antrian.

## Selesai (Agent Plan)

- Setiap task di phase punya `plan.md` lengkap dan setiap skill aktif punya `skills/{skill}.md`.
- `plan-manifest.json`: `allDefined: true` dan tidak ada task `needs_human_clarify`.
- Update `intake-queue.json`: `planStatus: plan_complete`, lalu kartu kanban → kolom **Development** (otomatis via `agentic:intake-run -- tick` pada task terakhir).

Jika **satu saja** task ambigu atau tidak dipahami:

- Task tersebut: `status: needs_human_clarify` + isi section **Ambigu / Human Clarify** di `plan.md`.
- Phase: `planStatus: needs_human_clarify` → kartu **Human Clarify** (bukan Development).
- Setelah human menjawab (file `docs/workflow/plans/clarify/{phaseId}-decision.md`), Plan agent melanjutkan task yang tertahan.

## Yang tidak boleh

- Menulis kode produk atau mengubah file di **Files** task.
- Menggabungkan beberapa task dalam satu `plan.md`.
- Menandai `defined` tanpa file skill terpisah untuk setiap skill yang disebut.

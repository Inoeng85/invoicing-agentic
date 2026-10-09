# Development — Plan

Rencana orkestrasi per **scope**, **phase**, dan **task**.

| Artefak | Pemilik | Deskripsi |
|---------|---------|-----------|
| [intake-queue.json](intake-queue.json) | Agent Intake | Daftar semua phase (1+ PRD); gate urutan phase |
| `{epic}/phase-{nn}/intake-summary.md` | Agent Intake | Ringkasan human-readable per phase |
| `{epic}/phase-{nn}/tasks/{task-id}/plan.md` | Agent Plan | Plan wajib: Task, Task ID, Penjelasan, Tujuan, Feature, Skill |
| `{epic}/phase-{nn}/tasks/{task-id}/skills/*.md` | Agent Plan | Satu file per skill (backend, frontend, qa, infra, docs, …) |
| `{epic}/phase-{nn}/plan-manifest.json` | Agent Plan | Status defined / clarify per task |
| [clarify/](clarify/) | Human + agent | Pertanyaan & jawaban ambigu |

Template: [_templates/](_templates/).

**Path plan task (workspace Cursor = `AIEngineer`):**

```text
Agentic/Development/Plan/{epic}/phase-{nn}/tasks/{task-id}/plan.md
```

Contoh: `Agentic/Development/Plan/0000/phase-00/tasks/000001-db-canonical-sqlite-path/plan.md`  
Cek: `npm run agentic:plan-path -- --task 000001-db-canonical-sqlite-path`

**Generate antrian**

```bash
npm run agentic:intake-queue          # baca intake-scope.json + catalog
npm run agentic:intake-queue:refresh  # catalog ulang, lalu intake-queue
npm run agentic:intake-queue -- --merge   # pertahankan status plan/intake per phaseId
npm run agentic:kanban-data               # intake (semua epic) + kanban-board.json untuk HTML
npm run agentic:kanban-watch              # rebuild kanban-data tiap 10s (terminal terpisah)
npm run agentic:intake-run -- next          # task/phase intake berikutnya (JSON)
npm run agentic:validate-plan -- --task …   # gate satu task plan
```

Konfigurasi scope: [intake-scope.json](intake-scope.json). Keluaran: [intake-queue.json](intake-queue.json) (+ salinan untuk kanban di `docs/workflow/dashboard/data/intake-queue.json`).

**Transisi kanban**

1. Kolom **Intake** (Agent Intake) → kolom **Plan** (Agent Plan) via `agentic:intake-run -- tick-intake` bila antrian valid.
2. Kolom **Plan** → **Development** bila `plan_complete` / `allDefined` (`tick` task terakhir).
3. Ambigu → Human Clarify kapan saja dari Intake/Plan.

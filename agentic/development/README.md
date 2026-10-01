# Agent Development — kontrak eksekusi

## Scope

Development dijalankan **per task** dalam suatu **phase**, sesuai plan yang Agent Plan sudah tulis.

## Session (wajib)

| Aturan | Detail |
|--------|--------|
| 1 session | **1 feature** + **1 task** |
| Feature | Dokumen `agentic/development/features/{feature-id}.md` — boundary **semua file** backend, frontend, docs, infra |
| Masukan | `Development/Plan/{epic}/phase-{nn}/tasks/{task-id}/plan.md` + `skills/*.md` |
| Keluaran | Laporan + update section **Development** di `plan.md` |

## Path

```text
agentic/development/features/{feature-id}.md     ← definisi feature (Plan)
Development/Plan/.../tasks/{task-id}/plan.md     ← plan task (Plan → update Development)
Development/Result/.../development/{task-id}.md ← laporan (Development)
```

## UI progress phase

Kanban: panel **Progress task dalam phase** · data `npm run agentic:kanban-data`.

Validasi task selesai:

```bash
npm run agentic:validate-dev -- --task 0702-task-01 --epic 0702 --phase 1
```

Skill agent: [../skill/development/SKILL.md](../skill/development/SKILL.md).

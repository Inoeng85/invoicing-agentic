# Skill agent — orkestrasi PRD-0800

Kerangka: [Agentic Software Development Framework](../README.md) — planning gate, boundary, human gate, validate → report → plan → progress → next task.

Folder canonical skill untuk agent di repo. Cursor memuat salinan atau symlink dari `.cursor/skills/` bila dikonfigurasi; definisi aktif untuk development ada di sini.

| Agent | Folder | Kolom kanban |
|-------|--------|----------------|
| Intake | [intake](intake/SKILL.md) | **Intake** |
| Plan | [plan](plan/SKILL.md) | **Plan** |
| Development | [development](development/SKILL.md) | Development |
| QA | [qa](qa/SKILL.md) | Test |
| Audit | [audit](audit/SKILL.md) | Audit |
| Human | — | Human Clarify · Human QA |

Feature (1 session Development): [development/features/](../features/) — boundary file backend/frontend/docs.

Skill area: [feature/](feature/) — **satu file plan per skill** di `docs/workflow/plans/.../tasks/{id}/skills/`.

Antrian phase (semua PRD dalam scope): `docs/workflow/plans/intake-queue.json` (Agent Intake).

Laporan eksekusi: `docs/workflow/results/` (Development per task, QA per task, **Audit per phase** `audit/report.md`).

Validasi: `agentic:validate-dev` · `agentic:validate-qa` · `agentic:validate-audit` (satu phase/card).

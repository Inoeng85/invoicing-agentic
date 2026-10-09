# Completed task records

Archive development, QA, and audit reports only after the task is Done and its audit passes. Preserve `results/{epic}/phase-{nn}/{development,qa,audit}/{task-id}.md` so task tools can resolve archived evidence. Active records take precedence when a task is reopened.

Plans stay in `docs/workflow/plans/` while their phase is active. Regenerate the catalog and dashboard and run `npm run docs:check` after moving records.

## Archived tasks

- **000001-db-canonical-sqlite-path**: [development](results/0000/phase-00/development/000001-db-canonical-sqlite-path.md), [QA](results/0000/phase-00/qa/000001-db-canonical-sqlite-path.md), and [passing audit](results/0000/phase-00/audit/000001-db-canonical-sqlite-path.md).

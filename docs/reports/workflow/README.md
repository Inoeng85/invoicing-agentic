# Generated workflow reports

Regenerate with `npm run agentic:catalog` followed by `npm run agentic:kanban-data` from the repository root. Do not edit snapshots or Markdown report previews manually; update their source requirements, plans, or task reports instead.

- `kanban-board.json` and `kanban-board-mirror.json`: dashboard snapshots.
- `intake-queue.json`, `intake-trigger.json`, and `autopilot.json`: orchestration snapshots.
- `task-checklist.json` and `task-checklist.md`: task checks.
- `monitoring.json`: monitoring snapshot; `monitoring-log.jsonl` is local runtime output.
- `reports/`: generated previews of maintained and archived task records.

Open the [dashboard](../../workflow/dashboard/kanban-board.html); edit active records in [workflow/results](../../workflow/results/README.md).

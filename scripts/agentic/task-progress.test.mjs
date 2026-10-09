import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { readTaskArtifacts, readTaskAuditOutcome, readQaReportOutcome, taskArtifactPaths, taskReportPath } from './task-progress.mjs'

test('completed evidence remains readable after archival and active reports take precedence', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'archived-task-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const taskId = '000001-db-canonical-sqlite-path'
  for (const kind of ['development', 'qa', 'audit']) {
    const target = path.join(root, 'docs/archive/completed-tasks/results/0000/phase-00', kind, `${taskId}.md`)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, '**Hasil** | `pass`')
  }
  assert.equal(readTaskArtifacts(root, '0000', 0, taskId).development, true)
  assert.equal(readTaskArtifacts(root, '0000', 0, taskId).qa, true)
  assert.equal(readQaReportOutcome(root, '0000', 0, taskId), 'pass')
  assert.equal(readTaskAuditOutcome(root, '0000', 0, taskId), 'pass')
  assert.match(taskArtifactPaths(root, '0000', 0, taskId).qa, /^docs\/archive\//)
  const active = path.join(root, 'docs/workflow/results/0000/phase-00/qa', `${taskId}.md`)
  fs.mkdirSync(path.dirname(active), { recursive: true })
  fs.writeFileSync(active, '**Hasil** | `fail`')
  assert.equal(taskReportPath(root, '0000', 0, 'qa', taskId), active)
  assert.equal(readQaReportOutcome(root, '0000', 0, taskId), 'fail')
  assert.equal(readTaskArtifacts(root, '0000', 0, 'missing-task').qa, false)
})

#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTaskChecklist, writeTaskChecklistArtifacts } from './task-checklist.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

function main() {
  const data = buildTaskChecklist(ROOT)
  const paths = writeTaskChecklistArtifacts(ROOT, data)
  console.log(
    `Task checklist: ${data.summary.total} task — done ${data.summary.done}, running ${data.summary.running}, ready ${data.summary.ready}, waiting ${data.summary.waiting}, blocked ${data.summary.blocked}`,
  )
  console.log(`  → ${paths.jsonRel}`)
  console.log(`  → ${paths.mdRel}`)
  if (data.summary.nextTaskId) {
    console.log(`  Next: ${data.summary.nextKind} ${data.summary.nextTaskId}`)
  }
}

main()

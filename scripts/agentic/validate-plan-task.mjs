#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { assessTaskPlan } from './intake-pipeline.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

function parseArgs(argv) {
  const out = { taskId: null, epic: null, phase: 1, phaseId: null }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--task' && argv[i + 1]) out.taskId = argv[++i]
    else if (argv[i] === '--epic' && argv[i + 1]) out.epic = argv[++i]
    else if (argv[i] === '--phase' && argv[i + 1]) out.phase = Number(argv[++i])
    else if (argv[i] === '--phase-id' && argv[i + 1]) out.phaseId = argv[++i]
  }
  return out
}

function main() {
  const opts = parseArgs(process.argv)
  if (!opts.taskId && !opts.phaseId) {
    console.error('Usage: validate-plan-task.mjs --task <id> [--epic] [--phase]')
    process.exit(1)
  }
  const taskId = opts.taskId
  const epic = opts.epic || taskId.slice(0, 4)
  const a = assessTaskPlan(ROOT, epic, opts.phase, taskId)
  console.log(`Validasi plan ${taskId}`)
  if (a.complete) {
    console.log('  OK: plan defined + skills')
    process.exit(0)
  }
  console.error('  FAIL: status', a.status, 'skills', a.skillCount)
  process.exit(1)
}

main()

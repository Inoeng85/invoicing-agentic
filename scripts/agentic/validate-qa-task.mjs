#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  phaseDirName,
  readPlanDevelopmentStatus,
  readPlanQaStatus,
  readQaReportOutcome,
} from './task-progress.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

function parseArgs(argv) {
  const out = { taskId: null, epic: null, phase: 1 }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--task' && argv[i + 1]) out.taskId = argv[++i]
    else if (argv[i] === '--epic' && argv[i + 1]) out.epic = argv[++i]
    else if (argv[i] === '--phase' && argv[i + 1]) out.phase = Number(argv[++i])
  }
  return out
}

function main() {
  const opts = parseArgs(process.argv)
  if (!opts.taskId) {
    console.error('Usage: validate-qa-task.mjs --task <id> [--epic] [--phase]')
    process.exit(1)
  }
  const epic = opts.epic || opts.taskId.slice(0, 4)
  const phaseNn = phaseDirName(opts.phase)
  const reportPath = path.join(
    ROOT,
    'Development/Result',
    epic,
    phaseNn,
    'qa',
    `${opts.taskId}.md`,
  )
  const errors = []
  const ok = []

  if (readPlanDevelopmentStatus(ROOT, epic, opts.phase, opts.taskId) !== 'complete') {
    errors.push('Development belum complete di plan.md')
  } else ok.push('development complete')

  if (!fs.existsSync(reportPath)) errors.push('Laporan QA hilang')
  else ok.push('laporan QA')

  const qaPlan = readPlanQaStatus(ROOT, epic, opts.phase, opts.taskId)
  const qaReport = readQaReportOutcome(ROOT, epic, opts.phase, opts.taskId)
  if (qaPlan !== 'pass' && qaReport !== 'pass') {
    errors.push('QA belum pass (plan atau report)')
  } else ok.push('QA pass')

  console.log(`Validasi QA ${opts.taskId}`)
  ok.forEach((m) => console.log('  OK:', m))
  if (errors.length) {
    errors.forEach((m) => console.error('  FAIL:', m))
    process.exit(1)
  }
  console.log('  → Task siap masuk Audit phase')
}

main()

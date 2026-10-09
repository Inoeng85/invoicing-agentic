#!/usr/bin/env node
/**
 * Validasi kelengkapan Agent Audit untuk satu phase (satu card kanban).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  phaseDirName,
  phaseQaGate,
  readPhaseAuditPlanStatus,
  readPhaseAuditReportOutcome,
  readPlanDevelopmentStatus,
  readPlanQaStatus,
} from './task-progress.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

function parseArgs(argv) {
  const out = { epic: null, phase: 1, phaseId: null }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--epic' && argv[i + 1]) out.epic = argv[++i]
    else if (argv[i] === '--phase' && argv[i + 1]) out.phase = Number(argv[++i])
    else if (argv[i] === '--phase-id' && argv[i + 1]) out.phaseId = argv[++i]
  }
  return out
}

function loadQueue() {
  const p = path.join(ROOT, 'docs/workflow/plans/intake-queue.json')
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function main() {
  const opts = parseArgs(process.argv)
  const queue = loadQueue()
  let ph = null
  if (opts.phaseId) {
    ph = (queue.phases || []).find((p) => p.phaseId === opts.phaseId)
  } else if (opts.epic) {
    ph = (queue.phases || []).find((p) => p.epic === opts.epic && p.ordinal === opts.phase)
  }
  if (!ph) {
    console.error('Usage: validate-audit-phase.mjs --epic 0702 --phase 1  OR  --phase-id 0702-P1')
    process.exit(1)
  }

  const epic = ph.epic
  const ordinal = ph.ordinal
  const phaseNn = phaseDirName(ordinal)
  const reportPath = path.join(
    ROOT,
    'docs/workflow/results',
    epic,
    phaseNn,
    'audit',
    'report.md',
  )
  const auditPlanPath = path.join(ROOT, 'docs/workflow/plans', epic, phaseNn, 'audit.md')

  const errors = []
  const ok = []
  const taskRows = []

  for (const taskId of ph.taskIds || []) {
    if (readPlanDevelopmentStatus(ROOT, epic, ordinal, taskId) !== 'complete') {
      errors.push(`Development belum complete: ${taskId}`)
    }
    const qa = readPlanQaStatus(ROOT, epic, ordinal, taskId)
    if (qa !== 'pass') errors.push(`QA belum pass: ${taskId} (${qa})`)
    taskRows.push({ taskId, qa })
  }
  if (!errors.length && taskRows.length) ok.push(`semua ${taskRows.length} task dev+QA siap`)

  const qaGate = phaseQaGate(taskRows.map((t) => ({ qaStatus: t.qa })))
  if (!qaGate.complete) errors.push('Gate QA phase belum complete')

  if (!fs.existsSync(reportPath)) errors.push('Laporan audit hilang: ' + reportPath)
  else ok.push('laporan audit/report.md')

  const planSt = readPhaseAuditPlanStatus(ROOT, epic, ordinal)
  const reportSt = readPhaseAuditReportOutcome(ROOT, epic, ordinal)
  if (planSt !== 'pass' && reportSt !== 'pass') {
    errors.push('Audit phase belum pass (audit.md atau report.md)')
  } else ok.push('audit pass')

  if (!fs.existsSync(auditPlanPath)) {
    errors.push('docs/workflow/plans/.../audit.md belum ada')
  } else ok.push('audit.md plan phase')

  console.log(`Validasi audit ${ph.phaseId} (${epic} ${phaseNn})`)
  ok.forEach((m) => console.log('  OK:', m))
  if (errors.length) {
    errors.forEach((m) => console.error('  FAIL:', m))
    process.exit(1)
  }
  console.log('  → Phase siap Human QA (commit lokal + update PRD harus sudah tercatat di laporan)')
}

main()

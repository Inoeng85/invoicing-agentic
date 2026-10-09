#!/usr/bin/env node
/**
 * Validasi kelengkapan Agent Development untuk satu task.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { phaseDirName, readPlanDevelopmentStatus, readTaskArtifacts, taskReportPath } from './task-progress.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

function parseArgs(argv) {
  const out = { taskId: null, epic: null, phase: 1, featureId: null }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--task' && argv[i + 1]) out.taskId = argv[++i]
    else if (argv[i] === '--epic' && argv[i + 1]) out.epic = argv[++i]
    else if (argv[i] === '--phase' && argv[i + 1]) out.phase = Number(argv[++i])
    else if (argv[i] === '--feature' && argv[i + 1]) out.featureId = argv[++i]
  }
  return out
}

function inferEpic(taskId) {
  const m = taskId.match(/^(\d{4})/)
  return m ? m[1] : null
}

function extractFeatureIdFromPlan(planPath) {
  if (!fs.existsSync(planPath)) return null
  const text = fs.readFileSync(planPath, 'utf8')
  const m = text.match(/features\/([a-z0-9-]+)\.md/i) || text.match(/Feature ID[^\n|`]*`([a-z0-9-]+)`/i)
  return m ? m[1] : null
}

function main() {
  const opts = parseArgs(process.argv)
  const taskId = opts.taskId
  if (!taskId) {
    console.error('Usage: node validate-development-task.mjs --task <id> [--epic 0702] [--phase 1]')
    process.exit(1)
  }
  const epic = opts.epic || inferEpic(taskId)
  const phaseNn = phaseDirName(opts.phase)
  const planPath = path.join(ROOT, 'docs/workflow/plans', epic, phaseNn, 'tasks', taskId, 'plan.md')
  const featureId = opts.featureId || extractFeatureIdFromPlan(planPath)
  const featurePath = featureId
    ? path.join(ROOT, 'docs/workflow/features', `${featureId}.md`)
    : null
  const reportPath = taskReportPath(ROOT, epic, opts.phase, 'development', taskId)

  const errors = []
  const ok = []

  if (!fs.existsSync(planPath)) errors.push(`Plan hilang: ${planPath}`)
  else ok.push('plan.md ada')

  if (!featureId) errors.push('Feature ID tidak ditemukan di plan — Agent Plan wajib link ke docs/workflow/features/')
  else if (!featurePath || !fs.existsSync(featurePath)) {
    errors.push(`Feature doc hilang: docs/workflow/features/${featureId}.md`)
  } else ok.push('feature doc ada')

  const artifacts = readTaskArtifacts(ROOT, epic, opts.phase, taskId)
  if (!artifacts.planComplete) errors.push('Plan belum lengkap (plan.md + minimal 1 skills/*.md)')
  else ok.push('plan + skills')

  if (!fs.existsSync(reportPath)) errors.push(`Laporan development hilang: ${reportPath}`)
  else ok.push('laporan development')

  const devStatus = readPlanDevelopmentStatus(ROOT, epic, opts.phase, taskId)
  if (devStatus !== 'complete') errors.push('Section Development di plan.md belum status `complete`')
  else ok.push('plan.md Development complete')

  console.log(`Validasi ${taskId} (PRD-${epic} ${phaseNn})`)
  ok.forEach((m) => console.log('  OK:', m))
  if (errors.length) {
    errors.forEach((m) => console.error('  FAIL:', m))
    process.exit(1)
  }
  console.log('  → Siap handoff Agent QA')
}

main()

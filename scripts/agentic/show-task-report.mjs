#!/usr/bin/env node
/** Tampilkan laporan plan/dev/qa di terminal — tanpa menjalankan validate-qa. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { phaseDirName, taskArtifactPaths } from './task-progress.mjs'
import { workspaceRelative } from './path-resolver.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

function parseArgs(argv) {
  const out = { taskId: null, epic: null, phase: null, type: 'development' }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--task' && argv[i + 1]) out.taskId = argv[++i]
    else if (argv[i] === '--epic' && argv[i + 1]) out.epic = argv[++i]
    else if (argv[i] === '--phase' && argv[i + 1]) out.phase = Number(argv[++i])
    else if (argv[i] === '--type' && argv[i + 1]) out.type = argv[++i]
  }
  return out
}

function resolvePhaseOrdinal(root, taskId, epic, explicit) {
  if (explicit != null && !Number.isNaN(explicit)) return explicit
  const qPath = path.join(root, 'docs/workflow/plans/intake-queue.json')
  if (fs.existsSync(qPath)) {
    const q = JSON.parse(fs.readFileSync(qPath, 'utf8'))
    for (const ph of q.phases || []) {
      if ((ph.taskIds || []).includes(taskId)) return ph.ordinal
    }
  }
  return 1
}

function main() {
  const opts = parseArgs(process.argv)
  if (!opts.taskId) {
    console.error('Usage: show-task-report.mjs --task <id> [--type development|qa|plan] [--epic] [--phase]')
    process.exit(1)
  }
  const epic = opts.epic || opts.taskId.slice(0, 4)
  const phaseOrd = resolvePhaseOrdinal(ROOT, opts.taskId, epic, opts.phase)
  const paths = taskArtifactPaths(ROOT, epic, phaseOrd, opts.taskId)
  const map = { development: paths.development, qa: paths.qa, plan: paths.plan }
  const rel = map[opts.type] || map.development
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) {
    console.error('File tidak ada (Agentic root):', rel)
    console.error('Buka di Cursor workspace AIEngineer:', workspaceRelative(rel))
    console.error('Development ≠ QA — validate-dev vs validate-qa')
    process.exit(1)
  }
  console.error('# Path workspace:', workspaceRelative(rel))
  console.log(fs.readFileSync(abs, 'utf8'))
}

main()

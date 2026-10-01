#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { taskArtifactPaths } from './task-progress.mjs'
import { workspaceRelative } from './path-resolver.mjs'
import fs from 'node:fs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

function parseArgs(argv) {
  const out = { taskId: null, epic: null, phase: null }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--task' && argv[i + 1]) out.taskId = argv[++i]
    else if (argv[i] === '--epic' && argv[i + 1]) out.epic = argv[++i]
    else if (argv[i] === '--phase' && argv[i + 1]) out.phase = Number(argv[++i])
  }
  return out
}

function resolvePhaseOrdinal(taskId) {
  const qPath = path.join(ROOT, 'Development/Plan/intake-queue.json')
  const q = JSON.parse(fs.readFileSync(qPath, 'utf8'))
  for (const ph of q.phases || []) {
    if ((ph.taskIds || []).includes(taskId)) return ph.ordinal
  }
  return 1
}

function main() {
  const opts = parseArgs(process.argv)
  if (!opts.taskId) {
    console.error('Usage: plan-path.mjs --task <id>')
    process.exit(1)
  }
  const epic = opts.epic || opts.taskId.slice(0, 4)
  const ord = opts.phase != null ? opts.phase : resolvePhaseOrdinal(opts.taskId)
  const rel = taskArtifactPaths(epic, ord, opts.taskId).plan
  const abs = path.join(ROOT, rel)
  console.log('Agentic root:', rel)
  console.log('Workspace (Cursor):', workspaceRelative(rel))
  console.log('Exists:', fs.existsSync(abs))
  if (!fs.existsSync(abs)) process.exit(1)
}

main()

#!/usr/bin/env node
/** Poll rebuild kanban data for live local preview (pair with kanban HTML auto-refresh). */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
const INTERVAL_MS = Number(process.env.AGENTIC_KANBAN_INTERVAL_MS || 10000)

function run() {
  spawnSync('npm', ['run', 'agentic:kanban-data'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
  })
}

console.log(`Kanban watch: rebuild every ${INTERVAL_MS}ms (Ctrl+C stop)`)
run()
setInterval(run, INTERVAL_MS)

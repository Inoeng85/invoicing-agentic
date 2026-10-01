#!/usr/bin/env node
/**
 * Daemon lokal: autopilot watch + refresh kanban/monitoring.
 * Development tetap via Cursor Agent — daemon mem-chain task berikutnya setelah artefak selesai.
 *
 *   npm run agentic:daemon
 *   npm run agentic:daemon -- --auto-mechanical
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

function parseArgs(argv) {
  const out = { autoMechanical: false, interval: 20 }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--auto-mechanical') out.autoMechanical = true
    else if (argv[i] === '--interval' && argv[i + 1]) out.interval = Number(argv[++i])
  }
  return out
}

function main() {
  const opts = parseArgs(process.argv)
  const mech = opts.autoMechanical ? '--auto-mechanical' : ''
  console.log('Agentic daemon — autopilot watch + kanban-data refresh')
  console.log('Buka Cursor Agent dengan prompt di Agentic/.agentic/trigger/AGENT_PROMPT.md\n')

  const autopilot = spawn(
    'npm',
    ['run', 'agentic:autopilot:watch', '--', '--interval', String(opts.interval), ...(mech ? [mech] : [])],
    { cwd: ROOT, stdio: 'inherit', shell: true },
  )

  const kanban = spawn('npm', ['run', 'agentic:kanban-watch'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
  })

  function shutdown(code) {
    autopilot.kill('SIGTERM')
    kanban.kill('SIGTERM')
    process.exit(code ?? 0)
  }

  process.on('SIGINT', () => shutdown(0))
  process.on('SIGTERM', () => shutdown(0))
  autopilot.on('exit', (c) => {
    console.error('autopilot watch exited', c)
    shutdown(c ?? 1)
  })
  kanban.on('exit', (c) => {
    console.error('kanban watch exited', c)
    shutdown(c ?? 1)
  })
}

main()

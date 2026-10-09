#!/usr/bin/env node
/**
 * Autopilot: selalu ambil task belum selesai terkecil (urutan epic → phase → taskIds).
 * Saat satu task Development selesai (plan.md + validate-dev), trigger task berikutnya.
 *
 *   npm run agentic:autopilot              # status + assign sekali
 *   npm run agentic:autopilot -- once        # assign jika belum ada sesi aktif
 *   npm run agentic:autopilot -- watch      # poll & chain otomatis
 *   npm run agentic:autopilot -- complete --task <id>  # setelah agent selesai
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  appendAutopilotEvent,
  chainNextWork,
  findSmallestUndoneWork,
  isWorkComplete,
  loadAutopilotState,
  saveAutopilotState,
  workItemPrompt,
  writeAutopilotArtifacts,
} from './task-autopilot.mjs'
import { loadQueue } from './intake-pipeline.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

function parseArgs(argv) {
  const out = {
    cmd: 'status',
    interval: 20,
    taskId: null,
    json: false,
    autoMechanical: false,
  }
  const rest = argv.slice(2)
  if (rest[0] && !rest[0].startsWith('--')) out.cmd = rest.shift()
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--interval' && rest[i + 1]) out.interval = Number(rest[++i])
    else if (rest[i] === '--task' && rest[i + 1]) out.taskId = rest[++i]
    else if (rest[i] === '--json') out.json = true
    else if (rest[i] === '--auto-mechanical') out.autoMechanical = true
  }
  return out
}

function cmdStatus(opts) {
  const queue = loadQueue(ROOT)
  const next = findSmallestUndoneWork(ROOT, queue)
  const state = loadAutopilotState(ROOT)
  const body = {
    state,
    next,
    prompt: workItemPrompt(next),
    terminal: {
      once: 'npm run agentic:autopilot -- once',
      watch: 'npm run agentic:autopilot -- watch',
      complete: 'npm run agentic:autopilot -- complete --task <id>',
    },
  }
  if (opts.json) console.log(JSON.stringify(body, null, 2))
  else {
    console.log('Autopilot state:', state?.active ? `${state.kind} · ${state.taskId || state.phaseId}` : 'tidak aktif')
    console.log('Berikutnya (terkecil belum done):', next.kind, next.taskId || next.phaseId || '', next.message || '')
    if (body.prompt) {
      console.log('\n--- Prompt agent ---\n')
      console.log(body.prompt)
    }
    console.log('\nPrompt file: .agentic/trigger/AGENT_PROMPT.md')
  }
}

function cmdOnce(opts) {
  const state = loadAutopilotState(ROOT)
  if (state?.active) {
    const work = {
      kind: state.kind,
      taskId: state.taskId,
      phaseId: state.phaseId,
      epic: state.epic,
      ordinal: state.ordinal,
    }
    if (!isWorkComplete(ROOT, work)) {
      const msg = { ok: true, reused: true, state, prompt: workItemPrompt(state) }
      if (opts.json) console.log(JSON.stringify(msg, null, 2))
      else console.log('Sesi masih aktif — gunakan prompt yang ada di .agentic/trigger/AGENT_PROMPT.md')
      return
    }
    appendAutopilotEvent(ROOT, { event: 'stale_active_complete', taskId: state.taskId })
  }
  const result = chainNextWork(ROOT, 'once', { autoMechanical: opts.autoMechanical })
  if (!opts.json && result.needsAgent) {
    console.log('\n⚠ docs/development/Plan: autopilot hanya menyiapkan prompt — jalankan Agent Cursor (lihat AGENT_PROMPT.md).')
    console.log('   Untuk chain otomatis setelah selesai: npm run agentic:autopilot:watch')
  }
  if (opts.json) console.log(JSON.stringify(result, null, 2))
  else {
    if (!result.assigned) console.log('Tidak ada pekerjaan:', result.next.kind, result.next.message || '')
    else {
      console.log('Assigned:', result.next.kind, result.next.taskId || result.next.phaseId)
      console.log('\n' + result.prompt)
    }
  }
}

function cmdComplete(opts) {
  const state = loadAutopilotState(ROOT)
  if (opts.taskId && state?.taskId && state.taskId !== opts.taskId) {
    console.warn(`Perhatian: state aktif ${state.taskId}, complete untuk ${opts.taskId}`)
  }
  appendAutopilotEvent(ROOT, { event: 'manual_complete', taskId: opts.taskId || state?.taskId })
  const result = chainNextWork(ROOT, 'manual_complete', { autoMechanical: opts.autoMechanical })
  if (opts.json) console.log(JSON.stringify(result, null, 2))
  else {
    console.log('Chain →', result.next.kind, result.next.taskId || result.next.phaseId || result.next.message || '')
    if (result.prompt) console.log('\n' + result.prompt)
  }
}

async function cmdWatch(opts) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  console.log(
    `Autopilot watch (interval ${opts.interval}s) — Ctrl+C stop` +
      (opts.autoMechanical ? ' · auto-mechanical=intake' : ''),
  )
  console.log(
    'Catatan: Plan/Development/QA membutuhkan Agent Cursor — watch mem-chain prompt saat plan.md/validate-dev selesai.',
  )
  cmdOnce({ json: false, autoMechanical: opts.autoMechanical })

  for (;;) {
    const state = loadAutopilotState(ROOT)
    if (state?.active) {
      const work = {
        kind: state.kind,
        taskId: state.taskId,
        phaseId: state.phaseId,
        epic: state.epic,
        ordinal: state.ordinal,
        action: state.kind === 'intake' ? 'run_intake' : undefined,
      }
      if (isWorkComplete(ROOT, work)) {
        console.log(`[${new Date().toISOString()}] Selesai: ${state.kind} ${state.taskId || state.phaseId}`)
        appendAutopilotEvent(ROOT, {
          event: 'auto_complete',
          kind: state.kind,
          taskId: state.taskId,
          phaseId: state.phaseId,
        })
        const result = chainNextWork(ROOT, 'auto_complete', { autoMechanical: opts.autoMechanical })
        if (result.assigned) {
          console.log('Trigger berikutnya:', result.next.kind, result.next.taskId || result.next.phaseId)
          console.log('Prompt → .agentic/trigger/AGENT_PROMPT.md')
        } else {
          console.log('Idle:', result.next.kind, result.next.message || '')
          saveAutopilotState(ROOT, { active: false, idleAt: new Date().toISOString() })
        }
      }
    } else {
      const queue = loadQueue(ROOT)
      const next = findSmallestUndoneWork(ROOT, queue)
      if (next.kind === 'idle' || next.kind === 'gate') {
        writeAutopilotArtifacts(ROOT, next, { active: false })
      } else {
        chainNextWork(ROOT, 'watch_assign', { autoMechanical: opts.autoMechanical })
        console.log(`[${new Date().toISOString()}] Assign: ${next.kind} ${next.taskId || next.phaseId}`)
      }
    }
    await sleep(opts.interval * 1000)
  }
}

function main() {
  const opts = parseArgs(process.argv)
  switch (opts.cmd) {
    case 'status':
      cmdStatus(opts)
      break
    case 'once':
      cmdOnce(opts)
      break
    case 'complete':
      cmdComplete(opts)
      break
    case 'watch':
      cmdWatch(opts).catch((e) => {
        console.error(e)
        process.exit(1)
      })
      break
    default:
      console.error('Perintah: status | once | watch | complete')
      process.exit(1)
  }
}

main()

#!/usr/bin/env node
/**
 * Orkestrasi Intake: task plan berurutan per phase, auto lanjut phase berikutnya saat gate OK.
 *
 *   npm run agentic:intake-run -- status
 *   npm run agentic:intake-run -- next
 *   npm run agentic:intake-run -- tick-intake [--phase-id]
 *   npm run agentic:intake-run -- tick --task <id> [--phase-id]
 *   npm run agentic:intake-run -- loop [--interval 15]
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  applyIntakeQueueStep,
  applyPlanTaskTick,
  assessTaskPlan,
  buildNextAction,
  buildOrchestratorNext,
  completePhasePlan,
  findActivePhase,
  loadQueue,
  priorPhaseReleased,
  saveQueue,
  writePlanManifest,
} from './intake-pipeline.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

function parseArgs(argv) {
  const cmd = argv[2] || 'status'
  const out = { cmd, phaseId: null, taskId: null, interval: 15, json: false }
  for (let i = 3; i < argv.length; i++) {
    if (argv[i] === '--phase-id' && argv[i + 1]) out.phaseId = argv[++i]
    else if (argv[i] === '--task' && argv[i + 1]) out.taskId = argv[++i]
    else if (argv[i] === '--interval' && argv[i + 1]) out.interval = Number(argv[++i])
    else if (argv[i] === '--json') out.json = true
  }
  return out
}

function getPhase(queue, phaseId) {
  if (phaseId) return (queue.phases || []).find((p) => p.phaseId === phaseId)
  return findActivePhase(queue).phase
}

function print(obj, asJson) {
  if (asJson) console.log(JSON.stringify(obj, null, 2))
  else console.log(typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2))
}

function cmdStatus(opts) {
  const queue = loadQueue(ROOT)
  const active = findActivePhase(queue)
  const next = buildNextAction(ROOT, queue)
  print(
    {
      activePhase: active.phase
        ? {
            phaseId: active.phase.phaseId,
            planStatus: active.phase.planStatus,
            intakeSubStep: active.phase.intakeSubStep,
            currentTaskId: active.phase.currentTaskId,
            planTaskDone: active.phase.planTaskDone,
            taskCount: active.phase.taskCount,
          }
        : null,
      activeReason: active.reason,
      next,
    },
    opts.json,
  )
}

function cmdNext(opts) {
  const queue = loadQueue(ROOT)
  const next = buildOrchestratorNext(ROOT, queue)
  saveQueue(ROOT, queue)
  print(next, opts.json)
  if (next.action === 'run_plan_task' || next.action === 'run_intake') process.exit(0)
  if (next.action === 'wait_prior_release' || next.action === 'human_clarify') process.exit(2)
  process.exit(0)
}

function cmdTickIntake(opts) {
  const queue = loadQueue(ROOT)
  const phase = getPhase(queue, opts.phaseId)
  if (!phase) {
    console.error('Tidak ada phase aktif')
    process.exit(1)
  }
  const result = applyIntakeQueueStep(ROOT, queue, phase)
  saveQueue(ROOT, queue)
  if (opts.json) print(result, true)
  else {
    if (!result.ok) console.error(result.error)
    else console.log(`Intake selesai ${phase.phaseId} → sub-step plan · task berikutnya: ${result.nextTask?.taskId || '—'}`)
  }
  process.exit(result.ok ? 0 : 1)
}

function cmdTick(opts) {
  const queue = loadQueue(ROOT)
  let phase = getPhase(queue, opts.phaseId)
  if (!phase) {
    console.error('Tidak ada phase aktif')
    process.exit(1)
  }
  let taskId = opts.taskId || phase.currentTaskId
  if (!taskId) {
    console.error('Tidak ada --task; jalankan next dulu')
    process.exit(1)
  }
  if (!(phase.taskIds || []).includes(taskId)) {
    console.error('Task tidak termasuk phase', phase.phaseId)
    process.exit(1)
  }

  const idx = (phase.taskIds || []).indexOf(taskId)
  for (let i = 0; i < idx; i++) {
    const prior = phase.taskIds[i]
    const a = assessTaskPlan(ROOT, phase.epic, phase.ordinal, prior)
    if (!a.complete) {
      console.error(`Urutan: selesaikan dulu ${prior} (task ${i + 1}/${phase.taskIds.length})`)
      process.exit(1)
    }
  }

  const result = applyPlanTaskTick(ROOT, queue, phase, taskId)
  saveQueue(ROOT, queue)

  if (opts.json) print(result, true)
  else {
    if (!result.ok && result.error !== 'needs_human_clarify') console.error(result.error)
    if (result.phaseComplete) {
      console.log(`Phase ${phase.phaseId} plan_complete → Development`)
      if (result.triggered) console.log('Trigger:', result.triggered.message || result.triggered.action)
    } else if (result.ok && result.nextTask) {
      console.log(`Task ${taskId} OK · lanjut ${result.nextTask.taskId}`)
    } else if (result.ok) {
      console.log(`Task ${taskId} OK`)
    }
  }

  if (result.error === 'needs_human_clarify') process.exit(2)
  process.exit(result.ok ? 0 : 1)
}

function cmdSyncGates(opts) {
  const queue = loadQueue(ROOT)
  let changed = 0
  for (const p of queue.phases || []) {
    const can = priorPhaseReleased(queue, p)
    if (p.ordinal > 1 && !can && p.planStatus !== 'plan_complete') {
      if (p.planStatus !== 'blocked') changed++
      p.planStatus = 'blocked'
    } else if (p.intakeComplete && p.planStatus === 'blocked' && can && p.planStatus !== 'plan_complete') {
      p.planStatus = 'ready_for_plan'
      changed++
    }
  }
  saveQueue(ROOT, queue)
  print({ changed, message: 'Gate phase diselaraskan dengan released' }, opts.json)
}

async function cmdTickPhase(opts) {
  const queue = loadQueue(ROOT)
  const phase = getPhase(queue, opts.phaseId)
  if (!phase) process.exit(1)
  const manifest = writePlanManifest(ROOT, phase)
  if (!manifest.allDefined) {
    console.error('Belum allDefined')
    process.exit(1)
  }
  const result = completePhasePlan(ROOT, queue, phase, manifest)
  saveQueue(ROOT, queue)
  print(result, opts.json)
  process.exit(0)
}

async function cmdLoop(opts) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  for (;;) {
    const queue = loadQueue(ROOT)
    const next = buildNextAction(ROOT, queue)
    saveQueue(ROOT, queue)
    console.log(`[${new Date().toISOString()}]`, next.action, next.phaseId || '', next.taskId || '')
    if (next.action === 'run_intake') {
      const phase = getPhase(queue, next.phaseId)
      applyIntakeQueueStep(ROOT, queue, phase)
      saveQueue(ROOT, queue)
    } else if (next.action === 'finalize_plan') {
      await cmdTickPhase({ ...opts, phaseId: next.phaseId })
    } else if (next.action === 'idle' || next.action === 'wait_prior_release') {
      process.exit(0)
    }
    await sleep(opts.interval * 1000)
  }
}

async function main() {
  const opts = parseArgs(process.argv)
  switch (opts.cmd) {
    case 'status':
      cmdStatus(opts)
      break
    case 'next':
      cmdNext(opts)
      break
    case 'tick-intake':
      cmdTickIntake(opts)
      break
    case 'tick':
      await cmdTick(opts)
      break
    case 'tick-phase':
      await cmdTickPhase(opts)
      break
    case 'loop':
      await cmdLoop(opts)
      break
    case 'sync-gates':
      cmdSyncGates(opts)
      break
    default:
      console.error(`Perintah: status | next | tick-intake | tick | tick-phase | sync-gates | loop`)
      process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

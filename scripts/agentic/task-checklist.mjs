import fs from 'node:fs'
import path from 'node:path'
import { assessTaskPlan, loadQueue, priorPhaseReleased } from './intake-pipeline.mjs'
import {
  inferTaskColumn,
  readTaskArtifacts,
  readTaskAuditOutcome,
  taskArtifactPaths,
  taskPlanBase,
} from './task-progress.mjs'
import { findSmallestUndoneWork, loadAutopilotState, sortedPhases } from './task-autopilot.mjs'

/**
 * @typedef {'done'|'running'|'assigned'|'ready'|'waiting'|'blocked'} RunState
 */

/**
 * @param {string} root
 * @param {object} [opts]
 * @param {object} [opts.queue]
 * @param {object[]} [opts.catalogTasks]
 */
function readSectionStatusStrict(root, epic, ordinal, taskId, section, tokens) {
  const planPath = path.join(taskPlanBase(root, epic, ordinal, taskId), 'plan.md')
  if (!fs.existsSync(planPath)) return section === 'Plan' ? 'missing' : 'pending'
  const text = fs.readFileSync(planPath, 'utf8')
  const sec = text.match(new RegExp(`## ${section}\\s+([\\s\\S]*?)(?=\\n## |$)`, 'i'))
  const body = sec ? sec[1] : ''
  for (const tok of tokens) {
    if (new RegExp(`Status\\s*\\|\\s*\`${tok}\``, 'i').test(body)) return tok
    if (new RegExp(`\\|\\s*Status\\s*\\|\\s*\`${tok}\``, 'i').test(body)) return tok
  }
  return 'pending'
}

export function buildTaskChecklist(root, opts = {}) {
  const queue = opts.queue || loadQueue(root)
  const catalogPath = path.join(root, '.agentic/catalog/tasks.json')
  const catalogTasks = opts.catalogTasks || JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
  const autopilot = loadAutopilotState(root)
  const nextWork = findSmallestUndoneWork(root, queue)

  /** @type {Map<string, object>} */
  const taskToPhase = new Map()
  for (const ph of queue.phases || []) {
    for (const tid of ph.taskIds || []) {
      taskToPhase.set(tid, ph)
    }
  }

  /** @type {object[]} */
  const items = []
  let seq = 0

  for (const ph of sortedPhases(queue)) {
    for (const taskId of ph.taskIds || []) {
      seq += 1
      items.push(
        buildOneTask(root, {
          seq,
          taskId,
          phase: ph,
          queue,
          autopilot,
          nextWork,
          catalogById: new Map(catalogTasks.map((t) => [t.id, t])),
        }),
      )
    }
  }

  const catalogIds = new Set(catalogTasks.map((t) => t.id))
  for (const t of catalogTasks) {
    if (taskToPhase.has(t.id)) continue
    seq += 1
    items.push({
      seq,
      taskId: t.id,
      title: t.title,
      epic: t.epic,
      phaseId: null,
      runState: 'blocked',
      stage: 'unassigned',
      column: 'intake',
      blockers: ['Task tidak ada di intake-queue.json — jalankan npm run agentic:intake-queue'],
      notes: [],
      planStatus: 'missing',
      developmentStatus: 'pending',
      qaStatus: 'pending',
    })
  }

  items.sort((a, b) => a.seq - b.seq)

  const summary = summarize(items, nextWork, autopilot)
  return { version: 1, generatedAt: new Date().toISOString(), summary, nextWork, autopilot, items }
}

function buildOneTask(root, ctx) {
  const { taskId, phase: ph, queue, autopilot, nextWork, catalogById } = ctx
  const cat = catalogById.get(taskId)
  const epic = ph.epic
  const ordinal = ph.ordinal
  const planA = assessTaskPlan(root, epic, ordinal, taskId)
  const devSt = readSectionStatusStrict(root, epic, ordinal, taskId, 'Development', [
    'complete',
    'in_progress',
  ])
  const qaSt = readSectionStatusStrict(root, epic, ordinal, taskId, 'QA', [
    'pass',
    'fail',
    'needs_clarify',
    'in_progress',
  ])
  const arts = readTaskArtifacts(root, epic, ordinal, taskId)
  const priorOk = priorPhaseReleased(queue, ph)
  const intakeDone = ph.intakeComplete || ph.intakeStatus === 'intake_complete'

  const blockers = []
  const notes = []

  if (ph.released) {
    notes.push('Phase released (Human QA)')
  }
  if (!priorOk) {
    blockers.push(`Gate phase: menunggu release Human QA ${ph.epic}-P${ph.ordinal - 1}`)
  }
  if (!intakeDone) {
    blockers.push(`Intake phase ${ph.phaseId} belum selesai (${ph.intakeStatus || 'queued'})`)
  }

  const waitReasons = []

  const priorPlanBlock = firstPriorInPhase(ph, taskId, (id) => {
    const a = assessTaskPlan(root, epic, ordinal, id)
    return !a.complete
  })
  if (priorPlanBlock && !planA.complete) {
    waitReasons.push(`Plan berurutan: task ${priorPlanBlock} belum plan defined`)
  }

  const priorDevBlock = firstPriorInPhase(ph, taskId, (id) => {
    return (
      readSectionStatusStrict(root, epic, ordinal, id, 'Development', ['complete', 'in_progress']) !==
      'complete'
    )
  })
  if (priorDevBlock && planA.complete && devSt !== 'complete') {
    waitReasons.push(`Development berurutan: menunggu ${priorDevBlock} selesai`)
  }

  if (planA.needsClarify) blockers.push('Plan needs_human_clarify')
  if (!planA.complete && planA.status === 'missing') blockers.push('plan.md belum ada')
  else if (!planA.complete && planA.status === 'draft') blockers.push('Plan masih draft (belum defined + skills)')
  else if (!planA.complete) blockers.push(`Plan status: ${planA.status}`)

  if (qaSt === 'needs_clarify') blockers.push('QA needs_clarify')
  if (qaSt === 'fail') blockers.push('QA fail — perlu perbaikan')

  const column = inferTaskColumn(arts, {
    phaseReleased: ph.released,
    phaseBlocked: !priorOk,
    qaStatus: qaSt,
    taskAuditStatus: readTaskAuditOutcome(root, epic, ordinal, taskId),
    phaseRow: ph,
  })

  let stage = columnToStage(column, planA, devSt, qaSt)
  if (!intakeDone) stage = 'intake'
  else if (!planA.complete) stage = 'plan'
  else if (devSt !== 'complete') stage = 'development'
  else if (qaSt !== 'pass') stage = 'qa'

  const isNext =
    nextWork &&
    !['idle', 'gate'].includes(nextWork.kind) &&
    ((nextWork.taskId && nextWork.taskId === taskId) ||
      (nextWork.kind === 'intake' && nextWork.phaseId === ph.phaseId && !intakeDone))

  const autopilotOn =
    autopilot?.active &&
    ((autopilot.taskId && autopilot.taskId === taskId) ||
      (autopilot.kind === 'intake' && autopilot.phaseId === ph.phaseId && !autopilot.taskId))

  /** @type {RunState} */
  let runState = 'waiting'

  if (qaSt === 'pass' || (ph.released && column === 'done')) {
    runState = 'done'
  } else if (devSt === 'in_progress' || qaSt === 'in_progress') {
    runState = 'running'
  } else if (autopilotOn) {
    runState = 'assigned'
    notes.push('Autopilot: prompt siap — jalankan Agent Cursor (bukan proses background otomatis)')
  } else if (blockers.length > 0) {
    runState = 'blocked'
  } else if (isNext) {
    runState = 'ready'
  } else if (waitReasons.length > 0) {
    runState = 'waiting'
    notes.push(...waitReasons)
  } else if (devSt === 'complete' && qaSt === 'pending' && !arts.qa) {
    runState = 'waiting'
    notes.push('Dev selesai — menunggu giliran QA')
  } else {
    runState = 'waiting'
    notes.push('Belum giliran (antrian orkestrasi)')
  }

  if (runState !== 'done' && !priorOk) {
    runState = 'blocked'
  }
  if (runState !== 'done' && !intakeDone && blockers.length === 0) {
    runState = 'blocked'
    blockers.push(`Intake phase ${ph.phaseId} belum selesai`)
  }

  return {
    seq: ctx.seq,
    taskId,
    title: cat?.title || taskId,
    epic,
    area: cat?.area,
    phaseId: ph.phaseId,
    phaseTitle: ph.title,
    phaseOrdinal: ordinal,
    runState,
    stage,
    column,
    planStatus: planA.complete ? 'defined' : planA.status,
    developmentStatus: devSt,
    qaStatus: qaSt,
    progressPercent: arts.planComplete ? (devSt === 'complete' ? (qaSt === 'pass' ? 100 : 75) : 50) : 25,
    blockers: [...new Set(blockers)],
    waitReasons,
    notes,
    isNext,
    autopilotActive: !!autopilotOn,
    paths: taskArtifactPaths(epic, ordinal, taskId),
  }
}

function firstPriorInPhase(ph, taskId, pred) {
  for (const id of ph.taskIds || []) {
    if (id === taskId) break
    if (pred(id)) return id
  }
  return null
}

function columnToStage(column, planA, devSt, qaSt) {
  if (column === 'done') return 'done'
  if (column === 'human-qa') return 'human-qa'
  if (column === 'human-clarify') return 'human-clarify'
  if (column === 'audit') return 'audit'
  if (column === 'test' || qaSt !== 'pass') return 'qa'
  if (column === 'development' || devSt !== 'complete') return 'development'
  if (column === 'plan' || !planA.complete) return 'plan'
  if (column === 'intake') return 'intake'
  return column
}

function summarize(items, nextWork, autopilot) {
  const byState = { done: 0, running: 0, assigned: 0, ready: 0, waiting: 0, blocked: 0 }
  for (const it of items) {
    if (byState[it.runState] != null) byState[it.runState] += 1
  }
  return {
    total: items.length,
    ...byState,
    nextTaskId: nextWork?.taskId || null,
    nextKind: nextWork?.kind || null,
    nextPhaseId: nextWork?.phaseId || null,
    autopilotActive: !!autopilot?.active,
    autopilotTaskId: autopilot?.taskId || null,
  }
}

export function checklistToMarkdown(data) {
  const lines = [
    '# Checklist task — Agentic',
    '',
    `Generated: ${data.generatedAt}`,
    '',
    '## Ringkasan',
    '',
    '| Metrik | Nilai |',
    '|--------|-------|',
    `| Total | ${data.summary.total} |`,
    `| Done | ${data.summary.done} |`,
    `| Running | ${data.summary.running} |`,
    `| Assigned (prompt) | ${data.summary.assigned || 0} |`,
    `| Ready (giliran) | ${data.summary.ready} |`,
    `| Waiting | ${data.summary.waiting} |`,
    `| Blocked | ${data.summary.blocked} |`,
    '',
    `**Berikutnya:** ${data.summary.nextKind || '—'} ${data.summary.nextTaskId || data.summary.nextPhaseId || ''}`,
    '',
    '## Legenda',
    '',
    '- **assigned** — autopilot menugaskan task; prompt di `.agentic/trigger/AGENT_PROMPT.md` (Agent Cursor belum jalan)',
    '- **running** — `in_progress` di plan (agent benar-benar mengerjakan)',
    '- **ready** — giliran task terkecil belum selesai, tidak terblokir',
    '- **waiting** — belum giliran (antrian dalam phase)',
    '- **blocked** — ada gate/blocker',
    '- **done** — QA pass / selesai',
    '',
  ]

  let lastPhase = null
  for (const it of data.items) {
    const phaseKey = it.phaseId || 'unassigned'
    if (phaseKey !== lastPhase) {
      lastPhase = phaseKey
      lines.push(
        it.phaseId
          ? `## Phase ${it.phaseId} — ${it.phaseTitle || ''}`
          : '## Task di luar intake-queue',
        '',
      )
      lines.push('| # | Task | Run | Stage | Plan | Dev | QA | Blocker / catatan |')
      lines.push('|---|------|-----|-------|------|-----|-----|-------------------|')
    }
    const flags = []
    if (it.isNext) flags.push('NEXT')
    if (it.autopilotActive) flags.push('AUTOPILOT')
    const blockParts = [...it.blockers, ...(it.waitReasons || []), ...it.notes]
    const block = blockParts.length ? blockParts.join('; ') : '—'
    lines.push(
      `| ${it.seq} | \`${it.taskId}\` | **${it.runState}**${flags.length ? ' `' + flags.join('` `') + '`' : ''} | ${it.stage} | ${it.planStatus} | ${it.developmentStatus} | ${it.qaStatus} | ${block.replace(/\|/g, '\\|')} |`,
    )
  }
  lines.push('')
  return lines.join('\n')
}

export function writeTaskChecklistArtifacts(root, data) {
  const jsonRel = 'docs/PRD/0800-orkestrasi-stage/data/task-checklist.json'
  const mdRel = 'Development/Plan/TASK_CHECKLIST.md'
  const mdMirror = 'docs/PRD/0800-orkestrasi-stage/TASK_CHECKLIST.md'
  fs.writeFileSync(path.join(root, jsonRel), JSON.stringify(data, null, 2) + '\n')
  const md = checklistToMarkdown(data)
  fs.writeFileSync(path.join(root, mdRel), md)
  fs.writeFileSync(path.join(root, mdMirror), md)
  return { jsonRel, mdRel, mdMirror }
}

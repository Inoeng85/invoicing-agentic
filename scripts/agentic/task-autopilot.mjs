import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  assessTaskPlan,
  applyIntakeQueueStep,
  buildAgentPrompt,
  loadQueue,
  nextDevelopmentTask,
  priorPhaseReleased,
  saveQueue,
} from './intake-pipeline.mjs'
import {
  phaseDirName,
  readPlanDevelopmentStatusStrict,
  readPlanQaStatus,
  readTaskArtifacts,
} from './task-progress.mjs'
import { workspaceRelative } from './path-resolver.mjs'

export const TRIGGER_DIR_REL = '.agentic/trigger'
export const STATE_FILE = 'autopilot-state.json'
export const PROMPT_FILE = 'AGENT_PROMPT.md'
export const EVENTS_LOG = 'autopilot-events.jsonl'
export const STATUS_JSON_REL = 'docs/PRD/0800-orkestrasi-stage/data/autopilot.json'

export function sortedPhases(queue) {
  return [...(queue.phases || [])].sort(
    (a, b) => a.epic.localeCompare(b.epic) || a.ordinal - b.ordinal,
  )
}

/** Urutan kanonik: epic → phase → taskIds (task “paling kecil” = pertama yang belum selesai). */
export function findSmallestUndoneWork(root, queue) {
  for (const ph of sortedPhases(queue)) {
    if (ph.released) continue
    if (ph.ordinal > 1 && !priorPhaseReleased(queue, ph)) {
      return {
        kind: 'gate',
        phaseId: ph.phaseId,
        waitFor: `${ph.epic}-P${ph.ordinal - 1}`,
        message: `Menunggu Human QA release phase ${ph.epic}-P${ph.ordinal - 1}`,
      }
    }

    const intakeDone = ph.intakeComplete || ph.intakeStatus === 'intake_complete'
    if (!intakeDone) {
      return {
        kind: 'intake',
        action: 'run_intake',
        phaseId: ph.phaseId,
        epic: ph.epic,
        ordinal: ph.ordinal,
        taskIds: ph.taskIds,
        skill: 'agentic/skill/intake/SKILL.md',
      }
    }

    for (const taskId of ph.taskIds || []) {
      const planA = assessTaskPlan(root, ph.epic, ph.ordinal, taskId)
      const dev = readPlanDevelopmentStatusStrict(root, ph.epic, ph.ordinal, taskId)
      const qa = readPlanQaStatus(root, ph.epic, ph.ordinal, taskId)
      const arts = readTaskArtifacts(root, ph.epic, ph.ordinal, taskId)

      if (qa === 'pass') continue

      if (!planA.complete) {
        const idx = (ph.taskIds || []).indexOf(taskId)
        return {
          kind: 'plan',
          action: 'run_plan_task',
          phaseId: ph.phaseId,
          epic: ph.epic,
          ordinal: ph.ordinal,
          taskId,
          taskIndex: idx + 1,
          taskTotal: (ph.taskIds || []).length,
          planPath: `Development/Plan/${ph.epic}/${phaseDirName(ph.ordinal)}/tasks/${taskId}/plan.md`,
          skill: 'agentic/skill/plan/SKILL.md',
        }
      }

      if (dev !== 'complete') {
        const nextDev = nextDevelopmentTask(root, queue)
        if (nextDev) return { kind: 'development', ...nextDev }
        return {
          kind: 'development',
          action: 'run_development_task',
          phaseId: ph.phaseId,
          epic: ph.epic,
          ordinal: ph.ordinal,
          taskId,
          planPath: `Development/Plan/${ph.epic}/${phaseDirName(ph.ordinal)}/tasks/${taskId}/plan.md`,
          skill: 'agentic/skill/development/SKILL.md',
        }
      }

      if (qa !== 'pass') {
        return {
          kind: 'qa',
          action: 'run_qa_task',
          phaseId: ph.phaseId,
          epic: ph.epic,
          ordinal: ph.ordinal,
          taskId,
          skill: 'agentic/skill/qa/SKILL.md',
          planPath: `Development/Plan/${ph.epic}/${phaseDirName(ph.ordinal)}/tasks/${taskId}/plan.md`,
          hasDevReport: arts.development,
        }
      }
    }
  }
  return { kind: 'idle', action: 'idle' }
}

export function workItemPrompt(work) {
  if (!work || work.kind === 'idle' || work.kind === 'gate') {
    return work?.message || ''
  }
  if (work.kind === 'qa') {
    return [
      'Agent QA — 1 session = 1 task',
      `Task: ${work.taskId} · phase ${work.phaseId}`,
      `Plan: Agentic/${work.planPath}`,
      'Skill: agentic/skill/qa/SKILL.md',
      `Selesai: npm run agentic:validate-qa -- --task ${work.taskId} --epic ${work.epic} --phase ${work.ordinal}`,
    ].join('\n')
  }
  return buildAgentPrompt(work)
}

export function isWorkComplete(root, work) {
  if (!work?.taskId && work?.kind !== 'intake') return false
  const ph = work
  if (work.kind === 'intake') {
    const queue = loadQueue(root)
    const row = (queue.phases || []).find((p) => p.phaseId === work.phaseId)
    return !!(row && (row.intakeComplete || row.intakeStatus === 'intake_complete'))
  }
  if (work.kind === 'plan') {
    return assessTaskPlan(root, work.epic, work.ordinal, work.taskId).complete
  }
  if (work.kind === 'development') {
    return isDevelopmentComplete(root, work.epic, work.ordinal, work.taskId)
  }
  if (work.kind === 'qa') {
    return readPlanQaStatus(root, work.epic, work.ordinal, work.taskId) === 'pass'
  }
  return false
}

export function isDevelopmentComplete(root, epic, ordinal, taskId) {
  const st = readPlanDevelopmentStatusStrict(root, epic, ordinal, taskId)
  if (st !== 'complete') return false
  const r = spawnSync(
    'npm',
    ['run', 'agentic:validate-dev', '--', '--task', taskId, '--epic', epic, '--phase', String(ordinal)],
    { cwd: root, stdio: 'pipe', encoding: 'utf8' },
  )
  return r.status === 0
}

export function writeAutopilotArtifacts(root, work, meta = {}) {
  const triggerDir = path.join(root, TRIGGER_DIR_REL)
  fs.mkdirSync(triggerDir, { recursive: true })
  const prompt = workItemPrompt(work)
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    work,
    prompt,
    ...meta,
  }
  fs.writeFileSync(path.join(triggerDir, PROMPT_FILE), prompt + '\n')
  fs.writeFileSync(
    path.join(triggerDir, 'autopilot-work.json'),
    JSON.stringify(payload, null, 2) + '\n',
  )

  if (work.kind === 'development') {
    fs.writeFileSync(
      path.join(triggerDir, 'development.json'),
      JSON.stringify(
        {
          requestedAt: payload.generatedAt,
          source: 'autopilot',
          action: work.action,
          taskId: work.taskId,
          phaseId: work.phaseId,
          planPath: workspaceRelative(work.planPath),
          featurePath: work.featurePath ? workspaceRelative(work.featurePath) : null,
          skill: work.skill,
          agentPrompt: prompt,
        },
        null,
        2,
      ) + '\n',
    )
  }

  const statusPath = path.join(root, STATUS_JSON_REL)
  fs.mkdirSync(path.dirname(statusPath), { recursive: true })
  fs.writeFileSync(statusPath, JSON.stringify(payload, null, 2) + '\n')
  return payload
}

export function loadAutopilotState(root) {
  const p = path.join(root, TRIGGER_DIR_REL, STATE_FILE)
  if (!fs.existsSync(p)) return null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

export function saveAutopilotState(root, state) {
  const p = path.join(root, TRIGGER_DIR_REL, STATE_FILE)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(state, null, 2) + '\n')
}

export function appendAutopilotEvent(root, event) {
  const p = path.join(root, TRIGGER_DIR_REL, EVENTS_LOG)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.appendFileSync(p, JSON.stringify({ at: new Date().toISOString(), ...event }) + '\n')
}

export function refreshKanban(root) {
  spawnSync('npm', ['run', 'agentic:kanban-data'], { cwd: root, stdio: 'inherit' })
}

/** Selesai satu langkah → assign pekerjaan terkecil berikutnya (biasanya Development). */
/** Langkah tanpa agent (hanya intake tick). Plan/Dev/QA tetap manual di Cursor. */
export function runMechanicalStep(root, work) {
  if (!work?.phaseId) return { ok: false, reason: 'no phase' }
  const queue = loadQueue(root)
  const ph = (queue.phases || []).find((p) => p.phaseId === work.phaseId)
  if (!ph) return { ok: false, reason: 'phase not found' }
  if (work.kind === 'intake' || work.action === 'run_intake') {
    const r = applyIntakeQueueStep(root, queue, ph)
    saveQueue(root, queue)
    appendAutopilotEvent(root, { event: 'mechanical_intake', phaseId: work.phaseId, ok: r.ok !== false })
    refreshKanban(root)
    return r
  }
  return {
    ok: false,
    needsAgent: true,
    reason:
      'Plan/Development/QA tidak bisa dijalankan otomatis dari script — buka Cursor Agent dengan .agentic/trigger/AGENT_PROMPT.md',
  }
}

export function chainNextWork(root, reason = 'complete', opts = {}) {
  const queue = loadQueue(root)
  const next = findSmallestUndoneWork(root, queue)
  appendAutopilotEvent(root, { event: 'chain', reason, nextKind: next.kind, taskId: next.taskId || null })
  if (next.kind === 'idle' || next.kind === 'gate') {
    writeAutopilotArtifacts(root, next, { active: false })
    saveAutopilotState(root, { active: false, idleAt: new Date().toISOString(), last: next })
    return { assigned: false, next }
  }
  const state = {
    active: true,
    kind: next.kind,
    taskId: next.taskId || null,
    phaseId: next.phaseId,
    epic: next.epic,
    ordinal: next.ordinal,
    assignedAt: new Date().toISOString(),
    needsAgent: !['intake'].includes(next.kind),
  }
  writeAutopilotArtifacts(root, next, { active: state })
  saveAutopilotState(root, state)
  let mechanical = null
  if (opts.autoMechanical) {
    mechanical = runMechanicalStep(root, next)
  }
  refreshKanban(root)
  return {
    assigned: true,
    next,
    prompt: workItemPrompt(next),
    mechanical,
    needsAgent: state.needsAgent,
  }
}

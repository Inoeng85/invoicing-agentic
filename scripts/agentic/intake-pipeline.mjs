import fs from 'node:fs'
import path from 'node:path'
import { phaseDirName, readPlanDevelopmentStatus, taskPlanBase } from './task-progress.mjs'

export const QUEUE_PATH_REL = 'Development/Plan/intake-queue.json'
export const KANBAN_MIRROR_REL = 'docs/PRD/0800-orkestrasi-stage/data/intake-queue.json'

export function loadQueue(root) {
  const p = path.join(root, QUEUE_PATH_REL)
  if (!fs.existsSync(p)) throw new Error(`Missing ${QUEUE_PATH_REL} — run npm run agentic:intake-queue`)
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

export function saveQueue(root, queue) {
  queue.generatedAt = new Date().toISOString()
  const payload = JSON.stringify(queue, null, 2) + '\n'
  const out = path.join(root, QUEUE_PATH_REL)
  const mirror = path.join(root, KANBAN_MIRROR_REL)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, payload)
  fs.mkdirSync(path.dirname(mirror), { recursive: true })
  fs.writeFileSync(mirror, payload)
}

function readPlanStatus(planPath) {
  if (!fs.existsSync(planPath)) return 'missing'
  const text = fs.readFileSync(planPath, 'utf8')
  if (/Status plan[^\n]*`needs_human_clarify`/i.test(text)) return 'needs_human_clarify'
  if (/Status plan[^\n]*`defined`/i.test(text)) return 'defined'
  if (/Status plan[^\n]*`draft`/i.test(text)) return 'draft'
  if (text.includes('## Penjelasan') && text.includes('## Tujuan') && text.includes('## Feature')) {
    return 'draft'
  }
  return 'missing'
}

export function assessTaskPlan(root, epic, phaseOrdinal, taskId) {
  const base = taskPlanBase(root, epic, phaseOrdinal, taskId)
  const planPath = path.join(base, 'plan.md')
  const skillsDir = path.join(base, 'skills')
  let skillFiles = []
  if (fs.existsSync(skillsDir)) {
    skillFiles = fs.readdirSync(skillsDir).filter((f) => f.endsWith('.md'))
  }
  const status = readPlanStatus(planPath)
  const complete = status === 'defined' && skillFiles.length > 0
  return { planPath, status, skillCount: skillFiles.length, complete, needsClarify: status === 'needs_human_clarify' }
}

export function writePlanManifest(root, phaseRow) {
  const phaseNn = phaseDirName(phaseRow.ordinal)
  const dir = path.join(root, 'Development/Plan', phaseRow.epic, phaseNn)
  fs.mkdirSync(dir, { recursive: true })
  const tasks = (phaseRow.taskIds || []).map((taskId) => {
    const a = assessTaskPlan(root, phaseRow.epic, phaseRow.ordinal, taskId)
    return {
      taskId,
      planPath: `Development/Plan/${phaseRow.epic}/${phaseNn}/tasks/${taskId}/plan.md`,
      status: a.needsClarify ? 'needs_human_clarify' : a.complete ? 'defined' : a.status === 'missing' ? 'draft' : a.status,
    }
  })
  const allDefined = tasks.length > 0 && tasks.every((t) => t.status === 'defined')
  const manifest = {
    phaseId: phaseRow.phaseId,
    updatedAt: new Date().toISOString(),
    tasks,
    allDefined,
  }
  fs.writeFileSync(path.join(dir, 'plan-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  return manifest
}

export function priorPhaseReleased(queue, phaseRow) {
  if (phaseRow.ordinal <= 1) return true
  const prior = (queue.phases || [])
    .filter((p) => p.epic === phaseRow.epic && p.ordinal === phaseRow.ordinal - 1)
    .sort((a, b) => b.ordinal - a.ordinal)[0]
  return prior ? !!prior.released : false
}

export function canStartPlan(queue, phaseRow) {
  if (phaseRow.released) return false
  if (phaseRow.planStatus === 'plan_complete') return false
  if (phaseRow.planStatus === 'needs_human_clarify') return false
  if (!phaseRow.intakeComplete && phaseRow.intakeStatus !== 'intake_complete') return false
  if (phaseRow.ordinal > 1 && !priorPhaseReleased(queue, phaseRow)) return false
  return true
}

/** First phase that still needs intake-column work (global epic order). */
export function findActivePhase(queue) {
  const phases = [...(queue.phases || [])].sort(
    (a, b) => a.epic.localeCompare(b.epic) || a.ordinal - b.ordinal,
  )
  for (const p of phases) {
    if (p.released) continue
    if (p.planStatus === 'plan_complete') continue
    if (p.planStatus === 'needs_human_clarify') return { phase: p, reason: 'human_clarify' }
    if (!canStartPlan(queue, p)) {
      if (p.ordinal > 1 && !priorPhaseReleased(queue, p)) {
        return { phase: p, reason: 'wait_prior_release', waitPhaseId: `${p.epic}-P${p.ordinal - 1}` }
      }
      if (!p.intakeComplete && p.intakeStatus !== 'intake_complete') {
        return { phase: p, reason: 'intake_queue' }
      }
      continue
    }
    return { phase: p, reason: 'active' }
  }
  return { phase: null, reason: 'all_complete' }
}

export function nextPlanTask(root, phaseRow) {
  for (const taskId of phaseRow.taskIds || []) {
    const a = assessTaskPlan(root, phaseRow.epic, phaseRow.ordinal, taskId)
    if (!a.complete) return { taskId, assessment: a }
  }
  return null
}

export function ensureIntakeQueueComplete(root, phaseRow) {
  const phaseNn = phaseDirName(phaseRow.ordinal)
  const summaryPath = path.join(
    root,
    'Development/Plan',
    phaseRow.epic,
    phaseNn,
    'intake-summary.md',
  )
  const hasTasks = (phaseRow.taskIds || []).length > 0
  const hasSummary = fs.existsSync(summaryPath)
  if (!hasTasks) {
    return { ok: false, error: 'Phase tanpa taskIds — perlu human clarify atau perbaiki catalog' }
  }
  if (!hasSummary) {
    return { ok: false, error: 'intake-summary.md hilang — jalankan npm run agentic:intake-queue' }
  }
  return { ok: true }
}

export function applyIntakeQueueStep(root, queue, phaseRow) {
  const check = ensureIntakeQueueComplete(root, phaseRow)
  if (!check.ok) return { ok: false, error: check.error, phase: phaseRow }
  phaseRow.intakeStatus = 'intake_complete'
  phaseRow.intakeComplete = true
  phaseRow.intakeSubStep = 'plan'
  if (canStartPlan(queue, phaseRow)) {
    phaseRow.planStatus = phaseRow.planStatus === 'blocked' ? 'ready_for_plan' : phaseRow.planStatus
    if (phaseRow.planStatus === 'ready_for_plan' || phaseRow.planStatus === 'in_plan') {
      phaseRow.planStatus = 'in_plan'
    }
  }
  phaseRow.kanbanColumn = 'plan'
  const next = nextPlanTask(root, phaseRow)
  phaseRow.currentTaskId = next ? next.taskId : null
  phaseRow.planTaskDone = (phaseRow.taskIds || []).filter((id) => {
    return assessTaskPlan(root, phaseRow.epic, phaseRow.ordinal, id).complete
  }).length
  return { ok: true, phase: phaseRow, nextTask: next }
}

export function applyPlanTaskTick(root, queue, phaseRow, taskId) {
  const manifest = writePlanManifest(root, phaseRow)
  const entry = manifest.tasks.find((t) => t.taskId === taskId)
  if (!entry) return { ok: false, error: `Task ${taskId} tidak ada di phase` }
  if (entry.status === 'needs_human_clarify') {
    phaseRow.planStatus = 'needs_human_clarify'
    phaseRow.kanbanColumn = 'human-clarify'
    return { ok: false, error: 'needs_human_clarify', phase: phaseRow, manifest }
  }
  if (entry.status !== 'defined') {
    return { ok: false, error: `Plan task belum defined (${entry.status})`, phase: phaseRow, manifest }
  }

  phaseRow.planStatus = 'in_plan'
  phaseRow.intakeSubStep = 'plan'
  phaseRow.planTaskDone = manifest.tasks.filter((t) => t.status === 'defined').length

  if (manifest.allDefined) {
    return completePhasePlan(root, queue, phaseRow, manifest)
  }

  const next = nextPlanTask(root, phaseRow)
  phaseRow.currentTaskId = next ? next.taskId : null
  return { ok: true, phase: phaseRow, manifest, nextTask: next, phaseComplete: false }
}

export function completePhasePlan(root, queue, phaseRow, manifest) {
  phaseRow.planStatus = 'plan_complete'
  phaseRow.intakeSubStep = 'done'
  phaseRow.currentTaskId = null
  phaseRow.kanbanColumn = 'development'
  phaseRow.planTaskDone = (phaseRow.taskIds || []).length

  const triggered = triggerNextPhaseIntake(queue, phaseRow)
  let nextBoot = null
  if (triggered.nextPhaseId && triggered.action === 'start_intake') {
    nextBoot = bootstrapNextPhasePlan(root, queue, triggered.nextPhaseId)
  }
  return {
    ok: true,
    phase: phaseRow,
    manifest,
    phaseComplete: true,
    triggered,
    nextBoot,
  }
}

/** Setelah phase plan selesai: mulai intake phase berikutnya (epic sama) bila gate release terpenuhi. */
export function triggerNextPhaseIntake(queue, completedPhase) {
  const next = (queue.phases || []).find(
    (p) => p.epic === completedPhase.epic && p.ordinal === completedPhase.ordinal + 1,
  )
  if (!next) return { nextPhaseId: null, action: 'none' }

  if (!priorPhaseReleased(queue, next)) {
    next.planStatus = 'blocked'
    next.intakeSubStep = next.intakeSubStep || 'queue'
    return {
      nextPhaseId: next.phaseId,
      action: 'wait_prior_release',
      message: `${next.phaseId} menunggu ${completedPhase.phaseId} released (Human QA)`,
    }
  }

  next.intakeStatus = next.intakeStatus === 'intake_complete' ? next.intakeStatus : 'queued'
  next.intakeSubStep = 'queue'
  next.kanbanColumn = 'intake'
  if (next.intakeComplete || next.intakeStatus === 'intake_complete') {
    next.planStatus = 'ready_for_plan'
    next.intakeSubStep = 'plan'
    next.kanbanColumn = 'plan'
  } else {
    next.planStatus = 'blocked'
  }
  return {
    nextPhaseId: next.phaseId,
    action: 'start_intake',
    message: `Phase ${next.phaseId} siap intake/plan berurutan`,
    autoIntake: true,
  }
}

/** Panggil setelah plan_complete jika prior sudah released — langsung antri plan task pertama. */
export function bootstrapNextPhasePlan(root, queue, nextPhaseId) {
  const next = (queue.phases || []).find((p) => p.phaseId === nextPhaseId)
  if (!next || !canStartPlan(queue, next)) return null
  return applyIntakeQueueStep(root, queue, next)
}

export function buildNextAction(root, queue) {
  const active = findActivePhase(queue)
  if (!active.phase) {
    return { action: 'idle', reason: active.reason }
  }
  const phase = active.phase

  if (active.reason === 'human_clarify') {
    return {
      action: 'human_clarify',
      phaseId: phase.phaseId,
      epic: phase.epic,
      ordinal: phase.ordinal,
      skill: 'agentic/skill/plan/SKILL.md',
    }
  }

  if (active.reason === 'wait_prior_release') {
    return {
      action: 'wait_prior_release',
      phaseId: phase.phaseId,
      waitFor: active.waitPhaseId,
      message: `Gate: phase sebelumnya harus released (Human QA) sebelum plan ${phase.phaseId}`,
    }
  }

  const sub = phase.intakeSubStep || (phase.intakeComplete ? 'plan' : 'queue')

  if (sub === 'queue' || active.reason === 'intake_queue') {
    return {
      action: 'run_intake',
      phaseId: phase.phaseId,
      epic: phase.epic,
      ordinal: phase.ordinal,
      taskIds: phase.taskIds,
      skill: 'agentic/skill/intake/SKILL.md',
      then: 'npm run agentic:intake-run -- tick-intake',
    }
  }

  if (phase.planStatus === 'ready_for_plan') {
    phase.planStatus = 'in_plan'
    phase.intakeSubStep = 'plan'
  }

  const next = nextPlanTask(root, phase)
  if (!next) {
    const manifest = writePlanManifest(root, phase)
    if (manifest.allDefined) {
      return { action: 'finalize_plan', phaseId: phase.phaseId, command: 'npm run agentic:intake-run -- tick-phase' }
    }
  }

  const idx = (phase.taskIds || []).indexOf(next.taskId)
  return {
    action: 'run_plan_task',
    phaseId: phase.phaseId,
    epic: phase.epic,
    ordinal: phase.ordinal,
    taskId: next.taskId,
    taskIndex: idx + 1,
    taskTotal: (phase.taskIds || []).length,
    planStatus: next.assessment.status,
    skill: 'agentic/skill/plan/SKILL.md',
    planPath: taskArtifactRel(phase.epic, phase.ordinal, next.taskId),
    then: `npm run agentic:intake-run -- tick --task ${next.taskId} --phase-id ${phase.phaseId}`,
  }
}

function taskArtifactRel(epic, ordinal, taskId) {
  return `Development/Plan/${epic}/${phaseDirName(ordinal)}/tasks/${taskId}/plan.md`
}

function readFeatureIdFromPlan(root, epic, ordinal, taskId) {
  const planPath = path.join(taskPlanBase(root, epic, ordinal, taskId), 'plan.md')
  if (!fs.existsSync(planPath)) return null
  const text = fs.readFileSync(planPath, 'utf8')
  const m =
    text.match(/features\/([a-z0-9-]+)\.md/i) ||
    text.match(/Feature ID[^\n|`]*`([a-z0-9-]+)`/i)
  return m ? m[1] : null
}

/** Task pertama (urutan phase + taskIds) yang plan defined tapi development belum complete. */
export function nextDevelopmentTask(root, queue) {
  const phases = [...(queue.phases || [])].sort(
    (a, b) => a.epic.localeCompare(b.epic) || a.ordinal - b.ordinal,
  )
  for (const ph of phases) {
    if (ph.released) continue
    for (const taskId of ph.taskIds || []) {
      const a = assessTaskPlan(root, ph.epic, ph.ordinal, taskId)
      if (!a.complete) continue
      const devSt = readPlanDevelopmentStatus(root, ph.epic, ph.ordinal, taskId)
      if (devSt === 'complete') continue
      const featureId = readFeatureIdFromPlan(root, ph.epic, ph.ordinal, taskId)
      const planPath = taskArtifactRel(ph.epic, ph.ordinal, taskId)
      return {
        action: 'run_development_task',
        orchestratorStage: 'development',
        phaseId: ph.phaseId,
        epic: ph.epic,
        ordinal: ph.ordinal,
        taskId,
        featureId,
        skill: 'agentic/skill/development/SKILL.md',
        featurePath: featureId ? `agentic/development/features/${featureId}.md` : null,
        planPath,
        then: [
          `npm run agentic:validate-dev -- --task ${taskId} --epic ${ph.epic} --phase ${ph.ordinal}`,
          'npm run agentic:kanban-data',
        ],
      }
    }
  }
  return null
}

/** Intake/Plan dulu; lalu Development task berikutnya. */
export function buildOrchestratorNext(root, queue) {
  const planSide = buildNextAction(root, queue)
  if (planSide.action === 'human_clarify' || planSide.action === 'wait_prior_release') {
    return { ...planSide, orchestratorStage: 'gate' }
  }
  if (['run_intake', 'run_plan_task', 'finalize_plan'].includes(planSide.action)) {
    return { ...planSide, orchestratorStage: 'intake-plan' }
  }
  const dev = nextDevelopmentTask(root, queue)
  if (dev) return dev
  return { ...planSide, orchestratorStage: planSide.action === 'idle' ? 'idle' : 'intake-plan' }
}

export function orchestratorTargetColumn(orch) {
  if (!orch || !orch.action) return null
  if (orch.action === 'run_intake') return 'intake'
  if (orch.action === 'run_plan_task' || orch.action === 'finalize_plan') return 'plan'
  if (orch.action === 'run_development_task') return 'development'
  return null
}

export function buildAgentPrompt(orch) {
  if (!orch || !orch.action) return ''
  if (orch.action === 'run_intake') {
    return [
      'Agent Intake — phase ' + orch.phaseId,
      'Skill: agentic/skill/intake/SKILL.md',
      'Setelah antrian valid: npm run agentic:intake-run -- tick-intake --phase-id ' + orch.phaseId,
    ].join('\n')
  }
  if (orch.action === 'run_plan_task') {
    return [
      'Agent Plan — 1 task, urutan phase',
      'Task: ' + orch.taskId + ' (' + orch.taskIndex + '/' + orch.taskTotal + ')',
      'Plan: Agentic/' + orch.planPath,
      'Skill: agentic/skill/plan/SKILL.md',
      'Selesai: npm run agentic:intake-run -- tick --task ' + orch.taskId + ' --phase-id ' + orch.phaseId,
    ].join('\n')
  }
  if (orch.action === 'finalize_plan') {
    return 'Finalisasi plan phase ' + orch.phaseId + ':\nnpm run agentic:intake-run -- tick-phase --phase-id ' + orch.phaseId
  }
  if (orch.action === 'run_development_task') {
    return [
      'Agent Development — 1 session = 1 feature + 1 task',
      'Task: ' + orch.taskId + ' · phase ' + orch.phaseId,
      'Plan: Agentic/' + orch.planPath,
      orch.featurePath ? 'Feature: Agentic/' + orch.featurePath : '',
      'Skill: agentic/skill/development/SKILL.md',
      'Selesai: laporan development + update plan.md + ' + (orch.then && orch.then[0] ? orch.then[0] : 'validate-dev'),
    ]
      .filter(Boolean)
      .join('\n')
  }
  return orch.message || String(orch.action)
}

export function syncPhaseRow(queue, phaseId, mutator) {
  const phases = queue.phases || []
  const i = phases.findIndex((p) => p.phaseId === phaseId)
  if (i === -1) return null
  mutator(phases[i])
  return phases[i]
}

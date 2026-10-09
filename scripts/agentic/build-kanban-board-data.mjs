#!/usr/bin/env node
/**
 * Build kanban-board.json — all catalog tasks + phase progress from repo artifacts.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  aggregatePhaseColumn,
  countByColumn,
  inferTaskColumn,
  phaseAuditReport,
  readTaskArtifacts,
  readPlanDevelopmentStatus,
  readPlanQaStatus,
  readQaReportOutcome,
  suggestPhaseColumn,
  phaseAuditGate,
  phaseArtifactPaths,
  phaseQaGate,
  resolvePhaseAuditStatus,
  readTaskAuditOutcome,
  taskArtifactPaths,
  taskProgressPercent,
} from './task-progress.mjs'
import {
  buildAgentPrompt,
  buildOrchestratorNext,
  orchestratorTargetColumn,
} from './intake-pipeline.mjs'
import { findSmallestUndoneWork, loadAutopilotState, workItemPrompt } from './task-autopilot.mjs'
import { buildTaskChecklist, writeTaskChecklistArtifacts } from './task-checklist.mjs'
import { buildMonitoringData, writeMonitoringArtifacts } from './monitoring-data.mjs'

function resolveQaStatus(root, epic, phaseOrdinal, taskId, hasQaReport) {
  const fromPlan = readPlanQaStatus(root, epic, phaseOrdinal, taskId)
  if (fromPlan !== 'pending') return fromPlan
  const fromReport = readQaReportOutcome(root, epic, phaseOrdinal, taskId)
  if (fromReport) return fromReport
  if (hasQaReport) return 'in_progress'
  return 'pending'
}

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
const QUEUE_PATH = path.join(ROOT, 'docs/workflow/plans/intake-queue.json')
const CATALOG_TASKS = path.join(ROOT, '.agentic/catalog/tasks.json')
const CATALOG_INDEX = path.join(ROOT, '.agentic/catalog/index.json')
const OUT_BOARD = path.join(ROOT, 'docs/workflow/dashboard/data/kanban-board.json')
const OUT_MIRROR = path.join(ROOT, 'docs/workflow/plans/kanban-board.json')
const REPORTS_MIRROR_DIR = path.join(ROOT, 'docs/workflow/dashboard/data/reports')

function mirrorReportForKanban(repoRelativePath, fileName) {
  const src = path.join(ROOT, repoRelativePath)
  if (!fs.existsSync(src)) return null
  fs.mkdirSync(REPORTS_MIRROR_DIR, { recursive: true })
  const markdown = fs.readFileSync(src, 'utf8').replace(
    /(\]\()([^\s)]+)(\))/g,
    (match, open, href, close) => {
      if (/^(?:[a-z][a-z\d+.-]*:|[/#])/i.test(href)) return match
      const [target, ...fragment] = href.split('#')
      const absolute = path.resolve(path.dirname(src), target)
      const relative = path.relative(REPORTS_MIRROR_DIR, absolute).split(path.sep).join('/')
      return `${open}${relative}${fragment.length ? `#${fragment.join('#')}` : ''}${close}`
    },
  )
  fs.writeFileSync(path.join(REPORTS_MIRROR_DIR, fileName), markdown)
  return `data/reports/${fileName}`
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/')
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function main() {
  if (!fs.existsSync(QUEUE_PATH)) {
    console.error('Missing intake-queue.json — run: npm run agentic:intake-queue -- --all')
    process.exit(1)
  }
  const queue = loadJson(QUEUE_PATH)
  const catalogTasks = loadJson(CATALOG_TASKS)
  const index = loadJson(CATALOG_INDEX)
  const epicMeta = new Map(index.epics.map((e) => [e.epic, e]))
  const phaseQueueById = new Map((queue.phases || []).map((p) => [p.phaseId, p]))

  /** @type {Map<string, { phaseId: string, ordinal: number, epic: string, released: boolean, blocked: boolean }>} */
  const taskToPhase = new Map()
  for (const ph of queue.phases || []) {
    const prior = (queue.phases || []).filter(
      (p) => p.epic === ph.epic && p.ordinal < ph.ordinal,
    )
    const priorReleased = ph.ordinal === 1 || prior.every((p) => p.released)
    const blocked = !priorReleased
    for (const tid of ph.taskIds || []) {
      taskToPhase.set(tid, {
        phaseId: ph.phaseId,
        ordinal: ph.ordinal,
        epic: ph.epic,
        released: !!ph.released,
        blocked,
      })
    }
  }

  const catalogById = new Map(catalogTasks.map((t) => [t.id, t]))

  /** @type {Map<string, { status: string, paths: ReturnType<typeof phaseArtifactPaths>, hasReport: boolean }>} */
  const phaseAuditMap = new Map()
  for (const ph of queue.phases || []) {
    const hasReport = phaseAuditReport(ROOT, ph.epic, ph.ordinal)
    phaseAuditMap.set(ph.phaseId, {
      status: resolvePhaseAuditStatus(ROOT, ph.epic, ph.ordinal, hasReport),
      paths: phaseArtifactPaths(ph.epic, ph.ordinal),
      hasReport,
    })
  }

  /** @type {object[]} */
  const boardTasks = []
  for (const t of catalogTasks) {
    const map = taskToPhase.get(t.id)
    const epic = t.epic
    const phaseId = map?.phaseId ?? `${epic}-P1`
    const phaseOrdinal = map?.ordinal ?? 1
    const ctx = map || { released: false, blocked: false, epic, phaseId, ordinal: phaseOrdinal }
    const artifacts = readTaskArtifacts(ROOT, epic, phaseOrdinal, t.id)
    const auditReady = phaseAuditReport(ROOT, epic, phaseOrdinal)
    const auditInfo = phaseAuditMap.get(phaseId) || { status: 'pending' }
    const auditPhaseStatus = auditInfo.status
    const developmentStatus = readPlanDevelopmentStatus(ROOT, epic, phaseOrdinal, t.id)
    const qaStatus = resolveQaStatus(ROOT, epic, phaseOrdinal, t.id, artifacts.qa)
    const taskAuditStatus = readTaskAuditOutcome(ROOT, epic, phaseOrdinal, t.id)
    const phaseRow = phaseQueueById.get(phaseId) || null
    const column = inferTaskColumn(artifacts, {
      phaseReleased: ctx.released,
      phaseBlocked: ctx.blocked,
      auditReady,
      qaStatus,
      auditPhaseStatus,
      taskAuditStatus,
      phaseRow,
    })
    const progressPercent = taskProgressPercent(artifacts, column, {
      phaseReleased: ctx.released,
      auditReady,
      qaStatus,
      auditPhaseStatus,
    })
    const meta = epicMeta.get(epic)
    const paths = taskArtifactPaths(epic, phaseOrdinal, t.id)
    boardTasks.push({
      id: t.id,
      epic,
      phaseId,
      phaseOrdinal,
      title: t.title,
      area: t.area,
      style: t.style,
      agenticReady: !!t.agenticReady,
      devPhasePath: t.devPhasePath,
      prdFolder: meta?.prdFolder,
      gate: meta?.gate ?? null,
      column,
      progressPercent,
      developmentStatus,
      qaStatus,
      progress: {
        plan: artifacts.plan,
        planComplete: artifacts.planComplete,
        skillCount: artifacts.skillCount,
        development: artifacts.development,
        qa: artifacts.qa,
        auditPhase: auditReady,
      },
      reports: {
        plan: paths.plan,
        development: paths.development,
        qa: paths.qa,
        hasPlan: artifacts.plan,
        hasDevelopment: artifacts.development,
        hasQa: artifacts.qa,
        previewPlan: artifacts.plan
          ? mirrorReportForKanban(paths.plan, `${t.id}.plan.md`)
          : null,
        previewDevelopment: artifacts.development
          ? mirrorReportForKanban(paths.development, `${t.id}.development.md`)
          : null,
        previewQa: artifacts.qa ? mirrorReportForKanban(paths.qa, `${t.id}.qa.md`) : null,
      },
    })
  }

  const phasesOut = (queue.phases || []).map((ph) => {
    const tasksInPhase = boardTasks.filter((t) => t.phaseId === ph.phaseId)
    const taskColumns = tasksInPhase.map((t) => t.column)
    const byColumn = countByColumn(tasksInPhase, (t) => t.column)
    const doneCount = byColumn.done || 0
    const devCompleteCount = tasksInPhase.filter((t) => t.developmentStatus === 'complete').length
    const qaCompleteCount = tasksInPhase.filter((t) => t.qaStatus === 'pass').length
    const qaGate = phaseQaGate(tasksInPhase)
    const auditInfo = phaseAuditMap.get(ph.phaseId) || {
      status: 'pending',
      paths: phaseArtifactPaths(ph.epic, ph.ordinal),
      hasReport: false,
    }
    const auditGate = phaseAuditGate(auditInfo.status)
    const sampleTask = tasksInPhase[0]
    const avgProgress = tasksInPhase.length
      ? Math.round(tasksInPhase.reduce((s, t) => s + t.progressPercent, 0) / tasksInPhase.length)
      : 0
    const queuePhase = phaseQueueById.get(ph.phaseId) || ph
    const suggestedColumn = suggestPhaseColumn(
      tasksInPhase,
      !!ph.released,
      auditInfo.status,
      queuePhase,
    )
    return {
      ...ph,
      intakeSubStep: queuePhase.intakeSubStep,
      planStatus: queuePhase.planStatus,
      kanbanColumn: queuePhase.kanbanColumn || suggestedColumn,
      devPhasePath: sampleTask?.devPhasePath ?? null,
      audit: {
        status: auditInfo.status,
        hasReport: auditInfo.hasReport,
        plan: auditInfo.paths.auditPlan,
        report: auditInfo.paths.auditReport,
        phaseComplete: auditGate.complete,
        needsClarify: auditGate.clarify,
      },
      progress: {
        byColumn,
        doneCount,
        devCompleteCount,
        qaCompleteCount,
        qaPhaseComplete: qaGate.complete,
        qaNeedsClarify: qaGate.clarify,
        auditPhaseComplete: auditGate.complete,
        auditNeedsClarify: auditGate.clarify,
        auditStatus: auditInfo.status,
        avgProgress,
        total: tasksInPhase.length,
        percentDone: tasksInPhase.length ? Math.round((doneCount / tasksInPhase.length) * 100) : 0,
        qaPercent: tasksInPhase.length
          ? Math.round((qaCompleteCount / tasksInPhase.length) * 100)
          : 0,
        auditPercent: auditGate.complete ? 100 : auditInfo.status === 'in_progress' ? 50 : 0,
        suggestedColumn,
      },
      taskProgress: tasksInPhase
        .map((t) => ({
          id: t.id,
          title: t.title,
          column: t.column,
          progressPercent: t.progressPercent,
          developmentStatus: t.developmentStatus,
          qaStatus: t.qaStatus,
          agenticReady: t.agenticReady,
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    }
  })

  const epicsOut = index.epics.map((e) => {
    const tasksInEpic = boardTasks.filter((t) => t.epic === e.epic)
    const byColumn = countByColumn(tasksInEpic, (t) => t.column)
    const doneCount = byColumn.done || 0
    return {
      epic: e.epic,
      gate: e.gate,
      prdFolder: e.prdFolder,
      taskCount: tasksInEpic.length,
      agenticReadyCount: tasksInEpic.filter((t) => t.agenticReady).length,
      phaseCount: phasesOut.filter((p) => p.epic === e.epic).length,
      progress: {
        byColumn,
        doneCount,
        percentDone: tasksInEpic.length ? Math.round((doneCount / tasksInEpic.length) * 100) : 0,
      },
    }
  })

  const summary = {
    taskCount: boardTasks.length,
    phaseCount: phasesOut.length,
    epicCount: epicsOut.length,
    byColumn: countByColumn(boardTasks, (t) => t.column),
    agenticReadyCount: boardTasks.filter((t) => t.agenticReady).length,
  }

  const orchestratorNext = buildOrchestratorNext(ROOT, queue)
  const smallestUndone = findSmallestUndoneWork(ROOT, queue)
  const autopilotState = loadAutopilotState(ROOT)
  const orchestrator = {
    next: orchestratorNext,
    targetColumn: orchestratorTargetColumn(orchestratorNext),
    agentPrompt: buildAgentPrompt(orchestratorNext),
    terminalExecute: 'npm run agentic:trigger-next -- --execute',
    autopilot: {
      state: autopilotState,
      smallestUndone,
      prompt: workItemPrompt(smallestUndone),
      watch: 'npm run agentic:autopilot:watch',
      complete: 'npm run agentic:autopilot -- complete --task <id>',
    },
  }

  const out = {
    version: 1,
    generatedAt: new Date().toISOString(),
    queueGeneratedAt: queue.generatedAt,
    summary,
    orchestrator,
    epics: epicsOut,
    phases: phasesOut,
    tasks: boardTasks,
  }

  const triggerPath = path.join(ROOT, 'docs/workflow/dashboard/data/intake-trigger.json')
  fs.writeFileSync(
    triggerPath,
    JSON.stringify(
      {
        version: 1,
        generatedAt: out.generatedAt,
        queueGeneratedAt: queue.generatedAt,
        ...orchestrator,
      },
      null,
      2,
    ) + '\n',
  )

  fs.mkdirSync(path.dirname(OUT_BOARD), { recursive: true })
  const payload = JSON.stringify(out, null, 2) + '\n'
  fs.writeFileSync(OUT_BOARD, payload)
  fs.writeFileSync(OUT_MIRROR, payload)

  const checklist = buildTaskChecklist(ROOT, { queue, catalogTasks })
  writeTaskChecklistArtifacts(ROOT, checklist)
  const monitoring = buildMonitoringData(ROOT, { queue, checklist })
  writeMonitoringArtifacts(ROOT, monitoring)

  console.log(`Kanban board: ${summary.taskCount} task, ${summary.phaseCount} phase → ${rel(OUT_BOARD)}`)
  console.log(
    `  Checklist: running ${checklist.summary.running}, ready ${checklist.summary.ready}, blocked ${checklist.summary.blocked} → docs/workflow/dashboard/data/task-checklist.json`,
  )
  console.log(`  Monitoring: ${monitoring.summary.logCount} log → docs/workflow/dashboard/data/monitoring.json`)
  console.log(`  Columns: ${JSON.stringify(summary.byColumn)}`)
}

main()

import fs from 'node:fs'
import path from 'node:path'
import { loadQueue } from './intake-pipeline.mjs'
import { buildTaskChecklist } from './task-checklist.mjs'
import { loadAutopilotState, EVENTS_LOG, TRIGGER_DIR_REL } from './task-autopilot.mjs'
const OUT_REL = 'docs/PRD/0800-orkestrasi-stage/data/monitoring.json'
const OUT_LOG_MIRROR = 'docs/PRD/0800-orkestrasi-stage/data/monitoring-log.jsonl'

function readJsonIfExists(fp) {
  if (!fs.existsSync(fp)) return null
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'))
  } catch {
    return null
  }
}

function readJsonl(fp, max = 500) {
  if (!fs.existsSync(fp)) return []
  const lines = fs.readFileSync(fp, 'utf8').split('\n').filter(Boolean)
  const slice = lines.slice(-max)
  return slice.map((line, i) => {
    try {
      return JSON.parse(line)
    } catch {
      return { at: new Date().toISOString(), event: 'parse_error', raw: line, _line: i }
    }
  })
}

function walkReports(root, limit = 120) {
  const base = path.join(root, 'docs/development/Result')
  if (!fs.existsSync(base)) return []
  /** @type {{ path: string, mtime: number, taskId: string, kind: string, epic: string, phase: string }[]} */
  const found = []
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name)
      if (ent.isDirectory()) walk(full)
      else if (ent.name.endsWith('.md')) {
        const rel = path.relative(base, full).split(path.sep).join('/')
        const parts = rel.split('/')
        if (parts.length < 3) continue
        const epic = parts[0]
        const phase = parts[1]
        const kind = parts[2]
        const taskId = ent.name.replace(/\.md$/, '')
        if (!/^(development|qa|audit)$/.test(kind)) continue
        const st = fs.statSync(full)
        found.push({ path: `docs/development/Result/${rel}`, mtime: st.mtimeMs, taskId, kind, epic, phase })
      }
    }
  }
  walk(base)
  found.sort((a, b) => b.mtime - a.mtime)
  return found.slice(0, limit)
}

function toLogEntry(partial) {
  return {
    at: partial.at || new Date().toISOString(),
    level: partial.level || 'info',
    source: partial.source || 'system',
    event: partial.event || 'log',
    taskId: partial.taskId || null,
    phaseId: partial.phaseId || null,
    message: partial.message || '',
    detail: partial.detail || null,
  }
}

function autopilotEventsToLogs(events) {
  return events.map((e) => {
    const msg =
      e.event === 'chain'
        ? `Chain (${e.reason}): berikutnya ${e.nextKind}${e.taskId ? ' · ' + e.taskId : ''}`
        : e.event === 'auto_complete'
          ? `Selesai otomatis: ${e.kind} ${e.taskId || e.phaseId || ''}`
          : e.event === 'manual_complete'
            ? `Complete manual → chain${e.taskId ? ' · ' + e.taskId : ''}`
            : JSON.stringify(e)
    return toLogEntry({
      at: e.at,
      level: e.event === 'auto_complete' ? 'success' : 'info',
      source: 'autopilot',
      event: e.event,
      taskId: e.taskId || null,
      phaseId: e.phaseId || null,
      message: msg,
      detail: e,
    })
  })
}

function reportsToLogs(reports) {
  return reports.map((r) =>
    toLogEntry({
      at: new Date(r.mtime).toISOString(),
      level: 'info',
      source: 'artifact',
      event: 'report',
      taskId: r.taskId,
      phaseId: `${r.epic}-P${Number.parseInt(r.phase.replace('phase-', ''), 10)}`,
      message: `Laporan ${r.kind}: ${r.path}`,
      detail: { path: r.path, kind: r.kind },
    }),
  )
}

/**
 * @param {string} root
 * @param {object} [opts]
 */
export function buildMonitoringData(root, opts = {}) {
  const queue = opts.queue || loadQueue(root)
  const checklist = opts.checklist || buildTaskChecklist(root, { queue })
  const autopilotState = loadAutopilotState(root)
  const triggerDir = path.join(root, TRIGGER_DIR_REL)

  const devSession = readJsonIfExists(path.join(triggerDir, 'development.json'))
  const autopilotWork = readJsonIfExists(path.join(triggerDir, 'autopilot-work.json'))
  const intakeTrigger = readJsonIfExists(
    path.join(root, 'docs/PRD/0800-orkestrasi-stage/data/intake-trigger.json'),
  )

  const autopilotEvents = readJsonl(path.join(triggerDir, EVENTS_LOG), 300)
  const reports = walkReports(root, 150)

  /** @type {ReturnType<typeof toLogEntry>[]} */
  let logs = [
    ...autopilotEventsToLogs(autopilotEvents),
    ...reportsToLogs(reports),
  ]

  if (devSession?.requestedAt) {
    logs.push(
      toLogEntry({
        at: devSession.requestedAt,
        level: 'info',
        source: 'session',
        event: 'development_session',
        taskId: devSession.taskId,
        phaseId: devSession.phaseId || null,
        message: `Sesi Development diminta: ${devSession.taskId}`,
        detail: { planPath: devSession.planPath, source: devSession.source },
      }),
    )
  }

  if (queue.generatedAt) {
    logs.push(
      toLogEntry({
        at: queue.generatedAt,
        level: 'info',
        source: 'queue',
        event: 'intake_queue',
        message: `intake-queue.json diperbarui (${(queue.phases || []).length} phase)`,
      }),
    )
  }

  logs.sort((a, b) => String(b.at).localeCompare(String(a.at)))
  logs = logs.slice(0, 400)

  const tasks = checklist.items.map((it) => ({
    taskId: it.taskId,
    title: it.title,
    phaseId: it.phaseId,
    runState: it.runState,
    stage: it.stage,
    column: it.column,
    planStatus: it.planStatus,
    developmentStatus: it.developmentStatus,
    qaStatus: it.qaStatus,
    isNext: it.isNext,
    autopilotActive: it.autopilotActive,
    blockers: it.blockers,
    waitReasons: it.waitReasons,
    paths: it.paths,
  }))

  const taskLogIndex = {}
  for (const log of logs) {
    if (!log.taskId) continue
    if (!taskLogIndex[log.taskId]) taskLogIndex[log.taskId] = []
    taskLogIndex[log.taskId].push(log)
  }

  const runningTasks = tasks.filter((t) => t.runState === 'running' || t.runState === 'assigned')
  const blockedTasks = tasks.filter((t) => t.runState === 'blocked')

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    summary: {
      ...checklist.summary,
      queuePhases: (queue.phases || []).length,
      queueGeneratedAt: queue.generatedAt,
      autopilotActive: !!autopilotState?.active,
      activeTaskId: autopilotState?.taskId || devSession?.taskId || null,
      activeKind: autopilotState?.kind || null,
      runningCount: runningTasks.length,
      blockedCount: blockedTasks.length,
      logCount: logs.length,
    },
    autopilot: autopilotState,
    sessions: {
      development: devSession,
      autopilotWork,
      intakeTrigger: intakeTrigger
        ? {
            generatedAt: intakeTrigger.generatedAt,
            targetColumn: intakeTrigger.targetColumn,
            action: intakeTrigger.next?.action,
            taskId: intakeTrigger.next?.taskId,
          }
        : null,
    },
    tasks,
    logs,
    taskLogIndex,
  }
}

export function writeMonitoringArtifacts(root, data) {
  const outPath = path.join(root, OUT_REL)
  const logPath = path.join(root, OUT_LOG_MIRROR)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n')
  const logLines = data.logs.map((l) => JSON.stringify(l)).join('\n') + (data.logs.length ? '\n' : '')
  fs.writeFileSync(logPath, logLines)
  return { jsonRel: OUT_REL, logRel: OUT_LOG_MIRROR }
}

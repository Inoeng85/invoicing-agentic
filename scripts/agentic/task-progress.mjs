import fs from 'node:fs'
import path from 'node:path'

const COLUMN_ORDER = [
  'intake',
  'plan',
  'development',
  'test',
  'audit',
  'human-clarify',
  'human-qa',
  'done',
]

export function columnRank(col) {
  const i = COLUMN_ORDER.indexOf(col)
  return i === -1 ? 0 : i
}

export function phaseDirName(ordinal) {
  return `phase-${String(ordinal).padStart(2, '0')}`
}

export function taskPlanBase(root, epic, phaseOrdinal, taskId) {
  return path.join(root, 'Development/Plan', epic, phaseDirName(phaseOrdinal), 'tasks', taskId)
}

/** Repo-relative paths for kanban / IDE links */
export function taskArtifactPaths(epic, phaseOrdinal, taskId) {
  const phase = phaseDirName(phaseOrdinal)
  return {
    plan: `Development/Plan/${epic}/${phase}/tasks/${taskId}/plan.md`,
    development: `Development/Result/${epic}/${phase}/development/${taskId}.md`,
    qa: `Development/Result/${epic}/${phase}/qa/${taskId}.md`,
  }
}

export function phasePlanBase(root, epic, phaseOrdinal) {
  return path.join(root, 'Development/Plan', epic, phaseDirName(phaseOrdinal))
}

/** Repo-relative paths for phase audit */
export function phaseArtifactPaths(epic, phaseOrdinal) {
  const phase = phaseDirName(phaseOrdinal)
  return {
    auditPlan: `Development/Plan/${epic}/${phase}/audit.md`,
    auditReport: `Development/Result/${epic}/${phase}/audit/report.md`,
  }
}

/** @returns {'pending'|'in_progress'|'pass'|'fail'|'needs_clarify'} */
export function readPhaseAuditPlanStatus(root, epic, phaseOrdinal) {
  const planPath = path.join(phasePlanBase(root, epic, phaseOrdinal), 'audit.md')
  const s = readPlanSectionStatus(planPath, 'Audit', [
    'pass',
    'fail',
    'needs_clarify',
    'in_progress',
  ])
  if (['pass', 'fail', 'needs_clarify', 'in_progress'].includes(s)) return s
  return 'pending'
}

/** @returns {'pass'|'fail'|'needs_clarify'|null} */
export function readPhaseAuditReportOutcome(root, epic, phaseOrdinal) {
  const reportPath = path.join(
    taskResultBase(root, epic, phaseOrdinal),
    'audit',
    'report.md',
  )
  if (!fs.existsSync(reportPath)) return null
  const text = fs.readFileSync(reportPath, 'utf8')
  if (/\*\*Hasil\*\*[^\n]*`pass`/i.test(text) || /Hasil:\s*pass/i.test(text)) return 'pass'
  if (/\*\*Hasil\*\*[^\n]*`needs_clarify`/i.test(text)) return 'needs_clarify'
  if (/\*\*Hasil\*\*[^\n]*`fail`/i.test(text) || /Hasil:\s*fail/i.test(text)) return 'fail'
  return null
}

/** Laporan audit satu task: Development/Result/{epic}/phase-{nn}/audit/{taskId}.md */
export function readTaskAuditOutcome(root, epic, phaseOrdinal, taskId) {
  const reportPath = path.join(taskResultBase(root, epic, phaseOrdinal), 'audit', `${taskId}.md`)
  if (!fs.existsSync(reportPath)) return null
  const text = fs.readFileSync(reportPath, 'utf8')
  if (/\*\*Hasil\*\*[^\n]*`pass`/i.test(text) || /Hasil:\s*pass/i.test(text)) return 'pass'
  if (/\*\*Hasil\*\*[^\n]*`needs_clarify`/i.test(text)) return 'needs_clarify'
  if (/\*\*Hasil\*\*[^\n]*`fail`/i.test(text) || /Hasil:\s*fail/i.test(text)) return 'fail'
  return null
}

export function resolvePhaseAuditStatus(root, epic, phaseOrdinal, hasAuditReport) {
  const fromPlan = readPhaseAuditPlanStatus(root, epic, phaseOrdinal)
  if (fromPlan !== 'pending' && fromPlan !== 'in_progress') return fromPlan
  const fromReport = readPhaseAuditReportOutcome(root, epic, phaseOrdinal)
  if (fromReport) return fromReport
  if (fromPlan === 'in_progress') return 'in_progress'
  if (hasAuditReport) return 'in_progress'
  return 'pending'
}

function readPlanSectionStatus(planPath, section, statusTokens) {
  if (!fs.existsSync(planPath)) return 'pending'
  const text = fs.readFileSync(planPath, 'utf8')
  const sec = text.match(new RegExp(`## ${section}[\\s\\S]*?(?=\\n## |$)`, 'i'))
  const body = sec ? sec[0] : text
  for (const tok of statusTokens) {
    if (new RegExp(`Status\\s*\\|\\s*\`${tok}\``, 'i').test(body)) return tok
  }
  if (new RegExp(`## ${section}`, 'i').test(text)) return 'in_progress'
  return 'pending'
}

/** Hanya dari token eksplisit di plan.md (tanpa fallback "section ada = in_progress"). */
export function readPlanDevelopmentStatusStrict(root, epic, phaseOrdinal, taskId) {
  const planPath = path.join(taskPlanBase(root, epic, phaseOrdinal, taskId), 'plan.md')
  if (!fs.existsSync(planPath)) return 'pending'
  const text = fs.readFileSync(planPath, 'utf8')
  const sec = text.match(/## Development\s+([\s\S]*?)(?=\n## |$)/i)
  const body = sec ? sec[1] : ''
  if (/Status\s*\|\s*`complete`/i.test(body) || /\|\s*Status\s*\|\s*`complete`/i.test(body)) {
    return 'complete'
  }
  if (/Status\s*\|\s*`in_progress`/i.test(body) || /\|\s*Status\s*\|\s*`in_progress`/i.test(body)) {
    return 'in_progress'
  }
  return 'pending'
}

export function readPlanDevelopmentStatus(root, epic, phaseOrdinal, taskId) {
  const planPath = path.join(taskPlanBase(root, epic, phaseOrdinal, taskId), 'plan.md')
  const s = readPlanSectionStatus(planPath, 'Development', ['complete', 'in_progress'])
  return s === 'complete' || s === 'in_progress' ? s : 'pending'
}

/** @returns {'pending'|'in_progress'|'pass'|'fail'|'needs_clarify'} */
export function readPlanQaStatus(root, epic, phaseOrdinal, taskId) {
  const planPath = path.join(taskPlanBase(root, epic, phaseOrdinal, taskId), 'plan.md')
  const s = readPlanSectionStatus(planPath, 'QA', [
    'pass',
    'fail',
    'needs_clarify',
    'in_progress',
  ])
  if (['pass', 'fail', 'needs_clarify', 'in_progress'].includes(s)) return s
  return 'pending'
}

/** @returns {'pass'|'fail'|'needs_clarify'|null} */
export function readQaReportOutcome(root, epic, phaseOrdinal, taskId) {
  const reportPath = path.join(
    taskResultBase(root, epic, phaseOrdinal),
    'qa',
    `${taskId}.md`,
  )
  if (!fs.existsSync(reportPath)) return null
  const text = fs.readFileSync(reportPath, 'utf8')
  if (/\*\*Hasil\*\*[^\n]*`pass`/i.test(text) || /Hasil:\s*pass/i.test(text)) return 'pass'
  if (/\*\*Hasil\*\*[^\n]*`needs_clarify`/i.test(text)) return 'needs_clarify'
  if (/\*\*Hasil\*\*[^\n]*`fail`/i.test(text) || /Hasil:\s*fail/i.test(text)) return 'fail'
  return null
}

export function taskResultBase(root, epic, phaseOrdinal) {
  return path.join(root, 'Development/Result', epic, phaseDirName(phaseOrdinal))
}

export function readTaskArtifacts(root, epic, phaseOrdinal, taskId) {
  const planBase = taskPlanBase(root, epic, phaseOrdinal, taskId)
  const resultBase = taskResultBase(root, epic, phaseOrdinal)
  const planPath = path.join(planBase, 'plan.md')
  const skillsDir = path.join(planBase, 'skills')
  let skillFiles = []
  if (fs.existsSync(skillsDir)) {
    skillFiles = fs.readdirSync(skillsDir).filter((f) => f.endsWith('.md'))
  }
  const plan = fs.existsSync(planPath)
  const planComplete = plan && skillFiles.length > 0
  const development = fs.existsSync(path.join(resultBase, 'development', `${taskId}.md`))
  const qa = fs.existsSync(path.join(resultBase, 'qa', `${taskId}.md`))
  return { plan, planComplete, skillCount: skillFiles.length, development, qa }
}

export function phaseAuditReport(root, epic, phaseOrdinal) {
  return fs.existsSync(
    path.join(taskResultBase(root, epic, phaseOrdinal), 'audit', 'report.md'),
  )
}

/**
 * Kolom Intake vs Plan dari intake-queue (fase agent terpisah).
 * @param {object | null | undefined} phaseRow
 */
export function inferColumnFromIntakeQueue(phaseRow, artifacts) {
  if (!phaseRow) return null
  if (phaseRow.planStatus === 'needs_human_clarify') return 'human-clarify'
  if (phaseRow.planStatus === 'plan_complete') return null
  if (phaseRow.planStatus === 'blocked' && !phaseRow.intakeComplete) return 'intake'
  if (phaseRow.planStatus === 'blocked') return 'intake'
  const sub = phaseRow.intakeSubStep || (phaseRow.intakeComplete ? 'plan' : 'queue')
  if (!phaseRow.intakeComplete || sub === 'queue') return 'intake'
  if (phaseRow.intakeComplete && ['ready_for_plan', 'in_plan'].includes(phaseRow.planStatus)) {
    if (artifacts.planComplete && !artifacts.development) return 'development'
    return 'plan'
  }
  return null
}

/**
 * @param {ReturnType<typeof readTaskArtifacts>} artifacts
 * @param {{ phaseReleased?: boolean, phaseBlocked?: boolean, auditReady?: boolean, qaStatus?: string, auditPhaseStatus?: string, taskAuditStatus?: string | null, phaseRow?: object }} ctx
 */
export function inferTaskColumn(artifacts, ctx = {}) {
  const qa = ctx.qaStatus || ctx.qaOutcome
  const audit = ctx.auditPhaseStatus || 'pending'
  if (ctx.phaseReleased) return 'done'
  if (ctx.phaseBlocked) return 'intake'
  if (qa === 'needs_clarify' || audit === 'needs_clarify' || ctx.taskAuditStatus === 'needs_clarify') {
    return 'human-clarify'
  }
  if (ctx.taskAuditStatus === 'pass' && qa === 'pass') return 'done'
  if (audit === 'pass') return 'human-qa'
  if (qa === 'pass') return 'audit'
  if (qa === 'fail' || qa === 'in_progress' || qa === 'pending') {
    if (artifacts.development || artifacts.qa) return 'test'
  }
  if (artifacts.development) return 'test'
  const fromQueue = inferColumnFromIntakeQueue(ctx.phaseRow, artifacts)
  if (fromQueue) return fromQueue
  if (artifacts.planComplete) return 'development'
  if (artifacts.plan) return 'plan'
  return 'intake'
}

/** Slowest (earliest pipeline) column among tasks → phase position */
export function aggregatePhaseColumn(taskColumns) {
  if (!taskColumns.length) return 'intake'
  let minRank = Infinity
  let col = 'intake'
  for (const c of taskColumns) {
    const r = columnRank(c)
    if (r < minRank) {
      minRank = r
      col = c
    }
  }
  if (taskColumns.every((c) => c === 'done')) return 'done'
  return col
}

/**
 * Persentase progress per task (0–100) selaras milestone Plan → Done.
 * @param {ReturnType<typeof readTaskArtifacts>} artifacts
 * @param {string} column
 * @param {{ phaseReleased?: boolean, auditReady?: boolean, qaStatus?: string, auditPhaseStatus?: string }} ctx
 */
export function taskProgressPercent(artifacts, column, ctx = {}) {
  const qa = ctx.qaStatus
  const audit = ctx.auditPhaseStatus
  if (column === 'done' || ctx.phaseReleased) return 100
  if (audit === 'pass' || column === 'human-qa') return 95
  if (qa === 'pass' || (artifacts.qa && ctx.auditReady)) return 85
  if (qa === 'in_progress' || qa === 'fail') return 68
  if (artifacts.qa) return 75
  if (artifacts.development) return 55
  if (artifacts.planComplete) return 30
  if (artifacts.plan) return 22
  if (column === 'human-qa') return 90
  if (column === 'audit') return 75
  if (column === 'test') return 55
  if (column === 'development') return 30
  if (column === 'plan') return 22
  if (column === 'human-clarify') return 20
  return 5
}

export function countByColumn(items, getCol) {
  /** @type {Record<string, number>} */
  const out = {}
  for (const id of COLUMN_ORDER) out[id] = 0
  for (const item of items) {
    const c = getCol(item)
    if (out[c] !== undefined) out[c]++
  }
  return out
}

/** @param {{ qaStatus: string }[]} tasksInPhase */
export function phaseQaGate(tasksInPhase) {
  if (!tasksInPhase.length) return { complete: false, clarify: false }
  const clarify = tasksInPhase.some((t) => t.qaStatus === 'needs_clarify')
  const complete = tasksInPhase.every((t) => t.qaStatus === 'pass')
  return { complete, clarify }
}

/** @param {{ qaStatus: string, developmentStatus?: string }[]} tasksInPhase */
export function suggestPhaseColumn(
  tasksInPhase,
  released,
  auditPhaseStatus = 'pending',
  phaseRow = null,
) {
  if (released) return 'done'
  if (phaseRow?.planStatus === 'needs_human_clarify') return 'human-clarify'
  if (phaseRow && phaseRow.planStatus !== 'plan_complete') {
    const sub = phaseRow.intakeSubStep || (phaseRow.intakeComplete ? 'plan' : 'queue')
    if (!phaseRow.intakeComplete || sub === 'queue') return 'intake'
    if (phaseRow.planStatus === 'blocked') return 'intake'
    if (['ready_for_plan', 'in_plan'].includes(phaseRow.planStatus)) return 'plan'
  }
  const { complete, clarify } = phaseQaGate(tasksInPhase)
  if (clarify) return 'human-clarify'
  if (auditPhaseStatus === 'needs_clarify') return 'human-clarify'
  if (auditPhaseStatus === 'pass') return 'human-qa'
  if (complete) return 'audit'
  const allDevDone = tasksInPhase.every((t) => t.developmentStatus === 'complete')
  if (allDevDone) return 'test'
  return aggregatePhaseColumn(tasksInPhase.map((t) => t.column || 'intake'))
}

/** @param {string} auditPhaseStatus */
export function phaseAuditGate(auditPhaseStatus) {
  return {
    complete: auditPhaseStatus === 'pass',
    clarify: auditPhaseStatus === 'needs_clarify',
    inProgress: auditPhaseStatus === 'in_progress' || auditPhaseStatus === 'fail',
  }
}

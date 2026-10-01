/**
 * Derive execution phases from Development phase markdown + catalog tasks.
 */
import fs from 'node:fs'

/** @typedef {{ phaseNum: number, title: string, gate?: string, taskIds: string[] }} PhaseDef */

/**
 * @param {string} text
 * @returns {{ phaseNum: number, title: string, gate?: string }[]}
 */
export function parsePhaseSummaryTable(text) {
  const rows = []
  const section = text.match(/## Ringkasan fase[\s\S]*?(?=\n## |\n---|$)/i)
  if (!section) return rows
  for (const line of section[0].split('\n')) {
    const m = line.match(/\|\s*Phase\s*(\d+)[^|]*\|\s*[^|]*\|\s*([^|]*)\|\s*[^|]*\|/)
    if (!m) continue
    rows.push({
      phaseNum: Number(m[1]),
      title: line.split('|')[1]?.replace(/Phase\s*\d+\s*[—-]?\s*/i, '').trim() || `Phase ${m[1]}`,
      gate: m[2].replace(/\*/g, '').trim() || undefined,
    })
  }
  return rows
}

/**
 * @param {string} text
 * @returns {Map<number, string[]>}
 */
export function parsePhaseExecutionOrder(text) {
  /** @type {Map<number, string[]>} */
  const map = new Map()
  for (const m of text.matchAll(/\*\*Phase\s*(\d+):\*\*\s*([^\n]+)/g)) {
    const phaseNum = Number(m[1])
    const ids = [...m[2].matchAll(/`(\d{6}-[^`]+)`/g)].map((x) => x[1])
    if (ids.length) map.set(phaseNum, ids)
  }
  return map
}

/**
 * @param {string} text
 * @returns {Map<number, string[]>}
 */
export function parsePhaseSectionTasks(text) {
  /** @type {Map<number, string[]>} */
  const map = new Map()
  const parts = text.split(/^## Phase\s*(\d+)\s*[—-]/gm)
  for (let i = 1; i < parts.length; i += 2) {
    const phaseNum = Number(parts[i])
    const body = parts[i + 1] || ''
    const ids = [...body.matchAll(/^### (\d{6}-[^\n]+)\s*$/gm)].map((x) => x[1].trim())
    if (ids.length) map.set(phaseNum, ids)
  }
  return map
}

/**
 * @param {{ id: string, number?: string }[]} tasks
 * @param {PhaseDef[]} defs
 */
export function assignTasksByExplicitIds(tasks, defs) {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  for (const def of defs) {
    def.taskIds = def.taskIds.filter((id) => byId.has(id))
  }
  return defs
}

/**
 * @param {{ id: string, number?: string }[]} tasks
 * @param {{ phaseNum: number, title: string, gate?: string }[]} meta
 * @param {Map<number, string[]>} idLists
 * @returns {PhaseDef[]}
 */
export function buildPhasesFromMaps(tasks, meta, idLists) {
  const taskSet = new Set(tasks.map((t) => t.id))
  /** @type {PhaseDef[]} */
  const phases = []
  const sorted = [...meta].sort((a, b) => a.phaseNum - b.phaseNum)
  for (const row of sorted) {
    const ids = (idLists.get(row.phaseNum) || []).filter((id) => taskSet.has(id))
    phases.push({
      phaseNum: row.phaseNum,
      title: row.title,
      gate: row.gate,
      taskIds: ids,
    })
  }
  return phases
}

/**
 * @param {{ id: string, number?: string }[]} tasks
 * @returns {PhaseDef[]}
 */
export function singlePhaseFallback(tasks, epic) {
  return [
    {
      phaseNum: 1,
      title: `Epic ${epic} — seluruh task`,
      taskIds: tasks.map((t) => t.id),
    },
  ]
}

/**
 * @param {{ id: string, number?: string }[]} tasks
 * @param {{ phaseId: string, ordinal?: number, title: string, taskNumbers?: string[], taskIds?: string[] }[]} splits
 */
export function phasesFromScopeSplits(tasks, epic, splits) {
  const byNum = new Map(tasks.map((t) => [t.number, t.id]))
  return splits.map((s, i) => {
    let taskIds = s.taskIds || []
    if (s.taskNumbers?.length) {
      taskIds = s.taskNumbers.map((n) => byNum.get(n.padStart(2, '0'))).filter(Boolean)
    }
    return {
      phaseNum: s.ordinal ?? i + 1,
      phaseId: s.phaseId || `${epic}-P${s.ordinal ?? i + 1}`,
      title: s.title,
      taskIds,
    }
  })
}

/**
 * @param {string} filePath
 * @param {{ id: string }[]} tasks
 * @param {{ epic: string, splits?: unknown[] }} scopeEntry
 */
export function discoverPhasesForEpic(filePath, tasks, scopeEntry) {
  const epic = scopeEntry.epic
  if (scopeEntry.splits?.length) {
    return phasesFromScopeSplits(tasks, epic, scopeEntry.splits)
  }
  const text = fs.readFileSync(filePath, 'utf8')
  const table = parsePhaseSummaryTable(text)
  const exec = parsePhaseExecutionOrder(text)
  const sections = parsePhaseSectionTasks(text)
  /** @type {Map<number, string[]>} */
  const merged = new Map(exec)
  for (const [k, v] of sections) {
    if (!merged.has(k) || merged.get(k).length < v.length) merged.set(k, v)
  }
  if (table.length && [...merged.values()].some((v) => v.length > 0)) {
    return buildPhasesFromMaps(tasks, table, merged)
  }
  if (table.length) {
    return table.map((row) => ({
      phaseNum: row.phaseNum,
      title: row.title,
      gate: row.gate,
      taskIds: [],
    }))
  }
  return singlePhaseFallback(tasks, epic)
}

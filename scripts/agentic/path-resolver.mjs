import fs from 'node:fs'
import path from 'node:path'

/** Parent folder bila workspace Cursor = AIEngineer dan repo Agentic = subfolder */
export const WORKSPACE_AGENTIC_PREFIX = 'Agentic'

/** Path relatif dari root folder Agentic (npm scripts). */
export function agenticRelative(subpath) {
  return subpath.split(path.sep).join('/')
}

/** Path untuk buka file dari workspace AIEngineer (Cursor/VS Code). */
export function workspaceRelative(subpath) {
  return `${WORKSPACE_AGENTIC_PREFIX}/${agenticRelative(subpath)}`
}

export function resolveAgenticFile(root, subpath) {
  const direct = path.join(root, subpath)
  if (fs.existsSync(direct)) return direct
  const parent = path.join(root, '..', subpath)
  if (fs.existsSync(parent)) return parent
  return direct
}

/** URL bases for kanban HTML (relatif lokasi kanban-board.html). */
export const KANBAN_REPO_BASES = [
  '../../../',
  '../../../../Agentic/',
  '../../../../../Agentic/',
]

export async function fetchRepoFileFromPage(repoRelativePath, pageHref) {
  let lastErr = null
  for (const base of KANBAN_REPO_BASES) {
    try {
      const url = new URL(base + repoRelativePath.split('/').join('/'), pageHref)
      const res = await fetch(url, { cache: 'no-store' })
      if (res.ok) return { res, url: url.href, base }
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr || new Error('HTTP 404')
}

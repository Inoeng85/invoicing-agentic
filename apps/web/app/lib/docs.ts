import { readdir, readFile, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import MarkdownIt from 'markdown-it'

export const DOCS_ROOT = fileURLToPath(new URL('../../../../docs/', import.meta.url))
const SOURCE_ROOT = 'https://github.com/Inoeng85/invoicing-agentic/blob/develop/'
const FILE_TYPES = /\.(?:md|tmpl|html|css|js|json|jsonl|svg|png|jpe?g|webp|ico|txt|log|diff|pdf)$/i

export interface DocumentationEntry {
  path: string
  name: string
  directory: boolean
}

export interface DocumentationContent {
  title: string
  html: string
  metadata: Array<{ name: string; value: string }>
  headings: Array<{ id: string; title: string; level: number }>
}

export function docsHref(file = ''): string {
  return `/docs${file ? `/${file.split('/').map(encodeURIComponent).join('/')}` : ''}`
}

export async function resolveDocumentation(file: string, root = DOCS_ROOT) {
  if (file.includes('\\') || file.includes('\0') || file.split('/').some((part) => part.startsWith('.'))) return null
  const absolute = path.resolve(root, file)
  const canonicalRoot = await realpath(root)
  try {
    const canonical = await realpath(absolute)
    if (canonical !== canonicalRoot && !canonical.startsWith(`${canonicalRoot}${path.sep}`)) return null
    if (path.relative(canonicalRoot, canonical).split(path.sep).some((part) => part.startsWith('.'))) return null
    const info = await stat(canonical)
    if (!info.isDirectory() && (!info.isFile() || !FILE_TYPES.test(canonical))) return null
    return { absolute: canonical, directory: info.isDirectory() }
  } catch (error) {
    if (error instanceof Error && 'code' in error && ['ENOENT', 'ENOTDIR', 'ELOOP'].includes(String(error.code))) return null
    throw error
  }
}

export async function listDocumentation(root = DOCS_ROOT): Promise<DocumentationEntry[]> {
  const entries: DocumentationEntry[] = []
  async function walk(folder: string) {
    for (const entry of await readdir(path.join(root, folder), { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue
      const relative = path.posix.join(folder, entry.name)
      if (entry.isDirectory()) {
        entries.push({ path: relative, name: entry.name, directory: true })
        await walk(relative)
      } else if (entry.isFile() && FILE_TYPES.test(entry.name)) {
        entries.push({ path: relative, name: entry.name, directory: false })
      }
    }
  }
  await walk('')
  return entries.sort((a, b) => Number(b.directory) - Number(a.directory) || a.path.localeCompare(b.path))
}

export interface DocumentationNode extends DocumentationEntry {
  /** Files anywhere in this subtree; always 0 for a file node. */
  fileCount: number
  children: DocumentationNode[]
}

/** A folder's README is its own landing page, so it sorts ahead of the subfolders it introduces. */
function compareNodes(a: DocumentationNode, b: DocumentationNode): number {
  const rank = (node: DocumentationNode) => (node.name === 'README.md' ? 0 : node.directory ? 1 : 2)
  return rank(a) - rank(b) || a.name.localeCompare(b.name)
}

export function groupDocumentation(entries: DocumentationEntry[]): DocumentationNode[] {
  const nodes = new Map<string, DocumentationNode>()
  const roots: DocumentationNode[] = []

  function place(entry: DocumentationEntry): DocumentationNode {
    const existing = nodes.get(entry.path)
    if (existing) return existing
    const node: DocumentationNode = { ...entry, fileCount: 0, children: [] }
    nodes.set(entry.path, node)
    const parent = path.posix.dirname(entry.path)
    if (parent === '.') roots.push(node)
    else place({ path: parent, name: path.posix.basename(parent), directory: true }).children.push(node)
    return node
  }

  for (const entry of entries) place(entry)

  function finalize(siblings: DocumentationNode[]): number {
    let files = 0
    for (const node of siblings) {
      node.fileCount = finalize(node.children)
      files += node.directory ? node.fileCount : 1
    }
    siblings.sort(compareNodes)
    return files
  }
  finalize(roots)

  return roots
}

export function documentationOrder(entries: DocumentationEntry[]): DocumentationEntry[] {
  const order: DocumentationEntry[] = []
  function walk(nodes: DocumentationNode[]) {
    for (const node of nodes) {
      if (!node.directory) order.push({ path: node.path, name: node.name, directory: false })
      walk(node.children)
    }
  }
  walk(groupDocumentation(entries))
  return order
}

export function adjacentDocumentation(
  entries: DocumentationEntry[],
  file: string,
): { previous: DocumentationEntry | null; next: DocumentationEntry | null } {
  const order = documentationOrder(entries)
  const index = order.findIndex((entry) => entry.path === file)
  if (index === -1) return { previous: null, next: null }
  return { previous: order[index - 1] ?? null, next: order[index + 1] ?? null }
}

export function documentationLink(file: string, href: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|[/#])/i.test(href)) return href
  const url = new URL(href, `https://documentation.local${docsHref(file)}`)
  if (url.pathname === '/docs' || url.pathname.startsWith('/docs/')) return `${url.pathname}${url.search}${url.hash}`
  return `${SOURCE_ROOT}${url.pathname.slice(1)}${url.hash}`
}

export function renderDocumentation(file: string, source: string): DocumentationContent {
  const metadata: DocumentationContent['metadata'] = []
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (frontmatter) {
    for (const line of frontmatter[1].split(/\r?\n/)) {
      const pair = line.match(/^([\w-]+):\s*(.+)$/)
      if (pair) metadata.push({ name: pair[1], value: pair[2] })
    }
    source = source.slice(frontmatter[0].length)
  }
  const markdown = new MarkdownIt({ html: false })
  const headings: DocumentationContent['headings'] = []
  const ids = new Map<string, number>()
  markdown.core.ruler.push('documentation-headings', (state) => {
    for (let index = 0; index < state.tokens.length; index++) {
      const token = state.tokens[index]
      if (token.type !== 'heading_open') continue
      const title = (state.tokens[index + 1].children ?? []).map((child) => child.type === 'code_inline' || child.type === 'text' ? child.content : '').join('')
      const slug = title.toLowerCase().replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '').replace(/\s/g, '-') || 'section'
      const occurrence = ids.get(slug) ?? 0
      ids.set(slug, occurrence + 1)
      const id = occurrence ? `${slug}-${occurrence}` : slug
      token.attrSet('id', id)
      headings.push({ id, title, level: Number(token.tag.slice(1)) })
    }
  })
  for (const [rule, attribute] of [['link_open', 'href'], ['image', 'src']] as const) {
    const original = markdown.renderer.rules[rule]
    markdown.renderer.rules[rule] = (tokens, index, options, env, renderer) => {
      const value = tokens[index].attrGet(attribute)
      if (value) tokens[index].attrSet(attribute, documentationLink(file, String(value)))
      return original ? original(tokens, index, options, env, renderer) : renderer.renderToken(tokens, index, options)
    }
  }
  const renderFence = markdown.renderer.rules.fence
  markdown.renderer.rules.fence = (tokens, index, options, env, renderer) => {
    const token = tokens[index]
    const info = token.info.trim()
    const language = info.split(/\s+/)[0] ?? ''
    // Docs use bare language fences today; `title="…"` stays supported for named files.
    const label = info.match(/title="([^"]*)"/)?.[1] ?? language
    token.info = language
    const code = renderFence
      ? renderFence(tokens, index, options, env, renderer)
      : renderer.renderToken(tokens, index, options)
    const caption = label
      ? `<figcaption class="docs-code-title">${markdown.utils.escapeHtml(label)}</figcaption>`
      : ''
    return `<figure class="docs-code">${caption}${code}</figure>`
  }

  const html = markdown.render(source)
  return { title: headings.find((heading) => heading.level === 1)?.title ?? path.basename(file), html, metadata, headings }
}

export async function readDocumentation(file: string) {
  const resolved = await resolveDocumentation(file)
  if (!resolved || resolved.directory) return null
  return renderDocumentation(file, await readFile(resolved.absolute, 'utf8'))
}

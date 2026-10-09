import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function documentationFiles(root) {
  return execFileSync('git', [
    'ls-files', '--cached', '--others', '--exclude-standard', '-z', '--',
    'docs', '.cursor/skills', 'apps/api/AGENTS.md', 'apps/web/AGENTS.md',
  ], { cwd: root, encoding: 'utf8' }).split('\0').filter((file) =>
    /\.(?:md|html)$/.test(file) || /^docs\/workflow\/dashboard\/.*\.js$/.test(file),
  ).filter((file) => fs.existsSync(path.join(root, file)))
}

function references(file, text) {
  const links = []
  const add = (pattern) => {
    for (const match of text.matchAll(pattern)) {
      links.push({ href: match[1].replace(/^<|>$/g, ''), line: text.slice(0, match.index).split('\n').length })
    }
  }
  if (file.endsWith('.md')) {
    text = text.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*$/gm, (block) => block.replace(/[^\n]/g, ' '))
    add(/\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\s*\)/g)
    add(/^\s*\[[^\]]+\]:\s*(<[^>]+>|[^\s]+)/gm)
  }
  if (/\.(?:md|html)$/.test(file)) add(/\b(?:href|src)\s*=\s*["']([^"']+)["']/g)
  if (file.endsWith('.js')) add(/new URL\(["']([^"']+)["'],\s*window\.location\.href\)/g)
  return links
}

export function checkDocs(root = ROOT, files = documentationFiles(root)) {
  const broken = []
  const directories = new Map()
  const targetExists = (absolute) => {
    if (!fs.existsSync(absolute)) return false
    for (let current = absolute; current !== path.dirname(current); current = path.dirname(current)) {
      const parent = path.dirname(current)
      if (!directories.has(parent)) directories.set(parent, fs.readdirSync(parent))
      if (!directories.get(parent).includes(path.basename(current))) return false
    }
    return true
  }
  let checked = 0
  for (const file of [...new Set(files)]) {
    const text = fs.readFileSync(path.join(root, file), 'utf8')
    for (const { href, line } of references(file, text)) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href) || /\{[^}]*\}/.test(href)) continue
      // These links become real only after the task template is instantiated.
      if (file === 'docs/workflow/plans/_templates/task-plan.template.md' && /^\.\/skills\/[a-z-]+\.md$/.test(href)) continue
      checked++
      try {
        const target = decodeURIComponent(href.split(/[?#]/)[0])
        const absolute = target.startsWith('/')
          ? path.join(root, target.slice(1))
          : path.resolve(root, path.dirname(file), target)
        if (!targetExists(absolute)) broken.push({ file, line, href })
      } catch {
        broken.push({ file, line, href })
      }
    }
  }
  return { checked, broken }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { checked, broken } = checkDocs()
  for (const { file, line, href } of broken) console.error(`${file}:${line}: missing local target ${href}`)
  process.stdout.write(`Documentation links: ${checked} checked, ${broken.length} broken\n`)
  if (broken.length) process.exitCode = 1
}

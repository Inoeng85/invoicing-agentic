#!/usr/bin/env node
/**
 * OR-01: Parse docs/PRD Development phase → .agentic/catalog/tasks.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PRD_ROOT = path.join(ROOT, 'docs/PRD')
const OUT_DIR = path.join(ROOT, '.agentic/catalog')

function walkDevPhases(dir) {
  let out = []
  for (let ent of fs.readdirSync(dir, { withFileTypes: true })) {
    let full = path.join(dir, ent.name)
    if (ent.isDirectory()) out.push(...walkDevPhases(full))
    else if (ent.name.endsWith('_Development_phase.md')) out.push(full)
  }
  return out.sort()
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/')
}

function epicFromPath(filePath) {
  let folder = path.basename(path.dirname(filePath))
  let m = folder.match(/^(\d{4})-/)
  return m ? m[1] : null
}

function readMetaGate(text) {
  let m = text.match(/\|\s*Gate\s*\|\s*\*\*([^*|]+)\*\*/i)
  return m ? m[1].trim() : null
}

function defaultVerify(text) {
  let m = text.match(/verify\s*=\s*`([^`]+)`/i) || text.match(/gate\s*=\s*`([^`]+)`/i)
  if (m) return m[1]
  m = text.match(/(npm run [^\n`]+(?:&&[^\n`]+)*)/)
  return m ? m[1].trim() : 'npm run typecheck && npm run test:domain && npm test'
}

function extractPathsFromFilesBlock(block) {
  let paths = []
  for (let m of block.matchAll(/`([^`]+)`/g)) {
    for (let part of m[1].split(/[;,]/)) {
      part = part.trim()
      if (!part || part.startsWith('feat/')) continue
      if (part.includes('/') || /\.(ts|tsx|prisma|md|sql|mjs|json|yaml|yml)$/.test(part)) paths.push(part)
    }
  }
  return [...new Set(paths)]
}

function parseReviewFocus(text) {
  let sec = text.match(/## Review Focus\s+([\s\S]*?)(?=\n## |\n---|\n### Task|$)/)
  if (!sec) return []
  let items = []
  for (let line of sec[1].split('\n')) {
    let m = line.match(/^\d+\.\s+\*\*(.+?)\*\*/)
    if (m) items.push(m[1].trim())
  }
  return items
}

function parseAgenticTasks(text, epic, devPhasePath, verifyDefault) {
  let tasks = []
  let parts = text.split(/^### Task (\d+):\s*/m)
  for (let i = 1; i < parts.length; i += 2) {
    let num = parts[i].padStart(2, '0')
    let body = parts[i + 1] || ''
    let titleLine = body.split('\n')[0].trim()
    let filesM = body.match(/\*\*Files:\*\*\s*([\s\S]*?)(?=\n\*\*|\n- \[ \]|\n###|$)/)
    let prodM = body.match(/\*\*Produces(?:[^*]*)?:\*\*\s*([\s\S]*?)(?=\n\*\*|\n- \[ \]|\n###|$)/)
    let files = filesM ? extractPathsFromFilesBlock(filesM[1]) : []
    let produces = prodM ? prodM[1].replace(/\s+/g, ' ').trim().slice(0, 2000) : ''
    let stepVerify = body.match(/`(npm run[^`]+)`/)?.[1]
    tasks.push({
      id: `${epic}-task-${num}`,
      epic,
      number: num,
      title: titleLine,
      area: inferArea(files, titleLine),
      style: 'agentic',
      agenticReady: files.length > 0,
      devPhasePath,
      files,
      produces,
      verify: stepVerify || verifyDefault,
    })
  }
  return tasks
}

function parseCompactTable(text, epic, devPhasePath, verifyDefault) {
  let tasks = []
  for (let line of text.split('\n')) {
    let m3 = line.match(/^\|\s*(\d{6}-[^\|]+)\s*\|\s*([^|]+)\|\s*(.+?)\s*\|$/)
    let m2 = line.match(/^\|\s*(\d{6}-[^\|]+)\s*\|\s*(.+?)\s*\|$/)
    let m = m3 || m2
    if (!m) continue
    let id, area, output
    if (m3) {
      ;[, id, area, output] = m3
    } else {
      ;[, id, output] = m2
      area = inferAreaFromId(id)
    }
    id = id.trim()
    area = area.trim()
    output = output.trim()
    if (id === 'Task' || id.includes('---')) continue
    if (!id.startsWith(epic)) continue
    let yy = id.slice(4, 6)
    tasks.push({
      id,
      epic,
      number: yy,
      title: output.replace(/^`|`$/g, '').slice(0, 120),
      area,
      style: 'compact',
      agenticReady: false,
      devPhasePath,
      files: [],
      produces: output,
      verify: verifyDefault,
      note: 'Perlu Development phase agentic (Files/Produces) sebelum orchestrator implement.',
    })
  }
  return tasks
}

function parsePlatformTasks(text, epic, devPhasePath) {
  let tasks = []
  let parts = text.split(/^### (\d{6}-[^\n]+)\s*$/m)
  for (let i = 1; i < parts.length; i += 2) {
    let id = parts[i].trim()
    let body = parts[i + 1] || ''
    if (!id.startsWith(epic)) continue
    let outputM = body.match(/\|\s*PS[^\n]*\|\s*[^\n]*\|\s*(.+?)\s*\|/)
    let verifyM = body.match(/\*\*Verifikasi:\*\*\s*([^\n]+)/)
    let yy = id.slice(4, 6)
    tasks.push({
      id,
      epic,
      number: yy,
      title: id.replace(/^\d{4}\d{2}-/, '').replace(/-/g, ' '),
      area: id.split('-')[1] || 'stack',
      style: 'platform',
      agenticReady: false,
      devPhasePath,
      files: [],
      produces: outputM ? outputM[1].trim() : '',
      verify: verifyM ? verifyM[1].trim() : 'npm run verify',
      note: 'Platform task — lihat Tahapan di canonical PRD-0000.',
    })
  }
  return tasks
}

function inferAreaFromId(id) {
  let kanonik = id.split('-')[1]
  if (kanonik && /^(stack|db|domain|be|fe|infra|docs)$/.test(kanonik)) return kanonik
  return 'stack'
}

function inferArea(files, title) {
  if (/schema|prisma|migration/i.test(title + files.join(' '))) return 'db'
  if (/domain/i.test(files.join(' ') + title)) return 'domain'
  if (/apps\/web|\.tsx|ui\//i.test(files.join(' '))) return 'fe'
  if (/apps\/api|controller/i.test(files.join(' '))) return 'be'
  if (/docs\//i.test(files.join(' '))) return 'docs'
  return 'stack'
}

function resolveDevPhaseSource(filePath, text) {
  if (epicFromPath(filePath) !== '0000') return filePath
  let link = text.match(/\]\(\.\.\/\.\.\/0000_platform_setup\/PRD_platform_setup_development_phase\.md\)/)
  if (link) return path.join(ROOT, 'docs/0000_platform_setup/PRD_platform_setup_development_phase.md')
  return filePath
}

function parseFile(filePath) {
  let epic = epicFromPath(filePath)
  if (!epic) return null
  let raw = fs.readFileSync(filePath, 'utf8')
  let sourcePath = resolveDevPhaseSource(filePath, raw)
  let text = sourcePath === filePath ? raw : fs.readFileSync(sourcePath, 'utf8')
  let devPhasePath = rel(sourcePath)
  let prdFolder = rel(path.dirname(filePath))
  let verifyDefault = defaultVerify(text)
  let reviewFocus = parseReviewFocus(text)

  let tasks = []
  if (epic === '0000' && sourcePath.includes('0000_platform_setup')) {
    tasks = parsePlatformTasks(text, epic, devPhasePath)
  } else if (/^### Task \d+:/m.test(text)) {
    tasks = parseAgenticTasks(text, epic, devPhasePath, verifyDefault)
  } else {
    tasks = parseCompactTable(text, epic, devPhasePath, verifyDefault)
  }

  return {
    epic,
    gate: readMetaGate(raw) || readMetaGate(text),
    prdFolder,
    devPhasePath,
    devPhaseMirror: rel(filePath),
    reviewFocus,
    taskCount: tasks.length,
    agenticReadyCount: tasks.filter((t) => t.agenticReady).length,
    tasks,
  }
}

function main() {
  fs.mkdirSync(path.join(OUT_DIR, 'epics'), { recursive: true })
  let files = walkDevPhases(PRD_ROOT)
  let epics = []
  let allTasks = []
  let errors = []

  for (let f of files) {
    try {
      let epic = parseFile(f)
      if (!epic || epic.tasks.length === 0) {
        errors.push({ file: rel(f), reason: 'Tidak ada task ter-parse' })
        continue
      }
      epics.push({
        epic: epic.epic,
        gate: epic.gate,
        prdFolder: epic.prdFolder,
        devPhasePath: epic.devPhasePath,
        devPhaseMirror: epic.devPhaseMirror,
        reviewFocus: epic.reviewFocus,
        taskCount: epic.taskCount,
        agenticReadyCount: epic.agenticReadyCount,
      })
      allTasks.push(...epic.tasks)
      fs.writeFileSync(path.join(OUT_DIR, 'epics', `${epic.epic}.json`), JSON.stringify(epic, null, 2) + '\n')
    } catch (e) {
      errors.push({ file: rel(f), reason: String(e.message || e) })
    }
  }

  epics.sort((a, b) => a.epic.localeCompare(b.epic))
  allTasks.sort((a, b) => a.id.localeCompare(b.id))

  let index = {
    generatedAt: new Date().toISOString(),
    source: 'docs/PRD/**/**/*Development_phase.md',
    epicCount: epics.length,
    taskCount: allTasks.length,
    agenticReadyCount: allTasks.filter((t) => t.agenticReady).length,
    epics,
    errors,
  }

  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2) + '\n')
  fs.writeFileSync(path.join(OUT_DIR, 'tasks.json'), JSON.stringify(allTasks, null, 2) + '\n')

  console.log(`Catalog: ${epics.length} epic, ${allTasks.length} task (${index.agenticReadyCount} agentic-ready)`)
  if (errors.length) {
    console.error('Parse warnings:', errors.length)
    for (let e of errors) console.error(`  ${e.file}: ${e.reason}`)
    process.exit(1)
  }
}

main()

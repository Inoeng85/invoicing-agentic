#!/usr/bin/env node
/**
 * Buat / rapikan plan.md + skills/* untuk semua task di intake-queue (138 task).
 *   npm run agentic:bootstrap-plans
 *   npm run agentic:bootstrap-plans -- --dry-run
 *   npm run agentic:bootstrap-plans -- --force   # tulis ulang isi (pertahankan dev/QA selesai)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadQueue, writePlanManifest } from './intake-pipeline.mjs'
import { phaseDirName, taskPlanBase } from './task-progress.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
const CATALOG_TASKS = path.join(ROOT, '.agentic/catalog/tasks.json')
const FEATURE_DIR = path.join(ROOT, 'docs/agentic/development/features')

const SKILL_TEMPLATES = {
  Backend: (task, section) => skillBody('Backend', task, section, 'Ubah kode backend/API sesuai Files PRD; jalankan test terkait.'),
  Frontend: (task, section) => skillBody('Frontend', task, section, 'Ubah UI/komponen sesuai Files PRD; cek tampilan dan a11y dasar.'),
  Infra: (task, section) => skillBody('Infra', task, section, 'Konfigurasi repo, env, CI, atau database sesuai PRD.'),
  Docs: (task, section) => skillBody('Docs', task, section, 'Dokumentasi, runbook, README — selaras PRD tanpa mengubah requirement produk.'),
  QA: (task, section) => skillBody('QA', task, section, 'Uji terkecil dari plan; verifikasi acceptance; laporkan pass/fail.'),
}

function parseArgs(argv) {
  const out = { dryRun: false, force: false }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--dry-run') out.dryRun = true
    else if (argv[i] === '--force') out.force = true
  }
  return out
}

function loadCatalogMap() {
  const list = JSON.parse(fs.readFileSync(CATALOG_TASKS, 'utf8'))
  return new Map(list.map((t) => [t.id, t]))
}

function taskSlug(id, epic) {
  if (id.startsWith(`${epic}-task-`)) return `task-${id.split('-').pop()}`
  const six = id.match(/^\d{6}-(.+)$/)
  if (six) return six[1]
  if (id.startsWith(`${epic}-`)) return id.slice(epic.length + 1)
  return id
}

function resolveFeatureId(task) {
  const { id, epic, area } = task
  const slug = taskSlug(id, epic)
  if (epic === '0000' && area === 'stack') return '0000-platform-stack'
  if (id === '000001-db-canonical-sqlite-path') return '0000-db-canonical-path'
  return `${epic}-${slug}`
}

function skillsForTask(task) {
  const area = task.area || 'stack'
  const map = {
    stack: ['Docs'],
    infra: ['Infra', 'Docs'],
    db: ['Infra', 'Docs', 'QA'],
    be: ['Backend', 'QA'],
    fe: ['Frontend', 'QA'],
    docs: ['Docs'],
    domain: ['Backend', 'Docs', 'QA'],
  }
  const base = map[area] || ['Docs']
  if (task.files?.length && area === 'be' && !base.includes('Backend')) return ['Backend', 'QA']
  if (task.files?.length && area === 'fe' && !base.includes('Frontend')) return ['Frontend', 'QA']
  return base
}

function extractPrdSection(task) {
  const fp = path.join(ROOT, task.devPhasePath)
  if (!fs.existsSync(fp)) return ''
  const text = fs.readFileSync(fp, 'utf8')
  const head = `### ${task.id}`
  if (text.includes(head)) {
    const start = text.indexOf(head)
    const tail = text.slice(start + head.length)
    const next = tail.search(/\n### [0-9]{6}-|\n### Task \d+:/)
    return (head + (next >= 0 ? tail.slice(0, next) : tail)).trim()
  }
  const num = Number.parseInt(task.number, 10)
  if (Number.isFinite(num)) {
    const re = new RegExp(
      `### Task ${num}:\\s*([\\s\\S]*?)(?=\\n### Task \\d+:|\\n## |\\n---\\s*$)`,
      'm',
    )
    const m = text.match(re)
    if (m) return `### Task ${num}\n${m[1].trim()}`
  }
  return ''
}

function cleanProduces(raw) {
  if (!raw) return '—'
  return raw.replace(/^\|\s*/, '').replace(/\s+/g, ' ').trim().slice(0, 500)
}

function penjelasanFromAgenticTask(body, task) {
  const filesM = body.match(/\*\*Files:\*\*\s*([\s\S]*?)(?=\n\*\*|\n- \[ \]|\n###|$)/)
  const prodM = body.match(/\*\*Produces(?:[^*]*)?:\*\*\s*([\s\S]*?)(?=\n\*\*|\n- \[ \]|\n###|$)/)
  const title = body.split('\n')[0]?.trim() || task.title
  const parts = [`${title} (PRD epic ${task.epic}).`]
  if (prodM) parts.push('', cleanProduces(prodM[1].replace(/\s+/g, ' ')))
  if (filesM) {
    const paths = [...filesM[1].matchAll(/`([^`]+)`/g)].map((m) => m[1])
    if (paths.length) {
      parts.push('', 'File utama:', ...paths.slice(0, 8).map((p) => `- \`${p}\``))
    }
  }
  return parts.join('\n')
}

function penjelasanFrom(task, section) {
  if (section && /^### Task /m.test(section)) {
    return penjelasanFromAgenticTask(section.replace(/^### Task \d+\s*\n?/, ''), task)
  }
  if (section) {
    const tahap = section.match(/\*\*Tahapan\*\*([\s\S]*?)(?=\n\*\*Verifikasi|\n\*\*Hasil|\n###|$)/i)
    if (tahap) {
      const lines = tahap[1]
        .split('\n')
        .map((l) => l.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean)
      if (lines.length) {
        const bullets = lines.map((l) => `- ${l}`).join('\n')
        return `${task.title} (PRD epic ${task.epic}).\n\n${bullets}`
      }
    }
    const out = section.match(/\|\s*PS[^\n]*\|\s*[^\n]*\|\s*(.+?)\s*\|/)
    if (out) return `${task.title}: ${out[1].trim()} (PRD epic ${task.epic}).`
  }
  const prod = cleanProduces(task.produces)
  if (prod !== '—') return `${task.title} — ${prod}.`
  if (task.note) return `${task.title}. ${task.note}`
  return `${task.title} sesuai Development phase epic ${task.epic}.`
}

function tujuanFrom(task, section) {
  const ver = section.match(/\*\*Verifikasi:\*\*\s*([^\n]+)/i)?.[1] || task.verify
  if (ver) return ver.replace(/\s+/g, ' ').trim()
  return `Artefak sesuai Produces/acceptance task ${task.id}.`
}

function relLink(fromDir, targetAbs) {
  return path.relative(fromDir, targetAbs).split(path.sep).join('/')
}

function parseExistingPlan(planPath) {
  if (!fs.existsSync(planPath)) return {}
  const text = fs.readFileSync(planPath, 'utf8')
  const out = {}
  if (/Status plan[^\n]*`defined`/i.test(text)) out.status = 'defined'
  else if (/Status plan[^\n]*`needs_human_clarify`/i.test(text)) out.status = 'needs_human_clarify'
  else if (/Status plan[^\n]*`draft`/i.test(text)) out.status = 'draft'

  const devBlock = text.match(/## Development\s+([\s\S]*?)(?=\n## |$)/)
  if (devBlock && /`complete`| `in_progress`/i.test(devBlock[1])) {
    out.devSection = devBlock[1].trim()
  }
  const qaBlock = text.match(/## QA\s+([\s\S]*?)(?=\n## |$)/)
  if (qaBlock && /`pass`| `fail`| `in_progress`/i.test(qaBlock[1])) {
    out.qaSection = qaBlock[1].trim()
  }
  return out
}

function buildPlanMarkdown({
  taskId,
  task,
  phaseRow,
  featureId,
  featureRel,
  status,
  devSection,
  qaSection,
  skills,
  section,
}) {
  const phaseNn = phaseDirName(phaseRow.ordinal)
  const title = task.title || taskId.replace(/^\d{6}-/, '').replace(/-/g, ' ')
  const includeQa = skills.includes('QA')
  const penjelasan = penjelasanFrom(task, section)
  const tujuan = tujuanFrom(task, section)
  const filesList =
    task.files?.length > 0
      ? task.files.map((f) => `- \`${f}\``).join('\n')
      : '— (lihat Development phase / Tahapan di PRD)'

  const skillRows = skills
    .map((s) => `| ${s} | [skills/${s.toLowerCase()}.md](./skills/${s.toLowerCase()}.md) |`)
    .join('\n')

  let devBlock = devSection
  if (!devBlock) devBlock = '| Status | `pending` |'
  else if (!devBlock.startsWith('|')) devBlock = devBlock.trim()

  let qaBlock = ''
  if (qaSection) qaBlock = `\n## QA\n\n${qaSection.trim()}\n`
  else if (includeQa) qaBlock = '\n## QA\n\n| Status | `pending` |\n'

  return `# Plan task — ${taskId}

| Field | Nilai |
|-------|-------|
| **Task ID** | ${taskId} |
| **Task** | ${title} |
| **Phase** | ${phaseRow.epic} / ${phaseNn} (${phaseRow.phaseId}) |
| **Status plan** | \`${status}\` |

## Penjelasan

${penjelasan}

## Tujuan

${tujuan}

## Feature

| Feature ID | Dokumen |
|------------|---------|
| \`${featureId}\` | [docs/agentic/development/features/${featureId}.md](${featureRel}) |

## Development

${devBlock}
${qaBlock}
## Skill yang digunakan

| Skill | File plan |
|-------|-----------|
${skillRows}

## Acuan PRD

- Development phase: \`${task.devPhasePath}\`
- **Produces:** ${cleanProduces(task.produces)}
- **Verifikasi:** ${(task.verify || '—').replace(/\s+/g, ' ').trim()}
- **Files:**
${filesList}

## Selesai bila (Plan)

- [ ] Penjelasan, Tujuan, Feature terisi tanpa \`[TBD]\`
- [ ] Setiap skill aktif punya file \`skills/{skill}.md\`
- [ ] Agent Development dapat mulai tanpa ambigu

## Ambigu / Human Clarify

—
`
}

function skillBody(name, task, section, intro) {
  const verify = section.match(/\*\*Verifikasi:\*\*\s*([^\n]+)/i)?.[1] || task.verify || '—'
  const files =
    task.files?.length > 0
      ? task.files.map((f) => `- \`${f}\``).join('\n')
      : '- (dari Tahapan / Files di Development phase)'
  return `# Skill ${name.toLowerCase()} — ${task.id}

${intro}

## Task

${task.title}

## Langkah

1. Baca plan task dan feature doc.
2. Kerjakan hanya dalam boundary file PRD/plan.
3. Catat perintah uji yang dijalankan.

## Verifikasi

${verify}

## Files

${files}
`
}

function ensureFeatureDoc(featureId, task, phaseRow, taskIdsUsing) {
  const fp = path.join(FEATURE_DIR, `${featureId}.md`)
  if (fs.existsSync(fp) && featureId === '0000-platform-stack') {
    updatePlatformStackFeature(fp, taskIdsUsing)
    return
  }
  if (fs.existsSync(fp)) return
  const slug = featureId.replace(/^\d{4}-/, '').replace(/-/g, ' ')
  const body = `# Feature — ${featureId}

| Field | Nilai |
|-------|-------|
| **Feature ID** | ${featureId} |
| **Nama** | ${slug} |
| **Epic** | ${task.epic} |
| **Task utama** | ${task.id} |

## Ringkasan

Boundary Development untuk task ${task.id} (epic ${task.epic}).

## File terkait (session boundary)

### Backend

- 

### Frontend

- 

### Docs / lainnya

${task.files?.length ? task.files.map((f) => `- \`${f}\``).join('\n') : '- (isi dari plan / PRD Files)'}

## Task plan yang memakai feature ini

| Task ID | Phase | Status dev |
|---------|-------|------------|
| ${task.id} | ${phaseRow.phaseId} | \`pending\` |

## Out of scope

- Task lain di epic yang tidak memakai feature ID ini.
`
  fs.mkdirSync(FEATURE_DIR, { recursive: true })
  fs.writeFileSync(fp, body)
}

function updatePlatformStackFeature(fp, taskIdsUsing) {
  let text = fs.readFileSync(fp, 'utf8')
  const rows = [...taskIdsUsing]
    .sort((a, b) => a.taskId.localeCompare(b.taskId))
    .map((e) => `| ${e.taskId} | ${e.phaseId} |`)
  const table = `| Task ID | Phase |\n|---------|-------|\n${rows.join('\n')}\n`
  if (text.includes('## Task plan yang memakai feature ini')) {
    text = text.replace(
      /## Task plan yang memakai feature ini[\s\S]*?(?=\n## |$)/,
      `## Task plan yang memakai feature ini\n\n${table}`,
    )
  } else {
    text += `\n## Task plan yang memakai feature ini\n\n${table}\n`
  }
  fs.writeFileSync(fp, text)
}

function main() {
  const opts = parseArgs(process.argv)
  const catalog = loadCatalogMap()
  const queue = loadQueue(ROOT)
  let written = 0
  let skipped = 0
  const platformStackTasks = []

  for (const phaseRow of queue.phases || []) {
    for (const taskId of phaseRow.taskIds || []) {
      const task = catalog.get(taskId)
      const base = taskPlanBase(ROOT, phaseRow.epic, phaseRow.ordinal, taskId)
      const planPath = path.join(base, 'plan.md')
      const existing = parseExistingPlan(planPath)

      if (!task) {
        console.warn(`  SKIP (no catalog): ${taskId}`)
        skipped++
        continue
      }

      const section = extractPrdSection(task)
      const featureId = resolveFeatureId(task)
      if (featureId === '0000-platform-stack') {
        platformStackTasks.push({ taskId, phaseId: phaseRow.phaseId })
      }

      const featureAbs = path.join(FEATURE_DIR, `${featureId}.md`)
      const featureRel = relLink(base, featureAbs)
      const skills = skillsForTask(task)
      let status = existing.status || 'defined'
      if (status === 'draft' || status === 'missing' || !existing.status) status = 'defined'

      const devSection = existing.devSection
      let qaSection = existing.qaSection
      if (!qaSection && skills.includes('QA')) qaSection = null

      const md = buildPlanMarkdown({
        taskId,
        task,
        phaseRow,
        featureId,
        featureRel,
        status,
        devSection: devSection || null,
        qaSection: qaSection || null,
        skills,
        section,
      })

      if (opts.dryRun) {
        written++
        continue
      }

      fs.mkdirSync(path.join(base, 'skills'), { recursive: true })
      for (const sk of skills) {
        const skPath = path.join(base, 'skills', `${sk.toLowerCase()}.md`)
        if (!fs.existsSync(skPath) || opts.force) {
          const fn = SKILL_TEMPLATES[sk] || SKILL_TEMPLATES.Docs
          fs.writeFileSync(skPath, fn(task, section))
        }
      }
      fs.writeFileSync(planPath, md)
      written++
    }

    if (!opts.dryRun) {
      writePlanManifest(ROOT, phaseRow)
    }
  }

  if (!opts.dryRun) {
    ensureFeatureDoc('0000-platform-stack', catalog.get('000001-stack-pin-node-runtime'), queue.phases[0], platformStackTasks)
    for (const phaseRow of queue.phases || []) {
      for (const taskId of phaseRow.taskIds || []) {
        const task = catalog.get(taskId)
        if (!task) continue
        const fid = resolveFeatureId(task)
        if (fid !== '0000-platform-stack') {
          ensureFeatureDoc(fid, task, phaseRow, [{ taskId, phaseId: phaseRow.phaseId }])
        }
      }
    }
  }

  console.log(
    `Bootstrap plans: ${written} task dir${opts.dryRun ? ' (dry-run)' : ''}, skipped ${skipped}, phases ${(queue.phases || []).length}`,
  )
}

main()

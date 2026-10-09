import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { checkDocs } from './check-docs.mjs'

function fixture(t, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'documentation-links-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(root, name)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content)
  }
  return root
}

test('resolves Markdown links, images, references, encoded paths, and repository paths', (t) => {
  const root = fixture(t, {
    'docs/README.md': '[Guide](guide.md#setup)\n![Image](image.svg?v=2)\n[Reference]: guide.md\n[Space](<a%20guide.md>)\n[Root](/docs/guide.md)',
    'docs/guide.md': '# Setup', 'docs/a guide.md': '# Guide', 'docs/image.svg': '<svg/>',
  })
  assert.deepEqual(checkDocs(root, ['docs/README.md']), { checked: 5, broken: [] })
})

test('reports missing Markdown and HTML targets with line numbers', (t) => {
  const root = fixture(t, {
    'docs/README.md': '# Docs\n[Missing](missing.md)',
    'docs/page.html': '<script src="missing.js"></script>',
  })
  assert.deepEqual(checkDocs(root, ['docs/README.md', 'docs/page.html']).broken, [
    { file: 'docs/README.md', line: 2, href: 'missing.md' },
    { file: 'docs/page.html', line: 1, href: 'missing.js' },
  ])
})

test('ignores external URLs, heading fragments, fenced examples, and known template placeholders', (t) => {
  const root = fixture(t, {
    'docs/README.md': '[Web](https://example.com) [Mail](mailto:maintainer@example.com) [Heading](#setup)\n```md\n[Example](missing.md)\n```',
    'docs/workflow/plans/_templates/task-plan.template.md': '[Backend](./skills/backend.md)',
  })
  assert.deepEqual(checkDocs(root, ['docs/README.md', 'docs/workflow/plans/_templates/task-plan.template.md']), { checked: 0, broken: [] })
})

test('checks dashboard data URLs after generated reports move', (t) => {
  const root = fixture(t, {
    'docs/workflow/dashboard/app.js': 'new URL("../../reports/workflow/board.json", window.location.href)',
    'docs/reports/workflow/board.json': '{}',
  })
  assert.deepEqual(checkDocs(root, ['docs/workflow/dashboard/app.js']), { checked: 1, broken: [] })
  fs.unlinkSync(path.join(root, 'docs/reports/workflow/board.json'))
  assert.equal(checkDocs(root, ['docs/workflow/dashboard/app.js']).broken.length, 1)
})

test('rejects filename and directory case mismatches on every operating system', (t) => {
  const root = fixture(t, {
    'docs/README.md': '[File](guide/SETUP.md)\n[Directory](Guide/setup.md)',
    'docs/guide/setup.md': '# Setup',
  })
  assert.equal(checkDocs(root, ['docs/README.md']).broken.length, 2)
})

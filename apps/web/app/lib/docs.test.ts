import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { documentationLink, renderDocumentation, resolveDocumentation, listDocumentation } from './docs.ts'

describe('documentation reader', () => {
  it('renders headings, tables, code, metadata, and relative documentation links', () => {
    const document = renderDocumentation('engineering/guide.md', '---\nstatus: draft\nreviewed: 2026-10-10\n---\n# Developer guide\n\n## Setup\n\n[Product](../product/brd.md#scope)\n\n| Command | Purpose |\n|---|---|\n| dev | Start |\n\n```ts\nconst x = 1\n```\n\n## Setup')
    assert.equal(document.title, 'Developer guide')
    assert.deepEqual(document.metadata, [{ name: 'status', value: 'draft' }, { name: 'reviewed', value: '2026-10-10' }])
    assert.match(document.html, /href="\/docs\/product\/brd.md#scope"/)
    assert.match(document.html, /<table>/)
    assert.match(document.html, /language-ts/)
    assert.deepEqual(document.headings.map((heading) => heading.id), ['developer-guide', 'setup', 'setup-1'])
  })

  it('escapes raw HTML and rejects executable Markdown URLs', () => {
    const document = renderDocumentation('README.md', '# Docs\n\n<script>alert(1)</script>\n\n[Unsafe](javascript:alert(1))\n\n![Unsafe](javascript:alert(1))')
    assert.ok(!document.html.includes('<script>'))
    assert.ok(!document.html.includes('href="javascript:'))
    assert.ok(!document.html.includes('src="javascript:'))
  })

  it('keeps directory links, assets, fragments, and external source links working', () => {
    assert.equal(documentationLink('product/README.md', 'legal/'), '/docs/product/legal/')
    assert.equal(documentationLink('product/README.md', '../design/prototype/index.html'), '/docs/design/prototype/index.html')
    assert.equal(documentationLink('README.md', '../apps/web/app/routes.ts'), 'https://github.com/Inoeng85/invoicing-agentic/blob/develop/apps/web/app/routes.ts')
    assert.equal(documentationLink('README.md', '#setup'), '#setup')
    assert.equal(documentationLink('README.md', 'https://example.com'), 'https://example.com')
  })

  it('lists nested documentation while rejecting hidden files, traversal, and escaping symlinks', async () => {
    const temporary = await mkdtemp(path.join(os.tmpdir(), 'documentation-reader-'))
    const root = path.join(temporary, 'docs')
    try {
      await mkdir(path.join(root, 'product'), { recursive: true })
      await writeFile(path.join(root, 'product/guide.md'), '# Guide')
      await writeFile(path.join(root, '.env'), 'private')
      await writeFile(path.join(temporary, 'outside.md'), 'outside')
      await symlink(path.join(temporary, 'outside.md'), path.join(root, 'escape.md'))
      const entries = await listDocumentation(root)
      assert.deepEqual(entries.map((entry) => entry.path), ['product', 'product/guide.md'])
      assert.ok(await resolveDocumentation('product/guide.md', root))
      for (const file of ['../outside.md', '.env', 'escape.md', 'missing.md', 'product/../../outside.md']) {
        assert.equal(await resolveDocumentation(file, root), null)
      }
    } finally {
      await rm(temporary, { recursive: true, force: true })
    }
  })
})

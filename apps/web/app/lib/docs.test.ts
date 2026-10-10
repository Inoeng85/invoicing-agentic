import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { adjacentDocumentation, documentationLink, groupDocumentation, renderDocumentation, resolveDocumentation, listDocumentation } from './docs.ts'

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

describe('documentation tree', () => {
  /** Shape `listDocumentation` returns: every directory first, then every file, each group sorted by path. */
  const entries = [
    { path: 'architecture', name: 'architecture', directory: true },
    { path: 'architecture/decisions', name: 'decisions', directory: true },
    { path: 'product', name: 'product', directory: true },
    { path: 'README.md', name: 'README.md', directory: false },
    { path: 'architecture/README.md', name: 'README.md', directory: false },
    { path: 'architecture/decisions/adr-0002-hosting.md', name: 'adr-0002-hosting.md', directory: false },
    { path: 'architecture/decisions/adr-0001-sqlite.md', name: 'adr-0001-sqlite.md', directory: false },
    { path: 'product/brd.md', name: 'brd.md', directory: false },
    { path: 'product/README.md', name: 'README.md', directory: false },
  ]

  it('nests entries and orders each level as README, then folders, then files', () => {
    const tree = groupDocumentation(entries)
    assert.deepEqual(tree.map((node) => node.path), ['README.md', 'architecture', 'product'])

    const architecture = tree.find((node) => node.path === 'architecture')!
    assert.deepEqual(architecture.children.map((node) => node.path), [
      'architecture/README.md',
      'architecture/decisions',
    ])
    assert.deepEqual(
      architecture.children.find((node) => node.path === 'architecture/decisions')!.children.map((node) => node.path),
      ['architecture/decisions/adr-0001-sqlite.md', 'architecture/decisions/adr-0002-hosting.md'],
    )
    assert.deepEqual(tree.find((node) => node.path === 'product')!.children.map((node) => node.path), [
      'product/README.md',
      'product/brd.md',
    ])
  })

  it('counts every file in a folder subtree so section badges do not rescan the list', () => {
    const tree = groupDocumentation(entries)
    assert.equal(tree.find((node) => node.path === 'architecture')!.fileCount, 3)
    assert.equal(tree.find((node) => node.path === 'product')!.fileCount, 2)
    assert.equal(tree.find((node) => node.path === 'README.md')!.fileCount, 0)
  })

  it('walks neighbours in sidebar reading order and stops at both ends', () => {
    assert.deepEqual(
      adjacentDocumentation(entries, 'architecture/README.md').next?.path,
      'architecture/decisions/adr-0001-sqlite.md',
    )
    assert.deepEqual(
      adjacentDocumentation(entries, 'architecture/decisions/adr-0001-sqlite.md').previous?.path,
      'architecture/README.md',
    )
    assert.deepEqual(adjacentDocumentation(entries, 'product/brd.md').previous?.path, 'product/README.md')

    const first = adjacentDocumentation(entries, 'README.md')
    assert.equal(first.previous, null)
    assert.equal(first.next?.path, 'architecture/README.md')

    const last = adjacentDocumentation(entries, 'product/brd.md')
    assert.equal(last.next, null)
  })

  it('reports no neighbours for a path that is not a document', () => {
    for (const file of ['', 'architecture', 'missing.md']) {
      assert.deepEqual(adjacentDocumentation(entries, file), { previous: null, next: null })
    }
  })
})

describe('documentation code blocks', () => {
  it('wraps a labelled fence in a figure with the language as its header', () => {
    const document = renderDocumentation('engineering/guide.md', '```ts\nconst x = 1\n```')
    assert.match(document.html, /<figure class="docs-code">/)
    assert.match(document.html, /<figcaption class="docs-code-title">ts<\/figcaption>/)
    assert.match(document.html, /<code class="language-ts">/)
    assert.match(document.html, /const x = 1/)
  })

  it('prefers an explicit title over the language label', () => {
    const titled = renderDocumentation('x.md', '```prisma title="schema.prisma"\nmodel User {}\n```')
    assert.match(titled.html, /<figcaption class="docs-code-title">schema\.prisma<\/figcaption>/)
    assert.match(titled.html, /<code class="language-prisma">/)
  })

  it('leaves an unlabelled fence without a header bar', () => {
    const plain = renderDocumentation('x.md', '```\nplain text\n```')
    assert.match(plain.html, /<figure class="docs-code">/)
    assert.ok(!plain.html.includes('docs-code-title'))
  })

  it('escapes the header label and keeps fence content escaped', () => {
    const nasty = renderDocumentation('x.md', '```ts title="<img src=x onerror=alert(1)>"\n<script>alert(1)</script>\n```')
    assert.ok(!nasty.html.includes('<img src=x'))
    assert.ok(!nasty.html.includes('<script>alert(1)</script>'))
    assert.match(nasty.html, /&lt;img/)
  })

  it('still renders inline code and indented code outside the figure wrapper', () => {
    const document = renderDocumentation('x.md', 'Use `npm run dev` to start.')
    assert.match(document.html, /<code>npm run dev<\/code>/)
    assert.ok(!document.html.includes('docs-code'))
  })
})

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createController } from 'remix/router'
import type { RenderFunction } from 'remix/middleware/render'
import { detectContentType } from 'remix/mime'
import { unsafeHTML, type Handle } from 'remix/component'

import { Document } from '../document.tsx'
import { APP_NAME } from '../../lib/brand.ts'
import { docsHref, listDocumentation, readDocumentation, resolveDocumentation, type DocumentationContent, type DocumentationEntry } from '../../lib/docs.ts'
import { routes } from '../../routes.ts'

const SECTIONS: Record<string, { title: string; description: string }> = {
  product: { title: 'Produk', description: 'BRD, requirement, scope, dan legal.' },
  architecture: { title: 'Arsitektur', description: 'Arsitektur sistem dan keputusan teknis.' },
  engineering: { title: 'Engineering', description: 'Setup, API, implementasi, dan pengujian.' },
  design: { title: 'Desain', description: 'Guideline, komponen, dan prototype.' },
  operations: { title: 'Operasional', description: 'Deployment, runbook, dan rilis.' },
  workflow: { title: 'Workflow', description: 'Proses, backlog, plan, dan laporan task.' },
  reports: { title: 'Laporan', description: 'Snapshot dan hasil pemeriksaan otomatis.' },
  archive: { title: 'Arsip', description: 'Bukti task selesai dan sesi terdahulu.' },
}

async function documentationResponse(context: { url: URL; render: RenderFunction }, file: string) {
  file = file.replace(/\/+$/, '')
  const resolved = await resolveDocumentation(file)
  if (!resolved) return context.render(<DocsPage file={file} entries={[]} missing />, { status: 404 })
  if (!resolved.directory && (!file.endsWith('.md') || context.url.searchParams.get('raw') === '1')) {
    return new Response(new Uint8Array(await readFile(resolved.absolute)), {
      headers: { 'Content-Type': file.endsWith('.md') ? 'text/plain; charset=utf-8' : detectContentType(file) ?? 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
    })
  }
  const entries = await listDocumentation()
  const contentPath = resolved.directory ? path.posix.join(file, 'README.md') : file
  const content = await readDocumentation(contentPath)
  return context.render(<DocsPage file={file} entries={entries} content={content} directory={resolved.directory} query={context.url.searchParams.get('q')?.trim() ?? ''} />)
}

export default createController(routes.docs, {
  actions: {
    index(context) { return documentationResponse(context, '') },
    show(context) { return documentationResponse(context, context.params.path) },
  },
})

interface DocsPageProps {
  file: string
  entries: DocumentationEntry[]
  content?: DocumentationContent | null
  directory?: boolean
  query?: string
  missing?: boolean
}

function DocsPage(handle: Handle<DocsPageProps>) {
  return () => {
    const { file, entries, content, directory, query = '', missing } = handle.props
    const folder = directory ? file : path.posix.dirname(file) === '.' ? '' : path.posix.dirname(file)
    const files = entries.filter((entry) => !entry.directory)
    const visible = query
      ? files.filter((entry) => entry.path.toLowerCase().includes(query.toLowerCase()))
      : entries.filter((entry) => path.posix.dirname(entry.path) === (folder || '.'))
    const title = missing ? 'Dokumen tidak ditemukan' : query ? `Hasil pencarian: ${query}` : content?.title ?? (path.posix.basename(file) || 'Dokumentasi')
    const segments = file.split('/').filter(Boolean)
    return (
      <Document title={`${title} — ${APP_NAME}`}>
        <header class="border-b bg-background">
          <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <a href={routes.docs.index.href()} class="text-lg font-semibold tracking-tight">{APP_NAME} <span class="text-muted-foreground">/ Dokumentasi</span></a>
            <a href={routes.home.href()} class="btn btn-outline btn-sm">Buka aplikasi</a>
          </div>
        </header>
        <div class="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside class="space-y-6">
            <form action={routes.docs.index.href()} method="get" role="search" class="space-y-2">
              <label for="docs-search" class="text-sm font-medium">Cari dokumentasi</label>
              <input id="docs-search" name="q" type="search" value={query} placeholder="Nama atau path dokumen" class="input w-full" />
              <button type="submit" class="btn btn-outline btn-sm w-full">Cari</button>
            </form>
            <nav aria-label="Bagian dokumentasi" class="grid grid-cols-2 gap-1 lg:block lg:space-y-1">
              <a href={docsHref()} class="nav-link block" aria-current={!file && !query ? 'page' : undefined}>Semua dokumentasi</a>
              {Object.entries(SECTIONS).map(([key, section]) => (
                <a key={key} href={docsHref(key)} class="nav-link flex justify-between gap-2" aria-current={file.split('/')[0] === key ? 'page' : undefined}>
                  <span>{section.title}</span><span class="text-xs text-muted-foreground">{files.filter((entry) => entry.path.startsWith(`${key}/`)).length}</span>
                </a>
              ))}
            </nav>
          </aside>
          <main id="docs-content" class="min-w-0 space-y-8">
            <nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <a href={docsHref()} class="hover:underline">Docs</a>
              {segments.map((segment, index) => <span key={index}> / <a href={docsHref(segments.slice(0, index + 1).join('/'))} class="break-all hover:underline">{segment}</a></span>)}
            </nav>
            {missing ? <section class="card"><h1 class="text-2xl font-semibold">{title}</h1><p>Dokumen ini tidak tersedia.</p><a class="text-primary underline" href={docsHref()}>Kembali ke dokumentasi</a></section> : <>
              {!query && content ? <>
                <div class="flex flex-wrap items-center justify-between gap-3 border-b pb-4 text-sm text-muted-foreground">
                  <p class="break-all">{directory ? path.posix.join(file, 'README.md') : file}</p>
                  <a class="btn btn-outline btn-sm" href={`${docsHref(directory ? path.posix.join(file, 'README.md') : file)}?raw=1`}>Lihat sumber</a>
                </div>
                {content.metadata.length > 0 ? <dl class="flex flex-wrap gap-x-6 gap-y-3 rounded-xl border bg-muted/30 p-4 text-sm">{content.metadata.map((item) => <div key={item.name}><dt class="text-xs text-muted-foreground">{item.name}</dt><dd class="font-medium">{item.value}</dd></div>)}</dl> : null}
                {content.headings.filter((heading) => heading.level === 2).length > 0 ? <details class="rounded-xl border p-4"><summary class="cursor-pointer text-sm font-medium">Daftar isi</summary><nav aria-label="Daftar isi" class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">{content.headings.filter((heading) => heading.level === 2).map((heading) => <a key={heading.id} href={`#${heading.id}`} class="text-primary hover:underline">{heading.title}</a>)}</nav></details> : null}
                <article class="docs-markdown" innerHTML={unsafeHTML(content.html)} />
              </> : <h1 class="text-3xl font-semibold tracking-tight">{title}</h1>}
              {directory || query ? <section class="space-y-4" aria-label="Daftar dokumen">
                <div class="flex items-center justify-between gap-4"><h2 class="text-xl font-semibold">{query ? `${visible.length} hasil` : 'Isi folder'}</h2><span class="text-sm text-muted-foreground">{query ? 'Pencarian seluruh dokumentasi' : `${visible.length} item`}</span></div>
                {visible.length === 0 ? <p class="rounded-xl border p-6 text-muted-foreground">Tidak ada dokumen yang cocok.</p> : <ul class="grid gap-3 sm:grid-cols-2">{visible.map((entry) => <li key={entry.path}><a href={docsHref(entry.path)} class="block h-full rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"><span class="block break-all font-medium">{SECTIONS[entry.path]?.title ?? entry.name}{entry.directory ? '/' : ''}</span><span class="mt-1 block break-all text-xs text-muted-foreground">{SECTIONS[entry.path]?.description ?? entry.path}</span></a></li>)}</ul>}
              </section> : null}
            </>}
          </main>
        </div>
      </Document>
    )
  }
}

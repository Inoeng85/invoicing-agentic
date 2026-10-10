import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createController } from 'remix/router'
import type { RenderFunction } from 'remix/middleware/render'
import { detectContentType } from 'remix/mime'
import { unsafeHTML, type Handle } from 'remix/component'

import { Document } from '../document.tsx'
import { APP_NAME } from '../../lib/brand.ts'
import {
  adjacentDocumentation,
  docsHref,
  groupDocumentation,
  listDocumentation,
  readDocumentation,
  resolveDocumentation,
  type DocumentationContent,
  type DocumentationEntry,
} from '../../lib/docs.ts'
import {
  docsBreadcrumb,
  docsEntryCard,
  docsHeader,
  docsLanding,
  docsMetadata,
  docsPager,
  docsSidebar,
  docsToc,
} from '../../ui/docs-shell.tsx'
import { icon } from '../../ui/icons.tsx'
import { routes } from '../../routes.ts'

async function documentationResponse(context: { url: URL; render: RenderFunction }, file: string) {
  file = file.replace(/\/+$/, '')
  const resolved = await resolveDocumentation(file)
  if (!resolved) return context.render(<DocsPage file={file} entries={[]} contentPath={file} missing />, { status: 404 })
  if (!resolved.directory && (!file.endsWith('.md') || context.url.searchParams.get('raw') === '1')) {
    return new Response(new Uint8Array(await readFile(resolved.absolute)), {
      headers: {
        'Content-Type': file.endsWith('.md')
          ? 'text/plain; charset=utf-8'
          : detectContentType(file) ?? 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }
  const entries = await listDocumentation()
  const contentPath = resolved.directory ? path.posix.join(file, 'README.md') : file
  const content = await readDocumentation(contentPath)
  return context.render(
    <DocsPage
      file={file}
      entries={entries}
      content={content}
      contentPath={contentPath}
      directory={resolved.directory}
      query={context.url.searchParams.get('q')?.trim() ?? ''}
    />,
  )
}

export default createController(routes.docs, {
  actions: {
    index(context) {
      return documentationResponse(context, '')
    },
    show(context) {
      return documentationResponse(context, context.params.path)
    },
  },
})

interface DocsPageProps {
  file: string
  entries: DocumentationEntry[]
  contentPath: string
  content?: DocumentationContent | null
  directory?: boolean
  query?: string
  missing?: boolean
}

function DocsPage(handle: Handle<DocsPageProps>) {
  return () => {
    const { file, entries, contentPath, content, directory, query = '', missing } = handle.props
    const folder = directory ? file : path.posix.dirname(file) === '.' ? '' : path.posix.dirname(file)
    const files = entries.filter((entry) => !entry.directory)
    const visible = query
      ? files.filter((entry) => entry.path.toLowerCase().includes(query.toLowerCase()))
      : entries.filter((entry) => path.posix.dirname(entry.path) === (folder || '.'))
    const title = missing
      ? 'Dokumen tidak ditemukan'
      : query
        ? `Hasil pencarian: ${query}`
        : (content?.title ?? (path.posix.basename(file) || 'Dokumentasi'))
    const tree = groupDocumentation(entries)
    const landing = !file && !query && !missing
    const { previous, next } = query ? { previous: null, next: null } : adjacentDocumentation(entries, contentPath)

    return (
      <Document title={`${title} — ${APP_NAME}`}>
        <div class="docs-workspace min-h-dvh bg-page text-foreground">
          {docsHeader(query)}
          <div class="mx-auto grid max-w-[96rem] gap-6 px-3 py-4 sm:px-5 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_12rem] data-[landing=true]:xl:grid-cols-[14rem_minmax(0,1fr)]" data-landing={landing ? 'true' : 'false'}>
            <aside class="hidden lg:block" aria-label="Navigasi utama">
              <div class="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-3 pb-6">
                {docsSidebar({ file, query, tree })}
              </div>
            </aside>

            <main id="docs-content" tabindex={-1} class="min-w-0 space-y-8 rounded-2xl border bg-card px-4 py-7 outline-none sm:px-8 sm:py-10 xl:px-10">
              {landing ? docsLanding(tree) : <>
                <div class="flex flex-wrap items-center justify-between gap-3">
                  {docsBreadcrumb(file)}
                  {!query && content ? <a class="btn btn-ghost btn-sm text-muted-foreground" href={`${docsHref(contentPath)}?raw=1`}>
                    {icon('file-text')} Lihat sumber
                  </a> : null}
                </div>

                {missing ? (
                  <section class="card gap-5 py-10 shadow-none">
                    <div class="card-header">
                      <span class="mb-2 grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground">{icon('search', 'size-5')}</span>
                      <h1 class="card-title text-2xl">{title}</h1>
                      <p class="card-description">Dokumen ini tidak tersedia. Jelajahi bagian lain dari pusat dokumentasi.</p>
                    </div>
                    <div class="card-content">
                      <a class="btn btn-outline btn-sm" href={docsHref()}>
                        Kembali ke dokumentasi
                      </a>
                    </div>
                  </section>
                ) : (
                  <>
                    {!query && content ? (
                      <section class="docs-reader">
                        <div class="mb-7 space-y-4 border-b pb-5">
                          <p class="font-mono text-xs leading-5 text-muted-foreground [overflow-wrap:anywhere]">{contentPath}</p>
                          {docsMetadata(content.metadata)}
                        </div>
                        {content.headings.some((heading) => heading.level === 2 || heading.level === 3) ? <details class="mb-7 rounded-lg border bg-muted/30 p-4 xl:hidden">
                          <summary class="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium">Daftar isi {icon('chevron-down', 'size-4')}</summary>
                          <div class="mt-3">{docsToc(content.headings)}</div>
                        </details> : null}
                        <article class="docs-markdown" innerHTML={unsafeHTML(content.html)} />
                      </section>
                    ) : (
                      <div class="space-y-3 pt-3">
                        <span class="badge badge-outline bg-background text-muted-foreground">{query ? 'Pencarian' : 'Dokumentasi'}</span>
                        <h1 class="text-3xl leading-tight font-semibold text-balance [overflow-wrap:anywhere]">{title}</h1>
                        {query ? <p class="text-sm text-pretty text-muted-foreground">Temukan dokumen berdasarkan nama atau lokasi file.</p> : null}
                      </div>
                    )}

                    {directory || query ? (
                      <section class="space-y-4" aria-label="Daftar dokumen">
                        <div class="flex items-center justify-between gap-4 border-t pt-6">
                          <h2 class="text-lg font-semibold">{query ? `${visible.length} hasil` : 'Isi folder'}</h2>
                          <span class="text-sm text-muted-foreground">
                            {query ? 'Pencarian seluruh dokumentasi' : `${visible.length} item`}
                          </span>
                        </div>
                        {visible.length === 0 ? (
                          <div class="card items-center gap-3 px-6 py-12 text-center shadow-none">
                            <span class="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">{icon('search', 'size-5')}</span>
                            <p class="font-medium">Tidak ada dokumen yang cocok.</p>
                            <p class="text-sm text-pretty text-muted-foreground">Coba kata kunci lain, atau jelajahi seluruh dokumentasi.</p>
                            <a href={docsHref()} class="btn btn-outline btn-sm mt-2">Jelajahi dokumentasi</a>
                          </div>
                        ) : (
                          <ul class="grid gap-3 sm:grid-cols-2">
                            {visible.map((entry) => (
                              <li key={entry.path}>{docsEntryCard(entry)}</li>
                            ))}
                          </ul>
                        )}
                      </section>
                    ) : null}

                    {docsPager(previous, next)}
                  </>
                )}
              </>}
              <footer class="flex flex-wrap items-center justify-between gap-3 border-t pt-6 pb-2 text-xs text-muted-foreground">
                <span>{APP_NAME} / Dokumentasi</span>
                <a href={docsHref('engineering/contributing.md')} class="inline-flex items-center gap-1.5 hover:text-primary">Panduan kontribusi {icon('arrow-right', 'size-3.5')}</a>
              </footer>
            </main>

            {!landing ? <aside class="hidden xl:block">
              <div class="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6">
                {!query && content ? docsToc(content.headings) : null}
              </div>
            </aside> : null}
          </div>

          <div id="docs-nav" popover="auto" class="docs-mobile-nav sheet lg:hidden" aria-label="Daftar dokumentasi">
            <div class="flex items-center justify-between border-b pb-4">
              <span class="font-semibold">Dokumentasi</span>
              <button
                type="button"
                class="btn btn-ghost btn-icon btn-sm"
                popovertarget="docs-nav"
                popovertargetaction="hide"
                aria-label="Tutup"
              >
                {icon('x')}
              </button>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto">{docsSidebar({ file, query, tree })}</div>
          </div>
        </div>
      </Document>
    )
  }
}

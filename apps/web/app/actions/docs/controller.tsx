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
    const { previous, next } = query ? { previous: null, next: null } : adjacentDocumentation(entries, contentPath)

    return (
      <Document title={`${title} — ${APP_NAME}`}>
        {docsHeader(query)}
        <div class="mx-auto grid max-w-[88rem] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_14rem]">
          <aside class="hidden lg:block">
            <div class="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto pr-2 pb-6">
              {docsSidebar({ file, query, tree })}
            </div>
          </aside>

          <main id="docs-content" class="min-w-0 space-y-6">
            {docsBreadcrumb(file)}

            {missing ? (
              <section class="card">
                <div class="card-header">
                  <h1 class="card-title text-2xl">{title}</h1>
                  <p class="card-description">Dokumen ini tidak tersedia.</p>
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
                  <>
                    <div class="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                      <p class="min-w-0 truncate font-mono text-xs text-muted-foreground">{contentPath}</p>
                      <a class="btn btn-outline btn-sm" href={`${docsHref(contentPath)}?raw=1`}>
                        Lihat sumber
                      </a>
                    </div>
                    {docsMetadata(content.metadata)}
                    <details class="rounded-xl border p-4 xl:hidden">
                      <summary class="cursor-pointer text-sm font-medium">Daftar isi</summary>
                      <div class="mt-3">{docsToc(content.headings)}</div>
                    </details>
                    <article class="docs-markdown" innerHTML={unsafeHTML(content.html)} />
                  </>
                ) : (
                  <h1 class="text-3xl font-semibold tracking-tight">{title}</h1>
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
                      <p class="rounded-xl border p-6 text-muted-foreground">Tidak ada dokumen yang cocok.</p>
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
          </main>

          <aside class="hidden xl:block">
            <div class="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto pb-6">
              {!query && content ? docsToc(content.headings) : null}
            </div>
          </aside>
        </div>

        <div id="docs-nav" popover="auto" class="sheet lg:hidden" aria-label="Daftar dokumentasi">
          <div class="flex items-center justify-between">
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
      </Document>
    )
  }
}

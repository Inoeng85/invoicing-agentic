import { APP_NAME } from '../lib/brand.ts'
import {
  docsHref,
  type DocumentationContent,
  type DocumentationEntry,
  type DocumentationNode,
} from '../lib/docs.ts'
import { SearchShortcut } from '../actions/public/search-shortcut.tsx'
import { routes } from '../routes.ts'
import { icon, type IconName } from './icons.tsx'

export const DOC_SECTIONS: Record<string, { title: string; description: string; icon: IconName }> = {
  product: { title: 'Produk', description: 'Kenali kebutuhan, ruang lingkup, dan arah produk.', icon: 'receipt' },
  architecture: { title: 'Arsitektur', description: 'Pahami sistem dan keputusan di balik implementasi.', icon: 'layout-grid' },
  engineering: { title: 'Engineering', description: 'Siapkan environment, integrasi API, dan pengujian.', icon: 'settings' },
  design: { title: 'Desain', description: 'Jelajahi guideline, komponen UI, dan prototype.', icon: 'pencil' },
  operations: { title: 'Operasional', description: 'Panduan deployment, runbook, dan persiapan rilis.', icon: 'shield-check' },
  workflow: { title: 'Workflow', description: 'Ikuti proses kerja, backlog, dan rencana pengembangan.', icon: 'list' },
  reports: { title: 'Laporan', description: 'Telusuri snapshot dan hasil pemeriksaan otomatis.', icon: 'file-text' },
  archive: { title: 'Arsip', description: 'Temukan riwayat task dan catatan sesi sebelumnya.', icon: 'clock' },
}

const DOC_GROUPS = [
  { title: 'Bangun', sections: ['product', 'architecture', 'engineering', 'design'] },
  { title: 'Jalankan', sections: ['operations', 'workflow'] },
  { title: 'Referensi', sections: ['reports', 'archive'] },
] as const

/** Frontmatter `status` reuses the invoice badge variants so docs match the rest of the app. */
const STATUS_BADGE: Record<string, string> = {
  approved: 'badge-paid',
  draft: 'badge-draft',
  archived: 'badge-cancelled',
}

export function docLabel(name: string): string {
  return name === 'README.md' ? 'Ikhtisar' : name.replace(/\.md$/, '')
}

export function docsHeader(query: string) {
  return (
    <header class="docs-header sticky top-0 z-40 border-b bg-background">
      <a href="#docs-content" class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2">
        Lewati ke konten
      </a>
      <div class="mx-auto flex min-h-20 max-w-[96rem] flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-6">
        <button
          type="button"
          class="btn btn-ghost btn-icon btn-sm lg:hidden"
          popovertarget="docs-nav"
          aria-label="Buka daftar dokumentasi"
        >
          {icon('menu')}
        </button>
        <a href={docsHref()} class="flex shrink-0 items-center gap-2.5 font-semibold">
          <span class="grid size-8 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
            {icon('book-open', 'size-4')}
          </span>
          <span class="text-base">{APP_NAME}</span>
        </a>
        <span class="hidden items-center gap-3 text-lg font-semibold sm:inline-flex"><span class="font-normal text-muted-foreground">/</span> docs</span>
        <form action={docsHref()} method="get" role="search" class="order-last w-full sm:order-none sm:ml-auto sm:max-w-sm">
          <label for="docs-search" class="sr-only">
            Cari dokumentasi
          </label>
          <div class="input-group rounded-lg border-border bg-card shadow-none">
            <span class="input-addon bg-transparent pr-0 text-muted-foreground">{icon('search', 'size-4')}</span>
            <input
              id="docs-search"
              name="q"
              type="search"
              value={query}
              placeholder="Cari panduan dan referensi…"
              class="input"
            />
            <SearchShortcut target="docs-search" />
          </div>
        </form>
        <a class="btn btn-sm ml-auto shrink-0 rounded-lg bg-foreground text-background hover:bg-foreground/90 sm:ml-0" href={routes.home.href()} aria-label="Buka aplikasi">
          <span class="hidden sm:inline">Buka aplikasi</span>
          {icon('arrow-right')}
        </a>
      </div>
    </header>
  )
}

/**
 * Only folders on the path to the current document expand; the rest stay links.
 * `docs/workflow` alone holds hundreds of files, so rendering whole subtrees is not an option.
 */
function docsTree(nodes: DocumentationNode[], file: string) {
  return (
    <ul class="docs-tree">
      {nodes.map((node) => {
        const open = node.directory && (file === node.path || file.startsWith(`${node.path}/`))
        return (
          <li key={node.path}>
            <a
              href={docsHref(node.path)}
              class="sidebar-link justify-between"
              aria-current={file === node.path ? 'page' : undefined}
            >
              <span class="flex min-w-0 items-center gap-2">
                {node.directory ? icon(open ? 'chevron-down' : 'chevron-right', 'docs-tree-chevron') : null}
                <span class="truncate">{docLabel(node.name)}</span>
              </span>
              {node.directory ? <span class="tabs-count">{node.fileCount}</span> : null}
            </a>
            {open ? docsTree(node.children, file) : null}
          </li>
        )
      })}
    </ul>
  )
}

/** Only the open section renders its subtree — the full library is ~900 files. */
export function docsSidebar(options: { file: string; query: string; tree: DocumentationNode[] }) {
  const { file, query, tree } = options
  const openSection = file.split('/')[0] ?? ''
  return (
    <nav aria-label="Bagian dokumentasi" class="grid gap-1">
      <p class="docs-group-label">Mulai</p>
      <a href={docsHref()} class="sidebar-link" aria-current={!file && !query ? 'page' : undefined}>
        {icon('book-open')}
        Mulai di sini
      </a>
      <a href={docsHref('README.md')} class="sidebar-link" aria-current={file === 'README.md' ? 'page' : undefined}>
        {icon('file-text')}
        Ikhtisar proyek
      </a>
      {DOC_GROUPS.map((group) => (
        <div key={group.title} class="mt-6 grid gap-1">
          <p class="docs-group-label">{group.title}</p>
          {group.sections.map((key) => {
            const section = DOC_SECTIONS[key]!
            const node = tree.find((entry) => entry.path === key)
            return (
              <div key={key} class="grid gap-0.5">
                <a
                  href={docsHref(key)}
                  class="sidebar-link justify-between"
                  aria-current={file === key ? 'page' : undefined}
                >
                  <span class="flex min-w-0 items-center gap-2.5">
                    {icon(section.icon)}
                    <span class="truncate">{section.title}</span>
                  </span>
                  <span class="tabs-count">{node?.fileCount ?? 0}</span>
                </a>
                {openSection === key && node ? docsTree(node.children, file) : null}
              </div>
            )
          })}
        </div>
      ))}
      <div class="mt-7 border-t px-2.5 pt-5">
        <a href={docsHref('engineering/contributing.md')} class="flex items-center justify-between gap-2 text-sm font-medium hover:text-primary">
          Panduan kontribusi {icon('arrow-right', 'size-4')}
        </a>
        <p class="mt-2 text-xs leading-5 text-pretty text-muted-foreground">Mulai berkontribusi dengan alur kerja yang tepat.</p>
      </div>
    </nav>
  )
}

export function docsBreadcrumb(file: string) {
  const segments = file.split('/').filter(Boolean)
  return (
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <a href={docsHref()} class="inline-flex items-center gap-1.5">{icon('book-open', 'size-3.5')} Docs</a>
      {segments.map((segment, index) => (
        <span key={index} class="flex items-center gap-1.5">
          {icon('chevron-right')}
          <a href={docsHref(segments.slice(0, index + 1).join('/'))} class="break-all" aria-current={index === segments.length - 1 ? 'page' : undefined}>
            {DOC_SECTIONS[segment]?.title ?? docLabel(segment)}
          </a>
        </span>
      ))}
    </nav>
  )
}

export function docsToc(headings: DocumentationContent['headings']) {
  const items = headings.filter((heading) => heading.level === 2 || heading.level === 3)
  if (items.length === 0) return null
  return (
    <nav aria-label="Daftar isi" class="grid gap-0.5">
      <p class="mb-3 text-xs font-semibold text-foreground">Di halaman ini</p>
      {items.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          class={`docs-toc-link ${heading.level === 3 ? 'docs-toc-link-nested' : ''}`}
        >
          {heading.title}
        </a>
      ))}
    </nav>
  )
}

export function docsMetadata(metadata: DocumentationContent['metadata']) {
  if (metadata.length === 0) return null
  const status = metadata.find((item) => item.name === 'status')
  return (
    <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      {status ? <span class={`badge ${STATUS_BADGE[status.value] ?? 'badge-outline'}`}>{status.value}</span> : null}
      {metadata
        .filter((item) => item !== status)
        .map((item) => (
          <span key={item.name} class="text-muted-foreground">
            {item.name}: <span class="font-medium text-foreground">{item.value}</span>
          </span>
        ))}
    </div>
  )
}

export function docsEntryCard(entry: DocumentationEntry, fileCount?: number) {
  const section = DOC_SECTIONS[entry.path]
  return (
    <a
      href={docsHref(entry.path)}
      class="docs-entry-card card group h-full flex-row items-start gap-3 rounded-xl border-border bg-background/70 p-4 shadow-none hover:border-primary/40 hover:bg-accent"
    >
      <span class="grid size-10 shrink-0 place-items-center rounded-lg border bg-background text-primary">
        {icon(section?.icon ?? (entry.directory ? 'folder' : 'file-text'), 'size-4')}
      </span>
      <div class="min-w-0 flex-1 space-y-1">
        <h3 class="text-sm font-semibold text-balance [overflow-wrap:anywhere]">{section?.title ?? docLabel(entry.name)}</h3>
        <p class="card-description text-xs leading-5 text-pretty [overflow-wrap:anywhere]">{section?.description ?? entry.path}</p>
        {fileCount !== undefined ? <p class="pt-1 text-xs text-muted-foreground"><span class="tabular-nums">{fileCount}</span> dokumen</p> : null}
      </div>
      {icon('arrow-right', 'mt-1 size-4 shrink-0 text-primary')}
    </a>
  )
}

export function docsLanding(tree: DocumentationNode[]) {
  const groups = [
    { title: 'Bangun', description: 'Pahami produk, rancang sistem, dan mulai implementasi.', sections: DOC_GROUPS[0].sections },
    { title: 'Jalankan & kelola', description: 'Siapkan rilis, ikuti workflow, dan telusuri hasil kerja.', sections: [...DOC_GROUPS[1].sections, ...DOC_GROUPS[2].sections] },
  ]
  return (
    <div class="space-y-10">
      <section>
        <div class="flex flex-wrap items-start justify-between gap-5">
          <h1 class="max-w-2xl text-3xl leading-tight font-semibold text-balance sm:text-4xl">
            Mulai dengan {APP_NAME}
          </h1>
          <a href={`${docsHref('README.md')}?raw=1`} class="btn btn-outline btn-sm rounded-lg">
            {icon('file-text')} Lihat Markdown
          </a>
        </div>
        <p class="mt-6 max-w-3xl text-base leading-7 text-pretty text-muted-foreground">
          Panduan lengkap untuk memahami produk, membangun aplikasi, dan menyiapkan rilis. Mulai dari <a href={docsHref('engineering/contributing.md')} class="font-medium text-foreground underline decoration-primary/50 underline-offset-4 hover:text-primary">panduan kontribusi</a> atau jelajahi dokumentasi sesuai kebutuhan Anda.
        </p>
      </section>

      <div class="grid gap-5 xl:grid-cols-2">
        {groups.map((group, index) => (
          <section key={group.title} class="docs-feature-panel rounded-2xl border p-4 sm:p-6" aria-labelledby={`docs-group-${index}`}>
            <h2 id={`docs-group-${index}`} class="text-lg font-semibold text-balance">{group.title}</h2>
            <p class="mt-2 mb-5 text-sm leading-6 text-pretty text-muted-foreground">{group.description}</p>
            <ul class="grid gap-3">
              {group.sections.flatMap((key) => {
                const entry = tree.find((item) => item.path === key)
                return entry ? <li key={entry.path}>{docsEntryCard(entry, entry.fileCount)}</li> : []
              })}
            </ul>
          </section>
        ))}
      </div>

      <section aria-labelledby="docs-start-title" class="card gap-0 overflow-hidden bg-background/60 py-0 shadow-none">
        <div class="border-b bg-muted/30 px-5 py-4">
          <h2 id="docs-start-title" class="text-base font-semibold text-balance">Pilih jalur baca Anda</h2>
          <p class="mt-1 text-xs leading-5 text-pretty text-muted-foreground">Tiga referensi untuk mengenal proyek lebih dekat.</p>
        </div>
        <div class="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { path: 'product/brd.md', title: 'Pahami produk', label: 'Kebutuhan dan ruang lingkup', icon: 'receipt' as const },
            { path: 'architecture/README.md', title: 'Kenali arsitektur', label: 'Sistem dan keputusan teknis', icon: 'layout-grid' as const },
            { path: 'engineering/api.md', title: 'Baca referensi API', label: 'Endpoint dan integrasi', icon: 'link' as const },
          ].map((item) => (
            <a key={item.path} href={docsHref(item.path)} class="group flex items-start gap-3 p-5 hover:bg-muted/30">
              {icon(item.icon, 'mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-primary')}
              <span class="min-w-0">
                <span class="block text-sm font-medium group-hover:text-primary">{item.title}</span>
                <span class="mt-1 block text-xs leading-5 text-muted-foreground">{item.label}</span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

export function docsPager(previous: DocumentationEntry | null, next: DocumentationEntry | null) {
  if (!previous && !next) return null
  return (
    <nav aria-label="Dokumen berdekatan" class="grid gap-3 border-t pt-6 sm:grid-cols-2">
      {previous ? (
        <a href={docsHref(previous.path)} class="card gap-1 px-4 py-3 transition-colors hover:border-primary/40">
          <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
            {icon('arrow-left')}
            Sebelumnya
          </span>
          <span class="truncate text-sm font-medium">{docLabel(previous.name)}</span>
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a
          href={docsHref(next.path)}
          class="card gap-1 px-4 py-3 text-right transition-colors hover:border-primary/40 sm:col-start-2"
        >
          <span class="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
            Berikutnya
            {icon('arrow-right')}
          </span>
          <span class="truncate text-sm font-medium">{docLabel(next.name)}</span>
        </a>
      ) : null}
    </nav>
  )
}

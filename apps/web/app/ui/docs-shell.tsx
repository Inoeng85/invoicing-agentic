import { APP_NAME } from '../lib/brand.ts'
import {
  docsHref,
  type DocumentationContent,
  type DocumentationEntry,
  type DocumentationNode,
} from '../lib/docs.ts'
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
    <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <a href="#docs-content" class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2">
        Lewati ke konten
      </a>
      <div class="mx-auto flex min-h-16 max-w-[88rem] flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-6 lg:px-8">
        <button
          type="button"
          class="btn btn-ghost btn-icon btn-sm lg:hidden"
          popovertarget="docs-nav"
          aria-label="Buka daftar dokumentasi"
        >
          {icon('menu')}
        </button>
        <a href={docsHref()} class="flex shrink-0 items-center gap-2.5 font-semibold">
          <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            {icon('book-open', 'size-4')}
          </span>
          <span class="text-sm">{APP_NAME}</span>
        </a>
        <span class="hidden border-l pl-4 text-sm text-muted-foreground md:block">Dokumentasi</span>
        <form action={docsHref()} method="get" role="search" class="order-last w-full sm:order-none sm:ml-auto sm:max-w-sm">
          <label for="docs-search" class="sr-only">
            Cari dokumentasi
          </label>
          <div class="input-group border-border bg-muted/50 shadow-none">
            <span class="input-addon bg-transparent pr-0 text-muted-foreground">{icon('search', 'size-4')}</span>
            <input
              id="docs-search"
              name="q"
              type="search"
              value={query}
              placeholder="Cari panduan dan referensi…"
              class="input"
            />
            <button type="submit" class="btn btn-ghost btn-icon btn-sm mr-1" aria-label="Cari dokumentasi">
              {icon('arrow-right')}
            </button>
          </div>
        </form>
        <a class="btn btn-ghost btn-sm ml-auto shrink-0 sm:ml-0" href={routes.home.href()} aria-label="Buka aplikasi">
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
      <p class="px-2.5 pt-1 pb-2 text-xs font-medium text-muted-foreground">Mulai di sini</p>
      <a href={docsHref()} class="sidebar-link" aria-current={!file && !query ? 'page' : undefined}>
        {icon('book-open')}
        Beranda dokumentasi
      </a>
      <a href={docsHref('README.md')} class="sidebar-link" aria-current={file === 'README.md' ? 'page' : undefined}>
        {icon('file-text')}
        Ikhtisar proyek
      </a>
      <p class="px-2.5 pt-6 pb-2 text-xs font-medium text-muted-foreground">Jelajahi dokumentasi</p>
      {Object.entries(DOC_SECTIONS).map(([key, section]) => {
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
      class="docs-entry-card card group h-full gap-4 py-5 shadow-none hover:border-primary/40 hover:shadow-sm"
    >
      <div class="card-header flex-row items-center justify-between gap-3 px-5">
        <span class="grid size-9 shrink-0 place-items-center rounded-lg border bg-muted/40 text-muted-foreground group-hover:text-primary">
          {icon(section?.icon ?? (entry.directory ? 'folder' : 'file-text'), 'size-4')}
        </span>
        {icon('arrow-right', 'size-4 shrink-0 text-muted-foreground group-hover:text-primary')}
      </div>
      <div class="card-content min-w-0 space-y-2 px-5">
        <h3 class="text-sm font-semibold text-balance [overflow-wrap:anywhere] group-hover:text-primary">{section?.title ?? docLabel(entry.name)}</h3>
        <p class="card-description text-xs leading-5 text-pretty [overflow-wrap:anywhere]">{section?.description ?? entry.path}</p>
        {fileCount !== undefined ? <p class="pt-2 text-xs text-muted-foreground"><span class="tabular-nums">{fileCount}</span> dokumen</p> : null}
      </div>
    </a>
  )
}

export function docsLanding(tree: DocumentationNode[]) {
  const sections = Object.keys(DOC_SECTIONS).flatMap((key) => tree.find((entry) => entry.path === key) ?? [])
  return (
    <div class="space-y-10">
      <section class="border-b pb-10">
        <span class="badge badge-outline gap-2 rounded-full bg-background px-3 py-1 text-muted-foreground">
          {icon('book-open')} Pusat dokumentasi
        </span>
        <h1 class="mt-6 max-w-2xl text-4xl leading-tight font-semibold text-balance sm:text-5xl">
          Dokumentasi <span class="text-primary">{APP_NAME}.</span>
        </h1>
        <p class="mt-5 max-w-xl text-base leading-7 text-pretty text-muted-foreground">
          Dari memahami produk hingga menyiapkan rilis. Temukan panduan, keputusan teknis, dan referensi untuk setiap tahap pengembangan.
        </p>
        <div class="mt-7 flex flex-wrap items-center gap-3">
          <a href={docsHref('engineering/contributing.md')} class="btn btn-default">Mulai development {icon('arrow-right')}</a>
          <a href={docsHref('README.md')} class="btn btn-outline">Ikhtisar proyek</a>
        </div>
      </section>

      <section aria-labelledby="docs-sections-title" class="space-y-5">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="docs-sections-title" class="text-xl font-semibold text-balance">Jelajahi dokumentasi</h2>
            <p class="mt-1.5 text-sm text-pretty text-muted-foreground">Disusun berdasarkan kebutuhan Anda.</p>
          </div>
          <span class="badge badge-secondary tabular-nums">{sections.length} bagian</span>
        </div>
        <ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((entry) => <li key={entry.path}>{docsEntryCard(entry, entry.fileCount)}</li>)}
        </ul>
      </section>

      <section aria-labelledby="docs-start-title" class="card gap-0 overflow-hidden py-0 shadow-none">
        <div class="border-b bg-muted/30 px-5 py-4">
          <h2 id="docs-start-title" class="text-sm font-semibold text-balance">Belum tahu harus mulai dari mana?</h2>
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

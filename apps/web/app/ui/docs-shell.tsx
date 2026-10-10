import { APP_NAME } from '../lib/brand.ts'
import {
  docsHref,
  type DocumentationContent,
  type DocumentationEntry,
  type DocumentationNode,
} from '../lib/docs.ts'
import { routes } from '../routes.ts'
import { icon } from './icons.tsx'

export const DOC_SECTIONS: Record<string, { title: string; description: string }> = {
  product: { title: 'Produk', description: 'BRD, requirement, scope, dan legal.' },
  architecture: { title: 'Arsitektur', description: 'Arsitektur sistem dan keputusan teknis.' },
  engineering: { title: 'Engineering', description: 'Setup, API, implementasi, dan pengujian.' },
  design: { title: 'Desain', description: 'Guideline, komponen, dan prototype.' },
  operations: { title: 'Operasional', description: 'Deployment, runbook, dan rilis.' },
  workflow: { title: 'Workflow', description: 'Proses, backlog, plan, dan laporan task.' },
  reports: { title: 'Laporan', description: 'Snapshot dan hasil pemeriksaan otomatis.' },
  archive: { title: 'Arsip', description: 'Bukti task selesai dan sesi terdahulu.' },
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
    <header class="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-[88rem] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          class="btn btn-ghost btn-icon btn-sm lg:hidden"
          popovertarget="docs-nav"
          aria-label="Buka daftar dokumentasi"
        >
          {icon('menu')}
        </button>
        <a href={docsHref()} class="flex shrink-0 items-center gap-2 font-semibold">
          <span class="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            {icon('book-open', 'size-4')}
          </span>
          <span class="leading-tight">
            {APP_NAME}
            <span class="hidden text-xs font-normal text-muted-foreground lg:block">Dokumentasi</span>
          </span>
        </a>
        <form action={docsHref()} method="get" role="search" class="ml-auto w-full max-w-xs sm:max-w-sm">
          <label for="docs-search" class="sr-only">
            Cari dokumentasi
          </label>
          <div class="input-group">
            <span class="input-addon bg-transparent pr-0 text-muted-foreground">{icon('search')}</span>
            <input
              id="docs-search"
              name="q"
              type="search"
              value={query}
              placeholder="Cari dokumentasi…"
              class="input"
            />
          </div>
        </form>
        <a class="btn btn-outline btn-sm shrink-0" href={routes.home.href()}>
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
      <a href={docsHref()} class="sidebar-link" aria-current={!file && !query ? 'page' : undefined}>
        {icon('layout-grid')}
        Semua dokumentasi
      </a>
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
                {icon('folder')}
                <span class="truncate">{section.title}</span>
              </span>
              <span class="tabs-count">{node?.fileCount ?? 0}</span>
            </a>
            {openSection === key && node ? docsTree(node.children, file) : null}
          </div>
        )
      })}
    </nav>
  )
}

export function docsBreadcrumb(file: string) {
  const segments = file.split('/').filter(Boolean)
  return (
    <nav aria-label="Breadcrumb" class="breadcrumb">
      <a href={docsHref()}>Docs</a>
      {segments.map((segment, index) => (
        <span key={index} class="flex items-center gap-1.5">
          {icon('chevron-right')}
          <a href={docsHref(segments.slice(0, index + 1).join('/'))} class="break-all">
            {segment}
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
      <p class="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Di halaman ini</p>
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

export function docsEntryCard(entry: DocumentationEntry) {
  const section = DOC_SECTIONS[entry.path]
  return (
    <a
      href={docsHref(entry.path)}
      class="card gap-2 py-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div class="card-header flex-row items-center gap-2.5">
        <span class="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          {icon(entry.directory ? 'folder' : 'file-text', 'size-4')}
        </span>
        <span class="card-title truncate">{section?.title ?? docLabel(entry.name)}</span>
      </div>
      <div class="card-content">
        <p class="card-description break-all">{section?.description ?? entry.path}</p>
      </div>
    </a>
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

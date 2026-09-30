import type { RemixNode } from 'remix/ui'

import { routes } from '../routes.ts'
import { icon } from './icons.tsx'
import { confirmDialog, formatDate, formatIdr, STATUS_LABEL, statusBadge, type InvoiceStatus } from './kit.tsx'

export interface InvoiceRow {
  id: string
  number: string | null
  status: string
  totalCents: number
  dueDate: Date
  publicToken: string | null
  publicTokenRevokedAt: Date | null
  client: { name: string }
  lineItems: Array<{ description: string }>
}

export type StatusFilter = InvoiceStatus | 'all'

const TAB_ORDER: StatusFilter[] = ['all', 'draft', 'sent', 'overdue', 'paid', 'cancelled']

const TAB_LABEL: Record<StatusFilter, string> = {
  all: 'Semua',
  ...STATUS_LABEL,
  cancelled: 'Arsip',
}

export function statusTabs(options: {
  invoices: Array<{ status: string }>
  active: StatusFilter
  href: (status: StatusFilter) => string
  include?: StatusFilter[]
}) {
  let tabs = options.include ?? TAB_ORDER
  return (
    <nav class="tabs-list max-w-full overflow-x-auto" aria-label="Filter status">
      {tabs.map((key) => {
        let count = key === 'all' ? options.invoices.length : options.invoices.filter((i) => i.status === key).length
        return (
          <a
            key={key}
            class="tabs-trigger"
            href={options.href(key)}
            aria-current={options.active === key ? 'page' : undefined}
          >
            {TAB_LABEL[key]} <span class="tabs-count">{count}</span>
          </a>
        )
      })}
    </nav>
  )
}

export function invoiceTable(options: {
  invoices: InvoiceRow[]
  userId: string
  toolbar?: RemixNode
  emptyText: string
}) {
  let { invoices, userId } = options
  let dialogs: RemixNode[] = []

  let rows = invoices.map((inv) => {
    let label = inv.number ?? 'draft'
    let showHref = routes.invoices.show.href({ invoiceId: inv.id })
    let pdfHref = routes.invoicePdf.href({ invoiceId: inv.id })
    let linkActive = inv.publicToken && !inv.publicTokenRevokedAt
    let actions: RemixNode

    if (inv.status === 'draft') {
      let deleteId = `dlg-delete-${inv.id}`
      dialogs.push(
        confirmDialog({
          id: deleteId,
          title: 'Hapus draft invoice?',
          description: `Draft untuk ${inv.client.name} (${formatIdr(inv.totalCents)}) akan dihapus permanen.`,
          action: routes.invoiceDeleteDraft.href({ invoiceId: inv.id }),
          userId,
          confirmLabel: 'Ya, hapus',
          variant: 'destructive',
        }),
      )
      actions = (
        <details class="dropdown">
          <summary class="btn btn-ghost btn-icon btn-sm" aria-label="Aksi draft">
            {icon('more-horizontal')}
          </summary>
          <div class="dropdown-content">
            <a class="dropdown-item" href={routes.invoices.edit.href({ invoiceId: inv.id })}>
              {icon('pencil')}
              Edit
            </a>
            <a class="dropdown-item" href={routes.invoiceSendReview.href({ invoiceId: inv.id })}>
              {icon('send')}
              Kirim ke klien
            </a>
            <div class="dropdown-separator" />
            <button type="button" class="dropdown-item dropdown-item-destructive" popovertarget={deleteId}>
              {icon('trash')}
              Hapus draft
            </button>
          </div>
        </details>
      )
    } else if (inv.status === 'sent' || inv.status === 'overdue') {
      let paidId = `dlg-paid-${inv.id}`
      dialogs.push(
        confirmDialog({
          id: paidId,
          title: 'Tandai sebagai lunas?',
          description: `Catat pembayaran ${formatIdr(inv.totalCents)} dari ${inv.client.name} (FR-07).`,
          action: routes.invoiceMarkPaid.href({ invoiceId: inv.id }),
          userId,
          confirmLabel: 'Tandai lunas',
          confirmIcon: 'check',
          variant: 'success',
        }),
      )
      actions = (
        <details class="dropdown">
          <summary class="btn btn-ghost btn-icon btn-sm" aria-label={`Aksi ${label}`}>
            {icon('more-horizontal')}
          </summary>
          <div class="dropdown-content">
            <a class="dropdown-item" href={showHref}>
              {icon('eye')}
              Lihat
            </a>
            <a class="dropdown-item" href={pdfHref}>
              {icon('download')}
              Unduh PDF
            </a>
            {linkActive ? (
              <a
                class="dropdown-item"
                href={routes.publicInvoice.href({ token: inv.publicToken! })}
                target="_blank"
                rel="noopener"
              >
                {icon('link')}
                Buka tautan publik
              </a>
            ) : null}
            <div class="dropdown-separator" />
            <button type="button" class="dropdown-item" popovertarget={paidId}>
              {icon('check')}
              Tandai lunas
            </button>
          </div>
        </details>
      )
    } else if (inv.status === 'paid') {
      actions = (
        <a class="btn btn-ghost btn-icon btn-sm" href={pdfHref} aria-label={`Unduh PDF ${label}`}>
          {icon('download')}
        </a>
      )
    } else {
      actions = (
        <a class="btn btn-ghost btn-icon btn-sm" href={showHref} aria-label={`Lihat ${label}`}>
          {icon('eye')}
        </a>
      )
    }

    return (
      <tr key={inv.id}>
        <td>
          {inv.number ? (
            <a class="font-mono text-xs font-medium hover:text-primary" href={showHref}>
              {inv.number}
            </a>
          ) : (
            <a class="text-xs text-muted-foreground italic hover:text-primary" href={showHref}>
              (auto saat kirim)
            </a>
          )}
        </td>
        <td>
          <div class="font-medium">{inv.client.name}</div>
          {inv.lineItems[0] ? (
            <div class="max-w-56 truncate text-xs text-muted-foreground">{inv.lineItems[0].description}</div>
          ) : null}
        </td>
        <td class="text-right font-medium tabular-nums">{formatIdr(inv.totalCents)}</td>
        <td>{statusBadge(inv.status)}</td>
        <td
          class={`hidden md:table-cell ${inv.status === 'overdue' ? 'font-medium text-warning' : 'text-muted-foreground'}`}
        >
          {inv.status === 'draft' ? '—' : formatDate(inv.dueDate)}
        </td>
        <td>{actions}</td>
      </tr>
    )
  })

  return (
    <>
      <div class="table-container md:overflow-visible">
        {options.toolbar}
        <table class="table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Klien</th>
              <th class="text-right">Jumlah</th>
              <th>Status</th>
              <th class="hidden md:table-cell">Due</th>
              <th class="w-12">
                <span class="sr-only">Aksi</span>
              </th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
        {invoices.length === 0 ? (
          <div class="border-t p-10 text-center text-sm text-muted-foreground">{options.emptyText}</div>
        ) : null}
      </div>
      {dialogs}
    </>
  )
}

export function appUrl(): string {
  return process.env.APP_URL ?? 'http://localhost:44100'
}

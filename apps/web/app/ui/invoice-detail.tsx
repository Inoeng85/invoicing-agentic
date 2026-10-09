import type { Handle, RemixNode } from 'remix/component'
import { computeLineSubtotalCents, type getInvoice } from '@invoicing/domain'

import { routes } from '../routes.ts'
import { icon, type IconName } from './icons.tsx'
import {
  alertBox,
  confirmDialog,
  daysBetween,
  formatDate,
  formatDateTime,
  formatIdr,
  initials,
  statusBadge,
} from './kit.tsx'
import { AppLayout, type ShellUser } from './layout.tsx'

type Invoice = Awaited<ReturnType<typeof getInvoice>>

const NOTICES: Record<string, { variant: 'success' | 'info'; title: string }> = {
  paid: { variant: 'success', title: 'Invoice ditandai lunas' },
  revoked: { variant: 'success', title: 'Tautan publik dicabut — tautan lama berhenti berfungsi' },
  cancelled: { variant: 'info', title: 'Invoice dibatalkan. Buat draft baru bila perlu pengganti.' },
  assigned: { variant: 'success', title: 'Kolektor di-assign' },
  unassigned: { variant: 'info', title: 'Kolektor dilepas dari invoice' },
  activity_added: { variant: 'success', title: 'Aktivitas penagihan dicatat' },
  tracking_link_created: { variant: 'success', title: 'Link tracking dibuat — kirim ke kolektor' },
  tracking_link_revoked: { variant: 'info', title: 'Link tracking dicabut' },
}

interface TimelineEntry {
  at: Date | null
  label: string
  iconName: IconName
  primary?: boolean
  meta?: string
}

export interface InvoiceDetailProps {
  user: ShellUser
  invoice: Invoice
  publicUrl: string
  notice?: string | null
  collectionPanel?: RemixNode
}

export function InvoiceDetail(handle: Handle<InvoiceDetailProps>) {
  return () => {
    let { user, invoice, publicUrl, notice, collectionPanel } = handle.props
    let id = invoice.id
    let profile = invoice.user.profile
    let legalName = profile?.legalName ?? user.legalName
    let title = invoice.number ?? 'Draft invoice'
    let isDraft = invoice.status === 'draft'
    let isOpen = invoice.status === 'sent' || invoice.status === 'overdue'
    let linkRevoked = Boolean(invoice.publicTokenRevokedAt)
    let linkActive = Boolean(invoice.publicToken) && !linkRevoked && invoice.status !== 'cancelled'
    let pdfHref = routes.invoicePdf.href({ invoiceId: id })
    let note = invoice.footerNote
    let lateDays = invoice.status === 'overdue' ? daysBetween(invoice.dueDate, new Date()) : 0
    let noticeInfo = notice ? NOTICES[notice] : undefined

    let dialogs: RemixNode[] = []
    let actions: RemixNode

    if (isDraft) {
      dialogs.push(
        confirmDialog({
          id: 'dlg-delete',
          title: 'Hapus draft invoice?',
          description: `Draft untuk ${invoice.client.name} (${formatIdr(invoice.totalCents)}) akan dihapus permanen.`,
          action: routes.invoiceDeleteDraft.href({ invoiceId: id }),
          userId: user.id,
          confirmLabel: 'Ya, hapus',
          variant: 'destructive',
        }),
      )
      actions = (
        <>
          <button
            type="button"
            class="btn btn-ghost text-destructive hover:bg-destructive/10 hover:text-destructive"
            popovertarget="dlg-delete"
          >
            {icon('trash')}
            Hapus
          </button>
          <a class="btn btn-outline" href={routes.invoices.edit.href({ invoiceId: id })}>
            {icon('pencil')}
            Edit
          </a>
          <a class="btn btn-outline" href={pdfHref}>
            {icon('download')}
            Unduh PDF
          </a>
          <a class="btn btn-default" href={routes.invoiceSendReview.href({ invoiceId: id })}>
            {icon('send')}
            Kirim ke klien
          </a>
        </>
      )
    } else {
      if (isOpen) {
        dialogs.push(
          confirmDialog({
            id: 'dlg-paid',
            title: 'Tandai sebagai lunas?',
            description: `Catat pembayaran ${formatIdr(invoice.totalCents)} dari ${invoice.client.name}.`,
            action: routes.invoiceMarkPaid.href({ invoiceId: id }),
            userId: user.id,
            confirmLabel: 'Tandai lunas',
            confirmIcon: 'check',
            variant: 'success',
          }),
          confirmDialog({
            id: 'dlg-cancel',
            title: 'Batalkan invoice ini?',
            description: `${invoice.number} akan diarsipkan sebagai dibatalkan. Nomor tidak dipakai ulang; buat draft baru sebagai pengganti.`,
            action: routes.invoiceCancel.href({ invoiceId: id }),
            userId: user.id,
            confirmLabel: 'Batalkan invoice',
            variant: 'destructive',
          }),
        )
      }
      if (linkActive) {
        dialogs.push(
          confirmDialog({
            id: 'dlg-revoke',
            title: 'Cabut tautan publik?',
            description: 'Tautan lama berhenti berfungsi dan klien tidak bisa membuka invoice lewat tautan itu.',
            action: routes.invoiceRevokeLink.href({ invoiceId: id }),
            userId: user.id,
            confirmLabel: 'Cabut tautan',
            variant: 'destructive',
          }),
        )
      }
      actions = (
        <>
          <a class="btn btn-outline" href={pdfHref}>
            {icon('download')}
            Unduh PDF
          </a>
          {isOpen ? (
            <>
              <button type="button" class="btn btn-success" popovertarget="dlg-paid">
                {icon('check')}
                Tandai lunas
              </button>
              <details class="dropdown">
                <summary class="btn btn-outline btn-icon" aria-label="Aksi lain">
                  {icon('more-horizontal')}
                </summary>
                <div class="dropdown-content">
                  <button
                    type="button"
                    class="dropdown-item dropdown-item-destructive"
                    popovertarget="dlg-cancel"
                  >
                    {icon('ban')}
                    Batalkan invoice
                  </button>
                </div>
              </details>
            </>
          ) : null}
        </>
      )
    }

    let timeline: TimelineEntry[] = []
    if (invoice.status === 'cancelled') {
      timeline.push({ at: invoice.updatedAt, label: 'Invoice dibatalkan', iconName: 'ban' })
    }
    if (invoice.paidAt) timeline.push({ at: invoice.paidAt, label: 'Ditandai lunas', iconName: 'check', primary: true })
    if (invoice.publicTokenRevokedAt) {
      timeline.push({ at: invoice.publicTokenRevokedAt, label: 'Tautan publik dicabut', iconName: 'ban' })
    }
    if (invoice.sentAt) {
      timeline.push({ at: invoice.sentAt, label: `Dikirim ke ${invoice.client.email}`, iconName: 'send', primary: true })
    }
    if (invoice.number) {
      timeline.push({ at: null, label: `Nomor ${invoice.number} dikunci`, iconName: 'lock', meta: 'Tidak bisa diubah' })
    }
    timeline.push({ at: invoice.createdAt, label: 'Draft dibuat', iconName: 'pencil' })

    return (
      <AppLayout title={title} user={user} active="invoices">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href={routes.invoices.index.href()}>Invoice</a>
          {icon('chevron-right')}
          <span class="text-foreground">{title}</span>
        </nav>

        {noticeInfo ? alertBox(noticeInfo.variant, noticeInfo.title) : null}

        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-bold">{title}</h1>
              {statusBadge(invoice.status)}
            </div>
            <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground [&_svg]:size-4">
              <a
                class="inline-flex items-center gap-1.5 hover:text-foreground"
                href={routes.clients.show.href({ clientId: invoice.clientId })}
              >
                {icon('building')}
                {invoice.client.name}
              </a>
              <span class={`inline-flex items-center gap-1.5 ${lateDays > 0 ? 'font-medium text-warning' : ''}`}>
                {icon('calendar')}
                Jatuh tempo {formatDate(invoice.dueDate)}
                {lateDays > 0 ? ` · terlambat ${lateDays} hari` : ''}
              </span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">{actions}</div>
        </div>

        {isOpen
          ? alertBox(
              'info',
              'Invoice sudah terkirim — item & nomor terkunci',
              <p>
                Item pekerjaan dan nomor tidak bisa diubah setelah dikirim agar catatan kamu dan klien tetap sama.
                Perlu revisi?{' '}
                <button type="button" class="font-medium underline underline-offset-4" popovertarget="dlg-cancel">
                  Batalkan &amp; buat pengganti
                </button>
                .
              </p>,
              'lock',
            )
          : null}

        <div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <article
            class="mx-auto w-full max-w-3xl rounded-xl border bg-card p-8 shadow-sm sm:p-12"
            aria-label="Preview dokumen invoice"
          >
            <div class="flex flex-wrap items-start justify-between gap-6">
              <div class="flex items-center gap-3">
                <span class="grid size-12 place-items-center rounded-lg bg-primary/10 text-lg font-semibold text-primary">
                  {initials(legalName)}
                </span>
                <div>
                  <p class="font-semibold">{legalName}</p>
                  {profile?.address ? (
                    <p class="text-sm whitespace-pre-line text-muted-foreground">{profile.address}</p>
                  ) : null}
                  {profile?.npwp ? <p class="text-xs text-muted-foreground">NPWP {profile.npwp}</p> : null}
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Invoice</p>
                <p class="font-mono text-lg font-semibold">{invoice.number ?? 'DRAFT'}</p>
              </div>
            </div>

            <div class="mt-10 grid gap-6 text-sm sm:grid-cols-3">
              <div>
                <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Ditagihkan ke</p>
                <p class="mt-1 font-medium">{invoice.client.name}</p>
                {invoice.client.address ? (
                  <p class="whitespace-pre-line text-muted-foreground">{invoice.client.address}</p>
                ) : null}
                <p class="text-muted-foreground">{invoice.client.email}</p>
              </div>
              <div>
                <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Tanggal terbit</p>
                <p class="mt-1">{formatDate(invoice.issueDate)}</p>
                <p class="mt-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">Jatuh tempo</p>
                <p class="mt-1">{formatDate(invoice.dueDate)}</p>
              </div>
              <div class="sm:text-right">
                <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Jumlah tagihan</p>
                <p class="mt-1 text-2xl font-bold tabular-nums">{formatIdr(invoice.totalCents)}</p>
              </div>
            </div>

            <table class="mt-10 w-full text-sm">
              <thead>
                <tr class="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th class="py-2 font-medium">Deskripsi</th>
                  <th class="py-2 text-right font-medium">Qty</th>
                  <th class="hidden py-2 text-right font-medium sm:table-cell">Harga</th>
                  <th class="hidden py-2 text-right font-medium sm:table-cell">Diskon</th>
                  <th class="py-2 text-right font-medium">Jumlah</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                {invoice.lineItems.map((line) => (
                  <tr key={line.id}>
                    <td class="py-3">{line.description}</td>
                    <td class="py-3 text-right tabular-nums">{line.quantity}</td>
                    <td class="hidden py-3 text-right tabular-nums sm:table-cell">{formatIdr(line.unitPriceCents)}</td>
                    <td class="hidden py-3 text-right tabular-nums sm:table-cell">
                      {line.discountCents > 0 ? formatIdr(line.discountCents) : '—'}
                    </td>
                    <td class="py-3 text-right tabular-nums">{formatIdr(computeLineSubtotalCents(line))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl class="mt-6 ml-auto w-full max-w-xs space-y-2 border-t pt-4 text-sm">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Subtotal</dt>
                <dd class="tabular-nums">{formatIdr(invoice.subtotalCents)}</dd>
              </div>
              {invoice.ppnEnabled ? (
                <div class="flex justify-between">
                  <dt class="text-muted-foreground">PPN {Math.round(invoice.ppnRate * 100)}%</dt>
                  <dd class="tabular-nums">{formatIdr(invoice.ppnCents)}</dd>
                </div>
              ) : null}
              <div class="flex justify-between border-t pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd class="tabular-nums">{formatIdr(invoice.totalCents)}</dd>
              </div>
            </dl>

            {profile?.bankDetails || note ? (
              <div class="mt-10 grid gap-4 rounded-lg bg-muted/60 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p class="font-medium">Pembayaran</p>
                  <p class="whitespace-pre-line text-muted-foreground">{profile?.bankDetails || '—'}</p>
                </div>
                <div>
                  <p class="font-medium">Catatan</p>
                  <p class="whitespace-pre-line text-muted-foreground">{note || '—'}</p>
                </div>
              </div>
            ) : null}
            {invoice.ppnEnabled ? (
              <p class="mt-6 text-xs text-muted-foreground">
                PPN pada invoice ini untuk keperluan penagihan dan bukan Faktur Pajak elektronik (e-Faktur).
              </p>
            ) : null}
          </article>

          <aside class="space-y-4">
            <section class="card gap-4">
              <div class="card-header">
                <h2 class="card-title">Tautan publik</h2>
                <p class="card-description">Klien bisa melihat &amp; mengunduh PDF tanpa login.</p>
              </div>
              <div class="card-content space-y-3">
                {linkActive ? (
                  <>
                    <input class="input font-mono text-xs" readonly value={publicUrl} aria-label="Tautan publik" />
                    <a
                      class="btn btn-link btn-sm"
                      href={routes.publicInvoice.href({ token: invoice.publicToken! })}
                      target="_blank"
                      rel="noopener"
                    >
                      {icon('external-link')}
                      Buka tampilan klien
                    </a>
                  </>
                ) : linkRevoked ? (
                  <p class="text-sm text-muted-foreground">
                    Tautan dicabut {formatDateTime(invoice.publicTokenRevokedAt)}. Klien tidak bisa membuka invoice
                    lewat tautan lama.
                  </p>
                ) : (
                  <p class="text-sm text-muted-foreground">
                    {isDraft
                      ? 'Tautan privat dibuat otomatis saat invoice dikirim.'
                      : 'Tautan tidak tersedia untuk invoice ini.'}
                  </p>
                )}
              </div>
              {linkActive ? (
                <div class="card-footer border-t pt-4">
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                    popovertarget="dlg-revoke"
                  >
                    {icon('ban')}
                    Cabut tautan
                  </button>
                </div>
              ) : null}
            </section>

            {collectionPanel}

            <section class="card gap-4">
              <div class="card-header">
                <h2 class="card-title">Aktivitas</h2>
              </div>
              <div class="card-content">
                <ol class="relative space-y-5 border-l pl-6">
                  {timeline.map((entry, i) => (
                    <li key={i} class="relative">
                      <span
                        class={`absolute top-0.5 -left-[31px] grid size-5 place-items-center rounded-full ring-4 ring-card ${entry.primary ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                      >
                        {icon(entry.iconName, 'size-3')}
                      </span>
                      <p class="text-sm font-medium">{entry.label}</p>
                      <p class="text-xs text-muted-foreground">{entry.meta ?? formatDateTime(entry.at)}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          </aside>
        </div>

        {dialogs}
      </AppLayout>
    )
  }
}

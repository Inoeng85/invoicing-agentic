import type { RemixNode } from 'remix/component'
import {
  COLLECTION_OUTCOMES,
  computeCommissionCents,
  type CollectionOutcome,
  type InvoiceCollection,
} from '@invoicing/domain'

import { CopyButton } from '../actions/public/copy-button.tsx'
import { CsrfInput } from '../lib/csrf-field.tsx'
import { formatPercentInput } from '../lib/percent.ts'
import { routes } from '../routes.ts'
import { collectorAvatar, collectorPhotoDialog } from './collector-avatar.tsx'
import { alertBox, formatDate, formatIdr, toDateInput } from './kit.tsx'

const OUTCOME_LABEL: Record<CollectionOutcome, string> = {
  contacted: 'Dihubungi',
  no_response: 'Tidak merespons',
  promised_to_pay: 'Janji bayar',
  partial_payment_reported: 'Lapor bayar sebagian',
  refused: 'Menolak',
  other: 'Lainnya',
}

const END_REASON_LABEL: Record<string, string> = {
  reassigned: 'Diganti',
  unassigned: 'Dilepas',
  paid: 'Lunas',
  cancelled: 'Dibatalkan',
}

const ERROR_MESSAGES: Record<string, string> = {
  collector_not_found: 'Kolektor tidak ditemukan.',
  collector_inactive: 'Kolektor nonaktif — aktifkan dulu di halaman Kolektor.',
  invoice_not_outstanding: 'Hanya invoice terkirim atau jatuh tempo yang dapat ditagih.',
  already_assigned: 'Kolektor itu sudah di-assign ke invoice ini.',
  no_active_assignment: 'Belum ada kolektor di invoice ini.',
  invalid_outcome: 'Pilih hasil penagihan.',
  invalid_occurred_at: 'Tanggal aktivitas tidak boleh kosong atau di masa depan.',
}

export interface CollectionPanelOptions {
  userId: string
  invoice: { id: string; status: string; totalCents: number }
  collection: InvoiceCollection
  collectors: Array<{ id: string; name: string; commissionRate: number }>
  errorCode?: string | null
  trackingUrl: string | null
}

export function collectionPanel(options: CollectionPanelOptions): RemixNode {
  let { userId, invoice, collection, collectors, errorCode, trackingUrl } = options
  let isOpen = invoice.status === 'sent' || invoice.status === 'overdue'
  if (!isOpen && collection.history.length === 0) return null

  let active = collection.active
  let candidates = collectors.filter((c) => c.id !== active?.collectorId)
  let today = toDateInput(new Date())
  // History already contains the active assignment; one dialog per collector keeps element ids unique.
  let photoDialogs = [...new Map(collection.history.map((a) => [a.collector.id, a.collector])).values()].map(
    collectorPhotoDialog,
  )

  return (
    <section id="penagihan" class="card gap-4">
      <div class="card-header">
        <h2 class="card-title">Penagihan Debt Collector</h2>
        <p class="card-description">Catatan internal — tidak tampil ke klien.</p>
      </div>
      <div class="card-content space-y-4">
        {errorCode ? alertBox('destructive', ERROR_MESSAGES[errorCode] ?? 'Aksi penagihan gagal.') : null}

        {active ? (
          <div class="flex items-start gap-3 text-sm">
            {collectorAvatar(active.collector, 'size-10', { preview: true })}
            <div class="min-w-0 space-y-0.5">
              <p class="font-medium">{active.collector.name}</p>
              {active.collector.email || active.collector.phone ? (
                <p class="truncate text-muted-foreground">
                  {[active.collector.email, active.collector.phone].filter(Boolean).join(' · ')}
                </p>
              ) : null}
              <p class="text-muted-foreground">
                Sejak {formatDate(active.assignedAt)} · komisi {formatPercentInput(active.rateSnapshot)}% (≈{' '}
                {formatIdr(computeCommissionCents(invoice.totalCents, active.rateSnapshot))})
              </p>
            </div>
          </div>
        ) : isOpen ? (
          <p class="text-sm text-muted-foreground">Belum ada kolektor.</p>
        ) : null}

        {isOpen && candidates.length ? (
          <form method="post" action={routes.invoiceCollection.assign.href({ invoiceId: invoice.id })} class="flex gap-2">
            <CsrfInput userId={userId} />
            <select name="collectorId" class="select" required aria-label="Pilih kolektor">
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatPercentInput(c.commissionRate)}%)
                </option>
              ))}
            </select>
            <button type="submit" class="btn btn-outline btn-sm">
              {active ? 'Ganti' : 'Assign'}
            </button>
          </form>
        ) : null}

        {isOpen && collectors.length === 0 ? (
          <a class="btn btn-link btn-sm" href={routes.collectors.new.href()}>
            Tambah kolektor dulu
          </a>
        ) : null}

        {isOpen && active ? (
          <>
            <div class="space-y-2 border-t pt-4">
              <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Live tracking</p>
              {trackingUrl ? (
                <div class="flex gap-2">
                  <input class="input font-mono text-xs" readonly value={trackingUrl} aria-label="Link tracking kolektor" />
                  <CopyButton text={trackingUrl} label="Salin" />
                </div>
              ) : (
                <p class="text-sm text-muted-foreground">Buat link lalu kirim ke kolektor (mis. via WhatsApp).</p>
              )}
              <div class="flex flex-wrap gap-2">
                <form method="post" action={routes.invoiceTracking.createLink.href({ invoiceId: invoice.id })}>
                  <CsrfInput userId={userId} />
                  <button type="submit" class="btn btn-outline btn-sm">
                    {trackingUrl ? 'Buat ulang link' : 'Buat link tracking'}
                  </button>
                </form>
                {trackingUrl ? (
                  <form method="post" action={routes.invoiceTracking.revokeLink.href({ invoiceId: invoice.id })}>
                    <CsrfInput userId={userId} />
                    <button type="submit" class="btn btn-ghost btn-sm text-destructive">
                      Cabut link
                    </button>
                  </form>
                ) : null}
                <a class="btn btn-link btn-sm" href={routes.invoiceTracking.page.href({ invoiceId: invoice.id })}>
                  Lihat peta
                </a>
              </div>
            </div>
            <form method="post" action={routes.invoiceCollection.unassign.href({ invoiceId: invoice.id })}>
              <CsrfInput userId={userId} />
              <button type="submit" class="btn btn-ghost btn-sm">
                Lepas kolektor
              </button>
            </form>
            <form
              method="post"
              action={routes.invoiceCollection.addActivity.href({ invoiceId: invoice.id })}
              class="grid gap-2 border-t pt-4"
            >
              <CsrfInput userId={userId} />
              <div class="grid grid-cols-2 gap-2">
                <input class="input" type="date" name="occurredAt" value={today} max={today} required aria-label="Tanggal" />
                <select class="select" name="outcome" required aria-label="Hasil">
                  {COLLECTION_OUTCOMES.map((outcome) => (
                    <option key={outcome} value={outcome}>
                      {OUTCOME_LABEL[outcome]}
                    </option>
                  ))}
                </select>
              </div>
              <textarea class="textarea min-h-16" name="note" placeholder="Catatan (opsional)" aria-label="Catatan" />
              <button type="submit" class="btn btn-default btn-sm">
                Catat aktivitas
              </button>
            </form>
          </>
        ) : null}

        {collection.history.length ? (
          <ol class="space-y-3 border-t pt-4 text-sm">
            {collection.history.map((assignment) => (
              <li key={assignment.id} class="space-y-1">
                <p class="flex items-center gap-2 font-medium">
                  {collectorAvatar(assignment.collector, 'size-6', { preview: true })}
                  {assignment.collector.name}{' '}
                  <span class="text-xs font-normal text-muted-foreground">
                    {assignment.endedAt
                      ? `${END_REASON_LABEL[assignment.endReason ?? ''] ?? 'Selesai'} ${formatDate(assignment.endedAt)}`
                      : 'aktif'}
                    {assignment.commissionCents !== null ? ` · komisi ${formatIdr(assignment.commissionCents)}` : ''}
                  </span>
                </p>
                {assignment.activities.map((activity) => (
                  <p key={activity.id} class="text-xs text-muted-foreground">
                    {formatDate(activity.occurredAt)} — {OUTCOME_LABEL[activity.outcome]}
                    {activity.note ? `: ${activity.note}` : ''}
                  </p>
                ))}
              </li>
            ))}
          </ol>
        ) : null}
      </div>
      {photoDialogs}
    </section>
  )
}

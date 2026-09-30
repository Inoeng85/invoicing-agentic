import type { Handle, RemixNode } from 'remix/ui'
import type { getInvoice } from '@invoicing/domain'

import { CsrfInput } from '../lib/csrf-field.tsx'
import { routes } from '../routes.ts'
import { icon } from './icons.tsx'
import { alertBox, formatDate, formatDateTime, formatIdr, hasEmail as isUsableEmail, initials, STATUS_LABEL } from './kit.tsx'
import { AppLayout, TaskHeader, type ShellUser } from './layout.tsx'

export type SendState = 'ready' | 'noemail' | 'failed' | 'success'

type Invoice = Awaited<ReturnType<typeof getInvoice>>

export interface SendPageProps {
  user: ShellUser
  invoice: Invoice
  number: string
  state: SendState
  errorMessage?: string
  publicUrl: string
}

function checkItem(ok: boolean, label: string, level: 'error' | 'warning' = 'error') {
  if (ok) {
    return (
      <li class="flex items-center gap-2">
        {icon('circle-check', 'size-4 text-success')}
        {label}
      </li>
    )
  }
  return (
    <li class={`flex items-center gap-2 font-medium ${level === 'error' ? 'text-destructive' : 'text-warning'}`}>
      {icon('circle-alert', 'size-4')}
      {label}
    </li>
  )
}

export function SendPage(handle: Handle<SendPageProps>) {
  return () => {
    let { user, invoice, number, state, errorMessage, publicUrl } = handle.props
    let invoiceId = invoice.id
    let legalName = invoice.user.profile?.legalName ?? user.legalName
    let bankDetails = invoice.user.profile?.bankDetails
    let pdfHref = routes.invoicePdf.href({ invoiceId })
    let hasEmail = isUsableEmail(invoice.client.email)
    let hasLines = invoice.lineItems.length > 0 && invoice.totalCents > 0
    let canSend = hasEmail && hasLines
    let isSent = state === 'success'

    let checklist = (
      <section class="card gap-4">
        <div class="card-header">
          <h2 class="card-title">Checklist sebelum kirim</h2>
        </div>
        <div class="card-content">
          <ul class="grid gap-2.5 text-sm">
            {checkItem(hasEmail, hasEmail ? 'Klien punya email' : 'Klien belum punya email')}
            {checkItem(
              hasLines,
              hasLines ? `${invoice.lineItems.length} item pekerjaan, total > 0` : 'Belum ada item dengan total > 0',
            )}
            {checkItem(Boolean(bankDetails), bankDetails ? 'Rekening di profil bisnis' : 'Rekening belum diisi', 'warning')}
            {invoice.ppnEnabled
              ? checkItem(true, `PPN ${Math.round(invoice.ppnRate * 100)}% · ${formatIdr(invoice.ppnCents)}`)
              : null}
          </ul>
        </div>
      </section>
    )

    let sendForm = (label: string) => (
      <form method="post" action={routes.invoiceSend.href({ invoiceId })}>
        <CsrfInput userId={user.id} />
        <button type="submit" class="btn btn-default btn-lg w-full" disabled={!canSend}>
          {icon('send')}
          {label}
        </button>
      </form>
    )

    let panel: RemixNode
    if (state === 'ready') {
      panel = (
        <>
          {checklist}
          {alertBox(
            'info',
            'Nomor dikunci setelah kirim',
            <p>
              Invoice mendapat nomor <span class="font-mono">{number}</span> dan item tidak bisa diedit lagi.
            </p>,
            'lock',
          )}
          {sendForm('Kirim ke klien')}
          <a class="btn btn-outline w-full" href={pdfHref}>
            {icon('eye')}
            Preview PDF
          </a>
        </>
      )
    } else if (state === 'noemail') {
      panel = (
        <>
          {checklist}
          <p id="ne-msg" class="field-message">
            Email klien wajib untuk kirim.
          </p>
          <button type="button" class="btn btn-default btn-lg w-full" disabled aria-describedby="ne-msg">
            {icon('send')}
            Kirim ke klien
          </button>
          <a class="btn btn-outline w-full" href={routes.clients.edit.href({ clientId: invoice.clientId })}>
            Lengkapi data klien
          </a>
        </>
      )
    } else if (state === 'failed') {
      panel = (
        <>
          {alertBox(
            'destructive',
            'Email gagal terkirim',
            <p>
              {errorMessage ?? 'Server email tidak merespons.'} Invoice <strong>tetap draft</strong> dan nomor belum
              dipakai.
            </p>,
          )}
          <section class="card gap-3 py-5">
            <div class="card-content space-y-2 text-sm text-muted-foreground">
              <p class="font-medium text-foreground">Yang bisa dilakukan</p>
              <p>1. Coba kirim lagi dalam beberapa menit.</p>
              <p>2. Atau unduh PDF dan kirim manual — status tetap draft sampai terkirim lewat aplikasi.</p>
            </div>
          </section>
          {sendForm('Coba kirim lagi')}
          <a class="btn btn-outline w-full" href={pdfHref}>
            {icon('download')}
            Unduh PDF
          </a>
        </>
      )
    } else {
      panel = (
        <>
          {alertBox(
            'success',
            `Terkirim ke ${invoice.client.email}`,
            <p>
              {formatDateTime(invoice.sentAt)} · nomor <span class="font-mono">{invoice.number}</span>
            </p>,
          )}
          {publicUrl ? (
            <section class="card gap-4">
              <div class="card-header">
                <h2 class="card-title">Tautan publik</h2>
                <p class="card-description">Bagikan lewat WhatsApp bila perlu.</p>
              </div>
              <div class="card-content">
                <input class="input font-mono text-xs" readonly value={publicUrl} aria-label="Tautan publik" />
              </div>
            </section>
          ) : null}
          <a class="btn btn-default w-full" href={routes.invoices.show.href({ invoiceId })}>
            Lihat detail invoice
            {icon('arrow-right')}
          </a>
          <a class="btn btn-ghost w-full" href={routes.invoices.index.href()}>
            Kembali ke daftar
          </a>
        </>
      )
    }

    let header = (
      <TaskHeader
        backHref={
          isSent ? routes.invoices.show.href({ invoiceId }) : routes.invoices.edit.href({ invoiceId })
        }
        backLabel={isSent ? 'Kembali ke invoice' : 'Kembali ke editor'}
        title="Kirim invoice ke klien"
        subtitle={`${STATUS_LABEL[isSent ? 'sent' : 'draft']} · ${invoice.client.name} · ${formatIdr(invoice.totalCents)}`}
      />
    )

    return (
      <AppLayout title="Kirim invoice" user={user} header={header}>
        <div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <section class="card gap-0 overflow-hidden py-0" aria-label="Preview email">
            <div class="space-y-1 border-b bg-muted/40 px-6 py-4 text-sm">
              <div class="grid grid-cols-[4.5rem_1fr] gap-2">
                <span class="text-muted-foreground">Dari</span>
                <span>
                  {legalName} &lt;noreply@invoice.app&gt; · balas ke {user.email}
                </span>
              </div>
              <div class="grid grid-cols-[4.5rem_1fr] gap-2">
                <span class="text-muted-foreground">Kepada</span>
                {hasEmail ? (
                  <span>{invoice.client.email}</span>
                ) : (
                  <span class="font-medium text-destructive">— Email klien wajib untuk kirim</span>
                )}
              </div>
              <div class="grid grid-cols-[4.5rem_1fr] gap-2">
                <span class="text-muted-foreground">Subjek</span>
                <span class="font-medium">
                  Invoice {number} dari {legalName}
                </span>
              </div>
            </div>
            <div class="bg-page p-6 sm:p-10">
              <div class="mx-auto max-w-md space-y-5 rounded-xl border bg-card p-6 text-sm shadow-xs">
                <div class="flex items-center gap-2">
                  <span class="grid size-8 place-items-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                    {initials(legalName)}
                  </span>
                  <span class="font-semibold">{legalName}</span>
                </div>
                <p>Halo {invoice.client.name},</p>
                <p class="text-muted-foreground">
                  Berikut invoice
                  {invoice.lineItems[0] ? ` untuk ${invoice.lineItems[0].description.toLowerCase()}` : ''}. Terima
                  kasih atas kerja samanya.
                </p>
                <div class="rounded-lg bg-muted/60 p-4">
                  <p class="text-xs text-muted-foreground">Jumlah tagihan</p>
                  <p class="text-2xl font-bold tabular-nums">{formatIdr(invoice.totalCents)}</p>
                  <p class="text-xs text-muted-foreground">Jatuh tempo {formatDate(invoice.dueDate)}</p>
                </div>
                <span class="btn btn-default w-full" aria-disabled="true">
                  Lihat invoice
                </span>
                <p class="text-xs text-muted-foreground">Tautan ini privat — jangan diteruskan.</p>
                <div class="separator" />
                <p class="text-[11px] text-muted-foreground">Powered by Invoicing · Privasi</p>
              </div>
            </div>
          </section>

          <aside class="space-y-4">{panel}</aside>
        </div>
      </AppLayout>
    )
  }
}

import type { Handle } from 'remix/component'
import { computeLineSubtotalCents, type getInvoiceByPublicToken } from '@invoicing/domain'

import { Document } from '../actions/document.tsx'
import { APP_NAME } from '../lib/brand.ts'
import { routes } from '../routes.ts'
import { icon } from './icons.tsx'
import { daysBetween, formatDate, formatIdr, initials } from './kit.tsx'

type PublicInvoice = Awaited<ReturnType<typeof getInvoiceByPublicToken>>

const longDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const noindex = <meta name="robots" content="noindex, nofollow" />

function dueHint(dueDate: Date): string {
  let days = daysBetween(new Date(), dueDate)
  if (days > 0) return `${days} hari lagi`
  if (days === 0) return 'Jatuh tempo hari ini'
  return `Terlambat ${-days} hari`
}

function PublicFooter() {
  return () => (
    <footer class="border-t">
      <div class="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p class="inline-flex items-center gap-1.5">
          {icon('shield-check', 'size-3.5')}
          Tautan privat — jangan dibagikan ke pihak lain
        </p>
        <p>Powered by {APP_NAME} · Privasi</p>
      </div>
    </footer>
  )
}

export function PublicInvoicePage(handle: Handle<{ invoice: PublicInvoice }>) {
  return () => {
    let { invoice } = handle.props
    let profile = invoice.user.profile
    let legalName = profile?.legalName ?? 'Freelancer'
    let paid = invoice.status === 'paid'
    let overdue = invoice.status === 'overdue'
    let pdfHref = routes.publicInvoicePdf.href({ token: invoice.publicToken! })
    let note = invoice.footerNote ?? profile?.footerDefault

    return (
      <Document title={`Invoice ${invoice.number ?? ''} dari ${legalName}`} head={noindex}>
        <header class="border-b bg-background">
          <div class="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4">
            <div class="flex items-center gap-3">
              <span class="grid size-9 place-items-center rounded-lg bg-primary/10 font-semibold text-primary">
                {initials(legalName)}
              </span>
              <div class="leading-tight">
                <p class="font-semibold">Invoice dari {legalName}</p>
                <p class="text-xs text-muted-foreground">{invoice.user.email}</p>
              </div>
            </div>
            <div class="flex gap-2 print:hidden">
              <a class="btn btn-ghost btn-icon btn-sm" href={pdfHref} aria-label="Cetak atau unduh PDF">
                {icon('printer')}
              </a>
              <a class="btn btn-default btn-sm" href={pdfHref}>
                {icon('download')}
                Unduh PDF
              </a>
            </div>
          </div>
        </header>

        <main class="mx-auto max-w-3xl space-y-6 px-4 py-10">
          <section class="card overflow-hidden py-0">
            <div
              class={`flex flex-wrap items-end justify-between gap-4 px-6 py-8 sm:px-10 ${paid ? 'bg-success/5' : 'bg-primary/5'}`}
            >
              <div class="space-y-2">
                {paid ? (
                  <span class="badge badge-paid">
                    <span class="badge-dot" />
                    Lunas
                  </span>
                ) : overdue ? (
                  <span class="badge badge-overdue">
                    <span class="badge-dot" />
                    Lewat jatuh tempo
                  </span>
                ) : (
                  <span class="badge badge-sent">
                    <span class="badge-dot" />
                    Menunggu pembayaran
                  </span>
                )}
                <p class="text-sm text-muted-foreground">Jumlah tagihan</p>
                <p class="text-4xl font-semibold tracking-tight tabular-nums">{formatIdr(invoice.totalCents)}</p>
              </div>
              <div class="text-sm sm:text-right">
                {paid ? (
                  <>
                    <p class="text-muted-foreground">Dibayar</p>
                    <p class="font-medium">{invoice.paidAt ? longDate.format(invoice.paidAt) : '—'}</p>
                    <p class="text-xs text-muted-foreground">Terima kasih!</p>
                  </>
                ) : (
                  <>
                    <p class="text-muted-foreground">Jatuh tempo</p>
                    <p class="font-medium">{longDate.format(invoice.dueDate)}</p>
                    <p class={`text-xs ${overdue ? 'font-medium text-warning' : 'text-muted-foreground'}`}>
                      {dueHint(invoice.dueDate)}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div class="space-y-8 px-6 py-8 sm:px-10">
              <div class="grid gap-6 text-sm sm:grid-cols-3">
                <div>
                  <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Nomor</p>
                  <p class="mt-1 font-mono">{invoice.number}</p>
                </div>
                <div>
                  <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Tanggal terbit</p>
                  <p class="mt-1">{formatDate(invoice.issueDate)}</p>
                </div>
                <div>
                  <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Ditagihkan ke</p>
                  <p class="mt-1 font-medium">{invoice.client.name}</p>
                  {invoice.client.address ? (
                    <p class="whitespace-pre-line text-muted-foreground">{invoice.client.address}</p>
                  ) : null}
                </div>
              </div>

              <ul class="divide-y rounded-lg border" role="list">
                {invoice.lineItems.map((line) => (
                  <li key={line.id} class="flex items-start justify-between gap-4 p-4 text-sm">
                    <div>
                      <p class="font-medium">{line.description}</p>
                      <p class="text-muted-foreground">
                        {line.quantity} × {formatIdr(line.unitPriceCents)}
                        {line.discountCents > 0 ? ` · diskon ${formatIdr(line.discountCents)}` : ''}
                      </p>
                    </div>
                    <p class="font-medium tabular-nums">
                      {formatIdr(computeLineSubtotalCents(line))}
                    </p>
                  </li>
                ))}
              </ul>

              <dl class="ml-auto max-w-xs space-y-2 text-sm">
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
            </div>
          </section>

          {!paid && (profile?.bankDetails || note) ? (
            <section class="card" aria-labelledby="pay-title">
              <div class="card-header">
                <h2 id="pay-title" class="card-title">
                  Cara pembayaran
                </h2>
                <p class="card-description">Transfer sesuai total, lalu konfirmasi ke penerbit invoice.</p>
              </div>
              <div class="card-content">
                {profile?.bankDetails ? (
                  <div class="flex items-center gap-3 rounded-lg border p-4">
                    <span class="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                      {icon('wallet', 'size-4')}
                    </span>
                    <p class="font-mono text-sm font-medium whitespace-pre-line">{profile.bankDetails}</p>
                  </div>
                ) : null}
                {note ? <p class="mt-4 text-sm whitespace-pre-line text-muted-foreground">Catatan: {note}</p> : null}
              </div>
            </section>
          ) : null}

          {invoice.ppnEnabled ? (
            <div class="alert">
              {icon('info')}
              <p class="alert-title">Catatan pajak</p>
              <p class="alert-description">
                PPN pada invoice ini dihitung sebagai informasi penagihan dan bukan Faktur Pajak elektronik (e-Faktur).
              </p>
            </div>
          ) : null}
        </main>

        <PublicFooter />
      </Document>
    )
  }
}

export function PublicInvoiceUnavailable() {
  return () => (
    <Document title={`Tautan tidak tersedia — ${APP_NAME}`} head={noindex}>
      <main class="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <span class="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          {icon('link', 'size-5')}
        </span>
        <h1 class="text-xl font-bold">Tautan tidak tersedia</h1>
        <p class="text-sm text-muted-foreground">
          Tautan invoice ini tidak valid atau sudah dicabut oleh penerbit. Hubungi penerbit invoice untuk tautan baru.
        </p>
      </main>
      <PublicFooter />
    </Document>
  )
}

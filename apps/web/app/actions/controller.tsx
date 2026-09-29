import { createController } from 'remix/router'
import { redirect } from 'remix/response/redirect'
import {
  buildInvoicePdfBytes,
  formatIdr,
  getDashboardSummary,
  getInvoiceByPublicToken,
  getUserById,
  markInvoicePaid,
  sendInvoice,
} from '@invoicing/domain'

import { Document } from './document.tsx'
import { requireUserId } from '../lib/auth.ts'
import { clearSessionCookie } from '../lib/session.ts'
import { AppLayout } from '../ui/layout.tsx'
import { assets } from '../assets.ts'
import { routes } from '../routes.ts'

export default createController(routes, {
  actions: {
    async assets(context) {
      return (await assets.fetch(context.request)) ?? new Response('Not Found', { status: 404 })
    },

    async home(context) {
      let userId = requireUserId(context.request)
      let user = await getUserById(userId)
      let summary = await getDashboardSummary(userId)
      return context.render(
        <AppLayout title="Dashboard" userEmail={user?.email}>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-xl border bg-white p-4">
              <p class="text-xs uppercase text-slate-500">Outstanding</p>
              <p class="text-2xl font-bold">{formatIdr(summary.outstandingCents)}</p>
              <p class="text-sm text-slate-500">{summary.outstandingCount} invoice</p>
            </div>
            <div class="rounded-xl border bg-white p-4">
              <p class="text-xs uppercase text-slate-500">Total invoice</p>
              <p class="text-2xl font-bold">{summary.invoices.length}</p>
            </div>
          </div>
          <section class="mt-8">
            <h2 class="font-semibold">Invoice terbaru</h2>
            <ul class="mt-2 divide-y rounded-xl border bg-white">
              {summary.invoices.slice(0, 5).map((inv) => (
                <li key={inv.id} class="px-4 py-3 text-sm">
                  {inv.number ?? 'DRAFT'} · {inv.status} · {formatIdr(inv.totalCents)}
                </li>
              ))}
            </ul>
          </section>
          <form method="post" action={routes.logout.href()} class="mt-8">
            <button type="submit" class="text-sm text-slate-500 underline">
              Logout
            </button>
          </form>
        </AppLayout>,
      )
    },

    async logout() {
      let headers = new Headers()
      clearSessionCookie(headers)
      throw redirect(routes.login.index.href(), { headers, status: 303 })
    },

    async invoiceSend(context) {
      let userId = requireUserId(context.request)
      let appUrl = process.env.APP_URL ?? 'http://localhost:44100'
      await sendInvoice(userId, context.params.invoiceId, { appUrl })
      throw redirect(routes.invoices.show.href({ invoiceId: context.params.invoiceId }), 303)
    },

    async invoiceMarkPaid(context) {
      let userId = requireUserId(context.request)
      await markInvoicePaid(userId, context.params.invoiceId)
      throw redirect(routes.invoices.show.href({ invoiceId: context.params.invoiceId }), 303)
    },

    async invoicePdf(context) {
      let userId = requireUserId(context.request)
      let bytes = await buildInvoicePdfBytes(userId, context.params.invoiceId)
      return new Response(Buffer.from(bytes), {
        headers: { 'Content-Type': 'application/pdf' },
      })
    },

    async publicInvoice(context) {
      try {
        let invoice = await getInvoiceByPublicToken(context.params.token)
        return context.render(
          <Document title={`Invoice ${invoice.number ?? ''}`}>
            <div class="page-container py-8">
              <div class="mx-auto max-w-2xl rounded-xl border bg-white p-6 shadow-sm">
                <h1 class="text-xl font-bold">{invoice.user.profile?.legalName}</h1>
                <p class="text-sm text-slate-500">Invoice {invoice.number}</p>
                <p class="mt-4 text-sm">Kepada: {invoice.client.name}</p>
                <ul class="mt-4 list-disc pl-5 text-sm">
                  {invoice.lineItems.map((line) => (
                    <li key={line.id}>{line.description}</li>
                  ))}
                </ul>
                <p class="mt-4 font-semibold">Total: {formatIdr(invoice.totalCents)}</p>
                <p class="mt-2 text-xs text-slate-500">Tampilan read-only (FR-06). PPN bukan e-Faktur.</p>
              </div>
            </div>
          </Document>,
        )
      } catch {
        return new Response('Link tidak valid', { status: 404 })
      }
    },
  },
})

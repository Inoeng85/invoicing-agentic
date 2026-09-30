import { createController } from 'remix/router'
import type { RenderFunction } from 'remix/middleware/render'
import { redirect } from 'remix/response/redirect'
import {
  buildInvoicePdfBytes,
  cancelInvoice,
  deleteInvoiceDraft,
  getClient,
  getDashboardSummary,
  getInvoice,
  getInvoiceByPublicToken,
  isDomainError,
  listInvoices,
  markInvoicePaid,
  revokePublicLink,
  sendInvoice,
  updateClient,
} from '@invoicing/domain'

import { assertCsrf } from '../lib/csrf.ts'
import { requireUserId } from '../lib/auth.ts'
import { clearSessionCookie } from '../lib/session.ts'
import { icon } from '../ui/icons.tsx'
import { appUrl, invoiceTable, statusTabs, type StatusFilter } from '../ui/invoice-table.tsx'
import {
  alertBox,
  daysBetween,
  formatIdr,
  greeting,
  hasEmail,
  isInvoiceStatus,
  metricCard,
  nextInvoiceNumber,
  pageTitle,
} from '../ui/kit.tsx'
import { AppLayout, loadShellUser } from '../ui/layout.tsx'
import { PublicInvoicePage, PublicInvoiceUnavailable } from '../ui/public-invoice.tsx'
import { SendPage, type SendState } from '../ui/send-page.tsx'
import { assets } from '../assets.ts'
import { routes } from '../routes.ts'

const DASHBOARD_TABS: StatusFilter[] = ['all', 'draft', 'sent', 'overdue', 'paid']

function showRedirect(invoiceId: string, notice?: string): never {
  let href = routes.invoices.show.href({ invoiceId })
  throw redirect(notice ? `${href}?notice=${notice}` : href, 303)
}

export default createController(routes, {
  actions: {
    async assets(context) {
      return (await assets.fetch(context.request)) ?? new Response('Not Found', { status: 404 })
    },

    async home(context) {
      let userId = requireUserId(context.request)
      let [user, summary] = await Promise.all([loadShellUser(userId), getDashboardSummary(userId)])
      let status = context.url.searchParams.get('status')
      let active: StatusFilter = isInvoiceStatus(status) ? status : 'all'

      let overdue = summary.invoices.filter((i) => i.status === 'overdue')
      let drafts = summary.invoices.filter((i) => i.status === 'draft')
      let sum = (list: typeof summary.invoices) => list.reduce((total, i) => total + i.totalCents, 0)
      let oldestOverdue = overdue.reduce<(typeof overdue)[number] | null>(
        (oldest, i) => (!oldest || i.dueDate < oldest.dueDate ? i : oldest),
        null,
      )
      let lateDays = oldestOverdue ? daysBetween(oldestOverdue.dueDate, new Date()) : 0
      let rows = summary.invoices.filter((i) => active === 'all' || i.status === active).slice(0, 8)

      return context.render(
        <AppLayout title="Dashboard" user={user} active="dashboard">
          {pageTitle('Dashboard', `${greeting(user.legalName)} Ini ringkasan tagihan ${user.legalName}.`)}

          {oldestOverdue
            ? alertBox(
                'warning',
                `${overdue.length} invoice lewat jatuh tempo`,
                <p>
                  {overdue.length === 1
                    ? `${oldestOverdue.number} untuk ${oldestOverdue.client.name} terlambat ${lateDays} hari (${formatIdr(oldestOverdue.totalCents)}). `
                    : `Total ${formatIdr(sum(overdue))}; paling lama terlambat ${lateDays} hari. `}
                  <a
                    href={`${routes.invoices.index.href()}?status=overdue`}
                    class="font-medium underline underline-offset-4"
                  >
                    Tindak lanjuti
                  </a>
                </p>,
              )
            : null}

          <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Ringkasan">
            {metricCard({
              label: 'Outstanding (IDR)',
              value: formatIdr(summary.outstandingCents),
              hint: `${summary.outstandingCount} invoice terkirim belum lunas`,
              iconName: 'wallet',
              tone: 'primary',
              class: 'sm:col-span-2 lg:col-span-1',
            })}
            {metricCard({
              label: 'Jatuh tempo',
              value: String(overdue.length),
              hint: overdue.length ? `${formatIdr(sum(overdue))} · lewat ${lateDays} hari` : 'Tidak ada yang terlambat',
              iconName: 'triangle-alert',
              tone: overdue.length ? 'warning' : 'muted',
            })}
            {metricCard({
              label: 'Draft',
              value: String(drafts.length),
              hint: `${formatIdr(sum(drafts))} belum dikirim`,
              iconName: 'file-text',
            })}
          </section>

          <section class="space-y-4" aria-labelledby="recent-title">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 id="recent-title" class="text-lg font-semibold tracking-tight">
                Invoice terbaru
              </h2>
              {statusTabs({
                invoices: summary.invoices,
                active,
                include: DASHBOARD_TABS,
                href: (key) => (key === 'all' ? routes.home.href() : `${routes.home.href()}?status=${key}`),
              })}
            </div>
            {summary.invoices.length === 0 ? (
              <div class="card items-center py-12 text-center">
                <span class="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                  {icon('file-text', 'size-5')}
                </span>
                <div class="space-y-1">
                  <p class="font-semibold">Belum ada invoice</p>
                  <p class="text-sm text-muted-foreground">Buat invoice pertama kamu dalam 2 menit.</p>
                </div>
                <a class="btn btn-default" href={routes.invoices.new.href()}>
                  {icon('plus')}
                  Invoice baru
                </a>
              </div>
            ) : (
              invoiceTable({ invoices: rows, userId, emptyText: 'Tidak ada invoice dengan status ini.' })
            )}
          </section>
        </AppLayout>,
      )
    },

    async logout(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let headers = new Headers()
      clearSessionCookie(headers)
      throw redirect(routes.login.index.href(), { headers, status: 303 })
    },

    async clientSetActive(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let formData = await context.request.formData()
      let active = formData.get('active') === 'true'
      await getClient(userId, context.params.clientId)
      await updateClient(userId, context.params.clientId, { active })
      let back = formData.get('redirectTo')
      let target =
        typeof back === 'string' && back.startsWith('/') && !back.startsWith('//')
          ? back
          : routes.clients.index.href()
      throw redirect(target, 303)
    },

    async invoiceSendReview(context) {
      let userId = requireUserId(context.request)
      let invoice = await getInvoice(userId, context.params.invoiceId)
      let sentNotice = context.url.searchParams.get('sent') === '1'
      if (invoice.status !== 'draft' && !sentNotice) showRedirect(invoice.id)
      let state: SendState = invoice.status !== 'draft' ? 'success' : hasEmail(invoice.client.email) ? 'ready' : 'noemail'
      return renderSend(context, userId, invoice.id, state)
    },

    async invoiceSend(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let invoiceId = context.params.invoiceId
      try {
        await sendInvoice(userId, invoiceId, { appUrl: appUrl() })
      } catch (error) {
        if (!isDomainError(error)) throw error
        if (error.code === 'already_sent') showRedirect(invoiceId)
        let state: SendState = error.code === 'missing_client_email' ? 'noemail' : 'failed'
        return renderSend(context, userId, invoiceId, state, error.message, 422)
      }
      throw redirect(`${routes.invoiceSendReview.href({ invoiceId })}?sent=1`, 303)
    },

    async invoiceMarkPaid(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      await markInvoicePaid(userId, context.params.invoiceId)
      showRedirect(context.params.invoiceId, 'paid')
    },

    async invoiceRevokeLink(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      await revokePublicLink(userId, context.params.invoiceId)
      showRedirect(context.params.invoiceId, 'revoked')
    },

    async invoiceCancel(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      await cancelInvoice(userId, context.params.invoiceId)
      showRedirect(context.params.invoiceId, 'cancelled')
    },

    async invoiceDeleteDraft(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      await deleteInvoiceDraft(userId, context.params.invoiceId)
      throw redirect(`${routes.invoices.index.href()}?notice=deleted`, 303)
    },

    async invoicePdf(context) {
      let userId = requireUserId(context.request)
      let invoice = await getInvoice(userId, context.params.invoiceId)
      let bytes = await buildInvoicePdfBytes(userId, invoice.id)
      return new Response(Buffer.from(bytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${invoice.number ?? 'draft'}.pdf"`,
        },
      })
    },

    async publicInvoice(context) {
      try {
        let invoice = await getInvoiceByPublicToken(context.params.token)
        return context.render(<PublicInvoicePage invoice={invoice} />)
      } catch (error) {
        if (!isDomainError(error)) throw error
        return context.render(<PublicInvoiceUnavailable />, { status: 404 })
      }
    },

    async publicInvoicePdf(context) {
      try {
        let invoice = await getInvoiceByPublicToken(context.params.token)
        let bytes = await buildInvoicePdfBytes(invoice.userId, invoice.id)
        return new Response(Buffer.from(bytes), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${invoice.number ?? 'invoice'}.pdf"`,
            'X-Robots-Tag': 'noindex, nofollow',
          },
        })
      } catch (error) {
        if (!isDomainError(error)) throw error
        return new Response('Link tidak valid', { status: 404 })
      }
    },
  },
})

async function renderSend(
  context: { render: RenderFunction },
  userId: string,
  invoiceId: string,
  state: SendState,
  errorMessage?: string,
  status = 200,
) {
  let [user, invoice, invoices] = await Promise.all([
    loadShellUser(userId),
    getInvoice(userId, invoiceId),
    listInvoices(userId),
  ])
  let number = invoice.number ?? nextInvoiceNumber(invoices.map((i) => i.number), invoice.issueDate.getFullYear())
  return context.render(
    <SendPage
      user={user}
      invoice={invoice}
      number={number}
      state={state}
      errorMessage={errorMessage}
      publicUrl={invoice.publicToken ? `${appUrl()}${routes.publicInvoice.href({ token: invoice.publicToken })}` : ''}
    />,
    { status },
  )
}

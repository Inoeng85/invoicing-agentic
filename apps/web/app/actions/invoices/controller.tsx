import { createController } from 'remix/router'
import type { RenderFunction } from 'remix/middleware/render'
import { redirect } from 'remix/response/redirect'
import {
  createInvoiceDraft,
  getInvoice,
  getUserById,
  isDomainError,
  listClients,
  listInvoices,
  updateInvoiceDraft,
} from '@invoicing/domain'

import { assertCsrf } from '../../lib/csrf.ts'
import { requireUserId } from '../../lib/auth.ts'
import { icon } from '../../ui/icons.tsx'
import { InvoiceDetail } from '../../ui/invoice-detail.tsx'
import {
  EMPTY_LINE,
  InvoiceEditor,
  isBlankLine,
  lineToCents,
  readEditorValues,
  type EditorValues,
} from '../../ui/invoice-editor.tsx'
import { appUrl, invoiceTable, statusTabs, type StatusFilter } from '../../ui/invoice-table.tsx'
import {
  alertBox,
  formatIdr,
  isInvoiceStatus,
  nextInvoiceNumber,
  pageTitle,
  parseDateInput,
  toDateInput,
} from '../../ui/kit.tsx'
import { AppLayout, loadShellUser } from '../../ui/layout.tsx'
import { routes } from '../../routes.ts'

const EDITOR_NOTICES: Record<string, string> = {
  saved: 'Draft invoice tersimpan',
}

function centsToIdrInput(cents: number): string {
  return String(Math.round(cents / 100))
}

async function renderEditor(
  context: { render: RenderFunction },
  userId: string,
  options: { invoiceId?: string; values: EditorValues; error?: string; notice?: string; status?: number },
) {
  let [user, account, clients, invoices] = await Promise.all([
    loadShellUser(userId),
    getUserById(userId),
    listClients(userId),
    listInvoices(userId),
  ])
  let issueYear = parseDateInput(options.values.issueDate)?.getFullYear()
  return context.render(
    <InvoiceEditor
      user={user}
      action={
        options.invoiceId
          ? routes.invoices.update.href({ invoiceId: options.invoiceId })
          : routes.invoices.create.href()
      }
      invoiceId={options.invoiceId}
      clients={clients}
      values={options.values}
      nextNumber={nextInvoiceNumber(
        invoices.map((i) => i.number),
        issueYear,
      )}
      defaultDueDays={account?.profile?.defaultDueDays ?? 30}
      error={options.error}
      notice={options.notice}
    />,
    { status: options.status ?? 200 },
  )
}

/** Handles save / preview / pdf / send and the no-JS "+ Baris" and remove-row buttons. */
async function submitEditor(context: { request: Request; render: RenderFunction }, invoiceId?: string) {
  let userId = requireUserId(context.request)
  await assertCsrf(context.request, userId)
  let formData = await context.request.formData()
  let values = readEditorValues(formData)
  let intent = String(formData.get('intent') ?? 'save')

  if (intent === 'add-line') {
    values.lines.push({ ...EMPTY_LINE })
    return renderEditor(context, userId, { invoiceId, values })
  }
  if (intent.startsWith('remove:')) {
    values.lines.splice(Number(intent.slice('remove:'.length)), 1)
    if (values.lines.length === 0) values.lines.push({ ...EMPTY_LINE })
    return renderEditor(context, userId, { invoiceId, values })
  }

  let lines = values.lines.filter((line) => !isBlankLine(line)).map(lineToCents)
  let issueDate = parseDateInput(values.issueDate)
  let dueDate = parseDateInput(values.dueDate)
  let error: string | undefined
  if (!values.clientId) error = 'Pilih klien untuk invoice ini.'
  else if (lines.length === 0) error = 'Tambahkan minimal satu line item.'
  else if (lines.some((l) => !l.description)) error = 'Setiap baris wajib punya deskripsi.'
  else if (lines.some((l) => !Number.isFinite(l.quantity) || l.quantity <= 0)) error = 'Qty harus lebih dari 0.'
  else if (issueDate && dueDate && dueDate < issueDate) error = 'Jatuh tempo tidak boleh sebelum tanggal terbit.'

  if (error) {
    if (values.lines.length === 0) values.lines.push({ ...EMPTY_LINE })
    return renderEditor(context, userId, { invoiceId, values, error, status: 422 })
  }

  let input = {
    clientId: values.clientId,
    issueDate,
    dueDate,
    ppnEnabled: values.ppnEnabled,
    footerNote: values.footerNote.trim() || undefined,
    lines,
  }
  let savedId: string
  try {
    savedId = invoiceId
      ? (await updateInvoiceDraft(userId, invoiceId, { ...input, footerNote: input.footerNote ?? null })).id
      : (await createInvoiceDraft(userId, input)).id
  } catch (caught) {
    if (!isDomainError(caught)) throw caught
    return renderEditor(context, userId, { invoiceId, values, error: caught.message, status: 422 })
  }

  let target =
    intent === 'send'
      ? routes.invoiceSendReview.href({ invoiceId: savedId })
      : intent === 'pdf'
        ? routes.invoicePdf.href({ invoiceId: savedId })
        : intent === 'preview'
          ? routes.invoices.show.href({ invoiceId: savedId })
          : `${routes.invoices.edit.href({ invoiceId: savedId })}?notice=saved`
  throw redirect(target, 303)
}

export default createController(routes.invoices, {
  actions: {
    async index(context) {
      let userId = requireUserId(context.request)
      let [user, invoices] = await Promise.all([loadShellUser(userId), listInvoices(userId)])
      let status = context.url.searchParams.get('status')
      let active: StatusFilter = isInvoiceStatus(status) ? status : 'all'
      let q = (context.url.searchParams.get('q') ?? '').trim()
      let needle = q.toLowerCase()
      let matches = invoices.filter(
        (i) =>
          !needle || i.number?.toLowerCase().includes(needle) || i.client.name.toLowerCase().includes(needle),
      )
      let rows = matches.filter((i) => active === 'all' || i.status === active)

      let open = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue')
      let overdue = invoices.filter((i) => i.status === 'overdue')
      let now = new Date()
      let paidThisMonth = invoices.filter(
        (i) =>
          i.status === 'paid' &&
          i.paidAt &&
          i.paidAt.getFullYear() === now.getFullYear() &&
          i.paidAt.getMonth() === now.getMonth(),
      )
      let monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(now)
      let tabHref = (key: StatusFilter) => {
        let params = new URLSearchParams()
        if (key !== 'all') params.set('status', key)
        if (q) params.set('q', q)
        let query = params.toString()
        return query ? `${routes.invoices.index.href()}?${query}` : routes.invoices.index.href()
      }

      return context.render(
        <AppLayout title="Invoice" user={user} active="invoices">
          {pageTitle(
            'Invoice',
            `Semua invoice ${user.legalName}. Filter status dan cari nomor atau klien.`,
            <a class="btn btn-default" href={routes.invoices.new.href()}>
              {icon('plus')}
              Invoice baru
            </a>,
          )}

          {context.url.searchParams.get('notice') === 'deleted' ? alertBox('success', 'Draft dihapus') : null}

          <section class="grid gap-4 sm:grid-cols-3" aria-label="Ringkasan">
            <div class="rounded-xl border bg-card p-4">
              <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Outstanding</p>
              <p class="mt-1 text-2xl font-bold tabular-nums">
                {formatIdr(open.reduce((sum, i) => sum + i.totalCents, 0))}
              </p>
              <p class="text-xs text-muted-foreground">Terkirim + jatuh tempo</p>
            </div>
            <div class="rounded-xl border bg-card p-4">
              <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Jatuh tempo</p>
              <p class={`mt-1 text-2xl font-bold tabular-nums ${overdue.length ? 'text-warning' : ''}`}>
                {overdue.length} invoice
              </p>
              <p class="text-xs text-muted-foreground">due &lt; hari ini &amp; status terkirim</p>
            </div>
            <div class="rounded-xl border bg-card p-4">
              <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Lunas ({monthLabel})</p>
              <p class="mt-1 text-2xl font-bold text-success tabular-nums">
                {formatIdr(paidThisMonth.reduce((sum, i) => sum + i.totalCents, 0))}
              </p>
              <p class="text-xs text-muted-foreground">{paidThisMonth.length} invoice</p>
            </div>
          </section>

          {invoiceTable({
            invoices: rows,
            userId,
            emptyText: invoices.length
              ? 'Tidak ada invoice yang cocok dengan filter.'
              : 'Belum ada invoice. Klik "Invoice baru" untuk mulai.',
            toolbar: (
              <div class="flex flex-wrap items-center gap-3 border-b p-3">
                {statusTabs({ invoices: matches, active, href: tabHref })}
                <form method="get" action={routes.invoices.index.href()} class="relative ml-auto w-full max-w-xs">
                  {active !== 'all' ? <input type="hidden" name="status" value={active} /> : null}
                  {icon(
                    'search',
                    'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground',
                  )}
                  <input
                    class="input h-8 pl-9"
                    type="search"
                    name="q"
                    value={q}
                    placeholder="Cari nomor atau klien…"
                    aria-label="Cari invoice"
                  />
                </form>
              </div>
            ),
          })}
        </AppLayout>,
      )
    },

    async new(context) {
      let userId = requireUserId(context.request)
      let account = await getUserById(userId)
      let issueDate = new Date()
      let dueDate = new Date(issueDate)
      dueDate.setDate(dueDate.getDate() + (account?.profile?.defaultDueDays ?? 30))
      return renderEditor(context, userId, {
        values: {
          clientId: context.url.searchParams.get('clientId') ?? '',
          issueDate: toDateInput(issueDate),
          dueDate: toDateInput(dueDate),
          ppnEnabled: false,
          footerNote: account?.profile?.footerDefault ?? '',
          lines: [{ ...EMPTY_LINE }],
        },
      })
    },

    create(context) {
      return submitEditor(context)
    },

    async show(context) {
      let userId = requireUserId(context.request)
      let [user, invoice] = await Promise.all([loadShellUser(userId), getInvoice(userId, context.params.invoiceId)])
      return context.render(
        <InvoiceDetail
          user={user}
          invoice={invoice}
          notice={context.url.searchParams.get('notice')}
          publicUrl={
            invoice.publicToken ? `${appUrl()}${routes.publicInvoice.href({ token: invoice.publicToken })}` : ''
          }
        />,
      )
    },

    async edit(context) {
      let userId = requireUserId(context.request)
      let invoice = await getInvoice(userId, context.params.invoiceId)
      if (invoice.status !== 'draft') {
        throw redirect(routes.invoices.show.href({ invoiceId: invoice.id }), 303)
      }
      let notice = EDITOR_NOTICES[context.url.searchParams.get('notice') ?? '']
      return renderEditor(context, userId, {
        invoiceId: invoice.id,
        notice,
        values: {
          clientId: invoice.clientId,
          issueDate: toDateInput(invoice.issueDate),
          dueDate: toDateInput(invoice.dueDate),
          ppnEnabled: invoice.ppnEnabled,
          footerNote: invoice.footerNote ?? '',
          lines: invoice.lineItems.length
            ? invoice.lineItems.map((line) => ({
                description: line.description,
                quantity: String(line.quantity),
                unitPriceIdr: centsToIdrInput(line.unitPriceCents),
                discountIdr: centsToIdrInput(line.discountCents),
              }))
            : [{ ...EMPTY_LINE }],
        },
      })
    },

    update(context) {
      return submitEditor(context, context.params.invoiceId)
    },
  },
})

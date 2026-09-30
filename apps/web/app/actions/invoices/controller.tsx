import { createController } from 'remix/router'
import type { Handle } from 'remix/ui'
import { redirect } from 'remix/response/redirect'
import {
  buildInvoicePdfBytes,
  createInvoiceDraft,
  formatIdr,
  getInvoice,
  getUserById,
  listClients,
  listInvoices,
  markInvoicePaid,
  sendInvoice,
  updateInvoiceDraft,
} from '@invoicing/domain'

import { assertCsrf } from '../../lib/csrf.ts'
import { CsrfInput } from '../../lib/csrf-field.tsx'
import { requireUserId } from '../../lib/auth.ts'
import { idrToCents, parseIdrInput } from '../../lib/money.ts'
import { AppLayout } from '../../ui/layout.tsx'
import { routes } from '../../routes.ts'

export default createController(routes.invoices, {
  actions: {
    async index(context) {
      let userId = requireUserId(context.request)
      let user = await getUserById(userId)
      let invoices = await listInvoices(userId)
      return context.render(
        <AppLayout title="Invoice" userEmail={user?.email}>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Invoice</h2>
            <a href={routes.invoices.new.href()} class="rounded bg-blue-600 px-3 py-2 text-sm text-white">
              Buat draft
            </a>
          </div>
          <table class="mt-4 w-full text-left text-sm">
            <thead>
              <tr class="border-b text-slate-500">
                <th class="py-2">Nomor</th>
                <th>Klien</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} class="border-b">
                  <td class="py-2">
                    <a href={routes.invoices.show.href({ invoiceId: inv.id })} class="text-blue-700">
                      {inv.number ?? 'DRAFT'}
                    </a>
                  </td>
                  <td>{inv.client.name}</td>
                  <td>{inv.status}</td>
                  <td>{formatIdr(inv.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AppLayout>,
      )
    },

    async new(context) {
      let userId = requireUserId(context.request)
      let clients = await listClients(userId)
      return context.render(
        <InvoiceDraftForm
          title="Invoice baru"
          action={routes.invoices.create.href()}
          clients={clients}
          userId={userId}
        />,
      )
    },

    async create(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let formData = await context.request.formData()
      let invoice = await createInvoiceDraft(userId, {
        clientId: String(formData.get('clientId') ?? ''),
        ppnEnabled: formData.get('ppnEnabled') === 'on',
        lines: [
          {
            description: String(formData.get('description') ?? ''),
            quantity: Number(formData.get('quantity') ?? 1),
            unitPriceCents: idrToCents(parseIdrInput(String(formData.get('unitPriceIdr') ?? '0'))),
            discountCents: idrToCents(parseIdrInput(String(formData.get('discountIdr') ?? '0'))),
          },
        ],
      })
      throw redirect(routes.invoices.show.href({ invoiceId: invoice.id }), 303)
    },

    async show(context) {
      let userId = requireUserId(context.request)
      let invoice = await getInvoice(userId, context.params.invoiceId)
      let linkRevoked = Boolean(invoice.publicTokenRevokedAt)
      return context.render(
        <AppLayout title={invoice.number ?? 'Draft'}>
          <div class="space-y-4 rounded-xl border bg-white p-6">
            <div class="flex flex-wrap gap-2 text-sm">
              <span class="rounded bg-slate-100 px-2 py-1">{invoice.status}</span>
              <span>Klien: {invoice.client.name}</span>
              {linkRevoked ? <span class="rounded bg-amber-100 px-2 py-1">Link publik dicabut</span> : null}
            </div>
            <p>Subtotal: {formatIdr(invoice.subtotalCents)}</p>
            {invoice.ppnEnabled ? <p>PPN: {formatIdr(invoice.ppnCents)}</p> : null}
            <p class="font-semibold">Total: {formatIdr(invoice.totalCents)}</p>
            <ul class="list-disc pl-5 text-sm">
              {invoice.lineItems.map((line) => (
                <li key={line.id}>
                  {line.description} — {line.quantity} × {formatIdr(line.unitPriceCents)}
                </li>
              ))}
            </ul>
            <p class="text-xs text-slate-500">PPN hanya kalkulator. Bukan e-Faktur DJP.</p>
            <div class="flex flex-wrap gap-2">
              {invoice.status === 'draft' ? (
                <>
                  <a
                    href={routes.invoices.edit.href({ invoiceId: invoice.id })}
                    class="rounded border px-3 py-2 text-sm"
                  >
                    Edit
                  </a>
                  <form method="post" action={routes.invoiceSend.href({ invoiceId: invoice.id })}>
                    <CsrfInput userId={userId} />
                    <button type="submit" class="rounded bg-blue-600 px-3 py-2 text-sm text-white">
                      Kirim
                    </button>
                  </form>
                </>
              ) : null}
              {invoice.status !== 'draft' && invoice.status !== 'cancelled' ? (
                <a href={routes.invoicePdf.href({ invoiceId: invoice.id })} class="rounded border px-3 py-2 text-sm">
                  PDF
                </a>
              ) : null}
              {invoice.status === 'sent' || invoice.status === 'overdue' ? (
                <>
                  <form method="post" action={routes.invoiceMarkPaid.href({ invoiceId: invoice.id })}>
                    <CsrfInput userId={userId} />
                    <button type="submit" class="rounded bg-emerald-600 px-3 py-2 text-sm text-white">
                      Tandai lunas
                    </button>
                  </form>
                  {!linkRevoked ? (
                    <form method="post" action={routes.invoiceRevokeLink.href({ invoiceId: invoice.id })}>
                      <CsrfInput userId={userId} />
                      <button type="submit" class="rounded border border-amber-500 px-3 py-2 text-sm text-amber-800">
                        Cabut link publik
                      </button>
                    </form>
                  ) : null}
                  <form method="post" action={routes.invoiceCancel.href({ invoiceId: invoice.id })}>
                    <CsrfInput userId={userId} />
                    <button type="submit" class="rounded border border-red-300 px-3 py-2 text-sm text-red-700">
                      Batalkan invoice
                    </button>
                  </form>
                </>
              ) : null}
            </div>
          </div>
        </AppLayout>,
      )
    },

    async edit(context) {
      let userId = requireUserId(context.request)
      let invoice = await getInvoice(userId, context.params.invoiceId)
      let clients = await listClients(userId)
      if (invoice.status !== 'draft') {
        throw redirect(routes.invoices.show.href({ invoiceId: invoice.id }), 303)
      }
      let line = invoice.lineItems[0]
      return context.render(
        <InvoiceDraftForm
          title="Edit draft"
          action={routes.invoices.update.href({ invoiceId: invoice.id })}
          clients={clients}
          userId={userId}
          defaults={{
            clientId: invoice.clientId,
            ppnEnabled: invoice.ppnEnabled,
            description: line?.description ?? '',
            quantity: line?.quantity ?? 1,
            unitPriceIdr: String(Math.round((line?.unitPriceCents ?? 0) / 100)),
            discountIdr: String(Math.round((line?.discountCents ?? 0) / 100)),
          }}
        />,
      )
    },

    async update(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let formData = await context.request.formData()
      await updateInvoiceDraft(userId, context.params.invoiceId, {
        clientId: String(formData.get('clientId') ?? ''),
        ppnEnabled: formData.get('ppnEnabled') === 'on',
        lines: [
          {
            description: String(formData.get('description') ?? ''),
            quantity: Number(formData.get('quantity') ?? 1),
            unitPriceCents: idrToCents(parseIdrInput(String(formData.get('unitPriceIdr') ?? '0'))),
            discountCents: idrToCents(parseIdrInput(String(formData.get('discountIdr') ?? '0'))),
          },
        ],
      })
      throw redirect(routes.invoices.show.href({ invoiceId: context.params.invoiceId }), 303)
    },

  },
})

interface ClientOption {
  id: string
  name: string
}

type InvoiceDraftFormProps = {
  title: string
  action: string
  userId: string
  clients: ClientOption[]
  defaults?: {
    clientId: string
    ppnEnabled: boolean
    description: string
    quantity: number
    unitPriceIdr: string
    discountIdr: string
  }
}

function InvoiceDraftForm(handle: Handle<InvoiceDraftFormProps>) {
  return () => {
    let props = handle.props
    let d = props.defaults
    return (
      <AppLayout title={props.title}>
        <form method="post" action={props.action} class="max-w-lg space-y-3 rounded-xl border bg-white p-6">
          <CsrfInput userId={props.userId} />
          <h2 class="text-lg font-semibold">{props.title}</h2>
          <label class="block text-sm">
            Klien
            <select name="clientId" required class="mt-1 w-full rounded border px-3 py-2" defaultValue={d?.clientId}>
              {props.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label class="block text-sm">
          Deskripsi
          <input name="description" required defaultValue={d?.description} class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label class="block text-sm">
          Qty
          <input name="quantity" type="number" min="0.01" step="0.01" defaultValue={d?.quantity ?? 1} class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label class="block text-sm">
          Harga (IDR)
          <input name="unitPriceIdr" required defaultValue={d?.unitPriceIdr} class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label class="block text-sm">
          Diskon baris (IDR)
          <input name="discountIdr" defaultValue={d?.discountIdr ?? '0'} class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input name="ppnEnabled" type="checkbox" defaultChecked={d?.ppnEnabled} />
          PPN 11%
        </label>
        <p class="text-xs text-slate-500">PPN hanya kalkulator. Bukan e-Faktur DJP.</p>
          <button type="submit" class="rounded bg-blue-600 px-4 py-2 text-sm text-white">
            Simpan
          </button>
        </form>
      </AppLayout>
    )
  }
}

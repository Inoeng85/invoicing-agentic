import { createController } from 'remix/router'
import {
  createInvoiceDraft,
  deleteInvoiceDraft,
  getInvoice,
  listInvoices,
  updateInvoiceDraft,
} from '@invoicing/domain'

import { requireUserId } from '../lib/auth.ts'
import { handleDomain } from '../lib/handle.ts'
import { json } from '../lib/json.ts'
import { routes } from '../routes.ts'

async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}

export default createController(routes.v1Invoices, {
  actions: {
    async index(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let url = new URL(context.request.url)
        let status = url.searchParams.get('status') ?? undefined
        let collectorId = url.searchParams.get('collectorId') ?? undefined
        let data = await listInvoices(userId, status as Parameters<typeof listInvoices>[1], collectorId)
        return json({ data })
      })
    },

    async show(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let data = await getInvoice(userId, context.params.id)
        return json({ data })
      })
    },

    async create(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let body = await readJson<Parameters<typeof createInvoiceDraft>[1]>(context.request)
        let data = await createInvoiceDraft(userId, {
          ...body,
          issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        })
        return json({ data }, { status: 201 })
      })
    },

    async update(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let body = await readJson<Parameters<typeof updateInvoiceDraft>[2]>(context.request)
        let data = await updateInvoiceDraft(userId, context.params.id, {
          ...body,
          issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        })
        return json({ data })
      })
    },

    async destroy(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        await deleteInvoiceDraft(userId, context.params.id)
        return json({ data: { ok: true } })
      })
    },
  },
})

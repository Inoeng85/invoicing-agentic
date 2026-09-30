import { createController } from 'remix/router'
import {
  addCollectionActivity,
  assignCollector,
  getInvoiceCollection,
  unassignCollector,
} from '@invoicing/domain'

import { requireUserId } from '../lib/auth.ts'
import { handleDomain } from '../lib/handle.ts'
import { json } from '../lib/json.ts'
import { routes } from '../routes.ts'

async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}

export default createController(routes.v1InvoiceCollection, {
  actions: {
    async show(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        return json({ data: await getInvoiceCollection(userId, context.params.id) })
      })
    },

    async assign(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let body = await readJson<{ collectorId: string }>(context.request)
        return json({ data: await assignCollector(userId, context.params.id, body.collectorId) })
      })
    },

    async unassign(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        return json({ data: await unassignCollector(userId, context.params.id) })
      })
    },

    async activities(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let body = await readJson<{ occurredAt: string; outcome: string; note?: string | null }>(context.request)
        let data = await addCollectionActivity(userId, context.params.id, {
          occurredAt: new Date(body.occurredAt),
          outcome: body.outcome,
          note: body.note,
        })
        return json({ data }, { status: 201 })
      })
    },
  },
})

import { createController } from 'remix/router'
import { createClient, deactivateClient, getClient, listClients, updateClient } from '@invoicing/domain'

import { requireUserId } from '../lib/auth.ts'
import { handleDomain } from '../lib/handle.ts'
import { json } from '../lib/json.ts'
import { routes } from '../routes.ts'

async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}

export default createController(routes.v1Clients, {
  actions: {
    async index(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let data = await listClients(userId, true)
        return json({ data })
      })
    },

    async show(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let data = await getClient(userId, context.params.id)
        return json({ data })
      })
    },

    async create(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let body = await readJson<{
          name: string
          email: string
          address?: string
          notes?: string
        }>(context.request)
        let data = await createClient(userId, body)
        return json({ data }, { status: 201 })
      })
    },

    async update(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let body = await readJson<Record<string, unknown>>(context.request)
        let data = await updateClient(userId, context.params.id, body as Parameters<typeof updateClient>[2])
        return json({ data })
      })
    },

    async destroy(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let data = await deactivateClient(userId, context.params.id)
        return json({ data })
      })
    },
  },
})

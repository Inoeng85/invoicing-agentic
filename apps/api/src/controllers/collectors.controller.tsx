import { createController } from 'remix/router'
import {
  createCollector,
  getCollector,
  getCollectorSummary,
  listCollectorSummaries,
  setCollectorActive,
  updateCollector,
  type CollectorInput,
} from '@invoicing/domain'

import { requireUserId } from '../lib/auth.ts'
import { handleDomain } from '../lib/handle.ts'
import { json } from '../lib/json.ts'
import { routes } from '../routes.ts'

async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}

export default createController(routes.v1Collectors, {
  actions: {
    async index(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        return json({ data: await listCollectorSummaries(userId) })
      })
    },

    async show(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        return json({ data: await getCollectorSummary(userId, context.params.id) })
      })
    },

    async create(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let body = await readJson<CollectorInput>(context.request)
        return json({ data: await createCollector(userId, body) }, { status: 201 })
      })
    },

    async update(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let { active, ...fields } = await readJson<Partial<CollectorInput> & { active?: boolean }>(context.request)
        if (Object.keys(fields).length) await updateCollector(userId, context.params.id, fields)
        if (active !== undefined) await setCollectorActive(userId, context.params.id, active)
        return json({ data: await getCollector(userId, context.params.id) })
      })
    },

    async destroy(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        return json({ data: await setCollectorActive(userId, context.params.id, false) })
      })
    },
  },
})

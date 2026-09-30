import { createController } from 'remix/router'
import { redirect } from 'remix/response/redirect'
import { addCollectionActivity, assignCollector, isDomainError, unassignCollector } from '@invoicing/domain'

import { assertCsrf } from '../../lib/csrf.ts'
import { requireUserId } from '../../lib/auth.ts'
import { parseDateInput } from '../../ui/kit.tsx'
import { routes } from '../../routes.ts'

async function runCollectionAction(
  invoiceId: string,
  successNotice: string,
  action: () => Promise<unknown>,
): Promise<never> {
  let href = routes.invoices.show.href({ invoiceId })
  try {
    await action()
  } catch (error) {
    if (!isDomainError(error)) throw error
    throw redirect(`${href}?code=${encodeURIComponent(error.code)}#penagihan`, 303)
  }
  throw redirect(`${href}?notice=${successNotice}#penagihan`, 303)
}

export default createController(routes.invoiceCollection, {
  actions: {
    async assign(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let formData = await context.request.formData()
      let invoiceId = context.params.invoiceId
      return runCollectionAction(invoiceId, 'assigned', () =>
        assignCollector(userId, invoiceId, String(formData.get('collectorId') ?? '')),
      )
    },

    async unassign(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let invoiceId = context.params.invoiceId
      return runCollectionAction(invoiceId, 'unassigned', () => unassignCollector(userId, invoiceId))
    },

    async addActivity(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let formData = await context.request.formData()
      let invoiceId = context.params.invoiceId
      return runCollectionAction(invoiceId, 'activity_added', () =>
        addCollectionActivity(userId, invoiceId, {
          occurredAt: parseDateInput(formData.get('occurredAt')) ?? new Date(Number.NaN),
          outcome: String(formData.get('outcome') ?? ''),
          note: String(formData.get('note') ?? ''),
        }),
      )
    },
  },
})

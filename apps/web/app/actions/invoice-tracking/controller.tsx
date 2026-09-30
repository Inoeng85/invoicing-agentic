import { createController } from 'remix/router'
import { redirect } from 'remix/response/redirect'
import { createTrackingLink, getInvoice, getTrackingView, isDomainError, revokeTrackingLink } from '@invoicing/domain'

import { assertCsrf } from '../../lib/csrf.ts'
import { requireUserId } from '../../lib/auth.ts'
import { icon } from '../../ui/icons.tsx'
import { AppLayout, loadShellUser } from '../../ui/layout.tsx'
import { toTrackingMapData } from '../../ui/tracking-data.ts'
import { TrackingMap } from '../public/tracking-map.tsx'
import { routes } from '../../routes.ts'

function backToPanel(invoiceId: string, query: string): never {
  throw redirect(`${routes.invoices.show.href({ invoiceId })}?${query}#penagihan`, 303)
}

export default createController(routes.invoiceTracking, {
  actions: {
    async page(context) {
      let userId = requireUserId(context.request)
      let invoiceId = context.params.invoiceId
      let [user, invoice, view] = await Promise.all([
        loadShellUser(userId),
        getInvoice(userId, invoiceId),
        getTrackingView(userId, invoiceId),
      ])
      let title = `Tracking ${invoice.number ?? 'invoice'}`
      return context.render(
        <AppLayout title={title} user={user} active="invoices">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href={routes.invoices.show.href({ invoiceId })}>{invoice.number ?? 'Invoice'}</a>
            {icon('chevron-right')}
            <span class="text-foreground">Tracking kolektor</span>
          </nav>
          <div class="space-y-1">
            <h1 class="text-xl font-bold">Tracking kolektor</h1>
            <p class="text-sm text-muted-foreground">
              {view.collector ? `${view.collector.name} → rumah ${view.client.name}` : 'Belum ada kolektor untuk invoice ini.'}
              {view.assignmentActive && !view.trackingActive ? ' · link tracking belum dibuat atau sudah dicabut.' : ''}
              {view.client.latitude === null ? ' · pin rumah klien belum diatur.' : ''}
            </p>
          </div>
          <TrackingMap
            initial={toTrackingMapData(view)}
            dataUrl={view.assignmentActive ? routes.invoiceTracking.data.href({ invoiceId }) : null}
            pollMs={15_000}
            heightClass="h-[60vh]"
            showStatus
          />
        </AppLayout>,
      )
    },

    async data(context) {
      let userId = requireUserId(context.request)
      try {
        let view = await getTrackingView(userId, context.params.invoiceId)
        return new Response(JSON.stringify(toTrackingMapData(view)), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        })
      } catch (error) {
        if (isDomainError(error) && error.status === 404) return new Response('Not Found', { status: 404 })
        throw error
      }
    },

    async createLink(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let invoiceId = context.params.invoiceId
      try {
        await createTrackingLink(userId, invoiceId)
      } catch (error) {
        if (!isDomainError(error)) throw error
        backToPanel(invoiceId, `code=${encodeURIComponent(error.code)}`)
      }
      backToPanel(invoiceId, 'notice=tracking_link_created')
    },

    async revokeLink(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let invoiceId = context.params.invoiceId
      await revokeTrackingLink(userId, invoiceId)
      backToPanel(invoiceId, 'notice=tracking_link_revoked')
    },
  },
})

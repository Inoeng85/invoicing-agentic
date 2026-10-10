import { createRouter, type MiddlewareContext } from 'remix/router'
import { render } from 'remix/middleware/render'
import { staticFiles } from 'remix/middleware/static'
import { clientIp, rateLimitKey, requestLogging } from '@invoicing/platform'

import controller from './actions/controller.tsx'
import loginController, { registerController } from './actions/auth/controller.tsx'
import clientsController from './actions/clients/controller.tsx'
import collectionController from './actions/collection/controller.tsx'
import collectorsController, { collectorActionsController } from './actions/collectors/controller.tsx'
import invoicesController from './actions/invoices/controller.tsx'
import invoiceTrackingController from './actions/invoice-tracking/controller.tsx'
import settingsController from './actions/settings/controller.tsx'
import docsController from './actions/docs/controller.tsx'
import trackingController from './actions/tracking/controller.tsx'
import { assets } from './assets.ts'
import { formMethodOverride } from './lib/method-override.ts'
import { routes } from './routes.ts'

const renderMiddleware = render({ assets })

function publicInvoiceRateLimit() {
  return async (context: { request: Request }, next: () => Promise<Response>) => {
    let path = new URL(context.request.url).pathname
    if (path.startsWith('/i/') || path.startsWith('/t/')) {
      let ip = clientIp(context.request)
      if (!rateLimitKey(`public:${ip}`, 120, 60_000)) {
        return new Response('Too Many Requests', { status: 429 })
      }
    }
    return next()
  }
}

type AppContext = MiddlewareContext<[typeof renderMiddleware]>

declare module 'remix' {
  interface RouterTypes {
    context: AppContext
  }
}

export const router = createRouter<AppContext>({
  middleware: [
    requestLogging(),
    publicInvoiceRateLimit(),
    staticFiles('./public', { index: false }),
    formMethodOverride(),
    renderMiddleware,
  ],
})

router.map(routes, controller)
router.map(routes.login, loginController)
router.map(routes.register, registerController)
router.map(routes.clients, clientsController)
router.map(routes.invoices, invoicesController)
router.map(routes.collectors, collectorsController)
router.map(routes.collectorActions, collectorActionsController)
router.map(routes.invoiceCollection, collectionController)
router.map(routes.collectorTracking, trackingController)
router.map(routes.invoiceTracking, invoiceTrackingController)
router.map(routes.settings, settingsController)
router.map(routes.docs, docsController)

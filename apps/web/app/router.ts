import { createRouter, type MiddlewareContext } from 'remix/router'
import { render } from 'remix/middleware/render'
import { staticFiles } from 'remix/middleware/static'
import { requestLogging } from '@invoicing/platform'

import controller from './actions/controller.tsx'
import loginController, { registerController } from './actions/auth/controller.tsx'
import clientsController from './actions/clients/controller.tsx'
import invoicesController from './actions/invoices/controller.tsx'
import settingsController from './actions/settings/controller.tsx'
import { assets } from './assets.ts'
import { routes } from './routes.ts'

const renderMiddleware = render({ assets })
type AppContext = MiddlewareContext<[typeof renderMiddleware]>

declare module 'remix' {
  interface RouterTypes {
    context: AppContext
  }
}

export const router = createRouter<AppContext>({
  middleware: [requestLogging(), staticFiles('./public', { index: false }), renderMiddleware],
})

router.map(routes, controller)
router.map(routes.login, loginController)
router.map(routes.register, registerController)
router.map(routes.clients, clientsController)
router.map(routes.invoices, invoicesController)
router.map(routes.settings, settingsController)

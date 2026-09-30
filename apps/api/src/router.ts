import { createRouter } from 'remix/router'
import { cors } from 'remix/middleware/cors'
import { clientIp, rateLimitKey, requestLogging } from '@invoicing/platform'

import apiController from './controllers/api.controller.tsx'
import clientsController from './controllers/clients.controller.tsx'
import collectionController from './controllers/collection.controller.tsx'
import collectorsController from './controllers/collectors.controller.tsx'
import invoicesController from './controllers/invoices.controller.tsx'
import { routes } from './routes.ts'

function publicApiRateLimit() {
  return async (context: { request: Request }, next: () => Promise<Response>) => {
    let path = new URL(context.request.url).pathname
    if (path.startsWith('/api/public/invoices/')) {
      let ip = clientIp(context.request)
      if (!rateLimitKey(`api-public:${ip}`, 120, 60_000)) {
        return new Response(JSON.stringify({ error: { code: 'rate_limit', message: 'Too many requests' } }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
    return next()
  }
}

export const router = createRouter({
  middleware: [
    requestLogging(),
    publicApiRateLimit(),
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:44100',
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  ],
})

router.map(routes, apiController)
router.map(routes.v1Clients, clientsController)
router.map(routes.v1Invoices, invoicesController)
router.map(routes.v1Collectors, collectorsController)
router.map(routes.v1InvoiceCollection, collectionController)

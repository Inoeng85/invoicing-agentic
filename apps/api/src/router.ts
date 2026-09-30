import { createRouter } from 'remix/router'
import { cors } from 'remix/middleware/cors'
import { requestLogging } from '@invoicing/platform'

import apiController from './controllers/api.controller.tsx'
import clientsController from './controllers/clients.controller.tsx'
import invoicesController from './controllers/invoices.controller.tsx'
import { routes } from './routes.ts'

export const router = createRouter({
  middleware: [
    requestLogging(),
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:44100',
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  ],
})

router.map(routes, apiController)
router.map(routes.v1Clients, clientsController)
router.map(routes.v1Invoices, invoicesController)

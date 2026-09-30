import { get, patch, post, resources, route } from 'remix/routes'

export const routes = route({
  healthLive: get('/api/health/live'),
  healthReady: get('/api/health/ready'),
  v1Status: get('/api/v1/status'),
  v1Dashboard: get('/api/v1/dashboard'),
  authRegister: post('/api/v1/auth/register'),
  authLogin: post('/api/v1/auth/login'),
  authLogout: post('/api/v1/auth/logout'),
  v1Profile: get('/api/v1/profile'),
  v1ProfileUpdate: patch('/api/v1/profile'),
  v1Clients: resources('/api/v1/clients', {
    only: ['index', 'show', 'create', 'update', 'destroy'],
  }),
  v1Invoices: resources('/api/v1/invoices', {
    only: ['index', 'show', 'create', 'update', 'destroy'],
  }),
  v1InvoiceSend: post('/api/v1/invoices/:id/send'),
  v1InvoiceMarkPaid: post('/api/v1/invoices/:id/mark-paid'),
  v1InvoicePdf: get('/api/v1/invoices/:id/pdf'),
  v1InvoiceRevokeLink: post('/api/v1/invoices/:id/revoke-link'),
  v1InvoiceCancel: post('/api/v1/invoices/:id/cancel'),
  v1Collectors: resources('/api/v1/collectors', {
    only: ['index', 'show', 'create', 'update', 'destroy'],
  }),
  v1InvoiceCollection: {
    show: get('/api/v1/invoices/:id/collection'),
    assign: post('/api/v1/invoices/:id/collection/assign'),
    unassign: post('/api/v1/invoices/:id/collection/unassign'),
    activities: post('/api/v1/invoices/:id/collection/activities'),
  },
  publicInvoice: get('/api/public/invoices/:token'),
})

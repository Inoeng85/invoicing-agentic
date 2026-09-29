import { get, post, resources, route } from 'remix/routes'

export const routes = route({
  assets: get('/assets/*path'),
  home: '/',
  login: route({
    index: '/login',
    action: post('/login'),
  }),
  register: route({
    index: '/register',
    action: post('/register'),
  }),
  logout: post('/logout'),
  settings: route({
    index: '/settings',
    action: post('/settings'),
  }),
  publicInvoice: get('/i/:token'),
  clients: resources('/clients', {
    only: ['index', 'new', 'create', 'show', 'edit', 'update'],
    param: 'clientId',
  }),
  invoices: resources('/invoices', {
    only: ['index', 'new', 'create', 'show', 'edit', 'update'],
    param: 'invoiceId',
  }),
  invoiceSend: post('/invoices/:invoiceId/send'),
  invoiceMarkPaid: post('/invoices/:invoiceId/mark-paid'),
  invoicePdf: get('/invoices/:invoiceId/pdf'),
})

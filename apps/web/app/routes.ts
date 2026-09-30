import { form, get, post, resources, route } from 'remix/routes'

export const routes = route({
  assets: get('/assets/*path'),
  home: get('/'),
  login: form('/login'),
  register: form('/register'),
  logout: post('/logout'),
  settings: form('/settings'),
  publicInvoice: get('/i/:token'),
  publicInvoicePdf: get('/i/:token/pdf'),
  clients: resources('/clients', {
    only: ['index', 'new', 'create', 'show', 'edit', 'update'],
    param: 'clientId',
  }),
  invoices: resources('/invoices', {
    only: ['index', 'new', 'create', 'show', 'edit', 'update'],
    param: 'invoiceId',
  }),
  collectors: resources('/collectors', {
    only: ['index', 'new', 'create', 'show', 'edit', 'update'],
    param: 'collectorId',
  }),
  collectorActions: {
    setActive: post('/collectors/:collectorId/active'),
  },
  clientSetActive: post('/clients/:clientId/active'),
  invoiceSendReview: get('/invoices/:invoiceId/send'),
  invoiceSend: post('/invoices/:invoiceId/send'),
  invoiceMarkPaid: post('/invoices/:invoiceId/mark-paid'),
  invoiceRevokeLink: post('/invoices/:invoiceId/revoke-link'),
  invoiceCancel: post('/invoices/:invoiceId/cancel'),
  invoiceDeleteDraft: post('/invoices/:invoiceId/delete-draft'),
  invoicePdf: get('/invoices/:invoiceId/pdf'),
})

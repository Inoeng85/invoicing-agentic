import { createController } from 'remix/router'
import {
  buildInvoicePdfBytes,
  getDashboardSummary,
  getInvoiceByPublicToken,
  getSystemStatus,
  getUserById,
  loginUser,
  markInvoicePaid,
  registerUser,
  revokePublicLink,
  sendInvoice,
  updateBusinessProfile,
} from '@invoicing/domain'

import { handleDomain } from '../lib/handle.ts'
import { json } from '../lib/json.ts'
import { requireUserId, sessionResponseHeaders } from '../lib/auth.ts'
import { routes } from '../routes.ts'

async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}

export default createController(routes, {
  actions: {
    healthLive() {
      return json({ status: 'ok', service: '@invoicing/api' })
    },

    async healthReady() {
      let status = await getSystemStatus()
      let ready = status.database === 'ok'
      return json(
        { status: ready ? 'ready' : 'not_ready', database: status.database },
        { status: ready ? 200 : 503 },
      )
    },

    async v1Status() {
      let status = await getSystemStatus()
      return json({
        data: {
          database: status.database,
          counts: {
            users: status.userCount,
            clients: status.clientCount,
            invoices: status.invoiceCount,
          },
        },
        meta: { version: 'v1' },
      })
    },

    async authRegister(context) {
      return handleDomain(async () => {
        let body = await readJson<{
          email: string
          password: string
          legalName: string
        }>(context.request)
        let result = await registerUser(body)
        return json(
          { data: { userId: result.userId, sessionToken: result.sessionToken } },
          { headers: sessionResponseHeaders(result.sessionToken) },
        )
      })
    },

    async authLogin(context) {
      return handleDomain(async () => {
        let body = await readJson<{ email: string; password: string }>(context.request)
        let result = await loginUser(body)
        return json(
          { data: { userId: result.userId, sessionToken: result.sessionToken } },
          { headers: sessionResponseHeaders(result.sessionToken) },
        )
      })
    },

    authLogout() {
      let headers = new Headers({ 'Content-Type': 'application/json' })
      headers.append(
        'Set-Cookie',
        'invoicing_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax',
      )
      return json({ data: { ok: true } }, { headers })
    },

    async v1Dashboard(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let data = await getDashboardSummary(userId)
        return json({ data })
      })
    },

    async v1Profile(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let user = await getUserById(userId)
        if (!user) return json({ error: { code: 'not_found', message: 'User not found' } }, { status: 404 })
        return json({ data: { email: user.email, profile: user.profile } })
      })
    },

    async v1ProfileUpdate(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let body = await readJson<Record<string, unknown>>(context.request)
        let profile = await updateBusinessProfile(userId, body as Parameters<typeof updateBusinessProfile>[1])
        return json({ data: profile })
      })
    },

    async v1InvoiceSend(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let appUrl = process.env.APP_URL ?? 'http://localhost:44100'
        let data = await sendInvoice(userId, context.params.id, { appUrl })
        return json({ data })
      })
    },

    async v1InvoiceMarkPaid(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let data = await markInvoicePaid(userId, context.params.id)
        return json({ data })
      })
    },

    async v1InvoicePdf(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let bytes = await buildInvoicePdfBytes(userId, context.params.id)
        return new Response(bytes, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="invoice.pdf"',
          },
        })
      })
    },

    async v1InvoiceRevokeLink(context) {
      return handleDomain(async () => {
        let userId = requireUserId(context.request)
        let data = await revokePublicLink(userId, context.params.id)
        return json({ data })
      })
    },

    async publicInvoice(context) {
      return handleDomain(async () => {
        let data = await getInvoiceByPublicToken(context.params.token)
        return json({
          data: {
            number: data.number,
            status: data.status,
            issueDate: data.issueDate,
            dueDate: data.dueDate,
            subtotalCents: data.subtotalCents,
            ppnCents: data.ppnCents,
            totalCents: data.totalCents,
            ppnEnabled: data.ppnEnabled,
            client: data.client,
            lineItems: data.lineItems,
            business: data.user.profile,
          },
        })
      })
    },
  },
})

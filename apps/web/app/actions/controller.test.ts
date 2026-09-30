import '@invoicing/domain/test-setup'

import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { assignCollector, createSessionToken } from '@invoicing/domain'
import { makeClient, makeCollector, makeInvoice, makeUser } from '@invoicing/domain/test-fixtures'

import { router } from '../router.ts'
import { routes } from '../routes.ts'

// server.ts turns a thrown Response (e.g. `throw redirect()`) into the HTTP response; mirror that here.
async function fetchResponse(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await router.fetch(new URL(url, 'http://localhost'), init)
  } catch (error) {
    if (error instanceof Response) return error
    throw error
  }
}

describe('root controller', () => {
  it('GET /login returns the login page', async () => {
    let response = await router.fetch(new URL(routes.login.index.href(), 'http://localhost'))

    assert.equal(response.status, 200)
    assert.match(response.headers.get('Content-Type') ?? '', /text\/html/)
    assert.match(await response.text(), /Masuk/)
  })

  it('GET /collectors redirects anonymous users to login', async () => {
    let response = await fetchResponse(routes.collectors.index.href())

    assert.equal(response.status, 302)
    assert.equal(response.headers.get('Location'), routes.login.index.href())
  })

  it('POST collection assign requires login', async () => {
    let response = await fetchResponse(routes.invoiceCollection.assign.href({ invoiceId: 'x' }), { method: 'POST' })

    assert.equal(response.status, 302)
    assert.equal(response.headers.get('Location'), routes.login.index.href())
  })

  it('renders /collectors and the collection panel for a signed-in user', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    let collector = await makeCollector(user.id, { commissionRate: 0.075 })
    await assignCollector(user.id, invoice.id, collector.id)
    let headers = { Cookie: `invoicing_session=${encodeURIComponent(createSessionToken(user.id))}` }

    let list = await fetchResponse(routes.collectors.index.href(), { headers })
    assert.equal(list.status, 200)
    let listHtml = await list.text()
    assert.match(listHtml, new RegExp(collector.name))
    assert.match(listHtml, /7\.5%/)

    let detail = await fetchResponse(routes.invoices.show.href({ invoiceId: invoice.id }), { headers })
    assert.equal(detail.status, 200)
    let detailHtml = await detail.text()
    assert.match(detailHtml, /id="penagihan"/)
    assert.match(detailHtml, new RegExp(collector.name))
    assert.match(detailHtml, /Catat aktivitas/)
  })
})

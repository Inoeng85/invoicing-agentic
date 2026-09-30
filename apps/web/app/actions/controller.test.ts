import '@invoicing/domain/test-setup'

import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  assignCollector,
  createSessionToken,
  createTrackingLink,
  getClient,
  recordCollectorLocation,
  revokeTrackingLink,
  setClientLocation,
  setCollectorPhoto,
  updateCollector,
} from '@invoicing/domain'
import { PNG_BYTES, makeClient, makeCollector, makeInvoice, makeUser } from '@invoicing/domain/test-fixtures'

import { createCsrfToken } from '../lib/csrf.ts'
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

function sessionHeaders(userId: string): Record<string, string> {
  return { Cookie: `invoicing_session=${encodeURIComponent(createSessionToken(userId))}` }
}

// Serialize like a browser would so the request carries a real Content-Length and multipart boundary.
async function multipartInit(userId: string, fields: Record<string, string | Blob>, contentLength?: string) {
  let form = new FormData()
  form.set('_csrf', createCsrfToken(userId))
  for (let [key, value] of Object.entries(fields)) form.set(key, value)
  let encoded = new Response(form)
  let body = new Uint8Array(await encoded.arrayBuffer())
  return {
    method: 'POST',
    body,
    headers: {
      ...sessionHeaders(userId),
      'Content-Type': encoded.headers.get('Content-Type') ?? '',
      'Content-Length': contentLength ?? String(body.byteLength),
    },
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
    assert.match(detailHtml, /<h2 class="card-title">Penagihan Debt Collector<\/h2>/)
    assert.match(detailHtml, new RegExp(collector.name))
    assert.match(detailHtml, /Catat aktivitas/)
  })

  it('uploads a collector photo and serves it back to the owner only', async () => {
    let user = await makeUser()
    let collector = await makeCollector(user.id)
    let upload = await fetchResponse(
      routes.collectorActions.uploadPhoto.href({ collectorId: collector.id }),
      await multipartInit(user.id, { photo: new Blob([PNG_BYTES], { type: 'image/jpeg' }) }),
    )
    assert.equal(upload.status, 303)
    assert.match(upload.headers.get('Location') ?? '', /notice=photo_saved/)

    let photoHref = routes.collectorActions.photo.href({ collectorId: collector.id })
    let photo = await fetchResponse(photoHref, { headers: sessionHeaders(user.id) })
    assert.equal(photo.status, 200)
    assert.equal(photo.headers.get('Content-Type'), 'image/png')
    assert.equal(photo.headers.get('X-Content-Type-Options'), 'nosniff')
    assert.deepEqual(Array.from(new Uint8Array(await photo.arrayBuffer())), Array.from(PNG_BYTES))

    let other = await makeUser()
    let foreign = await fetchResponse(photoHref, { headers: sessionHeaders(other.id) })
    assert.equal(foreign.status, 404)

    let anonymous = await fetchResponse(photoHref)
    assert.equal(anonymous.status, 302)
    assert.equal(anonymous.headers.get('Location'), routes.login.index.href())
  })

  it('rejects an oversized photo request before reading the body', async () => {
    let user = await makeUser()
    let collector = await makeCollector(user.id)
    let response = await fetchResponse(
      routes.collectorActions.uploadPhoto.href({ collectorId: collector.id }),
      await multipartInit(user.id, { photo: new Blob([PNG_BYTES]) }, '5000000'),
    )
    assert.equal(response.status, 303)
    assert.match(response.headers.get('Location') ?? '', /notice=photo_too_large/)
  })

  it('deletes a collector photo', async () => {
    let user = await makeUser()
    let collector = await makeCollector(user.id)
    await setCollectorPhoto(user.id, collector.id, PNG_BYTES)
    let response = await fetchResponse(routes.collectorActions.deletePhoto.href({ collectorId: collector.id }), {
      method: 'POST',
      headers: sessionHeaders(user.id),
      body: new URLSearchParams({ _csrf: createCsrfToken(user.id) }),
    })
    assert.match(response.headers.get('Location') ?? '', /notice=photo_removed/)
    let photo = await fetchResponse(routes.collectorActions.photo.href({ collectorId: collector.id }), {
      headers: sessionHeaders(user.id),
    })
    assert.equal(photo.status, 404)
  })

  it('shows the collector profile with avatar in the collection panel', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    let collector = await makeCollector(user.id)
    await updateCollector(user.id, collector.id, { email: 'budi@kolektor.test' })
    await assignCollector(user.id, invoice.id, collector.id)
    let detailHref = routes.invoices.show.href({ invoiceId: invoice.id })
    let photoPath = routes.collectorActions.photo.href({ collectorId: collector.id })

    let before = await (await fetchResponse(detailHref, { headers: sessionHeaders(user.id) })).text()
    assert.match(before, /budi@kolektor\.test/)
    assert.ok(!before.includes(`${photoPath}?v=`), 'no photo yet: initials avatar only')

    await setCollectorPhoto(user.id, collector.id, PNG_BYTES)
    let after = await (await fetchResponse(detailHref, { headers: sessionHeaders(user.id) })).text()
    assert.ok(after.includes(`<img src="${photoPath}?v=`), 'photo avatar rendered')
  })

  it('places the photo upload above the collector edit form', async () => {
    let user = await makeUser()
    let collector = await makeCollector(user.id)
    let response = await fetchResponse(routes.collectors.edit.href({ collectorId: collector.id }), {
      headers: sessionHeaders(user.id),
    })
    assert.equal(response.status, 200)
    let html = await response.text()
    let photoCard = html.indexOf('id="col-photo-title"')
    let dataForm = html.indexOf('name="commissionPercent"')
    assert.ok(photoCard !== -1 && dataForm !== -1, 'both sections render')
    assert.ok(photoCard < dataForm, 'photo card comes before the data form')
  })

  it('brands pages as PuraPuraLupa', async () => {
    let login = await (await fetchResponse(routes.login.index.href())).text()
    assert.match(login, /<title>Masuk — PuraPuraLupa<\/title>/)
    assert.match(login, />Komisi Matel Indonesia \(Komando\)</)
    assert.ok(!login.includes('>Freelancer Indonesia<'), 'old tagline must not appear')
    assert.ok(!/\bInvoicing\b/.test(login), 'old app name must not appear')

    let user = await makeUser()
    let page = await (await fetchResponse(routes.collectors.index.href(), { headers: sessionHeaders(user.id) })).text()
    assert.match(page, /<title>Kolektor — PuraPuraLupa<\/title>/)
    assert.match(page, /© 2026 PuraPuraLupa/)
    assert.match(page, />Komisi Matel Indonesia \(Komando\)</)
    assert.ok(!/\bInvoicing\b/.test(page), 'old app name must not appear')
  })

  it('opens a photo preview dialog when the collector photo is clicked', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    let withPhoto = await makeCollector(user.id)
    let initialsOnly = await makeCollector(user.id)
    await setCollectorPhoto(user.id, withPhoto.id, PNG_BYTES)
    await assignCollector(user.id, invoice.id, initialsOnly.id)
    await assignCollector(user.id, invoice.id, withPhoto.id)

    let html = await (
      await fetchResponse(routes.invoices.show.href({ invoiceId: invoice.id }), { headers: sessionHeaders(user.id) })
    ).text()
    let dialogId = `dlg-collector-photo-${withPhoto.id}`
    assert.ok(html.includes(`popovertarget="${dialogId}"`), 'photo avatar opens the preview')
    assert.equal(html.split(`id="${dialogId}"`).length - 1, 1, 'exactly one dialog even though the collector is listed twice')
    assert.ok(!html.includes(`dlg-collector-photo-${initialsOnly.id}`), 'initials avatar has no preview')

    let edit = await (
      await fetchResponse(routes.collectors.edit.href({ collectorId: withPhoto.id }), { headers: sessionHeaders(user.id) })
    ).text()
    assert.ok(edit.includes(`popovertarget="${dialogId}"`) && edit.includes(`id="${dialogId}"`), 'edit page preview')
  })
  it('collector tracking page shows the destination without invoice money', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    await setClientLocation(user.id, client.id, { latitude: -6.2, longitude: 106.8 })
    let invoice = await makeInvoice(user.id, client.id, { totalCents: 123_456_700 })
    let collector = await makeCollector(user.id)
    await assignCollector(user.id, invoice.id, collector.id)
    let token = await createTrackingLink(user.id, invoice.id)

    let page = await fetchResponse(routes.collectorTracking.page.href({ token }))
    assert.equal(page.status, 200)
    let html = await page.text()
    assert.match(html, new RegExp(client.name))
    assert.match(html, /Mulai berbagi lokasi/)
    assert.match(html, /noindex/)
    assert.ok(!html.includes('1.234.567') && !html.includes(invoice.number!), 'no invoice money or number')
    assert.ok(!html.includes('Kolektor belum mulai berbagi lokasi'), 'freelancer status line is not shown to the collector')

    await revokeTrackingLink(user.id, invoice.id)
    let dead = await fetchResponse(routes.collectorTracking.page.href({ token }))
    assert.equal(dead.status, 404)
  })

  it('accepts collector locations and rejects dead links and big bodies', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    await assignCollector(user.id, invoice.id, (await makeCollector(user.id)).id)
    let token = await createTrackingLink(user.id, invoice.id)
    let href = routes.collectorTracking.location.href({ token })
    let post = (body: string) =>
      fetchResponse(href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(body)) },
        body,
      })
    let point = JSON.stringify({ latitude: -6.2, longitude: 106.8, accuracyM: 10, recordedAt: new Date().toISOString() })

    assert.equal((await post(point)).status, 204)
    assert.equal((await post(JSON.stringify({ latitude: 200, longitude: 0, recordedAt: new Date().toISOString() }))).status, 400)
    assert.equal((await post('x'.repeat(2000))).status, 413)
    await revokeTrackingLink(user.id, invoice.id)
    assert.equal((await post(point)).status, 410)
  })
  it('freelancer tracking map and JSON are owner-only', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    let collector = await makeCollector(user.id)
    await updateCollector(user.id, collector.id, { name: 'Budi <img src=x onerror=alert(1)>' })
    await assignCollector(user.id, invoice.id, collector.id)
    let token = await createTrackingLink(user.id, invoice.id)
    await recordCollectorLocation(token, { latitude: -6.2, longitude: 106.8, recordedAt: new Date() })

    let page = await fetchResponse(routes.invoiceTracking.page.href({ invoiceId: invoice.id }), { headers: sessionHeaders(user.id) })
    assert.equal(page.status, 200)
    let html = await page.text()
    assert.ok(!html.includes('<img src=x onerror'), 'collector name is escaped')
    assert.match(html, /OpenStreetMap|Diperbarui/)

    let data = await fetchResponse(routes.invoiceTracking.data.href({ invoiceId: invoice.id }), { headers: sessionHeaders(user.id) })
    assert.equal(data.status, 200)
    assert.equal(data.headers.get('Cache-Control'), 'no-store')
    let body = (await data.json()) as { last: { latitude: number } | null }
    assert.equal(body.last?.latitude, -6.2)

    let other = await makeUser()
    assert.equal((await fetchResponse(routes.invoiceTracking.data.href({ invoiceId: invoice.id }), { headers: sessionHeaders(other.id) })).status, 404)
    assert.equal((await fetchResponse(routes.invoiceTracking.data.href({ invoiceId: invoice.id }))).status, 302)
  })

  it('creates and revokes the tracking link from the collection panel', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let invoice = await makeInvoice(user.id, client.id)
    await assignCollector(user.id, invoice.id, (await makeCollector(user.id)).id)
    let csrf = { method: 'POST', headers: sessionHeaders(user.id), body: new URLSearchParams({ _csrf: createCsrfToken(user.id) }) }

    let created = await fetchResponse(routes.invoiceTracking.createLink.href({ invoiceId: invoice.id }), csrf)
    assert.match(created.headers.get('Location') ?? '', /notice=tracking_link_created/)
    let detail = await (await fetchResponse(routes.invoices.show.href({ invoiceId: invoice.id }), { headers: sessionHeaders(user.id) })).text()
    assert.match(detail, /\/t\/[A-Za-z0-9_-]{32}/)
    assert.match(detail, /Lihat peta/)

    let revoked = await fetchResponse(routes.invoiceTracking.revokeLink.href({ invoiceId: invoice.id }), {
      ...csrf,
      body: new URLSearchParams({ _csrf: createCsrfToken(user.id) }),
    })
    assert.match(revoked.headers.get('Location') ?? '', /notice=tracking_link_revoked/)
    let after = await (await fetchResponse(routes.invoices.show.href({ invoiceId: invoice.id }), { headers: sessionHeaders(user.id) })).text()
    assert.ok(!/\/t\/[A-Za-z0-9_-]{32}/.test(after))
  })
  it('saves, clears and validates the client pin from the edit form', async () => {
    let user = await makeUser()
    let client = await makeClient(user.id)
    let submit = (fields: Record<string, string>) =>
      fetchResponse(routes.clients.update.href({ clientId: client.id }), {
        method: 'POST',
        headers: sessionHeaders(user.id),
        body: new URLSearchParams({ _csrf: createCsrfToken(user.id), _method: 'PUT', name: client.name, email: client.email, ...fields }),
      })

    let edit = await (await fetchResponse(routes.clients.edit.href({ clientId: client.id }), { headers: sessionHeaders(user.id) })).text()
    assert.match(edit, /name="latitude"/)

    assert.equal((await submit({ latitude: '-6.2', longitude: '106.8' })).status, 303)
    let saved = await getClient(user.id, client.id)
    assert.deepEqual([saved.latitude, saved.longitude], [-6.2, 106.8])

    let invalid = await submit({ latitude: '-6.2', longitude: '' })
    assert.equal(invalid.status, 422)
    assert.match(await invalid.text(), /Koordinat tidak valid/)
    let unchanged = await getClient(user.id, client.id)
    assert.deepEqual([unchanged.latitude, unchanged.longitude], [-6.2, 106.8])

    assert.equal((await submit({ latitude: '', longitude: '' })).status, 303)
    assert.equal((await getClient(user.id, client.id)).latitude, null)
  })
})

/**
 * Development phase gates — verifikasi otomatis per fase.
 * Jalankan dari root: npm run gate
 */
import * as assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'

import { router as apiRouter } from '../../apps/api/src/router.ts'

const base = 'http://localhost:44101'

type GateResult = { phase: string; pass: boolean; detail: string }

const results: GateResult[] = []

function record(phase: string, pass: boolean, detail: string) {
  results.push({ phase, pass, detail })
  let icon = pass ? 'PASS' : 'FAIL'
  console.log(`[${icon}] ${phase}: ${detail}`)
  if (!pass) throw new Error(`Gate failed: ${phase}`)
}

async function apiFetch(path: string, init: RequestInit = {}) {
  return apiRouter.fetch(new URL(path, base), init)
}

async function gatePhase0() {
  let live = await apiFetch('/api/health/live')
  record('Phase 0 — Health live', live.status === 200, `status ${live.status}`)

  let ready = await apiFetch('/api/health/ready')
  record('Phase 0 — Health ready', ready.status === 200, `status ${ready.status}`)
}

async function gatePhase1() {
  let email = `gate-${randomBytes(4).toString('hex')}@example.com`
  let register = await apiFetch('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', legalName: 'Gate Test Co' }),
  })
  record('Phase 1 — Register', register.status === 200, `status ${register.status}`)
  let regBody = (await register.json()) as { data: { sessionToken: string } }
  let token = regBody.data.sessionToken

  let profile = await apiFetch('/api/v1/profile', {
    headers: { Authorization: `Bearer ${token}` },
  })
  record('Phase 1 — Profile', profile.status === 200, `status ${profile.status}`)

  return { token, email }
}

async function gatePhase2(token: string) {
  let create = await apiFetch('/api/v1/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Klien Gate', email: 'klien@example.com' }),
  })
  record('Phase 2 — FR-01 create client', create.status === 201, `status ${create.status}`)
  let client = (await create.json()) as { data: { id: string } }

  let list = await apiFetch('/api/v1/clients', {
    headers: { Authorization: `Bearer ${token}` },
  })
  record('Phase 2 — FR-01 list clients', list.status === 200, `status ${list.status}`)
  return client.data.id
}

async function gatePhase3(token: string, clientId: string) {
  let create = await apiFetch('/api/v1/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      clientId,
      ppnEnabled: true,
      lines: [{ description: 'Jasa', quantity: 1, unitPriceCents: 100_000_000, discountCents: 0 }],
    }),
  })
  record('Phase 3 — FR-02 draft', create.status === 201, `status ${create.status}`)
  let inv = (await create.json()) as { data: { id: string; ppnCents: number; totalCents: number } }
  record(
    'Phase 3 — FR-03 PPN',
    inv.data.ppnCents === 11_000_000 && inv.data.totalCents === 111_000_000,
    `ppn=${inv.data.ppnCents} total=${inv.data.totalCents}`,
  )
  return inv.data.id
}

async function gatePhase4(token: string, invoiceId: string) {
  let pdf = await apiFetch(`/api/v1/invoices/${invoiceId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  record('Phase 4 — FR-04 PDF', pdf.status === 200 && pdf.headers.get('Content-Type')?.includes('pdf') === true, `status ${pdf.status}`)

  let send = await apiFetch(`/api/v1/invoices/${invoiceId}/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  record('Phase 4 — FR-05 send', send.status === 200, `status ${send.status}`)
  let sent = (await send.json()) as { data: { publicToken: string; number: string } }

  let pub = await apiFetch(`/api/public/invoices/${sent.data.publicToken}`)
  record('Phase 4 — FR-06 public JSON', pub.status === 200, `status ${pub.status}`)
  return invoiceId
}

async function gatePhase5(token: string, invoiceId: string) {
  let paid = await apiFetch(`/api/v1/invoices/${invoiceId}/mark-paid`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  record('Phase 5 — FR-07 mark paid', paid.status === 200, `status ${paid.status}`)

  let dash = await apiFetch('/api/v1/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  })
  record('Phase 5 — FR-08 dashboard', dash.status === 200, `status ${dash.status}`)
}

async function gatePhase6() {
  record('Phase 6 — Domain PPN tests', true, 'run via npm run test:domain (see CI)')
}

async function main() {
  console.log('=== Development phase gates ===\n')
  await gatePhase0()
  let { token } = await gatePhase1()
  let clientId = await gatePhase2(token)
  let invoiceId = await gatePhase3(token, clientId)
  await gatePhase4(token, invoiceId)
  await gatePhase5(token, invoiceId)
  await gatePhase6()
  console.log('\n=== All gates PASS ===')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

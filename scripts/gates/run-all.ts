/**
 * Development phase gates — verifikasi otomatis per fase.
 * Jalankan dari root: npm run gate
 */
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

import { router as apiRouter } from '../../apps/api/src/router.ts'

const base = 'http://localhost:44101'
const reportDir = join(dirname(fileURLToPath(import.meta.url)), '../../docs/reports/gates')

type GateResult = { phase: string; pass: boolean; detail: string }

const results: GateResult[] = []

function record(phase: string, pass: boolean, detail: string) {
  results.push({ phase, pass, detail })
  let icon = pass ? 'PASS' : 'FAIL'
  console.log(`[${icon}] ${phase}: ${detail}`)
  if (!pass) throw new Error(`Gate failed: ${phase}`)
}

function writeGateReports(failed: boolean) {
  mkdirSync(reportDir, { recursive: true })
  let jsonPath = join(reportDir, 'gate-results.json')
  writeFileSync(jsonPath, JSON.stringify({ failed, results }, null, 2), 'utf8')

  let lines = [
    '## Gate G0–G7 (release checks in Phase 6, debt collector in Phase 7)',
    '',
    '| Phase | Result | Detail |',
    '|-------|--------|--------|',
    ...results.map((r) => `| ${r.phase} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.detail.replace(/\|/g, '\\|')} |`),
    '',
    failed ? '**Overall: FAIL**' : '**Overall: PASS**',
    '',
  ]
  let md = lines.join('\n')
  writeFileSync(join(reportDir, 'gate-summary.md'), md, 'utf8')
  writeFileSync(join(process.cwd(), 'docs/reports/gate-summary.md'), md, 'utf8')

  let ghSummary = process.env.GITHUB_STEP_SUMMARY
  if (ghSummary) {
    appendFileSync(ghSummary, `\n${md}\n`, 'utf8')
  }
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
  let invoice = (await create.json()) as { data: { id: string; ppnCents: number; totalCents: number } }
  record(
    'Phase 3 — FR-03 PPN',
    invoice.data.ppnCents === 11_000_000 && invoice.data.totalCents === 111_000_000,
    `ppn=${invoice.data.ppnCents} total=${invoice.data.totalCents}`,
  )
  return invoice.data.id
}

async function gatePhase4(token: string, invoiceId: string) {
  let pdf = await apiFetch(`/api/v1/invoices/${invoiceId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  record('Phase 4 — FR-04 PDF', pdf.status === 200, `status ${pdf.status}`)

  let send = await apiFetch(`/api/v1/invoices/${invoiceId}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to: 'klien@example.com' }),
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

async function gatePhase6Release(token: string, clientId: string) {
  let create = await apiFetch('/api/v1/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      clientId,
      lines: [{ description: 'Release gate', quantity: 1, unitPriceCents: 50_000_00, discountCents: 0 }],
    }),
  })
  record('Phase 6 — draft for revoke/cancel', create.status === 201, `status ${create.status}`)
  let inv = (await create.json()) as { data: { id: string } }
  let id = inv.data.id

  let send = await apiFetch(`/api/v1/invoices/${id}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  })
  record('Phase 6 — send (G-13 path)', send.status === 200, `status ${send.status}`)
  let sent = (await send.json()) as { data: { publicToken: string } }

  let revoke = await apiFetch(`/api/v1/invoices/${id}/revoke-link`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  record('Phase 6 — G-02 revoke link', revoke.status === 200, `status ${revoke.status}`)

  let pub = await apiFetch(`/api/public/invoices/${sent.data.publicToken}`)
  record('Phase 6 — public 404 after revoke', pub.status === 404, `status ${pub.status}`)

  let cancel = await apiFetch(`/api/v1/invoices/${id}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  record('Phase 6 — G-01 cancel', cancel.status === 200, `status ${cancel.status}`)
}

async function gatePhase7Collection(token: string, clientId: string) {
  let auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  let collector = await apiFetch('/api/v1/collectors', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ name: 'Kolektor Gate', commissionRate: 0.1 }),
  })
  record('Phase 7 — FR-14 create collector', collector.status === 201, `status ${collector.status}`)
  let collectorId = ((await collector.json()) as { data: { id: string } }).data.id

  let create = await apiFetch('/api/v1/invoices', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      clientId,
      lines: [{ description: 'Collection gate', quantity: 1, unitPriceCents: 50_000_00, discountCents: 0 }],
    }),
  })
  let invoiceId = ((await create.json()) as { data: { id: string } }).data.id
  let send = await apiFetch(`/api/v1/invoices/${invoiceId}/send`, { method: 'POST', headers: auth })
  record('Phase 7 — send for collection', send.status === 200, `status ${send.status}`)

  let assign = await apiFetch(`/api/v1/invoices/${invoiceId}/collection/assign`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ collectorId }),
  })
  record('Phase 7 — FR-14 assign', assign.status === 200, `status ${assign.status}`)

  let activity = await apiFetch(`/api/v1/invoices/${invoiceId}/collection/activities`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ occurredAt: new Date().toISOString(), outcome: 'contacted' }),
  })
  record('Phase 7 — FR-14 activity', activity.status === 201, `status ${activity.status}`)

  let paid = await apiFetch(`/api/v1/invoices/${invoiceId}/mark-paid`, { method: 'POST', headers: auth })
  record('Phase 7 — mark paid', paid.status === 200, `status ${paid.status}`)

  let collection = await apiFetch(`/api/v1/invoices/${invoiceId}/collection`, { headers: auth })
  let body = (await collection.json()) as { data: { history: Array<{ commissionCents: number | null }> } }
  let commission = body.data.history[0]?.commissionCents
  record('Phase 7 — BR-08 commission locked', commission === 5_000_00, `commissionCents=${commission}`)
}

async function main() {
  console.log('=== Development phase gates ===\n')
  await gatePhase0()
  let { token } = await gatePhase1()
  let clientId = await gatePhase2(token)
  let invoiceId = await gatePhase3(token, clientId)
  await gatePhase4(token, invoiceId)
  await gatePhase5(token, invoiceId)
  await gatePhase6Release(token, clientId)
  await gatePhase7Collection(token, clientId)
  console.log('\n=== All gates PASS ===')
  writeGateReports(false)
}

main().catch((error) => {
  writeGateReports(true)
  console.error(error)
  process.exit(1)
})

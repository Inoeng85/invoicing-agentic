/**
 * Product Phase 6 — release readiness check (G6.2 + checklist G6.1 / G6.3).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function runVerify(): boolean {
  let result = spawnSync('npm', ['run', 'verify'], { cwd: root, stdio: 'inherit' })
  return result.status === 0
}

console.log('=== Release readiness (Phase 6 / G6) ===\n')

let verifyOk = runVerify()

let ciPath = join(root, '.github/workflows/ci.yml')
let ciHasVerify = existsSync(ciPath) && readFileSync(ciPath, 'utf8').includes('npm run verify')

console.log('\n--- Checklist ---')
console.log(`[${verifyOk ? 'x' : ' '}] G6.2 npm run verify (gate G0–G6 + tests)`)
console.log(`[${existsSync(join(root, 'scripts/ci-local.ts')) ? 'x' : ' '}] PG-1 fallback npm run ci:local (CI parity)`)
console.log(`[${ciHasVerify ? 'x' : ' '}] CI workflow defines verify pipeline`)
console.log('[ ] G6.1 CI green on GitHub (needs Actions + push/PR)')
console.log('[ ] G6.3 Engineering sign-off — MVP-SCOPE-LOCK.md')
console.log('[ ] UAT manual — brd/USER-STORIES-UAT.md')
console.log('[ ] Legal review — legal/')
let domainSrc = join(root, 'packages/domain/src/invoices.ts')
let domainText = existsSync(domainSrc) ? readFileSync(domainSrc, 'utf8') : ''
let gapG01 = domainText.includes('cancelInvoice')
let gapG02 = existsSync(join(root, 'apps/web/app/routes.ts')) && readFileSync(join(root, 'apps/web/app/routes.ts'), 'utf8').includes('invoiceRevokeLink')
let gapG05 = existsSync(join(root, 'apps/web/app/lib/csrf.ts'))
let gapG13 = domainText.includes('$transaction') && domainText.includes('sendPayload')
console.log(`[${gapG01 ? 'x' : ' '}] G-01 cancel invoice (domain + web)`)
console.log(`[${gapG02 ? 'x' : ' '}] G-02 revoke link UI (web)`)
console.log('[ ] G-04 Resend prod — set EMAIL_PROVIDER=resend + secrets on host')
console.log(`[${gapG05 ? 'x' : ' '}] G-05 CSRF + rate limit public + noindex`)
console.log(`[${gapG13 ? 'x' : ' '}] G-13 atomic send (tx then email)`)
console.log('[ ] Platform PG-1…PG-3 formal (hosting, staging, prod uji)')

if (!verifyOk) process.exit(1)
console.log('\nAutomated release checks passed. Complete manual items before production tag.')

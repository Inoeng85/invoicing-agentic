/**
 * Validasi env production sebelum deploy (PG-2 / PG-3).
 * Usage: NODE_ENV=production DATABASE_URL=file:/data/app.db … npm run host:check
 */
import { validateEnvForDoctor } from '@invoicing/platform'

let nodeEnv = process.env.NODE_ENV ?? 'development'
if (nodeEnv !== 'production') {
  console.warn('host:check — NODE_ENV is not production; checking production rules anyway.')
  process.env.NODE_ENV = 'production'
}

let url = process.env.DATABASE_URL ?? ''
if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
  console.error('DATABASE_URL must be SQLite (file:…) per ADR-0001.')
  process.exit(1)
}

let failed = false
for (let target of ['web', 'api'] as const) {
  let { ok, missing } = validateEnvForDoctor(target)
  console.log(`\n[${target}] ${ok ? 'OK' : 'MISSING: ' + missing.join(', ')}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log('\nhost:check — PASS')

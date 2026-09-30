/**
 * Run full verify against PostgreSQL (PG-2 / PS-16).
 * Set DATABASE_URL to a reachable Postgres (staging host, local install, etc.).
 * Tanpa Docker — app tetap jalan SQLite lokal via `npm run verify`.
 *
 *   DATABASE_URL=postgresql://… npm run verify:postgres
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/invoicing_dev'

function run(label: string, args: string[]): boolean {
  console.log(`\n=== ${label} ===\n`)
  let result = spawnSync('npm', args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  })
  return result.status === 0
}

console.log(`DATABASE_URL=${databaseUrl.replace(/:[^:@/]+@/, ':***@')}`)

if (!run('migrate postgres', ['run', 'db:migrate:deploy:postgres'])) process.exit(1)
if (!run('verify', ['run', 'verify'])) process.exit(1)

console.log('\nverify:postgres — PASS')

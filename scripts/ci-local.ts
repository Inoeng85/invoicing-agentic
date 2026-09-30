/**
 * Paritas job CI GitHub Actions — PG-1 fallback saat billing/runner terblokir.
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv): boolean {
  let result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', env })
  return result.status === 0
}

function ensureEnv(rel: string) {
  let example = join(root, rel, '.env.example')
  let target = join(root, rel, '.env')
  if (existsSync(example) && !existsSync(target)) {
    copyFileSync(example, target)
    console.log(`Created ${rel}/.env from example`)
  }
}

ensureEnv('packages/database')
ensureEnv('apps/web')
ensureEnv('apps/api')

let ciEnv: NodeJS.ProcessEnv = {
  ...process.env,
  DATABASE_URL: 'file:./dev.db',
  SESSION_SECRET: 'ci-session-secret-not-for-production',
  EMAIL_PROVIDER: 'log',
  NODE_ENV: 'test',
  APP_URL: 'http://localhost:44100',
  CORS_ORIGIN: 'http://localhost:44100',
  API_BASE_URL: 'http://localhost:44101',
}

console.log('=== ci:local (parity with .github/workflows/ci.yml) ===\n')

if (!run('npm', ['ci'], ciEnv)) process.exit(1)
if (!run('npm', ['run', 'db:migrate:deploy'], ciEnv)) process.exit(1)
if (!run('npm', ['run', 'verify'], ciEnv)) process.exit(1)

console.log('\nci:local — PASS (same steps as CI verify job)')

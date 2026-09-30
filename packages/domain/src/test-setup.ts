import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Must be the first import of every DB-backed test file: the Prisma client reads DATABASE_URL
// when it first connects, so it has to point at a throwaway DB before any domain code runs.
let dir = mkdtempSync(join(tmpdir(), 'invoicing-domain-test-'))
process.env.DATABASE_URL = `file:${join(dir, 'test.db')}`

let databasePackage = join(dirname(fileURLToPath(import.meta.url)), '../../database')
execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
  cwd: databasePackage,
  env: process.env,
  stdio: 'ignore',
})

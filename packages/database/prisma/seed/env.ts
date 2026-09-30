import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const seedDir = dirname(fileURLToPath(import.meta.url))
export const databaseRoot = join(seedDir, '../..')
export const prismaDir = join(databaseRoot, 'prisma')
export const canonicalDbPath = join(prismaDir, 'dev.db')

function readDatabaseUrlFromEnvFile(): string | undefined {
  let envPath = join(databaseRoot, '.env')
  if (!existsSync(envPath)) return undefined
  for (let line of readFileSync(envPath, 'utf8').split('\n')) {
    let trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    let match = /^DATABASE_URL\s*=\s*(.+)$/.exec(trimmed)
    if (!match) continue
    let value = match[1]!.trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    return value
  }
  return undefined
}

/** Resolve SQLite URL so seed always hits the same file as `prisma migrate` (schema-relative). */
export function resolveDatabaseUrl(raw: string): string {
  if (!raw.startsWith('file:')) return raw
  let pathPart = raw.slice('file:'.length)
  if (pathPart.startsWith('./') || pathPart.startsWith('../') || !pathPart.startsWith('/')) {
    pathPart = resolve(prismaDir, pathPart)
  }
  return `file:${pathPart}`
}

export function bootstrapSeedEnv(): string {
  if (!existsSync(join(prismaDir, 'schema.prisma'))) {
    throw new Error(
      'Monorepo Agentic tidak ditemukan. Jalankan dari folder Agentic:\n  cd Agentic\n  npm run db:seed:sample',
    )
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = readDatabaseUrlFromEnvFile() ?? 'file:./dev.db'
  }
  process.env.DATABASE_URL = resolveDatabaseUrl(process.env.DATABASE_URL)
  return process.env.DATABASE_URL
}

// Side effect on import — must be first import in seed entrypoints.
export const activeDatabaseUrl = bootstrapSeedEnv()

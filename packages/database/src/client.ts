import { PrismaClient as SqliteClient } from '@prisma/client'
import { PrismaClient as PostgresClient } from './generated/postgres/client.js'

const globalForPrisma = globalThis as unknown as {
  prisma: SqliteClient | PostgresClient | undefined
}

function isPostgresUrl(url: string | undefined) {
  return Boolean(url?.startsWith('postgres://') || url?.startsWith('postgresql://'))
}

function createPrismaClient() {
  let url = process.env.DATABASE_URL
  if (isPostgresUrl(url)) {
    return new PostgresClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }
  return new SqliteClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Single TS surface: SQLite client types (models identical on PostgreSQL client).
export const prisma = (globalForPrisma.prisma ?? createPrismaClient()) as SqliteClient

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}


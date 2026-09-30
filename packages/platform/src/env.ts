export type AppTarget = 'web' | 'api'

export type ValidatedEnv = {
  nodeEnv: string
  databaseUrl: string
  sessionSecret: string | undefined
  appUrl: string | undefined
  corsOrigin: string | undefined
  apiBaseUrl: string | undefined
  emailProvider: string
  emailApiKey: string | undefined
  emailFrom: string | undefined
}

function isProduction(nodeEnv: string) {
  return nodeEnv === 'production'
}

function isPostgresUrl(url: string) {
  return url.startsWith('postgres://') || url.startsWith('postgresql://')
}

function missing(names: string[]): never {
  console.error(`Missing required environment variables: ${names.join(', ')}`)
  process.exit(1)
}

export function validateEnvAtBoot(target: AppTarget): ValidatedEnv {
  let nodeEnv = process.env.NODE_ENV ?? 'development'
  let databaseUrl = process.env.DATABASE_URL
  let sessionSecret = process.env.SESSION_SECRET
  let appUrl = process.env.APP_URL
  let corsOrigin = process.env.CORS_ORIGIN
  let apiBaseUrl = process.env.API_BASE_URL
  let emailProvider = (process.env.EMAIL_PROVIDER ?? 'log').toLowerCase()
  let emailApiKey = process.env.EMAIL_API_KEY
  let emailFrom = process.env.EMAIL_FROM

  let required: string[] = []
  if (!databaseUrl) required.push('DATABASE_URL')

  if (isProduction(nodeEnv)) {
    if (!sessionSecret) required.push('SESSION_SECRET')
    if (!appUrl) required.push('APP_URL')
    if (target === 'api' && !corsOrigin) required.push('CORS_ORIGIN')
    if (emailProvider !== 'log') {
      if (!emailApiKey) required.push('EMAIL_API_KEY')
      if (!emailFrom) required.push('EMAIL_FROM')
    }
  }

  if (required.length) missing(required)

  if (databaseUrl && isPostgresUrl(databaseUrl)) {
    console.error('DATABASE_URL must be SQLite (file:…) — PostgreSQL is not supported (ADR-0001).')
    process.exit(1)
  }

  if (emailProvider !== 'log' && emailProvider !== 'resend') {
    console.error(`Invalid EMAIL_PROVIDER="${emailProvider}" (expected log or resend)`)
    process.exit(1)
  }

  return {
    nodeEnv,
    databaseUrl: databaseUrl!,
    sessionSecret,
    appUrl,
    corsOrigin,
    apiBaseUrl,
    emailProvider,
    emailApiKey,
    emailFrom,
  }
}

export function validateEnvForDoctor(target: AppTarget): { ok: boolean; missing: string[] } {
  let nodeEnv = process.env.NODE_ENV ?? 'development'
  let missingVars: string[] = []
  if (!process.env.DATABASE_URL) missingVars.push('DATABASE_URL')
  if (nodeEnv === 'production') {
    if (!process.env.SESSION_SECRET) missingVars.push('SESSION_SECRET')
    if (!process.env.APP_URL) missingVars.push('APP_URL')
    if (target === 'api' && !process.env.CORS_ORIGIN) missingVars.push('CORS_ORIGIN')
    let provider = (process.env.EMAIL_PROVIDER ?? 'log').toLowerCase()
    if (provider !== 'log') {
      if (!process.env.EMAIL_API_KEY) missingVars.push('EMAIL_API_KEY')
      if (!process.env.EMAIL_FROM) missingVars.push('EMAIL_FROM')
    }
  }
  return { ok: missingVars.length === 0, missing: missingVars }
}

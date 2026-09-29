import { createHmac, timingSafeEqual } from 'node:crypto'

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30

function getSessionSecret(): string {
  let secret = process.env.SESSION_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET is required in production')
    }
    return 'dev-invoicing-session-secret-change-me'
  }
  return secret
}

function signPayload(payload: string): string {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url')
}

export function createSessionToken(userId: string, ttlMs = DEFAULT_TTL_MS): string {
  let expiresAt = Date.now() + ttlMs
  let payload = `${userId}.${expiresAt}`
  return `${payload}.${signPayload(payload)}`
}

export function verifySessionToken(token: string | null | undefined): string | null {
  if (!token) return null
  let parts = token.split('.')
  if (parts.length !== 3) return null
  let [userId, expiresRaw, signature] = parts
  if (!userId || !expiresRaw || !signature) return null
  let payload = `${userId}.${expiresRaw}`
  let expected = signPayload(payload)
  let sigBuf = Buffer.from(signature)
  let expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null
  let expiresAt = Number.parseInt(expiresRaw, 10)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null
  return userId
}

export const SESSION_COOKIE_NAME = 'invoicing_session'

import { createHmac, timingSafeEqual } from 'node:crypto'

function secret(): string {
  return process.env.SESSION_SECRET ?? 'dev-insecure-csrf'
}

export function createCsrfToken(userId: string): string {
  return createHmac('sha256', secret()).update(`csrf:${userId}`).digest('base64url')
}

export function verifyCsrfToken(userId: string, token: string | null): boolean {
  if (!token) return false
  let expected = createCsrfToken(userId)
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token))
  } catch {
    return false
  }
}

export async function assertCsrf(request: Request, userId: string): Promise<void> {
  let formData = await request.clone().formData()
  let token = formData.get('_csrf')
  if (!verifyCsrfToken(userId, typeof token === 'string' ? token : null)) {
    throw new Response('CSRF token invalid', { status: 403 })
  }
}

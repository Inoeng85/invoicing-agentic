import { verifySessionToken, SESSION_COOKIE_NAME } from '@invoicing/domain'

export function getBearerToken(request: Request): string | null {
  let header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim() || null
}

export function getSessionTokenFromRequest(request: Request): string | null {
  return getBearerToken(request) ?? getCookieValue(request, SESSION_COOKIE_NAME)
}

export function requireUserId(request: Request): string {
  let userId = verifySessionToken(getSessionTokenFromRequest(request))
  if (!userId) throw new Response(JSON.stringify({ error: { code: 'unauthorized', message: 'Login required' } }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
  return userId
}

function getCookieValue(request: Request, name: string): string | null {
  let cookie = request.headers.get('Cookie')
  if (!cookie) return null
  for (let part of cookie.split(';')) {
    let [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

export function sessionResponseHeaders(sessionToken: string): Headers {
  let headers = new Headers({ 'Content-Type': 'application/json' })
  headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax`,
  )
  return headers
}

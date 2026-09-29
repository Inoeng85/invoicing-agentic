import { SESSION_COOKIE_NAME, verifySessionToken } from '@invoicing/domain'

export function getUserIdFromRequest(request: Request): string | null {
  let cookie = request.headers.get('Cookie')
  if (!cookie) return null
  for (let part of cookie.split(';')) {
    let [key, ...rest] = part.trim().split('=')
    if (key === SESSION_COOKIE_NAME) {
      return verifySessionToken(decodeURIComponent(rest.join('=')))
    }
  }
  return null
}

export function appendSessionCookie(headers: Headers, sessionToken: string) {
  headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax`,
  )
}

export function clearSessionCookie(headers: Headers) {
  headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`,
  )
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  let headers = new Headers(init.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8')
  }
  return new Response(JSON.stringify(data), { ...init, headers })
}

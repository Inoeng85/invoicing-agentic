import { randomUUID } from 'node:crypto'

import type { Middleware } from 'remix/router'

const REQUEST_ID_HEADER = 'x-request-id'

function logRequest(entry: Record<string, unknown>) {
  let line = JSON.stringify(entry)
  if ((process.env.NODE_ENV ?? 'development') === 'development') {
    console.log(line)
  } else {
    console.log(line)
  }
}

export function requestLogging(): Middleware {
  return async (context, next) => {
    let requestId = context.request.headers.get(REQUEST_ID_HEADER) ?? randomUUID()
    let url = new URL(context.request.url)
    let start = Date.now()
    let response = await next()
    let durationMs = Date.now() - start
    let headers = new Headers(response.headers)
    headers.set('X-Request-Id', requestId)

    logRequest({
      requestId,
      method: context.request.method,
      path: url.pathname,
      status: response.status,
      durationMs,
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}

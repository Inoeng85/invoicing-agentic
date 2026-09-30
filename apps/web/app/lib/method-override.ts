const OVERRIDABLE = new Set(['PUT', 'PATCH', 'DELETE'])

/**
 * Lets HTML forms reach `resources()` update routes (PUT) via a hidden `_method` field.
 * Reads a clone so handlers can still call `request.formData()`.
 */
export function formMethodOverride() {
  return async (context: { method: string; request: Request }, next: () => Promise<Response>) => {
    let contentType = context.request.headers.get('Content-Type') ?? ''
    if (context.method === 'POST' && contentType.includes('application/x-www-form-urlencoded')) {
      let method = (await context.request.clone().formData()).get('_method')
      if (typeof method === 'string' && OVERRIDABLE.has(method.toUpperCase())) {
        context.method = method.toUpperCase()
      }
    }
    return next()
  }
}

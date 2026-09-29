import { isDomainError } from '@invoicing/domain'

import { json } from './json.ts'

export async function handleDomain<T>(fn: () => Promise<T>) {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof Response) return error
    if (isDomainError(error)) {
      return json({ error: { code: error.code, message: error.message } }, { status: error.status })
    }
    console.error(error)
    return json({ error: { code: 'internal', message: 'Internal error' } }, { status: 500 })
  }
}

import type { Handle } from 'remix/component'

import { createCsrfToken } from './csrf.ts'

export function CsrfInput(handle: Handle<{ userId: string }>) {
  return () => <input type="hidden" name="_csrf" value={createCsrfToken(handle.props.userId)} />
}

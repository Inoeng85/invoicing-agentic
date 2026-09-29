import { redirect } from 'remix/response/redirect'

import { routes } from '../routes.ts'
import { getUserIdFromRequest } from './session.ts'

export function requireUserId(request: Request): string {
  let userId = getUserIdFromRequest(request)
  if (!userId) {
    throw redirect(routes.login.index.href())
  }
  return userId
}

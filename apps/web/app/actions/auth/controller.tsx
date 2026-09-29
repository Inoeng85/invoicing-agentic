import { createController } from 'remix/router'
import { redirect } from 'remix/response/redirect'
import type { Handle } from 'remix/ui'
import { loginUser, registerUser } from '@invoicing/domain'

import { appendSessionCookie } from '../../lib/session.ts'
import { routes } from '../../routes.ts'

export default createController(routes.login, {
  actions: {
    index(context) {
      return context.render(<LoginPage error={null} />)
    },
    async action(context) {
      let formData = await context.request.formData()
      let email = String(formData.get('email') ?? '')
      let password = String(formData.get('password') ?? '')
      try {
        let result = await loginUser({ email, password })
        let headers = new Headers()
        appendSessionCookie(headers, result.sessionToken)
        throw redirect(routes.home.href(), { headers, status: 303 })
      } catch (error) {
        let message = error instanceof Error ? error.message : 'Login gagal'
        return context.render(<LoginPage error={message} />)
      }
    },
  },
})

function LoginPage(handle: Handle<{ error: string | null }>) {
  return () => {
    let { error } = handle.props
    return (
      <div class="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 class="text-lg font-semibold">Login</h1>
        {error ? <p class="mt-2 text-sm text-red-600">{error}</p> : null}
        <form method="post" action={routes.login.action.href()} class="mt-4 space-y-3">
          <label class="block text-sm">
            Email
            <input name="email" type="email" required class="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label class="block text-sm">
            Password
            <input name="password" type="password" required class="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <button type="submit" class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            Masuk
          </button>
        </form>
        <p class="mt-4 text-sm">
          Belum punya akun? <a href={routes.register.index.href()}>Daftar</a>
        </p>
      </div>
    )
  }
}

export const registerController = createController(routes.register, {
  actions: {
    index(context) {
      return context.render(<RegisterPage error={null} />)
    },
    async action(context) {
      let formData = await context.request.formData()
      let email = String(formData.get('email') ?? '')
      let password = String(formData.get('password') ?? '')
      let legalName = String(formData.get('legalName') ?? '')
      try {
        let result = await registerUser({ email, password, legalName })
        let headers = new Headers()
        appendSessionCookie(headers, result.sessionToken)
        throw redirect(routes.home.href(), { headers, status: 303 })
      } catch (error) {
        let message = error instanceof Error ? error.message : 'Registrasi gagal'
        return context.render(<RegisterPage error={message} />)
      }
    },
  },
})

function RegisterPage(handle: Handle<{ error: string | null }>) {
  return () => {
    let { error } = handle.props
    return (
      <div class="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 class="text-lg font-semibold">Daftar</h1>
        {error ? <p class="mt-2 text-sm text-red-600">{error}</p> : null}
        <form method="post" action={routes.register.action.href()} class="mt-4 space-y-3">
          <label class="block text-sm">
            Nama bisnis
            <input name="legalName" required class="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label class="block text-sm">
            Email
            <input name="email" type="email" required class="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label class="block text-sm">
            Password
            <input name="password" type="password" required minLength={8} class="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <button type="submit" class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            Buat akun
          </button>
        </form>
        <p class="mt-4 text-sm">
          Sudah punya akun? <a href={routes.login.index.href()}>Login</a>
        </p>
      </div>
    )
  }
}

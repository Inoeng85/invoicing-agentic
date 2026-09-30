import { createController } from 'remix/router'
import { redirect } from 'remix/response/redirect'
import type { Handle } from 'remix/ui'
import { loginUser, registerUser } from '@invoicing/domain'

import { APP_NAME } from '../../lib/brand.ts'
import { appendSessionCookie } from '../../lib/session.ts'
import { AuthShell } from '../../ui/auth-shell.tsx'
import { routes } from '../../routes.ts'

function rethrowResponse(error: unknown): never | void {
  if (error instanceof Response) {
    throw error
  }
}

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
        rethrowResponse(error)
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
      <AuthShell tab="login" title={`Masuk — ${APP_NAME}`}>
        <section class="space-y-6" aria-labelledby="login-heading">
          <div class="space-y-1 text-center">
            <h1 id="login-heading" class="text-xl font-bold text-foreground">
              Selamat datang kembali
            </h1>
            <p class="text-sm text-muted-foreground">Masuk untuk mengelola invoice kamu.</p>
          </div>
          {error ? (
            <p class="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <form method="post" action={routes.login.action.href()} class="grid gap-4">
            <div class="field">
              <label class="label" for="login-email">
                Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                class="input"
                aria-invalid={error ? true : undefined}
              />
            </div>
            <div class="field">
              <div class="flex items-center justify-between">
                <label class="label" for="login-password">
                  Kata sandi
                </label>
                <span class="text-sm text-muted-foreground">Hubungi admin jika lupa</span>
              </div>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                class="input"
                aria-invalid={error ? true : undefined}
              />
            </div>
            <button type="submit" class="btn btn-default w-full">
              Masuk
            </button>
          </form>
        </section>
      </AuthShell>
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
        rethrowResponse(error)
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
      <AuthShell tab="register" title={`Daftar — ${APP_NAME}`}>
        <section class="space-y-6" aria-labelledby="register-heading">
          <div class="space-y-1 text-center">
            <h1 id="register-heading" class="text-xl font-bold text-foreground">
              Buat akun gratis
            </h1>
            <p class="text-sm text-muted-foreground">Mulai kirim invoice profesional dalam rupiah.</p>
          </div>
          {error ? (
            <p class="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <form method="post" action={routes.register.action.href()} class="grid gap-4">
            <div class="field">
              <label class="label" for="register-legalName">
                Nama bisnis
              </label>
              <input
                id="register-legalName"
                name="legalName"
                required
                autoComplete="organization"
                placeholder="Studio Kartika"
                class="input"
              />
            </div>
            <div class="field">
              <label class="label" for="register-email">
                Email
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nama@email.com"
                class="input"
              />
            </div>
            <div class="field">
              <label class="label" for="register-password">
                Kata sandi
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                class="input"
              />
              <p class="field-description">Minimal 8 karakter.</p>
            </div>
            <button type="submit" class="btn btn-default w-full">
              Buat akun
            </button>
          </form>
        </section>
      </AuthShell>
    )
  }
}

import type { Handle, RemixNode } from 'remix/ui'

import { Document } from '../actions/document.tsx'
import { routes } from '../routes.ts'
import { icon } from './icons.tsx'

export type AuthTab = 'login' | 'register'

export interface AuthShellProps {
  tab: AuthTab
  title: string
  children?: RemixNode
}

export function AuthShell(handle: Handle<AuthShellProps>) {
  return () => {
    let { tab, title, children } = handle.props

    return (
      <Document title={title}>
        <div class="grid min-h-screen bg-page lg:grid-cols-2">
          <div class="flex flex-col gap-6 p-6 md:p-10">
            <a class="flex items-center gap-2 font-semibold text-foreground" href={routes.login.index.href()}>
              <span class="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
                {icon('receipt', 'size-4')}
              </span>
              <span class="leading-tight">
                Invoicing
                <span class="hidden text-xs font-normal text-muted-foreground lg:block">Freelancer Indonesia</span>
              </span>
            </a>

            <div class="flex flex-1 items-center justify-center">
              <div class="w-full max-w-sm space-y-6">
                <div class="tabs-list w-full" role="tablist" aria-label="Autentikasi">
                  <a
                    role="tab"
                    href={routes.login.index.href()}
                    aria-selected={tab === 'login'}
                    class="tabs-trigger"
                  >
                    Masuk
                  </a>
                  <a
                    role="tab"
                    href={routes.register.index.href()}
                    aria-selected={tab === 'register'}
                    class="tabs-trigger"
                  >
                    Daftar
                  </a>
                </div>
                {children}
                <p class="text-center text-xs text-muted-foreground">
                  Dengan melanjutkan, data kamu diproses sesuai UU PDP.
                </p>
              </div>
            </div>
          </div>

          <aside
            class="relative hidden overflow-hidden bg-slate-900 text-white lg:block"
            aria-hidden="true"
          >
            <div class="absolute -top-32 -right-32 size-[28rem] rounded-full bg-blue-500/30 blur-3xl" />
            <div class="absolute -bottom-40 -left-20 size-[24rem] rounded-full bg-emerald-500/20 blur-3xl" />
            <div class="relative flex h-full flex-col justify-between p-12">
              <p class="text-sm text-slate-400">Untuk freelancer &amp; UMKM Indonesia</p>
              <div class="space-y-8">
                <div class="max-w-sm rotate-[-2deg] rounded-xl bg-white p-5 text-slate-900 shadow-2xl">
                  <div class="flex items-center justify-between">
                    <span class="font-mono text-xs text-slate-500">INV-2026-0013</span>
                    <span class="badge badge-paid">
                      <span class="badge-dot" />
                      Lunas
                    </span>
                  </div>
                  <p class="mt-3 text-sm text-slate-500">PT Arunika Digital</p>
                  <p class="text-3xl font-semibold tracking-tight tabular-nums">Rp 5.550.000</p>
                  <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div class="h-full w-full rounded-full bg-emerald-500" />
                  </div>
                </div>
                <blockquote class="max-w-md space-y-3">
                  <p class="text-xl leading-relaxed font-medium">
                    &ldquo;Dulu bikin invoice di Word 30 menit. Sekarang 2 menit, PPN langsung terhitung, dan klien
                    bayar lebih cepat.&rdquo;
                  </p>
                  <footer class="text-sm text-slate-400">Dewi Kartika · Desainer UI, Yogyakarta</footer>
                </blockquote>
              </div>
              <ul class="flex flex-wrap gap-6 text-sm text-slate-300">
                <li class="inline-flex items-center gap-2">
                  {icon('check', 'size-4 text-emerald-400')}
                  IDR &amp; PPN 11%
                </li>
                <li class="inline-flex items-center gap-2">
                  {icon('check', 'size-4 text-emerald-400')}
                  PDF &amp; tautan publik
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </Document>
    )
  }
}

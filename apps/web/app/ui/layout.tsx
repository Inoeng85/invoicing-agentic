import type { Handle, RemixNode } from 'remix/ui'

import { Document } from '../actions/document.tsx'
import { routes } from '../routes.ts'

export interface AppLayoutProps {
  title: string
  children?: RemixNode
  userEmail?: string
}

export function AppLayout(handle: Handle<AppLayoutProps>) {
  return () => {
    let { title, children, userEmail } = handle.props

    return (
      <Document title={title}>
        <div class="min-h-screen bg-slate-50">
          <header class="border-b border-slate-200 bg-white">
            <div class="page-container flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p class="text-sm font-semibold uppercase tracking-wide text-blue-600">Invoicing</p>
                <h1 class="text-xl font-bold text-slate-900">Freelancer Indonesia</h1>
              </div>
              <nav class="flex flex-wrap gap-2 text-sm">
                <a class="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700" href={routes.home.href()}>
                  Dashboard
                </a>
                <a class="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100" href={routes.clients.index.href()}>
                  Klien
                </a>
                <a class="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100" href={routes.invoices.index.href()}>
                  Invoice
                </a>
                <a class="rounded-full px-3 py-1 text-slate-600 hover:bg-slate-100" href={routes.settings.index.href()}>
                  Pengaturan
                </a>
              </nav>
              {userEmail ? (
                <p class="text-xs text-slate-500">{userEmail}</p>
              ) : null}
            </div>
          </header>
          <main class="page-container py-8">{children}</main>
        </div>
      </Document>
    )
  }
}

import type { Handle } from 'remix/ui'

import type { SystemStatus } from '@invoicing/domain'
import { Document } from './document.tsx'

export interface InvoicingHomeProps {
  status: SystemStatus
}

export function InvoicingHome(handle: Handle<InvoicingHomeProps>) {
  return () => {
    let { status } = handle.props

    return (
      <Document title="Invoicing">
        <div class="min-h-screen">
          <header class="border-b border-slate-200 bg-white">
            <div class="page-container flex items-center justify-between py-4">
              <div>
                <p class="text-sm font-semibold uppercase tracking-wide text-blue-600">Invoicing</p>
                <h1 class="text-xl font-bold text-slate-900">Freelancer Indonesia</h1>
              </div>
              <nav class="flex gap-2 text-sm">
                <span class="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                  Dashboard
                </span>
                <span class="rounded-full px-3 py-1 text-slate-400">Klien</span>
                <span class="rounded-full px-3 py-1 text-slate-400">Invoice</span>
              </nav>
            </div>
          </header>

          <main class="page-container space-y-8">
            <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 class="text-lg font-semibold text-slate-900">Stack terintegrasi</h2>
              <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Basecode Remix dengan SQLite + Prisma ORM dan Tailwind CSS. Schema mengikuti{' '}
                <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs">docs/invoicing</code>.
              </p>
              <ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <li class="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p class="text-xs font-medium uppercase text-slate-500">Framework</p>
                  <p class="mt-1 font-semibold text-slate-900">Remix 3</p>
                </li>
                <li class="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p class="text-xs font-medium uppercase text-slate-500">Backend API</p>
                  <p class="mt-1 font-semibold text-slate-900">apps/api :44101</p>
                </li>
                <li class="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p class="text-xs font-medium uppercase text-slate-500">Database</p>
                  <p class="mt-1 font-semibold text-slate-900">packages/database</p>
                </li>
                <li class="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p class="text-xs font-medium uppercase text-slate-500">UI</p>
                  <p class="mt-1 font-semibold text-slate-900">Tailwind CSS</p>
                </li>
              </ul>
            </section>

            <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatusCard
                label="Database"
                value={status.database === 'ok' ? 'Terhubung' : 'Error'}
                tone={status.database === 'ok' ? 'success' : 'danger'}
              />
              <StatusCard label="Users" value={String(status.userCount)} tone="neutral" />
              <StatusCard label="Clients" value={String(status.clientCount)} tone="neutral" />
              <StatusCard label="Invoices" value={String(status.invoiceCount)} tone="neutral" />
            </section>

            <section class="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
              <h3 class="font-semibold text-slate-900">Langkah berikutnya</h3>
              <ol class="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
                <li>Auth (register/login) dan profil bisnis</li>
                <li>CRUD klien dan invoice draft</li>
                <li>PDF, email, dan link publik</li>
              </ol>
            </section>
          </main>
        </div>
      </Document>
    )
  }
}

function StatusCard(handle: Handle<{ label: string; value: string; tone: 'success' | 'danger' | 'neutral' }>) {
  return () => {
    let { label, value, tone } = handle.props
    let valueClass =
      tone === 'success'
        ? 'text-emerald-700'
        : tone === 'danger'
          ? 'text-red-700'
          : 'text-slate-900'

    return (
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p class={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</p>
      </div>
    )
  }
}

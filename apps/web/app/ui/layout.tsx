import type { Handle, RemixNode } from 'remix/ui'
import { getUserById } from '@invoicing/domain'

import { Document } from '../actions/document.tsx'
import { CsrfInput } from '../lib/csrf-field.tsx'
import { routes } from '../routes.ts'
import { icon, type IconName } from './icons.tsx'
import { initials } from './kit.tsx'

export type NavKey = 'dashboard' | 'clients' | 'collectors' | 'invoices' | 'settings'

export interface ShellUser {
  id: string
  email: string
  legalName: string
}

export async function loadShellUser(userId: string): Promise<ShellUser> {
  let user = await getUserById(userId)
  return {
    id: userId,
    email: user?.email ?? '',
    legalName: user?.profile?.legalName ?? user?.email ?? 'Akun',
  }
}

const NAV: Array<{ key: NavKey; label: string; icon: IconName; href: () => string }> = [
  { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: () => routes.home.href() },
  { key: 'clients', label: 'Klien', icon: 'users', href: () => routes.clients.index.href() },
  { key: 'collectors', label: 'Kolektor', icon: 'wallet', href: () => routes.collectors.index.href() },
  { key: 'invoices', label: 'Invoice', icon: 'file-text', href: () => routes.invoices.index.href() },
  { key: 'settings', label: 'Pengaturan', icon: 'settings', href: () => routes.settings.index.href() },
]

export interface AppLayoutProps {
  title: string
  user: ShellUser
  active?: NavKey
  /** Replaces the global nav header (editor & send flows use a task header). */
  header?: RemixNode
  children?: RemixNode
}

export function AppLayout(handle: Handle<AppLayoutProps>) {
  return () => {
    let { title, user, active, header, children } = handle.props

    return (
      <Document title={`${title} — Invoicing`}>
        <div class="flex min-h-screen flex-col">
          {header ?? <MainHeader user={user} active={active} />}
          <main class="page-container flex-1">{children}</main>
          <footer class="border-t bg-background">
            <div class="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p>© 2026 Invoicing · Dibuat untuk freelancer Indonesia</p>
              <nav class="flex gap-4" aria-label="Legal">
                <span>Privasi</span>
                <span>Syarat</span>
                <span>Bantuan</span>
              </nav>
            </div>
          </footer>
        </div>
      </Document>
    )
  }
}

function MainHeader(handle: Handle<{ user: ShellUser; active?: NavKey }>) {
  return () => {
    let { user, active } = handle.props

    return (
      <header class="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div class="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            class="btn btn-ghost btn-icon btn-sm md:hidden"
            popovertarget="nav-sheet"
            aria-label="Buka menu"
          >
            {icon('menu')}
          </button>
          <Brand />
          <nav class="hidden items-center gap-1 md:flex" aria-label="Utama">
            {NAV.map((item) => (
              <a
                key={item.key}
                class="nav-link"
                aria-current={active === item.key ? 'page' : undefined}
                href={item.href()}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div class="ml-auto flex items-center gap-2">
            <a class="btn btn-default btn-sm" href={routes.invoices.new.href()}>
              {icon('plus')}
              <span class="hidden sm:inline">Invoice baru</span>
            </a>
            <details class="dropdown">
              <summary
                class="flex cursor-pointer items-center rounded-full p-0.5 hover:bg-accent"
                aria-label="Menu akun"
              >
                <span class="avatar bg-primary/10 text-primary">{initials(user.legalName)}</span>
              </summary>
              <div class="dropdown-content w-56">
                <div class="px-2 py-1.5">
                  <p class="truncate text-sm font-medium">{user.legalName}</p>
                  <p class="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div class="dropdown-separator" />
                <a class="dropdown-item" href={`${routes.settings.index.href()}#profil`}>
                  {icon('building')}
                  Profil bisnis
                </a>
                <a class="dropdown-item" href={routes.settings.index.href()}>
                  {icon('settings')}
                  Pengaturan
                </a>
                <div class="dropdown-separator" />
                <form method="post" action={routes.logout.href()}>
                  <CsrfInput userId={user.id} />
                  <button type="submit" class="dropdown-item">
                    {icon('log-out')}
                    Keluar
                  </button>
                </form>
              </div>
            </details>
          </div>
        </div>

        <div id="nav-sheet" popover="auto" class="sheet" aria-label="Menu navigasi">
          <div class="flex items-center justify-between">
            <span class="font-semibold">Invoicing</span>
            <button
              type="button"
              class="btn btn-ghost btn-icon btn-sm"
              popovertarget="nav-sheet"
              popovertargetaction="hide"
              aria-label="Tutup"
            >
              {icon('x')}
            </button>
          </div>
          <nav class="grid gap-0.5">
            {NAV.map((item) => (
              <a
                key={item.key}
                class="sidebar-link"
                aria-current={active === item.key ? 'page' : undefined}
                href={item.href()}
              >
                {icon(item.icon)}
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
    )
  }
}

export function Brand() {
  return () => (
    <a class="flex items-center gap-2 font-semibold" href={routes.home.href()}>
      <span class="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
        {icon('receipt', 'size-4')}
      </span>
      <span class="leading-tight">
        Invoicing
        <span class="hidden text-xs font-normal text-muted-foreground lg:block">Freelancer Indonesia</span>
      </span>
    </a>
  )
}

/** Task header used by the invoice editor and send flow (screen-invoice-editor.html). */
export function TaskHeader(
  handle: Handle<{
    backHref: string
    backLabel: string
    title: string
    subtitle?: string
    badge?: RemixNode
    actions?: RemixNode
  }>,
) {
  return () => {
    let { backHref, backLabel, title, subtitle, badge, actions } = handle.props
    return (
      <header class="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div class="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <a class="btn btn-ghost btn-icon btn-sm" href={backHref} aria-label={backLabel}>
            {icon('arrow-left')}
          </a>
          {subtitle ? (
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold">{title}</p>
              <p class="truncate text-xs text-muted-foreground">{subtitle}</p>
            </div>
          ) : (
            <div class="flex min-w-0 items-center gap-2">
              <h1 class="truncate text-xl font-bold">{title}</h1>
              {badge}
            </div>
          )}
          <div class="ml-auto flex items-center gap-2">{actions}</div>
        </div>
      </header>
    )
  }
}

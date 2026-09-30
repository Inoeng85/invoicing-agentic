import type { RemixNode } from 'remix/ui'
import { formatIdr } from '@invoicing/domain'

import { CsrfInput } from '../lib/csrf-field.tsx'
import { icon, type IconName } from './icons.tsx'

export type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid' | 'cancelled'

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Terkirim',
  overdue: 'Jatuh tempo',
  paid: 'Lunas',
  cancelled: 'Dibatalkan',
}

export function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  return typeof value === 'string' && value in STATUS_LABEL
}

export function statusBadge(status: string) {
  let key = isInvoiceStatus(status) ? status : 'draft'
  return (
    <span class={`badge badge-${key}`}>
      <span class="badge-dot" />
      {STATUS_LABEL[key]}
    </span>
  )
}

const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(date: Date | null | undefined): string {
  return date ? dateFmt.format(date) : '—'
}

export function formatDateTime(date: Date | null | undefined): string {
  return date ? dateTimeFmt.format(date).replace('.', ':') : '—'
}

/** `YYYY-MM-DD` in local time for `<input type="date">`. */
export function toDateInput(date: Date): string {
  let pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseDateInput(value: FormDataEntryValue | null): Date | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  let [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysBetween(from: Date, to: Date): number {
  let start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
  let end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime()
  return Math.round((end - start) / 86_400_000)
}

export function initials(name: string): string {
  let words = name
    .replace(/^(PT|CV|UD)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)).toUpperCase()
}

export function nextInvoiceNumber(numbers: Array<string | null>, year = new Date().getFullYear()): string {
  let prefix = `INV-${year}-`
  let count = numbers.filter((n) => n?.startsWith(prefix)).length
  return `${prefix}${String(count + 1).padStart(4, '0')}`
}

export { formatIdr }

/** Seeds and legacy rows use placeholders like "—" for a missing email. */
export function hasEmail(email: string | null | undefined): boolean {
  return Boolean(email?.includes('@'))
}

export type AlertVariant = 'info' | 'success' | 'warning' | 'destructive'

const ALERT_ICON: Record<AlertVariant, IconName> = {
  info: 'info',
  success: 'circle-check',
  warning: 'triangle-alert',
  destructive: 'circle-alert',
}

export function alertBox(variant: AlertVariant, title: string, description?: RemixNode, iconName?: IconName) {
  return (
    <div class={`alert alert-${variant}`} role={variant === 'destructive' ? 'alert' : 'status'}>
      {icon(iconName ?? ALERT_ICON[variant])}
      <p class="alert-title">{title}</p>
      {description ? <div class="alert-description">{description}</div> : null}
    </div>
  )
}

export function greeting(name: string): string {
  let hour = new Date().getHours()
  let time = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam'
  let first = name.replace(/^(PT|CV|UD|Studio)\.?\s+/i, '').split(/\s+/)[0] ?? name
  return `${time}, ${first}.`
}

export function pageTitle(title: string, description?: RemixNode, actions?: RemixNode) {
  return (
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold">{title}</h1>
        {description ? <p class="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div class="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export interface ConfirmDialogOptions {
  id: string
  title: string
  description: RemixNode
  action: string
  userId: string
  confirmLabel: string
  confirmIcon?: IconName
  variant?: 'destructive' | 'success' | 'default'
  children?: RemixNode
}

/** Native `[popover]` dialog — opened by `<button popovertarget={id}>`, works without JS. */
export function confirmDialog(options: ConfirmDialogOptions) {
  let titleId = `${options.id}-title`
  return (
    <div
      id={options.id}
      popover="auto"
      class="dialog"
      role={options.variant === 'destructive' ? 'alertdialog' : 'dialog'}
      aria-labelledby={titleId}
    >
      <form method="post" action={options.action} class="grid gap-4">
        <CsrfInput userId={options.userId} />
        <div class="dialog-header">
          <h2 id={titleId} class="dialog-title">
            {options.title}
          </h2>
          <p class="dialog-description">{options.description}</p>
        </div>
        {options.children}
        <div class="dialog-footer">
          <button type="button" class="btn btn-outline" popovertarget={options.id} popovertargetaction="hide">
            Batal
          </button>
          <button type="submit" class={`btn btn-${options.variant ?? 'default'}`}>
            {options.confirmIcon ? icon(options.confirmIcon) : null}
            {options.confirmLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

const TONE_TEXT = {
  primary: 'text-primary',
  warning: 'text-warning',
  success: 'text-success',
  muted: 'text-muted-foreground',
} as const

export function metricCard(options: {
  label: string
  value: string
  hint: RemixNode
  iconName: IconName
  tone?: 'primary' | 'warning' | 'success' | 'muted'
  class?: string
}) {
  let tone = options.tone ?? 'muted'
  let highlighted = tone === 'primary'
  return (
    <div class={`card gap-2 py-5 ${highlighted ? 'border-primary/30 bg-primary/5' : ''} ${options.class ?? ''}`}>
      <div class="card-header flex-row items-center justify-between">
        <p class={`text-sm font-medium ${highlighted ? 'text-primary' : 'text-muted-foreground'}`}>{options.label}</p>
        {icon(options.iconName, `size-4 ${TONE_TEXT[tone]}`)}
      </div>
      <div class="card-content">
        <p class={`${highlighted ? 'text-3xl' : 'text-2xl'} font-bold tabular-nums`}>{options.value}</p>
        <p class={`text-xs ${tone === 'warning' ? 'text-warning' : 'text-muted-foreground'}`}>{options.hint}</p>
      </div>
    </div>
  )
}

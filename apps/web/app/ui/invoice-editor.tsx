import type { Handle } from 'remix/component'
import { computeInvoiceTotals, computeLineSubtotalCents } from '@invoicing/domain'

import { CsrfInput } from '../lib/csrf-field.tsx'
import { idrToCents, parseIdrInput } from '../lib/money.ts'
import { routes } from '../routes.ts'
import { icon } from './icons.tsx'
import { alertBox, formatIdr, hasEmail, statusBadge } from './kit.tsx'
import { AppLayout, TaskHeader, type ShellUser } from './layout.tsx'

export interface EditorLine {
  description: string
  quantity: string
  unitPriceIdr: string
  discountIdr: string
}

export interface EditorValues {
  clientId: string
  issueDate: string
  dueDate: string
  ppnEnabled: boolean
  footerNote: string
  lines: EditorLine[]
}

export const EMPTY_LINE: EditorLine = { description: '', quantity: '1', unitPriceIdr: '', discountIdr: '0' }

export function parseQuantity(value: string): number {
  return Number(value.replace(',', '.'))
}

export function lineToCents(line: EditorLine) {
  return {
    description: line.description.trim(),
    quantity: parseQuantity(line.quantity),
    unitPriceCents: idrToCents(parseIdrInput(line.unitPriceIdr)),
    discountCents: idrToCents(parseIdrInput(line.discountIdr)),
  }
}

export function isBlankLine(line: EditorLine): boolean {
  return !line.description.trim() && parseIdrInput(line.unitPriceIdr) === 0
}

export function readEditorValues(formData: FormData): EditorValues {
  let text = (name: string) => String(formData.get(name) ?? '')
  let all = (name: string) => formData.getAll(name).map((v) => String(v))
  let descriptions = all('description')
  let quantities = all('quantity')
  let prices = all('unitPriceIdr')
  let discounts = all('discountIdr')
  return {
    clientId: text('clientId'),
    issueDate: text('issueDate'),
    dueDate: text('dueDate'),
    ppnEnabled: formData.get('ppnEnabled') === 'on',
    footerNote: text('footerNote'),
    lines: descriptions.map((description, i) => ({
      description,
      quantity: quantities[i] ?? '1',
      unitPriceIdr: prices[i] ?? '',
      discountIdr: discounts[i] ?? '0',
    })),
  }
}

export interface InvoiceEditorProps {
  user: ShellUser
  action: string
  invoiceId?: string
  clients: Array<{ id: string; name: string; email: string }>
  values: EditorValues
  nextNumber: string
  defaultDueDays: number
  error?: string
  notice?: string
}

const LINE_GRID = 'md:grid-cols-[1fr_4.5rem_9rem_8rem_8rem_2.25rem]'

export function InvoiceEditor(handle: Handle<InvoiceEditorProps>) {
  return () => {
    let { user, action, invoiceId, clients, values, nextNumber, defaultDueDays, error, notice } = handle.props
    let cents = values.lines.map(lineToCents).map((l) => ({
      ...l,
      quantity: Number.isFinite(l.quantity) ? l.quantity : 0,
    }))
    let totals = computeInvoiceTotals(cents, values.ppnEnabled, 0.11)
    let backHref = invoiceId ? routes.invoices.show.href({ invoiceId }) : routes.invoices.index.href()

    let header = (
      <TaskHeader
        backHref={routes.invoices.index.href()}
        backLabel="Kembali ke daftar invoice"
        title={invoiceId ? 'Invoice draft' : 'Invoice baru'}
        subtitle={`Draft · ${nextNumber} (otomatis saat kirim)`}
        badge={statusBadge('draft')}
        actions={
          <>
            <button type="submit" form="invoice-form" name="intent" value="save" class="btn btn-outline btn-sm">
              {icon('save')}
              <span class="hidden sm:inline">Simpan draft</span>
            </button>
            <button type="submit" form="invoice-form" name="intent" value="preview" class="btn btn-outline btn-sm">
              {icon('eye')}
              <span class="hidden sm:inline">Preview</span>
            </button>
          </>
        }
      />
    )

    return (
      <AppLayout title={invoiceId ? 'Invoice draft' : 'Invoice baru'} user={user} header={header}>
        <form id="invoice-form" method="post" action={action} class="space-y-8">
          <CsrfInput userId={user.id} />
          {invoiceId ? <input type="hidden" name="_method" value="PUT" /> : null}

          {error ? alertBox('destructive', 'Draft belum tersimpan', <p>{error}</p>) : null}
          {notice ? alertBox('success', notice) : null}
          {clients.length === 0
            ? alertBox(
                'warning',
                'Belum ada klien aktif',
                <p>
                  Tambahkan klien dulu sebelum membuat invoice.{' '}
                  <a class="font-medium underline underline-offset-4" href={routes.clients.new.href()}>
                    Tambah klien
                  </a>
                </p>,
              )
            : null}

          <section class="card" aria-labelledby="sec-client">
            <div class="card-header">
              <h2 id="sec-client" class="text-lg font-semibold">
                Klien &amp; tanggal
              </h2>
              <p class="card-description">Pilih klien yang sudah tersimpan.</p>
            </div>
            <div class="card-content grid items-start gap-5 sm:grid-cols-3">
              <div class="field sm:col-span-3">
                <label class="label" for="inv-client">
                  Klien <span class="text-destructive">*</span>
                </label>
                <div class="flex gap-2">
                  <select id="inv-client" name="clientId" class="select" required>
                    <option value="" selected={!values.clientId}>
                      Pilih klien…
                    </option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id} selected={c.id === values.clientId}>
                        {c.name} - {hasEmail(c.email) ? c.email : '(email kosong)'}
                      </option>
                    ))}
                  </select>
                  <a
                    class="btn btn-outline btn-icon shrink-0"
                    href={routes.clients.new.href()}
                    aria-label="Tambah klien baru"
                  >
                    {icon('plus')}
                  </a>
                </div>
              </div>
              <div class="field">
                <label class="label" for="inv-date">
                  Tanggal
                </label>
                <input id="inv-date" name="issueDate" type="date" class="input" value={values.issueDate} required />
              </div>
              <div class="field">
                <label class="label" for="inv-due">
                  Jatuh tempo
                </label>
                <input id="inv-due" name="dueDate" type="date" class="input" value={values.dueDate} required />
                <p class="field-description">Default +{defaultDueDays} hari dari pengaturan.</p>
              </div>
              <div class="field">
                <label class="label" for="inv-no">
                  No.
                </label>
                <input
                  id="inv-no"
                  class="input font-mono text-muted-foreground"
                  value={`(auto ${nextNumber} saat kirim)`}
                  disabled
                />
              </div>
            </div>
          </section>

          <section class="card" aria-labelledby="sec-lines">
            <div class="card-header">
              <h2 id="sec-lines" class="text-lg font-semibold">
                Line items
              </h2>
              <p class="card-description">{values.lines.length} baris · diskon dalam rupiah per baris</p>
            </div>
            <div class="card-content space-y-4">
              <div>
                <div
                  class={`hidden gap-3 border-b pb-2 text-xs font-medium text-muted-foreground md:grid ${LINE_GRID}`}
                >
                  <span>Deskripsi</span>
                  <span>Qty</span>
                  <span>Harga</span>
                  <span>Diskon</span>
                  <span class="text-right">Subtotal</span>
                  <span />
                </div>
                <div class="divide-y">
                  {values.lines.map((line, i) => (
                    <div key={i} class={`grid gap-3 py-4 md:items-center ${LINE_GRID}`}>
                      <input
                        class="input"
                        name="description"
                        aria-label={`Deskripsi baris ${i + 1}`}
                        placeholder="Deskripsi pekerjaan"
                        value={line.description}
                      />
                      <input
                        class="input text-right tabular-nums"
                        name="quantity"
                        aria-label={`Qty baris ${i + 1}`}
                        inputmode="decimal"
                        value={line.quantity}
                      />
                      <div class="input-group">
                        <span class="input-addon px-2">Rp</span>
                        <input
                          class="input text-right tabular-nums"
                          name="unitPriceIdr"
                          aria-label={`Harga baris ${i + 1}`}
                          inputmode="numeric"
                          placeholder="0"
                          value={line.unitPriceIdr}
                        />
                      </div>
                      <div class="input-group">
                        <span class="input-addon px-2">Rp</span>
                        <input
                          class="input text-right tabular-nums"
                          name="discountIdr"
                          aria-label={`Diskon baris ${i + 1}`}
                          inputmode="numeric"
                          value={line.discountIdr}
                        />
                      </div>
                      <p class="text-right text-sm font-medium tabular-nums">
                        {formatIdr(computeLineSubtotalCents(cents[i]))}
                      </p>
                      <button
                        type="submit"
                        name="intent"
                        value={`remove:${i}`}
                        formnovalidate
                        class="btn btn-ghost btn-icon btn-sm justify-self-end text-muted-foreground hover:text-destructive"
                        aria-label={`Hapus baris ${i + 1}`}
                      >
                        {icon('trash')}
                      </button>
                    </div>
                  ))}
                </div>
                <button type="submit" name="intent" value="add-line" formnovalidate class="btn btn-ghost btn-sm mt-2">
                  {icon('plus')}
                  Baris
                </button>
              </div>

              <div class="grid gap-6 border-t pt-6 md:grid-cols-2">
                <div class="space-y-2">
                  <label class="flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" class="checkbox" name="ppnEnabled" checked={values.ppnEnabled} />
                    PPN 11%
                  </label>
                  <p class="text-xs text-muted-foreground">PPN hanya kalkulator. Bukan e-Faktur DJP.</p>
                  <p class="text-xs text-muted-foreground">Dasar PPN = subtotal setelah diskon baris.</p>
                </div>
                <dl class="w-full space-y-2 text-sm md:ml-auto md:max-w-xs">
                  <div class="flex justify-between">
                    <dt class="text-muted-foreground">Subtotal</dt>
                    <dd class="tabular-nums">{formatIdr(totals.subtotalCents)}</dd>
                  </div>
                  {values.ppnEnabled ? (
                    <div class="flex justify-between">
                      <dt class="text-muted-foreground">PPN 11%</dt>
                      <dd class="tabular-nums">{formatIdr(totals.ppnCents)}</dd>
                    </div>
                  ) : null}
                  <div class="separator" />
                  <div class="flex items-baseline justify-between">
                    <dt class="font-medium">Total</dt>
                    <dd class="text-2xl font-bold tabular-nums">{formatIdr(totals.totalCents)}</dd>
                  </div>
                </dl>
              </div>
              <p class="text-xs text-muted-foreground">
                Total dihitung ulang setiap kali draft disimpan atau baris ditambah/dihapus.
              </p>
            </div>
          </section>

          <section class="card" aria-labelledby="sec-notes">
            <div class="card-header">
              <h2 id="sec-notes" class="text-lg font-semibold">
                Catatan footer
              </h2>
              <p class="card-description">Default dari footer di Pengaturan; tampil di PDF &amp; tampilan publik.</p>
            </div>
            <div class="card-content">
              <textarea name="footerNote" class="textarea" aria-label="Catatan footer" value={values.footerNote} />
            </div>
          </section>

          <div class="space-y-2">
            <div class="flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:items-center">
              <a class="btn btn-ghost" href={backHref}>
                Batal
              </a>
              <div class="flex flex-col gap-2 sm:ml-auto sm:flex-row">
                <button type="submit" name="intent" value="pdf" class="btn btn-outline">
                  {icon('download')}
                  Unduh PDF
                </button>
                <button type="submit" name="intent" value="send" class="btn btn-default">
                  {icon('send')}
                  Kirim ke klien
                </button>
              </div>
            </div>
            <p class="text-xs text-muted-foreground sm:text-right">
              Draft disimpan dulu, lalu kamu cek checklist &amp; preview email sebelum benar-benar terkirim.
            </p>
          </div>
        </form>
      </AppLayout>
    )
  }
}

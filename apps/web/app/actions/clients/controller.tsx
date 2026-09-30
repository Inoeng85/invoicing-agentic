import { createController } from 'remix/router'
import type { Handle, RemixNode } from 'remix/ui'
import type { RenderFunction } from 'remix/middleware/render'
import { redirect } from 'remix/response/redirect'
import {
  assertValidCoordinates,
  createClient,
  getClient,
  isDomainError,
  listClients,
  listInvoices,
  setClientLocation,
  updateClient,
} from '@invoicing/domain'

import { assertCsrf } from '../../lib/csrf.ts'
import { CsrfInput } from '../../lib/csrf-field.tsx'
import { requireUserId } from '../../lib/auth.ts'
import { LocationPicker } from '../public/location-picker.tsx'
import { icon } from '../../ui/icons.tsx'
import {
  alertBox,
  confirmDialog,
  daysBetween,
  formatDate,
  formatIdr,
  hasEmail,
  initials,
  pageTitle,
  statusBadge,
} from '../../ui/kit.tsx'
import { AppLayout, loadShellUser, type ShellUser } from '../../ui/layout.tsx'
import { routes } from '../../routes.ts'

const NOTICES: Record<string, string> = {
  created: 'Klien tersimpan',
  updated: 'Perubahan klien tersimpan',
  deactivated: 'Klien dinonaktifkan',
  activated: 'Klien diaktifkan kembali',
}

type Invoices = Awaited<ReturnType<typeof listInvoices>>

interface ClientStats {
  count: number
  outstandingCents: number
  paidCents: number
  overdue: boolean
  lastIssued: Date | null
  avgPayDays: number | null
}

function statsFor(clientId: string, invoices: Invoices): ClientStats {
  let own = invoices.filter((i) => i.clientId === clientId)
  let open = own.filter((i) => i.status === 'sent' || i.status === 'overdue')
  let paid = own.filter((i) => i.status === 'paid')
  let payDays = paid
    .filter((i) => i.sentAt && i.paidAt)
    .map((i) => Math.max(0, daysBetween(i.sentAt!, i.paidAt!)))
  let issued = own.filter((i) => i.status !== 'draft').map((i) => i.issueDate)
  return {
    count: own.length,
    outstandingCents: open.reduce((sum, i) => sum + i.totalCents, 0),
    paidCents: paid.reduce((sum, i) => sum + i.totalCents, 0),
    overdue: own.some((i) => i.status === 'overdue'),
    lastIssued: issued.length ? new Date(Math.max(...issued.map((d) => d.getTime()))) : null,
    avgPayDays: payDays.length ? Math.round(payDays.reduce((a, b) => a + b, 0) / payDays.length) : null,
  }
}

interface ClientValues {
  name: string
  email: string
  address: string
  notes: string
}

function readClientValues(formData: FormData): ClientValues {
  let text = (name: string) => String(formData.get(name) ?? '').trim()
  return { name: text('name'), email: text('email'), address: text('address'), notes: text('notes') }
}

function readLocation(formData: FormData): { latitude: number; longitude: number } | null {
  let lat = String(formData.get('latitude') ?? '').trim()
  let lng = String(formData.get('longitude') ?? '').trim()
  if (!lat && !lng) return null
  // A half-filled pair becomes NaN so the domain rejects it with the same message as garbage input.
  return { latitude: lat ? Number(lat) : Number.NaN, longitude: lng ? Number(lng) : Number.NaN }
}

function clientFields(values: Partial<ClientValues>, idPrefix: string) {
  return (
    <div class="grid gap-3">
      <div class="field">
        <label class="label" for={`${idPrefix}-name`}>
          Nama klien <span class="text-destructive">*</span>
        </label>
        <input
          id={`${idPrefix}-name`}
          name="name"
          class="input"
          required
          placeholder="PT Contoh Jaya"
          value={values.name ?? ''}
        />
      </div>
      <div class="field">
        <label class="label" for={`${idPrefix}-email`}>
          Email klien <span class="text-destructive">*</span>
        </label>
        <input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          class="input"
          required
          placeholder="finance@contoh.co.id"
          value={values.email ?? ''}
        />
        <p class="field-description">Tujuan kirim invoice.</p>
      </div>
      <div class="field">
        <label class="label" for={`${idPrefix}-addr`}>
          Alamat
        </label>
        <textarea id={`${idPrefix}-addr`} name="address" class="textarea min-h-16" placeholder="Alamat penagihan" value={values.address ?? ''} />
      </div>
      <div class="field">
        <label class="label" for={`${idPrefix}-note`}>
          Catatan
        </label>
        <textarea id={`${idPrefix}-note`} name="notes" class="textarea min-h-16" placeholder="Mis. PIC, termin khusus" value={values.notes ?? ''} />
      </div>
    </div>
  )
}

function setActiveForm(options: { userId: string; clientId: string; active: boolean; redirectTo: string; label: RemixNode; class: string }) {
  return (
    <form method="post" action={routes.clientSetActive.href({ clientId: options.clientId })} class="inline">
      <CsrfInput userId={options.userId} />
      <input type="hidden" name="active" value={String(options.active)} />
      <input type="hidden" name="redirectTo" value={options.redirectTo} />
      <button type="submit" class={options.class}>
        {options.label}
      </button>
    </form>
  )
}

function deactivateDialog(userId: string, client: { id: string; name: string }, redirectTo: string) {
  return confirmDialog({
    id: `dlg-deactivate-${client.id}`,
    title: 'Nonaktifkan klien?',
    description: `${client.name} disembunyikan dari editor invoice. Invoice lama tetap tersimpan.`,
    action: routes.clientSetActive.href({ clientId: client.id }),
    userId,
    confirmLabel: 'Nonaktifkan klien',
    variant: 'destructive',
    children: (
      <>
        <input type="hidden" name="active" value="false" />
        <input type="hidden" name="redirectTo" value={redirectTo} />
      </>
    ),
  })
}

function redirectWithNotice(href: string, notice: string): never {
  throw redirect(`${href}?notice=${notice}`, 303)
}

export default createController(routes.clients, {
  actions: {
    async index(context) {
      let userId = requireUserId(context.request)
      let [user, clients, invoices] = await Promise.all([
        loadShellUser(userId),
        listClients(userId, true),
        listInvoices(userId),
      ])
      let q = (context.url.searchParams.get('q') ?? '').trim()
      let view = context.url.searchParams.get('view') === 'cards' ? 'cards' : 'table'
      let needle = q.toLowerCase()
      let rows = clients.filter(
        (c) => !needle || c.name.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle),
      )
      let activeCount = clients.filter((c) => c.active).length
      let notice = NOTICES[context.url.searchParams.get('notice') ?? '']
      let indexHref = routes.clients.index.href()
      let viewHref = (next: 'table' | 'cards') => {
        let params = new URLSearchParams()
        if (q) params.set('q', q)
        if (next === 'cards') params.set('view', 'cards')
        let query = params.toString()
        return query ? `${indexHref}?${query}` : indexHref
      }
      let dialogs = rows.filter((c) => c.active).map((c) => deactivateDialog(userId, c, indexHref))

      let emailCell = (email: string) =>
        hasEmail(email) ? <span>{email}</span> : <span class="badge badge-overdue">Email kosong</span>

      return context.render(
        <AppLayout title="Klien" user={user} active="clients">
          {pageTitle(
            'Klien',
            `${activeCount} klien aktif · ${clients.length - activeCount} nonaktif · data dipakai otomatis saat membuat invoice.`,
            <button type="button" class="btn btn-default" popovertarget="dlg-client">
              {icon('plus')}
              Tambah klien
            </button>,
          )}

          {notice ? alertBox('success', notice) : null}

          <div class="flex flex-wrap items-center gap-3">
            <form method="get" action={indexHref} class="relative w-full max-w-sm">
              {view === 'cards' ? <input type="hidden" name="view" value="cards" /> : null}
              {icon(
                'search',
                'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground',
              )}
              <input
                class="input pl-9"
                type="search"
                name="q"
                value={q}
                placeholder="Cari nama/email..."
                aria-label="Cari klien"
              />
            </form>
            <nav class="tabs-list ml-auto" aria-label="Tampilan">
              <a class="tabs-trigger" href={viewHref('table')} aria-current={view === 'table' ? 'page' : undefined}>
                {icon('list')}
                Tabel
              </a>
              <a class="tabs-trigger" href={viewHref('cards')} aria-current={view === 'cards' ? 'page' : undefined}>
                {icon('layout-grid')}
                Kartu
              </a>
            </nav>
          </div>

          {view === 'table' ? (
            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th class="text-right">Invoice</th>
                    <th class="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} class={c.active ? undefined : 'text-muted-foreground'}>
                      <td>
                        <a class="font-medium hover:text-primary" href={routes.clients.show.href({ clientId: c.id })}>
                          {c.name}
                        </a>
                        {c.active ? null : <span class="badge badge-cancelled ml-2 no-underline">Nonaktif</span>}
                      </td>
                      <td>{emailCell(c.email)}</td>
                      <td class="text-right tabular-nums">{statsFor(c.id, invoices).count}</td>
                      <td class="text-right">
                        {c.active ? (
                          <>
                            <a class="btn btn-ghost btn-sm" href={routes.clients.edit.href({ clientId: c.id })}>
                              Edit
                            </a>
                            <button
                              type="button"
                              class="btn btn-ghost btn-sm text-destructive hover:text-destructive"
                              popovertarget={`dlg-deactivate-${c.id}`}
                            >
                              Nonaktifkan
                            </button>
                          </>
                        ) : (
                          setActiveForm({
                            userId,
                            clientId: c.id,
                            active: true,
                            redirectTo: indexHref,
                            label: 'Aktifkan',
                            class: 'btn btn-ghost btn-sm',
                          })
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 ? (
                <div class="border-t p-10 text-center text-sm text-muted-foreground">
                  {clients.length ? 'Tidak ada klien yang cocok.' : 'Belum ada klien. Klik "Tambah klien" untuk mulai.'}
                </div>
              ) : null}
            </div>
          ) : (
            <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
              {rows.map((c) => {
                let stats = statsFor(c.id, invoices)
                return (
                  <li key={c.id} class={`card gap-4 ${c.active ? '' : 'opacity-80'}`}>
                    <div class="card-header flex-row items-start gap-3">
                      <span class="avatar size-10 bg-primary/10 text-sm text-primary">{initials(c.name)}</span>
                      <div class="min-w-0 flex-1">
                        <a
                          class="block truncate font-semibold hover:text-primary"
                          href={routes.clients.show.href({ clientId: c.id })}
                        >
                          {c.name}
                        </a>
                        <p class="truncate text-sm text-muted-foreground">{emailCell(c.email)}</p>
                      </div>
                      {!c.active ? (
                        <span class="badge badge-cancelled no-underline">Nonaktif</span>
                      ) : stats.overdue ? (
                        <span class="badge badge-overdue">Terlambat</span>
                      ) : null}
                    </div>
                    <div class="card-content grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p class="text-xs text-muted-foreground">Belum dibayar</p>
                        <p class={`font-medium tabular-nums ${stats.overdue ? 'text-warning' : ''}`}>
                          {formatIdr(stats.outstandingCents)}
                        </p>
                      </div>
                      <div>
                        <p class="text-xs text-muted-foreground">Total invoice</p>
                        <p class="font-medium tabular-nums">{stats.count}</p>
                      </div>
                    </div>
                    <div class="card-footer border-t pt-4 text-xs text-muted-foreground [&_svg]:size-3.5">
                      {icon('clock')}
                      {stats.lastIssued ? `Terakhir ditagih ${formatDate(stats.lastIssued)}` : 'Belum pernah ditagih'}
                    </div>
                  </li>
                )
              })}
              <li>
                <button
                  type="button"
                  class="flex h-full min-h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  popovertarget="dlg-client"
                >
                  {icon('plus', 'size-5')}
                  Tambah klien
                </button>
              </li>
            </ul>
          )}

          <div id="dlg-client" popover="auto" class="dialog" aria-labelledby="dlg-client-title">
            <form method="post" action={routes.clients.create.href()} class="grid gap-5">
              <CsrfInput userId={userId} />
              <div class="dialog-header">
                <h2 id="dlg-client-title" class="dialog-title">
                  Tambah klien
                </h2>
                <p class="dialog-description">Email klien wajib untuk kirim invoice.</p>
              </div>
              {clientFields({}, 'cl')}
              <div class="dialog-footer">
                <button type="button" class="btn btn-outline" popovertarget="dlg-client" popovertargetaction="hide">
                  Batal
                </button>
                <button type="submit" class="btn btn-default">
                  Simpan
                </button>
              </div>
            </form>
          </div>
          {dialogs}
        </AppLayout>,
      )
    },

    async new(context) {
      let userId = requireUserId(context.request)
      return renderClientForm(context, await loadShellUser(userId), {})
    },

    async create(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let values = readClientValues(await context.request.formData())
      try {
        await createClient(userId, values)
      } catch (error) {
        if (!isDomainError(error)) throw error
        return renderClientForm(context, await loadShellUser(userId), { values, error: error.message })
      }
      redirectWithNotice(routes.clients.index.href(), 'created')
    },

    async show(context) {
      let userId = requireUserId(context.request)
      let [user, client, invoices] = await Promise.all([
        loadShellUser(userId),
        getClient(userId, context.params.clientId),
        listInvoices(userId),
      ])
      let history = invoices
        .filter((i) => i.clientId === client.id)
        .sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime())
      let stats = statsFor(client.id, invoices)
      let showHref = routes.clients.show.href({ clientId: client.id })
      let notice = NOTICES[context.url.searchParams.get('notice') ?? '']

      return context.render(
        <AppLayout title={client.name} user={user} active="clients">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href={routes.clients.index.href()}>Klien</a>
            {icon('chevron-right')}
            <span class="text-foreground">{client.name}</span>
          </nav>

          {notice ? alertBox('success', notice) : null}

          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <span class="avatar size-14 bg-primary/10 text-lg text-primary">{initials(client.name)}</span>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-xl font-bold">{client.name}</h1>
                  {client.active ? (
                    <span class="badge badge-paid">
                      <span class="badge-dot" />
                      Aktif
                    </span>
                  ) : (
                    <span class="badge badge-cancelled no-underline">Nonaktif</span>
                  )}
                </div>
                <p class="text-sm text-muted-foreground">
                  Klien sejak{' '}
                  {new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(client.createdAt)}
                </p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              {client.active ? (
                <>
                  <button
                    type="button"
                    class="btn btn-ghost text-destructive hover:bg-destructive/10 hover:text-destructive"
                    popovertarget={`dlg-deactivate-${client.id}`}
                  >
                    {icon('ban')}
                    Nonaktifkan klien
                  </button>
                  <a class="btn btn-outline" href={routes.clients.edit.href({ clientId: client.id })}>
                    {icon('pencil')}
                    Edit
                  </a>
                  <a class="btn btn-default" href={`${routes.invoices.new.href()}?clientId=${client.id}`}>
                    {icon('plus')}
                    Invoice untuk klien ini
                  </a>
                </>
              ) : (
                setActiveForm({
                  userId,
                  clientId: client.id,
                  active: true,
                  redirectTo: showHref,
                  label: (
                    <>
                      {icon('check')}
                      Aktifkan kembali
                    </>
                  ),
                  class: 'btn btn-outline',
                })
              )}
            </div>
          </div>

          {!hasEmail(client.email)
            ? alertBox(
                'warning',
                'Email klien wajib untuk kirim',
                <p>Draft tetap bisa dibuat, tapi tombol "Kirim ke klien" nonaktif sampai email diisi.</p>,
              )
            : null}
          {!client.active
            ? alertBox(
                'info',
                'Klien nonaktif',
                <p>Tidak muncul di pilihan klien editor. Invoice lama tetap tersimpan &amp; bisa dibuka.</p>,
              )
            : null}

          <div class="grid gap-6 lg:grid-cols-[20rem_1fr]">
            <aside class="space-y-4">
              <section class="card gap-4">
                <div class="card-header">
                  <h2 class="card-title">Kontak penagihan</h2>
                </div>
                <div class="card-content">
                  <dl class="grid gap-3 text-sm">
                    <div class="flex gap-3">
                      {icon('mail', 'mt-0.5 size-4 shrink-0 text-muted-foreground')}
                      <div>
                        <dt class="sr-only">Email</dt>
                        <dd>{hasEmail(client.email) ? client.email : '—'}</dd>
                        <p class="text-xs text-muted-foreground">Tujuan kirim invoice</p>
                      </div>
                    </div>
                    <div class="flex gap-3">
                      {icon('building', 'mt-0.5 size-4 shrink-0 text-muted-foreground')}
                      <div>
                        <dt class="sr-only">Alamat</dt>
                        <dd class="whitespace-pre-line">{client.address || '—'}</dd>
                      </div>
                    </div>
                    {client.notes ? (
                      <div class="flex gap-3">
                        {icon('file-text', 'mt-0.5 size-4 shrink-0 text-muted-foreground')}
                        <div>
                          <dt class="sr-only">Catatan</dt>
                          <dd class="whitespace-pre-line">{client.notes}</dd>
                          <p class="text-xs text-muted-foreground">Catatan internal</p>
                        </div>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </section>

              <section class="card gap-4">
                <div class="card-header">
                  <h2 class="card-title">Ringkasan</h2>
                </div>
                <div class="card-content grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p class="text-xs text-muted-foreground">Outstanding</p>
                    <p class="text-lg font-semibold tabular-nums">{formatIdr(stats.outstandingCents)}</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground">Total dibayar</p>
                    <p class="text-lg font-semibold tabular-nums">{formatIdr(stats.paidCents)}</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground">Rata-rata bayar</p>
                    <p class="font-medium">{stats.avgPayDays === null ? '—' : `${stats.avgPayDays} hari`}</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground">Invoice</p>
                    <p class="font-medium">{stats.count}</p>
                  </div>
                </div>
              </section>
            </aside>

            <section class="space-y-4" aria-labelledby="hist-title">
              <div class="flex items-center justify-between">
                <h2 id="hist-title" class="text-lg font-semibold tracking-tight">
                  Riwayat invoice
                </h2>
                <a class="btn btn-link btn-sm" href={routes.invoices.index.href()}>
                  Lihat semua invoice
                  {icon('arrow-right')}
                </a>
              </div>
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th class="text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <a
                            class={
                              inv.number
                                ? 'font-mono text-xs font-medium hover:text-primary'
                                : 'text-xs text-muted-foreground italic hover:text-primary'
                            }
                            href={routes.invoices.show.href({ invoiceId: inv.id })}
                          >
                            {inv.number ?? '(auto saat kirim)'}
                          </a>
                        </td>
                        <td>{formatDate(inv.issueDate)}</td>
                        <td>{statusBadge(inv.status)}</td>
                        <td class="text-right tabular-nums">{formatIdr(inv.totalCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {history.length === 0 ? (
                  <div class="border-t p-10 text-center text-sm text-muted-foreground">
                    Belum ada invoice untuk klien ini.
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          {client.active ? deactivateDialog(userId, client, showHref) : null}
        </AppLayout>,
      )
    },

    async edit(context) {
      let userId = requireUserId(context.request)
      let [user, client] = await Promise.all([loadShellUser(userId), getClient(userId, context.params.clientId)])
      return renderClientForm(context, user, {
        client,
        values: { name: client.name, email: hasEmail(client.email) ? client.email : '', address: client.address ?? '', notes: client.notes ?? '' },
      })
    },

    async update(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let formData = await context.request.formData()
      let values = readClientValues(formData)
      let clientId = context.params.clientId
      let error: string | undefined = values.name ? undefined : 'Nama klien wajib'
      if (!error) {
        try {
          // Validate everything before the first write so a rejected edit never persists half of itself.
          let location = readLocation(formData)
          if (location) assertValidCoordinates(location)
          await updateClient(userId, clientId, {
            name: values.name,
            email: values.email,
            address: values.address || null,
            notes: values.notes || null,
          })
          await setClientLocation(userId, clientId, location)
        } catch (caught) {
          if (!isDomainError(caught)) throw caught
          error = caught.message
        }
      }
      if (error) {
        let [user, client] = await Promise.all([loadShellUser(userId), getClient(userId, clientId)])
        return renderClientForm(context, user, { client, values, error })
      }
      redirectWithNotice(routes.clients.show.href({ clientId }), 'updated')
    },
  },
})

function renderClientForm(
  context: { render: RenderFunction },
  user: ShellUser,
  options: { client?: { id: string; name: string; latitude?: number | null; longitude?: number | null }; values?: Partial<ClientValues>; error?: string },
) {
  return context.render(
    <ClientFormPage user={user} client={options.client} values={options.values ?? {}} error={options.error} />,
    { status: options.error ? 422 : 200 },
  )
}

function ClientFormPage(
  handle: Handle<{
    user: ShellUser
    client?: { id: string; name: string; latitude?: number | null; longitude?: number | null }
    values: Partial<ClientValues>
    error?: string
  }>,
) {
  return () => {
    let { user, client, values, error } = handle.props
    let title = client ? 'Edit klien' : 'Tambah klien'
    let cancelHref = client ? routes.clients.show.href({ clientId: client.id }) : routes.clients.index.href()
    return (
      <AppLayout title={title} user={user} active="clients">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href={routes.clients.index.href()}>Klien</a>
          {icon('chevron-right')}
          {client ? (
            <>
              <a href={routes.clients.show.href({ clientId: client.id })}>{client.name}</a>
              {icon('chevron-right')}
            </>
          ) : null}
          <span class="text-foreground">{title}</span>
        </nav>

        <form
          method="post"
          action={client ? routes.clients.update.href({ clientId: client.id }) : routes.clients.create.href()}
          class="card mx-auto max-w-xl"
        >
          <CsrfInput userId={user.id} />
          {client ? <input type="hidden" name="_method" value="PUT" /> : null}
          <div class="card-header">
            <h1 class="card-title text-lg">{title}</h1>
            <p class="card-description">Email klien wajib untuk kirim invoice.</p>
          </div>
          <div class="card-content space-y-4">
            {error ? alertBox('destructive', 'Klien belum tersimpan', <p>{error}</p>) : null}
            {clientFields(values, 'cf')}
            {client ? <LocationPicker latitude={client.latitude ?? null} longitude={client.longitude ?? null} /> : null}
          </div>
          <div class="card-footer justify-end border-t pt-6">
            <a class="btn btn-outline" href={cancelHref}>
              Batal
            </a>
            <button type="submit" class="btn btn-default">
              {icon('save')}
              Simpan
            </button>
          </div>
        </form>
      </AppLayout>
    )
  }
}

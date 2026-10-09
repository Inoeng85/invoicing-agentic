import { createController } from 'remix/router'
import type { Handle } from 'remix/component'
import type { RenderFunction } from 'remix/middleware/render'
import { redirect } from 'remix/response/redirect'
import {
  createCollector,
  getCollector,
  getCollectorPhoto,
  getCollectorSummary,
  isDomainError,
  listCollectorSummaries,
  removeCollectorPhoto,
  setCollectorActive,
  setCollectorPhoto,
  updateCollector,
} from '@invoicing/domain'

import { assertCsrf } from '../../lib/csrf.ts'
import { CsrfInput } from '../../lib/csrf-field.tsx'
import { requireUserId } from '../../lib/auth.ts'
import { formatPercentInput, parsePercentInput } from '../../lib/percent.ts'
import { collectorAvatar, collectorPhotoDialog } from '../../ui/collector-avatar.tsx'
import { icon } from '../../ui/icons.tsx'
import { alertBox, formatDate, formatIdr, pageTitle, statusBadge } from '../../ui/kit.tsx'
import { AppLayout, loadShellUser, type ShellUser } from '../../ui/layout.tsx'
import { routes } from '../../routes.ts'

const NOTICES: Record<string, { variant: 'success' | 'destructive'; title: string }> = {
  created: { variant: 'success', title: 'Kolektor tersimpan' },
  updated: { variant: 'success', title: 'Perubahan kolektor tersimpan' },
  deactivated: { variant: 'success', title: 'Kolektor dinonaktifkan' },
  activated: { variant: 'success', title: 'Kolektor diaktifkan kembali' },
  has_active: {
    variant: 'destructive',
    title: 'Kolektor masih menagih invoice aktif — lepas atau ganti kolektor di invoice tersebut dulu',
  },
  photo_saved: { variant: 'success', title: 'Foto tersimpan' },
  photo_removed: { variant: 'success', title: 'Foto dihapus' },
  photo_too_large: { variant: 'destructive', title: 'Foto maksimal 1 MB' },
  photo_invalid_type: { variant: 'destructive', title: 'Format foto harus JPG, PNG, atau WebP' },
  photo_missing: { variant: 'destructive', title: 'Pilih file foto dulu' },
}

// Room for the multipart envelope around a MAX_COLLECTOR_PHOTO_BYTES file.
const MAX_PHOTO_REQUEST_BYTES = 1_100_000

type FormCollector = { id: string; name: string; photoUpdatedAt: Date | null }

interface CollectorValues {
  name: string
  email: string
  phone: string
  notes: string
  commissionPercent: string
}

function readCollectorValues(formData: FormData): CollectorValues {
  let text = (name: string) => String(formData.get(name) ?? '').trim()
  return {
    name: text('name'),
    email: text('email'),
    phone: text('phone'),
    notes: text('notes'),
    commissionPercent: text('commissionPercent'),
  }
}

function toCollectorInput(values: CollectorValues) {
  return {
    name: values.name,
    email: values.email || null,
    phone: values.phone || null,
    notes: values.notes || null,
    commissionRate: parsePercentInput(values.commissionPercent),
  }
}

function noticeAlert(key: string | null | undefined) {
  let notice = NOTICES[key ?? '']
  return notice ? alertBox(notice.variant, notice.title) : null
}

function noticeFor(url: URL) {
  return noticeAlert(url.searchParams.get('notice'))
}

function redirectWithNotice(href: string, notice: string): never {
  throw redirect(`${href}?notice=${notice}`, 303)
}

function setActiveForm(userId: string, collectorId: string, active: boolean, redirectTo: string) {
  return (
    <form method="post" action={routes.collectorActions.setActive.href({ collectorId })} class="inline">
      <CsrfInput userId={userId} />
      <input type="hidden" name="active" value={String(active)} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button type="submit" class="btn btn-ghost btn-sm">
        {active ? 'Aktifkan' : 'Nonaktifkan'}
      </button>
    </form>
  )
}

export default createController(routes.collectors, {
  actions: {
    async index(context) {
      let userId = requireUserId(context.request)
      let [user, summaries] = await Promise.all([loadShellUser(userId), listCollectorSummaries(userId)])
      let activeCount = summaries.filter((s) => s.collector.active).length
      let indexHref = routes.collectors.index.href()
      return context.render(
        <AppLayout title="Kolektor" user={user} active="collectors">
          {pageTitle(
            'Kolektor',
            `${activeCount} kolektor aktif · assign kolektor dari halaman detail invoice terkirim atau jatuh tempo.`,
            <a class="btn btn-default" href={routes.collectors.new.href()}>
              {icon('plus')}
              Tambah kolektor
            </a>,
          )}
          {noticeFor(context.url)}
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th class="hidden md:table-cell">Kontak</th>
                  <th class="text-right">Komisi</th>
                  <th class="text-right">Invoice aktif</th>
                  <th class="hidden text-right md:table-cell">Outstanding</th>
                  <th class="hidden text-right md:table-cell">Komisi diperoleh</th>
                  <th class="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map(({ collector, activeCount, activeOutstandingCents, earnedCommissionCents }) => (
                  <tr key={collector.id} class={collector.active ? undefined : 'text-muted-foreground'}>
                    <td>
                      <a class="font-medium hover:text-primary" href={routes.collectors.show.href({ collectorId: collector.id })}>
                        {collector.name}
                      </a>
                      {collector.active ? null : <span class="ml-2 text-xs">(nonaktif)</span>}
                    </td>
                    <td class="hidden text-sm md:table-cell">
                      {[collector.email, collector.phone].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td class="text-right tabular-nums">{formatPercentInput(collector.commissionRate)}%</td>
                    <td class="text-right tabular-nums">{activeCount}</td>
                    <td class="hidden text-right tabular-nums md:table-cell">{formatIdr(activeOutstandingCents)}</td>
                    <td class="hidden text-right tabular-nums md:table-cell">{formatIdr(earnedCommissionCents)}</td>
                    <td class="text-right">
                      <a class="btn btn-ghost btn-sm" href={routes.collectors.edit.href({ collectorId: collector.id })}>
                        Edit
                      </a>
                      {setActiveForm(userId, collector.id, !collector.active, indexHref)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {summaries.length === 0 ? (
              <div class="border-t p-10 text-center text-sm text-muted-foreground">
                Belum ada kolektor. Tambahkan kolektor untuk mulai menugaskan penagihan.
              </div>
            ) : null}
          </div>
        </AppLayout>,
      )
    },

    async new(context) {
      let userId = requireUserId(context.request)
      return renderCollectorForm(context, await loadShellUser(userId), { values: { commissionPercent: '0' } })
    },

    async create(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let values = readCollectorValues(await context.request.formData())
      let collectorId: string
      try {
        collectorId = (await createCollector(userId, toCollectorInput(values))).id
      } catch (error) {
        if (!isDomainError(error)) throw error
        return renderCollectorForm(context, await loadShellUser(userId), { values, error: error.message })
      }
      redirectWithNotice(routes.collectors.show.href({ collectorId }), 'created')
    },

    async show(context) {
      let userId = requireUserId(context.request)
      let [user, summary] = await Promise.all([
        loadShellUser(userId),
        getCollectorSummary(userId, context.params.collectorId),
      ])
      let { collector } = summary
      let showHref = routes.collectors.show.href({ collectorId: collector.id })
      return context.render(
        <AppLayout title={collector.name} user={user} active="collectors">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href={routes.collectors.index.href()}>Kolektor</a>
            {icon('chevron-right')}
            <span class="text-foreground">{collector.name}</span>
          </nav>
          {pageTitle(
            collector.name,
            `Komisi ${formatPercentInput(collector.commissionRate)}% · ${collector.active ? 'aktif' : 'nonaktif'}`,
            <>
              <a class="btn btn-outline" href={routes.collectors.edit.href({ collectorId: collector.id })}>
                {icon('pencil')}
                Edit
              </a>
              {setActiveForm(userId, collector.id, !collector.active, showHref)}
            </>,
          )}
          {noticeFor(context.url)}
          <section class="grid gap-4 sm:grid-cols-3" aria-label="Ringkasan">
            <div class="rounded-xl border bg-card p-4">
              <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Invoice aktif</p>
              <p class="mt-1 text-2xl font-bold tabular-nums">{summary.activeCount}</p>
            </div>
            <div class="rounded-xl border bg-card p-4">
              <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Outstanding ditagih</p>
              <p class="mt-1 text-2xl font-bold tabular-nums">{formatIdr(summary.activeOutstandingCents)}</p>
            </div>
            <div class="rounded-xl border bg-card p-4">
              <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Komisi diperoleh</p>
              <p class="mt-1 text-2xl font-bold text-success tabular-nums">{formatIdr(summary.earnedCommissionCents)}</p>
            </div>
          </section>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Klien</th>
                  <th class="text-right">Jumlah</th>
                  <th>Status</th>
                  <th class="hidden md:table-cell">Sejak</th>
                </tr>
              </thead>
              <tbody>
                {summary.activeAssignments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <a class="font-mono text-xs font-medium hover:text-primary" href={routes.invoices.show.href({ invoiceId: a.invoiceId })}>
                        {a.invoice.number ?? 'draft'}
                      </a>
                    </td>
                    <td>{a.invoice.client.name}</td>
                    <td class="text-right tabular-nums">{formatIdr(a.invoice.totalCents)}</td>
                    <td>{statusBadge(a.invoice.status)}</td>
                    <td class="hidden md:table-cell">{formatDate(a.assignedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {summary.activeAssignments.length === 0 ? (
              <div class="border-t p-10 text-center text-sm text-muted-foreground">
                Tidak ada invoice yang sedang ditagih kolektor ini.
              </div>
            ) : null}
          </div>
        </AppLayout>,
      )
    },

    async edit(context) {
      let userId = requireUserId(context.request)
      let [user, collector] = await Promise.all([loadShellUser(userId), getCollector(userId, context.params.collectorId)])
      return renderCollectorForm(context, user, {
        collector,
        notice: context.url.searchParams.get('notice'),
        values: {
          name: collector.name,
          email: collector.email ?? '',
          phone: collector.phone ?? '',
          notes: collector.notes ?? '',
          commissionPercent: formatPercentInput(collector.commissionRate),
        },
      })
    },

    async update(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let values = readCollectorValues(await context.request.formData())
      let collectorId = context.params.collectorId
      try {
        await updateCollector(userId, collectorId, toCollectorInput(values))
      } catch (error) {
        if (!isDomainError(error)) throw error
        let [user, collector] = await Promise.all([loadShellUser(userId), getCollector(userId, collectorId)])
        return renderCollectorForm(context, user, { collector, values, error: error.message })
      }
      redirectWithNotice(routes.collectors.show.href({ collectorId }), 'updated')
    },
  },
})

export const collectorActionsController = createController(routes.collectorActions, {
  actions: {
    async setActive(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let formData = await context.request.formData()
      let active = formData.get('active') === 'true'
      let back = formData.get('redirectTo')
      let target =
        typeof back === 'string' && back.startsWith('/') && !back.startsWith('//')
          ? back
          : routes.collectors.index.href()
      try {
        await setCollectorActive(userId, context.params.collectorId, active)
      } catch (error) {
        if (isDomainError(error) && error.code === 'collector_has_active_assignments') {
          redirectWithNotice(target, 'has_active')
        }
        throw error
      }
      redirectWithNotice(target, active ? 'activated' : 'deactivated')
    },

    async photo(context) {
      let userId = requireUserId(context.request)
      try {
        let photo = await getCollectorPhoto(userId, context.params.collectorId)
        return new Response(Buffer.from(photo.bytes), {
          headers: {
            'Content-Type': photo.mimeType,
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'private, max-age=86400',
          },
        })
      } catch (error) {
        if (isDomainError(error) && error.status === 404) return new Response('Not Found', { status: 404 })
        throw error
      }
    },

    async uploadPhoto(context) {
      let userId = requireUserId(context.request)
      let collectorId = context.params.collectorId
      let editHref = routes.collectors.edit.href({ collectorId })
      // Checked before any body parsing so an oversized upload is never buffered.
      let length = Number(context.request.headers.get('Content-Length'))
      if (!length || length > MAX_PHOTO_REQUEST_BYTES) redirectWithNotice(editHref, 'photo_too_large')
      await assertCsrf(context.request, userId)
      let file = (await context.request.formData()).get('photo')
      if (!(file instanceof File) || file.size === 0) redirectWithNotice(editHref, 'photo_missing')
      try {
        await setCollectorPhoto(userId, collectorId, new Uint8Array(await file.arrayBuffer()))
      } catch (error) {
        if (!isDomainError(error)) throw error
        redirectWithNotice(editHref, error.code)
      }
      redirectWithNotice(editHref, 'photo_saved')
    },

    async deletePhoto(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let collectorId = context.params.collectorId
      await removeCollectorPhoto(userId, collectorId)
      redirectWithNotice(routes.collectors.edit.href({ collectorId }), 'photo_removed')
    },
  },
})

function renderCollectorForm(
  context: { render: RenderFunction },
  user: ShellUser,
  options: {
    collector?: FormCollector
    values?: Partial<CollectorValues>
    error?: string
    notice?: string | null
  },
) {
  return context.render(
    <CollectorFormPage
      user={user}
      collector={options.collector}
      values={options.values ?? {}}
      error={options.error}
      notice={options.notice}
    />,
    { status: options.error ? 422 : 200 },
  )
}

function CollectorFormPage(
  handle: Handle<{
    user: ShellUser
    collector?: FormCollector
    values: Partial<CollectorValues>
    error?: string
    notice?: string | null
  }>,
) {
  return () => {
    let { user, collector, values, error, notice } = handle.props
    let title = collector ? 'Edit kolektor' : 'Tambah kolektor'
    let cancelHref = collector
      ? routes.collectors.show.href({ collectorId: collector.id })
      : routes.collectors.index.href()
    return (
      <AppLayout title={title} user={user} active="collectors">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href={routes.collectors.index.href()}>Kolektor</a>
          {icon('chevron-right')}
          <span class="text-foreground">{title}</span>
        </nav>
        {noticeAlert(notice)}
        {collector ? (
          <section class="card mx-auto max-w-xl" aria-labelledby="col-photo-title">
            <div class="card-header">
              <h2 id="col-photo-title" class="card-title">
                Foto
              </h2>
              <p class="card-description">JPG, PNG, atau WebP · maksimal 1 MB. Tampil di panel Penagihan invoice.</p>
            </div>
            <div class="card-content flex flex-wrap items-center gap-4">
              {collectorAvatar(collector, 'size-16', { preview: true })}
              {collectorPhotoDialog(collector)}
              <form
                method="post"
                action={routes.collectorActions.uploadPhoto.href({ collectorId: collector.id })}
                enctype="multipart/form-data"
                class="flex flex-wrap items-center gap-2"
              >
                <CsrfInput userId={user.id} />
                <input
                  class="input"
                  type="file"
                  name="photo"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  aria-label="File foto"
                />
                <button type="submit" class="btn btn-outline btn-sm">
                  Unggah
                </button>
              </form>
              {collector.photoUpdatedAt ? (
                <form method="post" action={routes.collectorActions.deletePhoto.href({ collectorId: collector.id })}>
                  <CsrfInput userId={user.id} />
                  <button type="submit" class="btn btn-ghost btn-sm text-destructive">
                    Hapus foto
                  </button>
                </form>
              ) : null}
            </div>
          </section>
        ) : null}
        <form
          method="post"
          action={collector ? routes.collectors.update.href({ collectorId: collector.id }) : routes.collectors.create.href()}
          class="card mx-auto max-w-xl"
        >
          <CsrfInput userId={user.id} />
          {collector ? <input type="hidden" name="_method" value="PUT" /> : null}
          <div class="card-header">
            <h1 class="card-title text-lg">{title}</h1>
            <p class="card-description">Kolektor tidak mendapat akses aplikasi — data ini hanya untuk catatan kamu.</p>
          </div>
          <div class="card-content space-y-4">
            {error ? alertBox('destructive', 'Kolektor belum tersimpan', <p>{error}</p>) : null}
            <div class="field">
              <label class="label" for="col-name">
                Nama <span class="text-destructive">*</span>
              </label>
              <input id="col-name" name="name" class="input" required value={values.name ?? ''} />
            </div>
            <div class="field">
              <label class="label" for="col-email">Email</label>
              <input id="col-email" name="email" type="email" class="input" value={values.email ?? ''} />
            </div>
            <div class="field">
              <label class="label" for="col-phone">Telepon</label>
              <input id="col-phone" name="phone" type="tel" class="input" value={values.phone ?? ''} />
            </div>
            <div class="field">
              <label class="label" for="col-rate">
                Komisi default (%) <span class="text-destructive">*</span>
              </label>
              <input
                id="col-rate"
                name="commissionPercent"
                class="input"
                inputmode="decimal"
                required
                value={values.commissionPercent ?? '0'}
              />
              <p class="field-description">Dari total invoice (termasuk PPN). Terkunci per invoice saat di-assign.</p>
            </div>
            <div class="field">
              <label class="label" for="col-notes">Catatan</label>
              <textarea id="col-notes" name="notes" class="textarea min-h-16" value={values.notes ?? ''} />
            </div>
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

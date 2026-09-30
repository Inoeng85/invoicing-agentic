import { createController } from 'remix/router'
import type { RenderFunction } from 'remix/middleware/render'
import { redirect } from 'remix/response/redirect'
import { getUserById, isDomainError, listInvoices, updateBusinessProfile } from '@invoicing/domain'

import { assertCsrf } from '../../lib/csrf.ts'
import { CsrfInput } from '../../lib/csrf-field.tsx'
import { requireUserId } from '../../lib/auth.ts'
import { icon } from '../../ui/icons.tsx'
import { alertBox, initials, nextInvoiceNumber, pageTitle } from '../../ui/kit.tsx'
import { AppLayout, loadShellUser } from '../../ui/layout.tsx'
import { routes } from '../../routes.ts'

interface SettingsValues {
  legalName: string
  npwp: string
  address: string
  bankDetails: string
  footerDefault: string
  defaultDueDays: string
}

function readValues(formData: FormData): SettingsValues {
  let text = (name: string) => String(formData.get(name) ?? '').trim()
  return {
    legalName: text('legalName'),
    npwp: text('npwp'),
    address: text('address'),
    bankDetails: text('bankDetails'),
    footerDefault: text('footerDefault'),
    defaultDueDays: text('defaultDueDays'),
  }
}

async function renderSettings(
  context: { url: URL; render: RenderFunction },
  userId: string,
  options: { values?: SettingsValues; error?: string } = {},
) {
  let [user, account, invoices] = await Promise.all([loadShellUser(userId), getUserById(userId), listInvoices(userId)])
  let profile = account?.profile
  let values: SettingsValues = options.values ?? {
    legalName: profile?.legalName ?? '',
    npwp: profile?.npwp ?? '',
    address: profile?.address ?? '',
    bankDetails: profile?.bankDetails ?? '',
    footerDefault: profile?.footerDefault ?? '',
    defaultDueDays: String(profile?.defaultDueDays ?? 30),
  }
  let saved = context.url.searchParams.get('saved') === '1'
  let profileIncomplete = !profile?.bankDetails || !profile?.address

  return context.render(
    <AppLayout title="Pengaturan" user={user} active="settings">
      <form method="post" action={routes.settings.action.href()} class="space-y-8">
        <CsrfInput userId={userId} />
        {pageTitle(
          'Pengaturan',
          'Profil bisnis tampil di kop invoice, PDF, dan tampilan publik.',
          <nav class="flex gap-1" aria-label="Bagian pengaturan">
            <a class="nav-link" href="#profil">
              Profil bisnis
            </a>
            <a class="nav-link" href="#invoice">
              Invoice
            </a>
            <a class="nav-link" href="#akun">
              Akun
            </a>
          </nav>,
        )}

        {saved ? alertBox('success', 'Pengaturan tersimpan') : null}
        {options.error ? alertBox('destructive', 'Pengaturan belum tersimpan', <p>{options.error}</p>) : null}

        <section id="profil" class="card scroll-mt-20" aria-labelledby="h-profil">
          <div class="card-header">
            <h2 id="h-profil" class="text-lg font-semibold">
              Profil bisnis
            </h2>
            <p class="card-description">
              {profileIncomplete
                ? 'Lengkapi alamat & rekening sebelum invoice pertama dikirim.'
                : 'Wajib diisi sebelum invoice pertama dikirim.'}
            </p>
          </div>
          <div class="card-content grid gap-5">
            <div class="grid items-start gap-5 sm:grid-cols-2">
              <div class="field">
                <label class="label" for="s-legal">
                  Nama legal <span class="text-destructive">*</span>
                </label>
                <input id="s-legal" name="legalName" class="input" required value={values.legalName} />
              </div>
              <div class="field">
                <label class="label" for="s-npwp">
                  NPWP <span class="font-normal text-muted-foreground">(opsional)</span>
                </label>
                <input
                  id="s-npwp"
                  name="npwp"
                  class="input font-mono"
                  placeholder="00.000.000.0-000.000"
                  value={values.npwp}
                />
              </div>
            </div>
            <div class="field">
              <label class="label" for="s-addr">
                Alamat
              </label>
              <textarea id="s-addr" name="address" class="textarea min-h-16" value={values.address} />
            </div>
            <div class="field">
              <span class="label">Logo</span>
              <div class="flex items-center gap-4">
                <span
                  class="grid size-14 place-items-center rounded-xl bg-primary/10 text-lg font-semibold text-primary"
                  aria-label="Preview logo"
                >
                  {initials(values.legalName || user.legalName)}
                </span>
                <span class="text-xs text-muted-foreground">Inisial nama legal dipakai sebagai logo di invoice.</span>
              </div>
            </div>
            <div class="field">
              <label class="label" for="s-bank">
                Rekening bank
              </label>
              <input
                id="s-bank"
                name="bankDetails"
                class="input"
                placeholder="BCA 123-456-7890 a/n Nama"
                value={values.bankDetails}
              />
            </div>
            <div class="field">
              <label class="label" for="s-footer">
                Footer default
              </label>
              <textarea id="s-footer" name="footerDefault" class="textarea min-h-16" value={values.footerDefault} />
              <p class="field-description">Muncul sebagai catatan footer di setiap invoice baru.</p>
            </div>
          </div>
        </section>

        <section id="invoice" class="card scroll-mt-20" aria-labelledby="h-invoice">
          <div class="card-header">
            <h2 id="h-invoice" class="text-lg font-semibold">
              Invoice
            </h2>
            <p class="card-description">Default untuk invoice baru; bisa diubah per invoice.</p>
          </div>
          <div class="card-content grid items-start gap-5 sm:grid-cols-2">
            <div class="field">
              <label class="label" for="s-format">
                Format nomor
              </label>
              <input id="s-format" class="input font-mono" value="INV-{YYYY}-{SEQ}" disabled />
              <p class="field-description">
                Berikutnya: <span class="font-mono">{nextInvoiceNumber(invoices.map((i) => i.number))}</span> ·
                dikunci saat kirim.
              </p>
            </div>
            <div class="field">
              <label class="label" for="s-due">
                Default due
              </label>
              <div class="input-group">
                <input
                  id="s-due"
                  name="defaultDueDays"
                  class="input text-right tabular-nums"
                  inputmode="numeric"
                  value={values.defaultDueDays}
                />
                <span class="input-addon">hari</span>
              </div>
            </div>
            <p class="text-xs text-muted-foreground sm:col-span-2">
              PPN 11% diaktifkan per invoice di editor. PPN hanya kalkulator. Bukan e-Faktur DJP.
            </p>
          </div>
        </section>

        <section id="akun" class="card scroll-mt-20" aria-labelledby="h-akun">
          <div class="card-header">
            <h2 id="h-akun" class="text-lg font-semibold">
              Akun
            </h2>
          </div>
          <div class="card-content grid gap-5">
            <div class="field max-w-md">
              <label class="label" for="s-email">
                Email
              </label>
              <input id="s-email" type="email" class="input" value={user.email} disabled />
              <p class="field-description">Dipakai untuk login dan sebagai alamat balasan email invoice.</p>
            </div>
          </div>
          <div class="card-footer border-t pt-6 text-sm text-muted-foreground">
            Data akun dan klien diproses sesuai UU PDP.
          </div>
        </section>

        <div class="flex justify-end gap-2">
          <a class="btn btn-outline" href={routes.settings.index.href()}>
            Batal
          </a>
          <button type="submit" class="btn btn-default">
            {icon('save')}
            Simpan perubahan
          </button>
        </div>
      </form>
    </AppLayout>,
    { status: options.error ? 422 : 200 },
  )
}

export default createController(routes.settings, {
  actions: {
    async index(context) {
      let userId = requireUserId(context.request)
      return renderSettings(context, userId)
    },

    async action(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let values = readValues(await context.request.formData())
      let dueDays = Number(values.defaultDueDays)
      if (!Number.isInteger(dueDays) || dueDays < 0 || dueDays > 365) {
        return renderSettings(context, userId, { values, error: 'Default due harus angka 0–365 hari.' })
      }
      try {
        await updateBusinessProfile(userId, {
          legalName: values.legalName,
          address: values.address || null,
          npwp: values.npwp || null,
          bankDetails: values.bankDetails || null,
          footerDefault: values.footerDefault || null,
          defaultDueDays: dueDays,
        })
      } catch (error) {
        if (!isDomainError(error)) throw error
        return renderSettings(context, userId, { values, error: error.message })
      }
      throw redirect(`${routes.settings.index.href()}?saved=1`, 303)
    },
  },
})

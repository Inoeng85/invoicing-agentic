import { createController } from 'remix/router'
import { redirect } from 'remix/response/redirect'
import { getUserById, updateBusinessProfile } from '@invoicing/domain'

import { assertCsrf } from '../../lib/csrf.ts'
import { CsrfInput } from '../../lib/csrf-field.tsx'
import { requireUserId } from '../../lib/auth.ts'
import { AppLayout } from '../../ui/layout.tsx'
import { routes } from '../../routes.ts'

export default createController(routes.settings, {
  actions: {
    async index(context) {
      let userId = requireUserId(context.request)
      let user = await getUserById(userId)
      let profile = user?.profile
      return context.render(
        <AppLayout title="Pengaturan" userEmail={user?.email}>
          <form method="post" action={routes.settings.action.href()} class="max-w-lg space-y-3 rounded-xl border bg-white p-6">
            <CsrfInput userId={userId} />
            <h2 class="text-lg font-semibold">Profil bisnis</h2>
            <label class="block text-sm">
              Nama legal
              <input
                name="legalName"
                required
                defaultValue={profile?.legalName ?? ''}
                class="mt-1 w-full rounded border px-3 py-2"
              />
            </label>
            <label class="block text-sm">
              Alamat
              <textarea name="address" defaultValue={profile?.address ?? ''} class="mt-1 w-full rounded border px-3 py-2" />
            </label>
            <label class="block text-sm">
              NPWP
              <input name="npwp" defaultValue={profile?.npwp ?? ''} class="mt-1 w-full rounded border px-3 py-2" />
            </label>
            <label class="block text-sm">
              Rekening
              <textarea name="bankDetails" defaultValue={profile?.bankDetails ?? ''} class="mt-1 w-full rounded border px-3 py-2" />
            </label>
            <label class="block text-sm">
              Footer default
              <textarea name="footerDefault" defaultValue={profile?.footerDefault ?? ''} class="mt-1 w-full rounded border px-3 py-2" />
            </label>
            <button type="submit" class="rounded bg-blue-600 px-4 py-2 text-sm text-white">
              Simpan
            </button>
          </form>
        </AppLayout>,
      )
    },

    async action(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let formData = await context.request.formData()
      await updateBusinessProfile(userId, {
        legalName: String(formData.get('legalName') ?? ''),
        address: String(formData.get('address') ?? '') || null,
        npwp: String(formData.get('npwp') ?? '') || null,
        bankDetails: String(formData.get('bankDetails') ?? '') || null,
        footerDefault: String(formData.get('footerDefault') ?? '') || null,
      })
      throw redirect(routes.settings.index.href(), 303)
    },
  },
})

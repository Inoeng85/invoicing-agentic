import { createController } from 'remix/router'
import type { Handle } from 'remix/ui'
import { redirect } from 'remix/response/redirect'
import { createClient, getClient, getUserById, listClients, updateClient } from '@invoicing/domain'
import { assertCsrf } from '../../lib/csrf.ts'
import { CsrfInput } from '../../lib/csrf-field.tsx'
import { requireUserId } from '../../lib/auth.ts'
import { AppLayout } from '../../ui/layout.tsx'
import { routes } from '../../routes.ts'

export default createController(routes.clients, {
  actions: {
    async index(context) {
      let userId = requireUserId(context.request)
      let user = await getUserById(userId)
      let clients = await listClients(userId, true)
      return context.render(
        <AppLayout title="Klien" userEmail={user?.email}>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Daftar klien</h2>
            <a href={routes.clients.new.href()} class="rounded bg-blue-600 px-3 py-2 text-sm text-white">
              Tambah klien
            </a>
          </div>
          <ul class="mt-4 divide-y rounded-xl border bg-white">
            {clients.map((c) => (
              <li key={c.id} class="flex items-center justify-between px-4 py-3">
                <div>
                  <a href={routes.clients.show.href({ clientId: c.id })} class="font-medium text-blue-700">
                    {c.name}
                  </a>
                  <p class="text-sm text-slate-500">{c.email}</p>
                </div>
                {!c.active ? <span class="text-xs text-slate-400">Nonaktif</span> : null}
              </li>
            ))}
          </ul>
        </AppLayout>,
      )
    },

    new(context) {
      let userId = requireUserId(context.request)
      return context.render(
        <ClientForm title="Klien baru" action={routes.clients.create.href()} userId={userId} />,
      )
    },

    async create(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let formData = await context.request.formData()
      await createClient(userId, {
        name: String(formData.get('name') ?? ''),
        email: String(formData.get('email') ?? ''),
        address: String(formData.get('address') ?? ''),
        notes: String(formData.get('notes') ?? ''),
      })
      throw redirect(routes.clients.index.href(), 303)
    },

    async show(context) {
      let userId = requireUserId(context.request)
      let client = await getClient(userId, context.params.clientId)
      return context.render(
        <AppLayout title={client.name}>
          <div class="rounded-xl border bg-white p-6">
            <h2 class="text-lg font-semibold">{client.name}</h2>
            <p class="text-sm text-slate-600">{client.email}</p>
            {client.address ? <p class="mt-2 text-sm">{client.address}</p> : null}
            <a
              href={routes.clients.edit.href({ clientId: client.id })}
              class="mt-4 inline-block text-sm text-blue-600"
            >
              Edit
            </a>
          </div>
        </AppLayout>,
      )
    },

    edit(context) {
      let userId = requireUserId(context.request)
      return context.render(
        <ClientForm
          title="Edit klien"
          action={routes.clients.update.href({ clientId: context.params.clientId })}
          userId={userId}
        />,
      )
    },

    async update(context) {
      let userId = requireUserId(context.request)
      await assertCsrf(context.request, userId)
      let formData = await context.request.formData()
      await updateClient(userId, context.params.clientId, {
        name: String(formData.get('name') ?? ''),
        email: String(formData.get('email') ?? ''),
        address: String(formData.get('address') ?? '') || null,
        notes: String(formData.get('notes') ?? '') || null,
        active: formData.get('active') === 'on',
      })
      throw redirect(routes.clients.show.href({ clientId: context.params.clientId }), 303)
    },
  },
})

function ClientForm(handle: Handle<{ title: string; action: string; userId: string }>) {
  return () => {
    let { title, action, userId } = handle.props
    return (
      <AppLayout title={title}>
        <form method="post" action={action} class="max-w-lg space-y-3 rounded-xl border bg-white p-6">
          <CsrfInput userId={userId} />
          <h2 class="text-lg font-semibold">{title}</h2>
        <label class="block text-sm">
          Nama
          <input name="name" required class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label class="block text-sm">
          Email
          <input name="email" type="email" required class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label class="block text-sm">
          Alamat
          <textarea name="address" class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label class="block text-sm">
          Catatan
          <textarea name="notes" class="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <button type="submit" class="rounded bg-blue-600 px-4 py-2 text-sm text-white">
          Simpan
        </button>
        </form>
      </AppLayout>
    )
  }
}

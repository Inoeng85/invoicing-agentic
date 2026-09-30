import { createController } from 'remix/router'
import { getTrackingSession, isDomainError, recordCollectorLocation } from '@invoicing/domain'
import { rateLimitKey } from '@invoicing/platform'

import { APP_NAME } from '../../lib/brand.ts'
import { Document } from '../document.tsx'
import { TrackingMap } from '../public/tracking-map.tsx'
import { TrackingSharer } from '../public/tracking-sharer.tsx'
import { routes } from '../../routes.ts'

const MAX_LOCATION_BODY_BYTES = 1024
const noindex = <meta name="robots" content="noindex, nofollow" />

function json(status: number, body?: unknown): Response {
  return body === undefined
    ? new Response(null, { status })
    : new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

export default createController(routes.collectorTracking, {
  actions: {
    async page(context) {
      let token = context.params.token
      let session
      try {
        session = await getTrackingSession(token)
      } catch (error) {
        if (!isDomainError(error)) throw error
        return context.render(
          <Document title={`Link tidak aktif — ${APP_NAME}`} head={noindex}>
            <main class="mx-auto max-w-md space-y-2 p-6 text-center">
              <h1 class="text-lg font-semibold">Link tracking tidak aktif</h1>
              <p class="text-sm text-muted-foreground">Penugasan sudah selesai atau link sudah diganti. Hubungi pemberi tugas.</p>
            </main>
          </Document>,
          { status: 404 },
        )
      }
      let { client } = session
      return context.render(
        <Document title={`Menuju ${client.name} — ${APP_NAME}`} head={noindex}>
          <main class="mx-auto max-w-md space-y-4 p-4">
            <header class="space-y-1">
              <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Tujuan penagihan</p>
              <h1 class="text-lg font-semibold">{client.name}</h1>
              {client.address ? <p class="text-sm text-muted-foreground">{client.address}</p> : null}
            </header>
            {client.latitude !== null && client.longitude !== null ? (
              <TrackingMap
                initial={{ client, collector: null, last: null, trail: [], distanceToClientM: null }}
                dataUrl={null}
                pollMs={0}
                heightClass="h-64"
                showStatus={false}
              />
            ) : null}
            <section class="card gap-3 p-4">
              <p class="text-sm">
                Halo {session.collectorName}. Dengan menekan tombol di bawah, lokasi HP kamu akan dibagikan ke{' '}
                <strong>{session.freelancerName}</strong> selama halaman ini terbuka, untuk memantau perjalanan
                penagihan ini. Data lokasi dihapus saat penugasan selesai.
              </p>
              <TrackingSharer locationUrl={routes.collectorTracking.location.href({ token })} minIntervalMs={30_000} minDistanceM={50} />
            </section>
          </main>
        </Document>,
      )
    },

    async location(context) {
      let token = context.params.token
      if (!rateLimitKey(`tracking:${token}`, 12, 60_000)) return json(429, { error: 'rate_limit' })
      let length = Number(context.request.headers.get('Content-Length'))
      if (!length || length > MAX_LOCATION_BODY_BYTES) return json(413, { error: 'too_large' })
      let body: { latitude?: unknown; longitude?: unknown; accuracyM?: unknown; recordedAt?: unknown }
      try {
        body = (await context.request.json()) as typeof body
      } catch {
        return json(400, { error: 'invalid_json' })
      }
      try {
        await recordCollectorLocation(token, {
          latitude: Number(body.latitude),
          longitude: Number(body.longitude),
          accuracyM: body.accuracyM === undefined || body.accuracyM === null ? null : Number(body.accuracyM),
          recordedAt: new Date(String(body.recordedAt)),
        })
      } catch (error) {
        if (!isDomainError(error)) throw error
        return json(error.status, { error: error.code })
      }
      return json(204)
    },
  },
})

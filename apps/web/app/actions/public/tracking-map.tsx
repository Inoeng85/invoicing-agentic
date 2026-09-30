import { clientEntry, ref, type Handle } from 'remix/ui'

import { loadLeaflet, OSM_ATTRIBUTION, OSM_TILES, textElement } from './leaflet.ts'

export interface TrackingMapData {
  client: { name: string; latitude: number | null; longitude: number | null }
  collector: { name: string; photoUrl: string | null } | null
  last: { latitude: number; longitude: number; at: string } | null
  trail: Array<{ latitude: number; longitude: number }>
  distanceToClientM: number | null
}

export interface TrackingMapProps {
  initial: TrackingMapData
  dataUrl: string | null
  pollMs: number
  heightClass: string
  showStatus: boolean
}

const INDONESIA: [number, number] = [-2.5, 118]

function ago(iso: string): string {
  let minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  return minutes === 0 ? 'baru saja' : `${minutes} menit lalu`
}

function statusText(data: TrackingMapData): string {
  if (!data.last) return 'Kolektor belum mulai berbagi lokasi.'
  let parts = [`Diperbarui ${ago(data.last.at)}`]
  if (data.distanceToClientM !== null) parts.push(`±${(data.distanceToClientM / 1000).toFixed(1)} km ke rumah klien (garis lurus)`)
  return parts.join(' · ')
}

export const TrackingMap = clientEntry(import.meta.url, function TrackingMap(handle: Handle<TrackingMapProps>) {
  let data = handle.props.initial
  let failed = false

  async function mount(node: HTMLElement, signal: AbortSignal) {
    let L = await loadLeaflet()
    if (signal.aborted) return
    let map = L.map(node)
    L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map)
    let layer = L.layerGroup().addTo(map)
    let fitted = false

    let draw = () => {
      layer.clearLayers()
      let points: Array<[number, number]> = []
      let { client, last, trail, collector } = data
      if (client.latitude !== null && client.longitude !== null) {
        let home: [number, number] = [client.latitude, client.longitude]
        L.circleMarker(home, { radius: 9, color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.9 })
          .bindTooltip(textElement(`Rumah ${client.name}`), { permanent: true, direction: 'top' })
          .addTo(layer)
        points.push(home)
      }
      if (trail.length > 1) {
        L.polyline(trail.map((p) => [p.latitude, p.longitude] as [number, number]), { color: '#2563eb', weight: 3, opacity: 0.6 }).addTo(layer)
      }
      if (last) {
        let here: [number, number] = [last.latitude, last.longitude]
        let marker = collector?.photoUrl
          ? L.marker(here, {
              icon: L.divIcon({
                className: '',
                iconSize: [36, 36],
                html: `<img src="${encodeURI(collector.photoUrl)}" alt="" style="width:36px;height:36px;border-radius:9999px;object-fit:cover;border:3px solid #2563eb" />`,
              }),
            })
          : L.circleMarker(here, { radius: 10, color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.9 })
        marker.bindTooltip(textElement(collector?.name ?? 'Kolektor'), { direction: 'top' }).addTo(layer)
        points.push(here)
      }
      if (!fitted) {
        if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 })
        else map.setView(INDONESIA, 5)
        fitted = true
      }
    }
    draw()

    let { dataUrl, pollMs } = handle.props
    if (!dataUrl) return
    let timer = setInterval(async () => {
      try {
        let response = await fetch(dataUrl, { signal, headers: { Accept: 'application/json' } })
        if (!response.ok) throw new Error(String(response.status))
        data = (await response.json()) as TrackingMapData
        failed = false
        draw()
      } catch {
        if (signal.aborted) return
        failed = true
      }
      handle.update()
    }, pollMs)
    signal.addEventListener('abort', () => {
      clearInterval(timer)
      map.remove()
    })
  }

  return () => (
    <div class="space-y-2">
      <div
        class={`${handle.props.heightClass} w-full overflow-hidden rounded-xl border`}
        mix={[ref((node, signal) => void mount(node as HTMLElement, signal))]}
      />
      {handle.props.showStatus ? (
        <p class="text-sm text-muted-foreground" aria-live="polite">
          {statusText(data)}
          {failed ? ' · gagal memperbarui, mencoba lagi…' : ''}
        </p>
      ) : null}
    </div>
  )
})

import { clientEntry, on, type Handle } from 'remix/ui'

type SharerState = 'idle' | 'sharing' | 'stopped' | 'denied' | 'unavailable' | 'ended'

interface TrackingSharerProps {
  locationUrl: string
  minIntervalMs: number
  minDistanceM: number
}

// Equirectangular approximation — plenty for a "moved more than ~50 m" throttle.
function roughDistanceM(a: GeolocationCoordinates, b: GeolocationCoordinates): number {
  let rad = Math.PI / 180
  let x = (b.longitude - a.longitude) * rad * Math.cos(((a.latitude + b.latitude) / 2) * rad)
  let y = (b.latitude - a.latitude) * rad
  return Math.sqrt(x * x + y * y) * 6_371_000
}

const MESSAGES: Record<SharerState, string> = {
  idle: 'Lokasi belum dibagikan.',
  sharing: 'Lokasi sedang dibagikan. Biarkan halaman ini tetap terbuka.',
  stopped: 'Berbagi lokasi dihentikan.',
  denied: 'Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini di pengaturan browser, lalu coba lagi.',
  unavailable: 'Sinyal GPS belum tersedia. Mencoba lagi…',
  ended: 'Penugasan sudah selesai. Terima kasih — berbagi lokasi dihentikan.',
}

export const TrackingSharer = clientEntry(import.meta.url, function TrackingSharer(handle: Handle<TrackingSharerProps>) {
  let state: SharerState = 'idle'
  let watchId: number | null = null
  let lastSent: { coords: GeolocationCoordinates; at: number } | null = null
  let lastSentLabel = ''

  function stop(next: SharerState) {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    watchId = null
    state = next
    handle.update()
  }

  async function send(position: GeolocationPosition) {
    let { coords } = position
    let now = Date.now()
    if (lastSent && now - lastSent.at < handle.props.minIntervalMs && roughDistanceM(lastSent.coords, coords) <= handle.props.minDistanceM) {
      return
    }
    lastSent = { coords, at: now }
    try {
      let response = await fetch(handle.props.locationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyM: coords.accuracy,
          recordedAt: new Date(position.timestamp).toISOString(),
        }),
      })
      if (response.status === 410) return stop('ended')
      if (response.ok) {
        lastSentLabel = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        state = 'sharing'
        handle.update()
      }
    } catch {
      // Offline for a moment — the next position will retry.
    }
  }

  function start() {
    if (!('geolocation' in navigator)) return stop('unavailable')
    state = 'sharing'
    watchId = navigator.geolocation.watchPosition(
      (position) => void send(position),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) return stop('denied')
        state = 'unavailable'
        handle.update()
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    )
    handle.update()
  }

  return () => (
    <div class="space-y-3">
      <p class="text-sm" aria-live="polite">
        {MESSAGES[state]}
        {state === 'sharing' && lastSentLabel ? ` Terakhir terkirim ${lastSentLabel}.` : ''}
      </p>
      {state === 'sharing' || state === 'unavailable' ? (
        <button type="button" class="btn btn-outline w-full" mix={[on('click', () => stop('stopped'))]}>
          Hentikan
        </button>
      ) : state === 'ended' ? null : (
        <button type="button" class="btn btn-default w-full" mix={[on('click', start)]}>
          Mulai berbagi lokasi
        </button>
      )}
    </div>
  )
})

import { clientEntry, on, ref, type Handle } from 'remix/component'

import { loadLeaflet, OSM_ATTRIBUTION, OSM_TILES } from './leaflet.ts'

interface LocationPickerProps {
  latitude: number | null
  longitude: number | null
}

const INDONESIA: [number, number] = [-2.5, 118]

export const LocationPicker = clientEntry(import.meta.url, function LocationPicker(handle: Handle<LocationPickerProps>) {
  let latitude = handle.props.latitude === null ? '' : String(handle.props.latitude)
  let longitude = handle.props.longitude === null ? '' : String(handle.props.longitude)
  let setMarker: ((lat: number, lng: number) => void) | null = null
  let clearMarker: (() => void) | null = null

  // remix/component keeps `value` inputs controlled, so typing must flow back into state or it is reverted.
  function onCoordinateInput(field: 'latitude' | 'longitude') {
    return on<HTMLInputElement>('input', (event) => {
      let value = event.currentTarget.value
      if (field === 'latitude') latitude = value
      else longitude = value
      let lat = Number.parseFloat(latitude)
      let lng = Number.parseFloat(longitude)
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) setMarker?.(lat, lng)
      handle.update()
    })
  }

  async function mount(node: HTMLElement, signal: AbortSignal) {
    let L = await loadLeaflet()
    if (signal.aborted) return
    let map = L.map(node)
    L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map)
    let marker: ReturnType<typeof L.circleMarker> | null = null
    setMarker = (lat, lng) => {
      marker?.remove()
      marker = L.circleMarker([lat, lng], { radius: 9, color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.9 }).addTo(map)
    }
    clearMarker = () => {
      marker?.remove()
      marker = null
    }
    let lat = Number.parseFloat(latitude)
    let lng = Number.parseFloat(longitude)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setMarker(lat, lng)
      map.setView([lat, lng], 16)
    } else {
      map.setView(INDONESIA, 5)
    }
    map.on('click', (event) => {
      latitude = event.latlng.lat.toFixed(6)
      longitude = event.latlng.lng.toFixed(6)
      setMarker?.(event.latlng.lat, event.latlng.lng)
      handle.update()
    })
    signal.addEventListener('abort', () => map.remove())
  }

  return () => (
    <div class="field space-y-2">
      <span class="label">Lokasi rumah klien</span>
      <div class="h-64 w-full overflow-hidden rounded-xl border" mix={[ref((node, signal) => void mount(node as HTMLElement, signal))]} />
      <p class="field-description">Klik peta untuk menaruh pin, atau isi koordinat manual. Dipakai di peta tracking kolektor.</p>
      <div class="grid grid-cols-2 gap-2">
        <input
          class="input"
          name="latitude"
          inputmode="decimal"
          placeholder="Latitude"
          aria-label="Latitude"
          value={latitude}
          mix={[onCoordinateInput('latitude')]}
        />
        <input
          class="input"
          name="longitude"
          inputmode="decimal"
          placeholder="Longitude"
          aria-label="Longitude"
          value={longitude}
          mix={[onCoordinateInput('longitude')]}
        />
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        mix={[
          on('click', () => {
            latitude = ''
            longitude = ''
            clearMarker?.()
            handle.update()
          }),
        ]}
      >
        Hapus pin
      </button>
    </div>
  )
})

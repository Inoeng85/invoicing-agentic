export type LeafletModule = typeof import('leaflet')

export const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

// Leaflet touches `window` at import time, so it may only load in the browser — never during SSR.
export async function loadLeaflet(): Promise<LeafletModule> {
  return (await import('leaflet/dist/leaflet-src.esm.js')) as LeafletModule
}

// Leaflet treats string tooltip content as HTML; user-provided names must go in as text nodes.
export function textElement(text: string): HTMLElement {
  let span = document.createElement('span')
  span.textContent = text
  return span
}

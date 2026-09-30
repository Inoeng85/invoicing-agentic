import { DomainError } from './errors.ts'

export interface GeoPoint {
  latitude: number
  longitude: number
}

const EARTH_RADIUS_M = 6_371_000

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  let rad = (deg: number) => (deg * Math.PI) / 180
  let dLat = rad(b.latitude - a.latitude)
  let dLng = rad(b.longitude - a.longitude)
  let h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

export function assertValidCoordinates(point: GeoPoint): void {
  let { latitude, longitude } = point
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new DomainError('Koordinat tidak valid', 'invalid_location')
  }
}

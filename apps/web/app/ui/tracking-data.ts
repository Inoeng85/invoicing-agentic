import type { TrackingView } from '@invoicing/domain'

import type { TrackingMapData } from '../actions/public/tracking-map.tsx'
import { routes } from '../routes.ts'

export function toTrackingMapData(view: TrackingView): TrackingMapData {
  let { collector } = view
  return {
    client: { name: view.client.name, latitude: view.client.latitude, longitude: view.client.longitude },
    collector: collector
      ? {
          name: collector.name,
          photoUrl: collector.photoUpdatedAt
            ? `${routes.collectorActions.photo.href({ collectorId: collector.id })}?v=${collector.photoUpdatedAt.getTime()}`
            : null,
        }
      : null,
    last: view.last ? { latitude: view.last.latitude, longitude: view.last.longitude, at: view.last.at.toISOString() } : null,
    trail: view.trail.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
    distanceToClientM: view.distanceToClientM,
  }
}

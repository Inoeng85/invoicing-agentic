import type { RemixNode } from 'remix/ui'

import { routes } from '../routes.ts'
import { initials } from './kit.tsx'

export function collectorAvatar(
  collector: { id: string; name: string; photoUpdatedAt: Date | null },
  sizeClass = 'size-10',
): RemixNode {
  if (collector.photoUpdatedAt) {
    let src = `${routes.collectorActions.photo.href({ collectorId: collector.id })}?v=${collector.photoUpdatedAt.getTime()}`
    return <img src={src} alt={`Foto ${collector.name}`} class={`${sizeClass} shrink-0 rounded-full object-cover`} />
  }
  return (
    <span
      class={`grid ${sizeClass} shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary`}
      aria-hidden="true"
    >
      {initials(collector.name)}
    </span>
  )
}

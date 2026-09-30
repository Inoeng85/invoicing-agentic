import type { RemixNode } from 'remix/ui'

import { routes } from '../routes.ts'
import { icon } from './icons.tsx'
import { initials } from './kit.tsx'

type AvatarCollector = { id: string; name: string; photoUpdatedAt: Date | null }

function photoSrc(collector: AvatarCollector & { photoUpdatedAt: Date }): string {
  return `${routes.collectorActions.photo.href({ collectorId: collector.id })}?v=${collector.photoUpdatedAt.getTime()}`
}

function photoDialogId(collectorId: string): string {
  return `dlg-collector-photo-${collectorId}`
}

/** With `preview`, a photo avatar opens `collectorPhotoDialog` — render that dialog once per collector. */
export function collectorAvatar(
  collector: AvatarCollector,
  sizeClass = 'size-10',
  options: { preview?: boolean } = {},
): RemixNode {
  let { photoUpdatedAt } = collector
  if (photoUpdatedAt) {
    let img = (
      <img
        src={photoSrc({ ...collector, photoUpdatedAt })}
        alt={`Foto ${collector.name}`}
        class={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    )
    if (!options.preview) return img
    return (
      <button
        type="button"
        popovertarget={photoDialogId(collector.id)}
        class="shrink-0 cursor-zoom-in rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={`Lihat foto ${collector.name}`}
      >
        {img}
      </button>
    )
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

export function collectorPhotoDialog(collector: AvatarCollector): RemixNode {
  let { photoUpdatedAt } = collector
  if (!photoUpdatedAt) return null
  let id = photoDialogId(collector.id)
  return (
    <div id={id} popover="auto" class="dialog" role="dialog" aria-labelledby={`${id}-title`}>
      <div class="dialog-header">
        <h2 id={`${id}-title`} class="dialog-title">
          {collector.name}
        </h2>
      </div>
      <img
        src={photoSrc({ ...collector, photoUpdatedAt })}
        alt={`Foto ${collector.name}`}
        class="max-h-[70vh] w-full rounded-lg object-contain"
      />
      <div class="dialog-footer">
        <button type="button" class="btn btn-outline" popovertarget={id} popovertargetaction="hide">
          {icon('x')}
          Tutup
        </button>
      </div>
    </div>
  )
}

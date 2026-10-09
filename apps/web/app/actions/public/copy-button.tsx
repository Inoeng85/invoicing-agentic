import { clientEntry, on, type Handle } from 'remix/component'

export const CopyButton = clientEntry(
  import.meta.url,
  function CopyButton(handle: Handle<{ text: string; label: string }>) {
    let copied = false
    return () => (
      <button
        type="button"
        class="btn btn-outline btn-sm"
        mix={[
          on('click', async () => {
            try {
              await navigator.clipboard.writeText(handle.props.text)
              copied = true
            } catch {
              copied = false
            }
            await handle.update()
          }),
        ]}
      >
        {copied ? 'Tersalin' : handle.props.label}
      </button>
    )
  },
)

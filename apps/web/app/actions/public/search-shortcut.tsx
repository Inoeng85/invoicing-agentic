import { clientEntry, type Handle } from 'remix/component'

/** Renders the ⌘K hint beside the docs search field and makes the shortcut focus it. */
export const SearchShortcut = clientEntry(
  import.meta.url,
  function SearchShortcut(handle: Handle<{ target: string }>) {
    // `on` binds to its own element, so a page-wide shortcut needs a document listener.
    // Setup also runs during SSR, where there is no document.
    if (typeof document !== 'undefined') {
      document.addEventListener(
        'keydown',
        (event) => {
          if (event.key !== 'k' || !(event.metaKey || event.ctrlKey)) return
          const field = document.getElementById(handle.props.target)
          if (!(field instanceof HTMLInputElement)) return
          event.preventDefault()
          field.focus()
          field.select()
        },
        { signal: handle.signal },
      )
    }

    return () => (
      <kbd class="kbd mr-2 shrink-0 select-none" aria-hidden="true">
        ⌘K
      </kbd>
    )
  },
)

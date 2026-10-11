import { clientEntry, ref, type Handle } from 'remix/component'

function showSource(node: HTMLElement, source: string) {
  node.textContent = source
  node.dataset.mermaidState = 'error'
  const message = document.createElement('p')
  message.className = 'px-4 py-2 text-xs text-muted-foreground'
  message.setAttribute('role', 'status')
  message.textContent = 'Diagram tidak dapat ditampilkan. Kode sumber tetap tersedia.'
  node.after(message)
}

export const MermaidDiagrams = clientEntry(
  import.meta.url,
  function MermaidDiagrams(handle: Handle<{ target: string }>) {
    async function mount(signal: AbortSignal) {
      const nodes = [...document.getElementById(handle.props.target)!.querySelectorAll<HTMLElement>('pre.mermaid')]
      const sources = nodes.map((node) => node.textContent ?? '')
      let mermaid: typeof import('mermaid').default
      try {
        // Serve the prebuilt ESM unchanged: Remix rejects its bundled CommonJS helper.
        const href = '/assets/vendor/mermaid/mermaid.esm.min.mjs'
        mermaid = (await import(href) as { default: typeof import('mermaid').default }).default
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          suppressErrorRendering: true,
          theme: 'base',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          themeVariables: {
            darkMode: true,
            secondaryColor: '#232323',
            tertiaryColor: '#1a1a1a',
            primaryColor: '#0d3a38',
            primaryBorderColor: '#71e8df',
            primaryTextColor: '#f4f4f5',
            lineColor: '#a1a1aa',
            background: '#141414',
          },
        })
        await document.fonts.ready
      } catch {
        if (!signal.aborted) nodes.forEach((node, index) => showSource(node, sources[index]))
        return
      }
      if (signal.aborted) return
      for (const [index, node] of nodes.entries()) {
        if (signal.aborted) return
        try {
          const { svg } = await mermaid.render(`docs-mermaid-${crypto.randomUUID()}`, sources[index], node)
          if (signal.aborted) return
          node.innerHTML = svg
          node.dataset.mermaidState = 'rendered'
        } catch {
          if (!signal.aborted) showSource(node, sources[index])
        }
      }
    }

    return () => <span hidden mix={[ref((_node, signal) => void mount(signal))]} />
  },
)

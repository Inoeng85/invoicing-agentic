import { readFile } from 'node:fs/promises'

const distribution = new URL('.', import.meta.resolve('mermaid'))
const prefix = '/assets/vendor/mermaid/'
const browserModule = /^(?:mermaid\.esm\.min\.mjs|chunks\/mermaid\.esm\.min\/[\w-]+\.mjs)$/

export async function mermaidAssetResponse(request: Request): Promise<Response | null> {
  const pathname = new URL(request.url).pathname
  if (!pathname.startsWith(prefix)) return null
  const file = pathname.slice(prefix.length)
  if (!browserModule.test(file)) return new Response('Not Found', { status: 404 })
  try {
    const bytes = await readFile(new URL(file, distribution))
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return new Response('Not Found', { status: 404 })
    throw error
  }
}

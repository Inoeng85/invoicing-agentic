import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'
import { mermaidAssetResponse } from './mermaid-assets.ts'

const request = (file: string) => new Request(`http://localhost/assets/vendor/mermaid/${file}`)

describe('Mermaid browser assets', () => {
  it('serves the browser entry and its relative chunks as JavaScript', async () => {
    const entry = await mermaidAssetResponse(request('mermaid.esm.min.mjs'))
    assert.equal(entry?.status, 200)
    assert.match(entry!.headers.get('Content-Type')!, /text\/javascript/)
    assert.equal(entry!.headers.get('X-Content-Type-Options'), 'nosniff')
    const source = await entry!.text()
    const chunk = source.match(/\.\/(chunks\/mermaid\.esm\.min\/[\w-]+\.mjs)/)![1]
    const response = await mermaidAssetResponse(request(chunk))
    assert.equal(response?.status, 200)
    assert.ok((await response!.text()).length > 0)
  })

  it('restricts access to prebuilt browser modules and returns 404 for missing chunks', async () => {
    for (const file of ['package.json', 'mermaid.core.mjs', 'mermaid.esm.min.mjs.map', 'chunks/mermaid.core/chunk.mjs', 'chunks/mermaid.esm.min/missing.mjs', '%2e%2e%2fpackage.json']) {
      assert.equal((await mermaidAssetResponse(request(file)))?.status, 404)
    }
  })

  it('leaves other asset requests to the normal asset server', async () => {
    assert.equal(await mermaidAssetResponse(new Request('http://localhost/assets/app/actions/public/entry.ts')), null)
  })
})

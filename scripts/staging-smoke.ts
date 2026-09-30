/**
 * Post-deploy smoke — PG-2 / staging CD.
 * Usage: API_BASE_URL=https://api.staging.example npm run staging:smoke
 */
const base = process.env.API_BASE_URL?.replace(/\/$/, '')
if (!base) {
  console.error('API_BASE_URL is required')
  process.exit(1)
}

let failed = false

async function check(path: string, label: string) {
  let url = `${base}${path}`
  let res = await fetch(url)
  let ok = res.status === 200
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label} ${res.status} ${url}`)
  if (!ok) failed = true
}

await check('/api/health/live', 'health live')
await check('/api/health/ready', 'health ready')

process.exit(failed ? 1 : 0)

import { createConnection } from 'node:net'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { validateEnvForDoctor } from '@invoicing/platform'

import { prisma } from '../packages/database/src/client.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

type Check = { name: string; pass: boolean; detail: string }

function record(checks: Check[], name: string, pass: boolean, detail: string) {
  checks.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}: ${detail}`)
}

function parseNode() {
  let match = /^v(\d+)\.(\d+)/.exec(process.version)
  if (!match) return null
  return { major: Number(match[1]), minor: Number(match[2]) }
}

async function portFree(port: number) {
  return new Promise<boolean>((resolve) => {
    let socket = createConnection({ port, host: '127.0.0.1' })
    socket.once('connect', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => resolve(true))
  })
}

async function main() {
  const checks: Check[] = []

  let node = parseNode()
  record(
    checks,
    'Node >= 24.3',
    Boolean(node && (node.major > 24 || (node.major === 24 && node.minor >= 3))),
    process.version,
  )

  record(
    checks,
    'Single lockfile',
    existsSync(join(root, 'package-lock.json')) && !existsSync(join(root, 'yarn.lock')),
    'package-lock.json only',
  )

  for (let rel of ['packages/database/.env', 'apps/web/.env', 'apps/api/.env']) {
    record(checks, `Env file ${rel}`, existsSync(join(root, rel)), existsSync(join(root, rel)) ? 'present' : 'missing')
  }

  for (let target of ['web', 'api'] as const) {
    let envCheck = validateEnvForDoctor(target)
    record(
      checks,
      `Env vars (${target})`,
      envCheck.ok,
      envCheck.ok ? 'ok' : `missing: ${envCheck.missing.join(', ')}`,
    )
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    record(checks, 'Database reachable', true, 'ok')
  } catch (err) {
    record(checks, 'Database reachable', false, err instanceof Error ? err.message : String(err))
  }

  for (let port of [44100, 44101]) {
    let free = await portFree(port)
    record(checks, `Port ${port} free`, free, free ? 'free' : 'in use')
  }

  await prisma.$disconnect()

  if (checks.some((c) => !c.pass)) process.exit(1)
  console.log('\nDoctor: all checks passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

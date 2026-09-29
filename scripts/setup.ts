import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function run(cmd: string, args: string[]) {
  let result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: false })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function parseNodeMajorMinor(): { major: number; minor: number } | null {
  let match = /^v(\d+)\.(\d+)/.exec(process.version)
  if (!match) return null
  return { major: Number(match[1]), minor: Number(match[2]) }
}

function ensureNode() {
  let v = parseNodeMajorMinor()
  if (!v || v.major < 24 || (v.major === 24 && v.minor < 3)) {
    console.error(
      `Node ${process.version} does not satisfy engines (>=24.3.0). Run: nvm install && nvm use`,
    )
    process.exit(1)
  }
}

function ensureEnv(relDir: string, secretKey?: string) {
  let dir = join(root, relDir)
  let example = join(dir, '.env.example')
  let envPath = join(dir, '.env')
  if (!existsSync(example)) {
    console.error(`Missing ${example}`)
    process.exit(1)
  }
  if (existsSync(envPath)) {
    if (secretKey) {
      let content = readFileSync(envPath, 'utf8')
      if (!/^SESSION_SECRET=/m.test(content)) {
        let secret = randomBytes(32).toString('hex')
        writeFileSync(
          envPath,
          content.trimEnd() + `\nSESSION_SECRET="${secret}"\n`,
          'utf8',
        )
        console.log(`Added SESSION_SECRET to ${relDir}/.env`)
      }
    }
    return
  }
  copyFileSync(example, envPath)
  if (secretKey) {
    let secret = randomBytes(32).toString('hex')
    writeFileSync(
      envPath,
      readFileSync(envPath, 'utf8').trimEnd() + `\nSESSION_SECRET="${secret}"\n`,
      'utf8',
    )
  }
  console.log(`Created ${relDir}/.env from .env.example`)
}

ensureNode()

if (!existsSync(join(root, 'node_modules'))) {
  console.log('Installing dependencies…')
  run('npm', ['install'])
}

ensureEnv('packages/database')
ensureEnv('apps/web', 'SESSION_SECRET')
ensureEnv('apps/api', 'SESSION_SECRET')

console.log('Running database migrations…')
run('npm', ['run', 'db:migrate:deploy'])

console.log('Running seed (no-op until Phase 2)…')
run('npm', ['run', 'db:seed'])

console.log('Setup complete. Run: npm run dev')

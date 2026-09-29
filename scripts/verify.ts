import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const steps: { name: string; args: string[] }[] = [
  { name: 'typecheck', args: ['run', 'typecheck'] },
  { name: 'test:domain', args: ['run', 'test:domain'] },
  { name: 'test (web)', args: ['run', 'test'] },
  { name: 'css:build', args: ['run', 'css:build'] },
  { name: 'design:css', args: ['run', 'design:css'] },
  { name: 'gate', args: ['run', 'gate'] },
]

for (let step of steps) {
  console.log(`\n=== verify: ${step.name} ===\n`)
  let result = spawnSync('npm', step.args, { cwd: root, stdio: 'inherit', shell: false })
  if (result.status !== 0) {
    console.error(`\nverify failed at: ${step.name}`)
    process.exit(result.status ?? 1)
  }
}

console.log('\nverify: all steps passed')

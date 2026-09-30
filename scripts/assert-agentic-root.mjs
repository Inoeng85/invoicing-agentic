#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
if (!existsSync(join(root, 'package.json')) || !existsSync(join(root, 'packages/database/prisma/schema.prisma'))) {
  console.error(`
Perintah ini hanya jalan dari root monorepo Agentic (bukan folder AIEngineer induk).

  cd Agentic
  npm run db:seed:sample
`)
  process.exit(1)
}

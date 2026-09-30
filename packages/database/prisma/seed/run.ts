import './env.ts'

import { prisma } from '../../src/client.ts'
import { seedSampleClients } from './clients.ts'
import { seedSampleCollectors } from './collectors.ts'
import { ensureDemoUser } from './demo-user.ts'
import { seedSampleInvoices } from './invoices.ts'

const MODULES = {
  clients: seedSampleClients,
  collectors: seedSampleCollectors,
  invoices: seedSampleInvoices,
} as const
type ModuleName = keyof typeof MODULES

function isModuleName(value: string): value is ModuleName {
  return value in MODULES
}

async function main() {
  let target = process.argv[2] ?? 'all'
  let order: ModuleName[] = target === 'all' ? ['clients', 'collectors', 'invoices'] : isModuleName(target) ? [target] : []
  if (!order.length) throw new Error(`Modul tidak dikenal: ${target} (pilih clients | collectors | invoices | all)`)

  let userId = await ensureDemoUser()
  for (let name of order) {
    let { created, total } = await MODULES[name](userId)
    console.log(`[seed:${name}] ${created} dibuat, ${total - created} sudah ada (total ${total})`)
  }

  console.log('')
  console.log('Database:', process.env.DATABASE_URL)
  console.log('Login demo:', process.env.SEED_DEMO_USER_EMAIL ?? 'dewi.kartika@studio-kartika.demo')
  console.log('Password demo:', process.env.SEED_DEMO_USER_PASSWORD ?? 'DemoStudio123!')
  console.log('Filter UI: klien/kolektor @sample.demo · invoice nomor SMP-*')
}

main()
  .catch((error: unknown) => {
    let message = error instanceof Error ? error.message : String(error)
    if (/no such table|SQLITE_ERROR|P2021/i.test(message)) {
      console.error(`${message}\n\nMigrasi belum jalan. Dari folder Agentic:\n  npm run db:migrate:deploy\n  npm run db:seed:sample`)
    } else if (/db:seed:clients|belum lengkap/i.test(message)) {
      console.error(`${message}\n\nUrutan:\n  npm run db:seed:clients\n  npm run db:seed:collectors\n  npm run db:seed:invoices`)
    } else {
      console.error(message)
    }
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

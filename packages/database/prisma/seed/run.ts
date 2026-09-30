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
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

import { prisma } from '@invoicing/database'

export interface SystemStatus {
  database: 'ok' | 'error'
  userCount: number
  clientCount: number
  invoiceCount: number
}

export async function getSystemStatus(): Promise<SystemStatus> {
  try {
    let [userCount, clientCount, invoiceCount] = await Promise.all([
      prisma.user.count(),
      prisma.client.count(),
      prisma.invoice.count(),
    ])

    return {
      database: 'ok',
      userCount,
      clientCount,
      invoiceCount,
    }
  } catch {
    return {
      database: 'error',
      userCount: 0,
      clientCount: 0,
      invoiceCount: 0,
    }
  }
}

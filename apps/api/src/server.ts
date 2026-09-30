import * as http from 'node:http'
import { createRequestListener } from 'remix/node-fetch-server'

import { bootstrapPlatform } from '@invoicing/platform'

import { router } from './router.ts'

bootstrapPlatform('api')

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 44101

const server = http.createServer(createRequestListener(router.fetch))

server.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})

let shuttingDown = false

function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  server.close(() => process.exit(0))
  server.closeAllConnections()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

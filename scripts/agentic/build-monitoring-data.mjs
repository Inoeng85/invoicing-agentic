#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildMonitoringData, writeMonitoringArtifacts } from './monitoring-data.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

function main() {
  const data = buildMonitoringData(ROOT)
  const paths = writeMonitoringArtifacts(ROOT, data)
  console.log(
    `Monitoring: ${data.summary.total} task · ${data.summary.logCount} log · active ${data.summary.activeTaskId || '—'}`,
  )
  console.log(`  → ${paths.jsonRel}`)
  console.log(`  → ${paths.logRel}`)
}

main()

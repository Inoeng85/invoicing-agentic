#!/usr/bin/env node
/**
 * Trigger orkestrasi: intake → plan → development (satu langkah).
 *   npm run agentic:trigger-next              # status + prompt
 *   npm run agentic:trigger-next -- --execute # langkah mekanis (intake tick, dll.)
 *   npm run agentic:trigger-next -- --write   # tulis .agentic/trigger/development.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import {
  applyIntakeQueueStep,
  buildAgentPrompt,
  buildOrchestratorNext,
  completePhasePlan,
  loadQueue,
  saveQueue,
  writePlanManifest,
} from './intake-pipeline.mjs'
import { workspaceRelative } from './path-resolver.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
const TRIGGER_DIR = path.join(ROOT, '.agentic/trigger')
const OUT_JSON = path.join(ROOT, 'docs/reports/workflow/intake-trigger.json')

function parseArgs(argv) {
  const out = { execute: false, write: false, json: false }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--execute') out.execute = true
    else if (argv[i] === '--write') out.write = true
    else if (argv[i] === '--json') out.json = true
  }
  return out
}

function writeTriggerArtifacts(orch, queue) {
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    queueGeneratedAt: queue.generatedAt,
    next: orch,
    targetColumn: orch.orchestratorStage === 'development' ? 'development' : orch.action === 'run_intake' ? 'intake' : orch.action === 'run_plan_task' ? 'plan' : null,
    agentPrompt: buildAgentPrompt(orch),
    terminal: {
      execute: 'npm run agentic:trigger-next -- --execute',
      refresh: 'npm run agentic:kanban-data',
    },
  }
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true })
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2) + '\n')
  return payload
}

function runExecute(orch, queue) {
  if (orch.action === 'run_intake') {
    const ph = (queue.phases || []).find((p) => p.phaseId === orch.phaseId)
    if (!ph) return { ok: false, error: 'phase not found' }
    const r = applyIntakeQueueStep(ROOT, queue, ph)
    saveQueue(ROOT, queue)
    return r
  }
  if (orch.action === 'finalize_plan') {
    const ph = (queue.phases || []).find((p) => p.phaseId === orch.phaseId)
    const manifest = writePlanManifest(ROOT, ph)
    const r = completePhasePlan(ROOT, queue, ph, manifest)
    saveQueue(ROOT, queue)
    return r
  }
  if (orch.action === 'run_development_task') {
    fs.mkdirSync(TRIGGER_DIR, { recursive: true })
    const session = {
      requestedAt: new Date().toISOString(),
      action: orch.action,
      taskId: orch.taskId,
      phaseId: orch.phaseId,
      planPath: workspaceRelative(orch.planPath),
      featurePath: orch.featurePath ? workspaceRelative(orch.featurePath) : null,
      skill: orch.skill,
      agentPrompt: buildAgentPrompt(orch),
    }
    fs.writeFileSync(path.join(TRIGGER_DIR, 'development.json'), JSON.stringify(session, null, 2) + '\n')
    return { ok: true, session, message: 'Development session trigger ditulis — jalankan agent dengan prompt di bawah' }
  }
  return { ok: false, error: 'Langkah ini butuh agent (Plan/Development). Salin agentPrompt.' }
}

function main() {
  const opts = parseArgs(process.argv)
  const queue = loadQueue(ROOT)
  const orch = buildOrchestratorNext(ROOT, queue)
  const payload = writeTriggerArtifacts(orch, queue)

  if (opts.execute) {
    const result = runExecute(orch, queue)
    payload.executeResult = result
    writeTriggerArtifacts(buildOrchestratorNext(ROOT, loadQueue(ROOT)), loadQueue(ROOT))
    if (opts.json) console.log(JSON.stringify({ ...payload, executeResult: result }, null, 2))
    else {
      console.log('Execute:', result.ok !== false ? 'OK' : 'FAIL', result.message || result.error || '')
      console.log('\n' + payload.agentPrompt)
    }
    spawnSync('npm', ['run', 'agentic:kanban-data'], { cwd: ROOT, stdio: 'inherit' })
    if (orch.action === 'run_development_task' && result.ok) {
      console.log(
        '\n[autopilot] Setelah Development selesai: npm run agentic:autopilot -- complete --task ' +
          orch.taskId +
          '\n           atau jalankan: npm run agentic:autopilot:watch',
      )
    }
    process.exit(result.ok === false && orch.action !== 'run_plan_task' ? 1 : 0)
  }

  if (opts.write && orch.action === 'run_development_task') {
    runExecute(orch, queue)
  }

  if (opts.json) console.log(JSON.stringify(payload, null, 2))
  else {
    console.log(JSON.stringify({ action: orch.action, phaseId: orch.phaseId, taskId: orch.taskId }, null, 2))
    console.log('\n--- Agent prompt ---\n')
    console.log(payload.agentPrompt)
    console.log('\n--- Terminal ---')
    console.log('npm run agentic:trigger-next -- --execute')
  }
}

main()

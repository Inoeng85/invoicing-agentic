#!/usr/bin/env node
/** Fail fast with a clear message when Node < 24.3 (required by remix/node-tsx). */
const match = /^v(\d+)\.(\d+)/.exec(process.version)
if (!match) {
  console.error(`Cannot parse Node version: ${process.version}`)
  process.exit(1)
}
const major = Number(match[1])
const minor = Number(match[2])
const ok = major > 24 || (major === 24 && minor >= 3)
if (ok) process.exit(0)

console.error(`
Node ${process.version} is too old for this repo (need >= 24.3.0).

Remix node-tsx uses registerHooks from node:module (Node 24+).

Fix:
  cd Agentic
  nvm install    # reads .nvmrc → 24.3.0
  nvm use
  node -v
  npm run dev:api
`)
process.exit(1)

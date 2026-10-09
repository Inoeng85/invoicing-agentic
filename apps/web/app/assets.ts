import { createAssetServer } from 'remix/assets'
import { componentHmr } from 'remix/component-hmr/assets'

const rootDir = process.cwd()
const nodeEnv = process.env.NODE_ENV ?? 'development'
const isDevelopment = nodeEnv === 'development'
const isHmr = Boolean(isDevelopment && process.env.REMIX_NODE_HMR)

export const assets = createAssetServer({
  basePath: '/assets',
  rootDir,
  // npm workspaces hoist deps to Agentic/node_modules (no apps/web/node_modules)
  mounts: {
    app: 'app',
    npm: '../../node_modules',
  },

  allowFiles: ['app/routes.ts', 'app/**/public/**'],
  allowPackages: ['remix', 'leaflet'],
  denyFiles: ['app/**/*.test.*'],
  sourceMaps: isDevelopment ? 'external' : undefined,
  minify: !isDevelopment,
  // Avoid watching hoisted workspace node_modules (EMFILE). Process restart: node --watch server.ts
  watch: false,
  hmr: isHmr
    ? {
        channel: async () => (await import('remix/node-hmr/runtime')).createBrowserHmrChannel(),
        moduleImporter: 'remix/multiple-import-maps-polyfill',
      }
    : undefined,
  scripts: { loaders: isHmr ? [componentHmr()] : undefined },
})

const entry = 'app/actions/public/entry.ts'

export const scriptEntry = await assets.getScriptEntry(entry)

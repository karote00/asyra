import { defineConfig } from '@playwright/test'
import ordinaryConfig from './playwright.config'

if (process.env.CI) throw new Error('Document load measurements are local-only')
const url = new URL(process.env.APP_URL ?? '')
const backend = new URL(process.env.E2E_DOCUMENT_BACKEND_URL ?? '')
if (
  !['localhost', '127.0.0.1'].includes(url.hostname) ||
  !['localhost', '127.0.0.1'].includes(backend.hostname) ||
  url.port === '3000' ||
  backend.port === '4201'
)
  throw new Error('Use isolated local document services')

export default defineConfig({
  ...ordinaryConfig,
  testMatch: 'document-load.local.spec.ts',
  testIgnore: [],
  workers: 1,
  retries: 0,
  timeout: 240_000,
  globalTimeout: 360_000,
  reporter: 'line',
  use: {
    ...ordinaryConfig.use,
    viewport: { width: 1728, height: 1000 },
    deviceScaleFactor: 1,
    trace: 'off',
    video: 'off'
  },
  webServer: Array.isArray(ordinaryConfig.webServer)
    ? ordinaryConfig.webServer.map((server) => ({
        ...server,
        reuseExistingServer: false
      }))
    : ordinaryConfig.webServer
})

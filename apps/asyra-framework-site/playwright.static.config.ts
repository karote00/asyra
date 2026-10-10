import { defineConfig } from '@playwright/test'
import base from './playwright.config'

// Exercise the exported production files, without starting a Next.js dev server.
export default defineConfig({
  ...base,
  webServer: {
    command: 'node scripts/preview-static.mjs',
    url: process.env.SITE_URL ?? 'http://127.0.0.1:3039',
    env: { SITE_URL: process.env.SITE_URL ?? 'http://127.0.0.1:3039' },
    reuseExistingServer: false,
    timeout: 30_000
  },
  use: {
    ...base.use,
    baseURL: process.env.SITE_URL ?? 'http://127.0.0.1:3039'
  }
})

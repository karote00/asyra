import { defineConfig, devices } from '@playwright/test'

const baseUrl = process.env.STARTER_APP_URL ?? 'http://127.0.0.1:5192'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: 'line',
  use: {
    baseURL: baseUrl,
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'yarn dev --host 127.0.0.1 --port 5192',
    url: baseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1280, height: 780 }
      }
    },
    {
      name: 'narrow',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 390, height: 840 },
        isMobile: true
      }
    }
  ]
})

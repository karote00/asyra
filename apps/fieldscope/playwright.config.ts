import { defineConfig } from '@playwright/test'
import { resolveAppEnvironment } from './app-environment.mjs'
const environment = resolveAppEnvironment()
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  workers: 1,
  retries: 0,
  timeout: 30000,
  globalTimeout: 180000,
  reporter: 'line',
  use: {
    baseURL: environment.url,
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
    channel: 'chrome',
    launchOptions: {
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    },
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'yarn exec vite',
    url: environment.url,
    reuseExistingServer: true,
    timeout: 60000
  }
})

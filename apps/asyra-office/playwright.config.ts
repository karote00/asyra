import { defineConfig } from '@playwright/test'
import { resolveAppEnvironment } from './app-environment'
const environment = resolveAppEnvironment()
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  retries: 0,
  timeout: 30000,
  globalTimeout: 150000,
  reporter: 'line',
  use: {
    baseURL: environment.url,
    viewport: { width: 1440, height: 960 },
    channel: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? undefined : 'chrome',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    },
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'node ../../node_modules/vite/bin/vite.js',
    url: environment.url,
    reuseExistingServer: true,
    timeout: 60000
  }
})

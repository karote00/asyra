import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  retries: 0,
  timeout: 30000,
  globalTimeout: 150000,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:5194',
    viewport: { width: 1440, height: 960 },
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    },
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'node ../../node_modules/vite/bin/vite.js',
    url: 'http://127.0.0.1:5194',
    reuseExistingServer: false,
    timeout: 60000
  }
})

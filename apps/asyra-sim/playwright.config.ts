import { defineConfig } from '@playwright/test'
import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import { resolveAppEnvironment } from './app-environment.mjs'

const environment = resolveAppEnvironment(process.env, { allowHosted: true })
const hosted = new URL(environment.url).protocol === 'https:'
export default defineConfig({
  testDir: '.',
  testMatch: ['**/e2e/**/*.spec.ts', '**/src/**/__tests__/*.browser.spec.ts'],
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    `${fileURLToPath(new URL('./.artifacts/', import.meta.url))}**`
  ],
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  globalTimeout: 180_000,
  reporter: [
    ['line'],
    ['json', { outputFile: '.artifacts/browser-report.json' }]
  ],
  use: {
    baseURL: environment.url,
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 1,
    channel: 'chrome',
    launchOptions: {
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: hosted
    ? undefined
    : {
        command: 'yarn exec vite',
        url: environment.url,
        reuseExistingServer: true,
        timeout: 60_000
      }
})

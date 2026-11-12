import { defineConfig } from '@playwright/test'
import ordinaryConfig from './playwright.config'

if (process.env.CI) {
  throw new Error('Group rendering measurements are local-only')
}

export default defineConfig({
  ...ordinaryConfig,
  testMatch: [
    'mesh-material.spec.ts',
    'render-state-observer.spec.ts',
    'hierarchy-small-groups.local.spec.ts',
    'hierarchy-projection-updates.spec.ts'
  ],
  testIgnore: [],
  outputDir: 'test-results/hierarchy-small-groups',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'line',
  use: { ...ordinaryConfig.use, trace: 'off', video: 'off' },
  projects: [
    {
      name: 'chromium-dpr-1',
      use: {
        browserName: 'chromium',
        channel: 'chrome',
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1
      }
    }
  ]
})

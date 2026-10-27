import { defineConfig } from '@playwright/test'
import ordinaryConfig from './playwright.config'

if (process.env.CI) {
  throw new Error('Continuous navigation measurements are local-only')
}

export default defineConfig({
  ...ordinaryConfig,
  testMatch: 'continuous-navigation.local.spec.ts',
  testIgnore: [],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'line',
  use: { ...ordinaryConfig.use, trace: 'off', video: 'off' },
  projects: [1, 2].map((deviceScaleFactor) => ({
    name: `chromium-dpr-${deviceScaleFactor}`,
    use: {
      browserName: 'chromium',
      channel: 'chrome',
      viewport: { width: 1728, height: 1000 },
      deviceScaleFactor
    }
  })),
  webServer: Array.isArray(ordinaryConfig.webServer)
    ? ordinaryConfig.webServer.map((server) => ({
        ...server,
        ...(process.env.NAVIGATION_APP_DIR &&
        server.url === ordinaryConfig.use?.baseURL
          ? { cwd: process.env.NAVIGATION_APP_DIR }
          : {}),
        reuseExistingServer: false
      }))
    : ordinaryConfig.webServer
})

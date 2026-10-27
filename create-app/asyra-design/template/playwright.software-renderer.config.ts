import { defineConfig } from '@playwright/test'
import ordinaryConfig from './playwright.config'
import collaborationConfig from './playwright.collaboration.config'

// Reproduce headless hosts without a hardware GPU using the same product tests.
// Existing suite watchdogs, assertions and server ownership stay unchanged.
const softwareLaunchOptions = {
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader'
  ]
}

export default defineConfig({
  ...ordinaryConfig,
  workers: 1,
  fullyParallel: false,
  reporter: 'line',
  projects: [
    {
      ...ordinaryConfig.projects?.[0],
      name: 'software-functional',
      testMatch: [
        'mesh-material.spec.ts',
        'ai-conversation-flow.spec.ts',
        'render-delta-performance.spec.ts'
      ],
      use: {
        ...ordinaryConfig.projects?.[0]?.use,
        launchOptions: softwareLaunchOptions
      }
    },
    {
      ...collaborationConfig.projects?.[0],
      name: 'software-collaboration',
      testMatch: collaborationConfig.testMatch,
      testIgnore: [],
      timeout: collaborationConfig.timeout,
      use: {
        ...collaborationConfig.projects?.[0]?.use,
        launchOptions: softwareLaunchOptions
      }
    }
  ]
})

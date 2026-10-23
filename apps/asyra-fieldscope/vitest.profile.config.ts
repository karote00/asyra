import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    deps: { interopDefault: false },
    setupFiles: [fileURLToPath(new URL('./vitest.setup.ts', import.meta.url))],
    include: ['src/**/__tests__/**/*.profile.test.ts'],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 10000
  }
})

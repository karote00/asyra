import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    deps: { interopDefault: false },
    include: ['src/**/__tests__/**/*.profile.test.ts'],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 10000
  }
})

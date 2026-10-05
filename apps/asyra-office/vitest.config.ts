import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: [
      'src/**/__tests__/**/*.test.ts',
      'src/**/__tests__/**/*.test.tsx'
    ],
    maxWorkers: 2,
    testTimeout: 10000,
    deps: { interopDefault: false }
  }
})

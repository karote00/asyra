import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    // Packed ESM exports stay live across Core runtime replacement.
    deps: { interopDefault: false },
    setupFiles: [fileURLToPath(new URL('./vitest.setup.ts', import.meta.url))],
    exclude: ['src/**/__tests__/**/*.profile.test.ts'],
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    maxWorkers: 2,
    testTimeout: 10000
  }
})

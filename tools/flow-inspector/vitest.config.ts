import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    include: ['src/__tests__/**/*.test.tsx'],
    setupFiles: ['src/__tests__/setup.ts']
  }
})

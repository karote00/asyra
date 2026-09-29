import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const packageSource = (name: string) =>
  fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@asyra/core': packageSource('core'),
      '@asyra/factory': packageSource('factory'),
      '@asyra/feature-system': packageSource('feature-system'),
      '@asyra/input-system': packageSource('input-system'),
      '@asyra/persistence': packageSource('persistence'),
      '@asyra/preset': packageSource('preset'),
      '@asyra/props-manager': packageSource('props-manager'),
      '@asyra/reactive-events': packageSource('reactive-events'),
      '@asyra/render': packageSource('render'),
      '@asyra/render-engine': packageSource('render-engine'),
      '@asyra/render-engine-pixi': packageSource('render-engine-pixi'),
      '@asyra/scene-tree': packageSource('scene-tree'),
      '@asyra/selection': packageSource('selection'),
      '@asyra/system-context': packageSource('system-context'),
      '@asyra/ui-context': packageSource('ui-context'),
      '@asyra/utils': packageSource('utils')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./src/runtime/__tests__/setup-canvas.ts']
  }
})

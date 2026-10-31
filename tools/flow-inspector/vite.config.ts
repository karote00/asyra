import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => ({
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      command === 'serve' ? 'development' : 'production'
    )
  },
  plugins: [react()],
  build: {
    emptyOutDir: mode !== 'live',
    lib: {
      entry: resolve(
        import.meta.dirname,
        mode === 'live' ? 'src/live-main.tsx' : 'src/main.tsx'
      ),
      formats: ['iife'],
      name: mode === 'live' ? 'FlowDashboard' : 'FlowInspectorWorkspace',
      fileName: () =>
        mode === 'live' ? 'flow-dashboard.js' : 'flow-inspector-workspace.js',
      cssFileName:
        mode === 'live' ? 'flow-dashboard' : 'flow-inspector-workspace'
    },
    outDir: resolve(import.meta.dirname, 'workspace/generated')
  }
}))

import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: 'server/execution-report-cli.ts',
    target: 'node18',
    outDir: 'dist/execution-report',
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: 'execution-report.js' } }
  }
})

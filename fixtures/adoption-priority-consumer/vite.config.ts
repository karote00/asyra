import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5192,
    strictPort: false
  },
  preview: {
    host: '127.0.0.1',
    port: 5192,
    strictPort: false
  },
  build: { target: 'es2022', outDir: 'dist/frontend' }
})

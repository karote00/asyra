import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolveAppEnvironment } from './app-environment'
export default defineConfig(({ command }) => {
  const environment = command === 'serve' ? resolveAppEnvironment() : undefined
  return {
    plugins: [react(), tailwindcss()],
    base: './',
    ...(environment
      ? {
          server: {
            host: environment.host,
            port: environment.port,
            strictPort: true
          }
        }
      : {}),
    build: { target: 'es2022' }
  }
})

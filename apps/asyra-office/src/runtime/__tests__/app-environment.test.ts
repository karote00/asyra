// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { resolveAppEnvironment } from '../../../app-environment'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('admits an explicit local origin and rejects credentials and non-origin URLs', () => {
  expect(resolveAppEnvironment({ APP_URL: 'http://127.0.0.1:5194' })).toEqual({
    url: 'http://127.0.0.1:5194',
    host: '127.0.0.1',
    port: 5194
  })
  for (const APP_URL of [
    '',
    'https://example.com',
    'http://user:secret@localhost:5194',
    'http://localhost:5194/path',
    'http://localhost:5194/?token=x',
    'http://localhost:5194/#x'
  ])
    expect(() => resolveAppEnvironment({ APP_URL })).toThrow()
})

it('uses the same configured origin for the development server and browser verification', async () => {
  vi.stubEnv('APP_URL', 'http://127.0.0.1:5294')
  const { default: vite } = await import('../../../vite.config')
  const config =
    typeof vite === 'function'
      ? await vite({ command: 'serve', mode: 'development' })
      : await vite
  const { default: browser } = await import('../../../playwright.config')
  expect(config.server).toEqual({
    host: '127.0.0.1',
    port: 5294,
    strictPort: true
  })
  expect(browser.use?.baseURL).toBe('http://127.0.0.1:5294')
  expect(browser.webServer).toMatchObject({ url: 'http://127.0.0.1:5294' })
})

it('builds portable output without requiring a local server origin', async () => {
  vi.stubEnv('APP_URL', '')
  const { default: vite } = await import('../../../vite.config')
  const config =
    typeof vite === 'function'
      ? await vite({ command: 'build', mode: 'production' })
      : await vite
  expect(config.server).toBeUndefined()
  expect(config.base).toBe('./')
  expect(config.build?.target).toBe('es2022')
})

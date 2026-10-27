// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('uses hardware review without forcing software graphics or relaxing resource guards', async () => {
  vi.stubEnv('APP_URL', 'http://127.0.0.1:5194')
  vi.stubEnv('OFFICE_HARDWARE_REVIEW', '1')
  const { default: config } = await import('../../playwright.config')
  expect(config.use?.launchOptions?.args).toEqual([])
  expect(config.timeout).toBe(30000)
  expect(config.globalTimeout).toBe(150000)
  expect(config.workers).toBe(1)
  expect(config.retries).toBe(0)
})

it('keeps the software graphics route for default portable CI runs', async () => {
  vi.stubEnv('APP_URL', 'http://127.0.0.1:5194')
  vi.stubEnv('OFFICE_HARDWARE_REVIEW', '')
  const { default: config } = await import('../../playwright.config')
  expect(config.use?.launchOptions?.args).toEqual([
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader'
  ])
})

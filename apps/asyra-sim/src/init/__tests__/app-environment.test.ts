import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ConfigEnv, UserConfigExport } from 'vite'
import { resolveAppEnvironment } from '../../../app-environment.mjs'

it('uses one explicit local origin for server/test configuration', () => {
  expect(resolveAppEnvironment({ APP_URL: 'http://127.0.0.1:3020' })).toEqual({
    url: 'http://127.0.0.1:3020',
    host: '127.0.0.1',
    port: 3020
  })
  expect(() =>
    resolveAppEnvironment({ APP_URL: 'https://example.com' })
  ).toThrow('local HTTP')
  expect(() =>
    resolveAppEnvironment({ APP_URL: 'http://127.0.0.1:3020/path' })
  ).toThrow('local HTTP')
})

describe('explicit hosted browser verification', () => {
  it('accepts HTTPS only when a browser runner opts in', () => {
    expect(
      resolveAppEnvironment(
        { APP_URL: 'https://example.com' },
        { allowHosted: true }
      )
    ).toEqual({ url: 'https://example.com', host: 'example.com', port: 443 })
  })

  it.each([
    'http://example.com',
    'https://user:password@example.com',
    'https://example.com/path',
    'https://example.com/?token=private',
    'https://example.com/#fragment'
  ])('rejects unsafe hosted targets (%s)', (url) => {
    expect(() =>
      resolveAppEnvironment({ APP_URL: url }, { allowHosted: true })
    ).toThrow()
  })
})

describe('Vite configuration origin ownership', () => {
  beforeEach(() => vi.resetModules())
  afterEach(() => vi.unstubAllEnvs())

  async function loadAppConfig(environment: ConfigEnv) {
    const { default: config }: { default: UserConfigExport } =
      await import('../../../vite.config')
    return typeof config === 'function' ? config(environment) : config
  }

  it.each(['', 'https://example.com'])(
    'builds static output without a usable server origin (%j)',
    async (origin) => {
      // An explicit empty value also prevents a developer's .env from masking CI.
      vi.stubEnv('APP_URL', origin)
      const config = await loadAppConfig({
        command: 'build',
        mode: 'production'
      })
      expect(config.base).toBe('./')
      expect(config.build?.target).toBe('es2022')
      expect(config.worker?.format).toBe('es')
      expect(config.server).toBeUndefined()
      expect(config.preview).toBeUndefined()
    }
  )

  describe.each([
    { mode: 'development', isPreview: false },
    { mode: 'production', isPreview: true }
  ])('serve with $mode mode and preview=$isPreview', (environment) => {
    it('requires an explicit server origin', async () => {
      vi.stubEnv('APP_URL', '')
      await expect(
        loadAppConfig({ command: 'serve', ...environment })
      ).rejects.toThrow('Set APP_URL')
    })

    it('rejects a non-local origin', async () => {
      vi.stubEnv('APP_URL', 'https://example.com')
      await expect(
        loadAppConfig({ command: 'serve', ...environment })
      ).rejects.toThrow('local HTTP')
    })

    it('uses the configured host and strict port', async () => {
      vi.stubEnv('APP_URL', 'http://127.0.0.1:3020')
      const config = await loadAppConfig({ command: 'serve', ...environment })
      const server = { host: '127.0.0.1', port: 3020, strictPort: true }
      expect(config.server).toEqual(server)
      expect(config.preview).toEqual(server)
    })
  })
})

describe('Playwright server ownership', () => {
  beforeEach(() => vi.resetModules())
  afterEach(() => vi.unstubAllEnvs())

  it('checks an HTTPS deployment without launching a local server', async () => {
    vi.stubEnv('APP_URL', 'https://example.com')
    const { default: config } = await import('../../../playwright.config')

    expect(config.use?.baseURL).toBe('https://example.com')
    expect(config.webServer).toBeUndefined()
    expect(config.retries).toBe(0)
    expect(config.workers).toBe(1)
  })

  it('retains the ordinary loopback server for local browser tests', async () => {
    vi.stubEnv('APP_URL', 'http://127.0.0.1:3020')
    const { default: config } = await import('../../../playwright.config')

    expect(config.use?.baseURL).toBe('http://127.0.0.1:3020')
    expect(config.webServer).toEqual({
      command: 'yarn exec vite',
      url: 'http://127.0.0.1:3020',
      reuseExistingServer: true,
      timeout: 60_000
    })
  })
})

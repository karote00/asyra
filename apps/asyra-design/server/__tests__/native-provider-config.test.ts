import { afterEach, expect, it, vi } from 'vitest'
import { access, mkdir, readFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createNativeProviderConfig } from '../native-provider-config'

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }))
vi.mock('node:child_process', () => ({ execFile: execute }))
const root = resolve('tmp/native-provider-config-tests')
afterEach(async () => {
  vi.clearAllMocks()
  await rm(root, { recursive: true, force: true })
})

const model = {
  slug: 'chosen-model',
  tool_mode: 'other',
  use_responses_lite: true,
  multi_agent_version: 'v2',
  context_window: 12345,
  truncation_policy: { limit: 10000 },
  base_instructions: 'Vendor instructions',
  input_modalities: ['text', 'image']
}
const supply = (value: unknown) =>
  execute.mockImplementation((_file, _args, _options, callback) => {
    callback(null, JSON.stringify(value), '')
  })

it('derives direct configuration from the selected executable without changing model limits', async () => {
  supply({ models: [model, { ...model, slug: 'unselected' }] })
  const config = await createNativeProviderConfig({
    executable: '/native/provider',
    model: model.slug,
    directory: root
  })
  expect(execute).toHaveBeenCalledTimes(1)
  expect(execute.mock.calls[0].slice(0, 2)).toEqual([
    '/native/provider',
    ['debug', 'models', '--bundled']
  ])
  const path = config.path
  const value = JSON.parse(await readFile(path, 'utf8'))
  expect(value.models).toEqual([
    {
      ...model,
      tool_mode: 'direct',
      use_responses_lite: false,
      multi_agent_version: null
    }
  ])
  expect(config.arguments).toEqual([
    '-c',
    `model_catalog_json=${JSON.stringify(path)}`
  ])
  await config.dispose()
  await expect(access(path)).rejects.toThrow()
  await config.dispose()
})

it.each([{}, { models: [] }, { models: [model, model] }])(
  'fails invalid or ambiguous catalogs before starting a model: %j',
  async (catalog) => {
    supply(catalog)
    await expect(
      createNativeProviderConfig({
        executable: 'native',
        model: model.slug,
        directory: root
      })
    ).rejects.toThrow()
  }
)

it('does not execute after cancellation or replace existing files', async () => {
  await mkdir(root, { recursive: true })
  const signal = AbortSignal.abort()
  await expect(
    createNativeProviderConfig({
      executable: 'native',
      model: model.slug,
      directory: root,
      signal
    })
  ).rejects.toThrow()
  expect(execute).not.toHaveBeenCalled()
})

it('propagates native metadata failure without creating a fallback model', async () => {
  execute.mockImplementation((_file, _args, _options, callback) =>
    callback(new Error('Catalog unavailable'))
  )
  await expect(
    createNativeProviderConfig({
      executable: 'native',
      model: model.slug,
      directory: root
    })
  ).rejects.toThrow('Catalog unavailable')
})

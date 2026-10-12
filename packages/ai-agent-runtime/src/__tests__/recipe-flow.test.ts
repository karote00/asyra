import { expect, it } from 'vitest'
import { vi } from 'vitest'
import { createAiActionRegistry } from '../action-registry.js'
import { createAiToolLibrary } from '../tool-library.js'
import { createAiRecipeInvoker } from '../recipe-execution.js'
import {
  createAiToolPersistence,
  type AiToolStore,
  type AiToolStoreEntry
} from '../tool-store.js'

const memoryStore = () => {
  const entries = new Map<string, AiToolStoreEntry>()
  let serial = 0
  const store: AiToolStore = {
    read: async (key) => entries.get(key),
    list: async (limit) => [...entries.values()].slice(0, limit),
    write: vi.fn(async ({ key, expectedVersion, record }) => {
      if (entries.get(key)?.version !== expectedVersion)
        throw new Error('Storage conflict')
      const entry = { key, version: String(++serial), record }
      entries.set(key, entry)
      return entry
    })
  }
  return { store, entries }
}
const setup = (store: AiToolStore) => {
  const registry = createAiActionRegistry()
  const writes: unknown[] = []
  const scalar = { type: 'number' }
  registry.register({
    name: 'set',
    description: 'Set a fresh value.',
    revision: 1,
    inputSchema: scalar,
    outputSchema: scalar,
    effect: 'mutation',
    resources: ['value'],
    composition: 'allowed',
    lifecycle: { cancellation: 'cooperative', retry: 'never', output: 'value' },
    execute: async (input) => input
  })
  const library = createAiToolLibrary({
    registry,
    validate: () => undefined,
    capacity: 32,
    limits: {
      steps: 16,
      bindings: 50,
      bindingDepth: 12,
      bytes: 10000,
      issues: 8
    },
    createExecutor: () => async (input) => input
  })
  const runner = createAiRecipeInvoker({
    registry,
    recipe: library.recipe,
    validate: (value) =>
      typeof value === 'number' ? undefined : 'Expected number',
    execute: async (call) => {
      writes.push(call.input)
      return { status: 'success', settlement: 'completed', value: call.input }
    },
    maxSteps: 16,
    leases: {
      open: async () => undefined,
      retain: async () => undefined,
      release: async () => undefined
    }
  })
  const persistence = createAiToolPersistence({
    registry,
    library,
    store,
    capacity: 32,
    check: async () => ({
      ok: true,
      scope: 'Scalar mutation contract verified by this host.'
    })
  })
  const register = () =>
    library.submit({
      requestId: 'author',
      submissionId: 'one',
      proposal: {
        format: 1,
        name: 'reusable',
        description: 'Apply a fresh number.',
        revision: 1,
        inputSchema: scalar,
        outputSchema: scalar,
        steps: [
          {
            id: 'apply',
            tool: 'set',
            revision: 1,
            input: { kind: 'input', path: '' }
          }
        ],
        output: { kind: 'step', step: 'apply', path: '' }
      }
    })
  return { registry, library, runner, persistence, writes, register }
}

it('recipe proof rejects ineligible dependencies before registration', () => {
  const { store } = memoryStore()
  const host = setup(store)
  const primitive = host.registry.get('set')
  if (!primitive) throw new Error('Missing primitive')
  host.registry.register({
    ...primitive,
    name: 'manage',
    composition: 'control-plane'
  })
  const result = host.library.submit({
    requestId: 'author',
    submissionId: 'bad',
    proposal: {
      format: 1,
      name: 'unsafe',
      description: 'Attempt to nest a control-plane tool.',
      revision: 1,
      inputSchema: primitive.inputSchema,
      outputSchema: primitive.outputSchema,
      steps: [
        {
          id: 'manage',
          tool: 'manage',
          revision: 1,
          input: { kind: 'input', path: '' }
        }
      ],
      output: { kind: 'step', step: 'manage', path: '' }
    }
  })
  expect(result).toMatchObject({ ok: false, code: 'admission' })
  expect(host.registry.get('unsafe', { requestId: 'author' })).toBeUndefined()
  expect(host.writes).toEqual([])
})

it('recipe proof registers retry-safe scoped candidates in the canonical registry', () => {
  const { store } = memoryStore()
  const host = setup(store)
  const first = host.register()
  expect(first.ok).toBe(true)
  expect(host.register()).toBe(first)
  expect(host.registry.get('reusable')).toBeUndefined()
  expect(host.registry.get('reusable', { requestId: 'author' })?.name).toBe(
    'reusable'
  )
  expect(
    host.registry.list({ requestId: 'author' }).map((item) => item.name)
  ).toEqual(['set', 'reusable'])
  expect(host.writes).toEqual([])
})

it('recipe proof executes nested tools without scheduler deadlock or lost references', async () => {
  const { store } = memoryStore()
  const host = setup(store)
  host.register()
  const scalar = { type: 'number' }
  expect(
    host.library.submit({
      requestId: 'author',
      submissionId: 'nested',
      proposal: {
        format: 1,
        name: 'nested',
        description: 'Compose admitted operations.',
        revision: 1,
        inputSchema: scalar,
        outputSchema: scalar,
        steps: [
          {
            id: 'first',
            tool: 'reusable',
            revision: 1,
            input: { kind: 'input', path: '' }
          },
          {
            id: 'second',
            tool: 'set',
            revision: 1,
            input: { kind: 'step', step: 'first', path: '' }
          }
        ],
        output: { kind: 'step', step: 'second', path: '' }
      }
    }).ok
  ).toBe(true)
  const result = await host.runner.invoke({
    name: 'nested',
    requestId: 'author',
    input: 8
  })
  expect(result).toMatchObject({
    status: 'success',
    settlement: 'completed',
    value: 8,
    issues: []
  })
  expect(result.calls.map((call) => call.name)).toEqual([
    'set',
    'reusable',
    'set',
    'nested'
  ])
  expect(new Set(result.calls.map((call) => call.callId)).size).toBe(4)
  expect(host.writes).toEqual([8, 8])
})

it('recipe proof saves without replay and validates durable reuse', async () => {
  const { store } = memoryStore()
  const first = setup(store)
  first.register()
  const receipt = await first.runner.invoke({
    name: 'reusable',
    requestId: 'author',
    input: 3
  })
  const request = {
    name: 'reusable',
    revision: 1,
    requestId: 'author',
    receipt
  }
  expect(await first.persistence.save(request)).toMatchObject({
    status: 'saved',
    availability: 'eligible'
  })
  expect(await first.persistence.save(request)).toMatchObject({
    status: 'saved'
  })
  expect(first.writes).toEqual([3])
  const second = setup(store)
  expect(await second.persistence.load('next')).toMatchObject({
    loaded: ['reusable'],
    unavailable: [],
    truncated: false
  })
  expect(second.writes).toEqual([])
  expect(
    await second.runner.invoke({
      name: 'reusable',
      requestId: 'next',
      input: 12
    })
  ).toMatchObject({ status: 'success', value: 12 })
  expect(second.writes).toEqual([12])
})

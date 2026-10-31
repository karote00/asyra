import { vi } from 'vitest'
import { createAiActionRegistry } from '../../action-registry.js'
import { createAiToolLibrary } from '../../tool-library.js'
import { createAiRecipeInvoker } from '../../recipe-execution.js'
import {
  createAiToolPersistence,
  type AiToolStore,
  type AiToolStoreEntry
} from '../../tool-store.js'

export const memoryStore = () => {
  const entries = new Map<string, AiToolStoreEntry>()
  let serial = 0
  const store: AiToolStore = {
    read: async (key) => entries.get(key),
    list: async (limit) => [...entries.values()].slice(0, limit),
    write: vi.fn(async ({ key, expectedVersion, record }) => {
      if (entries.get(key)?.version !== expectedVersion) {
        throw new Error('Storage conflict')
      }
      const entry = { key, version: String(++serial), record }
      entries.set(key, entry)
      return entry
    })
  }
  return { store, entries }
}
export const setup = (store: AiToolStore) => {
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

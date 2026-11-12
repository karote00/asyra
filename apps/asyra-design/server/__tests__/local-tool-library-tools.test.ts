import { expect, it, vi } from 'vitest'
import {
  createAiActionRegistry,
  type AiToolStoreEntry
} from '@asyra/ai-agent-runtime'
import { createLocalToolLibrary } from '../local-tool-library'
import { createLocalToolLibraryTools as createOwner } from '../local-tool-library-tools'
import { withToolContractAssertions } from './tool-contract-assertions'

const createLocalToolLibraryTools = (...args: Parameters<typeof createOwner>) =>
  withToolContractAssertions(createOwner(...args))

import { invokeLocalTool } from '../local-tool-invocation'
import {
  nativeToolInputSchema,
  operationContractIssue,
  operationInputIssue
} from '../operation-input-schema'
import { createLocalToolScheduler } from '../local-tool-scheduler'
import { toolSemantics } from '../../src/ai/tool-contract'
import { AiDesignToolIds } from '../../src/constants/ai-design'

const fixture = () => {
  const registry = createAiActionRegistry()
  const execute = vi.fn(async (input: unknown) => input)

  registry.register({
    name: 'design.number',
    description: 'Use a supplied number.',
    inputSchema: { type: 'number' },
    ...toolSemantics({ type: 'number' }, 'mutation', ['document']),
    composition: 'allowed',
    execute
  })
  const entries = new Map<string, AiToolStoreEntry>()
  let version = 0
  let storageUnavailable = false
  const signal = new AbortController().signal
  const schedule = createLocalToolScheduler(signal)
  const library = createLocalToolLibrary({
    requestId: 'author',
    registry,
    capacity: 16,
    receiptCapacity: 4,
    limits: {
      bytes: 16000,
      steps: 16,
      bindings: 80,
      bindingDepth: 12,
      issues: 8
    },
    validate: operationContractIssue,
    store: {
      read: async (key) => entries.get(key),

      list: async () => [...entries.values()],

      write: async (input) => {
        if (storageUnavailable) {
          throw new Error('Storage unavailable')
        }

        if (entries.get(input.key)?.version !== input.expectedVersion) {
          throw Error('conflict')
        }

        const entry = {
          key: input.key,
          version: String(++version),
          record: input.record
        }

        entries.set(input.key, entry)

        return entry
      }
    },

    execute: (call, definition) =>
      schedule(undefined, async () => ({
        status: 'success',
        settlement: 'completed',
        value: await definition.execute(call.input, { signal })
      })),

    leases: {
      open: async () => undefined,

      retain: async () => undefined,

      release: async () => undefined
    },

    check: async () => ({ ok: true, scope: 'Canonical numeric result only.' })
  })
  const owner = createLocalToolLibraryTools(
    () => library,
    () => ({ parentCallId: 'provider-call' })
  )

  const call = async (name: string, input: unknown) => {
    const definition = owner.definitions.find((item) => item.name === name)

    if (!definition) {
      throw new Error('Missing control definition')
    }

    return schedule(definition.executionAccess, () =>
      invokeLocalTool(owner, definition, input, signal)
    )
  }

  return {
    library,
    owner,
    execute,
    call,
    entries,

    failStorage: (value: boolean) => {
      storageUnavailable = value
    }
  }
}

const proposal = {
  format: 1,
  name: 'reuse-number',
  revision: 1,
  description: 'Use a fresh number through the public tool.',
  inputSchema: { type: 'number' },
  outputSchema: { type: 'number' },
  steps: [
    {
      id: 'use',
      tool: 'design.number',
      revision: 2,
      input: { kind: 'input', path: '' }
    }
  ],
  output: { kind: 'step', step: 'use', path: '' }
}

it('keeps recipe guidance within available capabilities and independent save recovery', () => {
  const { owner } = fixture()
  const submit = owner.definitions.find(
    (definition) => definition.name === AiDesignToolIds.SUBMIT_TOOL
  )
  const invoke = owner.definitions.find(
    (definition) => definition.name === AiDesignToolIds.INVOKE_TOOL
  )

  expect(submit?.description).toContain('no existing direct tool already fits')
  expect(submit?.description).toContain('cannot invent missing primitives')
  expect(submit?.description).toContain('task-specific choices in fresh inputs')
  expect(submit?.description).toContain('only mechanically decidable repairs')
  expect(invoke?.description).toContain('not visual acceptance')
  expect(invoke?.description).toContain(
    'Successful execution attempts saving independently'
  )
  expect(invoke?.description).toContain(
    'never repeat invocation to retry saving'
  )
})

it('exposes canonical recursive bindings through native conversion and validates malformed submissions before dispatch', async () => {
  const { owner, call, execute } = fixture()
  const definition = owner.definitions.find(
    (d) => d.name === AiDesignToolIds.SUBMIT_TOOL
  )

  if (!definition) {
    throw new Error('Missing submit definition')
  }

  const valid = { submissionId: 'one', proposal }

  expect(operationInputIssue(valid, definition.inputSchema)).toBeUndefined()
  expect(
    operationInputIssue(valid, nativeToolInputSchema(definition.inputSchema))
  ).toBeUndefined()
  const invalid = {
    ...valid,
    proposal: {
      ...proposal,
      steps: [
        { ...proposal.steps[0], input: { kind: 'callback', code: 'run()' } }
      ]
    }
  }

  expect(
    operationInputIssue(invalid, nativeToolInputSchema(definition.inputSchema))
  ).toBeDefined()
  expect((await call(AiDesignToolIds.SUBMIT_TOOL, invalid)).success).toBe(false)
  expect(execute).not.toHaveBeenCalled()
})

it('repairs admission, dispatches exact revisions and keeps durable management separate from product execution', async () => {
  const { call, execute } = fixture()
  const bad = {
    ...proposal,
    output: { kind: 'step', step: 'use', path: '/missing' }
  }
  const rejectedReply = await call(AiDesignToolIds.SUBMIT_TOOL, {
    submissionId: 'bad',
    proposal: bad
  })
  const rejected = JSON.parse(rejectedReply.text)

  expect(rejectedReply.outcome, rejectedReply.text).toMatchObject({
    status: 'failed',
    settlement: 'not-started'
  })

  expect(rejected).toMatchObject({
    ok: false,
    code: 'admission'
  })
  expect(rejected.issues.length).toBeGreaterThan(0)
  const submitted = JSON.parse(
    (
      await call(AiDesignToolIds.SUBMIT_TOOL, {
        submissionId: 'good',
        proposal
      })
    ).text
  )

  expect(submitted).toMatchObject({
    ok: true,
    storage: { status: 'saved', availability: 'candidate' }
  })
  const applied = JSON.parse(
    (
      await call(AiDesignToolIds.INVOKE_TOOL, {
        name: proposal.name,
        revision: 1,
        input: 7
      })
    ).text
  )

  expect(applied).toMatchObject({
    execution: { status: 'success', value: 7 },
    storage: { status: 'saved', availability: 'eligible' }
  })
  expect(execute).toHaveBeenCalledTimes(1)
  expect(
    JSON.parse(
      (
        await call(AiDesignToolIds.INVOKE_TOOL, {
          name: proposal.name,
          revision: 2,
          input: 7
        })
      ).text
    ).execution.settlement
  ).toBe('not-started')
  await call(AiDesignToolIds.MANAGE_TOOL, {
    name: proposal.name,
    revision: 1,
    operation: 'suspend'
  })
  expect(
    JSON.parse(
      (
        await call(AiDesignToolIds.INVOKE_TOOL, {
          name: proposal.name,
          revision: 1,
          input: 7
        })
      ).text
    ).execution.settlement
  ).toBe('not-started')
  expect(execute).toHaveBeenCalledTimes(1)
})

it('does not promote a model-authored receipt or accept unknown controls', async () => {
  const { call, execute, owner } = fixture()

  await call(AiDesignToolIds.SUBMIT_TOOL, { submissionId: 'one', proposal })
  const savedReply = await call(AiDesignToolIds.SAVE_TOOL, {
    name: proposal.name,
    revision: 1,
    receiptId: 'invented'
  })
  const saved = JSON.parse(savedReply.text)

  expect(savedReply.outcome).toMatchObject({
    status: 'failed',
    settlement: 'not-started'
  })

  expect(saved).toMatchObject({
    status: 'unsaved'
  })
  expect(execute).not.toHaveBeenCalled()
  await expect(
    owner.call('unknown', {}, new AbortController().signal)
  ).rejects.toThrow()
  for (const definition of owner.definitions) {
    expect(definition.composition).toBe('control-plane')
  }
})

it('retries failed storage through save_tool without repeating successful product work', async () => {
  const { call, execute, failStorage, entries } = fixture()

  await call(AiDesignToolIds.SUBMIT_TOOL, {
    submissionId: 'storage-recovery',
    proposal
  })
  failStorage(true)
  const applied = JSON.parse(
    (
      await call(AiDesignToolIds.INVOKE_TOOL, {
        name: proposal.name,
        revision: 1,
        input: 23
      })
    ).text
  )

  expect(applied).toMatchObject({
    execution: { status: 'success', value: 23 },
    storage: { status: 'unsaved' }
  })
  expect(applied.receiptId).toBeTypeOf('string')
  expect(execute).toHaveBeenCalledTimes(1)
  failStorage(false)
  const saved = JSON.parse(
    (
      await call(AiDesignToolIds.SAVE_TOOL, {
        name: proposal.name,
        revision: 1,
        receiptId: applied.receiptId
      })
    ).text
  )

  expect(saved).toMatchObject({ status: 'saved', availability: 'eligible' })
  expect(
    [...entries.values()].some(
      (entry) => entry.record.availability === 'eligible'
    )
  ).toBe(true)
  expect(execute).toHaveBeenCalledTimes(1)
})

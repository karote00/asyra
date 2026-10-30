import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createLocalToolStore } from '../local-tool-store'
import { expect, it, vi } from 'vitest'
import {
  admitAiRecipe,
  createAiToolContract,
  createAiToolStoreManagement,
  createAiActionRegistry,
  type AiToolStore,
  type AiToolStoreEntry
} from '@asyra/ai-agent-runtime'
import { createLocalToolLibrary } from '../local-tool-library'
import { createLocalToolScheduler } from '../local-tool-scheduler'
import { operationContractIssue } from '../operation-input-schema'
import { toolSemantics } from '../../src/ai/tool-contract'
import { createLocalDesignTools } from '../local-design-tools'
import { AiActionNames } from '../../src/constants/ai-actions'

it('admits actual recursive preparation inputs and preserves forbidden fields and strict bounds', () => {
  const owner = createLocalDesignTools([
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply',
      inputSchema: {}
    }
  ])
  const native = owner.definitions.find(
    (item) => item.name === 'prepare_design'
  )
  if (!native) throw new Error('Missing preparation contract')
  const dependency = createAiToolContract(native)
  const literal = (value: unknown) => ({ kind: 'literal', value })
  const child = {
    kind: 'object',
    fields: {
      key: literal('panel'),
      name: literal('Panel'),
      type: literal('rect'),
      width: { kind: 'input', path: '' },
      height: literal(12),
      fill: literal('#123456')
    }
  }
  const group = {
    kind: 'object',
    fields: {
      key: literal('assembly'),
      name: literal('Assembly'),
      type: literal('group'),
      children: { kind: 'array', items: [child] }
    }
  }
  const proposal = {
    format: 1,
    name: 'prepare-panels',
    revision: 1,
    description: 'Prepare editable nested panels using a fresh width.',
    inputSchema: { type: 'number', minimum: 1, maximum: 100 },
    outputSchema: { type: 'integer', minimum: 1 },
    steps: [
      {
        id: 'prepare',
        tool: dependency.name,
        revision: dependency.revision,
        input: {
          kind: 'object',
          fields: {
            draft: {
              kind: 'object',
              fields: {
                name: literal('Panels'),
                type: literal('frame'),
                width: literal(200),
                height: literal(200),
                children: { kind: 'array', items: [group] }
              }
            }
          }
        }
      }
    ],
    output: { kind: 'step', step: 'prepare', path: '/elementCount' }
  }
  const check = () =>
    admitAiRecipe(proposal, {
      resolve: (name) => (name === dependency.name ? dependency : undefined),
      validate: operationContractIssue,
      limits: {
        steps: 4,
        bindings: 200,
        bindingDepth: 32,
        bytes: 20000,
        issues: 8
      }
    })
  expect(check()).toMatchObject({ ok: true })
  proposal.inputSchema.minimum = 0
  expect(check()).toMatchObject({ ok: false })
  proposal.inputSchema.minimum = 1
  Object.assign(group.fields, { width: literal(10) })
  expect(check()).toMatchObject({ ok: false })
})

const scalar = { type: 'number' }
const recipe = (name = 'double-write', tool = 'design.set') => ({
  format: 1,
  name,
  revision: 1,
  description: 'Apply the supplied value through two canonical writes.',
  inputSchema: scalar,
  outputSchema: scalar,
  steps: [
    { id: 'first', tool, revision: 2, input: { kind: 'input', path: '' } },
    {
      id: 'second',
      tool,
      revision: 2,
      input: { kind: 'step', step: 'first', path: '' }
    }
  ],
  output: { kind: 'step', step: 'second', path: '' }
})
const memory = () => {
  const entries = new Map<string, AiToolStoreEntry>()
  let sequence = 0
  const store: AiToolStore = {
    read: async (key) => entries.get(key),
    list: async (limit) => [...entries.values()].slice(0, limit),
    write: vi.fn(async (input) => {
      if (entries.get(input.key)?.version !== input.expectedVersion)
        throw new Error('CAS conflict')
      const entry = {
        key: input.key,
        version: String(++sequence),
        record: input.record
      }
      entries.set(input.key, entry)
      return entry
    })
  }
  return store
}
const setup = (store = memory(), requestId = 'request-one', overrides = {}) => {
  const registry = createAiActionRegistry()
  const execute = vi.fn(async (value: unknown) => value)
  registry.register({
    name: 'design.set',
    description: 'Set a fresh value.',
    inputSchema: scalar,
    ...toolSemantics(scalar, 'mutation', ['document']),
    composition: 'allowed',
    execute
  })
  registry.register({
    name: 'design.manage',
    description: 'Manage the tool registry.',
    inputSchema: scalar,
    ...toolSemantics(scalar, 'prepare', ['tool-registry']),
    composition: 'control-plane',
    execute
  })
  const schedule = createLocalToolScheduler(new AbortController().signal)
  const host = createLocalToolLibrary({
    requestId,
    registry,
    store,
    capacity: 16,
    receiptCapacity: 8,
    limits: {
      steps: 16,
      bindings: 80,
      bindingDepth: 12,
      bytes: 16000,
      issues: 8
    },
    validate: operationContractIssue,
    execute: (call, definition) =>
      schedule(undefined, async () => ({
        status: 'success',
        settlement: 'completed',
        value: await definition.execute(call.input, {
          signal: call.signal ?? new AbortController().signal
        })
      })),
    leases: {
      open: async () => undefined,
      retain: async () => undefined,
      release: async () => undefined
    },
    check: async () => ({
      ok: true,
      scope: 'Validated canonical write sequence; no visual certification.'
    }),
    ...overrides
  })
  return { host, registry, execute, store }
}

it('publishes current contracts and a generation for registry mutations', async () => {
  const { host } = setup()
  expect(host.list().map((item) => item.name)).toEqual([
    'design.set',
    'design.manage'
  ])
  let before = host.revision
  await host.submit({ submissionId: 'one', proposal: recipe() })
  expect(host.revision).toBeGreaterThan(before)
  expect(
    host.list().find((item) => item.name === 'double-write')
  ).toMatchObject({ kind: 'composition', availability: 'candidate' })
  before = host.revision
  await host.invoke({ name: 'double-write', input: 1 })
  expect(host.revision).toBeGreaterThan(before)
  expect(
    host.list().find((item) => item.name === 'double-write')
  ).toMatchObject({ availability: 'eligible' })
  before = host.revision
  await host.setState('double-write', 1, 'suspended')
  expect(host.revision).toBeGreaterThan(before)
  expect(
    host.list().find((item) => item.name === 'double-write')
  ).toBeUndefined()
})

it('submits and invokes through the same registry, saves and reuses with fresh inputs in a new request', async () => {
  const first = setup()
  expect(
    await first.host.submit({ submissionId: 'one', proposal: recipe() })
  ).toMatchObject({ ok: true })
  expect(first.host.describe('double-write')).toMatchObject({
    name: 'double-write',
    revision: 1,
    inputSchema: scalar
  })
  expect(
    await first.host.invoke({
      name: 'double-write',
      input: 4,
      callId: 'first-call'
    })
  ).toMatchObject({
    execution: { status: 'success', settlement: 'completed', value: 4 },
    storage: { status: 'saved', availability: 'eligible' }
  })
  expect(first.execute).toHaveBeenCalledTimes(2)
  await first.host.dispose()
  const next = setup(first.store, 'request-two')
  expect(await next.host.load()).toMatchObject({ loaded: ['double-write'] })
  expect(
    await next.host.invoke({ name: 'double-write', input: 9 })
  ).toMatchObject({ execution: { value: 9 } })
  expect(next.execute.mock.calls.map((call) => call[0])).toEqual([9, 9])
})

it('repairs bad bindings without execution and rejects control-plane composition', async () => {
  const { host, execute } = setup()
  const invalid = recipe()
  invalid.steps[1].input.path = '/missing'
  expect(
    await host.submit({ submissionId: 'bad', proposal: invalid })
  ).toMatchObject({ ok: false, code: 'admission' })
  expect(execute).not.toHaveBeenCalled()
  expect(
    await host.submit({ submissionId: 'fixed', proposal: recipe() })
  ).toMatchObject({ ok: true })
  expect(
    await host.submit({
      submissionId: 'control',
      proposal: recipe('forbidden', 'design.manage')
    })
  ).toMatchObject({ ok: false })
  expect(
    (await host.invoke({ name: 'design.manage', input: 1 })).execution
      .settlement
  ).toBe('not-started')
})

it('keeps save failure independent and retries only durable storage', async () => {
  const { host, execute, store } = setup()
  await host.submit({ submissionId: 'one', proposal: recipe() })
  const original = store.write
  store.write = vi.fn(async () => {
    throw new Error('Disk full')
  })
  expect(
    await host.invoke({ name: 'double-write', input: 3, callId: 'save-later' })
  ).toMatchObject({
    execution: { status: 'success', value: 3 },
    storage: { status: 'unsaved' },
    receiptId: 'save-later'
  })
  expect(execute).toHaveBeenCalledTimes(2)
  expect(
    await host.save({ name: 'double-write', revision: 1, receiptId: 'made-up' })
  ).toMatchObject({ status: 'unsaved' })
  store.write = original
  expect(
    await host.save({
      name: 'double-write',
      revision: 1,
      receiptId: 'save-later'
    })
  ).toMatchObject({ status: 'saved', availability: 'eligible' })
  expect(execute).toHaveBeenCalledTimes(2)
})

it('never saves partial or uncertain execution as reusable success', async () => {
  const { host, store } = setup(undefined, 'partial', {
    execute: async () => ({
      status: 'partial',
      settlement: 'partial',
      value: 2
    })
  })
  await host.submit({ submissionId: 'one', proposal: recipe() })
  const writes = vi.mocked(store.write).mock.calls.length
  const result = await host.invoke({ name: 'double-write', input: 2 })
  expect(result.execution.settlement).toBe('partial')
  expect(result.storage).toBeUndefined()
  expect(store.write).toHaveBeenCalledTimes(writes)
})

it('pins nested execution without owning the leaf scheduler barrier', async () => {
  const { host, execute } = setup()
  await host.submit({ submissionId: 'child', proposal: recipe() })
  await host.invoke({ name: 'double-write', input: 1 })
  const parent = recipe('nested', 'double-write')
  parent.steps.forEach((step) => {
    step.revision = 1
  })
  expect(
    await host.submit({ submissionId: 'parent', proposal: parent })
  ).toMatchObject({ ok: true })
  expect(
    (await host.invoke({ name: 'nested', input: 2 })).execution.status
  ).toBe('success')
  expect(execute).toHaveBeenCalledTimes(6)
})

it('preserves saved candidates and suspends or retires durable revisions through Runtime', async () => {
  const first = setup()
  await first.host.submit({ submissionId: 'one', proposal: recipe() })
  await first.host.dispose()
  const next = setup(first.store, 'next')
  expect((await next.host.load()).loaded).toEqual([])
  expect(await next.host.resume('double-write', 1)).toMatchObject({ ok: true })
  await next.host.invoke({ name: 'double-write', input: 3 })
  expect(
    await next.host.setState('double-write', 1, 'suspended')
  ).toMatchObject({ status: 'saved' })
  expect(
    (await next.host.invoke({ name: 'double-write', input: 4 })).execution
      .settlement
  ).toBe('not-started')
  expect(await next.host.setState('double-write', 1, 'retired')).toMatchObject({
    status: 'saved'
  })
  expect(
    await setup(first.store, 'third').host.resume('double-write', 1)
  ).toMatchObject({ ok: false })
})

it('waits for active dispatch before disposal and rejects new work during closure', async () => {
  let release!: () => void
  const wait = new Promise<void>((resolve) => {
    release = resolve
  })
  let started!: () => void
  const start = new Promise<void>((resolve) => {
    started = resolve
  })
  const { host } = setup(undefined, 'close', {
    execute: async () => {
      started()
      await wait
      return { status: 'success', settlement: 'completed', value: 1 }
    }
  })
  const running = host.invoke({ name: 'design.set', input: 1 })
  await start
  let disposed = false
  const closing = host.dispose().then(() => {
    disposed = true
  })
  await Promise.resolve()
  expect(disposed).toBe(false)
  await expect(
    host.submit({ submissionId: 'late', proposal: recipe() })
  ).rejects.toThrow('closing')
  release()
  await Promise.all([running, closing])
  expect(disposed).toBe(true)
})

it('reserves bounded receipt ownership before mutation and frees it after save-only recovery', async () => {
  const { host, execute, store } = setup(undefined, 'bounded', {
    receiptCapacity: 1
  })
  await host.submit({ submissionId: 'one', proposal: recipe() })
  const original = store.write
  store.write = vi.fn(async () => {
    throw new Error('No space')
  })
  await host.invoke({ name: 'double-write', input: 1, callId: 'pending' })
  expect(
    (await host.invoke({ name: 'double-write', input: 2, callId: 'pending' }))
      .execution.settlement
  ).toBe('not-started')
  expect(
    (await host.invoke({ name: 'double-write', input: 2, callId: 'new' }))
      .execution.settlement
  ).toBe('not-started')
  expect(execute).toHaveBeenCalledTimes(2)
  expect(
    await host.save({ name: 'double-write', revision: 2, receiptId: 'pending' })
  ).toMatchObject({ status: 'unsaved' })
  store.write = original
  await host.save({ name: 'double-write', revision: 1, receiptId: 'pending' })
  expect(
    (await host.invoke({ name: 'double-write', input: 2, callId: 'new' }))
      .execution.status
  ).toBe('success')
  expect(execute).toHaveBeenCalledTimes(4)
})

it('does not execute cancelled work or dispose a borrowed store or registry', async () => {
  const { host, execute, store, registry } = setup()
  await host.submit({ submissionId: 'one', proposal: recipe() })
  const controller = new AbortController()
  controller.abort()
  expect(
    (
      await host.invoke({
        name: 'double-write',
        input: 1,
        signal: controller.signal
      })
    ).execution.settlement
  ).toBe('not-started')
  expect(execute).not.toHaveBeenCalled()
  await host.dispose()
  expect(registry.get('design.set')).toBeDefined()
  expect((await store.list(16)).length).toBe(1)
})

it('refuses externally suspended revisions in an already-loaded request without executing', async () => {
  const first = setup()
  await first.host.submit({ submissionId: 'one', proposal: recipe() })
  await first.host.invoke({ name: 'double-write', input: 1 })
  const next = setup(first.store, 'request-two')
  await next.host.load()
  const management = createAiToolStoreManagement({
    store: first.store,
    capacity: 16
  })
  const entry = await management.read('double-write', 1)
  if (!entry) throw new Error('Expected saved revision')
  expect(
    await management.setState({
      name: 'double-write',
      revision: 1,
      expectedVersion: entry.version,
      availability: 'suspended'
    })
  ).toMatchObject({ status: 'saved' })
  expect(
    await next.host.invoke({ name: 'double-write', input: 2 })
  ).toMatchObject({
    execution: { status: 'failed', settlement: 'not-started' }
  })
  expect(next.execute).not.toHaveBeenCalled()
})

it('refuses new saved work when storage cannot verify its state', async () => {
  const { host, store, execute } = setup()
  await host.submit({ submissionId: 'one', proposal: recipe() })
  store.read = async () => {
    throw new Error('Storage disconnected')
  }
  expect(await host.invoke({ name: 'double-write', input: 2 })).toMatchObject({
    execution: { status: 'failed', settlement: 'not-started' }
  })
  expect(execute).not.toHaveBeenCalled()
})

it('lets an already-started graph settle after external retirement without republishing it', async () => {
  let release!: () => void
  const wait = new Promise<void>((resolve) => {
    release = resolve
  })
  let started!: () => void
  const start = new Promise<void>((resolve) => {
    started = resolve
  })
  const execute = vi.fn(async () => {
    started()
    await wait
    return { status: 'success', settlement: 'completed', value: 1 }
  })
  const { host, store } = setup(undefined, 'active', { execute })
  await host.submit({ submissionId: 'one', proposal: recipe() })
  const running = host.invoke({ name: 'double-write', input: 1 })
  await start
  const management = createAiToolStoreManagement({ store, capacity: 16 })
  const entry = await management.read('double-write', 1)
  if (!entry) throw new Error('Expected saved revision')
  await management.setState({
    name: 'double-write',
    revision: 1,
    expectedVersion: entry.version,
    availability: 'retired'
  })
  release()
  expect(await running).toMatchObject({
    execution: { status: 'success' },
    storage: { status: 'unsaved' }
  })
  expect(execute).toHaveBeenCalledTimes(2)
  expect(await host.invoke({ name: 'double-write', input: 2 })).toMatchObject({
    execution: { status: 'failed', settlement: 'not-started' }
  })
  expect(execute).toHaveBeenCalledTimes(2)
})

for (const fault of ['before-commit', 'after-commit'] as const) {
  it(`recovers nested tool saving through real SQLite without replay - ${fault}`, async () => {
    const parentDirectory = resolve('tmp/tool-library-tests')
    await mkdir(parentDirectory, { recursive: true })
    const directory = await mkdtemp(resolve(parentDirectory, 'nested-'))
    const open = () =>
      createLocalToolStore({
        directory,
        capacity: 16,
        recordBytes: 65536,
        totalBytes: 1048576
      })
    const database = await open()
    let reopened: Awaited<ReturnType<typeof open>> | undefined
    let first: ReturnType<typeof setup> | undefined
    let next: ReturnType<typeof setup> | undefined
    try {
      let fail = false
      const admissionReads: string[] = []
      const store: AiToolStore = {
        read: (key) => {
          admissionReads.push(key)
          return database.read(key)
        },
        list: (limit) => database.list(limit),
        write: async (input) => {
          if (fail && input.key === JSON.stringify(['double-write', 1])) {
            if (fault === 'after-commit') await database.write(input)
            throw new Error('Injected child save acknowledgement failure')
          }
          return database.write(input)
        }
      }
      first = setup(store)
      expect(
        await first.host.submit({ submissionId: 'child', proposal: recipe() })
      ).toMatchObject({ ok: true })
      const parent = recipe('nested', 'double-write')
      parent.steps.forEach((step) => {
        step.revision = 1
      })
      expect(
        await first.host.submit({ submissionId: 'parent', proposal: parent })
      ).toMatchObject({ ok: true })
      admissionReads.length = 0
      first.execute.mockImplementation(async (value: unknown) => {
        expect(admissionReads).toEqual([
          JSON.stringify(['nested', 1]),
          JSON.stringify(['double-write', 1])
        ])
        return value
      })
      fail = true
      const result = await first.host.invoke({
        name: 'nested',
        input: 3,
        callId: 'root-save'
      })
      expect(result).toMatchObject({
        execution: { status: 'success', value: 3 },
        storage: { status: 'unsaved' },
        receiptId: 'root-save'
      })
      expect(first.execute.mock.calls.map((call) => call[0])).toEqual([
        3, 3, 3, 3
      ])
      fail = false
      expect(
        await first.host.save({
          name: 'nested',
          revision: 1,
          receiptId: result.receiptId
        })
      ).toMatchObject({ status: 'saved', availability: 'eligible' })
      expect(first.execute).toHaveBeenCalledTimes(4)
      await first.host.dispose()
      database.close()
      reopened = await open()
      next = setup(reopened, 'fresh-request')
      expect(await next.host.load()).toMatchObject({
        loaded: ['double-write', 'nested'],
        unavailable: []
      })
      expect(
        await next.host.save({
          name: 'nested',
          revision: 1,
          receiptId: result.receiptId
        })
      ).toMatchObject({ status: 'unsaved' })
      expect(next.execute).not.toHaveBeenCalled()
      expect(
        await next.host.invoke({ name: 'nested', input: 9 })
      ).toMatchObject({
        execution: { status: 'success', value: 9 },
        storage: { status: 'saved' }
      })
      expect(next.execute.mock.calls.map((call) => call[0])).toEqual([
        9, 9, 9, 9
      ])
      const management = createAiToolStoreManagement({
        store: reopened,
        capacity: 16
      })
      const child = await management.read('double-write', 1)
      if (!child) throw new Error('Missing saved child')
      expect(
        await management.setState({
          name: 'double-write',
          revision: 1,
          expectedVersion: child.version,
          availability: 'suspended'
        })
      ).toMatchObject({ status: 'saved' })
      expect(
        await next.host.invoke({ name: 'nested', input: 10 })
      ).toMatchObject({ execution: { settlement: 'not-started' } })
      expect(next.execute).toHaveBeenCalledTimes(4)
    } finally {
      await first?.host.dispose()
      await next?.host.dispose()
      database.close()
      reopened?.close()
      await rm(directory, { recursive: true, force: true })
    }
  })
}

it('keeps storage eligibility independent of phase observer failures', async () => {
  const { host, execute } = setup(undefined, 'phase-failure', {
    onPhase: () => {
      throw new Error('Observer unavailable')
    }
  })
  await host.submit({ submissionId: 'one', proposal: recipe() })
  expect(await host.invoke({ name: 'double-write', input: 7 })).toMatchObject({
    execution: { status: 'success', value: 7 },
    storage: { status: 'saved' }
  })
  expect(execute).toHaveBeenCalledTimes(2)
  await host.dispose()
})

for (const availability of ['suspended', 'retired'] as const) {
  it(`does not acknowledge stale eligibility across SQLite connections - ${availability}`, async () => {
    const parentDirectory = resolve('tmp/tool-library-tests')
    await mkdir(parentDirectory, { recursive: true })
    const directory = await mkdtemp(resolve(parentDirectory, 'publication-'))
    const open = () =>
      createLocalToolStore({
        directory,
        capacity: 16,
        recordBytes: 65536,
        totalBytes: 1048576
      })
    const database = await open()
    const peer = await open()
    const management = createAiToolStoreManagement({
      store: peer,
      capacity: 16
    })
    let reads = 0
    let interrupt = false
    const store: AiToolStore = {
      read: async (key) => {
        const snapshot = await database.read(key)
        if (interrupt && ++reads === 2) {
          if (!snapshot) throw new Error('Expected saved definition')
          expect(
            await management.setState({
              name: 'double-write',
              revision: 1,
              expectedVersion: snapshot.version,
              availability
            })
          ).toMatchObject({ status: 'saved' })
        }
        return snapshot
      },
      list: (limit) => database.list(limit),
      write: (input) => database.write(input)
    }
    const { host, execute } = setup(store)
    try {
      expect(
        await host.submit({ submissionId: 'one', proposal: recipe() })
      ).toMatchObject({ ok: true })
      expect(
        await host.invoke({ name: 'double-write', input: 1 })
      ).toMatchObject({
        execution: { status: 'success' },
        storage: { status: 'saved' }
      })
      interrupt = true
      const result = await host.invoke({ name: 'double-write', input: 2 })
      expect(result).toMatchObject({
        execution: { status: 'success', value: 2 },
        storage: { status: 'unsaved' },
        receiptId: expect.any(String)
      })
      expect(execute.mock.calls.map((call) => call[0])).toEqual([1, 1, 2, 2])
      expect(
        await host.save({
          name: 'double-write',
          revision: 1,
          receiptId: result.receiptId
        })
      ).toMatchObject({ status: 'unsaved' })
      expect(
        await host.invoke({ name: 'double-write', input: 3 })
      ).toMatchObject({
        execution: { status: 'failed', settlement: 'not-started' }
      })
      expect(execute).toHaveBeenCalledTimes(4)
      expect(await management.read('double-write', 1)).toMatchObject({
        availability
      })
      const next = setup(peer, 'fresh-request')
      try {
        expect((await next.host.load()).loaded).toEqual([])
        expect(next.execute).not.toHaveBeenCalled()
      } finally {
        await next.host.dispose()
      }
    } finally {
      await host.dispose()
      database.close()
      peer.close()
      await rm(directory, { recursive: true, force: true })
    }
  })
}

for (const mode of ['load', 'resume'] as const) {
  it(`checks current saved authority after dependency validation - ${mode}`, async () => {
    const parentDirectory = resolve('tmp/tool-library-tests')
    await mkdir(parentDirectory, { recursive: true })
    const directory = await mkdtemp(resolve(parentDirectory, 'restore-'))
    const open = () =>
      createLocalToolStore({
        directory,
        capacity: 16,
        recordBytes: 65536,
        totalBytes: 1048576
      })
    const database = await open()
    const peer = await open()
    const management = createAiToolStoreManagement({
      store: peer,
      capacity: 16
    })
    const first = setup(database)
    let next: ReturnType<typeof setup> | undefined
    try {
      expect(
        await first.host.submit({ submissionId: 'child', proposal: recipe() })
      ).toMatchObject({ ok: true })
      expect(
        await first.host.invoke({ name: 'double-write', input: 1 })
      ).toMatchObject({ storage: { status: 'saved' } })
      const proposal = recipe('nested', 'double-write')
      proposal.steps.forEach((step) => {
        step.revision = 1
      })
      expect(
        await first.host.submit({ submissionId: 'parent', proposal })
      ).toMatchObject({ ok: true })
      if (mode === 'load')
        expect(
          await first.host.invoke({ name: 'nested', input: 2 })
        ).toMatchObject({ storage: { status: 'saved' } })
      await first.host.dispose()
      let childReads = 0
      let armed = mode === 'load'
      const store: AiToolStore = {
        read: async (key) => {
          const entry = await database.read(key)
          if (
            armed &&
            key === JSON.stringify(['double-write', 1]) &&
            ++childReads === (mode === 'load' ? 2 : 1)
          ) {
            const parent = await management.read('nested', 1)
            if (!parent) throw new Error('Missing saved parent')
            expect(
              await management.setState({
                name: 'nested',
                revision: 1,
                expectedVersion: parent.version,
                availability: 'retired'
              })
            ).toMatchObject({ status: 'saved' })
          }
          return entry
        },
        list: (limit) => database.list(limit),
        write: (input) => database.write(input)
      }
      next = setup(store, 'reopened')
      const loaded = await next.host.load()
      if (mode === 'load') expect(loaded.loaded).toEqual(['double-write'])
      else {
        armed = true
        expect(await next.host.resume('nested', 1)).toMatchObject({ ok: false })
      }
      expect(await management.read('nested', 1)).toMatchObject({
        availability: 'retired'
      })
      expect(next.host.describe('nested', 1)).toBeUndefined()
      expect(next.execute).not.toHaveBeenCalled()
    } finally {
      await first.host.dispose()
      await next?.host.dispose()
      database.close()
      peer.close()
      await rm(directory, { recursive: true, force: true })
    }
  })
}

for (const acknowledgement of ['returned', 'lost'] as const) {
  it(`preserves post-commit retirement through settlement and recovery - ${acknowledgement}`, async () => {
    const parentDirectory = resolve('tmp/tool-library-tests')
    await mkdir(parentDirectory, { recursive: true })
    const directory = await mkdtemp(resolve(parentDirectory, 'committed-'))
    const open = () =>
      createLocalToolStore({
        directory,
        capacity: 16,
        recordBytes: 65536,
        totalBytes: 1048576
      })
    const database = await open()
    const peer = await open()
    const management = createAiToolStoreManagement({
      store: peer,
      capacity: 16
    })
    let retireAfterCommit = false
    let committedVersion: string | undefined
    const observations: { name: string; phase: string; output?: unknown }[] = []
    const store: AiToolStore = {
      read: (key) => database.read(key),
      list: (limit) => database.list(limit),
      write: async (input) => {
        const ack = await database.write(input)
        if (retireAfterCommit) {
          retireAfterCommit = false
          committedVersion = ack.version
          expect(
            await management.setState({
              name: 'double-write',
              revision: 1,
              expectedVersion: ack.version,
              availability: 'retired'
            })
          ).toMatchObject({ status: 'saved', availability: 'retired' })
          if (acknowledgement === 'lost')
            throw new Error('Committed acknowledgement was lost')
        }
        return ack
      }
    }
    const first = setup(store, 'author', {
      observe: (event: {
        call: { name: string }
        phase: string
        output?: unknown
      }) => {
        observations.push({
          name: event.call.name,
          phase: event.phase,
          output: event.output
        })
      }
    })
    let next: ReturnType<typeof setup> | undefined
    try {
      expect(
        await first.host.submit({ submissionId: 'one', proposal: recipe() })
      ).toMatchObject({ ok: true })
      retireAfterCommit = true
      const result = await first.host.invoke({ name: 'double-write', input: 7 })
      expect(result.execution).toMatchObject({ status: 'success', value: 7 })
      if (acknowledgement === 'returned') {
        expect(result.storage).toEqual({
          status: 'saved',
          availability: 'eligible',
          version: committedVersion
        })
        expect(result.receiptId).toBeUndefined()
      } else {
        expect(result.storage).toMatchObject({ status: 'unsaved' })
        expect(result.receiptId).toEqual(expect.any(String))
        expect(
          await first.host.save({
            name: 'double-write',
            revision: 1,
            receiptId: result.receiptId
          })
        ).toMatchObject({ status: 'unsaved' })
      }
      const saving = observations.filter(
        (event) => event.name === 'tool_library.save_tool'
      )
      expect(saving.map((event) => event.phase)).toEqual([
        'started',
        'completed'
      ])
      expect(saving[1].output).toEqual(result.storage)
      expect(
        await first.host.invoke({ name: 'double-write', input: 8 })
      ).toMatchObject({
        execution: { status: 'failed', settlement: 'not-started' }
      })
      expect(first.execute.mock.calls.map((call) => call[0])).toEqual([7, 7])
      await first.host.dispose()
      database.close()
      next = setup(peer, 'next-request')
      const loaded = await next.host.load()
      expect(loaded.loaded).toEqual([])
      expect(loaded.unavailable).toContainEqual({
        key: JSON.stringify(['double-write', 1]),
        reason: 'retired'
      })
      expect(await management.read('double-write', 1)).toMatchObject({
        availability: 'retired'
      })
      expect(next.execute).not.toHaveBeenCalled()
    } finally {
      await first.host.dispose()
      await next?.host.dispose()
      database.close()
      peer.close()
      await rm(directory, { recursive: true, force: true })
    }
  })
}

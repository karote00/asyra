import { expect, it } from 'vitest'
import { vi } from 'vitest'
import { createAiActionRegistry } from '../action-registry.js'
import { createAiToolLibrary } from '../tool-library.js'
import {
  createAiRecipeInvoker,
  type AiRecipeInvokerOptions
} from '../recipe-execution.js'
import {
  createAiToolPersistence,
  createAiToolStoreManagement,
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
const setup = (
  store: AiToolStore,
  validate: AiRecipeInvokerOptions['validate'] = (value) =>
    typeof value === 'number' ? undefined : 'Expected number'
) => {
  const registry = createAiActionRegistry()
  const writes: unknown[] = []
  const scalar = { type: 'number' }
  registry.register({
    name: 'set',
    description: 'Set a fresh value.',
    revision: 1,
    inputSchema: scalar,
    outputSchema: scalar,
    recoveryOutputSchema: scalar,
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
  const observations: unknown[] = []
  const execute = vi.fn<AiRecipeInvokerOptions['execute']>(async (call) => {
    writes.push(call.input)
    return { status: 'success', settlement: 'completed', value: call.input }
  })
  const retain = vi.fn<AiRecipeInvokerOptions['leases']['retain']>(
    async () => undefined
  )
  const runner = createAiRecipeInvoker({
    observe: (event) => {
      observations.push(event)
    },
    registry,
    recipe: library.recipe,
    validate,
    execute,
    maxSteps: 16,
    leases: {
      open: async () => undefined,
      retain,
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
  return {
    registry,
    library,
    runner,
    persistence,
    writes,
    register,
    observations,
    execute,
    retain
  }
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
  expect(host.observations).toContainEqual(
    expect.objectContaining({
      phase: 'started',
      revision: 1,
      recipeStep: { name: 'reusable', revision: 1, id: 'apply' }
    })
  )
  host.execute.mockResolvedValueOnce({
    status: 'failed',
    settlement: 'not-started',
    value: 8
  })
  host.retain.mockClear()
  const stopped = await host.runner.invoke({
    name: 'nested',
    requestId: 'author',
    input: 8
  })
  expect(stopped).toMatchObject({
    status: 'failed',
    settlement: 'not-started',
    recovery: [{ name: 'set', status: 'failed', value: 8 }]
  })
  expect(host.execute).toHaveBeenCalledTimes(3)
  expect(host.writes).toEqual([8, 8])
  expect(host.retain).toHaveBeenCalledTimes(3)
  expect(host.retain).toHaveBeenLastCalledWith(
    expect.objectContaining({
      value: 8,
      outputSchema: scalar,
      toCallId: undefined
    })
  )
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

it('recipe proof saves nested candidates dependency-first without replay', async () => {
  const { store, entries } = memoryStore()
  const host = setup(store)
  expect(host.register().ok).toBe(true)
  expect(
    host.library.submit({
      requestId: 'author',
      submissionId: 'parent',
      proposal: {
        format: 1,
        name: 'nested',
        revision: 1,
        description: 'Apply through a private candidate.',
        inputSchema: { type: 'number' },
        outputSchema: { type: 'number' },
        steps: [
          {
            id: 'child',
            tool: 'reusable',
            revision: 1,
            input: { kind: 'input', path: '' }
          }
        ],
        output: { kind: 'step', step: 'child', path: '' }
      }
    }).ok
  ).toBe(true)
  const receipt = await host.runner.invoke({
    name: 'nested',
    requestId: 'author',
    input: 3
  })
  expect(receipt).toMatchObject({
    status: 'success',
    settlement: 'completed',
    value: 3
  })
  const request = { name: 'nested', revision: 1, requestId: 'author', receipt }
  const write = store.write
  store.write = vi.fn(async (input) => {
    if (input.key === JSON.stringify(['reusable', 1]))
      throw new Error('Child store unavailable')
    return write(input)
  })
  expect(await host.persistence.save(request)).toMatchObject({
    status: 'unsaved',
    issue: expect.stringContaining('Child store unavailable')
  })
  expect(entries.size).toBe(0)
  store.write = write
  expect(
    await host.persistence.save({ ...request, receipt: { ...receipt } })
  ).toMatchObject({ status: 'unsaved' })
  expect(entries.size).toBe(0)
  expect(await host.persistence.save(request)).toMatchObject({
    status: 'saved',
    availability: 'eligible'
  })
  expect([...entries.keys()]).toEqual([
    JSON.stringify(['reusable', 1]),
    JSON.stringify(['nested', 1])
  ])
  const versions = [...entries.values()].map((entry) => entry.version)
  expect(await host.persistence.save(request)).toMatchObject({
    status: 'saved'
  })
  expect([...entries.values()].map((entry) => entry.version)).toEqual(versions)
  expect(host.writes).toEqual([3])
  const fresh = setup(store)
  expect(await fresh.persistence.load('fresh')).toMatchObject({
    loaded: ['reusable', 'nested'],
    unavailable: []
  })
  expect(fresh.writes).toEqual([])
  expect(
    await fresh.runner.invoke({ name: 'nested', requestId: 'fresh', input: 12 })
  ).toMatchObject({ status: 'success', value: 12 })
  expect(fresh.writes).toEqual([12])
  const child = entries.get(JSON.stringify(['reusable', 1]))
  if (!child) throw new Error('Missing saved child')
  expect(
    await createAiToolStoreManagement({ store, capacity: 32 }).setState({
      name: 'reusable',
      revision: 1,
      expectedVersion: child.version,
      availability: 'retired'
    })
  ).toMatchObject({ status: 'saved' })
  expect(await host.persistence.save(request)).toMatchObject({
    status: 'unsaved'
  })
  expect(host.writes).toEqual([3])
})

const boundedProposal = (host: ReturnType<typeof setup>) => {
  host.registry.register({
    name: 'verify',
    description: 'Check the scalar constraint.',
    revision: 1,
    inputSchema: { type: 'number' },
    outputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['status', 'progress', 'remaining'],
      properties: {
        status: {
          type: 'string',
          enum: ['pass', 'repairable', 'decision-required']
        },
        progress: { type: 'string', minLength: 1 },
        remaining: { type: 'number' }
      }
    },
    effect: 'read',
    resources: ['value'],
    composition: 'allowed',
    verification: { statusPath: '/status', progressPath: '/progress' },
    lifecycle: {
      cancellation: 'cooperative',
      retry: 'read-only',
      output: 'value'
    },
    execute: async () => ({ status: 'pass', progress: 'current' })
  })
  const proposal = {
    format: 1,
    name: 'bounded',
    revision: 1,
    description: 'Correct a scalar within a finite budget.',
    inputSchema: { type: 'number' },
    outputSchema: { type: 'number' },
    steps: [
      {
        id: 'initial',
        tool: 'set',
        revision: 1,
        input: { kind: 'input', path: '' }
      }
    ],
    iteration: {
      id: 'verified',
      stateSchema: { type: 'number' },
      state: { kind: 'step', step: 'initial', path: '' },
      check: {
        id: 'check',
        tool: 'verify',
        revision: 1,
        input: { kind: 'state', path: '' }
      },
      repairs: [
        {
          id: 'repair',
          tool: 'set',
          revision: 1,
          input: { kind: 'step', step: 'check', path: '/remaining' }
        }
      ],
      next: { kind: 'step', step: 'repair', path: '' },
      maxIterations: 2
    },
    output: { kind: 'step', step: 'verified', path: '/state' }
  }
  return proposal
}

it('recipe proof admits bounded state repair only from domain verification contracts', () => {
  const host = setup(memoryStore().store)
  const proposal = boundedProposal(host)
  expect(
    host.library.submit({
      requestId: 'author',
      submissionId: 'bounded',
      proposal
    }).ok
  ).toBe(true)
  expect(host.execute).not.toHaveBeenCalled()
  proposal.name = 'unbounded'
  proposal.iteration.maxIterations = Number.MAX_SAFE_INTEGER
  expect(
    host.library.submit({
      requestId: 'author',
      submissionId: 'invalid',
      proposal
    }).ok
  ).toBe(false)
  expect(
    host.registry.registration('unbounded', { requestId: 'author' })
  ).toBeUndefined()
})

const boundedHost = (store: AiToolStore) => {
  const host = setup(store, (value, schema) => {
    const type = (schema as { type: string }).type
    if (type === 'number')
      return typeof value === 'number' && Number.isFinite(value)
        ? undefined
        : 'Expected number'
    const check = value as
      { status?: unknown; progress?: unknown; remaining?: unknown } | undefined
    return check &&
      ['pass', 'repairable', 'decision-required'].includes(
        String(check.status)
      ) &&
      typeof check.progress === 'string' &&
      check.progress.length > 0 &&
      typeof check.remaining === 'number'
      ? undefined
      : 'Invalid check receipt'
  })
  const proposal = boundedProposal(host)
  host.execute.mockImplementation(async (call) => {
    if (call.name === 'verify')
      return {
        status: 'success',
        settlement: 'completed',
        value: {
          status: Number(call.input) <= 0 ? 'pass' : 'repairable',
          progress: `remaining:${call.input}`,
          remaining: Number(call.input) - 1
        }
      }
    host.writes.push(call.input)
    return { status: 'success', settlement: 'completed', value: call.input }
  })
  return { ...host, proposal }
}

it('recipe proof repairs once per unresolved state and returns actual stopped progress', async () => {
  const store = memoryStore().store
  const first = boundedHost(store)
  expect(
    first.library.submit({
      requestId: 'author',
      submissionId: 'bounded',
      proposal: first.proposal
    }).ok
  ).toBe(true)
  const receipt = await first.runner.invoke({
    name: 'bounded',
    requestId: 'author',
    input: 2
  })
  expect(receipt).toMatchObject({ status: 'success', value: 0, issues: [] })
  expect(first.writes).toEqual([2, 1, 0])
  expect(first.observations).toContainEqual(
    expect.objectContaining({
      recipeStep: {
        name: 'bounded',
        revision: 1,
        id: 'repair',
        iteration: 2
      }
    })
  )
  const stopped = await first.runner.invoke({
    name: 'bounded',
    requestId: 'author',
    input: 5
  })
  expect(stopped.status).toBe('failed')
  expect(stopped.issues).toContain('Repair iteration budget exhausted')
  expect(stopped.recovery?.length).toBeGreaterThan(0)
  expect(
    first.retain.mock.calls.some(
      ([item]) => item.toCallId === undefined && item.value === 3
    )
  ).toBe(true)
})

it('recipe proof refuses nested repair expansion before publishing the candidate', () => {
  const host = setup(memoryStore().store)
  const proposal = boundedProposal(host)
  const nested = {
    format: 1,
    name: 'nested-repair',
    revision: 1,
    description: 'A declared six-step correction.',
    inputSchema: { type: 'number' },
    outputSchema: { type: 'number' },
    steps: Array.from({ length: 6 }, (_, index) => ({
      id: `part${index}`,
      tool: 'set',
      revision: 1,
      input: { kind: 'input', path: '' }
    })),
    output: { kind: 'step', step: 'part5', path: '' }
  }
  expect(
    host.library.submit({
      requestId: 'author',
      submissionId: 'nested',
      proposal: nested
    }).ok
  ).toBe(true)
  proposal.iteration.repairs[0].tool = 'nested-repair'
  expect(
    host.library.submit({
      requestId: 'author',
      submissionId: 'bounded',
      proposal
    }).ok
  ).toBe(false)
  expect(host.registry.get('bounded', { requestId: 'author' })).toBeUndefined()
  expect(host.execute).not.toHaveBeenCalled()
})

it('recipe proof saves and reloads the complete bounded iteration without replay', async () => {
  const { store, entries } = memoryStore()
  const first = boundedHost(store)
  expect(
    first.library.submit({
      requestId: 'author',
      submissionId: 'bounded',
      proposal: first.proposal
    }).ok
  ).toBe(true)
  const receipt = await first.runner.invoke({
    name: 'bounded',
    requestId: 'author',
    input: 2
  })
  const save = { name: 'bounded', revision: 1, requestId: 'author', receipt }
  vi.mocked(store.write).mockRejectedValueOnce(new Error('Storage offline'))
  expect(await first.persistence.save(save)).toMatchObject({
    status: 'unsaved'
  })
  expect(first.writes).toEqual([2, 1, 0])
  expect(await first.persistence.save(save)).toMatchObject({
    status: 'saved',
    availability: 'eligible'
  })
  expect(first.writes).toEqual([2, 1, 0])
  expect(JSON.stringify([...entries.values()])).toContain('maxIterations')
  const next = boundedHost(store)
  expect(await next.persistence.load('next')).toMatchObject({
    loaded: ['bounded'],
    unavailable: []
  })
  expect(next.writes).toEqual([])
  expect(
    await next.runner.invoke({ name: 'bounded', requestId: 'next', input: 1 })
  ).toMatchObject({ status: 'success', value: 0 })
  expect(next.writes).toEqual([1, 0])
  const stopped = await next.runner.invoke({
    name: 'bounded',
    requestId: 'next',
    input: 5
  })
  expect(
    await next.persistence.save({
      ...save,
      requestId: 'next',
      receipt: stopped
    })
  ).toMatchObject({ status: 'unsaved' })
  expect(next.writes).toEqual([1, 0, 5, 4, 3])
  expect(await next.persistence.load('next')).toMatchObject({
    loaded: ['bounded'],
    unavailable: []
  })
  const changed = boundedHost(store)
  const verifier = changed.registry.get('verify')
  if (!verifier) throw new Error('Missing verifier')
  changed.registry.remove('verify', 1)
  changed.registry.register({
    ...verifier,
    description: 'Changed verification contract.'
  })
  const unavailable = await changed.persistence.load('changed')
  expect(unavailable.loaded).toEqual([])
  expect(unavailable.unavailable).toHaveLength(1)
  expect(changed.execute).not.toHaveBeenCalled()
  const saved = [...entries.values()][0]
  const corrupted = JSON.parse(JSON.stringify(saved.record))
  corrupted.body.iteration.maxIterations = 0
  await store.write({
    key: saved.key,
    expectedVersion: saved.version,
    record: corrupted
  })
  const corruptHost = boundedHost(store)
  expect((await corruptHost.persistence.load('corrupt')).loaded).toEqual([])
  expect(corruptHost.execute).not.toHaveBeenCalled()
})

it('resumes a bounded candidate privately without executing or losing its iteration', async () => {
  const { store } = memoryStore()
  const first = boundedHost(store)
  expect(
    first.library.submit({
      requestId: 'author',
      submissionId: 'bounded',
      proposal: first.proposal
    }).ok
  ).toBe(true)
  expect(
    await first.persistence.save({
      name: 'bounded',
      revision: 1,
      requestId: 'author'
    })
  ).toMatchObject({ status: 'saved', availability: 'candidate' })
  const next = boundedHost(store)
  const input = { name: 'bounded', revision: 1, requestId: 'next' }
  const resumed = await next.persistence.resume(input)
  expect(resumed).toMatchObject({ ok: true })
  expect(await next.persistence.resume(input)).toEqual(resumed)
  expect(next.registry.get('bounded')).toBeUndefined()
  expect(next.registry.get('bounded', { requestId: 'next' })).toBeDefined()
  expect(next.writes).toEqual([])
  expect(
    await next.runner.invoke({ name: 'bounded', requestId: 'next', input: 1 })
  ).toMatchObject({ status: 'success', value: 0 })
  expect(next.writes).toEqual([1, 0])
})

it('recipe proof confirms durable authority after asynchronous preparation without replay', async () => {
  for (const mode of ['save', 'load', 'resume'] as const) {
    for (const availability of ['suspended', 'retired'] as const) {
      const { store } = memoryStore()
      const first = setup(store)
      expect(first.register().ok).toBe(true)
      const receipt =
        mode === 'resume'
          ? undefined
          : await first.runner.invoke({
              name: 'reusable',
              requestId: 'author',
              input: 4
            })
      expect(
        await first.persistence.save({
          name: 'reusable',
          revision: 1,
          requestId: 'author',
          receipt
        })
      ).toMatchObject({ status: 'saved' })
      const read = store.read
      const list = store.list
      const management = createAiToolStoreManagement({
        store: { ...store, read, list },
        capacity: 32
      })
      let changed = false
      const retireSnapshot = async () => {
        if (changed) return
        changed = true
        const entry = await management.read('reusable', 1)
        if (!entry) throw new Error('Missing current durable revision')
        expect(
          await management.setState({
            name: 'reusable',
            revision: 1,
            expectedVersion: entry.version,
            availability
          })
        ).toMatchObject({ status: 'saved' })
      }
      store.read = async (key) => {
        const snapshot = await read(key)
        if (mode !== 'load') await retireSnapshot()
        return snapshot
      }
      store.list = async (limit) => {
        const snapshot = await list(limit)
        if (mode === 'load') await retireSnapshot()
        return snapshot
      }
      const next = setup(store)
      if (mode === 'save') {
        expect(
          await first.persistence.save({
            name: 'reusable',
            revision: 1,
            requestId: 'author',
            receipt
          })
        ).toMatchObject({ status: 'unsaved' })
      } else if (mode === 'load') {
        expect((await next.persistence.load('fresh')).loaded).toEqual([])
      } else {
        expect(
          await next.persistence.resume({
            name: 'reusable',
            revision: 1,
            requestId: 'fresh'
          })
        ).toMatchObject({ ok: false })
      }
      expect(changed).toBe(true)
      expect((await management.read('reusable', 1))?.availability).toBe(
        availability
      )
      expect(
        next.registry.get('reusable', { requestId: 'fresh' })
      ).toBeUndefined()
      expect(next.writes).toEqual([])
      expect(first.writes).toEqual(mode === 'resume' ? [] : [4])
      // A retry after an authoritative retirement must never revive or execute it.
      expect(
        await first.persistence.save({
          name: 'reusable',
          revision: 1,
          requestId: 'author',
          receipt
        })
      ).toMatchObject({ status: 'unsaved' })
      expect(first.writes).toEqual(mode === 'resume' ? [] : [4])
    }
  }
})

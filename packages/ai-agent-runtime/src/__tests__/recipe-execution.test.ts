import { describe, expect, it, vi } from 'vitest'
import { createAiActionRegistry } from '../action-registry.js'
import { createAiToolLibrary } from '../tool-library.js'
import {
  createAiRecipeInvoker,
  type AiRecipeExecutionResult,
  type AiRecipeLeaseAdapter
} from '../recipe-execution.js'
import type { AiInvocationContext } from '../invocation.js'

const number = { type: 'number' }
const success = (value: unknown): AiRecipeExecutionResult => ({
  value,
  status: 'success',
  settlement: 'completed',
  calls: [],
  issues: []
})
const setup = (
  execute?: (call: AiInvocationContext) => Promise<AiRecipeExecutionResult>,
  maxSteps = 20
) => {
  const registry = createAiActionRegistry()
  const writes: unknown[] = []
  const host =
    execute ??
    (async (call) => {
      writes.push(call.input)
      return success(call.input)
    })
  registry.register({
    name: 'set',
    description: 'Set the current value.',
    revision: 1,
    inputSchema: number,
    outputSchema: number,
    effect: 'mutation',
    resources: ['value'],
    composition: 'allowed',
    lifecycle: { cancellation: 'cooperative', retry: 'never', output: 'value' },
    execute: async (input) => input
  })
  const validate = (value: unknown, schema: unknown) =>
    (schema as { type: string }).type === 'number' && typeof value !== 'number'
      ? 'Expected number'
      : undefined
  const library = createAiToolLibrary({
    registry,
    validate,
    capacity: 20,
    limits: {
      steps: 20,
      bindings: 50,
      bindingDepth: 12,
      bytes: 8000,
      issues: 8
    },
    createExecutor: () => async (input) => input
  })
  const events: string[] = []
  const observations: unknown[] = []
  const leases = {
    open: vi.fn(async () => undefined),
    retain: vi.fn<AiRecipeLeaseAdapter['retain']>(async () => undefined),
    release: vi.fn(async () => undefined)
  }
  const runner = createAiRecipeInvoker({
    registry,
    recipe: library.recipe,
    validate,
    execute: host,
    leases,
    maxSteps,
    observe: (event) => {
      events.push(`${event.call.name}:${event.phase}`)
      observations.push(event)
    }
  })
  const register = (name: string, tools: string[]) => {
    const result = library.submit({
      requestId: 'author',
      submissionId: name,
      proposal: {
        format: 1,
        name,
        description: `Run ${name}.`,
        revision: 1,
        inputSchema: number,
        outputSchema: number,
        steps: tools.map((tool, i) => ({
          id: `s${i}`,
          tool,
          revision: 1,
          input: i
            ? { kind: 'step', step: `s${i - 1}`, path: '' }
            : { kind: 'input', path: '' }
        })),
        output: { kind: 'step', step: `s${tools.length - 1}`, path: '' }
      }
    })
    expect(result.ok).toBe(true)
  }
  return {
    registry,
    library,
    runner,
    writes,
    leases,
    events,
    observations,
    register
  }
}

describe('pinned recipe invocation', () => {
  it('uses one secured leaf scheduler for nested recipes without a parent barrier', async () => {
    let busy = false
    const host = vi.fn(async (call: AiInvocationContext) => {
      expect(busy).toBe(false)
      busy = true
      await Promise.resolve()
      busy = false
      return success(call.input)
    })
    const { register, runner, events } = setup(host)
    register('inner', ['set', 'set'])
    register('outer', ['inner', 'set'])
    const result = await runner.invoke({
      name: 'outer',
      requestId: 'author',
      input: 5
    })
    expect(result).toMatchObject({
      status: 'success',
      settlement: 'completed',
      value: 5
    })
    expect(host).toHaveBeenCalledTimes(3)
    expect(host.mock.calls.every(([call]) => call.name === 'set')).toBe(true)
    expect(events.filter((event) => event.endsWith(':started'))).toEqual([
      'outer:started',
      'inner:started',
      'set:started',
      'set:started',
      'set:started'
    ])
  })

  it('validates actual results and stops successors after malformed output', async () => {
    const host = vi.fn(async () => success('wrong'))
    const { register, runner } = setup(host)
    register('chain', ['set', 'set'])
    const result = await runner.invoke({
      name: 'chain',
      requestId: 'author',
      input: 5
    })
    expect(result.status).not.toBe('success')
    expect(result.settlement).toBe('partial')
    expect(result.issues.join(' ')).toContain('Expected number')
    expect(host).toHaveBeenCalledOnce()
  })

  it.each(['partial', 'unknown', 'failed'] as const)(
    'stops without replay after a %s host result',
    async (status) => {
      const host = vi.fn(async () => ({
        ...success(2),
        status,
        settlement: 'unknown' as const
      }))
      const { register, runner } = setup(host)
      register('chain', ['set', 'set'])
      const result = await runner.invoke({
        name: 'chain',
        requestId: 'author',
        input: 5
      })
      expect(result.status).not.toBe('success')
      expect(result.settlement).toBe('unknown')
      expect(host).toHaveBeenCalledOnce()
    }
  )

  it('cancels between leaves and preserves completed work', async () => {
    const controller = new AbortController()
    const host = vi.fn(async () => {
      controller.abort()
      return success(2)
    })
    const { register, runner } = setup(host)
    register('chain', ['set', 'set'])
    const result = await runner.invoke({
      name: 'chain',
      requestId: 'author',
      input: 5,
      signal: controller.signal
    })
    expect(result.status).not.toBe('success')
    expect(result.settlement).toBe('partial')
    expect(host).toHaveBeenCalledOnce()
  })

  it('retains child values for their caller before releasing local leases', async () => {
    const { register, runner, leases } = setup()
    register('chain', ['set', 'set'])
    const order: string[] = []
    leases.retain.mockImplementation(async () => {
      order.push('retain')
    })
    leases.release.mockImplementation(async () => {
      order.push('release')
    })
    const result = await runner.invoke({
      name: 'chain',
      requestId: 'author',
      input: 5
    })
    expect(result.status).toBe('success')
    expect(order).toEqual([
      'retain',
      'release',
      'retain',
      'release',
      'retain',
      'release'
    ])
    expect(leases.retain).toHaveBeenLastCalledWith(
      expect.objectContaining({
        requestId: 'author',
        toCallId: undefined,
        value: 5
      })
    )
  })

  it('pins the admitted graph before writes and does not switch to a newly published revision', async () => {
    let first = true
    const { registry, register, runner } = setup(async (call) => {
      if (first) {
        first = false
        registry.remove('set', 1)
      }
      return success(call.input)
    })
    register('chain', ['set', 'set'])
    expect(
      (await runner.invoke({ name: 'chain', requestId: 'author', input: 5 }))
        .status
    ).toBe('success')
    expect(
      (await runner.invoke({ name: 'chain', requestId: 'author', input: 5 }))
        .settlement
    ).toBe('not-started')
  })

  it('does not expose a private candidate or dispatch invalid arguments', async () => {
    const host = vi.fn(async (call) => success(call.input))
    const { register, runner } = setup(host)
    register('chain', ['set'])
    expect(
      (await runner.invoke({ name: 'chain', requestId: 'other', input: 5 }))
        .settlement
    ).toBe('not-started')
    expect(
      (
        await runner.invoke({
          name: 'chain',
          requestId: 'author',
          input: 'invalid'
        })
      ).settlement
    ).toBe('not-started')
    expect(host).not.toHaveBeenCalled()
  })

  it('keeps product settlement when cleanup fails and records incompleteness', async () => {
    const { register, runner, leases } = setup()
    register('chain', ['set'])
    leases.release.mockRejectedValue(new Error('release unavailable'))
    const result = await runner.invoke({
      name: 'chain',
      requestId: 'author',
      input: 5
    })
    expect(result.settlement).not.toBe('not-started')
    expect(result.issues.join(' ')).toContain('release unavailable')
  })
})

it('reports completion only after output retention and cleanup, including already-aborted call identity', async () => {
  const { runner, register, events, leases } = setup()
  register('chain', ['set'])
  leases.release.mockImplementation(async () => {
    expect(events[events.length - 1]).not.toBe('chain:completed')
  })
  expect(
    (await runner.invoke({ name: 'chain', requestId: 'author', input: 3 }))
      .status
  ).toBe('success')
  const controller = new AbortController()
  controller.abort()
  const result = await runner.invoke({
    name: 'chain',
    requestId: 'author',
    input: 3,
    signal: controller.signal
  })
  expect(result.calls[0].callId).not.toBe('')
  expect(result.settlement).toBe('not-started')
})

it('keeps exported and borrowed handles alive while releasing only local ownership', async () => {
  const registry = createAiActionRegistry()
  const ref = { type: 'string', 'x-runtime-value': 'request' }
  const owners = new Map<string, Set<string>>([
    ['request:author', new Set(['borrowed'])],
    ['sibling', new Set(['shared'])]
  ])
  const live = (handle: string) =>
    [...owners.values()].some((values) => values.has(handle))
  let lease = 0
  const leases = {
    open: async ({ callId }: { callId: string }) => {
      owners.set(callId, new Set())
    },
    retain: async ({
      requestId,
      fromCallId,
      toCallId,
      value
    }: {
      requestId: string
      fromCallId: string
      toCallId?: string
      value: unknown
    }) => {
      const handle = String(value)
      expect(live(handle)).toBe(true)
      expect(owners.has(fromCallId)).toBe(true)
      const caller = toCallId ?? `request:${requestId}`
      owners.get(caller)?.add(handle)
    },
    release: async ({ callId }: { callId: string }) => {
      owners.delete(callId)
    }
  }
  registry.register({
    name: 'resolve',
    description: 'Create a fresh retained handle.',
    revision: 1,
    composition: 'allowed',
    inputSchema: ref,
    outputSchema: ref,
    effect: 'prepare',
    resources: ['handles'],
    lifecycle: {
      cancellation: 'cooperative',
      retry: 'never',
      output: 'request-artifact'
    },
    execute: async (input) => input
  })
  const validate = (value: unknown) =>
    typeof value === 'string' ? undefined : 'Expected handle'
  const library = createAiToolLibrary({
    registry,
    validate,
    capacity: 5,
    limits: {
      steps: 10,
      bindings: 20,
      bindingDepth: 8,
      bytes: 8000,
      issues: 8
    },
    createExecutor: () => async (input) => input
  })
  expect(
    library.submit({
      requestId: 'author',
      submissionId: 'one',
      proposal: {
        format: 1,
        name: 'chain',
        description: 'Reuse retained handles.',
        revision: 1,
        inputSchema: ref,
        outputSchema: ref,
        steps: [
          {
            id: 'first',
            tool: 'resolve',
            revision: 1,
            input: { kind: 'input', path: '' }
          },
          {
            id: 'second',
            tool: 'resolve',
            revision: 1,
            input: { kind: 'step', step: 'first', path: '' }
          }
        ],
        output: { kind: 'step', step: 'second', path: '' }
      }
    }).ok
  ).toBe(true)
  const runner = createAiRecipeInvoker({
    registry,
    recipe: library.recipe,
    validate,
    leases,
    maxSteps: 10,
    execute: async (call) => {
      expect(live(String(call.input))).toBe(true)
      const handle = `created-${++lease}`
      owners.get(call.callId)?.add(handle)
      return success(handle)
    }
  })
  const result = await runner.invoke({
    name: 'chain',
    requestId: 'author',
    input: 'borrowed'
  })
  expect(result).toMatchObject({ status: 'success', value: 'created-2' })
  expect(live('created-1')).toBe(false)
  expect(live('created-2')).toBe(true)
  expect(live('borrowed')).toBe(true)
  expect(live('shared')).toBe(true)
  expect(owners.size).toBe(2)
  owners.delete('request:author')
  expect(live('created-2')).toBe(false)
  expect(live('shared')).toBe(true)
})

it('cleans an allocated call scope when opening fails before product dispatch', async () => {
  const host = setup()
  host.leases.open.mockImplementation(async () => {
    throw new Error('Partial scope initialization')
  })
  expect(
    await host.runner.invoke({ name: 'set', requestId: 'author', input: 3 })
  ).toMatchObject({ status: 'failed', settlement: 'not-started' })
  expect(host.leases.release).toHaveBeenCalledOnce()
  expect(host.writes).toEqual([])
})

it('hands the pinned schemas to host reference ownership before cleanup', async () => {
  const host = setup()
  host.register('chain', ['set', 'set'])
  const result = await host.runner.invoke({
    name: 'chain',
    requestId: 'author',
    input: 5
  })
  expect(result.status).toBe('success')
  expect(host.leases.open).toHaveBeenCalledWith(
    expect.objectContaining({ input: 5, inputSchema: number })
  )
  expect(host.leases.retain).toHaveBeenCalledWith(
    expect.objectContaining({ value: 5, outputSchema: number })
  )
})

it('uses the declared partial schema when retaining useful partial references', async () => {
  const host = setup(async () => ({
    status: 'partial',
    settlement: 'partial',
    value: { handle: 'retained' },
    calls: [],
    issues: []
  }))
  const partialSchema = {
    type: 'object',
    properties: { handle: { type: 'string', 'x-runtime-value': 'request' } }
  }
  host.registry.register({
    name: 'partial',
    description: 'Return partial progress.',
    revision: 1,
    inputSchema: number,
    outputSchema: number,
    partialOutputSchema: partialSchema,
    effect: 'mutation',
    resources: ['document'],
    composition: 'allowed',
    lifecycle: { cancellation: 'cooperative', retry: 'never', output: 'value' },
    execute: async () => 0
  })
  const result = await host.runner.invoke({
    name: 'partial',
    requestId: 'author',
    input: 5
  })
  expect(result.status).toBe('partial')
  expect(host.leases.retain).toHaveBeenCalledWith(
    expect.objectContaining({
      outputSchema: partialSchema,
      value: { handle: 'retained' }
    })
  )
})

it.each(['failed', 'unknown'] as const)(
  'retains declared %s leaf recovery without executing successors',
  async (status) => {
    const host = setup(async () => ({
      status,
      settlement: 'unknown',
      value: 'repair-handle',
      calls: [],
      issues: []
    }))
    const recoveryOutputSchema = {
      type: 'string',
      'x-runtime-value': 'request'
    }
    host.registry.register({
      name: 'recoverable',
      description: 'Return a repair handle.',
      revision: 1,
      inputSchema: number,
      outputSchema: number,
      recoveryOutputSchema,
      effect: 'prepare',
      resources: ['request-artifacts'],
      composition: 'allowed',
      lifecycle: {
        cancellation: 'cooperative',
        retry: 'never',
        output: 'request-artifact'
      },
      execute: async () => 0
    })
    const result = await host.runner.invoke({
      name: 'recoverable',
      requestId: 'author',
      input: 5
    })
    expect(result).toMatchObject({
      status,
      settlement: 'unknown',
      value: 'repair-handle'
    })
    expect(host.leases.retain).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 'repair-handle',
        outputSchema: recoveryOutputSchema
      })
    )
  }
)

it('observes exact recipe steps and pinned revisions for repeated nested leaf calls', async () => {
  const host = setup()
  host.register('inner', ['set', 'set'])
  host.register('outer', ['inner', 'set'])
  await host.runner.invoke({ name: 'outer', requestId: 'author', input: 5 })
  const starts = (
    host.observations as { phase: string; call: { name: string } }[]
  ).filter((event) => event.phase === 'started' && event.call.name === 'set')
  expect(starts).toMatchObject([
    { revision: 1, recipeStep: { name: 'inner', revision: 1, id: 's0' } },
    { revision: 1, recipeStep: { name: 'inner', revision: 1, id: 's1' } },
    { revision: 1, recipeStep: { name: 'outer', revision: 1, id: 's1' } }
  ])
})

it('exports validated stopped child values through every ancestor without running successors', async () => {
  let calls = 0
  const host = setup(async () =>
    ++calls === 1
      ? success(5)
      : {
          status: 'failed',
          settlement: 'not-started',
          value: 7,
          calls: [],
          issues: []
        }
  )
  const base = host.registry.get('set')
  if (!base) throw new Error('Missing registered fixture operation')
  host.registry.register({
    ...base,
    name: 'repairable',
    recoveryOutputSchema: number,
    execute: async () => 0
  })
  host.register('inner', ['set', 'repairable', 'set'])
  host.register('outer', ['inner', 'set'])
  const result = await host.runner.invoke({
    name: 'outer',
    requestId: 'author',
    input: 5
  })
  expect(calls).toBe(2)
  expect(result).toMatchObject({
    status: 'failed',
    settlement: 'partial',
    recovery: [
      { name: 'set', status: 'success', value: 5 },
      { name: 'repairable', status: 'failed', value: 7 }
    ]
  })
  // Two leaf exports, then both receipts through the inner and outer owners.
  expect(host.leases.retain).toHaveBeenCalledTimes(6)
  expect(host.leases.retain).toHaveBeenNthCalledWith(
    6,
    expect.objectContaining({
      value: 7,
      outputSchema: number,
      toCallId: undefined
    })
  )
})

describe('bounded repair execution', () => {
  const fixture = (mode = 'normal', maxSteps = 20) => {
    const calls: string[] = []
    const controller = new AbortController()
    let checks = 0
    const host = setup(async (call) => {
      calls.push(call.name)
      if (call.name === 'check') {
        checks++
        const value = Number(call.input)
        let status = value <= 0 ? 'pass' : 'repairable'
        if (mode === 'decision') status = 'decision-required'
        return success({
          status: mode === 'malformed' ? 'done' : status,
          progress: `remaining:${value}`
        })
      }
      if (call.name === 'repair') {
        if (mode === 'cancel') controller.abort()
        if (mode === 'partial' || mode === 'unknown')
          return {
            ...success(Number(call.input) - 1),
            status: mode,
            settlement: mode
          }
        if (mode === 'stuck') return success(call.input)
        if (mode === 'cycle') return success(3 - Number(call.input))
        return success(Number(call.input) - 1)
      }
      return success(call.input)
    }, maxSteps)
    const common = host.registry.get('set')
    if (!common) throw new Error('Missing scalar tool')
    host.registry.register({ ...common, name: 'repair' })
    host.registry.register({
      ...common,
      name: 'check',
      effect: 'read',
      verification: { statusPath: '/status', progressPath: '/progress' },
      outputSchema: {
        type: 'object',
        required: ['status', 'progress'],
        additionalProperties: false,
        properties: {
          status: {
            type: 'string',
            enum: ['pass', 'repairable', 'decision-required']
          },
          progress: { type: 'string', minLength: 1 }
        }
      }
    })
    const proposal = {
      format: 1,
      name: 'bounded',
      description: 'Apply once and repair declared scalar constraints.',
      revision: 1,
      inputSchema: number,
      outputSchema: number,
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
        stateSchema: number,
        state: { kind: 'step', step: 'initial', path: '' },
        check: {
          id: 'check',
          tool: 'check',
          revision: 1,
          input: { kind: 'state', path: '' }
        },
        repairs: [
          {
            id: 'repair',
            tool: 'repair',
            revision: 1,
            input: { kind: 'state', path: '' }
          }
        ],
        next: { kind: 'step', step: 'repair', path: '' },
        maxIterations: 3
      },
      output: { kind: 'step', step: 'verified', path: '/state' }
    }
    expect(
      host.library.submit({
        requestId: 'author',
        submissionId: 'bounded',
        proposal
      }).ok
    ).toBe(true)
    // The ordinary fixture host validates scalar shapes. Runtime must additionally
    // enforce the owner verification discriminant even with a permissive validator.
    const run = (input: number) =>
      host.runner.invoke({
        name: 'bounded',
        input,
        requestId: 'author',
        signal: controller.signal
      })
    return { ...host, calls, run, proposal, controller, checks: () => checks }
  }

  it('checks before repair and completes several rounds without replaying initial work', async () => {
    const host = fixture()
    const result = await host.run(2)
    expect(result).toMatchObject({
      status: 'success',
      settlement: 'completed',
      value: 0
    })
    expect(host.calls).toEqual([
      'set',
      'check',
      'repair',
      'check',
      'repair',
      'check'
    ])
    expect(host.leases.open).toHaveBeenCalledTimes(7)
    expect(host.leases.release).toHaveBeenCalledTimes(7)
    expect(host.observations).toContainEqual(
      expect.objectContaining({
        recipeStep: { name: 'bounded', revision: 1, id: 'repair', iteration: 2 }
      })
    )
  })
  it('rejects nested worst-case expansion before initial writes even if input would pass', async () => {
    const host = fixture('normal', 10)
    host.register('outer', ['bounded', 'bounded'])
    const result = await host.runner.invoke({
      name: 'outer',
      requestId: 'author',
      input: 0
    })
    expect(result).toMatchObject({
      status: 'failed',
      settlement: 'not-started'
    })
    expect(result.issues.join(' ')).toContain('execution budget')
    expect(host.calls).toEqual([])
    expect(host.leases.open).not.toHaveBeenCalled()
  })
  it('pins changed checker dependencies before any mutation', async () => {
    const host = fixture()
    const check = host.registry.get('check')
    if (!check) throw new Error('Missing checker')
    host.registry.remove('check', 1)
    host.registry.register({
      ...check,
      description: 'Changed check semantics.'
    })
    const result = await host.run(0)
    expect(result.status).toBe('failed')
    expect(host.calls).toEqual([])
  })
  it('does not dispatch repairs for an already passing state', async () => {
    const host = fixture()
    expect(await host.run(0)).toMatchObject({ status: 'success', value: 0 })
    expect(host.calls).toEqual(['set', 'check'])
  })
  it.each([
    ['stuck', 'Repeated verification progress', 1],
    ['cycle', 'Repeated verification progress', 2],
    ['decision', 'Primary-agent decision required', 0],
    ['malformed', 'Invalid verification outcome', 0],
    ['normal', 'Repair iteration budget exhausted', 3]
  ])(
    'stops %s with actual recovery instead of false success',
    async (mode, reason, repairs) => {
      const host = fixture(String(mode))
      const result = await host.run(mode === 'cycle' ? 2 : 8)
      expect(result.status).toBe('failed')
      expect(result.value).toBeUndefined()
      expect(result.issues.join(' ')).toContain(reason)
      expect(host.calls.filter((name) => name === 'set')).toHaveLength(1)
      expect(host.calls.filter((name) => name === 'repair')).toHaveLength(
        Number(repairs)
      )
      expect(result.recovery?.length).toBeGreaterThan(0)
      expect(
        host.leases.retain.mock.calls.filter(
          ([item]) => item.toCallId === undefined
        )
      ).toHaveLength(result.recovery?.length ?? 0)
    }
  )
  it.each(['partial', 'unknown', 'cancel'])(
    'stops after %s without another check or replay',
    async (mode) => {
      const host = fixture(mode)
      const result = await host.run(2)
      expect(result.status).not.toBe('success')
      expect(host.calls).toEqual(['set', 'check', 'repair'])
      expect(host.leases.release).toHaveBeenCalledTimes(
        host.leases.open.mock.calls.length
      )
    }
  )
})

it('never exports a malformed own recovery when normalizing a thrown failure', async () => {
  const host = setup(async () => ({
    ...success('malformed'),
    status: 'failed',
    settlement: 'unknown'
  }))
  const primitive = host.registry.get('set')
  if (!primitive) throw new Error('Missing scalar tool')
  host.registry.register({
    ...primitive,
    name: 'recoverable',
    recoveryOutputSchema: number
  })
  const result = await host.runner.invoke({
    name: 'recoverable',
    requestId: 'author',
    input: 2
  })
  expect(result.status).toBe('unknown')
  expect(result.value).toBeUndefined()
  expect(host.leases.retain).not.toHaveBeenCalled()
  expect(host.leases.release).toHaveBeenCalledOnce()
})

it('does not advertise stopped resources whose transfer to the caller failed', async () => {
  let count = 0
  const host = setup(async (call) => {
    count++
    if (count === 2) throw new Error('Leaf unavailable')
    return success(call.input)
  })
  host.register('transfer-failure', ['set', 'set'])
  host.leases.retain.mockImplementation(async ({ toCallId }) => {
    if (toCallId === undefined) throw new Error('Caller retention failed')
  })
  const result = await host.runner.invoke({
    name: 'transfer-failure',
    requestId: 'author',
    input: 4
  })
  expect(result.status).not.toBe('success')
  expect(result.issues.join(' ')).toContain('Caller retention failed')
  expect(result.recovery ?? []).toEqual([])
  expect(result.calls.filter((call) => call.name === 'set')).toHaveLength(2)
})

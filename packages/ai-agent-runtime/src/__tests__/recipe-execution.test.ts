import { describe, expect, it, vi } from 'vitest'
import { createAiActionRegistry } from '../action-registry.js'
import { createAiToolLibrary } from '../tool-library.js'
import {
  createAiRecipeInvoker,
  type AiRecipeExecutionResult
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
  execute?: (call: AiInvocationContext) => Promise<AiRecipeExecutionResult>
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
  const leases = {
    open: vi.fn(async () => undefined),
    retain: vi.fn(async () => undefined),
    release: vi.fn(async () => undefined)
  }
  const runner = createAiRecipeInvoker({
    registry,
    recipe: library.recipe,
    validate,
    execute: host,
    leases,
    maxSteps: 20,
    observe: (event) => {
      events.push(`${event.call.name}:${event.phase}`)
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
  return { registry, library, runner, writes, leases, events, register }
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

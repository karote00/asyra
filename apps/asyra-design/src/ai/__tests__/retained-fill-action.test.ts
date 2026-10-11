import { expect, it, vi } from 'vitest'
import { createAiActionRegistry } from '@asyra/ai-agent-runtime'
import { createLocalOperationTools } from '../../../server/local-operation-tools'
import { prepareOperationBatch } from '../../../server/local-operation-batch'
vi.mock('../../contexts', () => ({ default: {} }))
vi.mock('../../common-apis/fills', () => ({ fillApis: {} }))
import { createRetainedDesignContext } from '../../common-apis/retained-design-context'
import { createRetainedFillAction } from '../retained-fill-action'

const targets = (ids: readonly string[]) =>
  ids.map((elementId) => ({ elementId, fillId: `fill-${elementId}` }))
const input = {
  mappings: [
    {
      snapshotId: 'retained',
      coordinateSpace: 'parent-local' as const,
      axis: 'x' as const,
      domain: [0, 100],
      index: 0,
      outside: 'clamp' as const,
      stops: [
        { at: 0, color: '#000000' },
        { at: 1, color: '#ffffff' }
      ]
    }
  ]
}
const snapshot = {
  coordinateSpace: 'parent-local',
  fields: ['x'],
  result: {
    missingIds: [],
    elements: [
      { id: 'a', properties: { x: 0 } },
      { id: 'b', properties: { x: 50 } },
      { id: 'c', properties: { x: 100 } }
    ]
  }
}
it('maps retained positions to one plural new-value fill call inside mutation admission', async () => {
  let admitted = false
  const get = vi.fn(() => {
    expect(admitted).toBe(true)
    return snapshot
  })
  const update = vi.fn()
  const action = createRetainedFillAction({ get } as never, {
    targets,
    metadata: () => ({ lock: false }),
    update
  })
  const result = await action.execute(input, {
    signal: new AbortController().signal,
    runMutation: async (write) => {
      admitted = true
      return write()
    }
  })
  expect(update).toHaveBeenCalledExactlyOnceWith([
    { elementId: 'a', fillId: 'fill-a', patch: { color: '#000000' } },
    { elementId: 'b', fillId: 'fill-b', patch: { color: '#808080' } },
    { elementId: 'c', fillId: 'fill-c', patch: { color: '#ffffff' } }
  ])
  expect(result).toMatchObject({ appliedCount: 3 })
})
it('rejects a reference invalidated while queued and performs no write', async () => {
  let stale = false
  const update = vi.fn()
  const action = createRetainedFillAction(
    {
      get: () => {
        if (stale) throw new Error('Retained query stale')
        return snapshot
      }
    } as never,
    { targets, metadata: () => ({}), update }
  )
  await expect(
    action.execute(input, {
      signal: new AbortController().signal,
      runMutation: async (write) => {
        stale = true
        return write()
      }
    })
  ).rejects.toThrow('stale')
  expect(update).not.toHaveBeenCalled()
})
it.each(['lock', 'missing', 'domain', 'nonfinite'])(
  'rejects %s before any write',
  async (reason) => {
    const update = vi.fn()
    const data = structuredClone(snapshot)
    if (reason === 'nonfinite') data.result.elements[2].properties.x = NaN
    const action = createRetainedFillAction({ get: () => data } as never, {
      targets,
      metadata: (id) =>
        reason === 'missing' && id === 'c'
          ? undefined
          : { lock: reason === 'lock' && id === 'c' },
      update
    })
    const args = structuredClone(input)
    if (reason === 'domain') args.mappings[0].domain = [1, 1]
    await expect(
      action.execute(args, { signal: new AbortController().signal })
    ).rejects.toThrow()
    expect(update).not.toHaveBeenCalled()
  }
)

it('rejects a locked ancestor before writing descendants', async () => {
  const update = vi.fn()
  const action = createRetainedFillAction({ get: () => snapshot } as never, {
    targets,
    metadata: (id) =>
      id === 'parent' ? { lock: true } : { parentId: 'parent' },
    update
  })
  await expect(
    action.execute(input, { signal: new AbortController().signal })
  ).rejects.toThrow(/lock/)
  expect(update).not.toHaveBeenCalled()
})

it('discovers the mapping by operation and admits the advertised input through the batch owner', async () => {
  const registry = createAiActionRegistry()
  const action = createRetainedFillAction({ get: () => snapshot } as never, {
    targets,
    metadata: () => ({}),
    update: vi.fn()
  })
  registry.register(action)
  const tools = createLocalOperationTools(
    registry.list(),
    { modelActions: (actions) => actions, resolveBatch: (value) => value },
    vi.fn()
  )
  try {
    const result = JSON.parse(
      await tools.call(
        'describe_design_apis',
        { operations: [action.name] },
        new AbortController().signal
      )
    )
    expect(result.apis).toHaveLength(1)
    expect(result.apis[0]).toMatchObject({
      name: action.name,
      operation: action.name,
      execution: { kind: 'batch-action', tool: 'execute_design_batch' }
    })
    expect(result.apis[0].inputSchema).toEqual(action.inputSchema)
    const operations = prepareOperationBatch(
      [{ name: result.apis[0].name, arguments: input }],
      registry.list()
    )
    expect(operations[0].arguments).toEqual(input)
    await expect(
      action.execute(operations[0].arguments as typeof input, {
        signal: new AbortController().signal
      })
    ).resolves.toMatchObject({ appliedCount: 3 })
  } finally {
    registry.dispose()
  }
})

it.each([false, true])(
  'prepares ten query mappings before any write, including late lock rejection=%s',
  async (locked) => {
    let reads = 0
    const queries = createRetainedDesignContext(
      {
        getCurrentWorkspaceId: () => 'workspace',
        getSelectedElementIds: () => [],
        getElementChildren: () => ({
          available: true,
          elementIds: [],
          total: 0,
          nextOffset: null
        }),
        getElementIdsInBounds: () => [],
        getElementMetadata: (id) => ({
          name: id,
          type: 'rectangle',
          lock: false
        }),
        getElementComputedData: (id) => {
          reads++
          return { x: Number(id) }
        }
      },
      () => () => undefined
    )
    const update = vi.fn(() => {
      expect(reads).toBe(10)
    })
    const action = createRetainedFillAction(queries, {
      targets,
      metadata: (id) => ({ lock: locked && id === '9' }),
      update
    })
    const { snapshotId: _snapshotId, ...mapping } = input.mappings[0]
    const args = {
      mappings: Array.from({ length: 10 }, (_, index) => ({
        ...mapping,
        query: { scope: 'ids' as const, elementIds: [String(index)] }
      }))
    }
    try {
      const pending = action.execute(args, {
        signal: new AbortController().signal
      })
      if (locked) {
        await expect(pending).rejects.toThrow(/locked/)
        expect(update).not.toHaveBeenCalled()
      } else {
        await expect(pending).resolves.toMatchObject({ appliedCount: 10 })
        expect(update).toHaveBeenCalledTimes(1)
      }
    } finally {
      queries.dispose()
    }
  }
)

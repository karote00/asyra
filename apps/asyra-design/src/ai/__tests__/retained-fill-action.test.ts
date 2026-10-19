import { expect, it, vi } from 'vitest'
import { createAiActionRegistry } from '@asyra/ai-agent-runtime'
import { createLocalOperationTools } from '../../../server/local-operation-tools'
import { prepareOperationBatch } from '../../../server/local-operation-batch'
vi.mock('../../contexts', () => ({ default: {} }))
vi.mock('../../common-apis/fills', () => ({ fillApis: {} }))
import { createRetainedDesignContext } from '../../common-apis/retained-design-context'
import { createRetainedFillAction as createAction } from '../retained-fill-action'

const createRetainedFillAction = (
  queries: Parameters<typeof createAction>[0],
  apis: Omit<NonNullable<Parameters<typeof createAction>[1]>, 'owners'> & {
    owners?: (ids: string[]) => string[]
  }
) => createAction(queries, { owners: () => ['a', 'b', 'c'], ...apis })
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
  expect(action.revision).toBe(5)
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

it('rejects foreign retained inputs before writing and preserves the owning request lease', async () => {
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
      getElementComputedData: () => ({ x: 10 })
    },
    () => vi.fn()
  )
  const owner = new AbortController().signal,
    foreign = new AbortController().signal
  const receipt = queries.read(
    { scope: 'ids', elementIds: ['a'], fields: ['x'], delivery: 'reference' },
    owner
  )
  const update = vi.fn()
  const action = createRetainedFillAction(queries, {
    targets,
    metadata: () => ({ lock: false }),
    update
  })
  await expect(
    action.execute(
      {
        mappings: [
          {
            ...input.mappings[0],
            snapshotId: receipt.snapshotId,
            leaseId: receipt.leaseId
          }
        ]
      },
      { signal: foreign, runMutation: async (write) => write() }
    )
  ).rejects.toThrow('request')
  expect(update).not.toHaveBeenCalled()
  expect(
    queries.get(receipt.snapshotId, receipt.leaseId, owner).orderedIds
  ).toEqual(['a'])
  queries.dispose()
})

it.each([false, true])(
  'preserves borrowed query ownership with lock=%s',
  async (locked) => {
    const releaseLease = vi.fn()
    const get = vi.fn(() => snapshot)
    const action = createRetainedFillAction({ get, releaseLease } as never, {
      targets,
      metadata: () => ({ lock: locked }),
      update: vi.fn()
    })
    const pending = action.execute(
      { mappings: [{ ...input.mappings[0], leaseId: 'caller-lease' }] },
      {
        signal: new AbortController().signal
      }
    )
    if (locked) await expect(pending).rejects.toThrow(/lock/)
    else await expect(pending).resolves.toMatchObject({ appliedCount: 3 })
    expect(get).toHaveBeenCalledTimes(1)
    expect(releaseLease).not.toHaveBeenCalled()
  }
)

it('refines retained candidates into one canonical plural edit', async () => {
  const ids = Array.from({ length: 2736 }, (_, index) => `candidate-${index}`)
  let changed: () => void = () => {
    throw new Error('Observer is not installed')
  }
  const spatial = vi.fn(() => ids)
  const computed = vi.fn(() => ({ x: 50 }))
  const queries = createRetainedDesignContext(
    {
      getCurrentWorkspaceId: () => 'workspace',
      getSelectedElementIds: () => [],
      getElementChildren: () => {
        throw new Error('Unexpected subtree enumeration')
      },
      getElementIdsInBounds: spatial,
      getElementMetadata: (id) => ({
        name: Number(id.slice(10)) < 24 ? 'crown-roof' : 'crown-window',
        type: 'vector'
      }),
      getElementComputedData: computed
    },
    (listener) => {
      changed = listener
      return () => {
        changed = () => undefined
      }
    }
  )
  const signal = new AbortController().signal
  try {
    const candidate = queries.read(
      {
        scope: 'region',
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        fields: ['x'],
        delivery: 'reference'
      },
      signal
    )
    const selected = queries.read(
      {
        scope: 'snapshot',
        snapshotId: candidate.snapshotId,
        filter: { name: { equals: 'crown-roof' } },
        expectedCount: 24,
        delivery: 'reference'
      },
      signal
    )
    expect(selected).toMatchObject({
      total: 24,
      elements: [],
      elementIds: [],
      observation: { selectionExecutions: 0, refinementExecutions: 1 }
    })
    const released = vi.spyOn(queries, 'releaseLease')
    const update = vi.fn()
    const edit = createRetainedFillAction(queries, {
      targets: (selectedIds) =>
        selectedIds.map((elementId) => ({
          elementId,
          fillId: `fill-${elementId}`
        })),
      metadata: () => ({ lock: false }),
      update
    })
    const args = {
      mappings: [
        {
          snapshotId: selected.snapshotId,
          leaseId: selected.leaseId,
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
    await edit.execute(args, { signal, runMutation: async (write) => write() })
    expect(released).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledTimes(1)
    expect(
      update.mock.calls[0][0].map(
        (entry: { elementId: string }) => entry.elementId
      )
    ).toEqual(ids.slice(0, 24))
    expect(spatial).toHaveBeenCalledTimes(1)
    expect(computed).toHaveBeenCalledTimes(2736)
    expect(
      queries.get(selected.snapshotId, selected.leaseId, signal).orderedIds
    ).toHaveLength(24)
    changed()
    expect(() =>
      queries.get(selected.snapshotId, selected.leaseId, signal)
    ).toThrow(/stale/)
    await expect(
      edit.execute(args, { signal, runMutation: async (write) => write() })
    ).rejects.toThrow(/stale/)
    expect(update).toHaveBeenCalledTimes(1)
  } finally {
    queries.dispose()
  }
})

it('exports the canonical shared-property owners for post-write mechanical checks', async () => {
  const owners = vi.fn(() => ['a', 'b', 'c', 'shared-outside-query'])
  const update = vi.fn()
  const action = createRetainedFillAction({ get: () => snapshot } as never, {
    targets,
    metadata: () => ({ lock: false }),
    update,
    owners
  })
  const result = await action.execute(input, {
    signal: new AbortController().signal,
    runMutation: async (mutate) => mutate()
  })
  expect(result).toMatchObject({
    mutationScope: {
      complete: true,
      elementIds: ['a', 'b', 'c', 'shared-outside-query'],
      removedElementIds: []
    }
  })
  expect(owners).toHaveBeenCalledExactlyOnceWith(['fill-a', 'fill-b', 'fill-c'])
  expect(update).toHaveBeenCalledTimes(1)
})

// Recorded mapping receipts contained 3,584 and 1,600 affected identities.
it.each([3584, 1600])(
  'retains %i mapped identities internally and publishes a bounded model view',
  async (count) => {
    const ids = Array.from(
      { length: count },
      (_, index) => `recorded-window-${index}`
    )
    const queries = createRetainedDesignContext(
      {
        getCurrentWorkspaceId: () => 'workspace',
        getSelectedElementIds: () => [],
        getElementChildren: () => {
          throw new Error('No subtree scan')
        },
        getElementIdsInBounds: () => ids,
        getElementMetadata: () => ({ type: 'vector', lock: false }),
        getElementComputedData: () => ({ x: 50 })
      },
      () => () => undefined
    )
    const signal = new AbortController().signal
    const update = vi.fn()
    const action = createAction(queries, {
      metadata: () => ({ lock: false }),
      targets,
      update,
      owners: () => ids
    })
    try {
      const { snapshotId: _snapshotId, ...mapping } = input.mappings[0]
      const result = (await action.execute(
        {
          mappings: [
            {
              ...mapping,
              query: {
                scope: 'region',
                bounds: { x: 0, y: 0, width: 100, height: 100 }
              }
            }
          ]
        },
        { signal, runMutation: async (write) => write() }
      )) as {
        mutationScope: { elementIds: string[] }
        retained: { snapshotId: string }
        modelResult: Record<string, unknown>
      }
      expect(update).toHaveBeenCalledTimes(1)
      expect(result.mutationScope.elementIds).toEqual(ids)
      expect(action.delivery?.path).toBe('/modelResult')
      expect(result.modelResult).toMatchObject({
        status: 'complete',
        appliedCount: count,
        retained: { total: count }
      })
      expect(JSON.stringify(result.modelResult).length).toBeLessThan(1000)
      expect(result.modelResult.mutationScope).toBeUndefined()
      const tools = createLocalOperationTools(
        [action],
        { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
        async (batch) => ({
          context: {},
          actionResults: [
            {
              actionId: batch.actions[0].id,
              actionName: action.name,
              result: result as never
            }
          ]
        })
      )
      const reply = JSON.parse(
        await tools.call(
          action.name,
          {
            arguments: {
              mappings: [
                {
                  ...mapping,
                  query: {
                    scope: 'region',
                    bounds: { x: 0, y: 0, width: 100, height: 100 }
                  }
                }
              ]
            },
            inspection: 'defer'
          },
          signal
        )
      )
      expect(reply.actionResults[0].result.mutationScope).toBeUndefined()
      expect(reply.actionResults[0].result.appliedCount).toBe(count)
      expect(reply.checks.counts.unverified).toBe(count)
      expect(JSON.stringify(reply).length).toBeLessThan(2500)

      const chunks: string[] = []
      let offset: number | null = 0
      do {
        const page = queries.read(
          {
            scope: 'snapshot',
            snapshotId: result.retained.snapshotId,
            delivery: 'receipt',
            offset
          },
          signal
        ) as {
          receipt?: unknown
          receiptPage: {
            encoding: string
            text: string
            nextOffset: number | null
          }
        }
        expect(JSON.stringify(page).length).toBeLessThan(66000)
        if (page.receipt) {
          chunks.push(JSON.stringify(page.receipt))
          break
        }
        expect(page.receiptPage.encoding).toBe('json-text')
        chunks.push(page.receiptPage.text)
        offset = page.receiptPage.nextOffset
      } while (offset !== null)
      expect(JSON.parse(chunks.join('')).mutationScope.elementIds).toEqual(ids)
      expect(update).toHaveBeenCalledTimes(1)
    } finally {
      queries.dispose()
    }
  }
)

it.each(['capacity', 'cancel'] as const)(
  'preserves completed mapping when receipt retention fails from %s',
  async (failure) => {
    const controller = new AbortController()
    const retainReceipt = vi.fn(() => {
      if (failure === 'cancel') controller.signal.throwIfAborted()
      throw new Error('Retained query capacity reserved by pending consumers')
    })
    const get = vi.fn(() => snapshot)
    const update = vi.fn(() => {
      if (failure === 'cancel') controller.abort()
    })
    const action = createRetainedFillAction({ get, retainReceipt } as never, {
      targets,
      metadata: () => ({ lock: false }),
      update
    })
    const result = await action.execute(input, {
      signal: controller.signal,
      runMutation: async (write, settled) => {
        const value = write()
        settled?.(value)
        return value
      }
    })
    expect(result).toMatchObject({
      status: 'complete',
      appliedCount: 3,
      mutationScope: { complete: true, elementIds: ['a', 'b', 'c'] },
      delivery: { status: 'unavailable' },
      modelResult: { delivery: { status: 'unavailable' } }
    })
    expect(result).not.toHaveProperty('retained')
    const { projectToolDelivery, designActionOutcome } =
      await import('../tool-contract')
    const external = projectToolDelivery(action, result)
    expect(external).not.toHaveProperty('retained')
    expect(external).not.toHaveProperty('mutationScope')
    expect(designActionOutcome(external)).toMatchObject({
      status: 'partial',
      settlement: 'completed'
    })
    expect(update).toHaveBeenCalledOnce()
    expect(get).toHaveBeenCalledOnce()
    expect(retainReceipt).toHaveBeenCalledOnce()
  }
)

it.each(['complete', 'locked', 'write-failure'])(
  'preserves another consumer of an equivalent query after %s',
  async (outcome) => {
    const computed = vi.fn(() => ({ x: 10 }))
    const queries = createRetainedDesignContext(
      {
        getCurrentWorkspaceId: () => 'workspace',
        getSelectedElementIds: () => [],
        getElementChildren: () => {
          throw new Error('Explicit targets must not traverse children')
        },
        getElementIdsInBounds: () => {
          throw new Error('Explicit targets must not perform spatial search')
        },
        getElementMetadata: (id) => ({ name: id, type: 'rectangle' }),
        getElementComputedData: computed
      },
      () => () => undefined
    )
    const controller = new AbortController()
    const query = { scope: 'ids' as const, elementIds: ['a'] }
    const held = queries.read(
      { ...query, fields: ['x'], delivery: 'reference' },
      controller.signal
    )
    const released = vi.spyOn(queries, 'releaseLease')
    const update = vi.fn(() => {
      if (outcome === 'write-failure') throw new Error('Canonical write failed')
    })
    const action = createRetainedFillAction(queries, {
      targets,
      metadata: () => ({ lock: outcome === 'locked' }),
      update
    })
    const { snapshotId: _snapshotId, ...mapping } = input.mappings[0]
    try {
      const pending = action.execute(
        { mappings: [{ ...mapping, query }] },
        { signal: controller.signal, runMutation: async (write) => write() }
      )
      if (outcome === 'complete')
        await expect(pending).resolves.toMatchObject({ appliedCount: 1 })
      else
        await expect(pending).rejects.toThrow(
          outcome === 'locked' ? /locked/ : /Canonical write failed/
        )
      expect(update).toHaveBeenCalledTimes(outcome === 'locked' ? 0 : 1)
      expect(computed).toHaveBeenCalledTimes(1)
      expect(
        queries.get(held.snapshotId, held.leaseId, controller.signal).orderedIds
      ).toEqual(['a'])
      expect(released).toHaveBeenCalledTimes(1)
      const consumed = released.mock.calls[0][0]
      expect(consumed).not.toBe(held.leaseId)
      expect(() =>
        queries.get(held.snapshotId, consumed, controller.signal)
      ).toThrow(/lease/)
      const reused = queries.read(
        { ...query, fields: ['x'], delivery: 'reference' },
        controller.signal
      )
      expect(reused.snapshotId).toBe(held.snapshotId)
      expect(reused.leaseId).toBe(held.leaseId)
      expect(reused.observation).toMatchObject({
        reused: true,
        selectionExecutions: 0,
        computedReadCount: 0
      })
      controller.abort()
      expect(() => queries.get(held.snapshotId, held.leaseId)).toThrow(/lease/)
    } finally {
      queries.dispose()
    }
  }
)

it('reuses a rejected mapping query through another local-edit consumer, then refreshes after mutation', async () => {
  const { createBasicApiActions } = await import('../basic-api-actions')
  const colors = new Map([
    ['a', '#112233'],
    ['unrelated', '#778899']
  ])
  const computed = vi.fn(() => ({ x: 10 }))
  let changed = () => {
    throw new Error('Missing observer')
  }
  const queries = createRetainedDesignContext(
    {
      getCurrentWorkspaceId: () => 'workspace',
      getSelectedElementIds: () => [],
      getElementChildren: () => {
        throw new Error('Unexpected traversal')
      },
      getElementIdsInBounds: () => {
        throw new Error('Unexpected spatial search')
      },
      getElementMetadata: (id) => ({ name: id, type: 'rectangle' }),
      getElementComputedData: computed
    },
    (listener) => {
      changed = listener
      return () => undefined
    }
  )
  const signal = new AbortController().signal
  const context = { signal, runMutation: async <T>(write: () => T) => write() }
  const query = { scope: 'ids' as const, elementIds: ['a'] }
  const held = queries.read(
    { ...query, fields: ['x'], delivery: 'reference' },
    signal
  )
  const mapWrite = vi.fn()
  const mapper = createRetainedFillAction(queries, {
    targets,
    metadata: () => ({ lock: true }),
    update: mapWrite
  })
  const edit = vi.fn(
    (ids: string[], _index: number, patch: { color: string }) => {
      ids.forEach((id) => colors.set(id, patch.color))
      changed()
    }
  )
  const action = createBasicApiActions(
    () => ({
      core: {},
      element: {},
      selection: {},
      hierarchy: {},
      viewport: {},
      stroke: {},
      fill: { updateFillsAtIndex: edit }
    }),
    { observe: () => () => undefined, resolve: () => 'live' },
    queries
  ).find((candidate) => candidate.name === 'api_fill_updateFillsAtIndex')
  if (!action) throw new Error('Missing canonical fill action')
  const { snapshotId: _snapshotId, ...mapping } = input.mappings[0]
  const reference = {
    snapshotId: held.snapshotId,
    leaseId: held.leaseId,
    total: held.total
  }
  try {
    await expect(
      mapper.execute({ mappings: [{ ...mapping, query }] }, context)
    ).rejects.toThrow(/locked/)
    expect(mapWrite).not.toHaveBeenCalled()
    const args = {
      elementIds: reference,
      index: 0,
      patch: { color: '#abcdef' }
    }
    expect(
      prepareOperationBatch(
        [{ name: action.name, arguments: args }],
        [action]
      )[0].arguments
    ).toEqual(args)
    await action.execute(args, context)
    expect(edit).toHaveBeenCalledExactlyOnceWith(['a'], 0, { color: '#abcdef' })
    expect(colors.get('a')).toBe('#abcdef')
    expect(colors.get('unrelated')).toBe('#778899')
    expect(computed).toHaveBeenCalledTimes(1)
    await expect(action.execute(args, context)).rejects.toThrow(/stale/)
    expect(edit).toHaveBeenCalledTimes(1)
    const fresh = queries.read(
      { ...query, fields: ['x'], delivery: 'reference' },
      signal
    )
    expect(fresh.snapshotId).not.toBe(held.snapshotId)
    await action.execute(
      {
        ...args,
        elementIds: {
          snapshotId: fresh.snapshotId,
          leaseId: fresh.leaseId,
          total: fresh.total
        }
      },
      context
    )
    expect(edit).toHaveBeenCalledTimes(2)
    expect(computed).toHaveBeenCalledTimes(2)
    queries.releaseFor(signal)
    await expect(
      action.execute(
        {
          ...args,
          elementIds: {
            snapshotId: fresh.snapshotId,
            leaseId: fresh.leaseId,
            total: fresh.total
          }
        },
        context
      )
    ).rejects.toThrow(/lease|missing/)
    expect(edit).toHaveBeenCalledTimes(2)
  } finally {
    queries.dispose()
  }
})

it('advertises only executable inline query scopes for retained fill consumers', async () => {
  const { operationInputIssue, nativeToolInputSchema } =
    await import('../../../server/operation-input-schema')
  const action = createRetainedFillAction({} as never, {
    targets,
    metadata: () => ({ lock: false }),
    update: vi.fn()
  })
  const { snapshotId: _snapshot, ...mapping } = input.mappings[0]
  for (const schema of [
    action.inputSchema,
    nativeToolInputSchema(action.inputSchema)
  ]) {
    for (const query of [
      { scope: 'ids', elementIds: ['a'] },
      {
        scope: 'region',
        bounds: { x: 0, y: 0, width: 10, height: 10 },
        filter: { type: 'rect' }
      }
    ])
      expect(
        operationInputIssue({ mappings: [{ ...mapping, query }] }, schema)
      ).toBeUndefined()
    for (const query of [
      { scope: 'ids' },
      { scope: 'region' },
      { scope: 'ids', elementIds: ['a'], filter: { type: 'rect' } },
      {
        scope: 'region',
        elementIds: ['a'],
        bounds: { x: 0, y: 0, width: 10, height: 10 }
      }
    ])
      expect(
        operationInputIssue({ mappings: [{ ...mapping, query }] }, schema)
      ).toBeDefined()
  }
})

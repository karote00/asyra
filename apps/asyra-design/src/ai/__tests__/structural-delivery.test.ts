import { expect, it, vi } from 'vitest'
import type { AiMutationExecutor } from '@asyra/ai-agent-runtime'
vi.mock('../../contexts', () => ({ default: {} }))
vi.mock('../../common-apis', () => ({}))
import { createRetainedDesignContext } from '../../common-apis/retained-design-context'
import { createBasicApiActions } from '../basic-api-actions'
import { createDocumentContextAction } from '../context-action'
import { operationInputIssue } from '../tool-schema'

interface StructuralReceipt {
  status: string
  retained: { snapshotId: string; leaseId: string; total: number }
  value: { elementIds?: string[]; [key: string]: unknown }
  delivery?: { status: string; message: string }
}
interface ReceiptRead {
  receipt: StructuralReceipt
  current: boolean
}

const fixture = (count = 1000, maxBytes?: number) => {
  const controller = new AbortController()
  const signal = controller.signal
  let changed = () => undefined
  const ids = Array.from({ length: count }, (_, i) => `child-${i}`)
  const children = vi.fn(() => ({
    available: true,
    elementIds: ids,
    total: count,
    nextOffset: null
  }))
  const metadata = vi.fn((id: string) => ({
    name: id,
    type: 'rectangle',
    parentId: 'group',
    lock: false
  }))
  const queries = createRetainedDesignContext(
    {
      getCurrentWorkspaceId: () => 'workspace',
      getSelectedElementIds: () => ids,
      getElementChildren: children,
      getElementIdsInBounds: () => ids,
      getElementMetadata: metadata,
      getElementComputedData: () => ({})
    },
    (listener) => {
      changed = listener
      return () => undefined
    },
    { maxBytes }
  )
  const group = vi.fn((elementIds: string[]) => ({
    groupId: 'group',
    elementIds,
    bounds: { x: 0, y: 0, width: 10, height: 10 }
  }))
  const edit = vi.fn((elementIds: string[]) => elementIds.map(() => 'changed'))
  const actions = createBasicApiActions(
    () => ({
      core: {
        moveElements: () => ({
          moves: ids.map((elementId) => ({
            elementId,
            before: { parentId: 'a', index: 0 },
            after: { parentId: 'b', index: 0 }
          })),
          elementIds: ids
        }),
        deleteElement: () => ({
          elementId: 'group',
          removed: ids.map((elementId) => ({ elementId })),
          rootParentChildrenAfter: []
        })
      },
      hierarchy: {
        groupElements: group,
        ungroupElement: () => ({
          groupId: 'group',
          elementIds: ids,
          removed: true
        })
      },
      element: {
        setElementsVisible: edit,
        deleteElements: () => ({
          removed: ids.map((elementId) => ({ elementId })),
          rootParentChildrenAfter: []
        })
      },
      fill: {},
      stroke: {},
      selection: {},
      viewport: {}
    }),
    { observe: () => () => undefined, resolve: () => 'live' },
    queries
  )
  const action = (name: string) => {
    const found = actions.find((a) => a.name === name)
    if (!found) throw new Error(`Unknown test action: ${name}`)
    return found
  }
  const runMutation: AiMutationExecutor = async (write, settled) => {
    const value = write()
    settled?.(value)
    return value
  }
  const context = { signal, runMutation }
  const produce = () =>
    action('api_hierarchy_groupElements').execute(
      { elementIds: ids },
      context
    ) as Promise<StructuralReceipt>
  return {
    queries,
    controller,
    context,
    ids,
    children,
    metadata,
    group,
    edit,
    action,
    produce,
    change: () => changed()
  }
}

it('hands ordered structural output to a plural edit without querying children or copying IDs through model arguments', async () => {
  const app = fixture()
  try {
    const result = await app.produce()
    expect(result.retained).toMatchObject({
      snapshotId: expect.any(String),
      leaseId: expect.any(String),
      total: 1000
    })
    expect(
      operationInputIssue(
        result,
        app.action('api_hierarchy_groupElements').outputSchema
      )
    ).toBeUndefined()
    const input = { elementIds: result.retained, visible: false }
    expect(JSON.stringify(input).length).toBeLessThan(250)
    expect(
      operationInputIssue(
        input,
        app.action('api_element_setElementsVisible').inputSchema
      )
    ).toBeUndefined()
    await app
      .action('api_element_setElementsVisible')
      .execute(input, app.context)
    expect(app.edit).toHaveBeenCalledExactlyOnceWith(app.ids, false)
    expect(app.children).not.toHaveBeenCalled()
    expect(app.metadata).not.toHaveBeenCalled()
    const reader = createDocumentContextAction(app.queries.read)
    const full = (await reader.execute(
      {
        scope: 'snapshot',
        snapshotId: result.retained.snapshotId,
        delivery: 'receipt'
      },
      app.context
    )) as ReceiptRead
    expect(full.receipt.value).toEqual(result.value)
    expect(full.current).toBe(true)
  } finally {
    app.queries.dispose()
  }
})

it('rejects references made stale while the consumer waits for mutation admission without replaying the producer', async () => {
  const app = fixture(8)
  try {
    const result = await app.produce()
    await expect(
      app.action('api_element_setElementsVisible').execute(
        { elementIds: result.retained, visible: false },
        {
          ...app.context,
          runMutation: async (write) => {
            app.change()
            return write()
          }
        }
      )
    ).rejects.toThrow(/stale/)
    expect(app.edit).not.toHaveBeenCalled()
    expect(app.group).toHaveBeenCalledOnce()
    const full = app.queries.read(
      {
        scope: 'snapshot',
        snapshotId: result.retained.snapshotId,
        delivery: 'receipt'
      },
      app.context.signal
    )
    expect(full.current).toBe(false)
    expect(full.receipt.value.elementIds).toEqual(app.ids)
  } finally {
    app.queries.dispose()
  }
})

it('preserves the acknowledged mutation when retained delivery capacity refuses its full receipt', async () => {
  const app = fixture(8, 20)
  try {
    const result = await app.produce()
    expect(result).toMatchObject({
      status: 'complete',
      value: { groupId: 'group' },
      delivery: { status: 'unavailable' }
    })
    expect(result.retained).toBeUndefined()
    expect(app.group).toHaveBeenCalledOnce()
  } finally {
    app.queries.dispose()
  }
})

it('keeps model structural replies bounded while full receipts remain readable without another mutation', async () => {
  const { createLocalOperationTools } =
    await import('../../../server/local-operation-tools')
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const app = fixture(4000)
  const calls: string[] = []
  const definitions = [
    app.action('api_hierarchy_groupElements'),
    createDocumentContextAction(app.queries.read)
  ]
  const tools = createLocalOperationTools(
    definitions.map(createAiToolContract),
    {
      modelActions: (a) => a,
      resolveBatch: (b) => b
    },
    async (batch) => ({
      context: null,
      actionResults: await Promise.all(
        batch.actions.map(async (call) => {
          calls.push(call.name)
          const action = definitions.find((a) => a.name === call.name)
          if (!action) throw new Error('Missing test action')
          return {
            actionId: call.id,
            actionName: call.name,
            result: await action.execute(call.arguments as never, app.context)
          }
        })
      )
    })
  )
  try {
    const text = await tools.call(
      'execute_design_batch',
      {
        operations: [
          {
            name: 'api_hierarchy_groupElements',
            arguments: { elementIds: app.ids }
          }
        ],
        inspection: 'defer'
      },
      app.context.signal
    )
    expect(text.length).toBeLessThan(2500)
    const result = JSON.parse(text).actionResults[0].result
    expect(result.value.elementIds).toBeUndefined()
    expect(result.retained.total).toBe(4000)
    const read = JSON.parse(
      await tools.call(
        'read_design_context',
        {
          arguments: {
            scope: 'snapshot',
            snapshotId: result.retained.snapshotId,
            delivery: 'receipt'
          }
        },
        app.context.signal
      )
    )
    expect(read.actionResults[0].result.receipt.value.elementIds).toEqual(
      app.ids
    )
    expect(app.group).toHaveBeenCalledOnce()
    expect(calls).toEqual([
      'api_hierarchy_groupElements',
      'read_design_context'
    ])
  } finally {
    app.queries.dispose()
  }
})

it('does not bless a later document revision when another change occurs after mutation settlement', async () => {
  const app = fixture(8)
  try {
    const produced = await app.action('api_hierarchy_groupElements').execute(
      { elementIds: app.ids },
      {
        signal: app.context.signal,
        runMutation: async (write, settled) => {
          const value = write()
          settled?.(value)
          app.change()
          return value
        }
      }
    )
    expect(produced.retained).toBeDefined()
    await expect(
      app
        .action('api_element_setElementsVisible')
        .execute({ elementIds: produced.retained, visible: false }, app.context)
    ).rejects.toThrow(/stale/)
    expect(app.edit).not.toHaveBeenCalled()
    expect(app.group).toHaveBeenCalledOnce()
  } finally {
    app.queries.dispose()
  }
})

it.each(['foreign', 'released', 'count', 'cancelled'] as const)(
  'rejects %s structural references before the canonical edit',
  async (failure) => {
    const app = fixture(4)
    try {
      const produced = await app.produce()
      const reference = { ...produced.retained }
      let context = app.context
      if (failure === 'foreign')
        context = { ...context, signal: new AbortController().signal }
      if (failure === 'released')
        app.queries.releaseLease(reference.leaseId, context.signal)
      if (failure === 'count') reference.total++
      if (failure === 'cancelled') app.controller.abort()
      await expect(
        app
          .action('api_element_setElementsVisible')
          .execute({ elementIds: reference, visible: false }, context)
      ).rejects.toThrow()
      expect(app.edit).not.toHaveBeenCalled()
      expect(app.group).toHaveBeenCalledOnce()
    } finally {
      app.queries.dispose()
    }
  }
)

it.each([
  'api_hierarchy_ungroupElement',
  'api_core_moveElements',
  'api_element_deleteElements'
])(
  'preserves exact live targets and original evidence for %s',
  async (name) => {
    const app = fixture(4)
    try {
      const result = await app.action(name).execute(
        {
          elementId: 'group',
          groupId: 'group',
          request: {
            elementIds: app.ids,
            targetParentId: 'b',
            targetIndex: 0
          }
        },
        app.context
      )
      const expected = name.includes('delete') ? [] : app.ids
      expect(
        app.queries.get(
          result.retained.snapshotId,
          result.retained.leaseId,
          app.context.signal
        ).orderedIds
      ).toEqual(expected)
      const full = app.queries.read(
        {
          scope: 'snapshot',
          snapshotId: result.retained.snapshotId,
          delivery: 'receipt'
        },
        app.context.signal
      )
      expect(full.receipt.value).toEqual(result.value)
      full.receipt.value.changedByReader = true
      const again = app.queries.read(
        {
          scope: 'snapshot',
          snapshotId: result.retained.snapshotId,
          delivery: 'receipt'
        },
        app.context.signal
      )
      expect(again.receipt.value.changedByReader).toBeUndefined()
      expect(app.children).not.toHaveBeenCalled()
    } finally {
      app.queries.dispose()
    }
  }
)

it('preserves completed writes when cancellation prevents reference publication', async () => {
  const app = fixture(4)
  app.group.mockImplementationOnce((ids) => {
    app.controller.abort()
    return {
      groupId: 'group',
      elementIds: ids,
      bounds: { x: 0, y: 0, width: 10, height: 10 }
    }
  })
  try {
    const result = await app.produce()
    expect(result).toMatchObject({
      status: 'complete',
      delivery: { status: 'unavailable' }
    })
    expect(result.retained).toBeUndefined()
    expect(app.group).toHaveBeenCalledOnce()
  } finally {
    app.queries.dispose()
  }
})

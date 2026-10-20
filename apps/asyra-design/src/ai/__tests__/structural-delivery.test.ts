import { localToolOutcome } from '../../../server/local-tool-invocation'
import { observeAiAction } from '../runtime-input'
import { createAiActions } from '../actions'
import { observeActionBatch } from '../../../server/local-action-observation'
import { createLocalOperationTools } from '../../../server/local-operation-tools'
import type { InspectionDependencyChange } from '../../common-apis/inspection-dependencies'
import { Factory } from '@asyra/factory'
import { createAiTransactionRunner } from '../transaction'
import { expect, it, vi } from 'vitest'
import {
  createAiAgentRuntime,
  type AiMutationExecutor
} from '@asyra/ai-agent-runtime'
vi.mock('../../contexts', () => ({ default: {} }))
vi.mock('../../common-apis', () => ({
  hierarchyApis: {},
  elementApis: {},
  fillApis: {},
  strokeApis: {},
  selectionApis: {},
  systemContextApis: {},
  viewportApis: {},
  transactionApis: {}
}))
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

const recoverReceipt = async (
  read: (offset?: number) => Promise<unknown> | unknown
): Promise<ReceiptRead> => {
  let offset: number | undefined
  const chunks: string[] = []
  for (;;) {
    const result = (await read(offset)) as ReceiptRead & {
      receiptPage?: { text: string; nextOffset: number | null }
    }
    if (result.receipt) return result
    if (!result.receiptPage) throw new Error('Missing bounded receipt page')
    chunks.push(result.receiptPage.text)
    if (result.receiptPage.nextOffset === null)
      return { current: result.current, receipt: JSON.parse(chunks.join('')) }
    offset = result.receiptPage.nextOffset
  }
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
    const full = await recoverReceipt((offset) =>
      reader.execute(
        {
          scope: 'snapshot',
          snapshotId: result.retained.snapshotId,
          delivery: 'receipt',
          offset
        },
        app.context
      )
    )
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
    const full = await recoverReceipt((offset) =>
      app.queries.read(
        {
          scope: 'snapshot',
          snapshotId: result.retained.snapshotId,
          delivery: 'receipt',
          offset
        },
        app.context.signal
      )
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
    const read = await recoverReceipt(
      async (offset) =>
        JSON.parse(
          await tools.call(
            'read_design_context',
            {
              arguments: {
                scope: 'snapshot',
                snapshotId: result.retained.snapshotId,
                delivery: 'receipt',
                ...(offset === undefined ? {} : { offset })
              }
            },
            app.context.signal
          )
        ).actionResults[0].result
    )
    expect(read.receipt.value.elementIds).toEqual(app.ids)
    expect(app.group).toHaveBeenCalledOnce()
    expect(calls[0]).toBe('api_hierarchy_groupElements')
    expect(calls.slice(1).length).toBeGreaterThan(1)
    expect(calls.slice(1).every((name) => name === 'read_design_context')).toBe(
      true
    )
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

it('publishes structural output through the real runtime wrapper before a dependent edit', async () => {
  const app = fixture(32)
  let produced: StructuralReceipt | undefined
  const runtime = createAiAgentRuntime({
    provider: {
      requestActionBatch: async (_input, options) => {
        if (!options.executeBatch) throw new Error('Missing execution boundary')
        const receipt = await options.executeBatch({
          batchId: 'group',
          actions: [
            {
              id: 'group',
              name: 'api_hierarchy_groupElements',
              arguments: { elementIds: app.ids },
              summary: 'Group selected parts'
            }
          ]
        })
        produced = receipt.actionResults[0]
          ?.result as unknown as StructuralReceipt
        expect(produced.delivery).toBeUndefined()
        expect(produced.retained.total).toBe(32)
        const original = await options.executeBatch({
          batchId: 'read',
          actions: [
            {
              id: 'read',
              name: 'read_design_context',
              summary: 'Recover original receipt',
              arguments: {
                scope: 'snapshot',
                snapshotId: produced.retained.snapshotId,
                delivery: 'receipt'
              }
            }
          ]
        })
        expect(
          (original.actionResults[0].result as unknown as ReceiptRead).receipt
            .value.elementIds
        ).toEqual(app.ids)
        return {
          batchId: 'edit',
          actions: [
            {
              id: 'edit',
              name: 'api_element_setElementsVisible',
              arguments: { elementIds: produced.retained, visible: false },
              summary: 'Hide grouped parts'
            }
          ]
        }
      }
    },
    actionDefinitions: [
      app.action('api_hierarchy_groupElements'),
      app.action('api_element_setElementsVisible'),
      createDocumentContextAction(app.queries.read)
    ],
    contextProvider: { getContext: async () => ({}) },
    permissionPolicy: { evaluate: () => 'allow' },
    confirmationHandler: { confirm: async () => true },
    transactionRunner: createAiTransactionRunner({ apis: new Factory() })
  })
  try {
    const result = await runtime.run({
      intent: 'Group then hide',
      signal: app.context.signal
    })
    expect(result.status).toBe('executed')
    expect(app.group).toHaveBeenCalledTimes(1)
    expect(app.edit).toHaveBeenCalledExactlyOnceWith(app.ids, false)
    expect(app.children).not.toHaveBeenCalled()
  } finally {
    await runtime.dispose()
    app.queries.dispose()
  }
})

it('projects real observed fill receipts after preserving complete original mutation scopes', async () => {
  let listener: ((change?: InspectionDependencyChange) => void) | undefined
  const writes = vi.fn((elementIds: string[]) => {
    listener?.({ elementIds })
    return {
      value: null,
      acceptedIds: elementIds,
      unavailableIds: [],
      changed: true
    }
  })
  const base = createBasicApiActions(
    () => ({
      core: {},
      hierarchy: {},
      element: {},
      fill: { updateFillsAtIndex: writes },
      stroke: {},
      selection: {},
      viewport: {}
    }),
    {
      observe: (next) => {
        listener = next
        return () => {
          listener = undefined
        }
      },
      resolve: () => 'live'
    }
  ).find((action) => action.name === 'api_fill_updateFillsAtIndex')
  if (!base) throw new Error('Missing fill action')
  const action = observeAiAction(base)
  const report = createAiActions().find(
    (item) => item.name === 'report_outcome'
  )
  if (!report) throw new Error('Missing final outcome action')
  const originals: unknown[] = []
  let compact = ''
  const runtime = createAiAgentRuntime({
    provider: {
      requestActionBatch: async (_input, options) => {
        const execute = options.executeBatch
        if (!execute) throw new Error('Missing runtime batch boundary')
        const tools = createLocalOperationTools(
          [action],
          { modelActions: (a) => a, resolveBatch: (b) => b },
          (batch) =>
            observeActionBatch(
              batch,
              execute,
              [action],
              'native-fill',
              (event, value) => {
                if (event === 'action_completed') originals.push(value)
              }
            )
        )
        compact = await tools.call(
          'execute_design_batch',
          {
            inspection: 'defer',
            operations: Array.from({ length: 16 }, (_, part) => ({
              name: action.name,
              arguments: {
                elementIds: Array.from(
                  { length: 192 },
                  (_, i) => `window-${part}-${i}`
                ),
                index: 0,
                patch: { opacity: 0.8 }
              }
            }))
          },
          new AbortController().signal
        )
        return {
          batchId: 'done',
          actions: [
            {
              id: 'report',
              name: report.name,
              arguments: {
                outcome: 'completed',
                message: 'Window reflections updated.'
              },
              summary: 'Report completed edits'
            }
          ]
        }
      }
    },
    actionDefinitions: [action, report],
    contextProvider: { getContext: async () => ({}) },
    permissionPolicy: { evaluate: () => 'allow' },
    confirmationHandler: { confirm: async () => true },
    transactionRunner: createAiTransactionRunner({ apis: new Factory() })
  })
  try {
    const outcome = await runtime.run({
      intent: 'Adjust window reflections',
      signal: new AbortController().signal
    })
    expect(
      outcome.status,
      outcome.status === 'failed' ? outcome.message : undefined
    ).toBe('executed')
    expect(writes).toHaveBeenCalledTimes(16)
    expect(originals).toHaveLength(16)
    for (const original of originals)
      expect(original).toMatchObject({
        result: {
          toolOutcome: { status: 'success', settlement: 'completed' },
          mutationScope: { complete: true, elementIds: expect.any(Array) }
        }
      })
    expect(
      originals.reduce(
        (total: number, item) =>
          total +
          (item as { result: { mutationScope: { elementIds: string[] } } })
            .result.mutationScope.elementIds.length,
        0
      )
    ).toBe(3072)
    const reply = JSON.parse(compact)
    expect(reply.actionResults).toHaveLength(16)
    expect(reply.batchSummary.acknowledgedActions).toBeUndefined()
    for (const receipt of reply.actionResults)
      expect(receipt.result).toMatchObject({
        changed: true,
        toolOutcome: { status: 'success', settlement: 'completed' }
      })
    // Explicit owner identities remain actionable; compact scope is not inferred success.
    for (const [part, receipt] of reply.actionResults.entries())
      expect(receipt.result.acceptedIds).toEqual(
        Array.from({ length: 192 }, (_, index) => `window-${part}-${index}`)
      )
    expect(reply.checks.counts.unverified).toBe(3072)
    expect(localToolOutcome(reply)).toMatchObject({
      status: 'partial',
      issues: expect.arrayContaining([
        expect.objectContaining({ code: 'FOLLOWUP_UNAVAILABLE' })
      ])
    })
    expect(
      reply.actionResults.every(
        (receipt: { result: { unavailableIds: string[] } }) =>
          receipt.result.unavailableIds.length === 0
      )
    ).toBe(true)
  } finally {
    await runtime.dispose()
  }
})

it('keeps eight structural recovery receipts without exhausting a subsequent region query', async () => {
  // Recorded 101: seven groups, another group, then a region read; no query yet.
  const app = fixture(3)
  try {
    const receipts: StructuralReceipt[] = []
    for (let index = 0; index < 8; index++) {
      receipts.push(await app.produce())
      app.change()
    }
    const read = app.queries.read(
      {
        scope: 'region',
        bounds: { x: 8200, y: 23000, width: 1024, height: 1024 },
        fields: ['x', 'y'],
        delivery: 'reference'
      },
      app.context.signal
    )
    expect(read.total).toBe(3)
    for (const receipt of receipts) {
      const recovered = app.queries.read(
        {
          scope: 'snapshot',
          snapshotId: receipt.retained.snapshotId,
          delivery: 'receipt'
        },
        app.context.signal
      ) as ReceiptRead
      expect(recovered.receipt.value).toEqual(receipt.value)
      expect(recovered.current).toBe(false)
      expect(() =>
        app.queries.get(
          receipt.retained.snapshotId,
          receipt.retained.leaseId,
          app.context.signal
        )
      ).toThrow(/stale/)
    }
    expect(app.group).toHaveBeenCalledTimes(8)
    expect(app.children).not.toHaveBeenCalled()
  } finally {
    app.controller.abort()
    app.queries.dispose()
  }
})

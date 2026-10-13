import type { AiToolStoreEntry } from '@asyra/ai-agent-runtime'
import { expect, it, vi } from 'vitest'
vi.mock('../../src/contexts', () => ({ default: {} }))
vi.mock('../../src/common-apis/fills', () => ({ fillApis: {} }))
import { createRetainedDesignContext } from '../../src/common-apis/retained-design-context'
import {
  createLocalToolLeases,
  type LocalToolOwnership
} from '../local-tool-leases'
import { createLocalQueryArtifacts } from '../local-query-artifacts'
import { AiActionNames } from '../../src/constants/ai-actions'
import { toolRequestReference } from '../../src/ai/tool-contract'

const object = (properties: Record<string, unknown>) => ({
  type: 'object',
  properties
})
const receiptSchema = object({
  snapshotId: toolRequestReference,
  leaseId: toolRequestReference
})
const fixture = () => {
  const signal = new AbortController().signal
  const queries = createRetainedDesignContext(
    {
      getCurrentWorkspaceId: () => 'workspace',
      getSelectedElementIds: () => ['part'],
      getElementChildren: () => ({
        available: true,
        elementIds: ['part'],
        total: 1,
        nextOffset: null
      }),
      getElementMetadata: () => ({
        name: 'Part',
        type: 'rect',
        parentId: 'workspace',
        lock: false
      }),
      getElementComputedData: () => ({ x: 10 }),
      getElementIdsInBounds: () => ['part']
    },
    () => () => undefined
  )
  const leases = createLocalToolLeases({ requestId: 'request', capacity: 20 })
  let callId = 'producer'
  const ownership: LocalToolOwnership = {
    publish: (handle, release, validate) =>
      leases.publish({ handle, release, validate, callId }),
    publishAliases: leases.publishAliases,
    assertOwned: (handle) => leases.assertOwned(handle, callId),
    borrow: (handle) => leases.borrow(handle, callId),
    assertRelease: (handle) => leases.assertRelease(handle, callId),
    retire: (handle) => leases.retire(handle, callId)
  }
  const release = vi.fn(async (snapshotId: string) => {
    queries.read({ scope: 'snapshot', snapshotId, release: true }, signal)
  })
  const bridge = createLocalQueryArtifacts({ ownership, release })
  const read = () =>
    queries.read(
      { scope: 'selection', fields: ['x'], delivery: 'reference' },
      signal
    )
  const publish = async (result: ReturnType<typeof read>) =>
    bridge.accept(
      {
        actions: [
          {
            id: 'read',
            name: AiActionNames.READ_DESIGN_CONTEXT,
            arguments: { scope: 'selection' },
            summary: 'Find targets'
          }
        ],
        batchId: 'batch'
      },
      {
        context: null,
        actionResults: [
          {
            actionId: 'read',
            actionName: AiActionNames.READ_DESIGN_CONTEXT,
            result: JSON.parse(JSON.stringify(result))
          }
        ]
      }
    )
  return {
    signal,
    queries,
    leases,
    ownership,
    bridge,
    release,
    read,
    publish,
    setCall: (id: string) => {
      callId = id
    }
  }
}

it('publishes real browser query handles and releases their data after caller ownership ends', async () => {
  const app = fixture()
  await app.leases.open({
    requestId: 'request',
    callId: 'producer',
    input: null,
    inputSchema: { type: 'null' }
  })
  const receipt = app.read()
  await app.publish(receipt)
  await app.leases.retain({
    requestId: 'request',
    fromCallId: 'producer',
    value: receipt,
    outputSchema: receiptSchema
  })
  await app.leases.release({ requestId: 'request', callId: 'producer' })
  expect(
    app.queries.get(receipt.snapshotId, receipt.leaseId, app.signal).orderedIds
  ).toEqual(['part'])
  await app.leases.open({
    requestId: 'request',
    callId: 'consumer',
    input: receipt,
    inputSchema: receiptSchema
  })
  await app.leases.release({ requestId: 'request', callId: 'consumer' })
  expect(app.release).not.toHaveBeenCalled()
  await app.leases.dispose()
  expect(app.release).toHaveBeenCalledExactlyOnceWith(receipt.snapshotId)
  expect(() => app.queries.get(receipt.snapshotId)).toThrow(/missing/)
  app.queries.dispose()
})

it('blocks explicit release while another call borrows the same browser query and accepts a repeated read', async () => {
  const app = fixture()
  await app.leases.open({
    requestId: 'request',
    callId: 'producer',
    input: null,
    inputSchema: { type: 'null' }
  })
  const receipt = app.read()
  await app.publish(receipt)
  await app.publish(app.read())
  await app.leases.retain({
    requestId: 'request',
    fromCallId: 'producer',
    value: receipt,
    outputSchema: receiptSchema
  })
  await app.leases.release({ requestId: 'request', callId: 'producer' })
  for (const id of ['borrower', 'releaser'])
    await app.leases.open({
      requestId: 'request',
      callId: id,
      input: receipt,
      inputSchema: receiptSchema
    })
  app.setCall('releaser')
  const batch = {
    batchId: 'release',
    actions: [
      {
        id: 'release',
        name: AiActionNames.RELEASE_DESIGN_CONTEXT,
        arguments: {
          snapshotId: receipt.snapshotId
        },
        summary: 'Release targets'
      }
    ]
  }
  expect(() => app.bridge.admit(batch)).toThrow(/borrow/)
  expect(app.queries.get(receipt.snapshotId).orderedIds).toHaveLength(1)
  await app.leases.release({ requestId: 'request', callId: 'borrower' })
  expect(() => app.bridge.admit(batch)).not.toThrow()
  const result = app.queries.read(
    { scope: 'snapshot', snapshotId: receipt.snapshotId, release: true },
    app.signal
  )
  await app.bridge.accept(batch, {
    context: null,
    actionResults: [
      {
        actionId: 'release',
        actionName: AiActionNames.RELEASE_DESIGN_CONTEXT,
        result: JSON.parse(JSON.stringify(result))
      }
    ]
  })
  await app.leases.release({ requestId: 'request', callId: 'releaser' })
  await app.leases.dispose()
  expect(app.release).not.toHaveBeenCalled()
  expect(() => app.queries.get(receipt.snapshotId)).toThrow(/missing/)
  app.queries.dispose()
})

it('cleans unpublished browser data when host ownership capacity refuses it', async () => {
  const app = fixture()
  app.ownership.publish = () => {
    throw new Error('Host capacity reached')
  }
  const receipt = app.read()
  await expect(app.publish(receipt)).rejects.toThrow(/capacity/)
  expect(app.release).toHaveBeenCalledExactlyOnceWith(receipt.snapshotId)
  expect(() => app.queries.get(receipt.snapshotId)).toThrow(/missing/)
  app.queries.dispose()
})

it('composes a real browser query and fill consumer without exporting rows, then releases intermediate query data', async () => {
  const app = fixture()
  const { createLocalToolHost } = await import('../local-tool-host')
  const { createLocalOperationTools } = await import('../local-operation-tools')
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const { createDocumentContextAction, createDocumentContextReleaseAction } =
    await import('../../src/ai/context-action')
  const { createRetainedFillAction } =
    await import('../../src/ai/retained-fill-action')
  const update = vi.fn()
  const observed: ReturnType<typeof app.read>[] = []
  const read = createDocumentContextAction((query, signal) => {
    const result = app.queries.read(query, signal)
    observed.push(result)
    return result
  })
  const actions = [
    read,
    createDocumentContextReleaseAction(app.queries.read),
    createRetainedFillAction(app.queries, {
      targets: (ids) =>
        ids.map((elementId) => ({ elementId, fillId: `fill-${elementId}` })),
      metadata: () => ({ lock: false }),
      update
    })
  ]
  const stored = new Map<string, AiToolStoreEntry>()
  let storeVersion = 0
  const host = createLocalToolHost({
    requestId: 'query-composition',
    signal: app.signal,
    capacity: 10,
    receiptCapacity: 10,
    artifactCapacity: 20,
    limits: {
      bytes: 24000,
      steps: 10,
      bindings: 200,
      bindingDepth: 32,
      issues: 10
    },
    store: {
      read: async (key) => stored.get(key),
      list: async () => [...stored.values()],
      write: async (input) => {
        if (stored.get(input.key)?.version !== input.expectedVersion)
          throw new Error('Store conflict')
        const entry = {
          key: input.key,
          record: input.record,
          version: String(++storeVersion)
        }
        stored.set(input.key, entry)
        return entry
      }
    },
    createGroups: (ownership) => [
      {
        name: 'design_operations',
        description: 'Canonical query and mapping owners',
        owner: createLocalOperationTools(
          actions.map(createAiToolContract),
          {
            modelActions: (actions) => actions,
            resolveBatch: (batch) => batch
          },
          async (batch) => ({
            context: null,
            actionResults: await Promise.all(
              batch.actions.map(async (call) => {
                const action = actions.find((item) => item.name === call.name)
                if (!action) throw new Error('Unknown action')
                return {
                  actionId: call.id,
                  actionName: call.name,
                  result: JSON.parse(
                    JSON.stringify(
                      await action.execute(call.arguments as never, {
                        signal: app.signal,
                        runMutation: async (write) => write()
                      })
                    )
                  )
                }
              })
            )
          }),
          { ownership, requestSignal: app.signal }
        )
      }
    ]
  })
  const literal = (value: unknown) => ({ kind: 'literal', value })
  const binding = (field: string) => ({
    kind: 'step',
    step: 'query',
    path: '/actionResults/0/result/' + field
  })
  const proposal = {
    format: 1,
    name: 'shade-current-selection',
    revision: 1,
    description:
      'Use current selected positions for one plural fill update without model row transfer.',
    inputSchema: { type: 'null' },
    outputSchema: { type: 'integer', minimum: 0 },
    steps: [
      {
        id: 'query',
        tool: 'design_operations.read_design_context',
        revision: 2,
        input: {
          kind: 'object',
          fields: { arguments: literal({ scope: 'selection', fields: ['x'] }) }
        }
      },
      {
        id: 'map',
        tool: 'design_operations.map_retained_fills',
        revision: 2,
        input: {
          kind: 'object',
          fields: {
            arguments: {
              kind: 'object',
              fields: {
                mappings: {
                  kind: 'array',
                  items: [
                    {
                      kind: 'object',
                      fields: {
                        snapshotId: binding('snapshotId'),
                        leaseId: binding('leaseId'),
                        coordinateSpace: literal('parent-local'),
                        axis: literal('x'),
                        domain: literal([0, 100]),
                        index: literal(0),
                        outside: literal('clamp'),
                        stops: literal([
                          { at: 0, color: '#000000' },
                          { at: 1, color: '#ffffff' }
                        ])
                      }
                    }
                  ]
                }
              }
            },
            inspection: literal('defer')
          }
        }
      }
    ],
    output: {
      kind: 'step',
      step: 'map',
      path: '/actionResults/0/result/appliedCount'
    }
  }
  try {
    const submitted = JSON.parse(
      (
        await host.invoke({
          name: 'tool_library.submit_tool',
          input: { submissionId: 'shading', proposal }
        })
      ).text
    )
    expect(submitted, JSON.stringify(submitted)).toMatchObject({ ok: true })
    const result = JSON.parse(
      (
        await host.invoke({
          name: 'tool_library.invoke_tool',
          input: { name: proposal.name, revision: 1, input: null }
        })
      ).text
    )
    expect(result, JSON.stringify(result)).toMatchObject({
      execution: { status: 'success', value: 1 },
      storage: { status: 'saved' }
    })
    expect(update).toHaveBeenCalledExactlyOnceWith([
      { elementId: 'part', fillId: 'fill-part', patch: { color: '#1a1a1a' } }
    ])
    expect(observed).toHaveLength(1)
    expect(observed[0]).toMatchObject({
      elements: [],
      elementIds: [],
      total: 1,
      delivery: 'reference'
    })
    expect(() => app.queries.get(observed[0].snapshotId)).toThrow(/missing/)
  } finally {
    await host.dispose()
    app.queries.dispose()
  }
})

it.each(['page', 'columns', 'reference'] as const)(
  'validates the actual %s receipt against the canonical query output contract',
  async (delivery) => {
    const app = fixture()
    const { createDocumentContextAction } =
      await import('../../src/ai/context-action')
    const { operationInputIssue } = await import('../operation-input-schema')
    const action = createDocumentContextAction(app.queries.read)
    try {
      const result = await action.execute(
        { scope: 'selection', fields: ['x'], delivery },
        { signal: app.signal }
      )
      expect(operationInputIssue(result, action.outputSchema)).toBeUndefined()
    } finally {
      app.queries.dispose()
    }
  }
)

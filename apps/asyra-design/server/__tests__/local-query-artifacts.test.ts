import type { AiToolStoreEntry } from '@asyra/ai-agent-runtime'
import { expect, it, vi } from 'vitest'
vi.mock('../../src/contexts', () => ({ default: {} }))
vi.mock('../../src/common-apis', () => ({}))
vi.mock('../../src/common-apis/fills', () => ({ fillApis: {} }))
import { createRetainedDesignContext } from '../../src/common-apis/retained-design-context'
import {
  createLocalToolLeases,
  type LocalToolOwnership
} from '../local-tool-leases'
import { createLocalQueryArtifacts } from '../local-query-artifacts'
import { AiActionNames } from '../../src/constants/ai-actions'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import {
  basicApiResultSchema,
  basicApiDeliverySchema
} from '../../src/ai/basic-api-results'
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
  const bridge = createLocalQueryArtifacts({
    ownership,
    release,
    actions: basicApiContracts.map((contract) => ({
      ...contract,
      inputSchema: contract.inputSchema,
      outputSchema: basicApiResultSchema(contract),
      ...(basicApiDeliverySchema(contract)
        ? {
            delivery: {
              path: '/modelResult',
              outputSchema: basicApiDeliverySchema(contract),
              receipt: { path: '/retained', owner: 'design-context' }
            }
          }
        : {})
    })) as never
  })
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

it('recovers a lost browser release acknowledgement without reviving the handle or releasing a sibling', async () => {
  const app = fixture()
  try {
    for (const callId of ['producer', 'sibling'])
      await app.leases.open({
        requestId: 'request',
        callId,
        input: null,
        inputSchema: { type: 'null' }
      })
    const receipt = app.read()
    await app.publish(receipt)
    app.setCall('sibling')
    const sibling = app.queries.read(
      {
        scope: 'ids',
        elementIds: ['part'],
        fields: ['x'],
        delivery: 'reference'
      },
      app.signal
    )
    await app.publish(sibling)
    app.release.mockImplementationOnce(async (snapshotId) => {
      app.queries.read(
        { scope: 'snapshot', snapshotId, release: true },
        app.signal
      )
      throw new Error('Release acknowledgement lost')
    })
    await expect(
      app.leases.release({ requestId: 'request', callId: 'producer' })
    ).rejects.toThrow('Release acknowledgement lost')
    expect(() =>
      app.queries.get(receipt.snapshotId, receipt.leaseId, app.signal)
    ).toThrow(/missing|lease/)
    await expect(
      app.leases.open({
        requestId: 'request',
        callId: 'invalid-consumer',
        input: receipt,
        inputSchema: receiptSchema
      })
    ).rejects.toThrow(/unavailable/)
    expect(
      app.queries.get(sibling.snapshotId, sibling.leaseId, app.signal)
        .orderedIds
    ).toEqual(['part'])
    await app.leases.release({ requestId: 'request', callId: 'producer' })
    await app.leases.release({ requestId: 'request', callId: 'producer' })
    expect(app.release.mock.calls.map(([id]) => id)).toEqual([
      receipt.snapshotId,
      receipt.snapshotId
    ])
    expect(() => app.ownership.assertOwned(receipt.snapshotId)).toThrow()
    expect(
      app.queries.get(sibling.snapshotId, sibling.leaseId, app.signal)
        .orderedIds
    ).toEqual(['part'])
    await app.leases.release({ requestId: 'request', callId: 'sibling' })
    expect(app.release.mock.calls.map(([id]) => id)).toEqual([
      receipt.snapshotId,
      receipt.snapshotId,
      sibling.snapshotId
    ])
  } finally {
    await app.leases.dispose()
    app.queries.dispose()
  }
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

it.each([
  ['selection', { scope: 'selection', fields: ['x'] }],
  ['children', { scope: 'children', fields: ['x'] }],
  [
    'region',
    {
      scope: 'region',
      bounds: { x: 0, y: 0, width: 100, height: 100 },
      fields: ['x']
    }
  ]
])(
  'composes a real %s query and fill consumer without exporting rows, then releases intermediate query data',
  async (_scope, query) => {
    const app = fixture()
    const { createLocalToolHost } = await import('../local-tool-host')
    const { createLocalOperationTools } =
      await import('../local-operation-tools')
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
                          runMutation: async (write, settled) => {
                            const value = write()
                            settled?.(value)
                            return value
                          }
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
          revision: 5,
          input: {
            kind: 'object',
            fields: { arguments: literal(query) }
          }
        },
        {
          id: 'map',
          tool: 'design_operations.map_retained_fills',
          revision: 6,
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
      const oldProposal = {
        ...proposal,
        steps: proposal.steps.map((step) => ({ ...step, revision: 4 }))
      }
      const rejected = JSON.parse(
        (
          await host.invoke({
            name: 'tool_library.submit_tool',
            input: { submissionId: 'old-shading', proposal: oldProposal }
          })
        ).text
      )
      expect(rejected).toMatchObject({ ok: false, code: 'admission' })
      expect(rejected.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'dependency', path: '/steps/0' }),
          expect.objectContaining({ code: 'dependency', path: '/steps/1' })
        ])
      )
      expect(observed).toHaveLength(0)
      expect(update).not.toHaveBeenCalled()
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
      const query = JSON.parse(
        (
          await host.invoke({
            name: 'design_operations.read_design_context',
            input: { arguments: { scope: 'selection', fields: ['x'] } }
          })
        ).text
      ).actionResults[0].result
      const mapped = JSON.parse(
        (
          await host.invoke({
            name: 'design_operations.execute_design_batch',
            input: {
              operations: [
                {
                  name: AiActionNames.MAP_RETAINED_FILLS,
                  arguments: {
                    mappings: [
                      {
                        snapshotId: query.snapshotId,
                        leaseId: query.leaseId,
                        coordinateSpace: 'parent-local',
                        axis: 'x',
                        domain: [0, 100],
                        index: 0,
                        outside: 'clamp',
                        stops: [
                          { at: 0, color: '#000000' },
                          { at: 1, color: '#ffffff' }
                        ]
                      }
                    ]
                  }
                }
              ],
              inspection: 'defer'
            }
          })
        ).text
      )
      expect(mapped.toolOutcome, JSON.stringify(mapped)).toMatchObject({
        status: 'success'
      })
      const retained = mapped.actionResults[0].result.retained
      expect(retained).toBeDefined()
      const recovered = JSON.parse(
        (
          await host.invoke({
            name: 'design_operations.read_design_context',
            input: {
              arguments: {
                scope: 'snapshot',
                snapshotId: retained.snapshotId,
                delivery: 'receipt'
              }
            }
          })
        ).text
      )
      expect(
        recovered.actionResults?.[0]?.result?.receipt,
        JSON.stringify(recovered)
      ).toMatchObject({
        appliedCount: 1,
        mutationScope: { elementIds: ['part'] }
      })
      expect(update).toHaveBeenCalledTimes(2)
    } finally {
      await host.dispose()
      app.queries.dispose()
    }
  }
)

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

it.each(['recipe', 'native', 'partial'] as const)(
  'hands structural children through real %s ownership and releases only finished leases',
  async (mode) => {
    const app = fixture()
    const { createLocalToolHost } = await import('../local-tool-host')
    const { createLocalOperationTools } =
      await import('../local-operation-tools')
    const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
    const { createDocumentContextReleaseAction, createDocumentContextAction } =
      await import('../../src/ai/context-action')
    const { createBasicApiActions } =
      await import('../../src/ai/basic-api-actions')
    const { requireBatchSuccess } = await import('../batch-exchange')
    const update = vi.fn((ids: string[]) => ids.map(() => 'changed'))
    const select = vi.fn(() => {
      throw new Error('The dependent selection failed after grouping.')
    })
    const group = vi.fn((ids: string[]) => ({
      groupId: 'container',
      elementIds: ids,
      bounds: { x: 0, y: 0, width: 1, height: 1 }
    }))
    let deliveredId = ''
    const actions = [
      ...createBasicApiActions(
        () => ({
          core: {},
          element: { setElementsVisible: update },
          hierarchy: { groupElements: group },
          fill: {},
          stroke: {},
          selection: { selectElements: select },
          viewport: {}
        }),
        { observe: () => () => undefined, resolve: () => 'live' },
        app.queries
      ).filter((a) =>
        [
          'api_hierarchy_groupElements',
          'api_element_setElementsVisible',
          'api_selection_selectElements'
        ].includes(a.name)
      ),
      createDocumentContextReleaseAction(app.queries.read),
      createDocumentContextAction(app.queries.read)
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
            async (batch) => {
              const receipt: import('../../src/ai/action-batch-protocol').AiBatchReceipt =
                {
                  context: null,
                  actionResults: []
                }
              for (const call of batch.actions) {
                const action = actions.find((item) => item.name === call.name)
                if (!action) throw new Error('Unknown action')
                try {
                  const actual = (await action.execute(
                    call.arguments as never,
                    {
                      signal: app.signal,
                      runMutation: async (write, settled) => {
                        const value = write()
                        settled?.(value)
                        return value
                      }
                    }
                  )) as { retained?: { snapshotId: string } }
                  if (actual.retained) deliveredId = actual.retained.snapshotId
                  receipt.actionResults.push({
                    actionId: call.id,
                    actionName: call.name,
                    result: JSON.parse(JSON.stringify(actual))
                  })
                } catch (error) {
                  return requireBatchSuccess(
                    batch,
                    {
                      ...receipt,
                      failure: {
                        code: 'ACTION_FAILED',
                        stage: 'execution',
                        message: (error as Error).message,
                        actionName: call.name,
                        settlement: receipt.actionResults.length
                          ? 'partial'
                          : 'not-started',
                        actionId: call.id,
                        actionExecutionMs: 1,
                        contextFresh: true
                      }
                    },
                    1
                  )
                }
              }
              return receipt
            },
            { ownership, requestSignal: app.signal }
          )
        }
      ]
    })
    const literal = (value: unknown) => ({ kind: 'literal', value })
    const proposal = {
      format: 1,
      name: 'group-and-hide',
      revision: 1,
      description:
        'Group supplied document identities and edit their exact retained children.',
      inputSchema: {
        type: 'array',
        items: { type: 'string', minLength: 1, 'x-runtime-value': 'document' }
      },
      outputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['status', 'groupId'],
        properties: {
          status: { type: 'string' },
          groupId: {
            type: 'string',
            minLength: 1,
            'x-runtime-value': 'document'
          }
        }
      },
      steps: [
        {
          id: 'group',
          tool: 'design_operations.api_hierarchy_groupElements',
          revision: 5,
          input: {
            kind: 'object',
            fields: {
              arguments: {
                kind: 'object',
                fields: { elementIds: { kind: 'input', path: '' } }
              },
              inspection: literal('defer')
            }
          }
        },
        {
          id: 'edit',
          tool: 'design_operations.api_element_setElementsVisible',
          revision: 4,
          input: {
            kind: 'object',
            fields: {
              arguments: {
                kind: 'object',
                fields: {
                  elementIds: {
                    kind: 'step',
                    step: 'group',
                    path: '/actionResults/0/result/retained'
                  },
                  visible: literal(false)
                }
              },
              inspection: literal('defer')
            }
          }
        }
      ],
      output: {
        kind: 'object',
        fields: {
          status: {
            kind: 'step',
            step: 'edit',
            path: '/actionResults/0/result/status'
          },
          groupId: {
            kind: 'step',
            step: 'group',
            path: '/actionResults/0/result/value/groupId'
          }
        }
      }
    }
    try {
      if (mode !== 'recipe') {
        const invoke = async (name: string, args: unknown) =>
          JSON.parse(
            (
              await host.invoke({
                name: 'design_operations.execute_design_batch',
                input: {
                  operations: [
                    { name, arguments: args },
                    ...(mode === 'partial' &&
                    name === 'api_hierarchy_groupElements'
                      ? [
                          {
                            name: 'api_selection_selectElements',
                            arguments: { elementIds: ['part'] }
                          },
                          {
                            name: 'api_selection_selectElements',
                            arguments: { elementIds: ['part'] }
                          }
                        ]
                      : [])
                  ],
                  inspection: 'defer'
                }
              })
            ).text
          )
        const produced = await invoke('api_hierarchy_groupElements', {
          elementIds: ['part']
        })
        expect(produced.toolOutcome, JSON.stringify(produced)).toMatchObject({
          status: mode === 'partial' ? 'partial' : 'success'
        })
        if (mode === 'partial') {
          expect(select).toHaveBeenCalledOnce()
          expect(update).not.toHaveBeenCalled()
          expect(produced.executionResult.actionResults).toHaveLength(1)
        }
        const delivered =
          mode === 'partial' ? produced.executionResult : produced
        const reference = delivered.actionResults[0].result.retained
        const read = JSON.parse(
          (
            await host.invoke({
              name: 'design_operations.read_design_context',
              input: {
                arguments: {
                  scope: 'snapshot',
                  snapshotId: reference.snapshotId,
                  delivery: 'receipt'
                }
              }
            })
          ).text
        )
        expect(read.toolOutcome, JSON.stringify(read)).toMatchObject({
          status: 'success'
        })
        expect(read.actionResults[0].result.receipt.value.elementIds).toEqual([
          'part'
        ])
        const edited = await invoke('api_element_setElementsVisible', {
          elementIds: reference,
          visible: false
        })
        expect(edited.toolOutcome, JSON.stringify(edited)).toMatchObject({
          status: 'success'
        })
        expect(group).toHaveBeenCalledOnce()
        expect(update).toHaveBeenCalledExactlyOnceWith(['part'], false)
        expect(app.queries.get(deliveredId).orderedIds).toEqual(['part'])
        await host.dispose()
        expect(() => app.queries.get(deliveredId)).toThrow(/missing/)
        return
      }
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
            input: { name: proposal.name, revision: 1, input: ['part'] }
          })
        ).text
      )
      expect(result, JSON.stringify(result)).toMatchObject({
        execution: {
          status: 'success',
          value: { status: 'complete', groupId: 'container' }
        },
        storage: { status: 'saved' }
      })
      expect(group).toHaveBeenCalledExactlyOnceWith(['part'])
      expect(update).toHaveBeenCalledExactlyOnceWith(['part'], false)
      expect(deliveredId).not.toBe('')
      expect(() => app.queries.get(deliveredId)).toThrow(/missing/)
    } finally {
      await host.dispose()
      app.queries.dispose()
    }
  }
)

it.each(['publish', 'publishAliases'] as const)(
  'preserves acknowledged writes after %s failure and reports unusable delivery even with a browser success outcome',
  async (method) => {
    const { localToolOutcome } = await import('../local-tool-invocation')
    const app = fixture()
    await app.leases.open({
      requestId: 'request',
      callId: 'producer',
      input: null,
      inputSchema: { type: 'null' }
    })
    const retained = app.queries.retainReceipt(
      ['part'],
      { value: { elementIds: ['part'] } },
      app.signal
    )
    app.ownership[method] = vi.fn(() => {
      throw new Error('Injected publication failure')
    })
    try {
      const receipt = await app.bridge.accept(
        {
          batchId: 'batch',
          actions: [
            {
              id: 'group',
              name: 'api_hierarchy_groupElements',
              arguments: { elementIds: ['part'] },
              summary: 'Group'
            }
          ]
        },
        {
          context: null,
          actionResults: [
            {
              actionId: 'group',
              actionName: 'api_hierarchy_groupElements',
              result: {
                status: 'complete',
                value: { groupId: 'container', elementIds: ['part'] },
                retained,
                toolOutcome: { status: 'success', settlement: 'completed' }
              }
            }
          ]
        }
      )
      expect(receipt.actionResults[0].result).toMatchObject({
        status: 'complete',
        value: { groupId: 'container' },
        delivery: { status: 'unavailable' }
      })
      expect(receipt.actionResults[0].result).not.toHaveProperty('retained')
      expect(localToolOutcome(receipt)).toMatchObject({
        status: 'partial',
        settlement: 'completed'
      })
      expect(app.release).toHaveBeenCalledExactlyOnceWith(retained.snapshotId)
    } finally {
      await app.leases.release({ requestId: 'request', callId: 'producer' })
      await app.leases.dispose()
      app.queries.dispose()
    }
  }
)

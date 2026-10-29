import { localToolFailureReply } from '../local-tool-invocation'
import * as registeredInvocation from '../local-tool-library-tools'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { toolResultObject, toolSemantics } from '../../src/ai/tool-contract'
import type { LocalToolOwnership } from '../local-tool-leases'
import { createLocalToolHost } from '../local-tool-host'
import { operationInputIssue } from '../operation-input-schema'
import modelDelivery from '../../test-data/knowledge-evaluation/__fixtures__/model-delivery-20261028.json'
import { expect, it, vi } from 'vitest'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import { createLocalOperationTools } from '../local-operation-tools'
import { requireBatchSuccess } from '../batch-exchange'
import { readCompleteInformation } from './tool-contract-assertions'
import recorded from './fixtures/recorded-101/batch-usage-20261026.json'

it('delivers selected batch usage independent of unrelated inventory and executes its real owner example', async () => {
  const hadWindow = 'window' in globalThis
  if (!hadWindow) vi.stubGlobal('window', {})
  const { default: core } = await import('../../src/contexts')
  const { applyPreset, PresetProfiles, PresetDefaults } =
    await import('@asyra/preset')
  const { createBasicApiActions } =
    await import('../../src/ai/basic-api-actions')
  const { observeAiAction } = await import('../../src/ai/runtime-input')
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [PresetDefaults.BASIC_SHAPES, PresetDefaults.CONTAINERS]
  })
  core.load({
    version: '1.0.0',
    props: {},
    sceneTree: {
      workspace: 'workspace',
      workspaceList: ['workspace'],
      elements: {
        workspace: {
          id: 'workspace',
          type: 'workspace',
          name: 'Workspace',
          parentId: '',
          children: [],
          visible: true,
          lock: false
        }
      }
    }
  })
  const { createRetainedDesignContext } =
    await import('../../src/common-apis/retained-design-context')
  const queries = createRetainedDesignContext(core, () => () => undefined)
  const { createDocumentContextAction, createDocumentContextReleaseAction } =
    await import('../../src/ai/context-action')
  const { createDesignReviewAction } =
    await import('../../src/ai/review-action')
  const { createDesignReviewer } =
    await import('../../src/common-apis/design-review')
  const { createAiInspectionAction } = await import('../../src/ai/inspection')
  const reviewer = createDesignReviewer(undefined, undefined, true)
  const review = createDesignReviewAction(reviewer.capture, reviewer.isCurrent)
  const owners = [
    review,
    createAiInspectionAction(() => ({
      available: true,
      image: { dataUrl: 'data:image/png;base64,eA==' }
    })),
    ...createBasicApiActions(undefined, undefined, queries),
    createDocumentContextAction(queries.read),
    createDocumentContextReleaseAction(queries.read)
  ].map((action) => observeAiAction(action))
  const contracts = owners.map((action) => createAiToolContract(action))
  const { default: factory } = await import('@asyra/factory')
  const { createAiTransactionRunner } = await import('../../src/ai/transaction')
  const transaction = createAiTransactionRunner()
  const dispatched: string[] = []
  let stopAfterFirst = false
  let boundIds: string[] | undefined
  const signal = new AbortController().signal
  const hosts: ReturnType<typeof createLocalToolHost>[] = []
  const setup = (unrelated = 0) => {
    let tools: ReturnType<typeof createLocalOperationTools>
    const build = (ownership: LocalToolOwnership) =>
      (tools = createLocalOperationTools(
        contracts,
        {
          modelActions: (v) => v,
          resolveBatch: (v) => v,
          resolveTargets: () => {
            if (!boundIds) throw new Error('Expired retained source')
            return boundIds
          }
        },
        async (batch) => {
          const actionResults = []
          for (const action of batch.actions) {
            const owner = owners.find((entry) => entry.name === action.name)
            if (!owner) throw new Error('Unexpected owner')
            dispatched.push(action.name)
            actionResults.push({
              actionId: action.id,
              actionName: action.name,
              result: (await transaction.run(
                'Apply selected edit',
                (runMutation) =>
                  owner.execute(action.arguments, {
                    signal,
                    runMutation
                  } as never),
                { signal }
              )) as never
            })
            if (stopAfterFirst) {
              stopAfterFirst = false
              return requireBatchSuccess(
                batch,
                {
                  context: {},
                  actionResults,
                  failure: {
                    code: 'ACTION_FAILED',
                    stage: 'execution',
                    message: 'Injected stop after acknowledged owner',
                    actionId: batch.actions[1].id,
                    actionName: batch.actions[1].name,
                    settlement: 'not-started',
                    actionExecutionMs: 1,
                    contextFresh: true
                  }
                },
                1
              )
            }
          }
          return { context: {}, actionResults }
        },
        {
          ownership,
          getNativeTools: () => [
            ...host.definitions(),
            ...Array.from({ length: unrelated }, (_, i) => ({
              name: `unrelated_${i}`,
              namespace: 'unrelated',
              description: 'Unrelated capability',
              inputSchema: { type: 'object' }
            }))
          ]
        }
      ))
    const host = createLocalToolHost({
      requestId: `usage-${unrelated}`,
      signal,
      capacity: 256,
      receiptCapacity: 32,
      artifactCapacity: 128,
      limits: {
        steps: 32,
        bindings: 128,
        bindingDepth: 32,
        bytes: 24000,
        issues: 8
      },
      store: {
        read: async () => undefined,
        list: async () => [],
        write: async () => {
          throw new Error('No recipe save requested')
        }
      },
      createGroups: (ownership) => [
        {
          name: 'design_operations',
          description: 'Operations',
          owner: build(ownership)
        }
      ]
    })
    hosts.push(host)
    const call = async (
      name: string,
      input: unknown,
      activeSignal = signal
    ) => {
      const definition = tools.definitions.find((d) => d.name === name)
      if (!definition) throw new Error('Missing tool definition')
      return JSON.parse(
        (
          await host.invoke({
            name: `design_operations.${name}`,
            input,
            signal: activeSignal
          })
        ).text
      )
    }
    return { tools, call, host }
  }
  try {
    const { call, host } = setup()
    const query = { operations: ['element.deleteElements'], view: 'usage' }
    const reply = await call('describe_design_apis', query)
    expect(reply.contentDelivery).toBeUndefined()
    const api = reply.apis[0]
    expect(api.usageGuide).toBeDefined()
    expect(
      operationInputIssue(
        modelDelivery.output.actionResults[0].result,
        modelDelivery.declaredOperation
      )
    ).toBeDefined()
    expect(api.usageGuide.instructions).toContain('Omit target-supplied')
    expect(JSON.stringify(api.usageGuide.parameters)).toContain('inspection')
    expect(JSON.stringify(api.usageGuide.operationParameters)).toContain(
      'uniqueItems'
    )
    expect(JSON.stringify(api.usageGuide.operationParameters)).toContain(
      'elementIds'
    )
    expect(JSON.stringify(api.usageGuide.results)).toContain('actionResults')
    expect(api.usageGuide.recovery).toMatch(/replay/i)
    expect(api.inputSchema).toBeUndefined()
    expect(api.outputSchema).toBeUndefined()
    const large = setup(10000)
    const inventory = await large.call('describe_design_apis', {
      query: 'Unrelated capability'
    })
    expect(inventory.count).toBe(10000)
    const expanded = await large.call('describe_design_apis', query)
    expect(expanded.resultKey).toEqual(expect.any(String))
    expect(reply.resultKey).toEqual(expect.any(String))
    expect(expanded.resultKey).not.toBe(reply.resultKey)
    expect({ ...expanded, resultKey: undefined }).toEqual({
      ...reply,
      resultKey: undefined
    })
    const replyBytes = Buffer.byteLength(JSON.stringify(reply))
    expect(replyBytes).toBeLessThan(recorded.baselineReplyBytes)
    const menu = await call('describe_design_apis', {
      query: 'element.deleteElements'
    })
    const selected = menu.apis.find(
      (entry: { operation: string }) =>
        entry.operation === 'element.deleteElements'
    )
    expect(selected.usage).toEqual({
      tool: 'describe_design_apis',
      arguments: query
    })
    const again = await call(
      api.definition.refresh.tool,
      api.definition.refresh.arguments
    )
    expect(again.apis[0].usageGuide).toEqual(api.usageGuide)
    expect(dispatched).toEqual([])
    const invocation = api.invocationExample.invocation
    expect(invocation.tool).toBe('execute_design_batch')
    const ids = invocation.arguments.operations[0].arguments.elementIds
    core.createElementsInParent(
      ids.map((id: string) => ({ id, type: 'rect', width: 20, height: 20 })),
      'workspace'
    )
    const saved = await core.save()
    const result = await call(invocation.tool, {
      ...invocation.arguments,
      inspection: 'defer'
    })
    expect(result.toolOutcome.status, JSON.stringify(result)).toBe('success')
    expect(operationInputIssue(result, api.usageGuide.results)).toBeUndefined()
    expect(
      operationInputIssue(
        {
          ...result,
          actionResults: [
            {
              ...result.actionResults[0],
              result: {
                ...result.actionResults[0].result,
                value: { count: -1 }
              }
            }
          ]
        },
        api.usageGuide.results
      )
    ).toBeDefined()
    // A selected contract must not validate another action through an open tail.
    for (const actionName of ['api_fill_addFills', 'unregistered_action']) {
      expect(
        operationInputIssue(
          {
            ...result,
            actionResults: [
              { ...result.actionResults[0], actionName, result: {} }
            ]
          },
          api.usageGuide.results
        ),
        actionName
      ).toBeDefined()
    }
    expect(result.actionResults[0].result.value).toEqual({ count: ids.length })
    expect(result.actionResults[0].result.modelResult).toBeUndefined()
    expect(
      operationInputIssue(modelDelivery.output, api.usageGuide.results)
    ).toBeUndefined()
    expect(Buffer.byteLength(JSON.stringify(reply))).toBeLessThan(
      modelDelivery.baselineReplyBytes
    )
    expect(dispatched).toEqual(['api_element_deleteElements'])
    for (const id of ids) expect(core.getElementMetadata(id)).toBeUndefined()
    const removed = await core.save()
    factory.undo()
    expect((await core.save()).sceneTree).toEqual(saved.sceneTree)
    factory.redo()
    expect((await core.save()).sceneTree).toEqual(removed.sceneTree)
    core.load(saved)
    for (const id of ids) expect(core.getElementMetadata(id)).toBeDefined()
    core.load(removed)
    for (const id of ids) expect(core.getElementMetadata(id)).toBeUndefined()
    const invalid = await call(invocation.tool, {
      operations: [
        { name: 'api_element_deleteElements', arguments: { elementIds: 5 } }
      ]
    })
    expect(invalid.toolOutcome.status).not.toBe('success')
    const cancelled = new AbortController()
    cancelled.abort()
    await expect(
      call(invocation.tool, invocation.arguments, cancelled.signal)
    ).rejects.toThrow('aborted')
    expect(dispatched).toHaveLength(1)
    // Saved target-only invocation uses the same batch binding contract.
    const savedInput = recorded.calls[3].input
    const missing = await call('execute_design_batch', savedInput)
    expect(missing.toolOutcome.status).toBe('failed')
    expect(dispatched).toHaveLength(1)
    boundIds = core.createElementsInParent(
      [{ type: 'rect', width: 10, height: 10 }],
      'workspace'
    )
    const targetResult = await call('execute_design_batch', savedInput)
    expect(targetResult.toolOutcome.status, JSON.stringify(targetResult)).toBe(
      'success'
    )
    expect(core.getElementMetadata(boundIds[0])).toBeUndefined()
    // A retained prefix may settle before interruption; retry only the pending operation.
    const pendingIds = core.createElementsInParent(
      [
        { type: 'rect', width: 10, height: 10 },
        { type: 'rect', width: 10, height: 10 }
      ],
      'workspace'
    )
    const pendingOperations = pendingIds.map((id) => ({
      ...invocation.arguments.operations[0],
      arguments: { elementIds: [id] }
    }))
    stopAfterFirst = true
    const partial = await call('execute_design_batch', {
      operations: pendingOperations,
      inspection: 'defer'
    })
    expect(partial.toolOutcome.status).not.toBe('success')
    expect(partial.recovery).toContain('do not replay acknowledged mutations')
    expect(operationInputIssue(partial, api.usageGuide.results)).toBeUndefined()
    const acknowledged = partial.executionResult.actionResults
    expect(
      operationInputIssue(
        {
          ...partial,
          executionResult: {
            ...partial.executionResult,
            actionResults: [
              {
                ...acknowledged[0],
                result: { ...acknowledged[0].result, value: { count: -1 } }
              }
            ]
          }
        },
        api.usageGuide.results
      )
    ).toBeDefined()
    expect(acknowledged).toHaveLength(1)
    expect(core.getElementMetadata(pendingIds[0])).toBeUndefined()
    expect(core.getElementMetadata(pendingIds[1])).toBeDefined()
    const beforeRetry = dispatched.length
    const resumed = await call('execute_design_batch', {
      operations: pendingOperations.slice(acknowledged.length),
      inspection: 'defer'
    })
    expect(resumed.toolOutcome.status, JSON.stringify(resumed)).toBe('success')
    expect(dispatched.length - beforeRetry).toBe(1)
    expect(core.getElementMetadata(pendingIds[1])).toBeUndefined()
    const multiple = JSON.parse(
      await readCompleteInformation(
        async (input) =>
          JSON.stringify(await call('describe_design_apis', input)),
        {
          operations: [
            'element.deleteElements',
            'element.updateElementProperties'
          ],
          view: 'usage'
        }
      )
    )
    expect(multiple.apis).toHaveLength(2)
    for (const selected of multiple.apis)
      expect(selected.usageGuide.operationParameters).toBeDefined()
    // Independent full schema remains available through the existing paged read.
    const full = JSON.parse(
      await readCompleteInformation(
        async (input) =>
          JSON.stringify(await call('describe_design_apis', input)),
        { operations: query.operations, view: 'full' }
      )
    )
    expect(full.apis[0].inputSchema).toBeDefined()
    // A native recipe dependency keeps canonical schemas, while its usage
    // describes the external envelope even when response=full is requested.
    const nativeQuery = {
      names: ['design_operations.api_element_deleteElements'],
      view: 'usage'
    }
    const nativeUsage = JSON.parse(
      await readCompleteInformation(
        async (input) =>
          JSON.stringify(await call('describe_design_apis', input)),
        nativeQuery
      )
    ).tools[0]
    const nativeInput = {
      ...nativeUsage.execution.arguments,
      input: { arguments: { elementIds: [] }, inspection: 'defer' }
    }
    expect(
      operationInputIssue(nativeInput, nativeUsage.usageGuide.parameters)
    ).toBeUndefined()
    const noChange = JSON.parse(
      (
        await host.invoke({
          name: `${nativeUsage.execution.namespace}.${nativeUsage.execution.tool}`,
          input: nativeInput
        })
      ).text
    )
    expect(noChange.execution.value.actionResults[0].result).toMatchObject({
      status: 'no-change',
      value: { count: 0 }
    })
    expect(
      operationInputIssue(noChange, nativeUsage.usageGuide.results)
    ).toBeUndefined()
    const nativePartial = {
      ...noChange,
      toolOutcome: { status: 'partial', settlement: 'completed' },
      execution: {
        ...noChange.execution,
        status: 'partial',
        value: JSON.parse(
          localToolFailureReply(
            'Inspect completed work; do not replay.',
            'FOLLOWUP_FAILED',
            {
              settlement: 'completed',
              executionResult: noChange.execution.value
            }
          ).text
        )
      }
    }
    expect(
      operationInputIssue(nativePartial, nativeUsage.usageGuide.results)
    ).toBeUndefined()
    for (const invalid of [
      {
        ...nativePartial.execution.value.executionResult.actionResults[0],
        actionName: 'unregistered_action'
      },
      {
        ...nativePartial.execution.value.executionResult.actionResults[0],
        result: {
          ...noChange.execution.value.actionResults[0].result,
          value: { count: -1 }
        }
      }
    ]) {
      const candidate = structuredClone(nativePartial)
      candidate.execution.value.executionResult.actionResults = [invalid]
      expect(
        operationInputIssue(candidate, nativeUsage.usageGuide.results)
      ).toBeDefined()
    }
    const fullResult = await call(invocation.tool, {
      ...invocation.arguments,
      operations: [{ name: api.name, arguments: { elementIds: [] } }],
      inspection: 'defer',
      response: 'full'
    })
    expect(fullResult.actionResults[0].result.value).toEqual({ count: 0 })
    expect(
      operationInputIssue(fullResult, api.usageGuide.results)
    ).toBeUndefined()
    const beforeRead = dispatched.filter((name) => name === api.name).length
    const historical = await call('read_design_context', {
      arguments: {
        scope: 'snapshot',
        snapshotId: result.actionResults[0].result.retained.snapshotId,
        delivery: 'receipt'
      },
      inspection: 'defer'
    })
    expect(
      historical.actionResults[0].result.receipt.value.removed.map(
        (item: { elementId: string }) => item.elementId
      )
    ).toEqual(ids)
    expect(dispatched.filter((name) => name === api.name)).toHaveLength(
      beforeRead
    )
    const dependency = JSON.parse(
      await readCompleteInformation(
        async (input) =>
          JSON.stringify(await call('describe_design_apis', input)),
        { names: nativeQuery.names, view: 'full' }
      )
    ).tools[0]
    expect(dependency.resultScope).toBe('internal-composition')
    expect(dependency.delivery.outputSchema).toBeDefined()
    expect(operationInputIssue(noChange, dependency.outputSchema)).toBeDefined()
    const field = await call('describe_design_apis', api.fieldQuery.arguments)
    expect(field.toolOutcome.status).toBe('success')
    for (const selection of [
      { names: [api.name], view: 'usage' },
      { query: 'element.deleteElements', view: 'usage' }
    ]) {
      const selected = JSON.parse(
        await readCompleteInformation(
          async (input) =>
            JSON.stringify(await call('describe_design_apis', input)),
          selection
        )
      )
      expect(selected.apis, JSON.stringify(selected)).toBeDefined()
      expect(selected.apis[0].usageGuide.results).toEqual(
        api.usageGuide.results
      )
    }
    const editId = core.createElementsInParent(
      [{ type: 'rect', width: 20, height: 20 }],
      'workspace'
    )[0]
    const editGuide = JSON.parse(
      await readCompleteInformation(
        async (input) =>
          JSON.stringify(await call('describe_design_apis', input)),
        {
          operations: ['element.setElementPositions'],
          view: 'usage'
        }
      )
    ).apis[0]
    const edited = await call('execute_design_batch', {
      operations: [
        {
          name: editGuide.name,
          arguments: { positionsById: { [editId]: { x: 10, y: 15 } } }
        }
      ],
      inspection: 'immediate',
      response: 'full'
    })
    expect(edited.toolOutcome.status, JSON.stringify(edited)).toBe('success')
    expect(
      operationInputIssue(edited, editGuide.usageGuide.results)
    ).toBeUndefined()
    const tails = edited.actionResults.filter(
      (entry: { actionName: string }) => entry.actionName !== editGuide.name
    )
    expect(
      tails.map((entry: { actionName: string }) => entry.actionName)
    ).toContain('review_design')
    expect(
      tails.map((entry: { actionName: string }) => entry.actionName)
    ).toContain('inspect_drawing')
    for (const tail of tails) {
      expect(
        operationInputIssue(
          {
            ...edited,
            actionResults: edited.actionResults.map((entry: unknown) =>
              entry === tail ? { ...tail, result: {} } : entry
            )
          },
          editGuide.usageGuide.results
        )
      ).toBeDefined()
    }
    process.stdout.write(
      JSON.stringify({
        selectedBatchUsage: {
          replyBytes,
          baselineReplyBytes: modelDelivery.baselineReplyBytes,
          pages: 1,
          unrelatedOperations: 10000
        }
      }) + '\n'
    )
  } finally {
    for (const host of hosts) await host.dispose()
    queries.dispose()
    reviewer.dispose()
    if (!hadWindow) vi.unstubAllGlobals()
  }
})

it.each(
  ['direct', 'registry'].flatMap((exposure) =>
    [
      'closed',
      'reference',
      'union',
      'intersection',
      'bounded',
      'canonical',
      'canonical-bounded',
      'canonical-reference',
      'canonical-metadata-intersection',
      'canonical-metadata-reference',
      'scoped'
    ].map((shape) => ({ exposure, shape }))
  )
)(
  'uses real host $exposure delivery with $shape constraints and failed delivery without replay',
  async ({ exposure, shape }) => {
    let calls = 0
    let view: unknown = { count: 3 }
    const closed = {
      type: 'object',
      properties: {
        count: { $ref: '#/$defs/count' },
        nested: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
          additionalProperties: false
        }
      },
      required: ['count'],
      additionalProperties: false
    }
    const variants: Record<string, object> = {
      reference: { $ref: '#/$defs/result' },
      union: { anyOf: [closed, { type: 'string', const: 'empty' }] },
      intersection: {
        allOf: [closed, { properties: { count: { maximum: 3 } } }]
      },
      bounded: {
        ...closed,
        minProperties: 1,
        maxProperties: 1,
        propertyNames: { enum: ['count'] }
      }
    }
    variants['canonical-metadata-intersection'] = {
      type: 'object',
      properties: { toolOutcome: { type: 'object' } },
      allOf: [closed]
    }
    variants['canonical-metadata-reference'] = {
      properties: { toolOutcome: { type: 'object' } },
      $ref: '#/$defs/result'
    }
    variants['canonical-bounded'] = variants.bounded
    variants['canonical-reference'] = variants.reference
    const viewSchema = {
      ...(variants[shape] ?? closed),
      $defs: { count: { type: 'integer', minimum: 0 }, result: closed }
    }
    const design = createLocalDesignTools([
      { name: 'apply_prepared_design', description: 'Apply', inputSchema: {} }
    ])
    const ops = createLocalOperationTools(
      [
        { name: 'apply_prepared_design', description: 'Apply', inputSchema: {} }
      ],
      design,
      async () => {
        throw new Error('No mutation')
      }
    )
    const workflow = createLocalDesignWorkflow(design, ops)
    const workflowSchema = workflow.definitions[0].inputSchema
    const source = {
      name: 'retained_source',
      ...(exposure === 'registry'
        ? { providerExposure: 'registry' as const }
        : {}),
      description: 'Deliver the count of retained identities.',
      inputSchema:
        shape === 'scoped'
          ? workflowSchema
          : {
              type: 'object',
              properties: {},
              additionalProperties: false,
              examples: [{}]
            },
      ...toolSemantics(
        shape.startsWith('canonical')
          ? viewSchema
          : toolResultObject({
              ids: { type: 'array' },
              payload: toolResultObject({ view: true }, [])
            }),
        'read',
        []
      ),
      ...(shape.startsWith('canonical')
        ? {}
        : {
            delivery: {
              path: '/payload/view',
              outputSchema: viewSchema
            }
          }),
      composition: 'allowed' as const
    }
    const signal = new AbortController().signal
    let operations: ReturnType<typeof createLocalOperationTools>
    const host = createLocalToolHost({
      requestId: 'native-model-usage',
      signal,
      capacity: 32,
      receiptCapacity: 16,
      artifactCapacity: 32,
      limits: {
        steps: 16,
        bindings: 64,
        bindingDepth: 16,
        bytes: 24000,
        issues: 8
      },
      store: {
        read: async () => undefined,
        list: async () => [],
        write: async () => {
          throw new Error('No recipe write')
        }
      },
      createGroups: () => {
        operations = createLocalOperationTools(
          [
            {
              name: 'apply_prepared_design',
              description: 'Apply',
              inputSchema: {}
            }
          ],
          { modelActions: (v) => v, resolveBatch: (v) => v },
          async () => {
            throw new Error('No browser mutation')
          },
          {
            getNativeTools: () => host.definitions()
          }
        )
        return [
          {
            name: 'design_operations',
            description: 'Discovery',
            owner: operations
          },
          {
            name: 'fixture',
            description: 'Registered view owner',
            owner: {
              definitions: [source],
              call: async () => {
                calls++
                if (view === 'interrupted')
                  return JSON.stringify({
                    available: false,
                    recoverable: true,
                    code: 'OWNER_INTERRUPTED',
                    message: 'Read completed evidence; do not replay.',
                    settlement: 'partial',
                    executionResult: {
                      actionResults: [
                        { actionName: 'source', result: { ids: ['a'] } }
                      ]
                    }
                  })
                if (shape.startsWith('canonical')) return JSON.stringify(view)
                return JSON.stringify({
                  ids: ['a', 'b', 'c'],
                  payload: { view }
                })
              }
            }
          }
        ]
      }
    })
    const wrapper = vi.spyOn(
      registeredInvocation,
      'registeredToolInvocationSchemas'
    )
    try {
      const query = {
        names: ['fixture.retained_source'],
        view: 'usage',
        ...(shape === 'scoped'
          ? { inputScope: { operation: 'draft', nodeTypes: ['pattern'] } }
          : {})
      }
      const read = async (input: unknown) =>
        (
          await host.invoke({
            name: 'design_operations.describe_design_apis',
            input
          })
        ).text
      const discovered = JSON.parse(await readCompleteInformation(read, query))
      expect(discovered.tools, JSON.stringify(discovered)).toBeDefined()
      expect(wrapper).toHaveBeenCalledTimes(exposure === 'registry' ? 1 : 0)
      const entry = discovered.tools[0]
      const invocation = entry.invocationExample.invocation
      expect(invocation).toBeDefined()
      expect(
        operationInputIssue(invocation.arguments, entry.usageGuide.parameters)
      ).toBeUndefined()
      const invoke = () =>
        host.invoke({
          name: `${entry.execution.namespace}.${invocation.tool}`,
          input: invocation.arguments
        })
      const reply = await invoke()
      expect(reply.success, reply.text).toBe(true)
      const success = JSON.parse(reply.text)
      expect(
        operationInputIssue(success, entry.usageGuide.results)
      ).toBeUndefined()
      const valueOf = (result: typeof success) =>
        exposure === 'registry' ? result.execution.value : result
      expect(valueOf(success).count).toBe(3)
      if (exposure === 'registry') {
        const savedFailure = {
          ...success,
          storage: { status: 'unsaved', issue: 'Injected storage outage' },
          toolOutcome: { status: 'partial', settlement: 'completed' }
        }
        expect(
          operationInputIssue(savedFailure, entry.usageGuide.results)
        ).toBeUndefined()
        const { value: _value, ...missing } = success.execution
        expect(
          operationInputIssue(
            {
              ...savedFailure,
              execution: missing
            },
            entry.usageGuide.results
          )
        ).toBeDefined()
        expect(calls).toBe(1)
      }

      expect(
        operationInputIssue(
          exposure === 'registry'
            ? {
                ...success,
                execution: {
                  ...success.execution,
                  value: { ...valueOf(success), unrelated: true }
                }
              }
            : { ...success, unrelated: true },
          entry.usageGuide.results
        )
      ).toBeDefined()
      const modifiedResult = (value: unknown) =>
        exposure === 'registry'
          ? { ...success, execution: { ...success.execution, value } }
          : value
      for (const invalid of [
        { ...valueOf(success), count: -1 },
        { ...valueOf(success), nested: { id: 'child', unrelated: true } },
        {
          ...valueOf(success),
          toolOutcome: { status: 'invented', settlement: 'completed' }
        }
      ])
        expect(
          operationInputIssue(modifiedResult(invalid), entry.usageGuide.results)
        ).toBeDefined()
      expect(success.ids).toBeUndefined()
      expect(success.payload).toBeUndefined()
      const outerFailure = await host.invoke({
        name: `${entry.execution.namespace}.${invocation.tool}`,
        input:
          exposure === 'registry'
            ? { ...invocation.arguments, revision: 0 }
            : { unknown: true }
      })
      expect(outerFailure.success).toBe(false)
      expect(JSON.parse(outerFailure.text).toolOutcome.settlement).toBe(
        'not-started'
      )
      expect(
        operationInputIssue(
          JSON.parse(outerFailure.text),
          entry.usageGuide.results
        )
      ).toBeUndefined()
      expect(calls).toBe(1)
      if (shape.startsWith('canonical')) {
        expect(calls).toBe(1)
        return
      }
      for (view of [undefined, { count: -1 }]) {
        const failed = await invoke()
        const result = JSON.parse(failed.text)
        expect(failed.success).toBe(false)
        expect(valueOf(result)).toMatchObject({
          code: 'TOOL_DELIVERY_INVALID',
          toolOutcome: { status: 'partial', settlement: 'completed' }
        })
        expect(valueOf(result).message).toContain('must not be replayed')
        expect(
          operationInputIssue(result, entry.usageGuide.results)
        ).toBeUndefined()
      }
      expect(calls).toBe(3)
      const refreshed = JSON.parse(
        await readCompleteInformation(read, entry.definition.refresh.arguments)
      ).tools[0]
      expect(refreshed.usageGuide).toEqual(entry.usageGuide)
      expect(calls).toBe(3)
      view = 'interrupted'
      const partial = JSON.parse((await invoke()).text)
      expect(valueOf(partial).code).toBe('OWNER_INTERRUPTED')
      expect(
        valueOf(partial).executionResult.actionResults[0].result.ids
      ).toEqual(['a'])
      expect(
        operationInputIssue(partial, entry.usageGuide.results)
      ).toBeUndefined()
      const invalid = await host.invoke({
        name: `${entry.execution.namespace}.${invocation.tool}`,
        input:
          exposure === 'registry'
            ? { ...invocation.arguments, input: { unknown: true } }
            : { unknown: true }
      })
      const rejected = JSON.parse(invalid.text)
      expect(invalid.success).toBe(false)
      if (exposure === 'registry') {
        expect(rejected.execution).toMatchObject({
          status: 'failed',
          settlement: 'not-started',
          calls: [
            {
              name: invocation.arguments.name,
              status: 'failed',
              settlement: 'not-started'
            }
          ]
        })
        expect(rejected.execution.issues.join(' ')).toContain('unknown')
        expect(
          operationInputIssue(rejected, entry.usageGuide.results)
        ).toBeUndefined()
      } else
        expect(rejected).toMatchObject({
          stage: 'admission',
          settlement: 'not-started'
        })
      await expect(
        host.invoke({
          name: `${entry.execution.namespace}.${invocation.tool}`,
          input: invocation.arguments,
          signal: AbortSignal.abort()
        })
      ).rejects.toThrow()
      if (exposure === 'registry') {
        expect(entry.usageGuide.recovery).toContain('save_tool with receiptId')
        const stale = JSON.parse(
          (
            await host.invoke({
              name: `${entry.execution.namespace}.${invocation.tool}`,
              input: {
                ...invocation.arguments,
                revision: invocation.arguments.revision + 1
              }
            })
          ).text
        )
        expect(stale.execution.status).toBe('failed')
        expect(stale.execution.settlement).toBe('not-started')
        expect(
          operationInputIssue(stale, entry.usageGuide.results)
        ).toBeUndefined()
      }
      expect(calls).toBe(4)
    } finally {
      wrapper.mockRestore()
      await host.dispose()
    }
  }
)

import { expect, it, vi } from 'vitest'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import { createLocalOperationTools } from '../local-operation-tools'
import { invokeLocalTool } from '../local-tool-invocation'
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
  const owners = createBasicApiActions(undefined, undefined, queries).map(
    (action) => observeAiAction(action)
  )
  const contracts = owners.map((action) => createAiToolContract(action))
  const { default: factory } = await import('@asyra/factory')
  const { createAiTransactionRunner } = await import('../../src/ai/transaction')
  const transaction = createAiTransactionRunner()
  const dispatched: string[] = []
  let stopAfterFirst = false
  let boundIds: string[] | undefined
  const signal = new AbortController().signal
  const setup = (unrelated = 0) => {
    const tools = createLocalOperationTools(
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
        getNativeTools: () => [
          ...tools.definitions.map((d) => ({
            ...d,
            namespace: 'design_operations'
          })),
          ...Array.from({ length: unrelated }, (_, i) => ({
            name: `unrelated_${i}`,
            namespace: 'unrelated',
            description: 'Unrelated capability',
            inputSchema: { type: 'object' }
          }))
        ]
      }
    )
    const call = async (
      name: string,
      input: unknown,
      activeSignal = signal
    ) => {
      const definition = tools.definitions.find((d) => d.name === name)
      if (!definition) throw new Error('Missing tool definition')
      return JSON.parse(
        (await invokeLocalTool(tools, definition, input, activeSignal)).text
      )
    }
    return { tools, call }
  }
  try {
    const { call } = setup()
    const query = { operations: ['element.deleteElements'], view: 'usage' }
    const reply = await call('describe_design_apis', query)
    expect(reply.contentDelivery).toBeUndefined()
    const api = reply.apis[0]
    expect(api.usageGuide).toBeDefined()
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
    const acknowledged = partial.executionResult.actionResults
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
    process.stdout.write(
      JSON.stringify({
        selectedBatchUsage: {
          replyBytes,
          baselineReplyBytes: recorded.baselineReplyBytes,
          pages: 1,
          unrelatedOperations: 10000
        }
      }) + '\n'
    )
  } finally {
    queries.dispose()
    if (!hadWindow) vi.unstubAllGlobals()
  }
})

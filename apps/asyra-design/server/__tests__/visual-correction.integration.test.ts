import { expect, it, vi } from 'vitest'
import { createLocalOperationTools as createOperationOwner } from '../local-operation-tools'
import type { AiBatchReceipt } from '../../src/ai/action-batch-protocol'

it('executes correction discovery through real owners and recovers only the unfinished edit', async () => {
  const hadWindow = 'window' in globalThis

  if (!hadWindow) {
    vi.stubGlobal('window', {})
  }

  const { default: core } = await import('@asyra/core')
  const { applyPreset, PresetProfiles, PresetDefaults } =
    await import('@asyra/preset')
  const { createBasicApiActions } =
    await import('../../src/ai/basic-api-actions')
  const { createAiTransactionRunner } = await import('../../src/ai/transaction')
  const { createAiToolContract, createAiAgentRuntime } =
    await import('@asyra/ai-agent-runtime')
  const { operationInputIssue } = await import('../operation-input-schema')

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
          visible: true,
          lock: false,
          children: []
        }
      }
    }
  })
  core.createElementsInParent(
    [
      { id: 'part', type: 'rect', x: 0, y: 0, width: 20, height: 30 },
      { id: 'independent', type: 'rect', x: 40, y: 0, width: 20, height: 30 }
    ],
    'workspace'
  )
  const actions = createBasicApiActions().filter(
    (action) => action.name === 'api_fill_updateFillsAtIndex'
  )
  const runner = createAiTransactionRunner()
  const receipts: AiBatchReceipt[] = []
  const invoked: string[][] = []
  const signal = new AbortController().signal
  const tools = createOperationOwner(
    actions.map(createAiToolContract),
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    async (batch) => {
      invoked.push(
        batch.actions.map((a) =>
          String((a.arguments as { elementIds: string[] }).elementIds)
        )
      )
      let receipt: AiBatchReceipt | undefined
      const runtime = createAiAgentRuntime({
        provider: {
          requestActionBatch: async (_input, options) => {
            receipt = (await options.executeBatch?.(
              batch as never
            )) as AiBatchReceipt

            return { batchId: 'report', actions: [] }
          }
        },
        actionDefinitions: actions,
        contextProvider: { getContext: async () => ({}) },
        permissionPolicy: { evaluate: () => 'allow' },
        confirmationHandler: { confirm: async () => true },
        transactionRunner: runner
      })

      try {
        await runtime.run({ intent: 'Correct selected surface', signal })
        if (!receipt) {
          throw new Error('Missing actual runtime receipt')
        }

        receipts.push(receipt)

        return receipt
      } finally {
        await runtime.dispose()
      }
    }
  )

  try {
    const selection = {
      view: 'usage',
      query: 'fill.updateFillsAtIndex'
    }
    const missing = JSON.parse(
      await tools.call(
        'describe_design_apis',
        {
          view: 'usage',
          query: 'unregistered-correction-capability'
        },
        signal
      )
    )

    expect(missing.apis).toEqual([])
    expect(invoked).toHaveLength(0)
    const lookup = JSON.parse(
      await tools.call('describe_design_apis', selection, signal)
    )

    expect(lookup.missingNames).toEqual([])
    const contract = lookup.apis[0]

    expect(contract.execution.kind).toBe('batch-action')
    const args = { elementIds: ['part'], index: 0, patch: { color: '#334455' } }

    expect(contract.usageGuide.operationParameters).toBeDefined()
    expect(
      operationInputIssue(args, contract.usageGuide.operationParameters)
    ).toBeUndefined()
    const before = await core.save()
    const independent = core.getElementComputedData('independent', ['fills'])

    const invoke = (input: typeof args, currentSignal = signal) =>
      tools.call(
        contract.execution.tool,
        {
          inspection: 'defer',
          operations: [{ name: contract.name, arguments: input }]
        },
        currentSignal
      )

    await expect(invoke({ ...args, index: -1 })).rejects.toThrow()
    const cancelled = new AbortController()

    cancelled.abort()
    await expect(invoke(args, cancelled.signal)).rejects.toThrow()
    expect(invoked).toHaveLength(0)
    expect(await core.save()).toEqual(before)
    const partial = JSON.parse(
      await tools.call(
        contract.execution.tool,
        {
          inspection: 'defer',
          operations: [
            { name: contract.name, arguments: args },
            {
              name: contract.name,
              arguments: { ...args, elementIds: ['unavailable'] }
            }
          ]
        },
        signal
      )
    )

    expect(partial, JSON.stringify(partial)).toHaveProperty('actionResults')
    expect(
      partial.actionResults[0]?.result,
      JSON.stringify(partial)
    ).toMatchObject({ status: 'complete', acceptedCount: 1, unavailableCount: 0, settlement: 'completed' })
    expect(partial.failure).toMatchObject({ settlement: 'not-started' })
    expect(core.getElementComputedData('part', ['fills'])?.fills).toMatchObject(
      [{ color: '#334455' }]
    )
    // Resume only the unavailable identity once it exists. Never resend the acknowledged part.
    core.createElementsInParent(
      [{ id: 'unavailable', type: 'rect', x: 80, y: 0, width: 20, height: 30 }],
      'workspace'
    )
    await invoke({ ...args, elementIds: ['unavailable'] })
    expect(invoked).toEqual([['part', 'unavailable'], ['unavailable']])
    expect(receipts).toHaveLength(2)
    const { default: factory } = await import('@asyra/factory')

    factory.undo()
    expect(core.getElementComputedData('part', ['fills'])?.fills).toMatchObject(
      [{ color: '#334455' }]
    )
    expect(
      core.getElementComputedData('unavailable', ['fills'])?.fills?.[0].color
    ).not.toBe('#334455')
    factory.redo()
    expect(
      core.getElementComputedData('unavailable', ['fills'])?.fills
    ).toMatchObject([{ color: '#334455' }])

    expect(core.getElementComputedData('independent', ['fills'])).toEqual(
      independent
    )
    const saved = await core.save()

    core.load(saved)
    expect(core.getElementComputedData('part', ['fills'])?.fills).toMatchObject(
      [{ color: '#334455' }]
    )
    expect(
      core.getElementComputedData('unavailable', ['fills'])?.fills
    ).toMatchObject([{ color: '#334455' }])
  } finally {
    if (!hadWindow) {
      vi.unstubAllGlobals()
    }
  }
})

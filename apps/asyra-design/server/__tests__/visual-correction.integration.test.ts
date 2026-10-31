import { expect, it, vi } from 'vitest'
import { createLocalDesignReview } from '../local-design-review'
import { createLocalOperationTools as createOperationOwner } from '../local-operation-tools'
import type { AiBatchReceipt } from '../../src/ai/action-batch-protocol'

it('executes correction discovery through real owners and recovers only the unfinished edit', async () => {
  const review = createLocalDesignReview()
  review.record({
    phase: 'plan',
    method: 'Correct the observed surface',
    references: [],
    criteria: {
      appearance: {
        requirement: 'Requested finish',
        description: 'Observed appearance agrees',
        verification: 'visual',
        requiredUnits: []
      }
    },
    structureCriteria: [],
    detailRequired: false
  })
  const image = review.inspect('part', true, true)
  if (!image) {
    throw new Error('Missing image')
  }
  const bound = review.bindReview('visual', [
    { criterionId: 'appearance', inspectionIds: [image.inspectionId] }
  ])
  const result = review.recordBoundReview({
    ...bound,
    checks: bound.checks.map((check) => ({
      ...check,
      status: 'fail',
      evidence: 'The selected surface needs a different color'
    }))
  })
  expect(result.accepted).toBe(false)
  await exerciseCorrectionConsumer(
    result.correction as ReturnType<typeof review.correctionContext>
  )
  review.invalidateInspections(
    [image.inspectionId],
    'Confirmed selected material change'
  )
  expect(review.isAccepted()).toBe(false)
  expect(review.correctionContext().unavailableInspectionIds).toEqual([
    image.inspectionId
  ])
  expect(() =>
    review.recordBoundReview({
      ...bound,
      checks: bound.checks.map((check) => ({
        ...check,
        status: 'pass',
        evidence: 'Old image is not current evidence'
      }))
    })
  ).toThrow()
  const fresh = review.inspect('part', true, true)
  if (!fresh) {
    throw new Error('Missing fresh image')
  }
  const next = review.bindReview('visual', [
    { criterionId: 'appearance', inspectionIds: [fresh.inspectionId] }
  ])
  expect(
    review.recordBoundReview({
      ...next,
      final: true,
      checks: next.checks.map((check) => ({
        ...check,
        status: 'pass',
        evidence: 'New explicit judgment of the corrected surface'
      }))
    }).accepted
  ).toBe(true)
})

/** Consumer decisions are explicit fixture input, never inferred from image coverage. */
async function exerciseCorrectionConsumer(
  correction: ReturnType<
    ReturnType<typeof createLocalDesignReview>['correctionContext']
  >
) {
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
    { modelActions: (a) => a, resolveBatch: (b) => b },
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
    if (!correction.discovery) {
      throw new Error('Missing correction discovery')
    }
    const selection = {
      ...correction.discovery.arguments,
      query: 'fill.updateFillsAtIndex'
    }
    const missing = JSON.parse(
      await tools.call(
        correction.discovery.tool,
        {
          ...correction.discovery.arguments,
          query: 'unregistered-correction-capability'
        },
        signal
      )
    )
    expect(missing.apis).toEqual([])
    expect(invoked).toHaveLength(0)
    const lookup = JSON.parse(
      await tools.call(correction.discovery.tool, selection, signal)
    )
    expect(lookup.missingNames).toEqual([])
    const contract = lookup.apis[0]
    expect(contract.execution.kind).toBe('batch-action')
    const args = { elementIds: ['part'], index: 0, patch: { color: '#334455' } }
    expect(operationInputIssue(args, contract.inputSchema)).toBeUndefined()
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
    ).toMatchObject({ status: 'complete', acceptedIds: ['part'] })
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
}

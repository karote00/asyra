import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import { createLocalDesignReview } from '../local-design-review'
import { AiDesignToolIds } from '../../src/constants/ai-design'
import type { AiActionBatch } from '../../src/ai/action-batch-protocol'
import { describe, expect, it, vi } from 'vitest'
import {
  createLocalOperationTools,
  LocalOperationPreparationError,
  localToolContent
} from '../local-operation-tools'
import { createLocalImageTools } from '../local-image-tools'
import { AiActionNames } from '../../src/constants/ai-actions'

describe('backend operation tools', () => {
  it('reviews measurements before images and resolves text overflow before completion', async () => {
    let overflow = true
    const executeBatch = vi.fn(async (batch: AiActionBatch) => ({
      actionResults: [
        {
          actionId: 'r',
          actionName: batch.actions[0].name,
          result:
            batch.actions[0].name === AiActionNames.REVIEW_DESIGN
              ? {
                  complete: true,
                  measuredTextIds: ['t'],
                  findings: overflow
                    ? [{ kind: 'text-overflow', elementId: 't', bottom: 40 }]
                    : []
                }
              : { available: true, compositionId: 'f' }
        }
      ],
      context: {}
    }))
    const operations = createLocalOperationTools(
      [
        AiActionNames.UPDATE_DESIGN_ELEMENT,
        AiActionNames.REVIEW_DESIGN,
        AiActionNames.INSPECT_DRAWING
      ].map((name) => ({ name, description: name, inputSchema: {} })),
      { modelActions: (a) => a, resolveBatch: (v) => v },
      executeBatch
    )
    const signal = new AbortController().signal
    await operations.call(
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      { arguments: { elementId: 't' } },
      signal
    )
    expect(executeBatch.mock.calls.map(([b]) => b.actions[0].name)).toEqual([
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      AiActionNames.REVIEW_DESIGN
    ])
    const outcome = {
      batchId: 'done',
      actions: [
        {
          id: 'done',
          name: AiActionNames.REPORT_OUTCOME,
          arguments: { outcome: 'completed' },
          summary: 'Done'
        }
      ]
    }
    expect(
      operations.settleOutcome(outcome).actions[0].arguments
    ).toMatchObject({ outcome: 'unsupported' })
    executeBatch.mockImplementationOnce(async () => ({
      actionResults: [
        {
          actionId: 'other',
          actionName: AiActionNames.REVIEW_DESIGN,
          result: { complete: true, measuredTextIds: ['other'], findings: [] }
        }
      ],
      context: {}
    }))
    await operations.call(
      AiActionNames.REVIEW_DESIGN,
      { arguments: { elementId: 'other' } },
      signal
    )
    expect(
      operations.settleOutcome(outcome).actions[0].arguments
    ).toMatchObject({ outcome: 'unsupported' })
    overflow = false
    executeBatch.mockClear()
    await operations.call(
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      { arguments: { elementId: 't' } },
      signal
    )
    expect(executeBatch.mock.calls.map(([b]) => b.actions[0].name)).toEqual([
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.INSPECT_DRAWING
    ])
    expect(
      operations.settleOutcome(outcome).actions[0].arguments
    ).toMatchObject({ outcome: 'unsupported' })
  })

  it('continues cheap correction cycles beyond eight while preserving read-only review', async () => {
    const executeBatch = vi.fn(async (batch: AiActionBatch) => ({
      actionResults: [
        {
          actionId: 'r',
          actionName: batch.actions[0].name,
          result:
            batch.actions[0].name === AiActionNames.REVIEW_DESIGN
              ? { complete: true, findings: [{ kind: 'text-overflow' }] }
              : { compositionId: 'f' }
        }
      ],
      context: {}
    }))
    const operations = createLocalOperationTools(
      [
        AiActionNames.UPDATE_DESIGN_ELEMENT,
        AiActionNames.REVIEW_DESIGN,
        AiActionNames.INSPECT_DRAWING
      ].map((name) => ({ name, description: name, inputSchema: {} })),
      { modelActions: (a) => a, resolveBatch: (v) => v },
      executeBatch
    )
    const signal = new AbortController().signal
    for (let i = 0; i < 9; i++)
      await operations.call(
        AiActionNames.UPDATE_DESIGN_ELEMENT,
        { arguments: { elementId: 't' } },
        signal
      )
    expect(
      executeBatch.mock.calls.filter(
        ([b]) => b.actions[0].name === AiActionNames.UPDATE_DESIGN_ELEMENT
      )
    ).toHaveLength(9)
    await operations.call(
      AiActionNames.REVIEW_DESIGN,
      { arguments: { elementId: 'f' } },
      signal
    )
    expect(executeBatch.mock.calls.at(-1)?.[0].actions[0].name).toBe(
      AiActionNames.REVIEW_DESIGN
    )
  })

  it.each(['read_design_context', 'review_design'])(
    'reads %s without automatic inspection or a failed review outcome',
    async (readAction) => {
      const executeBatch = vi.fn(async () => ({
        actionResults: [],
        context: {}
      }))
      const operations = createLocalOperationTools(
        [readAction, AiActionNames.INSPECT_DRAWING].map((name) => ({
          name,
          description: name,
          inputSchema: {}
        })),
        { modelActions: (actions) => actions, resolveBatch: (value) => value },
        executeBatch
      )
      await operations.call(
        readAction,
        { arguments: { scope: 'selection' } },
        new AbortController().signal
      )
      expect(executeBatch).toHaveBeenCalledTimes(1)
      const batch = {
        batchId: 'read',
        actions: [
          {
            id: 'r',
            name: readAction,
            arguments: { scope: 'selection' }
          }
        ]
      }
      expect(operations.settleOutcome(batch)).toBe(batch)
    }
  )

  it('can read after the visual correction budget is exhausted', async () => {
    const executeBatch = vi.fn(async (batch: AiActionBatch) => ({
      actionResults: [
        {
          actionId: 'r',
          actionName: batch.actions[0].name,
          result: { available: true }
        }
      ],
      context: {}
    }))
    const operations = createLocalOperationTools(
      [AiActionNames.READ_DESIGN_CONTEXT, AiActionNames.INSPECT_DRAWING].map(
        (name) => ({ name, description: name, inputSchema: {} })
      ),
      { modelActions: (actions) => actions, resolveBatch: (value) => value },
      executeBatch
    )
    const signal = new AbortController().signal
    for (let i = 0; i < 6; i++)
      await operations.call(
        AiActionNames.INSPECT_DRAWING,
        { arguments: { elementId: 'drawing' } },
        signal
      )
    await operations.call(
      AiActionNames.READ_DESIGN_CONTEXT,
      { arguments: { scope: 'selection' } },
      signal
    )
    expect(executeBatch).toHaveBeenCalledTimes(7)
    expect(executeBatch.mock.calls[6][0].actions[0].name).toBe(
      AiActionNames.READ_DESIGN_CONTEXT
    )
  })

  it('reviews hierarchy operations from their receipt without requiring a drawing snapshot', async () => {
    const executeBatch = vi.fn(async () => ({ actionResults: [], context: {} }))
    const operations = createLocalOperationTools(
      ['organize_design', AiActionNames.INSPECT_DRAWING].map((name) => ({
        name,
        description: name,
        inputSchema: {}
      })),
      { modelActions: (actions) => actions, resolveBatch: (value) => value },
      executeBatch
    )
    const result = await operations.call(
      'organize_design',
      { arguments: { operation: 'group', elementIds: ['a', 'b'] } },
      new AbortController().signal
    )
    expect(JSON.parse(result)).toEqual({ actionResults: [], context: {} })
    expect(executeBatch).toHaveBeenCalledTimes(1)
    const batch = {
      batchId: 'organization',
      actions: [
        {
          id: 'g',
          name: 'organize_design',
          arguments: { operation: 'group', elementIds: ['a'] }
        }
      ]
    }
    expect(operations.settleOutcome(batch)).toBe(batch)
  })

  it('prepares a referenced drawing on the backend and returns the acknowledged canonical result', async () => {
    const images = createLocalImageTools(
      {
        metadata: {
          imageAttachments: [
            {
              mediaType: 'image/png',
              size: 1,
              dataUrl: 'data:image/png;base64,YQ=='
            }
          ]
        }
      },
      async () =>
        '<svg width="10" height="10"><path d="M0,0L10,0L10,10Z" fill="#000000"/></svg>'
    )
    const signal = new AbortController().signal
    const artifact = JSON.parse(
      await images.call(
        'vtracer',
        {
          attachmentIndex: 0,
          plan: {
            strategy: 'preserve-vectors',
            reason: 'Preserve the supplied irregular vector artwork.'
          }
        },
        signal
      )
    )
    const executeBatch = vi.fn(async (_batch: AiActionBatch) => ({
      actionResults: [
        {
          actionId: 'a',
          actionName: 'insert',
          result: { compositionId: 'actual-id' }
        }
      ],
      context: { selectedIds: ['actual-id'] }
    }))
    const operations = createLocalOperationTools(
      [
        {
          name: AiActionNames.INSERT_VECTOR_COMPOSITION,
          description: 'Insert',
          inputSchema: {}
        }
      ],
      images,
      executeBatch
    )
    const result = await operations.call(
      AiActionNames.INSERT_VECTOR_COMPOSITION,
      {
        arguments: {
          imageArtifactId: artifact.imageArtifactId,
          compositionRole: 'logo',
          bounds: { x: 0, y: 0, width: 240, height: 240 },
          excludePathIds: []
        },
        message: 'Tracing is complete. I am adding the editable drawing.'
      },
      signal
    )
    expect(JSON.parse(result).context.selectedIds).toEqual(['actual-id'])
    expect(executeBatch).toHaveBeenCalledOnce()
    const prepared = executeBatch.mock.calls[0]?.[0]
    if (!prepared) throw new Error('Missing prepared batch')
    expect(JSON.stringify(prepared)).not.toContain('imageArtifactId')
    expect(prepared.actions[0].summary).toBe(
      'Tracing is complete. I am adding the editable drawing.'
    )
    expect(prepared.actions[0].name).toBe(
      AiActionNames.INSERT_VECTOR_COMPOSITION
    )
  })

  it('executes routine operations with parameters only and supplies the App status', async () => {
    const executeBatch = vi.fn(async (_batch: AiActionBatch) => ({
      actionResults: [],
      context: {}
    }))
    const operations = createLocalOperationTools(
      [
        {
          name: AiActionNames.SELECT_ELEMENTS,
          description: 'Select',
          inputSchema: {}
        }
      ],
      createLocalImageTools({}),
      executeBatch
    )
    expect(
      operations.definitions.find((d) => d.name !== 'execute_design_batch')
        ?.inputSchema.required
    ).toEqual(['arguments'])
    await operations.call(
      AiActionNames.SELECT_ELEMENTS,
      { arguments: { elementIds: ['a'] } },
      new AbortController().signal
    )
    expect(executeBatch).toHaveBeenCalledOnce()
    expect(executeBatch.mock.calls[0][0].actions[0].summary).toBe(
      'Updating the drawing'
    )
  })

  it.each([null, 1, '', '   ', 'x'.repeat(1001)])(
    'rejects malformed optional operation messages before execution: %s',
    async (message) => {
      const executeBatch = vi.fn(async (_batch: AiActionBatch) => ({
        actionResults: [],
        context: {}
      }))
      const operations = createLocalOperationTools(
        [
          {
            name: AiActionNames.SELECT_ELEMENTS,
            description: 'Select',
            inputSchema: {}
          }
        ],
        createLocalImageTools({}),
        executeBatch
      )
      await expect(
        operations.call(
          AiActionNames.SELECT_ELEMENTS,
          { arguments: {}, message },
          new AbortController().signal
        )
      ).rejects.toThrow('Invalid backend operation')
      expect(executeBatch).not.toHaveBeenCalled()
    }
  )

  it('does not expose or execute an unregistered capability', async () => {
    const executeBatch = vi.fn()
    const operations = createLocalOperationTools(
      [{ name: 'shell', description: 'No', inputSchema: {} }],
      createLocalImageTools({}),
      executeBatch
    )
    expect(operations.definitions).toEqual([])
    await expect(
      operations.call(
        'shell',
        { arguments: {}, message: 'Run' },
        new AbortController().signal
      )
    ).rejects.toThrow()
    expect(executeBatch).not.toHaveBeenCalled()
  })
})

const png =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGioAAAAASUVORK5CYII='

it('returns native image content without placing image bytes in text', () => {
  const receipt = {
    actionResults: [
      {
        actionName: AiActionNames.INSPECT_DRAWING,
        result: {
          available: true,
          image: { dataUrl: png, width: 1, height: 1 }
        }
      }
    ]
  }
  const content = localToolContent(JSON.stringify(receipt))
  expect(content).toContainEqual({ type: 'inputImage', imageUrl: png })
  expect(
    JSON.stringify(content.filter((item) => item.type === 'inputText'))
  ).not.toContain('base64')
  expect(() =>
    localToolContent(
      JSON.stringify({
        actionResults: [
          {
            actionName: AiActionNames.INSPECT_DRAWING,
            result: {
              available: true,
              image: {
                dataUrl: 'https://example.com/image.png',
                width: 1,
                height: 1
              }
            }
          }
        ]
      })
    )
  ).toThrow()
})

it('captures fresh evidence after each mutation using the acknowledged composition ID', async () => {
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result:
        action.name === AiActionNames.INSPECT_DRAWING
          ? { available: true, image: { dataUrl: png, width: 1, height: 1 } }
          : { compositionId: 'actual-composition', status: 'complete' }
    })),
    context: {}
  }))
  const tools = createLocalOperationTools(
    [AiActionNames.INSPECT_DRAWING, AiActionNames.SET_ELEMENT_VISIBILITY].map(
      (name) => ({ name, description: name, inputSchema: {} })
    ),
    createLocalImageTools({}),
    execute
  )
  for (const visible of [true, false]) {
    const receipt = await tools.call(
      AiActionNames.SET_ELEMENT_VISIBILITY,
      {
        arguments: { elementIds: ['shape'], visible },
        message: 'Adjusting the drawing'
      },
      new AbortController().signal
    )
    expect(localToolContent(receipt)).toContainEqual({
      type: 'inputImage',
      imageUrl: png
    })
  }
  expect(execute).toHaveBeenCalledTimes(4)
  expect(execute.mock.calls[1][0].actions[0]).toMatchObject({
    name: AiActionNames.INSPECT_DRAWING,
    arguments: { elementId: 'actual-composition' }
  })
})

it('continues mutations beyond six reviews and never certifies unavailable evidence', async () => {
  let available = false
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result:
        action.name === AiActionNames.INSPECT_DRAWING
          ? { available }
          : { compositionId: 'drawing' }
    })),
    context: {}
  }))
  const tools = createLocalOperationTools(
    [AiActionNames.INSPECT_DRAWING, AiActionNames.SET_ELEMENT_VISIBILITY].map(
      (name) => ({ name, description: name, inputSchema: {} })
    ),
    createLocalImageTools({}),
    execute
  )
  const completed: AiActionBatch = {
    batchId: 'done',
    actions: [
      {
        id: 'report',
        name: AiActionNames.REPORT_OUTCOME,
        arguments: { outcome: 'completed', message: 'Done' },
        summary: 'Done'
      }
    ]
  }
  const change = () =>
    tools.call(
      AiActionNames.SET_ELEMENT_VISIBILITY,
      {
        arguments: { elementIds: ['shape'], visible: true },
        message: 'Adjusting'
      },
      new AbortController().signal
    )
  await change()
  expect(tools.settleOutcome(completed).actions[0].arguments).toMatchObject({
    outcome: 'unsupported',
    message: 'This app could not complete visual review of the drawing.'
  })
  available = true
  await change()
  expect(tools.settleOutcome(completed).actions[0].arguments).toMatchObject({
    outcome: 'unsupported'
  })
  for (let index = 2; index < 6; index++) await change()
  expect(execute).toHaveBeenCalledTimes(12)
  await change()
  expect(execute).toHaveBeenCalledTimes(14)
})

it('does not admit unreviewed mutations in the final response', () => {
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    [AiActionNames.INSPECT_DRAWING, AiActionNames.SET_ELEMENT_VISIBILITY].map(
      (name) => ({ name, description: name, inputSchema: {} })
    ),
    createLocalImageTools({}),
    execute
  )
  expect(() =>
    tools.settleOutcome({
      batchId: 'late',
      actions: [
        {
          id: 'late-edit',
          name: AiActionNames.SET_ELEMENT_VISIBILITY,
          arguments: { elementId: 'shape', visible: false },
          summary: 'Late edit'
        }
      ]
    })
  ).toThrow('Final response cannot contain unreviewed drawing operations')
  expect(execute).not.toHaveBeenCalled()
})

it('does not classify a canonical execution failure as a preparation retry', async () => {
  const failure = new Error('Canonical execution failed')
  const executeBatch = vi.fn(async () => {
    throw failure
  })
  const operations = createLocalOperationTools(
    [
      {
        name: AiActionNames.SELECT_ELEMENTS,
        description: 'Select',
        inputSchema: {}
      }
    ],
    { modelActions: (actions) => actions, resolveBatch: (value) => value },
    executeBatch
  )
  await expect(
    operations.call(
      AiActionNames.SELECT_ELEMENTS,
      { arguments: {} },
      new AbortController().signal
    )
  ).rejects.toBe(failure)
  expect(executeBatch).toHaveBeenCalledOnce()
})

it('does not equate an available screenshot with an accepted design review', async () => {
  const tools = createLocalOperationTools(
    [AiActionNames.INSPECT_DRAWING, AiActionNames.SET_ELEMENT_VISIBILITY].map(
      (name) => ({ name, description: name, inputSchema: {} })
    ),
    { modelActions: (a) => a, resolveBatch: (b) => b },
    async (batch) => ({
      context: {},
      actionResults: batch.actions.map((action) => ({
        actionId: action.id,
        actionName: action.name,
        result: {
          compositionId: 'drawing',
          available: true,
          image: { dataUrl: png, width: 1, height: 1 }
        }
      }))
    })
  )
  await tools.call(
    AiActionNames.SET_ELEMENT_VISIBILITY,
    { arguments: { elementIds: ['shape'], visible: true } },
    new AbortController().signal
  )
  const result = tools.settleOutcome({
    batchId: 'done',
    actions: [
      {
        id: 'done',
        name: AiActionNames.REPORT_OUTCOME,
        arguments: { outcome: 'completed', message: 'Perfect detail.' },
        summary: 'Done'
      }
    ]
  })
  expect(result.actions[0].arguments).toMatchObject({ outcome: 'unsupported' })
  expect(
    tools.settleOutcome({ batchId: 'silent', actions: [] }).actions
  ).toContainEqual(
    expect.objectContaining({
      name: AiActionNames.REPORT_OUTCOME,
      arguments: expect.objectContaining({ outcome: 'unsupported' })
    })
  )
})

it('requires a frozen plan, current overview and detail evidence, and all criteria before completion', async () => {
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result:
        action.name === AiActionNames.INSPECT_DRAWING
          ? { available: true, image: { dataUrl: png, width: 1, height: 1 } }
          : { compositionId: 'drawing' }
    }))
  }))
  const tools = createLocalOperationTools(
    [AiActionNames.INSPECT_DRAWING, AiActionNames.SET_ELEMENT_VISIBILITY].map(
      (name) => ({ name, description: name, inputSchema: {} })
    ),
    { modelActions: (a) => a, resolveBatch: (b) => b },
    execute
  )
  const signal = new AbortController().signal
  const call = (name: string, args: unknown) =>
    tools.call(name, args, signal).then(JSON.parse)
  const plan = {
    phase: 'plan',
    method: 'Trace a verified reference, preserve native background geometry',
    references: ['https://example.com/reference.png'],
    criteria: ['Silhouette and proportions match', 'Window details match'],
    detailRequired: true
  }
  await call(AiDesignToolIds.RECORD_DESIGN_REVIEW, plan)
  const change = () =>
    call(AiActionNames.SET_ELEMENT_VISIBILITY, {
      arguments: { elementIds: ['shape'], visible: true }
    })
  const getId = (receipt: {
    actionResults: { result: { inspectionId?: string } }[]
  }) =>
    receipt.actionResults.find((entry) => entry.result.inspectionId)?.result
      .inspectionId
  const overviewReceipt = await change()
  const overviewId = getId(overviewReceipt)
  expect(localToolContent(JSON.stringify(overviewReceipt))).toContainEqual({
    type: 'inputImage',
    imageUrl: png
  })
  expect(overviewId).toEqual(expect.any(String))
  const report = {
    phase: 'visual',
    inspectionIds: [overviewId],
    checks: plan.criteria.map((requirement) => ({
      requirement,
      status: 'pass',
      evidence:
        'Compared the rendered outline and repeated window structure with the reference.'
    }))
  }
  await expect(
    call(AiDesignToolIds.RECORD_DESIGN_REVIEW, report)
  ).rejects.toThrow('separate detail')
  const detailId = getId(
    await call(AiActionNames.INSPECT_DRAWING, {
      arguments: { elementId: 'windows' }
    })
  )
  report.inspectionIds.push(detailId)
  await expect(
    call(AiDesignToolIds.RECORD_DESIGN_REVIEW, {
      ...report,
      checks: report.checks.slice(0, 1)
    })
  ).rejects.toThrow('every planned criterion')
  const completed = {
    batchId: 'done',
    actions: [
      {
        id: 'done',
        name: AiActionNames.REPORT_OUTCOME,
        arguments: { outcome: 'completed', message: 'Done' },
        summary: 'Done'
      }
    ]
  }
  const failed = {
    ...report,
    checks: report.checks.map((check) => ({
      ...check,
      status: 'fail',
      evidence: 'Windows are missing.'
    }))
  }
  await call(AiDesignToolIds.RECORD_DESIGN_REVIEW, failed)
  expect(tools.settleOutcome(completed).actions[0].arguments).toMatchObject({
    outcome: 'unsupported',
    message: expect.stringContaining('Windows are missing')
  })
  await call(AiDesignToolIds.RECORD_DESIGN_REVIEW, report)
  expect(tools.settleOutcome(completed)).toBe(completed)
  await change()
  expect(tools.settleOutcome(completed).actions[0].arguments).toMatchObject({
    outcome: 'unsupported'
  })
  await expect(
    call(AiDesignToolIds.RECORD_DESIGN_REVIEW, report)
  ).rejects.toThrow('current inspection IDs')
  await expect(
    call(AiDesignToolIds.RECORD_DESIGN_REVIEW, plan)
  ).rejects.toThrow('before drawing')
  // Inspection must not turn a detail target into the automatic composition target.
  expect(execute.mock.calls.at(-1)?.[0].actions[0].arguments).toEqual({
    elementId: 'drawing'
  })
})

it('accepts intentionally ugly low-detail work against user criteria with only an overview', () => {
  const review = createLocalDesignReview()
  const requirement =
    'An intentionally ugly, rough, asymmetric face with three crude shapes'
  review.record({
    phase: 'plan',
    method: 'Use three deliberately uneven native shapes',
    references: [],
    criteria: [requirement],
    detailRequired: false
  })
  review.mutate()
  const evidence = review.inspect('face', true, true)
  expect(evidence).toBeDefined()
  if (!evidence) throw new Error('Missing inspection receipt')
  const result = review.record({
    phase: 'visual',
    inspectionIds: [evidence.inspectionId],
    checks: [
      {
        requirement,
        status: 'pass',
        evidence:
          'The overview shows exactly three uneven shapes, a crooked mouth and intentionally mismatched eyes.'
      }
    ]
  })
  expect(result.accepted).toBe(true)
  expect(review.getIssue()).toBeUndefined()
})

it('issues detail receipts for native regions without certifying the whole drawing', async () => {
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: [
      {
        actionId: 'region',
        actionName: AiActionNames.INSPECT_DRAWING,
        result: {
          available: true,
          partial: true,
          image: { dataUrl: png, width: 1, height: 1 }
        }
      }
    ],
    context: {}
  }))
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.INSPECT_DRAWING,
        description: 'Inspect',
        inputSchema: {}
      }
    ],
    createLocalImageTools({}),
    execute
  )
  const region = { x: 0, y: 0, width: 100, height: 100 }
  const result = JSON.parse(
    await tools.call(
      AiActionNames.INSPECT_DRAWING,
      { arguments: { elementId: 'drawing', region } },
      new AbortController().signal
    )
  )
  expect(execute.mock.calls[0][0].actions[0].arguments).toEqual({
    elementId: 'drawing',
    region
  })
  expect(result.actionResults[0].result.inspectionId).toEqual(
    expect.any(String)
  )
})

it('keeps same-revision receipts valid across repeated captures and distinguishes regional detail', () => {
  const review = createLocalDesignReview()
  const criterion = 'The requested composition and local details are present'
  review.record({
    phase: 'plan',
    method: 'Inspect actual output',
    references: [],
    criteria: [criterion],
    detailRequired: true
  })
  review.mutate()
  const overview = review.inspect('drawing', true, true)
  const detail = review.inspect('window', true, false)
  if (!overview || !detail) throw new Error('Missing inspection receipts')
  expect(review.inspect('drawing', true, true)).toEqual(overview)
  expect(review.inspect('window', true, false)).toEqual(detail)
  const report = {
    phase: 'visual',
    inspectionIds: [overview.inspectionId, detail.inspectionId],
    checks: [
      {
        requirement: criterion,
        status: 'pass',
        evidence: 'Compared the whole composition and the window detail.'
      }
    ]
  }
  expect(review.record(report).accepted).toBe(true)
  review.mutate()
  expect(() => review.record(report)).toThrow('current inspection IDs')
})

it('accepts regional detail on the composition but never promotes it to overview evidence', () => {
  const review = createLocalDesignReview()
  review.record({
    phase: 'plan',
    method: 'Compare overview and native detail',
    references: [],
    criteria: ['Match the request'],
    detailRequired: true
  })
  review.mutate()
  const overview = review.inspect('drawing', true, true)
  const region = { x: 10, y: 20, width: 100, height: 100 }
  const detail = review.inspect('drawing', true, false, region)
  if (!overview || !detail) throw new Error('Missing inspection receipts')
  expect(detail.inspectionId).not.toBe(overview.inspectionId)
  expect(review.inspect('drawing', true, false, { ...region })).toEqual(detail)
  const checks = [
    {
      requirement: 'Match the request',
      status: 'pass',
      evidence: 'Whole silhouette and native window detail match.'
    }
  ]
  expect(() =>
    review.record({
      phase: 'visual',
      inspectionIds: [detail.inspectionId],
      checks
    })
  ).toThrow('full drawing')
  expect(
    review.record({
      phase: 'visual',
      inspectionIds: [overview.inspectionId, detail.inspectionId],
      checks
    }).accepted
  ).toBe(true)
  review.mutate()
  expect(() =>
    review.record({
      phase: 'visual',
      inspectionIds: [overview.inspectionId, detail.inspectionId],
      checks
    })
  ).toThrow('current inspection IDs')
})

it('follows a new group containing the current review target without switching to unrelated groups', async () => {
  const executeBatch = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: [
      {
        actionId: 'result',
        actionName: batch.actions[0].name,
        result:
          batch.actions[0].name === AiActionNames.ORGANIZE_DESIGN
            ? {
                status: 'complete',
                operation: 'group',
                groupId: 'assembled',
                elementIds: batch.actions[0].arguments.elementIds
              }
            : { available: true }
      }
    ]
  }))
  const operations = createLocalOperationTools(
    [AiActionNames.ORGANIZE_DESIGN, AiActionNames.INSPECT_DRAWING].map(
      (name) => ({ name, description: name, inputSchema: {} })
    ),
    { modelActions: (a) => a, resolveBatch: (v) => v },
    executeBatch,
    { reviewTargetId: 'original' }
  )
  await operations.call(
    AiActionNames.ORGANIZE_DESIGN,
    { arguments: { operation: 'group', elementIds: ['unrelated'] } },
    new AbortController().signal
  )
  expect(executeBatch.mock.calls.at(-1)?.[0].actions[0].arguments).toEqual({
    elementId: 'original'
  })
  await operations.call(
    AiActionNames.ORGANIZE_DESIGN,
    { arguments: { operation: 'group', elementIds: ['original', 'details'] } },
    new AbortController().signal
  )
  expect(executeBatch.mock.calls.at(-1)?.[0].actions[0].arguments).toEqual({
    elementId: 'assembled'
  })
})

it('measures a deferred stage once at inspection while preserving receipts and final review requirements', async () => {
  const results: Record<string, unknown> = {
    [AiActionNames.INSPECT_DRAWING]: {
      available: true,
      imageScope: 'overview',
      image: { dataUrl: png, width: 1, height: 1 }
    },
    [AiActionNames.REVIEW_DESIGN]: {
      complete: true,
      measuredTextIds: [],
      findings: []
    },
    [AiActionNames.APPLY_PREPARED_DESIGN]: {
      compositionId: 'drawing',
      applied: true
    }
  }
  const executeBatch = vi.fn(async (batch: AiActionBatch) => {
    const action = batch.actions[0]
    return {
      context: {},
      actionResults: [
        {
          actionId: action.id,
          actionName: action.name,
          result: results[action.name]
        }
      ]
    }
  })
  const operations = createLocalOperationTools(
    [
      AiActionNames.APPLY_PREPARED_DESIGN,
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.INSPECT_DRAWING
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (a) => a, resolveBatch: (v) => v },
    executeBatch
  )
  const signal = new AbortController().signal
  await operations.call(
    AiDesignToolIds.RECORD_DESIGN_REVIEW,
    {
      phase: 'plan',
      method: 'Build one stage',
      references: [],
      criteria: ['Match the requested design'],
      detailRequired: false
    },
    signal
  )
  for (let i = 0; i < 3; i++) {
    const result = JSON.parse(
      await operations.call(
        AiActionNames.APPLY_PREPARED_DESIGN,
        {
          arguments: { artifactId: 'prepared-' + i },
          inspection: 'defer'
        },
        signal
      )
    )
    expect(result.actionResults[0].result).toMatchObject({ applied: true })
    expect(result.inspectionDeferred).toBe(true)
  }
  const names = () =>
    executeBatch.mock.calls.map(([batch]) => batch.actions[0].name)
  expect(
    names().filter((name) => name === AiActionNames.APPLY_PREPARED_DESIGN)
  ).toHaveLength(3)
  expect(
    names().filter((name) => name === AiActionNames.REVIEW_DESIGN)
  ).toHaveLength(0)
  expect(
    names().filter((name) => name === AiActionNames.INSPECT_DRAWING)
  ).toHaveLength(0)
  const outcome: AiActionBatch = {
    batchId: 'done',
    actions: [
      {
        id: 'done',
        name: AiActionNames.REPORT_OUTCOME,
        arguments: { outcome: 'completed' },
        summary: 'Done'
      }
    ]
  }
  expect(operations.settleOutcome(outcome).actions[0].arguments.outcome).toBe(
    'unsupported'
  )
  const capture = JSON.parse(
    await operations.call(
      AiActionNames.INSPECT_DRAWING,
      {
        arguments: { elementId: 'drawing' }
      },
      signal
    )
  )
  expect(
    names().filter((name) => name === AiActionNames.INSPECT_DRAWING)
  ).toHaveLength(1)
  const inspectionId = capture.actionResults[0].result.inspectionId
  expect(
    names().filter((name) => name === AiActionNames.REVIEW_DESIGN)
  ).toHaveLength(1)
  expect(
    names().filter((name) => name === AiActionNames.INSPECT_DRAWING)
  ).toHaveLength(1)
  await operations.call(
    AiDesignToolIds.RECORD_DESIGN_REVIEW,
    {
      phase: 'visual',
      inspectionIds: [inspectionId],
      checks: [
        {
          requirement: 'Match the requested design',
          status: 'pass',
          evidence: 'Checked the final combined stage'
        }
      ]
    },
    signal
  )
  expect(operations.settleOutcome(outcome)).toEqual(outcome)
  await operations.call(
    AiActionNames.INSPECT_DRAWING,
    { arguments: { elementId: 'drawing' } },
    signal
  )
  expect(
    names().filter((name) => name === AiActionNames.REVIEW_DESIGN)
  ).toHaveLength(1)

  await operations.call(
    AiActionNames.APPLY_PREPARED_DESIGN,
    {
      arguments: { artifactId: 'correction' },
      inspection: 'defer'
    },
    signal
  )
  expect(operations.settleOutcome(outcome).actions[0].arguments.outcome).toBe(
    'unsupported'
  )
  results[AiActionNames.REVIEW_DESIGN] = {
    complete: false,
    findings: [],
    measuredTextIds: []
  }
  const failedCapture = JSON.parse(
    await operations.call(
      AiActionNames.INSPECT_DRAWING,
      { arguments: { elementId: 'drawing' } },
      signal
    )
  )
  expect(
    names().filter((name) => name === AiActionNames.REVIEW_DESIGN)
  ).toHaveLength(2)
  await operations.call(
    AiDesignToolIds.RECORD_DESIGN_REVIEW,
    {
      phase: 'visual',
      inspectionIds: [failedCapture.actionResults[0].result.inspectionId],
      checks: [
        {
          requirement: 'Match the requested design',
          status: 'pass',
          evidence: 'Image inspected but measurement incomplete'
        }
      ]
    },
    signal
  )
  expect(operations.settleOutcome(outcome).actions[0].arguments).toMatchObject({
    outcome: 'unsupported',
    message: 'The latest drawing still needs layout measurement.'
  })
})

it('rejects unsupported inspection scheduling values before mutation', async () => {
  const executeBatch = vi.fn()
  const operations = createLocalOperationTools(
    [
      {
        name: AiActionNames.APPLY_PREPARED_DESIGN,
        description: 'apply',
        inputSchema: {}
      }
    ],
    { modelActions: (a) => a, resolveBatch: (v) => v },
    executeBatch
  )
  await expect(
    operations.call(
      AiActionNames.APPLY_PREPARED_DESIGN,
      {
        arguments: {},
        inspection: 'skip-forever'
      },
      new AbortController().signal
    )
  ).rejects.toThrow('Invalid backend operation')
  expect(executeBatch).not.toHaveBeenCalled()
})

it('rejects misplaced action fields from the registered schema before dispatch and accepts a corrected call', async () => {
  const executeBatch = vi.fn(async () => ({ actionResults: [], context: {} }))
  const operations = createLocalOperationTools(
    [
      {
        name: AiActionNames.UPDATE_DESIGN_ELEMENT,
        description: 'Update a design',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['elementId', 'properties'],
          properties: {
            elementId: { type: 'string' },
            properties: { type: 'object' }
          }
        }
      }
    ],
    { modelActions: (a) => a, resolveBatch: (v) => v },
    executeBatch
  )
  const signal = new AbortController().signal
  await expect(
    operations.call(
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      {
        arguments: { elementId: 'group', width: 5000, y: 11600 },
        inspection: 'defer'
      },
      signal
    )
  ).rejects.toThrow(LocalOperationPreparationError)
  expect(executeBatch).not.toHaveBeenCalled()
  await operations.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    {
      arguments: { elementId: 'group', properties: { width: 5000, y: 11600 } },
      inspection: 'defer'
    },
    signal
  )
  expect(executeBatch).toHaveBeenCalledTimes(1)
})

it('validates nested batch items and union choices before any canonical dispatch', async () => {
  const execute = vi.fn(async () => ({ actionResults: [], context: {} }))
  const schema = {
    type: 'object',
    required: ['updates'],
    additionalProperties: false,
    properties: {
      updates: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['elementId'],
          properties: {
            elementId: { type: 'string', minLength: 1 },
            style: {
              type: 'object',
              additionalProperties: false,
              required: ['fillColor'],
              properties: { fillColor: { type: 'string' } }
            },
            geometry: {
              type: 'object',
              required: ['scaleX', 'scaleY'],
              properties: {
                scaleX: { type: 'number', exclusiveMinimum: 0 },
                scaleY: { type: 'number', exclusiveMinimum: 0 }
              }
            }
          },
          oneOf: [{ required: ['style'] }, { required: ['geometry'] }]
        }
      }
    }
  }
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.UPDATE_COMPOSITION_ELEMENTS,
        description: 'Update',
        inputSchema: schema
      }
    ],
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute
  )
  const valid = { elementId: 'pane', style: { fillColor: '#112233' } }
  for (const bad of [
    { elementId: 'pane', fillColor: '#112233' },
    { elementId: 'pane' },
    { ...valid, geometry: { scaleX: 1, scaleY: 1 } },
    { elementId: 'pane', geometry: { scaleX: 0, scaleY: 1 } }
  ]) {
    await expect(
      tools.call(
        AiActionNames.UPDATE_COMPOSITION_ELEMENTS,
        { arguments: { updates: [valid, bad] }, inspection: 'defer' },
        new AbortController().signal
      )
    ).rejects.toThrow(LocalOperationPreparationError)
  }
  expect(execute).not.toHaveBeenCalled()
  await tools.call(
    AiActionNames.UPDATE_COMPOSITION_ELEMENTS,
    { arguments: { updates: [valid] }, inspection: 'defer' },
    new AbortController().signal
  )
  expect(execute).toHaveBeenCalledTimes(1)
})

it('retains the whole drawing review target after a child refinement', async () => {
  const executeBatch = vi.fn(async (batch: AiActionBatch) => {
    const action = batch.actions[0]
    return {
      context: {},
      actionResults: [
        {
          actionId: action.id,
          actionName: action.name,
          result:
            action.name === AiActionNames.UPDATE_DESIGN_ELEMENT
              ? { status: 'complete', compositionId: 'child' }
              : {
                  available: true,
                  partial: false,
                  imageScope: action.arguments.view ?? 'overview',
                  elementsTruncated: true,
                  image: { dataUrl: png, width: 10, height: 10 }
                }
        }
      ]
    }
  })
  const operations = createLocalOperationTools(
    [AiActionNames.UPDATE_DESIGN_ELEMENT, AiActionNames.INSPECT_DRAWING].map(
      (name) => ({ name, description: name, inputSchema: {} })
    ),
    { modelActions: (a) => a, resolveBatch: (v) => v },
    executeBatch,
    { reviewTargetId: 'whole' }
  )
  const signal = new AbortController().signal
  await operations.call(
    AiDesignToolIds.RECORD_DESIGN_REVIEW,
    {
      phase: 'plan',
      method: 'Refine the glass',
      references: [],
      criteria: ['Reflective glass'],
      detailRequired: true
    },
    signal
  )
  await operations.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    {
      arguments: { elementId: 'child' },
      inspection: 'defer'
    },
    signal
  )
  const capture = async (elementId: string, view: string) =>
    JSON.parse(
      await operations.call(
        AiActionNames.INSPECT_DRAWING,
        { arguments: { elementId, view } },
        signal
      )
    ).actionResults[0].result.inspectionId
  const overview = await capture('whole', 'overview')
  const detail = await capture('child', 'detail')
  const review = JSON.parse(
    await operations.call(
      AiDesignToolIds.RECORD_DESIGN_REVIEW,
      {
        phase: 'visual',
        inspectionIds: [overview, detail],
        checks: [
          {
            requirement: 'Reflective glass',
            status: 'pass',
            evidence: 'Current overview and native glass detail inspected'
          }
        ]
      },
      signal
    )
  )
  expect(review.accepted).toBe(true)
  await operations.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    {
      arguments: { elementId: 'child' },
      inspection: 'defer'
    },
    signal
  )
  await expect(
    operations.call(
      AiDesignToolIds.RECORD_DESIGN_REVIEW,
      {
        phase: 'visual',
        inspectionIds: [overview, detail],
        checks: [
          {
            requirement: 'Reflective glass',
            status: 'pass',
            evidence: 'Old inspection'
          }
        ]
      },
      signal
    )
  ).rejects.toThrow('current inspection IDs')
})

it('does not reuse layout results across edits without canonical revision evidence', async () => {
  let impact: Record<string, unknown> = {
    layoutScope: 'subtree',
    targetId: 'section'
  }
  const execute = vi.fn(async (batch: AiActionBatch) => {
    const a = batch.actions[0]
    return {
      context: {},
      actionResults: [
        {
          actionId: a.id,
          actionName: a.name,
          result: (() => {
            if (a.name === AiActionNames.REVIEW_DESIGN)
              return { complete: true, findings: [], measuredTextIds: [] }
            if (a.name === AiActionNames.INSPECT_DRAWING)
              return { available: true, image: { dataUrl: png } }
            return {
              compositionId:
                a.name === AiActionNames.UPDATE_DESIGN_ELEMENT
                  ? 'text'
                  : 'root',
              status: 'complete',
              reviewImpact: impact
            }
          })()
        }
      ]
    }
  })
  const names = [
    AiActionNames.APPLY_PREPARED_DESIGN,
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    AiActionNames.REVIEW_DESIGN,
    AiActionNames.INSPECT_DRAWING
  ]
  const tools = createLocalOperationTools(
    names.map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute
  )
  const signal = new AbortController().signal
  await tools.call(
    AiActionNames.APPLY_PREPARED_DESIGN,
    { arguments: {} },
    signal
  )
  execute.mockClear()
  await tools.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    { arguments: { elementId: 'text' }, inspection: 'defer' },
    signal
  )
  await tools.call(
    AiActionNames.INSPECT_DRAWING,
    { arguments: { elementId: 'root' } },
    signal
  )
  const reviews = () =>
    execute.mock.calls
      .filter(([b]) => b.actions[0].name === AiActionNames.REVIEW_DESIGN)
      .map(([b]) => b.actions[0].arguments)
  expect(reviews()).toEqual([{ elementId: 'root' }])
  execute.mockClear()
  impact = { layoutScope: 'none' }
  await tools.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    { arguments: { elementId: 'text' }, inspection: 'defer' },
    signal
  )
  await tools.call(
    AiActionNames.INSPECT_DRAWING,
    { arguments: { elementId: 'root' } },
    signal
  )
  expect(reviews()).toEqual([{ elementId: 'root' }])
  execute.mockClear()
  impact = { layoutScope: 'subtree', targetId: 'section-a' }
  await tools.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    { arguments: { elementId: 'text' }, inspection: 'defer' },
    signal
  )
  impact = { layoutScope: 'subtree', targetId: 'section-b' }
  await tools.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    { arguments: { elementId: 'text' }, inspection: 'defer' },
    signal
  )
  await tools.call(
    AiActionNames.INSPECT_DRAWING,
    { arguments: { elementId: 'root' } },
    signal
  )
  expect(reviews()).toEqual([{ elementId: 'root' }])
  execute.mockClear()
  impact = { layoutScope: 'subtree', targetId: 'section-a' }
  await tools.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    { arguments: { elementId: 'text' }, inspection: 'defer' },
    signal
  )
  impact = { layoutScope: 'composition' }
  await tools.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    { arguments: { elementId: 'text' }, inspection: 'defer' },
    signal
  )
  await tools.call(
    AiActionNames.INSPECT_DRAWING,
    { arguments: { elementId: 'root' } },
    signal
  )
  expect(reviews()).toEqual([{ elementId: 'root' }])
})

it('dispatches many registered edits once and reviews the completed batch once', async () => {
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((a) => ({
      actionId: a.id,
      actionName: a.name,
      result:
        a.name === AiActionNames.REVIEW_DESIGN
          ? { complete: true, findings: [], measuredTextIds: [] }
          : { available: true }
    }))
  }))
  const action = {
    name: AiActionNames.SET_ELEMENT_VISIBILITY,
    description: 'visibility',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['elementId', 'visible'],
      properties: {
        elementId: { type: 'string' },
        visible: { type: 'boolean' }
      }
    }
  }
  const tools = createLocalOperationTools(
    [
      action,
      {
        name: AiActionNames.REVIEW_DESIGN,
        description: 'review',
        inputSchema: {}
      },
      {
        name: AiActionNames.INSPECT_DRAWING,
        description: 'inspect',
        inputSchema: {}
      }
    ],
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute,
    { reviewTargetId: 'root' }
  )
  await tools.call(
    'execute_design_batch',
    {
      operations: Array.from({ length: 47 }, (_, i) => ({
        name: action.name,
        arguments: { elementId: `id-${i}`, visible: false }
      }))
    },
    new AbortController().signal
  )
  expect(execute.mock.calls.map(([b]) => b.actions.length)).toEqual([47, 1, 1])
  expect(execute.mock.calls[0][0].actions.map((a) => a.arguments)).toEqual(
    Array.from({ length: 47 }, (_, i) => ({
      elementId: `id-${i}`,
      visible: false
    }))
  )
  execute.mockClear()
  await expect(
    tools.call(
      'execute_design_batch',
      {
        operations: [
          { name: action.name, arguments: { elementId: 'ok', visible: false } },
          { name: action.name, arguments: { elementId: 'bad', visible: 'no' } }
        ]
      },
      new AbortController().signal
    )
  ).rejects.toThrow()
  expect(execute).not.toHaveBeenCalled()
})

it('resolves identity families into one exchange with a compact batch summary and retains canonical rejection', async () => {
  const resolveTargets = vi.fn(() => ['a', 'b', 'c'])
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: { unneeded: 'large current selection' },
    actionResults: batch.actions.map((a) => ({
      actionId: a.id,
      actionName: a.name,
      result: { elementId: (a.arguments as { elementId: string }).elementId }
    }))
  }))
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.SET_ELEMENT_VISIBILITY,
        description: 'hide',
        inputSchema: {
          type: 'object',
          required: ['elementId', 'visible'],
          properties: {
            elementId: { type: 'string' },
            visible: { type: 'boolean' }
          }
        }
      }
    ],
    { modelActions: (a) => a, resolveBatch: (v) => v, resolveTargets },
    execute
  )
  const input = {
    operations: [
      {
        name: AiActionNames.SET_ELEMENT_VISIBILITY,
        arguments: { visible: false },
        target: {
          artifactId: 'saved',
          keyPrefix: 'reflection-',
          field: 'elementId'
        }
      }
    ]
  }
  const result = JSON.parse(
    await tools.call(
      'execute_design_batch',
      input,
      new AbortController().signal
    )
  )
  expect(resolveTargets).toHaveBeenCalledExactlyOnceWith({
    artifactId: 'saved',
    keyPrefix: 'reflection-'
  })
  expect(execute).toHaveBeenCalledTimes(1)
  expect(result.batchSummary).toEqual({ operationCount: 1, actionCount: 3 })
  expect(result.context).toBeUndefined()
  const aborted = new AbortController()
  aborted.abort()
  execute.mockClear()
  await expect(
    tools.call('execute_design_batch', input, aborted.signal)
  ).rejects.toThrow()
  expect(execute).not.toHaveBeenCalled()
  execute.mockRejectedValueOnce(new Error('Target removed or locked'))
  await expect(
    tools.call('execute_design_batch', input, new AbortController().signal)
  ).rejects.toThrow('Target removed or locked')
  expect(execute).toHaveBeenCalledTimes(1)
})

it('discovers every basic API without publishing hundreds of native tools', async () => {
  const operations = createLocalOperationTools(
    basicApiContracts,
    { modelActions: (a) => a, resolveBatch: (v) => v },
    async () => ({ actionResults: [], context: {} })
  )
  expect(operations.definitions.map((tool) => tool.name)).not.toEqual(
    expect.arrayContaining(basicApiContracts.map(({ name }) => name))
  )
  const signal = new AbortController().signal
  const index = JSON.parse(
    await operations.call('describe_design_apis', {}, signal)
  )
  expect(index.apis.map((entry: { name: string }) => entry.name)).toEqual(
    basicApiContracts.map(({ name }) => name)
  )
  expect(index.apis[0]).not.toHaveProperty('inputSchema')
  expect(operations.actionNames).toEqual(
    basicApiContracts.map(({ name }) => name)
  )
  const requested = basicApiContracts.slice(0, 2).map(({ name }) => name)
  const details = JSON.parse(
    await operations.call('describe_design_apis', { names: requested }, signal)
  )
  expect(details.apis.map((entry: { name: string }) => entry.name)).toEqual(
    requested
  )
  expect(details.apis[0].inputSchema).toEqual(basicApiContracts[0].inputSchema)
})

it('executes discovered APIs in a batch and rejects unknown lookup names', async () => {
  const execute = vi.fn(async (_batch: AiActionBatch) => ({
    actionResults: [],
    context: {}
  }))
  const operations = createLocalOperationTools(
    basicApiContracts,
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute
  )
  const signal = new AbortController().signal
  await operations.call(
    AiDesignToolIds.EXECUTE_DESIGN_BATCH,
    {
      operations: [
        {
          name: 'api_element_getVectorAnchorPoints',
          arguments: { elementId: 'v' }
        }
      ]
    },
    signal
  )
  expect(execute).toHaveBeenCalledOnce()
  expect(execute.mock.calls[0][0].actions[0].arguments).toEqual({
    elementId: 'v'
  })
  await expect(
    operations.call(
      AiDesignToolIds.DESCRIBE_DESIGN_APIS,
      { names: ['api_core_resetRuntime'] },
      signal
    )
  ).rejects.toThrow('Unknown')
})

it('reports exact review input fields before stateful evidence validation', async () => {
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.INSPECT_DRAWING,
        description: 'Inspect',
        inputSchema: {}
      }
    ],
    { modelActions: (a) => a, resolveBatch: (b) => b },
    async () => ({ actionResults: [], context: {} })
  )
  await expect(
    tools.call(
      AiDesignToolIds.RECORD_DESIGN_REVIEW,
      {
        phase: 'visual',
        inspectionIds: ['current'],
        checks: [{ status: 'pass', evidence: 'Visible' }]
      },
      new AbortController().signal
    )
  ).rejects.toThrow('checks[0].requirement')
})

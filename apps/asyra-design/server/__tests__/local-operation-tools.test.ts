import { runInNewContext } from 'node:vm'
import { prepareOperationBatch } from '../local-operation-batch'
import { describeBasicApiResult } from '../../src/ai/basic-api-results'
const reviewCriteria = (names: readonly string[]) =>
  Object.fromEntries(
    names.map((id) => [
      id,
      { requirement: id, description: id, verification: 'visual' }
    ])
  )
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import { createLocalDesignReview } from '../local-design-review'
import { AiDesignToolIds } from '../../src/constants/ai-design'
import type {
  AiActionBatch,
  AiJsonValue
} from '../../src/ai/action-batch-protocol'
import { describe, expect, it, vi } from 'vitest'
import {
  createLocalOperationTools,
  LocalOperationPreparationError,
  localToolContent,
  localToolResultExample
} from '../local-operation-tools'
import { createLocalImageTools } from '../local-image-tools'
import { AiActionNames } from '../../src/constants/ai-actions'

const basicActionName = (method: string) => {
  const contract = basicApiContracts.find((api) => api.method === method)
  if (!contract) throw new Error(`Missing registered API: ${method}`)
  return contract.name
}

it('resolves multiple semantic operations and semantic names from the admitted registry without dispatch', async () => {
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    basicApiContracts,
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute
  )
  const selected = basicApiContracts.filter((api) =>
    ['fill.updateFillsAtIndex', 'hierarchy.moveElementsRelative'].includes(
      api.operation
    )
  )
  expect(selected).toHaveLength(2)
  const call = async (args: unknown) =>
    JSON.parse(
      await tools.call(
        'describe_design_apis',
        args,
        new AbortController().signal
      )
    )
  const result = await call({
    operations: [...selected.map((api) => api.operation), 'missing.operation'],
    view: 'usage'
  })
  expect(result.apis.map((api: { name: string }) => api.name)).toEqual(
    selected.map((api) => api.name)
  )
  expect(result.missingOperations).toEqual(['missing.operation'])
  expect(
    result.apis.every((api: { inputSchema?: unknown }) => !api.inputSchema)
  ).toBe(true)
  const byName = await call({ names: selected.map((api) => api.operation) })
  expect(byName.missingNames).toEqual([])
  expect(byName.apis.map((api: { name: string }) => api.name)).toEqual(
    selected.map((api) => api.name)
  )
  for (let i = 0; i < selected.length; i++)
    expect(byName.apis[i].inputSchema).toEqual(selected[i].inputSchema)
  expect(execute).not.toHaveBeenCalled()
})

it('returns qualified choices for an ambiguous native name instead of selecting a route', async () => {
  const native = ['first', 'second'].map((namespace) => ({
    name: 'build',
    namespace,
    description: 'Build',
    inputSchema: { type: 'object' }
  }))
  const tools = createLocalOperationTools(
    basicApiContracts,
    { modelActions: (a) => a, resolveBatch: (v) => v },
    vi.fn(),
    { getNativeTools: () => native }
  )
  const result = JSON.parse(
    await tools.call(
      'describe_design_apis',
      { names: ['build'] },
      new AbortController().signal
    )
  )
  expect(result.tools).toEqual([])
  expect(result.ambiguousNames).toEqual([
    { name: 'build', candidates: ['first.build', 'second.build'] }
  ])
  const exact = JSON.parse(
    await tools.call(
      'describe_design_apis',
      { names: ['first.build'] },
      new AbortController().signal
    )
  )
  expect(exact.tools[0].execution).toEqual({
    kind: 'native-tool',
    namespace: 'first',
    tool: 'build'
  })
})

it('uses the advertised overview default for any inspection target and preserves explicit native detail', async () => {
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result: { available: false }
    })),
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
    { modelActions: (actions) => actions, resolveBatch: (value) => value },
    execute,
    { reviewTargetId: 'root' }
  )
  for (const extra of [
    {},
    { view: 'detail' },
    { region: { x: 0, y: 0, width: 20, height: 20 } }
  ]) {
    await tools.call(
      AiActionNames.INSPECT_DRAWING,
      { arguments: { elementId: 'another-root', ...extra } },
      new AbortController().signal
    )
  }
  const inputs = execute.mock.calls.map(([batch]) => batch.actions[0].arguments)
  expect(inputs[0]).toMatchObject({ view: 'overview' })
  expect(inputs[1]).toMatchObject({ view: 'detail' })
  expect(inputs[2]).toMatchObject({
    region: { x: 0, y: 0, width: 20, height: 20 },
    view: 'detail'
  })
})

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
      operations.definitions.find(
        (d) => d.name === AiActionNames.SELECT_ELEMENTS
      )?.inputSchema.required
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

it('returns native image content without placing image bytes in text', async () => {
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
  const content = await localToolContent(JSON.stringify(receipt))
  expect(content).toContainEqual({ type: 'inputImage', imageUrl: png })
  expect(
    JSON.stringify(content.filter((item) => item.type === 'inputText'))
  ).not.toContain('base64')
  await expect(
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
  ).rejects.toThrow()
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
    expect(await localToolContent(receipt)).toContainEqual({
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
  const results: Record<string, unknown> = {
    [AiActionNames.INSPECT_DRAWING]: {
      available: true,
      evidence: { sessionId: 'app-session', revision: 1 },
      image: { dataUrl: png, width: 1, height: 1 }
    },
    [AiActionNames.VALIDATE_INSPECTION_EVIDENCE]: {
      current: true,
      coverage: { complete: true }
    }
  }
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result: results[action.name] ?? { compositionId: 'drawing' }
    }))
  }))
  const tools = createLocalOperationTools(
    [
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
      AiActionNames.SET_ELEMENT_VISIBILITY
    ].map((name) => ({ name, description: name, inputSchema: {} })),
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
    criteria: reviewCriteria([
      'Silhouette and proportions match',
      'Window details match'
    ]),
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
  expect(
    await localToolContent(JSON.stringify(overviewReceipt))
  ).toContainEqual({
    type: 'inputImage',
    imageUrl: png
  })
  expect(overviewId).toEqual(expect.any(String))
  const report = {
    phase: 'visual',
    inspectionIds: [overviewId],
    checks: Object.keys(plan.criteria).map((criterionId) => ({
      criterionId,
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
      arguments: { elementId: 'windows', view: 'detail' }
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
  ).resolves.toEqual(
    expect.objectContaining({ status: 'partial', accepted: false })
  )
  await expect(
    call(AiDesignToolIds.RECORD_DESIGN_REVIEW, plan)
  ).rejects.toThrow('cannot be rewritten')
  // Inspection must not turn a detail target into the automatic composition target.
  expect(execute.mock.calls.at(-1)?.[0].actions[0].arguments).toEqual({
    elementId: 'drawing'
  })
})

it('accepts intentionally ugly low-detail work against user criteria with only an overview', () => {
  const review = createLocalDesignReview()
  const criterionId =
    'An intentionally ugly, rough, asymmetric face with three crude shapes'
  review.record({
    phase: 'plan',
    method: 'Use three deliberately uneven native shapes',
    references: [],
    criteria: reviewCriteria([criterionId]),
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
        criterionId,
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
    region,
    view: 'detail'
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
    criteria: reviewCriteria([criterion]),
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
        criterionId: criterion,
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
    criteria: reviewCriteria(['Match the request']),
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
      criterionId: 'Match the request',
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

it('accepts the whole drawing after a late detail group is ungrouped and reparented', async () => {
  const stamp = { sessionId: 'regrouped-document', revision: 1 }
  let towerContainsDetail = true
  const moveName = basicActionName('moveElements')
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => {
      let result: Record<string, unknown> = {}
      if (action.name === AiActionNames.ORGANIZE_DESIGN) {
        result = {
          status: 'complete',
          ...action.arguments,
          ...(action.arguments.operation === 'group'
            ? { groupId: 'tower' }
            : {}),
          ...(action.arguments.operation === 'ungroup'
            ? { groupId: 'collar', elementIds: ['collar-face'], removed: true }
            : {})
        }
      } else if (action.name === AiActionNames.APPLY_PREPARED_DESIGN) {
        result = { compositionId: 'collar' }
      } else if (action.name === AiActionNames.INSPECT_DRAWING) {
        result = {
          available: true,
          evidence: stamp,
          imageScope: 'overview',
          image: { dataUrl: png, width: 1, height: 1 }
        }
      } else if (action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE) {
        const scope = action.arguments.scope as
          { overviewIds?: string[] } | undefined
        result = {
          current: true,
          coverage: {
            complete:
              towerContainsDetail && scope?.overviewIds?.includes('tower'),
            missingIds: [],
            uncoveredIds: []
          }
        }
      } else if (action.name === AiActionNames.REVIEW_DESIGN) {
        result = {
          complete: true,
          evidence: stamp,
          findings: [],
          measuredTextIds: []
        }
      }
      return { actionId: action.id, actionName: action.name, result }
    })
  }))
  const tools = createLocalOperationTools(
    [
      AiActionNames.ORGANIZE_DESIGN,
      AiActionNames.APPLY_PREPARED_DESIGN,
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
      moveName
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (a) => a, resolveBatch: (b) => b },
    execute,
    { reviewTargetId: 'body' }
  )
  const call = (name: string, args: unknown) =>
    tools.call(name, args, new AbortController().signal).then(JSON.parse)
  await call(AiDesignToolIds.RECORD_DESIGN_REVIEW, {
    phase: 'plan',
    method: 'Draw and refine',
    references: [],
    criteria: reviewCriteria(['Shape']),
    detailRequired: false
  })
  await call(AiActionNames.ORGANIZE_DESIGN, {
    arguments: { operation: 'group', elementIds: ['body'] },
    inspection: 'defer'
  })
  await call(AiActionNames.APPLY_PREPARED_DESIGN, {
    arguments: {},
    inspection: 'defer'
  })
  await call(AiActionNames.ORGANIZE_DESIGN, {
    arguments: { operation: 'ungroup', elementIds: ['collar'] },
    inspection: 'defer'
  })
  await call(moveName, {
    arguments: {
      request: {
        elementIds: ['collar-face'],
        targetParentId: 'tower',
        targetIndex: 1
      }
    },
    inspection: 'defer'
  })
  const unrelated = await call(AiActionNames.INSPECT_DRAWING, {
    arguments: { elementId: 'other', view: 'overview' }
  })
  await expect(
    call(AiDesignToolIds.RECORD_DESIGN_REVIEW, {
      phase: 'visual',
      inspectionIds: [unrelated.actionResults[0].result.inspectionId],
      checks: [
        { criterionId: 'Shape', status: 'pass', evidence: 'Unrelated image' }
      ]
    })
  ).resolves.toMatchObject({
    status: 'partial',
    accepted: false,
    evidenceValidation: { coverage: { complete: false } }
  })
  const inspected = await call(AiActionNames.INSPECT_DRAWING, {
    arguments: { elementId: 'tower', view: 'overview' }
  })
  await expect(
    call(AiDesignToolIds.RECORD_DESIGN_REVIEW, {
      phase: 'visual',
      inspectionIds: [inspected.actionResults[0].result.inspectionId],
      checks: [
        {
          criterionId: 'Shape',
          status: 'pass',
          evidence: 'Whole tower visible'
        }
      ]
    })
  ).resolves.toMatchObject({ accepted: true })
  const validation = execute.mock.calls.findLast(
    ([batch]) =>
      batch.actions[0].name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
  )?.[0]
  expect(validation?.actions[0].arguments).toMatchObject({
    scope: { requiredIds: ['tower', 'collar-face'], overviewIds: ['tower'] }
  })
  expect(
    execute.mock.calls
      .filter(
        ([batch]) => batch.actions[0].name === AiActionNames.REVIEW_DESIGN
      )
      .map(([batch]) => batch.actions[0].arguments.elementId)
  ).toEqual(['other', 'tower'])
  towerContainsDetail = false
  await tools.validateCompletion()
  const final = tools.settleOutcome({
    batchId: 'done',
    actions: [
      {
        id: 'done',
        name: AiActionNames.REPORT_OUTCOME,
        arguments: { outcome: 'completed' },
        summary: 'Done'
      }
    ]
  })
  expect(final.actions[0].arguments.outcome).toBe('unsupported')
})

it.each([
  {
    name: AiActionNames.REMOVE_AI_COMPOSITION,
    arguments: { compositionId: 'original' },
    result: { status: 'complete', appliedElementIds: ['original'] }
  },
  {
    name: basicActionName('removeSubtree'),
    arguments: { elementId: 'original' },
    result: {
      status: 'complete',
      value: { elementId: 'original', removed: [{ elementId: 'original' }] }
    }
  },
  {
    name: basicActionName('deleteElement'),
    arguments: { elementId: 'original' },
    result: { status: 'complete', value: true }
  }
])('retires explicitly removed drawing roots via $name', async (removal) => {
  let capturedScope: unknown
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => {
      let result: unknown = {}
      if (action.name === removal.name) result = removal.result
      if (action.name === AiActionNames.APPLY_PREPARED_DESIGN)
        result = { compositionId: 'successor' }
      if (action.name === AiActionNames.INSPECT_DRAWING)
        result = {
          available: true,
          image: { dataUrl: png },
          evidence: { sessionId: 'doc', revision: 1 }
        }
      if (action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE) {
        capturedScope = action.arguments.scope
        result = { current: true, coverage: { complete: true } }
      }
      return { actionId: action.id, actionName: action.name, result }
    })
  }))
  const tools = createLocalOperationTools(
    [
      removal.name,
      AiActionNames.APPLY_PREPARED_DESIGN,
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (a) => a, resolveBatch: (b) => b },
    execute,
    { reviewTargetId: 'original' }
  )
  const call = (name: string, args: unknown) =>
    tools.call(name, args, new AbortController().signal).then(JSON.parse)
  await call(AiDesignToolIds.RECORD_DESIGN_REVIEW, {
    phase: 'plan',
    method: 'Refine',
    references: [],
    criteria: reviewCriteria(['Shape']),
    detailRequired: false
  })
  await call(removal.name, {
    arguments: removal.arguments,
    inspection: 'defer'
  })
  await call(AiActionNames.APPLY_PREPARED_DESIGN, {
    arguments: {},
    inspection: 'defer'
  })
  const image = await call(AiActionNames.INSPECT_DRAWING, {
    arguments: { elementId: 'successor' }
  })
  await call(AiDesignToolIds.RECORD_DESIGN_REVIEW, {
    phase: 'visual',
    inspectionIds: [image.actionResults[0].result.inspectionId],
    checks: [
      { criterionId: 'Shape', status: 'pass', evidence: 'Refined shape' }
    ]
  })
  expect(capturedScope).toEqual({
    requiredIds: ['successor'],
    overviewIds: ['successor']
  })
})

it('measures a deferred stage once at inspection while preserving receipts and final review requirements', async () => {
  const results: Record<string, unknown> = {
    [AiActionNames.INSPECT_DRAWING]: {
      available: true,
      evidence: { sessionId: 'app-session', revision: 1 },
      imageScope: 'overview',
      image: { dataUrl: png, width: 1, height: 1 }
    },
    [AiActionNames.VALIDATE_INSPECTION_EVIDENCE]: {
      current: true,
      coverage: { complete: true }
    },
    [AiActionNames.REVIEW_DESIGN]: {
      complete: true,
      evidence: { sessionId: 'app-session', revision: 1 },
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
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
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
      criteria: reviewCriteria(['Match the requested design']),
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
          criterionId: 'Match the requested design',
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
          criterionId: 'Match the requested design',
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
    if (action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE)
      return {
        context: {},
        actionResults: [
          {
            actionId: action.id,
            actionName: action.name,
            result: { current: true, coverage: { complete: true } }
          }
        ]
      }
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
                  evidence: { sessionId: 'app-session', revision: 1 },
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
    [
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
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
      criteria: reviewCriteria(['Reflective glass']),
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
            criterionId: 'Reflective glass',
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
            criterionId: 'Reflective glass',
            status: 'pass',
            evidence: 'Old inspection'
          }
        ]
      },
      signal
    )
  ).resolves.toContain('"accepted":false')
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
  expect(index.catalogSize).toBe(basicApiContracts.length)
  expect(
    index.categories.reduce(
      (sum: number, entry: { count: number }) => sum + entry.count,
      0
    )
  ).toBe(basicApiContracts.length)
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

it('searches current API descriptions and names without loading every schema or losing no-match recovery', async () => {
  const custom = {
    ...basicApiContracts[0],
    description: 'Adjust quasar handles using the active App contract',
    inputSchema: {
      type: 'object',
      required: ['quasar'],
      properties: { quasar: { type: 'number' } }
    }
  }
  const actions = [custom, ...basicApiContracts.slice(1)]
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    actions,
    { modelActions: (value) => value, resolveBatch: (value) => value },
    execute
  )
  const signal = new AbortController().signal
  const call = async (args: unknown) =>
    JSON.parse(
      await tools.call(AiDesignToolIds.DESCRIBE_DESIGN_APIS, args, signal)
    )
  const full = await call({})
  const found = await call({ query: 'Quasar HANDLES' })
  expect(found).toMatchObject({
    complete: true,
    count: 1,
    catalogSize: actions.length,
    apis: [{ name: custom.name, description: custom.description }]
  })
  expect(found.apis[0].inputSchema).toEqual(custom.inputSchema)
  expect(found.count).toBeLessThan(full.catalogSize)
  expect((await call({ names: [custom.name], refresh: true })).apis).toEqual([
    expect.objectContaining(custom)
  ])
  expect((await call({ query: 'getVectorAnchorPoints' })).apis).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'api_element_getVectorAnchorPoints' })
    ])
  )
  const empty = await call({ query: 'unmatched-quasar-blueprint' })
  expect(empty).toMatchObject({
    complete: true,
    count: 0,
    apis: [],
    recovery: { arguments: {} }
  })
  expect(empty.message).toContain('not evidence')
  expect((await call({})).catalogSize).toBe(actions.length)
  expect(execute).not.toHaveBeenCalled()
  await expect(
    call({ query: 'quasar', names: [custom.name] })
  ).rejects.toThrow()
  await expect(call({ query: '   ' })).rejects.toThrow()
})

it('executes discovered APIs in a batch and identifies unknown lookup names', async () => {
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
  expect(
    JSON.parse(
      await operations.call(
        AiDesignToolIds.DESCRIBE_DESIGN_APIS,
        { names: ['api_core_resetRuntime'] },
        signal
      )
    )
  ).toMatchObject({
    apis: [],
    tools: [],
    missingNames: ['api_core_resetRuntime']
  })
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
  ).rejects.toThrow('checks[0].criterionId')
})

it.each(['assessment', 'completion'])(
  'rejects stale %s when the App reports an external change after capture',
  async (stage) => {
    let current = true
    const validateName = AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    const execute = vi.fn(async (batch: AiActionBatch) => ({
      context: {},
      actionResults: batch.actions.map((action) => ({
        actionId: action.id,
        actionName: action.name,
        result:
          action.name === validateName
            ? { current, coverage: { complete: current } }
            : {
                available: true,
                image: { dataUrl: 'data:image/png;base64,AA==' },
                evidence: { sessionId: 'app-session', revision: 1 }
              }
      }))
    }))
    const operations = createLocalOperationTools(
      [AiActionNames.INSPECT_DRAWING, validateName].map((name) => ({
        name,
        description: name,
        inputSchema: {}
      })),
      { modelActions: (actions) => actions, resolveBatch: (value) => value },
      execute,
      { reviewTargetId: 'drawing' }
    )
    const signal = new AbortController().signal
    await operations.call(
      AiDesignToolIds.RECORD_DESIGN_REVIEW,
      {
        phase: 'plan',
        method: 'Match the brief',
        references: [],
        criteria: reviewCriteria(['Appearance']),
        detailRequired: false
      },
      signal
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
    const assessment = {
      phase: 'visual',
      inspectionIds: [capture.actionResults[0].result.inspectionId],
      checks: [
        { criterionId: 'Appearance', status: 'pass', evidence: 'Matches' }
      ]
    }
    expect(
      JSON.parse(
        await operations.call(
          AiDesignToolIds.RECORD_DESIGN_REVIEW,
          assessment,
          signal
        )
      )
    ).toMatchObject({ accepted: true })
    current = false
    if (stage === 'assessment') {
      expect(
        JSON.parse(
          await operations.call(
            AiDesignToolIds.RECORD_DESIGN_REVIEW,
            assessment,
            signal
          )
        )
      ).toMatchObject({
        status: 'partial',
        accepted: false,
        evidenceValidation: { current: false }
      })
    } else {
      await operations.validateCompletion(signal)
      const settled = operations.settleOutcome({
        batchId: 'done',
        actions: [
          {
            id: 'done',
            name: AiActionNames.REPORT_OUTCOME,
            arguments: { outcome: 'completed', message: 'Done' },
            summary: 'Done'
          }
        ]
      })
      expect(settled.actions[0].arguments).toMatchObject({
        outcome: 'unsupported'
      })
    }
    expect(
      execute.mock.calls.filter(
        ([batch]) => batch.actions[0].name === validateName
      )
    ).toHaveLength(2)
  }
)

it('remeasures only when capture observes a different canonical generation', async () => {
  let revision = 1
  let changeDuringCapture = true
  const execute = vi.fn(async (batch: AiActionBatch) => {
    const action = batch.actions[0]
    if (action.name === AiActionNames.INSPECT_DRAWING && changeDuringCapture) {
      revision++
      changeDuringCapture = false
    }
    const evidence = { sessionId: 'document', revision }
    const results: Record<string, unknown> = {
      [AiActionNames.REVIEW_DESIGN]: {
        complete: true,
        evidence,
        measuredTextIds: [],
        findings: []
      },
      [AiActionNames.INSPECT_DRAWING]: {
        available: true,
        evidence,
        image: { dataUrl: png }
      },
      [AiActionNames.UPDATE_DESIGN_ELEMENT]: {
        status: 'complete',
        compositionId: 'drawing'
      }
    }
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
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.INSPECT_DRAWING
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute,
    { reviewTargetId: 'drawing' }
  )
  const signal = new AbortController().signal
  await operations.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    { arguments: { elementId: 'drawing' }, inspection: 'defer' },
    signal
  )
  const inspect = () =>
    operations.call(
      AiActionNames.INSPECT_DRAWING,
      { arguments: { elementId: 'drawing' } },
      signal
    )
  await inspect()
  const measurements = () =>
    execute.mock.calls.filter(
      ([batch]) => batch.actions[0].name === AiActionNames.REVIEW_DESIGN
    ).length
  expect(measurements()).toBe(2)
  await inspect()
  expect(measurements()).toBe(2)
})

it.each(['missing stamp', 'missing validation action'])(
  'cannot approve evidence with %s',
  async (missing) => {
    const execute = vi.fn(async (batch: AiActionBatch) => ({
      context: {},
      actionResults: [
        {
          actionId: batch.actions[0].id,
          actionName: AiActionNames.INSPECT_DRAWING,
          result: {
            available: true,
            image: { dataUrl: png },
            ...(missing === 'missing stamp'
              ? {}
              : { evidence: { sessionId: 'app', revision: 1 } })
          }
        }
      ]
    }))
    const names: string[] = [AiActionNames.INSPECT_DRAWING]
    const actions = names.map((name) => ({
      name,
      description: name,
      inputSchema: {}
    }))
    if (missing === 'missing stamp')
      actions.push({
        name: AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
        description: 'Validate',
        inputSchema: {}
      })
    const tools = createLocalOperationTools(
      actions,
      { modelActions: (a) => a, resolveBatch: (v) => v },
      execute,
      { reviewTargetId: 'drawing' }
    )
    const signal = new AbortController().signal
    await tools.call(
      AiDesignToolIds.RECORD_DESIGN_REVIEW,
      {
        phase: 'plan',
        method: 'Match',
        references: [],
        criteria: reviewCriteria(['Appearance']),
        detailRequired: false
      },
      signal
    )
    const capture = JSON.parse(
      await tools.call(
        AiActionNames.INSPECT_DRAWING,
        { arguments: { elementId: 'drawing' } },
        signal
      )
    )
    await expect(
      tools.call(
        AiDesignToolIds.RECORD_DESIGN_REVIEW,
        {
          phase: 'visual',
          inspectionIds: [capture.actionResults[0].result.inspectionId],
          checks: [
            { criterionId: 'Appearance', status: 'pass', evidence: 'Matches' }
          ]
        },
        signal
      )
    ).resolves.toContain('"accepted":false')
    expect(execute).toHaveBeenCalledOnce()
  }
)

it('compacts only successful valueless basic mutation acknowledgements and retains full opt-in', async () => {
  const write = basicActionName('moveElements')
  const read = basicActionName('getVectorAnchorPoints')
  const count = 5000
  const values = [
    { status: 'complete', value: 'new-id', elementId: 'new-id' },
    { status: 'no-change', value: false, elementId: 'unchanged' },
    { status: 'complete', value: null, finding: 'retain unknown data' },
    { status: 'no-change', value: [{ x: 12, y: 34 }] }
  ]
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action, index) => ({
      actionId: action.id,
      actionName: action.name,
      result:
        index < count
          ? {
              status: 'complete',
              value: null,
              application: 'not-reported',
              elementId: `existing-${index}`
            }
          : values[index - count]
    }))
  }))
  const tools = createLocalOperationTools(
    [write, read].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute
  )
  const args = {
    inspection: 'defer',
    operations: Array.from({ length: count + values.length }, (_, index) => ({
      name: index === count + values.length - 1 ? read : write,
      arguments: {}
    }))
  }
  const compact = JSON.parse(
    await tools.call('execute_design_batch', args, new AbortController().signal)
  )
  expect(compact.batchSummary).toEqual({
    operationCount: count + values.length,
    actionCount: count + values.length,
    acknowledgedActions: [
      { actionName: write, count, application: 'not-reported' }
    ]
  })
  expect(
    compact.actionResults.map((entry: { result: unknown }) => entry.result)
  ).toEqual(values)
  expect(JSON.stringify(compact).length).toBeLessThan(2000)
  const full = JSON.parse(
    await tools.call(
      'execute_design_batch',
      { ...args, response: 'full' },
      new AbortController().signal
    )
  )
  expect(full.actionResults).toHaveLength(count + values.length)
  expect(execute).toHaveBeenCalledTimes(2)
})

it('retrieves retained source facts without canvas reads, captures or repeated verification', async () => {
  const executeBatch = vi.fn(async () => ({ actionResults: [], context: {} }))
  const operations = createLocalOperationTools(
    [AiActionNames.INSPECT_DRAWING].map((name) => ({
      name,
      description: name,
      inputSchema: {}
    })),
    { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
    executeBatch
  )
  const signal = new AbortController().signal
  const fact = {
    id: 'scale',
    statement: 'Use 1 cm = 1 px.',
    scope: 'Requested scale',
    sources: ['current-user-request'],
    verification: 'Explicit scale in the user request.',
    dependencies: [{ key: 'request:scale', version: '1' }]
  }
  const saved = await operations.call(
    AiDesignToolIds.RECORD_DESIGN_REVIEW,
    { phase: 'facts', facts: [fact] },
    signal
  )
  for (let i = 0; i < 5; i++) {
    expect(
      await operations.call(
        AiDesignToolIds.RECORD_DESIGN_REVIEW,
        { phase: 'facts' },
        signal
      )
    ).toEqual(saved)
  }
  expect(executeBatch).not.toHaveBeenCalled()
})

it('includes bound fact targets in one canonical coverage check before visual acceptance', async () => {
  let covered = false
  const stamp = { sessionId: 'binding-test', revision: 1 }
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result:
        action.name === AiActionNames.INSPECT_DRAWING
          ? {
              available: true,
              imageScope: 'overview',
              evidence: stamp,
              image: {
                dataUrl: 'data:image/png;base64,YQ==',
                width: 1,
                height: 1
              }
            }
          : { current: true, coverage: { complete: covered } }
    }))
  }))
  const tools = createLocalOperationTools(
    [
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
    execute,
    { reviewTargetId: 'root' }
  )
  const call = (name: string, args: unknown) =>
    tools.call(name, args, new AbortController().signal).then(JSON.parse)
  await call(AiDesignToolIds.RECORD_DESIGN_REVIEW, {
    phase: 'plan',
    method: 'Edit',
    references: [],
    criteria: reviewCriteria(['Axis']),
    detailRequired: false,
    facts: [
      {
        id: 'axis',
        statement: 'Retain source axis',
        scope: 'crown',
        sources: ['source'],
        verification: 'Measured source',
        dependencies: [{ key: 'source', version: '1' }]
      }
    ],
    factBindings: [
      { factId: 'axis', criterionId: 'Axis', elementIds: ['crown', 'shaft'] }
    ]
  })
  expect(execute).not.toHaveBeenCalled()
  const image = await call(AiActionNames.INSPECT_DRAWING, {
    arguments: { elementId: 'root', view: 'overview' }
  })
  const visual = {
    phase: 'visual',
    inspectionIds: [image.actionResults[0].result.inspectionId],
    checks: [
      {
        criterionId: 'Axis',
        status: 'pass',
        evidence: 'Axes match'
      }
    ]
  }
  await expect(
    call(AiDesignToolIds.RECORD_DESIGN_REVIEW, visual)
  ).resolves.toMatchObject({
    status: 'partial',
    accepted: false,
    evidenceValidation: { coverage: { complete: false } }
  })
  expect(execute.mock.calls[1][0].actions[0].arguments).toMatchObject({
    scope: { requiredIds: ['root', 'crown', 'shaft'], overviewIds: ['root'] }
  })
  covered = true
  expect(
    await call(AiDesignToolIds.RECORD_DESIGN_REVIEW, visual)
  ).toMatchObject({ accepted: true })
  expect(execute).toHaveBeenCalledTimes(3)
})

it('resolves a nested plural target through the registered schema in one canonical exchange', async () => {
  const execute = vi.fn(async (_batch: AiActionBatch) => ({
    actionResults: [],
    context: {}
  }))
  const resolveTargets = vi.fn(() => ['a', 'b'])
  const nested = {
    type: 'object',
    additionalProperties: false,
    required: ['elementIds', 'targetParentId'],
    properties: {
      elementIds: { type: 'array', items: { type: 'string' } },
      targetParentId: { type: 'string' }
    }
  }
  const tools = createLocalOperationTools(
    [
      {
        name: 'api_hierarchy_moveElements',
        description: 'move',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['request'],
          properties: { request: nested }
        }
      }
    ],
    { modelActions: (a) => a, resolveBatch: (v) => v, resolveTargets },
    execute
  )
  const args = { request: { targetParentId: 'parent' } }
  const call = (argumentsValue: unknown) =>
    tools.call(
      'execute_design_batch',
      {
        inspection: 'defer',
        operations: [
          {
            name: 'api_hierarchy_moveElements',
            arguments: argumentsValue,
            target: {
              artifactId: 'saved',
              keyPrefix: 'ornament-',
              field: 'elementIds'
            }
          }
        ]
      },
      new AbortController().signal
    )
  await call(args)
  expect(execute).toHaveBeenCalledTimes(1)
  expect(execute.mock.calls[0][0].actions).toHaveLength(1)
  expect(execute.mock.calls[0][0].actions[0].arguments).toEqual({
    request: { targetParentId: 'parent', elementIds: ['a', 'b'] }
  })
  expect(args).toEqual({ request: { targetParentId: 'parent' } })
  expect(resolveTargets).toHaveBeenCalledTimes(1)
  execute.mockClear()
  await expect(
    call({ request: { targetParentId: 'parent', elementIds: ['other'] } })
  ).rejects.toThrow(/conflicting/)
  await expect(call({ request: null })).rejects.toThrow()
  expect(execute).not.toHaveBeenCalled()
})

it('rejects ambiguous identity paths before reading identities', () => {
  const resolve = vi.fn(() => ['a'])
  expect(() =>
    prepareOperationBatch(
      [
        {
          name: 'edit',
          arguments: {},
          target: { artifactId: 'a', field: 'elementId' }
        }
      ],
      [
        {
          name: 'edit',
          description: 'edit',
          inputSchema: {
            type: 'object',
            properties: {
              left: {
                type: 'object',
                properties: { elementId: { type: 'string' } }
              },
              right: {
                type: 'object',
                properties: { elementId: { type: 'string' } }
              }
            }
          }
        }
      ],
      resolve
    )
  ).toThrow(/unambiguous/)
  expect(resolve).not.toHaveBeenCalled()
})

it.each([
  'visual',
  'data',
  'provider-failure',
  'malformed-assessment',
  'uncovered'
] as const)(
  'routes %s review without unnecessary image assessment or stale approval',
  async (verification) => {
    let current = true
    let outcome: 'fail' | 'pass' = 'fail'
    let changeDuringAssessment = false
    let completeCoverage = true
    const png = 'data:image/png;base64,YQ=='
    const assessVisual = vi.fn(async (input) => {
      expect(input).not.toHaveProperty('checks')
      expect(input).not.toHaveProperty('method')
      expect(input.referenceImageIndexes).toEqual([1])
      expect(input.images).toEqual([{ role: 'overview', dataUrl: png }])
      if (changeDuringAssessment) {
        if (verification === 'provider-failure')
          throw new Error('Visual provider disconnected')
        if (verification === 'malformed-assessment')
          return { checks: [] } as never
        if (verification === 'uncovered') completeCoverage = false
        else current = false
      }
      return {
        overall: { status: outcome, evidence: 'Whole-form comparison.' },
        checks: [
          {
            criterionId: 'view',
            status: outcome,
            evidence: 'Visible faces are unfolded.'
          }
        ]
      }
    })
    const tools = createLocalOperationTools(
      [
        AiActionNames.INSPECT_DRAWING,
        AiActionNames.VALIDATE_INSPECTION_EVIDENCE
      ].map((name) => ({ name, description: name, inputSchema: {} })),
      { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
      async (batch) => ({
        context: {},
        actionResults: batch.actions.map((action) => ({
          actionId: action.id,
          actionName: action.name,
          result:
            action.name === AiActionNames.INSPECT_DRAWING
              ? {
                  available: true,
                  imageScope: 'overview',
                  evidence: { sessionId: 'test', revision: 1 },
                  image: { dataUrl: png }
                }
              : { current, coverage: { complete: completeCoverage } }
        }))
      }),
      { reviewTargetId: 'root', assessVisual }
    )
    const signal = new AbortController().signal
    const call = (name: string, args: unknown) =>
      tools.call(name, args, signal).then(JSON.parse)
    await call(AiDesignToolIds.RECORD_DESIGN_REVIEW, {
      phase: 'plan',
      method: 'I am correct',
      referenceImageIndexes: [1],
      references: [],
      criteria: {
        view: {
          requirement: 'solid tower',
          description: 'correct',
          verification: verification === 'data' ? 'data' : 'visual'
        }
      },
      structureCriteria: ['view'],
      detailRequired: false
    })
    const image = await call(AiActionNames.INSPECT_DRAWING, {
      arguments: { elementId: 'root' }
    })
    const review = {
      phase: 'structure',
      inspectionIds: [image.actionResults[0].result.inspectionId],
      checks: [
        { criterionId: 'view', status: 'pass', evidence: 'I did it correctly' }
      ]
    }
    if (verification === 'data') {
      expect(
        await call(AiDesignToolIds.RECORD_DESIGN_REVIEW, review)
      ).toMatchObject({ readyForDetail: true })
      expect(
        await call(AiDesignToolIds.RECORD_DESIGN_REVIEW, {
          ...review,
          phase: 'visual',
          final: true
        })
      ).toMatchObject({ accepted: true })
      expect(assessVisual).not.toHaveBeenCalled()
      return
    }
    expect(
      await call(AiDesignToolIds.RECORD_DESIGN_REVIEW, review)
    ).toMatchObject({ readyForDetail: false })
    expect(assessVisual).toHaveBeenCalledTimes(1)
    await call(AiDesignToolIds.RECORD_DESIGN_REVIEW, {
      ...review,
      phase: 'visual',
      final: false
    })
    expect(assessVisual).toHaveBeenCalledTimes(1)
    outcome = 'pass'
    changeDuringAssessment = true
    if (
      verification === 'provider-failure' ||
      verification === 'malformed-assessment'
    ) {
      const error = await call(
        AiDesignToolIds.RECORD_DESIGN_REVIEW,
        review
      ).catch((error) => error)
      expect(error).toBeInstanceOf(Error)
      expect(error).not.toBeInstanceOf(LocalOperationPreparationError)
      return
    }
    expect(
      await call(AiDesignToolIds.RECORD_DESIGN_REVIEW, review)
    ).toMatchObject({
      status: 'partial',
      accepted: false,
      readyForDetail: false,
      evidenceValidation:
        verification === 'uncovered'
          ? { current: true, coverage: { complete: false } }
          : { current: false },
      independentAssessment: {
        checks: [{ criterionId: 'view', status: 'pass' }]
      }
    })
    expect(tools.getStructureIssue()).toBeTruthy()
  }
)

it('resolves an exact semantic operation using the admitted schema without a canvas exchange', async () => {
  const execute = vi.fn(async () => ({ actionResults: [], context: {} }))
  const admitted = basicApiContracts.map((api) =>
    api.method === 'updateFillsAtIndex'
      ? {
          ...api,
          description: 'Current uniform row patch',
          inputSchema: { type: 'object', required: ['currentField'] }
        }
      : api
  )
  const tools = createLocalOperationTools(
    admitted,
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute
  )
  const result = JSON.parse(
    await tools.call(
      'describe_design_apis',
      { operation: 'fill.updateFillsAtIndex' },
      new AbortController().signal
    )
  )
  expect(result.apis).toHaveLength(1)
  expect(result.apis[0]).toMatchObject({
    name: 'api_fill_updateFillsAtIndex',
    description: 'Current uniform row patch',
    inputSchema: { required: ['currentField'] }
  })
  expect(execute).not.toHaveBeenCalled()
})

it('publishes categories instead of the full API catalog for an empty lookup', async () => {
  const tools = createLocalOperationTools(
    basicApiContracts,
    { modelActions: (a) => a, resolveBatch: (v) => v },
    async () => ({ actionResults: [], context: {} })
  )
  const index = JSON.parse(
    await tools.call('describe_design_apis', {}, new AbortController().signal)
  )
  expect(index.apis).toBeUndefined()
  expect(index.categories).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ category: 'fill' }),
      expect.objectContaining({ category: 'vector' })
    ])
  )
})

it('exposes single-object conveniences only inside the batch schema', () => {
  const names = [
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    AiActionNames.SET_ELEMENT_VISIBILITY
  ]
  const tools = createLocalOperationTools(
    names.map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (a) => a, resolveBatch: (v) => v },
    async () => ({ actionResults: [], context: {} })
  )
  expect(tools.definitions.map((tool) => tool.name)).not.toEqual(
    expect.arrayContaining(names)
  )
  const batch = tools.definitions.find(
    (tool) => tool.name === AiDesignToolIds.EXECUTE_DESIGN_BATCH
  )
  expect(JSON.stringify(batch?.inputSchema)).toContain(
    AiActionNames.UPDATE_DESIGN_ELEMENT
  )
  expect(JSON.stringify(batch?.inputSchema)).toContain(
    AiActionNames.SET_ELEMENT_VISIBILITY
  )
})

it('discovers batch-only composite schemas without exposing a scalar native tool', async () => {
  const action = {
    name: AiActionNames.UPDATE_DESIGN_ELEMENT,
    description: 'Update selected fields',
    inputSchema: { type: 'object', required: ['elementId'] }
  }
  const tools = createLocalOperationTools(
    [action],
    { modelActions: (a) => a, resolveBatch: (v) => v },
    async () => ({ actionResults: [], context: {} })
  )
  const result = JSON.parse(
    await tools.call(
      'describe_design_apis',
      { operation: action.name },
      new AbortController().signal
    )
  )
  expect(result.apis[0].inputSchema).toEqual(action.inputSchema)
  expect(result.apis[0].category).toBe('design')
  expect(tools.definitions.some((tool) => tool.name === action.name)).toBe(
    false
  )
})

it.each([
  {
    method: 'groupElements',
    args: { elementIds: ['original'] },
    result: {
      status: 'complete',
      value: { groupId: 'assembled', elementIds: ['original'] }
    },
    previous: 'original',
    expected: 'assembled'
  },
  {
    method: 'createElements',
    args: { createOptions: [{ type: 'rectangle' }] },
    result: {
      status: 'complete',
      value: ['created'],
      appliedElementIds: ['created']
    },
    previous: undefined,
    expected: 'created'
  }
])(
  'uses canonical identities from wrapped $method receipts for the next inspection',
  async ({ method, args, result, previous, expected }) => {
    const contract = basicApiContracts.find((api) => api.method === method)
    if (!contract) throw new Error('Missing contract')
    const execute = vi.fn(async (batch: AiActionBatch) => ({
      context: {},
      actionResults: batch.actions.map((action) => ({
        actionId: action.id,
        actionName: action.name,
        result: action.name === contract.name ? result : { available: true }
      }))
    }))
    const tools = createLocalOperationTools(
      [
        contract,
        {
          name: AiActionNames.INSPECT_DRAWING,
          description: 'Inspect',
          inputSchema: {}
        }
      ],
      { modelActions: (a) => a, resolveBatch: (v) => v },
      execute,
      { reviewTargetId: previous }
    )
    await tools.call(
      'execute_design_batch',
      { operations: [{ name: contract.name, arguments: args }] },
      new AbortController().signal
    )
    expect(execute.mock.calls.at(-1)?.[0].actions[0]).toMatchObject({
      name: AiActionNames.INSPECT_DRAWING,
      arguments: { elementId: expected }
    })
  }
)

it('advertises admitted categories and includes their choices in invalid lookup recovery', async () => {
  const execute = vi.fn(async () => ({ actionResults: [], context: {} }))
  const admitted = basicApiContracts.filter((api) => api.owner === 'fill')
  const tools = createLocalOperationTools(
    admitted,
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute
  )
  const definition = tools.definitions.find(
    (tool) => tool.name === 'describe_design_apis'
  )
  expect(JSON.stringify(definition?.inputSchema)).toContain('"enum":["fill"]')
  expect(
    JSON.parse(
      await tools.call(
        'describe_design_apis',
        { names: ['prepare_design'] },
        new AbortController().signal
      )
    )
  ).toMatchObject({
    missingNames: ['prepare_design'],
    message: expect.stringContaining('Available categories: fill')
  })
  for (const selector of [
    { category: 'creation' },
    { operation: 'missing.operation' }
  ]) {
    await expect(
      tools.call('describe_design_apis', selector, new AbortController().signal)
    ).rejects.toThrow('Available categories: fill')
  }
  expect(execute).not.toHaveBeenCalled()
})

it('keeps prepared targets and different Fill patches in one plural operation without an ID read', async () => {
  const ids = Array.from({ length: 400 }, (_, index) => `element-${index}`)
  const patches = ids.map((_, index) => ({ opacity: index / ids.length }))
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result: { status: 'complete', value: null }
    }))
  }))
  const resolveTargets = vi.fn(() => ids)
  const tools = createLocalOperationTools(
    basicApiContracts,
    {
      modelActions: (a) => a,
      resolveBatch: (v) => v,
      resolveTargets
    },
    execute
  )
  for (const [name, args] of [
    ['api_fill_updateFillsAtIndex', { index: 0, patch: patches }],
    ['api_element_setElementsVisible', { visible: false }]
  ] as const) {
    await tools.call(
      'execute_design_batch',
      {
        operations: [
          {
            name,
            arguments: args,
            target: {
              artifactId: 'prepared',
              keyPrefix: 'parts-',
              field: 'elementIds'
            }
          }
        ],
        inspection: 'defer'
      },
      new AbortController().signal
    )
  }
  expect(execute).toHaveBeenCalledTimes(2)
  for (const [batch] of execute.mock.calls) {
    expect(batch.actions).toHaveLength(1)
    expect(batch.actions[0].arguments).toMatchObject({ elementIds: ids })
  }
  expect(execute.mock.calls[0][0].actions[0].arguments).toMatchObject({
    patch: patches
  })
  expect(resolveTargets).toHaveBeenCalledTimes(2)
})

it.each([
  {
    statuses: ['changed', 'changed'],
    status: 'complete',
    ids: ['a', 'b'],
    defer: false
  },
  {
    statuses: ['unchanged', 'unchanged'],
    status: 'no-change',
    ids: ['a', 'b'],
    defer: false
  },
  {
    statuses: ['unavailable', 'changed', 'unchanged'],
    status: 'partial',
    ids: ['missing', 'a', 'b'],
    defer: false
  },
  {
    statuses: ['changed', 'changed'],
    status: 'complete',
    ids: ['a', 'b'],
    defer: true
  }
])(
  'reviews all confirmed visibility targets without a prior composition ($status, defer=$defer)',
  async ({ statuses, status, ids, defer }) => {
    const contract = basicApiContracts.find(
      (api) => api.method === 'setElementsVisible'
    )
    if (!contract) throw new Error('Missing visibility contract')
    const execute = vi.fn(async (batch: AiActionBatch) => ({
      context: {},
      actionResults: batch.actions.map((action) => {
        const args = action.arguments as Record<string, unknown>
        let result: unknown
        if (action.name === contract.name) {
          result = describeBasicApiResult(contract, statuses, args.elementIds)
        } else if (action.name === AiActionNames.INSPECT_DRAWING) {
          result = {
            available: true,
            imageScope: 'overview',
            evidence: { sessionId: 'visibility', revision: 1 },
            image: {
              dataUrl: 'data:image/png;base64,YQ==',
              width: 1,
              height: 1
            }
          }
        } else {
          const scope = args.scope as {
            requiredIds: string[]
            overviewIds: string[]
          }
          result = {
            current: true,
            coverage: {
              complete: scope.requiredIds.every((id) =>
                scope.overviewIds.includes(id)
              )
            }
          }
        }
        return {
          actionId: action.id,
          actionName: action.name,
          result: result as AiJsonValue
        }
      })
    }))
    const tools = createLocalOperationTools(
      [
        contract,
        ...[
          AiActionNames.INSPECT_DRAWING,
          AiActionNames.VALIDATE_INSPECTION_EVIDENCE
        ].map((name) => ({ name, description: name, inputSchema: {} }))
      ],
      { modelActions: (a) => a, resolveBatch: (b) => b },
      execute
    )
    const call = (name: string, args: unknown) =>
      tools.call(name, args, new AbortController().signal).then(JSON.parse)
    await call(AiDesignToolIds.RECORD_DESIGN_REVIEW, {
      phase: 'plan',
      method: 'Change visibility',
      references: [],
      criteria: reviewCriteria(['Visibility']),
      detailRequired: false
    })
    const receipt = await call('execute_design_batch', {
      operations: [
        { name: contract.name, arguments: { elementIds: ids, visible: false } }
      ],
      ...(defer ? { inspection: 'defer', response: 'full' } : {})
    })
    expect(receipt.actionResults[0].result).toMatchObject({
      status,
      value: statuses,
      reviewElementIds: ['a', 'b']
    })
    expect(execute.mock.calls[0][0].actions).toHaveLength(1)
    let inspected = receipt
    if (defer) {
      expect(execute).toHaveBeenCalledTimes(1)
      expect(receipt.inspectionDeferred).toBe(true)
      inspected = await call(AiActionNames.INSPECT_DRAWING, {
        arguments: { elementId: 'a' }
      })
    } else {
      expect(execute).toHaveBeenCalledTimes(2)
      expect(execute.mock.calls[1][0].actions[0]).toMatchObject({
        name: AiActionNames.INSPECT_DRAWING,
        arguments: { elementId: 'a' }
      })
    }
    const firstImage = inspected.actionResults.find(
      (entry: { actionName: string }) =>
        entry.actionName === AiActionNames.INSPECT_DRAWING
    ).result.inspectionId
    const review = (inspectionIds: string[]) =>
      call(AiDesignToolIds.RECORD_DESIGN_REVIEW, {
        phase: 'visual',
        inspectionIds,
        checks: [
          {
            criterionId: 'Visibility',
            status: 'pass',
            evidence: 'Requested visibility checked'
          }
        ]
      })
    expect(await review([firstImage])).toMatchObject({ accepted: false })
    expect(execute.mock.calls.at(-1)?.[0].actions[0].arguments).toMatchObject({
      scope: { requiredIds: ['a', 'b'], overviewIds: ['a'] }
    })
    const second = await call(AiActionNames.INSPECT_DRAWING, {
      arguments: { elementId: 'b' }
    })
    expect(
      await review([firstImage, second.actionResults[0].result.inspectionId])
    ).toMatchObject({ accepted: true })
    await tools.validateCompletion()
    expect(execute.mock.calls.at(-1)?.[0].actions[0].arguments).toMatchObject({
      scope: { requiredIds: ['a', 'b'], overviewIds: ['a', 'b'] }
    })
    if (status !== 'partial') {
      const final = {
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
      expect(tools.settleOutcome(final)).toEqual(final)
    }
  }
)

it('retrieves exact admitted category schemas in one read-only discovery call', async () => {
  const execute = vi.fn(async () => ({ actionResults: [], context: {} }))
  const admitted = basicApiContracts.filter((api) => api.owner === 'fill')
  const tools = createLocalOperationTools(
    admitted,
    { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
    execute
  )
  const call = async (args: unknown) =>
    JSON.parse(
      await tools.call(
        'describe_design_apis',
        args,
        new AbortController().signal
      )
    )
  const expanded = await call({ category: 'fill', includeSchemas: true })
  const exact = await call({
    names: expanded.apis.map((api: { name: string }) => api.name)
  })
  expect(expanded.apis.length).toBeGreaterThan(0)
  expect(exact.apis.map((api: { name: string }) => api.name)).toEqual(
    expanded.apis.map((api: { name: string }) => api.name)
  )
  for (const api of exact.apis) expect(api.inputSchema).toBeUndefined()
  for (const api of expanded.apis) expect(api.inputSchema).toBeDefined()
  const compact = await call({ category: 'fill' })
  expect(compact.apis.map((api: { name: string }) => api.name)).toEqual(
    expanded.apis.map((api: { name: string }) => api.name)
  )
  for (const api of compact.apis) expect(api.inputSchema).toBeUndefined()
  expect(await call({ category: 'fill', includeSchemas: false })).toEqual(
    compact
  )
  for (const args of [
    { includeSchemas: true },
    { names: [], includeSchemas: true },
    { category: 'fill', includeSchemas: 'true' },
    { category: 'fill', query: 'fill', includeSchemas: true },
    { category: 'unavailable', includeSchemas: true }
  ])
    await expect(call(args)).rejects.toThrow()
  expect(execute).not.toHaveBeenCalled()
})

it('resolves mixed action and native names without discarding known matches or dispatching', async () => {
  const action = {
    name: AiActionNames.ORGANIZE_DESIGN,
    description: 'Organize',
    inputSchema: { type: 'object', required: ['elementIds'] }
  }
  const native = [
    {
      namespace: 'registered_operations',
      name: AiDesignToolIds.EXECUTE_DESIGN_BATCH,
      description: 'Dispatch',
      inputSchema: { type: 'object', required: ['operations'] }
    },
    {
      namespace: 'registered_preparation',
      name: 'prepare_new_capability',
      description: 'New tool',
      inputSchema: { type: 'object', required: ['draft'] }
    },
    {
      namespace: 'registered_operations',
      ...action,
      inputSchema: { type: 'object', required: ['arguments'] }
    }
  ]
  const getNativeTools = vi.fn(() => native)
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    [action],
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute,
    { getNativeTools }
  )
  const lookup = async (names: string[]) =>
    JSON.parse(
      await tools.call(
        'describe_design_apis',
        { names },
        new AbortController().signal
      )
    )
  const result = await lookup([
    action.name,
    AiDesignToolIds.EXECUTE_DESIGN_BATCH,
    'prepare_new_capability',
    'unregistered'
  ])
  expect(result.apis).toEqual([
    expect.objectContaining({
      ...action,
      execution: {
        kind: 'batch-action',
        tool: AiDesignToolIds.EXECUTE_DESIGN_BATCH
      }
    })
  ])
  expect(result.tools).toHaveLength(native.length)
  expect(result.tools).toEqual(
    expect.arrayContaining(
      native.map(
        ({ inputSchema: _schema, description: _description, ...tool }) =>
          expect.objectContaining({
            ...tool,
            execution: {
              kind: 'native-tool',
              namespace: tool.namespace,
              tool: tool.name
            }
          })
      )
    )
  )
  expect(result.missingNames).toEqual(['unregistered'])
  expect(
    (await lookup(['registered_preparation.prepare_new_capability'])).tools[0]
  ).toMatchObject({ name: native[1].name, namespace: native[1].namespace })
  for (const tool of result.tools) {
    const source = native.find(
      (entry) => entry.namespace === tool.namespace && entry.name === tool.name
    )
    expect(tool.inputSchema).toEqual(source?.inputSchema)
    expect(tool.description).toEqual(source?.description)
    expect(tool.definition.state).toBe('included')
  }
  const repeated = (
    await lookup(['registered_preparation.prepare_new_capability'])
  ).tools[0]
  expect(repeated.inputSchema).toBeUndefined()
  expect(repeated.definition.state).toBe('previously-returned')
  const refreshed = JSON.parse(
    await tools.call(
      'describe_design_apis',
      repeated.definition.refresh.arguments,
      new AbortController().signal
    )
  ).tools[0]
  expect(refreshed.inputSchema).toEqual(native[1].inputSchema)
  expect(refreshed.definition.state).toBe('included')
  expect(getNativeTools).toHaveBeenCalledOnce()
  expect(execute).not.toHaveBeenCalled()
})

it('retrieves usage and exact schema fragments without consuming full definition delivery', async () => {
  const action = {
    name: AiActionNames.ORGANIZE_DESIGN,
    description: 'Arrange supplied elements.',
    inputSchema: {
      type: 'object',
      required: ['rows'],
      properties: {
        rows: { type: 'array', items: { $ref: '#/$defs/row' } },
        unrelated: {
          description: 'Unrelated detail. '.repeat(300),
          type: 'string'
        }
      },
      $defs: {
        row: { type: 'object', properties: { next: { $ref: '#/$defs/row' } } },
        unused: { type: 'string' }
      }
    }
  }
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    [action],
    { modelActions: (a) => a, resolveBatch: (b) => b },
    execute
  )
  const read = (args: unknown) =>
    tools
      .call('describe_design_apis', args, new AbortController().signal)
      .then(JSON.parse)
  const usage = (await read({ names: [action.name], view: 'usage' })).apis[0]
  expect(usage.description).toBe(action.description)
  expect(usage.inputSchema).toBeUndefined()
  expect(usage.inputFields).toContain('/properties/rows')
  expect(usage.definition.coverage).toBe('usage')
  const partial = (
    await read({
      operation: action.name,
      schemaPaths: ['/properties/rows/items']
    })
  ).apis[0]
  expect(partial.schemaFragments).toEqual([
    { path: '/properties/rows/items', schema: { $ref: '#/$defs/row' } }
  ])
  expect(partial.schemaReferences).toEqual({
    '#/$defs/row': action.inputSchema.$defs.row
  })
  expect(partial.definition.coverage).toBe('partial')
  expect(partial.inputSchema).toBeUndefined()
  const full = (await read({ names: [action.name] })).apis[0]
  expect(full.inputSchema).toEqual(action.inputSchema)
  expect(full.definition).toMatchObject({
    state: 'included',
    coverage: 'full',
    availableInResponse: true
  })
  const repeated = (await read({ names: [action.name] })).apis[0]
  expect(repeated.definition).toMatchObject({
    state: 'previously-returned',
    coverage: 'reference',
    availableInResponse: false
  })
  expect(repeated.definition.nextAction).toBe('reuse-or-refresh-if-missing')
  expect(
    (await read(repeated.definition.refresh.arguments)).apis[0].inputSchema
  ).toEqual(action.inputSchema)
  expect(JSON.stringify(partial).length).toBeLessThan(
    JSON.stringify(full).length / 2
  )
  expect(JSON.stringify(usage).length).toBeLessThan(
    JSON.stringify(full).length / 2
  )
  await expect(
    read({ names: [action.name], schemaPaths: ['/properties/missing'] })
  ).rejects.toThrow('Unknown schema path')
  for (const query of [
    { category: 'design', view: 'usage' },
    { names: [action.name], view: ['usage'] },
    { names: [action.name], schemaPaths: [] },
    { names: [action.name], schemaPaths: ['properties/rows'] },
    { names: [action.name], schemaPaths: ['/properties/rows'], view: 'usage' },
    { names: [action.name], view: 'usage', refresh: true }
  ])
    await expect(read(query)).rejects.toThrow()
  expect(execute).not.toHaveBeenCalled()
})

it('uses exact native schema paths with escaped names and keeps unknown paths recoverable', async () => {
  const native = {
    namespace: 'custom',
    name: 'inspect_custom',
    description: 'Custom input',
    inputSchema: {
      type: 'object',
      properties: { 'a/b~c': { type: 'boolean' }, blocked: false }
    }
  }
  const getNativeTools = vi.fn(() => [native])
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.ORGANIZE_DESIGN,
        description: 'Arrange',
        inputSchema: {}
      }
    ],
    { modelActions: (a) => a, resolveBatch: (b) => b },
    vi.fn(),
    { getNativeTools }
  )
  const read = (args: unknown) =>
    tools
      .call('describe_design_apis', args, new AbortController().signal)
      .then(JSON.parse)
  const partial = (
    await read({
      names: ['custom.inspect_custom'],
      schemaPaths: ['/properties/a~1b~0c', '/properties/blocked']
    })
  ).tools[0]
  expect(partial.schemaFragments).toEqual([
    { path: '/properties/a~1b~0c', schema: { type: 'boolean' } },
    { path: '/properties/blocked', schema: false }
  ])
  expect(partial.execution).toEqual({
    kind: 'native-tool',
    namespace: 'custom',
    tool: 'inspect_custom'
  })
  await expect(
    read({ names: ['custom.inspect_custom'], schemaPaths: ['/__proto__'] })
  ).rejects.toThrow('Unknown schema path')
  const full = (await read(partial.definition.refresh.arguments)).tools[0]
  expect(full.inputSchema).toEqual(native.inputSchema)
  expect(full.definition.state).toBe('included')
  expect(
    (await read({ names: ['custom.inspect_custom'], view: 'usage' })).tools[0]
      .definition.coverage
  ).toBe('usage')
  expect(getNativeTools).toHaveBeenCalledOnce()
})

it('returns one action definition per request revision with explicit context recovery', async () => {
  const action = {
    name: AiActionNames.ORGANIZE_DESIGN,
    description: 'An admitted operation',
    inputSchema: { type: 'object', required: ['value'] }
  }
  const create = () =>
    createLocalOperationTools(
      [action],
      { modelActions: (a) => a, resolveBatch: (b) => b },
      vi.fn()
    )
  const tools = create()
  const read = (args: unknown, owner = tools) =>
    owner
      .call('describe_design_apis', args, new AbortController().signal)
      .then(JSON.parse)
  await read({ category: 'design' })
  const first = (await read({ names: [action.name] })).apis[0]
  expect(first.inputSchema).toEqual(action.inputSchema)
  expect(first.definition.state).toBe('included')
  const repeated = (await read({ operation: action.name })).apis[0]
  expect(repeated.inputSchema).toBeUndefined()
  expect(repeated.definition).toMatchObject({
    revision: first.definition.revision,
    state: 'previously-returned'
  })
  const recovered = (await read(repeated.definition.refresh.arguments)).apis[0]
  expect(recovered.inputSchema).toEqual(action.inputSchema)
  expect(recovered.definition.revision).toBe(first.definition.revision)
  expect(
    (await read({ names: [action.name] }, create())).apis[0].inputSchema
  ).toEqual(action.inputSchema)
  action.inputSchema.required = ['different']
  const changed = (await read({ names: [action.name] }, create())).apis[0]
  expect(changed.definition.revision).not.toBe(first.definition.revision)
  expect(changed.inputSchema.required).toEqual(['different'])
})

it('executes the advertised Code Mode recipe for image, multi-image and text-only results without leaking image bytes', async () => {
  for (const count of [0, 1, 2]) {
    const receipt = {
      actionResults: Array.from({ length: count }, () => ({
        actionName: AiActionNames.INSPECT_DRAWING,
        result: {
          available: true,
          image: { dataUrl: png, width: 1, height: 1 }
        }
      }))
    }
    const content = await localToolContent(JSON.stringify(receipt))
    // Actual native Code Mode adapter shape, independently verified by live probe.
    const result = content
      .map((item) => (item.type === 'inputText' ? item.text : item.imageUrl))
      .join('\n')
    const text = vi.fn()
    const image = vi.fn()
    runInNewContext(localToolResultExample, { result, text, image })
    expect(text).toHaveBeenCalledOnce()
    expect(JSON.stringify(text.mock.calls)).not.toContain('base64')
    expect(image).toHaveBeenCalledTimes(count)
    for (const call of image.mock.calls) expect(call).toEqual([png])
  }
})

it('retains the exact preparation rejection so the next call can correct it without dispatch', async () => {
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.APPLY_PREPARED_DESIGN,
        description: 'Apply',
        inputSchema: {}
      }
    ],
    {
      modelActions: (actions) => actions,
      resolveBatch: () => {
        throw new Error(
          'Prepared artifact expired: prepare a new artifact for this request'
        )
      }
    },
    execute
  )
  await expect(
    tools.call(
      'execute_design_batch',
      {
        operations: [
          {
            name: AiActionNames.APPLY_PREPARED_DESIGN,
            arguments: { artifactId: 'expired' }
          }
        ]
      },
      new AbortController().signal
    )
  ).rejects.toThrow('Prepared artifact expired')
  expect(execute).not.toHaveBeenCalled()
})

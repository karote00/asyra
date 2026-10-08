import { AiDesignToolIds } from '../../src/constants/ai-design'
import { reviewPlanExample } from '../local-design-review'
import { invokeLocalTool } from '../local-tool-invocation'
import {
  nativeToolInputSchema,
  operationInputIssue
} from '../operation-input-schema'
import { designPreparationExamples } from '../design-preparation-examples'
import { describe, expect, it, vi } from 'vitest'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalOperationTools } from '../local-operation-tools'
import {
  createLocalToolScheduler,
  LocalToolAccess
} from '../local-tool-scheduler'
import {
  createDesignPreparationSession,
  prepareDesign
} from '../design-preparation'
import { AiActionNames } from '../../src/constants/ai-actions'
import type {
  AiBatchReceipt,
  AiActionBatch
} from '../../src/ai/action-batch-protocol'

const actions = [
  {
    name: AiActionNames.APPLY_PREPARED_DESIGN,
    description: 'Apply',
    inputSchema: {}
  }
]
const draft = {
  type: 'group',
  name: 'Composition',
  children: [
    {
      type: 'rect',
      key: 'face',
      name: 'Face',
      x: 0,
      y: 0,
      width: 40,
      height: 30,
      fill: '#123456'
    }
  ]
}
const setup = () => {
  const compile = vi.fn(prepareDesign)
  const designs = createLocalDesignTools(
    actions,
    createDesignPreparationSession(compile)
  )
  const execute = vi.fn(
    async (_batch: AiActionBatch): Promise<AiBatchReceipt> => ({
      context: { selection: ['root'] },
      actionResults: [
        {
          actionId: 'a',
          actionName: AiActionNames.APPLY_PREPARED_DESIGN,
          result: {
            compositionId: 'root',
            status: 'complete',
            appliedElementIds: ['root', 'face'],
            keyToId: { face: 'face' },
            roleToElementIds: { face: ['face'] }
          }
        }
      ]
    })
  )
  const operations = createLocalOperationTools(actions, designs, execute)
  return {
    workflow: createLocalDesignWorkflow(designs, operations),
    compile,
    execute
  }
}

it('executes the advertised ordered input example without hidden envelope fields', async () => {
  const { workflow, compile, execute } = setup()
  const definition = workflow.definitions[0]
  const marker = 'Ordered input example: '
  expect(definition.description).toContain(marker)
  const example = JSON.parse(definition.description.split(marker)[1])
  expect(operationInputIssue(example, definition.inputSchema)).toBeUndefined()
  expect(
    operationInputIssue(example, nativeToolInputSchema(definition.inputSchema))
  ).toBeUndefined()
  const result = JSON.parse(
    await workflow.call(definition.name, example, new AbortController().signal)
  )
  expect(result.status).toBe('complete')
  expect(result.parts.map((part: { key: string }) => part.key)).toEqual([
    'body',
    'detail'
  ])
  expect(compile).toHaveBeenCalledTimes(2)
  expect(execute).toHaveBeenCalledTimes(2)
  expect(execute.mock.calls[1][0].actions[0].arguments).toMatchObject({
    parentId: 'root'
  })
})

it('composes compact rejected-draft repair through preparation before one canonical dispatch', async () => {
  const { workflow, execute } = setup()
  const source = {
    ...draft,
    children: [draft.children[0], { ...draft.children[0] }]
  }
  const signal = new AbortController().signal
  const rejected = JSON.parse(
    await workflow.call('prepare_and_apply_design', { draft: source }, signal)
  )
  expect(rejected.failedStep).toBe('prepare_design')
  expect(execute).not.toHaveBeenCalled()
  const request = {
    repair: {
      draftId: rejected.draftId,
      replacements: [{ path: '/children/1/key', value: 'second-face' }]
    }
  }
  const repaired = JSON.parse(
    await workflow.call('prepare_and_apply_design', request, signal)
  )
  expect(repaired.failedStep).toBeUndefined()
  expect(execute).toHaveBeenCalledOnce()
  expect(repaired.completedSteps).toContain('prepare_design')
})

it('keeps combined preparation and canvas application behind independent work', async () => {
  const { workflow, execute } = setup()
  const controller = new AbortController()
  const schedule = createLocalToolScheduler(controller.signal)
  let signalEntered!: () => void
  const entered = new Promise<void>((resolve) => {
    signalEntered = resolve
  })
  let resume!: () => void
  const release = new Promise<void>((resolve) => {
    resume = resolve
  })
  const read = schedule(LocalToolAccess.INDEPENDENT, async () => {
    signalEntered()
    await release
  })
  const combined = schedule(workflow.definitions[0].executionAccess, () =>
    workflow.call('prepare_and_apply_design', { draft }, controller.signal)
  )
  try {
    await entered
    await new Promise<void>((resolve) => setImmediate(resolve))
    expect(execute).not.toHaveBeenCalled()
  } finally {
    resume()
    await Promise.all([read, combined])
  }
  expect(execute).toHaveBeenCalledOnce()
})
const signal = () => new AbortController().signal

describe('ordered ready parts', () => {
  it('does not label a first-part rejection as acknowledged partial work', async () => {
    const { workflow, execute } = setup()
    const reply = await invokeLocalTool(
      workflow,
      workflow.definitions[0],
      {
        parts: [
          {
            key: 'bad',
            draft: {
              ...draft,
              children: [draft.children[0], draft.children[0]]
            }
          }
        ]
      },
      signal()
    )
    expect(JSON.parse(reply.text).toolOutcome.status).toBe('unavailable')
    expect(execute).not.toHaveBeenCalled()
  })
  it('reports partial progress inside the first part without replaying it', async () => {
    const { workflow, execute } = setup()
    execute.mockResolvedValue({
      context: {},
      actionResults: [
        {
          actionId: 'first',
          actionName: AiActionNames.APPLY_PREPARED_DESIGN,
          result: {
            status: 'partial',
            compositionId: 'retained',
            appliedElementIds: ['retained']
          }
        }
      ]
    })
    const result = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        {
          parts: [
            { key: 'first', draft },
            { key: 'next', draft }
          ]
        },
        signal()
      )
    )
    expect(result.status).toBe('partial')
    expect(result.parts[0].actionResults[0].result.compositionId).toBe(
      'retained'
    )
    expect(execute).toHaveBeenCalledOnce()
  })

  it('advertises one shared draft contract and admits the same native sequence inputs', () => {
    const { workflow } = setup()
    const schema = workflow.definitions[0].inputSchema
    const native = nativeToolInputSchema(schema)
    for (const input of [
      { draft },
      { parts: [{ key: 'first', draft }] },
      { parts: [{ key: 'first', draft }], draft },
      { parts: [] },
      { parts: [{ key: 'first', draft: { ...draft, unknown: true } }] },
      { parts: [{ key: 'first', callback: '() => draw()' }] }
    ])
      expect(Boolean(operationInputIssue(input, native))).toBe(
        Boolean(operationInputIssue(input, schema))
      )
    expect(
      operationInputIssue({ parts: [{ key: 'first', draft }] }, schema)
    ).toBeUndefined()
  })

  it('preserves partial canonical failure and current parent admission without replay', async () => {
    const { workflow, compile, execute } = setup()
    execute.mockResolvedValueOnce({
      context: {},
      actionResults: [
        {
          actionId: 'first',
          actionName: AiActionNames.APPLY_PREPARED_DESIGN,
          result: { status: 'complete', compositionId: 'actual-parent' }
        }
      ]
    })
    execute.mockImplementationOnce(async (batch) => {
      expect(batch.actions[0].arguments).toMatchObject({
        parentId: 'actual-parent'
      })
      return {
        context: {},
        actionResults: [
          {
            actionId: 'second',
            actionName: AiActionNames.APPLY_PREPARED_DESIGN,
            result: {
              status: 'failed',
              reason: 'Parent was locked by a concurrent edit'
            }
          }
        ]
      }
    })
    const result = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        {
          parts: [
            { key: 'first', draft },
            { key: 'second', parentPart: 'first', draft },
            { key: 'third', draft }
          ]
        },
        signal()
      )
    )
    expect(result).toMatchObject({
      status: 'partial',
      failedPart: 'second',
      remainingParts: ['third']
    })
    expect(result.parts[0].actionResults[0].result.compositionId).toBe(
      'actual-parent'
    )
    expect(result.parts[1].actionResults[0].result.reason).toContain('locked')
    expect(execute).toHaveBeenCalledTimes(2)
    expect(compile).toHaveBeenCalledTimes(2)
  })

  it('applies each part before compiling its successor and links actual returned parent IDs', async () => {
    const { workflow, compile, execute } = setup()
    const order: string[] = []
    compile.mockImplementation((...args) => {
      order.push('prepare')
      return prepareDesign(...args)
    })
    execute.mockImplementation(async (batch) => {
      order.push('apply')
      const part = order.length / 2
      if (part === 2)
        expect(batch.actions[0].arguments).toMatchObject({
          parentId: 'actual-first'
        })
      return {
        context: {},
        actionResults: [
          {
            actionId: 'a',
            actionName: AiActionNames.APPLY_PREPARED_DESIGN,
            result: {
              status: 'complete',
              compositionId: part === 1 ? 'actual-first' : 'actual-second'
            }
          }
        ]
      }
    })
    const result = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        {
          parts: [
            { key: 'base', draft },
            { key: 'detail', parentPart: 'base', draft }
          ],
          inspection: 'defer'
        },
        signal()
      )
    )
    expect(order).toEqual(['prepare', 'apply', 'prepare', 'apply'])
    expect(result.status).toBe('complete')
    expect(result.parts.map((part: { key: string }) => part.key)).toEqual([
      'base',
      'detail'
    ])
    expect(result.parts[0].actionResults[0].result.compositionId).toBe(
      'actual-first'
    )
  })

  it('retains successful receipts when later valid-shape geometry is rejected, without applying successors', async () => {
    const { workflow, execute, compile } = setup()
    const result = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        {
          parts: [
            { key: 'first', draft },
            {
              key: 'bad',
              draft: {
                ...draft,
                children: [draft.children[0], draft.children[0]]
              }
            },
            { key: 'later', draft }
          ]
        },
        signal()
      )
    )
    expect(execute).toHaveBeenCalledOnce()
    expect(compile).toHaveBeenCalledTimes(2)
    expect(result).toMatchObject({
      status: 'partial',
      failedPart: 'bad',
      remainingParts: ['later']
    })
    expect(result.parts[0].actionResults[0].result.compositionId).toBe('root')
    expect(result.parts[1].failedStep).toBe('prepare_design')
  })

  it.each([
    [
      { key: 'first', parentPart: 'later', draft },
      { key: 'later', draft }
    ],
    [
      { key: 'same', draft },
      { key: 'same', draft }
    ],
    [
      { key: 'first', draft },
      { key: 'next', parentPart: 'first', parentId: 'existing', draft }
    ]
  ])(
    'rejects invalid sequence references before preparation or writes',
    async (...parts) => {
      const { workflow, compile, execute } = setup()
      await expect(
        workflow.call('prepare_and_apply_design', { parts }, signal())
      ).rejects.toThrow()
      expect(compile).not.toHaveBeenCalled()
      expect(execute).not.toHaveBeenCalled()
    }
  )

  it('stops before another preparation when cancellation follows an acknowledged apply', async () => {
    const { workflow, compile, execute } = setup()
    const controller = new AbortController()
    execute.mockImplementation(async () => {
      controller.abort()
      return { context: {}, actionResults: [] }
    })
    await expect(
      workflow.call(
        'prepare_and_apply_design',
        {
          parts: [
            { key: 'first', draft },
            { key: 'second', draft }
          ]
        },
        controller.signal
      )
    ).rejects.toThrow()
    expect(compile).toHaveBeenCalledOnce()
    expect(execute).toHaveBeenCalledOnce()
  })
})

describe('combined design preparation and application', () => {
  it('prepares once and applies once while returning compact actionable evidence', async () => {
    const { workflow, compile, execute } = setup()
    const result = JSON.parse(
      await workflow.call('prepare_and_apply_design', { draft }, signal())
    )
    expect(compile).toHaveBeenCalledTimes(1)
    expect(execute).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      available: true,
      elementCount: 2,
      actionResults: [
        {
          result: {
            compositionId: 'root',
            status: 'complete',
            appliedElementCount: 2
          }
        }
      ]
    })
    expect(result).not.toHaveProperty('context')
    expect(JSON.stringify(result)).not.toMatch(
      /keyToId|roleToElementIds|appliedElementIds/
    )
    expect(execute.mock.calls[0][0].actions[0].arguments).toHaveProperty(
      'design'
    )
    expect(execute.mock.calls[0][0].actions[0].arguments).toMatchObject({
      response: 'compact'
    })
  })
  it('compiles and dispatches a large compact pattern stage with one tool round trip', async () => {
    const { workflow, compile, execute } = setup()
    const result = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        {
          draft: {
            type: 'group',
            name: 'Facade',
            projection: {
              azimuth: 0,
              elevation: 0,
              scale: 1,
              originX: 0,
              originY: 20
            },
            children: [
              {
                type: 'pattern',
                key: 'panes',
                name: 'Panes',
                origin: { x: 0, y: 0, z: 0 },
                axes: [{ count: 1200, step: { x: 10, y: 0, z: 0 } }],
                faces: [
                  {
                    key: 'face',
                    name: 'Face',
                    vertices: [
                      { x: 0, y: 0, z: 0 },
                      { x: 8, y: 0, z: 0 },
                      { x: 8, y: 0, z: 8 },
                      { x: 0, y: 0, z: 8 }
                    ]
                  }
                ]
              }
            ]
          },
          inspection: 'defer'
        },
        signal()
      )
    )
    expect(result).toMatchObject({ available: true, elementCount: 1201 })
    expect(compile).toHaveBeenCalledTimes(1)
    expect(execute).toHaveBeenCalledTimes(1)
    expect(execute.mock.calls[0][0].actions).toHaveLength(1)
    expect(
      (
        execute.mock.calls[0][0].actions[0].arguments as {
          design: { entries: unknown[] }
        }
      ).design.entries
    ).toHaveLength(1201)
  })
  it('retains full receipts when code needs IDs, without re-preparing', async () => {
    const { workflow, compile } = setup()
    const result = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        { draft, response: 'full' },
        signal()
      )
    )
    expect(result).toMatchObject({
      context: { selection: ['root'] },
      actionResults: [{ result: { keyToId: { face: 'face' } } }]
    })
    expect(compile).toHaveBeenCalledTimes(1)
  })
  it('does not dispatch invalid drafts or malformed envelopes', async () => {
    const { workflow, execute } = setup()
    const result = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        {
          draft: { ...draft, children: [{ ...draft.children[0], width: -1 }] }
        },
        signal()
      )
    )
    expect(result.available).toBe(false)
    await expect(
      workflow.call(
        'prepare_and_apply_design',
        { draft, response: 'invented' },
        signal()
      )
    ).rejects.toThrow()
    expect(execute).not.toHaveBeenCalled()
  })
  it('does not apply preparation findings and forwards cancellation', async () => {
    const { workflow, execute } = setup()
    const result = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        { draft: { ...draft, type: 'frame', width: 10, height: 10 } },
        signal()
      )
    )
    expect(result.available).toBe(true)
    expect(result.applicable).toBe(false)
    expect(execute).not.toHaveBeenCalled()
    const controller = new AbortController()
    controller.abort()
    await expect(
      workflow.call('prepare_and_apply_design', { draft }, controller.signal)
    ).rejects.toThrow()
    expect(execute).not.toHaveBeenCalled()
  })
})

it('retains existing measurement and inspection when combined preparation applies', async () => {
  const registered = [
    ...actions,
    {
      name: AiActionNames.REVIEW_DESIGN,
      description: 'Measure',
      inputSchema: {}
    },
    {
      name: AiActionNames.INSPECT_DRAWING,
      description: 'Inspect',
      inputSchema: {}
    }
  ]
  const designs = createLocalDesignTools(registered)
  const calls: string[] = []
  const operations = createLocalOperationTools(
    registered,
    designs,
    async (batch) => {
      const action = batch.actions[0]
      calls.push(action.name)
      let result: AiBatchReceipt['actionResults'][number]['result'] = {
        compositionId: 'root',
        appliedElementIds: ['root']
      }
      if (action.name === AiActionNames.REVIEW_DESIGN)
        result = { complete: true, findings: [], measuredTextIds: [] }
      if (action.name === AiActionNames.INSPECT_DRAWING)
        result = {
          available: true,
          partial: false,
          image: { dataUrl: 'data:image/png;base64,AA==' }
        }
      return {
        context: {},
        actionResults: [
          { actionId: action.id, actionName: action.name, result }
        ]
      }
    }
  )
  const workflow = createLocalDesignWorkflow(designs, operations)
  const result = JSON.parse(
    await workflow.call('prepare_and_apply_design', { draft }, signal())
  )
  expect(calls).toEqual([
    AiActionNames.APPLY_PREPARED_DESIGN,
    AiActionNames.REVIEW_DESIGN,
    AiActionNames.INSPECT_DRAWING
  ])
  expect(result.actionResults[2].result).toMatchObject({
    available: true,
    inspectionId: expect.any(String),
    revision: 1
  })
  expect(result.actionResults[2].result.image.dataUrl).toBe(
    'data:image/png;base64,AA=='
  )
})

it('applies and reviews ready batches while later requirements and geometry remain pending', async () => {
  const registered = [
    ...actions,
    ...[
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} }))
  ]
  const designs = createLocalDesignTools(registered)
  const retained: string[] = []
  let revision = 0
  const execute = vi.fn(
    async (batch: AiActionBatch): Promise<AiBatchReceipt> => ({
      context: {},
      actionResults: batch.actions.map((action) => {
        let result: AiBatchReceipt['actionResults'][number]['result']
        if (action.name === AiActionNames.APPLY_PREPARED_DESIGN) {
          const prepared = (action.arguments as { design: { rootId: string } })
            .design
          retained.push(prepared.rootId)
          revision++
          result = {
            status: 'complete',
            compositionId: prepared.rootId,
            appliedElementIds: [prepared.rootId]
          }
        } else if (action.name === AiActionNames.INSPECT_DRAWING) {
          result = {
            available: true,
            imageScope: 'overview',
            evidence: { sessionId: 'stages', revision },
            image: { dataUrl: 'data:image/png;base64,AA==' }
          }
        } else {
          result = { current: true, coverage: { complete: true } }
        }
        return { actionId: action.id, actionName: action.name, result }
      })
    })
  )
  const operations = createLocalOperationTools(registered, designs, execute)
  const workflow = createLocalDesignWorkflow(designs, operations)
  const call = async (name: string, args: unknown) =>
    JSON.parse(await operations.call(name, args, signal()))
  await call('record_design_review', {
    phase: 'plan',
    method: 'Retain ready parts in shared coordinates',
    references: [],
    criteria: {
      first: {
        requirement: 'First part',
        description: 'Visible first part',
        verification: 'visual'
      },
      later: {
        requirement: 'Later part',
        description: 'Visible later part',
        verification: 'visual'
      }
    },
    structureCriteria: ['first', 'later'],
    detailRequired: false
  })
  const firstDraft = designPreparationExamples[1].draft
  const first = JSON.parse(
    await workflow.call(
      'prepare_and_apply_design',
      { draft: firstDraft },
      signal()
    )
  )
  expect(first.available).toBe(true)
  expect(retained).toHaveLength(1)
  const inspection = first.actionResults.find(
    (entry: { actionName: string }) =>
      entry.actionName === AiActionNames.INSPECT_DRAWING
  ).result.inspectionId
  expect(
    await call('record_design_review', {
      phase: 'visual',
      final: false,
      inspectionIds: [inspection],
      checks: [
        {
          criterionId: 'first',
          status: 'pass',
          evidence: 'The retained first part is visible.'
        }
      ]
    })
  ).toMatchObject({ accepted: false, final: false })
  expect(operations.getStructureIssue()).toBeTruthy()
  // Only now is the next batch prepared; the first batch has already been delivered and reviewed.
  const second = JSON.parse(
    await workflow.call(
      'prepare_and_apply_design',
      {
        draft: {
          ...firstDraft,
          name: 'Next ready part',
          projection: { ...firstDraft.projection, originX: 300 }
        }
      },
      signal()
    )
  )
  expect(second.available).toBe(true)
  expect(retained).toHaveLength(2)
  expect(new Set(retained).size).toBe(2)
  expect(
    operations.settleOutcome({
      batchId: 'outcome',
      actions: [
        {
          id: 'report',
          name: AiActionNames.REPORT_OUTCOME,
          summary: 'Report',
          arguments: { outcome: 'completed', message: 'Done' }
        }
      ]
    }).actions[0].arguments
  ).not.toMatchObject({ outcome: 'completed' })
})

it('passes only the known parent identity when extending a prepared part', async () => {
  const { workflow, execute } = setup()
  const result = JSON.parse(
    await workflow.call(
      'prepare_and_apply_design',
      { draft, parentId: 'existing', inspection: 'defer' },
      signal()
    )
  )
  expect(execute.mock.calls[0][0].actions[0].arguments).toMatchObject({
    parentId: 'existing',
    response: 'compact'
  })
  expect(result.actionResults[0].result.compositionId).toBe('root')
  expect(result).not.toHaveProperty('context')
})

const reviewedWorkflow = () => {
  const allActions = [
    ...actions,
    {
      name: AiActionNames.INSPECT_DRAWING,
      description: 'Inspect',
      inputSchema: {}
    }
  ]
  const designs = createLocalDesignTools(allActions)
  const execute = vi.fn(async () => ({ context: {}, actionResults: [] }))
  const operations = createLocalOperationTools(allActions, designs, execute)
  const workflow = createLocalDesignWorkflow(designs, operations)
  return { workflow, operations, execute }
}
it('accepts first-write criteria through the advertised combined tool and real review owner', async () => {
  const { workflow, execute } = reviewedWorkflow()
  const result = await invokeLocalTool(
    workflow,
    workflow.definitions[0],
    { draft, plan: reviewPlanExample, inspection: 'defer' },
    signal()
  )
  expect(result.success, result.text).toBe(true)
  expect(execute).toHaveBeenCalledOnce()
  // A second submission cannot invent a retrospective acceptance plan.
  const late = await invokeLocalTool(
    workflow,
    workflow.definitions[0],
    { draft, plan: reviewPlanExample },
    signal()
  )
  expect(late.success).toBe(false)
  expect(execute).toHaveBeenCalledOnce()
})
it('does not apply invalid criteria and permits the corrected combined request', async () => {
  const { workflow, execute } = reviewedWorkflow()
  const { verification: _verification, ...appearance } =
    reviewPlanExample.criteria.appearance
  const invalid = { ...reviewPlanExample, criteria: { appearance } }
  const rejected = await invokeLocalTool(
    workflow,
    workflow.definitions[0],
    { draft, plan: invalid },
    signal()
  )
  expect(rejected.success).toBe(false)
  expect(rejected.text).toContain('verification')
  expect(execute).not.toHaveBeenCalled()
  expect(
    (
      await invokeLocalTool(
        workflow,
        workflow.definitions[0],
        { draft, plan: reviewPlanExample, inspection: 'defer' },
        signal()
      )
    ).success
  ).toBe(true)
})
it('leaves review state untouched when draft preparation fails', async () => {
  const { workflow, operations, execute } = reviewedWorkflow()
  const invalid = await invokeLocalTool(
    workflow,
    workflow.definitions[0],
    {
      draft: {
        ...draft,
        sharedFills: {},
        children: [{ ...draft.children[0], fill: { shared: 'missing' } }]
      },
      plan: reviewPlanExample
    },
    signal()
  )
  expect(invalid.success).toBe(false)
  expect(execute).not.toHaveBeenCalled()
  const result = JSON.parse(
    await operations.call('record_design_review', reviewPlanExample, signal())
  )
  expect(result).toMatchObject({ recorded: true })
})

it('retains preparation and completed handoffs when application fails without replay', async () => {
  const designs = createLocalDesignTools(actions)
  const execute = vi.fn(async () => {
    throw new Error('Disconnected during application')
  })
  const operations = createLocalOperationTools(actions, designs, execute)
  const events: unknown[] = []
  const workflow = createLocalDesignWorkflow(designs, operations, {
    trace: (stage, evidence) => events.push({ stage, ...evidence })
  })
  const reply = await invokeLocalTool(
    workflow,
    workflow.definitions[0],
    { draft },
    signal()
  )
  const receipt = JSON.parse(reply.text)
  expect(reply.success).toBe(false)
  expect(receipt.artifactId).toEqual(expect.any(String))
  expect(receipt.completedSteps).toEqual(['prepare_design'])
  expect(receipt.failedStep).toBe('apply_prepared_design')
  expect(execute).toHaveBeenCalledTimes(1)
  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        stage: 'action_started',
        tool: 'prepare_design'
      }),
      expect.objectContaining({
        stage: 'action_completed',
        tool: 'prepare_design'
      }),
      expect.objectContaining({
        stage: 'action_failed',
        tool: 'apply_prepared_design'
      })
    ])
  )
})

it('preserves acknowledged writes if a later application handoff fails', async () => {
  const designs = createLocalDesignTools(actions)
  const execute = vi.fn(async () => {
    throw new Error('Inspection transport lost')
  })
  const operations = createLocalOperationTools(actions, designs, execute)
  const acknowledged = {
    batches: [
      {
        actionResults: [
          {
            actionName: 'apply_prepared_design',
            result: { compositionId: 'already-created' }
          }
        ]
      }
    ]
  }
  const workflow = createLocalDesignWorkflow(
    designs,
    operations,
    {},
    () => acknowledged
  )
  const reply = await invokeLocalTool(
    workflow,
    workflow.definitions[0],
    { draft },
    signal()
  )
  expect(JSON.parse(reply.text)).toMatchObject({
    artifactId: expect.any(String),
    executionResult: acknowledged,
    failedStep: 'apply_prepared_design',
    settlement: 'unknown',
    toolOutcome: { status: 'partial' }
  })
  expect(execute).toHaveBeenCalledOnce()
})

it('draws a ready part without plan generation and records initial criteria afterward', async () => {
  const { workflow, operations, execute } = reviewedWorkflow()
  const first = await invokeLocalTool(
    workflow,
    workflow.definitions[0],
    { draft, inspection: 'defer' },
    signal()
  )
  expect(first.success, first.text).toBe(true)
  expect(execute).toHaveBeenCalledOnce()
  const planned = JSON.parse(
    await operations.call(
      AiDesignToolIds.RECORD_DESIGN_REVIEW,
      reviewPlanExample,
      signal()
    )
  )
  expect(planned.recorded).toBe(true)
})

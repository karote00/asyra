import briefFixture from './fixtures/recorded-101/brief-capacity-20261024.json'
import { projectWorkflowInput } from '../design-workflow-discovery'
import { informationDeliveryExample } from '../local-information-delivery'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createAiExecutionProfiler } from '@asyra/ai-agent-runtime'
import { createExecutionRecordSink } from '@asyra/ai-agent-runtime/node'
import sharp from 'sharp'
import compactFixture from './fixtures/recorded-101/compact-receipt-20261024.json'
import { runInNewContext } from 'node:vm'
import {
  localToolContent,
  localToolResultExample,
  localToolResultRecoveryExample,
  type NativeToolDescriptor
} from '../local-operation-tools'
import capacityFixture from './fixtures/recorded-101/pattern-budget-recovery-20261023.json'
import { AiDesignToolIds } from '../../src/constants/ai-design'
import { reviewPlanExample } from '../local-design-review'
import { invokeLocalTool, localToolOutcome } from '../local-tool-invocation'
import { requireBatchSuccess } from '../batch-exchange'
import {
  nativeToolInputSchema,
  operationInputIssue
} from '../operation-input-schema'
import { designPreparationExamples } from '../design-preparation-examples'
import { describe, expect, it, vi } from 'vitest'
import { createLocalDesignWorkflow as createOwner } from '../local-design-workflow'
import { withToolContractAssertions } from './tool-contract-assertions'
const createLocalDesignWorkflow = (...args: Parameters<typeof createOwner>) =>
  withToolContractAssertions(createOwner(...args))
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalOperationTools } from '../local-operation-tools'
import {
  createLocalToolScheduler,
  LocalToolAccess
} from '../local-tool-scheduler'
import {
  createDesignPreparationSession,
  prepareDesign,
  prepareDesignAsync
} from '../design-preparation'
import { AiActionNames } from '../../src/constants/ai-actions'
import type {
  AiBatchReceipt,
  AiActionDescription,
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
const setup = (registered: AiActionDescription[] = actions) => {
  const compile = vi.fn(prepareDesignAsync)
  const designs = createLocalDesignTools(
    registered,
    createDesignPreparationSession(prepareDesign, compile)
  )
  const execute = vi.fn(
    async (batch: AiActionBatch): Promise<AiBatchReceipt> => ({
      context: { selection: ['root'] },
      actionResults: [
        {
          actionId: batch.actions[0].id,
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
  const operations = createLocalOperationTools(registered, designs, execute)
  return {
    designs,
    operations,
    workflow: createLocalDesignWorkflow(designs, operations),
    compile,
    execute
  }
}

it('does not admit a stopped receipt as a successful compound result', () => {
  const { workflow } = setup()
  expect(
    operationInputIssue(
      {
        failedStep: 'prepare_design',
        completedSteps: [],
        artifactId: 'repair'
      },
      workflow.definitions[0].outputSchema
    )
  ).toBeDefined()
})

it('preserves unknown application settlement across an ordered part boundary without replay', async () => {
  const { workflow, execute } = setup()
  execute.mockImplementationOnce(async (batch) => ({
    context: {},
    actionResults: [
      {
        actionId: batch.actions[0].id,
        actionName: AiActionNames.APPLY_PREPARED_DESIGN,
        result: { status: 'complete', compositionId: 'first-root' }
      }
    ]
  }))
  execute.mockRejectedValueOnce(new Error('Application acknowledgement lost'))
  const reply = await invokeLocalTool(
    workflow,
    workflow.definitions[0],
    {
      parts: [
        { key: 'first', draft },
        { key: 'second', draft },
        { key: 'third', draft }
      ]
    },
    new AbortController().signal
  )
  expect(JSON.parse(reply.text)).toMatchObject({
    status: 'partial',
    failedPart: 'second',
    remainingParts: ['third'],
    toolOutcome: { status: 'partial', settlement: 'unknown' }
  })
  expect(execute).toHaveBeenCalledTimes(2)
})

it('executes the advertised ordered input example without hidden envelope fields', async () => {
  const { workflow, compile, execute } = setup()
  const definition = workflow.definitions[0]
  expect(definition.description).not.toContain('Ordered input example: ')
  const example = definition.inputSchema.examples.find(
    (entry) => 'parts' in entry
  )
  expect(example).toBeDefined()
  expect(operationInputIssue(example, definition.inputSchema)).toBeUndefined()
  expect(
    operationInputIssue(example, nativeToolInputSchema(definition.inputSchema))
  ).toBeUndefined()
  const result = JSON.parse(
    await workflow.call(definition.name, example, new AbortController().signal)
  )
  expect(result.status).toBe('partial')
  expect(result.measurementIssues).toHaveLength(1)
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
    expect(JSON.parse(reply.text).toolOutcome.status).toBe('failed')
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
    execute.mockImplementationOnce(async (batch) => ({
      context: {},
      actionResults: [
        {
          actionId: batch.actions[0].id,
          actionName: AiActionNames.APPLY_PREPARED_DESIGN,
          result: { status: 'complete', compositionId: 'actual-parent' }
        }
      ]
    }))
    execute.mockImplementationOnce(async (batch) => {
      expect(batch.actions[0].arguments).toMatchObject({
        parentId: 'actual-parent'
      })
      return {
        context: {},
        actionResults: [
          {
            actionId: batch.actions[0].id,
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
      return prepareDesignAsync(...args)
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
            actionId: batch.actions[0].id,
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
    expect(result.status).toBe('partial')
    expect(result.measurementIssues).toHaveLength(1)
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
  it('admits a many-face motif through native and public invocation without dropping source faces', async () => {
    const { workflow, execute } = setup()
    const definition = workflow.definitions[0]
    const input = {
      draft: {
        type: 'group',
        name: 'Facade',
        projection: {
          azimuth: 0,
          elevation: 0,
          scale: 1,
          originX: 0,
          originY: 100
        },
        children: [
          {
            type: 'pattern',
            key: 'panes',
            name: 'Panes',
            origin: { x: 0, y: 0, z: 0 },
            axes: [{ count: 8, step: { x: 10, y: 0, z: 0 } }],
            faces: Array.from({ length: 1011 }, (_, i) => ({
              key: `face-${i}`,
              name: `Face ${i}`,
              fill: '#123456',
              vertices: [
                { x: 0, y: 0, z: 0 },
                { x: 8, y: 0, z: 0 },
                { x: 8, y: 0, z: 8 },
                { x: 0, y: 0, z: 8 }
              ]
            }))
          }
        ]
      },
      inspection: 'defer'
    }
    expect(
      operationInputIssue(input, nativeToolInputSchema(definition.inputSchema))
    ).toBeUndefined()
    const result = await invokeLocalTool(workflow, definition, input, signal())
    expect(result.success).toBe(false)
    expect(JSON.parse(result.text).toolOutcome).toMatchObject({
      status: 'partial',
      settlement: 'completed'
    })
    expect(execute).toHaveBeenCalledTimes(1)
    const entries = (
      execute.mock.calls[0][0].actions[0].arguments as {
        design: { entries: { key: string }[] }
      }
    ).design.entries
    expect(entries).toHaveLength(8089)
    expect(entries[1].key).toBe('panes-0-face-0')
    expect(entries[1011].key).toBe('panes-0-face-1010')
    expect(entries[8088].key).toBe('panes-7-face-1010')
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
        result = {
          complete: true,
          findings: [],
          measuredTextIds: [],
          evidence: { sessionId: 'combined', revision: 1 }
        }
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
    await workflow.call(
      'prepare_and_apply_design',
      { draft, response: 'full' },
      signal()
    )
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
      AiActionNames.REVIEW_DESIGN,
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
        } else if (action.name === AiActionNames.REVIEW_DESIGN) {
          result = {
            complete: true,
            findings: [],
            evidence: { sessionId: 'stages', revision }
          }
        } else if (action.name === AiActionNames.INSPECT_DRAWING) {
          result = {
            available: true,
            imageScope: 'overview',
            evidence: { sessionId: 'stages', revision },
            image: { dataUrl: 'data:image/png;base64,AA==' }
          }
        } else {
          result = {
            current: true,
            validatedAt: { sessionId: 'consumer-validation', revision: 1 },
            coverage: { complete: true }
          }
        }
        return { actionId: action.id, actionName: action.name, result }
      })
    })
  )
  const operations = createLocalOperationTools(registered, designs, execute)
  const workflow = createLocalDesignWorkflow(designs, operations)
  const call = async (name: string, args: unknown) =>
    JSON.parse(await operations.call(name, args, signal()))
  await call('define_design_criteria', {
    phase: 'plan',
    method: 'Retain ready parts in shared coordinates',
    references: [],
    criteria: {
      first: {
        requirement: 'First part',
        description: 'Visible first part',
        verification: 'visual',
        requiredUnits: []
      },
      later: {
        requirement: 'Later part',
        description: 'Visible later part',
        verification: 'visual',
        requiredUnits: []
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
  const bound = await call('review_drawing', {
    phase: 'visual',
    bindChecks: [{ criterionId: 'first', inspectionIds: [inspection] }]
  })
  expect(
    await call('review_drawing', {
      ...bound.next.arguments,
      checks: bound.next.arguments.checks.map(
        (check: Record<string, unknown>) => ({
          ...check,
          status: 'pass',
          evidence: 'The retained first part is visible.'
        })
      )
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
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result: { status: 'complete', compositionId: 'retained-composition' }
    }))
  }))
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
  expect(result.success, result.text).toBe(false)
  expect(JSON.parse(result.text).toolOutcome).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(execute).toHaveBeenCalledOnce()
  // A second submission cannot invent a retrospective acceptance plan.
  const late = await invokeLocalTool(
    workflow,
    workflow.definitions[0],
    {
      draft,
      plan: { ...reviewPlanExample, method: 'A changed retrospective plan' }
    },
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
  const corrected = await invokeLocalTool(
    workflow,
    workflow.definitions[0],
    { draft, plan: reviewPlanExample, inspection: 'defer' },
    signal()
  )
  expect(JSON.parse(corrected.text)).toMatchObject({
    toolOutcome: { status: 'partial', settlement: 'completed' },
    actionResults: [{ result: { status: 'complete' } }]
  })
  expect(execute).toHaveBeenCalledOnce()
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
    await operations.call('define_design_criteria', reviewPlanExample, signal())
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
  expect(first.success, first.text).toBe(false)
  expect(JSON.parse(first.text).toolOutcome).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(execute).toHaveBeenCalledOnce()
  const planned = JSON.parse(
    await operations.call(
      AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
      reviewPlanExample,
      signal()
    )
  )
  expect(planned.recorded).toBe(true)
})

it('repairs a rejected public part and consumes its retained source without resending geometry', async () => {
  const { workflow, execute, compile } = setup()
  const definition = workflow.definitions[0]
  const rejected = await invokeLocalTool(
    workflow,
    definition,
    {
      parts: [
        {
          key: 'base',
          draft: {
            ...draft,
            children: [{ ...draft.children[0], width: 'invalid' }]
          }
        }
      ]
    },
    signal()
  )
  expect(rejected.success).toBe(false)
  expect(execute).not.toHaveBeenCalled()
  expect(compile).not.toHaveBeenCalled()
  const receipt = JSON.parse(rejected.text)
  expect(receipt.rejectedParts).toHaveLength(1)
  expect(receipt.rejectedParts[0]).toMatchObject({
    index: 0,
    key: 'base',
    draftId: expect.any(String)
  })
  const repaired = await invokeLocalTool(
    workflow,
    definition,
    {
      parts: [
        {
          key: 'base',
          repair: {
            draftId: receipt.rejectedParts[0].draftId,
            replacements: [{ path: '/children/0/width', value: 40 }]
          }
        }
      ]
    },
    signal()
  )
  expect(repaired.success, repaired.text).toBe(false)
  expect(JSON.parse(repaired.text).toolOutcome).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(compile).toHaveBeenCalledOnce()
  expect(execute).toHaveBeenCalledOnce()
  expect(
    JSON.parse(repaired.text).parts[0].actionResults[0].result.compositionId
  ).toBe('root')
})

it('recovers only the failed public part after an acknowledged earlier mutation', async () => {
  const { workflow, execute, compile } = setup()
  const definition = workflow.definitions[0]
  const response = await invokeLocalTool(
    workflow,
    definition,
    {
      parts: [
        { key: 'base', draft },
        {
          key: 'detail',
          parentPart: 'base',
          draft: { ...draft, children: [draft.children[0], draft.children[0]] }
        },
        { key: 'later', draft }
      ]
    },
    signal()
  )
  const receipt = JSON.parse(response.text)
  expect(response.success).toBe(false)
  expect(receipt).toMatchObject({
    status: 'partial',
    failedPart: 'detail',
    remainingParts: ['later'],
    toolOutcome: { status: 'partial' }
  })
  expect(execute).toHaveBeenCalledOnce()
  expect(compile).toHaveBeenCalledTimes(2)
  const repaired = await invokeLocalTool(
    workflow,
    definition,
    {
      parts: [
        {
          key: 'detail',
          parentId: receipt.parts[0].actionResults[0].result.compositionId,
          repair: {
            draftId: receipt.parts[1].draftId,
            replacements: [{ path: '/children/1/key', value: 'second-face' }]
          }
        }
      ]
    },
    signal()
  )
  expect(repaired.success, repaired.text).toBe(false)
  expect(JSON.parse(repaired.text).toolOutcome).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(execute).toHaveBeenCalledTimes(2)
  expect(compile).toHaveBeenCalledTimes(3)
  expect(execute.mock.calls[1][0].actions[0].arguments).toMatchObject({
    parentId: 'root'
  })
})

// Exercise the real preparation, operation and workflow owners together.
const inspectionBoundaryFixture = (
  options: {
    failCheck?: string
    incompleteCheck?: string
    missingCheckEvidence?: boolean
    finding?: string
    stopApply?: number
    cancelCheck?: AbortController
    canReview?: boolean
    unknownApply?: number
    uncertainApply?: number
    lostApply?: number
    captureUnavailable?: boolean
    repeatedTarget?: boolean
    browserFailure?: 'partial' | 'unknown'
    browserFailureAt?: number
    observeReceipts?: boolean
    staleImage?: boolean
    unavailableValidation?: boolean
    cancelBinding?: AbortController
  } = {}
) => {
  const registered = [
    ...actions,
    ...[
      ...(options.canReview === false ? [] : [AiActionNames.REVIEW_DESIGN]),
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
      AiActionNames.INSPECT_DRAWING
    ].map((name) => ({ name, description: name, inputSchema: {} }))
  ]
  const designs = createLocalDesignTools(registered)
  const events: string[] = []
  const observedBatches: AiBatchReceipt[] = []
  const publishReceipt = (...args: Parameters<typeof requireBatchSuccess>) => {
    observedBatches.push(args[1])
    return requireBatchSuccess(...args)
  }
  let applied = 0
  let advertised: NativeToolDescriptor[] = []
  const operations = createLocalOperationTools(
    registered,
    designs,
    async (batch) => {
      const receipt: {
        context: AiBatchReceipt['context']
        actionResults: AiBatchReceipt['actionResults'][number][]
        failure?: AiBatchReceipt['failure']
      } = { context: {}, actionResults: [] }
      for (const action of batch.actions) {
        options.cancelCheck?.signal.throwIfAborted()
        const target = String(
          (action.arguments as { elementId?: string }).elementId
        )
        events.push(action.name + ':' + target)
        let result: AiBatchReceipt['actionResults'][number]['result']
        if (action.name === AiActionNames.APPLY_PREPARED_DESIGN) {
          applied++
          if (options.lostApply === applied)
            throw new Error('Application acknowledgement lost')
          if (options.uncertainApply === applied)
            result = {
              status: 'partial',
              settlement: 'unknown',
              compositionId: 'part-' + applied
            }
          else if (options.unknownApply === applied)
            result = { status: 'unknown', compositionId: 'part-' + applied }
          else if (options.stopApply === applied)
            result = {
              status: 'partial',
              compositionId: 'part-' + applied,
              appliedElementIds: ['part-' + applied],
              complete: false
            }
          else
            result = {
              status: 'complete',
              compositionId: 'part-' + (options.repeatedTarget ? 1 : applied),
              appliedElementIds: [
                'part-' + (options.repeatedTarget ? 1 : applied)
              ]
            }
        } else if (action.name === AiActionNames.REVIEW_DESIGN) {
          if (options.failCheck === target) {
            receipt.failure = {
              code: 'CHECK_FAILED',
              message: 'Measurement transport failed',
              stage: 'execution',
              actionName: action.name,
              actionId: action.id,
              actionExecutionMs: 1,
              settlement: 'partial',
              contextFresh: true
            }
            break
          }
          options.cancelCheck?.abort()
          result = {
            complete: options.incompleteCheck !== target,
            findings:
              options.finding === target
                ? [{ kind: 'container-overflow', elementId: target }]
                : [],
            ...(options.missingCheckEvidence
              ? {}
              : { evidence: { sessionId: 'stage1', revision: applied } }),
            measuredTextIds: []
          }
        } else if (action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE) {
          const imageValidation = Object.hasOwn(
            (action.arguments as { evidence: object }).evidence,
            'receiptId'
          )
          if (imageValidation) options.cancelBinding?.abort()
          result = {
            current:
              options.unavailableValidation && imageValidation
                ? null
                : !(options.staleImage && imageValidation),
            validatedAt: { sessionId: 'consumer-validation', revision: 1 },
            coverage: { complete: true }
          }
        } else {
          result = {
            available: !options.captureUnavailable,
            elementId: target,
            imageScope: 'overview',
            evidence: {
              sessionId: 'stage1',
              revision: applied,
              receiptId: 'capture-' + applied
            },
            image: {
              dataUrl:
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGioAAAAASUVORK5CYII=',
              width: 1,
              height: 1
            }
          }
        }
        if (action.name === AiActionNames.APPLY_PREPARED_DESIGN)
          Object.assign(result as object, {
            timing: {
              totalMs: 8,
              canonicalWork: { counters: { created: applied } }
            }
          })
        receipt.actionResults.push({
          actionId: action.id,
          actionName: action.name,
          result
        })
        if (
          action.name === AiActionNames.APPLY_PREPARED_DESIGN &&
          options.browserFailure &&
          applied === (options.browserFailureAt ?? 2)
        ) {
          receipt.failure = {
            code: 'ACTION_FAILED',
            message: 'A later action failed',
            stage: 'execution',
            actionName: action.name,
            actionId: action.id,
            actionExecutionMs: 1,
            settlement: options.browserFailure,
            contextFresh: true
          }
          break
        }
      }
      return publishReceipt(batch, receipt, 1)
    },
    { getNativeTools: () => advertised }
  )
  const workflow = createLocalDesignWorkflow(
    designs,
    operations,
    undefined,
    options.observeReceipts ? () => ({ batches: observedBatches }) : undefined
  )
  advertised = [
    ...workflow.definitions.map((tool) => ({
      ...tool,
      namespace: 'design_workflow'
    })),
    ...operations.definitions.map((tool) => ({
      ...tool,
      namespace: 'design_operations'
    }))
  ]
  return { workflow, operations, events }
}

it('checks a deferred standalone write before returning without capturing or rechecking on read', async () => {
  const { workflow, operations, events } = inspectionBoundaryFixture()
  const result = JSON.parse(
    await workflow.call(
      'prepare_and_apply_design',
      { draft, inspection: 'defer' },
      signal()
    )
  )
  expect(result.actionResults[0].result.compositionId).toBe('part-1')
  expect(result.inspectionDeferred).toBe(true)
  expect(
    events.filter((entry) =>
      entry.startsWith(AiActionNames.REVIEW_DESIGN + ':')
    )
  ).toEqual([AiActionNames.REVIEW_DESIGN + ':part-1'])
  expect(
    events.some((entry) =>
      entry.startsWith(AiActionNames.INSPECT_DRAWING + ':')
    )
  ).toBe(false)
  const checks = JSON.parse(
    await operations.call(
      'read_design_checks',
      {
        includePassed: true,
        ids: ['measurement:part-1', 'measurement:part-2']
      },
      signal()
    )
  )
  expect(checks.counts.pass).toBe(1)
  expect(
    events.filter((entry) =>
      entry.startsWith(AiActionNames.REVIEW_DESIGN + ':')
    )
  ).toHaveLength(1)
})

it.each(['defer', 'immediate'])(
  'checks every ordered part once after all writes with %s capture',
  async (inspection) => {
    const { workflow, events } = inspectionBoundaryFixture()
    const result = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        {
          parts: [
            { key: 'base', draft },
            { key: 'top', draft }
          ],
          inspection
        },
        signal()
      )
    )
    expect(result.status).toBe('complete')
    const work = events.filter(
      (entry) =>
        !entry.startsWith(AiActionNames.VALIDATE_INSPECTION_EVIDENCE + ':')
    )
    expect(work.slice(0, 4)).toEqual([
      AiActionNames.APPLY_PREPARED_DESIGN + ':undefined',
      AiActionNames.APPLY_PREPARED_DESIGN + ':undefined',
      AiActionNames.REVIEW_DESIGN + ':part-1',
      AiActionNames.REVIEW_DESIGN + ':part-2'
    ])
    expect(
      work.filter((entry) =>
        entry.startsWith(AiActionNames.INSPECT_DRAWING + ':')
      )
    ).toHaveLength(inspection === 'defer' ? 0 : 1)
  }
)

it('preserves writes and exposes failed checks without replaying or losing other part checks', async () => {
  const { workflow, operations, events } = inspectionBoundaryFixture({
    failCheck: 'part-1'
  })
  const result = JSON.parse(
    await workflow.call(
      'prepare_and_apply_design',
      {
        parts: [
          { key: 'a', draft },
          { key: 'b', draft }
        ],
        inspection: 'defer'
      },
      signal()
    )
  )
  expect(result.status).toBe('partial')
  expect(result.complete).toBe(false)
  expect(localToolOutcome(result)).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(result.parts).toHaveLength(2)
  expect(result.measurementIssues).toEqual([
    expect.objectContaining({
      elementId: 'part-1',
      message: 'Measurement transport failed'
    })
  ])
  expect(result.measurementDeferred).toBe(false)
  const checks = JSON.parse(
    await operations.call(
      'read_design_checks',
      {
        includePassed: true,
        ids: ['measurement:part-1', 'measurement:part-2']
      },
      signal()
    )
  )
  expect(checks.counts).toMatchObject({ pass: 1, unverified: 1 })
  expect(
    events.filter((entry) =>
      entry.startsWith(AiActionNames.APPLY_PREPARED_DESIGN + ':')
    )
  ).toHaveLength(2)
})

it('checks acknowledged partial parts and stops the suffix', async () => {
  const { workflow, events } = inspectionBoundaryFixture({ stopApply: 2 })
  const result = JSON.parse(
    await workflow.call(
      'prepare_and_apply_design',
      {
        parts: [
          { key: 'a', draft },
          { key: 'b', draft },
          { key: 'c', draft }
        ],
        inspection: 'defer'
      },
      signal()
    )
  )
  expect(result.status).toBe('partial')
  expect(result.remainingParts).toEqual(['c'])
  expect(
    events.filter((entry) =>
      entry.startsWith(AiActionNames.REVIEW_DESIGN + ':')
    )
  ).toEqual([
    AiActionNames.REVIEW_DESIGN + ':part-1',
    AiActionNames.REVIEW_DESIGN + ':part-2'
  ])
  expect(
    events.filter((entry) =>
      entry.startsWith(AiActionNames.APPLY_PREPARED_DESIGN + ':')
    )
  ).toHaveLength(2)
})

it('does not publish a late check or dispatch another check after cancellation', async () => {
  const controller = new AbortController()
  const { workflow, operations, events } = inspectionBoundaryFixture({
    cancelCheck: controller
  })
  await expect(
    workflow.call(
      'prepare_and_apply_design',
      {
        parts: [
          { key: 'a', draft },
          { key: 'b', draft }
        ],
        inspection: 'defer'
      },
      controller.signal
    )
  ).rejects.toThrow()
  const checks = JSON.parse(
    await operations.call(
      'read_design_checks',
      {
        includePassed: true,
        ids: ['measurement:part-1', 'measurement:part-2']
      },
      signal()
    )
  )
  expect(checks.counts.pass).toBe(0)
  expect(
    events.filter((entry) =>
      entry.startsWith(AiActionNames.REVIEW_DESIGN + ':')
    )
  ).toHaveLength(1)
})

it('retains known findings when a deferred mechanical check is incomplete', async () => {
  const { workflow, operations } = inspectionBoundaryFixture({
    incompleteCheck: 'part-1',
    finding: 'part-1'
  })
  const result = JSON.parse(
    await workflow.call(
      'prepare_and_apply_design',
      { draft, inspection: 'defer' },
      signal()
    )
  )
  expect(result.actionResults[0].result.status).toBe('complete')
  expect(result.measurementIssues).toHaveLength(1)
  const checks = JSON.parse(
    await operations.call(
      'read_design_checks',
      { includePassed: true, ids: ['measurement:part-1'] },
      signal()
    )
  )
  expect(checks.items[0]).toMatchObject({
    status: 'fail',
    evidence: expect.stringContaining('container-overflow')
  })
})

it('does not certify mechanical results after unknown write settlement', async () => {
  const { workflow, events } = inspectionBoundaryFixture({ unknownApply: 2 })
  const result = JSON.parse(
    await workflow.call(
      'prepare_and_apply_design',
      {
        parts: [
          { key: 'a', draft },
          { key: 'b', draft },
          { key: 'c', draft }
        ],
        inspection: 'defer'
      },
      signal()
    )
  )
  expect(result.status).toBe('unknown')
  expect(result.measurementIssues.length).toBeGreaterThan(0)
  expect(
    events.filter((entry) =>
      entry.startsWith(AiActionNames.REVIEW_DESIGN + ':')
    )
  ).toHaveLength(0)
  expect(
    events.filter((entry) =>
      entry.startsWith(AiActionNames.APPLY_PREPARED_DESIGN + ':')
    )
  ).toHaveLength(2)
})

it('preserves the acknowledged write when automatic capture is unavailable', async () => {
  const { workflow } = inspectionBoundaryFixture({ captureUnavailable: true })
  const result = JSON.parse(
    await workflow.call(
      'prepare_and_apply_design',
      {
        parts: [
          { key: 'a', draft },
          { key: 'b', draft }
        ]
      },
      signal()
    )
  )
  expect(result.status).toBe('partial')
  expect(result.complete).toBe(false)
  expect(localToolOutcome(result)).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(result.parts).toHaveLength(2)
  expect(result.inspectionIssues).toHaveLength(1)
  expect(result.failedPart).toBeUndefined()
})

it('coalesces repeated acknowledged targets without retaining deferred flags after block completion', async () => {
  const { workflow, events } = inspectionBoundaryFixture({
    repeatedTarget: true
  })
  const result = JSON.parse(
    await workflow.call(
      'prepare_and_apply_design',
      {
        parts: [
          { key: 'a', draft },
          { key: 'b', draft }
        ],
        inspection: 'defer'
      },
      signal()
    )
  )
  expect(
    result.parts.map(
      (part: { measurementDeferred: boolean }) => part.measurementDeferred
    )
  ).toEqual([false, false])
  expect(
    events.filter((entry) =>
      entry.startsWith(AiActionNames.REVIEW_DESIGN + ':')
    )
  ).toEqual([AiActionNames.REVIEW_DESIGN + ':part-1'])
})

it.each([
  { incompleteCheck: 'part-1' },
  { canReview: false },
  { missingCheckEvidence: true }
])(
  'reports unavailable mechanical checks without replay or a fabricated pass: %o',
  async (options) => {
    const { workflow, operations, events } = inspectionBoundaryFixture(options)
    const result = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        { draft, inspection: 'defer' },
        signal()
      )
    )
    expect(result.measurementIssues).toHaveLength(1)
    expect(result.actionResults[0].result.status).toBe('complete')
    const checks = JSON.parse(
      await operations.call(
        'read_design_checks',
        { includePassed: true, ids: ['measurement:part-1'] },
        signal()
      )
    )
    expect(checks.counts.pass).toBe(0)
    expect(checks.counts.unverified).toBe(1)
    expect(
      events.filter((entry) =>
        entry.startsWith(AiActionNames.APPLY_PREPARED_DESIGN + ':')
      )
    ).toHaveLength(1)
  }
)

it.each([false, true])(
  'does not check partial writes with unknown settlement at the ordered=%s boundary',
  async (ordered) => {
    const { workflow, operations, events } = inspectionBoundaryFixture({
      uncertainApply: ordered ? 2 : 1
    })
    const input = ordered
      ? {
          parts: [
            { key: 'a', draft },
            { key: 'b', draft },
            { key: 'c', draft }
          ]
        }
      : { draft }
    const result = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        { ...input, inspection: 'immediate' },
        signal()
      )
    )
    expect(result.measurementIssues).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('settlement is unknown')
      })
    ])
    expect(
      events.filter((entry) =>
        entry.startsWith(AiActionNames.REVIEW_DESIGN + ':')
      )
    ).toEqual([])
    expect(
      events.filter((entry) =>
        entry.startsWith(AiActionNames.INSPECT_DRAWING + ':')
      )
    ).toEqual([])
    if (ordered) expect(result.remainingParts).toEqual(['c'])
    const checks = JSON.parse(
      await operations.call(
        'read_design_checks',
        {
          includePassed: true,
          ids: ['measurement:part-1', 'measurement:part-2']
        },
        signal()
      )
    )
    expect(checks.counts.pass).toBe(0)
  }
)

it('does not check prior parts after a later application acknowledgement is lost', async () => {
  const { workflow, events } = inspectionBoundaryFixture({ lostApply: 2 })
  const result = JSON.parse(
    await workflow.call(
      'prepare_and_apply_design',
      {
        parts: [
          { key: 'a', draft },
          { key: 'b', draft },
          { key: 'c', draft }
        ]
      },
      signal()
    )
  )
  expect(result.settlement).toBe('unknown')
  expect(result.remainingParts).toEqual(['c'])
  expect(result.measurementIssues).toEqual([
    expect.objectContaining({
      message: expect.stringContaining('settlement is unknown')
    })
  ])
  expect(
    events.filter((entry) =>
      entry.startsWith(AiActionNames.REVIEW_DESIGN + ':')
    )
  ).toEqual([])
  expect(
    events.filter((entry) =>
      entry.startsWith(AiActionNames.INSPECT_DRAWING + ':')
    )
  ).toEqual([])
})

it.each([
  { incompleteCheck: 'part-1' },
  { failCheck: 'part-1' },
  { canReview: false }
])(
  'preserves acknowledged writes without automatic capture when checking is unresolved: %o',
  async (options) => {
    const { workflow, events } = inspectionBoundaryFixture(options)
    const result = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        {
          draft,
          inspection: 'immediate'
        },
        signal()
      )
    )
    expect(result.actionResults[0].result.status).toBe('complete')
    expect(result.measurementIssues).toHaveLength(1)
    expect(
      events.filter((entry) =>
        entry.startsWith(AiActionNames.INSPECT_DRAWING + ':')
      )
    ).toEqual([])
  }
)

it('reuses a current failing check without treating omitted check output as a pass for capture', async () => {
  const { workflow, events } = inspectionBoundaryFixture({
    finding: 'part-1',
    repeatedTarget: true
  })
  await workflow.call(
    'prepare_and_apply_design',
    { draft, inspection: 'defer' },
    signal()
  )
  await workflow.call(
    'prepare_and_apply_design',
    { draft, inspection: 'immediate' },
    signal()
  )
  expect(
    events.filter((entry) =>
      entry.startsWith(AiActionNames.REVIEW_DESIGN + ':')
    )
  ).toHaveLength(1)
  expect(
    events.filter((entry) =>
      entry.startsWith(AiActionNames.INSPECT_DRAWING + ':')
    )
  ).toEqual([])
})

it.each([
  { ordered: false, failCheck: undefined },
  { ordered: true, failCheck: undefined },
  { ordered: false, failCheck: 'part-1' },
  { ordered: true, failCheck: 'part-1' },
  { ordered: false, failCheck: 'part-1', observeReceipts: true },
  { ordered: true, failCheck: 'part-1', observeReceipts: true }
])(
  'preserves browser failure receipts and checks only settled acknowledged targets with ordered=$ordered, check failure=$failCheck and observer=$observeReceipts',
  async ({ ordered, failCheck, observeReceipts }) => {
    for (const settlement of ['partial', 'unknown'] as const) {
      const { workflow, events } = inspectionBoundaryFixture({
        browserFailure: settlement,
        failCheck,
        observeReceipts,
        browserFailureAt: ordered ? 2 : 1
      })
      const reply = await invokeLocalTool(
        workflow,
        workflow.definitions[0],
        {
          ...(ordered
            ? {
                parts: [
                  { key: 'a', draft },
                  { key: 'b', draft },
                  { key: 'c', draft }
                ]
              }
            : { draft }),
          inspection: 'defer'
        },
        signal()
      )
      expect(reply.success).toBe(false)
      const result = JSON.parse(reply.text)
      expect(result.toolOutcome.settlement).toBe(settlement)
      expect(reply.text).toContain('ACTION_FAILED')
      if (failCheck && settlement !== 'unknown')
        expect(reply.text).toContain('Measurement transport failed')
      expect(
        events.filter((event) =>
          event.startsWith(AiActionNames.APPLY_PREPARED_DESIGN + ':')
        )
      ).toHaveLength(ordered ? 2 : 1)
      expect(
        events.filter((event) =>
          event.startsWith(AiActionNames.REVIEW_DESIGN + ':')
        )
      ).toEqual(
        settlement === 'unknown'
          ? []
          : [
              AiActionNames.REVIEW_DESIGN + ':part-1',
              ...(ordered ? [AiActionNames.REVIEW_DESIGN + ':part-2'] : [])
            ]
      )
      expect(
        events.some((event) =>
          event.startsWith(AiActionNames.INSPECT_DRAWING + ':')
        )
      ).toBe(false)
    }
  }
)

it.each(['compact', 'full'] as const)(
  'delivers ordered automatic measurements only for explicit %s output',
  async (response) => {
    const { workflow, operations, events } = inspectionBoundaryFixture({
      finding: 'part-1'
    })
    const result = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        {
          parts: [
            { key: 'a', draft },
            { key: 'b', draft }
          ],
          inspection: 'defer',
          response
        },
        signal()
      )
    )
    expect(localToolOutcome(result).status).toBe('success')
    expect(result.parts).toHaveLength(2)
    expect(result.checks.counts).toMatchObject({ fail: 1, pass: 1 })
    expect(
      result.actionResults.filter(
        (entry: { actionName: string }) =>
          entry.actionName === AiActionNames.REVIEW_DESIGN
      )
    ).toHaveLength(response === 'full' ? 2 : 0)
    const checked = events.filter((event) =>
      event.startsWith(AiActionNames.REVIEW_DESIGN + ':')
    )
    expect(checked).toHaveLength(2)
    const retained = JSON.parse(
      await operations.call(
        'read_design_checks',
        { ids: ['measurement:part-1'] },
        signal()
      )
    )
    expect(JSON.parse(retained.items[0].evidence).findings).toHaveLength(1)
    expect(
      events.filter((event) =>
        event.startsWith(AiActionNames.REVIEW_DESIGN + ':')
      )
    ).toHaveLength(2)
  }
)

it('rejects a top-level material source for ordered parts instead of silently ignoring it', async () => {
  const { workflow, execute } = setup()
  await expect(
    workflow.call(
      'prepare_and_apply_design',
      {
        parts: [{ key: 'one', draft }],
        materialSourceId: 'source',
        inspection: 'defer'
      },
      new AbortController().signal
    )
  ).rejects.toThrow()
  expect(execute).not.toHaveBeenCalled()
})

it.each(['compact', 'full'] as const)(
  'keeps %s failed capture partial with completed writes and recovers only capture',
  async (response) => {
    const options = { captureUnavailable: true }
    const { workflow, operations, events } = inspectionBoundaryFixture(options)
    const reply = await invokeLocalTool(
      workflow,
      workflow.definitions[0],
      {
        parts: [
          { key: 'first', draft },
          { key: 'second', draft }
        ],
        response
      },
      signal()
    )
    const result = JSON.parse(reply.text)
    expect(reply.success).toBe(false)
    expect(result).toMatchObject({
      status: 'partial',
      complete: false,
      toolOutcome: { status: 'partial', settlement: 'completed' }
    })
    expect(result.parts).toHaveLength(2)
    expect(result.inspectionIssues).toHaveLength(1)
    options.captureUnavailable = false
    const recovered = JSON.parse(
      await operations.call(
        AiActionNames.INSPECT_DRAWING,
        { arguments: { elementId: 'part-2' } },
        signal()
      )
    )
    expect(localToolOutcome(recovered).status).toBe('success')
    expect(
      events.filter((event) =>
        event.startsWith(AiActionNames.APPLY_PREPARED_DESIGN + ':')
      )
    ).toHaveLength(2)
    expect(
      events.filter((event) =>
        event.startsWith(AiActionNames.INSPECT_DRAWING + ':')
      )
    ).toHaveLength(2)
  }
)

it.each([undefined, 'defer', 'immediate'] as const)(
  'preserves inspection policy across automatic capacity parts: %s',
  async (inspection) => {
    const { workflow, events } = inspectionBoundaryFixture({
      repeatedTarget: true
    })
    const result = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        {
          draft: capacityFixture.input.draft,
          ...(inspection === undefined ? {} : { inspection })
        },
        signal()
      )
    )
    expect(localToolOutcome(result)).toMatchObject({
      status: 'success',
      settlement: 'completed'
    })
    expect(result.parts).toHaveLength(2)
    expect(
      events.filter((name) =>
        name.startsWith(AiActionNames.APPLY_PREPARED_DESIGN + ':')
      )
    ).toHaveLength(2)
    expect(
      events.filter((name) =>
        name.startsWith(AiActionNames.INSPECT_DRAWING + ':')
      )
    ).toHaveLength(inspection === 'defer' ? 0 : 1)
  }
)

it('delivers the saved compact receipt without diagnostics or loss of any operation field', async () => {
  // Replay captured owner exchanges through the real workflow and invocation.
  // Artifact identity is provided by this saved boundary, not a live preparation session.
  const { designs, operations } = setup([
    ...actions,
    {
      name: AiActionNames.INSPECT_DRAWING,
      description: 'Inspect',
      inputSchema: {}
    }
  ])
  designs.call = vi.fn(async () => JSON.stringify(compactFixture.prepared))
  designs.resultIssue = () => undefined
  const appliedReceipt = structuredClone(compactFixture.applied)
  const imageResult = appliedReceipt.actionResults.find(
    (entry) => entry.actionName === AiActionNames.INSPECT_DRAWING
  )?.result.image
  if (!imageResult) throw new Error('Saved inspection metadata missing')
  const pixels = await sharp({
    create: {
      width: imageResult.width,
      height: imageResult.height,
      channels: 4,
      background: '#123456'
    }
  })
    .png()
    .toBuffer()
  imageResult.dataUrl = 'data:image/png;base64,' + pixels.toString('base64')
  operations.callInternal = vi.fn(async (name) =>
    JSON.stringify(
      name === 'define_design_criteria'
        ? compactFixture.criteria
        : appliedReceipt
    )
  )
  const observations: { stage: string; [key: string]: unknown }[] = []
  const workflow = createLocalDesignWorkflow(designs, operations, {
    trace: (stage, evidence) =>
      observations.push({ stage, ...structuredClone(evidence) })
  })
  const reply = await invokeLocalTool(
    workflow,
    workflow.definitions[0],
    compactFixture.input,
    signal()
  )
  expect(reply.success, reply.text).toBe(true)
  const expected = JSON.parse(JSON.stringify(compactFixture.delivered))
  delete expected.reuse
  delete expected.sourceWork
  delete expected.actionResults[0].result.timing
  const content = await localToolContent(reply.text)
  const delivered = content.find((item) => item.type === 'inputText')
  expect(delivered?.type).toBe('inputText')
  if (delivered?.type !== 'inputText') throw new Error('Missing receipt')
  expect(JSON.parse(delivered.text)).toEqual(expected)
  expect(content).toContainEqual({
    type: 'inputImage',
    imageUrl: imageResult.dataUrl
  })
  const text = vi.fn()
  const image = vi.fn()
  runInNewContext(localToolResultExample, {
    resultKey: 'test-receipt',
    store: vi.fn(),
    result: content
      .map((item) => (item.type === 'inputText' ? item.text : item.imageUrl))
      .join('\n'),
    text,
    image
  })
  expect(text.mock.calls).toEqual([[expected]])
  expect(image.mock.calls).toEqual([[imageResult.dataUrl]])
  expect(Buffer.byteLength(JSON.stringify(compactFixture.delivered))).toBe(5372)
  expect(Buffer.byteLength(delivered.text)).toBeLessThanOrEqual(1938)
  expect(designs.call).toHaveBeenCalledOnce()
  expect(operations.callInternal).toHaveBeenCalledTimes(2)
  const prepared = observations.find(
    (entry) =>
      entry.stage === 'action_completed' && entry.tool === 'prepare_design'
  )
  const applied = observations.find(
    (entry) =>
      entry.stage === 'action_completed' &&
      entry.tool === 'apply_prepared_design'
  )
  if (!prepared || !applied) throw new Error('Missing owner observation')
  expect(prepared.result).toEqual(compactFixture.prepared)
  expect(applied.result).toEqual(appliedReceipt)
  expect(prepared.callId).toEqual(expect.any(String))
  expect(applied.callId).toEqual(expect.any(String))
  expect(prepared.callId).not.toBe(applied.callId)
})

it.each(['compact', 'full'] as const)(
  'forwards real %s workflow receipts through the published example with raw diagnostics retained',
  async (response) => {
    const { designs, operations, compile, execute } = setup()
    const timing = { totalMs: 12, canonicalWork: { counters: { created: 2 } } }
    const semantic = {
      timing: 'user detail',
      sourceWork: 'limit',
      reuse: 'recovery condition'
    }
    const prior = execute.getMockImplementation()
    if (!prior) throw new Error('Missing execution fixture')
    execute.mockImplementation(async (...args) => {
      const receipt = await prior(...args)
      Object.assign(receipt.actionResults[0].result as object, {
        timing,
        recovery: semantic
      })
      return receipt
    })
    const observations: { stage: string; [key: string]: unknown }[] = []
    const workflow = createLocalDesignWorkflow(designs, operations, {
      trace: (stage, evidence) =>
        observations.push({ stage, ...structuredClone(evidence) })
    })
    const reply = await invokeLocalTool(
      workflow,
      workflow.definitions[0],
      { draft, response, inspection: 'defer' },
      signal()
    )
    expect(JSON.parse(reply.text).toolOutcome).toMatchObject({
      status: 'partial',
      settlement: 'completed'
    })
    const value = JSON.parse(reply.text)
    const action = value.actionResults[0]
    expect(action.result.recovery).toEqual(semantic)
    expect(action.result.compositionId).toBe('root')
    expect(action.result.status).toBe('complete')
    const preparedObservation = observations.find(
      (entry) =>
        entry.stage === 'action_completed' && entry.tool === 'prepare_design'
    )
    const appliedObservation = observations.find(
      (entry) =>
        entry.stage === 'action_completed' &&
        entry.tool === 'apply_prepared_design'
    )
    if (!preparedObservation || !appliedObservation)
      throw new Error('Missing owner observation')
    const prepared = JSON.parse(JSON.stringify(preparedObservation))
    const applied = JSON.parse(JSON.stringify(appliedObservation))
    expect(applied.result.actionResults[0].result.timing).toEqual(timing)
    expect(prepared.result.sourceWork).toBeDefined()
    expect(prepared.result.reuse).toBeDefined()
    if (response === 'compact') {
      expect(action.result).not.toHaveProperty('timing')
      expect(value).not.toHaveProperty('sourceWork')
      expect(value).not.toHaveProperty('reuse')
    } else {
      expect(action.result.timing).toEqual(timing)
      expect(value.sourceWork).toEqual(prepared.result.sourceWork)
      expect(value.reuse).toEqual(prepared.result.reuse)
      expect(action.result.appliedElementIds).toEqual(['root', 'face'])
    }
    const png =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGioAAAAASUVORK5CYII='
    const captured = {
      actionId: 'capture',
      actionName: AiActionNames.INSPECT_DRAWING,
      result: {
        available: true,
        inspectionId: 'evidence',
        image: { dataUrl: png, width: 1, height: 1 }
      }
    }
    const content = await localToolContent(
      JSON.stringify({
        ...value,
        actionResults: [...value.actionResults, captured]
      })
    )
    const text = vi.fn()
    const image = vi.fn()
    runInNewContext(localToolResultExample, {
      resultKey: 'test-receipt',
      store: vi.fn(),
      result: content
        .map((item) => (item.type === 'inputText' ? item.text : item.imageUrl))
        .join('\n'),
      text,
      image
    })
    expect(text).toHaveBeenCalledOnce()
    expect(text.mock.calls[0][0].actionResults[0]).toEqual(action)
    expect(image.mock.calls).toEqual([[png]])
    expect(JSON.stringify(text.mock.calls)).not.toContain('base64')
    expect(compile).toHaveBeenCalledOnce()
    expect(execute).toHaveBeenCalledOnce()
  }
)

it.each([
  {},
  { failCheck: 'part-1' },
  { captureUnavailable: true },
  { stopApply: 2 },
  { browserFailure: 'partial' as const },
  { lostApply: 2 },
  { lostApply: 2, observeReceipts: true }
])(
  'preserves ordered compact results and follow-up failures while omitting only diagnostics: %j',
  async (options) => {
    const { workflow, events } = inspectionBoundaryFixture(options)
    const value = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        {
          parts: [
            { key: 'first', draft },
            { key: 'second', draft }
          ],
          inspection: 'immediate'
        },
        signal()
      )
    )
    expect(JSON.stringify(value)).not.toContain('"canonicalWork"')
    for (const part of value.parts) {
      expect(part).not.toHaveProperty('reuse')
      expect(part).not.toHaveProperty('sourceWork')
      for (const action of part.actionResults ?? []) {
        if (action.actionName === AiActionNames.APPLY_PREPARED_DESIGN) {
          expect(action.result).not.toHaveProperty('timing')
          expect(action.result.compositionId).toEqual(expect.any(String))
        }
      }
    }
    expect(
      events.filter((entry) =>
        entry.startsWith(AiActionNames.APPLY_PREPARED_DESIGN + ':')
      )
    ).toHaveLength(2)
    const outcome = localToolOutcome(value)
    expect(outcome.status).toBe(
      Object.keys(options).length ? 'partial' : 'success'
    )
    if (options.lostApply) expect(outcome.settlement).toBe('unknown')
    if (options.failCheck || options.captureUnavailable)
      expect(outcome.settlement).toBe('completed')
  }
)

it('persists original workflow diagnostics before recording compact native delivery', async ({
  onTestFinished
}) => {
  const directory = await mkdtemp(resolve('tmp', 'compact-records-'))
  const recordingError = vi.fn()
  const sink = createExecutionRecordSink(directory, recordingError)
  onTestFinished(async () => {
    await sink.flush()
    await rm(directory, { recursive: true, force: true })
  })
  const usage = createAiExecutionProfiler(
    { intent: 'Draw one part', context: {}, actions, attempt: 0 },
    'gpt-6-astra',
    { sink }
  )
  const { designs, operations, execute } = setup()
  const executeOwner = execute.getMockImplementation()
  if (!executeOwner) throw new Error('Missing owner fixture')
  const timing = { totalMs: 12, canonicalWork: { counters: { created: 2 } } }
  execute.mockImplementation(async (...args) => {
    const receipt = await executeOwner(...args)
    Object.assign(receipt.actionResults[0].result as object, { timing })
    return receipt
  })
  const originals = new Map<string, unknown>()
  const workflow = createLocalDesignWorkflow(designs, operations, {
    trace: (stage, evidence) => {
      if (stage === 'action_completed')
        originals.set(String(evidence.callId), structuredClone(evidence.result))
      usage.trace(stage, evidence)
    }
  })
  const value = JSON.parse(
    await workflow.call(
      'prepare_and_apply_design',
      { draft, inspection: 'defer' },
      signal()
    )
  )
  usage.trace('tool_completed', {
    tool: 'prepare_and_apply_design',
    callId: 'outer',
    result: value
  })
  usage.finish('completed')
  const stored = await sink.flush()
  expect(stored.status).toBe('saved')
  expect(recordingError).not.toHaveBeenCalled()
  if (!stored.path) throw new Error('Missing recording')
  const records = (await readFile(stored.path, 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
  let verified = 0
  for (const record of records) {
    if (
      record.stage !== 'action_completed' &&
      record.stage !== 'tool_completed'
    )
      continue
    const payload = record.diagnostic.output.payload
    expect(payload.path).toEqual(expect.any(String))
    const saved = JSON.parse(
      await readFile(resolve(directory, payload.path), 'utf8')
    )
    if (record.callId === 'outer') {
      expect(saved).toEqual(value)
      expect(saved).not.toHaveProperty('reuse')
      expect(saved.actionResults[0].result).not.toHaveProperty('timing')
    } else {
      expect(originals.has(record.callId)).toBe(true)
      expect(saved).toEqual(originals.get(record.callId))
      if (record.tool === 'apply_prepared_design')
        expect(saved.actionResults[0].result.timing).toEqual(timing)
      if (record.tool === 'prepare_design')
        expect(saved.sourceWork.nodes).toBe(2)
    }
    verified++
  }
  expect(verified).toBe(3)
  expect(execute).toHaveBeenCalledOnce()
})

it.each(['compact', 'full'] as const)(
  'hands the automatic image directly to bound visual judgment with %s receipts',
  async (response) => {
    const { workflow, operations, events } = inspectionBoundaryFixture()
    const reply = await invokeLocalTool(
      workflow,
      workflow.definitions[0],
      {
        draft,
        plan: reviewPlanExample,
        reviewChecks: [{ criterionId: 'appearance' }],
        response
      },
      signal()
    )
    expect(reply.success, reply.text).toBe(true)
    const value = JSON.parse(reply.text)
    expect(value.visualReview).toMatchObject({
      reviewOperation: 'bind',
      recordedChecks: [],
      accepted: false,
      acceptanceContext: { checks: [{ criterionId: 'appearance' }] },
      next: {
        execution: { namespace: 'design_operations', tool: 'review_drawing' },
        fillSchema: {
          properties: {
            status: { enum: ['pass', 'fail', 'unverified'] },
            evidence: { maxLength: 1000 }
          }
        }
      }
    })
    const next = value.visualReview.next
    const definition = operations.definitions.find(
      (tool) => tool.name === next.execution.tool
    )
    if (!definition) throw new Error('Unregistered review route')
    const recorded = await invokeLocalTool(
      operations,
      definition,
      {
        ...next.arguments,
        checks: next.arguments.checks.map((check: object) => ({
          ...check,
          status: 'fail',
          evidence: 'The requested appearance is not visible.'
        }))
      },
      signal()
    )
    expect(recorded.success, recorded.text).toBe(true)
    expect(JSON.parse(recorded.text)).toMatchObject({
      accepted: false,
      recordedChecks: [{ criterionId: 'appearance', status: 'fail' }]
    })
    expect(
      events.filter((event) => event.startsWith('apply_prepared_design:'))
    ).toHaveLength(1)
    expect(
      events.filter((event) => event.startsWith('inspect_drawing:'))
    ).toHaveLength(1)
  }
)

it('executes the delivered review-selection example and next invocation with fewer calls and total bytes', async () => {
  const run = async (selected: boolean) => {
    const f = inspectionBoundaryFixture()
    let bytes = 0
    const calls: string[] = []
    const invoke = async (namespace: string, tool: string, args: object) => {
      const owner = namespace === 'design_workflow' ? f.workflow : f.operations
      const definition = owner.definitions.find((entry) => entry.name === tool)
      if (!definition) throw new Error('Unregistered example route')
      calls.push(tool)
      const reply = await invokeLocalTool(
        owner,
        definition,
        JSON.parse(JSON.stringify(args)),
        signal()
      )
      expect(reply.success, reply.text).toBe(true)
      bytes +=
        Buffer.byteLength(JSON.stringify(args)) + Buffer.byteLength(reply.text)
      return JSON.parse(reply.text)
    }
    const discover = async (args: object) => {
      const values = new Map<
        string,
        { complete: boolean; value: unknown; next: { arguments: object } }
      >()
      let query = args
      for (;;) {
        const value = await invoke(
          'design_operations',
          'describe_design_apis',
          query
        )
        runInNewContext(informationDeliveryExample, {
          result: JSON.stringify(value),
          deliveryKey: 'query',
          text: vi.fn(),
          load: (key: string) => values.get(key),
          store: (
            key: string,
            value: {
              complete: boolean
              value: unknown
              next: { arguments: object }
            }
          ) => values.set(key, value)
        })
        const saved = values.get('query')
        if (!saved)
          throw new Error('Published delivery did not retain the result')
        if (saved.complete) return JSON.parse(JSON.stringify(saved.value))
        query = saved.next.arguments
      }
    }
    const usage = await discover({
      names: ['prepare_and_apply_design'],
      view: 'usage',
      inputScope: {
        operation: 'draft',
        nodeTypes: ['rect'],
        optionalInputs: selected ? ['plan', 'reviewChecks'] : ['plan']
      }
    })
    const invocation = usage.tools[0].invocationExample.invocation
    expect(invocation).toBeDefined()
    if (selected)
      expect(invocation.arguments.reviewChecks).toEqual([
        { criterionId: 'appearance' }
      ])
    // The control needs the same criteria but cannot bind in the drawing call.
    if (!selected) invocation.arguments.plan = reviewPlanExample
    const value = await invoke(
      invocation.namespace,
      invocation.tool,
      invocation.arguments
    )
    const content = await localToolContent(JSON.stringify(value))
    const text = vi.fn(),
      image = vi.fn()
    runInNewContext(localToolResultExample, {
      resultKey: 'test-receipt',
      store: vi.fn(),
      result: content
        .map((part) => (part.type === 'inputText' ? part.text : part.imageUrl))
        .join('\n'),
      text,
      image
    })
    expect(image).toHaveBeenCalledOnce()
    let handoff = text.mock.calls[0][0].visualReview
    if (!selected) {
      const review = await discover({
        names: ['review_drawing'],
        view: 'usage'
      })
      const route = review.tools[0].execution
      const inspectionId = value.actionResults.find(
        (entry: { actionName: string }) =>
          entry.actionName === 'inspect_drawing'
      ).result.inspectionId
      handoff = await invoke(route.namespace, route.tool, {
        phase: 'visual',
        final: false,
        bindChecks: [
          { criterionId: 'appearance', inspectionIds: [inspectionId] }
        ]
      })
    }
    const next = handoff.next
    await invoke(next.execution?.namespace ?? 'design_operations', next.tool, {
      ...next.arguments,
      checks: next.arguments.checks.map((check: object) => ({
        ...check,
        status: 'fail',
        evidence: 'The requested appearance is absent.'
      }))
    })
    return { bytes, calls, events: f.events }
  }
  const control = await run(false)
  const selected = await run(true)
  expect(
    selected.calls.filter((name) => name === 'review_drawing')
  ).toHaveLength(1)
  expect(
    control.calls.filter((name) => name === 'review_drawing')
  ).toHaveLength(2)
  expect(selected.calls.length).toBeLessThan(control.calls.length)
  expect(selected.bytes).toBeLessThan(control.bytes)
  expect(selected.events).toEqual(control.events)
  // eslint-disable-next-line no-console -- Formal delivery-size comparison, not model latency.
  console.info(
    'Visual handoff delivery',
    JSON.stringify({
      controlBytes: control.bytes,
      selectedBytes: selected.bytes,
      controlCalls: control.calls,
      selectedCalls: selected.calls
    })
  )
})

it.each([
  { reviewChecks: [] },
  { reviewChecks: [{ criterionId: 'missing' }] },
  { reviewChecks: [{ criterionId: 'appearance', unitId: 'undeclared' }] },
  { reviewChecks: [{ criterionId: 'appearance' }], inspection: 'defer' },
  { reviewChecks: [{ criterionId: 'appearance', status: 'pass' }] }
])(
  'rejects invalid early review selection before writes: %j',
  async (input) => {
    const f = inspectionBoundaryFixture()
    const reply = await invokeLocalTool(
      f.workflow,
      f.workflow.definitions[0],
      { draft, plan: reviewPlanExample, ...input },
      signal()
    )
    expect(reply.success).toBe(false)
    expect(f.events).toEqual([])
  }
)

it('binds only the completed parts boundary and retains independent binding without selection', async () => {
  const f = inspectionBoundaryFixture()
  const value = JSON.parse(
    await f.workflow.call(
      'prepare_and_apply_design',
      {
        parts: [
          { key: 'first', draft },
          { key: 'last', draft }
        ],
        plan: reviewPlanExample,
        reviewChecks: [{ criterionId: 'appearance' }]
      },
      signal()
    )
  )
  expect(
    value.visualReview.next.arguments.checks[0].binding.dependencies[0]
      .elementId
  ).toBe('part-2')
  expect(
    f.events.filter((event) => event.startsWith('inspect_drawing:'))
  ).toEqual(['inspect_drawing:part-2'])
  const standalone = inspectionBoundaryFixture()
  const image = JSON.parse(
    await standalone.workflow.call(
      'prepare_and_apply_design',
      { draft, plan: reviewPlanExample },
      signal()
    )
  )
  expect(image.visualReview).toBeUndefined()
  const id = image.actionResults.find(
    (entry: { actionName: string }) => entry.actionName === 'inspect_drawing'
  ).result.inspectionId
  const bound = JSON.parse(
    await standalone.operations.call(
      'review_drawing',
      {
        phase: 'visual',
        final: false,
        bindChecks: [{ criterionId: 'appearance', inspectionIds: [id] }]
      },
      signal()
    )
  )
  expect(bound.next.arguments.checks[0].binding).toBeDefined()
})

it.each([{ stopApply: 2 }, { captureUnavailable: true }])(
  'retains partial work without binding an unintended scope: %j',
  async (options) => {
    const f = inspectionBoundaryFixture(options)
    const value = JSON.parse(
      await f.workflow.call(
        'prepare_and_apply_design',
        {
          parts: [
            { key: 'first', draft },
            { key: 'last', draft }
          ],
          plan: reviewPlanExample,
          reviewChecks: [{ criterionId: 'appearance' }]
        },
        signal()
      )
    )
    expect(localToolOutcome(value).status).toBe('partial')
    expect(value.visualReview?.next?.arguments?.checks).toBeUndefined()
    expect(
      f.events.filter((event) => event.startsWith('apply_prepared_design:'))
    ).toHaveLength(2)
  }
)

it('recovers unavailable binding with the returned review-only invocation and no replay or recapture', async () => {
  const options = { unavailableValidation: true }
  const f = inspectionBoundaryFixture(options)
  const reply = await invokeLocalTool(
    f.workflow,
    f.workflow.definitions[0],
    {
      draft,
      plan: reviewPlanExample,
      reviewChecks: [{ criterionId: 'appearance' }]
    },
    signal()
  )
  expect(reply.success).toBe(false)
  const value = JSON.parse(reply.text)
  expect(value.toolOutcome).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(value.visualReview.recordedChecks).toEqual([])
  const recovery = value.visualReview.recoveryInvocation
  expect(recovery.tool).toBe('review_drawing')
  options.unavailableValidation = false
  const next = JSON.parse(
    await f.operations.call(recovery.tool, recovery.arguments, signal())
  ).next
  const recorded = JSON.parse(
    await f.operations.call(
      next.tool,
      {
        ...next.arguments,
        checks: next.arguments.checks.map((check: object) => ({
          ...check,
          status: 'fail',
          evidence: 'Visible discrepancy.'
        }))
      },
      signal()
    )
  )
  expect(recorded.recordedChecks[0].status).toBe('fail')
  expect(
    f.events.filter((event) => event.startsWith('apply_prepared_design:'))
  ).toHaveLength(1)
  expect(
    f.events.filter((event) => event.startsWith('inspect_drawing:'))
  ).toHaveLength(1)
})

it('does not issue a judgment binding for stale automatic evidence', async () => {
  const f = inspectionBoundaryFixture({ staleImage: true })
  const reply = await invokeLocalTool(
    f.workflow,
    f.workflow.definitions[0],
    {
      draft,
      plan: reviewPlanExample,
      reviewChecks: [{ criterionId: 'appearance' }]
    },
    signal()
  )
  const value = JSON.parse(reply.text)
  expect(value.toolOutcome.status).toBe('partial')
  expect(
    value.visualReview.evidenceValidation.invalidInspectionIds
  ).toHaveLength(1)
  expect(value.visualReview.next?.arguments?.checks).toBeUndefined()
  expect(
    f.events.filter((event) => event.startsWith('apply_prepared_design:'))
  ).toHaveLength(1)
})

it('preserves cancellation during binding without dispatching another write or capture', async () => {
  const controller = new AbortController()
  const f = inspectionBoundaryFixture({ cancelBinding: controller })
  await expect(
    f.workflow.call(
      'prepare_and_apply_design',
      {
        draft,
        plan: reviewPlanExample,
        reviewChecks: [{ criterionId: 'appearance' }]
      },
      controller.signal
    )
  ).rejects.toThrow()
  expect(controller.signal.aborted).toBe(true)
  expect(
    f.events.filter((event) => event.startsWith('apply_prepared_design:'))
  ).toHaveLength(1)
  expect(
    f.events.filter((event) => event.startsWith('inspect_drawing:'))
  ).toHaveLength(1)
})

it('recovers a failed automatic capture through the returned review invocation without redrawing', async () => {
  const options = { captureUnavailable: true }
  const f = inspectionBoundaryFixture(options)
  const value = JSON.parse(
    await f.workflow.call(
      'prepare_and_apply_design',
      {
        draft,
        plan: reviewPlanExample,
        reviewChecks: [{ criterionId: 'appearance' }]
      },
      signal()
    )
  )
  expect(localToolOutcome(value)).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(value.visualReview.recoveryInvocation.tool).toBe('review_drawing')
  options.captureUnavailable = false
  const recovery = value.visualReview.recoveryInvocation
  const recovered = JSON.parse(
    await f.operations.call(recovery.tool, recovery.arguments, signal())
  )
  expect(recovered.next.arguments.checks[0].criterionId).toBe('appearance')
  expect(
    f.events.filter((event) => event.startsWith('apply_prepared_design:'))
  ).toHaveLength(1)
  expect(
    f.events.filter((event) => event.startsWith('inspect_drawing:'))
  ).toHaveLength(2)
})

it('binds the saved material selection after real preparation without inferring other criteria', async () => {
  const f = inspectionBoundaryFixture()
  const value = JSON.parse(
    await f.workflow.call(
      'prepare_and_apply_design',
      {
        ...compactFixture.input,
        reviewChecks: [{ criterionId: 'material' }]
      },
      signal()
    )
  )
  expect(
    value.visualReview.next.arguments.checks.map(
      (check: { criterionId: string }) => check.criterionId
    )
  ).toEqual(['material'])
  expect(value.visualReview.acceptanceContext.checks[0]).toMatchObject({
    requirement: compactFixture.input.plan.criteria.material.requirement,
    description: compactFixture.input.plan.criteria.material.description
  })
  expect(value.visualReview.coverage.passed).toBe(0)
  expect(value.visualReview.recordedChecks).toEqual([])
})

it('reports parts completion truthfully when only the final binding is unavailable', async () => {
  const f = inspectionBoundaryFixture({ unavailableValidation: true })
  const value = JSON.parse(
    await f.workflow.call(
      'prepare_and_apply_design',
      {
        parts: [
          { key: 'first', draft },
          { key: 'last', draft }
        ],
        plan: reviewPlanExample,
        reviewChecks: [{ criterionId: 'appearance' }]
      },
      signal()
    )
  )
  expect(value).toMatchObject({
    status: 'partial',
    complete: false,
    toolOutcome: { status: 'partial', settlement: 'completed' }
  })
  expect(value.parts).toHaveLength(2)
  expect(value.visualReview.recoveryInvocation.tool).toBe('review_drawing')
})

it.each(['signature', 'evidence', 'status'] as const)(
  'rejects invalid %s in the delivered judgment without changing writes',
  async (field) => {
    const f = inspectionBoundaryFixture()
    const value = JSON.parse(
      await f.workflow.call(
        'prepare_and_apply_design',
        {
          draft,
          plan: reviewPlanExample,
          reviewChecks: [{ criterionId: 'appearance' }]
        },
        signal()
      )
    )
    const next = value.visualReview.next
    const check = {
      ...next.arguments.checks[0],
      status: 'pass',
      evidence: 'Visible.'
    }
    if (field === 'signature') check.binding.signature = 'tampered'
    if (field === 'evidence') check.evidence = 'x'.repeat(1001)
    if (field === 'status') check.status = 'approved'
    const definition = f.operations.definitions.find(
      (tool) => tool.name === next.tool
    )
    if (!definition) throw new Error('Missing review')
    const reply = await invokeLocalTool(
      f.operations,
      definition,
      { ...next.arguments, checks: [check] },
      signal()
    )
    expect(reply.success).toBe(false)
    expect(
      f.events.filter((event) => event.startsWith('apply_prepared_design:'))
    ).toHaveLength(1)
    expect(
      f.events.filter((event) => event.startsWith('inspect_drawing:'))
    ).toHaveLength(1)
  }
)

it('recaptures only explicitly invalid automatic evidence through the returned recovery', async () => {
  const options = { staleImage: true }
  const f = inspectionBoundaryFixture(options)
  const value = JSON.parse(
    await f.workflow.call(
      'prepare_and_apply_design',
      {
        draft,
        plan: reviewPlanExample,
        reviewChecks: [{ criterionId: 'appearance' }]
      },
      signal()
    )
  )
  const recovery = value.visualReview.recoveryInvocation
  expect(recovery.arguments).toMatchObject({
    inspections: [
      { elementId: 'part-1', checks: [{ criterionId: 'appearance' }] }
    ]
  })
  expect(recovery.arguments.bindChecks).toBeUndefined()
  options.staleImage = false
  const bound = JSON.parse(
    await f.operations.call(recovery.tool, recovery.arguments, signal())
  )
  expect(bound.next.arguments.checks[0].binding).toBeDefined()
  expect(
    f.events.filter((event) => event.startsWith('apply_prepared_design:'))
  ).toHaveLength(1)
  expect(
    f.events.filter((event) => event.startsWith('inspect_drawing:'))
  ).toHaveLength(2)
})

it('preserves acknowledged drawing receipts when the binding is cancelled', async () => {
  const controller = new AbortController()
  const f = inspectionBoundaryFixture({
    cancelBinding: controller,
    observeReceipts: true
  })
  await expect(
    f.workflow.call(
      'prepare_and_apply_design',
      {
        draft,
        plan: reviewPlanExample,
        reviewChecks: [{ criterionId: 'appearance' }]
      },
      controller.signal
    )
  ).rejects.toMatchObject({
    receipt: {
      result: {
        batches: expect.arrayContaining([
          expect.objectContaining({
            actionResults: expect.arrayContaining([
              expect.objectContaining({
                actionName: 'apply_prepared_design',
                result: expect.objectContaining({
                  status: 'complete',
                  compositionId: 'part-1'
                })
              })
            ])
          })
        ])
      }
    }
  })
  expect(
    f.events.filter((event) => event.startsWith('apply_prepared_design:'))
  ).toHaveLength(1)
})

it('delivers an optional selection example for existing criteria without forcing a new plan or changing default examples', async () => {
  const f = inspectionBoundaryFixture()
  const schema = f.workflow.definitions[0].inputSchema
  const plain = projectWorkflowInput(schema, {
    operation: 'draft',
    nodeTypes: ['rect']
  })
  expect(plain.not).toBeUndefined()
  const selected = projectWorkflowInput(schema, {
    operation: 'draft',
    nodeTypes: ['rect'],
    optionalInputs: ['reviewChecks']
  })
  expect(selected.not).toBeDefined()
  const examples = selected.examples as Record<string, unknown>[]
  expect(examples[0].reviewChecks).toEqual([{ criterionId: 'appearance' }])
  expect(examples[0].plan).toBeUndefined()
  const rejected = await invokeLocalTool(
    f.workflow,
    f.workflow.definitions[0],
    { ...examples[0], inspection: 'defer' },
    signal()
  )
  expect(rejected.success).toBe(false)
  expect(rejected.text).toContain('requires immediate inspection')
  expect(f.events).toEqual([])
  await f.operations.call('define_design_criteria', reviewPlanExample, signal())
  const value = JSON.parse(
    await f.workflow.call('prepare_and_apply_design', examples[0], signal())
  )
  expect(value.visualReview.next.arguments.checks[0].criterionId).toBe(
    'appearance'
  )
  expect(
    (schema.examples[0] as Record<string, unknown>).reviewChecks
  ).toBeUndefined()
})

it('executes the saved descriptive brief through safe parts without another model submission', async () => {
  const { workflow, events } = inspectionBoundaryFixture({
    repeatedTarget: true
  })
  const input = structuredClone(briefFixture.input)
  const result = JSON.parse(
    (await invokeLocalTool(workflow, workflow.definitions[0], input, signal()))
      .text
  )
  expect(result, JSON.stringify(result)).toMatchObject({
    status: 'complete',
    toolOutcome: { status: 'success', settlement: 'completed' }
  })
  expect(result.parts).toHaveLength(2)
  expect(result.parts[0].completedSteps).toContain('define_design_criteria')
  expect(result.parts[1].completedSteps).not.toContain('define_design_criteria')
  expect(result.parts.map((part: { review: unknown }) => part.review)).toEqual([
    input.draft.brief,
    input.draft.brief
  ])
  expect(
    events.filter((name) =>
      name.startsWith(AiActionNames.APPLY_PREPARED_DESIGN + ':')
    )
  ).toHaveLength(2)
  expect(
    result.parts.map(
      (part: { preparationInput: { draftId: string } }) =>
        part.preparationInput.draftId
    )
  ).toEqual([expect.any(String), result.parts[0].preparationInput.draftId])
  expect(input).toEqual(briefFixture.input)
})

it.each(['whole-design-checks', 'invalid-brief'])(
  'delivers the retained brief limitation before any write: %s',
  async (code) => {
    const { workflow, events } = inspectionBoundaryFixture()
    const input = structuredClone(briefFixture.input)
    const brief = {
      ...input.draft.brief,
      checks:
        code === 'invalid-brief'
          ? 'invalid'
          : [{ key: 'root', property: 'width', expected: 100, tolerance: 1 }]
    }
    const result = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        { ...input, draft: { ...input.draft, key: 'root', brief } },
        signal()
      )
    )
    expect(result.toolOutcome).toMatchObject({
      status: 'failed',
      settlement: 'not-started'
    })
    expect(JSON.stringify(result)).toContain(code)
    expect(JSON.stringify(result)).toContain(
      code === 'invalid-brief' ? 'Invalid brief' : 'whole-design layout'
    )
    expect(events).toEqual([])
  }
)

it.each([true, false])(
  'redisplays a completed workflow result and binds without recapture with criteriaBefore=%s',
  async (criteriaBefore) => {
    const options = { staleImage: false }
    const f = inspectionBoundaryFixture(options)
    if (criteriaBefore)
      await f.operations.call(
        'define_design_criteria',
        reviewPlanExample,
        signal()
      )
    const raw = await f.workflow.call(
      'prepare_and_apply_design',
      { draft, inspection: 'immediate' },
      signal()
    )
    const content = await localToolContent(raw)
    const result = content
      .map((item) => (item.type === 'inputText' ? item.text : item.imageUrl))
      .join('\n')
    const saved = new Map<string, unknown>()
    const context = {
      resultKey: 'completed-part',
      text: vi.fn(),
      store: (key: string, value: unknown) => saved.set(key, value),
      load: (key: string) => saved.get(key)
    }
    expect(() =>
      runInNewContext(localToolResultExample, {
        ...context,
        result,
        image: () => {
          throw new Error('Display interrupted')
        }
      })
    ).toThrow('Display interrupted')
    const beforeRedisplay = [...f.events]
    const image = vi.fn()
    runInNewContext(localToolResultRecoveryExample, { ...context, image })
    expect(f.events).toEqual(beforeRedisplay)
    expect(image).toHaveBeenCalledOnce()
    const retained = context.text.mock.calls.at(-1)?.[0]
    expect(retained.toolOutcome).toMatchObject({
      status: 'success',
      settlement: 'completed'
    })
    const inspectionIds = retained.actionResults
      .filter((a: { actionName: string }) => a.actionName === 'inspect_drawing')
      .map((a: { result: { inspectionId: string } }) => a.result.inspectionId)
    if (!criteriaBefore)
      await f.operations.call(
        'define_design_criteria',
        reviewPlanExample,
        signal()
      )
    const bind = {
      phase: 'visual',
      final: false,
      bindChecks: [{ criterionId: 'appearance', inspectionIds }]
    }
    const bound = JSON.parse(
      await f.operations.call('review_drawing', bind, signal())
    )
    expect(bound.reviewOperation).toBe('bind')
    expect(bound.recordedChecks).toEqual([])
    const next = bound.next.arguments
    const recorded = JSON.parse(
      await f.operations.call(
        'review_drawing',
        {
          ...next,
          checks: next.checks.map((check: object) => ({
            ...check,
            status: 'pass',
            evidence: 'The selected local appearance is present.'
          }))
        },
        signal()
      )
    )
    expect(recorded.recordedChecks).toEqual([
      expect.objectContaining({ criterionId: 'appearance', status: 'pass' })
    ])
    options.staleImage = true
    const stale = JSON.parse(
      await f.operations.call('review_drawing', bind, signal())
    )
    expect(stale.evidenceValidation.invalidInspectionIds).toEqual(inspectionIds)
    expect(stale.next?.arguments?.checks).toBeUndefined()
    expect(
      f.events.filter((e) => e.startsWith('apply_prepared_design:'))
    ).toHaveLength(1)
    expect(
      f.events.filter((e) => e.startsWith('inspect_drawing:'))
    ).toHaveLength(1)
  }
)

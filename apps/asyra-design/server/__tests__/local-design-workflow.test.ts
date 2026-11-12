import {
  createLocalToolLeases,
  type LocalToolOwnership
} from '../local-tool-leases'
import materialRepair from '../../test-data/knowledge-evaluation/__fixtures__/material-repair-20261028.json'
import nonplanar from './fixtures/recorded-101/nonplanar-recovery-20261026.json'
import briefFixture from './fixtures/recorded-101/brief-capacity-20261024.json'
import { workflowUsageGuide } from '../design-workflow-discovery'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createAiExecutionProfiler } from '@asyra/ai-agent-runtime'
import { createExecutionRecordSink } from '@asyra/ai-agent-runtime/node'
import sharp from 'sharp'
import compactFixture from './fixtures/recorded-101/compact-receipt-20261024.json'
import {
  localToolContent,
  type NativeToolDescriptor
} from '../local-operation-tools'
import capacityFixture from './fixtures/recorded-101/pattern-budget-recovery-20261023.json'
import { invokeLocalTool, localToolOutcome } from '../local-tool-invocation'
import { requireBatchSuccess } from '../batch-exchange'
import {
  nativeToolInputSchema,
  operationInputIssue
} from '../operation-input-schema'
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

const setup = (
  registered: AiActionDescription[] = actions,
  ownership?: LocalToolOwnership
) => {
  const compile = vi.fn(prepareDesignAsync)
  const session = createDesignPreparationSession(
    prepareDesign,
    compile,
    ownership
  )
  const designs = createLocalDesignTools(registered, session)
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
    session,
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
    remainingParts: ['third']
  })
  expect(reply.outcome).toMatchObject({
    status: 'partial',
    settlement: 'unknown'
  })
  expect(execute).toHaveBeenCalledTimes(2)
})

it('executes the advertised ordered input example without hidden envelope fields', async () => {
  const { workflow, compile, execute } = setup()
  const definition = workflow.definitions[0]

  const guide = workflowUsageGuide(definition.inputSchema, {
    operation: 'draft',
    nodeTypes: ['projected-face']
  })

  for (const delivered of [definition.description, guide.instructions]) {
    expect(delivered).not.toContain('define_design_criteria')
    expect(delivered).not.toContain('reviewChecks')
    expect(delivered).toContain('Preserve supplied 2D geometry')
    expect(delivered).not.toContain('Preserve 2D;')
    expect(delivered).not.toContain('before review, immutable after drawing')
  }

  expect(definition.description).not.toContain('Ordered input example: ')
  expect(definition.description).not.toContain(
    'Call before generating later details'
  )
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

  expect(result.status).toBe('complete')
  expect(result).not.toHaveProperty('executionIssues')
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

    expect(reply.outcome.status).toBe('failed')
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
    ]) {
      expect(Boolean(operationInputIssue(input, native))).toBe(
        Boolean(operationInputIssue(input, schema))
      )
    }

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

      if (part === 2) {
        expect(batch.actions[0].arguments).toMatchObject({
          parentId: 'actual-first'
        })
      }

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
    expect(result.status).toBe('complete')
    expect(result).not.toHaveProperty('executionIssues')
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

    expect(result.success).toBe(true)
    expect(result.outcome).toMatchObject({
      status: 'success',
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

    expect(result.available).toBe(false)
    expect(result).toMatchObject({
      settlement: 'not-started',
      recovery: 'correct_input'
    })
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

it('captures applied work without an implicit quality measurement', async () => {
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

      if (action.name === AiActionNames.REVIEW_DESIGN) {
        result = {
          complete: true,
          findings: [],
          measuredTextIds: [],
          evidence: { sessionId: 'combined', revision: 1 }
        }
      }

      if (action.name === AiActionNames.INSPECT_DRAWING) {
        result = {
          available: true,
          partial: false,
          image: { dataUrl: 'data:image/png;base64,AA==' }
        }
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
    AiActionNames.INSPECT_DRAWING
  ])
  expect(result.actionResults[1].result).toMatchObject({
    available: true,
    inspectionId: expect.any(String)
  })
  expect(result.actionResults[1].result.image.dataUrl).toBe(
    'data:image/png;base64,AA=='
  )
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
            actionId: 'applied',
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
    toolOutcome: { status: 'failed' }
  })
  // The owner's failed application remains intact; the invocation acknowledges
  // the separately observed successful prefix without replaying it.
  expect(reply.outcome).toMatchObject({
    status: 'partial',
    settlement: 'unknown'
  })
  expect(execute).toHaveBeenCalledOnce()
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

  expect(repaired.success, repaired.text).toBe(true)
  expect(repaired.outcome).toMatchObject({
    status: 'success',
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
  expect(response.outcome.status).toBe('partial')
  expect(receipt).toMatchObject({
    status: 'partial',
    failedPart: 'detail',
    remainingParts: ['later']
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

  expect(repaired.success, repaired.text).toBe(true)
  expect(repaired.outcome).toMatchObject({
    status: 'success',
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
          if (options.lostApply === applied) {
            throw new Error('Application acknowledgement lost')
          }

          if (options.uncertainApply === applied) {
            result = {
              status: 'partial',
              settlement: 'unknown',
              compositionId: 'part-' + applied
            }
          } else if (options.unknownApply === applied) {
            result = { status: 'unknown', compositionId: 'part-' + applied }
          } else if (options.stopApply === applied) {
            result = {
              status: 'partial',
              compositionId: 'part-' + applied,
              appliedElementIds: ['part-' + applied],
              complete: false
            }
          } else {
            result = {
              status: 'complete',
              compositionId: 'part-' + (options.repeatedTarget ? 1 : applied),
              appliedElementIds: [
                'part-' + (options.repeatedTarget ? 1 : applied)
              ]
            }
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

          if (imageValidation) {
            options.cancelBinding?.abort()
          }

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

        if (action.name === AiActionNames.APPLY_PREPARED_DESIGN) {
          Object.assign(result as object, {
            timing: {
              totalMs: 8,
              canonicalWork: { counters: { created: applied } }
            }
          })
        }

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

it.each(['defer', 'immediate'])(
  'executes ordered parts with only the requested %s observation',
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
    expect(events).toEqual([
      'apply_prepared_design:undefined',
      'apply_prepared_design:undefined',
      ...(inspection === 'immediate' ? ['inspect_drawing:part-2'] : [])
    ])
    expect(result.parts).toHaveLength(2)
    expect(result).not.toHaveProperty('measurementDeferred')
  }
)

it.each([
  { failCheck: 'part-1' },
  { canReview: false },
  { incompleteCheck: 'part-1' }
])(
  'does not schedule a quality check as a prerequisite for capture: %j',
  async (options) => {
    const { workflow, events } = inspectionBoundaryFixture(options)
    const result = JSON.parse(
      await workflow.call('prepare_and_apply_design', { draft }, signal())
    )

    expect(localToolOutcome(result).status).toBe('success')
    expect(events).toEqual([
      'apply_prepared_design:undefined',
      'inspect_drawing:part-1'
    ])
  }
)

it('keeps capture failure separate from acknowledged writes', async () => {
  const { workflow, events } = inspectionBoundaryFixture({
    captureUnavailable: true
  })
  const result = JSON.parse(
    await workflow.call('prepare_and_apply_design', { draft }, signal())
  )

  expect(localToolOutcome(result)).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(result.inspectionIssues).toHaveLength(1)
  expect(result.actionResults[0].result.compositionId).toBe('part-1')
  expect(events).toEqual([
    'apply_prepared_design:undefined',
    'inspect_drawing:part-1'
  ])
})

it('stops dependent parts on partial application without scheduling measurements', async () => {
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
  expect(result.parts).toHaveLength(2)
  expect(events).toEqual([
    'apply_prepared_design:undefined',
    'apply_prepared_design:undefined'
  ])
})

it.each([
  { unknownApply: 1 },
  { lostApply: 1 },
  { browserFailure: 'unknown' as const, browserFailureAt: 1 }
])(
  'preserves uncertain writes and dispatches no dependent capture or part: %j',
  async (options) => {
    const { workflow, events } = inspectionBoundaryFixture(options)
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

    let expectedStatus = 'partial'

    if ('unknownApply' in options) {
      expectedStatus = 'unknown'
    } else if ('lostApply' in options) {
      expectedStatus = 'failed'
    }

    expect(localToolOutcome(result)).toMatchObject({
      status: expectedStatus,
      settlement: 'unknown'
    })
    expect(result.failedPart).toBe('a')
    expect(result.remainingParts).toEqual(['b'])
    expect(events).toEqual(['apply_prepared_design:undefined'])
  }
)

it('preserves a known browser failure prefix without replaying writes', async () => {
  const { workflow, events } = inspectionBoundaryFixture({
    browserFailure: 'partial',
    browserFailureAt: 1
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

  expect(localToolOutcome(result).status).toBe('partial')
  expect(result.failedPart).toBe('a')
  expect(result.parts).toHaveLength(1)
  expect(events).toEqual(['apply_prepared_design:undefined'])
})

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
      complete: false
    })
    expect(reply.outcome).toMatchObject({
      status: 'partial',
      settlement: 'completed'
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
    expect(result.compositionIds).toHaveLength(1)
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
  const { measurementDeferred: _deferred, ...appliedReceipt } = structuredClone(
    compactFixture.applied
  )
  const imageResult = appliedReceipt.actionResults.find(
    (entry) => entry.actionName === AiActionNames.INSPECT_DRAWING
  )?.result.image

  if (!imageResult) {
    throw new Error('Saved inspection metadata missing')
  }

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
  operations.callInternal = vi.fn(async () => JSON.stringify(appliedReceipt))
  const observations: { stage: string; [key: string]: unknown }[] = []
  const workflow = createLocalDesignWorkflow(designs, operations, {
    trace: (stage, evidence) =>
      observations.push({ stage, ...structuredClone(evidence) })
  })
  const reply = await invokeLocalTool(
    workflow,
    workflow.definitions[0],
    {
      draft: compactFixture.input.draft,
      inspection: compactFixture.input.inspection,
      response: compactFixture.input.response
    },
    signal()
  )

  expect(reply.success, reply.text).toBe(true)
  const expected = JSON.parse(JSON.stringify(compactFixture.delivered))

  delete expected.measurementDeferred
  expected.completedSteps = expected.completedSteps.filter(
    (name: string) => name !== 'define_design_criteria'
  )

  expected.compositionIds = [
    expected.actionResults.find(
      (entry: { actionName: string }) =>
        entry.actionName === AiActionNames.APPLY_PREPARED_DESIGN
    ).result.compositionId
  ]
  expected.createdTargets = []
  delete expected.reuse
  delete expected.sourceWork
  delete expected.actionResults[0].result.timing
  const content = await localToolContent(reply.text)
  const delivered = content.find((item) => item.type === 'inputText')

  expect(delivered?.type).toBe('inputText')
  if (delivered?.type !== 'inputText') {
    throw new Error('Missing receipt')
  }

  expect(JSON.parse(delivered.text)).toEqual(expected)
  expect(content).toContainEqual({
    type: 'inputImage',
    imageUrl: imageResult.dataUrl
  })
  expect(Buffer.byteLength(JSON.stringify(compactFixture.delivered))).toBe(5372)
  const { compositionIds, createdTargets, ...existingFields } = JSON.parse(
    delivered.text
  )

  expect(compositionIds).toEqual(expected.compositionIds)
  expect(createdTargets).toEqual([])
  expect(Buffer.byteLength(JSON.stringify(existingFields))).toBeLessThanOrEqual(
    1938
  )
  expect(Buffer.byteLength(delivered.text)).toBeLessThanOrEqual(2025)
  expect(designs.call).toHaveBeenCalledOnce()
  expect(operations.callInternal).toHaveBeenCalledOnce()
  const prepared = observations.find(
    (entry) =>
      entry.stage === 'action_completed' && entry.tool === 'prepare_design'
  )
  const applied = observations.find(
    (entry) =>
      entry.stage === 'action_completed' &&
      entry.tool === 'apply_prepared_design'
  )

  if (!prepared || !applied) {
    throw new Error('Missing owner observation')
  }

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

    if (!prior) {
      throw new Error('Missing execution fixture')
    }

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

    expect(reply.outcome).toMatchObject({
      status: 'success',
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

    if (!preparedObservation || !appliedObservation) {
      throw new Error('Missing owner observation')
    }

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
    const texts = content.filter((item) => item.type === 'inputText')

    expect(texts).toHaveLength(1)
    expect(JSON.parse(texts[0].text).actionResults[0]).toEqual(action)
    expect(content.filter((item) => item.type === 'inputImage')).toEqual([
      { type: 'inputImage', imageUrl: png }
    ])
    expect(JSON.stringify(texts)).not.toContain('base64')
    expect(compile).toHaveBeenCalledOnce()
    expect(execute).toHaveBeenCalledOnce()
  }
)

it.each([
  {},
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
    if (options.lostApply) {
      expect(outcome.settlement).toBe('unknown')
    }

    if (options.captureUnavailable) {
      expect(outcome.settlement).toBe('completed')
    }
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

  if (!executeOwner) {
    throw new Error('Missing owner fixture')
  }

  const timing = { totalMs: 12, canonicalWork: { counters: { created: 2 } } }

  execute.mockImplementation(async (...args) => {
    const receipt = await executeOwner(...args)

    Object.assign(receipt.actionResults[0].result as object, { timing })

    return receipt
  })
  const originals = new Map<string, unknown>()
  const workflow = createLocalDesignWorkflow(designs, operations, {
    trace: (stage, evidence) => {
      if (stage === 'action_completed') {
        originals.set(String(evidence.callId), structuredClone(evidence.result))
      }

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
  if (!stored.path) {
    throw new Error('Missing recording')
  }

  const records = (await readFile(stored.path, 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
  let verified = 0

  for (const record of records) {
    if (
      record.stage !== 'action_completed' &&
      record.stage !== 'tool_completed'
    ) {
      continue
    }

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
      if (record.tool === 'apply_prepared_design') {
        expect(saved.actionResults[0].result.timing).toEqual(timing)
      }

      if (record.tool === 'prepare_design') {
        expect(saved.sourceWork.nodes).toBe(2)
      }
    }

    verified++
  }

  expect(verified).toBe(3)
  expect(execute).toHaveBeenCalledOnce()
})

it.each(['whole-design-checks', 'invalid-brief'])(
  'delivers the retained brief limitation before any write: %s',
  async (code) => {
    const { workflow, events } = inspectionBoundaryFixture()
    const { plan: _plan, ...input } = structuredClone(briefFixture.input)
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

    expect(result).toMatchObject({
      available: false,
      settlement: 'not-started'
    })
    expect(JSON.stringify(result)).toContain(code)
    expect(JSON.stringify(result)).toContain(
      code === 'invalid-brief' ? 'Invalid brief' : 'whole-design layout'
    )
    expect(events).toEqual([])
  }
)

it.each(['direct', 'faces', 'members'] as const)(
  'delivers measured nonplanarity and source repair through the real workflow for %s',
  async (kind) => {
    const { workflow, execute } = setup()
    const signal = new AbortController().signal
    const prior = JSON.parse(
      await workflow.call('prepare_and_apply_design', { draft }, signal)
    )

    expect(prior.failedStep).toBeUndefined()
    const sourceFace = structuredClone(nonplanar.face)
    const { type: _type, ...patternFace } = sourceFace
    const source = {
      type: 'group',
      name: 'Independent fins',
      projection: nonplanar.projection,
      children:
        kind === 'direct'
          ? [sourceFace]
          : [
              {
                type: 'pattern',
                key: 'fins',
                name: 'Fins',
                origin: { x: 0, y: 0, z: 0 },
                axes: [{ count: 2, step: { x: 0, y: 500, z: 0 } }],
                [kind]: [kind === 'faces' ? patternFace : sourceFace]
              }
            ]
    }
    const before = JSON.stringify(source)
    const rejected = JSON.parse(
      await workflow.call(
        'prepare_and_apply_design',
        {
          draft: source,
          parentId: 'existing-parent',
          inspection: 'defer',
          response: 'full',
          message: 'Add fins'
        },
        signal
      )
    )

    expect(rejected).toMatchObject({
      available: false,
      settlement: 'not-started',
      failedStep: 'prepare_design',
      completedSteps: []
    })
    expect(execute).toHaveBeenCalledTimes(1)
    const path =
      kind === 'direct'
        ? '/children/0/vertices'
        : `/children/0/${kind}/0/vertices`

    expect(rejected.geometryIssue).toMatchObject({
      code: 'NONPLANAR_FACE',
      path,
      key: sourceFace.key,
      unit: 'world'
    })
    expect(rejected.geometryIssue.deviation).toBeCloseTo(4.761041159293034, 10)
    expect(rejected.geometryIssue.tolerance).toBeCloseTo(
      0.000010608487168300672,
      12
    )
    expect(rejected.repairGuide.arguments.repair).toEqual({
      draftId: rejected.draftId,
      replacements: [{ path }]
    })
    expect(rejected.repairGuide.instructions).toContain('value')
    expect(rejected.repairGuide.tool).toBe('prepare_and_apply_design')
    expect(rejected.repairGuide.arguments).toMatchObject({
      parentId: 'existing-parent',
      inspection: 'defer',
      response: 'full',
      message: 'Add fins'
    })
    expect(rejected.repairGuide.arguments).not.toHaveProperty('draft')

    const request = structuredClone(rejected.repairGuide.arguments)

    request.repair.replacements[0].value = nonplanar.replacement
    const repaired = JSON.parse(
      await workflow.call(rejected.repairGuide.tool, request, signal)
    )

    expect(repaired.failedStep).toBeUndefined()
    expect(repaired.completedSteps).toContain('prepare_design')
    expect(execute).toHaveBeenCalledTimes(2)
    expect(execute.mock.calls.at(-1)?.[0].actions[0].arguments).toMatchObject({
      parentId: 'existing-parent'
    })
    expect(JSON.stringify(source)).toBe(before)
    expect(prior.failedStep).toBeUndefined()
    await expect(
      workflow.call('prepare_and_apply_design', request, AbortSignal.abort())
    ).rejects.toThrow()
    expect(execute).toHaveBeenCalledTimes(2)
    const expired = JSON.parse(
      await setup().workflow.call('prepare_and_apply_design', request, signal)
    )

    expect(expired).toMatchObject({
      available: false,
      settlement: 'not-started',
      failedStep: 'prepare_design'
    })
  }
)

const materialRecoverySource = () => ({
  type: 'group',
  name: 'Material surfaces',
  projection: nonplanar.projection,
  children: [
    {
      type: 'projected-face',
      key: 'surface',
      name: 'Surface',
      materialField: 'glassL',
      vertices: [
        { x: 0, y: 0, z: 0 },
        { x: 100, y: 0, z: 0 },
        { x: 100, y: 0, z: 100 },
        { x: 0, y: 0, z: 100 }
      ]
    }
  ]
})

it.each(['prepare_design', 'prepare_and_apply_design'])(
  'preserves unresolved material source in the delivered %s input repair',
  async (name) => {
    const f = setup()
    const seed = f.session.prepare({
      ...draft,
      linearFields: materialRepair.linearFields
    })
    const owner = name === 'prepare_design' ? f.designs : f.workflow
    const definition = owner.definitions.find((tool) => tool.name === name)

    if (!definition) {
      throw new Error('Missing preparation definition')
    }

    const call = async (args: unknown) => {
      const reply = await invokeLocalTool(
        owner,
        definition,
        args,
        new AbortController().signal
      )

      return { value: JSON.parse(reply.text), outcome: reply.outcome }
    }

    const source = materialRecoverySource()
    const invalid = {
      ...source,
      children: source.children.map((child) => ({ ...child, vertices: [] }))
    }
    const rejected = await call({
      draft: invalid,
      materialSourceId: seed.artifactId,
      ...(name === 'prepare_and_apply_design' ? { inspection: 'defer' } : {})
    })

    expect(rejected.outcome.settlement).toBe('not-started')
    expect(f.execute).not.toHaveBeenCalled()
    expect(f.compile).not.toHaveBeenCalled()
    const next = structuredClone(rejected.value.repairGuide.arguments)

    next.repair.replacements.forEach(
      (replacement: { path: string; value?: unknown }) => {
        expect(replacement.path).toBe('/children/0/vertices')
        replacement.value = source.children[0].vertices
      }
    )
    const repaired = await call(next)

    expect(repaired.outcome).toMatchObject({
      status: 'success',
      settlement: 'completed'
    })
    if (name === 'prepare_and_apply_design') {
      expect(repaired.value.completedSteps).toEqual([
        'prepare_design',
        'apply_prepared_design'
      ])
      expect(repaired.outcome.issues).toEqual([])
    }

    expect(next.materialSourceId).toBe(seed.artifactId)
    expect(f.session.recipe(repaired.value.artifactId).recipe).toEqual({
      ...source,
      linearFields: materialRepair.linearFields
    })
    expect(f.compile).toHaveBeenCalledOnce()
    expect(f.execute).toHaveBeenCalledTimes(name === 'prepare_design' ? 0 : 1)
  }
)

it('uses the failed part owner guide without replaying completed material work', async () => {
  const f = setup()
  const seed = f.session.prepare({
    ...draft,
    linearFields: materialRepair.linearFields
  })
  const source = materialRecoverySource()
  const invalid = structuredClone(source)

  invalid.children[0].vertices[3].y = 10
  const input = {
    parts: [
      {
        key: 'prior',
        repair: {
          draftId: f.session.retainRejectedDraft(draft),
          replacements: []
        }
      },
      {
        key: 'surface',
        parentPart: 'prior',
        materialSourceId: seed.artifactId,
        repair: {
          draftId: f.session.retainRejectedDraft(invalid),
          replacements: []
        }
      },
      {
        key: 'later',
        parentPart: 'prior',
        materialSourceId: seed.artifactId,
        repair: {
          draftId: f.session.retainRejectedDraft(source),
          replacements: []
        }
      }
    ],
    inspection: 'defer',
    message: 'Add surfaces'
  }
  const rejected = JSON.parse(
    await f.workflow.call(
      'prepare_and_apply_design',
      input,
      new AbortController().signal
    )
  )

  expect(rejected.failedPart).toBe('surface')
  expect(rejected.parts[0].completedSteps).toContain('apply_prepared_design')
  expect(f.execute).toHaveBeenCalledTimes(1)
  const next = structuredClone(rejected.recoveryInvocation.arguments)

  expect(next.parts.map((part: { key: string }) => part.key)).toEqual([
    'surface',
    'later'
  ])
  next.parts[0].repair.replacements[0].value = source.children[0].vertices
  const repaired = JSON.parse(
    await f.workflow.call(
      rejected.recoveryInvocation.name,
      next,
      new AbortController().signal
    )
  )

  expect(repaired.failedPart).toBeUndefined()
  expect(
    repaired.parts.every((part: { completedSteps: string[] }) =>
      part.completedSteps.includes('apply_prepared_design')
    )
  ).toBe(true)
  expect(next.parts[0]).not.toHaveProperty('materialSourceId')
  expect(next.parts[1].materialSourceId).toBe(seed.artifactId)
  expect(f.execute).toHaveBeenCalledTimes(3)
  for (const [batch] of f.execute.mock.calls.slice(1)) {
    expect(batch.actions[0].arguments).toMatchObject({ parentId: 'root' })
  }

  for (const part of repaired.parts) {
    expect(f.session.recipe(part.artifactId).recipe).toEqual({
      ...source,
      linearFields: materialRepair.linearFields
    })
  }
})

it('retains material conflicts and source ownership without writes or replay', async () => {
  const leases = createLocalToolLeases({
    requestId: 'material-recovery',
    capacity: 32
  })
  const f = setup(actions, {
    ...leases,
    requestId: 'material-recovery',

    publish: (handle, release, validate) =>
      leases.publish({ handle, release, validate })
  })
  const seed = f.session.prepare({
    ...draft,
    linearFields: materialRepair.linearFields
  })
  const source = materialRecoverySource()

  const call = async (args: unknown) =>
    JSON.parse(
      await f.workflow.call(
        'prepare_and_apply_design',
        args,
        new AbortController().signal
      )
    )

  const conflict = await call({
    draft: { ...source, linearFields: materialRepair.linearFields },
    materialSourceId: seed.artifactId
  })

  expect(conflict.message).toBe(
    'materialSourceId conflicts with inline linearFields.'
  )
  expect(conflict.completedSteps).toEqual([])
  const invalid = structuredClone(source)

  invalid.children[0].vertices[3].y = 10
  const rejected = await call({
    draft: invalid,
    materialSourceId: seed.artifactId,
    inspection: 'defer'
  })
  const next = structuredClone(rejected.repairGuide.arguments)

  next.repair.replacements[0].value = source.children[0].vertices
  await expect(
    f.workflow.call('prepare_and_apply_design', next, AbortSignal.abort())
  ).rejects.toThrow()
  const foreign = setup()
  const foreignResult = JSON.parse(
    await foreign.workflow.call(
      'prepare_and_apply_design',
      next,
      new AbortController().signal
    )
  )

  expect(foreignResult).toMatchObject({
    available: false,
    settlement: 'not-started'
  })
  expect(foreign.execute).not.toHaveBeenCalled()
  f.session.release([seed.artifactId])
  const repaired = await call(next)

  expect(repaired.failedStep).toBeUndefined()
  expect(f.session.recipe(repaired.artifactId).recipe).toEqual({
    ...source,
    linearFields: materialRepair.linearFields
  })
  expect(f.execute).toHaveBeenCalledOnce()
  await leases.dispose()
  const expired = await call(next)

  expect(expired).toMatchObject({
    available: false,
    settlement: 'not-started'
  })
  expect(f.execute).toHaveBeenCalledOnce()
})

it('preserves material selectors for all raw parts retained by input admission', async () => {
  const f = setup()
  const seed = f.session.prepare({
    ...draft,
    linearFields: materialRepair.linearFields
  })
  const source = materialRecoverySource()
  const invalid = {
    ...source,
    children: source.children.map((child) => ({ ...child, vertices: [] }))
  }
  const request = {
    parts: [
      { key: 'first', materialSourceId: seed.artifactId, draft: invalid },
      {
        key: 'next',
        parentPart: 'first',
        materialSourceId: seed.artifactId,
        draft: source
      }
    ],
    inspection: 'defer',
    message: 'Recover raw parts'
  }
  const rejected = JSON.parse(
    (
      await invokeLocalTool(
        f.workflow,
        f.workflow.definitions[0],
        request,
        new AbortController().signal
      )
    ).text
  )

  expect(rejected.toolOutcome.settlement).toBe('not-started')
  expect(f.execute).not.toHaveBeenCalled()
  expect(f.compile).not.toHaveBeenCalled()
  const next = structuredClone(rejected.repairGuide.arguments)

  expect(
    next.parts.map(
      (part: { materialSourceId: string }) => part.materialSourceId
    )
  ).toEqual([seed.artifactId, seed.artifactId])
  expect(next.parts.every((part: object) => !('draft' in part))).toBe(true)
  next.parts[0].repair.replacements[0].value = source.children[0].vertices
  const repaired = JSON.parse(
    await f.workflow.call(
      rejected.repairGuide.tool,
      next,
      new AbortController().signal
    )
  )

  expect(repaired.failedPart).toBeUndefined()
  expect(f.execute).toHaveBeenCalledTimes(2)
  expect(f.compile).toHaveBeenCalledTimes(2)
  for (const part of repaired.parts) {
    expect(f.session.recipe(part.artifactId).recipe).toEqual({
      ...source,
      linearFields: materialRepair.linearFields
    })
  }
})

it('repairs resolved material directly after the original source expires', async () => {
  const f = setup()
  const source = materialRecoverySource()
  const seed = f.session.prepare({
    ...draft,
    linearFields: materialRepair.linearFields
  })
  const invalid = structuredClone(source)

  invalid.children[0].vertices[3].y = 10
  const definition = f.designs.definitions.find(
    (tool) => tool.name === 'prepare_design'
  )

  if (!definition) {
    throw new Error('Missing preparation definition')
  }

  const call = async (args: unknown) => {
    const reply = await invokeLocalTool(
      f.designs,
      definition,
      args,
      new AbortController().signal
    )

    return { value: JSON.parse(reply.text), outcome: reply.outcome }
  }

  const rejected = await call({
    draft: invalid,
    materialSourceId: seed.artifactId
  })

  expect(rejected.value.geometryIssue.code).toBe('NONPLANAR_FACE')
  f.session.release([seed.artifactId])
  const next = structuredClone(rejected.value.repairGuide.arguments)

  next.repair.replacements[0].value = source.children[0].vertices
  const repaired = await call(next)

  expect(repaired.outcome.status).toBe('success')
  expect(f.session.recipe(repaired.value.artifactId).recipe).toEqual({
    ...source,
    linearFields: materialRepair.linearFields
  })
  expect(next).not.toHaveProperty('materialSourceId')
  expect(f.execute).not.toHaveBeenCalled()
  const rawExpired = await call({
    draft: source,
    materialSourceId: seed.artifactId
  })

  expect(rawExpired.value).toMatchObject({
    available: false,
    settlement: 'not-started'
  })
  expect(f.execute).not.toHaveBeenCalled()
})

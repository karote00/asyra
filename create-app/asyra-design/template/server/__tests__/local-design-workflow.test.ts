import { describe, expect, it, vi } from 'vitest'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalOperationTools } from '../local-operation-tools'
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
const signal = () => new AbortController().signal

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
        execute.mock.calls[0][0].actions[0].arguments.design as {
          entries: unknown[]
        }
      ).entries
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

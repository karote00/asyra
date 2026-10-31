import { AiExecutionError } from '@asyra/ai-agent-runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import core from '../../contexts'
import { selectionApis } from '../../common-apis/selection'
import { createAiConversationController } from '../conversation'
import { summarizeAiTurn, canRetryAiTurn } from '../presentation'
import { operationInputIssue } from '../tool-schema'
import { observeAiAction } from '../runtime-input'
import {
  AiActionError,
  AiActionNames,
  createAiActions,
  type AiActionApis
} from '../actions'

const originalMetadata = core.getElementMetadata
const originalSelection = core.selectElements
afterEach(() => {
  core.getElementMetadata = originalMetadata
  core.selectElements = originalSelection
})

const actionApis = (): AiActionApis => ({
  changeElementGeometry: vi.fn(),
  createCompositionElement: vi.fn(),
  createCompositionElements: vi.fn(),
  createCompositionGroup: vi.fn(),
  getElementBounds: vi.fn(),
  getElementFillColor: vi.fn(),
  getElementStrokeColor: vi.fn(),
  getElementType: vi.fn(),
  removeSubtree: vi.fn(() => ({ removed: [] })),
  scaleVectorElementGeometry: vi.fn(() => true),
  selectElements: vi.fn(),
  setDrawingProgress: vi.fn(),
  setElementsVisible: vi.fn(() => ['changed' as const]),
  updateElementFillColor: vi.fn(),
  updateElementFillColors: vi.fn(() => []),
  updateElementStrokeColor: vi.fn(),
  updateElementStrokeColors: vi.fn(() => [])
})

const actionByName = (name: string, apis: AiActionApis) => {
  const action = createAiActions(apis).find(
    (candidate) => candidate.name === name
  )
  if (!action) {
    throw new Error(`Missing test action: ${name}`)
  }
  return action
}

const executionContext = () => ({
  signal: new AbortController().signal
})

describe('Asyra Design AI actions', () => {
  it('describes executable descriptor and slice fields to the model', () => {
    const action = actionByName(
      AiActionNames.INSERT_VECTOR_COMPOSITION,
      actionApis()
    )
    expect(action.inputSchema).toMatchObject({
      properties: {
        groupDescriptor: {
          required: expect.arrayContaining(['id', 'name', 'props', 'type'])
        },
        slices: {
          items: {
            required: expect.arrayContaining([
              'descriptors',
              'pointCount',
              'roles'
            ]),
            properties: {
              descriptors: {
                items: {
                  properties: {
                    type: { enum: expect.arrayContaining(['oval', 'vector']) },
                    fills: { type: 'array' }
                  }
                }
              }
            }
          }
        }
      }
    })
  })

  it('publishes one deterministic backend-facing action catalog', () => {
    const actions = createAiActions(actionApis())

    expect(actions.map(({ name }) => name)).toEqual([
      AiActionNames.REPORT_OUTCOME,
      AiActionNames.REQUEST_CLARIFICATION,
      AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE,
      AiActionNames.INSERT_VECTOR_COMPOSITION,
      AiActionNames.UPDATE_COMPOSITION_ELEMENTS,
      AiActionNames.REMOVE_AI_COMPOSITION,
      AiActionNames.REPLACE_VECTOR_COMPOSITION,
      AiActionNames.SET_ELEMENT_VISIBILITY,
      AiActionNames.SELECT_ELEMENTS
    ])
    expect(Object.isFrozen(actions)).toBe(true)
    actions.forEach((action) => {
      expect(Object.isFrozen(action)).toBe(true)
      expect(action.inputSchema).toEqual(expect.any(Object))
      expect(action).not.toHaveProperty('schema')
      expect(action).not.toHaveProperty('prepare')
    })
  })

  it('advertises canonical native component IDs accepted by the App', () => {
    const action = actionByName(
      AiActionNames.INSERT_VECTOR_COMPOSITION,
      actionApis()
    )
    const schema = JSON.stringify(action.inputSchema)
    expect(schema).toContain('"rect"')
    expect(schema).not.toContain('"rectangle"')
  })

  it('advertises structured refinement items with nested style and geometry fields', () => {
    const action = actionByName(
      AiActionNames.UPDATE_COMPOSITION_ELEMENTS,
      actionApis()
    )
    expect(action.inputSchema).toMatchObject({
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['elementId'],
            properties: {
              elementId: { type: 'string' },
              geometry: {
                properties: {
                  scaleX: { type: 'number' },
                  scaleY: { type: 'number' }
                }
              },
              style: {
                properties: {
                  fillColor: { type: 'string' },
                  strokeColor: { type: 'string' }
                }
              }
            },
            oneOf: [{ required: ['geometry'] }, { required: ['style'] }]
          }
        }
      }
    })
  })

  it('returns App-owned drawing-detail options without mutating the document', async () => {
    const apis = actionApis()
    const action = actionByName(
      AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE,
      apis
    )

    await expect(action.execute({}, executionContext())).resolves.toEqual({
      action: AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE,
      clarification: {
        kind: 'drawing-detail',
        optionIds: ['balanced', 'maximum']
      },
      status: 'no-change'
    })
    Object.values(apis).forEach((api) => {
      expect(api).not.toHaveBeenCalled()
    })
  })

  it('executes server-prepared visibility and selection through common APIs', async () => {
    const apis = actionApis()
    const visibility = actionByName(AiActionNames.SET_ELEMENT_VISIBILITY, apis)
    const selection = actionByName(AiActionNames.SELECT_ELEMENTS, apis)

    await expect(
      visibility.execute(
        {
          elementId: 'shape-1',
          visible: false
        },
        executionContext()
      )
    ).resolves.toEqual({
      action: AiActionNames.SET_ELEMENT_VISIBILITY,
      changed: true,
      elementId: 'shape-1',
      status: 'complete'
    })
    await expect(
      selection.execute(
        {
          elementIds: ['shape-1', 'shape-2']
        },
        executionContext()
      )
    ).resolves.toEqual({
      action: AiActionNames.SELECT_ELEMENTS,
      selectedCount: 2
    })
    expect(apis.setElementsVisible).toHaveBeenCalledWith(['shape-1'], false, {
      sharedDelivery: 'immediate',
      undoable: true
    })
    expect(apis.selectElements).toHaveBeenCalledWith(['shape-1', 'shape-2'], {
      sharedDelivery: 'immediate',
      undoable: true
    })
  })

  it.each([
    ['changed', 'complete', 'success', 'completed'],
    ['unchanged', 'no-change', 'success', 'completed'],
    ['unavailable', 'failed', 'failed', 'not-started']
  ] as const)(
    'preserves the visibility owner result %s through the public action receipt',
    async (ownerStatus, status, outcome, settlement) => {
      const apis = actionApis()
      const setElementsVisible = vi.fn(() => [ownerStatus])
      const action = observeAiAction(
        actionByName(AiActionNames.SET_ELEMENT_VISIBILITY, {
          ...apis,
          setElementsVisible
        })
      )
      const result = await action.execute(
        { elementId: 'shape-1', visible: false },
        executionContext()
      )
      expect(result).toMatchObject({
        elementId: 'shape-1',
        changed: ownerStatus === 'changed',
        status,
        toolOutcome: { status: outcome, settlement }
      })
      expect(setElementsVisible).toHaveBeenCalledExactlyOnceWith(
        ['shape-1'],
        false,
        { sharedDelivery: 'immediate', undoable: true }
      )
    }
  )

  it('does not change visibility when cancellation arrives at the mutation boundary', async () => {
    const apis = actionApis()
    const controller = new AbortController()
    const action = actionByName(AiActionNames.SET_ELEMENT_VISIBILITY, apis)
    await expect(
      action.execute(
        { elementId: 'shape-1', visible: false },
        {
          signal: controller.signal,
          runMutation: async (write) => {
            controller.abort(new Error('Stopped before write'))
            return write()
          }
        }
      )
    ).rejects.toThrow()
    expect(apis.setElementsVisible).not.toHaveBeenCalled()
  })

  it.each([['missing'], ['shape-1', 'missing'], ['missing', 'shape-1']])(
    'rejects unavailable selection targets atomically: %j',
    async (...ids) => {
      const apis = actionApis()
      let selected = ['previous']
      core.getElementMetadata = vi.fn((id) =>
        id === 'shape-1'
          ? ({ id, type: 'rect' } as ReturnType<typeof core.getElementMetadata>)
          : undefined
      )
      const write = vi.fn((next: string[]) => {
        selected = next
      })
      core.selectElements = write
      apis.selectElements = selectionApis.selectElements
      const action = actionByName(AiActionNames.SELECT_ELEMENTS, apis)
      await expect(
        action.execute({ elementIds: ids }, executionContext())
      ).rejects.toThrow('Selection target does not exist: missing')
      expect(selected).toEqual(['previous'])
      expect(write).not.toHaveBeenCalled()
      await expect(
        action.execute({ elementIds: ['shape-1'] }, executionContext())
      ).resolves.toMatchObject({ selectedCount: 1 })
      expect(selected).toEqual(['shape-1'])
    }
  )

  it('checks target existence at the scheduled mutation boundary', async () => {
    const apis = actionApis()
    let exists = true
    core.getElementMetadata = vi.fn((id) =>
      exists
        ? ({ id, type: 'rect' } as ReturnType<typeof core.getElementMetadata>)
        : undefined
    )
    const write = vi.fn(() => undefined)
    core.selectElements = write
    apis.selectElements = selectionApis.selectElements
    const action = actionByName(AiActionNames.SELECT_ELEMENTS, apis)
    await expect(
      action.execute(
        { elementIds: ['removed'] },
        {
          ...executionContext(),
          runMutation: async (mutate) => {
            exists = false
            return mutate()
          }
        }
      )
    ).rejects.toThrow('Selection target does not exist: removed')
    expect(write).not.toHaveBeenCalled()
  })

  it('rejects cancellation while queued before selecting any targets', async () => {
    const apis = actionApis()
    const controller = new AbortController()
    const action = actionByName(AiActionNames.SELECT_ELEMENTS, apis)
    await expect(
      action.execute(
        { elementIds: ['shape-1'] },
        {
          signal: controller.signal,
          runMutation: async (mutate) => {
            controller.abort()
            return mutate()
          }
        }
      )
    ).rejects.toBeInstanceOf(AiExecutionError)
    expect(apis.selectElements).not.toHaveBeenCalled()
  })

  it('checks abort before requesting a common API mutation', async () => {
    const apis = actionApis()
    const action = actionByName(AiActionNames.SET_ELEMENT_VISIBILITY, apis)
    const controller = new AbortController()
    controller.abort()

    await expect(
      action.execute(
        {
          elementId: 'shape-1',
          visible: false
        },
        {
          signal: controller.signal
        }
      )
    ).rejects.toBeInstanceOf(AiActionError)
    expect(apis.setElementsVisible).not.toHaveBeenCalled()
  })
})

describe('reported capability boundaries', () => {
  it('returns a specific unsupported outcome without mutating the canvas', async () => {
    const apis = actionApis()
    const result = await actionByName(
      AiActionNames.REPORT_OUTCOME,
      apis
    ).execute(
      {
        outcome: 'unsupported',
        message: 'This app cannot generate raster images.'
      },
      executionContext()
    )
    expect(result).toMatchObject({
      status: 'no-change',
      outcome: 'unsupported',
      message: 'This app cannot generate raster images.'
    })
    for (const api of Object.values(apis)) {
      expect(api).not.toHaveBeenCalled()
    }
  })
})

it('reports drawing completion separately from durable document acknowledgement', async () => {
  const confirmation = vi.fn(async () => ({
    status: 'durable' as const,
    documentId: 'drawing',
    documentGeneration: 0,
    sequence: 7,
    durableSequence: 8
  }))
  const action = requireTestValue(
    createAiActions(actionApis(), {
      confirmPersistence: confirmation
    }).find((item) => item.name === AiActionNames.REPORT_OUTCOME)
  )
  await expect(
    action.execute(
      { outcome: 'completed', message: 'Drawing completed.' },
      executionContext()
    )
  ).resolves.toMatchObject({
    outcome: 'completed',
    persistence: { status: 'durable', sequence: 7, durableSequence: 8 }
  })
  expect(confirmation).toHaveBeenCalledOnce()
})

it('retains completed drawing work when persistence confirmation is unavailable', async () => {
  const action = requireTestValue(
    createAiActions(actionApis(), {
      confirmPersistence: async () => {
        throw new Error('offline')
      }
    }).find((item) => item.name === AiActionNames.REPORT_OUTCOME)
  )
  await expect(
    action.execute(
      { outcome: 'completed', message: 'Drawing completed.' },
      executionContext()
    )
  ).resolves.toMatchObject({
    outcome: 'completed',
    status: 'partial',
    persistence: { status: 'unavailable', message: 'offline' }
  })
})

it.each(['unavailable', 'local-only', 'durable'] as const)(
  'carries actual completion storage status through conversation and presentation - %s',
  async (storage) => {
    const confirmPersistence = vi.fn(async () => {
      if (storage === 'unavailable') {
        throw new Error('offline')
      }
      if (storage === 'local-only') {
        return { status: storage } as const
      }
      return {
        status: storage,
        documentId: 'drawing',
        documentGeneration: 0,
        sequence: 7,
        durableSequence: 7
      } as const
    })
    const definition = requireTestValue(
      createAiActions(actionApis(), { confirmPersistence }).find(
        (action) => action.name === AiActionNames.REPORT_OUTCOME
      )
    )
    const action = observeAiAction(definition)
    const controller = createAiConversationController({
      getElementType: () => undefined,
      feature: {
        cancel: () => false,
        execute: async () => {
          const result = await action.execute(
            { outcome: 'completed', message: 'Drawing saved successfully.' },
            executionContext()
          )
          expect(
            operationInputIssue(result, definition.outputSchema)
          ).toBeUndefined()
          return {
            status: 'executed',
            actionResults: [
              { actionId: 'finish', actionName: action.name, result }
            ]
          }
        }
      }
    })
    try {
      const turn = await controller.submit('Finish this drawing')
      const summary = summarizeAiTurn(turn)
      if (storage === 'unavailable') {
        expect(turn.outcome).toBe('partial')
        expect(summary.message).toContain('could not be confirmed')
        expect(summary.message).not.toContain('saved successfully')
      } else if (storage === 'local-only') {
        expect(summary.message).toContain('locally')
        expect(summary.message).not.toContain('saved successfully')
      } else {
        expect(summary.message).toBe('Drawing saved successfully.')
      }
      expect(canRetryAiTurn(turn)).toBe(false)
      expect(confirmPersistence).toHaveBeenCalledOnce()
    } finally {
      controller.dispose()
    }
  }
)

const requireTestValue = <T>(value: T | undefined | null): T => {
  if (value == null) {
    throw new Error('Required test fixture is unavailable')
  }
  return value
}

it.each([
  [AiActionNames.REQUEST_CLARIFICATION, { question: '   ' }],
  [AiActionNames.REPORT_OUTCOME, { outcome: 'completed', message: '\t ' }]
])(
  'publishes the existing nonblank control-input constraint for %s',
  async (name, input) => {
    const action = actionByName(name as string, actionApis())
    await expect(
      action.execute(input as never, executionContext())
    ).rejects.toThrow()
    expect(operationInputIssue(input, action.inputSchema)).toBeDefined()
  }
)

it.each([
  [
    AiActionNames.REQUEST_CLARIFICATION,
    { question: '  Which material?  ' },
    {
      status: 'no-change',
      clarification: { kind: 'question', question: 'Which material?' }
    }
  ],
  [
    AiActionNames.REQUEST_DRAWING_DETAIL_CHOICE,
    {},
    { status: 'no-change', clarification: { kind: 'drawing-detail' } }
  ],
  [
    AiActionNames.REPORT_OUTCOME,
    { outcome: 'unsupported', message: '  No matching capability.  ' },
    {
      status: 'no-change',
      outcome: 'unsupported',
      message: 'No matching capability.'
    }
  ],
  [
    AiActionNames.REPORT_OUTCOME,
    { outcome: 'completed', message: '  Ready.  ' },
    {
      status: 'no-change',
      outcome: 'completed',
      message: 'Ready.',
      persistence: { status: 'local-only' }
    }
  ]
])(
  'executes control %s through public admission without document writes',
  async (name, input, expected) => {
    const apis = actionApis()
    const action = observeAiAction(actionByName(name as string, apis))
    const result = await action.execute(input as never, executionContext())
    expect(result).toMatchObject(expected as object)
    expect(operationInputIssue(result, action.outputSchema)).toBeUndefined()
    for (const api of Object.values(apis)) {
      expect(api).not.toHaveBeenCalled()
    }
    await expect(
      action.execute(input as never, { signal: AbortSignal.abort() })
    ).rejects.toThrow()
    for (const api of Object.values(apis)) {
      expect(api).not.toHaveBeenCalled()
    }
  }
)

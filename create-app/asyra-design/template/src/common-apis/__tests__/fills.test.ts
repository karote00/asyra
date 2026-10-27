import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  readElementPropertyTargets: vi.fn(),
  shareElementPropertyTargets: vi.fn(),
  detachElementPropertyTargets: vi.fn(),
  commitPropertyChanges: vi.fn(),
  getElementById: vi.fn(),
  patchElementProperties: vi.fn(),
  updateElementProperties: vi.fn(),
  runTransaction: vi.fn((operation: () => unknown) => operation()),
  updatePropertyById: vi.fn()
}))

vi.mock('../../contexts', () => ({
  default: {
    readElementPropertyTargets: mocks.readElementPropertyTargets,
    shareElementPropertyTargets: mocks.shareElementPropertyTargets,
    detachElementPropertyTargets: mocks.detachElementPropertyTargets,
    commitPropertyChanges: mocks.commitPropertyChanges,
    getElementComputedData: (elementId: string) =>
      mocks.getElementById(elementId)?.getAllComputedData(),
    getElementData: (elementId: string) =>
      mocks.getElementById(elementId) ? { id: elementId } : undefined,
    patchElementProperties: mocks.patchElementProperties,
    updateElementProperties: mocks.updateElementProperties,
    updatePropertyById: mocks.updatePropertyById
  }
}))

vi.mock('../transaction', () => ({
  transactionApis: {
    runTransaction: mocks.runTransaction
  }
}))

import { fillApis } from '../fills'

beforeEach(() => {
  mocks.patchElementProperties.mockImplementation((updates) => ({
    acceptedIds: [
      ...new Set(
        updates.map((update: { elementId: string }) => update.elementId)
      )
    ],
    changed: updates.length > 0
  }))
  mocks.shareElementPropertyTargets.mockImplementation((updates) => ({
    acceptedIds: [
      ...new Set(
        updates.map(
          (update: { target: { elementId: string } }) => update.target.elementId
        )
      )
    ],
    changed: updates.length > 0
  }))
  mocks.detachElementPropertyTargets.mockImplementation((targets) => ({
    acceptedIds: [
      ...new Set(
        targets.map((target: { elementId: string }) => target.elementId)
      )
    ],
    changed: targets.length > 0
  }))
})

describe('fill common API primary-color boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getElementById.mockReturnValue({
      getAllComputedData: () => ({
        fills: [
          {
            color: '#050504',
            colorFormat: 'hex',
            id: 'fill-1',
            opacity: 1,
            type: 'fill',
            visible: true
          }
        ],
        height: 39,
        width: 16
      })
    })
  })

  it('adds and removes one repeatable fill through canonical record patches', () => {
    const fillId = fillApis.addFill('pupil-left', { undoable: true })

    expect(fillId).toEqual(expect.any(String))
    expect(fillId).not.toBe('')
    expect(mocks.patchElementProperties).toHaveBeenNthCalledWith(
      1,
      [
        {
          elementId: 'pupil-left',
          records: [
            {
              key: 'fills',
              set: {
                [fillId as string]: expect.objectContaining({
                  color: '#cccccc',
                  kind: 'solid',
                  visible: true
                })
              }
            }
          ]
        }
      ],
      { undoable: true }
    )

    expect(
      fillApis.removeFill('pupil-left', 'fill-1', { undoable: true })
    ).toBe(true)
    expect(mocks.patchElementProperties).toHaveBeenNthCalledWith(
      2,
      [
        {
          elementId: 'pupil-left',
          records: [
            {
              key: 'fills',
              remove: ['fill-1']
            }
          ]
        }
      ],
      { undoable: true }
    )
    expect(mocks.runTransaction).toHaveBeenCalledTimes(2)
  })

  it('reads and patches the first canonical fill through one Core record batch', () => {
    expect(fillApis.getPrimaryFillColor('pupil-left')).toBe('#050504')

    expect(
      fillApis.updatePrimaryFillColor('pupil-left', '#DC2626', {
        sharedDelivery: 'transaction-end',
        undoable: true
      })
    ).toBe(true)

    expect(mocks.patchElementProperties).toHaveBeenCalledWith(
      [
        {
          elementId: 'pupil-left',
          records: [
            {
              key: 'fills',
              set: {
                'fill-1': {
                  color: '#DC2626'
                }
              }
            }
          ]
        }
      ],
      {
        sharedDelivery: 'transaction-end',
        undoable: true
      }
    )
    expect(mocks.runTransaction).toHaveBeenCalledOnce()
    expect(mocks.updatePropertyById).not.toHaveBeenCalled()
    expect(mocks.commitPropertyChanges).not.toHaveBeenCalled()
  })

  it('returns false without a write for missing fills or an unchanged color', () => {
    expect(fillApis.updatePrimaryFillColor('pupil-left', '#050504')).toBe(false)
    mocks.getElementById.mockReturnValue({
      getAllComputedData: () => ({ fills: [] })
    })

    expect(fillApis.getPrimaryFillColor('missing-fill')).toBeNull()
    expect(fillApis.updatePrimaryFillColor('missing-fill', '#DC2626')).toBe(
      false
    )
    expect(mocks.patchElementProperties).not.toHaveBeenCalled()
  })

  it('applies ordered primary fill colors with one Core patch batch', () => {
    mocks.getElementById.mockImplementation((elementId: string) => ({
      getAllComputedData: () => ({
        fills: [
          {
            color: '#050504',
            id: `fill-${elementId}`,
            type: 'fill'
          }
        ]
      })
    }))
    const options = {
      sharedDelivery: 'immediate',
      undoable: true
    } as const

    expect(
      fillApis.updatePrimaryFillColors(
        [
          { color: '#DC2626', elementId: 'pupil-left' },
          { color: '#DC2626', elementId: 'pupil-right' }
        ],
        options
      )
    ).toEqual(['changed', 'changed'])
    expect(mocks.patchElementProperties).toHaveBeenCalledOnce()
    expect(mocks.patchElementProperties).toHaveBeenCalledWith(
      [
        {
          elementId: 'pupil-left',
          records: [
            {
              key: 'fills',
              set: {
                'fill-pupil-left': {
                  color: '#DC2626'
                }
              }
            }
          ]
        },
        {
          elementId: 'pupil-right',
          records: [
            {
              key: 'fills',
              set: {
                'fill-pupil-right': {
                  color: '#DC2626'
                }
              }
            }
          ]
        }
      ],
      options
    )
    expect(mocks.runTransaction).toHaveBeenCalledOnce()
    expect(mocks.updatePropertyById).not.toHaveBeenCalled()
    expect(mocks.commitPropertyChanges).not.toHaveBeenCalled()
  })

  it('aligns partial batch results and skips an empty transaction', () => {
    mocks.getElementById.mockImplementation((elementId: string) => {
      if (elementId === 'missing') {
        return undefined
      }
      return {
        getAllComputedData: () => ({
          fills: [
            {
              color: '#050504',
              id: `fill-${elementId}`,
              type: 'fill'
            }
          ]
        })
      }
    })

    expect(
      fillApis.updatePrimaryFillColors([
        { color: '#DC2626', elementId: 'changed' },
        { color: '#050504', elementId: 'unchanged' },
        { color: '#DC2626', elementId: 'missing' }
      ])
    ).toEqual(['changed', 'unchanged', 'unavailable'])
    expect(mocks.patchElementProperties).toHaveBeenCalledOnce()
    expect(mocks.patchElementProperties).toHaveBeenCalledWith(
      [
        {
          elementId: 'changed',
          records: [
            {
              key: 'fills',
              set: {
                'fill-changed': {
                  color: '#DC2626'
                }
              }
            }
          ]
        }
      ],
      undefined
    )
    expect(mocks.runTransaction).toHaveBeenCalledOnce()

    vi.clearAllMocks()
    mocks.getElementById.mockReturnValue({
      getAllComputedData: () => ({
        fills: [
          {
            color: '#050504',
            id: 'fill-unchanged',
            type: 'fill'
          }
        ]
      })
    })
    expect(
      fillApis.updatePrimaryFillColors([
        { color: '#050504', elementId: 'unchanged' }
      ])
    ).toEqual(['unchanged'])
    expect(mocks.patchElementProperties).not.toHaveBeenCalled()
    expect(mocks.runTransaction).not.toHaveBeenCalled()
  })

  it('patches only new fill values without reading or forwarding a caller snapshot', () => {
    const options = {
      sharedDelivery: 'transaction-end',
      undoable: true
    } as const
    fillApis.updateFillFields(
      'rect-1',
      'fill-1',
      {
        opacity: 0.5,
        visible: false
      },
      options
    )
    expect(mocks.getElementById).not.toHaveBeenCalled()
    expect(mocks.patchElementProperties).toHaveBeenCalledExactlyOnceWith(
      [
        {
          elementId: 'rect-1',
          records: [
            {
              key: 'fills',
              set: {
                'fill-1': { opacity: 0.5, visible: false }
              }
            }
          ]
        }
      ],
      options
    )
    expect(mocks.runTransaction).toHaveBeenCalledOnce()
    expect(mocks.commitPropertyChanges).not.toHaveBeenCalled()
  })

  it('does not open a transaction for an empty or undefined fill patch', () => {
    fillApis.updateFillFields('rect-1', 'fill-1', {})
    fillApis.updateFillFields('rect-1', 'fill-1', { opacity: undefined })
    expect(mocks.patchElementProperties).not.toHaveBeenCalled()
    expect(mocks.runTransaction).not.toHaveBeenCalled()
  })

  it('updates one field without requiring other fill data', () => {
    fillApis.updateFillField('rect-1', 'fill-1', 'color', '#123456')
    expect(mocks.patchElementProperties).toHaveBeenCalledWith(
      [
        {
          elementId: 'rect-1',
          records: [
            {
              key: 'fills',
              set: {
                'fill-1': { color: '#123456' }
              }
            }
          ]
        }
      ],
      undefined
    )
  })
})

describe('plural Fill new-value operations', () => {
  beforeEach(() => vi.clearAllMocks())
  it('submits distinct patches once and validates an empty target without forwarding old values', () => {
    mocks.getElementById.mockReturnValue({
      getAllComputedData: () => ({ fills: [{ id: 'fa' }] })
    })
    fillApis.updateFillFieldsBatch([
      { elementId: 'a', fillId: 'fa', patch: { opacity: 0.3 } },
      { elementId: 'b', fillId: 'fb', patch: { visible: false } },
      { elementId: 'a', fillId: 'fa', patch: {} }
    ])
    expect(mocks.getElementById).toHaveBeenCalledExactlyOnceWith('a')
    expect(mocks.patchElementProperties).toHaveBeenCalledExactlyOnceWith(
      [
        {
          elementId: 'a',
          records: [{ key: 'fills', set: { fa: { opacity: 0.3 } } }]
        },
        {
          elementId: 'b',
          records: [{ key: 'fills', set: { fb: { visible: false } } }]
        }
      ],
      undefined
    )
    expect(mocks.runTransaction).toHaveBeenCalledTimes(1)
  })
  it('keeps empty plural calls inert', () => {
    fillApis.updateFillFieldsBatch([])
    fillApis.addFills([])
    fillApis.removeFills([])
    expect(mocks.runTransaction).not.toHaveBeenCalled()
  })
})

it('rejects misplaced Fill fields before applying any prefix of a batch', () => {
  vi.clearAllMocks()
  expect(() =>
    fillApis.updateFillFieldsBatch([
      { elementId: 'a', fillId: 'fa', patch: { opacity: 0.2 } },
      {
        elementId: 'b',
        fillId: 'fb',
        patch: { color: '#123456', gradientType: 'linear' } as never
      }
    ])
  ).toThrow(/gradientType/)
  expect(mocks.patchElementProperties).not.toHaveBeenCalled()
  expect(mocks.runTransaction).not.toHaveBeenCalled()
})

describe('Fill property reuse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readElementPropertyTargets.mockImplementation((targets) =>
      targets.map((target) =>
        target.path.length
          ? {
              propertyId: `fill-${target.elementId}`,
              mode: 'independent'
            }
          : {
              propertyId: `root-${target.elementId}`,
              children:
                target.elementId === 'missing'
                  ? []
                  : [
                      {
                        key: 'fills',
                        childId: `slot-${target.elementId}`,
                        propertyId: `fill-${target.elementId}`
                      },
                      {
                        key: 'fills',
                        childId: `second-${target.elementId}`,
                        propertyId: `second-${target.elementId}`
                      }
                    ]
            }
      )
    )
    mocks.getElementById.mockImplementation((elementId: string) => ({
      getAllComputedData: () => ({
        fills: [
          { id: `fill-${elementId}`, color: '#123456', opacity: 0.4 },
          { id: `second-${elementId}`, color: '#abcdef' }
        ]
      })
    }))
  })
  it('resolves a uniform patch once per target and writes one plural batch', () => {
    fillApis.updateFillsAtIndex(['a', 'b'], 0, { color: '#ffffff' })
    expect(mocks.getElementById).toHaveBeenCalledTimes(2)
    expect(mocks.patchElementProperties).toHaveBeenCalledOnce()
    expect(mocks.patchElementProperties.mock.calls[0][0]).toEqual(
      ['a', 'b'].map((elementId) => ({
        elementId,
        records: [
          { key: 'fills', set: { [`fill-${elementId}`]: { color: '#ffffff' } } }
        ]
      }))
    )
  })
  it('applies aligned new patches without returning Fill IDs and rejects mismatched input before writes', () => {
    fillApis.updateFillsAtIndex(['a', 'b'], 0, [
      { color: '#ffffff' },
      { opacity: 0.8 }
    ])
    expect(mocks.getElementById).toHaveBeenCalledTimes(2)
    expect(mocks.patchElementProperties).toHaveBeenCalledOnce()
    expect(mocks.patchElementProperties.mock.calls[0][0]).toEqual([
      {
        elementId: 'a',
        records: [{ key: 'fills', set: { 'fill-a': { color: '#ffffff' } } }]
      },
      {
        elementId: 'b',
        records: [{ key: 'fills', set: { 'fill-b': { opacity: 0.8 } } }]
      }
    ])
    vi.clearAllMocks()
    expect(() =>
      fillApis.updateFillsAtIndex(['a', 'b'], 0, [{ color: '#ffffff' }])
    ).toThrow(/aligned/)
    expect(mocks.patchElementProperties).not.toHaveBeenCalled()
    expect(mocks.runTransaction).not.toHaveBeenCalled()
  })
  it('rejects duplicate row targets before any lookup or mutation', () => {
    for (const patch of [
      { color: '#ffffff' },
      [{ color: '#ffffff' }, { color: '#000000' }]
    ]) {
      expect(() => fillApis.updateFillsAtIndex(['a', 'a'], 0, patch)).toThrow(
        /unique/
      )
    }
    expect(mocks.getElementById).not.toHaveBeenCalled()
    expect(mocks.patchElementProperties).not.toHaveBeenCalled()
    expect(mocks.runTransaction).not.toHaveBeenCalled()
  })
  it('rejects duplicate sharing destinations before lookup or writes', () => {
    expect(() => fillApis.shareFillAtIndex('a', ['b', 'b'], 0)).toThrow(
      /unique/
    )
    expect(mocks.getElementById).not.toHaveBeenCalled()
    expect(mocks.updateElementProperties).not.toHaveBeenCalled()
  })
  it('shares canonical logical slots rather than replacing effective membership IDs', () => {
    fillApis.shareFillAtIndex('a', ['b', 'c'], 0)
    expect(mocks.shareElementPropertyTargets).toHaveBeenCalledWith(
      ['b', 'c'].map((elementId) => ({
        target: {
          elementId,
          propertyName: 'fills',
          path: [{ key: 'fills', childId: `slot-${elementId}` }],
          expectedRootId: `root-${elementId}`,
          expectedPropertyId: `fill-${elementId}`
        },
        sourceId: 'fill-a'
      })),
      undefined
    )
    expect(mocks.updateElementProperties).not.toHaveBeenCalled()
    expect(mocks.patchElementProperties).not.toHaveBeenCalled()
  })
  it('rejects a source-backed row without silently dropping its overrides', () => {
    const read = mocks.readElementPropertyTargets.getMockImplementation()
    if (!read) throw new Error('Missing target read fixture')
    mocks.readElementPropertyTargets.mockImplementation((targets) =>
      read(targets).map((view, i) =>
        targets[i].path.length
          ? { ...view, mode: 'source-backed', sourceId: 'other-source' }
          : view
      )
    )
    expect(() => fillApis.shareFillAtIndex('a', ['b'], 0)).toThrow(
      /independent source/
    )
    expect(mocks.shareElementPropertyTargets).not.toHaveBeenCalled()
    expect(mocks.runTransaction).not.toHaveBeenCalled()
  })
  it('rejects a missing target row before linking any earlier target', () => {
    mocks.getElementById.mockImplementation((elementId: string) => ({
      getAllComputedData: () => ({
        fills: elementId === 'missing' ? [] : [{ id: `fill-${elementId}` }]
      })
    }))
    expect(() => fillApis.shareFillAtIndex('a', ['b', 'missing'], 0)).toThrow(
      /Missing/
    )
    expect(mocks.updateElementProperties).not.toHaveBeenCalled()
  })
  it('detaches through the canonical owner, preserving logical slots and other rows', () => {
    fillApis.detachFillsAtIndex(['a'], 0)
    expect(mocks.detachElementPropertyTargets).toHaveBeenCalledWith(
      [
        {
          elementId: 'a',
          propertyName: 'fills',
          path: [{ key: 'fills', childId: 'slot-a' }],
          expectedRootId: 'root-a',
          expectedPropertyId: 'fill-a'
        }
      ],
      undefined
    )
    expect(mocks.updateElementProperties).not.toHaveBeenCalled()
    expect(mocks.patchElementProperties).not.toHaveBeenCalled()
  })
})

it('delivers actual primary-color owner outcomes through registered action and host classification without replay', async () => {
  const { createBasicApiActions } = await import('../../ai/basic-api-actions')
  const { designActionOutcome } = await import('../../ai/tool-contract')
  const { localToolOutcome } =
    await import('../../../server/local-tool-invocation')
  vi.clearAllMocks()
  mocks.getElementById.mockImplementation((id: string) =>
    id === 'missing'
      ? undefined
      : {
          getAllComputedData: () => ({
            fills: [{ id: `fill-${id}`, color: '#111111', type: 'fill' }]
          })
        }
  )
  const action = createBasicApiActions(
    () => ({
      core: {},
      element: {},
      selection: {},
      hierarchy: {},
      viewport: {},
      stroke: {},
      fill: fillApis
    }),
    { observe: () => () => undefined, resolve: () => 'live' }
  ).find((entry) => entry.name === 'api_fill_updatePrimaryFillColors')
  if (!action) throw new Error('Missing primary Fill action')
  const context = {
    signal: new AbortController().signal,
    runMutation: async <T>(write: () => T) => write()
  }
  for (const [updates, status] of [
    [[], 'success'],
    [[{ elementId: 'same', color: '#111111' }], 'success'],
    [[{ elementId: 'missing', color: '#222222' }], 'failed'],
    [
      [
        { elementId: 'changed', color: '#222222' },
        { elementId: 'same', color: '#111111' },
        { elementId: 'missing', color: '#222222' }
      ],
      'partial'
    ]
  ] as const) {
    const result = await action.execute({ updates }, context)
    const toolOutcome = designActionOutcome(result)
    expect(toolOutcome.status).toBe(status)
    expect(
      localToolOutcome({
        actionResults: [
          {
            actionName: action.name,
            result: { ...(result as object), toolOutcome }
          }
        ]
      }).status
    ).toBe(status)
  }
  expect(mocks.patchElementProperties).toHaveBeenCalledOnce()
  expect(mocks.patchElementProperties.mock.calls[0][0]).toEqual([
    {
      elementId: 'changed',
      records: [{ key: 'fills', set: { 'fill-changed': { color: '#222222' } } }]
    }
  ])
  await expect(
    action.execute(
      { updates: [{ elementId: 'changed', color: '#333333' }] },
      { ...context, signal: AbortSignal.abort() }
    )
  ).rejects.toThrow()
  expect(mocks.patchElementProperties).toHaveBeenCalledOnce()
})

it('preserves canonical changed evidence and validates empty-patch targets', () => {
  mocks.getElementById.mockReturnValue({
    getAllComputedData: () => ({ fills: [{ id: 'fill-1', opacity: 1 }] })
  })
  mocks.patchElementProperties.mockReturnValue({
    acceptedIds: ['pupil-left'],
    changed: false
  })
  expect(
    fillApis.updateFillFieldsBatch([
      { elementId: 'pupil-left', fillId: 'fill-1', patch: { opacity: 1 } }
    ])
  ).toMatchObject({
    acceptedIds: ['pupil-left'],
    unavailableIds: [],
    changed: false
  })
  mocks.patchElementProperties.mockReturnValue({
    acceptedIds: ['pupil-left'],
    changed: true
  })
  expect(
    fillApis.removeFills([{ elementId: 'pupil-left', fillId: 'fill-1' }])
  ).toMatchObject({
    acceptedIds: ['pupil-left'],
    unavailableIds: [],
    changed: true
  })
  expect(fillApis.removeFills([])).toMatchObject({
    acceptedIds: [],
    unavailableIds: [],
    changed: false
  })
  mocks.getElementById.mockReturnValue(undefined)
  expect(() =>
    fillApis.updateFillFieldsBatch([
      { elementId: 'missing', fillId: 'missing-fill', patch: {} }
    ])
  ).toThrow()
})

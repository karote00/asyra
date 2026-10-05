import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  commitPropertyChanges: vi.fn(),
  getElementById: vi.fn(),
  patchElementProperties: vi.fn(),
  updateElementProperties: vi.fn(),
  runTransaction: vi.fn((operation: () => unknown) => operation()),
  updatePropertyById: vi.fn()
}))

vi.mock('../../contexts', () => ({
  default: {
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
    ).toEqual([true, true])
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
    ).toEqual([true, false, false])
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
    ).toEqual([false])
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
  it('submits distinct target patches once without reading old values', () => {
    fillApis.updateFillFieldsBatch([
      { elementId: 'a', fillId: 'fa', patch: { opacity: 0.3 } },
      { elementId: 'b', fillId: 'fb', patch: { visible: false } },
      { elementId: 'a', fillId: 'fa', patch: {} }
    ])
    expect(mocks.getElementById).not.toHaveBeenCalled()
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
  it('links only the chosen child Fill property, leaving other rows intact', () => {
    fillApis.shareFillAtIndex('a', ['b', 'c'], 0)
    expect(mocks.updateElementProperties).toHaveBeenCalledWith(
      [
        { elementId: 'b', values: { fills: ['fill-a', 'second-b'] } },
        { elementId: 'c', values: { fills: ['fill-a', 'second-c'] } }
      ],
      undefined
    )
    expect(mocks.patchElementProperties).not.toHaveBeenCalled()
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
  it('detaches into a new child ID with current values and preserves other references', () => {
    fillApis.detachFillsAtIndex(['a'], 0)
    const change = mocks.updateElementProperties.mock.calls[0][0][0]
    const newId = change.values.fills[0]
    expect(newId).not.toBe('fill-a')
    expect(
      mocks.patchElementProperties.mock.calls[0][0][0].records[0].set[newId]
    ).toMatchObject({ color: '#123456', opacity: 0.4 })
    expect(change.values.fills[1]).toBe('second-a')
  })
})

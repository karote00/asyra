import { describe, expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({ default: {} }))
vi.mock('@asyra/core', () => ({ runTransaction: (fn: () => unknown) => fn() }))
vi.mock('@asyra/preset', () => ({
  projectGroupGeometryPropertyUpdates: vi.fn()
}))
import { createDesignArranger } from '../design-arrangement'

const fixture = () => {
  const records: Record<
    string,
    { type: string; parentId?: string; lock?: boolean }
  > = {
    w: { type: 'workspace' },
    f: { type: 'frame', parentId: 'w' },
    a: { type: 'rect', parentId: 'f' },
    b: { type: 'text', parentId: 'f' },
    c: { type: 'oval', parentId: 'f' }
  }
  const geometry: Record<string, Record<string, number>> = {
    a: { x: 10, y: 20, width: 20, height: 30 },
    b: { x: 70, y: 80, width: 40, height: 50 },
    c: { x: 160, y: 160, width: 30, height: 20 }
  }
  const apis = {
    read: vi.fn((id: string) => records[id]),
    geometry: vi.fn((id: string) => geometry[id]),
    corner: vi.fn(
      (id: string, _parent: string, p: { x: number; y: number }) => ({
        x: geometry[id].x + p.x,
        y: geometry[id].y + p.y
      })
    ),
    apply: vi.fn()
  }
  return { arrange: createDesignArranger(apis), apis, records, geometry }
}
describe('native design arrangement', () => {
  it.each([
    ['horizontal', 'start', 10, 10],
    ['horizontal', 'center', 90, 80],
    ['horizontal', 'end', 170, 150],
    ['vertical', 'start', 20, 20],
    ['vertical', 'center', 85, 75],
    ['vertical', 'end', 150, 130]
  ] as const)(
    'aligns %s %s without resizing or changing the other coordinate',
    (axis, alignment, a, b) => {
      const { arrange, apis } = fixture()
      const result = arrange({
        operation: 'align',
        axis,
        alignment,
        elementIds: ['a', 'b', 'c']
      })
      const key = axis === 'horizontal' ? 'x' : 'y'
      const patches = apis.apply.mock.calls[0]?.[0] ?? []
      expect(result.positions.find((p) => p.elementId === 'a')?.[key]).toBe(a)
      expect(result.positions.find((p) => p.elementId === 'b')?.[key]).toBe(b)
      for (const patch of patches)
        expect(Object.keys(patch.values)).toEqual([key])
    }
  )
  it('distributes unequal widths in spatial order with fixed outer edges', () => {
    const { arrange, apis } = fixture()
    expect(
      arrange({
        operation: 'distribute',
        axis: 'horizontal',
        elementIds: ['c', 'a', 'b']
      })
    ).toMatchObject({
      positions: [
        { elementId: 'a', x: 10 },
        { elementId: 'b', x: 75 },
        { elementId: 'c', x: 160 }
      ]
    })
    expect(apis.apply).toHaveBeenCalledExactlyOnceWith(
      [{ elementId: 'b', values: { x: 75 } }],
      []
    )
    expect(apis.read).toHaveBeenCalledTimes(5)
    expect(apis.geometry).toHaveBeenCalledTimes(3)
    expect(apis.corner).toHaveBeenCalledTimes(12)
  })
  it('uses explicit spacing and fresh geometry on subsequent calls', () => {
    const { arrange, geometry } = fixture()
    const request = {
      operation: 'distribute',
      axis: 'vertical',
      gap: 12,
      elementIds: ['a', 'b', 'c']
    } as const
    expect(arrange(request).positions).toEqual([
      { elementId: 'a', y: 20 },
      { elementId: 'b', y: 62 },
      { elementId: 'c', y: 124 }
    ])
    geometry.a.height = 40
    expect(arrange(request).positions[1].y).toBe(72)
  })
  it('uses actual projected bounds for rotated shapes', () => {
    const { arrange, apis } = fixture()
    apis.corner.mockImplementation((id, _parent, p) =>
      id === 'a' ? { x: 40 - p.y, y: 20 + p.x } : { x: 70 + p.x, y: 80 + p.y }
    )
    expect(
      arrange({
        operation: 'align',
        axis: 'horizontal',
        alignment: 'end',
        elementIds: ['a', 'b']
      }).positions[0]
    ).toEqual({ elementId: 'a', x: 80 })
  })
  it('does not write unchanged alignment', () => {
    const { arrange, apis, geometry } = fixture()
    geometry.b.x = geometry.a.x
    expect(
      arrange({
        operation: 'align',
        axis: 'horizontal',
        alignment: 'start',
        elementIds: ['a', 'b']
      }).status
    ).toBe('no-change')
    expect(apis.apply).not.toHaveBeenCalled()
  })
  it.each([
    null,
    {},
    { operation: 'align', axis: 'horizontal', elementIds: ['a', 'b'] },
    { operation: 'distribute', axis: 'horizontal', elementIds: ['a', 'a'] },
    {
      operation: 'distribute',
      axis: 'horizontal',
      elementIds: ['a', 'b'],
      gap: -1
    },
    {
      operation: 'align',
      axis: 'horizontal',
      alignment: 'start',
      elementIds: ['a', 'b'],
      gap: 1
    }
  ])(
    'rejects invalid arguments before observations or writes: %j',
    (request) => {
      const { arrange, apis } = fixture()
      expect(() => arrange(request as never)).toThrow()
      expect(apis.read).not.toHaveBeenCalled()
      expect(apis.apply).not.toHaveBeenCalled()
    }
  )
  it.each([
    'locked',
    'missing',
    'different-parent',
    'bad-geometry',
    'bad-projection',
    'negative-gap'
  ] as const)('rejects %s before any write', (reason) => {
    const { arrange, apis, records, geometry } = fixture()
    if (reason === 'locked') records.f.lock = true
    if (reason === 'missing') delete records.b
    if (reason === 'different-parent') records.b.parentId = 'w'
    if (reason === 'bad-geometry') geometry.b.width = NaN
    if (reason === 'bad-projection')
      apis.corner.mockReturnValue({ x: Infinity, y: 0 })
    if (reason === 'negative-gap') geometry.b.x = 11
    expect(() =>
      arrange({
        operation: 'distribute',
        axis: 'horizontal',
        elementIds: ['a', 'b']
      })
    ).toThrow()
    expect(apis.apply).not.toHaveBeenCalled()
  })
})

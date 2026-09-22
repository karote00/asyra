import { expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({ default: {} }))
import { createDesignReviewer } from '../design-review'
const fixture = () => {
  const data: Record<
    string,
    { type: string; children?: string[]; parentId?: string; visible?: boolean }
  > = {
    f: { type: 'frame', children: ['t'] },
    t: { type: 'text', parentId: 'f' }
  }
  const geometry: Record<string, Record<string, unknown>> = {
    f: { x: 0, y: 0, width: 300, height: 200, rotation: 0 },
    t: { x: 10, y: 20, width: 100, height: 30, rotation: 0 }
  }
  const apis = {
    read: vi.fn((id: string) => data[id]),
    computed: vi.fn((id: string) => geometry[id]),
    measure: vi.fn(() => [
      { elementId: 't', bounds: { x: 0, y: 0, width: 90, height: 60 } }
    ])
  }
  return { review: createDesignReviewer(apis), apis, data, geometry }
}
it('reports actual text overflow from one measurement batch and selected reads', () => {
  const { review, apis } = fixture()
  expect(review('f')).toMatchObject({
    complete: true,
    checkedElements: 2,
    findings: [{ kind: 'text-overflow', elementId: 't', bottom: 30 }]
  })
  expect(apis.read).toHaveBeenCalledTimes(2)
  expect(apis.computed).toHaveBeenCalledTimes(2)
  expect(apis.computed.mock.calls[0][1]).toEqual([
    'x',
    'y',
    'width',
    'height',
    'rotation'
  ])
  expect(apis.measure).toHaveBeenCalledExactlyOnceWith(['t'])
})
it('reports child overflow and remeasures fresh results after corrections', () => {
  const { review, geometry, apis } = fixture()
  geometry.t.x = 250
  expect(review('f').findings).toContainEqual(
    expect.objectContaining({
      kind: 'container-overflow',
      elementId: 't',
      right: 50
    })
  )
  geometry.t.x = 10
  geometry.t.height = 70
  expect(review('f').findings).toEqual([])
  expect(apis.measure).toHaveBeenCalledTimes(2)
})
it('does not mistake unavailable or rotated checks for full verification', () => {
  const { review, geometry, apis } = fixture()
  geometry.t.rotation = 30
  apis.measure.mockImplementation(() => {
    throw new Error('not supported')
  })
  const result = review('f')
  expect(result.complete).toBe(false)
  expect(result.findings.map((f) => f.kind)).toEqual(
    expect.arrayContaining([
      'rotated-bounds-unchecked',
      'measurement-unavailable'
    ])
  )
})
it('bounds traversal and never measures hidden text', () => {
  const { review, apis, data } = fixture()
  data.f.children = Array.from({ length: 250 }, (_, i) => `t${i}`)
  for (const id of data.f.children)
    data[id] = { type: 'text', parentId: 'f', visible: false }
  const result = review('f')
  expect(result.complete).toBe(false)
  expect(result.truncated).toBe(true)
  expect(apis.read).toHaveBeenCalledTimes(200)
  expect(apis.measure).not.toHaveBeenCalled()
})
it('rejects invalid targets before reading', () => {
  const { review, apis } = fixture()
  expect(() => review('')).toThrow()
  expect(() => review(null as never)).toThrow()
  expect(apis.read).not.toHaveBeenCalled()
})

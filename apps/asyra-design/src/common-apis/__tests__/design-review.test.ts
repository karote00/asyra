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
it('reports actual text overflow from one measurement batch and selected reads', async () => {
  const { review, apis } = fixture()
  expect(await review('f')).toMatchObject({
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
it('reports child overflow and remeasures fresh results after corrections', async () => {
  const { review, geometry, apis } = fixture()
  geometry.t.x = 250
  expect((await review('f')).findings).toContainEqual(
    expect.objectContaining({
      kind: 'container-overflow',
      elementId: 't',
      right: 50
    })
  )
  geometry.t.x = 10
  geometry.t.height = 70
  expect((await review('f')).findings).toEqual([])
  expect(apis.measure).toHaveBeenCalledTimes(2)
})
it('does not mistake unavailable or rotated checks for full verification', async () => {
  const { review, geometry, apis } = fixture()
  geometry.t.rotation = 30
  apis.measure.mockImplementation(() => {
    throw new Error('not supported')
  })
  const result = await review('f')
  expect(result.complete).toBe(false)
  expect(result.findings.map((f) => f.kind)).toEqual(
    expect.arrayContaining([
      'rotated-bounds-unchecked',
      'measurement-unavailable'
    ])
  )
})
it('completes traversal beyond 200 elements without measuring hidden text', async () => {
  const { review, apis, data } = fixture()
  data.f.children = Array.from({ length: 250 }, (_, i) => `t${i}`)
  for (const id of data.f.children)
    data[id] = { type: 'text', parentId: 'f', visible: false }
  const result = await review('f')
  expect(result.complete).toBe(true)
  expect(result.truncated).toBe(false)
  expect(apis.read).toHaveBeenCalledTimes(251)
  expect(apis.measure).not.toHaveBeenCalled()
})
it('rejects invalid targets before reading', async () => {
  const { review, apis } = fixture()
  await expect(review('')).rejects.toThrow()
  await expect(review(null as never)).rejects.toThrow()
  expect(apis.read).not.toHaveBeenCalled()
})

it('yields during complete traversal and cancels before subsequent reads', async () => {
  const { apis, data, geometry } = fixture()
  data.f.children = Array.from({ length: 600 }, (_, i) => `v${i}`)
  for (const id of data.f.children) {
    data[id] = { type: 'vector', parentId: 'f' }
    geometry[id] = { x: 0, y: 0, width: 10, height: 10, rotation: 0 }
  }
  const controller = new AbortController()
  const yieldToHost = vi.fn(async () => {
    controller.abort()
  })
  const review = createDesignReviewer(apis, yieldToHost)
  await expect(review('f', controller.signal)).rejects.toThrow()
  expect(yieldToHost).toHaveBeenCalledTimes(1)
  expect(apis.read.mock.calls.length).toBeLessThan(601)
  expect(apis.measure).not.toHaveBeenCalled()
})
it('finds overflow beyond the first two hundred objects', async () => {
  const { apis, data, geometry } = fixture()
  data.f.children = Array.from({ length: 300 }, (_, i) => `v${i}`).concat('t')
  for (const id of data.f.children.slice(0, -1)) {
    data[id] = { type: 'vector', parentId: 'f' }
    geometry[id] = { x: 0, y: 0, width: 10, height: 10, rotation: 0 }
  }
  const yieldToHost = vi.fn(async () => undefined)
  const result = await createDesignReviewer(apis, yieldToHost)('f')
  expect(result).toMatchObject({ complete: true, checkedElements: 302 })
  expect(result.findings).toContainEqual(
    expect.objectContaining({ kind: 'text-overflow', elementId: 't' })
  )
  expect(apis.read).toHaveBeenCalledTimes(302)
  expect(yieldToHost).toHaveBeenCalled()
})

it('rejects a mixed document snapshot when canonical data changes during a cooperative yield', async () => {
  const { apis, data, geometry } = fixture()
  data.f.children = Array.from({ length: 201 }, (_, i) => `child-${i}`)
  for (const id of data.f.children) {
    data[id] = { type: 'rectangle', parentId: 'f' }
    geometry[id] = { x: 0, y: 0, width: 1, height: 1 }
  }
  let changed: () => void = vi.fn()
  const dispose = vi.fn()
  const review = createDesignReviewer(
    {
      ...apis,
      observeChanges: (listener: () => void) => {
        changed = listener
        return dispose
      }
    },
    async () => {
      changed()
    }
  )
  expect(await review('f')).toMatchObject({
    complete: false,
    findings: expect.arrayContaining([
      { kind: 'document-changed', elementId: 'f' }
    ])
  })
  expect(dispose).toHaveBeenCalledTimes(1)
})

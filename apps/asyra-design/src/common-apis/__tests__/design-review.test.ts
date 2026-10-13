import { expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({ default: {} }))
import { createDesignReviewer } from '../design-review'
import type { InspectionDependencyChange } from '../inspection-dependencies'
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

it('retains deterministic verdicts for unchanged regions with exact canonical work counts', async () => {
  const { apis, data, geometry } = fixture()
  const listeners = new Set<
    (change?: {
      elementIds: readonly string[]
      parentIds?: readonly string[]
    }) => void
  >()
  const observedApis = {
    ...apis,
    observeChanges: (
      listener: (change?: {
        elementIds: readonly string[]
        parentIds?: readonly string[]
      }) => void
    ) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }
  }
  data.f.children = Array.from({ length: 8 }, (_, index) => `tier-${index}`)
  for (const tier of data.f.children) {
    data[tier] = {
      type: 'group',
      parentId: 'f',
      children: Array.from({ length: 200 }, (_, i) => `${tier}-window-${i}`)
    }
    geometry[tier] = { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
    for (const id of data[tier].children ?? []) {
      data[id] = { type: 'rectangle', parentId: tier }
      geometry[id] = { x: 0, y: 0, width: 1, height: 1, rotation: 0 }
    }
  }
  const review = createDesignReviewer(observedApis, async () => undefined, true)
  const first = await review('f')
  expect(first).toMatchObject({
    complete: true,
    checkedElements: 1609,
    findings: []
  })
  apis.read.mockClear()
  apis.computed.mockClear()
  geometry['tier-2-window-0'].x = 150
  for (const notify of listeners) notify({ elementIds: ['tier-2-window-0'] })
  const changed = await review('f')
  expect(changed).toMatchObject({
    complete: true,
    checkedElements: 1609,
    findings: [
      { kind: 'container-overflow', elementId: 'tier-2-window-0', right: 51 }
    ]
  })
  expect(apis.read.mock.calls.map(([id]) => id)).toEqual([
    'f',
    'tier-2',
    'tier-2-window-0'
  ])
  expect(apis.computed).toHaveBeenCalledTimes(3)
  apis.read.mockClear()
  apis.computed.mockClear()
  const repeated = await review('f')
  expect(repeated).toEqual({
    ...changed,
    observation: {
      ...changed.observation,
      evaluatedNodes: 0,
      reusedNodes: 1609,
      metadataReads: 0,
      computedReads: 0
    }
  })
  expect(apis.read).not.toHaveBeenCalled()
  expect(apis.computed).not.toHaveBeenCalled()
  const uncached = await createDesignReviewer(apis, async () => undefined)('f')
  expect(changed).toEqual({ ...uncached, observation: changed.observation })
  expect(changed.observation).toMatchObject({
    evaluatedNodes: 3,
    reusedNodes: 1606,
    aggregatedNodes: 1609
  })
  review.dispose()
  expect(listeners.size).toBe(0)
  await expect(review('f')).rejects.toThrow(/disposed/)
})

const retainedFixture = (
  yieldToHost: () => Promise<void> = async () => undefined
) => {
  const base = fixture()
  let notify: (change?: InspectionDependencyChange) => void = () => undefined
  const stop = vi.fn()
  const review = createDesignReviewer(
    {
      ...base.apis,
      observeChanges: (listener) => {
        notify = listener
        return stop
      }
    },
    yieldToHost,
    true
  )
  return {
    ...base,
    review,
    stop,
    change: (value?: InspectionDependencyChange) => notify(value)
  }
}
it('retains text verdicts, replaces corrected findings and invalidates shared owners', async () => {
  const { review, apis, geometry, change } = retainedFixture()
  expect((await review('f')).findings).toHaveLength(1)
  apis.measure.mockClear()
  expect((await review('f')).findings).toHaveLength(1)
  expect(apis.measure).not.toHaveBeenCalled()
  geometry.t.height = 70
  change({ elementIds: ['t'] })
  expect(await review('f')).toMatchObject({
    complete: true,
    findings: [],
    observation: { textMeasurements: 1 }
  })
  geometry.t.height = 20
  change({ elementIds: ['t', 'other-shared-owner'] })
  expect((await review('f')).findings).toContainEqual(
    expect.objectContaining({ kind: 'text-overflow', bottom: 40 })
  )
  change()
  expect(await review('f')).toMatchObject({
    observation: { evaluatedNodes: 2, reusedNodes: 0 }
  })
  review.dispose()
})
it('reevaluates parent dimensions and inherited visibility without retaining stale text conclusions', async () => {
  const { review, data, geometry, change } = retainedFixture()
  await review('f')
  geometry.f.width = 20
  change({ elementIds: ['f'] })
  expect(await review('f')).toMatchObject({
    observation: { evaluatedNodes: 2 },
    findings: expect.arrayContaining([
      expect.objectContaining({
        kind: 'container-overflow',
        elementId: 't',
        right: 90
      })
    ])
  })
  data.f.visible = false
  change({ elementIds: ['f'] })
  expect(await review('f')).toMatchObject({
    findings: [],
    measuredTextIds: [],
    observation: { evaluatedNodes: 2, textMeasurements: 0 }
  })
  data.f.visible = true
  change({ elementIds: ['f'] })
  expect(await review('f')).toMatchObject({
    measuredTextIds: ['t'],
    observation: { evaluatedNodes: 2, textMeasurements: 1 }
  })
  review.dispose()
})
it('updates membership through removal, replacement, reparenting and restored identities', async () => {
  const { review, data, geometry, change, apis } = retainedFixture()
  await review('f')
  data.f.children = ['g']
  data.g = { type: 'group', parentId: 'f', children: ['t'] }
  data.t.parentId = 'g'
  geometry.g = { x: 0, y: 0, width: 20, height: 100 }
  change({ elementIds: ['g', 't'], parentIds: ['f', 'g'] })
  expect((await review('f')).findings).toContainEqual(
    expect.objectContaining({
      kind: 'container-overflow',
      elementId: 't',
      right: 90
    })
  )
  data.g.children = []
  delete data.t
  change({ elementIds: ['t'], parentIds: ['g'] })
  expect(await review('f')).toMatchObject({
    checkedElements: 2,
    findings: [],
    measuredTextIds: []
  })
  data.g.children = ['t']
  data.t = { type: 'rectangle', parentId: 'g' }
  geometry.t = { x: 0, y: 0, width: 1, height: 1 }
  change({ elementIds: ['t'], parentIds: ['g'] })
  const restored = await review('f')
  expect(restored).toMatchObject({
    checkedElements: 3,
    findings: [],
    measuredTextIds: [],
    observation: { evaluatedNodes: 3 }
  })
  const uncached = await createDesignReviewer(apis)('f')
  expect(restored).toEqual({ ...uncached, observation: restored.observation })
  review.dispose()
})
it('does not retain incomplete text measurements or unavailable geometry', async () => {
  const { review, apis } = retainedFixture()
  apis.measure.mockImplementationOnce(() => [])
  expect((await review('f')).complete).toBe(false)
  expect(await review('f')).toMatchObject({
    complete: true,
    observation: { evaluatedNodes: 1, reusedNodes: 1, textMeasurements: 1 }
  })
  review.dispose()
  const next = retainedFixture()
  next.geometry.t.width = undefined
  expect((await next.review('f')).complete).toBe(false)
  next.geometry.t.width = 100
  expect(await next.review('f')).toMatchObject({
    complete: true,
    observation: { evaluatedNodes: 1 }
  })
  next.review.dispose()
})
it('does not publish work interrupted by cancellation or document replacement', async () => {
  const controller = new AbortController()
  let interrupt = true
  const state = retainedFixture(async () => {
    if (interrupt) controller.abort()
  })
  state.data.f.children = Array.from({ length: 201 }, (_, i) => `v${i}`)
  for (const id of state.data.f.children) {
    state.data[id] = { type: 'rectangle', parentId: 'f' }
    state.geometry[id] = { x: 0, y: 0, width: 1, height: 1 }
  }
  await expect(state.review('f', controller.signal)).rejects.toThrow()
  interrupt = false
  expect(await state.review('f')).toMatchObject({
    complete: true,
    observation: { evaluatedNodes: 202, reusedNodes: 0 }
  })
  state.change()
  expect(await state.review('f')).toMatchObject({
    observation: { evaluatedNodes: 202, reusedNodes: 0 }
  })
  state.review.dispose()
})
it('rejects an in-flight result after the owning runtime is disposed', async () => {
  const state = retainedFixture(async () => {
    state.review.dispose()
  })
  state.data.f.children = Array.from({ length: 201 }, (_, i) => `v${i}`)
  for (const id of state.data.f.children) {
    state.data[id] = { type: 'rectangle', parentId: 'f' }
    state.geometry[id] = { x: 0, y: 0, width: 1, height: 1 }
  }
  await expect(state.review('f')).rejects.toThrow(/disposed/)
  expect(state.stop).toHaveBeenCalledOnce()
})

it('batches initial text measurements and remeasures only a changed text owner', async () => {
  const state = retainedFixture()
  state.data.f.children = Array.from(
    { length: 401 },
    (_, index) => `text-${index}`
  )
  for (const id of state.data.f.children) {
    state.data[id] = { type: 'text', parentId: 'f' }
    state.geometry[id] = { x: 0, y: 0, width: 10, height: 10 }
  }
  const measure = vi.fn((ids: readonly string[]) =>
    ids.map((elementId) => ({
      elementId,
      bounds: { x: 0, y: 0, width: 9, height: 9 }
    }))
  )
  let notify: (change?: InspectionDependencyChange) => void = () => undefined
  const review = createDesignReviewer(
    {
      ...state.apis,
      measure,
      observeChanges: (listener) => {
        notify = listener
        return () => undefined
      }
    },
    async () => undefined,
    true
  )
  expect(await review('f')).toMatchObject({
    complete: true,
    measuredTextCount: 401,
    observation: { textMeasurements: 401 }
  })
  expect(measure.mock.calls.map(([ids]) => ids.length)).toEqual([200, 200, 1])
  measure.mockClear()
  state.geometry['text-300'].height = 5
  notify({ elementIds: ['text-300'] })
  const corrected = await review('f')
  expect(corrected).toMatchObject({
    complete: true,
    measuredTextCount: 401,
    findings: [
      expect.objectContaining({
        kind: 'text-overflow',
        elementId: 'text-300',
        bottom: 4
      })
    ],
    observation: { evaluatedNodes: 2, textMeasurements: 1 }
  })
  expect(measure).toHaveBeenCalledExactlyOnceWith(['text-300'])
  review.dispose()
})

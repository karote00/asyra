import { expect, it, vi } from 'vitest'
vi.mock('../../contexts', () => ({ default: {} }))
import { createDesignReviewer } from '../design-review'
import type { InspectionEvidenceStamp } from '../../ai/inspection-evidence'
import type { InspectionDependencyChange } from '../inspection-dependencies'
import recordedGroup from '../../../server/__tests__/fixtures/recorded-101/group-containment-20261019.json'
import { prepareDesign } from '../../../server/design-preparation'
const requiredEvidence = (result: { evidence?: InspectionEvidenceStamp }) => {
  if (!result.evidence)
    throw new Error('Expected a coherent mechanical receipt')
  return result.evidence
}
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
it('checks recorded incremental groups without treating snapshot dimensions as containment', async () => {
  const base = prepareDesign(recordedGroup.calls[0].input.draft, 'fresh-base')
  const upper = prepareDesign(recordedGroup.calls[1].input.draft, 'fresh-upper')
  const entries = [...base.entries, ...upper.entries]
  const rootId = base.entries[0].descriptor.id
  const upperId = upper.entries[0].descriptor.id
  const data = new Map(
    entries.map(({ descriptor, parentId }) => [
      descriptor.id,
      {
        type: descriptor.type,
        parentId: descriptor.id === upperId ? rootId : parentId,
        children: [] as string[]
      }
    ])
  )
  const geometry = new Map(
    entries.map(({ descriptor }) => [descriptor.id, descriptor])
  )
  for (const [id, node] of data) {
    if (node.parentId) data.get(node.parentId)?.children.push(id)
  }
  expect(Number(geometry.get(upperId)?.y)).toBeLessThan(0)
  const before = JSON.stringify([...geometry])
  const reviewer = createDesignReviewer(
    {
      read: (id) => data.get(id),
      computed: (id) => geometry.get(id),
      measure: () => [],
      observeChanges: () => () => undefined
    },
    async () => undefined,
    true
  )
  const result = await reviewer.capture(rootId)
  expect(result.complete).toBe(true)
  expect(result.findings).toEqual([])
  const coverage = await reviewer.reconcile(requiredEvidence(result), [upperId])
  expect(coverage).toMatchObject({
    current: true,
    measurements: [{ elementId: upperId, available: true, findings: [] }]
  })
  const repeated = await reviewer.capture(rootId)
  expect(repeated.evidence).toEqual(result.evidence)
  expect(repeated.observation).toMatchObject({
    metadataReads: 0,
    computedReads: 0,
    evaluatedNodes: 0,
    reusedNodes: entries.length
  })
  expect(JSON.stringify([...geometry])).toBe(before)
  reviewer.dispose()
})

it('checks actual nested group content against a Frame without trusting Group snapshot bounds', async () => {
  const data = {
    frame: { type: 'frame', children: ['group'] },
    group: { type: 'group', parentId: 'frame', children: ['shape'] },
    shape: { type: 'vector', parentId: 'group' }
  }
  const geometry = {
    frame: { x: 0, y: 0, width: 100, height: 100 },
    group: { x: 40, y: 30, width: 900, height: 900 },
    shape: { x: -10, y: -20, width: 20, height: 30 }
  }
  const reviewer = createDesignReviewer({
    read: (id) => data[id as keyof typeof data],
    computed: (id) => geometry[id as keyof typeof geometry],
    measure: () => []
  })
  expect((await reviewer('frame')).findings).toEqual([])
  geometry.shape.x = 80
  expect((await reviewer('frame')).findings).toEqual([
    expect.objectContaining({
      kind: 'container-overflow',
      elementId: 'group',
      parentId: 'frame',
      right: 40
    })
  ])
  reviewer.dispose()
})

it('does not infer containment constraints for undeclared custom containers', async () => {
  const { apis, data, geometry } = fixture()
  data.f.type = 'custom-container'
  geometry.t.x = 500
  apis.measure.mockReturnValue([])
  data.t.type = 'vector'
  expect((await createDesignReviewer(apis)('f')).findings).toEqual([])
})

it('retains Group ancestry when root-first cached children are reconciled from their parent', async () => {
  const { apis, data, geometry } = fixture()
  data.f.type = 'group'
  data.t.type = 'vector'
  geometry.t.x = -40
  const reviewer = createDesignReviewer(
    { ...apis, observeChanges: () => () => undefined },
    async () => undefined,
    true
  )
  await reviewer.capture('t')
  const root = await reviewer.capture('f')
  expect(await reviewer.reconcile(requiredEvidence(root), ['t'])).toMatchObject(
    {
      current: true,
      measurements: [{ elementId: 't', available: true, findings: [] }]
    }
  )
  reviewer.dispose()
})

it('does not require hidden descendant geometry to certify visible Group content', async () => {
  const { apis, data, geometry } = fixture()
  data.f.type = 'group'
  data.t.visible = false
  geometry.t.width = undefined
  expect(await createDesignReviewer(apis)('f')).toMatchObject({
    complete: true,
    findings: []
  })
  expect(apis.measure).not.toHaveBeenCalled()
})
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
      type: 'frame',
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
  data.g = { type: 'frame', parentId: 'f', children: ['t'] }
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

it('keeps mechanical evidence only for equal supported inputs and exact traversal context', async () => {
  const { apis, geometry, data } = fixture()
  let changed: (change?: InspectionDependencyChange) => void = () => undefined
  const review = createDesignReviewer(
    {
      ...apis,
      observeChanges(listener) {
        changed = listener
        return () => undefined
      }
    },
    async () => undefined,
    true
  )
  const first = await review.capture('f')
  expect(first.available).toBe(true)
  expect(first.evidence).toBeDefined()
  const original = requiredEvidence(first)
  apis.read.mockClear()
  apis.computed.mockClear()
  expect(await review.validate(original)).toMatchObject({
    current: true,
    observation: {
      aggregatedNodes: 0,
      evaluatedNodes: 0,
      metadataReads: 0,
      computedReads: 0,
      textMeasurements: 0
    }
  })
  expect(apis.read).not.toHaveBeenCalled()
  expect(apis.computed).not.toHaveBeenCalled()
  changed({ elementIds: ['t'] }) // Paint-only notification, same mechanical inputs.
  expect(await review.validate(original)).toMatchObject({ current: true })
  const standalone = await review.capture('t')
  expect(await review.validate(original)).toMatchObject({ current: true })
  expect(await review.validate(requiredEvidence(standalone))).toMatchObject({
    current: true
  })
  geometry.f.width = 50
  changed({ elementIds: ['f'] })
  expect(await review.validate(original)).toMatchObject({
    current: false,
    reason: 'rule-inputs-changed'
  })
  // External parent containment was not checked by a standalone-root review.
  expect(await review.validate(requiredEvidence(standalone))).toMatchObject({
    current: true
  })
  const corrected = await review.capture('f')
  expect(corrected.findings.length).toBeGreaterThan(0)
  data.f.visible = false
  changed({ elementIds: ['f'] })
  expect(await review.validate(requiredEvidence(corrected))).toMatchObject({
    current: false
  })
  changed() // Document replacement or unknown mutation cannot recover by equality.
  expect(await review.validate(requiredEvidence(standalone))).toMatchObject({
    current: false,
    reason: 'source-replaced-or-unknown'
  })
  review.dispose()
  expect(await review.validate(original)).toMatchObject({
    current: false,
    reason: 'owner-disposed'
  })
})

it('retains exact supported coverage and recovers after incomplete and cancelled mechanical capture', async () => {
  const { apis, data, geometry } = fixture()
  let changed: (value?: InspectionDependencyChange) => void = () => undefined
  let duringYield: () => void = () => undefined
  data.f.children = Array.from({ length: 205 }, (_, i) => `c${i}`)
  for (const id of data.f.children) {
    data[id] = { type: 'rect', parentId: 'f' }
    geometry[id] = { x: 0, y: 0, width: 1, height: 1 }
  }
  const review = createDesignReviewer(
    {
      ...apis,
      observeChanges(listener) {
        changed = listener
        return () => undefined
      }
    },
    async () => {
      duringYield()
    },
    true
  )
  const initial = await review.capture('f')
  const coverage = await review.coverage(requiredEvidence(initial))
  expect(coverage?.checks).toHaveLength(206)
  expect(coverage?.checks[0]).toMatchObject({
    elementId: 'f',
    containment: false
  })
  expect(coverage?.checks[1]).toMatchObject({
    elementId: 'c0',
    containment: true,
    parentWidth: 300,
    parentHeight: 200
  })
  const controller = new AbortController()
  duringYield = () => controller.abort()
  await expect(review.capture('f', controller.signal)).rejects.toThrow()
  duringYield = () => changed({ elementIds: ['c204'] })
  expect(await review.capture('f')).toMatchObject({
    available: false,
    complete: false,
    evidence: undefined
  })
  duringYield = () => undefined
  const recovered = await review.capture('f')
  expect(recovered.available).toBe(true)
  geometry.c204.rotation = 30
  changed({ elementIds: ['c204'] })
  expect(await review.validate(requiredEvidence(recovered))).toMatchObject({
    current: false,
    reason: 'checks-incomplete'
  })
  expect(await review.capture('f')).toMatchObject({
    available: false,
    evidence: undefined
  })
  geometry.c204.rotation = 0
  changed({ elementIds: ['c204'] })
  expect((await review.capture('f')).available).toBe(true)
  const aborted = new AbortController()
  aborted.abort()
  await expect(
    review.validate(requiredEvidence(initial), aborted.signal)
  ).rejects.toThrow()
  expect(
    await review.validate({ ...requiredEvidence(initial), sessionId: 'other' })
  ).toMatchObject({ current: false, reason: 'foreign-owner' })
  review.dispose()
})

it('invalidates text metrics and membership while preserving order-only mechanical coverage', async () => {
  const { apis, data, geometry } = fixture()
  data.f.children = ['t', 'other']
  data.other = { type: 'rect', parentId: 'f' }
  geometry.other = { x: 120, y: 0, width: 10, height: 10 }
  let changed: (value?: InspectionDependencyChange) => void = () => undefined
  const reviewer = createDesignReviewer(
    {
      ...apis,
      observeChanges(listener) {
        changed = listener
        return () => undefined
      }
    },
    async () => undefined,
    true
  )
  const first = await reviewer.capture('f')
  data.f.children.reverse()
  changed({ elementIds: [], parentIds: ['f'] })
  expect(await reviewer.validate(requiredEvidence(first))).toMatchObject({
    current: true
  })
  apis.measure.mockReturnValue([
    { elementId: 't', bounds: { x: 0, y: 0, width: 70, height: 25 } }
  ])
  changed({ elementIds: ['t'] })
  expect(await reviewer.validate(requiredEvidence(first))).toMatchObject({
    current: false,
    changedElementId: 't',
    changedInputs: ['text']
  })
  const updated = await reviewer.capture('f')
  expect(updated.findings).toEqual([])
  data.f.children = ['other']
  changed({ elementIds: ['t'], parentIds: ['f'] })
  expect(await reviewer.validate(requiredEvidence(updated))).toMatchObject({
    current: false,
    changedElementId: 'f',
    changedInputs: ['children']
  })
  const removed = await reviewer.capture('f')
  expect(removed.checkedElements).toBe(2)
  reviewer.dispose()
})

it('projects complete subtree evidence into independently reusable target obligations', async () => {
  const f = retainedFixture()
  f.data.s = { type: 'rectangle', parentId: 'f' }
  f.data.f.children = ['t', 's']
  f.geometry.s = { x: 150, y: 0, width: 30, height: 30, rotation: 0 }
  const whole = requiredEvidence(await f.review.capture('f'))
  const reads = f.apis.read.mock.calls.length
  const projected = await f.review.reconcile(whole, ['t', 's', 'outside'])
  expect(f.apis.read).toHaveBeenCalledTimes(reads)
  expect(projected.measurements).toMatchObject([
    {
      elementId: 't',
      available: true,
      complete: true,
      findings: [{ kind: 'text-overflow' }]
    },
    { elementId: 's', available: true, complete: true, findings: [] },
    { elementId: 'outside', available: false }
  ])
  const text = requiredEvidence(projected.measurements[0])
  const sibling = requiredEvidence(projected.measurements[1])
  f.geometry.s.width = 40
  f.change({ elementIds: ['s'] })
  expect(await f.review.validate(text)).toMatchObject({ current: true })
  expect(await f.review.validate(sibling)).toMatchObject({ current: false })
  expect(await f.review.validate(text)).toMatchObject({
    current: true,
    observation: { evaluatedNodes: 0 }
  })
  f.review.dispose()
})

it('does not promote inherited hidden coverage or a projection outside its subtree', async () => {
  const f = retainedFixture()
  f.data.f.visible = false
  const hidden = requiredEvidence(await f.review.capture('f'))
  expect(
    (await f.review.reconcile(hidden, ['t'])).measurements[0]
  ).toMatchObject({ available: false })
  f.data.f.visible = true
  f.change({ elementIds: ['f'] })
  const visible = requiredEvidence(await f.review.capture('f'))
  const child = requiredEvidence(
    (await f.review.reconcile(visible, ['t'])).measurements[0]
  )
  expect(
    (await f.review.reconcile(child, ['f'])).measurements[0]
  ).toMatchObject({ available: false })
  const aborted = new AbortController()
  aborted.abort()
  await expect(
    f.review.reconcile(visible, ['t'], aborted.signal)
  ).rejects.toThrow()
  f.change()
  expect(
    (await f.review.reconcile(visible, ['t'])).measurements[0]
  ).toMatchObject({ available: false })
  f.review.dispose()
})

it('preserves the exact receipt identity of unaffected obligations during broader reconciliation', async () => {
  const f = retainedFixture()
  f.data.s = { type: 'rectangle', parentId: 'f' }
  f.data.f.children = ['t', 's']
  f.geometry.s = { x: 150, y: 0, width: 30, height: 30, rotation: 0 }
  const root = requiredEvidence(await f.review.capture('f'))
  const before = await f.review.reconcile(root, ['t', 's'])
  f.geometry.s.width = 40
  f.change({ elementIds: ['s'] })
  const current = requiredEvidence(await f.review.capture('f'))
  const reads = f.apis.read.mock.calls.length
  const after = await f.review.reconcile(current, ['t', 's'])
  expect(requiredEvidence(after.measurements[0])).toEqual(
    requiredEvidence(before.measurements[0])
  )
  expect(requiredEvidence(after.measurements[1])).not.toEqual(
    requiredEvidence(before.measurements[1])
  )
  expect(f.apis.read).toHaveBeenCalledTimes(reads)
  f.review.dispose()
})

it.each(['f', 't'])(
  'preserves projected %s evidence through explicit capture and reverse acquisition without hiding changes',
  async (target) => {
    const f = retainedFixture()
    f.data.outer = { type: 'frame', children: ['f'] }
    f.data.f.parentId = 'outer'
    f.geometry.outer = { x: 0, y: 0, width: 1000, height: 1000, rotation: 0 }
    const root = requiredEvidence(await f.review.capture('outer'))
    const projected = requiredEvidence(
      (await f.review.reconcile(root, [target])).measurements[0]
    )
    const explicit = requiredEvidence(await f.review.capture(target))
    expect(explicit).toEqual(projected)
    expect(await f.review.validate(projected)).toMatchObject({ current: true })
    expect(
      requiredEvidence(
        (await f.review.reconcile(root, [target])).measurements[0]
      )
    ).toEqual(explicit)
    f.geometry.t.width = 120
    f.change({ elementIds: ['t'] })
    const changed = requiredEvidence(await f.review.capture(target))
    expect(changed).not.toEqual(explicit)
    expect(await f.review.validate(explicit)).toMatchObject({ current: false })
    const refreshed = requiredEvidence(await f.review.capture('outer'))
    expect(
      requiredEvidence(
        (await f.review.reconcile(refreshed, [target])).measurements[0]
      )
    ).toEqual(changed)
    f.review.dispose()
  }
)

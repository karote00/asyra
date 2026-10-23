import {
  createDesignPreparationSession,
  prepareDesign
} from '../design-preparation'
import recoveryFixture from './fixtures/recorded-101/pattern-budget-recovery-20261023.json'
import { inspectDesignBudget, partitionDesignBudget } from '../design-budget'
import { expect, it } from 'vitest'
import { createDesignDraftRepairStore } from '../design-draft-repair'
import { DesignPreparationLimits as limits } from '../../src/ai/prepared-design'

it('retains immutable rejected source with exact request-local references', () => {
  const store = createDesignDraftRepairStore()
  const source = { children: [{ key: 'duplicate' }], 'a/b~c': 1 }
  const draftId = store.retain(source)
  if (!draftId) throw new Error('Expected the valid draft to be retained')
  source.children[0].key = 'later caller change'
  const repair = {
    draftId,
    replacements: [{ path: '/children/0/key', value: 'corrected' }]
  }
  expect(store.repair(repair)).toEqual({
    children: [{ key: 'corrected' }],
    'a/b~c': 1
  })
  expect(
    store.repair({ draftId, replacements: [{ path: '/a~1b~0c', value: 2 }] })
  ).toEqual({
    children: [{ key: 'duplicate' }],
    'a/b~c': 2
  })
  expect(() => createDesignDraftRepairStore().repair(repair)).toThrow(
    /unavailable/
  )
  store.release(draftId)
  expect(() => store.repair(repair)).toThrow(/unavailable/)
})

it('refuses new retention at capacity without evicting an existing repair source', () => {
  const store = createDesignDraftRepairStore()
  const first = store.retain({ key: 'first' })
  for (let index = 1; index < limits.retainedDrafts; index++)
    store.retain({ key: index })
  expect(store.retain({ key: 'overflow' })).toBeUndefined()
  expect(
    store.repair({
      draftId: first,
      replacements: [{ path: '/key', value: 'new' }]
    })
  ).toEqual({ key: 'new' })
  expect(
    store.retain({ text: 'x'.repeat(limits.retainedDraftBytes) })
  ).toBeUndefined()
})

it('rejects nonexisting or malformed paths without changing a retained draft', () => {
  const store = createDesignDraftRepairStore()
  const draftId = store.retain({ children: [{ key: 'old' }] })
  for (const path of [
    '/missing',
    '/children/4/key',
    '/children/length',
    '/children/-/key',
    '/children/0/~2',
    '/__proto__/polluted'
  ]) {
    expect(() =>
      store.repair({ draftId, replacements: [{ path, value: 'new' }] })
    ).toThrow()
  }
  expect(() =>
    store.repair({
      draftId,
      replacements: [
        { path: '/children/0/key', value: 'one' },
        { path: '/children/0/key', value: 'two' }
      ]
    })
  ).toThrow(/unique/)
  expect(
    store.repair({
      draftId,
      replacements: [{ path: '/children/0/key', value: 'new' }]
    })
  ).toEqual({ children: [{ key: 'new' }] })
})

it('offers source-referenced budget partitions without copying geometry into recovery', () => {
  const store = createDesignDraftRepairStore()
  const draftId = store.retain(recoveryFixture.input.draft)
  if (!draftId) throw new Error('Missing retained source')
  const source = store.describe(draftId)
  if (!source?.partitions) throw new Error('Missing partitions')
  expect(source.partitions).toHaveLength(2)
  expect(source.partitions.reduce((n, p) => n + p.expandedNodes - 1, 0)).toBe(
    13094
  )
  const first = store.repair({ draftId, partition: 0 }) as {
    children: Record<string, unknown>[]
    fillTemplates?: unknown
  }
  const second = store.repair({ draftId, partition: 1 }) as {
    children: Record<string, unknown>[]
    fillTemplates?: unknown
  }
  expect(inspectDesignBudget(first)).toBeUndefined()
  expect(inspectDesignBudget(second)).toBeUndefined()
  expect(first.children.at(-1)?.instanceRanges).toEqual([{ start: 0, end: 6 }])
  expect(second.children[0].instanceRanges).toEqual([{ start: 6, end: 8 }])
  expect(first.fillTemplates).toEqual(second.fillTemplates)
  expect(JSON.stringify(source)).not.toContain('vertices')
  expect(() => store.repair({ draftId, partition: 2 })).toThrow()
  expect(() =>
    store.repair({ draftId, partition: 0, replacements: [] })
  ).toThrow()
  store.release(draftId)
  expect(() => store.repair({ draftId, partition: 0 })).toThrow(/unavailable/)
})

it('compiles retained partitions once and binds continuation to the original root', async () => {
  const session = createDesignPreparationSession()
  const draftId = session.retainRejectedDraft(recoveryFixture.input.draft)
  if (!draftId) throw new Error('Missing retained source')
  const signal = new AbortController().signal
  const firstRepair = { draftId, partition: 0 }
  const first = await session.prepareAsync(
    session.repairDraft(firstRepair),
    signal,
    firstRepair
  )
  const laterRepair = {
    draftId,
    partition: 1,
    continueFromArtifact: first.artifactId
  }
  const later = await session.prepareAsync(
    session.repairDraft(laterRepair),
    signal,
    laterRepair
  )
  const a = session.resolve(first.artifactId)
  const b = session.resolve(later.artifactId)
  expect(b.rootId).toBe(a.rootId)
  expect(b.continuation?.anchor.id).toBe(a.entries[1].descriptor.id)
  expect(b.entries.slice(1).every((entry) => entry.parentId === a.rootId)).toBe(
    true
  )
  const repeated = await session.prepareAsync(
    session.repairDraft(laterRepair),
    signal,
    laterRepair
  )
  expect(repeated.artifactId).toBe(later.artifactId)
  expect(session.resolve(repeated.artifactId)).toBe(b)
  await expect(
    session.prepareAsync(session.repairDraft(laterRepair), signal, {
      ...laterRepair,
      continueFromArtifact: 'missing'
    })
  ).rejects.toThrow()
})

it('preserves sparse original instance ranges and rejects indivisible or relational recovery', () => {
  const original = recoveryFixture.input.draft
  const pattern = original.children.find((child) => child.type === 'pattern')
  if (!pattern) throw new Error('Missing pattern')
  const source = {
    ...original,
    children: [
      {
        ...pattern,
        axes: [{ count: 12, step: { x: 0, y: 0, z: 100 } }],
        instanceRanges: [
          { start: 0, end: 4 },
          { start: 6, end: 12 }
        ]
      }
    ]
  }
  const store = createDesignDraftRepairStore()
  const draftId = store.retain(source)
  if (!draftId) throw new Error('Missing retained source')
  const parts = store.describe(draftId)?.partitions
  if (!parts) throw new Error('Missing partitions')
  expect(parts).toHaveLength(2)
  const a = store.repair({ draftId, partition: 0 }) as {
    children: Record<string, unknown>[]
    fillTemplates?: unknown
  }
  expect(a.children).toHaveLength(1)
  expect(a.children[0].instanceRanges).toEqual([
    { start: 0, end: 4 },
    { start: 6, end: 10 }
  ])
  expect(inspectDesignBudget(a)).toBeUndefined()
  const b = store.repair({ draftId, partition: 1 }) as {
    children: Record<string, unknown>[]
    fillTemplates?: unknown
  }
  expect(b.children[0].instanceRanges).toEqual([{ start: 10, end: 12 }])
  const relations = store.retain({ ...original, relations: [] })
  if (!relations) throw new Error('Missing retained source')
  expect(store.describe(relations)?.partitions).toBeUndefined()
  const indivisible = store.retain({
    ...original,
    children: [{ ...original.children[3], rows: 10000, columns: 2 }]
  })
  if (!indivisible) throw new Error('Missing retained source')
  expect(store.describe(indivisible)?.partitions).toBeUndefined()
})

it.each([10000, 2000])(
  'preserves every prepared coordinate, path, fill and source order across retained partitions at %i',
  async (limit) => {
    const session = createDesignPreparationSession(
      undefined,
      undefined,
      undefined,
      limit
    )
    const source = recoveryFixture.input.draft
    const draftId = session.retainRejectedDraft(source)
    if (!draftId) throw new Error('Missing source')
    const signal = new AbortController().signal
    const firstRepair = { draftId, partition: 0 }
    const first = await session.prepareAsync(
      session.repairDraft(firstRepair),
      signal,
      firstRepair
    )
    const receipts = [first]
    const partitions = session.describeRejectedDraft(draftId)?.partitions
    if (!partitions) throw new Error('Missing partitions')
    for (let partition = 1; partition < partitions.length; partition++) {
      const repair = {
        draftId,
        partition,
        continueFromArtifact: first.artifactId
      }
      receipts.push(
        await session.prepareAsync(session.repairDraft(repair), signal, repair)
      )
    }
    const normalize = (design: ReturnType<typeof prepareDesign>) => {
      const root = design.entries[0].descriptor
      return design.entries.slice(1).map(({ descriptor }) =>
        JSON.parse(
          JSON.stringify({
            ...descriptor,
            x: Number(descriptor.x) + Number(root.x),
            y: Number(descriptor.y) + Number(root.y)
          }).replaceAll(descriptor.id, 'member')
        )
      )
    }
    const actual = receipts.flatMap((receipt) =>
      normalize(session.resolve(receipt.artifactId))
    )
    const expected = source.children.flatMap((child, index) =>
      normalize(
        prepareDesign({ ...source, children: [child] }, `oracle-${index}`)
      )
    )
    const difference = (
      a: unknown,
      b: unknown,
      path = 'output'
    ): string | undefined => {
      if (typeof b === 'number')
        return typeof a === 'number' && Math.abs(a - b) < 0.00000005
          ? undefined
          : path
      if (Array.isArray(b)) {
        if (!Array.isArray(a) || a.length !== b.length) return path
        for (let i = 0; i < b.length; i++) {
          const result = difference(a[i], b[i], `${path}[${i}]`)
          if (result) return result
        }
        return
      }
      if (b && typeof b === 'object') {
        if (
          !a ||
          typeof a !== 'object' ||
          JSON.stringify(Object.keys(a).sort()) !==
            JSON.stringify(Object.keys(b).sort())
        )
          return path
        for (const [key, value] of Object.entries(b)) {
          const result = difference(
            (a as Record<string, unknown>)[key],
            value,
            `${path}.${key}`
          )
          if (result) return result
        }
        return
      }
      return a === b ? undefined : path
    }
    expect(difference(actual, expected)).toBeUndefined()
  }
)

it('counts each source component without repeatedly scanning an accumulating partition', () => {
  let reads = 0
  const face = recoveryFixture.input.draft.children[0]
  const children = Array.from({ length: 250 }, (_, i) => ({
    ...face,
    key: `face-${i}`,
    get vertices() {
      reads++
      return face.vertices
    }
  }))
  const source = {
    ...recoveryFixture.input.draft,
    children: [
      ...children,
      {
        ...recoveryFixture.input.draft.children[3],
        rows: 100,
        columns: 99,
        motifs: [
          {
            vertices: [
              { x: 0, y: 0 },
              { x: 1, y: 0 },
              { x: 0, y: 1 }
            ],
            fill: '#123456'
          }
        ]
      }
    ]
  }
  const partitions = partitionDesignBudget(source)
  expect(partitions).toHaveLength(2)
  expect(reads).toBeLessThanOrEqual(250 * 10)
})

it('bounds recovery metadata and keeps exact object and path limits', () => {
  const face = {
    type: 'projected-face',
    key: 'face',
    vertices: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 }
    ]
  }
  const draft = (count: number) => ({
    type: 'group',
    projection: {},
    children: [
      {
        type: 'pattern',
        key: 'repeat',
        axes: [{ count, step: { x: 2, y: 0, z: 0 } }],
        members: [face]
      }
    ]
  })
  expect(partitionDesignBudget(draft(9999))).toBeUndefined()
  expect(
    partitionDesignBudget(draft(10000))?.map((p) => p.expandedNodes)
  ).toEqual([10000, 2])
  expect(
    partitionDesignBudget(draft(9999 * limits.recoveryParts))
  ).toHaveLength(limits.recoveryParts)
  expect(
    partitionDesignBudget(draft(9999 * limits.recoveryParts + 1))
  ).toBeUndefined()
  const paths = {
    ...face,
    vertices: Array.from({ length: 100 }, (_, x) => ({ x, y: 0, z: 0 }))
  }
  const source = {
    ...draft(2001),
    children: [{ ...draft(2001).children[0], members: [paths] }]
  }
  const partitions = partitionDesignBudget(source)
  expect(partitions?.map((p) => p.expandedPathCommands)).toEqual([200000, 100])
  expect(partitions?.map((p) => p.expandedNodes)).toEqual([2001, 2])
})

it('keeps world material revisions targeted at each partition actual members', async () => {
  const field = {
    frame: 'world',
    start: { x: 0, y: 0, z: 0 },
    end: { x: 0, y: 0, z: 50800 },
    gradientStops:
      recoveryFixture.input.draft.fillTemplates.glassL.gradientStops
  }
  const draft = JSON.parse(JSON.stringify(recoveryFixture.input.draft))
  const face = draft.children[5].members[0]
  delete face.fill
  face.materialField = 'glass'
  draft.linearFields = { glass: field }
  const session = createDesignPreparationSession()
  const draftId = session.retainRejectedDraft(draft)
  if (!draftId) throw new Error('Missing retained source')
  const signal = new AbortController().signal
  const first = await session.prepareAsync(draft, signal, {
    draftId,
    partition: 0
  })
  const second = await session.prepareAsync(draft, signal, {
    draftId,
    partition: 1,
    continueFromArtifact: first.artifactId
  })
  const rootId = session.resolve(first.artifactId).rootId
  for (const artifact of [first, second]) {
    const ids = session.materialMembers(artifact.artifactId)
    expect(ids.length).toBeGreaterThan(0)
    const preparedIds = new Set(
      session
        .resolve(artifact.artifactId)
        .entries.map((entry) => entry.descriptor.id)
    )
    expect(ids.every((id) => preparedIds.has(id))).toBe(true)
    const revision = await session.reviseMaterial(
      artifact.artifactId,
      'glass',
      { ...field, end: { x: 0, y: 0, z: 60000 } },
      signal
    )
    const updates = session.materialRevision(revision.materialRevisionId)
    expect(updates.rootId).toBe(rootId)
    expect(updates.updates.map((entry) => entry.elementId)).toEqual(ids)
  }
}, 15000)

it('does not partition conflicting semantic keys into separately accepted artifacts', () => {
  const draft = structuredClone(recoveryFixture.input.draft)
  draft.children[draft.children.length - 1].key = draft.children[0].key
  expect(partitionDesignBudget(draft)).toBeUndefined()
  draft.children[draft.children.length - 1].key =
    `${draft.children[5].key}-0-upper-left`
  expect(partitionDesignBudget(draft)).toBeUndefined()
})

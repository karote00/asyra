import { describe, expect, it, vi } from 'vitest'
import {
  createDesignCheckResults,
  designCheckResultsSchema
} from '../design-check-results'

import { operationInputIssue } from '../operation-input-schema'

describe('retained design check results', () => {
  it('accumulates passes while returning only unresolved work by default', () => {
    const store = createDesignCheckResults()
    store.record({
      id: 'units',
      origin: 'tool',
      status: 'pass',
      evidence: '100 px/m',
      dependencies: { units: '1' }
    })
    store.record({
      id: 'glass',
      origin: 'main-agent',
      status: 'fail',
      evidence: 'Wrong reflection',
      dependencies: { material: '1' }
    })
    expect(store.read().items.map((item) => item.id)).toEqual(['glass'])
    expect(store.read().counts.pass).toBe(1)
    store.record({
      id: 'glass',
      origin: 'main-agent',
      status: 'pass',
      evidence: 'Current pixels match',
      dependencies: { material: '1' }
    })
    expect(store.read().items).toEqual([])
    expect(store.read({ includePassed: true }).items).toHaveLength(2)
  })

  it('reopens dependent passes transitively and preserves unrelated evidence', () => {
    const store = createDesignCheckResults()
    store.record({
      id: 'wall',
      origin: 'tool',
      status: 'pass',
      evidence: 'Width valid',
      dependencies: { geometry: '1' }
    })
    store.record({
      id: 'windows',
      origin: 'tool',
      status: 'pass',
      evidence: 'Attached',
      dependencies: { 'check:wall': '1' }
    })
    store.record({
      id: 'colour',
      origin: 'main-agent',
      status: 'pass',
      evidence: 'Matches',
      dependencies: { material: '1' }
    })
    store.invalidate(['geometry'], 'Wall resized')
    expect(store.read().items.map((item) => item.id)).toEqual([
      'wall',
      'windows'
    ])
    expect(store.read().items.every((item) => item.status === 'stale')).toBe(
      true
    )
    expect(
      store
        .read({ includePassed: true })
        .items.find((item) => item.id === 'colour')?.status
    ).toBe('pass')
    expect(store.read().items[0].evidence).toBe('Width valid')
  })

  it('never lets another author overwrite a tool failure and detaches returned data', () => {
    const store = createDesignCheckResults()
    store.record({
      id: 'join',
      origin: 'tool',
      status: 'fail',
      evidence: 'Gap',
      dependencies: { geometry: '1' }
    })
    expect(() =>
      store.record({
        id: 'join',
        origin: 'main-agent',
        status: 'pass',
        evidence: 'Looks good',
        dependencies: {}
      })
    ).toThrow(/origin/)
    const result = store.read()
    result.items[0].evidence = 'Changed externally'
    expect(store.read().items[0].evidence).toBe('Gap')
    store.invalidate(undefined, 'Unknown external change')
    expect(store.read().items[0].status).toBe('stale')
  })
})

it('reads unresolved work without scanning accumulated passes and rejects dependency cycles', () => {
  const store = createDesignCheckResults()
  for (let index = 0; index < 2000; index++) {
    store.record({
      id: `part-${index}`,
      origin: 'tool',
      status: 'pass',
      evidence: 'Validated',
      dependencies: { [`part:${index}`]: '1' }
    })
  }
  store.record({
    id: 'pending',
    origin: 'main-agent',
    status: 'fail',
    evidence: 'Adjust colour',
    dependencies: { material: '1' }
  })
  expect(store.read().visitedResults).toBe(1)
  expect(store.read().counts.pass).toBe(2000)
  store.record({
    id: 'child',
    origin: 'tool',
    status: 'pass',
    evidence: 'Depends on part',
    dependencies: { 'check:part-0': '1' }
  })
  expect(() =>
    store.record({
      id: 'part-0',
      origin: 'tool',
      status: 'pass',
      evidence: 'Cycle',
      dependencies: { 'check:child': '1' }
    })
  ).toThrow(/cycle/)
  expect(store.read().counts.pass).toBe(2001)
})

it('invalidates dependency-free results too when the change scope is unknown', () => {
  const store = createDesignCheckResults()
  store.record({
    id: 'overall',
    origin: 'main-agent',
    status: 'pass',
    evidence: 'Whole result inspected',
    dependencies: {}
  })
  store.invalidate(undefined, 'Unknown impact')
  expect(store.read()).toMatchObject({
    counts: { pass: 0, stale: 1 },
    items: [{ id: 'overall', status: 'stale' }]
  })
})

it('declares and validates the exact retained result delivery contract', () => {
  const store = createDesignCheckResults()
  store.record({
    id: 'geometry',
    origin: 'tool',
    status: 'pass',
    evidence: 'Admitted',
    dependencies: { recipe: '1' }
  })
  const reply = store.read({ includePassed: true })
  expect(operationInputIssue(reply, designCheckResultsSchema)).toBeUndefined()
  expect(
    operationInputIssue(
      { ...reply, items: [{ ...reply.items[0], origin: 'guessed' }] },
      designCheckResultsSchema
    )
  ).toBeDefined()
  expect(
    operationInputIssue({ ...reply, counts: {} }, designCheckResultsSchema)
  ).toBeDefined()
})

it('records redesign provenance and invalidates only real dependent results', () => {
  const store = createDesignCheckResults()
  const original = {
    id: 'unit',
    origin: 'main-agent' as const,
    status: 'pass' as const,
    unitId: 'third',
    criterionId: 'finish',
    evidence: 'Original design',
    dependencies: { 'inspection:old': '1' }
  }
  store.record(original)
  store.record({
    id: 'relation',
    origin: 'tool',
    status: 'pass',
    evidence: 'Original relation',
    dependencies: { 'check:unit': '1' }
  })
  store.record({
    id: 'other',
    origin: 'main-agent',
    status: 'pass',
    evidence: 'Other unit',
    dependencies: { 'inspection:other': '1' }
  })
  const replacement = {
    ...original,
    status: 'unverified' as const,
    evidence: 'Redesigned scope awaits judgment',
    dependencies: { 'inspection:new': '2' },
    supersedes: { revision: 1, reason: 'Replacement geometry' }
  }
  expect(store.record(replacement)).toBe(2)
  const result = store.read({ includePassed: true })
  expect(operationInputIssue(result, designCheckResultsSchema)).toBeUndefined()
  expect(result.items.find((item) => item.id === 'relation')?.status).toBe(
    'stale'
  )
  expect(result.items.find((item) => item.id === 'other')?.status).toBe('pass')
  expect(store.record(replacement)).toBe(2)
  expect(store.read({ includePassed: true })).toEqual(result)
})

it('consolidates compiler corrections into the same source obligation without losing unrelated results', () => {
  const store = createDesignCheckResults()
  store.recordPreparedSource({
    artifactId: 'bad',
    recipeRevision: 'r1',
    findings: [{ kind: 'outside' }]
  })
  store.recordPreparedSource({
    artifactId: 'other',
    recipeRevision: 'r2',
    findings: []
  })
  const other = store.read({
    includePassed: true,
    ids: ['prepared:other:data']
  }).items[0]
  store.recordPreparedSource({
    artifactId: 'fixed',
    recipeRevision: 'r3',
    findings: []
  })
  store.record({
    id: 'dependent',
    origin: 'tool',
    status: 'pass',
    evidence: 'Source checked',
    dependencies: { 'check:prepared:fixed:data': '1' }
  })
  expect(
    store.recordPreparedSource({
      artifactId: 'fixed',
      recipeRevision: 'r3',
      findings: [],
      previousArtifactId: 'bad'
    })
  ).toBe('bad')
  expect(store.read().counts).toEqual({
    pass: 2,
    fail: 0,
    unverified: 0,
    stale: 1
  })
  expect(store.read().items.map((item) => item.id)).toEqual(['dependent'])
  expect(
    store.read({ includePassed: true, ids: ['prepared:other:data'] }).items[0]
  ).toEqual(other)
  const all = store.read({ includePassed: true })
  store.recordPreparedSource({
    artifactId: 'fixed',
    recipeRevision: 'r3',
    findings: [],
    previousArtifactId: 'bad'
  })
  expect(store.read({ includePassed: true })).toEqual(all)
  store.recordPreparedSource({
    artifactId: 'still-bad',
    recipeRevision: 'r4',
    findings: [{ kind: 'outside' }],
    previousArtifactId: 'fixed'
  })
  expect(store.read().items).toContainEqual(
    expect.objectContaining({
      id: 'prepared:bad:data',
      status: 'fail',
      scope: ['still-bad']
    })
  )
  expect(() =>
    store.recordPreparedSource({
      artifactId: 'unknown',
      recipeRevision: 'r5',
      findings: [],
      previousArtifactId: 'absent'
    })
  ).toThrow(/predecessor/)
})

it('rejects adoption of a superseded source before disturbing either lineage', () => {
  const store = createDesignCheckResults()
  store.recordPreparedSource({
    artifactId: 'a',
    recipeRevision: 'a',
    findings: []
  })
  store.recordPreparedSource({
    artifactId: 'b',
    recipeRevision: 'b',
    findings: [],
    previousArtifactId: 'a'
  })
  store.recordPreparedSource({
    artifactId: 'c',
    recipeRevision: 'c',
    findings: []
  })
  const before = store.read({ includePassed: true })
  expect(() =>
    store.recordPreparedSource({
      artifactId: 'a',
      recipeRevision: 'a',
      findings: [],
      previousArtifactId: 'c'
    })
  ).toThrow(/superseded/)
  expect(store.read({ includePassed: true })).toEqual(before)
})

it('retires a removed tool target, preserves dependent obligations and never reuses its revision', () => {
  const store = createDesignCheckResults()
  const revision = store.record({
    id: 'measurement:removed',
    origin: 'tool',
    status: 'pass',
    evidence: 'Measured',
    dependencies: { 'measurement:removed': 'stamp' }
  })
  store.record({
    id: 'visual',
    origin: 'main-agent',
    status: 'pass',
    evidence: 'Compared',
    dependencies: { 'check:measurement:removed': String(revision) }
  })
  store.retire('measurement:removed', 'Target was removed')
  expect(store.read()).toMatchObject({
    counts: { pass: 0, stale: 1 },
    items: [{ id: 'visual', status: 'stale' }]
  })
  expect(() => store.retire('visual', 'Not a tool target')).toThrow(/tool/)
  expect(
    store.record({
      id: 'measurement:removed',
      origin: 'tool',
      status: 'pass',
      evidence: 'Recreated',
      dependencies: { 'measurement:removed': 'new-stamp' }
    })
  ).toBeGreaterThan(revision)
  expect(store.read().items[0].status).toBe('stale')
})

it('selects transitive check dependencies without enumerating unrelated result payloads', () => {
  const store = createDesignCheckResults()
  const record = (id: string, dependencies: Record<string, string> = {}) =>
    store.record({
      id,
      origin: 'tool',
      status: 'pass',
      evidence: id,
      dependencies
    })
  record('root')
  record('middle', { 'check:root': '1' })
  record('leaf', { 'check:middle': '1' })
  for (let index = 0; index < 100; index++) {
    record(`other-${index}`)
  }
  expect(store.dependencyIds(['leaf'])).toEqual(['leaf', 'middle', 'root'])
  expect(store.dependencyIds(['missing'])).toEqual(['missing'])
})

it('summarizes large retained failures without retransmitting their evidence', () => {
  const store = createDesignCheckResults()
  const ids = Array.from({ length: 5000 }, (_, index) => `measurement:${index}`)
  for (const id of ids) {
    store.record({
      id,
      origin: 'tool',
      status: 'unverified',
      evidence: 'retained detail '.repeat(100),
      dependencies: { [id]: 'unknown' }
    })
  }
  const summary = store.summary(ids)
  expect(summary).toEqual({
    countsScope: 'selected-checks',
    counts: { pass: 0, fail: 0, unverified: 5000, stale: 0 },
    visitedResults: 5000,
    firstPendingId: ids[0]
  })
  expect(JSON.stringify(summary).length).toBeLessThan(200)
  if (!summary.firstPendingId) {
    throw new Error('Missing pending check identity')
  }
  expect(store.read({ ids: [summary.firstPendingId] }).items[0].evidence).toBe(
    'retained detail '.repeat(100)
  )
})

it('discards only untouched declaration placeholders and validates the whole removal first', () => {
  const store = createDesignCheckResults()
  const declaration = {
    id: 'declared',
    origin: 'main-agent' as const,
    status: 'unverified' as const,
    evidence: 'Await judgment',
    dependencies: { 'criterion:one': '1' }
  }
  store.record(declaration)
  store.record({ ...declaration, id: 'observed', scope: ['image'] })
  const before = store.read({ includePassed: true })
  expect(() => store.discardDeclarations(['declared', 'observed'])).toThrow(
    /declaration/
  )
  expect(store.read({ includePassed: true })).toEqual(before)
  store.invalidate(
    ['criterion:one'],
    'The declared source changed before any judgment'
  )
  expect(() => store.discardDeclarations(['observed'])).toThrow(/declaration/)
  store.discardDeclarations(['declared', 'declared'])
  expect(
    store.read({ includePassed: true }).items.map((item) => item.id)
  ).toEqual(['observed'])
  expect(store.read().counts).toEqual({
    pass: 0,
    fail: 0,
    unverified: 0,
    stale: 1
  })
  expect(store.record(declaration)).toBe(2)
  for (const status of ['fail', 'pass'] as const) {
    store.record({ ...declaration, status })
    expect(() => store.discardDeclarations(['declared', 'declared'])).toThrow(
      /declaration/
    )
  }
})

it('admits a complete detached mechanical selection and rejects mixed ownership', () => {
  const store = createDesignCheckResults()
  const value = {
    id: 'part',
    origin: 'tool' as const,
    status: 'pass' as const,
    evidence: 'Not a dispatch language',
    dependencies: { geometry: 'v1' }
  }
  const descriptor = {
    kind: 'measurement' as const,
    elementId: 'part',
    findings: []
  }
  const revision = store.record(value, descriptor)
  store.record({ ...value, id: 'visual', origin: 'main-agent' })
  expect(() =>
    store.select([
      { checkId: 'part', revision },
      { checkId: 'visual', revision: 1 }
    ])
  ).toThrow(/mechanical/)
  expect(() =>
    store.select([
      { checkId: 'part', revision },
      { checkId: 'part', revision }
    ])
  ).toThrow(/unique/)
  expect(() => store.select([])).toThrow(/nonempty/)
  const selected = store.select([{ checkId: 'part', revision }])
  expect(selected[0]).toMatchObject({ recheck: descriptor })
  descriptor.elementId = 'changed'
  expect(store.select([{ checkId: 'part', revision }])[0]).toMatchObject({
    recheck: { elementId: 'part' }
  })
  expect(store.read({ includePassed: true }).items[0]).not.toHaveProperty(
    'recheck'
  )
  store.invalidate(['geometry'], 'Changed')
  expect(store.select([{ checkId: 'part', revision }])[0]).toMatchObject({
    result: { status: 'stale' }
  })
})

it('delivers bounded summaries and revision-bound complete details without cloning pending rows', () => {
  const store = createDesignCheckResults()
  for (let i = 0; i < 137; i++) {
    store.record({
      id: `check-${i}`,
      origin: 'tool',
      status: 'fail',
      evidence: 'x'.repeat(3000),
      dependencies: { geometry: '1' }
    })
  }
  const clone = vi.spyOn(globalThis, 'structuredClone')
  const summary = store.deliver()
  expect(clone).not.toHaveBeenCalled()
  clone.mockRestore()
  expect(summary).toMatchObject({
    counts: { fail: 137 },
    visitedResults: 0,
    firstPendingId: 'check-0'
  })
  expect(summary).not.toHaveProperty('items')
  expect(JSON.stringify(summary).length).toBeLessThan(300)
  const found: string[] = []
  let offset = 0
  do {
    const page = store.deliver({
      view: 'details',
      limit: 40,
      offset,
      revision: summary.revision
    })
    if (!page.items) {
      throw new Error('Detail page omitted items')
    }
    expect(page.items.length).toBeLessThanOrEqual(40)
    for (const item of page.items) {
      found.push(item.id)
      expect(item.evidence).toHaveLength(3000)
    }
    offset = page.nextOffset ?? 0
  } while (offset)
  expect(new Set(found).size).toBe(137)
  expect(store.deliver().revision).toBe(summary.revision)
  store.invalidate(['geometry'], 'Changed geometry')
  expect(() =>
    store.deliver({ view: 'details', offset: 40, revision: summary.revision })
  ).toThrow('revision')
  const current = store.deliver().revision
  store.invalidate(['geometry'], 'Changed geometry')
  expect(store.deliver().revision).toBe(current)
  expect(store.firstPending('tool')).toEqual({ id: 'check-0', status: 'stale' })
  expect(
    store.deliver({ ids: ['check-136'], includePassed: true }).items
  ).toHaveLength(1)
  expect(() => store.deliver({ view: 'details', offset: 1 })).toThrow(
    'revision'
  )
  store.retire('check-0', 'Canonical removal')
  expect(() => store.deliver({ view: 'details', revision: current })).toThrow(
    'revision'
  )
})

it('labels selected counts separately from request counts without rescanning evidence', () => {
  const store = createDesignCheckResults()
  store.record({
    id: 'geometry',
    origin: 'tool',
    status: 'pass',
    evidence: 'Measured',
    dependencies: {}
  })
  store.record({
    id: 'material',
    origin: 'main-agent',
    status: 'unverified',
    evidence: 'Wrong crop',
    dependencies: {}
  })
  expect(store.summary(['geometry'])).toMatchObject({
    countsScope: 'selected-checks',
    counts: { pass: 1, unverified: 0 }
  })
  expect(store.deliver()).toMatchObject({
    countsScope: 'request-checks',
    counts: { pass: 1, unverified: 1 },
    visitedResults: 0
  })
  expect(store.deliver({ ids: ['material'] })).toMatchObject({
    countsScope: 'selected-checks',
    counts: { pass: 0, unverified: 1 }
  })
  expect(store.deliver({ view: 'details', limit: 1 })).toMatchObject({
    countsScope: 'request-checks',
    counts: { pass: 1, unverified: 1 }
  })
})

it('selects result origin before cloning while retaining full and exact reads', () => {
  const store = createDesignCheckResults()
  for (const [id, origin, status] of [
    ['mechanical', 'tool', 'fail'],
    ['visual-pass', 'main-agent', 'pass'],
    ['visual-fail', 'main-agent', 'fail']
  ] as const) {
    store.record({
      id,
      origin,
      status,
      evidence: id,
      dependencies: { source: '1' }
    })
  }
  const clone = vi.spyOn(globalThis, 'structuredClone')
  try {
    const selection = { includePassed: true, origin: 'main-agent' as const }
    const result = store.read(selection)
    expect(result.items.map((item) => item.id)).toEqual([
      'visual-pass',
      'visual-fail'
    ])
    expect(result.countsScope).toBe('selected-checks')
    expect(result.counts).toEqual({ pass: 1, fail: 1, stale: 0, unverified: 0 })
    expect(clone.mock.calls).toHaveLength(2)
    result.items[0].dependencies.source = 'external'
    expect(store.read(selection).items[0].dependencies.source).toBe('1')
    const pending = store.read({ origin: 'main-agent' })
    expect(pending.items.map((item) => item.id)).toEqual(['visual-fail'])
    expect(pending.countsScope).toBe('selected-checks')
    expect(pending.counts).toEqual({
      pass: 0,
      fail: 1,
      stale: 0,
      unverified: 0
    })
    expect(pending.visitedResults).toBe(2)
    expect(
      store
        .read({ ...selection, ids: ['mechanical', 'visual-pass', 'missing'] })
        .items.map((item) => item.id)
    ).toEqual(['visual-pass'])
    expect(store.read({ ...selection, ids: [] }).items).toEqual([])
    expect(store.read({ includePassed: true }).items).toHaveLength(3)
    expect(
      store.read({ ids: ['mechanical'], includePassed: true }).items[0].status
    ).toBe('fail')
    store.invalidate(['source'], 'Changed source')
    expect(
      store.read(selection).items.every((item) => item.status === 'stale')
    ).toBe(true)
    expect(store.firstPending('tool')).toEqual({
      id: 'mechanical',
      status: 'stale'
    })
    expect(createDesignCheckResults().read(selection).items).toEqual([])
  } finally {
    clone.mockRestore()
  }
})

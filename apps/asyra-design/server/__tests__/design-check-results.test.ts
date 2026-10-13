import { describe, expect, it } from 'vitest'
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
  for (let index = 0; index < 2000; index++)
    store.record({
      id: `part-${index}`,
      origin: 'tool',
      status: 'pass',
      evidence: 'Validated',
      dependencies: { [`part:${index}`]: '1' }
    })
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

import { expect, it } from 'vitest'
import type { WalkingStowedEnvelope } from '../../domain/walking-robot-envelopes'
import type { SceneDemand, SceneDemandExclusion } from '../scene-demand'
import { WalkingTransitScreen } from '../walking-transit-screen'

const box = (min: [number, number, number], max: [number, number, number]) => ({
  min,
  max,
  size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]] as const
})
const exclusion = (
  min: [number, number, number],
  max: [number, number, number],
  id: string
) =>
  ({
    kind: 'growth',
    relation: 'hard-exclusion',
    volume: { id },
    bounds: box(min, max)
  }) as unknown as SceneDemandExclusion
const demand = (items: readonly SceneDemandExclusion[], identity = {}) => {
  const route = { volume: box([-20, -20, -20], [20, 20, 20]) }
  return {
    identity,
    route,
    freePassage: {
      status: 'ready',
      reasons: [],
      route: route.volume,
      exclusions: items
    }
  } as unknown as SceneDemand
}
const envelope = box(
  [-1, -1, -1],
  [1, 1, 1]
) as unknown as WalkingStowedEnvelope['bounds']
const action = (
  from: [number, number, number],
  to: [number, number, number]
) => ({
  identity: {},
  from,
  to
})

it('shares one W1 index for arbitrary volume queries and changing transit margins', () => {
  const screen = new WalkingTransitScreen()
  const near = exclusion([1, -1, -1], [2, 1, 1], 'near')
  const far = exclusion([10, 10, 10], [11, 11, 11], 'far')
  const source = demand([far, near])
  const first = screen.queryVolume(source, envelope, 0)
  expect(first.coverage).toBe('covered')
  expect(first.affected).toEqual([near])
  expect(first.inventory).toBe(source.freePassage.exclusions)
  expect(first.provenance).toBe('w1-canonical-obstacles/1')
  expect(Object.isFrozen(first)).toBe(true)
  expect(screen.isCurrentVolume(first)).toBe(true)
  screen.evaluate(source, envelope, action([0, 0, 0], [0, 0, 0]), 0.25)
  expect(screen.work.builds).toBe(1)
  expect(screen.queryVolume(source, box([19, 0, 0], [21, 1, 1])).coverage).toBe(
    'outside-route'
  )
  screen.clear()
  expect(screen.isCurrentVolume(first)).toBe(false)
})

it('builds one immutable index for one W1 route and reuses it across base actions', () => {
  const screen = new WalkingTransitScreen()
  const source = demand([exclusion([5, -1, -1], [6, 1, 1], 'near')])
  for (let i = 0; i < 100; i++)
    expect(
      screen.evaluate(
        source,
        envelope,
        action([0, 0, i / 100], [1, 0, i / 100]),
        0
      ).status
    ).toBe('ready-fast')
  expect(screen.work.builds).toBe(1)
  expect(screen.work.queries).toBe(100)
  expect(screen.work.validationVisits).toBe(1)
})

it('keeps missing or unsupported canonical inventory unknown', () => {
  const screen = new WalkingTransitScreen()
  const missing = demand([])
  delete (missing.freePassage as { exclusions?: unknown }).exclusions
  expect(screen.queryVolume(missing, envelope).coverage).toBe('unknown')
  const unsupported = {
    ...exclusion([5, 5, 5], [6, 6, 6], 'unknown'),
    kind: 'unregistered-source'
  }
  expect(
    screen.queryVolume(demand([unsupported as never]), envelope).coverage
  ).toBe('unknown')
})

it('returns local-required for an overlap candidate without calling a collision owner', () => {
  const screen = new WalkingTransitScreen()
  const obstacle = exclusion([1.5, -1, -1], [2.5, 1, 1], 'candidate')
  const result = screen.evaluate(
    demand([obstacle]),
    envelope,
    action([0, 0, 0], [2, 0, 0]),
    0
  )
  expect(result.status).toBe('local-required')
  expect(result.affected).toEqual([obstacle])
  expect('collision' in result).toBe(false)
})

it('keeps same-axis but XYZ-distant entries as candidates with zero contributors', () => {
  const screen = new WalkingTransitScreen()
  const result = screen.evaluate(
    demand([exclusion([0, 8, 0], [2, 9, 2], 'high')]),
    envelope,
    action([0, 0, 0], [1, 0, 1]),
    0
  )
  expect(result.status).toBe('ready-fast')
  expect(result.work.axisCandidates).toBe(1)
  expect(result.work.detailedOverlaps).toBe(0)
  expect(result.work.contributors).toBe(0)
})

it('finds long covering intervals and handles reversed travel', () => {
  const screen = new WalkingTransitScreen()
  const obstacle = exclusion([-10, -1, -1], [10, 1, 1], 'long')
  expect(
    screen.evaluate(
      demand([obstacle]),
      envelope,
      action([4, 0, 0], [-4, 0, 0]),
      0
    ).affected
  ).toEqual([obstacle])
})

it('matches a linear overlap oracle and rebuilds only for W1 identity or route', () => {
  const screen = new WalkingTransitScreen()
  const items = Array.from({ length: 20 }, (_, i) =>
    exclusion([i - 10, i % 3, -1], [i - 9.25, (i % 3) + 0.5, 1], `item-${i}`)
  )
  const first = demand(items)
  const query = action([-3, 0, 0], [4, 0, 0])
  const expected = items.filter((item) =>
    item.bounds.min.every(
      (minimum, axis) =>
        minimum <= [5, 1, 1][axis] &&
        item.bounds.max[axis] >= [-4, -1, -1][axis]
    )
  )
  expect(screen.evaluate(first, envelope, query, 0).affected).toEqual(expected)
  screen.evaluate(first, envelope, action([1, 0, 0], [2, 0, 0]), 0)
  expect(screen.work.builds).toBe(1)
  screen.evaluate(first, envelope, query, 0.1)
  expect(screen.work.builds).toBe(1)
  expect(screen.work.validationVisits).toBe(20)
  screen.evaluate(demand(items, {}), envelope, query, 0.1)
  expect(screen.work.builds).toBe(2)
  expect(screen.work.validationVisits).toBe(40)
})

it('fails closed for stale demand and clears retained state without scanning', () => {
  let current = true
  const screen = new WalkingTransitScreen(
    (value) => current && value.identity !== null
  )
  const source = demand([])
  screen.evaluate(source, envelope, action([0, 0, 0], [1, 0, 0]), 0)
  current = false
  expect(
    screen.evaluate(source, envelope, action([0, 0, 0], [1, 0, 0]), 0)
  ).toMatchObject({ status: 'unknown', reasons: ['stale-scene-demand'] })
  screen.clear()
  expect(screen.work.clears).toBe(1)
})

it('fails closed when the margin-expanded sweep leaves the surveyed route volume', () => {
  const screen = new WalkingTransitScreen()
  const source = demand([])
  expect(
    screen.evaluate(source, envelope, action([18.5, 0, 0], [19, 0, 0]), 0.25)
  ).toMatchObject({
    status: 'unknown',
    reasons: ['outside-route-coverage'],
    work: { builds: 0, queries: 0 }
  })
})

it('treats closed-bound contact on every axis as a local candidate', () => {
  const screen = new WalkingTransitScreen()
  for (const [index, obstacle] of [
    exclusion([1, -1, -1], [2, 1, 1], 'touch-x'),
    exclusion([-1, 1, -1], [1, 2, 1], 'touch-y'),
    exclusion([-1, -1, 1], [1, 1, 2], 'touch-z')
  ].entries()) {
    const result = screen.evaluate(
      demand([obstacle], { index }),
      envelope,
      action([0, 0, 0], [0, 0, 0]),
      0
    )
    expect(result.status).toBe('local-required')
    expect(result.affected).toEqual([obstacle])
  }
})

it('uses outward arithmetic for subnormal coverage margins', () => {
  const screen = new WalkingTransitScreen()
  const source = demand([]) as unknown as {
    route: { volume: ReturnType<typeof box> }
    freePassage: { route: ReturnType<typeof box>; exclusions: never[] }
  }
  source.route.volume = box([-1, -1, -1], [1, 1, 1])
  source.freePassage.route = source.route.volume
  expect(
    screen.evaluate(
      source as unknown as SceneDemand,
      envelope,
      action([0, 0, 0], [0, 0, 0]),
      Number.MIN_VALUE
    )
  ).toMatchObject({ status: 'unknown', reasons: ['outside-route-coverage'] })
})

it('retains W1 coverage unknowns while allowing exact-source detail to be screened', () => {
  const screen = new WalkingTransitScreen()
  const withReasons = (reasons: string[]) => {
    const source = demand([]) as unknown as {
      freePassage: { status: string; reasons: string[] }
    }
    source.freePassage.status = 'unknown'
    source.freePassage.reasons = reasons
    return source as unknown as SceneDemand
  }
  expect(
    screen.evaluate(
      withReasons(['exact-source-query-required']),
      envelope,
      action([0, 0, 0], [0, 0, 0]),
      0
    ).status
  ).toBe('ready-fast')
  expect(
    screen.evaluate(
      withReasons(['exact-source-query-required', 'growth-unknown']),
      envelope,
      action([0, 0, 0], [0, 0, 0]),
      0
    )
  ).toMatchObject({ status: 'unknown', reasons: ['growth-unknown'] })
})

it('caches invalid immutable W1 bounds without rescanning on action or margin changes', () => {
  const screen = new WalkingTransitScreen()
  const invalid = exclusion([0, 0, 0], [1, 1, 1], 'invalid') as unknown as {
    bounds: ReturnType<typeof box>
  }
  invalid.bounds.max[2] = Number.NaN
  const source = demand([invalid as unknown as SceneDemandExclusion])
  for (const margin of [0, 0.1])
    expect(
      screen.evaluate(source, envelope, action([0, 0, 0], [1, 0, 0]), margin)
    ).toMatchObject({ status: 'unknown', reasons: ['invalid-transit-bounds'] })
  expect(screen.work.validationVisits).toBe(1)
  expect(screen.work.builds).toBe(0)
  expect(screen.work.queries).toBe(0)
})

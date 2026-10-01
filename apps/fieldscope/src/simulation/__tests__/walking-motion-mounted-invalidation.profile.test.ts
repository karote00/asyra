import { expect, it } from 'vitest'
import { WalkingMotionOwner } from '../walking-motion'
import { mountedConsumerFixture } from './walking-motion-test-fixtures'

it('mounted crate consumer retains all original inventory in bounded canonical admission and invalidates reads', () => {
  const f = mountedConsumerFixture()
  const owner = new WalkingMotionOwner({
    getCurrentSceneDemand: () => f.demand,
    getCurrentWalkingRobotSource: () => f.source,
    getCurrentWalkingCycle: () => f.current,
    getCurrentMountedCrate: () => f.mounted
  })
  const raw = {
    ...f.raw,
    load: { ...f.raw.load, crate: { kind: 'mounted', artifact: f.crate } },
    budget: { ...f.raw.budget, maxExactPredicates: 1000 }
  }
  const result = owner.prepare(raw)
  if (!('format' in result)) throw new Error('Missing nonlinear admission')
  const entries = result.sourceRelations.inventory.filter(
    (e) => e.mountedCrate === f.crate
  )
  expect(entries.map((e) => e.mountedPart)).toEqual(f.crate.geometry.parts)
  expect(entries.map((e) => e.region)).toEqual(
    f.crate.geometry.parts.flatMap((p) => p.regions)
  )
  expect(result.request.load.crate).toEqual({
    kind: 'mounted',
    artifact: f.crate
  })
  expect(result.sourceRelations.reasons).not.toContain('crate-geometry-unknown')
  expect(result.sourceRelations.coverage.unvisited).toBeGreaterThan(0)
  expect(owner.read()).toBe(result)
  const preparations = owner.work.preparations
  expect(owner.prepare(result.request)).toBe(result)
  expect(owner.work.preparations).toBe(preparations)
  f.mountOwner.clear()
  expect(owner.read()).toBeUndefined()
  expect(() => owner.prepare(result.request)).toThrow()
}, 30000)

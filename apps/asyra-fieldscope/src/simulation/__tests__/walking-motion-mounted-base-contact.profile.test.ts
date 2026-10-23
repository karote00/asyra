import { expect, it } from 'vitest'
import {
  WalkingSourceRelationEvaluator,
  prepareWalkingMountedCrateRelations
} from '../walking-source-relation'
import {
  mountedConsumerFixture,
  nonlinearExact,
  nonlinearFraction,
  nonlinearRequired,
  nonlinearSub
} from './walking-motion-test-fixtures'

it('mounted crate consumer proves every base pair and only original tray contact across the shared phase', async (context) => {
  await context.annotate(
    'Starting mounted crate complete original-region relation proof',
    'info'
  )
  const f = mountedConsumerFixture()
  const evaluator = new WalkingSourceRelationEvaluator({
    maxRegionPairs: 100000,
    maxExactPredicates: 5000000,
    maxBits: 24000
  })
  const relations = prepareWalkingMountedCrateRelations(
    evaluator,
    f.current,
    f.mounted,
    24000
  )
  expect(relations.placement.exact[0].position).toBe(
    f.crate.placement.translation
  )
  for (let axis = 0; axis < 3; axis++) {
    const value = f.crate.placement.translation[axis]
    const exactValue =
      value.exponent >= 0
        ? nonlinearFraction(value.significand << BigInt(value.exponent))
        : nonlinearFraction(value.significand, 1n << BigInt(-value.exponent))
    const bound = relations.placement.bounds[0].position[axis]
    expect(
      nonlinearSub(nonlinearExact(bound.low), exactValue).numerator
    ).toBeLessThanOrEqual(0n)
    expect(
      nonlinearSub(nonlinearExact(bound.high), exactValue).numerator
    ).toBeGreaterThanOrEqual(0n)
  }
  expect(
    relations.placement.bounds[0].position.some((v) => v.low < v.high)
  ).toBe(true)
  const base = nonlinearRequired(
    f.source.rig.bodies.find((b) => b.id === 'base')
  )
  let visited = 0,
    separated = 0,
    boundary = 0
  for (const part of base.parts)
    for (const region of part.regions)
      for (const cp of f.crate.geometry.parts)
        for (const cr of cp.regions) {
          const result = relations.relate(part, region, cp, cr, 0)
          visited++
          if (result?.kind === 'exactSeparated') separated++
          else {
            expect(result?.kind, part.id + ':' + cp.id).toBe('declaredBoundary')
            expect(part).toBe(f.crate.tray)
            expect(cp).toBe(f.crate.geometry.bottomPart)
            expect(result?.boundary?.firstTriangle).toBeGreaterThanOrEqual(24)
            expect(result?.boundary?.firstTriangle).toBeLessThan(30)
            expect(result?.boundary?.secondTriangle).toBeGreaterThanOrEqual(30)
            expect(result?.boundary?.secondTriangle).toBeLessThan(36)
            boundary++
          }
        }
  expect(visited).toBe(
    base.parts.reduce((n, p) => n + p.regions.length, 0) *
      f.crate.geometry.parts.reduce((n, p) => n + p.regions.length, 0)
  )
  expect(visited).toBe(separated + boundary)
  expect(boundary).toBe(1)
  expect(evaluator.work.rationalNodePreparations).toBe(1)
  const before = evaluator.work.transformPreparations
  relations.relate(
    f.crate.tray,
    f.crate.trayPatch.region,
    f.crate.geometry.bottomPart,
    f.crate.geometry.bottomPatch.region,
    0
  )
  expect(evaluator.work.transformPreparations).toBe(before)
  expect(evaluator.work.rationalNodePreparations).toBe(1)
  expect(() =>
    relations.relate(
      { ...f.crate.tray },
      f.crate.trayPatch.region,
      f.crate.geometry.bottomPart,
      f.crate.geometry.bottomPatch.region,
      0
    )
  ).toThrow()
  expect(() =>
    relations.relate(
      f.crate.tray,
      { ...f.crate.trayPatch.region },
      f.crate.geometry.bottomPart,
      f.crate.geometry.bottomPatch.region,
      0
    )
  ).toThrow()
  expect(
    relations.relate(
      f.crate.tray,
      f.crate.trayPatch.region,
      f.crate.geometry.bottomPart,
      f.crate.geometry.bottomPatch.region,
      0.001
    )
  ).toBeUndefined()
  f.mountOwner.clear()
  expect(() =>
    relations.relate(
      f.crate.tray,
      f.crate.trayPatch.region,
      f.crate.geometry.bottomPart,
      f.crate.geometry.bottomPatch.region,
      0
    )
  ).toThrow()
}, 300000)

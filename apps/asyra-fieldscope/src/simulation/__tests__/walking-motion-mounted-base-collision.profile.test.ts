import { expect, it } from 'vitest'
import {
  WalkingSourceRelationEvaluator,
  prepareWalkingMountedCrateRelations
} from '../walking-source-relation'
import {
  mountedConsumerFixture,
  nonlinearRequired
} from './walking-motion-test-fixtures'

it('mounted crate consumer keeps real other-base material intersections blocked', async (context) => {
  await context.annotate(
    'Starting mounted crate retained material-overlap proof',
    'info'
  )
  const f = mountedConsumerFixture(0.2)
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
  const chassis = nonlinearRequired(
    f.source.parts.find((p) => p.id === 'chassis')
  )
  expect(
    chassis.regions.some((region) =>
      f.crate.geometry.parts.some((part) =>
        part.regions.some(
          (r) =>
            relations.relate(chassis, region, part, r, 0)?.kind === 'blocked'
        )
      )
    )
  ).toBe(true)
}, 300000)

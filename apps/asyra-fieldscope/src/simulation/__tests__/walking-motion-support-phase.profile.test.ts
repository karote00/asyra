import { expect, it } from 'vitest'
import {
  WalkingSourceRelationEvaluator,
  prepareWalkingConstantRootRelations
} from '../walking-source-relation'
import { mountedConsumerFixture } from './walking-motion-test-fixtures'

it('phase-root proves the actual support pin and sleeve but cannot lend it to swing', () => {
  const f = mountedConsumerFixture()
  const evaluator = new WalkingSourceRelationEvaluator({
    maxRegionPairs: 10000,
    maxExactPredicates: 5000000,
    maxBits: 24000
  })
  const support = prepareWalkingConstantRootRelations(
    evaluator,
    f.current,
    24000,
    f.mounted,
    0
  )
  const swing = prepareWalkingConstantRootRelations(
    evaluator,
    f.current,
    24000,
    f.mounted,
    1
  )
  const pin = f.source.parts.find((p) => p.id === 'left-front-abduction-pin')
  const sleeve = f.source.parts.find(
    (p) => p.id === 'left-front-abduction-sleeve'
  )
  if (!pin || !sleeve) throw new Error('Missing original first pair')
  expect(pin.regions[1]).toMatchObject({ indexStart: 24, indexCount: 24 })
  expect(sleeve.regions[1]).toMatchObject({ indexStart: 36, indexCount: 36 })
  expect(support.contains(sleeve)).toBe(true)
  expect(swing.contains(sleeve)).toBe(false)
  expect(
    support.relate(pin, pin.regions[1], sleeve, sleeve.regions[1], 0)?.kind
  ).toBe('exactSeparated')
  const before = evaluator.work
  expect(
    support.relate(pin, pin.regions[1], sleeve, sleeve.regions[1], 0)?.kind
  ).toBe('exactSeparated')
  expect(evaluator.work.rationalNodePreparations).toBe(
    before.rationalNodePreparations
  )
  expect(evaluator.work.transformPreparations).toBe(
    before.transformPreparations
  )
  expect(
    swing.relate(pin, pin.regions[1], sleeve, sleeve.regions[1], 0)
  ).toBeUndefined()
  expect(
    support.relate(pin, pin.regions[1], sleeve, sleeve.regions[1], 0.01)
  ).toBeUndefined()
  f.cycleOwner.dispose()
  expect(() => support.contains(sleeve)).toThrow(/Stale/)
})

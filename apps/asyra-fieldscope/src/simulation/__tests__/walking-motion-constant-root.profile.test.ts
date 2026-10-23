import { expect, it } from 'vitest'
import {
  WalkingSourceRelationEvaluator,
  prepareWalkingConstantRootRelations
} from '../walking-source-relation'
import { mountedConsumerFixture } from './walking-motion-test-fixtures'

it('constant-root relation retains actual fixed-joint SAT and excludes dynamic legs', () => {
  const f = mountedConsumerFixture()
  const evaluator = new WalkingSourceRelationEvaluator({
    maxRegionPairs: 100000,
    maxExactPredicates: 5000000,
    maxBits: 24000
  })
  const relations = prepareWalkingConstantRootRelations(
    evaluator,
    f.current,
    24000,
    f.mounted
  )
  const rail = f.source.parts.find((p) => p.id === 'lift-rail-negative')
  const carriage = f.source.parts.find((p) => p.id === 'carriage')
  if (!rail || !carriage) throw new Error('Missing source constant pair')
  expect(relations.contains(rail)).toBe(true)
  expect(relations.contains(carriage)).toBe(true)
  const result = relations.relate(
    rail,
    rail.regions[0],
    carriage,
    carriage.regions[9],
    0
  )
  expect(['exactSeparated', 'declaredBoundary']).toContain(result?.kind)
  const work = evaluator.work
  expect(
    relations.relate(rail, rail.regions[0], carriage, carriage.regions[9], 0)
      ?.kind
  ).toBe(result?.kind)
  expect(evaluator.work.rationalNodePreparations).toBe(
    work.rationalNodePreparations
  )
  expect(evaluator.work.transformPreparations).toBe(work.transformPreparations)
  expect(
    relations.relate(rail, rail.regions[0], carriage, carriage.regions[9], 0.01)
  ).toBeUndefined()
  for (const contact of f.source.rig.contacts.feet)
    expect(relations.contains(contact.part)).toBe(false)
  const cratePart = f.crate.geometry.parts[0]
  expect(['exactSeparated', 'declaredBoundary']).toContain(
    relations.relate(
      carriage,
      carriage.regions[0],
      cratePart,
      cratePart.regions[0],
      0
    )?.kind
  )
  f.cycleOwner.dispose()
  expect(() =>
    relations.relate(rail, rail.regions[0], carriage, carriage.regions[9], 0)
  ).toThrow(/Stale/)
})

import { expect, it } from 'vitest'
import { SyntheticDynamicSceneOwner } from '../synthetic-dynamic-scene'

const bounds = { min: [-10, -10, -10] as const, max: [10, 10, 10] as const }
const local = { min: [-1, -1, 1] as const, max: [1, 1, 2] as const }
const definition = () => ({
  format: 'synthetic-dynamic-scene/1' as const,
  assumption: 'Finite authored cuboids, not measured people',
  domain: bounds,
  validFrom: 0,
  validUntil: 10,
  actors: [
    {
      trackId: 'person-1',
      kind: 'person' as const,
      states: [
        { from: 0, until: 5, motion: 'moving' as const, bounds: local },
        { from: 5, until: 10, motion: 'stationary' as const, bounds: local }
      ]
    }
  ]
})
it('owns finite source time and preserves person identity after motion stops', () => {
  const owner = new SyntheticDynamicSceneOwner()
  const raw = definition()
  owner.prepare(raw)
  raw.actors[0].trackId = 'caller-mutated'
  const moving = owner.readAt(1, local, 10)
  const stopped = owner.readAt(6, local, 10)
  expect(moving.coverage).toBe('covered')
  expect(stopped.candidates[0]).toMatchObject({
    trackId: 'person-1',
    kind: 'person',
    motion: 'stationary'
  })
  expect(stopped.candidates[0].identity).toBe(moving.candidates[0].identity)
  expect(Object.isFrozen(stopped.candidates[0].bounds.min)).toBe(true)
  expect(owner.isCurrent(stopped)).toBe(true)
  expect(owner.isCurrent({ ...stopped })).toBe(false)
  owner.prepare(definition())
  expect(owner.isCurrent(stopped)).toBe(false)
  expect(owner.readAt(6, local, 10).candidates[0].identity).toBe(
    moving.candidates[0].identity
  )
})
it('never infers source completeness across time gaps, domain edges or budgets', () => {
  const owner = new SyntheticDynamicSceneOwner()
  const raw = definition()
  raw.actors[0].states[1].from = 6
  owner.prepare(raw)
  expect(owner.readAt(5, local, 10).coverage).toBe('unknown')
  expect(owner.readAt(1, local, 0)).toMatchObject({
    coverage: 'unknown',
    unvisited: 1
  })
  expect(owner.readAt(10, local, 10).coverage).toBe('unknown')
  expect(
    owner.readAt(1, { min: [-11, 0, 0], max: [0, 1, 1] }, 10).coverage
  ).toBe('unknown')
})
it('admits explicitly empty finite worlds and rejects duplicate or retyped tracks', () => {
  const owner = new SyntheticDynamicSceneOwner()
  owner.prepare({ ...definition(), actors: [] })
  expect(owner.readAt(1, local, 10)).toMatchObject({
    coverage: 'covered',
    candidates: [],
    unvisited: 0
  })
  owner.prepare(definition())
  const duplicate = definition()
  duplicate.actors.push(duplicate.actors[0])
  expect(() => owner.prepare(duplicate)).toThrow()
  expect(() =>
    owner.prepare({
      ...definition(),
      actors: [{ ...definition().actors[0], kind: 'moving-object' }]
    })
  ).toThrow()
  expect(() =>
    owner.prepare({ ...definition(), safe: true } as never)
  ).toThrow()
})

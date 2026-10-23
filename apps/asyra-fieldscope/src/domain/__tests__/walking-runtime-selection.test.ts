import { expect, it } from 'vitest'
import {
  DEFAULT_WALKING_RUNTIME_SELECTION,
  createWalkingRuntimeSelection,
  readWalkingRuntimeSelection
} from '../walking-runtime-selection'
import { createSyntheticWalkingRobotDefinition } from '../walking-robot-definition'

it('keeps legacy view as the immutable versioned default', () => {
  expect(readWalkingRuntimeSelection(DEFAULT_WALKING_RUNTIME_SELECTION)).toBe(
    DEFAULT_WALKING_RUNTIME_SELECTION
  )
  expect(DEFAULT_WALKING_RUNTIME_SELECTION).toEqual({
    format: 'walking-runtime-selection/1',
    mode: 'legacy-view'
  })
  expect(Object.isFrozen(DEFAULT_WALKING_RUNTIME_SELECTION)).toBe(true)
})

it('admits an explicit active walking definition without rewriting it', () => {
  const definition = createSyntheticWalkingRobotDefinition({
    definitionId: 'runtime-selection-fixture'
  })
  const selection = createWalkingRuntimeSelection(definition)
  expect(selection).toEqual({
    format: 'walking-runtime-selection/1',
    mode: 'walking-active',
    definition
  })
  expect(selection.definition).toBe(definition)
  expect(readWalkingRuntimeSelection(selection)).toBe(selection)
  expect(Object.isFrozen(selection)).toBe(true)
})

it('rejects invalid active width while the legacy selection remains viewable', () => {
  const definition = createSyntheticWalkingRobotDefinition({
    definitionId: 'over-width-runtime-fixture'
  })
  const overWidth = structuredClone(definition)
  const mutable = overWidth as unknown as {
    base: { chassis: { size: number[] } }
  }
  mutable.base.chassis.size[0] = 0.81
  expect(() =>
    readWalkingRuntimeSelection({
      format: 'walking-runtime-selection/1',
      mode: 'walking-active',
      definition: overWidth
    })
  ).toThrow()
  expect(readWalkingRuntimeSelection(DEFAULT_WALKING_RUNTIME_SELECTION)).toBe(
    DEFAULT_WALKING_RUNTIME_SELECTION
  )
})

it('rejects implicit migration and extra persisted fields', () => {
  expect(() => readWalkingRuntimeSelection({ width: 0.55 })).toThrow()
  expect(() =>
    readWalkingRuntimeSelection({
      ...DEFAULT_WALKING_RUNTIME_SELECTION,
      definition: createSyntheticWalkingRobotDefinition({
        definitionId: 'implicit-fixture'
      })
    })
  ).toThrow()
})

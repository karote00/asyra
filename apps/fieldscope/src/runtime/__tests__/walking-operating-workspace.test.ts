import { expect, it } from 'vitest'
import {
  createWalkingRuntimeSelection,
  DEFAULT_WALKING_RUNTIME_SELECTION
} from '../../domain/walking-runtime-selection'
import { createSyntheticWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import type { SceneDemand } from '../../simulation/scene-demand'
import { WalkingOperatingOwner } from '../walking-operating-workspace'

const demand = (identity: object = {}) => {
  const route = {
    volume: {
      min: [-10, -10, -10],
      max: [10, 10, 10],
      size: [20, 20, 20]
    }
  }
  return {
    identity,
    route,
    freePassage: {
      status: 'ready',
      reasons: [],
      route: route.volume,
      exclusions: []
    }
  } as unknown as SceneDemand
}

it('walking observation reuses the operating screen for arbitrary covered sight queries', () => {
  const current = demand()
  const owner = new WalkingOperatingOwner(
    () => current,
    (value) => value === current
  )
  const report = owner.apply(
    createWalkingRuntimeSelection(
      createSyntheticWalkingRobotDefinition({
        definitionId: 'walking-observation-screen'
      })
    )
  )
  const screen = owner.transitScreen
  expect(screen.work.builds).toBe(1)
  const sight = screen.queryVolume(current, {
    min: [-1, -1, -1],
    max: [1, 1, 1],
    size: [2, 2, 2]
  })
  expect(sight.coverage).toBe('covered')
  expect(screen.work.builds).toBe(1)
  owner.refreshDemand()
  expect(owner.transitScreen).toBe(screen)
  expect(screen.work.builds).toBe(1)
  expect(owner.isCurrent(report)).toBe(false)
  owner.clear()
  expect(screen.isCurrentVolume(sight)).toBe(false)
})

it('keeps the legacy view inert and prepares one current walking owner product', () => {
  let currentDemand = demand()
  const owner = new WalkingOperatingOwner(
    () => currentDemand,
    (value) => value === currentDemand
  )
  const legacy = owner.apply(DEFAULT_WALKING_RUNTIME_SELECTION)
  expect(legacy.status).toBe('legacy-view')
  expect(owner.sourceOwner.work.builds).toBe(0)
  const selection = createWalkingRuntimeSelection(
    createSyntheticWalkingRobotDefinition({ definitionId: 'operating-fixture' })
  )
  const active = owner.apply(selection)
  expect(active.status).toBe('ready-fast')
  if (active.status === 'legacy-view' || !active.envelope)
    throw new Error('Missing active report')
  expect(active.envelope.bounds.size[0]).toBeGreaterThan(0.8)
  expect(active.envelope.bodyBounds.size[0]).toBeLessThanOrEqual(0.8)
  expect(active.source.definition).toBe(selection.definition)
  expect(active.stowedPoseResult.source).toBe(active.source)
  expect(owner.read()).toBe(active)
  expect(owner.sourceOwner.work.builds).toBe(1)
  expect(owner.envelopeOwner.work.preparations).toBe(1)
  currentDemand = demand()
  const refreshed = owner.refreshDemand()
  if (refreshed.status === 'legacy-view' || !refreshed.envelope)
    throw new Error('Missing active report')
  expect(refreshed.source).toBe(active.source)
  expect(refreshed.envelope).toBe(active.envelope)
  expect(owner.sourceOwner.work.builds).toBe(1)
  expect(owner.envelopeOwner.work.preparations).toBe(1)
  expect(owner.transitScreen.work.builds).toBe(2)
})

it('retires report currentness as soon as W1 replaces its demand', () => {
  let currentDemand = demand()
  const owner = new WalkingOperatingOwner(
    () => currentDemand,
    (value) => value === currentDemand
  )
  const report = owner.apply(
    createWalkingRuntimeSelection(
      createSyntheticWalkingRobotDefinition({
        definitionId: 'demand-currentness-fixture'
      })
    )
  )
  expect(owner.isCurrent(report)).toBe(true)
  currentDemand = demand()
  expect(owner.isCurrent(report)).toBe(false)
})

it('retires the active report and owner products on clear', () => {
  const sourceDemand = demand()
  const owner = new WalkingOperatingOwner(
    () => sourceDemand,
    () => true
  )
  const report = owner.apply(
    createWalkingRuntimeSelection(
      createSyntheticWalkingRobotDefinition({ definitionId: 'clear-fixture' })
    )
  )
  expect(owner.isCurrent(report)).toBe(true)
  owner.clear()
  expect(owner.isCurrent(report)).toBe(false)
  expect(owner.sourceOwner.read()).toBeUndefined()
})

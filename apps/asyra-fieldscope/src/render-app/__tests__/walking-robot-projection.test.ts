import { expect, it } from 'vitest'
import { createSyntheticWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import { createWalkingRuntimeSelection } from '../../domain/walking-runtime-selection'
import type { SceneDemand } from '../../simulation/scene-demand'
import { WalkingOperatingOwner } from '../../runtime/walking-operating-workspace'
import { WalkingRobotProjection } from '../walking-robot-projection'

const demand = (identity: object = {}) =>
  ({
    identity,
    route: {
      volume: { min: [-10, -10, -10], max: [10, 10, 10], size: [20, 20, 20] }
    },
    freePassage: { status: 'ready', exclusions: [] }
  }) as unknown as SceneDemand

it('projects the actual selected W2 source once and ignores W1-only refreshes', () => {
  let sourceDemand = demand()
  const operating = new WalkingOperatingOwner(
    () => sourceDemand,
    (value) => value === sourceDemand
  )
  const report = operating.apply(
    createWalkingRuntimeSelection(
      createSyntheticWalkingRobotDefinition({
        definitionId: 'projection-fixture'
      })
    )
  )
  const projection = new WalkingRobotProjection()
  const first = projection.update(report)
  expect(first.length).toBeGreaterThan(20)
  if (report.status === 'legacy-view') throw new Error('Missing active report')
  expect(first[0].descriptor.shape).toEqual(report.source.parts[0].shape)
  expect(first.every((mesh) => mesh.id.startsWith('walking-robot.'))).toBe(true)
  expect(projection.update(report)).toBe(first)
  sourceDemand = demand()
  const refreshed = operating.refreshDemand()
  expect(projection.update(refreshed)).toBe(first)
  expect(projection.work.poseProjections).toBe(1)
  expect(projection.work.shapeAdmissions).toBe(report.source.parts.length)
})

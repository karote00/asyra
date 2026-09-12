import { expect, it, vi } from 'vitest'
import { RobotProjection } from '../robot-projection'
import * as model from '../../domain/robot-model'
import {
  assessRobotDesign,
  DEFAULT_ROBOT,
  validateRobot
} from '../../domain/robot-configuration'
import { DEFAULT_CONFIGURATION } from '../../domain/farm-configuration'

it('shares definition work across mission edits and moves the dock without rebuilding topology', () => {
  const build = vi.spyOn(model, 'createRobotModel')
  const owner = new RobotProjection()
  const report = assessRobotDesign(
    validateRobot(DEFAULT_ROBOT),
    DEFAULT_CONFIGURATION
  )
  const first = owner.update(report)
  const bounds = owner.bounds(2.45, -1.8)
  expect(bounds.min[2]).toBeLessThan(-2.8)
  expect(bounds.max[1]).toBeCloseTo(1.2)
  expect(bounds.max[0]).toBeGreaterThan(3.7)
  const moved = owner.update(
    assessRobotDesign(
      validateRobot({ ...DEFAULT_ROBOT, dockX: 10, patrolMinutes: 30 }),
      DEFAULT_CONFIGURATION
    )
  )
  expect(build).toHaveBeenCalledTimes(1)
  expect(moved.find((m) => m.id === 'robot.chassis')?.descriptor.shape).toBe(
    first.find((m) => m.id === 'robot.chassis')?.descriptor.shape
  )
  expect(
    moved.find((m) => m.id === 'robot.chassis')?.descriptor.position[0]
  ).toBe(10)
  expect(
    first.find((m) => m.id === 'robot.chassis')?.descriptor.position[0]
  ).toBe(2.45)
  owner.update(
    assessRobotDesign(
      validateRobot({ ...DEFAULT_ROBOT, width: 0.7 }),
      DEFAULT_CONFIGURATION
    )
  )
  expect(build).toHaveBeenCalledTimes(2)
  const invalid = owner.update({ ...report, lane: null })
  expect(invalid.some((m) => m.id === 'robot.route')).toBe(false)
  expect(invalid.some((m) => m.id === 'robot.chassis')).toBe(true)
  owner.clear()
  build.mockRestore()
})

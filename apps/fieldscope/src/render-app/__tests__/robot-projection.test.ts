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

it('owns one immutable rig source and rejects retired pose inputs without geometry work', () => {
  const build = vi.spyOn(model, 'createRobotModel')
  try {
    const owner = new RobotProjection()
    const report = assessRobotDesign(
      validateRobot(DEFAULT_ROBOT),
      DEFAULT_CONFIGURATION
    )
    const meshes = owner.update(report)
    const source = owner.getSource()
    expect(source.parts[0].shape).toBe(meshes[0].descriptor.shape)
    expect(source.rig?.parts[0].source).toBe(source.parts[0])
    const joints = { lift: 0, yaw: 0, shoulder: 0, elbow: 0, wrist: 0 }
    for (let i = 0; i < 10; i++) {
      expect(owner.getSource()).toBe(source)
      owner.evaluatePose(source, joints)
    }
    owner.update(
      assessRobotDesign(
        validateRobot({ ...DEFAULT_ROBOT, dockX: 3, patrolMinutes: 40 }),
        DEFAULT_CONFIGURATION
      )
    )
    expect(owner.getSource()).toBe(source)
    expect(build).toHaveBeenCalledTimes(1)
    owner.update(
      assessRobotDesign(
        validateRobot({ ...DEFAULT_ROBOT, tool: 'tomato' }),
        DEFAULT_CONFIGURATION
      )
    )
    expect(owner.getSource().revision).not.toBe(source.revision)
    expect(() => owner.evaluatePose(source, joints)).toThrow()
    expect(build).toHaveBeenCalledTimes(2)
    const current = owner.getSource()
    owner.clear()
    expect(() => owner.getSource()).toThrow()
    expect(() => owner.evaluatePose(current, joints)).toThrow()
  } finally {
    build.mockRestore()
  }
})

it('retains parked source while an unsupported full lift stroke remains unavailable', () => {
  const owner = new RobotProjection()
  const report = assessRobotDesign(
    validateRobot(DEFAULT_ROBOT),
    DEFAULT_CONFIGURATION
  )
  const meshes = owner.update({
    ...report,
    settings: { ...report.settings, height: 0.6 }
  })
  const source = owner.getSource()
  expect(meshes.some((mesh) => mesh.id === 'robot.chassis')).toBe(true)
  expect(source.rig).toBeNull()
  expect(source.unavailable).toBe('unsupported-lift')
  expect(() =>
    owner.evaluatePose(source, {
      lift: 0,
      yaw: 0,
      shoulder: 0,
      elbow: 0,
      wrist: 0
    })
  ).toThrow('lift')
  expect(owner.getSource()).toBe(source)
})

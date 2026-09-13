import { expect, it, vi } from 'vitest'
import { SiteGeometry } from '../../render-app/site-geometry'
import { RobotProjection } from '../../render-app/robot-projection'
import { DEFAULT_CONFIGURATION } from '../../domain/farm-configuration'
import {
  DEFAULT_ROBOT,
  assessRobotDesign
} from '../../domain/robot-configuration'
import { REST_JOINTS, type RobotJoints } from '../../domain/robot-kinematics'
import * as kinematics from '../../domain/robot-kinematics'
import * as models from '../../domain/robot-model'
import * as crops from '../../domain/crop-models'
import { QueryGeometry } from '../geometry'
import { SurfaceQueries } from '../collision'
import { JointSegments, type JointSegmentInput } from '../motion'

function setup(height = DEFAULT_ROBOT.height) {
  const site = new SiteGeometry(),
    robot = new RobotProjection()
  const farm = {
    ...DEFAULT_CONFIGURATION,
    strips: [{ id: 'soil', kind: 'soil' as const, width: 6.3 }]
  }
  const scene = site.prepareScene(farm, [])
  robot.update(assessRobotDesign({ ...DEFAULT_ROBOT, height }, farm))
  const receipt = Object.freeze({
    revision: 1,
    scene,
    robot: robot.getSource(),
    dock: robot.getDockSource()
  })
  const geometry = new QueryGeometry({
    isCurrentReceipt: (value) => value === receipt,
    isCurrentScene: site.isCurrentScene.bind(site),
    isCurrentRobot: robot.isCurrentSource.bind(robot),
    isCurrentDock: robot.isCurrentDockSource.bind(robot)
  })
  return {
    site,
    robot,
    geometry,
    source: geometry.prepare(receipt),
    motion: new JointSegments(geometry)
  }
}
const input = (): JointSegmentInput => ({
  source: 'synthetic',
  assumption: 'Declared joint-space segment',
  from: 0,
  until: 1,
  start: { ...REST_JOINTS },
  end: { ...REST_JOINTS }
})
const nextUp = (value: number) => {
  const data = new DataView(new ArrayBuffer(8))
  data.setFloat64(0, value)
  data.setBigUint64(0, data.getBigUint64(0) + 1n)
  return data.getFloat64(0)
}

it('admits exact rig speed boundaries for all five joints without physical movement claims', () => {
  const f = setup(),
    segment = input(),
    rig = f.source.receipt.robot.rig
  if (!rig) throw new Error('Missing fixture rig')
  segment.end = { ...rig.speeds }
  const result = f.motion.assess(f.source, segment)
  expect(result.status).toBe('admissible')
  for (const key of Object.keys(rig.limits) as (keyof RobotJoints)[])
    expect(result.checks[key]).toEqual({ limits: 'within', speed: 'within' })
  expect(result.source).toBe(f.source)
  expect(result.work).toEqual({ joints: 5, exactComparisons: 5 })
  expect(result).not.toHaveProperty('clearance')
  expect(result).not.toHaveProperty('pose')
  expect(Object.isFrozen(result.checks.yaw)).toBe(true)
  segment.end.lift = 0
  expect(result.input.end.lift).toBe(rig.speeds.lift)
})

it('rejects just-over speeds and preserves exact full-stroke arithmetic beyond rounded products', () => {
  const f = setup(),
    rig = f.source.receipt.robot.rig
  if (!rig) throw new Error('Missing rig')
  for (const key of Object.keys(rig.speeds) as (keyof RobotJoints)[]) {
    const segment = input()
    segment.end[key] = nextUp(rig.speeds[key])
    const result = f.motion.assess(f.source, segment)
    expect(result.status).toBe('invalid')
    expect(result.checks[key].speed).toBe('outside')
  }
  const segment = input()
  segment.start.lift = -0.1
  segment.end.lift = 0.1
  segment.until = 10
  // Rounded subtraction/product agree, but the original finite dyadic values do not.
  expect(segment.end.lift - segment.start.lift).toBe(
    rig.speeds.lift * segment.until
  )
  expect(f.motion.assess(f.source, segment).checks.lift.speed).toBe('outside')
  segment.until = nextUp(10)
  expect(f.motion.assess(f.source, segment).status).toBe('admissible')
})

it('uses original closed joint limits and never wraps an out-of-range angle', () => {
  const f = setup(),
    rig = f.source.receipt.robot.rig
  if (!rig) throw new Error('Missing rig')
  for (const key of Object.keys(rig.limits) as (keyof RobotJoints)[]) {
    const segment = input()
    segment.start[key] = rig.limits[key][0]
    segment.end[key] = rig.limits[key][1]
    segment.until = 1000
    expect(f.motion.assess(f.source, segment).status).toBe('admissible')
    segment.end[key] = nextUp(rig.limits[key][1])
    expect(f.motion.assess(f.source, segment).checks[key].limits).toBe(
      'outside'
    )
  }
  const segment = input()
  segment.end.yaw = Math.PI * 2
  segment.until = 1000
  expect(f.motion.assess(f.source, segment).checks.yaw.limits).toBe('outside')
})

it('preserves finite huge and subnormal durations without overflow or underflow admission', () => {
  const f = setup(),
    segment = input()
  segment.until = Number.MIN_VALUE
  expect(f.motion.assess(f.source, segment).status).toBe('admissible')
  segment.end.lift = Number.MIN_VALUE
  expect(f.motion.assess(f.source, segment).checks.lift.speed).toBe('outside')
  segment.until = Number.MAX_VALUE
  segment.end.lift = 0.1
  expect(f.motion.assess(f.source, segment).status).toBe('admissible')
})

it('validates one detached exact schema before returning candidate evidence', () => {
  const f = setup()
  for (const value of [NaN, Infinity, -Infinity]) {
    const segment = input()
    segment.end.yaw = value
    expect(() => f.motion.assess(f.source, segment)).toThrow()
  }
  for (const value of [0, -1, NaN, Infinity]) {
    const segment = input()
    segment.until = value
    expect(() => f.motion.assess(f.source, segment)).toThrow()
  }
  for (const start of [{ lift: 0 }, { ...REST_JOINTS, extra: 0 }, new Array(5)])
    expect(() =>
      f.motion.assess(f.source, { ...input(), start } as JointSegmentInput)
    ).toThrow()
  const segment = input()
  let reads = 0
  Object.defineProperty(segment, 'until', {
    enumerable: true,
    get: () => (++reads === 1 ? 1 : NaN)
  })
  expect(f.motion.assess(f.source, segment).status).toBe('admissible')
  expect(reads).toBe(1)
})

it('uses current issued sources and performs no FK, query or geometry preparation', () => {
  const f = setup(),
    fk = vi.spyOn(kinematics, 'evaluateRobotPose'),
    model = vi.spyOn(models, 'createRobotModel'),
    crop = vi.spyOn(crops, 'createCropModels'),
    prepare = vi.spyOn(f.geometry, 'prepare'),
    query = vi.spyOn(SurfaceQueries.prototype, 'sweep')
  try {
    f.motion.assess(f.source, input())
    expect(fk).not.toHaveBeenCalled()
    expect(model).not.toHaveBeenCalled()
    expect(crop).not.toHaveBeenCalled()
    expect(prepare).not.toHaveBeenCalled()
    expect(query).not.toHaveBeenCalled()
    expect(() => f.motion.assess({ ...f.source }, input())).toThrow()
    const stale = input()
    Object.defineProperty(stale, 'until', {
      enumerable: true,
      get: () => {
        f.site.clear()
        return 1
      }
    })
    expect(() => f.motion.assess(f.source, stale)).toThrow()
    expect(() => f.motion.assess(f.source, input())).toThrow()
  } finally {
    fk.mockRestore()
    model.mockRestore()
    crop.mockRestore()
    prepare.mockRestore()
    query.mockRestore()
  }
})

it('retains upstream rejection of an unavailable real rig instead of forging an issued source', () => {
  expect(() => setup(0.6)).toThrow('Robot rigid ownership unavailable')
})

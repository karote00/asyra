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
import * as arithmetic from '../../domain/scalar-arithmetic'
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

const windowFor = (queryFrom = 0, queryUntil = 1) => ({
  queryFrom,
  queryUntil,
  validFrom: 0,
  validUntil: 2
})
type Rational = readonly [bigint, bigint]
function exact(value: number): Rational {
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value)
  const bits = view.getBigUint64(0),
    power = Number((bits >> 52n) & 2047n)
  const integer =
    ((bits & ((1n << 52n) - 1n)) | (power ? 1n << 52n : 0n)) *
    (bits >> 63n ? -1n : 1n)
  const shift = power ? power - 1075 : -1074
  return shift < 0
    ? [integer, 1n << BigInt(-shift)]
    : [integer << BigInt(shift), 1n]
}
const radd = (a: Rational, b: Rational): Rational => [
  a[0] * b[1] + b[0] * a[1],
  a[1] * b[1]
]
const rsub = (a: Rational, b: Rational): Rational => radd(a, [-b[0], b[1]])
const rmul = (a: Rational, b: Rational): Rational => [a[0] * b[0], a[1] * b[1]]
function expectedAt(
  segment: JointSegmentInput,
  time: number,
  key: keyof RobotJoints
): Rational {
  const first = exact(segment.from),
    last = exact(segment.until),
    t = exact(time)
  const numerator = radd(
    rmul(exact(segment.start[key]), rsub(last, t)),
    rmul(exact(segment.end[key]), rsub(t, first))
  )
  const duration = rsub(last, first)
  return [numerator[0] * duration[1], numerator[1] * duration[0]]
}
function adjacent(value: number, up: boolean) {
  if (value === 0) return up ? Number.MIN_VALUE : -Number.MIN_VALUE
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value)
  view.setBigUint64(0, view.getBigUint64(0) + (value > 0 === up ? 1n : -1n))
  return view.getFloat64(0)
}
function nearest(value: number, expected: Rational) {
  const distance = (point: number) => {
    const delta = rsub(exact(point), expected)
    return [delta[0] < 0n ? -delta[0] : delta[0], delta[1]] as const
  }
  const here = distance(value)
  for (const other of [adjacent(value, false), adjacent(value, true)]) {
    const there = distance(other),
      comparison = here[0] * there[1] - there[0] * here[1]
    expect(comparison <= 0n).toBe(true)
    if (comparison === 0n) {
      const view = new DataView(new ArrayBuffer(8))
      view.setFloat64(0, value)
      expect(view.getBigUint64(0) & 1n).toBe(0n)
    }
  }
}

it('encloses exact point-time extrema for forward reverse constant and rounded midpoint ties', () => {
  const f = setup(),
    segment = input()
  segment.start = {
    lift: -0.01,
    yaw: 0.1,
    shoulder: 0.125,
    elbow: -0,
    wrist: 0.25
  }
  segment.end = {
    lift: 0.01,
    yaw: -0.05,
    shoulder: nextUp(0.125),
    elbow: 0,
    wrist: 0.25
  }
  for (const [a, b] of [
    [0, 1],
    [0.25, 0.75],
    [0.5, 0.5]
  ]) {
    const result = f.motion.enclose(f.source, segment, windowFor(a, b))
    for (const key of Object.keys(segment.start) as (keyof RobotJoints)[]) {
      nearest(result.start[key], expectedAt(segment, a, key))
      nearest(result.end[key], expectedAt(segment, b, key))
      expect(result.domains[key]).toEqual([
        Math.min(result.start[key], result.end[key]),
        Math.max(result.start[key], result.end[key])
      ])
      for (const time of [a, (a + b) / 2, b]) {
        const point = f.motion.enclose(f.source, segment, windowFor(time, time))
          .start[key]
        nearest(point, expectedAt(segment, time, key))
        expect(point).toBeGreaterThanOrEqual(result.domains[key][0])
        expect(point).toBeLessThanOrEqual(result.domains[key][1])
      }
    }
    expect(result.work.pointEvaluations).toBe(a === b ? 1 : 2)
    if (a === b) expect(result.start).toBe(result.end)
    if (a === 0) expect(Object.is(result.start.elbow, -0)).toBe(true)
    if (b === 1) expect(Object.is(result.end.elbow, 0)).toBe(true)
    expect(result.work.conversions).toBeLessThanOrEqual(10)
  }
  expect(
    f.motion.enclose(f.source, segment, windowFor(0.5, 0.5)).start.shoulder
  ).toBe(0.125)
  expect(
    Object.is(
      f.motion.enclose(f.source, segment, windowFor(0.5, 0.5)).start.elbow,
      0
    )
  ).toBe(true)
})

it('encloses subnormal and extreme finite time without rounded-duration or endpoint clamps', () => {
  const f = setup()
  for (const [from, until] of [
    [0, Number.MIN_VALUE],
    [1e300, nextUp(nextUp(1e300))],
    [0, 1e300]
  ]) {
    const segment = input()
    segment.from = from
    segment.until = until
    segment.start.yaw =
      from === 0 && until === Number.MIN_VALUE
        ? Number.MIN_VALUE
        : -Number.MIN_VALUE
    segment.end.yaw = Number.MIN_VALUE
    const time = from === 0 ? until / 2 : nextUp(from)
    const request = {
      queryFrom: time,
      queryUntil: time,
      validFrom: 0,
      validUntil: nextUp(until)
    }
    const result = f.motion.enclose(f.source, segment, request)
    nearest(result.start.yaw, expectedAt(segment, time, 'yaw'))
    expect(result.work.maxBigIntBits).toBeLessThanOrEqual(24000)
  }
  const segment = input()
  segment.start.lift = -0.1
  segment.end.lift = 0.1
  segment.until = 10
  expect(() =>
    f.motion.enclose(f.source, segment, {
      ...windowFor(),
      queryUntil: 10,
      validUntil: 11
    })
  ).toThrow()
  segment.until = nextUp(10)
  expect(
    f.motion.enclose(f.source, segment, {
      ...windowFor(),
      queryUntil: segment.until,
      validUntil: 11
    }).end.lift
  ).toBe(0.1)
})

it('rejects incomplete validity invalid windows and caller-forged admissibility', () => {
  const f = setup(),
    segment = input()
  for (const request of [
    windowFor(0, 2),
    windowFor(0.7, 0.2),
    { ...windowFor(), validUntil: 1 },
    { ...windowFor(), validFrom: 0.1 },
    { ...windowFor(), queryFrom: NaN },
    { ...windowFor(), validUntil: Infinity },
    { ...windowFor(), extra: 1 }
  ])
    expect(() => f.motion.enclose(f.source, segment, request)).toThrow()
  expect(() =>
    f.motion.enclose(
      f.source,
      { ...segment, status: 'admissible' } as JointSegmentInput,
      windowFor()
    )
  ).toThrow()
  const forged = f.motion.assess(f.source, segment)
  expect(() =>
    f.motion.enclose(
      f.source,
      forged as unknown as JointSegmentInput,
      windowFor()
    )
  ).toThrow()
})

it('uses one detached admission and window snapshot with current-source checks and no FK or geometry work', () => {
  const f = setup(),
    segment = input(),
    request = windowFor(0.2, 0.8)
  let segmentReads = 0,
    windowReads = 0
  Object.defineProperty(segment, 'until', {
    enumerable: true,
    get: () => {
      segmentReads++
      return 1
    }
  })
  Object.defineProperty(request, 'queryFrom', {
    enumerable: true,
    get: () => {
      windowReads++
      return 0.2
    }
  })
  const assess = vi.spyOn(f.motion, 'assess'),
    point = vi.spyOn(kinematics, 'evaluateRobotPose'),
    interval = vi.spyOn(kinematics, 'evaluateRobotIntervalPose'),
    model = vi.spyOn(models, 'createRobotModel'),
    prepare = vi.spyOn(f.geometry, 'prepare')
  try {
    const result = f.motion.enclose(f.source, segment, request)
    expect(assess).toHaveBeenCalledTimes(1)
    expect(segmentReads).toBe(1)
    expect(windowReads).toBe(1)
    expect(result.source).toBe(f.source)
    expect(result.segment).toBe(assess.mock.results[0].value)
    segment.start.yaw = 0.1
    request.queryUntil = 0.9
    expect(result.segment.input.start.yaw).toBe(0)
    expect(result.window.queryUntil).toBe(0.8)
    expect(Object.isFrozen(result.domains.yaw)).toBe(true)
    expect(Object.isFrozen(result.start)).toBe(true)
    expect(point).not.toHaveBeenCalled()
    expect(interval).not.toHaveBeenCalled()
    expect(model).not.toHaveBeenCalled()
    expect(prepare).not.toHaveBeenCalled()
    expect(() =>
      f.motion.enclose({ ...f.source }, input(), windowFor())
    ).toThrow()
    const stale = windowFor()
    Object.defineProperty(stale, 'queryFrom', {
      enumerable: true,
      get: () => {
        f.site.clear()
        return 0
      }
    })
    expect(() => f.motion.enclose(f.source, input(), stale)).toThrow()
    expect(() => f.motion.enclose(f.source, input(), windowFor())).toThrow()
  } finally {
    assess.mockRestore()
    point.mockRestore()
    interval.mockRestore()
    model.mockRestore()
    prepare.mockRestore()
  }
})

it('profiles fixed normal and extreme point-domain requests within existing exact work guards', () => {
  const f = setup(),
    all = performance.now(),
    report = []
  for (const kind of ['normal', 'extreme'] as const) {
    const segment = input()
    segment.until = kind === 'normal' ? 100 : 1e300
    segment.start.yaw = -0.5
    segment.end.yaw = 0.5
    segment.start.lift = -Number.MIN_VALUE
    segment.end.lift = Number.MIN_VALUE
    const start = performance.now()
    let points = 0,
      conversions = 0,
      maxBigIntBits = 0
    for (let index = 0; index < 100; index++) {
      if (performance.now() - start > 1000 || performance.now() - all > 10000)
        throw new Error('Point-domain profile guard exceeded')
      const a = segment.until * (index / 200),
        b = segment.until * ((index + 1) / 200)
      const result = f.motion.enclose(f.source, segment, {
        queryFrom: a,
        queryUntil: b,
        validFrom: 0,
        validUntil: nextUp(segment.until)
      })
      points += result.work.pointEvaluations
      conversions += result.work.conversions
      maxBigIntBits = Math.max(maxBigIntBits, result.work.maxBigIntBits)
      expect(result.work.pointEvaluations).toBeLessThanOrEqual(2)
      expect(result.work.conversions).toBeLessThanOrEqual(10)
    }
    const milliseconds = performance.now() - start
    expect(milliseconds).toBeLessThanOrEqual(1000)
    expect(performance.now() - all).toBeLessThanOrEqual(10000)
    expect(conversions).toBeLessThanOrEqual(1000)
    expect(maxBigIntBits).toBeLessThanOrEqual(24000)
    report.push({ kind, points, conversions, maxBigIntBits, milliseconds })
  }
  console.info('point-domain profile', JSON.stringify(report))
})

it('counts actual shared conversions and rejects retirement during exact point work', () => {
  const f = setup(),
    segment = input(),
    original = arithmetic.roundFraction
  segment.end.yaw = 0.1
  const convert = vi.spyOn(arithmetic, 'roundFraction')
  try {
    const result = f.motion.enclose(f.source, segment, windowFor(0.25, 0.75))
    expect(result.work.conversions).toBe(convert.mock.calls.length)
    expect(convert).toHaveBeenCalledTimes(10)
    convert.mockClear()
    f.motion.enclose(f.source, segment, windowFor(0, 1))
    expect(convert).not.toHaveBeenCalled()
    convert.mockImplementation((...args) => {
      const value = original(...args)
      f.site.clear()
      return value
    })
    expect(() =>
      f.motion.enclose(f.source, segment, windowFor(0.25, 0.75))
    ).toThrow()
    expect(result.domains.yaw[0]).toBe(0.025)
  } finally {
    convert.mockRestore()
  }
})

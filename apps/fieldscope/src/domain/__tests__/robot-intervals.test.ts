import { expect, it, vi } from 'vitest'
import * as trig from '../kinematic-trigonometry'
import * as scalar from '../scalar-arithmetic'
import * as models from '../robot-model'
import {
  evaluateRobotIntervalPose,
  evaluateRobotAffinePose,
  prepareRobotRig,
  REST_JOINTS,
  ROBOT_JOINT_LIMITS,
  type JointDomains,
  type RobotJoints
} from '../robot-kinematics'
import { DEFAULT_ROBOT } from '../robot-configuration'
import type { Interval } from '../scalar-arithmetic'

const centre: RobotJoints = {
  lift: 0.02,
  yaw: 0.3,
  shoulder: -0.4,
  elbow: 0.5,
  wrist: -0.2
}
const box = (joints: RobotJoints, radius = 0): JointDomains =>
  Object.fromEntries(
    Object.entries(joints).map(([key, value]) => [
      key,
      [value - radius, value + radius]
    ])
  ) as unknown as JointDomains
const singleton = (joints: RobotJoints): JointDomains =>
  Object.fromEntries(
    Object.entries(joints).map(([key, value]) => [key, [value, value]])
  ) as unknown as JointDomains
const makeRig = () =>
  prepareRobotRig(DEFAULT_ROBOT, models.createRobotModel(DEFAULT_ROBOT))
function contains(bounds: readonly Interval[], values: readonly number[]) {
  values.forEach((value, index) => {
    expect(bounds[index].low).toBeLessThanOrEqual(value)
    expect(bounds[index].high).toBeGreaterThanOrEqual(value)
  })
}
function enclose(
  result: ReturnType<typeof evaluateRobotIntervalPose>,
  point: ReturnType<typeof evaluateRobotAffinePose>
) {
  result.parts.forEach((part, index) => {
    expect(part.source).toBe(point.parts[index].source)
    expect(part.body).toBe(point.parts[index].body)
    contains(part.transform.position, point.parts[index].transform.position)
    contains(part.transform.rotation, point.parts[index].transform.rotation)
    contains(part.affine.position, point.parts[index].affine.position)
    part.affine.matrix.forEach((row, axis) =>
      contains(row, point.parts[index].affine.matrix[axis])
    )
  })
  for (const key of ['shoulder', 'elbow', 'wrist'] as const)
    contains(result.pose.frames[key], point.pose.frames[key])
  for (const key of ['position', 'closing', 'approach', 'up'] as const)
    contains(result.pose.tool[key], point.pose.tool[key])
}
function widths(result: ReturnType<typeof evaluateRobotIntervalPose>) {
  const width = (values: readonly Interval[]) =>
    Math.max(...values.map((v) => v.high - v.low))
  const positions = [
    ...result.parts.map((p) => p.transform.position),
    ...Object.values(result.pose.frames),
    result.pose.tool.position
  ]
  const coefficients = [
    ...result.parts.flatMap((p) => [p.transform.rotation, ...p.affine.matrix]),
    result.pose.tool.closing,
    result.pose.tool.approach,
    result.pose.tool.up
  ]
  return {
    position: Math.max(...positions.map(width)),
    coefficient: Math.max(...coefficients.map(width))
  }
}

it('encloses singleton point and final affine results including limits signed zero subnormals and nondefault sources', () => {
  const cases = [
    REST_JOINTS,
    centre,
    { lift: -0, yaw: -0, shoulder: 0, elbow: -0, wrist: 0 },
    {
      lift: 0,
      yaw: Number.MIN_VALUE,
      shoulder: -Number.MIN_VALUE,
      elbow: 3 * Number.MIN_VALUE,
      wrist: -5 * Number.MIN_VALUE
    },
    ...Object.entries(ROBOT_JOINT_LIMITS).flatMap(([key, values]) =>
      values.map((value) => ({ ...REST_JOINTS, [key]: value }))
    )
  ]
  for (const definition of [
    DEFAULT_ROBOT,
    {
      ...DEFAULT_ROBOT,
      width: 0.35,
      length: 0.6,
      height: 0.8,
      tool: 'tomato' as const
    }
  ]) {
    const rig = prepareRobotRig(definition, models.createRobotModel(definition))
    for (const joints of cases) {
      const result = evaluateRobotIntervalPose(rig, singleton(joints))
      expect(result.rig).toBe(rig)
      enclose(result, evaluateRobotAffinePose(rig, joints))
    }
  }
})

it('encloses full and zero-crossing joint boxes through the one canonical chain', () => {
  const rig = makeRig()
  for (const domains of [
    rig.limits,
    box(REST_JOINTS, 0.001),
    box(centre, 0.01)
  ]) {
    const result = evaluateRobotIntervalPose(rig, domains)
    // Samples check integration; shared exact arithmetic/trig oracles prove
    // enclosure soundness. They do not turn this box into a time trajectory.
    for (const fraction of [0, 0.17, 0.5, 0.83, 1]) {
      const joints = Object.fromEntries(
        Object.entries(domains).map(([key, [low, high]]) => [
          key,
          low + (high - low) * fraction
        ])
      ) as unknown as RobotJoints
      enclose(result, evaluateRobotAffinePose(rig, joints))
    }
    expect(Number.isFinite(widths(result).position)).toBe(true)
    expect(Number.isFinite(widths(result).coefficient)).toBe(true)
    expect(result).not.toHaveProperty('clear')
    expect(result).not.toHaveProperty('trajectory')
  }
})

it('keeps the predeclared rest singleton and narrow-box tightness thresholds', () => {
  const rig = makeRig()
  for (const joints of [REST_JOINTS, centre]) {
    const actual = widths(evaluateRobotIntervalPose(rig, singleton(joints)))
    expect(actual.position).toBeLessThanOrEqual(1e-10)
    expect(actual.coefficient).toBeLessThanOrEqual(1e-10)
  }
  const wide = widths(evaluateRobotIntervalPose(rig, box(centre, 1e-6)))
  const narrow = widths(evaluateRobotIntervalPose(rig, box(centre, 1e-7)))
  for (const key of ['position', 'coefficient'] as const) {
    expect(wide[key]).toBeLessThanOrEqual(1e-3)
    expect(narrow[key]).toBeLessThanOrEqual(2e-4)
    expect(narrow[key]).toBeLessThanOrEqual(wide[key])
  }
})

it('rejects malformed and accessor snapshots before any scalar or trig work', () => {
  const rig = makeRig(),
    sum = vi.spyOn(scalar, 'add'),
    bound = vi.spyOn(trig, 'boundPolynomialTrig')
  try {
    let reads = 0
    const accessor = {
      ...singleton(centre),
      get yaw() {
        reads++
        return [NaN, 0]
      }
    }
    const cases = [
      { ...singleton(centre), yaw: new Array(2) },
      { ...singleton(centre), wrist: [1, 0] },
      { ...singleton(centre), lift: [-0.2, 0.2] },
      { ...singleton(centre), yaw: [0, Infinity] },
      { ...singleton(centre), extra: [0, 0] },
      accessor
    ]
    for (const domains of cases)
      expect(() =>
        evaluateRobotIntervalPose(rig, domains as JointDomains)
      ).toThrow()
    expect(reads).toBe(1)
    expect(sum).not.toHaveBeenCalled()
    expect(bound).not.toHaveBeenCalled()
  } finally {
    sum.mockRestore()
    bound.mockRestore()
  }
})

it('shares actual affine work only within one call and freezes owned evidence without rebuilding sources', () => {
  const rig = makeRig(),
    input = box(centre, 1e-6)
  const bound = vi.spyOn(trig, 'boundPolynomialTrig'),
    generation = vi.spyOn(models, 'createRobotModel'),
    pointTrig = vi.spyOn(trig, 'evaluatePolynomialTrig')
  const basic = [
    vi.spyOn(scalar, 'add'),
    vi.spyOn(scalar, 'subtract'),
    vi.spyOn(scalar, 'multiply'),
    vi.spyOn(scalar, 'divide')
  ]
  try {
    const first = evaluateRobotIntervalPose(rig, input)
    expect(first.work.fk).toBe(1)
    expect(first.work.trigCalls).toBe(8)
    expect(bound).toHaveBeenCalledTimes(8)
    expect(first.work.polynomialEvaluations).toBe(
      bound.mock.results.reduce(
        (sum, result) => sum + result.value.work.evaluations,
        0
      )
    )
    expect(first.work.terms).toBe(
      bound.mock.results.reduce(
        (sum, result) => sum + result.value.work.terms,
        0
      )
    )
    expect(first.work.maxBigIntBits).toBe(
      Math.max(
        ...bound.mock.results.map((result) => result.value.work.maxBigIntBits)
      )
    )
    expect(first.work.matrices).toBe(
      new Set(first.parts.map((part) => part.transform)).size
    )
    expect(first.work.scalarOperations).toBeGreaterThan(0)
    expect(first.work.scalarOperations).toBe(
      basic.reduce((sum, operation) => sum + operation.mock.calls.length, 0)
    )
    expect(pointTrig).not.toHaveBeenCalled()
    first.parts.forEach((part) => {
      expect(part.affine).toBe(
        first.parts.find((other) => other.transform === part.transform)?.affine
      )
      expect(part.affine.position).toBe(part.transform.position)
      expect(Object.isFrozen(part.affine.matrix[0][0])).toBe(true)
    })
    expect(Object.isFrozen(first.pose.domains)).toBe(true)
    expect(Object.isFrozen(first.work)).toBe(true)
    expect(Object.isFrozen(input)).toBe(false)
    const second = evaluateRobotIntervalPose(rig, input)
    expect(second).not.toBe(first)
    expect(second.parts[0].affine).not.toBe(first.parts[0].affine)
    expect(second.parts[0].source).toBe(first.parts[0].source)
    expect(bound).toHaveBeenCalledTimes(16)
    expect(generation).not.toHaveBeenCalled()
    const captured = first.pose.domains.yaw[0]
    ;(input.yaw as unknown as number[])[0] = 0
    expect(first.pose.domains.yaw[0]).toBe(captured)
    bound.mockImplementation(() => {
      throw new Error('stopped scalar')
    })
    expect(() => evaluateRobotIntervalPose(rig, input)).toThrow(
      'stopped scalar'
    )
    expect(first.work.trigCalls).toBe(8)
  } finally {
    bound.mockRestore()
    generation.mockRestore()
    pointTrig.mockRestore()
    basic.forEach((operation) => operation.mockRestore())
  }
})

it('profiles four fixed complete interval-entry batches without caches or expanded guards', () => {
  const rig = makeRig(),
    started = performance.now(),
    report = []
  for (const kind of ['normal', 'subnormal'] as const)
    for (const pass of ['first', 'repeated'] as const) {
      const start = performance.now()
      let trigCalls = 0,
        evaluations = 0,
        terms = 0,
        maxBigIntBits = 0,
        matrices = 0,
        scalarOperations = 0
      for (let index = 0; index < 25; index++) {
        if (
          performance.now() - start > 1000 ||
          performance.now() - started > 10000
        )
          throw new Error('Interval profile budget exceeded')
        const domains =
          kind === 'normal'
            ? box({ ...centre, yaw: centre.yaw + index / 1000 }, 1e-6)
            : ({
                lift: [0, 0],
                yaw: [2 * Number.MIN_VALUE, 6 * Number.MIN_VALUE],
                shoulder: [-10 * Number.MIN_VALUE, -2 * Number.MIN_VALUE],
                elbow: [6 * Number.MIN_VALUE, 14 * Number.MIN_VALUE],
                wrist: [-18 * Number.MIN_VALUE, -10 * Number.MIN_VALUE]
              } as JointDomains)
        const result = evaluateRobotIntervalPose(rig, domains),
          work = result.work
        trigCalls += work.trigCalls
        evaluations += work.polynomialEvaluations
        terms += work.terms
        matrices += work.matrices
        scalarOperations += work.scalarOperations
        maxBigIntBits = Math.max(maxBigIntBits, work.maxBigIntBits)
        expect(Number.isFinite(widths(result).coefficient)).toBe(true)
      }
      const milliseconds = performance.now() - start
      expect(milliseconds).toBeLessThanOrEqual(1000)
      expect(performance.now() - started).toBeLessThanOrEqual(10000)
      expect(trigCalls).toBe(200)
      expect(evaluations).toBeLessThanOrEqual(400)
      expect(maxBigIntBits).toBeLessThanOrEqual(24000)
      report.push({
        kind,
        pass,
        trigCalls,
        evaluations,
        terms,
        maxBigIntBits,
        matrices,
        scalarOperations,
        milliseconds
      })
    }
  console.info('complete interval profile', JSON.stringify(report))
})

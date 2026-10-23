import { expect, it, vi } from 'vitest'
import * as trig from '../kinematic-trigonometry'
import { DEFAULT_ROBOT } from '../robot-configuration'
import { createRobotModel } from '../robot-model'
import {
  prepareRobotRig,
  evaluateRobotPose,
  evaluateRobotDomains,
  transformRobotPoint,
  type KinematicAlgebra,
  type RobotRig,
  type RobotJoints,
  type JointDomains,
  REST_JOINTS,
  ROBOT_JOINT_LIMITS
} from '../robot-kinematics'

// Immutable evidence captured from the real pre-switch point entry. The labeled
// historical adapter now reproduces it through the same chain, never a fallback.
const definitions = [
  DEFAULT_ROBOT,
  { ...DEFAULT_ROBOT, tool: 'tomato' as const },
  { ...DEFAULT_ROBOT, width: 0.35, length: 0.6, height: 0.8 },
  { ...DEFAULT_ROBOT, width: 2, length: 3, height: 3, tool: 'tomato' as const }
]
const poses = [
  REST_JOINTS,
  { lift: -0, yaw: -0, shoulder: -0, elbow: -0, wrist: -0 },
  { lift: -0, yaw: 0, shoulder: -0, elbow: 0, wrist: -0 },
  { lift: 0.037, yaw: -0.71, shoulder: 0.29, elbow: -0.83, wrist: 0.47 },
  ...Object.entries(ROBOT_JOINT_LIMITS).flatMap(([key, bounds]) =>
    bounds.map((value) => ({ ...REST_JOINTS, [key]: value }))
  )
]
function bits(values: readonly number[]) {
  const view = new DataView(new ArrayBuffer(8))
  return values
    .map((value) => {
      view.setFloat64(0, value)
      return view.getBigUint64(0).toString(16).padStart(16, '0')
    })
    .join(' ')
}

// Test-only preceding numerical model; topology remains solely C-owned.
const historicalAlgebra: KinematicAlgebra<number> = {
  literal: (value) => value,
  range: (low, high) => {
    if (!Object.is(low, high)) throw new Error('Expected singleton')
    return low
  },
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
  sin: Math.sin,
  cos: Math.cos
}
function historicalPose(rig: RobotRig, joints: RobotJoints) {
  const domains = Object.fromEntries(
    Object.entries(joints).map(([key, value]) => [key, [value, value]])
  ) as unknown as JointDomains
  return { joints, ...evaluateRobotDomains(rig, domains, historicalAlgebra) }
}

it('captures immutable pre-polynomial numeric point outputs for the original 56 fixtures', () => {
  expect(poses).toHaveLength(14)
  expect(bits([-0])).not.toBe(bits([0]))
  const evidence = definitions.map((definition) => {
    const rig = prepareRobotRig(definition, createRobotModel(definition))
    const bodies = [...new Set(rig.parts.map((part) => part.body))]
    return {
      // Store the invariant part/reference order once per definition.
      parts: rig.parts.map(
        (part) => `${part.source.id}:${part.body}:${bodies.indexOf(part.body)}`
      ),
      definition: [
        definition.width,
        definition.length,
        definition.height,
        definition.tool
      ],
      poses: poses.map((joints) => {
        const pose = historicalPose(rig, joints)
        const unique = [...new Set(pose.parts.map((part) => part.transform))]
        pose.parts.forEach((part, index) => {
          expect(part.source).toBe(rig.parts[index].source)
          expect(part.body).toBe(rig.parts[index].body)
          expect(unique.indexOf(part.transform)).toBe(bodies.indexOf(part.body))
          expect(part.transform).toBe(
            pose.parts.find((other) => other.body === part.body)?.transform
          )
        })
        return {
          joints: bits(Object.values(pose.joints)),
          transforms: unique.map((transform) => ({
            position: bits(transform.position),
            rotation: bits(transform.rotation)
          })),
          frames: Object.fromEntries(
            Object.entries(pose.frames).map(([key, value]) => [
              key,
              bits(value)
            ])
          ),
          tool: Object.fromEntries(
            Object.entries(pose.tool).map(([key, value]) => [key, bits(value)])
          )
        }
      })
    }
  })
  expect(evidence).toMatchSnapshot()
})

it('uses eight shared polynomial results at the actual rounded half-angles before publishing a point pose', () => {
  const rig = prepareRobotRig(DEFAULT_ROBOT, createRobotModel(DEFAULT_ROBOT))
  const call = vi.spyOn(trig, 'evaluatePolynomialTrig')
  try {
    for (const joints of [
      poses[3],
      {
        lift: 0,
        yaw: Number.MIN_VALUE,
        shoulder: -Number.MIN_VALUE,
        elbow: 3 * Number.MIN_VALUE,
        wrist: -5 * Number.MIN_VALUE
      }
    ]) {
      call.mockClear()
      const result = evaluateRobotPose(rig, joints)
      expect(call).toHaveBeenCalledTimes(8)
      const angles = [joints.yaw, joints.shoulder, joints.elbow, joints.wrist]
      angles.forEach((angle, index) => {
        expect(call.mock.calls[index * 2][0]).toBe('sin')
        expect(call.mock.calls[index * 2 + 1][0]).toBe('cos')
        expect(Object.is(call.mock.calls[index * 2][1], angle / 2)).toBe(true)
        expect(Object.is(call.mock.calls[index * 2 + 1][1], angle / 2)).toBe(
          true
        )
      })
      expect(result.parts[0].source).toBe(rig.parts[0].source)
    }
    call.mockClear()
    expect(() =>
      evaluateRobotPose(rig, { ...REST_JOINTS, yaw: Infinity })
    ).toThrow()
    expect(call).not.toHaveBeenCalled()
  } finally {
    call.mockRestore()
  }
})

type Fraction = readonly [bigint, bigint]
const plus = (a: Fraction, b: Fraction): Fraction => [
  a[0] * b[1] + b[0] * a[1],
  a[1] * b[1]
]
const times = (a: Fraction, b: Fraction): Fraction => [a[0] * b[0], a[1] * b[1]]
const less = (a: Fraction, b: Fraction) => a[0] * b[1] < b[0] * a[1]
it('proves the approved-domain quaternion norm bound with exact rational recurrence', () => {
  const u: Fraction = [1n, 1n << 53n],
    delta = times([2n, 1n], u)
  let factorial = 1n
  for (let n = 2n; n <= 21n; n++) factorial *= n
  // |x|<1: S19/C20 analytic remainders are <=1/21! and <=1/22!.
  // Each monotone polynomial has magnitude <=1; RN absolute error <=u,
  // including subnormals. Thus each axis component error is below 2u.
  expect(less([1n, factorial], u)).toBe(true)
  for (const [key, limits] of Object.entries(ROBOT_JOINT_LIMITS)) {
    if (key === 'lift') continue
    limits.forEach((angle) => expect(Math.abs(angle / 2)).toBeLessThan(1))
  }
  // Operands <=2: four rounded products contribute <=20u; intermediate
  // three sums have magnitude <21, contributing <=66u including underflow.
  // 128u safely bounds their total. No Math.hypot accuracy is assumed.
  expect(less(times([86n, 1n], u), times([128n, 1n], u))).toBe(true)
  let error: Fraction = [0n, 1n]
  for (let step = 0; step < 4; step++) {
    error = plus(
      times([4n, 1n], plus(plus(error, delta), times(error, delta))),
      times([128n, 1n], u)
    )
    expect(less(error, [1n, 1n])).toBe(true) // closes component magnitude <=2
  }
  expect(less(error, [1n, 1n << 39n])).toBe(true)
  const norm: Fraction = [1n, 1n << 38n]
  const squared = plus(times([2n, 1n], norm), times(norm, norm))
  expect(less(squared, [1n, 100000000n])).toBe(true)
})

it('records old and new point drift on original source vertices without rewriting historical evidence', () => {
  let changed = 0,
    maxQuaternion = 0,
    maxTool = 0,
    maxVertex = 0
  for (const definition of definitions) {
    const rig = prepareRobotRig(definition, createRobotModel(definition))
    for (const joints of poses) {
      const old = historicalPose(rig, joints),
        current = evaluateRobotPose(rig, joints)
      maxTool = Math.max(
        maxTool,
        Math.hypot(
          ...current.tool.position.map(
            (value, i) => value - old.tool.position[i]
          )
        )
      )
      current.parts.forEach((part, index) => {
        const before = old.parts[index]
        expect(part.source).toBe(before.source)
        part.transform.rotation.forEach((value, i) => {
          if (!Object.is(value, before.transform.rotation[i])) changed++
          maxQuaternion = Math.max(
            maxQuaternion,
            Math.abs(value - before.transform.rotation[i])
          )
        })
        const squared = part.transform.rotation.reduce(
          (sum, value) => sum + value * value,
          0
        )
        expect(Math.abs(squared - 1)).toBeLessThan(1e-8) // regression, not global proof
        const positions = part.source.shape.positions
        for (let offset = 0; offset < positions.length; offset += 3) {
          const point = positions.slice(offset, offset + 3) as [
            number,
            number,
            number
          ]
          const a = transformRobotPoint(before.transform, point),
            b = transformRobotPoint(part.transform, point)
          maxVertex = Math.max(
            maxVertex,
            Math.hypot(...a.map((value, i) => value - b[i]))
          )
          if (joints === REST_JOINTS) expect(bits(a)).toBe(bits(b))
        }
      })
    }
  }
  console.info(
    'point model drift',
    JSON.stringify({ changed, maxQuaternion, maxTool, maxVertex })
  )
})

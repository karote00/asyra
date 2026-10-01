import { expect, it } from 'vitest'
import * as models from '../robot-model'
import { DEFAULT_ROBOT } from '../robot-configuration'
import type { Interval } from '../scalar-arithmetic'
import {
  evaluateRobotIntervalPose,
  prepareRobotRig,
  type JointDomains,
  type RobotJoints
} from '../robot-kinematics'

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
const makeRig = () =>
  prepareRobotRig(DEFAULT_ROBOT, models.createRobotModel(DEFAULT_ROBOT))
function widths(result: ReturnType<typeof evaluateRobotIntervalPose>) {
  const width = (values: readonly Interval[]) =>
    Math.max(...values.map((value) => value.high - value.low))
  const positions = [
    ...result.parts.map((part) => part.transform.position),
    ...Object.values(result.pose.frames),
    result.pose.tool.position
  ]
  const coefficients = [
    ...result.parts.flatMap((part) => [
      part.transform.rotation,
      ...part.affine.matrix
    ]),
    result.pose.tool.closing,
    result.pose.tool.approach,
    result.pose.tool.up
  ]
  return {
    position: Math.max(...positions.map(width)),
    coefficient: Math.max(...coefficients.map(width))
  }
}

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

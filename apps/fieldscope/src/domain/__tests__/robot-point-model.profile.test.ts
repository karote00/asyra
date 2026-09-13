import { expect, it, vi } from 'vitest'
import * as trig from '../kinematic-trigonometry'
import { DEFAULT_ROBOT } from '../robot-configuration'
import { createRobotModel } from '../robot-model'
import { evaluateRobotAffinePose, prepareRobotRig } from '../robot-kinematics'

it('profiles four complete affine-entry batches with the fixed scalar and elapsed guards', () => {
  const rig = prepareRobotRig(DEFAULT_ROBOT, createRobotModel(DEFAULT_ROBOT))
  const call = vi.spyOn(trig, 'evaluatePolynomialTrig'),
    started = performance.now(),
    report = []
  try {
    for (const kind of ['normal', 'subnormal'] as const)
      for (const pass of ['first', 'repeated'] as const) {
        const start = performance.now()
        let evaluations = 0,
          terms = 0,
          maxBigIntBits = 0,
          matrices = 0
        for (let pose = 0; pose < 100; pose++) {
          if (
            performance.now() - start > 1000 ||
            performance.now() - started > 10000
          )
            throw new Error('Point profile budget exceeded')
          const angles =
            kind === 'normal'
              ? [-0.7, -0.31, 0.19, 0.4].map((x) => 2 * (x + pose / 2000))
              : [2, 6, -2, -10].map(
                  (x) => x * (1 + 2 * (pose % 17)) * Number.MIN_VALUE
                )
          call.mockClear()
          const result = evaluateRobotAffinePose(rig, {
            lift: 0.02,
            yaw: angles[0],
            shoulder: angles[1],
            elbow: angles[2],
            wrist: angles[3]
          })
          expect(call).toHaveBeenCalledTimes(8)
          matrices += result.work.matrices
          for (const item of call.mock.results) {
            const work = item.value.work
            evaluations += work.evaluations
            terms += work.terms
            maxBigIntBits = Math.max(maxBigIntBits, work.maxBigIntBits)
          }
        }
        const milliseconds = performance.now() - start
        expect(milliseconds).toBeLessThanOrEqual(1000)
        expect(performance.now() - started).toBeLessThanOrEqual(10000)
        expect(evaluations).toBe(800)
        expect(terms).toBe(8400)
        expect(maxBigIntBits).toBeLessThanOrEqual(24000)
        report.push({
          kind,
          pass,
          evaluations,
          terms,
          maxBigIntBits,
          matrices,
          milliseconds
        })
      }
  } finally {
    call.mockRestore()
  }
  console.info('complete point profile', JSON.stringify(report))
})

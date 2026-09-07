import { expect, it } from 'vitest'
import { collisionStarterSnapshot } from '../../../domain/__tests__/collision-starter-fixture'
import { interval } from '../../../domain/interval'
import {
  evaluatePairKinematics,
  interpolateSegment,
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import { meshPoint, localPoint, worldPoint } from '../mesh-index'
import { queryOriginalPartPair } from '../original-part-method'
import { OriginalMeshQuery } from '../original-mesh-query'

it.each([
  { bodyId: 'example:workpiece', time: 3.856 },
  { bodyId: 'example:gripper', time: 3.8 }
])(
  'reports original $bodyId penetration at $time s independently of warning distance',
  async ({ bodyId, time }) => {
    const snapshot = await collisionStarterSnapshot()
    const movingBody = snapshot.workcell.bodies.find(
      (body) => body.id === bodyId
    )
    const table = snapshot.workcell.bodies.find(
      (body) => body.id === 'example:fixture-table'
    )
    if (!movingBody || !table) throw new Error('Missing original sample bodies')

    const part = movingBody.colliders[0]
    const ops = poseOperations(intervalAlgebra)
    const nextFrame = snapshot.trajectory.keyframes.findIndex(
      (frame) => frame.time > time
    )
    const poses = evaluatePairKinematics(
      snapshot.workcell,
      interpolateSegment(
        snapshot.trajectory,
        Math.max(0, nextFrame - 1),
        interval(time),
        intervalAlgebra
      ),
      movingBody.id,
      table.id,
      intervalAlgebra
    )
    const partPose = ops.compose(poses[0], ops.fromPose(part.pose))
    const tablePose = ops.compose(
      poses[1],
      ops.fromPose(table.colliders[0].pose)
    )

    if (part.geometry.kind !== 'mesh') throw new Error('Missing original part')
    const geometry = part.geometry

    // Independent source-space oracle: this strictly interior prism lies within
    // the authored tabletop slab, away from every bevel, groove and outside edge.
    // It is a test witness only, never a replacement runtime collision shape.
    const tableLocalVertices = Array.from(
      { length: geometry.positions.length / 3 },
      (_, index) =>
        localPoint(tablePose, worldPoint(partPose, meshPoint(geometry, index)))
    )
    const interiorVertices = tableLocalVertices.filter((point) =>
      point.every((axis, index) => {
        const halfExtent = [0.3, 0.059, 0.2][index]
        return axis[0] > -halfExtent && axis[1] < halfExtent
      })
    )
    expect(interiorVertices.length).toBeGreaterThan(0)

    for (const [threshold, hierarchy, reverse] of [
      [0, true, false],
      [0.02, true, false],
      [0.2, true, false],
      [0.02, false, false],
      [0.02, true, true]
    ] as const) {
      const a = { bodyId: movingBody.id, colliderId: part.id }
      const b = { bodyId: table.id, colliderId: table.colliders[0].id }
      const evidence = queryOriginalPartPair(
        {
          workcell: snapshot.workcell,
          trajectory: snapshot.trajectory,
          a: reverse ? b : a,
          b: reverse ? a : b,
          interval: [time, time]
        },
        {
          threshold,
          distanceTolerance: 1e-6,
          timeTolerance: 1e-4,
          maxIntervals: 1000,
          maxIterations: 48
        },
        undefined,
        new OriginalMeshQuery(undefined, undefined, hierarchy)
      )
      // Exhausting all gripper/table triangle pairs exceeds the unchanged
      // budget without the hierarchy. That reference must remain unknown,
      // never a fabricated clear result; the smaller workpiece oracle completes.
      if (bodyId === 'example:gripper' && !hierarchy) {
        expect(evidence.coverage).toBe('partial')
        expect(evidence.leaves[0].state).toBe('unresolved')
        expect(evidence.leaves[0].reason).toContain('work budget exhausted')
        continue
      }

      expect(evidence.leaves[0].penetration, `threshold ${threshold}`).toBe(
        true
      )
      expect(evidence.coverage).toBe('complete')
      expect(evidence.upper).toBe(0)
    }
  }
)

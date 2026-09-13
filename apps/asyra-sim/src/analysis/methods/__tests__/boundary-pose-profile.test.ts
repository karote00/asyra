import { expect, it } from 'vitest'
import {
  evaluatePairKinematics,
  interpolateSegment,
  intervalAlgebra,
  numberAlgebra,
  poseOperations,
  type Algebra
} from '../../../domain/kinematic-algebra'
import { interval, type Interval } from '../../../domain/interval'
import { representativeSnapshot } from './representative-fixture'

it('distinguishes canonical shared joints from the two actual endpoint pose enclosures', async () => {
  const snapshot = await representativeSnapshot(0)
  const pair = snapshot.pairs.find(
    (value) =>
      value.a.bodyId === 'example:joint-2' && value.b.bodyId === 'obstacle-11'
  )
  if (!pair) throw new Error('Missing admitted ordered pair')
  const boundary = 114
  const frame = snapshot.trajectory.keyframes[boundary]
  const keys = Object.keys(frame.joints).sort()
  const source = interpolateSegment(
    snapshot.trajectory,
    boundary,
    interval(frame.time),
    intervalAlgebra
  )
  const target = interpolateSegment(
    snapshot.trajectory,
    boundary - 1,
    interval(frame.time),
    intervalAlgebra
  )
  const sourceNumber = interpolateSegment(
    snapshot.trajectory,
    boundary,
    frame.time,
    numberAlgebra
  )
  const targetNumber = interpolateSegment(
    snapshot.trajectory,
    boundary - 1,
    frame.time,
    numberAlgebra
  )
  expect(Object.keys(source).sort()).toEqual(keys)
  expect(Object.keys(target).sort()).toEqual(keys)
  for (const key of keys) {
    for (const values of [source, target]) {
      expect(values[key][0]).toBeLessThanOrEqual(frame.joints[key])
      expect(values[key][1]).toBeGreaterThanOrEqual(frame.joints[key])
    }
  }
  const poses = <S>(
    values: Readonly<Record<string, S>>,
    algebra: Algebra<S>
  ) => {
    const bodyPoses = evaluatePairKinematics(
      snapshot.workcell,
      values,
      pair.a.bodyId,
      pair.b.bodyId,
      algebra
    )
    const ops = poseOperations(algebra)
    return [pair.a, pair.b].map((reference, side) => {
      const body = snapshot.workcell.bodies.find(
        (value) => value.id === reference.bodyId
      )
      const collider = body?.colliders.find(
        (value) => value.id === reference.colliderId
      )
      if (!collider) throw new Error('Missing original collider')
      return {
        geometry: collider.geometry,
        pose: ops.compose(bodyPoses[side], ops.fromPose(collider.pose))
      }
    })
  }
  const sourcePoses = poses(source, intervalAlgebra),
    targetPoses = poses(target, intervalAlgebra)
  const sourceNumberPoses = poses(sourceNumber, numberAlgebra),
    targetNumberPoses = poses(targetNumber, numberAlgebra)
  const identical = (a: Interval, b: Interval) =>
    Object.is(a[0], b[0]) && Object.is(a[1], b[1])
  const rows = sourcePoses.flatMap((shape, side) => {
    expect(shape.geometry).toBe(targetPoses[side].geometry)
    const a = [...shape.pose.position, ...shape.pose.rotation]
    const b = [
      ...targetPoses[side].pose.position,
      ...targetPoses[side].pose.rotation
    ]
    const an = [
      ...sourceNumberPoses[side].pose.position,
      ...sourceNumberPoses[side].pose.rotation
    ]
    const bn = [
      ...targetNumberPoses[side].pose.position,
      ...targetNumberPoses[side].pose.rotation
    ]
    return a.map((value, component) => ({
      side,
      component,
      source: value,
      target: b[component],
      identical: identical(value, b[component]),
      overlap:
        Math.max(value[0], b[component][0]) <=
        Math.min(value[1], b[component][1]),
      numberIdentical: Object.is(an[component], bn[component]),
      numberSource: an[component],
      numberTarget: bn[component]
    }))
  })
  expect(rows).toHaveLength(14)
  const differences = rows.filter((row) => !row.identical)
  // eslint-disable-next-line no-console -- exact endpoint identity diagnostic; overlap is not a membership certificate
  console.info(
    JSON.stringify({
      profile: 'boundary-pose',
      boundary,
      time: frame.time,
      joints: keys.map((key) => ({
        key,
        canonical: frame.joints[key],
        source: source[key],
        target: target[key],
        numberSource: sourceNumber[key],
        numberTarget: targetNumber[key],
        identical: identical(source[key], target[key])
      })),
      poseComponents: rows.length,
      unequalPoseComponents: differences.length,
      overlappingComponents: rows.filter((row) => row.overlap).length,
      unequalNumberComponents: rows.filter((row) => !row.numberIdentical)
        .length,
      differences
    })
  )
  // Only this recorded ordered pair and boundary establish exact pose identity.
  expect(differences).toEqual([])
  expect(keys.filter((key) => !identical(source[key], target[key]))).toEqual([
    'example:joint-4',
    'example:joint-6'
  ])
}, 20000)

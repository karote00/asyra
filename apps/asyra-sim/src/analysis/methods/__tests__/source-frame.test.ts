import { expect, it } from 'vitest'
import {
  add,
  mul,
  div,
  square,
  compare,
  sum,
  rational,
  rotation,
  enclosed,
  source
} from '../__fixtures__/source-frame-oracle'
import { interval, type Interval } from '../../../domain/interval'
import {
  intervalAlgebra,
  poseOperations,
  type AlgebraPose
} from '../../../domain/kinematic-algebra'
import type { Quaternion, Vec3 } from '../../../domain/math'
import {
  prepareSourceFrame,
  projectSourceFrames,
  type SourceFrame
} from '../source-frame'

const raw: Quaternion = [0, 0, 1, 2]
const ops = poseOperations(intervalAlgebra)
const identity = ops.identity()
function frame(geometry = source(), proposal = raw) {
  const result = prepareSourceFrame(geometry, proposal, () => undefined)
  expect(result).toBeDefined()
  if (!result) throw new Error('Missing complete source frame')
  return result
}

it.each(
  (
    [
      raw,
      [0, 0, -1, -2],
      [1, 2, 3, 4],
      [Number.MIN_VALUE, 0, 0, 0],
      [Number.MAX_VALUE, Number.MIN_VALUE, 0, -Number.MAX_VALUE]
    ] as Quaternion[]
  ).map((q) => [q])
)('encloses the original exact normalized quaternion %j', (q) => {
  const result = frame(source(), q),
    denominator = sum(q.map((value) => square(rational(value))))
  q.forEach((value, i) => {
    let range = result.pose.rotation[i]
    if (value === 0) {
      enclosed([0n, 1n], range)
      return
    }
    if (value < 0) range = [-range[1], -range[0]]
    const squared = div(square(rational(value)), denominator)
    if (range[0] > 0)
      expect(compare(square(rational(range[0])), squared)).toBeLessThanOrEqual(
        0n
      )
    expect(range[1]).toBeGreaterThan(0)
    expect(compare(squared, square(rational(range[1])))).toBeLessThanOrEqual(0n)
  })
})

it('encloses all original indexed source vertices and publishes only frozen geometry-bound data', () => {
  const geometry = source(14),
    result = frame(geometry),
    r = rotation(raw)
  for (const index of geometry.indices)
    for (let axis = 0; axis < 3; axis++) {
      const value = sum(
        [0, 1, 2].map((i) =>
          mul(r[i][axis], rational(geometry.positions[index * 3 + i]))
        )
      )
      enclosed(value, result.bounds[axis])
    }
  expect(result.source.kind).toBe('mesh')
  expect(result.source.geometry).toBe(geometry)
  expect(Object.isFrozen(result)).toBe(true)
  expect(Object.isFrozen(result.pose)).toBe(true)
  for (const group of [
    result.pose.rotation,
    result.pose.position,
    result.bounds
  ]) {
    expect(Object.isFrozen(group)).toBe(true)
    group.forEach((value) => expect(Object.isFrozen(value)).toBe(true))
  }
  // The distant final component must affect the box, not only the first octahedron.
  expect(result.bounds[0][1]).toBeGreaterThan(700)
})

it('copies the proposal at admission before later callbacks can mutate it', () => {
  const q = [0, 0, 1, 2],
    geometry = source()
  let calls = 0
  const result = prepareSourceFrame(
    geometry,
    q as unknown as Quaternion,
    () => {
      if (++calls === 2) q[2] = 100
    }
  )
  expect(result).toEqual(frame(geometry, raw))
  expect(calls).toBe(4)
})

it.each([1, 14])(
  'charges all source chunks and repeats completed work without a hidden cache - %i components',
  (copies) => {
    const geometry = source(copies),
      expected = 3 + Math.ceil(geometry.indices.length / 256)
    let first = 0,
      second = 0
    expect(prepareSourceFrame(geometry, raw, () => first++)).toEqual(
      prepareSourceFrame(geometry, raw, () => second++)
    )
    expect(first).toBe(expected)
    expect(second).toBe(first)
  }
)

it.each([1, 2, 3, 4, 5])(
  'does not publish interrupted multi-chunk preparation at charge %i',
  (stop) => {
    const geometry = source(14),
      failure = new Error('cancelled')
    let count = 0,
      published: SourceFrame | undefined
    expect(() => {
      published = prepareSourceFrame(geometry, raw, () => {
        if (++count === stop) throw failure
      })
    }).toThrow(failure)
    expect(published).toBeUndefined()
    expect(count).toBe(stop)
    expect(frame(geometry)).toBeDefined()
  }
)

it.each(
  (
    [
      [0, 0, 0, 0],
      [NaN, 0, 0, 1],
      [Infinity, 0, 0, 1]
    ] as Quaternion[]
  ).map((q) => [q])
)('rejects invalid q after paid admission - %j', (q) => {
  let work = 0
  expect(prepareSourceFrame(source(), q, () => work++)).toBeUndefined()
  expect(work).toBe(1)
})
it('does not admit mutable source buffers', () => {
  const geometry = source(),
    mutable = Object.freeze({ ...geometry, indices: [...geometry.indices] })
  let work = 0
  expect(prepareSourceFrame(mutable, raw, () => work++)).toBeUndefined()
  expect(work).toBe(1)
})

it.each([false, true])(
  'certifies the exact source gap five despite overlapping world boxes - reversed %s',
  (reverse) => {
    const f = frame(),
      shifted = ops.fromPose({ position: [-12, 9, 0], rotation: [0, 0, 0, 1] })
    let work = 0
    const result = projectSourceFrames(
      f,
      reverse ? shifted : identity,
      f,
      reverse ? identity : shifted,
      [-4, 3, 0],
      () => work++
    )
    expect(result).toBeDefined()
    if (!result) throw new Error('Missing source gap certificate')
    expect(result.lower).toBeGreaterThan(4.99)
    enclosed(rational(5), [result.lower, 5])
    // Tips 5v and 10v differ by (-4,3,0); squared norm is exactly 25.
    expect(
      compare(sum([-4, 3, 0].map((x) => square(rational(x)))), rational(25))
    ).toBe(0n)
    expect(work).toBe(3)
  }
)

it('contains every true source projection for complete interval translation and rotation poses', () => {
  const geometry = source(),
    f = frame(geometry)
  const pose: AlgebraPose<Interval> = {
    position: [interval(-1, 1), interval(-1, 1), interval(-1, 1)],
    rotation: [interval(0), interval(0), interval(0, 0.8), interval(0.6, 1)]
  }
  const quaternions: Quaternion[] = [
    [0, 0, 0, 1],
    [0, 0, 1, 2],
    [0, 0, 3, 4],
    [0, 0, 4, 3]
  ]
  for (const direction of [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [-4, 3, 0]
  ] as Vec3[]) {
    const projected = projectSourceFrames(
      f,
      pose,
      f,
      identity,
      direction,
      () => undefined
    )
    if (!projected) throw new Error('Missing interval projection')
    for (const q of quaternions)
      for (const t of [-1, 0, 1])
        for (const index of geometry.indices) {
          const r = rotation(q),
            point = [0, 1, 2].map((i) =>
              rational(geometry.positions[index * 3 + i])
            )
          const world = r.map((row) =>
            add(sum(row.map((value, i) => mul(value, point[i]))), rational(t))
          )
          enclosed(
            sum(world.map((value, i) => mul(value, rational(direction[i])))),
            projected.a
          )
        }
    expect(projected.lower).toBe(0)
  }
})

it.each([1, 2, 3])(
  'does not return an unpaid projection at operation %i',
  (stop) => {
    const f = frame(),
      failure = new Error('cancelled')
    let count = 0
    expect(() =>
      projectSourceFrames(f, identity, f, identity, [1, 0, 0], () => {
        if (++count === stop) throw failure
      })
    ).toThrow(failure)
    expect(count).toBe(stop)
  }
)
it('does not certify a degenerate projection direction', () => {
  const f = frame()
  let work = 0
  expect(
    projectSourceFrames(f, identity, f, identity, [0, 0, 0], () => work++)
  ).toBeUndefined()
  expect(work).toBe(3)
})

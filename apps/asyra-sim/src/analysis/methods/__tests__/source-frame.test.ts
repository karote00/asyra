import { expect, it } from 'vitest'
import { interval, type Interval } from '../../../domain/interval'
import {
  intervalAlgebra,
  poseOperations,
  type AlgebraPose
} from '../../../domain/kinematic-algebra'
import type { Quaternion, Vec3 } from '../../../domain/math'
import type { MeshGeometry } from '../../../domain/part-geometry'
import {
  prepareSourceFrame,
  projectSourceFrames,
  type SourceFrame
} from '../source-frame'

// Exact binary64 decoding and rational arithmetic: independent of production
// normalization, interval rotation, projection, and source-bound construction.
type Rational = readonly [bigint, bigint]
function rational(value: number): Rational {
  if (!Number.isFinite(value)) throw new Error('Nonfinite rational input')
  if (value === 0) return [0n, 1n]
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value)
  const bits = view.getBigUint64(0),
    exponent = Number((bits >> 52n) & 2047n)
  let numerator = bits & ((1n << 52n) - 1n)
  if (exponent) numerator += 1n << 52n
  if (bits >> 63n) numerator = -numerator
  let power = exponent ? exponent - 1075 : -1074
  while (power < 0 && numerator % 2n === 0n) {
    numerator /= 2n
    power++
  }
  return power >= 0
    ? [numerator << BigInt(power), 1n]
    : [numerator, 1n << BigInt(-power)]
}
const add = (a: Rational, b: Rational): Rational => [
  a[0] * b[1] + b[0] * a[1],
  a[1] * b[1]
]
const neg = (a: Rational): Rational => [-a[0], a[1]]
const sub = (a: Rational, b: Rational) => add(a, neg(b))
const mul = (a: Rational, b: Rational): Rational => [a[0] * b[0], a[1] * b[1]]
const div = (a: Rational, b: Rational): Rational => [a[0] * b[1], a[1] * b[0]]
const square = (a: Rational) => mul(a, a)
const compare = (a: Rational, b: Rational) => a[0] * b[1] - b[0] * a[1]
const sum = (items: readonly Rational[]) =>
  items.reduce(add, [0n, 1n] as Rational)
const twice = (a: Rational) => mul([2n, 1n], a)
function rotation(q: Quaternion): Rational[][] {
  const [x, y, z, w] = q.map(rational),
    n = sum([x, y, z, w].map(square))
  return [
    [
      sub(add(square(w), square(x)), add(square(y), square(z))),
      twice(sub(mul(x, y), mul(z, w))),
      twice(add(mul(x, z), mul(y, w)))
    ],
    [
      twice(add(mul(x, y), mul(z, w))),
      sub(add(square(w), square(y)), add(square(x), square(z))),
      twice(sub(mul(y, z), mul(x, w)))
    ],
    [
      twice(sub(mul(x, z), mul(y, w))),
      twice(add(mul(y, z), mul(x, w))),
      sub(add(square(w), square(z)), add(square(x), square(y)))
    ]
  ].map((row) => row.map((value) => div(value, n)))
}
function enclosed(value: Rational, range: Interval) {
  expect(compare(rational(range[0]), value)).toBeLessThanOrEqual(0n)
  expect(compare(value, rational(range[1]))).toBeLessThanOrEqual(0n)
}
const raw: Quaternion = [0, 0, 1, 2]
const ops = poseOperations(intervalAlgebra)
const identity = ops.identity()
function source(copies = 1): MeshGeometry {
  const positions: number[] = [],
    indices: number[] = []
  for (let copy = 0; copy < copies; copy++) {
    for (const [x, y, z] of [
      [12, 16, 0],
      [-12, -16, 0],
      [-4, 3, 0],
      [4, -3, 0],
      [0, 0, 5 / 8],
      [0, 0, -5 / 8]
    ])
      positions.push(x + copy * 100, y, z)
    for (const index of [
      0, 2, 4, 2, 1, 4, 1, 3, 4, 3, 0, 4, 2, 0, 5, 1, 2, 5, 3, 1, 5, 0, 3, 5
    ])
      indices.push(copy * 6 + index)
  }
  return Object.freeze({
    kind: 'mesh',
    version: 1,
    source: { assetId: 'a'.repeat(64), scale: [1, 1, 1] as const },
    positions: Object.freeze(positions),
    indices: Object.freeze(indices)
  })
}
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
  expect(result.geometry).toBe(geometry)
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

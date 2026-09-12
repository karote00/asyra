import { expect, it } from 'vitest'
import { IDENTITY_POSE } from '../../../domain/math'
import type { MeshGeometry } from '../../../domain/part-geometry'
import type { Body } from '../../../domain/workcell'
import type { PairQuery } from '../continuous-query'
import { queryOriginalPartPair } from '../original-part-method'

// Project-authored synthetic solids, not measured hardware, public dataset
// records, or independent human review. Each cube has eight exact dyadic
// vertices and twelve outward-oriented triangles. This test targets the
// admitted method boundary; source import/provenance has separate formal tests.
function cube(halfWidth: number): MeshGeometry {
  return Object.freeze({
    kind: 'mesh',
    version: 1,
    source: { assetId: 'a'.repeat(64), scale: [1, 1, 1] as const },
    positions: Object.freeze(
      [
        -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1,
        1, -1, 1, 1
      ].map((coordinate) => coordinate * halfWidth)
    ),
    indices: Object.freeze([
      0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0,
      4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5
    ])
  })
}

// Exact rational arithmetic, intentionally independent of production interval,
// pose, support, distance, and interpolation helpers. Binary64 outputs are
// decoded exactly; comparison never uses a rounded square root or epsilon.
type Rational = readonly [bigint, bigint]
const zero: Rational = [0n, 1n]
function rational(value: number): Rational {
  if (!Number.isFinite(value)) throw new Error('Nonfinite oracle input')
  const bits = new DataView(new ArrayBuffer(8))
  bits.setFloat64(0, value)
  const encoded = bits.getBigUint64(0)
  const exponent = Number((encoded >> 52n) & 2047n)
  let numerator = encoded & ((1n << 52n) - 1n)
  if (exponent !== 0) numerator += 1n << 52n
  if (encoded >> 63n) numerator = -numerator
  const power = exponent === 0 ? -1074 : exponent - 1075
  if (power >= 0) return [numerator << BigInt(power), 1n]
  return [numerator, 1n << BigInt(-power)]
}
const add = (a: Rational, b: Rational): Rational => [
  a[0] * b[1] + b[0] * a[1],
  a[1] * b[1]
]
const negate = (a: Rational): Rational => [-a[0], a[1]]
const square = (a: Rational): Rational => [a[0] * a[0], a[1] * a[1]]
const compare = (a: Rational, b: Rational) => a[0] * b[1] - b[0] * a[1]
const absolute = (a: Rational) => (a[0] < 0n ? negate(a) : a)
const xAt = (time: number): Rational => {
  const t = rational(time)
  return add([-2n, 1n], [4n * t[0], t[1]])
}

// Moving half width 1/8, fixed half width 1/16: combined half width 3/16.
// x(t)=-2+4t. Over [a,b], nearest |x| is zero if the segment spans zero,
// otherwise its nearer endpoint. Squared clearance is gx²+gy² where
// gx=max(nearest|x|-3/16,0), gy=max(offset-3/16,0).
function minimumSquared(start: number, end: number, offset: number): Rational {
  const a = xAt(start),
    b = xAt(end)
  let nearest = zero
  if (a[0] > 0n || b[0] < 0n) {
    nearest = absolute(a)
    if (compare(absolute(b), nearest) < 0n) nearest = absolute(b)
  }
  const gap = (coordinate: Rational) => {
    const result = add(coordinate, [-3n, 16n])
    return result[0] > 0n ? result : zero
  }
  return add(square(gap(nearest)), square(gap(rational(offset))))
}

function input(offset: number, reverse: boolean): PairQuery {
  const base: Body = {
    id: 'base',
    name: 'Base',
    parentId: null,
    role: 'robot',
    pose: IDENTITY_POSE,
    joint: { kind: 'fixed', axis: [1, 0, 0], value: 0, min: 0, max: 0 },
    visible: true,
    color: 0,
    colliders: []
  }
  const moving: Body = {
    ...base,
    id: 'moving',
    parentId: 'base',
    role: 'link',
    joint: { kind: 'prismatic', axis: [1, 0, 0], value: 0, min: -2, max: 2 },
    colliders: [{ id: 'part', pose: IDENTITY_POSE, geometry: cube(1 / 8) }]
  }
  const fixed: Body = {
    ...base,
    id: 'fixed',
    role: 'fixture',
    pose: { ...IDENTITY_POSE, position: [0, offset, 0] },
    colliders: [{ id: 'part', pose: IDENTITY_POSE, geometry: cube(1 / 16) }]
  }
  return {
    workcell: {
      version: 1,
      robotRootId: 'base',
      bodies: [base, moving, fixed]
    },
    trajectory: {
      version: 1,
      keyframes: [
        { time: 0, joints: { moving: -2 } },
        { time: 1 / 4, joints: { moving: -1 } },
        { time: 1 / 2, joints: { moving: 0 } },
        { time: 3 / 4, joints: { moving: 1 } },
        { time: 1, joints: { moving: 2 } }
      ]
    },
    interval: [0, 1],
    a: { bodyId: reverse ? 'fixed' : 'moving', colliderId: 'part' },
    b: { bodyId: reverse ? 'moving' : 'fixed', colliderId: 'part' }
  }
}

it.each([
  { offset: 0, reverse: false },
  { offset: 0, reverse: true },
  { offset: 1 / 2, reverse: false },
  { offset: 1 / 2, reverse: true }
])(
  'encloses exact mesh clearance on every leaf: $offset, reverse $reverse',
  ({ offset, reverse }) => {
    const threshold = offset === 0 ? 0 : 1 / 8
    const result = queryOriginalPartPair(input(offset, reverse), {
      threshold,
      distanceTolerance: 1e-6,
      timeTolerance: 1e-5,
      maxIntervals: 2048,
      maxIterations: 48
    })
    // Force both positive-distance leaves and crossing leaves, so the oracle
    // cannot pass by checking only the zero minimum of the whole trajectory.
    expect(result.leaves.length).toBeGreaterThanOrEqual(4)
    let cursor = 0
    for (const leaf of result.leaves) {
      expect(leaf.start).toBe(cursor)
      expect(leaf.end).toBeGreaterThan(leaf.start)
      cursor = leaf.end
      const exact = minimumSquared(leaf.start, leaf.end, offset)
      expect(leaf.lower).toBeGreaterThanOrEqual(0)
      expect(compare(square(rational(leaf.lower)), exact)).toBeLessThanOrEqual(
        0n
      )
      if (leaf.upper !== null) {
        expect(leaf.upper).toBeGreaterThanOrEqual(0)
        expect(
          compare(square(rational(leaf.upper)), exact)
        ).toBeGreaterThanOrEqual(0n)
      }
      if (leaf.state === 'clear')
        expect(compare(exact, square(rational(threshold)))).toBeGreaterThan(0n)
      if (leaf.witnessTime !== null) {
        expect(leaf.witnessTime).toBeGreaterThanOrEqual(leaf.start)
        expect(leaf.witnessTime).toBeLessThanOrEqual(leaf.end)
      }
      if (leaf.penetration) {
        expect(offset).toBe(0)
        expect(leaf.witnessTime).not.toBeNull()
        const time = rational(leaf.witnessTime as number)
        expect(compare(time, [29n, 64n])).toBeGreaterThan(0n)
        expect(compare(time, [35n, 64n])).toBeLessThan(0n)
      }
    }
    expect(cursor).toBe(1)
    if (offset === 0)
      expect(result.leaves.some((leaf) => leaf.penetration)).toBe(true)
    else {
      expect(result.coverage).toBe('complete')
      expect(result.leaves.every((leaf) => leaf.state === 'clear')).toBe(true)
      const exact = square([5n, 16n])
      expect(
        compare(square(rational(result.lower)), exact)
      ).toBeLessThanOrEqual(0n)
      expect(result.upper).not.toBeNull()
      expect(
        compare(square(rational(result.upper as number)), exact)
      ).toBeGreaterThanOrEqual(0n)
    }
  }
)

import { expect, it } from 'vitest'
import { interval } from '../../../domain/interval'
import {
  intervalAlgebra,
  poseOperations
} from '../../../domain/kinematic-algebra'
import { worldBounds, type Bounds } from '../mesh-index'

const ops = poseOperations(intervalAlgebra)
const bounds: Bounds = [
  [-1, 1],
  [-1 / 8, 1 / 8],
  [-1 / 16, 1 / 16]
]

// Decode binary64 independently, so an outward endpoint is compared to exact
// rational geometry rather than another rounded floating-point oracle.
function compare(
  value: number,
  numerator: bigint,
  denominator: bigint
): bigint {
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value)
  const bits = view.getBigUint64(0)
  const exponent = Number((bits >> 52n) & 2047n)
  let n = (bits & ((1n << 52n) - 1n)) | (exponent ? 1n << 52n : 0n)
  if (bits >> 63n) n = -n
  const shift = (exponent || 1) - 1023 - 52
  return shift >= 0
    ? (n << BigInt(shift)) * denominator - numerator
    : n * denominator - (numerator << BigInt(-shift))
}

it('encloses exact normalized rational rotation extrema without repeated source-width inflation', () => {
  // Normalized (0,0,3,4) gives cos=7/25 and sin=24/25 exactly.
  const result = worldBounds(
    bounds,
    ops.fromPose({ position: [0, 0, 0], rotation: [0, 0, 3, 4] })
  )
  const extrema = [
    [2n, 5n],
    [199n, 200n],
    [1n, 16n]
  ] as const
  for (let axis = 0; axis < 3; axis++) {
    const [n, d] = extrema[axis]
    expect(compare(result[axis][0], -n, d)).toBeLessThanOrEqual(0n)
    expect(compare(result[axis][1], n, d)).toBeGreaterThanOrEqual(0n)
    expect(result[axis][1] - result[axis][0]).toBeLessThan(
      Number(2n * n) / Number(d) + 1e-10
    )
  }
})

it.each([
  [0, 0, 0, 1],
  [0, 0, 1, 0]
] as const)(
  'keeps cardinal source widths tight for quaternion %j',
  (...rotation) => {
    const result = worldBounds(
      bounds,
      ops.fromPose({ position: [0, 0, 0], rotation })
    )
    for (let axis = 0; axis < 3; axis++) {
      expect(result[axis][0]).toBeLessThanOrEqual(bounds[axis][0])
      expect(result[axis][1]).toBeGreaterThanOrEqual(bounds[axis][1])
      expect(result[axis][1] - result[axis][0]).toBeLessThan(
        bounds[axis][1] - bounds[axis][0] + 1e-10
      )
    }
  }
)

it('encloses all box corners across a nontrivial interval rotation', () => {
  const result = worldBounds(bounds, {
    position: ops.vector([1, 2, 3]),
    rotation: ops.axisAngle([0, 0, 1], interval(-0.5, 0.5))
  })
  // Additional regression samples; conservatism comes from the interval formula.
  for (const angle of [-0.5, -0.25, 0, 0.25, 0.5])
    for (const x of bounds[0])
      for (const y of bounds[1])
        for (const z of bounds[2]) {
          const point = [
            1 + Math.cos(angle) * x - Math.sin(angle) * y,
            2 + Math.sin(angle) * x + Math.cos(angle) * y,
            3 + z
          ]
          for (let axis = 0; axis < 3; axis++) {
            expect(result[axis][0]).toBeLessThanOrEqual(point[axis])
            expect(result[axis][1]).toBeGreaterThanOrEqual(point[axis])
          }
        }
})

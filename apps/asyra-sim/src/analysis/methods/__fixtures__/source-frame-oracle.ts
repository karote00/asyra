import { expect } from 'vitest'
import type { Interval } from '../../../domain/interval'
import type { Quaternion } from '../../../domain/math'
import type { MeshGeometry } from '../../../domain/part-geometry'

// Exact binary64 decoding and rational arithmetic: independent of production
// normalization, interval rotation, projection, and source-bound construction.
export type Rational = readonly [bigint, bigint]
export function rational(value: number): Rational {
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
export const add = (a: Rational, b: Rational): Rational => [
  a[0] * b[1] + b[0] * a[1],
  a[1] * b[1]
]
const neg = (a: Rational): Rational => [-a[0], a[1]]
export const sub = (a: Rational, b: Rational) => add(a, neg(b))
export const mul = (a: Rational, b: Rational): Rational => [
  a[0] * b[0],
  a[1] * b[1]
]
export const div = (a: Rational, b: Rational): Rational => [
  a[0] * b[1],
  a[1] * b[0]
]
export const square = (a: Rational) => mul(a, a)
export const compare = (a: Rational, b: Rational) => a[0] * b[1] - b[0] * a[1]
export const sum = (items: readonly Rational[]) =>
  items.reduce(add, [0n, 1n] as Rational)
const twice = (a: Rational) => mul([2n, 1n], a)
export function rotation(q: Quaternion): Rational[][] {
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
export function enclosed(value: Rational, range: Interval) {
  expect(compare(rational(range[0]), value)).toBeLessThanOrEqual(0n)
  expect(compare(value, rational(range[1]))).toBeLessThanOrEqual(0n)
}
export function source(copies = 1): MeshGeometry {
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

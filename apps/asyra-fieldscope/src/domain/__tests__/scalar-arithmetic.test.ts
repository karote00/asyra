import { expect, it } from 'vitest'
import { roundFraction } from '../scalar-arithmetic'

function adjacent(value: number, up: boolean) {
  if (value === 0) return up ? Number.MIN_VALUE : -Number.MIN_VALUE
  const bits = new DataView(new ArrayBuffer(8))
  bits.setFloat64(0, value)
  const encoded = bits.getBigUint64(0)
  bits.setBigUint64(0, encoded + (value > 0 === up ? 1n : -1n))
  return bits.getFloat64(0)
}
function fraction(value: number): [bigint, bigint] {
  const bits = new DataView(new ArrayBuffer(8))
  bits.setFloat64(0, value)
  const encoded = bits.getBigUint64(0)
  const exponent = Number((encoded >> 52n) & 2047n)
  const mantissa = (encoded & ((1n << 52n) - 1n)) | (exponent ? 1n << 52n : 0n)
  const numerator = encoded >> 63n ? -mantissa : mantissa
  const shift = exponent ? exponent - 1075 : -1074
  return shift < 0
    ? [numerator, 1n << BigInt(-shift)]
    : [numerator << BigInt(shift), 1n]
}
function compare(value: number, n: bigint, d: bigint) {
  const [a, b] = fraction(value)
  return a * d - n * b
}

it('rounds rational normal and subnormal ties to even, including binade and zero boundaries', () => {
  const cases: [bigint, bigint, number][] = [
    [(1n << 53n) + 1n, 1n << 53n, 1],
    [(1n << 53n) + 3n, 1n << 53n, adjacent(adjacent(1, true), true)],
    [(1n << 54n) - 1n, 1n << 53n, 2],
    [1n, 1n << 1075n, 0],
    [3n, 1n << 1075n, 2 * Number.MIN_VALUE],
    [(1n << 53n) - 1n, 1n << 1075n, 2 ** -1022],
    [1n, 3n, 1 / 3]
  ]
  for (const [n, d, expected] of cases) {
    expect(Object.is(roundFraction(n, d, 'nearest-even'), expected)).toBe(true)
    expect(Object.is(roundFraction(-n, d, 'nearest-even'), -expected)).toBe(
      true
    )
    expect(Object.is(roundFraction(-n, -d, 'nearest-even'), expected)).toBe(
      true
    )
  }
})

it('encloses original rational values with tight directed binary64 neighbors', () => {
  for (const [n, d] of [
    [1n, 3n],
    [-1n, 3n],
    [1n, 2n],
    [1n, 1n << 1075n],
    [-1n, 1n << 1075n],
    [(1n << 90n) + 17n, 1n << 90n]
  ] as const) {
    const low = roundFraction(n, d, 'down'),
      high = roundFraction(n, d, 'up')
    expect(compare(low, n, d) <= 0n).toBe(true)
    expect(compare(high, n, d) >= 0n).toBe(true)
    if (low !== high) expect(adjacent(low, true)).toBe(high)
    else expect(compare(low, n, d)).toBe(0n)
  }
})

it('handles exact overflow thresholds and rejects malformed or oversized rational work', () => {
  const threshold = ((1n << 54n) - 1n) << 970n
  expect(roundFraction(threshold, 1n, 'nearest-even')).toBe(Infinity)
  expect(roundFraction(threshold - 1n, 1n, 'nearest-even')).toBe(
    Number.MAX_VALUE
  )
  expect(roundFraction(threshold, 1n, 'down')).toBe(Number.MAX_VALUE)
  expect(roundFraction(-threshold, 1n, 'up')).toBe(-Number.MAX_VALUE)
  expect(roundFraction(-threshold, 1n, 'down')).toBe(-Infinity)
  expect(() => roundFraction(1n, 0n, 'nearest-even')).toThrow()
  expect(() => roundFraction(1n, 1n, 'other' as 'up')).toThrow()
  expect(() => roundFraction(1n << 24000n, 1n, 'nearest-even')).toThrow(
    'budget'
  )
  expect(() =>
    roundFraction((1n << 23990n) + 1n, (1n << 23990n) + 3n, 'nearest-even')
  ).toThrow('budget')
})

it('reports actual temporary widths without changing conversion or sharing reentrant state', () => {
  const widths: number[] = []
  const n = 3n,
    d = 1n << 1075n
  const plain = roundFraction(n, d, 'nearest-even')
  let nested = false
  const observed = roundFraction(n, d, 'nearest-even', (bits) => {
    widths.push(bits)
    if (!nested) {
      nested = true
      expect(roundFraction(1n, 3n, 'nearest-even')).toBe(1 / 3)
    }
  })
  expect(Object.is(observed, plain)).toBe(true)
  expect(Math.max(...widths)).toBe(1076)
  expect(widths).toContain(1076)
  const normal: number[] = []
  expect(
    roundFraction(1n, 3n, 'nearest-even', (bits) => normal.push(bits))
  ).toBe(1 / 3)
  expect(Math.max(...normal)).toBe(55)
  expect(() =>
    roundFraction(1n, 3n, 'nearest-even', () => {
      throw new Error('observer stopped')
    })
  ).toThrow('observer stopped')
  expect(() =>
    roundFraction(
      1n,
      3n,
      'nearest-even',
      1 as unknown as (bits: number) => void
    )
  ).toThrow()
})

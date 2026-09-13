import { expect, it } from 'vitest'
import {
  interval,
  add,
  subtract,
  multiply,
  divide,
  squareRoot
} from '../query-arithmetic'

// Exact IEEE-754 rational oracle is independent of the production rounding path.
function rational(value: number): [bigint, bigint] {
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value)
  const bits = view.getBigUint64(0)
  const exponent = Number((bits >> 52n) & 2047n)
  const fraction = bits & ((1n << 52n) - 1n)
  const mantissa =
    (bits >> 63n ? -1n : 1n) * (exponent ? (1n << 52n) + fraction : fraction)
  const power = exponent ? exponent - 1023 - 52 : -1074
  return power >= 0
    ? [mantissa << BigInt(power), 1n]
    : [mantissa, 1n << BigInt(-power)]
}
function encloses(
  low: number,
  high: number,
  numerator: bigint,
  denominator: bigint
) {
  if (denominator < 0n) {
    numerator = -numerator
    denominator = -denominator
  }
  expect(low <= high).toBe(true)
  if (Number.isFinite(low)) {
    const [n, d] = rational(low)
    expect(n * denominator <= numerator * d).toBe(true)
  }
  if (Number.isFinite(high)) {
    const [n, d] = rational(high)
    expect(n * denominator >= numerator * d).toBe(true)
  }
}

it('encloses exact arithmetic across normal, subnormal and extreme finite values', () => {
  const values = [
    0,
    1,
    -1,
    0.1,
    -0.2,
    1e-14,
    100000,
    Number.MIN_VALUE,
    2 ** -1022,
    1e308
  ]
  for (const a of values)
    for (const b of values) {
      const [an, ad] = rational(a),
        [bn, bd] = rational(b)
      for (const [result, n, d] of [
        [add(interval(a), interval(b)), an * bd + bn * ad, ad * bd],
        [subtract(interval(a), interval(b)), an * bd - bn * ad, ad * bd],
        [multiply(interval(a), interval(b)), an * bn, ad * bd],
        ...(b
          ? [[divide(interval(a), interval(b)), an * bd, ad * bn] as const]
          : [])
      ] as const)
        encloses(result.low, result.high, n, d)
    }
})

it('retains generically exact operations and encloses non-perfect square roots', () => {
  for (const result of [
    add(interval(2), interval(3)),
    subtract(interval(8), interval(3)),
    multiply(interval(0.625), interval(8)),
    divide(interval(10), interval(2)),
    squareRoot(interval(25))
  ])
    expect(result).toEqual({ low: 5, high: 5 })
  for (const value of [0.1, 2, 3, Number.MIN_VALUE, 1e308]) {
    const result = squareRoot(interval(value))
    const [n, d] = rational(value),
      [lo, ld] = rational(result.low),
      [hi, hd] = rational(result.high)
    expect(lo * lo * d <= n * ld * ld).toBe(true)
    expect(hi * hi * d >= n * hd * hd).toBe(true)
  }
  expect(divide(interval(1), { low: -1, high: 1 })).toEqual({
    low: -Infinity,
    high: Infinity
  })
})

it('encloses exact rational predicate ratios without losing large integer significands', async () => {
  const { fractionInterval } = await import('../query-arithmetic')
  for (const [n, d] of [
    [1n, 10n],
    [-1n, 3n],
    [5n, 1n],
    [1n << 2048n, (1n << 2048n) + 1n],
    [(1n << 4096n) + 7n, 1n << 4095n]
  ] as const) {
    const result = fractionInterval(n, d)
    encloses(result.low, result.high, n, d)
    expect(Number.isFinite(result.low) && Number.isFinite(result.high)).toBe(
      true
    )
  }
  expect(fractionInterval(5n, 1n)).toEqual({ low: 5, high: 5 })
})

it('shares exactly one scalar implementation through the supported query facade', async () => {
  const common = await import('../../domain/scalar-arithmetic')
  const facade = await import('../query-arithmetic')
  const exports = [
    'interval',
    'add',
    'subtract',
    'multiply',
    'divide',
    'squareRoot',
    'dyadic',
    'fractionInterval'
  ] as const
  expect(Object.keys(common).sort()).toEqual([...exports].sort())
  expect(Object.keys(facade).sort()).toEqual([...exports].sort())
  for (const name of exports) expect(facade[name]).toBe(common[name])
  expect(Object.is(common.interval(-0).low, -0)).toBe(true)
  expect(
    common.add(
      common.interval(Number.MAX_VALUE),
      common.interval(Number.MAX_VALUE)
    )
  ).toEqual({ low: -Infinity, high: Infinity })
  expect(common.dyadic(Number.MIN_VALUE)).toEqual({
    significand: 1n,
    exponent: -1074
  })
  expect(common.fractionInterval(1n, 2n)).toEqual({ low: 0.5, high: 0.5 })
  expect(common.fractionInterval(1n, 0n)).toEqual({
    low: -Infinity,
    high: Infinity
  })
  expect(common.divide(common.interval(1), common.interval(0))).toEqual({
    low: -Infinity,
    high: Infinity
  })
})

import { expect, it } from 'vitest'
import {
  add,
  subtract,
  multiply,
  divide,
  interval,
  squareRoot,
  type Interval
} from '../query-arithmetic'

interface Fraction {
  numerator: bigint
  denominator: bigint
}

// Decode the original binary value; never use floating arithmetic to compute
// the expected sum/product/quotient or an epsilon to accept an incorrect bound.
function fraction(value: number): Fraction {
  if (!Number.isFinite(value)) throw new Error('Expected finite oracle input')
  const buffer = new DataView(new ArrayBuffer(8))
  buffer.setFloat64(0, value)
  const bits = buffer.getBigUint64(0)
  const exponent = Number((bits >> 52n) & 0x7ffn)
  const significand = (bits & 0xfffffffffffffn) | (exponent ? 1n << 52n : 0n)
  const signed = bits >> 63n ? -significand : significand
  const power = exponent ? exponent - 1075 : -1074
  return power >= 0
    ? { numerator: signed << BigInt(power), denominator: 1n }
    : { numerator: signed, denominator: 1n << BigInt(-power) }
}

function enclosed(result: Interval, expected: Fraction, context: string) {
  let { numerator, denominator } = expected
  if (denominator < 0n) {
    numerator = -numerator
    denominator = -denominator
  }
  expect(denominator > 0n, context).toBe(true)
  expect(result.low <= result.high, context).toBe(true)
  expect(result.low < Infinity, context).toBe(true)
  expect(result.high > -Infinity, context).toBe(true)
  if (Number.isFinite(result.low)) {
    const lower = fraction(result.low)
    expect(
      lower.numerator * denominator <= numerator * lower.denominator,
      `${context}: lower bound`
    ).toBe(true)
  }
  if (Number.isFinite(result.high)) {
    const upper = fraction(result.high)
    expect(
      upper.numerator * denominator >= numerator * upper.denominator,
      `${context}: upper bound`
    ).toBe(true)
  }
}

function checkCorners(left: Interval, right: Interval) {
  for (const a of [left.low, left.high]) {
    for (const b of [right.low, right.high]) {
      const x = fraction(a),
        y = fraction(b)
      const label = `${a}, ${b}`
      enclosed(
        add(left, right),
        {
          numerator: x.numerator * y.denominator + y.numerator * x.denominator,
          denominator: x.denominator * y.denominator
        },
        `add ${label}`
      )
      enclosed(
        subtract(left, right),
        {
          numerator: x.numerator * y.denominator - y.numerator * x.denominator,
          denominator: x.denominator * y.denominator
        },
        `subtract ${label}`
      )
      enclosed(
        multiply(left, right),
        {
          numerator: x.numerator * y.numerator,
          denominator: x.denominator * y.denominator
        },
        `multiply ${label}`
      )
      if (b !== 0)
        enclosed(
          divide(left, right),
          {
            numerator: x.numerator * y.denominator,
            denominator: x.denominator * y.numerator
          },
          `divide ${label}`
        )
    }
  }
}

function samples() {
  let state = 0x713c9e21
  const next = () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return state >>> 0
  }
  const buffer = new DataView(new ArrayBuffer(8))
  return Array.from({ length: 128 }, () => {
    const sign = BigInt(next() & 1) << 63n
    const exponent = BigInt(next() % 2047) << 52n
    const mantissa = (BigInt(next() & 0xfffff) << 32n) | BigInt(next())
    buffer.setBigUint64(0, sign | exponent | mantissa)
    return buffer.getFloat64(0)
  })
}

it('encloses exact corner extrema of reproducible full-exponent nonpoint intervals', () => {
  const values = samples()
  for (let i = 0; i < values.length; i += 4) {
    const [a, b, c, d] = values.slice(i, i + 4)
    checkCorners(
      { low: Math.min(a, b), high: Math.max(a, b) },
      { low: Math.min(c, d), high: Math.max(c, d) }
    )
  }
})

it('encloses reproducible binary operands before interval width can mask rounding errors', () => {
  const values = samples()
  for (let i = 0; i < values.length; i += 2)
    checkCorners(interval(values[i]), interval(values[i + 1]))
})

it('encloses cancellation, signed underflow and finite-input overflow without invalid infinite bounds', () => {
  const tiny = Number.MIN_VALUE
  for (const [left, right] of [
    [
      { low: -tiny, high: tiny },
      { low: 0.25, high: 0.75 }
    ],
    [
      { low: -3 * tiny, high: -tiny },
      { low: -4, high: -2 }
    ],
    [
      { low: 2 ** -540, high: 2 ** -530 },
      { low: 2 ** -540, high: 2 ** -530 }
    ],
    [
      { low: Number.MAX_VALUE / 2, high: Number.MAX_VALUE },
      { low: 2, high: 4 }
    ],
    [
      { low: -Number.MAX_VALUE, high: -Number.MAX_VALUE / 2 },
      { low: 2, high: 4 }
    ],
    [
      { low: 2 ** 53 - 1, high: 2 ** 53 },
      { low: -(2 ** 53), high: -(2 ** 53 - 1) }
    ],
    [
      { low: -1 - Number.EPSILON, high: -1 },
      { low: -tiny, high: tiny }
    ]
  ])
    checkCorners(left, right)
})

it('keeps generically exact cancellation and representable subnormal results as point intervals', () => {
  const tiny = Number.MIN_VALUE
  for (const [result, value] of [
    [add(interval(Number.MAX_VALUE), interval(-Number.MAX_VALUE)), 0],
    [subtract(interval(3 * tiny), interval(2 * tiny)), tiny],
    [multiply(interval(2 ** -537), interval(2 ** -537)), tiny],
    [divide(interval(-(2 ** -1022)), interval(2)), -(2 ** -1023)],
    [multiply(interval(-0.75), interval(8)), -6]
  ] as const) {
    expect(result.low).toBe(value)
    expect(result.high).toBe(value)
  }
})

it('encloses nonpoint square roots by exact endpoint squaring across exponent extremes', () => {
  const positive = [
    0,
    Number.MIN_VALUE,
    3 * Number.MIN_VALUE,
    2 ** -1022,
    1 - Number.EPSILON / 2,
    1 + Number.EPSILON,
    4,
    Number.MAX_VALUE
  ]
  for (let i = 0; i < positive.length - 1; i++) {
    const low = positive[i],
      high = positive[i + 1]
    const result = squareRoot({ low, high })
    expect(result.low >= 0 && result.low <= result.high).toBe(true)
    expect(Number.isFinite(result.high)).toBe(true)
    const lower = fraction(result.low),
      upper = fraction(result.high)
    const a = fraction(low),
      b = fraction(high)
    expect(
      lower.numerator ** 2n * a.denominator <=
        a.numerator * lower.denominator ** 2n
    ).toBe(true)
    expect(
      upper.numerator ** 2n * b.denominator >=
        b.numerator * upper.denominator ** 2n
    ).toBe(true)
  }
})

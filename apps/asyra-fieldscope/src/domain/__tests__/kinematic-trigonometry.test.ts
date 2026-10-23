import { expect, it } from 'vitest'
import {
  evaluatePolynomialTrig,
  boundPolynomialTrig,
  evaluateExactPolynomialTrig,
  boundExactPolynomialTrig,
  POLYNOMIAL_TRIG_SIGN_CERTIFICATE
} from '../kinematic-trigonometry'

type Kind = 'sin' | 'cos'
function rational(value: number): [bigint, bigint] {
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value)
  const bits = view.getBigUint64(0),
    e = Number((bits >> 52n) & 2047n)
  const n =
    ((bits & ((1n << 52n) - 1n)) | (e ? 1n << 52n : 0n)) *
    (bits >> 63n ? -1n : 1n)
  const shift = e ? e - 1075 : -1074
  return shift < 0 ? [n, 1n << BigInt(-shift)] : [n << BigInt(shift), 1n]
}
function factorial(n: number) {
  let value = 1n
  for (let i = 2; i <= n; i++) value *= BigInt(i)
  return value
}
// Independent direct sum of powers, not production Horner or its converter.
function polynomial(
  kind: Kind,
  x: number,
  degree = kind === 'sin' ? 19 : 20
): [bigint, bigint] {
  return rationalPolynomial(kind, rational(x), degree)
}
function rationalPolynomial(
  kind: Kind,
  input: readonly [bigint, bigint],
  degree = kind === 'sin' ? 19 : 20
): [bigint, bigint] {
  const [a, b] = input,
    f = factorial(degree)
  let n = 0n
  for (
    let power = kind === 'sin' ? 1 : 0, term = 0;
    power <= degree;
    power += 2, term++
  )
    n +=
      (term % 2 ? -1n : 1n) *
      (f / factorial(power)) *
      a ** BigInt(power) *
      b ** BigInt(degree - power)
  return [n, f * b ** BigInt(degree)]
}
function compare(a: readonly [bigint, bigint], b: readonly [bigint, bigint]) {
  return a[0] * b[1] - b[0] * a[1]
}
function adjacent(value: number, up: boolean) {
  if (value === 0) return up ? Number.MIN_VALUE : -Number.MIN_VALUE
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value)
  view.setBigUint64(0, view.getBigUint64(0) + (value > 0 === up ? 1n : -1n))
  return view.getFloat64(0)
}
function distance(value: number, n: bigint, d: bigint) {
  const [a, b] = rational(value),
    delta = a * d - n * b
  return [delta < 0n ? -delta : delta, b * d] as const
}
function nearest(value: number, expected: readonly [bigint, bigint]) {
  const here = distance(value, ...expected)
  for (const neighbor of [adjacent(value, false), adjacent(value, true)])
    expect(compare(here, distance(neighbor, ...expected)) <= 0n).toBe(true)
}

it('publishes exact positive polynomial evidence even when its display rounds to zero', () => {
  const input = { numerator: 1n, denominator: 1n << 1076n }
  const result = evaluateExactPolynomialTrig('sin', input)
  const expected = rationalPolynomial('sin', [
    input.numerator,
    input.denominator
  ])
  expect(
    compare([result.value.numerator, result.value.denominator], expected)
  ).toBe(0n)
  expect(result.sign).toBe(1)
  expect(Object.is(result.rounded, 0)).toBe(true)
  expect(result.value.numerator).toBeGreaterThan(0n)
  expect(result.work.maxBigIntBits).toBeLessThanOrEqual(24000)
  expect(result.work.admissionChecks).toBe(1)
  expect(result.work.normalizations).toBe(1)
  expect(result.work.gcdSteps).toBeGreaterThan(0)
  expect(Object.isFrozen(result.value)).toBe(true)
  expect(Object.isFrozen(input)).toBe(false)
})
it('keeps exact rational zero, odd/even identities and independently summed values', () => {
  const inputs = [
    [0n, 1n],
    [1n, 3n],
    [-2n, 7n],
    [7n, 8n]
  ] as const
  for (const kind of ['sin', 'cos'] as const)
    for (const [numerator, denominator] of inputs) {
      const result = evaluateExactPolynomialTrig(kind, {
        numerator,
        denominator
      })
      expect(
        compare(
          [result.value.numerator, result.value.denominator],
          rationalPolynomial(kind, [numerator, denominator])
        )
      ).toBe(0n)
      const opposite = evaluateExactPolynomialTrig(kind, {
        numerator: -numerator,
        denominator
      })
      expect(opposite.value).toEqual({
        ...result.value,
        numerator:
          kind === 'sin' ? -result.value.numerator : result.value.numerator
      })
      expect(result.input).toEqual({ numerator, denominator })
    }
  expect(
    evaluateExactPolynomialTrig('sin', { numerator: 0n, denominator: 1n }).value
  ).toEqual({ numerator: 0n, denominator: 1n })
  expect(
    evaluateExactPolynomialTrig('cos', { numerator: 0n, denominator: 1n }).value
  ).toEqual({ numerator: 1n, denominator: 1n })
})
it('certifies signs on the real open domain by fixed coefficient identities, not samples', () => {
  const proof = POLYNOMIAL_TRIG_SIGN_CERTIFICATE
  expect(proof.domain).toEqual({ low: -1, high: 1, open: true })
  expect(proof.factor).toBe(factorial(20))
  for (const [name, positive] of Object.entries(proof.positivePolynomials)) {
    const degree = name === 'cosine' ? 20 : 18
    const offset = name === 'sineOverInput' ? 1 : 0
    const expected = Array.from(
      { length: degree / 2 + 1 },
      (_, i) => (i % 2 ? -1n : 1n) * (factorial(20) / factorial(2 * i + offset))
    )
    expect(positive.coefficients).toEqual(expected)
    for (const pair of positive.pairs) {
      expect(pair.power % 2).toBe(0)
      expect(pair.constant).toBe(expected[pair.power])
      expect(pair.linear).toBe(expected[pair.power + 1])
      expect(pair.linear).toBeLessThan(0n)
      expect(pair.lowerAtOne).toBe(pair.constant + pair.linear)
      expect(pair.lowerAtOne).toBeGreaterThan(0n)
    }
    expect(positive.pairs.length * 2 + (positive.tail ? 1 : 0)).toBe(
      expected.length
    )
    if (positive.tail) {
      expect(positive.tail.coefficient).toBeGreaterThan(0n)
      expect(positive.tail.coefficient).toBe(expected[positive.tail.power])
    }
  }
  const sine = proof.positivePolynomials.sineOverInput.coefficients
  const cosine = proof.positivePolynomials.cosine.coefficients
  expect(sine.map((v, i) => v * BigInt(2 * i + 1))).toEqual(
    proof.positivePolynomials.sineDerivative.coefficients
  )
  expect(cosine.slice(1).map((v, i) => v * BigInt(2 * i + 2))).toEqual(
    sine.map((v) => -v)
  )
  expect(proof.sineZeros).toEqual([0])
  expect(proof.cosineZeros).toEqual([])
  expect(proof.sineSign).toBe('input-sign')
  expect(proof.cosineSign).toBe('positive')
  expect(Object.isFrozen(proof.positivePolynomials.cosine.pairs)).toBe(true)
})
it('separates exact extrema and zero loci from outward numeric enclosure', () => {
  const zero = { numerator: 0n, denominator: 1n }
  for (const kind of ['sin', 'cos'] as const)
    for (const [l, h] of [
      [
        [-2n, 3n],
        [1n, 4n]
      ],
      [
        [1n, 5n],
        [4n, 5n]
      ],
      [
        [-4n, 5n],
        [-1n, 5n]
      ]
    ] as const) {
      const input = {
        low: { numerator: l[0], denominator: l[1] },
        high: { numerator: h[0], denominator: h[1] }
      }
      const result = boundExactPolynomialTrig(kind, input)
      const candidates = [
        input.low,
        input.high,
        ...(l[0] <= 0n && h[0] >= 0n ? [zero] : [])
      ]
      const exacts = candidates.map((v) =>
        rationalPolynomial(kind, [v.numerator, v.denominator])
      )
      for (const value of exacts) {
        expect(
          compare(
            [result.bounds.low.numerator, result.bounds.low.denominator],
            value
          ) <= 0n
        ).toBe(true)
        expect(
          compare(
            [result.bounds.high.numerator, result.bounds.high.denominator],
            value
          ) >= 0n
        ).toBe(true)
        expect(compare(rational(result.outward.low), value) <= 0n).toBe(true)
        expect(compare(rational(result.outward.high), value) >= 0n).toBe(true)
      }
      expect(
        compare(
          [result.bounds.low.numerator, result.bounds.low.denominator],
          rationalPolynomial(kind, [
            result.extrema.minimumAt.numerator,
            result.extrema.minimumAt.denominator
          ])
        )
      ).toBe(0n)
      expect(
        compare(
          [result.bounds.high.numerator, result.bounds.high.denominator],
          rationalPolynomial(kind, [
            result.extrema.maximumAt.numerator,
            result.extrema.maximumAt.denominator
          ])
        )
      ).toBe(0n)
      expect(result.zeros).toEqual(
        kind === 'sin' && l[0] <= 0n && h[0] >= 0n ? [zero] : []
      )
      expect(result.certificate).toBe(POLYNOMIAL_TRIG_SIGN_CERTIFICATE)
      expect(Object.isFrozen(result.input.low)).toBe(true)
    }
})
it('rejects malformed/noncanonical rationals before polynomial products and guards exact temporary growth', () => {
  const cases = [
    null,
    { numerator: 1n, denominator: 0n },
    { numerator: 1n, denominator: -3n },
    { numerator: 0n, denominator: 2n },
    { numerator: 2n, denominator: 6n },
    { numerator: 1, denominator: 3n },
    { numerator: 1n, denominator: 1n },
    { numerator: 1n << 24001n, denominator: 3n }
  ]
  for (const value of cases)
    expect(() => evaluateExactPolynomialTrig('sin', value)).toThrow()
  expect(() =>
    evaluateExactPolynomialTrig('sin', {
      numerator: 1n,
      denominator: 1n << 1300n
    })
  ).toThrow(/budget/)
  expect(() =>
    boundExactPolynomialTrig('cos', {
      low: { numerator: 1n, denominator: 2n },
      high: { numerator: 1n, denominator: 3n }
    })
  ).toThrow()
  let reads = 0
  const input = {
    get numerator() {
      reads++
      return 1n
    },
    denominator: 3n
  }
  expect(evaluateExactPolynomialTrig('sin', input).input).toEqual({
    numerator: 1n,
    denominator: 3n
  })
  expect(reads).toBe(1)
})
it('preserves the established number API bits and exact work snapshots', () => {
  const expected = [
    {
      kind: 'sin',
      input: '0',
      bits: '0',
      work: { evaluations: 1, terms: 0, maxBigIntBits: 1 }
    },
    {
      kind: 'cos',
      input: '0',
      bits: '3ff0000000000000',
      work: { evaluations: 1, terms: 0, maxBigIntBits: 53 }
    },
    {
      kind: 'sin',
      input: '-0',
      bits: '8000000000000000',
      work: { evaluations: 1, terms: 0, maxBigIntBits: 1 }
    },
    {
      kind: 'cos',
      input: '-0',
      bits: '3ff0000000000000',
      work: { evaluations: 1, terms: 0, maxBigIntBits: 53 }
    },
    {
      kind: 'sin',
      input: '0.125',
      bits: '3fbfeaaeee86ee36',
      work: { evaluations: 1, terms: 10, maxBigIntBits: 1160 }
    },
    {
      kind: 'cos',
      input: '0.125',
      bits: '3fefc015527d5bd3',
      work: { evaluations: 1, terms: 11, maxBigIntBits: 1215 }
    },
    {
      kind: 'sin',
      input: '-0.375',
      bits: 'bfd7710255764214',
      work: { evaluations: 1, terms: 10, maxBigIntBits: 1140 }
    },
    {
      kind: 'cos',
      input: '-0.375',
      bits: '3fedc6b7eb995912',
      work: { evaluations: 1, terms: 11, maxBigIntBits: 1194 }
    },
    {
      kind: 'sin',
      input: '5e-324',
      bits: '1',
      work: { evaluations: 1, terms: 10, maxBigIntBits: 20469 }
    },
    {
      kind: 'cos',
      input: '5e-324',
      bits: '3ff0000000000000',
      work: { evaluations: 1, terms: 11, maxBigIntBits: 21595 }
    }
  ]
  const view = new DataView(new ArrayBuffer(8))
  for (const row of expected) {
    const result = evaluatePolynomialTrig(row.kind as Kind, Number(row.input))
    view.setFloat64(0, result.value)
    expect(view.getBigUint64(0).toString(16)).toBe(row.bits)
    expect(result.work).toEqual(row.work)
  }
})

it('rounds exact fixed polynomials with independent direct-sum evidence and signed zero', () => {
  for (const kind of ['sin', 'cos'] as const)
    for (const x of [
      0,
      -0,
      Number.MIN_VALUE,
      -Number.MIN_VALUE,
      3 * Number.MIN_VALUE,
      0.125,
      -0.375,
      Math.PI / 4,
      -Math.PI / 4,
      adjacent(1, false)
    ]) {
      const actual = evaluatePolynomialTrig(kind, x)
      nearest(actual.value, polynomial(kind, x))
      expect(actual.work.evaluations).toBe(1)
      expect(actual.work.maxBigIntBits).toBeLessThanOrEqual(24000)
      expect(Object.isFrozen(actual)).toBe(true)
    }
  expect(Object.is(evaluatePolynomialTrig('sin', -0).value, -0)).toBe(true)
  expect(evaluatePolynomialTrig('cos', -0).value).toBe(1)
})

it('bounds monotone polynomial extrema including a cosine interval crossing zero', () => {
  for (const kind of ['sin', 'cos'] as const)
    for (const [low, high] of [
      [-0.7, -0.1],
      [-0.4, 0.6],
      [0.2, 0.75],
      [0, 0],
      [-Number.MIN_VALUE, Number.MIN_VALUE]
    ]) {
      const result = boundPolynomialTrig(kind, { low, high })
      for (const x of [
        low,
        high,
        (low + high) / 2,
        ...(low <= 0 && high >= 0 ? [0] : [])
      ]) {
        const expected = polynomial(kind, x)
        expect(compare(rational(result.bounds.low), expected) <= 0n).toBe(true)
        expect(compare(rational(result.bounds.high), expected) >= 0n).toBe(true)
        const point = evaluatePolynomialTrig(kind, x).value
        expect(point >= result.bounds.low && point <= result.bounds.high).toBe(
          true
        )
      }
      expect(result.work.evaluations).toBeLessThanOrEqual(2)
      expect(Object.isFrozen(result.bounds)).toBe(true)
    }
  expect(boundPolynomialTrig('cos', { low: -0.3, high: 0.5 }).bounds.high).toBe(
    1
  )
})

it('separates analytic truncation from polynomial rounding using consecutive exact Taylor sums', () => {
  for (const x of [0.125, 0.5, Math.PI / 4]) {
    const sine = polynomial('sin', x),
      nextSine = polynomial('sin', x, 21)
    const cosine = polynomial('cos', x),
      nextCosine = polynomial('cos', x, 22)
    const [a, b] = rational(x)
    const sineRemainder = [a ** 21n, factorial(21) * b ** 21n] as const
    const cosineRemainder = [a ** 22n, factorial(22) * b ** 22n] as const
    expect(compare(sine, nextSine) < 0n).toBe(true)
    expect(compare(nextCosine, cosine) < 0n).toBe(true)
    expect(
      compare(
        [nextSine[0] * sine[1] - sine[0] * nextSine[1], nextSine[1] * sine[1]],
        sineRemainder
      )
    ).toBe(0n)
    expect(
      compare(
        [
          cosine[0] * nextCosine[1] - nextCosine[0] * cosine[1],
          cosine[1] * nextCosine[1]
        ],
        cosineRemainder
      )
    ).toBe(0n)
  }
})

it('rejects invalid numeric domains and validates exactly one detached interval snapshot', () => {
  for (const x of [NaN, Infinity, -Infinity, -1, 1])
    expect(() => evaluatePolynomialTrig('sin', x)).toThrow()
  expect(() => evaluatePolynomialTrig('other' as Kind, 0)).toThrow()
  for (const input of [
    { low: 0, high: NaN },
    { low: 1, high: 0 },
    { low: -1, high: 0 },
    { low: 0, high: 1 }
  ])
    expect(() => boundPolynomialTrig('cos', input)).toThrow()
  let reads = 0
  const raw = {
    get low() {
      reads++
      return reads === 1 ? NaN : 0
    },
    high: 0.5
  }
  expect(() => boundPolynomialTrig('sin', raw)).toThrow()
  expect(reads).toBe(1)
  const valid = { low: -0.2, high: 0.3 },
    result = boundPolynomialTrig('sin', valid)
  valid.low = 0.9
  expect(result.bounds.low < 0).toBe(true)
  expect(Object.isFrozen(valid)).toBe(false)
})

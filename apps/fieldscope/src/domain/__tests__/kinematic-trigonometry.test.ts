import { expect, it } from 'vitest'
import {
  evaluatePolynomialTrig,
  boundPolynomialTrig
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
  const [a, b] = rational(x),
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

it('profiles four fixed scalar batches with bounded temporary growth and no result cache', () => {
  const profileStart = performance.now()
  const report = []
  for (const inputClass of ['normal', 'subnormal'] as const)
    for (const pass of ['first', 'repeated'] as const) {
      const start = performance.now()
      let evaluations = 0,
        terms = 0,
        maxBigIntBits = 0
      for (let pose = 0; pose < 100; pose++) {
        if (
          performance.now() - start > 1000 ||
          performance.now() - profileStart > 10000
        )
          throw new Error('Polynomial profile budget exceeded')
        const values =
          inputClass === 'normal'
            ? [-0.7, -0.31, 0.19, 0.4].map((x) => x + pose / 2000)
            : [1, 3, -1, -5].map(
                (x) => x * (1 + 2 * (pose % 17)) * Number.MIN_VALUE
              )
        for (const value of values)
          for (const kind of ['sin', 'cos'] as const) {
            const result = evaluatePolynomialTrig(kind, value)
            evaluations += result.work.evaluations
            terms += result.work.terms
            maxBigIntBits = Math.max(maxBigIntBits, result.work.maxBigIntBits)
          }
      }
      const milliseconds = performance.now() - start
      expect(evaluations).toBe(800)
      expect(terms).toBe(8400)
      expect(maxBigIntBits).toBeLessThanOrEqual(24000)
      expect(milliseconds).toBeLessThanOrEqual(1000)
      report.push({
        inputClass,
        pass,
        milliseconds,
        evaluations,
        terms,
        maxBigIntBits
      })
    }
  expect(performance.now() - profileStart).toBeLessThanOrEqual(10000)
  console.log('fixed polynomial scalar profile', JSON.stringify(report))
})

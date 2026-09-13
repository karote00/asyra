import { bigIntBitLength } from './bigint-bit-length'
import { dyadic, roundFraction, type Interval } from './scalar-arithmetic'

type Kind = 'sin' | 'cos'
const factor = 2432902008176640000n // 20!, a fixed polynomial coefficient scale.
const coefficients = Object.freeze({
  sin: coefficientsFor(1, 19),
  cos: coefficientsFor(0, 20)
})
function coefficientsFor(first: number, last: number) {
  let factorial = 1n
  const values: bigint[] = []
  for (let power = 0; power <= last; power++) {
    if (power > 0) factorial *= BigInt(power)
    if (power >= first && power % 2 === first)
      values.push((values.length % 2 ? -1n : 1n) * (factor / factorial))
  }
  return Object.freeze(values)
}
interface Work {
  evaluations: number
  terms: number
  maxBigIntBits: number
}
const newWork = (): Work => ({ evaluations: 0, terms: 0, maxBigIntBits: 0 })
function observe(work: Work, bits: number) {
  if (bits > 24000) throw new Error('Polynomial bit budget exceeded')
  work.maxBigIntBits = Math.max(work.maxBigIntBits, bits)
}
function width(value: bigint, work: Work) {
  const bits = bigIntBitLength(value)
  observe(work, bits)
  return bits
}
function product(a: bigint, b: bigint, work: Work) {
  if (a !== 0n && b !== 0n && width(a, work) + width(b, work) > 24000)
    throw new Error('Polynomial bit budget exceeded')
  const result = a * b
  width(result, work)
  return result
}
function sum(a: bigint, b: bigint, work: Work) {
  const bound = Math.max(width(a, work), width(b, work))
  if (bound + (a > 0n === b > 0n ? 1 : 0) > 24000)
    throw new Error('Polynomial bit budget exceeded')
  const result = a + b
  width(result, work)
  return result
}
function validate(kind: Kind, value: number) {
  if (
    (kind !== 'sin' && kind !== 'cos') ||
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    Math.abs(value) >= 1
  )
    throw new Error('Invalid polynomial trig input')
}
function polynomial(kind: Kind, value: number, work: Work) {
  work.evaluations++
  if (value === 0)
    return { numerator: kind === 'sin' ? 0n : 1n, denominator: 1n }
  const { significand, exponent } = dyadic(value)
  // All admitted nonzero inputs have negative binary exponents; |x| < 1.
  if (exponent >= 0 || -exponent + 1 > 24000)
    throw new Error('Polynomial exponent budget exceeded')
  const a = significand,
    b = 1n << BigInt(-exponent)
  width(a, work)
  width(b, work)
  const a2 = product(a, a, work),
    b2 = product(b, b, work)
  const values = coefficients[kind]
  work.terms += values.length
  let numerator = values[values.length - 1],
    denominator = 1n
  width(numerator, work)
  for (let index = values.length - 2; index >= 0; index--) {
    const nextDenominator = product(denominator, b2, work)
    numerator = sum(
      product(numerator, a2, work),
      product(values[index], nextDenominator, work),
      work
    )
    denominator = nextDenominator
  }
  if (kind === 'sin') {
    numerator = product(numerator, a, work)
    denominator = product(denominator, b, work)
  }
  return { numerator, denominator: product(denominator, factor, work) }
}
function convert(
  value: ReturnType<typeof polynomial>,
  mode: 'nearest-even' | 'down' | 'up',
  work: Work
) {
  return roundFraction(value.numerator, value.denominator, mode, (bits) =>
    observe(work, bits)
  )
}
export function evaluatePolynomialTrig(kind: Kind, input: number) {
  validate(kind, input)
  const work = newWork()
  const exact = polynomial(kind, input, work)
  const rounded = convert(exact, 'nearest-even', work)
  const value = kind === 'sin' && input === 0 ? input : rounded
  return Object.freeze({ value, work: Object.freeze(work) })
}
export function boundPolynomialTrig(kind: Kind, input: Interval) {
  const admitted = structuredClone(input)
  if (!admitted || typeof admitted !== 'object')
    throw new Error('Invalid polynomial interval')
  validate(kind, admitted.low)
  validate(kind, admitted.high)
  if (admitted.low > admitted.high)
    throw new Error('Invalid polynomial interval')
  const work = newWork()
  let minimum = admitted.low,
    maximum = admitted.high
  if (kind === 'cos') {
    minimum =
      Math.abs(admitted.low) >= Math.abs(admitted.high)
        ? admitted.low
        : admitted.high
    if (admitted.low <= 0 && admitted.high >= 0) maximum = 0
    else
      maximum =
        Math.abs(admitted.low) <= Math.abs(admitted.high)
          ? admitted.low
          : admitted.high
  }
  const lower = polynomial(kind, minimum, work)
  const upper = Object.is(minimum, maximum)
    ? lower
    : polynomial(kind, maximum, work)
  const bounds = Object.freeze({
    low: convert(lower, 'down', work),
    high: convert(upper, 'up', work)
  })
  return Object.freeze({ bounds, work: Object.freeze(work) })
}

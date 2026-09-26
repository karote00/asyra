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
  return horner(kind, a, b, work)
}
function horner(kind: Kind, a: bigint, b: bigint, work: Work) {
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

export interface PolynomialFraction {
  readonly numerator: bigint
  readonly denominator: bigint
}
interface ExactWork extends Work {
  admissionChecks: number
  gcdSteps: number
  normalizations: number
  rationalComparisons: number
}
const newExactWork = (): ExactWork => ({
  ...newWork(),
  admissionChecks: 0,
  gcdSteps: 0,
  normalizations: 0,
  rationalComparisons: 0
})
function gcdExact(a: bigint, b: bigint, work: ExactWork) {
  if (a < 0n) a = -a
  width(a, work)
  width(b, work)
  while (b !== 0n) {
    work.gcdSteps++
    const remainder = a % b
    width(remainder, work)
    a = b
    b = remainder
  }
  return a
}
function fractionInput(value: unknown, work: ExactWork): PolynomialFraction {
  work.admissionChecks++
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid exact polynomial fraction')
  const snapshot = { ...value } as Record<string, unknown>
  if (
    Object.keys(snapshot).length !== 2 ||
    !Object.hasOwn(snapshot, 'numerator') ||
    !Object.hasOwn(snapshot, 'denominator') ||
    typeof snapshot.numerator !== 'bigint' ||
    typeof snapshot.denominator !== 'bigint'
  )
    throw new Error('Invalid exact polynomial fraction')
  const { numerator, denominator } = snapshot
  // Bound each input before gcd, products or domain cross multiplication.
  width(numerator, work)
  width(denominator, work)
  if (
    denominator <= 0n ||
    numerator <= -denominator ||
    numerator >= denominator ||
    (numerator === 0n && denominator !== 1n)
  )
    throw new Error('Invalid exact polynomial domain')
  if (gcdExact(numerator, denominator, work) !== 1n)
    throw new Error('Noncanonical exact polynomial fraction')
  return Object.freeze({ numerator, denominator })
}
function reduced(
  value: PolynomialFraction,
  work: ExactWork
): PolynomialFraction {
  work.normalizations++
  const divisor = gcdExact(value.numerator, value.denominator, work)
  const numerator = value.numerator / divisor,
    denominator = value.denominator / divisor
  width(numerator, work)
  width(denominator, work)
  return Object.freeze({ numerator, denominator })
}
function rationalCompare(
  a: PolynomialFraction,
  b: PolynomialFraction,
  work: ExactWork
) {
  work.rationalComparisons++
  const difference = sum(
    product(a.numerator, b.denominator, work),
    -product(b.numerator, a.denominator, work),
    work
  )
  return difference < 0n ? -1 : Number(difference > 0n)
}
function exactPolynomial(
  kind: Kind,
  input: PolynomialFraction,
  work: ExactWork
) {
  work.evaluations++
  if (input.numerator === 0n)
    return reduced(
      { numerator: kind === 'sin' ? 0n : 1n, denominator: 1n },
      work
    )
  return reduced(horner(kind, input.numerator, input.denominator, work), work)
}
function checkKind(kind: Kind) {
  if (kind !== 'sin' && kind !== 'cos')
    throw new Error('Invalid polynomial trig kind')
}
export function evaluateExactPolynomialTrig(kind: Kind, input: unknown) {
  checkKind(kind)
  const work = newExactWork(),
    admitted = fractionInput(input, work)
  const value = exactPolynomial(kind, admitted, work)
  const rounded = convert(value, 'nearest-even', work)
  const sign = value.numerator < 0n ? -1 : Number(value.numerator > 0n)
  return Object.freeze({
    input: admitted,
    value,
    sign,
    rounded,
    work: Object.freeze(work)
  })
}
function createSignCertificate() {
  const work = newWork()
  const positive = (values: readonly bigint[]) => {
    const pairs = []
    for (let index = 0; index + 1 < values.length; index += 2) {
      work.terms++
      const constant = values[index],
        linear = values[index + 1],
        lowerAtOne = sum(constant, linear, work)
      if (constant <= 0n || linear >= 0n || lowerAtOne <= 0n)
        throw new Error('Unproved fixed polynomial sign')
      // z=x*x in [0,1): z^index >= 0, constant+linear*z >= lowerAtOne > 0.
      pairs.push(Object.freeze({ power: index, constant, linear, lowerAtOne }))
    }
    const last = values.length - 1
    const tail =
      values.length % 2
        ? Object.freeze({ power: last, coefficient: values[last] })
        : null
    if (tail && tail.coefficient <= 0n)
      throw new Error('Unproved fixed polynomial tail')
    return Object.freeze({
      coefficients: values,
      pairs: Object.freeze(pairs),
      tail
    })
  }
  const derivative = Object.freeze(
    coefficients.sin.map((c, i) => product(c, BigInt(2 * i + 1), work))
  )
  if (
    !derivative.every((v, i) => v === coefficients.cos[i]) ||
    !coefficients.cos
      .slice(1)
      .every(
        (v, i) => product(v, BigInt(2 * i + 2), work) === -coefficients.sin[i]
      )
  )
    throw new Error('Unproved fixed polynomial derivative')
  const positivePolynomials = Object.freeze({
    sineOverInput: positive(coefficients.sin),
    cosine: positive(coefficients.cos),
    sineDerivative: positive(derivative)
  })
  return Object.freeze({
    format: 'polynomial-trig-sign/1' as const,
    factor,
    domain: Object.freeze({ low: -1, high: 1, open: true }),
    positivePolynomials,
    sineSign: 'input-sign' as const,
    cosineSign: 'positive' as const,
    sineZeros: Object.freeze([0]),
    cosineZeros: Object.freeze([] as number[]),
    work: Object.freeze(work)
  })
}
/** Algebraic sign on the real domain; it is not the sign of a rounded display. */
export const POLYNOMIAL_TRIG_SIGN_CERTIFICATE = createSignCertificate()
export function boundExactPolynomialTrig(kind: Kind, input: unknown) {
  checkKind(kind)
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Invalid exact polynomial interval')
  const snapshot = { ...input } as Record<string, unknown>
  if (
    Object.keys(snapshot).length !== 2 ||
    !Object.hasOwn(snapshot, 'low') ||
    !Object.hasOwn(snapshot, 'high')
  )
    throw new Error('Invalid exact polynomial interval')
  const work = newExactWork(),
    low = fractionInput(snapshot.low, work),
    high = fractionInput(snapshot.high, work)
  if (rationalCompare(low, high, work) > 0)
    throw new Error('Invalid exact polynomial interval')
  const zero = Object.freeze({ numerator: 0n, denominator: 1n })
  const crossesZero = low.numerator <= 0n && high.numerator >= 0n
  let minimumAt = low,
    maximumAt = high
  if (kind === 'cos') {
    const abs = (v: PolynomialFraction) => ({
      numerator: v.numerator < 0n ? -v.numerator : v.numerator,
      denominator: v.denominator
    })
    const order = rationalCompare(abs(low), abs(high), work)
    minimumAt = order >= 0 ? low : high
    maximumAt = order <= 0 ? low : high
    if (crossesZero) maximumAt = zero
  }
  const minimum = exactPolynomial(kind, minimumAt, work)
  const maximum =
    rationalCompare(minimumAt, maximumAt, work) === 0
      ? minimum
      : exactPolynomial(kind, maximumAt, work)
  const outward = Object.freeze({
    low: convert(minimum, 'down', work),
    high: convert(maximum, 'up', work)
  })
  return Object.freeze({
    input: Object.freeze({ low, high }),
    bounds: Object.freeze({ low: minimum, high: maximum }),
    outward,
    extrema: Object.freeze({ minimumAt, maximumAt }),
    zeros: Object.freeze(kind === 'sin' && crossesZero ? [zero] : []),
    certificate: POLYNOMIAL_TRIG_SIGN_CERTIFICATE,
    work: Object.freeze(work)
  })
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

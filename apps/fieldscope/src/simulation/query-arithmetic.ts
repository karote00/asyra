/** Conservative IEEE-754 query arithmetic; bounds never imply material or clearance. */
export interface Interval {
  readonly low: number
  readonly high: number
}
export interface Dyadic {
  readonly significand: bigint
  readonly exponent: number
}
const uncertain: Interval = Object.freeze({ low: -Infinity, high: Infinity })
const words = new DataView(new ArrayBuffer(8))

function next(value: number, upward: boolean): number {
  if (value === 0) return upward ? Number.MIN_VALUE : -Number.MIN_VALUE
  if (!Number.isFinite(value)) return value
  words.setFloat64(0, value)
  let high = words.getUint32(0),
    low = words.getUint32(4)
  if (value > 0 === upward) {
    if (low === 0xffffffff) {
      high++
      low = 0
    } else low++
  } else if (low === 0) {
    high--
    low = 0xffffffff
  } else low--
  words.setUint32(0, high)
  words.setUint32(4, low)
  return words.getFloat64(0)
}
export function interval(value: number): Interval {
  return Number.isFinite(value) ? { low: value, high: value } : uncertain
}
const finite = (value: Interval) =>
  Number.isFinite(value.low) && Number.isFinite(value.high)
const single = (value: Interval) => value.low === value.high
function rounded(value: number, exact: boolean): Interval {
  if (!Number.isFinite(value)) return uncertain
  if (exact) return interval(value)
  return { low: next(value, false), high: next(value, true) }
}
function sum(a: number, b: number): Interval {
  const value = a + b
  // TwoSum residual is a generic exactness certificate for a finite addition.
  const bv = value - a
  const error = a - (value - bv) + (b - bv)
  return rounded(value, error === 0)
}
function powerOfTwo(value: number) {
  const absolute = Math.abs(value)
  return absolute > 0 && 2 ** Math.round(Math.log2(absolute)) === absolute
}
function exactProduct(a: number, b: number, value: number) {
  if (!Number.isFinite(value)) return false
  if (a === 0 || b === 0 || Math.abs(a) === 1 || Math.abs(b) === 1) return true
  if (
    Number.isSafeInteger(a) &&
    Number.isSafeInteger(b) &&
    Number.isSafeInteger(value)
  )
    return true
  // Binary exponent shifts preserve the significand unless bits underflow.
  if ((powerOfTwo(a) || powerOfTwo(b)) && Math.abs(value) >= 2 ** -1022)
    return true
  return value !== 0 && powerOfTwo(a) && powerOfTwo(b)
}
function product(a: number, b: number): Interval {
  const value = a * b
  return rounded(value, exactProduct(a, b, value))
}
function quotient(a: number, b: number): Interval {
  if (b === 0) return uncertain
  const value = a / b
  return rounded(value, value * b === a && exactProduct(value, b, a))
}
export function add(a: Interval, b: Interval): Interval {
  if (!finite(a) || !finite(b)) return uncertain
  if (single(a) && single(b)) return sum(a.low, b.low)
  return { low: sum(a.low, b.low).low, high: sum(a.high, b.high).high }
}
export function subtract(a: Interval, b: Interval): Interval {
  if (!finite(a) || !finite(b)) return uncertain
  return add(a, { low: -b.high, high: -b.low })
}
export function multiply(a: Interval, b: Interval): Interval {
  if (!finite(a) || !finite(b)) return uncertain
  if (single(a) && single(b)) return product(a.low, b.low)
  const values = [
    product(a.low, b.low),
    product(a.low, b.high),
    product(a.high, b.low),
    product(a.high, b.high)
  ]
  return {
    low: Math.min(...values.map((value) => value.low)),
    high: Math.max(...values.map((value) => value.high))
  }
}
export function divide(a: Interval, b: Interval): Interval {
  if (!finite(a) || !finite(b) || (b.low <= 0 && b.high >= 0)) return uncertain
  if (single(a) && single(b)) return quotient(a.low, b.low)
  const values = [
    quotient(a.low, b.low),
    quotient(a.low, b.high),
    quotient(a.high, b.low),
    quotient(a.high, b.high)
  ]
  return {
    low: Math.min(...values.map((value) => value.low)),
    high: Math.max(...values.map((value) => value.high))
  }
}
export function squareRoot(a: Interval): Interval {
  if (!finite(a) || a.low < 0) return uncertain
  const root = (value: number) => {
    const result = Math.sqrt(value)
    return rounded(
      result,
      result * result === value && exactProduct(result, result, value)
    )
  }
  if (single(a)) return root(a.low)
  return { low: root(a.low).low, high: root(a.high).high }
}

/** Exact finite Number decomposition; callers never replace uncertain intervals. */
export function dyadic(value: number): Dyadic {
  if (!Number.isFinite(value))
    throw new Error('Nonfinite exact arithmetic input')
  words.setFloat64(0, value)
  const bits = words.getBigUint64(0),
    exponent = Number((bits >> 52n) & 2047n)
  const fraction = bits & ((1n << 52n) - 1n)
  return {
    significand:
      (bits >> 63n ? -1n : 1n) * (exponent ? (1n << 52n) + fraction : fraction),
    exponent: exponent ? exponent - 1023 - 52 : -1074
  }
}
function compareFraction(
  value: number,
  numerator: bigint,
  denominator: bigint
): bigint {
  const { significand, exponent } = dyadic(value)
  return exponent >= 0
    ? (significand << BigInt(exponent)) * denominator - numerator
    : significand * denominator - (numerator << BigInt(-exponent))
}
/** A bounded seed search followed by exact certification, not an error estimate. */
export function fractionInterval(
  numerator: bigint,
  denominator: bigint
): Interval {
  if (!denominator) return uncertain
  if (denominator < 0n) {
    numerator = -numerator
    denominator = -denominator
  }
  if (!numerator) return interval(0)
  const magnitude = numerator < 0n ? -numerator : numerator
  const ns = Math.max(0, magnitude.toString(2).length - 53)
  const ds = Math.max(0, denominator.toString(2).length - 53)
  const seed =
    (((numerator < 0n ? -1 : 1) * Number(magnitude >> BigInt(ns))) /
      Number(denominator >> BigInt(ds))) *
    2 ** (ns - ds)
  if (!Number.isFinite(seed)) return uncertain
  let low = seed,
    high = seed
  for (let step = 0; step <= 8; step++) {
    if (!Number.isFinite(low) || !Number.isFinite(high)) return uncertain
    const below = compareFraction(low, numerator, denominator) <= 0n
    const above = compareFraction(high, numerator, denominator) >= 0n
    if (below && above) return { low, high }
    if (!below) low = next(low, false)
    if (!above) high = next(high, true)
  }
  return uncertain
}

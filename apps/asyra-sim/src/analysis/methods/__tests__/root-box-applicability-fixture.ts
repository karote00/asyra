import type { AlgebraPose } from '../../../domain/kinematic-algebra'
import type { Interval } from '../../../domain/interval'
import type { Bounds } from '../mesh-index'

interface Dyadic {
  n: bigint
  e: number
}
type Enclosure = readonly [Dyadic, Dyadic]
type Vector = readonly [Enclosure, Enclosure, Enclosure]
export type ProbeCharge = (kind: string) => void
/** Exact binary64 dyadics. Display approximations never participate in predicates. */
export class ExactBoxProbe {
  private readonly bits = new DataView(new ArrayBuffer(8))
  constructor(private readonly tick: ProbeCharge = () => undefined) {}
  private normalize(n: bigint, e: number): Dyadic {
    if (n === 0n) return { n: 0n, e: 0 }
    while ((n & 1n) === 0n) {
      n >>= 1n
      e++
    }
    return { n, e }
  }
  from(value: number): Dyadic {
    this.tick('exact-convert')
    if (!Number.isFinite(value)) throw new Error('Nonfinite exact input')
    this.bits.setFloat64(0, value)
    const bits = this.bits.getBigUint64(0),
      exponent = Number((bits >> 52n) & 2047n),
      fraction = bits & ((1n << 52n) - 1n)
    const sign = bits >> 63n ? -1n : 1n
    return this.normalize(
      sign * (exponent ? (1n << 52n) + fraction : fraction),
      exponent ? exponent - 1075 : -1074
    )
  }
  private add(a: Dyadic, b: Dyadic): Dyadic {
    this.tick('exact-add')
    const e = Math.min(a.e, b.e)
    return this.normalize(
      (a.n << BigInt(a.e - e)) + (b.n << BigInt(b.e - e)),
      e
    )
  }
  private negative(a: Dyadic): Dyadic {
    this.tick('exact-negate')
    return { n: -a.n, e: a.e }
  }
  private multiply(a: Dyadic, b: Dyadic): Dyadic {
    this.tick('exact-multiply')
    return this.normalize(a.n * b.n, a.e + b.e)
  }
  compare(a: Dyadic, b: Dyadic): number {
    this.tick('exact-compare')
    const e = Math.min(a.e, b.e),
      left = a.n << BigInt(a.e - e),
      right = b.n << BigInt(b.e - e)
    if (left < right) return -1
    return left > right ? 1 : 0
  }
  private min(values: readonly Dyadic[]) {
    return values.reduce((a, b) => (this.compare(a, b) <= 0 ? a : b))
  }
  private max(values: readonly Dyadic[]) {
    return values.reduce((a, b) => (this.compare(a, b) >= 0 ? a : b))
  }
  private interval(value: Interval): Enclosure {
    const result = [this.from(value[0]), this.from(value[1])] as const
    if (this.compare(result[0], result[1]) > 0)
      throw new Error('Reversed exact enclosure')
    return result
  }
  private plus(a: Enclosure, b: Enclosure): Enclosure {
    return [this.add(a[0], b[0]), this.add(a[1], b[1])]
  }
  private minus(a: Enclosure, b: Enclosure): Enclosure {
    return [
      this.add(a[0], this.negative(b[1])),
      this.add(a[1], this.negative(b[0]))
    ]
  }
  private times(a: Enclosure, b: Enclosure): Enclosure {
    const products = [
      this.multiply(a[0], b[0]),
      this.multiply(a[0], b[1]),
      this.multiply(a[1], b[0]),
      this.multiply(a[1], b[1])
    ]
    return [this.min(products), this.max(products)]
  }
  private cross(a: Vector, b: Vector): Vector {
    return [
      this.minus(this.times(a[1], b[2]), this.times(a[2], b[1])),
      this.minus(this.times(a[2], b[0]), this.times(a[0], b[2])),
      this.minus(this.times(a[0], b[1]), this.times(a[1], b[0]))
    ]
  }
  private corners(bounds: Bounds, pose: AlgebraPose<Interval>): Vector[] {
    const ranges = bounds.map((b) => this.interval(b)),
      p = pose.position.map((x) => this.interval(x)),
      q = pose.rotation.map((x) => this.interval(x))
    const u: Vector = [q[0], q[1], q[2]],
      two = this.interval([2, 2]),
      result: Vector[] = []
    for (let bits = 0; bits < 8; bits++) {
      this.tick('corner-allocation')
      const point = ranges.map((r, axis) => {
        const v = r[(bits >> axis) & 1]
        return [v, v] as Enclosure
      }) as unknown as Vector
      const cross = this.cross(u, point),
        t = cross.map((c) => this.times(two, c)) as unknown as Vector,
        tail = this.cross(u, t)
      // Same authoritative unit-quaternion polynomial, independently evaluated
      // with exact dyadic intervals rather than production interval arithmetic.
      result.push(
        point.map((v, axis) =>
          this.plus(
            p[axis],
            this.plus(v, this.plus(this.times(q[3], t[axis]), tail[axis]))
          )
        ) as unknown as Vector
      )
    }
    return result
  }
  pointGaps(
    a: Bounds,
    ap: AlgebraPose<Interval>,
    b: Bounds,
    bp: AlgebraPose<Interval>,
    threshold: number
  ) {
    const ac = this.corners(a, ap),
      bc = this.corners(b, bp),
      zero = this.from(0),
      limit = this.from(threshold)
    const projection = (corners: Vector[], axis: number) => ({
      min: [
        this.min(corners.map((c) => c[axis][0])),
        this.min(corners.map((c) => c[axis][1]))
      ] as Enclosure,
      max: [
        this.max(corners.map((c) => c[axis][0])),
        this.max(corners.map((c) => c[axis][1]))
      ] as Enclosure
    })
    return [0, 1, 2].map((axis) => {
      const pa = projection(ac, axis),
        pb = projection(bc, axis),
        forward = this.minus(pb.min, pa.max),
        reverse = this.minus(pa.min, pb.max)
      const lower = this.max([zero, forward[0], reverse[0]]),
        upper = this.max([zero, forward[1], reverse[1]])
      this.tick('axis-receipt')
      return { axis, lower, upper, ruledOut: this.compare(upper, limit) <= 0 }
    })
  }
}
export const exactJson = (_key: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value
export function approximate(value: Dyadic): number {
  if (value.n === 0n) return 0
  const magnitude = value.n < 0n ? -value.n : value.n,
    shift = Math.max(0, magnitude.toString(2).length - 53)
  return Number(value.n >> BigInt(shift)) * 2 ** (value.e + shift)
}
export function axesRuledOut(
  points: readonly { gaps: readonly { axis: number; ruledOut: boolean }[] }[]
) {
  return [0, 1, 2].map((axis) =>
    points.some((p) => p.gaps.some((g) => g.axis === axis && g.ruledOut))
  )
}

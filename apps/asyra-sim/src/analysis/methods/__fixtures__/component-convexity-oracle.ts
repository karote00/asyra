import type { MeshGeometry } from '../../../domain/part-geometry'
import type { Vec3 } from '../../../domain/math'

export interface RidgeWitness {
  face: number
  neighbor: number
  opposite: number
  sign: -1 | 0 | 1
  coefficient: string
  exponent: number
  points: readonly [Vec3, Vec3, Vec3, Vec3]
}
export interface LocalConvexityResult {
  state: 'reflex' | 'undecided'
  positive: number
  negative: number
  coplanar: number
  witnesses: readonly RidgeWitness[]
  work: number
}

// Test-owned exact binary64 arithmetic, independently written from the sign
// determinant definition. No floating point geometric predicate is trusted.
function dyadic(value: number): { integer: bigint; exponent: number } {
  if (!Number.isFinite(value)) throw new Error('Nonfinite original coordinate')
  if (value === 0) return { integer: 0n, exponent: 0 }
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value)
  const bits = view.getBigUint64(0)
  const encoded = Number((bits >> 52n) & 2047n)
  let integer = bits & ((1n << 52n) - 1n)
  if (encoded) integer += 1n << 52n
  if (bits >> 63n) integer = -integer
  return { integer, exponent: encoded ? encoded - 1075 : -1074 }
}
export function exactOrientation(
  points: readonly [Vec3, Vec3, Vec3, Vec3]
): Pick<RidgeWitness, 'sign' | 'coefficient' | 'exponent'> {
  const values = points.flat().map(dyadic)
  const exponent = Math.min(
    0,
    ...values.filter((v) => v.integer !== 0n).map((v) => v.exponent)
  )
  const integers = values.map((v) => v.integer << BigInt(v.exponent - exponent))
  const [u, v, w] = [1, 2, 3].map((point) =>
    [0, 1, 2].map((axis) => integers[3 * point + axis] - integers[axis])
  )
  const determinant =
    u[0] * (v[1] * w[2] - v[2] * w[1]) -
    u[1] * (v[0] * w[2] - v[2] * w[0]) +
    u[2] * (v[0] * w[1] - v[1] * w[0])
  let sign: -1 | 0 | 1 = 0
  if (determinant > 0n) sign = 1
  if (determinant < 0n) sign = -1
  return { sign, coefficient: determinant.toString(), exponent: 3 * exponent }
}

/** Necessary condition only. No successful convexity capability can be issued here. */
export function inspectLocalConvexity(
  geometry: MeshGeometry,
  offsets: readonly number[],
  checkpoint: () => void
): LocalConvexityResult {
  let work = 0
  const tick = () => {
    checkpoint()
    work++
  }
  const owned: { offset: number; ids: number[]; vertices: Vec3[] }[] = []
  const points = new Map<string, number>(),
    seen = new Set<number>()
  let occurrences = 0
  for (let i = 0; i < offsets.length; i++) {
    if (i % 256 === 0) tick()
    const offset = offsets[i]
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      offset % 3 ||
      offset + 2 >= geometry.indices.length ||
      seen.has(offset)
    )
      throw new Error('Invalid original component partition')
    seen.add(offset)
    const ids: number[] = [],
      vertices: Vec3[] = []
    for (let corner = 0; corner < 3; corner++) {
      if (occurrences++ % 256 === 0) tick()
      const index = geometry.indices[offset + corner]
      if (
        !Number.isSafeInteger(index) ||
        index < 0 ||
        index * 3 + 2 >= geometry.positions.length
      )
        throw new Error('Invalid original vertex')
      const point = Object.freeze(
        geometry.positions.slice(index * 3, index * 3 + 3)
      ) as Vec3
      if (!point.every(Number.isFinite))
        throw new Error('Nonfinite original coordinate')
      const key = point.join(',')
      let id = points.get(key)
      if (id === undefined) {
        id = points.size
        points.set(key, id)
      }
      ids.push(id)
      vertices.push(point)
    }
    owned.push({ offset, ids, vertices })
  }
  interface Edge {
    from: number
    to: number
    face: (typeof owned)[number]
  }
  const edges = new Map<string, Edge>(),
    closed = new Set<string>()
  let positive = 0,
    negative = 0,
    coplanar = 0
  const witnesses: RidgeWitness[] = []
  for (const face of owned)
    for (let edge = 0; edge < 3; edge++) {
      const from = face.ids[edge],
        to = face.ids[(edge + 1) % 3]
      if (from === to) throw new Error('Degenerate original edge')
      const key = from < to ? `${from}:${to}` : `${to}:${from}`
      if (closed.has(key)) throw new Error('Non-manifold original component')
      const previous = edges.get(key)
      if (!previous) {
        tick()
        edges.set(key, { from, to, face })
        continue
      }
      if (previous.from !== to || previous.to !== from)
        throw new Error('Inconsistent original component orientation')
      tick()
      const opposite = geometry.indices[face.offset + ((edge + 2) % 3)]
      const points = Object.freeze([
        previous.face.vertices[0],
        previous.face.vertices[1],
        previous.face.vertices[2],
        face.vertices[(edge + 2) % 3]
      ]) as readonly [Vec3, Vec3, Vec3, Vec3]
      const orientation = exactOrientation(points)
      if (orientation.sign > 0) positive++
      else if (orientation.sign < 0) negative++
      else coplanar++
      if (
        orientation.sign !== 0 &&
        !witnesses.some((w) => w.sign === orientation.sign)
      )
        witnesses.push(
          Object.freeze({
            face: previous.face.offset,
            neighbor: face.offset,
            opposite,
            points,
            ...orientation
          })
        )
      edges.delete(key)
      closed.add(key)
    }
  if (edges.size) throw new Error('Open original component')
  tick()
  return Object.freeze({
    state: positive && negative ? 'reflex' : 'undecided',
    positive,
    negative,
    coplanar,
    witnesses: Object.freeze(witnesses),
    work
  })
}

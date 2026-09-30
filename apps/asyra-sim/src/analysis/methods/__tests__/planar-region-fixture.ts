import type { MeshGeometry } from '../../../domain/part-geometry'
import type { Vec3 } from '../../../domain/math'

export type PreparationCharge = (kind: string) => void

/** Exact binary64 coplanarity; no floating determinant zero is accepted. */
export function coplanar(
  points: readonly [Vec3, Vec3, Vec3, Vec3],
  tick: PreparationCharge
): boolean {
  for (let axis = 0; axis < 3; axis++) {
    let same = true
    for (let p = 1; p < 4; p++) {
      tick('coordinate-compare')
      if (points[p][axis] !== points[0][axis]) {
        same = false
        break
      }
    }
    if (same) return true
  }
  tick('exact-buffer')
  const view = new DataView(new ArrayBuffer(8))
  const values: { n: bigint; e: number }[] = []
  let exponent = 0
  for (const point of points)
    for (const value of point) {
      tick('exact-decode')
      if (!Number.isFinite(value)) throw new Error('Nonfinite coordinate')
      view.setFloat64(0, value)
      const bits = view.getBigUint64(0),
        encoded = Number((bits >> 52n) & 2047n)
      let n = bits & ((1n << 52n) - 1n)
      if (encoded) n += 1n << 52n
      if (bits >> 63n) n = -n
      const e = encoded ? encoded - 1075 : -1074
      tick('exact-exponent')
      if (n !== 0n) exponent = Math.min(exponent, e)
      values.push({ n, e })
    }
  const integers = values.map(({ n, e }) => {
    tick('exact-align')
    return n === 0n ? 0n : n << BigInt(e - exponent)
  })
  const delta = [1, 2, 3].map((p) =>
    [0, 1, 2].map((axis) => {
      tick('exact-subtract')
      return integers[3 * p + axis] - integers[axis]
    })
  )
  const mul = (a: bigint, b: bigint) => {
    tick('exact-multiply')
    return a * b
  }
  const sub = (a: bigint, b: bigint) => {
    tick('exact-subtract')
    return a - b
  }
  const [u, v, w] = delta
  const first = mul(u[0], sub(mul(v[1], w[2]), mul(v[2], w[1]))),
    second = mul(u[1], sub(mul(v[0], w[2]), mul(v[2], w[0]))),
    third = mul(u[2], sub(mul(v[0], w[1]), mul(v[1], w[0])))
  const partial = sub(first, second)
  tick('exact-add')
  const determinant = partial + third
  tick('exact-zero')
  return determinant === 0n
}

/**
 * Optimistic plane regions only, on topology-admitted nondegenerate triangles.
 * Connectivity is not a convex-union or absence-of-self-intersection proof.
 * Every invocation owns fresh scratch; no partial product is returned on throw.
 */
export function planarRegions(mesh: MeshGeometry, tick: PreparationCharge) {
  tick('workspace-allocation')
  const points: Vec3[] = [],
    canonical: number[] = [],
    vertexIds = new Map<string, number>(),
    adjacency: number[][] = []
  if (mesh.positions.length % 3 || mesh.indices.length % 3)
    throw new Error('Incomplete original coordinates or triangles')
  for (let i = 0; i < mesh.positions.length; i += 3) {
    tick('point-read')
    const point = mesh.positions.slice(i, i + 3) as unknown as Vec3
    for (const v of point) {
      tick('coordinate-validation')
      if (!Number.isFinite(v)) throw new Error('Nonfinite coordinate')
    }
    tick('vertex-key')
    const key = point.join(',')
    tick('vertex-lookup')
    let id = vertexIds.get(key)
    if (id === undefined) {
      id = vertexIds.size
      tick('vertex-insert')
      vertexIds.set(key, id)
    }
    tick('point-record')
    points.push(point)
    canonical.push(id)
  }
  interface Edge {
    from: number
    to: number
    face: number
    vertices: readonly [Vec3, Vec3, Vec3]
    closed: boolean
  }
  const edges = new Map<string, Edge>()
  let sharedEdges = 0,
    coplanarEdges = 0
  for (let offset = 0; offset < mesh.indices.length; offset += 3) {
    tick('face-allocation')
    const ids: number[] = [],
      vertices: Vec3[] = []
    const face = offset / 3
    adjacency.push([])
    for (let corner = 0; corner < 3; corner++) {
      tick('index-read')
      const index = mesh.indices[offset + corner]
      if (!Number.isSafeInteger(index) || index < 0 || index >= points.length)
        throw new Error('Invalid original index')
      ids.push(canonical[index])
      vertices.push(points[index])
    }
    for (let e = 0; e < 3; e++) {
      tick('edge-key')
      const from = ids[e],
        to = ids[(e + 1) % 3]
      if (from === to) throw new Error('Degenerate edge')
      const key = from < to ? `${from}:${to}` : `${to}:${from}`
      tick('edge-lookup')
      const previous = edges.get(key)
      if (!previous) {
        tick('edge-insert')
        edges.set(key, {
          from,
          to,
          face,
          vertices: vertices as unknown as Edge['vertices'],
          closed: false
        })
        continue
      }
      if (previous.closed) throw new Error('Non-manifold edge')
      if (previous.from !== to || previous.to !== from)
        throw new Error('Inconsistent orientation')
      tick('edge-close')
      previous.closed = true
      sharedEdges++
      const equal = coplanar(
        [...previous.vertices, vertices[(e + 2) % 3]],
        tick
      )
      if (equal) {
        tick('adjacency-insert')
        adjacency[face].push(previous.face)
        tick('adjacency-insert')
        adjacency[previous.face].push(face)
        coplanarEdges++
      }
    }
  }
  // Boundary surfaces are useful small oracles; production input admission
  // independently requires the full closed, oriented, manifold source.
  const regions: number[][] = [],
    seen = new Set<number>()
  for (let face = 0; face < adjacency.length; face++) {
    tick('face-lookup')
    if (seen.has(face)) continue
    tick('region-allocation')
    const region: number[] = [],
      pending = [face]
    tick('face-mark')
    seen.add(face)
    while (pending.length) {
      tick('face-visit')
      const current = pending.pop()
      if (current === undefined) throw new Error('Missing pending face')
      region.push(current * 3)
      for (const neighbor of adjacency[current]) {
        tick('neighbor-lookup')
        if (seen.has(neighbor)) continue
        tick('face-mark')
        seen.add(neighbor)
        tick('pending-insert')
        pending.push(neighbor)
      }
    }
    regions.push(region)
  }
  tick('region-publication')
  return {
    triangles: adjacency.length,
    sharedEdges,
    coplanarEdges,
    regions,
    optimisticFourfold: regions.length * 4 <= adjacency.length
  }
}

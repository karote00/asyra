import {
  iadd,
  idiv,
  imid,
  ineg,
  interval,
  type Interval
} from '../../../domain/interval'
import {
  intervalAlgebra,
  poseOperations,
  type AlgebraPose,
  type Vector
} from '../../../domain/kinematic-algebra'
import { add, dot, scale, subtract, type Vec3 } from '../../../domain/math'
import type { Bounds, MeshIndex, MeshNode } from '../mesh-index'
import { worldPoint } from '../mesh-index'

export type SupportCharge =
  | 'prepare-node'
  | 'prepare-triangle'
  | 'publish-component'
  | 'publish-owner'
  | 'lookup'
  | 'attempt'
  | 'direction'
  | 'node'
  | 'vertex'
  | 'point'
  | 'simplex'
  | 'certificate'
  | 'publish'
export type ChargeSupport = (kind: SupportCharge) => void
const ops = poseOperations(intervalAlgebra)
type Pose = AlgebraPose<Interval>
interface SourceNode {
  readonly bounds: Bounds
  readonly points: readonly Vec3[]
  readonly offsets: readonly number[]
  readonly children: readonly SourceNode[]
}
export interface SupportComponent {
  readonly id: number
  readonly root: SourceNode
}
const copyPoint = (point: Vec3): Vec3 =>
  Object.freeze([...point]) as unknown as Vec3
const copyBounds = (bounds: Bounds): Bounds =>
  Object.freeze(bounds.map((v) => Object.freeze([...v]))) as unknown as Bounds

/** Test-owned immutable source snapshot. No pose, result or public mutable map. */
export class SourceHullPreparation {
  readonly components: readonly SupportComponent[]
  readonly charges: readonly SupportCharge[]
  #owners = new WeakMap<Bounds, SupportComponent>()
  constructor(index: MeshIndex, charge: ChargeSupport) {
    const charges: SupportCharge[] = [],
      owners = new Map<Bounds, number>(),
      roots = new Map<number, SourceNode>()
    const total = new Map<number, number>(),
      rootCounts = new Map<number, number>(),
      offsets = new Set<number>()
    const pay = (kind: SupportCharge) => {
      charge(kind)
      charges.push(kind)
    }
    const visit = (
      node: MeshNode
    ): { node: SourceNode; component: number | undefined; count: number } => {
      pay('prepare-node')
      const children = (node.children ?? []).map(visit),
        points: Vec3[] = []
      const components = new Set<number | undefined>(
        children.map((child) => child.component)
      )
      for (const triangle of node.triangles) {
        pay('prepare-triangle')
        if (offsets.has(triangle.offset))
          throw new Error('Duplicate source triangle')
        offsets.add(triangle.offset)
        total.set(triangle.component, (total.get(triangle.component) ?? 0) + 1)
        components.add(triangle.component)
        owners.set(triangle.bounds, triangle.component)
        points.push(...triangle.vertices.map(copyPoint))
      }
      const component = components.size === 1 ? [...components][0] : undefined
      const count =
        node.triangles.length +
        children.reduce((sum, child) => sum + child.count, 0)
      const snapshot = Object.freeze({
        bounds: copyBounds(node.bounds),
        points: Object.freeze(points),
        offsets: Object.freeze(
          node.triangles.map((triangle) => triangle.offset)
        ),
        children: Object.freeze(children.map((child) => child.node))
      })
      if (component !== undefined) {
        owners.set(node.bounds, component)
        roots.set(component, snapshot)
        rootCounts.set(component, count)
      }
      return { node: snapshot, component, count }
    }
    visit(index.root)
    if (roots.size !== index.componentCount)
      throw new Error('Incomplete component hierarchy')
    for (const [component, count] of total)
      if (rootCounts.get(component) !== count)
        throw new Error('Incomplete component source root')
    const components = [...roots].map(([id, root]) => {
      pay('publish-component')
      return Object.freeze({ id, root })
    })
    const byId = new Map(
      components.map((component) => [component.id, component])
    )
    for (const [bounds, id] of owners) {
      pay('publish-owner')
      const component = byId.get(id)
      if (!component) throw new Error('Missing complete component owner')
      this.#owners.set(bounds, component)
    }
    this.components = Object.freeze(components)
    this.charges = Object.freeze(charges)
    Object.freeze(this)
  }
  owner(bounds: Bounds, charge: ChargeSupport): SupportComponent | undefined {
    charge('lookup')
    return this.#owners.get(bounds)
  }
}

/** Publish only after the complete snapshot succeeds; every fresh invocation recharges. */
export class SourceHullLifetime {
  #cache = new WeakMap<MeshIndex, SourceHullPreparation>()
  invocation(charge: ChargeSupport) {
    const consumed = new WeakMap<MeshIndex, SourceHullPreparation>()
    return (index: MeshIndex) => {
      const previous = consumed.get(index)
      if (previous) return previous
      let prepared = this.#cache.get(index)
      if (prepared) for (const kind of prepared.charges) charge(kind)
      else {
        prepared = new SourceHullPreparation(index, charge)
        this.#cache.set(index, prepared)
      }
      consumed.set(index, prepared)
      return prepared
    }
  }
}

export function sourceSupport(
  component: SupportComponent,
  pose: Pose,
  direction: Vec3,
  charge: ChargeSupport
): { value: Interval; point: Vector<Interval> } {
  charge('direction')
  const q = pose.rotation,
    d = ops.vector(direction)
  const local = ops.rotate([ineg(q[0]), ineg(q[1]), ineg(q[2]), q[3]], d)
  const translation = ops.dot(pose.position, d)
  let lo = -Infinity,
    hi = -Infinity,
    score = -Infinity,
    selected: Vec3 | undefined
  const pending = [component.root]
  while (pending.length) {
    const node = pending.pop()
    if (!node) throw new Error('Missing pending source node')
    charge('node')
    // Every descendant point is in this complete source box. Interval dependence
    // can loosen the upper bound, never justify omitting a possibly maximal point.
    const upper = ops.dot(node.bounds, local)[1]
    if (upper <= lo) continue
    for (const point of node.points) {
      charge('vertex')
      const value = ops.dot(ops.vector(point), local)
      lo = Math.max(lo, value[0])
      hi = Math.max(hi, value[1])
      if (imid(value) > score) {
        score = imid(value)
        selected = point
      }
    }
    pending.push(...node.children)
  }
  if (!selected) throw new Error('Empty complete source support')
  charge('point')
  return {
    value: iadd(translation, interval(lo, hi)),
    point: worldPoint(pose, selected)
  }
}

// Approximate candidate search, using the same affine-subset construction as the
// project's convex query. None of these floating-point branches is a certificate.
function solve(matrix: number[][], rhs: number[]): number[] | undefined {
  const rows = matrix.map((row, i) => [...row, rhs[i]]),
    n = rhs.length
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let row = col + 1; row < n; row++)
      if (Math.abs(rows[row][col]) > Math.abs(rows[pivot][col])) pivot = row
    if (rows[pivot][col] === 0) return undefined
    ;[rows[col], rows[pivot]] = [rows[pivot], rows[col]]
    const denominator = rows[col][col]
    for (let k = col; k <= n; k++) rows[col][k] /= denominator
    for (let row = 0; row < n; row++)
      if (row !== col) {
        const multiplier = rows[row][col]
        for (let k = col; k <= n; k++) rows[row][k] -= multiplier * rows[col][k]
      }
  }
  const values = rows.map((row) => row[n])
  return values.every(Number.isFinite) ? values : undefined
}
function closest(points: Vec3[]): { points: Vec3[]; point: Vec3 } {
  let best = { points: [points[0]], point: points[0] },
    squared = dot(points[0], points[0])
  for (let mask = 1; mask < 1 << points.length; mask++) {
    const subset = points.filter((_, i) => mask & (1 << i))
    if (subset.length > 4) continue
    const anchor = subset[0],
      edges = subset.slice(1).map((p) => subtract(p, anchor))
    const weights = edges.length
      ? solve(
          edges.map((a) => edges.map((b) => dot(a, b))),
          edges.map((edge) => -dot(edge, anchor))
        )
      : []
    if (!weights) continue
    const barycentric = [1 - weights.reduce((sum, v) => sum + v, 0), ...weights]
    if (barycentric.some((v) => v < 0 || v > 1)) continue
    const point = subset.reduce<Vec3>(
        (sum, p, i) => add(sum, scale(p, barycentric[i])),
        [0, 0, 0]
      ),
      distance = dot(point, point)
    if (distance < squared) {
      best = { points: subset, point }
      squared = distance
    }
  }
  return best
}

/** No upper, contact, penetration or convergence evidence can leave this helper. */
export function sourceHullSeparation(
  a: SupportComponent,
  ap: Pose,
  b: SupportComponent,
  bp: Pose,
  threshold: number,
  charge: ChargeSupport
): number {
  charge('attempt')
  let axis = subtract(
    bp.position.map(imid) as unknown as Vec3,
    ap.position.map(imid) as unknown as Vec3
  )
  if (axis.every((v) => v === 0)) axis = [1, 0, 0]
  let points: Vec3[] = []
  for (let iteration = 0; iteration < 64; iteration++) {
    // Rescaling a direction does not change its separating plane; avoids numeric
    // norm overflow/underflow without rounding the source or changing tolerance.
    const width = Math.max(...axis.map(Math.abs))
    if (!(width > 0) || !Number.isFinite(width)) return 0
    axis = axis.map((value) => value / width) as unknown as Vec3
    const sa = sourceSupport(a, ap, axis, charge),
      sb = sourceSupport(b, bp, scale(axis, -1), charge)
    charge('certificate')
    const norm = ops.norm(ops.vector(axis))
    if (norm[0] <= 0) return 0
    const lower = Math.max(0, idiv(ineg(iadd(sa.value, sb.value)), norm)[0])
    if (lower > threshold) {
      charge('publish')
      return lower
    }
    const next = ops.sub(sa.point, sb.point).map(imid) as unknown as Vec3
    if (points.some((p) => p.every((v, i) => v === next[i]))) return 0
    charge('simplex')
    const simplex = closest([...points, next])
    points = simplex.points
    axis = scale(simplex.point, -1)
  }
  return 0
}

export interface ChargedSourceEvent {
  id: number
  query: number
  componentPair: string
  kind: 'node' | 'axis' | 'triangle' | 'membership' | 'preparation' | 'upper'
}
export class SourceEventCredits {
  #events = new Map<number, ChargedSourceEvent>()
  #credited = new Set<number>()
  record(event: ChargedSourceEvent): void {
    if (this.#events.has(event.id))
      throw new Error('Duplicate charged event identity')
    this.#events.set(event.id, Object.freeze({ ...event }))
  }
  credit(
    id: number,
    certificate: { query: number; componentPair: string; after: number }
  ): void {
    const event = this.#events.get(id)
    if (
      !event ||
      event.id <= certificate.after ||
      event.query !== certificate.query ||
      event.componentPair !== certificate.componentPair ||
      !['node', 'axis', 'triangle'].includes(event.kind)
    )
      return
    this.#credited.add(id)
  }
  get events(): readonly ChargedSourceEvent[] {
    return [...this.#events.values()]
  }
  get credited(): readonly number[] {
    return [...this.#credited]
  }
}

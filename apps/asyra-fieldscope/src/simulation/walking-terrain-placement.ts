import {
  WalkingConstrainedKinematicsOwner,
  type ConstrainedFraction,
  type ConstrainedVector,
  type WalkingConstrainedProjection
} from '../domain/walking-constrained-kinematics'
import {
  readWalkingTerrainPlacementRequest,
  TerrainPlacementBudgetError,
  type WalkingTerrainPlacementRequest
} from '../domain/walking-terrain-placement-contract'
import type { WalkingRobotSource } from '../domain/walking-robot-source'
import type {
  WalkingTerrainRegion,
  WalkingContactAssessment
} from '../domain/walking-motion-contract'
import { dyadic, type Dyadic } from '../domain/scalar-arithmetic'
import { prepareQueryExactForwardFrame } from './ray-query'
import type { SceneDemand } from './scene-demand'

type F = ConstrainedFraction
type V = ConstrainedVector<F>
type Triangle = readonly [V, V, V]
type Status = 'admitted' | 'blocked' | 'unknown'
interface Work {
  inputValues: number
  shapes: number
  regions: number
  terrainVertices: number
  footVertices: number
  trianglePairs: number
  predicates: number
  unvisited: number | null
  maxBits: number
  projectionPreparations: number
}
interface OriginalTriangle {
  source: WalkingTerrainRegion
  sourceRegionId: string
  sourceKind: 'sheet' | 'open-shell' | 'closed-solid'
  offset: number
  vertices: Triangle
}
export interface WalkingTerrainSupportPlacement {
  readonly chainId: string
  readonly sourceGeometry: Readonly<{
    status: Status
    reasons: readonly string[]
    certificate: Readonly<{
      kind: 'complete-source-union'
      plane: readonly F[]
      footTriangleOffsets: readonly number[]
      contributors: readonly Readonly<{
        sourceId: string
        sourceRegionId: string
        triangleOffset: number
      }>[]
    }> | null
  }>
  readonly anchor: V
  readonly part: WalkingConstrainedProjection['supports'][number]['part']
  readonly patch: WalkingConstrainedProjection['supports'][number]['patch']
  readonly assessment: WalkingContactAssessment | null
  readonly assessmentApplicability: 'unbound'
  readonly physicalStatus: 'unknown'
}
export interface WalkingTerrainPlacement {
  readonly format: 'walking-terrain-placement/1'
  readonly identity: Readonly<object>
  readonly source: WalkingRobotSource
  readonly demand: SceneDemand
  readonly request: WalkingTerrainPlacementRequest | null
  readonly projection: WalkingConstrainedProjection | null
  readonly supports: readonly WalkingTerrainSupportPlacement[]
  readonly sourceGeometry: Readonly<{
    status: Status
    reasons: readonly string[]
  }>
  readonly physicalStatus: 'unknown'
  readonly assessmentApplicability: 'unbound'
  readonly reasons: readonly string[]
  readonly work: Readonly<Work>
}
function freeze<T>(v: T): T {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.values(v).forEach(freeze)
    Object.freeze(v)
  }
  return v
}
function gcd(a: bigint, b: bigint): bigint {
  if (b) return gcd(b, a % b)
  return a < 0n ? -a : a
}
function arithmetic(
  work: Work,
  budget: WalkingTerrainPlacementRequest['budget']
) {
  const tick = () => {
    if (work.predicates >= budget.maxPredicates)
      throw new TerrainPlacementBudgetError('terrain-predicate-budget')
    work.predicates++
  }
  const f = (n: bigint, d = 1n): F => {
    tick()
    if (!d) throw new Error('Unproved terrain denominator')
    if (d < 0n) {
      n = -n
      d = -d
    }
    const bits = Math.max(
      (n < 0n ? -n : n).toString(2).length,
      d.toString(2).length
    )
    work.maxBits = Math.max(work.maxBits, bits)
    if (bits > budget.maxBits)
      throw new TerrainPlacementBudgetError('terrain-bit-budget')
    const g = gcd(n, d)
    return { numerator: n / g, denominator: d / g }
  }
  const add = (a: F, b: F) =>
    f(
      a.numerator * b.denominator + b.numerator * a.denominator,
      a.denominator * b.denominator
    )
  const neg = (a: F) => f(-a.numerator, a.denominator)
  const sub = (a: F, b: F) => add(a, neg(b))
  const mul = (a: F, b: F) =>
    f(a.numerator * b.numerator, a.denominator * b.denominator)
  const div = (a: F, b: F) =>
    f(a.numerator * b.denominator, a.denominator * b.numerator)
  const cmp = (a: F, b: F) => {
    tick()
    const d = a.numerator * b.denominator - b.numerator * a.denominator
    return d < 0n ? -1 : Number(d > 0n)
  }
  const lift = (v: Dyadic): F =>
    v.exponent >= 0
      ? f(v.significand << BigInt(v.exponent))
      : f(v.significand, 1n << BigInt(-v.exponent))
  const exact = (v: number) => lift(dyadic(v))
  const zero = f(0n)
  const va = (a: V, b: V): V => [
    add(a[0], b[0]),
    add(a[1], b[1]),
    add(a[2], b[2])
  ]
  const vs = (a: V, b: V): V => [
    sub(a[0], b[0]),
    sub(a[1], b[1]),
    sub(a[2], b[2])
  ]
  const scale = (a: V, s: F): V => [mul(a[0], s), mul(a[1], s), mul(a[2], s)]
  const dot = (a: V, b: V) => a.reduce((s, v, i) => add(s, mul(v, b[i])), zero)
  const cross = (a: V, b: V): V => [
    sub(mul(a[1], b[2]), mul(a[2], b[1])),
    sub(mul(a[2], b[0]), mul(a[0], b[2])),
    sub(mul(a[0], b[1]), mul(a[1], b[0]))
  ]
  const pair = () => {
    if (work.trianglePairs >= budget.maxTrianglePairs)
      throw new TerrainPlacementBudgetError('terrain-pair-budget')
    work.trianglePairs++
  }
  return {
    f,
    add,
    sub,
    mul,
    div,
    cmp,
    lift,
    exact,
    zero,
    va,
    vs,
    scale,
    dot,
    cross,
    pair
  }
}
type Arithmetic = ReturnType<typeof arithmetic>
function plane(t: Triangle, a: Arithmetic) {
  const n = a.cross(a.vs(t[1], t[0]), a.vs(t[2], t[0]))
  return { n, d: a.dot(n, t[0]) }
}
function nonzero(v: V) {
  return v.some((x) => x.numerator !== 0n)
}
function axis(n: V, a: Arithmetic) {
  let selected = 0
  for (let i = 1; i < 3; i++)
    if (a.cmp(a.mul(n[i], n[i]), a.mul(n[selected], n[selected])) > 0)
      selected = i
  return selected
}
function clip(poly: readonly V[], distance: (v: V) => F, a: Arithmetic): V[] {
  const result: V[] = []
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i],
      q = poly[(i + 1) % poly.length],
      dp = distance(p),
      dq = distance(q),
      sp = a.cmp(dp, a.zero),
      sq = a.cmp(dq, a.zero)
    if (sp >= 0) result.push(p)
    if ((sp < 0 && sq > 0) || (sp > 0 && sq < 0))
      result.push(a.va(p, a.scale(a.vs(q, p), a.div(dp, a.sub(dp, dq)))))
  }
  return result
}
function projectedCross(p: V, q: V, r: V, drop: number, a: Arithmetic) {
  const axes = [0, 1, 2].filter((i) => i !== drop),
    u = axes[0],
    v = axes[1]
  return a.sub(
    a.mul(a.sub(q[u], p[u]), a.sub(r[v], p[v])),
    a.mul(a.sub(q[v], p[v]), a.sub(r[u], p[u]))
  )
}
function clipTriangle(
  poly: readonly V[],
  t: Triangle,
  drop: number,
  a: Arithmetic
) {
  const sign = a.cmp(projectedCross(t[0], t[1], t[2], drop, a), a.zero)
  let result = [...poly]
  for (let i = 0; i < 3; i++)
    result = clip(
      result,
      (v) =>
        a.mul(
          a.f(BigInt(sign)),
          projectedCross(t[i], t[(i + 1) % 3], v, drop, a)
        ),
      a
    )
  return result
}
function area(poly: readonly V[], drop: number, a: Arithmetic) {
  let sum = a.zero
  for (let i = 1; i + 1 < poly.length; i++)
    sum = a.add(sum, projectedCross(poly[0], poly[i], poly[i + 1], drop, a))
  return sum.numerator < 0n ? a.f(-sum.numerator, sum.denominator) : sum
}
function equal(p: V, q: V, a: Arithmetic) {
  return p.every((v, i) => a.cmp(v, q[i]) === 0)
}
function tJunction(p: Triangle, q: Triangle, a: Arithmetic) {
  return p.some((v) =>
    q.some((x, i) => {
      const y = q[(i + 1) % 3]
      return (
        !equal(v, x, a) &&
        !equal(v, y, a) &&
        !nonzero(a.cross(a.vs(v, x), a.vs(y, x))) &&
        a.cmp(a.dot(a.vs(v, x), a.vs(v, y)), a.zero) < 0
      )
    })
  )
}
function triangleIntersection(
  p: Triangle,
  q: Triangle,
  a: Arithmetic
): boolean {
  const pl = plane(q, a)
  if (!nonzero(pl.n)) throw new Error('terrain-degenerate-triangle')
  const d = p.map((v) => a.sub(a.dot(pl.n, v), pl.d)),
    sign = d.map((v) => a.cmp(v, a.zero))
  if (sign.every((v) => v > 0) || sign.every((v) => v < 0)) return false
  const drop = axis(pl.n, a)
  if (sign.every((v) => v === 0)) return clipTriangle(p, q, drop, a).length > 0
  const line: V[] = []
  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3
    if (sign[i] === 0) line.push(p[i])
    if (sign[i] * sign[j] < 0)
      line.push(
        a.va(p[i], a.scale(a.vs(p[j], p[i]), a.div(d[i], a.sub(d[i], d[j]))))
      )
  }
  return line.length > 0 && clipTriangle(line, q, drop, a).length > 0
}
function boxIntersection(
  t: Triangle,
  min: readonly number[],
  max: readonly number[],
  a: Arithmetic
) {
  let p: readonly V[] = t
  for (let k = 0; k < 3; k++) {
    p = clip(p, (v) => a.sub(v[k], a.exact(min[k])), a)
    p = clip(p, (v) => a.sub(a.exact(max[k]), v[k]), a)
  }
  return p.length > 0
}
function status(values: readonly Status[]): Status {
  if (values.includes('blocked')) return 'blocked'
  return values.every((v) => v === 'admitted') && values.length > 0
    ? 'admitted'
    : 'unknown'
}
export class WalkingTerrainPlacementOwner {
  private product: WalkingTerrainPlacement | null = null
  private projectionOwner = new WalkingConstrainedKinematicsOwner()
  private preparations = 0
  get current() {
    return this.product
  }
  get work() {
    return Object.freeze({ preparations: this.preparations })
  }
  read(
    source: WalkingRobotSource,
    demand: SceneDemand,
    request: WalkingTerrainPlacementRequest
  ) {
    return this.product?.source === source &&
      this.product.demand === demand &&
      this.product.request === request
      ? this.product
      : null
  }
  dispose() {
    this.product = null
    this.projectionOwner.dispose()
  }
  prepare(
    source: WalkingRobotSource,
    demand: SceneDemand,
    input: unknown
  ): WalkingTerrainPlacement {
    if (
      this.product?.request &&
      input === this.product.request &&
      source === this.product.source &&
      demand === this.product.demand
    )
      return this.product
    this.dispose()
    this.preparations++
    const work: Work = {
      inputValues: 0,
      shapes: 0,
      regions: 0,
      terrainVertices: 0,
      footVertices: 0,
      trianglePairs: 0,
      predicates: 0,
      unvisited: null,
      maxBits: 0,
      projectionPreparations: 0
    }
    let request: WalkingTerrainPlacementRequest
    try {
      request = readWalkingTerrainPlacementRequest(input, { source, demand })
    } catch (error) {
      if (!(error instanceof TerrainPlacementBudgetError)) throw error
      this.product = freeze({
        format: 'walking-terrain-placement/1',
        identity: {},
        source,
        demand,
        request: null,
        projection: null,
        supports: [],
        sourceGeometry: { status: 'unknown', reasons: [error.message] },
        physicalStatus: 'unknown',
        assessmentApplicability: 'unbound',
        reasons: [error.message, 'assessment-context-unbound'],
        work
      })
      return this.product
    }
    work.inputValues = request.inputValues
    const a = arithmetic(work, request.budget),
      reasons: string[] = [],
      placements: WalkingTerrainSupportPlacement[] = []
    let projection: WalkingConstrainedProjection | null = null
    let expectedPairs = 0
    try {
      const terrain = request.terrain,
        route = demand.route
      const terrainCount = terrain.regions.reduce(
        (n, r) => n + r.shape.indices.length / 3,
        0
      )
      const soilCount = terrain.regions
        .filter((r) => r.classification === 'soil')
        .reduce((n, r) => n + r.shape.indices.length / 3, 0)
      expectedPairs =
        (soilCount * (soilCount - 1)) / 2 +
        request.seeds.reduce((n, s) => {
          const count = s.footPatch.ranges.reduce(
            (sum, r) => sum + r.indexCount / 3,
            0
          )
          return n + (count * (count - 1)) / 2 + count * terrainCount
        }, 0)
      if (!Number.isSafeInteger(expectedPairs))
        throw new TerrainPlacementBudgetError('terrain-pair-inventory-budget')
      const triangles: OriginalTriangle[] = [],
        bySource = new Map<string, OriginalTriangle[]>(),
        vertices = new Map<string, readonly V[]>()
      let complete = true,
        insideRoute = !!demand.route
      for (const region of terrain.regions) {
        const partition = request.partitions.find(
          (p) => p.sourceId === region.sourceId
        )?.regions
        if (!partition) {
          complete = false
          continue
        }
        const frame = prepareQueryExactForwardFrame(region.frame),
          matrix = frame.matrix.map((row) => row.map(a.lift)),
          translation = frame.position.map(a.lift) as unknown as V
        work.shapes++
        work.regions += partition.length
        const points: V[] = []
        for (let i = 0; i < region.shape.positions.length; i += 3) {
          const local = region.shape.positions
            .slice(i, i + 3)
            .map(a.exact) as unknown as V
          const p = matrix.map((row, k) =>
            a.add(
              translation[k],
              row.reduce((sum, v, j) => a.add(sum, a.mul(v, local[j])), a.zero)
            )
          ) as unknown as V
          points.push(p)
          work.terrainVertices++
          if (
            region.classification === 'soil' &&
            route &&
            p.some(
              (v, k) =>
                a.cmp(v, a.exact(route.volume.min[k])) < 0 ||
                a.cmp(v, a.exact(route.volume.max[k])) > 0
            )
          )
            insideRoute = false
        }
        vertices.set(region.sourceId, points)
        const entries: OriginalTriangle[] = []
        for (const part of partition)
          for (
            let offset = part.indexStart;
            offset < part.indexStart + part.indexCount;
            offset += 3
          ) {
            const t = region.shape.indices
              .slice(offset, offset + 3)
              .map((i) => points[i]) as unknown as Triangle
            entries.push({
              source: region,
              sourceRegionId: part.id,
              sourceKind: part.kind,
              offset,
              vertices: t
            })
          }
        triangles.push(...entries)
        bySource.set(region.sourceId, entries)
      }
      const seeds = request.seeds.map((seed) => {
        const region = terrain.regions.find(
            (r) => r.id === seed.terrainRegionId
          ),
          v = region && vertices.get(region.sourceId)
        if (!region || !v)
          throw new Error('terrain-source-partition-incomplete')
        const original = bySource
          .get(region.sourceId)
          ?.find(
            (t) =>
              t.offset === seed.triangleOffset &&
              t.sourceRegionId === seed.sourceRegionId
          )
        if (!original) throw new Error('terrain-seed-source-unavailable')
        const anchor = original.vertices.reduce(
          (sum, p, i) => a.va(sum, a.scale(p, seed.barycentric[i])),
          [a.zero, a.zero, a.zero] as V
        )
        return {
          chainId: seed.chainId,
          part: seed.footPart,
          patch: seed.footPatch,
          anchorOrigin: anchor
        }
      })
      work.projectionPreparations++
      projection = this.projectionOwner.prepare(source, {
        format: 'walking-constrained-kinematic-projection/1',
        source,
        supports: seeds,
        baseOrientation: request.baseOrientation,
        fixedJoints: request.fixedJoints,
        interval: request.interval,
        budget: {
          maxOperations: request.budget.maxProjectionOperations,
          maxBits: request.budget.maxBits
        }
      })
      const feet = projection.supports.map((support) => {
        const byIndex = new Map(
            support.fixedVertices.map((v) => [v.index, v.position])
          ),
          t: Triangle[] = [],
          offsets: number[] = []
        work.footVertices += byIndex.size
        for (const range of support.patch.ranges)
          for (
            let offset = range.indexStart;
            offset < range.indexStart + range.indexCount;
            offset += 3
          ) {
            const p = support.part.shape.indices
              .slice(offset, offset + 3)
              .map((i) => byIndex.get(i))
            if (p.some((v) => !v))
              throw new Error('foot-original-vertex-missing')
            t.push(p as unknown as Triangle)
            offsets.push(offset)
          }
        return { support, triangles: t, offsets }
      })
      const soil = triangles.filter((t) => t.source.classification === 'soil')
      let soilValid = true
      for (const t of soil)
        if (!nonzero(plane(t.vertices, a).n)) soilValid = false
      for (let i = 0; i < soil.length; i++)
        for (let j = 0; j < i; j++) {
          a.pair()
          const p = soil[i].vertices,
            q = soil[j].vertices,
            pl = plane(p, a)
          if (!nonzero(pl.n)) {
            soilValid = false
            continue
          }
          if (q.every((v) => a.cmp(a.dot(pl.n, v), pl.d) === 0)) {
            if (
              area(clipTriangle(p, q, axis(pl.n, a), a), axis(pl.n, a), a)
                .numerator !== 0n ||
              tJunction(p, q, a) ||
              tJunction(q, p, a)
            )
              soilValid = false
          } else if (triangleIntersection(p, q, a)) soilValid = false
        }
      for (const foot of feet) {
        const localReasons: string[] = [],
          contributors = new Map<
            string,
            { sourceId: string; sourceRegionId: string; triangleOffset: number }
          >(),
          pl = plane(foot.triangles[0], a)
        let valid = complete && insideRoute && soilValid && nonzero(pl.n),
          blocked = false
        if (!complete) localReasons.push('terrain-source-partition-incomplete')
        if (!insideRoute) localReasons.push('terrain-outside-current-route')
        if (!soilValid) localReasons.push('terrain-soil-union-unproved')
        const drop = axis(pl.n, a)
        for (const t of foot.triangles)
          if (
            !nonzero(plane(t, a).n) ||
            !t.every((v) => a.cmp(a.dot(pl.n, v), pl.d) === 0)
          )
            valid = false
        for (let i = 0; i < foot.triangles.length; i++)
          for (let j = 0; j < i; j++) {
            a.pair()
            if (
              area(
                clipTriangle(foot.triangles[i], foot.triangles[j], drop, a),
                drop,
                a
              ).numerator !== 0n ||
              tJunction(foot.triangles[i], foot.triangles[j], a) ||
              tJunction(foot.triangles[j], foot.triangles[i], a)
            )
              valid = false
          }
        for (const t of foot.triangles) {
          for (const channel of demand.channels)
            if (boxIntersection(t, channel.bounds.min, channel.bounds.max, a)) {
              blocked = true
              localReasons.push('support-on-authored-channel')
            }
          let covered = a.zero
          for (const terrainTriangle of triangles) {
            a.pair()
            const other = terrainTriangle.vertices,
              region = terrainTriangle.source
            if (region.classification === 'soil') {
              if (!other.every((v) => a.cmp(a.dot(pl.n, v), pl.d) === 0)) {
                valid = false
                continue
              }
              if (!nonzero(plane(other, a).n)) {
                valid = false
                continue
              }
              const intersection = area(
                clipTriangle(t, other, drop, a),
                drop,
                a
              )
              covered = a.add(covered, intersection)
              if (intersection.numerator !== 0n)
                contributors.set(
                  region.sourceId + ':' + terrainTriangle.offset,
                  {
                    sourceId: region.sourceId,
                    sourceRegionId: terrainTriangle.sourceRegionId,
                    triangleOffset: terrainTriangle.offset
                  }
                )
            } else {
              if (terrainTriangle.sourceKind === 'closed-solid') {
                valid = false
                localReasons.push('terrain-solid-interior-unproved')
              }
              if (triangleIntersection(t, other, a)) {
                blocked = true
                localReasons.push(
                  region.classification === 'channel'
                    ? 'support-on-channel-source'
                    : 'support-on-debris-source'
                )
              }
              if (
                region.keepOut.kind === 'bounded' &&
                boxIntersection(t, region.keepOut.min, region.keepOut.max, a)
              ) {
                blocked = true
                localReasons.push('support-in-debris-keep-out')
              }
            }
          }
          if (a.cmp(covered, area(t, drop, a)) !== 0) {
            valid = false
            localReasons.push('terrain-soil-coverage-incomplete')
          }
        }
        const seed = request.seeds.find(
          (s) => s.chainId === foot.support.chainId
        )
        if (!seed) throw new Error('terrain-seed-missing')
        const assessment =
          terrain.contactAssessments.find(
            (v) => v.id === seed.contactAssessmentId
          ) ?? null
        if (
          Object.values(terrain.observations).some(
            (v) => !('coverage' in v) || v.coverage !== 'complete'
          )
        ) {
          valid = false
          localReasons.push('terrain-observation-incomplete')
        }
        if (!valid && localReasons.length === 0)
          localReasons.push('terrain-source-proof-unavailable')
        let localStatus: Status = valid ? 'admitted' : 'unknown'
        if (blocked) localStatus = 'blocked'
        placements.push({
          chainId: foot.support.chainId,
          anchor: foot.support.anchorOrigin,
          part: foot.support.part,
          patch: foot.support.patch,
          assessment,
          assessmentApplicability: 'unbound',
          physicalStatus: 'unknown',
          sourceGeometry: {
            status: localStatus,
            reasons: [...new Set(localReasons)],
            certificate:
              valid && !blocked
                ? {
                    kind: 'complete-source-union',
                    plane: [...pl.n, pl.d],
                    footTriangleOffsets: foot.offsets,
                    contributors: [...contributors.values()]
                  }
                : null
          }
        })
      }
    } catch (error) {
      reasons.push(
        error instanceof Error
          ? error.message
          : 'terrain-source-proof-unavailable'
      )
    }
    work.unvisited = Math.max(0, expectedPairs - work.trianglePairs)
    let geometryStatus = status(placements.map((p) => p.sourceGeometry.status))
    if (placements.length !== 3 && geometryStatus === 'admitted')
      geometryStatus = 'unknown'
    if (work.unvisited > 0) reasons.push('terrain-pairs-unvisited')
    reasons.push(...placements.flatMap((p) => p.sourceGeometry.reasons))
    this.product = freeze({
      format: 'walking-terrain-placement/1',
      identity: {},
      source,
      demand,
      request,
      projection,
      supports: placements,
      sourceGeometry: {
        status: geometryStatus,
        reasons: [...new Set(reasons)]
      },
      physicalStatus: 'unknown',
      assessmentApplicability: 'unbound',
      reasons: ['assessment-context-unbound', ...new Set(reasons)],
      work
    })
    return this.product
  }
}

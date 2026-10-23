import {
  WalkingRobotSourceOwner,
  type WalkingRobotSource,
  type WalkingRobotPart
} from './walking-robot-source'
import {
  WalkingMountedCrateOwner,
  type WalkingMountedCrate
} from './walking-mounted-crate'
import {
  readActiveWalkingRobotDefinition,
  MAX_WALKING_BODY_WIDTH,
  type WalkingRigidTransform
} from './walking-robot-definition'
import type { WalkingRobotPose } from './walking-robot-kinematics'
import { readSourceRegions, type SourceRegion } from './source-occupancy'
import {
  interval,
  add,
  subtract,
  multiply,
  fractionInterval,
  type Interval,
  type Dyadic
} from './scalar-arithmetic'
import type { Point3 } from './greenhouse'

export interface WalkingEnvelopeBounds {
  readonly min: Point3
  readonly max: Point3
  readonly size: Point3
}
export interface WalkingEnvelopeLoadPart {
  readonly id: string
  readonly shape: WalkingRobotPart['shape']
  readonly regions: readonly SourceRegion[]
  readonly localFrame: WalkingRigidTransform
}
export interface WalkingStowedEnvelopeRequest {
  readonly format: 'walking-stowed-envelope-request/1'
  readonly pose: WalkingRobotPose
  readonly crate:
    | { readonly kind: 'none' }
    | { readonly kind: 'mounted'; readonly product: WalkingMountedCrate }
  readonly load:
    | { readonly kind: 'empty'; readonly id: string }
    | {
        readonly kind: 'geometry'
        readonly id: string
        readonly source: WalkingRobotSource
        readonly requiredPartIds: readonly string[]
        readonly parts: readonly WalkingEnvelopeLoadPart[]
      }
}
export interface WalkingEnvelopeContributor {
  readonly kind: 'robot' | 'crate' | 'load'
  readonly id: string
  readonly bodyId: string | null
  readonly part:
    | WalkingRobotPart
    | WalkingMountedCrate['geometry']['parts'][number]
    | WalkingEnvelopeLoadPart
  readonly bounds: WalkingEnvelopeBounds
  readonly vertices: number
}
export interface WalkingStowedEnvelope {
  readonly status: 'complete'
  readonly format: 'walking-stowed-envelope/1'
  readonly authority: 'completed-stowed-fk-then-base/1'
  readonly source: WalkingRobotSource
  readonly definition: WalkingRobotSource['definition']
  readonly profile: WalkingRobotSource['definition']['sourceModel']
  readonly request: WalkingStowedEnvelopeRequest
  readonly bodyBounds: WalkingEnvelopeBounds
  readonly bounds: WalkingEnvelopeBounds
  readonly contributors: readonly WalkingEnvelopeContributor[]
  readonly completeness: 'all-source-and-declared-load'
  readonly work: Readonly<EnvelopeWork>
}
export type WalkingEnvelopeResult =
  WalkingStowedEnvelope | Readonly<{ status: 'unavailable'; reason: string }>
interface EnvelopeWork {
  preparations: number
  fk: number
  sourceVertices: number
  attachmentVertices: number
  contributors: number
}
const zeroWork = (): EnvelopeWork => ({
  preparations: 0,
  fk: 0,
  sourceVertices: 0,
  attachmentVertices: 0,
  contributors: 0
})
const fail = (reason: string): never => {
  throw new Error(reason)
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const keys = (v: Record<string, unknown>, expected: readonly string[]) =>
  Object.keys(v).length === expected.length &&
  expected.every((k) => Object.hasOwn(v, k))
const id = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0
function freeze<T>(v: T): T {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.values(v).forEach(freeze)
    Object.freeze(v)
  }
  return v
}
function point(v: unknown): Point3 {
  if (
    !Array.isArray(v) ||
    v.length !== 3 ||
    !v.every((n) => typeof n === 'number' && Number.isFinite(n))
  )
    return fail('nonfinite-point')
  return [v[0], v[1], v[2]]
}
function frame(raw: unknown): WalkingRigidTransform {
  if (!object(raw) || !keys(raw, ['position', 'rotation']))
    return fail('invalid-frame')
  const p = point(raw.position),
    q = raw.rotation
  if (
    !Array.isArray(q) ||
    q.length !== 4 ||
    !q.every((n) => typeof n === 'number' && Number.isFinite(n)) ||
    Math.abs(Math.hypot(...q) - 1) > 1e-9
  )
    return fail('invalid-frame')
  return { position: p, rotation: [q[0], q[1], q[2], q[3]] }
}
const origin: WalkingRigidTransform = freeze({
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1]
})
function transform(
  f: WalkingRigidTransform,
  v: readonly Interval[]
): readonly Interval[] {
  const [x, y, z, w] = f.rotation.map(interval),
    two = interval(2)
  const tx = multiply(two, subtract(multiply(y, v[2]), multiply(z, v[1])))
  const ty = multiply(two, subtract(multiply(z, v[0]), multiply(x, v[2])))
  const tz = multiply(two, subtract(multiply(x, v[1]), multiply(y, v[0])))
  return [
    add(
      interval(f.position[0]),
      add(
        v[0],
        add(multiply(w, tx), subtract(multiply(y, tz), multiply(z, ty)))
      )
    ),
    add(
      interval(f.position[1]),
      add(
        v[1],
        add(multiply(w, ty), subtract(multiply(z, tx), multiply(x, tz)))
      )
    ),
    add(
      interval(f.position[2]),
      add(
        v[2],
        add(multiply(w, tz), subtract(multiply(x, ty), multiply(y, tx)))
      )
    )
  ]
}
const exactInterval = (v: Dyadic): Interval =>
  v.exponent >= 0
    ? fractionInterval(v.significand << BigInt(v.exponent), 1n)
    : fractionInterval(v.significand, 1n << BigInt(-v.exponent))
function accumulator() {
  const low = [Infinity, Infinity, Infinity],
    high = [-Infinity, -Infinity, -Infinity]
  return {
    include(v: readonly Interval[]) {
      v.forEach((p, k) => {
        if (
          !Number.isFinite(p.low) ||
          !Number.isFinite(p.high) ||
          p.low > p.high
        )
          fail('nonfinite-point')
        low[k] = Math.min(low[k], p.low)
        high[k] = Math.max(high[k], p.high)
      })
    },
    bounds(): WalkingEnvelopeBounds {
      const min = point(low),
        max = point(high)
      const size = point(
        max.map((v, k) => subtract(interval(v), interval(min[k])).high)
      )
      return freeze({ min, max, size })
    }
  }
}
function geometry(raw: unknown): WalkingEnvelopeLoadPart {
  if (
    !object(raw) ||
    !keys(raw, ['id', 'shape', 'regions', 'localFrame']) ||
    !id(raw.id) ||
    !object(raw.shape) ||
    !keys(raw.shape, ['kind', 'positions', 'indices']) ||
    raw.shape.kind !== 'triangles'
  )
    return fail('invalid-load-part')
  const { positions, indices } = raw.shape
  if (
    !Array.isArray(positions) ||
    positions.length < 9 ||
    positions.length % 3 ||
    !positions.every((v) => typeof v === 'number' && Number.isFinite(v)) ||
    !Array.isArray(indices) ||
    indices.length < 3 ||
    !indices.every(
      (v) => Number.isSafeInteger(v) && v >= 0 && v < positions.length / 3
    )
  )
    return fail('invalid-load-geometry')
  const regions = readSourceRegions(
    raw.regions as readonly SourceRegion[],
    indices.length
  )
  return {
    id: raw.id,
    shape: {
      kind: 'triangles',
      positions: [...positions],
      indices: [...indices]
    },
    regions,
    localFrame: frame(raw.localFrame)
  }
}
function readRequest(
  raw: unknown,
  source: WalkingRobotSource
): WalkingStowedEnvelopeRequest {
  if (
    !object(raw) ||
    !keys(raw, ['format', 'pose', 'crate', 'load']) ||
    raw.format !== 'walking-stowed-envelope-request/1' ||
    !object(raw.pose) ||
    !keys(raw.pose, ['base', 'joints']) ||
    raw.pose.joints !== source.rig.presets.stowed
  )
    return fail('noncanonical-stowed-pose')
  const pose = { base: frame(raw.pose.base), joints: source.rig.presets.stowed }
  const c = raw.crate
  if (!object(c)) return fail('crate-inventory-unavailable')
  let crate: WalkingStowedEnvelopeRequest['crate']
  if (c.kind === 'none' && keys(c, ['kind'])) crate = { kind: 'none' }
  else if (c.kind === 'mounted' && keys(c, ['kind', 'product']))
    crate = { kind: 'mounted', product: c.product as WalkingMountedCrate }
  else return fail('crate-inventory-unavailable')
  const l = raw.load
  if (!object(l) || !id(l.id)) return fail('load-geometry-unavailable')
  let load: WalkingStowedEnvelopeRequest['load']
  if (l.kind === 'empty' && keys(l, ['kind', 'id']))
    load = { kind: 'empty', id: l.id }
  else if (
    l.kind === 'geometry' &&
    keys(l, ['kind', 'id', 'source', 'requiredPartIds', 'parts'])
  ) {
    if (
      l.source !== source ||
      !Array.isArray(l.parts) ||
      !Array.isArray(l.requiredPartIds) ||
      !l.requiredPartIds.length ||
      !l.requiredPartIds.every(id) ||
      new Set(l.requiredPartIds).size !== l.requiredPartIds.length
    )
      return fail('load-source-inventory-mismatch')
    const parts = l.parts.map(geometry),
      expected = new Set(l.requiredPartIds)
    if (
      parts.length !== expected.size ||
      parts.some((p) => !expected.delete(p.id)) ||
      expected.size
    )
      return fail('load-source-inventory-mismatch')
    load = {
      kind: 'geometry',
      id: l.id,
      source,
      requiredPartIds: [...l.requiredPartIds],
      parts
    }
  } else return fail('load-geometry-unavailable')
  return { format: 'walking-stowed-envelope-request/1', pose, crate, load }
}

/** One complete geometric product; there is no route, contact or safety verdict. */
export class WalkingRobotEnvelopeOwner {
  readonly work = zeroWork()
  private current: WalkingStowedEnvelope | undefined
  constructor(
    private readonly sourceOwner: WalkingRobotSourceOwner,
    private readonly mounted?: {
      readonly owner: WalkingMountedCrateOwner
      readonly getCurrent: () => WalkingMountedCrate | undefined
    }
  ) {}
  private valid(
    source: WalkingRobotSource,
    request: WalkingStowedEnvelopeRequest
  ) {
    const mounted = this.mounted?.getCurrent()
    return (
      this.sourceOwner.isCurrent(source) &&
      (request.crate.kind === 'none'
        ? mounted === undefined
        : mounted === request.crate.product &&
          this.mounted?.owner.read(source, request.crate.product) ===
            request.crate.product)
    )
  }
  read(source: WalkingRobotSource, request: WalkingStowedEnvelopeRequest) {
    if (this.current && !this.valid(this.current.source, this.current.request))
      this.current = undefined
    if (this.current?.source === source && this.current.request === request)
      return this.current
    return undefined
  }
  clear() {
    this.current = undefined
  }
  prepare(source: WalkingRobotSource, raw: unknown): WalkingEnvelopeResult {
    if (
      this.current &&
      raw === this.current.request &&
      this.read(source, this.current.request)
    )
      return this.current
    this.current = undefined
    const before = { ...this.work }
    this.work.preparations++
    try {
      if (!this.sourceOwner.isCurrent(source)) return fail('stale-source')
      if (
        readActiveWalkingRobotDefinition(source.definition) !==
        source.definition
      )
        return fail('foreign-definition')
      const request = readRequest(raw, source)
      if (!this.valid(source, request)) return fail('stale-mounted-crate')
      freeze(request)
      // A completed canonical stowed FK is rigidly placed once by the request base.
      const posed = this.sourceOwner.evaluate(source, {
        base: origin,
        joints: source.rig.presets.stowed
      })
      this.work.fk++
      const frames = new Map(
        posed.bodyTransforms.map((b) => [b.id, b.transform])
      )
      const fixed = new Set(
        source.rig.bodies
          .filter((b) => b.attachment === 'root')
          .map((b) => b.id)
      )
      let advanced = true
      while (advanced) {
        advanced = false
        for (const body of source.rig.bodies)
          if (
            body.attachment === 'fixed' &&
            body.parentBodyId &&
            fixed.has(body.parentBodyId) &&
            !fixed.has(body.id)
          ) {
            fixed.add(body.id)
            advanced = true
          }
      }
      const bodyBox = accumulator(),
        union = accumulator(),
        contributors: WalkingEnvelopeContributor[] = []
      const include = (
        kind: WalkingEnvelopeContributor['kind'],
        part: WalkingEnvelopeContributor['part'],
        bodyId: string | null,
        place: (v: readonly Interval[]) => readonly Interval[],
        central: boolean
      ) => {
        const box = accumulator()
        const positions = part.shape.positions
        if (positions.length < 3 || positions.length % 3)
          fail('incomplete-source-vertices')
        for (let offset = 0; offset < positions.length; offset += 3) {
          const local = point(positions.slice(offset, offset + 3)).map(interval)
          const canonical = place(local)
          if (central) bodyBox.include(canonical)
          const world = transform(request.pose.base, canonical)
          box.include(world)
          union.include(world)
          if (kind === 'robot') this.work.sourceVertices++
          else this.work.attachmentVertices++
        }
        const vertices = positions.length / 3
        contributors.push(
          freeze({
            kind,
            id: part.id,
            bodyId,
            part,
            bounds: box.bounds(),
            vertices
          })
        )
        this.work.contributors++
      }
      for (const part of source.parts) {
        const body = frames.get(part.bodyId) ?? fail('missing-source-body')
        include(
          'robot',
          part,
          part.bodyId,
          (v) => transform(body, transform(part.localFrame, v)),
          fixed.has(part.bodyId)
        )
      }
      if (request.crate.kind === 'mounted') {
        const crate = request.crate.product,
          translation = crate.placement.translation.map(exactInterval)
        for (const part of crate.geometry.parts)
          include(
            'crate',
            part,
            crate.base.id,
            (v) => v.map((p, k) => add(p, translation[k])),
            false
          )
      }
      if (request.load.kind === 'geometry')
        for (const part of request.load.parts)
          include(
            'load',
            part,
            null,
            (v) => transform(part.localFrame, v),
            false
          )
      const bodyBounds = bodyBox.bounds()
      if (bodyBounds.size[0] > MAX_WALKING_BODY_WIDTH)
        return fail('body-width-exceeded')
      if (!this.valid(source, request)) return fail('stale-envelope-input')
      const delta = zeroWork()
      for (const k of Object.keys(delta) as (keyof EnvelopeWork)[])
        delta[k] = this.work[k] - before[k]
      this.current = freeze({
        status: 'complete',
        format: 'walking-stowed-envelope/1',
        authority: 'completed-stowed-fk-then-base/1',
        source,
        definition: source.definition,
        profile: source.definition.sourceModel,
        request,
        bodyBounds,
        bounds: union.bounds(),
        contributors,
        completeness: 'all-source-and-declared-load',
        work: delta
      })
      return this.current
    } catch (error) {
      this.current = undefined
      return freeze({
        status: 'unavailable',
        reason: error instanceof Error ? error.message : 'envelope-unavailable'
      })
    }
  }
}

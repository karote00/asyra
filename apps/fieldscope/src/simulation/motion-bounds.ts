import {
  evaluateRobotIntervalPose,
  type RigidTransform
} from '../domain/robot-kinematics'
import type { Point3 } from '../domain/greenhouse'
import {
  QueryGeometry,
  type GeometrySource,
  type GeometryBounds
} from './geometry'
import {
  JointSegments,
  type JointSegmentInput,
  type JointDomainWindow
} from './motion'
import { interval } from './query-arithmetic'
import { prepareQueryForwardFrame, transformQueryPoint } from './ray-query'

export interface MotionAssumptions {
  source: 'synthetic'
  assumption: string
  base: { kind: 'fixed-pose'; transform: RigidTransform }
  shapes: 'rigid-source-shapes-throughout'
  held: 'empty-held-throughout'
}
export type MotionEnvelope =
  | { readonly status: 'bounded'; readonly bounds: GeometryBounds }
  | { readonly status: 'unresolved' }

function fail(): never {
  throw new Error('Invalid robot motion bounds request')
}
function keys(value: unknown, names: readonly string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail()
  const actual = Object.keys(value)
  if (
    actual.length !== names.length ||
    actual.some((key) => !names.includes(key))
  )
    fail()
}
function readAssumptions(raw: MotionAssumptions) {
  const input = structuredClone(raw)
  keys(input, ['source', 'assumption', 'base', 'shapes', 'held'])
  if (
    input.source !== 'synthetic' ||
    typeof input.assumption !== 'string' ||
    !input.assumption.trim() ||
    input.shapes !== 'rigid-source-shapes-throughout' ||
    input.held !== 'empty-held-throughout'
  )
    fail()
  keys(input.base, ['kind', 'transform'])
  if (input.base.kind !== 'fixed-pose') fail()
  const transform = input.base.transform
  keys(transform, ['position', 'rotation'])
  for (const [values, length] of [
    [transform.position, 3],
    [transform.rotation, 4]
  ] as const) {
    if (!Array.isArray(values) || values.length !== length) fail()
    for (let index = 0; index < length; index++)
      if (!Number.isFinite(values[index])) fail()
  }
  const norm = Math.hypot(...transform.rotation)
  if (!Number.isFinite(norm) || Math.abs(norm - 1) > 1e-12) fail()
  Object.freeze(transform.position)
  Object.freeze(transform.rotation)
  Object.freeze(transform)
  Object.freeze(input.base)
  return Object.freeze(input)
}

/** Original robot surface envelopes, never a collision or movement decision. */
export class RobotMotionBounds {
  private readonly motion: JointSegments
  constructor(private readonly geometry: QueryGeometry) {
    this.motion = new JointSegments(geometry)
  }

  enclose(
    source: GeometrySource,
    raw: JointSegmentInput,
    window: JointDomainWindow,
    assumptions: MotionAssumptions
  ) {
    this.geometry.read(source)
    const input = readAssumptions(assumptions)
    const domain = this.motion.enclose(source, raw, window)
    const rig = source.receipt.robot.rig
    if (!rig) fail()
    const pose = evaluateRobotIntervalPose(rig, domain.domains)
    const parts = new Map<unknown, (typeof pose.parts)[number]>(
      pose.parts.map((part) => [part.source, part])
    )
    if (parts.size !== pose.parts.length) fail()
    const robot = source.meshes.filter((mesh) => mesh.kind === 'robot')
    if (robot.length !== pose.parts.length) fail()
    const work = {
      domains: domain.work,
      pose: pose.work,
      parts: 0,
      regions: 0,
      envelopes: 0,
      corners: 0,
      baseFrames: 0
    }
    const base = prepareQueryForwardFrame(input.base.transform)
    work.baseFrames++
    type Affine = (typeof pose.parts)[number]['affine']
    const products = new Map<Affine, Map<GeometryBounds, MotionEnvelope>>()
    const envelope = (
      affine: Affine,
      local: GeometryBounds
    ): MotionEnvelope => {
      let group = products.get(affine)
      if (!group) {
        group = new Map()
        products.set(affine, group)
      }
      const previous = group.get(local)
      if (previous) return previous
      work.envelopes++
      const min: [number, number, number] = [Infinity, Infinity, Infinity],
        max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
      for (let corner = 0; corner < 8; corner++) {
        const value = [0, 1, 2].map((axis) =>
          interval(corner & (1 << axis) ? local.max[axis] : local.min[axis])
        )
        const point = transformQueryPoint(
          base,
          transformQueryPoint(affine, value)
        )
        work.corners++
        for (let axis = 0; axis < 3; axis++) {
          min[axis] = Math.min(min[axis], point[axis].low)
          max[axis] = Math.max(max[axis], point[axis].high)
        }
      }
      const result: MotionEnvelope = [...min, ...max].every(Number.isFinite)
        ? Object.freeze({
            status: 'bounded',
            bounds: Object.freeze({
              min: Object.freeze(min) as Point3,
              max: Object.freeze(max) as Point3
            })
          })
        : Object.freeze({ status: 'unresolved' })
      group.set(local, result)
      return result
    }
    const seen = new Set<unknown>()
    const meshes = Object.freeze(
      robot.map((mesh) => {
        const part = parts.get(mesh.origin)
        if (!part || seen.has(part.source) || part.body !== mesh.body) fail()
        seen.add(part.source)
        work.parts++
        const whole = envelope(part.affine, mesh.prepared.bounds)
        const prepared = new Map(
          mesh.prepared.regions.map((region) => [region.source, region.bounds])
        )
        const regions = Object.freeze(
          mesh.origin.regions.map((source) => {
            work.regions++
            const local = prepared.get(source)
            return Object.freeze({
              source,
              provenance: local
                ? ('region-bounds' as const)
                : ('mesh-envelope' as const),
              envelope: local ? envelope(part.affine, local) : whole
            })
          })
        )
        return Object.freeze({ mesh, part, envelope: whole, regions })
      })
    )
    this.geometry.read(source)
    return Object.freeze({
      source,
      domain,
      pose,
      assumptions: input,
      meshes,
      work: Object.freeze(work)
    })
  }
}

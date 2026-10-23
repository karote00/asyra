import { createRobotModel, type RobotPart } from './robot-model'
import { dyadic, type Dyadic } from './scalar-arithmetic'
import {
  readSourceRegions,
  readSourcePatches,
  type SourcePatch
} from './source-occupancy'
import {
  WalkingRobotSourceOwner,
  type WalkingRobotSource,
  type WalkingRobotPart,
  type WalkingRobotBody
} from './walking-robot-source'
import type { WalkingEvidence } from './walking-robot-definition'

type ExactVector = readonly [Dyadic, Dyadic, Dyadic]
interface Dimensions {
  readonly width: number
  readonly length: number
  readonly height: number
}
export interface WalkingMountedCrateRequest {
  readonly format: 'walking-mounted-crate-request/1'
  readonly dimensions: Dimensions
  readonly minimumClearance: Readonly<{
    metres: number
    evidence: WalkingEvidence
  }>
  readonly retention: WalkingEvidence
  readonly massIdentity: string
}
interface CrateGeometry {
  readonly cavity: Readonly<{
    min: ExactVector
    max: ExactVector
    upwardOpen: true
  }>
  readonly dimensions: Dimensions
  readonly parts: readonly Readonly<RobotPart>[]
  readonly bottomPart: Readonly<RobotPart>
  readonly bottomPatch: SourcePatch
  readonly bounds: Readonly<{ min: ExactVector; max: ExactVector }>
}
export interface WalkingMountedCrate {
  readonly format: 'walking-mounted-crate/1'
  readonly source: WalkingRobotSource
  readonly request: WalkingMountedCrateRequest
  readonly geometry: CrateGeometry
  readonly base: WalkingRobotBody
  readonly tray: WalkingRobotPart
  readonly trayPatch: SourcePatch
  readonly placement: Readonly<{
    rotation: readonly [0, 0, 0, 1]
    translation: ExactVector
  }>
  readonly bounds: Readonly<{ min: ExactVector; max: ExactVector }>
  readonly railOuterZ: Dyadic
  readonly contact: Readonly<{
    planeY: Dyadic
    minX: Dyadic
    maxX: Dyadic
    minZ: Dyadic
    maxZ: Dyadic
    area: Dyadic
    partial: boolean
  }>
  readonly massIdentity: string
}
const fail = (): never => {
  throw new Error('Mounted crate source unavailable')
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
function keys(value: Record<string, unknown>, expected: readonly string[]) {
  return (
    Object.keys(value).length === expected.length &&
    expected.every((k) => Object.hasOwn(value, k))
  )
}
function evidence(value: unknown): WalkingEvidence {
  if (
    !record(value) ||
    !keys(value, ['kind', 'id', 'label']) ||
    value.kind !== 'synthetic' ||
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    typeof value.label !== 'string' ||
    !value.label.trim()
  )
    return fail()
  return { kind: 'synthetic', id: value.id, label: value.label }
}
function readRequest(value: unknown): WalkingMountedCrateRequest {
  if (
    !record(value) ||
    !keys(value, [
      'format',
      'dimensions',
      'minimumClearance',
      'retention',
      'massIdentity'
    ]) ||
    value.format !== 'walking-mounted-crate-request/1' ||
    !record(value.dimensions) ||
    !keys(value.dimensions, ['width', 'length', 'height']) ||
    !record(value.minimumClearance) ||
    !keys(value.minimumClearance, ['metres', 'evidence'])
  )
    return fail()
  const { width, length, height } = value.dimensions,
    { metres } = value.minimumClearance
  if (
    typeof width !== 'number' ||
    typeof length !== 'number' ||
    typeof height !== 'number' ||
    ![width, length, height].every((n) => Number.isFinite(n) && n > 0) ||
    typeof metres !== 'number' ||
    !Number.isFinite(metres) ||
    metres <= 0 ||
    typeof value.massIdentity !== 'string' ||
    !value.massIdentity.trim()
  )
    return fail()
  return freeze({
    format: 'walking-mounted-crate-request/1',
    dimensions: { width, length, height },
    minimumClearance: {
      metres,
      evidence: evidence(value.minimumClearance.evidence)
    },
    retention: evidence(value.retention),
    massIdentity: value.massIdentity
  })
}
function exact(significand: bigint, exponent: number): Dyadic {
  if (
    !Number.isSafeInteger(exponent) ||
    Math.abs(exponent) > 24000 ||
    (significand < 0n ? -significand : significand).toString(2).length > 24000
  )
    return fail()
  if (!significand) return { significand: 0n, exponent: 0 }
  while (significand % 2n === 0n) {
    significand /= 2n
    exponent++
  }
  return { significand, exponent }
}
const scalar = (value: number) => {
  if (!Number.isFinite(value)) return fail()
  const v = dyadic(value)
  return exact(v.significand, v.exponent)
}
function plus(a: Dyadic, b: Dyadic) {
  const e = Math.min(a.exponent, b.exponent)
  if (Math.max(a.exponent, b.exponent) - e > 24000) return fail()
  return exact(
    (a.significand << BigInt(a.exponent - e)) +
      (b.significand << BigInt(b.exponent - e)),
    e
  )
}
const negative = (v: Dyadic) => exact(-v.significand, v.exponent)
const minus = (a: Dyadic, b: Dyadic) => plus(a, negative(b))
const times = (a: Dyadic, b: Dyadic) =>
  exact(a.significand * b.significand, a.exponent + b.exponent)
const compare = (a: Dyadic, b: Dyadic) => {
  const d = minus(a, b).significand
  if (d < 0n) return -1
  return d > 0n ? 1 : 0
}
const minimum = (values: readonly Dyadic[]) =>
  values.reduce((a, b) => (compare(a, b) <= 0 ? a : b))
const maximum = (values: readonly Dyadic[]) =>
  values.reduce((a, b) => (compare(a, b) >= 0 ? a : b))
const vector = (f: (axis: number) => Dyadic): ExactVector => [f(0), f(1), f(2)]
const zero: ExactVector = [scalar(0), scalar(0), scalar(0)]
function identity(part: WalkingRobotPart) {
  const q = part.localFrame.rotation
  if (q[0] !== 0 || q[1] !== 0 || q[2] !== 0 || Math.abs(q[3]) !== 1)
    return fail()
  return part.localFrame.position.map(scalar)
}
function shapeBounds(parts: readonly Pick<RobotPart, 'shape' | 'regions'>[]) {
  if (!parts.length) return fail()
  const points: ExactVector[] = []
  for (const part of parts) {
    const { shape } = part
    if (
      shape.positions.length % 3 ||
      !shape.positions.length ||
      shape.indices.some(
        (i) =>
          !Number.isSafeInteger(i) ||
          i < 0 ||
          i * 3 + 2 >= shape.positions.length
      )
    )
      return fail()
    for (let i = 0; i < shape.positions.length; i += 3)
      points.push(vector((k) => scalar(shape.positions[i + k])))
  }
  return {
    min: vector((k) => minimum(points.map((p) => p[k]))),
    max: vector((k) => maximum(points.map((p) => p[k])))
  }
}
function openCavity(parts: readonly RobotPart[]) {
  const bounds = new Map(parts.map((part) => [part.id, shapeBounds([part])]))
  const bound = (id: string) => {
    const result = bounds.get(id)
    if (!result) return fail()
    return result
  }
  const min: ExactVector = [
    maximum(
      ['crate-side--1', 'crate-rim-side--1'].map((id) => bound(id).max[0])
    ),
    bound('crate-bottom').max[1],
    maximum(['crate-end--1', 'crate-rim-end--1'].map((id) => bound(id).max[2]))
  ]
  const max: ExactVector = [
    minimum(['crate-side-1', 'crate-rim-side-1'].map((id) => bound(id).min[0])),
    minimum(
      parts
        .filter((p) => p.id.startsWith('crate-rim-'))
        .map((p) => bound(p.id).min[1])
    ),
    minimum(['crate-end-1', 'crate-rim-end-1'].map((id) => bound(id).min[2]))
  ]
  if (min.some((value, axis) => compare(value, max[axis]) >= 0)) return fail()
  // Every original material cell is contained in its source-vertex bounds.
  // The open X/Z column above the bottom face must avoid all eleven cells,
  // including the rim and latches, without an upper Y cutoff.
  for (const b of bounds.values()) {
    if (
      compare(b.max[1], min[1]) <= 0 ||
      compare(b.max[0], min[0]) <= 0 ||
      compare(b.min[0], max[0]) >= 0 ||
      compare(b.max[2], min[2]) <= 0 ||
      compare(b.min[2], max[2]) >= 0
    )
      continue
    return fail()
  }
  return { min, max, upwardOpen: true as const }
}
function rectangle(
  part: Pick<RobotPart, 'shape' | 'regions'>,
  patch: SourcePatch,
  translation: readonly Dyadic[]
) {
  if (
    !part.regions.includes(patch.region) ||
    patch.ranges.length !== 1 ||
    patch.ranges[0].indexCount !== 6
  )
    return fail()
  const start = patch.ranges[0].indexStart
  const triangles = [0, 3].map((offset) =>
    part.shape.indices
      .slice(start + offset, start + offset + 3)
      .map((i) =>
        vector((k) =>
          plus(scalar(part.shape.positions[i * 3 + k]), translation[k])
        )
      )
  )
  const key = (p: ExactVector) =>
    p.map((v) => v.significand + ':' + v.exponent).join(',')
  const points = [...new Map(triangles.flat().map((p) => [key(p), p])).values()]
  if (points.length !== 4 || points.some((p) => compare(p[1], points[0][1])))
    return fail()
  const minX = minimum(points.map((p) => p[0])),
    maxX = maximum(points.map((p) => p[0]))
  const minZ = minimum(points.map((p) => p[2])),
    maxZ = maximum(points.map((p) => p[2]))
  if (
    compare(minX, maxX) >= 0 ||
    compare(minZ, maxZ) >= 0 ||
    points.some(
      (p) =>
        (compare(p[0], minX) && compare(p[0], maxX)) ||
        (compare(p[2], minZ) && compare(p[2], maxZ))
    )
  )
    return fail()
  if (triangles.some((t) => new Set(t.map(key)).size !== 3)) return fail()
  const shared = triangles[0].filter((p) =>
    triangles[1].some((q) => key(q) === key(p))
  )
  if (
    shared.length !== 2 ||
    !compare(shared[0][0], shared[1][0]) ||
    !compare(shared[0][2], shared[1][2])
  )
    return fail()
  return { minX, maxX, minZ, maxZ, planeY: points[0][1] }
}
const crateIds = [
  'crate-bottom',
  ...[-1, 1].flatMap((side) =>
    ['side', 'rim-side', 'end', 'rim-end', 'latch'].map(
      (name) => 'crate-' + name + '-' + side
    )
  )
]
/** W2 original material and exact mounting geometry only; no W3 or W4 verdict. */
export class WalkingMountedCrateOwner {
  readonly work = { geometryBuilds: 0, mountBuilds: 0 }
  private geometry: CrateGeometry | undefined
  private current: WalkingMountedCrate | undefined
  constructor(private readonly sourceOwner: WalkingRobotSourceOwner) {}
  prepare(source: WalkingRobotSource, input: unknown): WalkingMountedCrate {
    if (
      this.current &&
      this.current.source === source &&
      input === this.current.request &&
      this.sourceOwner.isCurrent(source)
    )
      return this.current
    this.current = undefined
    if (
      !this.sourceOwner.isCurrent(source) ||
      source.definition.sourceModel.kind !== 'solid-articulation/2'
    )
      return fail()
    const request = readRequest(input),
      d = request.dimensions
    if (
      !this.geometry ||
      ['width', 'length', 'height'].some(
        (key) =>
          this.geometry?.dimensions[key as keyof Dimensions] !==
          d[key as keyof Dimensions]
      )
    ) {
      this.work.geometryBuilds++
      const parts = createRobotModel({ ...d, tool: 'cucumber' }).filter((p) =>
        p.id.startsWith('crate-')
      )
      if (
        parts.length !== crateIds.length ||
        crateIds.some((id) => parts.filter((p) => p.id === id).length !== 1)
      )
        return fail()
      for (const p of parts) {
        readSourceRegions(p.regions, p.shape.indices.length)
        if (p.regions.some((r) => r.kind !== 'closed-solid')) return fail()
      }
      const cavity = openCavity(parts)
      const bounds = shapeBounds(parts),
        bottomPart = parts.find((p) => p.id === 'crate-bottom')
      if (!bottomPart) return fail()
      const bottomPatch = readSourcePatches(
        [
          {
            id: 'mounted-crate-bottom-contact',
            region: bottomPart.regions[0],
            ranges: [{ indexStart: 30, indexCount: 6 }]
          }
        ],
        bottomPart.regions,
        bottomPart.shape.indices.length
      )[0]
      this.geometry = freeze({
        cavity,
        dimensions: d,
        parts,
        bottomPart,
        bottomPatch,
        bounds
      })
    }
    this.work.mountBuilds++
    const geometry = this.geometry
    const base = source.rig.bodies.find((b) => b.id === 'base')
    const tray = base?.parts.find((p) => p.id === 'empty-payload-tray')
    const rail = base?.parts.find((p) => p.id === 'lift-rail-positive')
    const trayPatch = tray?.patches.find(
      (p) => p.id === 'payload-tray-mounting-contact'
    )
    if (!base || !tray || !rail || !trayPatch) return fail()
    const trayFace = rectangle(tray, trayPatch, identity(tray))
    const bottomFace = rectangle(
      geometry.bottomPart,
      geometry.bottomPatch,
      zero
    )
    if (compare(bottomFace.planeY, geometry.bounds.min[1])) return fail()
    const railBounds = shapeBounds([rail]),
      railFrame = identity(rail)
    const railOuterZ = plus(railBounds.max[2], railFrame[2])
    const translation: ExactVector = [
      scalar(0),
      minus(trayFace.planeY, bottomFace.planeY),
      minus(
        plus(railOuterZ, scalar(request.minimumClearance.metres)),
        geometry.bounds.min[2]
      )
    ]
    const placedBottom = rectangle(
      geometry.bottomPart,
      geometry.bottomPatch,
      translation
    )
    if (compare(placedBottom.planeY, trayFace.planeY)) return fail()
    const minX = maximum([trayFace.minX, placedBottom.minX]),
      maxX = minimum([trayFace.maxX, placedBottom.maxX])
    const minZ = maximum([trayFace.minZ, placedBottom.minZ]),
      maxZ = minimum([trayFace.maxZ, placedBottom.maxZ])
    if (compare(minX, maxX) >= 0 || compare(minZ, maxZ) >= 0) return fail()
    const bounds = {
      min: vector((k) => plus(geometry.bounds.min[k], translation[k])),
      max: vector((k) => plus(geometry.bounds.max[k], translation[k]))
    }
    if (
      compare(
        minus(bounds.min[2], railOuterZ),
        scalar(request.minimumClearance.metres)
      )
    )
      return fail()
    this.current = freeze({
      format: 'walking-mounted-crate/1',
      source,
      request,
      geometry,
      base,
      tray,
      trayPatch,
      placement: { rotation: [0, 0, 0, 1], translation },
      bounds,
      railOuterZ,
      contact: {
        planeY: trayFace.planeY,
        minX,
        maxX,
        minZ,
        maxZ,
        area: times(minus(maxX, minX), minus(maxZ, minZ)),
        partial: !!(
          compare(minX, placedBottom.minX) ||
          compare(maxX, placedBottom.maxX) ||
          compare(minZ, placedBottom.minZ) ||
          compare(maxZ, placedBottom.maxZ)
        )
      },
      massIdentity: request.massIdentity
    })
    return this.current
  }
  read(source: WalkingRobotSource, product: WalkingMountedCrate) {
    return this.current === product &&
      product.source === source &&
      this.sourceOwner.isCurrent(source)
      ? product
      : undefined
  }
  clear() {
    this.current = undefined
    this.geometry = undefined
  }
}

import type { Point3 } from './greenhouse'
import { TriangleBuilder } from './mesh'
import { boundPolynomialTrig } from './kinematic-trigonometry'
import {
  interval as sourceInterval,
  multiply as multiplyInterval,
  divide as divideInterval,
  subtract as subtractInterval,
  add as addInterval
} from './scalar-arithmetic'
import {
  readSourcePatches,
  type SourcePatch,
  type SourceRegion
} from './source-occupancy'
import {
  isAdmittedWalkingRobotDefinition,
  type Quaternion4,
  type WalkingArmRole,
  type WalkingEvidence,
  type WalkingRobotDefinition,
  type WalkingRobotJointState,
  type WalkingRigidTransform,
  type WalkingSide
} from './walking-robot-definition'
import type {
  WalkingRobotPose,
  WalkingRobotPoseResult
} from './walking-robot-kinematics'
import { evaluateWalkingRobotPose } from './walking-robot-kinematics'

export interface WalkingRobotPart {
  readonly id: string
  readonly bodyId: string
  readonly size: Point3
  readonly localFrame: WalkingRigidTransform
  readonly shape: Readonly<{
    kind: 'triangles'
    positions: readonly number[]
    indices: readonly number[]
  }>
  readonly regions: readonly SourceRegion[]
  readonly patches: readonly SourcePatch[]
  readonly material: Readonly<{
    material: string
    evidence: WalkingEvidence
  }>
}
export interface WalkingPatchReference {
  readonly part: WalkingRobotPart
  readonly patch: SourcePatch
  readonly localFrame: WalkingRigidTransform
}
export interface WalkingRobotBody {
  readonly id: string
  readonly parentBodyId: string | null
  readonly attachment: 'root' | 'joint' | 'fixed'
  readonly fixedFrame?: WalkingRigidTransform
  readonly parts: readonly WalkingRobotPart[]
}
export interface WalkingRobotJoint {
  readonly id: string
  readonly parentBodyId: string
  readonly childBodyId: string
  readonly frame: WalkingRigidTransform
  readonly axis: 'x' | 'y' | 'z'
  readonly motion: 'revolute' | 'prismatic'
  readonly domain: readonly [number, number]
}
export interface WalkingRobotJointInterface {
  readonly jointId: string
  readonly frame: WalkingRigidTransform
  readonly axis: WalkingRobotJoint['axis']
  readonly domain: readonly [number, number]
  readonly parentPatches: readonly WalkingPatchReference[]
  readonly childPatches: readonly WalkingPatchReference[]
  readonly materialInterface: 'unmodeled'
}
export interface WalkingRobotMassProperties {
  readonly id: string
  readonly definition: WalkingRobotDefinition
  readonly evidence: WalkingEvidence
  readonly totalMassKg: number
  readonly bodies: readonly {
    readonly bodyId: string
    readonly massKg: number
    readonly localCoM: Point3
  }[]
}
export interface WalkingRobotSource {
  readonly id: string
  readonly revision: number
  readonly definition: WalkingRobotDefinition
  readonly parts: readonly WalkingRobotPart[]
  readonly massProperties: WalkingRobotMassProperties
  readonly rig: Readonly<{
    bodies: readonly WalkingRobotBody[]
    joints: readonly WalkingRobotJoint[]
    jointInterfaces: readonly WalkingRobotJointInterface[]
    armChains: readonly {
      id: string
      side: WalkingSide
      role: WalkingArmRole
      bodyIds: readonly string[]
      jointIds: readonly string[]
      toolBodyId: string
      guardBodyId: string
    }[]
    legChains: readonly {
      id: string
      side: WalkingSide
      station: 'front' | 'middle' | 'rear'
      bodyIds: readonly string[]
      jointIds: readonly string[]
      footBodyId: string
    }[]
    contacts: Readonly<{
      feet: readonly WalkingPatchReference[]
      supportTools: readonly WalkingPatchReference[]
      cuttingEdges: readonly WalkingPatchReference[]
    }>
    presets: Readonly<{
      stowed: WalkingRobotJointState
      leftWorking: WalkingRobotJointState
      rightWorking: WalkingRobotJointState
    }>
    inspectionHeadFrames: Readonly<{
      left: WalkingRigidTransform
      right: WalkingRigidTransform
    }>
  }>
}

const identityRotation: Quaternion4 = Object.freeze([0, 0, 0, 1])
const sourceMaterialEvidence: WalkingEvidence = deepFreeze({
  kind: 'synthetic',
  id: 'walking-source-materials-v1',
  label: 'Walking robot source materials - synthetic assumptions'
})
const point = (x: number, y: number, z: number): Point3 =>
  Object.freeze([x, y, z])
const frame = (
  position: Point3,
  rotation: Quaternion4 = identityRotation
): WalkingRigidTransform => Object.freeze({ position, rotation })
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
function weightedMass(
  entries: readonly { massKg: number; localCoM: Point3 }[]
) {
  const massKg = entries.reduce((sum, entry) => sum + entry.massKg, 0)
  return {
    massKg,
    localCoM: point(
      entries.reduce(
        (sum, entry) => sum + entry.localCoM[0] * entry.massKg,
        0
      ) / massKg,
      entries.reduce(
        (sum, entry) => sum + entry.localCoM[1] * entry.massKg,
        0
      ) / massKg,
      entries.reduce(
        (sum, entry) => sum + entry.localCoM[2] * entry.massKg,
        0
      ) / massKg
    )
  }
}

type SolidCell = readonly (readonly Point3[])[]
type CuttingPlane = Readonly<{ normal: Point3; offset: number }>
interface SourceScalar {
  significand: bigint
  exponent: number
}
function requiredSource<T>(value: T | undefined): T {
  if (value === undefined)
    throw new Error('Missing canonical source construction value')
  return value
}
function sourceScalar(value: number): SourceScalar {
  if (!Number.isFinite(value)) throw new Error('Non-finite source arithmetic')
  if (value === 0) return { significand: 0n, exponent: 0 }
  const bytes = new DataView(new ArrayBuffer(8))
  bytes.setFloat64(0, value)
  const bits = bytes.getBigUint64(0),
    exponent = Number((bits >> 52n) & 2047n)
  return {
    significand:
      (bits >> 63n ? -1n : 1n) *
      ((bits & ((1n << 52n) - 1n)) + (exponent ? 1n << 52n : 0n)),
    exponent: exponent ? exponent - 1075 : -1074
  }
}
function sourceScalarAdd(a: SourceScalar, b: SourceScalar): SourceScalar {
  const exponent = Math.min(a.exponent, b.exponent)
  return {
    significand:
      (a.significand << BigInt(a.exponent - exponent)) +
      (b.significand << BigInt(b.exponent - exponent)),
    exponent
  }
}
function sourceScalarCompare(a: SourceScalar, b: SourceScalar) {
  const delta = sourceScalarAdd(a, {
    significand: -b.significand,
    exponent: b.exponent
  }).significand
  if (delta < 0n) return -1
  return delta > 0n ? 1 : 0
}
function sourceScalarMultiply(a: SourceScalar, b: SourceScalar): SourceScalar {
  return {
    significand: a.significand * b.significand,
    exponent: a.exponent + b.exponent
  }
}
const sourceScalarNegative = (value: SourceScalar): SourceScalar => ({
  significand: -value.significand,
  exponent: value.exponent
})
function sourceExactDot(a: Point3, b: Point3) {
  return a.reduce((sum, value, axis) => {
    const first = sourceScalar(value),
      second = sourceScalar(b[axis])
    return sourceScalarAdd(sum, {
      significand: first.significand * second.significand,
      exponent: first.exponent + second.exponent
    })
  }, sourceScalar(0))
}
/** Directed conversion of an exact construction result, not a geometry tolerance. */
function sourceDirected(value: SourceScalar, direction: -1 | 1) {
  const sign = value.significand < 0n ? -1 : 1
  const magnitude =
    value.significand < 0n ? -value.significand : value.significand
  const shift = Math.max(
    0,
    magnitude.toString(2).length - 53,
    -1074 - value.exponent
  )
  const quotient = magnitude >> BigInt(shift)
  const remainder = magnitude - (quotient << BigInt(shift))
  const rounded = quotient + (remainder !== 0n && direction === sign ? 1n : 0n)
  const result = sign * Number(rounded) * 2 ** (value.exponent + shift)
  if (!Number.isFinite(result))
    throw new Error('Unrepresentable source endpoint')
  return result
}
function sourceSupport(vertices: readonly Point3[], direction: Point3) {
  return vertices.reduce((maximum, vertex) => {
    const candidate = sourceExactDot(vertex, direction)
    return sourceScalarCompare(candidate, maximum) > 0 ? candidate : maximum
  }, sourceScalar(0))
}
function builderVertices(builder: TriangleBuilder): Point3[] {
  const vertices: Point3[] = []
  for (let offset = 0; offset < builder.positions.length; offset += 3)
    vertices.push(
      point(
        builder.positions[offset],
        builder.positions[offset + 1],
        builder.positions[offset + 2]
      )
    )
  return vertices
}
const sourceDot = (a: Point3, b: Point3) =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
function sourcePoint(values: readonly number[]): Point3 {
  if (values.length !== 3 || !values.every(Number.isFinite))
    throw new Error('Invalid articulation source coordinate')
  return point(values[0], values[1], values[2])
}
const pointQuaternionConjugate = (value: Quaternion4): Quaternion4 =>
  Object.freeze([-value[0], -value[1], -value[2], value[3]])
const sourceSubtract = (a: Point3, b: Point3): Point3 =>
  point(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const sourceCross = (a: Point3, b: Point3): Point3 =>
  point(
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  )
function sourceRotate(q: Quaternion4, value: Point3): Point3 {
  const [x, y, z, w] = q
  const xx = x * x,
    yy = y * y,
    zz = z * z,
    ww = w * w
  const xy = x * y,
    xz = x * z,
    xw = x * w,
    yz = y * z,
    yw = y * w,
    zw = z * w
  const norm = xx + yy + zz + ww
  if (!(norm > 0) || !Number.isFinite(norm))
    throw new Error('Invalid source rotation')
  return point(
    ((ww + xx - yy - zz) * value[0] +
      2 * (xy - zw) * value[1] +
      2 * (xz + yw) * value[2]) /
      norm,
    (2 * (xy + zw) * value[0] +
      (ww - xx + yy - zz) * value[1] +
      2 * (yz - xw) * value[2]) /
      norm,
    (2 * (xz - yw) * value[0] +
      2 * (yz + xw) * value[1] +
      (ww - xx - yy + zz) * value[2]) /
      norm
  )
}
function boxCell(min: Point3, max: Point3): SolidCell {
  const p = (x: number, y: number, z: number): Point3 =>
    point(x ? max[0] : min[0], y ? max[1] : min[1], z ? max[2] : min[2])
  return [
    [p(0, 0, 0), p(1, 0, 0), p(1, 1, 0), p(0, 1, 0)],
    [p(1, 0, 1), p(0, 0, 1), p(0, 1, 1), p(1, 1, 1)],
    [p(0, 0, 1), p(0, 0, 0), p(0, 1, 0), p(0, 1, 1)],
    [p(1, 0, 0), p(1, 0, 1), p(1, 1, 1), p(1, 1, 0)],
    [p(0, 1, 0), p(1, 1, 0), p(1, 1, 1), p(0, 1, 1)],
    [p(0, 0, 1), p(1, 0, 1), p(1, 0, 0), p(0, 0, 0)]
  ]
}

/** Certifies only emitted source material cells, never robot/body clearance. */
function requireMaterialCell(faces: SolidCell) {
  const vertices = [
    ...new Map(faces.flat().map((p) => [p.join(','), p])).values()
  ]
  const indices = new Map(vertices.map((p, index) => [p.join(','), index]))
  const bytes = new DataView(new ArrayBuffer(8))
  const coefficients = vertices.map((p) =>
    p.map((value) => {
      if (!Number.isFinite(value)) throw new Error('Non-finite material cell')
      if (value === 0) return { significand: 0n, exponent: 0 }
      bytes.setFloat64(0, value)
      const bits = bytes.getBigUint64(0),
        exponent = Number((bits >> 52n) & 2047n)
      return {
        significand:
          (bits >> 63n ? -1n : 1n) *
          ((bits & ((1n << 52n) - 1n)) + (exponent ? 1n << 52n : 0n)),
        exponent: exponent ? exponent - 1075 : -1074
      }
    })
  )
  const exponent = Math.min(
    ...coefficients.flat().map((value) => value.exponent)
  )
  const points = coefficients.map((p) =>
    p.map((value) => value.significand << BigInt(value.exponent - exponent))
  )
  const difference = (a: bigint[], b: bigint[]) =>
    a.map((value, axis) => value - b[axis])
  const cross = (a: bigint[], b: bigint[]) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ]
  const dot = (a: bigint[], b: bigint[]) =>
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const edges = new Map<string, { count: number; balance: number }>()
  let dimensional = false
  for (const face of faces) {
    const ids = face.map((p) => requiredSource(indices.get(p.join(','))))
    for (let index = 0; index < ids.length; index++) {
      const a = ids[index],
        b = ids[(index + 1) % ids.length]
      const key = a < b ? a + '/' + b : b + '/' + a
      const edge = edges.get(key) ?? { count: 0, balance: 0 }
      edge.count++
      edge.balance += a < b ? 1 : -1
      edges.set(key, edge)
    }
    for (let index = 1; index + 1 < ids.length; index++) {
      const origin = points[ids[0]]
      const normal = cross(
        difference(points[ids[index]], origin),
        difference(points[ids[index + 1]], origin)
      )
      if (normal.every((value) => value === 0n))
        throw new Error('Degenerate emitted material face')
      let positive = false,
        negative = false
      for (const p of points) {
        const side = dot(normal, difference(p, origin))
        positive ||= side > 0n
        negative ||= side < 0n
      }
      if (positive && negative)
        throw new Error('Nonconvex emitted material cell')
      dimensional ||= positive || negative
    }
  }
  if (
    !dimensional ||
    [...edges.values()].some((edge) => edge.count !== 2 || edge.balance !== 0)
  )
    throw new Error('Unclosed or lower-dimensional emitted material cell')
}

function appendCell(builder: TriangleBuilder, faces: SolidCell) {
  requireMaterialCell(faces)
  const start = builder.indices.length
  for (const face of faces)
    for (let index = 1; index + 1 < face.length; index++)
      builder.triangle(face[0], face[index], face[index + 1])
  builder.region('closed-solid', start)
}
function boxBuilder(min: Point3, max: Point3) {
  const builder = new TriangleBuilder()
  appendCell(builder, boxCell(min, max))
  return builder
}
/** A sufficient exact closed-material connection witness, never collision permission. */
function requireBearingConnection(
  sleeve: TriangleBuilder,
  neck: TriangleBuilder
) {
  const neckVertices = builderVertices(neck)
  const coefficients = [...neckVertices, ...builderVertices(sleeve)].map((p) =>
    p.map(sourceScalar)
  )
  const exponent = Math.min(
    ...coefficients.flat().map((value) => value.exponent)
  )
  const points = coefficients.map((p) =>
    p.map((value) => value.significand << BigInt(value.exponent - exponent))
  )
  const subtract = (a: bigint[], b: bigint[]) =>
    a.map((value, axis) => value - b[axis])
  const cross = (a: bigint[], b: bigint[]) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ]
  const dot = (a: bigint[], b: bigint[]) =>
    a.reduce((sum, value, axis) => sum + value * b[axis], 0n)
  for (const region of neck.regions()) {
    const indices = neck.indices.slice(
      region.indexStart,
      region.indexStart + region.indexCount
    )
    interface ConnectionPlane {
      origin: bigint[]
      normal: bigint[]
      inside: bigint
    }
    const planes: ConnectionPlane[] = []
    for (let offset = 0; offset < indices.length; offset += 3) {
      const origin = points[indices[offset]]
      const normal = cross(
        subtract(points[indices[offset + 1]], origin),
        subtract(points[indices[offset + 2]], origin)
      )
      const inside = indices
        .map((index) => dot(normal, subtract(points[index], origin)))
        .find((side) => side !== 0n)
      if (inside === undefined)
        throw new Error('Unproved bearing connection cell')
      planes.push({ origin, normal, inside })
    }
    if (
      points.slice(neckVertices.length).some((candidate) =>
        planes.every(({ origin, normal, inside }) => {
          const side = dot(normal, subtract(candidate, origin))
          return side === 0n || side > 0n === inside > 0n
        })
      )
    )
      return
  }
  throw new Error('Disconnected canonical neck and sleeve')
}
/** Construction clips material cells; no query result or contact permission is involved. */
function clipCell(cell: SolidCell, plane: CuttingPlane): SolidCell | undefined {
  const values = cell
    .flat()
    .map((p) => sourceDot(plane.normal, p) - plane.offset)
  if (values.every((value) => value <= 0)) return cell
  if (values.every((value) => value >= 0)) return undefined
  const faces: Point3[][] = [],
    cap = new Map<string, Point3>(),
    intersections = new Map<string, Point3>()
  const key = (p: Point3) => p.join(',')
  for (const face of cell) {
    const output: Point3[] = []
    for (let index = 0; index < face.length; index++) {
      const a = face[index],
        b = face[(index + 1) % face.length]
      const da = sourceDot(plane.normal, a) - plane.offset
      const db = sourceDot(plane.normal, b) - plane.offset
      if (da <= 0) output.push(a)
      if (da === 0) cap.set(key(a), a)
      if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
        const ak = key(a),
          bk = key(b),
          edge = ak < bk ? ak + '/' + bk : bk + '/' + ak
        let p = intersections.get(edge)
        if (!p) {
          const from = ak < bk ? a : b,
            to = ak < bk ? b : a
          const df = sourceDot(plane.normal, from) - plane.offset
          const dt = sourceDot(plane.normal, to) - plane.offset
          const fraction = df / (df - dt)
          const coordinates = [0, 1, 2].map(
            (axis) => from[axis] + fraction * (to[axis] - from[axis])
          )
          const solvedAxis = plane.normal.reduce(
            (best, value, axis) =>
              Math.abs(value) > Math.abs(plane.normal[best]) ? axis : best,
            0
          )
          coordinates[solvedAxis] =
            (plane.offset -
              plane.normal.reduce(
                (sum, value, axis) =>
                  axis === solvedAxis ? sum : sum + value * coordinates[axis],
                0
              )) /
            plane.normal[solvedAxis]
          p = sourcePoint(coordinates)
          intersections.set(edge, p)
        }
        output.push(p)
        cap.set(key(p), p)
      }
    }
    const distinct = output.filter(
      (p, index) => index === 0 || key(p) !== key(output[index - 1])
    )
    if (
      distinct.length > 2 &&
      key(distinct[0]) === key(distinct[distinct.length - 1])
    )
      distinct.pop()
    if (distinct.length >= 3) faces.push(distinct)
  }
  const rim = [...cap.values()]
  if (rim.length < 3)
    throw new Error(
      `Invalid articulation housing cut: ${JSON.stringify({
        plane,
        rim,
        signedDistances: [...new Set(values)]
      })}`
    )
  const centre = sourcePoint(
    [0, 1, 2].map(
      (axis) => rim.reduce((sum, p) => sum + p[axis], 0) / rim.length
    )
  )
  const reference =
    Math.abs(plane.normal[0]) < 0.9 ? point(1, 0, 0) : point(0, 1, 0)
  const u = sourceCross(plane.normal, reference),
    v = sourceCross(plane.normal, u)
  rim.sort((a, b) => {
    const pa = sourceSubtract(a, centre),
      pb = sourceSubtract(b, centre)
    return (
      Math.atan2(sourceDot(pa, v), sourceDot(pa, u)) -
      Math.atan2(sourceDot(pb, v), sourceDot(pb, u))
    )
  })
  // Existing source boxes have inward winding; preserve it on the new cap.
  faces.push(rim.reverse())
  return faces
}
function subtractVolumes(
  outer: SolidCell,
  volumes: readonly (readonly CuttingPlane[])[]
) {
  let cells: SolidCell[] = [outer]
  for (const planes of volumes) {
    const retained: SolidCell[] = []
    for (const original of cells) {
      let remainder: SolidCell | undefined = original
      for (const plane of planes) {
        if (!remainder) break
        const outside = clipCell(remainder, {
          normal: point(-plane.normal[0], -plane.normal[1], -plane.normal[2]),
          offset: -plane.offset
        })
        if (outside) retained.push(outside)
        remainder = clipCell(remainder, plane)
      }
    }
    cells = retained
  }
  if (!cells.length) throw new Error('Articulation removes its parent housing')
  const builder = new TriangleBuilder()
  for (const cell of cells) appendCell(builder, cell)
  return builder
}
function boxPlanes(min: Point3, max: Point3): CuttingPlane[] {
  return [0, 1, 2].flatMap((axis) => {
    const n = [0, 0, 0]
    n[axis] = 1
    return [
      { normal: point(n[0], n[1], n[2]), offset: max[axis] },
      { normal: point(-n[0], -n[1], -n[2]), offset: -min[axis] }
    ]
  })
}
function ringBuilder(
  axis: 'x' | 'y' | 'z',
  inner: number,
  outer: number,
  low: number,
  high: number
) {
  const builder = new TriangleBuilder(),
    count = 8
  const along = (radius: number, index: number, height: number): Point3 => {
    const angle = (index * 2 * Math.PI) / count
    const u = radius * Math.cos(angle),
      v = radius * Math.sin(angle)
    if (axis === 'x') return point(height, u, v)
    if (axis === 'y') return point(v, height, u)
    return point(u, v, height)
  }
  const outerLow = Array.from({ length: count }, (_, i) => along(outer, i, low))
  const outerHigh = Array.from({ length: count }, (_, i) =>
    along(outer, i, high)
  )
  const innerLow = Array.from({ length: count }, (_, i) => along(inner, i, low))
  const innerHigh = Array.from({ length: count }, (_, i) =>
    along(inner, i, high)
  )
  for (let index = 0; index < count; index++) {
    const next = (index + 1) % count
    const a = innerLow[index],
      b = outerLow[index],
      c = outerLow[next],
      d = innerLow[next]
    const e = innerHigh[index],
      f = outerHigh[index],
      g = outerHigh[next],
      h = innerHigh[next]
    appendCell(
      builder,
      inner === 0
        ? [
            [a, c, b],
            [e, f, g],
            [a, b, f, e],
            [b, c, g, f],
            [c, a, e, g]
          ]
        : [
            [a, d, c, b],
            [e, f, g, h],
            [a, b, f, e],
            [b, c, g, f],
            [c, d, h, g],
            [d, a, e, h]
          ]
    )
  }
  return builder
}

export { ringBuilder as createAnnularSourceMaterial }

function buildWalkingRobotSource(
  definition: WalkingRobotDefinition,
  revision: number
): WalkingRobotSource {
  type BodyDraft = Omit<WalkingRobotBody, 'parts'> & {
    parts: WalkingRobotPart[]
  }
  const parts: WalkingRobotPart[] = []
  const bodies: BodyDraft[] = []
  const joints: WalkingRobotJoint[] = []
  const massBodies: { bodyId: string; massKg: number; localCoM: Point3 }[] = []
  const body = (
    id: string,
    parentBodyId: string | null,
    attachment: WalkingRobotBody['attachment'],
    massKg: number,
    localCoM: Point3,
    fixedFrame?: WalkingRigidTransform
  ) => {
    const draft: BodyDraft = {
      id,
      parentBodyId,
      attachment,
      ...(fixedFrame ? { fixedFrame } : {}),
      parts: []
    }
    bodies.push(draft)
    massBodies.push({ bodyId: id, massKg, localCoM })
    return draft
  }
  const addPart = (
    target: BodyDraft,
    id: string,
    size: Point3,
    localFrame: WalkingRigidTransform,
    material: string,
    patch?:
      | { id: string; indexStart: number; indexCount: number }
      | readonly {
          id: string
          indexStart: number
          indexCount: number
          regionIndex?: number
        }[],
    geometry?: TriangleBuilder
  ) => {
    const builder = geometry ?? new TriangleBuilder()
    if (!geometry) builder.box([0, 0, 0], size)
    const regions = builder.regions()
    const declarations = Array.isArray(patch)
      ? patch
      : [patch].filter((entry) => entry !== undefined)
    const patches = readSourcePatches(
      declarations.map((entry) => ({
        id: entry.id,
        region: regions['regionIndex' in entry ? (entry.regionIndex ?? 0) : 0],
        ranges: [{ indexStart: entry.indexStart, indexCount: entry.indexCount }]
      })),
      regions,
      builder.indices.length
    )
    const source: WalkingRobotPart = deepFreeze({
      id,
      bodyId: target.id,
      size: geometry
        ? sourcePoint(
            [0, 1, 2].map((axis) => {
              const coordinates = builder.positions.filter(
                (_, index) => index % 3 === axis
              )
              return Math.max(...coordinates) - Math.min(...coordinates)
            })
          )
        : point(size[0], size[1], size[2]),
      localFrame,
      shape: {
        kind: 'triangles' as const,
        positions: [...builder.positions],
        indices: [...builder.indices]
      },
      regions,
      patches,
      material: { material, evidence: sourceMaterialEvidence }
    })
    target.parts.push(source)
    parts.push(source)
    return source
  }
  const model = definition.sourceModel
  interface LinkDraft {
    target: BodyDraft
    id: string
    size: Point3
    axis: 0 | 1 | 2
    sign: -1 | 1
    direction: Point3
    section: number
    length: number
    start: number
    end: number
    endRequirement?: SourceScalar
    material: string
    patches?: { id: string; indexStart: number; indexCount: number }[]
  }
  const linkGeometry = new Map<string, LinkDraft>()
  const toolReferences: { bodyId: string; role: WalkingArmRole }[] = []
  const coreGeometry = (link: LinkDraft) => {
    const { size, axis, sign, length, start, end } = link
    if (!(length > start + end))
      throw new Error('No positive link core remains')
    const terminal = link.endRequirement ?? sourceScalar(end)
    const far = sourceDirected(
      sourceScalarAdd(sourceScalar(length), {
        significand: -terminal.significand,
        exponent: terminal.exponent
      }),
      -1
    )
    const min = size.map((value) => -value / 2),
      max = size.map((value) => value / 2)
    min[axis] = sign > 0 ? start : -far
    max[axis] = sign > 0 ? far : -start
    return boxBuilder(sourcePoint(min), sourcePoint(max))
  }
  const addLink = (
    target: BodyDraft,
    id: string,
    size: Point3,
    axis: 0 | 1 | 2,
    sign: -1 | 1,
    section: number,
    hasDistalJoint: boolean,
    material = 'synthetic-link',
    patches?: { id: string; indexStart: number; indexCount: number }[]
  ) => {
    const length = size[axis],
      start = section * model.linkSetbackRatio
    const end = hasDistalJoint ? start : 0
    const direction = [0, 0, 0]
    direction[axis] = sign
    linkGeometry.set(target.id, {
      target,
      id,
      size,
      axis,
      sign,
      direction: sourcePoint(direction),
      section,
      length,
      start,
      end,
      material,
      patches
    })
  }
  const housing = (
    size: Point3,
    centre: Point3,
    roots: readonly {
      mount: WalkingRigidTransform
      direction: Point3
      section: number
      length: number
    }[]
  ) => {
    const min = sourcePoint(size.map((value, axis) => centre[axis] - value / 2))
    const max = sourcePoint(size.map((value, axis) => centre[axis] + value / 2))
    const volumes: CuttingPlane[][] = []
    for (const root of roots) {
      const clearance = root.section * model.axialGapRatio
      const radius = root.section * model.sleeveOuterRadiusRatio + clearance
      const direction = sourceRotate(root.mount.rotation, root.direction)
      const localAxis = root.direction.findIndex((value) => value !== 0)
      const sign = root.direction[localAxis]
      let exit = Infinity,
        entry = -Infinity
      for (let axis = 0; axis < 3; axis++) {
        const halfSection = root.section / 2 + clearance
        if (direction[axis] === 0) {
          if (
            root.mount.position[axis] < min[axis] - halfSection ||
            root.mount.position[axis] > max[axis] + halfSection
          )
            throw new Error('Disconnected articulation root')
        } else {
          const a =
            (min[axis] - halfSection - root.mount.position[axis]) /
            direction[axis]
          const b =
            (max[axis] + halfSection - root.mount.position[axis]) /
            direction[axis]
          entry = Math.max(entry, Math.min(a, b))
          exit = Math.min(exit, Math.max(a, b))
        }
      }
      if (!(exit > Math.max(0, entry)) || exit >= root.length)
        throw new Error('Articulation link cannot leave its parent housing')
      const transformPlanes = (planes: CuttingPlane[]) =>
        planes.map((plane) => {
          const normal = sourceRotate(root.mount.rotation, plane.normal)
          return {
            normal,
            offset: plane.offset + sourceDot(normal, root.mount.position)
          }
        })
      const socketMin = [-radius, -radius, -radius],
        socketMax = [radius, radius, radius]
      // The bearing entrance follows the nearest parent face; the independent
      // child corridor follows the authored departure direction.
      const normalized = root.mount.position.map(
        (value, axis) => (value - centre[axis]) / (size[axis] / 2)
      )
      const nearest = normalized.reduce(
        (best, value, axis) =>
          Math.abs(value) > Math.abs(normalized[best]) ? axis : best,
        0
      )
      const entranceMin = root.mount.position.map((value) => value - radius)
      const entranceMax = root.mount.position.map((value) => value + radius)
      if (normalized[nearest] < 0)
        entranceMin[nearest] = min[nearest] - clearance
      else entranceMax[nearest] = max[nearest] + clearance
      volumes.push(
        boxPlanes(sourcePoint(entranceMin), sourcePoint(entranceMax))
      )
      volumes.push(
        transformPlanes(
          boxPlanes(sourcePoint(socketMin), sourcePoint(socketMax))
        )
      )
      const corridorMin = [-radius, -radius, -radius],
        corridorMax = [radius, radius, radius]
      corridorMin[localAxis] = sign > 0 ? 0 : -exit
      corridorMax[localAxis] = sign > 0 ? exit : 0
      volumes.push(
        transformPlanes(
          boxPlanes(sourcePoint(corridorMin), sourcePoint(corridorMax))
        )
      )
    }
    return subtractVolumes(boxCell(min, max), volumes)
  }
  const joint = (
    id: string,
    parentBodyId: string,
    childBodyId: string,
    jointFrame: WalkingRigidTransform,
    axis: WalkingRobotJoint['axis'],
    motion: WalkingRobotJoint['motion'],
    domain: readonly [number, number]
  ) => {
    const value = deepFreeze({
      id,
      parentBodyId,
      childBodyId,
      frame: jointFrame,
      axis,
      motion,
      domain: [...domain] as [number, number]
    })
    joints.push(value)
    return value
  }

  const fixedMasses = [
    definition.base.chassis,
    definition.base.mast,
    definition.base.emptyPayloadTray,
    definition.base.inspectionHeads.left,
    definition.base.inspectionHeads.right
  ]
  const baseMass = weightedMass(fixedMasses)
  const base = body('base', null, 'root', baseMass.massKg, baseMass.localCoM)
  addPart(
    base,
    'chassis',
    definition.base.chassis.size,
    frame(point(0, 0, 0)),
    'synthetic-structural-shell',
    undefined,
    housing(
      definition.base.chassis.size,
      definition.base.chassis.centre,
      (model.kind === 'solid-articulation/2' ? [] : definition.legs).map(
        (leg) => ({
          mount: leg.mount,
          direction: point(leg.side === 'left' ? -1 : 1, 0, 0),
          section: leg.coxa.section,
          length: leg.coxa.length
        })
      )
    )
  )
  const railParts: WalkingRobotPart[] = []
  const mast = definition.base.mast,
    carriageGeometry = definition.carriage
  for (const sign of [-1, 1] as const) {
    const inner =
      carriageGeometry.centre[2] + (sign * carriageGeometry.size[2]) / 2
    const outer = inner + (sign * mast.size[2]) / 2
    const min = point(
      mast.centre[0] - mast.size[0] / 2,
      mast.centre[1] - mast.size[1] / 2,
      Math.min(inner, outer)
    )
    const max = point(
      mast.centre[0] + mast.size[0] / 2,
      mast.centre[1] + mast.size[1] / 2,
      Math.max(inner, outer)
    )
    railParts.push(
      addPart(
        base,
        sign < 0 ? 'lift-rail-negative' : 'lift-rail-positive',
        mast.size,
        frame(point(0, 0, 0)),
        'synthetic-structural-shell',
        {
          id:
            sign < 0
              ? 'lift-rail-negative-interface'
              : 'lift-rail-positive-interface',
          indexStart: sign < 0 ? 6 : 0,
          indexCount: 6
        },
        boxBuilder(min, max)
      )
    )
  }
  addPart(
    base,
    'empty-payload-tray',
    definition.base.emptyPayloadTray.size,
    frame(definition.base.emptyPayloadTray.centre),
    'synthetic-structural-shell',
    definition.sourceModel.kind === 'solid-articulation/2'
      ? { id: 'payload-tray-mounting-contact', indexStart: 24, indexCount: 6 }
      : undefined
  )
  addPart(
    base,
    'inspection-head-left',
    definition.base.inspectionHeads.left.size,
    frame(definition.base.inspectionHeads.left.centre),
    'synthetic-sensor-housing'
  )
  addPart(
    base,
    'inspection-head-right',
    definition.base.inspectionHeads.right.size,
    frame(definition.base.inspectionHeads.right.centre),
    'synthetic-sensor-housing'
  )
  const carriage = body(
    'carriage',
    'base',
    'joint',
    definition.carriage.massKg,
    definition.carriage.localCoM
  )
  const carriageBuilder = housing(
    definition.carriage.size,
    definition.carriage.centre,
    definition.arms.map((arm) => ({
      mount: arm.mount,
      direction: point(0, 1, 0),
      section: arm.upper.section,
      length: arm.upper.length
    }))
  )
  const carriageFaces: {
    id: string
    indexStart: number
    indexCount: number
    regionIndex: number
  }[] = []
  carriageBuilder.regions().forEach((region, regionIndex) => {
    for (const sign of [-1, 1] as const) {
      const plane =
        definition.carriage.centre[2] + (sign * definition.carriage.size[2]) / 2
      for (
        let offset = region.indexStart;
        offset < region.indexStart + region.indexCount;
        offset += 3
      ) {
        if (
          [0, 1, 2].every(
            (corner) =>
              carriageBuilder.positions[
                carriageBuilder.indices[offset + corner] * 3 + 2
              ] === plane
          )
        )
          carriageFaces.push({
            id: `carriage-rail-${sign}-${offset}`,
            indexStart: offset,
            indexCount: 3,
            regionIndex
          })
      }
    }
  })
  const carriagePart = addPart(
    carriage,
    'carriage',
    definition.carriage.size,
    frame(point(0, 0, 0)),
    'synthetic-structural-shell',
    carriageFaces,
    carriageBuilder
  )
  joint(
    'carriage-lift',
    'base',
    'carriage',
    frame(point(0, 0, 0)),
    'y',
    'prismatic',
    definition.carriage.liftRange
  )

  const armChains: WalkingRobotSource['rig']['armChains'][number][] = []
  const supportTools: WalkingPatchReference[] = []
  const cuttingEdges: WalkingPatchReference[] = []
  for (const arm of definition.arms) {
    const chain = `${arm.side}-${arm.role}`
    const upperId = `${chain}-upper`,
      forearmId = `${chain}-forearm`
    const wristId = `${chain}-wrist`,
      toolId = `${chain}-tool`,
      guardId = `${chain}-guard`
    const upper = body(
      upperId,
      'carriage',
      'joint',
      arm.upper.massKg,
      arm.upper.localCoM
    )
    const forearm = body(
      forearmId,
      upperId,
      'joint',
      arm.forearm.massKg,
      arm.forearm.localCoM
    )
    const wrist = body(
      wristId,
      forearmId,
      'joint',
      arm.wrist.massKg,
      arm.wrist.localCoM
    )
    const toolBody = body(
      toolId,
      wristId,
      'joint',
      arm.tool.massKg,
      arm.tool.localCoM
    )
    const guardBody = body(
      guardId,
      toolId,
      'fixed',
      arm.guard.massKg,
      arm.guard.localCoM,
      frame(point(0, arm.tool.reach * 0.55, -arm.tool.height / 2))
    )
    addLink(
      upper,
      upperId,
      point(arm.upper.section, arm.upper.length, arm.upper.section),
      1,
      1,
      arm.upper.section,
      true
    )
    addLink(
      forearm,
      forearmId,
      point(arm.forearm.section, arm.forearm.length, arm.forearm.section),
      1,
      1,
      arm.forearm.section,
      true
    )
    addLink(
      wrist,
      wristId,
      point(arm.wrist.section, arm.wrist.length, arm.wrist.section),
      1,
      1,
      arm.wrist.section,
      true
    )
    addLink(
      toolBody,
      toolId,
      point(arm.tool.width, arm.tool.reach, arm.tool.height),
      1,
      1,
      Math.min(arm.tool.width, arm.tool.height),
      false,
      arm.role === 'support'
        ? 'synthetic-soft-textile'
        : 'synthetic-hardened-steel',
      [
        {
          id: `${chain}-${arm.role === 'support' ? 'crop-support' : 'cutting-edge'}`,
          indexStart: 6,
          indexCount: 6
        },
        { id: `${chain}-guard-interface`, indexStart: 0, indexCount: 6 }
      ]
    )
    addPart(
      guardBody,
      guardId,
      arm.guard.size,
      frame(point(0, 0, 0)),
      'synthetic-guard',
      { id: `${chain}-guard-tool-interface`, indexStart: 6, indexCount: 6 },
      boxBuilder(
        point(
          -arm.guard.size[0] / 2,
          -arm.guard.size[1] / 2,
          -arm.guard.size[2]
        ),
        point(arm.guard.size[0] / 2, arm.guard.size[1] / 2, 0)
      )
    )
    toolReferences.push({
      bodyId: toolId,
      role: arm.role
    })
    const jointIds = [
      `${chain}-root-yaw`,
      `${chain}-shoulder-pitch`,
      `${chain}-elbow-pitch`,
      `${chain}-wrist-pitch`
    ]
    joint(
      jointIds[0],
      'carriage',
      upperId,
      arm.mount,
      'y',
      'revolute',
      arm.jointRanges.rootYaw
    )
    joint(
      jointIds[1],
      upperId,
      forearmId,
      frame(point(0, arm.upper.length, 0)),
      'x',
      'revolute',
      arm.jointRanges.shoulderPitch
    )
    joint(
      jointIds[2],
      forearmId,
      wristId,
      frame(point(0, arm.forearm.length, 0)),
      'x',
      'revolute',
      arm.jointRanges.elbowPitch
    )
    joint(
      jointIds[3],
      wristId,
      toolId,
      frame(point(0, arm.wrist.length, 0)),
      'x',
      'revolute',
      arm.jointRanges.wristPitch
    )
    armChains.push(
      deepFreeze({
        id: chain,
        side: arm.side,
        role: arm.role,
        bodyIds: [upperId, forearmId, wristId, toolId, guardId],
        jointIds,
        toolBodyId: toolId,
        guardBodyId: guardId
      })
    )
  }

  const legChains: WalkingRobotSource['rig']['legChains'][number][] = []
  const feet: WalkingPatchReference[] = []
  for (const leg of definition.legs) {
    const chain = `${leg.side}-${leg.station}`
    const coxaId = `${chain}-coxa`,
      upperId = `${chain}-upper`
    const lowerId = `${chain}-lower`,
      footId = `${chain}-foot`
    const side = leg.side === 'left' ? -1 : 1
    const coxa = body(
      coxaId,
      'base',
      'joint',
      leg.coxa.massKg,
      leg.coxa.localCoM
    )
    const upper = body(
      upperId,
      coxaId,
      'joint',
      leg.upper.massKg,
      leg.upper.localCoM
    )
    const lower = body(
      lowerId,
      upperId,
      'joint',
      leg.lower.massKg,
      leg.lower.localCoM
    )
    const foot = body(
      footId,
      lowerId,
      'fixed',
      leg.foot.massKg,
      leg.foot.localCoM,
      frame(point(0, -leg.lower.length, 0))
    )
    addLink(
      coxa,
      coxaId,
      point(leg.coxa.length, leg.coxa.section, leg.coxa.section),
      0,
      side,
      leg.coxa.section,
      true
    )
    addLink(
      upper,
      upperId,
      point(leg.upper.section, leg.upper.length, leg.upper.section),
      1,
      -1,
      leg.upper.section,
      true
    )
    addLink(
      lower,
      lowerId,
      point(leg.lower.section, leg.lower.length, leg.lower.section),
      1,
      -1,
      leg.lower.section,
      false,
      'synthetic-link',
      [{ id: `${chain}-lower-foot-interface`, indexStart: 30, indexCount: 6 }]
    )
    const footPart = addPart(
      foot,
      footId,
      leg.foot.size,
      frame(point(0, -leg.foot.size[1] / 2, 0)),
      'synthetic-foot',
      [
        { id: `${chain}-ground-contact`, indexStart: 30, indexCount: 6 },
        { id: `${chain}-foot-lower-interface`, indexStart: 24, indexCount: 6 }
      ]
    )
    feet.push(
      deepFreeze({
        part: footPart,
        patch: footPart.patches[0],
        localFrame: frame(
          point(0, -leg.foot.size[1], 0),
          Object.freeze([Math.SQRT1_2, 0, 0, Math.SQRT1_2])
        )
      })
    )
    const jointIds = [`${chain}-abduction`, `${chain}-hip`, `${chain}-knee`]
    joint(
      jointIds[0],
      'base',
      coxaId,
      leg.mount,
      'z',
      'revolute',
      leg.jointRanges.abduction
    )
    joint(
      jointIds[1],
      coxaId,
      upperId,
      frame(point(side * leg.coxa.length, 0, 0)),
      'x',
      'revolute',
      leg.jointRanges.hip
    )
    joint(
      jointIds[2],
      upperId,
      lowerId,
      frame(point(0, -leg.upper.length, 0)),
      'x',
      'revolute',
      leg.jointRanges.knee
    )
    legChains.push(
      deepFreeze({
        id: chain,
        side: leg.side,
        station: leg.station,
        bodyIds: [coxaId, upperId, lowerId, footId],
        jointIds,
        footBodyId: footId
      })
    )
  }

  interface BearingPart {
    role: 'pin' | 'sleeve' | 'yoke' | 'neck'
    target: BodyDraft
    id: string
    localFrame: WalkingRigidTransform
    material: string
    geometry: TriangleBuilder
  }
  interface ArticulationDraft {
    entry: WalkingRobotJoint
    parentLink: LinkDraft | undefined
    childLink: LinkDraft
    parts: BearingPart[]
  }
  const buildArticulations = () => {
    const result: ArticulationDraft[] = []
    for (const entry of joints) {
      if (entry.motion !== 'revolute') continue
      const parent = bodies.find(({ id }) => id === entry.parentBodyId)
      const child = bodies.find(({ id }) => id === entry.childBodyId)
      const childLink = linkGeometry.get(entry.childBodyId)
      const parentLink = linkGeometry.get(entry.parentBodyId)
      if (!parent || !child || !childLink)
        throw new Error('Incomplete articulation owner')
      const bearingParts: BearingPart[] = []
      const addBearing = (
        role: BearingPart['role'],
        target: BodyDraft,
        id: string,
        localFrame: WalkingRigidTransform,
        material: string,
        geometry: TriangleBuilder
      ) =>
        bearingParts.push({ role, target, id, localFrame, material, geometry })
      const axisIndex = { x: 0, y: 1, z: 2 }[entry.axis]
      const s = childLink.section,
        gap = s * model.axialGapRatio
      const pinRadius = s * model.pinRadiusRatio
      const inner = s * model.sleeveInnerRadiusRatio,
        outer = s * model.sleeveOuterRadiusRatio
      const halfBand = pinRadius
      const childAxial = childLink.direction.every(
        (value, index) => index === axisIndex || value === 0
      )
      const parentDirection = parentLink
        ? sourceRotate(
            pointQuaternionConjugate(entry.frame.rotation),
            point(
              -parentLink.direction[0],
              -parentLink.direction[1],
              -parentLink.direction[2]
            )
          )
        : point(0, 0, 0)
      const parentAxial =
        parentLink &&
        parentDirection.every(
          (value, index) => index === axisIndex || value === 0
        )
      let yokeSign = -1
      if (parentAxial) yokeSign = Math.sign(parentDirection[axisIndex])
      else if (childAxial) yokeSign = -Math.sign(childLink.direction[axisIndex])
      let yokeInner = halfBand + gap
      if (!parentLink) yokeInner = outer + gap
      else if (parentAxial) yokeInner = Math.max(parentLink.end, s / 2) + gap
      if (model.kind === 'solid-articulation/2' && parent === base)
        yokeInner = sourceDirected(
          sourceScalarAdd(sourceScalar(outer), sourceScalar(gap)),
          1
        )
      let yokeOuter =
        !parentLink || parentAxial
          ? yokeInner + gap
          : Math.max(parentLink.section / 2, yokeInner + gap)
      if (model.kind === 'solid-articulation/2' && parent === base)
        yokeOuter = sourceDirected(
          sourceScalarAdd(sourceScalar(yokeInner), sourceScalar(gap)),
          1
        )
      addBearing(
        'pin',
        parent,
        `${entry.id}-pin`,
        entry.frame,
        'synthetic-bearing-pin',
        ringBuilder(
          entry.axis,
          0,
          pinRadius,
          yokeSign < 0 ? -yokeOuter : -halfBand,
          yokeSign > 0 ? yokeOuter : halfBand
        )
      )
      addBearing(
        'sleeve',
        child,
        `${entry.id}-sleeve`,
        frame(point(0, 0, 0)),
        'synthetic-bearing-sleeve',
        ringBuilder(entry.axis, inner, outer, -halfBand, halfBand)
      )
      const yokeMin = [-outer, -outer, -outer],
        yokeMax = [outer, outer, outer]
      yokeMin[axisIndex] = yokeSign < 0 ? -yokeOuter : yokeInner
      yokeMax[axisIndex] = yokeSign > 0 ? yokeOuter : -yokeInner
      if (parentLink && !parentAxial) {
        for (let axis = 0; axis < 3; axis++) {
          if (axis === axisIndex) continue
          const departure = parentDirection[axis]
          if (departure === 0) {
            yokeMin[axis] = -pinRadius
            yokeMax[axis] = pinRadius
          } else {
            yokeMin[axis] = Math.min(0, departure * (parentLink.end + gap))
            yokeMax[axis] = Math.max(0, departure * (parentLink.end + gap))
          }
        }
      }
      if (model.kind === 'solid-articulation/2' && parent === base) {
        if (
          entry.axis !== 'z' ||
          childLink.axis !== 0 ||
          entry.frame.rotation.some((v, index) =>
            index < 3 ? v !== 0 : Math.abs(v) !== 1
          )
        )
          throw new Error('Unsupported external root frame')
        const side = childLink.direction[0]
        const chassis = definition.base.chassis
        const face = chassis.centre[0] + (side * chassis.size[0]) / 2
        const localFace = face - entry.frame.position[0]
        if (
          sourceScalarCompare(
            sourceScalarAdd(
              sourceScalar(localFace),
              sourceScalar(entry.frame.position[0])
            ),
            sourceScalar(face)
          ) !== 0 ||
          side * localFace >= -outer
        )
          throw new Error('Unproved external root chassis face')
        // This single closed convex plate connects the chassis face and pin
        // within the already axially separated parent slab.
        yokeMin[0] = Math.min(localFace, -outer)
        yokeMax[0] = Math.max(localFace, outer)
        for (const axis of [1, 2]) {
          const low = sourceScalarAdd(
            sourceScalar(entry.frame.position[axis]),
            sourceScalar(yokeMin[axis])
          )
          const high = sourceScalarAdd(
            sourceScalar(entry.frame.position[axis]),
            sourceScalar(yokeMax[axis])
          )
          if (
            sourceScalarCompare(
              low,
              sourceScalar(chassis.centre[axis] - chassis.size[axis] / 2)
            ) < 0 ||
            sourceScalarCompare(
              high,
              sourceScalar(chassis.centre[axis] + chassis.size[axis] / 2)
            ) > 0 ||
            sourceScalarCompare(low, high) >= 0
          )
            throw new Error('Disconnected external root chassis face')
        }
      }
      addBearing(
        'yoke',
        parent,
        `${entry.id}-yoke`,
        entry.frame,
        'synthetic-bearing-yoke',
        boxBuilder(sourcePoint(yokeMin), sourcePoint(yokeMax))
      )
      if (childAxial) {
        const sign = childLink.direction[axisIndex]
        addBearing(
          'neck',
          child,
          `${entry.id}-neck`,
          frame(point(0, 0, 0)),
          'synthetic-bearing-neck',
          ringBuilder(
            entry.axis,
            inner,
            outer,
            sign > 0 ? halfBand : -childLink.start - gap,
            sign > 0 ? childLink.start + gap : -halfBand
          )
        )
      } else {
        const neckMin = [-pinRadius, -pinRadius, -pinRadius]
        const neckMax = [pinRadius, pinRadius, pinRadius]
        neckMin[axisIndex] = -halfBand
        neckMax[axisIndex] = halfBand
        for (let axis = 0; axis < 3; axis++) {
          if (childLink.direction[axis] === 0) continue
          const sign = childLink.direction[axis]
          neckMin[axis] = sign > 0 ? inner + gap : -childLink.start - gap
          neckMax[axis] = sign > 0 ? childLink.start + gap : -inner - gap
        }
        addBearing(
          'neck',
          child,
          `${entry.id}-neck`,
          frame(point(0, 0, 0)),
          'synthetic-bearing-neck',
          boxBuilder(sourcePoint(neckMin), sourcePoint(neckMax))
        )
      }
      result.push({ entry, parentLink, childLink, parts: bearingParts })
    }
    return result
  }
  const crossSection = (link: LinkDraft) => {
    const axes = [0, 1, 2].filter((axis) => axis !== link.axis)
    return [-1, 1].flatMap((a) =>
      [-1, 1].map((b) => {
        const p = [0, 0, 0]
        p[axes[0]] = (a * link.size[axes[0]]) / 2
        p[axes[1]] = (b * link.size[axes[1]]) / 2
        return sourcePoint(p)
      })
    )
  }
  const endpointContexts = (articulation: ArticulationDraft) => {
    const { entry, parentLink, childLink } = articulation
    const inverse = pointQuaternionConjugate(entry.frame.rotation)
    const parentDeparture = parentLink
      ? sourceRotate(
          inverse,
          sourcePoint(parentLink.direction.map((value) => -value))
        )
      : undefined
    const parentProfile = parentLink
      ? crossSection(parentLink).map((p) => sourceRotate(inverse, p))
      : []
    const parentMaterial = articulation.parts
      .filter(({ role }) => role === 'pin' || role === 'yoke')
      .flatMap(({ geometry }) => builderVertices(geometry))
    const childMaterial = articulation.parts
      .filter(({ role }) => role === 'sleeve' || role === 'neck')
      .flatMap(({ geometry }) => builderVertices(geometry))
    const gap = childLink.section * model.axialGapRatio
    const contexts = [
      {
        link: childLink,
        endpoint: 'start' as 'start' | 'end',
        u: childLink.direction,
        other: parentLink,
        otherDeparture: parentDeparture,
        profile: parentProfile,
        material: parentMaterial,
        gap
      }
    ]
    if (parentLink && parentDeparture)
      contexts.push({
        link: parentLink,
        endpoint: 'end',
        u: parentDeparture,
        other: childLink,
        otherDeparture: childLink.direction,
        profile: crossSection(childLink),
        material: childMaterial,
        gap
      })
    return contexts
  }
  // Finite pivot cross-sections are construction keepouts, not published material.
  // Solve once from the bounded joint primitives, then regenerate connectors and
  // certify their final actual material without a fixed-point iteration.
  const initialArticulations = buildArticulations()
  for (const articulation of initialArticulations)
    for (const context of endpointContexts(articulation)) {
      if (
        context.otherDeparture &&
        sourceScalarCompare(
          sourceExactDot(context.otherDeparture, context.u),
          sourceScalar(0)
        ) > 0
      )
        throw new Error(
          'Endpoint cores depart into the same material halfspace'
        )
      const support = sourceSupport(
        [...context.profile, ...context.material],
        context.u
      )
      const supported = sourceScalarAdd(support, sourceScalar(context.gap))
      const nominal = sourceScalar(
        context.link.section * model.linkSetbackRatio
      )
      const required =
        sourceScalarCompare(supported, nominal) > 0 ? supported : nominal
      context.link[context.endpoint] = sourceDirected(required, 1)
      if (context.endpoint === 'end') context.link.endRequirement = required
    }
  const cores = new Map(
    [...linkGeometry.values()].map((link) => [link, coreGeometry(link)])
  )
  const finalArticulations = buildArticulations()
  for (const articulation of finalArticulations) {
    const { entry, parentLink } = articulation
    const projection = (link: LinkDraft, p: Point3, u: Point3) => {
      if (link !== parentLink) return sourceExactDot(p, u)
      const bodyDirection = sourceRotate(entry.frame.rotation, u)
      const origin = sourceExactDot(entry.frame.position, bodyDirection)
      return sourceScalarAdd(sourceExactDot(p, bodyDirection), {
        significand: -origin.significand,
        exponent: origin.exponent
      })
    }
    for (const context of endpointContexts(articulation)) {
      const profileSupport = sourceSupport(context.profile, context.u)
      let otherSupport = sourceSupport(context.material, context.u)
      if (context.other)
        for (const vertex of builderVertices(
          requiredSource(cores.get(context.other))
        )) {
          const actual = projection(context.other, vertex, context.u)
          if (sourceScalarCompare(actual, profileSupport) > 0)
            throw new Error(
              'Actual endpoint core exceeds its finite interface profile'
            )
          if (sourceScalarCompare(actual, otherSupport) > 0)
            otherSupport = actual
        }
      const required = sourceScalarAdd(otherSupport, sourceScalar(context.gap))
      for (const vertex of builderVertices(
        requiredSource(cores.get(context.link))
      ))
        if (
          sourceScalarCompare(
            projection(context.link, vertex, context.u),
            required
          ) < 0
        )
          throw new Error(
            `Unresolved physical endpoint gap: ${entry.id}/${context.endpoint}`
          )
    }
    requireBearingConnection(
      requiredSource(articulation.parts.find(({ role }) => role === 'sleeve'))
        .geometry,
      requiredSource(articulation.parts.find(({ role }) => role === 'neck'))
        .geometry
    )
    for (const connector of articulation.parts.filter(
      ({ role }) => role === 'neck' || role === 'yoke'
    )) {
      const link = linkGeometry.get(connector.target.id)
      if (!link) continue
      const core = builderVertices(requiredSource(cores.get(link)))
      const min = [0, 1, 2].map((axis) => Math.min(...core.map((p) => p[axis])))
      const max = [0, 1, 2].map((axis) => Math.max(...core.map((p) => p[axis])))
      const connected = builderVertices(connector.geometry).some((p) => {
        const rotated = sourceRotate(connector.localFrame.rotation, p)
        const position = rotated.map(
          (value, axis) => value + connector.localFrame.position[axis]
        )
        return position.every(
          (value, axis) => value >= min[axis] && value <= max[axis]
        )
      })
      if (!connected)
        throw new Error(`Disconnected canonical connector: ${connector.id}`)
    }
  }
  for (const link of linkGeometry.values())
    addPart(
      link.target,
      link.id,
      link.size,
      frame(point(0, 0, 0)),
      link.material,
      link.patches,
      cores.get(link)
    )
  for (const articulation of finalArticulations)
    for (const part of articulation.parts)
      addPart(
        part.target,
        part.id,
        point(0, 0, 0),
        part.localFrame,
        part.material,
        undefined,
        part.geometry
      )
  if (model.kind === 'solid-articulation/2') {
    const zero = sourceScalar(0)
    const absolute = (value: SourceScalar) =>
      value.significand < 0n ? sourceScalarNegative(value) : value
    const square = (value: SourceScalar) => sourceScalarMultiply(value, value)
    const sum = (values: SourceScalar[]) => values.reduce(sourceScalarAdd, zero)
    const exactPartVertices = (part: WalkingRobotPart) => {
      if (
        part.localFrame.rotation.some((v, index) =>
          index < 3 ? v !== 0 : Math.abs(v) !== 1
        )
      )
        throw new Error('Unsupported external root material frame')
      return Array.from(
        { length: part.shape.positions.length / 3 },
        (_, index) =>
          [0, 1, 2].map((axis) =>
            sourceScalarAdd(
              sourceScalar(part.shape.positions[index * 3 + axis]),
              sourceScalar(part.localFrame.position[axis])
            )
          )
      )
    }
    for (const entry of joints.filter(
      (entry) => entry.parentBodyId === base.id && entry.motion === 'revolute'
    )) {
      const child = requiredSource(
        bodies.find((body) => body.id === entry.childBodyId)
      )
      const link = requiredSource(linkGeometry.get(child.id))
      const side = sourceScalar(link.direction[0])
      const gap = sourceScalar(link.section * model.axialGapRatio)
      const domain = { low: entry.domain[0] / 2, high: entry.domain[1] / 2 }
      if (
        domain.low * 2 !== entry.domain[0] ||
        domain.high * 2 !== entry.domain[1]
      )
        throw new Error('Unsupported external root abduction domain')
      // Existing polynomial owner bounds the entire real authored domain.
      // The normalized similarity has C²+S²=1 exactly.
      const sine = boundPolynomialTrig('sin', domain).bounds
      const cosine = boundPolynomialTrig('cos', domain).bounds
      const sm = sourceInterval(
        Math.max(Math.abs(sine.low), Math.abs(sine.high))
      )
      const cm = sourceInterval(cosine.low)
      const cm2 = multiplyInterval(cm, cm)
      const sm2 = multiplyInterval(sm, sm)
      const cmin = sourceScalar(
        divideInterval(
          subtractInterval(cm2, sm2),
          addInterval(sourceInterval(1), sm2)
        ).low
      )
      const smax = sourceScalar(
        divideInterval(multiplyInterval(sourceInterval(2), sm), cm2).high
      )
      if (cosine.low <= 0 || sourceScalarCompare(cmin, zero) <= 0)
        throw new Error('Unproved external root abduction domain')
      const material = child.parts.map((part) => ({
        part,
        vertices: exactPartVertices(part)
      }))
      const vertices = material.flatMap(({ vertices }) => vertices)
      const chassis = definition.base.chassis
      const chassisFace = sourceScalarAdd(
        sourceScalarMultiply(side, sourceScalar(chassis.centre[0])),
        sourceScalar(chassis.size[0] / 2)
      )
      const inward = sourceScalarAdd(
        sourceScalarAdd(
          sourceScalarMultiply(side, sourceScalar(entry.frame.position[0])),
          sourceScalarNegative(chassisFace)
        ),
        sourceScalarNegative(gap)
      )
      if (sourceScalarCompare(inward, zero) <= 0)
        throw new Error('Insufficient external root mount clearance')
      const inward2 = square(inward)
      const articulation = requiredSource(
        finalArticulations.find((a) => a.entry === entry)
      )
      const pinGeometry = requiredSource(
        articulation.parts.find((p) => p.role === 'pin')
      ).geometry
      const pin2 = builderVertices(pinGeometry)
        .map((p) =>
          sourceScalarAdd(
            square(sourceScalar(p[0])),
            square(sourceScalar(p[1]))
          )
        )
        .reduce((a, b) => (sourceScalarCompare(a, b) > 0 ? a : b))
      // Actual emitted ring vertices can exceed their nominal radius because
      // their trigonometric coordinates are binary64. Compare exact squared
      // support with the actual mount allowance, never the nominal radius.
      for (const p of vertices) {
        const radial2 = sourceScalarAdd(square(p[0]), square(p[1]))
        const outward = sourceScalarAdd(
          sourceScalarMultiply(sourceScalarMultiply(side, p[0]), cmin),
          sourceScalarNegative(sourceScalarMultiply(absolute(p[1]), smax))
        )
        if (
          sourceScalarCompare(radial2, inward2) > 0 &&
          sourceScalarCompare(outward, zero) <= 0
        )
          throw new Error('Unproved external root child support')
      }
      // Each actual closed convex child region needs a radial supporting
      // halfspace outside the pin disk. Rotation preserves that disk exactly.
      for (const { part, vertices } of material)
        for (const region of part.regions) {
          const points = part.shape.indices
            .slice(region.indexStart, region.indexStart + region.indexCount)
            .map((index) => vertices[index])
          const normal = [
            sum(points.map((p) => p[0])),
            sum(points.map((p) => p[1]))
          ]
          const norm2 = sourceScalarAdd(square(normal[0]), square(normal[1]))
          const minimum = points
            .map((p) =>
              sourceScalarAdd(
                sourceScalarMultiply(p[0], normal[0]),
                sourceScalarMultiply(p[1], normal[1])
              )
            )
            .reduce((a, b) => (sourceScalarCompare(a, b) < 0 ? a : b))
          if (
            sourceScalarCompare(minimum, zero) <= 0 ||
            sourceScalarCompare(
              square(minimum),
              sourceScalarMultiply(pin2, norm2)
            ) <= 0
          )
            throw new Error('Unproved external root pin cavity')
        }
      const childLow = vertices
        .map((p) => p[2])
        .reduce((a, b) => (sourceScalarCompare(a, b) < 0 ? a : b))
      const childHigh = vertices
        .map((p) => p[2])
        .reduce((a, b) => (sourceScalarCompare(a, b) > 0 ? a : b))
      const threshold = sourceScalarNegative(sourceScalarAdd(inward, gap))
      // Exhaustive original parent material: chassis-side separation,
      // axial separation, or a certified pin disk. No part-name exemption.
      for (const part of base.parts) {
        const parent = exactPartVertices(part).map((p) =>
          p.map((v, axis) =>
            sourceScalarAdd(
              v,
              sourceScalarNegative(sourceScalar(entry.frame.position[axis]))
            )
          )
        )
        for (const region of part.regions) {
          const points = part.shape.indices
            .slice(region.indexStart, region.indexStart + region.indexCount)
            .map((index) => parent[index])
          const chassisSide = points.every(
            (p) =>
              sourceScalarCompare(
                sourceScalarMultiply(side, p[0]),
                threshold
              ) <= 0
          )
          const below = points.every(
            (p) =>
              sourceScalarCompare(sourceScalarAdd(p[2], gap), childLow) <= 0
          )
          const above = points.every(
            (p) =>
              sourceScalarCompare(sourceScalarAdd(childHigh, gap), p[2]) <= 0
          )
          const pin = points.every(
            (p) =>
              sourceScalarCompare(
                sourceScalarAdd(square(p[0]), square(p[1])),
                pin2
              ) <= 0
          )
          if (!chassisSide && !below && !above && !pin)
            throw new Error(
              'Unproved external root parent material: ' +
                part.id +
                ' - ' +
                region.id
            )
        }
      }
    }
  }
  for (const reference of toolReferences) {
    const part = parts.find((candidate) => candidate.id === reference.bodyId)
    if (!part) throw new Error('Missing canonical tool core')
    const patch = part.patches[0],
      sum = [0, 0, 0]
    let count = 0
    for (const range of patch.ranges)
      for (
        let offset = range.indexStart;
        offset < range.indexStart + range.indexCount;
        offset++
      ) {
        const vertex = part.shape.indices[offset] * 3
        for (let axis = 0; axis < 3; axis++)
          sum[axis] += part.shape.positions[vertex + axis]
        count++
      }
    const centre = sourceRotate(
      part.localFrame.rotation,
      sourcePoint(sum.map((value) => value / count))
    )
    ;(reference.role === 'support' ? supportTools : cuttingEdges).push(
      deepFreeze({
        part,
        patch,
        localFrame: frame(
          sourcePoint(
            centre.map((value, axis) => value + part.localFrame.position[axis])
          ),
          part.localFrame.rotation
        )
      })
    )
  }
  const frozenBodies = bodies.map((entry) => deepFreeze(entry))
  const massProperties: WalkingRobotMassProperties = deepFreeze({
    id: `walking-robot-mass-${revision}-${definition.definitionId}`,
    definition,
    evidence: definition.massEvidence,
    totalMassKg: massBodies.reduce((sum, entry) => sum + entry.massKg, 0),
    bodies: massBodies
  })
  const jointInterfaces = joints.map((entry): WalkingRobotJointInterface =>
    deepFreeze({
      jointId: entry.id,
      frame: entry.frame,
      axis: entry.axis,
      domain: entry.domain,
      parentPatches:
        entry.motion === 'prismatic'
          ? railParts.map((part) => ({
              part,
              patch: part.patches[0],
              localFrame: frame(point(0, 0, 0))
            }))
          : [],
      childPatches:
        entry.motion === 'prismatic'
          ? carriagePart.patches.map((patch) => ({
              part: carriagePart,
              patch,
              localFrame: frame(point(0, 0, 0))
            }))
          : [],
      materialInterface: 'unmodeled'
    })
  )
  return deepFreeze({
    id: `walking-robot-source-${revision}-${definition.definitionId}`,
    revision,
    definition,
    parts,
    massProperties,
    rig: {
      bodies: frozenBodies,
      joints,
      jointInterfaces,
      armChains,
      legChains,
      contacts: { feet, supportTools, cuttingEdges },
      presets: definition.presets,
      inspectionHeadFrames: {
        left: frame(definition.base.inspectionHeads.left.centre),
        right: frame(definition.base.inspectionHeads.right.centre)
      }
    }
  })
}

export class WalkingRobotSourceOwner {
  readonly work = { builds: 0 }
  private current: WalkingRobotSource | undefined
  private revision = 0

  prepare(definition: WalkingRobotDefinition) {
    if (!isAdmittedWalkingRobotDefinition(definition))
      throw new Error('Walking definition was not admitted')
    if (this.current?.definition === definition) return this.current
    this.work.builds++
    this.current = buildWalkingRobotSource(definition, ++this.revision)
    return this.current
  }
  read() {
    return this.current
  }
  isCurrent(source: WalkingRobotSource) {
    return this.current === source
  }
  evaluate(
    source: WalkingRobotSource,
    pose: WalkingRobotPose
  ): WalkingRobotPoseResult {
    if (!this.isCurrent(source)) throw new Error('Stale walking robot source')
    return evaluateWalkingRobotPose(source, pose)
  }
  clear() {
    this.current = undefined
  }
}

import type { SpatialQuaternion, SpatialVector } from '@asyra/render-engine'
import { readSpatialPose, type SpatialPose } from './pose.js'

export interface SpatialEditTarget {
  readonly id: string
  readonly revision: number
  readonly pose: SpatialPose
  readonly allowScale: boolean
}
export interface SpatialEditPlane {
  readonly origin: SpatialVector
  readonly u: SpatialVector
  readonly v: SpatialVector
  readonly spacing?: readonly [number, number]
}
export type SpatialEditCommand =
  | {
      readonly kind: 'translate'
      readonly delta: SpatialVector
      readonly plane?: SpatialEditPlane
    }
  | {
      readonly kind: 'rotate'
      readonly axis: SpatialVector
      readonly radians: number
      readonly space: 'local' | 'world'
    }
  | { readonly kind: 'scale'; readonly factors: SpatialVector }
  | { readonly kind: 'set'; readonly pose: SpatialPose }
export interface SpatialEditPreview {
  readonly id: string
  readonly revision: number
  readonly pose: SpatialPose
}
export type SpatialEditResult =
  | { readonly status: 'ready'; readonly pose: SpatialPose }
  | { readonly status: 'unchanged' }
  | {
      readonly status: 'rejected'
      readonly reason: 'stale' | 'scale' | 'constraint'
    }

const vector = (input: SpatialVector): SpatialVector => {
  if (
    !Array.isArray(input) ||
    input.length !== 3 ||
    !input.every(Number.isFinite)
  ) {
    throw new Error('Invalid spatial edit vector')
  }
  return [...input] as unknown as SpatialVector
}
const dot = (a: SpatialVector, b: SpatialVector) =>
  a.reduce((sum, n, i) => sum + n * b[i], 0)
const unit = (input: SpatialVector): SpatialVector => {
  const value = vector(input),
    length = Math.hypot(...value)
  if (!Number.isFinite(length) || length < 1e-12) {
    throw new Error('Invalid spatial edit axis')
  }
  return value.map((n) => n / length) as unknown as SpatialVector
}
const product = (
  a: SpatialQuaternion,
  b: SpatialQuaternion
): SpatialQuaternion => {
  const q = [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]
  ]
  const length = Math.hypot(...q)
  return q.map((n) => n / length) as unknown as SpatialQuaternion
}
function project(
  position: SpatialVector,
  plane: SpatialEditPlane
): SpatialVector {
  const origin = vector(plane.origin),
    u = unit(plane.u),
    v = unit(plane.v)
  if (Math.abs(dot(u, v)) > 1e-8) {
    throw new Error('Spatial edit plane axes must be orthogonal')
  }
  const relative = position.map(
    (n, i) => n - origin[i]
  ) as unknown as SpatialVector
  let a = dot(relative, u),
    b = dot(relative, v)
  if (plane.spacing !== undefined) {
    const spacing = [...plane.spacing]
    if (
      spacing.length !== 2 ||
      spacing.some((n) => !Number.isFinite(n) || n <= 0)
    ) {
      throw new Error('Invalid spatial edit grid spacing')
    }
    a = Math.round(a / spacing[0]) * spacing[0]
    b = Math.round(b / spacing[1]) * spacing[1]
  }
  return origin.map(
    (n, i) => n + a * u[i] + b * v[i]
  ) as unknown as SpatialVector
}
function readTarget(target: SpatialEditTarget): SpatialPose {
  if (
    !target.id ||
    typeof target.id !== 'string' ||
    !Number.isSafeInteger(target.revision) ||
    target.revision < 0 ||
    typeof target.allowScale !== 'boolean'
  ) {
    throw new Error('Invalid spatial edit target')
  }
  return readSpatialPose(target.pose)
}
const equalScale = (a: SpatialPose, b: SpatialPose) =>
  [0, 1, 2].every((i) => (a.scale?.[i] ?? 1) === (b.scale?.[i] ?? 1))

/** Pure pose calculation; use previewSpatialEdit when capturing a canonical target/revision. */
export function transformSpatialPose(
  source: SpatialPose,
  command: SpatialEditCommand,
  allowScale: boolean
): SpatialPose {
  if (typeof allowScale !== 'boolean') {
    throw new Error('Invalid spatial scale capability')
  }
  const from = readSpatialPose(source)
  let pose: SpatialPose = from
  switch (command.kind) {
    case 'translate': {
      const delta = vector(command.delta)
      const position = from.position.map(
        (n, i) => n + delta[i]
      ) as unknown as SpatialVector
      pose = {
        ...from,
        position: command.plane ? project(position, command.plane) : position
      }
      break
    }
    case 'rotate': {
      if (
        !Number.isFinite(command.radians) ||
        !['local', 'world'].includes(command.space)
      ) {
        throw new Error('Invalid spatial edit rotation')
      }
      const axis = unit(command.axis),
        sine = Math.sin(command.radians / 2)
      const rotation: SpatialQuaternion = [
        axis[0] * sine,
        axis[1] * sine,
        axis[2] * sine,
        Math.cos(command.radians / 2)
      ]
      pose = {
        ...from,
        rotation:
          command.space === 'local'
            ? product(from.rotation, rotation)
            : product(rotation, from.rotation)
      }
      break
    }
    case 'scale': {
      if (!allowScale) {
        throw new Error('Spatial target does not support scale')
      }
      const factors = vector(command.factors)
      if (factors.some((n) => n <= 0)) {
        throw new Error('Spatial scale must be positive')
      }
      pose = {
        ...from,
        scale: factors.map(
          (n, i) => n * (from.scale?.[i] ?? 1)
        ) as unknown as SpatialVector
      }
      break
    }
    case 'set':
      pose = readSpatialPose(command.pose)
      break
    default:
      throw new Error('Unknown spatial edit command')
  }
  pose = readSpatialPose(pose)
  if (!allowScale && !equalScale(from, pose)) {
    throw new Error('Spatial target does not support scale')
  }
  return pose
}

/** Pure derivation from an App-authorized capture. The App owns preview lifetime and Feature routing. */
export function previewSpatialEdit(
  target: SpatialEditTarget,
  command: SpatialEditCommand
): SpatialEditPreview {
  const from = readTarget(target)
  return Object.freeze({
    id: target.id,
    revision: target.revision,
    pose: transformSpatialPose(from, command, target.allowScale)
  })
}

/** Call inside the existing Feature immediately before its finite transaction. No writes occur here. */
export function resolveSpatialEdit(
  preview: SpatialEditPreview,
  current: SpatialEditTarget | null,
  validate: (pose: SpatialPose) => boolean
): SpatialEditResult {
  if (
    !current ||
    preview.id !== current.id ||
    preview.revision !== current.revision
  ) {
    return Object.freeze({ status: 'rejected', reason: 'stale' })
  }
  const from = readTarget(current),
    pose = readSpatialPose(preview.pose)
  if (!current.allowScale && !equalScale(from, pose)) {
    return Object.freeze({ status: 'rejected', reason: 'scale' })
  }
  if (!validate(pose)) {
    return Object.freeze({ status: 'rejected', reason: 'constraint' })
  }
  const sameRotation =
    from.rotation.every((n, i) => n === pose.rotation[i]) ||
    from.rotation.every((n, i) => n === -pose.rotation[i])
  if (
    equalScale(from, pose) &&
    sameRotation &&
    from.position.every((n, i) => n === pose.position[i])
  ) {
    return Object.freeze({ status: 'unchanged' })
  }
  return Object.freeze({ status: 'ready', pose })
}

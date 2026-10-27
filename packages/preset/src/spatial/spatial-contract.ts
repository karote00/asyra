import { readSpatialSurface } from './surface-contract.js'
import type {
  SpatialDescriptor,
  SpatialShape,
  SpatialInstance,
  SpatialQuaternion,
  SpatialVector
} from '@asyra/render-engine'
export type {
  SpatialDescriptor,
  SpatialShape,
  SpatialInstance,
  SpatialVector,
  SpatialQuaternion,
  SpatialSurface
} from '@asyra/render-engine'
export const SPATIAL_PROPERTY = 'spatialV0'

// Weak admission receipts, not caller-identity caches. Only detached, deeply
// frozen products created below enter these sets; caller freezing proves nothing.
const admittedShapes = new WeakSet<object>()
const admittedDescriptors = new WeakSet<object>()

/** Compare accepted geometry values, not caller-owned object identity. */
export function sameSpatialShape(a: SpatialShape, b: SpatialShape): boolean {
  if (a === b && admittedShapes.has(a)) return true
  const equal = (x: readonly number[], y: readonly number[]) => {
    if (x.length !== y.length) return false
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false
    return true
  }
  switch (a.kind) {
    case 'box':
      return b.kind === 'box' && equal(a.size, b.size)
    case 'sphere':
      return b.kind === 'sphere' && a.radius === b.radius
    case 'capsule':
      return (
        b.kind === 'capsule' && a.radius === b.radius && a.length === b.length
      )
    case 'triangles':
      return (
        b.kind === 'triangles' &&
        equal(a.positions, b.positions) &&
        ((!a.uvs && !b.uvs) || (!!a.uvs && !!b.uvs && equal(a.uvs, b.uvs))) &&
        ((!a.colors && !b.colors) ||
          (!!a.colors && !!b.colors && equal(a.colors, b.colors))) &&
        equal(a.indices, b.indices)
      )
  }
}

const finiteTuple = (value: unknown, length: number): value is number[] =>
  Array.isArray(value) &&
  value.length === length &&
  value.every(Number.isFinite)
const positive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export function isSpatialShape(value: unknown): value is SpatialShape {
  if (!record(value)) return false
  if (value.kind === 'box')
    return finiteTuple(value.size, 3) && value.size.every(positive)
  if (value.kind === 'sphere') return positive(value.radius)
  if (value.kind === 'capsule') {
    return (
      positive(value.radius) &&
      typeof value.length === 'number' &&
      Number.isFinite(value.length) &&
      value.length >= 0
    )
  }
  if (value.kind !== 'triangles') return false
  const { positions, indices, colors, uvs } = value
  if (
    !Array.isArray(positions) ||
    positions.length < 9 ||
    positions.length > 3000000 ||
    positions.length % 3 !== 0 ||
    !Array.isArray(indices) ||
    indices.length < 3 ||
    indices.length > 3000000 ||
    indices.length % 3 !== 0 ||
    (colors !== undefined &&
      (!Array.isArray(colors) || colors.length !== positions.length)) ||
    (uvs !== undefined &&
      (!Array.isArray(uvs) || uvs.length !== (positions.length / 3) * 2))
  )
    return false
  // eslint-disable-next-line @typescript-eslint/prefer-for-of -- Profiled numeric admission avoids iterator overhead.
  for (let i = 0; i < positions.length; i++)
    if (!Number.isFinite(positions[i])) return false
  if (Array.isArray(colors))
    // eslint-disable-next-line @typescript-eslint/prefer-for-of -- Profiled numeric admission avoids iterator overhead.
    for (let i = 0; i < colors.length; i++) {
      const n = colors[i]
      if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1)
        return false
    }
  if (Array.isArray(uvs))
    // eslint-disable-next-line @typescript-eslint/prefer-for-of -- Profiled numeric admission avoids iterator overhead.
    for (let i = 0; i < uvs.length; i++)
      if (!Number.isFinite(uvs[i])) return false
  const vertices = positions.length / 3
  // eslint-disable-next-line @typescript-eslint/prefer-for-of -- Profiled numeric admission avoids iterator overhead.
  for (let i = 0; i < indices.length; i++) {
    const index = indices[i]
    if (!Number.isSafeInteger(index) || index < 0 || index >= vertices)
      return false
  }
  return true
}

export function readSpatialShape(value: unknown): SpatialShape {
  if (record(value) && admittedShapes.has(value)) return value as SpatialShape
  // Triangle payloads contain only flat numeric arrays. Capture accessors once,
  // detach those arrays directly, then validate the exact retained snapshot.
  let snapshot: unknown = record(value) ? { ...value } : value
  if (record(snapshot) && snapshot.kind === 'triangles') {
    for (const key of ['positions', 'colors', 'indices', 'uvs']) {
      const source = snapshot[key]
      if (!Array.isArray(source)) continue
      if (source.length > 3000000) throw new Error('Invalid spatial shape')
      const copy = new Array<unknown>(source.length)
      for (let i = 0; i < source.length; i++) copy[i] = source[i]
      snapshot[key] = copy
    }
  } else snapshot = structuredClone(snapshot)
  if (!isSpatialShape(snapshot)) throw new Error('Invalid spatial shape')
  let shape: SpatialShape
  if (snapshot.kind === 'triangles')
    shape = {
      kind: 'triangles',
      positions: Object.freeze(snapshot.positions),
      ...(snapshot.uvs ? { uvs: Object.freeze(snapshot.uvs) } : {}),
      ...(snapshot.colors ? { colors: Object.freeze(snapshot.colors) } : {}),
      indices: Object.freeze(snapshot.indices)
    }
  else if (snapshot.kind === 'box')
    shape = { kind: 'box', size: Object.freeze(snapshot.size) }
  else if (snapshot.kind === 'sphere')
    shape = { kind: 'sphere', radius: snapshot.radius }
  else
    shape = {
      kind: 'capsule',
      radius: snapshot.radius,
      length: snapshot.length
    }
  Object.freeze(shape)
  admittedShapes.add(shape)
  return shape
}

const admittedInstances = new WeakSet<object>()

export function readSpatialInstances(
  value: unknown
): readonly SpatialInstance[] {
  if (Array.isArray(value) && admittedInstances.has(value)) return value
  const snapshot: unknown = structuredClone(value)
  if (
    !Array.isArray(snapshot) ||
    !snapshot.length ||
    snapshot.length > 60000 ||
    !snapshot.every(
      (item) =>
        record(item) &&
        typeof item.id === 'string' &&
        item.id.length > 0 &&
        finiteTuple(item.position, 3) &&
        finiteTuple(item.rotation, 4) &&
        Math.abs(Math.hypot(...item.rotation) - 1) <= 1e-8 &&
        item.yaw === undefined &&
        item.shear === undefined &&
        (item.scale === undefined ||
          (finiteTuple(item.scale, 3) && item.scale.every(positive)))
    )
  )
    throw new Error('Invalid spatial instances')
  const ids = snapshot
    .filter((item) => item.id !== undefined)
    .map((item) => item.id)
  if (new Set(ids).size !== ids.length)
    throw new Error('Duplicate spatial instance identity')
  const instances = Object.freeze(
    snapshot.map((item) =>
      Object.freeze({
        id: item.id as string,
        position: Object.freeze([...item.position]) as SpatialVector,
        rotation: Object.freeze([...item.rotation]) as SpatialQuaternion,
        ...(item.scale === undefined
          ? {}
          : { scale: Object.freeze([...item.scale]) as SpatialVector })
      })
    )
  )
  admittedInstances.add(instances)
  return instances
}

export function readSpatialDescriptor(value: unknown): SpatialDescriptor {
  if (record(value) && admittedDescriptors.has(value))
    return value as SpatialDescriptor
  if (record(value)) {
    const snapshot = { ...value }
    for (const key of ['position', 'target', 'rotation', 'scale']) {
      if (Array.isArray(snapshot[key])) snapshot[key] = [...snapshot[key]]
    }
    if (record(snapshot.distant)) snapshot.distant = { ...snapshot.distant }
    value = snapshot
  }
  if (!record(value) || !finiteTuple(value.position, 3)) {
    throw new Error('Invalid spatial descriptor or position')
  }
  if (value.kind === 'camera') {
    if (
      !finiteTuple(value.target, 3) ||
      !positive(value.fov) ||
      value.fov >= 170 ||
      !positive(value.near) ||
      !positive(value.far) ||
      value.far <= value.near
    ) {
      throw new Error('Invalid perspective camera')
    }
    const direction = value.target.map(
      (v, i) => v - (value.position as number[])[i]
    )
    if (Math.hypot(direction[0], direction[2]) < 1e-10) {
      throw new Error('Camera direction cannot be parallel to the Y-up axis')
    }
  } else if (value.kind === 'mesh') {
    if (
      value.shear !== undefined ||
      value.yaw !== undefined ||
      (value.scale !== undefined &&
        (!finiteTuple(value.scale, 3) || !value.scale.every(positive))) ||
      ['castShadow', 'receiveShadow'].some(
        (key) => value[key] !== undefined && typeof value[key] !== 'boolean'
      )
    )
      throw new Error('Invalid spatial pose or shadow policy')
    if (
      !finiteTuple(value.rotation, 4) ||
      Math.abs(Math.hypot(...value.rotation) - 1) > 1e-8 ||
      !Number.isInteger(value.color) ||
      (value.color as number) < 0 ||
      (value.color as number) > 0xffffff ||
      typeof value.opacity !== 'number' ||
      !Number.isFinite(value.opacity) ||
      value.opacity < 0 ||
      value.opacity > 1 ||
      typeof value.selectable !== 'boolean' ||
      typeof value.wireframe !== 'boolean'
    ) {
      throw new Error('Invalid spatial mesh')
    }
  } else {
    throw new Error('Unsupported spatial descriptor kind')
  }
  if (value.kind === 'mesh') {
    if (
      value.shear !== undefined ||
      value.yaw !== undefined ||
      (value.scale !== undefined &&
        (!finiteTuple(value.scale, 3) || !value.scale.every(positive))) ||
      ['castShadow', 'receiveShadow'].some(
        (key) => value[key] !== undefined && typeof value[key] !== 'boolean'
      )
    )
      throw new Error('Invalid spatial pose or shadow policy')
    if (
      value.surface !== undefined &&
      (!record(value.shape) ||
        !Array.isArray(value.shape.uvs) ||
        (record(value.distant) &&
          (!record(value.distant.shape) ||
            !Array.isArray(value.distant.shape.uvs))))
    )
      throw new Error('Surface textures require UV coordinates')
    if (
      (value.emissive !== undefined &&
        (!Number.isInteger(value.emissive) ||
          (value.emissive as number) < 0 ||
          (value.emissive as number) > 0xffffff)) ||
      (value.emissiveIntensity !== undefined &&
        (typeof value.emissiveIntensity !== 'number' ||
          !Number.isFinite(value.emissiveIntensity) ||
          value.emissiveIntensity < 0))
    )
      throw new Error('Invalid spatial emissive material')
    if (
      value.environmentIntensity !== undefined &&
      (typeof value.environmentIntensity !== 'number' ||
        !Number.isFinite(value.environmentIntensity) ||
        value.environmentIntensity < 0)
    )
      throw new Error('Invalid spatial environment material')
    for (const key of ['roughness', 'metalness']) {
      const n = value[key]
      if (
        n !== undefined &&
        (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1)
      )
        throw new Error('Invalid spatial material')
    }
    if (
      value.distant !== undefined &&
      (!record(value.distant) ||
        !positive(value.distant.maxError) ||
        (value.distant.pixelError !== undefined &&
          !positive(value.distant.pixelError)) ||
        !value.instances)
    )
      throw new Error('Invalid distant representation')
  }
  const position = Object.freeze([...(value.position as number[])])
  const descriptor =
    value.kind === 'camera'
      ? {
          kind: 'camera',
          position,
          target: Object.freeze([...(value.target as number[])]),
          fov: value.fov,
          near: value.near,
          far: value.far
        }
      : {
          kind: 'mesh',
          position,
          rotation: Object.freeze([...(value.rotation as number[])]),
          ...(value.scale === undefined
            ? {}
            : { scale: Object.freeze([...(value.scale as number[])]) }),
          castShadow: value.castShadow ?? false,
          receiveShadow: value.receiveShadow ?? false,
          shape: readSpatialShape(value.shape),
          ...(value.instances === undefined
            ? {}
            : { instances: readSpatialInstances(value.instances) }),
          ...(record(value.distant)
            ? {
                distant: Object.freeze({
                  shape: readSpatialShape(value.distant.shape),
                  maxError: value.distant.maxError,
                  pixelError: value.distant.pixelError ?? 2
                })
              }
            : {}),
          ...(value.surface === undefined
            ? {}
            : { surface: readSpatialSurface(value.surface) }),
          roughness: value.roughness ?? 0.65,
          metalness: value.metalness ?? 0.12,
          environmentIntensity: value.environmentIntensity ?? 0,
          emissive: value.emissive ?? 0,
          emissiveIntensity: value.emissiveIntensity ?? 0,
          color: value.color,
          opacity: value.opacity,
          wireframe: value.wireframe,
          selectable: value.selectable
        }
  Object.freeze(descriptor)
  admittedDescriptors.add(descriptor)
  return descriptor as SpatialDescriptor
}

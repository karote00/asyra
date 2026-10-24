import {
  readSpatialDescriptor as admitDescriptor,
  readSpatialInstances as admitInstances,
  type SpatialDescriptor as NeutralDescriptor,
  type SpatialInstance as NeutralInstance,
  type SpatialVector
} from '@asyra/preset/spatial-contract'
export {
  SPATIAL_PROPERTY,
  readSpatialShape,
  isSpatialShape,
  sameSpatialShape
} from '@asyra/preset/spatial-contract'
export type {
  SpatialVector,
  SpatialQuaternion,
  SpatialShape
} from '@asyra/preset/spatial-contract'

// Domain placements remain yaw-based. The paired projection is produced once at admission.
export interface SpatialInstance {
  readonly position: SpatialVector
  readonly yaw: number
}
export type SpatialDescriptor =
  | Extract<NeutralDescriptor, { kind: 'camera' }>
  | (Omit<
      Extract<NeutralDescriptor, { kind: 'mesh' }>,
      'instances' | 'scale'
    > & {
      instances?: readonly SpatialInstance[]
    })
const placements = new WeakMap<object, readonly NeutralInstance[]>()
const descriptors = new WeakMap<object, NeutralDescriptor>()
export function readSpatialInstances(
  value: unknown
): readonly SpatialInstance[] {
  if (typeof value === 'object' && value !== null && placements.has(value))
    return value as readonly SpatialInstance[]
  const input = structuredClone(value)
  if (!Array.isArray(input)) throw new Error('Invalid placements')
  const counts = new Map<string, number>()
  const neutral = admitInstances(
    input.map((item) => {
      if (
        !item ||
        !Array.isArray(item.position) ||
        !Number.isFinite(item.yaw) ||
        item.scale !== undefined ||
        item.rotation !== undefined
      )
        throw new Error('Invalid yaw placement')
      const key = `${item.position.join(',')}:${item.yaw}`
      const ordinal = counts.get(key) ?? 0
      counts.set(key, ordinal + 1)
      return {
        id: `${key}:${ordinal}`,
        position: item.position,
        rotation: [0, Math.sin(item.yaw / 2), 0, Math.cos(item.yaw / 2)]
      }
    })
  )
  const result = Object.freeze(
    input.map((item, i) =>
      Object.freeze({ position: neutral[i].position, yaw: item.yaw as number })
    )
  )
  placements.set(result, neutral)
  return result
}
export function readSpatialDescriptor(value: unknown): SpatialDescriptor {
  if (typeof value === 'object' && value !== null && descriptors.has(value))
    return value as SpatialDescriptor
  if (!value || typeof value !== 'object')
    throw new Error('Invalid spatial descriptor')
  const input = { ...value } as Record<string, unknown>
  if (input.kind === 'mesh' && input.scale !== undefined)
    throw new Error('Domain projection requires rigid poses')
  const instances =
    input.instances === undefined
      ? undefined
      : readSpatialInstances(input.instances)
  const neutral = admitDescriptor({
    ...input,
    ...(instances ? { instances: placements.get(instances) } : {}),
    ...(input.kind === 'mesh'
      ? {
          castShadow:
            input.selectable === true &&
            input.opacity === 1 &&
            input.wireframe === false,
          receiveShadow: input.wireframe === false
        }
      : {})
  })
  const result: SpatialDescriptor = Object.freeze({
    ...neutral,
    ...(instances ? { instances } : {})
  }) as SpatialDescriptor
  descriptors.set(result, neutral)
  return result
}
export function toSpatialProjection(value: unknown): NeutralDescriptor {
  const accepted = readSpatialDescriptor(value)
  const result = descriptors.get(accepted)
  if (!result) throw new Error('Missing admitted projection')
  return result
}

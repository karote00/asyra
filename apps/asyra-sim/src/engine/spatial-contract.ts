import {
  isSpatialShape as isNeutralShape,
  readSpatialShape as admitShape,
  readSpatialDescriptor as admitDescriptor,
  sameSpatialShape
} from '@asyra/preset/spatial-contract'
export { SPATIAL_PROPERTY } from '@asyra/preset/spatial-contract'
export { sameSpatialShape }

import type {
  SpatialShape as NeutralShape,
  SpatialDescriptor as NeutralDescriptor
} from '@asyra/render-engine'
export type { SpatialVector, SpatialQuaternion } from '@asyra/render-engine'

export type SpatialShape =
  | Exclude<NeutralShape, { kind: 'triangles' }>
  | Pick<
      Extract<NeutralShape, { kind: 'triangles' }>,
      'kind' | 'positions' | 'indices'
    >

export type SpatialDescriptor =
  | Extract<NeutralDescriptor, { kind: 'camera' }>
  | (Pick<
      Extract<NeutralDescriptor, { kind: 'mesh' }>,
      | 'kind'
      | 'position'
      | 'rotation'
      | 'color'
      | 'opacity'
      | 'wireframe'
      | 'selectable'
    > & { shape: SpatialShape })

// These sets recognize the App's whitelist projection, not structural validity.
// Preset owns all numeric admission, detached products and immutable receipts.
const projectedShapes = new WeakSet<object>()
const projectedDescriptors = new WeakSet<object>()
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function shapeInput(value: unknown): unknown {
  if (!record(value)) return value
  if (projectedShapes.has(value)) return value
  const snapshot = { ...value }
  if (snapshot.kind === 'triangles')
    return {
      kind: snapshot.kind,
      positions: snapshot.positions,
      indices: snapshot.indices
    }
  return snapshot
}

export function isSpatialShape(value: unknown): value is SpatialShape {
  return isNeutralShape(shapeInput(value))
}

export function readSpatialShape(value: unknown): SpatialShape {
  const accepted = admitShape(shapeInput(value))
  projectedShapes.add(accepted)
  return accepted
}

export function readSpatialDescriptor(value: unknown): SpatialDescriptor {
  if (record(value) && projectedDescriptors.has(value))
    return admitDescriptor(value) as SpatialDescriptor
  if (!record(value)) return admitDescriptor(value) as SpatialDescriptor
  const snapshot = { ...value }
  const input =
    snapshot.kind === 'mesh'
      ? {
          kind: snapshot.kind,
          position: snapshot.position,
          rotation: snapshot.rotation,
          shape: readSpatialShape(snapshot.shape),
          color: snapshot.color,
          opacity: snapshot.opacity,
          wireframe: snapshot.wireframe,
          selectable: snapshot.selectable
        }
      : snapshot
  const accepted = admitDescriptor(input)
  projectedDescriptors.add(accepted)
  return accepted as SpatialDescriptor
}

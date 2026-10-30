import type {
  SpatialShape,
  SpatialVector,
  SpatialQuaternion
} from '@asyra/render-engine'
import { readSpatialDescriptor } from './spatial-contract.js'
import type { SpatialMesh } from './spatial-layer.js'

export interface SpatialBounds {
  readonly min: SpatialVector
  readonly max: SpatialVector
}
const freeze = (min: number[], max: number[]): SpatialBounds =>
  Object.freeze({
    min: Object.freeze(min) as unknown as SpatialVector,
    max: Object.freeze(max) as unknown as SpatialVector
  })

/** Lifetime-owned local extrema. World poses are recomputed on every query. */
export class SpatialBoundsOwner {
  private local = new WeakMap<SpatialShape, SpatialBounds>()
  private disposed = false

  measure(values: readonly SpatialMesh[]): SpatialBounds | null {
    if (this.disposed) {
      throw new Error('Spatial bounds owner is disposed')
    }
    const descriptors = values.map((value) => {
      const admitted = readSpatialDescriptor(value)
      if (admitted.kind !== 'mesh') {
        throw new Error('Expected a spatial mesh')
      }
      return admitted
    })
    if (!descriptors.length) {
      return null
    }
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity]
    for (const descriptor of descriptors) {
      const bounds = this.localBounds(descriptor.shape)
      const transform = (
        point: SpatialVector,
        position: SpatialVector,
        rotation: SpatialQuaternion,
        scale: SpatialVector = [1, 1, 1]
      ): SpatialVector => {
        const [x, y, z] = point.map((n, i) => n * scale[i]),
          [qx, qy, qz, qw] = rotation
        const tx = 2 * (qy * z - qz * y),
          ty = 2 * (qz * x - qx * z),
          tz = 2 * (qx * y - qy * x)
        return [
          x + qw * tx + qy * tz - qz * ty + position[0],
          y + qw * ty + qz * tx - qx * tz + position[1],
          z + qw * tz + qx * ty - qy * tx + position[2]
        ]
      }
      for (const instance of descriptor.instances ?? [null]) {
        for (const x of [bounds.min[0], bounds.max[0]]) {
          for (const y of [bounds.min[1], bounds.max[1]]) {
            for (const z of [bounds.min[2], bounds.max[2]]) {
              let point: SpatialVector = [x, y, z]
              if (instance) {
                point = transform(
                  point,
                  instance.position,
                  instance.rotation,
                  instance.scale
                )
              }
              point = transform(
                point,
                descriptor.position,
                descriptor.rotation,
                descriptor.scale
              )
              for (let axis = 0; axis < 3; axis++) {
                min[axis] = Math.min(min[axis], point[axis])
                max[axis] = Math.max(max[axis], point[axis])
              }
            }
          }
        }
      }
    }
    if (!min.every(Number.isFinite) || !max.every(Number.isFinite)) {
      throw new Error('Nonfinite spatial bounds')
    }
    return freeze(min, max)
  }

  dispose(): void {
    this.disposed = true
    this.local = new WeakMap()
  }

  private localBounds(shape: SpatialShape): SpatialBounds {
    const existing = this.local.get(shape)
    if (existing) {
      return existing
    }
    let result: SpatialBounds
    if (shape.kind === 'triangles') {
      const min = [Infinity, Infinity, Infinity],
        max = [-Infinity, -Infinity, -Infinity]
      for (let i = 0; i < shape.positions.length; i++) {
        const axis = i % 3
        min[axis] = Math.min(min[axis], shape.positions[i])
        max[axis] = Math.max(max[axis], shape.positions[i])
      }
      result = freeze(min, max)
    } else {
      const half =
        shape.kind === 'box'
          ? shape.size.map((n) => n / 2)
          : [
              shape.radius,
              shape.radius + (shape.kind === 'capsule' ? shape.length / 2 : 0),
              shape.radius
            ]
      result = freeze(
        half.map((n) => -n),
        half
      )
    }
    this.local.set(shape, result)
    return result
  }
}

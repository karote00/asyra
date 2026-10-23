import type { SpatialShape, SpatialVector } from '@asyra/render-engine'
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
    if (this.disposed) throw new Error('Spatial bounds owner is disposed')
    const descriptors = values.map((value) => {
      const admitted = readSpatialDescriptor(value)
      if (admitted.kind !== 'mesh') throw new Error('Expected a spatial mesh')
      return admitted
    })
    if (!descriptors.length) return null
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity]
    for (const descriptor of descriptors) {
      const bounds = this.localBounds(descriptor.shape)
      const [qx, qy, qz, qw] = descriptor.rotation
      const include = (x: number, y: number, z: number) => {
        const tx = 2 * (qy * z - qz * y),
          ty = 2 * (qz * x - qx * z),
          tz = 2 * (qx * y - qy * x)
        const point = [
          x + qw * tx + qy * tz - qz * ty + descriptor.position[0],
          y + qw * ty + qz * tx - qx * tz + descriptor.position[1],
          z + qw * tz + qx * ty - qy * tx + descriptor.position[2]
        ]
        for (let axis = 0; axis < 3; axis++) {
          min[axis] = Math.min(min[axis], point[axis])
          max[axis] = Math.max(max[axis], point[axis])
        }
      }
      const corners = (position: SpatialVector, yaw: number) => {
        const c = Math.cos(yaw),
          s = Math.sin(yaw)
        for (const x of [bounds.min[0], bounds.max[0]])
          for (const y of [bounds.min[1], bounds.max[1]])
            for (const z of [bounds.min[2], bounds.max[2]])
              include(
                c * x + s * z + position[0],
                y + position[1],
                -s * x + c * z + position[2]
              )
      }
      if (descriptor.instances)
        for (const instance of descriptor.instances)
          corners(instance.position, instance.yaw)
      else corners([0, 0, 0], 0)
    }
    if (!min.every(Number.isFinite) || !max.every(Number.isFinite))
      throw new Error('Nonfinite spatial bounds')
    return freeze(min, max)
  }

  dispose(): void {
    this.disposed = true
    this.local = new WeakMap()
  }

  private localBounds(shape: SpatialShape): SpatialBounds {
    const existing = this.local.get(shape)
    if (existing) return existing
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

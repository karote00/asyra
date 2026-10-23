import { expect, it } from 'vitest'
import { Triangle, Vector3 } from 'three'
import { createCropModels } from '../crop-models'

const models = createCropModels({ netTop: 3, netBottom: 0.45 })
it.each(
  models.map((model, index) => [model.species, model.variant, index] as const)
)(
  'bounds distant geometric deviation for %s variant %s',
  (_species, _variant, index) => {
    const model = models[index]
    const point = new Vector3(),
      closest = new Vector3()
    let maximum = 0
    for (const part of model.parts) {
      const distant = part.distantShape
      if (!distant) throw new Error('Missing distant representation')
      const triangles = []
      for (let i = 0; i < distant.indices.length; i += 3) {
        const vertices = distant.indices
          .slice(i, i + 3)
          .map((vertex) =>
            new Vector3().fromArray(distant.positions, vertex * 3)
          )
        const triangle = new Triangle(vertices[0], vertices[1], vertices[2])
        if (triangle.getArea() > 1e-14) triangles.push(triangle)
      }
      for (let i = 0; i < part.shape.positions.length; i += 3) {
        point.fromArray(part.shape.positions, i)
        let minimum = Infinity
        for (const triangle of triangles) {
          triangle.closestPointToPoint(point, closest)
          minimum = Math.min(minimum, point.distanceToSquared(closest))
          if (minimum < 1e-12) break
        }
        maximum = Math.max(maximum, Math.sqrt(minimum))
      }
    }
    expect(maximum).toBeLessThanOrEqual(0.06)
  }
)

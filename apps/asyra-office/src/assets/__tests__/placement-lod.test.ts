import { expect, it } from 'vitest'
import { part, placeParts } from '../catalog'
import { box } from '../geometry'
import { buildSpatialMeshes } from '../../scene/reference-scene'
it('places and scales non-instanced LoD with its master and retains it through material batching', () => {
  const source = {
    ...part('body', box([1, 1, 1], 0.02), 0xffffff),
    distant: { mesh: box([1, 1, 1]), maxError: 0.02 }
  }
  const placed = placeParts([source], [4, 3, 2], 90, [2, 1, 3])
  const distant = placed[0].distant
  expect(distant?.maxError).toBeCloseTo(0.06, 8)
  expect(
    Math.min(...(distant?.mesh.positions.filter((_, i) => i % 3 === 2) ?? []))
  ).toBeCloseTo(0.5, 8)
  const meshes = buildSpatialMeshes(
    { assemblies: [], labels: [], parts: placed },
    {}
  )
  expect(meshes[0].descriptor.distant?.maxError).toBeCloseTo(0.06, 8)
  expect(meshes[0].descriptor.distant?.shape.kind).toBe('triangles')
})

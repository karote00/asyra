import { expect, it } from 'vitest'
import { buildSpatialMeshes } from '../reference-scene'
import { sugarJar } from '../../assets/discussion-tableware'
import { frameNightLight } from '../../assets/frame-night-light'
import { part, type AssetPart } from '../../assets/catalog'
import { box } from '../../assets/geometry'

it('preserves the framed light metal finish through the production renderer descriptor', () => {
  const parts = frameNightLight().filter((p) => p.material === 'metal')
  const meshes = buildSpatialMeshes({ parts, assemblies: [], labels: [] }, {})
  for (const mesh of meshes) {
    expect(mesh.descriptor.metalness).toBe(0.85)
    expect(mesh.descriptor.environmentIntensity).toBe(1)
    expect(mesh.descriptor.roughness).toBeLessThanOrEqual(0.2)
  }
})

it('separates different metal finishes and transports the same finish through instancing', () => {
  const ordinary = part('ordinary', box([1, 1, 1]), 0x79684e, 'metal', 0.2)
  const polished = { ...ordinary, id: 'polished', metalness: 0.85 }
  const instanced: AssetPart = {
    ...polished,
    id: 'instanced',
    instances: [
      {
        id: 'one',
        position: [0, 0, 0],
        basis: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1]
        ],
        scale: 1
      }
    ]
  }
  const meshes = buildSpatialMeshes(
    { parts: [ordinary, polished, instanced], assemblies: [], labels: [] },
    {}
  )
  expect(meshes).toHaveLength(3)
  expect(meshes.filter((m) => m.descriptor.metalness === 0.85)).toHaveLength(2)
  expect(meshes.filter((m) => m.descriptor.metalness === 0.35)).toHaveLength(1)
})

it('does not batch an environment-reflective material together with an ordinary finish', () => {
  const ordinary = part('ordinary', box([1, 1, 1]), 0x79684e, 'metal', 0.2)
  const reflective = { ...ordinary, id: 'reflective', environmentIntensity: 1 }
  const meshes = buildSpatialMeshes(
    { parts: [ordinary, reflective], assemblies: [], labels: [] },
    {}
  )
  expect(meshes).toHaveLength(2)
  expect(meshes.map((m) => m.descriptor.environmentIntensity).sort()).toEqual([
    0, 1
  ])
})

it('renders the sugar teaspoon as opaque reflective silver metal', () => {
  const spoon = sugarJar().find((part) => part.id === 'teaspoon')
  if (!spoon) {
    throw new Error('Missing teaspoon')
  }
  const [mesh] = buildSpatialMeshes(
    { parts: [spoon], assemblies: [], labels: [] },
    {}
  )
  expect(mesh.descriptor.metalness).toBe(1)
  expect(mesh.descriptor.roughness).toBeLessThanOrEqual(0.18)
  expect(mesh.descriptor.environmentIntensity).toBe(1)
  expect(mesh.descriptor.opacity).toBe(1)
  expect(mesh.descriptor.emissiveIntensity).toBe(0)
})

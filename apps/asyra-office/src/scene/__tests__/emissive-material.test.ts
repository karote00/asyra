import { expect, it } from 'vitest'
import { buildSpatialMeshes } from '../reference-scene'
import { pantryNightLight } from '../../assets/pantry-night-light'
import { part, type AssetPart } from '../../assets/catalog'
import { box } from '../../assets/geometry'

it('transports light emission through the production frame builder', () => {
  const meshes = buildSpatialMeshes(
    { parts: pantryNightLight(), assemblies: [], labels: [] },
    {}
  )
  const luminous = meshes.filter(
    (m) => (m.descriptor.emissiveIntensity ?? 0) > 0
  )
  expect(luminous).toHaveLength(1)
  expect(luminous[0].descriptor).toMatchObject({
    emissive: 0xffb35c,
    emissiveIntensity: 1.75
  })
})

it('separates identical albedo with different emission for batched and instanced parts', () => {
  const ordinary = part('ordinary', box([1, 1, 1]), 0xffdba0, 'plain')
  const luminous = {
    ...ordinary,
    id: 'luminous',
    emissive: 0xffb35c,
    emissiveIntensity: 2.5
  } as AssetPart
  const instanced = {
    ...luminous,
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
  } as AssetPart
  const meshes = buildSpatialMeshes(
    { parts: [ordinary, luminous, instanced], assemblies: [], labels: [] },
    {}
  )
  expect(meshes).toHaveLength(3)
  expect(
    meshes.filter((m) => m.descriptor.emissiveIntensity === 2.5)
  ).toHaveLength(2)
  expect(
    meshes.filter((m) => m.descriptor.emissiveIntensity === 0)
  ).toHaveLength(1)
})

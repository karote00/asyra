import { expect, it } from 'vitest'
import { catalogAsset, part } from '../../assets/catalog'
import { box } from '../../assets/geometry'
import { buildSpatialMeshes } from '../reference-scene'

it('retains catalog alpha and keeps two translucent objects independently sortable', () => {
  const bottle = catalogAsset('water-dispenser').find((p) => p.id === 'bottle')
  if (!bottle) {
    throw new Error('Missing bottle')
  }
  const meshes = buildSpatialMeshes(
    {
      parts: [bottle, { ...bottle, id: 'second-bottle' }],
      labels: [],
      assemblies: []
    },
    {}
  )
  expect(meshes).toHaveLength(2)
  for (const mesh of meshes) {
    expect(mesh.descriptor).toMatchObject({ opacity: 0.42, castShadow: false })
  }
})
it('preserves opaque batching while keeping different alpha values separate', () => {
  const opaque = part('opaque', box([0.1, 0.1, 0.1]), 0xabcdef)
  const translucent = { ...opaque, id: 'transparent', opacity: 0.5 }
  const meshes = buildSpatialMeshes(
    { parts: [opaque, opaque, translucent], labels: [], assemblies: [] },
    {}
  )
  expect(meshes).toHaveLength(2)
  expect(
    meshes
      .map((m) =>
        m.descriptor.kind === 'mesh' ? m.descriptor.opacity : undefined
      )
      .sort()
  ).toEqual([0.5, 1])
})

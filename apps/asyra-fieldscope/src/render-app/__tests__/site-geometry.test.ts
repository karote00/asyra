import { expect, it, vi } from 'vitest'
import * as crops from '../../domain/crop-models'
import {
  DEFAULT_CONFIGURATION,
  type FarmConfiguration
} from '../../domain/farm-configuration'
import { SiteGeometry } from '../site-geometry'
import { buildSiteMeshes } from '../site-projection'
import { TriangleBuilder } from '../../domain/mesh'

it('bounds admitted primitive retention and rebuilds evicted entries', () => {
  const owner = new SiteGeometry()
  const produce = vi.fn(() => {
    const builder = new TriangleBuilder()
    builder.box([0, 0, 0], [1, 1, 1])
    return { shape: builder.shape(), regions: builder.regions() }
  })
  const first = owner.primitive('tube:0', produce)
  expect(owner.primitive('tube:0', produce)).toBe(first)
  expect(produce).toHaveBeenCalledTimes(1)
  for (let i = 1; i <= 32; i++) owner.primitive(`tube:${i}`, produce)
  expect(owner.primitive('tube:0', produce) === first).toBe(false)
  expect(produce).toHaveBeenCalledTimes(34)
  owner.clear()
  owner.primitive('tube:0', produce)
  expect(produce).toHaveBeenCalledTimes(35)
})

it('prepares an empty planted population without manufacturing cultivar geometry', () => {
  const generation = vi.spyOn(crops, 'createCropModels')
  try {
    const owner = new SiteGeometry()
    const config: FarmConfiguration = {
      ...DEFAULT_CONFIGURATION,
      length: 2.2,
      strips: [{ id: 'drain-only', kind: 'drain', width: 0.3 }]
    }
    const scene = owner.prepareScene(config, buildSiteMeshes(config, owner))
    expect(scene.fruits).toEqual([])
    expect(scene.plants).toEqual([])
    expect(scene.meshes.some((mesh) => mesh.layer === 'steel')).toBe(true)
    expect(generation).not.toHaveBeenCalled()
  } finally {
    generation.mockRestore()
  }
})

import { expect, it, vi } from 'vitest'
import * as crops from '../../domain/crop-models'
import { DEFAULT_CONFIGURATION } from '../../domain/farm-configuration'
import { SiteGeometry } from '../site-geometry'
import { buildCultivationMeshes } from '../cultivation-projection'
import {
  createSupportAssembly,
  springClipWire
} from '../../domain/planting-supports'
import { createPlantingNet } from '../../domain/planting-net'
import { TriangleBuilder } from '../../domain/mesh'
import { sameSpatialShape } from '../../engine/spatial-contract'

it('retains admitted cultivar shapes only for matching net dimensions and clears them on retirement', () => {
  const build = vi.spyOn(crops, 'createCropModels')
  try {
    const owner = new SiteGeometry()
    const first = owner.cropModels(DEFAULT_CONFIGURATION)
    expect(owner.cropModels({ ...DEFAULT_CONFIGURATION })).toBe(first)
    const changed = owner.cropModels({ netTop: 2.8, netBottom: 0.45 })
    expect(changed[0].parts[0].shape === first[0].parts[0].shape).toBe(false)
    expect(owner.cropModels(DEFAULT_CONFIGURATION)).toBe(first)
    expect(build).toHaveBeenCalledTimes(2)
    owner.cropModels({ netTop: 2.8, netBottom: 0.6 })
    expect(build).toHaveBeenCalledTimes(3)
    const replacement = owner.cropModels(DEFAULT_CONFIGURATION)
    expect(build).toHaveBeenCalledTimes(4)
    for (let i = 0; i < first.length; i++)
      for (let j = 0; j < first[i].parts.length; j++) {
        expect(
          sameSpatialShape(
            first[i].parts[j].shape,
            replacement[i].parts[j].shape
          )
        ).toBe(true)
        expect(
          sameSpatialShape(
            first[i].parts[j].distantShape,
            replacement[i].parts[j].distantShape
          )
        ).toBe(true)
      }
    owner.clear()
    owner.cropModels(DEFAULT_CONFIGURATION)
    expect(build).toHaveBeenCalledTimes(5)
  } finally {
    build.mockRestore()
  }
})

it('projects shared hardware vertices back to the canonical installed geometry and invalidates changed dimensions', () => {
  const config = { ...DEFAULT_CONFIGURATION, length: 2.2 }
  const assembly = createSupportAssembly(config)
  const net = createPlantingNet(assembly, config)
  const owner = new SiteGeometry()
  const meshes = buildCultivationMeshes(config, owner)
  const membersByLayer = {
    supports: [...assembly.tubes, ...assembly.rails],
    net: net.strands,
    clips: assembly.clips.map(springClipWire)
  }
  for (const layer of ['supports', 'net', 'clips'] as const) {
    const members = membersByLayer[layer]
    const origins =
      layer === 'clips'
        ? assembly.clips.map((clip) => clip.origin)
        : members.map((member) => member.points[0])
    const expected = new Map<string, TriangleBuilder[]>()
    origins.forEach((origin, i) => {
      const key = JSON.stringify(origin)
      const builder = new TriangleBuilder()
      builder.tube(members[i])
      expected.set(key, [...(expected.get(key) ?? []), builder])
    })
    let count = 0
    for (const mesh of meshes.filter((item) => item.layer === layer)) {
      const shape = mesh.descriptor.shape
      if (shape.kind !== 'triangles' || !mesh.descriptor.instances)
        throw new Error('Expected shared hardware')
      for (const instance of mesh.descriptor.instances) {
        const candidates = expected.get(JSON.stringify(instance.position)) ?? []
        const builder = candidates.find((candidate) =>
          [0, 1, 2].every(
            (k) =>
              Math.abs(
                candidate.positions[k] -
                  shape.positions[k] -
                  instance.position[k]
              ) < 1e-10
          )
        )
        if (!builder) throw new Error('Missing canonical member')
        expect(shape.positions.length).toBe(builder.positions.length)
        for (let i = 0; i < shape.positions.length; i++)
          expect(shape.positions[i] + instance.position[i % 3]).toBeCloseTo(
            builder.positions[i],
            10
          )
        count++
      }
    }
    expect(count).toBe(members.length)
  }
  expect(
    meshes
      .filter((mesh) => mesh.layer === 'ties')
      .flatMap((mesh) => mesh.descriptor.instances ?? [])
      .map((item) => item.position)
  ).toEqual(net.ties.map((tie) => tie.center))
  const changed = { ...config, netTop: 2.8, length: 3.2 }
  const retained = buildCultivationMeshes(changed, owner)
  const fresh = buildCultivationMeshes(changed, new SiteGeometry())
  expect(retained.length).toBe(fresh.length)
  retained.forEach((mesh, i) => {
    expect(
      sameSpatialShape(mesh.descriptor.shape, fresh[i].descriptor.shape)
    ).toBe(true)
    expect(mesh.descriptor.instances).toEqual(fresh[i].descriptor.instances)
  })
  owner.clear()
  const rebuilt = buildCultivationMeshes(changed, owner)
  expect(rebuilt[0].descriptor.shape === retained[0].descriptor.shape).toBe(
    false
  )
})

it('bounds admitted primitive retention and rebuilds evicted entries', () => {
  const owner = new SiteGeometry()
  const produce = vi.fn(() => ({
    kind: 'box' as const,
    size: [1, 1, 1] as const
  }))
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

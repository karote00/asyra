import * as planting from '../../domain/crop-layout'
import { buildSiteMeshes } from '../site-projection'
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

it('reuses independent projection owners and matches a fresh scene after every configuration dependency changes', () => {
  const owner = new SiteGeometry()
  const config = { ...DEFAULT_CONFIGURATION, length: 2.2 }
  const initial = buildSiteMeshes(config, owner)
  const extension = buildSiteMeshes({ ...config, topExtension: 0.2 }, owner)
  for (const mesh of initial.filter(
    (item) => !['supports', 'net', 'ties', 'clips'].includes(item.layer)
  ))
    expect(
      extension.find((item) => item.id === mesh.id)?.descriptor ===
        mesh.descriptor
    ).toBe(true)
  const changes = [
    { length: 3.2 },
    { width: 7.4 },
    { height: 5.2 },
    { eaveHeight: 3.2 },
    { soilInset: 0.2 },
    { startInset: 0.3 },
    { endInset: 0.3 },
    { netTop: 2.8 },
    { netBottom: 0.6 },
    {
      strips: config.strips.map((strip, i) =>
        i === 1 ? { ...strip, width: 0.35 } : strip
      )
    },
    { strips: [{ kind: 'soil' as const, width: 6.3 }] }
  ]
  for (const change of changes) {
    const next = { ...config, ...change }
    const retained = buildSiteMeshes(next, owner)
    const fresh = buildSiteMeshes(next)
    expect(retained.map((mesh) => mesh.id)).toEqual(
      fresh.map((mesh) => mesh.id)
    )
    retained.forEach((mesh, i) => {
      expect(
        sameSpatialShape(mesh.descriptor.shape, fresh[i].descriptor.shape)
      ).toBe(true)
      expect(mesh.descriptor.instances).toEqual(fresh[i].descriptor.instances)
      expect(mesh.descriptor.position).toEqual(fresh[i].descriptor.position)
      expect(mesh.descriptor.color).toBe(fresh[i].descriptor.color)
    })
  }
  const beforeClear = buildSiteMeshes(config, owner)
  owner.clear()
  const afterClear = buildSiteMeshes(config, owner)
  expect(
    afterClear.find((mesh) => mesh.id === 'steel')?.descriptor ===
      beforeClear.find((mesh) => mesh.id === 'steel')?.descriptor
  ).toBe(false)
})

it('keeps cultivar assignments and admitted instance arrays when only the net height changes', () => {
  const build = vi.spyOn(planting, 'createCropPositions')
  try {
    const owner = new SiteGeometry()
    const config = { ...DEFAULT_CONFIGURATION, length: 2.2 }
    const first = buildSiteMeshes(config, owner)
    const next = buildSiteMeshes({ ...config, netTop: 2.8 }, owner)
    expect(build).toHaveBeenCalledTimes(1)
    for (const mesh of first.filter((item) =>
      ['cucumbers', 'tomatoes'].includes(item.layer)
    ))
      expect(
        next.find((item) => item.id === mesh.id)?.descriptor.instances ===
          mesh.descriptor.instances
      ).toBe(true)
    buildSiteMeshes({ ...config, startInset: 0.3 }, owner)
    expect(build).toHaveBeenCalledTimes(2)
    owner.clear()
    buildSiteMeshes(config, owner)
    expect(build).toHaveBeenCalledTimes(3)
  } finally {
    build.mockRestore()
  }
})

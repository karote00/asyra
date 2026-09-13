import * as planting from '../../domain/crop-layout'
import { buildSiteMeshes } from '../site-projection'
import { expect, it, vi } from 'vitest'
import * as crops from '../../domain/crop-models'
import {
  DEFAULT_CONFIGURATION,
  type FarmConfiguration
} from '../../domain/farm-configuration'
import { SiteGeometry } from '../site-geometry'
import { buildCultivationMeshes } from '../cultivation-projection'
import {
  createSupportAssembly,
  springClipWire
} from '../../domain/planting-supports'
import { createPlantingNet } from '../../domain/planting-net'
import { TriangleBuilder } from '../../domain/mesh'
import { sameSpatialShape } from '../../engine/spatial-contract'

it('carries complete source material regions with every original near scene mesh', () => {
  const owner = new SiteGeometry()
  const config = { ...DEFAULT_CONFIGURATION, length: 2.2 }
  const meshes = buildSiteMeshes(config, owner)
  const scene = owner.prepareScene(config, meshes)
  for (const mesh of scene.meshes) {
    expect(mesh.regions).toBeDefined()
    expect(Object.isFrozen(mesh.regions)).toBe(true)
    const shape = mesh.descriptor.shape
    if (shape.kind !== 'triangles')
      throw new Error('Expected original triangles')
    expect(
      mesh.regions.reduce((sum, region) => sum + region.indexCount, 0)
    ).toBe(shape.indices.length)
    if (mesh.layer === 'film')
      expect(mesh.regions.every((region) => region.kind === 'sheet')).toBe(true)
  }
  expect(owner.prepareScene(config, meshes) === scene).toBe(true)
})

it('detaches direct scene region input and rejects incomplete replacement before publishing', () => {
  const owner = new SiteGeometry()
  const config = {
    ...DEFAULT_CONFIGURATION,
    strips: [{ id: 'soil', kind: 'soil' as const, width: 6.3 }]
  }
  const original = buildSiteMeshes(config, owner)
  const regions = original[0].regions.map((region) => ({ ...region }))
  const meshes = original.map((mesh, index) =>
    index ? mesh : { ...mesh, regions }
  )
  const first = owner.prepareScene(config, meshes)
  regions[0].kind = 'sheet'
  expect(first.meshes[0].regions[0].kind).toBe('closed-solid')
  const invalid = original.map((mesh, index) =>
    index ? mesh : { ...mesh, regions: [] }
  )
  expect(() => owner.prepareScene(config, invalid)).toThrow()
  expect(owner.getScene() === first).toBe(true)
})

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

it('preserves independent descriptors across pole extension and retires projections on clear', () => {
  const owner = new SiteGeometry()
  const config = { ...DEFAULT_CONFIGURATION, length: 2.2 }
  try {
    const initial = buildSiteMeshes(config, owner)
    const extension = buildSiteMeshes({ ...config, topExtension: 0.2 }, owner)
    for (const mesh of initial.filter(
      (item) => !['supports', 'net', 'ties', 'clips'].includes(item.layer)
    ))
      expect(
        extension.find((item) => item.id === mesh.id)?.descriptor ===
          mesh.descriptor
      ).toBe(true)
    const beforeClear = buildSiteMeshes(config, owner)
    owner.clear()
    const afterClear = buildSiteMeshes(config, owner)
    expect(
      afterClear.find((mesh) => mesh.id === 'steel')?.descriptor ===
        beforeClear.find((mesh) => mesh.id === 'steel')?.descriptor
    ).toBe(false)
  } finally {
    owner.clear()
  }
})

const projectionChanges: { name: string; patch: Partial<FarmConfiguration> }[] =
  [
    { name: 'length', patch: { length: 3.2 } },
    { name: 'width', patch: { width: 7.4 } },
    { name: 'height', patch: { height: 5.2 } },
    { name: 'crossbeam', patch: { eaveHeight: 3.2 } },
    { name: 'soil inset', patch: { soilInset: 0.2 } },
    { name: 'front inset', patch: { startInset: 0.3 } },
    { name: 'rear inset', patch: { endInset: 0.3 } },
    { name: 'net top', patch: { netTop: 2.8 } },
    { name: 'net bottom', patch: { netBottom: 0.6 } },
    {
      name: 'drain width',
      patch: {
        strips: DEFAULT_CONFIGURATION.strips.map((strip, i) =>
          i === 1 ? { ...strip, width: 0.35 } : strip
        )
      }
    },
    {
      name: 'empty planting rows',
      patch: { strips: [{ id: 'fixture-1', kind: 'soil', width: 6.3 }] }
    }
  ]

it.each(
  projectionChanges.map((change, index) => ({
    ...change,
    previous: projectionChanges[index - 1]?.patch ?? { topExtension: 0.2 }
  }))
)(
  'matches a fresh scene after $name changes and the preceding dependency resets',
  ({ patch, previous }) => {
    const owner = new SiteGeometry()
    const config = { ...DEFAULT_CONFIGURATION, length: 2.2 }
    try {
      buildSiteMeshes(config, owner)
      buildSiteMeshes({ ...config, ...previous }, owner)
      const next = { ...config, ...patch }
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
    } finally {
      owner.clear()
    }
  }
)

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

it('prepares one immutable canonical scene handoff with distinct installed fruit identities', () => {
  const generation = vi.spyOn(crops, 'createCropModels')
  const placement = vi.spyOn(planting, 'createCropPositions')
  const owner = new SiteGeometry()
  const config = { ...DEFAULT_CONFIGURATION, length: 2.2 }
  try {
    const meshes = buildSiteMeshes(config, owner)
    const scene = owner.prepareScene(config, meshes)
    expect(owner.prepareScene(config, meshes)).toBe(scene)
    expect(generation).toHaveBeenCalledTimes(1)
    expect(placement).toHaveBeenCalledTimes(1)
    expect(new Set(scene.fruits.map((fruit) => fruit.id)).size).toBe(
      scene.fruits.length
    )
    expect(scene.fruits.length).toBeGreaterThan(scene.plants.length)
    expect(scene.meshes.map((mesh) => mesh.id)).toEqual(
      meshes.map((mesh) => mesh.id)
    )
    expect(scene.meshes.some((mesh) => mesh.layer === 'net')).toBe(true)
    const rotated = scene.fruits.find((fruit) => fruit.plant.yaw === Math.PI)
    if (!rotated) throw new Error('Missing rotated source fruit')
    expect(rotated.position[0]).toBeCloseTo(
      rotated.plant.position[0] - rotated.source.center[0]
    )
    expect(rotated.position[2]).toBeCloseTo(
      rotated.plant.position[2] - rotated.source.center[2]
    )
    expect(Object.isFrozen(scene)).toBe(true)
    expect(Object.isFrozen(scene.fruits)).toBe(true)
    expect(Object.isFrozen(rotated.source)).toBe(true)
    expect(Object.isFrozen(rotated.model.parts[0].partitions)).toBe(true)
    const source = rotated.model.parts[0].shape
    expect(meshes.some((mesh) => mesh.descriptor.shape === source)).toBe(true)
    for (let i = 0; i < 10; i++) expect(owner.getScene()).toBe(scene)
    expect(generation).toHaveBeenCalledTimes(1)
    expect(placement).toHaveBeenCalledTimes(1)
    const next = { ...config, netTop: 2.8 }
    const changed = owner.prepareScene(next, buildSiteMeshes(next, owner))
    expect(changed.revision).not.toBe(scene.revision)
    expect(owner.isCurrentScene(scene)).toBe(false)
    expect(owner.isCurrentScene(changed)).toBe(true)
    expect(generation).toHaveBeenCalledTimes(2)
    expect(placement).toHaveBeenCalledTimes(1)
    owner.clear()
    expect(owner.isCurrentScene(changed)).toBe(false)
    expect(() => owner.getScene()).toThrow()
  } finally {
    generation.mockRestore()
    placement.mockRestore()
  }
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

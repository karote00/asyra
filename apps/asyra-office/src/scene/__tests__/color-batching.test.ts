import { expect, it } from 'vitest'
import { buildSpatialMeshes } from '../reference-scene'
import { part, type AssetPart } from '../../assets/catalog'
import { box, toSpatial } from '../../assets/geometry'

const compose = (parts: AssetPart[]) =>
  buildSpatialMeshes({ parts, assemblies: [], labels: [] }, {})

it('batches static opaque colors without changing topology, UVs or linear-light albedo', () => {
  const black = part('black', box([1, 2, 3]), 0x000000, 'plain')
  const gray = part('gray', box([2, 1, 3]), 0x808080, 'plain')
  const meshes = compose([black, gray])
  expect(meshes).toHaveLength(1)
  const descriptor = meshes[0].descriptor
  expect(descriptor.color).toBe(0xffffff)
  const shape = descriptor.shape
  const a = toSpatial(black.mesh),
    b = toSpatial(gray.mesh)
  if (
    shape.kind !== 'triangles' ||
    a.kind !== 'triangles' ||
    b.kind !== 'triangles'
  )
    throw new Error('Expected triangles')
  expect(shape.positions).toEqual([...a.positions, ...b.positions])
  expect(shape.uvs).toEqual([...(a.uvs ?? []), ...(b.uvs ?? [])])
  expect(shape.indices).toEqual([
    ...a.indices,
    ...b.indices.map((i) => i + a.positions.length / 3)
  ])
  expect(shape.colors?.slice(0, a.positions.length)).toEqual(
    a.positions.map(() => 0)
  )
  expect(shape.colors?.length).toBe(shape.positions.length)
  for (const channel of shape.colors?.slice(a.positions.length) ?? [])
    expect(channel).toBeCloseTo(0.21586050011389926, 7)
})

it('leaves single-color batches unchanged without an unnecessary color buffer', () => {
  const p = part('one', box([1, 1, 1]), 0x808080, 'plain')
  const [mesh] = compose([p, p])
  expect(mesh.descriptor.color).toBe(0x808080)
  expect(mesh.descriptor.shape).not.toHaveProperty('colors')
})

it('retains material, transparency, shadow and LoD boundaries', () => {
  const p = part('one', box([1, 1, 1]), 0x123456, 'plain')
  const alternatives: AssetPart[] = [
    { ...p, color: 0xabcdef, roughness: p.roughness + 0.1 },
    { ...p, color: 0xabcdef, opacity: 0.5 },
    { ...p, color: 0xabcdef, material: 'water' },
    { ...p, color: 0xabcdef, emissive: 0xff0000, emissiveIntensity: 1 },
    { ...p, color: 0xabcdef, metalness: 0.8 },
    { ...p, color: 0xabcdef, environmentIntensity: 1 },
    { ...p, color: 0xabcdef, distant: { mesh: box([1, 1, 1]), maxError: 0.01 } }
  ]
  for (const other of alternatives) {
    const meshes = compose([p, other])
    expect(meshes).toHaveLength(2)
    expect(meshes[1].descriptor).toEqual(compose([other])[0].descriptor)
  }
})

it('does not couple independently hidden, selectable, instanced or transformed entries', async () => {
  const { batchStaticColors } = await import('../color-batching')
  const [a] = compose([part('a', box([1, 1, 1]), 0x123456, 'plain')])
  const [b] = compose([part('b', box([1, 1, 1]), 0xabcdef, 'plain')])
  const variants = [
    { ...b, visible: false },
    { ...b, descriptor: { ...b.descriptor, selectable: true } },
    { ...b, descriptor: { ...b.descriptor, position: [1, 0, 0] as const } },
    {
      ...b,
      descriptor: {
        ...b.descriptor,
        instances: [
          {
            id: 'instance',
            position: [0, 0, 0] as const,
            rotation: [0, 0, 0, 1] as const
          }
        ]
      }
    }
  ]
  for (const variant of variants) {
    const result = batchStaticColors([a, variant])
    expect(result).toEqual([a, variant])
    expect(result[1]).toBe(variant)
  }
})

it('preserves texture identity and every UV while batching colors on one surface', async () => {
  const { batchStaticColors } = await import('../color-batching')
  const [a] = compose([part('a', box([1, 1, 1]), 0x123456, 'plain')])
  const [b] = compose([part('b', box([1, 1, 1]), 0xabcdef, 'plain')])
  const surface = {
    width: 1,
    height: 1,
    albedo: [255, 255, 255, 255],
    normals: [128, 128, 255, 255]
  }
  const texturedA = { ...a, descriptor: { ...a.descriptor, surface } }
  const texturedB = { ...b, descriptor: { ...b.descriptor, surface } }
  const [merged] = batchStaticColors([texturedA, texturedB])
  expect(merged.descriptor.surface).toBe(surface)
  const shape = merged.descriptor.shape
  if (
    shape.kind !== 'triangles' ||
    a.descriptor.shape.kind !== 'triangles' ||
    b.descriptor.shape.kind !== 'triangles'
  )
    throw new Error('Expected triangles')
  expect(shape.uvs).toEqual([
    ...(a.descriptor.shape.uvs ?? []),
    ...(b.descriptor.shape.uvs ?? [])
  ])
  expect(
    batchStaticColors([
      texturedA,
      {
        ...texturedB,
        descriptor: { ...texturedB.descriptor, surface: { ...surface } }
      }
    ])
  ).toHaveLength(2)
})

it('keeps transmissive media independent and forwards physical optical properties', () => {
  const a = part('optical-a', box([1, 1, 1]), 0xffffff)
  a.optics = {
    transmission: 1,
    ior: 1.33,
    thickness: 0.06,
    attenuationColor: 0xab5511,
    attenuationDistance: 0.08
  }
  const b = { ...a, id: 'optical-b' }
  const meshes = compose([a, b])
  expect(meshes).toHaveLength(2)
  expect(meshes[0].descriptor.optics).toEqual(a.optics)
  expect(meshes[1].descriptor.optics).toEqual(b.optics)
})

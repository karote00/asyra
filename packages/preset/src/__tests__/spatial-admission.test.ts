// @vitest-environment node
import { expect, it, vi } from 'vitest'
import {
  readSpatialDescriptor,
  readSpatialSurface,
  type SpatialDescriptor
} from '../spatial-contract.js'

const input = (): SpatialDescriptor => ({
  kind: 'mesh',
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  shape: {
    kind: 'triangles',
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2]
  },
  color: 0xffffff,
  opacity: 1,
  wireframe: false,
  selectable: true
})
it('admits isolated immutable geometry once and reuses it through pose and appearance updates', () => {
  const source = input()
  const accepted = readSpatialDescriptor(source)
  if (accepted.kind !== 'mesh' || accepted.shape.kind !== 'triangles')
    throw new Error('Expected triangles')
  const before = structuredClone(accepted)
  expect(Object.isFrozen(accepted)).toBe(true)
  expect(Object.isFrozen(accepted.shape.positions)).toBe(true)
  for (let i = 0; i < 60; i++) {
    const next = readSpatialDescriptor({
      ...accepted,
      position: [i, 0, 0],
      color: i
    })
    expect(next.kind === 'mesh' && next.shape).toBe(accepted.shape)
    expect(next.position).toEqual([i, 0, 0])
  }
  expect(readSpatialDescriptor(accepted)).toBe(accepted)
  expect(accepted).toEqual(before)
  if (source.kind === 'mesh' && source.shape.kind === 'triangles')
    (source.shape.positions as number[])[0] = 999
  expect(accepted.shape.positions[0]).toBe(0)
})
it('does not trust caller freezing and still rejects invalid geometry and changed poses', () => {
  const source = input()
  expect(() =>
    readSpatialDescriptor(
      Object.freeze({
        ...source,
        shape: Object.freeze({
          kind: 'triangles',
          positions: [NaN, 0, 0],
          indices: [0, 1, 2]
        })
      })
    )
  ).toThrow()
  const accepted = readSpatialDescriptor(source)
  expect(() =>
    readSpatialDescriptor({ ...accepted, position: [NaN, 0, 0] })
  ).toThrow()
  expect(() => readSpatialDescriptor({ ...accepted, opacity: 2 })).toThrow()
})

it('validates the detached values it will retain rather than earlier accessor reads', () => {
  let reads = 0
  const shape = {
    kind: 'triangles',
    indices: [0, 1, 2],
    get positions() {
      return ++reads === 1
        ? [0, 0, 0, 1, 0, 0, 0, 1, 0]
        : [NaN, 0, 0, 1, 0, 0, 0, 1, 0]
    }
  }
  const accepted = readSpatialDescriptor({ ...input(), shape })
  expect(
    accepted.kind === 'mesh' &&
      accepted.shape.kind === 'triangles' &&
      accepted.shape.positions.every(Number.isFinite)
  ).toBe(true)
  expect(reads).toBe(1)
})

it('detaches instance transforms and reuses accepted transforms across presentation changes', () => {
  const instances = [
    {
      position: [1, 0, 2],
      rotation: [0, Math.sin(Math.PI / 2), 0, Math.cos(Math.PI / 2)],
      id: 'instance-1'
    }
  ]
  const accepted = readSpatialDescriptor({ ...input(), instances })
  if (accepted.kind !== 'mesh') throw new Error('Expected mesh')
  instances[0].position[0] = 99
  expect(accepted.instances?.[0].position).toEqual([1, 0, 2])
  expect(Object.isFrozen(accepted.instances?.[0].position)).toBe(true)
  const next = readSpatialDescriptor({ ...accepted, color: 0 })
  expect(next.kind === 'mesh' && next.instances).toBe(accepted.instances)
  for (const invalid of [
    [],
    [
      {
        position: [NaN, 0, 0],
        rotation: [0, Math.sin(0 / 2), 0, Math.cos(0 / 2)],
        id: 'instance-2'
      }
    ],
    [
      {
        position: [0, 0, 0],
        rotation: [0, Math.sin(Infinity / 2), 0, Math.cos(Infinity / 2)],
        id: 'instance-3'
      }
    ]
  ])
    expect(() =>
      readSpatialDescriptor({ ...input(), instances: invalid })
    ).toThrow()
})

it('validates and detaches per-vertex surface colors', () => {
  const source = input()
  if (source.kind !== 'mesh' || source.shape.kind !== 'triangles')
    throw new Error('Expected triangles')
  const colors = [0.2, 0.1, 0.05, 0.3, 0.1, 0.04, 0.4, 0.2, 0.03]
  const accepted = readSpatialDescriptor({
    ...source,
    shape: { ...source.shape, colors }
  })
  colors[0] = 99
  expect(
    accepted.kind === 'mesh' &&
      accepted.shape.kind === 'triangles' &&
      accepted.shape.colors?.[0]
  ).toBe(0.2)
  for (const invalid of [[1, 0, 0], colors, Array(9).fill(NaN)])
    expect(() =>
      readSpatialDescriptor({
        ...source,
        shape: { ...source.shape, colors: invalid }
      })
    ).toThrow()
})

it('admits flat triangle buffers without general object-graph cloning', () => {
  const clone = vi.spyOn(globalThis, 'structuredClone')
  try {
    const accepted = readSpatialDescriptor(input())
    expect(accepted.kind).toBe('mesh')
    expect(clone).not.toHaveBeenCalled()
  } finally {
    clone.mockRestore()
  }
})

vi.mock('three', () => {
  throw new Error('Pure admission must not load the SDK')
})

it('reuses admitted geometry without reading caller buffers again', () => {
  let reads = 0
  const positions = [0, 0, 0, 1, 0, 0, 0, 1, 0]
  Object.defineProperty(positions, 0, {
    get: () => {
      reads++
      return 0
    }
  })
  const accepted = readSpatialDescriptor({
    ...input(),
    shape: { kind: 'triangles', positions, indices: [0, 1, 2] }
  })
  expect(reads).toBe(1)
  for (let i = 0; i < 60; i++) {
    const next = readSpatialDescriptor({ ...accepted, position: [i, 0, 0] })
    expect(next.kind === 'mesh' && next.shape).toBe(
      accepted.kind === 'mesh' && accepted.shape
    )
  }
  expect(reads).toBe(1)
})

it('isolates surface bytes and validates caller-frozen input before issuing receipts', () => {
  const source = {
    width: 2,
    height: 2,
    albedo: Array(16).fill(200),
    normals: Array(16).fill(128)
  }
  const accepted = readSpatialSurface(source)
  source.albedo[0] = 0
  expect(accepted.albedo[0]).toBe(200)
  expect(Object.isFrozen(accepted.albedo)).toBe(true)
  expect(readSpatialSurface(accepted)).toBe(accepted)
  for (const invalid of [
    { ...source, width: 513 },
    { ...source, albedo: [2] },
    { ...source, normals: Array(16).fill(NaN) }
  ])
    expect(() => readSpatialSurface(Object.freeze(invalid))).toThrow()
})

vi.mock('@asyra/core', () => {
  throw new Error('Pure admission must not load Core')
})
vi.mock('@asyra/render', () => {
  throw new Error('Pure admission must not load Render')
})

it('preserves required stable instance identities and rejects duplicates atomically', async () => {
  const { readSpatialInstances } = await import('../spatial-contract.js')
  const input = [
    {
      id: 'a',
      position: [0, 0, 0],
      rotation: [0, Math.sin(0 / 2), 0, Math.cos(0 / 2)]
    },
    {
      id: 'b',
      position: [2, 0, 0],
      rotation: [0, Math.sin(0 / 2), 0, Math.cos(0 / 2)]
    }
  ]
  const result = readSpatialInstances(input)
  expect(result[0]).toMatchObject({ id: 'a' })
  expect(() => readSpatialInstances([input[0], input[0]])).toThrow()
  expect(() => readSpatialInstances([{ ...input[0], id: '' }])).toThrow()
  for (const invalid of [
    { ...input[0], id: undefined },
    { ...input[0], rotation: [0, 0, 0, 0] },
    { ...input[0], scale: [0, 1, 1] },
    { ...input[0], yaw: 0 }
  ])
    expect(() => readSpatialInstances([invalid])).toThrow()
  input[0].id = 'mutated'
  expect(result[0]).toMatchObject({ id: 'a' })
})

it('admits complete mesh poses and independent shadow policy while rejecting invalid transforms', () => {
  const accepted = readSpatialDescriptor({
    ...input(),
    scale: [2, 3, 4],
    castShadow: true,
    receiveShadow: false
  })
  expect(accepted).toMatchObject({
    scale: [2, 3, 4],
    castShadow: true,
    receiveShadow: false
  })
  for (const scale of [
    [0, 1, 1],
    [-1, 1, 1],
    [Infinity, 1, 1]
  ])
    expect(() => readSpatialDescriptor({ ...input(), scale })).toThrow()
  expect(() =>
    readSpatialDescriptor({ ...input(), shear: [1, 0, 0] })
  ).toThrow()
})

it('admits explicit emission and defaults ordinary material emission to zero', () => {
  const luminous = readSpatialDescriptor({
    ...input(),
    emissive: 0xffdba0,
    emissiveIntensity: 2.5
  })
  expect(luminous).toMatchObject({ emissive: 0xffdba0, emissiveIntensity: 2.5 })
  expect(readSpatialDescriptor(input())).toMatchObject({
    emissive: 0,
    emissiveIntensity: 0
  })
})
it.each([
  { emissive: -1 },
  { emissive: 0x1000000 },
  { emissive: 0.5 },
  { emissive: 'white' },
  { emissiveIntensity: -1 },
  { emissiveIntensity: Infinity },
  { emissiveIntensity: NaN },
  { emissiveIntensity: '2' }
])('rejects malformed emissive material %j', (patch) => {
  expect(() => readSpatialDescriptor({ ...input(), ...patch })).toThrow(
    /material/
  )
})

it('admits opt-in environment reflection while ordinary materials remain unaffected', () => {
  expect(
    readSpatialDescriptor({ ...input(), environmentIntensity: 0.8 })
  ).toMatchObject({ environmentIntensity: 0.8 })
  expect(readSpatialDescriptor(input())).toMatchObject({
    environmentIntensity: 0
  })
})
it.each([-1, Infinity, NaN, '1'])(
  'rejects invalid environment intensity %s',
  (environmentIntensity) => {
    expect(() =>
      readSpatialDescriptor({ ...input(), environmentIntensity })
    ).toThrow(/material/)
  }
)

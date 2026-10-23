import { expect, it, vi } from 'vitest'
import {
  readSpatialDescriptor,
  type SpatialDescriptor
} from '../spatial-contract'

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
  const instances = [{ position: [1, 0, 2], yaw: Math.PI }]
  const accepted = readSpatialDescriptor({ ...input(), instances })
  if (accepted.kind !== 'mesh') throw new Error('Expected mesh')
  instances[0].position[0] = 99
  expect(accepted.instances?.[0].position).toEqual([1, 0, 2])
  expect(Object.isFrozen(accepted.instances?.[0].position)).toBe(true)
  const next = readSpatialDescriptor({ ...accepted, color: 0 })
  expect(next.kind === 'mesh' && next.instances).toBe(accepted.instances)
  for (const invalid of [
    [],
    [{ position: [NaN, 0, 0], yaw: 0 }],
    [{ position: [0, 0, 0], yaw: Infinity }]
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

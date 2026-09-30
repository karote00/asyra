import { afterEach, expect, it, vi } from 'vitest'
import { inspectMeshTopology } from '../mesh-topology'
import type { MeshGeometry } from '../part-geometry'

function bipyramid(count: number): MeshGeometry {
  const positions = [0, 0, 1, 0, 0, -1]
  const indices: number[] = []
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count
    positions.push(Math.cos(angle), Math.sin(angle), 0)
    const a = i + 2,
      b = ((i + 1) % count) + 2
    indices.push(0, a, b, 1, b, a)
  }
  return {
    kind: 'mesh',
    version: 1,
    source: { assetId: 'a'.repeat(64), scale: [1, 1, 1] },
    positions,
    indices
  }
}

afterEach(() => vi.restoreAllMocks())

it('observes cancellation during the initial complete vertex scan', () => {
  const mesh = bipyramid(2048)
  let reads = 0
  mesh.positions = new Proxy(mesh.positions, {
    get(target, key, receiver) {
      if (typeof key === 'string' && /^\d+$/.test(key)) reads++
      return Reflect.get(target, key, receiver)
    }
  })
  const cancelled = new Error('cancelled during vertex admission')
  expect(() =>
    inspectMeshTopology(mesh, () => {
      if (reads >= 768) throw cancelled
    })
  ).toThrow(cancelled)
  expect(reads).toBeLessThanOrEqual(768)
})

it('bounds graph operations between checkpoints through component and high-valence fan traversal', () => {
  const mesh = bipyramid(2048)
  let pending = 0,
    maximum = 0
  const has = Set.prototype.has,
    add = Set.prototype.add
  vi.spyOn(Set.prototype, 'has').mockImplementation(function (
    this: Set<unknown>,
    value
  ) {
    pending++
    return has.call(this, value)
  })
  vi.spyOn(Set.prototype, 'add').mockImplementation(function (
    this: Set<unknown>,
    value
  ) {
    pending++
    return add.call(this, value)
  })
  const result = inspectMeshTopology(mesh, () => {
    maximum = Math.max(maximum, pending)
    pending = 0
  })
  maximum = Math.max(maximum, pending)
  vi.restoreAllMocks()
  expect(result.issue).toBeNull()
  expect(result.components).toHaveLength(1)
  expect(result.components[0]).toHaveLength(mesh.indices.length / 3)
  expect(maximum).toBeLessThanOrEqual(4096)
  expect(inspectMeshTopology(mesh)).toEqual(result)
})

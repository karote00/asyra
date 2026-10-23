// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { Box3, Quaternion, Vector3 } from 'three'
import { SpatialBoundsOwner } from '../spatial.js'
import {
  readSpatialDescriptor,
  type SpatialDescriptor
} from '../spatial-contract.js'
const mesh = (patch: Record<string, unknown> = {}) => {
  const value = readSpatialDescriptor({
    kind: 'mesh',
    position: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    shape: { kind: 'box', size: [2, 4, 6] },
    color: 0,
    opacity: 1,
    wireframe: false,
    selectable: true,
    ...patch
  })
  if (value.kind !== 'mesh') throw new Error('Expected mesh')
  return value
}
it('bounds primitives, empty scenes and current mesh/instance transforms using corner equivalence', () => {
  const owner = new SpatialBoundsOwner()
  expect(owner.measure([])).toBeNull()
  for (const angle of [0, 0.6, Math.PI / 2]) {
    const q = new Quaternion().setFromAxisAngle(
      new Vector3(0.3, 0.8, 0.2).normalize(),
      angle
    )
    const value = mesh({
      position: [7, -2, 3],
      rotation: q.toArray(),
      instances: [
        { position: [2, 1, 0], yaw: 0.7 },
        { position: [-3, 0, 5], yaw: -0.4 }
      ]
    })
    const expected = new Box3()
    for (const instance of value.instances ?? [])
      for (const x of [-1, 1])
        for (const y of [-2, 2])
          for (const z of [-3, 3])
            expected.expandByPoint(
              new Vector3(x, y, z)
                .applyAxisAngle(new Vector3(0, 1, 0), instance.yaw)
                .add(new Vector3(...instance.position))
                .applyQuaternion(q)
                .add(new Vector3(...value.position))
            )
    const result = owner.measure([value])
    if (!result) throw new Error('Missing bounds')
    result.min.forEach((n, i) =>
      expect(n).toBeCloseTo(expected.min.toArray()[i])
    )
    result.max.forEach((n, i) =>
      expect(n).toBeCloseTo(expected.max.toArray()[i])
    )
  }
  expect(
    owner.measure([mesh({ shape: { kind: 'sphere', radius: 2 } })])
  ).toEqual({ min: [-2, -2, -2], max: [2, 2, 2] })
  expect(
    owner.measure([mesh({ shape: { kind: 'capsule', radius: 1, length: 4 } })])
  ).toEqual({ min: [-1, -3, -1], max: [1, 3, 1] })
  owner.dispose()
  expect(() => owner.measure([])).toThrow(/disposed/)
})
it('scans admitted local vertices once, with bounded corner work for repeated placements', () => {
  const positions = Array.from({ length: 3000 }, (_, i) => i % 31)
  const value = mesh({
    shape: { kind: 'triangles', positions, indices: [0, 1, 2] },
    instances: [
      { position: [0, 0, 0], yaw: 0 },
      { position: [2, 0, 1], yaw: 0.4 }
    ]
  })
  const owner = new SpatialBoundsOwner()
  const min = vi.spyOn(Math, 'min')
  try {
    owner.measure([value])
    expect(min.mock.calls.length).toBeGreaterThanOrEqual(positions.length)
    min.mockClear()
    const moved = mesh({ ...value, position: [4, 2, 1] })
    const actual = owner.measure([moved])
    expect(min.mock.calls.length).toBeLessThanOrEqual(48)
    min.mockRestore()
    expect(actual).toEqual(new SpatialBoundsOwner().measure([moved]))
    const changed = mesh({
      ...moved,
      shape: { ...value.shape, positions: positions.map((n) => n * 2) }
    })
    expect(owner.measure([changed])).toEqual(
      new SpatialBoundsOwner().measure([changed])
    )
    expect(owner.measure([changed])).not.toEqual(actual)
  } finally {
    min.mockRestore()
    owner.dispose()
  }
})
it('does not trust frozen caller identities, keeps results immutable and validates before retained lookup', () => {
  const positions = [0, 0, 0, 1, 0, 0, 0, 1, 2]
  const value = {
    ...mesh(),
    shape: Object.freeze({ kind: 'triangles', positions, indices: [0, 1, 2] })
  } as SpatialDescriptor & { kind: 'mesh' }
  const owner = new SpatialBoundsOwner()
  const before = owner.measure([value])
  if (!before) throw new Error('Missing bounds')
  expect(Object.isFrozen(before.min)).toBe(true)
  positions[3] = 8
  expect(owner.measure([value])?.max[0]).toBe(8)
  positions[3] = NaN
  expect(() => owner.measure([value])).toThrow()
  expect(before.max[0]).toBe(1)
  owner.dispose()
})

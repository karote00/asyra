import { requiredSpecValue } from '../../assets/specification'
import { OFFICE_STRUCTURE } from '../office-layout'
import { describe, expect, it, vi } from 'vitest'
import { createReferenceScene, buildSpatialMeshes } from '../reference-scene'
import { createSceneController } from '../controller'
describe('current reference composition', () => {
  it('constructs all visible reference zones as finite real geometry with stable identities', () => {
    const scene = createReferenceScene(),
      ids = new Set(scene.assemblies.map((a) => a.id))
    for (const id of [
      'office-slab',
      'entrance-door',
      'park-bench',
      'canal',
      'actor-kai'
    ])
      expect(ids.has(id), id).toBe(true)
    expect(ids.size).toBe(scene.assemblies.length)
    const door = scene.assemblies.find((a) => a.id === 'entrance-door')
    expect(door?.parts).toContain('fixed-left-panel')
    expect(door?.parts).toContain('right-main-leaf')
    for (const part of scene.parts) {
      expect(part.mesh.positions.every(Number.isFinite), part.id).toBe(true)
      expect(part.mesh.indices.length, part.id).toBeGreaterThan(0)
    }
    const meshes = buildSpatialMeshes(scene, {})
    expect(meshes.length).toBeLessThan(160)
    expect(meshes.length).toBeGreaterThan(10)
  })
  it('places and rear-follow only submit camera changes and disposal rejects further updates', () => {
    const layer = { submitCamera: vi.fn() },
      controller = createSceneController(layer)
    controller.focusPlace('tea')
    expect(controller.getSnapshot().view).toBe('Tea point')
    controller.follow('mina')
    expect(controller.getSnapshot().view).toBe('Following Mina')
    expect(layer.submitCamera).toHaveBeenCalledTimes(2)
    expect(() => controller.follow('missing')).toThrow()
    controller.overview()
    expect(controller.getSnapshot().view).toBe('Overview')
    controller.dispose()
    expect(() => controller.overview()).toThrow('disposed')
  })
})
it('preserves the approved installation clearance beside the complete door', () => {
  const scene = createReferenceScene()
  const bounds = (id: string) => {
    let offset = 0
    for (const assembly of scene.assemblies) {
      if (assembly.id === id) {
        const xs = scene.parts
          .slice(offset, offset + assembly.parts.length)
          .flatMap((p) => p.mesh.positions.filter((_, i) => i % 3 === 0))
        return [Math.min(...xs), Math.max(...xs)]
      }
      offset += assembly.parts.length
    }
    throw new Error(`Missing assembly ${id}`)
  }
  const door = bounds('entrance-door')
  expect(door[0] - bounds('front-facade')[1]).toBeCloseTo(
    0.01 * OFFICE_STRUCTURE.doorScale,
    6
  )
  expect(bounds('entry-pier')[0] - door[1]).toBeCloseTo(
    0.01 * OFFICE_STRUCTURE.doorScale,
    6
  )
})
it('keeps the work-view centre ray above the selected head rather than aiming through it', () => {
  const controller = createSceneController({ submitCamera: vi.fn() })
  controller.follow('mina')
  const camera = controller.getCamera()
  // Mina sits at author Y=.15. Convert to renderer Z=-.15 and inspect the ray there.
  const t =
    (-0.15 - camera.position[2]) / (camera.target[2] - camera.position[2])
  const height =
    camera.position[1] + t * (camera.target[1] - camera.position[1])
  expect(height).toBeGreaterThan(1.7)
  expect(camera.target[2]).toBeGreaterThan(0.22)
  controller.dispose()
})

it('does not retain rejected animal placeholders in the office', () => {
  const scene = createReferenceScene()
  expect(
    scene.assemblies.filter((a) =>
      ['sleeping-orange-cat', 'standing-corgi'].includes(a.asset)
    )
  ).toEqual([])
})
it('moves camera and target together on the ground plane relative to the current view', () => {
  const layer = { submitCamera: vi.fn() }
  const controller = createSceneController(layer)
  controller.orbit(0.8, 0.2)
  const before = controller.getCamera()
  controller.move(0, 1)
  const after = controller.getCamera()
  expect(after.position[1]).toBeCloseTo(before.position[1], 12)
  expect(after.target[1]).toBeCloseTo(before.target[1], 12)
  const direction = [
    before.target[0] - before.position[0],
    before.target[2] - before.position[2]
  ]
  const delta = [
    after.position[0] - before.position[0],
    after.position[2] - before.position[2]
  ]
  expect(delta[0] * direction[0] + delta[1] * direction[1]).toBeGreaterThan(0)
  for (let axis = 0; axis < 3; axis++)
    expect(after.position[axis] - before.position[axis]).toBeCloseTo(
      after.target[axis] - before.target[axis],
      12
    )
  controller.move(0, -1)
  expect(controller.getCamera().position).toEqual(
    expect.arrayContaining(before.position.map((n) => expect.closeTo(n, 10)))
  )
  controller.move(1, 0)
  const sideways = controller.getCamera()
  expect(
    (sideways.position[0] - before.position[0]) * direction[0] +
      (sideways.position[2] - before.position[2]) * direction[1]
  ).toBeCloseTo(0, 10)
  controller.dispose()
  expect(() => controller.move(1, 0)).toThrow('disposed')
})

it('places recognizably tall and short trees rather than two nearly equal copies', () => {
  const trees = createReferenceScene().parts.filter((p) => p.id === 'trunk')
  const heights = trees.map((p) => {
    const z = p.mesh.positions.filter((_, i) => i % 3 === 2)
    return Math.max(...z) - Math.min(...z)
  })
  expect(new Set(heights.map((n) => n.toFixed(2))).size).toBeGreaterThanOrEqual(
    4
  )
  expect(Math.max(...heights) / Math.min(...heights)).toBeGreaterThanOrEqual(
    1.5
  )
})

it('uses distinct tree branch proportions in the rendered scene', () => {
  const parts = createReferenceScene().parts,
    trunks = parts.filter((p) => p.id === 'trunk'),
    first = parts.filter((p) => p.id === 'B1'),
    second = parts.filter((p) => p.id === 'B5')
  const signatures = trunks.map((trunk, i) => {
    const z = trunk.mesh.positions.filter((_, j) => j % 3 === 2),
      height = Math.max(...z) - Math.min(...z)
    const a = first[i].mesh.positions.slice(-3),
      b = second[i].mesh.positions.slice(-3)
    return (Math.hypot(...a.map((v, k) => v - b[k])) / height).toFixed(5)
  })
  expect(new Set(signatures).size).toBe(6)
})

it('gives each actual scene planter a distinct normalized foliage layout', () => {
  const scene = createReferenceScene()
  let offset = 0
  const signatures: string[] = [],
    counts: number[] = []
  for (const assembly of scene.assemblies) {
    const parts = scene.parts.slice(offset, offset + assembly.parts.length)
    offset += assembly.parts.length
    if (assembly.asset !== 'planter') continue
    const leaves = parts.filter((p) => p.id.startsWith('leaf-'))
    const stem = requiredSpecValue(
      parts.find((p) => p.id === 'stem'),
      'plant stem'
    )
    const z = stem.mesh.positions.filter((_, i) => i % 3 === 2)
    const height = Math.max(...z) - Math.min(...z)
    counts.push(leaves.length)
    signatures.push(
      JSON.stringify(
        leaves.map((p) =>
          [0, 1, 2].flatMap((axis) => {
            const values = p.mesh.positions.filter((_, i) => i % 3 === axis)
            return [Math.min(...values), Math.max(...values)].map((n) =>
              ((n - assembly.position[axis]) / height).toFixed(5)
            )
          })
        )
      )
    )
  }
  expect(signatures.length).toBeGreaterThan(10)
  expect(new Set(signatures).size).toBe(signatures.length)
  expect(new Set(counts).size).toBeGreaterThanOrEqual(3)
})

it('keeps rotated wall-cap ends flush while overhanging across thickness only', () => {
  const scene = createReferenceScene()
  const extent = (id: string, axis: number) => {
    let offset = 0
    for (const a of scene.assemblies) {
      const parts = scene.parts.slice(offset, offset + a.parts.length)
      offset += a.parts.length
      if (a.id !== id) continue
      const values = parts.flatMap((p) =>
        p.mesh.positions.filter((_, i) => i % 3 === axis)
      )
      return Math.max(...values) - Math.min(...values)
    }
    throw new Error('Wall assembly missing')
  }
  expect(extent('left-wall-cap', 1)).toBeCloseTo(extent('left-wall', 1), 8)
  expect(extent('left-wall-cap', 0)).toBeGreaterThan(extent('left-wall', 0))
})
it('keeps road markings clear of the cover', () => {
  const scene = createReferenceScene()
  const cover = requiredSpecValue(
    scene.assemblies.find((a) => a.id === 'manhole'),
    'cover'
  )
  for (const marking of scene.assemblies.filter((a) =>
    a.id.startsWith('road-line-')
  ))
    expect(Math.abs(marking.position[1] - cover.position[1])).toBeGreaterThan(
      0.36
    )
})
it('keeps equal-sized furniture within fifteen percent projected scale across the office depth', () => {
  const controller = createSceneController({ submitCamera: vi.fn() })
  const c = controller.getCamera(),
    direction = c.target.map((v, i) => v - c.position[i]),
    length = Math.hypot(...direction)
  const depth = (p: number[]) =>
    p.reduce(
      (sum, v, i) => sum + ((v - c.position[i]) * direction[i]) / length,
      0
    )
  expect(depth([0, 1, -2.3]) / depth([0, 1, 2.3])).toBeLessThanOrEqual(1.15)
  controller.dispose()
})
it('uses outdoor-sized pots rather than desktop-sized vessels along the terrace', () => {
  const s = createReferenceScene()
  let offset = 0
  for (const a of s.assemblies) {
    const pieces = s.parts.slice(offset, offset + a.parts.length)
    offset += a.parts.length
    if (!a.id.startsWith('park-pot-')) continue
    const p = requiredSpecValue(
      pieces.find((p) => p.id === 'pot'),
      'terrace pot'
    ).mesh.positions.filter((_, i) => i % 3 === 0)
    expect(Math.max(...p) - Math.min(...p)).toBeGreaterThanOrEqual(0.24)
  }
})

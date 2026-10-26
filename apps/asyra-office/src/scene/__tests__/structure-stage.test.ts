import { describe, expect, it } from 'vitest'
import { createReferenceScene } from '../reference-scene'
import {
  OFFICE_FIT,
  OFFICE_FLOORS,
  OFFICE_SHELL,
  referencePoint
} from '../office-layout'
import source from '../reference/interior-landmarks.json'

describe('single-storey structural review', () => {
  it('defaults to the live stage instead of resurrecting rejected furnishings', () => {
    const scene = createReferenceScene()
    const ids = new Set(scene.assemblies.map((a) => a.id))
    expect(ids.has('office-slab')).toBe(true)
    for (const id of ['desk', 'lounge-sofa', 'fridge', 'actor-mina'])
      expect(ids.has(id), id).toBe(false)
  })
  it('keeps the fitted overview orbit pivot on the shared office floor', () => {
    const target = OFFICE_FIT.camera.target
    expect(target[2]).toBeCloseTo(OFFICE_FLOORS.lounge, 8)
    const xs = OFFICE_FIT.foundation.outline.map((point) => point[0])
    const ys = OFFICE_FIT.foundation.outline.map((point) => point[1])
    expect(target[0]).toBeGreaterThan(Math.min(...xs))
    expect(target[0]).toBeLessThan(Math.max(...xs))
    expect(target[1]).toBeGreaterThan(Math.min(...ys))
    expect(target[1]).toBeLessThan(Math.max(...ys))
  })
  it('renders structure without interior furniture, decoration or occupants', () => {
    const scene = createReferenceScene('structure')
    const ids = new Set(scene.assemblies.map((a) => a.id))
    for (const id of [
      'office-slab',
      'floor-0-0',
      'left-wall',
      'back-wall',
      'pantry-back-wall',
      'work-back-partition',
      'work-divider',
      'lounge-divider',
      'lounge-left-return',
      'front-facade',
      'entry-pier',
      'entry-header',
      'entrance-door'
    ])
      expect(ids.has(id), id).toBe(true)
    for (const id of [
      'entrance-frame',
      'desk',
      'sink',
      'fridge',
      'lounge-sofa',
      'wall-clock',
      'work-rug',
      'actor-mina',
      'actor-leo',
      'actor-sage',
      'room-edge-plant-0'
    ])
      expect(ids.has(id), id).toBe(false)
    expect(scene.labels.some((l) => l.artwork)).toBe(false)
    const entrance = scene.assemblies.filter((a) =>
      ['front-facade', 'entry-pier', 'entry-header'].includes(a.id)
    )
    expect(entrance).toHaveLength(3)
    // The approved complete assembly occupies the measured rough opening.
    expect(scene.assemblies.some((a) => a.asset === 'entry-door-set')).toBe(
      true
    )
    expect(
      [...ids].some(
        (id) =>
          id.startsWith('interior-step-') || id.includes('floor-foundation')
      )
    ).toBe(false)
  })
  it('joins the one floor to its foundation and starts every wall at that floor', () => {
    const scene = createReferenceScene('structure')
    const elevations = new Map<string, [number, number]>()
    let offset = 0
    for (const assembly of scene.assemblies) {
      const parts = scene.parts.slice(offset, offset + assembly.parts.length)
      offset += assembly.parts.length
      if (
        assembly.asset !== 'floor-plank' &&
        assembly.asset !== 'wall-segment' &&
        assembly.id !== 'office-slab'
      )
        continue
      const z = parts.flatMap((p) =>
        p.mesh.positions.filter((_, i) => i % 3 === 2)
      )
      elevations.set(assembly.id, [Math.min(...z), Math.max(...z)])
    }
    const floor = elevations.get('floor-0-0'),
      foundation = elevations.get('office-slab')
    if (!floor || !foundation) throw new Error('Missing structural support')
    expect(floor[1]).toBeCloseTo(0.38, 6)
    expect(foundation[1]).toBeCloseTo(floor[0], 6)
    for (const assembly of scene.assemblies) {
      const z = elevations.get(assembly.id)
      if (!z) continue
      if (assembly.asset === 'floor-plank')
        expect(z, assembly.id).toEqual(floor.map((n) => expect.closeTo(n, 6)))
      if (assembly.asset === 'wall-segment' && !assembly.id.endsWith('-cap'))
        expect(z[0], assembly.id).toBeCloseTo(floor[1], 6)
    }
  })
  it('keeps the full rectangular footprint beneath foreground decoration occlusions', () => {
    const scene = createReferenceScene('structure')
    const topFaces: { id: string; vertices: number[][] }[] = []
    let offset = 0
    for (const assembly of scene.assemblies) {
      const parts = scene.parts.slice(offset, offset + assembly.parts.length)
      offset += assembly.parts.length
      if (assembly.id !== 'office-slab' && assembly.asset !== 'floor-plank')
        continue
      for (const part of parts) {
        const { positions, indices } = part.mesh
        const top = Math.max(...positions.filter((_, i) => i % 3 === 2))
        for (let i = 0; i < indices.length; i += 3) {
          const vertices = indices
            .slice(i, i + 3)
            .map((j) => positions.slice(j * 3, j * 3 + 3))
          if (vertices.every((p) => Math.abs(p[2] - top) < 1e-8))
            topFaces.push({ id: assembly.id, vertices })
        }
      }
    }
    const slab = topFaces.filter((t) => t.id === 'office-slab')
    const vertices = slab.flatMap((t) => t.vertices)
    const minX = Math.min(...vertices.map((p) => p[0])),
      maxX = Math.max(...vertices.map((p) => p[0]))
    const minY = Math.min(...vertices.map((p) => p[1])),
      maxY = Math.max(...vertices.map((p) => p[1]))
    const area = slab.reduce(
      (sum, { vertices: [a, b, c] }) =>
        sum +
        Math.abs(
          (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
        ) /
          2,
      0
    )
    expect(area).toBeCloseTo((maxX - minX) * (maxY - minY), 6)
    for (const x of [minX, maxX])
      for (const y of [minY, maxY])
        expect(
          vertices.some((p) => Math.hypot(p[0] - x, p[1] - y) < 1e-8),
          `missing structural corner ${x},${y}`
        ).toBe(true)
    const point = [maxX - 0.12, minY + 0.12]
    expect(
      topFaces
        .filter((t) => t.id !== 'office-slab')
        .some(({ vertices: v }) => {
          const sides = v.map((a, i) => {
            const b = v[(i + 1) % 3]
            return (
              (b[0] - a[0]) * (point[1] - a[1]) -
              (b[1] - a[1]) * (point[0] - a[0])
            )
          })
          return sides.every((n) => n >= -1e-8) || sides.every((n) => n <= 1e-8)
        }),
      'finished floor missing beneath occluded corner'
    ).toBe(true)
  })
})

describe('source-visible room floor coverage', () => {
  for (const sample of source.visibleFloorSamples.samples) {
    it(`contains ${sample.id} on the shared first floor within its room walls`, () => {
      const p = OFFICE_FIT.parameters
      const ground = referencePoint(sample.pixel, 2, OFFICE_FLOORS.work)
      const halfWall = OFFICE_SHELL.exteriorThickness / 2
      const bounds =
        sample.room === 'pantry'
          ? [
              [p.pantryX + halfWall, OFFICE_SHELL.eastX - halfWall],
              [
                p.loungeY + OFFICE_SHELL.partitionThickness / 2,
                p.rearY - halfWall
              ]
            ]
          : [
              [OFFICE_SHELL.westX + halfWall, p.pantryX - halfWall],
              [
                p.greenY + OFFICE_SHELL.partitionThickness / 2,
                p.rearY - halfWall
              ]
            ]
      for (const axis of [0, 1]) {
        expect(
          ground[axis],
          `${sample.id} axis ${axis}: shared-floor point ${ground}`
        ).toBeGreaterThanOrEqual(bounds[axis][0])
        expect(
          ground[axis],
          `${sample.id} axis ${axis}: shared-floor point ${ground}`
        ).toBeLessThanOrEqual(bounds[axis][1])
      }
    })
  }
})

it('leaves source-visible floor samples unobstructed by structural wall meshes at both LoDs', () => {
  const scene = createReferenceScene('structure')
  const origin = OFFICE_FIT.camera.position
  const subtract = (a: readonly number[], b: readonly number[]) =>
    a.map((v, i) => v - b[i])
  const dot = (a: readonly number[], b: readonly number[]) =>
    a.reduce((sum, v, i) => sum + v * b[i], 0)
  const cross = (a: readonly number[], b: readonly number[]) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ]
  for (const sample of source.visibleFloorSamples.samples) {
    const target = referencePoint(sample.pixel, 2, OFFICE_FLOORS.work)
    const direction = subtract(target, origin)
    let offset = 0
    for (const assembly of scene.assemblies) {
      const parts = scene.parts.slice(offset, offset + assembly.parts.length)
      offset += assembly.parts.length
      if (!['wall-segment', 'wall-header'].includes(assembly.asset)) continue
      for (const part of parts)
        for (const detail of ['near', 'distant'] as const) {
          const mesh = detail === 'near' ? part.mesh : part.distant?.mesh
          if (!mesh) throw new Error('Missing wall representation')
          for (let i = 0; i < mesh.indices.length; i += 3) {
            const [a, b, c] = mesh.indices
              .slice(i, i + 3)
              .map((index) => mesh.positions.slice(index * 3, index * 3 + 3))
            const ab = subtract(b, a),
              ac = subtract(c, a),
              h = cross(direction, ac),
              determinant = dot(ab, h)
            if (Math.abs(determinant) < 1e-10) continue
            const relative = subtract(origin, a),
              u = dot(relative, h) / determinant
            if (u < 0 || u > 1) continue
            const q = cross(relative, ab),
              v = dot(direction, q) / determinant
            if (v < 0 || u + v > 1) continue
            const t = dot(ac, q) / determinant
            expect(
              t > 1e-8 && t < 1 - 1e-8,
              `${sample.id} is hidden by ${assembly.id}/${detail}`
            ).toBe(false)
          }
        }
    }
  }
})

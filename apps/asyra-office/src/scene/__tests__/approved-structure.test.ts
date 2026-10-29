import { beforeAll, describe, expect, it } from 'vitest'
import approved from '../../../../../assets/asyra-office/models/architecture/review/office-single-floor-structure-proposal-v1.json'
import { createReferenceScene } from '../reference-scene'
import type { AssetPart } from '../../assets/catalog'
import depthReference from '../reference/lower-room-measurements.json'

// Historical lower-room fit followed by the owner-authorized four-room expansion.
const run = depthReference.eastFloorRun
const direction = run.rear.map((n, k) => n - run.front[k])
const fraction =
  run.partition.reduce(
    (sum, n, k) => sum + (n - run.front[k]) * direction[k],
    0
  ) / direction.reduce((sum, n) => sum + n * n, 0)
const datum = depthReference.baseline
const shift =
  (datum.rearInnerY - datum.frontInnerY) * fraction -
  (datum.loungeRearInnerY - datum.frontInnerY)
function preExpansionVertices(name: string, vertices: number[][]) {
  return vertices.map(([x, y, z]) => {
    if (
      [
        'A - cream divider',
        'B - green divider',
        'lounge rear left',
        'lounge rear middle',
        'lounge rear right',
        'lounge T return'
      ].includes(name)
    )
      return [x, y + shift, z]
    if (['lounge left low', 'lounge left return'].includes(name)) {
      const oldEnd = approved.parameters.loungeY
      const ratio =
        (oldEnd - datum.frontInnerY + shift) / (oldEnd - datum.frontInnerY)
      // Keep the terminal abutment depth unchanged; only the clear wall run grows.
      if (y >= oldEnd) return [x, y + shift, z]
      return [x, datum.frontInnerY + (y - datum.frontInnerY) * ratio, z]
    }
    if (name === 'white pantry floor band' && y < 0) return [x, y + shift, z]
    return [x, y, z]
  })
}

function revisedVertices(name: string, vertices: number[][]) {
  return preExpansionVertices(name, vertices).map(([x, y, z]) => {
    if (['discussion rear', 'pantry rear'].includes(name)) return [x, y + 1, z]
    if (
      [
        'A - cream divider',
        'B - green divider',
        'lounge rear left',
        'lounge rear middle',
        'lounge rear right',
        'lounge T return'
      ].includes(name)
    )
      return [x, y + 0.5, z]
    if (name === 'west wall') return [x, y > 2 ? y + 1 : y, z]
    if (name === 'pantry divider' || name === 'white pantry floor band')
      return [x, y + (y > 2 ? 1 : 0.5), z]
    if (name === 'lounge left return') return [x, y > -0.1 ? y + 0.5 : y, z]
    return [x, y, z]
  })
}

const ids: Record<string, string[]> = {
  'west wall': ['left-wall', 'discussion-left-wall'],
  'discussion rear': ['back-wall'],
  'pantry rear': ['pantry-back-wall'],
  'A - cream divider': ['work-back-partition'],
  'B - green divider': ['work-divider'],
  'pantry divider': ['pantry-divider'],
  'lounge rear left': ['lounge-divider'],
  'lounge rear middle': ['lounge-middle-wall'],
  'lounge rear right': ['lounge-right-wall'],
  'lounge T return': ['lounge-rear-return'],
  'lounge left low': ['lounge-left-low'],
  'lounge left return': ['lounge-left-return'],
  'thin front section': ['front-thin-wall'],
  'front facade': ['front-facade'],
  'entry pier': ['entry-pier'],
  'entry header': ['entry-header']
}
let scene: ReturnType<typeof createReferenceScene>
const parts = new Map<string, AssetPart[]>()
beforeAll(() => {
  scene = createReferenceScene('structure')
  let offset = 0
  for (const assembly of scene.assemblies) {
    parts.set(
      assembly.id,
      scene.parts.slice(offset, offset + assembly.parts.length)
    )
    offset += assembly.parts.length
  }
})

function extent(values: number[], axis: number) {
  const coordinates = values.filter((_, i) => i % 3 === axis)
  return [Math.min(...coordinates), Math.max(...coordinates)]
}

describe('owner-approved building construction', () => {
  for (const [name, assemblies] of Object.entries(ids)) {
    it(`preserves the approved ${name} body and cap extents`, () => {
      for (const cap of [false, true]) {
        const expected = approved.solids.find(
          (s) => s.id === name + (cap ? '-cap' : '')
        )
        if (!expected) throw new Error('Missing approved solid')
        const actual = assemblies.flatMap((id) => {
          const group = parts.get(
            id === 'entry-header' ? id : id + (cap ? '-cap' : '')
          )
          if (!group) throw new Error(`Missing composed wall ${id}`)
          return id === 'entry-header'
            ? group.filter((p) => (p.id === 'top-cap') === cap)
            : group
        })
        for (const detail of ['near', 'distant'] as const) {
          const positions = actual.flatMap((p) =>
            detail === 'near'
              ? p.mesh.positions
              : (p.distant?.mesh ?? p.mesh).positions
          )
          for (let axis = 0; axis < 3; axis++) {
            const bounds = extent(positions, axis)
            const wanted = extent(
              revisedVertices(name, expected.vertices).flat(),
              axis
            )
            if (name === 'B - green divider' && axis === 2) {
              const top = approved.parameters.greenTop
              if (cap) wanted[0] = top - 0.02
              else wanted[1] = top - 0.02
            }
            expect(bounds[0]).toBeCloseTo(wanted[0], 6)
            expect(bounds[1]).toBeCloseTo(wanted[1], 6)
          }
        }
      }
    })
  }

  it('admits the complete two-part entrance at the approved uniform scale', () => {
    const door = parts.get('entrance-door')
    expect(door).toBeDefined()
    for (const component of approved.entryAssembly.components) {
      const actual = door?.find((p) => p.id === component.partId)
      if (!actual)
        throw new Error(`Missing entrance component ${component.partId}`)
      for (let axis = 0; axis < 3; axis++) {
        const bounds = extent(actual.mesh.positions, axis)
        expect(bounds[0]).toBeCloseTo(
          component.center[axis] - component.size[axis] / 2,
          5
        )
        expect(bounds[1]).toBeCloseTo(
          component.center[axis] + component.size[axis] / 2,
          5
        )
      }
    }
    expect(parts.has('entrance-frame')).toBe(false)
  })

  it('replaces the false pantry wall with flush floor without coplanar wood', () => {
    expect(parts.has('pantry-east-wall')).toBe(false)
    const band = approved.solids.find((s) => s.id === 'white pantry floor band')
    const actual = parts.get('pantry-floor-band')
    if (!band || !actual) throw new Error('Missing approved floor band')
    for (let axis = 0; axis < 3; axis++) {
      expect(
        extent(
          actual.flatMap((p) => p.mesh.positions),
          axis
        )
      ).toEqual(
        extent(
          revisedVertices('white pantry floor band', band.vertices).flat(),
          axis
        ).map((v) => expect.closeTo(v, 10))
      )
    }
    const revisedBand = revisedVertices(
      'white pantry floor band',
      band.vertices
    ).flat()
    const x = extent(revisedBand, 0),
      y = extent(revisedBand, 1)
    for (const [id, group] of parts) {
      if (!id.startsWith('floor-')) continue
      for (const p of group) {
        const bx = extent(p.mesh.positions, 0),
          by = extent(p.mesh.positions, 1)
        const area =
          Math.max(0, Math.min(bx[1], x[1]) - Math.max(bx[0], x[0])) *
          Math.max(0, Math.min(by[1], y[1]) - Math.max(by[0], y[0]))
        expect(area).toBeLessThan(1e-10)
      }
    }
  })
})

import { beforeAll, describe, expect, it } from 'vitest'
import approved from '../../../../../assets/asyra-office/models/architecture/review/office-single-floor-structure-proposal-v1.json'
import { createReferenceScene } from '../reference-scene'
import type { AssetPart } from '../../assets/catalog'

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
            const wanted = extent(expected.vertices.flat(), axis)
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
        extent(band.vertices.flat(), axis).map((v) => expect.closeTo(v, 10))
      )
    }
    const x = extent(band.vertices.flat(), 0),
      y = extent(band.vertices.flat(), 1)
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

import { describe, expect, it } from 'vitest'
import approved from '../../../../../assets/asyra-office/models/architecture/review/office-single-floor-structure-proposal-v1.json'
import { createReferenceScene } from '../reference-scene'
import { OFFICE_FLOORS } from '../office-layout'

// This stage preserves the accepted physical openings, not a future navigation radius.
describe('approved structural openings', () => {
  for (const detail of ['near', 'distant'] as const) {
    it(`preserves the west gap and open lounge frontage at ${detail} detail`, () => {
      const scene = createReferenceScene('structure')
      const members = new Map<string, number[][]>()
      let offset = 0
      for (const assembly of scene.assemblies) {
        const parts = scene.parts.slice(offset, offset + assembly.parts.length)
        offset += assembly.parts.length
        const positions = parts.flatMap(
          (p) =>
            (detail === 'distant' ? (p.distant?.mesh ?? p.mesh) : p.mesh)
              .positions
        )
        members.set(
          assembly.id,
          [0, 1, 2].map((axis) => {
            const values = positions.filter((_, i) => i % 3 === axis)
            return [Math.min(...values), Math.max(...values)]
          })
        )
      }
      const bounds = (id: string) => {
        const value = members.get(id)
        if (!value) throw new Error(`Missing structure ${id}`)
        return value
      }
      const cream = bounds('work-back-partition')
      const green = bounds('work-divider')
      const creamSource = approved.walls.find(
        (w) => w.id === 'A - cream divider'
      )
      const greenSource = approved.walls.find(
        (w) => w.id === 'B - green divider'
      )
      if (!creamSource || !greenSource)
        throw new Error('Missing approved dividers')
      const gap = green[0][0] - cream[0][1]
      expect(gap).toBeGreaterThan(0)
      expect(gap).toBeCloseTo(greenSource.start - creamSource.end, 8)
      expect((cream[1][0] + cream[1][1]) / 2).toBeCloseTo(
        (green[1][0] + green[1][1]) / 2,
        8
      )
      expect(cream[2][0]).toBeCloseTo(OFFICE_FLOORS.work, 8)
      expect(green[2][0]).toBeCloseTo(OFFICE_FLOORS.discussion, 8)
      // The accepted lounge opens to the front; no extra wall may enclose it.
      const left = bounds('lounge-left-low')
      const slab = bounds('office-slab')
      const frontY = slab[1][0]
      for (const assembly of scene.assemblies) {
        if (assembly.asset !== 'wall-segment') continue
        const b = bounds(assembly.id)
        const crossesFront = b[1][0] <= frontY && b[1][1] > frontY
        const overlapsLounge = b[0][1] > left[0][1] + 1e-8
        expect(crossesFront && overlapsLounge, assembly.id).toBe(false)
      }
    })
  }
})

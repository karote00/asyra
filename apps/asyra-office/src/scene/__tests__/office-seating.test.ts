import { requiredSpecValue } from '../../assets/specification'
import { beforeAll, expect, it } from 'vitest'
import { createReferenceScene } from '../reference-scene'

const seatingIds = ['desk', 'meeting-table', 'lounge-coffee-table']
let scene: ReturnType<typeof createReferenceScene>
beforeAll(() => {
  scene = createReferenceScene()
})
it('admits only the three admitted tables after structural approval', () => {
  const baseline = createReferenceScene('structure')
  const ids = new Set(baseline.assemblies.map((a) => a.id))
  expect(
    scene.assemblies
      .filter((a) => !ids.has(a.id))
      .map((a) => a.id)
      .sort()
  ).toEqual([...seatingIds].sort())
  let offset = 0
  const existing = new Map(
    baseline.assemblies.map((a) => {
      const parts = baseline.parts.slice(offset, offset + a.parts.length)
      offset += a.parts.length
      return [a.id, { assembly: a, parts }] as const
    })
  )
  offset = 0
  for (const assembly of scene.assemblies) {
    const parts = scene.parts.slice(offset, offset + assembly.parts.length)
    offset += assembly.parts.length
    if (existing.has(assembly.id))
      expect({ assembly, parts }).toEqual(existing.get(assembly.id))
  }
  expect(scene.labels).toEqual(baseline.labels)
})
it('grounds every table and chair and clears every wall body and cap', () => {
  const bounds = new Map<string, number[][]>()
  let offset = 0
  for (const a of scene.assemblies) {
    const box = [
      [Infinity, -Infinity],
      [Infinity, -Infinity],
      [Infinity, -Infinity]
    ]
    for (const p of scene.parts.slice(offset, offset + a.parts.length))
      p.mesh.positions.forEach((v, i) => {
        box[i % 3][0] = Math.min(box[i % 3][0], v)
        box[i % 3][1] = Math.max(box[i % 3][1], v)
      })
    offset += a.parts.length
    bounds.set(a.id, box)
  }
  for (const id of seatingIds) {
    const furniture = bounds.get(id)
    expect(furniture, id).toBeDefined()
    if (!furniture) throw new Error(`Missing seating ${id}`)
    expect(furniture[2][0], id).toBeCloseTo(0.38, 6)
    for (const wall of scene.assemblies.filter((a) =>
      ['wall-segment', 'wall-header'].includes(a.asset)
    )) {
      const b = requiredSpecValue(bounds.get(wall.id), wall.id)
      const overlaps = [0, 1, 2].every(
        (k) =>
          Math.min(b[k][1], furniture[k][1]) -
            Math.max(b[k][0], furniture[k][0]) >
          1e-6
      )
      expect(overlaps, `${id} intersects ${wall.id}`).toBe(false)
    }
  }
})

it('does not substitute the standalone green work chair for the source office chair', () => {
  expect(scene.assemblies.some((a) => a.id === 'desk-chair')).toBe(false)
  expect(scene.assemblies.some((a) => a.asset === 'work-chair')).toBe(false)
  expect(scene.assemblies.some((a) => a.id === 'desk')).toBe(true)
})

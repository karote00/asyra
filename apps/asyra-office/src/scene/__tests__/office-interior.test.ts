import { createHash } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { createReferenceScene } from '../reference-scene'
import type { AssetPart } from '../../assets/catalog'

let scene: ReturnType<typeof createReferenceScene>
const pieces = new Map<string, AssetPart[]>()
beforeAll(() => {
  scene = createReferenceScene()
  let offset = 0
  for (const a of scene.assemblies) {
    pieces.set(a.id, scene.parts.slice(offset, offset + a.parts.length))
    offset += a.parts.length
  }
})
function bounds(id: string, partId?: string) {
  const parts = pieces.get(id)?.filter((p) => !partId || p.id === partId)
  if (!parts?.length)
    throw new Error(`Missing assembly or part: ${id}/${partId ?? '*'}`)
  const result = [
    [Infinity, -Infinity],
    [Infinity, -Infinity],
    [Infinity, -Infinity]
  ]
  for (const p of parts)
    p.mesh.positions.forEach((n, i) => {
      result[i % 3][0] = Math.min(result[i % 3][0], n)
      result[i % 3][1] = Math.max(result[i % 3][1], n)
    })
  return result
}
describe('accepted structural composition', () => {
  it('preserves every exterior assembly and label from before the interior refactor', () => {
    const hash = createHash('sha256')
    let count = 0
    for (const a of scene.assemblies) {
      if (scene.interiorAssemblyIds.has(a.id)) continue
      hash.update(JSON.stringify(a))
      for (const p of pieces.get(a.id) ?? []) hash.update(JSON.stringify(p))
      count++
    }
    for (const l of scene.labels)
      if (!scene.interiorLabels.has(l)) hash.update(JSON.stringify(l))
    expect({ count, digest: hash.digest('hex') }).toMatchSnapshot()
  })
})

it('retains three contiguous horizontal lounge crowns', () => {
  const ids = ['lounge-divider', 'lounge-middle-wall', 'lounge-right-wall']
  for (let i = 0; i < ids.length; i++) {
    const body = bounds(ids[i])
    if (i > 0) {
      const previous = bounds(ids[i - 1])
      expect(previous[0][1]).toBeCloseTo(body[0][0], 8)
      expect(previous[2][1]).toBeLessThan(body[2][1])
      expect(previous[1]).toEqual(body[1].map((v) => expect.closeTo(v, 8)))
    }
    const cap = bounds(ids[i] + '-cap')
    for (const part of pieces.get(ids[i] + '-cap') ?? []) {
      for (const mesh of [part.mesh, part.distant?.mesh ?? part.mesh]) {
        const top = [0, 1].map((side) => {
          const heights: number[] = []
          for (let n = 0; n < mesh.positions.length; n += 3)
            if (Math.abs(mesh.positions[n] - cap[0][side]) < 1e-8)
              heights.push(mesh.positions[n + 2])
          return Math.max(...heights)
        })
        expect(top[0]).toBeCloseTo(top[1], 8)
      }
    }
  }
})

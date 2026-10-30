import { beforeAll, expect, it } from 'vitest'
import { composeOfficeSeating } from '../office-seating'
import { placeParts, type AssetPart } from '../../assets/catalog'

const instances = new Map<string, AssetPart[]>()
beforeAll(() => {
  composeOfficeSeating({
    add(id, _asset, parts, position, rotation, scale) {
      if (!position || rotation === undefined || !scale) {
        throw new Error(`Missing measured transform for ${id}`)
      }
      instances.set(id, placeParts(parts, position, rotation, scale))
    }
  })
})

// Retain the original source-width anchors. The former all-axis pixel fit is
// rejected: fitting its envelopes distorted the approved component proportions.
// seating-shape.test.ts independently checks the full XYZ proportions.
for (const [id, partId, sourceWidth] of [
  ['desk', 'top', 1.2353214803965886],
  ['meeting-table', 'top', 0.9418590411143951],
  ['lounge-coffee-table', 'top', 0.7221904654869099]
] as const) {
  it(`retains the source-width anchor on actual ${id} geometry`, () => {
    const parts = instances.get(id)
    const mesh = parts?.find((p) => p.id === partId)?.mesh
    if (!mesh || !parts) {
      throw new Error(`Missing ${id}/${partId}`)
    }
    const xs = mesh.positions.filter((_, i) => i % 3 === 0)
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(sourceWidth, 6)
    const zs = parts.flatMap((p) =>
      p.mesh.positions.filter((_, i) => i % 3 === 2)
    )
    expect(Math.min(...zs)).toBeCloseTo(0.38, 6)
  })
}

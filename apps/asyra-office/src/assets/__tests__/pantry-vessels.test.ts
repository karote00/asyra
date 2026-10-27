import { requiredSpecValue } from '../specification'
import { expect, it } from 'vitest'
import specification from '../../../../../assets/asyra-office/models/pantry-smallware/pantry-smallware-model-spec.json'
import { pantryVessel, type PantryVesselId } from '../pantry-vessels'
import { meshBounds } from '../../scene/room-furnishing-helpers'

for (const id of Object.keys(
  specification.sourceVariants.vessels
) as PantryVesselId[])
  it(`${id} retains closed material regions, source dimensions and bounded distant geometry`, () => {
    const parts = pantryVessel(id)
    const size = specification.sourceVariants.vessels[id].size
    const bounds = meshBounds(parts)
    expect(bounds[2][0]).toBeCloseTo(0, 6)
    for (let axis = 0; axis < 3; axis++)
      expect(bounds[axis][1] - bounds[axis][0]).toBeLessThanOrEqual(
        size[axis] + 1e-6
      )
    let triangles = 0
    for (const part of parts) {
      for (const mesh of [
        part.mesh,
        ...(part.distant ? [part.distant.mesh] : [])
      ]) {
        const edges = new Map<string, number>()
        for (let i = 0; i < mesh.indices.length; i += 3) {
          const vertices = mesh.indices.slice(i, i + 3).map((index) =>
            mesh.positions
              .slice(index * 3, index * 3 + 3)
              .map((v) => Number(v.toFixed(7)))
              .join(',')
          )
          expect(new Set(vertices).size, `${id}/${part.id} triangle`).toBe(3)
          for (let side = 0; side < 3; side++) {
            const edge = [vertices[side], vertices[(side + 1) % 3]]
              .sort()
              .join('|')
            edges.set(edge, (edges.get(edge) ?? 0) + 1)
          }
        }
        expect(
          [...edges.values()].every((count) => count === 2),
          `${id}/${part.id} closed`
        ).toBe(true)
      }
      triangles += part.mesh.indices.length / 3
      if (part.distant)
        expect(part.distant.mesh.indices.length).toBeLessThan(
          part.mesh.indices.length
        )
    }
    expect(triangles).toBeLessThan(6500)
  })

it('recolors a region without replacing its geometry or other appearance regions', () => {
  const original = pantryVessel('porcelain-floor-jar')
  const changed = pantryVessel('porcelain-floor-jar', { body: 0xabcdef })
  for (let i = 0; i < original.length; i++) {
    expect(changed[i].mesh).toEqual(original[i].mesh)
    expect(changed[i].color).toBe(
      original[i].id === 'body' ? 0xabcdef : original[i].color
    )
  }
})

it('keeps the porcelain foot decoration clear of the rounded body surface', () => {
  const band = pantryVessel('porcelain-floor-jar').find(
    (p) => p.id === 'foot-band'
  )
  if (!band) throw new Error('Missing porcelain foot band')
  for (let i = 0; i < band.mesh.positions.length; i += 3) {
    const [x, y, z] = band.mesh.positions.slice(i, i + 3)
    expect(z).toBeGreaterThanOrEqual(0.004)
    expect(z).toBeLessThanOrEqual(0.015)
    const bodyRadius = 0.048 + ((z - 0.004) / 0.011) * 0.008
    expect(Math.hypot(x, y) - bodyRadius).toBeGreaterThan(0.0002)
  }
})

it('retains the source jar height hierarchy and a full-width cream lid', () => {
  const height = (id: PantryVesselId) => meshBounds(pantryVessel(id))[2][1]
  expect(height('shelf-sage-jar') / height('shelf-cream-jar')).toBeGreaterThan(
    0.8
  )
  expect(height('shelf-spice-jar')).toBeCloseTo(0.12, 6)
  const lid = pantryVessel('shelf-cream-jar').filter((p) => p.id === 'lid')
  expect(meshBounds(lid)[0][1] - meshBounds(lid)[0][0]).toBeGreaterThan(0.14)
})

it('assigns removable painted porcelain to the jar body without extra overlay geometry', () => {
  const body = requiredSpecValue(
    pantryVessel('porcelain-floor-jar').find((p) => p.id === 'body'),
    'body'
  )
  expect(body.material).toBe('porcelain-floral')
  const zs = body.mesh.positions.filter((_, i) => i % 3 === 2)
  const top = Math.max(...zs)
  for (let i = 0; i < zs.length; i++)
    expect(body.mesh.uvs[i * 2 + 1]).toBeCloseTo(zs[i] / top, 6)
})

it('retains distinct neck finishes on the two pale source canisters', () => {
  for (const id of ['shelf-cream-jar', 'shelf-sage-jar'] as const)
    expect(pantryVessel(id).some((p) => p.id === 'collar')).toBe(true)
})

it('retains full reference detail across all shelf vessel regions without independent decimation', () => {
  for (const id of Object.keys(specification.sourceVariants.vessels).filter(
    (id) => id.startsWith('shelf-')
  ) as PantryVesselId[])
    expect(
      pantryVessel(id).every((p) => p.distant === undefined),
      id
    ).toBe(true)
})

it('keeps yellow and green paper labels separate from pale and ochre contents', () => {
  expect(pantryVessel('shelf-spice-jar').some((p) => p.id === 'lid')).toBe(
    false
  )
  for (const [id, color, labelColor] of [
    ['shelf-cream-jar', 0xe9dfc7, 0xc9af63],
    ['shelf-sage-jar', 0xb9a16a, 0x7d8655]
  ] as const) {
    const parts = pantryVessel(id)
    const label = requiredSpecValue(
      parts.find((p) => p.id === 'front-label'),
      'paper label'
    )
    const body = requiredSpecValue(
      parts.find((p) => p.id === 'body'),
      'glass'
    )
    expect(label.color).toBe(labelColor)
    expect(parts.find((p) => p.id === 'contents')?.color).toBe(color)
    const radius = meshBounds([body])[0][1]
    for (let i = 0; i < label.mesh.positions.length; i += 3) {
      const [x, y] = label.mesh.positions.slice(i, i + 2)
      expect(Math.hypot(x, y) - radius).toBeGreaterThan(0.00045)
      expect(y).toBeLessThan(0)
    }
  }
})

it('separates collar and lid vertical side ranges at their shared radius', () => {
  for (const id of ['shelf-sage-jar'] as const) {
    const regions = specification.sourceVariants.vessels[id].regions
    const collar = requiredSpecValue(
      regions.find((r) => r.id === 'collar'),
      'collar'
    )
    const lid = requiredSpecValue(
      regions.find((r) => r.id === 'lid'),
      'lid'
    )
    const collarTop = Math.max(
      ...requiredSpecValue(collar.profile, 'collar profile').map(([, z]) => z)
    )
    const lidBottom = Math.min(
      ...requiredSpecValue(lid.profile, 'lid profile').map(([, z]) => z)
    )
    expect(collarTop).toBeLessThanOrEqual(lidBottom)
  }
})

it('constructs the small condiment bottle as a capped container, not utensils or a waisted mill', () => {
  for (const id of ['shelf-amber-jar'] as const) {
    const parts = pantryVessel(id)
    expect(parts.some((p) => p.id === 'lid')).toBe(true)
    expect(parts.some((p) => /utensil|spoon|spatula|head/.test(p.id))).toBe(
      false
    )
    const body = requiredSpecValue(
      parts.find((p) => p.id === 'body'),
      'body'
    )
    const lid = requiredSpecValue(
      parts.find((p) => p.id === 'lid'),
      'lid'
    )
    const bodyBounds = meshBounds([body])
    const lidBounds = meshBounds([lid])
    expect(lidBounds[2][1]).toBeGreaterThan(bodyBounds[2][1])

    // A closed cap has triangles crossing the axis above the mouth.
    expect(
      lid.mesh.positions.some(
        (_, i, v) =>
          i % 3 === 0 &&
          Math.hypot(v[i], v[i + 1]) < 1e-7 &&
          v[i + 2] > bodyBounds[2][1]
      )
    ).toBe(true)
  }
  const amber = requiredSpecValue(
    pantryVessel('shelf-amber-jar').find((p) => p.id === 'body'),
    'amber body'
  )
  const middleRadii: number[] = []
  for (let t = 0; t < amber.mesh.indices.length; t += 3)
    for (let e = 0; e < 3; e++) {
      const a = amber.mesh.indices[t + e] * 3
      const b = amber.mesh.indices[t + ((e + 1) % 3)] * 3
      const p = amber.mesh.positions
      if (
        p[a + 2] < 0.1 * (0.1505 / 0.255) ===
        p[b + 2] < 0.1 * (0.1505 / 0.255)
      )
        continue
      const f = (0.1 * (0.1505 / 0.255) - p[a + 2]) / (p[b + 2] - p[a + 2])
      middleRadii.push(
        Math.hypot(
          p[a] + f * (p[b] - p[a]),
          p[a + 1] + f * (p[b + 1] - p[a + 1])
        )
      )
    }
  expect(middleRadii.length).toBeGreaterThan(0)
  expect(Math.min(...middleRadii)).toBeGreaterThan(0.04 * (0.1505 / 0.255))
})

it('separates all four clear jar shells from colored contents with visible empty headspace', () => {
  for (const id of [
    'shelf-cream-jar',
    'shelf-sage-jar',
    'shelf-brown-jar',
    'shelf-amber-jar'
  ] as const) {
    const parts = pantryVessel(id)
    const shell = requiredSpecValue(
      parts.find((p) => p.id === 'body'),
      'glass shell'
    )
    expect(shell.opacity ?? 1, id).toBeLessThanOrEqual(0.25)
    expect(shell.color).toBe(0xe8f0ee)
    const fill = requiredSpecValue(
      parts.find((p) => p.id === 'contents'),
      'independent contents'
    )
    expect(fill.opacity ?? 1).toBe(1)
    expect(
      fill.mesh.uvs.every((v) => v >= 0 && v <= 1),
      'content UVs must not clamp into stripes'
    ).toBe(true)
    const wall = meshBounds([shell]),
      contents = meshBounds([fill])
    expect(contents[2][0]).toBeGreaterThan(wall[2][0])
    expect(wall[2][1] - contents[2][1]).toBeGreaterThan(0.025)
    const recipe = requiredSpecValue(
      specification.sourceVariants.vessels[id].regions.find(
        (p) => p.id === 'body'
      ),
      'shell recipe'
    )
    const profile = requiredSpecValue(recipe.profile, 'profile')
    for (let i = 0; i < fill.mesh.positions.length; i += 3) {
      const [x, y, z] = fill.mesh.positions.slice(i, i + 3)
      const intersections: number[] = []
      for (let j = 1; j < profile.length; j++) {
        const [r0, z0] = profile[j - 1],
          [r1, z1] = profile[j]
        if (z0 === z1 || z < Math.min(z0, z1) || z > Math.max(z0, z1)) continue
        intersections.push(r0 + ((r1 - r0) * (z - z0)) / (z1 - z0))
      }
      expect(intersections.length).toBeGreaterThan(0)
      expect(Math.hypot(x, y)).toBeLessThan(Math.min(...intersections))
    }
    expect(parts.filter((p) => p.id.includes('label'))).toHaveLength(
      ['shelf-cream-jar', 'shelf-sage-jar'].includes(id) ? 1 : 0
    )
    const changed = pantryVessel(id, { contents: 0x123456 })
    expect(changed.find((p) => p.id === 'body')?.color).toBe(shell.color)
    expect(changed.find((p) => p.id === 'contents')?.color).toBe(0x123456)
  }
})

it('gives the brown jar a recessed neck and broad flat inserted cork', () => {
  const parts = pantryVessel('shelf-brown-jar')
  const body = requiredSpecValue(
    parts.find((p) => p.id === 'body'),
    'body'
  )
  const cork = requiredSpecValue(
    parts.find((p) => p.id === 'lid'),
    'cork'
  )
  const b = meshBounds([body]),
    c = meshBounds([cork])
  const neckRadii = body.mesh.positions.flatMap((_, i, p) =>
    i % 3 === 0 && p[i + 2] > 0.174 ? [Math.hypot(p[i], p[i + 1])] : []
  )
  expect(neckRadii.length).toBeGreaterThan(0)
  expect(Math.max(...neckRadii)).toBeGreaterThan(b[0][1] * 0.85)
  expect(Math.max(...neckRadii)).toBeLessThan(b[0][1] * 0.96)
  expect(c[2][0]).toBeLessThan(b[2][1])
  expect(b[2][1] - c[2][0]).toBeGreaterThanOrEqual(0.012)
  expect(c[0][1]).toBeLessThanOrEqual(Math.max(...neckRadii) + 0.001)
  const corkProfile = requiredSpecValue(
    specification.sourceVariants.vessels['shelf-brown-jar'].regions.find(
      (p) => p.id === 'lid'
    )?.profile,
    'cork profile'
  )
  for (let i = 1; i < corkProfile.length; i++) {
    const [r0] = corkProfile[i - 1],
      [r1] = corkProfile[i]
    if (r0 > 0 && r1 > 0) expect(Math.abs(r1 - r0)).toBeLessThan(0.006)
  }
  const top = c[2][1]
  const flatTopRadius = Math.max(
    ...cork.mesh.positions.flatMap((_, i, p) =>
      i % 3 === 0 && Math.abs(p[i + 2] - top) < 1e-6
        ? [Math.hypot(p[i], p[i + 1])]
        : []
    )
  )
  expect(flatTopRadius).toBeGreaterThan(c[0][1] * 0.9)
  expect(parts.some((p) => p.id === 'lid-center')).toBe(false)
})

it('gives the small chili-style bottle a long narrow neck above its shoulder', () => {
  const parts = pantryVessel('shelf-amber-jar')
  const body = requiredSpecValue(
    parts.find((p) => p.id === 'body'),
    'bottle'
  )
  const profile = requiredSpecValue(
    specification.sourceVariants.vessels['shelf-amber-jar'].regions.find(
      (p) => p.id === 'body'
    )?.profile,
    'bottle profile'
  )
  const bodyRadius = meshBounds([body])[0][1]
  const narrow = profile.filter(
    ([r, z]) => r > 0 && r < bodyRadius * 0.5 && z > 0.16 * (0.1505 / 0.255)
  )
  expect(narrow.length).toBeGreaterThan(2)
  expect(
    Math.max(...narrow.map(([, z]) => z)) -
      Math.min(...narrow.map(([, z]) => z))
  ).toBeGreaterThan(0.045 * (0.1505 / 0.255))
  const lid = requiredSpecValue(
    parts.find((p) => p.id === 'lid'),
    'cap'
  )
  expect(meshBounds([lid])[0][1]).toBeLessThan(bodyRadius * 0.6)
})

// Flat cork caps use planar UVs so their grain cannot form radial fan streaks.
it('maps the flat cork top in XY space without a UV seam through its center', () => {
  const lid = requiredSpecValue(
    pantryVessel('shelf-brown-jar').find((p) => p.id === 'lid'),
    'cork'
  )
  const top = Math.max(...lid.mesh.positions.filter((_, i) => i % 3 === 2))
  const extent = Math.max(top, 2 * Math.PI * meshBounds([lid])[0][1])
  expect(lid.mesh.uvs.every((v) => v >= 0 && v <= 1)).toBe(true)
  for (let i = 0; i < lid.mesh.positions.length / 3; i++) {
    const [x, y, z] = lid.mesh.positions.slice(i * 3, i * 3 + 3)
    if (z !== top) continue
    expect(lid.mesh.uvs[i * 2]).toBeCloseTo(x / extent + 0.5, 6)
    expect(lid.mesh.uvs[i * 2 + 1]).toBeCloseTo(y / extent + 0.5, 6)
  }
})

it('sizes the fourth bottle to seventy percent of the third jar without changing aspect ratio', () => {
  const third = meshBounds(pantryVessel('shelf-brown-jar'))
  const fourth = meshBounds(pantryVessel('shelf-amber-jar'))
  const height = fourth[2][1] - fourth[2][0]
  expect(height).toBeCloseTo((third[2][1] - third[2][0]) * 0.7, 9)
  expect(height).toBeCloseTo(0.1505, 9)
  for (const axis of [0, 1])
    expect((fourth[axis][1] - fourth[axis][0]) / height).toBeCloseTo(
      0.105 / 0.255,
      9
    )
  expect(fourth[2][0]).toBeCloseTo(0, 9)
  const parts = pantryVessel('shelf-amber-jar')
  for (const [id, top] of [
    ['body', 0.236],
    ['contents', 0.153],
    ['lid', 0.255]
  ] as const)
    expect(
      meshBounds(parts.filter((p) => p.id === id))[2][1] / height
    ).toBeCloseTo(top / 0.255, 9)
})

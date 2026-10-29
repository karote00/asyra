import spec from '../../../../assets/asyra-office/models/small-plants/shelf-botanical-model-spec.json'
import { append, emptyMesh, loft, tube, type Mesh, type Vec } from './geometry'
import { part, placeParts, type AssetPart, type SurfaceKind } from './catalog'
import { revolveProfile, roundedProfile } from './plant-vessels'

export type ShelfBotanicalForm = keyof typeof spec.variants

/** Sample the authored hollow section before adding shallow exterior relief. */
function vessel(form: ShelfBotanicalForm): Mesh {
  const recipe = spec.variants[form]
  const section = roundedProfile(
    recipe.potProfileRZ,
    spec.construction.sectionRoundingRadius,
    spec.construction.sectionRoundingSegments
  )
  const dense: [number, number][] = [[...section[0]]]
  let carry = 0
  for (let j = 1; j < section.length; j++) {
    const a = section[j - 1],
      b = section[j]
    const length = Math.hypot(b[0] - a[0], b[1] - a[1])
    const spacing = spec.construction.sectionSampleSpacing
    let distance = spacing - carry
    while (distance < length) {
      const t = distance / length
      dense.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
      distance += spacing
    }
    carry = length - (distance - spacing)
  }
  dense.push([...section[section.length - 1]])
  const radialSegments =
    form === 'succulent' ? 64 : spec.construction.radialSegments
  const mesh = revolveProfile(dense, radialSegments)
  const top = Math.max(...dense.map((p) => p[1]))
  // Only the rising exterior receives relief; inner cavity and base remain intact.
  let exterior = true,
    offset = 0
  dense.forEach(([radius, z], j) => {
    if (j && z < dense[j - 1][1]) exterior = false
    const count = radius === 0 ? 1 : radialSegments
    for (let i = 0; i < count; i++) {
      if (exterior && radius > 0 && recipe.relief.depth) {
        const angle = (i / radialSegments) * Math.PI * 2
        let wave = Math.cos(angle * recipe.relief.count)
        if (recipe.relief.pitch)
          wave = Math.cos(
            angle * recipe.relief.count +
              Math.sin((z / recipe.relief.pitch) * Math.PI * 2) * 1.7
          )
        const fade = Math.sin(Math.PI * Math.min(1, z / top)) ** 0.45
        const r = radius + wave * recipe.relief.depth * fade
        mesh.positions[(offset + i) * 3] = r * Math.cos(angle)
        mesh.positions[(offset + i) * 3 + 1] = r * Math.sin(angle)
      }
    }
    offset += count
  })
  return mesh
}

interface Leaf {
  rootZ: number
  reach: number
  tipZ: number
  width: number
  arch: number
}
/** Closed curved blade with real thickness, a rounded cross-section and welded poles. */
function blade(
  entry: Leaf,
  angle: number,
  thickness: number,
  form: ShelfBotanicalForm
): Mesh {
  const mesh = emptyMesh(),
    rings: number[][] = []
  const steps = 24,
    sides = 12
  const er = [Math.cos(angle), Math.sin(angle)]
  const et = [-er[1], er[0]]
  const dz = entry.tipZ - entry.rootZ
  const length = Math.hypot(entry.reach, dz)
  const nr = -dz / length,
    nz = entry.reach / length
  for (let i = 0; i <= steps; i++) {
    const t = i / steps,
      sin = Math.sin(Math.PI * t)
    const r = 0.007 + (entry.reach - 0.007) * t
    const z = entry.rootZ + dz * t + entry.arch * sin
    const power = form === 'snake' ? 0.55 : 0.85
    const halfWidth = (entry.width / 2) * sin ** power
    const ring: number[] = []
    const count = i === 0 || i === steps ? 1 : sides
    for (let j = 0; j < count; j++) {
      const theta = (j / sides) * Math.PI * 2
      const q = Math.cos(theta)
      const bulge = (thickness / 2) * sin * Math.sin(theta)
      const cup =
        form === 'succulent' ? 0.003 * sin * q * q : 0.0015 * sin * q * q
      ring.push(mesh.positions.length / 3)
      mesh.positions.push(
        (r + nr * (bulge + cup)) * er[0] + halfWidth * q * et[0],
        (r + nr * (bulge + cup)) * er[1] + halfWidth * q * et[1],
        z + nz * (bulge + cup)
      )
      mesh.uvs.push(t, (q + 1) / 2)
    }
    rings.push(ring)
  }
  for (let i = 0; i < steps; i++)
    for (let j = 0; j < sides; j++) {
      const a = rings[i][j % rings[i].length],
        b = rings[i][(j + 1) % rings[i].length]
      const c = rings[i + 1][j % rings[i + 1].length],
        d = rings[i + 1][(j + 1) % rings[i + 1].length]
      if (a !== b) mesh.indices.push(a, b, d)
      if (c !== d) mesh.indices.push(a, d, c)
    }
  return mesh
}

/** Revolved ovals weld both poles, including small facial features and stones. */
function closedOval(radii: Vec, segments: number, rings: number): Mesh {
  const profile: [number, number][] = Array.from(
    { length: rings + 1 },
    (_, i) => {
      const angle = (i / rings) * Math.PI
      return [i === 0 || i === rings ? 0 : Math.sin(angle), -Math.cos(angle)]
    }
  )
  const mesh = revolveProfile(profile, segments)
  for (let i = 0; i < mesh.positions.length; i++)
    mesh.positions[i] *= radii[i % 3]
  return mesh
}

function catDetails(color: number): AssetPart[] {
  const c = spec.variants.succulent.cat
  const ears = emptyMesh(),
    feet = emptyMesh(),
    face = emptyMesh()
  for (const sign of [-1, 1]) {
    append(
      ears,
      loft(
        Array.from({ length: 9 }, (_, i) => {
          const t = i / 8,
            taper = Math.max(0.025, 1 - t ** 0.8)
          return [
            c.earBaseZ + t * (c.earTipZ - c.earBaseZ),
            c.earFrontX - t * 0.004,
            sign * (c.earSideOffset + t * 0.002),
            c.earBaseRadii[0] * Math.max(0.08, 1 - t ** 4),
            c.earBaseRadii[1] * taper
          ]
        }),
        20
      )
    )
    append(feet, closedOval(c.feetRadii as Vec, 16, 8), [
      0.02,
      sign * c.feetSideOffset,
      c.feetZ
    ])
  }
  // The face is on +X, toward the room, and follows the vessel's curved front.
  const facePoint = (y: number, z: number): Vec => {
    const profile = spec.variants.succulent.potProfileRZ
    let radius = 0
    for (let i = 0; i < profile.length - 1; i++) {
      const a = profile[i],
        b = profile[i + 1]
      if (b[1] <= a[1] || z < a[1] || z > b[1]) continue
      radius = Math.max(
        radius,
        a[0] + ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1])
      )
    }
    return [Math.sqrt(Math.max(0, radius * radius - y * y)) + 0.0007, y, z]
  }
  for (const sign of [-1, 1]) {
    append(
      face,
      closedOval([0.001, c.eyeRadius, c.eyeRadius], 12, 6),
      facePoint(sign * c.eyeSideOffset, c.eyeZ)
    )
    for (let i = -1; i <= 1; i++)
      append(
        face,
        tube(
          [
            facePoint(sign * 0.025, 0.048 + i * 0.003),
            facePoint(sign * 0.037, 0.048 + i * 0.005)
          ],
          c.lineRadius,
          6
        )
      )
    append(
      face,
      tube(
        [
          facePoint(0, c.noseZ),
          facePoint(0, c.noseZ - 0.005),
          facePoint(sign * 0.004, c.noseZ - 0.007),
          facePoint(sign * 0.007, c.noseZ - 0.005)
        ],
        c.lineRadius,
        6
      )
    )
  }
  append(
    face,
    closedOval([0.001, 0.0026, 0.0017], 12, 6),
    facePoint(0, c.noseZ)
  )
  return [
    part('cat-ears', ears, color, 'ceramic', 0.42),
    part('cat-feet', feet, color, 'ceramic', 0.42),
    part(
      'cat-face',
      face,
      Number.parseInt(c.faceColor.slice(1), 16),
      'plain',
      0.8
    )
  ]
}

/** Reference-specific botanical assets; colors and scale remain caller-owned. */
export function shelfBotanical(
  form: ShelfBotanicalForm,
  color: number,
  scale = 1,
  seed = 701
): AssetPart[] {
  if (!Number.isFinite(scale) || scale <= 0)
    throw new Error('Invalid plant scale')
  if (!Number.isInteger(seed) || seed < 0 || seed >= 2 ** 32)
    throw new Error('Invalid unsigned 32-bit seed')
  const r = spec.variants[form]
  let state = seed
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
  const parts = [
    part('pot', vessel(form), color, 'ceramic', 0.42),
    part(
      'soil',
      revolveProfile(
        [
          [0, r.soilZ - 0.006],
          [r.soilRadius, r.soilZ - 0.006],
          [r.soilRadius, r.soilZ],
          [0, r.soilZ]
        ],
        48
      ),
      0x40342a,
      'plain'
    )
  ]
  let index = 0
  r.leafRings.forEach((ring, tier) => {
    for (let i = 0; i < ring.count; i++) {
      const angle =
        (i / ring.count + tier * 0.17 + (random() - 0.5) * 0.055) * Math.PI * 2
      const leaf = {
        ...ring,
        reach: ring.reach * (0.91 + random() * 0.15),
        tipZ: ring.tipZ + (random() - 0.5) * 0.012,
        width: ring.width * (0.92 + random() * 0.16)
      }
      const mesh = blade(leaf, angle, r.leafThickness, form)
      for (let j = 0; j < mesh.positions.length; j += 3) {
        mesh.positions[j] *= r.foliageXY[0]
        mesh.positions[j + 1] *= r.foliageXY[1]
      }
      const leafColor =
        form === 'succulent' ? [0x688342, 0x78964b, 0x56733a][tier] : 0xffffff
      parts.push(
        part(`leaf-${index++}`, mesh, leafColor, r.surface as SurfaceKind, 0.65)
      )
      if (form === 'fittonia')
        parts.push(
          part(
            `petiole-${index}`,
            tube(
              [
                [0, 0, r.soilZ],
                [0.007 * Math.cos(angle), 0.007 * Math.sin(angle), leaf.rootZ]
              ],
              0.0012,
              6
            ),
            0x61723a,
            'leaf'
          )
        )
    }
  })
  if (form === 'succulent') parts.push(...catDetails(color))
  if (form === 'snake') {
    const stones = emptyMesh(),
      p = spec.variants.snake.pebbles
    for (let i = 0; i < p.count; i++) {
      const angle = i * 2.39996,
        radius = 0.015 + Math.sqrt(i / p.count) * 0.032
      append(
        stones,
        closedOval([p.radius, p.radius * 0.8, p.radius * 0.65], 10, 6),
        [Math.cos(angle) * radius, Math.sin(angle) * radius, r.soilZ + 0.002]
      )
    }
    parts.push(
      part('pebbles', stones, Number.parseInt(p.color.slice(1), 16), 'plain')
    )
  }
  return placeParts(parts, [0, 0, 0], 0, [scale, scale, scale])
}

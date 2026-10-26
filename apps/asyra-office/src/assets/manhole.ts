import specification from '../../../../assets/asyra-office/models/street/street-model-spec.json'
import { emptyMesh, lathe } from './geometry'
import { part, type AssetPart } from './catalog'
import { requiredSpecValue } from './specification'
const spec = requiredSpecValue(
  specification.modules.find((m) => m.moduleId === 'road-drain-cover-round'),
  'manhole'
)
export function manhole(): AssetPart[] {
  const rim = requiredSpecValue(spec.rim, 'rim'),
    cover = requiredSpecValue(spec.cover, 'cover'),
    slots = requiredSpecValue(spec.slots, 'slots')
  const top = cover.zRangeMetres[1],
    bottom = cover.zRangeMetres[0],
    relief = cover.radialProfile
  const b = rim.bevelMetres,
    r0 = rim.innerRadiusMetres,
    r1 = rim.outerRadiusMetres,
    z0 = rim.zRangeMetres[0]
  const frame = lathe(
    [
      [r0, z0],
      [r1, z0],
      [r1, -b],
      [r1 - b, 0],
      [r0 + b, 0],
      [r0, -b],
      [r0, z0]
    ],
    128
  )
  const angles = [...Array.from({ length: 129 }, (_, i) => (i * Math.PI) / 64)]
  for (let j = 0; j < slots.count; j++)
    for (const delta of [
      -3, -2.2, -1.8, -1.4, -1, -0.6, -0.3, 0, 0.3, 0.6, 1, 1.4, 1.8, 2.2, 3
    ])
      angles.push(
        ((slots.firstAngleDegrees + j * slots.angleStepDegrees + delta) *
          Math.PI) /
          180
      )
  angles.sort((a, b) => a - b)
  const boundaries = relief.radialBoundariesMetres
  const radii = [
    0,
    slots.centreRadiusMetres,
    ...boundaries.slice(1).flatMap((r) => [r - 0.0002, r, r + 0.0002]),
    ...Array.from({ length: 37 }, (_, i) => 0.175 + i * 0.002)
  ].filter((r) => r <= cover.radiusMetres)
  radii.sort((a, b) => a - b)
  const unique = radii.filter((v, i) => !i || v - radii[i - 1] > 1e-10),
    theta = angles.filter((v, i) => !i || v - angles[i - 1] > 1e-10),
    mesh = emptyMesh(),
    n = theta.length
  const surface = (r: number, t: number) => {
    let z = top
    if (
      r <= boundaries[1] ||
      (r >= boundaries[2] && r <= boundaries[3]) ||
      (r >= boundaries[4] && r <= boundaries[5])
    )
      z += relief.raisedHeightMetres
    for (let j = 0; j < slots.count; j++) {
      const angle =
        ((slots.firstAngleDegrees + j * slots.angleStepDegrees) * Math.PI) / 180
      const x = r * Math.cos(t - angle) - slots.centreRadiusMetres,
        y = r * Math.sin(t - angle),
        half = (slots.lengthMetres - slots.widthMetres) / 2
      const distance =
        Math.hypot(Math.max(Math.abs(x) - half, 0), y) - slots.widthMetres / 2
      z -= slots.depthMetres * Math.max(0, Math.min(1, -distance / 0.0005))
    }
    return z
  }
  for (const r of unique)
    for (const t of theta) {
      mesh.positions.push(r * Math.cos(t), r * Math.sin(t), surface(r, t))
      mesh.uvs.push(
        0.5 + (r * Math.cos(t)) / 0.66,
        0.5 + (r * Math.sin(t)) / 0.66
      )
    }
  for (let j = 0; j < unique.length - 1; j++)
    for (let i = 0; i < n - 1; i++) {
      const a = j * n + i,
        b = a + n,
        c = a + 1,
        d = b + 1
      mesh.indices.push(a, b, d)
      if (j > 0) mesh.indices.push(a, d, c)
    }
  const edge = (unique.length - 1) * n,
    base = mesh.positions.length / 3
  for (const t of theta) {
    mesh.positions.push(
      cover.radiusMetres * Math.cos(t),
      cover.radiusMetres * Math.sin(t),
      bottom
    )
    mesh.uvs.push(0, 0)
  }
  const centre = mesh.positions.length / 3
  mesh.positions.push(0, 0, bottom)
  mesh.uvs.push(0.5, 0.5)
  for (let i = 0; i < n - 1; i++) {
    mesh.indices.push(
      edge + i,
      base + i,
      base + i + 1,
      edge + i,
      base + i + 1,
      edge + i + 1,
      centre,
      base + i + 1,
      base + i
    )
  }
  const color = parseInt(
    specification.materials.iron.baseColorSRGB.slice(1),
    16
  )
  return [
    part('frame', frame, color, 'metal'),
    part('cover', mesh, color, 'metal')
  ]
}

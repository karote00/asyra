import { createPlantGrowth } from './plant-growth'
import { requiredSpecValue } from './specification'
import spec from '../../../../assets/asyra-office/models/small-plants/small-plants-model-spec.json'
import { emptyMesh, tube, type Vec } from './geometry'
import { part, placeParts, type AssetPart } from './catalog'
import { roundedProfile, revolveProfile, clippedSoil } from './plant-vessels'

const source = spec.modules[0]
const pot = requiredSpecValue(
  source.components
    .filter((c) => 'profileRZ' in c)
    .find((c) => c.partId === 'pot'),
  'small plant pot'
)
const foliage = requiredSpecValue(
  source.components
    .filter((c) => 'instances' in c)
    .find((c) => c.partId === 'leaves'),
  'small plant leaves'
)

const stem = requiredSpecValue(
  source.components
    .filter((c) => 'bottomRadius' in c)
    .find((c) => c.partId === 'stem'),
  'plant stem'
)
const soil = requiredSpecValue(
  source.components.find((c) => c.partId === 'soil'),
  'plant soil'
)
const petioles = requiredSpecValue(
  source.components.find((c) => c.partId === 'petioles'),
  'plant petioles'
)

/** Seeded foliage retains the approved closed folded blade and vessel construction. */
export function planter(
  scale = 1,
  color = 0xe8dbc3,
  seed = requiredSpecValue(source.growth, 'plant growth recipe').defaultSeed,
  form: 'stemmed' | 'rosette' = 'stemmed'
): AssetPart[] {
  if (!Number.isFinite(scale) || scale <= 0)
    throw new Error('Invalid plant scale')
  const variant =
    form === 'rosette'
      ? requiredSpecValue(source.growthVariants, 'plant growth variants')
          .rosette
      : undefined
  const leaves = createPlantGrowth(
    seed,
    variant?.scaffold ??
      requiredSpecValue(
        'instances' in foliage ? foliage.instances : undefined,
        'leaf shape scaffold'
      ),
    variant?.growth ?? requiredSpecValue(source.growth, 'plant growth recipe')
  )
  const profile = roundedProfile(
    requiredSpecValue(pot.profileRZ, 'pot profile'),
    requiredSpecValue(pot.edgeBevel, 'pot bevel'),
    requiredSpecValue(pot.bevelSegments, 'pot bevel segments')
  )
  const parts: AssetPart[] = [
    part(
      'pot',
      revolveProfile(
        profile,
        requiredSpecValue(pot.radialSegments, 'pot segments')
      ),
      color,
      'ceramic',
      spec.materials.ceramic.roughness
    ),
    part(
      'soil',
      revolveProfile(
        clippedSoil(
          profile,
          requiredSpecValue(soil.radius, 'soil radius'),
          requiredSpecValue(soil.zMin, 'soil bottom'),
          requiredSpecValue(soil.zMax, 'soil top')
        ),
        requiredSpecValue(soil.radialSegments, 'soil segments')
      ),
      0x554432,
      'plain',
      spec.materials.soil.roughness
    ),
    part(
      'stem',
      tube(
        [
          [0, 0, requiredSpecValue(stem.zMin, 'stem bottom')],
          [0, 0, variant?.stemTop ?? requiredSpecValue(stem.zMax, 'stem top')]
        ],
        [
          requiredSpecValue(
            'bottomRadius' in stem ? stem.bottomRadius : undefined,
            'stem radius'
          ),
          requiredSpecValue(
            'topRadius' in stem ? stem.topRadius : undefined,
            'stem radius'
          )
        ],
        requiredSpecValue(stem.radialSegments, 'stem segments')
      ),
      0x526c3c,
      'leaf',
      spec.materials.stem.roughness
    )
  ]
  leaves.forEach((entry, index) => {
    const a = (entry.azimuthDegrees * Math.PI) / 180
    const er: Vec = [Math.cos(a), Math.sin(a), 0]
    const et: Vec = [-Math.sin(a), Math.cos(a), 0]
    const mesh = emptyMesh()
    const rows: number[][][] = []
    for (const sign of [1, -1]) {
      const skin: number[][] = []
      for (let i = 0; i <= 24; i++) {
        const t = i / 24
        const r = 0.009 + (entry.tipRadius - 0.009) * t
        const z =
          entry.attachZ +
          0.005 +
          (entry.tipZ - entry.attachZ - 0.005) * t +
          0.008 * entry.archScale * Math.sin(Math.PI * t)
        const width = (entry.width / 2) * Math.sin(Math.PI * t) ** 0.85
        const row: number[] = []
        for (let j = 0; j <= 8; j++) {
          if ((i === 0 || i === 24) && j > 0) {
            row.push(row[0])
            continue
          }
          const q = j / 4 - 1
          row.push(mesh.positions.length / 3)
          mesh.positions.push(
            r * er[0] +
              (entry.lateralBend * Math.sin(Math.PI * t) +
                q * width * Math.cos(entry.roll)) *
                et[0],
            r * er[1] +
              (entry.lateralBend * Math.sin(Math.PI * t) +
                q * width * Math.cos(entry.roll)) *
                et[1],
            z +
              q * width * Math.sin(entry.roll) +
              0.003 * (1 - Math.abs(q)) * Math.sin(Math.PI * t) +
              sign * 0.0003
          )
          mesh.uvs.push(t, (q + 1) / 2)
        }
        skin.push(row)
      }
      const tri = (a: number, b: number, c: number) => {
        if (a === b || b === c || c === a) return
        mesh.indices.push(...(sign > 0 ? [a, b, c] : [a, c, b]))
      }
      for (let i = 0; i < 24; i++)
        for (let j = 0; j < 8; j++) {
          tri(skin[i][j], skin[i + 1][j], skin[i + 1][j + 1])
          tri(skin[i][j], skin[i + 1][j + 1], skin[i][j + 1])
        }
      rows.push(skin)
    }
    const boundary = [
      rows[0][0][0],
      ...rows[0].slice(1).map((r) => r[8]),
      ...rows[0]
        .slice(1, 24)
        .reverse()
        .map((r) => r[0])
    ]
    const lower = [
      rows[1][0][0],
      ...rows[1].slice(1).map((r) => r[8]),
      ...rows[1]
        .slice(1, 24)
        .reverse()
        .map((r) => r[0])
    ]
    boundary.reverse()
    lower.reverse()
    const rim = mesh.positions.length / 3
    boundary.forEach((id, i) => {
      for (const [v, side] of [
        [id, 1],
        [lower[i], 0]
      ]) {
        mesh.positions.push(...mesh.positions.slice(v * 3, v * 3 + 3))
        mesh.uvs.push(i / boundary.length, side)
      }
    })
    for (let i = 0; i < boundary.length; i++) {
      const a = rim + i * 2,
        b = rim + ((i + 1) % boundary.length) * 2
      mesh.indices.push(a, a + 1, b + 1, a, b + 1, b)
    }
    parts.push(
      part(
        `leaf-${index}`,
        mesh,
        variant
          ? Number.parseInt(variant.leafColorSRGB.slice(1), 16)
          : 0x718752,
        'leaf',
        spec.materials.leaf.roughness
      )
    )
    parts.push(
      part(
        `petiole-${index}`,
        tube(
          [
            [0, 0, entry.attachZ],
            [0.009 * er[0], 0.009 * er[1], entry.attachZ + 0.005]
          ],
          requiredSpecValue(petioles.radius, 'petiole radius'),
          requiredSpecValue(petioles.radialSegments, 'petiole segments')
        ),
        0x526c3c,
        'leaf',
        spec.materials.stem.roughness
      )
    )
  })
  return placeParts(parts, [0, 0, 0], 0, [scale, scale, scale])
}

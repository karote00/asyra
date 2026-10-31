import { createPlantGrowth, createShrubSprigs } from './plant-growth'
import { requiredSpecValue } from './specification'
import spec from '../../../../assets/asyra-office/models/small-plants/small-plants-model-spec.json'
import { emptyMesh, tube, type Vec } from './geometry'
import { part, placeParts, type AssetPart } from './catalog'
import {
  roundedProfile,
  revolveProfile,
  squareProfile,
  clippedSoil
} from './plant-vessels'

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

type PlantVariant = NonNullable<typeof source.growthVariants>[keyof NonNullable<
  typeof source.growthVariants
>] & {
  leafColorsSRGB?: readonly string[]
  foliageScale?: readonly number[]
}

/** Seeded foliage retains the approved closed folded blade and vessel construction. */
export function planter(
  scale = 1,
  color = 0xe8dbc3,
  seed = requiredSpecValue(source.growth, 'plant growth recipe').defaultSeed,
  form: 'stemmed' | keyof NonNullable<typeof source.growthVariants> = 'stemmed'
): AssetPart[] {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error('Invalid plant scale')
  }
  const variant: PlantVariant | undefined =
    form !== 'stemmed'
      ? requiredSpecValue(source.growthVariants, 'plant growth variants')[form]
      : undefined
  const crown =
    form === 'shrub'
      ? requiredSpecValue(source.growthVariants, 'plant growth variants').shrub
          .crown
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
  const sprigs = crown ? createShrubSprigs(leaves) : undefined
  const vessel =
    form === 'broadleaf-square'
      ? requiredSpecValue(source.growthVariants, 'plant variants')[
          'broadleaf-square'
        ].vessel
      : undefined
  const vessels = requiredSpecValue(source.vessels, 'vessel profiles')
  const roundVessel =
    variant && 'vesselId' in variant
      ? requiredSpecValue(
          vessels[variant.vesselId as keyof typeof vessels],
          'round vessel recipe'
        )
      : undefined
  const profile = roundedProfile(
    vessel?.profileHalfWidthZ ??
      roundVessel?.profileRZ ??
      requiredSpecValue(pot.profileRZ, 'pot profile'),
    vessel?.sectionBevel ??
      roundVessel?.sectionBevel ??
      requiredSpecValue(pot.edgeBevel, 'pot bevel'),
    requiredSpecValue(pot.bevelSegments, 'pot bevel segments')
  )
  const vesselSoilTop = vessel?.soilTop ?? roundVessel?.soilTop
  const stemBottom =
    vesselSoilTop === undefined
      ? requiredSpecValue(stem.zMin, 'stem bottom')
      : vesselSoilTop - 0.004
  const parts: AssetPart[] = [
    part(
      'pot',
      vessel
        ? squareProfile(profile, vessel.cornerRadius)
        : revolveProfile(
            profile,
            roundVessel?.radialSegments ??
              crown?.radialSegments ??
              requiredSpecValue(pot.radialSegments, 'pot segments')
          ),
      color,
      'ceramic',
      spec.materials.ceramic.roughness
    ),
    part(
      'soil',
      vessel
        ? squareProfile(
            clippedSoil(
              profile,
              vessel.soilHalfWidth,
              vessel.soilBottom,
              vessel.soilTop
            ),
            vessel.cornerRadius
          )
        : revolveProfile(
            clippedSoil(
              profile,
              roundVessel?.soilRadius ??
                requiredSpecValue(soil.radius, 'soil radius'),
              roundVessel?.soilBottom ??
                requiredSpecValue(soil.zMin, 'soil bottom'),
              roundVessel?.soilTop ?? requiredSpecValue(soil.zMax, 'soil top')
            ),
            roundVessel?.radialSegments ??
              crown?.radialSegments ??
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
          [0, 0, stemBottom],
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
  if (sprigs && crown) {
    for (const [index, path] of sprigs.branches.entries()) {
      parts.push(
        part(
          `sprig-${index}`,
          tube(
            path.map((p) => p as Vec),
            [crown.sprigRadius, crown.sprigRadius * 0.65, crown.petioleRadius],
            crown.petioleSegments
          ),
          0x526c3c,
          'leaf',
          spec.materials.stem.roughness
        )
      )
    }
  }
  leaves.forEach((entry, index) => {
    const origin = sprigs?.origins[index] ?? [0, 0, entry.attachZ]
    const a = (entry.azimuthDegrees * Math.PI) / 180
    const er: Vec = [Math.cos(a), Math.sin(a), 0]
    const et: Vec = [-Math.sin(a), Math.cos(a), 0]
    const archFraction = variant
      ? (entry.archScale - variant.growth.archScale[0]) /
        (variant.growth.archScale[1] - variant.growth.archScale[0])
      : 0
    const pitch = crown
      ? ((crown.pitchDegrees[0] +
          archFraction * (crown.pitchDegrees[1] - crown.pitchDegrees[0])) *
          Math.PI) /
        180
      : 0
    const normalR = -Math.sin(pitch),
      normalZ = Math.cos(pitch)
    const mesh = emptyMesh()
    const longitudinal = crown?.longitudinalSteps ?? 24,
      lateral = crown?.lateralSteps ?? 8
    const rows: number[][][] = []
    for (const sign of [1, -1]) {
      const skin: number[][] = []
      for (let i = 0; i <= longitudinal; i++) {
        const t = i / longitudinal
        const r = crown
          ? 0.009 + Math.cos(pitch) * entry.tipRadius * t
          : 0.009 + (entry.tipRadius - 0.009) * t
        const z =
          origin[2] +
          0.005 +
          (crown
            ? Math.sin(pitch) * entry.tipRadius
            : entry.tipZ - entry.attachZ - 0.005) *
            t +
          normalZ *
            (variant?.bladeArchMetres ?? 0.008) *
            entry.archScale *
            Math.sin(Math.PI * t)
        const width = (entry.width / 2) * Math.sin(Math.PI * t) ** 0.85
        const row: number[] = []
        for (let j = 0; j <= lateral; j++) {
          if ((i === 0 || i === longitudinal) && j > 0) {
            row.push(row[0])
            continue
          }
          const q = j / (lateral / 2) - 1
          row.push(mesh.positions.length / 3)
          const bend =
            q * width * Math.sin(entry.roll) +
            0.003 * (1 - Math.abs(q)) * Math.sin(Math.PI * t) +
            sign * 0.0003
          const radius =
            r +
            normalR *
              (bend +
                (variant?.bladeArchMetres ?? 0.008) *
                  entry.archScale *
                  Math.sin(Math.PI * t))
          mesh.positions.push(
            origin[0] +
              radius * er[0] +
              (entry.lateralBend * Math.sin(Math.PI * t) +
                q * width * Math.cos(entry.roll)) *
                et[0],
            origin[1] +
              radius * er[1] +
              (entry.lateralBend * Math.sin(Math.PI * t) +
                q * width * Math.cos(entry.roll)) *
                et[1],
            z + normalZ * bend
          )
          mesh.uvs.push(t, (q + 1) / 2)
        }
        skin.push(row)
      }
      const tri = (a: number, b: number, c: number) => {
        if (a === b || b === c || c === a) {
          return
        }
        mesh.indices.push(...(sign > 0 ? [a, b, c] : [a, c, b]))
      }
      for (let i = 0; i < longitudinal; i++) {
        for (let j = 0; j < lateral; j++) {
          tri(skin[i][j], skin[i + 1][j], skin[i + 1][j + 1])
          tri(skin[i][j], skin[i + 1][j + 1], skin[i][j + 1])
        }
      }
      rows.push(skin)
    }
    const boundary = [
      rows[0][0][0],
      ...rows[0].slice(1).map((r) => r[lateral]),
      ...rows[0]
        .slice(1, longitudinal)
        .reverse()
        .map((r) => r[0])
    ]
    const lower = [
      rows[1][0][0],
      ...rows[1].slice(1).map((r) => r[lateral]),
      ...rows[1]
        .slice(1, longitudinal)
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
    let leafColor = variant ? variant.leafColorSRGB : '#718752'
    if (variant?.leafColorsSRGB) {
      leafColor = variant.leafColorsSRGB[index % variant.leafColorsSRGB.length]
    }
    if (crown) {
      leafColor = crown.leafColorsSRGB[index % crown.leafColorsSRGB.length]
    }
    parts.push(
      part(
        `leaf-${index}`,
        mesh,
        Number.parseInt(leafColor.slice(1), 16),
        'leaf',
        spec.materials.leaf.roughness
      )
    )
    parts.push(
      part(
        `petiole-${index}`,
        tube(
          [
            origin as Vec,
            [
              origin[0] + 0.009 * er[0],
              origin[1] + 0.009 * er[1],
              origin[2] + 0.005
            ]
          ],
          crown?.petioleRadius ??
            requiredSpecValue(petioles.radius, 'petiole radius'),
          crown?.petioleSegments ??
            requiredSpecValue(petioles.radialSegments, 'petiole segments')
        ),
        0x526c3c,
        'leaf',
        spec.materials.stem.roughness
      )
    )
  })
  const foliageScale = variant?.foliageScale
  const shaped = foliageScale
    ? parts.map((p) =>
        p.id === 'pot' || p.id === 'soil'
          ? p
          : placeParts([p], [0, 0, 0], 0, [
              foliageScale[0],
              foliageScale[1],
              foliageScale[2]
            ])[0]
      )
    : parts
  return placeParts(shaped, [0, 0, 0], 0, [scale, scale, scale])
}

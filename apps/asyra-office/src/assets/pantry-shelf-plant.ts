import specification from '../../../../assets/asyra-office/models/pantry-smallware/pantry-smallware-model-spec.json'
import { part, placeParts } from './catalog'
import { append, emptyMesh, lathe, tube, vec, type Vec } from './geometry'
import { pantryVessel } from './pantry-vessels'
import { planter } from './plants'

/** Shelf-specific flowering pot, preserving individual leaves and separate blooms. */
export function pantryShelfPlant() {
  const recipe = specification.sourceVariants.shelfPlant
  const foliage = planter(1, 0xc19d5a, recipe.seed, 'shrub').filter(
    (p) => p.id !== 'pot' && p.id !== 'soil'
  )
  for (const p of foliage) {
    for (let i = 0; i < p.mesh.positions.length; i += 3) {
      const height = p.mesh.positions[i + 2] - recipe.sourceBase
      const t = Math.max(0, Math.min(1, height / recipe.taperHeight))
      const spread =
        recipe.bottomSpread + (recipe.topSpread - recipe.bottomSpread) * t
      p.mesh.positions[i] *= spread
      p.mesh.positions[i + 1] *= spread
      p.mesh.positions[i + 2] =
        recipe.foliageBase + height * recipe.verticalScale
    }
  }
  return [
    part(
      'pot',
      lathe(recipe.potProfile, 64),
      Number.parseInt(recipe.potColor.slice(1), 16),
      'ceramic',
      0.85
    ),
    part(
      'soil',
      lathe(
        [
          [0, 0.095],
          [recipe.soilRadius, 0.095],
          [recipe.soilRadius, recipe.soilTop],
          [0, recipe.soilTop]
        ],
        64
      ),
      0x554432,
      'plain',
      1
    ),
    ...foliage,
    ...shelfFlowers()
  ]
}

function roundedPetal(radii: readonly number[]) {
  const mesh = lathe(
    Array.from({ length: 13 }, (_, i) => [
      i === 0 || i === 12 ? 0 : Math.sin((i / 12) * Math.PI),
      -Math.cos((i / 12) * Math.PI)
    ]),
    20
  )
  for (let i = 0; i < mesh.positions.length; i++)
    mesh.positions[i] *= radii[i % 3]
  return mesh
}

function shelfFlowers() {
  const plant = specification.sourceVariants.shelfPlant
  const recipe = plant.flowers
  const color = (value: string) => Number.parseInt(value.slice(1), 16)
  return recipe.instances.flatMap((flower, index) => {
    const petals = emptyMesh()
    for (let i = 0; i < recipe.petalCount; i++) {
      const a = (i * Math.PI * 2) / recipe.petalCount
      append(
        petals,
        roundedPetal(recipe.petalRadii),
        [
          Math.sin(a) * recipe.petalOffset,
          Math.cos(a) * recipe.petalOffset,
          0.001
        ],
        [8, 0, (-a * 180) / Math.PI]
      )
    }
    const head = placeParts(
      [
        part(
          `flower-petals-${index}`,
          petals,
          color(recipe.petalColor),
          'plain',
          0.85
        ),
        part(
          `flower-center-${index}`,
          roundedPetal(recipe.centerRadii),
          color(recipe.centerColor),
          'plain',
          0.85
        )
      ],
      [0, 0, 0],
      0,
      [flower.scale, flower.scale, flower.scale]
    )
    for (const p of head) {
      const mesh = emptyMesh()
      append(mesh, p.mesh, vec(flower.position), vec(flower.rotation))
      p.mesh = mesh
    }
    const [x, y, z] = flower.position
    const path: Vec[] = [
      [x * 0.15, y * 0.15, plant.soilTop],
      [x * 0.6, y * 0.6, z * 0.7],
      vec(flower.position)
    ]
    return [
      part(
        `flower-stem-${index}`,
        tube(path, recipe.stemRadius, 10),
        color(recipe.stemColor),
        'leaf',
        0.85
      ),
      ...head
    ]
  })
}

/** The second shelf pot is a small leafy plant, independently sized from the flowers. */
export function pantrySmallShelfPlant() {
  const recipe = specification.sourceVariants.smallShelfPlant
  const foliage = planter(1, 0x8d7657, recipe.seed, 'stemmed').filter(
    (p) => p.id !== 'pot' && p.id !== 'soil'
  )
  for (const p of foliage)
    for (let i = 0; i < p.mesh.positions.length; i += 3) {
      p.mesh.positions[i] *= recipe.foliageScale[0]
      p.mesh.positions[i + 1] *= recipe.foliageScale[1]
      p.mesh.positions[i + 2] =
        recipe.foliageBase +
        (p.mesh.positions[i + 2] - recipe.sourceBase) * recipe.foliageScale[2]
    }
  return [
    ...pantryVessel('shelf-spice-jar'),
    part(
      'soil',
      lathe(
        [
          [0, 0.108],
          [recipe.soilRadius, 0.108],
          [recipe.soilRadius, recipe.soilTop],
          [0, recipe.soilTop]
        ],
        48
      ),
      0x554432,
      'plain',
      1
    ),
    ...foliage
  ]
}

/** Owner-identified fifth shelf object: blue/brown pot, succulent and dark bud. */
export function pantryShelfSucculent() {
  const recipe = specification.sourceVariants.shelfSucculent
  const color = (value: string) => Number.parseInt(value.slice(1), 16)
  const bud = emptyMesh()
  append(
    bud,
    roundedPetal(recipe.bud.radii),
    vec(recipe.bud.position),
    vec(recipe.bud.rotation)
  )
  return [
    part(
      'pot',
      lathe(recipe.potProfile, 64),
      color(recipe.potColor),
      'ceramic',
      0.65
    ),
    part(
      'pot-rim',
      lathe(recipe.rimProfile, 64),
      color(recipe.rimColor),
      'ceramic',
      0.85
    ),
    part(
      'soil',
      lathe(
        [
          [0, 0.19],
          [recipe.soilRadius, 0.19],
          [recipe.soilRadius, recipe.soilTop],
          [0, recipe.soilTop]
        ],
        48
      ),
      0x594637,
      'stone',
      1
    ),
    ...recipe.leaves.map((leaf, i) => {
      const mesh = emptyMesh()
      append(
        mesh,
        roundedPetal(leaf.radii),
        vec(leaf.position),
        vec(leaf.rotation)
      )
      return part('succulent-leaf-' + i, mesh, color(leaf.color), 'leaf', 0.72)
    }),
    part(
      'bud-stem',
      tube(recipe.bud.stemPath.map(vec), recipe.bud.stemRadius, 12),
      color(recipe.bud.stemColor),
      'leaf',
      0.85
    ),
    part('flower-bud', bud, color(recipe.bud.color), 'leaf', 0.8)
  ]
}

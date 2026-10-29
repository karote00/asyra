import specification from '../../../../assets/asyra-office/models/pantry-smallware/pantry-smallware-model-spec.json'
import { part, placeParts, type AssetPart } from './catalog'
import { cylinder, ellipsoid, lathe, tube } from './geometry'
import { planter } from './plants'

export const COUNTERTOP_REFERENCE =
  specification.sourceVariants.countertopReview
const colorValue = (value: string) => Number.parseInt(value.slice(1), 16)

/** Near-cylindrical pitcher with a recessed source-visible top insert and squared handle. */
export function pantryPitcher(
  color = colorValue(COUNTERTOP_REFERENCE.pitcher.color)
): AssetPart[] {
  const {
    radius: r,
    height: h,
    wall,
    base,
    spoutReach,
    handleReach,
    handleRadius
  } = COUNTERTOP_REFERENCE.pitcher
  const baseRatio = COUNTERTOP_REFERENCE.pitcher.baseRadiusRatio
  const profile = [
    [0, 0],
    [r * baseRatio, 0],
    [r * baseRatio, 0.006],
    [r, h - 0.012],
    [r, h],
    [r - wall, h],
    [r - wall, h - 0.012],
    [r * baseRatio - wall, base],
    [0, base]
  ]
  const body = lathe(profile, 64)
  for (let i = 0; i < body.positions.length; i += 3) {
    const x = body.positions[i],
      y = body.positions[i + 1],
      z = body.positions[i + 2]
    const side = Math.max(0, -x / (Math.hypot(x, y) || 1)) ** 14
    const rise = Math.max(0, (z / h - 0.62) / 0.38) ** 2
    body.positions[i] -= side * rise * spoutReach
  }
  const corner = COUNTERTOP_REFERENCE.pitcher.handleCornerRadius
  const x0 = r * 0.97,
    x1 = x0 + handleReach
  const z0 = h * 0.22,
    z1 = h * 0.84
  const path: [number, number, number][] = [
    [x0, 0, z1],
    [x1 - corner, 0, z1]
  ]
  for (let i = 1; i <= 8; i++) {
    const angle = Math.PI / 2 - (i * Math.PI) / 16
    path.push([
      x1 - corner + corner * Math.cos(angle),
      0,
      z1 - corner + corner * Math.sin(angle)
    ])
  }
  path.push([x1, 0, z0 + corner])
  for (let i = 1; i <= 8; i++) {
    const angle = (-i * Math.PI) / 16
    path.push([
      x1 - corner + corner * Math.cos(angle),
      0,
      z0 + corner + corner * Math.sin(angle)
    ])
  }
  path.push([x0, 0, z0])
  const recipe = COUNTERTOP_REFERENCE.pitcher
  return [
    part('vessel', body, color, 'ceramic', 0.55),
    part('handle', tube(path, handleRadius, 16), color, 'ceramic', 0.55),
    ...placeParts(
      [
        part(
          'top-insert',
          cylinder(r - wall - 0.001, 0.004, r - wall - 0.001, 64),
          colorValue(recipe.insertColor),
          'plain',
          0.6
        )
      ],
      [0, 0, h - recipe.insertInset]
    ),
    ...placeParts(
      [
        part(
          'top-center',
          cylinder(recipe.centerRadius, 0.001, recipe.centerRadius, 32),
          colorValue(recipe.centerColor),
          'plain'
        )
      ],
      [0, 0, h - recipe.insertInset + 0.0025]
    )
  ]
}

/** Separate fitted lid with a recessed seam; placement belongs to scene composition. */
export function pantryTumbler(
  color = colorValue(COUNTERTOP_REFERENCE.tumbler.color)
): AssetPart[] {
  const { radius: r, height: h, lidHeight: l } = COUNTERTOP_REFERENCE.tumbler
  return [
    part(
      'body',
      lathe(
        [
          [0, 0],
          [r * 0.9, 0],
          [r, 0.005],
          [r, h - l],
          [0, h - l]
        ],
        48
      ),
      color,
      'ceramic',
      0.48
    ),
    ...placeParts(
      [
        part(
          'lid-seam',
          cylinder(r * 0.98, 0.002, r * 0.98, 48),
          0x9c9990,
          'plain'
        )
      ],
      [0, 0, h - l + 0.001]
    ),
    part(
      'lid',
      lathe(
        [
          [0, h - l + 0.002],
          [r, h - l + 0.002],
          [r * 1.03, h - l + 0.005],
          [r * 1.03, h - 0.005],
          [r * 0.93, h],
          [0, h]
        ],
        48
      ),
      color,
      'plain',
      0.55
    )
  ]
}

export function pantryBrush(): AssetPart[] {
  const { height, shaftRadius, headRadii } = COUNTERTOP_REFERENCE.brush
  return [
    part(
      'brush-shaft',
      tube(
        [
          [0, 0, 0.012],
          [0.008, 0.005, height - headRadii[2]]
        ],
        shaftRadius,
        12
      ),
      0x685546,
      'wood'
    ),
    ...placeParts(
      [
        part(
          'brush-head',
          ellipsoid([headRadii[0], headRadii[1], headRadii[2]], 16, 12),
          0x393a32,
          'plain'
        )
      ],
      [0.008, 0.005, height - headRadii[2]]
    )
  ]
}

/** Per-instance crown dimensions preserve the existing leaf construction and pot. */
export function pantryCounterPlant(kind: 'preparation' | 'sink'): AssetPart[] {
  const recipe = COUNTERTOP_REFERENCE.plants[kind]
  const parts = planter(
    recipe.scale,
    colorValue(recipe.color),
    recipe.seed,
    'lanceolate'
  )
  const root = 0.105 * recipe.scale
  const targetRoot =
    kind === 'preparation'
      ? COUNTERTOP_REFERENCE.preparationPot.soilHeight
      : root
  return parts.map((p) => {
    if (kind === 'preparation' && (p.id === 'pot' || p.id === 'soil')) {
      const pot = COUNTERTOP_REFERENCE.preparationPot
      if (p.id === 'soil')
        return placeParts(
          [
            part(
              'soil',
              cylinder(pot.radius - pot.wall, 0.004, pot.radius - pot.wall, 48),
              p.color,
              'plain'
            )
          ],
          [0, 0, pot.soilHeight - 0.002]
        )[0]
      const r = pot.radius,
        b = pot.baseRadius,
        h = pot.height,
        w = pot.wall
      return part(
        'pot',
        lathe(
          [
            [0, 0],
            [b, 0],
            [b + 0.002, 0.006],
            [r, h - 0.005],
            [r, h],
            [r - w, h],
            [b - w, 0.008],
            [0, 0.008]
          ],
          64
        ),
        p.color,
        'ceramic',
        0.82
      )
    }
    if (p.id === 'pot' || p.id === 'soil') return p
    const transform = (mesh: typeof p.mesh) => ({
      ...mesh,
      positions: mesh.positions.map((v, i) =>
        i % 3 === 2
          ? targetRoot + (v - root) * recipe.foliageRise
          : v * recipe.foliageWidth
      )
    })
    return {
      ...p,
      mesh: transform(p.mesh),
      ...(p.distant
        ? {
            distant: {
              ...p.distant,
              mesh: transform(p.distant.mesh),
              maxError:
                p.distant.maxError *
                Math.max(recipe.foliageWidth, recipe.foliageRise)
            }
          }
        : {})
    }
  })
}

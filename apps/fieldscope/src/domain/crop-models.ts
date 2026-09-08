import { appendFruitSurface, appendFruitCalyx } from './crop-fruit'
import type { FarmConfiguration } from './farm-configuration'
import type { Point3 } from './greenhouse'
import { TriangleBuilder } from './mesh'
import { CROP_LAYOUT, cropRandom, type CropSpecies } from './crop-layout'

export interface CropFruit {
  center: Point3
  length: number
  radius: number
  maturity: 'green' | 'turning' | 'ripe'
  occlusion: 'clear' | 'leaf' | 'net'
  ripeness: number
  spineCount: number
}
export interface CropModel {
  species: CropSpecies
  variant: number
  height: number
  leafCount: number
  leafletCount: number
  tendrilCount: number
  fruits: CropFruit[]
  parts: {
    color: number
    roughness: number
    shape: ReturnType<TriangleBuilder['shape']>
    distantShape?: ReturnType<TriangleBuilder['shape']>
  }[]
}

const add = (a: Point3, b: Point3): Point3 => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2]
]
const triangle = (
  builder: TriangleBuilder,
  a: Point3,
  b: Point3,
  c: Point3
) => {
  const offset = builder.positions.length / 3
  builder.positions.push(...a, ...b, ...c)
  builder.indices.push(offset, offset + 1, offset + 2)
}

/** Curved blade with shared vertices: smooth normals and a natural rolled edge. */
function leaf(
  builder: TriangleBuilder,
  veins: TriangleBuilder,
  base: Point3,
  angle: number,
  length: number,
  width: number,
  cucumber: boolean,
  distant: boolean
) {
  const point = (t: number, across: number, lift = 0): Point3 =>
    add(base, [
      Math.cos(angle) * length * t - Math.sin(angle) * across,
      length * (0.18 * Math.sin(Math.PI * t) - 0.25 * t) +
        across * 0.12 * Math.sin(angle) -
        Math.abs(across) * 0.18 +
        width *
          0.06 *
          Math.sin(t * Math.PI * 3 + angle) *
          (across / width) ** 2 +
        lift,
      Math.sin(angle) * length * t + Math.cos(angle) * across
    ])
  let sections = cucumber ? 12 : 8
  if (distant) sections = 2
  const offset = builder.positions.length / 3
  const centers: Point3[] = []
  const acrossCount = distant ? 3 : 5
  for (let i = 0; i <= sections; i++) {
    const t = i / sections
    // Cucumber has a broad basal blade and shallow palmate lobes; tomato leaflets taper.
    const outline = cucumber
      ? Math.sin(Math.PI * t) ** 0.58 *
        (1 + 0.13 * Math.cos(6 * Math.PI * t)) *
        (1.15 - 0.3 * t)
      : Math.sin(Math.PI * t) ** 0.8 * (i % 2 ? 1 : 0.78)
    const halfWidth = width * 0.5 * outline
    for (let j = 0; j < acrossCount; j++) {
      const lateral = (j / (acrossCount - 1)) * 2 - 1
      builder.positions.push(...point(t, halfWidth * lateral))
      const mottling =
        0.012 * Math.sin(t * 31 + lateral * 13 + angle) +
        0.008 * Math.sin(t * 67 - lateral * 19)
      const ridge = 0.01 * (1 - Math.abs(lateral))
      // Linear RGB, shared by full and distant botanical surfaces.
      builder.colors.push(
        0.045 + mottling * 0.3 + ridge,
        0.13 + mottling + ridge + 0.025 * t,
        0.035 + mottling * 0.3
      )
    }
    centers.push(point(t, 0, 0.0006))
    if (!i) continue
    for (let side = 0; side < acrossCount - 1; side++) {
      const a = offset + (i - 1) * acrossCount + side,
        b = a + acrossCount
      builder.indices.push(a, b, b + 1, a, b + 1, a + 1)
    }
  }
  // Raised ribbons follow the blade; their width is sub-millimetre, not thick wire.
  const vein = (a: Point3, b: Point3) => {
    const d: Point3 = [
      -Math.sin(angle) * 0.0006,
      0.0003,
      Math.cos(angle) * 0.0006
    ]
    veins.quad(a, b, add(b, d), add(a, d))
  }
  for (let i = 2; i < centers.length; i += 2) vein(centers[i - 2], centers[i])
  for (const side of [-1, 1])
    for (const t of [0.35, 0.65])
      vein(
        point(t * 0.7, 0, 0.001),
        point(t, width * 0.38 * Math.sin(Math.PI * t) * side, 0.001)
      )
}

function star(
  builder: TriangleBuilder,
  center: Point3,
  radius: number,
  downward: number
) {
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5
    const p = (a: number, r: number, y: number): Point3 =>
      add(center, [Math.cos(a) * r, y, Math.sin(a) * r])
    triangle(
      builder,
      p(angle - 0.4, radius * 0.24, 0),
      p(angle, radius, downward),
      p(angle + 0.4, radius * 0.24, 0)
    )
  }
}

/** Original cultivar geometry; dimensions other than published fruit length are illustrative. */
export function createCropModels(
  config: Pick<FarmConfiguration, 'netTop' | 'netBottom'>
): CropModel[] {
  return (['cucumber-1914', 'tomato-yu-nu'] as const).flatMap((species) =>
    Array.from({ length: CROP_LAYOUT.variantCount }, (_, variant) => {
      const model = createModel(species, variant, config, false)
      const distant = createModel(species, variant, config, true)
      return {
        ...model,
        parts: model.parts.map((part, i) => ({
          ...part,
          distantShape: distant.parts[i].shape
        }))
      }
    })
  )
}

function createModel(
  species: CropSpecies,
  variant: number,
  config: Pick<FarmConfiguration, 'netTop' | 'netBottom'>,
  distant: boolean
): CropModel {
  const { netTop, netBottom } = config
  const cucumber = species === 'cucumber-1914'
  const random = cropRandom(711 + variant * 7919 + (cucumber ? 0 : 4001))
  const scale = Math.min(1, netTop / 3)
  const height = netTop * (0.64 + random() * 0.31)
  const stems = new TriangleBuilder(distant ? 3 : 8),
    foliage = new TriangleBuilder(distant ? 3 : 8),
    veins = new TriangleBuilder(distant ? 3 : 8)
  const green = new TriangleBuilder(distant ? 3 : 8),
    turning = new TriangleBuilder(distant ? 3 : 8),
    ripe = new TriangleBuilder(distant ? 3 : 8),
    flowers = new TriangleBuilder(distant ? 3 : 8)
  const phase = random() * Math.PI * 2
  const stemPoint = (y: number): Point3 => [
    -0.06 * Math.min(1, y / Math.max(0.1, height * 0.2)) +
      0.018 * scale * Math.sin(y * 7 + phase) * Math.min(1, y / 0.2),
    y,
    Math.sin(y * 4.5 + phase) * 0.035 * scale * Math.min(1, y / 0.2)
  ]
  stems.tube({
    points: Array.from({ length: distant ? 7 : 19 }, (_, i) =>
      stemPoint((height * i) / (distant ? 6 : 18))
    ),
    diameter: (cucumber ? 0.006 : 0.008) * scale
  })
  const leafCount = 8 + (variant % 5)
  let leafletCount = 0,
    tendrilCount = 0
  for (let i = 0; i < leafCount; i++) {
    const leafScale =
      scale * (i === leafCount - 1 ? 0.38 : 1 - (0.2 * i) / leafCount)
    const y = height * (0.16 + (0.83 * i) / (leafCount - 1))
    const base = stemPoint(y),
      angle = phase + i * 2.399 + random() * 0.65
    const petiole = add(base, [
      Math.cos(angle) * 0.09 * leafScale,
      0.035 * leafScale,
      Math.sin(angle) * 0.09 * leafScale
    ])
    stems.tube({ points: [base, petiole], diameter: 0.003 * leafScale })
    if (cucumber) {
      leaf(
        foliage,
        veins,
        petiole,
        angle,
        (0.18 + random() * 0.1) * leafScale,
        (0.2 + random() * 0.09) * leafScale,
        true,
        distant
      )
      leafletCount++
      const curl: Point3[] = [base]
      for (let j = 0; j <= (distant ? 6 : 18); j++) {
        const t = j / (distant ? 6 : 18)
        curl.push(
          add(base, [
            -0.015 * leafScale -
              t * 0.025 * leafScale +
              Math.sin(t * Math.PI * 6) * 0.009 * leafScale,
            t * 0.06 * leafScale,
            t * 0.065 * leafScale +
              Math.cos(t * Math.PI * 6) * 0.009 * leafScale
          ])
        )
      }
      stems.tube(
        { points: curl, diameter: 0.0012 * leafScale },
        distant ? 3 : 4
      )
      tendrilCount++
    } else {
      const tip = add(petiole, [
        Math.cos(angle) * 0.25 * leafScale,
        -0.04 * leafScale,
        Math.sin(angle) * 0.25 * leafScale
      ])
      stems.tube({ points: [petiole, tip], diameter: 0.002 * leafScale })
      for (let pair = 0; pair < 3; pair++)
        for (const side of [-1, 1]) {
          const t = (pair + 0.5) / 3.5
          const anchor = petiole.map(
            (v, axis) => v + (tip[axis] - v) * t
          ) as unknown as Point3
          leaf(
            foliage,
            veins,
            anchor,
            angle + side * 1.0,
            (0.08 + (2 - pair) * 0.016) * leafScale,
            0.068 * leafScale,
            false,
            distant
          )
          leafletCount++
        }
      leaf(
        foliage,
        veins,
        tip,
        angle,
        0.115 * leafScale,
        0.074 * leafScale,
        false,
        distant
      )
      leafletCount++
    }
  }
  const fruits: CropFruit[] = []
  const trusses = cucumber ? 4 + (variant % 2) : 3
  for (let truss = 0; truss < trusses; truss++) {
    const base = stemPoint(
      height * ((cucumber ? 0.27 : 0.38) + truss * (cucumber ? 0.12 : 0.23))
    )
    const angle = phase + truss * 2.0
    const count = cucumber ? 1 : 8 + ((variant + truss) % 5)
    const tip = add(base, [
      Math.cos(angle) * 0.14 * scale,
      -0.06 * scale,
      Math.sin(angle) * 0.14 * scale
    ])
    stems.tube({ points: [base, tip], diameter: 0.003 * scale })
    const rachis = (j: number): Point3 =>
      add(tip, [
        Math.cos(angle) * 0.025 * scale * Math.sin(j * 0.4),
        -j * 0.027 * scale,
        Math.sin(angle) * 0.025 * scale * Math.sin(j * 0.4)
      ])
    if (!cucumber)
      stems.tube({
        points: Array.from({ length: count }, (_, j) => rachis(j)),
        diameter: 0.0026 * scale
      })
    for (let j = 0; j < count; j++) {
      const ripeness = cucumber
        ? ((truss + variant) % 3) / 2
        : Math.max(
            0.06,
            Math.min(
              0.98,
              0.96 - (j / (count - 1)) * 0.84 + Math.sin(variant + truss) * 0.04
            )
          )
      const maturity = ripeness > 0.75 ? 2 : Number(ripeness > 0.3)
      let length = (0.034 + random() * 0.01) * scale
      if (cucumber)
        length =
          (maturity === 2 ? 0.2 + random() * 0.04 : 0.1 + random() * 0.09) *
          scale
      const radius =
        (cucumber
          ? 0.011 + random() * 0.004
          : (length / scale) * (0.29 + random() * 0.035)) * scale
      const node = cucumber ? tip : rachis(j)
      const side = j % 2 ? 1 : -1
      const attachment = cucumber
        ? tip
        : add(node, [
            Math.cos(angle + (side * Math.PI) / 2) * 0.038 * scale,
            0.009 * scale,
            Math.sin(angle + (side * Math.PI) / 2) * 0.038 * scale
          ])
      let center = add(attachment, [
        0.007 * scale,
        -0.022 * scale - length / 2,
        0
      ])
      let occlusion: CropFruit['occlusion'] = 'clear'
      if (truss === 0 && j === 0 && variant % 3 === 1) {
        const strandY =
          netBottom + Math.ceil((center[1] - netBottom) / 0.15) * 0.15
        if (strandY >= netBottom && strandY + length / 2 < height) {
          center = [-0.06 - radius - 0.002, strandY, center[2]]
          occlusion = 'net'
        }
      }
      if (truss === 0 && j === 0 && variant % 3 === 0) {
        const coverBase: Point3 = [
          center[0] + 0.015 * scale,
          center[1],
          center[2]
        ]
        stems.tube({
          points: [stemPoint(center[1] + 0.1 * scale), coverBase],
          diameter: 0.0025 * scale
        })
        leaf(
          foliage,
          veins,
          coverBase,
          0,
          0.22 * scale,
          (cucumber ? 0.2 : 0.1) * scale,
          cucumber,
          distant
        )
        occlusion = 'leaf'
      }
      const top = add(center, [0, length / 2, 0])
      stems.tube({
        points: cucumber
          ? [tip, top]
          : [node, attachment, [top[0], top[1] + 0.009 * scale, top[2]], top],
        diameter: 0.0018 * scale
      })
      const fruit: CropFruit = {
        center,
        length,
        radius,
        maturity: (['green', 'turning', 'ripe'] as const)[maturity],
        occlusion,
        ripeness,
        spineCount: 0
      }
      fruits.push(fruit)
      fruit.spineCount = appendFruitSurface(
        [green, turning, ripe][maturity],
        center,
        length,
        radius,
        cucumber,
        cucumber ? random() * 0.009 * scale : 0,
        distant,
        ripeness,
        phase + truss + j * 0.7
      )
      if (cucumber) star(stems, top, 0.009 * scale, -0.005 * scale)
      else appendFruitCalyx(stems, top, 0.019 * scale, distant)
      if (cucumber)
        star(
          flowers,
          add(center, [0, -length / 2, 0]),
          0.009 * scale,
          -0.004 * scale
        )
    }
    star(
      flowers,
      add(tip, [0.025 * scale, 0.015 * scale, 0.015 * scale]),
      0.018 * scale,
      -0.006 * scale
    )
  }
  const builders = [stems, foliage, veins, green, turning, ripe, flowers]
  const colors = cucumber
    ? [
        0x638441,
        0x346536 + (variant % 4) * 0x020300,
        0x779350,
        0x458b37,
        0x26702d,
        0x174829,
        0xf2c537
      ]
    : [
        0x53763a,
        0x3c6835 + (variant % 4) * 0x010300,
        0x6e8d45,
        0x77a347,
        0xe69a35,
        0xcf3525,
        0xf1c632
      ]
  return {
    species,
    variant,
    height,
    leafCount,
    leafletCount,
    tendrilCount,
    fruits,
    parts: builders.flatMap((builder, i) =>
      builder.indices.length
        ? [
            {
              color: builder.colors.length ? 0xffffff : colors[i],
              roughness: i >= 3 && i <= 5 ? 0.3 : 0.72,
              shape: builder.shape()
            }
          ]
        : []
    )
  }
}

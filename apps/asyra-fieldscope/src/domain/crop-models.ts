import { CUCUMBER_LEAF_SURFACE, TOMATO_LEAF_SURFACE } from './leaf-surface'
import { appendSurfaceHairs } from './crop-hairs'
import {
  appendFruitSurface,
  appendFruitCalyx,
  appendCucumberFlower
} from './crop-fruit'
import type { FarmConfiguration } from './farm-configuration'
import type { Point3 } from './greenhouse'
import { TriangleBuilder } from './mesh'
import type { SourcePatch, SourceRegion } from './source-occupancy'
import { CROP_LAYOUT, cropRandom, type CropSpecies } from './crop-layout'

const CUCUMBER_GROWTH_STAGES = [
  'flowering',
  'young',
  'expanding',
  'near-harvest',
  'harvestable',
  'overgrown-early',
  'overgrown-late',
  'oversized'
] as const

export interface CropPartition {
  fruitId: string | null
  indexStart: number
  indexCount: number
}
/** Source-generation assumptions, never farm configuration or biological calibration. */
export interface CropSourceAssumptions {
  readonly format: 'crop-source-assumptions/1'
  readonly cucumberCutSite: {
    readonly kind: 'synthetic-fraction'
    readonly fraction: number
    readonly evidence: {
      readonly kind: 'synthetic'
      readonly id: string
      readonly label: string
    }
  }
}
export const DEFAULT_CROP_SOURCE_ASSUMPTIONS: CropSourceAssumptions =
  Object.freeze({
    format: 'crop-source-assumptions/1',
    cucumberCutSite: Object.freeze({
      kind: 'synthetic-fraction',
      fraction: 0.5,
      evidence: Object.freeze({
        kind: 'synthetic',
        id: 'cucumber-source-cut-fraction/1',
        label:
          'Synthetic source cut fraction - not calibrated anatomy or safety distance'
      })
    })
  })

export interface CropFruit {
  id: string
  cutSite?:
    | { kind: 'unknown'; reason: 'no-source-cut-boundary' }
    | {
        kind: 'synthetic-source-boundary'
        id: string
        position: Point3
        towardPlant: Point3
        boundary: {
          partId: string
          plantPatchId: string
          retainedPatchId: string
          sourceVertexIndices: readonly number[]
        }
        evidence: { kind: 'synthetic'; label: string }
        sourceAssumptions?: CropSourceAssumptions
      }
  growthStage?: (typeof CUCUMBER_GROWTH_STAGES)[number]
  center: Point3
  length: number
  radius: number
  maturity: 'green' | 'turning' | 'ripe' | 'overgrown'
  occlusion: 'clear' | 'leaf' | 'net'
  ripeness: number
  spineCount: number
}
/** Botanical identity only; no source patch grants contact permission. */
export interface CropSourcePatch {
  readonly id: string
  readonly targetFruitId: string
  readonly owner: 'target-fruit' | 'plant'
  readonly role:
    | 'fruit-skin'
    | 'fine-spines'
    | 'calyx'
    | 'retained-pedicel'
    | 'plant-pedicel'
    | 'fruit-detail'
  readonly source: SourcePatch
}

export type CropSourceAnatomyRole =
  'leaf-blade' | 'leaf-vein-ribbon' | 'leaf-hair'

export interface CropSourceAnatomyPatch {
  readonly id: string
  readonly role: CropSourceAnatomyRole
  readonly source: SourcePatch
}

/** Authored source-triangle anatomy only; absence remains unclassified. */
export interface CropSourceAnatomy {
  readonly format: 'crop-source-anatomy/1'
  readonly patches: readonly CropSourceAnatomyPatch[]
}

function attachSourceAnatomy<T extends object>(
  value: T,
  sourceAnatomy: CropSourceAnatomy | undefined,
  distantSourceAnatomy?: CropSourceAnatomy
): T {
  if (sourceAnatomy)
    Object.defineProperty(value, 'sourceAnatomy', {
      value: sourceAnatomy,
      enumerable: false
    })
  if (distantSourceAnatomy)
    Object.defineProperty(value, 'distantSourceAnatomy', {
      value: distantSourceAnatomy,
      enumerable: false
    })
  return value
}

export interface CropModel {
  species: CropSpecies
  variant: number
  height: number
  leafCount: number
  leafletCount: number
  tendrilCount: number
  stemHairCount: number
  leafHairCount: number
  fruits: CropFruit[]
  parts: {
    id: string
    regions: readonly SourceRegion[]
    distantRegions?: readonly SourceRegion[]
    patches: readonly CropSourcePatch[]
    distantPatches?: readonly CropSourcePatch[]
    sourceAnatomy?: CropSourceAnatomy
    distantSourceAnatomy?: CropSourceAnatomy
    partitions: CropPartition[]
    distantPartitions?: CropPartition[]
    surface?: typeof CUCUMBER_LEAF_SURFACE
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
  const start = builder.indices.length
  const offset = builder.positions.length / 3
  builder.positions.push(...a, ...b, ...c)
  builder.indices.push(offset, offset + 1, offset + 2)
  builder.region('sheet', start)
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
  const start = builder.indices.length
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
      builder.uvs.push(0.5 + (halfWidth * lateral) / width, t)
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
  builder.region('sheet', start)
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
  config: Pick<FarmConfiguration, 'netTop' | 'netBottom'>,
  assumptions: CropSourceAssumptions = DEFAULT_CROP_SOURCE_ASSUMPTIONS
): CropModel[] {
  const { format, cucumberCutSite } = assumptions
  const { kind, fraction, evidence } = cucumberCutSite
  const { kind: evidenceKind, id, label } = evidence
  if (
    format !== 'crop-source-assumptions/1' ||
    kind !== 'synthetic-fraction' ||
    !Number.isFinite(fraction) ||
    fraction <= 0 ||
    fraction >= 1 ||
    evidenceKind !== 'synthetic' ||
    !id.trim() ||
    !label.trim()
  )
    throw new Error('Invalid crop source assumptions')
  const sourceAssumptions: CropSourceAssumptions = Object.freeze({
    format,
    cucumberCutSite: Object.freeze({
      kind,
      fraction,
      evidence: Object.freeze({ kind: evidenceKind, id, label })
    })
  })
  return (['cucumber-1914', 'tomato-yu-nu'] as const).flatMap((species) =>
    Array.from({ length: CROP_LAYOUT.variantCount }, (_, variant) => {
      const model = createModel(
        species,
        variant,
        config,
        false,
        sourceAssumptions
      )
      const distant = createModel(
        species,
        variant,
        config,
        true,
        sourceAssumptions
      )
      return {
        ...model,
        parts: model.parts.map((part) => {
          const counterpart = distant.parts.find((item) => item.id === part.id)
          if (!counterpart) throw new Error('Missing distant crop source')
          return attachSourceAnatomy(
            {
              ...part,
              distantShape: counterpart.shape,
              distantRegions: counterpart.regions,
              distantPatches: counterpart.patches,
              distantPartitions: counterpart.partitions
            },
            part.sourceAnatomy,
            counterpart.sourceAnatomy
          )
        })
      }
    })
  )
}

function createModel(
  species: CropSpecies,
  variant: number,
  config: Pick<FarmConfiguration, 'netTop' | 'netBottom'>,
  distant: boolean,
  sourceAssumptions: CropSourceAssumptions
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
  const sourceAnatomySpans = new Map<
    TriangleBuilder,
    {
      role: CropSourceAnatomyRole
      indexStart: number
      indexCount: number
    }[]
  >()
  const recordSourceAnatomy = (
    builder: TriangleBuilder,
    role: CropSourceAnatomyRole,
    indexStart: number,
    indexCount = builder.indices.length - indexStart
  ) => {
    if (!indexCount) return
    const spans = sourceAnatomySpans.get(builder) ?? []
    spans.push({ role, indexStart, indexCount })
    sourceAnatomySpans.set(builder, spans)
  }
  const appendLeaf = (
    base: Point3,
    angle: number,
    length: number,
    width: number
  ) => {
    const bladeStart = foliage.indices.length
    const veinStart = veins.indices.length
    leaf(foliage, veins, base, angle, length, width, cucumber, distant)
    recordSourceAnatomy(foliage, 'leaf-blade', bladeStart)
    recordSourceAnatomy(veins, 'leaf-vein-ribbon', veinStart)
  }
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
      appendLeaf(
        petiole,
        angle,
        (0.18 + random() * 0.1) * leafScale,
        (0.2 + random() * 0.09) * leafScale
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
          appendLeaf(
            anchor,
            angle + side * 1.0,
            (0.08 + (2 - pair) * 0.016) * leafScale,
            0.068 * leafScale
          )
          leafletCount++
        }
      appendLeaf(tip, angle, 0.115 * leafScale, 0.074 * leafScale)
      leafletCount++
    }
  }
  const fruits: CropFruit[] = []
  const owned = new Map<TriangleBuilder, CropPartition[]>()
  const anatomy = new Map<
    TriangleBuilder,
    {
      targetFruitId: string
      role: CropSourcePatch['role']
      indexStart: number
      indexCount: number
    }[]
  >()
  const recordPatch = (
    builder: TriangleBuilder,
    targetFruitId: string,
    role: CropSourcePatch['role'],
    indexStart: number,
    indexCount = builder.indices.length - indexStart
  ) => {
    if (!indexCount) return
    const spans = anatomy.get(builder) ?? []
    spans.push({ targetFruitId, role, indexStart, indexCount })
    anatomy.set(builder, spans)
  }
  const record = (
    builder: TriangleBuilder,
    fruitId: string,
    indexStart: number
  ) => {
    const indexCount = builder.indices.length - indexStart
    if (!indexCount) return
    const spans = owned.get(builder) ?? []
    spans.push({ fruitId, indexStart, indexCount })
    owned.set(builder, spans)
  }
  const extraGrowth =
    cucumber && CROP_LAYOUT.overgrownVariants.includes(variant)
  const trusses = cucumber ? 5 + Number(extraGrowth) : 3
  for (let truss = 0; truss < trusses; truss++) {
    const base = stemPoint(
      height *
        (cucumber ? 0.25 + (0.62 * truss) / (trusses - 1) : 0.38 + truss * 0.23)
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
      const growth =
        extraGrowth && truss === 0
          ? 5 + (variant % 3)
          : 4 - truss + Number(extraGrowth)
      const ripeness = cucumber
        ? growth / 4
        : Math.max(
            0.06,
            Math.min(
              0.98,
              // Higher trusses are younger; distal fruit within a truss
              // still develop later than fruit near its attachment.
              0.98 -
                truss * 0.3 -
                (j / (count - 1)) * 0.22 +
                Math.sin(variant + truss) * 0.025
            )
          )
      const maturity = ripeness > 0.75 ? 2 : Number(ripeness > 0.3)
      let length = (0.024 + ripeness * 0.017 + random() * 0.005) * scale
      if (cucumber) {
        const ranges = [
          [0.025, 0.02],
          [0.06, 0.025],
          [0.1, 0.035],
          [0.155, 0.035],
          [0.2, 0.04],
          [0.26, 0],
          [0.28, 0],
          [0.3, 0]
        ]
        length = (ranges[growth][0] + random() * ranges[growth][1]) * scale
      }
      const radius =
        (cucumber
          ? [0.003, 0.005, 0.008, 0.0105, 0.013, 0.0225, 0.031, 0.04][growth] +
            (growth < 5 ? random() * 0.001 : 0)
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
        appendLeaf(coverBase, 0, 0.22 * scale, (cucumber ? 0.2 : 0.1) * scale)
        occlusion = 'leaf'
      }
      const top = add(center, [0, length / 2, 0])
      const fruitId = `fruit-${fruits.length}`
      const stemStart = stems.indices.length
      const stemVertexStart = stems.positions.length / 3
      const tubeSides = distant ? 3 : 8
      const aboveTop = add(top, [0, 0.009 * scale, 0])
      const cutPoint: Point3 = cucumber
        ? (tip.map(
            (value, axis) =>
              value +
              sourceAssumptions.cucumberCutSite.fraction * (top[axis] - value)
          ) as unknown as Point3)
        : aboveTop
      if (
        cucumber &&
        [tip, top].some((endpoint) =>
          endpoint.every((value, axis) => value === cutPoint[axis])
        )
      )
        throw new Error('Degenerate cucumber source cut segment')
      stems.tube({
        points: cucumber
          ? [tip, cutPoint, top]
          : [node, attachment, [top[0], top[1] + 0.009 * scale, top[2]], top],
        diameter: 0.0018 * scale
      })
      // Each retained segment shares a real source ring with its plant-side segment.
      // The source assumption creates no cap or separated physical surface.
      const detailStart = stems.indices.length
      const retainedStart = cucumber
        ? stemStart + tubeSides * 6
        : stemStart + (distant ? 3 : 8) * 6 * 2
      recordPatch(
        stems,
        fruitId,
        'plant-pedicel',
        stemStart + (cucumber ? 0 : tubeSides * 6),
        tubeSides * 6
      )
      recordPatch(
        stems,
        fruitId,
        'retained-pedicel',
        retainedStart,
        tubeSides * 6
      )
      const body = [green, turning, ripe][maturity]
      const bodyStart = body.indices.length
      const flowerStart = flowers.indices.length
      const fruit: CropFruit = {
        id: fruitId,
        cutSite: {
          kind: 'synthetic-source-boundary',
          id: `${fruitId}/cut-site`,
          position: cutPoint,
          towardPlant: attachment.map(
            (value, axis) => value - cutPoint[axis]
          ) as unknown as Point3,
          boundary: {
            partId: 'stems',
            plantPatchId: `${fruitId}/plant-pedicel/0`,
            retainedPatchId: `${fruitId}/retained-pedicel/0`,
            sourceVertexIndices: Array.from(
              { length: tubeSides },
              (_, index) =>
                stemVertexStart + (cucumber ? 1 : 2) * tubeSides + index
            )
          },
          evidence: {
            kind: 'synthetic',
            label: 'Synthetic source tube boundary - not measured anatomy'
          },
          ...(cucumber ? { sourceAssumptions } : {})
        },
        center,
        length,
        radius,
        maturity:
          cucumber && growth > 4
            ? 'overgrown'
            : (['green', 'turning', 'ripe'] as const)[maturity],
        ...(cucumber ? { growthStage: CUCUMBER_GROWTH_STAGES[growth] } : {}),
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
        cucumber && growth < 5 ? random() * 0.009 * scale : 0,
        distant,
        ripeness,
        phase + truss + j * 0.7,
        (role, indexStart, indexCount) =>
          recordPatch(body, fruitId, role, indexStart, indexCount)
      )
      if (cucumber) star(stems, top, 0.009 * scale, -0.005 * scale)
      else appendFruitCalyx(stems, top, 0.019 * scale, distant)
      recordPatch(
        stems,
        fruitId,
        cucumber ? 'fruit-detail' : 'calyx',
        detailStart
      )
      if (cucumber)
        appendCucumberFlower(
          flowers,
          add(center, [0, -length / 2, 0]),
          growth,
          scale,
          distant
        )
      record(body, fruitId, bodyStart)
      record(stems, fruitId, retainedStart)
      record(flowers, fruitId, flowerStart)
      recordPatch(flowers, fruitId, 'fruit-detail', flowerStart)
    }
    star(
      flowers,
      add(tip, [0.025 * scale, 0.015 * scale, 0.015 * scale]),
      0.018 * scale,
      -0.006 * scale
    )
  }
  const stemSources = owned.get(stems)?.slice() ?? []
  const stemHairCount =
    cucumber && !distant
      ? appendSurfaceHairs(
          stems,
          12000,
          0.0016 * scale,
          false,
          [0.125, 0.231, 0.053],
          (range) => {
            const source = stemSources.find(
              (span) =>
                range.sourceTriangle >= span.indexStart &&
                range.sourceTriangle < span.indexStart + span.indexCount
            )
            if (source?.fruitId) {
              record(stems, source.fruitId, range.indexStart)
              recordPatch(
                stems,
                source.fruitId,
                'fruit-detail',
                range.indexStart,
                range.indexCount
              )
            }
          }
        )
      : 0
  let leafHairCount = 0
  if (cucumber && !distant) {
    const leafHairStart = foliage.indices.length
    leafHairCount = appendSurfaceHairs(
      foliage,
      3000,
      0.0012 * scale,
      true,
      [0.045, 0.13, 0.035]
    )
    recordSourceAnatomy(foliage, 'leaf-hair', leafHairStart)
  }
  if (cucumber && distant)
    for (let i = 0; i < stems.positions.length; i += 3)
      stems.colors.push(0.125, 0.231, 0.053)
  if (flowers.colors.length)
    while (flowers.colors.length < flowers.positions.length)
      flowers.colors.push(0.89, 0.58, 0.035)
  const builders = [stems, foliage, veins, green, turning, ripe, flowers]
  const partNames = [
    'stems',
    'foliage',
    'veins',
    'green',
    'turning',
    'ripe',
    'flowers'
  ]
  const partitions = (builder: TriangleBuilder): CropPartition[] => {
    const spans: CropPartition[] = []
    let cursor = 0
    const append = (
      fruitId: string | null,
      indexStart: number,
      indexCount: number
    ) => {
      if (!indexCount) return
      const previous = spans.at(-1)
      if (
        previous &&
        previous.fruitId === fruitId &&
        previous.indexStart + previous.indexCount === indexStart
      )
        previous.indexCount += indexCount
      else spans.push({ fruitId, indexStart, indexCount })
    }
    for (const span of owned.get(builder) ?? []) {
      if (span.indexStart < cursor)
        throw new Error('Overlapping crop source ownership')
      append(null, cursor, span.indexStart - cursor)
      append(span.fruitId, span.indexStart, span.indexCount)
      cursor = span.indexStart + span.indexCount
    }
    append(null, cursor, builder.indices.length - cursor)
    return spans
  }
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
  const patches = (
    builder: TriangleBuilder,
    regions: readonly SourceRegion[]
  ): CropSourcePatch[] => {
    const counts = new Map<string, number>()
    return (anatomy.get(builder) ?? []).flatMap((span) =>
      regions.flatMap((region) => {
        const indexStart = Math.max(span.indexStart, region.indexStart)
        const indexCount =
          Math.min(
            span.indexStart + span.indexCount,
            region.indexStart + region.indexCount
          ) - indexStart
        if (indexCount <= 0) return []
        const key = `${span.targetFruitId}/${span.role}`
        const ordinal = counts.get(key) ?? 0
        counts.set(key, ordinal + 1)
        const id = `${key}/${ordinal}`
        return [
          {
            id,
            targetFruitId: span.targetFruitId,
            owner:
              span.role === 'plant-pedicel'
                ? ('plant' as const)
                : ('target-fruit' as const),
            role: span.role,
            source: { id, region, ranges: [{ indexStart, indexCount }] }
          }
        ]
      })
    )
  }
  const sourceAnatomy = (
    builder: TriangleBuilder,
    regions: readonly SourceRegion[]
  ): CropSourceAnatomy | undefined => {
    const counts = new Map<CropSourceAnatomyRole, number>()
    const patches = (sourceAnatomySpans.get(builder) ?? []).flatMap((span) =>
      regions.flatMap((region) => {
        const indexStart = Math.max(span.indexStart, region.indexStart)
        const indexCount =
          Math.min(
            span.indexStart + span.indexCount,
            region.indexStart + region.indexCount
          ) - indexStart
        if (indexCount <= 0) return []
        const ordinal = counts.get(span.role) ?? 0
        counts.set(span.role, ordinal + 1)
        const id = `${span.role}/${ordinal}`
        return [
          Object.freeze({
            id,
            role: span.role,
            source: Object.freeze({
              id,
              region,
              ranges: Object.freeze([Object.freeze({ indexStart, indexCount })])
            })
          })
        ]
      })
    )
    if (!patches.length) return
    return Object.freeze({
      format: 'crop-source-anatomy/1',
      patches: Object.freeze(patches)
    })
  }
  return {
    species,
    variant,
    height,
    leafCount,
    leafletCount,
    tendrilCount,
    stemHairCount,
    leafHairCount,
    fruits,
    parts: builders.flatMap((builder, i) => {
      const regions = builder.regions()
      const authoredAnatomy = sourceAnatomy(builder, regions)
      return builder.indices.length
        ? [
            attachSourceAnatomy(
              {
                id: partNames[i],
                partitions: partitions(builder),
                color: builder.colors.length ? 0xffffff : colors[i],
                roughness: i >= 3 && i <= 5 ? 0.3 : 0.72,
                ...(i === 1
                  ? {
                      surface: cucumber
                        ? CUCUMBER_LEAF_SURFACE
                        : TOMATO_LEAF_SURFACE
                    }
                  : {}),
                shape: builder.shape(),
                regions,
                patches: patches(builder, regions)
              },
              authoredAnatomy
            )
          ]
        : []
    })
  }
}

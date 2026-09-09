import {
  CUCUMBER_LEAF_SURFACE,
  TOMATO_LEAF_SURFACE
} from '../domain/leaf-surface'
import { readSpatialSurface } from '../engine/surface-textures'
import { createCropModels } from '../domain/crop-models'
import { createCropPositions } from '../domain/crop-layout'
import { createDrainProfile } from '../domain/drain-profile'
import {
  DEFAULT_CONFIGURATION,
  configurationSite,
  type FarmConfiguration
} from '../domain/farm-configuration'
import { createPlantingNet, NET_LAYOUT } from '../domain/planting-net'
import {
  createSupportAssembly,
  springClipWire,
  supportJointTarget
} from '../domain/planting-supports'
import { createLayout, createStructure, roofPoint } from '../domain/greenhouse'
import { TriangleBuilder } from '../domain/mesh'
import {
  readSpatialDescriptor,
  readSpatialInstances
} from '../engine/spatial-contract'
import type { SpatialFrame, SpatialMesh, SpatialCamera } from './spatial-layer'

export type LayerId =
  | 'cucumbers'
  | 'tomatoes'
  | 'net'
  | 'ties'
  | 'supports'
  | 'clips'
  | 'film'
  | 'steel'
  | 'soil'
  | 'drains'
  | 'passages'
  | 'barriers'
  | 'dimensions'
  | 'base'
export const LAYER_LABELS: Record<Exclude<LayerId, 'base'>, string> = {
  cucumbers: '1914 小胡瓜',
  tomatoes: '玉女小蕃茄',
  net: '攀爬拉網',
  ties: '網頂束帶',
  supports: '栽培鋼管',
  clips: '跨接彈簧夾',
  film: '塑膠覆膜',
  steel: '完整鋼架',
  soil: '土壤畦面',
  drains: 'Water',
  passages: '連棟走道',
  barriers: '外側防水擋板',
  dimensions: '尺寸參考線'
}
export const INITIAL_LAYERS: Record<LayerId, boolean> = {
  cucumbers: true,
  tomatoes: true,
  net: true,
  ties: true,
  supports: true,
  clips: true,
  film: true,
  steel: true,
  soil: true,
  drains: true,
  passages: true,
  barriers: true,
  dimensions: true,
  base: true
}
export type CameraMode = 'overview' | 'top' | 'front' | 'inside' | 'joint'
export interface ViewState {
  layers: Record<LayerId, boolean>
  filmOpacity: number
  camera: CameraMode
}
const cucumberSurface = readSpatialSurface(CUCUMBER_LEAF_SURFACE)
const tomatoSurface = readSpatialSurface(TOMATO_LEAF_SURFACE)

export const INITIAL_VIEW: ViewState = {
  layers: INITIAL_LAYERS,
  filmOpacity: 0.6,
  camera: 'inside'
}

export type SiteMesh = SpatialFrame['meshes'][number] & { layer: LayerId }

const mesh = (
  id: string,
  builder: TriangleBuilder,
  color: number,
  opacity = 1,
  layer = id as LayerId
): SiteMesh => ({
  layer,
  id,
  visible: true,
  descriptor: readSpatialDescriptor({
    kind: 'mesh',
    position: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    shape: builder.shape(),
    color,
    opacity,
    wireframe: false,
    selectable: false
  }) as SpatialMesh
})

/** One admitted static geometry product per applied configuration. View changes never rebuild it. */
export function buildSiteMeshes(
  config: FarmConfiguration = DEFAULT_CONFIGURATION
): SiteMesh[] {
  const site = configurationSite(config)
  const totalWidth = site.width * site.bays,
    depth = site.length,
    middle = totalWidth / 2,
    midDepth = depth / 2
  const doorHalf = Math.min(1, site.width / 4),
    doorHeight = Math.min(2.5, (site.eave * 5) / 6)
  const roof = (bay: number, fraction: number, z: number) =>
    roofPoint(bay, fraction, z, site)
  const { strips, passages } = createLayout(site, config.strips)
  const builders = Object.fromEntries(
    Object.keys(INITIAL_LAYERS).map((key) => [key, new TriangleBuilder()])
  ) as Record<LayerId, TriangleBuilder>
  const { steel, soil, drains, barriers, film, base, dimensions } = builders
  for (const member of createStructure(site)) steel.tube(member)
  const assembly = createSupportAssembly(config)
  for (const tube of [...assembly.tubes, ...assembly.rails])
    builders.supports.tube(tube)
  const net = createPlantingNet(assembly, config)
  const netBuilders = Array.from(
    { length: site.bays },
    () => new TriangleBuilder()
  )
  for (const strand of net.strands) netBuilders[strand.bay].tube(strand)
  const tieBuilders = Array.from(
    { length: Math.ceil(net.ties.length / 500) },
    () => new TriangleBuilder()
  )
  for (const [index, tie] of net.ties.entries()) {
    const tieBuilder = tieBuilders[Math.floor(index / 500)]
    const [x, y, z] = tie.center
    // A flat nylon band with thickness, locking head and short trimmed tail.
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12,
        b = ((i + 1) * Math.PI) / 12
      const point = (
        angle: number,
        radius: number,
        height: number
      ): readonly [number, number, number] => [
        x + radius * Math.cos(angle),
        height,
        z + radius * Math.sin(angle)
      ]
      const inner = tie.radius,
        outer = inner + NET_LAYOUT.tieThickness
      const low = y - NET_LAYOUT.tieWidth / 2,
        high = y + NET_LAYOUT.tieWidth / 2
      tieBuilder.quad(
        point(a, outer, low),
        point(b, outer, low),
        point(b, outer, high),
        point(a, outer, high)
      )
      tieBuilder.quad(
        point(b, inner, low),
        point(a, inner, low),
        point(a, inner, high),
        point(b, inner, high)
      )
      tieBuilder.quad(
        point(a, inner, high),
        point(a, outer, high),
        point(b, outer, high),
        point(b, inner, high)
      )
      tieBuilder.quad(
        point(a, outer, low),
        point(a, inner, low),
        point(b, inner, low),
        point(b, outer, low)
      )
    }
    tieBuilder.box([x + tie.radius, y, z], [0.004, 0.006, 0.006])
    tieBuilder.box(
      [x + tie.radius + 0.005, y, z],
      [0.01, NET_LAYOUT.tieWidth, NET_LAYOUT.tieThickness]
    )
  }
  // Batch by bay to keep every admitted index buffer below the engine limit.
  const clipBuilders: TriangleBuilder[] = []
  for (let bay = 0; bay < site.bays; bay++) {
    const clips = assembly.clips.filter((clip) => clip.bay === bay)
    for (let start = 0; start < clips.length; start += 600) {
      const builder = new TriangleBuilder()
      for (const clip of clips.slice(start, start + 600))
        builder.tube(springClipWire(clip))
      clipBuilders.push(builder)
    }
  }
  const terrainDepth = Math.max(
    0.35,
    ...strips
      .filter((strip) => strip.kind === 'drain')
      .map((strip) => createDrainProfile(strip.width).depth + 0.05)
  )
  base.box(
    [middle, -terrainDepth - 0.13, midDepth],
    [totalWidth + 6, 0.26, depth + 6]
  )
  for (const strip of strips) {
    const middle = strip.x + strip.width / 2
    if (strip.kind === 'soil')
      soil.box(
        [middle, -terrainDepth / 2, midDepth],
        [strip.width, terrainDepth, depth]
      )
    else {
      const { points, lipRadius, waterLevel, waterPoints } = createDrainProfile(
        strip.width
      )
      drains.quad(
        [strip.x + lipRadius, waterLevel, 0],
        [strip.x + lipRadius, waterLevel, depth],
        [strip.x + strip.width - lipRadius, waterLevel, depth],
        [strip.x + strip.width - lipRadius, waterLevel, 0]
      )
      for (let i = 1; i < waterPoints.length; i++) {
        const [ax, ay] = waterPoints[i - 1],
          [bx, by] = waterPoints[i]
        const a = strip.x + ax,
          b = strip.x + bx
        drains.quad([a, ay, 0], [b, by, 0], [b, by, depth], [a, ay, depth])
        drains.triangle([middle, waterLevel, 0], [b, by, 0], [a, ay, 0])
        drains.triangle(
          [middle, waterLevel, depth],
          [a, ay, depth],
          [b, by, depth]
        )
      }
      for (let i = 1; i < points.length; i++) {
        const [ax, ay] = points[i - 1],
          [bx, by] = points[i]
        const a = strip.x + ax,
          b = strip.x + bx
        soil.quad([a, ay, 0], [a, ay, depth], [b, by, depth], [b, by, 0])
        // Close the exposed ends below the curve without filling the channel opening.
        for (const z of [0, depth])
          soil.quad(
            [a, ay, z],
            [b, by, z],
            [b, -terrainDepth, z],
            [a, -terrainDepth, z]
          )
      }
    }
  }
  for (const p of passages)
    builders.passages.box(
      [p.x + p.width / 2, -terrainDepth / 2, midDepth],
      [p.width, terrainDepth, depth]
    )
  for (const [side, x] of [
    site.margin / 2,
    totalWidth - site.margin / 2
  ].entries()) {
    builders.passages.box(
      [x, -terrainDepth / 2, midDepth],
      [site.margin, terrainDepth, depth]
    )
    barriers.box(
      [
        side === 0
          ? site.barrierThickness / 2
          : totalWidth - site.barrierThickness / 2,
        site.barrierHeight / 2,
        midDepth
      ],
      [site.barrierThickness, site.barrierHeight, depth]
    )
  }
  // Shared overhead U-gutters; they are separate from ground drainage channels.
  for (const x of Array.from(
    { length: site.bays - 1 },
    (_, i) => (i + 1) * site.width
  )) {
    steel.box([x, site.eave + 0.02, midDepth], [0.22, 0.025, depth])
    for (const dx of [-0.1, 0.1])
      steel.box([x + dx, site.eave + 0.07, midDepth], [0.02, 0.1, depth])
  }
  for (let bay = 0; bay < site.bays; bay++) {
    for (let i = 0; i < 64; i++) {
      film.quad(
        roof(bay, i / 64, 0),
        roof(bay, (i + 1) / 64, 0),
        roof(bay, (i + 1) / 64, depth),
        roof(bay, i / 64, depth)
      )
      for (const z of [0, depth]) {
        const a = roof(bay, i / 64, z),
          b = roof(bay, (i + 1) / 64, z)
        film.quad([a[0], site.eave, z], [b[0], site.eave, z], b, a)
      }
    }
    for (const z of [0, depth]) {
      const left = bay * site.width,
        center = left + site.width / 2
      film.quad(
        [left, 0, z],
        [center - doorHalf, 0, z],
        [center - doorHalf, site.eave, z],
        [left, site.eave, z]
      )
      film.quad(
        [center + doorHalf, 0, z],
        [left + site.width, 0, z],
        [left + site.width, site.eave, z],
        [center + doorHalf, site.eave, z]
      )
      film.quad(
        [center - doorHalf, doorHeight, z],
        [center + doorHalf, doorHeight, z],
        [center + doorHalf, site.eave, z],
        [center - doorHalf, site.eave, z]
      )
    }
  }
  for (const x of [0, totalWidth])
    film.quad(
      [x, 0.35, 0],
      [x, 0.35, depth],
      [x, site.eave, depth],
      [x, site.eave, 0]
    )
  dimensions.box([middle, -0.332, -1.2], [totalWidth, 0.012, 0.035])
  dimensions.box([totalWidth + 1.2, -0.332, midDepth], [0.035, 0.012, depth])
  for (let x = 0; x <= totalWidth; x += site.width)
    dimensions.box([x, -0.326, -1.2], [0.04, 0.012, 0.55])
  for (let z = 0; z <= depth; z += 5)
    dimensions.box([totalWidth + 1.2, -0.326, z], [0.55, 0.012, 0.04])
  const plants = createCropPositions(config)
  const crops: SiteMesh[] = []
  if (plants.length)
    for (const model of createCropModels(config)) {
      const selected = plants.filter(
        (plant) =>
          plant.species === model.species && plant.variant === model.variant
      )
      if (!selected.length) continue
      const instances = readSpatialInstances(
        selected.map(({ position, yaw }) => ({ position, yaw }))
      )
      model.parts.forEach((part, index) =>
        crops.push({
          id: `${model.species}-${model.variant}-${index}`,
          layer: model.species === 'cucumber-1914' ? 'cucumbers' : 'tomatoes',
          visible: true,
          descriptor: readSpatialDescriptor({
            kind: 'mesh',
            position: [0, 0, 0],
            rotation: [0, 0, 0, 1],
            shape: part.shape,
            distant: { shape: part.distantShape, maxError: 0.06 },
            roughness: part.roughness,
            ...(part.surface
              ? {
                  surface:
                    part.surface === CUCUMBER_LEAF_SURFACE
                      ? cucumberSurface
                      : tomatoSurface
                }
              : {}),
            metalness: 0,
            instances,
            color: part.color,
            opacity: 1,
            wireframe: false,
            selectable: false
          }) as SpatialMesh
        })
      )
    }
  return [
    ...crops,
    mesh('base', base, 0xc8cebd),
    ...(soil.positions.length ? [mesh('soil', soil, 0x765437)] : []),
    ...(drains.positions.length ? [mesh('drains', drains, 0x3d6266, 0.8)] : []),
    mesh('passages', builders.passages, 0xb2b3a2),
    mesh('barriers', barriers, 0x182623),
    mesh('steel', steel, 0x8a9c9b),
    ...(builders.supports.positions.length
      ? [mesh('supports', builders.supports, 0x8a9c9b)]
      : []),
    ...netBuilders
      .filter((builder) => builder.positions.length)
      .map((builder, i) => mesh(`net-${i}`, builder, 0xe5e8ce, 1, 'net')),
    ...tieBuilders.map((builder, i) =>
      mesh(`ties-${i}`, builder, 0x26322b, 1, 'ties')
    ),
    ...clipBuilders.map((builder, bay) =>
      mesh(`clips-${bay}`, builder, 0xb4bfbe, 1, 'clips')
    ),
    mesh('dimensions', dimensions, 0x326c55),
    mesh('film', film, 0xf3f5ee, INITIAL_VIEW.filmOpacity)
  ]
}

export function projectView(
  meshes: SiteMesh[],
  view: ViewState
): SpatialFrame['meshes'] {
  return meshes.map((item) => ({
    ...item,
    visible: view.layers[item.layer],
    descriptor:
      item.id === 'film'
        ? { ...item.descriptor, opacity: view.filmOpacity }
        : item.descriptor
  }))
}

export function cameraPreset(
  mode: CameraMode,
  config: FarmConfiguration = DEFAULT_CONFIGURATION
): SpatialCamera {
  const site = configurationSite(config)
  if (mode === 'joint') {
    const target = supportJointTarget(config)
    return {
      kind: 'camera',
      target,
      position: [target[0] - 0.13, target[1] + 0.09, target[2] - 0.17],
      fov: 43,
      near: 0.001,
      far: Math.max(400, site.length * 5, site.width * 20)
    }
  }
  const positions = {
    overview: [(site.width * 53) / 7, site.height * 7.2, -site.length * 0.58],
    top: [
      site.width * 2,
      Math.max(site.length, site.width * 4) * 1.56,
      site.length / 2 - 0.01
    ],
    front: [site.width * 2, site.height * 1.6, -site.width * 6],
    inside: [
      site.width + site.margin / 2,
      Math.min(1.65, site.eave * 0.55),
      Math.min(3, site.length / 10)
    ]
  } as const
  const target =
    mode === 'inside'
      ? ([
          site.width + site.margin / 2,
          Math.min(1.65, site.eave * 0.55),
          site.length * 0.8
        ] as const)
      : ([site.width * 2, 0, site.length / 2] as const)
  return {
    kind: 'camera',
    position: positions[mode],
    target,
    fov: 43,
    near: 0.05,
    far: Math.max(400, site.length * 5, site.width * 20)
  }
}

/** Preserve horizontal coverage on narrow viewports; metres and geometry stay fixed. */
export function fitCamera(
  camera: SpatialCamera,
  aspect: number
): SpatialCamera {
  if (!Number.isFinite(aspect) || aspect <= 0)
    throw new Error('Invalid viewport aspect')
  const factor = Math.max(1, 1.5 / aspect)
  return {
    ...camera,
    fov: Math.min(
      150,
      (2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * factor) * 180) /
        Math.PI
    )
  }
}

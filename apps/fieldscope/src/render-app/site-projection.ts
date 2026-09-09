import {
  CUCUMBER_LEAF_SURFACE,
  TOMATO_LEAF_SURFACE
} from '../domain/leaf-surface'
import { readSpatialSurface } from '../engine/surface-textures'
import { SiteGeometry } from './site-geometry'
import { createDrainProfile } from '../domain/drain-profile'
import {
  DEFAULT_CONFIGURATION,
  configurationSite,
  type FarmConfiguration
} from '../domain/farm-configuration'
import { buildCultivationMeshes } from './cultivation-projection'
import { supportJointTarget } from '../domain/planting-supports'
import { createLayout, createStructure, roofPoint } from '../domain/greenhouse'
import { TriangleBuilder } from '../domain/mesh'
import { readSpatialDescriptor } from '../engine/spatial-contract'
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

/** One scene per completed configuration; unchanged shared shapes survive layout edits. */
export function buildSiteMeshes(
  config: FarmConfiguration = DEFAULT_CONFIGURATION,
  geometry = new SiteGeometry()
): SiteMesh[] {
  const site = configurationSite(config)
  // At most 32 authored strips: scalar dependency selection, not a scene diff.
  const layout = [
    config.width,
    ...config.strips.flatMap(({ kind, width }) => [kind, width])
  ]
  const planting = [
    ...layout,
    config.length,
    config.soilInset,
    config.startInset,
    config.endInset
  ]
  return [
    ...geometry.projection(
      'crops',
      [...planting, config.netTop, config.netBottom],
      () => buildCropMeshes(config, geometry)
    ),
    ...geometry.projection('terrain', [config.length, ...layout], () =>
      buildTerrainMeshes(config, geometry)
    ),
    ...geometry.projection(
      'envelope',
      [config.width, config.length, config.height, site.eave],
      () => buildEnvelopeMeshes(config)
    ),
    ...geometry.projection(
      'cultivation',
      [
        ...planting,
        site.eave,
        config.topExtension,
        config.netTop,
        config.netBottom
      ],
      () => buildCultivationMeshes(config, geometry)
    )
  ]
}

function buildEnvelopeMeshes(config: FarmConfiguration): SiteMesh[] {
  const site = configurationSite(config)
  const totalWidth = site.width * site.bays,
    depth = site.length,
    middle = totalWidth / 2,
    midDepth = depth / 2
  const doorHalf = Math.min(1, site.width / 4),
    doorHeight = Math.min(2.5, (site.eave * 5) / 6)
  const roof = (bay: number, fraction: number, z: number) =>
    roofPoint(bay, fraction, z, site)
  const builders = Object.fromEntries(
    Object.keys(INITIAL_LAYERS).map((key) => [key, new TriangleBuilder()])
  ) as Record<LayerId, TriangleBuilder>
  const { steel, barriers, film, dimensions } = builders
  for (const member of createStructure(site)) steel.tube(member)
  for (const x of [
    site.barrierThickness / 2,
    totalWidth - site.barrierThickness / 2
  ])
    barriers.box(
      [x, site.barrierHeight / 2, midDepth],
      [site.barrierThickness, site.barrierHeight, depth]
    )
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
  return [
    mesh('barriers', barriers, 0x182623),
    mesh('steel', steel, 0x8a9c9b),
    mesh('dimensions', dimensions, 0x326c55),
    mesh('film', film, 0xf3f5ee, INITIAL_VIEW.filmOpacity)
  ]
}

function buildTerrainMeshes(
  config: FarmConfiguration,
  geometry: SiteGeometry
): SiteMesh[] {
  const site = configurationSite(config)
  const totalWidth = site.width * site.bays,
    depth = site.length,
    middle = totalWidth / 2,
    midDepth = depth / 2
  const { strips, passages } = createLayout(site, config.strips)
  const builders = Object.fromEntries(
    Object.keys(INITIAL_LAYERS).map((key) => [key, new TriangleBuilder()])
  ) as Record<LayerId, TriangleBuilder>
  const { base, soil, drains } = builders
  const terrainDepth = Math.max(
    0.35,
    ...strips
      .filter((strip) => strip.kind === 'drain')
      .map((strip) => createDrainProfile(strip.width).depth + 0.05)
  )
  const ground = geometry.projection(
    'base',
    [site.width, depth, terrainDepth],
    () => {
      base.box(
        [middle, -terrainDepth - 0.13, midDepth],
        [totalWidth + 6, 0.26, depth + 6]
      )
      return [mesh('base', base, 0xc8cebd)]
    }
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
  for (const x of [site.margin / 2, totalWidth - site.margin / 2]) {
    builders.passages.box(
      [x, -terrainDepth / 2, midDepth],
      [site.margin, terrainDepth, depth]
    )
  }
  return [
    ...ground,
    ...(soil.positions.length ? [mesh('soil', soil, 0x765437)] : []),
    ...(drains.positions.length ? [mesh('drains', drains, 0x3d6266, 0.8)] : []),
    mesh('passages', builders.passages, 0xb2b3a2)
  ]
}

function buildCropMeshes(
  config: FarmConfiguration,
  geometry: SiteGeometry
): SiteMesh[] {
  const groups = geometry.cropInstances(config)
  const crops: SiteMesh[] = []
  if (groups.size)
    for (const model of geometry.cropModels(config)) {
      const instances = groups.get(`${model.species}-${model.variant}`)
      if (!instances) continue
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
  return crops
}

export function projectView(
  meshes: SiteMesh[],
  view: ViewState
): SpatialFrame['meshes'] {
  return meshes.map((item) => ({
    ...item,
    visible: view.layers[item.layer],
    descriptor:
      item.id === 'film' && item.descriptor.opacity !== view.filmOpacity
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

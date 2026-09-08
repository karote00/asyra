import {
  SITE,
  createLayout,
  createStructure,
  roofPoint
} from '../domain/greenhouse'
import { TriangleBuilder } from '../domain/mesh'
import { readSpatialDescriptor } from '../engine/spatial-contract'
import type { SpatialFrame, SpatialMesh, SpatialCamera } from './spatial-layer'

export type LayerId =
  | 'film'
  | 'steel'
  | 'soil'
  | 'drains'
  | 'passages'
  | 'barriers'
  | 'dimensions'
  | 'base'
export const LAYER_LABELS: Record<Exclude<LayerId, 'base'>, string> = {
  film: '塑膠覆膜',
  steel: '完整鋼架',
  soil: '土壤畦面',
  drains: '凹陷水溝',
  passages: '連棟走道',
  barriers: '外側防水擋板',
  dimensions: '尺寸參考線'
}
export const INITIAL_LAYERS: Record<LayerId, boolean> = {
  film: true,
  steel: true,
  soil: true,
  drains: true,
  passages: true,
  barriers: true,
  dimensions: true,
  base: true
}
export type CameraMode = 'overview' | 'top' | 'front' | 'inside'
export interface ViewState {
  layers: Record<LayerId, boolean>
  filmOpacity: number
  camera: CameraMode
}
export const INITIAL_VIEW: ViewState = {
  layers: INITIAL_LAYERS,
  filmOpacity: 0.6,
  camera: 'overview'
}

const mesh = (
  id: string,
  builder: TriangleBuilder,
  color: number,
  opacity = 1
): SpatialFrame['meshes'][number] => ({
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

/** One admitted static geometry product per runtime. View changes never rebuild it. */
export function buildSiteMeshes(): SpatialFrame['meshes'] {
  const { strips, passages } = createLayout()
  const builders = Object.fromEntries(
    Object.keys(INITIAL_LAYERS).map((key) => [key, new TriangleBuilder()])
  ) as Record<LayerId, TriangleBuilder>
  const { steel, soil, drains, barriers, film, base, dimensions } = builders
  for (const member of createStructure()) steel.tube(member)
  base.box([14, -0.48, 25], [34, 0.26, 56])
  for (const strip of strips) {
    const middle = strip.x + strip.width / 2
    if (strip.kind === 'soil')
      soil.box([middle, -0.175, 25], [strip.width, 0.35, 50])
    else
      drains.box([middle, -SITE.drainDepth - 0.05, 25], [strip.width, 0.1, 50])
  }
  for (const p of passages)
    builders.passages.box([p.x + p.width / 2, -0.175, 25], [p.width, 0.35, 50])
  for (const x of [SITE.margin / 2, 28 - SITE.margin / 2]) {
    builders.passages.box([x, -0.175, 25], [SITE.margin, 0.35, 50])
    barriers.box(
      [x < 1 ? 0.01 : 27.99, SITE.barrierHeight / 2, 25],
      [SITE.barrierThickness, SITE.barrierHeight, 50]
    )
  }
  // Shared overhead U-gutters; they are separate from ground drainage channels.
  for (const x of [7, 14, 21]) {
    steel.box([x, 3.02, 25], [0.22, 0.025, 50])
    for (const dx of [-0.1, 0.1]) steel.box([x + dx, 3.07, 25], [0.02, 0.1, 50])
  }
  for (let bay = 0; bay < 4; bay++) {
    for (let i = 0; i < 64; i++) {
      film.quad(
        roofPoint(bay, i / 64, 0),
        roofPoint(bay, (i + 1) / 64, 0),
        roofPoint(bay, (i + 1) / 64, 50),
        roofPoint(bay, i / 64, 50)
      )
      for (const z of [0, 50]) {
        const a = roofPoint(bay, i / 64, z),
          b = roofPoint(bay, (i + 1) / 64, z)
        film.quad([a[0], 3, z], [b[0], 3, z], b, a)
      }
    }
    for (const z of [0, 50]) {
      const left = bay * 7,
        center = left + 3.5
      film.quad(
        [left, 0, z],
        [center - 1, 0, z],
        [center - 1, 3, z],
        [left, 3, z]
      )
      film.quad(
        [center + 1, 0, z],
        [left + 7, 0, z],
        [left + 7, 3, z],
        [center + 1, 3, z]
      )
      film.quad(
        [center - 1, 2.5, z],
        [center + 1, 2.5, z],
        [center + 1, 3, z],
        [center - 1, 3, z]
      )
    }
  }
  for (const x of [0, 28])
    film.quad([x, 0.35, 0], [x, 0.35, 50], [x, 3, 50], [x, 3, 0])
  dimensions.box([14, -0.332, -1.2], [28, 0.012, 0.035])
  dimensions.box([29.2, -0.332, 25], [0.035, 0.012, 50])
  for (let x = 0; x <= 28; x += 7)
    dimensions.box([x, -0.326, -1.2], [0.04, 0.012, 0.55])
  for (let z = 0; z <= 50; z += 5)
    dimensions.box([29.2, -0.326, z], [0.55, 0.012, 0.04])
  return [
    mesh('base', base, 0xc8cebd),
    mesh('soil', soil, 0x765437),
    mesh('drains', drains, 0x3d6266),
    mesh('passages', builders.passages, 0xb2b3a2),
    mesh('barriers', barriers, 0x182623),
    mesh('steel', steel, 0x8a9c9b),
    mesh('dimensions', dimensions, 0x326c55),
    mesh('film', film, 0xf3f5ee, INITIAL_VIEW.filmOpacity)
  ]
}

export function projectView(
  meshes: SpatialFrame['meshes'],
  view: ViewState
): SpatialFrame['meshes'] {
  return meshes.map((item) => ({
    ...item,
    visible: view.layers[item.id as LayerId],
    descriptor:
      item.id === 'film'
        ? { ...item.descriptor, opacity: view.filmOpacity }
        : item.descriptor
  }))
}

export function cameraPreset(mode: CameraMode): SpatialCamera {
  const positions = {
    overview: [53, 36, -29],
    top: [14, 78, 24.99],
    front: [14, 8, -42],
    inside: [7.18, 1.65, 3]
  } as const
  const target =
    mode === 'inside' ? ([7.18, 1.65, 40] as const) : ([14, 0, 25] as const)
  return {
    kind: 'camera',
    position: positions[mode],
    target,
    fov: 43,
    near: 0.05,
    far: 400
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

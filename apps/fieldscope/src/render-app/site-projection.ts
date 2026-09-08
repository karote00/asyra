import { createPlantingNet, NET_LAYOUT } from '../domain/planting-net'
import {
  createSupportAssembly,
  springClipWire,
  supportJointTarget
} from '../domain/planting-supports'
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
  net: '攀爬拉網',
  ties: '竿頂束帶',
  supports: '栽培鋼管',
  clips: '跨接彈簧夾',
  film: '塑膠覆膜',
  steel: '完整鋼架',
  soil: '土壤畦面',
  drains: '凹陷水溝',
  passages: '連棟走道',
  barriers: '外側防水擋板',
  dimensions: '尺寸參考線'
}
export const INITIAL_LAYERS: Record<LayerId, boolean> = {
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
export const INITIAL_VIEW: ViewState = {
  layers: INITIAL_LAYERS,
  filmOpacity: 0.6,
  camera: 'overview'
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

/** One admitted static geometry product per runtime. View changes never rebuild it. */
export function buildSiteMeshes(): SiteMesh[] {
  const { strips, passages } = createLayout()
  const builders = Object.fromEntries(
    Object.keys(INITIAL_LAYERS).map((key) => [key, new TriangleBuilder()])
  ) as Record<LayerId, TriangleBuilder>
  const { steel, soil, drains, barriers, film, base, dimensions } = builders
  for (const member of createStructure()) steel.tube(member)
  const assembly = createSupportAssembly()
  for (const tube of [...assembly.tubes, ...assembly.rails])
    builders.supports.tube(tube)
  const net = createPlantingNet(assembly)
  for (const strand of net.strands) builders.net.tube(strand)
  for (const tie of net.ties) {
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
      builders.ties.quad(
        point(a, outer, low),
        point(b, outer, low),
        point(b, outer, high),
        point(a, outer, high)
      )
      builders.ties.quad(
        point(b, inner, low),
        point(a, inner, low),
        point(a, inner, high),
        point(b, inner, high)
      )
      builders.ties.quad(
        point(a, inner, high),
        point(a, outer, high),
        point(b, outer, high),
        point(b, inner, high)
      )
      builders.ties.quad(
        point(a, outer, low),
        point(a, inner, low),
        point(b, inner, low),
        point(b, outer, low)
      )
    }
    builders.ties.box([x + tie.radius, y, z], [0.004, 0.006, 0.006])
    builders.ties.box(
      [x + tie.radius + 0.005, y, z],
      [0.01, NET_LAYOUT.tieWidth, NET_LAYOUT.tieThickness]
    )
  }
  // Batch by bay to keep every admitted index buffer below the engine limit.
  const clipBuilders = Array.from(
    { length: SITE.bays },
    () => new TriangleBuilder()
  )
  for (const clip of assembly.clips)
    clipBuilders[clip.bay].tube(springClipWire(clip))
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
    mesh('supports', builders.supports, 0x8a9c9b),
    mesh('net', builders.net, 0xe5e8ce),
    mesh('ties', builders.ties, 0x26322b),
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

export function cameraPreset(mode: CameraMode): SpatialCamera {
  if (mode === 'joint') {
    const target = supportJointTarget()
    return {
      kind: 'camera',
      target,
      position: [target[0] - 0.13, target[1] + 0.09, target[2] - 0.17],
      fov: 43,
      near: 0.001,
      far: 400
    }
  }
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

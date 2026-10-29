import {
  discussionTree,
  DISCUSSION_CONIFER_SIZES
} from '../scene/discussion-details'
import { americanoGlass, sugarJar } from '../assets/discussion-tableware'
import { pantryShelfSucculent } from '../assets/pantry-shelf-plant'
import { frameNightLight } from '../assets/frame-night-light'
import { pantryNightLight } from '../assets/pantry-night-light'
import { createSurfaces } from '../scene/surfaces'
import { throwPillow } from '../assets/pillow'
import {
  PANTRY_VESSEL_LABELS,
  isPantryVessel,
  pantryVessel
} from '../assets/pantry-vessels'
import { awning } from '../assets/awning'
import { wallClock } from '../assets/clock'
import { chalkboard } from '../assets/chalkboard'
import { manhole } from '../assets/manhole'
import {
  SpatialBoundsOwner,
  fitSpatialCameraBounds,
  readSpatialCamera,
  type SpatialLayer
} from '@asyra/preset/spatial'
import type { SpatialVector } from '@asyra/preset/spatial-contract'
import { buildSpatialMeshes } from '../scene/reference-scene'
import { vec } from '../assets/geometry'
import { leaf, tree } from '../assets/vegetation'
import { planter } from '../assets/plants'
import { catalogAsset } from '../assets/catalog'
import {
  teaTable,
  teaChair,
  bench,
  laptop,
  mug,
  lantern
} from '../assets/furnishings'
import { puppet } from '../assets/puppets'
import { part, type AssetPart } from '../assets/catalog'
import type { ReviewSnapshot, ReviewView } from './controller'

export const REVIEW_ASSETS = {
  'sugar-jar': 'Sugar jar - ceramic, leaning lid and spoon',
  'iced-americano': 'Iced Americano - glass, liquid and ice',
  'discussion-conifer': 'Discussion room - photo-directed conifer',
  'shelf-succulent': 'Shelf - blue succulent pot',
  'pantry-night-light': 'Night-light - original glass shade',
  'frame-night-light': 'Night-light - bronze frame',
  ...PANTRY_VESSEL_LABELS,
  leaf: 'Street tree - shared leaf',
  cluster: 'Street tree - first authored leaf cluster',
  'bare-tree': 'Street tree - bare branches',
  tree: 'Street tree - authored canopy',
  plant: 'Potted leaf plant',
  'plant-shrub': 'Potted plant - small-leaf crown',
  'plant-lanceolate': 'Potted plant - arching lanceolate leaves',
  'window-four-pane': 'Four-pane window',
  awning: 'Striped shop awning',
  pillow: 'Throw pillow',
  'entry-door-set': 'Complete entrance door',
  'floor-plank': 'One floor plank',
  'stair-step': 'One step',
  'writing-desk': 'Writing desk',
  'work-chair': 'Work chair',
  'two-seat-sofa': 'Two-seat sofa',
  'lounge-armchair': 'Lounge armchair',
  'round-coffee-table': 'Round coffee table',
  'pantry-fridge': 'Refrigerator',
  'water-dispenser': 'Water dispenser',
  'sink-cabinet': 'Sink cabinet',
  'coffee-machine': 'Coffee machine',
  'low-bookcase': 'Low bookcase',
  'round-tea-table': 'Round tea table',
  'tea-chair': 'Tea chair',
  'park-bench': 'Park bench',
  laptop: 'Laptop',
  mug: 'Ceramic mug',
  manhole: 'Manhole cover and frame',
  clock: 'Wall clock',
  chalkboard: 'Entry chalkboard',
  lantern: 'Street lantern',
  man: 'Male puppet',
  woman: 'Female puppet'
} as const
export type ReviewAsset = keyof typeof REVIEW_ASSETS

export function createAssetReviewController(
  layer: Pick<SpatialLayer, 'submit' | 'submitCamera'>,
  asset: ReviewAsset,
  dimensions: { width: number; height: number },
  build?: () => AssetPart[]
) {
  const construct = () => {
    if (asset === 'sugar-jar') return sugarJar()
    if (asset === 'iced-americano') return americanoGlass()
    if (asset === 'discussion-conifer')
      return discussionTree(DISCUSSION_CONIFER_SIZES.floor, 37)
    if (asset === 'shelf-succulent') return pantryShelfSucculent()
    if (asset === 'pantry-night-light') return pantryNightLight()
    if (asset === 'frame-night-light') return frameNightLight()
    if (asset === 'leaf') return [part('leaf', leaf(), 0x829347, 'leaf', 0.9)]
    if (!Object.hasOwn(REVIEW_ASSETS, asset))
      throw new Error('Unknown review asset')
    if (isPantryVessel(asset)) return pantryVessel(asset)
    if (asset === 'pillow') return [throwPillow()]
    if (asset === 'awning') return awning()
    if (asset === 'plant') return planter()
    if (asset === 'plant-shrub') return planter(1, 0x956a48, 606, 'shrub')
    if (asset === 'plant-lanceolate')
      return planter(1, 0xe8dbc3, 606, 'lanceolate')
    if (asset === 'round-tea-table') return teaTable()
    if (asset === 'tea-chair') return teaChair()
    if (asset === 'park-bench') return bench()
    if (asset === 'laptop') return laptop()
    if (asset === 'mug') return mug()
    if (asset === 'manhole') return manhole()
    if (asset === 'clock') return wallClock()
    if (asset === 'chalkboard') return chalkboard()
    if (asset === 'lantern') return lantern()
    if (asset === 'man' || asset === 'woman') return puppet(asset)
    if (asset !== 'tree' && asset !== 'bare-tree' && asset !== 'cluster')
      return catalogAsset(asset)
    const parts = tree()
    if (asset === 'bare-tree') return parts.filter((p) => !p.instances)
    if (asset === 'cluster')
      return parts
        .filter((p) => p.instances)
        .map((p) => ({
          ...p,
          instances: p.instances?.filter((i) => i.id.startsWith('cluster-0-'))
        }))
    return parts
  }
  const parts = (build ?? construct)()
  const meshes = buildSpatialMeshes(
    { parts, assemblies: [], labels: [] },
    createSurfaces()
  )
  // Inspection retains the master. Runtime LoD remains on the office path.
  const master = meshes.map((m) => ({
    ...m,
    descriptor: { ...m.descriptor, distant: undefined }
  }))
  const owner = new SpatialBoundsOwner()
  const bounds = owner.measure(master.map((m) => m.descriptor))
  owner.dispose()
  const triangles = parts.reduce(
    (n, p) => n + (p.mesh.indices.length / 3) * (p.instances?.length ?? 1),
    0
  )
  let snapshot: ReviewSnapshot = Object.freeze({
    view: 'Three-quarter',
    neutral: false,
    detail: 'near',
    triangles
  })
  const listeners = new Set<() => void>()
  let disposed = false
  const directions: Record<ReviewView, SpatialVector> = {
    Front: [0, 0, 1],
    Right: [1, 0, 0],
    Back: [0, 0, -1],
    Top: [0, 1, 0.00001],
    'Three-quarter': [1, 0.65, 1],
    'Cap detail': [1, 0.65, 1],
    Distant: [1, 0.65, 1]
  }
  const update = (view: ReviewView, neutral: boolean, initial = false) => {
    if (disposed) throw new Error('Asset preview is disposed')
    if (!Object.hasOwn(directions, view)) throw new Error('Unknown review view')
    const base = readSpatialCamera({
      kind: 'camera',
      position: directions[view],
      target: [0, 0, 0],
      fov: 1,
      near: 0.0001,
      far: 1000
    })
    let camera = fitSpatialCameraBounds(
      base,
      bounds,
      dimensions.width,
      dimensions.height,
      { padding: Math.min(40, dimensions.height * 0.1), verticalFov: 1 }
    )
    if (view === 'Cap detail')
      camera = readSpatialCamera({
        ...camera,
        position: vec(
          camera.position.map(
            (n, i) => camera.target[i] + (n - camera.target[i]) * 0.45
          )
        )
      })
    const distance = Math.hypot(
      ...camera.position.map((n, i) => n - camera.target[i])
    )
    const radius = bounds
      ? Math.hypot(...bounds.max.map((n, i) => n - bounds.min[i])) * 0.55
      : 1
    camera = readSpatialCamera({
      ...camera,
      near: Math.max(0.000001, distance - radius),
      far: distance + radius
    })
    if (initial || neutral !== snapshot.neutral)
      layer.submit({
        camera,
        meshes: master.map((m) => ({
          ...m,
          descriptor: {
            ...m.descriptor,
            color: neutral ? 0xb9b9b9 : m.descriptor.color,
            surface: neutral ? undefined : m.descriptor.surface
          }
        }))
      })
    else layer.submitCamera(camera)
    snapshot = Object.freeze({ ...snapshot, view, neutral })
    listeners.forEach((fn) => fn())
  }
  update(snapshot.view, snapshot.neutral, true)
  return {
    getSnapshot: () => snapshot,
    subscribe: (fn: () => void) => {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
    setView: (view: ReviewView) => update(view, snapshot.neutral),
    setNeutral: (neutral: boolean) => update(snapshot.view, neutral),
    resize: (height: number, _pixelRatio: number, width = dimensions.width) => {
      dimensions = { width, height }
      update(snapshot.view, snapshot.neutral)
    },
    dispose: () => {
      disposed = true
      listeners.clear()
    }
  }
}

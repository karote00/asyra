import { batchStaticColors } from './color-batching'
import { composeRoomFurnishings } from './room-furnishings'
import { composeOfficeSeating } from './office-seating'
import { OFFICE_FIT, OFFICE_FLOORS, referencePoint } from './office-layout'
import type { ArtworkRegion } from './artwork'
import { indoorPlant } from './interior-plants'
import {
  composeOfficeInterior,
  INTERIOR_REVIEW_STAGE,
  type InteriorStage
} from './office-interior'
import { awning } from '../assets/awning'
import { chalkboard } from '../assets/chalkboard'
import { manhole } from '../assets/manhole'
import { roadWithOpening } from '../assets/road-opening'
import {
  readSpatialDescriptor,
  type SpatialSurface
} from '@asyra/preset/spatial-contract'
import type { SpatialFrame } from '@asyra/preset/spatial'
import {
  append,
  box,
  emptyMesh,
  ellipsoid,
  toSpatial,
  renderPosition,
  type Mesh,
  type Vec
} from '../assets/geometry'
import {
  catalogAsset,
  part,
  placeParts,
  type AssetPart,
  type SurfaceKind
} from '../assets/catalog'
import { bench, lantern, mug, planter } from '../assets/furnishings'
import { spatialInstance } from '../assets/instances'
import { puppet } from '../assets/puppets'
import { createTreeVariants } from '../assets/vegetation'

export interface SceneAssembly {
  id: string
  asset: string
  position: Vec
  parts: readonly string[]
}
export interface Label {
  kind?: 'surface' | 'lettering'
  artwork?: ArtworkRegion
  text: string
  width: number
  height: number
  position: Vec
  rotation: number
  tilt?: number
  color: string
  background: string
}
export const ACTORS = [
  {
    id: 'mina',
    name: 'Mina',
    role: 'Designer',
    activity: 'Shaping a new idea',
    position: OFFICE_FIT.furniture['desk-chair'].position as Vec,
    rotation: 0,
    seatHeight: 0.35 * OFFICE_FIT.furniture['desk-chair'].scale[2],
    profile: 'woman' as const,
    color: 0xf2ecdf,
    status: 'Working'
  },
  {
    id: 'leo',
    name: 'Leo',
    role: 'Planner',
    activity: 'Thinking over coffee',
    position: OFFICE_FIT.furniture['meeting-chair-left'].position as Vec,
    rotation: OFFICE_FIT.furniture['meeting-chair-left'].rotation,
    seatHeight: 0.33 * OFFICE_FIT.furniture['meeting-chair-left'].scale[2],
    profile: 'man' as const,
    color: 0xeee4d1,
    status: 'Thinking'
  },
  {
    id: 'sage',
    name: 'Sage',
    role: 'Builder',
    activity: 'Taking a coffee break',
    position: referencePoint([857, 375], 2, OFFICE_FLOORS.pantry),
    rotation: 25,
    profile: 'man' as const,
    color: 0x87957b,
    status: 'On a break'
  },
  {
    id: 'kai',
    name: 'Kai',
    role: 'Researcher',
    activity: 'A little fresh air',
    position: [-1.5, -3.45, 0.03] as Vec,
    rotation: -35,
    profile: 'man' as const,
    color: 0xf2ece2,
    status: 'Walking'
  },
  {
    id: 'noah',
    name: 'Noah',
    role: 'Writer',
    activity: 'Enjoying the riverside',
    position: [4.25, -1.91, 0.18] as Vec,
    rotation: 0,
    seatHeight: 0.408,
    profile: 'man' as const,
    color: 0xc48b55,
    status: 'Resting'
  }
] as const
export const PLACES = [
  {
    id: 'office',
    name: 'Office',
    description: 'Home base',
    icon: 'home',
    target: [0, 0, 0.9] as Vec
  },
  {
    id: 'work',
    name: 'Work room',
    description: 'Desk, shelves, ideas',
    icon: 'table',
    target: [-2, -1.2, OFFICE_FLOORS.work + 0.55] as Vec
  },
  {
    id: 'trees',
    name: 'Street trees',
    description: 'Leaves and branches',
    icon: 'leaf',
    target: [4.35, 2.4, 1.65] as Vec
  },
  {
    id: 'tea',
    name: 'Tea point',
    description: 'Coffee, chats, ideas',
    icon: 'cup',
    target: referencePoint([856, 302], 2, OFFICE_FLOORS.pantry + 0.55).map(
      (v, axis) => (axis === 1 ? v + 1 : v)
    ) as Vec
  },
  {
    id: 'lounge',
    name: 'Lounge',
    description: 'Room to slow down',
    icon: 'sofa',
    target: [1.55, -1.5, OFFICE_FLOORS.lounge + 0.4] as Vec
  },
  {
    id: 'table',
    name: 'Meeting corner',
    description: 'Small room, big ideas',
    icon: 'table',
    target: [-1.48, 2.53, OFFICE_FLOORS.discussion + 0.55] as Vec
  },
  {
    id: 'park',
    name: 'Riverside',
    description: 'Fresh air, new views',
    icon: 'leaf',
    target: [4.2, -2.4, 0.6] as Vec
  }
] as const
export type ReferenceScene = Pick<
  ReturnType<typeof createReferenceScene>,
  'assemblies' | 'parts' | 'labels'
>
export function createReferenceScene(
  stage: InteriorStage = INTERIOR_REVIEW_STAGE
) {
  const assemblies: SceneAssembly[] = [],
    all: AssetPart[] = [],
    labels: Label[] = []
  const add = (
    id: string,
    asset: string,
    parts: readonly AssetPart[],
    position: Vec = [0, 0, 0],
    rotation = 0,
    scale: Vec = [1, 1, 1]
  ) => {
    assemblies.push({ id, asset, position, parts: parts.map((p) => p.id) })
    all.push(...placeParts(parts, position, rotation, scale))
  }
  const block = (
    id: string,
    size: Vec,
    pos: Vec,
    color: number,
    material: SurfaceKind = 'plain',
    radius = 0.005
  ) =>
    add(
      id,
      'procedural-box',
      [part('body', box(size, radius, 2), color, material)],
      pos
    )
  const asset = (
    id: string,
    key: string,
    pos: Vec,
    rotation = 0,
    scale: Vec = [1, 1, 1]
  ) => add(id, key, catalogAsset(key), pos, rotation, scale)
  const plant = (
    id: string,
    pos: Vec,
    scale = 0.7,
    appearance: {
      color?: number
      form?: 'stemmed' | 'rosette' | 'shrub' | 'lanceolate'
    } = {}
  ) => {
    // Stable layout identity, not traversal order or frame time, selects growth.
    let seed = 2166136261
    for (const character of id)
      seed = Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0
    add(
      id,
      'planter',
      planter(scale, appearance.color, seed, appearance.form),
      pos
    )
  }
  const label = (
    text: string,
    width: number,
    height: number,
    position: Vec,
    color = '#584638',
    background = '#eee5cd',
    rotation = 0
  ) =>
    labels.push({ text, width, height, position, color, background, rotation })
  // A bounded neighborhood assembled around the approved four-room cutaway.
  block('neighborhood-ground', [28, 26, 0.2], [0, 0, -0.55], 0xada899, 'stone')
  add(
    'street-front',
    'road-with-opening',
    [
      part(
        'road',
        roadWithOpening([26, 2.5, 0.12], [-0.3, 0.35], 0.33, 0.026),
        0x5c5e61,
        'stone'
      )
    ],
    [0, -4.5, -0.17]
  )
  // Owner-authorized rear neighborhood translation; front and side streets stay fixed.
  const rearOffset = 2
  block(
    'street-rear',
    [25, 2, 0.12],
    [0, 4.3 + rearOffset, -0.17],
    0x5c5e61,
    'stone'
  )
  block('street-left', [2, 22, 0.12], [-5, 0, -0.16], 0x5c5e61, 'stone')
  block(
    'sidewalk-foundation',
    [10, 7.6 + rearOffset, 0.2],
    [0.8, -0.1 + rearOffset / 2, -0.04],
    0xb5aa94,
    'stone'
  )
  for (let i = -7; i < 11; i++)
    for (let j = -6; j < 6 + rearOffset / 0.5; j++)
      block(
        `paving-${i}-${j}`,
        [0.49, 0.49, 0.07],
        [i * 0.5, j * 0.5 - 0.25, 0.075],
        [0xcac0aa, 0xd4c9b4, 0xc2b6a0][(i + j + 30) % 3],
        'stone',
        0.012
      )
  for (let i = 0; i < 7; i++)
    block(
      `crossing-${i}`,
      [0.3, 1.7, 0.003],
      [-3.8 + i * 0.46, -4.45, -0.104],
      0xe4dfcc,
      'plain',
      0
    )
  for (let x = -10; x < 11; x += 2)
    block(
      `road-line-${x}`,
      [0.8, 0.06, 0.003],
      [x, -4.55, -0.103],
      0xd9bd79,
      'plain',
      0
    )
  add('manhole', 'road-drain-cover-round', manhole(), [-0.3, -4.15, -0.11])
  // Canal, masonry bank and a small landscaped sitting terrace.
  block('canal', [3.8, 16, 0.13], [7.1, -2, -0.38], 0x668c89, 'water')
  for (let i = 0; i < 20; i++)
    block(
      `water-ripple-${i}`,
      [0.3 + (i % 4) * 0.12, 0.018, 0.004],
      [5.9 + (i % 4) * 0.7, -7 + i * 0.53, -0.309],
      0xa4bbb0,
      'water',
      0
    )
  block('park-base', [2.7, 3.3, 0.35], [4.22, -1.95, -0.02], 0xc0b39a, 'stone')
  for (let z = 0; z < 3; z++)
    for (let j = 0; j < 7; j++)
      block(
        `bank-${z}-${j}`,
        [0.24, 0.46, 0.16],
        [5.58, -3.5 + j * 0.5 + (z % 2) * 0.14, -0.34 + z * 0.17],
        0xb9b29e,
        'stone',
        0.018
      )
  const interiorStart = assemblies.length
  const interiorLabelStart = labels.length
  composeOfficeInterior({ add, block, asset, plant, label, labels })
  const tableTops =
    stage !== 'structure'
      ? composeOfficeSeating({ add })
      : new Map<string, number>()
  if (stage === 'room-furnishings')
    composeRoomFurnishings(
      { add, block, asset, plant, label, labels },
      tableTops
    )
  const interiorLabels = new Set(labels.slice(interiorLabelStart))
  const interiorAssemblyIds = new Set(
    assemblies
      .slice(interiorStart)
      .filter((a) => !a.id.startsWith('entrance-step'))
      .map((a) => a.id)
  )
  // Layered planters frame room edges, clear of the walking paths and work surfaces.
  for (const [i, pos] of (
    [
      referencePoint([470, 275], 2, OFFICE_FLOORS.discussion),
      referencePoint([350, 352], 2, OFFICE_FLOORS.work),
      OFFICE_FIT.furniture['lounge-planter'].position,
      referencePoint([867, 506], 2, OFFICE_FLOORS.lounge),
      [-1.9, -2.8, 0.1],
      [4.9, -0.6, 0.2],
      [3.45, -0.85, 0.2]
    ] as Vec[]
  ).entries())
    if (i < 4) continue
    else if (i === 2) {
      const fitted = indoorPlant('room-edge-plant-2')
      add('room-edge-plant-2', 'planter', fitted.parts, fitted.position)
    } else plant(`room-edge-plant-${i}`, pos, 2.3 + (i % 3) * 0.35)
  for (let i = 0; i < 4; i++) interiorAssemblyIds.add(`room-edge-plant-${i}`)
  // Loose plants and entry chalkboard.
  for (const [i, pos] of (
    [
      [-2.7, -2.72, 0.1],
      [-2.1, -2.75, 0.1],
      [-1.5, -2.75, 0.1],
      [1.6, -2.5, 0.1],
      [2.3, -2.5, 0.1],
      [2.9, -2.4, 0.1]
    ] as Vec[]
  ).entries())
    plant(`entry-pot-${i}`, pos, 1.65 + (i % 3) * 0.25)
  add(
    'entry-chalkboard',
    'entry-chalkboard',
    chalkboard(),
    [-0.65, -2.99, 0.1],
    0,
    [1.2, 1.2, 1.2]
  )
  labels.push({
    text: 'Good\nIdeas\nLive\nHere →',
    width: 0.376,
    height: 0.52,
    position: [
      -0.65,
      -2.99 +
        1.2 *
          (-0.17 +
            0.41 * Math.sin((14 * Math.PI) / 180) -
            0.0085 * Math.cos((14 * Math.PI) / 180)),
      0.1 +
        1.2 *
          (0.41 * Math.cos((14 * Math.PI) / 180) +
            0.0085 * Math.sin((14 * Math.PI) / 180))
    ],
    rotation: 0,
    tilt: -14,
    color: '#f1e7d4',
    background: '#393e37'
  })
  // Outdoor terrace and fences.
  add(
    'park-bench',
    'park-bench',
    bench(),
    [4.25, -1.8, 0.18],
    0,
    [1.2, 1.2, 1.2]
  )
  asset('park-table', 'round-coffee-table', [3.45, -2.35, 0.18])
  add('park-coffee', 'ceramic-mug', mug(undefined, true), [3.43, -2.33, 0.5])
  for (let i = 0; i < 11; i++) {
    const y = -3.5 + i * 0.28
    block(
      `railing-post-${i}`,
      [0.035, 0.035, 0.62],
      [5.45, y, 0.48],
      0x3d433b,
      'metal',
      0.004
    )
    add(
      `railing-cap-${i}`,
      'cap',
      [part('cap', ellipsoid([0.028, 0.028, 0.035], 10, 6), 0x3d433b, 'metal')],
      [5.45, y, 0.81]
    )
  }
  for (const z of [0.5, 0.75])
    block(
      `railing-bar-${z}`,
      [0.035, 3.1, 0.025],
      [5.45, -2.05, z],
      0x3d433b,
      'metal'
    )
  for (let i = 0; i < 6; i++)
    plant(`park-pot-${i}`, [5.18, -3.3 + i * 0.53, 0.2], 2.05 + (i % 3) * 0.25)
  for (const [i, pos] of (
    [
      [-3.65, -2.5, 0.1],
      [3.25, -3.2, 0.1],
      [-3.65, 2.8 + rearOffset, 0.1],
      [4.3, 2.7 + rearOffset, 0.1]
    ] as Vec[]
  ).entries())
    add(
      `lantern-${i}`,
      'streetlight-vintage-lantern',
      lantern(),
      pos,
      0,
      [0.8, 0.8, 0.8]
    )
  // Stable individual growth and explicit whole-tree sizes; invariant leaves are shared.
  const treeSeeds = [606, 1607, 2608, 3609, 4610, 5611],
    treeSizes = [0.68, 1.12, 0.82, 1.28, 0.95, 0.73],
    treeParts = createTreeVariants(treeSeeds)
  for (const [i, pos] of (
    [
      [-3.6, 1.9, 0.1],
      [-4, -5.6, -0.1],
      [4.35, 2.4, 0.1],
      [-4, 5.4 + rearOffset, 0.1],
      [2.3, 5.5 + rearOffset, 0.1],
      [6.5, 5.4 + rearOffset, 0.1]
    ] as Vec[]
  ).entries())
    add(`tree-${i}`, 'street-tree-leafy', treeParts[i], pos, i * 11, [
      treeSizes[i],
      treeSizes[i],
      treeSizes[i]
    ])
  // Background stores frame the neighborhood, never replace the central building.
  for (const [i, x] of [-5.8, -2.7, 0.7, 4.3, 7.4].entries()) {
    const height = 3.5 + (i % 2) * 0.6
    block(
      `shop-${i}`,
      [2.8, 2.3, height],
      [x, 7 + rearOffset, height / 2 - 0.1],
      [0xc9b796, 0xd6c4a7, 0xbfb6a2][i % 3],
      'plaster',
      0.04
    )
    block(
      `shop-roof-${i}`,
      [2.95, 2.45, 0.14],
      [x, 7 + rearOffset, height - 0.03],
      0xb2a790,
      'stone',
      0.012
    )
    block(
      `shop-cornice-${i}`,
      [2.89, 0.16, 0.15],
      [x, 5.8 + rearOffset, height - 0.28],
      0xe6dac2,
      'stone',
      0.01
    )
    block(
      `shop-base-${i}`,
      [2.84, 0.11, 0.26],
      [x, 5.81 + rearOffset, 0.08],
      0x9d967f,
      'stone',
      0.01
    )
    block(
      `shop-door-${i}`,
      [0.53, 0.07, 1.45],
      [x, 5.78 + rearOffset, 0.72],
      0x826a4b,
      'wood',
      0.008
    )
    block(
      `shop-door-glass-${i}`,
      [0.4, 0.012, 0.77],
      [x, 5.738 + rearOffset, 0.95],
      0x647a7c,
      'plain',
      0.003
    )
    for (const z of [1.0, 2.7])
      for (const dx of [-0.7, 0.7]) {
        asset(
          `shop-window-${i}-${z}-${dx}`,
          'window-four-pane',
          [x + dx, 5.77 + rearOffset, z - 0.475],
          0,
          [0.77 / 1.82, 0.7, 0.95 / 1.28]
        )
      }
    block(
      `shop-sign-${i}`,
      [1.8, 0.06, 0.37],
      [x, 5.72 + rearOffset, 1.95],
      0x6a6251,
      'wood'
    )
    label(
      ['BOOKS', 'CAFÉ', 'FLOWERS', 'BAKERY', 'STUDIO'][i],
      1.6,
      0.27,
      [x, 5.68 + rearOffset, 1.95],
      '#ede3d1',
      '#6a6251'
    )
    add(
      `awning-${i}`,
      'striped-shop-awning',
      awning({ width: 2.2, moduleWidth: 0.22, palette: [0x7c8b81, 0xe9dec6] }),
      [x, 5.78 + rearOffset, 1.42]
    )
  }
  // Static modular actors are explicitly synthetic; no provider work is inferred.
  for (const actor of ACTORS) {
    const indoors = ['mina', 'leo', 'sage'].includes(actor.id)
    if (indoors) interiorAssemblyIds.add(`actor-${actor.id}`)
    if (indoors) continue
    add(
      `actor-${actor.id}`,
      'modular-puppet',
      puppet(
        actor.profile,
        actor.color,
        actor.profile === 'man' && actor.id === 'leo',
        'seatHeight' in actor ? actor.seatHeight : undefined
      ),
      [...actor.position],
      actor.rotation
    )
  }
  label('Maple St', 0.44, 0.14, [4.94, -0.937, 1.39], '#eee7d8', '#42483f')
  label('Riverside', 0.44, 0.14, [4.94, -0.937, 1.16], '#eee7d8', '#42483f')
  block(
    'street-sign-post',
    [0.045, 0.045, 1.62],
    [4.68, -0.9, 0.81],
    0x383a38,
    'metal'
  )
  add(
    'street-sign-finial',
    'finial',
    [part('finial', ellipsoid([0.03, 0.03, 0.03], 16, 10), 0x383a38, 'metal')],
    [4.68, -0.9, 1.62]
  )
  for (const z of [1.39, 1.16])
    block(
      `street-sign-board-${z}`,
      [0.48, 0.018, 0.18],
      [4.9425, -0.92, z],
      0x383a38,
      'metal'
    )
  return { assemblies, parts: all, labels, interiorAssemblyIds, interiorLabels }
}

/** Batching is session-owned construction, independent from camera/UI updates. */
export function buildSpatialMeshes(
  scene: ReferenceScene,
  surfaces: Partial<Record<SurfaceKind, SpatialSurface>>
): SpatialFrame['meshes'] {
  const groups = new Map<
      string,
      { mesh: Mesh; part: AssetPart; distant?: Mesh; maxError: number }
    >(),
    instanced: SpatialFrame['meshes'][number][] = []
  for (const [index, p] of scene.parts.entries()) {
    if (p.instances) {
      const placement = p.placement ?? {
          position: [0, 0, 0] as Vec,
          rotation: 0,
          scale: [1, 1, 1] as Vec
        },
        angle = (placement.rotation * Math.PI) / 180
      const descriptor = readSpatialDescriptor({
        kind: 'mesh',
        shape: toSpatial(p.mesh),
        instances: p.instances.map(spatialInstance),
        position: renderPosition(placement.position),
        rotation: [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)],
        scale: [placement.scale[0], placement.scale[2], placement.scale[1]],
        color: p.color,
        roughness: p.roughness,
        emissive: p.emissive ?? 0,
        emissiveIntensity: p.emissiveIntensity ?? 0,
        metalness: p.metalness ?? 0,
        environmentIntensity: p.environmentIntensity ?? 0,
        opacity: p.opacity ?? 1,
        wireframe: false,
        selectable: false,
        castShadow: (p.opacity ?? 1) === 1,
        receiveShadow: true,
        ...(p.distant
          ? {
              distant: {
                shape: toSpatial(p.distant.mesh),
                maxError: p.distant.maxError,
                pixelError: 0.75
              }
            }
          : {})
      })
      if (descriptor.kind !== 'mesh') throw new Error('Expected instanced mesh')
      instanced.push({ id: `instances-${index}`, descriptor, visible: true })
      continue
    }
    // Transparent objects need independent sorting; opaque parts retain material batching.
    const opaqueKey = `${p.material}-${p.color}-${p.roughness}-${p.metalness ?? (p.material === 'metal' ? 0.35 : 0)}-${p.emissive ?? 0}-${p.emissiveIntensity ?? 0}-${p.environmentIntensity ?? 0}`
    const key =
      (p.opacity ?? 1) < 1
        ? `${opaqueKey}-alpha-${p.opacity}-${index}`
        : opaqueKey
    let group = groups.get(key)
    if (!group) {
      group = { mesh: emptyMesh(), part: p, maxError: 0 }
      groups.set(key, group)
    }
    if (p.distant && !group.distant) {
      group.distant = emptyMesh()
      append(group.distant, group.mesh)
    }
    if (group.distant) append(group.distant, p.distant?.mesh ?? p.mesh)
    group.maxError = Math.max(group.maxError, p.distant?.maxError ?? 0)
    append(group.mesh, p.mesh)
  }
  return batchStaticColors([
    ...instanced,
    ...[...groups.entries()].map(
      ([id, { mesh, part: p, distant, maxError }]) => {
        const descriptor = readSpatialDescriptor({
          kind: 'mesh',
          shape: toSpatial(mesh),
          position: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          color: p.color,
          roughness: p.roughness,
          emissive: p.emissive ?? 0,
          emissiveIntensity: p.emissiveIntensity ?? 0,
          metalness: p.metalness ?? (p.material === 'metal' ? 0.35 : 0),
          environmentIntensity: p.environmentIntensity ?? 0,
          opacity: p.opacity ?? 1,
          wireframe: false,
          selectable: false,
          castShadow: p.material !== 'water' && (p.opacity ?? 1) === 1,
          receiveShadow: true,
          ...(distant
            ? {
                instances: [
                  {
                    id: `batch-${id}`,
                    position: [0, 0, 0],
                    rotation: [0, 0, 0, 1]
                  }
                ],
                distant: {
                  shape: toSpatial(distant),
                  maxError,
                  pixelError: 0.5
                }
              }
            : {}),
          ...(surfaces[p.material] ? { surface: surfaces[p.material] } : {})
        })
        if (descriptor.kind !== 'mesh') throw new Error('Expected mesh')
        return { id, descriptor, visible: true }
      }
    )
  ])
}

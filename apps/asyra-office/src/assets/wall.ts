import {
  readSpatialDescriptor,
  type SpatialVector,
  type SpatialSurface
} from '@asyra/preset/spatial-contract'
import type { SpatialMesh } from '@asyra/preset/spatial'
import architecture from '../../../../assets/asyra-office/models/architecture/architecture-model-spec.json'

export const WALL_ASSET_ID = 'wall-segment'
export const WALL_REGION_IDS = ['body', 'top-cap'] as const
export type WallRegion = (typeof WALL_REGION_IDS)[number]
export interface MaterialOverride {
  color?: number
  roughness?: number
  metalness?: number
  surface?: SpatialSurface
}
export interface WallOptions {
  /** Authored local X width, Y thickness, Z height, in metres. */
  size?: SpatialVector
  /** Physical cap height after sizing; omitted keeps the approved whole-unit scale. */
  capHeight?: number
  color?: number
  material?: MaterialOverride
  regions?: Partial<
    Record<WallRegion, { color?: number; material?: MaterialOverride }>
  >
}
export interface WallPart {
  id: WallRegion
  descriptor: SpatialMesh
}

const specification = (() => {
  const value = architecture.modules.find(
    (item) => item.moduleId === WALL_ASSET_ID
  )
  if (!value || !value.overallSizeMetres) {
    throw new Error('Missing approved wall specification')
  }
  return { ...value, overallSizeMetres: value.overallSizeMetres }
})()
export const WALL_DEFAULT_SIZE: SpatialVector = Object.freeze([
  specification.overallSizeMetres[0],
  specification.overallSizeMetres[1],
  specification.overallSizeMetres[2]
])
export const WALL_EDGE_RADIUS = 0.004
export const WALL_EDGE_SEGMENTS = 2

/** Authoring +Z up / -Y front to renderer +Y up / +Z front. Determinant +1. */
const toRender = ([x, y, z]: SpatialVector): SpatialVector => [x, z, -y]

function readScale(size: SpatialVector): SpatialVector {
  if (
    !Array.isArray(size) ||
    size.length !== 3 ||
    !size.every((n) => Number.isFinite(n) && n > 0)
  ) {
    throw new Error('Wall extents must be three positive finite metres')
  }
  return [
    size[0] / WALL_DEFAULT_SIZE[0],
    size[1] / WALL_DEFAULT_SIZE[1],
    size[2] / WALL_DEFAULT_SIZE[2]
  ]
}

/** Extrude one closed YZ profile; only the two upper X-parallel edges are rounded. */
function buildPart(
  width: number,
  depth: number,
  height: number,
  scale: SpatialVector,
  rounded = true
) {
  const radius = WALL_EDGE_RADIUS
  const profile: [number, number][] = [
    [-depth / 2, 0],
    [depth / 2, 0]
  ]
  if (rounded) {
    for (let i = 0; i <= WALL_EDGE_SEGMENTS; i++) {
      const angle = ((Math.PI / 2) * i) / WALL_EDGE_SEGMENTS
      profile.push([
        depth / 2 - radius + radius * Math.cos(angle),
        height - radius + radius * Math.sin(angle)
      ])
    }
    for (let i = 0; i <= WALL_EDGE_SEGMENTS; i++) {
      const angle = Math.PI / 2 + ((Math.PI / 2) * i) / WALL_EDGE_SEGMENTS
      profile.push([
        -depth / 2 + radius + radius * Math.cos(angle),
        height - radius + radius * Math.sin(angle)
      ])
    }
  } else {
    profile.push([depth / 2, height], [-depth / 2, height])
  }
  const positions: number[] = [],
    indices: number[] = [],
    uvs: number[] = []
  const point = (x: number, yz: [number, number]): SpatialVector => [
    x * scale[0],
    yz[0] * scale[1],
    (yz[1] - height / 2) * scale[2]
  ]
  const triangle = (
    a: SpatialVector,
    b: SpatialVector,
    c: SpatialVector,
    uvAxes: readonly [number, number]
  ) => {
    for (const p of [a, b, c]) {
      indices.push(positions.length / 3)
      positions.push(...toRender(p))
      uvs.push(p[uvAxes[0]], p[uvAxes[1]])
    }
  }
  for (let i = 0; i < profile.length; i++) {
    const j = (i + 1) % profile.length
    const left = point(-width / 2, profile[i]),
      nextLeft = point(-width / 2, profile[j])
    const right = point(width / 2, profile[i]),
      nextRight = point(width / 2, profile[j])
    const axes: readonly [number, number] =
      Math.abs(profile[j][0] - profile[i][0]) >
      Math.abs(profile[j][1] - profile[i][1])
        ? [0, 1]
        : [0, 2]
    triangle(left, nextLeft, nextRight, axes)
    triangle(left, nextRight, right, axes)
    triangle(point(-width / 2, [0, height / 2]), nextLeft, left, [1, 2])
    triangle(point(width / 2, [0, height / 2]), right, nextRight, [1, 2])
  }
  return { kind: 'triangles' as const, positions, indices, uvs }
}

export function createWall(options: WallOptions = {}): readonly WallPart[] {
  const scale = readScale(options.size ?? WALL_DEFAULT_SIZE)
  const totalHeight = (options.size ?? WALL_DEFAULT_SIZE)[2]
  const capHeight = options.capHeight
  if (
    capHeight !== undefined &&
    (!Number.isFinite(capHeight) ||
      capHeight <= WALL_EDGE_RADIUS * scale[2] ||
      totalHeight - capHeight <= WALL_EDGE_RADIUS * scale[2])
  ) {
    throw new Error('Wall cap must leave positive beveled body and cap regions')
  }
  return Object.freeze(
    WALL_REGION_IDS.map((id) => {
      const component = specification.components.find(
        (part) => part.partId === id
      )
      if (!component) {
        throw new Error('Missing wall region')
      }
      const defaults =
        architecture.materials[component.material as 'plaster' | 'cream-cap']
      const region = options.regions?.[id]
      const material = region?.material ?? options.material
      const color =
        region?.color ??
        options.color ??
        material?.color ??
        Number.parseInt(defaults.baseColorSRGB.slice(1), 16)
      const [width, depth, sourceHeight] = component.sizeMetres
      const height =
        capHeight === undefined
          ? sourceHeight
          : (id === 'top-cap' ? capHeight : totalHeight - capHeight) / scale[2]
      const centre = component.centreMetres.map((n, i) => n * scale[i])
      if (capHeight !== undefined) {
        centre[2] =
          id === 'top-cap'
            ? totalHeight - capHeight / 2
            : (totalHeight - capHeight) / 2
      }
      const descriptor = readSpatialDescriptor({
        kind: 'mesh',
        instances: [
          { id: WALL_ASSET_ID, position: [0, 0, 0], rotation: [0, 0, 0, 1] }
        ],
        position: toRender(centre as unknown as SpatialVector),
        rotation: [0, 0, 0, 1],
        shape: buildPart(width, depth, height, scale),
        distant: {
          shape: buildPart(width, depth, height, scale, false),
          maxError: WALL_EDGE_RADIUS * Math.max(...scale),
          pixelError: 0.5
        },
        color,
        roughness: material?.roughness ?? defaults.roughness,
        metalness: material?.metalness ?? defaults.metallic,
        ...(material?.surface ? { surface: material.surface } : {}),
        opacity: 1,
        wireframe: false,
        selectable: false,
        castShadow: true,
        receiveShadow: true
      })
      if (descriptor.kind !== 'mesh') {
        throw new Error('Expected wall mesh')
      }
      return Object.freeze({ id, descriptor })
    })
  )
}

/** Use the same validated wall in the office's author-coordinate assembly. */
export function wallAsset(
  size: SpatialVector,
  capHeight?: number
): import('./catalog').AssetPart[] {
  return createWall({ size, capHeight }).map(({ id, descriptor }) => {
    const convert = (shape: typeof descriptor.shape) => {
      if (shape.kind !== 'triangles') {
        throw new Error('Expected authored wall triangles')
      }
      const positions: number[] = []
      for (let i = 0; i < shape.positions.length; i += 3) {
        positions.push(
          shape.positions[i] + descriptor.position[0],
          -shape.positions[i + 2] - descriptor.position[2],
          shape.positions[i + 1] + descriptor.position[1]
        )
      }
      return {
        positions,
        indices: [...shape.indices],
        uvs: [...(shape.uvs ?? [])]
      }
    }
    return {
      id,
      mesh: convert(descriptor.shape),
      color: descriptor.color,
      material: 'plaster',
      roughness:
        descriptor.roughness ?? architecture.materials.plaster.roughness,
      ...(descriptor.distant
        ? {
            distant: {
              mesh: convert(descriptor.distant.shape),
              maxError: descriptor.distant.maxError
            }
          }
        : {})
    }
  })
}

import {
  readSpatialSurface,
  type SpatialSurface,
  readSpatialDescriptor
} from '@asyra/preset/spatial-contract'
import type { SpatialFrame } from '@asyra/preset/spatial'
import { type SurfaceKind } from '../assets/catalog'
import { type Label } from './reference-scene'
import { renderPosition } from '../assets/geometry'
import { glyphTriangles } from './lettering'
import { sampleArtwork, type ArtworkPixels } from './artwork'

export function createSurfaces(): Partial<Record<SurfaceKind, SpatialSurface>> {
  const result: Partial<Record<SurfaceKind, SpatialSurface>> = {}
  for (const kind of ['wood', 'fabric', 'plaster', 'stone', 'water'] as const) {
    const size = 64,
      albedo: number[] = [],
      normals: number[] = []
    let seed = 1187
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
        const noise = seed / 2 ** 32 - 0.5
        let grain = 0
        if (kind === 'wood')
          grain = Math.sin(x * 0.6 + Math.sin(y * 0.12) * 0.55) * 6
        else if (kind === 'fabric') grain = ((x + y) % 2) * 8
        else if (kind === 'water') grain = Math.sin(y * 0.5 + x * 0.12) * 7
        const value = Math.max(
          0,
          Math.min(
            255,
            Math.round(244 + noise * (kind === 'stone' ? 16 : 8) + grain)
          )
        )
        albedo.push(value, value, value, 255)
        normals.push(128, 128, 255, 255)
      }
    result[kind] = readSpatialSurface({
      width: size,
      height: size,
      albedo,
      normals
    })
  }
  return result
}
/** Artwork is a surface on a real scene object, not an image of the environment. */
export function labelMeshes(
  labels: readonly Label[],
  artwork: ReadonlyMap<string, ArtworkPixels> = new Map()
): SpatialFrame['meshes'] {
  return labels.map((label, i) => {
    const source = label.artwork ? artwork.get(label.artwork.source) : undefined
    if (label.artwork && !source)
      throw new Error('Printed artwork was not prepared')
    const printed =
      label.artwork && source
        ? sampleArtwork(source, label.artwork.corners)
        : undefined
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Text surface context unavailable')
    const lettering = label.kind === 'lettering'
    if (!lettering && !printed) {
      ctx.fillStyle = label.background
      ctx.fillRect(0, 0, 256, 256)
    }
    ctx.fillStyle = label.color
    ctx.textAlign = lettering ? 'left' : 'center'
    ctx.textBaseline = 'middle'
    const lines = label.text.split('\n')
    ctx.font = `500 ${Math.min(46, (190 / Math.max(...lines.map((x) => x.length))) * 1.7)}px ${lettering ? '"Chalkboard SE", cursive' : 'Georgia, serif'}`
    if (!printed)
      lines.forEach((line, j) =>
        ctx.fillText(
          line,
          lettering ? 10 : 128,
          128 + (j - (lines.length - 1) / 2) * Math.min(43, 205 / lines.length),
          235
        )
      )
    const albedo =
        printed?.albedo ?? Array.from(ctx.getImageData(0, 0, 256, 256).data),
      normals =
        printed?.normals ??
        Array.from({ length: 256 * 256 }, () => [128, 128, 255, 255]).flat(),
      w = label.width / 2,
      h = label.height / 2
    const yaw = (label.rotation * Math.PI) / 360,
      pitch = ((label.tilt ?? 0) * Math.PI) / 360
    const descriptor = readSpatialDescriptor({
      kind: 'mesh',
      shape: lettering
        ? glyphTriangles(albedo, 256, label.width, label.height)
        : {
            kind: 'triangles',
            positions: [-w, -h, 0, w, -h, 0, w, h, 0, -w, h, 0],
            indices: [0, 1, 2, 0, 2, 3],
            uvs: [0, 1, 1, 1, 1, 0, 0, 0]
          },
      position: renderPosition(label.position),
      rotation: [
        Math.sin(pitch) * Math.cos(yaw),
        Math.cos(pitch) * Math.sin(yaw),
        -Math.sin(pitch) * Math.sin(yaw),
        Math.cos(pitch) * Math.cos(yaw)
      ],
      color: lettering ? Number.parseInt(label.color.slice(1), 16) : 0xffffff,
      roughness: 1,
      metalness: 0,
      opacity: 1,
      wireframe: false,
      selectable: false,
      castShadow: false,
      receiveShadow: true,
      ...(lettering
        ? {}
        : {
            surface: readSpatialSurface({
              width: printed?.width ?? 256,
              height: printed?.height ?? 256,
              albedo,
              normals
            })
          })
    })
    if (descriptor.kind !== 'mesh') throw new Error('Expected label mesh')
    return { id: `label-${i}`, descriptor, visible: true }
  })
}

import type { SpatialFrame } from '@asyra/preset/spatial'
import type { SpatialSurface } from '@asyra/preset/spatial-contract'

type Entry = SpatialFrame['meshes'][number]

/** Linear vertex albedo replaces the uniform tint without quantizing source colors. */
const linearColor = (color: number) =>
  [16, 8, 0].map((shift) => {
    const value = ((color >>> shift) & 255) / 255
    return value < 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })

/** Construction-only batching of static, non-selectable opaque meshes. */
export function batchStaticColors(
  meshes: SpatialFrame['meshes']
): SpatialFrame['meshes'] {
  const groups = new Map<string, Entry[]>()
  const surfaces = new Map<SpatialSurface, number>()
  const ordered: Entry[][] = []
  for (const entry of meshes) {
    const { shape, color: _color, surface, ...state } = entry.descriptor
    if (
      state.instances ||
      state.distant ||
      state.selectable ||
      state.opacity !== 1 ||
      state.optics ||
      !entry.visible ||
      shape.kind !== 'triangles' ||
      shape.colors
    ) {
      ordered.push([entry])
      continue
    }
    if (surface && !surfaces.has(surface)) {
      surfaces.set(surface, surfaces.size)
    }
    // All non-color state, texture identity and UV presence must agree.
    const key = JSON.stringify([
      state,
      surface ? surfaces.get(surface) : null,
      Boolean(shape.uvs),
      Boolean(shape.normals)
    ])
    let group = groups.get(key)
    if (!group) {
      group = []
      groups.set(key, group)
      ordered.push(group)
    }
    group.push(entry)
  }
  return ordered.flatMap((entries) => {
    if (entries.length < 2) {
      return entries
    }
    const positions: number[] = [],
      indices: number[] = [],
      colors: number[] = [],
      uvs: number[] = [],
      normals: number[] = []
    for (const entry of entries) {
      const { shape, color } = entry.descriptor
      if (shape.kind !== 'triangles') {
        throw new Error('Expected static triangles')
      }
      const offset = positions.length / 3
      const rgb = linearColor(color)
      for (const value of shape.positions) {
        positions.push(value)
      }
      for (const index of shape.indices) {
        indices.push(index + offset)
      }
      for (const value of shape.uvs ?? []) {
        uvs.push(value)
      }
      for (const value of shape.normals ?? []) {
        normals.push(value)
      }
      for (let i = 0; i < shape.positions.length; i += 3) {
        colors.push(...rgb)
      }
    }
    const first = entries[0]
    return [
      {
        ...first,
        descriptor: {
          ...first.descriptor,
          color: 0xffffff,
          shape: {
            kind: 'triangles' as const,
            positions,
            indices,
            colors,
            ...(normals.length ? { normals } : {}),
            ...(first.descriptor.shape.kind === 'triangles' &&
            first.descriptor.shape.uvs
              ? { uvs }
              : {})
          }
        }
      }
    ]
  })
}

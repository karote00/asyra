import type { AssetPart } from '../assets/catalog'
import type { Mesh } from '../assets/geometry'

interface WallEndPlane {
  /** Additional local X displacement; derived from the adjoining wall face. */
  offset?: number
  /** Cap may meet a different host face than its body at equal height. */
  capOffset?: number
  slope?: -1 | 1
}

/** End planes in the wall's local XY plan, before placement. */
export interface WallEndPlanes {
  start?: WallEndPlane
  end?: WallEndPlane
}

/** Retain the approved extruded wall above a rectangular entrance opening. */
export function wallAboveOpening(
  parts: AssetPart[],
  height: number
): AssetPart[] {
  const cut = (mesh: Mesh): Mesh => {
    const positions = mesh.positions.map((value, i) =>
      i % 3 === 2 ? Math.max(height, value) : value
    )
    const uvs = [...mesh.uvs]
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const triangle = mesh.indices.slice(i, i + 3)
      const horizontal = triangle.every(
        (index) =>
          Math.abs(
            mesh.positions[index * 3 + 2] - mesh.positions[triangle[0] * 3 + 2]
          ) < 1e-8
      )
      // Wall vertical and end faces use Z for V; horizontal faces use XY.
      if (!horizontal) {
        for (const index of triangle) {
          uvs[index * 2 + 1] +=
            positions[index * 3 + 2] - mesh.positions[index * 3 + 2]
        }
      }
    }
    return { ...mesh, positions, uvs }
  }
  return parts.map((part) => ({
    ...part,
    mesh: cut(part.mesh),
    ...(part.distant
      ? { distant: { ...part.distant, mesh: cut(part.distant.mesh) } }
      : {})
  }))
}

/** Join approved wall sections at 90 degrees without adding filler geometry. */
export function joinWallEnds(
  parts: AssetPart[],
  length: number,
  ends: WallEndPlanes
): AssetPart[] {
  if (ends.start === undefined && ends.end === undefined) {
    return parts
  }
  const cut = (mesh: Mesh, cap: boolean): Mesh => {
    const positions = [...mesh.positions],
      uvs = [...mesh.uvs]
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      let plane: WallEndPlane | undefined
      if (Math.abs(x + length / 2) < 1e-8) {
        plane = ends.start
      } else if (Math.abs(x - length / 2) < 1e-8) {
        plane = ends.end
      }
      if (plane) {
        const offset = (cap ? plane.capOffset : undefined) ?? plane.offset ?? 0
        positions[i] += offset + (plane.slope ?? 0) * positions[i + 1]
      }
    }
    // Preserve longitudinal surface density; end-face UVs remain YZ based.
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const triangle = mesh.indices.slice(i, i + 3)
      if (
        triangle.every(
          (index) =>
            Math.abs(
              mesh.positions[index * 3] - mesh.positions[triangle[0] * 3]
            ) < 1e-8
        )
      ) {
        continue
      }
      for (const index of triangle) {
        uvs[index * 2] += positions[index * 3] - mesh.positions[index * 3]
      }
    }
    return { ...mesh, positions, uvs }
  }
  return parts.map((part) => ({
    ...part,
    mesh: cut(part.mesh, part.id === 'top-cap'),
    ...(part.distant
      ? {
          distant: {
            mesh: cut(part.distant.mesh, part.id === 'top-cap'),
            // End-plane shear adds at most the original Y error to X.
            maxError:
              part.distant.maxError *
              (ends.start?.slope || ends.end?.slope ? Math.SQRT2 : 1)
          }
        }
      : {})
  }))
}

/** Fit an evidenced cutaway crown while preserving its floor and rectangular plan. */
export function fitWallTopProfile(
  parts: AssetPart[],
  length: number,
  startHeight: number,
  endHeight: number
): AssetPart[] {
  if (startHeight === endHeight) {
    return parts
  }
  const transform = (mesh: Mesh): Mesh => {
    const positions = [...mesh.positions]
    const uvs = [...mesh.uvs]
    for (let i = 0; i < positions.length; i += 3) {
      const t = positions[i] / length + 0.5
      positions[i + 2] *=
        (startHeight + t * (endHeight - startHeight)) / startHeight
    }
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const triangle = mesh.indices.slice(i, i + 3)
      const horizontal = triangle.every(
        (index) =>
          Math.abs(
            mesh.positions[index * 3 + 2] - mesh.positions[triangle[0] * 3 + 2]
          ) < 1e-8
      )
      if (!horizontal) {
        for (const index of triangle) {
          uvs[index * 2 + 1] +=
            positions[index * 3 + 2] - mesh.positions[index * 3 + 2]
        }
      }
    }
    return { ...mesh, positions, uvs }
  }
  // Bound the height scaling and longitudinal shear for the distant mesh.
  const errorScale =
    Math.max(1, endHeight / startHeight) +
    Math.abs(endHeight - startHeight) / length
  return parts.map((part) => ({
    ...part,
    mesh: transform(part.mesh),
    ...(part.distant
      ? {
          distant: {
            mesh: transform(part.distant.mesh),
            maxError: part.distant.maxError * errorScale
          }
        }
      : {})
  }))
}

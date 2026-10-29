import fit from './reference/interior-fit.json'
import structure from './reference/office-structure.json'
import type { Vec } from '../assets/geometry'
import type { WallEndPlanes } from './wall-joins'

/** Accepted construction, promoted without reference pixels or review meshes. */
export const OFFICE_STRUCTURE = structure
// Rejected furnishings retain their authoring input; structural values have one owner.
export const OFFICE_FIT = {
  ...fit,
  parameters: {
    ...fit.parameters,
    ...structure.parameters,
    greenY: structure.parameters.creamY
  },
  foundation: structure.foundation,
  loungeRearBranch: { ...fit.loungeRearBranch, ...structure.loungeRearBranch }
}
export const OFFICE_FLOORS = structure.floors
export const OFFICE_SHELL = structure.shell
export const OFFICE_WALLS = structure.walls
  .filter((w) => w.id !== 'entry-header')
  .map((w) => ({
    id: w.id,
    center: w.alongY
      ? [w.cross, (w.start + w.end) / 2]
      : [(w.start + w.end) / 2, w.cross],
    length: w.end - w.start,
    thickness: w.thickness,
    height: ((w.top - w.base) * 2.42) / 2.5,
    base: w.base,
    alongY: w.alongY,
    ends: w.ends as WallEndPlanes,
    capHeight: 'capHeight' in w ? w.capHeight : undefined,
    endTop: w.endTop
  }))
// Source-space artwork still uses its original camera, never the review camera.
const p = fit.parameters

/** Ray/plane intersection in author coordinates. Only called during scene composition. */
export function referencePoint(
  pixel: readonly number[],
  axis: 0 | 1 | 2,
  plane: number
): Vec {
  const az = (p.azimuth * Math.PI) / 180,
    el = (p.elevation * Math.PI) / 180
  const right = [Math.cos(az), Math.sin(az), 0],
    up = [
      -Math.sin(az) * Math.sin(el),
      Math.cos(az) * Math.sin(el),
      Math.cos(el)
    ]
  const toward = [
    Math.sin(az) * Math.cos(el),
    -Math.cos(az) * Math.cos(el),
    Math.sin(el)
  ]
  const focal = 756 / (2 * Math.tan((fit.camera.fov * Math.PI) / 360))
  const ray = toward.map(
    (v, i) =>
      -v +
      ((pixel[0] - 642.5) / focal) * right[i] -
      ((pixel[1] - 422) / focal) * up[i]
  )
  const t = (plane - fit.camera.position[axis]) / ray[axis]
  return fit.camera.position.map((v, i) => v + ray[i] * t) as Vec
}

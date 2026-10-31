import { box, cylinder, type Vec } from '../assets/geometry'
import { part, placeParts, type AssetPart } from '../assets/catalog'
import type { OfficeComposer } from './office-interior'

export function meshBounds(parts: readonly AssetPart[]) {
  const bounds = [
    [Infinity, -Infinity],
    [Infinity, -Infinity],
    [Infinity, -Infinity]
  ]
  for (const p of parts) {
    for (let i = 0; i < p.mesh.positions.length; i++) {
      const axis = i % 3,
        value = p.mesh.positions[i]
      bounds[axis][0] = Math.min(bounds[axis][0], value)
      bounds[axis][1] = Math.max(bounds[axis][1], value)
    }
  }
  return bounds
}

/** A horizontal rug is real thin geometry with no baked lighting. */
export function addRug(
  c: OfficeComposer,
  id: string,
  size: Vec,
  position: Vec,
  color: number
) {
  c.add(
    id,
    'oval-rug',
    [part('pile', cylinder(0.5, size[2], 0.5, 96), color, 'fabric')],
    [position[0], position[1], position[2] + size[2] / 2],
    0,
    [size[0], size[1], 1]
  )
}

/** Print and frame share the same wall plane; the frame never substitutes for a wall. */
export function addPrint(
  c: OfficeComposer,
  id: string,
  text: string,
  size: [number, number],
  position: Vec,
  rotation = 0
) {
  const [w, h] = size,
    border = 0.018,
    parts: AssetPart[] = []
  for (const side of [-1, 1]) {
    parts.push(
      ...placeParts(
        [
          part(
            'vertical-' + side,
            box([border, 0.025, h], 0.002),
            0xb7976b,
            'wood'
          )
        ],
        [(side * (w - border)) / 2, 0, 0]
      )
    )
    parts.push(
      ...placeParts(
        [
          part(
            'horizontal-' + side,
            box([w - border * 2, 0.025, border], 0.002),
            0xb7976b,
            'wood'
          )
        ],
        [0, 0, (side * (h - border)) / 2]
      )
    )
  }
  c.add(id, 'framed-print', parts, position, rotation)
  const yaw = (rotation * Math.PI) / 180
  c.label(
    text,
    w - border * 2,
    h - border * 2,
    [
      position[0] + Math.sin(yaw) * 0.014,
      position[1] - Math.cos(yaw) * 0.014,
      position[2]
    ],
    '#594e40',
    '#ede4d1',
    rotation
  )
}

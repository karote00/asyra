import { extrudeProfile } from '../assets/profile-extrusion'
import { wallAsset } from '../assets/wall'
import { type Vec } from '../assets/geometry'
import { part, type AssetPart, type SurfaceKind } from '../assets/catalog'
import type { Label } from './reference-scene'
import {
  OFFICE_WALLS,
  OFFICE_STRUCTURE,
  OFFICE_FIT,
  OFFICE_FLOORS,
  OFFICE_SHELL
} from './office-layout'
import {
  fitWallTopProfile,
  joinWallEnds,
  wallAboveOpening,
  type WallEndPlanes
} from './wall-joins'

export interface OfficeComposer {
  add: (
    id: string,
    asset: string,
    parts: readonly AssetPart[],
    position?: Vec,
    rotation?: number,
    scale?: Vec
  ) => void
  block: (
    id: string,
    size: Vec,
    position: Vec,
    color: number,
    material?: SurfaceKind,
    radius?: number
  ) => void
  asset: (
    id: string,
    key: string,
    position: Vec,
    rotation?: number,
    scale?: Vec
  ) => void
  plant: (id: string, position: Vec, scale?: number) => void
  label: (
    text: string,
    width: number,
    height: number,
    position: Vec,
    color?: string,
    background?: string,
    rotation?: number
  ) => void
  labels: Label[]
}

/** Compose one source-derived single-storey office. No per-frame layout work. */
export type InteriorStage = 'structure' | 'tables-and-chairs'
export const INTERIOR_REVIEW_STAGE: InteriorStage = 'tables-and-chairs'

export function composeOfficeInterior(composer: OfficeComposer) {
  const { add, block, asset } = composer
  const p = OFFICE_FIT.parameters,
    f = OFFICE_FLOORS
  const foundation = OFFICE_FIT.foundation
  add('office-slab', 'foundation', [
    part(
      'body',
      extrudeProfile(foundation.outline, 2, [
        foundation.bottom,
        foundation.top
      ]),
      0xc6b393,
      'stone'
    )
  ])
  // Clip the source-derived footprint against each rectangular floor plank.
  // The footprint is the subject; the clipping rectangle is convex.
  const clip = (
    outline: number[][],
    x0: number,
    x1: number,
    y0: number,
    y1: number
  ) => {
    let polygon = outline
    for (const [axis, limit, sign] of [
      [0, x0, 1],
      [0, x1, -1],
      [1, y0, 1],
      [1, y1, -1]
    ]) {
      const next: number[][] = []
      for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i],
          b = polygon[(i + 1) % polygon.length]
        const insideA = (a[axis] - limit) * sign >= 0,
          insideB = (b[axis] - limit) * sign >= 0
        if (insideA) next.push(a)
        if (insideA !== insideB) {
          const t = (limit - a[axis]) / (b[axis] - a[axis])
          next.push(a.map((v, j) => v + t * (b[j] - v)))
        }
      }
      polygon = next
    }
    return polygon
  }
  const floor = (
    id: string,
    x0: number,
    x1: number,
    y0: number,
    y1: number,
    top: number,
    outline?: number[][]
  ) => {
    const rows = Math.ceil((y1 - y0) / 0.18),
      cols = Math.ceil((x1 - x0) / 1.2)
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const x = x0 + c * 1.2,
          y = y0 + r * 0.18,
          w = Math.min(1.2, x1 - x),
          h = Math.min(0.18, y1 - y)
        if (id === 'floor' || outline) {
          const band = OFFICE_STRUCTURE.floorBand
          const regions = [
            [
              x + 0.0015,
              Math.min(x + w - 0.0015, band[0][0]),
              y + 0.0015,
              y + h - 0.0015
            ],
            [
              Math.max(x + 0.0015, band[0][0]),
              x + w - 0.0015,
              y + 0.0015,
              Math.min(y + h - 0.0015, band[1][0])
            ],
            [
              Math.max(x + 0.0015, band[0][0]),
              x + w - 0.0015,
              Math.max(y + 0.0015, band[1][1]),
              y + h - 0.0015
            ]
          ]
          for (let region = 0; region < regions.length; region++) {
            const [left, right, bottom, upper] = regions[region]
            if (right <= left || upper <= bottom) continue
            const polygon = clip(
              outline ?? foundation.outline,
              left,
              right,
              bottom,
              upper
            )
            if (polygon.length >= 3)
              add(
                `${id}-${r}-${c}${region ? `-${region}` : ''}`,
                'floor-plank',
                [
                  part(
                    'body',
                    extrudeProfile(polygon, 2, [-0.025, 0]),
                    [0xcfb18a, 0xd8be99, 0xc6a77d, 0xd0b58e][(r * 3 + c) % 4],
                    'wood'
                  )
                ],
                [0, 0, top]
              )
          }
          continue
        }
        block(
          `${id}-${r}-${c}`,
          [w - 0.003, h - 0.003, 0.025],
          [x + w / 2, y + h / 2, top - 0.0125],
          [0xcfb18a, 0xd8be99, 0xc6a77d, 0xd0b58e][(r * 3 + c) % 4],
          'wood',
          0.001
        )
      }
  }
  const xs = foundation.outline.map(([x]) => x),
    ys = foundation.outline.map(([, y]) => y)
  floor(
    'floor',
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
    f.lounge
  )
  const wall = (
    id: string,
    length: number,
    thickness: number,
    top: number,
    base: number,
    pos: readonly number[],
    alongY = false,
    ends: WallEndPlanes = {},
    endTop = top
  ) => {
    const pieces = joinWallEnds(
      fitWallTopProfile(
        wallAsset([length, (thickness * 0.27) / 0.24, top - base]),
        length,
        top - base,
        endTop - base
      ),
      length,
      ends
    )
    if (id === 'work-divider') pieces[0] = { ...pieces[0], color: 0x8d9c83 }
    pieces.forEach((piece, i) =>
      add(
        i ? id + '-cap' : id,
        'wall-segment',
        [piece],
        [pos[0], pos[1], base],
        alongY ? 90 : 0
      )
    )
  }
  for (const w of OFFICE_WALLS)
    wall(
      w.id,
      w.length,
      w.thickness,
      w.base + (w.height * 2.5) / 2.42,
      w.base,
      w.center,
      w.alongY,
      w.ends,
      w.endTop
    )
  const shell = OFFICE_SHELL
  const doorScale = OFFICE_STRUCTURE.doorScale
  asset(
    'entrance-door',
    'entry-door-set',
    [p.doorX, shell.frontY, f.lounge],
    0,
    [doorScale, doorScale, doorScale]
  )
  add(
    'entry-header',
    'wall-header',
    wallAboveOpening(
      wallAsset([
        p.doorWidth,
        shell.facadeThickness * shell.capDepthRatio,
        p.facadeTop - f.lounge
      ]),
      p.doorHeight
    ),
    [p.doorX, shell.frontY, f.lounge]
  )
  const band = OFFICE_STRUCTURE.floorBand
  block(
    'pantry-floor-band',
    band.map(([low, high]) => high - low) as Vec,
    band.map(([low, high]) => (low + high) / 2) as Vec,
    0xf8f6ed,
    'stone'
  )
  // Existing exterior steps are preserved byte-for-byte.
  block(
    'entrance-step',
    [1.6, 0.55, 0.17],
    [0.25, -2.78, 0.16],
    0xd5bf9f,
    'stone',
    0.015
  )
  block(
    'entrance-step-low',
    [1.85, 0.38, 0.1],
    [0.25, -3.12, 0.08],
    0xd5bf9f,
    'stone',
    0.015
  )
}

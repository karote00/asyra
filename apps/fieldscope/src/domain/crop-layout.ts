import type { FarmConfiguration } from './farm-configuration'
import type { Point3 } from './greenhouse'
import { createPlantingRows } from './planting-supports'

export type CropSpecies = 'cucumber-1914' | 'tomato-yu-nu'
export const CROP_LAYOUT = Object.freeze({
  spacing: 0.2,
  rootOffset: 0.05,
  variantCount: 20
})
export interface CropPosition {
  species: CropSpecies
  variant: number
  bay: number
  row: number
  side: 'left' | 'right'
  position: Point3
  yaw: number
}

/** Local deterministic generator: no shared mutable seed or wall-clock input. */
export function cropRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

export function createCropPositions(config: FarmConfiguration): CropPosition[] {
  const count =
    Math.floor(
      (config.length - config.startInset - config.endInset) /
        CROP_LAYOUT.spacing +
        1e-9
    ) + 1
  return createPlantingRows(config).flatMap((row) => {
    const random = cropRandom(
      1701 + row.row * 137 + (row.side === 'left' ? 17 : 29)
    )
    const direction = row.side === 'left' ? -1 : 1
    return Array.from({ length: count }, (_, index) => ({
      ...row,
      species: row.bay < 2 ? 'cucumber-1914' : 'tomato-yu-nu',
      variant: Math.floor(random() * CROP_LAYOUT.variantCount),
      position: [
        row.x + direction * CROP_LAYOUT.rootOffset,
        0,
        config.startInset + index * CROP_LAYOUT.spacing
      ] as Point3,
      yaw: row.side === 'left' ? Math.PI : 0
    }))
  })
}

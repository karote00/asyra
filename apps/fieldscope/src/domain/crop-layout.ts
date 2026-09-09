import type { FarmConfiguration } from './farm-configuration'
import type { Point3 } from './greenhouse'
import { createPlantingRows } from './planting-supports'

export type CropSpecies = 'cucumber-1914' | 'tomato-yu-nu'
export const CROP_LAYOUT = Object.freeze({
  spacing: 0.2,
  rootOffset: 0.05,
  variantCount: 20,
  maxOvergrownFruits: 10,
  plantsPerOvergrownFruit: 500,
  overgrownVariants: Object.freeze([0, 4, 8, 12, 16])
})
const regularCucumberVariants = Array.from(
  { length: CROP_LAYOUT.variantCount },
  (_, variant) => variant
).filter((variant) => !CROP_LAYOUT.overgrownVariants.includes(variant))

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
  const plants: CropPosition[] = createPlantingRows(config).flatMap((row) => {
    const random = cropRandom(
      1701 + row.row * 137 + (row.side === 'left' ? 17 : 29)
    )
    const direction = row.side === 'left' ? -1 : 1
    return Array.from({ length: count }, (_, index) => ({
      ...row,
      species: row.bay < 2 ? 'cucumber-1914' : 'tomato-yu-nu',
      variant:
        row.bay < 2
          ? regularCucumberVariants[
              Math.floor(random() * regularCucumberVariants.length)
            ]
          : Math.floor(random() * CROP_LAYOUT.variantCount),
      position: [
        row.x + direction * CROP_LAYOUT.rootOffset,
        0,
        config.startInset + index * CROP_LAYOUT.spacing
      ] as Point3,
      yaw: row.side === 'left' ? Math.PI : 0
    }))
  })
  // Eligible variants each carry one delayed-harvest fruit. Sample plants once
  // across the whole farm; instancing then consumes this completed assignment.
  const cucumbers = plants.filter((plant) => plant.species === 'cucumber-1914')
  const overgrownCount = Math.min(
    CROP_LAYOUT.maxOvergrownFruits,
    Math.floor(cucumbers.length / CROP_LAYOUT.plantsPerOvergrownFruit)
  )
  const random = cropRandom(4931)
  for (let i = 0; i < overgrownCount; i++) {
    const selected = i + Math.floor(random() * (cucumbers.length - i))
    ;[cucumbers[i], cucumbers[selected]] = [cucumbers[selected], cucumbers[i]]
    cucumbers[i].variant =
      CROP_LAYOUT.overgrownVariants[i % CROP_LAYOUT.overgrownVariants.length]
  }
  return plants
}

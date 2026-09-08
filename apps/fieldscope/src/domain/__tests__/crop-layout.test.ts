import { expect, it } from 'vitest'
import { createCropPositions } from '../crop-layout'
import { createSupportPositions } from '../planting-supports'
import {
  DEFAULT_CONFIGURATION,
  validateConfiguration
} from '../farm-configuration'

it('plants both cultivars at 20 cm spacing and 5 cm farther into soil than each pole row', () => {
  const plants = createCropPositions(DEFAULT_CONFIGURATION)
  const supports = createSupportPositions()
  expect(plants).toHaveLength(5952)
  for (const species of ['cucumber-1914', 'tomato-yu-nu']) {
    const selected = plants.filter((p) => p.species === species)
    expect(selected).toHaveLength(2976)
    expect(new Set(selected.map((p) => p.variant)).size).toBe(20)
  }
  for (const pole of supports.filter(
    (p) => p.z === DEFAULT_CONFIGURATION.startInset
  )) {
    const row = plants.filter((p) => p.row === pole.row && p.side === pole.side)
    expect(row).toHaveLength(248)
    row.forEach((plant, i) => {
      expect(plant.position[0]).toBeCloseTo(
        pole.x + (pole.side === 'left' ? -0.05 : 0.05)
      )
      expect(plant.position[1]).toBe(0)
      expect(plant.position[2]).toBeCloseTo(0.25 + i * 0.2)
      expect(plant.position[2]).toBeLessThanOrEqual(49.75)
      expect(plant.species).toBe(
        pole.bay < 2 ? 'cucumber-1914' : 'tomato-yu-nu'
      )
    })
  }
  expect(createCropPositions(DEFAULT_CONFIGURATION)).toEqual(plants)
})
it('respects edited row types and end insets without phantom plants', () => {
  const config = validateConfiguration({
    ...DEFAULT_CONFIGURATION,
    length: 3,
    startInset: 0.4,
    endInset: 0.5,
    strips: [
      { kind: 'drain', width: 0.3 },
      { kind: 'soil', width: 1 }
    ]
  })
  const plants = createCropPositions(config)
  expect(plants).toHaveLength(44)
  expect(
    plants.every(
      (p) => p.side === 'right' && p.position[2] >= 0.4 && p.position[2] <= 2.5
    )
  ).toBe(true)
  expect(
    createCropPositions({ ...config, strips: [{ kind: 'soil', width: 1 }] })
  ).toEqual([])
})
it('rejects soil that fits the pole but not the additional plant-root offset', () => {
  expect(() =>
    validateConfiguration({
      ...DEFAULT_CONFIGURATION,
      strips: [
        { kind: 'drain', width: 0.3 },
        { kind: 'soil', width: 0.18 }
      ]
    })
  ).toThrow()
})

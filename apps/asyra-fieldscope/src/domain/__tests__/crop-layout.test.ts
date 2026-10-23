import { expect, it } from 'vitest'
import { CROP_LAYOUT, createCropPositions } from '../crop-layout'
import { createCropModels } from '../crop-models'
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
      { id: 'fixture-1', kind: 'drain', width: 0.3 },
      { id: 'fixture-2', kind: 'soil', width: 1 }
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
    createCropPositions({
      ...config,
      strips: [{ id: 'fixture-3', kind: 'soil', width: 1 }]
    })
  ).toEqual([])
})
it('rejects soil that fits the pole but not the additional plant-root offset', () => {
  expect(() =>
    validateConfiguration({
      ...DEFAULT_CONFIGURATION,
      strips: [
        { id: 'fixture-4', kind: 'drain', width: 0.3 },
        { id: 'fixture-5', kind: 'soil', width: 0.18 }
      ]
    })
  ).toThrow()
})

it('caps actual delayed-harvest cucumber fruits across the entire farm', () => {
  const models = createCropModels(DEFAULT_CONFIGURATION).filter(
    (model) => model.species === 'cucumber-1914'
  )
  const counts = new Map(
    models.map((model) => [
      model.variant,
      model.fruits.filter((fruit) => fruit.maturity === 'overgrown').length
    ])
  )
  for (const model of models)
    expect(counts.get(model.variant)).toBe(
      CROP_LAYOUT.overgrownVariants.includes(model.variant) ? 1 : 0
    )
  for (const length of [1, 50, 200]) {
    const config = { ...DEFAULT_CONFIGURATION, length }
    const plants = createCropPositions(config)
    const cucumbers = plants.filter(
      (plant) => plant.species === 'cucumber-1914'
    )
    const total = cucumbers.reduce((sum, plant) => {
      const count = counts.get(plant.variant)
      if (count === undefined) throw new Error('Missing planted cucumber model')
      return sum + count
    }, 0)
    expect(total, `Farm length ${length}`).toBeLessThanOrEqual(10)
    expect(total).toBe(Math.min(10, Math.floor(cucumbers.length / 500)))
    expect(createCropPositions(config)).toEqual(plants)
    if (length === 50) {
      const stages = new Set(
        cucumbers.flatMap((plant) => {
          const model = models.find((model) => model.variant === plant.variant)
          if (!model) throw new Error('Missing planted cucumber model')
          return model.fruits
            .filter((fruit) => fruit.maturity === 'overgrown')
            .map((fruit) => fruit.growthStage)
        })
      )
      expect([...stages].sort()).toEqual([
        'overgrown-early',
        'overgrown-late',
        'oversized'
      ])
    }
  }
})

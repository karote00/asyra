import { describe, expect, it } from 'vitest'
import { assessHarvestEnergy, type EnergyBudget } from '../harvest-energy'
const base: EnergyBudget = {
  nominalWh: 1000,
  usableFraction: 0.8,
  soc: 0.6,
  socUncertainty: 0.05,
  nextWorkWh: 200,
  returnWh: 100,
  contingencyWh: 40,
  reserveWh: 60,
  batteryFresh: true,
  returnPathAdmitted: true,
  dockAvailable: true
}
describe('M1 battery and charging return budget', () => {
  it('uses derated capacity and SOC uncertainty before admitting work', () => {
    const result = assessHarvestEnergy(base)
    expect(result.availableWh).toBeCloseTo(440)
    expect(result.returnRequiredWh).toBe(200)
    expect(result.missionRequiredWh).toBe(400)
    expect(result.minimumDispatchSoc).toBe(0.55)
    expect(result.action).toBe('continue-screening')
  })
  it('returns while return reserve remains rather than draining it on a pick', () => {
    expect(assessHarvestEnergy({ ...base, soc: 0.5 }).action).toBe(
      'return-to-charge'
    )
    expect(assessHarvestEnergy({ ...base, soc: 0.2 }).action).toBe('hold')
  })
  it('keeps the declared reserve intact at the exact dispatch threshold', () => {
    expect(assessHarvestEnergy({ ...base, soc: 0.55 }).action).toBe(
      'continue-screening'
    )
    expect(assessHarvestEnergy({ ...base, soc: 0.549 }).action).toBe(
      'return-to-charge'
    )
  })
  it('does not hide a battery too small for the mission', () => {
    const result = assessHarvestEnergy({ ...base, nextWorkWh: 900 })
    expect(result.undersized).toBe(true)
    expect(result.minimumDispatchSoc).toBeGreaterThan(1)
  })
  it.each([
    { batteryFresh: false },
    { returnPathAdmitted: false },
    { dockAvailable: false }
  ])('holds for missing admission %j even at full charge', (change) => {
    expect(assessHarvestEnergy({ ...base, soc: 1, ...change }).action).toBe(
      'hold'
    )
  })
  it('handles low SOC and worsened loaded return without inventing energy', () => {
    expect(assessHarvestEnergy({ ...base, soc: 0.01 }).availableWh).toBe(0)
    expect(assessHarvestEnergy({ ...base, returnWh: 500 }).action).toBe('hold')
  })
  it.each([
    { nominalWh: 0 },
    { soc: 1.1 },
    { usableFraction: -1 },
    { reserveWh: 0 },
    { returnWh: NaN },
    { contingencyWh: Infinity }
  ])('rejects invalid energy data %j', (change) => {
    expect(() => assessHarvestEnergy({ ...base, ...change })).toThrow()
  })
})

it('rejects finite inputs whose energy arithmetic overflows', () => {
  expect(() =>
    assessHarvestEnergy({
      ...base,
      nextWorkWh: Number.MAX_VALUE,
      returnWh: Number.MAX_VALUE
    })
  ).toThrow()
})

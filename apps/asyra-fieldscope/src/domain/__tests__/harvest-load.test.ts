import { describe, expect, it } from 'vitest'
import { assessCrateLoad, type CrateLoad } from '../harvest-load'
const base: CrateLoad = {
  baseMass: 60,
  payload: 2,
  nextFruit: 0.2,
  payloadLimit: 8,
  fill: 0.3,
  returnFill: 0.8,
  latched: true,
  scaleTrusted: true,
  track: 0.42,
  baseHeight: 0.2,
  payloadHeight: 0.5,
  baseOffset: 0,
  payloadOffset: 0.1,
  roll: 0,
  lateralAcceleration: 0,
  uncertainty: 0.02
}
describe('M1 crate and lateral reserve', () => {
  it('computes weight and reserve without changing inventory', () => {
    const before = { ...base }
    const result = assessCrateLoad(base)
    expect(result.totalMass).toBe(62)
    expect(result.lateralReserve).toBeCloseTo(0.21 - 0.2 / 62 - 0.02)
    expect(result.action).toBe('continue-screening')
    expect(base).toEqual(before)
  })
  it('requests exchange before accepting an overweight next fruit and at exact capacity', () => {
    expect(assessCrateLoad({ ...base, payload: 7.9 }).action).toBe('exchange')
    expect(assessCrateLoad({ ...base, payload: 8 }).action).toBe('exchange')
    expect(assessCrateLoad({ ...base, payload: 7.8 }).action).toBe(
      'continue-screening'
    )
  })
  it('requests exchange for spatial fill even when light', () => {
    expect(assessCrateLoad({ ...base, fill: 0.8 }).exchange).toContain(
      'fill-capacity'
    )
  })
  it.each([
    { latched: false },
    { scaleTrusted: false },
    { payload: 9 },
    { roll: 0.8 }
  ])('stops for current load faults %j', (change) => {
    expect(assessCrateLoad({ ...base, ...change }).action).toBe('stop')
  })
  it('reduces reserve as high offset load, roll and acceleration increase', () => {
    const empty = assessCrateLoad({ ...base, payload: 0, roll: 0.1 })
    const full = assessCrateLoad({ ...base, payload: 8, roll: 0.1 })
    expect(full.lateralReserve).toBeLessThan(empty.lateralReserve)
    expect(
      assessCrateLoad({ ...base, lateralAcceleration: -2 }).lateralReserve
    ).toBeCloseTo(
      assessCrateLoad({ ...base, lateralAcceleration: 2 }).lateralReserve
    )
  })
  it('rejects a proposed fruit that would exhaust lateral reserve', () => {
    const result = assessCrateLoad({
      ...base,
      payload: 0,
      nextFruit: 8,
      payloadOffset: 2
    })
    expect(result.lateralReserve).toBeGreaterThan(0)
    expect(result.projectedReserve).toBeLessThan(0)
    expect(result.action).toBe('exchange')
  })
  it.each([
    { payload: -1 },
    { baseMass: 0 },
    { roll: Math.PI / 2 },
    { track: NaN },
    { fill: 1.1 },
    { nextFruit: Infinity }
  ])('rejects invalid physical input %j', (change) => {
    expect(() => assessCrateLoad({ ...base, ...change })).toThrow()
  })
})

it('rejects finite inputs whose mass moments overflow', () => {
  expect(() =>
    assessCrateLoad({
      ...base,
      baseMass: Number.MAX_VALUE,
      baseHeight: Number.MAX_VALUE
    })
  ).toThrow()
})

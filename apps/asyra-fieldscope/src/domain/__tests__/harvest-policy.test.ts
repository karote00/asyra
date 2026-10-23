import { describe, expect, it } from 'vitest'
import {
  adviseHarvestAction,
  type HarvestObservations
} from '../harvest-policy'
const base: HarvestObservations = {
  energy: 'continue-screening',
  emergencyStop: false,
  person: false,
  unstable: false,
  crateUnlatched: false,
  sensorsFresh: true,
  communicationFresh: true,
  obstacle: false,
  toolContact: false,
  fruitAndStemVerified: true,
  load: 'continue-screening'
}
describe('M1 hazard priority', () => {
  it('protects people before instability and saving a full crate', () => {
    expect(
      adviseHarvestAction({
        ...base,
        person: true,
        unstable: true,
        load: 'exchange'
      })
    ).toEqual({
      action: 'protect-people',
      inhibitCutting: true,
      stopTravel: true,
      requireReturnAdmission: false
    })
  })
  it('does not return or reach for the crate during loss of support', () => {
    expect(
      adviseHarvestAction({
        ...base,
        unstable: true,
        energy: 'return-to-charge',
        load: 'exchange'
      }).action
    ).toBe('immobilize')
  })
  it.each([
    [{ sensorsFresh: false }, 'await-observation'],
    [{ communicationFresh: false }, 'await-observation'],
    [{ obstacle: true }, 'wait-or-replan'],
    [{ toolContact: true }, 'hold-tool'],
    [{ fruitAndStemVerified: false }, 'observe-or-defer'],
    [{ energy: 'hold' }, 'await-observation']
  ] as const)('inhibits travel and cutting for %j', (change, action) => {
    const result = adviseHarvestAction({ ...base, ...change })
    expect(result.action).toBe(action)
    expect(result.stopTravel).toBe(true)
    expect(result.inhibitCutting).toBe(true)
  })
  it('requests admitted return before looking for more fruit', () => {
    const result = adviseHarvestAction({
      ...base,
      load: 'exchange',
      fruitAndStemVerified: false
    })
    expect(result.action).toBe('return-to-dock')
    expect(result.requireReturnAdmission).toBe(true)
    expect(result.inhibitCutting).toBe(true)
    expect(
      adviseHarvestAction({ ...base, energy: 'return-to-charge' })
        .requireReturnAdmission
    ).toBe(true)
  })
  it('never lets energy policy override contact or a human stop', () => {
    expect(
      adviseHarvestAction({
        ...base,
        toolContact: true,
        energy: 'return-to-charge'
      }).action
    ).toBe('hold-tool')
    expect(
      adviseHarvestAction({ ...base, emergencyStop: true, energy: 'hold' })
        .action
    ).toBe('protect-people')
  })
  it('does not interpret missing observations as clear', () => {
    expect(() =>
      adviseHarvestAction({
        ...base,
        sensorsFresh: undefined
      } as unknown as HarvestObservations)
    ).toThrow()
  })
})

it('cannot continue when the completed load report requests a stop', () => {
  expect(adviseHarvestAction({ ...base, load: 'stop' }).action).toBe(
    'immobilize'
  )
})

import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SCENE_DEMAND_CONFIGURATION,
  validateSceneDemandConfiguration,
  type SceneDemandConfiguration
} from '../scene-demand-configuration'

const complete = (): SceneDemandConfiguration => ({
  version: 1,
  route: {
    kind: 'soil-strip',
    bay: 0,
    stripId: 'strip-3',
    from: 0.25,
    until: 2.25
  },
  evidence: { kind: 'synthetic', id: 'survey-a', label: 'Fixture survey' },
  growth: {
    kind: 'bounded',
    coverage: 'complete',
    volumes: [
      {
        id: 'growth-a',
        anchor: { kind: 'plant', plantId: 'plant-a' },
        min: [-0.2, 0, -0.1],
        max: [0.3, 2.4, 0.2]
      }
    ]
  },
  clearanceMargin: { kind: 'bounded', metres: 0.04 }
})

describe('scene demand configuration', () => {
  it('starts with explicit unknown evidence and no numeric passage default', () => {
    expect(DEFAULT_SCENE_DEMAND_CONFIGURATION).toEqual({
      version: 1,
      route: { kind: 'unknown' },
      evidence: { kind: 'unknown' },
      growth: { kind: 'unknown' },
      clearanceMargin: { kind: 'unknown' }
    })
    expect(JSON.stringify(DEFAULT_SCENE_DEMAND_CONFIGURATION)).not.toContain(
      '1.2'
    )
  })

  it('detaches and deeply freezes one valid versioned draft', () => {
    const raw = complete()
    const accepted = validateSceneDemandConfiguration(raw)
    const volume = raw.growth.kind === 'bounded' ? raw.growth.volumes[0] : null
    expect(accepted).toEqual(raw)
    expect(accepted).not.toBe(raw)
    expect(Object.isFrozen(accepted)).toBe(true)
    expect(Object.isFrozen(accepted.route)).toBe(true)
    expect(Object.isFrozen(accepted.growth)).toBe(true)
    if (accepted.growth.kind !== 'bounded' || !volume)
      throw new Error('Missing fixture volume')
    expect(Object.isFrozen(accepted.growth.volumes)).toBe(true)
    expect(Object.isFrozen(accepted.growth.volumes[0].anchor)).toBe(true)
    expect(Object.isFrozen(accepted.growth.volumes[0].min)).toBe(true)
    ;(volume.max as [number, number, number])[1] = 9
    expect(accepted.growth.volumes[0].max[1]).toBe(2.4)
  })

  it('preserves measured evidence identity without inventing a label', () => {
    const accepted = validateSceneDemandConfiguration({
      ...complete(),
      evidence: { kind: 'measured', id: 'survey-measured-a' }
    })
    expect(accepted.evidence).toEqual({
      kind: 'measured',
      id: 'survey-measured-a'
    })
  })

  it.each([
    { ...complete(), version: 2 },
    {
      ...complete(),
      route: { kind: 'soil-strip', bay: 0, stripId: '', from: 0, until: 1 }
    },
    {
      ...complete(),
      route: {
        kind: 'soil-strip',
        bay: 0,
        stripId: 'strip-3',
        from: 1,
        until: 1
      }
    },
    { ...complete(), clearanceMargin: { kind: 'bounded', metres: Number.NaN } },
    {
      ...complete(),
      evidence: { kind: 'synthetic', id: 'survey-a', label: '' }
    },
    {
      ...complete(),
      growth: {
        kind: 'bounded',
        coverage: 'complete',
        volumes: [
          {
            id: 'same',
            anchor: { kind: 'world' },
            min: [0, 0, 0],
            max: [1, 1, 1]
          },
          {
            id: 'same',
            anchor: { kind: 'world' },
            min: [2, 2, 2],
            max: [3, 3, 3]
          }
        ]
      }
    },
    {
      ...complete(),
      growth: {
        kind: 'bounded',
        coverage: 'complete',
        volumes: [
          {
            id: 'growth-a',
            anchor: { kind: 'plant', plantId: '' },
            min: [0, 0, 0],
            max: [1, 1, 1]
          }
        ]
      }
    },
    {
      ...complete(),
      growth: {
        kind: 'bounded',
        coverage: 'complete',
        volumes: [
          {
            id: 'growth-a',
            anchor: { kind: 'world' },
            min: [0, 2, 0],
            max: [1, 1, 1]
          }
        ]
      }
    }
  ])('rejects invalid structural input without repair: %#', (value) => {
    expect(() => validateSceneDemandConfiguration(value)).toThrow(
      'Invalid scene demand configuration'
    )
  })
})

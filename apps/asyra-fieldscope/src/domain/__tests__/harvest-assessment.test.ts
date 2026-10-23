import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIGURATION } from '../farm-configuration'
import * as greenhouse from '../greenhouse'
import * as supports from '../planting-supports'
import * as crops from '../crop-layout'
import { assessHarvestLane, type LaneRequest } from '../harvest-assessment'

function request(): LaneRequest {
  return {
    farm: structuredClone(DEFAULT_CONFIGURATION),
    lane: { kind: 'strip', bay: 0, strip: 2 },
    vehicle: { width: 0.55, length: 0.9, height: 1.2, clearance: 0.05 },
    canopyReserve: 0.2,
    start: 0.25,
    end: 49.75,
    survey: {
      ground: 'prepared',
      entranceWidth: 2,
      entranceHeight: 2.5,
      frontHeadland: 1.5,
      rearHeadland: 1.5
    }
  }
}
afterEach(() => vi.restoreAllMocks())
describe('M1 straight-lane feasibility', () => {
  it('screens internal soil between existing root rows, without claiming safety', () => {
    const result = assessHarvestLane(request())
    expect(result.status).toBe('screened')
    expect(result.usableWidth).toBeCloseTo(1)
    expect(result.requiredWidth).toBeCloseTo(0.65)
    expect(result.unresolved).toContain('physical-validation')
  })
  it('blocks the water channel even for a very narrow vehicle', () => {
    const input = request()
    input.lane = { kind: 'strip', bay: 0, strip: 1 }
    input.vehicle.width = 0.1
    expect(assessHarvestLane(input).blocked).toContain('water-channel')
  })
  it.each(['left', 'right'] as const)(
    'accounts for center columns on shared passage %s',
    (side) => {
      const input = request()
      input.lane = { kind: 'shared', boundary: 1, side }
      const result = assessHarvestLane(input)
      expect(result.usableWidth).toBeCloseTo(0.312)
      expect(result.blocked).toContain('insufficient-width')
    }
  )
  it('keeps unknown ground and entrance/headland measurements unverified', () => {
    const input = request()
    input.survey = {
      ground: 'unknown',
      entranceWidth: null,
      entranceHeight: null,
      frontHeadland: null,
      rearHeadland: null
    }
    const result = assessHarvestLane(input)
    expect(result.status).toBe('unverified')
    expect(result.unverified).toEqual([
      'unknown-entrance',
      'unknown-headland',
      'unknown-ground'
    ])
  })
  it('prioritizes blocking evidence over missing evidence', () => {
    const input = request()
    input.survey.ground = 'soft'
    input.survey.entranceWidth = null
    expect(assessHarvestLane(input).status).toBe('blocked')
  })
  it('does not treat the plant setbacks as adequate headlands', () => {
    const input = request()
    input.survey.frontHeadland = 0
    input.survey.rearHeadland = 0
    expect(assessHarvestLane(input).blocked).toEqual([
      'front-headland',
      'rear-headland'
    ])
  })
  it('checks entry and crossbeam heights as well as lane width', () => {
    const input = request()
    input.vehicle.height = 3.1
    input.survey.entranceWidth = 0.5
    expect(assessHarvestLane(input).blocked).toEqual([
      'insufficient-height',
      'entrance-width',
      'entrance-height'
    ])
  })
  it('admits exact width but rejects a larger swept width', () => {
    const input = request()
    input.vehicle.width = 0.9
    expect(assessHarvestLane(input).status).toBe('screened')
    input.vehicle.width += 0.001
    expect(assessHarvestLane(input).blocked).toContain('insufficient-width')
  })
  it('reassesses geometry changes without mutation or per-plant work', () => {
    const layout = vi.spyOn(greenhouse, 'createLayout')
    const rows = vi.spyOn(supports, 'createPlantingRows')
    const plants = vi.spyOn(crops, 'createCropPositions')
    const input = request()
    const before = structuredClone(input)
    const first = assessHarvestLane(input)
    expect(input).toEqual(before)
    expect(layout).toHaveBeenCalledTimes(2)
    expect(rows).toHaveBeenCalledTimes(1)
    expect(plants).not.toHaveBeenCalled()
    input.farm.length = 200
    expect(assessHarvestLane(input).usableWidth).toBe(first.usableWidth)
    expect(layout).toHaveBeenCalledTimes(4)
    expect(rows).toHaveBeenCalledTimes(2)
    input.farm.soilInset = 0.3
    expect(assessHarvestLane(input).usableWidth).toBeCloseTo(0.7)
    input.farm = before.farm
    expect(assessHarvestLane(input)).toEqual(first)
  })
  it.each([NaN, Infinity, -1])('rejects invalid dimensions %s', (value) => {
    const input = request()
    input.vehicle.width = value
    expect(() => assessHarvestLane(input)).toThrow()
  })
  it('rejects invalid lane, interval and incomplete survey input', () => {
    const input = request()
    input.lane = { kind: 'strip', bay: 4, strip: 2 }
    expect(() => assessHarvestLane(input)).toThrow()
    input.lane = { kind: 'strip', bay: 0, strip: 2 }
    input.end = input.start
    expect(() => assessHarvestLane(input)).toThrow()
    input.end = 20
    input.survey.frontHeadland = undefined as unknown as number
    expect(() => assessHarvestLane(input)).toThrow()
  })
})

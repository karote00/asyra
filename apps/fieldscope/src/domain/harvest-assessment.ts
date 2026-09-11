import { CROP_LAYOUT } from './crop-layout'
import {
  configurationSite,
  validateConfiguration,
  type FarmConfiguration
} from './farm-configuration'
import { createLayout } from './greenhouse'
import { createPlantingRows } from './planting-supports'

export interface VehicleEnvelope {
  width: number
  length: number
  height: number
  clearance: number
}
export type PatrolLane =
  | { kind: 'strip'; bay: number; strip: number }
  | { kind: 'shared'; boundary: number; side: 'left' | 'right' }
export interface LaneSurvey {
  ground: 'prepared' | 'unknown' | 'soft'
  entranceWidth: number | null
  entranceHeight: number | null
  frontHeadland: number | null
  rearHeadland: number | null
}
export interface LaneRequest {
  farm: FarmConfiguration
  lane: PatrolLane
  vehicle: VehicleEnvelope
  canopyReserve: number
  start: number
  end: number
  survey: LaneSurvey
}
export type LaneReason =
  | 'water-channel'
  | 'insufficient-width'
  | 'insufficient-height'
  | 'entrance-width'
  | 'entrance-height'
  | 'front-headland'
  | 'rear-headland'
  | 'soft-ground'
  | 'unknown-ground'
  | 'unknown-entrance'
  | 'unknown-headland'

/** Necessary straight-line checks only; no physical motion permission. */
export function assessHarvestLane(request: LaneRequest) {
  const { farm, lane, vehicle, survey, start, end, canopyReserve } = request
  validateConfiguration(farm)
  for (const [field, value] of Object.entries(vehicle)) {
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      (field !== 'clearance' && value === 0)
    )
      throw new Error(`Invalid vehicle ${field}`)
  }
  for (const key of ['width', 'length', 'height', 'clearance'] as const)
    if (!Number.isFinite(vehicle[key]))
      throw new Error(`Missing vehicle ${key}`)
  if (
    !Number.isFinite(canopyReserve) ||
    canopyReserve < 0 ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end > farm.length ||
    start >= end
  )
    throw new Error('Invalid lane interval or canopy reserve')
  if (!['prepared', 'unknown', 'soft'].includes(survey.ground))
    throw new Error('Invalid ground observation')
  for (const key of [
    'entranceWidth',
    'entranceHeight',
    'frontHeadland',
    'rearHeadland'
  ] as const) {
    const value = survey[key]
    if (value !== null && (!Number.isFinite(value) || value < 0))
      throw new Error(`Invalid survey ${key}`)
  }
  const site = configurationSite(farm)
  const layout = createLayout(site, farm.strips)
  const rows = createPlantingRows(farm)
  const blocked: LaneReason[] = []
  const unverified: LaneReason[] = []
  let left: number
  let right: number
  if (lane.kind === 'strip') {
    if (
      !Number.isInteger(lane.bay) ||
      lane.bay < 0 ||
      lane.bay >= site.bays ||
      !Number.isInteger(lane.strip) ||
      lane.strip < 0 ||
      lane.strip >= farm.strips.length
    )
      throw new Error('Invalid strip lane')
    const strip = layout.strips[lane.bay * farm.strips.length + lane.strip]
    left = strip.x
    right = strip.x + strip.width
    if (strip.kind === 'drain') blocked.push('water-channel')
    else {
      for (const row of rows) {
        if (
          row.bay !== lane.bay ||
          row.x < strip.x ||
          row.x > strip.x + strip.width
        )
          continue
        if (row.side === 'right')
          left = Math.max(left, row.x + CROP_LAYOUT.rootOffset + canopyReserve)
        else
          right = Math.min(
            right,
            row.x - CROP_LAYOUT.rootOffset - canopyReserve
          )
      }
    }
  } else if (lane.kind === 'shared') {
    if (
      !Number.isInteger(lane.boundary) ||
      lane.boundary < 1 ||
      lane.boundary >= site.bays ||
      !['left', 'right'].includes(lane.side)
    )
      throw new Error('Invalid shared lane')
    const center = lane.boundary * site.width
    left = center - site.margin
    right = center - site.postDiameter / 2
    if (lane.side === 'right') {
      left = center + site.postDiameter / 2
      right = center + site.margin
    }
  } else throw new Error('Unknown lane kind')
  const usableWidth = Math.max(0, right - left)
  const requiredWidth = vehicle.width + 2 * vehicle.clearance
  if (usableWidth + 1e-9 < requiredWidth) blocked.push('insufficient-width')
  if (vehicle.height > site.eave) blocked.push('insufficient-height')
  if (survey.entranceWidth === null || survey.entranceHeight === null)
    unverified.push('unknown-entrance')
  if (survey.entranceWidth !== null && survey.entranceWidth < requiredWidth)
    blocked.push('entrance-width')
  if (survey.entranceHeight !== null && survey.entranceHeight < vehicle.height)
    blocked.push('entrance-height')
  if (survey.frontHeadland === null || survey.rearHeadland === null)
    unverified.push('unknown-headland')
  if (
    survey.frontHeadland !== null &&
    start - vehicle.length / 2 < -survey.frontHeadland
  )
    blocked.push('front-headland')
  if (
    survey.rearHeadland !== null &&
    end + vehicle.length / 2 > site.length + survey.rearHeadland
  )
    blocked.push('rear-headland')
  if (survey.ground === 'soft') blocked.push('soft-ground')
  if (survey.ground === 'unknown') unverified.push('unknown-ground')
  let status: 'blocked' | 'unverified' | 'screened' = 'screened'
  if (unverified.length) status = 'unverified'
  if (blocked.length) status = 'blocked'
  return {
    status,
    usableWidth,
    requiredWidth,
    centerX: (left + right) / 2,
    bounds: { left, right, start, end },
    blocked,
    unverified,
    unresolved: [
      'full-swept-envelope',
      'braking',
      'stability',
      'dynamic-obstacles',
      'physical-validation'
    ] as const
  }
}

import type { FarmConfiguration } from './farm-configuration'
import {
  assessHarvestLane,
  type PatrolLane,
  type LaneSurvey
} from './harvest-assessment'
import { assessHarvestEnergy } from './harvest-energy'

export interface RobotConfiguration {
  width: number
  length: number
  height: number
  clearance: number
  canopyReserve: number
  start: number
  end: number
  patrolMinutes: number
  payloadLimit: number
  payload: number
  nominalWh: number
  usableFraction: number
  soc: number
  socUncertainty: number
  nextWorkWh: number
  returnWh: number
  contingencyWh: number
  reserveWh: number
  dockX: number
  dockZ: number
  tool: 'cucumber' | 'tomato'
  scanSide: 'left' | 'right' | 'both'
  lane: PatrolLane
  survey: LaneSurvey
}
export const DEFAULT_ROBOT: Readonly<RobotConfiguration> = {
  width: 0.55,
  length: 0.9,
  height: 1.2,
  clearance: 0.05,
  canopyReserve: 0.2,
  start: 0.5,
  end: 49.5,
  patrolMinutes: 120,
  payloadLimit: 8,
  payload: 0,
  nominalWh: 960,
  usableFraction: 0.8,
  soc: 0.8,
  socUncertainty: 0.05,
  nextWorkWh: 180,
  returnWh: 100,
  contingencyWh: 60,
  reserveWh: 120,
  dockX: 2.45,
  dockZ: -1.8,
  tool: 'cucumber',
  scanSide: 'both',
  lane: { kind: 'strip', bay: 0, strip: 2 },
  survey: {
    ground: 'unknown',
    entranceWidth: null,
    entranceHeight: null,
    frontHeadland: null,
    rearHeadland: null
  }
}
export class RobotConfigurationError extends Error {}
export type RobotNumber = {
  [K in keyof RobotConfiguration]: RobotConfiguration[K] extends number
    ? K
    : never
}[keyof RobotConfiguration]
const positive: readonly RobotNumber[] = [
  'width',
  'length',
  'height',
  'patrolMinutes',
  'payloadLimit',
  'nominalWh',
  'usableFraction',
  'reserveWh'
]
const fractions: readonly RobotNumber[] = [
  'usableFraction',
  'soc',
  'socUncertainty'
]

export function validateRobot(
  input: RobotConfiguration
): Readonly<RobotConfiguration> {
  const fail = () => {
    throw new RobotConfigurationError('Invalid robot design input')
  }
  if (!input || typeof input !== 'object') return fail()
  for (const key of Object.keys(
    DEFAULT_ROBOT
  ) as (keyof RobotConfiguration)[]) {
    if (typeof DEFAULT_ROBOT[key] !== 'number') continue
    const value = input[key]
    if (typeof value !== 'number' || !Number.isFinite(value)) return fail()
    if (key !== 'dockX' && key !== 'dockZ' && value < 0) return fail()
    if (positive.includes(key as RobotNumber) && value <= 0) return fail()
    if (fractions.includes(key as RobotNumber) && value > 1) return fail()
  }
  // Admitted design envelope, not a hardware capability claim.
  if (
    input.width < 0.35 ||
    input.width > 2 ||
    input.length < 0.6 ||
    input.length > 3 ||
    input.height < 0.8 ||
    input.height > 3 ||
    input.start >= input.end
  )
    return fail()
  if (
    !['cucumber', 'tomato'].includes(input.tool) ||
    !['left', 'right', 'both'].includes(input.scanSide)
  )
    return fail()
  const lane = input.lane
  if (!lane || !['strip', 'shared'].includes(lane.kind)) return fail()
  if (lane.kind === 'strip') {
    if (
      !Number.isInteger(lane.bay) ||
      lane.bay < 0 ||
      lane.bay > 3 ||
      !Number.isInteger(lane.strip) ||
      lane.strip < 0
    )
      return fail()
  } else if (
    !Number.isInteger(lane.boundary) ||
    lane.boundary < 1 ||
    lane.boundary > 3 ||
    !['left', 'right'].includes(lane.side)
  )
    return fail()
  const survey = input.survey
  if (!survey || !['unknown', 'prepared', 'soft'].includes(survey.ground))
    return fail()
  for (const key of [
    'entranceWidth',
    'entranceHeight',
    'frontHeadland',
    'rearHeadland'
  ] as const)
    if (
      survey[key] !== null &&
      (typeof survey[key] !== 'number' ||
        !Number.isFinite(survey[key]) ||
        survey[key] < 0)
    )
      return fail()
  return Object.freeze({
    ...input,
    lane: Object.freeze({ ...lane }),
    survey: Object.freeze({ ...survey })
  })
}

export function assessRobotDesign(
  settings: Readonly<RobotConfiguration>,
  farm: FarmConfiguration
) {
  const lane =
    settings.end > farm.length ||
    (settings.lane.kind === 'strip' &&
      settings.lane.strip >= farm.strips.length)
      ? null
      : assessHarvestLane({
          farm,
          lane: settings.lane,
          vehicle: {
            width: settings.width,
            length: settings.length,
            height: settings.height,
            clearance: settings.clearance
          },
          canopyReserve: settings.canopyReserve,
          start: settings.start,
          end: settings.end,
          survey: settings.survey
        })
  const energy = assessHarvestEnergy({
    ...settings,
    batteryFresh: false,
    returnPathAdmitted: false,
    dockAvailable: false
  })
  return {
    settings,
    lane,
    energy,
    exchangeRequired: settings.payload >= settings.payloadLimit
  }
}
export type RobotSnapshot = ReturnType<typeof assessRobotDesign>

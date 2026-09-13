import { beforeAll, expect, it, vi } from 'vitest'
import { SiteGeometry } from '../../render-app/site-geometry'
import { buildSiteMeshes } from '../../render-app/site-projection'
import { RobotProjection } from '../../render-app/robot-projection'
import { DEFAULT_CONFIGURATION } from '../../domain/farm-configuration'
import {
  DEFAULT_ROBOT,
  assessRobotDesign,
  validateRobot
} from '../../domain/robot-configuration'
import * as crops from '../../domain/crop-models'
import * as robotModels from '../../domain/robot-model'
import * as lanes from '../../domain/harvest-assessment'
import type {
  CanonicalMission,
  DispatchEvidence,
  MovementResult,
  MovementRequest
} from '../contracts'

const geometry = new SiteGeometry()
const projection = new RobotProjection()
const farm = { ...DEFAULT_CONFIGURATION, length: 2.2 }
const report = assessRobotDesign(
  validateRobot({ ...DEFAULT_ROBOT, end: 1.7 }),
  farm
)
let receipt: CanonicalMission
let current = true
beforeAll(() => {
  const scene = geometry.prepareScene(farm, buildSiteMeshes(farm, geometry))
  projection.update(report)
  receipt = Object.freeze({
    revision: 1,
    farm,
    report,
    scene,
    robot: projection.getSource()
  })
})
const owners = {
  isCurrentMission: (value: CanonicalMission) => current && value === receipt,
  isCurrentScene: geometry.isCurrentScene.bind(geometry),
  isCurrentRobot: projection.isCurrentSource.bind(projection)
}
const evidence = (): DispatchEvidence => ({
  id: 'dispatch-1',
  source: 'synthetic',
  missionRevision: 1,
  sceneRevision: receipt.scene.revision,
  robotRevision: receipt.robot.revision,
  observedAt: 0,
  validFrom: 0,
  validUntil: 100,
  survey: {
    ground: 'prepared',
    entranceWidth: 2,
    entranceHeight: 3,
    frontHeadland: 2,
    rearHeadland: 2
  },
  battery: { soc: 0.8, socUncertainty: 0.05 },
  dock: 'available',
  stowed: true,
  crate: {
    id: 'crate-1',
    cultivar: 'cucumber',
    tareKg: 1,
    load: {
      baseMass: 30,
      payload: 0,
      nextFruit: 0,
      payloadLimit: 8,
      fill: 0,
      returnFill: 0.8,
      latched: true,
      scaleTrusted: true,
      track: 0.4,
      baseHeight: 0.25,
      payloadHeight: 0.5,
      baseOffset: 0,
      payloadOffset: 0,
      roll: 0,
      lateralAcceleration: 0,
      uncertainty: 0.01
    }
  },
  intervals: {
    dispatch: { from: 0, until: 10 },
    return: { from: 10, until: 20 }
  }
})
const clear = (requests: readonly MovementRequest[]): MovementResult[] =>
  requests.map((request) => ({
    request,
    status: 'clear',
    coverage: 'complete',
    reasons: []
  }))

it('assesses fresh synthetic dispatch against completed B and actual C products without modifying design', async () => {
  const { prepareMission, admitDispatch } = await import('../contracts')
  const generation = vi.spyOn(crops, 'createCropModels')
  const robotGeneration = vi.spyOn(robotModels, 'createRobotModel')
  const laneAssessment = vi.spyOn(lanes, 'assessHarvestLane')
  try {
    const mission = prepareMission(receipt, owners)
    const input = evidence()
    const query = vi.fn(clear)
    const result = admitDispatch(mission, input, 0, owners, query)
    expect(result.accepted).toBe(true)
    expect(result.lane?.status).toBe('screened')
    expect(result.energy?.action).toBe('continue-screening')
    expect(result.load?.action).toBe('continue-screening')
    expect(report.lane?.status).toBe('unverified')
    expect(report.energy.action).toBe('hold')
    expect(query).toHaveBeenCalledTimes(1)
    expect(laneAssessment).toHaveBeenCalledTimes(1)
    const requests = query.mock.calls[0][0]
    expect(requests.map((request) => request.purpose)).toEqual([
      'dispatch',
      'return'
    ])
    expect(requests[0].scene).toBe(receipt.scene)
    expect(requests[0].robot).toBe(receipt.robot)
    expect(requests[0].waypoints).toEqual([
      [report.settings.dockX, 0, report.settings.dockZ],
      [report.lane?.centerX, 0, report.settings.start],
      [report.lane?.centerX, 0, report.settings.end]
    ])
    expect(requests[1].waypoints).toEqual([
      requests[0].waypoints[2],
      requests[0].waypoints[0]
    ])
    expect(
      requests.every((request) =>
        Object.values(request.joints).every((value) => value === 0)
      )
    ).toBe(true)
    input.battery.soc = 0
    expect(result.evidence?.battery.soc).toBe(0.8)
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.evidence?.battery)).toBe(true)
    expect(generation).not.toHaveBeenCalled()
    expect(robotGeneration).not.toHaveBeenCalled()
  } finally {
    generation.mockRestore()
    robotGeneration.mockRestore()
    laneAssessment.mockRestore()
  }
})

it('rejects stale or forged canonical and C handles before downstream work', async () => {
  const { prepareMission, admitDispatch } = await import('../contracts')
  expect(() => prepareMission({ ...receipt }, owners)).toThrow()
  expect(() =>
    prepareMission(receipt, { ...owners, isCurrentScene: () => false })
  ).toThrow()
  expect(() =>
    prepareMission(receipt, { ...owners, isCurrentRobot: () => false })
  ).toThrow()
  const mission = prepareMission(receipt, owners)
  const query = vi.fn(clear)
  current = false
  try {
    expect(() => admitDispatch(mission, evidence(), 0, owners, query)).toThrow()
    expect(query).not.toHaveBeenCalled()
  } finally {
    current = true
  }
})

it('enforces half-open observation validity and rejects wrong revisions or nonfinite time atomically', async () => {
  const { prepareMission, admitDispatch } = await import('../contracts')
  const mission = prepareMission(receipt, owners)
  for (const patch of [
    { id: '' },
    { source: 'hardware' },
    { missionRevision: 2 },
    { sceneRevision: -1 },
    { robotRevision: -1 },
    { observedAt: 1 },
    { validFrom: 1 },
    { validUntil: 0 },
    { validUntil: Infinity }
  ]) {
    const query = vi.fn(clear)
    expect(() =>
      admitDispatch(
        mission,
        { ...evidence(), ...patch } as DispatchEvidence,
        0,
        owners,
        query
      )
    ).toThrow()
    expect(query).not.toHaveBeenCalled()
  }
  for (const time of [-1, NaN, Infinity, 100])
    expect(() =>
      admitDispatch(mission, evidence(), time, owners, clear)
    ).toThrow()
  const input = evidence()
  input.validUntil = 21
  expect(admitDispatch(mission, input, 0, owners, clear).accepted).toBe(true)
  input.intervals.return.until = 21
  expect(() => admitDispatch(mission, input, 0, owners, clear)).toThrow()
})

it('holds incomplete evidence, insufficient budgets and unsupported posture instead of defaulting to clear', async () => {
  const { prepareMission, admitDispatch } = await import('../contracts')
  const mission = prepareMission(receipt, owners)
  for (const change of [
    (input: DispatchEvidence) => {
      input.survey.ground = 'unknown'
    },
    (input: DispatchEvidence) => {
      input.battery.soc = null
    },
    (input: DispatchEvidence) => {
      input.battery.soc = 0.1
    },
    (input: DispatchEvidence) => {
      input.dock = 'unknown'
    },
    (input: DispatchEvidence) => {
      input.stowed = false
    },
    (input: DispatchEvidence) => {
      input.crate.id = null
    },
    (input: DispatchEvidence) => {
      input.crate.tareKg = null
    },
    (input: DispatchEvidence) => {
      input.crate.cultivar = 'tomato'
    },
    (input: DispatchEvidence) => {
      if (input.crate.load) input.crate.load.latched = false
    },
    (input: DispatchEvidence) => {
      if (input.crate.load) input.crate.load.fill = 1
    }
  ]) {
    const input = evidence()
    change(input)
    expect(admitDispatch(mission, input, 0, owners, clear).accepted).toBe(false)
  }
})

it('requires complete exact request coverage and never trusts an unrelated clear result', async () => {
  const { prepareMission, admitDispatch } = await import('../contracts')
  const mission = prepareMission(receipt, owners)
  for (const query of [
    () => [],
    (requests: readonly MovementRequest[]) => clear(requests).slice(0, 1),
    (requests: readonly MovementRequest[]) =>
      clear(requests).map((result) => ({
        ...result,
        status: 'unknown' as const
      })),
    (requests: readonly MovementRequest[]) =>
      clear(requests).map((result) => ({
        ...result,
        status: 'blocked' as const
      })),
    (requests: readonly MovementRequest[]) =>
      clear(requests).map((result) => ({
        ...result,
        coverage: 'incomplete' as const
      })),
    (requests: readonly MovementRequest[]) =>
      clear(requests).map((result) => ({
        ...result,
        request: { ...result.request, waypoints: [] }
      })),
    (requests: readonly MovementRequest[]) => [
      clear(requests)[0],
      clear(requests)[0]
    ]
  ])
    expect(admitDispatch(mission, evidence(), 0, owners, query).accepted).toBe(
      false
    )
  expect(admitDispatch(mission, evidence(), 0, owners, clear)).toEqual(
    admitDispatch(mission, evidence(), 0, owners, clear)
  )
})

it('rejects forged prepared missions', async () => {
  const { prepareMission, admitDispatch } = await import('../contracts')
  const mission = prepareMission(receipt, owners)
  const query = vi.fn(clear)
  for (const forged of [
    { ...mission },
    { ...mission, revision: 2 },
    { ...mission, report: { ...mission.report, route: null } },
    { ...mission, scene: { ...mission.scene } },
    { ...mission, robot: { ...mission.robot } }
  ])
    expect(() => admitDispatch(forged, evidence(), 0, owners, query)).toThrow()
  expect(query).not.toHaveBeenCalled()
})

it('preserves movement fault evidence', async () => {
  const { prepareMission, admitDispatch } = await import('../contracts')
  const mission = prepareMission(receipt, owners)
  const result = admitDispatch(mission, evidence(), 0, owners, (requests) =>
    clear(requests).map((item) => ({
      ...item,
      status: 'blocked',
      reasons: ['net-contact']
    }))
  )
  expect(result.accepted).toBe(false)
  expect(result.movements[0]?.reasons).toEqual(['net-contact'])
  expect(result.reasons).toContain('net-contact')
})

it('detaches canonical caller data and rejects a source retired during a query', async () => {
  const { prepareMission, admitDispatch } = await import('../contracts')
  const mission = prepareMission(receipt, owners)
  const length = farm.length
  farm.length = 20
  try {
    expect(mission.farm.length).toBe(length)
  } finally {
    farm.length = length
  }
  const query = (requests: readonly MovementRequest[]) => {
    current = false
    return clear(requests)
  }
  try {
    expect(() => admitDispatch(mission, evidence(), 0, owners, query)).toThrow()
  } finally {
    current = true
  }
})

it('rejects overlapping or reversed required dispatch and return intervals', async () => {
  const { prepareMission, admitDispatch } = await import('../contracts')
  const mission = prepareMission(receipt, owners)
  for (const interval of [
    { from: 0, until: 5 },
    { from: 9, until: 20 }
  ]) {
    const input = evidence()
    input.intervals.return = interval
    const query = vi.fn(clear)
    expect(() => admitDispatch(mission, input, 0, owners, query)).toThrow()
    expect(query).not.toHaveBeenCalled()
  }
})

it('rejects the real unavailable C rig before any dispatch query', async () => {
  const { prepareMission, admitDispatch } = await import('../contracts')
  const owner = new RobotProjection()
  // C can retain a parked concept below B's admitted design height; D must not
  // accept that unsupported definition by pairing it with unrelated B settings.
  const shortReport = assessRobotDesign(
    { ...report.settings, height: 0.6 },
    farm
  )
  owner.update(shortReport)
  const robot = owner.getSource()
  expect(robot.rig).toBeNull()
  expect(robot.unavailable).toBe('unsupported-lift')
  const shortReceipt = Object.freeze({ ...receipt, report: shortReport, robot })
  const shortOwners = {
    ...owners,
    isCurrentMission: (value: CanonicalMission) => value === shortReceipt,
    isCurrentRobot: owner.isCurrentSource.bind(owner)
  }
  const query = vi.fn(clear)
  expect(() =>
    admitDispatch(
      prepareMission(shortReceipt, shortOwners),
      evidence(),
      0,
      shortOwners,
      query
    )
  ).toThrow()
  expect(query).not.toHaveBeenCalled()
  expect(owner.getSource()).toBe(robot)
  owner.clear()
})

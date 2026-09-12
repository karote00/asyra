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
import * as models from '../../domain/robot-model'
import * as lanes from '../../domain/harvest-assessment'
import type { CanonicalMission, DispatchEvidence } from '../contracts'
import { HarvestSession } from '../session'
import { QueryGeometry } from '../geometry'
import {
  TargetObservations,
  type ObservationContext,
  type TargetReading
} from '../observations'

const geometry = new SiteGeometry(),
  projection = new RobotProjection()
const farm = { ...DEFAULT_CONFIGURATION, length: 2.2 }
const report = assessRobotDesign(
  validateRobot({ ...DEFAULT_ROBOT, end: 1.7, patrolMinutes: 1 }),
  farm
)
let receipt: CanonicalMission
beforeAll(() => {
  const scene = geometry.prepareScene(farm, buildSiteMeshes(farm, geometry))
  projection.update(report)
  receipt = Object.freeze({
    revision: 1,
    report,
    farm,
    scene,
    robot: projection.getSource()
  })
})
const dispatchEvidence = (): DispatchEvidence => ({
  id: 'dispatch',
  source: 'synthetic',
  missionRevision: 1,
  sceneRevision: receipt.scene.revision,
  robotRevision: receipt.robot.revision,
  observedAt: 0,
  validFrom: 0,
  validUntil: 1000,
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

function setup() {
  const session = new HarvestSession(
    receipt,
    {
      isCurrentMission: (value) => value === receipt,
      isCurrentScene: geometry.isCurrentScene.bind(geometry),
      isCurrentRobot: projection.isCurrentSource.bind(projection)
    },
    {
      // These explicit doubles only enter the already-tested session foundation.
      dispatch: (requests) =>
        requests.map((request) => ({
          request,
          status: 'clear',
          coverage: 'complete',
          reasons: []
        })),
      resume: async (request) => ({
        request,
        status: 'held',
        validFrom: request.now,
        validUntil: request.now + 1,
        reasons: ['not-in-this-slice']
      })
    }
  )
  expect(
    session.start(session.getSnapshot().generation, dispatchEvidence())
  ).toBe(true)
  const tuple = Object.freeze({
    revision: receipt.revision,
    scene: receipt.scene,
    robot: receipt.robot,
    dock: projection.getDockSource()
  })
  const query = new QueryGeometry({
    isCurrentReceipt: (value) => value === tuple,
    isCurrentScene: geometry.isCurrentScene.bind(geometry),
    isCurrentRobot: projection.isCurrentSource.bind(projection),
    isCurrentDock: projection.isCurrentDockSource.bind(projection)
  })
  const source = query.prepare(tuple)
  let context: ObservationContext
  const renew = () =>
    (context = Object.freeze({
      snapshot: session.getSnapshot(),
      mission: receipt,
      geometry: source
    }))
  renew()
  const observations = new TargetObservations(session, query, {
    // This fixture issued the actual session with this exact mission above.
    isCurrentContext: (value) => value === context && value.mission === receipt,
    isCurrentMission: (value) => value === receipt
  })
  const target = receipt.scene.fruits[0]
  if (!target) throw new Error('Missing actual crop target')
  const reading = (): TargetReading => ({
    kind: 'target',
    source: 'synthetic-injected',
    assumption: 'Explicit scenario assumption',
    id: 'reading-1',
    runId: session.getSnapshot().run?.id ?? '',
    generation: session.getSnapshot().generation,
    missionRevision: receipt.revision,
    sceneRevision: receipt.scene.revision,
    robotRevision: receipt.robot.revision,
    dockRevision: tuple.dock.revision,
    observedAt: 0,
    validFrom: 0,
    validUntil: 10,
    targetId: target.id,
    cultivar: null,
    pose: null,
    maturity: null,
    coverage: null,
    stem: null,
    approach: null,
    extraction: null,
    quality: { spines: null, calyx: null, contactDamage: null }
  })
  return {
    session,
    query,
    source,
    observations,
    renew,
    reading,
    target,
    context: () => context
  }
}

it('admits only labeled assumptions without filling unknowns or creating another target', () => {
  const f = setup(),
    input = f.reading(),
    snapshot = f.session.getSnapshot()
  const crop = vi.spyOn(crops, 'createCropModels'),
    robot = vi.spyOn(models, 'createRobotModel'),
    assess = vi.spyOn(lanes, 'assessHarvestLane')
  try {
    const first = f.observations.admit(f.context(), input)
    input.quality.calyx = 'intact'
    const second = f.observations.admit(f.context(), {
      ...f.reading(),
      id: 'reading-2'
    })
    expect(first.reading.targetId).toBe(f.target.id)
    expect(second.reading.targetId).toBe(first.reading.targetId)
    expect(first.reading.quality).toEqual({
      spines: null,
      calyx: null,
      contactDamage: null
    })
    expect(first.reading.coverage).toBeNull()
    expect(first.reading.maturity).toBeNull()
    expect(Object.isFrozen(first.reading.quality)).toBe(true)
    expect(f.session.getSnapshot() === snapshot).toBe(true)
    expect(crop).not.toHaveBeenCalled()
    expect(robot).not.toHaveBeenCalled()
    expect(assess).not.toHaveBeenCalled()
  } finally {
    crop.mockRestore()
    robot.mockRestore()
    assess.mockRestore()
  }
})

it('rejects copied, stale and cancelled contexts while geometry itself remains current', () => {
  const f = setup(),
    context = f.context(),
    snapshot = f.session.getSnapshot()
  expect(() => f.observations.admit({ ...context }, f.reading())).toThrow()
  expect(f.session.getSnapshot() === snapshot).toBe(true)
  f.session.pause(snapshot.generation)
  expect(() => f.observations.admit(context, f.reading())).toThrow()
  f.renew()
  expect(f.observations.admit(f.context(), f.reading()).reading.targetId).toBe(
    f.target.id
  )
  f.session.cancel(snapshot.generation)
  f.renew()
  expect(() => f.observations.admit(f.context(), f.reading())).toThrow()
  expect(f.query.read(f.source) === f.source).toBe(true)
})

it('validates the detached snapshot once and checks explicit validity and target fields', () => {
  const f = setup()
  let reads = 0
  const input = f.reading()
  Object.defineProperty(input, 'observedAt', {
    enumerable: true,
    get: () => (++reads === 1 ? 0 : NaN)
  })
  expect(f.observations.admit(f.context(), input).reading.observedAt).toBe(0)
  expect(reads).toBe(1)
  const cases: Partial<TargetReading>[] = [
    { runId: 'other' },
    { generation: 0 },
    { missionRevision: 9 },
    { sceneRevision: -1 },
    { robotRevision: NaN },
    { dockRevision: -1 },
    { targetId: 'missing' },
    { observedAt: 1 },
    { observedAt: NaN },
    { validUntil: 0 },
    { validFrom: 1 },
    { coverage: { visible: 1, total: 0 } },
    { coverage: { visible: 0.5, total: 1 } },
    {
      cultivar:
        f.target.plant.species === 'cucumber-1914'
          ? 'tomato-yu-nu'
          : 'cucumber-1914'
    },
    { pose: { position: [0, NaN, 0], rotation: [0, 0, 0, 1] } },
    { pose: { position: [0, 0, 0], rotation: [0, 0, 0, 2] } },
    { stem: { targetId: 'neighbor', recognized: true, cutSite: null } }
  ]
  const snapshot = f.session.getSnapshot()
  for (const patch of cases)
    expect(() =>
      f.observations.admit(f.context(), { ...f.reading(), ...patch })
    ).toThrow()
  expect(f.session.getSnapshot() === snapshot).toBe(true)
})

it('accepts still-valid earlier evidence at the current clock without extending expiry', () => {
  const f = setup(),
    input = f.reading()
  f.session.advance(f.session.getSnapshot().generation, 5)
  f.renew()
  expect(f.observations.admit(f.context(), input).reading.validUntil).toBe(10)
  f.session.advance(f.session.getSnapshot().generation, 10)
  f.renew()
  expect(() => f.observations.admit(f.context(), input)).toThrow()
})

it('keeps quality and target pedicel assumptions independent and rejects action confirmations', () => {
  const f = setup(),
    input = f.reading()
  input.quality.calyx = 'intact'
  input.approach = 'clear'
  input.coverage = { visible: 0, total: 0 }
  input.stem = { targetId: f.target.id, recognized: true, cutSite: [1, 2, 3] }
  const admitted = f.observations.admit(f.context(), input)
  expect(admitted.reading.quality.spines).toBeNull()
  expect(admitted.reading.quality.contactDamage).toBeNull()
  expect(admitted.reading.coverage).toEqual({ visible: 0, total: 0 })
  expect(() =>
    f.observations.admit(f.context(), {
      ...input,
      kind: 'cut',
      actionId: 'caller-made'
    } as unknown as TargetReading)
  ).toThrow()
})

it('rechecks the actual snapshot before return and rejects retired shared geometry', () => {
  const f = setup(),
    input = f.reading(),
    generation = f.session.getSnapshot().generation
  Object.defineProperty(input, 'assumption', {
    enumerable: true,
    get: () => {
      f.session.pause(generation)
      return 'Caller changes context during capture'
    }
  })
  expect(() => f.observations.admit(f.context(), input)).toThrow()
  f.renew()
  f.query.clear()
  expect(() => f.observations.admit(f.context(), f.reading())).toThrow()
})

it('rejects all confirmations and undeclared claims without altering an active run', () => {
  const f = setup(),
    snapshot = f.session.getSnapshot()
  for (const kind of ['support', 'cut', 'retention', 'placement']) {
    expect(() =>
      f.observations.admit(f.context(), {
        ...f.reading(),
        kind,
        actionId: 'invented'
      } as unknown as TargetReading)
    ).toThrow()
  }
  expect(() =>
    f.observations.admit(f.context(), {
      ...f.reading(),
      detected: true
    } as TargetReading)
  ).toThrow()
  const input = f.reading()
  input.cultivar = f.target.plant.species
  input.pose = { position: [1, 2, 3], rotation: [0, 0, 0, 1] }
  input.maturity = 'green'
  input.coverage = { visible: 2, total: 3 }
  const result = f.observations.admit(f.context(), input)
  expect(result.reading.source).toBe('synthetic-injected')
  expect(result.reading.pose).toEqual(input.pose)
  expect(result.reading.coverage).toEqual({ visible: 2, total: 3 })
  expect(f.session.getSnapshot() === snapshot).toBe(true)
  f.session.dispose()
  f.renew()
  expect(() => f.observations.admit(f.context(), input)).toThrow()
})

it.each(['position', 'rotation', 'cutSite'])(
  'rejects sparse %s arrays before admitting numeric evidence',
  (field) => {
    const f = setup(),
      snapshot = f.session.getSnapshot()
    const points = new Array(3) as [number, number, number]
    const rotation = new Array(4) as [number, number, number, number]
    const patches: Record<string, Partial<TargetReading>> = {
      position: { pose: { position: points, rotation: [0, 0, 0, 1] } },
      rotation: { pose: { position: [0, 0, 0], rotation } },
      cutSite: {
        stem: { targetId: f.target.id, recognized: true, cutSite: points }
      }
    }
    expect(() =>
      f.observations.admit(f.context(), { ...f.reading(), ...patches[field] })
    ).toThrow()
    expect(f.session.getSnapshot() === snapshot).toBe(true)
  }
)

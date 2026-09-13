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
import { RayQueries } from '../ray-query'
import {
  TargetObservations,
  type ObservationContext,
  type TargetReading,
  type ViewRequest
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

function setup(mutableContext = false) {
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
  const renew = () => {
    const next = {
      snapshot: session.getSnapshot(),
      mission: receipt,
      geometry: source
    }
    return (context = mutableContext ? next : Object.freeze(next))
  }
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
    quality: { spines: null, calyx: null, pedicel: null, contactDamage: null }
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
      pedicel: null,
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

function viewpoint(f: ReturnType<typeof setup>): ViewRequest {
  const reading = f.reading()
  return {
    id: reading.id,
    source: 'synthetic-viewpoint',
    assumption: 'Declared synthetic camera rays',
    runId: reading.runId,
    generation: reading.generation,
    missionRevision: reading.missionRevision,
    sceneRevision: reading.sceneRevision,
    robotRevision: reading.robotRevision,
    dockRevision: reading.dockRevision,
    observedAt: 0,
    validFrom: 0,
    validUntil: 10,
    targetIds: [f.target.id],
    samplesPerTarget: 4,
    leaves: 'source-pose',
    fruits: 'all-attached',
    camera: {
      pose: {
        position: [
          f.target.position[0],
          f.target.position[1],
          f.target.position[2] - 0.5
        ],
        rotation: [0, 0, 0, 1]
      },
      halfWidthSlope: 1,
      halfHeightSlope: 1,
      maxDistance: 2
    }
  }
}

it('samples an explicit synthetic viewpoint without treating source labels as maturity or quality', () => {
  const f = setup()
  const result = f.observations.view(f.context(), viewpoint(f))
  expect(result.samples).toHaveLength(4)
  expect(result.coverage.occluded).toBe(4)
  expect(
    result.samples.every(
      (sample) =>
        sample.ray?.status === 'hit' && sample.ray.mesh.layer === 'film'
    )
  ).toBe(true)
  console.info(
    'actual viewpoint source profile',
    JSON.stringify({
      coverage: result.coverage,
      work: result.work,
      samples: result.samples.map((sample) => ({
        status: sample.status,
        reason: sample.reason,
        requested: sample.requested.triangle,
        hit:
          sample.ray?.status === 'hit'
            ? { mesh: sample.ray.mesh.origin.id, triangle: sample.ray.triangle }
            : null
      }))
    })
  )
  expect(result.work.cameraFrames).toBe(1)
  expect(result.work.rayBatches).toBe(1)
  expect(result.rays?.work.fk).toBe(1)
  expect(result.rays?.work.vertexVisits).toBe(0)
  expect(
    result.samples.every((sample) => sample.requested.targetId === f.target.id)
  ).toBe(true)
  expect('maturity' in result).toBe(false)
  expect('quality' in result).toBe(false)
})

it('observes actual near target surfaces from inside the greenhouse with separate requested and hit identities', () => {
  const f = setup(),
    input = viewpoint(f)
  input.camera.pose = {
    position: [
      f.target.position[0],
      f.target.position[1],
      f.target.position[2] + 0.5
    ],
    rotation: [0, 1, 0, 0]
  }
  const result = f.observations.view(f.context(), input)
  console.info(
    'interior viewpoint source profile',
    JSON.stringify({
      coverage: result.coverage,
      samples: result.samples.map((sample) => ({
        status: sample.status,
        reason: sample.reason,
        requested: sample.requested.triangle,
        hit:
          sample.ray?.status === 'hit'
            ? { mesh: sample.ray.mesh.origin.id, triangle: sample.ray.triangle }
            : null
      }))
    })
  )
  expect(result.coverage.visible).toBeGreaterThan(0)
  for (const sample of result.samples.filter(
    (item) => item.status === 'visible'
  )) {
    expect(sample.ray?.status).toBe('hit')
    if (sample.ray?.status !== 'hit') throw new Error('Missing actual hit')
    expect(
      sample.ray.mesh.plants?.[sample.ray.instance] === f.target.plant
    ).toBe(true)
    const hit = sample.ray
    expect(
      hit.mesh.partitions?.some(
        (part) =>
          part.fruitId === f.target.source.id &&
          part.indexStart <= hit.triangle * 3 &&
          hit.triangle * 3 < part.indexStart + part.indexCount
      )
    ).toBe(true)
  }
})

it('keeps empty, out-of-view and unknown dynamics distinct without a ray batch', () => {
  const f = setup(),
    input = viewpoint(f),
    query = vi.spyOn(RayQueries.prototype, 'query')
  try {
    input.targetIds = []
    const empty = f.observations.view(f.context(), input)
    expect(empty.coverage).toEqual({
      total: 0,
      visible: 0,
      occluded: 0,
      outsideView: 0,
      unknown: 0
    })
    expect(empty.work.cameraFrames).toBe(0)
    const away = viewpoint(f)
    away.camera.pose = {
      position: [
        f.target.position[0],
        f.target.position[1],
        f.target.position[2] + 0.5
      ],
      rotation: [0, 0, 0, 1]
    }
    expect(f.observations.view(f.context(), away).coverage.outsideView).toBe(4)
    const unknown = viewpoint(f)
    unknown.leaves = 'unknown'
    expect(f.observations.view(f.context(), unknown).coverage.unknown).toBe(4)
    unknown.leaves = 'source-pose'
    unknown.fruits = 'unknown'
    expect(f.observations.view(f.context(), unknown).coverage.unknown).toBe(4)
    expect(query).not.toHaveBeenCalled()
  } finally {
    query.mockRestore()
  }
})

it('rejects malformed budgets, sparse cameras and historical pose requests before queries', () => {
  const f = setup(),
    query = vi.spyOn(RayQueries.prototype, 'query')
  try {
    for (const count of [0, 65, NaN, 1.5])
      expect(() =>
        f.observations.view(f.context(), {
          ...viewpoint(f),
          samplesPerTarget: count
        })
      ).toThrow()
    for (const targetIds of [
      [f.target.id, f.target.id],
      ['missing'],
      new Array(1) as string[]
    ])
      expect(() =>
        f.observations.view(f.context(), { ...viewpoint(f), targetIds })
      ).toThrow()
    const sparse = viewpoint(f)
    sparse.camera.pose = {
      position: new Array(3) as [number, number, number],
      rotation: [0, 0, 0, 1]
    }
    expect(() => f.observations.view(f.context(), sparse)).toThrow()
    sparse.camera.pose = {
      position: [0, 0, 0],
      rotation: new Array(4) as [number, number, number, number]
    }
    expect(() => f.observations.view(f.context(), sparse)).toThrow()
    f.session.advance(f.session.getSnapshot().generation, 1)
    f.renew()
    expect(() => f.observations.view(f.context(), viewpoint(f))).toThrow()
    expect(query).not.toHaveBeenCalled()
  } finally {
    query.mockRestore()
  }
})

it('uses one real current-pose ray batch and original source ranges without source regeneration', () => {
  const f = setup(),
    query = vi.spyOn(RayQueries.prototype, 'query'),
    crop = vi.spyOn(crops, 'createCropModels'),
    robot = vi.spyOn(models, 'createRobotModel'),
    prepare = vi.spyOn(f.query, 'prepare')
  const snapshot = f.session.getSnapshot()
  try {
    const result = f.observations.view(f.context(), viewpoint(f))
    expect(query).toHaveBeenCalledTimes(1)
    expect(
      query.mock.calls[0][1].robot?.joints === snapshot.run?.pose.joints
    ).toBe(true)
    expect(
      query.mock.calls[0][1].robot?.base.position === snapshot.run?.pose.base
    ).toBe(true)
    expect(crop).not.toHaveBeenCalled()
    expect(robot).not.toHaveBeenCalled()
    expect(prepare).not.toHaveBeenCalled()
    const identities = result.samples.map(({ requested }) => {
      const { mesh, instance, triangle } = requested
      expect(mesh.plants?.[instance] === f.target.plant).toBe(true)
      expect(
        mesh.partitions?.some(
          (part) =>
            part.fruitId === f.target.source.id &&
            part.indexStart <= triangle * 3 &&
            triangle * 3 < part.indexStart + part.indexCount
        )
      ).toBe(true)
      return `${f.source.meshes.indexOf(mesh)}:${instance}:${triangle}`
    })
    expect(new Set(identities).size).toBe(4)
    expect(Object.isFrozen(result.samples[0].requested.point)).toBe(true)
    expect(f.session.getSnapshot() === snapshot).toBe(true)
  } finally {
    query.mockRestore()
    crop.mockRestore()
    robot.mockRestore()
    prepare.mockRestore()
  }
})

it('does not certify a requested back surface from a nearer hit on the same actual target', () => {
  const f = setup(),
    input = viewpoint(f)
  input.samplesPerTarget = 16
  input.camera.pose = {
    position: [
      f.target.position[0],
      f.target.position[1],
      f.target.position[2] + 0.5
    ],
    rotation: [0, 1, 0, 0]
  }
  const result = f.observations.view(f.context(), input)
  const different = result.samples.filter(
    (sample) =>
      sample.status === 'visible' &&
      sample.ray?.status === 'hit' &&
      (sample.ray.mesh !== sample.requested.mesh ||
        sample.ray.triangle !== sample.requested.triangle)
  )
  expect(different.length).toBeGreaterThan(0)
  expect(
    different.every((sample) => sample.reason === 'target-surface-ray')
  ).toBe(true)
})

it('classifies camera frustum interiors and exclusions while retaining a rounded boundary as unknown', () => {
  const f = setup(),
    input = viewpoint(f)
  input.samplesPerTarget = 1
  input.leaves = 'unknown'
  const point = f.observations.view(f.context(), input).samples[0].requested
    .point
  input.leaves = 'source-pose'
  input.camera.pose = {
    position: [point[0] - 1, point[1], point[2] - 1],
    rotation: [0, 0, 0, 1]
  }
  input.camera.halfWidthSlope = 0.5
  expect(f.observations.view(f.context(), input).coverage.outsideView).toBe(1)
  input.camera.halfWidthSlope = 2
  expect(f.observations.view(f.context(), input).work.rayBatches).toBe(1)
  input.camera.halfWidthSlope = 1
  input.camera.pose = {
    position: [point[0] - Math.SQRT2, point[1], point[2]],
    rotation: [0, Math.sin(Math.PI / 8), 0, Math.cos(Math.PI / 8)]
  }
  const boundary = f.observations.view(f.context(), input)
  expect(boundary.coverage.unknown).toBe(1)
  expect(boundary.samples[0].reason).toBe('camera-frustum')
  expect(boundary.work.rayBatches).toBe(0)
})

it('keeps behind-sample and overlapping non-target provider witnesses unknown', () => {
  const f = setup(),
    input = viewpoint(f)
  const baseline = f.observations.view(f.context(), input)
  if (!baseline.rays) throw new Error('Missing real provider batch')
  const query = vi.spyOn(RayQueries.prototype, 'query')
  try {
    // Direct consumer oracle: explicitly supply possible certified provider
    // distances after a computed ray misses its ideal source sample. This does
    // not claim to reproduce a particular floating-point miss in the real scene.
    for (const kind of ['behind', 'overlap']) {
      query.mockReturnValue({
        ...baseline.rays,
        results: baseline.samples.map((sample) => {
          if (sample.ray?.status !== 'hit')
            throw new Error('Missing actual film witness')
          const low =
            kind === 'behind'
              ? sample.sampleDistance.high + 1
              : sample.sampleDistance.low
          const high = kind === 'behind' ? low : sample.sampleDistance.high
          return {
            ...sample.ray,
            distance: low + (high - low) / 2,
            distanceBounds: Object.freeze({ low, high })
          }
        })
      })
      const result = f.observations.view(f.context(), input)
      expect(result.coverage.unknown).toBe(4)
      expect(result.coverage.occluded).toBe(0)
      expect(
        result.samples.every(
          (sample) =>
            sample.ray?.status === 'hit' &&
            sample.reason === 'non-target-distance-unresolved'
        )
      ).toBe(true)
    }
  } finally {
    query.mockRestore()
  }
})

it('encloses requested sample distance before rounded ray subtraction', () => {
  const f = setup(),
    input = viewpoint(f)
  input.leaves = 'unknown'
  input.samplesPerTarget = 1
  const first = f.observations.view(f.context(), input).samples[0]
  expect(first.requested.point[0]).toBeGreaterThan(0)
  expect(first.requested.point[0]).toBeLessThan(4)
  input.camera.pose = {
    ...input.camera.pose,
    position: [-(2 ** 54), first.requested.point[1], first.requested.point[2]]
  }
  const result = f.observations.view(f.context(), input)
  // Exact source point minus camera is strictly between these adjacent floats.
  expect(result.samples[0].sampleDistance.low).toBeLessThanOrEqual(2 ** 54)
  expect(result.samples[0].sampleDistance.high).toBeGreaterThanOrEqual(
    2 ** 54 + 4
  )
})

it('freezes owned viewpoint output without freezing the composition context', () => {
  const f = setup(true),
    input = viewpoint(f),
    context = f.context()
  input.leaves = 'unknown'
  expect(Object.isFrozen(context)).toBe(false)
  const result = f.observations.view(context, input)
  expect(result.context).toBe(context)
  expect(Object.isFrozen(context)).toBe(false)
  for (const owned of [
    result,
    result.samples,
    result.samples[0],
    result.samples[0].sampleDistance,
    result.coverage,
    result.work
  ])
    expect(Object.isFrozen(owned)).toBe(true)
})

it('requires explicit distal pedicel evidence instead of accepting an old transient shape', () => {
  const f = setup(),
    input = f.reading()
  const { pedicel, ...oldQuality } = input.quality
  expect(pedicel).toBeNull()
  for (const value of [undefined, 'retained', true, 3, []]) {
    expect(() =>
      f.observations.admit(f.context(), {
        ...input,
        quality: { ...input.quality, pedicel: value }
      } as TargetReading)
    ).toThrow()
  }
  expect(() =>
    f.observations.admit(f.context(), {
      ...input,
      quality: oldQuality
    } as TargetReading)
  ).toThrow()
})

function qualityReading(
  f: ReturnType<typeof setup>,
  cultivar: NonNullable<TargetReading['cultivar']>
) {
  const target = f.source.fruits.find(
    (fruit) => fruit.plant.species === cultivar
  )
  if (!target) throw new Error('Missing declared crop fixture')
  return {
    ...f.reading(),
    targetId: target.id,
    cultivar,
    quality: {
      spines: 'intact' as const,
      calyx: 'intact' as const,
      pedicel: 'intact' as const,
      contactDamage: 'none-observed' as const
    }
  } as TargetReading
}

it('assesses declared cucumber requirements without certifying physical or post-pick quality', () => {
  const f = setup(),
    input = qualityReading(f, 'cucumber-1914')
  input.quality.calyx = 'lost'
  input.quality.pedicel = null
  const result = f.observations.assessQuality(f.context(), input)
  expect(result.requirements).toEqual({
    spines: 'satisfied',
    calyx: 'not-applicable',
    pedicel: 'not-applicable',
    contactDamage: 'satisfied'
  })
  expect(result.status).toBe('satisfied')
  expect(result.physicalIntegrity).toBe('unverified')
  expect(result.observation.reading).toEqual(input)
  expect(result).not.toHaveProperty('retained')
  expect(result).not.toHaveProperty('placementAllowed')
  expect(Object.isFrozen(result.requirements)).toBe(true)
  expect(Object.isFrozen(result)).toBe(true)
  input.quality.spines = 'lost'
  expect(result.observation.reading.quality.spines).toBe('intact')
})

it('keeps tomato calyx and distal pedicel independent of stem recognition and contact damage', () => {
  const f = setup(),
    input = qualityReading(f, 'tomato-yu-nu')
  input.stem = {
    targetId: input.targetId,
    recognized: true,
    cutSite: [0, 0, 0]
  }
  input.quality.spines = 'lost'
  input.quality.pedicel = 'lost'
  input.quality.contactDamage = null
  const result = f.observations.assessQuality(f.context(), input)
  expect(result.status).toBe('not-satisfied')
  expect(result.requirements).toEqual({
    spines: 'not-applicable',
    calyx: 'satisfied',
    pedicel: 'not-satisfied',
    contactDamage: 'unknown'
  })
  input.quality.pedicel = null
  expect(f.observations.assessQuality(f.context(), input).status).toBe(
    'unknown'
  )
  input.quality.pedicel = 'intact'
  input.quality.calyx = 'lost'
  expect(
    f.observations.assessQuality(f.context(), input).requirements.calyx
  ).toBe('not-satisfied')
})

it('retains unknown crop requirements and separate contact failures without hidden-truth inference', () => {
  const f = setup(),
    input = qualityReading(f, 'cucumber-1914')
  input.quality.contactDamage = 'observed'
  const damaged = f.observations.assessQuality(f.context(), input)
  expect(damaged.status).toBe('not-satisfied')
  expect(damaged.requirements.spines).toBe('satisfied')
  expect(damaged.requirements.contactDamage).toBe('not-satisfied')
  input.cultivar = null
  const unknown = f.observations.assessQuality(f.context(), input)
  expect(unknown.status).toBe('unknown')
  expect(unknown.requirements).toEqual({
    spines: 'unknown',
    calyx: 'unknown',
    pedicel: 'unknown',
    contactDamage: 'not-satisfied'
  })
  input.cultivar = 'cucumber-1914'
  input.quality.contactDamage = null
  input.quality.spines = null
  input.approach = 'clear'
  input.extraction = 'clear'
  expect(f.observations.assessQuality(f.context(), input).status).toBe(
    'unknown'
  )
})

it('assesses one detached current reading with no query, source or session work', () => {
  const f = setup(true),
    input = qualityReading(f, 'tomato-yu-nu'),
    snapshot = f.session.getSnapshot(),
    context = f.context()
  let reads = 0
  Object.defineProperty(input, 'observedAt', {
    enumerable: true,
    get: () => (++reads === 1 ? 0 : NaN)
  })
  const admit = vi.spyOn(f.observations, 'admit'),
    ray = vi.spyOn(RayQueries.prototype, 'query'),
    prepare = vi.spyOn(f.query, 'prepare'),
    crop = vi.spyOn(crops, 'createCropModels'),
    model = vi.spyOn(models, 'createRobotModel')
  try {
    const result = f.observations.assessQuality(context, input)
    expect(result.physicalIntegrity).toBe('unverified')
    expect(admit).toHaveBeenCalledTimes(1)
    expect(reads).toBe(1)
    expect(f.session.getSnapshot()).toBe(snapshot)
    expect(Object.isFrozen(context)).toBe(false)
    expect(ray).not.toHaveBeenCalled()
    expect(prepare).not.toHaveBeenCalled()
    expect(crop).not.toHaveBeenCalled()
    expect(model).not.toHaveBeenCalled()
  } finally {
    admit.mockRestore()
    ray.mockRestore()
    prepare.mockRestore()
    crop.mockRestore()
    model.mockRestore()
  }
  expect(() =>
    f.observations.assessQuality({ ...context }, f.reading())
  ).toThrow()
  f.session.advance(snapshot.generation, 5)
  f.renew()
  expect(
    f.observations.assessQuality(f.context(), qualityReading(f, 'tomato-yu-nu'))
      .status
  ).toBe('satisfied')
  f.session.advance(snapshot.generation, 10)
  f.renew()
  expect(() => f.observations.assessQuality(f.context(), f.reading())).toThrow()
  f.session.cancel(snapshot.generation)
  f.renew()
  expect(() =>
    f.observations.assessQuality(f.context(), {
      ...f.reading(),
      validUntil: 100
    })
  ).toThrow()
})

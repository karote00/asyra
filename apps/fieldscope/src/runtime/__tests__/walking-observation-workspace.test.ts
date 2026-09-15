import { expect, it } from 'vitest'
import { SiteGeometry } from '../../render-app/site-geometry'
import { buildSiteMeshes } from '../../render-app/site-projection'
import { DEFAULT_CONFIGURATION } from '../../domain/farm-configuration'
import { prepareSceneDemand } from '../../simulation/scene-demand'
import { createSyntheticWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import { createWalkingRuntimeSelection } from '../../domain/walking-runtime-selection'
import { WalkingOperatingOwner } from '../walking-operating-workspace'
import {
  createWalkingObservationWorkspace,
  type WalkingObservationScenario
} from '../walking-observation-workspace'

function setup() {
  const site = new SiteGeometry()
  const farm = { ...DEFAULT_CONFIGURATION, length: 2.2 }
  const scene = site.prepareScene(farm, buildSiteMeshes(farm, site))
  const demand = prepareSceneDemand(farm, scene, {
    version: 1,
    route: {
      kind: 'soil-strip',
      bay: 0,
      stripId: 'strip-3',
      from: 0.25,
      until: 1.9
    },
    evidence: {
      kind: 'synthetic',
      id: 'workspace-optical-survey',
      label: 'Synthetic optical survey'
    },
    growth: { kind: 'bounded', coverage: 'complete', volumes: [] },
    clearanceMargin: { kind: 'bounded', metres: 0 }
  })
  if (!demand.route) throw new Error('Missing route')
  const operating = new WalkingOperatingOwner(
    () => demand,
    (value) => value === demand
  )
  const report = operating.apply(
    createWalkingRuntimeSelection(
      createSyntheticWalkingRobotDefinition({
        definitionId: 'walking-optical-workspace'
      })
    )
  )
  const workspace = createWalkingObservationWorkspace({
    getOperating: () => operating.read(),
    isCurrentOperating: (value) => operating.isCurrent(value),
    getDemand: () => demand,
    isCurrentDemand: (value) => value === demand,
    getScene: () => scene,
    isCurrentScene: (value) => site.isCurrentScene(value),
    screen: operating.transitScreen
  })
  const volume = demand.route.volume
  const x = (volume.min[0] + volume.max[0]) / 2
  const y = (volume.max[1] - volume.min[1]) / 24
  const z = (fraction: number) =>
    volume.min[2] + (volume.max[2] - volume.min[2]) * fraction
  const config: WalkingObservationScenario = {
    format: 'walking-observation-scenario/1',
    id: 'workspace-camera',
    assumption: 'Explicit synthetic camera, optics and source plant pose',
    validFrom: 0,
    validUntil: 10,
    camera: {
      bodyId: 'base',
      localPose: { position: [x, y, z(0.4)], rotation: [0, 0, 0, 1] },
      halfWidthSlope: 1,
      halfHeightSlope: 1,
      maxDistance: 2
    },
    optics: {
      illumination: 0.875,
      filmTransmission: 0.875,
      weatherTransmission: 0.875,
      shadowFraction: 0.125,
      glare: 0.0625
    },
    model: {
      format: 'synthetic-action-volume/1',
      minSignal: 0.5,
      maxGlare: 0.125,
      maxCandidates: 64,
      maxRays: 16,
      maxActors: 64
    },
    leaves: 'source-pose',
    fruits: 'all-attached'
  }
  const world = {
    format: 'synthetic-dynamic-scene/1' as const,
    assumption: 'Covered finite dynamic source',
    domain: volume,
    validFrom: 0,
    validUntil: 10,
    actors: []
  }
  const request = {
    actionId: 'workspace-local-action',
    now: 1,
    validUntil: 2,
    actionBounds: {
      min: [x - 0.01, y - 0.01, z(0.75)] as const,
      max: [x + 0.01, y + 0.01, z(0.8)] as const
    }
  }
  const actor = {
    trackId: 'tracked-person',
    kind: 'person' as const,
    states: [
      {
        from: 0,
        until: 10,
        motion: 'stationary' as const,
        bounds: {
          min: [x - 0.005, y - 0.005, z(0.55)] as const,
          max: [x + 0.005, y + 0.005, z(0.6)] as const
        }
      }
    ]
  }
  return { workspace, operating, report, config, world, request, actor }
}

it('walking observation workspace rejects missing and malformed scenarios before changing current admitted inputs', () => {
  const f = setup()
  expect(f.workspace.observe(f.request)).toEqual({
    status: 'unavailable',
    reason: 'missing-walking-observation-scenario'
  })
  f.workspace.configure(f.config, f.world)
  const normal = f.workspace.observe(f.request)
  if (normal.status !== 'available') throw new Error(normal.reason)
  expect(normal.observation.coverage).toBe('complete-empty')
  expect(() =>
    f.workspace.configure(
      { ...f.config, model: { ...f.config.model, maxRays: 65 } },
      f.world
    )
  ).toThrow()
  expect(f.workspace.isCurrent(normal.observation)).toBe(true)
  expect(() =>
    f.workspace.configure(
      {
        ...f.config,
        camera: {
          ...f.config.camera,
          localPose: { ...f.config.camera.localPose, rotation: [0, 0, 0, 2] }
        }
      },
      f.world
    )
  ).toThrow()
  expect(() =>
    f.workspace.configure(
      { ...f.config, safe: true } as typeof f.config,
      f.world
    )
  ).toThrow()
  expect(() =>
    f.workspace.configure(
      {
        ...f.config,
        camera: { ...f.config.camera, bodyId: 'foreign' }
      } as unknown as typeof f.config,
      f.world
    )
  ).toThrow()
  expect(f.workspace.isCurrent(normal.observation)).toBe(true)
  expect(Object.isFrozen(normal.observation.context.sensorIdentity)).toBe(true)
  const invalidDynamic = { ...f.world, validUntil: -1 }
  expect(() => f.workspace.configure(f.config, invalidDynamic)).toThrow()
  expect(f.workspace.isCurrent(normal.observation)).toBe(true)
  expect(
    f.workspace.observe({ ...f.request, now: 11, validUntil: 12 }).status
  ).toBe('unavailable')
  expect(f.workspace.isCurrent(normal.observation)).toBe(false)
  f.workspace.close()
  expect(f.workspace.get()).toBeUndefined()
  expect(() => f.workspace.configure(f.config, f.world)).toThrow()
  expect(() => f.workspace.observe(f.request)).toThrow()
  f.operating.clear()
})

it('walking observation workspace never promotes incomplete optics dynamics or bounded work into complete-empty', () => {
  const f = setup()
  const observe = () => {
    const result = f.workspace.observe(f.request)
    if (result.status !== 'available') throw new Error(result.reason)
    expect(result.observation.coverage).not.toBe('complete-empty')
    return result
  }
  for (const optics of [
    { ...f.config.optics, illumination: null },
    { ...f.config.optics, filmTransmission: null },
    { ...f.config.optics, weatherTransmission: null },
    { ...f.config.optics, shadowFraction: null },
    { ...f.config.optics, glare: null },
    { ...f.config.optics, illumination: 0 },
    { ...f.config.optics, glare: 1 }
  ]) {
    f.workspace.configure({ ...f.config, optics }, f.world)
    expect(observe().observation.reliability.status).not.toBe('reliable')
  }
  f.workspace.configure(f.config, { ...f.world, validFrom: 2 })
  expect(observe().observation.reasons).toContain('outside-source-time')
  f.workspace.configure(f.config, {
    ...f.world,
    domain: f.request.actionBounds
  })
  expect(observe().observation.reasons).toContain('outside-dynamic-domain')
  f.workspace.configure(f.config, {
    ...f.world,
    actors: [{ ...f.actor, states: [{ ...f.actor.states[0], from: 2 }] }]
  })
  expect(observe().observation.reasons).toContain('actor-timeline-gap')
  for (const budget of ['maxCandidates', 'maxRays', 'maxActors'] as const) {
    f.workspace.configure(
      { ...f.config, model: { ...f.config.model, [budget]: 0 } },
      { ...f.world, actors: [f.actor] }
    )
    expect(observe().observation.unvisited).toBeGreaterThan(0)
  }
  f.workspace.configure(
    { ...f.config, camera: { ...f.config.camera, maxDistance: 0.001 } },
    f.world
  )
  expect(observe().observation.reasons).toContain('incomplete-frustum-or-range')
  f.workspace.close()
  f.operating.clear()
})

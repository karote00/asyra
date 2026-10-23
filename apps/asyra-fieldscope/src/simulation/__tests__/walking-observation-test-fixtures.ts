import { vi } from 'vitest'
import { DEFAULT_CONFIGURATION } from '../../domain/farm-configuration'
import { readSpatialDescriptor } from '../../engine/spatial-contract'
import { readSourceRegions } from '../../domain/source-occupancy'
import {
  SiteGeometry,
  type PreparedScene
} from '../../render-app/site-geometry'
import {
  buildSiteMeshes,
  type SiteMesh
} from '../../render-app/site-projection'
import {
  prepareSceneDemand,
  prepareSceneObservationSpace,
  SceneDemandSourceBoundsOwner
} from '../scene-demand'
import { WalkingOperatingOwner } from '../../runtime/walking-operating-workspace'
import { createWalkingRuntimeSelection } from '../../domain/walking-runtime-selection'
import { createSyntheticWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import { QueryGeometry } from '../geometry'
import { SyntheticDynamicSceneOwner } from '../synthetic-dynamic-scene'
import { WalkingActionObservations } from '../observations'

export type WalkingObservationSceneKind = 'actual-site' | 'bounded-source'

/** Ordinary controls use two admitted original sheets; profiles retain the complete authored site. */
export function walkingObservationScene(kind: WalkingObservationSceneKind) {
  const farm = { ...DEFAULT_CONFIGURATION, length: 2.2 }
  let scene: PreparedScene
  let isCurrentScene: (value: PreparedScene) => boolean
  if (kind === 'actual-site') {
    const site = new SiteGeometry()
    scene = site.prepareScene(farm, buildSiteMeshes(farm, site))
    isCurrentScene = (value) => site.isCurrentScene(value)
  } else {
    const descriptor = readSpatialDescriptor({
      kind: 'mesh',
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      shape: {
        kind: 'triangles',
        positions: [-0.1, -0.1, 0, 0.1, -0.1, 0, 0, 0.1, 0],
        indices: [0, 1, 2]
      },
      instances: [
        { position: [1, 0.2, 1.2], yaw: 0 },
        { position: [8, 0.2, 1.2], yaw: 0 }
      ],
      color: 0,
      opacity: 1,
      wireframe: false,
      selectable: false
    })
    if (descriptor.kind !== 'mesh') throw new Error('Missing canonical sheet')
    const mesh: SiteMesh = Object.freeze({
      id: 'bounded-observation-sheet',
      layer: 'supports',
      visible: true,
      descriptor,
      regions: readSourceRegions(
        [{ id: 'sheet', kind: 'sheet', indexStart: 0, indexCount: 3 }],
        3
      )
    })
    scene = Object.freeze({
      revision: 1,
      meshes: Object.freeze([mesh]),
      plants: Object.freeze([]),
      fruits: Object.freeze([])
    })
    isCurrentScene = (value) => value === scene
  }
  const sourceOwner = new SceneDemandSourceBoundsOwner()
  const demand = prepareSceneDemand(
    farm,
    scene,
    {
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
        id: 'action-survey',
        label: 'Synthetic route'
      },
      growth: { kind: 'bounded', coverage: 'complete', volumes: [] },
      clearanceMargin: { kind: 'bounded', metres: 0 }
    },
    sourceOwner
  )
  if (!demand.route) throw new Error('Missing source route')
  return { farm, scene, isCurrentScene, sourceOwner, demand }
}

export function walkingActionFixture(kind: WalkingObservationSceneKind) {
  const f = walkingObservationScene(kind)
  if (!f.demand.route) throw new Error('Missing source route')
  const operating = new WalkingOperatingOwner(
    () => f.demand,
    (value) => value === f.demand
  )
  const report = operating.apply(
    createWalkingRuntimeSelection(
      createSyntheticWalkingRobotDefinition({
        definitionId: 'walking-observation-kernel'
      })
    )
  )
  if (report.status === 'legacy-view') throw new Error('Missing walking source')
  const receipt = Object.freeze({
    format: 'walking-observation-geometry/1' as const,
    scene: f.scene,
    demand: f.demand,
    source: report.source
  })
  const query = new QueryGeometry({
    isCurrentWalkingReceipt: (value) => value === receipt,
    isCurrentScene: f.isCurrentScene,
    isCurrentDemand: (value) => value === f.demand,
    isCurrentWalkingSource: (value) => operating.sourceOwner.isCurrent(value)
  })
  const source = query.prepareWalking(receipt)
  const context = Object.freeze({
    report,
    demand: f.demand,
    source: report.source,
    geometry: source,
    generation: 1,
    runId: 'walking-observation-kernel',
    now: 0,
    sensorIdentity: Object.freeze({})
  })
  let space: ReturnType<typeof prepareSceneObservationSpace> | undefined
  const prepareSpace = vi.fn(
    () => (space ??= prepareSceneObservationSpace(f.demand, f.sourceOwner))
  )
  const dynamics = new SyntheticDynamicSceneOwner()
  const world = {
    format: 'synthetic-dynamic-scene/1' as const,
    assumption: 'Explicit finite actors',
    domain: f.demand.route.volume,
    validFrom: 0,
    validUntil: 10,
    actors: []
  }
  dynamics.prepare(world)
  const observations = new WalkingActionObservations(query, {
    prepareObservationSpace: prepareSpace,
    isCurrentObservationSpace: (value) => value === space,
    isCurrentContext: (value) =>
      value === context && operating.isCurrent(report),
    screen: operating.transitScreen,
    dynamics
  })
  const x = (world.domain.min[0] + world.domain.max[0]) / 2
  const input = {
    source: 'synthetic-action-volume/1' as const,
    actionId: 'local-action',
    generation: 1,
    runId: context.runId,
    id: 'reading-1',
    assumption: 'Declared synthetic camera rays',
    observedAt: 0,
    validFrom: 0,
    validUntil: 10,
    actionBounds: {
      min: [x - 0.01, 0.12, 1.5] as const,
      max: [x + 0.01, 0.14, 1.55] as const
    },
    camera: {
      pose: {
        position: [x, 0.13, 1] as const,
        rotation: [0, 0, 0, 1] as const
      },
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
      format: 'synthetic-action-volume/1' as const,
      minSignal: 0.5,
      maxGlare: 0.125,
      maxCandidates: 64,
      maxRays: 16,
      maxActors: 64
    },
    leaves: 'source-pose' as const,
    fruits: 'all-attached' as const
  }
  return {
    ...f,
    observations,
    context,
    input,
    operating,
    prepareSpace,
    getSpace: () => space,
    dynamics,
    world
  }
}

import { prepareSceneObservationSpace } from '../../simulation/scene-demand'
import { createSyntheticWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import { createWalkingRuntimeSelection } from '../../domain/walking-runtime-selection'
import { WalkingOperatingOwner } from '../walking-operating-workspace'
import {
  createWalkingObservationWorkspace,
  type WalkingObservationScenario
} from '../walking-observation-workspace'

import {
  walkingObservationScene,
  type WalkingObservationSceneKind
} from '../../simulation/__tests__/walking-observation-test-fixtures'

export function walkingObservationWorkspaceFixture(
  kind: WalkingObservationSceneKind,
  definition = createSyntheticWalkingRobotDefinition({
    definitionId: 'walking-optical-workspace'
  })
) {
  const { scene, demand, sourceOwner, isCurrentScene } =
    walkingObservationScene(kind)
  let observationSpace:
    ReturnType<typeof prepareSceneObservationSpace> | undefined
  if (!demand.route) throw new Error('Missing route')
  const operating = new WalkingOperatingOwner(
    () => demand,
    (value) => value === demand
  )
  const report = operating.apply(createWalkingRuntimeSelection(definition))
  const workspace = createWalkingObservationWorkspace({
    prepareObservationSpace: (value) => {
      if (value !== demand) throw new Error('Foreign demand')
      return (observationSpace ??= prepareSceneObservationSpace(
        demand,
        sourceOwner
      ))
    },
    isCurrentObservationSpace: (value) => value === observationSpace,
    getSourceWork: () => sourceOwner.work,
    getOperating: () => operating.read(),
    isCurrentOperating: (value) => operating.isCurrent(value),
    getDemand: () => demand,
    isCurrentDemand: (value) => value === demand,
    getScene: () => scene,
    isCurrentScene,
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
  return {
    workspace,
    operating,
    report,
    config,
    world,
    request,
    actor,
    sourceOwner
  }
}

import { SiteGeometry } from '../../render-app/site-geometry'
import { RobotProjection } from '../../render-app/robot-projection'
import type { SiteMesh } from '../../render-app/site-projection'
import {
  DEFAULT_CONFIGURATION,
  type FarmConfiguration
} from '../../domain/farm-configuration'
import {
  DEFAULT_ROBOT,
  assessRobotDesign,
  validateRobot
} from '../../domain/robot-configuration'
import { REST_JOINTS } from '../../domain/robot-kinematics'
import { QueryGeometry, type GeometryReceipt } from '../geometry'
import {
  SurfaceQueries,
  type SurfaceBatch,
  type SurfaceSweepBatch,
  type SurfaceCoverageBatch
} from '../collision'

export const farm = {
  ...DEFAULT_CONFIGURATION,
  strips: [{ id: 'soil', kind: 'soil' as const, width: 6.3 }]
}
export const robot = new RobotProjection()
robot.update(assessRobotDesign(validateRobot(DEFAULT_ROBOT), farm))

export function setup(
  meshes: SiteMesh[],
  configuration: FarmConfiguration = farm,
  site = new SiteGeometry()
) {
  const scene = site.prepareScene(configuration, meshes)
  const receipt: GeometryReceipt = Object.freeze({
    revision: 1,
    scene,
    robot: robot.getSource(),
    dock: robot.getDockSource()
  })
  const owner = new QueryGeometry({
    isCurrentReceipt: (value) => value === receipt,
    isCurrentScene: site.isCurrentScene.bind(site),
    isCurrentRobot: robot.isCurrentSource.bind(robot),
    isCurrentDock: robot.isCurrentDockSource.bind(robot)
  })
  return {
    site,
    owner,
    source: owner.prepare(receipt),
    query: new SurfaceQueries(owner)
  }
}
export function batch(): SurfaceBatch {
  return {
    source: 'synthetic',
    time: 1,
    validFrom: 0,
    validUntil: 10,
    leaves: 'source-pose',
    fruits: 'all-attached',
    robot: {
      base: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
      joints: { ...REST_JOINTS }
    },
    pairs: [
      {
        first: { mesh: 0, instance: 0, triangle: 0 },
        second: { mesh: 1, instance: 0, triangle: 0 }
      }
    ]
  }
}

export function sweep(): SurfaceSweepBatch {
  const initial = batch()
  return {
    source: initial.source,
    from: 1,
    until: 3,
    validFrom: 0,
    validUntil: 10,
    robot: initial.robot,
    leaves: 'source-pose-throughout',
    fruits: 'all-attached-throughout',
    pairs: initial.pairs.map((pair) => ({
      ...pair,
      firstTranslation: [0, 0, 2],
      secondTranslation: [0, 0, 0]
    }))
  }
}

export function coverage(): SurfaceCoverageBatch {
  const input = sweep()
  return {
    source: input.source,
    from: input.from,
    until: input.until,
    validFrom: input.validFrom,
    validUntil: input.validUntil,
    robot: input.robot,
    leaves: input.leaves,
    fruits: input.fruits,
    displacement: [0, 0, 2],
    held: 'empty',
    maxTrianglePairs: 100
  }
}

export function expectedInventory(source: ReturnType<typeof setup>['source']) {
  const robots = source.meshes.filter((mesh) => mesh.kind === 'robot'),
    environment = source.meshes.filter((mesh) => mesh.kind !== 'robot')
  const triangles = (mesh: (typeof robots)[number]) => {
    if (mesh.shape.kind !== 'triangles')
      throw new Error('Invalid fixture source')
    return mesh.shape.indices.length / 3
  }
  let meshPairs = 0,
    trianglePairs = 0,
    environmentInstances = 0
  for (const mesh of environment)
    environmentInstances += mesh.descriptor?.instances?.length ?? 1
  for (let i = 0; i < robots.length; i++) {
    for (const mesh of environment) {
      const instances = mesh.descriptor?.instances?.length ?? 1
      meshPairs += instances
      trianglePairs += triangles(robots[i]) * triangles(mesh) * instances
    }
    for (let j = i + 1; j < robots.length; j++) {
      meshPairs++
      trianglePairs += triangles(robots[i]) * triangles(robots[j])
    }
  }
  return {
    robotParts: robots.length,
    environmentInstances,
    meshPairs,
    trianglePairs
  }
}

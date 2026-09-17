import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  readSpatialDescriptor,
  readSpatialShape
} from '../../engine/spatial-contract'
import {
  DEFAULT_CONFIGURATION,
  validateConfiguration,
  type FarmConfiguration
} from '../../domain/farm-configuration'
import { transformRobotPoint } from '../../domain/robot-kinematics'
import { readSourceRegions } from '../../domain/source-occupancy'
import {
  validateSceneDemandConfiguration,
  type SceneDemandConfiguration
} from '../../domain/scene-demand-configuration'
import {
  type CropGeometry,
  type PreparedScene
} from '../../render-app/site-geometry'
import { type SiteMesh } from '../../render-app/site-projection'
import {
  prepareSceneDemand,
  joinSceneDemandBounds,
  SceneDemandSourceBoundsOwner,
  prepareSceneObservationSpace
} from '../scene-demand'
import * as rayQuery from '../ray-query'

afterEach(() => vi.restoreAllMocks())

const synthetic = (
  patch: Partial<SceneDemandConfiguration> = {}
): SceneDemandConfiguration => ({
  version: 1,
  route: {
    kind: 'soil-strip',
    bay: 0,
    stripId: 'strip-3',
    from: 0.25,
    until: 1.25
  },
  evidence: {
    kind: 'synthetic',
    id: 'survey-fixture',
    label: 'Synthetic source case'
  },
  growth: { kind: 'bounded', coverage: 'complete', volumes: [] },
  clearanceMargin: { kind: 'bounded', metres: 0 },
  ...patch
})

const emptyScene = (): PreparedScene =>
  Object.freeze({
    revision: 1,
    meshes: Object.freeze([]),
    plants: Object.freeze([]),
    fruits: Object.freeze([])
  })

describe('scene demand preparation', () => {
  it('observation inventory source owner does no work for unknown routes and reuses issued sources', () => {
    const owner = new SceneDemandSourceBoundsOwner()
    const farm = validateConfiguration(DEFAULT_CONFIGURATION)
    const scene = emptyScene()
    const demand = prepareSceneDemand(
      farm,
      scene,
      synthetic({ route: { kind: 'unknown' } }),
      owner
    )
    expect(demand.status).toBe('unknown')
    expect(Object.values(owner.work).every((v) => v === 0)).toBe(true)
    const observation = prepareSceneObservationSpace(demand, owner)
    expect(observation.status).toBe('unknown')
    expect(Object.values(owner.work).every((v) => v === 0)).toBe(true)
    owner.close()
  })
  it('observation inventory hull streams more bounds than the JavaScript argument limit', () => {
    const bound = { min: [-1, -2, -3] as const, max: [1, 2, 3] as const }
    const values = Array.from({ length: 200000 }, () => bound)
    const result = joinSceneDemandBounds([
      ...values,
      { min: [-4, -5, -6], max: [7, 8, 9] }
    ])
    expect(result).toEqual({ min: [-4, -5, -6], max: [7, 8, 9] })
    expect(Object.isFrozen(result)).toBe(true)
  })
  it('observation inventory admits off-route original sources without clipping its finite world domain', () => {
    const farm = validateConfiguration({
      ...DEFAULT_CONFIGURATION,
      length: 2.2
    })
    const shape = readSpatialShape({
      kind: 'triangles',
      positions: [0, 0, 0, 0.1, 0, 0, 0, 0.1, 0],
      indices: [0, 1, 2]
    })
    const regions = readSourceRegions(
      [{ id: 'sensor-source', kind: 'sheet', indexStart: 0, indexCount: 3 }],
      3
    )
    const make = (
      id: string,
      position: readonly [number, number, number]
    ): SiteMesh => ({
      id,
      layer: 'supports',
      visible: true,
      regions,
      descriptor: readSpatialDescriptor({
        kind: 'mesh',
        position,
        rotation: [0, 0, 0, 1],
        shape,
        color: 0,
        opacity: 1,
        wireframe: false,
        selectable: false
      }) as SiteMesh['descriptor']
    })
    const near = make('near', [2, 0.5, 0.5]),
      far = make('far', [40, 12, 10])
    const scene = Object.freeze({
      ...emptyScene(),
      meshes: Object.freeze([near, far])
    })
    const owner = new SceneDemandSourceBoundsOwner()
    const demand = prepareSceneDemand(farm, scene, synthetic(), owner)
    const routeSource = demand.freePassage.exclusions.find(
      (v) => v.kind === 'source'
    )
    const before = owner.work
    const observation = prepareSceneObservationSpace(demand, owner)
    expect(observation.demand).toBe(demand)
    expect(observation.sources[0]).toBe(routeSource)
    expect(observation.work.localBounds).toBe(0)
    expect(observation.work.descriptorFrames).toBe(0)
    expect(observation.work.instanceFrames).toBe(0)
    expect(observation.work.wholeWorldBounds).toBe(0)
    expect(observation.work.regionWorldBounds).toBe(1)
    expect(observation.work.canonicalSources).toBe(1)
    expect(owner.work.inventoryBuilds - before.inventoryBuilds).toBe(1)
    const repeated = prepareSceneObservationSpace(demand, owner)
    expect(repeated.inventory).toBe(observation.inventory)
    expect(repeated.work).toEqual({
      ...observation.work,
      sourceKeysEnumerated: 0,
      regionWorldBounds: 0,
      canonicalSources: 0,
      envelopeCorners: 0,
      membershipVisits: 0,
      inventoryBuilds: 0,
      inventoryReuses: 1
    })
    const changed = prepareSceneDemand(
      farm,
      scene,
      synthetic({
        clearanceMargin: { kind: 'bounded', metres: 0.01 }
      }),
      owner
    )
    const changedObservation = prepareSceneObservationSpace(changed, owner)
    expect(changedObservation.demand).toBe(changed)
    expect(changedObservation.inventory).toBe(observation.inventory)
    expect(changedObservation.sources).toBe(observation.sources)
    const freshOwner = new SceneDemandSourceBoundsOwner()
    const fresh = prepareSceneObservationSpace(demand, freshOwner)
    expect(fresh.domain).toEqual(observation.domain)
    expect(fresh.sources).toEqual(observation.sources)
    expect(observation.status).toBe('complete')
    expect(observation.provenance).toBe('w1-canonical-obstacles/1')
    expect(observation.sources.map((v) => v.mesh)).toEqual([near, far])
    expect(
      observation.sources.every(
        (v) =>
          v.region === regions[0] &&
          v.transform.descriptor === v.mesh.descriptor
      )
    ).toBe(true)
    expect(
      demand.freePassage.exclusions.filter((v) => v.kind === 'source')
    ).toEqual([observation.sources[0]])
    expect(observation.domain?.min[1]).toBe(-farm.height)
    expect(observation.domain?.max[0]).toBeGreaterThanOrEqual(40.1)
    expect(observation.domain?.max[1]).toBeGreaterThanOrEqual(12.1)
    expect(Object.isFrozen(observation.sources)).toBe(true)
    expect(demand.work.sourcePreparation.canonicalSources).toBe(1)
    const unknownRoute = prepareSceneDemand(
      farm,
      scene,
      synthetic({ route: { kind: 'unknown' } })
    )
    const unknownObservation = prepareSceneObservationSpace(unknownRoute, owner)
    expect(unknownObservation.status).toBe('unknown')
    expect(unknownObservation.sources.length).toBe(0)
    const unsupported = prepareSceneDemand(
      farm,
      {
        ...scene,
        meshes: [
          near,
          { ...far, layer: 'future-physical-layer' as SiteMesh['layer'] }
        ]
      },
      synthetic()
    )
    const unsupportedObservation = prepareSceneObservationSpace(
      unsupported,
      owner
    )
    expect(unsupportedObservation.status).toBe('unknown')
    expect(unsupportedObservation.domain).toBeNull()
    const missing = prepareSceneDemand(
      farm,
      { ...scene, meshes: [near, { ...far, regions: [] }] },
      synthetic()
    )
    const missingObservation = prepareSceneObservationSpace(missing, owner)
    expect(missingObservation.status).toBe('unknown')
    expect(missingObservation.domain).toBeNull()
    owner.close()
    freshOwner.close()
  })

  it('uses outward interval transforms for rotated installed source regions', () => {
    const farm: FarmConfiguration = validateConfiguration({
      ...DEFAULT_CONFIGURATION,
      length: 4,
      strips: [{ id: 'strip-3', kind: 'soil', width: 6.3 }]
    })
    const shape = readSpatialShape({
      kind: 'triangles',
      positions: [
        0.10000000000000002, 0.4, 0.2, 0.9, 1.7, 0.3, 0.2, 0.6,
        1.1000000000000003
      ],
      indices: [0, 1, 2]
    })
    if (shape.kind !== 'triangles') throw new Error('Missing triangle fixture')
    const regions = readSourceRegions(
      [{ id: 'source-face', kind: 'sheet', indexStart: 0, indexCount: 3 }],
      3
    )
    const angle = 0.43
    const descriptor = readSpatialDescriptor({
      kind: 'mesh',
      position: [0.17, 0.11, 0.19],
      rotation: [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)],
      shape,
      instances: [{ position: [1.13, 0.07, 0.41], yaw: -0.37 }],
      color: 0,
      opacity: 1,
      wireframe: false,
      selectable: false
    })
    if (descriptor.kind !== 'mesh') throw new Error('Missing mesh fixture')
    const mesh: SiteMesh = {
      id: 'rotated-source',
      layer: 'supports',
      regions,
      visible: true,
      descriptor
    }
    const scene: PreparedScene = Object.freeze({
      revision: 2,
      meshes: Object.freeze([Object.freeze(mesh)]),
      plants: Object.freeze([]),
      fruits: Object.freeze([])
    })
    const demand = prepareSceneDemand(
      farm,
      scene,
      validateSceneDemandConfiguration(
        synthetic({
          route: {
            kind: 'soil-strip',
            bay: 0,
            stripId: 'strip-3',
            from: 0.1,
            until: 3.5
          }
        })
      )
    )
    const source = demand.freePassage.exclusions.find(
      (exclusion) => exclusion.relation === 'conservative-source-envelope'
    )
    if (!source || source.relation !== 'conservative-source-envelope')
      throw new Error('Missing conservative source envelope')
    const placement = descriptor.instances?.[0]
    if (!placement) throw new Error('Missing installed source fixture')
    const c = Math.cos(placement.yaw),
      s = Math.sin(placement.yaw)
    const points = Array.from(
      { length: shape.positions.length / 3 },
      (_, index) => {
        const offset = index * 3
        const local = [
          shape.positions[offset],
          shape.positions[offset + 1],
          shape.positions[offset + 2]
        ] as const
        const installed = [
          placement.position[0] + c * local[0] + s * local[2],
          placement.position[1] + local[1],
          placement.position[2] - s * local[0] + c * local[2]
        ] as const
        return transformRobotPoint(descriptor, installed)
      }
    )
    for (const point of points)
      point.forEach((value, axis) => {
        expect(source.bounds.min[axis]).toBeLessThanOrEqual(value)
        expect(source.bounds.max[axis]).toBeGreaterThanOrEqual(value)
      })
    expect(
      source.bounds.min.some(
        (value, axis) => value < Math.min(...points.map((point) => point[axis]))
      ) ||
        source.bounds.max.some(
          (value, axis) =>
            value > Math.max(...points.map((point) => point[axis]))
        )
    ).toBe(true)
    expect(source.mesh).toBe(mesh)
    expect(source.region).toBe(regions[0])
    expect(source.instance).toBe(0)
    expect(source.transform.descriptor).toBe(descriptor)
    expect(source.transform.instance).toBe(placement)
  })

  it('classifies by installed fruit centre and reuses one installed transform', () => {
    const farm = validateConfiguration(DEFAULT_CONFIGURATION)
    const shape = readSpatialShape({
      kind: 'triangles',
      positions: [-1, 1, 0.1, 1, 1.2, 0.1, -1, 1.1, 0.2],
      indices: [0, 1, 2]
    })
    if (shape.kind !== 'triangles') throw new Error('Missing target fixture')
    const region = readSourceRegions(
      [
        { id: 'wide-fruit-source', kind: 'sheet', indexStart: 0, indexCount: 3 }
      ],
      3
    )
    const partition = Object.freeze({
      fruitId: 'fruit-source',
      indexStart: 0,
      indexCount: 3
    })
    const source = Object.freeze({
      id: 'fruit-source',
      cutSite: Object.freeze({
        kind: 'unknown' as const,
        reason: 'no-source-cut-boundary' as const
      }),
      center: Object.freeze([0, 1.1, 0.15] as const),
      length: 0.2,
      radius: 0.1,
      maturity: 'ripe' as const,
      occlusion: 'clear' as const,
      ripeness: 1,
      spineCount: 0
    })
    const model: CropGeometry = {
      species: 'cucumber-1914',
      variant: 0,
      fruits: Object.freeze([source]),
      parts: [
        {
          id: 'wide-target-part',
          regions: region,
          distantRegions: region,
          patches: Object.freeze([]),
          distantPatches: Object.freeze([]),
          partitions: Object.freeze([partition]),
          distantPartitions: Object.freeze([]),
          color: 0,
          roughness: 1,
          shape,
          distantShape: shape
        }
      ]
    }
    const plant = Object.freeze({
      id: 'installed-left-plant',
      species: 'cucumber-1914' as const,
      variant: 0,
      bay: 0,
      row: 0,
      side: 'right' as const,
      position: Object.freeze([1.8, 0, 0.5] as const),
      yaw: 0
    })
    const descriptor = readSpatialDescriptor({
      kind: 'mesh',
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      shape,
      instances: [{ position: plant.position, yaw: plant.yaw }],
      color: 0,
      opacity: 1,
      wireframe: false,
      selectable: false
    })
    if (descriptor.kind !== 'mesh') throw new Error('Missing target mesh')
    const mesh: SiteMesh = {
      id: 'wide-target-mesh',
      layer: 'cucumbers',
      regions: region,
      visible: true,
      descriptor
    }
    const fruit = Object.freeze({
      id: `${plant.id}:${source.id}`,
      plant,
      model,
      source,
      position: Object.freeze([1.8, 1.1, 0.65] as const)
    })
    const scene: PreparedScene = Object.freeze({
      revision: 3,
      meshes: Object.freeze([Object.freeze(mesh)]),
      plants: Object.freeze([plant]),
      fruits: Object.freeze([fruit])
    })
    const instanceFrames = vi.spyOn(rayQuery, 'prepareQueryInstanceFrame')
    const demand = prepareSceneDemand(
      farm,
      scene,
      validateSceneDemandConfiguration(
        synthetic({
          growth: {
            kind: 'bounded',
            coverage: 'complete',
            volumes: [
              {
                id: 'plant-growth',
                anchor: { kind: 'plant', plantId: plant.id },
                min: [-0.1, 0, 0],
                max: [0.1, 1.4, 0.2]
              }
            ]
          }
        })
      )
    )
    expect(instanceFrames).toHaveBeenCalledTimes(1)
    instanceFrames.mockRestore()
    expect(demand.targets.left.map(({ id }) => id)).toEqual([fruit.id])
    expect(demand.targets.unassigned).toHaveLength(0)
    expect(demand.targets.left[0].bounds.max[0]).toBeGreaterThan(2.45)
    expect(demand.work.installedTransforms).toBe(1)
    expect(demand.work.descriptorFrames).toBe(1)
    expect(demand.work.localBounds).toBe(3)
    expect(demand.work.sourceIndexVisits).toBe(6)
    expect(demand.targets.left[0].anatomy).toMatchObject({
      support: 'unknown',
      cut: 'unknown',
      reasons: ['support-anatomy-unknown', 'no-source-cut-boundary']
    })
  })

  it('hard-excludes authored growth, keeps source overlap unknown, and blocks drain routes', () => {
    const farm = validateConfiguration(DEFAULT_CONFIGURATION)
    const route = {
      kind: 'soil-strip' as const,
      bay: 0,
      stripId: 'strip-3',
      from: 1,
      until: 2
    }
    const base = synthetic({ route })
    const growth = prepareSceneDemand(
      farm,
      emptyScene(),
      validateSceneDemandConfiguration({
        ...base,
        growth: {
          kind: 'bounded',
          coverage: 'complete',
          volumes: [
            {
              id: 'cover',
              anchor: { kind: 'world' },
              min: [0, -1, 0],
              max: [7, 5, 4]
            }
          ]
        }
      })
    )
    expect(growth.status).toBe('blocked')
    expect(growth.reasons).toContain('growth-covers-route')
    expect(growth.freePassage.exclusions[0].relation).toBe('hard-exclusion')

    const discrete = prepareSceneDemand(
      farm,
      emptyScene(),
      validateSceneDemandConfiguration({
        ...base,
        growth: { kind: 'bounded', coverage: 'discrete', volumes: [] }
      })
    )
    expect(discrete.status).toBe('unknown')
    expect(discrete.reasons).toContain('growth-coverage-discrete')

    const unknownGrowth = prepareSceneDemand(
      farm,
      emptyScene(),
      validateSceneDemandConfiguration({ ...base, growth: { kind: 'unknown' } })
    )
    expect(unknownGrowth.status).toBe('unknown')
    expect(unknownGrowth.reasons).toContain('growth-unknown')

    const missingAnchor = prepareSceneDemand(
      farm,
      emptyScene(),
      validateSceneDemandConfiguration({
        ...base,
        growth: {
          kind: 'bounded',
          coverage: 'complete',
          volumes: [
            {
              id: 'missing-anchor',
              anchor: { kind: 'plant', plantId: 'missing-plant' },
              min: [-0.1, 0, -0.1],
              max: [0.1, 1, 0.1]
            }
          ]
        }
      })
    )
    expect(missingAnchor.status).toBe('unknown')
    expect(missingAnchor.reasons).toContain('growth-anchor-missing')

    const drain = prepareSceneDemand(
      farm,
      emptyScene(),
      validateSceneDemandConfiguration(
        synthetic({
          route: {
            kind: 'soil-strip',
            bay: 0,
            stripId: 'strip-2',
            from: 1,
            until: 2
          }
        })
      )
    )
    expect(drain.status).toBe('blocked')
    expect(drain.reasons).toContain('route-is-channel')
    expect(drain.route).toBeNull()
  })
})

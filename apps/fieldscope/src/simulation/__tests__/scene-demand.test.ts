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
  SiteGeometry,
  type CropGeometry,
  type PreparedScene
} from '../../render-app/site-geometry'
import {
  buildSiteMeshes,
  type SiteMesh
} from '../../render-app/site-projection'
import { prepareSceneDemand } from '../scene-demand'
import * as rayQuery from '../ray-query'
import * as cropSource from '../../domain/crop-models'

afterEach(() => vi.restoreAllMocks())

const installedPoint = (
  local: readonly [number, number, number],
  transform: {
    descriptor: SiteMesh['descriptor']
    instance: NonNullable<SiteMesh['descriptor']['instances']>[number]
  }
) => {
  const { position, yaw } = transform.instance
  const cosine = Math.cos(yaw),
    sine = Math.sin(yaw)
  return transformRobotPoint(transform.descriptor, [
    position[0] + cosine * local[0] + sine * local[2],
    position[1] + local[1],
    position[2] - sine * local[0] + cosine * local[2]
  ])
}

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
  it('derives two-sided target and real height evidence from the completed current scene', () => {
    const generate = vi.spyOn(cropSource, 'createCropModels')
    const farm = validateConfiguration(DEFAULT_CONFIGURATION)
    const geometry = new SiteGeometry()
    const scene = geometry.prepareScene(farm, buildSiteMeshes(farm, geometry))
    const configuration = validateSceneDemandConfiguration(synthetic())
    const demand = prepareSceneDemand(farm, scene, configuration)

    expect(demand.farm).toBe(farm)
    expect(demand.scene).toBe(scene)
    expect(demand.configuration).toBe(configuration)
    expect(demand.evidence).toBe(configuration.evidence)
    expect(demand.route?.stripId).toBe('strip-3')
    if (!demand.route) throw new Error('Missing resolved route')
    expect(demand.route.volume.max[0] - demand.route.volume.min[0]).toBeCloseTo(
      farm.strips[2].width
    )
    expect(demand.targets.left.length).toBeGreaterThan(0)
    expect(demand.targets.right.length).toBeGreaterThan(0)
    expect(
      [...demand.targets.left, ...demand.targets.right].every(
        (target) => target.id === target.fruit.id
      )
    ).toBe(true)
    expect(
      demand.targets.left.every((target) => target.partitions.length > 0)
    ).toBe(true)
    expect(
      demand.targets.right.every((target) => target.partitions.length > 0)
    ).toBe(true)
    expect(demand.reach.left?.high.metres).not.toBe(farm.netTop)
    expect(demand.reach.right?.high.metres).not.toBe(farm.netTop)
    expect(demand.reach.left?.high.targetIds.length).toBeGreaterThan(0)
    const channel = demand.channels.find(
      (candidate) => candidate.stripId === 'strip-2'
    )
    expect(channel?.strip).toBe(farm.strips[1])
    expect(demand.work.siteConfigurations).toBe(1)
    expect(demand.work.layouts).toBe(1)
    expect(demand.freePassage.kind).toBe('axis-aligned-difference')
    const sourceLayers = demand.freePassage.exclusions.flatMap((exclusion) =>
      exclusion.relation === 'conservative-source-envelope'
        ? [exclusion.mesh.layer]
        : []
    )
    expect(sourceLayers).toContain('supports')
    expect(
      sourceLayers.some(
        (layer) => layer === 'cucumbers' || layer === 'tomatoes'
      )
    ).toBe(true)
    expect(
      demand.freePassage.exclusions.some(
        (exclusion) => exclusion.relation === 'conservative-source-envelope'
      )
    ).toBe(true)
    expect(demand.freePassage.status).toBe('unknown')
    expect(demand.freePassage.reasons).toContain('exact-source-query-required')
    expect(demand.status).toBe('ready')
    let patchCount = 0
    for (const target of [...demand.targets.left, ...demand.targets.right]) {
      expect(target.anatomy.support).toBe('complete')
      expect(Object.isFrozen(target.anatomy)).toBe(true)
      expect(Object.isFrozen(target.anatomy.patches)).toBe(true)
      for (const item of target.anatomy.patches) {
        patchCount++
        expect(item.part.patches).toContain(item.patch)
        expect(item.part.regions).toContain(item.patch.source.region)
        expect(item.mesh.descriptor.shape).toBe(item.part.shape)
        expect(item.transform.descriptor).toBe(item.mesh.descriptor)
        expect(item.transform.instance).toBe(
          item.mesh.descriptor.instances?.[item.instance]
        )
        expect(Object.isFrozen(item.patch.source)).toBe(true)
        expect(Object.isFrozen(item.patch.source.ranges)).toBe(true)
        expect(item.patch.source.ranges.every(Object.isFrozen)).toBe(true)
        expect(item.patch.targetFruitId).toBe(target.fruit.source.id)
        const shape = item.part.shape
        if (shape.kind !== 'triangles')
          throw new Error('Missing near triangle source')
        const min = [Infinity, Infinity, Infinity],
          max = [-Infinity, -Infinity, -Infinity]
        for (const range of item.patch.source.ranges)
          for (
            let index = range.indexStart;
            index < range.indexStart + range.indexCount;
            index++
          ) {
            const offset = shape.indices[index] * 3
            const value = installedPoint(
              [
                shape.positions[offset],
                shape.positions[offset + 1],
                shape.positions[offset + 2]
              ],
              item.transform
            )
            for (let axis = 0; axis < 3; axis++) {
              min[axis] = Math.min(min[axis], value[axis])
              max[axis] = Math.max(max[axis], value[axis])
            }
          }
        for (let axis = 0; axis < 3; axis++) {
          expect(item.bounds.min[axis]).toBeLessThanOrEqual(min[axis])
          expect(item.bounds.max[axis]).toBeGreaterThanOrEqual(max[axis])
        }
      }
      if (target.fruit.model.species === 'cucumber-1914') {
        expect(
          target.cutSite?.source.sourceAssumptions?.cucumberCutSite.fraction
        ).toBe(0.5)
        expect(
          Object.isFrozen(
            target.cutSite?.source.sourceAssumptions?.cucumberCutSite.evidence
          )
        ).toBe(true)
      }
      expect(target.anatomy.cut).toBe('complete')
      expect(target.cutSite?.source).toBe(target.fruit.source.cutSite)
      expect(target.cutSite?.transform).toBe(
        target.anatomy.patches.find(
          (item) => item.patch.role === 'plant-pedicel'
        )?.transform
      )
      expect(
        Object.isFrozen(target.cutSite?.source.boundary.sourceVertexIndices)
      ).toBe(true)
    }
    expect(patchCount).toBeGreaterThan(0)
    expect(demand.work.targetPatches).toBe(patchCount)
    expect(generate).toHaveBeenCalledTimes(1)
    for (const model of geometry.cropModels(farm))
      if (model.species === 'tomato-yu-nu')
        expect(
          model.fruits.every(
            (fruit) => fruit.cutSite?.kind === 'synthetic-source-boundary'
          )
        ).toBe(true)
  }, 15000)

  it('reuses admitted botanical source and scans each semantic range once per demand', () => {
    const generate = vi.spyOn(cropSource, 'createCropModels')
    const farm = validateConfiguration({ ...DEFAULT_CONFIGURATION, length: 2 })
    const geometry = new SiteGeometry()
    const scene = geometry.prepareScene(farm, buildSiteMeshes(farm, geometry))
    const configuration = validateSceneDemandConfiguration(synthetic())
    const demand = prepareSceneDemand(farm, scene, configuration)
    if (!demand.route) throw new Error('Missing source route')
    expect(geometry.cropModels(farm)).toBe(geometry.cropModels(farm))
    const repeated = prepareSceneDemand(farm, scene, configuration)
    expect(repeated.targets.left[0].anatomy.patches[0].patch).toBe(
      demand.targets.left[0].anatomy.patches[0].patch
    )
    expect(repeated.work).toEqual(demand.work)
    expect(generate).toHaveBeenCalledTimes(1)
    const withoutPatches: PreparedScene = {
      ...scene,
      fruits: scene.fruits.map((fruit) => ({
        ...fruit,
        model: {
          ...fruit.model,
          parts: fruit.model.parts.map((part) => ({ ...part, patches: [] }))
        }
      }))
    }
    const unknownAnatomy = prepareSceneDemand(
      farm,
      withoutPatches,
      configuration
    )
    expect(unknownAnatomy.status).toBe(demand.status)
    expect(unknownAnatomy.freePassage).toEqual(demand.freePassage)
    const withoutCutBoundary = prepareSceneDemand(
      farm,
      {
        ...scene,
        fruits: scene.fruits.map((fruit) => ({
          ...fruit,
          source: {
            ...fruit.source,
            cutSite: {
              kind: 'unknown' as const,
              reason: 'no-source-cut-boundary' as const
            }
          }
        }))
      },
      configuration
    )
    for (const target of [
      ...withoutCutBoundary.targets.left,
      ...withoutCutBoundary.targets.right
    ]) {
      expect(target.anatomy.support).toBe('complete')
      expect(target.anatomy.cut).toBe('unknown')
      expect(target.anatomy.reasons).toContain('no-source-cut-boundary')
      expect(target.cutSite).toBeUndefined()
    }
    expect(withoutCutBoundary.status).toBe(demand.status)
    expect(withoutCutBoundary.freePassage).toEqual(demand.freePassage)
    const uniqueRanges = new Set<{ indexCount: number }>()
    for (const target of [
      ...demand.targets.left,
      ...demand.targets.right,
      ...demand.targets.unassigned
    ])
      for (const item of target.anatomy.patches)
        item.patch.source.ranges.forEach((range) => uniqueRanges.add(range))
    expect(
      demand.work.sourceIndexVisits - unknownAnatomy.work.sourceIndexVisits
    ).toBe([...uniqueRanges].reduce((sum, range) => sum + range.indexCount, 0))
    expect(demand.work.localBounds - unknownAnatomy.work.localBounds).toBe(
      uniqueRanges.size
    )
    const changed = geometry.cropModels({ ...farm, netTop: farm.netTop - 0.1 })
    expect(changed).not.toBe(geometry.cropModels(farm))
    expect(generate).toHaveBeenCalledTimes(2)
  }, 15000)

  it('binds cut bounds to the exact near descriptor and defers missing synthetic evidence', () => {
    const farm = validateConfiguration({ ...DEFAULT_CONFIGURATION, length: 2 })
    const geometry = new SiteGeometry()
    const meshes = buildSiteMeshes(farm, geometry).map((mesh) => {
      if (mesh.layer !== 'tomatoes') return mesh
      return {
        ...mesh,
        descriptor: readSpatialDescriptor({
          ...mesh.descriptor,
          position: [0.01, 0.02, 0.03],
          rotation: [Math.sin(0.05), 0, 0, Math.cos(0.05)]
        }) as SiteMesh['descriptor']
      }
    })
    const scene = geometry.prepareScene(farm, meshes)
    const configuration = validateSceneDemandConfiguration(
      synthetic({
        route: {
          kind: 'soil-strip',
          bay: 2,
          stripId: 'strip-3',
          from: 0.25,
          until: 1.75
        }
      })
    )
    const demand = prepareSceneDemand(farm, scene, configuration)
    const tomato = [...demand.targets.left, ...demand.targets.right].find(
      (target) => target.cutSite
    )
    if (!tomato?.cutSite)
      throw new Error('Missing admitted tomato cut boundary')
    const cut = tomato.cutSite
    const transformed = installedPoint(cut.source.position, cut.transform)
    transformed.forEach((value, axis) => {
      expect(cut.bounds.min[axis]).toBeLessThanOrEqual(value)
      expect(cut.bounds.max[axis]).toBeGreaterThanOrEqual(value)
    })
    const missing = { ...cut.source }
    Reflect.deleteProperty(missing, 'evidence')
    const noEvidence = prepareSceneDemand(
      farm,
      {
        ...scene,
        fruits: scene.fruits.map((fruit) =>
          fruit.id === tomato.id
            ? {
                ...fruit,
                source: { ...fruit.source, cutSite: missing }
              }
            : fruit
        )
      },
      configuration
    )
    const target = [
      ...noEvidence.targets.left,
      ...noEvidence.targets.right
    ].find((item) => item.id === tomato.id)
    if (!target) throw new Error('Missing admitted target fixture')
    expect(target.anatomy.support).toBe('complete')
    expect(target.anatomy.cut).toBe('unknown')
    expect(target.anatomy.reasons).toContain('cut-anatomy-unknown')
    expect(target.cutSite).toBeUndefined()
    expect(noEvidence.status).toBe(demand.status)
  }, 15000)

  it.each([
    'foreign-region',
    'wrong-owner',
    'missing-target',
    'invalid-ring'
  ] as const)(
    'rejects malformed canonical botanical references: %s',
    (failure) => {
      const models = cropSource.createCropModels({ netTop: 3, netBottom: 0.45 })
      const model = models.find(
        (candidate) => candidate.species === 'tomato-yu-nu'
      )
      if (!model) throw new Error('Missing cultivar fixture')
      const stems = model.parts.find((part) => part.id === 'stems')
      if (!stems) throw new Error('Missing stems fixture')
      const patch = stems.patches.find((item) => item.role === 'plant-pedicel')
      if (!patch) throw new Error('Missing plant-side patch fixture')
      if (failure === 'foreign-region')
        stems.patches = stems.patches.map((item) =>
          item === patch
            ? {
                ...item,
                source: { ...item.source, region: { ...item.source.region } }
              }
            : item
        )
      if (failure === 'wrong-owner')
        stems.patches = stems.patches.map((item) =>
          item === patch ? { ...item, owner: 'target-fruit' } : item
        )
      if (failure === 'missing-target')
        stems.patches = stems.patches.map((item) =>
          item === patch ? { ...item, targetFruitId: 'missing-fruit' } : item
        )
      if (failure === 'invalid-ring') {
        const cut = model.fruits[0].cutSite
        if (cut?.kind !== 'synthetic-source-boundary')
          throw new Error('Missing source cut fixture')
        cut.boundary.sourceVertexIndices = [0, 0]
      }
      const spy = vi
        .spyOn(cropSource, 'createCropModels')
        .mockReturnValue([model])
      try {
        expect(() =>
          new SiteGeometry().cropModels({ netTop: 3, netBottom: 0.45 })
        ).toThrow()
      } finally {
        spy.mockRestore()
      }
    }
  )

  it.each(['shifted-position', 'reversed-direction'] as const)(
    'does not admit cut coordinates unrelated to the source rings: %s',
    (failure) => {
      const models = cropSource.createCropModels({ netTop: 3, netBottom: 0.45 })
      const model = models.find(
        (candidate) => candidate.species === 'tomato-yu-nu'
      )
      if (!model) throw new Error('Missing cultivar fixture')
      const cut = model.fruits[0].cutSite
      if (cut?.kind !== 'synthetic-source-boundary')
        throw new Error('Missing source cut fixture')
      if (failure === 'shifted-position')
        cut.position = [
          cut.position[0] + 0.01,
          cut.position[1],
          cut.position[2]
        ]
      else
        cut.towardPlant = [
          -cut.towardPlant[0],
          -cut.towardPlant[1],
          -cut.towardPlant[2]
        ]
      vi.spyOn(cropSource, 'createCropModels').mockReturnValue([model])
      const admitted = new SiteGeometry().cropModels({
        netTop: 3,
        netBottom: 0.45
      })
      expect(admitted[0].fruits[0].cutSite).toBeUndefined()
    }
  )

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

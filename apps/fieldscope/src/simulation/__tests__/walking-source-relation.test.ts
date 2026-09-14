import { beforeAll, describe, expect, it } from 'vitest'
import {
  DEFAULT_CONFIGURATION,
  validateConfiguration
} from '../../domain/farm-configuration'
import { createSyntheticWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import { evaluateWalkingRobotPose } from '../../domain/walking-robot-kinematics'
import { WalkingRobotSourceOwner } from '../../domain/walking-robot-source'
import { readWalkingMotionRequest } from '../../domain/walking-motion-contract'
import { validateSceneDemandConfiguration } from '../../domain/scene-demand-configuration'
import { SiteGeometry } from '../../render-app/site-geometry'
import { buildSiteMeshes } from '../../render-app/site-projection'
import { prepareSceneDemand } from '../scene-demand'
import {
  prepareWalkingMotionIntervals,
  walkingSourcePointBounds
} from '../walking-motion-interval'
import { WalkingMotionOwner } from '../walking-motion'
import { TriangleBuilder } from '../../domain/mesh'
import { readSpatialDescriptor } from '../../engine/spatial-contract'
import { prepareQueryExactForwardFrame } from '../ray-query'
import {
  WalkingSourceRelationEvaluator,
  prepareWalkingSourceRelations
} from '../walking-source-relation'

function material(kind: 'closed-solid' | 'open-shell' = 'closed-solid') {
  const builder = new TriangleBuilder()
  builder.box([0, 0, 0], [1, 1, 1])
  const descriptor = readSpatialDescriptor({
    kind: 'mesh',
    position: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    shape: {
      kind: 'triangles',
      positions: builder.positions,
      indices: builder.indices
    },
    color: 0,
    opacity: 1,
    wireframe: false,
    selectable: false
  })
  if (descriptor.kind !== 'mesh' || descriptor.shape.kind !== 'triangles')
    throw new Error('Missing test material')
  return {
    shape: descriptor.shape,
    region: Object.freeze({ ...builder.regions()[0], kind })
  }
}
const frame = (x: number) =>
  prepareQueryExactForwardFrame({ position: [x, 0, 0], rotation: [0, 0, 0, 1] })
describe('walking source region relations', () => {
  it('admits a boundary only with both complete named closures and an original triangle witness', () => {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 10,
      maxExactPredicates: 100000
    })
    const input = material(),
      solid = owner.prepare(input.shape, input.region)
    const first = { region: solid, frames: Object.freeze([frame(0)]) },
      second = { region: solid, frames: Object.freeze([frame(1)]) }
    const relation = owner.relate(first, second, 0)
    const ranges = [
      Object.freeze({
        indexStart: input.region.indexStart,
        indexCount: input.region.indexCount
      })
    ]
    const witness = owner.proveBoundary(first, second, relation, ranges, ranges)
    expect(witness).toBeDefined()
    expect(witness?.firstTriangle).toBeGreaterThanOrEqual(
      input.region.indexStart
    )
    expect(witness?.secondTriangle).toBeLessThan(
      input.region.indexStart + input.region.indexCount
    )
    expect(
      owner.proveBoundary(first, second, relation, [], ranges)
    ).toBeUndefined()
    expect(
      owner.proveBoundary(first, second, relation, ranges, [])
    ).toBeUndefined()
  })
  it('distinguishes original closed material, boundary and unproved open shell', () => {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 100,
      maxExactPredicates: 100000
    })
    const input = material(),
      solid = owner.prepare(input.shape, input.region)
    const relation = (x: number) =>
      owner.relate(
        { region: solid, frames: [frame(0)] },
        { region: solid, frames: [frame(x)] },
        0
      )
    expect(relation(2).kind).toBe('separated')
    expect(relation(0.5).kind).toBe('volume-overlap')
    // The second source centre is outside the first material's bounds, but
    // its original triangles still enter that material.
    expect(relation(0.9).kind).toBe('volume-overlap')
    expect(relation(1).kind).toBe('boundary')
    const shell = material('open-shell')
    expect(
      owner.relate(
        {
          region: owner.prepare(shell.shape, shell.region),
          frames: [frame(0)]
        },
        { region: solid, frames: [frame(0.5)] },
        0
      ).kind
    ).toBe('unknown')
    expect(owner.prepare(input.shape, input.region)).toBe(solid)
    expect(owner.work.regionPreparations).toBe(2)
  })
  it.each([1, -1])(
    'proves a middle crossing for a fixed translation in direction %s',
    (direction) => {
      const owner = new WalkingSourceRelationEvaluator({
        maxRegionPairs: 100,
        maxExactPredicates: 100000
      })
      const input = material(),
        solid = owner.prepare(input.shape, input.region)
      const stationary = { region: solid, frames: [frame(0)] }
      expect(
        owner.relate(
          { region: solid, frames: [frame(-2 * direction)] },
          stationary,
          0
        ).kind
      ).toBe('separated')
      expect(
        owner.relate(
          { region: solid, frames: [frame(2 * direction)] },
          stationary,
          0
        ).kind
      ).toBe('separated')
      expect(
        owner.relate(
          {
            region: solid,
            frames: [frame(-2 * direction)],
            translation: [4 * direction, 0, 0]
          },
          stationary,
          0
        ).kind
      ).toBe('volume-overlap')
    }
  )
  it('does not replace margin or unsupported motion with a clear endpoint', () => {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 100,
      maxExactPredicates: 100000
    })
    const input = material(),
      solid = owner.prepare(input.shape, input.region)
    const first = { region: solid, frames: [frame(0)] },
      second = { region: solid, frames: [frame(1.1)] }
    expect(owner.relate(first, second, 0.2).kind).toBe('unknown')
    expect(owner.relate(first, second, 0.05).kind).toBe('separated')
    expect(owner.relate({ ...first, motion: 'unproved' }, second, 0).kind).toBe(
      'unknown'
    )
  })
  it('never turns exhausted exact work into a partial clear result', () => {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 1,
      maxExactPredicates: 1
    })
    const input = material(),
      solid = owner.prepare(input.shape, input.region)
    expect(
      owner.relate(
        { region: solid, frames: [frame(0)] },
        { region: solid, frames: [frame(2)] },
        0
      ).kind
    ).toBe('unknown')
    expect(owner.work.exactPredicates).toBeLessThanOrEqual(1)
  })
  it('keeps collision times inside the exact stance subinterval and rejects singular frames', () => {
    const owner = new WalkingSourceRelationEvaluator({
      maxRegionPairs: 20,
      maxExactPredicates: 100000
    })
    const input = material(),
      solid = owner.prepare(input.shape, input.region)
    const first = {
      region: solid,
      frames: Object.freeze([frame(-2)]),
      displacement: { from: [0, 0, 0] as const, until: [4, 0, 0] as const }
    }
    const second = { region: solid, frames: Object.freeze([frame(0)]) }
    expect(
      owner.relate(first, second, 0, {
        from: 0,
        until: 0.2,
        pathFrom: 0,
        pathUntil: 1
      }).kind
    ).toBe('separated')
    expect(
      owner.relate(first, second, 0, {
        from: 0.4,
        until: 0.6,
        pathFrom: 0,
        pathUntil: 1
      }).kind
    ).toBe('volume-overlap')
    expect(
      owner.relate(first, second, 0, {
        from: 0.8,
        until: 1,
        pathFrom: 0,
        pathUntil: 1
      }).kind
    ).toBe('separated')
    expect(() =>
      prepareQueryExactForwardFrame({
        position: [0, 0, 0],
        rotation: [0.5, 0.5, 0, 0]
      })
    ).toThrow()
    const preparations = owner.work.regionPreparations,
      transforms = owner.work.transformPreparations
    owner.relate(first, second, 0)
    expect(owner.work.regionPreparations).toBe(preparations)
    expect(owner.work.transformPreparations).toBe(transforms)
  })
})

describe('current whole walking source relations', () => {
  let source: ReturnType<WalkingRobotSourceOwner['prepare']>
  let demand: ReturnType<typeof prepareSceneDemand>
  let groundingOffset: number
  let robotExtent: readonly number[]
  const evidence = {
    kind: 'synthetic',
    id: 'source-relation-functional',
    label: 'Source relation - synthetic functional evidence'
  } as const
  beforeAll(() => {
    source = new WalkingRobotSourceOwner().prepare(
      createSyntheticWalkingRobotDefinition({
        definitionId: 'source-relations'
      })
    )
    const pose = evaluateWalkingRobotPose(source, {
      base: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
      joints: source.rig.presets.stowed
    })
    const soleHeights = pose.frames.contacts.feet.map(
      (contact) => contact.position[1]
    )
    expect(soleHeights.every((value) => value === soleHeights[0])).toBe(true)
    groundingOffset = -soleHeights[0]
    const frames = new Map(
      pose.bodyTransforms.map((body) => [body.id, body.transform])
    )
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity]
    for (const part of source.parts) {
      const body = frames.get(part.bodyId)
      if (!body) throw new Error('Missing actual source body')
      for (const point of walkingSourcePointBounds(part.shape, [
        part.localFrame,
        body
      ]))
        for (let axis = 0; axis < 3; axis++) {
          min[axis] = Math.min(min[axis], point.min[axis])
          max[axis] = Math.max(max[axis], point.max[axis])
        }
    }
    robotExtent = max.map((value, axis) => value - min[axis])
    const farm = validateConfiguration(DEFAULT_CONFIGURATION),
      geometry = new SiteGeometry()
    const scene = geometry.prepareScene(farm, buildSiteMeshes(farm, geometry))
    const soil = farm.strips
      .filter((strip) => strip.kind === 'soil')
      .sort((a, b) => b.width - a.width)[0]
    if (!soil) throw new Error('Missing current soil strip')
    const routeLength = robotExtent[2] + robotExtent[2] / 2
    const routeFrom = (farm.length - routeLength) / 2
    if (routeFrom < 0 || soil.width < robotExtent[0])
      throw new Error('Current source does not fit the chosen route envelope')
    demand = prepareSceneDemand(
      farm,
      scene,
      validateSceneDemandConfiguration({
        version: 1,
        route: {
          kind: 'soil-strip',
          bay: 0,
          stripId: soil.id,
          from: routeFrom,
          until: routeFrom + routeLength
        },
        evidence,
        growth: { kind: 'bounded', coverage: 'complete', volumes: [] },
        clearanceMargin: { kind: 'bounded', metres: 0 }
      })
    )
  }, 30000)
  const request = (
    preset: 'stowed' | 'leftWorking' | 'rightWorking',
    displacement = 0
  ) => {
    const route = demand.freePassage.route
    if (
      !route ||
      !demand.route ||
      demand.configuration.route.kind !== 'soil-strip'
    )
      throw new Error('Missing actual W1 route')
    const center = route.min.map((value, axis) => (value + route.max[axis]) / 2)
    const usableLength = route.max[2] - route.min[2] - robotExtent[2]
    const travel =
      displacement * Math.max(0, Math.min(usableLength, robotExtent[2]) / 4)
    const terrainShape = {
      kind: 'triangles',
      positions: [
        route.min[0],
        0,
        route.min[2],
        route.max[0],
        0,
        route.min[2],
        route.max[0],
        0,
        route.max[2],
        route.min[0],
        0,
        route.max[2]
      ],
      indices: [0, 1, 2, 0, 2, 3]
    }
    const raw = {
      format: 'walking-motion-request/2',
      requestId: 'relation-' + preset,
      source,
      demand,
      path: {
        id: 'relation-path',
        intent: displacement < 0 ? 'reverse' : 'straight',
        knots: [0, 1].map((time) => ({
          time,
          base: {
            position: [center[0], groundingOffset, center[2] + time * travel],
            heading: 0,
            pitch: 0,
            roll: 0
          },
          joints: source.rig.presets[preset]
        }))
      },
      evaluation: { from: 0, until: 1 },
      stance: {
        id: 'relation-stance',
        phases: [
          {
            from: 0,
            until: 1,
            legs: source.rig.legChains.map((chain) => ({
              chainId: chain.id,
              state: { kind: 'swing' }
            }))
          }
        ]
      },
      gait: { id: 'relation-gait', provenance: evidence },
      terrain: {
        format: 'walking-terrain/1',
        id: 'relation-terrain',
        revision: 1,
        sceneRevision: demand.scene.revision,
        route: { bay: 0, stripId: demand.configuration.route.stripId },
        provenance: evidence,
        observations: Object.fromEntries(
          ['height', 'slope', 'rut', 'debris'].map((key) => [
            key,
            { coverage: 'complete', evidence }
          ])
        ),
        regions: [
          {
            id: 'relation-soil',
            classification: 'soil',
            sourceId: 'relation-soil-source',
            shape: terrainShape,
            frame: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
            binding: {
              kind: 'route-soil',
              bay: 0,
              stripId: demand.configuration.route.stripId
            },
            keepOut: { kind: 'none' }
          }
        ],
        contactAssessments: []
      },
      load: {
        id: 'relation-load',
        provenance: evidence,
        crate: { kind: 'unknown' },
        carried: { kind: 'none' }
      },
      externalSources: [
        {
          sourceId: 'relation-soil-source',
          regions: [
            { id: 'soil-sheet', kind: 'sheet', indexStart: 0, indexCount: 6 }
          ]
        }
      ],
      targetContacts: [],
      budget: {
        maxIntervals: 8,
        maxEnvelopePairs: 2000000,
        maxRegionPairs: 2000000,
        maxExactPredicates: 20000000
      }
    }
    const admitted = readWalkingMotionRequest(raw, source, demand)
    if (admitted.format !== 'walking-motion-request/2')
      throw new Error('Missing current source request')
    return admitted
  }
  it.each(['evaluation', 'load'] as const)(
    'rejects stale interval provenance with the same path and different %s',
    (component) => {
      const input = request('stowed')
      const foreign =
        component === 'evaluation'
          ? { ...input, evaluation: { from: 0, until: 0.5 } }
          : { ...input, load: { ...input.load, id: 'another-load' } }
      const intervals = prepareWalkingMotionIntervals(source, foreign)
      expect(intervals.path).toBe(input.path)
      expect(() =>
        prepareWalkingSourceRelations(source, demand, input, intervals)
      ).toThrow('Stale source relation inputs')
    }
  )
  it.each(['stowed', 'leftWorking', 'rightWorking'] as const)(
    'accounts for every original region pair in actual %s material',
    (preset) => {
      const input = request(preset)
      const result = prepareWalkingSourceRelations(
        source,
        demand,
        input,
        prepareWalkingMotionIntervals(source, input)
      )
      expect(result.request).toBe(input)
      expect(result.source).toBe(source)
      expect(result.demand).toBe(demand)
      for (const segment of result.segments) {
        expect(segment.self.blocked).toBe(0)
        expect(segment.self.unknown).toBe(0)
        expect(segment.self.unvisited).toBe(0)
        expect(segment.self.declaredBoundary).toBe(18)
        expect(segment.coverage.candidate).toBe(
          segment.coverage.coRigidOwner + segment.coverage.required
        )
        expect(segment.coverage.required).toBe(
          segment.coverage.strictBounds +
            segment.coverage.exactSeparated +
            segment.coverage.declaredBoundary +
            segment.coverage.blocked +
            segment.coverage.targetRefinement +
            segment.coverage.unknown +
            segment.coverage.unvisited
        )
      }
      expect(result.work.regionPreparations).toBeLessThanOrEqual(
        source.parts.reduce((sum, part) => sum + part.regions.length, 0) +
          demand.freePassage.exclusions.filter((item) => item.kind === 'source')
            .length +
          1
      )
    },
    60000
  )
  it('publishes request-bound accounting and reuses admitted reads without repeated source work', () => {
    const original = request('stowed')
    const input = readWalkingMotionRequest(
      { ...original, budget: { ...original.budget, maxRegionPairs: 1 } },
      source,
      demand
    )
    let currentDemand: typeof demand | undefined = demand
    const owner = new WalkingMotionOwner({
      getCurrentWalkingRobotSource: () => source,
      getCurrentSceneDemand: () => currentDemand
    })
    const admitted = owner.prepare(input)
    expect(admitted.sourceRelations?.request).toBe(input)
    expect(admitted.sourceRelations?.status).toBe('unknown')
    const work = admitted.sourceRelations?.work
    expect(owner.prepare(input)).toBe(admitted)
    expect(owner.read()).toBe(admitted)
    expect(admitted.sourceRelations?.work).toBe(work)
    expect(owner.work.preparations).toBe(1)
    currentDemand = undefined
    expect(owner.read()).toBeUndefined()
  }, 30000)
  it.each([1, -1])(
    'keeps actual stowed translation %s unknown when support feet slide',
    (direction) => {
      const original = request('stowed', direction)
      const assessments = source.rig.contacts.feet.map(({ patch }, index) => ({
        id: 'support-' + index,
        footPatchId: patch.id,
        terrainRegionId: 'relation-soil',
        pathId: original.path.id,
        from: 0,
        until: 1,
        loadCaseId: original.load.id,
        coverage: 'complete',
        geometry: { status: 'admitted', evidence },
        friction: { status: 'admitted', evidence },
        bearing: { status: 'admitted', evidence },
        sinkage: { status: 'admitted', evidence }
      }))
      const input = readWalkingMotionRequest(
        {
          ...original,
          terrain: { ...original.terrain, contactAssessments: assessments },
          stance: {
            ...original.stance,
            phases: [
              {
                from: 0,
                until: 1,
                legs: source.rig.legChains.map((chain, index) => ({
                  chainId: chain.id,
                  state: {
                    kind: 'support',
                    contactAssessmentId: assessments[index].id
                  }
                }))
              }
            ]
          }
        },
        source,
        demand
      )
      if (input.format !== 'walking-motion-request/2')
        throw new Error('Missing source request')
      const intervals = prepareWalkingMotionIntervals(source, input)
      const result = prepareWalkingSourceRelations(
        source,
        demand,
        input,
        intervals
      )
      expect(result.reasons).toContain('support-contact-motion-unproved')
      const route = demand.freePassage.route
      if (!route) throw new Error('Missing source route')
      for (const envelope of intervals.segments[0].envelopes)
        for (const axis of [0, 2]) {
          expect(envelope.bounds.min[axis]).toBeGreaterThanOrEqual(
            route.min[axis]
          )
          expect(envelope.bounds.max[axis]).toBeLessThanOrEqual(route.max[axis])
        }
      expect(result.status).not.toBe('clear')
      expect(result.segments[0].self.blocked).toBe(0)
      expect(result.segments[0].self.unknown).toBe(0)
      expect(result.segments[0].self.declaredBoundary).toBe(18)
    },
    60000
  )
  it('retains the whole remaining pair inventory when an interval or pair budget ends', () => {
    const original = request('stowed')
    const input = readWalkingMotionRequest(
      {
        ...original,
        budget: { ...original.budget, maxIntervals: 1, maxRegionPairs: 1 },
        path: {
          ...original.path,
          knots: [
            original.path.knots[0],
            { ...original.path.knots[0], time: 0.5 },
            original.path.knots[1]
          ]
        },
        stance: {
          ...original.stance,
          phases: [
            { ...original.stance.phases[0], until: 0.5 },
            { ...original.stance.phases[0], from: 0.5 }
          ]
        }
      },
      source,
      demand
    )
    if (input.format !== 'walking-motion-request/2')
      throw new Error('Missing source request')
    const result = prepareWalkingSourceRelations(
      source,
      demand,
      input,
      prepareWalkingMotionIntervals(source, input)
    )
    expect(result.segments).toHaveLength(2)
    expect(result.segments[1].coverage.required).toBe(
      result.segments[1].coverage.unvisited
    )
    expect(result.segments[1].coverage.candidate).toBe(
      result.segments[0].coverage.candidate
    )
    expect(result.work.regionPairs).toBeLessThanOrEqual(1)
    expect(result.status).toBe('unknown')
  }, 30000)
  it('counts each current target partition once', () => {
    const original = request('stowed')
    const input = readWalkingMotionRequest(
      { ...original, budget: { ...original.budget, maxRegionPairs: 1 } },
      source,
      demand
    )
    if (input.format !== 'walking-motion-request/2')
      throw new Error('Missing source request')
    const intervals = prepareWalkingMotionIntervals(source, input)
    const result = prepareWalkingSourceRelations(
      source,
      demand,
      input,
      intervals
    )
    const partitions = [
      ...demand.targets.left,
      ...demand.targets.right,
      ...demand.targets.unassigned
    ].reduce((sum, target) => sum + target.partitions.length, 0)
    expect(result.work.targetPartitionVisits).toBe(partitions)
    const sourceExclusions = demand.freePassage.exclusions.filter(
      (item) => item.kind === 'source'
    ).length
    expect(result.work.sourceExclusionBindings).toBe(sourceExclusions)
    const moving = source.parts.reduce(
      (sum, part) => sum + part.regions.length,
      0
    )
    expect(result.segments[0].environment.candidate).toBe(
      moving * (sourceExclusions + 1)
    )
    const route = demand.freePassage.route
    if (!route) throw new Error('Missing current route')
    for (const envelope of intervals.segments[0].envelopes)
      for (const axis of [0, 2]) {
        expect(envelope.bounds.min[axis]).toBeGreaterThanOrEqual(
          route.min[axis]
        )
        expect(envelope.bounds.max[axis]).toBeLessThanOrEqual(route.max[axis])
      }
  }, 30000)
})

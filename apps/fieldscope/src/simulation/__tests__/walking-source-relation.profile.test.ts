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
import {
  WalkingSelectedChainRelationOwner,
  prepareWalkingSourceRelations
} from '../walking-source-relation'
import { WalkingConstrainedCycleOwner } from '../../domain/walking-constrained-kinematics'
import {
  cycleFixture,
  exact,
  fraction,
  over
} from '../../domain/__tests__/walking-constrained-kinematics-test-fixtures'

describe('selected-chain source relations', () => {
  it('proves the actual root half-abduction with exhaustive local work', () => {
    const { source, raw } = cycleFixture({
      sourceProfile: 'solid-articulation/2'
    })
    const owner = new WalkingConstrainedCycleOwner(),
      cycle = owner.prepare(source, raw)
    const motion = owner.prepareSelectedChainMotion(cycle, {
      format: 'walking-selected-chain-root-motion/1',
      cycle,
      phase: 0,
      at: fraction(1n, 2n),
      chainId: 'right-front',
      targetAbduction: over(cycle.recipe.alpha, exact(2))
    })
    const relations = new WalkingSelectedChainRelationOwner()
    const current = { owner, cycle }
    const result = relations.prepare(current, {
      format: 'walking-selected-chain-source-relation-request/1',
      motion,
      budget: {
        maxSubdivisions: 30,
        maxRegionPairs: 2000000,
        maxExactPredicates: 5000000,
        maxBits: 24000
      }
    })
    const required =
      motion.parts.reduce((n, p) => n + p.part.regions.length, 0) *
      motion.fixed.parts.reduce((n, p) => n + p.part.regions.length, 0)
    expect(result.coverage.required).toBe(required)
    expect(
      result.coverage.strictBounds +
        result.coverage.exactSeparated +
        result.coverage.declaredBoundary +
        result.coverage.blocked +
        result.coverage.unknown +
        result.coverage.unvisited
    ).toBe(required)
    expect(result.work.rootPartOverlaps).toBeGreaterThan(0)
    expect(result.work.fixedFixedPairs).toBe(0)
    expect(result.work.movingMovingPairs).toBe(0)
    expect(result.work.externalPairs).toBe(0)
    expect(result.work.terrainPairs).toBe(0)
    expect(result.work.exactLeafPairs).toBeLessThan(required)
    expect(
      result.status,
      JSON.stringify({ reasons: result.reasons, work: result.work })
    ).toBe('clear')
    expect(
      result.coverage.blocked +
        result.coverage.unknown +
        result.coverage.unvisited
    ).toBe(0)
    console.info(
      'selected-chain work',
      JSON.stringify({
        required,
        strictBounds: result.coverage.strictBounds,
        exactSeparated: result.coverage.exactSeparated,
        declaredBoundary: result.coverage.declaredBoundary,
        exactLeafPairs: result.work.exactLeafPairs,
        rootPartOverlaps: result.work.rootPartOverlaps,
        nodes: result.work.selectedBoundPreparations,
        selectedBodyVisits: result.work.selectedBodyVisits,
        fixedFramePreparations: result.work.fixedFramePreparations,
        fixedFrameRescales: result.work.evaluator.fixedFrameRescales,
        sourceCertifications: result.work.evaluator.regionPreparations,
        predicates: result.work.evaluator.exactPredicates
      })
    )
    const work = relations.work
    expect(relations.read(current, motion)).toBe(result)
    expect(relations.work).toEqual(work)
    expect(relations.prepare(current, result.request)).toBe(result)
    expect(relations.work).toEqual(work)
    const nextMotion = owner.prepareSelectedChainMotion(cycle, {
      ...motion.recipe,
      targetAbduction: {
        numerator: cycle.recipe.alpha.numerator * 3n,
        denominator: cycle.recipe.alpha.denominator * 4n
      }
    })
    const reused = relations.prepare(current, {
      ...result.request,
      motion: nextMotion
    })
    const fresh = new WalkingSelectedChainRelationOwner().prepare(current, {
      ...result.request,
      motion: nextMotion
    })
    expect(reused.status).toBe('clear')
    expect(reused.coverage).toEqual(fresh.coverage)
    expect(reused.work.evaluator.regionPreparations).toBe(0)
    expect(reused.work.evaluator.sourceCertificationReuses).toBeGreaterThan(0)
    expect(reused.work.evaluator.sourceScalarRebindings).toBeGreaterThan(0)
    expect(reused.work.sourceLocalBoundsVertices).toBe(0)
    expect(reused.work.sourceRegionIndexReads).toBe(0)
    expect(
      result.covers.reduce((n, cover) => n + cover.cardinality, 0) +
        result.pairs.length
    ).toBe(required)
    expect(
      result.pairs.every((pair) =>
        pair.proofs.every((proof) =>
          ['exactSeparated', 'declaredBoundary'].includes(proof.kind)
        )
      )
    ).toBe(true)
    const exhausted = relations.prepare(current, {
      ...result.request,
      budget: { ...result.request.budget, maxExactPredicates: 1 }
    })
    expect(exhausted.status).toBe('unknown')
    expect(exhausted.coverage.unvisited).toBe(required)
    expect(
      exhausted.coverage.strictBounds +
        exhausted.coverage.exactSeparated +
        exhausted.coverage.declaredBoundary
    ).toBe(0)
    expect(
      relations.read(
        { owner: new WalkingConstrainedCycleOwner(), cycle },
        motion
      )
    ).toBeUndefined()
    const replacement = cycleFixture({ sourceProfile: 'solid-articulation/2' })
    const replacementCycle = owner.prepare(replacement.source, replacement.raw)
    expect(relations.read(current, motion)).toBeUndefined()
    const replacementMotion = owner.prepareSelectedChainMotion(
      replacementCycle,
      {
        ...motion.recipe,
        cycle: replacementCycle,
        targetAbduction: over(replacementCycle.recipe.alpha, exact(2))
      }
    )
    const replaced = relations.prepare(
      { owner, cycle: replacementCycle },
      { ...result.request, motion: replacementMotion }
    )
    expect(replaced.status).toBe('clear')
    expect(replaced.work.evaluator.sourceCertificationReuses).toBe(0)
    expect(replaced.work.evaluator.regionPreparations).toBe(
      result.work.evaluator.regionPreparations
    )
    owner.dispose()
    expect(relations.read(current, motion)).toBeUndefined()
  }, 20000)
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

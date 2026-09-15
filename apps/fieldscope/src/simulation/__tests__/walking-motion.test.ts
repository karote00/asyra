import { describe, expect, it } from 'vitest'
import {
  readWalkingMotionRequest,
  readWalkingNonlinearMotionRequest,
  type WalkingMotionRequest
} from '../../domain/walking-motion-contract'
import { createSyntheticWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import { WalkingRobotSourceOwner } from '../../domain/walking-robot-source'
import { WalkingMountedCrateOwner } from '../../domain/walking-mounted-crate'
import { DEFAULT_ROBOT } from '../../domain/robot-configuration'
import { readSpatialDescriptor } from '../../engine/spatial-contract'
import {
  DEFAULT_CONFIGURATION,
  validateConfiguration
} from '../../domain/farm-configuration'
import { validateSceneDemandConfiguration } from '../../domain/scene-demand-configuration'
import { SiteGeometry } from '../../render-app/site-geometry'
import { buildSiteMeshes } from '../../render-app/site-projection'
import { prepareSceneDemand } from '../scene-demand'
import type { SceneDemand, SceneDemandExclusion } from '../scene-demand'
import { WalkingMotionOwner } from '../walking-motion'
import {
  WalkingSourceRelationEvaluator,
  prepareWalkingConstantRootRelations
} from '../walking-source-relation'

import {
  firstVisitedReason,
  mountedConsumerFixture,
  nonlinearFixture
} from './walking-motion-test-fixtures'

it('mounted crate consumer admits only the current original source artifact', () => {
  const f = nonlinearFixture('solid-articulation/2', true)
  const mountOwner = new WalkingMountedCrateOwner(f.sourceOwner)
  const crate = mountOwner.prepare(f.source, {
    format: 'walking-mounted-crate-request/1',
    dimensions: {
      width: DEFAULT_ROBOT.width,
      length: DEFAULT_ROBOT.length,
      height: DEFAULT_ROBOT.height
    },
    minimumClearance: { metres: 0.003125, evidence: evidence('mounted-gap') },
    retention: evidence('mounted-retention'),
    massIdentity: 'mounted-mass'
  })
  const raw = {
    ...f.raw,
    load: { ...f.raw.load, crate: { kind: 'mounted', artifact: crate } }
  }
  const current = { owner: f.cycleOwner, cycle: f.cycle }
  const mounted = { owner: mountOwner, crate }
  const admitted = readWalkingNonlinearMotionRequest(
    raw,
    f.source,
    f.demand,
    current,
    mounted
  )
  expect(admitted.load.crate.kind).toBe('mounted')
  if (admitted.load.crate.kind !== 'mounted')
    throw new Error('Missing mounted input')
  expect(admitted.load.crate.artifact).toBe(crate)
  expect(admitted.load.crate.artifact.geometry.parts).toHaveLength(11)
  expect(() =>
    readWalkingNonlinearMotionRequest(raw, f.source, f.demand, current)
  ).toThrow()
  expect(() =>
    readWalkingNonlinearMotionRequest(
      {
        ...raw,
        load: {
          ...raw.load,
          crate: { kind: 'mounted', artifact: { ...crate } }
        }
      },
      f.source,
      f.demand,
      current,
      mounted
    )
  ).toThrow()
  mountOwner.clear()
  expect(() =>
    readWalkingNonlinearMotionRequest(
      admitted,
      f.source,
      f.demand,
      current,
      mounted
    )
  ).toThrow()
}, 30000)
it('phase-root proves the actual support pin and sleeve but cannot lend it to swing', () => {
  const f = mountedConsumerFixture()
  const evaluator = new WalkingSourceRelationEvaluator({
    maxRegionPairs: 10000,
    maxExactPredicates: 5000000,
    maxBits: 24000
  })
  const support = prepareWalkingConstantRootRelations(
    evaluator,
    f.current,
    24000,
    f.mounted,
    0
  )
  const swing = prepareWalkingConstantRootRelations(
    evaluator,
    f.current,
    24000,
    f.mounted,
    1
  )
  const pin = f.source.parts.find((p) => p.id === 'left-front-abduction-pin')
  const sleeve = f.source.parts.find(
    (p) => p.id === 'left-front-abduction-sleeve'
  )
  if (!pin || !sleeve) throw new Error('Missing original first pair')
  expect(pin.regions[1]).toMatchObject({ indexStart: 24, indexCount: 24 })
  expect(sleeve.regions[1]).toMatchObject({ indexStart: 36, indexCount: 36 })
  expect(support.contains(sleeve)).toBe(true)
  expect(swing.contains(sleeve)).toBe(false)
  expect(
    support.relate(pin, pin.regions[1], sleeve, sleeve.regions[1], 0)?.kind
  ).toBe('exactSeparated')
  const before = evaluator.work
  expect(
    support.relate(pin, pin.regions[1], sleeve, sleeve.regions[1], 0)?.kind
  ).toBe('exactSeparated')
  expect(evaluator.work.rationalNodePreparations).toBe(
    before.rationalNodePreparations
  )
  expect(evaluator.work.transformPreparations).toBe(
    before.transformPreparations
  )
  expect(
    swing.relate(pin, pin.regions[1], sleeve, sleeve.regions[1], 0)
  ).toBeUndefined()
  expect(
    support.relate(pin, pin.regions[1], sleeve, sleeve.regions[1], 0.01)
  ).toBeUndefined()
  f.cycleOwner.dispose()
  expect(() => support.contains(sleeve)).toThrow(/Stale/)
})
it('constant-root relation retains actual fixed-joint SAT and excludes dynamic legs', () => {
  const f = mountedConsumerFixture()
  const evaluator = new WalkingSourceRelationEvaluator({
    maxRegionPairs: 100000,
    maxExactPredicates: 5000000,
    maxBits: 24000
  })
  const relations = prepareWalkingConstantRootRelations(
    evaluator,
    f.current,
    24000,
    f.mounted
  )
  const rail = f.source.parts.find((p) => p.id === 'lift-rail-negative')
  const carriage = f.source.parts.find((p) => p.id === 'carriage')
  if (!rail || !carriage) throw new Error('Missing source constant pair')
  expect(relations.contains(rail)).toBe(true)
  expect(relations.contains(carriage)).toBe(true)
  const result = relations.relate(
    rail,
    rail.regions[0],
    carriage,
    carriage.regions[9],
    0
  )
  expect(['exactSeparated', 'declaredBoundary']).toContain(result?.kind)
  const work = evaluator.work
  expect(
    relations.relate(rail, rail.regions[0], carriage, carriage.regions[9], 0)
      ?.kind
  ).toBe(result?.kind)
  expect(evaluator.work.rationalNodePreparations).toBe(
    work.rationalNodePreparations
  )
  expect(evaluator.work.transformPreparations).toBe(work.transformPreparations)
  expect(
    relations.relate(rail, rail.regions[0], carriage, carriage.regions[9], 0.01)
  ).toBeUndefined()
  for (const contact of f.source.rig.contacts.feet)
    expect(relations.contains(contact.part)).toBe(false)
  const cratePart = f.crate.geometry.parts[0]
  expect(['exactSeparated', 'declaredBoundary']).toContain(
    relations.relate(
      carriage,
      carriage.regions[0],
      cratePart,
      cratePart.regions[0],
      0
    )?.kind
  )
  f.cycleOwner.dispose()
  expect(() =>
    relations.relate(rail, rail.regions[0], carriage, carriage.regions[9], 0)
  ).toThrow(/Stale/)
})
it('mounted crate consumer retains all original inventory in bounded canonical admission and invalidates reads', () => {
  const f = mountedConsumerFixture()
  const owner = new WalkingMotionOwner({
    getCurrentSceneDemand: () => f.demand,
    getCurrentWalkingRobotSource: () => f.source,
    getCurrentWalkingCycle: () => f.current,
    getCurrentMountedCrate: () => f.mounted
  })
  const raw = {
    ...f.raw,
    load: { ...f.raw.load, crate: { kind: 'mounted', artifact: f.crate } },
    budget: { ...f.raw.budget, maxExactPredicates: 1000 }
  }
  const result = owner.prepare(raw)
  if (!('format' in result)) throw new Error('Missing nonlinear admission')
  const entries = result.sourceRelations.inventory.filter(
    (e) => e.mountedCrate === f.crate
  )
  expect(entries.map((e) => e.mountedPart)).toEqual(f.crate.geometry.parts)
  expect(entries.map((e) => e.region)).toEqual(
    f.crate.geometry.parts.flatMap((p) => p.regions)
  )
  expect(result.request.load.crate).toEqual({
    kind: 'mounted',
    artifact: f.crate
  })
  expect(result.sourceRelations.reasons).not.toContain('crate-geometry-unknown')
  expect(result.sourceRelations.coverage.unvisited).toBeGreaterThan(0)
  expect(owner.read()).toBe(result)
  const preparations = owner.work.preparations
  expect(owner.prepare(result.request)).toBe(result)
  expect(owner.work.preparations).toBe(preparations)
  f.mountOwner.clear()
  expect(owner.read()).toBeUndefined()
  expect(() => owner.prepare(result.request)).toThrow()
}, 30000)
describe('canonical nonlinear admission negatives', () => {
  it('reports visited reasons beyond an unvisited prefix without inventing witnesses', () => {
    const rows = [
      ...Array.from({ length: 5 }, (_, id) => ({
        id,
        kind: 'unvisited',
        proofs: [{ kind: 'unvisited', reason: 'budget' }]
      })),
      { id: 5, kind: 'unknown', proofs: [{ kind: 'unknown', reason: 'open' }] },
      {
        id: 6,
        kind: 'unknown',
        proofs: [{ kind: 'unknown', reason: 'ground' }]
      },
      {
        id: 7,
        kind: 'blocked',
        proofs: [{ kind: 'blocked', reason: 'volume' }]
      },
      { id: 8, kind: 'unknown', proofs: [{ kind: 'unknown', reason: 'open' }] }
    ]
    expect(rows.slice(0, 4).filter((r) => r.kind === 'unknown')).toEqual([])
    expect(
      firstVisitedReason(rows).map((v) => [v.row.id, v.proof.reason])
    ).toEqual([
      [5, 'open'],
      [6, 'ground'],
      [7, 'volume']
    ])
    expect(firstVisitedReason(rows)[0].row).toBe(rows[5])
  })
})
describe('canonical nonlinear admission negatives', () => {
  it('binds current identities and rejects malformed finite inputs before traversal', () => {
    const { raw, source, demand, cycle, cycleOwner, owner } = nonlinearFixture()
    const current = { owner: cycleOwner, cycle }
    const read = (input: unknown) =>
      readWalkingNonlinearMotionRequest(input, source, demand, current)
    const admitted = read(raw)
    expect(read(admitted)).toBe(admitted)
    expect(admitted.source).toBe(source)
    expect(admitted.demand).toBe(demand)
    expect(admitted.cycle).toBe(cycle)
    expect(admitted.terrain).not.toBe(raw.terrain)
    expect(Object.isFrozen(admitted.terrain.contactAssessments)).toBe(true)
    expect(
      new Set(admitted.terrainEvents.map((e) => e.placementRequest.terrain))
        .size
    ).toBe(4)
    const before = cycleOwner.work
    const cases: readonly [string, unknown][] = [
      ['foreign source', { ...raw, source: { ...source } }],
      ['foreign demand', { ...raw, demand: { ...demand } }],
      ['foreign cycle', { ...raw, cycle: { ...cycle } }],
      ['legacy format', { ...raw, format: 'walking-motion-request/2' }],
      [
        'phase gap',
        {
          ...raw,
          path: {
            ...raw.path,
            phases: [raw.path.phases[0], { ...raw.path.phases[1], from: 1.1 }]
          }
        }
      ],
      [
        'phase overlap',
        {
          ...raw,
          path: {
            ...raw.path,
            phases: [raw.path.phases[0], { ...raw.path.phases[1], from: 0.9 }]
          }
        }
      ],
      [
        'nonfinite time',
        {
          ...raw,
          path: {
            ...raw.path,
            phases: [
              raw.path.phases[0],
              { ...raw.path.phases[1], until: Infinity }
            ]
          }
        }
      ],
      ['nonempty target', { ...raw, targetContacts: [{}] }],
      ['missing external source', { ...raw, externalSources: [] }],
      [
        'partial partition',
        {
          ...raw,
          externalSources: [
            {
              ...raw.externalSources[0],
              regions: [{ ...raw.externalSources[0].regions[0], indexCount: 3 }]
            }
          ]
        }
      ],
      [
        'foreign event receipt',
        {
          ...raw,
          terrainEvents: raw.terrainEvents.map((e, i) =>
            i === 0
              ? {
                  ...e,
                  placementRequest: admitted.terrainEvents[0].placementRequest
                }
              : e
          )
        }
      ],
      [
        'foreign foot patch',
        {
          ...raw,
          terrainEvents: raw.terrainEvents.map((e, i) =>
            i === 0
              ? {
                  ...e,
                  seeds: e.seeds.map((s, j) =>
                    j === 0 ? { ...s, footPatch: { ...s.footPatch } } : s
                  )
                }
              : e
          )
        }
      ],
      [
        'input exhaustion',
        { ...raw, budget: { ...raw.budget, maxInputValues: 1 } }
      ],
      [
        'zero phase budget',
        { ...raw, budget: { ...raw.budget, maxPhaseNodes: 0 } }
      ],
      [
        'unsafe pair budget',
        {
          ...raw,
          budget: { ...raw.budget, maxRegionPairs: Number.MAX_SAFE_INTEGER + 1 }
        }
      ],
      [
        'nonfinite predicate budget',
        { ...raw, budget: { ...raw.budget, maxExactPredicates: Infinity } }
      ],
      [
        'oversized fraction',
        {
          ...raw,
          terrainEvents: raw.terrainEvents.map((e, i) =>
            i === 0
              ? {
                  ...e,
                  seeds: e.seeds.map((s, j) =>
                    j === 0
                      ? {
                          ...s,
                          barycentric: [
                            { numerator: 1n << 24001n, denominator: 1n },
                            ...s.barycentric.slice(1)
                          ]
                        }
                      : s
                  )
                }
              : e
          )
        }
      ]
    ]
    for (const [name, input] of cases) expect(() => read(input), name).toThrow()
    expect(cycleOwner.work).toEqual(before)
    expect(owner.work.preparations).toBe(0)
    raw.terrain.revision++
    expect(admitted.terrain.revision).toBe(1)
    cycleOwner.dispose()
    expect(() => read(admitted)).toThrow()
    expect(owner.read()).toBeUndefined()
  }, 30000)
})

describe('canonical nonlinear runtime limits', () => {
  it('issues unknown with complete inventory when admitted runtime work cannot start', () => {
    const { raw, owner } = nonlinearFixture()
    const request = {
      ...raw,
      budget: {
        ...raw.budget,
        maxCycleOperations: 1,
        maxRegionPairs: 1,
        maxEnvelopePairs: 1,
        maxExactPredicates: 1
      }
    }
    let product: ReturnType<WalkingMotionOwner['prepare']> | undefined
    expect(() => {
      product = owner.prepare(request)
    }).not.toThrow()
    if (!product || !('format' in product))
      throw new Error('Missing nonlinear budget result')
    expect(product.status).toBe('unknown')
    expect(product.phaseCover).toHaveLength(0)
    expect(product.sourceRelations.coverage.required).toBeGreaterThan(1)
    const coverage = product.sourceRelations.coverage
    expect(coverage.required).toBe(coverage.unknown + coverage.unvisited)
    expect(product.work.cycleOperations).toBeLessThanOrEqual(1)
    expect(product.work.exactOperations).toBeLessThanOrEqual(1)
    expect(product.reasons).toContain('nonlinear-phase-cover-incomplete')
    expect(owner.read()).toBe(product)
    expect(owner.prepare(product.request)).toBe(product)
    owner.clear()
    expect(owner.isCurrent(product)).toBe(false)
    const limited = owner.prepare({
      ...raw,
      budget: {
        ...raw.budget,
        maxRegionPairs: 1,
        maxEnvelopePairs: 1,
        maxExactPredicates: 1
      }
    })
    if (
      !('format' in limited) ||
      limited.format !== 'walking-motion-admission/3'
    )
      throw new Error('Missing nonlinear runtime result')
    expect(limited.status).toBe('unknown')
    expect(limited.phaseCover).toHaveLength(2)
    expect(limited.work.exactOperations).toBeLessThanOrEqual(1)
    expect(limited.sourceRelations.work.kernel.exactPredicates).toBe(0)
    expect(limited.sourceRelations.coverage.unvisited).toBe(
      limited.sourceRelations.coverage.required
    )
    for (const cover of limited.phaseCover) {
      expect(cover.source).toBe(limited.source)
      expect(cover.cycle).toBe(limited.cycle)
      expect(cover.terrain).toBe(limited.request.terrain)
      expect(cover.load).toBe(limited.request.load)
      expect(cover.stance.path).toBe(limited.request.path)
      expect(cover.stance.supports).toHaveLength(3)
      expect(cover.plane).toBeNull()
      expect(cover.bounds.parts).toHaveLength(limited.source.parts.length)
      expect(cover.parameter).toEqual({
        low: { numerator: 0n, denominator: 1n },
        high: { numerator: 1n, denominator: 1n }
      })
    }
    expect(owner.isCurrent({ ...limited })).toBe(false)
    expect(owner.prepare(limited.request)).toBe(limited)
    owner.clear()
    expect(owner.isCurrent(limited)).toBe(false)
  }, 30000)
})

type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
    : T
const evidence = (id: string) => ({
  kind: 'synthetic' as const,
  id,
  label: `${id} - synthetic walking admission evidence`
})

function makeDemand(exclusions: readonly SceneDemandExclusion[] = []) {
  return Object.freeze({
    identity: Object.freeze({}),
    revision: 1,
    scene: Object.freeze({ revision: 7 }),
    configuration: Object.freeze({
      version: 1,
      route: {
        kind: 'soil-strip',
        bay: 0,
        stripId: 'soil-strip',
        from: 0,
        until: 1
      },
      evidence: evidence('scene-demand'),
      growth: { kind: 'bounded', coverage: 'complete', volumes: [] },
      clearanceMargin: { kind: 'bounded', metres: 0.02 }
    }),
    evidence: evidence('scene-demand'),
    status: 'ready',
    reasons: Object.freeze([]),
    route: Object.freeze({
      bay: 0,
      stripId: 'soil-strip',
      volume: Object.freeze({ min: [-20, -20, -20], max: [20, 20, 20] })
    }),
    channels: Object.freeze([]),
    freePassage: Object.freeze({
      kind: 'axis-aligned-difference',
      route: Object.freeze({ min: [-20, -20, -20], max: [20, 20, 20] }),
      exclusions: Object.freeze([...exclusions]),
      status: 'ready',
      reasons: Object.freeze([])
    })
  }) as unknown as SceneDemand
}

function fixture() {
  const sourceOwner = new WalkingRobotSourceOwner(),
    source = sourceOwner.prepare(
      createSyntheticWalkingRobotDefinition({ definitionId: 'motion-owner' })
    ),
    pathId = 'whole-machine-path',
    loadCaseId = 'empty-load'
  const assessments = source.rig.contacts.feet.map(({ patch }, index) => ({
    id: `assessment-${index}`,
    footPatchId: patch.id,
    terrainRegionId: 'soil-region',
    pathId,
    from: 0,
    until: 1,
    loadCaseId,
    coverage: 'complete' as const,
    geometry: { status: 'admitted' as const, evidence: evidence('geometry') },
    friction: { status: 'admitted' as const, evidence: evidence('friction') },
    bearing: { status: 'admitted' as const, evidence: evidence('bearing') },
    sinkage: { status: 'admitted' as const, evidence: evidence('sinkage') }
  }))
  // One interval, every source region, at most one carried source, one terrain
  // region and one exclusion. Include same-body pairs for a finite upper bound.
  const maximumEnvelopes =
    source.parts.reduce((sum, part) => sum + part.regions.length, 0) + 1
  const raw: Mutable<WalkingMotionRequest> = {
    format: 'walking-motion-request/1' as const,
    requestId: 'whole-machine-request',
    path: {
      id: pathId,
      intent: 'straight' as const,
      knots: [
        {
          time: 0,
          base: { position: [0, 0, 0], heading: 0, pitch: 0, roll: 0 },
          joints: structuredClone(source.rig.presets.stowed) as Mutable<
            typeof source.rig.presets.stowed
          >
        },
        {
          time: 1,
          base: { position: [0, 0, 0.2], heading: 0, pitch: 0, roll: 0 },
          joints: structuredClone(source.rig.presets.stowed) as Mutable<
            typeof source.rig.presets.stowed
          >
        }
      ]
    },
    evaluation: { from: 0, until: 1 },
    stance: {
      id: 'whole-machine-stance',
      phases: [
        {
          from: 0,
          until: 1,
          legs: source.rig.legChains.map((chain, index) => ({
            chainId: chain.id,
            state: {
              kind: 'support' as const,
              contactAssessmentId: assessments[index].id
            }
          }))
        }
      ]
    },
    gait: { id: 'whole-machine-gait', provenance: evidence('gait') },
    terrain: {
      format: 'walking-terrain/1' as const,
      id: 'terrain',
      revision: 1,
      sceneRevision: 7,
      route: { bay: 0, stripId: 'soil-strip' },
      provenance: evidence('terrain'),
      observations: {
        debris: { coverage: 'complete' as const, evidence: evidence('debris') },
        height: { coverage: 'complete' as const, evidence: evidence('height') },
        slope: { coverage: 'complete' as const, evidence: evidence('slope') },
        rut: { coverage: 'complete' as const, evidence: evidence('rut') }
      },
      regions: [
        {
          id: 'soil-region',
          classification: 'soil' as const,
          sourceId: 'terrain-triangles',
          shape: {
            kind: 'triangles' as const,
            positions: [-20, -1, -20, 20, -1, -20, 20, -1, 20, -20, -1, 20],
            indices: [0, 1, 2, 0, 2, 3]
          },
          frame: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
          binding: {
            kind: 'route-soil' as const,
            bay: 0,
            stripId: 'soil-strip'
          },
          keepOut: { kind: 'none' as const }
        }
      ],
      contactAssessments: assessments
    },
    load: {
      id: loadCaseId,
      provenance: evidence('load'),
      crate: { kind: 'unknown' as const },
      carried: { kind: 'none' as const }
    },
    budget: {
      maxIntervals: 32,
      maxEnvelopePairs:
        (maximumEnvelopes * (maximumEnvelopes - 1)) / 2 + maximumEnvelopes * 2
    }
  }
  let demand = makeDemand()
  const owner = new WalkingMotionOwner({
    getCurrentSceneDemand: () => demand,
    getCurrentWalkingRobotSource: () => sourceOwner.read()
  })
  return {
    sourceOwner,
    source,
    raw,
    owner,
    getDemand: () => demand,
    setDemand: (next: SceneDemand) => {
      demand = next
    }
  }
}

describe('walking whole-machine motion admission', () => {
  it('queries all bodies, parts and strict separated pairs without joint exemptions', () => {
    const { source, raw, owner } = fixture()
    const request = readWalkingMotionRequest(raw, source)
    const admission = owner.prepare(request)
    expect(admission.reasons).toContain('source-relations-version-two-required')
    expect(admission.source).toBe(source)
    expect(admission.path).toBe(request.path)
    expect(admission.segments).toHaveLength(1)
    expect(admission.segments[0].envelopes).toHaveLength(
      source.parts.reduce((sum, part) => sum + part.regions.length, 0)
    )
    expect(
      new Set(admission.segments[0].envelopes.map(({ body }) => body.id)).size
    ).toBe(46)
    expect(
      admission.segments[0].envelopes.some(({ part }) =>
        /tray|carriage|tool|foot/.test(part.id)
      )
    ).toBe(true)
    expect(admission.work.separatedEnvelopePairs).toBeGreaterThan(0)
    expect(admission.work.unresolvedEnvelopePairs).toBeGreaterThan(0)
    expect(admission.reasons).toContain(
      'different-body-overlap-exact-query-required'
    )
    expect(admission.status).toBe('unknown')
    expect(admission.work.unvisitedIntervals).toBe(0)
    expect(admission.reasons).toContain('crate-geometry-unknown')
    expect(admission.quasiStatic).toBe('pending-W4')
    expect(admission).not.toHaveProperty('safe')
    expect(admission).not.toHaveProperty('stable')
  })

  it('includes carried source geometry and preserves its mass identity for W4', () => {
    const { source, raw, owner } = fixture()
    const carried = structuredClone(raw) as Mutable<typeof raw>
    carried.load = {
      id: 'carried-load',
      provenance: evidence('carried'),
      crate: { kind: 'unknown' },
      carried: {
        kind: 'attached',
        items: [
          {
            id: 'carried-source',
            sourceId: 'fruit-triangles',
            sourceCoverage: 'complete',
            shape: {
              kind: 'triangles',
              positions: [0, 0, 0, 0.1, 0, 0, 0, 0.1, 0],
              indices: [0, 1, 2]
            },
            holderBodyId: 'base',
            localFrame: { position: [0, 0.4, 0], rotation: [0, 0, 0, 1] },
            massPropertiesId: 'carried-mass-1'
          }
        ]
      }
    }
    for (const assessment of carried.terrain.contactAssessments)
      assessment.loadCaseId = carried.load.id
    const admission = owner.prepare(readWalkingMotionRequest(carried, source))
    expect(admission.segments[0].carriedEnvelopes).toHaveLength(1)
    expect(admission.segments[0].carriedEnvelopes[0].attachment).toMatchObject({
      sourceId: 'fruit-triangles',
      massPropertiesId: 'carried-mass-1'
    })
    const all = [
      ...admission.segments[0].envelopes,
      ...admission.segments[0].carriedEnvelopes
    ]
    let selfPairs = 0
    for (let left = 0; left < all.length; left++)
      for (let right = left + 1; right < all.length; right++)
        if (!(
          'part' in all[left] &&
          'part' in all[right] &&
          all[left].body.id === all[right].body.id
        ))
          selfPairs++
    expect(admission.work.envelopePairs).toBe(selfPairs + all.length)
  })

  it('compares an attached crate against its holder without a base-body exemption', () => {
    const baseline = fixture(),
      next = fixture()
    const before = baseline.owner.prepare(
      readWalkingMotionRequest(baseline.raw, baseline.source)
    )
    const chassis = next.source.parts.find(({ id }) => id === 'chassis')
    if (!chassis) throw new Error('Missing test chassis')
    next.raw.load.crate = {
      kind: 'attached',
      sourceCoverage: 'complete',
      provenance: evidence('crate'),
      sourceParts: [
        {
          id: 'crate-base',
          sourceId: 'crate-base-source',
          shape: {
            kind: 'triangles',
            positions: [...chassis.shape.positions],
            indices: [...chassis.shape.indices]
          }
        }
      ],
      holderBodyId: 'base',
      localFrames: [
        {
          position: [...chassis.localFrame.position],
          rotation: [...chassis.localFrame.rotation]
        }
      ],
      massIdentity: 'crate-mass'
    }
    const result = next.owner.prepare(
      readWalkingMotionRequest(next.raw, next.source)
    )
    expect(result.status).toBe('unknown')
    expect(result.reasons).not.toContain('crate-geometry-unknown')
    expect(result.work.unresolvedEnvelopePairs).toBeGreaterThan(
      before.work.unresolvedEnvelopePairs
    )
    expect(result.work.envelopePairs - before.work.envelopePairs).toBe(
      next.source.parts.reduce((sum, part) => sum + part.regions.length, 0) + 1
    )
    expect(result.segments[0].carriedEnvelopes[0].assembly).toBe(
      result.load.crate
    )
    next.raw.load.crate.sourceCoverage = 'partial'
    const partial = next.owner.prepare(
      readWalkingMotionRequest(next.raw, next.source)
    )
    expect(partial.status).toBe('unknown')
    expect(partial.reasons).toContain('crate-source-geometry-incomplete')
  })

  it('keeps a declared fruit with unknown geometry unknown without fabricated bounds', () => {
    const { source, raw, owner } = fixture()
    raw.load.carried = {
      kind: 'attached',
      items: [
        {
          id: 'fruit',
          sourceId: 'fruit-source',
          sourceCoverage: 'partial',
          shape: { kind: 'unknown' },
          holderBodyId: 'base',
          localFrame: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
          massPropertiesId: 'fruit-mass'
        }
      ]
    }
    const result = owner.prepare(readWalkingMotionRequest(raw, source))
    expect(result.status).toBe('unknown')
    expect(result.reasons).toContain('carried-source-geometry-unknown')
    expect(result.segments[0].carriedEnvelopes).toHaveLength(0)
    expect(result.load.carried).toEqual(raw.load.carried)
  })

  it('retains partial fruit geometry without treating it as complete source', () => {
    const { source, raw, owner } = fixture()
    raw.load.carried = {
      kind: 'attached',
      items: [
        {
          id: 'partial-fruit',
          sourceId: 'partial-source',
          sourceCoverage: 'partial',
          shape: {
            kind: 'triangles',
            positions: [0, 0, 0, 0.1, 0, 0, 0, 0.1, 0],
            indices: [0, 1, 2]
          },
          holderBodyId: 'base',
          localFrame: { position: [2, 2, 2], rotation: [0, 0, 0, 1] },
          massPropertiesId: 'fruit-mass'
        }
      ]
    }
    const result = owner.prepare(readWalkingMotionRequest(raw, source))
    expect(result.status).toBe('unknown')
    expect(result.reasons).toContain('carried-source-geometry-incomplete')
    expect(result.segments[0].carriedEnvelopes).toHaveLength(1)
  })

  it('blocks only a hard exclusion with an exact knot witness', () => {
    const exact = fixture()
    const growth = {
      kind: 'growth' as const,
      relation: 'hard-exclusion' as const,
      volume: {
        id: 'growth-witness',
        anchor: { kind: 'world' as const },
        min: [-2, -2, -2],
        max: [2, 2, 2]
      },
      bounds: { min: [-2, -2, -2], max: [2, 2, 2] }
    } as Extract<SceneDemandExclusion, { kind: 'growth' }>
    exact.setDemand(makeDemand([growth]))
    const blocked = exact.owner.prepare(
      readWalkingMotionRequest(exact.raw, exact.source)
    )
    expect(blocked.status).toBe('blocked')
    expect(blocked.reasons).toContain('hard-exclusion-knot-witness')

    const middle = fixture()
    const moving = structuredClone(middle.raw) as Mutable<typeof middle.raw>
    moving.path.knots[0].base.position[0] = -2
    moving.path.knots[1].base.position[0] = 2
    moving.gait.id = 'middle-crossing-gait'
    const narrow = {
      ...growth,
      volume: { ...growth.volume, id: 'middle-growth' },
      bounds: { min: [-0.1, -2, -2], max: [0.1, 2, 2] }
    } as SceneDemandExclusion
    middle.setDemand(makeDemand([narrow]))
    const unresolved = middle.owner.prepare(
      readWalkingMotionRequest(moving, middle.source)
    )
    expect(unresolved.status).toBe('unknown')
    expect(unresolved.reasons).toContain('hard-exclusion-exact-query-required')
    expect(unresolved.reasons).not.toContain('hard-exclusion-knot-witness')
  })

  it('keeps a boundary source vertex unresolved instead of claiming an interior witness', () => {
    const { source, raw, owner, setDemand, getDemand } = fixture()
    raw.load.carried = {
      kind: 'attached',
      items: [
        {
          id: 'boundary-fruit',
          sourceId: 'boundary-source',
          sourceCoverage: 'complete',
          shape: {
            kind: 'triangles',
            positions: [0, 0, 0, 0, 0.1, 0, 0, 0, 0.1],
            indices: [0, 1, 2]
          },
          holderBodyId: 'base',
          localFrame: { position: [10, 0, 0], rotation: [0, 0, 0, 1] },
          massPropertiesId: 'boundary-mass'
        }
      ]
    }
    const exclusion: SceneDemandExclusion = {
      kind: 'growth',
      relation: 'hard-exclusion',
      volume: {
        id: 'boundary',
        anchor: { kind: 'world' },
        min: [10, -2, -2],
        max: [11, 2, 2]
      },
      bounds: { min: [10, -2, -2], max: [11, 2, 2] }
    }
    const demand = makeDemand([exclusion])
    setDemand(
      Object.freeze({
        ...demand,
        configuration: {
          ...getDemand().configuration,
          clearanceMargin: { kind: 'bounded' as const, metres: 0 }
        }
      })
    )
    const result = owner.prepare(readWalkingMotionRequest(raw, source))
    expect(result.reasons).not.toContain('hard-exclusion-knot-witness')
    expect(result.status).toBe('unknown')
  })

  it('keeps conservative source-envelope overlap unknown and reports budget exhaustion', () => {
    const overlapFixture = fixture()
    const part = overlapFixture.source.parts[0],
      descriptor = readSpatialDescriptor({
        kind: 'mesh',
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        shape: part.shape,
        color: 0,
        opacity: 1,
        wireframe: false,
        selectable: false
      })
    const sourceEnvelope = {
      kind: 'source',
      relation: 'conservative-source-envelope',
      mesh: {
        id: 'source-envelope',
        layer: 'supports',
        visible: true,
        descriptor,
        regions: part.regions
      },
      region: part.regions[0],
      instance: 0,
      transform: { descriptor },
      bounds: { min: [-2, -2, -2], max: [2, 2, 2] }
    } as SceneDemandExclusion
    overlapFixture.setDemand(makeDemand([sourceEnvelope]))
    const overlap = overlapFixture.owner.prepare(
      readWalkingMotionRequest(overlapFixture.raw, overlapFixture.source)
    )
    expect(overlap.status).toBe('unknown')
    expect(overlap.reasons).toContain('source-envelope-exact-query-required')
    expect(overlap.reasons).not.toContain('source-envelope-collision')

    const exhaustedFixture = fixture()
    const limited = structuredClone(exhaustedFixture.raw) as Mutable<
      typeof exhaustedFixture.raw
    >
    limited.budget.maxEnvelopePairs = 1
    const exhausted = exhaustedFixture.owner.prepare(
      readWalkingMotionRequest(limited, exhaustedFixture.source)
    )
    expect(exhausted.status).toBe('unknown')
    expect(exhausted.work.unvisitedEnvelopePairs).toBeGreaterThan(0)
    expect(exhausted.reasons).toContain('envelope-pair-budget-exhausted')
    const intervalFixture = fixture()
    const intervalLimited = intervalFixture.raw
    intervalLimited.path.knots.splice(1, 0, {
      ...structuredClone(intervalLimited.path.knots[0]),
      time: 0.5
    })
    intervalLimited.gait.id = 'interval-budget-gait'
    intervalLimited.budget.maxIntervals = 1
    const intervalResult = intervalFixture.owner.prepare(
      readWalkingMotionRequest(intervalLimited, intervalFixture.source)
    )
    expect(intervalResult.status).toBe('unknown')
    expect(intervalResult.work.unvisitedIntervals).toBe(1)
    expect(
      intervalResult.segments.map(({ from, until }) => [from, until])
    ).toEqual([
      [0, 0.5],
      [0.5, 1]
    ])
    expect(intervalResult.segments[1].visited).toBe(false)
  })

  it('uses a declared debris keep-out witness but not raw terrain AABB as collision', () => {
    const declared = fixture()
    const raw = structuredClone(declared.raw) as Mutable<typeof declared.raw>
    raw.terrain.regions.push({
      id: 'debris-region',
      classification: 'debris',
      sourceId: 'debris-triangles',
      shape: {
        kind: 'triangles',
        positions: [-2, -2, -2, 2, -2, -2, 0, 2, 0],
        indices: [0, 1, 2]
      },
      frame: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
      binding: { kind: 'debris' },
      keepOut: {
        kind: 'bounded',
        min: [-2, -2, -2],
        max: [2, 2, 2],
        evidence: evidence('debris-keep-out')
      }
    })
    const blocked = declared.owner.prepare(
      readWalkingMotionRequest(raw, declared.source)
    )
    expect(blocked.status).toBe('blocked')
    expect(blocked.reasons).toContain('debris-keep-out-knot-witness')

    const rawOnly = fixture()
    const unknown = structuredClone(rawOnly.raw) as Mutable<typeof rawOnly.raw>
    unknown.terrain.regions.push({
      ...raw.terrain.regions[1],
      id: 'raw-debris',
      keepOut: { kind: 'none' }
    })
    const unresolved = rawOnly.owner.prepare(
      readWalkingMotionRequest(unknown, rawOnly.source)
    )
    expect(unresolved.status).toBe('unknown')
    expect(unresolved.reasons).toContain(
      'debris-source-overlap-exact-query-required'
    )
    expect(unresolved.work.terrainBoundsPreparations).toBe(1)
    expect(unresolved.work.terrainVertexBounds).toBe(3)
    expect(unresolved.work.envelopePairs).toBeGreaterThan(100)
    for (let index = 0; index < 100; index++)
      expect(rawOnly.owner.read()).toBe(unresolved)
    unknown.terrain.id = 'changed-debris-survey'
    unknown.terrain.revision++
    const changed = rawOnly.owner.prepare(
      readWalkingMotionRequest(unknown, rawOnly.source)
    )
    expect(changed.work.terrainBoundsPreparations).toBe(1)
    expect(rawOnly.owner.work.preparations).toBe(2)
  })

  it('reuses one immutable product and invalidates only on semantic identities', () => {
    const fixtureValue = fixture()
    const request = readWalkingMotionRequest(
      fixtureValue.raw,
      fixtureValue.source
    )
    const first = fixtureValue.owner.prepare(request)
    for (let count = 0; count < 100; count++)
      expect(fixtureValue.owner.read()).toBe(first)
    expect(fixtureValue.owner.prepare(request)).toBe(first)
    expect(fixtureValue.owner.work.preparations).toBe(1)
    const originalBuilds = fixtureValue.sourceOwner.work.builds

    fixtureValue.setDemand(
      Object.freeze({ ...fixtureValue.getDemand(), revision: 2 })
    )
    expect(fixtureValue.owner.isCurrent(first)).toBe(false)
    const second = fixtureValue.owner.prepare(request)
    expect(second).not.toBe(first)
    expect(second.revision).toBe(first.revision + 1)
    expect(fixtureValue.sourceOwner.work.builds).toBe(originalBuilds)

    const changedPath = structuredClone(fixtureValue.raw) as Mutable<
      typeof fixtureValue.raw
    >
    changedPath.path.knots[1].base.position[0] = 0.1
    expect(() =>
      fixtureValue.owner.prepare(
        readWalkingMotionRequest(changedPath, fixtureValue.source)
      )
    ).toThrow()
    expect(fixtureValue.owner.work.preparations).toBe(2)
  })

  it('does not reuse shallow-frozen raw inputs after a nested semantic change', () => {
    const { raw, owner } = fixture()
    const shallow = Object.freeze(raw)
    const first = owner.prepare(shallow)
    raw.path.knots[1].base.position[0] = 0.1
    raw.gait.id = 'changed-shallow-gait'
    const second = owner.prepare(shallow)
    expect(second).not.toBe(first)
    if ('format' in second) throw new Error('Legacy request changed authority')
    expect(second.path.knots[1].base.position[0]).toBe(0.1)
    expect(owner.work.preparations).toBe(2)
  })

  it('rejects malformed input before owner work and retires on clear', () => {
    const { source, raw, owner } = fixture()
    const malformed = structuredClone(raw) as Mutable<typeof raw>
    malformed.budget.maxIntervals = 0
    expect(() => owner.prepare(malformed)).toThrow()
    expect(owner.work.preparations).toBe(0)
    const admission = owner.prepare(readWalkingMotionRequest(raw, source))
    owner.clear()
    expect(owner.read()).toBeUndefined()
    expect(owner.isCurrent(admission)).toBe(false)
  })

  it('does not issue collision decisions from incompatible terrain evidence', () => {
    const { source, raw, owner, setDemand, getDemand } = fixture()
    raw.terrain.sceneRevision = 6
    setDemand(
      Object.freeze({
        ...getDemand(),
        freePassage: {
          ...getDemand().freePassage,
          route: { min: [10, 10, 10] as const, max: [11, 11, 11] as const }
        }
      })
    )
    const result = owner.prepare(readWalkingMotionRequest(raw, source))
    expect(result.status).toBe('unknown')
    expect(result.reasons).toContain('terrain-scene-mismatch')
    expect(result.reasons).not.toContain('route-boundary-knot-witness')
    expect(result.work.envelopePairs).toBe(0)
  })

  it('retains a compatible W1 block but never borrows one from another route', () => {
    for (const incompatible of [false, true]) {
      const { source, raw, owner, setDemand, getDemand } = fixture()
      setDemand(
        Object.freeze({
          ...getDemand(),
          status: 'blocked',
          reasons: ['growth-covers-route']
        })
      )
      if (incompatible) {
        raw.terrain.route.stripId = 'another-strip'
        raw.terrain.regions[0].binding = {
          kind: 'route-soil',
          bay: 0,
          stripId: 'another-strip'
        }
      }
      const result = owner.prepare(readWalkingMotionRequest(raw, source))
      expect(result.status).toBe(incompatible ? 'unknown' : 'blocked')
      if (!incompatible)
        expect(result.reasons).toContain('scene-demand-blocked')
    }
  })

  it('recomputes once for each changed W3 input and shares all unchanged reads', () => {
    const { source, raw, owner, sourceOwner, setDemand, getDemand } = fixture()
    let previous = owner.prepare(readWalkingMotionRequest(raw, source))
    const changes: ((request: Mutable<WalkingMotionRequest>) => void)[] = [
      (request) => {
        request.path.knots[1].base.heading = 0.1
      },
      (request) => {
        request.stance.id = 'changed-stance'
      },
      (request) => {
        request.gait.provenance = evidence('changed-gait')
      },
      (request) => {
        request.terrain.id = 'changed-terrain'
        request.terrain.revision++
      },
      (request) => {
        request.terrain.contactAssessments[0].bearing = { kind: 'unknown' }
      },
      (request) => {
        request.load.id = 'changed-load'
        for (const assessment of request.terrain.contactAssessments)
          assessment.loadCaseId = request.load.id
      },
      (request) => {
        request.load.carried = {
          kind: 'attached',
          items: [
            {
              id: 'fruit',
              sourceId: 'fruit-source',
              sourceCoverage: 'partial',
              shape: { kind: 'unknown' },
              holderBodyId: 'base',
              localFrame: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
              massPropertiesId: 'mass'
            }
          ]
        }
      },
      (request) => {
        request.path.knots[1].time = 0.5
        request.evaluation.until = 0.5
        request.stance.phases[0].until = 0.5
        for (const assessment of request.terrain.contactAssessments)
          assessment.until = 0.5
      }
    ]
    for (const [index, change] of changes.entries()) {
      const next = structuredClone(raw)
      change(next)
      next.gait.id = `semantic-change-${index}`
      const request = readWalkingMotionRequest(next, source)
      const result = owner.prepare(request)
      expect(owner.isCurrent(previous)).toBe(false)
      expect(owner.work.preparations).toBe(index + 2)
      for (let read = 0; read < 100; read++) {
        expect(owner.read()).toBe(result)
        expect(owner.prepare(request)).toBe(result)
      }
      expect(owner.work.preparations).toBe(index + 2)
      previous = result
    }
    const builds = sourceOwner.work.builds
    const demand = getDemand()
    setDemand(
      Object.freeze({
        ...demand,
        configuration: Object.freeze({
          ...demand.configuration,
          clearanceMargin: { kind: 'bounded' as const, metres: 0.04 }
        })
      })
    )
    expect(owner.isCurrent(previous)).toBe(false)
    const refreshed = owner.prepare(readWalkingMotionRequest(raw, source))
    expect(refreshed.demand.configuration.clearanceMargin).toEqual({
      kind: 'bounded',
      metres: 0.04
    })
    expect(sourceOwner.work.builds).toBe(builds)
    sourceOwner.prepare(
      createSyntheticWalkingRobotDefinition({
        definitionId: 'replacement-source'
      })
    )
    expect(owner.isCurrent(refreshed)).toBe(false)
    expect(owner.read()).toBeUndefined()
  })

  it('consumes a real changed W1 scene without rebuilding the unchanged W2 source', () => {
    const { source, raw, owner, sourceOwner, setDemand } = fixture()
    const geometry = new SiteGeometry()
    const configuration = validateSceneDemandConfiguration({
      version: 1,
      route: {
        kind: 'soil-strip',
        bay: 0,
        stripId: 'strip-3',
        from: 0.25,
        until: 1.25
      },
      evidence: evidence('survey'),
      growth: { kind: 'bounded', coverage: 'complete', volumes: [] },
      clearanceMargin: { kind: 'bounded', metres: 0 }
    })
    let previous: ReturnType<typeof owner.prepare> | undefined
    for (const length of [2, 3]) {
      const farm = validateConfiguration({ ...DEFAULT_CONFIGURATION, length })
      const scene = geometry.prepareScene(farm, buildSiteMeshes(farm, geometry))
      const demand = prepareSceneDemand(farm, scene, configuration)
      setDemand(demand)
      if (previous) expect(owner.isCurrent(previous)).toBe(false)
      raw.terrain.sceneRevision = scene.revision
      raw.terrain.route.stripId = 'strip-3'
      raw.terrain.regions[0].binding = {
        kind: 'route-soil',
        bay: 0,
        stripId: 'strip-3'
      }
      const request = readWalkingMotionRequest(raw, source)
      const result = owner.prepare(request)
      expect(result.demand).toBe(demand)
      expect(result.source).toBe(source)
      expect(sourceOwner.work.builds).toBe(1)
      const work = { ...demand.work }
      for (let read = 0; read < 100; read++) expect(owner.read()).toBe(result)
      expect(demand.work).toEqual(work)
      previous = result
    }
    expect(owner.work.preparations).toBe(2)
  }, 30000)
})

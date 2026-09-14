import { describe, expect, it } from 'vitest'
import {
  createSyntheticWalkingRobotDefinition,
  readWalkingRobotDefinition
} from '../walking-robot-definition'
import { WalkingRobotSourceOwner } from '../walking-robot-source'
import {
  DEFAULT_CONFIGURATION,
  validateConfiguration
} from '../farm-configuration'
import { validateSceneDemandConfiguration } from '../scene-demand-configuration'
import { SiteGeometry } from '../../render-app/site-geometry'
import { buildSiteMeshes } from '../../render-app/site-projection'
import { prepareSceneDemand } from '../../simulation/scene-demand'
import {
  WALKING_MOTION_REQUEST_FORMAT,
  readWalkingMotionRequest
} from '../walking-motion-contract'

type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
    : T
const syntheticEvidence = (id: string) => ({
  kind: 'synthetic' as const,
  id,
  label: `${id} - synthetic test evidence`
})

it('admits only explicitly bound version-two source partitions and safe budgets', () => {
  const { source, request: raw } = fixture()
  const farm = validateConfiguration(DEFAULT_CONFIGURATION),
    geometry = new SiteGeometry()
  const scene = geometry.prepareScene(farm, buildSiteMeshes(farm, geometry))
  const soil = farm.strips.find((strip) => strip.kind === 'soil')
  if (!soil) throw new Error('Missing current soil strip')
  const demand = prepareSceneDemand(
    farm,
    scene,
    validateSceneDemandConfiguration({
      version: 1,
      route: {
        kind: 'soil-strip',
        bay: 0,
        stripId: soil.id,
        from: 0,
        until: 1
      },
      evidence: syntheticEvidence('current-survey'),
      growth: { kind: 'bounded', coverage: 'complete', volumes: [] },
      clearanceMargin: { kind: 'bounded', metres: 0 }
    })
  )
  const next = {
    ...raw,
    format: 'walking-motion-request/2',
    source,
    demand,
    targetContacts: [],
    externalSources: raw.terrain.regions.map((region) => ({
      sourceId: region.sourceId,
      regions: [
        {
          id: 'terrain-surface',
          kind: 'sheet',
          indexStart: 0,
          indexCount: region.shape.indices.length
        }
      ]
    })),
    budget: {
      ...raw.budget,
      maxRegionPairs: 1000000,
      maxExactPredicates: 10000000
    }
  }
  const admitted = readWalkingMotionRequest(next, source, demand)
  expect(admitted.format).toBe('walking-motion-request/2')
  if (admitted.format !== 'walking-motion-request/2')
    throw new Error('Missing version two admission')
  expect(admitted.source).toBe(source)
  expect(admitted.demand).toBe(demand)
  expect(Object.isFrozen(admitted.externalSources[0].regions[0])).toBe(true)
  expect(readWalkingMotionRequest(admitted, source, demand)).toBe(admitted)
  expect(() => readWalkingMotionRequest(next, source)).toThrow()
  expect(() =>
    readWalkingMotionRequest({ ...next, externalSources: [] }, source, demand)
  ).toThrow()
  expect(() =>
    readWalkingMotionRequest(
      {
        ...next,
        budget: {
          ...next.budget,
          maxExactPredicates: Number.MAX_SAFE_INTEGER + 1
        }
      },
      source,
      demand
    )
  ).toThrow()
  expect(() =>
    readWalkingMotionRequest(
      {
        ...next,
        externalSources: [
          {
            ...next.externalSources[0],
            regions: [{ ...next.externalSources[0].regions[0], indexCount: 0 }]
          }
        ]
      },
      source,
      demand
    )
  ).toThrow()
  expect(() => readWalkingMotionRequest(next, source, { ...demand })).toThrow()
  expect(() => readWalkingMotionRequest(next, { ...source }, demand)).toThrow()
  const target = [
    ...demand.targets.left,
    ...demand.targets.right,
    ...demand.targets.unassigned
  ][0]
  if (!target || !target.partitions[0])
    throw new Error('Missing current W1 target partition')
  const partition = target.partitions[0],
    reference = source.rig.contacts.supportTools[0]
  const contact = {
    from: 0,
    until: 1,
    purpose: 'support',
    robot: {
      part: reference.part,
      region: reference.patch.region,
      patch: reference.patch
    },
    target: {
      target,
      partition,
      ranges: [
        {
          indexStart: partition.partition.indexStart,
          indexCount: partition.partition.indexCount
        }
      ]
    }
  }
  const selected = readWalkingMotionRequest(
    { ...next, targetContacts: [contact] },
    source,
    demand
  )
  if (selected.format !== 'walking-motion-request/2')
    throw new Error('Missing selected source request')
  expect(selected.targetContacts[0].robot.patch).toBe(reference.patch)
  expect(selected.targetContacts[0].target.partition).toBe(partition)
  expect(() =>
    readWalkingMotionRequest(
      { ...next, targetContacts: [contact, contact] },
      source,
      demand
    )
  ).toThrow()
  expect(() =>
    readWalkingMotionRequest(
      { ...next, targetContacts: [{ ...contact, until: 0.5 }] },
      source,
      demand
    )
  ).toThrow()
  expect(() =>
    readWalkingMotionRequest(
      {
        ...next,
        targetContacts: [
          {
            ...contact,
            robot: { ...contact.robot, region: { ...contact.robot.region } }
          }
        ]
      },
      source,
      demand
    )
  ).toThrow()
  expect(() =>
    readWalkingMotionRequest(
      {
        ...next,
        targetContacts: [
          {
            ...contact,
            target: { ...contact.target, partition: { ...partition } }
          }
        ]
      },
      source,
      demand
    )
  ).toThrow()
  expect(() =>
    readWalkingMotionRequest(
      {
        ...next,
        targetContacts: [
          {
            ...contact,
            target: {
              ...contact.target,
              ranges: [
                {
                  indexStart: partition.partition.indexStart,
                  indexCount: partition.partition.indexCount + 3
                }
              ]
            }
          }
        ]
      },
      source,
      demand
    )
  ).toThrow()
})

function fixture() {
  const source = new WalkingRobotSourceOwner().prepare(
    createSyntheticWalkingRobotDefinition({ definitionId: 'motion-contract' })
  )
  const pathId = 'path-1',
    loadCaseId = 'load-empty'
  const assessments = source.rig.contacts.feet.map(({ patch }, index) => ({
    id: `contact-${index}`,
    footPatchId: patch.id,
    terrainRegionId: 'soil-region',
    pathId,
    from: 0,
    until: 1,
    loadCaseId,
    coverage: 'complete' as const,
    geometry: { status: 'admitted' as const, evidence: syntheticEvidence('g') },
    friction: { status: 'admitted' as const, evidence: syntheticEvidence('f') },
    bearing: { status: 'admitted' as const, evidence: syntheticEvidence('b') },
    sinkage: { status: 'admitted' as const, evidence: syntheticEvidence('s') }
  }))
  const request = {
    format: WALKING_MOTION_REQUEST_FORMAT,
    requestId: 'request-1',
    path: {
      id: pathId,
      intent: 'straight' as const,
      knots: [
        {
          time: 0,
          base: { position: [0, 0, 0], heading: 0, pitch: 0, roll: 0 },
          joints: structuredClone(source.rig.presets.stowed)
        },
        {
          time: 1,
          base: { position: [0, 0, 0.1], heading: 0, pitch: 0, roll: 0 },
          joints: structuredClone(source.rig.presets.stowed)
        }
      ]
    },
    evaluation: { from: 0, until: 1 },
    stance: {
      id: 'stance-1',
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
    gait: { id: 'gait-1', provenance: syntheticEvidence('gait') },
    terrain: {
      format: 'walking-terrain/1' as const,
      id: 'terrain-1',
      revision: 1,
      sceneRevision: 1,
      route: { bay: 0, stripId: 'soil-strip' },
      provenance: syntheticEvidence('terrain'),
      observations: {
        debris: {
          coverage: 'complete' as const,
          evidence: syntheticEvidence('debris')
        },
        height: {
          coverage: 'complete' as const,
          evidence: syntheticEvidence('height')
        },
        slope: {
          coverage: 'complete' as const,
          evidence: syntheticEvidence('slope')
        },
        rut: {
          coverage: 'complete' as const,
          evidence: syntheticEvidence('rut')
        }
      },
      regions: [
        {
          id: 'soil-region',
          classification: 'soil' as const,
          sourceId: 'terrain-source',
          shape: {
            kind: 'triangles' as const,
            positions: [-2, 0, -2, 2, 0, -2, 2, 0, 2, -2, 0, 2],
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
      provenance: syntheticEvidence('load'),
      crate: { kind: 'unknown' as const },
      carried: { kind: 'none' as const }
    },
    budget: { maxIntervals: 64, maxEnvelopePairs: 10000 }
  }
  return { source, request }
}

describe('walking motion request admission', () => {
  it('admits one exact complete detached and immutable request', () => {
    const { source, request } = fixture()
    const admitted = readWalkingMotionRequest(request, source)
    expect(admitted.format).toBe('walking-motion-request/1')
    expect(admitted.path.intent).toBe('straight')
    expect(admitted.path.knots).toHaveLength(2)
    expect(admitted.path.knots[0].joints.arms).toHaveLength(4)
    expect(admitted.path.knots[0].joints.legs).toHaveLength(6)
    expect(admitted.stance.phases[0].legs).toHaveLength(6)
    expect(Object.isFrozen(admitted)).toBe(true)
    expect(Object.isFrozen(admitted.terrain.regions[0].shape.positions)).toBe(
      true
    )
    request.path.knots[0].base.position[0] = 99
    expect(admitted.path.knots[0].base.position[0]).toBe(0)
    expect(JSON.stringify(admitted)).not.toMatch(/1\.2|wheel|tire|tread/)
  })

  it('rejects malformed path, stance, terrain, load and budgets', () => {
    const baseline = () => {
      const { source, request } = fixture()
      return {
        source,
        request: structuredClone(request) as Mutable<typeof request>
      }
    }
    const invalid: ReturnType<typeof baseline>[] = []
    const badFormat = baseline()
    ;(badFormat.request as { format: string }).format =
      'walking-motion-request/2'
    invalid.push(badFormat)
    const extra = baseline()
    ;(extra.request as typeof extra.request & { surprise?: boolean }).surprise =
      true
    invalid.push(extra)
    const duplicateTime = baseline()
    duplicateTime.request.path.knots[1].time = 0
    invalid.push(duplicateTime)
    const missingJoint = baseline()
    missingJoint.request.path.knots[0].joints.legs.pop()
    invalid.push(missingJoint)
    const offBoundary = baseline()
    offBoundary.request.stance.phases[0].until = 0.5
    invalid.push(offBoundary)
    const duplicateLeg = baseline()
    duplicateLeg.request.stance.phases[0].legs[1].chainId =
      duplicateLeg.request.stance.phases[0].legs[0].chainId
    invalid.push(duplicateLeg)
    const wrongPatch = baseline()
    wrongPatch.request.terrain.contactAssessments[0].footPatchId = 'other-foot'
    invalid.push(wrongPatch)
    const wrongPath = baseline()
    wrongPath.request.terrain.contactAssessments[0].pathId = 'other-path'
    invalid.push(wrongPath)
    const negativeBudget = baseline()
    negativeBudget.request.budget.maxIntervals = 0
    invalid.push(negativeBudget)
    const emptyCarried = baseline()
    Object.assign(emptyCarried.request.load, {
      carried: { kind: 'attached', items: [] }
    })
    invalid.push(emptyCarried)
    const badRoute = baseline()
    badRoute.request.terrain.route.bay = -1
    invalid.push(badRoute)
    for (const value of invalid)
      expect(() =>
        readWalkingMotionRequest(value.request, value.source)
      ).toThrow()
  })

  it('requires crate coverage independently of the canonical empty tray', () => {
    const { source, request } = fixture()
    expect(source.parts.some((part) => part.id.includes('tray'))).toBe(true)
    const admitted = readWalkingMotionRequest(request, source)
    expect(admitted.load.crate).toEqual({ kind: 'unknown' })
    const missing = structuredClone(request)
    Reflect.deleteProperty(missing.load, 'crate')
    expect(() => readWalkingMotionRequest(missing, source)).toThrow()
    expect(() =>
      readWalkingMotionRequest(
        {
          ...request,
          load: {
            id: request.load.id,
            provenance: request.load.provenance,
            state: 'empty',
            attachments: []
          }
        },
        source
      )
    ).toThrow()
  })

  it('preserves individual crate sources and rejects incomplete crate ownership', () => {
    const { source, request } = fixture()
    const crate = {
      kind: 'attached',
      sourceCoverage: 'complete',
      provenance: syntheticEvidence('crate'),
      sourceParts: [
        {
          id: 'crate-base',
          sourceId: 'crate-base-source',
          shape: request.terrain.regions[0].shape
        }
      ],
      holderBodyId: 'base',
      localFrames: [{ position: [0, 0, 0], rotation: [0, 0, 0, 1] }],
      massIdentity: 'crate-mass'
    }
    const attached = { ...request, load: { ...request.load, crate } }
    expect(readWalkingMotionRequest(attached, source).load.crate).toEqual(crate)
    for (const replacement of [
      { ...crate, sourceParts: [] },
      { ...crate, localFrames: [] },
      { ...crate, holderBodyId: 'some-arm' },
      { ...crate, massIdentity: '' },
      {
        ...crate,
        sourceParts: [...crate.sourceParts, ...crate.sourceParts],
        localFrames: [...crate.localFrames, ...crate.localFrames]
      }
    ])
      expect(() =>
        readWalkingMotionRequest(
          { ...attached, load: { ...attached.load, crate: replacement } },
          source
        )
      ).toThrow()
  })

  it('does not reuse admission against a different definition joint range', () => {
    const { source, request } = fixture()
    request.path.knots[0].joints = {
      ...request.path.knots[0].joints,
      carriage: 1.5
    }
    const admitted = readWalkingMotionRequest(request, source)
    const identicalSource = new WalkingRobotSourceOwner().prepare(
      source.definition
    )
    expect(() => readWalkingMotionRequest(admitted, identicalSource)).toThrow()
    const definition = structuredClone(
      createSyntheticWalkingRobotDefinition({ definitionId: 'narrow-lift' })
    )
    const narrowed = {
      ...definition,
      carriage: { ...definition.carriage, liftRange: [0.5, 1.4] as const }
    }
    const nextSource = new WalkingRobotSourceOwner().prepare(
      readWalkingRobotDefinition(narrowed)
    )
    expect(() => readWalkingMotionRequest(admitted, nextSource)).toThrow()
    expect(readWalkingMotionRequest(admitted, source)).toBe(admitted)
  })

  it('distinguishes explicit unknown carried geometry from malformed source', () => {
    const { source, request } = fixture()
    const item = {
      id: 'fruit',
      sourceId: 'fruit-source',
      sourceCoverage: 'partial',
      shape: { kind: 'unknown' },
      holderBodyId: 'base',
      localFrame: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
      massPropertiesId: 'fruit-mass'
    }
    const carried = {
      ...request,
      load: { ...request.load, carried: { kind: 'attached', items: [item] } }
    }
    expect(readWalkingMotionRequest(carried, source).load.carried).toEqual(
      carried.load.carried
    )
    for (const shape of [
      undefined,
      { kind: 'unknown', positions: [] },
      { kind: 'triangles', positions: [], indices: [] }
    ]) {
      expect(() =>
        readWalkingMotionRequest(
          {
            ...carried,
            load: {
              ...carried.load,
              carried: { kind: 'attached', items: [{ ...item, shape }] }
            }
          },
          source
        )
      ).toThrow()
    }
  })
})

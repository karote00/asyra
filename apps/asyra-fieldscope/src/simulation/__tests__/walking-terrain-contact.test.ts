import { describe, expect, it } from 'vitest'
import { createSyntheticWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import { WalkingRobotSourceOwner } from '../../domain/walking-robot-source'
import {
  readWalkingMotionRequest,
  type WalkingMotionRequest
} from '../../domain/walking-motion-contract'
import type { SceneDemand } from '../scene-demand'
import { evaluateWalkingTerrainContact } from '../walking-terrain-contact'

type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
    : T
const evidence = (id: string) => ({
  kind: 'synthetic' as const,
  id,
  label: `${id} - synthetic terrain test evidence`
})

function fixture() {
  const source = new WalkingRobotSourceOwner().prepare(
      createSyntheticWalkingRobotDefinition({ definitionId: 'terrain-contact' })
    ),
    pathId = 'terrain-path',
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
  const raw: Mutable<WalkingMotionRequest> = {
    format: 'walking-motion-request/1' as const,
    requestId: 'terrain-request',
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
          base: { position: [0, 0, 0.1], heading: 0, pitch: 0, roll: 0 },
          joints: structuredClone(source.rig.presets.stowed) as Mutable<
            typeof source.rig.presets.stowed
          >
        }
      ]
    },
    evaluation: { from: 0, until: 1 },
    stance: {
      id: 'terrain-stance',
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
    gait: { id: 'terrain-gait', provenance: evidence('gait') },
    terrain: {
      format: 'walking-terrain/1' as const,
      id: 'terrain-source',
      revision: 3,
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
      provenance: evidence('load'),
      crate: { kind: 'unknown' as const },
      carried: { kind: 'none' as const }
    },
    budget: { maxIntervals: 32, maxEnvelopePairs: 10000 }
  }
  const demand = {
    scene: { revision: 7 },
    route: { bay: 0, stripId: 'soil-strip' },
    channels: []
  } as unknown as SceneDemand
  return { source, raw, demand }
}

describe('walking terrain and support contact', () => {
  it('admits only exact complete soil foot contacts without stability claims', () => {
    const { source, raw, demand } = fixture()
    const request = readWalkingMotionRequest(raw, source)
    const result = evaluateWalkingTerrainContact(demand, source, request)
    expect(result.status).toBe('clear')
    expect(result.contacts).toHaveLength(6)
    expect(result.contacts.every(({ status }) => status === 'admitted')).toBe(
      true
    )
    expect(result.contacts[0]).toMatchObject({
      pathId: raw.path.id,
      loadCaseId: raw.load.id,
      terrainRegionId: 'soil-region'
    })
    expect(result).not.toHaveProperty('stable')
    expect(result).not.toHaveProperty('safe')
  })

  it('blocks a support foot on a W1-authored channel with an exact witness', () => {
    const { source, raw, demand } = fixture()
    const mutable = structuredClone(raw) as Mutable<typeof raw>
    const region = mutable.terrain.regions[0]
    region.classification = 'channel'
    region.binding = {
      kind: 'scene-channel',
      bay: 0,
      stripId: 'drain-strip'
    }
    const channelDemand = {
      ...demand,
      channels: [
        {
          bay: 0,
          stripId: 'drain-strip',
          relation: 'hard-exclusion',
          strip: { id: 'drain-strip', kind: 'drain', width: 0.2 },
          bounds: { min: [-1, -1, -1], max: [1, 1, 1] }
        }
      ] as SceneDemand['channels']
    }
    const result = evaluateWalkingTerrainContact(
      channelDemand,
      source,
      readWalkingMotionRequest(mutable, source)
    )
    expect(result.status).toBe('blocked')
    expect(result.reasons).toContain('support-on-authored-channel')
    expect(result.contacts.every(({ status }) => status === 'blocked')).toBe(
      true
    )
  })

  it('keeps sampled, missing and incomplete contact evidence unknown', () => {
    for (const name of ['height', 'slope', 'rut', 'debris'] as const) {
      for (const coverage of ['unknown', 'sampled'] as const) {
        const { source, raw, demand } = fixture()
        raw.terrain.observations[name] =
          coverage === 'unknown'
            ? { kind: 'unknown' }
            : { coverage, evidence: evidence(`sampled-${name}`) }
        const result = evaluateWalkingTerrainContact(
          demand,
          source,
          readWalkingMotionRequest(raw, source)
        )
        expect(result.status).toBe('unknown')
        expect(result.reasons).toContain(`terrain-${name}-coverage-incomplete`)
      }
    }
    const observation = fixture()
    const sampled = structuredClone(observation.raw) as Mutable<
      typeof observation.raw
    >
    sampled.terrain.observations.height = {
      coverage: 'sampled',
      evidence: evidence('sampled-height')
    }
    expect(
      evaluateWalkingTerrainContact(
        observation.demand,
        observation.source,
        readWalkingMotionRequest(sampled, observation.source)
      )
    ).toMatchObject({ status: 'unknown' })

    const relation = fixture()
    const incomplete = structuredClone(relation.raw) as Mutable<
      typeof relation.raw
    >
    incomplete.terrain.contactAssessments[0].friction = { kind: 'unknown' }
    const result = evaluateWalkingTerrainContact(
      relation.demand,
      relation.source,
      readWalkingMotionRequest(incomplete, relation.source)
    )
    expect(result.status).toBe('unknown')
    expect(result.reasons).toContain('contact-evidence-incomplete')
  })

  it('does not reuse contact evidence with the wrong patch, path, time or load', () => {
    const variants = ['footPatchId', 'pathId', 'from', 'loadCaseId'] as const
    for (const field of variants) {
      const { source, raw } = fixture()
      const invalid = structuredClone(raw) as Mutable<typeof raw>
      const assessment = invalid.terrain.contactAssessments[0]
      if (field === 'from') assessment.from = 0.5
      else assessment[field] = `wrong-${field}`
      expect(() => readWalkingMotionRequest(invalid, source)).toThrow()
    }
  })

  it('does not treat an all-swing schedule as admitted walking support', () => {
    const { source, raw, demand } = fixture()
    for (const leg of raw.stance.phases[0].legs) leg.state = { kind: 'swing' }
    const result = evaluateWalkingTerrainContact(
      demand,
      source,
      readWalkingMotionRequest(raw, source)
    )
    expect(result.status).toBe('unknown')
    expect(result.reasons).toContain('stance-contact-evidence-missing')
  })

  it('preserves a complete blocked relation when another property is unknown', () => {
    const { source, raw, demand } = fixture()
    raw.terrain.contactAssessments[0].friction = {
      status: 'blocked',
      evidence: evidence('blocked-friction')
    }
    raw.terrain.contactAssessments[0].sinkage = { kind: 'unknown' }
    const result = evaluateWalkingTerrainContact(
      demand,
      source,
      readWalkingMotionRequest(raw, source)
    )
    expect(result.status).toBe('blocked')
    expect(result.reasons).toContain('contact-assessment-blocked')
  })

  it('rejects stale scene or route authority as unknown terrain', () => {
    const { source, raw, demand } = fixture()
    const request = readWalkingMotionRequest(raw, source)
    const stale = evaluateWalkingTerrainContact(
      { ...demand, scene: { ...demand.scene, revision: 8 } },
      source,
      request
    )
    const otherRoute = evaluateWalkingTerrainContact(
      {
        ...demand,
        route: { ...demand.route, stripId: 'other-strip' }
      } as SceneDemand,
      source,
      request
    )
    expect(stale).toMatchObject({
      status: 'unknown',
      reasons: expect.arrayContaining(['terrain-scene-mismatch'])
    })
    expect(otherRoute).toMatchObject({
      status: 'unknown',
      reasons: expect.arrayContaining(['terrain-route-mismatch'])
    })
  })
})

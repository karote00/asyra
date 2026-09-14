import { describe, expect, it } from 'vitest'
import { WalkingQuasiStaticOwner } from '../walking-quasi-static'
import {
  readWalkingQuasiStaticRequest,
  type WalkingQuasiStaticRequest
} from '../../domain/walking-quasi-static-contract'
import { createSyntheticWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import { WalkingRobotSourceOwner } from '../../domain/walking-robot-source'
import type { WalkingMotionAdmission } from '../walking-motion'
import { WalkingMotionOwner } from '../walking-motion'
import type { WalkingMotionRequest } from '../../domain/walking-motion-contract'
import type { SceneDemand } from '../scene-demand'
import { evaluateWalkingRobotPose } from '../../domain/walking-robot-kinematics'
import { walkingMotionPoseAt } from '../walking-motion-interval'

type Mutable<T> = T extends readonly (infer U)[]
  ? Mutable<U>[]
  : T extends object
    ? { -readonly [K in keyof T]: Mutable<T[K]> }
    : T
const evidence = {
  kind: 'synthetic' as const,
  id: 'mechanics-evidence',
  label: 'mechanics - synthetic source and mass evidence'
}
const frame = { position: [0, 0, 0] as const, rotation: [0, 0, 0, 1] as const }
function fixture() {
  const sourceOwner = new WalkingRobotSourceOwner(),
    source = sourceOwner.prepare(
      createSyntheticWalkingRobotDefinition({ definitionId: 'mechanics-owner' })
    )
  const demand = {
    identity: {},
    revision: 1,
    scene: { revision: 1 },
    status: 'ready',
    reasons: [],
    configuration: { clearanceMargin: { kind: 'bounded', metres: 0 } },
    route: {
      bay: 0,
      stripId: 'soil',
      volume: { min: [-50, -50, -50], max: [50, 50, 50] }
    },
    channels: [],
    freePassage: { exclusions: [] }
  } as unknown as SceneDemand
  const relation = { status: 'admitted' as const, evidence }
  const request: WalkingMotionRequest = {
    format: 'walking-motion-request/1',
    requestId: 'motion',
    path: {
      id: 'path',
      intent: 'straight',
      knots: [0, 1].map((time) => ({
        time,
        base: { position: [0, 0, 0], heading: 0, pitch: 0, roll: 0 },
        joints: source.rig.presets.stowed
      }))
    },
    evaluation: { from: 0, until: 1 },
    gait: { id: 'gait', provenance: evidence },
    stance: {
      id: 'stance',
      phases: [
        {
          from: 0,
          until: 1,
          legs: source.rig.legChains.map((c, i) => ({
            chainId: c.id,
            state: { kind: 'support', contactAssessmentId: `contact-${i}` }
          }))
        }
      ]
    },
    terrain: {
      format: 'walking-terrain/1',
      id: 'terrain',
      revision: 1,
      sceneRevision: 1,
      route: { bay: 0, stripId: 'soil' },
      provenance: evidence,
      observations: {
        height: { coverage: 'complete', evidence },
        slope: { coverage: 'complete', evidence },
        rut: { coverage: 'complete', evidence },
        debris: { coverage: 'complete', evidence }
      },
      regions: [
        {
          id: 'soil-region',
          classification: 'soil',
          sourceId: 'soil-source',
          shape: {
            kind: 'triangles',
            positions: [-50, 0, -50, 50, 0, -50, 0, 0, 50],
            indices: [0, 1, 2]
          },
          frame,
          binding: { kind: 'route-soil', bay: 0, stripId: 'soil' },
          keepOut: { kind: 'none' }
        }
      ],
      contactAssessments: source.rig.contacts.feet.map((c, i) => ({
        id: `contact-${i}`,
        footPatchId: c.patch.id,
        terrainRegionId: 'soil-region',
        pathId: 'path',
        from: 0,
        until: 1,
        loadCaseId: 'load',
        coverage: 'complete',
        geometry: relation,
        friction: relation,
        bearing: relation,
        sinkage: relation
      }))
    },
    load: {
      id: 'load',
      provenance: evidence,
      crate: {
        kind: 'attached',
        sourceCoverage: 'partial',
        provenance: evidence,
        holderBodyId: 'base',
        massIdentity: 'crate-mass',
        sourceParts: [
          {
            id: 'crate-base',
            sourceId: 'crate-source',
            shape: {
              kind: 'triangles',
              positions: [0, 0, 0, 1, 0, 0, 0, 0, 1],
              indices: [0, 1, 2]
            }
          }
        ],
        localFrames: [frame]
      },
      carried: {
        kind: 'attached',
        items: [
          {
            id: 'fruit',
            sourceId: 'fruit-source',
            sourceCoverage: 'partial',
            shape: { kind: 'unknown' },
            holderBodyId: source.rig.armChains[0].toolBodyId,
            localFrame: frame,
            massPropertiesId: 'fruit-mass'
          }
        ]
      }
    },
    budget: { maxIntervals: 1, maxEnvelopePairs: 3000 }
  }
  const motionOwner = new WalkingMotionOwner({
    getCurrentSceneDemand: () => demand,
    getCurrentWalkingRobotSource: () => source
  })
  let motion: WalkingMotionAdmission = motionOwner.prepare(request)
  const coords = [
    [-10, -10],
    [10, -10],
    [10, 10],
    [-10, 10],
    [0, 0],
    [1, 1]
  ]
  const raw: Mutable<WalkingQuasiStaticRequest> = {
    format: 'walking-quasi-static-request/1',
    requestId: 'mechanics',
    motion: {
      revision: motion.revision,
      sourceId: source.id,
      sourceRevision: source.revision,
      terrainId: 'terrain',
      terrainRevision: 1,
      pathId: 'path',
      stanceId: 'stance',
      loadCaseId: 'load'
    },
    configuration: { id: 'left-high', kind: 'left-high-reach' },
    time: 0.5,
    phase: { from: 0, until: 1 },
    support: {
      plane: {
        kind: 'declared',
        frame: { position: [...frame.position], rotation: [...frame.rotation] },
        evidence
      },
      lineOfActionReserve: { kind: 'bounded', metres: 0, evidence },
      contacts: motion.contacts.map((c, i) => ({
        chainId: c.chainId,
        contactAssessmentId: c.assessment.id,
        footPatchId: c.patchReference.patch.id,
        terrainRegionId: c.terrainRegionId,
        position: { kind: 'plane-point', coordinates: coords[i], evidence }
      }))
    },
    loadMasses: {
      sourceMassPropertiesId: source.massProperties.id,
      crate: {
        kind: 'known',
        massIdentity: 'crate-mass',
        massKg: 2,
        holderLocalCoM: [0, 0, 0],
        evidence
      },
      carried: [
        {
          attachmentId: 'fruit',
          massPropertiesId: 'fruit-mass',
          properties: {
            kind: 'known',
            massKg: 0.2,
            localCoM: [0, 0, 0],
            evidence
          }
        }
      ]
    }
  }
  const owner = new WalkingQuasiStaticOwner({
    getCurrentWalkingMotion: () => motion
  })
  return {
    raw,
    owner,
    motion,
    sourceOwner,
    motionOwner,
    request,
    setMotion: (value: WalkingMotionAdmission) => {
      motion = value
    }
  }
}
describe('walking quasi-static owner', () => {
  it('uses one completed pose and every body/load once without overwriting W3 unknown', () => {
    const { raw, owner, motion, sourceOwner } = fixture(),
      result = owner.prepare(raw)
    expect(result.status).toBe('screened')
    expect(result.motion).toBe(motion)
    expect(motion.status).toBe('unknown')
    expect(result.work).toMatchObject({
      fk: 1,
      bodyMassVisits: 46,
      externalMassVisits: 2,
      contactVisits: 6,
      hullPreparations: 1,
      momentMassVisits: 38
    })
    expect(result.armMoments).toHaveLength(4)
    expect(sourceOwner.work.builds).toBe(1)
    expect(JSON.stringify(result)).not.toContain('"safe"')
    const pose = evaluateWalkingRobotPose(
      motion.source,
      walkingMotionPoseAt(motion.path, raw.time)
    )
    expect(result.pose.bodyTransforms).toEqual(pose.bodyTransforms)
    if (result.centreOfMass.kind !== 'known') throw Error('Expected mass')
    const total =
      motion.source.massProperties.bodies.reduce(
        (sum, b) => sum + b.massKg,
        0
      ) + 2.2
    expect(result.centreOfMass.totalMass.low).toBeLessThanOrEqual(total)
    expect(result.centreOfMass.totalMass.high).toBeGreaterThanOrEqual(total)
    expect(result.armMoments[0].root.bodyIds).toHaveLength(5)
    expect(result.armMoments[0].shoulder.bodyIds).toHaveLength(4)
    expect(result.armMoments[0].root.loadIds).toEqual(['fruit'])
    expect(
      result.armMoments.every((arm) => !arm.root.loadIds.includes('crate'))
    ).toBe(true)
  })
  it('reuses only admitted immutable inputs, invalidates old results and does no malformed work', () => {
    const { raw, owner, motion, setMotion } = fixture(),
      request = readWalkingQuasiStaticRequest(raw, motion),
      first = owner.prepare(request),
      before = { ...owner.work }
    for (let i = 0; i < 100; i++) {
      expect(owner.prepare(request)).toBe(first)
      expect(owner.read()).toBe(first)
      expect(owner.isCurrent(first)).toBe(true)
    }
    expect(owner.work).toEqual(before)
    expect(() => owner.prepare({ ...raw, time: NaN })).toThrow()
    expect(owner.work).toEqual(before)
    const second = owner.prepare({ ...raw, time: 0.6 })
    expect(owner.isCurrent(first)).toBe(false)
    expect(owner.isCurrent(second)).toBe(true)
    setMotion({ ...motion, identity: Object.freeze({}) })
    expect(owner.read()).toBeUndefined()
    expect(() => owner.prepare(request)).toThrow()
    expect(owner.work.preparations).toBe(2)
    owner.clear()
    expect(owner.read()).toBeUndefined()
  })
  it('does not reuse shallow-frozen raw nested state', () => {
    const { raw, owner } = fixture(),
      shallow = Object.freeze(raw),
      first = owner.prepare(shallow)
    raw.configuration.id = 'changed'
    const second = owner.prepare(shallow)
    expect(second).not.toBe(first)
    expect(second.configuration.id).toBe('changed')
  })
  it('preserves known arm moments when crate mass, support or reserve is unknown', () => {
    for (const key of ['crate', 'plane', 'reserve', 'contact'] as const) {
      const { raw, owner } = fixture()
      if (key === 'crate') raw.loadMasses.crate = { kind: 'unknown' }
      if (key === 'plane') raw.support.plane = { kind: 'unknown' }
      if (key === 'reserve')
        raw.support.lineOfActionReserve = { kind: 'unknown' }
      if (key === 'contact')
        raw.support.contacts[0].position = { kind: 'unknown' }
      const result = owner.prepare(raw)
      expect(result.status).toBe('unknown')
      expect(result.armMoments.every((arm) => arm.root.kind === 'known')).toBe(
        true
      )
      if (key === 'reserve') expect(result.projection.kind).toBe('known')
    }
  })
  it('reports arithmetic overflow as unknown quantities, never known infinities', () => {
    const { raw, owner } = fixture()
    if (raw.loadMasses.crate.kind === 'known')
      raw.loadMasses.crate.massKg = Number.MAX_VALUE
    const result = owner.prepare(raw)
    expect(result.status).toBe('unknown')
    expect(result.centreOfMass.kind).toBe('unknown')
    expect(result.armMoments.every((arm) => arm.root.kind === 'known')).toBe(
      true
    )
    const held = fixture()
    const properties = held.raw.loadMasses.carried[0].properties
    if (properties.kind === 'known') properties.massKg = Number.MAX_VALUE
    const heldResult = held.owner.prepare(held.raw)
    expect(heldResult.armMoments[0].root.kind).toBe('unknown')
    expect(heldResult.reasons).toContain('arm-moment-unknown')
  })
  it('requires admitted complete contacts and slope while retaining independent mass results', () => {
    for (const variant of ['sampled', 'blocked', 'unknown', 'slope'] as const) {
      const { raw, owner, motion, setMotion } = fixture()
      const contacts = motion.contacts.map((c, i) =>
        i === 0
          ? {
              ...c,
              status:
                variant === 'blocked'
                  ? ('blocked' as const)
                  : ('unknown' as const),
              assessment: {
                ...c.assessment,
                coverage:
                  variant === 'sampled'
                    ? ('sampled' as const)
                    : c.assessment.coverage
              }
            }
          : c
      )
      const next = {
        ...motion,
        identity: Object.freeze({}),
        contacts: variant === 'slope' ? motion.contacts : contacts,
        terrain:
          variant === 'slope'
            ? {
                ...motion.terrain,
                observations: {
                  ...motion.terrain.observations,
                  slope: { kind: 'unknown' as const }
                }
              }
            : motion.terrain
      }
      setMotion(next)
      const result = owner.prepare(raw)
      expect(result.status).toBe('unknown')
      expect(result.centreOfMass.kind).toBe('known')
    }
  })
  it('binds plane, contact, load and reserve changes to one new preparation', () => {
    const { raw, owner, sourceOwner, motionOwner } = fixture(),
      sourceWork = { ...sourceOwner.work },
      motionWork = { ...motionOwner.work }
    owner.prepare(raw)
    for (const field of ['plane', 'contact', 'load', 'reserve']) {
      const changed = structuredClone(raw)
      if (field === 'plane' && changed.support.plane.kind === 'declared')
        changed.support.plane.frame.position[1] = 0.1
      if (
        field === 'contact' &&
        changed.support.contacts[0].position.kind === 'plane-point'
      )
        changed.support.contacts[0].position.coordinates[0] = -11
      if (field === 'load' && changed.loadMasses.crate.kind === 'known')
        changed.loadMasses.crate.massKg = 3
      if (
        field === 'reserve' &&
        changed.support.lineOfActionReserve.kind === 'bounded'
      )
        changed.support.lineOfActionReserve.metres = 0.01
      owner.prepare(changed)
    }
    expect(owner.work.preparations).toBe(5)
    expect(sourceOwner.work).toEqual(sourceWork)
    expect(motionOwner.work).toEqual(motionWork)
  })
  it('matches independent completed-pose root and shoulder gravity moment sums', () => {
    const { raw, owner, motion } = fixture(),
      result = owner.prepare(raw),
      chain = motion.source.rig.armChains[0],
      masses = result.pose.massProperties.bodies,
      bodyFrames = result.pose.bodyTransforms
    const root = result.pose.frames.armRoots.find(
      (item) => item.chainId === chain.id
    )
    const shoulder = bodyFrames.find((item) => item.id === chain.bodyIds[1])
    const fruit = bodyFrames.find((item) => item.id === chain.toolBodyId)
    if (!root || !shoulder || !fruit) throw Error('Expected authored frames')
    for (const [part, pivot, ids] of [
      [result.armMoments[0].root, root.position, chain.bodyIds],
      [
        result.armMoments[0].shoulder,
        shoulder.transform.position,
        chain.bodyIds.slice(1)
      ]
    ] as const) {
      const inputs = [
        ...masses.filter((m) => ids.includes(m.bodyId)),
        { massKg: 0.2, position: fruit.transform.position }
      ]
      const tx = inputs.reduce(
        (sum, m) => sum + (m.position[2] - pivot[2]) * m.massKg * 9.80665,
        0
      )
      const tz = inputs.reduce(
        (sum, m) => sum - (m.position[0] - pivot[0]) * m.massKg * 9.80665,
        0
      )
      if (part.kind !== 'known' || !part.vector || !part.magnitude)
        throw Error('Expected moment')
      expect(part.vector[0].low).toBeLessThanOrEqual(tx)
      expect(part.vector[0].high).toBeGreaterThanOrEqual(tx)
      expect(part.vector[2].low).toBeLessThanOrEqual(tz)
      expect(part.vector[2].high).toBeGreaterThanOrEqual(tz)
      expect(part.magnitude.low).toBeLessThanOrEqual(Math.hypot(tx, tz))
      expect(part.magnitude.high).toBeGreaterThanOrEqual(Math.hypot(tx, tz))
    }
  })
  it('keeps left/right reach, return and bilateral as complete separate configurations', () => {
    const { raw, owner } = fixture()
    for (const kind of [
      'left-high-reach',
      'right-high-reach',
      'carried-load-return',
      'bilateral-working'
    ] as const) {
      const result = owner.prepare({
        ...raw,
        configuration: { id: kind, kind }
      })
      expect(result.configuration.kind).toBe(kind)
      expect(result.armMoments).toHaveLength(4)
      expect(result.work.fk).toBe(1)
    }
    expect(owner.work.preparations).toBe(4)
  })
})

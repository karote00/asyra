import { describe, expect, it } from 'vitest'
import { readWalkingQuasiStaticRequest } from '../walking-quasi-static-contract'
import { createSyntheticWalkingRobotDefinition } from '../walking-robot-definition'
import { WalkingRobotSourceOwner } from '../walking-robot-source'
import type { WalkingMotionAdmission } from '../../simulation/walking-motion'

const evidence = { kind: 'synthetic', id: 'test', label: 'test - synthetic' }
function fixture() {
  const source = new WalkingRobotSourceOwner().prepare(
    createSyntheticWalkingRobotDefinition({ definitionId: 'mechanics' })
  )
  const motion = {
    identity: Object.freeze({}),
    revision: 1,
    source,
    terrain: { id: 'terrain', revision: 2 },
    path: { id: 'path' },
    stance: { id: 'stance', phases: [{ from: 0, until: 1, legs: [] }] },
    contacts: [],
    evaluation: { from: 0, until: 1 },
    load: { id: 'load', crate: { kind: 'unknown' }, carried: { kind: 'none' } }
  } as unknown as WalkingMotionAdmission
  const raw = {
    format: 'walking-quasi-static-request/1',
    requestId: 'assessment',
    motion: {
      revision: 1,
      sourceId: source.id,
      sourceRevision: source.revision,
      terrainId: 'terrain',
      terrainRevision: 2,
      pathId: 'path',
      stanceId: 'stance',
      loadCaseId: 'load'
    },
    configuration: { id: 'left', kind: 'left-high-reach' },
    time: 0.5,
    phase: { from: 0, until: 1 },
    support: {
      plane: {
        kind: 'declared',
        frame: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
        evidence
      },
      contacts: [],
      lineOfActionReserve: { kind: 'bounded', metres: 0, evidence }
    },
    loadMasses: {
      sourceMassPropertiesId: source.massProperties.id,
      crate: { kind: 'unknown' },
      carried: []
    }
  }
  return { motion, raw }
}

describe('walking quasi-static request admission', () => {
  it('detaches, deeply freezes and binds admission to the exact W3 identity', () => {
    const { raw, motion } = fixture()
    const request = readWalkingQuasiStaticRequest(raw, motion)
    raw.support.plane.frame.position[0] = 5
    expect(request.support.plane).toMatchObject({
      frame: { position: [0, 0, 0] }
    })
    expect(Object.isFrozen(request.support.contacts)).toBe(true)
    expect(readWalkingQuasiStaticRequest(request, motion)).toBe(request)
    expect(() =>
      readWalkingQuasiStaticRequest(request, {
        ...motion,
        identity: Object.freeze({})
      })
    ).toThrow()
  })
  it('rejects malformed keys, identities, ranges and unpaired load/contact data', () => {
    const mutations = [
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        r.extra = true
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        Reflect.deleteProperty(r.support, 'lineOfActionReserve')
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        Reflect.set(r.motion, 'requestId', 'unavailable-W3-field')
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        r.motion.revision++
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        r.motion.sourceId = 'wrong'
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        r.motion.terrainRevision++
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        r.motion.pathId = 'wrong'
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        r.motion.stanceId = 'wrong'
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        r.motion.loadCaseId = 'wrong'
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        r.time = NaN
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        r.time = 2
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        r.phase.until = 0.5
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        r.support.lineOfActionReserve.metres = -1
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        r.support.plane.frame.rotation = [0, 0, 0, 0]
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        r.loadMasses.sourceMassPropertiesId = 'wrong'
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        Reflect.set(r.loadMasses, 'crate', {
          kind: 'known',
          massIdentity: 'invented',
          massKg: 1,
          holderLocalCoM: [0, 0, 0],
          evidence
        })
      },
      (r: ReturnType<typeof fixture>['raw'] & { extra?: boolean }) => {
        Reflect.set(r.loadMasses, 'carried', [
          {
            attachmentId: 'extra',
            massPropertiesId: 'extra',
            properties: { kind: 'unknown' }
          }
        ])
      }
    ]
    for (const mutate of mutations) {
      const { raw, motion } = fixture()
      mutate(raw)
      expect(() => readWalkingQuasiStaticRequest(raw, motion)).toThrow()
    }
  })
  it('retains explicit unknown evidence instead of converting it to zero', () => {
    const { raw, motion } = fixture()
    const request = readWalkingQuasiStaticRequest(
      {
        ...raw,
        support: {
          ...raw.support,
          plane: { kind: 'unknown' },
          lineOfActionReserve: { kind: 'unknown' }
        }
      },
      motion
    )
    expect(request.support.lineOfActionReserve).toEqual({ kind: 'unknown' })
    expect(request.loadMasses.crate).toEqual({ kind: 'unknown' })
  })
  it('binds support contacts and known/unknown external masses bijectively', () => {
    const { motion, raw } = fixture(),
      foot = motion.source.rig.contacts.feet[0],
      chain = motion.source.rig.legChains[0]
    const contact = {
      chainId: chain.id,
      patchReference: foot,
      assessment: { id: 'contact' },
      terrainRegionId: 'soil',
      pathId: 'path',
      loadCaseId: 'load',
      from: 0,
      until: 1
    }
    const bound = {
      ...motion,
      stance: {
        id: 'stance',
        phases: [
          {
            from: 0,
            until: 1,
            legs: [
              {
                chainId: chain.id,
                state: { kind: 'support', contactAssessmentId: 'contact' }
              }
            ]
          }
        ]
      },
      contacts: [contact],
      load: {
        id: 'load',
        crate: { kind: 'attached', massIdentity: 'crate' },
        carried: {
          kind: 'attached',
          items: [
            { id: 'fruit', massPropertiesId: 'fruit-mass' },
            { id: 'fruit-unknown', massPropertiesId: 'unknown-mass' }
          ]
        }
      }
    } as unknown as WalkingMotionAdmission
    const input = {
      ...raw,
      support: {
        ...raw.support,
        contacts: [
          {
            chainId: chain.id,
            contactAssessmentId: 'contact',
            footPatchId: foot.patch.id,
            terrainRegionId: 'soil',
            position: { kind: 'plane-point', coordinates: [0, 0], evidence }
          }
        ]
      },
      loadMasses: {
        ...raw.loadMasses,
        crate: {
          kind: 'known',
          massIdentity: 'crate',
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
          },
          {
            attachmentId: 'fruit-unknown',
            massPropertiesId: 'unknown-mass',
            properties: { kind: 'unknown' }
          }
        ]
      }
    }
    expect(
      readWalkingQuasiStaticRequest(input, bound).loadMasses.carried
    ).toHaveLength(2)
    const mutations = [
      (r: typeof input) => {
        r.support.contacts = []
      },
      (r: typeof input) => {
        r.support.contacts.push(r.support.contacts[0])
      },
      (r: typeof input) => {
        r.support.contacts[0].chainId = 'wrong'
      },
      (r: typeof input) => {
        r.support.contacts[0].contactAssessmentId = 'wrong'
      },
      (r: typeof input) => {
        r.support.contacts[0].footPatchId = 'neighbor'
      },
      (r: typeof input) => {
        r.support.contacts[0].terrainRegionId = 'wrong'
      },
      (r: typeof input) => {
        r.loadMasses.crate.massIdentity = 'wrong'
      },
      (r: typeof input) => {
        r.loadMasses.crate.massKg = 0
      },
      (r: typeof input) => {
        r.loadMasses.crate.holderLocalCoM[0] = NaN
      },
      (r: typeof input) => {
        r.loadMasses.carried.pop()
      },
      (r: typeof input) => {
        r.loadMasses.carried[1] = r.loadMasses.carried[0]
      },
      (r: typeof input) => {
        r.loadMasses.carried[0].massPropertiesId = 'wrong'
      },
      (r: typeof input) => {
        r.loadMasses.carried[0].properties.massKg = -1
      },
      (r: typeof input) => {
        const centre = r.loadMasses.carried[0].properties.localCoM
        if (!centre) throw Error('Expected known fixture mass')
        centre[1] = NaN
      }
    ]
    for (const mutate of mutations) {
      const copy = structuredClone(input)
      mutate(copy)
      expect(() => readWalkingQuasiStaticRequest(copy, bound)).toThrow()
    }
    for (const changed of [
      { ...contact, pathId: 'wrong' },
      { ...contact, loadCaseId: 'wrong' },
      { ...contact, from: 0.1 }
    ])
      expect(() =>
        readWalkingQuasiStaticRequest(input, {
          ...bound,
          contacts: [changed]
        } as unknown as WalkingMotionAdmission)
      ).toThrow()
  })
})

import { describe, expect, it } from 'vitest'
import {
  createSyntheticWalkingRobotDefinition,
  readWalkingRobotDefinition
} from '../walking-robot-definition'
import { WalkingRobotSourceOwner } from '../walking-robot-source'

function bounds(positions: readonly number[]) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let offset = 0; offset < positions.length; offset += 3)
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], positions[offset + axis])
      max[axis] = Math.max(max[axis], positions[offset + axis])
    }
  return { min, max }
}

describe('walking robot canonical source', () => {
  it('owns every expected chain, body, joint and closed source part once', () => {
    const source = new WalkingRobotSourceOwner().prepare(
      createSyntheticWalkingRobotDefinition({ definitionId: 'source-contract' })
    )
    expect(source.rig.armChains.map(({ id }) => id).sort()).toEqual([
      'left-cutter',
      'left-support',
      'right-cutter',
      'right-support'
    ])
    expect(source.rig.legChains.map(({ id }) => id).sort()).toEqual([
      'left-front',
      'left-middle',
      'left-rear',
      'right-front',
      'right-middle',
      'right-rear'
    ])
    expect(new Set(source.rig.bodies.map(({ id }) => id)).size).toBe(
      source.rig.bodies.length
    )
    expect(new Set(source.rig.joints.map(({ id }) => id)).size).toBe(
      source.rig.joints.length
    )
    expect(
      new Set(source.rig.joints.map(({ childBodyId }) => childBodyId)).size
    ).toBe(source.rig.joints.length)
    const bodyIds = new Set(source.rig.bodies.map(({ id }) => id))
    expect(
      source.rig.joints.every(
        ({ parentBodyId, childBodyId }) =>
          bodyIds.has(parentBodyId) && bodyIds.has(childBodyId)
      )
    ).toBe(true)
    for (const body of source.rig.bodies)
      for (const part of body.parts) {
        expect(part.bodyId).toBe(body.id)
        expect(
          source.parts.filter((candidate) => candidate === part)
        ).toHaveLength(1)
        expect(part.material.evidence).toEqual({
          kind: 'synthetic',
          id: 'walking-source-materials-v1',
          label: 'Walking robot source materials - synthetic assumptions'
        })
        expect(part.material.evidence).not.toBe(
          source.definition.geometryEvidence
        )
      }
    for (const part of source.parts) {
      expect(part.regions).toHaveLength(1)
      expect(part.regions[0].kind).toBe('closed-solid')
      expect(part.regions[0].indexCount).toBe(part.shape.indices.length)
      expect(bounds(part.shape.positions)).toEqual({
        min: part.size.map((value) => -value / 2),
        max: part.size.map((value) => value / 2)
      })
      for (const patch of part.patches)
        for (const range of patch.ranges) {
          expect(patch.region).toBe(part.regions[0])
          expect(range.indexStart + range.indexCount).toBeLessThanOrEqual(
            part.shape.indices.length
          )
        }
    }
    expect(source.parts.map(({ id }) => id).join('|')).not.toMatch(
      /wheel|tire|tread|hub|axle|single-wrist/
    )
    expect(
      source.rig.joints.find(({ id }) => id === 'carriage-lift')
    ).toMatchObject({ axis: 'y', motion: 'prismatic' })
    for (const chain of source.rig.armChains)
      expect(
        chain.jointIds.map(
          (id) => source.rig.joints.find((joint) => joint.id === id)?.axis
        )
      ).toEqual(['y', 'x', 'x', 'x'])
    for (const chain of source.rig.legChains)
      expect(
        chain.jointIds.map(
          (id) => source.rig.joints.find((joint) => joint.id === id)?.axis
        )
      ).toEqual(['z', 'x', 'x'])
  })

  it('keeps synthetic material assumptions distinct from measured geometry evidence', () => {
    const raw = {
      ...structuredClone(
        createSyntheticWalkingRobotDefinition({
          definitionId: 'measured-shape'
        })
      ),
      geometryEvidence: {
        kind: 'measured' as const,
        id: 'geometry-survey-12'
      }
    }
    const definition = readWalkingRobotDefinition(raw)
    const source = new WalkingRobotSourceOwner().prepare(definition)
    expect(source.definition.geometryEvidence).toEqual({
      kind: 'measured',
      id: 'geometry-survey-12'
    })
    expect(
      source.parts.every(
        ({ material }) =>
          material.evidence.kind === 'synthetic' &&
          material.evidence.id === 'walking-source-materials-v1'
      )
    ).toBe(true)
  })

  it('publishes distinct loci without granting contact or collision permission', () => {
    const source = new WalkingRobotSourceOwner().prepare(
      createSyntheticWalkingRobotDefinition({ definitionId: 'patches' })
    )
    expect(source.rig.contacts.feet).toHaveLength(6)
    expect(source.rig.contacts.supportTools).toHaveLength(2)
    expect(source.rig.contacts.cuttingEdges).toHaveLength(2)
    expect(
      new Set(source.rig.contacts.feet.map(({ patch }) => patch.id)).size
    ).toBe(6)
    expect(
      source.rig.contacts.supportTools.every(
        ({ part }) => part.material.material === 'synthetic-soft-textile'
      )
    ).toBe(true)
    expect(
      source.rig.contacts.cuttingEdges.every(
        ({ part, patch }) =>
          part.material.material === 'synthetic-hardened-steel' &&
          part.size[0] < part.size[2] &&
          patch.ranges[0].indexStart === 6
      )
    ).toBe(true)
    expect(source.parts.filter(({ id }) => id.endsWith('-guard'))).toHaveLength(
      4
    )
    for (const jointInterface of source.rig.jointInterfaces) {
      const joint = source.rig.joints.find(
        ({ id }) => id === jointInterface.jointId
      )
      expect(joint).toBeDefined()
      expect(jointInterface.frame).toBe(joint?.frame)
      expect(jointInterface.axis).toBe(joint?.axis)
      expect(jointInterface.domain).toBe(joint?.domain)
      expect(jointInterface.materialInterface).toBe('unmodeled')
      expect(jointInterface.parentPatches).toEqual([])
      expect(jointInterface.childPatches).toEqual([])
      expect(jointInterface).not.toHaveProperty('envelope')
      expect(jointInterface).not.toHaveProperty('collisionExemption')
    }
  })

  it('binds complete positive mass properties and a one-definition lifetime', () => {
    const owner = new WalkingRobotSourceOwner()
    const definition = createSyntheticWalkingRobotDefinition({
      definitionId: 'lifetime-a'
    })
    const first = owner.prepare(definition)
    expect(owner.prepare(definition)).toBe(first)
    expect(owner.read()).toBe(first)
    expect(owner.isCurrent(first)).toBe(true)
    expect(owner.work.builds).toBe(1)
    expect(first.massProperties.definition).toBe(definition)
    expect(first.massProperties.totalMassKg).toBeGreaterThan(40)
    expect(
      first.massProperties.bodies.every(
        ({ massKg, localCoM }) => massKg > 0 && localCoM.every(Number.isFinite)
      )
    ).toBe(true)
    expect(
      new Set(first.massProperties.bodies.map(({ bodyId }) => bodyId))
    ).toEqual(new Set(first.rig.bodies.map(({ id }) => id)))
    const next = owner.prepare(
      readWalkingRobotDefinition({
        ...structuredClone(definition),
        definitionId: 'lifetime-b'
      })
    )
    expect(next).not.toBe(first)
    expect(owner.isCurrent(first)).toBe(false)
    expect(owner.work.builds).toBe(2)
    expect(() =>
      owner.evaluate(first, {
        base: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
        joints: first.rig.presets.stowed
      })
    ).toThrow(/Stale/)
    expect(
      owner.evaluate(next, {
        base: { position: [0, 0, 0], rotation: [0, 0, 0, 1] },
        joints: next.rig.presets.stowed
      }).source
    ).toBe(next)
    owner.clear()
    expect(owner.read()).toBeUndefined()
    expect(owner.isCurrent(next)).toBe(false)
  })
})

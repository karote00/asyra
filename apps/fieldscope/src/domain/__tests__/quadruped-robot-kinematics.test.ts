import { describe, expect, it } from 'vitest'
import { Quaternion, Vector3 } from 'three'
import { createSyntheticQuadrupedRobotDefinition } from '../quadruped-robot-definition'
import { createSyntheticBasketInput } from '../basket-interface'
import {
  QuadrupedRobotSourceOwner,
  freezeSource
} from '../quadruped-robot-source'
import { WalkingSourceRelationEvaluator } from '../../simulation/walking-source-relation'
import {
  prepareQueryExactForwardFrame,
  prepareQueryForwardFrame,
  transformQueryPoint
} from '../../simulation/ray-query'
import {
  add,
  subtract,
  multiply,
  interval,
  type Interval
} from '../scalar-arithmetic'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  evaluateArticulatedTransforms,
  composeRigidTransform
} from '../walking-robot-kinematics'
import type { WalkingRigidTransform } from '../walking-robot-definition'
import type { WalkingPatchReference } from '../walking-robot-source'

const fixture = () => {
  const owner = new QuadrupedRobotSourceOwner()
  const source = owner.prepare(createSyntheticQuadrupedRobotDefinition())
  const mount = owner.mount(source, createSyntheticBasketInput([0.6, 0.2, 1]))
  return { owner, source, mount }
}
function required<T>(value: T | undefined): T {
  if (value === undefined)
    throw new Error('Missing required source fixture value')
  return value
}

describe('quadruped canonical FK and candidate poses', () => {
  it('publishes original frame chains in the existing single FK traversal', () => {
    const base: WalkingRigidTransform = {
      position: [0.13, 0.42, 0.28],
      rotation: [0, Math.sin(0.135), 0, Math.cos(0.135)]
    }
    const fixedFrame: WalkingRigidTransform = {
      position: [0.025, 0.5, -0.3],
      rotation: [0, 0, 0, 1]
    }
    const jointFrame: WalkingRigidTransform = {
      position: [0, 0, 0.4],
      rotation: [0, 0, 0, 1]
    }
    let fixedReads = 0,
      jointReads = 0,
      valueReads = 0
    const bodies = [
      {
        id: 'base',
        parentBodyId: null,
        attachment: 'root' as const,
        parts: []
      },
      {
        id: 'mount',
        parentBodyId: 'base',
        attachment: 'fixed' as const,
        parts: [],
        get fixedFrame() {
          fixedReads++
          return fixedFrame
        }
      },
      {
        id: 'joint',
        parentBodyId: 'mount',
        attachment: 'joint' as const,
        parts: []
      }
    ]
    const joints = [
      {
        id: 'joint',
        parentBodyId: 'mount',
        childBodyId: 'joint',
        motion: 'revolute' as const,
        axis: 'x' as const,
        domain: [-1, 1] as const,
        get frame() {
          jointReads++
          return jointFrame
        }
      }
    ]
    const values = new Map([['joint', 0.31]])
    const get = values.get.bind(values)
    values.get = (id: string) => {
      valueReads++
      return get(id)
    }
    const chains = new Map<string, readonly WalkingRigidTransform[]>()
    const collected: string[] = []
    const transforms = evaluateArticulatedTransforms(
      bodies,
      joints,
      values,
      base,
      (id, frames) => {
        collected.push(id)
        chains.set(id, frames)
      }
    )
    expect(collected).toEqual(['base', 'mount', 'joint'])
    expect([fixedReads, jointReads, valueReads]).toEqual([1, 1, 1])
    expect(chains.get('base')?.[0]).toBe(base)
    expect(chains.get('mount')?.[0]).toBe(fixedFrame)
    expect(chains.get('joint')?.[1]).toBe(jointFrame)
    expect(chains.get('joint')?.slice(2)).toEqual(chains.get('mount'))
    for (const [id, chain] of chains) {
      expect(Object.isFrozen(chain)).toBe(true)
      const folded = chain.reduceRight(
        (parent, frame) => composeRigidTransform(parent, frame),
        { position: [0, 0, 0], rotation: [0, 0, 0, 1] } as WalkingRigidTransform
      )
      expect(folded).toEqual(transforms.get(id))
    }
  })
  it('uses every declared joint and gives three poses from one immutable source', () => {
    const { owner, source, mount } = fixture()
    for (const joints of Object.values(source.definition.presets)) {
      const result = owner.evaluate(source, joints, mount)
      expect(result.source).toBe(source)
      expect(result.mount).toBe(mount)
      expect(owner.isCurrentPose({ ...result })).toBe(false)
      expect(result.bodyTransforms.length).toBe(source.rig.bodies.length)
      expect(result.frames.tools).toHaveLength(4)
      expect(result.frames.feet).toHaveLength(4)
      for (const foot of result.frames.feet) {
        expect(foot.position[1]).toBeCloseTo(0, 10)
        const up = new Vector3(0, 1, 0).applyQuaternion(
          new Quaternion(...foot.rotation)
        )
        expect(up.y).toBeCloseTo(1, 10)
      }
    }
    expect(owner.work.robotBuilds).toBe(1)
    expect(owner.work.basketBuilds).toBe(1)
  })

  it('moves only the selected side for a lift and pitches the entire arm about its actual root', () => {
    const { owner, source, mount } = fixture()
    const before = owner.evaluate(
      source,
      source.definition.presets.travel,
      mount
    )
    const lifted = structuredClone(source.definition.presets.travel)
    const raw = { ...lifted, lifts: { left: 0.4, right: 0 } }
    const after = owner.evaluate(source, raw, mount)
    for (const root of before.frames.armRoots) {
      const next = after.frames.armRoots.find(
        (item) => item.chainId === root.chainId
      )
      if (!next) throw new Error('Missing arm root')
      expect(next.position[1] - root.position[1]).toBeCloseTo(
        root.chainId.startsWith('left') ? 0.4 : 0,
        11
      )
    }
    const pitched = {
      ...source.definition.presets.travel,
      arms: source.definition.presets.travel.arms.map((arm, index) => ({
        ...arm,
        rootPitch: arm.rootPitch + (index === 0 ? 0.2 : 0)
      }))
    }
    const result = owner.evaluate(source, pitched, mount)
    expect(result.frames.armRoots[0].position).toEqual(
      before.frames.armRoots[0].position
    )
    expect(result.frames.tools[0].position).not.toEqual(
      before.frames.tools[0].position
    )
    expect(result.frames.tools[2]).toEqual(before.frames.tools[2])
    expect(() =>
      owner.evaluate(source, { ...pitched, definitionId: 'foreign' }, mount)
    ).toThrow()
    owner.clear()
    expect(() => owner.evaluate(source, pitched, mount)).toThrow()
  })
})

describe('quadruped candidate geometry obligations', () => {
  it.each([
    [0.6, 0.2, 1],
    [0.2, 0.1, 0.3],
    [0.4, 0.15, 0.6]
  ])(
    'places a holder through the actual opening for %j',
    (width, height, length) => {
      const owner = new QuadrupedRobotSourceOwner()
      const source = owner.prepare(createSyntheticQuadrupedRobotDefinition())
      const mount = owner.mount(
        source,
        createSyntheticBasketInput([width, height, length])
      )
      const candidates = owner.candidatePoses(source, mount)
      const placement = owner.evaluate(
        source,
        candidates.basketPlacement,
        mount
      )
      const holder = placement.frames.tools.find(
        (frame) => frame.chainId === 'left-holder'
      )
      if (!holder) throw new Error('Missing placement holder')
      const opening = mount.opening
      expect(holder.position[0]).toBeGreaterThan(opening.min[0])
      expect(holder.position[0]).toBeLessThan(opening.max[0])
      expect(holder.position[2]).toBeGreaterThan(opening.min[2])
      expect(holder.position[2]).toBeLessThan(opening.max[2])
      expect(holder.position[1]).toBeCloseTo(
        opening.min[1] + source.definition.referenceBaseHeight - 0.02,
        10
      )
      const direction = new Vector3(0, 0, 1).applyQuaternion(
        new Quaternion(...holder.rotation)
      )
      expect(direction.y).toBeCloseTo(-1, 10)
      expect(owner.candidatePoses(source, mount)).toBe(candidates)
    }
  )

  it('invalidates mutable basket and pose inputs instead of reusing stale geometry', () => {
    const { owner, source } = fixture()
    const basket = createSyntheticBasketInput([0.4, 0.15, 0.6])
    const first = owner.mount(source, basket)
    basket.basket.payloadKg = 25
    expect(() => owner.mount(source, basket)).toThrow(/load-geometry/)
    const pose = structuredClone(source.definition.presets.travel)
    const before = owner.evaluate(source, pose, first)
    const mutated = pose as { lifts: { left: number; right: number } }
    mutated.lifts.left = 0.3
    const after = owner.evaluate(source, pose, first)
    expect(
      after.frames.armRoots[0].position[1] -
        before.frames.armRoots[0].position[1]
    ).toBeCloseTo(0.3, 10)
  })
})

type DesignedContact = Readonly<{
  id: string
  parent: readonly WalkingPatchReference[]
  child: readonly WalkingPatchReference[]
}>

type SourceFixture = ReturnType<typeof fixture>
function allDesignedContacts(
  source: SourceFixture['source'],
  mount: SourceFixture['mount']
): DesignedContact[] {
  return [
    ...source.contacts.bearings.map((group) => ({
      ...group,
      id: group.jointId
    })),
    ...source.contacts.connections,
    ...source.contacts.pivots.map((group) => ({ ...group, id: group.jointId })),
    ...mount.contacts.connections,
    ...mount.contacts.supportPairs
  ]
}
/** Independent original-plane proof of a guide, not a collision exemption. */
function slidingGuideProof(source: SourceFixture['source']) {
  const edges: {
    parentPart: string
    childPart: string
    jointId: string
    minimumOverlap: number
    clearance: readonly number[]
  }[] = []
  const failures: string[] = []
  const work = {
    planeTriangles: 0,
    wallVertices: 0,
    boundVertices: 0,
    domainEndpoints: 0
  }
  const actual = source.rig.joints.filter(
    (joint) => joint.motion === 'prismatic'
  )
  if (
    JSON.stringify(actual.map((j) => j.id).sort()) !==
    JSON.stringify(source.contacts.sliders.map((s) => s.jointId).sort())
  )
    failures.push('Prismatic joint responsibility is incomplete or duplicated')
  const identity = (frame: WalkingRigidTransform) =>
    frame.rotation.every((v, i) => v === (i === 3 ? 1 : 0))
  for (const slider of source.contacts.sliders) {
    try {
      const joint = required(
          actual.find((joint) => joint.id === slider.jointId)
        ),
        { parent, child } = slider
      const assert = (value: boolean, message: string) => {
        if (!value) throw new Error(message)
      }
      assert(
        source.parts.includes(parent) && source.parts.includes(child),
        'stale material identity'
      )
      assert(
        parent.bodyId === joint.parentBodyId &&
          child.bodyId === joint.childBodyId,
        'joint material owner mismatch'
      )
      const body = required(
        source.rig.bodies.find((body) => body.id === child.bodyId)
      )
      assert(
        body.attachment === 'joint' && body.parentBodyId === parent.bodyId,
        'rig attachment mismatch'
      )
      assert(
        joint.axis === 'y' &&
          identity(joint.frame) &&
          identity(parent.localFrame) &&
          identity(child.localFrame),
        'unsupported guide axis or rotation'
      )
      assert(
        joint.frame.position[0] === 0 && joint.frame.position[2] === 0,
        'transverse joint offset'
      )
      const stage = required(
        (['left', 'right'] as const).find((side) =>
          source.rig.stageJointIds[side].includes(joint.id)
        )
      )
      assert(
        source.rig.stageJointIds[stage].length ===
          source.definition.stages[stage].telescope.segmentCount - 1,
        'stage domain responsibility'
      )
      const planes = new Map<string, number>()
      const coveredRegions = new Set<(typeof parent.regions)[number]>()
      for (const reference of slider.parentCavity) {
        assert(
          reference.part === parent &&
            parent.patches.includes(reference.patch) &&
            parent.regions.includes(reference.patch.region),
          'stale cavity patch'
        )
        assert(reference.localFrame === parent.localFrame, 'stale cavity frame')
        for (const range of reference.patch.ranges) {
          assert(
            range.indexStart >= reference.patch.region.indexStart &&
              range.indexStart + range.indexCount <=
                reference.patch.region.indexStart +
                  reference.patch.region.indexCount,
            'cavity range outside original region'
          )
          for (
            let index = range.indexStart;
            index < range.indexStart + range.indexCount;
            index += 3
          ) {
            work.planeTriangles++
            const points = [0, 1, 2].map((i) =>
              [0, 1, 2].map(
                (axis) =>
                  parent.shape.positions[
                    parent.shape.indices[index + i] * 3 + axis
                  ]
              )
            )
            const axis = [0, 2].find((axis) =>
              points.every((p) => p[axis] === points[0][axis])
            )
            assert(
              axis !== undefined,
              'cavity is not a transverse support plane'
            )
            const a = required(axis),
              b = (a + 1) % 3,
              c = (a + 2) % 3
            const cross = subtract(
              multiply(
                subtract(interval(points[1][b]), interval(points[0][b])),
                subtract(interval(points[2][c]), interval(points[0][c]))
              ),
              multiply(
                subtract(interval(points[1][c]), interval(points[0][c])),
                subtract(interval(points[2][b]), interval(points[0][b]))
              )
            )
            assert(
              cross.low > 0 || cross.high < 0,
              'uncertain original cavity orientation'
            )
            const key = a + ':' + (cross.low > 0 ? 'low' : 'high'),
              value = points[0][a]
            assert(
              !planes.has(key) || planes.get(key) === value,
              'inconsistent cavity support plane'
            )
            planes.set(key, value)
            const region = reference.patch.region
            assert(
              region.kind === 'closed-solid' &&
                'convex' in region &&
                region.convex === true,
              'uncertified cavity material cell'
            )
            for (const vertex of parent.shape.indices.slice(
              region.indexStart,
              region.indexStart + region.indexCount
            )) {
              work.wallVertices++
              const coordinate = parent.shape.positions[vertex * 3 + a]
              assert(
                cross.low > 0 ? coordinate <= value : coordinate >= value,
                'material enters original cavity'
              )
            }
            coveredRegions.add(region)
          }
        }
      }
      assert(planes.size === 4, 'four actual cavity walls required')
      assert(
        parent.regions.length === 4 &&
          coveredRegions.size === parent.regions.length,
        'every parent material cell must bound the original cavity'
      )
      const bounds = (part: typeof parent, axis: number) => {
        const coordinates = part.shape.indices.map((i) => {
          work.boundVertices++
          return part.shape.positions[i * 3 + axis]
        })
        return { low: Math.min(...coordinates), high: Math.max(...coordinates) }
      }
      const clearance: number[] = []
      for (const axis of [0, 2]) {
        const offset = subtract(
          interval(child.localFrame.position[axis]),
          interval(parent.localFrame.position[axis])
        )
        const childBounds = bounds(child, axis),
          low = required(planes.get(axis + ':low')),
          high = required(planes.get(axis + ':high'))
        const lower = subtract(
          add(interval(childBounds.low), offset),
          interval(low)
        ).low
        const upper = subtract(
          interval(high),
          add(interval(childBounds.high), offset)
        ).low
        assert(lower > 0 && upper > 0, 'no positive cavity clearance')
        clearance.push(lower, upper)
      }
      const p = bounds(parent, 1),
        c = bounds(child, 1),
        overlaps: number[] = []
      for (const displacement of joint.domain) {
        work.domainEndpoints++
        const offset = subtract(
          add(
            add(
              interval(child.localFrame.position[1]),
              interval(joint.frame.position[1])
            ),
            interval(displacement)
          ),
          interval(parent.localFrame.position[1])
        )
        const low = add(interval(c.low), offset),
          high = add(interval(c.high), offset)
        overlaps.push(
          subtract(
            interval(Math.min(p.high, high.low)),
            interval(Math.max(p.low, low.high))
          ).low
        )
      }
      // Intersection length of translating intervals is concave: domain endpoints bound its minimum.
      const minimumOverlap = Math.min(...overlaps)
      assert(
        minimumOverlap >= source.definition.stages[stage].telescope.overlap,
        'insufficient original axial overlap'
      )
      edges.push({
        jointId: joint.id,
        parentPart: parent.id,
        childPart: child.id,
        minimumOverlap,
        clearance
      })
    } catch (error) {
      failures.push(slider.jointId + ': ' + String(error))
    }
  }
  return {
    complete: failures.length === 0 && edges.length === actual.length,
    edges,
    failures,
    work
  }
}
function assemblyGraph(
  parts: SourceFixture['source']['parts'],
  edges: readonly { parentPart: string; childPart: string }[]
) {
  const ids = new Set(parts.map((part) => part.id)),
    reached = new Set(['chassis'])
  const invalid = edges.filter(
    (edge) => !ids.has(edge.parentPart) || !ids.has(edge.childPart)
  )
  for (const _part of parts)
    for (const edge of edges) {
      if (reached.has(edge.parentPart)) reached.add(edge.childPart)
      if (reached.has(edge.childPart)) reached.add(edge.parentPart)
    }
  return {
    missing: parts
      .filter((part) => !reached.has(part.id))
      .map((part) => part.id),
    invalid: invalid.length,
    duplicateIds: parts.length - ids.size
  }
}

describe('designed contact original material witnesses', () => {
  it('keeps designed contact and material unknown under a formally insufficient test budget', () => {
    const { owner, source, mount } = fixture(),
      pose = owner.evaluate(source, source.definition.presets.travel, mount)
    const group = {
      ...source.contacts.bearings[0],
      id: source.contacts.bearings[0].jointId
    }
    const references = new Set(
      [...group.parent, ...group.child].map((ref) => ref.part)
    )
    const parts = source.parts.filter((part) => references.has(part))
    const control = materialOracle(parts)
    const budget = control.evaluator.work.exactPredicates + 1
    expect(control.contacts(pose, [group]).complete).toBe(true)
    const limited = materialOracle(parts, budget),
      material = limited.evaluate(pose)
    expect(material.complete).toBe(false)
    expect(material.failures.some((item) => item.startsWith('unknown:'))).toBe(
      true
    )
    expect(limited.contacts(pose, [group]).complete).toBe(false)
    expect(limited.evaluator.work.exactPredicates).toBeLessThanOrEqual(budget)
    const before = limited.evaluator.work.exactPredicates
    expect(limited.evaluate(pose).complete).toBe(false)
    expect(limited.evaluator.work.exactPredicates).toBe(before)
  })

  it('proves all designed contact slider cavities and full-domain overlap from actual material and rig', () => {
    const { source } = fixture()
    const valid = slidingGuideProof(source)
    expect(valid.failures).toEqual([])
    expect(valid.edges).toHaveLength(
      source.rig.joints.filter((joint) => joint.motion === 'prismatic').length
    )
    const slider = source.contacts.sliders[0],
      joint = required(source.rig.joints.find((j) => j.id === slider.jointId))
    const parent = {
      ...slider.parent,
      regions: [
        ...slider.parent.regions,
        { ...slider.parent.regions[0], id: 'uncovered-material' }
      ]
    }
    expect(
      slidingGuideProof({
        ...source,
        parts: source.parts.map((part) =>
          part === slider.parent ? parent : part
        ),
        contacts: {
          ...source.contacts,
          sliders: [
            {
              ...slider,
              parent,
              parentCavity: slider.parentCavity.map((ref) => ({
                ...ref,
                part: parent
              }))
            },
            ...source.contacts.sliders.slice(1)
          ]
        }
      }).complete
    ).toBe(false)

    for (const changed of [
      { ...joint, axis: 'x' as const },
      { ...joint, domain: [0, 1] as const },
      { ...joint, frame: { ...joint.frame, position: [0.01, 0, 0] as const } }
    ])
      expect(
        slidingGuideProof({
          ...source,
          rig: {
            ...source.rig,
            joints: source.rig.joints.map((j) => (j === joint ? changed : j))
          }
        }).complete
      ).toBe(false)
    for (const changed of [
      { ...slider, parentCavity: [] },
      { ...slider, parentCavity: slider.parentCavity.slice(1) },
      { ...slider, child: slider.parent }
    ])
      expect(
        slidingGuideProof({
          ...source,
          contacts: {
            ...source.contacts,
            sliders: [changed, ...source.contacts.sliders.slice(1)]
          }
        }).complete
      ).toBe(false)
    expect(
      slidingGuideProof({
        ...source,
        contacts: {
          ...source.contacts,
          sliders: source.contacts.sliders.slice(1)
        }
      }).complete
    ).toBe(false)
  })
  it('retains designed contact blade pivot support and all tool material throughout existing closure endpoints and midpoint', () => {
    const { owner, source, mount } = fixture()
    const parts = source.parts.filter((part) =>
      source.definition.arms.some((arm) =>
        part.id.startsWith(arm.side + '-' + arm.role + '-tool-')
      )
    )
    const oracle = materialOracle(parts)
    for (const toolClosure of [0, 0.5, 1]) {
      const state = {
        ...source.definition.presets.travel,
        arms: source.definition.presets.travel.arms.map((arm) => ({
          ...arm,
          toolClosure
        }))
      }
      const pose = owner.evaluate(source, state, mount)
      const result = oracle.contacts(
        pose,
        source.contacts.pivots.map((group) => ({ ...group, id: group.jointId }))
      )
      expect(result.failures).toEqual([])
      const material = oracle.evaluate(pose)
      expect(material.failures).toEqual([])
      expect(material.complete).toBe(true)
      expect(material.disconnectedParts).toEqual([])
    }
  })

  it('requires every fixed tool attachment and existing blade pivot to meet actual original material', () => {
    const { owner, source, mount } = fixture()
    const pose = owner.evaluate(source, source.definition.presets.travel, mount)
    const oracle = materialOracle(pose.parts)
    const references = (id: string, face: string) => {
      const part = required(source.parts.find((part) => part.id === id))
      const patches = part.patches.filter((patch) =>
        patch.id.includes('-source-' + face + '-')
      )
      expect(patches.length, id + '/' + face).toBeGreaterThan(0)
      return patches.map((patch) => ({
        part,
        patch,
        localFrame: part.localFrame
      }))
    }
    const groups: DesignedContact[] = []
    for (const arm of source.definition.arms) {
      const id = arm.side + '-' + arm.role,
        tool = id + '-tool'
      groups.push({
        id: id + '-palm',
        parent: references(id + '-wristRoll-carrier', 'z-high'),
        child: references(tool + '-palm', 'z-low')
      })
      for (const sign of [-1, 1]) {
        if (arm.role === 'holder') {
          groups.push({
            id: tool + '-finger-' + sign,
            parent: references(tool + '-palm', 'z-high'),
            child: references(tool + '-padded-finger-' + sign, 'z-low')
          })
          groups.push({
            id: tool + '-guide-' + sign,
            parent: references(tool + '-palm', sign < 0 ? 'x-low' : 'x-high'),
            child: references(
              tool + '-foliage-guide-' + sign,
              sign < 0 ? 'x-high' : 'x-low'
            )
          })
        } else {
          groups.push({
            id: tool + '-guard-' + sign,
            parent: references(tool + '-palm', sign < 0 ? 'x-low' : 'x-high'),
            child: references(
              tool + '-guard-' + sign,
              sign < 0 ? 'x-high' : 'x-low'
            )
          })
          groups.push({
            id: tool + '-pivot-' + sign,
            parent: references(tool + '-palm', sign < 0 ? 'y-high' : 'y-low'),
            child: references(
              tool + '-blade-' + sign + '-material',
              sign < 0 ? 'y-low' : 'y-high'
            )
          })
        }
      }
    }
    const control = source.contacts.bearings[0]
    expect(
      oracle.contacts(pose, [{ ...control, id: control.jointId }]).complete
    ).toBe(true)
    const failures = groups.flatMap(
      (group) => oracle.contacts(pose, [group]).failures
    )
    expect(failures).toEqual([])
  })
  it('reuses current placements and witnesses only for unchanged relative poses and patch identities', () => {
    const { owner, source, mount } = fixture()
    const pose = owner.evaluate(source, source.definition.presets.travel, mount)
    const group = {
      ...source.contacts.bearings[0],
      id: source.contacts.bearings[0].jointId
    }
    const oracle = materialOracle(pose.parts)
    const first = oracle.contacts(pose, [group])
    expect(first.complete).toBe(true)
    const before = oracle.evaluator.work.exactPredicates
    const repeated = oracle.contacts(pose, [group])
    expect(repeated).toEqual(first)
    expect(oracle.evaluator.work.exactPredicates).toBe(before)
    const changedPose = owner.evaluate(
      source,
      owner.candidatePoses(source, mount).bilateralHarvest,
      mount
    )
    expect(oracle.contacts(changedPose, [group]).complete).toBe(true)
    expect(oracle.evaluator.work.exactPredicates).toBeGreaterThan(before)
    const wrongFace = {
      ...group,
      child: [
        {
          ...group.child[0],
          patch: required(
            group.child[0].part.patches.find((patch) =>
              patch.id.includes('-source-x-high-')
            )
          )
        }
      ]
    }
    const boundaryBefore = oracle.evaluator.work.stages.boundaryLocus.predicates
    expect(oracle.contacts(pose, [wrongFace]).complete).toBe(false)
    expect(
      oracle.evaluator.work.stages.boundaryLocus.predicates
    ).toBeGreaterThan(boundaryBefore)
    const other = fixture()
    const otherPose = other.owner.evaluate(
      other.source,
      other.source.definition.presets.travel,
      other.mount
    )
    const otherGroup = {
      ...other.source.contacts.bearings[0],
      id: other.source.contacts.bearings[0].jointId
    }
    expect(oracle.contacts(otherPose, [otherGroup]).complete).toBe(false)
    const fresh = materialOracle(otherPose.parts)
    expect(fresh.contacts(otherPose, [otherGroup]).complete).toBe(true)
    expect(fresh.evaluator.work.exactPredicates).toBeGreaterThan(0)
  })
  it('does not mistake disconnected cells inside one named part for a continuous material path', () => {
    const { owner, source, mount } = fixture()
    const pose = owner.evaluate(source, source.definition.presets.travel, mount)
    const original = required(
      source.parts.find((part) => part.id === 'chassis')
    )
    const x = original.shape.positions.filter((_, index) => index % 3 === 0)
    const width = Math.max(...x) - Math.min(...x)
    for (const distance of [width, width + 1]) {
      const part = freezeSource({
        ...original,
        id: 'two-material-cells',
        patches: [],
        shape: {
          kind: 'triangles' as const,
          positions: [
            ...original.shape.positions,
            ...original.shape.positions.map((value, index) =>
              index % 3 === 0 ? value + distance : value
            )
          ],
          indices: [
            ...original.shape.indices,
            ...original.shape.indices.map(
              (index) => index + original.shape.positions.length / 3
            )
          ]
        },
        regions: [
          ...original.regions,
          ...original.regions.map((region) => ({
            ...region,
            id: 'second-' + region.id,
            indexStart: region.indexStart + original.shape.indices.length
          }))
        ]
      })
      const report = materialOracle([part]).evaluate(pose)
      expect(report.complete).toBe(true)
      expect(report.failures).toEqual([])
      expect(report.disconnectedParts).toEqual(
        distance === width ? [] : [part.id]
      )
    }
  })
  it('requires current identities and both named faces for all bearings, supports and complete leg chains', () => {
    const { owner, source, mount } = fixture()
    const pose = owner.evaluate(source, source.definition.presets.travel, mount)
    const groups = allDesignedContacts(source, mount)
    const oracle = materialOracle(pose.parts)
    const evaluator = oracle.evaluator
    const result = oracle.contacts(pose, groups)
    expect(
      result.failures,
      JSON.stringify({
        failures: result.failures,
        count: result.witnesses.length,
        work: evaluator.work
      })
    ).toEqual([])
    expect(result.complete).toBe(true)
    expect(result.witnesses).toHaveLength(groups.length)
    const group = groups[0]
    for (const invalid of [
      { ...group, child: [] },
      {
        ...group,
        child: [{ ...group.child[0], part: { ...group.child[0].part } }]
      },
      {
        ...group,
        child: [{ ...group.child[0], patch: { ...group.child[0].patch } }]
      },
      { ...group, child: group.parent },
      {
        ...group,
        child: [
          {
            ...group.child[0],
            patch: required(
              group.child[0].part.patches.find((patch) =>
                patch.id.includes('-source-x-high-')
              )
            )
          }
        ]
      }
    ]) {
      const negative = oracle.contacts(pose, [invalid])
      expect(negative.complete).toBe(false)
      expect(negative.failures).toHaveLength(1)
    }
    const guides = slidingGuideProof(source)
    expect(guides.failures).toEqual([])
    expect(guides.edges).toHaveLength(14)
    const edges = [...result.witnesses, ...guides.edges]
    expect(assemblyGraph(pose.parts, edges)).toEqual({
      missing: [],
      invalid: 0,
      duplicateIds: 0
    })
    for (const part of pose.parts.filter((part) => part.id !== 'chassis')) {
      const disconnected = edges.filter(
        (edge) => edge.parentPart !== part.id && edge.childPart !== part.id
      )
      expect(assemblyGraph(pose.parts, disconnected).missing).toContain(part.id)
      expect(
        assemblyGraph(
          pose.parts.filter((p) => p !== part),
          edges
        ).invalid
      ).toBeGreaterThan(0)
    }
  }, 60000)
})

function measuredOraclePhase<T>(
  oracle: ReturnType<typeof materialOracle>,
  name: string,
  run: () => T
) {
  const before = oracle.evaluator.work,
    reuseBefore = oracle.reuseWork(),
    cpu = process.cpuUsage(),
    start = performance.now()
  const value = run()
  const elapsedMs = performance.now() - start,
    cpuDelta = process.cpuUsage(cpu),
    after = oracle.evaluator.work,
    reuseAfter = oracle.reuseWork()
  return {
    value,
    measurement: {
      name,
      before,
      after,
      reuseBefore,
      reuseAfter,
      exactPredicates: after.exactPredicates - before.exactPredicates,
      elapsedMs,
      userCpuMs: cpuDelta.user / 1000,
      systemCpuMs: cpuDelta.system / 1000
    }
  }
}

/** Offline owner: immutable value reuse never changes current part/patch bindings. */
function materialOracle(
  parts: ReturnType<QuadrupedRobotSourceOwner['evaluate']>['parts'],
  maxExactPredicates = 100000000
) {
  const evaluator = new WalkingSourceRelationEvaluator({
    maxRegionPairs: 2000000,
    maxExactPredicates,
    maxBits: 16384
  })
  type ExactFrame = ReturnType<typeof prepareQueryExactForwardFrame>
  type PreparedRegion = ReturnType<WalkingSourceRelationEvaluator['prepare']>
  type Bounds = readonly Interval[]
  const count = {
    geometryPreparations: 0,
    geometryReuses: 0,
    framePreparations: 0,
    intervalBoxPreparations: 0,
    intervalFrameApplications: 0,
    exactComputations: 0,
    valueRelationReuses: 0,
    uniqueRelations: 0,
    placementPreparations: 0,
    currentRelationReuses: 0,
    contactRelationComputations: 0,
    contactWitnessComputations: 0,
    contactWitnessReuses: 0
  }
  const geometryValues = new Map<
    string,
    {
      id: number
      regions: readonly PreparedRegion[]
      bounds: readonly Bounds[]
      whole: Bounds
    }
  >()
  const scalarKey = (value: ExactFrame['determinant']) =>
    value.significand + ':' + value.exponent
  interface FrameValue {
    id: number
    exact: ExactFrame
    outward: ReturnType<typeof prepareQueryForwardFrame>
    identity: boolean
  }
  const exactValues = new Map<string, FrameValue>()
  const originalFrames = new WeakMap<WalkingRigidTransform, FrameValue>()
  function frameValue(frame: WalkingRigidTransform): FrameValue {
    const previous = originalFrames.get(frame)
    if (previous) return previous
    const exact = prepareQueryExactForwardFrame(frame)
    const key = [...exact.matrix.flat(), ...exact.position]
      .map(scalarKey)
      .join(',')
    let value = exactValues.get(key)
    if (!value) {
      const identity =
        exact.matrix.every((row, i) =>
          row.every(
            (v, j) => v.significand === (i === j ? 1n : 0n) && v.exponent === 0
          )
        ) && exact.position.every((v) => v.significand === 0n)
      value = {
        id: exactValues.size,
        exact,
        outward: prepareQueryForwardFrame(frame),
        identity
      }
      exactValues.set(key, value)
      count.framePreparations++
    }
    originalFrames.set(frame, value)
    return value
  }
  const ranges = (
    part: (typeof parts)[number],
    indices: readonly number[]
  ): Bounds =>
    [0, 1, 2].map((axis) => {
      const values = indices.map(
        (index) => part.shape.positions[index * 3 + axis]
      )
      return { low: Math.min(...values), high: Math.max(...values) }
    })
  const prepared = parts.map((part) => {
    // Region semantics are part of the key. IDs retain their original bindings
    // below; all coordinates and indices participate, not a lossy hash.
    const key = JSON.stringify([
      part.shape.positions,
      part.shape.indices,
      part.regions.map(({ id, ...region }) => region)
    ])
    let geometry = geometryValues.get(key)
    if (!geometry) {
      const regions = part.regions.map((region) =>
        evaluator.prepare(part.shape, region)
      )
      expect(
        regions.every((region) => region.certified),
        'Original material certification'
      ).toBe(true)
      geometry = {
        id: geometryValues.size,
        regions,
        bounds: part.regions.map((region) =>
          ranges(
            part,
            part.shape.indices.slice(
              region.indexStart,
              region.indexStart + region.indexCount
            )
          )
        ),
        whole: ranges(part, part.shape.indices)
      }
      geometryValues.set(key, geometry)
      count.geometryPreparations++
    } else count.geometryReuses++
    // The current part's original triangle ranges remain the proof binding;
    // only the equal geometric calculation is shared.
    expect(geometry.regions.length).toBe(part.regions.length)
    part.regions.forEach((region, index) => {
      expect([region.kind, region.indexStart, region.indexCount]).toEqual([
        geometry.regions[index].region.kind,
        geometry.regions[index].region.indexStart,
        geometry.regions[index].region.indexCount
      ])
    })
    return { part, geometry }
  })
  const chains = new Map<
    string,
    {
      key: string
      frames: readonly ExactFrame[]
      outward: readonly ReturnType<typeof prepareQueryForwardFrame>[]
    }
  >()
  const chain = (frames: readonly WalkingRigidTransform[]) => {
    const values = frames.map(frameValue).filter((frame) => !frame.identity)
    const key = values.map((frame) => frame.id).join(',')
    let value = chains.get(key)
    if (!value) {
      value = {
        key,
        frames: Object.freeze(values.map((frame) => frame.exact)),
        outward: values.map((frame) => frame.outward)
      }
      chains.set(key, value)
    }
    return value
  }
  const boxes = new Map<string, Bounds>()
  const box = (
    geometry: (typeof prepared)[number]['geometry'],
    region: number,
    frames: ReturnType<typeof chain>
  ) => {
    const key = geometry.id + ':' + region + ':' + frames.key
    let result = boxes.get(key)
    if (!result) {
      result = region === -1 ? geometry.whole : geometry.bounds[region]
      for (const frame of frames.outward) {
        result = transformQueryPoint(frame, result)
        count.intervalFrameApplications++
      }
      boxes.set(key, result)
      count.intervalBoxPreparations++
    }
    return result
  }
  const strict = (first: Bounds, second: Bounds) =>
    first.some(
      (value, axis) =>
        value.high < second[axis].low || second[axis].high < value.low
    )
  const relations = new Map<
    string,
    'separated' | 'boundary' | 'volume-overlap'
  >()

  type Placement = Parameters<WalkingSourceRelationEvaluator['relate']>[0]
  type Relation = ReturnType<WalkingSourceRelationEvaluator['relate']>
  type Patch = WalkingPatchReference['patch']
  type Proof = NonNullable<
    ReturnType<WalkingSourceRelationEvaluator['proveBoundary']>
  >
  const currentParts = new Set<WalkingPatchReference['part']>(parts)
  const placements = new WeakMap<
    WalkingPatchReference['part'],
    WeakMap<PreparedRegion, WeakMap<readonly ExactFrame[], Placement>>
  >()
  const currentRelations = new WeakMap<
    Placement,
    WeakMap<Placement, Relation>
  >()
  const witnessesByRelation = new WeakMap<
    Relation,
    WeakMap<Patch, WeakMap<Patch, Proof>>
  >()
  function placement(
    part: WalkingPatchReference['part'],
    region: PreparedRegion,
    frames: readonly ExactFrame[]
  ): Placement {
    let regions = placements.get(part)
    if (!regions) {
      regions = new WeakMap()
      placements.set(part, regions)
    }
    let transforms = regions.get(region)
    if (!transforms) {
      transforms = new WeakMap()
      regions.set(region, transforms)
    }
    let result = transforms.get(frames)
    if (!result) {
      result = { region, frames }
      transforms.set(frames, result)
      count.placementPreparations++
    }
    return result
  }
  function currentRelation(first: Placement, second: Placement): Relation {
    let seconds = currentRelations.get(first)
    if (!seconds) {
      seconds = new WeakMap()
      currentRelations.set(first, seconds)
    }
    let relation = seconds.get(second)
    if (relation) count.currentRelationReuses++
    else {
      count.exactComputations++
      relation = evaluator.relate(first, second, 0)
      if (relation.kind !== 'unknown') seconds.set(second, relation)
    }
    return relation
  }
  /** A boundary kind is insufficient: both current original faces must witness it. */
  function proveDesignedContacts(
    pose: ReturnType<QuadrupedRobotSourceOwner['evaluate']>,
    groups: readonly DesignedContact[]
  ) {
    const bodies = new Map(
      pose.bodyTransforms.map((body) => [body.id, body.frameChain])
    )
    const witnesses: {
      id: string
      parentPart: string
      parentPatch: string
      parentTriangle: number
      childPart: string
      childPatch: string
      childTriangle: number
    }[] = []
    const failures: string[] = []
    const seen = new Set<string>()
    const valid = (reference: WalkingPatchReference) => {
      const { part, patch } = reference
      return (
        currentParts.has(part) &&
        pose.parts.some((current) => current === part) &&
        part.patches.includes(patch) &&
        part.regions.includes(patch.region) &&
        patch.ranges.length > 0 &&
        patch.ranges.every(
          (range) =>
            Number.isSafeInteger(range.indexStart) &&
            Number.isSafeInteger(range.indexCount) &&
            range.indexCount > 0 &&
            range.indexStart % 3 === 0 &&
            range.indexCount % 3 === 0 &&
            range.indexStart >= patch.region.indexStart &&
            range.indexStart + range.indexCount <=
              patch.region.indexStart + patch.region.indexCount
        )
      )
    }
    for (const group of groups) {
      if (
        seen.has(group.id) ||
        !group.parent.length ||
        !group.child.length ||
        ![...group.parent, ...group.child].every(valid)
      ) {
        failures.push(group.id + ': invalid current original patch binding')
        break
      }
      seen.add(group.id)
      let witnessed = false
      for (const parent of group.parent) {
        for (const child of group.child) {
          if (parent.part === child.part) continue
          const a = [
            parent.part.localFrame,
            ...required(bodies.get(parent.part.bodyId))
          ]
          const b = [
            child.part.localFrame,
            ...required(bodies.get(child.part.bodyId))
          ]
          while (a.length && b.length && a.at(-1) === b.at(-1)) {
            a.pop()
            b.pop()
          }
          const first = placement(
            parent.part,
            evaluator.prepare(parent.part.shape, parent.patch.region),
            chain(a).frames
          )
          const second = placement(
            child.part,
            evaluator.prepare(child.part.shape, child.patch.region),
            chain(b).frames
          )
          const before = count.exactComputations
          const relation = currentRelation(first, second)
          count.contactRelationComputations += count.exactComputations - before
          if (
            relation.kind === 'unknown' ||
            relation.kind === 'volume-overlap'
          ) {
            failures.push(
              group.id +
                ': ' +
                relation.kind +
                ' ' +
                parent.part.id +
                ' / ' +
                child.part.id
            )
            return { complete: false, witnesses, failures }
          }
          if (relation.kind !== 'boundary') continue
          let parentProofs = witnessesByRelation.get(relation)
          if (!parentProofs) {
            parentProofs = new WeakMap()
            witnessesByRelation.set(relation, parentProofs)
          }
          let childProofs = parentProofs.get(parent.patch)
          if (!childProofs) {
            childProofs = new WeakMap()
            parentProofs.set(parent.patch, childProofs)
          }
          let proof = childProofs.get(child.patch)
          if (proof) count.contactWitnessReuses++
          else {
            count.contactWitnessComputations++
            proof = evaluator.proveBoundary(
              first,
              second,
              relation,
              parent.patch.ranges,
              child.patch.ranges
            )
            if (proof) childProofs.set(child.patch, proof)
          }
          if (!proof) continue
          const contains = (
            reference: WalkingPatchReference,
            triangle: number
          ) =>
            reference.patch.ranges.some(
              (range) =>
                triangle >= range.indexStart &&
                triangle + 3 <= range.indexStart + range.indexCount
            )
          if (
            !contains(parent, proof.firstTriangle) ||
            !contains(child, proof.secondTriangle)
          )
            throw new Error(
              'Boundary witness escaped current original triangles'
            )
          witnesses.push({
            id: group.id,
            parentPart: parent.part.id,
            parentPatch: parent.patch.id,
            parentTriangle: proof.firstTriangle,
            childPart: child.part.id,
            childPatch: child.patch.id,
            childTriangle: proof.secondTriangle
          })
          witnessed = true
          break
        }
        if (witnessed) break
      }
      if (!witnessed) {
        failures.push(group.id + ': no paired original triangle witness')
        break
      }
    }
    return { complete: witnesses.length === groups.length, witnesses, failures }
  }

  return {
    evaluator,
    contacts: proveDesignedContacts,
    reuseWork: () => ({ ...count, uniqueRelations: relations.size }),
    evaluate(pose: ReturnType<QuadrupedRobotSourceOwner['evaluate']>) {
      const bodies = new Map(
        pose.bodyTransforms.map(({ id, frameChain }) => [id, frameChain])
      )
      const originals = prepared.map(({ part }) => {
        const body = bodies.get(part.bodyId)
        if (!body) throw new Error('Missing canonical body frame chain')
        return [part.localFrame, ...body]
      })
      const prefixes = originals.map(
        () => new Map<number, ReturnType<typeof chain>>()
      )
      const prefix = (part: number, length: number) => {
        let value = prefixes[part].get(length)
        if (!value) {
          value = chain(originals[part].slice(0, length))
          prefixes[part].set(length, value)
        }
        return value
      }
      const failures: string[] = [],
        boundaries: string[] = []
      const components = prepared.map(({ geometry }) =>
        geometry.regions.map((_, index) => index)
      )
      const join = (part: number, a: number, b: number) => {
        const from = components[part][b],
          to = components[part][a]
        components[part] = components[part].map((value) =>
          value === from ? to : value
        )
      }
      const failurePairs = new Set<string>(),
        boundaryPairs = new Set<string>()
      let coveredRegionPairs = 0,
        expandedRegionPairs = 0,
        separatedPartPairs = 0,
        strictIntervalRegionPairs = 0,
        computedRegionPairs = 0,
        reusedRegionPairs = 0
      const report = (complete: boolean) => ({
        failures,
        boundaries,
        coveredRegionPairs,
        expandedRegionPairs,
        separatedPartPairs,
        strictIntervalRegionPairs,
        computedRegionPairs,
        reusedRegionPairs,
        disconnectedParts: prepared
          .filter((_, index) => new Set(components[index]).size > 1)
          .map(({ part }) => part.id),
        complete
      })
      for (let i = 0; i < prepared.length; i++)
        for (let j = i; j < prepared.length; j++) {
          const first = prepared[i],
            second = prepared[j],
            samePart = i === j
          let al = originals[i].length,
            bl = originals[j].length
          // The sole FK traversal issued these original common ancestor objects.
          while (
            al > 0 &&
            bl > 0 &&
            originals[i][al - 1] === originals[j][bl - 1]
          ) {
            al--
            bl--
          }
          const af = prefix(i, al),
            bf = prefix(j, bl)
          const pairs = samePart
            ? (first.geometry.regions.length *
                (first.geometry.regions.length - 1)) /
              2
            : first.geometry.regions.length * second.geometry.regions.length
          if (
            !samePart &&
            strict(box(first.geometry, -1, af), box(second.geometry, -1, bf))
          ) {
            separatedPartPairs++
            coveredRegionPairs += pairs
            strictIntervalRegionPairs += pairs
            continue
          }
          for (let a = 0; a < first.geometry.regions.length; a++)
            for (
              let b = samePart ? a + 1 : 0;
              b < second.geometry.regions.length;
              b++
            ) {
              expandedRegionPairs++
              coveredRegionPairs++
              if (
                strict(box(first.geometry, a, af), box(second.geometry, b, bf))
              ) {
                strictIntervalRegionPairs++
                continue
              }
              const key =
                first.geometry.id +
                ':' +
                a +
                ':' +
                af.key +
                ' / ' +
                second.geometry.id +
                ':' +
                b +
                ':' +
                bf.key
              let kind = relations.get(key)
              if (kind) {
                count.valueRelationReuses++
                reusedRegionPairs++
              } else {
                const before = count.exactComputations
                const relation = currentRelation(
                  placement(first.part, first.geometry.regions[a], af.frames),
                  placement(second.part, second.geometry.regions[b], bf.frames)
                )
                if (count.exactComputations > before) computedRegionPairs++
                else reusedRegionPairs++
                if (relation.kind === 'unknown') {
                  failures.push(
                    'unknown: ' +
                      first.part.id +
                      ':' +
                      first.part.regions[a].id +
                      ' / ' +
                      second.part.id +
                      ':' +
                      second.part.regions[b].id
                  )
                  return report(false)
                }
                kind = relation.kind
                relations.set(key, kind)
              }
              // Reused kind is not a patch/contact witness. Names and original ranges
              // always come from these current parts; boundary authorization is separate.
              const identity =
                first.part.id +
                ':' +
                first.part.regions[a].id +
                ' / ' +
                second.part.id +
                ':' +
                second.part.regions[b].id
              if (samePart && kind === 'boundary') join(i, a, b)
              const pair = first.part.id + ' / ' + second.part.id
              if (kind === 'volume-overlap' && !failurePairs.has(pair)) {
                failurePairs.add(pair)
                failures.push(kind + ': ' + identity)
              }
              if (
                !samePart &&
                kind === 'boundary' &&
                !boundaryPairs.has(pair)
              ) {
                boundaryPairs.add(pair)
                boundaries.push(identity)
              }
            }
        }
      const regions = prepared.reduce(
        (sum, p) => sum + p.geometry.regions.length,
        0
      )
      expect(coveredRegionPairs).toBe((regions * (regions - 1)) / 2)
      expect(
        strictIntervalRegionPairs + computedRegionPairs + reusedRegionPairs
      ).toBe(coveredRegionPairs)
      return report(true)
    }
  }
}
describe('three candidate source body material separation', () => {
  it('reuses equal material values and exact frame results while retaining current identities and complete coverage', () => {
    const { owner, source, mount } = fixture()
    const pose = owner.evaluate(source, source.definition.presets.travel, mount)
    const original = required(
      source.parts.find((part) => part.id === 'chassis')
    )
    const copy = freezeSource({
      ...original,
      id: 'other-current-id',
      bodyId: 'control-body'
    })
    const originalBody = required(
      pose.bodyTransforms.find((body) => body.id === original.bodyId)
    )
    const control = (frame: WalkingRigidTransform | undefined) => ({
      ...pose,
      bodyTransforms: [
        ...pose.bodyTransforms,
        {
          ...originalBody,
          id: 'control-body',
          frameChain: Object.freeze(
            frame
              ? [frame, ...originalBody.frameChain]
              : [...originalBody.frameChain]
          )
        }
      ]
    })
    const oracle = materialOracle([original, copy])
    const first = oracle.evaluate(control(undefined)),
      before = oracle.reuseWork()
    expect(first.failures).toHaveLength(1)
    expect(first.failures[0]).toContain('other-current-id')
    expect(first.complete).toBe(true)
    expect(before.geometryPreparations).toBe(1)
    expect(before.geometryReuses).toBe(1)
    const again = oracle.evaluate(control(undefined)),
      after = oracle.reuseWork()
    expect(again.failures).toEqual(first.failures)
    expect(again.coveredRegionPairs).toBe(first.coveredRegionPairs)
    expect(again.computedRegionPairs).toBe(0)
    expect(after.exactComputations).toBe(before.exactComputations)
    expect(after.geometryPreparations).toBe(before.geometryPreparations)
    expect(after.valueRelationReuses).toBeGreaterThan(
      before.valueRelationReuses
    )
    for (const frame of [
      { position: [2, 0, 0], rotation: [0, 0, 0, 1] },
      { position: [0, 0, 0], rotation: [0, Math.sin(0.37), 0, Math.cos(0.37)] }
    ] as const) {
      const input = control(frame),
        result = oracle.evaluate(input),
        fresh = materialOracle([original, copy]).evaluate(input)
      expect(result.failures).toEqual(fresh.failures)
      expect(result.boundaries).toEqual(fresh.boundaries)
      expect(result.complete).toBe(true)
    }
    const changed = freezeSource({
      ...copy,
      id: 'changed-coordinate',
      shape: {
        ...copy.shape,
        positions: copy.shape.positions.map((value, index) =>
          index % 3 === 0 ? value + 2 : value
        )
      }
    })
    const changedOracle = materialOracle([original, copy, changed])
    const changedReport = changedOracle.evaluate(control(undefined))
    expect(changedOracle.reuseWork().geometryPreparations).toBe(2)
    expect(changedReport.failures).toHaveLength(1)
    expect(changedReport.coveredRegionPairs).toBe(3)
  })
  it('distinguishes separated, boundary and overlapping original material under a shared body frame', () => {
    const { owner, source, mount } = fixture()
    const pose = owner.evaluate(source, source.definition.presets.travel, mount)
    const original = source.parts.find((part) => part.id === 'chassis')
    if (!original) throw new Error('Missing control material')
    const x = original.shape.positions.filter((_, i) => i % 3 === 0)
    const width = Math.max(...x) - Math.min(...x)
    for (const [distance, expected] of [
      [width + 1, 'separated'],
      [width, 'boundary'],
      [width / 2, 'overlap']
    ] as const) {
      const copy = freezeSource({
        ...original,
        id: 'independent-control',
        localFrame: {
          ...original.localFrame,
          position: [
            original.localFrame.position[0] + distance,
            ...original.localFrame.position.slice(1)
          ] as [number, number, number]
        }
      })
      const report = materialOracle([original, copy]).evaluate(pose)
      expect(report.failures.some((value) => value.startsWith('unknown'))).toBe(
        false
      )
      expect(report.failures.length > 0).toBe(expected === 'overlap')
      if (expected === 'boundary')
        expect(report.boundaries.length).toBeGreaterThan(0)
      if (expected === 'separated') expect(report.separatedPartPairs).toBe(1)
    }
  })
  it('rejects non-designed positive overlap across all original robot and mounted material', () => {
    const { owner, source } = fixture()
    const reports = []
    const work = []
    for (const size of [
      [0.6, 0.2, 1],
      [0.2, 0.1, 0.3],
      [0.4, 0.15, 0.6]
    ] as const) {
      const mount = owner.mount(source, createSyntheticBasketInput([...size]))
      const preparationStart = performance.now(),
        preparationCpu = process.cpuUsage()
      const oracle = materialOracle([...source.parts, ...mount.parts])
      const preparation = {
        work: oracle.evaluator.work,
        elapsedMs: performance.now() - preparationStart,
        cpu: process.cpuUsage(preparationCpu)
      }
      let accountedPredicates = preparation.work.exactPredicates
      for (const [name, state] of Object.entries(
        owner.candidatePoses(source, mount)
      )) {
        const pose = owner.evaluate(source, state, mount)
        const materialPhase = measuredOraclePhase(oracle, 'material', () =>
          oracle.evaluate(pose)
        )
        const contactPhase = measuredOraclePhase(oracle, 'contacts', () =>
          oracle.contacts(pose, allDesignedContacts(source, mount))
        )
        const guidePhase = measuredOraclePhase(oracle, 'guides', () =>
          slidingGuideProof(source)
        )
        const { value: material } = materialPhase,
          { value: contacts } = contactPhase,
          { value: guides } = guidePhase
        const phases = [
          materialPhase.measurement,
          contactPhase.measurement,
          guidePhase.measurement
        ]
        accountedPredicates += phases.reduce(
          (sum, phase) => sum + phase.exactPredicates,
          0
        )
        const phaseConserved =
          accountedPredicates === oracle.evaluator.work.exactPredicates
        const assembly = assemblyGraph(pose.parts, [
          ...contacts.witnesses,
          ...guides.edges
        ])
        reports.push({
          name: size.join('x') + ' - ' + name,
          ...material,
          phases,
          phaseConserved,
          contacts,
          guides,
          assembly,
          failures: [
            ...material.failures,
            ...(!material.complete || !contacts.complete || !guides.complete
              ? ['Incomplete canonical material or interface proof']
              : []),
            ...(!phaseConserved ? ['Phase predicate accounting mismatch'] : []),
            ...contacts.failures,
            ...guides.failures,
            ...assembly.missing.map((id) => id + ': no proved assembly path'),
            ...(assembly.invalid || assembly.duplicateIds
              ? ['Invalid assembly inventory']
              : []),
            ...material.disconnectedParts.map(
              (id) => id + ': disconnected original material cells'
            )
          ]
        })
      }
      work.push({
        basket: size,
        capacity: {
          maxExactPredicates: 100000000,
          maxBits: 16384,
          poses: 3,
          originalBoundaryGroups: allDesignedContacts(source, mount).length,
          slidingInterfaces: source.contacts.sliders.length
        },
        preparation,
        accountedPredicates,
        ...oracle.evaluator.work,
        ...oracle.reuseWork()
      })
    }
    const directory = resolve('.artifacts/quadruped-source-review')
    mkdirSync(directory, { recursive: true })
    writeFileSync(
      resolve(directory, 'material-relations.json'),
      JSON.stringify(
        { reports, work },
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      ) + '\n'
    )
    const failures = reports.flatMap((report) =>
      report.failures.map((item) => report.name + ': ' + item)
    )
    expect(
      failures,
      failures.slice(0, 30).join('\n') +
        '\nFull report: ' +
        directory +
        '/material-relations.json'
    ).toEqual([])
  }, 120000)
})
describe('basket placement in the authored arm root frame', () => {
  it.each([
    [0, Math.SQRT1_2, 0, Math.SQRT1_2],
    [Math.sin(0.1), 0, 0, Math.cos(0.1)]
  ])(
    'retains admitted mount rotation %j while entering the basket',
    (x, y, z, w) => {
      const owner = new QuadrupedRobotSourceOwner()
      const raw = JSON.parse(
        JSON.stringify(createSyntheticQuadrupedRobotDefinition())
      )
      raw.arms[0].mount.rotation = [x, y, z, w]
      const source = owner.prepare(raw)
      const mount = owner.mount(
        source,
        createSyntheticBasketInput([0.2, 0.1, 0.3])
      )
      const result = owner.evaluate(
        source,
        owner.candidatePoses(source, mount).basketPlacement,
        mount
      )
      const tool = result.frames.tools.find(
        (frame) => frame.chainId === 'left-holder'
      )
      if (!tool) throw new Error('Missing placement holder')
      expect(tool.position[0]).toBeGreaterThan(mount.opening.min[0])
      expect(tool.position[0]).toBeLessThan(mount.opening.max[0])
      expect(tool.position[2]).toBeGreaterThan(mount.opening.min[2])
      expect(tool.position[2]).toBeLessThan(mount.opening.max[2])
      expect(tool.position[1]).toBeCloseTo(
        source.definition.referenceBaseHeight + mount.opening.min[1] - 0.02,
        10
      )
      expect(
        new Vector3(0, 0, 1).applyQuaternion(new Quaternion(...tool.rotation)).y
      ).toBeCloseTo(-1, 10)
    }
  )
})

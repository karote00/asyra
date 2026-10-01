import { Quaternion, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import {
  divide as divideInterval,
  subtract as subtractInterval,
  multiply as multiplyInterval,
  interval as literalInterval
} from '../scalar-arithmetic'
import {
  createSyntheticWalkingRobotDefinition,
  readWalkingRobotDefinition
} from '../walking-robot-definition'
import {
  evaluateWalkingRobotPose,
  type WalkingRobotPose
} from '../walking-robot-kinematics'
import { WalkingRobotSourceOwner } from '../walking-robot-source'

const identityBase = {
  position: [0, 0, 0] as [number, number, number],
  rotation: [0, 0, 0, 1] as [number, number, number, number]
}
type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
    : T
const mutable = <T>(value: T): Mutable<T> =>
  structuredClone(value) as Mutable<T>
function required<T>(value: T | undefined): T {
  expect(value).toBeDefined()
  if (value === undefined) throw new Error('Missing test fixture value')
  return value
}
const changedBodyIds = (
  before: ReturnType<typeof evaluateWalkingRobotPose>,
  after: ReturnType<typeof evaluateWalkingRobotPose>
) =>
  after.bodyTransforms
    .filter(({ id, transform }) => {
      const original = before.bodyTransforms.find((body) => body.id === id)
      return JSON.stringify(original?.transform) !== JSON.stringify(transform)
    })
    .map(({ id }) => id)

interface OracleTransform {
  readonly position: readonly [number, number, number]
  readonly rotation: readonly [number, number, number, number]
}
const composeOracle = (
  parent: OracleTransform,
  child: OracleTransform
): OracleTransform => {
  const rotation = new Quaternion(...parent.rotation).multiply(
    new Quaternion(...child.rotation)
  )
  const position = new Vector3(...child.position)
    .applyQuaternion(new Quaternion(...parent.rotation))
    .add(new Vector3(...parent.position))
  return {
    position: [position.x, position.y, position.z],
    rotation: [rotation.x, rotation.y, rotation.z, rotation.w]
  }
}
const axisOracle = (axis: 'x' | 'y' | 'z', angle: number): OracleTransform => {
  let direction: Vector3
  if (axis === 'x') direction = new Vector3(1, 0, 0)
  else if (axis === 'y') direction = new Vector3(0, 1, 0)
  else direction = new Vector3(0, 0, 1)
  const rotation = new Quaternion().setFromAxisAngle(direction, angle)
  return {
    position: [0, 0, 0],
    rotation: [rotation.x, rotation.y, rotation.z, rotation.w]
  }
}
const expectTransformClose = (
  actual: OracleTransform,
  expected: OracleTransform
) => {
  for (let axis = 0; axis < 3; axis++)
    expect(actual.position[axis]).toBeCloseTo(expected.position[axis], 12)
  expect(
    Math.abs(
      new Quaternion(...actual.rotation).dot(
        new Quaternion(...expected.rotation)
      )
    )
  ).toBeCloseTo(1, 12)
}

describe('walking robot pure forward kinematics', () => {
  it('admits flat-foot tripod handovers only under the separately authored range', () => {
    const baseline = createSyntheticWalkingRobotDefinition({
      definitionId: 'tripod-fk-default'
    })
    const raw = mutable(baseline)
    const stations = raw.legs
      .filter(({ side }) => side === 'left')
      .map(({ mount }) => mount.position[2])
      .sort((a, b) => a - b)
    const spacing = Math.min(
      ...stations.slice(1).map((value, index) => value - stations[index])
    )
    const alpha = Math.min(
      ...raw.legs.map(
        (leg) =>
          divideInterval(
            subtractInterval(
              literalInterval(spacing),
              literalInterval(leg.foot.size[2])
            ),
            multiplyInterval(
              literalInterval(4),
              literalInterval(leg.upper.length)
            )
          ).low
      )
    )
    raw.definitionId = 'tripod-fk-authored'
    raw.jointEvidence = {
      kind: 'synthetic',
      id: 'tripod-authored-range',
      label: 'Tripod range - synthetic feasibility assumption'
    }
    for (const leg of raw.legs) leg.jointRanges.knee[0] = -alpha
    const candidate = readWalkingRobotDefinition(raw)
    const defaultSource = new WalkingRobotSourceOwner().prepare(baseline)
    const source = new WalkingRobotSourceOwner().prepare(candidate)
    expect(source.definition).toBe(candidate)
    for (const phase of [-1, 0, 1]) {
      const joints = mutable(candidate.presets.stowed)
      for (const leg of joints.legs) {
        const groupA = (leg.side === 'left') !== (leg.station === 'middle')
        leg.knee = phase * (groupA ? -alpha : alpha)
        leg.hip = -leg.knee
      }
      if (phase !== 0)
        expect(() =>
          evaluateWalkingRobotPose(defaultSource, {
            base: identityBase,
            joints
          })
        ).toThrow()
      const pose = evaluateWalkingRobotPose(source, {
        base: identityBase,
        joints
      })
      const feet = source.rig.legChains.map(
        (chain) =>
          required(
            pose.bodyTransforms.find((body) => body.id === chain.footBodyId)
          ).transform
      )
      for (const foot of feet) {
        // Exact cancellation in the completed quaternion: no tolerance grants level feet.
        expect(foot.rotation.slice(0, 3).every((value) => value === 0)).toBe(
          true
        )
        expect(foot.position[1]).toBe(feet[0].position[1])
      }
      expect(pose.source).toBe(source)
    }
    source.rig.legChains.forEach((chain, index) => {
      expect(
        required(
          source.rig.joints.find((joint) => joint.id === chain.jointIds[2])
        ).domain
      ).toEqual(candidate.legs[index].jointRanges.knee)
    })
  })
  it('evaluates every preset and limit endpoint without rebuilding source', () => {
    const definition = createSyntheticWalkingRobotDefinition({
      definitionId: 'fk-presets'
    })
    const owner = new WalkingRobotSourceOwner()
    const source = owner.prepare(definition)
    for (const joints of Object.values(source.rig.presets)) {
      const result = evaluateWalkingRobotPose(source, {
        base: identityBase,
        joints
      })
      expect(result.source).toBe(source)
      expect(result.bodyTransforms).toHaveLength(source.rig.bodies.length)
      expect(new Set(result.bodyTransforms.map(({ id }) => id)).size).toBe(
        source.rig.bodies.length
      )
      expect(result.work).toEqual({
        fk: 1,
        bodyTransforms: source.rig.bodies.length
      })
      for (const body of result.bodyTransforms)
        expect(body.sourceParts).toBe(
          required(source.rig.bodies.find(({ id }) => id === body.id)).parts
        )
      for (const field of ['sweep', 'gait', 'contactResult', 'moment'])
        expect(result).not.toHaveProperty(field)
    }
    const edge = mutable(source.rig.presets.stowed)
    edge.carriage = definition.carriage.liftRange[1]
    for (const arm of edge.arms) {
      const declared = required(
        definition.arms.find(
          (candidate) =>
            candidate.side === arm.side && candidate.role === arm.role
        )
      )
      arm.rootYaw = declared.jointRanges.rootYaw[1]
      arm.shoulderPitch = declared.jointRanges.shoulderPitch[0]
      arm.elbowPitch = declared.jointRanges.elbowPitch[1]
      arm.wristPitch = declared.jointRanges.wristPitch[0]
    }
    for (const leg of edge.legs) {
      const declared = required(
        definition.legs.find(
          (candidate) =>
            candidate.side === leg.side && candidate.station === leg.station
        )
      )
      leg.abduction = declared.jointRanges.abduction[1]
      leg.hip = declared.jointRanges.hip[0]
      leg.knee = declared.jointRanges.knee[1]
    }
    expect(
      evaluateWalkingRobotPose(source, { base: identityBase, joints: edge })
        .bodyTransforms
    ).toHaveLength(source.rig.bodies.length)
    expect(owner.work.builds).toBe(1)
  })

  it('moves only selected descendants and composes base rotation like Three', () => {
    const source = new WalkingRobotSourceOwner().prepare(
      createSyntheticWalkingRobotDefinition({ definitionId: 'fk-independent' })
    )
    const rest = evaluateWalkingRobotPose(source, {
      base: identityBase,
      joints: source.rig.presets.stowed
    })
    const armState = mutable(source.rig.presets.stowed)
    required(
      armState.arms.find(
        ({ side, role }) => side === 'left' && role === 'support'
      )
    ).rootYaw += 0.2
    const armChanged = changedBodyIds(
      rest,
      evaluateWalkingRobotPose(source, {
        base: identityBase,
        joints: armState
      })
    )
    expect(armChanged).toEqual(
      expect.arrayContaining([
        'left-support-upper',
        'left-support-forearm',
        'left-support-wrist',
        'left-support-tool',
        'left-support-guard'
      ])
    )
    expect(
      armChanged.some(
        (id) => id.startsWith('right-') || id.startsWith('left-front')
      )
    ).toBe(false)

    const legState = mutable(source.rig.presets.stowed)
    required(
      legState.legs.find(
        ({ side, station }) => side === 'right' && station === 'rear'
      )
    ).hip += 0.2
    expect(
      changedBodyIds(
        rest,
        evaluateWalkingRobotPose(source, {
          base: identityBase,
          joints: legState
        })
      )
    ).toEqual(['right-rear-upper', 'right-rear-lower', 'right-rear-foot'])

    const carriageState = mutable(source.rig.presets.stowed)
    carriageState.carriage += 0.1
    const carriageChanged = changedBodyIds(
      rest,
      evaluateWalkingRobotPose(source, {
        base: identityBase,
        joints: carriageState
      })
    )
    expect(carriageChanged).toContain('carriage')
    expect(
      carriageChanged.filter(
        (id) => id.startsWith('left-') || id.startsWith('right-')
      )
    ).toHaveLength(20)
    expect(carriageChanged.some((id) => /-(front|middle|rear)-/.test(id))).toBe(
      false
    )

    const angle = Math.PI / 3
    const base: WalkingRobotPose['base'] = {
      position: [1, 2, 3],
      rotation: [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)]
    }
    const moved = evaluateWalkingRobotPose(source, {
      base,
      joints: source.rig.presets.stowed
    })
    const local = rest.frames.inspectionHeads.left.position
    const expected = new Vector3(...local)
      .applyQuaternion(new Quaternion(...base.rotation))
      .add(new Vector3(...base.position))
    expect(moved.frames.inspectionHeads.left.position).toEqual([
      expected.x,
      expected.y,
      expected.z
    ])
    const localMass = required(
      rest.massProperties.bodies.find(({ bodyId }) => bodyId === 'base')
    )
    const movedMass = required(
      moved.massProperties.bodies.find(({ bodyId }) => bodyId === 'base')
    )
    const expectedMass = new Vector3(...localMass.position)
      .applyQuaternion(new Quaternion(...base.rotation))
      .add(new Vector3(...base.position))
    expect(movedMass.position).toEqual([
      expectedMass.x,
      expectedMass.y,
      expectedMass.z
    ])
    expect(changedBodyIds(rest, moved)).toHaveLength(source.rig.bodies.length)
  })

  it('applies every arm and leg joint to its exact descendants and composes a full chain', () => {
    const source = new WalkingRobotSourceOwner().prepare(
      createSyntheticWalkingRobotDefinition({ definitionId: 'fk-all-joints' })
    )
    const rest = evaluateWalkingRobotPose(source, {
      base: identityBase,
      joints: source.rig.presets.stowed
    })
    const armCases = [
      {
        field: 'rootYaw' as const,
        joint: 'root-yaw',
        descendants: ['upper', 'forearm', 'wrist', 'tool', 'guard']
      },
      {
        field: 'shoulderPitch' as const,
        joint: 'shoulder-pitch',
        descendants: ['forearm', 'wrist', 'tool', 'guard']
      },
      {
        field: 'elbowPitch' as const,
        joint: 'elbow-pitch',
        descendants: ['wrist', 'tool', 'guard']
      },
      {
        field: 'wristPitch' as const,
        joint: 'wrist-pitch',
        descendants: ['tool', 'guard']
      }
    ]
    for (const testCase of armCases) {
      const joints = mutable(source.rig.presets.stowed)
      const arm = required(
        joints.arms.find(
          ({ side, role }) => side === 'left' && role === 'support'
        )
      )
      arm[testCase.field] += 0.1
      const result = evaluateWalkingRobotPose(source, {
        base: identityBase,
        joints
      })
      expect(changedBodyIds(rest, result).sort()).toEqual(
        testCase.descendants.map((part) => `left-support-${part}`).sort()
      )
      const joint = required(
        source.rig.joints.find(
          ({ id }) => id === `left-support-${testCase.joint}`
        )
      )
      const parent = required(
        result.bodyTransforms.find(({ id }) => id === joint.parentBodyId)
      ).transform
      const child = required(
        result.bodyTransforms.find(({ id }) => id === joint.childBodyId)
      ).transform
      expectTransformClose(
        child,
        composeOracle(
          composeOracle(parent, joint.frame),
          axisOracle(joint.axis, arm[testCase.field])
        )
      )
    }

    const legCases = [
      {
        field: 'abduction' as const,
        joint: 'abduction',
        descendants: ['coxa', 'upper', 'lower', 'foot']
      },
      {
        field: 'hip' as const,
        joint: 'hip',
        descendants: ['upper', 'lower', 'foot']
      },
      {
        field: 'knee' as const,
        joint: 'knee',
        descendants: ['lower', 'foot']
      }
    ]
    for (const testCase of legCases) {
      const joints = mutable(source.rig.presets.stowed)
      const leg = required(
        joints.legs.find(
          ({ side, station }) => side === 'left' && station === 'front'
        )
      )
      leg[testCase.field] += 0.1
      const result = evaluateWalkingRobotPose(source, {
        base: identityBase,
        joints
      })
      expect(changedBodyIds(rest, result).sort()).toEqual(
        testCase.descendants.map((part) => `left-front-${part}`).sort()
      )
      const joint = required(
        source.rig.joints.find(
          ({ id }) => id === `left-front-${testCase.joint}`
        )
      )
      const parent = required(
        result.bodyTransforms.find(({ id }) => id === joint.parentBodyId)
      ).transform
      const child = required(
        result.bodyTransforms.find(({ id }) => id === joint.childBodyId)
      ).transform
      expectTransformClose(
        child,
        composeOracle(
          composeOracle(parent, joint.frame),
          axisOracle(joint.axis, leg[testCase.field])
        )
      )
    }

    const joints = mutable(source.rig.presets.stowed)
    const arm = required(
      joints.arms.find(
        ({ side, role }) => side === 'left' && role === 'support'
      )
    )
    Object.assign(arm, {
      rootYaw: 0.31,
      shoulderPitch: -0.27,
      elbowPitch: 0.62,
      wristPitch: 0.19
    })
    const result = evaluateWalkingRobotPose(source, {
      base: identityBase,
      joints
    })
    const specification = required(
      source.definition.arms.find(
        ({ side, role }) => side === 'left' && role === 'support'
      )
    )
    let expected = composeOracle(identityBase, {
      position: [0, joints.carriage, 0],
      rotation: [0, 0, 0, 1]
    })
    expected = composeOracle(expected, specification.mount)
    expected = composeOracle(expected, axisOracle('y', arm.rootYaw))
    expected = composeOracle(expected, {
      position: [0, specification.upper.length, 0],
      rotation: [0, 0, 0, 1]
    })
    expected = composeOracle(expected, axisOracle('x', arm.shoulderPitch))
    expected = composeOracle(expected, {
      position: [0, specification.forearm.length, 0],
      rotation: [0, 0, 0, 1]
    })
    expected = composeOracle(expected, axisOracle('x', arm.elbowPitch))
    expected = composeOracle(expected, {
      position: [0, specification.wrist.length, 0],
      rotation: [0, 0, 0, 1]
    })
    expected = composeOracle(expected, axisOracle('x', arm.wristPitch))
    expectTransformClose(
      required(
        result.bodyTransforms.find(({ id }) => id === 'left-support-tool')
      ).transform,
      expected
    )
  })

  it('preserves link lengths, mirrored roots, frames and mass identity', () => {
    const source = new WalkingRobotSourceOwner().prepare(
      createSyntheticWalkingRobotDefinition({ definitionId: 'fk-frames' })
    )
    const result = evaluateWalkingRobotPose(source, {
      base: identityBase,
      joints: source.rig.presets.leftWorking
    })
    expect(result.frames.tools).toHaveLength(4)
    expect(result.frames.feet).toHaveLength(6)
    expect(result.frames.contacts.feet).toHaveLength(6)
    expect(result.frames.contacts.supportTools).toHaveLength(2)
    expect(result.frames.contacts.cuttingEdges).toHaveLength(2)
    for (const contact of [
      ...result.frames.contacts.feet,
      ...result.frames.contacts.supportTools,
      ...result.frames.contacts.cuttingEdges
    ]) {
      const reference = required(
        [
          ...source.rig.contacts.feet,
          ...source.rig.contacts.supportTools,
          ...source.rig.contacts.cuttingEdges
        ].find(({ part }) => part.id.startsWith(contact.chainId))
      )
      expect(contact.part).toBe(reference.part)
      expect(contact.patch).toBe(reference.patch)
      const coordinates: number[][] = []
      for (const range of reference.patch.ranges)
        for (
          let indexOffset = range.indexStart;
          indexOffset < range.indexStart + range.indexCount;
          indexOffset++
        ) {
          const vertex = reference.part.shape.indices[indexOffset] * 3
          coordinates.push([
            reference.part.shape.positions[vertex],
            reference.part.shape.positions[vertex + 1],
            reference.part.shape.positions[vertex + 2]
          ])
        }
      const centre = coordinates
        .reduce(
          (sum, coordinate) =>
            sum.map((value, axis) => value + coordinate[axis]),
          [0, 0, 0]
        )
        .map((value) => value / coordinates.length) as [number, number, number]
      const body = required(
        result.bodyTransforms.find(({ id }) => id === reference.part.bodyId)
      ).transform
      const expected = composeOracle(
        composeOracle(body, reference.part.localFrame),
        { position: centre, rotation: [0, 0, 0, 1] }
      )
      for (let axis = 0; axis < 3; axis++)
        expect(contact.position[axis]).toBeCloseTo(expected.position[axis], 12)
      const tool = result.frames.tools.find(
        ({ chainId }) => chainId === contact.chainId
      )
      if (tool) expect(contact.position).not.toEqual(tool.position)
    }
    expect(result.frames.inspectionHeads.left.position[0]).toBeLessThan(0)
    expect(result.frames.inspectionHeads.right.position[0]).toBeGreaterThan(0)
    expect(
      required(
        result.frames.armRoots.find(({ chainId }) => chainId === 'left-support')
      ).position[0]
    ).toBeLessThan(0)
    expect(
      required(
        result.frames.armRoots.find(
          ({ chainId }) => chainId === 'right-support'
        )
      ).position[0]
    ).toBeGreaterThan(0)
    const leftRotation = required(
      result.frames.armRoots.find(({ chainId }) => chainId === 'left-support')
    ).rotation
    const rightRotation = required(
      result.frames.armRoots.find(({ chainId }) => chainId === 'right-support')
    ).rotation
    expect(leftRotation[1]).toBeCloseTo(-rightRotation[1], 12)
    expect(leftRotation[3]).toBeCloseTo(rightRotation[3], 12)
    for (const segment of result.linkSegments)
      expect(
        new Vector3(...segment.to).distanceTo(new Vector3(...segment.from))
      ).toBeCloseTo(segment.length, 12)
    for (const chain of source.rig.armChains) {
      const segments = result.linkSegments.filter(({ bodyId }) =>
        chain.bodyIds.includes(bodyId)
      )
      for (let index = 0; index < segments.length - 1; index++)
        expect(segments[index].to).toEqual(segments[index + 1].from)
    }
    expect(result.massProperties.source).toBe(source.massProperties)
    expect(result.massProperties.bodies).toHaveLength(
      source.massProperties.bodies.length
    )
  })

  it('accepts a bilateral pose and rejects invalid input atomically', () => {
    const source = new WalkingRobotSourceOwner().prepare(
      createSyntheticWalkingRobotDefinition({ definitionId: 'fk-validation' })
    )
    const bilateral = mutable(source.rig.presets.leftWorking)
    for (const arm of bilateral.arms) {
      const replacement = source.rig.presets.rightWorking.arms.find(
        (candidate) =>
          candidate.side === arm.side && candidate.role === arm.role
      )
      if (arm.side === 'right') Object.assign(arm, replacement)
    }
    expect(
      evaluateWalkingRobotPose(source, {
        base: identityBase,
        joints: bilateral
      }).frames.tools
    ).toHaveLength(4)
    const invalid: WalkingRobotPose[] = []
    const missing = mutable(bilateral)
    missing.legs.pop()
    invalid.push({ base: identityBase, joints: missing })
    const extra = mutable(bilateral) as typeof bilateral & { surprise?: number }
    extra.surprise = 1
    invalid.push({ base: identityBase, joints: extra })
    const nan = mutable(bilateral)
    nan.arms[0].elbowPitch = Number.NaN
    invalid.push({ base: identityBase, joints: nan })
    const outside = mutable(bilateral)
    outside.carriage = 99
    invalid.push({ base: identityBase, joints: outside })
    invalid.push({
      base: { ...identityBase, rotation: [0, 0, 0, 0] },
      joints: bilateral
    })
    for (const pose of invalid)
      expect(() => evaluateWalkingRobotPose(source, pose)).toThrow()
  })
})

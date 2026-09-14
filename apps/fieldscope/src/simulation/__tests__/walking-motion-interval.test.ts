import { Quaternion, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { createSyntheticWalkingRobotDefinition } from '../../domain/walking-robot-definition'
import { evaluateWalkingRobotPose } from '../../domain/walking-robot-kinematics'
import { WalkingRobotSourceOwner } from '../../domain/walking-robot-source'
import { TriangleBuilder } from '../../domain/mesh'
import {
  evaluateWalkingMotionInterval,
  prepareWalkingMotionIntervals,
  walkingMotionPoseAt
} from '../walking-motion-interval'

type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
    : T

const baseQuaternion = (heading: number, pitch: number, roll: number) => {
  const rotation = new Quaternion()
    .setFromAxisAngle(new Vector3(0, 1, 0), heading)
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitch))
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), roll))
  return [rotation.x, rotation.y, rotation.z, rotation.w] as const
}
function fixture(intent: 'straight' | 'reverse' | 'turn' = 'straight') {
  const source = new WalkingRobotSourceOwner().prepare(
    createSyntheticWalkingRobotDefinition({ definitionId: 'motion-interval' })
  )
  const middle = structuredClone(source.rig.presets.stowed) as Mutable<
    typeof source.rig.presets.stowed
  >
  middle.carriage = 0.8
  middle.arms[0].rootYaw = 0.3
  middle.legs[0].abduction = 0.2
  const path = {
    id: `path-${intent}`,
    intent,
    knots: [
      {
        time: 0,
        base: { position: [-1, 0, 0] as const, heading: 0, pitch: 0, roll: 0 },
        joints: source.rig.presets.stowed
      },
      {
        time: 0.5,
        base: {
          position: [0, 0.1, 0.2] as const,
          heading: 0.2,
          pitch: -0.1,
          roll: 0.05
        },
        joints: middle
      },
      {
        time: 1,
        base: {
          position: [1, 0, 0.4] as const,
          heading: 0.4,
          pitch: 0,
          roll: 0
        },
        joints: source.rig.presets.stowed
      }
    ]
  } as const
  const input = {
    path,
    evaluation: { from: 0, until: 1 },
    stance: {
      phases: [
        { from: 0, until: 0.5 },
        { from: 0.5, until: 1 }
      ]
    },
    load: {
      crate: { kind: 'unknown' as const },
      carried: { kind: 'none' as const }
    },
    budget: { maxIntervals: 8, maxEnvelopePairs: 1000 }
  }
  return { source, path, input }
}

describe('walking motion interval FK', () => {
  it('sweeps separate crate walls without filling its open cavity', () => {
    const { source, input } = fixture()
    const dimensions = [
      { id: 'bottom', center: [0, 0, 0], size: [0.4, 0.02, 0.3] },
      { id: 'left', center: [-0.19, 0.1, 0], size: [0.02, 0.2, 0.3] },
      { id: 'right', center: [0.19, 0.1, 0], size: [0.02, 0.2, 0.3] },
      { id: 'front', center: [0, 0.1, -0.14], size: [0.36, 0.2, 0.02] },
      { id: 'back', center: [0, 0.1, 0.14], size: [0.36, 0.2, 0.02] }
    ] as const
    const sourceParts = dimensions.map(({ id, center, size }) => {
      const builder = new TriangleBuilder()
      builder.box(center, size)
      expect(builder.regions()[0].kind).toBe('closed-solid')
      return {
        id,
        sourceId: id,
        shape: {
          kind: 'triangles' as const,
          positions: builder.positions,
          indices: builder.indices
        }
      }
    })
    const crate = {
      kind: 'attached' as const,
      sourceCoverage: 'complete' as const,
      provenance: {
        kind: 'synthetic' as const,
        id: 'crate',
        label: 'Synthetic crate'
      },
      sourceParts,
      holderBodyId: 'base' as const,
      localFrames: sourceParts.map(() => ({
        position: [0, 0.4, 0] as const,
        rotation: [0, 0, 0, 1] as const
      })),
      massIdentity: 'crate-mass'
    }
    const result = prepareWalkingMotionIntervals(source, {
      ...input,
      load: { crate, carried: { kind: 'none' as const } }
    })
    for (const segment of result.segments) {
      expect(segment.carriedEnvelopes).toHaveLength(5)
      expect(
        segment.carriedEnvelopes.map(({ attachment }) => attachment.sourceId)
      ).toEqual(crate.sourceParts.map(({ sourceId }) => sourceId))
      expect(
        segment.carriedEnvelopes.every(
          ({ attachment }, index) =>
            attachment.shape === crate.sourceParts[index].shape
        )
      ).toBe(true)
    }
    expect(result.work.partBounds).toBe(
      (source.parts.reduce((sum, part) => sum + part.regions.length, 0) + 5) * 2
    )
    const staticPath = {
      ...input.path,
      knots: input.path.knots.map((knot) => ({
        ...knot,
        base: { position: [0, 0, 0] as const, heading: 0, pitch: 0, roll: 0 },
        joints: source.rig.presets.stowed
      }))
    }
    const stationary = prepareWalkingMotionIntervals(source, {
      ...input,
      path: staticPath,
      load: { crate, carried: { kind: 'none' } }
    })
    const cavityPoint = [0, 0.5, 0]
    for (const segment of stationary.segments)
      for (const { bounds } of segment.carriedEnvelopes)
        expect(
          cavityPoint.some(
            (value, axis) =>
              value < bounds.min[axis] || value > bounds.max[axis]
          )
        ).toBe(true)
  })
  it('encloses every W2 body part at a singleton pose', () => {
    const { source, path } = fixture()
    const result = evaluateWalkingMotionInterval(source, path, {
      from: 0.5,
      until: 0.5,
      attachments: []
    })
    expect(new Set(result.envelopes.map(({ body }) => body.id)).size).toBe(
      source.rig.bodies.length
    )
    expect(result.envelopes).toHaveLength(
      source.parts.reduce((sum, part) => sum + part.regions.length, 0)
    )
    for (const part of source.parts) {
      expect(
        result.envelopes
          .filter((envelope) => envelope.part === part)
          .map(({ region }) => region)
      ).toEqual(part.regions)
      expect(
        part.regions.reduce((sum, region) => sum + region.indexCount, 0)
      ).toBe(part.shape.indices.length)
    }
    const knot = path.knots[1]
    const pointPose = evaluateWalkingRobotPose(source, {
      base: {
        position: knot.base.position,
        rotation: baseQuaternion(
          knot.base.heading,
          knot.base.pitch,
          knot.base.roll
        )
      },
      joints: knot.joints
    })
    for (const envelope of result.envelopes) {
      expect(envelope.part).toBeDefined()
      expect(envelope.part.regions).toContain(envelope.region)
      const body = pointPose.bodyTransforms.find(
        ({ id }) => id === envelope.body.id
      )
      expect(body).toBeDefined()
      if (!body) throw new Error('Missing test body')
      const bodyPosition = new Vector3(...body.transform.position)
      const bodyRotation = new Quaternion(...body.transform.rotation)
      const partPosition = new Vector3(...envelope.part.localFrame.position)
        .applyQuaternion(bodyRotation)
        .add(bodyPosition)
      const partRotation = bodyRotation
        .clone()
        .multiply(new Quaternion(...envelope.part.localFrame.rotation))
      for (const index of new Set(
        envelope.part.shape.indices.slice(
          envelope.region.indexStart,
          envelope.region.indexStart + envelope.region.indexCount
        )
      )) {
        const offset = index * 3
        const point = new Vector3(
          envelope.part.shape.positions[offset],
          envelope.part.shape.positions[offset + 1],
          envelope.part.shape.positions[offset + 2]
        )
          .applyQuaternion(partRotation)
          .add(partPosition)
        for (let axis = 0; axis < 3; axis++) {
          expect(envelope.bounds.min[axis]).toBeLessThanOrEqual(
            point.getComponent(axis)
          )
          expect(envelope.bounds.max[axis]).toBeGreaterThanOrEqual(
            point.getComponent(axis)
          )
        }
      }
    }
    expect(result.work.pointFk).toBe(1)
    expect(result.work.partBounds).toBe(
      source.parts.reduce((sum, part) => sum + part.regions.length, 0)
    )
  })

  it('covers every path and stance boundary without endpoint-only motion', () => {
    const { source, input } = fixture()
    const result = prepareWalkingMotionIntervals(source, input)
    expect(result.segments.map(({ from, until }) => [from, until])).toEqual([
      [0, 0.5],
      [0.5, 1]
    ])
    expect(result.segments.every(({ visited }) => visited)).toBe(true)
    expect(result.work.intervals).toBe(2)
    expect(result.work.partBounds).toBe(
      source.parts.reduce((sum, part) => sum + part.regions.length, 0) * 2
    )
    expect(result.unvisitedIntervals).toBe(0)
    const firstChassis = result.segments[0].envelopes.filter(
      ({ part }) => part.id === 'chassis'
    )
    expect(firstChassis.length).toBeGreaterThan(0)
    expect(
      Math.min(...firstChassis.map(({ bounds }) => bounds.min[0]))
    ).toBeLessThan(-1)
    expect(
      Math.max(...firstChassis.map(({ bounds }) => bounds.max[0]))
    ).toBeGreaterThan(0)
  })

  it.each([false, true])(
    'outwardly contains interior arm and leg motion with full base turn %s',
    (fullTurn) => {
      const { source, input } = fixture()
      const path = {
        ...input.path,
        knots: input.path.knots.map((knot) => ({
          ...knot,
          base: {
            ...knot.base,
            heading: fullTurn ? knot.time * Math.PI * 2 : knot.base.heading
          }
        }))
      }
      const result = prepareWalkingMotionIntervals(source, { ...input, path })
      for (const segment of result.segments) {
        for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
          const time = segment.from + (segment.until - segment.from) * fraction
          const pose = evaluateWalkingRobotPose(
            source,
            walkingMotionPoseAt(path, time)
          )
          for (const { body, part, region, bounds } of segment.envelopes) {
            const bodyTransform = pose.bodyTransforms.find(
              ({ id }) => id === body.id
            )
            if (!bodyTransform) throw new Error('Missing test body')
            const frame = bodyTransform.transform
            const rotation = new Quaternion(...frame.rotation),
              position = new Vector3(...part.localFrame.position)
                .applyQuaternion(rotation)
                .add(new Vector3(...frame.position)),
              partRotation = rotation
                .clone()
                .multiply(new Quaternion(...part.localFrame.rotation))
            const minima = [Infinity, Infinity, Infinity],
              maxima = [-Infinity, -Infinity, -Infinity]
            for (const index of new Set(
              part.shape.indices.slice(
                region.indexStart,
                region.indexStart + region.indexCount
              )
            )) {
              const value = new Vector3(
                ...part.shape.positions.slice(index * 3, index * 3 + 3)
              )
                .applyQuaternion(partRotation)
                .add(position)
              for (let axis = 0; axis < 3; axis++) {
                minima[axis] = Math.min(minima[axis], value.getComponent(axis))
                maxima[axis] = Math.max(maxima[axis], value.getComponent(axis))
              }
            }
            for (let axis = 0; axis < 3; axis++) {
              expect(
                bounds.min[axis],
                `${body.id}/${part.id}/${region.id}/${time}`
              ).toBeLessThanOrEqual(minima[axis])
              expect(
                bounds.max[axis],
                `${body.id}/${part.id}/${region.id}/${time}`
              ).toBeGreaterThanOrEqual(maxima[axis])
            }
          }
        }
      }
      expect(result.work.intervalFk).toBe(2)
      expect(result.work.partBounds).toBe(
        source.parts.reduce((sum, part) => sum + part.regions.length, 0) * 2
      )
    }
  )

  it('keeps reverse and turn identity distinct and exposes bounded exhaustion', () => {
    const reverse = fixture('reverse')
    const turn = fixture('turn')
    const reverseResult = prepareWalkingMotionIntervals(
      reverse.source,
      reverse.input
    )
    const exhausted = prepareWalkingMotionIntervals(turn.source, {
      ...turn.input,
      budget: { ...turn.input.budget, maxIntervals: 1 }
    })
    expect(reverseResult.path.intent).toBe('reverse')
    expect(exhausted.path.intent).toBe('turn')
    expect(exhausted.segments).toHaveLength(2)
    expect(exhausted.segments[0].visited).toBe(true)
    expect(exhausted.segments[1]).toMatchObject({
      visited: false,
      envelopes: []
    })
    expect(exhausted.unvisitedIntervals).toBe(1)
  })
})

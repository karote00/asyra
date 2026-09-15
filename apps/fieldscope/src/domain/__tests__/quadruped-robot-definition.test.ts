import { describe, expect, it } from 'vitest'
import {
  createSyntheticQuadrupedRobotDefinition,
  readQuadrupedRobotDefinition,
  readQuadrupedRobotPose,
  QuadrupedDefinitionError
} from '../quadruped-robot-definition'
import { createSyntheticWalkingRobotDefinition } from '../walking-robot-definition'
import { DEFAULT_ROBOT } from '../robot-configuration'

type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
    : T
const clone = <T>(value: T): Mutable<T> => structuredClone(value) as Mutable<T>
const candidate = () => createSyntheticQuadrupedRobotDefinition()

describe('quadruped definition schema - no source or motion admission', () => {
  it('creates the versioned four-leg four-arm candidate with independent side stages', () => {
    const definition = candidate()
    expect(definition.format).toBe('walking-robot-definition/3')
    expect(definition.topology).toBe('four-arm-four-leg')
    expect(definition.sourceProfile).toBe('side-stage-articulation/2')
    expect(
      definition.legs.map(({ side, station }) => side + '-' + station).sort()
    ).toEqual(['left-front', 'left-rear', 'right-front', 'right-rear'])
    expect(
      definition.arms.map(({ side, role }) => side + '-' + role).sort()
    ).toEqual(['left-cutter', 'left-holder', 'right-cutter', 'right-holder'])
    expect(definition).not.toHaveProperty('mast')
    expect(definition).not.toHaveProperty('carriage')
    expect(definition.evidence.kind).toBe('synthetic')
    expect(readQuadrupedRobotDefinition(definition)).toBe(definition)
    expect(definition.presets.travel.lifts).toEqual({ left: 0, right: 0 })
    expect(
      definition.presets.travel.arms
        .filter((arm) => arm.role === 'cutter')
        .every((arm) => arm.toolClosure === 1)
    ).toBe(true)
    for (const side of ['left', 'right'] as const) {
      const stage = definition.stages[side]
      expect(
        definition.referenceBaseHeight + stage.mount.position[1]
      ).toBeCloseTo(0.61)
      expect(stage.liftRange).toEqual([0, 1.32])
      expect(
        definition.referenceBaseHeight +
          stage.mount.position[1] +
          definition.arms[0].mount.position[1] +
          stage.liftRange[1]
      ).toBeCloseTo(2.01)
    }
    for (const arm of definition.arms) {
      expect(arm.upper.length).toBe(0.4)
      expect(arm.forearm.length).toBe(0.4)
      expect(arm.wrist.length).toBe(0.15)
      expect(arm.tool.activePoint).toEqual([0, 0, 0.1])
      expect(arm.jointRanges.rootPitch[0]).toBeLessThan(0)
    }
  })

  it('detaches and freezes admitted JSON without freezing the caller', () => {
    const raw = clone(candidate())
    const definition = readQuadrupedRobotDefinition(raw)
    expect(definition).toEqual(raw)
    expect(definition).not.toBe(raw)
    expect(Object.isFrozen(definition.stages.left.mount.position)).toBe(true)
    expect(Object.isFrozen(raw)).toBe(false)
    raw.stages.left.liftRange[1] = 2
    expect(definition.stages.left.liftRange[1]).toBe(1.32)
    expect(
      readQuadrupedRobotDefinition(JSON.parse(JSON.stringify(definition)))
    ).toEqual(definition)
  })

  it('admits three complete definition-bound states and allows unequal side heights', () => {
    const definition = candidate()
    expect(Object.keys(definition.presets).sort()).toEqual([
      'basketPlacement',
      'bilateralHarvest',
      'travel'
    ])
    for (const pose of Object.values(definition.presets)) {
      expect(readQuadrupedRobotPose(definition, pose)).toEqual(pose)
    }
    const raw = clone(definition.presets.bilateralHarvest)
    raw.lifts.left = 1.2
    raw.lifts.right = 0.2
    const pose = readQuadrupedRobotPose(definition, raw)
    expect(pose.lifts).toEqual({ left: 1.2, right: 0.2 })
    expect(definition.presets.bilateralHarvest.lifts).not.toEqual(pose.lifts)
    expect(() =>
      readQuadrupedRobotPose(definition, { ...raw, definitionId: 'foreign' })
    ).toThrow()
    raw.lifts.left = 1.32 + Number.EPSILON
    expect(() => readQuadrupedRobotPose(definition, raw)).toThrow()
  })

  it('rejects missing, duplicated, six-leg, mast and coupled-stage schema shapes', () => {
    const mutations: ((raw: Mutable<ReturnType<typeof candidate>>) => void)[] =
      [
        (raw) => {
          raw.arms.pop()
        },
        (raw) => {
          raw.arms[1] = clone(raw.arms[0])
        },
        (raw) => {
          raw.legs.push(clone(raw.legs[0]))
        },
        (raw) => {
          raw.legs[1] = clone(raw.legs[0])
        },
        (raw) => {
          Object.assign(raw, { mast: {} })
        },
        (raw) => {
          Object.assign(raw.presets.travel, { carriage: 0.3 })
        },
        (raw) => {
          Object.assign(raw.stages, { shared: raw.stages.left })
        },
        (raw) => {
          raw.stages.right = raw.stages.left
        },
        (raw) => {
          raw.presets.travel.lifts.left = 0.4
        },
        (raw) => {
          const cutter = raw.presets.travel.arms.find(
            (arm) => arm.role === 'cutter'
          )
          if (!cutter) throw new Error('Missing cutter fixture')
          cutter.toolClosure = 0
        }
      ]
    for (const mutate of mutations) {
      const raw = clone(candidate())
      mutate(raw)
      expect(() => readQuadrupedRobotDefinition(raw)).toThrow()
    }
  })

  it('rejects invalid numbers, ranges, tool roles and pose joints', () => {
    const mutations: ((raw: Mutable<ReturnType<typeof candidate>>) => void)[] =
      [
        (raw) => {
          raw.chassis.massKg = NaN
        },
        (raw) => {
          raw.arms[0].upper.length = Infinity
        },
        (raw) => {
          raw.chassis.size[0] = 0
        },
        (raw) => {
          raw.stages.left.mount.rotation = [0, 0, 0, 0]
        },
        (raw) => {
          raw.stages.left.liftRange = [1, 0]
        },
        (raw) => {
          raw.arms[0].jointRanges.rootPitch = [0, 0]
        },
        (raw) => {
          raw.arms[0].tool.functions = ['cutting']
        },
        (raw) => {
          raw.presets.travel.arms[0].rootPitch = 100
        },
        (raw) => {
          raw.presets.travel.legs.pop()
        },
        (raw) => {
          raw.presets.bilateralHarvest.arms[0].toolClosure = 2
        }
      ]
    for (const mutate of mutations) {
      const raw = clone(candidate())
      mutate(raw)
      expect(() => readQuadrupedRobotDefinition(raw)).toThrow()
    }
  })

  it('checks complete fixed body width without imposing a height cap or resizing', () => {
    const raw = clone(candidate())
    raw.chassis.size[0] = 0.8
    raw.chassis.size[1] = 5
    expect(readQuadrupedRobotDefinition(raw).chassis.size).toEqual([
      0.8, 5, 0.82
    ])
    raw.chassis.size[0] = 0.8000000000000002
    expect(() => readQuadrupedRobotDefinition(raw)).toThrow(/body-width/)
    expect(raw.chassis.size[0]).toBe(0.8000000000000002)
    const latch = clone(candidate())
    latch.platform.fixedParts[0].centre[0] = 0.8
    expect(() => readQuadrupedRobotDefinition(latch)).toThrow(/body-width/)
  })

  it('rejects old topology only at the successor boundary and preserves its identity', () => {
    const old = createSyntheticWalkingRobotDefinition({
      definitionId: 'saved-six-leg'
    })
    const bytes = JSON.stringify(old)
    for (const raw of [
      old,
      { ...old, format: 'walking-robot-definition/1' },
      DEFAULT_ROBOT
    ]) {
      expect(() => readQuadrupedRobotDefinition(raw)).toThrow(
        /unsupported-topology/
      )
    }
    try {
      readQuadrupedRobotDefinition(old)
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(QuadrupedDefinitionError)
      expect((error as QuadrupedDefinitionError).identity).toEqual({
        format: 'walking-robot-definition/2',
        topology: 'four-arm-six-leg',
        definitionId: 'saved-six-leg'
      })
    }
    expect(JSON.stringify(old)).toBe(bytes)
    expect(() =>
      readQuadrupedRobotDefinition({
        ...candidate(),
        format: 'walking-robot-definition/99'
      })
    ).toThrow(/unsupported-version/)
    expect(() =>
      readQuadrupedRobotDefinition({
        ...candidate(),
        sourceProfile: 'solid-articulation/2'
      })
    ).toThrow()
  })
})

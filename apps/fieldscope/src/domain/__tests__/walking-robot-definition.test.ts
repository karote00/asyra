import { describe, expect, it } from 'vitest'
import { DEFAULT_ROBOT } from '../robot-configuration'
import {
  WALKING_ROBOT_FORMAT,
  WALKING_ROBOT_TOPOLOGY,
  classifyWalkingRobotDefinition,
  createSyntheticWalkingRobotDefinition,
  readWalkingRobotDefinition
} from '../walking-robot-definition'

type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
    : T
const clone = <T>(value: T): Mutable<T> => structuredClone(value) as Mutable<T>

describe('walking robot definition admission', () => {
  it('authors v2 articulation while recognizing immutable v1 bytes without admitting them', () => {
    const definition = createSyntheticWalkingRobotDefinition({
      definitionId: 'solid-source-version'
    })
    expect(definition.format).toBe('walking-robot-definition/2')
    expect(classifyWalkingRobotDefinition(definition)).toBe('walking-v2')
    expect(definition).toHaveProperty(
      'sourceModel.kind',
      'solid-articulation/1'
    )
    const legacy = structuredClone(definition) as unknown as Record<
      string,
      unknown
    >
    legacy.format = 'walking-robot-definition/1'
    delete legacy.sourceModel
    const bytes = JSON.stringify(legacy)
    expect(classifyWalkingRobotDefinition(legacy)).toBe('walking-v1')
    expect(() => readWalkingRobotDefinition(legacy)).toThrow()
    expect(JSON.stringify(legacy)).toBe(bytes)
  })

  it('requires explicit articulation ratios and rail geometry covering the full admitted lift', () => {
    const baseline = () =>
      clone(
        createSyntheticWalkingRobotDefinition({
          definitionId: 'solid-source-profile'
        })
      )
    const definition = baseline()
    expect(definition.sourceModel).toMatchObject({
      kind: 'solid-articulation/1',
      pinRadiusRatio: 1 / 8,
      sleeveInnerRadiusRatio: 3 / 16,
      sleeveOuterRadiusRatio: 1 / 2,
      axialGapRatio: 1 / 16,
      linkSetbackRatio: 1 / 2
    })
    expect(definition.carriage.liftRange).toEqual([0.5, 1.65])
    for (const [key, value] of [
      ['pinRadiusRatio', 0],
      ['pinRadiusRatio', 1],
      ['sleeveInnerRadiusRatio', 0.1],
      ['sleeveInnerRadiusRatio', 0.49],
      ['sleeveOuterRadiusRatio', 0.1],
      ['axialGapRatio', 0],
      ['axialGapRatio', 0.5],
      ['linkSetbackRatio', 2]
    ] as const) {
      const invalid = baseline()
      invalid.sourceModel[key] = value
      expect(() => readWalkingRobotDefinition(invalid)).toThrow()
    }
    const shortRails = baseline()
    shortRails.base.mast.size[1] = 0.7
    shortRails.base.mast.centre[1] = 0.62
    expect(() => readWalkingRobotDefinition(shortRails)).toThrow()
    const widerRails = baseline()
    widerRails.base.mast.size[2] = 1
    expect(() => readWalkingRobotDefinition(widerRails)).toThrow()
    const displacedRails = baseline()
    displacedRails.base.mast.centre[2] = 0.001
    expect(() => readWalkingRobotDefinition(displacedRails)).toThrow()
    const exhaustedCore = baseline()
    exhaustedCore.legs[0].coxa.length = 0.052
    expect(() => readWalkingRobotDefinition(exhaustedCore)).toThrow()
  })

  it('creates an explicit immutable four-arm six-leg synthetic baseline', () => {
    const definition = createSyntheticWalkingRobotDefinition({
      definitionId: 'adjustable-walking-candidate'
    })
    expect(definition.format).toBe(WALKING_ROBOT_FORMAT)
    expect(definition.topology).toBe(WALKING_ROBOT_TOPOLOGY)
    expect(classifyWalkingRobotDefinition(definition)).toBe('walking-v2')
    expect(definition.base.chassis.size).toEqual([0.58, 0.3, 0.78])
    expect(definition.carriage.liftRange).toEqual([0.5, 1.65])
    expect(
      definition.arms.map(({ side, role }) => `${side}-${role}`).sort()
    ).toEqual(['left-cutter', 'left-support', 'right-cutter', 'right-support'])
    expect(
      definition.legs.map(({ side, station }) => `${side}-${station}`).sort()
    ).toEqual([
      'left-front',
      'left-middle',
      'left-rear',
      'right-front',
      'right-middle',
      'right-rear'
    ])
    expect(Object.isFrozen(definition)).toBe(true)
    expect(Object.isFrozen(definition.presets.leftWorking.arms)).toBe(true)
    expect(definition.geometryEvidence).toMatchObject({ kind: 'synthetic' })
    expect(definition.jointEvidence).toMatchObject({ kind: 'synthetic' })
    expect(definition.massEvidence).toMatchObject({ kind: 'synthetic' })
    for (const arm of definition.presets.stowed.arms)
      expect(arm).toMatchObject({
        rootYaw: 0,
        shoulderPitch: 0,
        elbowPitch: 0,
        wristPitch: 0
      })
    for (const [side, preset] of [
      ['left', definition.presets.leftWorking],
      ['right', definition.presets.rightWorking]
    ] as const)
      for (const arm of preset.arms)
        expect(arm).toMatchObject(
          arm.side === side
            ? { shoulderPitch: -0.25, elbowPitch: 0.75, wristPitch: -0.35 }
            : { shoulderPitch: 0, elbowPitch: 0, wristPitch: 0 }
        )
    for (const preset of Object.values(definition.presets))
      for (const leg of preset.legs)
        expect(leg).toMatchObject({ abduction: 0, hip: 0, knee: 0 })
  })

  it('admits measured provenance, detaches caller bytes and preserves complete poses', () => {
    const raw = clone(
      createSyntheticWalkingRobotDefinition({ definitionId: 'measured-rig' })
    )
    raw.geometryEvidence = { kind: 'measured', id: 'geometry-survey-7' }
    raw.jointEvidence = { kind: 'measured', id: 'joint-test-4' }
    raw.massEvidence = { kind: 'measured', id: 'scale-session-2' }
    const admitted = readWalkingRobotDefinition(raw)
    raw.base.chassis.size[0] = 99
    raw.presets.stowed.arms[0].rootYaw = 99
    expect(admitted.geometryEvidence).toEqual({
      kind: 'measured',
      id: 'geometry-survey-7'
    })
    expect(admitted.base.chassis.size[0]).toBe(0.58)
    expect(admitted.presets.stowed.arms[0].rootYaw).not.toBe(99)
    for (const preset of Object.values(admitted.presets)) {
      expect(preset.arms).toHaveLength(4)
      expect(preset.legs).toHaveLength(6)
    }
  })

  it('rejects malformed topology, geometry, masses, limits and presets', () => {
    const baseline = () =>
      clone(createSyntheticWalkingRobotDefinition({ definitionId: 'invalid' }))
    const invalid: unknown[] = []
    const badFormat = baseline()
    ;(badFormat as { format: string }).format = 'walking-robot-definition/9'
    invalid.push(badFormat)
    const extra = baseline() as typeof badFormat & { axes?: string[] }
    extra.axes = ['caller-owned']
    invalid.push(extra)
    const duplicateArm = baseline()
    duplicateArm.arms[1].side = duplicateArm.arms[0].side
    duplicateArm.arms[1].role = duplicateArm.arms[0].role
    invalid.push(duplicateArm)
    const missingLeg = baseline()
    missingLeg.legs.pop()
    invalid.push(missingLeg)
    const negativeMass = baseline()
    negativeMass.base.mast.massKg = -1
    invalid.push(negativeMass)
    const badCoM = baseline()
    badCoM.legs[0].foot.localCoM[2] = Number.NaN
    invalid.push(badCoM)
    const inverted = baseline()
    inverted.arms[0].jointRanges.elbowPitch = [1, -1]
    invalid.push(inverted)
    const badQuaternion = baseline()
    badQuaternion.arms[0].mount.rotation = [0, 0, 0, 0]
    invalid.push(badQuaternion)
    const missingJoint = baseline()
    const missingArm: { wristPitch?: number } =
      missingJoint.presets.stowed.arms[0]
    delete missingArm.wristPitch
    invalid.push(missingJoint)
    const extraPreset = baseline() as typeof badFormat & {
      presets: { stowed: { surprise?: number } }
    }
    extraPreset.presets.stowed.surprise = 1
    invalid.push(extraPreset)
    for (const candidate of invalid)
      expect(() => readWalkingRobotDefinition(candidate)).toThrow()
  })

  it('classifies legacy bytes without mutation or implicit conversion', () => {
    const legacy = clone(DEFAULT_ROBOT)
    const before = JSON.stringify(legacy)
    expect(classifyWalkingRobotDefinition(legacy)).toBe('legacy-unversioned')
    for (const malformed of [
      null,
      [],
      {},
      { arbitrary: true },
      { ...legacy, width: -1 },
      { ...legacy, start: legacy.end },
      { ...legacy, usableFraction: 1.1 },
      { ...legacy, lane: { ...legacy.lane, bay: 99 } },
      {
        ...legacy,
        survey: { ...legacy.survey, entranceWidth: -0.1 }
      },
      { format: WALKING_ROBOT_FORMAT },
      {
        ...clone(
          createSyntheticWalkingRobotDefinition({
            definitionId: 'wrong-topology'
          })
        ),
        topology: 'four-arm-four-wheel'
      }
    ])
      expect(classifyWalkingRobotDefinition(malformed)).toBe(
        'unsupported-version'
      )
    expect(
      classifyWalkingRobotDefinition({ format: 'walking-robot-definition/9' })
    ).toBe('unsupported-version')
    expect(() => readWalkingRobotDefinition(legacy)).toThrow()
    expect(JSON.stringify(legacy)).toBe(before)
  })
})

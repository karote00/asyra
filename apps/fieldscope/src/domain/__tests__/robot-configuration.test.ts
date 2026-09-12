import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIGURATION } from '../farm-configuration'
import {
  DEFAULT_ROBOT,
  validateRobot,
  assessRobotDesign
} from '../robot-configuration'

describe('robot design admission', () => {
  it('keeps survey and physical energy evidence unknown', () => {
    const report = assessRobotDesign(
      validateRobot(DEFAULT_ROBOT),
      DEFAULT_CONFIGURATION
    )
    expect(report.lane?.status).toBe('unverified')
    expect(report.energy.action).toBe('hold')
    expect(report.settings.survey.ground).toBe('unknown')
  })
  it.each([
    { width: 0 },
    { width: NaN },
    { height: Infinity },
    { soc: 1.1 },
    { end: 0.1 },
    { nominalWh: 0 },
    { payload: -1 }
  ])('rejects invalid %j', (patch) => {
    expect(() => validateRobot({ ...DEFAULT_ROBOT, ...patch })).toThrow()
  })
  it('detaches nested settings and freezes admitted values', () => {
    const input = {
      ...DEFAULT_ROBOT,
      lane: {
        kind: 'strip' as const,
        bay: 0,
        stripId: DEFAULT_CONFIGURATION.strips[2].id
      }
    }
    const result = validateRobot(input)
    input.lane.stripId = DEFAULT_CONFIGURATION.strips[1].id
    expect(result.lane).toEqual(DEFAULT_ROBOT.lane)
    expect(Object.isFrozen(result.lane)).toBe(true)
  })
  it('retains a mission that becomes invalid after farm edits', () => {
    const robot = validateRobot(DEFAULT_ROBOT)
    expect(
      assessRobotDesign(robot, { ...DEFAULT_CONFIGURATION, length: 20 }).lane
    ).toBeNull()
    expect(robot.end).toBe(49.5)
  })
  it('reports water lanes and loaded box exchange without permitting travel', () => {
    const robot = validateRobot({
      ...DEFAULT_ROBOT,
      lane: {
        kind: 'strip',
        bay: 0,
        stripId: DEFAULT_CONFIGURATION.strips[1].id
      },
      payload: 9
    })
    const report = assessRobotDesign(robot, DEFAULT_CONFIGURATION)
    expect(report.lane?.blocked).toContain('water-channel')
    expect(report.exchangeRequired).toBe(true)
    expect(report.energy.action).toBe('hold')
  })

  it('resolves the selected identity through repeated equal strips and never substitutes a neighbor', () => {
    const farm = {
      ...DEFAULT_CONFIGURATION,
      strips: ['first', 'selected', 'last'].map((id) => ({
        id,
        kind: 'soil' as const,
        width: 1
      }))
    }
    const settings = validateRobot({
      ...DEFAULT_ROBOT,
      lane: { kind: 'strip', bay: 0, stripId: 'selected' }
    })
    expect(assessRobotDesign(settings, farm).lane?.centerX).toBe(3.5)
    const reordered = {
      ...farm,
      strips: [farm.strips[2], farm.strips[0], farm.strips[1]]
    }
    expect(assessRobotDesign(settings, reordered).lane?.centerX).toBe(4.5)
    expect(
      assessRobotDesign(settings, {
        ...farm,
        strips: farm.strips.filter((strip) => strip.id !== 'first')
      }).lane?.centerX
    ).toBe(3)
    expect(
      assessRobotDesign(settings, {
        ...farm,
        strips: farm.strips.filter((strip) => strip.id !== 'selected')
      }).lane
    ).toBeNull()
    expect(settings.lane).toEqual({
      kind: 'strip',
      bay: 0,
      stripId: 'selected'
    })
  })
})

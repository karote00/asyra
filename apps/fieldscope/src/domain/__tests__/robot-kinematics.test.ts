import { createHash } from 'node:crypto'
import { expect, it } from 'vitest'
import { createRobotModel } from '../robot-model'
import { DEFAULT_ROBOT } from '../robot-configuration'

const definitions = [
  DEFAULT_ROBOT,
  { ...DEFAULT_ROBOT, tool: 'tomato' as const },
  { ...DEFAULT_ROBOT, width: 0.35, length: 0.6, height: 0.8 },
  { ...DEFAULT_ROBOT, width: 2, length: 3, height: 3, tool: 'tomato' as const }
]
const digest = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex')

it('preserves original parked robot source geometry and materials before articulation', () => {
  expect(
    definitions.map((definition) => ({
      definition: [
        definition.width,
        definition.length,
        definition.height,
        definition.tool
      ],
      hash: digest(createRobotModel(definition))
    }))
  ).toMatchSnapshot()
})

it('keeps zero-joint rigid transforms and every original source part exact', async () => {
  const {
    prepareRobotRig,
    evaluateRobotPose,
    REST_JOINTS,
    transformRobotPoint
  } = await import('../robot-kinematics')
  for (const definition of definitions) {
    const source = createRobotModel(definition)
    const rig = prepareRobotRig(definition, source)
    const pose = evaluateRobotPose(rig, REST_JOINTS)
    expect(new Set(rig.parts.map((part) => part.source.id)).size).toBe(
      source.length
    )
    expect(rig.parts.map((part) => part.source)).toEqual(source)
    for (const part of pose.parts) {
      expect(part.transform).toEqual({
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1]
      })
      expect(part.source).toBe(
        rig.parts.find((item) => item.source.id === part.source.id)?.source
      )
      for (let i = 0; i < part.source.shape.positions.length; i += 3) {
        const point = part.source.shape.positions.slice(i, i + 3) as [
          number,
          number,
          number
        ]
        expect(transformRobotPoint(part.transform, point)).toEqual(point)
      }
    }
    expect(pose.tool.position).toEqual([
      0,
      definition.height * 0.515,
      definition.length * 0.14
    ])
    expect(Object.isFrozen(rig)).toBe(true)
    expect(Object.isFrozen(rig.parts)).toBe(true)
  }
})

it('moves only the owned rigid chain and preserves link lengths and tool orientation', async () => {
  const {
    prepareRobotRig,
    evaluateRobotPose,
    REST_JOINTS,
    transformRobotPoint
  } = await import('../robot-kinematics')
  const rig = prepareRobotRig(DEFAULT_ROBOT, createRobotModel(DEFAULT_ROBOT))
  const rest = evaluateRobotPose(rig, REST_JOINTS)
  const pose = evaluateRobotPose(rig, {
    lift: 0.1,
    yaw: Math.PI / 2,
    shoulder: 0.4,
    elbow: -0.5,
    wrist: 0.3
  })
  const distance = (a: readonly number[], b: readonly number[]) =>
    Math.hypot(...a.map((value, index) => value - b[index]))
  expect(distance(pose.frames.shoulder, pose.frames.elbow)).toBeCloseTo(
    distance(rest.frames.shoulder, rest.frames.elbow),
    12
  )
  expect(distance(pose.frames.elbow, pose.frames.wrist)).toBeCloseTo(
    distance(rest.frames.elbow, rest.frames.wrist),
    12
  )
  for (const id of [
    'chassis',
    'mast-top',
    'lift-screw',
    'camera-housing',
    'crate-bottom'
  ]) {
    const part = pose.parts.find((item) => item.source.id === id)
    expect(part?.transform).toEqual({
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1]
    })
  }
  expect(
    pose.parts.find((part) => part.source.id === 'lift-carriage')?.transform
  ).toEqual({ position: [0, 0.1, 0], rotation: [0, 0, 0, 1] })
  const yawed = evaluateRobotPose(rig, { ...REST_JOINTS, yaw: Math.PI / 2 })
  expect(yawed.tool.closing).toEqual([
    expect.closeTo(0, 12),
    0,
    expect.closeTo(-1, 12)
  ])
  expect(yawed.tool.approach).toEqual([0, -1, 0])
  const wrist = pose.parts.find((part) => part.source.id === 'tool-guard')
  if (!wrist) throw new Error('Missing tool source')
  expect(pose.tool.position).toEqual(
    transformRobotPoint(wrist.transform, rig.tool.position)
  )
})

it('admits exact approved bounds and rejects nonfinite joints or an incomplete lift envelope', async () => {
  const {
    prepareRobotRig,
    evaluateRobotPose,
    REST_JOINTS,
    ROBOT_JOINT_LIMITS
  } = await import('../robot-kinematics')
  const rig = prepareRobotRig(DEFAULT_ROBOT, createRobotModel(DEFAULT_ROBOT))
  expect(rig.speeds).toEqual({
    lift: 0.02,
    yaw: Math.PI / 18,
    shoulder: Math.PI / 18,
    elbow: Math.PI / 18,
    wrist: Math.PI / 18
  })
  for (const [joint, [min, max]] of Object.entries(ROBOT_JOINT_LIMITS)) {
    expect(() =>
      evaluateRobotPose(rig, { ...REST_JOINTS, [joint]: min })
    ).not.toThrow()
    expect(() =>
      evaluateRobotPose(rig, { ...REST_JOINTS, [joint]: max })
    ).not.toThrow()
    for (const invalid of [min - 1e-8, max + 1e-8, NaN, Infinity])
      expect(() =>
        evaluateRobotPose(rig, { ...REST_JOINTS, [joint]: invalid })
      ).toThrow()
  }
  const short = { ...DEFAULT_ROBOT, height: 0.6 }
  const source = createRobotModel(short)
  const original = digest(source)
  expect(() => prepareRobotRig(short, source)).toThrow('lift')
  expect(digest(source)).toBe(original)
  expect(evaluateRobotPose(rig, REST_JOINTS).joints).toEqual(REST_JOINTS)
})

it('detaches mutable source buffers once and reuses their admitted identity across poses', async () => {
  const { prepareRobotRig, evaluateRobotPose, REST_JOINTS } =
    await import('../robot-kinematics')
  const raw = createRobotModel(DEFAULT_ROBOT)
  const rig = prepareRobotRig(DEFAULT_ROBOT, raw)
  const before = digest(rig.parts)
  ;(raw[0].shape.positions as number[])[0] += 100
  raw[0].color = 0
  expect(digest(rig.parts)).toBe(before)
  expect(Object.isFrozen(rig.parts[0].source.shape.positions)).toBe(true)
  expect(evaluateRobotPose(rig, REST_JOINTS).parts[0].source).toBe(
    rig.parts[0].source
  )
})

it('rotates each pitch around its source pivot and leaves upstream bodies fixed', async () => {
  const {
    prepareRobotRig,
    evaluateRobotPose,
    REST_JOINTS,
    transformRobotPoint
  } = await import('../robot-kinematics')
  const rig = prepareRobotRig(DEFAULT_ROBOT, createRobotModel(DEFAULT_ROBOT))
  const angle = 0.4
  for (const [joint, pivot, upstream] of [
    ['shoulder', rig.frames.shoulder, 'shoulder'],
    ['elbow', rig.frames.elbow, 'upper-arm'],
    ['wrist', rig.frames.wrist, 'forearm']
  ] as const) {
    const pose = evaluateRobotPose(rig, { ...REST_JOINTS, [joint]: angle })
    const y = rig.tool.position[1] - pivot[1],
      z = rig.tool.position[2] - pivot[2]
    expect(pose.tool.position[0]).toBeCloseTo(rig.tool.position[0], 12)
    expect(pose.tool.position[1]).toBeCloseTo(
      pivot[1] + y * Math.cos(angle) - z * Math.sin(angle),
      12
    )
    expect(pose.tool.position[2]).toBeCloseTo(
      pivot[2] + y * Math.sin(angle) + z * Math.cos(angle),
      12
    )
    const upstreamPart = pose.parts.find((part) => part.source.id === upstream)
    if (!upstreamPart) throw new Error('Missing upstream source')
    expect(
      transformRobotPoint(upstreamPart.transform, rig.tool.position)
    ).toEqual(rig.tool.position)
  }
})

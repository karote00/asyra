import { createHash } from 'node:crypto'
import { expect, it, vi } from 'vitest'
import type { KinematicAlgebra, JointDomains } from '../robot-kinematics'
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

it('isolates caller-owned material regions even when the part and shape are frozen', async () => {
  const { prepareRobotRig } = await import('../robot-kinematics')
  const raw = createRobotModel(DEFAULT_ROBOT)
  const admitted = prepareRobotRig(DEFAULT_ROBOT, raw)
  const regions = admitted.parts[0].source.regions.map((region) => ({
    ...region
  }))
  const input = admitted.parts.map(({ source }, index) =>
    index ? source : Object.freeze({ ...source, regions })
  )
  const rig = prepareRobotRig(DEFAULT_ROBOT, input)
  const before = digest(rig.parts[0].source.regions)
  regions[0].kind = 'sheet'
  regions.push({ ...regions[0], id: 'caller-added' })
  expect(digest(rig.parts[0].source.regions)).toBe(before)
  expect(Object.isFrozen(rig.parts[0].source.regions)).toBe(true)
})

it('preserves original parked robot source geometry and materials before articulation', () => {
  expect(
    definitions.map((definition) => ({
      definition: [
        definition.width,
        definition.length,
        definition.height,
        definition.tool
      ],
      hash: digest(
        createRobotModel(definition).map(({ id, color, metalness, shape }) => ({
          id,
          color,
          metalness,
          shape
        }))
      )
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

// Float64 encoding preserves signed zero, unlike JSON numeric serialization.
function poseBits(value: unknown): string {
  if (typeof value === 'number') {
    const bytes = new DataView(new ArrayBuffer(8))
    bytes.setFloat64(0, value)
    return bytes.getBigUint64(0).toString(16).padStart(16, '0')
  }
  if (Array.isArray(value)) return `[${value.map(poseBits).join(',')}]`
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .map(([key, entry]) => `${key}:${poseBits(entry)}`)
      .join(',')}}`
  return JSON.stringify(value)
}

it('preserves pre-extraction Float64 pose outputs including signed zero and every approved limit', async () => {
  const {
    prepareRobotRig,
    evaluateRobotPose,
    REST_JOINTS,
    ROBOT_JOINT_LIMITS
  } = await import('../robot-kinematics')
  const cases = [
    REST_JOINTS,
    { lift: -0, yaw: -0, shoulder: -0, elbow: -0, wrist: -0 },
    { lift: -0, yaw: 0, shoulder: -0, elbow: 0, wrist: -0 },
    { lift: 0.037, yaw: -0.71, shoulder: 0.29, elbow: -0.83, wrist: 0.47 },
    ...Object.entries(ROBOT_JOINT_LIMITS).flatMap(([key, bounds]) =>
      bounds.map((value) => ({ ...REST_JOINTS, [key]: value }))
    )
  ]
  expect(poseBits(-0)).not.toBe(poseBits(0))
  expect(
    definitions.map((definition) => {
      const rig = prepareRobotRig(definition, createRobotModel(definition))
      return cases.map((joints) => {
        const pose = evaluateRobotPose(rig, joints)
        const numeric = {
          joints: pose.joints,
          parts: pose.parts.map((part) => ({
            id: part.source.id,
            body: part.body,
            transform: part.transform
          })),
          frames: pose.frames,
          tool: pose.tool
        }
        return createHash('sha256').update(poseBits(numeric)).digest('hex')
      })
    })
  ).toMatchSnapshot()
})

const scalarAlgebra: KinematicAlgebra<number> = {
  literal: (value) => value,
  range: (lower, upper) => {
    if (!Object.is(lower, upper))
      throw new Error('Singleton number domains only')
    return lower
  },
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
  sin: Math.sin,
  cos: Math.cos
}

it('shares the canonical FK chain with singleton number algebra and original source identities', async () => {
  const {
    prepareRobotRig,
    evaluateRobotPose,
    evaluateRobotDomains,
    REST_JOINTS,
    ROBOT_JOINT_LIMITS
  } = await import('../robot-kinematics')
  const cases = [
    REST_JOINTS,
    { lift: -0, yaw: -0, shoulder: -0, elbow: -0, wrist: -0 },
    { lift: 0.037, yaw: -0.71, shoulder: 0.29, elbow: -0.83, wrist: 0.47 },
    ...Object.entries(ROBOT_JOINT_LIMITS).flatMap(([key, bounds]) =>
      bounds.map((value) => ({ ...REST_JOINTS, [key]: value }))
    )
  ]
  for (const definition of definitions) {
    const rig = prepareRobotRig(definition, createRobotModel(definition))
    for (const joints of cases) {
      const domains = Object.fromEntries(
        Object.entries(joints).map(([key, value]) => [key, [value, value]])
      ) as unknown as JointDomains
      const actual = evaluateRobotDomains(rig, domains, scalarAlgebra)
      const expected = evaluateRobotPose(rig, joints)
      expect(
        poseBits({
          parts: actual.parts.map((p) => p.transform),
          frames: actual.frames,
          tool: actual.tool
        })
      ).toBe(
        poseBits({
          parts: expected.parts.map((p) => p.transform),
          frames: expected.frames,
          tool: expected.tool
        })
      )
      actual.parts.forEach((part, index) => {
        expect(part.source).toBe(rig.parts[index].source)
        expect(part.body).toBe(rig.parts[index].body)
        expect(part.source.shape).toBe(rig.parts[index].source.shape)
        const peer = actual.parts.find(
          (candidate) => candidate.body === part.body
        )
        expect(part.transform).toBe(peer?.transform)
      })
      expect(Object.isFrozen(actual.parts)).toBe(true)
      expect(Object.isFrozen(actual.domains)).toBe(true)
    }
    const first = evaluateRobotPose(rig, REST_JOINTS)
    const second = evaluateRobotPose(
      rig,
      Object.assign({ ...REST_JOINTS }, { extra: 1 })
    )
    expect(second.joints).toHaveProperty('extra', 1)
    expect(first.parts.find((part) => part.body === 'fixed')?.transform).toBe(
      second.parts.find((part) => part.body === 'fixed')?.transform
    )
    expect(
      first.parts.find((part) => part.body === 'lift')?.transform.rotation
    ).toBe(
      second.parts.find((part) => part.body === 'fixed')?.transform.rotation
    )
  }
})

it('validates a single detached numeric domain snapshot before any algebra callback', async () => {
  const { prepareRobotRig, evaluateRobotDomains } =
    await import('../robot-kinematics')
  const rig = prepareRobotRig(DEFAULT_ROBOT, createRobotModel(DEFAULT_ROBOT))
  const domains = {
    lift: [0, 0],
    yaw: [0, 0],
    shoulder: [0, 0],
    elbow: [0, 0],
    wrist: [0, 0]
  }
  const callback = vi.fn(() => 0)
  const algebra = Object.fromEntries(
    Object.keys(scalarAlgebra).map((key) => [key, callback])
  ) as unknown as KinematicAlgebra<number>
  for (const invalid of [
    null,
    { ...domains, extra: [0, 0] },
    { ...domains, lift: undefined },
    { ...domains, yaw: [1, -1] },
    { ...domains, lift: [-0.11, 0] },
    { ...domains, wrist: [0, Infinity] },
    { ...domains, elbow: new Array(2) },
    { ...domains, shoulder: [NaN, 0] },
    { ...domains, yaw: [0, 0, 0] }
  ]) {
    expect(() =>
      evaluateRobotDomains(rig, invalid as unknown as JointDomains, algebra)
    ).toThrow()
    expect(callback).not.toHaveBeenCalled()
  }
  let reads = 0
  const getter = {
    ...domains,
    get yaw() {
      reads++
      return reads === 1 ? [NaN, 0] : [0, 0]
    }
  }
  expect(() =>
    evaluateRobotDomains(rig, getter as unknown as JointDomains, algebra)
  ).toThrow()
  expect(reads).toBe(1)
  expect(callback).not.toHaveBeenCalled()
  const mutating = {
    ...scalarAlgebra,
    range: (lower: number, upper: number) => {
      domains.yaw[0] = 1
      return scalarAlgebra.range(lower, upper)
    }
  }
  const result = evaluateRobotDomains(
    rig,
    domains as unknown as JointDomains,
    mutating
  )
  expect(result.domains.yaw).toEqual([0, 0])
  expect(Object.isFrozen(domains)).toBe(false)
})

it('freezes only C-owned containers and does not publish after a scalar callback throws', async () => {
  const {
    prepareRobotRig,
    evaluateRobotDomains,
    evaluateRobotPose,
    REST_JOINTS
  } = await import('../robot-kinematics')
  const rig = prepareRobotRig(DEFAULT_ROBOT, createRobotModel(DEFAULT_ROBOT))
  const domains = {
    lift: [0, 0],
    yaw: [0, 0],
    shoulder: [0, 0],
    elbow: [0, 0],
    wrist: [0, 0]
  } as JointDomains
  const scalars: { value: number }[] = []
  const box = (value: number) => {
    const scalar = { value }
    scalars.push(scalar)
    return scalar
  }
  const algebra: KinematicAlgebra<{ value: number }> = {
    literal: box,
    range: (lower, upper) => box(scalarAlgebra.range(lower, upper)),
    add: (a, b) => box(a.value + b.value),
    subtract: (a, b) => box(a.value - b.value),
    multiply: (a, b) => box(a.value * b.value),
    divide: (a, b) => box(a.value / b.value),
    sin: (a) => box(Math.sin(a.value)),
    cos: (a) => box(Math.cos(a.value))
  }
  const result = evaluateRobotDomains(rig, domains, algebra)
  expect(Object.isFrozen(result)).toBe(true)
  expect(Object.isFrozen(result.tool.position)).toBe(true)
  expect(scalars.every((scalar) => !Object.isFrozen(scalar))).toBe(true)
  const before = poseBits(evaluateRobotPose(rig, REST_JOINTS).tool)
  expect(() =>
    evaluateRobotDomains(rig, domains, {
      ...algebra,
      sin: () => {
        throw new Error('algebra stopped')
      }
    })
  ).toThrow('algebra stopped')
  expect(poseBits(evaluateRobotPose(rig, REST_JOINTS).tool)).toBe(before)
})

it('passes complete approved domains once without generating source geometry or admitting a trajectory', async () => {
  const kinematics = await import('../robot-kinematics')
  const models = await import('../robot-model')
  const rig = kinematics.prepareRobotRig(
    DEFAULT_ROBOT,
    models.createRobotModel(DEFAULT_ROBOT)
  )
  const generation = vi.spyOn(models, 'createRobotModel')
  const preparation = vi.spyOn(kinematics, 'prepareRobotRig')
  const ranges: (readonly [number, number])[] = []
  // This test adapter records numeric domains; it is not an interval proof.
  const algebra = {
    ...scalarAlgebra,
    range: (lower: number, upper: number) => {
      ranges.push([lower, upper])
      return lower
    }
  }
  try {
    const first = kinematics.evaluateRobotDomains(rig, rig.limits, algebra)
    expect(ranges).toEqual(Object.values(rig.limits))
    expect(first).not.toHaveProperty('clear')
    expect(first).not.toHaveProperty('trajectory')
    expect(first).not.toHaveProperty('intervalProof')
    expect(generation).not.toHaveBeenCalled()
    expect(preparation).not.toHaveBeenCalled()
    expect(first.parts[0].source).toBe(rig.parts[0].source)
  } finally {
    generation.mockRestore()
    preparation.mockRestore()
  }
})

import { boundPolynomialTrig } from '../domain/kinematic-trigonometry'
import type { Point3 } from '../domain/greenhouse'
import {
  add,
  divide,
  interval,
  multiply,
  subtract,
  type Interval
} from '../domain/scalar-arithmetic'
import type {
  WalkingCarriedAttachment,
  WalkingLoadCase,
  WalkingMotionBaseState,
  WalkingMotionPath
} from '../domain/walking-motion-contract'
import type {
  WalkingRobotJointState,
  WalkingRigidTransform
} from '../domain/walking-robot-definition'
import { evaluateWalkingRobotPose } from '../domain/walking-robot-kinematics'
import type {
  WalkingRobotBody,
  WalkingRobotPart,
  WalkingRobotSource
} from '../domain/walking-robot-source'
import type { SourceRegion } from '../domain/source-occupancy'

export interface WalkingIntervalBounds {
  readonly min: Point3
  readonly max: Point3
}
export interface WalkingPartIntervalEnvelope {
  readonly body: WalkingRobotBody
  readonly part: WalkingRobotPart
  readonly region: SourceRegion
  readonly bounds: WalkingIntervalBounds
  readonly relation: 'outward-interval-envelope'
}
export interface WalkingCarriedIntervalEnvelope {
  readonly body: WalkingRobotBody
  readonly assembly: Readonly<object>
  readonly attachment: WalkingCarriedAttachment & {
    readonly shape: Extract<
      WalkingCarriedAttachment['shape'],
      { kind: 'triangles' }
    >
  }
  readonly bounds: WalkingIntervalBounds
  readonly relation: 'outward-interval-envelope'
}
export interface WalkingMotionIntervalWork {
  readonly intervals: number
  readonly pointFk: number
  readonly intervalFk: number
  readonly partBounds: number
  readonly vertexVisits: number
  readonly trigBounds: number
}
export interface WalkingMotionIntervalResult {
  readonly from: number
  readonly until: number
  readonly envelopes: readonly WalkingPartIntervalEnvelope[]
  readonly carriedEnvelopes: readonly WalkingCarriedIntervalEnvelope[]
  readonly work: WalkingMotionIntervalWork
}

type IntervalVector = readonly [Interval, Interval, Interval]
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Incomplete admitted walking source')
  return value
}
interface IntervalTransform {
  readonly position: IntervalVector
  readonly rotation: readonly [Interval, Interval, Interval, Interval]
}
interface MotionIntervalInput {
  readonly path: WalkingMotionPath
  readonly evaluation: Readonly<{ from: number; until: number }>
  readonly stance: Readonly<{
    phases: readonly Readonly<{ from: number; until: number }>[]
  }>
  readonly load: Pick<WalkingLoadCase, 'crate' | 'carried'>
  readonly budget: Readonly<{ maxIntervals: number; maxEnvelopePairs: number }>
}

const point = (values: readonly number[]): Point3 =>
  Object.freeze([...values]) as unknown as Point3
const bounds = (min: readonly number[], max: readonly number[]) =>
  Object.freeze({ min: point(min), max: point(max) })
const vector = (x: Interval, y: Interval, z: Interval): IntervalVector =>
  Object.freeze([x, y, z])
const literalVector = (value: Point3): IntervalVector =>
  vector(interval(value[0]), interval(value[1]), interval(value[2]))
const join = (first: Interval, second: Interval): Interval =>
  Object.freeze({
    low: Math.min(first.low, second.low),
    high: Math.max(first.high, second.high)
  })
const exactTransform = (value: WalkingRigidTransform): IntervalTransform =>
  Object.freeze({
    position: literalVector(value.position),
    rotation: Object.freeze(
      value.rotation.map(interval) as unknown as IntervalTransform['rotation']
    )
  })
function trueTrig(
  kind: 'sin' | 'cos',
  input: Interval,
  work: { trigBounds: number }
): Interval {
  work.trigBounds++
  if (input.low <= -1 || input.high >= 1)
    return Object.freeze({ low: -1, high: 1 })
  const polynomial = boundPolynomialTrig(kind, input).bounds,
    magnitude = Math.max(Math.abs(input.low), Math.abs(input.high)),
    exponent = kind === 'sin' ? 21 : 22,
    factorial = kind === 'sin' ? 51090942171709440000 : 1124000727777607680000
  let remainder = interval(1)
  for (let power = 0; power < exponent; power++)
    remainder = multiply(remainder, interval(magnitude))
  remainder = divide(remainder, interval(factorial))
  const enclosed = {
    low: subtract(polynomial, { low: 0, high: remainder.high }).low,
    high: add(polynomial, { low: 0, high: remainder.high }).high
  }
  if (input.low === input.high) {
    const pointValue =
      kind === 'sin' ? Math.sin(input.low) : Math.cos(input.low)
    return Object.freeze({
      low: Math.max(-1, Math.min(enclosed.low, pointValue)),
      high: Math.min(1, Math.max(enclosed.high, pointValue))
    })
  }
  return Object.freeze({
    low: Math.max(-1, enclosed.low),
    high: Math.min(1, enclosed.high)
  })
}
function operations(work: { trigBounds: number }) {
  const rotate = (
    rotation: IntervalTransform['rotation'],
    value: IntervalVector
  ): IntervalVector => {
    const [x, y, z, w] = rotation,
      tx = multiply(
        interval(2),
        subtract(multiply(y, value[2]), multiply(z, value[1]))
      ),
      ty = multiply(
        interval(2),
        subtract(multiply(z, value[0]), multiply(x, value[2]))
      ),
      tz = multiply(
        interval(2),
        subtract(multiply(x, value[1]), multiply(y, value[0]))
      )
    return vector(
      subtract(
        add(add(value[0], multiply(w, tx)), multiply(y, tz)),
        multiply(z, ty)
      ),
      subtract(
        add(add(value[1], multiply(w, ty)), multiply(z, tx)),
        multiply(x, tz)
      ),
      subtract(
        add(add(value[2], multiply(w, tz)), multiply(x, ty)),
        multiply(y, tx)
      )
    )
  }
  const transformPoint = (
    transform: IntervalTransform,
    value: IntervalVector
  ) => {
    const rotated = rotate(transform.rotation, value)
    return vector(
      add(transform.position[0], rotated[0]),
      add(transform.position[1], rotated[1]),
      add(transform.position[2], rotated[2])
    )
  }
  const compose = (
    parent: IntervalTransform,
    child: IntervalTransform
  ): IntervalTransform => {
    const [x, y, z, w] = parent.rotation,
      [u, v, s, t] = child.rotation
    return Object.freeze({
      position: transformPoint(parent, child.position),
      rotation: Object.freeze([
        subtract(
          add(add(multiply(w, u), multiply(x, t)), multiply(y, s)),
          multiply(z, v)
        ),
        add(
          add(subtract(multiply(w, v), multiply(x, s)), multiply(y, t)),
          multiply(z, u)
        ),
        add(
          subtract(add(multiply(w, s), multiply(x, v)), multiply(y, u)),
          multiply(z, t)
        ),
        subtract(
          subtract(subtract(multiply(w, t), multiply(x, u)), multiply(y, v)),
          multiply(z, s)
        )
      ] as const)
    })
  }
  const axisRotation = (
    axis: 'x' | 'y' | 'z',
    angle: Interval
  ): IntervalTransform => {
    const half = divide(angle, interval(2)),
      sine = trueTrig('sin', half, work),
      cosine = trueTrig('cos', half, work),
      zero = interval(0)
    return Object.freeze({
      position: vector(zero, zero, zero),
      rotation: Object.freeze([
        axis === 'x' ? sine : zero,
        axis === 'y' ? sine : zero,
        axis === 'z' ? sine : zero,
        cosine
      ] as const)
    })
  }
  const translated = (axis: 'x' | 'y' | 'z', value: Interval) => {
    const zero = interval(0)
    return Object.freeze({
      position: vector(
        axis === 'x' ? value : zero,
        axis === 'y' ? value : zero,
        axis === 'z' ? value : zero
      ),
      rotation: Object.freeze([zero, zero, zero, interval(1)] as const)
    })
  }
  return { transformPoint, compose, axisRotation, translated }
}

/** Enclose referenced source vertices using the same directed arithmetic as interval FK. */
export function walkingSourcePointBounds(
  shape: Extract<WalkingCarriedAttachment['shape'], { kind: 'triangles' }>,
  frames: readonly WalkingRigidTransform[]
): readonly WalkingIntervalBounds[] {
  const ops = operations({ trigBounds: 0 })
  let transform = exactTransform({
    position: [0, 0, 0],
    rotation: [0, 0, 0, 1]
  })
  for (const frame of frames)
    transform = ops.compose(transform, exactTransform(frame))
  return Object.freeze(
    [...new Set(shape.indices)].map((index) => {
      const value = ops.transformPoint(
        transform,
        literalVector([
          shape.positions[index * 3],
          shape.positions[index * 3 + 1],
          shape.positions[index * 3 + 2]
        ])
      )
      return bounds(
        value.map(({ low }) => low),
        value.map(({ high }) => high)
      )
    })
  )
}
const interpolate = (from: number, until: number, ratio: Interval): Interval =>
  add(
    interval(from),
    multiply(subtract(interval(until), interval(from)), ratio)
  )
function spanAt(path: WalkingMotionPath, time: number) {
  for (let index = 0; index < path.knots.length - 1; index++)
    if (
      time >= path.knots[index].time &&
      (time < path.knots[index + 1].time || index === path.knots.length - 2)
    )
      return [path.knots[index], path.knots[index + 1]] as const
  throw new Error('Walking interval is outside the path')
}
function rangeBetween(
  from: number,
  until: number,
  leftTime: number,
  rightTime: number,
  leftValue: number,
  rightValue: number
) {
  const denominator = subtract(interval(rightTime), interval(leftTime)),
    at = (time: number) =>
      interpolate(
        leftValue,
        rightValue,
        divide(subtract(interval(time), interval(leftTime)), denominator)
      )
  return join(at(from), at(until))
}
function jointRanges(
  source: WalkingRobotSource,
  path: WalkingMotionPath,
  from: number,
  until: number
) {
  const [left, right] = spanAt(path, from)
  if (until > right.time)
    throw new Error('Walking interval crosses a path knot')
  const values = new Map<string, Interval>()
  values.set(
    'carriage-lift',
    rangeBetween(
      from,
      until,
      left.time,
      right.time,
      left.joints.carriage,
      right.joints.carriage
    )
  )
  for (const leftArm of left.joints.arms) {
    const rightArm = right.joints.arms.find(
      ({ side, role }) => side === leftArm.side && role === leftArm.role
    )
    if (!rightArm) throw new Error('Incomplete walking arm path')
    const id = `${leftArm.side}-${leftArm.role}`
    for (const [field, suffix] of [
      ['rootYaw', 'root-yaw'],
      ['shoulderPitch', 'shoulder-pitch'],
      ['elbowPitch', 'elbow-pitch'],
      ['wristPitch', 'wrist-pitch']
    ] as const)
      values.set(
        `${id}-${suffix}`,
        rangeBetween(
          from,
          until,
          left.time,
          right.time,
          leftArm[field],
          rightArm[field]
        )
      )
  }
  for (const leftLeg of left.joints.legs) {
    const rightLeg = right.joints.legs.find(
      ({ side, station }) =>
        side === leftLeg.side && station === leftLeg.station
    )
    if (!rightLeg) throw new Error('Incomplete walking leg path')
    const id = `${leftLeg.side}-${leftLeg.station}`
    for (const field of ['abduction', 'hip', 'knee'] as const)
      values.set(
        `${id}-${field}`,
        rangeBetween(
          from,
          until,
          left.time,
          right.time,
          leftLeg[field],
          rightLeg[field]
        )
      )
  }
  return { left, right, values }
}
function numericValue(
  from: number,
  until: number,
  time: number,
  fromValue: number,
  untilValue: number
) {
  if (time === from) return fromValue
  if (time === until) return untilValue
  return fromValue + ((untilValue - fromValue) * (time - from)) / (until - from)
}
export function walkingMotionPoseAt(
  path: WalkingMotionPath,
  time: number
): { base: WalkingRigidTransform; joints: WalkingRobotJointState } {
  const [left, right] = spanAt(path, time),
    scalar = (a: number, b: number) =>
      numericValue(left.time, right.time, time, a, b),
    base: WalkingMotionBaseState = {
      position: point(
        left.base.position.map((value, axis) =>
          scalar(value, right.base.position[axis])
        )
      ),
      heading: scalar(left.base.heading, right.base.heading),
      pitch: scalar(left.base.pitch, right.base.pitch),
      roll: scalar(left.base.roll, right.base.roll)
    },
    joints = {
      carriage: scalar(left.joints.carriage, right.joints.carriage),
      arms: left.joints.arms.map((arm) => {
        const next = required(
          right.joints.arms.find(
            ({ side, role }) => side === arm.side && role === arm.role
          )
        )
        return {
          side: arm.side,
          role: arm.role,
          rootYaw: scalar(arm.rootYaw, next.rootYaw),
          shoulderPitch: scalar(arm.shoulderPitch, next.shoulderPitch),
          elbowPitch: scalar(arm.elbowPitch, next.elbowPitch),
          wristPitch: scalar(arm.wristPitch, next.wristPitch)
        }
      }),
      legs: left.joints.legs.map((leg) => {
        const next = required(
          right.joints.legs.find(
            ({ side, station }) => side === leg.side && station === leg.station
          )
        )
        return {
          side: leg.side,
          station: leg.station,
          abduction: scalar(leg.abduction, next.abduction),
          hip: scalar(leg.hip, next.hip),
          knee: scalar(leg.knee, next.knee)
        }
      })
    },
    sine = (value: number) => Math.sin(value / 2),
    cosine = (value: number) => Math.cos(value / 2),
    heading: WalkingRigidTransform = {
      position: point([0, 0, 0]),
      rotation: [0, sine(base.heading), 0, cosine(base.heading)]
    },
    pitch: WalkingRigidTransform = {
      position: point([0, 0, 0]),
      rotation: [sine(base.pitch), 0, 0, cosine(base.pitch)]
    },
    roll: WalkingRigidTransform = {
      position: point([0, 0, 0]),
      rotation: [0, 0, sine(base.roll), cosine(base.roll)]
    },
    composeNumber = (
      first: WalkingRigidTransform,
      second: WalkingRigidTransform
    ): WalkingRigidTransform => {
      const [x, y, z, w] = first.rotation,
        [u, v, s, t] = second.rotation
      return {
        position: point([0, 0, 0]),
        rotation: [
          w * u + x * t + y * s - z * v,
          w * v - x * s + y * t + z * u,
          w * s + x * v - y * u + z * t,
          w * t - x * u - y * v - z * s
        ]
      }
    },
    rotation = composeNumber(composeNumber(heading, pitch), roll).rotation
  return Object.freeze({
    base: Object.freeze({
      position: base.position,
      rotation: Object.freeze(rotation)
    }),
    joints: Object.freeze(joints)
  })
}

function intervalTransforms(
  source: WalkingRobotSource,
  path: WalkingMotionPath,
  from: number,
  until: number,
  work: { trigBounds: number }
) {
  const { left, right, values } = jointRanges(source, path, from, until),
    range = (a: number, b: number) =>
      rangeBetween(from, until, left.time, right.time, a, b),
    basePosition = vector(
      range(left.base.position[0], right.base.position[0]),
      range(left.base.position[1], right.base.position[1]),
      range(left.base.position[2], right.base.position[2])
    ),
    ops = operations(work),
    base = Object.freeze({
      position: basePosition,
      rotation: ops.compose(
        ops.compose(
          ops.axisRotation('y', range(left.base.heading, right.base.heading)),
          ops.axisRotation('x', range(left.base.pitch, right.base.pitch))
        ),
        ops.axisRotation('z', range(left.base.roll, right.base.roll))
      ).rotation
    }),
    transforms = new Map<string, IntervalTransform>([['base', base]]),
    pending = new Set(
      source.rig.bodies.filter(({ id }) => id !== 'base').map(({ id }) => id)
    )
  while (pending.size) {
    let advanced = false
    for (const id of [...pending]) {
      const body = required(
          source.rig.bodies.find((candidate) => candidate.id === id)
        ),
        parent = body.parentBodyId
          ? transforms.get(body.parentBodyId)
          : undefined
      if (!parent) continue
      if (body.attachment === 'fixed')
        transforms.set(
          id,
          ops.compose(parent, exactTransform(required(body.fixedFrame)))
        )
      else {
        const joint = required(
            source.rig.joints.find(({ childBodyId }) => childBodyId === id)
          ),
          value = required(values.get(joint.id))
        transforms.set(
          id,
          ops.compose(
            ops.compose(parent, exactTransform(joint.frame)),
            joint.motion === 'prismatic'
              ? ops.translated(joint.axis, value)
              : ops.axisRotation(joint.axis, value)
          )
        )
      }
      pending.delete(id)
      advanced = true
    }
    if (!advanced) throw new Error('Incomplete walking interval rig')
  }
  return { transforms, ops }
}
function envelopeFor(
  body: WalkingRobotBody,
  part: WalkingRobotPart,
  region: SourceRegion,
  transform: IntervalTransform,
  transformPoint: ReturnType<typeof operations>['transformPoint'],
  work: { partBounds: number; vertexVisits: number }
) {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity]
  for (
    let indexOffset = region.indexStart;
    indexOffset < region.indexStart + region.indexCount;
    indexOffset++
  ) {
    const vertex = part.shape.indices[indexOffset] * 3,
      value = transformPoint(
        transform,
        vector(
          interval(part.shape.positions[vertex]),
          interval(part.shape.positions[vertex + 1]),
          interval(part.shape.positions[vertex + 2])
        )
      )
    work.vertexVisits++
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], value[axis].low)
      max[axis] = Math.max(max[axis], value[axis].high)
    }
  }
  work.partBounds++
  return Object.freeze({
    body,
    part,
    region,
    bounds: bounds(min, max),
    relation: 'outward-interval-envelope' as const
  })
}

export function evaluateWalkingMotionInterval(
  source: WalkingRobotSource,
  path: WalkingMotionPath,
  input: Readonly<{
    from: number
    until: number
    attachments: readonly WalkingCarriedAttachment[]
    assemblies?: ReadonlyMap<WalkingCarriedAttachment, Readonly<object>>
  }>
): WalkingMotionIntervalResult {
  const mutableWork = {
      intervals: 1,
      pointFk: 0,
      intervalFk: 0,
      partBounds: 0,
      vertexVisits: 0,
      trigBounds: 0
    },
    singleton = input.from === input.until
  let transforms: Map<string, IntervalTransform>,
    ops: ReturnType<typeof operations>
  if (singleton) {
    const pose = evaluateWalkingRobotPose(
      source,
      walkingMotionPoseAt(path, input.from)
    )
    mutableWork.pointFk++
    transforms = new Map(
      pose.bodyTransforms.map(({ id, transform }) => [
        id,
        exactTransform(transform)
      ])
    )
    ops = operations(mutableWork)
  } else {
    const prepared = intervalTransforms(
      source,
      path,
      input.from,
      input.until,
      mutableWork
    )
    transforms = prepared.transforms
    ops = prepared.ops
    mutableWork.intervalFk++
  }
  const envelopes: WalkingPartIntervalEnvelope[] = []
  for (const body of source.rig.bodies)
    for (const part of body.parts) {
      const transform = ops.compose(
        required(transforms.get(body.id)),
        exactTransform(part.localFrame)
      )
      for (const region of part.regions)
        envelopes.push(
          envelopeFor(
            body,
            part,
            region,
            transform,
            ops.transformPoint,
            mutableWork
          )
        )
    }
  const carriedEnvelopes: WalkingCarriedIntervalEnvelope[] = []
  for (const attachment of input.attachments) {
    if (attachment.shape.kind === 'unknown') continue
    const body = required(
        source.rig.bodies.find(({ id }) => id === attachment.holderBodyId)
      ),
      transform = ops.compose(
        required(transforms.get(body.id)),
        exactTransform(attachment.localFrame)
      ),
      min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity]
    for (
      let offset = 0;
      offset < attachment.shape.positions.length;
      offset += 3
    ) {
      const value = ops.transformPoint(
        transform,
        vector(
          interval(attachment.shape.positions[offset]),
          interval(attachment.shape.positions[offset + 1]),
          interval(attachment.shape.positions[offset + 2])
        )
      )
      mutableWork.vertexVisits++
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], value[axis].low)
        max[axis] = Math.max(max[axis], value[axis].high)
      }
    }
    mutableWork.partBounds++
    carriedEnvelopes.push(
      Object.freeze({
        body,
        assembly: input.assemblies?.get(attachment) ?? attachment,
        attachment: Object.freeze({ ...attachment, shape: attachment.shape }),
        bounds: bounds(min, max),
        relation: 'outward-interval-envelope' as const
      })
    )
  }
  return Object.freeze({
    from: input.from,
    until: input.until,
    envelopes: Object.freeze(envelopes),
    carriedEnvelopes: Object.freeze(carriedEnvelopes),
    work: Object.freeze(mutableWork)
  })
}

export function prepareWalkingMotionIntervals(
  source: WalkingRobotSource,
  input: MotionIntervalInput
) {
  const assemblies = new Map<WalkingCarriedAttachment, Readonly<object>>()
  const attachments: readonly WalkingCarriedAttachment[] = Object.freeze([
    ...(input.load.crate.kind === 'attached'
      ? input.load.crate.sourceParts.map((part, index) => {
          const crate = input.load.crate
          if (crate.kind !== 'attached') throw new Error('Invalid crate source')
          const attachment = Object.freeze({
            ...part,
            sourceCoverage: crate.sourceCoverage,
            holderBodyId: crate.holderBodyId,
            localFrame: crate.localFrames[index],
            massPropertiesId: crate.massIdentity
          })
          assemblies.set(attachment, crate)
          return attachment
        })
      : []),
    ...(input.load.carried.kind === 'attached' ? input.load.carried.items : [])
  ])
  const breaks = [
    ...new Set([
      input.evaluation.from,
      input.evaluation.until,
      ...input.path.knots
        .map(({ time }) => time)
        .filter(
          (time) =>
            time > input.evaluation.from && time < input.evaluation.until
        ),
      ...input.stance.phases
        .flatMap(({ from, until }) => [from, until])
        .filter(
          (time) =>
            time > input.evaluation.from && time < input.evaluation.until
        )
    ])
  ].sort((a, b) => a - b)
  const segments: {
    from: number
    until: number
    visited: boolean
    envelopes: readonly WalkingPartIntervalEnvelope[]
    carriedEnvelopes: readonly WalkingCarriedIntervalEnvelope[]
  }[] = []
  const work = {
    intervals: 0,
    pointFk: 0,
    intervalFk: 0,
    partBounds: 0,
    vertexVisits: 0,
    trigBounds: 0
  }
  let unvisitedIntervals = 0
  for (let index = 0; index < breaks.length - 1; index++) {
    const from = breaks[index],
      until = breaks[index + 1]
    if (work.intervals >= input.budget.maxIntervals) {
      unvisitedIntervals++
      segments.push({
        from,
        until,
        visited: false,
        envelopes: Object.freeze([]),
        carriedEnvelopes: Object.freeze([])
      })
      continue
    }
    const result = evaluateWalkingMotionInterval(source, input.path, {
      from,
      until,
      attachments,
      assemblies
    })
    for (const key of Object.keys(work) as (keyof typeof work)[])
      work[key] += result.work[key]
    segments.push({
      from,
      until,
      visited: true,
      envelopes: result.envelopes,
      carriedEnvelopes: result.carriedEnvelopes
    })
  }
  return Object.freeze({
    source,
    // Provenance only: low-level callers retain their existing admission semantics.
    inputIdentity: input as Readonly<object>,
    path: input.path,
    segments: Object.freeze(segments.map((segment) => Object.freeze(segment))),
    unvisitedIntervals,
    work: Object.freeze(work)
  })
}

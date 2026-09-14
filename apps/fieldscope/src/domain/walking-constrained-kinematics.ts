import {
  evaluatePolynomialTrig,
  boundPolynomialTrig
} from './kinematic-trigonometry'
import {
  dyadic,
  roundFraction,
  interval,
  add,
  subtract,
  multiply,
  divide,
  type Interval
} from './scalar-arithmetic'
import type {
  WalkingRobotJointState,
  WalkingRigidTransform
} from './walking-robot-definition'
import type {
  WalkingRobotSource,
  WalkingRobotBody,
  WalkingRobotPart,
  WalkingRobotJoint,
  WalkingPatchReference
} from './walking-robot-source'
import type { SourcePatch } from './source-occupancy'

export interface ConstrainedFraction {
  readonly numerator: bigint
  readonly denominator: bigint
}
export type ConstrainedVector<T> = readonly [T, T, T]
export interface ConstrainedFrame<T> {
  readonly origin: ConstrainedVector<T>
  readonly matrix: readonly [
    ConstrainedVector<T>,
    ConstrainedVector<T>,
    ConstrainedVector<T>
  ]
}
export interface WalkingConstrainedRecipe {
  readonly format: 'walking-constrained-kinematic-projection/1'
  readonly source: WalkingRobotSource
  readonly baseOrientation: readonly [
    ConstrainedFraction,
    ConstrainedFraction,
    ConstrainedFraction,
    ConstrainedFraction
  ]
  readonly supports: readonly Readonly<{
    chainId: string
    part: WalkingRobotPart
    patch: SourcePatch
    anchorOrigin: ConstrainedVector<ConstrainedFraction>
  }>[]
  readonly fixedJoints: WalkingRobotJointState
  readonly interval: Interval
  readonly budget: Readonly<{ maxOperations: number; maxBits: number }>
}
interface Work {
  operations: number
  pointLeaves: number
  boundLeaves: number
  sourceVertices: number
  supportVertices: number
  frameCompositions: number
  maxBits: number
}
interface Algebra<T> {
  composition(): void
  literal(value: number): T
  rational(value: ConstrainedFraction): T
  add(a: T, b: T): T
  subtract(a: T, b: T): T
  multiply(a: T, b: T): T
  divide(a: T, b: T): T
}
type ExactFrame = ConstrainedFrame<ConstrainedFraction>
function fail(reason: string): never {
  throw new Error('Unavailable constrained projection: ' + reason)
}
const required = <T>(value: T | undefined): T =>
  value === undefined ? fail('incomplete source') : value
const vector = <T>(values: readonly T[]) =>
  values as unknown as ConstrainedVector<T>
const matrix = <T>(values: readonly ConstrainedVector<T>[]) =>
  values as ConstrainedFrame<T>['matrix']
const zeroWork = (): Work => ({
  operations: 0,
  pointLeaves: 0,
  boundLeaves: 0,
  sourceVertices: 0,
  supportVertices: 0,
  frameCompositions: 0,
  maxBits: 0
})
function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const item of Object.values(value)) freeze(item)
    Object.freeze(value)
  }
  return value
}
function record(
  value: unknown,
  keys: readonly string[]
): value is Record<string, unknown> {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  )
}
function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a
  while (b !== 0n) {
    const next = a % b
    a = b
    b = next
  }
  return a
}
function arithmetic(
  budget: WalkingConstrainedRecipe['budget'],
  work: Work,
  onWork: (key: keyof Work, amount: number) => void
) {
  const count = (key: keyof Work, amount = 1) => {
    if (key === 'maxBits') {
      work.maxBits = Math.max(work.maxBits, amount)
      onWork(key, amount)
      if (amount > budget.maxBits) fail('rational bit budget')
      return
    }
    work[key] += amount
    onWork(key, amount)
    if (work.operations > budget.maxOperations) fail('operation budget')
  }
  const width = (value: bigint) => {
    const bits = (value < 0n ? -value : value).toString(2).length
    if (bits > budget.maxBits) fail('rational bit budget')
    count('maxBits', bits)
  }
  const fraction = (
    numerator: bigint,
    denominator = 1n
  ): ConstrainedFraction => {
    count('operations')
    if (denominator === 0n) fail('zero norm or denominator')
    width(numerator)
    width(denominator)
    if (denominator < 0n) {
      numerator = -numerator
      denominator = -denominator
    }
    const divisor = gcd(numerator, denominator)
    return freeze({
      numerator: numerator / divisor,
      denominator: denominator / divisor
    })
  }
  const exact: Algebra<ConstrainedFraction> = {
    composition: () => count('frameCompositions'),
    literal(value) {
      if (!Number.isFinite(value)) fail('nonfinite source scalar')
      const v = dyadic(value)
      return v.exponent >= 0
        ? fraction(v.significand << BigInt(v.exponent))
        : fraction(v.significand, 1n << BigInt(-v.exponent))
    },
    rational(value) {
      return fraction(value.numerator, value.denominator)
    },
    add: (a, b) =>
      fraction(
        a.numerator * b.denominator + b.numerator * a.denominator,
        a.denominator * b.denominator
      ),
    subtract: (a, b) =>
      fraction(
        a.numerator * b.denominator - b.numerator * a.denominator,
        a.denominator * b.denominator
      ),
    multiply: (a, b) =>
      fraction(a.numerator * b.numerator, a.denominator * b.denominator),
    divide: (a, b) =>
      fraction(a.numerator * b.denominator, a.denominator * b.numerator)
  }
  const bounded = (value: Interval) => {
    count('operations')
    if (
      !Number.isFinite(value.low) ||
      !Number.isFinite(value.high) ||
      value.low > value.high
    )
      fail('unproved interval')
    return value
  }
  const ranges: Algebra<Interval> = {
    composition: () => count('frameCompositions'),
    literal: (value) => bounded(interval(value)),
    rational: (value) =>
      bounded({
        low: roundFraction(
          value.numerator,
          value.denominator,
          'down',
          (width) => count('maxBits', width)
        ),
        high: roundFraction(value.numerator, value.denominator, 'up', (width) =>
          count('maxBits', width)
        )
      }),
    add: (a, b) => bounded(add(a, b)),
    subtract: (a, b) => bounded(subtract(a, b)),
    multiply: (a, b) => bounded(multiply(a, b)),
    divide: (a, b) => {
      if (b.low <= 0 && b.high >= 0) fail('unproved positive norm')
      return bounded(divide(a, b))
    }
  }
  return { exact, ranges, fraction, count }
}
function identity<T>(a: Algebra<T>): ConstrainedFrame<T> {
  return {
    origin: vector([a.literal(0), a.literal(0), a.literal(0)]),
    matrix: matrix(
      [0, 1, 2].map((row) =>
        vector([0, 1, 2].map((column) => a.literal(row === column ? 1 : 0)))
      )
    )
  }
}
function plusVector<T>(
  a: Algebra<T>,
  x: ConstrainedVector<T>,
  y: ConstrainedVector<T>
) {
  return vector(x.map((v, i) => a.add(v, y[i])))
}
function minusVector<T>(
  a: Algebra<T>,
  x: ConstrainedVector<T>,
  y: ConstrainedVector<T>
) {
  return vector(x.map((v, i) => a.subtract(v, y[i])))
}
function rotate<T>(
  a: Algebra<T>,
  m: ConstrainedFrame<T>['matrix'],
  p: ConstrainedVector<T>
) {
  return vector(
    m.map((row) =>
      a.add(
        a.add(a.multiply(row[0], p[0]), a.multiply(row[1], p[1])),
        a.multiply(row[2], p[2])
      )
    )
  )
}
function compose<T>(
  a: Algebra<T>,
  parent: ConstrainedFrame<T>,
  child: ConstrainedFrame<T>
): ConstrainedFrame<T> {
  a.composition()
  return {
    origin: plusVector(
      a,
      parent.origin,
      rotate(a, parent.matrix, child.origin)
    ),
    matrix: matrix(
      parent.matrix.map((row) =>
        vector(
          [0, 1, 2].map((c) =>
            a.add(
              a.add(
                a.multiply(row[0], child.matrix[0][c]),
                a.multiply(row[1], child.matrix[1][c])
              ),
              a.multiply(row[2], child.matrix[2][c])
            )
          )
        )
      )
    )
  }
}
function similarity<T>(
  a: Algebra<T>,
  q: readonly T[]
): ConstrainedFrame<T>['matrix'] {
  const [x, y, z, w] = q
  const xx = a.multiply(x, x),
    yy = a.multiply(y, y),
    zz = a.multiply(z, z),
    ww = a.multiply(w, w)
  const norm = a.add(a.add(xx, yy), a.add(zz, ww)),
    two = a.literal(2)
  const diagonal = (u: T, v: T, s: T, t: T) =>
    a.divide(a.subtract(a.add(u, v), a.add(s, t)), norm)
  const cross = (u: T, v: T, s: T, t: T, negative: boolean) =>
    a.divide(
      a.multiply(
        two,
        negative
          ? a.subtract(a.multiply(u, v), a.multiply(s, t))
          : a.add(a.multiply(u, v), a.multiply(s, t))
      ),
      norm
    )
  return matrix([
    vector([
      diagonal(ww, xx, yy, zz),
      cross(x, y, z, w, true),
      cross(x, z, y, w, false)
    ]),
    vector([
      cross(x, y, z, w, false),
      diagonal(ww, yy, xx, zz),
      cross(y, z, x, w, true)
    ]),
    vector([
      cross(x, z, y, w, true),
      cross(y, z, x, w, false),
      diagonal(ww, zz, xx, yy)
    ])
  ])
}
function liftFrame(
  a: Algebra<ConstrainedFraction>,
  frame: WalkingRigidTransform
): ExactFrame {
  return {
    origin: vector(frame.position.map(a.literal)),
    matrix: similarity(a, frame.rotation.map(a.literal))
  }
}
function convertFrame<T>(
  a: Algebra<T>,
  frame: ExactFrame
): ConstrainedFrame<T> {
  return {
    origin: vector(frame.origin.map(a.rational)),
    matrix: matrix(frame.matrix.map((row) => vector(row.map(a.rational))))
  }
}
const equalFraction = (a: ConstrainedFraction, b: ConstrainedFraction) =>
  a.numerator === b.numerator && a.denominator === b.denominator
const equalVector = (
  a: ConstrainedVector<ConstrainedFraction>,
  b: ConstrainedVector<ConstrainedFraction>
) => a.every((value, index) => equalFraction(value, b[index]))
const identityRotation = (frame: WalkingRigidTransform) =>
  frame.rotation.every((value, index) => value === (index === 3 ? 1 : 0))
interface SupportTemplate {
  readonly entry: WalkingConstrainedRecipe['supports'][number]
  readonly chain: WalkingRobotSource['rig']['legChains'][number]
  readonly contact: WalkingPatchReference
  readonly hipOffset: ConstrainedVector<ConstrainedFraction>
  readonly fixedLower: ExactFrame
}
interface PreparedTemplate {
  readonly supports: readonly SupportTemplate[]
  readonly base: ExactFrame
  readonly referenceOffset: ConstrainedVector<ConstrainedFraction>
  readonly kneeTranslation: ConstrainedVector<ConstrainedFraction>
  readonly footTranslation: ConstrainedVector<ConstrainedFraction>
  readonly fixedFrames: ReadonlyMap<WalkingRobotJoint, ExactFrame>
  readonly partFrames: ReadonlyMap<WalkingRobotPart, ExactFrame>
  readonly bodyFrames: ReadonlyMap<WalkingRobotBody, ExactFrame>
}
export interface WalkingConstrainedProjection {
  readonly source: WalkingRobotSource
  readonly recipe: WalkingConstrainedRecipe
  readonly interval: Interval
  readonly certificate: Readonly<{
    authority: 'polynomial-similarity-shared-conjugate/1'
    sharedTranslations: 1
    sharedDisplacements: 1
    quaternionNormBounds: Interval
  }>
  readonly bodies: readonly Readonly<{
    body: WalkingRobotBody
    bounds: ConstrainedFrame<Interval>
  }>[]
  readonly parts: readonly Readonly<{
    part: WalkingRobotPart
    bounds: ConstrainedFrame<Interval>
    sourceBounds: Readonly<{ min: readonly number[]; max: readonly number[] }>
  }>[]
  readonly supports: readonly Readonly<{
    chainId: string
    part: WalkingRobotPart
    patch: SourcePatch
    anchorOrigin: ConstrainedVector<ConstrainedFraction>
    fixedVertices: readonly Readonly<{
      index: number
      position: ConstrainedVector<ConstrainedFraction>
    }>[]
  }>[]
  readonly work: Readonly<Work>
}
export interface WalkingConstrainedPoint {
  readonly source: WalkingRobotSource
  readonly recipe: WalkingConstrainedRecipe
  readonly parameter: number
  readonly frames: readonly Readonly<{
    body: WalkingRobotBody
    exact: ExactFrame
    display: ConstrainedFrame<number>
  }>[]
  readonly parts: readonly Readonly<{
    part: WalkingRobotPart
    exact: ExactFrame
  }>[]
  readonly work: Readonly<Work>
}
function admit(
  source: WalkingRobotSource,
  raw: unknown,
  onWork: (key: keyof Work, amount: number) => void
) {
  if (
    !record(raw, [
      'format',
      'source',
      'baseOrientation',
      'supports',
      'fixedJoints',
      'interval',
      'budget'
    ]) ||
    raw.format !== 'walking-constrained-kinematic-projection/1' ||
    raw.source !== source ||
    !Object.isFrozen(source)
  )
    fail('source or recipe binding')
  if (
    !record(raw.budget, ['maxOperations', 'maxBits']) ||
    !Number.isSafeInteger(raw.budget.maxOperations) ||
    Number(raw.budget.maxOperations) < 1 ||
    Number(raw.budget.maxOperations) > 10000000 ||
    !Number.isSafeInteger(raw.budget.maxBits) ||
    Number(raw.budget.maxBits) < 1 ||
    Number(raw.budget.maxBits) > 24000
  )
    fail('finite budget required')
  const budget = {
    maxOperations: Number(raw.budget.maxOperations),
    maxBits: Number(raw.budget.maxBits)
  }
  const work = zeroWork(),
    a = arithmetic(budget, work, onWork)
  const rational = (value: unknown) => {
    if (
      !record(value, ['numerator', 'denominator']) ||
      typeof value.numerator !== 'bigint' ||
      typeof value.denominator !== 'bigint' ||
      value.denominator <= 0n
    )
      fail('invalid rational')
    return a.fraction(value.numerator, value.denominator)
  }
  if (!Array.isArray(raw.baseOrientation) || raw.baseOrientation.length !== 4)
    fail('base orientation')
  const baseOrientation = raw.baseOrientation.map(
    rational
  ) as unknown as WalkingConstrainedRecipe['baseOrientation']
  if (baseOrientation.every((value) => value.numerator === 0n))
    fail('zero norm')
  if (
    !record(raw.interval, ['low', 'high']) ||
    typeof raw.interval.low !== 'number' ||
    typeof raw.interval.high !== 'number' ||
    !Number.isFinite(raw.interval.low) ||
    !Number.isFinite(raw.interval.high) ||
    raw.interval.low > raw.interval.high
  )
    fail('parameter interval')
  if (
    !Object.values(source.rig.presets).includes(
      raw.fixedJoints as WalkingRobotJointState
    )
  )
    fail('fixed state must be current admitted preset')
  if (!Array.isArray(raw.supports) || raw.supports.length !== 3)
    fail('three support anchors required')
  const supports = raw.supports
    .map((value) => {
      if (
        !record(value, ['chainId', 'part', 'patch', 'anchorOrigin']) ||
        typeof value.chainId !== 'string' ||
        !Array.isArray(value.anchorOrigin) ||
        value.anchorOrigin.length !== 3
      )
        fail('support binding')
      const chain = source.rig.legChains.find(
        (chain) => chain.id === value.chainId
      )
      const contact = source.rig.contacts.feet.find(
        (contact) =>
          contact.part === value.part && contact.patch === value.patch
      )
      if (!chain || !contact || contact.part.bodyId !== chain.footBodyId)
        fail('stale support patch')
      return {
        chainId: chain.id,
        part: contact.part,
        patch: contact.patch,
        anchorOrigin: vector(value.anchorOrigin.map(rational))
      }
    })
    .sort((a, b) => a.chainId.localeCompare(b.chainId))
  if (new Set(supports.map((entry) => entry.chainId)).size !== 3)
    fail('duplicate support')
  const groups = supports.map((entry) => {
    const chain = required(
      source.rig.legChains.find((chain) => chain.id === entry.chainId)
    )
    return (chain.side === 'left') !== (chain.station === 'middle')
  })
  if (groups.some((value) => value !== groups[0])) fail('unsupported tripod')
  const recipe: WalkingConstrainedRecipe = freeze({
    format: 'walking-constrained-kinematic-projection/1',
    source,
    baseOrientation,
    supports,
    fixedJoints: raw.fixedJoints as WalkingRobotJointState,
    interval: { low: raw.interval.low, high: raw.interval.high },
    budget
  })
  return { recipe, work }
}
function jointValues(recipe: WalkingConstrainedRecipe) {
  const values = new Map<string, number>()
  const source = recipe.source,
    state = recipe.fixedJoints
  const lift = source.rig.joints.filter((joint) => joint.motion === 'prismatic')
  if (lift.length !== 1) fail('unsupported lift layout')
  values.set(lift[0].id, state.carriage)
  for (const chain of source.rig.armChains) {
    const arm = required(
      state.arms.find(
        (arm) => arm.side === chain.side && arm.role === chain.role
      )
    )
    ;[arm.rootYaw, arm.shoulderPitch, arm.elbowPitch, arm.wristPitch].forEach(
      (value, index) => values.set(chain.jointIds[index], value)
    )
  }
  for (const chain of source.rig.legChains) {
    const leg = required(
      state.legs.find(
        (leg) => leg.side === chain.side && leg.station === chain.station
      )
    )
    ;[leg.abduction, leg.hip, leg.knee].forEach((value, index) =>
      values.set(chain.jointIds[index], value)
    )
  }
  for (const joint of source.rig.joints) {
    const value = required(values.get(joint.id))
    if (
      !Number.isFinite(value) ||
      value < joint.domain[0] ||
      value > joint.domain[1]
    )
      fail('fixed joint domain')
  }
  return values
}
function prepareTemplate(
  recipe: WalkingConstrainedRecipe,
  engine: ReturnType<typeof arithmetic>
): PreparedTemplate {
  const a = engine.exact,
    source = recipe.source,
    values = jointValues(recipe)
  const base = { ...identity(a), matrix: similarity(a, recipe.baseOrientation) }
  const supports: SupportTemplate[] = []
  let kneeTranslation: ConstrainedVector<ConstrainedFraction> | undefined,
    footTranslation: ConstrainedVector<ConstrainedFraction> | undefined,
    referenceOffset: ConstrainedVector<ConstrainedFraction> | undefined
  let dimensions: readonly number[] | undefined
  for (const entry of recipe.supports) {
    const chain = required(
      source.rig.legChains.find((chain) => chain.id === entry.chainId)
    )
    const leg = required(
      source.definition.legs.find(
        (leg) => leg.side === chain.side && leg.station === chain.station
      )
    )
    const shapeDimensions = [
      leg.coxa.length,
      leg.coxa.section,
      leg.upper.length,
      leg.upper.section,
      leg.lower.length,
      leg.lower.section,
      ...leg.foot.size
    ]
    if (
      dimensions &&
      shapeDimensions.some((value, index) => value !== dimensions?.[index])
    )
      fail('unsupported unequal support dimensions')
    dimensions = shapeDimensions
    const abduction = required(
      source.rig.joints.find((joint) => joint.id === chain.jointIds[0])
    )
    const hip = required(
      source.rig.joints.find((joint) => joint.id === chain.jointIds[1])
    )
    const knee = required(
      source.rig.joints.find((joint) => joint.id === chain.jointIds[2])
    )
    const foot = required(
      source.rig.bodies.find((body) => body.id === chain.footBodyId)
    )
    const contact = required(
      source.rig.contacts.feet.find(
        (contact) =>
          contact.part === entry.part && contact.patch === entry.patch
      )
    )
    const fixed = required(foot.fixedFrame)
    if (
      abduction.axis !== 'z' ||
      hip.axis !== 'x' ||
      knee.axis !== 'x' ||
      abduction.parentBodyId !== 'base' ||
      abduction.childBodyId !== chain.bodyIds[0] ||
      hip.parentBodyId !== chain.bodyIds[0] ||
      hip.childBodyId !== chain.bodyIds[1] ||
      knee.parentBodyId !== chain.bodyIds[1] ||
      knee.childBodyId !== chain.bodyIds[2] ||
      foot.parentBodyId !== chain.bodyIds[2] ||
      foot.attachment !== 'fixed' ||
      values.get(abduction.id) !== 0 ||
      ![abduction.frame, hip.frame, knee.frame, fixed].every(identityRotation)
    )
      fail('unsupported conjugate layout')
    if (
      recipe.interval.low < knee.domain[0] ||
      recipe.interval.high > knee.domain[1] ||
      -recipe.interval.high < hip.domain[0] ||
      -recipe.interval.low > hip.domain[1]
    )
      fail('support joint domain')
    const kt = vector(knee.frame.position.map(a.literal)),
      ft = vector(fixed.position.map(a.literal))
    if (
      (kneeTranslation && !equalVector(kt, kneeTranslation)) ||
      (footTranslation && !equalVector(ft, footTranslation))
    )
      fail('inexact shared displacement dependency')
    kneeTranslation = kt
    footTranslation = ft
    const hipOffset = plusVector(
      a,
      vector(abduction.frame.position.map(a.literal)),
      vector(hip.frame.position.map(a.literal))
    )
    const offset = plusVector(
      a,
      hipOffset,
      vector(contact.localFrame.position.map(a.literal))
    )
    if (referenceOffset) {
      const expected = rotate(
        a,
        base.matrix,
        minusVector(a, offset, referenceOffset)
      )
      const actual = minusVector(
        a,
        entry.anchorOrigin,
        recipe.supports[0].anchorOrigin
      )
      if (!equalVector(expected, actual)) fail('incompatible exact anchors')
    } else referenceOffset = offset
    const localLower = minusVector(
      a,
      minusVector(a, hipOffset, required(referenceOffset)),
      ft
    )
    const fixedLower = {
      matrix: base.matrix,
      origin: plusVector(
        a,
        recipe.supports[0].anchorOrigin,
        rotate(a, base.matrix, localLower)
      )
    }
    supports.push({ entry, chain, contact, hipOffset, fixedLower })
  }
  const variable = new Set(
    supports.flatMap(({ chain }) => [chain.jointIds[1], chain.jointIds[2]])
  )
  const leafCache = new Map<string, ConstrainedFraction>()
  const leaf = (kind: 'sin' | 'cos', value: number) => {
    const key = kind + ':' + value
    let result = leafCache.get(key)
    if (!result) {
      const computed = evaluatePolynomialTrig(kind, value)
      engine.count('pointLeaves')
      engine.count('maxBits', computed.work.maxBigIntBits)
      result = a.literal(computed.value)
      leafCache.set(key, result)
    }
    return result
  }
  const fixedFrames = new Map<WalkingRobotJoint, ExactFrame>()
  for (const joint of source.rig.joints) {
    if (variable.has(joint.id)) continue
    const value = required(values.get(joint.id))
    let motion = identity(a)
    const axis = { x: 0, y: 1, z: 2 }[joint.axis]
    if (joint.motion === 'prismatic')
      motion = {
        ...motion,
        origin: vector(
          [0, 1, 2].map((index) => a.literal(index === axis ? value : 0))
        )
      }
    else {
      const q = [
        a.literal(0),
        a.literal(0),
        a.literal(0),
        leaf('cos', value / 2)
      ]
      q[axis] = leaf('sin', value / 2)
      motion = { ...motion, matrix: similarity(a, q) }
    }
    fixedFrames.set(
      joint,
      freeze(compose(a, liftFrame(a, joint.frame), motion))
    )
  }
  const partFrames = new Map(
    source.parts.map(
      (part) => [part, freeze(liftFrame(a, part.localFrame))] as const
    )
  )
  const bodyFrames = new Map(
    source.rig.bodies
      .filter((body) => body.attachment === 'fixed')
      .map(
        (body) =>
          [body, freeze(liftFrame(a, required(body.fixedFrame)))] as const
      )
  )
  return {
    supports,
    base,
    referenceOffset: required(referenceOffset),
    kneeTranslation: required(kneeTranslation),
    footTranslation: required(footTranslation),
    fixedFrames,
    partFrames,
    bodyFrames
  }
}
function frames<T>(
  recipe: WalkingConstrainedRecipe,
  template: PreparedTemplate,
  a: Algebra<T>,
  sine: T,
  cosine: T
) {
  const zero = a.literal(0),
    conjugate = [a.subtract(zero, sine), zero, zero, cosine]
  const hip = similarity(a, conjugate)
  // One fixed template, one shared D node; no general expression simplifier.
  const displacement = plusVector(
    a,
    rotate(a, hip, vector(template.kneeTranslation.map(a.rational))),
    vector(template.footTranslation.map(a.rational))
  )
  const base = convertFrame(a, template.base)
  const localReference = plusVector(
    a,
    vector(template.referenceOffset.map(a.rational)),
    displacement
  )
  const root = {
    matrix: base.matrix,
    origin: minusVector(
      a,
      vector(recipe.supports[0].anchorOrigin.map(a.rational)),
      rotate(a, base.matrix, localReference)
    )
  }
  const result = new Map<string, ConstrainedFrame<T>>([['base', root]])
  const supportUpper = new Map(
    template.supports.map((s) => [s.chain.bodyIds[1], s])
  )
  const supportLower = new Map(
    template.supports.map((s) => [s.chain.bodyIds[2], s])
  )
  // The inverse has the same proved norm. Its exact conjugate identity fixes
  // lower frames without independently rounded products or an unused matrix.
  const pending = new Set(
    recipe.source.rig.bodies.filter((body) => body.id !== 'base')
  )
  while (pending.size) {
    let advanced = false
    for (const body of pending) {
      const parent = body.parentBodyId
        ? result.get(body.parentBodyId)
        : undefined
      if (!parent) continue
      let frame: ConstrainedFrame<T>
      const lower = supportLower.get(body.id),
        upper = supportUpper.get(body.id)
      if (lower) frame = convertFrame(a, lower.fixedLower)
      else if (upper)
        frame = {
          matrix: compose(a, base, {
            origin: vector([zero, zero, zero]),
            matrix: hip
          }).matrix,
          origin: plusVector(
            a,
            root.origin,
            rotate(a, base.matrix, vector(upper.hipOffset.map(a.rational)))
          )
        }
      else if (body.attachment === 'fixed')
        frame = compose(
          a,
          parent,
          convertFrame(a, required(template.bodyFrames.get(body)))
        )
      else {
        const joint = required(
          recipe.source.rig.joints.find(
            (joint) => joint.childBodyId === body.id
          )
        )
        frame = compose(
          a,
          parent,
          convertFrame(a, required(template.fixedFrames.get(joint)))
        )
      }
      result.set(body.id, frame)
      pending.delete(body)
      advanced = true
    }
    if (!advanced) fail('unsupported source dependency')
  }
  return result
}
export class WalkingConstrainedKinematicsOwner {
  private current: WalkingConstrainedProjection | undefined
  private template: PreparedTemplate | undefined
  private point: WalkingConstrainedPoint | undefined
  private totals = { ...zeroWork(), preparations: 0, evaluations: 0 }
  get work() {
    return Object.freeze({ ...this.totals })
  }
  private onWork = (key: keyof Work, amount: number) => {
    if (key === 'maxBits')
      this.totals.maxBits = Math.max(this.totals.maxBits, amount)
    else this.totals[key] += amount
  }
  read(source: WalkingRobotSource, recipe: WalkingConstrainedRecipe) {
    return this.current?.source === source && this.current.recipe === recipe
      ? this.current
      : undefined
  }
  prepare(
    source: WalkingRobotSource,
    raw: unknown
  ): WalkingConstrainedProjection {
    if (
      this.current &&
      raw === this.current.recipe &&
      source === this.current.source
    )
      return this.current
    this.current = undefined
    this.template = undefined
    this.point = undefined
    this.totals.preparations++
    const { recipe, work } = admit(source, raw, this.onWork),
      engine = arithmetic(recipe.budget, work, this.onWork),
      template = prepareTemplate(recipe, engine)
    const half = multiply(recipe.interval, interval(0.5))
    const sin = boundPolynomialTrig('sin', half),
      cos = boundPolynomialTrig('cos', half)
    engine.count('boundLeaves', 2)
    engine.count(
      'maxBits',
      Math.max(sin.work.maxBigIntBits, cos.work.maxBigIntBits)
    )
    const quaternionNormBounds = engine.ranges.add(
      engine.ranges.multiply(sin.bounds, sin.bounds),
      engine.ranges.multiply(cos.bounds, cos.bounds)
    )
    if (quaternionNormBounds.low <= 0) fail('unproved positive norm')
    const boundedFrames = frames(
      recipe,
      template,
      engine.ranges,
      sin.bounds,
      cos.bounds
    )
    const bodies = source.rig.bodies.map((body) => ({
      body,
      bounds: required(boundedFrames.get(body.id))
    }))
    const parts = source.parts.map((part) => {
      const bounds = compose(
        engine.ranges,
        required(boundedFrames.get(part.bodyId)),
        convertFrame(engine.ranges, required(template.partFrames.get(part)))
      )
      const min = [Infinity, Infinity, Infinity],
        max = [-Infinity, -Infinity, -Infinity]
      for (let offset = 0; offset < part.shape.positions.length; offset += 3) {
        engine.count('sourceVertices')
        const local = vector(
          part.shape.positions
            .slice(offset, offset + 3)
            .map(engine.ranges.literal)
        )
        const p = plusVector(
          engine.ranges,
          bounds.origin,
          rotate(engine.ranges, bounds.matrix, local)
        )
        for (let axis = 0; axis < 3; axis++) {
          min[axis] = Math.min(min[axis], p[axis].low)
          max[axis] = Math.max(max[axis], p[axis].high)
        }
      }
      return { part, bounds, sourceBounds: { min, max } }
    })
    const supports = template.supports.map((s) => {
      const body = required(
        source.rig.bodies.find((body) => body.id === s.chain.footBodyId)
      )
      const foot = compose(
        engine.exact,
        s.fixedLower,
        required(template.bodyFrames.get(body))
      )
      const partFrame = compose(
        engine.exact,
        foot,
        required(template.partFrames.get(s.entry.part))
      )
      const indices = new Set<number>()
      for (const range of s.entry.patch.ranges)
        for (
          let index = range.indexStart;
          index < range.indexStart + range.indexCount;
          index++
        )
          indices.add(s.entry.part.shape.indices[index])
      const fixedVertices = [...indices].map((index) => {
        engine.count('supportVertices')
        const local = vector(
          s.entry.part.shape.positions
            .slice(index * 3, index * 3 + 3)
            .map(engine.exact.literal)
        )
        return {
          index,
          position: plusVector(
            engine.exact,
            partFrame.origin,
            rotate(engine.exact, partFrame.matrix, local)
          )
        }
      })
      const actual = plusVector(
        engine.exact,
        foot.origin,
        rotate(
          engine.exact,
          foot.matrix,
          vector(s.contact.localFrame.position.map(engine.exact.literal))
        )
      )
      if (!equalVector(actual, s.entry.anchorOrigin))
        fail('unproved shared support anchor')
      return {
        chainId: s.entry.chainId,
        part: s.entry.part,
        patch: s.entry.patch,
        anchorOrigin: s.entry.anchorOrigin,
        fixedVertices
      }
    })
    const product = freeze({
      source,
      recipe,
      interval: recipe.interval,
      certificate: {
        authority: 'polynomial-similarity-shared-conjugate/1' as const,
        sharedTranslations: 1 as const,
        sharedDisplacements: 1 as const,
        quaternionNormBounds
      },
      bodies,
      parts,
      supports,
      work: { ...work }
    })
    this.template = template
    this.current = product
    return product
  }
  evaluate(
    projection: WalkingConstrainedProjection,
    parameter: number
  ): WalkingConstrainedPoint {
    if (projection !== this.current || !this.template) fail('stale projection')
    if (
      !Number.isFinite(parameter) ||
      parameter < projection.interval.low ||
      parameter > projection.interval.high
    )
      fail('parameter outside interval')
    if (this.point && Object.is(this.point.parameter, parameter))
      return this.point
    this.totals.evaluations++
    const work = zeroWork(),
      engine = arithmetic(projection.recipe.budget, work, this.onWork)
    const sin = evaluatePolynomialTrig('sin', parameter / 2),
      cos = evaluatePolynomialTrig('cos', parameter / 2)
    engine.count('pointLeaves', 2)
    engine.count(
      'maxBits',
      Math.max(sin.work.maxBigIntBits, cos.work.maxBigIntBits)
    )
    const exactFrames = frames(
      projection.recipe,
      this.template,
      engine.exact,
      engine.exact.literal(sin.value),
      engine.exact.literal(cos.value)
    )
    const rounded = (value: ConstrainedFraction) =>
      roundFraction(value.numerator, value.denominator, 'nearest-even')
    const framesOut = projection.source.rig.bodies.map((body) => {
      const exact = required(exactFrames.get(body.id))
      const display = {
        origin: vector(exact.origin.map(rounded)),
        matrix: matrix(exact.matrix.map((row) => vector(row.map(rounded))))
      }
      if (
        [...display.origin, ...display.matrix.flat()].some(
          (value) => !Number.isFinite(value)
        )
      )
        fail('nonfinite display projection')
      return { body, exact, display }
    })
    const parts = projection.source.parts.map((part) => ({
      part,
      exact: compose(
        engine.exact,
        required(exactFrames.get(part.bodyId)),
        required(this.template?.partFrames.get(part))
      )
    }))
    const point = freeze({
      source: projection.source,
      recipe: projection.recipe,
      parameter,
      frames: framesOut,
      parts,
      work: { ...work }
    })
    this.point = point
    return point
  }
  dispose() {
    this.current = undefined
    this.template = undefined
    this.point = undefined
  }
}

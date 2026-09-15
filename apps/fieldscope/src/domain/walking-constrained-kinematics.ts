import {
  evaluatePolynomialTrig,
  boundPolynomialTrig,
  evaluateExactPolynomialTrig,
  boundExactPolynomialTrig,
  POLYNOMIAL_TRIG_SIGN_CERTIFICATE
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

export interface WalkingConstrainedCycleRecipe {
  readonly format: 'walking-constrained-cycle/1'
  readonly source: WalkingRobotSource
  readonly fixedJoints: WalkingRobotJointState
  readonly baseOrientation: WalkingConstrainedRecipe['baseOrientation']
  readonly alpha: ConstrainedFraction
  readonly groups: readonly [readonly string[], readonly string[]]
  readonly anchors: WalkingConstrainedRecipe['supports']
  readonly budget: WalkingConstrainedRecipe['budget']
}
interface CyclePhaseTemplate {
  readonly recipe: WalkingConstrainedRecipe
  readonly template: PreparedTemplate
}
interface CyclePrepared {
  readonly recipe: WalkingConstrainedCycleRecipe
  readonly phases: readonly CyclePhaseTemplate[]
  readonly netDisplacement: ConstrainedVector<ConstrainedFraction>
}
type CycleEngine = ReturnType<typeof arithmetic>
function cycleCompare(
  a: ConstrainedFraction,
  b: ConstrainedFraction,
  e: CycleEngine
) {
  const n = e.exact.subtract(a, b).numerator
  return n < 0n ? -1 : Number(n > 0n)
}
function cycleLeaf(e: CycleEngine, value: ConstrainedFraction) {
  const read = (kind: 'sin' | 'cos') => {
    const result = evaluateExactPolynomialTrig(kind, value)
    e.count('pointLeaves')
    e.count('maxBits', result.work.maxBigIntBits)
    e.count(
      'operations',
      result.work.terms +
        result.work.gcdSteps +
        result.work.normalizations +
        result.work.admissionChecks +
        result.work.rationalComparisons
    )
    return result.value
  }
  return { sin: read('sin'), cos: read('cos') }
}
function cycleBounds(
  e: CycleEngine,
  low: ConstrainedFraction,
  high: ConstrainedFraction
) {
  const read = (kind: 'sin' | 'cos') => {
    const result = boundExactPolynomialTrig(kind, { low, high })
    e.count('boundLeaves')
    e.count('maxBits', result.work.maxBigIntBits)
    e.count(
      'operations',
      result.work.terms +
        result.work.gcdSteps +
        result.work.normalizations +
        result.work.admissionChecks +
        result.work.rationalComparisons
    )
    return result.outward
  }
  const result = { sin: read('sin'), cos: read('cos') }
  // Cosine is positive over the admitted fixed-polynomial domain. Squaring
  // its positive lower bound proves the similarity denominator is positive.
  if (result.cos.low <= 0) fail('cycle norm unproved')
  return result
}
function cycleRotation<T>(a: Algebra<T>, axis: 'x' | 'z', sin: T, cos: T) {
  const z = a.literal(0)
  return similarity(a, axis === 'x' ? [sin, z, z, cos] : [z, z, sin, cos])
}
function cycleFrames<T>(
  prepared: CyclePrepared,
  phase: number,
  a: Algebra<T>,
  theta: { sin: T; cos: T },
  beta: { sin: T; cos: T }
) {
  const { recipe, template } = prepared.phases[phase],
    source = recipe.source
  const zero = a.literal(0)
  const negSin = a.subtract(zero, theta.sin)
  const supportHip = cycleRotation(a, 'x', negSin, theta.cos)
  const swingHip = cycleRotation(a, 'x', theta.sin, theta.cos)
  const base = convertFrame(a, template.base)
  const d = plusVector(
    a,
    rotate(a, supportHip, vector(template.kneeTranslation.map(a.rational))),
    vector(template.footTranslation.map(a.rational))
  )
  const root = {
    matrix: base.matrix,
    origin: minusVector(
      a,
      vector(recipe.supports[0].anchorOrigin.map(a.rational)),
      rotate(
        a,
        base.matrix,
        plusVector(a, vector(template.referenceOffset.map(a.rational)), d)
      )
    )
  }
  const result = new Map<string, ConstrainedFrame<T>>([['base', root]])
  for (const chain of source.rig.legChains) {
    const joints = chain.jointIds.map((id) =>
      required(source.rig.joints.find((j) => j.id === id))
    )
    const support = template.supports.find((s) => s.chain.id === chain.id)
    const outward =
      chain.side === 'left' ? a.subtract(zero, beta.sin) : beta.sin
    const abduction = support
      ? identity(a).matrix
      : cycleRotation(a, 'z', outward, beta.cos)
    const coxa = compose(a, root, {
      origin: vector(joints[0].frame.position.map(a.literal)),
      matrix: abduction
    })
    const upper = compose(a, coxa, {
      origin: vector(joints[1].frame.position.map(a.literal)),
      matrix: support ? supportHip : swingHip
    })
    // The conjugate pair shares the exact polynomial leaves and norm. The
    // lower orientation is the coxa orientation, without interval dependency loss.
    const lower = support
      ? convertFrame(a, support.fixedLower)
      : {
          matrix: coxa.matrix,
          origin: plusVector(
            a,
            upper.origin,
            rotate(
              a,
              upper.matrix,
              vector(joints[2].frame.position.map(a.literal))
            )
          )
        }
    result.set(chain.bodyIds[0], coxa)
    result.set(chain.bodyIds[1], upper)
    result.set(chain.bodyIds[2], lower)
  }
  const pending = new Set(source.rig.bodies.filter((b) => !result.has(b.id)))
  while (pending.size) {
    let advanced = false
    for (const body of pending) {
      const parent = body.parentBodyId
        ? result.get(body.parentBodyId)
        : undefined
      if (!parent) continue
      const local =
        body.attachment === 'fixed'
          ? required(template.bodyFrames.get(body))
          : required(
              template.fixedFrames.get(
                required(
                  source.rig.joints.find((j) => j.childBodyId === body.id)
                )
              )
            )
      result.set(body.id, compose(a, parent, convertFrame(a, local)))
      pending.delete(body)
      advanced = true
    }
    if (!advanced) fail('cycle source dependency')
  }
  return result
}
function cyclePointFrames(
  prepared: CyclePrepared,
  phase: number,
  u: ConstrainedFraction,
  e: CycleEngine
) {
  const a = e.exact,
    one = a.literal(1),
    two = a.literal(2)
  const theta = a.multiply(
    prepared.recipe.alpha,
    a.subtract(a.multiply(two, u), one)
  )
  const beta = a.multiply(
    a.multiply(a.literal(4), prepared.recipe.alpha),
    a.multiply(u, a.subtract(one, u))
  )
  return cycleFrames(
    prepared,
    phase,
    a,
    cycleLeaf(e, a.divide(theta, two)),
    cycleLeaf(e, a.divide(beta, two))
  )
}
function cycleAnchor(
  part: WalkingRobotPart,
  chainId: string,
  source: WalkingRobotSource,
  frames: Map<string, ExactFrame>,
  a: Algebra<ConstrainedFraction>
) {
  const contact = required(
    source.rig.contacts.feet.find((c) => c.part === part)
  )
  const chain = required(source.rig.legChains.find((c) => c.id === chainId))
  const foot = required(frames.get(chain.footBodyId))
  return plusVector(
    a,
    foot.origin,
    rotate(a, foot.matrix, vector(contact.localFrame.position.map(a.literal)))
  )
}
function patchVertices(part: WalkingRobotPart, patch: SourcePatch) {
  const indices = new Set<number>()
  for (const range of patch.ranges)
    for (let i = range.indexStart; i < range.indexStart + range.indexCount; i++)
      indices.add(part.shape.indices[i])
  return [...indices]
}
function admitCycle(
  source: WalkingRobotSource,
  raw: unknown,
  e: CycleEngine
): WalkingConstrainedCycleRecipe {
  if (
    !record(raw, [
      'format',
      'source',
      'fixedJoints',
      'baseOrientation',
      'alpha',
      'groups',
      'anchors',
      'budget'
    ]) ||
    raw.format !== 'walking-constrained-cycle/1' ||
    raw.source !== source ||
    !Object.isFrozen(source) ||
    raw.fixedJoints !== source.rig.presets.stowed
  )
    fail('cycle source or stowed identity')
  const a = e.exact
  const rational = (value: unknown) => {
    if (
      !record(value, ['numerator', 'denominator']) ||
      typeof value.numerator !== 'bigint' ||
      typeof value.denominator !== 'bigint' ||
      value.denominator <= 0n
    )
      fail('cycle rational')
    const result = e.fraction(value.numerator, value.denominator)
    if (
      result.numerator !== value.numerator ||
      result.denominator !== value.denominator
    )
      fail('cycle noncanonical rational')
    return result
  }
  const alpha = rational(raw.alpha)
  if (alpha.numerator <= 0n || cycleCompare(alpha, a.literal(1), e) >= 0)
    fail('cycle alpha domain')
  if (!Array.isArray(raw.baseOrientation) || raw.baseOrientation.length !== 4)
    fail('cycle orientation')
  const baseOrientation = raw.baseOrientation.map(
    rational
  ) as unknown as WalkingConstrainedRecipe['baseOrientation']
  if (
    baseOrientation[0].numerator !== 0n ||
    baseOrientation[2].numerator !== 0n ||
    (baseOrientation[1].numerator === 0n && baseOrientation[3].numerator === 0n)
  )
    fail('cycle gravity-preserving yaw')
  if (
    source.rig.legChains.length !== 6 ||
    !Array.isArray(raw.groups) ||
    raw.groups.length !== 2 ||
    raw.groups.some(
      (g) =>
        !Array.isArray(g) ||
        g.length !== 3 ||
        g.some((id) => typeof id !== 'string')
    )
  )
    fail('cycle tripod groups')
  const groups = raw.groups.map((g) => [...g]) as [string[], string[]]
  if (
    new Set(groups.flat()).size !== 6 ||
    groups.flat().some((id) => !source.rig.legChains.some((c) => c.id === id))
  )
    fail('cycle tripod coverage')
  for (const group of groups) {
    const chains = group.map((id) =>
      required(source.rig.legChains.find((c) => c.id === id))
    )
    const parity =
      (chains[0].side === 'left') !== (chains[0].station === 'middle')
    if (
      new Set(chains.map((c) => c.station)).size !== 3 ||
      chains.some(
        (c) => ((c.side === 'left') !== (c.station === 'middle')) !== parity
      )
    )
      fail('cycle complementary tripod')
  }
  if (!Array.isArray(raw.anchors) || raw.anchors.length !== 6)
    fail('cycle anchors')
  const anchors = raw.anchors.map((entry) => {
    if (
      !record(entry, ['chainId', 'part', 'patch', 'anchorOrigin']) ||
      typeof entry.chainId !== 'string'
    )
      fail('cycle anchor')
    const chain = required(
      source.rig.legChains.find((c) => c.id === entry.chainId)
    )
    const contact = required(
      source.rig.contacts.feet.find((c) => c.part.bodyId === chain.footBodyId)
    )
    if (
      entry.part !== contact.part ||
      entry.patch !== contact.patch ||
      !Array.isArray(entry.anchorOrigin) ||
      entry.anchorOrigin.length !== 3
    )
      fail('cycle sole binding')
    return {
      chainId: chain.id,
      part: contact.part,
      patch: contact.patch,
      anchorOrigin: vector(entry.anchorOrigin.map(rational))
    }
  })
  if (new Set(anchors.map((v) => v.chainId)).size !== 6)
    fail('cycle duplicate anchors')
  for (const leg of source.rig.presets.stowed.legs)
    if (leg.abduction !== 0 || leg.hip !== 0 || leg.knee !== 0)
      fail('cycle neutral stowed legs')
  for (const arm of source.rig.presets.stowed.arms)
    if (
      arm.rootYaw !== 0 ||
      arm.shoulderPitch !== 0 ||
      arm.elbowPitch !== 0 ||
      arm.wristPitch !== 0
    )
      fail('cycle fixed exact stowed arms')
  const minusAlpha = a.subtract(a.literal(0), alpha)
  for (const chain of source.rig.legChains) {
    const joints = chain.jointIds.map((id) =>
      required(source.rig.joints.find((j) => j.id === id))
    )
    for (const j of joints.slice(1))
      if (
        cycleCompare(minusAlpha, a.literal(j.domain[0]), e) < 0 ||
        cycleCompare(alpha, a.literal(j.domain[1]), e) > 0
      )
        fail('cycle authored domain')
    const abduct = chain.side === 'left' ? minusAlpha : alpha
    if (
      cycleCompare(abduct, a.literal(joints[0].domain[0]), e) < 0 ||
      cycleCompare(abduct, a.literal(joints[0].domain[1]), e) > 0
    )
      fail('cycle abduction domain')
  }
  return freeze({
    format: 'walking-constrained-cycle/1',
    source,
    fixedJoints: source.rig.presets.stowed,
    baseOrientation,
    alpha,
    groups,
    anchors,
    budget: { ...(raw.budget as WalkingConstrainedRecipe['budget']) }
  })
}
function cyclePrepare(
  recipe: WalkingConstrainedCycleRecipe,
  e: CycleEngine
): CyclePrepared {
  const a = e.exact,
    zero = a.literal(0),
    half = a.divide(recipe.alpha, a.literal(2))
  const leaf = cycleLeaf(e, half)
  const sigma = a.divide(
    a.multiply(a.literal(2), a.multiply(leaf.sin, leaf.cos)),
    a.add(a.multiply(leaf.sin, leaf.sin), a.multiply(leaf.cos, leaf.cos))
  )
  const extent = {
    low: roundFraction(
      -recipe.alpha.numerator,
      recipe.alpha.denominator,
      'down'
    ),
    high: roundFraction(recipe.alpha.numerator, recipe.alpha.denominator, 'up')
  }
  const phaseRecipe = (
    group: readonly string[],
    anchors: WalkingConstrainedRecipe['supports']
  ): WalkingConstrainedRecipe => ({
    format: 'walking-constrained-kinematic-projection/1',
    source: recipe.source,
    baseOrientation: recipe.baseOrientation,
    fixedJoints: recipe.fixedJoints,
    supports: group.map((id) =>
      required(anchors.find((v) => v.chainId === id))
    ),
    interval: extent,
    budget: recipe.budget
  })
  const firstRecipe = phaseRecipe(recipe.groups[0], recipe.anchors)
  const first = {
    recipe: firstRecipe,
    template: prepareTemplate(firstRecipe, e)
  }
  const kt = first.template.kneeTranslation
  if (kt[0].numerator !== 0n || kt[2].numerator !== 0n || kt[1].numerator >= 0n)
    fail('cycle upper direction')
  const upper = a.subtract(zero, kt[1])
  const netDisplacement = rotate(
    a,
    first.template.base.matrix,
    vector([
      zero,
      zero,
      a.subtract(zero, a.multiply(a.literal(4), a.multiply(upper, sigma)))
    ])
  )
  const nextAnchors = recipe.anchors.map((anchor) =>
    recipe.groups[1].includes(anchor.chainId)
      ? {
          ...anchor,
          anchorOrigin: plusVector(a, anchor.anchorOrigin, netDisplacement)
        }
      : anchor
  )
  const secondRecipe = phaseRecipe(recipe.groups[1], nextAnchors)
  const second = {
    recipe: secondRecipe,
    template: prepareTemplate(secondRecipe, e)
  }
  if (
    !equalVector(
      first.template.kneeTranslation,
      second.template.kneeTranslation
    ) ||
    !equalVector(
      first.template.footTranslation,
      second.template.footTranslation
    )
  )
    fail('cycle shared six-leg dimensions')
  // Exact station spacing, complete source Z extent and finite excursion bound.
  const chains = recipe.source.rig.legChains
  for (const side of ['left', 'right']) {
    const sideChains = chains.filter((c) => c.side === side)
    if (sideChains.length !== 3) fail('cycle side coverage')
    const positions = sideChains
      .map((c) =>
        a.literal(
          required(recipe.source.rig.joints.find((j) => j.id === c.jointIds[0]))
            .frame.position[2]
        )
      )
      .sort((x, y) => cycleCompare(x, y, e))
    for (let i = 1; i < positions.length; i++) {
      const spacing = a.subtract(positions[i], positions[i - 1])
      for (const chain of sideChains) {
        const leg = required(
          recipe.source.definition.legs.find(
            (l) => l.side === chain.side && l.station === chain.station
          )
        )
        const remaining = a.subtract(spacing, a.literal(leg.foot.size[2]))
        if (
          cycleCompare(
            a.multiply(a.literal(4), a.multiply(upper, recipe.alpha)),
            remaining,
            e
          ) > 0
        )
          fail('cycle source-derived alpha bound')
      }
    }
  }
  return { recipe, phases: [first, second], netDisplacement }
}
function cycleParameter(value: unknown, e: CycleEngine) {
  if (
    !record(value, ['numerator', 'denominator']) ||
    typeof value.numerator !== 'bigint' ||
    typeof value.denominator !== 'bigint' ||
    value.denominator <= 0n
  )
    fail('cycle parameter rational')
  const result = e.fraction(value.numerator, value.denominator)
  if (
    result.numerator !== value.numerator ||
    result.denominator !== value.denominator ||
    result.numerator < 0n ||
    cycleCompare(result, e.exact.literal(1), e) > 0
  )
    fail('cycle parameter domain')
  return result
}
function cycleGeometry(
  prepared: CyclePrepared,
  phase: number,
  e: CycleEngine,
  parameter?: Readonly<{ low: ConstrainedFraction; high: ConstrainedFraction }>
) {
  const a = e.exact,
    r = e.ranges,
    recipe = prepared.recipe,
    { template } = prepared.phases[phase]
  const zero = a.literal(0),
    one = a.literal(1),
    two = a.literal(2)
  const low = parameter?.low ?? zero,
    high = parameter?.high ?? one
  const thetaAt = (u: ConstrainedFraction) =>
    a.divide(a.multiply(recipe.alpha, a.subtract(a.multiply(two, u), one)), two)
  const bumpAt = (u: ConstrainedFraction) =>
    a.multiply(a.multiply(two, recipe.alpha), a.multiply(u, a.subtract(one, u)))
  const betaLow = bumpAt(low),
    betaHigh = bumpAt(high),
    half = a.divide(one, two)
  const betaMinimum =
    cycleCompare(betaLow, betaHigh, e) <= 0 ? betaLow : betaHigh
  let betaMaximum = cycleCompare(betaLow, betaHigh, e) >= 0 ? betaLow : betaHigh
  if (cycleCompare(low, half, e) <= 0 && cycleCompare(high, half, e) >= 0)
    betaMaximum = a.divide(recipe.alpha, two)
  const theta = cycleBounds(e, thetaAt(low), thetaAt(high))
  const beta = cycleBounds(e, betaMinimum, betaMaximum)
  const bounded = cycleFrames(prepared, phase, r, theta, beta)
  const bodies = recipe.source.rig.bodies.map((body) => ({
    body,
    bounds: required(bounded.get(body.id))
  }))
  const parts = recipe.source.parts.map((part) => {
    const bounds = compose(
      r,
      required(bounded.get(part.bodyId)),
      convertFrame(r, required(template.partFrames.get(part)))
    )
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity]
    for (let i = 0; i < part.shape.positions.length; i += 3) {
      e.count('sourceVertices')
      const p = plusVector(
        r,
        bounds.origin,
        rotate(
          r,
          bounds.matrix,
          vector(part.shape.positions.slice(i, i + 3).map(r.literal))
        )
      )
      p.forEach((v, k) => {
        min[k] = Math.min(min[k], v.low)
        max[k] = Math.max(max[k], v.high)
      })
    }
    return { part, bounds, sourceBounds: { min, max } }
  })
  const supports = template.supports.map((s) => {
    const foot = required(
      recipe.source.rig.bodies.find((b) => b.id === s.chain.footBodyId)
    )
    const frame = compose(
      a,
      compose(a, s.fixedLower, required(template.bodyFrames.get(foot))),
      required(template.partFrames.get(s.entry.part))
    )
    return {
      ...s.entry,
      fixedVertices: patchVertices(s.entry.part, s.entry.patch).map((index) => {
        e.count('supportVertices')
        const p = vector(
          s.entry.part.shape.positions
            .slice(index * 3, index * 3 + 3)
            .map(a.literal)
        )
        return {
          index,
          position: plusVector(a, frame.origin, rotate(a, frame.matrix, p))
        }
      })
    }
  })
  const swing = recipe.source.rig.legChains
    .filter((c) => !recipe.groups[phase].includes(c.id))
    .map((chain) => {
      const entry = required(recipe.anchors.find((v) => v.chainId === chain.id))
      const joints = chain.jointIds.map((id) =>
        required(recipe.source.rig.joints.find((j) => j.id === id))
      )
      const foot = required(
        recipe.source.rig.bodies.find((b) => b.id === chain.footBodyId)
      )
      const lowerToPart = compose(
        a,
        required(template.bodyFrames.get(foot)),
        required(template.partFrames.get(entry.part))
      )
      const hip = cycleRotation(r, 'x', theta.sin, theta.cos)
      const offset = plusVector(
        r,
        vector(joints[1].frame.position.map(r.literal)),
        rotate(r, hip, vector(joints[2].frame.position.map(r.literal)))
      )
      const vertices = patchVertices(entry.part, entry.patch).map((index) => {
        e.count('supportVertices')
        const local = plusVector(
          a,
          lowerToPart.origin,
          rotate(
            a,
            lowerToPart.matrix,
            vector(
              entry.part.shape.positions
                .slice(index * 3, index * 3 + 3)
                .map(a.literal)
            )
          )
        )
        const p = plusVector(r, offset, vector(local.map(r.rational)))
        const rho =
          chain.side === 'left' ? r.subtract(r.literal(0), p[0]) : p[0]
        const down = r.subtract(r.literal(0), p[1])
        if (rho.low <= 0 || down.low < 0)
          fail('cycle swing sole radial/downward source constraint')
        return { index, rho, down }
      })
      return {
        ...entry,
        vertices,
        certificate: {
          authority: 'exact-polynomial-similarity-lift/1' as const,
          formula: 'rho*2SC/N+down*2S^2/N' as const,
          openPhasePositive: true as const,
          endpointZero: true as const,
          scalar: POLYNOMIAL_TRIG_SIGN_CERTIFICATE
        }
      }
    })
  return { bodies, parts, supports, swing }
}
export class WalkingConstrainedCycleOwner {
  private baseMotion: WalkingCycleBaseMotion | undefined
  private constantMotion: WalkingCycleConstantMotion | undefined
  private phaseRootMotions: readonly WalkingCyclePhaseRootMotion[] = []
  private current: WalkingConstrainedCycle | undefined
  private prepared: CyclePrepared | undefined
  private totals = { ...zeroWork(), preparations: 0, evaluations: 0 }
  private onWork = (key: keyof Work, amount: number) => {
    if (key === 'maxBits')
      this.totals.maxBits = Math.max(this.totals.maxBits, amount)
    else this.totals[key] += amount
  }
  get work() {
    return Object.freeze({ ...this.totals })
  }
  read(source: WalkingRobotSource, recipe: WalkingConstrainedCycleRecipe) {
    return this.current?.source === source && this.current.recipe === recipe
      ? this.current
      : undefined
  }
  readBaseMotion(cycle: WalkingConstrainedCycle) {
    return this.current === cycle ? this.baseMotion : undefined
  }
  readConstantMotion(cycle: WalkingConstrainedCycle) {
    return this.current === cycle ? this.constantMotion : undefined
  }
  readPhaseRootMotion(cycle: WalkingConstrainedCycle, phase: number) {
    return this.current === cycle &&
      Number.isInteger(phase) &&
      phase >= 0 &&
      phase < 2
      ? this.phaseRootMotions[phase]
      : undefined
  }
  dispose() {
    this.baseMotion = undefined
    this.constantMotion = undefined
    this.phaseRootMotions = []
    this.current = undefined
    this.prepared = undefined
  }
  prepare(source: WalkingRobotSource, raw: unknown): WalkingConstrainedCycle {
    if (
      this.current &&
      raw === this.current.recipe &&
      source === this.current.source
    )
      return this.current
    this.dispose()
    this.totals.preparations++
    if (
      !raw ||
      typeof raw !== 'object' ||
      !('budget' in raw) ||
      !record(raw.budget, ['maxOperations', 'maxBits']) ||
      !Number.isSafeInteger(raw.budget.maxOperations) ||
      Number(raw.budget.maxOperations) < 1 ||
      Number(raw.budget.maxOperations) > 10000000 ||
      !Number.isSafeInteger(raw.budget.maxBits) ||
      Number(raw.budget.maxBits) < 1 ||
      Number(raw.budget.maxBits) > 24000
    )
      fail('cycle finite budget')
    const work = zeroWork(),
      e = arithmetic(
        {
          maxOperations: Number(raw.budget.maxOperations),
          maxBits: Number(raw.budget.maxBits)
        },
        work,
        this.onWork
      )
    const recipe = admitCycle(source, raw, e),
      prepared = cyclePrepare(recipe, e)
    const phases = [
      cycleGeometry(prepared, 0, e),
      cycleGeometry(prepared, 1, e)
    ]
    const a = e.exact,
      zero = a.literal(0),
      one = a.literal(1)
    const p0 = cyclePointFrames(prepared, 0, zero, e),
      p1 = cyclePointFrames(prepared, 0, one, e),
      q0 = cyclePointFrames(prepared, 1, zero, e),
      q1 = cyclePointFrames(prepared, 1, one, e)
    for (const anchor of recipe.anchors)
      if (
        !equalVector(
          cycleAnchor(anchor.part, anchor.chainId, source, p0, a),
          anchor.anchorOrigin
        )
      )
        fail('cycle initial anchor incompatibility')
    let soleY: ConstrainedFraction | undefined
    for (const anchor of recipe.anchors) {
      const frame = compose(
        a,
        required(p0.get(anchor.part.bodyId)),
        required(prepared.phases[0].template.partFrames.get(anchor.part))
      )
      const vertices = patchVertices(anchor.part, anchor.patch)
      if (vertices.length < 3) fail('cycle incomplete sole')
      for (const index of vertices) {
        const p = plusVector(
          a,
          frame.origin,
          rotate(
            a,
            frame.matrix,
            vector(
              anchor.part.shape.positions
                .slice(index * 3, index * 3 + 3)
                .map(a.literal)
            )
          )
        )
        if (soleY && !equalFraction(soleY, p[1]))
          fail('cycle soles not one level plane')
        soleY = p[1]
      }
    }
    for (const body of source.rig.bodies) {
      const start = required(p0.get(body.id)),
        end = required(q1.get(body.id)),
        left = required(p1.get(body.id)),
        right = required(q0.get(body.id))
      if (
        !equalVector(left.origin, right.origin) ||
        left.matrix.some((row, i) => !equalVector(row, right.matrix[i]))
      )
        fail('cycle exact handoff')
      if (
        !equalVector(
          end.origin,
          plusVector(a, start.origin, prepared.netDisplacement)
        ) ||
        end.matrix.some((row, i) => !equalVector(row, start.matrix[i]))
      )
        fail('cycle periodic net motion')
    }
    // cycleFrames uses this same template matrix for the root at every real
    // parameter; only its shared support-expression origin changes. These
    // locals are the exact same partFrames consumed by evaluate and bound.
    const baseBody = required(
      source.rig.bodies.find((body) => body.id === 'base')
    )
    const rootMatrix = prepared.phases[0].template.base.matrix
    const otherMatrix = prepared.phases[1].template.base.matrix
    if (rootMatrix.some((row, i) => !equalVector(row, otherMatrix[i])))
      fail('cycle base matrix mismatch')
    const minor = (i: number, j: number, k: number, l: number) =>
      a.subtract(
        a.multiply(rootMatrix[i][k], rootMatrix[j][l]),
        a.multiply(rootMatrix[i][l], rootMatrix[j][k])
      )
    const determinant = a.add(
      a.subtract(
        a.multiply(rootMatrix[0][0], minor(1, 2, 1, 2)),
        a.multiply(rootMatrix[0][1], minor(1, 2, 0, 2))
      ),
      a.multiply(rootMatrix[0][2], minor(1, 2, 0, 1))
    )
    if (determinant.numerator <= 0n) fail('cycle singular base matrix')
    const baseParts = source.parts
      .filter((part) => part.bodyId === baseBody.id)
      .map((part) => {
        const local = required(prepared.phases[0].template.partFrames.get(part))
        const other = required(prepared.phases[1].template.partFrames.get(part))
        if (
          !equalVector(local.origin, other.origin) ||
          local.matrix.some((row, i) => !equalVector(row, other.matrix[i]))
        )
          fail('cycle base local mismatch')
        return { part, local }
      })
    // This is the constant branch of cycleFrames, with the root factored out.
    // Dynamic leg bodies are assigned before that branch, so neither they nor
    // descendants depending on them can enter this root-local expression.
    const constantLocals = (
      template: PreparedTemplate,
      includeSupportCoxa = false
    ) => {
      const dynamic = new Set(source.rig.legChains.flatMap((c) => c.bodyIds))
      const locals = new Map<string, ExactFrame>([['base', identity(a)]])
      if (includeSupportCoxa) {
        // cycleFrames assigns exactly this root-local identity-abduction frame
        // to each actual support chain before its constant-parent traversal.
        for (const support of template.supports) {
          const joint = required(
            source.rig.joints.find((j) => j.id === support.chain.jointIds[0])
          )
          locals.set(support.chain.bodyIds[0], {
            matrix: identity(a).matrix,
            origin: vector(joint.frame.position.map(a.literal))
          })
        }
      }
      let advanced = true
      while (advanced) {
        advanced = false
        for (const body of source.rig.bodies) {
          if (locals.has(body.id) || dynamic.has(body.id)) continue
          const parent = body.parentBodyId && locals.get(body.parentBodyId)
          if (!parent) continue
          const local =
            body.attachment === 'fixed'
              ? required(template.bodyFrames.get(body))
              : required(
                  template.fixedFrames.get(
                    required(
                      source.rig.joints.find((j) => j.childBodyId === body.id)
                    )
                  )
                )
          locals.set(body.id, compose(a, parent, local))
          advanced = true
        }
      }
      return locals
    }
    const constants = prepared.phases.map((p) => constantLocals(p.template))
    const constantBodies = source.rig.bodies
      .filter((body) => constants[0].has(body.id))
      .map((body) => {
        const local = required(constants[0].get(body.id)),
          other = required(constants[1].get(body.id))
        if (
          !equalVector(local.origin, other.origin) ||
          local.matrix.some((row, i) => !equalVector(row, other.matrix[i]))
        )
          fail('cycle constant local mismatch')
        return { body, local }
      })
    if (constants[0].size !== constants[1].size)
      fail('cycle constant membership mismatch')
    const constantParts = source.parts
      .filter((part) => constants[0].has(part.bodyId))
      .map((part) => {
        const local = compose(
          a,
          required(constants[0].get(part.bodyId)),
          required(prepared.phases[0].template.partFrames.get(part))
        )
        const other = compose(
          a,
          required(constants[1].get(part.bodyId)),
          required(prepared.phases[1].template.partFrames.get(part))
        )
        if (
          !equalVector(local.origin, other.origin) ||
          local.matrix.some((row, i) => !equalVector(row, other.matrix[i]))
        )
          fail('cycle constant part mismatch')
        return { part, local }
      })
    const phaseLocals = prepared.phases.map(({ template }) => {
      const locals = constantLocals(template, true)
      return {
        bodies: source.rig.bodies
          .filter((body) => locals.has(body.id))
          .map((body) => ({ body, local: required(locals.get(body.id)) })),
        parts: source.parts
          .filter((part) => locals.has(part.bodyId))
          .map((part) => ({
            part,
            local: compose(
              a,
              required(locals.get(part.bodyId)),
              required(template.partFrames.get(part))
            )
          }))
      }
    })
    const product = freeze({
      source,
      recipe,
      phases,
      netDisplacement: prepared.netDisplacement,
      roots: {
        initial: required(p0.get('base')),
        handoff: required(p1.get('base')),
        final: required(q1.get('base'))
      },
      authority: 'exact-polynomial-constrained-cycle/1' as const,
      work: { ...work, unvisited: 0 }
    })
    this.prepared = prepared
    this.current = product
    this.baseMotion = freeze({
      authority: 'cycle-base-common-rigid/1' as const,
      cycle: product,
      source,
      recipe,
      body: baseBody,
      rootExpression: 'cycle-support-root/1' as const,
      phases: [0, 1] as const,
      rootMatrix,
      determinant,
      parts: baseParts
    })
    this.constantMotion = freeze({
      authority: 'cycle-constant-root/1' as const,
      cycle: product,
      source,
      recipe,
      rootExpression: 'cycle-support-root/1' as const,
      phases: [0, 1] as const,
      rootMatrix,
      determinant,
      bodies: constantBodies,
      parts: constantParts
    })
    this.phaseRootMotions = freeze(
      phaseLocals.map((locals, phase) => ({
        authority: 'cycle-phase-root/1' as const,
        cycle: product,
        source,
        recipe,
        phase,
        rootExpression: 'cycle-support-root/1' as const,
        rootMatrix,
        determinant,
        ...locals
      }))
    )
    return product
  }
  bound(cycle: WalkingConstrainedCycle, phase: number, raw: unknown) {
    if (
      this.current !== cycle ||
      !this.prepared ||
      !Number.isInteger(phase) ||
      phase < 0 ||
      phase > 1
    )
      fail('cycle stale bound or phase')
    const work = zeroWork(),
      e = arithmetic(cycle.recipe.budget, work, this.onWork)
    if (!record(raw, ['low', 'high'])) fail('cycle parameter interval')
    const parameter = freeze({
      low: cycleParameter(raw.low, e),
      high: cycleParameter(raw.high, e)
    })
    if (cycleCompare(parameter.low, parameter.high, e) > 0)
      fail('cycle reversed parameter interval')
    const result = cycleGeometry(this.prepared, phase, e, parameter)
    return freeze({
      cycle,
      source: cycle.source,
      recipe: cycle.recipe,
      phase,
      parameter,
      ...result,
      work: { ...work, unvisited: 0 }
    })
  }
  evaluate(
    cycle: WalkingConstrainedCycle,
    phase: number,
    u: ConstrainedFraction
  ) {
    if (
      this.current !== cycle ||
      !this.prepared ||
      !Number.isInteger(phase) ||
      phase < 0 ||
      phase > 1
    )
      fail('cycle stale handle or phase')
    this.totals.evaluations++
    const work = zeroWork(),
      e = arithmetic(cycle.recipe.budget, work, this.onWork),
      a = e.exact
    if (
      !record(u, ['numerator', 'denominator']) ||
      typeof u.numerator !== 'bigint' ||
      typeof u.denominator !== 'bigint' ||
      u.denominator <= 0n
    )
      fail('cycle point rational')
    const value = e.fraction(u.numerator, u.denominator)
    if (
      !equalFraction(value, u) ||
      value.numerator < 0n ||
      cycleCompare(value, a.literal(1), e) > 0
    )
      fail('cycle point domain')
    const computed = cyclePointFrames(this.prepared, phase, value, e)
    const display = (frame: ExactFrame) => ({
      origin: vector(
        frame.origin.map((v) =>
          roundFraction(v.numerator, v.denominator, 'nearest-even')
        )
      ),
      matrix: matrix(
        frame.matrix.map((row) =>
          vector(
            row.map((v) =>
              roundFraction(v.numerator, v.denominator, 'nearest-even')
            )
          )
        )
      )
    })
    return freeze({
      cycle,
      source: cycle.source,
      recipe: cycle.recipe,
      phase,
      u: value,
      bodies: cycle.source.rig.bodies.map((body) => {
        const exact = required(computed.get(body.id))
        return { body, exact, display: display(exact) }
      }),
      parts: cycle.source.parts.map((part) => ({
        part,
        exact: compose(
          a,
          required(computed.get(part.bodyId)),
          required(this.prepared?.phases[phase].template.partFrames.get(part))
        )
      })),
      work: { ...work, unvisited: 0 }
    })
  }
}
export interface WalkingCyclePhaseRootMotion extends Omit<
  WalkingCycleConstantMotion,
  'authority' | 'phases'
> {
  readonly authority: 'cycle-phase-root/1'
  readonly phase: number
}
export interface WalkingCycleConstantMotion {
  readonly authority: 'cycle-constant-root/1'
  readonly cycle: WalkingConstrainedCycle
  readonly source: WalkingRobotSource
  readonly recipe: WalkingConstrainedCycleRecipe
  readonly rootExpression: 'cycle-support-root/1'
  readonly phases: readonly [0, 1]
  readonly rootMatrix: ExactFrame['matrix']
  readonly determinant: ConstrainedFraction
  readonly bodies: readonly Readonly<{
    body: WalkingRobotBody
    local: ExactFrame
  }>[]
  readonly parts: readonly Readonly<{
    part: WalkingRobotPart
    local: ExactFrame
  }>[]
}
export interface WalkingCycleBaseMotion {
  readonly authority: 'cycle-base-common-rigid/1'
  readonly cycle: WalkingConstrainedCycle
  readonly source: WalkingRobotSource
  readonly recipe: WalkingConstrainedCycleRecipe
  readonly body: WalkingRobotBody
  readonly rootExpression: 'cycle-support-root/1'
  readonly phases: readonly [0, 1]
  readonly rootMatrix: ExactFrame['matrix']
  readonly determinant: ConstrainedFraction
  readonly parts: readonly Readonly<{
    part: WalkingRobotPart
    local: ExactFrame
  }>[]
}
export interface WalkingConstrainedCycle {
  readonly source: WalkingRobotSource
  readonly recipe: WalkingConstrainedCycleRecipe
  readonly phases: readonly ReturnType<typeof cycleGeometry>[]
  readonly netDisplacement: ConstrainedVector<ConstrainedFraction>
  readonly roots: Readonly<{
    initial: ExactFrame
    handoff: ExactFrame
    final: ExactFrame
  }>
  readonly authority: 'exact-polynomial-constrained-cycle/1'
  readonly work: Readonly<Work & { unvisited: number }>
}

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

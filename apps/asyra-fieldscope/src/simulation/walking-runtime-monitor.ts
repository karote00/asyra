import type { WalkingRobotSource } from '../domain/walking-robot-source'
import type {
  WalkingConstrainedCycle,
  WalkingConstrainedCycleOwner
} from '../domain/walking-constrained-kinematics'
import type { WalkingOperatingReport } from '../runtime/walking-operating-workspace'
import {
  interval,
  add,
  subtract,
  multiply,
  divide,
  squareRoot,
  type Interval
} from '../domain/scalar-arithmetic'

export interface WalkingRuntimeMonitorProfile {
  readonly format: 'walking-runtime-monitor-profile/1'
  readonly id: string
  readonly assumption: string
  readonly validFrom: number
  readonly validUntil: number
  readonly limits: Readonly<{
    maxTiltRadians: number
    maxAngularRateRadiansPerSecond: number
    minContactForce: number
    maxContactForce: number
    maxSampleGap: number
  }>
  readonly uncertainty: Readonly<{
    orientationRadians: number
    contactForce: number
  }>
}
type ActiveReport = Exclude<WalkingOperatingReport, { status: 'legacy-view' }>
export interface WalkingRuntimeMonitorContext {
  readonly source: WalkingRobotSource
  readonly load: ActiveReport['load']
  readonly massProperties: WalkingRobotSource['massProperties']
  readonly cycleOwner: WalkingConstrainedCycleOwner
  readonly cycle: WalkingConstrainedCycle
  readonly phase: number
  readonly now: number
}
export interface WalkingRuntimeMonitorSample {
  readonly format: 'synthetic-walking-runtime-sample/1'
  readonly assumption: string
  readonly orientations: readonly {
    readonly at: number
    readonly rotation: readonly [number, number, number, number]
  }[]
  readonly contacts: readonly {
    readonly part: WalkingConstrainedCycle['recipe']['anchors'][number]['part']
    readonly patch: WalkingConstrainedCycle['recipe']['anchors'][number]['patch']
    readonly force: Interval
  }[]
}
export interface WalkingRuntimeMonitor {
  readonly format: 'walking-runtime-monitor/1'
  readonly identity: Readonly<object>
  readonly source: WalkingRobotSource
  readonly load: ActiveReport['load']
  readonly massProperties: WalkingRobotSource['massProperties']
  readonly cycle: WalkingConstrainedCycle
  readonly phase: number
  readonly profile: WalkingRuntimeMonitorProfile | undefined
  readonly observedAt: number
  readonly status: 'within-synthetic-profile' | 'hold' | 'unknown'
  readonly values: Readonly<{
    tilt: Interval
    angularRate: Interval
    contacts: readonly {
      part: WalkingRuntimeMonitorSample['contacts'][number]['part']
      patch: WalkingRuntimeMonitorSample['contacts'][number]['patch']
      force: Interval
    }[]
  }>
  readonly reasons: readonly string[]
  readonly work: Readonly<{
    orientationSamples: number
    stanceContacts: number
    arithmeticOperations: number
    farmVisits: number
    geometryVisits: number
  }>
}
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim()
const finite = (v: number) => Number.isFinite(v)
function keys(v: object, expected: readonly string[]) {
  if (
    !v ||
    typeof v !== 'object' ||
    Array.isArray(v) ||
    Object.keys(v).length !== expected.length ||
    Object.keys(v).some((k) => !expected.includes(k))
  )
    throw new Error('invalid-monitor-fields')
}
function freeze<T>(v: T): T {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.values(v).forEach(freeze)
    Object.freeze(v)
  }
  return v
}
function readProfile(
  raw: WalkingRuntimeMonitorProfile
): WalkingRuntimeMonitorProfile {
  const p = structuredClone(raw)
  keys(p, [
    'format',
    'id',
    'assumption',
    'validFrom',
    'validUntil',
    'limits',
    'uncertainty'
  ])
  keys(p.limits, [
    'maxTiltRadians',
    'maxAngularRateRadiansPerSecond',
    'minContactForce',
    'maxContactForce',
    'maxSampleGap'
  ])
  keys(p.uncertainty, ['orientationRadians', 'contactForce'])
  if (
    p.format !== 'walking-runtime-monitor-profile/1' ||
    !text(p.id) ||
    !text(p.assumption) ||
    !finite(p.validFrom) ||
    p.validFrom < 0 ||
    !finite(p.validUntil) ||
    p.validUntil <= p.validFrom ||
    !Object.values(p.limits).every((v) => finite(v) && v >= 0) ||
    p.limits.maxTiltRadians <= 0 ||
    p.limits.maxAngularRateRadiansPerSecond <= 0 ||
    p.limits.maxContactForce <= p.limits.minContactForce ||
    p.limits.maxSampleGap <= 0 ||
    !Object.values(p.uncertainty).every((v) => finite(v) && v >= 0)
  )
    throw new Error('invalid-synthetic-monitor-profile')
  return freeze(p)
}

/** Bounded synthetic sensor evidence only; no terrain or physical fall certificate. */
export class WalkingRuntimeMonitorOwner {
  private profile?: WalkingRuntimeMonitorProfile
  private latest?: WalkingRuntimeMonitor
  private closed = false
  constructor(
    private readonly isCurrentContext: (
      context: WalkingRuntimeMonitorContext
    ) => boolean
  ) {}
  private current(context: WalkingRuntimeMonitorContext) {
    return (
      !this.closed &&
      this.isCurrentContext(context) &&
      context.source === context.cycle.source &&
      context.massProperties === context.source.massProperties &&
      context.cycleOwner.read(context.source, context.cycle.recipe) ===
        context.cycle &&
      Number.isInteger(context.phase) &&
      context.phase >= 0 &&
      context.phase < 2 &&
      finite(context.now) &&
      context.now >= 0
    )
  }
  configure(raw: WalkingRuntimeMonitorProfile) {
    if (this.closed) throw new Error('Walking runtime monitor is closed')
    this.profile = readProfile(raw)
    this.latest = undefined
  }
  read(context: WalkingRuntimeMonitorContext, result: WalkingRuntimeMonitor) {
    return this.latest === result &&
      this.current(context) &&
      result.source === context.source &&
      result.load === context.load &&
      result.massProperties === context.massProperties &&
      result.cycle === context.cycle &&
      result.phase === context.phase &&
      result.observedAt === context.now &&
      result.profile === this.profile
      ? result
      : undefined
  }
  evaluate(
    context: WalkingRuntimeMonitorContext,
    raw: WalkingRuntimeMonitorSample
  ): WalkingRuntimeMonitor {
    if (this.closed) throw new Error('Walking runtime monitor is closed')
    const work = {
      orientationSamples: 0,
      stanceContacts: 0,
      arithmeticOperations: 0,
      farmVisits: 0,
      geometryVisits: 0
    }
    const reasons: string[] = []
    const values: {
      tilt: Interval
      angularRate: Interval
      contacts: {
        part: WalkingRuntimeMonitorSample['contacts'][number]['part']
        patch: WalkingRuntimeMonitorSample['contacts'][number]['patch']
        force: Interval
      }[]
    } = {
      tilt: { low: 0, high: Infinity },
      angularRate: { low: 0, high: Infinity },
      contacts: []
    }
    let status: WalkingRuntimeMonitor['status'] = 'unknown'
    const p = this.profile
    const op = <T extends unknown[]>(
      fn: (...args: T) => Interval,
      ...args: T
    ) => {
      work.arithmeticOperations++
      return fn(...args)
    }
    const plus = (a: Interval, b: Interval) => op(add, a, b)
    const minus = (a: Interval, b: Interval) => op(subtract, a, b)
    const times = (a: Interval, b: Interval) => op(multiply, a, b)
    const over = (a: Interval, b: Interval) => op(divide, a, b)
    const root = (v: Interval) =>
      op(squareRoot, { low: Math.max(0, v.low), high: Math.max(0, v.high) })
    const squared = (v: Interval) => {
      const result = times(v, v)
      return { low: Math.max(0, result.low), high: result.high }
    }
    try {
      if (!this.current(context))
        throw new Error('stale-monitor-source-load-or-cycle')
      if (!p) throw new Error('missing-synthetic-monitor-profile')
      if (context.now < p.validFrom || context.now >= p.validUntil)
        throw new Error('expired-synthetic-monitor-profile')
      keys(raw, ['format', 'assumption', 'orientations', 'contacts'])
      if (
        raw.format !== 'synthetic-walking-runtime-sample/1' ||
        !text(raw.assumption) ||
        !Array.isArray(raw.orientations) ||
        raw.orientations.length !== 2
      )
        throw new Error('missing-orientation-samples')
      const samples = raw.orientations.map((sample) => {
        work.orientationSamples++
        keys(sample, ['at', 'rotation'])
        const at = sample.at,
          q: unknown[] = Array.from(sample.rotation)
        if (
          !finite(at) ||
          at < p.validFrom ||
          at >= p.validUntil ||
          q.length !== 4 ||
          !q.every(
            (value): value is number =>
              typeof value === 'number' && finite(value)
          ) ||
          Math.abs(Math.hypot(...q) - 1) > 64 * Number.EPSILON
        )
          throw new Error('invalid-orientation-sample')
        const coordinates = q.map(interval)
        const norm = coordinates.reduce(
          (sum, v) => plus(sum, squared(v)),
          interval(0)
        )
        if (norm.low <= 0) throw new Error('unknown-orientation-norm')
        return { at, coordinates, norm }
      })
      const [first, last] = samples
      const elapsed = minus(interval(last.at), interval(first.at))
      if (
        last.at !== context.now ||
        elapsed.low <= 0 ||
        elapsed.high > p.limits.maxSampleGap
      )
        throw new Error('orientation-time-gap')
      // For theta in [0, pi], theta <= pi*sin(theta/2) < 4*sin(theta/2).
      // Quaternion norms are retained in the arithmetic, including sensor rounding.
      const tiltSine = root(
        over(
          plus(squared(last.coordinates[0]), squared(last.coordinates[2])),
          last.norm
        )
      )
      values.tilt = {
        low: 0,
        high: plus(
          times(interval(4), tiltSine),
          interval(p.uncertainty.orientationRadians)
        ).high
      }
      const dot = first.coordinates.reduce(
        (sum, v, i) => plus(sum, times(v, last.coordinates[i])),
        interval(0)
      )
      const relativeSine = root(
        minus(interval(1), over(squared(dot), times(first.norm, last.norm)))
      )
      const angle = plus(
        times(interval(4), relativeSine),
        times(interval(2), interval(p.uncertainty.orientationRadians))
      )
      values.angularRate = { low: 0, high: over(angle, elapsed).high }
      const support = context.cycle.recipe.groups[context.phase]
      if (
        !Array.isArray(raw.contacts) ||
        raw.contacts.length !== 3 ||
        support.length !== 3
      )
        throw new Error('missing-stance-contacts')
      const matched = new Set<string>()
      for (const sample of raw.contacts) {
        work.stanceContacts++
        keys(sample, ['part', 'patch', 'force'])
        keys(sample.force, ['low', 'high'])
        const anchor = context.cycle.recipe.anchors.find(
          (a) =>
            a.part === sample.part &&
            a.patch === sample.patch &&
            support.includes(a.chainId)
        )
        if (!anchor || matched.has(anchor.chainId))
          throw new Error('foreign-or-duplicate-stance-contact')
        matched.add(anchor.chainId)
        const force = { low: sample.force.low, high: sample.force.high }
        if (!finite(force.low) || !finite(force.high) || force.low > force.high)
          throw new Error('invalid-contact-force')
        values.contacts.push({
          part: anchor.part,
          patch: anchor.patch,
          force: plus(force, {
            low: -p.uncertainty.contactForce,
            high: p.uncertainty.contactForce
          })
        })
      }
      if (!finite(values.tilt.high) || !finite(values.angularRate.high))
        throw new Error('unresolved-monitor-arithmetic')
      if (values.tilt.high > p.limits.maxTiltRadians)
        reasons.push('synthetic-tilt-bound-not-within-profile')
      if (values.angularRate.high > p.limits.maxAngularRateRadiansPerSecond)
        reasons.push('synthetic-rate-bound-not-within-profile')
      if (
        values.contacts.some(
          (c) =>
            c.force.low <= 0 ||
            c.force.low < p.limits.minContactForce ||
            c.force.high > p.limits.maxContactForce
        )
      )
        reasons.push('synthetic-contact-force-not-within-profile')
      status = reasons.length ? 'hold' : 'within-synthetic-profile'
    } catch (error) {
      reasons.push(
        error instanceof Error ? error.message : 'unknown-monitor-input'
      )
    }
    const result: WalkingRuntimeMonitor = Object.freeze({
      format: 'walking-runtime-monitor/1',
      identity: Object.freeze({}),
      source: context.source,
      load: context.load,
      massProperties: context.massProperties,
      cycle: context.cycle,
      phase: context.phase,
      profile: p,
      observedAt: context.now,
      status,
      values: freeze(values),
      reasons: Object.freeze(reasons),
      work: Object.freeze(work)
    })
    this.latest = result
    return result
  }
  close() {
    this.closed = true
    this.latest = undefined
    this.profile = undefined
  }
}

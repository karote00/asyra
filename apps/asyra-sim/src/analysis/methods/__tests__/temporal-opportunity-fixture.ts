import { vi } from 'vitest'
import * as kinematics from '../../../domain/kinematic-algebra'
import type { Interval } from '../../../domain/interval'
import * as membership from '../mesh-membership'
import * as convex from '../convex-query'
import type { StaticSampler, StaticSampleOrigin } from '../fresh-static-sampler'
import type { PairEvidence } from '../continuous-query'
import { OriginalMeshQuery } from '../original-mesh-query'

export type ChargeRange = readonly [number, number]
export interface QueryReceipt {
  id: number
  pair: string
  kind: 'distance' | 'lowerOver' | 'source' | 'handoff' | 'derivation'
  charges: ChargeRange
  segment?: number
  time?: Interval
  origin?: Omit<StaticSampleOrigin, 'node'> & { node: number }
  geometry?: readonly number[]
  status: 'running' | 'complete' | 'thrown'
  result?: number | convex.DistanceEvidence
  preparation: ChargeRange[]
  traversal: boolean
  membership: number
  inside: boolean
  convexCalls: number
  milliseconds: number
  exit?: string
}

/** No property trap: the original publication function and opaque handles survive. */
export function observeSampler(
  sample: StaticSampler,
  around: (
    origin: StaticSampleOrigin,
    call: () => ReturnType<StaticSampler>
  ) => ReturnType<StaticSampler>
): StaticSampler {
  return new Proxy(sample, {
    apply(target, receiver, args: Parameters<StaticSampler>) {
      return around(args[2], () => Reflect.apply(target, receiver, args))
    }
  })
}

/** Range [a,b] denotes actual charged event ordinals a+1 through b. */
export function chargeUnion(
  ranges: readonly ChargeRange[],
  retained: readonly ChargeRange[] = []
): ChargeRange[] {
  const merge = (input: readonly ChargeRange[]) => {
    const out: [number, number][] = []
    for (const [a, b] of [...input].sort((x, y) => x[0] - y[0])) {
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < a)
        throw new Error('Invalid charged event range')
      if (a === b) continue
      const last = out.at(-1)
      if (last && a <= last[1]) last[1] = Math.max(last[1], b)
      else out.push([a, b])
    }
    return out
  }
  let result = merge(ranges)
  for (const [lo, hi] of merge(retained)) {
    const next: [number, number][] = []
    for (const [a, b] of result) {
      if (b <= lo || a >= hi) next.push([a, b])
      else {
        if (a < lo) next.push([a, lo])
        if (b > hi) next.push([hi, b])
      }
    }
    result = next
  }
  return result
}
export const chargeCount = (ranges: readonly ChargeRange[]) =>
  ranges.reduce((n, [a, b]) => n + b - a, 0)

export function rootOpportunity(
  pair: string,
  segment: number,
  interval: Interval,
  evidence: PairEvidence,
  rows: readonly QueryReceipt[],
  threshold: number
) {
  const [start, end] = interval
  const leaves = evidence.leaves.filter((l) => l.start < end && l.end > start)
  let cursor = start
  const complete =
    leaves.length > 0 &&
    leaves.every((l) => {
      const covers =
        l.start === cursor &&
        l.start >= start &&
        l.end <= end &&
        l.end > l.start
      cursor = l.end
      return (
        covers && l.state === 'clear' && l.lower > threshold && !l.penetration
      )
    }) &&
    cursor === end
  const owned = rows.filter((r) => r.pair === pair && r.segment === segment)
  const first = owned.find(
    (r) =>
      r.kind === 'distance' &&
      r.origin?.originalRoot === true &&
      r.origin.start === start &&
      r.origin.end === end &&
      r.origin.time === start
  )
  const witness = first?.result
  const initial = owned.find(
    (r) => r.kind === 'lowerOver' && r.time?.[0] === start && r.time[1] === end
  )
  if (
    !complete ||
    !first ||
    first.status !== 'complete' ||
    typeof witness !== 'object' ||
    witness.penetration ||
    !Number.isFinite(witness.upper) ||
    !Number.isFinite(witness.lower) ||
    [...witness.witnessA, ...witness.witnessB].some(
      ([lo, hi]) => !Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi
    ) ||
    witness.lower < 0 ||
    witness.upper < witness.lower ||
    !initial ||
    initial.status !== 'complete' ||
    typeof initial.result !== 'number'
  )
    return {
      eligible: false,
      ranges: [] as ChargeRange[],
      gross: 0,
      initialClear: false
    }
  const suffix = owned.filter(
    (r) =>
      (r.kind === 'distance' || r.kind === 'lowerOver') &&
      r.status === 'complete' &&
      r.charges[0] >= first.charges[1] &&
      r.time &&
      r.time[0] >= start &&
      r.time[1] <= end
  )
  // Preparation remains paid even if first demanded inside a removable child.
  // Source/handoff/derivation are absent from suffix and always retained.
  const ranges = chargeUnion(
    suffix.map((r) => r.charges),
    owned.flatMap((r) => r.preparation)
  )
  return {
    eligible: true,
    ranges,
    gross: chargeCount(ranges),
    initialClear:
      typeof initial.result === 'number' && initial.result > threshold,
    firstQueryId: first.id,
    firstWitness: witness,
    firstWitnessTime: start,
    initialQueryId: initial.id,
    initialLower: initial.result,
    leaves: leaves.length
  }
}

/** One invocation's passive observer. No geometry computation or budget mutation. */
export class OpportunityCensus {
  readonly rows: QueryReceipt[] = []
  pair = ''
  private current: QueryReceipt | undefined
  private origin: StaticSampleOrigin | undefined
  private temporal: { segment: number; time: Interval } | undefined
  private readonly identities = new WeakMap<object, number>()
  private nextIdentity = 0
  private identity(value: object) {
    let id = this.identities.get(value)
    if (id === undefined) {
      id = ++this.nextIdentity
      this.identities.set(value, id)
    }
    return id
  }
  constructor(readonly context: OriginalMeshQuery) {
    const interpolate = kinematics.interpolateSegment
    vi.spyOn(kinematics, 'interpolateSegment').mockImplementation((...args) => {
      const value = interpolate(...args)
      if (args[3] === kinematics.intervalAlgebra) {
        const time = args[2]
        if (!Array.isArray(time) || time.length !== 2)
          throw new Error('Missing canonical interval time')
        this.temporal = { segment: args[1], time: time as unknown as Interval }
      }
      return value
    })
    const make = context.createStaticSampler.bind(context)
    context.createStaticSampler = (settings) =>
      observeSampler(make(settings), (origin, call) => {
        const previous = this.origin
        this.origin = origin
        try {
          return call()
        } finally {
          this.origin = previous
        }
      })
    const distance = context.distance.bind(context),
      lower = context.lowerOver.bind(context)
    context.distance = (...args) =>
      this.query('distance', args[0], args[1], () =>
        distance(...args)
      ) as convex.DistanceEvidence
    context.lowerOver = (...args) =>
      this.query('lowerOver', args[0], args[1], () => lower(...args)) as number
    for (const [name, kind] of [
      ['chargeSourceWitness', 'source'],
      ['chargeEvidenceHandoff', 'handoff'],
      ['chargeEvidenceDerivation', 'derivation']
    ] as const) {
      const call = context[name].bind(context)
      context[name] = () => {
        this.query(kind, undefined, undefined, call)
      }
    }
    // Test-owned instrumentation of the existing demand boundary, including cache hits.
    const owner = context as unknown as {
      traversalIndex: (...args: unknown[]) => unknown
      index: (...args: unknown[]) => unknown
    }
    const traversal = owner.traversalIndex.bind(context)
    owner.traversalIndex = (...args) => {
      if (this.current) this.current.traversal = true
      return this.prepare(() => traversal(...args))
    }
    const index = owner.index.bind(context)
    owner.index = (...args) => this.prepare(() => index(...args))
    const member = membership.shapeMembership
    vi.spyOn(membership, 'shapeMembership').mockImplementation((...args) => {
      if (this.current) this.current.membership++
      const value = member(...args)
      if (this.current && value === 'inside') this.current.inside = true
      return value
    })
    const solve = convex.convexDistance
    vi.spyOn(convex, 'convexDistance').mockImplementation((...args) => {
      if (this.current) this.current.convexCalls++
      return solve(...args)
    })
  }
  private prepare<T>(call: () => T): T {
    const before = this.context.work
    try {
      return call()
    } finally {
      if (this.context.work > before)
        this.current?.preparation.push([before, this.context.work])
    }
  }
  private query(
    kind: QueryReceipt['kind'],
    a: convex.ConvexShape | undefined,
    b: convex.ConvexShape | undefined,
    call: () => unknown
  ): unknown {
    const isStatic = kind === 'distance',
      isGeometry = isStatic || kind === 'lowerOver'
    if (isStatic && !this.origin)
      throw new Error('Missing actual sampler origin')
    if (kind === 'lowerOver' && !this.temporal)
      throw new Error('Missing canonical interval origin')
    const before = this.context.work,
      started = performance.now()
    const row: QueryReceipt = {
      id: this.rows.length,
      pair: this.pair,
      kind,
      charges: [before, before],
      ...(isStatic && this.origin
        ? {
            segment: this.origin.segment,
            time: [this.origin.time, this.origin.time] as Interval,
            origin: { ...this.origin, node: this.identity(this.origin.node) }
          }
        : {}),
      ...(kind === 'lowerOver' ? this.temporal : {}),
      ...(a && b
        ? { geometry: [this.identity(a.geometry), this.identity(b.geometry)] }
        : {}),
      status: 'running',
      preparation: [],
      traversal: false,
      membership: 0,
      inside: false,
      convexCalls: 0,
      milliseconds: 0
    }
    this.rows.push(row)
    const parent = this.current
    this.current = row
    try {
      const result = call()
      row.status = 'complete'
      if (isGeometry) row.result = result as QueryReceipt['result']
      row.exit = 'before-traversal'
      if (row.traversal) row.exit = 'traversal'
      if (row.inside) row.exit = 'membership-penetration'
      if (!isGeometry) row.exit = kind
      return result
    } catch (error) {
      row.status = 'thrown'
      row.exit = row.traversal ? 'traversal-thrown' : 'before-traversal-thrown'
      throw error
    } finally {
      row.charges = [before, this.context.work]
      row.milliseconds = performance.now() - started
      this.current = parent
    }
  }
}

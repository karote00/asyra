import {
  EXPERIMENT_RESOURCE_PROFILE,
  type ExperimentSnapshot
} from '../contracts'
import { measureWorkerPayload } from '../worker-protocol'
import { LIVE_LIMITS, type LiveSample } from './protocol'
import type {
  MethodEvidence,
  MethodPairEvidence
} from '../../extensions/contracts'

const EMPTY_RECORDS: readonly LiveSample[] = Object.freeze([])

function sameMethodPairs(
  left: readonly MethodPairEvidence[],
  right: readonly MethodPairEvidence[]
) {
  return (
    left.length === right.length &&
    left.every((pair, index) => {
      const other = right[index]
      if (!other || pair.pairId !== other.pairId) return false
      const a = pair.evidence
      const b = other.evidence
      return (
        a.lower === b.lower &&
        a.upper === b.upper &&
        a.coverage === b.coverage &&
        a.evaluations === b.evaluations &&
        a.leaves.length === b.leaves.length &&
        a.leaves.every((leaf, leafIndex) => {
          const candidate = b.leaves[leafIndex]
          return (
            candidate !== undefined &&
            leaf.start === candidate.start &&
            leaf.end === candidate.end &&
            leaf.lower === candidate.lower &&
            leaf.upper === candidate.upper &&
            leaf.witnessTime === candidate.witnessTime &&
            leaf.penetration === candidate.penetration &&
            leaf.state === candidate.state &&
            leaf.reason === candidate.reason
          )
        })
      )
    })
  )
}

function sameLiveSample(left: LiveSample, right: LiveSample) {
  return (
    left.time === right.time &&
    left.totalPairCount === right.totalPairCount &&
    left.complete === right.complete &&
    left.error === right.error &&
    sameMethodPairs(left.pairs, right.pairs)
  )
}

function provenStateAt(
  pairs: readonly MethodPairEvidence[],
  pairId: string,
  time: number
) {
  const pair = pairs.find((item) => item.pairId === pairId)
  if (!pair) return null

  const states = new Set<string>()
  for (const leaf of pair.evidence.leaves) {
    if (leaf.start > time || time > leaf.end) continue
    if (leaf.state === 'clear') states.add('clear')
    if (leaf.state === 'finding' && leaf.witnessTime === time)
      states.add(`finding:${leaf.penetration}`)
  }
  if (states.size > 1) return 'conflict'
  return states.values().next().value ?? null
}

function hasProof(pair: MethodPairEvidence, time: number) {
  const state = provenStateAt([pair], pair.pairId, time)
  return state !== null && state !== 'conflict'
}

function assertBoundaryAgreement(
  accepted: readonly MethodPairEvidence[],
  incoming: readonly MethodPairEvidence[],
  time: number
) {
  const ids = new Set([
    ...accepted.map((pair) => pair.pairId),
    ...incoming.map((pair) => pair.pairId)
  ])
  for (const pairId of ids) {
    const oldState = provenStateAt(accepted, pairId, time)
    const newState = provenStateAt(incoming, pairId, time)
    if (
      oldState === 'conflict' ||
      newState === 'conflict' ||
      (oldState !== null && newState !== null && oldState !== newState)
    )
      throw new Error(
        'Conflicting live interval evidence at an adjacent boundary'
      )
  }
}

/** Analysis-owned, bounded observations for one exact admitted input lifetime. */
export class LiveEvidenceRecords {
  private input: ExperimentSnapshot | null = null
  private key: string | null = null
  private readonly samples = new Map<
    number,
    { sample: LiveSample; bytes: number }
  >()
  private readonly intervals = new Map<
    string,
    {
      start: number
      end: number
      pairs: readonly MethodPairEvidence[]
      bytes: number
    }
  >()
  private bytes = 0
  private intervalBytes = 0
  private intervalLeaves = 0
  private evidenceRevision = 0
  private projection: {
    time: number
    revision: number
    exact: LiveSample | undefined
    sample: LiveSample
  } | null = null
  private values: readonly LiveSample[] = EMPTY_RECORDS

  getAll = (key?: string) =>
    key === undefined || key === this.key ? this.values : EMPTY_RECORDS

  getInput(key: string) {
    return this.key === key ? this.input : null
  }

  owns(input: ExperimentSnapshot) {
    return this.input === input
  }

  replace(input: ExperimentSnapshot | null, key: string | null = null) {
    const changed = this.values.length > 0

    this.input = input
    this.key = key
    this.samples.clear()
    this.intervals.clear()
    this.bytes = 0
    this.intervalBytes = 0
    this.intervalLeaves = 0
    this.evidenceRevision++
    this.projection = null
    this.values = EMPTY_RECORDS

    return changed
  }

  get(time: number) {
    return this.samples.get(time)?.sample
  }

  getAt(time: number): LiveSample | undefined {
    const exact = this.get(time)
    if (
      this.projection?.time === time &&
      this.projection.revision === this.evidenceRevision &&
      this.projection.exact === exact
    )
      return this.projection.sample
    const intervalPairs = this.evidenceAt(time)
    if (!this.input || (!exact && !intervalPairs.length)) return exact

    const pairsById = new Map(exact?.pairs.map((pair) => [pair.pairId, pair]))
    let usedIntervalEvidence = false
    for (const pair of intervalPairs) {
      const existing = pairsById.get(pair.pairId)
      if (existing && hasProof(existing, time)) continue
      pairsById.set(pair.pairId, pair)
      usedIntervalEvidence = true
    }
    const pairs = [...pairsById.values()]
    const complete = this.input.pairs.every((expected) => {
      const pair = pairsById.get(expected.id)
      return pair !== undefined && hasProof(pair, time)
    })

    if (
      exact &&
      pairs.length === exact.pairs.length &&
      pairs.every((pair, index) => pair === exact.pairs[index]) &&
      complete === exact.complete
    )
      return exact

    const sample = Object.freeze({
      time,
      pairs,
      totalPairCount: this.input.pairs.length,
      complete,
      ...(usedIntervalEvidence ? { evidenceOrigin: 'interval' as const } : {}),
      error: complete
        ? null
        : (exact?.error ?? 'Uncertified pairs remain unknown.')
    })
    this.projection = {
      time,
      revision: this.evidenceRevision,
      exact,
      sample
    }
    return sample
  }

  evidenceAt(time: number): readonly MethodPairEvidence[] {
    const grouped = new Map<string, MethodPairEvidence[]>()

    for (const interval of this.intervals.values()) {
      if (time < interval.start || time > interval.end) continue

      for (const pair of interval.pairs) {
        const leaves = pair.evidence.leaves.filter(
          (leaf) =>
            leaf.start <= time &&
            time <= leaf.end &&
            (leaf.state === 'clear' ||
              (leaf.state === 'finding' && leaf.witnessTime === time))
        )
        if (!leaves.length) continue

        const current = grouped.get(pair.pairId) ?? []
        current.push({
          pairId: pair.pairId,
          evidence: {
            leaves,
            lower: Math.min(...leaves.map((leaf) => leaf.lower)),
            upper: leaves.every((leaf) => leaf.upper !== null)
              ? Math.min(...leaves.map((leaf) => leaf.upper as number))
              : null,
            coverage: leaves.every((leaf) => leaf.state !== 'unresolved')
              ? 'complete'
              : 'partial',
            evaluations: pair.evidence.evaluations
          }
        })
        grouped.set(pair.pairId, current)
      }
    }

    return [...grouped.values()].map((values) => ({
      pairId: values[0].pairId,
      evidence: {
        leaves: values.flatMap((value) => value.evidence.leaves),
        lower: Math.min(...values.map((value) => value.evidence.lower)),
        upper: values.every((value) => value.evidence.upper !== null)
          ? Math.min(...values.map((value) => value.evidence.upper as number))
          : null,
        coverage: values.every(
          (value) => value.evidence.coverage === 'complete'
        )
          ? 'complete'
          : 'partial',
        evaluations: values.reduce(
          (total, value) => total + value.evidence.evaluations,
          0
        )
      }
    }))
  }

  recordInterval(
    input: ExperimentSnapshot,
    range: readonly [number, number],
    evidence: MethodEvidence
  ) {
    if (!this.owns(input))
      throw new Error('Retired live input cannot record interval evidence')
    const [start, end] = range
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start >= end ||
      start < input.interval[0] ||
      end > input.interval[1] ||
      evidence.snapshotId !== input.snapshotId ||
      evidence.method.id !== input.method.id ||
      evidence.method.version !== input.method.version
    )
      throw new Error('Interval evidence does not match its admitted input')

    const key = `${start}:${end}`
    const previous = this.intervals.get(key)
    if (previous) {
      if (!sameMethodPairs(previous.pairs, evidence.pairs))
        throw new Error('Conflicting live interval evidence for the same gap')
      return false
    }

    const bytes = measureWorkerPayload(evidence)

    for (const pair of evidence.pairs) {
      const boundaries = new Set(
        pair.evidence.leaves.flatMap((leaf) => [leaf.start, leaf.end])
      )
      for (const time of boundaries)
        if (provenStateAt([pair], pair.pairId, time) === 'conflict')
          throw new Error('Conflicting live interval evidence within a pair')
    }

    for (const interval of this.intervals.values()) {
      if (start < interval.end && interval.start < end)
        throw new Error('Live interval evidence overlaps an accepted interval')
      if (interval.end === start)
        assertBoundaryAgreement(interval.pairs, evidence.pairs, start)
      else if (interval.start === end)
        assertBoundaryAgreement(interval.pairs, evidence.pairs, end)
    }

    for (const [time, point] of this.samples)
      if (start <= time && time <= end)
        assertBoundaryAgreement(point.sample.pairs, evidence.pairs, time)

    const leaves = evidence.pairs.reduce(
      (total, pair) => total + pair.evidence.leaves.length,
      0
    )
    if (
      this.intervals.size >= LIVE_LIMITS.maxBackgroundIntervals ||
      this.bytes + this.intervalBytes + bytes >
        EXPERIMENT_RESOURCE_PROFILE.maxEvidenceBytes ||
      this.intervalLeaves + leaves >
        EXPERIMENT_RESOURCE_PROFILE.maxEvidenceLeaves
    )
      return false

    this.intervals.set(key, {
      start,
      end,
      pairs: evidence.pairs,
      bytes
    })
    this.intervalBytes += bytes
    this.intervalLeaves += leaves
    this.evidenceRevision++
    this.projection = null
    return true
  }

  hasInterval(range: readonly [number, number]) {
    return this.intervals.has(`${range[0]}:${range[1]}`)
  }

  record(input: ExperimentSnapshot, sample: LiveSample) {
    if (!this.owns(input))
      throw new Error('Retired live input cannot record evidence')

    const previous = this.samples.get(sample.time)

    if (previous && sameLiveSample(previous.sample, sample)) return false

    const bytes = measureWorkerPayload(sample)

    if (previous) {
      this.bytes -= previous.bytes
      this.samples.delete(sample.time)
    }

    while (
      this.samples.size >= LIVE_LIMITS.maxRecordedSamples ||
      this.bytes + this.intervalBytes + bytes >
        EXPERIMENT_RESOURCE_PROFILE.maxEvidenceBytes
    ) {
      const first = this.samples.entries().next().value

      if (!first) throw new Error('Live sample exceeds the recording budget')

      this.samples.delete(first[0])
      this.bytes -= first[1].bytes
    }

    this.samples.set(sample.time, { sample, bytes })
    this.bytes += bytes
    this.values = Object.freeze(
      [...this.samples.values()].map((item) => item.sample)
    )
    this.evidenceRevision++
    this.projection = null

    return true
  }
}

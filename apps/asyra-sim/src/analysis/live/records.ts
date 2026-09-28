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

interface LiveIntervalRecord {
  start: number
  end: number
  pairs: readonly MethodPairEvidence[]
  bytes: number
}

interface LiveIntervalIndexNode {
  center: number
  byStart: readonly LiveIntervalRecord[]
  byEnd: readonly LiveIntervalRecord[]
  left: LiveIntervalIndexNode | null
  right: LiveIntervalIndexNode | null
}

function buildIntervalIndex(
  intervals: readonly LiveIntervalRecord[]
): LiveIntervalIndexNode | null {
  if (!intervals.length) return null

  const centers = intervals
    .map((interval) => (interval.start + interval.end) / 2)
    .sort((a, b) => a - b)
  const center = centers[Math.floor(centers.length / 2)]
  const crossing: LiveIntervalRecord[] = []
  const before: LiveIntervalRecord[] = []
  const after: LiveIntervalRecord[] = []

  for (const interval of intervals) {
    if (interval.end < center) before.push(interval)
    else if (interval.start > center) after.push(interval)
    else crossing.push(interval)
  }

  return {
    center,
    byStart: [...crossing].sort((a, b) => a.start - b.start || b.end - a.end),
    byEnd: [...crossing].sort((a, b) => b.end - a.end || a.start - b.start),
    left: buildIntervalIndex(before),
    right: buildIntervalIndex(after)
  }
}

function forEachIntervalAt(
  root: LiveIntervalIndexNode | null,
  time: number,
  visit: (interval: LiveIntervalRecord) => void
) {
  let node = root
  while (node) {
    if (time < node.center) {
      for (const interval of node.byStart) {
        if (interval.start > time) break
        visit(interval)
      }
      node = node.left
    } else if (time > node.center) {
      for (const interval of node.byEnd) {
        if (interval.end < time) break
        visit(interval)
      }
      node = node.right
    } else {
      for (const interval of node.byStart) visit(interval)
      break
    }
  }
}

function proofLeafAt(
  pair: MethodPairEvidence,
  time: number
): MethodPairEvidence['evidence']['leaves'][number] | undefined {
  const leaves = pair.evidence.leaves
  let low = 0
  let high = leaves.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if (leaves[middle].start <= time) low = middle + 1
    else high = middle
  }

  const current = low > 0 ? leaves[low - 1] : undefined
  const previous =
    current?.start === time && low > 1 ? leaves[low - 2] : undefined
  for (const leaf of [current, previous]) {
    if (
      leaf &&
      leaf.start <= time &&
      time <= leaf.end &&
      (leaf.state === 'clear' ||
        (leaf.state === 'finding' && leaf.witnessTime === time))
    )
      return leaf
  }
  return undefined
}

function assertPairEvidenceAgreement(
  accepted: MethodPairEvidence,
  incoming: MethodPairEvidence,
  overlap: readonly [number, number]
) {
  const oldLeaves = accepted.evidence.leaves
  const newLeaves = incoming.evidence.leaves
  let oldIndex = 0
  let newIndex = 0

  while (oldIndex < oldLeaves.length && newIndex < newLeaves.length) {
    const oldLeaf = oldLeaves[oldIndex]
    const newLeaf = newLeaves[newIndex]
    const start = Math.max(overlap[0], oldLeaf.start, newLeaf.start)
    const end = Math.min(overlap[1], oldLeaf.end, newLeaf.end)
    if (start <= end) {
      const oldFinding = oldLeaf.state === 'finding' ? oldLeaf : null
      const newFinding = newLeaf.state === 'finding' ? newLeaf : null
      const conflict =
        (oldLeaf.state === 'clear' &&
          newFinding?.witnessTime !== null &&
          newFinding?.witnessTime !== undefined &&
          start <= newFinding.witnessTime &&
          newFinding.witnessTime <= end) ||
        (newLeaf.state === 'clear' &&
          oldFinding?.witnessTime !== null &&
          oldFinding?.witnessTime !== undefined &&
          start <= oldFinding.witnessTime &&
          oldFinding.witnessTime <= end) ||
        (oldFinding !== null &&
          newFinding !== null &&
          oldFinding.witnessTime === newFinding.witnessTime &&
          oldFinding.penetration !== newFinding.penetration)
      if (conflict)
        throw new Error(
          'Conflicting live interval evidence in overlapping coverage'
        )
    }

    if (oldLeaf.end <= newLeaf.end) oldIndex++
    if (newLeaf.end <= oldLeaf.end) newIndex++
  }
}

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
  private readonly intervals = new Map<string, LiveIntervalRecord>()
  private intervalIndex: LiveIntervalIndexNode | null = null
  private pairIndexes = new Map<string, number>()
  private evidenceByPair: (MethodPairEvidence | undefined)[] = []
  private readonly evidencePairIndexes: number[] = []
  private projectedPairByIndex: (MethodPairEvidence | undefined)[] = []
  private readonly projectedPairIndexes: number[] = []
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
    this.intervalIndex = null
    this.pairIndexes = new Map(
      (input?.pairs ?? []).map((pair, index) => [pair.id, index])
    )
    this.evidenceByPair = Array(input?.pairs.length ?? 0)
    this.projectedPairByIndex = Array(input?.pairs.length ?? 0)
    this.evidencePairIndexes.length = 0
    this.projectedPairIndexes.length = 0
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

    const pairsByIndex = this.projectedPairByIndex
    const touched = this.projectedPairIndexes
    for (const pair of exact?.pairs ?? []) {
      const index = this.pairIndexes.get(pair.pairId)
      if (index !== undefined) {
        if (pairsByIndex[index] === undefined) touched.push(index)
        pairsByIndex[index] = pair
      }
    }
    let usedIntervalEvidence = false
    for (const pair of intervalPairs) {
      const index = this.pairIndexes.get(pair.pairId)
      if (index === undefined) continue
      const existing = pairsByIndex[index]
      if (existing && hasProof(existing, time)) continue
      if (existing === undefined) touched.push(index)
      pairsByIndex[index] = pair
      usedIntervalEvidence = true
    }
    const pairs: MethodPairEvidence[] = []
    let complete = true
    for (let index = 0; index < this.input.pairs.length; index++) {
      const pair = pairsByIndex[index]
      if (pair) pairs.push(pair)
      else complete = false
      if (pair && !hasProof(pair, time)) complete = false
    }

    if (
      exact &&
      pairs.length === exact.pairs.length &&
      pairs.every((pair, index) => pair === exact.pairs[index]) &&
      complete === exact.complete
    ) {
      for (const index of touched) pairsByIndex[index] = undefined
      touched.length = 0
      return exact
    }

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
    for (const index of touched) pairsByIndex[index] = undefined
    touched.length = 0
    return sample
  }

  getReusablePairsAt(time: number): readonly MethodPairEvidence[] {
    const sample = this.getAt(time)
    if (!sample) return []

    return sample.pairs.flatMap((pair) => {
      const leaf = proofLeafAt(pair, time)
      if (!leaf || pair.evidence.coverage !== 'complete') return []

      return [
        {
          pairId: pair.pairId,
          evidence: {
            leaves: [
              {
                ...leaf,
                start: time,
                end: time,
                witnessTime: leaf.state === 'finding' ? time : null
              }
            ],
            lower: leaf.lower,
            upper: leaf.upper,
            coverage: 'complete' as const,
            evaluations: pair.evidence.evaluations
          }
        }
      ]
    })
  }

  evidenceAt(time: number): readonly MethodPairEvidence[] {
    const selected = this.evidenceByPair
    const touched = this.evidencePairIndexes

    forEachIntervalAt(this.intervalIndex, time, (interval) => {
      for (const pair of interval.pairs) {
        const pairIndex = this.pairIndexes.get(pair.pairId)
        if (pairIndex === undefined || selected[pairIndex]) continue
        const leaf = proofLeafAt(pair, time)
        if (!leaf) continue

        selected[pairIndex] = {
          pairId: pair.pairId,
          evidence: {
            leaves: [leaf],
            lower: leaf.lower,
            upper: leaf.upper,
            coverage: 'complete',
            evaluations: pair.evidence.evaluations
          }
        }
        touched.push(pairIndex)
      }
    })

    const result: MethodPairEvidence[] = []
    for (const pairIndex of touched) {
      const pair = selected[pairIndex]
      if (pair) result.push(pair)
      selected[pairIndex] = undefined
    }
    touched.length = 0
    return result
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
      if (start <= interval.end && interval.start <= end) {
        const overlap: readonly [number, number] = [
          Math.max(start, interval.start),
          Math.min(end, interval.end)
        ]
        const acceptedById = new Map(
          interval.pairs.map((pair) => [pair.pairId, pair])
        )
        for (const pair of evidence.pairs) {
          const accepted = acceptedById.get(pair.pairId)
          if (accepted) assertPairEvidenceAgreement(accepted, pair, overlap)
        }
      }
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

    const intervalRecord = {
      start,
      end,
      pairs: evidence.pairs,
      bytes
    }
    this.intervals.set(key, intervalRecord)
    this.intervalIndex = buildIntervalIndex([...this.intervals.values()])
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

    let accepted = sample

    if (previous) {
      assertBoundaryAgreement(previous.sample.pairs, sample.pairs, sample.time)
      const incomingById = new Map(
        sample.pairs.map((pair) => [pair.pairId, pair])
      )
      const previousById = new Map(
        previous.sample.pairs.map((pair) => [pair.pairId, pair])
      )
      const pairs = input.pairs.flatMap(({ id }) => {
        const incoming = incomingById.get(id)
        const retained = previousById.get(id)
        if (!incoming) return retained ? [retained] : []
        if (!retained) return [incoming]
        if (hasProof(incoming, sample.time)) return [incoming]
        if (hasProof(retained, sample.time)) return [retained]
        return [incoming]
      })
      const complete =
        pairs.length === input.pairs.length &&
        pairs.every(
          (pair) =>
            pair.evidence.coverage === 'complete' && hasProof(pair, sample.time)
        )
      accepted = Object.freeze({
        ...sample,
        pairs,
        complete,
        error: complete ? null : (sample.error ?? previous.sample.error)
      })
    }

    forEachIntervalAt(this.intervalIndex, sample.time, (interval) =>
      assertBoundaryAgreement(interval.pairs, accepted.pairs, sample.time)
    )

    if (previous && sameLiveSample(previous.sample, accepted)) return false

    const bytes = measureWorkerPayload(accepted)

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

    this.samples.set(sample.time, { sample: accepted, bytes })
    this.bytes += bytes
    this.values = Object.freeze(
      [...this.samples.values()].map((item) => item.sample)
    )
    this.evidenceRevision++
    this.projection = null

    return true
  }
}

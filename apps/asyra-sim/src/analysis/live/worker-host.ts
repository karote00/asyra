import {
  EXPERIMENT_RESOURCE_PROFILE,
  type ExperimentSnapshot
} from '../contracts'
import type { MethodCatalog } from '../../extensions/catalog'
import type {
  MethodPairEvidence,
  MethodRegistration
} from '../../extensions/contracts'
import { admitSnapshotExecution } from '../../extensions/execution-admission'
import { hasExactOwnKeys } from '../../domain/records'
import { measureWorkerPayload } from '../worker-protocol'
import {
  validateMethodEvidence,
  validatePartialMethodEvidence
} from '../result'
import { LIVE_LIMITS, LiveMessages, type LiveResponse } from './protocol'
import { sampleSnapshot, validateLiveEvidence } from './sample'
import { LivePairProgress } from './pair-progress'

/** One admitted input lifetime; each sample invokes the installed static method. */
export class LiveWorkerHost {
  private snapshot: ExperimentSnapshot | null = null
  private busy = false
  private lastId = 0
  private execute: MethodRegistration['execute'] | null = null

  constructor(
    private readonly methods: MethodCatalog,
    private readonly post: (message: LiveResponse) => void,
    private readonly now = () => performance.now()
  ) {}

  async handle(input: unknown): Promise<void> {
    if (
      hasExactOwnKeys(input, ['type', 'snapshot']) &&
      input.type === LiveMessages.OPEN &&
      !this.snapshot
    ) {
      this.snapshot = admitSnapshotExecution(input.snapshot, this.methods)

      const method = this.methods.resolve(
        this.snapshot.method.id,
        this.snapshot.method.version
      )

      if (!method.descriptor.supportsStatic)
        throw new Error('Selected method does not support live static checks')

      this.execute = method.createExecutor
        ? method.createExecutor()
        : method.execute
      if (typeof this.execute !== 'function')
        throw new Error('Invalid installed live executor')

      this.post({ type: LiveMessages.READY })

      return
    }

    const sampleRequest =
      (hasExactOwnKeys(input, ['type', 'id', 'time']) ||
        hasExactOwnKeys(input, ['type', 'id', 'time', 'acceptedPairs'])) &&
      input.type === LiveMessages.SAMPLE &&
      typeof input.time === 'number' &&
      (!Object.hasOwn(input, 'acceptedPairs') ||
        Array.isArray(input.acceptedPairs))
    const intervalRequest =
      hasExactOwnKeys(input, ['type', 'id', 'interval', 'maxIntervals']) &&
      input.type === LiveMessages.INTERVAL &&
      Array.isArray(input.interval) &&
      input.interval.length === 2 &&
      typeof input.maxIntervals === 'number'

    if (
      !this.snapshot ||
      !this.execute ||
      this.busy ||
      (!sampleRequest && !intervalRequest) ||
      !Number.isSafeInteger(input.id) ||
      typeof input.id !== 'number' ||
      input.id <= this.lastId
    )
      throw new Error('Invalid live sample request')

    const isInterval = intervalRequest
    if (
      isInterval &&
      !this.methods.resolve(
        this.snapshot.method.id,
        this.snapshot.method.version
      ).descriptor.supportsMotion
    )
      throw new Error('Selected method does not support live interval checks')

    const interval = isInterval
      ? (input.interval as readonly [number, number])
      : undefined
    const maxIntervals = isInterval
      ? (input as { maxIntervals: number }).maxIntervals
      : 0
    if (
      interval &&
      (!Number.isFinite(interval[0]) ||
        !Number.isFinite(interval[1]) ||
        interval[0] >= interval[1] ||
        interval[0] < this.snapshot.interval[0] ||
        interval[1] > this.snapshot.interval[1] ||
        !Number.isInteger(maxIntervals) ||
        maxIntervals < 1 ||
        maxIntervals > LIVE_LIMITS.maxBackgroundIntervalEvaluations ||
        maxIntervals > this.snapshot.budget.maxIntervals)
    )
      throw new Error('Invalid live interval request')

    const snapshot = interval
      ? {
          ...this.snapshot,
          interval,
          budget: { ...this.snapshot.budget, maxIntervals }
        }
      : sampleSnapshot(this.snapshot, input.time as number)
    const acceptedPairs = interval
      ? []
      : validatePartialMethodEvidence(
          snapshot,
          (input as { acceptedPairs?: readonly MethodPairEvidence[] })
            .acceptedPairs ?? []
        )
    if (acceptedPairs.some((pair) => pair.evidence.coverage !== 'complete'))
      throw new Error('Retained live pairs must be complete')
    const id = input.id
    const time = interval ? interval[0] : (input.time as number)
    const deadline =
      this.now() +
      Math.min(snapshot.budget.maxDurationMs, LIVE_LIMITS.sampleDurationMs)
    const progress = new LivePairProgress(snapshot)
    for (const pair of acceptedPairs) progress.append(pair)
    let pending: MethodPairEvidence[] = []
    let lastSent = -Infinity
    let sentCollision = false
    const abort = new AbortController()
    let settled = false

    const checkpoint = () => {
      if (settled || this.now() > deadline) {
        abort.abort()

        throw new Error('Live sample deadline exceeded')
      }
    }

    this.busy = true
    this.lastId = id

    try {
      const acceptedIds = new Set(acceptedPairs.map((pair) => pair.pairId))
      const missingPairs = snapshot.pairs.filter(
        (pair) => !acceptedIds.has(pair.id)
      )
      const acceptedEvaluations = acceptedPairs.reduce(
        (sum, pair) => sum + pair.evidence.evaluations,
        0
      )
      const remainingBudget = snapshot.budget.maxIntervals - acceptedEvaluations
      let newlyChecked: readonly MethodPairEvidence[] = []
      let evaluations = 0

      if (missingPairs.length && remainingBudget > 0) {
        const missingSnapshot = {
          ...snapshot,
          pairs: missingPairs,
          budget: { ...snapshot.budget, maxIntervals: remainingBudget }
        }
        const result = await this.execute(missingSnapshot, {
          signal: abort.signal,
          checkpoint,
          emitPair: (pair) => {
            checkpoint()
            if (interval) return

            const admitted = progress.append(pair)
            const finding = admitted.evidence.leaves.some(
              (leaf) => leaf.state === 'finding'
            )
            const collision = admitted.evidence.leaves.some(
              (leaf) => leaf.penetration
            )

            if (finding) pending.push(admitted)

            const now = this.now()
            if (
              pending.length &&
              ((collision && !sentCollision) ||
                now - lastSent >=
                  EXPERIMENT_RESOURCE_PROFILE.progressIntervalMs)
            ) {
              const message: LiveResponse = {
                type: LiveMessages.PROGRESS,
                id,
                time,
                pairs: pending
              }
              measureWorkerPayload(message)
              checkpoint()
              this.post(message)
              pending = []
              lastSent = now
              sentCollision ||= collision
            }
          }
        })
        newlyChecked = validateMethodEvidence(missingSnapshot, result)
        evaluations = result.evaluations
      } else if (missingPairs.length) {
        newlyChecked = missingPairs.map((pair) => ({
          pairId: pair.id,
          evidence: {
            leaves: [
              {
                start: snapshot.interval[0],
                end: snapshot.interval[1],
                lower: 0,
                upper: null,
                witnessTime: null,
                penetration: false,
                state: 'unresolved' as const,
                reason:
                  'The sample budget was consumed by retained pair evidence.'
              }
            ],
            lower: 0,
            upper: null,
            coverage: 'partial' as const,
            evaluations: 0
          }
        }))
        for (const pair of newlyChecked) progress.append(pair)
      }

      const pairsById = new Map(
        [...acceptedPairs, ...newlyChecked].map((pair) => [pair.pairId, pair])
      )
      const pairs = snapshot.pairs.map((pair) => {
        const evidence = pairsById.get(pair.id)
        if (!evidence) throw new Error('Live sample omitted a required pair')
        return evidence
      })
      const evidence = {
        version: 1 as const,
        snapshotId: snapshot.snapshotId,
        method: { id: snapshot.method.id, version: snapshot.method.version },
        coverage: pairs.some((pair) => pair.evidence.coverage !== 'complete')
          ? ('partial' as const)
          : ('complete' as const),
        evaluations: acceptedEvaluations + evaluations,
        pairs
      }

      checkpoint()
      if (!interval) {
        const sample = validateLiveEvidence(snapshot, time, evidence)
        progress.assertConsistent(sample.pairs)
      } else validateMethodEvidence(snapshot, evidence)
      measureWorkerPayload(evidence)
      checkpoint()
      if (interval) {
        this.post({
          type: LiveMessages.INTERVAL_RESULT,
          id,
          interval,
          evidence
        })
      } else this.post({ type: LiveMessages.RESULT, id, time, evidence })
    } catch {
      if (interval)
        this.post({ type: LiveMessages.INTERVAL_ERROR, id, interval })
      else
        this.post({
          type: LiveMessages.ERROR,
          id,
          time,
          pairs: progress.values()
        })
    } finally {
      settled = true
      this.busy = false
    }
  }
}

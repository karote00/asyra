import type { ExperimentSnapshot } from '../contracts'
import type { MethodCatalog } from '../../extensions/catalog'
import { INSTALLED_METHOD_CATALOG } from '../../extensions/installed-methods'
import { admitSnapshotExecution } from '../../extensions/execution-admission'
import { hasExactOwnKeys } from '../../domain/records'
import { measureWorkerPayload } from '../worker-protocol'
import { validateMethodEvidence } from '../result'
import {
  LIVE_LIMITS,
  LiveMessages,
  type LiveResponse,
  type LiveState
} from './protocol'
import {
  incompleteLiveSample,
  sampleSnapshot,
  validateLiveEvidence
} from './sample'
import { LiveEvidenceRecords } from './records'
import { LivePairProgress } from './pair-progress'

const createWorker = () =>
  new Worker(new URL('./playback.worker.ts', import.meta.url), {
    type: 'module'
  })

/** A Feature-owned live lifetime, not a report runner or a render scheduler. */
export class LivePlaybackRunner {
  private state: LiveState = { status: 'idle', sample: null, error: null }
  private publishStateRevision: () => void = () => undefined
  private publishRecordsRevision: () => void = () => undefined
  private request: ((time: number, discontinuity: boolean) => void) | null =
    null
  private stop: (() => void) | null = null
  private closed = false
  private readonly records = new LiveEvidenceRecords()
  private readonly attemptedIntervalGaps = new Set<string>()
  private backgroundIntervalCount = 0

  constructor(
    private readonly workerFactory = createWorker,
    private readonly methods: MethodCatalog = INSTALLED_METHOD_CATALOG,
    private readonly now = () => performance.now()
  ) {}

  getState = () => this.state
  getRecords = (key?: string) => this.records.getAll(key)

  setNotificationPublishers(
    publishStateRevision: () => void,
    publishRecordsRevision: () => void
  ) {
    this.publishStateRevision = publishStateRevision
    this.publishRecordsRevision = publishRecordsRevision
  }

  capture(input: ExperimentSnapshot) {
    return this.records.owns(input) ? input : structuredClone(input)
  }

  prepare(key: string, create: () => ExperimentSnapshot) {
    if (this.closed) throw new Error('Live playback is closed')

    const retained = this.records.getInput(key)

    if (retained) return retained

    this.invalidate()

    const input = admitSnapshotExecution(create(), this.methods)

    this.replaceRecords(input, key)

    return input
  }

  invalidate() {
    this.stop?.()
    this.replaceRecords(null)
    this.publish({ status: 'idle', sample: null, error: null })
  }

  private publish(state: LiveState) {
    if (
      this.state.status === state.status &&
      this.state.error === state.error &&
      this.state.sample === state.sample
    )
      return

    this.state = Object.freeze(state)
    this.publishStateRevision()
  }

  private replaceRecords(
    input: ExperimentSnapshot | null,
    key: string | null = null
  ) {
    const sameInput = input !== null && this.records.owns(input)
    const changed = this.records.replace(input, key)

    if (!sameInput) {
      this.attemptedIntervalGaps.clear()
      this.backgroundIntervalCount = 0
    }

    if (changed) this.publishRecordsRevision()
  }

  sample(time: number, discontinuity = false) {
    this.request?.(time, discontinuity)
  }

  open(
    input: ExperimentSnapshot,
    initialTime: number,
    signal: AbortSignal
  ): Promise<void> {
    if (this.closed || this.stop)
      return Promise.reject(
        new Error('Live playback is unavailable or already active')
      )

    let snapshot: ExperimentSnapshot

    try {
      snapshot = this.records.owns(input)
        ? input
        : admitSnapshotExecution(input, this.methods)
      if (!this.records.owns(snapshot)) this.replaceRecords(snapshot)
      sampleSnapshot(snapshot, initialTime)

      if (
        !this.methods.resolve(snapshot.method.id, snapshot.method.version)
          .descriptor.supportsStatic
      )
        throw new Error('Selected method does not support live static checks')
    } catch (error) {
      return Promise.reject(error)
    }

    if (signal.aborted) return Promise.resolve()

    let worker: Worker | null = null
    let resolve: () => void = () => undefined
    let reject: (error: Error) => void = () => undefined
    const completion = new Promise<void>((done, fail) => {
      resolve = done
      reject = fail
    })
    let retired = false
    let ready = false
    let nextId = 0
    let minimumId = 0
    let pending: number | null = initialTime
    let pendingInterval: readonly [number, number] | null = null
    let latestTime = initialTime
    let inFlight:
      | { kind: 'sample'; id: number; time: number }
      | { kind: 'interval'; id: number; interval: readonly [number, number] }
      | null = null
    let progress: LivePairProgress | null = null
    let lastSent = -Infinity
    let pace: ReturnType<typeof setTimeout> | undefined
    let watchdog: ReturnType<typeof setTimeout> | undefined

    const finish = (error?: string) => {
      if (retired) return

      retired = true
      clearTimeout(pace)
      clearTimeout(watchdog)
      signal.removeEventListener('abort', cancel)
      if (worker) {
        worker.onmessage = null
        worker.onerror = null
        worker.onmessageerror = null
        worker.terminate()
      }
      this.request = null
      this.stop = null
      this.publish({
        status: error ? 'error' : 'idle',
        sample: null,
        error: error ?? null
      })

      if (error) reject(new Error(error))
      else resolve()
    }

    const cancel = () => finish()
    const fail = () =>
      finish(
        'Live check failed or exceeded its resource deadline. No clear result is available.'
      )
    const abandonBackgroundInterval = () => {
      if (inFlight?.kind !== 'interval') {
        fail()
        return
      }

      clearTimeout(watchdog)
      watchdog = undefined
      inFlight = null
      progress = null
      ready = false
      const abandonedWorker = worker
      worker = null
      if (abandonedWorker) {
        abandonedWorker.onmessage = null
        abandonedWorker.onerror = null
        abandonedWorker.onmessageerror = null
        abandonedWorker.terminate()
      }
      drain()
    }

    const queueAdjacentGap = (time: number) => {
      if (
        !this.methods.resolve(snapshot.method.id, snapshot.method.version)
          .descriptor.supportsMotion ||
        this.backgroundIntervalCount >= LIVE_LIMITS.maxBackgroundIntervals
      )
        return

      const times = this.records
        .getAll()
        .map((sample) => sample.time)
        .sort((a, b) => a - b)
      const index = times.indexOf(time)
      const before = times[index - 1]
      const after = times[index + 1]
      let neighbor: number | undefined
      if (before === undefined) neighbor = after
      else if (after === undefined) neighbor = before
      else neighbor = time - before <= after - time ? before : after
      if (neighbor === undefined || neighbor === time) return

      const range = [
        Math.min(time, neighbor),
        Math.max(time, neighbor)
      ] as const
      const key = `${range[0]}:${range[1]}`
      if (
        this.attemptedIntervalGaps.has(key) ||
        this.records.hasInterval(range)
      )
        return

      pendingInterval = range
    }

    const drain = () => {
      if (retired) return

      if (pending !== null) {
        const cached = this.records.getAt(pending)

        if (cached?.complete) {
          pending = null
          this.publish({ status: 'ready', sample: cached, error: cached.error })
        } else if (cached)
          this.publish({ status: 'checking', sample: cached, error: null })
      }

      if (pending === null && pendingInterval === null) return

      if (inFlight || pace) return

      if (!worker) {
        try {
          const createdWorker = this.workerFactory()
          worker = createdWorker
          createdWorker.onmessage = (event) => {
            if (worker === createdWorker) receive(event)
          }
          createdWorker.onerror = () => {
            if (worker !== createdWorker) return
            if (inFlight?.kind === 'interval') abandonBackgroundInterval()
            else fail()
          }
          createdWorker.onmessageerror = () => {
            if (worker !== createdWorker) return
            if (inFlight?.kind === 'interval') abandonBackgroundInterval()
            else fail()
          }
          watchdog = setTimeout(fail, LIVE_LIMITS.startupDurationMs)
          createdWorker.postMessage({ type: LiveMessages.OPEN, snapshot })
        } catch {
          fail()
        }

        return
      }

      if (!ready) return

      if (pending === null) {
        const interval = pendingInterval
        if (!interval) return
        const key = `${interval[0]}:${interval[1]}`
        if (
          this.attemptedIntervalGaps.has(key) ||
          this.backgroundIntervalCount >= LIVE_LIMITS.maxBackgroundIntervals
        ) {
          pendingInterval = null
          return
        }
        this.attemptedIntervalGaps.add(key)
        this.backgroundIntervalCount++
        pendingInterval = null
        inFlight = { kind: 'interval', id: ++nextId, interval }
        progress = null
        watchdog = setTimeout(
          abandonBackgroundInterval,
          Math.min(
            snapshot.budget.maxDurationMs,
            LIVE_LIMITS.sampleDurationMs
          ) + LIVE_LIMITS.responseGraceMs
        )
        try {
          worker.postMessage({
            type: LiveMessages.INTERVAL,
            id: inFlight.id,
            interval,
            maxIntervals: Math.min(
              LIVE_LIMITS.maxBackgroundIntervalEvaluations,
              snapshot.budget.maxIntervals
            )
          })
        } catch {
          abandonBackgroundInterval()
        }
        return
      }

      const delay = LIVE_LIMITS.samplePeriodMs - (this.now() - lastSent)

      if (delay > 0) {
        pace = setTimeout(() => {
          pace = undefined
          drain()
        }, delay)

        return
      }

      inFlight = { kind: 'sample', id: ++nextId, time: pending }
      progress = new LivePairProgress(sampleSnapshot(snapshot, pending))
      pending = null
      lastSent = this.now()
      this.publish({ ...this.state, status: 'checking', error: null })
      watchdog = setTimeout(
        fail,
        Math.min(snapshot.budget.maxDurationMs, LIVE_LIMITS.sampleDurationMs) +
          LIVE_LIMITS.responseGraceMs
      )

      try {
        const acceptedPairs = this.records.getReusablePairsAt(inFlight.time)
        const message = {
          type: LiveMessages.SAMPLE,
          id: inFlight.id,
          time: inFlight.time,
          ...(acceptedPairs.length ? { acceptedPairs } : {})
        }
        measureWorkerPayload(message)
        worker.postMessage(message)
      } catch {
        fail()
      }
    }

    this.stop = cancel
    this.request = (time, discontinuity) => {
      if (retired) return

      try {
        sampleSnapshot(snapshot, time)
      } catch {
        fail()
        return
      }

      pending = time
      latestTime = time

      if (discontinuity) {
        minimumId = nextId + 1
        this.publish({
          status: ready ? 'checking' : 'preparing',
          sample: null,
          error: null
        })
      }

      drain()
      if (pending !== null && inFlight?.kind === 'interval')
        abandonBackgroundInterval()
    }

    const receive = (event: MessageEvent<unknown>) => {
      if (retired) return

      try {
        const message = event.data

        measureWorkerPayload(message)

        if (!ready) {
          if (
            !hasExactOwnKeys(message, ['type']) ||
            message.type !== LiveMessages.READY
          )
            throw new Error('Invalid live admission')

          clearTimeout(watchdog)
          ready = true
          drain()

          return
        }

        if (!inFlight || !message || typeof message !== 'object')
          throw new Error('Unexpected live response')

        const response = message as LiveResponse
        if (inFlight.kind === 'interval') {
          if (
            response.type !== LiveMessages.INTERVAL_RESULT &&
            response.type !== LiveMessages.INTERVAL_ERROR
          )
            throw new Error('Unknown live interval response')
          const keys =
            response.type === LiveMessages.INTERVAL_RESULT
              ? ['type', 'id', 'interval', 'evidence']
              : ['type', 'id', 'interval']
          if (
            !hasExactOwnKeys(message, keys) ||
            response.id !== inFlight.id ||
            response.interval[0] !== inFlight.interval[0] ||
            response.interval[1] !== inFlight.interval[1]
          )
            throw new Error('Mismatched live interval response')

          clearTimeout(watchdog)
          inFlight = null
          if (response.type === LiveMessages.INTERVAL_RESULT) {
            const intervalSnapshot = {
              ...snapshot,
              interval: response.interval,
              budget: {
                ...snapshot.budget,
                maxIntervals: Math.min(
                  LIVE_LIMITS.maxBackgroundIntervalEvaluations,
                  snapshot.budget.maxIntervals
                )
              }
            }
            const admitted = {
              ...response.evidence,
              pairs: validateMethodEvidence(intervalSnapshot, response.evidence)
            }
            if (
              this.records.recordInterval(snapshot, response.interval, admitted)
            )
              this.publishRecordsRevision()
            if (pending === null) {
              const cached = this.records.getAt(latestTime)
              if (cached)
                this.publish({
                  status: 'ready',
                  sample: cached,
                  error: cached.error
                })
            }
          } else if (response.type !== LiveMessages.INTERVAL_ERROR) {
            throw new Error('Unknown live interval response')
          }
          drain()
          return
        }

        if (!progress || inFlight.kind !== 'sample')
          throw new Error('Invalid live sample state')
        if (
          response.type !== LiveMessages.PROGRESS &&
          response.type !== LiveMessages.RESULT &&
          response.type !== LiveMessages.ERROR
        )
          throw new Error('Unknown live sample response')
        const keys =
          response.type === LiveMessages.RESULT
            ? ['type', 'id', 'time', 'evidence']
            : ['type', 'id', 'time', 'pairs']

        if (
          !hasExactOwnKeys(message, keys) ||
          response.id !== inFlight.id ||
          response.time !== inFlight.time
        )
          throw new Error('Mismatched live response')

        let sample

        if (response.type === LiveMessages.PROGRESS) {
          if (
            !Array.isArray(response.pairs) ||
            !response.pairs.length ||
            response.pairs.length > snapshot.pairs.length
          )
            throw new Error('Invalid live progress batch')

          for (const pair of response.pairs) progress.append(pair)

          if (response.id >= minimumId)
            this.publish({
              status: 'checking',
              sample: progress.sample(),
              error: null
            })

          return
        }

        if (response.type === LiveMessages.RESULT)
          sample = validateLiveEvidence(
            snapshot,
            response.time,
            response.evidence
          )
        else if (response.type === LiveMessages.ERROR)
          sample = incompleteLiveSample(snapshot, response.time, response.pairs)
        else throw new Error('Unknown live response')

        progress.assertConsistent(sample.pairs)
        clearTimeout(watchdog)
        inFlight = null
        progress = null

        if (this.records.record(snapshot, sample)) this.publishRecordsRevision()
        const accepted = this.records.get(sample.time) ?? sample
        if (pending === null) queueAdjacentGap(sample.time)

        if (response.id >= minimumId) {
          this.publish({
            status: 'ready',
            sample: accepted,
            error: accepted.error
          })
        }

        drain()
      } catch {
        fail()
      }
    }

    signal.addEventListener('abort', cancel, { once: true })
    this.publish({ status: 'preparing', sample: null, error: null })
    drain()

    return completion
  }

  dispose() {
    this.closed = true
    this.stop?.()
    this.replaceRecords(null)
  }
}

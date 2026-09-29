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
  type LiveState,
  type LiveDiagnosticRecord,
  type LiveSampleDiagnostic,
  type LiveSample
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
const EMPTY_DIAGNOSTICS: readonly LiveDiagnosticRecord[] = Object.freeze([])

const diagnosticKeys = [
  'requestId',
  'snapshotId',
  'candidateId',
  'experimentId',
  'experimentRevision',
  'methodId',
  'methodVersion',
  'sampleTime',
  'minimumClearance',
  'distanceTolerance',
  'timeTolerance',
  'maxIterations',
  'methodParameters',
  'configuredDurationMs',
  'effectiveDurationMs',
  'maxIntervals',
  'acceptedEvaluations',
  'availableEvaluations',
  'completedEvaluations',
  'completedPairCount',
  'partialPairCount',
  'missingPairCount',
  'pairIdsTruncated',
  'elapsedMs',
  'checkpoint',
  'stopCause',
  'errorName',
  'errorMessage',
  'completedPairIds',
  'partialPairIds',
  'missingPairIds'
] as const

function isLiveSampleDiagnostic(value: unknown): value is LiveSampleDiagnostic {
  if (
    !hasExactOwnKeys(value, diagnosticKeys) ||
    !Number.isSafeInteger(value.requestId) ||
    typeof value.snapshotId !== 'string' ||
    value.snapshotId.length > 256 ||
    typeof value.candidateId !== 'string' ||
    value.candidateId.length > 256 ||
    typeof value.experimentId !== 'string' ||
    value.experimentId.length > 256 ||
    !Number.isSafeInteger(value.experimentRevision) ||
    typeof value.methodId !== 'string' ||
    value.methodId.length > 256 ||
    typeof value.methodVersion !== 'string' ||
    value.methodVersion.length > 128 ||
    !Number.isFinite(value.sampleTime) ||
    !Number.isFinite(value.minimumClearance) ||
    !Number.isFinite(value.distanceTolerance) ||
    !Number.isFinite(value.timeTolerance) ||
    !Number.isSafeInteger(value.maxIterations) ||
    !value.methodParameters ||
    typeof value.methodParameters !== 'object' ||
    Array.isArray(value.methodParameters) ||
    Object.keys(value.methodParameters).length > 32 ||
    !Object.entries(value.methodParameters).every(
      ([key, parameter]) =>
        key.length <= 128 &&
        (typeof parameter === 'boolean' ||
          (typeof parameter === 'number' && Number.isFinite(parameter)) ||
          (typeof parameter === 'string' && parameter.length <= 200))
    ) ||
    !Number.isFinite(value.configuredDurationMs) ||
    !Number.isFinite(value.effectiveDurationMs) ||
    !Number.isSafeInteger(value.maxIntervals) ||
    !Number.isSafeInteger(value.acceptedEvaluations) ||
    !Number.isSafeInteger(value.availableEvaluations) ||
    !(
      value.completedEvaluations === null ||
      Number.isSafeInteger(value.completedEvaluations)
    ) ||
    !Number.isSafeInteger(value.completedPairCount) ||
    !Number.isSafeInteger(value.partialPairCount) ||
    !Number.isSafeInteger(value.missingPairCount) ||
    typeof value.pairIdsTruncated !== 'boolean' ||
    !Number.isFinite(value.elapsedMs) ||
    typeof value.checkpoint !== 'string' ||
    value.checkpoint.length > 80 ||
    ![
      'completed',
      'deadline',
      'executor-error',
      'validation-error',
      'transport-error'
    ].includes(value.stopCause as string) ||
    !(
      value.errorName === null ||
      (typeof value.errorName === 'string' && value.errorName.length <= 80)
    ) ||
    !(
      value.errorMessage === null ||
      (typeof value.errorMessage === 'string' &&
        value.errorMessage.length <= 240)
    )
  )
    return false

  const validIds = (ids: unknown) =>
    Array.isArray(ids) &&
    ids.length <= LIVE_LIMITS.maxDiagnosticPairIds &&
    ids.every((id) => typeof id === 'string' && id.length <= 256)

  return (
    validIds(value.completedPairIds) &&
    validIds(value.partialPairIds) &&
    validIds(value.missingPairIds)
  )
}

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
  private diagnosticKey: string | null = null
  private diagnostics: readonly LiveDiagnosticRecord[] = Object.freeze([])
  private diagnosticSequence = 0
  private readonly attemptedIntervalGaps = new Set<string>()
  private backgroundIntervalCount = 0

  constructor(
    private readonly workerFactory = createWorker,
    private readonly methods: MethodCatalog = INSTALLED_METHOD_CATALOG,
    private readonly now = () => performance.now()
  ) {}

  getState = () => this.state
  getRecords = (key?: string) => this.records.getAll(key)
  getDiagnostics = (key?: string) =>
    key === undefined || key === this.diagnosticKey
      ? this.diagnostics
      : EMPTY_DIAGNOSTICS

  recordPreviewPublication = (
    diagnosticId: number,
    time: number,
    checkedTime: number,
    feedbackKind: string,
    issuePairIds: readonly string[]
  ) => {
    const index = this.diagnostics.findIndex(
      (record) => record.diagnosticId === diagnosticId
    )
    if (index < 0) return
    if (this.diagnostics[index]?.previewPublication) return

    this.diagnostics = Object.freeze(
      this.diagnostics.map((record, position) =>
        position === index
          ? Object.freeze({
              ...record,
              previewPublication: Object.freeze({
                time,
                checkedTime,
                feedbackKind,
                issuePairCount: issuePairIds.length,
                issuePairIdsTruncated:
                  issuePairIds.length > LIVE_LIMITS.maxDiagnosticPairIds,
                issuePairIds: Object.freeze(
                  [...issuePairIds].slice(0, LIVE_LIMITS.maxDiagnosticPairIds)
                )
              })
            })
          : record
      )
    )
    this.publishRecordsRevision()
  }

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

  private recordDiagnostic(
    diagnosticId: number,
    worker: LiveSampleDiagnostic,
    requestStartedAt: number,
    runnerOutcome: LiveDiagnosticRecord['runnerOutcome'],
    runnerError: string | null
  ) {
    const immutableWorker = Object.freeze({
      ...worker,
      methodParameters: Object.freeze({ ...worker.methodParameters }),
      completedPairIds: Object.freeze([...worker.completedPairIds]),
      partialPairIds: Object.freeze([...worker.partialPairIds]),
      missingPairIds: Object.freeze([...worker.missingPairIds])
    })
    const record: LiveDiagnosticRecord = Object.freeze({
      diagnosticId,
      worker: immutableWorker,
      requestElapsedMs: Math.max(0, this.now() - requestStartedAt),
      runnerOutcome,
      runnerError,
      previewPublication: null
    })
    this.diagnostics = Object.freeze(
      [
        ...this.diagnostics.filter(
          (item) => item.diagnosticId !== diagnosticId
        ),
        record
      ].slice(-LIVE_LIMITS.maxRecordedDiagnostics)
    )
    this.publishRecordsRevision()
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
      this.diagnosticKey = input ? key : null
      this.diagnostics = Object.freeze([])
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
    let continuationTime = initialTime
    let inFlight:
      | { kind: 'sample'; id: number; time: number; startedAt: number }
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

      inFlight = {
        kind: 'sample',
        id: ++nextId,
        time: pending,
        startedAt: this.now()
      }
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
      if (time !== continuationTime || discontinuity) continuationTime = time

      if (discontinuity) {
        minimumId = nextId + 1
        this.publish({
          status: ready ? 'checking' : 'preparing',
          sample: null,
          error: null
        })
      }

      drain()
    }

    const receive = (event: MessageEvent<unknown>) => {
      if (retired) return

      let responseMessage: unknown
      try {
        const message = event.data
        responseMessage = message

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
        const hasDiagnostic = Object.hasOwn(message, 'diagnostic')
        const keys =
          response.type === LiveMessages.RESULT
            ? [
                'type',
                'id',
                'time',
                'evidence',
                ...(hasDiagnostic ? ['diagnostic'] : [])
              ]
            : [
                'type',
                'id',
                'time',
                'pairs',
                ...(hasDiagnostic ? ['diagnostic'] : [])
              ]

        if (
          !hasExactOwnKeys(message, keys) ||
          response.id !== inFlight.id ||
          response.time !== inFlight.time
        )
          throw new Error('Mismatched live response')

        const workerDiagnostic =
          hasDiagnostic &&
          (response.type === LiveMessages.RESULT ||
            response.type === LiveMessages.ERROR)
            ? response.diagnostic
            : undefined
        if (
          workerDiagnostic !== undefined &&
          (!isLiveSampleDiagnostic(workerDiagnostic) ||
            workerDiagnostic.requestId !== response.id ||
            workerDiagnostic.sampleTime !== response.time)
        )
          throw new Error('Invalid live sample diagnostic')
        const requestStartedAt = inFlight.startedAt

        let sample: LiveSample

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
              sample: { ...progress.sample(), requestId: response.id },
              error: null
            })

          return
        }

        if (response.type === LiveMessages.RESULT)
          sample = {
            ...validateLiveEvidence(snapshot, response.time, response.evidence),
            requestId: response.id
          }
        else if (response.type === LiveMessages.ERROR)
          sample = {
            ...incompleteLiveSample(snapshot, response.time, response.pairs),
            requestId: response.id
          }
        else throw new Error('Unknown live response')

        const diagnosticId = workerDiagnostic
          ? ++this.diagnosticSequence
          : undefined
        if (diagnosticId !== undefined) sample = { ...sample, diagnosticId }

        progress.assertConsistent(sample.pairs)
        clearTimeout(watchdog)
        inFlight = null
        progress = null

        const evidenceChanged = this.records.record(snapshot, sample)
        if (evidenceChanged) this.publishRecordsRevision()
        if (workerDiagnostic && diagnosticId !== undefined)
          this.recordDiagnostic(
            diagnosticId,
            workerDiagnostic,
            requestStartedAt,
            sample.complete ? 'complete' : 'incomplete',
            null
          )
        const accepted = this.records.get(sample.time) ?? sample
        const acceptedEvaluations = accepted.pairs.reduce(
          (total, pair) =>
            pair.evidence.coverage === 'complete'
              ? total + pair.evidence.evaluations
              : total,
          0
        )
        const availableEvaluations = Math.max(
          0,
          snapshot.budget.maxIntervals - acceptedEvaluations
        )
        if (
          !sample.complete &&
          evidenceChanged &&
          pending === null &&
          response.id >= minimumId &&
          response.time === latestTime &&
          continuationTime === sample.time &&
          availableEvaluations > 0
        ) {
          pending = sample.time
        } else if (sample.complete && pending === null) {
          queueAdjacentGap(sample.time)
        }

        if (response.id >= minimumId) {
          this.publish({
            status: 'ready',
            sample: accepted,
            error: accepted.error
          })
        }

        drain()
      } catch (error) {
        if (
          inFlight?.kind === 'sample' &&
          responseMessage &&
          typeof responseMessage === 'object' &&
          Object.hasOwn(responseMessage, 'diagnostic') &&
          isLiveSampleDiagnostic(
            (responseMessage as { diagnostic?: unknown }).diagnostic
          ) &&
          (responseMessage as { diagnostic: LiveSampleDiagnostic }).diagnostic
            .requestId === inFlight.id &&
          (responseMessage as { diagnostic: LiveSampleDiagnostic }).diagnostic
            .sampleTime === inFlight.time
        )
          this.recordDiagnostic(
            ++this.diagnosticSequence,
            (responseMessage as { diagnostic: LiveSampleDiagnostic })
              .diagnostic,
            inFlight.startedAt,
            'rejected',
            (error instanceof Error ? error.message : String(error)).slice(
              0,
              240
            )
          )
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

import { afterEach, expect, it, vi } from 'vitest'
import { performance as realPerformance } from 'node:perf_hooks'
import { runOfficialClearanceMethod } from '../../methods/official-method'
import { LivePlaybackRunner } from '../runner'
import { LIVE_LIMITS, LiveMessages } from '../protocol'
import { sampleSnapshot } from '../sample'
import { liveFixture } from './fixtures'

class WorkerStub {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: (() => void) | null = null
  onmessageerror: (() => void) | null = null
  postMessage = vi.fn()
  terminate = vi.fn()
  emit(data: unknown) {
    this.onmessage?.(new MessageEvent('message', { data }))
  }
}

function certifiedClearInterval(
  input: ReturnType<typeof liveFixture>,
  interval: readonly [number, number]
) {
  return {
    version: 1 as const,
    snapshotId: input.snapshotId,
    method: { id: input.method.id, version: input.method.version },
    coverage: 'complete' as const,
    evaluations: input.pairs.length,
    pairs: input.pairs.map((pair) => ({
      pairId: pair.id,
      evidence: {
        leaves: [
          {
            start: interval[0],
            end: interval[1],
            lower: 100,
            upper: 100,
            witnessTime: null,
            penetration: false,
            state: 'clear' as const,
            reason: 'The interval is certified clear.'
          }
        ],
        lower: 100,
        upper: 100,
        coverage: 'complete' as const,
        evaluations: 1
      }
    }))
  }
}

function partialWitnessInterval(
  input: ReturnType<typeof liveFixture>,
  interval: readonly [number, number],
  witnessTime: number
) {
  return {
    version: 1 as const,
    snapshotId: input.snapshotId,
    method: { id: input.method.id, version: input.method.version },
    coverage: 'partial' as const,
    evaluations: input.pairs.length,
    pairs: input.pairs.map((pair, index) => {
      const finding = index === 0
      const upper = finding ? 0 : null
      const state = finding ? ('finding' as const) : ('unresolved' as const)
      return {
        pairId: pair.id,
        evidence: {
          leaves: [
            {
              start: interval[0],
              end: interval[1],
              lower: 0,
              upper,
              witnessTime: finding ? witnessTime : null,
              penetration: finding,
              state,
              reason: finding
                ? 'A sampled witness is inside the certified interval.'
                : 'The bounded interval query remained unresolved.'
            }
          ],
          lower: 0,
          upper,
          coverage: finding ? ('complete' as const) : ('partial' as const),
          evaluations: 1
        }
      }
    })
  }
}

function unresolvedInterval(
  input: ReturnType<typeof liveFixture>,
  interval: readonly [number, number]
) {
  return {
    version: 1 as const,
    snapshotId: input.snapshotId,
    method: { id: input.method.id, version: input.method.version },
    coverage: 'partial' as const,
    evaluations: input.pairs.length,
    pairs: input.pairs.map((pair) => ({
      pairId: pair.id,
      evidence: {
        leaves: [
          {
            start: interval[0],
            end: interval[1],
            lower: 0,
            upper: null,
            witnessTime: null,
            penetration: false,
            state: 'unresolved' as const,
            reason: 'The bounded interval query remained unresolved.'
          }
        ],
        lower: 0,
        upper: null,
        coverage: 'partial' as const,
        evaluations: 1
      }
    }))
  }
}

afterEach(() => vi.useRealTimers())

it('retains a validated worker trace and its first Preview publication under the input identity', async () => {
  vi.useFakeTimers()
  const input = liveFixture()
  const worker = new WorkerStub()
  const runner = new LivePlaybackRunner(() => worker as unknown as Worker)
  const snapshot = runner.prepare('experiment-input', () => input)
  const abort = new AbortController()
  const task = runner.open(snapshot, 4, abort.signal)
  worker.emit({ type: LiveMessages.READY })
  const diagnostic = {
    requestId: 1,
    snapshotId: input.snapshotId,
    candidateId: input.source.candidateId,
    experimentId: input.source.experimentId,
    experimentRevision: input.source.experimentRevision,
    methodId: input.method.id,
    methodVersion: input.method.version,
    sampleTime: 4,
    minimumClearance: input.rule.minimumClearance,
    distanceTolerance: input.method.settings.distanceTolerance,
    timeTolerance: input.method.settings.timeTolerance,
    maxIterations: input.method.settings.maxIterations,
    methodParameters: input.method.settings.parameters ?? {},
    configuredDurationMs: input.budget.maxDurationMs,
    effectiveDurationMs: LIVE_LIMITS.sampleDurationMs,
    maxIntervals: input.budget.maxIntervals,
    acceptedEvaluations: 0,
    availableEvaluations: input.budget.maxIntervals,
    completedEvaluations: null,
    completedPairCount: 0,
    partialPairCount: 0,
    missingPairCount: input.pairs.length,
    pairIdsTruncated: false,
    elapsedMs: 9,
    checkpoint: 'method-execution',
    stopCause: 'executor-error',
    errorName: 'Error',
    errorMessage: 'sample executor failed',
    completedPairIds: [],
    partialPairIds: [],
    missingPairIds: input.pairs.map((pair) => pair.id)
  } as const

  worker.emit({
    type: LiveMessages.ERROR,
    id: 1,
    time: 4,
    pairs: [],
    diagnostic
  })

  expect(runner.getDiagnostics('experiment-input')).toMatchObject([
    {
      worker: diagnostic,
      runnerOutcome: 'incomplete',
      runnerError: null,
      previewPublication: null
    }
  ])
  runner.recordPreviewPublication(1, 4, 4, 'unresolved', [])
  expect(
    runner.getDiagnostics('experiment-input')[0]?.previewPublication
  ).toEqual({
    time: 4,
    checkedTime: 4,
    feedbackKind: 'unresolved',
    issuePairCount: 0,
    issuePairIdsTruncated: false,
    issuePairIds: []
  })

  abort.abort()
  await task
})

it('admits the latest pending pose within 50 ms when the previous check has completed', async () => {
  vi.useFakeTimers()
  const input = liveFixture()
  const worker = new WorkerStub()
  const runner = new LivePlaybackRunner(
    () => worker as unknown as Worker,
    undefined,
    Date.now
  )
  const abort = new AbortController()
  const task = runner.open(input, 0, abort.signal)
  worker.emit({ type: LiveMessages.READY })
  runner.sample(0.05)
  worker.emit({
    type: LiveMessages.RESULT,
    id: 1,
    time: 0,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 0))
  })

  try {
    await vi.advanceTimersByTimeAsync(49)
    expect(worker.postMessage).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(worker.postMessage).toHaveBeenLastCalledWith({
      type: LiveMessages.SAMPLE,
      id: 2,
      time: 0.05
    })
  } finally {
    abort.abort()
    await task
  }
})

it.each(['duplicate', 'wrong time', 'contradiction', 'deadline'])(
  'rejects %s after provisional feedback without retaining it as a completed sample',
  async (failure) => {
    vi.useFakeTimers()
    const input = liveFixture(true)
    const worker = new WorkerStub()
    const runner = new LivePlaybackRunner(
      () => worker as unknown as Worker,
      undefined,
      Date.now
    )
    const task = runner.open(input, 4, new AbortController().signal)
    const rejected = expect(task).rejects.toThrow('Live check failed')
    worker.emit({ type: LiveMessages.READY })
    const evidence = runOfficialClearanceMethod(sampleSnapshot(input, 4))
    const progress = {
      type: LiveMessages.PROGRESS,
      id: 1,
      time: 4,
      pairs: [evidence.pairs[0]]
    }
    worker.emit(progress)

    if (failure === 'duplicate') worker.emit(progress)
    if (failure === 'wrong time') worker.emit({ ...progress, time: 3 })
    if (failure === 'contradiction') {
      const changed = structuredClone(evidence)
      changed.pairs[0].evidence.leaves[0].reason =
        'Different retained observation'
      worker.emit({
        type: LiveMessages.RESULT,
        id: 1,
        time: 4,
        evidence: changed
      })
    }
    if (failure === 'deadline') await vi.advanceTimersByTimeAsync(1000)

    await rejected
    expect(runner.getRecords()).toHaveLength(0)
    expect(runner.getState().sample).toBeNull()
    expect(worker.terminate).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  }
)

it('fences provisional output after a seek but retains validated terminal evidence for its input', async () => {
  const input = liveFixture()
  const worker = new WorkerStub()
  const runner = new LivePlaybackRunner(() => worker as unknown as Worker)
  const abort = new AbortController()
  const task = runner.open(input, 4, abort.signal)
  worker.emit({ type: LiveMessages.READY })
  runner.sample(1, true)
  const evidence = runOfficialClearanceMethod(sampleSnapshot(input, 4))
  worker.emit({
    type: LiveMessages.PROGRESS,
    id: 1,
    time: 4,
    pairs: [evidence.pairs[0]]
  })

  expect(runner.getState().sample).toBeNull()
  expect(runner.getRecords()).toHaveLength(0)
  worker.emit({ type: LiveMessages.RESULT, id: 1, time: 4, evidence })
  expect(runner.getRecords().map((sample) => sample.time)).toEqual([4])
  expect(runner.getState().sample).toBeNull()
  abort.abort()
  await task
})

it('publishes progress before completion without recording or freeing the in-flight check', async () => {
  const input = liveFixture(true)
  const worker = new WorkerStub()
  const runner = new LivePlaybackRunner(() => worker as unknown as Worker)
  const abort = new AbortController()
  const task = runner.open(input, 4, abort.signal)
  // Observe rejection even when the old protocol rejects progress in this red test.
  const settled = task.catch(() => undefined)
  worker.emit({ type: LiveMessages.READY })
  const evidence = runOfficialClearanceMethod(sampleSnapshot(input, 4))
  const pair = evidence.pairs.find((pair) =>
    pair.evidence.leaves.some((leaf) => leaf.state === 'finding')
  )
  if (!pair) throw new Error('Missing collision fixture')

  try {
    worker.emit({ type: 'progress', id: 1, time: 4, pairs: [pair] })
    expect(runner.getState()).toMatchObject({
      status: 'checking',
      sample: { time: 4, complete: false, pairs: [pair] }
    })
    expect(runner.getRecords()).toHaveLength(0)
    runner.sample(5)
    expect(worker.postMessage).toHaveBeenCalledTimes(2)
    worker.emit({ type: LiveMessages.RESULT, id: 1, time: 4, evidence })
    expect(runner.getRecords()).toHaveLength(1)
  } finally {
    abort.abort()
    await settled
  }
})

it('does not repeat a geometry query for a checked sample in the same input lifetime', async () => {
  vi.useFakeTimers()

  const input = liveFixture()
  const worker = new WorkerStub()
  const publishRecordsRevision = vi.fn()
  const runner = new LivePlaybackRunner(
    () => worker as unknown as Worker,
    undefined,
    Date.now
  )
  runner.setNotificationPublishers(vi.fn(), publishRecordsRevision)
  const abort = new AbortController()
  const task = runner.open(input, 4, abort.signal)

  worker.emit({ type: LiveMessages.READY })

  const start = realPerformance.now()
  const evidence = runOfficialClearanceMethod(sampleSnapshot(input, 4))

  // eslint-disable-next-line no-console -- bounded permanent live work profile
  console.info(
    JSON.stringify({
      profile: 'live-sample-baseline',
      pairs: input.pairs.length,
      evaluations: evidence.evaluations,
      durationMs: realPerformance.now() - start
    })
  )

  worker.emit({ type: LiveMessages.RESULT, id: 1, time: 4, evidence })
  expect(publishRecordsRevision).toHaveBeenCalledOnce()
  runner.sample(4)
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)

  const calls = worker.postMessage.mock.calls.filter(
    ([message]) => message.type === LiveMessages.SAMPLE
  ).length

  abort.abort()
  await task

  expect(calls).toBe(1)
  expect(publishRecordsRevision).toHaveBeenCalledOnce()
})

it('rechecks an incomplete exact pose while retaining its accepted pair evidence', async () => {
  vi.useFakeTimers()
  const input = liveFixture()
  const worker = new WorkerStub()
  const runner = new LivePlaybackRunner(() => worker as unknown as Worker)
  const abort = new AbortController()
  const task = runner.open(input, 4, abort.signal)
  worker.emit({ type: LiveMessages.READY })

  const complete = runOfficialClearanceMethod(sampleSnapshot(input, 4))
  const acceptedPair = complete.pairs[0]
  if (!acceptedPair) throw new Error('Missing accepted pair fixture')
  worker.emit({
    type: LiveMessages.ERROR,
    id: 1,
    time: 4,
    pairs: [acceptedPair]
  })

  expect(runner.getRecords()[0]).toMatchObject({ complete: false, time: 4 })
  runner.sample(4, true)
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)

  expect(runner.getState()).toMatchObject({
    status: 'checking',
    sample: { complete: false, time: 4, pairs: [acceptedPair] }
  })
  expect(
    worker.postMessage.mock.calls.filter(
      ([message]) => message.type === LiveMessages.SAMPLE
    )
  ).toHaveLength(2)
  const retryRequest = worker.postMessage.mock.calls.at(-1)?.[0]
  expect(retryRequest.acceptedPairs).toMatchObject([
    { pairId: acceptedPair.pairId, evidence: { coverage: 'complete' } }
  ])

  const additionalPair = complete.pairs[1]
  if (!additionalPair) throw new Error('Missing additional pair fixture')
  worker.emit({
    type: LiveMessages.ERROR,
    id: 2,
    time: 4,
    pairs: [additionalPair]
  })
  expect(runner.getRecords()[0]).toMatchObject({
    complete: false,
    time: 4,
    pairs: [acceptedPair, additionalPair]
  })

  abort.abort()
  await task
})

it('continues an incomplete latest exact sample without another playback request', async () => {
  vi.useFakeTimers()
  const input = liveFixture()
  const worker = new WorkerStub()
  const runner = new LivePlaybackRunner(
    () => worker as unknown as Worker,
    undefined,
    Date.now
  )
  const abort = new AbortController()
  const task = runner.open(input, 4, abort.signal)
  worker.emit({ type: LiveMessages.READY })

  const evidence = runOfficialClearanceMethod(sampleSnapshot(input, 4))
  const acceptedPair = evidence.pairs[0]
  if (!acceptedPair) throw new Error('Missing accepted pair fixture')
  worker.emit({
    type: LiveMessages.ERROR,
    id: 1,
    time: 4,
    pairs: [acceptedPair]
  })

  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)

  const retryRequest = worker.postMessage.mock.calls.at(-1)?.[0]
  expect(retryRequest).toMatchObject({
    type: LiveMessages.SAMPLE,
    id: 2,
    time: 4,
    acceptedPairs: [
      { pairId: acceptedPair.pairId, evidence: { coverage: 'complete' } }
    ]
  })
  worker.emit({ type: LiveMessages.RESULT, id: 2, time: 4, evidence })
  expect(runner.getState()).toMatchObject({
    status: 'ready',
    sample: { complete: true, time: 4 }
  })

  abort.abort()
  await task
})

it('bounds automatic incomplete sample continuations', async () => {
  vi.useFakeTimers()
  const input = liveFixture()
  const worker = new WorkerStub()
  const runner = new LivePlaybackRunner(
    () => worker as unknown as Worker,
    undefined,
    Date.now
  )
  const abort = new AbortController()
  const task = runner.open(input, 4, abort.signal)
  worker.emit({ type: LiveMessages.READY })
  const evidence = runOfficialClearanceMethod(sampleSnapshot(input, 4))
  const acceptedPair = evidence.pairs[0]
  if (!acceptedPair) throw new Error('Missing accepted pair fixture')

  for (const id of [1, 2, 3]) {
    worker.emit({
      type: LiveMessages.ERROR,
      id,
      time: 4,
      pairs: [acceptedPair]
    })
    await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)
  }

  expect(
    worker.postMessage.mock.calls.filter(
      ([message]) => message.type === LiveMessages.SAMPLE
    )
  ).toHaveLength(LIVE_LIMITS.maxIncompleteSampleContinuations + 1)
  expect(runner.getState()).toMatchObject({
    status: 'ready',
    sample: { complete: false, time: 4 }
  })

  abort.abort()
  await task
})

it('serves an exact cached target during unrelated work and retains valid stale output without publishing it', async () => {
  const input = liveFixture()
  const firstWorker = new WorkerStub()
  const secondWorker = new WorkerStub()
  const factory = vi
    .fn<() => Worker>()
    .mockReturnValueOnce(firstWorker as unknown as Worker)
    .mockReturnValueOnce(secondWorker as unknown as Worker)
  const runner = new LivePlaybackRunner(factory)
  const retained = runner.prepare('revision-1', () => input)
  const firstAbort = new AbortController()
  const first = runner.open(retained, 4, firstAbort.signal)

  firstWorker.emit({ type: LiveMessages.READY })
  firstWorker.emit({
    type: LiveMessages.RESULT,
    id: 1,
    time: 4,
    evidence: runOfficialClearanceMethod(sampleSnapshot(retained, 4))
  })
  firstAbort.abort()
  await first

  const secondAbort = new AbortController()
  const second = runner.open(retained, 0, secondAbort.signal)
  secondWorker.emit({ type: LiveMessages.READY })
  runner.sample(4, true)

  expect(runner.getState()).toMatchObject({
    status: 'ready',
    sample: { time: 4 }
  })
  expect(
    secondWorker.postMessage.mock.calls.filter(
      ([message]) => message.type === LiveMessages.SAMPLE
    )
  ).toHaveLength(1)

  secondWorker.emit({
    type: LiveMessages.RESULT,
    id: 1,
    time: 0,
    evidence: runOfficialClearanceMethod(sampleSnapshot(retained, 0))
  })

  expect(runner.getState()).toMatchObject({
    status: 'ready',
    sample: { time: 4 }
  })
  expect(
    runner
      .getRecords()
      .map((sample) => sample.time)
      .sort()
  ).toEqual([0, 4])
  expect(
    secondWorker.postMessage.mock.calls.filter(
      ([message]) => message.type === LiveMessages.SAMPLE
    )
  ).toHaveLength(1)

  secondAbort.abort()
  await second
})

it('publishes state and exact-record revisions separately from target changes and provisional progress', async () => {
  const input = liveFixture()
  const worker = new WorkerStub()
  const publishStateRevision = vi.fn()
  const publishRecordsRevision = vi.fn()
  const runner = new LivePlaybackRunner(() => worker as unknown as Worker)
  runner.setNotificationPublishers(publishStateRevision, publishRecordsRevision)
  const abort = new AbortController()
  const task = runner.open(input, 0, abort.signal)

  worker.emit({ type: LiveMessages.READY })
  publishStateRevision.mockClear()
  publishRecordsRevision.mockClear()

  const evidence = runOfficialClearanceMethod(sampleSnapshot(input, 0))
  worker.emit({
    type: LiveMessages.PROGRESS,
    id: 1,
    time: 0,
    pairs: [evidence.pairs[0]]
  })

  expect(publishStateRevision).toHaveBeenCalled()
  expect(publishRecordsRevision).not.toHaveBeenCalled()

  publishStateRevision.mockClear()
  runner.sample(4, true)

  expect(publishStateRevision).toHaveBeenCalled()
  expect(publishRecordsRevision).not.toHaveBeenCalled()

  publishRecordsRevision.mockClear()
  worker.emit({
    type: LiveMessages.RESULT,
    id: 1,
    time: 0,
    evidence
  })

  expect(publishRecordsRevision).toHaveBeenCalledOnce()
  expect(runner.getRecords().map((sample) => sample.time)).toEqual([0])
  expect(runner.getState().sample).toBeNull()

  abort.abort()
  await task
})

it('does not publish another state revision when a seek leaves live state materially unchanged', async () => {
  const input = liveFixture()
  const worker = new WorkerStub()
  const publishStateRevision = vi.fn()
  const runner = new LivePlaybackRunner(() => worker as unknown as Worker)
  runner.setNotificationPublishers(publishStateRevision, vi.fn())
  const abort = new AbortController()
  const task = runner.open(input, 0, abort.signal)
  worker.emit({ type: LiveMessages.READY })
  publishStateRevision.mockClear()

  runner.sample(1, true)

  expect(runner.getState()).toEqual({
    status: 'checking',
    sample: null,
    error: null
  })
  expect(publishStateRevision).not.toHaveBeenCalled()

  abort.abort()
  await task
})

it('queues one adjacent interval certification only after its foreground samples finish', async () => {
  vi.useFakeTimers()
  const input = liveFixture()
  const worker = new WorkerStub()
  const runner = new LivePlaybackRunner(
    () => worker as unknown as Worker,
    undefined,
    Date.now
  )
  const publishRecordsRevision = vi.fn()
  runner.setNotificationPublishers(vi.fn(), publishRecordsRevision)
  const abort = new AbortController()
  const task = runner.open(input, 0, abort.signal)
  worker.emit({ type: LiveMessages.READY })
  worker.emit({
    type: LiveMessages.RESULT,
    id: 1,
    time: 0,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 0))
  })

  runner.sample(4)
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)
  expect(worker.postMessage).toHaveBeenLastCalledWith({
    type: LiveMessages.SAMPLE,
    id: 2,
    time: 4
  })
  worker.emit({
    type: LiveMessages.RESULT,
    id: 2,
    time: 4,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 4))
  })

  expect(worker.postMessage).toHaveBeenLastCalledWith({
    type: 'interval',
    id: 3,
    interval: [0, 4],
    maxIntervals: LIVE_LIMITS.maxBackgroundIntervalEvaluations
  })
  publishRecordsRevision.mockClear()

  worker.emit({
    type: 'interval-result',
    id: 3,
    interval: [0, 4],
    evidence: certifiedClearInterval(input, [0, 4])
  })
  expect(publishRecordsRevision).toHaveBeenCalledOnce()
  const sampleRequests = worker.postMessage.mock.calls.filter(
    ([message]) => message.type === LiveMessages.SAMPLE
  )
  runner.sample(2, true)
  expect(
    worker.postMessage.mock.calls.filter(
      ([message]) => message.type === LiveMessages.SAMPLE
    )
  ).toHaveLength(sampleRequests.length)
  expect(runner.getState()).toMatchObject({
    status: 'ready',
    sample: { time: 2, complete: true },
    error: null
  })
  expect(publishRecordsRevision).toHaveBeenCalledOnce()

  abort.abort()
  await task
})

it('shows an interval witness without treating missing pair coverage as a cached exact sample', async () => {
  vi.useFakeTimers()
  const input = liveFixture()
  const witnessPairId = input.pairs[0]?.id
  if (!witnessPairId) throw new Error('Missing witness pair fixture')
  const worker = new WorkerStub()
  const runner = new LivePlaybackRunner(
    () => worker as unknown as Worker,
    undefined,
    Date.now
  )
  const abort = new AbortController()
  const task = runner.open(input, 0, abort.signal)
  worker.emit({ type: LiveMessages.READY })
  worker.emit({
    type: LiveMessages.RESULT,
    id: 1,
    time: 0,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 0))
  })
  runner.sample(4)
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)
  worker.emit({
    type: LiveMessages.RESULT,
    id: 2,
    time: 4,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 4))
  })
  worker.emit({
    type: LiveMessages.INTERVAL_RESULT,
    id: 3,
    interval: [0, 4],
    evidence: partialWitnessInterval(input, [0, 4], 2)
  })

  runner.sample(2, true)
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)

  const sampleRequest = worker.postMessage.mock.calls.at(-1)?.[0]
  expect(sampleRequest).toMatchObject({
    type: LiveMessages.SAMPLE,
    id: 4,
    time: 2
  })
  expect(sampleRequest.acceptedPairs).toMatchObject([
    {
      pairId: witnessPairId,
      evidence: { leaves: [{ start: 2, end: 2, witnessTime: 2 }] }
    }
  ])
  expect(runner.getState()).toMatchObject({
    status: 'checking',
    sample: {
      time: 2,
      complete: false,
      pairs: [
        {
          pairId: input.pairs[0].id,
          evidence: { leaves: [{ state: 'finding', witnessTime: 2 }] }
        }
      ]
    }
  })

  abort.abort()
  await task
})

it('keeps the live lifetime when an exact sample refines an unresolved interval gap', async () => {
  vi.useFakeTimers()
  const input = liveFixture()
  const worker = new WorkerStub()
  const runner = new LivePlaybackRunner(
    () => worker as unknown as Worker,
    undefined,
    Date.now
  )
  const abort = new AbortController()
  const task = runner.open(input, 0, abort.signal)
  worker.emit({ type: LiveMessages.READY })
  worker.emit({
    type: LiveMessages.RESULT,
    id: 1,
    time: 0,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 0))
  })
  runner.sample(4)
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)
  worker.emit({
    type: LiveMessages.RESULT,
    id: 2,
    time: 4,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 4))
  })
  worker.emit({
    type: LiveMessages.INTERVAL_RESULT,
    id: 3,
    interval: [0, 4],
    evidence: unresolvedInterval(input, [0, 4])
  })

  runner.sample(2, true)
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)
  worker.emit({
    type: LiveMessages.RESULT,
    id: 4,
    time: 2,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 2))
  })

  expect(worker.postMessage).toHaveBeenLastCalledWith({
    type: LiveMessages.INTERVAL,
    id: 5,
    interval: [0, 2],
    maxIntervals: LIVE_LIMITS.maxBackgroundIntervalEvaluations
  })
  worker.emit({
    type: LiveMessages.INTERVAL_RESULT,
    id: 5,
    interval: [0, 2],
    evidence: certifiedClearInterval(input, [0, 2])
  })

  expect(runner.getState()).toMatchObject({
    status: 'ready',
    sample: { time: 2, complete: true },
    error: null
  })
  abort.abort()
  await task
})

it('keeps the latest foreground sample pending until bounded interval work settles on its Worker', async () => {
  vi.useFakeTimers()
  const input = liveFixture()
  const workers: WorkerStub[] = []
  const runner = new LivePlaybackRunner(
    () => {
      const worker = new WorkerStub()
      workers.push(worker)
      return worker as unknown as Worker
    },
    undefined,
    Date.now
  )
  const abort = new AbortController()
  const task = runner.open(input, 0, abort.signal)
  const backgroundWorker = workers[0]
  backgroundWorker.emit({ type: LiveMessages.READY })
  backgroundWorker.emit({
    type: LiveMessages.RESULT,
    id: 1,
    time: 0,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 0))
  })
  runner.sample(4)
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)
  backgroundWorker.emit({
    type: LiveMessages.RESULT,
    id: 2,
    time: 4,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 4))
  })
  expect(backgroundWorker.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: LiveMessages.INTERVAL, id: 3 })
  )
  const lateIntervalDelivery = backgroundWorker.onmessage
  runner.sample(2, true)

  expect(backgroundWorker.terminate).not.toHaveBeenCalled()
  expect(workers).toHaveLength(1)
  expect(backgroundWorker.postMessage).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: LiveMessages.INTERVAL, id: 3 })
  )

  lateIntervalDelivery?.(
    new MessageEvent('message', {
      data: { type: LiveMessages.INTERVAL_ERROR, id: 3, interval: [0, 4] }
    }) as MessageEvent
  )
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)
  expect(backgroundWorker.postMessage).toHaveBeenLastCalledWith({
    type: LiveMessages.SAMPLE,
    id: 4,
    time: 2
  })
  expect(runner.getState()).toMatchObject({ status: 'checking', error: null })

  backgroundWorker.emit({
    type: LiveMessages.RESULT,
    id: 4,
    time: 2,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 2))
  })
  expect(runner.getState()).toMatchObject({
    status: 'ready',
    sample: { time: 2, complete: true },
    error: null
  })
  expect(workers).toHaveLength(1)
  expect(backgroundWorker.terminate).not.toHaveBeenCalled()
  abort.abort()
  await task
})

it('treats background interval watchdog expiry as optional work failure', async () => {
  vi.useFakeTimers()
  const input = liveFixture()
  const workers: WorkerStub[] = []
  const runner = new LivePlaybackRunner(
    () => {
      const worker = new WorkerStub()
      workers.push(worker)
      return worker as unknown as Worker
    },
    undefined,
    Date.now
  )
  const abort = new AbortController()
  let settled = false
  const task = runner.open(input, 0, abort.signal).finally(() => {
    settled = true
  })
  const backgroundWorker = workers[0]
  backgroundWorker.emit({ type: LiveMessages.READY })
  backgroundWorker.emit({
    type: LiveMessages.RESULT,
    id: 1,
    time: 0,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 0))
  })
  runner.sample(4)
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)
  backgroundWorker.emit({
    type: LiveMessages.RESULT,
    id: 2,
    time: 4,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 4))
  })

  await vi.advanceTimersByTimeAsync(
    LIVE_LIMITS.sampleDurationMs + LIVE_LIMITS.responseGraceMs
  )
  expect(settled).toBe(false)
  expect(backgroundWorker.terminate).toHaveBeenCalledOnce()
  expect(runner.getState()).toMatchObject({ status: 'ready', error: null })

  runner.sample(2, true)
  expect(workers).toHaveLength(2)
  workers[1].emit({ type: LiveMessages.READY })
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)
  expect(workers[1].postMessage).toHaveBeenLastCalledWith({
    type: LiveMessages.SAMPLE,
    id: 4,
    time: 2
  })
  abort.abort()
  await task
})

it('keeps the live lifetime when the optional background interval Worker fails', async () => {
  vi.useFakeTimers()
  const input = liveFixture()
  const workers: WorkerStub[] = []
  const runner = new LivePlaybackRunner(
    () => {
      const worker = new WorkerStub()
      workers.push(worker)
      return worker as unknown as Worker
    },
    undefined,
    Date.now
  )
  const abort = new AbortController()
  const task = runner.open(input, 0, abort.signal)
  const backgroundWorker = workers[0]
  backgroundWorker.emit({ type: LiveMessages.READY })
  backgroundWorker.emit({
    type: LiveMessages.RESULT,
    id: 1,
    time: 0,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 0))
  })
  runner.sample(4)
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)
  backgroundWorker.emit({
    type: LiveMessages.RESULT,
    id: 2,
    time: 4,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 4))
  })
  backgroundWorker.onerror?.()

  expect(backgroundWorker.terminate).toHaveBeenCalledOnce()
  expect(runner.getState()).toMatchObject({ status: 'ready', error: null })
  runner.sample(2, true)
  const foregroundWorker = workers[1]
  foregroundWorker.emit({ type: LiveMessages.READY })
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)
  expect(foregroundWorker.postMessage.mock.calls.at(-1)?.[0]).toMatchObject({
    type: LiveMessages.SAMPLE,
    time: 2
  })
  foregroundWorker.emit({
    type: LiveMessages.RESULT,
    id: 4,
    time: 2,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 2))
  })
  expect(runner.getState()).toMatchObject({ status: 'ready', error: null })
  abort.abort()
  await task
})

it('preserves unknown coverage after an explicit optional interval error', async () => {
  vi.useFakeTimers()
  const input = liveFixture()
  const worker = new WorkerStub()
  const runner = new LivePlaybackRunner(
    () => worker as unknown as Worker,
    undefined,
    Date.now
  )
  const abort = new AbortController()
  const task = runner.open(input, 0, abort.signal)
  worker.emit({ type: LiveMessages.READY })
  worker.emit({
    type: LiveMessages.RESULT,
    id: 1,
    time: 0,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 0))
  })
  runner.sample(4)
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)
  worker.emit({
    type: LiveMessages.RESULT,
    id: 2,
    time: 4,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 4))
  })
  worker.emit({
    type: LiveMessages.INTERVAL_ERROR,
    id: 3,
    interval: [0, 4]
  })

  expect(runner.getState()).toMatchObject({
    status: 'ready',
    sample: { time: 4, complete: true },
    error: null
  })
  runner.sample(2, true)
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)
  expect(worker.postMessage.mock.calls.at(-1)?.[0]).toMatchObject({
    type: LiveMessages.SAMPLE,
    id: 4,
    time: 2
  })
  worker.emit({
    type: LiveMessages.RESULT,
    id: 4,
    time: 2,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 2))
  })
  expect(runner.getState()).toMatchObject({ status: 'ready', error: null })
  abort.abort()
  await task
})

it('shares an identical in-flight query and retains its exact result for the pending seek', async () => {
  vi.useFakeTimers()

  const input = liveFixture()
  const worker = new WorkerStub()
  const runner = new LivePlaybackRunner(
    () => worker as unknown as Worker,
    undefined,
    Date.now
  )
  const abort = new AbortController()
  const task = runner.open(input, 0, abort.signal)

  worker.emit({ type: LiveMessages.READY })
  runner.sample(0, true)
  worker.emit({
    type: LiveMessages.RESULT,
    id: 1,
    time: 0,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 0))
  })
  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)

  expect(
    worker.postMessage.mock.calls.filter(
      ([message]) => message.type === LiveMessages.SAMPLE
    )
  ).toHaveLength(1)
  expect(runner.getState()).toMatchObject({
    status: 'ready',
    sample: { time: 0 }
  })

  abort.abort()
  await task
  expect(vi.getTimerCount()).toBe(0)
})

it('reuses owner-admitted samples across Play lifetimes with zero new Workers, then invalidates on replacement', async () => {
  const worker = new WorkerStub()
  const factory = vi.fn(() => worker as unknown as Worker)
  const runner = new LivePlaybackRunner(factory)
  const publishRecordsRevision = vi.fn()
  runner.setNotificationPublishers(vi.fn(), publishRecordsRevision)
  const input = runner.prepare('revision-1', liveFixture)
  const abort = new AbortController()
  const first = runner.open(input, 4, abort.signal)

  worker.emit({ type: LiveMessages.READY })
  worker.emit({
    type: LiveMessages.RESULT,
    id: 1,
    time: 4,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 4))
  })

  abort.abort()
  await first

  const changedInput = structuredClone(liveFixture())
  changedInput.snapshotId = 'changed-threshold-revision'
  changedInput.rule.minimumClearance += 0.125
  const create = vi.fn(() => changedInput)
  const retained = runner.prepare('revision-1', create)
  const nextAbort = new AbortController()
  const next = runner.open(retained, 4, nextAbort.signal)

  expect(create).not.toHaveBeenCalled()
  expect(factory).toHaveBeenCalledOnce()
  expect(runner.getState().sample?.time).toBe(4)
  expect(runner.getRecords('revision-1')).toHaveLength(1)
  expect(runner.getRecords('revision-2')).toHaveLength(0)

  nextAbort.abort()
  await next

  runner.invalidate()
  expect(runner.getRecords()).toHaveLength(0)

  const replacement = runner.prepare('revision-2', create)
  expect(replacement).not.toBe(input)
  expect(replacement.rule.minimumClearance).toBe(
    changedInput.rule.minimumClearance
  )
  expect(create).toHaveBeenCalledOnce()
  expect(runner.getRecords('revision-1')).toHaveLength(0)
  expect(publishRecordsRevision).toHaveBeenCalledTimes(2)

  runner.dispose()
})

it('does not reuse cached evidence for a detached input with the same snapshot ID', async () => {
  const worker = new WorkerStub()
  const factory = vi.fn(() => worker as unknown as Worker)
  const runner = new LivePlaybackRunner(factory)
  const input = runner.prepare('revision-1', liveFixture)
  const abort = new AbortController()
  const first = runner.open(input, 4, abort.signal)

  worker.emit({ type: LiveMessages.READY })
  worker.emit({
    type: LiveMessages.RESULT,
    id: 1,
    time: 4,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 4))
  })
  abort.abort()
  await first

  const changed = structuredClone(input)
  const nextAbort = new AbortController()
  const next = runner.open(changed, 4, nextAbort.signal)

  expect(factory).toHaveBeenCalledTimes(2)
  expect(runner.getRecords()).toHaveLength(0)

  nextAbort.abort()
  await next
})

it('sends geometry once, retains latest time and caches valid pre-seek output without publishing it', async () => {
  vi.useFakeTimers()

  const input = liveFixture()
  const worker = new WorkerStub()
  const runner = new LivePlaybackRunner(
    () => worker as unknown as Worker,
    undefined,
    Date.now
  )
  const abort = new AbortController()
  const task = runner.open(input, 0, abort.signal)

  worker.emit({ type: LiveMessages.READY })

  for (let i = 1; i <= 100; i++) runner.sample(i / 100)

  expect(worker.postMessage).toHaveBeenCalledTimes(2)

  runner.sample(4, true)

  worker.emit({
    type: LiveMessages.RESULT,
    id: 1,
    time: 0,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 0))
  })

  expect(runner.getState().sample).toBeNull()
  expect(runner.getRecords().map((sample) => sample.time)).toEqual([0])

  await vi.advanceTimersByTimeAsync(LIVE_LIMITS.samplePeriodMs)

  expect(worker.postMessage).toHaveBeenLastCalledWith({
    type: LiveMessages.SAMPLE,
    id: 2,
    time: 4
  })

  worker.emit({
    type: LiveMessages.RESULT,
    id: 2,
    time: 4,
    evidence: runOfficialClearanceMethod(sampleSnapshot(input, 4))
  })

  expect(runner.getState().sample?.time).toBe(4)
  expect(
    runner
      .getRecords()
      .map((sample) => sample.time)
      .sort()
  ).toEqual([0, 4])

  const late = worker.onmessage

  abort.abort()
  await task
  late?.(new MessageEvent('message', { data: { type: LiveMessages.READY } }))

  expect(runner.getState().status).toBe('idle')
  expect(worker.terminate).toHaveBeenCalledOnce()
  expect(vi.getTimerCount()).toBe(0)
})

it.each([
  'timeout',
  'wrong time',
  'wrong source',
  'invalid evidence',
  'message error'
])('fails closed on %s and terminates the owned worker', async (failure) => {
  vi.useFakeTimers()

  const input = liveFixture()
  const worker = new WorkerStub()
  const runner = new LivePlaybackRunner(() => worker as unknown as Worker)
  const task = runner.open(input, 0, new AbortController().signal)
  const rejected = expect(task).rejects.toThrow('Live check failed')

  worker.emit({ type: LiveMessages.READY })

  if (failure === 'timeout') await vi.advanceTimersByTimeAsync(1000)
  else if (failure === 'message error') worker.onmessageerror?.()
  else {
    const evidence = structuredClone(
      runOfficialClearanceMethod(sampleSnapshot(input, 0))
    )

    if (failure === 'wrong source') evidence.snapshotId = 'foreign'

    worker.emit({
      type: LiveMessages.RESULT,
      id: 1,
      time: failure === 'wrong time' ? 1 : 0,
      evidence: failure === 'invalid evidence' ? {} : evidence
    })
  }

  await rejected

  expect(runner.getState().status).toBe('error')
  expect(runner.getState().sample).toBeNull()
  expect(worker.terminate).toHaveBeenCalledOnce()
  expect(vi.getTimerCount()).toBe(0)
})

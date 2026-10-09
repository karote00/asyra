import type { AiProviderInput } from '../provider.js'
import type { ExecutionRecord, ExecutionRecordSink } from './records.js'

type UsageOutcome = 'completed' | 'failed' | 'cancelled' | 'timed_out'
const tokenFields = [
  'inputTokens',
  'cachedInputTokens',
  'outputTokens',
  'reasoningOutputTokens',
  'totalTokens'
] as const
type TokenUsage = Record<(typeof tokenFields)[number], number>
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const correlationId = (value: unknown): string | undefined =>
  typeof value === 'string' && /^[a-zA-Z0-9:_-]{1,160}$/.test(value)
    ? value
    : undefined

// Evidence is deliberately allowlisted: never retain raw prompts, provider events,
// credentials, bitmap bytes, SVG/path coordinates or complete document payloads.
const evidenceKeys = new Set([
  'actor',
  'retryOf',
  'direction',
  'bytes',
  'stream',
  'executor',
  'channel',
  'terminal',
  'parentCallId',
  'part',
  'nativeThreadId',
  'nativeTurnId',
  'nativeItemId',
  'batchId',
  'purpose',
  'purposeSource',
  'expectedResult',
  'expectationSource',
  'contractDigest',
  'timingScope',
  'actionObservation',
  'handlerMs',
  'executionMs',
  'settlement',
  'notificationCounts',
  'notification',
  'diagnostic',
  'server',
  'failureReason',
  'willRetry',
  'rpcCode',
  'httpStatusCode',
  'detailOmitted',
  'occurrences',
  'value',
  'acknowledgedActions',
  'tool',
  'namespace',
  'names',
  'operations',
  'scope',
  'parentId',
  'offset',
  'limit',
  'count',
  'catalogSize',
  'fields',
  'keyPrefix',
  'keys',
  'field',
  'target',
  'callId',
  'arguments',
  'updates',
  'style',
  'fillColor',
  'strokeColor',
  'geometry',
  'scaleX',
  'scaleY',
  'properties',
  'facts',
  'factBindings',
  'criterionId',
  'factId',
  'factIds',
  'final',
  'statement',
  'sources',
  'verification',
  'dependencies',
  'dependencyChanges',
  'invalidatedBy',
  'key',
  'version',
  'structureCriteria',
  'readyForDetail',
  'recovery',
  'nextTool',
  'deferredDetails',
  'deferredChecks',
  'pendingDetails',
  'description',
  'regressions',
  'previousEvidence',
  'currentEvidence',
  'plan',
  'draft',
  'type',
  'children',
  'projection',
  'result',
  'actionResults',
  'batchSummary',
  'operationCount',
  'actionCount',
  'actionName',
  'status',
  'available',
  'current',
  'complete',
  'outcome',
  'toolOutcome',
  'issues',
  'code',
  'durationMs',
  'queueMs',
  'requestBytes',
  'toolCount',
  'toolDefinitionBytes',
  'eagerToolCount',
  'eagerToolDefinitionBytes',
  'executionMs',
  'responseTextBytes',
  'imageCount',
  'timing',
  'admissionMs',
  'createMs',
  'cooperativePaintMs',
  'cooperativeYieldMs',
  'totalMs',
  'sliceCount',
  'artifactId',
  'imageArtifactId',
  'analysisId',
  'elementId',
  'compositionId',
  'elementIds',
  'elementCount',
  'pathCount',
  'pointCount',
  'width',
  'height',
  'url',
  'sourceUrl',
  'title',
  'sources',
  'references',
  'method',
  'strategy',
  'brief',
  'viewpoint',
  'assumptions',
  'checks',
  'findings',
  'kind',
  'property',
  'expected',
  'actual',
  'tolerance',
  'applicable',
  'layoutReview',
  'review',
  'phase',
  'criteria',
  'requirement',
  'evidence',
  'limitations',
  'inspection',
  'inspectionDeferred',
  'inspectionIds',
  'inspectionId',
  'revision',
  'detailRequired',
  'id',
  'actions',
  'name',
  'message',
  'accepted',
  'queries',
  'images',
  'image',
  'candidates',
  'candidateId',
  'referenceId',
  'source',
  'reviewEvidence',
  'reason',
  'error',
  'query',
  'action',
  'truncated',
  'elementsTruncated',
  'imageScope',
  'partial',
  'bounds',
  'x',
  'y',
  'view',
  'region'
])
const summarizeEvidence = (
  value: unknown,
  depth = 0,
  budget = { nodes: 128 }
): unknown => {
  if (--budget.nodes < 0) return '[evidence budget exhausted]'
  if (depth > 6) return '[nested evidence omitted]'
  if (typeof value === 'string') {
    if (/data:|base64|<svg|Bearer\s/i.test(value)) return '[payload omitted]'
    return (
      value
        .replace(/https?:\/\/[^\s"<>]+/g, (address) => {
          try {
            const url = new URL(address)
            return url.origin + url.pathname
          } catch {
            return '[invalid URL]'
          }
        })
        .slice(0, 500) + (value.length > 500 ? ' [truncated]' : '')
    )
  }
  if (typeof value === 'boolean' || typeof value === 'number' || value === null)
    return value
  if (Array.isArray(value))
    return {
      count: value.length,
      items: value
        .slice(0, 12)
        .map((item) => summarizeEvidence(item, depth + 1, budget)),
      truncated: value.length > 12
    }
  if (!isRecord(value)) return undefined
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => evidenceKeys.has(key))
      .map(([key, item]) => {
        if (key === 'part' && isRecord(item))
          return [
            key,
            {
              key: summarizeEvidence(item.key, depth + 1, budget),
              index:
                typeof item.index === 'number' &&
                Number.isSafeInteger(item.index) &&
                item.index >= 0
                  ? item.index
                  : null
            }
          ]
        return [
          key,
          ['fillColor', 'strokeColor'].includes(key) &&
          typeof item === 'string' &&
          !/^#[0-9a-f]{6,8}$/i.test(item)
            ? '[invalid color value]'
            : summarizeEvidence(
                key === 'criteria' && isRecord(item)
                  ? Object.entries(item).map(([id, criterion]) => ({
                      criterionId: id,
                      ...(isRecord(criterion) ? criterion : {})
                    }))
                  : item,
                depth + 1,
                budget
              )
        ]
      })
  )
}

// Persist the structured diagnostic projection, not echoed briefs or arbitrary
// exception text. Console compatibility remains separate from local retention.
const persistedEvidence = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(persistedEvidence)
  if (!isRecord(value)) return value
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      ['brief', 'message', 'error'].includes(key) && typeof item === 'string'
        ? '[free text omitted]'
        : persistedEvidence(item)
    ])
  )
}

const payloadShape = (value: unknown) => {
  if (Array.isArray(value)) return 'array'
  if (value === null) return 'null'
  return typeof value
}
const diagnosticSummary = (value: unknown) => {
  const summary = persistedEvidence(summarizeEvidence(value))
  if (JSON.stringify(summary ?? null).length > 4000)
    return {
      truncated: true,
      reason:
        'Diagnostic summary exceeds its display budget; inspect the local payload reference.'
    }
  return summary
}
// Shape and omissions are explicit; this is not a raw-payload recorder.
const payloadDiagnostic = (value: unknown) => ({
  shape: payloadShape(value),
  summary: diagnosticSummary(value),
  omittedFields: isRecord(value)
    ? Object.keys(value)
        .filter((key) => !evidenceKeys.has(key))
        .slice(0, 24)
        .map((key) =>
          /secret|password|token|credential|authorization|key/i.test(key)
            ? '[sensitive field]'
            : key
        )
    : [],
  policy: 'bounded-allowlist'
})
const outputDiagnostic = (
  value: unknown,
  failed: boolean,
  reason?: unknown
) => {
  const result = isRecord(value) ? value : {}
  const receipts = Array.isArray(result.actionResults)
    ? result.actionResults
        .filter(isRecord)
        .map((entry) => (isRecord(entry.result) ? entry.result : {}))
    : []
  const observations = [result, ...receipts]
  let usability = 'unknown'
  let basis = 'No explicit output-availability contract was returned.'
  const outcome = isRecord(result.toolOutcome) ? result.toolOutcome : {}
  if (
    !failed &&
    ['usable', 'unavailable', 'partial'].includes(String(outcome.status))
  ) {
    usability =
      outcome.status === 'unavailable' ? 'unusable' : String(outcome.status)
    basis =
      'The App invocation owner classified execution output; this does not certify visual correctness.'
  } else if (
    failed ||
    observations.some(
      (item) =>
        item.available === false ||
        item.applicable === false ||
        item.status === 'failed'
    )
  ) {
    usability = 'unusable'
    basis = failed
      ? 'Tool raised an execution or admission error.'
      : 'Receipt explicitly rejected or could not provide the requested output.'
  } else if (
    observations.some(
      (item) =>
        item.partial === true ||
        item.complete === false ||
        item.accepted === false ||
        item.readyForDetail === false
    )
  ) {
    usability = 'partial'
    basis = 'Receipt reports incomplete coverage or unmet review criteria.'
  } else if (
    observations.some(
      (item) =>
        item.available === true ||
        item.complete === true ||
        item.accepted === true ||
        item.status === 'complete' ||
        item.status === 'no-change'
    ) ||
    (isRecord(result.batchSummary) &&
      Number(result.batchSummary.actionCount) > 0)
  ) {
    usability = 'usable'
    basis =
      'Receipt acknowledges output or operations; this does not certify visual correctness.'
  }
  const issue = Array.isArray(outcome.issues)
    ? outcome.issues.find(
        (item) => isRecord(item) && typeof item.message === 'string'
      )
    : undefined
  const feedback =
    reason ??
    (isRecord(issue) ? issue.message : undefined) ??
    (usability === 'unusable' || usability === 'partial'
      ? observations.find((item) => typeof item.message === 'string')?.message
      : undefined)
  let correctness = {
    status: 'unverified',
    source: 'none',
    reason: 'Execution receipt alone does not verify the requested result.'
  }
  const checks = result.checks
  if (
    Array.isArray(checks) &&
    checks.length > 0 &&
    checks.every(
      (check) =>
        isRecord(check) &&
        ['pass', 'fail', 'unverified'].includes(String(check.status)) &&
        typeof check.evidence === 'string'
    )
  ) {
    let status = 'unverified'
    if (checks.some((check) => check.status === 'fail')) status = 'failed'
    else if (checks.every((check) => check.status === 'pass')) status = 'passed'
    correctness = {
      status,
      source: 'model-review',
      reason:
        'Recorded criterion judgments only; see each check and its evidence. This is not independent verification of the artwork.'
    }
  }
  return {
    ...payloadDiagnostic(value),
    correctness,
    usability,
    basis,
    feedback: typeof feedback === 'string' ? summarizeEvidence(feedback) : null
  }
}

/** One bounded accumulator per provider invocation; provider totals are snapshots, not deltas. */
export const createAiExecutionProfiler = (
  input: AiProviderInput,
  model: string,
  options: {
    sink?: ExecutionRecordSink
    now?: () => number
    sourceRevision?: string
    purpose?: string
    provider?: string
    effort?: string
    log?: (line: string) => void
    sourceRequestId?: string
    parentCallId?: string
    sourceSpanId?: string
    lifecycle?: boolean
  } = {}
) => {
  const now = options.now ?? (() => performance.now())
  // Assessment CLI stdout is the report payload; keep diagnostics separate.
  const log = options.log ?? (() => undefined)
  const requestId = globalThis.crypto.randomUUID()
  const startedAt = now()
  const metadata = isRecord(input.metadata) ? input.metadata : {}
  const conversationId = correlationId(metadata.conversationId)
  const turnId = correlationId(metadata.turnId)
  const replyToTurnId = isRecord(metadata.replyTo)
    ? correlationId(metadata.replyTo.turnId)
    : undefined
  let tokens: TokenUsage | null = null
  let invalidSnapshot = false
  let finished = false
  let sequence = 0
  const transport = { sentBytes: 0, receivedBytes: 0 }
  const activeIntervals = new Set<string>()
  let intervalStartedAt = 0
  let observedToolAndResearchMs = 0
  let recordingFailures = 0
  const persist = (record: ExecutionRecord) => {
    try {
      options.sink?.write({
        ...record,
        evidence: persistedEvidence(record.evidence)
      })
    } catch {
      recordingFailures++
      // A diagnostic sink cannot change execution.
    }
  }
  persist({
    event: 'ai_request_started',
    schemaVersion: 2,
    profilerVersion: 1,
    requestId,
    sequence: 0,
    startedAt: new Date().toISOString(),
    model,
    effort: options.effort ?? null,
    provider: options.provider ?? null,
    sourceRevision: correlationId(options.sourceRevision) ?? null,
    conversationId,
    turnId,
    replyToTurnId,
    purpose: options.purpose ?? 'execution',
    sourceRequestId: correlationId(options.sourceRequestId) ?? null,
    parentCallId: correlationId(options.parentCallId) ?? null,
    sourceSpanId: correlationId(options.sourceSpanId) ?? null,
    ...(options.lifecycle ? { lifecycleVersion: 1 } : {})
  })
  const lifecycle = (
    stage: 'lifecycle_started' | 'lifecycle_completed',
    evidence: {
      callId: string
      owner: 'app' | 'provider'
      purpose: string
      parentCallId?: string
    },
    elapsedMs = Math.max(0, now() - startedAt)
  ) => {
    const record = {
      event: 'ai_request_trace',
      schemaVersion: 2,
      requestId,
      sequence: ++sequence,
      stage,
      callId: evidence.callId,
      elapsedMs,
      recordedAt: new Date().toISOString(),
      evidence
    }
    persist(record)
    try {
      log(JSON.stringify(record))
    } catch {
      /* Diagnostics cannot fail work. */
    }
  }
  const root = {
    callId: 'request-lifecycle',
    owner: 'app' as const,
    purpose: 'Compose, execute and settle this provider invocation'
  }
  if (options.lifecycle) lifecycle('lifecycle_started', root, 0)
  return {
    requestId,
    span(evidence: {
      callId: string
      owner: 'app' | 'provider'
      purpose: string
      parentCallId?: string
    }): () => void {
      if (finished) return () => undefined
      lifecycle('lifecycle_started', evidence)
      let closed = false
      return () => {
        if (closed || finished) return
        closed = true
        lifecycle('lifecycle_completed', evidence)
      }
    },
    recordTransport(
      direction: 'sent' | 'received',
      bytes: number,
      stream: 'protocol' | 'diagnostic' = 'protocol'
    ): void {
      if (finished || !Number.isSafeInteger(bytes) || bytes < 0) return
      const key = direction === 'sent' ? 'sentBytes' : 'receivedBytes'
      if (stream === 'protocol') transport[key] += bytes
      persist({
        event: 'ai_request_trace',
        schemaVersion: 2,
        requestId,
        sequence: ++sequence,
        stage: 'transport_chunk',
        elapsedMs: Math.max(0, now() - startedAt),
        recordedAt: new Date().toISOString(),
        evidence: { direction, bytes, stream }
      })
    },
    trace(
      stage:
        | 'action_started'
        | 'action_completed'
        | 'action_failed'
        | 'provider_transport_event'
        | 'provider_notification'
        | 'provider_notifications'
        | 'tool_delivery_failed'
        | 'tool_started'
        | 'tool_execution_started'
        | 'tool_completed'
        | 'tool_failed'
        | 'research_started'
        | 'research_completed'
        | 'orchestration_completed'
        | 'protocol_rejected'
        | 'settlement'
        | 'visual_assessment_context'
        | 'capabilities_advertised'
        | 'provider_request_started'
        | 'provider_request_completed'
        | 'provider_request_failed'
        | 'provider_item_started'
        | 'provider_item_completed',
      evidence: unknown
    ): void {
      if (finished) return
      const observedElapsedMs = Math.max(0, now() - startedAt)
      try {
        if (isRecord(evidence) && typeof evidence.callId === 'string') {
          const research = stage.startsWith('research_')
          const key = `${research ? 'research' : 'tool'}:${evidence.callId}`
          if (stage === 'tool_started' || stage === 'research_started') {
            if (!activeIntervals.size) intervalStartedAt = now()
            activeIntervals.add(key)
          } else if (
            stage === 'tool_completed' ||
            stage === 'tool_failed' ||
            stage === 'research_completed'
          ) {
            if (activeIntervals.delete(key) && !activeIntervals.size)
              observedToolAndResearchMs += Math.max(
                0,
                now() - intervalStartedAt
              )
          }
        }
        let diagnostic:
          | {
              input?: unknown
              output?: unknown
              attribution?: unknown
              contracts?: unknown
            }
          | undefined
        if (isRecord(evidence) && typeof evidence.callId === 'string') {
          const payload = (phase: 'input' | 'output', value: unknown) =>
            options.sink?.writePayload?.(
              requestId,
              evidence.callId as string,
              phase,
              value
            ) ?? { status: 'unavailable', path: null }
          if (stage === 'visual_assessment_context')
            diagnostic = {
              input: { payload: payload('input', evidence.arguments) }
            }
          if (stage === 'provider_notifications')
            diagnostic = {
              output: {
                payload: payload('output', evidence.notificationCounts)
              }
            }
          if (stage === 'capabilities_advertised')
            diagnostic = { contracts: payload('input', evidence.definitions) }
          if (stage === 'tool_started' || stage === 'action_started')
            diagnostic = {
              attribution: {
                actor: evidence.actor ?? null,
                executor: evidence.executor ?? null,
                parentCallId: correlationId(evidence.parentCallId) ?? null,
                retryOf: correlationId(evidence.retryOf) ?? null,
                nativeThreadId: correlationId(evidence.nativeThreadId) ?? null,
                nativeTurnId: correlationId(evidence.nativeTurnId) ?? null,
                contractDigest: evidence.contractDigest ?? null,
                purpose: summarizeEvidence(evidence.purpose) ?? null,
                purposeSource: evidence.purposeSource ?? 'unavailable',
                expectedResult:
                  summarizeEvidence(evidence.expectedResult) ?? null,
                expectationSource: evidence.expectationSource ?? 'unavailable',
                timingScope: evidence.timingScope ?? 'unavailable'
              },
              input: {
                ...payloadDiagnostic(evidence.arguments),
                payload: payload('input', evidence.arguments)
              }
            }
          if (
            [
              'tool_completed',
              'tool_failed',
              'action_completed',
              'action_failed'
            ].includes(stage)
          ) {
            const output = evidence.result ?? {
              code: evidence.code,
              reason: evidence.reason
            }
            diagnostic = {
              output: {
                ...outputDiagnostic(
                  evidence.result,
                  stage.endsWith('_failed'),
                  evidence.reason
                ),
                payload: payload('output', output)
              }
            }
          }
        }
        const summarized = summarizeEvidence(evidence)
        const serialized = JSON.stringify(summarized)
        const record = {
          event: 'ai_request_trace',
          diagnostic,
          schemaVersion: 2,
          requestId,
          conversationId,
          turnId,
          sequence: ++sequence,
          stage,
          tool: isRecord(evidence)
            ? summarizeEvidence(evidence.tool)
            : undefined,
          callId: isRecord(evidence)
            ? summarizeEvidence(evidence.callId)
            : undefined,
          elapsedMs: observedElapsedMs,
          recordedAt: new Date().toISOString(),
          evidence:
            serialized.length <= 6000
              ? summarized
              : {
                  truncated: true,
                  reason: 'Evidence exceeded the per-event log budget.'
                }
        }
        persist(record)
        log(JSON.stringify(record))
      } catch {
        // A diagnostic sink must not alter execution or settlement.
      }
    },
    update(value: unknown): void {
      if (finished) return
      const total = isRecord(value) ? value.total : undefined
      if (
        !isRecord(total) ||
        !tokenFields.every(
          (field) =>
            Number.isSafeInteger(total[field]) && (total[field] as number) >= 0
        )
      ) {
        invalidSnapshot = true
        return
      }
      const snapshot = Object.fromEntries(
        tokenFields.map((field) => [field, total[field]])
      ) as TokenUsage
      if (
        snapshot.cachedInputTokens > snapshot.inputTokens ||
        snapshot.reasoningOutputTokens > snapshot.outputTokens ||
        !Number.isSafeInteger(snapshot.inputTokens + snapshot.outputTokens) ||
        snapshot.totalTokens !== snapshot.inputTokens + snapshot.outputTokens
      ) {
        invalidSnapshot = true
        return
      }
      const previous = tokens
      if (
        previous &&
        tokenFields.some((field) => snapshot[field] < previous[field])
      )
        return
      tokens = snapshot
    },
    finish(outcome: UsageOutcome): void {
      if (finished) return
      finished = true
      let usageStatus = 'unavailable'
      if (tokens !== null) {
        usageStatus =
          outcome === 'completed' && !invalidSnapshot ? 'reported' : 'partial'
      }
      const durationMs = Math.max(0, now() - startedAt)
      if (options.lifecycle) lifecycle('lifecycle_completed', root, durationMs)
      const observedMs = Math.min(
        durationMs,
        observedToolAndResearchMs +
          (activeIntervals.size ? Math.max(0, now() - intervalStartedAt) : 0)
      )
      const report = {
        event: 'ai_request_usage',
        schemaVersion: 2,
        requestId,
        sequence: ++sequence,
        provider: options.provider ?? null,
        model,
        conversationId,
        turnId,
        replyToTurnId,
        attempt:
          Number.isSafeInteger(input.attempt) && input.attempt > 0
            ? input.attempt
            : undefined,
        finishedAt: new Date().toISOString(),
        durationMs,
        timing: {
          observedToolAndResearchMs: observedMs,
          outsideToolAndResearchMs: durationMs - observedMs
        },
        transport: { ...transport },
        recordingFailures,
        outcome,
        usageStatus,
        tokens
      }
      // Diagnostics must never change the drawing request's settlement.
      persist(report)
      try {
        log(JSON.stringify(report))
      } catch {
        // The process log sink may already be closed during shutdown.
      }
    }
  }
}

import { randomUUID } from 'node:crypto'
import type { AiProviderInput } from '../src/ai/action-batch-protocol'

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
  'tool',
  'namespace',
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
  'complete',
  'outcome',
  'code',
  'durationMs',
  'queueMs',
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
    return value
      .replace(/https?:\/\/[^\s"<>]+/g, (address) => {
        try {
          const url = new URL(address)
          return url.origin + url.pathname
        } catch {
          return '[invalid URL]'
        }
      })
      .slice(0, 500)
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
      .map(([key, item]) => [key, summarizeEvidence(item, depth + 1, budget)])
  )
}

/** One bounded accumulator per provider invocation; provider totals are snapshots, not deltas. */
export const createLocalAiUsage = (input: AiProviderInput, model: string) => {
  const requestId = randomUUID()
  const startedAt = Date.now()
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
  const activeIntervals = new Set<string>()
  let intervalStartedAt = 0
  let observedToolAndResearchMs = 0
  return {
    trace(
      stage:
        | 'tool_started'
        | 'tool_execution_started'
        | 'tool_completed'
        | 'tool_failed'
        | 'research_started'
        | 'research_completed'
        | 'orchestration_completed'
        | 'protocol_rejected'
        | 'settlement',
      evidence: unknown
    ): void {
      if (finished) return
      try {
        if (isRecord(evidence) && typeof evidence.callId === 'string') {
          const research = stage.startsWith('research_')
          const key = `${research ? 'research' : 'tool'}:${evidence.callId}`
          if (stage === 'tool_started' || stage === 'research_started') {
            if (!activeIntervals.size) intervalStartedAt = Date.now()
            activeIntervals.add(key)
          } else if (
            stage === 'tool_completed' ||
            stage === 'tool_failed' ||
            stage === 'research_completed'
          ) {
            if (activeIntervals.delete(key) && !activeIntervals.size)
              observedToolAndResearchMs += Math.max(
                0,
                Date.now() - intervalStartedAt
              )
          }
        }
        const summarized = summarizeEvidence(evidence)
        const serialized = JSON.stringify(summarized)
        console.info(
          JSON.stringify({
            event: 'ai_request_trace',
            schemaVersion: 1,
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
            elapsedMs: Math.max(0, Date.now() - startedAt),
            evidence:
              serialized.length <= 12000
                ? summarized
                : {
                    truncated: true,
                    reason: 'Evidence exceeded the per-event log budget.'
                  }
          })
        )
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
      const durationMs = Math.max(0, Date.now() - startedAt)
      const observedMs = Math.min(
        durationMs,
        observedToolAndResearchMs +
          (activeIntervals.size
            ? Math.max(0, Date.now() - intervalStartedAt)
            : 0)
      )
      const report = {
        event: 'ai_request_usage',
        schemaVersion: 1,
        requestId,
        provider: 'local-codex',
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
          unattributedMs: durationMs - observedMs
        },
        outcome,
        usageStatus,
        tokens
      }
      // Diagnostics must never change the drawing request's settlement.
      try {
        console.info(JSON.stringify(report))
      } catch {
        // The process log sink may already be closed during shutdown.
      }
    }
  }
}

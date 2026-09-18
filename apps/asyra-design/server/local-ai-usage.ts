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
  return {
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
        durationMs: Math.max(0, Date.now() - startedAt),
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

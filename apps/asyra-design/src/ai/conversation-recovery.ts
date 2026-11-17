import type { AiSettledTurn } from './conversation'

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Consume only results delivered by the composed Feature. No transaction may be replayed. */
export const canRetryAiTurn = (turn: AiSettledTurn): boolean => {
  const result = turn.result
  if (!record(result) || Object.hasOwn(result, 'transaction')) return false
  if (turn.outcome === 'cancelled') {
    if (
      result.status !== 'cancelled' ||
      !['aborted', 'confirmation-cancelled'].includes(String(result.reason))
    )
      return false
    if (!Object.hasOwn(result, 'audit')) {
      // The Feature's explicit abort-before-run terminal result has exactly this shape.
      return (
        result.reason === 'aborted' &&
        Object.keys(result).every((key) => key === 'status' || key === 'reason')
      )
    }
    const audit = result.audit
    return (
      record(audit) &&
      audit.outcome === 'cancelled' &&
      Array.isArray(audit.actions) &&
      audit.actions.length === 0 &&
      typeof audit.retryCount === 'number' &&
      Number.isSafeInteger(audit.retryCount) &&
      audit.retryCount >= 0 &&
      !Object.hasOwn(result, 'actionResults') &&
      !Object.hasOwn(result, 'stage')
    )
  }
  return (
    turn.outcome === 'failed' &&
    result.status === 'failed' &&
    [
      'context',
      'provider',
      'resolution',
      'permission',
      'confirmation'
    ].includes(String(result.stage))
  )
}

import { createHash } from 'node:crypto'
import type {
  AiActionBatch,
  AiProviderInput,
  AiBatchReceipt
} from '../provider.js'

export const toolContractDigest = (definition: unknown) =>
  createHash('sha256').update(JSON.stringify(definition)).digest('hex')

type ExecuteAiBatch = (batch: AiActionBatch) => Promise<AiBatchReceipt>
export interface AiObservedBatchFailure {
  code: string
  message: string
  actionName: string | null
  executionMs: number
  handlerMs: number | null
}

/** Observe the real browser exchange before compact receipts discard acknowledgements.
 * Windows cover the batch handoff, not individual browser CPU time. */
export const observeActionBatch = async (
  batch: AiActionBatch,
  execute: ExecuteAiBatch,
  definitions: AiProviderInput['actions'],
  parentCallId: string | undefined,
  trace: (
    stage: 'action_started' | 'action_completed' | 'action_failed',
    evidence: Record<string, unknown>
  ) => void,
  failureFromError?: (error: unknown) => AiObservedBatchFailure | undefined
) => {
  const emit: typeof trace = (stage, evidence) => {
    try {
      trace(stage, evidence)
    } catch {
      /* Diagnostics never alter canonical execution. */
    }
  }
  const definitionsByName = new Map(
    definitions.map((item) => [item.name, item])
  )
  for (const action of batch.actions) {
    const definition = definitionsByName.get(action.name)
    emit('action_started', {
      callId: `action:${batch.batchId}:${action.id}`,
      parentCallId: parentCallId ?? null,
      batchId: batch.batchId,
      tool: action.name,
      actor: 'app-server',
      executor: 'app-browser',
      purpose: action.summary,
      purposeSource: 'action-summary',
      expectedResult: definition?.description ?? null,
      expectationSource: 'registered-contract',
      contractDigest: definition ? toolContractDigest(definition) : null,
      timingScope: 'batch-exchange',
      arguments: action.arguments
    })
  }
  try {
    const receipt = await execute(batch)
    const resultsById = new Map(
      receipt.actionResults.map((item) => [item.actionId, item])
    )
    for (const action of batch.actions) {
      const candidate = resultsById.get(action.id)
      const result =
        candidate?.actionName === action.name ? candidate : undefined
      emit(receipt.failure && !result ? 'action_failed' : 'action_completed', {
        callId: `action:${batch.batchId}:${action.id}`,
        tool: action.name,
        result:
          result?.result ??
          (receipt.failure
            ? {
                ...receipt.failure,
                status:
                  receipt.failure.actionId === action.id
                    ? 'failed'
                    : 'not-started',
                settlement:
                  receipt.failure.actionId === action.id
                    ? receipt.failure.settlement
                    : 'not-started'
              }
            : {
                status: 'unknown',
                code: 'ACTION_RECEIPT_MISSING',
                message:
                  'No matching acknowledgement; execution and result correctness are unknown.'
              })
      })
    }
    // Keep diagnostics out of the model contract and compact acknowledgement path.
    if (
      !receipt.actionResults.some(
        (entry) =>
          entry.result &&
          typeof entry.result === 'object' &&
          !Array.isArray(entry.result) &&
          'actionObservation' in entry.result
      )
    )
      return receipt
    return {
      ...receipt,
      actionResults: receipt.actionResults.map((entry) => {
        const value = entry.result
        if (
          !value ||
          typeof value !== 'object' ||
          Array.isArray(value) ||
          !('actionObservation' in value)
        )
          return entry
        const { actionObservation: _observation, ...result } = value
        return { ...entry, result }
      })
    }
  } catch (error) {
    let failure: AiObservedBatchFailure | undefined
    try {
      failure = failureFromError?.(error)
    } catch {
      /* Preserve the canonical error. */
    }
    const identified =
      failure &&
      batch.actions.filter((action) => action.name === failure.actionName)
        .length === 1
    for (const action of batch.actions)
      emit('action_failed', {
        callId: `action:${batch.batchId}:${action.id}`,
        tool: action.name,
        code: failure?.code ?? 'ACTION_EXCHANGE_FAILED',
        reason:
          failure?.message ??
          'The batch exchange failed; individual action settlement is unknown. Do not replay automatically.',
        ...(failure
          ? {
              result: {
                status:
                  identified && action.name === failure.actionName
                    ? 'failed'
                    : 'unknown',
                code: failure.code,
                message: failure.message,
                settlement: 'unknown',
                actionObservation: {
                  executor: 'app-browser',
                  executionMs: failure.executionMs,
                  ...(identified &&
                  action.name === failure.actionName &&
                  failure.handlerMs !== null
                    ? { handlerMs: failure.handlerMs }
                    : {})
                }
              }
            }
          : {})
      })
    throw error
  }
}

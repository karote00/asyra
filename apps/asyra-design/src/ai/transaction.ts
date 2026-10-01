import {
  AiTransactionSettlementError,
  type AiMutationExecutor,
  type AiTransactionRunner
} from '@asyra/ai-agent-runtime'
import type { HistoryGroupHandle } from '@asyra/core'
import { measureBrowserDragAsyncPhase } from '@asyra/utils'
import { transactionApis } from '../common-apis'
import type { AiHistoryProjection } from '../common-apis/history'

export type AiHistoryGroupApis = Pick<
  typeof transactionApis,
  | 'isTransactionBoundaryIdle'
  | 'startHistoryGroup'
  | 'updateHistoryGroup'
  | 'endHistoryGroup'
  | 'subscribeToTransactionStatus'
>

export interface CreateAiTransactionRunnerOptions {
  readonly history?: Pick<
    AiHistoryProjection,
    'correlateCommittedAction' | 'getCurrentActionId'
  >
  readonly apis?: AiHistoryGroupApis
}

/** Check and enter in the same synchronous turn. Settlement observers only wake
 * the caller; they never capture an unrelated interaction or reserve its owner. */
const atIdleBoundary = <T>(
  apis: AiHistoryGroupApis,
  operation: () => T,
  signal?: AbortSignal
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    let settled = false
    const cleanup = () => {
      unsubscribe()
      signal?.removeEventListener('abort', check)
    }
    const check = () => {
      if (settled) return
      try {
        signal?.throwIfAborted()
        if (!apis.isTransactionBoundaryIdle()) return
        settled = true
        cleanup()
        resolve(operation())
      } catch (error) {
        settled = true
        cleanup()
        reject(error)
      }
    }
    const unsubscribe = apis.subscribeToTransactionStatus(() =>
      queueMicrotask(check)
    )
    signal?.addEventListener('abort', check, { once: true })
    check()
    // A caller inside a synchronous notification must wait until it unwinds.
    // An open interaction then waits for its real settlement, without polling.
    if (!settled) queueMicrotask(check)
  })

export const createAiTransactionRunner = (
  options: CreateAiTransactionRunnerOptions = {}
): AiTransactionRunner => {
  const { history, apis = transactionApis } = options
  return Object.freeze({
    run: async <T>(
      _label: string,
      execute: (runMutation?: AiMutationExecutor) => Promise<T>,
      request?: { readonly signal: AbortSignal }
    ): Promise<T> => {
      let group: HistoryGroupHandle | undefined
      let accepting = true
      const runMutation: AiMutationExecutor = (mutate) =>
        atIdleBoundary(
          apis,
          () => {
            if (!accepting) throw new Error('The AI mutation scope has closed.')
            group ??= apis.startHistoryGroup()
            return apis.updateHistoryGroup(group, mutate)
          },
          request?.signal
        )
      let value!: T
      let failed = false
      let cause: unknown
      try {
        value = await measureBrowserDragAsyncPhase('ai-app:transaction', () =>
          measureBrowserDragAsyncPhase('ai-app:transaction-execute', () =>
            execute(runMutation)
          )
        )
      } catch (error) {
        failed = true
        cause = error
      }
      accepting = false
      let committed = false
      try {
        if (group) {
          const handle = group
          // Request cancellation stops future writes, not settlement of work
          // already committed. Wait for an unrelated active user transaction.
          await atIdleBoundary(apis, () => {
            const before = history?.getCurrentActionId() ?? null
            const status = apis.endHistoryGroup(handle)
            committed = status.memberCount > 0
            const after = history?.getCurrentActionId() ?? null
            if (committed && after !== null && after !== before)
              history?.correlateCommittedAction(after)
          })
        }
      } catch (error) {
        throw new AiTransactionSettlementError(error, 'unknown')
      }
      if (failed)
        throw new AiTransactionSettlementError(
          cause,
          committed ? 'committed' : 'rolled-back'
        )
      return value
    }
  })
}

import type { AllEvent } from './constants.js'
export type TransactionReplayMode = 'rollback' | 'undo' | 'redo'

interface TransactionReplayContext {
  mode: TransactionReplayMode
  applied: boolean
  token: symbol
  restorationEvents?: readonly AllEvent[]
}

let activeReplayContext: TransactionReplayContext | null = null
const appliedReplayFailures = new WeakMap<
  object,
  { token: symbol; applied: boolean; restorationEvents?: readonly AllEvent[] }
>()
let lastPrimitiveReplayFailure:
  | {
      failure: unknown
      token: symbol
      applied: boolean
      restorationEvents?: readonly AllEvent[]
    }
  | undefined

const isObjectFailure = (failure: unknown): failure is object =>
  (typeof failure === 'object' && failure !== null) ||
  typeof failure === 'function'

export const getTransactionReplayMode = (): TransactionReplayMode | null =>
  activeReplayContext?.mode ?? null

/** Complete restoration prepared by the canonical owner, never a partial journal. */
export const acknowledgeTransactionReplayApplied = (
  restorationEvents?: readonly AllEvent[]
): void => {
  if (activeReplayContext) {
    activeReplayContext.applied = true
    if (restorationEvents)
      activeReplayContext.restorationEvents = Object.freeze([
        ...restorationEvents,
        ...(activeReplayContext.restorationEvents ?? [])
      ])
  }
}

export const getTransactionReplayRestorationEvents = ():
  readonly AllEvent[] | undefined => activeReplayContext?.restorationEvents

export const getFailedTransactionReplayRestorationEvents = (
  failure: unknown
): readonly AllEvent[] | undefined => {
  if (isObjectFailure(failure))
    return appliedReplayFailures.get(failure)?.restorationEvents
  if (
    lastPrimitiveReplayFailure &&
    Object.is(lastPrimitiveReplayFailure.failure, failure)
  )
    return lastPrimitiveReplayFailure.restorationEvents
  return undefined
}

export const isTransactionReplayApplied = (): boolean =>
  activeReplayContext?.applied === true

export const wasTransactionReplayApplied = (failure: unknown): boolean => {
  if (isObjectFailure(failure)) {
    return appliedReplayFailures.get(failure)?.applied === true
  }

  return (
    lastPrimitiveReplayFailure?.applied === true &&
    Object.is(lastPrimitiveReplayFailure.failure, failure)
  )
}

const combineRestorationEvents = (
  context: TransactionReplayContext,
  nested: { token: symbol; restorationEvents?: readonly AllEvent[] } | undefined
): readonly AllEvent[] | undefined => {
  const nestedEvents =
    nested?.token === context.token ? nested.restorationEvents : undefined
  if (!nestedEvents) return context.restorationEvents
  return Object.freeze([...nestedEvents, ...(context.restorationEvents ?? [])])
}

export const runInTransactionReplayMode = <T>(
  mode: TransactionReplayMode,
  callback: () => T
): T => {
  const previousContext = activeReplayContext
  const context: TransactionReplayContext = {
    mode,
    applied: false,
    token: previousContext?.token ?? Symbol('transaction-replay')
  }
  activeReplayContext = context
  try {
    return callback()
  } catch (failure) {
    if (isObjectFailure(failure)) {
      const nestedFailure = appliedReplayFailures.get(failure)
      appliedReplayFailures.set(failure, {
        token: context.token,
        restorationEvents: combineRestorationEvents(context, nestedFailure),
        applied:
          context.applied ||
          (nestedFailure?.token === context.token && nestedFailure.applied)
      })
    } else {
      const nestedFailure = lastPrimitiveReplayFailure
      lastPrimitiveReplayFailure = {
        failure,
        token: context.token,
        restorationEvents: combineRestorationEvents(
          context,
          nestedFailure && Object.is(nestedFailure.failure, failure)
            ? nestedFailure
            : undefined
        ),
        applied:
          context.applied ||
          (nestedFailure?.token === context.token &&
            Object.is(nestedFailure.failure, failure) &&
            nestedFailure.applied)
      }
    }
    throw failure
  } finally {
    activeReplayContext = previousContext
  }
}

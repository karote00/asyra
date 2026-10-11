export type TransactionOutcome = 'commit' | 'rollback'

export type TransactionOrigin =
  'action' | 'automation' | 'remote' | 'undo' | 'redo' | 'load-migration'

export type TransactionFailureKind =
  | 'cancelled'
  | 'handler-error'
  | 'handler-timeout'
  | 'validation-failed'
  | 'explicit'

export interface TransactionFailure {
  kind: TransactionFailureKind
  message?: string
  cause?: unknown
}

export interface EndTransactionOptions {
  outcome?: TransactionOutcome
  failure?: TransactionFailure
}

export interface RunTransactionOptions {
  failureKind?: TransactionFailureKind
}

export interface TransactionBoundaryPayload {
  outcome: TransactionOutcome
  failure?: TransactionFailure
}

export type TransactionStatus =
  | 'discarded'
  | 'committed'
  | 'rolled-back'
  | 'rollback-failed'
  | 'persistence-skipped'
  | 'persisted'
  | 'persistence-failed'

export interface TransactionStatusPayload {
  transactionId: number
  origin: TransactionOrigin
  status: TransactionStatus
  changeCount: number
  undoableChangeCount: number
  rollbackableChangeCount: number
  nonRollbackableChangeCount: number
  failure?: TransactionFailure
  providerName?: string
  error?: unknown
  timestamp: number
}

/** A canonical owner could not prove recovery, even before journal admission. */
export class MutationRecoveryError extends Error {
  readonly cause: unknown
  readonly recoveryFailures: readonly unknown[]
  constructor(cause: unknown, recoveryFailures: readonly unknown[]) {
    super('Canonical mutation recovery could not be verified')
    this.cause = cause
    this.name = 'MutationRecoveryError'
    this.recoveryFailures = Object.freeze([...recoveryFailures])
  }
}

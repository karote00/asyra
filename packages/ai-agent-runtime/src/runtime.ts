import {
  AiActionRegistryError,
  createAiActionRegistry
} from './action-registry.js'
import {
  AiAuditError,
  createAiRuntimeAudit,
  type AiRuntimeAudit
} from './audit.js'
import {
  AiActionBatchResolutionError,
  AiActionBatchContractError,
  resolveAiActionBatchWithRegistry,
  type AiActionBatchResolutionErrorCode,
  type ResolvedAiAction,
  type ResolvedAiActionBatch
} from './action-batch.js'
import {
  AiRetryPolicyError,
  MAX_AI_PROVIDER_ATTEMPTS,
  shouldRetryAiProviderFailure,
  toAiProviderRequestFailure,
  type AiProviderRequestFailure,
  type AiRetryPolicy
} from './provider-retry.js'
import type { AiActionBatch, AiProvider } from './provider.js'
import {
  AI_REDACTED_VALUE,
  redactAiValue,
  type AiRedactionOptions
} from './redaction.js'
import type {
  AiActionDefinition,
  AiActionRegistry,
  AiActionRegistryErrorCode,
  AiJsonValue
} from './types.js'

export interface AiContextProvider {
  getContext(input: { intent: string; signal: AbortSignal }): Promise<unknown>
}

export type AiPermissionDecision = 'allow' | 'confirm' | 'deny'

export interface AiPermissionAction {
  readonly id: string
  readonly name: string
  readonly arguments: ResolvedAiAction['arguments']
}

export interface AiPermissionPolicy<TContext = unknown> {
  evaluate(input: {
    action: AiPermissionAction
    context: TContext
  }): AiPermissionDecision | Promise<AiPermissionDecision>
}

export interface AiConfirmationHandler {
  confirm(
    preview: AiActionBatchPreview,
    options: { signal: AbortSignal }
  ): Promise<boolean>
}

export interface AiTransactionRunner {
  /** Reject with the original callback error only after successful rollback;
   * reject with a distinct error if transaction settlement itself fails. */
  run<T>(label: string, execute: () => Promise<T>): Promise<T>
}

export const AI_ACTION_BATCH_TRANSACTION_LABEL = 'AI-assisted action'

export class AiTransactionError extends Error {
  readonly code = 'AI_TRANSACTION_ABORTED' as const
  readonly stage = 'transaction' as const

  constructor() {
    super('AI action batch transaction was aborted.')
    this.name = 'AiTransactionError'
  }
}

export interface AiActionExecutionResult {
  readonly actionId: string
  readonly actionName: string
  readonly result: AiJsonValue
}

export interface AiActionExecutionBatch {
  readonly actionResults: readonly AiActionExecutionResult[]
}

export class AiExecutionError extends Error {
  readonly code = 'AI_EXECUTION_ABORTED' as const
  readonly stage = 'execution' as const

  constructor() {
    super('AI action execution was aborted.')
    this.name = 'AiExecutionError'
  }
}

/** Registered executors may explicitly expose a bounded, safe explanation.
 * Never construct this from raw provider, transport, or canonical exceptions. */
export class AiActionExecutionError extends Error {
  readonly code = 'AI_EXECUTION_FAILED' as const
  readonly stage = 'execution' as const

  constructor(publicMessage: string) {
    super(
      publicMessage.trim() && publicMessage.length <= 1000
        ? publicMessage
        : 'AI action execution failed.'
    )
    this.name = 'AiActionExecutionError'
  }
}

export interface AiRuntimeOwnedResource {
  dispose(): void | Promise<void>
}

export interface AiRuntimeOptions {
  /** Commit applied progress on ordinary failure; cancellation still rolls back. */
  readonly failurePolicy?: 'rollback' | 'preserve-progress'
  readonly redaction?: AiRedactionOptions
  readonly retryPolicy?: AiRetryPolicy
}

export interface CreateAiAgentRuntimeInput {
  provider: AiProvider
  actionDefinitions: readonly AiActionDefinition[]
  contextProvider: AiContextProvider
  permissionPolicy: AiPermissionPolicy
  confirmationHandler: AiConfirmationHandler
  transactionRunner: AiTransactionRunner
  options?: AiRuntimeOptions
  ownedResources?: readonly AiRuntimeOwnedResource[]
}

export type AiRuntimeProgressPhase =
  | 'confirmation'
  | 'context'
  | 'execution'
  | 'permission'
  | 'provider'
  | 'resolution'
  | 'settled'

export type AiRuntimeProgressOutcome = 'cancelled' | 'executed' | 'failed'

export interface AiRuntimeProgressUpdate {
  readonly message?: string
  readonly tool?: string
  readonly toolStatus?: 'running' | 'completed'
  readonly actionCount?: number
  readonly attempt: number
  readonly outcome?: AiRuntimeProgressOutcome
  readonly phase: AiRuntimeProgressPhase
  readonly batchId?: string
  readonly summary: string
}

export type AiRuntimeProgressObserver = (
  update: AiRuntimeProgressUpdate
) => void

export interface AiRunRequest {
  readonly intent: string
  readonly metadata?: AiJsonValue
  readonly progressObserver?: AiRuntimeProgressObserver
  readonly signal: AbortSignal
}

export type AiRuntimeStage =
  | 'audit'
  | 'confirmation'
  | 'context'
  | 'execution'
  | 'permission'
  | 'provider'
  | 'registry'
  | 'resolution'
  | 'runtime'
  | 'transaction'

export type AiRuntimeFailureCode =
  | AiActionRegistryErrorCode
  | AiActionBatchResolutionErrorCode
  | AiConfirmationErrorCode
  | AiPermissionErrorCode
  | AiProviderRequestFailure['code']
  | 'AI_ACTION_REGISTRY_FAILED'
  | 'AI_AUDIT_FAILED'
  | 'AI_AUDIT_INVALID_INPUT'
  | 'AI_CONTEXT_FAILED'
  | 'AI_EXECUTION_ABORTED'
  | 'AI_EXECUTION_FAILED'
  | 'AI_RESOLUTION_FAILED'
  | 'AI_RETRY_POLICY_FAILED'
  | 'AI_RETRY_POLICY_INVALID'
  | 'AI_RUNTIME_DISPOSED'
  | 'AI_RUNTIME_FAILED'
  | 'AI_RUNTIME_INVALID_INTENT'
  | 'AI_TRANSACTION_ABORTED'
  | 'AI_TRANSACTION_FAILED'

export interface AiRuntimeExecutedResult {
  readonly status: 'executed'
  readonly batchId: string
  readonly preview: AiActionBatchPreview
  readonly actionResults: readonly AiActionExecutionResult[]
  readonly transaction: {
    readonly status: 'committed'
  }
  readonly audit: AiRuntimeAudit
}

export interface AiRuntimeCancelledResult {
  readonly transaction?: { readonly status: 'rolled-back' | 'unknown' }
  readonly status: 'cancelled'
  readonly reason: 'aborted' | 'confirmation-cancelled'
  readonly preview?: AiActionBatchPreview
  readonly audit: AiRuntimeAudit
}

export interface AiRuntimeFailedResult {
  readonly actionResults?: readonly AiActionExecutionResult[]
  readonly failedAction?: string
  readonly transaction?: {
    readonly status: 'committed' | 'rolled-back' | 'unknown'
  }
  readonly status: 'failed'
  readonly batchId?: string
  readonly code: AiRuntimeFailureCode
  readonly message: string
  readonly preview?: AiActionBatchPreview
  readonly stage: AiRuntimeStage
  readonly retryCount: number
  readonly audit: AiRuntimeAudit
}

export type AiRuntimeResult =
  AiRuntimeCancelledResult | AiRuntimeExecutedResult | AiRuntimeFailedResult

export interface AiAgentRuntime {
  resolveAiActionBatch(
    batch: AiActionBatch,
    options: { readonly signal: AbortSignal }
  ): ResolvedAiActionBatch
  run(request: AiRunRequest): Promise<AiRuntimeResult>
  dispose(): Promise<void>
}

export interface AiPermissionReadyAction extends ResolvedAiAction {
  readonly permission: Exclude<AiPermissionDecision, 'deny'>
}

export interface PermissionReadyAiActionBatch {
  readonly batchId: string
  readonly explanation?: string
  readonly actions: readonly AiPermissionReadyAction[]
  readonly confirmationRequired: boolean
}

export interface AiActionBatchPreviewAction {
  readonly id: string
  readonly name: string
  readonly permission: Exclude<AiPermissionDecision, 'deny'>
  readonly summary: AiJsonValue
}

export interface AiActionBatchPreview {
  readonly batchId: string
  readonly explanation?: string
  readonly actions: readonly AiActionBatchPreviewAction[]
}

export interface ConfirmedAiActionBatch extends PermissionReadyAiActionBatch {
  readonly confirmation: 'accepted' | 'bypassed'
  readonly preview: AiActionBatchPreview
}

export type AiPermissionErrorCode =
  'AI_PERMISSION_DENIED' | 'AI_PERMISSION_POLICY_FAILED'

export class AiPermissionError extends Error {
  readonly code: AiPermissionErrorCode
  readonly deniedActionIds: readonly string[]
  readonly stage = 'permission' as const

  constructor(
    code: AiPermissionErrorCode,
    message: string,
    deniedActionIds: readonly string[] = []
  ) {
    super(message)
    this.name = 'AiPermissionError'
    this.code = code
    this.deniedActionIds = Object.freeze([...deniedActionIds])
  }
}

export type AiConfirmationErrorCode =
  | 'AI_CONFIRMATION_ABORTED'
  | 'AI_CONFIRMATION_CANCELLED'
  | 'AI_CONFIRMATION_HANDLER_FAILED'

export class AiConfirmationError extends Error {
  readonly code: AiConfirmationErrorCode
  readonly stage = 'confirmation' as const

  constructor(code: AiConfirmationErrorCode, message: string) {
    super(message)
    this.name = 'AiConfirmationError'
    this.code = code
  }
}

const permissionPolicyFailed = (): never => {
  throw new AiPermissionError(
    'AI_PERMISSION_POLICY_FAILED',
    'App permission policy failed.'
  )
}

const isPermissionDecision = (value: unknown): value is AiPermissionDecision =>
  value === 'allow' || value === 'confirm' || value === 'deny'

export const evaluateAiActionBatchPermissions = async <TContext>(
  batch: ResolvedAiActionBatch,
  context: TContext,
  policy: AiPermissionPolicy<TContext>
): Promise<PermissionReadyAiActionBatch> => {
  const decisions: AiPermissionDecision[] = []

  for (const action of batch.actions) {
    let decision: unknown
    try {
      decision = await policy.evaluate({
        action: Object.freeze({
          arguments: action.arguments,
          id: action.id,
          name: action.name
        }),
        context
      })
    } catch {
      return permissionPolicyFailed()
    }

    if (!isPermissionDecision(decision)) {
      return permissionPolicyFailed()
    }
    decisions.push(decision)
  }

  const deniedActionIds = batch.actions.flatMap((action, index) =>
    decisions[index] === 'deny' ? [action.id] : []
  )
  if (deniedActionIds.length > 0) {
    throw new AiPermissionError(
      'AI_PERMISSION_DENIED',
      'App permission policy denied the complete action batch.',
      deniedActionIds
    )
  }

  const actions = batch.actions.map((action, index) =>
    Object.freeze({
      ...action,
      permission: decisions[index] as Exclude<AiPermissionDecision, 'deny'>
    })
  )
  const ready: PermissionReadyAiActionBatch = {
    actions: Object.freeze(actions),
    batchId: batch.batchId,
    confirmationRequired: decisions.includes('confirm')
  }
  if (batch.explanation !== undefined) {
    Object.defineProperty(ready, 'explanation', {
      configurable: true,
      enumerable: true,
      value: batch.explanation,
      writable: true
    })
  }

  return Object.freeze(ready)
}

const confirmationError = (
  code: AiConfirmationErrorCode,
  message: string
): never => {
  throw new AiConfirmationError(code, message)
}

const createAiActionBatchPreview = (
  batch: PermissionReadyAiActionBatch,
  redactionOptions: AiRedactionOptions
): AiActionBatchPreview => {
  const actions = batch.actions.map((action) =>
    Object.freeze({
      id: action.id,
      name: action.name,
      permission: action.permission,
      summary: redactAiValue(action.summary, redactionOptions)
    })
  )
  const preview: AiActionBatchPreview = {
    actions: Object.freeze(actions),
    batchId: batch.batchId
  }
  if (batch.explanation !== undefined) {
    const explanation = redactAiValue(batch.explanation, redactionOptions)
    Object.defineProperty(preview, 'explanation', {
      configurable: true,
      enumerable: true,
      value: typeof explanation === 'string' ? explanation : '[REDACTED]',
      writable: true
    })
  }

  return Object.freeze(preview)
}

const createConfirmedActionBatch = (
  batch: PermissionReadyAiActionBatch,
  preview: AiActionBatchPreview,
  confirmation: ConfirmedAiActionBatch['confirmation']
): ConfirmedAiActionBatch =>
  Object.freeze({
    ...batch,
    confirmation,
    preview
  })

const CONFIRMATION_ABORTED = Symbol('CONFIRMATION_ABORTED')

export const confirmAiActionBatch = async (
  batch: PermissionReadyAiActionBatch,
  handler: AiConfirmationHandler,
  signal: AbortSignal,
  redactionOptions: AiRedactionOptions = {}
): Promise<ConfirmedAiActionBatch> => {
  if (signal.aborted) {
    return confirmationError(
      'AI_CONFIRMATION_ABORTED',
      'AI action batch confirmation was aborted.'
    )
  }

  const preview = createAiActionBatchPreview(batch, redactionOptions)
  if (!batch.confirmationRequired) {
    return createConfirmedActionBatch(batch, preview, 'bypassed')
  }

  let abortListener: (() => void) | undefined
  const aborted = new Promise<never>((_resolve, reject) => {
    abortListener = () => reject(CONFIRMATION_ABORTED)
    signal.addEventListener('abort', abortListener, {
      once: true
    })
  })

  try {
    const decision = await Promise.race([
      Promise.resolve().then(() =>
        handler.confirm(preview, {
          signal
        })
      ),
      aborted
    ])

    if (signal.aborted) {
      return confirmationError(
        'AI_CONFIRMATION_ABORTED',
        'AI action batch confirmation was aborted.'
      )
    }

    if (typeof decision !== 'boolean') {
      return confirmationError(
        'AI_CONFIRMATION_HANDLER_FAILED',
        'App confirmation handler failed.'
      )
    }

    if (!decision) {
      return confirmationError(
        'AI_CONFIRMATION_CANCELLED',
        'AI action batch confirmation was cancelled.'
      )
    }

    return createConfirmedActionBatch(batch, preview, 'accepted')
  } catch (error) {
    if (error instanceof AiConfirmationError) {
      throw error
    }

    if (signal.aborted || error === CONFIRMATION_ABORTED) {
      return confirmationError(
        'AI_CONFIRMATION_ABORTED',
        'AI action batch confirmation was aborted.'
      )
    }

    return confirmationError(
      'AI_CONFIRMATION_HANDLER_FAILED',
      'App confirmation handler failed.'
    )
  } finally {
    if (abortListener) {
      signal.removeEventListener('abort', abortListener)
    }
  }
}

const assertTransactionNotAborted = (signal: AbortSignal): void => {
  if (signal.aborted) {
    throw new AiTransactionError()
  }
}

export const runAiActionBatchTransaction = async <T>(
  runner: AiTransactionRunner,
  signal: AbortSignal,
  execute: () => Promise<T>
): Promise<T> => {
  assertTransactionNotAborted(signal)

  return runner.run(AI_ACTION_BATCH_TRANSACTION_LABEL, async () => {
    assertTransactionNotAborted(signal)
    const result = await execute()
    assertTransactionNotAborted(signal)
    return result
  })
}

const assertExecutionNotAborted = (signal: AbortSignal): void => {
  if (signal.aborted) {
    throw new AiExecutionError()
  }
}

export const executeAiActions = async (
  batch: ConfirmedAiActionBatch,
  signal: AbortSignal,
  redactionOptions: AiRedactionOptions = {}
): Promise<AiActionExecutionBatch> => {
  const actionResults: AiActionExecutionResult[] = []
  const context = Object.freeze({
    signal
  })

  for (const action of batch.actions) {
    assertExecutionNotAborted(signal)
    const result = await action.execute(action.arguments, context)
    assertExecutionNotAborted(signal)
    actionResults.push(
      Object.freeze({
        actionId: action.id,
        actionName: action.name,
        result: redactAiValue(result, redactionOptions)
      })
    )
  }

  return Object.freeze({
    actionResults: Object.freeze(actionResults)
  })
}

const INVOCATION_ABORTED = Symbol('INVOCATION_ABORTED')

interface AiInvocationEvidence {
  readonly batch?: Pick<ResolvedAiActionBatch, 'batchId' | 'explanation'>
  readonly preview?: AiActionBatchPreview
  readonly retryCount: number
  readonly executionStarted?: boolean
  readonly transactionStatus?: 'rolled-back' | 'unknown'
}

interface AiStableFailure {
  readonly code: AiRuntimeFailureCode
  readonly message: string
  readonly stage: AiRuntimeStage
}

interface ActiveAiInvocation {
  readonly controller: AbortController
  settlement: Promise<AiRuntimeResult>
}

const emitAiRuntimeProgress = (
  observer: AiRuntimeProgressObserver | undefined,
  signal: AbortSignal,
  update: AiRuntimeProgressUpdate,
  redactionOptions: AiRedactionOptions
): void => {
  if (!observer || signal.aborted) {
    return
  }

  try {
    let batchId = update.batchId
    if (batchId !== undefined) {
      const redacted = redactAiValue({ batchId }, redactionOptions)
      const redactedBatchId =
        typeof redacted === 'object' && redacted !== null
          ? Reflect.get(redacted, 'batchId')
          : undefined
      batchId =
        typeof redactedBatchId === 'string'
          ? redactedBatchId
          : AI_REDACTED_VALUE
    }
    observer(
      Object.freeze({
        ...update,
        ...(batchId === undefined ? {} : { batchId })
      })
    )
  } catch {
    // Progress is observational and cannot alter runtime execution.
  }
}

const runAbortable = async <T>(
  signal: AbortSignal,
  operation: () => Promise<T>
): Promise<T> => {
  if (signal.aborted) {
    throw INVOCATION_ABORTED
  }

  let abortListener: (() => void) | undefined
  const aborted = new Promise<never>((_resolve, reject) => {
    abortListener = () => reject(INVOCATION_ABORTED)
    signal.addEventListener('abort', abortListener, {
      once: true
    })
  })

  try {
    return await Promise.race([Promise.resolve().then(operation), aborted])
  } finally {
    if (abortListener) {
      signal.removeEventListener('abort', abortListener)
    }
  }
}

const stableFailure = (
  error: unknown,
  fallback: AiStableFailure
): AiStableFailure => {
  if (error instanceof AiActionBatchContractError)
    return toAiProviderRequestFailure(error, 1)
  if (error instanceof AiActionBatchResolutionError) {
    return {
      code: error.code,
      message: error.message,
      stage: error.stage
    }
  }
  if (error instanceof AiPermissionError) {
    return {
      code: error.code,
      message: error.message,
      stage: error.stage
    }
  }
  if (error instanceof AiConfirmationError) {
    return {
      code: error.code,
      message: error.message,
      stage: error.stage
    }
  }
  if (error instanceof AiTransactionError) {
    return {
      code: error.code,
      message: error.message,
      stage: error.stage
    }
  }
  if (
    error instanceof AiExecutionError ||
    error instanceof AiActionExecutionError
  ) {
    return {
      code: error.code,
      message: error.message,
      stage: error.stage
    }
  }
  if (error instanceof AiRetryPolicyError) {
    return {
      code: error.code,
      message: error.message,
      stage: 'provider'
    }
  }
  if (error instanceof AiActionRegistryError) {
    return {
      code: error.code,
      message: error.message,
      stage: 'registry'
    }
  }
  if (error instanceof AiAuditError) {
    return {
      code: error.code,
      message: error.message,
      stage: error.stage
    }
  }

  return fallback
}

const STAGE_FAILURES: Readonly<Record<AiRuntimeStage, AiStableFailure>> =
  Object.freeze({
    audit: Object.freeze({
      code: 'AI_AUDIT_FAILED',
      message: 'AI audit output failed.',
      stage: 'audit'
    }),
    confirmation: Object.freeze({
      code: 'AI_CONFIRMATION_HANDLER_FAILED',
      message: 'App confirmation handler failed.',
      stage: 'confirmation'
    }),
    context: Object.freeze({
      code: 'AI_CONTEXT_FAILED',
      message: 'AI context collection failed.',
      stage: 'context'
    }),
    execution: Object.freeze({
      code: 'AI_EXECUTION_FAILED',
      message: 'AI action execution failed.',
      stage: 'execution'
    }),
    permission: Object.freeze({
      code: 'AI_PERMISSION_POLICY_FAILED',
      message: 'App permission policy failed.',
      stage: 'permission'
    }),
    provider: Object.freeze({
      code: 'AI_RETRY_POLICY_FAILED',
      message: 'AI provider retry policy failed.',
      stage: 'provider'
    }),
    registry: Object.freeze({
      code: 'AI_ACTION_REGISTRY_FAILED',
      message: 'AI action registry failed.',
      stage: 'registry'
    }),
    runtime: Object.freeze({
      code: 'AI_RUNTIME_FAILED',
      message: 'AI runtime failed.',
      stage: 'runtime'
    }),
    transaction: Object.freeze({
      code: 'AI_TRANSACTION_FAILED',
      message: 'AI action batch transaction failed.',
      stage: 'transaction'
    }),
    resolution: Object.freeze({
      code: 'AI_RESOLUTION_FAILED',
      message: 'AI action batch resolution failed.',
      stage: 'resolution'
    })
  })

const createFailedResult = (
  failure: AiStableFailure,
  evidence: AiInvocationEvidence,
  redactionOptions: AiRedactionOptions
): AiRuntimeFailedResult =>
  Object.freeze({
    audit: createAiRuntimeAudit(
      {
        ...(evidence.batch?.explanation === undefined
          ? {}
          : {
              explanation: evidence.batch.explanation
            }),
        ...(evidence.batch?.batchId === undefined
          ? {}
          : {
              batchId: evidence.batch.batchId
            }),
        outcome: 'failed',
        retryCount: evidence.retryCount
      },
      redactionOptions
    ),
    ...(evidence.batch?.batchId === undefined
      ? {}
      : {
          batchId: evidence.batch.batchId
        }),
    ...(evidence.executionStarted
      ? {
          transaction: Object.freeze({
            status: evidence.transactionStatus ?? ('unknown' as const)
          })
        }
      : {}),
    code: failure.code,
    message: failure.message,
    ...(evidence.preview === undefined
      ? {}
      : {
          preview: evidence.preview
        }),
    retryCount: evidence.retryCount,
    stage: failure.stage,
    status: 'failed'
  })

const createCancelledResult = (
  reason: AiRuntimeCancelledResult['reason'],
  evidence: AiInvocationEvidence,
  redactionOptions: AiRedactionOptions
): AiRuntimeCancelledResult => {
  const result: {
    audit: AiRuntimeAudit
    preview?: AiActionBatchPreview
    reason: AiRuntimeCancelledResult['reason']
    status: 'cancelled'
  } = {
    audit: createAiRuntimeAudit(
      {
        ...(evidence.batch?.explanation === undefined
          ? {}
          : {
              explanation: evidence.batch.explanation
            }),
        ...(evidence.batch?.batchId === undefined
          ? {}
          : {
              batchId: evidence.batch.batchId
            }),
        outcome: 'cancelled',
        retryCount: evidence.retryCount
      },
      redactionOptions
    ),
    reason,
    status: 'cancelled'
  }

  if (evidence.preview) {
    result.preview = evidence.preview
  }

  return Object.freeze({
    ...result,
    ...(evidence.executionStarted
      ? {
          transaction: Object.freeze({
            status: evidence.transactionStatus ?? ('unknown' as const)
          })
        }
      : {})
  })
}

const validateRuntimeOptions = (
  options: AiRuntimeOptions | undefined
): {
  readonly redaction: AiRedactionOptions
  readonly retryPolicy?: AiRetryPolicy
} => {
  const retryPolicy = options?.retryPolicy
  if (
    retryPolicy &&
    (!Number.isInteger(retryPolicy.maxAttempts) ||
      retryPolicy.maxAttempts < 1 ||
      retryPolicy.maxAttempts > MAX_AI_PROVIDER_ATTEMPTS)
  ) {
    throw new AiRetryPolicyError()
  }

  const redaction: AiRedactionOptions = Object.freeze({
    additionalSecretKeys: Object.freeze([
      ...(options?.redaction?.additionalSecretKeys ?? [])
    ])
  })
  const validated: {
    redaction: AiRedactionOptions
    retryPolicy?: AiRetryPolicy
  } = {
    redaction
  }
  if (retryPolicy) {
    validated.retryPolicy = Object.freeze({
      maxAttempts: retryPolicy.maxAttempts,
      ...(retryPolicy.shouldRetry
        ? {
            shouldRetry: retryPolicy.shouldRetry
          }
        : {})
    })
  }

  return Object.freeze(validated)
}

class DefaultAiAgentRuntime implements AiAgentRuntime {
  private readonly preserveProgress: boolean
  private readonly activeInvocations = new Set<ActiveAiInvocation>()
  private readonly confirmationHandler: AiConfirmationHandler
  private readonly contextProvider: AiContextProvider
  private readonly ownedResources: readonly AiRuntimeOwnedResource[]
  private readonly permissionPolicy: AiPermissionPolicy
  private readonly provider: AiProvider
  private readonly redactionOptions: AiRedactionOptions
  private readonly registry: AiActionRegistry
  private readonly retryPolicy: AiRetryPolicy | undefined
  private readonly transactionRunner: AiTransactionRunner
  private disposal: Promise<void> | undefined
  private disposed = false

  constructor(input: CreateAiAgentRuntimeInput) {
    const options = validateRuntimeOptions(input.options)

    this.preserveProgress = input.options?.failurePolicy === 'preserve-progress'
    this.provider = input.provider
    this.contextProvider = input.contextProvider
    this.permissionPolicy = input.permissionPolicy
    this.confirmationHandler = input.confirmationHandler
    this.transactionRunner = input.transactionRunner
    this.redactionOptions = options.redaction
    this.retryPolicy = options.retryPolicy
    this.ownedResources = Object.freeze([...(input.ownedResources ?? [])])
    this.registry = createAiActionRegistry()
    for (const action of input.actionDefinitions) {
      this.registry.register(action)
    }
  }

  resolveAiActionBatch(
    batch: AiActionBatch,
    options: { readonly signal: AbortSignal }
  ): ResolvedAiActionBatch {
    return resolveAiActionBatchWithRegistry(batch, this.registry, options)
  }

  run(request: AiRunRequest): Promise<AiRuntimeResult> {
    if (this.disposed) {
      return Promise.resolve(
        createFailedResult(
          {
            code: 'AI_RUNTIME_DISPOSED',
            message: 'AI runtime has been disposed.',
            stage: 'runtime'
          },
          {
            retryCount: 0
          },
          this.redactionOptions
        )
      )
    }

    const controller = new AbortController()
    const abortInvocation = () => controller.abort(request.signal.reason)
    if (request.signal.aborted) {
      abortInvocation()
    } else {
      request.signal.addEventListener('abort', abortInvocation, {
        once: true
      })
    }

    const active: ActiveAiInvocation = {
      controller,
      settlement: Promise.resolve(
        createCancelledResult(
          'aborted',
          {
            retryCount: 0
          },
          this.redactionOptions
        )
      )
    }
    this.activeInvocations.add(active)
    active.settlement = this.runInvocation(
      {
        intent: request.intent,
        ...(request.metadata === undefined
          ? {}
          : {
              metadata: redactAiValue(request.metadata, this.redactionOptions)
            }),
        signal: controller.signal
      },
      controller.signal,
      request.progressObserver
    ).finally(() => {
      request.signal.removeEventListener('abort', abortInvocation)
      this.activeInvocations.delete(active)
    })

    return active.settlement
  }

  dispose(): Promise<void> {
    if (!this.disposal) {
      this.disposal = this.disposeRuntime()
    }

    return this.disposal
  }

  private async disposeRuntime(): Promise<void> {
    this.disposed = true
    const active = [...this.activeInvocations]
    for (const invocation of active) {
      invocation.controller.abort()
    }
    await Promise.allSettled(active.map((invocation) => invocation.settlement))

    this.registry.dispose()
    const cleanups = await Promise.allSettled(
      this.ownedResources.map((resource) =>
        Promise.resolve().then(() => resource.dispose())
      )
    )
    const failed = cleanups.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected'
    )
    if (failed) {
      throw failed.reason
    }
  }

  private async runInvocation(
    request: AiRunRequest,
    signal: AbortSignal,
    progressObserver: AiRuntimeProgressObserver | undefined
  ): Promise<AiRuntimeResult> {
    let evidence: AiInvocationEvidence = {
      retryCount: 0
    }
    let failedAction: string | undefined
    let currentStage: AiRuntimeStage = 'context'
    const emitProgress = (update: AiRuntimeProgressUpdate): void =>
      emitAiRuntimeProgress(
        progressObserver,
        signal,
        update,
        this.redactionOptions
      )

    let providerFailure: AiStableFailure | undefined
    let attempt = 1
    const allResults: AiActionExecutionResult[] = []
    const batchIds = new Set<string>()
    let acceptingBatches = false
    let batchPending = false
    let callbackFailure: unknown
    let batchSettlement: Promise<void> | undefined
    try {
      const intent =
        typeof request.intent === 'string' ? request.intent.trim() : ''
      if (!intent)
        return createFailedResult(
          {
            code: 'AI_RUNTIME_INVALID_INTENT',
            message: 'AI runtime requires a non-empty intent.',
            stage: 'runtime'
          },
          evidence,
          this.redactionOptions
        )
      if (signal.aborted) throw INVOCATION_ABORTED
      emitProgress({
        attempt,
        phase: 'context',
        summary: 'Understanding the request'
      })
      let context = redactAiValue(
        await runAbortable(signal, () =>
          this.contextProvider.getContext({ intent, signal })
        ),
        this.redactionOptions
      )
      currentStage = 'registry'
      const actions = this.registry.list()
      const executePrepared = async (actionBatch: AiActionBatch) => {
        currentStage = 'resolution'
        emitProgress({
          attempt,
          phase: 'resolution',
          summary: 'Resolving app actions'
        })
        const resolved = this.resolveAiActionBatch(actionBatch, { signal })
        if (batchIds.has(resolved.batchId))
          throw new AiActionBatchResolutionError(
            'AI_ACTION_BATCH_DUPLICATE_ACTION_ID',
            'A prepared batch cannot execute twice in one invocation.'
          )
        batchIds.add(resolved.batchId)
        evidence = {
          ...evidence,
          batch: resolved,
          retryCount: attempt - 1
        }
        currentStage = 'permission'
        emitProgress({
          actionCount: resolved.actions.length,
          attempt,
          batchId: resolved.batchId,
          phase: 'permission',
          summary: 'Checking action permissions'
        })
        const permissionReady = await evaluateAiActionBatchPermissions(
          resolved,
          context,
          this.permissionPolicy
        )

        currentStage = 'confirmation'
        if (permissionReady.confirmationRequired) {
          emitProgress({
            actionCount: permissionReady.actions.length,
            attempt,
            batchId: permissionReady.batchId,
            phase: 'confirmation',
            summary: 'Waiting for confirmation'
          })
        }
        let confirmed: ConfirmedAiActionBatch
        try {
          confirmed = await confirmAiActionBatch(
            permissionReady,
            this.confirmationHandler,
            signal,
            this.redactionOptions
          )
        } catch (error) {
          evidence = {
            ...evidence,
            preview: createAiActionBatchPreview(
              permissionReady,
              this.redactionOptions
            )
          }
          throw error
        }
        evidence = {
          ...evidence,
          preview: confirmed.preview
        }

        currentStage = 'execution'
        evidence = { ...evidence, executionStarted: true }
        const actionResults: AiActionExecutionResult[] = []
        for (const action of confirmed.actions) {
          emitProgress({
            actionCount: 1,
            attempt,
            batchId: confirmed.batchId,
            phase: 'execution',
            tool: action.name,
            summary:
              typeof action.summary === 'string'
                ? action.summary
                : 'Preparing the drawing'
          })
          failedAction = action.name
          const completed = await executeAiActions(
            { ...confirmed, actions: [action] },
            signal,
            this.redactionOptions
          )
          allResults.push(...completed.actionResults)
          actionResults.push(...completed.actionResults)
          failedAction = undefined
        }
        const execution = Object.freeze({
          actionResults: Object.freeze(actionResults)
        })
        return { confirmed, execution }
      }
      currentStage = 'transaction'
      const executed = await runAiActionBatchTransaction(
        {
          run: async (label, execute) => {
            let callbackFailed = false
            let callbackError: unknown
            try {
              return await this.transactionRunner.run(label, async () => {
                try {
                  return await execute()
                } catch (error) {
                  callbackFailed = true
                  callbackError = error
                  throw error
                }
              })
            } catch (error) {
              // A conforming runner preserves the callback error only after rollback.
              // A different rejection belongs to the transaction owner itself.
              if (callbackFailed && error === callbackError) {
                evidence = { ...evidence, transactionStatus: 'rolled-back' }
              } else {
                evidence = { ...evidence, transactionStatus: 'unknown' }
                currentStage = 'transaction'
                providerFailure = undefined
              }
              throw error
            }
          }
        },
        signal,
        async () => {
          try {
            let finalBatch: AiActionBatch
            while (true) {
              currentStage = 'provider'
              emitProgress({
                attempt,
                phase: 'provider',
                summary: 'Requesting an action batch'
              })
              acceptingBatches = true
              try {
                finalBatch = await runAbortable(signal, () =>
                  this.provider.requestActionBatch(
                    Object.freeze({
                      actions,
                      attempt,
                      context,
                      intent,
                      ...(request.metadata === undefined
                        ? {}
                        : { metadata: request.metadata })
                    }),
                    {
                      signal,
                      executeBatch: async (batch) => {
                        if (
                          !acceptingBatches ||
                          batchPending ||
                          signal.aborted
                        ) {
                          callbackFailure = new AiExecutionError()
                          throw callbackFailure
                        }
                        batchPending = true
                        let settle!: () => void
                        batchSettlement = new Promise<void>((resolve) => {
                          settle = resolve
                        })
                        try {
                          const { execution } = await executePrepared(batch)
                          currentStage = 'context'
                          const updatedContext = redactAiValue(
                            await runAbortable(signal, () =>
                              this.contextProvider.getContext({
                                intent,
                                signal
                              })
                            ),
                            this.redactionOptions
                          )
                          context = updatedContext
                          currentStage = 'provider'
                          return Object.freeze({
                            actionResults: execution.actionResults,
                            context: updatedContext
                          })
                        } catch (error) {
                          callbackFailure = error
                          throw error
                        } finally {
                          batchPending = false
                          settle()
                        }
                      },
                      onProgress: (event) => {
                        if (
                          !acceptingBatches ||
                          signal.aborted ||
                          !event ||
                          typeof event.tool !== 'string' ||
                          !/^[a-zA-Z0-9_-]{1,64}$/.test(event.tool) ||
                          !['running', 'completed'].includes(event.status)
                        )
                          return
                        emitProgress({
                          attempt,
                          phase: 'provider',
                          tool: event.tool,
                          toolStatus: event.status,
                          ...(typeof event.message === 'string' &&
                          event.message.length <= 1000
                            ? { message: event.message }
                            : {}),
                          summary:
                            event.status === 'running'
                              ? 'Running a tool'
                              : 'Tool completed'
                        })
                      }
                    }
                  )
                )
                if (callbackFailure) throw callbackFailure
                if (batchPending) throw new AiExecutionError()
                break
              } catch (error) {
                if (signal.aborted || error === INVOCATION_ABORTED)
                  throw INVOCATION_ABORTED
                if (callbackFailure) throw callbackFailure
                const failure = toAiProviderRequestFailure(error, attempt)
                if (
                  batchIds.size > 0 ||
                  !shouldRetryAiProviderFailure(failure, this.retryPolicy)
                ) {
                  providerFailure = failure
                  throw error
                }
                attempt += 1
                evidence = { retryCount: attempt - 1 }
              } finally {
                acceptingBatches = false
                await batchSettlement
              }
            }
            const { confirmed } = await executePrepared(finalBatch)
            currentStage = 'audit'
            const audit = createAiRuntimeAudit(
              {
                actionResults: allResults,
                ...(confirmed.explanation === undefined
                  ? {}
                  : { explanation: confirmed.explanation }),
                outcome: 'executed',
                batchId: confirmed.batchId,
                retryCount: evidence.retryCount
              },
              this.redactionOptions
            )
            currentStage = 'transaction'
            return Object.freeze({
              actionResults: Object.freeze([...allResults]),
              audit,
              batchId: confirmed.batchId,
              preview: confirmed.preview,
              status: 'executed' as const,
              transaction: Object.freeze({ status: 'committed' as const })
            })
          } catch (error) {
            if (
              !this.preserveProgress ||
              !evidence.executionStarted ||
              signal.aborted ||
              error === INVOCATION_ABORTED ||
              (error instanceof AiConfirmationError &&
                error.code === 'AI_CONFIRMATION_CANCELLED')
            )
              throw error
            const failed = createFailedResult(
              providerFailure ??
                stableFailure(error, STAGE_FAILURES[currentStage]),
              evidence,
              this.redactionOptions
            )
            // Returning normally asks the canonical transaction owner to commit.
            // A settlement error still escapes and must never claim retained progress.
            return Object.freeze({
              ...failed,
              actionResults: Object.freeze([...allResults]),
              ...(failedAction ? { failedAction } : {}),
              audit: createAiRuntimeAudit(
                {
                  actionResults: allResults,
                  outcome: 'failed',
                  retryCount: evidence.retryCount,
                  ...(evidence.batch ? { batchId: evidence.batch.batchId } : {})
                },
                this.redactionOptions
              ),
              transaction: Object.freeze({ status: 'committed' as const })
            })
          }
        }
      )
      emitProgress({
        actionCount: allResults.length,
        attempt,
        batchId: executed.batchId,
        outcome: executed.status === 'executed' ? 'executed' : 'failed',
        phase: 'settled',
        summary: executed.status === 'executed' ? 'Completed' : 'Failed'
      })
      return executed
    } catch (error) {
      if (signal.aborted || error === INVOCATION_ABORTED) {
        return createCancelledResult('aborted', evidence, this.redactionOptions)
      }

      if (
        error instanceof AiConfirmationError &&
        error.code === 'AI_CONFIRMATION_CANCELLED'
      ) {
        emitProgress({
          attempt,
          outcome: 'cancelled',
          phase: 'settled',
          summary: 'Cancelled'
        })
        return createCancelledResult(
          'confirmation-cancelled',
          evidence,
          this.redactionOptions
        )
      }
      const failed = createFailedResult(
        providerFailure ?? stableFailure(error, STAGE_FAILURES[currentStage]),
        evidence,
        this.redactionOptions
      )
      emitProgress({
        attempt: evidence.retryCount + 1,
        outcome: 'failed',
        phase: 'settled',
        ...(evidence.batch?.batchId === undefined
          ? {}
          : {
              batchId: evidence.batch.batchId
            }),
        summary: 'Failed'
      })
      return failed
    }
  }
}

export const createAiAgentRuntime = (
  input: CreateAiAgentRuntimeInput
): AiAgentRuntime => new DefaultAiAgentRuntime(input)

import { createAiInvoker } from '@asyra/ai-agent-runtime'
import { serializeToolPayload } from '@asyra/ai-agent-runtime/node'
import { BrowserBatchExecutionError } from './batch-exchange'
import { operationInputIssue } from './operation-input-schema'

export interface LocalToolDefinition {
  name: string
  inputSchema: unknown
}

/** All owners share the same invocation and failure policy. */
export interface LocalToolOwner {
  call(name: string, args: unknown, signal: AbortSignal): Promise<string>
  /** Pure rejection explanation only; no execution, mutation or admission bypass. */
  explainInputIssue?(
    name: string,
    args: unknown
  ): { code: string; message: string } | undefined
}

/** A known rejection before canonical dispatch; never use for uncertain writes. */
export class LocalToolInputError extends Error {
  constructor(
    message: string,
    readonly code = 'PREPARATION_REJECTED'
  ) {
    super(message)
  }
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const unavailable = (value: Record<string, unknown>) =>
  value.available === false ||
  value.applicable === false ||
  value.status === 'failed' ||
  value.status === 'unknown' ||
  record(value.failure)

const incomplete = (value: Record<string, unknown>) =>
  value.status === 'partial' || value.complete === false

/** Assess execution evidence, not visual quality or the truth of model judgments. */
export const localToolOutcome = (value: unknown) => {
  if (!record(value)) throw new Error('App tool returned a non-object result')
  const results = Array.isArray(value.actionResults) ? value.actionResults : []
  const receipts = results.flatMap((entry) =>
    record(entry) && record(entry.result)
      ? [{ ...entry.result, actionName: entry.actionName }]
      : []
  )
  const observations: Record<string, unknown>[] = [value, ...receipts]
  const issues = observations
    .filter((item) => unavailable(item) || incomplete(item))
    .map((issue) => {
      const failed = unavailable(issue)
      const defaultCode = failed ? 'RESULT_UNAVAILABLE' : 'RESULT_PARTIAL'
      const defaultMessage = failed
        ? 'The requested result is unavailable.'
        : 'The result reports incomplete work or coverage; inspect its receipt.'
      return {
        ...(typeof issue.actionName === 'string'
          ? { actionName: issue.actionName }
          : {}),
        code: typeof issue.code === 'string' ? issue.code : defaultCode,
        message:
          typeof issue.message === 'string' ? issue.message : defaultMessage
      }
    })
  const summary = record(value.batchSummary) ? value.batchSummary : {}
  const acknowledged = Array.isArray(summary.acknowledgedActions)
    ? summary.acknowledgedActions.some(
        (entry) =>
          record(entry) && typeof entry.count === 'number' && entry.count > 0
      )
    : false
  let status: 'usable' | 'unavailable' | 'partial' = 'usable'
  if (issues.length)
    status =
      observations.some(incomplete) ||
      acknowledged ||
      hasAcknowledgedActions(value.executionResult) ||
      receipts.some((item) => !unavailable(item))
        ? 'partial'
        : 'unavailable'
  return { status, issues }
}

const hasAcknowledgedActions = (value: unknown): boolean => {
  if (!record(value)) return false
  if (Array.isArray(value.actionResults) && value.actionResults.length > 0)
    return true
  return (
    Array.isArray(value.batches) &&
    value.batches.some(
      (batch) =>
        record(batch) &&
        Array.isArray(batch.actionResults) &&
        batch.actionResults.length > 0
    )
  )
}

export const localToolFailureReply = (
  message: string,
  code: string,
  details: Record<string, unknown> = {}
) => ({
  success: false,
  text: JSON.stringify({
    available: false,
    code,
    ...details,
    recoverable: true,
    message,
    toolOutcome: {
      status: hasAcknowledgedActions(details.executionResult)
        ? 'partial'
        : 'unavailable',
      issues: [{ code, message }]
    }
  })
})

/** Retain actionable diagnostics without forwarding URLs, credentials or stacks. */
export const localToolErrorMessage = (error: unknown) =>
  (error instanceof Error ? error.message : 'Tool execution failed')
    .replace(/https?:\/\/\S+|Bearer\s+\S+|data:[^\s]+/gi, '[redacted]')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 1000)

/** One native admission/result boundary, using the owner's exact advertised schema. */
export const invokeLocalTool = async (
  owner: LocalToolOwner,
  definition: LocalToolDefinition,
  args: unknown,
  signal: AbortSignal,
  executionEvidence?: () => unknown
) => {
  signal.throwIfAborted()
  let stage: 'admission' | 'execution' | 'decoding' = 'admission'
  try {
    const issue = operationInputIssue(args, definition.inputSchema)
    if (issue) {
      const explanation = owner.explainInputIssue?.(definition.name, args)
      return localToolFailureReply(
        explanation?.message ?? issue,
        explanation?.code ?? 'PREPARATION_REJECTED',
        { stage, settlement: 'not-started' }
      )
    }
    stage = 'execution'
    const text = await owner.call(definition.name, args, signal)
    signal.throwIfAborted()
    stage = 'decoding'
    const value = JSON.parse(text)
    const toolOutcome = localToolOutcome(value)
    return {
      success: toolOutcome.status === 'usable',
      text: JSON.stringify({ ...value, toolOutcome })
    }
  } catch (error) {
    signal.throwIfAborted()
    const inputFailure = error instanceof LocalToolInputError
    const batchError =
      error instanceof BrowserBatchExecutionError ? error : undefined
    const executionResult = executionEvidence?.() ?? batchError?.receipt ?? null
    const hasPriorExecution =
      record(executionResult) &&
      ((Array.isArray(executionResult.batches) &&
        executionResult.batches.length > 0) ||
        (Array.isArray(executionResult.actionResults) &&
          executionResult.actionResults.length > 0))
    return localToolFailureReply(
      localToolErrorMessage(error),
      inputFailure
        ? error.code
        : (batchError?.receipt?.failure?.code ??
            batchError?.failure.code ??
            (stage === 'decoding'
              ? 'TOOL_RESULT_INVALID'
              : 'TOOL_EXECUTION_FAILED')),
      {
        stage: inputFailure
          ? 'admission'
          : (batchError?.receipt?.failure?.stage ?? stage),
        settlement:
          (inputFailure || stage === 'admission') && !hasPriorExecution
            ? 'not-started'
            : (batchError?.receipt?.failure?.settlement ?? 'unknown'),
        recovery:
          'Inspect the failure and current state, then choose a corrected or alternate operation. Do not automatically replay mutations.',
        ...(batchError ? { batchFailure: batchError.failure } : {}),
        executionResult: JSON.parse(
          serializeToolPayload(executionResult).serialized
        )
      }
    )
  }
}

export interface LocalToolObservation {
  parentCallId?: () => string | undefined
  trace?: (
    stage: 'action_started' | 'action_completed' | 'action_failed',
    evidence: Record<string, unknown>
  ) => void
}

/** Internal domain handoffs use the same payload recorder as browser actions.
 * Observation never changes execution, retries it, or certifies visual quality. */
export const observeLocalToolExecution = async (
  tool: string,
  args: unknown,
  execute: () => Promise<string>,
  observation: LocalToolObservation = {},
  expectedResult = 'A structured owner receipt with usable output or an explicit failure'
): Promise<string> => {
  const invoker = createAiInvoker({
    execute: async () => execute(),
    observe: (event) => {
      const evidence = {
        callId: event.call.callId,
        tool,
        parentCallId: event.call.parentCallId ?? null,
        actor: 'app-server',
        executor: 'app-server',
        timingScope: 'owner-handoff'
      }
      if (event.phase === 'started') {
        observation.trace?.('action_started', {
          ...evidence,
          purpose: null,
          purposeSource: 'unavailable',
          expectedResult,
          expectationSource: 'registered-contract',
          arguments: args
        })
      } else if (event.phase === 'completed') {
        let result: unknown
        let outcome: ReturnType<typeof localToolOutcome>
        try {
          result = JSON.parse(event.output as string)
          outcome = localToolOutcome(result)
        } catch {
          observation.trace?.('action_completed', {
            ...evidence,
            result: event.output,
            code: 'RESULT_DECODING_FAILED',
            executionMs: event.durationMs
          })
          return
        }
        observation.trace?.(
          outcome.status === 'unavailable'
            ? 'action_failed'
            : 'action_completed',
          {
            ...evidence,
            result,
            executionMs: event.durationMs
          }
        )
      } else {
        observation.trace?.('action_failed', {
          ...evidence,
          reason: localToolErrorMessage(event.error),
          executionMs: event.durationMs
        })
      }
    }
  })
  let parentCallId: string | undefined
  try {
    parentCallId = observation.parentCallId?.()
  } catch {
    /* Context observation cannot reject execution. */
  }
  return invoker.invoke({
    name: tool,
    input: args,
    parentCallId
  })
}

import {
  AiActionExecutionError,
  embedAiToolSchema,
  AiExecutionError,
  createAiInvoker,
  createAiToolContract,
  inspectAiToolResult,
  selectAiToolResultSchema,
  type AiJsonValue,
  type AiToolContractInput,
  type AiToolOutcome,
  type AiInvocationMiddleware
} from '@asyra/ai-agent-runtime'
import { serializeToolPayload } from '@asyra/ai-agent-runtime/node'
import { BrowserBatchExecutionError } from './batch-exchange'
import { designCheckSummarySchema } from './design-check-results'
import {
  operationContractIssue,
  operationInputIssues,
  formatOperationInputIssues,
  type OperationInputIssue
} from './operation-input-schema'
import {
  designActionOutcome,
  toolInternalResult,
  toolResultObject,
  toolResultString
} from '../src/ai/tool-contract'

export interface LocalToolDefinition extends AiToolContractInput {
  /** Registry-only operations remain available to typed recipes without native function expansion. */
  readonly providerExposure?: 'registry'
}

const validatedOutputSchemas = new WeakMap<
  object,
  { schema: AiJsonValue; text: string }
>()
/** Reuse completed boundary validation without trusting reconstructed JSON receipts. */
export const localToolResultSchema = (reply: {
  text: string
}): AiJsonValue | undefined => {
  const validated = validatedOutputSchemas.get(reply)
  return validated?.text === reply.text ? validated.schema : undefined
}

/** Delivery can make acknowledgement incomplete, never change execution settlement. */
export const localToolDeliveryResult = (
  original: Record<string, unknown>,
  projected: Record<string, unknown>
): Record<string, unknown> => {
  const previous = localToolOutcome(original)
  const execution = record(original.toolOutcome)
    ? original.toolOutcome
    : previous
  const delivered = localToolOutcome(projected)
  // Owner-specific successful page/finding semantics remain valid when projection
  // did not introduce a new incomplete child acknowledgement.
  if (
    execution.status !== 'success' ||
    delivered.status === 'success' ||
    (delivered.status === previous.status &&
      JSON.stringify(delivered.issues) === JSON.stringify(previous.issues))
  )
    return projected
  return {
    ...projected,
    toolOutcome: { ...execution, status: 'partial', issues: delivered.issues }
  }
}

/** All owners share the same invocation and failure policy. */
export interface LocalToolOwner {
  call(name: string, args: unknown, signal: AbortSignal): Promise<string>
  /** Internal recipes and validation consume canonical complete values. */
  callInternal?(
    name: string,
    args: unknown,
    signal: AbortSignal
  ): Promise<string>
  /** Pure external view after validity and ownership handoff. Never executes. */
  projectModelResult?(name: string, args: unknown, value: unknown): unknown

  /** Control wrappers project the pinned selected contract for reference ownership. */
  invocationSchemas?(
    name: string,
    args: unknown
  ):
    | Pick<
        LocalToolDefinition,
        | 'inputSchema'
        | 'outputSchema'
        | 'partialOutputSchema'
        | 'recoveryOutputSchema'
      >
    | undefined
  /** Bounded diagnostics only; called after rejection, never executes a tool. */
  rejectInput?(
    name: string,
    args: unknown,
    issues?: readonly OperationInputIssue[]
  ): Record<string, unknown> | undefined
  /** Validate successful domain output, including required retained identities. */
  resultIssue?(name: string, value: unknown): string | undefined
  resultOutcome?(
    name: string,
    value: unknown
  ): ReturnType<typeof localToolOutcome>
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
export const localToolOutcome = (
  value: unknown
): {
  status: AiToolOutcome['status']
  settlement: AiToolOutcome['settlement']
  issues: { actionName?: string; code: string; message: string }[]
} => {
  if (!record(value)) throw new Error('App tool returned a non-object result')
  const results = Array.isArray(value.actionResults) ? value.actionResults : []
  const receipts: Record<string, unknown>[] = results.flatMap((entry) =>
    record(entry) && record(entry.result)
      ? [{ ...entry.result, actionName: entry.actionName }]
      : []
  )
  const receiptOutcomes = receipts.map((receipt) =>
    designActionOutcome(
      record(receipt.toolOutcome) ? receipt.toolOutcome : receipt
    )
  )
  const parts = Array.isArray(value.parts)
    ? value.parts.filter(
        (part): part is Record<string, unknown> =>
          record(part) && Array.isArray(part.completedSteps)
      )
    : []
  const partOutcomes = parts.map(localToolOutcome)
  const batches = Array.isArray(value.batches)
    ? value.batches.filter(record)
    : []
  const batchOutcomes = batches.map(localToolOutcome)
  const childOutcomes = [...receiptOutcomes, ...partOutcomes, ...batchOutcomes]
  const followupIssues = ['measurementIssues', 'inspectionIssues'].flatMap(
    (key) =>
      Array.isArray(value[key])
        ? value[key].filter(record).map((issue) => ({
            status: 'partial',
            code: 'FOLLOWUP_UNAVAILABLE',
            message:
              typeof issue.message === 'string'
                ? issue.message
                : 'Required follow-up delivery is unavailable; recover checks without replaying writes.'
          }))
        : []
  )
  const observations: Record<string, unknown>[] = [
    value,
    ...receipts.map((receipt, index) => ({
      ...receipt,
      ...receiptOutcomes[index]
    })),
    ...parts.map((part, index) => ({ ...part, ...partOutcomes[index] })),
    ...batches.map((batch, index) => ({ ...batch, ...batchOutcomes[index] })),
    ...followupIssues
  ]
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
  let status: AiToolOutcome['status'] =
    value.status === 'unknown' ? 'unknown' : 'success'
  if (issues.length)
    status =
      observations.some(incomplete) ||
      hasAcknowledgedActions(value.executionResult) ||
      childOutcomes.some((outcome) => outcome.status === 'success')
        ? 'partial'
        : 'failed'
  if (
    value.status === 'unknown' ||
    childOutcomes.some((outcome) => outcome.status === 'unknown')
  )
    status = 'unknown'
  let settlement: AiToolOutcome['settlement'] = 'unknown'
  if (status === 'success') settlement = 'completed'
  else if (status === 'partial') settlement = 'partial'
  if (childOutcomes.length) {
    const settlements = new Set(
      childOutcomes.map((outcome) => outcome.settlement)
    )
    if (settlements.has('unknown')) settlement = 'unknown'
    else if (!unavailable(value) && !incomplete(value)) {
      if (settlements.has('partial') || settlements.size > 1)
        settlement = 'partial'
      else settlement = childOutcomes[0].settlement
    }
  }
  if (
    ['not-started', 'completed', 'partial', 'unknown'].includes(
      String(value.settlement)
    )
  )
    settlement = value.settlement as AiToolOutcome['settlement']
  if (record(value.failure)) {
    const failedSettlement = value.failure.settlement
    if (
      failedSettlement === 'unknown' ||
      childOutcomes.some((outcome) => outcome.settlement === 'unknown')
    )
      settlement = 'unknown'
    else if (failedSettlement === 'completed') settlement = 'completed'
    else if (failedSettlement === 'partial') settlement = 'partial'
    else if (failedSettlement === 'not-started') {
      settlement = childOutcomes.some(
        (outcome) => outcome.settlement !== 'not-started'
      )
        ? 'partial'
        : 'not-started'
    }
  }
  return { status, settlement, issues }
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

/** Browser transport and execution receipts keep decisions separate from profiling. */
export const localBatchFailureSchema = toolResultObject(
  {
    batchId: toolResultString,
    actionName: { type: ['string', 'null'] },
    code: toolResultString,
    message: toolResultString,
    handlerMs: toolInternalResult({ type: ['number', 'null'] }),
    executionMs: toolInternalResult({ type: 'number' })
  },
  ['batchId', 'actionName', 'code', 'message']
)
export const localReceiptFailureSchema = toolResultObject(
  {
    code: toolResultString,
    message: toolResultString,
    stage: toolResultString,
    actionName: { type: ['string', 'null'] },
    actionId: { type: ['string', 'null'] },
    actionExecutionMs: toolInternalResult({ type: ['number', 'null'] }),
    settlement: { enum: ['not-started', 'completed', 'partial', 'unknown'] },
    contractStage: { enum: ['registration', 'input', 'output'] },
    observedResult: true,
    contextFresh: toolInternalResult({ type: 'boolean' })
  },
  ['code', 'message', 'stage', 'actionName', 'actionId', 'settlement']
)
export const localExecutionReceiptSchema: Record<string, unknown> = {
  anyOf: [
    {
      $ref: '#/$defs/receipt',
      anyOf: [{ required: ['actionResults'] }, { required: ['batches'] }]
    },
    {
      type: 'object',
      not: {
        anyOf: [{ required: ['actionResults'] }, { required: ['batches'] }]
      }
    }
  ],
  $defs: {
    receipt: toolResultObject(
      {
        actionResults: {
          type: 'array',
          items: toolResultObject({
            actionId: toolResultString,
            actionName: toolResultString,
            result: true
          })
        },
        batches: { type: 'array', items: { $ref: '#/$defs/receipt' } },
        context: toolInternalResult({}),
        failure: localReceiptFailureSchema,
        checks: designCheckSummarySchema,
        inspectionDeferred: { type: 'boolean' },
        measurementDeferred: { type: 'boolean' },
        inspectionIssues: { type: 'array' },
        measurementIssues: { type: 'array' },
        toolOutcome: { type: 'object' }
      },
      []
    )
  }
}

/** Boundary failures can precede execution; no synthetic receipt is required. */
export const localToolFailureSchema = toolResultObject(
  {
    available: { const: false },
    code: toolResultString,
    message: toolResultString,
    recoverable: { type: 'boolean' },
    stage: toolResultString,
    settlement: { enum: ['not-started', 'completed', 'partial', 'unknown'] },
    recovery: { type: ['string', 'object'] },
    executionResult: {
      anyOf: [
        { type: 'null' },
        embedAiToolSchema(
          localExecutionReceiptSchema as AiJsonValue,
          '#/properties/executionResult/anyOf/1'
        )
      ]
    },
    batchFailure: localBatchFailureSchema,
    toolOutcome: toolResultObject({
      status: { enum: ['failed', 'partial'] },
      settlement: { enum: ['not-started', 'completed', 'partial', 'unknown'] },
      issues: {
        type: 'array',
        items: toolResultObject({
          code: toolResultString,
          message: toolResultString
        })
      }
    })
  },
  ['available', 'code', 'message', 'recoverable', 'toolOutcome']
)

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
    recoverable: details.recoverable !== false,
    message,
    toolOutcome: {
      status: hasAcknowledgedActions(details.executionResult)
        ? 'partial'
        : 'failed',
      settlement: ['not-started', 'completed', 'partial', 'unknown'].includes(
        String(details.settlement)
      )
        ? details.settlement
        : 'unknown',
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
  executionEvidence?: () => unknown,
  onPhase?: (phase: 'admission' | 'execution' | 'decoding') => void
) => {
  signal.throwIfAborted()
  let stage: 'admission' | 'execution' | 'decoding' = 'admission'
  let decodedResult: unknown
  const reportPhase = () => {
    try {
      onPhase?.(stage)
    } catch {
      /* Observation does not alter tool execution. */
    }
  }
  try {
    reportPhase()
    const contract = createAiToolContract(definition)
    const issues = operationInputIssues(args, contract.inputSchema)
    if (issues) {
      const explanation = owner.explainInputIssue?.(definition.name, args)
      return localToolFailureReply(
        explanation?.message ?? formatOperationInputIssues(issues),
        explanation?.code ?? 'PREPARATION_REJECTED',
        {
          ...owner.rejectInput?.(definition.name, args, issues),
          stage,
          settlement: 'not-started'
        }
      )
    }
    stage = 'execution'
    reportPhase()
    const text = await (owner.callInternal ?? owner.call)(
      definition.name,
      args,
      signal
    )
    stage = 'decoding'
    reportPhase()
    let value = JSON.parse(text)
    decodedResult = value
    signal.throwIfAborted()
    const resultIssue = owner.resultIssue?.(definition.name, value)
    if (resultIssue) throw new Error(resultIssue)
    let toolOutcome =
      owner.resultOutcome?.(definition.name, value) ?? localToolOutcome(value)
    if (
      toolOutcome.status !== 'success' &&
      toolOutcome.settlement === 'unknown' &&
      !hasAcknowledgedActions(value.executionResult)
    ) {
      let observed: unknown
      try {
        observed = executionEvidence?.()
      } catch {
        // Unavailable diagnostics cannot replace the owner's failure.
      }
      if (hasAcknowledgedActions(observed)) {
        value = { ...value, executionResult: observed }
        decodedResult = value
        toolOutcome =
          owner.resultOutcome?.(definition.name, value) ??
          localToolOutcome(value)
      }
    }
    const inspected = inspectAiToolResult(contract, value, {
      outcome: toolOutcome,
      validate: operationContractIssue
    })
    if (inspected.status === 'invalid') throw new Error(inspected.issue)
    const reply = {
      success: toolOutcome.status === 'success',
      text: JSON.stringify({ ...value, toolOutcome })
    }
    const outputSchema = selectAiToolResultSchema(contract, toolOutcome.status)
    if (outputSchema !== undefined)
      validatedOutputSchemas.set(reply, {
        schema: outputSchema,
        text: reply.text
      })
    return reply
  } catch (error) {
    const inputFailure = error instanceof LocalToolInputError
    const batchError =
      error instanceof BrowserBatchExecutionError ? error : undefined
    let observedEvidence: unknown
    try {
      observedEvidence = executionEvidence?.()
    } catch {
      /* Optional diagnostics must not prevent delivery of the owner's failure. */
    }
    const evidence = [observedEvidence, batchError?.receipt, decodedResult]
    // An empty observer snapshot must not hide an acknowledged owner result.
    const executionResult =
      evidence.find(hasAcknowledgedActions) ??
      evidence.find((value) => value != null) ??
      null
    if (signal.aborted) {
      if (
        (error instanceof AiActionExecutionError ||
          error instanceof AiExecutionError) &&
        error.receipt
      )
        throw error
      if (hasAcknowledgedActions(executionResult))
        throw new AiExecutionError({
          result: JSON.parse(serializeToolPayload(executionResult).serialized),
          settlement: localToolOutcome(executionResult).settlement
        })
      signal.throwIfAborted()
    }
    const hasPriorExecution =
      record(executionResult) &&
      ((Array.isArray(executionResult.batches) &&
        executionResult.batches.length > 0) ||
        (Array.isArray(executionResult.actionResults) &&
          executionResult.actionResults.length > 0))
    const reportedSettlement =
      record(decodedResult) &&
      ['not-started', 'completed', 'partial', 'unknown'].includes(
        String(decodedResult.settlement)
      )
        ? (decodedResult.settlement as AiToolOutcome['settlement'])
        : undefined
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
            : (batchError?.receipt?.failure?.settlement ??
              reportedSettlement ??
              'unknown'),
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
  progress?: (event: {
    tool: string
    callId: string
    parentCallId?: string
    status: 'running' | 'completed'
  }) => void
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
  expectedResult = 'A structured owner receipt with usable output or an explicit failure',
  middleware: readonly AiInvocationMiddleware<string>[] = []
): Promise<string> => {
  const invoker = createAiInvoker({
    execute: async () => execute(),
    middleware,
    observe: (event) => {
      const evidence = {
        callId: event.call.callId,
        tool,
        parentCallId: event.call.parentCallId ?? null,
        actor: 'app-server',
        executor: 'app-server',
        timingScope: 'owner-handoff'
      }
      observation.progress?.({
        tool,
        callId: event.call.callId,
        parentCallId: event.call.parentCallId,
        status: event.phase === 'started' ? 'running' : 'completed'
      })
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
          outcome.status === 'failed' ? 'action_failed' : 'action_completed',
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
          ...((event.error instanceof AiActionExecutionError ||
            event.error instanceof AiExecutionError) &&
          event.error.receipt
            ? {
                result: event.error.receipt.result,
                settlement: event.error.receipt.settlement
              }
            : {}),
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

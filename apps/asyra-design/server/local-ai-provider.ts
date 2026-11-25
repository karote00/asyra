import type {
  AiToolProgress,
  ExchangeConversationResults,
  ExecuteAiBatch
} from '@asyra/ai-agent-runtime'
import { createAiExecutionProfiler } from '@asyra/ai-agent-runtime'
import {
  createNativeProviderConfig,
  createNativeRpcTransport,
  createNativeSession,
  startNativeProcess,
  type NativeConversationLease,
  type NativeConversations
} from '@asyra/ai-agent-runtime/node'
import { type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import {
  evaluationReportExplanation,
  readEvaluationWindow
} from '../src/ai/evaluation-window'
import { AiActionNames } from '../src/constants/ai-actions'
import { AiResearchActivityIds } from '../src/constants/ai-research'
import {
  requestRecordedDesignAi,
  type DesignAiRequestOptions
} from './design-ai-request'
import { createDesignProviderTools } from './design-provider-tools'
import {
  createEvaluationControl,
  type EvaluationStopReason
} from './evaluation-control'
import {
  EvaluationReportFailure,
  type EvaluationReportReply,
  type EvaluationReportSessions
} from './evaluation-report-sessions'
import { LocalComponentAnalysisLimits } from './local-component-analysis-limits'
import { selectPublicActivity } from './local-provider-activity'
import { localToolErrorMessage } from './local-tool-invocation'
import { LocalToolLibraryLimits } from './local-tool-library-limits'

import type { AiProviderInput } from '@asyra/ai-agent-runtime'
import { AiModelBackendError, isActionBatchEnvelope } from './ai-model-contract'

// Apply before process initialization as well as thread creation: some native
// services initialize at process scope, independently of registered App tools.
const localProviderConfig = Object.freeze({
  // Delivery has already selected and validated App output. Native history must
  // not truncate it again or omit the separate outcome. Context management is
  // still native; this only disables its implicit per-tool text cutoff.
  tool_output_token_limit: Number.MAX_SAFE_INTEGER,
  // Cold resume reconstructs a local environment; never load repository instructions.
  project_doc_max_bytes: 0,
  'features.shell_tool': false,
  'features.unified_exec': false,
  'features.apply_patch_freeform': false,
  'features.multi_agent': false,
  'features.multi_agent_v2': false,
  'features.hooks': false,
  'features.plugins': false,
  'features.apps': false,
  'features.memories': false,
  'features.shell_snapshot': false,
  'features.skill_mcp_dependency_install': false,
  'apps._default.enabled': false,
  notify: [],
  'analytics.enabled': false,
  'history.persistence': 'none'
})

// Capabilities of this adapter, not a classification of an in-flight model response.
export const nativeOutputVisibility = {
  method: 'app/output-visibility',
  source: 'native-public-protocol',
  coverage: [
    { kind: 'public-item-lifecycle', status: 'available' },
    { kind: 'app-invocation', status: 'available' },
    { kind: 'pre-dispatch-output-item', status: 'unavailable' },
    { kind: 'tool-argument-deltas', status: 'unavailable', bytes: null },
    { kind: 'generation-versus-stall', status: 'unavailable' }
  ]
} as const

const maximumProtocolBytes = 32 * 1024 * 1024

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const failure = (code: AiModelBackendError['code']) =>
  new AiModelBackendError(
    code,
    'The local AI provider could not complete the request.'
  )

// Project public startup metadata only; free provider text can contain credentials.
const startupDiagnostic = (method: string, params: Record<string, unknown>) => {
  if (method !== 'warning' && method !== 'mcpServer/startupStatus/updated') {
    return
  }

  const text = [params.message, params.error]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.slice(0, 4096))
    .join(' ')
  let reason: string | undefined

  if (text) {
    reason = 'unclassified'
    if (/timed?\s*out|timeout/i.test(text)) {
      reason = 'timeout'
    } else if (/authenticat|unauthorized|credential/i.test(text)) {
      reason = 'authentication'
    } else if (/configuration|config\b/i.test(text)) {
      reason = 'configuration'
    } else if (/connect|transport|handshake/i.test(text)) {
      reason = 'transport'
    }
  }

  const server =
    typeof params.name === 'string' &&
    /^[A-Za-z0-9_.:-]{1,160}$/.test(params.name)
      ? params.name
      : undefined
  const status =
    typeof params.status === 'string' &&
    ['starting', 'ready', 'failed', 'cancelled'].includes(params.status)
      ? params.status
      : undefined

  return {
    server,
    status,
    reason,
    failureReason:
      params.failureReason === 'reauthenticationRequired'
        ? params.failureReason
        : undefined,
    detailOmitted: text.length > 0
  }
}

// Native public error discriminators, never arbitrary provider message/data.
const nativeErrorKinds = new Set([
  'contextWindowExceeded',
  'sessionBudgetExceeded',
  'usageLimitExceeded',
  'rateLimitExceeded',
  'flexUnavailable',
  'serverOverloaded',
  'cyberPolicy',
  'misalignmentPolicyViolation',
  'tooManyDenials',
  'internalServerError',
  'unauthorized',
  'badRequest',
  'threadRollbackFailed',
  'sandboxError',
  'other',
  'httpConnectionFailed',
  'responseStreamConnectionFailed',
  'responseStreamDisconnected',
  'responseTooManyFailedAttempts',
  'activeTurnNotSteerable'
])

const providerErrorDiagnostic = (error: unknown, willRetry?: unknown) => {
  const record = isRecord(error) ? error : {}
  const info = record.codexErrorInfo
  let candidate: string | undefined

  if (typeof info === 'string') {
    candidate = info
  } else if (isRecord(info) && Object.keys(info).length === 1) {
    candidate = Object.keys(info)[0]
  }

  const kind =
    candidate && nativeErrorKinds.has(candidate) ? candidate : undefined
  const details =
    kind && isRecord(info) && isRecord(info[kind]) ? info[kind] : undefined
  const status = details?.httpStatusCode
  const rpcCode =
    typeof record.code === 'number' && Number.isSafeInteger(record.code)
      ? record.code
      : undefined

  return {
    reason: kind ?? (rpcCode === undefined ? 'unclassified' : 'rpcError'),
    ...(rpcCode === undefined ? {} : { rpcCode }),
    ...(typeof status === 'number' &&
    Number.isInteger(status) &&
    status >= 100 &&
    status <= 599
      ? { httpStatusCode: status }
      : {}),
    ...(typeof willRetry === 'boolean' ? { willRetry } : {}),
    detailOmitted:
      Object.keys(record).some(
        (key) => !['code', 'codexErrorInfo'].includes(key)
      ) ||
      (info !== undefined && !kind) ||
      !isRecord(error)
  }
}

/** One subprocess per request with only explicitly registered App tools. Credentials are owned entirely by Codex. */
const runLocalAiProvider = async (
  input: AiProviderInput,
  options: {
    readonly model: string
    readonly executable: string
    readonly onProgress?: (event: AiToolProgress) => void
    readonly resultContext?: ExchangeConversationResults
    readonly executeBatch?: ExecuteAiBatch
    readonly signal?: AbortSignal
    readonly retainReference?: (
      image: { dataUrl: string; mediaType: string },
      attachmentIndex: number
    ) => unknown
    readonly retainToolImage?: (
      imageUrl: string,
      callId: string,
      contentIndex: number
    ) => void
    readonly retainEvaluationExchange?: (
      callId: string,
      phase: 'input' | 'output',
      value: unknown
    ) => void
    readonly conversations?: NativeConversations
    readonly reportSessions?: EvaluationReportSessions
    readonly recordFollowup?: (
      callId: string,
      phase: 'input' | 'output',
      value: unknown
    ) => Promise<void>
    readonly checkOnly?: boolean
    readonly assessmentOnly?: boolean
    readonly toolLibraryDirectory?: string
    readonly recordDirectory?: string
    readonly sourceRevision?: string
    readonly sourceFingerprint?: string
    readonly sourceIdentityStatus?: 'captured' | 'configured' | 'unavailable'
  },
  usage?: ReturnType<typeof createAiExecutionProfiler>,
  sharedTools?: Awaited<ReturnType<typeof createDesignProviderTools>>,
  workState = { stopped: false }
): Promise<unknown> => {
  const evaluation =
    options.assessmentOnly || options.checkOnly
      ? undefined
      : readEvaluationWindow(
          isRecord(input.metadata) ? input.metadata.evaluationWindow : undefined
        )

  if (
    evaluation?.keepReportSession &&
    (!options.reportSessions || !options.recordFollowup || !usage)
  ) {
    throw Error(
      'Retained evaluation reporting requires a service owner and evidence recording'
    )
  }

  if (!sharedTools) {
    throw Error('Design tool composition is required')
  }

  const {
    reportProgress,
    requestContext,
    toolController,
    knowledge,
    nativeDefinitions,
    toolBindings,
    inputItems
  } = sharedTools
  const notificationCounts = new Map<string, number>()

  const toolTasks = new Map<Promise<void>, string>()
  const toolCalls = new Set<string>()

  let nativeConfig:
    Awaited<ReturnType<typeof createNativeProviderConfig>> | undefined
  let child: ChildProcessWithoutNullStreams

  try {
    const finishConfiguration = usage?.span({
      callId: 'native-configuration',
      owner: 'provider',
      purpose: 'Prepare direct native tool configuration'
    })

    try {
      nativeConfig = await createNativeProviderConfig({
        executable: options.executable,
        model: options.model,
        directory: options.recordDirectory ?? 'tmp/ai-executions',
        signal: options.signal
      })
    } finally {
      finishConfiguration?.()
    }

    options.signal?.throwIfAborted()
    child = startNativeProcess(options.executable, [
      'app-server',
      '--listen',
      'stdio://',
      ...nativeConfig.arguments,
      ...Object.entries(localProviderConfig).flatMap(([key, value]) => [
        '-c',
        `${key}=${JSON.stringify(value)}`
      ])
    ])
  } catch {
    const cleanups = [
      ['native-configuration', () => nativeConfig?.dispose()]
    ] as const
    const settled = await Promise.allSettled(
      cleanups.map(([, cleanup]) => Promise.resolve().then(cleanup))
    )

    settled.forEach((result, index) => {
      if (result.status === 'rejected') {
        usage?.trace('host_observation', {
          callId: 'provider-cleanup',
          phase: 'cleanup',
          executor: cleanups[index][0],
          status: 'failed',
          code: 'TOOL_CLEANUP_FAILED',
          error: localToolErrorMessage(result.reason)
        })
      }
    })
    if (options.signal?.aborted) {
      throw failure('AI_MODEL_BACKEND_ABORTED')
    }

    throw failure('AI_MODEL_BACKEND_INVALID_CONFIGURATION')
  }

  const writeProtocol = (wire: string, bytes?: number) => {
    if (!transport) {
      throw failure('AI_MODEL_BACKEND_INVALID_CONFIGURATION')
    }

    return transport.write(wire, bytes)
  }

  const rpcDiagnostics = new WeakMap<
    Error,
    ReturnType<typeof providerErrorDiagnostic>
  >()
  let terminalError: Error | undefined
  let conversationLease: NativeConversationLease | undefined
  let threadId: string | undefined
  let turnId: string | undefined
  let finalText: string | undefined
  let completedTurnId: string | undefined
  let completedTurnStatus: string | undefined
  let stopped = false
  let retainedSession = false
  let transportClosed = false
  let followupMessages: { phase: string; text: string }[] | undefined
  let resolveClose!: () => void
  const closed = new Promise<void>((resolve) => {
    resolveClose = resolve
  })
  let resolveCompletion!: () => void
  let rejectCompletion!: (error: Error) => void
  let completion = new Promise<void>((resolve, reject) => {
    resolveCompletion = resolve
    rejectCompletion = reject
  })

  // Protocol failure may precede turn/start; keep that early rejection handled.
  void completion.catch(() => {
    /* The owning request observes terminalError below. */
  })
  let rejectEvaluation!: (error: Error) => void
  const evaluationFailure = new Promise<never>((_resolve, reject) => {
    rejectEvaluation = reject
  })

  void evaluationFailure.catch(() => undefined)

  const stop = () => {
    if (!stopped) {
      stopped = true
      toolController.abort()
      child.kill('SIGKILL')
    }
  }

  const fail = (error: Error) => {
    terminalError ??= error
    session?.fail(terminalError)
    rejectEvaluation(terminalError)
    transport?.abortPending(terminalError)
    rejectCompletion(terminalError)
    stop()
  }

  const abort = () => {
    if (
      reportPhase &&
      evaluationControl &&
      options.signal?.reason === 'request closed'
    ) {
      usage?.trace('host_observation', {
        callId: 'evaluation-report-transport-closed',
        status: 'continuing',
        reason:
          'Recorder-owned report retains its original thread after browser loss'
      })

      return
    }

    fail(failure('AI_MODEL_BACKEND_ABORTED'))
  }

  const timeout = options.checkOnly
    ? setTimeout(() => fail(failure('AI_MODEL_BACKEND_TIMEOUT')), 10_000)
    : undefined
  let workStopReason: EvaluationStopReason | undefined
  let evaluationControl: ReturnType<typeof createEvaluationControl>
  let reportPhase = false
  let workTimer: ReturnType<typeof setTimeout> | undefined
  let reportTimer: ReturnType<typeof setTimeout> | undefined
  let reportStarted = false

  const beginReportBudget = () => {
    if (!evaluation || reportStarted) {
      return
    }

    reportStarted = true
    usage?.trace('host_observation', {
      callId: 'evaluation-report-started',
      workDeadlineAt: evaluation.workDeadlineAt,
      timeoutMs: evaluation.reportTimeoutMs
    })
    if (evaluation.reportTimeoutMs === null) {
      return
    }

    reportTimer = setTimeout(() => {
      usage?.trace('host_observation', {
        callId: 'evaluation-report-failed',
        reason: 'report-timeout'
      })
      fail(failure('AI_MODEL_BACKEND_TIMEOUT'))
    }, evaluation.reportTimeoutMs)
  }

  const stopEvaluationWork = (
    reason: EvaluationStopReason = {
      kind: 'work-deadline',
      message: 'Drawing work deadline reached'
    }
  ) => {
    if (!evaluation || workState.stopped) {
      return
    }

    const stopReason = reason

    workState.stopped = true
    workStopReason = stopReason
    evaluationControl?.dispose()
    toolController.abort()
    beginReportBudget()
    usage?.trace('host_observation', {
      callId: 'evaluation-work-stopped',
      stopReason,
      workDeadlineAt: evaluation.workDeadlineAt,
      nativeTurnId: turnId
    })
    if (threadId && turnId && completedTurnId === undefined) {
      void request('turn/interrupt', { threadId, turnId }).catch((error) =>
        fail(error)
      )
    }
  }

  const protocolFailure = (
    reason = 'Invalid protocol envelope',
    metadata?: Record<string, unknown>
  ) => {
    usage?.trace('protocol_rejected', { reason, ...metadata })
    fail(failure('AI_MODEL_BACKEND_INVALID_RESPONSE'))
  }

  const receive = (value: unknown) => {
    session?.observe(value)
    if (!isRecord(value)) {
      return protocolFailure()
    }

    if (value.id !== undefined && value.method === 'item/tool/call') {
      const params = value.params

      if (
        evaluation &&
        isRecord(params) &&
        params.threadId === threadId &&
        (workState.stopped || Date.now() >= evaluation.workDeadlineAt)
      ) {
        usage?.trace('host_observation', {
          kind: 'evaluation-tool-rejected',
          callId: params.callId,
          nativeTurnId: params.turnId,
          phase: reportPhase ? 'report' : 'cutoff'
        })
        writeProtocol(
          JSON.stringify({
            id: value.id,
            result: {
              success: false,
              contentItems: [
                {
                  type: 'inputText',
                  text: JSON.stringify({
                    code: 'EVALUATION_WORK_CLOSED',
                    message:
                      'Do not execute or replay operations. Return the requested public report.'
                  })
                }
              ]
            }
          }) + '\n'
        )

        return
      }

      const binding =
        isRecord(params) &&
        typeof params.tool === 'string' &&
        typeof params.namespace === 'string'
          ? toolBindings.get(`${params.namespace}.${params.tool}`)
          : undefined

      if (
        (typeof value.id !== 'number' && typeof value.id !== 'string') ||
        !isRecord(params) ||
        !threadId ||
        params.threadId !== threadId ||
        typeof params.turnId !== 'string' ||
        !turnId ||
        params.turnId !== turnId ||
        completedTurnId !== undefined ||
        !binding ||
        typeof params.callId !== 'string' ||
        toolCalls.has(params.callId) ||
        toolTasks.size >= LocalComponentAnalysisLimits.callsInFlight
      ) {
        return protocolFailure()
      }

      const replyId = value.id
      const toolName = String(params.tool)

      toolCalls.add(params.callId)
      const toolStartedAt = performance.now()
      const task = sharedTools
        .invoke({
          namespace: String(params.namespace),
          name: binding.definition.name,
          callId: String(params.callId),
          arguments: params.arguments
        })
        .then((reply) => {
          const { success, contentItems } = reply

          if (terminalError || stopped || workState.stopped) {
            return
          }

          toolTasks.delete(task)
          session.reply(replyId, { success, contentItems })
          contentItems.forEach((item, index) => {
            if (item.type === 'inputImage') {
              options.retainToolImage?.(
                item.imageUrl,
                String(params.callId),
                index
              )
            }
          })
          usage?.trace('provider_transport_event', {
            method: 'tool-result-submitted',
            tool: toolName,
            callId: params.callId,
            imageCount: contentItems.filter(
              (item) => item.type === 'inputImage'
            ).length,
            visibility: 'submitted-to-transport'
          })
        })
        .catch((error: unknown) => {
          if (workState.stopped && !terminalError) {
            return
          }

          const code = 'TOOL_DELIVERY_TRANSPORT_FAILED'

          usage?.trace('tool_delivery_failed', {
            tool: toolName,
            callId: params.callId,
            durationMs: performance.now() - toolStartedAt,
            reason: localToolErrorMessage(error),
            code
          })
          fail(failure('AI_MODEL_BACKEND_TRANSPORT_FAILED'))
        })
        .finally(() => {
          toolTasks.delete(task)
        })

      toolTasks.set(task, toolName)

      return
    }

    if (value.id !== undefined) {
      transport?.receiveResponse(value)

      return
    }

    if (typeof value.method !== 'string') {
      return protocolFailure()
    }

    const params = value.params

    if (!isRecord(params)) {
      return
    }

    const diagnostic = startupDiagnostic(value.method, params)

    if (diagnostic) {
      // A child belongs to one invocation; startup can precede thread/start's reply.
      if (threadId && params.threadId && params.threadId !== threadId) {
        return
      }

      usage?.trace('provider_notification', {
        method: value.method,
        nativeThreadId: params.threadId,
        diagnostic
      })
      notificationCounts.set(
        value.method,
        (notificationCounts.get(value.method) ?? 0) + 1
      )

      return
    }

    const matchingTurnPlan =
      value.method === 'turn/plan/updated' &&
      params.threadId == null &&
      turnId &&
      params.turnId === turnId

    if (!threadId || (params.threadId !== threadId && !matchingTurnPlan)) {
      return
    }

    if (/^[A-Za-z0-9_/.:-]{1,120}$/.test(value.method)) {
      const itemId = isRecord(params.item) ? params.item.id : undefined
      let errorDiagnostic:
        ReturnType<typeof providerErrorDiagnostic> | undefined

      if (value.method === 'error') {
        errorDiagnostic = providerErrorDiagnostic(
          params.error,
          params.willRetry
        )
      } else if (
        value.method === 'turn/completed' &&
        isRecord(params.turn) &&
        params.turn.error
      ) {
        errorDiagnostic = providerErrorDiagnostic(params.turn.error)
      }

      const publicActivity =
        !turnId || !params.turnId || params.turnId === turnId
          ? selectPublicActivity(value.method, { ...params, threadId })
          : undefined

      usage?.trace('provider_notification', {
        method: value.method,
        ...(publicActivity
          ? { phase: 'public-activity', nativeOutput: publicActivity }
          : {}),
        nativeThreadId: threadId,
        nativeTurnId: params.turnId,
        kind: isRecord(params.item) ? params.item.type : undefined,
        callId:
          (typeof params.itemId === 'string' ? params.itemId : itemId) ??
          (publicActivity ? params.turnId : undefined),
        ...(errorDiagnostic ? { diagnostic: errorDiagnostic } : {})
      })
      notificationCounts.set(
        value.method,
        (notificationCounts.get(value.method) ?? 0) + 1
      )
    }

    if (
      (options.assessmentOnly || reportPhase) &&
      (value.method === 'item/started' || value.method === 'item/completed') &&
      isRecord(params.item) &&
      ![
        'agentMessage',
        'userMessage',
        'reasoning',
        'plan',
        'contextCompaction'
      ].includes(String(params.item.type))
    ) {
      return protocolFailure('Unexpected tool item in diagnostic assessment')
    }

    if (
      followupMessages &&
      value.method === 'item/completed' &&
      isRecord(params.item) &&
      params.item.type === 'agentMessage' &&
      typeof params.item.text === 'string' &&
      params.turnId === turnId
    ) {
      followupMessages.push({
        phase: String(params.item.phase ?? 'commentary'),
        text: params.item.text
      })
    }

    if (value.method === 'thread/tokenUsage/updated') {
      if (!turnId || !params.turnId || params.turnId === turnId) {
        usage?.update(params.tokenUsage)
      }

      return
    }

    if (turnId && params.turnId && params.turnId !== turnId) {
      return protocolFailure()
    }

    // Correlated native completion summarizes the App-owned reply; it is not
    // a second execution outcome. Reuse the same decision throughout this event.
    const appToolCompletion =
      isRecord(params.item) &&
      params.item.type === 'dynamicToolCall' &&
      typeof params.item.tool === 'string' &&
      typeof params.item.namespace === 'string' &&
      toolBindings.has(`${params.item.namespace}.${params.item.tool}`) &&
      typeof params.item.id === 'string' &&
      toolCalls.has(params.item.id) &&
      ['completed', 'failed'].includes(String(params.item.status))

    if (
      (value.method === 'item/started' || value.method === 'item/completed') &&
      isRecord(params.item) &&
      params.item.type === 'contextCompaction' &&
      typeof params.item.id === 'string'
    ) {
      if (value.method === 'item/completed') {
        knowledge.invalidateContext()
      }

      return
    }

    if (
      (value.method === 'item/started' || value.method === 'item/completed') &&
      isRecord(params.item) &&
      typeof params.item.id === 'string' &&
      !['webSearch', 'sleep', 'userMessage'].includes(String(params.item.type))
    ) {
      usage?.trace(
        value.method === 'item/started'
          ? 'provider_item_started'
          : 'provider_item_completed',
        {
          callId: `item:${params.item.id}`,
          nativeThreadId: params.threadId,
          nativeTurnId: params.turnId,
          nativeItemId: params.item.id,
          kind: params.item.type,
          actor: 'provider',
          executor: 'native-provider',
          ...(value.method === 'item/completed' &&
          appToolCompletion &&
          [
            'search_design_tools',
            'read_design_resources',
            'read_knowledge'
          ].includes(String(params.item.tool))
            ? {
                tool: params.item.tool,
                nativeOutput: {
                  stage: 'native-completed-result',
                  modelVisibility: 'unavailable',
                  toolCallId: params.item.id,
                  nativeThreadId: params.threadId,
                  nativeTurnId: params.turnId,
                  nativeStatus: params.item.status,
                  success:
                    typeof params.item.success === 'boolean'
                      ? params.item.success
                      : null,
                  ...retainNativeText(params.item.contentItems)
                }
              }
            : {}),
          ...(params.item.type === 'mcpToolCall' &&
          typeof params.item.tool === 'string'
            ? { tool: params.item.tool }
            : {})
        }
      )
    }

    if (
      (value.method === 'item/started' || value.method === 'item/completed') &&
      isRecord(params.item) &&
      params.item.type === 'webSearch'
    ) {
      if (typeof params.item.id !== 'string' || !params.item.id) {
        return protocolFailure()
      }

      usage?.trace(
        value.method === 'item/started'
          ? 'research_started'
          : 'research_completed',
        { callId: params.item.id, result: params.item }
      )
      reportProgress({
        tool: AiResearchActivityIds.RESEARCH_DESIGN_CONTEXT,
        status: value.method === 'item/started' ? 'running' : 'completed',
        activity: { kind: 'system', callId: params.item.id, sequence: 0 }
      })

      return
    }

    if (
      (value.method === 'item/started' || value.method === 'item/completed') &&
      isRecord(params.item) &&
      params.item.type === 'sleep'
    ) {
      const item = params.item

      if (
        typeof item.id !== 'string' ||
        !item.id ||
        typeof item.durationMs !== 'number' ||
        !Number.isFinite(item.durationMs) ||
        item.durationMs < 0
      ) {
        return protocolFailure('Malformed native sleep item')
      }

      // Native clock.sleep emits a display item, never an App receipt or final batch.
      usage?.trace(
        value.method === 'item/started'
          ? 'provider_item_started'
          : 'provider_item_completed',
        { callId: `item:${item.id}`, kind: item.type }
      )

      return
    }

    if (value.method === 'item/completed') {
      const item = params.item

      if (!isRecord(item)) {
        return protocolFailure()
      }

      if (item.type === 'agentMessage' && item.phase === 'commentary') {
        if (
          typeof item.text === 'string' &&
          item.text.trim() &&
          Array.from(item.text).length <= 1000
        ) {
          reportProgress({
            tool: 'public-progress',
            status: 'running',
            message: item.text,
            activity: {
              kind: 'work',
              callId: typeof item.id === 'string' ? item.id : randomUUID(),
              sequence: 0,
              scope: 'request',
              phase: 'provider'
            }
          })
        }
      } else if (item.type === 'agentMessage') {
        if (typeof item.text !== 'string' || finalText !== undefined) {
          return protocolFailure()
        }

        finalText = item.text
      } else if (appToolCompletion) {
        // Only the App-owned tool response is admitted.
      } else if (
        item.type === 'mcpToolCall' &&
        item.server === 'codex' &&
        ['list_mcp_resources', 'list_mcp_resource_templates'].includes(
          String(item.tool)
        ) &&
        typeof item.id === 'string' &&
        ['completed', 'failed'].includes(String(item.status))
      ) {
        // Native discovery is metadata, not external execution or an App receipt.
        usage?.trace('orchestration_completed', {
          tool: String(item.tool),
          callId: item.id
        })
      } else if (
        !['agentMessage', 'userMessage', 'reasoning', 'plan'].includes(
          String(item.type)
        )
      ) {
        const safeName = (name: unknown) =>
          typeof name === 'string' && /^[a-zA-Z0-9_/:.-]{1,80}$/.test(name)
            ? name
            : undefined

        return protocolFailure('Unsupported completed item', {
          type: safeName(item.type),
          tool: safeName(item.name ?? item.tool),
          namespace: safeName(item.namespace)
        })
      }
    }

    if (value.method === 'turn/completed') {
      const turn = params.turn
      const hasAcceptedCompletionStatus =
        isRecord(turn) &&
        (turn.status === 'completed' ||
          (evaluation &&
            workState.stopped &&
            !reportPhase &&
            turn.status === 'interrupted'))

      if (!hasAcceptedCompletionStatus || typeof turn.id !== 'string') {
        return fail(failure('AI_MODEL_BACKEND_TRANSPORT_FAILED'))
      }

      completedTurnId = turn.id
      completedTurnStatus = String(turn.status)
      resolveCompletion()
    }
  }

  const transport: ReturnType<typeof createNativeRpcTransport> =
    createNativeRpcTransport({
      child,
      maximumFrameBytes: maximumProtocolBytes,
      receive,
      fail,

      error: (kind) => {
        if (kind === 'configuration') {
          return failure('AI_MODEL_BACKEND_INVALID_CONFIGURATION')
        }

        if (kind === 'protocol') {
          return failure('AI_MODEL_BACKEND_INVALID_RESPONSE')
        }

        return failure('AI_MODEL_BACKEND_TRANSPORT_FAILED')
      },

      rpcError(value) {
        const error = failure('AI_MODEL_BACKEND_TRANSPORT_FAILED')

        rpcDiagnostics.set(error, providerErrorDiagnostic(value))

        return error
      },

      isStopped: () => stopped,

      isRetained: () => retainedSession,

      isComplete: () =>
        Boolean(options.checkOnly ? threadId : completedTurnId) &&
        transport?.pendingCount === 0 &&
        toolTasks.size === 0,

      closed: () => {
        transportClosed = true
        resolveClose()
      },

      observeBytes: (direction, bytes, channel) =>
        usage?.recordTransport(direction, bytes, channel),

      observeStream: (channel, status, terminal) =>
        usage?.trace('provider_transport_event', {
          channel,
          status,
          terminal,
          nativeThreadId: threadId,
          nativeTurnId: turnId
        }),

      observeRequest: (event) =>
        usage?.trace(`provider_request_${event.status}`, {
          callId: `rpc-${event.id}`,
          method: event.method,
          ...(event.status === 'started'
            ? { requestBytes: event.requestBytes }
            : { durationMs: event.durationMs }),
          ...(event.status === 'failed'
            ? {
                diagnostic:
                  event.error instanceof Error
                    ? rpcDiagnostics.get(event.error)
                    : undefined
              }
            : {})
        })
    })

  usage?.trace('provider_notification', nativeOutputVisibility)
  options.signal?.addEventListener('abort', abort, { once: true })
  const request = transport.request

  const session = createNativeSession(transport, {
    error: () => failure('AI_MODEL_BACKEND_INVALID_RESPONSE')
  })

  let finishTurnWait: (() => void) | undefined

  try {
    if (options.signal?.aborted) {
      abort()
    }

    if (evaluation) {
      evaluationControl = createEvaluationControl(
        options.recordDirectory,
        evaluation.workDeadlineAt,
        stopEvaluationWork
      )
      if (evaluationControl) {
        usage?.trace('host_observation', {
          callId: 'evaluation-control-armed',
          workDeadlineAt: evaluation.workDeadlineAt
        })
      }

      workTimer = setTimeout(
        stopEvaluationWork,
        Math.max(0, evaluation.workDeadlineAt - Date.now())
      )
    }

    await request('initialize', {
      clientInfo: { name: 'design-local-ai', version: '1' },
      capabilities: { experimentalApi: true }
    })
    writeProtocol(JSON.stringify({ method: 'initialized' }) + '\n')
    const account = await request('account/read', { refreshToken: false })

    if (
      !isRecord(account) ||
      !isRecord(account.account) ||
      account.account.type !== 'chatgpt'
    ) {
      throw failure('AI_MODEL_BACKEND_INVALID_CONFIGURATION')
    }

    // Native configuration merges tables: {} does not remove personal MCPs.
    // Resolve names from the same process/configuration that will start the thread.
    const effectiveConfig = await request('config/read', {
      includeLayers: false
    })

    if (!isRecord(effectiveConfig) || !isRecord(effectiveConfig.config)) {
      throw failure('AI_MODEL_BACKEND_INVALID_CONFIGURATION')
    }

    const inheritedServers = effectiveConfig.config.mcp_servers

    if (inheritedServers !== undefined && !isRecord(inheritedServers)) {
      throw failure('AI_MODEL_BACKEND_INVALID_CONFIGURATION')
    }

    const disabledServers = Object.fromEntries(
      Object.entries(inheritedServers ?? {}).map(([name, entry]) => {
        if (!isRecord(entry)) {
          throw failure('AI_MODEL_BACKEND_INVALID_CONFIGURATION')
        }

        // config/read emits null for unset optional fields. RPC overrides turn
        // null into an empty TOML string; omit those unset fields on the way back.
        const configuredFields = Object.fromEntries(
          Object.entries(entry).filter(([, value]) => value !== null)
        )

        return [name, { ...configuredFields, enabled: false }]
      })
    )
    const appOwnedInstructionBlocks = sharedTools.instructions()
    const baseInstructions = appOwnedInstructionBlocks
      .filter((block) => block.role === 'base')
      .map((block) => block.text)
      .join('')
    const developerInstructions = appOwnedInstructionBlocks
      .filter((block) => block.role === 'developer')
      .map((block) => block.text)
      .join('')

    const threadParameters = {
      model: options.model,
      modelProvider: 'openai',
      ephemeral: true,
      allowProviderModelFallback: false,
      environments: [],
      dynamicTools: nativeDefinitions,
      runtimeWorkspaceRoots: [],
      selectedCapabilityRoots: [],
      approvalPolicy: 'never',
      sandbox: 'read-only',
      baseInstructions,
      developerInstructions,
      config: {
        model_reasoning_effort: 'medium',
        ...localProviderConfig,
        web_search: options.assessmentOnly ? 'disabled' : 'live',
        mcp_servers: disabledServers
      }
    }

    if (
      !evaluation &&
      !options.assessmentOnly &&
      !options.checkOnly &&
      options.conversations &&
      isRecord(input.metadata) &&
      typeof input.metadata.conversationId === 'string'
    ) {
      try {
        conversationLease = options.conversations.acquire(
          input.metadata.conversationId,
          {
            executable: options.executable,
            ...threadParameters
          }
        )
      } catch (error) {
        throw new AiModelBackendError(
          'AI_MODEL_BACKEND_SESSION_UNAVAILABLE',
          error instanceof Error
            ? error.message
            : 'Native conversation unavailable'
        )
      }
    }

    const resumed = conversationLease?.threadId !== undefined

    await session
      .open(threadParameters, conversationLease, (thread) => {
        if (
          !isRecord(thread) ||
          !isRecord(thread.thread) ||
          typeof thread.thread.id !== 'string' ||
          thread.model !== options.model ||
          thread.reasoningEffort !== 'medium' ||
          !Array.isArray(thread.instructionSources) ||
          !thread.instructionSources.every((source) =>
            ['AGENTS.md', 'AGENTS.override.md'].some(
              (file) =>
                source ===
                resolve(
                  process.env.CODEX_HOME || resolve(homedir(), '.codex'),
                  file
                )
            )
          ) ||
          !Array.isArray(thread.runtimeWorkspaceRoots) ||
          thread.runtimeWorkspaceRoots.length !== 0
        ) {
          throw failure('AI_MODEL_BACKEND_INVALID_CONFIGURATION')
        }

        threadId = thread.thread.id
      })
      .catch((error) => {
        if (resumed && !options.signal?.aborted) {
          throw new AiModelBackendError(
            'AI_MODEL_BACKEND_SESSION_UNAVAILABLE',
            'The previous native conversation could not be resumed.'
          )
        }

        throw error
      })
    usage?.trace('provider_transport_event', {
      method: resumed ? 'conversation/resumed' : 'conversation/started',
      nativeThreadId: threadId
    })
    inputItems.splice(
      0,
      inputItems.length,
      ...sharedTools.inputForTurn(resumed)
    )

    if (options.checkOnly) {
      return
    }

    finishTurnWait = usage?.span({
      callId: 'provider-turn',
      owner: 'provider',
      purpose:
        'Await provider turn until completion or failure; internal compute is unavailable'
    })
    if (
      workState.stopped ||
      (evaluation && Date.now() >= evaluation.workDeadlineAt)
    ) {
      throw failure('AI_MODEL_BACKEND_TIMEOUT')
    }

    if (evaluation && evaluation.announceWorkDeadline !== false) {
      inputItems.push({
        type: 'text',
        text: `This evaluation has ${Math.max(0, Math.floor((evaluation.workDeadlineAt - Date.now()) / 1000))} seconds of work remaining, ending at ${new Date(evaluation.workDeadlineAt).toISOString()}. Prioritize useful visible progress. The host will stop operations at that time and ask for a public report. Do not continue drawing during reporting; preserve completed work.`,
        text_elements: []
      })
    }

    if (evaluation) {
      options.retainEvaluationExchange?.('evaluation-work', 'input', {
        threadId,
        environments: [],
        input: inputItems,
        ...(!options.assessmentOnly ? { summary: 'concise' } : {}),
        effort: 'medium'
      })
    }

    await session.startTurn(
      {
        threadId,
        environments: [],
        input: inputItems,
        ...(!options.assessmentOnly ? { summary: 'concise' } : {}),
        effort: 'medium'
      },
      (started) => {
        if (
          !isRecord(started) ||
          !isRecord(started.turn) ||
          typeof started.turn.id !== 'string'
        ) {
          throw failure('AI_MODEL_BACKEND_INVALID_RESPONSE')
        }

        turnId = started.turn.id
      }
    )
    if (evaluation && workState.stopped && completedTurnId === undefined) {
      await request('turn/interrupt', { threadId, turnId })
    }

    await completion
    if (completedTurnId !== turnId) {
      throw failure('AI_MODEL_BACKEND_INVALID_RESPONSE')
    }

    if (evaluation) {
      finishTurnWait?.()
      finishTurnWait = undefined
      clearTimeout(workTimer)
      options.retainEvaluationExchange?.('evaluation-work', 'output', {
        nativeThreadId: threadId,
        nativeTurnId: completedTurnId,
        status: completedTurnStatus,
        stoppedAtDeadline: workStopReason?.kind === 'work-deadline',
        ...(workStopReason ? { stopReason: workStopReason } : {}),
        text: finalText ?? null
      })
      // The completed/interrupted work turn is terminal before the same thread reports.
      usage?.trace('host_observation', {
        callId: 'evaluation-work-settled',
        nativeTurnId: completedTurnId,
        status: completedTurnStatus,
        reason: workStopReason?.kind ?? 'native-completion'
      })
      workState.stopped = true
      evaluationControl?.dispose()
      toolController.abort()
      beginReportBudget()
      await Promise.race([
        Promise.allSettled(toolTasks.keys()),
        evaluationFailure
      ])
      reportPhase = true
      finalText = undefined
      completedTurnId = undefined
      completion = new Promise<void>((resolve, reject) => {
        resolveCompletion = resolve
        rejectCompletion = reject
      })
      void completion.catch(() => undefined)
      finishTurnWait = usage?.span({
        callId: 'evaluation-report-wait',
        owner: 'provider',
        purpose:
          'Await the same-thread public self-report; causal claims remain unverified'
      })

      // Facts from the existing causal receipts, after all native work has settled.
      // Keep geometry and arbitrary owner text out of the reporting prompt.
      const label = (value: unknown) =>
        typeof value === 'string' && value.length <= 256 ? value : null

      const count = (value: unknown) =>
        typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
          ? value
          : null

      const batches = requestContext?.receipts.filter(isRecord) ?? []
      const results = batches.flatMap((batch) =>
        Array.isArray(batch.actionResults)
          ? batch.actionResults.filter(isRecord)
          : []
      )
      const receiptFacts = {
        stopReason: workStopReason ?? null,
        attribution: 'settled-owner-receipts',
        scope:
          'Acknowledged action evidence, not visual acceptance or final transaction settlement. Omitted fields remain unconfirmed here. Never replay acknowledged work.',
        actionResultCount: results.length,
        omittedActionResults: Math.max(
          0,
          results.length - LocalToolLibraryLimits.receipts
        ),
        actionResults: results
          .slice(-LocalToolLibraryLimits.receipts)
          .map((entry) => {
            const result = isRecord(entry.result) ? entry.result : {}
            const range = isRecord(result.appliedRange)
              ? result.appliedRange
              : {}

            return {
              actionId: label(entry.actionId),
              actionName: label(entry.actionName),
              status: label(result.status),
              compositionId: label(result.compositionId),
              appliedElementCount: count(result.appliedElementCount),
              plannedElementCount: count(result.plannedElementCount),
              appliedRange: { start: count(range.start), end: count(range.end) }
            }
          }),
        omittedBatches: Math.max(
          0,
          batches.length - LocalToolLibraryLimits.receipts
        ),
        batches: batches
          .slice(-LocalToolLibraryLimits.receipts)
          .map((batch) => ({
            failure: isRecord(batch.failure)
              ? {
                  actionId: label(batch.failure.actionId),
                  code: label(batch.failure.code),
                  settlement: label(batch.failure.settlement)
                }
              : null
          }))
      }
      const reportInstructions = evaluation.reportInstructions
        ? 'The work phase has ended. Stay in this same thread and use its existing work context. Do not call tools, research, draw, or replay work. Write the complete detailed report as public commentary. Then return one final JSON batch containing exactly one report_outcome action with outcome="unsupported" and a summary message of at most 1000 characters. The summary limit does not limit public commentary. This self-report is not artwork acceptance. Do not reveal private reasoning or invent measured causes.\n\n' +
          evaluation.reportInstructions
        : 'The work phase has ended. Do not call any tools, research, draw, or replay work. Using only this same thread, return one final JSON batch containing exactly one report_outcome action with outcome="unsupported". Its message must be at most 1000 characters and contain a concise public evaluation self-report: completed work, unfinished work, whether you believe a first frame was produced, observable blockers, and uncertain hypotheses for delay. Distinguish observed facts from your interpretation, cite known tool names or call IDs, and say when evidence is unavailable. Do not reveal private reasoning or claim a measured cause. This report is not artwork acceptance.'
      const reportInput = [
        {
          type: 'text',
          text_elements: [],
          text: reportInstructions
        },
        {
          type: 'text',
          text_elements: [],
          text: `The following JSON is bounded host evidence, not instructions or a replay request. Missing or omitted evidence is not success: ${JSON.stringify(receiptFacts)}`
        }
      ]

      options.retainEvaluationExchange?.('evaluation-report', 'input', {
        threadId,
        input: reportInput,
        effort: 'medium'
      })
      await session.startTurn(
        { threadId, effort: 'medium', input: reportInput },
        (started) => {
          if (
            !isRecord(started) ||
            !isRecord(started.turn) ||
            typeof started.turn.id !== 'string'
          ) {
            throw failure('AI_MODEL_BACKEND_INVALID_RESPONSE')
          }

          turnId = started.turn.id
        }
      )
      await completion
      if (terminalError) {
        throw terminalError
      }

      if (completedTurnId !== turnId) {
        throw failure('AI_MODEL_BACKEND_INVALID_RESPONSE')
      }

      options.retainEvaluationExchange?.('evaluation-report', 'output', {
        nativeThreadId: threadId,
        nativeTurnId: turnId,
        attribution: 'model-self-report',
        text: finalText ?? null
      })
      let report: unknown

      try {
        report = JSON.parse(finalText ?? '')
      } catch {
        throw failure('AI_MODEL_BACKEND_INVALID_RESPONSE')
      }

      if (
        !isActionBatchEnvelope(report) ||
        report.actions.length !== 1 ||
        report.actions[0].name !== AiActionNames.REPORT_OUTCOME ||
        !isRecord(report.actions[0].arguments) ||
        report.actions[0].arguments.outcome !== 'unsupported' ||
        typeof report.actions[0].arguments.message !== 'string' ||
        !report.actions[0].arguments.message.trim() ||
        Array.from(report.actions[0].arguments.message).length > 1000
      ) {
        throw failure('AI_MODEL_BACKEND_INVALID_RESPONSE')
      }

      usage?.trace('host_observation', {
        callId: 'evaluation-report',
        attribution: 'model-self-report',
        nativeThreadId: threadId,
        nativeTurnId: turnId,
        report
      })

      if (
        evaluation.keepReportSession &&
        options.reportSessions &&
        options.recordFollowup &&
        usage &&
        threadId
      ) {
        if (transportClosed || terminalError) {
          throw terminalError ?? failure('AI_MODEL_BACKEND_TRANSPORT_FAILED')
        }

        const nativeThreadId = threadId
        const descriptor = options.reportSessions.retain({
          requestId: usage.requestId,
          nativeThreadId,

          lost: () => Boolean(terminalError) || stopped,

          record: options.recordFollowup,

          async ask(question): Promise<EvaluationReportReply> {
            if (terminalError || stopped) {
              throw terminalError ?? Error('Evaluation report session lost')
            }

            finalText = undefined
            completedTurnId = undefined
            followupMessages = []
            completion = new Promise<void>((resolve, reject) => {
              resolveCompletion = resolve
              rejectCompletion = reject
            })
            void completion.catch(() => undefined)
            try {
              await session.startTurn(
                {
                  threadId: nativeThreadId,
                  environments: [],
                  effort: 'medium',
                  input: [
                    {
                      type: 'text',
                      text_elements: [],
                      text:
                        'Continue the public analysis of your own drawing in this same thread. Do not call tools, research, draw, or replay work. Explain observable actions and uncertainty, not private reasoning. Answer fully as public commentary; the report has no time limit.\n\n' +
                        question
                    }
                  ]
                },
                (started) => {
                  if (
                    !isRecord(started) ||
                    !isRecord(started.turn) ||
                    typeof started.turn.id !== 'string'
                  ) {
                    throw failure('AI_MODEL_BACKEND_INVALID_RESPONSE')
                  }

                  turnId = started.turn.id
                }
              )
              await completion
              if (terminalError) {
                throw terminalError
              }

              if (
                !turnId ||
                completedTurnId !== turnId ||
                completedTurnStatus !== 'completed'
              ) {
                throw failure('AI_MODEL_BACKEND_INVALID_RESPONSE')
              }

              return {
                nativeThreadId,
                nativeTurnId: turnId,
                messages: followupMessages
              }
            } catch (error) {
              throw new EvaluationReportFailure(localToolErrorMessage(error), {
                nativeThreadId,
                nativeTurnId: turnId ?? '',
                messages: followupMessages
              })
            } finally {
              followupMessages = undefined
            }
          },

          async close() {
            fail(failure('AI_MODEL_BACKEND_ABORTED'))
            await closed
            await nativeConfig?.dispose()
          }
        })

        options.retainEvaluationExchange?.(
          'evaluation-session',
          'output',
          descriptor
        )
        retainedSession = true
      }

      return {
        ...report,
        explanation: evaluationReportExplanation
      }
    }

    finishTurnWait?.()
    await Promise.all(toolTasks.keys())
    if (terminalError) {
      throw terminalError
    }

    if (completedTurnId !== turnId || finalText === undefined) {
      throw failure('AI_MODEL_BACKEND_INVALID_RESPONSE')
    }

    let parsed: unknown

    try {
      parsed = JSON.parse(finalText)
    } catch {
      throw failure('AI_MODEL_BACKEND_INVALID_RESPONSE')
    }

    if (options.assessmentOnly) {
      return parsed
    }

    if (!isActionBatchEnvelope(parsed)) {
      throw failure('AI_MODEL_BACKEND_INVALID_RESPONSE')
    }

    let stage = 'final-action-admission'

    try {
      if (options.signal?.aborted) {
        throw failure('AI_MODEL_BACKEND_ABORTED')
      }

      stage = 'outcome-settlement'

      return parsed
    } catch (error) {
      usage?.trace('host_observation', {
        operation: 'finalization',
        stage,
        status: 'failed',
        message:
          error instanceof Error
            ? error.message
            : 'Unknown finalization failure'
      })
      if (options.signal?.aborted) {
        throw failure('AI_MODEL_BACKEND_ABORTED')
      }

      throw error
    }
  } finally {
    finishTurnWait?.()
    usage?.trace('provider_notifications', {
      callId: 'provider-notifications',
      notificationCounts: [...notificationCounts].map(
        ([notification, occurrences]) => ({ notification, occurrences })
      )
    })
    clearTimeout(workTimer)
    evaluationControl?.dispose()
    clearTimeout(reportTimer)
    if (timeout !== undefined) {
      clearTimeout(timeout)
    }

    options.signal?.removeEventListener('abort', abort)
    if (!retainedSession) {
      if (conversationLease && completedTurnId && !terminalError) {
        try {
          await session.unload()
        } catch (error) {
          usage?.trace('host_observation', {
            operation: 'native-unload',
            status: 'failed',
            message: localToolErrorMessage(error)
          })
        }
      }

      stop()
    }

    const finishClose = !retainedSession
      ? usage?.span({
          callId: 'provider-close',
          owner: 'provider',
          purpose: 'Await provider subprocess shutdown'
        })
      : undefined

    try {
      if (!retainedSession) {
        await closed
      }
    } finally {
      finishClose?.()
    }

    await Promise.allSettled(toolTasks.keys())
    const finishCleanup = usage?.span({
      callId: 'provider-cleanup',
      owner: 'app',
      purpose: 'Release request artifacts and close the tool store'
    })

    try {
      for (const [component, cleanup] of [
        [
          'native-configuration',
          () => (retainedSession ? undefined : nativeConfig?.dispose())
        ]
      ] as const) {
        const started = performance.now()

        try {
          await cleanup()
          usage?.trace('host_observation', {
            callId: 'provider-cleanup',
            phase: 'cleanup',
            executor: component,
            status: 'completed',
            durationMs: performance.now() - started
          })
        } catch (error) {
          // Teardown evidence cannot replace a settled product result or error.
          usage?.trace('host_observation', {
            callId: 'provider-cleanup',
            phase: 'cleanup',
            executor: component,
            status: 'failed',
            code: 'TOOL_CLEANUP_FAILED',
            durationMs: performance.now() - started,
            error: localToolErrorMessage(error)
          })
        }
      }
    } finally {
      conversationLease?.release()
      finishCleanup?.()
      // The initial execution is sealed below. Follow-ups have their own public
      // exchange records; never append provider events to a finished drawing.
      if (retainedSession) {
        usage = undefined
      }
    }
  }
}

interface LocalAiProviderOptions extends DesignAiRequestOptions {
  readonly conversations?: NativeConversations
  readonly reportSessions?: EvaluationReportSessions
  readonly executable: string
}

const requestRecordedLocalAi = (
  input: AiProviderInput,
  options: LocalAiProviderOptions & { assessmentOnly?: boolean }
) =>
  requestRecordedDesignAi(input, options, {
    id: 'local-codex',
    effort: 'medium',
    run: runLocalAiProvider
  })

export const requestLocalAiActionBatch = async (
  input: AiProviderInput,
  options: LocalAiProviderOptions
): Promise<unknown> => (await requestRecordedLocalAi(input, options)).value

export const requestLocalAiAssessment = (
  summary: { sourceRequestId: string; [key: string]: unknown },
  options: Omit<LocalAiProviderOptions, 'executeBatch' | 'onProgress'>
) =>
  requestRecordedLocalAi(
    {
      intent: 'Evaluate this recorded execution against the supplied criteria.',
      context: summary,
      actions: [],
      attempt: 1,
      metadata: {
        purpose: 'execution-assessment',
        sourceRequestId: summary.sourceRequestId
      }
    },
    { ...options, executeBatch: undefined, assessmentOnly: true }
  )

export const checkLocalAiProvider = async (
  options: LocalAiProviderOptions
): Promise<void> => {
  const input = { intent: '', context: {}, actions: [], attempt: 1 }
  const tools = await createDesignProviderTools(input, {
    ...options,
    checkOnly: true
  })

  try {
    await runLocalAiProvider(
      input,
      { ...options, checkOnly: true },
      undefined,
      tools
    )
  } finally {
    await tools.dispose()
  }
}

/** Select public text results only; opaque text is not safe structured evidence. */
function retainNativeText(contentItems: unknown) {
  if (contentItems == null) {
    return { status: 'unavailable', reason: 'content-not-exposed' }
  }

  if (!Array.isArray(contentItems)) {
    return { status: 'malformed', reason: 'content-not-array' }
  }

  if (!contentItems.length) {
    return { status: 'empty', content: [] }
  }

  return {
    status: 'available',
    content: contentItems.map((item, contentIndex) => {
      if (
        !isRecord(item) ||
        item.type !== 'inputText' ||
        typeof item.text !== 'string'
      ) {
        return {
          contentIndex,
          status: 'unavailable',
          reason: 'not-public-text'
        }
      }

      const identity = {
        contentIndex,
        bytes: Buffer.byteLength(item.text),
        sha256: createHash('sha256').update(item.text).digest('hex')
      }

      try {
        const value: unknown = JSON.parse(item.text)

        if (!isRecord(value) && !Array.isArray(value)) {
          return {
            ...identity,
            status: 'unavailable',
            reason: 'not-structured-text'
          }
        }

        return { ...identity, status: 'available', value }
      } catch {
        return {
          ...identity,
          status: 'unavailable',
          reason: 'not-structured-text'
        }
      }
    })
  }
}

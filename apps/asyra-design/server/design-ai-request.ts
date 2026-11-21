import { captureAiSourceIdentity } from '@asyra/ai-agent-runtime/node'
import { requireSetting, type AiModelBackendOptions } from './ai-model-contract'
import type {
  AiProviderInput,
  AiToolProgress,
  ExchangeConversationResults,
  ExecuteAiBatch
} from '@asyra/ai-agent-runtime'
import {
  AiProviderError,
  createAiExecutionProfiler
} from '@asyra/ai-agent-runtime'
import { createExecutionRecordSink } from '@asyra/ai-agent-runtime/node'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { readEvaluationWindow } from '../src/ai/evaluation-window'
import { AiModelBackendError } from './ai-model-contract'
import { createDesignProviderTools } from './design-provider-tools'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export interface DesignAiRequestOptions {
  readonly model: string
  readonly signal?: AbortSignal
  readonly assessmentOnly?: boolean
  readonly toolLibraryDirectory?: string
  readonly recordDirectory?: string
  readonly sourceRevision?: string
  readonly sourceFingerprint?: string
  readonly sourceIdentityStatus?: 'captured' | 'configured' | 'unavailable'
  readonly parentCallId?: string
  readonly sourceSpanId?: string
  readonly onProgress?: (event: AiToolProgress) => void
  readonly resultContext?: ExchangeConversationResults
  readonly executeBatch?: ExecuteAiBatch
}

export const resolveDesignAiRequestOptions = async (
  options: AiModelBackendOptions
) => {
  const environment = options.environment ?? process.env
  const model = requireSetting(environment, 'AI_PROVIDER_MODEL')
  const revision = environment.AI_EXECUTION_SOURCE_REVISION?.trim()
  const sourceIdentity = revision
    ? { sourceRevision: revision, sourceIdentityStatus: 'configured' as const }
    : await captureAiSourceIdentity({
        directory: process.cwd(),
        paths: [
          'apps/asyra-design/server',
          'apps/asyra-design/src',
          'packages',
          'yarn.lock',
          'package.json'
        ]
      })

  return {
    ...options,
    model,
    recordDirectory: environment.AI_EXECUTION_RECORD_DIR?.trim() || undefined,
    toolLibraryDirectory: environment.AI_TOOL_LIBRARY_DIR?.trim() || undefined,
    ...sourceIdentity
  }
}

export interface DesignAiDiagnosticCallbacks {
  retainReference(
    image: { dataUrl: string; mediaType: string },
    attachmentIndex: number
  ): unknown
  retainToolImage(imageUrl: string, callId: string, contentIndex: number): void
  recordFollowup(
    callId: string,
    phase: 'input' | 'output',
    value: unknown
  ): Promise<void>
  retainEvaluationExchange(
    callId: string,
    phase: 'input' | 'output',
    value: unknown
  ): void
}
export interface DesignAiSourceDriver<T extends DesignAiRequestOptions> {
  readonly id: string
  readonly effort?: string
  run(
    input: AiProviderInput,
    options: T & DesignAiDiagnosticCallbacks,
    usage: ReturnType<typeof createAiExecutionProfiler>,
    tools: Awaited<ReturnType<typeof createDesignProviderTools>>,
    workState: { stopped: boolean }
  ): Promise<unknown>
}

export const requestRecordedDesignAi = async <T extends DesignAiRequestOptions>(
  input: AiProviderInput,
  options: T,
  source: DesignAiSourceDriver<T>
) => {
  const purpose = options.assessmentOnly ? 'execution-assessment' : 'drawing'
  const sink = createExecutionRecordSink(
    options.recordDirectory ?? 'tmp/ai-executions'
  )
  const usage = createAiExecutionProfiler(input, options.model, {
    sink,
    provider: source.id,
    effort: source.effort,
    log: options.assessmentOnly
      ? (line) => console.error(line)
      : (line) => console.info(line),
    sourceRevision: options.sourceRevision,
    sourceFingerprint: options.sourceFingerprint,
    sourceIdentityStatus: options.sourceIdentityStatus,
    lifecycle: true,
    parentCallId: options.parentCallId,
    sourceSpanId: options.sourceSpanId,
    purpose,
    sourceRequestId:
      isRecord(input.metadata) &&
      typeof input.metadata.sourceRequestId === 'string'
        ? input.metadata.sourceRequestId
        : undefined
  })
  let outcome: Parameters<typeof usage.finish>[0] = 'failed'
  let resultEvidence: unknown
  let sharedTools:
    Awaited<ReturnType<typeof createDesignProviderTools>> | undefined
  const workState = { stopped: false }

  try {
    const retainReference = (
      image: { dataUrl: string; mediaType: string },
      attachmentIndex: number
    ) => {
      const asset = sink.writeAsset?.(
        usage.requestId,
        Buffer.from(image.dataUrl.split(',')[1], 'base64'),
        image.mediaType
      )

      usage.trace('asset_retained', { attachmentIndex, asset })

      return asset
    }

    if (
      !options.assessmentOnly &&
      isRecord(input.metadata) &&
      Array.isArray(input.metadata.imageAttachments)
    ) {
      input.metadata.imageAttachments.forEach((image, index) => {
        if (
          isRecord(image) &&
          typeof image.dataUrl === 'string' &&
          typeof image.mediaType === 'string'
        ) {
          retainReference(
            { dataUrl: image.dataUrl, mediaType: image.mediaType },
            index
          )
        }
      })
    }

    const retainToolImage = (
      imageUrl: string,
      callId: string,
      contentIndex: number
    ) => {
      // The shared tool delivery already validated these bytes. Preserve the submitted
      // payload without another capture or codec pass; recording is not authority.
      const mediaType = imageUrl.slice(5, imageUrl.indexOf(';'))
      let asset

      try {
        asset = sink.writeAsset?.(
          usage.requestId,
          Buffer.from(imageUrl.split(',')[1], 'base64'),
          mediaType
        ) ?? { status: 'failed', path: null }
      } catch {
        asset = { status: 'failed', path: null }
      }

      usage.trace('asset_retained', {
        callId,
        contentIndex,
        mediaType,
        status: 'submitted',
        asset
      })
    }

    const turnOptions = {
      ...options,
      retainReference,
      retainToolImage,

      async recordFollowup(
        callId: string,
        phase: 'input' | 'output',
        value: unknown
      ) {
        const directory = join(
          options.recordDirectory ?? 'tmp/ai-executions',
          `${usage.requestId}.followups`
        )

        await mkdir(directory, { recursive: true, mode: 0o700 })
        await writeFile(
          join(directory, `${callId}-${phase}.json`),
          JSON.stringify(value, null, 2),
          { flag: 'wx', mode: 0o600 }
        )
      },

      retainEvaluationExchange: (
        callId: string,
        phase: 'input' | 'output',
        value: unknown
      ) => {
        let receipt

        try {
          receipt = sink.writePayload?.(
            usage.requestId,
            callId,
            phase,
            value
          ) ?? { status: 'unavailable', path: null }
        } catch {
          receipt = { status: 'failed', path: null }
        }

        usage.trace('host_observation', { callId, phase, ...receipt })
      }
    }
    const evaluation = options.assessmentOnly
      ? undefined
      : readEvaluationWindow(
          isRecord(input.metadata) ? input.metadata.evaluationWindow : undefined
        )

    sharedTools = await createDesignProviderTools(
      input,
      {
        ...turnOptions,
        evaluation,

        workStopped: () => workState.stopped
      },
      usage
    )
    const candidate = await source.run(
      input,
      turnOptions,
      usage,
      sharedTools,
      workState
    )
    const result =
      options.assessmentOnly || evaluation
        ? candidate
        : sharedTools.settle(candidate)

    outcome = 'completed'
    resultEvidence = result

    return { value: result, requestId: usage.requestId }
  } catch (error) {
    if (options.signal?.aborted) {
      outcome = 'cancelled'
      throw new AiModelBackendError(
        'AI_MODEL_BACKEND_ABORTED',
        'The AI request was aborted.'
      )
    }

    if (
      error instanceof AiProviderError &&
      error.code === 'AI_PROVIDER_ABORTED'
    ) {
      outcome = 'cancelled'
    }

    if (error instanceof AiModelBackendError) {
      if (error.code === 'AI_MODEL_BACKEND_ABORTED') {
        outcome = 'cancelled'
      }

      if (error.code === 'AI_MODEL_BACKEND_TIMEOUT') {
        outcome = 'timed_out'
      }
    }

    if (options.assessmentOnly && error instanceof Error) {
      Object.assign(error, { requestId: usage.requestId })
    }

    throw error
  } finally {
    await sharedTools?.dispose()
    usage.trace('settlement', { outcome, result: resultEvidence })
    usage.finish(outcome)
    await sink.flush()
  }
}

import { createHash } from 'node:crypto'
import type { TokenUsage } from '../profiler/recorder.js'
import {
  AiProviderError,
  type AiActionBatch,
  type AiProvider,
  type AiProviderInput
} from '../provider.js'
import {
  createProviderConversations,
  type ProviderConversationStorage,
  type ProviderConversations
} from './provider-conversations.js'
import type {
  PrepareToolProvider,
  ToolProviderBinding,
  ToolProviderObservation
} from './tool-provider.js'

type RequestOptions = Parameters<AiProvider['requestActionBatch']>[1]
interface ResponsesCall {
  namespace: string
  name: string
  callId: string
  arguments: string
}

export interface ResponsesCheckpoint {
  responseId: string
  turn: string
  callIds: readonly string[]
  pending: readonly ResponsesCall[]
  outputs: readonly {
    type: 'function_call_output'
    call_id: string
    output: readonly (
      | { type: 'input_text'; text: string }
      | { type: 'input_image'; image_url: string }
    )[]
  }[]
  executing?: string
}
export type ResponsesConversations = ProviderConversations<ResponsesCheckpoint>

export const createResponsesConversations = (
  storage?: ProviderConversationStorage<ResponsesCheckpoint>
) => createProviderConversations<ResponsesCheckpoint>(storage)

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

function invalid(message: string): never {
  throw new AiProviderError({ code: 'AI_PROVIDER_MALFORMED_RESPONSE', message })
}

const identity = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

/** Validate an App checkpoint before using its IDs or submitting its receipts. */
export function isResponsesCheckpoint(
  value: unknown
): value is ResponsesCheckpoint {
  if (
    !record(value) ||
    !identity(value.responseId) ||
    !identity(value.turn) ||
    !Array.isArray(value.callIds) ||
    !value.callIds.every(identity) ||
    !Array.isArray(value.pending) ||
    !Array.isArray(value.outputs)
  ) {
    return false
  }

  const calls = new Set(value.callIds)
  const claimed = new Set<string>()

  const claim = (id: unknown) => {
    if (!identity(id) || !calls.has(id) || claimed.has(id)) {
      return false
    }

    claimed.add(id)

    return true
  }

  return (
    calls.size === value.callIds.length &&
    value.pending.every(
      (call: unknown) =>
        record(call) &&
        claim(call.callId) &&
        identity(call.namespace) &&
        identity(call.name) &&
        typeof call.arguments === 'string'
    ) &&
    (value.executing === undefined ||
      (identity(value.executing) &&
        value.executing === value.pending[0]?.callId)) &&
    value.outputs.every(
      (entry: unknown) =>
        record(entry) &&
        entry.type === 'function_call_output' &&
        claim(entry.call_id) &&
        Array.isArray(entry.output) &&
        entry.output.every(
          (part: unknown) =>
            record(part) &&
            ((part.type === 'input_text' && typeof part.text === 'string') ||
              (part.type === 'input_image' && identity(part.image_url)))
        )
    )
  )
}

// Measure only definitions actually returned by server-side tool search.
const returnedToolSearches = (response: Record<string, unknown>) => {
  if (!Array.isArray(response.output) || !identity(response.id)) {
    return undefined
  }

  const searches = response.output.flatMap((item: unknown) => {
    if (
      !record(item) ||
      item.type !== 'tool_search_output' ||
      !Array.isArray(item.tools)
    ) {
      return []
    }

    const definitions: { name: string; namespace?: string; bytes: number }[] =
      []

    const measure = (tool: unknown, namespace?: string) => {
      if (record(tool) && identity(tool.name)) {
        definitions.push({
          name: tool.name,
          namespace,
          bytes: Buffer.byteLength(JSON.stringify(tool))
        })
      }
    }

    for (const tool of item.tools) {
      if (
        record(tool) &&
        tool.type === 'namespace' &&
        identity(tool.name) &&
        Array.isArray(tool.tools)
      ) {
        for (const child of tool.tools) {
          measure(child, tool.name)
        }
      } else {
        measure(
          tool,
          record(tool) && identity(tool.namespace) ? tool.namespace : undefined
        )
      }
    }

    return [
      {
        itemId: identity(item.id) ? item.id : undefined,
        bytes: definitions.reduce((sum, entry) => sum + entry.bytes, 0),
        definitions
      }
    ]
  })

  return searches.length ? { responseId: response.id, searches } : undefined
}

/** Optional HTTP transport. The injected owner, not this adapter, validates and executes tools. */
export const createResponsesAiProvider = (options: {
  readonly apiKey: string
  readonly model: string
  readonly fetch?: typeof fetch
  readonly conversations?: ResponsesConversations
  readonly prepare: PrepareToolProvider
}): AiProvider => {
  if (!options.apiKey.trim() || !options.model.trim()) {
    throw new AiProviderError({
      code: 'AI_PROVIDER_INVALID_CONFIGURATION',
      message: 'Responses requires an API key and model.'
    })
  }

  const conversations = options.conversations ?? createResponsesConversations()
  const fetcher = options.fetch ?? globalThis.fetch
  const active = new Set<AbortController>()
  const running = new Set<Promise<AiActionBatch>>()
  let disposed = false

  const run = async (input: AiProviderInput, context: RequestOptions) => {
    if (disposed) {
      throw new AiProviderError({
        code: 'AI_PROVIDER_DISPOSED',
        message: 'Responses provider is disposed.'
      })
    }

    const controller = new AbortController()

    const abort = () => controller.abort(context.signal.reason)

    context.signal.addEventListener('abort', abort, { once: true })
    if (context.signal.aborted) {
      abort()
    }

    active.add(controller)
    let binding: ToolProviderBinding | undefined
    let lease: ReturnType<ResponsesConversations['acquire']> | undefined
    let unresolved = false
    const total: TokenUsage = {
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      reasoningOutputTokens: 0,
      totalTokens: 0
    }

    const observe = (event: ToolProviderObservation) => {
      try {
        binding?.observe?.(
          event.direction === 'response' && record(event.value)
            ? { ...event, discovery: returnedToolSearches(event.value) }
            : event
        )
      } catch {
        /* Diagnostic failure cannot interrupt execution. */
      }
    }

    try {
      controller.signal.throwIfAborted()
      binding = await options.prepare(input, {
        ...context,
        signal: controller.signal
      })
      controller.signal.throwIfAborted()
      const tools = binding.tools.map((group) => ({
        type: 'namespace',
        name: group.name,
        description: group.description,
        tools: group.tools.map((tool) => ({
          type: 'function',
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
          strict: false,
          ...(tool.deferLoading ? { defer_loading: true } : {})
        }))
      }))
      const names = new Set<string>()

      for (const group of binding.tools) {
        for (const tool of group.tools) {
          const name = `${group.name}.${tool.name}`

          if (names.has(name)) {
            throw new AiProviderError({
              code: 'AI_PROVIDER_INVALID_CONFIGURATION',
              message: 'Duplicate provider tool identity.'
            })
          }

          names.add(name)
        }
      }

      const key =
        record(input.metadata) &&
        typeof input.metadata.conversationId === 'string'
          ? input.metadata.conversationId
          : undefined

      if (key !== undefined) {
        try {
          lease = conversations.acquire(key, {
            provider: 'openai-responses',
            model: options.model,
            credential: createHash('sha256')
              .update(options.apiKey)
              .digest('hex'),
            tools,
            instructions: binding.instructions,
            webSearch: binding.webSearch === true
          })
        } catch {
          throw new AiProviderError({
            code: 'AI_PROVIDER_SESSION_UNAVAILABLE',
            message:
              'Provider conversation is unavailable or its contract changed; start a new conversation.'
          })
        }
      }

      let checkpoint = lease?.state

      if (checkpoint?.executing) {
        throw new AiProviderError({
          code: 'AI_PROVIDER_SESSION_UNAVAILABLE',
          message:
            'Tool settlement is unknown; inspect the committed operation before continuing.'
        })
      }

      const turn =
        record(input.metadata) && identity(input.metadata.turnId)
          ? input.metadata.turnId
          : createHash('sha256').update(JSON.stringify(input)).digest('hex')

      if (checkpoint?.pending.length && checkpoint.turn !== turn) {
        throw new AiProviderError({
          code: 'AI_PROVIDER_SESSION_UNAVAILABLE',
          message: 'Resume the original turn to execute its outstanding tools.'
        })
      }

      const calls = new Set(checkpoint?.callIds)
      const recovering =
        checkpoint?.turn === turn &&
        (checkpoint.pending.length || checkpoint.outputs.length)
      let newInput: unknown[] = []

      if (!recovering) {
        newInput.push({
          role: 'user',
          content: binding
            .input(!!checkpoint)
            .map((item) =>
              item.type === 'inputText'
                ? { type: 'input_text', text: item.text }
                : { type: 'input_image', image_url: item.imageUrl }
            )
        })
      }

      if (!checkpoint && binding.instructions) {
        newInput.unshift({
          role: 'developer',
          content: [{ type: 'input_text', text: binding.instructions }]
        })
      }

      while (true) {
        controller.signal.throwIfAborted()
        while (checkpoint && checkpoint.pending.length) {
          const call: ResponsesCall = checkpoint.pending[0]

          unresolved = true
          lease?.checkpoint({ ...checkpoint, executing: call.callId })
          let args: unknown
          let problem: { code: string; message: string } | undefined

          try {
            args = JSON.parse(call.arguments)
          } catch {
            problem = {
              code: 'TOOL_ARGUMENTS_INVALID',
              message:
                'Arguments must be valid JSON. Correct the input and retry; no tool was executed.'
            }
          }

          if (!names.has(`${call.namespace}.${call.name}`)) {
            problem = {
              code: 'TOOL_NOT_FOUND',
              message: 'Use a declared tool identity; no tool was executed.'
            }
          }

          const reply = problem
            ? {
                contentItems: [
                  {
                    type: 'inputText' as const,
                    text: JSON.stringify({
                      ...problem,
                      toolOutcome: {
                        status: 'failed',
                        settlement: 'not-started'
                      }
                    })
                  }
                ]
              }
            : await binding.invoke({ ...call, arguments: args })

          const output = reply.contentItems.map((item) =>
            item.type === 'inputText'
              ? { type: 'input_text' as const, text: item.text }
              : { type: 'input_image' as const, image_url: item.imageUrl }
          )

          checkpoint = {
            ...checkpoint,
            pending: checkpoint.pending.slice(1),
            outputs: [
              ...checkpoint.outputs,
              { type: 'function_call_output', call_id: call.callId, output }
            ]
          }
          lease?.checkpoint(checkpoint)
          unresolved = false
          controller.signal.throwIfAborted()
        }

        const body = {
          model: options.model,
          store: true,
          ...(checkpoint && { previous_response_id: checkpoint.responseId }),
          ...(binding.requestInstructions && {
            instructions: binding.requestInstructions
          }),
          input: [...(checkpoint?.outputs ?? []), ...newInput],
          tools: [
            ...tools,
            ...(binding.tools.some((group) =>
              group.tools.some((tool) => tool.deferLoading)
            )
              ? [{ type: 'tool_search' }]
              : []),
            ...(binding.webSearch ? [{ type: 'web_search' }] : [])
          ]
        }

        observe({ direction: 'request', value: body })
        let response: Response

        try {
          response = await fetcher('https://api.openai.com/v1/responses', {
            method: 'POST',
            redirect: 'error',
            signal: controller.signal,
            headers: {
              authorization: `Bearer ${options.apiKey}`,
              'content-type': 'application/json'
            },
            body: JSON.stringify(body)
          })
        } catch {
          controller.signal.throwIfAborted()
          throw new AiProviderError({
            code: 'AI_PROVIDER_TRANSPORT_FAILED',
            message:
              'Responses transport failed; completed operations must not be replayed.'
          })
        }

        if (!response.ok) {
          if (
            checkpoint &&
            (response.status === 400 || response.status === 404)
          ) {
            const failure: unknown = await response
              .json()
              .catch(() => undefined)

            if (
              record(failure) &&
              record(failure.error) &&
              (failure.error.code === 'previous_response_not_found' ||
                failure.error.param === 'previous_response_id')
            ) {
              throw new AiProviderError({
                code: 'AI_PROVIDER_SESSION_UNAVAILABLE',
                message:
                  'Stored response is unavailable. Inspect the last operation before starting again.'
              })
            }
          } else {
            await response.body?.cancel()
          }

          throw new AiProviderError({
            code: 'AI_PROVIDER_HTTP_STATUS',
            status: response.status,
            message: 'Responses returned an unsuccessful HTTP status.'
          })
        }

        let value: unknown

        try {
          value = await response.json()
        } catch {
          invalid('Responses returned invalid JSON.')
        }

        controller.signal.throwIfAborted()
        if (
          !record(value) ||
          !identity(value.id) ||
          value.status !== 'completed' ||
          !Array.isArray(value.output)
        ) {
          invalid('Responses did not return a complete response.')
        }

        let usage: ToolProviderObservation['usage']

        if (record(value.usage)) {
          const raw = value.usage
          const inputDetails = record(raw.input_tokens_details)
            ? raw.input_tokens_details
            : {}
          const outputDetails = record(raw.output_tokens_details)
            ? raw.output_tokens_details
            : {}
          const inputTokens = raw.input_tokens,
            outputTokens = raw.output_tokens,
            totalTokens = raw.total_tokens
          const cachedInputTokens = inputDetails.cached_tokens ?? 0,
            reasoningOutputTokens = outputDetails.reasoning_tokens ?? 0

          const valid = (token: unknown): token is number =>
            typeof token === 'number' &&
            Number.isSafeInteger(token) &&
            token >= 0

          if (
            valid(inputTokens) &&
            valid(outputTokens) &&
            valid(totalTokens) &&
            valid(cachedInputTokens) &&
            valid(reasoningOutputTokens) &&
            inputTokens + outputTokens === totalTokens &&
            cachedInputTokens <= inputTokens &&
            reasoningOutputTokens <= outputTokens
          ) {
            total.inputTokens += inputTokens
            total.outputTokens += outputTokens
            total.totalTokens += totalTokens
            total.cachedInputTokens += cachedInputTokens
            total.reasoningOutputTokens += reasoningOutputTokens
            const written = inputDetails.cache_write_tokens
            const writes = inputDetails.cache_write_tokens_details
            const validWrites =
              valid(written) && written <= inputTokens - cachedInputTokens
            const short = record(writes) ? writes.ttl_30m_tokens : undefined
            const long = record(writes) ? writes.ttl_12h_tokens : undefined
            const byLifetime =
              valid(short) && valid(long) && short + long === written

            usage = {
              total: { ...total },
              response: {
                id: value.id,
                inputTokens,
                outputTokens,
                totalTokens,
                cachedInputTokens,
                reasoningOutputTokens,
                ...(validWrites ? { cacheWriteTokens: written } : {}),
                ...(validWrites && byLifetime
                  ? { cacheWrite30mTokens: short, cacheWrite12hTokens: long }
                  : {})
              }
            }
          }
        }

        observe({ direction: 'response', value, ...(usage ? { usage } : {}) })
        const output = value.output
        const pending: ResponsesCall[] = []
        const text: string[] = []

        for (const item of output) {
          if (!record(item)) {
            invalid('Responses output item is invalid.')
          }

          if (item.type === 'function_call') {
            if (
              !identity(item.namespace) ||
              !identity(item.name) ||
              !identity(item.call_id) ||
              typeof item.arguments !== 'string' ||
              calls.has(item.call_id)
            ) {
              invalid(
                'Responses function call identity or arguments are invalid.'
              )
            }

            calls.add(item.call_id)
            pending.push({
              namespace: item.namespace,
              name: item.name,
              callId: item.call_id,
              arguments: item.arguments
            })
          } else if (item.type === 'message') {
            if (item.role !== 'assistant' || !Array.isArray(item.content)) {
              invalid('Responses assistant message is invalid.')
            }

            for (const part of item.content) {
              if (
                !record(part) ||
                part.type !== 'output_text' ||
                typeof part.text !== 'string'
              ) {
                invalid('Responses did not provide an accepted text answer.')
              }

              if (item.phase !== 'commentary') {
                text.push(part.text)
              }
            }
          } else if (
            ![
              'reasoning',
              'tool_search_call',
              'tool_search_output',
              'web_search_call'
            ].includes(String(item.type))
          ) {
            invalid('Responses returned an unsupported output item.')
          } else if (
            item.type === 'tool_search_call' &&
            item.execution !== 'server'
          ) {
            invalid('Responses requested an unsupported client-side search.')
          }
        }

        checkpoint = {
          responseId: value.id,
          turn,
          callIds: [...calls],
          pending,
          outputs: []
        }
        newInput = []
        if (!pending.length) {
          if (!text.length) {
            invalid('Responses completed without a final answer.')
          }

          lease?.checkpoint(checkpoint)
          const result = await binding.decode({
            id: value.id,
            text: text.join('')
          })

          controller.signal.throwIfAborted()

          return result
        }

        lease?.checkpoint(checkpoint)
      }
    } catch (error) {
      if (unresolved) {
        lease?.invalidate()
      }

      if (controller.signal.aborted) {
        throw new AiProviderError({
          code: 'AI_PROVIDER_ABORTED',
          message: 'Responses request was aborted.'
        })
      }

      throw error
    } finally {
      context.signal.removeEventListener('abort', abort)
      active.delete(controller)
      try {
        await binding?.dispose?.()
      } catch {
        // Cleanup is diagnostic and cannot replace an acknowledged result.
        try {
          context.onProgress?.({
            tool: 'provider-cleanup',
            status: 'completed',
            message: 'Provider cleanup failed after settlement.',
            activity: {
              kind: 'system',
              callId: 'provider-cleanup',
              sequence: 1,
              outcome: { status: 'failed', settlement: 'not-started' }
            }
          })
        } catch {
          /* Progress is observational. */
        }
      } finally {
        lease?.release()
      }
    }
  }

  return {
    requestActionBatch(input, context) {
      const task = run(input, context)

      running.add(task)
      void task
        .finally(() => running.delete(task))
        .catch(() => {
          /* The caller owns rejection. */
        })

      return task
    },

    async dispose() {
      disposed = true
      for (const controller of active) {
        controller.abort()
      }

      await Promise.allSettled(running)
      if (!options.conversations) {
        conversations.dispose()
      }
    }
  }
}

import { resolveNativeTestExecutable } from '../../scripts/native-client-admission.mjs'
import { createServer } from 'node:http'
import { mkdir, mkdtemp, writeFile, readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { isRecord } from '@asyra/utils'

const root = resolve(import.meta.dirname, '../../../..')

export const nativeProviderExecutable = resolveNativeTestExecutable()

export const createNativeProviderFixture = async (
  steps: (
    | Record<string, unknown>
    | ((
        request: Record<string, unknown>
      ) => Record<string, unknown> | undefined)
  )[],
  fault?:
    | 'omit-outcome'
    | 'alter-data'
    | 'omit-image'
    | 'omit-instructions'
    | 'alter-tool-schema'
    | 'swap-attachment-association',
  unfinished?: 'progressive' | 'silent' | 'interrupted',
  usage: { inputTokens?: readonly number[] } = {}
) => {
  if (!nativeProviderExecutable) {
    throw Error('Native test executable is not configured')
  }

  await mkdir(join(root, 'tmp'), { recursive: true })
  const directory = await mkdtemp(join(root, 'tmp/conversation-native-'))
  const protocol = join(directory, 'app-protocol.jsonl')

  await writeFile(join(directory, 'native-processes.jsonl'), '')
  const requests: Record<string, unknown>[] = []
  const errors: unknown[] = []
  let announcePause: (() => void) | undefined
  let resumeOutput: (() => void) | undefined
  const paused = new Promise<void>((resolve) => {
    announcePause = resolve
  })
  const released = new Promise<void>((resolve) => {
    resumeOutput = resolve
  })
  let emittedArgumentBytes = 0
  const server = createServer(async (request, response) => {
    try {
      if (request.method !== 'POST' || request.url !== '/v1/responses') {
        throw Error('Unexpected offline model route: ' + request.url)
      }

      const chunks = []

      for await (const chunk of request) {
        chunks.push(chunk)
      }

      const bytes = Buffer.concat(chunks).toString('utf8')
      const body: unknown = JSON.parse(bytes)

      if (!isRecord(body)) {
        throw Error('Malformed native model request')
      }

      requests.push(body)
      await writeFile(join(directory, `request-${requests.length}.json`), bytes)
      const step = steps[requests.length - 1]
      const item = (typeof step === 'function' ? step(body) : step) ?? {
        type: 'message',
        id: 'offline-final',
        role: 'assistant',
        status: 'completed',
        content: [
          {
            type: 'output_text',
            text: JSON.stringify({
              batchId: 'offline-complete',
              actions: [
                {
                  id: 'report',
                  name: 'report_outcome',
                  arguments: {
                    outcome: 'unsupported',
                    message: 'Offline read completed.'
                  },
                  summary: 'Read completed'
                }
              ]
            }),
            annotations: []
          }
        ]
      }

      response.writeHead(200, { 'content-type': 'text/event-stream' })

      const event = (type: string, values: Record<string, unknown>) =>
        response.write(
          `event: ${type}\ndata: ${JSON.stringify({ type, ...values })}\n\n`
        )

      const value = {
        id: `response-${requests.length}`,
        object: 'response',
        status: 'in_progress',
        output: []
      }

      event('response.created', { response: value })
      if (
        unfinished &&
        requests.length === 1 &&
        item.type === 'function_call'
      ) {
        event('response.output_item.added', {
          output_index: 0,
          item: { ...item, arguments: '' }
        })
        if (unfinished !== 'silent') {
          const delta = ' '.repeat(64000)

          emittedArgumentBytes = Buffer.byteLength(delta)
          event('response.function_call_arguments.delta', {
            output_index: 0,
            item_id: item.id,
            delta
          })
        }

        announcePause?.()
        await released
        if (unfinished === 'interrupted') {
          response.destroy()

          return
        }

        event('response.function_call_arguments.delta', {
          output_index: 0,
          item_id: item.id,
          delta: item.arguments
        })
        event('response.function_call_arguments.done', {
          output_index: 0,
          item_id: item.id,
          arguments: item.arguments
        })
      } else {
        event('response.output_item.added', { output_index: 0, item })
      }

      event('response.output_item.done', { output_index: 0, item })
      event('response.completed', {
        response: {
          ...value,
          status: 'completed',
          output: [item],
          usage: {
            input_tokens: usage.inputTokens?.[requests.length - 1] ?? 1,
            output_tokens: 1,
            total_tokens: (usage.inputTokens?.[requests.length - 1] ?? 1) + 1
          }
        }
      })
      response.end()
    } catch (error) {
      errors.push(error)
      response.destroy()
    }
  })

  await new Promise<void>((accept) => server.listen(0, '127.0.0.1', accept))
  const address = server.address()

  if (!address || typeof address === 'string') {
    throw Error('Missing offline model listener')
  }

  const config = join(directory, 'proxy.json')

  await writeFile(
    config,
    JSON.stringify({
      executable: nativeProviderExecutable,
      directory,
      protocol,
      processes: join(directory, 'native-processes.jsonl'),
      fault,
      nativeProtocol: join(directory, 'native-protocol.jsonl'),
      endpoint: `http://127.0.0.1:${address.port}/v1`
    })
  )
  const launcher = join(directory, 'native-provider')
  const proxy = join(
    root,
    'apps/asyra-design/test-data/knowledge-evaluation/native-provider-proxy.mjs'
  )

  const quote = (text: string) => "'" + text.replaceAll("'", "'\\''") + "'"

  await writeFile(
    launcher,
    `#!/bin/sh\nexec ${quote(process.execPath)} ${quote(proxy)} ${quote(config)} "$@"\n`,
    { mode: 0o700 }
  )

  const packets = () =>
    readFileSync(protocol, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const packet: unknown = JSON.parse(line)

        if (!isRecord(packet)) {
          throw Error('Malformed recorded App packet')
        }

        return packet
      })

  const nativePackets = () =>
    readFileSync(join(directory, 'native-protocol.jsonl'), 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const packet: unknown = JSON.parse(line)

        if (!isRecord(packet)) {
          throw Error('Malformed recorded native packet')
        }

        return packet
      })

  return {
    directory,
    requests,

    waitForUnfinished: () => paused,

    releaseUnfinished: () => resumeOutput?.(),

    emittedArgumentBytes: () => emittedArgumentBytes,

    appPackets: packets,
    nativePackets,
    environment: {
      AI_PROVIDER_BACKEND: 'local-codex',
      AI_PROVIDER_MODEL: 'gpt-6-astra',
      AI_PROVIDER_EXECUTABLE: launcher,
      AI_EXECUTION_RECORD_DIR: directory,
      AI_TOOL_LIBRARY_DIR: join(directory, 'library')
    },

    toolCalls: () =>
      packets().filter(
        (packet) =>
          isRecord(packet.result) && Array.isArray(packet.result.contentItems)
      ),

    toolReply: (callId: string) => {
      const calls = nativePackets().filter(
        (packet) =>
          packet.method === 'item/tool/call' &&
          isRecord(packet.params) &&
          packet.params.callId === callId
      )

      if (calls.length !== 1) {
        throw Error('Expected exactly one native invocation for ' + callId)
      }

      const replies = packets().filter(
        (packet) =>
          packet.id === calls[0].id &&
          isRecord(packet.result) &&
          Array.isArray(packet.result.contentItems)
      )

      if (replies.length !== 1) {
        throw Error('Expected exactly one App tool reply for ' + callId)
      }

      const reply = replies[0].result

      if (!isRecord(reply) || !Array.isArray(reply.contentItems)) {
        throw Error('Missing production reply')
      }

      const contentItems = reply.contentItems.map((item) => {
        if (!isRecord(item) || typeof item.type !== 'string') {
          throw Error('Malformed native content block')
        }

        if (item.type === 'inputText' && typeof item.text === 'string') {
          return { ...item, type: item.type, text: item.text }
        }

        if (item.type === 'inputImage' && typeof item.imageUrl === 'string') {
          return { ...item, type: item.type, imageUrl: item.imageUrl }
        }

        throw Error('Unsupported or incomplete native content block')
      })

      return { success: reply.success, contentItems }
    },

    successorContent: (callId: string) =>
      nativeSuccessorContent(requests, callId),

    successorOutput: (callId: string) => {
      for (const request of requests) {
        if (!Array.isArray(request.input)) {
          continue
        }

        for (const item of request.input) {
          if (
            !isRecord(item) ||
            item.type !== 'function_call_output' ||
            item.call_id !== callId
          ) {
            continue
          }

          if (typeof item.output === 'string') {
            return item.output
          }

          if (Array.isArray(item.output)) {
            return item.output
              .filter(isRecord)
              .map((block) => block.text ?? '')
              .join('\n')
          }
        }
      }

      throw Error('Missing native successor output: ' + callId)
    },

    dispose: async () => {
      resumeOutput?.()
      server.closeAllConnections()
      await new Promise<void>((accept, reject) =>
        server.close((error) => (error ? reject(error) : accept()))
      )
      // Retain exact App protocol and wire bodies as project-local evidence.
      const lifecycles: unknown[] = (
        await readFile(join(directory, 'native-processes.jsonl'), 'utf8')
      )
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
      const opened = lifecycles
        .filter(isRecord)
        .filter((item) => item.status === 'started')

      // Production kills its executable, which is this fixture's proxy. The real
      // native child receives pipe EOF asynchronously; observe actual OS exit,
      // not a proxy finally/close event that SIGKILL cannot emit.
      for (const child of opened) {
        const pid = child.pid

        if (typeof pid !== 'number' || !Number.isSafeInteger(pid) || pid <= 0) {
          throw Error('Invalid native process identity')
        }

        const deadline = Date.now() + 5000

        for (;;) {
          try {
            process.kill(pid, 0)
          } catch (error) {
            if (
              error instanceof Error &&
              'code' in error &&
              error.code === 'ESRCH'
            ) {
              break
            }

            throw error
          }

          if (Date.now() >= deadline) {
            throw Error('Native fixture child remains alive: ' + pid)
          }

          await new Promise((resolve) => setTimeout(resolve, 25))
        }
      }

      await writeFile(
        join(directory, 'native-cleanup.json'),
        JSON.stringify({
          observedPids: opened.map((child) => child.pid),
          allExited: true
        })
      )
      if (errors.length) {
        throw errors[0]
      }
    }
  }
}

export function nativeSuccessorContent(
  requests: Record<string, unknown>[],
  callId: string
) {
  for (const request of requests) {
    if (!Array.isArray(request.input)) {
      continue
    }

    for (const item of request.input) {
      if (
        isRecord(item) &&
        item.type === 'function_call_output' &&
        item.call_id === callId
      ) {
        return item.output
      }
    }
  }

  throw Error('Missing native successor content: ' + callId)
}

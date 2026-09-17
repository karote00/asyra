import { homedir } from 'node:os'
import { join } from 'node:path'
import { EventEmitter } from 'node:events'
import { PassThrough, Writable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkLocalAiProvider } from '../local-ai-provider'
import { requestConfiguredAiActionBatch } from '../ai-model-provider'

const { spawn } = vi.hoisted(() => ({ spawn: vi.fn() }))
vi.mock('node:child_process', () => ({ spawn }))
vi.mock('../../vtracer-tool-server.mjs', () => ({
  convertVTracerBuffer: vi.fn(
    async () =>
      '<svg width="1" height="1"><path d="M0,0L1,0L1,1Z" fill="#000000"/></svg>'
  )
}))

const input = {
  actions: [
    {
      name: 'create_rectangle',
      description: 'Create a rectangle',
      inputSchema: {}
    }
  ],
  attempt: 1,
  context: {},
  intent: 'Create a rectangle'
}
const batch = {
  batchId: 'batch-1',
  actions: [
    {
      id: 'action-1',
      name: 'create_rectangle',
      arguments: { x: 1 },
      summary: 'Create rectangle'
    }
  ]
}
const environment = {
  AI_PROVIDER_BACKEND: 'local-codex',
  AI_PROVIDER_MODEL: 'selected-model'
}

interface Packet {
  id?: number
  method: string
  params: Record<string, unknown>
}
const fakeServer = (
  options: {
    instructionSources?: unknown
    account?: unknown
    output?: string
    status?: string
    hold?: boolean
    onRequest?: (packet: Packet) => void
    delayedClose?: boolean
    toolCall?: boolean
    toolResultOutput?: (summary: { imageArtifactId: string }) => string
  } = {}
) => {
  const child = new EventEmitter() as EventEmitter & {
    stdin: Writable
    stdout: PassThrough
    stderr: PassThrough
    kill: ReturnType<typeof vi.fn>
  }
  const packets: Packet[] = []
  const send = (packet: unknown) =>
    child.stdout.write(JSON.stringify(packet) + '\n')
  const notify = (method: string, params: Record<string, unknown>) =>
    send({
      method,
      params: { threadId: 'thread-1', turnId: 'turn-1', ...params }
    })
  const finish = () => {
    notify('item/completed', {
      item: {
        type: 'agentMessage',
        phase: 'commentary',
        text: 'This must not reach the product.'
      }
    })
    notify('item/completed', {
      item: {
        type: 'agentMessage',
        phase: 'final_answer',
        text: options.output ?? JSON.stringify(batch)
      }
    })
    notify('turn/completed', {
      turn: { id: 'turn-1', status: options.status ?? 'completed' }
    })
  }
  child.stdout = new PassThrough()
  child.stderr = new PassThrough()
  child.kill = vi.fn(() => {
    if (!options.delayedClose)
      queueMicrotask(() => child.emit('close', null, 'SIGKILL'))
    return true
  })
  child.stdin = new Writable({
    write(chunk, _encoding, done) {
      const packet = JSON.parse(String(chunk)) as Packet
      packets.push(packet)
      queueMicrotask(() => {
        if ('result' in packet) {
          if (options.toolResultOutput) {
            const response = packet.result as {
              contentItems: { text: string }[]
            }
            options.output = options.toolResultOutput(
              JSON.parse(response.contentItems[0].text)
            )
          }
          notify('item/completed', {
            item: {
              type: 'dynamicToolCall',
              id: 'call-1',
              tool: 'vtracer',
              status: 'completed',
              success: true
            }
          })
          finish()
          return
        }
        if (packet.id === undefined) return
        options.onRequest?.(packet)
        let result: unknown = {}
        if (packet.method === 'account/read')
          result = {
            account:
              options.account === undefined
                ? { type: 'chatgpt', email: 'private@example.test' }
                : options.account
          }
        if (packet.method === 'thread/start')
          result = {
            thread: { id: 'thread-1' },
            model: 'selected-model',
            instructionSources: options.instructionSources ?? [],
            runtimeWorkspaceRoots: []
          }
        if (packet.method === 'turn/start') result = { turn: { id: 'turn-1' } }
        send({ id: packet.id, result })
        if (packet.method === 'turn/start' && !options.hold) {
          if (options.toolCall)
            send({
              id: 99,
              method: 'item/tool/call',
              params: {
                threadId: 'thread-1',
                turnId: 'turn-1',
                callId: 'call-1',
                tool: 'vtracer',
                arguments: { attachmentIndex: 0 }
              }
            })
          else finish()
        }
      })
      done()
    }
  })
  spawn.mockReturnValueOnce(child)
  return { child, packets, send, notify, finish }
}
const untilTurn = async (packets: Packet[]) => {
  await vi.waitFor(() =>
    expect(packets.some(({ method }) => method === 'turn/start')).toBe(true)
  )
}

afterEach(() => {
  vi.useRealTimers()
  vi.resetAllMocks()
})

describe('local subscription AI backend', () => {
  it('resolves a compact tool reference before the prepared batch reaches the caller', async () => {
    const server = fakeServer({
      toolCall: true,
      toolResultOutput: (summary) =>
        JSON.stringify({
          batchId: 'prepared',
          actions: [
            {
              id: 'draw',
              name: 'insert_vector_composition',
              summary: 'Reference',
              arguments: {
                imageArtifactId: summary.imageArtifactId,
                bounds: { x: 0, y: 0, width: 240, height: 240 },
                compositionRole: 'Reference',
                excludePathIds: []
              }
            }
          ]
        })
    })
    const result = await requestConfiguredAiActionBatch(
      {
        ...input,
        actions: [
          {
            name: 'insert_vector_composition',
            description: 'Draw',
            inputSchema: {}
          }
        ],
        metadata: {
          imageAttachments: [
            {
              dataUrl: 'data:image/png;base64,YQ==',
              mediaType: 'image/png',
              size: 1
            }
          ]
        }
      },
      { environment }
    )
    expect(result.actions[0].arguments).toMatchObject({
      artifactVersion: 1,
      elementCount: 1,
      pointCount: 3,
      groupBounds: { x: 0, y: 0, width: 240, height: 240 }
    })
    expect(JSON.stringify(result)).not.toContain('imageArtifactId')
    expect(server.child.kill).toHaveBeenCalledOnce()
  })
  it('executes the registered VTracer tool and resumes the same model turn', async () => {
    const server = fakeServer({ toolCall: true })
    const result = await requestConfiguredAiActionBatch(
      {
        ...input,
        metadata: {
          imageAttachments: [
            {
              dataUrl: 'data:image/png;base64,YQ==',
              mediaType: 'image/png',
              size: 1
            }
          ]
        }
      },
      { environment }
    )
    expect(result).toEqual(batch)
    expect(
      server.packets.some((packet) => packet.id === 99 && 'result' in packet)
    ).toBe(true)
  })

  it('checks login and protocol without starting a model turn', async () => {
    const server = fakeServer()
    await expect(
      checkLocalAiProvider({ model: 'selected-model', executable: 'codex' })
    ).resolves.toBeUndefined()
    expect(server.packets.some(({ method }) => method === 'turn/start')).toBe(
      false
    )
    expect(server.child.kill).toHaveBeenCalledOnce()
  })

  it.each(['AGENTS.md', 'AGENTS.override.md'])(
    'accepts personal %s without returning its path or identity',
    async (file) => {
      const source = join(
        process.env.CODEX_HOME || join(homedir(), '.codex'),
        file
      )
      fakeServer({ instructionSources: [source] })
      await expect(
        requestConfiguredAiActionBatch(input, { environment })
      ).resolves.toEqual(batch)
    }
  )

  it('rejects project instructions even when their filename is AGENTS.md', async () => {
    fakeServer({ instructionSources: [join(process.cwd(), 'AGENTS.md')] })
    await expect(
      requestConfiguredAiActionBatch(input, { environment })
    ).rejects.toMatchObject({ code: 'AI_MODEL_BACKEND_INVALID_CONFIGURATION' })
  })

  it('uses one tool-free ephemeral process, exact model, and no HTTP/API key or account output', async () => {
    const server = fakeServer()
    const fetch = vi.fn()
    const result = await requestConfiguredAiActionBatch(input, {
      environment,
      fetch
    })
    expect(result).toEqual(batch)
    expect(fetch).not.toHaveBeenCalled()
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn.mock.calls[0][0]).toBe('codex')
    expect(spawn.mock.calls[0][2]).toMatchObject({
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    const thread = server.packets.find(
      ({ method }) => method === 'thread/start'
    )?.params
    expect(thread).toMatchObject({
      model: 'selected-model',
      ephemeral: true,
      approvalPolicy: 'never',
      sandbox: 'read-only',
      environments: [],
      dynamicTools: [],
      selectedCapabilityRoots: [],
      runtimeWorkspaceRoots: [],
      allowProviderModelFallback: false
    })
    expect(thread?.config).toMatchObject({
      'features.shell_tool': false,
      'features.unified_exec': false,
      'features.plugins': false,
      'features.apps': false,
      web_search: 'disabled',
      mcp_servers: {}
    })
    expect(JSON.stringify(server.packets)).not.toContain('private@example.test')
    expect(JSON.stringify(result)).not.toContain('private@example.test')
    expect(server.child.kill).toHaveBeenCalledExactlyOnceWith('SIGKILL')
  })

  it('passes an explicitly configured executable as a literal without a shell', async () => {
    fakeServer()
    await requestConfiguredAiActionBatch(input, {
      environment: {
        ...environment,
        AI_PROVIDER_EXECUTABLE: '/path with spaces/codex'
      }
    })
    expect(spawn.mock.calls[0][0]).toBe('/path with spaces/codex')
  })

  it.each([
    {},
    { AI_PROVIDER_MODEL: 'selected-model', AI_PROVIDER_BACKEND: 'unknown' }
  ])(
    'rejects incomplete or unknown configuration without a process',
    async (settings) => {
      await expect(
        requestConfiguredAiActionBatch(input, {
          environment: { AI_PROVIDER_BACKEND: 'local-codex', ...settings }
        })
      ).rejects.toMatchObject({
        code: 'AI_MODEL_BACKEND_INVALID_CONFIGURATION'
      })
      expect(spawn).not.toHaveBeenCalled()
    }
  )

  it.each([null, { type: 'apiKey' }])(
    'rejects absent or API-key authentication before a model turn',
    async (account) => {
      const server = fakeServer({ account })
      await expect(
        requestConfiguredAiActionBatch(input, { environment })
      ).rejects.toMatchObject({
        code: 'AI_MODEL_BACKEND_INVALID_CONFIGURATION'
      })
      expect(server.packets.some(({ method }) => method === 'turn/start')).toBe(
        false
      )
      expect(server.child.kill).toHaveBeenCalledOnce()
    }
  )

  it.each([
    'not json',
    '{"actions":[],"batchId":"empty"}',
    '{"error":"unavailable capability"}'
  ])('rejects malformed or unavailable output', async (output) => {
    fakeServer({ output })
    await expect(
      requestConfiguredAiActionBatch(input, { environment })
    ).rejects.toMatchObject({ code: 'AI_MODEL_BACKEND_INVALID_RESPONSE' })
  })

  it.each(['failed', 'interrupted'])(
    'rejects a non-completed turn even with valid JSON',
    async (status) => {
      fakeServer({ status })
      await expect(
        requestConfiguredAiActionBatch(input, { environment })
      ).rejects.toMatchObject({ code: 'AI_MODEL_BACKEND_TRANSPORT_FAILED' })
    }
  )

  it('does no work for a pre-aborted request', async () => {
    await expect(
      requestConfiguredAiActionBatch(input, {
        environment,
        signal: AbortSignal.abort()
      })
    ).rejects.toMatchObject({ code: 'AI_MODEL_BACKEND_ABORTED' })
    expect(spawn).not.toHaveBeenCalled()
  })

  it('waits for actual process closure on cancellation and rejects late output', async () => {
    const server = fakeServer({ hold: true, delayedClose: true })
    const controller = new AbortController()
    let settled = false
    const promise = requestConfiguredAiActionBatch(input, {
      environment,
      signal: controller.signal
    })
    const checked = expect(promise).rejects.toMatchObject({
      code: 'AI_MODEL_BACKEND_ABORTED'
    })
    void promise.catch(() => {
      settled = true
    })
    await untilTurn(server.packets)
    controller.abort()
    server.finish()
    await Promise.resolve()
    expect(settled).toBe(false)
    expect(server.child.kill).toHaveBeenCalledOnce()
    server.child.emit('close')
    await checked
  })

  it('rejects cancellation during successful process cleanup', async () => {
    const server = fakeServer({ delayedClose: true })
    const controller = new AbortController()
    const promise = requestConfiguredAiActionBatch(input, {
      environment,
      signal: controller.signal
    })
    const checked = expect(promise).rejects.toMatchObject({
      code: 'AI_MODEL_BACKEND_ABORTED'
    })
    await vi.waitFor(() => expect(server.child.kill).toHaveBeenCalledOnce())
    controller.abort()
    server.child.emit('close')
    await checked
  })

  it('redacts a synchronous executable launch failure', async () => {
    spawn.mockImplementationOnce(() => {
      throw new Error('private executable path and token')
    })
    await expect(
      requestConfiguredAiActionBatch(input, { environment })
    ).rejects.toMatchObject({
      code: 'AI_MODEL_BACKEND_INVALID_CONFIGURATION',
      message: 'The local AI provider could not complete the request.'
    })
  })

  it('bounds a stalled provider with a deadline and closes its child', async () => {
    vi.useFakeTimers()
    const server = fakeServer({ hold: true })
    const promise = requestConfiguredAiActionBatch(input, { environment })
    const checked = expect(promise).rejects.toMatchObject({
      code: 'AI_MODEL_BACKEND_TIMEOUT'
    })
    await vi.advanceTimersByTimeAsync(300_001)
    await checked
    expect(server.child.kill).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each(['request', 'tool', 'malformed', 'oversized', 'exit', 'spawn-error'])(
    'fails closed on %s without exposing provider diagnostics',
    async (kind) => {
      const server = fakeServer({ hold: true })
      const promise = requestConfiguredAiActionBatch(input, { environment })
      const checked = expect(promise).rejects.toThrow(/^The local AI provider/)
      await untilTurn(server.packets)
      server.child.stderr.write('private@example.test Bearer sensitive-token')
      if (kind === 'request')
        server.send({
          id: 999,
          method: 'item/tool/call',
          params: { secret: 'sensitive-token' }
        })
      if (kind === 'tool')
        server.notify('item/completed', { item: { type: 'commandExecution' } })
      if (kind === 'malformed') server.child.stdout.write('sensitive-token\n')
      if (kind === 'oversized')
        server.child.stdout.write('x'.repeat(32 * 1024 * 1024 + 1))
      if (kind === 'exit') server.child.emit('close')
      if (kind === 'spawn-error')
        server.child.emit('error', new Error('sensitive-token'))
      await checked
      expect(server.child.kill).toHaveBeenCalledOnce()
    }
  )

  it('isolates overlapping turns and sends native image bytes only once', async () => {
    const first = fakeServer({ hold: true })
    const second = fakeServer()
    const controller = new AbortController()
    const pending = requestConfiguredAiActionBatch(input, {
      environment,
      signal: controller.signal
    })
    const checked = expect(pending).rejects.toMatchObject({
      code: 'AI_MODEL_BACKEND_ABORTED'
    })
    await untilTurn(first.packets)
    const imageInput = {
      ...input,
      metadata: {
        imageAttachments: [
          {
            dataUrl: 'data:image/png;base64,YQ==',
            mediaType: 'image/png',
            size: 1
          }
        ]
      }
    }
    await expect(
      requestConfiguredAiActionBatch(imageInput, { environment })
    ).resolves.toEqual(batch)
    const items = second.packets.find(({ method }) => method === 'turn/start')
      ?.params.input as { type: string; text?: string; url?: string }[]
    expect(items[0].text).not.toContain('YQ==')
    expect(items[1]).toEqual({
      type: 'image',
      url: 'data:image/png;base64,YQ=='
    })
    controller.abort()
    await checked
    expect(spawn).toHaveBeenCalledTimes(2)
    expect(first.child.kill).toHaveBeenCalledOnce()
    expect(second.child.kill).toHaveBeenCalledOnce()
  })
})

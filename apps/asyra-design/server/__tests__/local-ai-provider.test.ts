import { designPreparationExamples } from '../design-preparation-examples'
import type {
  AiProviderInput,
  AiBatchReceipt
} from '../../src/ai/action-batch-protocol'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { EventEmitter } from 'node:events'
import { PassThrough, Writable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLocalAiUsage } from '../local-ai-usage'
import {
  checkLocalAiProvider,
  requestLocalAiAssessment,
  requestLocalAiActionBatch
} from '../local-ai-provider'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import * as designTools from '../local-design-tools'
import { requestConfiguredAiActionBatch } from '../ai-model-provider'
import { convertVTracerBuffer } from '../../vtracer-tool-server.mjs'
import { AiImageToolIds } from '../ai-domain-prompt'

const { spawn, retainedRecords } = vi.hoisted(() => ({
  spawn: vi.fn(),
  retainedRecords: [] as unknown[]
}))
vi.mock('../local-ai-records', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../local-ai-records')>()),
  createExecutionRecordSink: () => ({
    write: (record: unknown) => retainedRecords.push(record),
    flush: async () => ({ status: 'saved', path: null })
  })
}))
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
const nativeToolDefinitions = (thread?: Record<string, unknown>) =>
  (
    thread?.dynamicTools as {
      tools: {
        name: string
        description: string
        inputSchema: unknown
        deferLoading: boolean
      }[]
    }[]
  ).flatMap(({ tools }) => tools ?? [])

const fakeServer = (
  options: {
    instructionSources?: unknown
    reasoningEffort?: string | null
    toolNamespace?: string | null
    account?: unknown
    output?: string
    status?: string
    hold?: boolean
    manualToolReplies?: boolean
    onRequest?: (packet: Packet) => void
    delayedClose?: boolean
    research?: boolean
    toolCall?: boolean
    repeatedImageCalls?: number
    followupTool?: (receipt: Record<string, unknown>) => {
      name: string
      args: unknown
    }
    toolName?: string
    toolArguments?: unknown
    analyzeComponents?: boolean
    parallelAnalyses?: number
    overlapTool?: string
    toolResultOutput?: (summary: {
      imageArtifactId: string
      analysisId?: string
    }) => string
  } = {}
) => {
  const child = new EventEmitter() as EventEmitter & {
    stdin: Writable
    stdout: PassThrough
    stderr: PassThrough
    kill: ReturnType<typeof vi.fn>
  }
  const packets: Packet[] = []
  let analysisReplies = 0
  let imageReplies = 0
  const send = (packet: unknown) => {
    const request = packet as {
      method?: string
      params?: {
        tool?: string
        namespace?: string | null
        item?: { type: string; tool?: string; namespace?: string | null }
      }
    }
    let call = request.method === 'item/tool/call' ? request.params : undefined
    if (request.params?.item?.type === 'dynamicToolCall')
      call = request.params.item
    if (call) {
      const groups = packets.find(({ method }) => method === 'thread/start')
        ?.params.dynamicTools as { name: string; tools?: { name: string }[] }[]
      call.namespace =
        options.toolNamespace === undefined
          ? groups?.find(({ tools }) =>
              tools?.some(({ name }) => name === call.tool)
            )?.name
          : options.toolNamespace
    }
    return child.stdout.write(JSON.stringify(packet) + '\n')
  }
  const notify = (method: string, params: Record<string, unknown>) =>
    send({
      method,
      params: { threadId: 'thread-1', turnId: 'turn-1', ...params }
    })
  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
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
          if (options.manualToolReplies) return
          if (
            options.repeatedImageCalls &&
            ++imageReplies < options.repeatedImageCalls
          ) {
            setImmediate(() =>
              send({
                id: 1000 + imageReplies,
                method: 'item/tool/call',
                params: {
                  threadId: 'thread-1',
                  turnId: 'turn-1',
                  callId: `image-${imageReplies}`,
                  tool: AiImageToolIds.VTRACER,
                  arguments: {
                    attachmentIndex: 0,
                    plan: {
                      strategy: 'preserve-vectors',
                      reason: 'Preserve reference geometry.'
                    }
                  }
                }
              })
            )
            return
          }
          if (options.followupTool && packet.id === 99) {
            const response = packet.result as {
              contentItems: { text: string }[]
            }
            const followup = options.followupTool(
              JSON.parse(response.contentItems[0].text)
            )
            setImmediate(() =>
              send({
                id: 100,
                method: 'item/tool/call',
                params: {
                  threadId: 'thread-1',
                  turnId: 'turn-1',
                  callId: 'followup-1',
                  tool: followup.name,
                  arguments: followup.args
                }
              })
            )
            return
          }
          if (options.analyzeComponents && packet.id === 99) {
            const response = packet.result as {
              contentItems: { text: string }[]
            }
            const summary = JSON.parse(response.contentItems[0].text)
            setImmediate(() => {
              for (
                let index = 0;
                index < (options.parallelAnalyses ?? 1);
                index++
              )
                send({
                  id: 100 + index,
                  method: 'item/tool/call',
                  params: {
                    threadId: 'thread-1',
                    turnId: 'turn-1',
                    callId: `analysis-${index}`,
                    tool: AiImageToolIds.ANALYZE_VECTOR_COMPONENTS,
                    arguments: {
                      imageArtifactId: summary.imageArtifactId,
                      pathIds: [`path-${index + 1}`]
                    }
                  }
                })
              if (options.overlapTool)
                send({
                  id: 500,
                  method: 'item/tool/call',
                  params: {
                    threadId: 'thread-1',
                    turnId: 'turn-1',
                    callId: 'overlap',
                    tool: options.overlapTool,
                    arguments: {
                      attachmentIndex: 0,
                      plan: {
                        strategy: 'preserve-vectors',
                        reason:
                          'Preserve the supplied irregular vector artwork.'
                      }
                    }
                  }
                })
            })
            return
          }
          if (
            options.parallelAnalyses &&
            packet.id !== undefined &&
            packet.id >= 100
          ) {
            analysisReplies++
            if (analysisReplies < options.parallelAnalyses) return
          }
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
              tool: options.toolName ?? 'vtracer',
              status: (packet.result as { success: boolean }).success
                ? 'completed'
                : 'failed',
              success: (packet.result as { success: boolean }).success
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
            reasoningEffort:
              options.reasoningEffort === undefined
                ? 'medium'
                : options.reasoningEffort,
            instructionSources: options.instructionSources ?? [],
            runtimeWorkspaceRoots: []
          }
        if (packet.method === 'turn/start') result = { turn: { id: 'turn-1' } }
        send({ id: packet.id, result })
        if (packet.method === 'turn/start' && !options.hold) {
          if (options.research) {
            notify('item/started', {
              item: {
                id: 'search-1',
                type: 'webSearch',
                status: 'inProgress',
                action: { type: 'search', query: 'private-query-not-for-ui' }
              }
            })
            notify('item/completed', {
              item: {
                id: 'search-1',
                type: 'webSearch',
                status: 'completed',
                action: { type: 'search', query: 'private-query-not-for-ui' }
              }
            })
          }
          if (options.toolCall)
            send({
              id: 99,
              method: 'item/tool/call',
              params: {
                threadId: 'thread-1',
                turnId: 'turn-1',
                callId: 'call-1',
                tool: options.toolName ?? 'vtracer',
                arguments: options.toolArguments ?? {
                  attachmentIndex: 0,
                  plan: {
                    strategy: 'preserve-vectors',
                    reason: 'Preserve the supplied irregular vector artwork.'
                  }
                }
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
  retainedRecords.length = 0
  vi.useRealTimers()
  vi.resetAllMocks()
  vi.restoreAllMocks()
})

describe('local subscription AI backend', () => {
  it.each([{ research: true }, { toolCall: true }])(
    'rejects unexpected tool activity in an assessment: %j',
    async (activity) => {
      const server = fakeServer(activity)
      spawn.mockReturnValue(server.child)
      await expect(
        requestLocalAiAssessment(
          { sourceRequestId: 'drawing-1', criteria: ['Find avoidable work'] },
          { model: 'selected-model', executable: 'codex' }
        )
      ).rejects.toMatchObject({ code: 'AI_MODEL_BACKEND_INVALID_RESPONSE' })
    }
  )
  it('isolates one diagnostic assessment from drawing tools and records its own identity', async () => {
    const result = { overall: 'No visual proof supplied', findings: [] }
    const server = fakeServer({ output: JSON.stringify(result) })
    spawn.mockReturnValue(server.child)
    const assessment = await requestLocalAiAssessment(
      {
        sourceRequestId: 'drawing-1',
        criteria: ['Find avoidable work'],
        calls: []
      },
      {
        model: 'selected-model',
        executable: 'codex'
      }
    )
    expect(assessment.value).toEqual(result)
    const params = server.packets.find(
      ({ method }) => method === 'thread/start'
    )?.params
    expect(params?.dynamicTools).toEqual([])
    expect(params?.config).toMatchObject({
      web_search: 'disabled',
      'features.code_mode': false,
      model_reasoning_effort: 'medium'
    })
    expect(params?.baseInstructions).not.toContain('Canvas changes')
    expect(retainedRecords[0]).toMatchObject({
      requestId: assessment.requestId,
      purpose: 'execution-assessment',
      sourceRequestId: 'drawing-1'
    })
    expect(assessment.requestId).not.toBe('drawing-1')
  })
  it('overlaps independent preparation and API description through owner declarations', async () => {
    let signalEntered!: () => void
    const entered = new Promise<void>((resolve) => {
      signalEntered = resolve
    })
    let resume!: () => void
    const release = new Promise<void>((resolve) => {
      resume = resolve
    })
    const create = designTools.createLocalDesignTools
    let preparations = 0
    vi.spyOn(designTools, 'createLocalDesignTools').mockImplementation(
      (...args) => {
        const owner = create(...args)
        return {
          ...owner,
          call: async (...params) => {
            const result = await owner.call(...params)
            preparations++
            signalEntered()
            await release
            return result
          }
        }
      }
    )
    const server = fakeServer({ hold: true, manualToolReplies: true })
    const executeBatch = vi.fn(async () => ({ actionResults: [], context: {} }))
    const completion = requestConfiguredAiActionBatch(
      {
        ...input,
        actions: [
          {
            name: 'apply_prepared_design',
            description: 'Apply',
            inputSchema: {}
          },
          ...basicApiContracts.map(({ name, description }) => ({
            name,
            description,
            inputSchema: {}
          }))
        ]
      },
      { environment, executeBatch }
    )
    try {
      await untilTurn(server.packets)
      server.send({
        id: 201,
        method: 'item/tool/call',
        params: {
          threadId: 'thread-1',
          turnId: 'turn-1',
          callId: 'prepare-independent',
          tool: 'prepare_design',
          arguments: {
            draft: {
              type: 'frame',
              name: 'Draft',
              width: 20,
              height: 20,
              children: []
            }
          }
        }
      })
      await entered
      server.send({
        id: 202,
        method: 'item/tool/call',
        params: {
          threadId: 'thread-1',
          turnId: 'turn-1',
          callId: 'describe-independent',
          tool: 'describe_design_apis',
          arguments: {}
        }
      })
      await vi.waitFor(() =>
        expect(server.packets).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 202,
              result: expect.objectContaining({ success: true })
            })
          ])
        )
      )
      expect(
        server.packets.some((packet) => packet.id === 201 && 'result' in packet)
      ).toBe(false)
      expect(preparations).toBe(1)
      expect(executeBatch).not.toHaveBeenCalled()
      for (const definition of nativeToolDefinitions(
        server.packets.find(({ method }) => method === 'thread/start')?.params
      ))
        expect(definition).not.toHaveProperty('executionAccess')
    } finally {
      resume()
      server.finish()
      await completion
    }
  })

  it.skipIf(process.env.LOCAL_AI_DISCOVERY_PROBE !== 'true')(
    'discovers deferred vector APIs through the real native provider',
    async () => {
      const native =
        await vi.importActual<typeof import('node:child_process')>(
          'node:child_process'
        )
      const children: import('node:child_process').ChildProcess[] = []
      const calls: { tool: string; namespace: string }[] = []
      spawn.mockImplementation((...args: Parameters<typeof native.spawn>) => {
        const child = native.spawn(...args)
        children.push(child)
        let buffer = ''
        child.stdout?.on('data', (chunk: Buffer) => {
          buffer += chunk.toString()
          let newline: number
          while ((newline = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, newline)
            buffer = buffer.slice(newline + 1)
            try {
              const packet = JSON.parse(line)
              if (packet.method === 'item/tool/call')
                calls.push({
                  tool: packet.params.tool,
                  namespace: packet.params.namespace
                })
            } catch {
              /* Only record native tool identities. */
            }
          }
        })
        return child
      })
      const contract = basicApiContracts.find(
        ({ method }) => method === 'getVectorAnchorPointAtWorkspacePos'
      )
      const executable = process.env.LOCAL_AI_PROTOCOL_EXECUTABLE
      if (!contract || !executable)
        throw new Error('Missing native discovery probe configuration')
      const executeBatch = vi.fn(async () => ({
        actionResults: [],
        context: {}
      }))
      try {
        const result = await requestLocalAiActionBatch(
          {
            intent: `Inspect the API for editing vector nodes: discover and call describe_design_apis for ${contract.name}. Use native discovery and Code Mode as needed. This is a protocol check only; do not execute a canvas operation. Finish with report_outcome, outcome unsupported, message Protocol probe complete.`,
            context: {},
            actions: [
              {
                name: contract.name,
                description: contract.description,
                inputSchema:
                  contract.inputSchema as AiProviderInput['actions'][number]['inputSchema']
              },
              { name: 'report_outcome', description: 'Report', inputSchema: {} }
            ],
            attempt: 1
          },
          {
            executable,
            model: 'gpt-6-astra',
            executeBatch,
            signal: AbortSignal.timeout(90_000)
          }
        )
        expect(result).toMatchObject({
          actions: expect.arrayContaining([
            expect.objectContaining({ name: 'report_outcome' })
          ])
        })
        expect(calls).toContainEqual({
          tool: 'describe_design_apis',
          namespace: 'design_operations'
        })
        expect(executeBatch).not.toHaveBeenCalled()
      } finally {
        for (const child of children)
          if (child.exitCode === null && child.signalCode === null)
            child.kill('SIGKILL')
      }
    },
    95_000
  )

  it.skipIf(process.env.LOCAL_AI_DISCOVERY_PROBE !== 'true')(
    'records phase-specific review criteria through real deferred discovery',
    async () => {
      const native =
        await vi.importActual<typeof import('node:child_process')>(
          'node:child_process'
        )
      const children: import('node:child_process').ChildProcess[] = []
      const calls: { tool: string; namespace: string; arguments: unknown }[] =
        []
      spawn.mockImplementation((...args: Parameters<typeof native.spawn>) => {
        const child = native.spawn(...args)
        children.push(child)
        let buffer = ''
        child.stdout?.on('data', (chunk: Buffer) => {
          buffer += chunk.toString()
          let newline: number
          while ((newline = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, newline)
            buffer = buffer.slice(newline + 1)
            try {
              const packet = JSON.parse(line)
              if (packet.method === 'item/tool/call')
                calls.push({
                  tool: packet.params.tool,
                  namespace: packet.params.namespace,
                  arguments: packet.params.arguments
                })
            } catch {
              /* Only record native tool identities. */
            }
          }
        })
        return child
      })
      const executable = process.env.LOCAL_AI_PROTOCOL_EXECUTABLE
      if (!executable)
        throw new Error('Missing native discovery probe configuration')
      const plan = {
        phase: 'plan',
        method: 'native-shapes',
        references: [],
        criteria: ['A red square sized 100 by 100 px'],
        detailRequired: false
      }
      const executeBatch = vi.fn(async () => ({
        actionResults: [],
        context: {}
      }))
      try {
        const result = await requestLocalAiActionBatch(
          {
            intent: `Protocol test: discover record_design_review and call it with this exact plan: ${JSON.stringify(plan)}. Do not draw or inspect the canvas. Finish with report_outcome, outcome unsupported, message Protocol probe complete.`,
            context: {},
            actions: [
              {
                name: 'inspect_drawing',
                description: 'Inspect drawing',
                inputSchema: {}
              },
              { name: 'report_outcome', description: 'Report', inputSchema: {} }
            ],
            attempt: 1
          },
          {
            executable,
            model: 'gpt-6-astra',
            executeBatch,
            signal: AbortSignal.timeout(90_000)
          }
        )
        expect(result).toMatchObject({
          actions: expect.arrayContaining([
            expect.objectContaining({ name: 'report_outcome' })
          ])
        })
        expect(calls).toContainEqual({
          tool: 'record_design_review',
          namespace: 'design_operations',
          arguments: plan
        })
        expect(executeBatch).not.toHaveBeenCalled()
      } finally {
        for (const child of children)
          if (child.exitCode === null && child.signalCode === null)
            child.kill('SIGKILL')
      }
    },
    95_000
  )

  it.skipIf(!process.env.LOCAL_AI_PROTOCOL_EXECUTABLE)(
    'checks installed native registration without inference',
    async () => {
      const native =
        await vi.importActual<typeof import('node:child_process')>(
          'node:child_process'
        )
      const children: import('node:child_process').ChildProcess[] = []
      spawn.mockImplementation((...args: Parameters<typeof native.spawn>) => {
        const child = native.spawn(...args)
        children.push(child)
        return child
      })
      try {
        const executable = process.env.LOCAL_AI_PROTOCOL_EXECUTABLE
        if (!executable)
          throw new Error('Missing native registration probe configuration')
        await checkLocalAiProvider({
          model: 'gpt-6-astra',
          executable,
          signal: AbortSignal.timeout(30_000)
        })
        expect(children).toHaveLength(1)
        expect(
          children[0].exitCode !== null || children[0].signalCode !== null
        ).toBe(true)
      } finally {
        for (const child of children)
          if (child.exitCode === null && child.signalCode === null)
            child.kill('SIGKILL')
      }
    },
    35_000
  )

  it('sends native tool schemas once and retains only final control actions in text', async () => {
    const server = fakeServer()
    const action = {
      name: 'select_elements',
      description: 'Select',
      inputSchema: { type: 'object' }
    }
    const control = {
      name: 'report_outcome',
      description: 'Report',
      inputSchema: { type: 'object' }
    }
    await requestConfiguredAiActionBatch(
      { ...input, actions: [action, control] },
      {
        environment,
        executeBatch: async () => ({ actionResults: [], context: {} })
      }
    )
    const definitions = nativeToolDefinitions(
      server.packets.find(({ method }) => method === 'thread/start')?.params
    )
    expect(
      definitions.filter(({ name }) => name === 'select_elements')
    ).toHaveLength(1)
    const items = server.packets.find(({ method }) => method === 'turn/start')
      ?.params.input as { text: string }[]
    const payload = JSON.parse(items[0].text)
    expect(payload).not.toHaveProperty('imageTools')
    expect(payload.input.actions).toEqual([control])
    expect(payload.input.intent).toBe(input.intent)
  })

  it('advertises drawing tools separately from final controls for a text-only request', async () => {
    const server = fakeServer()
    const actions = [
      {
        name: 'apply_prepared_design',
        description: 'Apply design',
        inputSchema: {}
      },
      {
        name: 'insert_vector_composition',
        description: 'Insert vectors',
        inputSchema: {}
      },
      { name: 'report_outcome', description: 'Report', inputSchema: {} },
      { name: 'request_clarification', description: 'Ask', inputSchema: {} }
    ]
    await requestConfiguredAiActionBatch(
      {
        ...input,
        intent: 'Draw a public brand logo at 480 by 480 pixels',
        actions
      },
      {
        environment,
        executeBatch: async () => ({ actionResults: [], context: {} })
      }
    )
    const thread = server.packets.find(
      ({ method }) => method === 'thread/start'
    )?.params
    const definitions = nativeToolDefinitions(thread)
    expect(definitions.map(({ name }) => name)).not.toContain(
      'search_reference_images'
    )
    expect(definitions.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        'import_reference_image',
        'vtracer',
        'prepare_design',
        'apply_prepared_design',
        'insert_vector_composition'
      ])
    )
    const preparedTools = definitions
    for (const name of ['prepare_design', 'prepare_and_apply_design']) {
      const definition = preparedTools.find((tool) => tool.name === name)
      for (const example of designPreparationExamples)
        expect(definition?.description).toContain(JSON.stringify(example))
    }
    const instructions = thread?.developerInstructions as string
    expect(instructions).toContain(
      'input.actions lists final-response actions, not the complete capability catalog'
    )
    for (const { name } of definitions) expect(instructions).toContain(name)
    expect(instructions).toContain('Use native web search')
    expect(instructions).not.toContain(
      'Only explicitly supplied App tools are available'
    )
    expect(thread?.config).toMatchObject({
      web_search: 'live',
      'features.shell_tool': false
    })
    const items = server.packets.find(({ method }) => method === 'turn/start')
      ?.params.input as { text: string }[]
    expect(
      JSON.parse(items[0].text).input.actions.map(
        (action: { name: string }) => action.name
      )
    ).toEqual(['report_outcome', 'request_clarification'])
  })

  it('records cumulative usage once for the request without logging user content', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const server = fakeServer({ hold: true })
    const pending = requestConfiguredAiActionBatch(
      {
        ...input,
        metadata: {
          conversationId: 'conversation-1',
          turnId: 'conversation-1:turn:2',
          replyTo: {
            turnId: 'conversation-1:turn:1',
            intent: 'private request'
          }
        }
      },
      { environment }
    )
    await untilTurn(server.packets)
    const total = {
      inputTokens: 100,
      cachedInputTokens: 40,
      outputTokens: 20,
      reasoningOutputTokens: 10,
      totalTokens: 120
    }
    server.notify('thread/tokenUsage/updated', {
      tokenUsage: { total, last: total }
    })
    server.notify('thread/tokenUsage/updated', {
      tokenUsage: { total, last: total }
    })
    server.finish()
    await pending
    const records = log.mock.calls
      .map(([value]) => JSON.parse(String(value)))
      .filter((value) => value.event === 'ai_request_usage')
    expect(records).toHaveLength(1)
    const record = records[0]
    expect(record).toMatchObject({
      event: 'ai_request_usage',
      provider: 'local-codex',
      outcome: 'completed',
      usageStatus: 'reported',
      conversationId: 'conversation-1',
      turnId: 'conversation-1:turn:2',
      replyToTurnId: 'conversation-1:turn:1',
      tokens: total
    })
    expect(JSON.stringify(record)).not.toMatch(
      /private request|private@example|Create a rectangle/
    )
    log.mockRestore()
  })

  it('does not count connection probes as drawing requests', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    fakeServer()
    await checkLocalAiProvider({ model: 'selected-model', executable: 'codex' })
    expect(log).not.toHaveBeenCalled()
  })

  it('records partial usage on cancellation and ignores other threads', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const server = fakeServer({ hold: true })
    const controller = new AbortController()
    const pending = requestConfiguredAiActionBatch(input, {
      environment,
      signal: controller.signal
    })
    const checked = expect(pending).rejects.toMatchObject({
      code: 'AI_MODEL_BACKEND_ABORTED'
    })
    await untilTurn(server.packets)
    const total = {
      inputTokens: 100,
      cachedInputTokens: 40,
      outputTokens: 20,
      reasoningOutputTokens: 10,
      totalTokens: 120
    }
    server.notify('thread/tokenUsage/updated', { tokenUsage: { total } })
    server.notify('thread/tokenUsage/updated', {
      threadId: 'other-thread',
      tokenUsage: { total: { ...total, inputTokens: 999, totalTokens: 1019 } }
    })
    server.notify('thread/tokenUsage/updated', {
      turnId: 'other-turn',
      tokenUsage: { total: { ...total, inputTokens: 999, totalTokens: 1019 } }
    })
    controller.abort()
    await checked
    const records = log.mock.calls
      .map(([value]) => JSON.parse(String(value)))
      .filter((value) => value.event === 'ai_request_usage')
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      outcome: 'cancelled',
      usageStatus: 'partial',
      tokens: total
    })
  })

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
  it('dispatches analysis in the same turn and prepares only the evidence-backed mapping', async () => {
    vi.mocked(convertVTracerBuffer).mockResolvedValueOnce(
      '<svg width="100" height="100"><path d="M0,0L100,0L100,100L0,100Z" fill="#008800"/></svg>'
    )
    const server = fakeServer({
      toolCall: true,
      analyzeComponents: true,
      toolResultOutput: (summary) =>
        JSON.stringify({
          batchId: 'analyzed',
          actions: [
            {
              id: 'draw',
              name: 'insert_vector_composition',
              summary: 'Reviewed drawing',
              arguments: {
                imageArtifactId: summary.imageArtifactId,
                analysisIds: [summary.analysisId],
                bounds: { x: 0, y: 0, width: 240, height: 240 },
                compositionRole: 'Reference',
                excludePathIds: [],
                componentMappings: [{ pathId: 'path-1', componentType: 'rect' }]
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
      slices: [
        {
          descriptors: [
            expect.objectContaining({ type: 'rect', width: 240, height: 240 })
          ]
        }
      ]
    })
    expect(
      server.packets.filter((packet) => packet.method === 'turn/start')
    ).toHaveLength(1)
    expect(JSON.stringify(result)).not.toMatch(/analysisId|imageArtifactId/)
    expect(server.child.kill).toHaveBeenCalledOnce()
  })
  it.each([10, 100])(
    'admits %i independent analyses before any reply and correlates every result',
    async (count) => {
      vi.mocked(convertVTracerBuffer).mockResolvedValueOnce(
        `<svg width="100" height="100">${Array.from({ length: count }, (_, i) => `<path d="M${i},0L${i + 1},0L${i + 1},10L${i},10Z" fill="#008800"/>`).join('')}</svg>`
      )
      const server = fakeServer({
        toolCall: true,
        analyzeComponents: true,
        parallelAnalyses: count
      })
      const progress: string[] = []
      await expect(
        requestConfiguredAiActionBatch(
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
          {
            environment,
            onProgress: (event) => {
              if (event.tool === AiImageToolIds.ANALYZE_VECTOR_COMPONENTS)
                progress.push(event.status)
            }
          }
        )
      ).resolves.toEqual(batch)
      expect(progress.slice(0, count)).toEqual(Array(count).fill('running'))
      expect(progress.slice(count)).toEqual(Array(count).fill('completed'))
      const receipts = server.packets
        .filter((packet) => packet.id !== undefined && packet.id >= 100)
        .map((packet) => {
          const response = (
            packet as unknown as {
              result: { contentItems: { text: string }[] }
            }
          ).result
          const report = JSON.parse(response.contentItems[0].text)
          expect(report.paths[0].pathId).toBe(`path-${Number(packet.id) - 99}`)
          return report.analysisId
        })
      expect(receipts).toHaveLength(count)
      expect(new Set(receipts).size).toBe(count)
      expect(server.child.kill).toHaveBeenCalledOnce()
    }
  )
  it('queues an exclusive tool until outstanding analyses finish', async () => {
    const server = fakeServer({
      toolCall: true,
      analyzeComponents: true,
      overlapTool: AiImageToolIds.VTRACER
    })
    await expect(
      requestConfiguredAiActionBatch(
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
    ).resolves.toEqual(batch)
    expect(
      server.packets.some((packet) => packet.id === 500 && 'result' in packet)
    ).toBe(true)
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

  it('pins medium effort on both thread configuration and the model turn', async () => {
    const server = fakeServer()
    await requestConfiguredAiActionBatch(input, { environment })
    expect(
      server.packets.find(({ method }) => method === 'thread/start')?.params
        .config
    ).toMatchObject({ model_reasoning_effort: 'medium' })
    expect(
      server.packets.find(({ method }) => method === 'turn/start')?.params
    ).toMatchObject({ effort: 'medium' })
  })

  it.each(['unregistered_namespace', 'design_preparation', null])(
    'rejects a tool called through the wrong namespace %s before execution',
    async (toolNamespace) => {
      const server = fakeServer({
        toolNamespace,
        toolCall: true,
        toolName: 'select_elements',
        toolArguments: { arguments: { elementIds: [] } }
      })
      const executeBatch = vi.fn(async () => ({
        actionResults: [],
        context: {}
      }))
      await expect(
        requestConfiguredAiActionBatch(
          {
            ...input,
            actions: [
              {
                name: 'select_elements',
                description: 'Select',
                inputSchema: {}
              }
            ]
          },
          { environment, executeBatch }
        )
      ).rejects.toMatchObject({
        code: 'AI_MODEL_BACKEND_INVALID_RESPONSE'
      })
      expect(executeBatch).not.toHaveBeenCalled()
      expect(server.child.kill).toHaveBeenCalledOnce()
    }
  )

  it.each(['high', 'low', null])(
    'rejects native effort %s before starting a model turn',
    async (reasoningEffort) => {
      const server = fakeServer({ reasoningEffort })
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
      dynamicTools: expect.arrayContaining([
        expect.objectContaining({
          type: 'namespace',
          tools: expect.arrayContaining([
            expect.objectContaining({ name: 'import_reference_image' })
          ])
        })
      ]),
      selectedCapabilityRoots: [],
      runtimeWorkspaceRoots: [],
      allowProviderModelFallback: false
    })
    // Native app-server DynamicToolSpec requires the function discriminator.
    // Check every advertised definition, not only one known tool name.
    expect(thread?.dynamicTools).toBeInstanceOf(Array)
    for (const definition of nativeToolDefinitions(thread)) {
      expect(definition).toMatchObject({
        type: 'function',
        deferLoading: true,
        name: expect.any(String),
        description: expect.any(String),
        inputSchema: expect.any(Object)
      })
    }
    expect(thread?.developerInstructions).toContain(
      'Return the prepared action batch without invoking backend operation tools'
    )
    expect(thread?.config).toMatchObject({
      'features.shell_tool': false,
      'features.unified_exec': false,
      'features.code_mode': true,
      'features.multi_agent': false,
      'features.plugins': false,
      'features.apps': false,
      web_search: 'live',
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

  it('keeps long-running local work alive until explicit cancellation and closes its child', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    vi.useFakeTimers()
    const server = fakeServer({ hold: true })
    const controller = new AbortController()
    const promise = requestConfiguredAiActionBatch(input, {
      environment,
      signal: controller.signal
    })
    const checked = expect(promise).rejects.toMatchObject({
      code: 'AI_MODEL_BACKEND_ABORTED'
    })
    await untilTurn(server.packets)
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000)
    expect(server.child.kill).not.toHaveBeenCalled()
    controller.abort()
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
    expect(JSON.parse(items[0].text ?? '{}').input.actions).toEqual(
      imageInput.actions
    )
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

it('waits for a canonical operation receipt before continuing the native model', async () => {
  const child = fakeServer({
    toolCall: true,
    toolName: 'set_element_visibility',
    toolArguments: {
      arguments: { elementId: 'actual-id', visible: false },
      message: 'I am hiding the separate mark.'
    }
  })
  spawn.mockReturnValue(child.child)
  const executeBatch = vi.fn(async (prepared) => {
    expect(prepared.actions[0].arguments).toEqual({
      elementId: 'actual-id',
      visible: false
    })
    return {
      actionResults: [
        {
          actionId: prepared.actions[0].id,
          actionName: 'set_element_visibility',
          result: { status: 'complete', appliedElementIds: ['actual-id'] }
        }
      ],
      context: { selectedIds: ['actual-id'] }
    }
  })
  await requestConfiguredAiActionBatch(
    {
      ...input,
      actions: [
        {
          name: 'set_element_visibility',
          description: 'Set visibility',
          inputSchema: {}
        }
      ]
    },
    { environment, executeBatch }
  )
  expect(executeBatch).toHaveBeenCalledOnce()
  const response = child.packets.find(
    (packet) => 'result' in packet
  ) as unknown as { result: { contentItems: { text: string }[] } }
  expect(
    JSON.parse(response.result.contentItems[0].text).context.selectedIds
  ).toEqual(['actual-id'])
})

it('correlates bounded diagnostic evidence with usage without logging credentials or image payloads', () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const usage = createLocalAiUsage(input, 'selected-model')
  usage.trace('tool_started', {
    tool: 'import_reference_image',
    callId: 'call-1',
    arguments: {
      url: 'https://example.com/logo.png?token=secret',
      apiKey: 'private-key',
      image: 'data:image/png;base64,secret-image',
      intent: 'private prompt'
    }
  })
  usage.trace('tool_completed', {
    tool: 'inspect_drawing',
    callId: 'call-1',
    result: {
      available: true,
      findings: [{ kind: 'text-overflow' }],
      inspectionDeferred: true,
      imageScope: 'region',
      partial: true,
      elementsTruncated: true,
      bounds: { x: 10, y: 20, width: 100, height: 200 },
      image: { dataUrl: 'data:image/png;base64,secret-image' }
    }
  })
  usage.finish('completed')
  usage.trace('tool_completed', {})
  const records = log.mock.calls.map(([value]) => JSON.parse(String(value)))
  expect(records).toHaveLength(3)
  expect(records[0]).toMatchObject({
    event: 'ai_request_trace',
    sequence: 1,
    stage: 'tool_started'
  })
  expect(records[1]).toMatchObject({
    sequence: 2,
    stage: 'tool_completed',
    evidence: {
      result: {
        available: true,
        inspectionDeferred: true,
        imageScope: 'region',
        partial: true,
        elementsTruncated: true,
        bounds: { x: 10, y: 20, width: 100, height: 200 }
      }
    }
  })
  expect(records[0].requestId).toBe(records[2].requestId)
  const serialized = JSON.stringify(records)
  expect(serialized).toContain('https://example.com/logo.png')
  for (const secret of ['secret', 'private-key', 'private prompt', 'base64'])
    expect(serialized).not.toContain(secret)
  log.mockRestore()
})

describe('local AI usage accounting', () => {
  const total = {
    inputTokens: 100,
    cachedInputTokens: 40,
    outputTokens: 20,
    reasoningOutputTokens: 10,
    totalTokens: 120
  }
  it('keeps the latest cumulative snapshot, ignores older snapshots, and finishes once', () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const usage = createLocalAiUsage(input, 'selected-model')
    usage.update({ total, last: total })
    const next = { ...total, inputTokens: 200, totalTokens: 220 }
    usage.update({ total: next, last: total })
    usage.update({ total })
    usage.finish('completed')
    usage.finish('failed')
    usage.update({ total: next })
    expect(log).toHaveBeenCalledTimes(1)
    expect(JSON.parse(log.mock.calls[0][0]).tokens).toEqual(next)
  })
  it.each(['cancelled', 'timed_out', 'failed'] as const)(
    'marks observed usage as partial after %s',
    (outcome) => {
      const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
      const usage = createLocalAiUsage(input, 'selected-model')
      usage.update({ total })
      usage.finish(outcome)
      expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({
        outcome,
        usageStatus: 'partial',
        tokens: total
      })
    }
  )
  it('reports missing usage as unavailable rather than zero and isolates requests', () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const first = createLocalAiUsage(input, 'selected-model')
    const second = createLocalAiUsage(input, 'selected-model')
    first.update({ total })
    second.finish('completed')
    first.finish('completed')
    const records = log.mock.calls.map(([line]) => JSON.parse(line))
    expect(records[0]).toMatchObject({
      tokens: null,
      usageStatus: 'unavailable'
    })
    expect(records[1].tokens).toEqual(total)
    expect(records[0].requestId).not.toBe(records[1].requestId)
  })
  it.each([
    { ...total, outputTokens: -1 },
    { ...total, inputTokens: 1.5 },
    { ...total, totalTokens: 999 },
    { ...total, cachedInputTokens: 101 },
    { ...total, reasoningOutputTokens: 21 },
    { ...total, inputTokens: Number.MAX_SAFE_INTEGER + 1 },
    { totalTokens: 120 }
  ])('rejects invalid usage without corrupting earlier evidence', (invalid) => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const usage = createLocalAiUsage(input, 'selected-model')
    usage.update({ total })
    usage.update({ total: invalid })
    usage.finish('completed')
    expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({
      usageStatus: 'partial',
      tokens: total
    })
  })
  it('does not allow the logging sink to break request settlement', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {
      throw new Error('sink closed')
    })
    expect(() =>
      createLocalAiUsage(input, 'selected-model').finish('failed')
    ).not.toThrow()
  })
  it('does not log credentials or arbitrary metadata from the provider', () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const usage = createLocalAiUsage(
      {
        ...input,
        metadata: {
          conversationId: 'private@example.test',
          turnId: 'bad\nvalue',
          secret: 'Bearer private'
        }
      },
      'selected-model'
    )
    usage.update({ total: { ...total, secret: 'Bearer private' } })
    usage.finish('completed')
    const serialized = log.mock.calls[0][0]
    const record = JSON.parse(serialized)
    for (const key of ['metadata', 'conversationId', 'turnId', 'secret'])
      expect(record).not.toHaveProperty(key)
    expect(record.tokens).toEqual(total)
    for (const value of [
      'private@example.test',
      'bad\nvalue',
      'Bearer private'
    ])
      expect(serialized).not.toContain(JSON.stringify(value))
  })
})

it.each([
  AiImageToolIds.VECTORIZE_IMAGE_LAYERS,
  AiImageToolIds.VTRACER,
  AiImageToolIds.REVIEW_VECTOR_CONTOURS,
  AiImageToolIds.APPLY_CONTOUR_REFINEMENTS
])(
  'returns a recoverable missing decision/parameter failure for %s',
  async (toolName) => {
    const server = fakeServer({
      toolCall: true,
      toolName,
      toolArguments: { attachmentIndex: 0 },
      toolResultOutput: () => JSON.stringify(batch)
    })
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
      { environment, signal: new AbortController().signal }
    )
    expect(result).toEqual(batch)
    const reply = server.packets.find(
      (packet) => packet.id === 99 && 'result' in packet
    )
    expect(reply).toMatchObject({
      result: {
        success: false,
        contentItems: [
          expect.objectContaining({
            text: expect.stringMatching(/separate|Contour/)
          })
        ]
      }
    })
  }
)

it('allows native conceptual research without an image and exposes only safe activity', async () => {
  const child = fakeServer({ research: true })
  spawn.mockReturnValue(child.child)
  const onProgress = vi.fn()
  const result = await requestConfiguredAiActionBatch(input, {
    environment,
    onProgress
  })
  expect(result).toEqual(batch)
  expect(
    child.packets.find((packet) => packet.method === 'thread/start')?.params
      .config
  ).toMatchObject({ web_search: 'live', 'features.shell_tool': false })
  expect(onProgress).toHaveBeenCalledWith({
    tool: 'research_design_context',
    status: 'running'
  })
  expect(onProgress).toHaveBeenCalledWith({
    tool: 'research_design_context',
    status: 'completed'
  })
  expect(JSON.stringify(onProgress.mock.calls)).not.toContain(
    'private-query-not-for-ui'
  )
})

describe('native semantic design handoff', () => {
  const actions: AiProviderInput['actions'] = [
    { name: 'report_outcome', description: 'Report', inputSchema: {} },
    {
      name: 'apply_prepared_design',
      description: 'Apply',
      inputSchema: {
        type: 'object',
        properties: { design: { type: 'object' } }
      }
    },
    { name: 'review_design', description: 'Measure', inputSchema: {} },
    { name: 'inspect_drawing', description: 'Review', inputSchema: {} }
  ]
  const draft = {
    type: 'frame',
    name: 'Sketch',
    width: 300,
    height: 200,
    children: [
      {
        key: 'heading',
        name: 'Heading',
        type: 'text',
        width: 280,
        height: 60,
        text: 'A fresh idea'
      }
    ]
  }
  it('prepares without an image, applies only the receipt and reviews canonical output', async () => {
    const child = fakeServer({
      toolCall: true,
      toolName: 'prepare_design',
      toolArguments: { draft },
      followupTool: (receipt) => ({
        name: 'apply_prepared_design',
        args: {
          arguments: { artifactId: receipt.artifactId },
          message: 'Create the design'
        }
      }),
      output: JSON.stringify({
        batchId: 'done',
        actions: [
          {
            id: 'report',
            name: 'report_outcome',
            arguments: { outcome: 'completed', message: 'Design created.' },
            summary: 'Report result'
          }
        ]
      })
    })
    spawn.mockReturnValue(child.child)
    const executeBatch = vi.fn(async (prepared) => {
      const a = prepared.actions[0]
      if (a.name === 'apply_prepared_design') {
        expect(a.arguments.design.entries[1].descriptor.text).toBe(
          'A fresh idea'
        )
        expect(a.arguments).not.toHaveProperty('artifactId')
        return {
          actionResults: [
            {
              actionId: a.id,
              actionName: a.name,
              result: { compositionId: 'actual-root' }
            }
          ],
          context: {}
        }
      }
      expect(a.arguments).toEqual({ elementId: 'actual-root' })
      if (a.name === 'review_design')
        return {
          actionResults: [
            {
              actionId: a.id,
              actionName: a.name,
              result: {
                complete: true,
                measuredTextIds: ['heading'],
                findings: []
              }
            }
          ],
          context: {}
        }
      return {
        actionResults: [
          {
            actionId: a.id,
            actionName: a.name,
            result: {
              available: true,
              image: {
                width: 1,
                height: 1,
                dataUrl:
                  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGioAAAAASUVORK5CYII='
              }
            }
          }
        ],
        context: {}
      }
    })
    await expect(
      requestConfiguredAiActionBatch(
        { ...input, actions },
        { environment, executeBatch }
      )
    ).resolves.toMatchObject({ batchId: 'done' })
    expect(
      executeBatch.mock.calls.map(([request]) => request.actions[0].name)
    ).toEqual(['apply_prepared_design', 'review_design', 'inspect_drawing'])
    const thread = child.packets.find(
      (p) => p.method === 'thread/start'
    )?.params
    expect(nativeToolDefinitions(thread)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'prepare_design' })
      ])
    )
    const advertised = JSON.stringify(thread?.dynamicTools)
    expect(advertised).not.toContain('"properties":{"design":')
    const preparedReply = child.packets.find(
      (p) => p.id === 99 && 'result' in p
    )
    expect(JSON.stringify(preparedReply)).not.toMatch(/descriptor|points|props/)
  })
  it('reports invalid design references as tool failures without executing a batch or ending transport', async () => {
    const child = fakeServer({
      toolCall: true,
      toolName: 'apply_prepared_design',
      toolArguments: { arguments: { artifactId: 'unknown' } },
      output: JSON.stringify({
        batchId: 'done',
        actions: [
          {
            id: 'report',
            name: 'report_outcome',
            arguments: {
              outcome: 'unsupported',
              message: 'No design was applied.'
            },
            summary: 'Report result'
          }
        ]
      })
    })
    spawn.mockReturnValue(child.child)
    const executeBatch = vi.fn()
    await expect(
      requestConfiguredAiActionBatch(
        { ...input, actions },
        { environment, executeBatch }
      )
    ).resolves.toMatchObject({ batchId: 'done' })
    expect(executeBatch).not.toHaveBeenCalled()
    expect(
      child.packets.find((p) => p.id === 99 && 'result' in p)
    ).toMatchObject({ result: { success: false } })
  })
  it('resolves preparation receipts in the non-streaming final batch route too', async () => {
    const child = fakeServer({
      toolCall: true,
      toolName: 'prepare_design',
      toolArguments: { draft },
      toolResultOutput: (summary) =>
        JSON.stringify({
          batchId: 'prepared',
          actions: [
            {
              id: 'a',
              name: 'apply_prepared_design',
              arguments: {
                artifactId: (summary as unknown as { artifactId: string })
                  .artifactId
              },
              summary: 'Create design'
            }
          ]
        })
    })
    spawn.mockReturnValue(child.child)
    const result = await requestConfiguredAiActionBatch(
      { ...input, actions },
      { environment }
    )
    expect(result.actions[0].arguments).toMatchObject({
      design: { version: 1, entries: expect.any(Array) }
    })
  })
})

it('returns invalid vector preparation to the model for correction before any canvas write', async () => {
  const server = fakeServer({
    toolCall: true,
    toolName: 'insert_vector_composition',
    toolArguments: { arguments: { imageArtifactId: 'unknown' } }
  })
  const executeBatch = vi.fn(async () => ({ actionResults: [], context: {} }))
  await expect(
    requestConfiguredAiActionBatch(
      {
        ...input,
        actions: [
          {
            name: 'insert_vector_composition',
            description: 'Insert',
            inputSchema: {}
          }
        ]
      },
      { environment, executeBatch }
    )
  ).resolves.toBeDefined()
  const reply = server.packets.find(
    (packet) => packet.id === 99 && 'result' in packet
  )
  expect(reply).toMatchObject({ result: { success: false } })
  expect(executeBatch).not.toHaveBeenCalled()
})

it('continues serial image tools beyond former image, operation and total-call ceilings', async () => {
  const server = fakeServer({ toolCall: true, repeatedImageCalls: 170 })
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
  expect(result.batchId).toBe('batch-1')
  expect(server.packets.filter((p) => 'result' in p)).toHaveLength(170)
  expect(server.child.kill).toHaveBeenCalledOnce()
})

it('accepts cumulative protocol traffic beyond 32 MiB while bounding each message', async () => {
  const server = fakeServer({ hold: true })
  const promise = requestConfiguredAiActionBatch(input, { environment })
  // Attach rejection immediately: this also prevents unhandled rejection in the red run.
  const result = promise.then(
    (value) => ({ value }),
    (error) => ({ error })
  )
  await untilTurn(server.packets)
  for (let index = 0; index < 34; index++) {
    server.notify('item/completed', {
      item: { type: 'reasoning', text: 'x'.repeat(1024 * 1024) }
    })
    server.child.stderr.write('x'.repeat(1024 * 1024))
  }
  server.finish()
  expect(await result).toEqual({ value: batch })
  expect(server.child.kill).toHaveBeenCalledOnce()
})

it('keeps a registered review tool available after rejected input and accepts a corrected call in the same turn', async () => {
  const failures: Record<string, unknown>[] = []
  const server = fakeServer({
    toolCall: true,
    toolName: 'record_design_review',
    toolArguments: { phase: 'plan' },
    followupTool: (reply) => {
      failures.push(reply)
      return {
        name: 'record_design_review',
        args: {
          phase: 'plan',
          method: 'Editable illustration',
          references: [],
          criteria: ['Retain the requested appearance'],
          detailRequired: true
        }
      }
    }
  })
  spawn.mockReturnValue(server.child)
  const executeBatch = vi.fn()
  await requestConfiguredAiActionBatch(
    {
      ...input,
      actions: [
        ...input.actions,
        { name: 'inspect_drawing', description: 'Inspect', inputSchema: {} }
      ]
    },
    { environment, executeBatch }
  )
  expect(failures).toEqual([
    expect.objectContaining({
      available: true,
      code: 'PREPARATION_REJECTED',
      recoverable: true,
      message: expect.stringContaining('required field is missing')
    })
  ])
  expect(server.packets.find((packet) => packet.id === 99)).toMatchObject({
    result: { success: false }
  })
  expect(server.packets.find((packet) => packet.id === 100)).toMatchObject({
    result: { success: true }
  })
  expect(executeBatch).not.toHaveBeenCalled()
})

it('exposes review planning to the model and traces the operation without certifying an unassessed image', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const outcome = {
    batchId: 'done',
    actions: [
      {
        id: 'done',
        name: 'report_outcome',
        arguments: { outcome: 'completed', message: 'Perfect.' },
        summary: 'Done'
      }
    ]
  }
  const server = fakeServer({
    toolCall: true,
    toolName: 'record_design_review',
    toolArguments: {
      phase: 'plan',
      method: 'Three deliberately crude shapes',
      references: [],
      criteria: ['Intentionally ugly face'],
      detailRequired: false
    },
    followupTool: () => ({
      name: 'set_element_visibility',
      args: { arguments: { elementIds: ['drawing'], visible: true } }
    }),
    output: JSON.stringify(outcome)
  })
  spawn.mockReturnValue(server.child)
  const result = await requestConfiguredAiActionBatch(
    {
      ...input,
      actions: [
        'set_element_visibility',
        'inspect_drawing',
        'report_outcome'
      ].map((name) => ({ name, description: name, inputSchema: {} }))
    },
    {
      environment,
      executeBatch: async (batch) => ({
        context: {},
        actionResults: batch.actions.map(
          (action): AiBatchReceipt['actionResults'][number] => ({
            actionId: action.id,
            actionName: action.name,
            result:
              action.name === 'inspect_drawing'
                ? {
                    available: true,
                    image: {
                      width: 1,
                      height: 1,
                      dataUrl:
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGioAAAAASUVORK5CYII='
                    }
                  }
                : { compositionId: 'drawing' }
          })
        )
      })
    }
  )
  expect(result).toMatchObject({
    actions: [
      {
        arguments: {
          outcome: 'unsupported',
          message: expect.stringContaining('not yet been checked')
        }
      }
    ]
  })
  const records = log.mock.calls.map(([value]) => JSON.parse(String(value)))
  const trace = records.filter((entry) => entry.event === 'ai_request_trace')
  for (const entry of trace.filter((event) =>
    event.stage.startsWith('provider_request_')
  ))
    expect(entry.callId).toEqual(expect.any(String))
  expect(
    trace
      .filter(
        (entry) =>
          entry.stage.startsWith('tool_') || entry.stage === 'settlement'
      )
      .map((entry) => entry.stage)
  ).toEqual([
    'tool_started',
    'tool_execution_started',
    'tool_completed',
    'tool_started',
    'tool_execution_started',
    'tool_completed',
    'settlement'
  ])
  for (const entry of trace.filter(
    (event) => event.stage === 'tool_completed'
  )) {
    expect(entry.evidence).toMatchObject({
      queueMs: expect.any(Number),
      executionMs: expect.any(Number),
      responseTextBytes: expect.any(Number),
      imageCount: expect.any(Number)
    })
    expect(entry.evidence.queueMs).toBeGreaterThanOrEqual(0)
    expect(entry.evidence.executionMs).toBeGreaterThanOrEqual(0)
  }
  expect(new Set(records.map((entry) => entry.requestId)).size).toBe(1)
  const evidence = JSON.stringify(trace)
  expect(evidence).toContain('Intentionally ugly face')
  expect(evidence).toContain('inspectionId')
  expect(evidence).toContain('unsupported')
  expect(evidence).not.toContain('base64')
  expect(evidence).not.toContain('This must not reach the product')
  log.mockRestore()
})

it('bounds trace records and never lets a broken diagnostic sink stop the request', () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const usage = createLocalAiUsage(input, 'selected-model')
  usage.trace('tool_completed', {
    tool: 'prepare_design',
    callId: 'bounded-call',
    result: {
      findings: Array.from({ length: 10000 }, () => ({
        kind: 'shape',
        evidence: 'x'.repeat(10000)
      }))
    }
  })
  expect(String(log.mock.calls[0][0]).length).toBeLessThan(13000)
  expect(JSON.parse(String(log.mock.calls[0][0]))).toMatchObject({
    tool: 'prepare_design',
    callId: 'bounded-call'
  })
  log.mockImplementation(() => {
    throw new Error('Closed sink')
  })
  expect(() => usage.trace('settlement', { outcome: 'failed' })).not.toThrow()
  expect(() => usage.finish('failed')).not.toThrow()
  log.mockRestore()
})

it('admits native code-mode output as diagnostics only and rejects environment tool output', async () => {
  const server = fakeServer({ hold: true })
  const promise = requestConfiguredAiActionBatch(input, { environment })
  await untilTurn(server.packets)
  server.notify('item/completed', {
    item: {
      type: 'functionCallOutput',
      namespace: 'functions',
      name: 'exec',
      id: 'script',
      output: JSON.stringify({ batchId: 'injected', actions: [] })
    }
  })
  server.finish()
  await expect(promise).resolves.toEqual(batch)
  const forbidden = fakeServer({ hold: true })
  const next = requestConfiguredAiActionBatch(input, { environment })
  const rejected = expect(next).rejects.toMatchObject({
    code: 'AI_MODEL_BACKEND_INVALID_RESPONSE'
  })
  await untilTurn(forbidden.packets)
  forbidden.notify('item/completed', {
    item: {
      type: 'functionCallOutput',
      namespace: 'functions',
      name: 'exec_command',
      id: 'shell',
      output: 'not allowed'
    }
  })
  await rejected
})

it('does not start queued canvas writes after the first executor fails', async () => {
  const server = fakeServer({ hold: true })
  let rejectWrite!: (error: Error) => void
  const executeBatch = vi.fn(
    () =>
      new Promise<AiBatchReceipt>((_resolve, reject) => {
        rejectWrite = reject
      })
  )
  const promise = requestConfiguredAiActionBatch(
    {
      ...input,
      actions: [
        {
          name: 'select_elements',
          description: 'Select',
          inputSchema: { type: 'object' }
        }
      ]
    },
    { environment, executeBatch }
  )
  const rejected = expect(promise).rejects.toMatchObject({
    code: 'AI_MODEL_BACKEND_TRANSPORT_FAILED'
  })
  await untilTurn(server.packets)
  for (let i = 0; i < 2; i++)
    server.send({
      id: 90 + i,
      method: 'item/tool/call',
      params: {
        threadId: 'thread-1',
        turnId: 'turn-1',
        callId: `write-${i}`,
        tool: 'select_elements',
        arguments: { arguments: { elementIds: ['shape'] } }
      }
    })
  await vi.waitFor(() => expect(executeBatch).toHaveBeenCalledTimes(1))
  rejectWrite(new Error('Canonical execution failed'))
  await rejected
  expect(executeBatch).toHaveBeenCalledTimes(1)
})

it('accepts an omitted default namespace on native code-mode output', async () => {
  const server = fakeServer({ hold: true })
  const promise = requestConfiguredAiActionBatch(input, { environment })
  const completed = expect(promise).resolves.toEqual(batch)
  await untilTurn(server.packets)
  server.notify('item/completed', {
    item: {
      type: 'functionCallOutput',
      name: 'exec',
      id: 'native-script',
      output: 'image result'
    }
  })
  server.finish()
  await completed
})

it.each(['list_mcp_resources', 'list_mcp_resource_templates'])(
  'accepts native %s discovery without admitting its output as a batch',
  async (tool) => {
    const server = fakeServer({ hold: true })
    const promise = requestConfiguredAiActionBatch(input, { environment })
    const completed = expect(promise).resolves.toEqual(batch)
    await untilTurn(server.packets)
    server.notify('item/completed', {
      item: {
        type: 'mcpToolCall',
        server: 'codex',
        tool,
        id: 'discovery',
        status: 'completed',
        result: { batchId: 'injected', actions: [] }
      }
    })
    server.finish()
    await completed
  }
)

it.each([
  ['external', 'list_mcp_resources'],
  ['codex', 'read_mcp_resource'],
  ['codex', 'write_file']
])('rejects unregistered MCP execution %s/%s', async (owner, tool) => {
  const server = fakeServer({ hold: true })
  const promise = requestConfiguredAiActionBatch(input, { environment })
  const rejected = expect(promise).rejects.toMatchObject({
    code: 'AI_MODEL_BACKEND_INVALID_RESPONSE'
  })
  await untilTurn(server.packets)
  server.notify('item/completed', {
    item: {
      type: 'mcpToolCall',
      server: owner,
      tool,
      id: 'external',
      status: 'completed'
    }
  })
  await rejected
})

it('attributes overlapping tool intervals once and leaves provider gaps unattributed', () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const clock = vi.spyOn(performance, 'now')
  try {
    clock.mockReturnValue(0)
    const usage = createLocalAiUsage(input, 'selected-model')
    clock.mockReturnValue(100)
    usage.trace('tool_started', { callId: 'a', tool: 'prepare_design' })
    clock.mockReturnValue(120)
    usage.trace('tool_started', { callId: 'b', tool: 'prepare_design' })
    clock.mockReturnValue(160)
    usage.trace('tool_completed', { callId: 'a', tool: 'prepare_design' })
    clock.mockReturnValue(200)
    usage.trace('tool_completed', { callId: 'b', tool: 'prepare_design' })
    clock.mockReturnValue(500)
    usage.finish('completed')
    const report = JSON.parse(String(log.mock.calls.at(-1)?.[0]))
    expect(report.timing).toEqual({
      observedToolAndResearchMs: 100,
      unattributedMs: 400
    })
  } finally {
    clock.mockRestore()
    log.mockRestore()
  }
})

it('records reported provider item intervals without retaining reasoning content', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const server = fakeServer({ hold: true })
  spawn.mockReturnValue(server.child)
  try {
    const completion = requestConfiguredAiActionBatch(input, { environment })
    await untilTurn(server.packets)
    for (const method of ['item/started', 'item/completed'])
      server.notify(method, {
        item: {
          id: 'reasoning-1',
          type: 'reasoning',
          content: 'PRIVATE REASONING',
          summary: ['PRIVATE REASONING']
        }
      })
    server.finish()
    await completion
    const records = log.mock.calls.map(([entry]) => JSON.parse(String(entry)))
    expect(
      records.filter((entry) => entry.stage?.startsWith('provider_item_'))
    ).toEqual([
      expect.objectContaining({
        stage: 'provider_item_started',
        callId: 'item:reasoning-1',
        evidence: expect.objectContaining({ kind: 'reasoning' })
      }),
      expect.objectContaining({
        stage: 'provider_item_completed',
        callId: 'item:reasoning-1'
      })
    ])
    expect(JSON.stringify(records)).not.toContain('PRIVATE REASONING')
  } finally {
    log.mockRestore()
  }
})

it('retains exact bounded discovery and field selectors for execution diagnosis', () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  try {
    createLocalAiUsage(input, 'selected-model').trace('tool_started', {
      callId: 'query',
      tool: 'describe_design_apis',
      arguments: {
        names: ['api_core_getElementComputedData'],
        fields: ['bounds'],
        password: 'must-not-be-recorded'
      }
    })
    const record = JSON.parse(log.mock.calls[0][0])
    expect(record.evidence.arguments.names.items).toEqual([
      'api_core_getElementComputedData'
    ])
    expect(record.evidence.arguments.fields.items).toEqual(['bounds'])
    expect(JSON.stringify(record)).not.toContain('must-not-be-recorded')
  } finally {
    log.mockRestore()
  }
})

it('keeps batch work counts in diagnostics without retaining arbitrary input data', () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  createLocalAiUsage(input, 'selected-model').trace('tool_completed', {
    tool: 'execute_design_batch',
    result: {
      batchSummary: { operationCount: 2, actionCount: 47 },
      privatePayload: 'do not retain'
    }
  })
  const record = JSON.parse(log.mock.calls[0][0])
  expect(record.evidence.result.batchSummary).toEqual({
    operationCount: 2,
    actionCount: 47
  })
  expect(JSON.stringify(record)).not.toContain('do not retain')
})

it('retains compact deferred review evidence without retaining geometry', () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  try {
    createLocalAiUsage(input, 'selected-model').trace('tool_completed', {
      tool: 'record_design_review',
      result: {
        deferredDetails: [
          { id: 'rear', description: 'Rear detail', reason: 'Likely hidden' }
        ],
        deferredChecks: [
          { id: 'rear', status: 'pending', evidence: 'Inspect edge' }
        ],
        pendingDetails: ['rear'],
        privateGeometry: 'do not retain'
      }
    })
    const report = JSON.parse(log.mock.calls[0][0])
    expect(report.evidence.result.pendingDetails).toBeDefined()
    expect(JSON.stringify(report)).toContain('Rear detail')
    expect(JSON.stringify(report)).not.toContain('do not retain')
  } finally {
    log.mockRestore()
  }
})

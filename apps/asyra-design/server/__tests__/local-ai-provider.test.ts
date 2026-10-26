/// <reference lib="dom" />
/// <reference types="vite/client" />
import { createAiAgentRuntime } from '@asyra/ai-agent-runtime'
import { getFeature, unregisterFeature } from '@asyra/feature-system'
import {
  registerAiAgentFeature,
  type AiAgentFeatureApi
} from '../../src/features/ai-agent'
import { FeatureNames } from '../../src/constants'
import {
  AI_CONVERSATION_HISTORY_MAXIMUM_BYTES,
  createAiConversationController
} from '../../src/ai/conversation'
import recordedAttachmentHandoff from './fixtures/recorded-101/attachment-reference-20261025.json'
import briefFixture from './fixtures/recorded-101/brief-capacity-20261024.json'
import capacityFixture from './fixtures/recorded-101/pattern-budget-recovery-20261023.json'
import { admitPreparedDesignDelivery } from '../../src/ai/prepared-design-admission'
import { PREPARED_DESIGN_DELIVERY_VERSION } from '../../src/ai/prepared-design'
import type {} from '../../src/types'
import recordedDiscoveryDelivery from './fixtures/recorded-101/discovery-delivery-20261020.json'
import inspectionDiscovery from './fixtures/recorded-101/inspection-discovery-20261022.json'
import recordedPurpose from './fixtures/recorded-101/purpose-20261017.json'
import sharp from 'sharp'
import { createHash } from 'node:crypto'
import { runInNewContext } from 'node:vm'
import { toolContractDigest } from '@asyra/ai-agent-runtime/node'
const reviewCriteria = (names: readonly string[]) =>
  Object.fromEntries(
    names.map((id) => [
      id,
      {
        requirement: id,
        description: id,
        verification: 'visual',
        requiredUnits: []
      }
    ])
  )
import { designPreparationExamples } from '../design-preparation-examples'
import type {
  AiProviderInput,
  AiBatchReceipt,
  AiActionBatch
} from '../../src/ai/action-batch-protocol'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { EventEmitter } from 'node:events'
import { PassThrough, Writable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createAiExecutionProfiler as createProfiler,
  createAiToolContract
} from '@asyra/ai-agent-runtime'
import { parseExecutionRecord } from '@asyra/ai-agent-runtime/node'
import {
  checkLocalAiProvider,
  requestLocalAiAssessment,
  requestLocalAiActionBatch
} from '../local-ai-provider'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import * as designTools from '../local-design-tools'
import * as referenceTools from '../local-reference-tools'
import * as toolStorage from '../local-tool-store'
import * as toolHosts from '../local-tool-host'
import { requestConfiguredAiActionBatch } from '../ai-model-provider'
import { convertVTracerBuffer } from '../../vtracer-tool-server.mjs'
import { AiImageToolIds } from '../ai-domain-prompt'
import { toolRequestReference, toolSemantics } from '../../src/ai/tool-contract'
import { basicApiResultSchema } from '../../src/ai/basic-api-results'
import { AiActionNames } from '../../src/constants/ai-actions'
import type { AiToolStoreEntry } from '@asyra/ai-agent-runtime'
import { createAiActivityProjection } from '../../src/ai/activity-state'
import { createServerActionBatchProvider } from '../../src/ai/server-action-batch-provider'

const { spawn, retainedRecords, retainedPayloads } = vi.hoisted(() => ({
  spawn: vi.fn(),
  retainedRecords: [] as unknown[],
  retainedPayloads: [] as { callId: string; value: unknown }[]
}))
vi.mock('@asyra/ai-agent-runtime/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@asyra/ai-agent-runtime/node')>()),
  captureAiSourceIdentity: vi.fn(async () => ({
    sourceRevision: 'fixture-revision',
    sourceFingerprint: 'f'.repeat(64),
    sourceIdentityStatus: 'captured'
  })),
  createExecutionRecordSink: () => ({
    write: (record: unknown) => retainedRecords.push(record),
    writePayload: (
      _requestId: string,
      callId: string,
      _phase: string,
      value: unknown
    ) => {
      retainedPayloads.push({ callId, value })
      return {
        status: 'queued',
        path: `fixture-${retainedPayloads.length - 1}.json`
      }
    },
    flush: async () => ({ status: 'saved', path: null })
  })
}))
vi.mock('../local-tool-store', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../local-tool-store')>()),
  createLocalToolStore: vi.fn(async () => ({
    read: async () => undefined,
    list: async () => [],
    write: async () => {
      throw new Error('No durable fixture configured')
    },
    close: vi.fn()
  }))
}))
vi.mock('node:child_process', () => ({ spawn }))
vi.mock('../../vtracer-tool-server.mjs', () => ({
  convertVTracerBuffer: vi.fn(
    async () =>
      '<svg width="1" height="1"><path d="M0,0L1,0L1,1Z" fill="#000000"/></svg>'
  )
}))

const rasterAttachment = async () => {
  const bytes = await sharp({
    create: { width: 1, height: 1, channels: 3, background: '#000000' }
  })
    .png()
    .toBuffer()
  return {
    dataUrl: `data:image/png;base64,${bytes.toString('base64')}`,
    mediaType: 'image/png',
    size: bytes.length
  }
}

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
  result?: unknown
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
    effectiveConfig?: unknown
    holdMethod?: string
    responseError?: { method: string; error: unknown }
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
    commentary?: string
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
  const fragments = new Map<number, string>()
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
    notify('item/started', {
      item: { id: 'public-purpose', type: 'agentMessage', phase: 'commentary' }
    })
    notify('item/completed', {
      item: {
        type: 'agentMessage',
        id: 'public-purpose',
        phase: 'commentary',
        text: 'Checking remaining details'
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
      const result = packet.result as
        { contentItems?: { text: string }[] } | undefined
      const text = result?.contentItems?.[0]?.text
      const fragment = text ? JSON.parse(text).contentDelivery : undefined
      if (fragment && packet.id !== undefined && result?.contentItems) {
        const previous = fragments.get(packet.id) ?? ''
        expect(fragment.startByte).toBe(Buffer.byteLength(previous))
        const complete = previous + fragment.text
        fragments.set(packet.id, complete)
        if (!fragment.lastPage) {
          queueMicrotask(() =>
            send({
              id: packet.id,
              method: 'item/tool/call',
              params: {
                threadId: 'thread-1',
                turnId: 'turn-1',
                callId: `fragment-${packet.id}-${fragment.endByte}`,
                tool: fragment.next.tool,
                arguments: fragment.next.arguments
              }
            })
          )
          done()
          return
        }
        expect(Buffer.byteLength(complete)).toBe(fragment.totalBytes)
        result.contentItems[0].text = complete
        fragments.delete(packet.id)
      }
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
        if (packet.method === options.holdMethod) return
        if (packet.method === options.responseError?.method) {
          send({ id: packet.id, error: options.responseError.error })
          return
        }
        let result: unknown = {}
        if (packet.method === 'config/read')
          result = options.effectiveConfig ?? { config: {} }
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
          if (options.commentary)
            notify('item/completed', {
              item: {
                id: 'current-stage',
                type: 'agentMessage',
                phase: 'commentary',
                text: options.commentary
              }
            })
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
  retainedPayloads.length = 0
  vi.useRealTimers()
  vi.resetAllMocks()
  vi.restoreAllMocks()
})

describe('local subscription AI backend', () => {
  it('delivers saved consultation context through Feature, Runtime, HTTP and native turn input without replay', async () => {
    // Original ordinary answer, not the evaluation report. Run 1792943745017,
    // native record 839ab2b8-d58b-45f4-933e-ff55574668f8, payload 10-output.json.
    // Payload SHA-256: f445fb370c1a4a89d26245faade554b06aaf9b4e04896df5d057b2f5794e1223.
    const savedBatch = {
      batchId: 'proposal-01',
      actions: [
        {
          id: 'outcome-01',
          name: 'report_outcome',
          arguments: {
            outcome: 'completed',
            message:
              '建議方向：「冷色玻璃 × 霧銀金屬」，以俐落的半寫實建築插畫呈現。以下是提案，尚未繪製或變更畫布。\n\n構圖｜建議直式畫幅，採略微仰視的三分之四視角，同時看見正面與側面；維持垂直線穩定，凸顯建築高度。主體約占畫面七成，四周留白、背景透明，不加人物、植栽或文字。\n\n立面｜以修長主量體搭配較低的入口量體，建立高低層次。玻璃帷幕以細直框形成主要節奏，樓層橫框退為次要線條；入口內凹、頂部局部退縮，讓輪廓有辨識度而不過度複雜。\n\n材質｜玻璃以灰藍、青灰為主，兼具柔和反射與少量室內暗部，避免整面像不透明藍板。反射跨同一立面連續延伸，不讓每格窗戶重複相同亮斑。金屬採霧銀鋁板與深灰窗框，以較窄的亮邊、柔和明暗及克制接縫，與玻璃區分。\n\n光線與風格｜設定左上方柔光，正面較亮、側面較深，入口凹處最暗。以乾淨幾何輪廓搭配局部材質細節；先讓體積與材質讀得清楚，再決定細節密度。這是原創概念方向，並非特定建築重現或工程設計。'
          },
          summary: '提出構圖、立面與材質方向；不繪製、不變更畫布。'
        }
      ]
    }
    const firstIntent =
      '我要設計一張玻璃與金屬構成的建築插畫。請先提出構圖、立面與材質方向，這一步先不要繪製。'
    const nextIntent =
      '沿用剛才的方向，進一步說明玻璃與金屬的反射、明暗層次，以及如何檢查材質是否一致，先不要繪製。'
    const firstServer = fakeServer({ output: JSON.stringify(savedBatch) })
    const secondServer = fakeServer({
      output: JSON.stringify({
        batchId: 'followup',
        actions: [
          {
            id: 'reply',
            name: 'report_outcome',
            arguments: {
              outcome: 'completed',
              message:
                'Continue the agreed facade, keeping continuous reflections.'
            },
            summary: 'Advice only'
          }
        ]
      })
    })
    const posted: AiProviderInput[] = []
    const transport = createServerActionBatchProvider({
      fetch: async (_url, init) => {
        const input = JSON.parse(String(init.body)) as AiProviderInput
        posted.push(input)
        const result = await requestConfiguredAiActionBatch(input, {
          environment,
          signal: init.signal
        })
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      }
    })
    const hadWindow = typeof window !== 'undefined'
    if (!hadWindow) vi.stubGlobal('window', {})
    const { createAiActions } = await import('../../src/ai/actions')
    const report = createAiActions(undefined, {
      confirmPersistence: async () => ({
        status: 'durable',
        documentId: 'consultation',
        documentGeneration: 1,
        sequence: 0,
        durableSequence: 0
      })
    }).find((action) => action.name === AiActionNames.REPORT_OUTCOME)
    if (!report) throw new Error('Missing canonical report action')
    const runtime = createAiAgentRuntime({
      provider: transport,
      actionDefinitions: [report],
      contextProvider: { getContext: async () => ({ elementCount: 0 }) },
      permissionPolicy: { evaluate: () => 'allow' },
      confirmationHandler: { confirm: async () => true },
      transactionRunner: { run: async (_label, work) => work() }
    })
    registerAiAgentFeature(runtime)
    const feature = getFeature(FeatureNames.AI_AGENT) as AiAgentFeatureApi
    const controller = createAiConversationController({
      feature,
      getElementType: () => undefined
    })
    try {
      const first = await controller.submit(firstIntent)
      expect(first.outcome).toBe('no-change')
      const second = await controller.submit(nextIntent)
      expect(second.outcome).toBe('no-change')
      const nativeInput = (server: ReturnType<typeof fakeServer>) => {
        const starts = server.packets.filter(
          (packet) => packet.method === 'turn/start'
        )
        expect(starts).toHaveLength(1)
        const items = starts[0].params.input as { text: string }[]
        return JSON.parse(items[0].text).input
      }
      expect(nativeInput(firstServer).metadata).not.toHaveProperty(
        'conversationHistory'
      )
      const expected = {
        omittedTurns: 0,
        turns: [
          {
            turnId: first.turnId,
            intent: firstIntent,
            message: savedBatch.actions[0].arguments.message,
            outcome: 'no-change'
          }
        ]
      }
      expect(nativeInput(secondServer).metadata.conversationHistory).toEqual(
        expected
      )
      expect(posted[1].metadata).toMatchObject({
        conversationHistory: expected
      })
      expect(nativeInput(secondServer).intent).toBe(nextIntent)
      expect(posted).toHaveLength(2)
      expect(spawn).toHaveBeenCalledTimes(2)
      for (const server of [firstServer, secondServer]) {
        expect(
          server.packets.filter((packet) => packet.method === 'thread/start')
        ).toHaveLength(1)
        const started = server.packets.find(
          (packet) => packet.method === 'thread/start'
        )
        if (!started) throw new Error('Missing native thread start')
        const thread = started.params
        expect(thread.ephemeral).toBe(true)
        if (server === secondServer) {
          expect(thread.baseInstructions).toContain(
            'metadata.conversationHistory'
          )
          expect(thread.baseInstructions).toContain(
            'Never replay prior actions'
          )
        } else {
          expect(thread.baseInstructions).not.toContain(
            'metadata.conversationHistory'
          )
        }
        expect(
          server.packets.some((packet) => packet.method === 'item/tool/call')
        ).toBe(false)
      }
      const wire = JSON.stringify(expected)
      for (const excluded of [
        'actionResults',
        'progress',
        'contextKey',
        'imageAttachments',
        'evaluationWindow',
        'savedBatch'
      ])
        expect(wire).not.toContain(excluded)
      expect(Buffer.byteLength(wire)).toBeLessThanOrEqual(
        AI_CONVERSATION_HISTORY_MAXIMUM_BYTES
      )
    } finally {
      await controller.dispose()
      unregisterFeature(FeatureNames.AI_AGENT)
      await runtime.dispose()
      transport.dispose()
      if (!hadWindow) vi.unstubAllGlobals()
    }
  })

  it('authors, saves, discovers and reuses a real preparation recipe across provider requests', async () => {
    const entries = new Map<string, AiToolStoreEntry>()
    let version = 0
    vi.mocked(toolStorage.createLocalToolStore).mockImplementation(
      async () => ({
        read: async (key) => entries.get(key),
        list: async () => [...entries.values()],
        write: async (value) => {
          if (entries.get(value.key)?.version !== value.expectedVersion)
            throw new Error('Conflict')
          const entry = {
            key: value.key,
            version: String(++version),
            record: structuredClone(value.record)
          }
          entries.set(value.key, entry)
          return structuredClone(entry)
        },
        close: vi.fn()
      })
    )
    const providerInput = {
      ...input,
      actions: [
        {
          name: AiActionNames.APPLY_PREPARED_DESIGN,
          description: 'Apply prepared design',
          inputSchema: {}
        }
      ]
    }
    const literal = (value: unknown) => ({ kind: 'literal', value })
    const proposal = {
      format: 1,
      name: 'prepare-part',
      revision: 1,
      description: 'Prepare a fresh editable part.',
      inputSchema: { type: 'number', minimum: 1, maximum: 100 },
      outputSchema: toolRequestReference,
      steps: [
        {
          id: 'prepare',
          tool: 'design_preparation.prepare_design',
          revision: 2,
          input: {
            kind: 'object',
            fields: {
              draft: {
                kind: 'object',
                fields: {
                  type: literal('frame'),
                  name: literal('Part'),
                  width: { kind: 'input', path: '' },
                  height: literal(20),
                  children: literal([
                    {
                      type: 'rect',
                      name: 'Surface',
                      key: 'surface',
                      width: 1,
                      height: 1
                    }
                  ])
                }
              }
            }
          }
        }
      ],
      output: { kind: 'step', step: 'prepare', path: '/artifactId' }
    }
    const run = async (width: number, submit: boolean) => {
      const recordOffset = retainedRecords.length
      const projection = createAiActivityProjection()
      const activity: {
        id: string
        parent?: string
        status: string
        message?: string
        tool: string
        label: string
        phase?: string
      }[] = []
      let streamController:
        ReadableStreamDefaultController<Uint8Array> | undefined
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          streamController = controller
        }
      })
      const deliver = (value: unknown) => {
        if (!streamController) throw new Error('Missing transport stream')
        streamController.enqueue(
          new TextEncoder().encode(JSON.stringify(value) + '\n')
        )
      }
      const transport = createServerActionBatchProvider({
        fetch: async () =>
          new Response(stream, {
            headers: { 'content-type': 'application/x-ndjson' }
          })
      })
      const received = transport.requestActionBatch(providerInput, {
        signal: new AbortController().signal,
        onProgress: (event) => {
          projection.append({
            attempt: 1,
            phase: 'provider',
            summary: 'Owner activity',
            tool: event.tool,
            toolStatus: event.status,
            message: event.message,
            activity: event.activity
          })
          if (event.activity)
            activity.push({
              id: event.activity.callId,
              parent: event.activity.parentCallId,
              status: event.status,
              tool: event.tool,
              label: projection.result().current.label,
              phase: event.activity.phase,
              message: projection.result().current.message
            })
        }
      })
      const server = fakeServer({ hold: true, manualToolReplies: true })
      const request = requestLocalAiActionBatch(providerInput, {
        model: 'selected-model',
        executable: 'codex',
        executeBatch: async () => ({ actionResults: [], context: {} }),
        onProgress: (event) => deliver({ type: 'activity', ...event })
      })
      await untilTurn(server.packets)
      let id = 100
      const call = async (tool: string, args: unknown, success = true) => {
        const current = ++id
        server.send({
          id: current,
          method: 'item/tool/call',
          params: {
            threadId: 'thread-1',
            turnId: 'turn-1',
            callId: `native-${current}`,
            tool,
            arguments: args
          }
        })
        await vi.waitFor(() =>
          expect(server.packets.some((packet) => packet.id === current)).toBe(
            true
          )
        )
        const packet = server.packets.find(
          (packet) => packet.id === current
        ) as unknown as {
          result: { success: boolean; contentItems: { text: string }[] }
        }
        const value = JSON.parse(packet.result.contentItems[0].text)
        expect(packet.result.success, JSON.stringify(value)).toBe(success)
        return value
      }
      try {
        if (submit) {
          const contract = await call('describe_design_apis', {
            names: [
              'design_preparation.prepare_design',
              'tool_library.submit_tool'
            ]
          })
          expect(contract.tools).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                name: 'submit_tool',
                composition: 'control-plane'
              }),
              expect.objectContaining({
                name: 'prepare_design',
                registeredName: proposal.steps[0].tool,
                revision: proposal.steps[0].revision,
                composition: 'allowed'
              })
            ])
          )
          const rejected = await call(
            'submit_tool',
            {
              submissionId: 'invalid',
              proposal: {
                ...proposal,
                steps: [{ ...proposal.steps[0], revision: 999 }]
              }
            },
            false
          )
          expect(rejected).toMatchObject({
            ok: false,
            code: 'admission',
            toolOutcome: { settlement: 'not-started' }
          })
          expect(rejected.issues.length).toBeGreaterThan(0)
          expect(
            (
              retainedRecords.slice(recordOffset) as {
                evidence?: { tool?: string }
              }[]
            ).some(
              (record) =>
                record.evidence?.tool === 'design_preparation.prepare_design'
            )
          ).toBe(false)
        }
        if (submit)
          expect(
            await call('submit_tool', { submissionId: 'prepare', proposal })
          ).toMatchObject({ ok: true })
        const found = await call('describe_design_apis', {
          names: ['prepare-part', 'design_preparation.prepare_design']
        })
        expect(found.tools).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'prepare-part',
              execution: expect.objectContaining({
                kind: 'registered-tool',
                tool: 'invoke_tool',
                arguments: { name: 'prepare-part', revision: 1 }
              })
            }),
            expect.objectContaining({
              name: 'prepare_design',
              registeredName: 'design_preparation.prepare_design'
            })
          ])
        )
        if (submit) {
          expect(
            found.tools.find(
              (tool: { name: string }) => tool.name === 'prepare_design'
            ).definition
          ).toMatchObject({ availableInResponse: true })
          const restored = await call('describe_design_apis', {
            names: ['design_preparation.prepare_design'],
            refresh: true,
            refreshReason: 'context-loss'
          })
          expect(restored.tools).toHaveLength(1)
          expect(restored.tools[0]).toMatchObject({
            composition: 'allowed',
            definition: { availableInResponse: true, coverage: 'full' }
          })
        }
        const result = await call('invoke_tool', {
          name: 'prepare-part',
          revision: 1,
          input: width,
          message: 'Prepare the editable facade panel'
        })
        expect(result).toMatchObject({
          execution: { status: 'success' },
          storage: { status: 'saved' }
        })
        expect(
          activity.some(
            (event) =>
              event.parent &&
              event.tool === 'save_tool' &&
              event.status === 'running' &&
              event.phase === 'executing' &&
              event.label === 'Running the selected operation'
          )
        ).toBe(true)
        const started = new Set<string>()
        for (const event of activity) {
          if (event.status === 'running') started.add(event.id)
          else if (event.parent)
            expect(started.has(event.id), JSON.stringify(event)).toBe(true)
          if (event.parent && event.status === 'running')
            expect(event.message).toBe('Prepare the editable facade panel')
        }
        expect(projection.result().current).toEqual({
          label: 'Completed operation',
          message: 'Prepare the editable facade panel'
        })
        const target = await call('retain_design_targets', {
          targets: [{ artifactId: result.execution.value, keys: ['surface'] }]
        })
        expect(target).toMatchObject({ targets: [{ count: 1 }] })
        return result.execution.value
      } finally {
        server.finish()
        const batch = await request
        deliver({ type: 'result', batch })
        streamController?.close()
        await received
        transport.dispose()
        const recorded = parseExecutionRecord(
          retainedRecords
            .slice(recordOffset)
            .map((record) => JSON.stringify(record))
            .join('\n')
        )
        expect(recorded.complete, JSON.stringify(recorded.issues)).toBe(true)
        expect(recorded.timing.unattributedMs).toBe(0)
      }
    }
    const first = await run(17, true)
    const second = await run(23, false)
    expect(first).not.toBe(second)
    const records = retainedRecords as {
      stage?: string
      evidence?: Record<string, unknown>
    }[]
    expect(
      records.some(
        (record) =>
          record.stage === 'tool_started' &&
          record.evidence?.parentCallId &&
          record.evidence?.tool === 'design_preparation.prepare_design' &&
          record.evidence?.revision === 2 &&
          JSON.stringify(record.evidence?.recipeStep) ===
            JSON.stringify({ name: 'prepare-part', revision: 1, id: 'prepare' })
      )
    ).toBe(true)
    expect(
      records
        .filter(
          (record) =>
            record.stage === 'tool_started' &&
            record.evidence?.tool === 'design_preparation.prepare_design'
        )
        .map((record) => record.evidence?.arguments)
    ).toEqual([
      expect.objectContaining({
        draft: expect.objectContaining({ width: 17 })
      }),
      expect.objectContaining({ draft: expect.objectContaining({ width: 23 }) })
    ])
  })
  it('does not open a library for connection checks or isolated assessments', async () => {
    fakeServer()
    await checkLocalAiProvider({ model: 'selected-model', executable: 'codex' })
    fakeServer({ output: JSON.stringify({ overall: 'unknown', findings: [] }) })
    await requestLocalAiAssessment(
      { sourceRequestId: 'prior', criteria: [] },
      { model: 'selected-model', executable: 'codex' }
    )
    expect(toolStorage.createLocalToolStore).not.toHaveBeenCalled()
  })
  it('closes the library after a provider startup failure', async () => {
    spawn.mockImplementationOnce(() => {
      throw new Error('Cannot spawn')
    })
    await expect(
      requestLocalAiActionBatch(input, {
        model: 'selected-model',
        executable: 'codex'
      })
    ).rejects.toMatchObject({ code: 'AI_MODEL_BACKEND_INVALID_CONFIGURATION' })
    const store = await vi.mocked(toolStorage.createLocalToolStore).mock
      .results[0].value
    expect(store.close).toHaveBeenCalledOnce()
  })
  it.each(['tool-host', 'tool-store'] as const)(
    'preserves product success and records failed %s teardown',
    async (component) => {
      fakeServer({ output: JSON.stringify(batch) })
      const store = {
        read: async () => undefined,
        list: async () => [],
        write: async () => {
          throw new Error('No save expected')
        },
        close: vi.fn(() => {
          if (component === 'tool-store')
            throw new Error('Teardown unavailable')
        })
      }
      vi.mocked(toolStorage.createLocalToolStore).mockResolvedValueOnce(store)
      if (component === 'tool-host') {
        const create = toolHosts.createLocalToolHost
        vi.spyOn(toolHosts, 'createLocalToolHost').mockImplementationOnce(
          (options) => {
            const host = create(options)
            const dispose = host.dispose
            host.dispose = async () => {
              await dispose()
              throw new Error('Teardown unavailable')
            }
            return host
          }
        )
      }
      await expect(
        requestLocalAiActionBatch(input, {
          model: 'selected-model',
          executable: 'codex'
        })
      ).resolves.toEqual(batch)
      expect(store.close).toHaveBeenCalledOnce()
      expect(retainedRecords).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            stage: 'host_observation',
            evidence: expect.objectContaining({
              phase: 'cleanup',
              executor: component,
              status: 'failed',
              code: 'TOOL_CLEANUP_FAILED',
              error: '[free text omitted]'
            })
          }),
          expect.objectContaining({
            stage: 'settlement',
            evidence: expect.objectContaining({ outcome: 'completed' })
          })
        ])
      )
    }
  )

  it('preserves the classified provider failure when store cleanup also fails', async () => {
    fakeServer({ output: 'invalid JSON' })
    vi.mocked(toolStorage.createLocalToolStore).mockResolvedValueOnce({
      read: async () => undefined,
      list: async () => [],
      write: async () => {
        throw new Error('No save expected')
      },
      close: vi.fn(() => {
        throw new Error('Close failed')
      })
    })
    await expect(
      requestLocalAiActionBatch(input, {
        model: 'selected-model',
        executable: 'codex'
      })
    ).rejects.toMatchObject({ code: 'AI_MODEL_BACKEND_INVALID_RESPONSE' })
    expect(retainedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stage: 'host_observation',
          evidence: expect.objectContaining({
            executor: 'tool-store',
            status: 'failed',
            code: 'TOOL_CLEANUP_FAILED',
            error: '[free text omitted]'
          })
        })
      ])
    )
  })

  it('advertises reusable tool controls through the drawing provider', async () => {
    const server = fakeServer()
    await requestLocalAiActionBatch(input, {
      model: 'selected-model',
      executable: 'codex'
    })
    const thread = server.packets.find(
      ({ method }) => method === 'thread/start'
    )?.params
    expect(nativeToolDefinitions(thread).map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        'submit_tool',
        'invoke_tool',
        'save_tool',
        'manage_tool'
      ])
    )
    expect(toolStorage.createLocalToolStore).toHaveBeenCalledTimes(1)
    const result = await vi.mocked(toolStorage.createLocalToolStore).mock
      .results[0].value
    expect(result.close).toHaveBeenCalledTimes(1)
  })
  it('keeps canonical basic recipe dependencies out of native function exposure', async () => {
    const server = fakeServer()
    const action = basicApiContracts.find(
      (item) => item.name === 'api_element_createElements'
    )
    if (!action) throw new Error('Missing canonical creation contract')
    await requestLocalAiActionBatch(
      {
        ...input,
        actions: [
          createAiToolContract({
            ...action,
            ...toolSemantics(basicApiResultSchema(action), 'mutation', [
              'document'
            ]),
            composition: 'allowed'
          })
        ]
      },
      {
        model: 'selected-model',
        executable: 'codex',
        executeBatch: vi.fn(async (value) => ({
          context: null,
          actionResults: []
        }))
      }
    )
    const thread = server.packets.find(
      ({ method }) => method === 'thread/start'
    )?.params
    const names = nativeToolDefinitions(thread).map(({ name }) => name)
    expect(names).toContain('execute_design_batch')
    expect(names).toContain('invoke_tool')
    expect(names).not.toContain(action.name)
  })
  it('keeps native drawing usable when library storage cannot open', async () => {
    vi.mocked(toolStorage.createLocalToolStore).mockRejectedValueOnce(
      new Error('Local directory unavailable')
    )
    const server = fakeServer()
    expect(
      await requestLocalAiActionBatch(input, {
        model: 'selected-model',
        executable: 'codex'
      })
    ).toEqual(batch)
    expect(server.packets.some(({ method }) => method === 'turn/start')).toBe(
      true
    )
    expect(retainedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stage: 'action_failed',
          evidence: expect.objectContaining({ tool: 'tool-library-load' })
        })
      ])
    )
  })

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
    const stdout = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const stderr = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
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
    expect(stdout).not.toHaveBeenCalled()
    expect(stderr.mock.calls.map(([line]) => JSON.parse(line))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event: 'ai_request_trace' }),
        expect.objectContaining({ event: 'ai_request_usage' })
      ])
    )
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

  it.skipIf(!process.env.LOCAL_AI_PROTOCOL_EXECUTABLE)(
    'checks installed native registration without inference',
    async () => {
      const native =
        await vi.importActual<typeof import('node:child_process')>(
          'node:child_process'
        )
      const children: import('node:child_process').ChildProcess[] = []
      const requests: Packet[] = []
      const notifications: string[] = []
      let nativeIsolation: unknown
      spawn.mockImplementation((...args: Parameters<typeof native.spawn>) => {
        const child = native.spawn(
          args[0],
          [
            '-c',
            'features.hooks=true',
            '-c',
            'features.multi_agent_v2=true',
            '-c',
            'notify=["missing-notification-probe"]',
            ...(args[1] as string[]),
            '-c',
            'mcp_servers.startup_probe.command="missing-startup-probe"',
            '-c',
            'mcp_servers.startup_probe.enabled=true'
          ],
          args[2]
        )
        if (!child.stdin || !child.stdout)
          throw new Error('Missing native protocol pipes')
        const stdin = child.stdin
        const stdout = child.stdout
        const write = stdin.write.bind(stdin)
        stdin.write = ((chunk: string, ...rest: unknown[]) => {
          requests.push(JSON.parse(String(chunk)))
          return write(chunk, ...(rest as []))
        }) as typeof stdin.write
        let buffer = ''
        stdout.on('data', (chunk: Buffer) => {
          buffer += chunk.toString()
          let index: number
          while ((index = buffer.indexOf('\n')) >= 0) {
            const packet = JSON.parse(buffer.slice(0, index))
            buffer = buffer.slice(index + 1)
            const request = requests.find(({ id }) => id === packet.id)
            if (packet.id !== undefined && request?.method === 'config/read') {
              const config = packet.result?.config
              nativeIsolation = {
                hooksDisabled: config?.features?.hooks === false,
                agentsDisabled: config?.features?.multi_agent === false,
                agentV2Disabled: config?.features?.multi_agent_v2 === false,
                notifyDisabled:
                  Array.isArray(config?.notify) && config.notify.length === 0
              }
            }
            if (packet.method === 'mcpServer/startupStatus/updated')
              notifications.push(packet.params.name)
          }
        })
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
        expect(requests.some(({ method }) => method === 'turn/start')).toBe(
          false
        )
        const config = requests.find(({ method }) => method === 'thread/start')
          ?.params.config as Record<string, unknown>
        expect(config.mcp_servers).toMatchObject({
          startup_probe: { enabled: false }
        })
        expect(
          Object.values(
            config.mcp_servers as Record<string, { enabled: boolean }>
          ).every(({ enabled }) => enabled === false)
        ).toBe(true)
        expect(nativeIsolation).toEqual({
          hooksDisabled: true,
          agentsDisabled: true,
          agentV2Disabled: true,
          notifyDisabled: true
        })
        expect(notifications).toEqual([])
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

  it('keeps canonical host output and lifecycle metadata out of model turn text', async () => {
    const server = fakeServer()
    const { toolSemantics } = await import('../../src/ai/tool-contract')
    const action = {
      name: 'report_outcome',
      description: 'Report',
      inputSchema: { type: 'object' },
      ...toolSemantics(
        { type: 'object', properties: { hostOnlyReceipt: { type: 'string' } } },
        'prepare',
        ['request']
      )
    }
    await requestConfiguredAiActionBatch(
      { ...input, actions: [action] },
      {
        environment,
        executeBatch: async () => ({ actionResults: [], context: {} })
      }
    )
    const items = server.packets.find(({ method }) => method === 'turn/start')
      ?.params.input as { text: string }[]
    expect(JSON.parse(items[0].text).input.actions).toEqual([
      {
        name: action.name,
        description: action.description,
        inputSchema: action.inputSchema
      }
    ])
    expect(items[0].text).not.toContain('hostOnlyReceipt')
  })

  it('passes the original multilingual brief unchanged without a translation turn', async () => {
    const server = fakeServer()
    const intent =
      '畫「很醜」的塔頂，只要 2 層；1 cm = 1 px。Keep the left ornament; no background.'
    await requestConfiguredAiActionBatch({ ...input, intent }, { environment })
    const turns = server.packets.filter(({ method }) => method === 'turn/start')
    expect(turns).toHaveLength(1)
    const items = turns[0].params.input as { text: string }[]
    expect(JSON.parse(items[0].text).input.intent).toBe(intent)
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
        expect(definition?.inputSchema).toHaveProperty(
          'examples',
          expect.arrayContaining([example])
        )
    }
    const instructions = thread?.developerInstructions as string
    const { localToolResultExample, localToolResultRecoveryExample } =
      await import('../local-operation-tools')
    expect(instructions).toContain(localToolResultExample)
    expect(instructions).toContain(localToolResultRecoveryExample)
    expect(instructions).toContain('fresh resultKey')
    expect(instructions).toContain('without calling the tool again')
    const base = String(thread?.baseInstructions)
    process.stdout.write(
      JSON.stringify({
        measurement: 'composition-startup',
        bytes: Buffer.byteLength(base),
        sha256: createHash('sha256').update(base).digest('hex')
      }) + '\n'
    )
    expect(Buffer.byteLength(base)).toBeLessThanOrEqual(30327)
    for (const example of designPreparationExamples)
      expect(base).not.toContain(JSON.stringify(example))
    const scopeLine = base
      .split('\n')
      .find((line) => line.startsWith('Main tool scope: '))
    expect(scopeLine).toBeDefined()
    if (!scopeLine) throw new Error('Missing startup scope guidance')
    const scope = JSON.parse(scopeLine.slice('Main tool scope: '.length))
    expect(scope.inputScopes.operations).toEqual(['draft', 'repair', 'parts'])
    expect(scope.operationUsage.draft).toContain('10000 expanded objects')
    expect(scope.operationUsage.parts).toContain('each part artifact fits')
    expect(scope.example.arguments.inputScope.operation).toBe('draft')
    expect(scope.example.arguments.inputScope.nodeTypes).toEqual(['pattern'])
    const { createLocalDesignWorkflow } =
      await import('../local-design-workflow')
    const { createLocalOperationTools } =
      await import('../local-operation-tools')
    const designs = designTools.createLocalDesignTools(actions)
    const operations = createLocalOperationTools(actions, designs, vi.fn(), {
      getNativeTools: () =>
        workflow.definitions.map((definition) => ({
          ...definition,
          namespace: 'design_workflow'
        }))
    })
    const workflow = createLocalDesignWorkflow(designs, operations)
    const canonical = workflow.definitions[0].inputSchema as {
      'x-design-input-scope': { selection: string }
    }
    const selection = canonical['x-design-input-scope'].selection
    expect(scope.inputScopes.selection).toBe(selection)
    expect(selection).toContain('component contents')
    expect(selection).toContain('Component order:')
    expect(selection).toContain('Layer order: sibling patterns')
    expect(Buffer.byteLength(selection)).toBeLessThanOrEqual(2363)
    expect(selection).toContain('outer repetition')
    expect(selection).toContain('pattern with members')
    expect(selection).toContain('no extra query is needed')
    expect(selection).toContain('define members once')
    expect(selection).toContain('Independent world-space planar faces')
    expect(selection).toContain('omit plan without rereading')
    expect(base.split(selection)).toHaveLength(2)
    expect(scope.inputScopes).not.toHaveProperty('properties')

    const selected = JSON.parse(
      await operations.call(
        scope.example.tool,
        scope.example.arguments,
        new AbortController().signal
      )
    )
    expect(selected.tools[0].usageGuide).toBeDefined()
    expect(selected.tools[0].execution.tool).toBe('prepare_and_apply_design')

    for (const name of [
      'mechanicalSelection',
      'verify_design_checks',
      'repair_design_checks'
    ])
      expect(base).toContain(name)
    expect(base).toContain('returned requestId/checks')
    expect(instructions).not.toContain(
      'Discover the relevant tools before composing calls'
    )
    expect(instructions).toContain('Known current contracts need no lookup')
    // The delivered provider instruction must not override scoped acquisition
    // with a second full-schema policy for a single unknown field.
    expect(instructions).not.toContain(
      'When nested fields appear as unknown or a constraint is unclear'
    )
    expect(base).toContain('For missing fields recover those paths')
    expect(base).toContain('refresh preserves that scope')
    expect(base).toContain(
      'full input/output and lifecycle contracts remain required for new recipe composition'
    )
    expect(instructions).toContain('Runtime owns admitted finite iteration')
    expect(instructions).toContain(
      'input.actions lists final-response actions, not the complete capability catalog'
    )
    expect(instructions).not.toContain('Available App tool namespaces:')
    expect(instructions).toContain('Discover tools by operation purpose')
    expect(String(thread?.baseInstructions)).toContain(
      'Use native web research'
    )
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
          imageAttachments: [await rasterAttachment()]
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
          imageAttachments: [await rasterAttachment()]
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
              imageAttachments: [await rasterAttachment()]
            }
          },
          {
            environment,
            onProgress: (event) => {
              if (
                event.tool === AiImageToolIds.ANALYZE_VECTOR_COMPONENTS &&
                (event.status === 'completed' ||
                  event.activity?.phase === 'admission')
              )
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

  it('keeps initial instructions bounded when unrelated deferred tools grow', async () => {
    const baseline = fakeServer()
    await requestConfiguredAiActionBatch(input, { environment })
    const before = baseline.packets.find(
      ({ method }) => method === 'thread/start'
    )?.params
    const create = referenceTools.createLocalReferenceTools
    vi.spyOn(referenceTools, 'createLocalReferenceTools').mockImplementation(
      (...args) => {
        const owner = create(...args)
        return {
          ...owner,
          definitions: [
            ...owner.definitions,
            ...Array.from({ length: 1000 }, (_, index) => ({
              ...owner.definitions[0],
              // Synthetic registry entries are never invoked through this owner.
              name: `unrelated_${index}` as (typeof owner.definitions)[number]['name'],
              description: 'Unrelated capability'
            }))
          ]
        }
      }
    )
    const expanded = fakeServer()
    await requestConfiguredAiActionBatch(input, { environment })
    const after = expanded.packets.find(
      ({ method }) => method === 'thread/start'
    )?.params
    expect(after?.developerInstructions).toEqual(before?.developerInstructions)
    expect(after?.baseInstructions).toEqual(before?.baseInstructions)
    expect(nativeToolDefinitions(after).length).toBe(
      nativeToolDefinitions(before).length + 1000
    )
    expect(
      nativeToolDefinitions(after).every((tool) => tool.deferLoading)
    ).toBe(true)
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
    expect(thread?.developerInstructions).not.toContain(
      'Available App tool namespaces:'
    )
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
      web_search: 'live'
    })
    expect(JSON.stringify(server.packets)).not.toContain('private@example.test')
    expect(JSON.stringify(result)).not.toContain('private@example.test')
    expect(server.child.kill).toHaveBeenCalledExactlyOnceWith('SIGKILL')
  })

  it('isolates inherited lifecycle commands and all agent variants before launch and thread creation', async () => {
    const server = fakeServer()
    await requestConfiguredAiActionBatch(input, { environment })
    const args = spawn.mock.calls[0][1] as string[]
    const launchConfig = Object.fromEntries(
      args.flatMap((arg, index) => {
        if (arg !== '-c') return []
        const entry = args[index + 1]
        const split = entry.indexOf('=')
        return [[entry.slice(0, split), JSON.parse(entry.slice(split + 1))]]
      })
    )
    const threadConfig = server.packets.find(
      ({ method }) => method === 'thread/start'
    )?.params.config
    const isolation = {
      'features.hooks': false,
      'features.multi_agent': false,
      'features.multi_agent_v2': false,
      'features.plugins': false,
      'features.apps': false,
      'features.shell_snapshot': false,
      notify: []
    }
    expect(launchConfig).toMatchObject(isolation)
    expect(threadConfig).toMatchObject(isolation)
  })

  it('disables every inherited MCP before thread startup without writing user config', async () => {
    const server = fakeServer({
      effectiveConfig: {
        config: {
          mcp_servers: {
            'personal.viewer': {
              command: 'secret-command',
              enabled: true,
              tool_timeout_sec: null
            },
            addedLater: { url: 'https://private.example/token' },
            alreadyDisabled: { enabled: false }
          }
        }
      }
    })
    await requestConfiguredAiActionBatch(input, { environment })
    const methods = server.packets.map(({ method }) => method)
    expect(methods.filter((method) => method === 'config/read')).toHaveLength(1)
    expect(methods.indexOf('config/read')).toBeLessThan(
      methods.indexOf('thread/start')
    )
    expect(methods).not.toContain('config/value/write')
    const config = server.packets.find(
      ({ method }) => method === 'thread/start'
    )?.params.config
    expect(config).toMatchObject({
      mcp_servers: {
        'personal.viewer': { command: 'secret-command', enabled: false },
        addedLater: { url: 'https://private.example/token', enabled: false },
        alreadyDisabled: { enabled: false }
      }
    })
    expect(JSON.stringify(config)).not.toContain('tool_timeout_sec')
    expect(JSON.stringify(retainedRecords)).not.toContain('private.example')
  })

  it.each([{}, { config: null }, { config: { mcp_servers: [] } }])(
    'rejects unreadable MCP configuration before inference: %j',
    async (effectiveConfig) => {
      const server = fakeServer({ effectiveConfig })
      await expect(
        requestConfiguredAiActionBatch(input, { environment })
      ).rejects.toMatchObject({
        code: 'AI_MODEL_BACKEND_INVALID_CONFIGURATION'
      })
      expect(server.packets.some(({ method }) => method === 'turn/start')).toBe(
        false
      )
    }
  )

  it('retains process and thread startup diagnostics without copying private text', async () => {
    const server = fakeServer({
      hold: true,
      onRequest: ({ method }) => {
        if (method === 'initialize')
          server.send({
            method: 'warning',
            params: {
              message:
                'Invalid configuration token=private-secret private@example.test'
            }
          })
      }
    })
    const completion = requestConfiguredAiActionBatch(input, { environment })
    await untilTurn(server.packets)
    server.notify('mcpServer/startupStatus/updated', {
      name: 'personal.viewer',
      status: 'failed',
      failureReason: null,
      error:
        'Connection timed out at https://private.example/?key=private-secret'
    })
    server.notify('mcpServer/startupStatus/updated', {
      name: 'unrelated',
      status: 'ready',
      threadId: 'other-thread'
    })
    server.finish()
    await completion
    expect(retainedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stage: 'provider_notification',
          evidence: expect.objectContaining({
            method: 'warning',
            diagnostic: { reason: 'configuration', detailOmitted: true }
          })
        }),
        expect.objectContaining({
          stage: 'provider_notification',
          evidence: expect.objectContaining({
            method: 'mcpServer/startupStatus/updated',
            diagnostic: {
              server: 'personal.viewer',
              status: 'failed',
              reason: 'timeout',
              detailOmitted: true
            }
          })
        })
      ])
    )
    const evidence = JSON.stringify(retainedRecords)
    for (const secret of [
      'private-secret',
      'private@example.test',
      'private.example',
      'unrelated'
    ])
      expect(evidence).not.toContain(secret)
  })

  it('records native retry reasons while allowing successful recovery without replay', async () => {
    const server = fakeServer({ hold: true })
    const promise = requestConfiguredAiActionBatch(input, { environment })
    await untilTurn(server.packets)
    server.notify('error', {
      willRetry: true,
      error: {
        message: 'private endpoint https://private.example?token=secret',
        additionalDetails: 'Bearer private-credential',
        codexErrorInfo: {
          responseStreamConnectionFailed: { httpStatusCode: 503 }
        }
      }
    })
    server.notify('error', {
      threadId: 'unrelated',
      willRetry: true,
      error: { codexErrorInfo: 'unauthorized', message: 'private-credential' }
    })
    server.finish()
    await expect(promise).resolves.toEqual(batch)
    expect(
      server.packets.filter(({ method }) => method === 'turn/start')
    ).toHaveLength(1)
    expect(retainedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stage: 'provider_notification',
          evidence: expect.objectContaining({
            method: 'error',
            nativeThreadId: 'thread-1',
            nativeTurnId: 'turn-1',
            diagnostic: {
              reason: 'responseStreamConnectionFailed',
              httpStatusCode: 503,
              willRetry: true,
              detailOmitted: true
            }
          })
        })
      ])
    )
    for (const secret of [
      'private.example',
      'private-credential',
      'unrelated',
      'unauthorized'
    ])
      expect(JSON.stringify(retainedRecords)).not.toContain(secret)
  })

  it.each(['usageLimitExceeded', 'unknown-private-error-kind'])(
    'records terminal native error %s without private details',
    async (kind) => {
      const server = fakeServer({ hold: true })
      const promise = requestConfiguredAiActionBatch(input, { environment })
      const checked = expect(promise).rejects.toMatchObject({
        code: 'AI_MODEL_BACKEND_TRANSPORT_FAILED'
      })
      await untilTurn(server.packets)
      server.notify('turn/completed', {
        turn: {
          id: 'turn-1',
          status: 'failed',
          error: { codexErrorInfo: kind, message: 'private-credential' }
        }
      })
      await checked
      expect(retainedRecords).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            stage: 'provider_notification',
            evidence: expect.objectContaining({
              method: 'turn/completed',
              diagnostic: {
                reason: kind === 'usageLimitExceeded' ? kind : 'unclassified',
                detailOmitted: true
              }
            })
          })
        ])
      )
      expect(JSON.stringify(retainedRecords)).not.toContain('private-')
    }
  )

  it.each([
    'initialize',
    'account/read',
    'config/read',
    'thread/start',
    'turn/start'
  ])('records RPC error status at %s and closes its child', async (method) => {
    const server = fakeServer({
      responseError: {
        method,
        error: {
          code: -32602,
          message: 'private-credential',
          data: { token: 'private-credential' }
        }
      }
    })
    await expect(
      requestConfiguredAiActionBatch(input, { environment })
    ).rejects.toMatchObject({
      code: 'AI_MODEL_BACKEND_TRANSPORT_FAILED'
    })
    expect(retainedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stage: 'provider_request_failed',
          evidence: expect.objectContaining({
            method,
            diagnostic: {
              reason: 'rpcError',
              rpcCode: -32602,
              detailOmitted: true
            }
          })
        })
      ])
    )
    expect(server.child.kill).toHaveBeenCalledOnce()
    expect(JSON.stringify(retainedRecords)).not.toContain('private-credential')
  })

  it.each([
    'initialize',
    'account/read',
    'config/read',
    'thread/start',
    'turn/start'
  ])('cancels a stalled %s without later startup work', async (method) => {
    const server = fakeServer({ holdMethod: method })
    const controller = new AbortController()
    const promise = requestConfiguredAiActionBatch(input, {
      environment,
      signal: controller.signal
    })
    const checked = expect(promise).rejects.toMatchObject({
      code: 'AI_MODEL_BACKEND_ABORTED'
    })
    await vi.waitFor(() =>
      expect(server.packets.some((packet) => packet.method === method)).toBe(
        true
      )
    )
    controller.abort()
    await checked
    expect(server.child.kill).toHaveBeenCalledOnce()
    expect(server.packets.at(-1)?.method).toBe(method)
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

  it.each([
    ['config/read', 'end'],
    ['config/read', 'error'],
    ['config/read', 'close'],
    ['turn/start', 'end'],
    ['turn/start', 'error'],
    ['turn/start', 'close'],
    ['active-turn', 'end'],
    ['active-turn', 'error'],
    ['active-turn', 'close']
  ] as const)(
    'settles required stdout %s/%s without waiting for process exit',
    async (method, event) => {
      const server = fakeServer({
        holdMethod: method === 'active-turn' ? undefined : method,
        hold: true
      })
      const controller = new AbortController()
      const result = requestConfiguredAiActionBatch(input, {
        environment,
        signal: controller.signal
      }).then(
        (value) => ({ value }),
        (error: Error & { code: string }) => ({ code: error.code })
      )
      try {
        await vi.waitFor(() =>
          expect(
            server.packets.some(
              (packet) =>
                packet.method ===
                (method === 'active-turn' ? 'turn/start' : method)
            )
          ).toBe(true)
        )
        expect(() =>
          server.child.stdout.emit(
            event,
            new Error('private-stream-credential')
          )
        ).not.toThrow()
        await new Promise((resolve) => setImmediate(resolve))
        expect(server.child.kill).toHaveBeenCalledOnce()
        expect(await result).toEqual({
          code: 'AI_MODEL_BACKEND_TRANSPORT_FAILED'
        })
        expect(retainedRecords).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              stage: 'provider_transport_event',
              evidence: expect.objectContaining({
                channel: 'stdout',
                status: event,
                terminal: true
              })
            })
          ])
        )
        expect(JSON.stringify(retainedRecords)).not.toContain(
          'private-stream-credential'
        )
      } finally {
        controller.abort()
        await result
      }
    }
  )

  it.each(['running', 'completed', 'research'])(
    'keeps a throwing %s progress observer outside execution settlement',
    async (phase) => {
      const server = fakeServer({ toolCall: true, research: true })
      const onProgress = vi.fn((event) => {
        if (phase === 'research' || event.status === phase)
          throw new Error('private observer exception')
      })
      await expect(
        requestConfiguredAiActionBatch(
          {
            ...input,
            metadata: { imageAttachments: [await rasterAttachment()] }
          },
          { environment, onProgress }
        )
      ).resolves.toEqual(batch)
      expect(convertVTracerBuffer).toHaveBeenCalledOnce()
      expect(server.packets.filter((packet) => packet.id === 99)).toHaveLength(
        1
      )
      expect(server.child.kill).toHaveBeenCalledOnce()
      expect(retainedRecords).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            stage: 'provider_notification',
            evidence: expect.objectContaining({
              method: 'app/progressObserverFailed',
              diagnostic: { reason: 'observerError', detailOmitted: true }
            })
          })
        ])
      )
      expect(JSON.stringify(retainedRecords)).not.toContain(
        'private observer exception'
      )
    }
  )

  it.each(['matching-turn', 'wrong-turn', 'missing-ack', 'malformed-ack'])(
    'validates %s admission before a same-chunk first tool can execute',
    async (mode) => {
      const server = fakeServer({
        holdMethod: 'turn/start',
        onRequest: (packet) => {
          if (packet.method !== 'turn/start') return
          const frames: unknown[] = []
          if (mode !== 'missing-ack')
            frames.push({
              id: packet.id,
              result:
                mode === 'malformed-ack'
                  ? { turn: {} }
                  : { turn: { id: 'turn-1' } }
            })
          frames.push({
            id: 99,
            method: 'item/tool/call',
            params: {
              threadId: 'thread-1',
              turnId: mode === 'wrong-turn' ? 'other-turn' : 'turn-1',
              namespace: 'image_analysis',
              callId: 'call-1',
              tool: 'vtracer',
              arguments: {
                attachmentIndex: 0,
                plan: {
                  strategy: 'preserve-vectors',
                  reason: 'Keep source geometry.'
                }
              }
            }
          })
          server.child.stdout.write(
            frames.map((frame) => JSON.stringify(frame)).join('\n') + '\n'
          )
        }
      })
      const controller = new AbortController()
      const result = requestConfiguredAiActionBatch(
        {
          ...input,
          metadata: { imageAttachments: [await rasterAttachment()] }
        },
        { environment, signal: controller.signal }
      ).then(
        (value) => ({ value }),
        (error: Error & { code: string }) => ({ code: error.code })
      )
      try {
        await untilTurn(server.packets)
        if (mode === 'matching-turn') {
          expect(await result).toEqual({ value: batch })
          expect(convertVTracerBuffer).toHaveBeenCalledOnce()
          expect(
            server.packets.filter((packet) => packet.id === 99)
          ).toHaveLength(1)
        } else {
          await new Promise((resolve) => setImmediate(resolve))
          expect(server.child.kill).toHaveBeenCalledOnce()
          expect(await result).toEqual({
            code: 'AI_MODEL_BACKEND_INVALID_RESPONSE'
          })
          expect(convertVTracerBuffer).not.toHaveBeenCalled()
          expect(
            server.packets.filter((packet) => packet.id === 99)
          ).toHaveLength(0)
        }
      } finally {
        controller.abort()
        await result
      }
    }
  )

  it('accepts process close immediately after the admitted readiness response', async () => {
    const server = fakeServer({
      onRequest: (packet) => {
        if (packet.method === 'thread/start')
          queueMicrotask(() => server.child.emit('close', 0, null))
      }
    })
    await expect(
      checkLocalAiProvider({ executable: 'codex', model: 'selected-model' })
    ).resolves.toBeUndefined()
    expect(
      server.packets.some((packet) => packet.method === 'turn/start')
    ).toBe(false)
  })

  it.each(['finish', 'close', 'error'])(
    'settles required stdin %s during a pending request',
    async (event) => {
      const server = fakeServer({ holdMethod: 'turn/start' })
      const controller = new AbortController()
      const result = requestConfiguredAiActionBatch(input, {
        environment,
        signal: controller.signal
      }).then(
        (value) => ({ value }),
        (error: Error & { code: string }) => ({ code: error.code })
      )
      try {
        await untilTurn(server.packets)
        server.child.stdin.emit(event, new Error('private stdin exception'))
        await new Promise((resolve) => setImmediate(resolve))
        expect(server.child.kill).toHaveBeenCalledOnce()
        expect(await result).toEqual({
          code: 'AI_MODEL_BACKEND_TRANSPORT_FAILED'
        })
        expect(retainedRecords).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              stage: 'provider_transport_event',
              evidence: expect.objectContaining({
                channel: 'stdin',
                status: event,
                terminal: true
              })
            })
          ])
        )
        expect(JSON.stringify(retainedRecords)).not.toContain(
          'private stdin exception'
        )
      } finally {
        controller.abort()
        await result
      }
    }
  )

  it.each(['stdin-finish', 'stdin-close', 'stdin-error', 'process-close'])(
    'accepts %s immediately after the complete protocol',
    async (event) => {
      const server = fakeServer({ hold: true })
      const result = requestConfiguredAiActionBatch(input, { environment })
      const checked = expect(result).resolves.toEqual(batch)
      await untilTurn(server.packets)
      server.finish()
      if (event === 'process-close') server.child.emit('close', 0, null)
      else
        server.child.stdin.emit(
          event.slice(6),
          new Error('private stdin exception')
        )
      await checked
    }
  )

  it('keeps optional stderr read failure from crashing or cancelling a valid turn', async () => {
    const server = fakeServer({ hold: true })
    const controller = new AbortController()
    const result = requestConfiguredAiActionBatch(input, {
      environment,
      signal: controller.signal
    }).then(
      (value) => ({ value }),
      () => ({ failed: true })
    )
    try {
      await untilTurn(server.packets)
      expect(() =>
        server.child.stderr.emit(
          'error',
          new Error('private-stream-credential')
        )
      ).not.toThrow()
      expect(server.child.kill).not.toHaveBeenCalled()
      server.finish()
      expect(await result).toEqual({ value: batch })
      expect(retainedRecords).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            stage: 'provider_transport_event',
            evidence: expect.objectContaining({
              channel: 'stderr',
              status: 'error',
              terminal: false
            })
          })
        ])
      )
      expect(JSON.stringify(retainedRecords)).not.toContain(
        'private-stream-credential'
      )
    } finally {
      controller.abort()
      await result
    }
  })

  it.each(['end', 'close', 'error'])(
    'accepts stdout %s after the complete protocol while awaiting owned process close',
    async (event) => {
      const server = fakeServer({ hold: true, delayedClose: true })
      const result = requestConfiguredAiActionBatch(input, { environment })
      await untilTurn(server.packets)
      server.finish()
      server.child.stdout.emit(event, new Error('private-stream-credential'))
      server.child.stdout.emit('close')
      await vi.waitFor(() => expect(server.child.kill).toHaveBeenCalledOnce())
      server.child.emit('close')
      await expect(result).resolves.toEqual(batch)
    }
  )

  it('keeps a peer invocation alive when one protocol stream closes', async () => {
    const broken = fakeServer({ hold: true })
    const peer = fakeServer({ hold: true })
    const failed = requestConfiguredAiActionBatch(input, { environment }).catch(
      (error: Error & { code: string }) => error.code
    )
    const successful = requestConfiguredAiActionBatch(input, { environment })
    await Promise.all([untilTurn(broken.packets), untilTurn(peer.packets)])
    broken.child.stdout.emit('end')
    await expect(failed).resolves.toBe('AI_MODEL_BACKEND_TRANSPORT_FAILED')
    expect(peer.child.kill).not.toHaveBeenCalled()
    peer.finish()
    await expect(successful).resolves.toEqual(batch)
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
    toolName: 'execute_design_batch',
    toolArguments: {
      operations: [
        {
          name: 'set_element_visibility',
          arguments: { elementId: 'actual-id', visible: false }
        }
      ],
      message: 'Hiding the separate mark'
    }
  })
  spawn.mockReturnValue(child.child)
  const onProgress = vi.fn()
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
    { environment, executeBatch, onProgress }
  )
  expect(onProgress).toHaveBeenCalledWith({
    tool: 'execute_design_batch',
    status: 'running',
    message: 'Hiding the separate mark',
    activity: {
      kind: 'work',
      callId: 'call-1',
      sequence: expect.any(Number),
      phase: 'queued'
    }
  })
  expect(
    onProgress.mock.calls.some(
      ([event]) =>
        event.message === 'Checking remaining details' &&
        event.activity?.scope === 'request'
    )
  ).toBe(true)
  expect(
    child.packets.filter(({ method }) => method === 'turn/start')
  ).toHaveLength(1)
  expect(executeBatch).toHaveBeenCalledOnce()
  const response = child.packets.find(
    (packet) => 'result' in packet
  ) as unknown as { result: { contentItems: { text: string }[] } }
  expect(
    JSON.parse(response.result.contentItems[0].text).actionResults[0].result
      .appliedElementIds
  ).toEqual(['actual-id'])
})

it('correlates bounded diagnostic evidence with usage without logging credentials or image payloads', () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const usage = createAiExecutionProfiler(input, 'selected-model')
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
    const usage = createAiExecutionProfiler(input, 'selected-model')
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
      const usage = createAiExecutionProfiler(input, 'selected-model')
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
    const first = createAiExecutionProfiler(input, 'selected-model')
    const second = createAiExecutionProfiler(input, 'selected-model')
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
    const usage = createAiExecutionProfiler(input, 'selected-model')
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
      createAiExecutionProfiler(input, 'selected-model').finish('failed')
    ).not.toThrow()
  })
  it('does not log credentials or arbitrary metadata from the provider', () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const usage = createAiExecutionProfiler(
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
            text: expect.stringContaining('required field is missing')
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
    activity: {
      kind: 'system',
      callId: expect.any(String),
      sequence: 1,
      phase: 'executing'
    },
    status: 'running'
  })
  expect(onProgress).toHaveBeenCalledWith({
    tool: 'research_design_context',
    activity: {
      kind: 'system',
      callId: expect.any(String),
      sequence: 2,
      phase: 'executing'
    },
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
                evidence: { sessionId: 'doc', revision: 1 },
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
      design: {
        version: PREPARED_DESIGN_DELIVERY_VERSION,
        entries: expect.any(Array)
      }
    })
    const { design } = result.actions[0].arguments as { design: unknown }
    expect(design).not.toHaveProperty('keyToId')
    const admitted = admitPreparedDesignDelivery(
      JSON.parse(JSON.stringify(design))
    )
    expect(admitted.entries).toHaveLength(2)
    expect(admitted.entries[0].descriptor).toMatchObject({
      type: draft.type,
      name: draft.name,
      width: draft.width,
      height: draft.height
    })
    expect(admitted.entries[1]).toMatchObject({
      key: 'heading',
      parentId: admitted.rootId,
      descriptor: {
        id: admitted.keyToId.heading,
        text: draft.children[0].text
      }
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

it.each([
  ['release_design_artifacts', { artifactIds: 'wrong' }],
  [
    'analyze_vector_components',
    { imageArtifactId: 'missing', pathIds: ['path'] }
  ],
  ['select_elements', { unexpected: true }]
])(
  'keeps the conversation alive after correctable App tool failure: %s',
  async (toolName, toolArguments) => {
    const server = fakeServer({ toolCall: true, toolName, toolArguments })
    const executeBatch = vi.fn(async () => ({ actionResults: [], context: {} }))
    await expect(
      requestConfiguredAiActionBatch(
        {
          ...input,
          actions: [
            {
              name: 'apply_prepared_design',
              description: 'Apply',
              inputSchema: {}
            },
            { name: 'select_elements', description: 'Select', inputSchema: {} }
          ]
        },
        { environment, executeBatch }
      )
    ).resolves.toBeDefined()
    const reply = server.packets.find(
      (packet) => packet.id === 99 && 'result' in packet
    )
    expect(reply).toMatchObject({ result: { success: false } })
    expect(JSON.stringify(reply)).toContain('recoverable')
    expect(executeBatch).not.toHaveBeenCalled()
  }
)

it('reports returned unavailable preparation as unsuccessful rather than usable output', async () => {
  const server = fakeServer({
    toolCall: true,
    toolName: 'prepare_design',
    toolArguments: {
      draft: { type: 'frame', name: 'Invalid size', width: -1, height: 10 }
    }
  })
  await requestConfiguredAiActionBatch(
    {
      ...input,
      actions: [
        { name: 'apply_prepared_design', description: 'Apply', inputSchema: {} }
      ]
    },
    { environment, executeBatch: vi.fn() }
  )
  const reply = server.packets.find(
    (packet) => packet.id === 99 && 'result' in packet
  )
  expect(reply).toMatchObject({ result: { success: false } })
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
    toolName: 'define_design_criteria',
    toolArguments: { phase: 'plan' },
    followupTool: (reply) => {
      failures.push(reply)
      return {
        name: 'define_design_criteria',
        args: {
          phase: 'plan',
          method: 'Editable illustration',
          references: [],
          criteria: reviewCriteria(['Retain the requested appearance']),
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
      available: false,
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

it('runs prepared checks through the provider without opening another model request', async () => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const server = fakeServer({ hold: true, manualToolReplies: true })
  const executeBatch = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map(
      (action): AiBatchReceipt['actionResults'][number] => ({
        actionId: action.id,
        actionName: action.name,
        result:
          action.name === AiActionNames.READ_DESIGN_ATTACHMENT
            ? {
                available: true,
                parentId: 'workspace',
                workspaceId: 'workspace',
                evidence: { sessionId: 'scene', revision: 1 },
                basis: [
                  { x: 0, y: 0 },
                  { x: 1, y: 0 },
                  { x: 0, y: 1 }
                ]
              }
            : {
                current: true,
                validatedAt: { sessionId: 'consumer-validation', revision: 1 }
              }
      })
    )
  }))
  const request = requestLocalAiActionBatch(
    {
      ...input,
      actions: [
        AiActionNames.APPLY_PREPARED_DESIGN,
        AiActionNames.INSPECT_DRAWING,
        AiActionNames.READ_DESIGN_ATTACHMENT,
        AiActionNames.VALIDATE_INSPECTION_EVIDENCE
      ].map((name) => ({ name, description: name, inputSchema: {} }))
    },
    {
      model: 'selected-model',
      executable: 'codex',
      executeBatch
    }
  )
  await untilTurn(server.packets)
  let id = 200
  const call = async (tool: string, args: unknown) => {
    const current = ++id
    server.send({
      id: current,
      method: 'item/tool/call',
      params: {
        threadId: 'thread-1',
        turnId: 'turn-1',
        callId: `check-${current}`,
        tool,
        arguments: args
      }
    })
    await vi.waitFor(() =>
      expect(server.packets.some((packet) => packet.id === current)).toBe(true)
    )
    const packet = server.packets.find(
      (packet) => packet.id === current
    ) as unknown as {
      result: { success: boolean; contentItems: { text: string }[] }
    }
    const value = JSON.parse(packet.result.contentItems[0].text)
    expect(packet.result.success, JSON.stringify(value)).toBe(true)
    return value
  }
  try {
    await call('define_design_criteria', {
      phase: 'plan',
      method: 'Draw one surface',
      references: [],
      criteria: reviewCriteria(['surface']),
      detailRequired: false
    })
    const source = await call('prepare_design', {
      draft: {
        type: 'frame',
        name: 'Part',
        width: 20,
        height: 20,
        children: [
          {
            type: 'rect',
            key: 'surface',
            name: 'Surface',
            width: 20,
            height: 20
          }
        ]
      }
    })
    expect(
      await call('review_prepared_design', { artifactId: source.artifactId })
    ).toMatchObject({ status: 'pass', appearance: 'unverified', reused: false })
    expect(
      await call('review_prepared_design', { artifactId: source.artifactId })
    ).toMatchObject({ status: 'pass', appearance: 'unverified', reused: true })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(
      server.packets.filter((packet) => packet.method === 'turn/start')
    ).toHaveLength(1)
    expect(
      executeBatch.mock.calls.flatMap(([batch]) =>
        batch.actions.map((action) => action.name)
      )
    ).toEqual([
      AiActionNames.READ_DESIGN_ATTACHMENT,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
      AiActionNames.READ_DESIGN_ATTACHMENT,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ])
  } finally {
    server.finish()
    await request
  }
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
    toolName: 'define_design_criteria',
    toolArguments: {
      phase: 'plan',
      method: 'Three deliberately crude shapes',
      references: [],
      criteria: reviewCriteria(['Intentionally ugly face']),
      detailRequired: false
    },
    followupTool: () => ({
      name: 'execute_design_batch',
      args: {
        operations: [
          {
            name: 'set_element_visibility',
            arguments: { elementId: 'drawing', visible: true }
          }
        ]
      }
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
        'review_design',
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
                : {
                    changed: true,
                    elementId: 'drawing',
                    available: true,
                    complete: true,
                    findings: [],
                    evidence: { sessionId: 'planning-proof', revision: 1 }
                  }
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
  expect(
    evidence,
    JSON.stringify(
      trace
        .filter((entry) => entry.stage === 'tool_completed')
        .map((entry) => ({ result: entry.evidence.result }))
    )
  ).toContain('inspectionId')
  expect(evidence).toContain('unsupported')
  expect(evidence).not.toContain('base64')
  expect(evidence).not.toContain('This must not reach the product')
  log.mockRestore()
})

it('bounds trace records and never lets a broken diagnostic sink stop the request', () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const usage = createAiExecutionProfiler(input, 'selected-model')
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

it('returns executor failure and continues queued calls without replaying the failed write', async () => {
  const server = fakeServer({ hold: true, manualToolReplies: true })
  let rejectWrite!: (error: Error) => void
  const executeBatch = vi.fn(
    async (value: AiActionBatch): Promise<AiBatchReceipt> => {
      if (executeBatch.mock.calls.length === 1)
        return new Promise((_resolve, reject) => {
          rejectWrite = reject
        })
      return {
        context: {},
        actionResults: value.actions.map((action) => ({
          actionId: action.id,
          actionName: action.name,
          result: { status: 'complete' }
        }))
      }
    }
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
  const completed = expect(promise).resolves.toEqual(batch)
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
  await vi.waitFor(() => expect(executeBatch).toHaveBeenCalledTimes(2))
  await vi.waitFor(() =>
    expect(
      server.packets.filter((p) => p.id === 90 || p.id === 91)
    ).toHaveLength(2)
  )
  const replies = server.packets.filter((p) => p.id === 90 || p.id === 91)
  expect(replies).toMatchObject([
    { result: { success: false } },
    { result: { success: true } }
  ])
  server.finish()
  await completed
})

it('accepts native sleep lifecycle without executing actions or completing the turn', async () => {
  const server = fakeServer({ hold: true })
  const executeBatch = vi.fn()
  const promise = requestConfiguredAiActionBatch(input, {
    environment,
    executeBatch
  })
  const completed = expect(promise).resolves.toEqual(batch)
  let settled = false
  void promise.then(
    () => {
      settled = true
    },
    () => {
      settled = true
    }
  )
  await untilTurn(server.packets)
  for (const method of ['item/started', 'item/completed'])
    server.notify(method, {
      item: { type: 'sleep', id: 'native-pause', durationMs: 1000 }
    })
  await new Promise((resolve) => setImmediate(resolve))
  expect(settled).toBe(false)
  expect(executeBatch).not.toHaveBeenCalled()
  server.finish()
  await completed
})

it.each([
  { id: '', durationMs: 1000 },
  { id: 'pause', durationMs: -1 },
  { id: 'pause', durationMs: '1000' },
  { id: 'pause' }
])('rejects malformed native sleep %j', async (fields) => {
  const server = fakeServer({ hold: true })
  const promise = requestConfiguredAiActionBatch(input, { environment })
  const rejected = expect(promise).rejects.toMatchObject({
    code: 'AI_MODEL_BACKEND_INVALID_RESPONSE'
  })
  await untilTurn(server.packets)
  server.notify('item/completed', { item: { type: 'sleep', ...fields } })
  await rejected
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
    const usage = createAiExecutionProfiler(input, 'selected-model')
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
      outsideToolAndResearchMs: 400
    })
  } finally {
    clock.mockRestore()
    log.mockRestore()
  }
})

it('retains public activity from native notifications through the recorder into an ordered timeline', async () => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const server = fakeServer({ hold: true })
  spawn.mockReturnValue(server.child)
  const completion = requestConfiguredAiActionBatch(input, { environment })
  await untilTurn(server.packets)
  server.notify('item/started', {
    item: { id: 'public-message', type: 'agentMessage' }
  })
  for (const delta of ['Preparing ', 'the facade.'])
    server.notify('item/agentMessage/delta', {
      itemId: 'public-message',
      delta
    })
  server.notify('item/completed', {
    item: {
      id: 'public-message',
      type: 'agentMessage',
      phase: 'commentary',
      text: 'Preparing the facade.'
    }
  })
  server.notify('item/reasoning/summaryPartAdded', {
    itemId: 'summary',
    summaryIndex: 0
  })
  server.notify('item/reasoning/summaryTextDelta', {
    itemId: 'summary',
    summaryIndex: 0,
    delta: 'Choose reusable components.'
  })
  server.notify('item/reasoning/textDelta', {
    itemId: 'summary',
    delta: 'PRIVATE_CONTENT'
  })
  server.notify('item/completed', {
    item: {
      id: 'summary',
      type: 'reasoning',
      summary: ['Choose reusable components.'],
      content: ['PRIVATE_CONTENT']
    }
  })
  server.notify('turn/plan/updated', {
    threadId: undefined,
    plan: [{ step: 'Build facade', status: 'inProgress' }],
    explanation: 'References are ready.'
  })
  server.notify('item/plan/delta', {
    itemId: 'plan',
    delta: 'Build the facade.'
  })
  server.notify('item/completed', {
    item: { id: 'plan', type: 'plan', text: 'Build and inspect.' }
  })
  server.notify('item/completed', {
    item: { id: 'empty', type: 'reasoning', summary: [] }
  })
  server.notify('item/completed', {
    item: { id: 'missing', type: 'reasoning' }
  })
  server.notify('item/reasoning/summaryTextDelta', {
    itemId: 'bad',
    summaryIndex: -1,
    delta: 3
  })
  server.notify('item/agentMessage/delta', {
    threadId: 'foreign',
    itemId: 'foreign',
    delta: 'FOREIGN_TEXT'
  })
  // Preserve partial streamed messages without inventing a completed item.
  for (let i = 0; i < 128; i++)
    server.notify('item/agentMessage/delta', { itemId: 'partial', delta: 'x' })
  server.finish()
  await expect(completion).resolves.toMatchObject(batch)
  const payloads = retainedPayloads
    .map((p) => p.value)
    .filter(
      (v): v is Record<string, unknown> =>
        !!v && (v as Record<string, unknown>).stage === 'native-public-activity'
    )
  expect(payloads).toContainEqual(
    expect.objectContaining({
      method: 'turn/plan/updated',
      status: 'available',
      plan: [{ step: 'Build facade', status: 'inProgress' }]
    })
  )
  expect(
    server.packets.find((p) => p.method === 'turn/start')?.params.summary
  ).toBe('concise')
  expect(payloads).toContainEqual(
    expect.objectContaining({
      itemId: 'summary',
      summary: ['Choose reusable components.']
    })
  )
  expect(payloads).toContainEqual(
    expect.objectContaining({ itemId: 'empty', status: 'empty' })
  )
  expect(payloads).toContainEqual(
    expect.objectContaining({ itemId: 'missing', status: 'unavailable' })
  )
  expect(payloads).toContainEqual(
    expect.objectContaining({ itemId: 'bad', status: 'malformed' })
  )
  expect(JSON.stringify(payloads)).not.toMatch(/PRIVATE_CONTENT|FOREIGN_TEXT/)
  const deltas = payloads.filter((p) => p.itemId === 'partial')
  expect(deltas).toHaveLength(128)
  expect(deltas.reduce((n, p) => n + String(p.delta).length, 0)).toBe(128)
  const module = new URL(
    '../../test-data/knowledge-evaluation/public-activity.mjs',
    import.meta.url
  ).href
  const { restorePublicActivity } = await import(/* @vite-ignore */ module)
  const timeline = restorePublicActivity(
    retainedRecords,
    (ref: { path: string }) =>
      retainedPayloads[Number(ref.path.match(/fixture-(\d+)/)?.[1])].value
  )
  expect(
    timeline.activities.find(
      (p: { itemId: string; method: string }) =>
        p.itemId === 'plan' && p.method === 'item/completed'
    ).text
  ).toBe('Build and inspect.')
  expect(
    timeline.activities.filter(
      (p: { itemId: string }) => p.itemId === 'partial'
    )
  ).toHaveLength(128)
  expect(
    timeline.events.some((e: { kind: string }) => e.kind === 'reasoning')
  ).toBe(true)
})

it('rejects foreign-turn activity without retaining its content or replaying a tool', async () => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const server = fakeServer({ hold: true })
  spawn.mockReturnValue(server.child)
  const executeBatch = vi.fn()
  const completion = requestConfiguredAiActionBatch(input, {
    environment,
    executeBatch
  })
  const rejected = expect(completion).rejects.toMatchObject({
    code: 'AI_MODEL_BACKEND_INVALID_RESPONSE'
  })
  await untilTurn(server.packets)
  server.notify('item/agentMessage/delta', {
    turnId: 'foreign-turn',
    itemId: 'foreign-item',
    delta: 'FOREIGN_TEXT'
  })
  await rejected
  expect(JSON.stringify(retainedPayloads)).not.toContain('FOREIGN_TEXT')
  expect(executeBatch).not.toHaveBeenCalled()
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
          summary: ['Public progress summary']
        }
      })
    server.finish()
    await completion
    const records = log.mock.calls.map(([entry]) => JSON.parse(String(entry)))
    expect(
      records.filter(
        (entry) =>
          entry.stage?.startsWith('provider_item_') &&
          entry.evidence?.kind === 'reasoning'
      )
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
    expect(JSON.stringify(retainedPayloads)).not.toContain('PRIVATE REASONING')
  } finally {
    log.mockRestore()
  }
})

it('records native orchestration lifecycle metadata without code or output', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const server = fakeServer({ hold: true })
  spawn.mockReturnValue(server.child)
  try {
    const completion = requestConfiguredAiActionBatch(input, { environment })
    await untilTurn(server.packets)
    for (const method of ['item/started', 'item/completed'])
      server.notify(method, {
        item: {
          id: 'exec-1',
          type: 'functionCallOutput',
          name: 'exec',
          output: 'PRIVATE CODE OUTPUT'
        }
      })
    server.finish()
    await completion
    const records = log.mock.calls.map(([entry]) => JSON.parse(String(entry)))
    const events = records.filter(
      (entry) =>
        entry.stage?.startsWith('provider_item_') &&
        entry.evidence?.kind === 'functionCallOutput'
    )
    expect(events).toHaveLength(2)
    expect(events[0]).toMatchObject({
      tool: 'exec',
      evidence: {
        kind: 'functionCallOutput',
        nativeTurnId: 'turn-1',
        nativeItemId: 'exec-1'
      }
    })
    expect(JSON.stringify(records)).not.toContain('PRIVATE CODE OUTPUT')
  } finally {
    log.mockRestore()
  }
})

it('retains exact bounded discovery and field selectors for execution diagnosis', () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  try {
    createAiExecutionProfiler(input, 'selected-model').trace('tool_started', {
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
  createAiExecutionProfiler(input, 'selected-model').trace('tool_completed', {
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
    createAiExecutionProfiler(input, 'selected-model').trace('tool_completed', {
      tool: 'review_drawing',
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

it('records native discovery lifecycle and counts unseen notifications without retaining their bodies', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const server = fakeServer({ hold: true })
  spawn.mockReturnValue(server.child)
  try {
    const completion = requestConfiguredAiActionBatch(input, { environment })
    await untilTurn(server.packets)
    for (const method of ['item/started', 'item/completed'])
      server.notify(method, {
        item: {
          id: 'discovery',
          type: 'mcpToolCall',
          server: 'codex',
          tool: 'list_mcp_resources',
          status: 'completed',
          content: 'PRIVATE_BODY'
        }
      })
    server.notify('item/newPublicEvent', { content: 'PRIVATE_BODY' })
    server.finish()
    await completion
    const records = log.mock.calls.map(([entry]) => JSON.parse(String(entry)))
    expect(records).toContainEqual(
      expect.objectContaining({
        stage: 'provider_item_started',
        tool: 'list_mcp_resources'
      })
    )
    expect(records).toContainEqual(
      expect.objectContaining({
        stage: 'provider_notifications',
        evidence: expect.objectContaining({
          notificationCounts: expect.objectContaining({
            items: expect.arrayContaining([
              { notification: 'item/newPublicEvent', occurrences: 1 }
            ])
          })
        })
      })
    )
    expect(JSON.stringify(records)).not.toContain('PRIVATE_BODY')
  } finally {
    log.mockRestore()
  }
})

it('binds the call digest to the schema actually advertised to native discovery', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const server = fakeServer({
    toolCall: true,
    toolName: 'describe_design_apis',
    toolArguments: { query: 'fill' }
  })
  spawn.mockReturnValue(server.child)
  try {
    await requestConfiguredAiActionBatch(
      {
        ...input,
        actions: basicApiContracts.map(({ name, description }) => ({
          name,
          description,
          inputSchema: {}
        }))
      },
      {
        environment,
        executeBatch: async () => ({ context: {}, actionResults: [] })
      }
    )
    const records = log.mock.calls.map(([entry]) => JSON.parse(String(entry)))
    const advertised = server.packets.find(
      (packet) => packet.method === 'thread/start'
    )?.params.dynamicTools as { name: string; tools: { name: string }[] }[]
    const call = records.find((record) => record.stage === 'tool_started')
    const definition = advertised
      .flatMap((group) => group.tools)
      .find((tool) => tool.name === call.tool)
    expect(call.diagnostic.attribution.contractDigest).toBe(
      toolContractDigest(definition)
    )
  } finally {
    log.mockRestore()
  }
})

it.each(['completed', 'cancelled'] as const)(
  'retains actual provider delegation and settlement ownership for %s',
  async (outcome) => {
    const controller = new AbortController()
    const server = fakeServer({ hold: outcome === 'cancelled' })
    spawn.mockReturnValue(server.child)
    const request = requestLocalAiActionBatch(input, {
      model: 'selected-model',
      executable: 'codex',
      signal: controller.signal
    })
    if (outcome === 'cancelled') {
      await vi.waitFor(() =>
        expect(
          server.packets.some((packet) => packet.method === 'turn/start')
        ).toBe(true)
      )
      controller.abort()
      await expect(request).rejects.toBeDefined()
    } else await request
    const run = parseExecutionRecord(
      retainedRecords.map((record) => JSON.stringify(record)).join('\n')
    )
    expect(run.complete).toBe(true)
    expect(run.outcome).toBe(outcome)
    expect(run.timing.unattributedMs).toBe(0)
    expect(
      run.steps.find((step) => step.callId === 'provider-turn')
    ).toMatchObject({ status: 'completed', kind: 'lifecycle' })
    expect(run.timing.breakdown.providerWaitMs).toBeGreaterThanOrEqual(0)
    if (outcome === 'completed')
      expect(
        run.records.some((record) => record.stage === 'provider_notification')
      ).toBe(true)
  }
)

it.each(['execution', 'delivery'] as const)(
  'continues the same turn after reference %s failure and delivers corrected output',
  async (stage) => {
    const traceLog = vi
      .spyOn(console, 'info')
      .mockImplementation(() => undefined)
    const attachment = await rasterAttachment()
    const args = {
      imageUrl: 'https://example.com/image.png',
      sourceUrl: 'https://example.com/page'
    }
    const original = referenceTools.createLocalReferenceTools(
      vi.fn(() => 0),
      async () =>
        new Response(Buffer.from(attachment.dataUrl.split(',')[1], 'base64'), {
          headers: { 'content-type': attachment.mediaType }
        })
    )
    const receipt = JSON.parse(
      await original.call(
        'import_reference_image',
        args,
        new AbortController().signal
      )
    )
    const call = vi
      .fn()
      .mockImplementationOnce(async () => {
        if (stage === 'execution') throw new Error('Reference decode failed')
        const broken = structuredClone(receipt)
        broken.actionResults[0].result.image.dataUrl = 'broken'
        return JSON.stringify(broken)
      })
      .mockResolvedValue(JSON.stringify(receipt))
    vi.spyOn(referenceTools, 'createLocalReferenceTools').mockReturnValue({
      ...original,
      call
    })
    const followup = vi.fn((receipt: Record<string, unknown>) => {
      expect(receipt).toMatchObject({
        recoverable: true,
        toolOutcome: {
          status: stage === 'delivery' ? 'partial' : 'failed'
        }
      })
      expect(receipt.message).toEqual(expect.any(String))
      if (stage === 'delivery') {
        expect(receipt).toMatchObject({
          code: 'TOOL_RESULT_DELIVERY_FAILED',
          executionResult: {
            actionResults: [{ actionName: 'import_reference_image' }]
          }
        })
        expect(receipt.message).toContain('Do not replay mutations')
      }
      return { name: 'import_reference_image', args }
    })
    const server = fakeServer({
      toolCall: true,
      toolName: 'import_reference_image',
      toolArguments: args,
      followupTool: followup
    })
    await expect(
      requestLocalAiActionBatch(input, {
        model: 'selected-model',
        executable: '/usr/bin/codex',
        recordDirectory: 'unused'
      })
    ).resolves.toEqual(batch)
    expect(followup).toHaveBeenCalledOnce()
    expect(call).toHaveBeenCalledTimes(2)
    const terminalEvents = traceLog.mock.calls
      .map(([line]) => JSON.parse(String(line)))
      .filter((event) =>
        ['tool_completed', 'tool_failed'].includes(event.stage)
      )
    expect(new Set(terminalEvents.map((event) => event.callId)).size).toBe(
      terminalEvents.length
    )
    const responses = server.packets.filter(
      (packet) => 'result' in packet
    ) as unknown as { result: { success: boolean; contentItems: unknown[] } }[]
    expect(responses[0].result.success).toBe(false)
    expect(responses[1].result).toMatchObject({
      success: true,
      contentItems: expect.arrayContaining([
        { type: 'inputImage', imageUrl: attachment.dataUrl }
      ])
    })
  }
)

function createAiExecutionProfiler(
  ...[input, model, options]: Parameters<typeof createProfiler>
) {
  return createProfiler(input, model, {
    provider: 'local-codex',
    effort: 'medium',
    purpose: 'drawing',
    log: (line) => console.info(line),
    ...options
  })
}

it('publishes registered operation intent with explicit provenance', async () => {
  const child = fakeServer({
    toolCall: true,
    toolName: 'vtracer',
    toolArguments: { plan: { strategy: 'separate-background' } }
  })
  spawn.mockReturnValue(child.child)
  const onProgress = vi.fn()
  await requestConfiguredAiActionBatch(input, {
    environment,
    onProgress,
    executeBatch: async () => ({ actionResults: [], context: {} })
  })
  const running = onProgress.mock.calls
    .map(([event]) => event)
    .find((event) => event.tool === 'vtracer' && event.status === 'running')
  expect(running).toMatchObject({
    message: 'Separating drawing layers',
    activity: { kind: 'system', callId: 'call-1', sequence: expect.any(Number) }
  })
})

it('retires authored stage context at root dispatch without claiming objective execution', async () => {
  const stage = recordedPurpose.item.text
  const child = fakeServer({
    commentary: stage,
    toolCall: true,
    toolName: 'prepare_design',
    toolArguments: {
      draft: {
        type: 'frame',
        name: 'Part',
        width: 20,
        height: 20,
        children: [{ type: 'rect', name: 'Body', width: 10, height: 10 }]
      }
    }
  })
  spawn.mockReturnValue(child.child)
  const projection = createAiActivityProjection({
    purpose: 'Original full request'
  })
  const observations: {
    status: string
    label: string
    message?: string
    phase?: string
  }[] = []
  await requestConfiguredAiActionBatch(
    {
      ...input,
      actions: [
        { name: 'apply_prepared_design', description: 'Apply', inputSchema: {} }
      ]
    },
    {
      environment,
      executeBatch: vi.fn(),
      onProgress: (event) => {
        projection.append({
          attempt: 1,
          phase: 'provider',
          summary: 'Owner activity',
          tool: event.tool,
          toolStatus: event.status,
          message: event.message,
          activity: event.activity
        })
        if (event.tool === 'prepare_design')
          observations.push({
            status: event.status,
            phase: event.activity?.phase,
            ...projection.result().current
          })
      }
    }
  )
  expect(observations.some((entry) => entry.status === 'running')).toBe(true)
  expect(observations.some((entry) => entry.status === 'completed')).toBe(true)
  for (const entry of observations) {
    expect(entry.message).toBe(
      entry.status === 'completed'
        ? 'Preparing operation - Preparing the design'
        : undefined
    )
    let label = 'Preparing the design'
    if (entry.status === 'completed') label = 'Failed operation'
    else if (['queued', 'admission'].includes(entry.phase ?? ''))
      label = 'Processing your request'
    expect(entry.label).toBe(label)
  }
})

it.each(['success', 'failure'] as const)(
  'retires recorded commentary on principal dispatch and preserves concurrent ownership on %s',
  async (outcome) => {
    const server = fakeServer({ hold: true, manualToolReplies: true })
    spawn.mockReturnValue(server.child)
    const releases: (() => void)[] = []
    const executeBatch = vi.fn(
      async (batch: AiActionBatch): Promise<AiBatchReceipt> => {
        await new Promise<void>((resolve) => releases.push(resolve))
        if (outcome === 'failure') throw new Error('Recorded operation failed')
        return {
          context: {},
          actionResults: batch.actions.map((action) => ({
            actionId: action.id,
            actionName: action.name,
            result: { status: 'complete' }
          }))
        }
      }
    )
    const projection = createAiActivityProjection({
      purpose: 'Draw the entire Taipei101'
    })
    const events: {
      tool: string
      status: string
      activity?: { callId?: string }
    }[] = []
    const result = requestConfiguredAiActionBatch(
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
      {
        environment,
        executeBatch,
        onProgress: (event) => {
          events.push(event)
          projection.append({
            attempt: 1,
            phase: 'provider',
            summary: 'Owner activity',
            tool: event.tool,
            toolStatus: event.status,
            message: event.message,
            activity: event.activity
          })
        }
      }
    )
    await untilTurn(server.packets)
    server.notify('item/completed', { item: recordedPurpose.item })
    const call = (id: number) =>
      server.send({
        id,
        method: 'item/tool/call',
        params: {
          threadId: 'thread-1',
          turnId: 'turn-1',
          callId: `cohort-${id}`,
          tool: 'select_elements',
          arguments: { arguments: { elementIds: ['shape'] } }
        }
      })
    call(801)
    call(802)
    server.notify('item/started', {
      item: {
        id: 'overlapping-research',
        type: 'webSearch',
        status: 'inProgress',
        action: { type: 'search', query: 'Taipei101' }
      }
    })
    await vi.waitFor(() => expect(releases.length).toBeGreaterThan(0))
    releases[0]()
    await vi.waitFor(() =>
      expect(server.packets.some((packet) => packet.id === 801)).toBe(true)
    )
    expect(
      events.filter(
        (event) =>
          event.tool === 'public-progress' && event.status === 'completed'
      )
    ).toHaveLength(0)
    const next = {
      ...recordedPurpose.item,
      id: 'next-stage',
      text: 'Inspect the corrected crown'
    }
    server.notify('item/completed', { item: next })
    await vi.waitFor(() => expect(releases).toHaveLength(2))
    releases[1]()
    await vi.waitFor(() =>
      expect(server.packets.some((packet) => packet.id === 802)).toBe(true)
    )
    expect(projection.result().current).toEqual({
      label: 'Researching design context'
    })
    for (const id of [801, 802])
      expect(server.packets.find((packet) => packet.id === id)).toMatchObject({
        result: { success: outcome === 'success' }
      })
    server.notify('item/completed', {
      item: {
        id: 'overlapping-research',
        type: 'webSearch',
        status: 'completed',
        action: { type: 'search', query: 'Taipei101' }
      }
    })
    expect(projection.result().current).toEqual({
      label: 'Operation ended - outcome unconfirmed (3)',
      message:
        'Selecting elements; Selecting elements; Researching design context'
    })
    call(803)
    await vi.waitFor(() => expect(releases).toHaveLength(3))
    releases[2]()
    await vi.waitFor(() =>
      expect(server.packets.some((packet) => packet.id === 803)).toBe(true)
    )
    expect(projection.result().current?.message).toBe('Selecting elements')
    expect(
      events
        .filter(
          (event) =>
            event.tool === 'public-progress' && event.status === 'completed'
        )
        .map((event) => event.activity?.callId)
    ).toEqual([])
    for (const callId of ['cohort-801', 'cohort-802', 'cohort-803'])
      expect(
        events.filter(
          (event) =>
            event.activity?.callId === callId && event.status === 'completed'
        )
      ).toHaveLength(1)
    expect(projection.result().current).toEqual({
      label: outcome === 'success' ? 'Completed operation' : 'Failed operation',
      message: 'Selecting elements'
    })
    server.finish()
    await result
  }
)

it('retires superseded commentary between native research and App calls without reopening closed research', async () => {
  const server = fakeServer({ hold: true, manualToolReplies: true })
  spawn.mockReturnValue(server.child)
  const projection = createAiActivityProjection({ purpose: 'Draw Taipei101' })
  const events: { tool: string; status: string }[] = []
  const result = requestConfiguredAiActionBatch(
    {
      ...input,
      actions: [
        { name: 'apply_prepared_design', description: 'Apply', inputSchema: {} }
      ]
    },
    {
      environment,
      executeBatch: vi.fn(),
      onProgress: (event) => {
        events.push(event)
        projection.append({
          attempt: 1,
          phase: 'provider',
          summary: 'Owner activity',
          tool: event.tool,
          toolStatus: event.status,
          message: event.message,
          activity: event.activity
        })
      }
    }
  )
  await untilTurn(server.packets)
  server.notify('item/completed', { item: recordedPurpose.item })
  const research = (id: string, status: 'started' | 'completed') =>
    server.notify(`item/${status}`, {
      item: {
        id,
        type: 'webSearch',
        status: status === 'started' ? 'inProgress' : 'completed',
        action: { type: 'search', query: 'Taipei101' }
      }
    })
  research('research-a', 'started')
  research('research-b', 'started')
  research('research-a', 'completed')
  expect(projection.result().current?.message).toBeUndefined()
  research('research-b', 'completed')
  expect(projection.result().current).toEqual({
    label: 'Operation ended - outcome unconfirmed (2)',
    message: 'Researching design context; Researching design context'
  })
  expect(
    events.filter(
      (event) =>
        event.tool === 'public-progress' && event.status === 'completed'
    )
  ).toHaveLength(0)
  research('research-b', 'completed')
  expect(
    events.filter(
      (event) =>
        event.tool === 'public-progress' && event.status === 'completed'
    )
  ).toHaveLength(0)
  server.notify('item/completed', {
    item: {
      ...recordedPurpose.item,
      id: 'after-research-purpose',
      text: 'Prepare the next part'
    }
  })
  // A delayed duplicate start must not reopen an already completed native call.
  research('research-b', 'started')
  server.send({
    id: 891,
    method: 'item/tool/call',
    params: {
      threadId: 'thread-1',
      turnId: 'turn-1',
      callId: 'after-research',
      tool: 'prepare_design',
      arguments: {
        draft: {
          type: 'frame',
          name: 'Part',
          width: 20,
          height: 20,
          children: [{ type: 'rect', name: 'Body', width: 10, height: 10 }]
        }
      }
    }
  })
  await vi.waitFor(() =>
    expect(server.packets.some((packet) => packet.id === 891)).toBe(true)
  )
  expect(projection.result().current).toEqual({
    label: 'Failed operation',
    message: 'Preparing operation - Preparing the design'
  })
  server.finish()
  await result
})

it('records registered review intent without declaring a new authored stage', async () => {
  const child = fakeServer({
    toolCall: true,
    toolName: 'review_drawing',
    toolArguments: {}
  })
  spawn.mockReturnValue(child.child)
  const onProgress = vi.fn()
  await requestConfiguredAiActionBatch(
    {
      ...input,
      actions: [
        ...input.actions,
        { name: 'inspect_drawing', description: 'Inspect', inputSchema: {} }
      ]
    },
    { environment, executeBatch: vi.fn(), onProgress }
  )
  const review = onProgress.mock.calls
    .map(([event]) => event)
    .find(
      (event) =>
        event.tool === 'review_drawing' && event.activity?.phase === 'queued'
    )
  expect(review).toMatchObject({
    activity: { kind: 'system' },
    message: 'Checking the requested details'
  })
  const records = retainedRecords as {
    evidence?: Record<string, unknown>
  }[]
  const recorded = records.find(
    (record) =>
      record.evidence?.method === 'app/activity' &&
      record.evidence?.tool === 'review_drawing' &&
      (record.evidence?.activity as { phase?: string })?.phase === 'queued'
  )?.evidence
  expect(recorded).toMatchObject({
    activity: review.activity,
    purpose: null,
    purposeSource: 'inherited',
    expectedResult: 'Checking the requested details',
    expectationSource: 'registered-operation'
  })
})

it.each(['active', 'settled'] as const)(
  'rejects repeated native call identities after %s dispatch without repeating the operation',
  async (phase) => {
    const server = fakeServer({ hold: true, manualToolReplies: true })
    let release!: () => void
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    const executeBatch = vi.fn(
      async (value: AiActionBatch): Promise<AiBatchReceipt> => {
        if (phase === 'active') await held
        return {
          context: {},
          actionResults: value.actions.map((action) => ({
            actionId: action.id,
            actionName: action.name,
            result: { status: 'complete' }
          }))
        }
      }
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
      code: 'AI_MODEL_BACKEND_INVALID_RESPONSE'
    })
    await untilTurn(server.packets)
    const params = {
      threadId: 'thread-1',
      turnId: 'turn-1',
      callId: 'same-call',
      tool: 'select_elements',
      arguments: { arguments: { elementIds: ['shape'] } }
    }
    server.send({ id: 190, method: 'item/tool/call', params: { ...params } })
    await vi.waitFor(() => expect(executeBatch).toHaveBeenCalledOnce())
    if (phase === 'settled')
      await vi.waitFor(() =>
        expect(server.packets.some((packet) => packet.id === 190)).toBe(true)
      )
    server.send({ id: 191, method: 'item/tool/call', params: { ...params } })
    release()
    await rejected
    expect(executeBatch).toHaveBeenCalledOnce()
  }
)

it('delivers attachment identity and prepares selected uses before capture and checking without a validation round trip', async () => {
  const png = `data:image/png;base64,${(
    await sharp({
      create: { width: 4, height: 4, channels: 4, background: 'white' }
    })
      .png()
      .toBuffer()
  ).toString('base64')}`
  const server = fakeServer({ hold: true, manualToolReplies: true })
  spawn.mockReturnValue(server.child)
  const running = requestConfiguredAiActionBatch(
    {
      ...input,
      metadata: {
        imageAttachments: [
          {
            dataUrl: png,
            mediaType: 'image/png',
            size: 100,
            referenceId: 'forged',
            validation: { width: 999, height: 999 }
          },
          {
            dataUrl: 'data:image/png;base64,YQ==',
            mediaType: 'image/png',
            size: 1
          }
        ]
      },
      actions: ['inspect_drawing', 'validate_inspection_evidence'].map(
        (name) => ({ name, description: name, inputSchema: { type: 'object' } })
      )
    },
    {
      environment,
      executeBatch: async (request) => ({
        context: {},
        actionResults: request.actions.map(
          (action): AiBatchReceipt['actionResults'][number] => ({
            actionId: action.id,
            actionName: action.name,
            result:
              action.name === 'inspect_drawing'
                ? {
                    available: true,
                    image: { dataUrl: png, width: 4, height: 4 },
                    imageScope: 'region',
                    background: '#ffffff',
                    evidence: {
                      sessionId: 'images',
                      revision: 1,
                      receiptId: 'part'
                    }
                  }
                : {
                    current: true,
                    validatedAt: { sessionId: 'images', revision: 1 }
                  }
          })
        )
      })
    }
  )
  await untilTurn(server.packets)
  let id = 200
  let discoveryBytes = 0
  let discoveryCalls = 0
  const stats = vi.spyOn(sharp.prototype, 'stats')
  const call = async (tool: string, args: unknown) => {
    const current = ++id
    server.send({
      id: current,
      method: 'item/tool/call',
      params: {
        threadId: 'thread-1',
        turnId: 'turn-1',
        callId: `reference-${current}`,
        tool,
        arguments: args
      }
    })
    await vi.waitFor(() =>
      expect(server.packets.some((packet) => packet.id === current)).toBe(true)
    )
    const packet = server.packets.find(
      (packet) => packet.id === current
    ) as unknown as {
      result: { success: boolean; contentItems: { text: string }[] }
    }
    const text = packet.result.contentItems[0].text
    if (tool === 'describe_design_apis') {
      discoveryCalls++
      discoveryBytes +=
        Buffer.byteLength(JSON.stringify(args)) + Buffer.byteLength(text)
    }
    const value = JSON.parse(text)
    expect(packet.result.success, JSON.stringify(value)).toBe(true)
    return value
  }
  try {
    for (const previous of recordedAttachmentHandoff.calls.slice(0, 2)) {
      const query = {
        ...previous.input.value,
        names: (previous.input.value.names ?? []).filter(
          (name) => name !== 'validate_reference_images'
        )
      }
      const delivered = await call('describe_design_apis', query)
      expect(
        delivered.tools.some(
          (tool: { name: string }) => tool.name === 'select_design_references'
        )
      ).toBe(true)
      expect(JSON.stringify(delivered)).toContain(
        'No prior validation call is required'
      )
    }
    await call('define_design_criteria', {
      phase: 'plan',
      method: 'Compare selected region',
      references: [],
      criteria: reviewCriteria(['surface']),
      detailRequired: false
    })
    const turn = server.packets.find((packet) => packet.method === 'turn/start')
    if (!turn) throw new Error('Missing initial turn')
    const items = turn.params.input as {
      type: string
      text?: string
      url?: string
    }[]
    if (!items[0].text) throw new Error('Missing initial text')
    const attachment = JSON.parse(items[0].text).input.metadata
      .imageAttachments[0]
    expect(attachment.referenceId).toBe(
      `reference:${createHash('sha256')
        .update(Buffer.from(png.split(',')[1], 'base64'))
        .digest('hex')}`
    )
    expect(attachment).not.toHaveProperty('validation')
    expect(stats).not.toHaveBeenCalled()
    const attachments = JSON.parse(items[0].text).input.metadata
      .imageAttachments as Record<string, unknown>[]
    const metadataDelta = attachments.reduce((bytes, item) => {
      const { referenceId: _identity, validation: _validation, ...prior } = item
      return (
        bytes +
        Buffer.byteLength(JSON.stringify(item)) -
        Buffer.byteLength(JSON.stringify(prior))
      )
    }, 0)
    expect(items[1]).toEqual({ type: 'image', url: png })
    const thread = server.packets.find(
      (packet) => packet.method === 'thread/start'
    )
    if (!thread) throw new Error('Missing thread instructions')
    const instructions = thread.params.baseInstructions as string
    expect(instructions).toContain('select_design_references prepares')
    const guidance = instructions
      .split('\n')
      .find((line) => line.startsWith('Attachment metadata already'))
    if (!guidance) throw new Error('Missing attachment guidance')
    const baselineBytes = recordedAttachmentHandoff.calls.reduce(
      (bytes, call) => bytes + call.input.bytes + call.output.bytes,
      0
    )
    const totalBytes =
      discoveryBytes +
      metadataDelta +
      Buffer.byteLength(guidance) -
      Buffer.byteLength(recordedAttachmentHandoff.priorGuidance)
    expect(discoveryCalls).toBe(2)
    expect(totalBytes).toBeLessThan(baselineBytes)
    process.stdout.write(
      'Attachment handoff bytes ' +
        JSON.stringify({
          baselineBytes,
          totalBytes,
          discoveryBytes,
          metadataDelta,
          baselineCalls: 3,
          discoveryCalls
        }) +
        '\n'
    )
    const selected = await call('select_design_references', {
      referenceImageIndexes: [0],
      requirementRevision: 1,
      referenceDecisions: [
        {
          referenceId: attachment.referenceId,
          status: 'accepted',
          reason: 'Explicit aligned fixture',
          uses: [
            {
              id: 'surface',
              criterionId: 'surface',
              purpose: 'pixel-comparison',
              region: 'whole',
              limitations: []
            }
          ]
        }
      ]
    })
    expect(stats).toHaveBeenCalledOnce()
    expect(selected.referenceDecisions[0].uses[0].pixels).toEqual({
      width: 4,
      height: 4
    })
    const captured = await call('inspect_drawing', {
      arguments: {
        elementId: 'part',
        region: { x: 0, y: 0, width: 4, height: 4 }
      }
    })
    const result = await call('check_drawing_image', {
      checkId: 'surface',
      inspectionId: captured.actionResults[0].result.inspectionId,
      referenceImageIndex: 0,
      referenceUse: selected.referenceDecisions[0].uses[0].receipt,
      referenceRegion: { x: 0, y: 0, width: 4, height: 4 },
      channelTolerance: 0,
      maxDifferentFraction: 0
    })
    expect(result).toMatchObject({
      checkId: 'surface',
      resultId: 'image:surface',
      status: 'pass',
      appearance: 'unverified',
      pixelReads: 16
    })
    expect(
      server.packets.filter((packet) => packet.method === 'turn/start')
    ).toHaveLength(1)
    expect(spawn).toHaveBeenCalledTimes(1)
  } finally {
    stats.mockRestore()
    server.finish()
    await running
  }
})

it.each(['read', 'mutation', 'external', 'mixed', 'unknown'] as const)(
  'projects actual %s dispatch through the real provider and reducer',
  async (effect) => {
    const child = fakeServer({
      toolCall: true,
      toolName: 'execute_design_batch',
      toolArguments: {
        message: 'Inspect the prepared crown',
        operations: [
          { name: 'select_elements', arguments: { elementIds: [] } },
          ...(effect === 'mixed'
            ? [
                {
                  name: 'set_element_visibility',
                  arguments: { elementId: 'mark', visible: false }
                }
              ]
            : [])
        ]
      }
    })
    spawn.mockReturnValue(child.child)
    const projection = createAiActivityProjection()
    const dispatched: unknown[] = []
    const executeBatch = vi.fn(
      async (batch: AiActionBatch): Promise<AiBatchReceipt> => {
        dispatched.push(projection.result().current)
        return {
          actionResults: batch.actions.map((action) => ({
            actionId: action.id,
            actionName: action.name,
            result: { status: 'complete' }
          })),
          context: {}
        }
      }
    )
    await requestConfiguredAiActionBatch(
      {
        ...input,
        actions: [
          {
            name: 'select_elements',
            description: 'Select',
            inputSchema: {},
            ...(effect === 'unknown'
              ? {}
              : { effect: effect === 'mixed' ? 'read' : effect })
          },
          {
            name: 'set_element_visibility',
            description: 'Visibility',
            inputSchema: {},
            effect: 'mutation'
          }
        ]
      },
      {
        environment,
        executeBatch,
        onProgress: (event) => {
          projection.append({
            attempt: 1,
            phase: 'provider',
            summary: 'Operation',
            tool: event.tool,
            toolStatus: event.status,
            message: event.message,
            activity: event.activity
          })
        }
      }
    )
    const labels = {
      read: 'Reading data',
      mutation: 'Updating the canvas',
      external: 'Running an external operation',
      mixed: 'Running mixed operations',
      unknown: 'Running planned operations'
    }
    expect(dispatched).toEqual([
      { label: labels[effect], message: 'Inspect the prepared crown' }
    ])
    expect(executeBatch).toHaveBeenCalledOnce()
    expect(spawn).toHaveBeenCalledOnce()
  }
)

it('discovers and retrieves both knowledge contexts through the normal provider without document writes', async () => {
  const server = fakeServer({ hold: true, manualToolReplies: true })
  const executeBatch = vi.fn(async () => ({ actionResults: [], context: {} }))
  const request = requestLocalAiActionBatch(input, {
    model: 'selected-model',
    executable: 'codex',
    executeBatch
  })
  await untilTurn(server.packets)
  const groups = server.packets.find(
    (packet) => packet.method === 'thread/start'
  )?.params.dynamicTools as {
    name: string
    tools: { name: string; description: string }[]
  }[]
  const thread = server.packets.find(
    (packet) => packet.method === 'thread/start'
  )?.params
  expect(thread?.baseInstructions).toContain('discover_knowledge')
  expect(thread?.baseInstructions).toContain(
    'Select the sufficient parent or child directly'
  )
  expect(thread?.baseInstructions).toContain(
    'hierarchy depth does not mean more complete advice'
  )
  expect(thread?.baseInstructions).toContain(
    'Known-value edits can proceed without a lookup'
  )
  const knowledge = groups.find((group) => group.name === 'design_knowledge')
  expect(knowledge?.tools.map((tool) => tool.name)).toEqual([
    'discover_knowledge',
    'read_knowledge'
  ])
  expect(JSON.stringify(knowledge)).not.toContain('## How')
  expect(
    knowledge?.tools.find((tool) => tool.name === 'read_knowledge')?.description
  ).toContain('Do not read all siblings')
  let id = 800
  const call = async (tool: string, args: unknown, success = true) => {
    const current = ++id
    server.send({
      id: current,
      method: 'item/tool/call',
      params: {
        threadId: 'thread-1',
        turnId: 'turn-1',
        callId: `knowledge-${current}`,
        tool,
        arguments: args
      }
    })
    await vi.waitFor(() =>
      expect(server.packets.some((packet) => packet.id === current)).toBe(true)
    )
    const packet = server.packets.find(
      (packet) => packet.id === current
    ) as unknown as {
      result: { success: boolean; contentItems: { text: string }[] }
    }
    expect(packet.result.success).toBe(success)
    return JSON.parse(packet.result.contentItems[0].text)
  }
  try {
    const architecture = {
      ids: ['design.architectural-illustration'],
      contexts: ['architectural-illustration']
    }
    const invalid = await call(
      'discover_knowledge',
      { contexts: ['invented-context'] },
      false
    )
    expect(invalid.recoverable).toBe(true)
    const missing = await call(
      'read_knowledge',
      { ids: ['missing.advice'] },
      false
    )
    expect(JSON.stringify(missing)).toContain('KNOWLEDGE_NOT_FOUND')
    const unrelated = await call(
      'read_knowledge',
      { ...architecture, contexts: ['docs-page'] },
      false
    )
    expect(JSON.stringify(unrelated)).toContain('KNOWLEDGE_NOT_APPLICABLE')
    const architecturalCatalog = await call('discover_knowledge', {
      contexts: architecture.contexts
    })
    expect(
      architecturalCatalog.entries.some(
        (entry: { id: string }) => entry.id === architecture.ids[0]
      )
    ).toBe(true)
    const method = architecturalCatalog.entries.find(
      (entry: { id: string }) =>
        entry.id === 'design.architectural-illustration.materials.method'
    )
    const detail = architecturalCatalog.entries.find(
      (entry: { id: string }) => entry.id === method.children[0]
    )
    expect(method.description).toMatch(/without.*parameter walkthrough/i)
    expect(detail.description).toMatch(
      /only when.*local-coordinate conversion.*worked example/i
    )
    expect(detail.description).toMatch(
      /known supported representation.*does not require/i
    )
    const directory = architecturalCatalog.entries.find(
      (entry: { id: string }) => entry.id === architecture.ids[0]
    )
    const materials = architecturalCatalog.entries.find(
      (entry: { id: string }) =>
        entry.id ===
        directory.children.find((child: string) => child.endsWith('.materials'))
    )
    architecture.ids = [
      materials.children.find((child: string) => child.endsWith('.correction'))
    ]
    const architecturalRead = await call('read_knowledge', architecture)
    expect(architecturalRead.alreadyDelivered).toBe(false)
    expect(
      architecturalRead.documents.map((doc: { target: string }) => doc.target)
    ).toEqual([
      'design.architectural-illustration',
      'design.architectural-illustration.contracts',
      'illustration.architecture',
      'illustration.architecture.materials',
      'design.architectural-illustration.materials.correction'
    ])
    expect(JSON.stringify(architecturalRead)).toContain(
      'edits create local overrides'
    )
    expect(JSON.stringify(architecturalRead)).not.toContain(
      '## Represent a repeated multi-face component once'
    )
    expect((await call('read_knowledge', architecture)).alreadyDelivered).toBe(
      false
    )
    const architecturalRestored = await call('read_knowledge', {
      ...architecture,
      rehydrate: true
    })
    expect(architecturalRestored.documents).toEqual(architecturalRead.documents)
    const metadata = await call('discover_knowledge', {
      contexts: ['docs-page']
    })
    expect(
      metadata.entries.some(
        (entry: { id: string }) => entry.id === 'design.docs-page'
      )
    ).toBe(true)
    const docs = await call('read_knowledge', {
      ids: ['design.docs-page'],
      contexts: ['docs-page']
    })
    const landing = await call('read_knowledge', {
      ids: ['design.landing-page'],
      contexts: ['landing-page']
    })
    expect(JSON.stringify(docs)).toContain('copy actions near their examples')
    expect(JSON.stringify(landing)).toContain('Identify the audience')
    expect(
      (
        await call('read_knowledge', {
          ids: ['design.docs-page'],
          contexts: ['docs-page']
        })
      ).alreadyDelivered
    ).toBe(false)
    server.send({
      method: 'item/completed',
      params: {
        threadId: 'other-thread',
        turnId: 'turn-1',
        item: { id: 'unrelated-compact', type: 'contextCompaction' }
      }
    })
    expect(
      (
        await call('read_knowledge', {
          ids: ['design.docs-page'],
          contexts: ['docs-page']
        })
      ).alreadyDelivered
    ).toBe(false)
    server.send({
      method: 'item/started',
      params: {
        threadId: 'thread-1',
        turnId: 'turn-1',
        item: { id: 'compact-1', type: 'contextCompaction' }
      }
    })
    server.send({
      method: 'item/completed',
      params: {
        threadId: 'thread-1',
        turnId: 'turn-1',
        item: { id: 'compact-1', type: 'contextCompaction' }
      }
    })
    const restored = await call('read_knowledge', {
      ids: ['design.docs-page'],
      contexts: ['docs-page']
    })
    expect(restored.alreadyDelivered).toBe(false)
    expect(JSON.stringify(restored)).toContain(
      'copy actions near their examples'
    )
    expect(executeBatch).not.toHaveBeenCalled()
  } finally {
    server.finish()
    await request
  }
})

it('preserves an App completion failure after a valid final response without replaying writes', async () => {
  const operations = await import('../local-operation-tools')
  const original = operations.createLocalOperationTools
  const cause = new Error('Canonical completion receipt unavailable')
  const validation = vi.fn(async () => {
    throw cause
  })
  const spy = vi
    .spyOn(operations, 'createLocalOperationTools')
    .mockImplementation((...args) => ({
      ...original(...args),
      validateCompletion: validation
    }))
  const executeBatch = vi.fn()
  try {
    fakeServer()
    await expect(
      requestConfiguredAiActionBatch(input, { environment, executeBatch })
    ).rejects.toBe(cause)
    expect(validation).toHaveBeenCalledTimes(1)
    expect(executeBatch).not.toHaveBeenCalled()
  } finally {
    spy.mockRestore()
  }
})

it('isolates recorded rejected preparation from an earlier provider part and repairs only the rejected part', async () => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const { default: recorded } =
    await import('./fixtures/recorded-101/ordered-preparation-20261019.json')
  const server = fakeServer({ hold: true, manualToolReplies: true })
  const applied: string[] = []
  const executeBatch = vi.fn(
    async (batch: AiActionBatch): Promise<AiBatchReceipt> => ({
      context: {},
      actionResults: batch.actions.map((action) => {
        expect(action.name).toBe(AiActionNames.APPLY_PREPARED_DESIGN)
        const root = `part-${applied.length + 1}`
        applied.push(root)
        return {
          actionId: action.id,
          actionName: action.name,
          result: {
            status: 'complete',
            compositionId: root,
            appliedElementIds: [root]
          }
        }
      })
    })
  )
  const request = requestLocalAiActionBatch(
    {
      ...input,
      actions: [
        {
          name: AiActionNames.APPLY_PREPARED_DESIGN,
          description: 'Apply',
          inputSchema: {}
        }
      ]
    },
    { model: 'selected-model', executable: 'codex', executeBatch }
  )
  await untilTurn(server.packets)
  let id = 800
  const call = async (args: unknown) => {
    const current = ++id
    server.send({
      id: current,
      method: 'item/tool/call',
      params: {
        threadId: 'thread-1',
        turnId: 'turn-1',
        callId: `recorded-${current}`,
        tool: 'prepare_and_apply_design',
        arguments: args
      }
    })
    await vi.waitFor(() =>
      expect(server.packets.some((p) => p.id === current)).toBe(true)
    )
    const packet = server.packets.find((p) => p.id === current) as unknown as {
      result: { success: boolean; contentItems: { text: string }[] }
    }
    return {
      success: packet.result.success,
      value: JSON.parse(packet.result.contentItems[0].text)
    }
  }
  try {
    const failed = await call(recorded.input)
    expect(applied).toEqual(['part-1'])
    expect(failed.success).toBe(false)
    expect(failed.value).toMatchObject({
      status: 'partial',
      settlement: 'partial',
      failedPart: 'base-details'
    })
    const rejected = failed.value.parts[1]
    expect(rejected.message).toContain('buttress-y0.vertices')
    expect(rejected.message).toContain('nonplanar face')
    expect(rejected).toMatchObject({
      recovery: 'correct_input',
      draftId: expect.any(String),
      toolOutcome: { status: 'failed', settlement: 'not-started' }
    })
    expect(rejected.executionResult?.batches ?? []).toEqual([])
    const failedRepair = await call({
      repair: {
        draftId: rejected.draftId,
        replacements: [{ path: '/name', value: 'Still nonplanar' }]
      },
      inspection: 'defer'
    })
    expect(failedRepair.success).toBe(false)
    expect(failedRepair.value).toMatchObject({
      recovery: 'correct_input',
      draftId: expect.any(String),
      toolOutcome: { status: 'failed', settlement: 'not-started' }
    })
    expect(failedRepair.value.message).toContain('nonplanar face')
    expect(applied).toEqual(['part-1'])
    // Split each recorded face into planar triangles; only the unexecuted part is repaired.
    const children = recorded.input.parts[1].draft.children.flatMap<unknown>(
      (child) => {
        if (child.type !== 'projected-face' || !('vertices' in child))
          return [child]
        const vertices = child.vertices as { x: number; y: number; z: number }[]
        return vertices.slice(2).map((vertex, index) => ({
          ...child,
          key: `${child.key}-triangle-${index}`,
          vertices: [vertices[0], vertices[index + 1], vertex]
        }))
      }
    )
    const repaired = await call({
      parts: [
        {
          key: 'base-details',
          parentId: recorded.input.parts[1].parentId,
          repair: {
            draftId: failedRepair.value.draftId,
            replacements: [{ path: '/children', value: children }]
          }
        }
      ],
      inspection: 'defer'
    })
    expect(repaired.success).toBe(false)
    expect(repaired.value.toolOutcome).toMatchObject({
      status: 'partial',
      settlement: 'completed'
    })
    expect(applied).toEqual(['part-1', 'part-2'])
    expect(spawn).toHaveBeenCalledTimes(1)
  } finally {
    server.finish()
    await request
  }
})

it.each(['malformed', 'unavailable'] as const)(
  'isolates queued provider preparation and attributes a %s second write to its own child',
  async (mode) => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const server = fakeServer({ hold: true, manualToolReplies: true })
    let release!: () => void
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    const actionIds: string[] = []
    const progress: {
      tool?: string
      activity?: { callId?: string; parentCallId?: string }
    }[] = []
    const executeBatch = async (
      batch: AiActionBatch
    ): Promise<AiBatchReceipt> => {
      const action = batch.actions[0]
      actionIds.push(action.id)
      if (actionIds.length === 1) await held
      else if (mode === 'unavailable')
        throw new Error('Second write receipt unavailable')
      return {
        context: {},
        actionResults: [
          {
            actionId: action.id,
            actionName: action.name,
            result:
              actionIds.length === 1
                ? {
                    status: 'complete',
                    compositionId: 'prefix',
                    appliedElementIds: ['prefix']
                  }
                : { status: 'complete', compositionId: 42 }
          }
        ]
      }
    }
    const request = requestLocalAiActionBatch(
      {
        ...input,
        actions: [
          {
            name: AiActionNames.APPLY_PREPARED_DESIGN,
            description: 'Apply',
            inputSchema: {}
          }
        ]
      },
      {
        model: 'selected-model',
        executable: 'codex',
        executeBatch,
        onProgress: (event) => progress.push(event)
      }
    )
    await untilTurn(server.packets)
    const sendCall = (id: number, tool: string, args: unknown) =>
      server.send({
        id,
        method: 'item/tool/call',
        params: {
          threadId: 'thread-1',
          turnId: 'turn-1',
          callId: `concurrent-${id}`,
          tool,
          arguments: args
        }
      })
    const read = async (id: number) => {
      await vi.waitFor(() =>
        expect(server.packets.some((p) => p.id === id)).toBe(true)
      )
      const packet = server.packets.find((p) => p.id === id) as unknown as {
        result: { contentItems: { text: string }[] }
      }
      return JSON.parse(packet.result.contentItems[0].text)
    }
    const draft = {
      type: 'group',
      name: 'Part',
      children: [
        { type: 'rect', key: 'face', name: 'Face', width: 10, height: 10 }
      ]
    }
    try {
      sendCall(850, 'prepare_and_apply_design', {
        parts: [
          { key: 'a', draft },
          { key: 'b', draft }
        ],
        inspection: 'defer'
      })
      await vi.waitFor(() => expect(actionIds).toHaveLength(1))
      sendCall(851, 'prepare_design', {
        draft: { ...draft, children: [draft.children[0], draft.children[0]] }
      })
      expect(server.packets.some((p) => p.id === 851)).toBe(false)
      release()
      const rejected = await read(851)
      expect(rejected).toMatchObject({
        available: false,
        recovery: 'correct_input',
        toolOutcome: { status: 'failed', settlement: 'not-started' }
      })
      expect(rejected.executionResult?.batches ?? []).toEqual([])
      const result = await read(850)
      expect(result).toMatchObject({ status: 'partial', settlement: 'unknown' })
      expect(result.parts[1].code).toBe(
        mode === 'malformed'
          ? 'TOOL_RESULT_INVALID'
          : 'MUTATION_SCOPE_UNAVAILABLE'
      )
      if (mode === 'malformed') {
        const receiptIds = result.parts[1].executionResult.batches.flatMap(
          (b: AiBatchReceipt) => b.actionResults.map((a) => a.actionId)
        )
        expect(receiptIds).toEqual([actionIds[1]])
      } else {
        expect(result.parts[1].executionResult).toBeUndefined()
        expect(result.parts[1].message).toContain(
          'Second write receipt unavailable'
        )
        expect(result.parts[1].settlement).toBe('unknown')
      }
      expect(JSON.stringify(result.parts[1])).not.toContain(actionIds[0])
      const batches = progress.filter(
        (e) => e.tool === 'app-batch' && e.activity?.parentCallId
      )
      expect(batches.length).toBeGreaterThan(0)
      expect(
        batches.every((e) => e.activity?.parentCallId !== 'concurrent-850')
      ).toBe(true)
      for (const batch of batches)
        expect(
          progress.some(
            (e) =>
              e.activity?.callId === batch.activity?.parentCallId &&
              e.activity?.parentCallId === 'concurrent-850'
          )
        ).toBe(true)
    } finally {
      release()
      server.finish()
      await request
    }
  }
)

it('retains the actual provider prefix on cancellation without dispatching the next part', async () => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const server = fakeServer({ hold: true, manualToolReplies: true })
  const controller = new AbortController()
  const executeBatch = vi.fn(
    async (batch: AiActionBatch): Promise<AiBatchReceipt> => ({
      context: {},
      actionResults: batch.actions.map((action) => ({
        actionId: action.id,
        actionName: action.name,
        result: {
          status: 'complete',
          compositionId: 'acknowledged-before-cancel'
        }
      }))
    })
  )
  const progress: {
    tool?: string
    status?: string
    activity?: { callId?: string; parentCallId?: string }
  }[] = []
  const request = requestLocalAiActionBatch(
    {
      ...input,
      actions: [
        {
          name: AiActionNames.APPLY_PREPARED_DESIGN,
          description: 'Apply',
          inputSchema: {}
        }
      ]
    },
    {
      model: 'selected-model',
      executable: 'codex',
      executeBatch,
      signal: controller.signal,
      onProgress: (event) => {
        progress.push(event)
        if (event.tool === 'app-batch' && event.status === 'completed')
          controller.abort()
      }
    }
  )
  const checked = expect(request).rejects.toMatchObject({
    code: 'AI_MODEL_BACKEND_ABORTED'
  })
  await untilTurn(server.packets)
  const draft = {
    type: 'group',
    name: 'Part',
    children: [
      { type: 'rect', key: 'face', name: 'Face', width: 10, height: 10 }
    ]
  }
  server.send({
    id: 880,
    method: 'item/tool/call',
    params: {
      threadId: 'thread-1',
      turnId: 'turn-1',
      callId: 'cancelled-coordinator',
      tool: 'prepare_and_apply_design',
      arguments: {
        parts: [
          { key: 'a', draft },
          { key: 'b', draft }
        ],
        inspection: 'defer'
      }
    }
  })
  await checked
  expect(executeBatch).toHaveBeenCalledTimes(1)
  expect(server.child.kill).toHaveBeenCalledOnce()
  expect(JSON.stringify(retainedRecords)).toContain(
    'acknowledged-before-cancel'
  )
  const applied = progress.find(
    (event) => event.tool === 'app-batch' && event.status === 'completed'
  )
  expect(applied?.activity?.parentCallId).toEqual(expect.any(String))
  expect(applied?.activity?.parentCallId).not.toBe('cancelled-coordinator')
  expect(progress).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        activity: expect.objectContaining({
          callId: applied?.activity?.parentCallId,
          parentCallId: 'cancelled-coordinator'
        })
      })
    ])
  )
})

it('isolates overlapping provider requests with identical call IDs and cancellation after an acknowledged write', async () => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const { default: recorded } =
    await import('./fixtures/recorded-101/ordered-preparation-20261019.json')
  const first = fakeServer({ hold: true, manualToolReplies: true })
  const second = fakeServer({ hold: true, manualToolReplies: true })
  const controller = new AbortController()
  let release!: () => void
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  const firstWrites = vi.fn(
    async (batch: AiActionBatch): Promise<AiBatchReceipt> => {
      await held
      return {
        context: {},
        actionResults: batch.actions.map((action) => ({
          actionId: action.id,
          actionName: action.name,
          result: { status: 'complete', compositionId: 'first-request-root' }
        }))
      }
    }
  )
  const secondWrites = vi.fn(async (): Promise<AiBatchReceipt> => ({
    context: {},
    actionResults: []
  }))
  const requestInput = {
    ...input,
    actions: [
      {
        name: AiActionNames.APPLY_PREPARED_DESIGN,
        description: 'Apply',
        inputSchema: {}
      }
    ]
  }
  const firstRequest = requestLocalAiActionBatch(requestInput, {
    model: 'selected-model',
    executable: 'codex',
    executeBatch: firstWrites,
    signal: controller.signal,
    onProgress: (event) => {
      if (event.tool === 'app-batch' && event.status === 'completed')
        controller.abort()
    }
  })
  const cancelled = expect(firstRequest).rejects.toMatchObject({
    code: 'AI_MODEL_BACKEND_ABORTED'
  })
  await untilTurn(first.packets)
  const secondRequest = requestLocalAiActionBatch(requestInput, {
    model: 'selected-model',
    executable: 'codex',
    executeBatch: secondWrites
  })
  await untilTurn(second.packets)
  const send = (
    server: typeof first,
    id: number,
    tool: string,
    args: unknown
  ) =>
    server.send({
      id,
      method: 'item/tool/call',
      params: {
        threadId: 'thread-1',
        turnId: 'turn-1',
        callId: `shared-call-${id}`,
        tool,
        arguments: args
      }
    })
  const read = async (id: number) => {
    await vi.waitFor(() =>
      expect(second.packets.some((p) => p.id === id)).toBe(true)
    )
    const packet = second.packets.find((p) => p.id === id) as unknown as {
      result: { success: boolean; contentItems: { text: string }[] }
    }
    return {
      success: packet.result.success,
      value: JSON.parse(packet.result.contentItems[0].text)
    }
  }
  try {
    send(first, 900, 'prepare_and_apply_design', {
      parts: [
        recorded.input.parts[0],
        { ...recorded.input.parts[0], key: 'unstarted-suffix' }
      ],
      inspection: 'defer'
    })
    await vi.waitFor(() => expect(firstWrites).toHaveBeenCalledTimes(1))
    send(second, 900, 'prepare_design', {
      draft: recorded.input.parts[1].draft
    })
    const rejected = await read(900)
    expect(rejected.success).toBe(false)
    expect(rejected.value).toMatchObject({
      recovery: 'correct_input',
      draftId: expect.any(String),
      toolOutcome: { status: 'failed', settlement: 'not-started' }
    })
    expect(rejected.value.message).toContain('nonplanar face')
    expect(rejected.value.executionResult).toBeUndefined()
    expect(first.packets.some((p) => p.id === 900)).toBe(false)
    release()
    await cancelled
    expect(firstWrites).toHaveBeenCalledTimes(1)
    expect(first.child.kill).toHaveBeenCalledOnce()
    expect(second.child.kill).not.toHaveBeenCalled()
    send(second, 901, 'prepare_design', {
      repair: {
        draftId: rejected.value.draftId,
        replacements: [
          {
            path: '/children',
            value: [
              {
                type: 'rect',
                key: 'repaired',
                name: 'Repaired part',
                width: 20,
                height: 20
              }
            ]
          }
        ]
      }
    })
    const repaired = await read(901)
    expect(repaired.success).toBe(true)
    expect(repaired.value).toMatchObject({
      available: true,
      applicable: true,
      artifactId: expect.any(String)
    })
    expect(secondWrites).not.toHaveBeenCalled()
    expect(JSON.stringify(retainedRecords)).toContain('first-request-root')
  } finally {
    release()
    controller.abort()
    second.finish()
    await Promise.all([cancelled, secondRequest])
  }
})

it('rejects the recorded context selector at provider admission and preserves explicit retained refinement', async () => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
  vi.stubGlobal('window', {})
  const { default: recorded } =
    await import('./fixtures/recorded-101/context-query-20261019.json')
  const { createDocumentContextAction, createDocumentContextReleaseAction } =
    await import('../../src/ai/context-action')
  const { createRetainedDesignContext } =
    await import('../../src/common-apis/retained-design-context')
  const children = vi.fn(() => ({
    available: true,
    elementIds: ['crown', 'base'],
    total: 2,
    nextOffset: null
  }))
  const store = createRetainedDesignContext(
    {
      getCurrentWorkspaceId: () => 'workspace',
      getSelectedElementIds: () => [],
      getElementChildren: children,
      getElementIdsInBounds: () => [],
      getElementMetadata: (id) => ({
        name: id,
        type: 'group',
        parentId: 'workspace'
      }),
      getElementComputedData: () => ({})
    },
    () => () => undefined
  )
  const action = createDocumentContextAction(store.read)
  const release = createDocumentContextReleaseAction(store.read)
  const signal = new AbortController().signal
  const executeBatch = vi.fn(
    async (batch: AiActionBatch): Promise<AiBatchReceipt> => ({
      context: {},
      actionResults: await Promise.all(
        batch.actions.map(async (entry) => ({
          actionId: entry.id,
          actionName: entry.name,
          result: JSON.parse(
            JSON.stringify(
              await (entry.name === release.name ? release : action).execute(
                entry.arguments as never,
                { signal }
              )
            )
          )
        }))
      )
    })
  )
  const server = fakeServer({ hold: true, manualToolReplies: true })
  const request = requestLocalAiActionBatch(
    {
      ...input,
      actions: [action, release].map((definition) =>
        createAiToolContract(JSON.parse(JSON.stringify(definition)))
      )
    },
    {
      model: 'selected-model',
      executable: 'codex',
      executeBatch
    }
  )
  await untilTurn(server.packets)
  let id = 1200
  const call = async (args: unknown, success: boolean) => {
    const current = ++id
    server.send({
      id: current,
      method: 'item/tool/call',
      params: {
        threadId: 'thread-1',
        turnId: 'turn-1',
        callId: `context-${current}`,
        tool: action.name,
        arguments: { arguments: args }
      }
    })
    await vi.waitFor(() =>
      expect(server.packets.some((packet) => packet.id === current)).toBe(true)
    )
    const packet = server.packets.find(
      (packet) => packet.id === current
    ) as unknown as {
      result: { success: boolean; contentItems: { text: string }[] }
    }
    const result = JSON.parse(packet.result.contentItems[0].text)
    expect(packet.result.success, JSON.stringify(result)).toBe(success)
    return result
  }
  try {
    const rejected = await call(recorded, false)
    expect(JSON.stringify(rejected)).toContain('filter')
    expect(JSON.stringify(rejected)).toContain('allowed fields:')
    expect(executeBatch).not.toHaveBeenCalled()
    expect(children).not.toHaveBeenCalled()
    const parent = await call({ scope: 'children' }, true)
    const serialized = JSON.stringify(parent)
    expect(serialized).toContain('snapshotId')
    const captured = await executeBatch.mock.results[0].value
    const reference = captured.actionResults[0].result as { snapshotId: string }
    const refined = await call(
      {
        scope: 'snapshot',
        snapshotId: reference.snapshotId,
        filter: { name: { equals: 'base' } },
        delivery: 'page'
      },
      true
    )
    expect(JSON.stringify(refined)).toContain('base')
    expect(children).toHaveBeenCalledTimes(1)
    await call(recorded, false)
    expect(
      store.get(reference.snapshotId, undefined, signal).orderedIds
    ).toEqual(['crown', 'base'])
  } finally {
    server.finish()
    await request
    store.dispose()
    vi.unstubAllGlobals()
  }
})

it('delivers canonical compact usage through the provider and consumes its actual batch route', async () => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const action = basicApiContracts.find(
    (item) => item.operation === 'hierarchy.moveElementsRelative'
  )
  if (!action) throw new Error('Missing canonical anchor operation')
  const followup = vi.fn((reply: Record<string, unknown>) => {
    const usage = (
      reply.apis as {
        invocationExample: { invocation: { tool: string; arguments: unknown } }
        elementBindings: unknown[]
      }[]
    )[0]
    expect(usage.elementBindings).toContainEqual({
      schemaPath: '/properties/request/properties/anchorId',
      mode: 'one'
    })
    return {
      name: usage.invocationExample.invocation.tool,
      args: usage.invocationExample.invocation.arguments
    }
  })
  const server = fakeServer({
    toolCall: true,
    toolName: 'describe_design_apis',
    toolArguments: { names: [action.name], view: 'usage' },
    followupTool: followup
  })
  spawn.mockReturnValue(server.child)
  const executeBatch = vi.fn(async (value: AiActionBatch) => ({
    context: {},
    actionResults: value.actions.map((item) => ({
      actionId: item.id,
      actionName: item.name,
      result: {
        value: { moves: [] },
        status: 'no-change',
        mutationScope: { complete: true, elementIds: [], removedElementIds: [] }
      }
    }))
  }))
  const progress: {
    status: string
    activity?: { callId: string; outcome?: unknown }
  }[] = []
  await requestConfiguredAiActionBatch(
    {
      ...input,
      actions: [
        createAiToolContract({
          ...action,
          ...toolSemantics(basicApiResultSchema(action), 'mutation', [
            'document'
          ]),
          composition: 'allowed'
        })
      ]
    },
    { environment, executeBatch, onProgress: (event) => progress.push(event) }
  )
  expect(
    progress.filter(
      (event) =>
        event.status === 'completed' && event.activity?.callId === 'call-1'
    )
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        activity: expect.objectContaining({
          outcome: { status: 'success', settlement: 'completed' }
        })
      })
    ])
  )
  expect(followup).toHaveBeenCalledOnce()
  expect(executeBatch).toHaveBeenCalledOnce()
  expect(executeBatch.mock.calls[0][0].actions[0].arguments).toEqual({
    request: {
      elementIds: ['example-element'],
      anchorId: 'example-anchor',
      placement: 'before'
    }
  })
  expect(server.packets.find((packet) => packet.id === 100)).toMatchObject({
    result: { success: true }
  })
})

it.each([
  'prepare_design',
  'prepare_and_apply_design',
  'define_design_criteria'
])(
  'delivers high-level usage through provider transport and invokes the real %s owner',
  async (name) => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const server = fakeServer({
      toolCall: true,
      toolName: 'describe_design_apis',
      toolArguments: { names: [name], view: 'usage' },
      followupTool: (reply) => {
        const usage = (
          reply.tools as {
            invocationExample: {
              illustrative: boolean
              invocation: { tool: string; arguments: Record<string, unknown> }
            }
            inputFields: string[]
          }[]
        )[0]
        expect(usage.invocationExample.illustrative).toBe(true)
        const invocation = usage.invocationExample.invocation
        expect(invocation.tool).toBe(name)
        if (name !== 'define_design_criteria')
          expect(usage.inputFields).toContain('/properties/draft')
        return {
          name: invocation.tool,
          args: {
            ...invocation.arguments,
            ...(name === 'prepare_and_apply_design'
              ? { inspection: 'defer' }
              : {})
          }
        }
      }
    })
    spawn.mockReturnValue(server.child)
    const executeBatch = vi.fn(async (value: AiActionBatch) => ({
      context: {},
      actionResults: value.actions.map((action) => {
        expect(action.name).toBe(AiActionNames.APPLY_PREPARED_DESIGN)
        expect(action.arguments).toHaveProperty('design.entries')
        return {
          actionId: action.id,
          actionName: action.name,
          result: { status: 'complete', compositionId: 'provider-owner-root' }
        }
      })
    }))
    await requestConfiguredAiActionBatch(
      {
        ...input,
        actions: [
          {
            name: AiActionNames.APPLY_PREPARED_DESIGN,
            description: 'Apply',
            inputSchema: {}
          },
          {
            name: AiActionNames.INSPECT_DRAWING,
            description: 'Inspect',
            inputSchema: {}
          }
        ]
      },
      { environment, executeBatch }
    )
    const thread = server.packets.find(
      (packet) => packet.method === 'thread/start'
    )?.params
    expect(String(thread?.baseInstructions)).toContain('schemaPaths')
    const description =
      nativeToolDefinitions(thread).find(
        (tool) => tool.name === 'describe_design_apis'
      )?.description ?? ''
    const pattern =
      /Information forwarding example[^\n]*\n```javascript\n([\s\S]*?)\n```/
    expect(String(thread?.developerInstructions)).toContain(
      'Decision-required contract fields use the bounded information example'
    )
    const published = pattern.exec(description)?.[1]
    expect(published).toBeTruthy()
    if (!published) throw new Error('Missing advertised information example')
    expect(pattern.exec(String(thread?.developerInstructions))?.[1]).toBe(
      published
    )
    const values = new Map<string, unknown>()
    const forward = vi.fn()
    const original = JSON.stringify({
      route: 'text-only-control',
      toolOutcome: { status: 'success', settlement: 'completed' }
    })
    runInNewContext(published, {
      result: original,
      deliveryKey: 'provider-control',
      text: forward,
      load: (key: string) => values.get(key),
      store: (key: string, value: unknown) => values.set(key, value)
    })
    expect(forward).toHaveBeenCalledExactlyOnceWith(original)
    expect(values.get('provider-control')).toMatchObject({
      complete: true,
      value: JSON.parse(original)
    })

    expect(
      nativeToolDefinitions(thread).find(
        (tool) => tool.name === 'describe_design_apis'
      )?.description
    ).toContain('exact selectors default to full')
    expect(server.packets.find((packet) => packet.id === 100)).toMatchObject({
      result: { success: name !== 'prepare_and_apply_design' }
    })
    if (name === 'prepare_and_apply_design') {
      const packet = server.packets.find(
        (packet) => packet.id === 100
      ) as unknown as {
        result: { contentItems: { text: string }[] }
      }
      expect(
        JSON.parse(packet.result.contentItems[0].text).toolOutcome
      ).toMatchObject({ status: 'partial', settlement: 'completed' })
    }
    expect(executeBatch).toHaveBeenCalledTimes(
      name === 'prepare_and_apply_design' ? 1 : 0
    )
  }
)

it('replays saved full discovery and delivery recovery through the provider without dispatching mutations', async () => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
  let firstSchema: unknown
  const server = fakeServer({
    toolCall: true,
    toolName: 'describe_design_apis',
    toolArguments: recordedDiscoveryDelivery.calls[0].input,
    followupTool: (reply) => {
      const tools = reply.tools as {
        name: string
        inputSchema: unknown
        definition: { coverage: string }
      }[]
      expect(tools.map((tool) => tool.name)).toEqual(
        recordedDiscoveryDelivery.calls[0].input.names
      )
      expect(tools.every((tool) => tool.definition.coverage === 'full')).toBe(
        true
      )
      firstSchema = tools[0].inputSchema
      return {
        name: 'describe_design_apis',
        args: recordedDiscoveryDelivery.calls[1].input
      }
    }
  })
  spawn.mockReturnValue(server.child)
  const executeBatch = vi.fn()
  await requestConfiguredAiActionBatch(
    {
      ...input,
      actions: [
        {
          name: AiActionNames.APPLY_PREPARED_DESIGN,
          description: 'Apply',
          inputSchema: {}
        },
        {
          name: AiActionNames.INSPECT_DRAWING,
          description: 'Inspect',
          inputSchema: {}
        }
      ]
    },
    { environment, executeBatch }
  )
  const reply = server.packets.find(
    (packet) => packet.id === 100
  ) as unknown as {
    result: { success: boolean; contentItems: { text: string }[] }
  }
  expect(reply.result.success).toBe(true)
  const recovered = JSON.parse(reply.result.contentItems[0].text).tools[0]
  expect(recovered.inputSchema).toEqual(firstSchema)
  expect(recovered.definition).toMatchObject({
    coverage: 'full',
    deliveryReason: 'recovery',
    recoveryReason: 'delivery-failure'
  })
  expect(executeBatch).not.toHaveBeenCalled()
})

it.each([
  [
    'full',
    [
      {
        type: 'inputText',
        text: JSON.stringify({
          schema: {
            additionalProperties: false,
            required: ['color'],
            title: '材質'
          }
        })
      }
    ],
    'available'
  ],
  [
    'changed',
    [{ type: 'inputText', text: JSON.stringify({ omitted: ['schema'] }) }],
    'available'
  ],
  ['missing', undefined, 'unavailable'],
  ['null', null, 'unavailable'],
  ['empty', [], 'empty'],
  ['malformed', 'invalid', 'malformed'],
  [
    'invalid-text',
    [{ type: 'inputText', text: 'opaque secret text' }],
    'available'
  ]
])(
  'retains native delivery boundary %s without claiming model visibility',
  async (_name, contentItems, status) => {
    const server = fakeServer({ hold: true, manualToolReplies: true })
    const executeBatch = vi.fn()
    const request = requestConfiguredAiActionBatch(
      {
        ...input,
        actions: [
          ...input.actions,
          {
            name: AiActionNames.APPLY_PREPARED_DESIGN,
            description: 'Apply',
            inputSchema: {}
          },
          {
            name: AiActionNames.INSPECT_DRAWING,
            description: 'Inspect',
            inputSchema: {}
          }
        ]
      },
      { environment, executeBatch }
    )
    await untilTurn(server.packets)
    server.send({
      id: 99,
      method: 'item/tool/call',
      params: {
        threadId: 'thread-1',
        turnId: 'turn-1',
        callId: 'delivery-1',
        tool: 'describe_design_apis',
        arguments: { names: ['create_rectangle'] }
      }
    })
    await vi.waitFor(() =>
      expect(server.packets.some((p) => p.id === 99)).toBe(true)
    )
    server.notify('item/completed', {
      item: {
        type: 'dynamicToolCall',
        id: 'delivery-1',
        tool: 'describe_design_apis',
        status: 'completed',
        success: true,
        contentItems
      }
    })
    server.finish()
    await request
    const saved = retainedPayloads.find((p) => p.callId === 'item:delivery-1')
    expect(saved?.value).toMatchObject({
      stage: 'native-completed-result',
      status,
      modelVisibility: 'unavailable'
    })
    if (
      Array.isArray(contentItems) &&
      contentItems.length &&
      _name !== 'invalid-text'
    ) {
      expect(saved?.value).toMatchObject({
        content: [
          {
            value: JSON.parse(contentItems[0].text),
            bytes: Buffer.byteLength(contentItems[0].text)
          }
        ]
      })
    }
    if (_name === 'invalid-text')
      expect(JSON.stringify(saved)).not.toContain('opaque secret text')
    expect(executeBatch).not.toHaveBeenCalled()
  }
)

it('correlates interleaved native delivery results with their original calls and preserves real schemas', async () => {
  const server = fakeServer({ hold: true, manualToolReplies: true })
  const executeBatch = vi.fn()
  const request = requestConfiguredAiActionBatch(
    {
      ...input,
      actions: [
        ...input.actions,
        {
          name: AiActionNames.APPLY_PREPARED_DESIGN,
          description: 'Apply',
          inputSchema: {}
        },
        {
          name: AiActionNames.INSPECT_DRAWING,
          description: 'Inspect',
          inputSchema: {}
        }
      ]
    },
    { environment, executeBatch }
  )
  await untilTurn(server.packets)
  for (const [id, tool, args] of [
    [91, 'describe_design_apis', recordedDiscoveryDelivery.calls[0].input],
    [
      92,
      'read_knowledge',
      {
        ids: ['design.architectural-illustration'],
        contexts: ['architectural-illustration']
      }
    ]
  ] as const) {
    server.send({
      id,
      method: 'item/tool/call',
      params: {
        threadId: 'thread-1',
        turnId: 'turn-1',
        callId: `delivery-${id}`,
        tool,
        arguments: args
      }
    })
  }
  await vi.waitFor(() =>
    expect(
      server.packets.filter((p) => p.id === 91 || p.id === 92)
    ).toHaveLength(2)
  )
  for (const [id, tool] of [
    [92, 'read_knowledge'],
    [91, 'describe_design_apis']
  ] as const) {
    const response = server.packets.find((p) => p.id === id) as unknown as {
      result: { contentItems: { type: string; text: string }[] }
    }
    server.notify('item/completed', {
      item: {
        type: 'dynamicToolCall',
        id: `delivery-${id}`,
        tool,
        status: 'completed',
        success: true,
        contentItems: response.result.contentItems
      }
    })
  }
  server.finish()
  await request
  for (const id of [91, 92]) {
    const response = server.packets.find((p) => p.id === id) as unknown as {
      result: { contentItems: { text: string }[] }
    }
    const saved = retainedPayloads.find(
      (p) => p.callId === `item:delivery-${id}`
    )
    expect(saved?.value).toMatchObject({
      toolCallId: `delivery-${id}`,
      nativeThreadId: 'thread-1',
      nativeTurnId: 'turn-1',
      content: [{ value: JSON.parse(response.result.contentItems[0].text) }]
    })
  }
  expect(executeBatch).not.toHaveBeenCalled()
})

it.each(['complete', 'abort', 'disconnect'] as const)(
  'declares native output visibility without inventing execution on %s',
  async (ending) => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const server = fakeServer({ hold: true })
    const controller = new AbortController()
    const result = requestConfiguredAiActionBatch(input, {
      environment,
      signal: controller.signal
    }).then(
      (value) => ({ value }),
      (error) => ({ code: error.code })
    )
    await untilTurn(server.packets)
    const line = (
      thread: string,
      turn: string,
      id: string,
      completed = false
    ) =>
      `2026-10-21T15:16:25.904Z DEBUG codex_core::stream_events_utils: session_loop{thread_id=${thread}}:turn{turn.id="${turn}"}:${completed ? 'handle_output_item_done:' : ''} Output item item_type="custom_tool_call" item_id="${id}"\n`
    const started = line('thread-1', 'turn-1', 'ctc_pending')
    server.child.stderr.write(started.slice(0, 71))
    server.child.stderr.write(started.slice(71))
    server.child.stderr.write(line('other-thread', 'turn-1', 'ctc_wrong'))
    server.child.stderr.write(line('thread-1', 'other-turn', 'ctc_wrong'))
    server.child.stderr.write('PRIVATE DIAGNOSTIC '.repeat(3000) + started)
    server.child.stderr.write('PRIVATE REASONING\n')
    if (ending === 'complete') {
      server.child.stderr.write(line('thread-1', 'turn-1', 'ctc_pending', true))
      server.finish()
    } else if (ending === 'abort') controller.abort()
    else server.child.stdout.end()
    const outcome = await result
    if (ending === 'complete') expect(outcome).toEqual({ value: batch })
    else {
      const code =
        ending === 'abort'
          ? 'AI_MODEL_BACKEND_ABORTED'
          : 'AI_MODEL_BACKEND_TRANSPORT_FAILED'
      expect(outcome).toEqual({ code })
    }
    server.child.stderr.write(line('thread-1', 'turn-1', 'ctc_late'))
    const records = retainedRecords as {
      stage: string
      evidence: Record<string, unknown>
    }[]
    expect(
      records.filter((r) => r.stage === 'provider_output_item')
    ).toHaveLength(0)
    expect(
      records.find(
        (r) =>
          r.stage === 'provider_notification' &&
          r.evidence?.method === 'app/output-visibility'
      )?.evidence
    ).toMatchObject({
      source: 'native-public-protocol',
      coverage: {
        count: 5,
        truncated: false,
        items: [
          { kind: 'public-item-lifecycle', status: 'available' },
          { kind: 'app-invocation', status: 'available' },
          { kind: 'pre-dispatch-output-item', status: 'unavailable' },
          { kind: 'tool-argument-deltas', status: 'unavailable', bytes: null },
          { kind: 'generation-versus-stall', status: 'unavailable' }
        ]
      }
    })
    expect(JSON.stringify(records)).not.toMatch(
      /PRIVATE DIAGNOSTIC|PRIVATE REASONING|ctc_wrong|ctc_late/
    )
    expect(records.filter((r) => r.stage === 'tool_started')).toHaveLength(0)
  }
)

it('delivers failed inspection lookup and successful narrow recovery through native protocol', async () => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const server = fakeServer({
    toolCall: true,
    toolName: 'describe_design_apis',
    toolArguments: inspectionDiscovery.query,
    followupTool: (reply) => {
      expect(reply.toolOutcome).toMatchObject({
        status: 'failed',
        settlement: 'completed'
      })
      const tools = reply.tools as {
        schemaResolution: {
          narrowerQuery: { tool: string; arguments: unknown }
        }
      }[]
      return {
        name: tools[0].schemaResolution.narrowerQuery.tool,
        args: tools[0].schemaResolution.narrowerQuery.arguments
      }
    }
  })
  spawn.mockReturnValue(server.child)
  const executeBatch = vi.fn()
  await requestConfiguredAiActionBatch(
    {
      ...input,
      actions: [
        {
          name: AiActionNames.INSPECT_DRAWING,
          description: 'Inspect',
          inputSchema: {}
        }
      ]
    },
    { environment, executeBatch }
  )
  const replies = [99, 100].map(
    (id) =>
      server.packets.find((p) => p.id === id) as unknown as {
        result: { success: boolean; contentItems: { text: string }[] }
      }
  )
  expect(replies.map((r) => r.result.success)).toEqual([false, true])
  expect(
    JSON.parse(replies[1].result.contentItems[0].text).tools[0]
      .schemaFragments[0].path
  ).toBe('/properties/inspections')
  const thread = server.packets.find((p) => p.method === 'thread/start')?.params
  expect(
    nativeToolDefinitions(thread).find((t) => t.name === 'describe_design_apis')
      ?.description
  ).toContain('same schemaPaths list')
  expect(executeBatch).not.toHaveBeenCalled()
})

describe('bounded evaluation reporting', () => {
  it.each(['saved', 'storage-failed'])(
    'interrupts work and reports in the same thread with %s evidence',
    async (mode) => {
      if (mode === 'storage-failed')
        vi.spyOn(retainedPayloads, 'push').mockImplementation((entry) => {
          if (entry.callId === 'evaluation-report')
            throw new Error('Storage unavailable')
          return Array.prototype.push.call(retainedPayloads, entry)
        })
      const controller = new AbortController()
      const executeBatch = vi.fn()
      const report = {
        batchId: 'evaluation-report',
        actions: [
          {
            id: 'report',
            name: 'report_outcome',
            arguments: {
              outcome: 'unsupported',
              message:
                'First frame not produced. Cause uncertain; tool acquisition consumed the work window.'
            },
            summary: 'Evaluation self-report'
          }
        ]
      }
      let turns = 0
      const server = fakeServer({
        hold: true,
        holdMethod: 'turn/start',
        manualToolReplies: true,
        onRequest(packet) {
          if (packet.method === 'turn/start') {
            turns++
            const turnId = turns === 1 ? 'turn-1' : 'report-turn'
            server.send({ id: packet.id, result: { turn: { id: turnId } } })
            if (turns === 2) {
              server.send({
                id: 700,
                method: 'item/tool/call',
                params: {
                  threadId: 'thread-1',
                  turnId,
                  callId: 'late-tool',
                  tool: 'describe_design_apis',
                  arguments: { query: 'create rectangle' }
                }
              })
              server.notify('item/completed', {
                turnId,
                item: {
                  type: 'agentMessage',
                  phase: 'final_answer',
                  text: JSON.stringify(report)
                }
              })
              server.notify('turn/completed', {
                turnId,
                turn: { id: turnId, status: 'completed' }
              })
            }
          }
          if (packet.method === 'turn/interrupt')
            queueMicrotask(() =>
              server.notify('turn/completed', {
                turn: { id: 'turn-1', status: 'interrupted' }
              })
            )
        }
      })
      const result = requestLocalAiActionBatch(
        {
          ...input,
          metadata: {
            evaluationWindow: {
              workDeadlineAt: Date.now() + 150,
              reportTimeoutMs: 500
            }
          }
        },
        {
          model: 'selected-model',
          executable: 'codex',
          executeBatch,
          signal: controller.signal
        }
      )
      void result.catch(() => undefined)
      try {
        await vi.waitFor(() => expect(turns).toBe(2), { timeout: 1000 })
        const value = await result
        expect(value).toMatchObject({ actions: report.actions })
        expect(executeBatch).not.toHaveBeenCalled()
        expect(
          server.packets.filter((p) => p.method === 'thread/start')
        ).toHaveLength(1)
        expect(
          server.packets
            .filter((p) => p.method === 'turn/start')
            .map((p) => p.params.threadId)
        ).toEqual(['thread-1', 'thread-1'])
        expect(server.packets.find((p) => p.id === 700)?.result).toMatchObject({
          success: false
        })
        expect(JSON.stringify(retainedRecords)).toContain('evaluation-report')
        if (mode === 'storage-failed') {
          expect(retainedRecords).toContainEqual(
            expect.objectContaining({
              stage: 'host_observation',
              evidence: expect.objectContaining({
                callId: 'evaluation-report',
                status: 'failed'
              })
            })
          )
        } else {
          expect(
            retainedPayloads.filter((p) => p.callId === 'evaluation-report')
          ).toHaveLength(2)
          expect(
            retainedPayloads.find(
              (p) =>
                p.callId === 'evaluation-report' &&
                typeof (p.value as { text?: unknown }).text === 'string'
            )?.value
          ).toMatchObject({
            attribution: 'model-self-report',
            text: JSON.stringify(report)
          })
        }
      } finally {
        controller.abort()
        await result.catch(() => undefined)
      }
    }
  )
})

it.each([
  'report-timeout',
  'interrupt-timeout',
  'invalid-report',
  'early-completion',
  'cancel-report',
  'startup-timeout'
] as const)(
  'keeps bounded evaluation %s distinct from drawing completion',
  async (mode) => {
    const controller = new AbortController()
    let turns = 0
    const server = fakeServer({
      hold: true,
      holdMethod: mode === 'startup-timeout' ? 'initialize' : 'turn/start',
      onRequest(packet) {
        if (packet.method === 'turn/start') {
          turns++
          const turnId = turns === 1 ? 'turn-1' : 'report-turn'
          server.send({ id: packet.id, result: { turn: { id: turnId } } })
          if (turns === 1 && mode === 'early-completion') {
            server.finish()
          } else if (turns === 2 && mode === 'cancel-report') {
            queueMicrotask(() => controller.abort())
          } else if (
            turns === 2 &&
            (mode === 'invalid-report' || mode === 'early-completion')
          ) {
            const report =
              mode === 'invalid-report'
                ? batch
                : {
                    batchId: 'report',
                    actions: [
                      {
                        id: 'report',
                        name: 'report_outcome',
                        arguments: {
                          outcome: 'unsupported',
                          message:
                            'Public report; missing evidence remains uncertain.'
                        },
                        summary: 'Report'
                      }
                    ]
                  }
            server.notify('item/completed', {
              turnId,
              item: {
                type: 'agentMessage',
                phase: 'final_answer',
                text: JSON.stringify(report)
              }
            })
            server.notify('turn/completed', {
              turnId,
              turn: { id: turnId, status: 'completed' }
            })
          }
        }
        if (packet.method === 'turn/interrupt' && mode !== 'interrupt-timeout')
          queueMicrotask(() =>
            server.notify('turn/completed', {
              turn: { id: 'turn-1', status: 'interrupted' }
            })
          )
      }
    })
    const executeBatch = vi.fn()
    const result = requestLocalAiActionBatch(
      {
        ...input,
        metadata: {
          evaluationWindow: {
            workDeadlineAt: Date.now() + 100,
            reportTimeoutMs: 100
          }
        }
      },
      {
        model: 'selected-model',
        executable: 'codex',
        executeBatch,
        signal: controller.signal
      }
    )
    if (mode === 'early-completion') {
      expect(await result).toMatchObject({
        explanation: 'Evaluation self-report - not artwork acceptance'
      })
      expect(server.packets.some((p) => p.method === 'turn/interrupt')).toBe(
        false
      )
    } else {
      let code = 'AI_MODEL_BACKEND_TIMEOUT'
      if (mode === 'invalid-report') code = 'AI_MODEL_BACKEND_INVALID_RESPONSE'
      if (mode === 'cancel-report') code = 'AI_MODEL_BACKEND_ABORTED'
      await expect(result).rejects.toMatchObject({ code })
    }
    expect(executeBatch).not.toHaveBeenCalled()
    expect(server.child.kill).toHaveBeenCalled()
  }
)

it('does not begin inference for an expired evaluation window', async () => {
  const server = fakeServer({ hold: true })
  await expect(
    requestLocalAiActionBatch(
      {
        ...input,
        metadata: {
          evaluationWindow: {
            workDeadlineAt: Date.now() - 1,
            reportTimeoutMs: 100
          }
        }
      },
      { model: 'selected-model', executable: 'codex' }
    )
  ).rejects.toMatchObject({ code: 'AI_MODEL_BACKEND_TIMEOUT' })
  expect(server.packets.some((p) => p.method === 'turn/start')).toBe(false)
})

it('delivers the request-local evaluation budget through actual native discovery replies', async () => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const server = fakeServer({ hold: true, manualToolReplies: true })
  const controller = new AbortController()
  const request = requestLocalAiActionBatch(
    {
      ...input,
      actions: [
        { name: 'apply_prepared_design', description: 'Apply', inputSchema: {} }
      ],
      metadata: {
        evaluationWindow: {
          workDeadlineAt: Date.now() + 120000,
          reportTimeoutMs: 1000,
          expandedNodeLimit: 2000
        }
      }
    },
    {
      executable: 'scripted-protocol',
      model: 'selected-model',
      signal: controller.signal,
      executeBatch: vi.fn()
    }
  )
  const settled = request.catch((error) => error)
  try {
    await untilTurn(server.packets)
    server.send({
      id: 199,
      method: 'item/tool/call',
      params: {
        threadId: 'thread-1',
        turnId: 'turn-1',
        callId: 'budget-delivery',
        tool: 'describe_design_apis',
        arguments: {
          names: ['prepare_and_apply_design'],
          view: 'usage',
          inputScope: { operation: 'draft', nodeTypes: ['rect'] }
        }
      }
    })
    await vi.waitFor(() =>
      expect(server.packets.some((p) => p.id === 199)).toBe(true)
    )
    const text = JSON.stringify(
      server.packets.find((p) => p.id === 199)?.result
    )
    expect(text).toContain('2000 expanded objects')
    expect(text).not.toContain('10000 expanded objects')
  } finally {
    controller.abort()
    await settled
  }
})

it.each([
  {
    label: 'source-only original capabilities',
    arguments: capacityFixture.input,
    count: 9418,
    captureUnavailable: false
  },
  {
    label: 'saved brief and immediate inspection',
    arguments: briefFixture.input,
    count: 9857,
    captureUnavailable: true
  }
])(
  'continues capacity in one native call and preserves retained source ownership for later reads: $label',
  async (scenario) => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    let sourceId: unknown
    let firstReply: unknown
    const server = fakeServer({
      toolCall: true,
      toolName: 'prepare_and_apply_design',
      toolArguments: scenario.arguments,
      followupTool: (reply) => {
        firstReply = reply
        sourceId = (
          reply.parts as
            { preparationInput?: { draftId?: string } }[] | undefined
        )?.[0]?.preparationInput?.draftId
        return {
          name: 'prepare_design',
          args: { repair: { draftId: sourceId, partition: 0 } }
        }
      }
    })
    spawn.mockReturnValue(server.child)
    const executeBatch = vi.fn(async (batch: AiActionBatch) => ({
      context: {},
      actionResults: batch.actions.map(
        (action): AiBatchReceipt['actionResults'][number] => {
          if (action.name === AiActionNames.APPLY_PREPARED_DESIGN) {
            const { design } = action.arguments as {
              design: { entries: { descriptor: { id: string } }[] }
            }
            return {
              actionId: action.id,
              actionName: action.name,
              result: {
                status: 'complete' as const,
                compositionId: design.entries[0].descriptor.id,
                appliedElementIds: design.entries.map(
                  (entry) => entry.descriptor.id
                )
              }
            }
          }
          return {
            actionId: action.id,
            actionName: action.name,
            result: {
              complete: true,
              findings: [],
              measuredTextIds: [],
              evidence: { sessionId: 'capacity-native', revision: 1 }
            }
          }
        }
      )
    }))
    await requestConfiguredAiActionBatch(
      {
        ...input,
        actions: [
          ...(scenario.captureUnavailable
            ? [
                {
                  name: AiActionNames.INSPECT_DRAWING,
                  description: 'Inspect',
                  inputSchema: {}
                }
              ]
            : []),
          {
            name: AiActionNames.APPLY_PREPARED_DESIGN,
            description: 'Apply',
            inputSchema: {}
          },
          {
            name: AiActionNames.REVIEW_DESIGN,
            description: 'Review',
            inputSchema: {}
          }
        ]
      },
      { environment, executeBatch }
    )
    const packet = server.packets.find(
      (packet) => packet.id === 100
    ) as unknown as {
      result: { success: boolean; contentItems: { text: string }[] }
    }
    expect(firstReply, JSON.stringify(firstReply)).toMatchObject({
      status: scenario.captureUnavailable ? 'partial' : 'complete',
      toolOutcome: {
        status: scenario.captureUnavailable ? 'partial' : 'success',
        settlement: 'completed'
      },
      ...(scenario.captureUnavailable
        ? {
            inspectionIssues: [
              { message: expect.stringContaining('Capture is unavailable') }
            ]
          }
        : {})
    })
    // This native transport fixture has no browser pixels. Preserve its truthful
    // capture failure after both writes; capacity is not a failed preparation.
    expect(
      (firstReply as { parts: { toolOutcome: unknown }[] }).parts.map(
        (part) => part.toolOutcome
      )
    ).toEqual([
      expect.objectContaining({ status: 'success', settlement: 'completed' }),
      expect.objectContaining({ status: 'success', settlement: 'completed' })
    ])
    expect(sourceId).toEqual(expect.any(String))
    expect(packet.result.success, JSON.stringify(packet.result)).toBe(true)
    const prepared = JSON.parse(packet.result.contentItems[0].text)
    expect(prepared.preparationInput.draftId).toBe(sourceId)
    expect(prepared.elementCount).toBe(scenario.count)
    expect(prepared.applicable).toBe(true)
    expect(
      executeBatch.mock.calls
        .flatMap(([batch]) => batch.actions)
        .filter((action) => action.name === AiActionNames.APPLY_PREPARED_DESIGN)
    ).toHaveLength(2)
  }
)

it.each([1, 40])(
  'delivers %i settled interrupted owner receipts to the bounded report without restarting tools',
  async (actionCount) => {
    const report = {
      batchId: 'report',
      actions: [
        {
          id: 'report',
          name: 'report_outcome',
          arguments: {
            outcome: 'unsupported',
            message: 'Partial drawing retained; further work unconfirmed.'
          },
          summary: 'Report'
        }
      ]
    }
    let turns = 0
    let calls = 0
    let finishOwner!: () => void
    const interrupted = new Promise<void>((resolve) => {
      finishOwner = resolve
    })
    const executeBatch = vi.fn(async (batch: AiActionBatch) => {
      calls++
      await interrupted
      return {
        context: {},
        actionResults: batch.actions.map((action) => ({
          actionId: action.id,
          actionName: action.name,
          result: {
            status: 'partial',
            compositionId: 'root',
            appliedElementCount: 33,
            plannedElementCount: 41,
            appliedRange: { start: 0, end: 33 },
            geometry: 'OMITTED_GEOMETRY',
            recovery: 'UNTRUSTED_OWNER_TEXT'
          }
        })),
        failure: {
          code: 'AI_EXECUTION_FAILED',
          stage: 'execution',
          message: 'Stopped',
          settlement: 'partial',
          actionId: batch.actions[0].id,
          actionName: batch.actions[0].name,
          actionExecutionMs: 1,
          contextFresh: true
        }
      } as AiBatchReceipt
    })
    const server = fakeServer({
      hold: true,
      holdMethod: 'turn/start',
      manualToolReplies: true,
      onRequest(packet) {
        if (packet.method === 'turn/start') {
          turns++
          const turnId = turns === 1 ? 'turn-1' : 'report-turn'
          server.send({ id: packet.id, result: { turn: { id: turnId } } })
          if (turns === 1)
            server.send({
              id: 701,
              method: 'item/tool/call',
              params: {
                threadId: 'thread-1',
                turnId,
                callId: 'draw',
                tool: 'execute_design_batch',
                arguments: {
                  operations: Array.from({ length: actionCount }, () => ({
                    name: 'select_elements',
                    arguments: { elementIds: [] }
                  }))
                }
              }
            })
          else {
            server.notify('item/completed', {
              turnId,
              item: {
                type: 'agentMessage',
                phase: 'final_answer',
                text: JSON.stringify(report)
              }
            })
            server.notify('turn/completed', {
              turnId,
              turn: { id: turnId, status: 'completed' }
            })
          }
        }
        if (packet.method === 'turn/interrupt')
          queueMicrotask(() => {
            server.notify('turn/completed', {
              turn: { id: 'turn-1', status: 'interrupted' }
            })
            finishOwner()
          })
      }
    })
    spawn.mockReturnValue(server.child)
    await requestLocalAiActionBatch(
      {
        ...input,
        actions: [
          {
            name: 'select_elements',
            description: 'Select',
            inputSchema: {},
            effect: 'mutation'
          }
        ],
        metadata: {
          evaluationWindow: {
            workDeadlineAt: Date.now() + 150,
            reportTimeoutMs: 500
          }
        }
      },
      {
        model: 'selected-model',
        executable: 'codex',
        executeBatch,
        signal: new AbortController().signal
      }
    )
    expect(calls).toBe(1)
    expect(retainedRecords).toContainEqual(
      expect.objectContaining({
        stage: 'tool_failed',
        evidence: expect.objectContaining({
          callId: 'draw',
          settlement: 'partial',
          result: expect.objectContaining({
            batches: expect.objectContaining({ count: 1, truncated: false })
          })
        })
      })
    )
    const reportInput = server.packets.filter(
      (p) => p.method === 'turn/start'
    )[1].params.input
    expect(JSON.stringify(reportInput)).toContain('appliedElementCount')
    expect(JSON.stringify(reportInput)).toContain('33')
    expect(JSON.stringify(reportInput)).toContain('root')
    expect(JSON.stringify(reportInput)).not.toContain('OMITTED_GEOMETRY')
    expect(JSON.stringify(reportInput)).not.toContain('UNTRUSTED_OWNER_TEXT')
    const factText = (reportInput as { text: string }[])[1].text
    const facts = JSON.parse(factText.slice(factText.indexOf('{')))
    expect(facts.actionResultCount).toBe(actionCount)
    expect(facts.actionResults).toHaveLength(Math.min(32, actionCount))
    expect(facts.omittedActionResults).toBe(Math.max(0, actionCount - 32))
    expect(facts.batches).toMatchObject([
      { failure: { settlement: 'partial' } }
    ])
    expect(JSON.stringify(reportInput)).not.toContain(
      'plannedElementCount":41,"appliedElementCount":41'
    )
    expect(
      server.packets.filter((p) => p.method === 'turn/start')
    ).toHaveLength(2)
  }
)

it('delivers real interrupted Core results through Runtime and the native report handoff', async () => {
  vi.stubGlobal('window', {})
  const { default: core } = await import('@asyra/core')
  const { default: factory } = await import('@asyra/factory')
  const { default: props } = await import('@asyra/props-manager')
  const { default: scene } = await import('@asyra/scene-tree')
  const { applyPreset, PresetDefaults, PresetProfiles } =
    await import('@asyra/preset')
  const { createAiAgentRuntime } = await import('@asyra/ai-agent-runtime')
  const { createPreparedDesignAction } =
    await import('../../src/ai/design-actions')
  const { createAiActions } = await import('../../src/ai/actions')
  const { createAiTransactionRunner } = await import('../../src/ai/transaction')
  const { observeAiAction } = await import('../../src/ai/runtime-input')
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [
      PresetDefaults.BASIC_SHAPES,
      PresetDefaults.CONTAINERS,
      PresetDefaults.VECTOR,
      PresetDefaults.SELECTION
    ]
  })
  const initial = {
    version: '1.0.0',
    props: {},
    sceneTree: {
      workspace: 'workspace',
      workspaceList: ['workspace'],
      elements: {
        workspace: {
          id: 'workspace',
          type: 'workspace',
          name: 'Workspace',
          parentId: '',
          visible: true,
          lock: false,
          children: []
        }
      }
    }
  }
  core.load(initial)
  factory.transact.reset()
  const snapshot = () => ({
    version: '1.0.0',
    props: props.save(),
    sceneTree: scene.save()
  })
  let releaseOwner!: () => void
  const interrupted = new Promise<void>((resolve) => {
    releaseOwner = resolve
  })
  let yields = 0
  const action = observeAiAction(
    createPreparedDesignAction(undefined, async () => {
      if (++yields === 2) await interrupted
    })
  )
  const reportAction = createAiActions().find(
    (entry) => entry.name === AiActionNames.REPORT_OUTCOME
  )
  if (!reportAction) throw new Error('Missing report owner')
  let turns = 0
  let ownerReceipt: AiBatchReceipt | undefined
  let dispatchedBatches = 0
  let reportSnapshot: ReturnType<typeof snapshot> | undefined
  let facts:
    | {
        actionResults: {
          result?: unknown
          compositionId: string
          appliedElementCount: number
          plannedElementCount: number
          appliedRange: { start: number; end: number }
        }[]
      }
    | undefined
  const server = fakeServer({
    hold: true,
    holdMethod: 'turn/start',
    manualToolReplies: true,
    onRequest(packet) {
      if (packet.method === 'turn/start') {
        const turnId = ++turns === 1 ? 'turn-1' : 'report-turn'
        server.send({ id: packet.id, result: { turn: { id: turnId } } })
        if (turns === 1)
          server.send({
            id: 901,
            method: 'item/tool/call',
            params: {
              threadId: 'thread-1',
              turnId,
              callId: 'draw',
              tool: 'prepare_and_apply_design',
              arguments: {
                inspection: 'defer',
                response: 'compact',
                draft: {
                  type: 'group',
                  name: 'Facade',
                  children: Array.from({ length: 40 }, (_, index) => ({
                    type: 'rect',
                    key: `panel-${index}`,
                    name: `Panel ${index}`,
                    x: index * 50,
                    y: 20,
                    width: 30,
                    height: 40,
                    fill: '#246080'
                  }))
                }
              }
            }
          })
        else {
          const evidence = (packet.params.input as { text: string }[])[1].text
          facts = JSON.parse(evidence.slice(evidence.indexOf('{')))
          reportSnapshot = snapshot()
          // The protocol peer echoes supplied facts; it is not a model and does
          // not prove that a model would understand or choose this report.
          server.notify('item/completed', {
            turnId,
            item: {
              type: 'agentMessage',
              phase: 'final_answer',
              text: JSON.stringify({
                batchId: 'report',
                actions: [
                  {
                    id: 'report',
                    name: reportAction.name,
                    arguments: {
                      outcome: 'unsupported',
                      message: JSON.stringify(facts?.actionResults[0])
                    },
                    summary: 'Report retained work'
                  }
                ]
              })
            }
          })
          server.notify('turn/completed', {
            turnId,
            turn: { id: turnId, status: 'completed' }
          })
        }
      }
      if (packet.method === 'turn/interrupt') {
        server.notify('turn/completed', {
          turn: { id: 'turn-1', status: 'interrupted' }
        })
        releaseOwner()
      }
    }
  })
  spawn.mockReturnValue(server.child)
  const deadline = Date.now() + 1500
  const runtime = createAiAgentRuntime({
    provider: {
      requestActionBatch: async (providerInput, options) =>
        (await requestLocalAiActionBatch(
          {
            ...providerInput,
            metadata: {
              evaluationWindow: {
                workDeadlineAt: deadline,
                reportTimeoutMs: 3000
              }
            }
          },
          {
            model: 'selected-model',
            executable: 'codex',
            signal: options.signal,
            executeBatch: async (batch) => {
              dispatchedBatches++
              if (!options.executeBatch)
                throw new Error('Missing Runtime dispatcher')
              const receipt = await options.executeBatch(batch)
              ownerReceipt = receipt as AiBatchReceipt
              return ownerReceipt
            }
          }
        )) as AiActionBatch
    },
    actionDefinitions: [action, reportAction],
    contextProvider: { getContext: async () => ({}) },
    permissionPolicy: { evaluate: () => 'allow' },
    confirmationHandler: { confirm: async () => true },
    transactionRunner: createAiTransactionRunner({
      getMutationDeadline: () => deadline
    })
  })
  try {
    const result = await runtime.run({
      intent: 'Build facade',
      signal: new AbortController().signal
    })
    expect(ownerReceipt).toMatchObject({
      failure: { settlement: 'partial' },
      actionResults: [
        {
          result: {
            status: 'partial',
            appliedElementCount: 33,
            plannedElementCount: 41,
            appliedRange: { start: 0, end: 33 }
          }
        }
      ]
    })
    if (!ownerReceipt) throw new Error('Missing owner receipt')
    const owner = ownerReceipt.actionResults[0].result as {
      compositionId: string
    }
    expect(facts?.actionResults).toEqual([
      expect.objectContaining({
        actionId: ownerReceipt.actionResults[0].actionId,
        status: 'partial',
        compositionId: owner.compositionId,
        appliedElementCount: 33,
        plannedElementCount: 41,
        appliedRange: { start: 0, end: 33 }
      })
    ])
    expect(result.status).toBe('executed')
    expect(result.actionResults?.at(-1)?.result).toMatchObject({
      outcome: 'unsupported',
      message: JSON.stringify(facts?.actionResults[0])
    })
    expect(Object.keys(snapshot().sceneTree.elements)).toHaveLength(34)
    expect(snapshot()).toEqual(reportSnapshot)
    expect(yields).toBe(2)
    expect(dispatchedBatches).toBe(1)
    expect(factory.getUndoHistoryDepth()).toBe(1)
    expect(turns).toBe(2)
    expect(
      server.packets.filter((p) => p.method === 'turn/interrupt')
    ).toHaveLength(1)
  } finally {
    releaseOwner()
    await runtime.dispose()
    core.load(initial)
    factory.transact.reset()
    vi.unstubAllGlobals()
  }
}, 10000)

it('cancels attachment identity preparation before starting the native provider', async () => {
  fakeServer({})
  const controller = new AbortController()
  await expect(
    requestConfiguredAiActionBatch(
      { ...input, metadata: { imageAttachments: [await rasterAttachment()] } },
      {
        environment,
        signal: controller.signal,
        onProgress: (event) => {
          if (
            event.tool === 'reference_attachment_context' &&
            event.status === 'running'
          )
            controller.abort()
        }
      }
    )
  ).rejects.toMatchObject({ code: 'AI_MODEL_BACKEND_ABORTED' })
  expect(spawn).not.toHaveBeenCalled()
})

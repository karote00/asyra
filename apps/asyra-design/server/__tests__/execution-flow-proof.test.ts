import { createAiActivityProjection } from '../../src/ai/activity-state'
import * as providerCapabilities from '../local-ai-provider'
import {
  parseLocalVectorArtifact,
  prepareLocalVectorArtifact,
  LOCAL_VECTOR_REFERENCE_SCHEMA
} from '../local-vector-artifact'
import { reviewPlanExample } from '../local-design-review'
import { createDesignCheckResults } from '../design-check-results'
import type { ExecutionRecordGap } from '@asyra/ai-agent-runtime'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { projectAiActivity } from '../../src/ai/presentation'
import { createDocumentPersistenceQueue } from '../document-persistence-queue'
import { createLocalImageTools } from '../local-image-tools'
import { createLocalReferenceTools } from '../local-reference-tools'
import { referenceRejection } from '../reference-image-download'
import sharp from 'sharp'
import { createAiInvoker, exportExecutionTrace } from '@asyra/ai-agent-runtime'
import { designReportPolicy } from '../design-profiler-policy'
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
import { EventEmitter } from 'node:events'
import { PassThrough, Writable } from 'node:stream'
import { expect, it, vi } from 'vitest'
import { AiActionNames } from '../../src/constants/ai-actions'
import type {
  AiActionBatch,
  AiActionDescription,
  AiBatchReceipt
} from '../../src/ai/action-batch-protocol'
import type { PreparedDesign } from '../../src/ai/prepared-design'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalOperationTools as createOperationOwner } from '../local-operation-tools'
import type { LocalToolOwner } from '../local-tool-invocation'
// This declared proof file must remain self-contained in the isolated verifier.
/** Primary-agent fixture: explicitly request a binding before submitting authored verdicts.
 * No capture intent or verdict is inferred. Invalid/unavailable binding results are
 * returned directly, preserving the owner's recovery path and original assertions.
 */
const withReviewBindingActor = <T extends LocalToolOwner>(owner: T): T => {
  const call = owner.call.bind(owner)
  owner.call = async (name, input, signal) => {
    if (
      name !== AiDesignToolIds.REVIEW_DRAWING ||
      !input ||
      typeof input !== 'object' ||
      Array.isArray(input)
    )
      return call(name, input, signal)
    const value = input as Record<string, unknown>
    if (
      value.inspections ||
      !Array.isArray(value.checks) ||
      !value.checks.length ||
      value.checks.some(
        (check) => !check || typeof check !== 'object' || check.binding
      )
    )
      return call(name, input, signal)
    const bindingText = await call(
      name,
      {
        phase: value.phase,
        bindChecks: value.checks.map(
          ({ status: _status, evidence: _evidence, ...selection }) => selection
        )
      },
      signal
    )
    const binding = JSON.parse(bindingText)
    if (!binding.next?.arguments?.checks) return bindingText
    return call(
      name,
      {
        ...value,
        checks: value.checks.map((check, index) => ({
          ...check,
          binding: binding.next.arguments.checks[index].binding
        }))
      },
      signal
    )
  }
  return owner
}

const createLocalOperationTools = (
  ...args: Parameters<typeof createOperationOwner>
) => withReviewBindingActor(createOperationOwner(...args))
import { AiDesignToolIds } from '../../src/constants/ai-design'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import type { AiConversationFeature } from '../../src/ai/conversation'
import { createAiConversationController } from '../../src/ai/conversation'
import {
  createDesignPreparationSession,
  prepareDesign,
  prepareDesignAsync
} from '../design-preparation'
import { createAiExecutionProfiler as createProfiler } from '@asyra/ai-agent-runtime'
import {
  parseExecutionRecord,
  type ExecutionRecord
} from '@asyra/ai-agent-runtime/node'
import { evaluateExecution as evaluate } from '@asyra/ai-agent-runtime'
import { assessExecution } from '@asyra/ai-agent-runtime'
import { createLocalDesignReview } from '../local-design-review'
import { requestLocalAiActionBatch } from '../local-ai-provider'
import { createLocalToolScheduler } from '../local-tool-scheduler'
import { createLocalToolHost } from '../local-tool-host'

const { spawn } = vi.hoisted(() => ({ spawn: vi.fn() }))
vi.mock('node:child_process', () => ({ spawn }))

it('execution proof resolves batched semantic identities and applies ordered ready parts', async () => {
  const order: string[] = []
  const session = createDesignPreparationSession(prepareDesign, (...args) => {
    order.push('prepare')
    return prepareDesignAsync(...args)
  })
  const actions: AiActionDescription[] = JSON.parse(
    JSON.stringify([
      {
        name: AiActionNames.APPLY_PREPARED_DESIGN,
        description: 'Apply',
        inputSchema: {}
      },
      ...basicApiContracts
    ])
  )
  const designs = createLocalDesignTools(actions, session)
  const execute = vi.fn(
    async (batch: AiActionBatch): Promise<AiBatchReceipt> => {
      order.push('apply')
      return {
        context: {},
        actionResults: batch.actions.map((action) => ({
          actionId: action.id,
          actionName: action.name,
          result: {
            status: 'complete',
            compositionId: `actual-${order.length}`
          }
        }))
      }
    }
  )
  const operations = createLocalOperationTools(actions, designs, execute)
  const signal = new AbortController().signal
  const discovery = JSON.parse(
    await operations.call(
      'describe_design_apis',
      {
        operations: [
          'fill.updateFillsAtIndex',
          'hierarchy.moveElementsRelative'
        ],
        view: 'usage'
      },
      signal
    )
  )
  expect(discovery.apis).toHaveLength(2)
  expect(discovery.missingOperations).toEqual([])
  expect(execute).not.toHaveBeenCalled()
  const workflow = createLocalDesignWorkflow(designs, operations)
  const draft = {
    type: 'group',
    name: 'Part',
    children: [
      { type: 'rect', key: 'face', name: 'Face', width: 10, height: 10 }
    ]
  }
  const result = JSON.parse(
    await workflow.call(
      'prepare_and_apply_design',
      {
        parts: [
          { key: 'a', draft },
          { key: 'b', parentPart: 'a', draft }
        ],
        inspection: 'defer'
      },
      signal
    )
  )
  expect(result.status).toBe('complete')
  expect(order).toEqual(['prepare', 'apply', 'prepare', 'apply'])
  expect(execute.mock.calls[1][0].actions[0].arguments).toMatchObject({
    parentId: 'actual-2'
  })
})

it('execution proof reuses artifact prefix lookup without rereading every key', () => {
  const session = createDesignPreparationSession()
  const prepared = session.prepare({
    type: 'frame',
    name: 'Indexed targets',
    layout: 'absolute',
    width: 10000,
    height: 20,
    children: Array.from({ length: 2048 }, (_, index) => ({
      key: `part-${index}`,
      name: `Part ${index}`,
      type: 'rect',
      x: index * 4,
      y: 0,
      width: 2,
      height: 2
    }))
  })
  const tools = createLocalDesignTools([], session)
  const keyMap = session.resolve(prepared.artifactId).keyToId
  const expected = Object.keys(keyMap)
    .filter((key) => key.startsWith('part-10'))
    .map((key) => keyMap[key])
  const query = { artifactId: prepared.artifactId, keyPrefix: 'part-10' }
  const keys = vi.spyOn(Object, 'keys')
  try {
    expect(tools.resolveTargets(query)).toEqual(expected)
    keys.mockClear()
    expect(tools.resolveTargets(query)).toEqual(expected)
    expect(keys.mock.calls.filter(([value]) => value === keyMap)).toHaveLength(
      0
    )
    session.release([prepared.artifactId])
    expect(() => tools.resolveTargets(query)).toThrow(/unavailable/)
  } finally {
    keys.mockRestore()
  }
})

it('execution proof repairs rejected source through the same request preparation owner', async () => {
  const tools = createLocalDesignTools([
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply prepared document elements',
      inputSchema: {}
    }
  ])
  const signal = new AbortController().signal
  const source = {
    type: 'group',
    name: 'Parts',
    children: [0, 1].map(() => ({
      type: 'rect',
      name: 'Part',
      key: 'part',
      width: 10,
      height: 10
    }))
  }
  const rejected = JSON.parse(
    await tools.call(AiDesignToolIds.PREPARE_DESIGN, { draft: source }, signal)
  )
  expect(rejected.conflicts).toEqual([
    { key: 'part', paths: ['/children/0/key', '/children/1/key'] }
  ])
  const repaired = JSON.parse(
    await tools.call(
      AiDesignToolIds.PREPARE_DESIGN,
      {
        repair: {
          draftId: rejected.draftId,
          replacements: [{ path: '/children/1/key', value: 'second' }]
        }
      },
      signal
    )
  )
  expect(repaired.available).toBe(true)
  expect(
    tools.resolveTargets({
      artifactId: repaired.artifactId,
      keys: ['part', 'second']
    })
  ).toHaveLength(2)
  expect(source.children[1].key).toBe('part')
})

it('execution proof preserves partial lookup full recovery and declaration constraints', async () => {
  const action = {
    name: AiActionNames.ORGANIZE_DESIGN,
    description: 'Arrange',
    inputSchema: {
      type: 'object',
      required: ['elementIds'],
      properties: {
        elementIds: {
          type: 'array',
          uniqueItems: true,
          items: { type: 'string' }
        },
        note: { type: 'string', description: 'Long usage detail. '.repeat(100) }
      }
    }
  }
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    [action, { ...action, name: AiActionNames.REVIEW_DESIGN }],
    { modelActions: (v) => v, resolveBatch: (v) => v },
    execute,
    {
      getNativeTools: () =>
        tools.definitions
          .filter((tool) => tool.name === AiActionNames.REVIEW_DESIGN)
          .map((tool) => ({
            ...tool,
            namespace: 'design_operations'
          }))
    }
  )
  const read = async (args: unknown) =>
    JSON.parse(
      await tools.call(
        AiDesignToolIds.DESCRIBE_DESIGN_APIS,
        args,
        new AbortController().signal
      )
    ).apis[0]
  const fragment = await read({
    names: [action.name],
    schemaPaths: ['/properties/elementIds']
  })
  expect(fragment.schemaFragments[0].schema).toEqual(
    action.inputSchema.properties.elementIds
  )
  expect(fragment.definition.coverage).toBe('partial')
  const recovered = await read(fragment.definition.recover.arguments)
  expect(recovered.definition).toMatchObject({
    coverage: 'partial',
    deliveryReason: 'recovery',
    recoveryReason: 'delivery-failure'
  })
  expect(recovered.schemaFragments).toEqual(fragment.schemaFragments)
  expect(recovered.inputSchema).toBeUndefined()
  const full = await read({ names: [action.name] })
  expect(full.inputSchema).toEqual(action.inputSchema)
  const repeated = await read({ names: [action.name] })
  expect(repeated.definition.availableInResponse).toBe(false)
  expect(
    (await read(repeated.definition.refresh.arguments)).inputSchema
  ).toEqual(action.inputSchema)
  expect(JSON.stringify(fragment).length).toBeLessThan(
    JSON.stringify(full).length
  )
  const inspection = await read({ operations: [AiActionNames.REVIEW_DESIGN] })
  expect(inspection.execution).toEqual({
    kind: 'native-tool',
    namespace: 'design_operations',
    tool: AiActionNames.REVIEW_DESIGN,
    argumentField: 'arguments'
  })
  expect(
    JSON.stringify(
      tools.definitions.find(
        (tool) => tool.name === AiDesignToolIds.EXECUTE_DESIGN_BATCH
      )?.inputSchema
    )
  ).not.toContain(AiActionNames.REVIEW_DESIGN)
  const menu = JSON.parse(
    await tools.call(
      AiDesignToolIds.DESCRIBE_DESIGN_APIS,
      { query: 'review' },
      new AbortController().signal
    )
  )
  expect(
    menu.tools.some(
      (tool: { name: string }) => tool.name === AiActionNames.REVIEW_DESIGN
    )
  ).toBe(true)
  for (const entry of [...menu.apis, ...menu.tools]) {
    expect(entry.inputSchema).toBeUndefined()
    expect(entry.outputSchema).toBeUndefined()
  }
  expect(menu.guidance.references).toContain('native web research')
  expect(execute).not.toHaveBeenCalled()
})
vi.mock('@asyra/ai-agent-runtime/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@asyra/ai-agent-runtime/node')>()),
  createExecutionRecordSink: () => ({
    write: () => undefined,
    flush: async () => ({ status: 'saved', path: null })
  })
}))

it('execution proof preserves registered native capability envelopes', async ({
  onTestFinished
}) => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  onTestFinished(() => log.mockRestore())
  const parent = resolve('tmp/flow-library-tests')
  await mkdir(parent, { recursive: true })
  const toolLibraryDirectory = await mkdtemp(resolve(parent, 'case-'))
  onTestFinished(() =>
    rm(toolLibraryDirectory, { recursive: true, force: true })
  )
  let sentBytes = 0
  let receivedBytes = 0
  const packets: {
    id?: number
    method: string
    params: Record<string, unknown>
    result?: { success: boolean; contentItems: { text: string }[] }
  }[] = []
  const output = {
    batchId: 'protocol-proof',
    actions: [
      {
        id: 'report',
        name: 'report_outcome',
        summary: 'Protocol proof',
        arguments: { outcome: 'unsupported', message: 'Protocol proof only.' }
      }
    ]
  }
  const child = Object.assign(new EventEmitter(), {
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    stdin: new Writable(),
    kill: () => {
      queueMicrotask(() => child.emit('close', null, 'SIGTERM'))
      return true
    }
  })
  const send = (value: unknown) => {
    const wire = JSON.stringify(value) + '\n'
    receivedBytes += Buffer.byteLength(wire, 'utf8')
    return child.stdout.write(wire)
  }
  child.stdin = new Writable({
    write(chunk, _encoding, done) {
      sentBytes += Buffer.byteLength(chunk)
      const packet = JSON.parse(String(chunk))
      packets.push(packet)
      queueMicrotask(() => {
        if (packet.id === undefined) return
        const responses: Record<string, unknown> = {
          initialize: {},
          'config/read': { config: {} },
          'account/read': { account: { type: 'chatgpt' } },
          'thread/start': {
            thread: { id: 'proof-thread' },
            model: 'gpt-6-astra',
            reasoningEffort: 'medium',
            instructionSources: [],
            runtimeWorkspaceRoots: []
          },
          'turn/start': { turn: { id: 'proof-turn' } }
        }
        if (packet.method)
          send({ id: packet.id, result: responses[packet.method] })
        if (packet.method === 'turn/start') {
          send({
            id: 100,
            method: 'item/tool/call',
            params: {
              threadId: 'proof-thread',
              turnId: 'proof-turn',
              callId: 'discover',
              namespace: 'design_operations',
              tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
              arguments: {
                names: [
                  ...basicApiContracts.map(({ name }) => name),
                  AiDesignToolIds.EXECUTE_DESIGN_BATCH,
                  AiDesignToolIds.PREPARE_AND_APPLY_DESIGN
                ]
              }
            }
          })
        }
        if (packet.id === 100 && packet.result) {
          send({
            id: 101,
            method: 'item/tool/call',
            params: {
              threadId: 'proof-thread',
              turnId: 'proof-turn',
              callId: 'discover-fill',
              namespace: 'design_operations',
              tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
              arguments: { category: 'fill', includeSchemas: true }
            }
          })
        }
        if ((packet.id === 101 || packet.id === 102) && packet.result) {
          send({
            id: packet.id + 1,
            method: 'item/tool/call',
            params: {
              threadId: 'proof-thread',
              turnId: 'proof-turn',
              callId: `page-${packet.id}`,
              namespace: 'design_operations',
              tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
              arguments:
                packet.id === 101
                  ? { query: 'delete elements' }
                  : { category: 'tools' }
            }
          })
        }
        if (packet.id === 103 && packet.result) {
          send({
            method: 'item/completed',
            params: {
              threadId: 'proof-thread',
              turnId: 'proof-turn',
              item: {
                type: 'agentMessage',
                phase: 'final_answer',
                text: JSON.stringify(output)
              }
            }
          })
          send({
            method: 'turn/completed',
            params: {
              threadId: 'proof-thread',
              turn: { id: 'proof-turn', status: 'completed' }
            }
          })
        }
      })
      done()
    }
  })
  spawn.mockReturnValueOnce(child)
  const executeBatch = vi.fn(async () => ({ actionResults: [], context: {} }))
  await requestLocalAiActionBatch(
    {
      intent: 'Protocol proof',
      context: {},
      attempt: 1,
      actions: [
        ...basicApiContracts.map(({ name, description, inputSchema }) => ({
          name,
          description,
          inputSchema: inputSchema as AiActionDescription['inputSchema']
        })),
        {
          name: AiActionNames.APPLY_PREPARED_DESIGN,
          description: 'Apply',
          inputSchema: {}
        },
        {
          name: 'report_outcome',
          description: 'Report the outcome',
          inputSchema: {}
        }
      ]
    },
    {
      model: 'gpt-6-astra',
      executable: 'test-transport',
      executeBatch,
      toolLibraryDirectory
    }
  )
  const thread = packets.find(({ method }) => method === 'thread/start')?.params
  expect(thread).toMatchObject({
    model: 'gpt-6-astra',
    ephemeral: true,
    allowProviderModelFallback: false,
    config: { 'features.code_mode': true, model_reasoning_effort: 'medium' }
  })
  const groups = thread?.dynamicTools as {
    type: string
    name: string
    description: string
    tools: Record<string, unknown>[]
  }[]
  expect(groups.length).toBeGreaterThan(0)
  expect(
    groups
      .find((group) => group.name === 'tool_library')
      ?.tools.map((tool) => tool.name)
  ).toEqual(['submit_tool', 'invoke_tool', 'save_tool', 'manage_tool'])
  for (const group of groups)
    expect(group).toMatchObject({
      type: 'namespace',
      name: expect.any(String),
      description: expect.any(String),
      tools: expect.any(Array)
    })
  const definitions = groups.flatMap(({ tools }) => tools)
  expect(definitions.length).toBeGreaterThan(0)
  for (const definition of definitions)
    expect(definition).toMatchObject({
      type: 'function',
      deferLoading: true,
      name: expect.any(String),
      description: expect.any(String),
      inputSchema: expect.any(Object)
    })
  const names = new Set(definitions.map(({ name }) => name))
  expect(names.has(AiDesignToolIds.DESCRIBE_DESIGN_APIS)).toBe(true)
  expect(
    definitions.find(
      ({ name }) => name === AiDesignToolIds.DESCRIBE_DESIGN_APIS
    )
  ).toMatchObject({
    inputSchema: {
      properties: { query: { type: 'string' }, names: { type: 'array' } }
    }
  })
  for (const id of [102, 103]) {
    const reply = packets.find(
      (packet) => packet.id === id && packet.result
    )?.result
    expect(reply?.success, JSON.stringify(reply)).toBe(true)
    if (!reply) throw new Error('Missing discovery page')
    const page = JSON.parse(reply.contentItems[0].text)
    const end = page.offset + page.apis.length + page.tools.length
    expect(page.complete).toBe(end === page.count)
    if (!page.complete) expect(page.next.arguments.offset).toBe(end)
    else expect(page.next).toBeUndefined()
  }
  const categoryDiscovery = packets.find(
    (packet) => packet.id === 101 && packet.result
  )?.result
  expect(categoryDiscovery?.success, JSON.stringify(categoryDiscovery)).toBe(
    true
  )
  if (!categoryDiscovery) throw new Error('Missing category discovery receipt')
  const categoryApis = JSON.parse(categoryDiscovery.contentItems[0].text).apis
  expect(categoryApis).toEqual(
    basicApiContracts
      .filter((api) => api.category === 'fill')
      .slice(0, 16)
      .map((api) =>
        expect.objectContaining({
          name: api.name,
          definition: expect.objectContaining({ state: 'previously-returned' })
        })
      )
  )
  for (const api of categoryApis) expect(api.inputSchema).toBeUndefined()
  const mixed = packets.find(
    (packet) => packet.id === 100 && packet.result
  )?.result
  expect(mixed?.success).toBe(true)
  if (!mixed) throw new Error('Missing mixed discovery receipt')
  const nativeMatches = JSON.parse(mixed.contentItems[0].text).tools
  for (const name of [
    AiDesignToolIds.EXECUTE_DESIGN_BATCH,
    AiDesignToolIds.PREPARE_AND_APPLY_DESIGN
  ]) {
    expect(nativeMatches).toContainEqual(
      expect.objectContaining({
        name,
        schemaSource: 'registered-tool-contract',
        execution: expect.objectContaining({ kind: 'native-tool', tool: name })
      })
    )
  }
  for (const tool of nativeMatches) {
    expect(tool.inputSchema).toEqual(expect.any(Object))
    expect(tool.description).toEqual(expect.any(String))
    expect(tool.definition.state).toBe('included')
  }
  expect(executeBatch).not.toHaveBeenCalled()
  expect(names.has(AiDesignToolIds.EXECUTE_DESIGN_BATCH)).toBe(true)
  const discovery = packets.find(
    (packet) => packet.id === 100 && packet.result
  )?.result
  expect(discovery?.success).toBe(true)
  if (!discovery) throw new Error('Missing API discovery receipt')
  const apis = JSON.parse(discovery.contentItems[0].text).apis
  expect(apis.map((api: { name: string }) => api.name)).toEqual(
    basicApiContracts.map(({ name }) => name)
  )
  for (const [index, contract] of basicApiContracts.entries())
    expect(apis[index].inputSchema).toEqual(contract.inputSchema)
  expect(executeBatch).not.toHaveBeenCalled()
  expect(spawn).toHaveBeenCalledTimes(1)
  const records = log.mock.calls.map((call) => JSON.parse(String(call[0])))
  expect(
    records.find((record) => record.event === 'ai_request_usage').transport
  ).toEqual({ sentBytes, receivedBytes })
  expect(
    records
      .filter((record) => record.stage === 'provider_request_started')
      .map((record) => record.evidence.method)
  ).toEqual([
    'initialize',
    'account/read',
    'config/read',
    'thread/start',
    'turn/start'
  ])
  const completed = records.filter(
    (record) => record.stage === 'provider_request_completed'
  )
  expect(completed).toHaveLength(5)
  expect(completed.every((record) => record.evidence.durationMs >= 0)).toBe(
    true
  )
  const catalog = records.find(
    (record) => record.stage === 'capabilities_advertised'
  )?.evidence
  expect(catalog).toMatchObject({
    toolCount: definitions.length,
    toolDefinitionBytes: Buffer.byteLength(JSON.stringify(groups), 'utf8'),
    eagerToolCount: 0,
    eagerToolDefinitionBytes: 0
  })
})

it('execution proof validates continuity references before a successor request', async () => {
  const current = new Map([
    ['root', 'group'],
    ['detail', 'vector']
  ])
  const execute = vi
    .fn()
    .mockResolvedValueOnce({
      status: 'executed',
      actionResults: [
        {
          actionId: 'apply',
          actionName: 'apply_prepared_design',
          result: {
            status: 'complete',
            compositionId: 'root',
            roleToElementIds: { detail: ['detail'] }
          }
        }
      ]
    })
    .mockResolvedValue({ status: 'executed', actionResults: [] })
  let index = 0
  const controller = createAiConversationController({
    feature: { execute, cancel: () => true },
    getElementType: (id) => current.get(id),
    createConversationId: () => `conversation-${++index}`
  })
  try {
    await controller.submit('Create deliberately rough artwork')
    current.delete('detail')
    await controller.submit(
      'Keep its rough style and adjust the remaining shape'
    )
    expect(execute.mock.calls[1][0]).toMatchObject({
      intent: 'Keep its rough style and adjust the remaining shape',
      metadata: { aiTargets: { compositionId: 'root', roleToElementIds: {} } }
    })
    controller.newConversation()
    await controller.submit('Create an unrelated simple drawing')
    expect(execute.mock.calls[2][0].metadata.aiTargets).toEqual({
      compositionId: null,
      roleToElementIds: {}
    })
  } finally {
    await controller.dispose()
  }
})

const proofDraft = {
  type: 'group',
  name: 'Requested composition',
  children: [
    {
      type: 'rect',
      key: 'visible-face',
      name: 'Visible face',
      x: 0,
      y: 0,
      width: 80,
      height: 40,
      fill: '#123456'
    }
  ]
}

it('execution proof exports compound resources before cleanup', async () => {
  const compile = vi.fn(prepareDesignAsync)
  let session!: ReturnType<typeof createDesignPreparationSession>
  const actions = [
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply',
      inputSchema: {}
    }
  ]
  const host = createLocalToolHost({
    requestId: 'handoff-proof',
    signal: new AbortController().signal,
    capacity: 16,
    receiptCapacity: 4,
    artifactCapacity: 16,
    limits: {
      steps: 8,
      bindings: 80,
      bindingDepth: 16,
      bytes: 16000,
      issues: 8
    },
    store: {
      read: async () => undefined,
      list: async () => [],
      write: async () => {
        throw new Error('Native proof must not save a recipe')
      }
    },
    createGroups: (ownership) => {
      session = createDesignPreparationSession(
        prepareDesign,
        compile,
        ownership
      )
      const designs = createLocalDesignTools(actions, session)
      const operations = createLocalOperationTools(
        actions,
        designs,
        async (batch) => ({
          context: {},
          actionResults: batch.actions.map((action) => ({
            actionId: action.id,
            actionName: action.name,
            result: {
              status: 'complete',
              compositionId: (action.arguments as { design: PreparedDesign })
                .design.rootId
            }
          }))
        })
      )
      return [
        { name: 'prepare', description: 'Preparation owner', owner: designs },
        {
          name: 'workflow',
          description: 'Compound owner',
          owner: createLocalDesignWorkflow(designs, operations)
        }
      ]
    }
  })
  let artifactId: string | undefined
  try {
    const produced = JSON.parse(
      (
        await host.invoke({
          name: 'workflow.prepare_and_apply_design',
          callId: 'produce',
          input: { draft: proofDraft, inspection: 'defer' }
        })
      ).text
    )
    expect(produced.toolOutcome.status).toBe('success')
    artifactId = produced.artifactId
    const consumed = JSON.parse(
      (
        await host.invoke({
          name: 'prepare.retain_design_targets',
          callId: 'consume',
          input: { targets: [{ artifactId, keys: ['visible-face'] }] }
        })
      ).text
    )
    expect(consumed).toMatchObject({ available: true, targets: [{ count: 1 }] })
    expect(compile).toHaveBeenCalledTimes(1)
  } finally {
    await host.dispose()
  }
  if (typeof artifactId !== 'string')
    throw new Error('Missing exported artifact')
  const releasedArtifactId = artifactId
  expect(() => session.resolve(releasedArtifactId)).toThrow()
})

it('execution proof retains immutable preparation within its request only', () => {
  const compile = vi.fn(prepareDesign)
  const session = createDesignPreparationSession(compile)
  const receipt = session.prepare(proofDraft)
  const artifact = session.resolve(receipt.artifactId)
  expect(session.resolve(receipt.artifactId)).toBe(artifact)
  expect(compile).toHaveBeenCalledTimes(1)
  expect(Object.isFrozen(artifact)).toBe(true)
  expect(artifact.entries).toHaveLength(2)
  const changed = session.prepare({
    ...proofDraft,
    children: [{ ...proofDraft.children[0], width: 90 }]
  })
  expect(changed.artifactId).not.toBe(receipt.artifactId)
  expect(compile).toHaveBeenCalledTimes(2)
  expect(() =>
    createDesignPreparationSession().resolve(receipt.artifactId)
  ).toThrow()
  session.release([receipt.artifactId])
  expect(() => session.resolve(receipt.artifactId)).toThrow()
  expect(session.resolve(changed.artifactId).entries).toHaveLength(2)
  const signed = session.prepare({
    type: 'group',
    name: 'Signed positions',
    fillTemplates: { paint: '#123456' },
    children: [
      {
        type: 'rect',
        key: 'a',
        name: 'A',
        x: -10,
        y: -20,
        width: 10,
        height: 10,
        fill: { template: 'paint' }
      },
      {
        type: 'rect',
        key: 'b',
        name: 'B',
        x: 20,
        y: 30,
        width: 10,
        height: 10,
        fill: { template: 'paint' }
      }
    ]
  })
  const entries = session.resolve(signed.artifactId).entries
  expect(entries[0].descriptor).toMatchObject({ x: -10, y: -20 })
  expect(entries[1].descriptor).toMatchObject({ x: 0, y: 0 })
  expect(entries[2].descriptor).toMatchObject({ x: 30, y: 50 })
  expect(entries[1].descriptor.fills).not.toEqual(entries[2].descriptor.fills)
  expect(signed.reuse).toMatchObject({
    fillOccurrences: 2,
    compiledFillDefinitions: 1
  })
})

it('execution proof composes preparation and canonical dispatch without repeated work', async () => {
  const actions = [
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply prepared design',
      inputSchema: {}
    }
  ]
  const compile = vi.fn(prepareDesignAsync)
  const designs = createLocalDesignTools(
    actions,
    createDesignPreparationSession(prepareDesign, compile)
  )
  const execute = vi.fn(
    async (batch: AiActionBatch): Promise<AiBatchReceipt> => {
      const action = batch.actions[0]
      const { design } = action.arguments as { design: PreparedDesign }
      return {
        context: { selection: [design.rootId] },
        actionResults: [
          {
            actionId: action.id,
            actionName: action.name,
            result: {
              status: 'complete',
              compositionId: design.rootId,
              appliedElementIds: Object.values(design.keyToId),
              keyToId: design.keyToId
            }
          }
        ]
      }
    }
  )
  const operations = createLocalOperationTools(actions, designs, execute)
  const handoffs: { stage: string; tool?: unknown }[] = []
  const workflow = createLocalDesignWorkflow(designs, operations, {
    trace: (stage, evidence) => handoffs.push({ stage, ...evidence })
  })
  const signal = new AbortController().signal
  const schedule = createLocalToolScheduler(signal)
  let resume!: () => void
  const gate = new Promise<void>((resolve) => {
    resume = resolve
  })
  const access = designs.definitions.find(
    ({ name }) => name === AiDesignToolIds.PREPARE_DESIGN
  )?.executionAccess
  let started = 0
  const independent = [0, 1].map(() =>
    schedule(access, async () => {
      started++
      await gate
    })
  )
  const application = schedule(workflow.definitions[0].executionAccess, () =>
    workflow.call(
      AiDesignToolIds.PREPARE_AND_APPLY_DESIGN,
      { draft: proofDraft, inspection: 'defer' },
      signal
    )
  )
  try {
    await new Promise<void>((resolve) => setImmediate(resolve))
    expect(started).toBe(2)
    expect(compile).not.toHaveBeenCalled()
    expect(execute).not.toHaveBeenCalled()
  } finally {
    resume()
    await Promise.all(independent)
  }
  const result = JSON.parse(await application)
  expect(
    handoffs
      .filter((entry) => entry.stage === 'action_started')
      .map((entry) => entry.tool)
  ).toEqual(['prepare_design', 'apply_prepared_design'])
  expect(result.completedSteps).toEqual([
    'prepare_design',
    'apply_prepared_design'
  ])
  expect(compile).toHaveBeenCalledTimes(1)
  expect(execute).toHaveBeenCalledTimes(1)
  const dispatched = execute.mock.calls[0][0].actions
  expect(dispatched).toHaveLength(1)
  const { design } = dispatched[0].arguments as { design: PreparedDesign }
  expect(design.entries).toHaveLength(2)
  expect(result).toMatchObject({
    available: true,
    receiptScope: 'compact',
    actionResults: [
      {
        result: {
          status: 'complete',
          compositionId: design.rootId,
          appliedElementCount: Object.keys(design.keyToId).length
        }
      }
    ]
  })
  expect(result).not.toHaveProperty('context')
  expect(result.actionResults[0].result).not.toHaveProperty('keyToId')
  expect(result.actionResults[0].result).not.toHaveProperty('appliedElementIds')
  const invalid = JSON.parse(
    await workflow.call(
      AiDesignToolIds.PREPARE_AND_APPLY_DESIGN,
      {
        draft: {
          ...proofDraft,
          children: [{ ...proofDraft.children[0], width: -1 }]
        }
      },
      signal
    )
  )
  expect(invalid.available).toBe(false)
  expect(execute).toHaveBeenCalledTimes(1)
})

it('execution proof distinguishes stage readiness from current final assessment', async () => {
  const review = createLocalDesignReview()
  const savedFacts = review.record({
    phase: 'facts',
    facts: [
      {
        id: 'scale',
        statement: 'Requested scale is 1 cm = 1 px.',
        scope: 'User scale only',
        sources: ['request'],
        verification: 'Explicit user requirement',
        dependencies: [{ key: 'request:scale', version: '1' }]
      }
    ]
  })
  review.record({
    phase: 'plan',
    method: 'Preserve the requested appearance',
    references: [],
    criteria: reviewCriteria(['Silhouette', 'Finish']),
    structureCriteria: ['Silhouette'],
    detailRequired: true
  })
  const check = (criterionId: string) => ({
    criterionId,
    status: 'pass',
    evidence: `Observed ${criterionId}`
  })
  review.mutate()
  const initial = review.inspect('root', true, true)?.inspectionId
  expect(
    review.record({
      phase: 'structure',
      ...wholeViewJudgments([initial], [check('Silhouette')])
    })
  ).toMatchObject({ readyForDetail: true, accepted: false })
  review.mutate()
  expect(() =>
    review.record({
      phase: 'visual',
      ...wholeViewJudgments([initial], [check('Silhouette'), check('Finish')])
    })
  ).toThrow()
  expect(review.getIssue()).toBeTruthy()
  expect(review.record({ phase: 'facts' })).toEqual(savedFacts)
  const failedReview = review.record({
    phase: 'visual',
    ...wholeViewJudgments(
      [
        review.inspect('root', true, true)?.inspectionId,
        review.inspect('detail', true, false)?.inspectionId
      ],
      [
        check('Silhouette'),
        {
          ...check('Finish'),
          status: 'fail',
          evidence: 'Missing requested visible trim'
        }
      ]
    )
  })
  expect(failedReview).toMatchObject({
    accepted: false,
    correction: {
      diagnosticOnly: true,
      criteria: [
        { criterionId: 'Finish', evidence: ['Missing requested visible trim'] }
      ]
    }
  })
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(
        [
          review.inspect('root', true, true)?.inspectionId,
          review.inspect('detail', true, false)?.inspectionId
        ],
        [check('Silhouette'), check('Finish')]
      )
    })
  ).toMatchObject({ accepted: true })
  review.mutate()
  expect(review.getIssue()).toBeTruthy()
  let current = true
  const execute = vi.fn(
    async (batch: AiActionBatch): Promise<AiBatchReceipt> => ({
      context: {},
      actionResults: batch.actions.map(
        (action): AiBatchReceipt['actionResults'][number] => ({
          actionId: action.id,
          actionName: action.name,
          result:
            action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
              ? {
                  current,
                  validatedAt: { sessionId: 'proof-validation', revision: 1 },
                  coverage: {
                    complete:
                      (
                        action.arguments as {
                          scope?: { overviewIds?: string[] }
                        }
                      ).scope?.overviewIds?.includes('root') === true
                  }
                }
              : {
                  available: true,
                  image: { dataUrl: 'data:image/png;base64,AA==' },
                  evidence: { sessionId: 'app', revision: 1 }
                }
        })
      )
    })
  )
  const operations = createLocalOperationTools(
    [
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (actions) => actions, resolveBatch: (value) => value },
    execute,
    { reviewTargetId: 'root' }
  )
  const signal = new AbortController().signal
  await operations.call(
    AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
    {
      phase: 'plan',
      method: 'Match the brief',
      references: [],
      criteria: reviewCriteria(['Silhouette']),
      detailRequired: false
    },
    signal
  )
  const unrelated = JSON.parse(
    await operations.call(
      AiActionNames.INSPECT_DRAWING,
      { arguments: { elementId: 'unrelated', view: 'overview' } },
      signal
    )
  )
  await expect(
    operations.call(
      AiDesignToolIds.REVIEW_DRAWING,
      {
        phase: 'visual',
        ...wholeViewJudgments(
          [unrelated.actionResults[0].result.inspectionId],
          [check('Silhouette')]
        )
      },
      signal
    )
  ).resolves.toContain('"accepted":false')
  const image = JSON.parse(
    await operations.call(
      AiActionNames.INSPECT_DRAWING,
      { arguments: { elementId: 'root' } },
      signal
    )
  )
  await operations.call(
    AiDesignToolIds.REVIEW_DRAWING,
    {
      phase: 'visual',
      ...wholeViewJudgments(
        [image.actionResults[0].result.inspectionId],
        [check('Silhouette')]
      )
    },
    signal
  )
  current = false
  await operations.validateCompletion(signal)
  expect(
    operations.settleOutcome({
      batchId: 'finish',
      actions: [
        {
          id: 'finish',
          name: AiActionNames.REPORT_OUTCOME,
          arguments: { outcome: 'completed' },
          summary: 'Finish'
        }
      ]
    }).actions[0].arguments
  ).toMatchObject({ outcome: 'unsupported' })
  expect(execute).toHaveBeenCalledTimes(7)
})

it('execution proof retains partial progress when a successor makes no change', async () => {
  const execute: AiConversationFeature['execute'] = async (request) => {
    request.progressObserver({
      attempt: 1,
      phase: 'execution',
      summary: 'Shape the outline'
    })
    return {
      status: 'executed',
      actionResults: [
        {
          actionId: 'apply',
          actionName: AiActionNames.APPLY_PREPARED_DESIGN,
          result:
            request.intent === 'first'
              ? {
                  status: 'partial',
                  appliedElementIds: ['outline'],
                  skipped: [{ reason: 'missing-target' }]
                }
              : { status: 'no-change', appliedElementIds: [] }
        }
      ]
    }
  }
  const controller = createAiConversationController({
    feature: { execute, cancel: () => true },
    getElementType: () => 'vector'
  })
  try {
    const first = await controller.submit('first')
    expect(first).toMatchObject({
      outcome: 'partial',
      progress: [{ phase: 'execution', summary: 'Shape the outline' }]
    })
    expect(await controller.submit('next')).toMatchObject({
      outcome: 'no-change'
    })
    expect(controller.getSnapshot().settledTurns[0]).toEqual(first)
  } finally {
    await controller.dispose()
  }
})

it('execution proof accounts observed spans without private payloads or invented model timing', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  const clock = vi.spyOn(performance, 'now')
  const retained: ExecutionRecord[] = []
  try {
    clock.mockReturnValue(0)
    const usage = createAiExecutionProfiler(
      { actions: [], attempt: 1, context: {}, intent: 'private user brief' },
      'gpt-6-astra',
      {
        sink: {
          write: (record) => {
            retained.push(record)
          },
          flush: async () => ({ status: 'saved', path: null })
        }
      }
    )
    clock.mockReturnValue(100)
    usage.trace('tool_started', {
      callId: 'a',
      part: { key: 'first', index: 0, secret: 'secret-test-payload' },
      tool: AiDesignToolIds.PREPARE_DESIGN
    })
    clock.mockReturnValue(120)
    usage.trace('tool_started', {
      callId: 'b',
      tool: AiDesignToolIds.PREPARE_DESIGN
    })
    clock.mockReturnValue(160)
    usage.trace('tool_completed', {
      callId: 'a',
      tool: AiDesignToolIds.PREPARE_DESIGN,
      result: {
        privatePayload: 'secret-test-payload',
        batchSummary: { operationCount: 1, actionCount: 2 }
      }
    })
    clock.mockReturnValue(200)
    usage.trace('tool_completed', {
      callId: 'b',
      tool: AiDesignToolIds.PREPARE_DESIGN
    })
    clock.mockReturnValue(500)
    usage.finish('completed')
    const report = JSON.parse(String(log.mock.calls.at(-1)?.[0]))
    expect(report.timing).toEqual({
      observedToolAndResearchMs: 100,
      outsideToolAndResearchMs: 400
    })
    const serialized = JSON.stringify(log.mock.calls)
    expect(
      retained.find((record) => record.callId === 'a')?.evidence
    ).toMatchObject({ part: { key: 'first', index: 0 } })
    expect(serialized).not.toContain('private user brief')
    expect(serialized).not.toContain('secret-test-payload')
    expect(serialized).toContain('operationCount')
    const persisted = parseExecutionRecord(
      retained.map((record) => JSON.stringify(record)).join('\n')
    )
    expect(persisted.complete).toBe(true)
    expect(persisted.metadata.effort).toBe('medium')
    expect(persisted.timing).toMatchObject(report.timing)
    expect(persisted.steps).toHaveLength(2)
    const evaluated = evaluateExecution(persisted)
    expect(evaluated.timing.unattributedMs).toBe(400)
    expect(evaluated.toolCalls).toHaveLength(2)
    expect(evaluated.findings).toEqual([])
    expect(evaluated.modelReview.status).toBe('unavailable')
    const assess = vi.fn(async () => ({
      requestId: 'assessment-only',
      value: { overall: 'Unattributed time stays unknown.', findings: [] }
    }))
    const assessment = await assessExecution(evaluated, {
      purpose: 'process',
      criteria: ['Find redundant work without changing the requested result'],
      provider: assess
    })
    expect(assess).toHaveBeenCalledTimes(1)
    expect(assessment).toMatchObject({
      status: 'recorded',
      sourceRequestId: persisted.requestId,
      assessmentRequestId: 'assessment-only'
    })
  } finally {
    clock.mockRestore()
    log.mockRestore()
  }
})

it('execution proof records timestamped transport without storing transport content', () => {
  const records: ExecutionRecord[] = []
  let now = 10
  const usage = createAiExecutionProfiler(
    { intent: 'private', context: {}, actions: [], attempt: 1 },
    'test-model',
    {
      now: () => now,
      sink: {
        write: (record) => records.push(record),
        flush: async () => ({ status: 'saved', path: null })
      }
    }
  )
  now = 15
  usage.recordTransport('sent', 12)
  now = 30
  usage.recordTransport('received', 24)
  expect(
    records
      .filter((record) => record.stage === 'transport_chunk')
      .map((record) => ({
        elapsedMs: record.elapsedMs,
        evidence: record.evidence
      }))
  ).toEqual([
    {
      elapsedMs: 5,
      evidence: { direction: 'sent', bytes: 12, stream: 'protocol' }
    },
    {
      elapsedMs: 20,
      evidence: { direction: 'received', bytes: 24, stream: 'protocol' }
    }
  ])
})

function evaluateExecution(...[run, options]: Parameters<typeof evaluate>) {
  return evaluate(run, { ...options, policy: designReportPolicy })
}

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

it('execution proof composes a non-drawing host through shared invocation and local projection', async () => {
  const records: ExecutionRecord[] = []
  const profile = createProfiler(
    { intent: 'private', context: {}, actions: [], attempt: 1 },
    'inventory-model',
    {
      sink: {
        write: (record) => records.push(record),
        flush: async () => ({ status: 'saved', path: null })
      }
    }
  )
  const output = { available: true, quantity: 5 }
  const host = createAiInvoker({
    execute: async () => output,
    observe: (event) =>
      profile.trace(
        event.phase === 'started' ? 'tool_started' : 'tool_completed',
        {
          callId: event.call.callId,
          tool: event.call.name,
          parentCallId: event.call.parentCallId,
          arguments: event.call.input,
          result: event.output
        }
      )
  })
  expect(
    await host.invoke({
      name: 'inventory',
      input: { product: 'item' },
      parentCallId: 'request'
    })
  ).toBe(output)
  profile.finish('completed')
  const parsed = parseExecutionRecord(
    records.map((record) => JSON.stringify(record)).join('\n')
  )
  expect(parsed.complete).toBe(true)
  expect(parsed.steps).toHaveLength(1)
  expect(evaluate(parsed).toolCalls[0].tool).toBe('inventory')
  expect(
    exportExecutionTrace(parsed).traceEvents.some(
      (event) => event.name === 'inventory'
    )
  ).toBe(true)
})

it('execution proof hands a region identity set into one compact plural removal', async () => {
  const removal = basicApiContracts.find(
    (api) => api.owner === 'element' && api.method === 'deleteElements'
  )
  if (!removal) throw new Error('Missing plural removal contract')
  const read = {
    name: AiActionNames.RESOLVE_DESIGN_TARGETS,
    description: 'Resolve region targets',
    inputSchema: {
      type: 'object',
      properties: {
        scope: { const: 'region' },
        bounds: { type: 'object' },
        filter: { type: 'object', properties: { name: { type: 'object' } } },
        expectedCount: { type: 'integer', minimum: 0 }
      }
    }
  }
  const ids = Array.from({ length: 288 }, (_, index) => `target-${index}`)
  const execute = vi.fn(
    async (batch: AiActionBatch): Promise<AiBatchReceipt> => ({
      context: {},
      actionResults: batch.actions.map(
        (action): NonNullable<AiBatchReceipt['actionResults']>[number] => ({
          actionId: action.id,
          actionName: action.name,
          result:
            action.name === read.name
              ? {
                  available: true,
                  total: ids.length,
                  nextOffset: null,
                  elementIds: ids,
                  missingIds: []
                }
              : {
                  status: 'complete',
                  modelResult: {
                    status: 'complete',
                    value: { count: ids.length },
                    retained: {
                      snapshotId: 'removal-receipt',
                      leaseId: 'removal-lease',
                      total: 0
                    }
                  },
                  retained: {
                    snapshotId: 'removal-receipt',
                    leaseId: 'removal-lease',
                    total: 0
                  },
                  value: {
                    removed: ids.map((elementId) => ({
                      elementId,
                      data: {
                        privateHistory: 'history belongs to the canonical owner'
                      }
                    }))
                  }
                }
        })
      )
    })
  )
  const tools = createLocalOperationTools(
    JSON.parse(
      JSON.stringify([
        read,
        {
          ...removal,
          delivery: { path: '/modelResult', outputSchema: { type: 'object' } }
        }
      ])
    ),
    { modelActions: (value) => value, resolveBatch: (value) => value },
    execute
  )
  const receipt = JSON.parse(
    await tools.call(
      AiDesignToolIds.EXECUTE_DESIGN_BATCH,
      {
        inspection: 'defer',
        operations: [
          {
            name: removal.name,
            arguments: {},
            target: {
              field: 'elementIds',
              query: {
                scope: 'region',
                bounds: { x: 0, y: 0, width: 100, height: 100 },
                filter: { name: { prefix: 'roof-' } },
                expectedCount: ids.length
              }
            }
          }
        ]
      },
      new AbortController().signal
    )
  )
  expect(execute).toHaveBeenCalledTimes(2)
  expect(execute.mock.calls[0][0].actions[0].arguments).toMatchObject({
    scope: 'region',
    expectedCount: ids.length,
    filter: { name: { prefix: 'roof-' } }
  })
  expect(execute.mock.calls[1][0].actions).toHaveLength(1)
  expect(execute.mock.calls[1][0].actions[0].arguments).toEqual({
    elementIds: ids
  })
  expect(receipt.actionResults).toHaveLength(1)
  expect(receipt.actionResults[0].result.value).toEqual({ count: ids.length })
  expect(JSON.stringify(receipt)).not.toContain('privateHistory')
})

it('execution proof retains source identity and unavailable upstream payload provenance', () => {
  const records: ExecutionRecord[] = []
  const profiler = createProfiler(
    { actions: [], attempt: 1, context: {}, intent: 'fixture' },
    'fixture-model',
    {
      sourceRevision: 'fixture-revision',
      sourceFingerprint: 'f'.repeat(64),
      sourceIdentityStatus: 'captured',
      sink: {
        write: (record) => records.push(record),
        flush: async () => ({ status: 'saved', path: null })
      }
    }
  )
  profiler.trace('research_started', { callId: 'web-1' })
  profiler.trace('research_completed', {
    callId: 'web-1',
    result: { type: 'webSearch' }
  })
  profiler.finish('completed')
  const parsed = parseExecutionRecord(
    records.map((record) => JSON.stringify(record)).join('\n')
  )
  expect(parsed.metadata).toMatchObject({
    sourceRevision: 'fixture-revision',
    sourceFingerprint: 'f'.repeat(64),
    sourceIdentityStatus: 'captured'
  })
  expect(
    parsed.steps.find((step) => step.callId === 'web-1')?.diagnostics
  ).toMatchObject({
    input: {
      payload: { status: 'unavailable', reason: 'upstream-not-exposed' }
    },
    output: {
      payload: { status: 'unavailable', reason: 'upstream-not-exposed' }
    }
  })
})

it('execution proof recovers a rejected reference through a different original source and reuses it', async () => {
  const bytes = await sharp({
    create: { width: 8, height: 8, channels: 4, background: '#ffffff' }
  })
    .png()
    .toBuffer()
  const download = vi
    .fn()
    .mockRejectedValueOnce(referenceRejection('response', 'http', 403))
    .mockResolvedValueOnce(
      new Response(bytes, { headers: { 'content-type': 'image/png' } })
    )
  const images = createLocalImageTools({ metadata: {} })
  const attach = vi.fn(images.addReference)
  const references = createLocalReferenceTools(attach, download)
  const signal = new AbortController().signal
  const rejected = JSON.parse(
    await references.call(
      'import_reference_image',
      {
        imageUrl: 'https://example.org/blocked.png',
        sourceUrl: 'https://example.org/page'
      },
      signal
    )
  )
  expect(rejected.failure).toMatchObject({
    stage: 'response',
    reason: 'http',
    status: 403,
    retryable: false,
    attempts: 1
  })
  const args = {
    imageUrl: 'https://example.org/original.png',
    sourceUrl: 'https://example.org/page'
  }
  const admitted = JSON.parse(
    await references.call('import_reference_image', args, signal)
  )
  expect(admitted).toMatchObject({
    available: true,
    image: { width: 8, height: 8 },
    attachmentIndex: 0
  })
  expect(
    JSON.parse(await references.call('import_reference_image', args, signal))
  ).toMatchObject({
    available: true,
    delivery: 'reference',
    attachmentIndex: 0
  })
  expect(download).toHaveBeenCalledTimes(2)
  expect(attach).toHaveBeenCalledOnce()
  expect(images.resolveSources(['attachment:0'])).toEqual([
    admitted.referenceId
  ])
  expect(() => images.resolveSources(['attachment:1'])).toThrow(/reference/i)
  const validation = JSON.parse(
    await images.call(
      'validate_reference_images',
      { attachmentIndexes: [0] },
      signal
    )
  )
  expect(validation.references[0]).toMatchObject({
    referenceId: admitted.referenceId,
    reused: true,
    validation: { width: 8, height: 8, validity: 'decoded' }
  })
})

it('execution proof routes separate evidence tools without canvas mutations', async () => {
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.INSPECT_DRAWING,
        description: 'Inspect',
        inputSchema: {}
      }
    ],
    { modelActions: (value) => value, resolveBatch: (value) => value },
    execute,
    {
      validateReferences: (indexes) =>
        indexes.map((attachmentIndex) => ({
          attachmentIndex,
          referenceId: `reference:proof-${attachmentIndex}`
        }))
    }
  )
  const signal = new AbortController().signal
  const call = async (name: string, args: unknown) =>
    JSON.parse(await tools.call(name, args, signal))
  expect(
    await call('define_design_criteria', {
      method: 'Use source dimensions',
      references: [],
      criteria: {
        scale: {
          requirement: 'Requested scale',
          description: 'Source dimension',
          verification: 'data'
        }
      },
      detailRequired: false
    })
  ).toMatchObject({ recorded: true })
  expect(
    await call('record_design_facts', {
      facts: [
        {
          id: 'height',
          statement: 'Verified height',
          scope: 'Height only',
          sources: ['survey'],
          verification: 'Survey confirms height',
          dependencies: [{ key: 'survey', version: '1' }]
        }
      ]
    })
  ).toMatchObject({ facts: [{ id: 'height', status: 'valid' }] })
  expect(
    await call('record_design_calculations', {
      calculations: [
        {
          id: 'projection',
          value: 0.8,
          unit: 'px',
          sourceFactIds: ['height'],
          verification: 'Derived projection'
        }
      ]
    })
  ).toMatchObject({
    diagnosticOnly: true,
    calculations: [{ value: 0.8, status: 'valid' }]
  })
  const selection = await call('select_design_references', {
    referenceImageIndexes: []
  })
  expect(selection).toMatchObject({
    referenceImageIndexes: [],
    changed: false,
    review: { accepted: false, next: { tool: 'review_drawing' } }
  })
  expect(selection).not.toHaveProperty('facts')
  expect(selection).not.toHaveProperty('factBindings')
  expect(selection).not.toHaveProperty('phase')
  await expect(call('review_drawing', { phase: 'facts' })).rejects.toThrow()
  expect(await call('record_design_facts', {})).toMatchObject({
    facts: [{ id: 'height', status: 'valid' }]
  })
  const rejected = await call('select_design_references', {
    referenceImageIndexes: [0],
    requirementRevision: 1,
    referenceDecisions: [
      {
        referenceId: 'reference:proof-0',
        status: 'rejected',
        uses: [],
        reason: 'Construction image does not establish finished appearance'
      }
    ]
  })
  expect(rejected.referenceDecisions).toMatchObject([
    { status: 'rejected', author: 'model', requirementRevision: 1 }
  ])
  const evidence = await call('record_design_facts', {})
  expect(evidence.facts).toMatchObject([
    {
      freshness: 'current',
      evidence: { kind: 'source-assertion', status: 'asserted' }
    }
  ])
  expect(execute).not.toHaveBeenCalled()
})

it('execution proof confirms a durable sequence without extending it to later edits', async () => {
  let acknowledge!: (value: { durableSequence: number }) => void
  const queue = createDocumentPersistenceQueue({
    documentId: 'proof',
    sendBatch: () =>
      new Promise((resolve) => {
        acknowledge = resolve
      })
  })
  const entry = (sequence: number) => ({
    sequence,
    publicationId: `publication-${sequence}`,
    encodedPublicationFrames: [Buffer.from('proof').toString('base64')],
    byteLength: 5
  })
  try {
    queue.enqueue(entry(1))
    const confirmation = queue.whenDurable(1)
    const flush = queue.flushNow()
    queue.enqueue(entry(2))
    acknowledge({ durableSequence: 1 })
    await flush
    expect(await confirmation).toBe(1)
    expect(queue.getState()).toMatchObject({
      durableSequence: 1,
      headSequence: 2
    })
  } finally {
    queue.dispose()
  }
})

it('execution proof preserves concrete work through progress and settlement', async () => {
  const checkpoints: unknown[] = []
  let featureCompleted = false
  const execute: AiConversationFeature['execute'] = async (request) => {
    const running = {
      phase: 'provider' as const,
      attempt: 1,
      tool: AiActionNames.UPDATE_DESIGN_ELEMENT,
      toolStatus: 'running' as const,
      summary: 'Running a tool',
      message: 'Adjusting the roof color',
      activity: { kind: 'work' as const, callId: 'roof', sequence: 1 }
    }
    request.progressObserver({
      ...running,
      activity: { ...running.activity, phase: 'applying' }
    })
    request.progressObserver({
      phase: 'provider',
      attempt: 1,
      summary: 'Nested work',
      toolStatus: 'running',
      message: 'Inspect roof bounds',
      activity: {
        kind: 'work',
        callId: 'bounds',
        parentCallId: 'roof',
        sequence: 2,
        phase: 'inspecting'
      }
    })
    request.progressObserver({
      ...running,
      message: undefined,
      activity: {
        kind: 'system',
        callId: 'roof',
        sequence: 3,
        phase: 'executing'
      }
    })
    const current = () => {
      const active = controller.getSnapshot().activeTurn
      if (!active) throw new Error('Missing active turn')
      return projectAiActivity(active.progress, {
        purpose: active.originalIntent
      }).current
    }
    checkpoints.push(current())
    request.progressObserver({
      phase: 'provider',
      attempt: 1,
      summary: 'Child completed',
      toolStatus: 'completed',
      activity: {
        kind: 'system',
        callId: 'bounds',
        sequence: 4,
        phase: 'inspecting'
      }
    })
    checkpoints.push(current())
    const completed = request.progressObserver({
      ...running,
      toolStatus: 'completed',
      activity: {
        kind: 'system',
        callId: 'roof',
        sequence: 5,
        phase: 'executing'
      }
    })
    checkpoints.push(current())
    checkpoints.push(completed)
    request.progressObserver({
      phase: 'settled',
      attempt: 1,
      summary: 'Failed',
      outcome: 'failed'
    })
    featureCompleted = true
    return {
      status: 'failed',
      stage: 'execution',
      transaction: { status: 'committed' }
    }
  }
  const controller = createAiConversationController({
    feature: { execute, cancel: () => true },
    getElementType: () => 'vector'
  })
  try {
    const result = await controller.submit('Refine the roof')
    // Assertions must escape the conversation's intentional feature-error boundary.
    expect(featureCompleted).toBe(true)
    expect(checkpoints).toEqual([
      { label: 'Refining the design', message: 'Adjusting the roof color' },
      { label: 'Refining the design', message: 'Adjusting the roof color' },
      { label: 'Processing your request' },
      expect.objectContaining({
        phaseLabel: 'Processing your request',
        activeCallCount: 0,
        purposeSource: 'none'
      })
    ])
    expect(result).not.toBeNull()
    if (!result) throw new Error('Missing settled activity')
    expect(controller.getSnapshot().activeTurn).toBeNull()
    expect(
      projectAiActivity(result.progress, { outcome: result.outcome }).current
    ).toEqual({ label: 'Failed' })
  } finally {
    await controller.dispose()
  }
})

it('execution proof composes capture and assessment without dropping unavailable targets', async () => {
  let detailAvailable = false
  const captures: string[] = []
  const execute = vi.fn(
    async (batch: AiActionBatch): Promise<AiBatchReceipt> => ({
      context: {},
      actionResults: batch.actions.map(
        (action): AiBatchReceipt['actionResults'][number] => {
          if (action.name === AiActionNames.INSPECT_DRAWING) {
            const id = String(
              (action.arguments as { elementId: string }).elementId
            )
            captures.push(id)
            return {
              actionId: action.id,
              actionName: action.name,
              result:
                id === 'detail' && !detailAvailable
                  ? {
                      available: false,
                      message: 'Native detail needs a smaller region'
                    }
                  : {
                      available: true,
                      evidence: { sessionId: 'proof', revision: 1 },
                      image: { dataUrl: 'data:image/png;base64,AA==' }
                    }
            }
          }
          return {
            actionId: action.id,
            actionName: action.name,
            result: {
              current: true,
              validatedAt: { sessionId: 'proof-validation', revision: 1 },
              coverage: { complete: true }
            }
          }
        }
      )
    })
  )
  const providerCallsBefore = spawn.mock.calls.length
  const tools = createLocalOperationTools(
    [
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
    execute,
    { reviewTargetId: 'drawing' }
  )
  const signal = new AbortController().signal
  const call = async (name: string, args: unknown) =>
    JSON.parse(await tools.call(name, args, signal))
  await expect(
    call('review_drawing', {
      phase: 'visual',
      inspections: [{ elementId: 'drawing', checks: [{ criterionId: 'view' }] }]
    })
  ).rejects.toThrow(/criteria/)
  expect(captures).toEqual([])
  // Standalone inspection is still available before declaring semantic checks.
  await call(AiActionNames.INSPECT_DRAWING, {
    arguments: { elementId: 'drawing' }
  })
  await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
    method: 'Compare the requested drawing',
    references: [],
    criteria: reviewCriteria(['view']),
    detailRequired: true
  })
  const checks = [
    {
      criterionId: 'view',
      status: 'pass',
      evidence: 'Current requested appearance'
    }
  ]
  const detail = {
    elementId: 'detail',
    checks: [{ criterionId: 'view' }],
    region: { x: 0, y: 0, width: 100, height: 100 }
  }
  const failed = await call('review_drawing', {
    phase: 'visual',
    inspections: [
      { elementId: 'drawing', checks: [{ criterionId: 'view' }] },
      detail
    ]
  })
  expect(failed).toMatchObject({
    accepted: false,
    inspectionIds: [expect.any(String)],
    failedInspections: [{ inspection: detail }]
  })
  expect(failed.coverage.pending).toEqual(
    expect.arrayContaining([expect.objectContaining({ criterionId: 'view' })])
  )
  expect(failed.next).toMatchObject({
    tool: 'review_drawing',
    requiredInputs: ['bindChecks'],
    arguments: {
      phase: 'visual',
      final: false,
      inspectionIds: failed.inspectionIds
    }
  })
  expect(failed.next.arguments).not.toHaveProperty('checks')
  expect(spawn.mock.calls.length).toBe(providerCallsBefore)
  detailAvailable = true
  const reviewed = await call('review_drawing', {
    phase: 'visual',

    inspectionIds: failed.inspectionIds,
    inspections: [detail]
  })
  expect(reviewed.accepted).toBe(false)
  const partial = await call(reviewed.next.tool, {
    ...reviewed.next.arguments,
    ...wholeViewJudgments(reviewed.next.arguments.inspectionIds, checks)
  })
  expect(partial.accepted).toBe(false)
  expect(partial.coverage.passed).toBe(1)
  expect(partial.results.counts.pass).toBeGreaterThan(0)
  expect(
    await call('review_drawing', {
      phase: 'visual',

      ...wholeViewJudgments(reviewed.inspectionIds, checks)
    })
  ).toMatchObject({ accepted: true })
  const binding = await call(AiDesignToolIds.REVIEW_DRAWING, {
    phase: 'visual',
    bindChecks: [{ criterionId: 'view', inspectionIds: reviewed.inspectionIds }]
  })
  const retained = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {
    includePassed: true
  })
  const tampered = structuredClone(binding.next.arguments)
  tampered.checks[0].binding.requestId = 'another-request'
  tampered.checks[0].status = 'fail'
  tampered.checks[0].evidence = 'Foreign verdict'
  await expect(call(AiDesignToolIds.REVIEW_DRAWING, tampered)).rejects.toThrow(
    /binding/
  )
  expect(
    await call(AiDesignToolIds.READ_DESIGN_CHECKS, { includePassed: true })
  ).toEqual(retained)
  expect(captures).toEqual(['drawing', 'drawing', 'detail', 'detail'])
  expect(spawn.mock.calls.length).toBe(providerCallsBefore)
})

it('execution proof binds prepared recipe assessment to immutable source before applying', async () => {
  const actions = [
    ...[
      AiActionNames.READ_DESIGN_ATTACHMENT,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
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
  const session = createDesignPreparationSession()
  const designs = createLocalDesignTools(actions, session)
  const stamp = { sessionId: 'scene', revision: 0 }
  const execute = vi.fn(
    async (batch: AiActionBatch): Promise<AiBatchReceipt> => ({
      context: {},
      actionResults: batch.actions.map(
        (action): AiBatchReceipt['actionResults'][number] => {
          if (action.name === AiActionNames.READ_DESIGN_ATTACHMENT)
            return {
              actionId: action.id,
              actionName: action.name,
              result: {
                available: true,
                parentId: 'workspace',
                workspaceId: 'workspace',
                evidence: stamp,
                basis: [
                  { x: 0, y: 0 },
                  { x: 1, y: 0 },
                  { x: 0, y: 1 }
                ]
              }
            }
          if (action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE)
            return {
              actionId: action.id,
              actionName: action.name,
              result: {
                current: true,
                validatedAt: { sessionId: 'proof-validation', revision: 1 }
              }
            }
          expect(action.arguments).toMatchObject({
            attachmentEvidence: {
              parentId: 'workspace',
              workspaceId: 'workspace',
              evidence: stamp
            }
          })
          expect(action.arguments).toHaveProperty('design')
          return {
            actionId: action.id,
            actionName: action.name,
            result: { status: 'complete', compositionId: 'icon' }
          }
        }
      )
    })
  )
  const operations = createLocalOperationTools(actions, designs, execute)
  const signal = new AbortController().signal
  const recipe = {
    type: 'group',
    name: 'Icon',
    children: [
      {
        type: 'rect',
        key: 'decoration',
        name: 'Extra panel',
        width: 10,
        height: 10
      }
    ]
  }
  const prepared = session.prepare({
    ...recipe,
    brief: {
      intent: 'Icon width',
      viewpoint: 'Front',
      sources: ['User'],
      assumptions: [],
      checks: [
        { key: 'decoration', property: 'width', expected: 20, tolerance: 0 }
      ]
    }
  })
  await operations.call(
    AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
    {
      method: 'Create one icon',
      references: [],
      criteria: reviewCriteria(['Only the requested icon']),
      detailRequired: false
    },
    signal
  )
  const result = JSON.parse(
    await operations.call(
      AiDesignToolIds.REVIEW_PREPARED_DESIGN,
      { artifactId: prepared.artifactId },
      signal
    )
  )
  expect(result).toMatchObject({
    artifactId: prepared.artifactId,
    status: 'fail',
    appearance: 'unverified',
    finalCanvasReviewRequired: true
  })
  expect(result.deterministicFindings).toContainEqual(
    expect.objectContaining({ kind: 'requirement', key: 'decoration' })
  )
  await expect(
    operations.call(
      AiActionNames.APPLY_PREPARED_DESIGN,
      { arguments: { artifactId: prepared.artifactId } },
      signal
    )
  ).rejects.toThrow(/correction/)
  expect(
    execute.mock.calls.flatMap(([batch]) =>
      batch.actions.map((action) => action.name)
    )
  ).toEqual([
    AiActionNames.READ_DESIGN_ATTACHMENT,
    AiActionNames.VALIDATE_INSPECTION_EVIDENCE
  ])
  const corrected = session.prepare({
    type: 'group',
    name: 'Icon',
    children: [
      {
        type: 'rect',
        key: 'icon',
        name: 'Requested icon',
        width: 10,
        height: 10
      }
    ]
  })
  await operations.call(
    AiDesignToolIds.REVIEW_PREPARED_DESIGN,
    { artifactId: corrected.artifactId },
    signal
  )
  await operations.call(
    AiActionNames.APPLY_PREPARED_DESIGN,
    { arguments: { artifactId: corrected.artifactId }, inspection: 'defer' },
    signal
  )
  expect(
    execute.mock.calls
      .flatMap(([batch]) => batch.actions)
      .filter((action) => action.name === AiActionNames.APPLY_PREPARED_DESIGN)
  ).toHaveLength(1)
})

it('execution proof shares immutable tool contracts and preserves rejected output without replay', async () => {
  const { createAiToolContract, createAiToolMiddleware } =
    await import('@asyra/ai-agent-runtime')
  const { operationInputIssue } = await import('../operation-input-schema')
  const contract = createAiToolContract({
    name: 'inventory',
    description: 'Read inventory',
    revision: 1,
    inputSchema: {
      type: 'object',
      required: ['item'],
      properties: { item: { type: 'string' } }
    },
    outputSchema: {
      type: 'object',
      required: ['quantity'],
      properties: { quantity: { type: 'integer', minimum: 0 } }
    },
    effect: 'read',
    resources: ['inventory'],
    lifecycle: { cancellation: 'cooperative', retry: 'never', output: 'value' }
  })
  const execute = vi.fn(async () => ({ quantity: -1 }))
  const invoker = createAiInvoker({
    execute,
    middleware: [
      createAiToolMiddleware({
        resolve: () => contract,
        validate: operationInputIssue,
        classify: () => ({ status: 'success', settlement: 'completed' })
      })
    ]
  })
  await expect(
    invoker.invoke({ name: 'inventory', input: { item: 'bolt' } })
  ).rejects.toMatchObject({
    stage: 'output',
    inspection: {
      status: 'invalid',
      settlement: 'completed',
      value: { quantity: -1 }
    }
  })
  expect(execute).toHaveBeenCalledOnce()
  expect(createAiToolContract(contract)).toBe(contract)
  const designs = createLocalDesignTools([
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply',
      inputSchema: {}
    }
  ])
  for (const definition of designs.definitions)
    expect(() => createAiToolContract(definition)).not.toThrow()
})

it('execution proof retains offline diagnostics until a matching durable terminal acknowledgement', async () => {
  const { createRecordDeliveryHost } = await import('@asyra/ai-agent-runtime')
  const { createRecordCollector } = await import('@asyra/ai-agent-runtime/node')
  const stored = new Map<number, ExecutionRecord>()
  const received: ExecutionRecord[] = []
  let reserved = false
  let gap: ExecutionRecordGap | undefined
  const outbox = {
    reserve: async () => {
      reserved = true
    },
    recordGap: async (value: ExecutionRecordGap) => {
      gap = value
    },
    gap: async () => gap,
    append: async (records: readonly ExecutionRecord[]) => {
      for (const record of records)
        stored.set(record.sequence, structuredClone(record))
    },
    requests: async () => (stored.size || reserved ? ['proof-recording'] : []),
    read: async (_id: string, from: number, count: number) =>
      [...stored.values()]
        .filter((record) => record.sequence >= from)
        .slice(0, count),
    remove: async () => {
      stored.clear()
      reserved = false
      gap = undefined
    }
  }
  const collector = createRecordCollector({
    createSink: () => ({
      write: (record) => {
        received.push(record)
      },
      checkpoint: async () => ({ status: 'saved', path: null }),
      flush: async () => ({ status: 'saved', path: null })
    })
  })
  let online = false
  const host = createRecordDeliveryHost({
    outbox,
    send: (batch) => {
      if (!online) return Promise.reject(new Error('offline'))
      return collector.accept(batch)
    }
  })
  try {
    const sink = host.createSink()
    for (const [sequence, event] of [
      'ai_request_started',
      'ai_request_trace',
      'ai_request_usage'
    ].entries())
      sink.write({
        event,
        sequence,
        requestId: 'proof-recording',
        schemaVersion: 2
      })
    expect((await sink.flush()).status).toBe('failed')
    expect(stored.size).toBe(3)
    online = true
    await host.recover()
    expect(received.map((record) => record.sequence)).toEqual([0, 1, 2])
    expect(stored.size).toBe(0)
  } finally {
    await host.dispose()
    await collector.dispose()
  }
})

it('execution proof reconciles scoped criterion results after external edits without recapturing other tiers', async () => {
  let sequence = 0
  const invalid = new Set<string>()
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map(
      (action): AiBatchReceipt['actionResults'][number] => {
        const args = action.arguments as {
          elementId?: string
          evidence?: { receiptId: string }
          scope?: unknown
        }
        return {
          actionId: action.id,
          actionName: action.name,
          result:
            action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
              ? {
                  current: !invalid.has(args.evidence?.receiptId ?? ''),
                  validatedAt: { sessionId: 'proof-validation', revision: 1 },
                  ...(args.scope ? { coverage: { complete: true } } : {})
                }
              : {
                  available: true,
                  image: { dataUrl: 'data:image/png;base64,AA==' },
                  evidence: {
                    sessionId: 'app',
                    revision: ++sequence,
                    receiptId: `${args.elementId}-${sequence}`
                  }
                }
        }
      }
    )
  }))
  const tools = createLocalOperationTools(
    [
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (actions) => actions, resolveBatch: (value) => value },
    execute
  )
  const signal = new AbortController().signal
  const call = async (name: string, args: Record<string, unknown>) =>
    JSON.parse(await tools.call(name, args, signal))
  await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
    ...reviewPlanExample,
    criteria: reviewCriteria(['tier-1', 'tier-3']),
    structureCriteria: [],
    detailRequired: false
  })
  const capture = async (target: string) => {
    const result = await call(AiActionNames.INSPECT_DRAWING, {
      arguments: { elementId: target }
    })
    return result.actionResults[0].result.inspectionId as string
  }
  const first = await capture('tier-1'),
    third = await capture('tier-3')
  const check = (criterionId: string, id: string) => ({
    criterionId,
    status: 'pass',
    evidence: 'Observed requested windows',
    inspectionIds: [id]
  })
  expect(
    await call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: 'visual',
      inspectionIds: [first, third],
      checks: [check('tier-1', first), check('tier-3', third)]
    })
  ).toMatchObject({ accepted: true })
  invalid.add('tier-3-2')
  const pending = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {})
  expect(pending.counts).toEqual({ pass: 1, stale: 1, fail: 0, unverified: 0 })
  expect(pending.items.map((item: { id: string }) => item.id)).toEqual([
    'visual:tier-3'
  ])
  const replacement = await capture('tier-3')
  expect(
    await call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: 'visual',
      inspectionIds: [first, replacement],
      checks: [check('tier-3', replacement)]
    })
  ).toMatchObject({ accepted: true })
  const captures = execute.mock.calls
    .flatMap(([batch]) => batch.actions)
    .filter((action) => action.name === AiActionNames.INSPECT_DRAWING)
  expect(captures.map((action) => action.arguments)).toEqual([
    { elementId: 'tier-1', view: 'overview' },
    { elementId: 'tier-3', view: 'overview' },
    { elementId: 'tier-3', view: 'overview' }
  ])
  invalid.add('tier-1-1')
  await tools.validateCompletion(signal)
  expect(
    tools.settleOutcome({
      batchId: 'done',
      actions: [
        {
          id: 'done',
          name: AiActionNames.REPORT_OUTCOME,
          arguments: { outcome: 'completed' },
          summary: 'Done'
        }
      ]
    }).actions[0].arguments
  ).toMatchObject({ outcome: 'unsupported' })
})

it('execution proof retains regional units without requiring global coverage for local review', async () => {
  let sequence = 0
  let coverageComplete = true
  const invalid = new Set<string>()
  const captured: string[] = []
  const validations: Record<string, unknown>[] = []
  const execute = vi.fn(
    async (batch: AiActionBatch): Promise<AiBatchReceipt> => ({
      context: {},
      actionResults: batch.actions.map((action) => {
        const args = action.arguments as {
          elementId?: string
          evidence?: { receiptId?: string }
          scope?: unknown
        }
        let result: AiBatchReceipt['actionResults'][number]['result']
        if (action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE) {
          validations.push(args)
          result = {
            current: !invalid.has(args.evidence?.receiptId ?? ''),
            validatedAt: { sessionId: 'proof-validation', revision: 1 },
            coverage: { complete: args.scope !== undefined && coverageComplete }
          }
        } else {
          captured.push(String(args.elementId))
          result = {
            available: true,
            image: { dataUrl: 'data:image/png;base64,AA==' },
            evidence: {
              sessionId: 'app',
              revision: ++sequence,
              receiptId: `${args.elementId}-${sequence}`
            }
          }
        }
        return { actionId: action.id, actionName: action.name, result }
      })
    })
  )
  const checkResults = createDesignCheckResults()
  const tools = createLocalOperationTools(
    [
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    {
      modelActions: (actions) => actions,
      resolveBatch: (value) => value,
      checkResults
    },
    execute,
    { reviewTargetId: 'root' }
  )
  const signal = new AbortController().signal
  const call = async (name: string, args: Record<string, unknown>) =>
    JSON.parse(await tools.call(name, args, signal))
  await expect(
    call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, recordedScope.plan)
  ).rejects.toThrow(/requiredUnits/)
  expect(execute).not.toHaveBeenCalled()
  expect(checkResults.read({ includePassed: true }).items).toEqual([])
  await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
    ...reviewPlanExample,
    criteria: {
      ...reviewCriteria(['Overall']),
      windows: {
        ...reviewCriteria(['windows']).windows,
        requiredUnits: Array.from({ length: 8 }, (_, index) => `tier-${index}`)
      }
    },
    structureCriteria: [],
    detailRequired: false
  })
  const crop = { x: 0, y: 0, width: 20, height: 20 }
  const images: string[] = []
  for (let index = 0; index < 8; index++) {
    const result = await call(AiActionNames.INSPECT_DRAWING, {
      arguments: { elementId: `tier-${index}`, region: crop }
    })
    images.push(result.actionResults[0].result.inspectionId)
  }
  const check = (index: number, image = images[index]) => ({
    criterionId: 'windows',
    unitId: `tier-${index}`,
    status: 'pass',
    evidence: 'Observed requested windows in this region',
    inspectionIds: [image]
  })
  const stage = await call(AiDesignToolIds.REVIEW_DRAWING, {
    phase: 'visual',
    final: false,
    inspectionIds: images,
    checks: images.map((_, index) => check(index))
  })
  expect(stage).toMatchObject({
    accepted: false,
    coverage: {
      required: 9,
      passed: 8,
      pending: [{ criterionId: 'Overall', status: 'unverified' }]
    },
    results: { counts: { pass: 8, unverified: 1 } }
  })
  expect(validations.every((args) => args.scope === undefined)).toBe(true)
  invalid.add('tier-2-3')
  const work = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {})
  expect(work.counts).toEqual({ pass: 7, stale: 1, unverified: 1, fail: 0 })
  expect(
    work.items
      .filter((item: { unitId?: string }) => item.unitId)
      .map((item: { unitId: string }) => item.unitId)
  ).toEqual(['tier-2'])
  const replacement = await call(AiActionNames.INSPECT_DRAWING, {
    arguments: { elementId: 'tier-2', region: crop }
  })
  const image = replacement.actionResults[0].result.inspectionId
  const repaired = await call(AiDesignToolIds.REVIEW_DRAWING, {
    phase: 'visual',
    final: false,
    inspectionIds: [...images, image],
    checks: [check(2, image)]
  })
  expect(repaired.results.counts).toEqual({
    pass: 8,
    stale: 0,
    unverified: 1,
    fail: 0
  })
  expect(captured.filter((id) => id === 'tier-2')).toHaveLength(2)
  expect(captured.filter((id) => id !== 'tier-2')).toHaveLength(7)
  const overview = await call(AiActionNames.INSPECT_DRAWING, {
    arguments: { elementId: 'root' }
  })
  const final = await call(AiDesignToolIds.REVIEW_DRAWING, {
    phase: 'visual',
    ...wholeViewJudgments(
      [overview.actionResults[0].result.inspectionId],
      [
        {
          criterionId: 'Overall',
          status: 'pass',
          evidence:
            'Overall drawing agrees with the retained regional findings and requested result'
        }
      ]
    )
  })
  expect(final).toMatchObject({
    accepted: true,
    results: { counts: { pass: 9, stale: 0, unverified: 0 } }
  })
  expect(validations.some((args) => args.scope !== undefined)).toBe(true)
  const finalInput = {
    phase: 'visual',
    ...wholeViewJudgments(
      [overview.actionResults[0].result.inspectionId],
      [
        {
          criterionId: 'Overall',
          status: 'pass',
          evidence: 'Current whole view agrees'
        }
      ]
    )
  }
  const localAgreement = checkResults
    .read({ includePassed: true })
    .items.find((item) => item.unitId === 'tier-0')
  coverageComplete = false
  expect(await call(AiDesignToolIds.REVIEW_DRAWING, finalInput)).toMatchObject({
    accepted: false,
    status: 'partial'
  })
  expect(
    checkResults
      .read({ includePassed: true })
      .items.find((item) => item.unitId === 'tier-0')
  ).toEqual(localAgreement)
  coverageComplete = true
  expect(await call(AiDesignToolIds.REVIEW_DRAWING, finalInput)).toMatchObject({
    accepted: true
  })
  expect(
    await call(AiDesignToolIds.REVIEW_DRAWING, {
      ...finalInput,
      final: false,
      deferredDetails: [
        { id: 'rear', description: 'Hidden rear', reason: 'Check visibility' }
      ],
      deferredChecks: [
        { id: 'rear', status: 'omit', evidence: 'Occluded from this view' }
      ]
    })
  ).toMatchObject({ accepted: false, pendingDetails: [] })
  const failed = {
    id: 'prepared:source:data',
    origin: 'tool' as const,
    status: 'fail' as const,
    evidence: 'Source needs correction',
    dependencies: { source: '1' }
  }
  checkResults.record(failed)
  expect(await call(AiDesignToolIds.REVIEW_DRAWING, finalInput)).toMatchObject({
    accepted: false,
    pendingDetails: []
  })
  const beforeRecovery = checkResults
    .read({ includePassed: true })
    .items.filter((item) => item.origin === 'main-agent')
  checkResults.record({ ...failed, status: 'pass', evidence: 'Corrected' })
  await tools.validateCompletion(signal)
  const outcome = {
    batchId: 'done',
    actions: [
      {
        id: 'done',
        name: AiActionNames.REPORT_OUTCOME,
        arguments: { outcome: 'completed', message: 'Done' },
        summary: 'Done'
      }
    ]
  }
  expect(tools.settleOutcome(outcome)).toEqual(outcome)
  expect(
    checkResults
      .read({ includePassed: true })
      .items.filter((item) => item.origin === 'main-agent')
  ).toEqual(beforeRecovery)
})

it('execution proof checks all acknowledged parts before returning deferred capture without another model', async () => {
  const names = [
    AiActionNames.APPLY_PREPARED_DESIGN,
    AiActionNames.REVIEW_DESIGN,
    AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
    AiActionNames.INSPECT_DRAWING
  ]
  const registered = names.map((name) => ({
    name,
    description: name,
    inputSchema: {}
  }))
  const designs = createLocalDesignTools(registered)
  const order: string[] = []
  let writes = 0
  const operations = createLocalOperationTools(
    registered,
    designs,
    async (batch) => {
      const actionResults = batch.actions.map((action) => {
        const input = action.arguments as { elementId?: string }
        order.push(action.name)
        let result: AiBatchReceipt['actionResults'][number]['result']
        if (action.name === AiActionNames.APPLY_PREPARED_DESIGN)
          result = { status: 'complete', compositionId: 'part-' + ++writes }
        else if (action.name === AiActionNames.REVIEW_DESIGN)
          result = {
            complete: true,
            findings: [],
            evidence: {
              sessionId: 'proof-stage',
              revision: writes,
              receiptId: String(input.elementId)
            },
            measuredTextIds: []
          }
        else {
          expect(action.name).toBe(AiActionNames.VALIDATE_INSPECTION_EVIDENCE)
          result = {
            current: true,
            validatedAt: { sessionId: 'proof-validation', revision: 1 }
          }
        }
        return { actionId: action.id, actionName: action.name, result }
      })
      return { context: {}, actionResults }
    }
  )
  const workflow = createLocalDesignWorkflow(designs, operations)
  const draft = {
    type: 'group',
    name: 'Part',
    children: [
      { type: 'rect', key: 'face', name: 'Face', width: 10, height: 20 }
    ]
  }
  const modelCalls = spawn.mock.calls.length
  const result = JSON.parse(
    await workflow.call(
      'prepare_and_apply_design',
      {
        parts: [
          { key: 'a', draft },
          { key: 'b', draft }
        ],
        inspection: 'defer'
      },
      new AbortController().signal
    )
  )
  expect(result).toMatchObject({
    status: 'complete',
    inspectionDeferred: true,
    measurementDeferred: false
  })
  expect(order).toEqual([
    AiActionNames.APPLY_PREPARED_DESIGN,
    AiActionNames.APPLY_PREPARED_DESIGN,
    AiActionNames.REVIEW_DESIGN,
    AiActionNames.REVIEW_DESIGN
  ])
  const checks = JSON.parse(
    await operations.call(
      'read_design_checks',
      {
        ids: ['measurement:part-1', 'measurement:part-2'],
        includePassed: true
      },
      new AbortController().signal
    )
  )
  expect(checks.counts).toEqual({ pass: 2, fail: 0, stale: 0, unverified: 0 })
  expect(
    order.filter((name) => name === AiActionNames.REVIEW_DESIGN)
  ).toHaveLength(2)
  expect(spawn.mock.calls.length).toBe(modelCalls)
})

it('execution proof consumes canonical mutation scope without read pollution or no-change invalidation', async () => {
  const checked: string[] = []
  let scopeAvailable = true
  const signal = new AbortController().signal
  const definitions: AiActionDescription[] = JSON.parse(
    JSON.stringify([
      ...basicApiContracts,
      {
        name: AiActionNames.REVIEW_DESIGN,
        description: 'Measure',
        inputSchema: {}
      }
    ])
  )
  const tools = createLocalOperationTools(
    definitions,
    { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
    async (batch: AiActionBatch) => ({
      context: {},
      actionResults: batch.actions.map((call) => {
        let result: unknown
        if (call.name === AiActionNames.REVIEW_DESIGN) {
          const id = String((call.arguments as { elementId: string }).elementId)
          checked.push(id)
          result = {
            available: true,
            complete: true,
            findings: [],
            evidence: { sessionId: 'scope-proof', receiptId: id, revision: 1 }
          }
        } else if (call.name === 'api_core_getElementData')
          result = {
            value: { compositionId: 'read-only-payload' },
            status: 'no-change'
          }
        else
          result = {
            status: 'complete',
            value: null,
            mutationScope: {
              complete: scopeAvailable,
              elementIds:
                call.name === 'api_core_updatePropertyComponents'
                  ? ['shared-a', 'shared-b']
                  : [],
              removedElementIds: []
            }
          }
        return {
          actionId: call.id,
          actionName: call.name,
          result: JSON.parse(JSON.stringify(result))
        }
      })
    })
  )
  const run = (operations: unknown[]) =>
    tools
      .call('execute_design_batch', { operations, inspection: 'defer' }, signal)
      .then(JSON.parse)
  const first = await run([
    {
      name: 'api_core_updatePropertyComponents',
      arguments: {
        updates: [{ propertyId: 'shared', values: { color: '#abcdef' } }]
      }
    },
    { name: 'api_core_getElementData', arguments: { elementId: 'shared-a' } }
  ])
  expect(checked).toEqual(['shared-a', 'shared-b'])
  expect(first.checks.counts).toMatchObject({ pass: 2, unverified: 0 })
  expect(
    first.actionResults.some(
      (entry: { actionName: string }) =>
        entry.actionName === AiActionNames.REVIEW_DESIGN
    )
  ).toBe(false)
  checked.length = 0
  await run([
    { name: 'api_element_createElements', arguments: { createOptions: [] } }
  ])
  expect(checked).toEqual([])
  expect(
    tools.settleOutcome({
      batchId: 'done',
      actions: [
        {
          id: 'done',
          name: AiActionNames.REPORT_OUTCOME,
          arguments: { outcome: 'completed' },
          summary: 'Finish'
        }
      ]
    })
  ).toMatchObject({ actions: [{ arguments: { outcome: 'completed' } }] })
  scopeAvailable = false
  const broken = await run([
    { name: 'api_element_createElements', arguments: { createOptions: [] } }
  ])
  const saved = JSON.parse(
    await tools.call(
      'read_design_checks',
      { ids: [broken.checks.firstPendingId] },
      signal
    )
  )
  expect(saved.items[0].status).toBe('unverified')
  expect(saved.items[0].evidence).toContain('Stop this request')
  scopeAvailable = true
  const blocked = await run([
    { name: 'api_element_createElements', arguments: { createOptions: [] } }
  ])
  expect(blocked).toMatchObject({
    recoverable: false,
    toolOutcome: { settlement: 'not-started' }
  })
})

it('execution proof delivers compact structural output without repeating canonical writes', async () => {
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const { basicApiResultSchema, basicApiDeliverySchema } =
    await import('../../src/ai/basic-api-results')
  const { toolSemantics } = await import('../../src/ai/tool-contract')
  const ids = Array.from({ length: 300 }, (_, index) => `child-${index}`)
  const signal = new AbortController().signal
  const contract = basicApiContracts.find(
    (action) => action.name === 'api_hierarchy_groupElements'
  )
  if (!contract) throw new Error('Missing structural contract')
  const full = {
    status: 'complete',
    value: { groupId: 'group', elementIds: ids },
    mutationScope: { complete: true, elementIds: [], removedElementIds: [] }
  }
  const group = vi.fn(() => ({
    ...full,
    modelResult: {
      status: 'complete',
      value: { count: ids.length, groupId: 'group' },
      mutationScope: {
        complete: true,
        elementCount: 0,
        removedElementCount: 0
      },
      retained: {
        snapshotId: 'browser-structural-snapshot',
        leaseId: 'browser-structural-lease',
        total: ids.length
      }
    },
    retained: {
      snapshotId: 'browser-structural-snapshot',
      leaseId: 'browser-structural-lease',
      total: ids.length
    }
  }))
  const tools = createLocalOperationTools(
    [
      createAiToolContract({
        ...toolSemantics(basicApiResultSchema(contract), 'mutation', [
          'document'
        ]),
        delivery: {
          path: '/modelResult',
          outputSchema: basicApiDeliverySchema(contract)
        },
        name: contract.name,
        description: contract.description,
        inputSchema: contract.inputSchema
      })
    ],
    { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
    async (batch) => ({
      context: null,
      actionResults: batch.actions.map((action) => ({
        actionId: action.id,
        actionName: action.name,
        result: group()
      }))
    })
  )
  const result = JSON.parse(
    await tools.call(
      'execute_design_batch',
      {
        operations: [{ name: contract.name, arguments: { elementIds: ids } }],
        inspection: 'defer'
      },
      signal
    )
  )
  expect(JSON.stringify(result).length).toBeLessThan(2500)
  const delivered = result.actionResults[0].result
  expect(delivered.value).toEqual({ count: 300, groupId: 'group' })
  expect(delivered.retained).toEqual({
    snapshotId: 'browser-structural-snapshot',
    leaseId: 'browser-structural-lease',
    total: ids.length
  })
  expect(full.value.elementIds).toEqual(ids)
  expect(group).toHaveBeenCalledOnce()
})

it('execution proof retains deterministic regional image checks without model evaluation', async () => {
  const bytes = await sharp({
    create: { width: 2, height: 2, channels: 4, background: 'white' }
  })
    .png()
    .toBuffer()
  const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`
  const references = createLocalImageTools({
    metadata: { imageAttachments: [{ dataUrl }] }
  })
  await references.call(
    'validate_reference_images',
    { attachmentIndexes: [0] },
    new AbortController().signal
  )
  const results = createDesignCheckResults()
  let current = true
  const tools = createLocalOperationTools(
    [
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (a) => a, resolveBatch: (b) => b, checkResults: results },
    async (batch) => ({
      context: {},
      actionResults: batch.actions.map(
        (action): AiBatchReceipt['actionResults'][number] => ({
          actionId: action.id,
          actionName: action.name,
          result:
            action.name === AiActionNames.INSPECT_DRAWING
              ? {
                  available: true,
                  imageScope: 'region',
                  background: '#ffffff',
                  image: { dataUrl, width: 2, height: 2 },
                  evidence: {
                    sessionId: 'pixels',
                    revision: 1,
                    receiptId: 'local-region'
                  }
                }
              : { current, validatedAt: { sessionId: 'pixels', revision: 2 } }
        })
      )
    }),
    {
      referenceImages: references.referenceImages,
      validateReferences: references.validateReferences
    }
  )
  const call = async (name: string, args: unknown) =>
    JSON.parse(await tools.call(name, args, new AbortController().signal))
  await call('define_design_criteria', {
    phase: 'plan',
    method: 'Compare explicit source',
    references: [],
    detailRequired: false,
    criteria: {
      surface: {
        requirement: 'Exact surface',
        description: 'Compare crop',
        verification: 'visual',
        requiredUnits: []
      }
    }
  })
  const selected = await call('select_design_references', {
    referenceImageIndexes: [0],
    requirementRevision: 1,
    referenceDecisions: [
      {
        referenceId: references.validateReferences([0])[0].referenceId,
        status: 'accepted',
        reason: 'Explicit aligned source',
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
  const before = spawn.mock.calls.length
  const captured = await call(AiActionNames.INSPECT_DRAWING, {
    arguments: {
      elementId: 'local-part',
      region: { x: 0, y: 0, width: 2, height: 2 }
    }
  })
  const input = {
    referenceUse: selected.referenceDecisions[0].uses[0].receipt,
    checkId: 'local-color',
    inspectionId: captured.actionResults[0].result.inspectionId,
    referenceImageIndex: 0,
    referenceRegion: { x: 0, y: 0, width: 2, height: 2 },
    channelTolerance: 0,
    maxDifferentFraction: 0
  }
  expect(await call(AiDesignToolIds.CHECK_DRAWING_IMAGE, input)).toMatchObject({
    status: 'pass',
    appearance: 'unverified',
    pixelReads: 4
  })
  expect(await call(AiDesignToolIds.CHECK_DRAWING_IMAGE, input)).toMatchObject({
    reused: true,
    pixelReads: 0
  })
  current = false
  const retained = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {})
  expect(
    retained.items.filter((item: { origin: string }) => item.origin === 'tool')
  ).toEqual([
    expect.objectContaining({
      id: 'image:local-color',
      status: 'stale',
      origin: 'tool'
    })
  ])
  expect(spawn.mock.calls.length).toBe(before)
})

it('execution proof uses only current conversion and primary judgment contracts', () => {
  spawn.mockClear()
  expect
    .soft(providerCapabilities)
    .not.toHaveProperty('requestLocalVisualAssessment')
  expect
    .soft(LOCAL_VECTOR_REFERENCE_SCHEMA.properties)
    .not.toHaveProperty('ovalPathIds')
  const artifact = parseLocalVectorArtifact(
    '<svg width="40" height="40"><path d="M20,0L40,20L20,40L0,20Z" fill="#008800"/></svg>'
  )
  const input = {
    imageArtifactId: artifact.imageArtifactId,
    bounds: { x: 0, y: 0, width: 40, height: 40 },
    compositionRole: 'Mapped part',
    excludePathIds: []
  }
  expect
    .soft(() =>
      prepareLocalVectorArtifact(artifact, {
        ...input,
        ovalPathIds: ['path-1']
      })
    )
    .toThrow()
  expect
    .soft(
      prepareLocalVectorArtifact(artifact, {
        ...input,
        componentMappings: [{ pathId: 'path-1', componentType: 'oval' }]
      }).slices[0].descriptors[0].type
    )
    .toBe('oval')
  const review = createLocalDesignReview()
  expect.soft(review).not.toHaveProperty('retainAssessment')
  review.record({
    phase: 'plan',
    method: 'Construct the requested part',
    references: [],
    criteria: reviewCriteria(['appearance']),
    structureCriteria: ['appearance'],
    detailRequired: false
  })
  review.mutate()
  const inspectionIds = [review.inspect('part', true, true)?.inspectionId]
  const inputReview = {
    phase: 'visual',
    final: true,
    ...wholeViewJudgments(inspectionIds, [
      {
        criterionId: 'appearance',
        status: 'fail',
        evidence: 'The requested silhouette is incorrect.'
      }
    ])
  }
  const failed = review.record(inputReview)
  expect.soft(failed.accepted).toBe(false)
  expect.soft(failed).not.toHaveProperty('independentAssessment')
  expect
    .soft(review.correctionContext().criteria)
    .toEqual(
      expect.arrayContaining([
        expect.objectContaining({ criterionId: 'appearance' })
      ])
    )
  review.mutate()
  expect
    .soft(() =>
      review.record({
        ...inputReview,
        checks: [
          {
            criterionId: 'appearance',
            status: 'pass',
            evidence: 'Corrected silhouette.'
          }
        ]
      })
    )
    .toThrow()
  const passed = review.record({
    ...inputReview,
    ...wholeViewJudgments(
      [review.inspect('part', true, true)?.inspectionId],
      [
        {
          criterionId: 'appearance',
          status: 'pass',
          evidence: 'Corrected silhouette.'
        }
      ]
    )
  })
  expect.soft(passed.accepted).toBe(true)
  if (!Array.isArray(passed.inspectionIds))
    throw new Error('Missing recorded image IDs')
  expect.soft(passed).not.toHaveProperty('independentAssessment')
  review.record({
    ...inputReview,
    phase: 'structure',
    final: undefined,
    ...wholeViewJudgments(passed.inspectionIds, inputReview.checks)
  })
  expect(review.isAccepted()).toBe(false)
  expect(review.getIssue()).toContain('requested silhouette')
  expect(review.correctionContext().criteria).toMatchObject([
    {
      criterionId: 'appearance',
      evidence: ['The requested silhouette is incorrect.']
    }
  ])
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(passed.inspectionIds, [
        {
          criterionId: 'appearance',
          status: 'pass',
          evidence: 'Corrected after the structure failure.'
        }
      ])
    })
  ).toMatchObject({ accepted: true })
  expect.soft(spawn).not.toHaveBeenCalled()
})

it('execution proof preserves exact mechanical selection and canonical retirement', () => {
  const checks = createDesignCheckResults()
  const revision = checks.record({
    id: 'local-check',
    origin: 'tool',
    status: 'pass',
    evidence: 'Current geometry',
    dependencies: {}
  })
  expect(checks.select([{ checkId: 'local-check', revision }])).toHaveLength(1)
  checks.retire('local-check', 'Canonical target removed')
  expect(
    checks.select([{ checkId: 'local-check', revision }])[0]
  ).toMatchObject({ retired: true })
  expect(() => checks.select([{ checkId: 'unknown', revision: 1 }])).toThrow()
  const next = checks.record({
    id: 'local-check',
    origin: 'tool',
    status: 'pass',
    evidence: 'Recreated geometry',
    dependencies: {}
  })
  expect(next).toBeGreaterThan(revision)
  expect(() => checks.select([{ checkId: 'local-check', revision }])).toThrow()
})

it('execution proof exposes aggregate verification and guarded repair at the existing operation owner', () => {
  const operations = createLocalOperationTools(
    [
      {
        name: AiActionNames.REVIEW_DESIGN,
        description: 'Review',
        inputSchema: { type: 'object' }
      }
    ],
    {
      modelActions: (value) => value,
      resolveBatch: (value) => value
    },
    vi.fn()
  )
  const verify = operations.definitions.find(
    (tool) => tool.name === 'verify_design_checks'
  )
  const repair = operations.definitions.find(
    (tool) => tool.name === 'repair_design_checks'
  )
  expect(verify).toMatchObject({
    verification: {
      statusPath: '/verification/status',
      progressPath: '/verification/progress'
    }
  })
  expect(repair).toBeDefined()
})

it('execution proof preserves a rejected mechanical repair as not-started across native ownership', async () => {
  const { createLocalToolHost } = await import('../local-tool-host')
  const checks = createDesignCheckResults()
  const revision = checks.record({
    id: 'opaque',
    origin: 'tool',
    status: 'pass',
    evidence: 'No automatic repair',
    dependencies: {}
  })
  const execute = vi.fn()
  const host = createLocalToolHost({
    requestId: 'r',
    signal: new AbortController().signal,
    capacity: 4,
    receiptCapacity: 4,
    artifactCapacity: 4,
    limits: {
      bytes: 12000,
      steps: 10,
      bindings: 100,
      bindingDepth: 32,
      issues: 10
    },
    store: {
      read: async () => undefined,
      list: async () => [],
      write: async () => {
        throw new Error('Unexpected save')
      }
    },
    createGroups: (ownership) => [
      {
        name: 'design_operations',
        description: 'Mechanical checks',
        owner: createLocalOperationTools(
          [
            {
              name: AiActionNames.REVIEW_DESIGN,
              description: 'Review',
              inputSchema: { type: 'object' }
            }
          ],
          {
            modelActions: (value) => value,
            resolveBatch: (value) => value,
            checkResults: checks
          },
          execute,
          { ownership }
        )
      }
    ]
  })
  try {
    const verified = await host.invoke({
      name: 'design_operations.verify_design_checks',
      input: {
        requestId: 'r',
        checks: [{ checkId: 'opaque', revision }]
      }
    })
    expect(JSON.parse(verified.text)).toMatchObject({
      toolOutcome: { status: 'success' },
      verification: { status: 'decision-required' }
    })
    const reply = await host.invoke({
      name: 'design_operations.repair_design_checks',
      input: {
        requestId: 'r',
        checks: [{ checkId: 'opaque', revision }],
        policy: {
          capability: 'set-prescribed-child-position',
          positions: [
            {
              elementId: 'child',
              x: 1,
              y: 1,
              attachmentEvidence: {
                parentId: 'parent',
                workspaceId: 'workspace',
                evidence: { sessionId: 's', revision: 0 }
              }
            }
          ]
        }
      }
    })
    expect(JSON.parse(reply.text)).toMatchObject({
      code: 'PREPARATION_REJECTED',
      toolOutcome: { status: 'failed', settlement: 'not-started' }
    })
    expect(execute).not.toHaveBeenCalled()
  } finally {
    await host.dispose()
  }
})

it('execution proof connects tool-first guidance to native selection and Runtime decision recovery', async () => {
  const { AI_APP_PROMPT } = await import('../ai-domain-prompt')
  expect.soft(AI_APP_PROMPT).toContain('mechanicalSelection')
  expect.soft(AI_APP_PROMPT).toContain('verify_design_checks')
  expect.soft(AI_APP_PROMPT).toContain('repair_design_checks')
  expect.soft(AI_APP_PROMPT).toContain('returned requestId/checks')
  const checks = createDesignCheckResults()
  const revision = checks.record({
    id: 'unresolved',
    origin: 'tool',
    status: 'fail',
    evidence: 'Requires a creative decision',
    dependencies: {}
  })
  const execute = vi.fn()
  const host = createLocalToolHost({
    requestId: 'guidance',
    signal: new AbortController().signal,
    capacity: 4,
    receiptCapacity: 4,
    artifactCapacity: 4,
    limits: {
      bytes: 24000,
      steps: 10,
      bindings: 100,
      bindingDepth: 32,
      issues: 10
    },
    store: {
      read: async () => undefined,
      list: async () => [],
      write: async () => {
        throw new Error('A failed recipe cannot be saved as eligible')
      }
    },
    createGroups: (ownership) => [
      {
        name: 'design_operations',
        description: 'Design checks',
        owner: createLocalOperationTools(
          [
            {
              name: AiActionNames.REVIEW_DESIGN,
              description: 'Review',
              inputSchema: { type: 'object' }
            }
          ],
          {
            modelActions: (value) => value,
            resolveBatch: (value) => value,
            checkResults: checks
          },
          execute,
          {
            ownership,
            getNativeTools: () => host.definitions(),
            getNativeToolsRevision: () => host.revision
          }
        )
      }
    ]
  })
  try {
    const invoke = async (name: string, input: unknown) =>
      JSON.parse((await host.invoke({ name, input })).text)
    const lookup = await invoke('design_operations.describe_design_apis', {
      names: ['design_operations.verify_design_checks']
    })
    expect(lookup.tools[0]).toMatchObject({
      verification: {
        statusPath: '/verification/status',
        progressPath: '/verification/progress'
      }
    })
    const verifier = host
      .definitions()
      .find((tool) => tool.name === 'verify_design_checks')
    const repair = host
      .definitions()
      .find((tool) => tool.name === 'repair_design_checks')
    if (!verifier || !repair) throw new Error('Missing mechanical contracts')
    const repairSchema = repair.inputSchema as {
      properties: { policy: unknown }
    }
    const selected = (step: string) => ({
      kind: 'object',
      fields: {
        requestId: { kind: 'step', step, path: '/requestId' },
        checks: { kind: 'step', step, path: '/checks' }
      }
    })
    const proposal = {
      format: 1,
      name: 'verify-selected-work',
      revision: 1,
      description:
        'Verify the selected current work without inventing repairs.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['selection', 'policy'],
        properties: {
          selection: verifier.inputSchema,
          policy: repairSchema.properties.policy
        }
      },
      outputSchema: { type: 'string' },
      steps: [
        {
          id: 'first',
          tool: verifier.registeredName,
          revision: verifier.revision,
          input: { kind: 'input', path: '/selection' }
        }
      ],
      iteration: {
        id: 'closure',
        stateSchema: verifier.inputSchema,
        state: {
          kind: 'object',
          fields: {
            requestId: { kind: 'step', step: 'first', path: '/requestId' },
            checks: { kind: 'step', step: 'first', path: '/checks' }
          }
        },
        check: {
          id: 'check',
          tool: verifier.registeredName,
          revision: verifier.revision,
          input: { kind: 'state', path: '' }
        },
        repairs: [
          {
            id: 'repair',
            tool: repair.registeredName,
            revision: repair.revision,
            input: {
              kind: 'object',
              fields: {
                ...selected('check').fields,
                policy: { kind: 'input', path: '/policy' }
              }
            }
          }
        ],
        next: selected('repair'),
        maxIterations: 1
      },
      output: {
        kind: 'step',
        step: 'closure',
        path: '/result/verification/status'
      }
    }
    const admission = await invoke('tool_library.submit_tool', {
      submissionId: 'guidance',
      proposal
    })
    expect(admission).toMatchObject({ ok: true })
    expect(execute).not.toHaveBeenCalled()
    const result = await invoke('tool_library.invoke_tool', {
      name: proposal.name,
      revision: 1,
      input: {
        selection: {
          requestId: 'guidance',
          checks: [{ checkId: 'unresolved', revision }]
        },
        policy: {
          capability: 'set-prescribed-child-position',
          positions: [
            {
              elementId: 'child',
              x: 0,
              y: 0,
              attachmentEvidence: {
                parentId: 'parent',
                workspaceId: 'workspace',
                evidence: { sessionId: 'session', revision: 0 }
              }
            }
          ]
        }
      }
    })
    expect(result.execution.status).not.toBe('success')
    expect(result.execution.issues).toEqual(
      expect.arrayContaining(['Primary-agent decision required'])
    )
    expect(result).not.toHaveProperty('storage')
    expect(execute).not.toHaveBeenCalled()
  } finally {
    await host.dispose()
  }
})

it('execution proof saves nested tool evidence and reopens without product replay', async () => {
  const { createLocalToolStore } = await import('../local-tool-store')
  const { toolRequestReference } = await import('../../src/ai/tool-contract')
  const parentDirectory = resolve('tmp/stage4-tool-proof')
  await mkdir(parentDirectory, { recursive: true })
  const directory = await mkdtemp(resolve(parentDirectory, 'case-'))
  const open = () =>
    createLocalToolStore({
      directory,
      capacity: 16,
      recordBytes: 65536,
      totalBytes: 1048576
    })
  let database = await open()
  let fail = false
  let preparations = 0
  const events: { phase: string; name: string; parent?: string }[] = []
  const makeHost = (requestId: string) =>
    createLocalToolHost({
      requestId,
      signal: new AbortController().signal,
      capacity: 16,
      receiptCapacity: 8,
      artifactCapacity: 32,
      limits: {
        steps: 16,
        bindings: 100,
        bindingDepth: 32,
        bytes: 24000,
        issues: 8
      },
      store: {
        read: (key) => database.read(key),
        list: (limit) => database.list(limit),
        write: (value) => {
          if (fail) throw new Error('Store unavailable')
          return database.write(value)
        }
      },
      observe: (event) => {
        events.push({
          phase: event.phase,
          name: event.call.name,
          parent: event.call.parentCallId
        })
        if (
          event.phase === 'started' &&
          event.call.name === 'design_preparation.prepare_design'
        )
          preparations++
      },
      createGroups: (ownership) => [
        {
          name: 'design_preparation',
          description: 'Prepare editable parts',
          owner: createLocalDesignTools(
            [
              {
                name: AiActionNames.APPLY_PREPARED_DESIGN,
                description: 'Apply',
                inputSchema: {}
              }
            ],
            createDesignPreparationSession(undefined, undefined, ownership)
          )
        }
      ]
    })
  let host = makeHost('first')
  const call = async (name: string, input: unknown) =>
    JSON.parse((await host.invoke({ name, input })).text)
  try {
    const literal = (value: unknown) => ({ kind: 'literal', value })
    const child = {
      format: 1,
      name: 'prepared-source',
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
                  width: literal(200),
                  height: literal(200),
                  children: {
                    kind: 'array',
                    items: [
                      {
                        kind: 'object',
                        fields: {
                          type: literal('rect'),
                          key: literal('surface'),
                          name: literal('Surface'),
                          width: { kind: 'input', path: '' },
                          height: literal(10),
                          fill: literal('#123456')
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      ],
      output: { kind: 'step', step: 'prepare', path: '/artifactId' }
    }
    const parent = {
      ...child,
      name: 'prepared-parent',
      steps: [
        {
          id: 'prepare',
          tool: child.name,
          revision: 1,
          input: { kind: 'input', path: '' }
        }
      ],
      output: { kind: 'step', step: 'prepare', path: '' }
    }
    expect(
      await call('tool_library.submit_tool', {
        submissionId: 'child',
        proposal: child
      })
    ).toMatchObject({ ok: true })
    expect(
      await call('tool_library.submit_tool', {
        submissionId: 'parent',
        proposal: parent
      })
    ).toMatchObject({ ok: true })
    fail = true
    const first = await call('tool_library.invoke_tool', {
      name: parent.name,
      revision: 1,
      input: 17
    })
    expect(first, JSON.stringify(first)).toMatchObject({
      execution: { status: 'success' },
      storage: { status: 'unsaved' },
      receiptId: expect.any(String)
    })
    fail = false
    expect(
      await call('tool_library.save_tool', {
        name: parent.name,
        revision: 1,
        receiptId: first.receiptId
      })
    ).toMatchObject({ status: 'saved', availability: 'eligible' })
    expect(preparations).toBe(1)
    expect(
      events.some(
        (event) =>
          event.name === 'tool_library.save_tool' &&
          event.parent &&
          event.phase === 'started'
      )
    ).toBe(true)
    await host.dispose()
    database.close()
    database = await open()
    host = makeHost('second')
    expect(await host.load()).toMatchObject({
      loaded: [child.name, parent.name],
      unavailable: []
    })
    expect(
      await call('tool_library.save_tool', {
        name: parent.name,
        revision: 1,
        receiptId: first.receiptId
      })
    ).toMatchObject({ status: 'unsaved' })
    const second = await call('tool_library.invoke_tool', {
      name: parent.name,
      revision: 1,
      input: 23
    })
    expect(second).toMatchObject({
      execution: { status: 'success' },
      storage: { status: 'saved' }
    })
    expect(second.execution.value).not.toBe(first.execution.value)
    expect(preparations).toBe(2)
    expect(
      await call('tool_library.manage_tool', {
        name: child.name,
        revision: 1,
        operation: 'suspend'
      })
    ).toMatchObject({ status: 'saved' })
    expect(
      await call('tool_library.invoke_tool', {
        name: parent.name,
        revision: 1,
        input: 24
      })
    ).toMatchObject({ execution: { settlement: 'not-started' } })
    expect(preparations).toBe(2)
  } finally {
    await host.dispose()
    database.close()
    await rm(directory, { recursive: true, force: true })
  }
})

it('execution proof preserves issued history direction across the App feature handoff', async () => {
  vi.stubGlobal('window', {})
  const { default: core, getFeatureRegistry } = await import('@asyra/core')
  const { keyCombinations } = await import('../../src/config/key-combinations')
  const { FeatureNames, InputSystemEvents } =
    await import('../../src/constants')
  const { ModifierKey, InputType } = await import('@asyra/utils')
  const { historyApis } = await import('../../src/common-apis/history')
  await import('../../src/features/undo-redo')
  const execution = getFeatureRegistry().getDefinition(
    FeatureNames.UNDO_REDO
  )?.execution
  if (!execution) throw new Error('Missing real history feature')
  const originalBusy = core.deps.factory.isInUndoRedo
  const originalSet = core.setSystemProperty
  const originalUndo = historyApis.undo
  const originalRedo = historyApis.redo
  const applied: string[] = []
  core.setSystemProperty = vi.fn()
  historyApis.undo = async () => {
    applied.push('undo')
  }
  historyApis.redo = async () => {
    applied.push('redo')
  }
  try {
    core.deps.factory.isInUndoRedo = () => false
    for (const modifier of [ModifierKey.META, ModifierKey.CTRL]) {
      const combo = keyCombinations[
        InputSystemEvents.INPUT_SHORTCUT_UNDOREDO
      ].find((entry) => entry.modifiers.includes(modifier))
      if (!combo) throw new Error('Missing real history shortcut')
      for (const shift of [false, true]) {
        const raw = {
          type: InputType.KEYBOARD,
          keys: ['z'],
          modifiers: {
            shift,
            meta: modifier === ModifierKey.META,
            ctrl: modifier === ModifierKey.CTRL,
            alt: false
          }
        } as import('@asyra/utils').RawInputEvent
        core.deps.factory.isInUndoRedo = () => true
        expect(combo.callback(raw)).toBe(false)
        expect(raw.detail).toBeUndefined()
        core.deps.factory.isInUndoRedo = () => false
        expect(combo.callback(raw)).not.toBe(false)
        await execution({
          detail: raw.detail,
          keyShift: !shift
        } as import('@asyra/utils').SystemContextSnapshotWithDetail)
      }
    }
    expect(applied).toEqual(['undo', 'redo', 'undo', 'redo'])
    expect(
      await execution({
        detail: {},
        keyShift: true
      } as import('@asyra/utils').SystemContextSnapshotWithDetail)
    ).toBeNull()
    expect(applied).toHaveLength(4)
    const features = await import('@asyra/feature-system')
    const listeners = new Map<
      string,
      (raw: import('@asyra/utils').RawInputEvent) => void | Promise<void>
    >()
    features.setCorePackages({
      inputSystem: {
        on: (name, callback) => {
          listeners.set(name, callback)
        },
        off: (name) => listeners.delete(name)
      },
      systemContext: {
        getSystemContextSnapshot: () =>
          ({}) as import('@asyra/utils').SystemContextSnapshot
      }
    })
    try {
      const dispatch = listeners.get(InputSystemEvents.INPUT_SHORTCUT_UNDOREDO)
      if (!dispatch) throw new Error('Missing real history dispatch')
      const request = dispatch({
        detail: { historyDirection: 'undo' }
      } as unknown as import('@asyra/utils').RawInputEvent)
      const atReturn = [...applied]
      await request
      expect(atReturn).toEqual(['undo', 'redo', 'undo', 'redo', 'undo'])
    } finally {
      await features.disposeFeatureSystem(
        () => ({}) as import('@asyra/utils').SystemContextSnapshot
      )
    }
    const { InputSystem } = await import('@asyra/input-system')
    const input = new InputSystem()
    const callbacks = new Map<string, EventListener[]>()
    input.attachBrowserHost({
      addEventListener: (name: string, callback: EventListener) => {
        callbacks.set(name, [...(callbacks.get(name) ?? []), callback])
      },
      removeEventListener: vi.fn()
    } as unknown as Window)
    input.registry.register(
      'history',
      keyCombinations[InputSystemEvents.INPUT_SHORTCUT_UNDOREDO]
    )
    const received: unknown[] = []
    input.on('history', (raw) => {
      received.push(raw.detail)
    })
    const keydown = callbacks.get('keydown')?.[0]
    if (!keydown) throw new Error('Missing browser input binding')
    const key = (code: string) =>
      ({
        code,
        target: { tagName: 'DIV', isContentEditable: false },
        preventDefault: vi.fn()
      }) as unknown as KeyboardEvent
    try {
      core.deps.factory.isInUndoRedo = () => true
      keydown(key('MetaLeft'))
      keydown(key('KeyZ'))
      expect(received).toEqual([])
      core.deps.factory.isInUndoRedo = () => false
      keydown(key('KeyZ'))
      expect(received).toEqual([{ historyDirection: 'undo' }])
    } finally {
      input.resetRuntime()
    }
  } finally {
    core.deps.factory.isInUndoRedo = originalBusy
    core.setSystemProperty = originalSet
    historyApis.undo = originalUndo
    historyApis.redo = originalRedo
    vi.unstubAllGlobals()
  }
})

it('execution proof retains recorded authored purpose after provider tool settlement', async ({
  onTestFinished
}) => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  onTestFinished(() => log.mockRestore())
  const parent = resolve('tmp/flow-library-tests')
  await mkdir(parent, { recursive: true })
  const toolLibraryDirectory = await mkdtemp(resolve(parent, 'purpose-'))
  onTestFinished(() =>
    rm(toolLibraryDirectory, { recursive: true, force: true })
  )
  const projection = createAiActivityProjection({ purpose: 'Draw Taipei 101' })
  const settled: unknown[] = []
  const stages = recordedPurpose.recordedOutput
    .filter((event) => event.evidence.status === 'running')
    .map((event) => {
      if (typeof event.evidence.purpose !== 'string')
        throw new Error('Recorded purpose is missing')
      return {
        ...recordedPurpose.item,
        id: event.evidence.activity.callId,
        text: event.evidence.purpose
      }
    })
  let stageIndex = 0
  const child = Object.assign(new EventEmitter(), {
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    stdin: new Writable(),
    kill: () => {
      queueMicrotask(() => child.emit('close', null, 'SIGTERM'))
      return true
    }
  })
  const send = (packet: unknown) =>
    child.stdout.write(JSON.stringify(packet) + '\n')
  child.stdin = new Writable({
    write(chunk, _encoding, done) {
      const packet = JSON.parse(String(chunk))
      queueMicrotask(() => {
        if (packet.id === undefined) return
        if (packet.method) {
          const replies: Record<string, unknown> = {
            initialize: {},
            'config/read': { config: {} },
            'account/read': { account: { type: 'chatgpt' } },
            'thread/start': {
              thread: { id: 'purpose-thread' },
              model: 'gpt-6-astra',
              reasoningEffort: 'medium',
              instructionSources: [],
              runtimeWorkspaceRoots: []
            },
            'turn/start': { turn: { id: 'purpose-turn' } }
          }
          send({ id: packet.id, result: replies[packet.method] })
        }
        if (
          packet.method === 'turn/start' ||
          (packet.id >= 9001 && packet.result && stageIndex < stages.length)
        ) {
          if (packet.result && packet.id >= 9001)
            settled.push(projection.result().current)
          const stage = stages[stageIndex++]
          send({
            method: 'item/completed',
            params: {
              threadId: 'purpose-thread',
              turnId: 'purpose-turn',
              item: stage
            }
          })
          send({
            id: 9000 + stageIndex,
            method: 'item/tool/call',
            params: {
              threadId: 'purpose-thread',
              turnId: 'purpose-turn',
              callId: `lookup-${stageIndex}`,
              namespace: 'design_operations',
              tool: AiDesignToolIds.DESCRIBE_DESIGN_APIS,
              arguments: { category: 'tools' }
            }
          })
        } else if (packet.id >= 9001 && packet.result) {
          settled.push(projection.result().current)
          send({
            method: 'item/completed',
            params: {
              threadId: 'purpose-thread',
              turnId: 'purpose-turn',
              item: {
                type: 'agentMessage',
                phase: 'final_answer',
                text: JSON.stringify({
                  batchId: 'purpose-proof',
                  actions: [
                    {
                      id: 'report',
                      name: 'report_outcome',
                      summary: 'Transport proof',
                      arguments: {
                        outcome: 'unsupported',
                        message:
                          'No canvas operation requested in this protocol proof.'
                      }
                    }
                  ]
                })
              }
            }
          })
          send({
            method: 'turn/completed',
            params: {
              threadId: 'purpose-thread',
              turn: { id: 'purpose-turn', status: 'completed' }
            }
          })
        }
      })
      done()
    }
  })
  spawn.mockReturnValueOnce(child)
  const executeBatch = vi.fn(async () => ({ actionResults: [], context: {} }))
  await requestLocalAiActionBatch(
    {
      intent: 'Draw Taipei 101',
      context: {},
      attempt: 1,
      actions: [
        {
          name: AiActionNames.APPLY_PREPARED_DESIGN,
          description: 'Apply',
          inputSchema: {}
        },
        { name: 'report_outcome', description: 'Report', inputSchema: {} }
      ]
    },
    {
      model: 'gpt-6-astra',
      executable: 'test-transport',
      executeBatch,
      toolLibraryDirectory,
      onProgress: (event) =>
        projection.append({
          attempt: 1,
          phase: 'provider',
          summary: 'Provider activity',
          tool: event.tool,
          toolStatus: event.status,
          message: event.message,
          activity: event.activity
        })
    }
  )
  expect(settled).toEqual(
    stages.map((stage) => ({
      label: 'Current task',
      message: stage.text.trim()
    }))
  )
  expect(executeBatch).not.toHaveBeenCalled()
  projection.append({
    attempt: 1,
    phase: 'settled',
    outcome: 'executed',
    summary: 'Request completed'
  })
  expect(projection.result().current?.message).not.toBe(
    recordedPurpose.item.text.trim()
  )
})

// Exact saved run reusable-tools-1792174632012 input/evidence. Inspector captures
// this verification entry without auxiliary test files; retain the raw source
// fixtures separately for ordinary provider and browser integration tests.
const recordedScope = {
  plan: {
    phase: 'plan',
    method:
      'Editable world-space faces in centimeters, scale 1 px/cm, fixed elevated orthographic three-quarter architectural projection (azimuth35°, elevation25°). 508m height; local facade dimensions estimated from architect photographs where unavailable. No scene or labels.',
    references: [
      'https://www.onenessarchitects.com/project/Taipei-101',
      'https://conf.ncree.org.tw/download/i0981026-structural%20design%20of%20taipei%20101%20tower.pdf'
    ],
    referenceImageIndexes: [1, 3, 4],
    criteria: {
      whole: {
        requirement:
          'Entire Taipei 101 base to spire with distinctive silhouette',
        description:
          'Full tower, eight projecting bamboo modules, narrowed crown, complete spire and base; no decorative scene.',
        verification: 'visual'
      },
      view: {
        requirement:
          'Fixed elevated three-quarter view and consistent perspective',
        description:
          'Two visible sides and top planes use one camera throughout.',
        verification: 'visual'
      },
      detail: {
        requirement:
          'Highly detailed realistic facade, frames and ornamentation',
        description:
          'Visible base entrance, dense framed glazing, tier cornices, corner ornament, medallions and crown details.',
        verification: 'visual'
      },
      material: {
        requirement: 'Realistic materials lighting and shadows',
        description:
          'Blue-green reflective glass, metal trim, sided lighting, ledge shade and roof surfaces.',
        verification: 'visual'
      },
      scale: {
        requirement:
          'Real-world dimensions at 1cm=1px before projection; editable 2D',
        description:
          'Native vectors projected at scale1 from centimeter coordinates, tip50800cm; estimated local dimensions disclosed.',
        verification: 'data'
      }
    },
    detailRequired: true
  }
}
const recordedPurpose = {
  item: {
    type: 'agentMessage',
    id: 'msg_0d223ccae413a4f8016ad26a2ed5cc8191a0e9d221c7ed830c',
    phase: 'commentary',
    text: '我會先確認台北 101 的尺寸與外觀參考，再以固定俯視三分之四視角建立可編輯的建築細節。\n'
  },
  recordedOutput: [
    {
      evidence: {
        status: 'running',
        activity: {
          callId: 'msg_0d223ccae413a4f8016ad26a2ed5cc8191a0e9d221c7ed830c'
        },
        purpose:
          '我會先確認台北 101 的尺寸與外觀參考，再以固定俯視三分之四視角建立可編輯的建築細節。\n'
      }
    },
    {
      evidence: {
        status: 'running',
        activity: {
          callId: 'msg_0d223ccae413a4f8016ad26a58e6f8819189906bb8d26ddcc6'
        },
        purpose:
          '先建立基座、入口與下段帷幕牆；全棟採用同一個俯視投影，508 公尺總高以 50,800 像素的投影前尺度處理。未公開的局部尺寸將依照片比例估算。\n'
      }
    },
    {
      evidence: {
        status: 'running',
        activity: {
          callId: 'msg_0d223ccae413a4f8016ad26a876d108191891875812d7e7ac5'
        },
        purpose:
          '接著建立八組外張竹節、逐格窗框與層間出簷，保留每一片玻璃和金屬構件的可編輯性。\n'
      }
    },
    {
      evidence: {
        status: 'running',
        activity: {
          callId: 'msg_0d223ccae413a4f8016ad26aaeade48191befad91bab3e377d'
        },
        purpose:
          '現在補上觀景層、退縮塔冠與完整尖塔，並加入屋頂平台和金屬肋條。\n'
      }
    },
    {
      evidence: {
        status: 'running',
        activity: {
          callId: 'msg_0d223ccae413a4f8016ad26adb979c81918e08ab82defeb284'
        },
        purpose:
          '調整玻璃反光，減少逐格漸層造成的磁磚感，讓兩個立面的受光方向更一致。\n'
      }
    },
    {
      evidence: {
        status: 'running',
        activity: {
          callId: 'msg_0d223ccae413a4f8016ad26b08b77081918013c6e1b110d7f5'
        },
        purpose:
          '補上立面中央的如意飾件、轉角金屬構造、圓形錢幣浮雕，以及入口的層層門框、雨遮與玻璃門。\n'
      }
    },
    {
      evidence: {
        status: 'running',
        activity: {
          callId: 'msg_0d223ccae413a4f8016ad26b41bb008191874222c1e67d1065'
        },
        purpose:
          '最後補上機電百葉、簷下陰影與屋頂護欄，再檢查全棟及局部細節。\n'
      }
    },
    {
      evidence: {
        status: 'running',
        activity: {
          callId: 'msg_0d223ccae413a4f8016ad26b65273c8191a41b3c38f17476dc'
        },
        purpose:
          '局部檢查顯示尖塔仍像玻璃構造；我會改成金屬圓桿與環帶，並加密塔冠的水平金屬格柵。\n'
      }
    },
    {
      evidence: {
        status: 'running',
        activity: {
          callId: 'msg_0d223ccae413a4f8016ad26bb567f48191b9c93b370e7cf5c5'
        },
        purpose: '修正入口雨遮與如意浮雕的前後遮擋，保留已完成的窗格和材質。\n'
      }
    }
  ]
}
/** Build deliberately whole-view test judgments with explicit image dependencies. */
const wholeViewJudgments = <T>(
  inspectionIds: readonly unknown[],
  checks: readonly T[]
) => ({
  inspectionIds,
  checks: checks.map((check) => ({ ...check, inspectionIds }))
})

it('execution proof retains many small query handoffs with structural recovery', async () => {
  vi.stubGlobal('window', {})
  const { createRetainedDesignContext } =
    await import('../../src/common-apis/retained-design-context')
  let change!: () => void
  const read = vi.fn(() => ['window'])
  const store = createRetainedDesignContext(
    {
      getCurrentWorkspaceId: () => 'workspace',
      getSelectedElementIds: () => [],
      getElementChildren: () => ({
        available: true,
        elementIds: [],
        total: 0,
        nextOffset: null
      }),
      getElementIdsInBounds: read,
      getElementMetadata: (id) => ({
        name: id,
        type: 'rectangle',
        parentId: 'workspace',
        lock: false
      }),
      getElementComputedData: () => ({ x: 1, y: 2 })
    },
    (listener) => {
      change = listener
      return vi.fn()
    }
  )
  const controller = new AbortController()
  try {
    const handles = Array.from({ length: 8 }, (_, index) => {
      const handle = store.retainReceipt(
        ['window'],
        { operation: index },
        controller.signal
      )
      change()
      return handle
    })
    const result = store.read(
      {
        scope: 'region',
        bounds: { x: 8200, y: 23000, width: 1024, height: 1024 },
        delivery: 'reference'
      },
      controller.signal
    )
    expect(result.total).toBe(1)
    if (!result.snapshotId) throw new Error('Expected retained query identity')
    expect(read).toHaveBeenCalledOnce()
    handles.forEach((handle, index) => {
      expect(
        store.read(
          {
            scope: 'snapshot',
            snapshotId: handle.snapshotId,
            delivery: 'receipt'
          },
          controller.signal
        )
      ).toMatchObject({ current: false, receipt: { operation: index } })
      expect(() =>
        store.get(handle.snapshotId, handle.leaseId, controller.signal)
      ).toThrow(/stale/)
    })
    const current = store.retainReceipt(
      ['window'],
      { operation: 'current' },
      controller.signal
    )
    const refine = (index: number) =>
      store.read(
        {
          scope: 'snapshot',
          snapshotId: current.snapshotId,
          filter: { name: { equals: `other-${index}` } },
          delivery: 'reference'
        },
        controller.signal
      )
    for (let index = 0; index < 32; index++) {
      const subset = refine(index)
      const subsetId = subset.snapshotId
      if (!subsetId) throw new Error('Expected refined query identity')
      expect(() =>
        store.read(
          {
            scope: 'snapshot',
            snapshotId: subsetId,
            delivery: 'receipt'
          },
          controller.signal
        )
      ).toThrow(/receipt unavailable/)
    }
    expect(() => refine(32)).not.toThrow()
    expect(
      store.read(
        {
          scope: 'snapshot',
          snapshotId: current.snapshotId,
          delivery: 'receipt'
        },
        controller.signal
      )
    ).toMatchObject({ receipt: { operation: 'current' } })
    expect(
      store.get(result.snapshotId, result.leaseId, controller.signal).orderedIds
    ).toEqual(['window'])
  } finally {
    controller.abort()
    store.dispose()
    vi.unstubAllGlobals()
  }
})

it('execution proof preserves completed writes and unresolved coverage after bounded receipt delivery rejection', async () => {
  const { createServer } = await import('node:http')
  const { createActionBatchMiddleware } = await import('../action-batch')
  const { createServerActionBatchProvider } =
    await import('../../src/ai/server-action-batch-provider')
  const { requireBatchSuccess } = await import('../batch-exchange')
  let delivered: Record<string, unknown> | undefined
  let final: AiActionBatch | undefined
  let postedBytes = 0
  const executed = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result: {
        status: 'complete',
        mutationScope: {
          complete: true,
          elementIds: ['group'],
          removedElementIds: []
        },
        body: 'x'.repeat(17 * 1024 * 1024)
      }
    })),
    context: {}
  }))
  const middleware = createActionBatchMiddleware({
    requestModelActionBatch: async (_input, options) => {
      if (!options.executeBatch) throw new Error('Missing browser dispatch')
      const dispatch = options.executeBatch
      const owner = createLocalOperationTools(
        [AiActionNames.ORGANIZE_DESIGN, AiActionNames.INSPECT_DRAWING].map(
          (name) => ({ name, description: name, inputSchema: {} })
        ),
        { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
        async (batch) => requireBatchSuccess(batch, await dispatch(batch), 1)
      )
      delivered = JSON.parse(
        await owner.call(
          AiActionNames.ORGANIZE_DESIGN,
          { arguments: { operation: 'group', elementIds: ['a', 'b'] } },
          options.signal ?? AbortSignal.abort()
        )
      )
      final = owner.settleOutcome({
        batchId: 'final',
        actions: [
          {
            id: 'complete',
            name: AiActionNames.REPORT_OUTCOME,
            summary: 'Report completion',
            arguments: { outcome: 'completed', message: 'Done' }
          }
        ]
      })
      return final
    }
  })
  const server = createServer((request, response) => {
    void middleware(request, response, () => response.end())
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string')
    throw new Error('Missing loopback address')
  const origin = `http://127.0.0.1:${address.port}`
  const provider = createServerActionBatchProvider({
    fetch: (async (url: RequestInfo | URL, init: RequestInit = {}) => {
      if ((init.headers as Record<string, string>)['x-ai-batch-receipt'])
        postedBytes = Buffer.byteLength(String(init.body))
      return fetch(origin + String(url), {
        ...init,
        headers: { ...init.headers, origin }
      })
    }) as never
  })
  try {
    await provider.requestActionBatch(
      { intent: 'Group two objects', context: {}, actions: [], attempt: 1 },
      { signal: AbortSignal.timeout(10000), executeBatch: executed }
    )
    expect(executed).toHaveBeenCalledOnce()
    expect(postedBytes).toBeLessThan(4096)
    expect(delivered).toMatchObject({
      available: false,
      code: 'ACTION_BATCH_RECEIPT_TOO_LARGE',
      stage: 'delivery',
      settlement: 'completed',
      executionResult: { checks: { counts: { unverified: 1 } } }
    })
    expect((final?.actions[0].arguments as { outcome?: string })?.outcome).toBe(
      'unsupported'
    )
  } finally {
    provider.dispose()
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})

it('execution proof consumes complete mapping scope before bounded delivery and exact retained readback', async () => {
  vi.stubGlobal('window', {})
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const { createRetainedDesignContext } =
    await import('../../src/common-apis/retained-design-context')
  const { createRetainedFillAction } =
    await import('../../src/ai/retained-fill-action')
  const ids = Array.from({ length: 3584 }, (_, index) => `window-${index}`)
  const store = createRetainedDesignContext(
    {
      getCurrentWorkspaceId: () => 'workspace',
      getSelectedElementIds: () => ids,
      getElementChildren: () => {
        throw new Error('Unexpected hierarchy scan')
      },
      getElementIdsInBounds: () => ids,
      getElementMetadata: () => ({ type: 'vector', lock: false }),
      getElementComputedData: () => ({ x: 50 })
    },
    () => () => undefined
  )
  const signal = new AbortController().signal
  const update = vi.fn()
  const action = createRetainedFillAction(store, {
    metadata: () => ({ lock: false }),
    targets: (members) =>
      members.map((elementId) => ({ elementId, fillId: `fill-${elementId}` })),
    owners: () => ids,
    update
  })
  const owner = createLocalOperationTools(
    [createAiToolContract(action)],
    { modelActions: (a) => a, resolveBatch: (b) => b },
    async (batch) => ({
      context: null,
      actionResults: await Promise.all(
        batch.actions.map(async (call) => ({
          actionId: call.id,
          actionName: call.name,
          result: JSON.parse(
            JSON.stringify(
              await action.execute(call.arguments as never, {
                signal,
                runMutation: async (write) => write()
              })
            )
          )
        }))
      )
    })
  )
  try {
    const input = {
      arguments: {
        mappings: [
          {
            query: { scope: 'ids', elementIds: ids },
            coordinateSpace: 'parent-local',
            axis: 'x',
            domain: [0, 100],
            index: 0,
            outside: 'clamp',
            stops: [
              { at: 0, color: '#000000' },
              { at: 1, color: '#ffffff' }
            ]
          }
        ]
      },
      inspection: 'defer'
    }
    const internal = JSON.parse(
      await owner.callInternal(action.name, input, signal)
    )
    expect(internal.actionResults[0].result.mutationScope.elementIds).toEqual(
      ids
    )
    expect(internal.checks.counts.unverified).toBe(ids.length)
    const external = owner.projectModelResult(
      action.name,
      input,
      internal
    ) as typeof internal
    expect(external.actionResults[0].result.mutationScope).toBeUndefined()
    expect(Buffer.byteLength(JSON.stringify(external))).toBeLessThan(2500)
    const retained = external.actionResults[0].result.retained
    const parts: string[] = []
    let offset: number | null = 0
    do {
      const read = store.read(
        {
          scope: 'snapshot',
          snapshotId: retained.snapshotId,
          delivery: 'receipt',
          offset
        },
        signal
      )
      expect('receiptPage' in read).toBe(true)
      if (!('receiptPage' in read) || !read.receiptPage)
        throw new Error('Missing receipt page')
      expect(Buffer.byteLength(JSON.stringify(read))).toBeLessThan(66000)
      parts.push(read.receiptPage.text)
      offset = read.receiptPage.nextOffset
    } while (offset !== null)
    expect(JSON.parse(parts.join('')).mutationScope.elementIds).toEqual(ids)
    expect(update).toHaveBeenCalledOnce()
    store.releaseFor(signal)
    expect(() =>
      store.read(
        {
          scope: 'snapshot',
          snapshotId: retained.snapshotId,
          delivery: 'receipt'
        },
        signal
      )
    ).toThrow()
    expect(update).toHaveBeenCalledOnce()
  } finally {
    store.dispose()
    vi.unstubAllGlobals()
  }
})

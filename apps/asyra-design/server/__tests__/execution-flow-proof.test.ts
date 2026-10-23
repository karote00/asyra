import type { PreparedElementDescriptor } from '../../src/common-apis'
import { invokeLocalTool } from '../local-tool-invocation'
import {
  describeBasicApiResult,
  basicApiResultSchema
} from '../../src/ai/basic-api-results'
import { designPreparationExamples } from '../design-preparation-examples'
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
  expect(result.status).toBe('partial')
  expect(result.settlement).toBe('completed')
  expect(result.measurementIssues).toHaveLength(1)
  expect(result.measurementIssues[0].targetCount).toBe(2)
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
  expect(repeated.definition.availableInResponse).toBe(true)
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
  const designs = createLocalDesignTools([
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply',
      inputSchema: {}
    }
  ])
  const preparation = designs.definitions.find(
    (tool) => tool.name === AiDesignToolIds.PREPARE_DESIGN
  )
  if (!preparation) throw new Error('Missing preparation definition')
  const { nativeToolInputSchema, operationInputIssue } =
    await import('../operation-input-schema')
  const nativePreparation = nativeToolInputSchema(preparation.inputSchema) as {
    examples: unknown[]
    oneOf: Record<string, unknown>[]
  }
  expect(nativePreparation.examples).toEqual(designPreparationExamples)
  expect(
    nativePreparation.oneOf.every(
      (branch) => !Object.hasOwn(branch, 'examples')
    )
  ).toBe(true)
  for (const example of nativePreparation.examples)
    expect(operationInputIssue(example, nativePreparation)).toBeUndefined()
  const highLevel = createLocalOperationTools(
    [
      {
        name: AiActionNames.INSPECT_DRAWING,
        description: 'Inspect',
        inputSchema: {}
      }
    ],
    designs,
    execute,
    {
      getNativeTools: () =>
        [preparation, ...highLevel.definitions].map((definition) => ({
          ...definition,
          namespace: 'design'
        }))
    }
  )
  const usage = JSON.parse(
    await readCompleteInformation(
      (input) =>
        highLevel.call(
          AiDesignToolIds.DESCRIBE_DESIGN_APIS,
          input,
          new AbortController().signal
        ),
      { names: [preparation.name], view: 'usage' }
    )
  ).tools[0]
  expect(usage.inputFields).toContain('/properties/draft')
  expect(usage.invocationExample.illustrative).toBe(true)
  const invocation = usage.invocationExample.invocation
  expect(invocation.tool).toBe(preparation.name)
  const prepared = JSON.parse(
    await designs.call(
      invocation.tool,
      invocation.arguments,
      new AbortController().signal
    )
  )
  expect(prepared.applicable).toBe(true)
  expect(
    designs.resolveTargets({ artifactId: prepared.artifactId })
  ).toHaveLength(prepared.elementCount)
  const restoredUsage = JSON.parse(
    await readCompleteInformation(
      (input) =>
        highLevel.call(
          AiDesignToolIds.DESCRIBE_DESIGN_APIS,
          input,
          new AbortController().signal
        ),
      usage.definition.recover.arguments
    )
  ).tools[0]
  expect(restoredUsage.invocationExample).toEqual(usage.invocationExample)
  const criteriaUsage = JSON.parse(
    await readCompleteInformation(
      (input) =>
        highLevel.call(
          AiDesignToolIds.DESCRIBE_DESIGN_APIS,
          input,
          new AbortController().signal
        ),
      { names: [AiDesignToolIds.DEFINE_DESIGN_CRITERIA], view: 'usage' }
    )
  ).tools[0]
  expect(criteriaUsage.inputFields).toContain('/properties/criteria')
  const criteriaCall = criteriaUsage.invocationExample.invocation
  expect(criteriaCall.tool).toBe(AiDesignToolIds.DEFINE_DESIGN_CRITERIA)
  expect(
    JSON.parse(
      await highLevel.call(
        criteriaCall.tool,
        criteriaCall.arguments,
        new AbortController().signal
      )
    )
  ).toMatchObject({ recorded: true, criterionIds: ['appearance'] })
  expect(execute).not.toHaveBeenCalled()
})
vi.mock('@asyra/ai-agent-runtime/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@asyra/ai-agent-runtime/node')>()),
  createExecutionRecordSink: vi.fn(() => ({
    write: () => undefined,
    flush: async () => ({ status: 'saved', path: null })
  }))
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
  const fragments = new Map<number, string>()
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
      const fragment = packet.result?.contentItems?.[0]?.text
        ? JSON.parse(packet.result.contentItems[0].text).contentDelivery
        : undefined
      if (fragment) {
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
                threadId: 'proof-thread',
                turnId: 'proof-turn',
                callId: `fragment-${packet.id}-${fragment.endByte}`,
                namespace: 'design_operations',
                tool: fragment.next.tool,
                arguments: fragment.next.arguments
              }
            })
          )
          done()
          return
        }
        expect(Buffer.byteLength(complete)).toBe(fragment.totalBytes)
        packet.result.contentItems[0].text = complete
      }
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
          definition: expect.objectContaining({ state: 'included' })
        })
      )
  )
  for (const api of categoryApis) expect(api.inputSchema).toBeDefined()
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
    expect(produced.toolOutcome).toMatchObject({
      status: 'partial',
      settlement: 'completed'
    })
    expect(produced.measurementIssues).toHaveLength(1)
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
  expect(result.toolOutcome).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(result.measurementIssues[0].message).toContain('not registered')
  expect(result.failedStep).toBeUndefined()
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
  ).toMatchObject({ structureAccepted: true, accepted: false })
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
  const writePayload = vi.fn(() => ({
    status: 'queued' as const,
    path: 'native.json'
  }))
  const native = createAiExecutionProfiler(
    { intent: 'private', context: {}, actions: [], attempt: 1 },
    'test-model',
    {
      sink: {
        write: (record) => records.push(record),
        writePayload,
        flush: async () => ({ status: 'saved', path: null })
      }
    }
  )
  const output = {
    stage: 'native-completed-result',
    status: 'unavailable',
    modelVisibility: 'unavailable'
  }
  native.trace('provider_item_completed', {
    callId: 'item:delivery',
    nativeOutput: output
  })
  expect(writePayload).toHaveBeenCalledWith(
    expect.any(String),
    'item:delivery',
    'output',
    output
  )
  expect(records.at(-1)).toMatchObject({
    diagnostic: { output: { payload: { path: 'native.json' } } }
  })
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
      {
        label: 'Operation ended - outcome unconfirmed',
        message: 'Adjusting the roof color'
      },
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
    view: 'details',
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
    await call(AiDesignToolIds.READ_DESIGN_CHECKS, {
      view: 'details',
      includePassed: true
    })
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
  const pending = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {
    view: 'details'
  })
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

const exerciseMultiscaleEvidence = async () => {
  let sequence = 0
  let failCapture = false
  const invalid = new Set<string>()
  const captures: { receiptId: string; elementId: string }[] = []
  const execute = vi.fn(
    async (batch: AiActionBatch): Promise<AiBatchReceipt> => ({
      context: {},
      actionResults: batch.actions.map(
        (action): AiBatchReceipt['actionResults'][number] => {
          const args = action.arguments as {
            elementId?: string
            evidence?: { receiptId?: string }
            scope?: unknown
          }
          if (action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE)
            return {
              actionId: action.id,
              actionName: action.name,
              result: {
                current: !invalid.has(args.evidence?.receiptId ?? ''),
                validatedAt: { sessionId: 'multiscale', revision: sequence },
                coverage: { complete: args.scope !== undefined }
              }
            }
          expect(action.name).toBe(AiActionNames.INSPECT_DRAWING)
          if (failCapture)
            return {
              actionId: action.id,
              actionName: action.name,
              result: { available: false, error: 'Capture unavailable' }
            }
          const receiptId = `image-${++sequence}`
          captures.push({ receiptId, elementId: String(args.elementId) })
          return {
            actionId: action.id,
            actionName: action.name,
            result: {
              available: true,
              image: { dataUrl: 'data:image/png;base64,AA==' },
              evidence: {
                sessionId: 'multiscale',
                revision: sequence,
                receiptId
              }
            }
          }
        }
      )
    })
  )
  const checkResults = createDesignCheckResults()
  const tools = createOperationOwner(
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
    { reviewTargetId: 'composition' }
  )
  const signal = new AbortController().signal
  const call = async (name: string, args: Record<string, unknown>) =>
    JSON.parse(await tools.call(name, args, signal))
  await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
    ...reviewPlanExample,
    structureCriteria: [],
    detailRequired: false,
    criteria: {
      ...reviewCriteria(['Overall']),
      appearance: {
        requirement: 'Composition and detail agree',
        description: 'Use the necessary scales for each conclusion',
        verification: 'visual',
        requiredUnits: ['local', 'combined']
      }
    }
  })
  const target = (
    unitId: string,
    region?: { x: number; y: number; width: number; height: number }
  ) => ({
    elementId: 'composition',
    view: region ? 'detail' : 'overview',
    ...(region ? { region } : {}),
    checks: [{ criterionId: 'appearance', unitId }]
  })
  const crop = { x: 0, y: 0, width: 40, height: 40 }
  const local = await call(AiDesignToolIds.REVIEW_DRAWING, {
    phase: 'visual',
    final: false,
    inspections: [target('local', { ...crop, x: 80 })]
  })
  const submit = async (reply: typeof local, final = false) =>
    call(AiDesignToolIds.REVIEW_DRAWING, {
      ...reply.next.arguments,
      final,
      checks: reply.next.arguments.checks.map(
        (check: Record<string, unknown>) => ({
          ...check,
          status: 'pass',
          evidence: 'Observed the declared requirement in every bound image'
        })
      )
    })
  await submit(local)
  const localResult = checkResults
    .read({ includePassed: true })
    .items.find((x) => x.unitId === 'local')
  const combined = await call(AiDesignToolIds.REVIEW_DRAWING, {
    phase: 'visual',
    final: false,
    inspections: [target('combined'), target('combined', crop)]
  })
  expect(combined.reviewOperation).toBe('capture')
  expect(combined.next.arguments.checks).toHaveLength(1)
  const check = combined.next.arguments.checks[0]
  expect(check.inspectionIds).toHaveLength(2)
  expect(check.binding.dependencies).toHaveLength(2)
  const before = checkResults.read({ includePassed: true })
  const tampered = structuredClone(combined.next.arguments)
  tampered.checks[0].inspectionIds = [check.inspectionIds[0]]
  tampered.checks[0].status = 'pass'
  tampered.checks[0].evidence = 'Missing required local evidence'
  await expect(call(AiDesignToolIds.REVIEW_DRAWING, tampered)).rejects.toThrow(
    /binding/i
  )
  expect(checkResults.read({ includePassed: true })).toEqual(before)
  const pending = await submit(combined, true)
  expect(pending.accepted).toBe(false)
  expect(pending.coverage.pending).toContainEqual(
    expect.objectContaining({ criterionId: 'Overall' })
  )
  const verdict = checkResults
    .read({ includePassed: true })
    .items.find((x) => x.unitId === 'combined')
  expect(
    Object.keys(verdict?.dependencies ?? {}).filter((k) =>
      k.startsWith('inspection:')
    )
  ).toHaveLength(2)
  const bind = (
    criterionId: string,
    inspectionIds: string[],
    unitId?: string,
    supersedes?: unknown
  ) =>
    call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: 'visual',
      final: false,
      bindChecks: [
        {
          criterionId,
          ...(unitId ? { unitId } : {}),
          inspectionIds,
          ...(supersedes ? { supersedes } : {})
        }
      ]
    })
  expect(await bind('appearance', ['foreign-image'], 'combined')).toMatchObject(
    { status: 'partial', recordedChecks: [] }
  )
  await expect(
    bind('appearance', [check.inspectionIds[0]], 'combined')
  ).rejects.toThrow(/scope changed/)
  const overall = await bind('Overall', [check.inspectionIds[0]])
  expect((await submit(overall, true)).accepted).toBe(true)
  let active = combined
  for (const dependencyIndex of [0, 1]) {
    const dependency =
      active.next.arguments.checks[0].binding.dependencies[dependencyIndex]
    invalid.add(dependency.source.receiptId)
    await call(AiDesignToolIds.READ_DESIGN_CHECKS, { view: 'details' })
    const results = checkResults.read({ includePassed: true }).items
    expect(results.find((x) => x.unitId === 'combined')?.status).toBe('stale')
    expect(results.find((x) => x.unitId === 'local')).toEqual(localResult)
    const priorCount = captures.length
    failCapture = true
    const failed = await call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: 'visual',
      final: false,
      inspections: [target('combined', crop)]
    })
    expect(failed.accepted).not.toBe(true)
    expect(
      checkResults
        .read({ includePassed: true })
        .items.find((x) => x.unitId === 'combined')?.status
    ).toBe('stale')
    failCapture = false
    const fresh = await call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: 'visual',
      final: false,
      inspections: [target('combined'), target('combined', crop)]
    })
    expect(captures.length - priorCount).toBe(2)
    await submit(fresh)
    active = fresh
    expect(
      (await submit(await bind('Overall', [fresh.inspectionIds[0]]), true))
        .accepted
    ).toBe(true)
  }
  const current = checkResults
    .read({ includePassed: true })
    .items.find((item) => item.unitId === 'combined')
  if (!current) throw new Error('Expected combined verdict')
  const captureCount = captures.length
  const replacement = await bind(
    'appearance',
    [active.inspectionIds[1]],
    'combined',
    {
      revision: current.revision,
      reason: 'The revised requirement is assessed at detail scale'
    }
  )
  expect(captures).toHaveLength(captureCount)
  expect(
    checkResults
      .read({ includePassed: true })
      .items.find((item) => item.unitId === 'combined')
  ).toEqual(current)
  await submit(replacement)
  const replaced = checkResults
    .read({ includePassed: true })
    .items.find((item) => item.unitId === 'combined')
  if (!replaced) throw new Error('Expected replacement verdict')
  expect(replaced.revision).toBeGreaterThan(current.revision)
  expect(
    Object.keys(replaced.dependencies).filter((key) =>
      key.startsWith('inspection:')
    )
  ).toEqual([`inspection:${active.inspectionIds[1]}`])
  const aborted = new AbortController()
  aborted.abort()
  const calls = execute.mock.calls.length
  await expect(
    tools.call(
      AiDesignToolIds.REVIEW_DRAWING,
      {
        phase: 'visual',
        inspections: [target('combined', crop)]
      },
      aborted.signal
    )
  ).rejects.toThrow()
  expect(execute.mock.calls).toHaveLength(calls)
  expect(
    checkResults
      .read({ includePassed: true })
      .items.find((x) => x.unitId === 'local')
  ).toEqual(localResult)
}

it('execution proof retains regional units without requiring global coverage for local review', async () => {
  await exerciseMultiscaleEvidence()
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
  const work = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {
    view: 'details'
  })
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
  const retained = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {
    view: 'details'
  })
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

it('execution proof retires superseded recorded purpose after provider tool settlement', async ({
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
    stages.map(() => ({
      label: 'Completed operation',
      message: 'Finding available operations'
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

it('execution proof preserves world material phase through preparation and current artifact consumption', async () => {
  const session = createDesignPreparationSession()
  const result = session.prepare({
    type: 'group',
    name: 'Common field',
    projection: { azimuth: 0, elevation: 30, scale: 2, originX: 0, originY: 0 },
    linearFields: {
      paint: {
        frame: 'world',
        start: { x: 0, y: 0, z: 0 },
        end: { x: 0, y: 0, z: 40 },
        gradientStops: [
          { position: 0, color: '#000000', opacity: 1 },
          { position: 1, color: '#ffffff', opacity: 1 }
        ]
      }
    },
    children: [
      {
        key: 'p',
        name: 'Surfaces',
        type: 'pattern',
        origin: { x: 0, y: 0, z: 0 },
        axes: [{ count: 2, step: { x: 0, y: 0, z: 20 } }],
        faces: [
          {
            key: 'f',
            name: 'Face',
            materialField: 'paint',
            vertices: [
              { x: 0, y: 0, z: 0 },
              { x: 40, y: 0, z: 0 },
              { x: 40, y: 0, z: 20 },
              { x: 0, y: 0, z: 20 }
            ]
          }
        ]
      }
    ]
  })
  const design = session.resolve(result.artifactId)
  design.entries.slice(1).forEach((e, i) => {
    const g = (
      e.descriptor.fills as {
        gradient: { gradientHandles: { x: number; y: number }[] }
      }[]
    )[0].gradient
    const [a, b] = g.gradientHandles,
      dx = b.x - a.x,
      dy = b.y - a.y
    expect(
      ((0.5 - a.x) * dx + (0.5 - a.y) * dy) / (dx * dx + dy * dy)
    ).toBeCloseTo(0.25 + i * 0.5, 9)
  })
  const revision = await session.reviseMaterial(
    result.artifactId,
    'paint',
    {
      frame: 'world',
      start: { x: 0, y: 0, z: 0 },
      end: { x: 0, y: 0, z: 40 },
      gradientStops: [
        { position: 0, color: '#123456', opacity: 0.5 },
        { position: 1, color: '#abcdef', opacity: 1 }
      ]
    },
    new AbortController().signal
  )
  const updates = session.materialRevision(revision.materialRevisionId).updates
  expect(updates.map((item) => item.elementId)).toEqual(
    design.entries.slice(1).map((entry) => entry.descriptor.id)
  )
  updates.forEach((item, index) => {
    const original = (
      design.entries[index + 1].descriptor.fills as {
        gradient: { gradientHandles: unknown }
      }[]
    )[0].gradient
    expect(item.gradient).toMatchObject({
      gradientHandles: original.gradientHandles,
      gradientStops: [
        { position: 0, color: '#123456', opacity: 0.5 },
        { position: 1, color: '#abcdef', opacity: 1 }
      ]
    })
  })
  session.release([result.artifactId])
  expect(() => session.resolve(result.artifactId)).toThrow()
})

it('execution proof consumes repeated multi-face examples through exact native targets and artifact lifetime', async () => {
  const example = designPreparationExamples.find(
    (e) => e.draft.name === 'Repeated visible detail'
  )
  if (!example) throw new Error('Missing multi-face example')
  const session = createDesignPreparationSession()
  const result = session.prepare(example.draft)
  const design = session.resolve(result.artifactId)
  const keys = Array.from({ length: 6 }, (_, i) => [
    `panes-${i}-glass`,
    `panes-${i}-rim`
  ]).flat()
  expect(design.entries.slice(1).map((e) => e.key)).toEqual([
    ...keys,
    'exception'
  ])
  const tools = createLocalDesignTools(
    [
      {
        name: AiActionNames.APPLY_PREPARED_DESIGN,
        description: 'Apply native prepared elements',
        inputSchema: {}
      }
    ],
    session
  )
  const retained = JSON.parse(
    await tools.call(
      'retain_design_targets',
      {
        targets: [{ artifactId: result.artifactId, keyPrefix: 'panes-2-' }]
      },
      new AbortController().signal
    )
  )
  const { artifactId, targetSetId } = retained.targets[0]
  expect(tools.resolveTargets({ artifactId, targetSetId })).toEqual(
    keys.slice(4, 6).map((k) => design.keyToId[k])
  )
  const fills = design.entries
    .slice(1)
    .map((e) => e.descriptor.fills as { id: string; gradient?: unknown }[])
  expect(new Set(fills.map((f) => f[0].id)).size).toBe(13)
  expect(fills[0][0].gradient).not.toEqual(fills[2][0].gradient)
  const sibling = session.prepare(example.draft)
  session.release([artifactId])
  expect(() => tools.resolveTargets({ artifactId, targetSetId })).toThrow()
  expect(session.resolve(sibling.artifactId).entries).toHaveLength(14)
  const mixedExample = designPreparationExamples.find(
    (entry) => entry.draft.name === 'Translated components'
  )
  if (!mixedExample) throw new Error('Missing mixed component example')
  const mixed = session.prepare(mixedExample.draft)
  const mixedDesign = session.resolve(mixed.artifactId)
  const componentKeys = Array.from({ length: 2 }, (_, index) => [
    `component-${index}-panel`,
    ...Array.from(
      { length: 6 },
      (_, cell) => `component-${index}-grid-${cell}-inset`
    )
  ]).flat()
  expect(mixedDesign.entries.slice(1).map((entry) => entry.key)).toEqual(
    componentKeys
  )
  expect(
    mixedDesign.entries
      .slice(1)
      .every((entry) => entry.parentId === mixedDesign.rootId)
  ).toBe(true)
  const mixedTargets = JSON.parse(
    await tools.call(
      'retain_design_targets',
      {
        targets: [{ artifactId: mixed.artifactId, keyPrefix: 'component-1-' }]
      },
      new AbortController().signal
    )
  ).targets[0]
  const mixedTargetReference = {
    artifactId: mixedTargets.artifactId,
    targetSetId: mixedTargets.targetSetId
  }
  expect(tools.resolveTargets(mixedTargetReference)).toEqual(
    componentKeys.slice(7).map((key) => mixedDesign.keyToId[key])
  )
  session.release([mixed.artifactId])
  expect(() => tools.resolveTargets(mixedTargetReference)).toThrow()
})

it('execution proof rejects mismatched query scopes before reads and preserves explicit refinement', async () => {
  vi.stubGlobal('window', {})
  const { createRetainedDesignContext } =
    await import('../../src/common-apis/retained-design-context')
  const { createDocumentContextAction } =
    await import('../../src/ai/context-action')
  // Exact saved C21 is replayed in provider, context and browser integration suites.
  // The isolated architecture proof exercises its unsupported selector contract.
  const invalid = {
    scope: 'children',
    parentId: 'workspace',
    filter: { type: 'group' }
  }
  const children = vi.fn(() => ({
    available: true,
    elementIds: ['a'],
    total: 1,
    nextOffset: null
  }))
  const source = {
    getCurrentWorkspaceId: () => 'workspace',
    getSelectedElementIds: () => [],
    getElementChildren: children,
    getElementIdsInBounds: () => [],
    getElementMetadata: () => ({
      name: 'a',
      type: 'group',
      parentId: 'workspace'
    }),
    getElementComputedData: () => ({})
  }
  const store = createRetainedDesignContext(source, () => () => undefined)
  const action = createDocumentContextAction(store.read)
  const signal = new AbortController().signal
  try {
    await expect(action.execute(invalid as never, { signal })).rejects.toThrow(
      /filter.*region.*snapshot/
    )
    expect(children).not.toHaveBeenCalled()
    const parent = store.read({ scope: 'children' }, signal)
    if (!parent.snapshotId) throw new Error('Expected retained parent identity')
    const filtered = store.read(
      {
        scope: 'snapshot',
        snapshotId: parent.snapshotId,
        filter: { type: 'group' },
        delivery: 'page'
      },
      signal
    )
    expect(filtered.elements.map((row) => row.id)).toEqual(['a'])
    expect(children).toHaveBeenCalledTimes(1)
    expect(store.get(parent.snapshotId, undefined, signal).orderedIds).toEqual([
      'a'
    ])
  } finally {
    store.dispose()
  }
})

it('execution proof dispatches the published chosen-method route without converting record success into acceptance', async () => {
  const { operationInputIssue } = await import('../operation-input-schema')
  const method = await readKnowledgeTopic(
    'design.architectural-illustration.materials.review'
  )
  const example = (label: string) => {
    const match = method.match(
      new RegExp('```json ' + label + '\\n([\\s\\S]*?)\\n```')
    )
    if (!match) throw new Error(`Missing executable ${label} example`)
    return JSON.parse(match[1])
  }
  const declaration = example('representative-review')
  const capture = example('representative-capture')
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map(
      (action): NonNullable<AiBatchReceipt['actionResults']>[number] => ({
        actionId: action.id,
        actionName: action.name,
        result:
          action.name === AiActionNames.INSPECT_DRAWING
            ? {
                available: true,
                imageScope: 'region',
                evidence: { sessionId: 'sample', revision: 1 },
                image: { dataUrl: 'data:image/png;base64,AA==' }
              }
            : {
                current: true,
                validatedAt: { sessionId: 'sample', revision: 1 },
                coverage: { complete: true }
              }
      })
    )
  }))
  // Use the actual native owner, without a fixture-supplied binding actor.
  const owner = createOperationOwner(
    [
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (a) => a, resolveBatch: (b) => b },
    execute,
    {
      getNativeTools: () =>
        owner.definitions.map((definition) => ({
          ...definition,
          namespace: 'design_operations'
        }))
    }
  )
  const signal = new AbortController().signal
  const call = async (name: string, input: unknown) =>
    JSON.parse(
      await readCompleteInformation(
        (args) => owner.call(name, args, signal),
        input
      )
    )
  for (const sample of [declaration, capture]) {
    const lookup = await call('describe_design_apis', {
      names: [`design_operations.${sample.tool}`]
    })
    expect(lookup.tools[0].definition.availableInResponse).toBe(true)
    expect(
      operationInputIssue(sample.arguments, lookup.tools[0].inputSchema)
    ).toBeUndefined()
  }
  expect(execute).not.toHaveBeenCalled()
  await call(declaration.tool, declaration.arguments)
  const bound = await call(capture.tool, capture.arguments)
  expect(bound.recordedChecks).toEqual([])
  expect(bound.next.arguments.checks).toHaveLength(1)
  expect(bound.acceptanceContext).toEqual({
    method: declaration.arguments.method,
    requirementRevision:
      bound.next.arguments.checks[0].binding.requirementRevision,
    checks: bound.next.arguments.checks.map(
      ({ criterionId, unitId }: { criterionId: string; unitId?: string }) => ({
        criterionId,
        ...(unitId === undefined ? {} : { unitId }),
        requirement: declaration.arguments.criteria[criterionId].requirement,
        description: declaration.arguments.criteria[criterionId].description
      })
    )
  })
  expect(bound.next.arguments).not.toHaveProperty('acceptanceContext')

  const result = await call(capture.tool, {
    ...bound.next.arguments,
    checks: bound.next.arguments.checks.map((check: object) => ({
      ...check,
      status: 'pass',
      evidence: 'Deterministic primary-agent observation of the sample join.'
    }))
  })
  expect(result).toMatchObject({
    reviewOperation: 'record',
    accepted: false,
    recordedChecks: [
      {
        criterionId: 'material',
        unitId: 'sample-join',
        status: 'pass',
        revision: expect.any(Number)
      }
    ],
    coverage: { pending: [expect.objectContaining({ criterionId: 'overall' })] }
  })
  const retained = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {
    view: 'details',
    ids: [result.recordedChecks[0].id],
    includePassed: true
  })
  expect(retained.items[0]).toMatchObject({
    status: 'pass',
    revision: result.recordedChecks[0].revision
  })
  expect(
    execute.mock.calls
      .flatMap(([batch]) => batch.actions)
      .every((action) =>
        [
          AiActionNames.INSPECT_DRAWING,
          AiActionNames.VALIDATE_INSPECTION_EVIDENCE
        ].includes(action.name as typeof AiActionNames.INSPECT_DRAWING)
      )
  ).toBe(true)
})

it('execution proof admits complete per-target material corrections from the published route', async () => {
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const { basicApiResultSchema } =
    await import('../../src/ai/basic-api-results')
  const { toolSemantics } = await import('../../src/ai/tool-contract')
  const { operationInputIssue } = await import('../operation-input-schema')
  const method = await readKnowledgeTopic(
    'design.architectural-illustration.materials.correction'
  )
  const match = method.match(
    /```json native-palette-correction\n([\s\S]*?)\n```/
  )
  if (!match)
    throw new Error('Missing executable native-palette-correction example')
  const example = JSON.parse(match[1])
  const contract = basicApiContracts.find(
    (item) => item.name === 'api_fill_updateFillsAtIndex'
  )
  if (!contract) throw new Error('Missing native fill contract')
  const operation = example.arguments.operations[0]
  expect(
    operationInputIssue(operation.arguments, contract.inputSchema)
  ).toBeUndefined()
  expect(operation.arguments.patch).toHaveLength(2)
  expect(operation.arguments.patch[0].gradient.gradientHandles).not.toEqual(
    operation.arguments.patch[1].gradient.gradientHandles
  )
  const dispatch = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((a) => ({
      actionId: a.id,
      actionName: a.name,
      result: { status: 'complete' }
    }))
  }))
  const owner = createOperationOwner(
    [
      createAiToolContract({
        ...contract,
        ...toolSemantics(basicApiResultSchema(contract), 'mutation', [
          'document'
        ])
      })
    ],
    { modelActions: (a) => a, resolveBatch: (b) => b },
    dispatch
  )
  const signal = new AbortController().signal
  const broken = structuredClone(example.arguments)
  broken.operations[0].arguments.patch[1].gradient = {
    gradientStops: operation.arguments.patch[1].gradient.gradientStops
  }
  await expect(owner.call(example.tool, broken, signal)).rejects.toThrow()
  expect(dispatch).not.toHaveBeenCalled()
  await owner.call(example.tool, example.arguments, signal)
  expect(dispatch).toHaveBeenCalledTimes(1)
  expect(dispatch.mock.calls[0][0].actions[0].arguments).toEqual(
    operation.arguments
  )
})

it('execution proof preserves exact shared property relationships in publication', async () => {
  const { prepareDocumentPublication, readDocumentPublicationSlices } =
    await import('../../src/collaboration/document-publication')
  const { EventTypes } = await import('@asyra/core/contracts')
  const { SharedDataChannelNames, PROPS_ACTIONS } = await import('@asyra/utils')
  const source = {
    publicationId: 'share-material',
    artifactId: 'share-artifact',
    transactionId: 1,
    origin: 'action' as const,
    mode: 'atomic' as const,
    slices: [
      {
        sliceId: 'share-slice',
        orderedIds: ['target-fills'],
        batches: [
          {
            batchId: 'share-batch',
            channel: SharedDataChannelNames.PROPS,
            deliveries: [
              {
                deliveryId: 'link',
                orderedIds: ['target-fills'],
                eventName: EventTypes.UPDATE_PROPERTY,
                payload: {
                  action: PROPS_ACTIONS.UPDATE_PROPERTY,
                  eventName: EventTypes.UPDATE_PROPERTY,
                  id: 'target-fills',
                  key: 'fills',
                  before: ['old-fill'],
                  after: ['existing-fill']
                }
              },
              {
                deliveryId: 'remove',
                orderedIds: ['target-fills'],
                eventName: EventTypes.REMOVE_PROPERTY,
                payload: {
                  action: PROPS_ACTIONS.REMOVE_PROPERTY,
                  eventName: EventTypes.REMOVE_PROPERTY,
                  data: [{ id: 'old-fill', type: 'fill', color: '#112233' }]
                }
              }
            ]
          }
        ]
      }
    ]
  }
  const result = prepareDocumentPublication(source)
  expect(readDocumentPublicationSlices(result)[0]).toEqual([
    {
      kind: 'property-components',
      updates: [
        { propertyId: 'target-fills', values: { fills: ['existing-fill'] } }
      ]
    },
    {
      kind: 'property-components',
      updates: [],
      removals: [{ id: 'old-fill', type: 'fill', color: '#112233' }]
    }
  ])
  const undoSource = {
    ...source,
    origin: 'undo' as const,
    slices: source.slices.map((slice) => ({
      ...slice,
      batches: slice.batches.map((batch) => ({
        ...batch,
        deliveries: [
          {
            deliveryId: 'restore-color',
            orderedIds: ['target-fills'],
            eventName: EventTypes.UPDATE_PROPERTY,
            payload: {
              action: PROPS_ACTIONS.UPDATE_PROPERTY,
              eventName: EventTypes.UPDATE_PROPERTY,
              id: 'old-fill',
              key: 'color',
              before: '#333333',
              after: '#112233'
            }
          },
          ...batch.deliveries
        ]
      }))
    }))
  }
  const undoChanges = readDocumentPublicationSlices(
    prepareDocumentPublication(undoSource)
  )[0]
  expect(undoChanges).toEqual([
    {
      kind: 'property-components',
      updates: [
        { propertyId: 'old-fill', values: { color: '#112233' } },
        { propertyId: 'target-fills', values: { fills: ['existing-fill'] } }
      ]
    },
    {
      kind: 'property-components',
      updates: [],
      removals: [{ id: 'old-fill', type: 'fill', color: '#112233' }]
    }
  ])
})

it('execution proof preserves owner result distinctions through native contract admission', async () => {
  const { operationInputIssue } = await import('../operation-input-schema')
  const { toolSemantics, designActionOutcome } =
    await import('../../src/ai/tool-contract')
  const contract = basicApiContracts.find(
    (item) => item.name === 'api_fill_updatePrimaryFillColors'
  )
  if (!contract) throw new Error('Missing primary color contract')
  expect(contract.description).toContain('changed, unchanged or unavailable')
  const definition = {
    ...toolSemantics(basicApiResultSchema(contract), 'mutation', ['document']),
    name: contract.name,
    description: contract.description,
    inputSchema: contract.inputSchema
  }
  const cases = [
    { values: [], status: 'success' },
    { values: ['unchanged'], status: 'success' },
    { values: ['changed', 'unchanged'], status: 'success' },
    { values: ['unavailable'], status: 'failed' },
    { values: ['changed', 'unavailable'], status: 'partial' }
  ]
  for (const { values, status } of cases) {
    const updates = values.map((_, index) => ({
      elementId: `target-${index}`,
      color: '#112233'
    }))
    const call = vi.fn(async () => {
      const result = {
        ...describeBasicApiResult(contract, values, updates),
        mutationScope: {
          complete: true,
          elementIds: values.flatMap((value, index) =>
            value === 'changed' ? [`target-${index}`] : []
          ),
          removedElementIds: []
        }
      }
      return JSON.stringify({
        ...result,
        toolOutcome: designActionOutcome(result)
      })
    })
    const reply = await invokeLocalTool(
      { call },
      definition,
      { updates },
      new AbortController().signal
    )
    expect(JSON.parse(reply.text).toolOutcome.status).toBe(status)
    expect(reply.success).toBe(status === 'success')
    expect(call).toHaveBeenCalledOnce()
    await invokeLocalTool(
      { call },
      definition,
      { updates: [{ elementId: 'target', color: '' }] },
      new AbortController().signal
    )
    expect(call).toHaveBeenCalledOnce()
  }
  for (const [name, value, inputs] of [
    ['api_element_setVectorClosed', undefined, ['target']],
    ['api_element_createElements', ['created-prefix'], [{}, {}]]
  ] as const) {
    const uncertain = basicApiContracts.find((item) => item.name === name)
    if (!uncertain) throw new Error('Missing owner contract')
    const result = {
      ...describeBasicApiResult(uncertain, value, inputs),
      settlement: 'completed',
      mutationScope: {
        complete: true,
        elementIds: ['target'],
        removedElementIds: []
      }
    }
    expect(
      operationInputIssue(result, basicApiResultSchema(uncertain))
    ).toBeUndefined()
    const call = vi.fn(async () => JSON.stringify(result))
    const reply = await invokeLocalTool(
      { call },
      {
        ...toolSemantics(basicApiResultSchema(uncertain), 'mutation', [
          'document'
        ]),
        name,
        description: uncertain.description,
        inputSchema: { type: 'object' }
      },
      {},
      new AbortController().signal
    )
    expect(reply.success).toBe(false)
    expect(JSON.parse(reply.text)).toMatchObject({
      status: 'failed',
      settlement: 'completed',
      value: value ?? null,
      toolOutcome: {
        status: 'failed',
        settlement: 'completed'
      }
    })
    expect(JSON.parse(reply.text).code).toBe('OWNER_RESULT_INVALID')
    expect(call).toHaveBeenCalledOnce()
  }
})

it('execution proof preserves Core mutation and valid no-op receipts through native invocation', async () => {
  const { Core } = await import('@asyra/core')
  const { Factory } = await import('@asyra/factory')
  const {
    default: props,
    registerPropertySchema,
    registerPropertyComponent,
    createPropertyComponentFromConfig,
    elementPropertyRegistry
  } = await import('@asyra/props-manager')
  const {
    default: scene,
    componentRegistry,
    createDynamicComponent
  } = await import('@asyra/scene-tree')
  const { runWithTransactionOwner, runTransaction } =
    await import('@asyra/reactive-events')
  const { toolSemantics } = await import('../../src/ai/tool-contract')
  const { operationInputIssue } = await import('../operation-input-schema')
  const type = 'owner-receipt-proof-value',
    ownerType = 'owner-receipt-proof-element'
  const config = {
    type,
    defaults: { opacity: 1 },
    persistKeys: ['opacity'],
    valueKeys: ['opacity']
  }
  registerPropertySchema({
    type,
    fields: [{ key: 'opacity', kind: 'number', defaultValue: 1 }]
  })
  registerPropertyComponent(
    type,
    createPropertyComponentFromConfig(config),
    undefined,
    config
  )
  const properties = [{ name: 'material', type, alias: ['opacity'] }]
  elementPropertyRegistry.register(properties[0], ownerType)
  componentRegistry.register({
    type: ownerType,
    idPrefix: ownerType,
    namePrefix: 'Receipt Element',
    properties,
    constructor: createDynamicComponent(
      ownerType,
      ownerType,
      'Receipt Element',
      properties,
      {}
    ),
    defaults: {}
  })
  const factory = new Factory()
  const api = new Core({
    inputSystem: {} as never,
    factory,
    props,
    sceneTree: scene,
    render: {} as never,
    selection: {} as never,
    systemContext: {} as never
  })
  const run = <T>(call: () => T) =>
    runWithTransactionOwner(factory.getTransactionOwner(), () =>
      runTransaction(call)
    )
  const reset = () => {
    factory.transact.reset()
    props.reset()
    scene.reset()
    props.load({
      source: { id: 'source', type, opacity: 1, sharedSource: true }
    })
    scene.load({
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
          children: ['a']
        },
        a: {
          id: 'a',
          type: ownerType,
          name: 'A',
          parentId: 'workspace',
          visible: true,
          lock: false,
          props: { material: 'source' }
        }
      }
    })
  }
  const target = { elementId: 'a', propertyName: 'material', path: [] }
  const cases: [string, Record<string, unknown>][] = [
    [
      'updateElementProperties',
      { updates: [{ elementId: 'a', values: { opacity: 0.4 } }] }
    ],
    [
      'patchElementProperties',
      { patches: [{ elementId: 'a', values: { opacity: 0.4 }, records: [] }] }
    ],
    [
      'updatePropertyComponents',
      { updates: [{ propertyId: 'source', values: { opacity: 0.4 } }] }
    ],
    [
      'updateElementPropertyTargets',
      { updates: [{ target, values: { opacity: 0.4 } }] }
    ],
    [
      'resetElementPropertyOverrides',
      { updates: [{ target, keys: ['opacity'] }] }
    ],
    ['detachElementPropertyTargets', { targets: [target] }],
    [
      'shareElementPropertyTargets',
      { updates: [{ target, sourceId: 'source' }] }
    ],
    [
      'updateSharedPropertySources',
      { updates: [{ propertyId: 'source', values: { opacity: 0.4 } }] }
    ],
    ['updateElementData', { elementId: 'a', values: { name: 'Renamed' } }]
  ]
  try {
    const writers = basicApiContracts.filter(
      (entry) =>
        entry.owner === 'core' && ['write', 'delete'].includes(entry.effect)
    )
    expect(
      writers.filter((entry) => String(entry.result.kind) === 'owner')
    ).toEqual([])
    for (const [name, input] of cases) {
      reset()
      if (name === 'resetElementPropertyOverrides')
        run(() =>
          api.updateElementPropertyTargets([
            { target, values: { opacity: 0.4 } }
          ])
        )
      if (name === 'shareElementPropertyTargets')
        run(() => api.detachElementPropertyTargets([target]))
      const contract = writers.find((entry) => entry.method === name)
      if (!contract) throw new Error('Missing Core mutation contract')
      const definition = {
        ...toolSemantics(basicApiResultSchema(contract), 'mutation', [
          'document'
        ]),
        partialOutputSchema: basicApiResultSchema(contract, true),
        name: contract.name,
        description: contract.description,
        inputSchema: contract.inputSchema
      }
      const call = vi.fn(async () => {
        const method = api[name as keyof typeof api]
        if (typeof method !== 'function') throw new Error('Missing Core owner')
        const raw = run(() =>
          Reflect.apply(
            method,
            api,
            contract.parameters.map((key) => input[key])
          )
        )
        // This proof checks canonical return semantics; App publication capture has its own integration test.
        const output = {
          ...describeBasicApiResult(
            contract,
            raw,
            input[contract.parameters[0]]
          ),
          mutationScope: {
            complete: false,
            elementIds: [],
            removedElementIds: []
          }
        }
        expect(
          operationInputIssue(output, definition.outputSchema)
        ).toBeUndefined()
        return JSON.stringify(output)
      })
      const first = await invokeLocalTool(
        { call },
        definition,
        input,
        new AbortController().signal
      )
      expect(first.success, name).toBe(true)
      expect(JSON.parse(first.text).status, name).toBe('complete')
      const before = {
        props: props.save(),
        scene: scene.save(),
        depth: factory.getUndoHistoryDepth()
      }
      const second = await invokeLocalTool(
        { call },
        definition,
        input,
        new AbortController().signal
      )
      expect(second.success, name).toBe(true)
      const after = {
        props: props.save(),
        scene: scene.save(),
        depth: factory.getUndoHistoryDepth()
      }
      const replacedBinding = name === 'shareElementPropertyTargets'
      expect(JSON.parse(second.text), name).toMatchObject({
        status: replacedBinding ? 'complete' : 'no-change',
        toolOutcome: { status: 'success', settlement: 'completed' }
      })
      if (replacedBinding) {
        expect(after.props).not.toEqual(before.props)
        expect(after.depth).toBe(before.depth + 1)
      } else expect(after).toEqual(before)
      expect(call).toHaveBeenCalledTimes(2)
    }
    reset()
    const { createAiAgentRuntime, runAiMutation } =
      await import('@asyra/ai-agent-runtime')
    const { createAiTransactionRunner } =
      await import('../../src/ai/transaction')
    const failures: AiBatchReceipt[] = []
    const contract = writers.find(
      (entry) => entry.method === 'updateElementProperties'
    )
    if (!contract) throw new Error('Missing mutation contract')
    const runtime = createAiAgentRuntime({
      provider: {
        requestActionBatch: async (_input, options) => {
          if (!options.executeBatch) throw new Error('Missing batch executor')
          const missing = {
            id: 'missing',
            name: contract.name,
            arguments: { updates: [{ elementId: 'missing', values: {} }] },
            summary: 'Reject missing target'
          }
          failures.push(
            await options.executeBatch({
              batchId: 'missing-owner',
              actions: [missing]
            })
          )
          failures.push(
            await options.executeBatch({
              batchId: 'partial-owner',
              actions: [
                {
                  id: 'prefix',
                  name: contract.name,
                  arguments: {
                    updates: [{ elementId: 'a', values: { opacity: 0.6 } }]
                  },
                  summary: 'Apply prefix once'
                },
                missing
              ]
            })
          )
          return {
            batchId: 'read-only-recovery',
            actions: [
              {
                id: 'read',
                name: 'read_owner_state',
                arguments: {},
                summary: 'Read current state'
              }
            ]
          }
        }
      },
      actionDefinitions: [
        {
          ...toolSemantics(true, 'mutation', ['document']),
          name: contract.name,
          description: contract.description,
          inputSchema: contract.inputSchema,
          execute: async (input, context) =>
            runAiMutation(context, () =>
              api.updateElementProperties(
                (
                  input as {
                    updates: {
                      elementId: string
                      values: Record<string, number>
                    }[]
                  }
                ).updates
              )
            )
        },
        {
          ...toolSemantics(true, 'read', ['document']),
          name: 'read_owner_state',
          description: 'Read current state',
          inputSchema: { type: 'object' },
          execute: async () => api.getElementData('a')
        }
      ],
      contextProvider: { getContext: async () => ({}) },
      permissionPolicy: { evaluate: () => 'allow' },
      confirmationHandler: { confirm: async () => true },
      transactionRunner: createAiTransactionRunner({ apis: factory })
    })
    try {
      expect(
        (
          await runtime.run({
            intent: 'Deterministic failure proof',
            signal: new AbortController().signal
          })
        ).status
      ).toBe('executed')
      expect(failures[0]).toMatchObject({
        actionResults: [],
        failure: { settlement: 'not-started' }
      })
      expect(failures[1]).toMatchObject({
        actionResults: [
          { actionId: 'prefix', result: { acceptedIds: ['a'], changed: true } }
        ],
        failure: { settlement: 'not-started' }
      })
      expect(api.getElementComputedData('a')?.opacity).toBe(0.6)
      expect(factory.getUndoHistoryDepth()).toBe(1)
    } finally {
      await runtime.dispose()
    }
  } finally {
    factory.transact.reset()
  }
})

it('execution proof preserves non-Core mutation outcomes without opaque application', () => {
  const writers = basicApiContracts.filter(
    (contract) =>
      contract.owner !== 'core' && ['write', 'delete'].includes(contract.effect)
  )
  expect(writers.length).toBeGreaterThan(31)
  expect(
    writers
      .filter((contract) => String(contract.result.kind) === 'owner')
      .map((contract) => contract.operation)
  ).toEqual([])
  const contract = writers.find(
    (entry) => entry.operation === 'element.setElementPositions'
  )
  if (!contract) throw new Error('Missing position contract')
  for (const [receipt, status] of [
    [
      { value: null, acceptedIds: ['a'], unavailableIds: [], changed: true },
      'complete'
    ],
    [
      { value: null, acceptedIds: ['a'], unavailableIds: [], changed: false },
      'no-change'
    ],
    [
      { value: null, acceptedIds: [], unavailableIds: [], changed: false },
      'no-change'
    ],
    [
      {
        value: null,
        acceptedIds: [],
        unavailableIds: ['missing'],
        changed: false
      },
      'failed'
    ],
    [
      {
        value: null,
        acceptedIds: ['a'],
        unavailableIds: ['missing'],
        changed: true
      },
      'partial'
    ],
    [
      {
        value: null,
        acceptedIds: ['a'],
        unavailableIds: ['missing'],
        changed: false
      },
      'partial'
    ]
  ] as const) {
    expect(describeBasicApiResult(contract, receipt)).toMatchObject({
      status,
      value: null,
      acceptedIds: receipt.acceptedIds,
      unavailableIds: receipt.unavailableIds,
      changed: receipt.changed
    })
  }
  for (const invalid of [
    undefined,
    false,
    null,
    [],
    {},
    { value: null, acceptedIds: [], unavailableIds: [], changed: true }
  ]) {
    expect(describeBasicApiResult(contract, invalid)).toMatchObject({
      status: 'failed',
      code: 'OWNER_RESULT_INVALID'
    })
  }
})

it('execution proof keeps material provenance independent of viewport transforms', async () => {
  const { default: core } = await import('@asyra/core')
  const { applyPreset, PresetProfiles, PresetDefaults } =
    await import('@asyra/preset')
  const { RenderContainer } = await import('@asyra/render')
  const hadWindow = 'window' in globalThis
  if (!hadWindow) vi.stubGlobal('window', {})
  const { createPreparedMaterialApplication } =
    await import('../../src/ai/prepared-material-action')
  applyPreset(core, {
    profile: PresetProfiles.CUSTOM,
    defaults: [PresetDefaults.BASIC_SHAPES, PresetDefaults.CONTAINERS]
  })
  core.load({
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
  })
  core.createElementsInParent(
    [
      {
        id: 'face',
        type: 'rect',
        x: 9378.905950335902,
        y: 33657.47156164411,
        width: 20,
        height: 30
      }
    ],
    'workspace'
  )
  const view = new RenderContainer()
  const face = new RenderContainer({
    x: 9378.905950335902,
    y: 33657.47156164411
  })
  view.addChild(face)
  const original = core.elementLocalToWorkspace
  core.elementLocalToWorkspace = (_id, point) =>
    view.toLocal(face.toGlobal(point))
  const owner = createPreparedMaterialApplication()
  const signal = new AbortController().signal
  const gradient = {
    gradientType: 'linear' as const,
    gradientHandles: [
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ],
    gradientStops: [
      { position: 0, color: '#102030', opacity: 1 },
      { position: 1, color: '#eeeeee', opacity: 1 }
    ]
  }
  const input = {
    rootId: 'source',
    updates: [{ elementId: 'face', gradient, color: '#102030' }]
  }
  try {
    owner.capture('source', ['face'], signal)
    const before = core.save()
    view.scale.set(0.02, 0.02)
    view.position.set(600, 60)
    expect(core.save()).toEqual(before)
    await expect(
      owner.action.execute(input, { signal })
    ).resolves.toMatchObject({
      status: 'complete',
      appliedElementIds: ['face']
    })
    expect(core.getElementComputedData('face', ['fills'])?.fills).toMatchObject(
      [{ gradient }]
    )
    core.updateElementProperties([{ elementId: 'face', values: { x: 9379 } }])
    const moved = core.save()
    await expect(owner.action.execute(input, { signal })).rejects.toThrow(
      /geometry/
    )
    expect(core.save()).toEqual(moved)
  } finally {
    owner.dispose()
    core.elementLocalToWorkspace = original
    if (!hadWindow) vi.unstubAllGlobals()
  }
})

it('execution proof preserves exact submitted inspection pixels and delivery identity', async ({
  onTestFinished
}) => {
  for (const mode of [
    'saved',
    'storage-failed',
    'transport-failed',
    'cancelled'
  ]) {
    const controller = new AbortController()
    let captures = 0
    const { readFile, readdir, writeFile } = await import('node:fs/promises')
    const { createHash } = await import('node:crypto')
    const runtime = await vi.importActual<
      typeof import('@asyra/ai-agent-runtime/node')
    >('@asyra/ai-agent-runtime/node')
    const mocked = await import('@asyra/ai-agent-runtime/node')
    const parent = resolve('tmp/flow-image-tests')
    await mkdir(parent, { recursive: true })
    const directory = await mkdtemp(resolve(parent, 'case-'))
    onTestFinished(() => rm(directory, { recursive: true, force: true }))
    const recordDirectory =
      mode === 'storage-failed' ? resolve(directory, 'blocked') : directory
    if (mode === 'storage-failed')
      await writeFile(recordDirectory, 'not a directory')
    const sink = runtime.createExecutionRecordSink(
      recordDirectory,
      () => undefined
    )
    vi.mocked(mocked.createExecutionRecordSink).mockReturnValueOnce(sink)
    const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    onTestFinished(() => log.mockRestore())
    const images = await Promise.all(
      ['red', 'blue'].map((background) =>
        sharp({ create: { width: 4, height: 3, channels: 4, background } })
          .png()
          .toBuffer()
      )
    )
    const requests = [
      {
        tool: 'define_design_criteria',
        arguments: {
          phase: 'plan',
          method: 'Inspect fixed pixels',
          references: [],
          criteria: {
            ...reviewCriteria(['overall']),
            surface: {
              ...reviewCriteria(['surface']).surface,
              requiredUnits: ['red', 'blue']
            }
          },
          detailRequired: false
        }
      },
      {
        tool: 'review_drawing',
        arguments: {
          phase: 'visual',
          final: false,
          inspections: ['red', 'blue'].map((elementId) => ({
            elementId,
            view: 'overview',
            checks: [{ criterionId: 'surface', unitId: elementId }]
          }))
        }
      },
      {
        tool: 'inspect_drawing',
        arguments: { arguments: { elementId: 'red' } }
      },
      {
        tool: 'inspect_drawing',
        arguments: { arguments: { elementId: 'invalid' } }
      }
    ]
    const replies: {
      id: number
      result: {
        contentItems: (
          | { type: 'inputText'; text: string }
          | { type: 'inputImage'; imageUrl: string }
        )[]
      }
    }[] = []
    const child = Object.assign(new EventEmitter(), {
      stdout: new PassThrough(),
      stderr: new PassThrough(),
      stdin: new Writable(),
      kill: () => {
        queueMicrotask(() => child.emit('close', null, 'SIGTERM'))
        return true
      }
    })
    const send = (value: unknown) =>
      child.stdout.write(JSON.stringify(value) + '\n')
    const next = (index: number) => {
      if (index < requests.length)
        send({
          id: 100 + index,
          method: 'item/tool/call',
          params: {
            threadId: 'images-thread',
            turnId: 'images-turn',
            callId: 'image-call-' + index,
            namespace: 'design_operations',
            ...requests[index]
          }
        })
      else {
        send({
          method: 'item/completed',
          params: {
            threadId: 'images-thread',
            turnId: 'images-turn',
            item: {
              type: 'agentMessage',
              phase: 'final_answer',
              text: JSON.stringify({
                batchId: 'images-complete',
                actions: [
                  {
                    id: 'report',
                    name: 'report_outcome',
                    summary: 'Image recording proof',
                    arguments: {
                      outcome: 'unsupported',
                      message: 'Recorded deterministic images.'
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
            threadId: 'images-thread',
            turn: { id: 'images-turn', status: 'completed' }
          }
        })
      }
    }
    child.stdin = new Writable({
      write(chunk, _encoding, done) {
        const packet = JSON.parse(String(chunk))
        if (
          mode === 'transport-failed' &&
          packet.result?.contentItems.some(
            (item: { type: string }) => item.type === 'inputImage'
          )
        )
          throw new Error('Injected transport failure')
        queueMicrotask(() => {
          if (packet.method) {
            const responses: Record<string, unknown> = {
              initialize: {},
              'config/read': { config: {} },
              'account/read': { account: { type: 'chatgpt' } },
              'thread/start': {
                thread: { id: 'images-thread' },
                model: 'gpt-6-astra',
                reasoningEffort: 'medium',
                instructionSources: [],
                runtimeWorkspaceRoots: []
              },
              'turn/start': { turn: { id: 'images-turn' } }
            }
            if (packet.id !== undefined)
              send({ id: packet.id, result: responses[packet.method] })
            if (packet.method === 'turn/start') next(0)
          } else if (packet.result) {
            replies.push(packet)
            next(packet.id - 99)
          }
        })
        done()
      }
    })
    spawn.mockReturnValueOnce(child)
    const running = requestLocalAiActionBatch(
      {
        intent: 'Image evidence proof',
        context: {},
        attempt: 1,
        actions: [
          {
            name: 'inspect_drawing',
            description: 'Inspect',
            inputSchema: { type: 'object' }
          },
          {
            name: 'validate_inspection_evidence',
            description: 'Validate',
            inputSchema: { type: 'object' }
          }
        ]
      },
      {
        executable: 'fixture-only',
        model: 'gpt-6-astra',
        recordDirectory,
        signal: controller.signal,
        toolLibraryDirectory: resolve(directory, 'library'),
        executeBatch: async (request) => {
          captures += request.actions.filter(
            (action) => action.name === 'inspect_drawing'
          ).length
          if (
            mode === 'cancelled' &&
            request.actions.some((action) => action.name === 'inspect_drawing')
          )
            controller.abort()
          return {
            context: {},
            actionResults: request.actions.map(
              (action): AiBatchReceipt['actionResults'][number] => {
                const args = action.arguments as { elementId: string }
                return {
                  actionId: action.id,
                  actionName: action.name,
                  result:
                    action.name === 'inspect_drawing'
                      ? {
                          available: true,
                          elementId: args.elementId,
                          image: {
                            width: 4,
                            height: 3,
                            dataUrl:
                              args.elementId === 'invalid'
                                ? 'data:image/png;base64,invalid'
                                : `data:image/png;base64,${images[args.elementId === 'blue' ? 1 : 0].toString('base64')}`
                          },
                          imageScope: 'overview',
                          partial: false,
                          evidence: {
                            sessionId: 'pixels',
                            revision: 1,
                            receiptId: action.id
                          }
                        }
                      : {
                          current: true,
                          validatedAt: { sessionId: 'pixels', revision: 1 }
                        }
                }
              }
            )
          }
        }
      }
    )
    if (mode === 'transport-failed' || mode === 'cancelled') {
      await expect(running).rejects.toMatchObject({
        code:
          mode === 'cancelled'
            ? 'AI_MODEL_BACKEND_ABORTED'
            : 'AI_MODEL_BACKEND_TRANSPORT_FAILED'
      })
      const file = (await readdir(directory)).find((name) =>
        name.endsWith('.jsonl')
      )
      if (!file) throw new Error('Missing execution record')
      const parsed = runtime.parseExecutionRecord(
        await readFile(resolve(directory, file), 'utf8')
      )
      expect(
        parsed.records.filter(
          (row) =>
            row.stage === 'asset_retained' &&
            (row.evidence as { callId?: string } | undefined)?.callId
        )
      ).toHaveLength(0)
      expect(captures).toBe(mode === 'cancelled' ? 1 : 2)
      continue
    }
    expect(await running).toMatchObject({ batchId: 'images-complete' })
    expect(captures).toBe(4)
    if (mode === 'storage-failed') {
      expect(await sink.flush()).toMatchObject({ status: 'failed' })
      expect(
        replies.flatMap((reply) =>
          reply.result.contentItems.filter((item) => item.type === 'inputImage')
        )
      ).toHaveLength(3)
      continue
    }
    const file = (await readdir(directory)).find((name) =>
      name.endsWith('.jsonl')
    )
    if (!file) throw new Error('Missing execution record')
    const parsed = runtime.parseExecutionRecord(
      await readFile(resolve(directory, file), 'utf8')
    )
    expect(parsed.complete).toBe(true)
    const deliveries = parsed.records.filter(
      (row) =>
        row.stage === 'asset_retained' &&
        (row.evidence as { callId?: string } | undefined)?.callId
    )
    const sent = replies.flatMap((reply) =>
      reply.result.contentItems.flatMap((item, contentIndex) =>
        item.type === 'inputImage'
          ? [
              {
                callId: 'image-call-' + (reply.id - 100),
                contentIndex,
                url: item.imageUrl
              }
            ]
          : []
      )
    )
    expect(
      sent,
      JSON.stringify(
        replies.map((r) =>
          r.result.contentItems
            .filter((i) => i.type === 'inputText')
            .map((i) => JSON.parse(i.text))
        )
      )
    ).toHaveLength(3)
    expect(deliveries).toHaveLength(sent.length)
    for (let index = 0; index < sent.length; index++) {
      const evidence = deliveries[index].evidence as {
        callId: string
        contentIndex: number
        status: string
        mediaType: string
        asset: { path: string; sha256: string; bytes: number; reused: boolean }
      }
      expect(evidence).toMatchObject({
        callId: sent[index].callId,
        contentIndex: sent[index].contentIndex,
        status: 'submitted',
        mediaType: 'image/png'
      })
      const bytes = await readFile(resolve(directory, evidence.asset.path))
      expect(
        bytes.equals(Buffer.from(sent[index].url.split(',')[1], 'base64'))
      ).toBe(true)
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(
        evidence.asset.sha256
      )
      expect(bytes.length).toBe(evidence.asset.bytes)
      expect(await sharp(bytes).raw().toBuffer()).toEqual(
        await sharp(images[index === 1 ? 1 : 0])
          .raw()
          .toBuffer()
      )
    }
    expect(deliveries[2].evidence).toMatchObject({ asset: { reused: true } })
    expect(
      replies
        .at(-1)
        ?.result.contentItems.every((item) => item.type === 'inputText')
    ).toBe(true)
    expect(JSON.stringify(parsed.records)).not.toContain('data:image')
    expect(JSON.stringify(log.mock.calls)).not.toContain('data:image')
  }
})

/** Isolated source-proof consumer validates complete bounded delivery. */
const readCompleteInformation = async (
  call: (input: unknown) => Promise<string>,
  input: unknown
): Promise<string> => {
  let raw = await call(input)
  let text = ''
  let offset = 0
  let revision: string | undefined
  for (let count = 0; count < 256; count++) {
    const page = JSON.parse(raw).contentDelivery
    if (!page) {
      expect(offset).toBe(0)
      return raw
    }
    expect(Buffer.byteLength(raw)).toBeLessThanOrEqual(24000)
    expect(page.startByte).toBe(offset)
    revision ??= page.revision
    expect(page.revision).toBe(revision)
    text += page.text
    offset += Buffer.byteLength(page.text)
    expect(page.endByte).toBe(offset)
    if (page.lastPage) {
      expect(offset).toBe(page.totalBytes)
      expect(page.next).toBeNull()
      JSON.parse(text)
      return text
    }
    raw = await call(page.next.arguments)
  }
  throw new Error('Information continuation did not terminate')
}

it('execution proof executes the published bounded information example without replaying operations', async () => {
  const { runInNewContext } = await import('node:vm')
  const { toolSemantics } = await import('../../src/ai/tool-contract')
  const dispatch = vi.fn()
  const schema = {
    type: 'object',
    required: ['choice'],
    additionalProperties: false,
    properties: {
      choice: {
        enum: Array.from(
          { length: 600 },
          (_, index) => `${index}: ${'Required permitted choice. '.repeat(4)}`
        )
      }
    }
  }
  const owner = createOperationOwner(
    basicApiContracts.map((contract) => ({
      ...contract,
      inputSchema: contract.inputSchema as AiActionDescription['inputSchema'],
      ...toolSemantics({ type: 'object' }, 'read', [])
    })),
    { modelActions: (a) => a, resolveBatch: (b) => b },
    dispatch,
    {
      getNativeTools: () => [
        {
          name: 'choose',
          namespace: 'proof',
          description: 'Select a permitted choice.',
          inputSchema: schema,
          ...toolSemantics({ type: 'object' }, 'read', [])
        }
      ]
    }
  )
  const definition = owner.definitions.find(
    (d) => d.name === 'describe_design_apis'
  )
  if (!definition) throw new Error('Missing discovery definition')
  const example =
    /Information forwarding example[^\n]*\n```javascript\n([\s\S]*?)\n```/.exec(
      definition.description
    )?.[1]
  expect(example).toBeTruthy()
  if (!example) throw new Error('Missing advertised example')
  const values = new Map<string, unknown>()
  const text = vi.fn()
  const forward = (result: string) =>
    runInNewContext(example, {
      result,
      deliveryKey: 'proof',
      text,
      load: (key: string) => values.get(key),
      store: (key: string, value: unknown) => values.set(key, value)
    })
  let args: Record<string, unknown> = { names: ['proof.choose'] }
  const pages: string[] = []
  for (let i = 0; i < 20; i++) {
    const reply = await invokeLocalTool(
      owner,
      definition,
      args,
      new AbortController().signal
    )
    expect(reply.success).toBe(true)
    pages.push(reply.text)
    forward(reply.text)
    const page = JSON.parse(reply.text).contentDelivery
    if (!page || page.lastPage) break
    args = page.next.arguments
  }
  expect(pages.length).toBeGreaterThan(1)
  expect(values.get('proof')).toMatchObject({
    complete: true,
    value: { tools: [{ inputSchema: schema }] }
  })
  const before = values.get('proof')
  pages.forEach(forward)
  expect(values.get('proof')).toEqual(before)
  expect(text.mock.calls.map((call) => call[0])).toEqual([...pages, ...pages])
  expect(dispatch).not.toHaveBeenCalled()
})

it('execution proof selects nested Knowledge without reading sibling bodies', async () => {
  const { createLocalKnowledgeTools } = await import('../local-knowledge')
  const tools = createLocalKnowledgeTools('nested-proof')
  const abortSignal = new AbortController().signal
  try {
    const contexts = ['architectural-illustration']
    const found = JSON.parse(
      await tools.call('discover_knowledge', { contexts }, abortSignal)
    )
    const root = found.entries.find(
      (item: { id: string }) => item.id === 'design.architectural-illustration'
    )
    const branch = found.entries.find(
      (item: { id: string }) =>
        item.id ===
        root.children.find((id: string) => id.endsWith('.materials'))
    )
    const id = branch.children.find((item: string) =>
      item.endsWith('.correction')
    )
    const read = JSON.parse(
      await readCompleteInformation(
        (input) => tools.call('read_knowledge', input, abortSignal),
        { ids: [id], contexts }
      )
    )
    expect(
      read.documents.map((item: { target: string }) => item.target)
    ).toEqual([
      'design.architectural-illustration',
      'design.architectural-illustration.contracts',
      'illustration.architecture',
      'illustration.architecture.materials',
      id
    ])
    expect(JSON.stringify(read)).toContain('edits create local overrides')
    expect(JSON.stringify(read)).toContain('Never retry a settled drawing')
    expect(JSON.stringify(read)).not.toContain(
      '## Represent a repeated multi-face component once'
    )
  } finally {
    tools.dispose()
  }
})

async function readKnowledgeTopic(id: string): Promise<string> {
  const { createLocalKnowledgeTools } = await import('../local-knowledge')
  const owner = createLocalKnowledgeTools('published-topic')
  try {
    const result = JSON.parse(
      await readCompleteInformation(
        (input) =>
          owner.call('read_knowledge', input, new AbortController().signal),
        { ids: [id], contexts: ['architectural-illustration'] }
      )
    )
    const document = result.documents.find(
      (item: { target: string }) => item.target === id
    )
    if (!document) throw new Error('Missing selected Knowledge topic')
    return document.text
  } finally {
    owner.dispose()
  }
}

it('execution proof distinguishes native output observation from tool execution and unavailable argument progress', async () => {
  const { nativeOutputVisibility } = await import('../local-ai-provider')
  const records: ExecutionRecord[] = []
  const profile = createAiExecutionProfiler(
    { intent: 'private', context: {}, actions: [], attempt: 1 },
    'test-model',
    {
      sink: {
        write: (record) => records.push(record),
        flush: async () => ({ status: 'saved', path: null })
      }
    }
  )
  profile.trace('provider_notification', nativeOutputVisibility)
  profile.recordTransport('received', 64000, 'diagnostic')
  const visibility = records.find(
    (r) =>
      r.stage === 'provider_notification' &&
      (r.evidence as { method?: string })?.method === 'app/output-visibility'
  )
  expect(visibility?.evidence).toEqual({
    method: nativeOutputVisibility.method,
    source: nativeOutputVisibility.source,
    coverage: {
      count: 5,
      truncated: false,
      items: nativeOutputVisibility.coverage
    }
  })
  expect(visibility?.evidence).toMatchObject({
    coverage: {
      items: expect.arrayContaining([
        { kind: 'pre-dispatch-output-item', status: 'unavailable' },
        { kind: 'tool-argument-deltas', status: 'unavailable', bytes: null },
        { kind: 'generation-versus-stall', status: 'unavailable' }
      ])
    }
  })
  expect(
    records.some(
      (r) => r.stage === 'tool_started' || r.stage === 'provider_item_started'
    )
  ).toBe(false)
  expect(records.find((r) => r.stage === 'transport_chunk')?.evidence).toEqual({
    direction: 'received',
    bytes: 64000,
    stream: 'diagnostic'
  })
})

it('execution proof delivers selected Knowledge decisions completely without optional bodies', async () => {
  const { createLocalKnowledgeTools } = await import('../local-knowledge')
  const owner = createLocalKnowledgeTools('complete-topic-proof')
  try {
    const contexts = ['architectural-illustration']
    const catalog = JSON.parse(
      await owner.call(
        'discover_knowledge',
        { contexts },
        new AbortController().signal
      )
    )
    const method = catalog.entries.find(
      (item: { id: string }) =>
        item.id === 'design.architectural-illustration.materials.method'
    )
    const detail = catalog.entries.find(
      (item: { id: string }) => item.id === method.children[0]
    )
    expect(method.description).toMatch(/ordinary.*representation.*lighting/i)
    expect(method.description).toMatch(/without.*parameter walkthrough/i)
    expect(detail.description).toMatch(
      /only when.*local-coordinate conversion.*worked example/i
    )
    expect(detail.description).toMatch(
      /known supported representation.*does not require/i
    )
    for (const suffix of ['method', 'review']) {
      const id = `design.architectural-illustration.materials.${suffix}`
      expect(
        catalog.entries.some((item: { id: string }) => item.id === id)
      ).toBe(true)
      const result = JSON.parse(
        await owner.call(
          'read_knowledge',
          { ids: [id], contexts },
          new AbortController().signal
        )
      )
      expect(result.contentDelivery).toBeUndefined()
      expect(
        result.documents.some((doc: { target: string }) => doc.target === id)
      ).toBe(true)
      expect(
        result.documents.some((doc: { target: string }) =>
          /\.(operations|parameters)$/.test(doc.target)
        )
      ).toBe(false)
      expect(JSON.stringify(result)).toContain('Never retry a settled drawing')
    }
  } finally {
    owner.dispose()
  }
})

it('execution proof delivers selected operation contracts without exhaustive discovery', async () => {
  const { workflowQueryGuidance } = await import('../design-workflow-discovery')
  const { operationInputIssue } = await import('../operation-input-schema')
  const designs = createLocalDesignTools([
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply',
      inputSchema: {}
    }
  ])
  const execute = vi.fn()
  const operations = createLocalOperationTools(
    [
      {
        name: AiActionNames.APPLY_PREPARED_DESIGN,
        description: 'Apply',
        inputSchema: {}
      }
    ],
    designs,
    execute,
    {
      getNativeTools: () => [
        ...workflow.definitions.map((definition) => ({
          ...definition,
          namespace: 'design'
        })),
        {
          ...workflow.definitions[0],
          name: 'related_capability',
          namespace: 'design',
          description: 'Use prepare_and_apply_design for a ready part.',
          inputSchema: { type: 'object' }
        }
      ]
    }
  )
  const workflow = createLocalDesignWorkflow(designs, operations)
  const counts: number[] = []
  const read = async (input: unknown) =>
    JSON.parse(
      await readCompleteInformation(async (args) => {
        const text = await operations.call(
          'describe_design_apis',
          args,
          new AbortController().signal
        )
        counts.push(Buffer.byteLength(text))
        return text
      }, input)
    )
  const names = ['prepare_and_apply_design']
  const guidance = workflowQueryGuidance(
    names[0],
    workflow.definitions[0].inputSchema
  )
  if (!guidance) throw new Error('Missing main-tool scope guidance')
  const ownerSchema = workflow.definitions[0].inputSchema as {
    'x-design-input-scope': { selection: string }
  }
  expect(guidance.inputScopes).toHaveProperty(
    'selection',
    ownerSchema['x-design-input-scope'].selection
  )

  expect(guidance.inputScopes.selection).toContain('outer repetition')
  expect(guidance.example.arguments.inputScope).toEqual({
    operation: 'draft',
    nodeTypes: ['pattern']
  })
  expect(guidance.operationUsage.draft).toContain('10000 expanded objects')
  expect(guidance.operationUsage.parts).toContain('each part artifact fits')
  const first = await read(guidance.example.arguments)
  expect(first.tools[0].usageGuide).toBeDefined()
  expect(counts).toHaveLength(1)
  expect(first.tools[0].usageGuide.instructions).toContain(
    'root and nested containers'
  )
  const excess = JSON.parse(
    await workflow.call(
      'prepare_and_apply_design',
      {
        draft: {
          type: 'group',
          name: 'Expansion boundary',
          children: [
            {
              type: 'vector-pattern',
              name: 'Repeated contour',
              key: 'repeat',
              template: {
                rings: [
                  [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 },
                    { x: 1, y: 1 }
                  ]
                ]
              },
              placements: Array.from({ length: 10000 }, () => ({ x: 0, y: 0 }))
            }
          ]
        }
      },
      new AbortController().signal
    )
  )
  expect(excess.budget.observed.expandedNodes).toBe(10001)
  expect(excess.completedSteps).toEqual([])
  expect(excess.message).toContain('ordered parts')
  expect(execute).not.toHaveBeenCalled()

  const definition = operations.definitions.find(
    (item) => item.name === 'describe_design_apis'
  )
  if (!definition) throw new Error('Missing discovery definition')
  const rejected = await invokeLocalTool(
    operations,
    definition,
    {
      ...guidance.example.arguments,
      inputScope: { operation: 'create', nodeTypes: ['vector'] }
    },
    new AbortController().signal
  )
  expect(rejected.success).toBe(false)
  const rejection = JSON.parse(rejected.text)
  expect(rejection.toolOutcome).toMatchObject({
    status: 'failed',
    settlement: 'not-started'
  })
  const correction = JSON.parse(rejection.message.split('Scope guidance: ')[1])
  expect(correction.inputScopes).toEqual({
    operations: guidance.inputScopes.operations,
    nodeTypes: guidance.inputScopes.nodeTypes,
    optionalInputs: guidance.inputScopes.optionalInputs
  })
  expect(
    (await read(correction.example.arguments)).tools[0].usageGuide
  ).toEqual(first.tools[0].usageGuide)
  counts.splice(0)
  const menu = await read({ names, view: 'usage' })
  expect(counts).toHaveLength(1)
  expect(menu.tools[0].inputScopes.selection).toContain('next submitted part')
  expect(menu.tools[0].inputScopes.selection).toContain('surface-grid')
  expect(menu.tools[0].inputScopes.selection).toContain('root group/frame')
  expect(menu.tools[0].inputScopes.selection).toContain(
    'nodeTypes selects children'
  )
  expect(menu.tools[0].inputScopes.selection).toContain(
    'does not require sending'
  )
  expect(menu.tools[0].outputFields).toBeUndefined()
  counts.splice(0)
  const queried = await read({ query: names[0], view: 'usage' })
  expect(queried.tools.map((tool: { name: string }) => tool.name)).toEqual(
    names
  )
  expect(counts).toHaveLength(1)
  expect(counts[0]).toBeLessThan(5000)
  counts.splice(0)
  const full = await read({ names })
  const fullCounts = counts.splice(0)
  const inputScope = { operation: 'draft', nodeTypes: ['vector'] }
  const scoped = await read({ names, inputScope })
  expect(counts.length).toBeLessThan(fullCounts.length)
  expect(counts.reduce((sum, bytes) => sum + bytes, 0)).toBeLessThan(
    fullCounts.reduce((sum, bytes) => sum + bytes, 0)
  )
  expect(scoped.tools[0].outputSchema).toEqual(full.tools[0].outputSchema)
  expect(scoped.tools[0].partialOutputSchema).toEqual(
    full.tools[0].partialOutputSchema
  )
  expect(scoped.tools[0].recoveryOutputSchema).toEqual(
    full.tools[0].recoveryOutputSchema
  )
  expect(scoped.tools[0].definition.recover.arguments.inputScope).toEqual(
    inputScope
  )
  counts.splice(0)
  const guide = await read({ names, inputScope, view: 'usage' })
  expect(counts).toHaveLength(1)
  expect(counts[0]).toBeLessThan(23000)
  expect(guide.tools[0].definition.coverage).toBe('scoped-usage')
  expect(guide.tools[0].usageGuide.instructions).toContain('root group/frame')
  expect(guide.tools[0].usageGuide.selection).toContain('without rereading')
  expect(guide.tools[0].outputSchema).toBeUndefined()
  expect(guide.tools[0].usageGuide.recovery).toContain(
    'Never replay completed writes'
  )
  expect(
    operationInputIssue(
      guide.tools[0].invocationExample.invocation.arguments,
      scoped.tools[0].inputSchema
    )
  ).toBeUndefined()
  expect(execute).not.toHaveBeenCalled()
  counts.splice(0)
  const mixedScope = {
    operation: 'draft',
    nodeTypes: ['projected-face', 'surface-grid']
  }
  const combined = await read({ names, inputScope: mixedScope, view: 'usage' })
  expect(counts).toHaveLength(1)
  expect(counts[0]).toBeLessThanOrEqual(20148)
  const invocation = combined.tools[0].invocationExample.invocation
  const combinedFull = await read({ names, inputScope: mixedScope })
  expect(
    operationInputIssue(invocation.arguments, combinedFull.tools[0].inputSchema)
  ).toBeUndefined()
  const source = invocation.arguments.draft
  expect(source.linearFields.glass).toBeDefined()
  expect(source.fillTemplates.edge).toBeDefined()
  expect(source.children.map((child: { type: string }) => child.type)).toEqual([
    'pattern',
    'projected-face',
    'pattern'
  ])
  const prepared = JSON.parse(
    await designs.call(
      'prepare_design',
      invocation.arguments,
      new AbortController().signal
    )
  )
  expect(prepared.available).toBe(true)
  expect(prepared.elementCount).toBe(16)
  expect(execute).not.toHaveBeenCalled()
})

it('execution proof distinguishes inspection lookup coverage from completed reads', async () => {
  const dispatch = vi.fn()
  const owner = createOperationOwner(
    [
      {
        name: AiActionNames.INSPECT_DRAWING,
        description: 'Inspect',
        inputSchema: {}
      }
    ],
    { modelActions: (a) => a, resolveBatch: (b) => b },
    dispatch,
    {
      getNativeTools: () =>
        owner.definitions.map((d) => ({ ...d, namespace: 'design' }))
    }
  )
  const definition = owner.definitions.find(
    (d) => d.name === 'describe_design_apis'
  )
  if (!definition) throw new Error('Missing discovery definition')
  const read = (schemaPaths: string[]) =>
    invokeLocalTool(
      owner,
      definition,
      { names: ['review_drawing', 'define_design_criteria'], schemaPaths },
      new AbortController().signal
    )
  const failed = await read(['/properties/inspections', '/properties/criteria'])
  expect(failed.success).toBe(false)
  expect(JSON.parse(failed.text).toolOutcome).toMatchObject({
    status: 'failed',
    settlement: 'completed'
  })
  const partial = await read(['/properties/inspections'])
  expect(partial.success).toBe(false)
  expect(JSON.parse(partial.text).toolOutcome).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  const complete = await read(['/properties/phase'])
  expect(complete.success).toBe(true)
  expect(dispatch).not.toHaveBeenCalled()
})

it('execution proof separates bounded work from same-thread self-report without replay', async ({
  onTestFinished
}) => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined)
  onTestFinished(() => log.mockRestore())
  const parent = resolve('tmp/flow-evaluation-tests')
  await mkdir(parent, { recursive: true })
  const directory = await mkdtemp(resolve(parent, 'case-'))
  onTestFinished(() => rm(directory, { recursive: true, force: true }))
  const packets: {
    id?: number
    method?: string
    params?: Record<string, unknown>
  }[] = []
  let turns = 0
  const child = Object.assign(new EventEmitter(), {
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    stdin: new Writable(),
    kill: () => {
      queueMicrotask(() => child.emit('close', null, 'SIGKILL'))
      return true
    }
  })
  const send = (value: unknown) =>
    child.stdout.write(JSON.stringify(value) + '\n')
  child.stdin = new Writable({
    write(chunk, _encoding, done) {
      const packet = JSON.parse(String(chunk)) as (typeof packets)[number]
      packets.push(packet)
      queueMicrotask(() => {
        if (packet.id === undefined) return
        let result: unknown = {}
        if (packet.method === 'config/read') result = { config: {} }
        if (packet.method === 'account/read')
          result = { account: { type: 'chatgpt' } }
        if (packet.method === 'thread/start')
          result = {
            thread: { id: 'evaluation-thread' },
            model: 'gpt-6-astra',
            reasoningEffort: 'medium',
            instructionSources: [],
            runtimeWorkspaceRoots: []
          }
        if (packet.method === 'turn/start')
          result = { turn: { id: `turn-${++turns}` } }
        send({ id: packet.id, result })
        if (packet.method === 'turn/interrupt')
          send({
            method: 'turn/completed',
            params: {
              threadId: 'evaluation-thread',
              turn: { id: 'turn-1', status: 'interrupted' }
            }
          })
        if (packet.method === 'turn/start' && turns === 2) {
          send({
            method: 'item/completed',
            params: {
              threadId: 'evaluation-thread',
              turnId: 'turn-2',
              item: {
                type: 'agentMessage',
                phase: 'final_answer',
                text: JSON.stringify({
                  batchId: 'report',
                  actions: [
                    {
                      id: 'report',
                      name: 'report_outcome',
                      arguments: {
                        outcome: 'unsupported',
                        message: 'First frame unavailable; cause unconfirmed.'
                      },
                      summary: 'Report'
                    }
                  ]
                })
              }
            }
          })
          send({
            method: 'turn/completed',
            params: {
              threadId: 'evaluation-thread',
              turnId: 'turn-2',
              turn: { id: 'turn-2', status: 'completed' }
            }
          })
        }
      })
      done()
    }
  })
  spawn.mockReturnValueOnce(child)
  const executeBatch = vi.fn()
  const result = await requestLocalAiActionBatch(
    {
      intent: 'Draw a generic composition',
      actions: [],
      context: {},
      attempt: 1,
      metadata: {
        evaluationWindow: {
          workDeadlineAt: Date.now() + 100,
          reportTimeoutMs: 1000
        }
      }
    },
    {
      executable: 'scripted-protocol',
      model: 'gpt-6-astra',
      toolLibraryDirectory: directory,
      executeBatch
    }
  )
  expect(result).toMatchObject({
    explanation: 'Evaluation self-report - not artwork acceptance',
    actions: [{ name: 'report_outcome', arguments: { outcome: 'unsupported' } }]
  })
  expect(packets.filter((p) => p.method === 'thread/start')).toHaveLength(1)
  expect(
    packets
      .filter((p) => p.method === 'turn/start')
      .map((p) => p.params?.threadId)
  ).toEqual(['evaluation-thread', 'evaluation-thread'])
  expect(packets.some((p) => p.method === 'turn/interrupt')).toBe(true)
  expect(executeBatch).not.toHaveBeenCalled()
})

const proveBudgetRecovery = async (limit: number) => {
  const hadWindow = 'window' in globalThis
  if (!hadWindow) vi.stubGlobal('window', {})
  try {
    const { createPreparedDesignAction } =
      await import('../../src/ai/design-actions')
    const entries = new Map<string, PreparedElementDescriptor>()
    const parents = new Map<string, string>()
    const apply = createPreparedDesignAction(
      {
        getWorkspaceId: () => 'workspace',
        getElementType: (id) => entries.get(id)?.type,
        getElementMetadata: (id) => {
          const entry = entries.get(id)
          return entry
            ? { type: entry.type, parentId: parents.get(id) }
            : undefined
        },
        getPlacement: (id) => entries.get(id),
        isContainerType: (type) => type === 'group',
        isLocked: () => false,
        create: (values, parent) => {
          for (const entry of values) {
            entries.set(entry.id, entry)
            parents.set(entry.id, parent)
          }
          return values.map((entry) => entry.id)
        },
        select: () => undefined
      },
      async () => undefined
    )
    const actions: AiActionDescription[] = JSON.parse(JSON.stringify([apply]))
    const session = createDesignPreparationSession(
      undefined,
      undefined,
      undefined,
      limit
    )
    const tools = createLocalDesignTools(actions, session)
    const execute = vi.fn(async (batch: AiActionBatch) => ({
      context: {},
      actionResults: await Promise.all(
        batch.actions.map(async (action) => ({
          actionId: action.id,
          actionName: action.name,
          result: JSON.parse(
            JSON.stringify(
              await apply.execute(
                action.arguments as never,
                { signal: new AbortController().signal } as never
              )
            )
          )
        }))
      )
    }))
    const operations = createOperationOwner(actions, tools, execute)
    const trace = vi.fn()
    const main = createLocalDesignWorkflow(tools, operations, { trace })
    const definition = main.definitions[0]
    if (!definition) throw new Error('Missing workflow')
    const signal = new AbortController().signal
    const result = JSON.parse(
      (
        await invokeLocalTool(
          main,
          definition,
          {
            draft: {
              type: 'group',
              name: 'Repeated panels',
              key: 'root',
              projection: {
                azimuth: 30,
                elevation: 30,
                scale: 1,
                originX: 0,
                originY: 0
              },
              children: [
                {
                  type: 'pattern',
                  key: 'panels',
                  name: 'Panels',
                  origin: { x: 0, y: 0, z: 0 },
                  axes: [{ count: limit, step: { x: 0, y: 0, z: 1 } }],
                  faces: [
                    {
                      key: 'face',
                      name: 'Face',
                      fill: '#123456',
                      vertices: [
                        { x: 0, y: 0, z: 0 },
                        { x: 10, y: 0, z: 0 },
                        { x: 10, y: 0, z: 10 }
                      ]
                    }
                  ]
                }
              ]
            },
            inspection: 'defer',
            response: 'compact'
          },
          signal
        )
      ).text
    )
    const plan = trace.mock.calls.find(
      ([stage, value]) =>
        stage === 'action_completed' && value.result?.retainedDraft?.partitions
    )?.[1].result
    expect(plan.budget.observed.expandedNodes).toBe(limit + 1)
    expect(plan.budget.allowed.expandedNodes).toBe(limit)
    expect(plan.toolOutcome.status).toBe('success')
    expect(
      trace.mock.calls.filter(([stage]) => stage === 'action_failed')
    ).toEqual([])
    expect(JSON.stringify(main.definitions)).toContain(
      `${limit} expanded objects`
    )
    expect(result.toolOutcome.settlement).toBe('completed')
    expect(result.recoveryInvocation).toBeUndefined()
    expect(
      result.parts.map(
        (part: { toolOutcome: { status: string } }) => part.toolOutcome.status
      )
    ).toEqual(['success', 'success'])
    expect(entries.size).toBe(limit + 1)
    expect(
      [...parents.values()].filter((parent) => parent === 'workspace')
    ).toHaveLength(1)
    const size = entries.size
    const duplicate = await invokeLocalTool(
      main,
      definition,
      { repair: { draftId: plan.draftId, partition: 0 }, inspection: 'defer' },
      signal
    )
    expect(duplicate.success).toBe(false)
    expect(entries.size).toBe(size)
  } finally {
    if (!hadWindow) vi.unstubAllGlobals()
  }
}

it('execution proof continues safe capacity through retained partitions in one invocation', () =>
  proveBudgetRecovery(10000))
it('execution proof isolates the evaluation budget through delivery and retained recovery', () =>
  proveBudgetRecovery(2000))

it('execution proof captures only the admitted settled report without rereading transport', async () => {
  const { projectEvaluationReport, evaluationReportExplanation } =
    await import('../../src/ai/evaluation-window')
  const result = {
    status: 'executed',
    recordingId: 'source-request',
    batchId: 'report',
    transaction: { status: 'committed' },
    preview: {
      batchId: 'report',
      explanation: evaluationReportExplanation,
      actions: [{ id: 'final', name: 'report_outcome' }]
    },
    actionResults: [
      {
        actionId: 'written',
        actionName: 'apply_prepared_design',
        result: { status: 'complete' }
      },
      {
        actionId: 'final',
        actionName: 'report_outcome',
        result: {
          action: 'report_outcome',
          status: 'no-change',
          outcome: 'unsupported',
          message: 'Completed work retained; no causal conclusion.'
        }
      }
    ]
  }
  const turn = { turnId: 'conversation:turn:1', outcome: 'partial', result }
  const before = structuredClone(result)
  expect(projectEvaluationReport(turn)).toEqual({
    attribution: 'model-self-report',
    sourceRequestId: 'source-request',
    turnId: turn.turnId,
    text: result.actionResults[1].result.message
  })
  expect(result).toEqual(before)
  expect(
    projectEvaluationReport({
      ...turn,
      result: { ...result, status: 'failed' }
    })
  ).toBeUndefined()
  expect(
    projectEvaluationReport({
      ...turn,
      result: {
        ...result,
        preview: { ...result.preview, explanation: 'Ordinary' }
      }
    })
  ).toBeUndefined()
  expect(
    projectEvaluationReport({
      ...turn,
      result: { ...result, actionResults: result.actionResults.slice(0, 1) }
    })
  ).toBeUndefined()
})

it('execution proof delivers layered repetition before parameters with canonical references', async () => {
  const actions = [
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
  const designs = createLocalDesignTools(actions)
  const applied: PreparedDesign[] = []
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => {
      const design = (action.arguments as { design: PreparedDesign }).design
      applied.push(design)
      return {
        actionId: action.id,
        actionName: action.name,
        result: {
          status: 'complete',
          appliedElementCount: design.entries.length,
          compositionId: design.entries[0].descriptor.id
        }
      }
    })
  }))
  const operations = createOperationOwner(actions, designs, execute, {
    getNativeTools: () =>
      main.definitions.map((definition) => ({
        ...definition,
        namespace: 'design'
      }))
  })
  const main = createLocalDesignWorkflow(designs, operations)
  const signal = new AbortController().signal
  const replies: string[] = []
  const guide = JSON.parse(
    await readCompleteInformation(
      async (args) => {
        const raw = await operations.call('describe_design_apis', args, signal)
        replies.push(raw)
        return raw
      },
      {
        names: ['prepare_and_apply_design'],
        view: 'usage',
        inputScope: {
          operation: 'draft',
          nodeTypes: ['projected-face', 'surface-grid', 'pattern'],
          optionalInputs: ['plan']
        }
      }
    )
  )
  const tool = guide.tools[0]
  const first = JSON.parse(replies[0]).contentDelivery?.text ?? replies[0]
  expect(first).toContain(JSON.stringify(tool.invocationExample))
  expect(first.indexOf('"invocationExample"')).toBeLessThan(
    first.indexOf('"parameters"')
  )
  expect(replies.length).toBeLessThanOrEqual(2)
  expect(
    replies.reduce((sum, raw) => sum + Buffer.byteLength(raw), 0)
  ).toBeLessThanOrEqual(27702)
  const { invocation } = tool.invocationExample
  const definition = main.definitions.find(
    (item) => item.name === invocation.tool
  )
  if (!definition) throw new Error('Missing published execution route')
  const reply = await invokeLocalTool(
    main,
    definition,
    { ...invocation.arguments, inspection: 'defer' },
    signal
  )
  const result = JSON.parse(reply.text)
  expect(result.toolOutcome.settlement).toBe('completed')
  expect(applied).toHaveLength(1)
  expect(applied[0].entries).toHaveLength(16)
  expect(applied[0].entries.slice(1, 4).map((entry) => entry.key)).toEqual([
    'unit-0-panel',
    'unit-1-panel',
    'cap'
  ])
  const retained = JSON.parse(
    await designs.call(
      'retain_design_targets',
      {
        targets: [{ artifactId: result.artifactId, keyPrefix: 'windows-1-' }]
      },
      signal
    )
  ).targets[0]
  expect(
    designs.resolveTargets({
      artifactId: retained.artifactId,
      targetSetId: retained.targetSetId
    })
  ).toEqual(applied[0].entries.slice(10).map((entry) => entry.descriptor.id))
  expect(execute).toHaveBeenCalledOnce()
})

it('execution proof separates budget snapshot projection and retained lookup work', async () => {
  const { measureDesignBudget } = await import('../design-budget')
  for (const mode of ['sync', 'async']) {
    const points = [
      { x: 0, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { x: 4, y: 0, z: 4 },
      { x: 0, y: 0, z: 4 }
    ]
    const reads: string[] = []
    const input = {
      type: 'group',
      get name() {
        reads.push('snapshot')
        return 'Repeated'
      },
      projection: {
        azimuth: 0,
        elevation: 0,
        scale: 1,
        originX: 0,
        originY: 20
      },
      children: [
        {
          type: 'pattern',
          name: 'Panels',
          key: 'panels',
          origin: { x: 0, y: 0, z: 0 },
          axes: [{ count: 100, step: { x: 5, y: 0, z: 0 } }],
          faces: [
            {
              key: 'face',
              name: 'Face',
              fill: '#123456',
              get vertices() {
                reads.push('vertices')
                return points
              }
            }
          ]
        }
      ]
    }
    const original = structuredClone(input)
    reads.length = 0
    expect(measureDesignBudget(input).observed).toMatchObject({
      expandedNodes: 101,
      sourcePathCommands: 4,
      sourcePrimitivePathCommands: 4,
      expandedPathCommands: 400
    })
    expect(reads).toEqual(['vertices'])
    reads.length = 0
    const compile = vi.fn(prepareDesign)
    const session = createDesignPreparationSession(
      compile,
      async (_signal, ...args) => compile(...args)
    )
    const receipt =
      mode === 'sync'
        ? session.prepare(input)
        : await session.prepareAsync(input, new AbortController().signal)
    expect(reads).toEqual(['vertices', 'snapshot', 'vertices'])
    // Four template vertices plus one shared zero and 100 instance offsets.
    expect(receipt.sourceWork?.projectionCalls).toBe(105)
    expect(receipt.sourceWork).toMatchObject({ nodes: 2, pathCommands: 4 })
    const artifact = session.resolve(receipt.artifactId)
    expect(artifact).toEqual(prepareDesign(original, receipt.artifactId))
    points[0].x = 1
    expect(session.recipe(receipt.artifactId).recipe).toEqual(original)
    expect(session.resolve(receipt.artifactId)).toBe(artifact)
    expect(reads).toHaveLength(3)
    expect(compile).toHaveBeenCalledOnce()
    reads.length = 0
    input.children[0].axes[0].count = 10000
    if (mode === 'sync') expect(() => session.prepare(input)).toThrow()
    else
      await expect(
        session.prepareAsync(input, new AbortController().signal)
      ).rejects.toThrow()
    expect(reads).toEqual(['vertices'])
    expect(compile).toHaveBeenCalledOnce()
    expect(session.resolve(receipt.artifactId)).toBe(artifact)
    session.release([receipt.artifactId])
    expect(() => session.resolve(receipt.artifactId)).toThrow()
  }
})

// Isolated Inspector cases are self-contained. The full saved-input equivalence and
// provenance live in shared-motifs.test.ts and its permanent JSON fixture.
const sharedMotifProof = () => {
  const motifs = [
    {
      key: 'mark',
      name: 'Triangle',
      fill: '#123456',
      vertices: [
        { u: 0.1, v: 0.1 },
        { u: 0.9, v: 0.1 },
        { u: 0.5, v: 0.9 }
      ]
    }
  ]
  const grid = {
    type: 'surface-grid',
    key: 'a',
    name: 'Markers',
    boundary: [
      { x: 0, y: 0, z: 0 },
      { x: 12, y: 0, z: 0 },
      { x: 10, y: 0, z: 20 },
      { x: 2, y: 0, z: 20 }
    ],
    rows: 2,
    columns: 3,
    order: 'cell-major',
    motifs: { template: 'markers' }
  }
  const draft = {
    type: 'group',
    name: 'Signs',
    projection: {
      azimuth: 30,
      elevation: 25,
      scale: 1,
      originX: 0,
      originY: 20
    },
    motifTemplates: { markers: motifs },
    children: [
      grid,
      {
        ...grid,
        key: 'b',
        rows: 3,
        columns: 2,
        boundary: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 18, z: 0 },
          { x: 0, y: 16, z: 9 },
          { x: 0, y: 2, z: 9 }
        ]
      }
    ]
  }
  const { motifTemplates: _definitions, ...plain } = draft
  return {
    compact: { draft },
    input: {
      draft: {
        ...plain,
        children: draft.children.map((child) => ({ ...child, motifs }))
      }
    },
    query: {
      names: ['prepare_and_apply_design'],
      view: 'usage',
      inputScope: {
        operation: 'draft',
        nodeTypes: ['projected-face', 'surface-grid'],
        optionalInputs: ['plan']
      }
    },
    baseline: { guideReplies: 2, guideWireBytes: 27021 }
  }
}

it('execution proof delivers shared motifs through the main workflow without extra reading', async () => {
  const fixture = sharedMotifProof()
  const actions = [
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
  const designs = createLocalDesignTools(actions)
  const applied: PreparedDesign[] = []
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => {
      const design = (action.arguments as { design: PreparedDesign }).design
      applied.push(design)
      return {
        actionId: action.id,
        actionName: action.name,
        result: {
          status: 'complete',
          appliedElementCount: design.entries.length,
          compositionId: design.entries[0].descriptor.id
        }
      }
    })
  }))
  const operations = createOperationOwner(actions, designs, execute, {
    getNativeTools: () =>
      main.definitions.map((d) => ({ ...d, namespace: 'design' }))
  })
  const main = createLocalDesignWorkflow(designs, operations),
    signal = new AbortController().signal
  const replies: string[] = []
  const body = await readCompleteInformation(async (args) => {
    const raw = await operations.call('describe_design_apis', args, signal)
    replies.push(raw)
    return raw
  }, fixture.query)
  const tool = JSON.parse(body).tools[0]
  expect(body).toContain('motifTemplates')
  expect(body).toContain('without overrides')
  expect(replies.length).toBeLessThanOrEqual(fixture.baseline.guideReplies)
  const bytes = replies.reduce((n, text) => n + Buffer.byteLength(text), 0)
  expect(bytes).toBeLessThanOrEqual(fixture.baseline.guideWireBytes)
  expect(
    bytes + Buffer.byteLength(JSON.stringify(fixture.compact))
  ).toBeLessThan(
    fixture.baseline.guideWireBytes +
      Buffer.byteLength(JSON.stringify(fixture.input))
  )
  const { invocation } = tool.invocationExample
  expect(invocation.arguments.draft.motifTemplates).toBeDefined()
  const definition = main.definitions.find((d) => d.name === invocation.tool)
  if (!definition) throw new Error('Missing workflow definition')
  const reply = await invokeLocalTool(
    main,
    definition,
    { ...invocation.arguments, inspection: 'defer' },
    signal
  )
  expect(JSON.parse(reply.text).toolOutcome.settlement).toBe('completed')
  expect(applied).toHaveLength(1)
  expect(applied[0].entries).toHaveLength(16)
  const input = { draft: fixture.compact.draft, inspection: 'defer' }
  const recorded = JSON.parse(
    (await invokeLocalTool(main, definition, input, signal)).text
  )
  expect(recorded.toolOutcome.settlement).toBe('completed')
  expect(applied[1].entries).toEqual(
    prepareDesign(fixture.input.draft, recorded.artifactId).entries
  )
})

it('execution proof preserves shared motifs geometry budget lifetime and recovery', async () => {
  const fixture = sharedMotifProof()
  const { measureDesignBudget } = await import('../design-budget')
  const source = structuredClone(fixture.compact.draft)
  const session = createDesignPreparationSession()
  const prepared = session.prepare(source)
  expect(session.resolve(prepared.artifactId).entries).toEqual(
    prepareDesign(fixture.input.draft, prepared.artifactId).entries
  )
  expect(measureDesignBudget(source).observed.expandedNodes).toBe(13)
  source.motifTemplates.markers[0].vertices[0].u = 0.01
  expect(session.recipe(prepared.artifactId).recipe).toEqual(
    fixture.compact.draft
  )
  session.release([prepared.artifactId])
  expect(() => session.resolve(prepared.artifactId)).toThrow()
  const actions = [
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply',
      inputSchema: {}
    }
  ]
  const designs = createLocalDesignTools(actions)
  const applied: PreparedDesign[] = []
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => {
      const design = (action.arguments as { design: PreparedDesign }).design
      applied.push(design)
      return {
        actionId: action.id,
        actionName: action.name,
        result: {
          status: 'complete',
          appliedElementCount: design.entries.length,
          compositionId: design.entries[0].descriptor.id
        }
      }
    })
  }))
  const main = createLocalDesignWorkflow(
      designs,
      createOperationOwner(actions, designs, execute)
    ),
    signal = new AbortController().signal
  const invoke = async (input: unknown) =>
    JSON.parse(
      (await invokeLocalTool(main, main.definitions[0], input, signal)).text
    )
  const invalid = structuredClone(fixture.compact.draft)
  const invalidGrid = invalid.children.find((c) => c.type === 'surface-grid')
  if (!invalidGrid) throw new Error('Missing recorded grid')
  invalidGrid.motifs = {
    template: 'missing'
  }
  const result = await invoke({
    parts: [
      { key: 'first', draft: fixture.compact.draft },
      { key: 'second', parentPart: 'first', draft: invalid }
    ],
    inspection: 'defer'
  })
  expect(result.toolOutcome.status).toBe('partial')
  expect(execute).toHaveBeenCalledOnce()
  const rejected = result.parts[1]
  expect(rejected.message).toContain('missing')
  expect(rejected.draftId).toEqual(expect.any(String))
  const index = invalid.children.findIndex((c) => c.type === 'surface-grid')
  const repaired = await invoke({
    repair: {
      draftId: rejected.draftId,
      replacements: [
        {
          path: `/children/${index}/motifs/template`,
          value: 'markers'
        }
      ]
    },
    parentId: applied[0].entries[0].descriptor.id,
    inspection: 'defer'
  })
  expect(repaired.toolOutcome.settlement).toBe('completed')
  expect(execute).toHaveBeenCalledTimes(2)
  expect(applied[1].entries).toHaveLength(13)
})

it('execution proof follows union entry navigation and valid recovery without replay', async () => {
  const { toolSemantics } = await import('../../src/ai/tool-contract')
  const action: AiActionDescription = {
    name: AiActionNames.READ_DESIGN_CONTEXT,
    description: 'Read selected context.',
    inputSchema: {
      oneOf: [
        {
          type: 'object',
          required: ['scope'],
          additionalProperties: false,
          properties: { scope: { const: 'selection' } }
        },
        {
          type: 'object',
          required: ['scope', 'snapshotId'],
          additionalProperties: false,
          properties: {
            scope: { const: 'snapshot' },
            snapshotId: { type: 'string' }
          }
        }
      ]
    },
    ...toolSemantics({ type: 'object' }, 'read', [])
  }
  const dispatch = vi.fn()
  const owner = createOperationOwner(
    [action],
    { modelActions: (a) => a, resolveBatch: (b) => b },
    dispatch,
    {
      getNativeTools: () => [
        {
          name: action.name,
          namespace: 'context_tools',
          description: action.description,
          inputSchema: {
            type: 'object',
            required: ['arguments'],
            additionalProperties: false,
            properties: { arguments: action.inputSchema }
          },
          ...toolSemantics({ type: 'object' }, 'read', [])
        }
      ]
    }
  )
  const read = async (args: unknown) => {
    const definition = owner.definitions.find(
      (tool) => tool.name === 'describe_design_apis'
    )
    if (!definition) throw new Error('Missing discovery definition')
    const reply = await invokeLocalTool(
      owner,
      definition,
      args,
      new AbortController().signal
    )
    return JSON.parse(reply.text)
  }
  const usage = await read({ names: [action.name], view: 'usage' })
  expect(usage.toolOutcome.status, JSON.stringify(usage)).toBe('success')
  for (const entry of [...usage.apis, ...usage.tools]) {
    const path = entry.inputFields.find((value: string) =>
      value.endsWith('/oneOf/0')
    )
    expect(path).toBeDefined()
    const {
      view: _view,
      refresh: _refresh,
      refreshReason: _reason,
      ...selector
    } = entry.definition.refresh.arguments
    const scoped = await read({ ...selector, schemaPaths: [path] })
    expect([...scoped.apis, ...(scoped.tools ?? [])]).toHaveLength(1)
    expect(scoped.toolOutcome.status).toBe('success')
    const invalid = await read({ ...selector, schemaPaths: ['/missing'] })
    const rejected = [...invalid.apis, ...(invalid.tools ?? [])][0]
    expect(rejected.definition.coverage).toBe('none')
    const recovered = await read(rejected.definition.recover.arguments)
    expect(recovered.toolOutcome.status).toBe('success')
    expect([...recovered.apis, ...(recovered.tools ?? [])]).toHaveLength(1)
    expect(
      [...recovered.apis, ...(recovered.tools ?? [])][0].definition.coverage
    ).toBe('usage')
  }
  expect(dispatch).not.toHaveBeenCalled()
})

it('execution proof preserves interrupted owner results without replay', async () => {
  vi.stubGlobal('window', {})
  const { createPreparedDesignAction } =
    await import('../../src/ai/design-actions')
  const { createAiAgentRuntime } = await import('@asyra/ai-agent-runtime')
  const entries = new Map<string, PreparedElementDescriptor>()
  const create = vi.fn((values: readonly PreparedElementDescriptor[]) => {
    for (const entry of values) entries.set(entry.id, entry)
    return values.map((entry) => entry.id)
  })
  const select = vi.fn()
  const action = createPreparedDesignAction(
    {
      getWorkspaceId: () => 'workspace',
      getElementType: (id) => entries.get(id)?.type,
      getElementMetadata: () => undefined,
      getPlacement: (id) => entries.get(id),
      isContainerType: (type) => type === 'group',
      isLocked: () => false,
      create,
      select
    },
    async () => {
      throw new Error('Work window ended')
    }
  )
  const design = prepareDesign(
    {
      type: 'group',
      name: 'Composition',
      key: 'root',
      children: [
        {
          type: 'rect',
          key: 'panel',
          name: 'Panel',
          x: 0,
          y: 0,
          width: 20,
          height: 20,
          fill: '#123456'
        }
      ]
    },
    'interruption-proof'
  )
  let receipt: AiBatchReceipt | undefined
  const runtime = createAiAgentRuntime({
    provider: {
      requestActionBatch: async (_input, options) => {
        receipt = await options.executeBatch?.({
          batchId: 'draw',
          actions: [
            {
              id: 'apply',
              name: action.name,
              arguments: { design, response: 'compact' },
              summary: 'Draw'
            }
          ]
        })
        return { batchId: 'report', actions: [] }
      }
    },
    actionDefinitions: [action],
    contextProvider: { getContext: async () => ({}) },
    permissionPolicy: { evaluate: () => 'allow' },
    confirmationHandler: { confirm: async () => true },
    transactionRunner: { run: async (_label, work) => work() }
  })
  try {
    await runtime.run({ intent: 'Draw', signal: new AbortController().signal })
    expect(receipt).toMatchObject({
      failure: { settlement: 'partial' },
      actionResults: [
        {
          actionId: 'apply',
          result: {
            status: 'partial',
            compositionId: design.rootId,
            appliedElementCount: 1,
            plannedElementCount: 2,
            appliedRange: { start: 0, end: 1 }
          }
        }
      ]
    })
    expect([...entries.keys()]).toEqual([design.rootId])
    expect(create).toHaveBeenCalledTimes(1)
    expect(select).not.toHaveBeenCalled()
  } finally {
    await runtime.dispose()
    vi.unstubAllGlobals()
  }
})

it('execution proof preserves cancellation evidence through native invocation', async () => {
  const { toolSemantics } = await import('../../src/ai/tool-contract')
  const controller = new AbortController()
  const receipts = {
    batches: [
      {
        actionResults: [
          {
            actionId: 'draw',
            actionName: 'draw',
            result: {
              status: 'partial',
              compositionId: 'root',
              appliedElementCount: 1
            }
          }
        ],
        failure: { code: 'AI_EXECUTION_FAILED', settlement: 'partial' }
      }
    ]
  }
  const call = vi.fn(async () => {
    controller.abort()
    throw new Error('Interrupted')
  })
  const host = createLocalToolHost({
    requestId: 'interruption-proof',
    signal: controller.signal,
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
        throw new Error('No recipe save')
      }
    },
    executionEvidence: () => receipts,
    createGroups: () => [
      {
        name: 'drawing',
        description: 'Drawing',
        owner: {
          call,
          definitions: [
            {
              name: 'draw',
              description: 'Draw',
              inputSchema: { type: 'object' },
              ...toolSemantics({ type: 'object' }, 'mutation', ['document'])
            }
          ]
        }
      }
    ]
  })
  try {
    await expect(
      host.invoke({ name: 'drawing.draw', input: {} })
    ).rejects.toMatchObject({
      receipt: { result: receipts, settlement: 'partial' }
    })
    await expect(
      host.invoke({ name: 'drawing.draw', input: {} })
    ).rejects.toThrow()
    expect(call).toHaveBeenCalledTimes(1)
  } finally {
    await host.dispose()
  }
})

it('execution proof projects compact diagnostics after owner evidence without replay', async () => {
  const actions = [
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply',
      inputSchema: {}
    }
  ]
  const designs = createLocalDesignTools(actions)
  const timing = { totalMs: 8, canonicalWork: { counters: { created: 2 } } }
  const execute = vi.fn(
    async (batch: AiActionBatch): Promise<AiBatchReceipt> => {
      const action = batch.actions[0]
      const { design } = action.arguments as { design: PreparedDesign }
      return {
        context: {},
        actionResults: [
          {
            actionId: action.id,
            actionName: action.name,
            result: {
              compositionId: design.rootId,
              status: 'complete',
              appliedElementCount: design.entries.length,
              timing,
              recovery: {
                timing: 'preserve semantic data',
                instruction: 'Do not replay'
              }
            }
          }
        ]
      }
    }
  )
  const operations = createLocalOperationTools(actions, designs, execute)
  const observations: { stage: string; tool?: unknown; result?: unknown }[] = []
  const workflow = createLocalDesignWorkflow(designs, operations, {
    trace: (stage, evidence) =>
      observations.push({ stage, ...structuredClone(evidence) })
  })
  const reply = await invokeLocalTool(
    workflow,
    workflow.definitions[0],
    {
      draft: {
        type: 'group',
        name: 'Part',
        children: [
          {
            type: 'rect',
            key: 'face',
            name: 'Face',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            fill: '#123456'
          }
        ]
      },
      inspection: 'defer'
    },
    new AbortController().signal
  )
  const result = JSON.parse(reply.text)
  // Missing mechanical follow-up remains partial; compacting cannot promote it.
  expect(result.toolOutcome).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(result.measurementIssues[0].recovery).toContain('Do not replay')
  expect(result).not.toHaveProperty('reuse')
  expect(result).not.toHaveProperty('sourceWork')
  expect(result.actionResults[0].result).not.toHaveProperty('timing')
  expect(result.actionResults[0].result).toMatchObject({
    appliedElementCount: 2,
    recovery: { timing: 'preserve semantic data' }
  })
  expect(
    observations.find(
      (entry) =>
        entry.stage === 'action_completed' &&
        entry.tool === 'apply_prepared_design'
    )?.result
  ).toMatchObject({ actionResults: [{ result: { timing } }] })
  expect(execute).toHaveBeenCalledOnce()
})

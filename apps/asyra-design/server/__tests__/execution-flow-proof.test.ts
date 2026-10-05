const reviewCriteria = (names: readonly string[]) =>
  Object.fromEntries(
    names.map((id) => [
      id,
      { requirement: id, description: id, verification: 'visual' }
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
import { createLocalOperationTools } from '../local-operation-tools'
import { AiDesignToolIds } from '../../src/constants/ai-design'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import type { AiConversationFeature } from '../../src/ai/conversation'
import { createAiConversationController } from '../../src/ai/conversation'
import {
  createDesignPreparationSession,
  prepareDesign
} from '../design-preparation'
import { createLocalAiUsage } from '../local-ai-usage'
import { parseExecutionRecord, type ExecutionRecord } from '../local-ai-records'
import { evaluateExecution } from '../local-ai-evaluation'
import { assessExecution } from '../local-ai-assessment'
import { createLocalDesignReview } from '../local-design-review'
import { requestLocalAiActionBatch } from '../local-ai-provider'
import { createLocalToolScheduler } from '../local-tool-scheduler'

const { spawn } = vi.hoisted(() => ({ spawn: vi.fn() }))
vi.mock('node:child_process', () => ({ spawn }))
vi.mock('../local-ai-records', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../local-ai-records')>()),
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
        if (packet.id === 101 && packet.result) {
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
    { model: 'gpt-6-astra', executable: 'test-transport', executeBatch }
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
  const categoryDiscovery = packets.find(
    (packet) => packet.id === 101 && packet.result
  )?.result
  expect(categoryDiscovery?.success).toBe(true)
  if (!categoryDiscovery) throw new Error('Missing category discovery receipt')
  const categoryApis = JSON.parse(categoryDiscovery.contentItems[0].text).apis
  expect(categoryApis).toEqual(
    basicApiContracts
      .filter((api) => api.category === 'fill')
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
})

it('execution proof composes preparation and canonical dispatch without repeated work', async () => {
  const actions = [
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply prepared design',
      inputSchema: {}
    }
  ]
  const compile = vi.fn(prepareDesign)
  const designs = createLocalDesignTools(
    actions,
    createDesignPreparationSession(compile)
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
      inspectionIds: [initial],
      checks: [check('Silhouette')]
    })
  ).toMatchObject({ readyForDetail: true, accepted: false })
  review.mutate()
  expect(() =>
    review.record({
      phase: 'visual',
      inspectionIds: [initial],
      checks: [check('Silhouette'), check('Finish')]
    })
  ).toThrow()
  expect(review.getIssue()).toBeTruthy()
  expect(review.record({ phase: 'facts' })).toEqual(savedFacts)
  expect(
    review.record({
      phase: 'visual',
      inspectionIds: [
        review.inspect('root', true, true)?.inspectionId,
        review.inspect('detail', true, false)?.inspectionId
      ],
      checks: [check('Silhouette'), check('Finish')]
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
    AiDesignToolIds.RECORD_DESIGN_REVIEW,
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
      AiDesignToolIds.RECORD_DESIGN_REVIEW,
      {
        phase: 'visual',
        inspectionIds: [unrelated.actionResults[0].result.inspectionId],
        checks: [check('Silhouette')]
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
    AiDesignToolIds.RECORD_DESIGN_REVIEW,
    {
      phase: 'visual',
      inspectionIds: [image.actionResults[0].result.inspectionId],
      checks: [check('Silhouette')]
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
  expect(execute).toHaveBeenCalledTimes(5)
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
    const usage = createLocalAiUsage(
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

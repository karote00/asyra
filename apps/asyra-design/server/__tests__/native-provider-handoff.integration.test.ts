import { createConversationResults } from '../../src/ai/conversation-results'
import { expect, it as nativeTest, vi } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { join } from 'node:path'
import { isRecord } from '@asyra/utils'
import { requestConfiguredAiActionBatch } from '../ai-model-provider'
import { requestLocalAiAssessment } from '../local-ai-provider'
import { operationInputIssue } from '../operation-input-schema'
import { createEvaluationReportSessions } from '../evaluation-report-sessions'
import * as designPreparationOwner from '../design-preparation'
import {
  nativeProviderExecutable,
  createNativeProviderFixture,
  nativeSuccessorContent
} from './native-provider-fixture'

const it = nativeTest.skipIf(!nativeProviderExecutable)

const initialNativeHandoff = (
  fixture: Awaited<ReturnType<typeof createNativeProviderFixture>>
) => {
  const starts = fixture
    .appPackets()
    .filter(
      (packet) => packet.method === 'thread/start' && isRecord(packet.params)
    )
  const original = starts.at(-1)?.params
  const received = fixture.requests[0]

  if (!isRecord(original) || !isRecord(received)) {
    throw Error('Missing actual instruction handoff')
  }

  const tool = (groups: unknown) => {
    if (!Array.isArray(groups)) {
      throw Error('Missing tool declarations')
    }

    const entries = groups
      .filter(isRecord)
      .flatMap((group) =>
        Array.isArray(group.tools) ? group.tools.filter(isRecord) : []
      )
      .filter((item) => item.name === 'execute_design')

    if (entries.length !== 1) {
      throw Error('Expected one unambiguous execute_design declaration')
    }

    return entries[0]
  }

  return {
    original,
    received,
    ownerSchema: tool(original.dynamicTools).inputSchema,
    receivedSchema: tool(received.tools).parameters
  }
}

it.each([undefined, 'omit-instructions', 'alter-tool-schema'] as const)(
  'observes exact instructions and executable restrictions at the native model boundary - %s',
  async (fault) => {
    const fixture = await createNativeProviderFixture([], fault)

    try {
      await requestConfiguredAiActionBatch(
        {
          actions: [],
          context: {},
          attempt: 1,
          intent: 'Inspect available capabilities without editing.'
        },
        { environment: fixture.environment, signal: AbortSignal.timeout(45000) }
      )
      const { original, received, ownerSchema, receivedSchema } =
        initialNativeHandoff(fixture)

      const assertConsumer = () => {
        expect(received.instructions, 'Original App instructions').toBe(
          original.baseInstructions
        )
        expect(
          JSON.stringify(received.input),
          'Original developer instructions'
        ).toContain(JSON.stringify(original.developerInstructions).slice(1, -1))
        expect(
          operationInputIssue({ unexpected: true }, ownerSchema)
        ).toBeDefined()
        expect(
          operationInputIssue({ unexpected: true }, receivedSchema),
          'Published input restriction'
        ).toBeDefined()
      }

      if (fault) {
        expect(assertConsumer).toThrow(
          fault === 'omit-instructions'
            ? /Original App instructions/
            : /Published input restriction/
        )
      } else {
        assertConsumer()
      }
    } finally {
      await fixture.dispose()
    }
  },
  60000
)

it('preserves invalid empty result selection rejection in the actual native contract', async () => {
  const fixture = await createNativeProviderFixture([])

  try {
    await requestConfiguredAiActionBatch(
      {
        actions: [],
        context: {},
        attempt: 1,
        intent: 'Inspect result delivery capabilities.'
      },
      { environment: fixture.environment, signal: AbortSignal.timeout(45000) }
    )
    const { ownerSchema, receivedSchema } = initialNativeHandoff(fixture)
    const valid = {
      delivery: { fields: { chosen: { name: 'saved', path: '' } } }
    }

    for (const schema of [ownerSchema, receivedSchema]) {
      expect(operationInputIssue(valid, schema)).toBeUndefined()
      expect(
        operationInputIssue(
          { delivery: { fields: { chosen: { name: 'saved' } } } },
          schema
        )
      ).toBeDefined()
      expect(
        operationInputIssue({ delivery: { fields: [] } }, schema)
      ).toBeDefined()
    }

    const invalid = { delivery: { fields: {} } }

    expect(
      operationInputIssue(invalid, ownerSchema),
      'Owner rejects an empty selection'
    ).toBeDefined()
    expect(
      operationInputIssue(invalid, receivedSchema),
      'Native consumer must receive the same restriction'
    ).toBeDefined()
  } finally {
    await fixture.dispose()
  }
}, 60000)

it('retries durable storage through the actual native provider without replaying successful preparation', async () => {
  const preparationCalls = new Set<string>()
  const sessions = vi.spyOn(
    designPreparationOwner,
    'createDesignPreparationSession'
  )

  const observePreparation = (
    session: ReturnType<
      typeof designPreparationOwner.createDesignPreparationSession
    >
  ) => vi.spyOn(session, 'prepareAsync')

  let preparationWork: ReturnType<typeof observePreparation> | undefined
  let database: DatabaseSync | undefined
  let locked = false
  let dependencyRevision: number | undefined
  let receiptId: string | undefined
  let preparedValue: string | undefined
  let candidate: unknown
  const name = 'prepare-sized-panel'

  const call = (id: string, tool: string, input: unknown) => ({
    type: 'function_call',
    id,
    call_id: id,
    namespace: 'tool_library',
    name: tool,
    arguments: JSON.stringify(input)
  })

  const stored = () => {
    if (!database) {
      throw Error('The real library database has not been opened')
    }

    const rows = database
      .prepare('SELECT version,record FROM tool_library')
      .all()

    expect(rows).toHaveLength(1)
    if (typeof rows[0].record !== 'string') {
      throw Error('Missing durable recipe bytes')
    }

    return { version: rows[0].version, record: JSON.parse(rows[0].record) }
  }

  let contractCallId = 'contracts'
  let contractBody = ''
  let contractRevision: unknown
  let contractPages = 0

  const readContract = (
    request: Record<string, unknown>
  ): Record<string, unknown> => {
    let result = successorData(request, contractCallId)

    contractPages++
    const page = result.contentDelivery

    if (isRecord(page)) {
      expect(page.kind).toBe('json-fragment')
      expect(page.startByte).toBe(Buffer.byteLength(contractBody))
      if (contractRevision === undefined) {
        contractRevision = page.revision
      }

      expect(page.revision).toBe(contractRevision)
      if (typeof page.text !== 'string') {
        throw Error('Missing contract page text')
      }

      contractBody += page.text
      expect(page.endByte).toBe(Buffer.byteLength(contractBody))
      if (page.lastPage === false) {
        if (!isRecord(page.next) || !isRecord(page.next.arguments)) {
          throw Error('Missing executable contract continuation')
        }

        expect(page.next.tool).toBe('read_design_contracts')
        contractCallId = 'contracts-' + contractPages
        steps.splice(fixture.requests.length, 0, readContract)

        return {
          type: 'function_call',
          id: contractCallId,
          call_id: contractCallId,
          namespace: 'design_operations',
          name: page.next.tool,
          arguments: JSON.stringify(page.next.arguments)
        }
      }

      expect(page.lastPage).toBe(true)
      expect(page.totalBytes).toBe(Buffer.byteLength(contractBody))
      const complete: unknown = JSON.parse(contractBody)

      if (!isRecord(complete)) {
        throw Error('Missing complete acquired contract')
      }

      result = complete
    }

    if (!Array.isArray(result.tools)) {
      throw Error('Missing acquired preparation contract')
    }

    const dependencies = result.tools
      .filter(isRecord)
      .filter(
        (tool) => tool.registeredName === 'design_preparation.prepare_design'
      )

    expect(dependencies).toHaveLength(1)
    expect(dependencies[0].composition).toBe('allowed')
    if (typeof dependencies[0].revision !== 'number') {
      throw Error('Missing exact acquired revision')
    }

    dependencyRevision = dependencies[0].revision

    return {
      type: 'tool_search_call',
      id: 'library',
      call_id: 'library',
      execution: 'client',
      status: 'completed',
      arguments: { query: 'tool_library', limit: 4 }
    }
  }

  const steps: Parameters<typeof createNativeProviderFixture>[0] = [
    () => {
      expect(sessions).toHaveBeenCalledTimes(1)
      const created = sessions.mock.results[0]

      if (created.type !== 'return') {
        throw Error('Missing actual preparation owner')
      }

      preparationWork = observePreparation(created.value)

      return {
        type: 'function_call',
        id: 'contracts',
        call_id: 'contracts',
        namespace: 'design_operations',
        name: 'read_design_contracts',
        arguments: JSON.stringify({
          names: ['design_preparation.prepare_design']
        })
      }
    },
    readContract,
    () =>
      call('submit-panel', 'submit_tool', {
        submissionId: 'panel-definition',
        proposal: {
          format: 1,
          name,
          revision: 1,
          description: 'Prepare a fresh editable panel with a selected width.',
          inputSchema: { type: 'number', minimum: 1, maximum: 100 },
          outputSchema: {
            type: 'string',
            minLength: 1,
            maxLength: 160,
            'x-runtime-value': 'request-artifact'
          },
          steps: [
            {
              id: 'prepare',
              tool: 'design_preparation.prepare_design',
              revision: dependencyRevision,
              input: {
                kind: 'object',
                fields: {
                  draft: {
                    kind: 'object',
                    fields: {
                      type: { kind: 'literal', value: 'frame' },
                      name: { kind: 'literal', value: 'Panel' },
                      width: { kind: 'input', path: '' },
                      height: { kind: 'literal', value: 20 },
                      children: {
                        kind: 'literal',
                        value: [
                          {
                            type: 'rect',
                            name: 'Surface',
                            key: 'surface',
                            width: 1,
                            height: 1
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
      }),
    (request) => {
      expect(successorData(request, 'submit-panel')).toMatchObject({
        ok: true,
        name,
        revision: 1,
        storage: { status: 'saved', availability: 'candidate' }
      })
      database = new DatabaseSync(
        join(fixture.directory, 'library/library.sqlite')
      )
      candidate = stored()
      expect(candidate).toMatchObject({ record: { availability: 'candidate' } })
      expect(preparationCalls.size).toBe(0)
      expect(preparationWork).toHaveBeenCalledTimes(0)
      database.exec('BEGIN IMMEDIATE')
      locked = true

      return call('prepare-panel', 'invoke_tool', {
        name,
        revision: 1,
        input: 12
      })
    },
    (request) => {
      const result = successorData(request, 'prepare-panel')

      expect(result).toMatchObject({
        execution: { status: 'success', settlement: 'completed', issues: [] },
        storage: { status: 'unsaved', code: 'storage-failed' }
      })
      if (
        typeof result.receiptId !== 'string' ||
        !isRecord(result.execution) ||
        typeof result.execution.value !== 'string'
      ) {
        throw Error('Missing actual completed value or save-only receipt')
      }

      receiptId = result.receiptId
      preparedValue = result.execution.value
      expect(preparationCalls.size).toBe(1)
      expect(preparationWork).toHaveBeenCalledTimes(1)
      expect(stored()).toEqual(candidate)
      database?.exec('ROLLBACK')
      locked = false

      return call('reject-invented-receipt', 'save_tool', {
        name,
        revision: 1,
        receiptId: 'invented-receipt'
      })
    },
    (request) => {
      expect(successorData(request, 'reject-invented-receipt')).toMatchObject({
        code: 'TOOL_INPUT_INVALID',
        settlement: 'not-started'
      })
      expect(stored()).toEqual(candidate)
      expect(preparationCalls.size).toBe(1)
      expect(preparationWork).toHaveBeenCalledTimes(1)

      return call('save-panel', 'save_tool', { name, revision: 1, receiptId })
    },
    (request) => {
      const result = successorData(request, 'save-panel')

      expect(result).toMatchObject({
        status: 'saved',
        availability: 'eligible'
      })
      expect(stored()).toMatchObject({
        version: result.version,
        record: { availability: 'eligible', contract: { name, revision: 1 } }
      })
      expect(JSON.stringify(stored())).not.toContain(preparedValue)
      expect(preparationCalls.size).toBe(1)
      expect(preparationWork).toHaveBeenCalledTimes(1)

      return undefined
    }
  ]
  const fixture = await createNativeProviderFixture(steps)
  const workDeadlineAt = Date.now() + 60000

  writeFileSync(
    join(fixture.directory, 'evaluation-control.json'),
    JSON.stringify({ workDeadlineAt })
  )

  try {
    // The action factory's dev-only Core debug export requires a window object.
    // This test advertises the real contract but never executes browser work.
    vi.stubGlobal('window', {})
    const { createPreparedDesignAction } =
      await import('../../src/ai/design-actions')
    const { createAiToolContract } = await import('@asyra/ai-agent-runtime')

    await requestConfiguredAiActionBatch(
      {
        actions: [createAiToolContract(createPreparedDesignAction())],
        context: {},
        attempt: 1,
        metadata: {
          evaluationWindow: { workDeadlineAt, reportTimeoutMs: null }
        },
        intent:
          'Prepare a reusable panel and recover storage without repeating preparation.'
      },
      {
        environment: fixture.environment,
        signal: AbortSignal.timeout(60000),

        executeBatch: async () => {
          throw Error('Preparation must not dispatch canvas actions')
        },

        onProgress: (event) => {
          if (
            event.tool === 'prepare_design' &&
            event.activity?.phase === 'preparing'
          ) {
            preparationCalls.add(event.activity.callId)
          }
        }
      }
    )
    expect(contractPages).toBeGreaterThan(0)
    expect(fixture.toolCalls()).toHaveLength(4 + contractPages)
    for (const expected of [
      { id: 'prepare-panel', success: false, status: 'partial' },
      { id: 'save-panel', success: true, status: 'success' }
    ]) {
      const reply = fixture.toolReply(expected.id)

      expect(reply.success).toBe(expected.success)
      expect(reply.contentItems.at(-1)).toEqual({
        type: 'inputText',
        text: JSON.stringify({
          toolOutcome: {
            status: expected.status,
            settlement: 'completed',
            issues: []
          }
        })
      })
      for (const item of reply.contentItems) {
        if (!('text' in item)) {
          throw Error('Unexpected media in save-only handoff')
        }

        expect(fixture.successorOutput(expected.id)).toContain(item.text)
      }
    }

    expect(fixture.toolReply('reject-invented-receipt').success).toBe(false)
    expect(
      fixture.appPackets().filter((packet) => packet.method === 'thread/start')
    ).toHaveLength(1)
    expect(
      fixture.appPackets().filter((packet) => packet.method === 'turn/start')
    ).toHaveLength(2)
    expect(
      fixture
        .appPackets()
        .filter((packet) => packet.method === 'turn/interrupt')
    ).toHaveLength(0)
  } finally {
    if (locked) {
      database?.exec('ROLLBACK')
    }

    database?.close()
    preparationWork?.mockRestore()
    sessions.mockRestore()
    vi.unstubAllGlobals()
    await fixture.dispose()
  }
}, 75000)

it('keeps actual native reporting and later questions in the original session without replay', async () => {
  const message = (text: string) => ({
    type: 'message',
    id: text.replaceAll(' ', '-'),
    role: 'assistant',
    status: 'completed',
    content: [{ type: 'output_text', text, annotations: [] }]
  })

  const fixture = await createNativeProviderFixture([
    () => undefined,
    {
      ...message(
        JSON.stringify({
          batchId: 'report',
          actions: [
            {
              id: 'report',
              name: 'report_outcome',
              arguments: {
                outcome: 'unsupported',
                message: 'Complete offline report'
              },
              summary: 'Report completed'
            }
          ]
        })
      ),
      id: 'offline-report'
    },
    message('First follow up answer'),
    message('Second follow up answer')
  ])
  const sessions = createEvaluationReportSessions()
  const retain = vi.spyOn(sessions, 'retain')

  try {
    await requestConfiguredAiActionBatch(
      {
        actions: [],
        context: {},
        attempt: 1,
        intent: 'Describe available capabilities without editing.',
        metadata: {
          evaluationWindow: {
            workDeadlineAt: Date.now() + 60000,
            reportTimeoutMs: null,
            keepReportSession: true
          }
        }
      },
      {
        environment: fixture.environment,
        signal: AbortSignal.timeout(45000),
        reportSessions: sessions
      }
    )
    expect(retain).toHaveBeenCalledTimes(1)
    const retained = retain.mock.results[0].value

    expect(sessions.status(retained.sessionId).status).toBe('waiting')
    const first = await sessions.ask(
      retained.sessionId,
      'Explain the delivered capabilities.'
    )
    const second = await sessions.ask(
      retained.sessionId,
      'Explain which inputs were reused.'
    )

    expect(first.messages.map((entry) => entry.text)).toContain(
      'First follow up answer'
    )
    expect(second.messages.map((entry) => entry.text)).toContain(
      'Second follow up answer'
    )
    expect(first.nativeThreadId).toBe(retained.nativeThreadId)
    expect(second.nativeThreadId).toBe(retained.nativeThreadId)
    expect(first.nativeTurnId).not.toBe(second.nativeTurnId)
    expect(
      fixture.appPackets().filter((entry) => entry.method === 'thread/start')
    ).toHaveLength(1)
    expect(
      fixture.appPackets().filter((entry) => entry.method === 'turn/start')
    ).toHaveLength(4)
    expect(fixture.requests).toHaveLength(4)
    expect(JSON.stringify(fixture.requests[3].input)).toContain(
      'Explain the delivered capabilities.'
    )
    expect(JSON.stringify(fixture.requests[3].input)).toContain(
      'First follow up answer'
    )
    expect(fixture.toolCalls()).toHaveLength(0)
    await sessions.close(retained.sessionId)
    await expect(
      sessions.ask(retained.sessionId, 'Late question')
    ).rejects.toThrow('closed')
    expect(fixture.requests).toHaveLength(4)
  } finally {
    await sessions.dispose()
    retain.mockRestore()
    await fixture.dispose()
  }
}, 60000)

it('hands real Knowledge data and execution state to the native successor request', async () => {
  const fixture = await createNativeProviderFixture([
    {
      type: 'tool_search_call',
      id: 'search-knowledge',
      call_id: 'search-knowledge',
      execution: 'client',
      status: 'completed',
      arguments: { query: 'read_knowledge', limit: 1 }
    },
    {
      type: 'function_call',
      id: 'read-colors',
      call_id: 'read-colors',
      namespace: 'design_knowledge',
      name: 'read_knowledge',
      arguments: JSON.stringify({ ids: ['colors'] })
    }
  ])

  try {
    await requestConfiguredAiActionBatch(
      {
        actions: [],
        context: {},
        attempt: 1,
        intent: 'Read color advice without changing the document.'
      },
      {
        environment: fixture.environment,
        signal: AbortSignal.timeout(45000)
      }
    )
    expect(fixture.requests).toHaveLength(3)
    const reply = fixture.toolReply('read-colors')

    expect(reply.success).toBe(true)
    expect(reply.contentItems.at(-1)).toEqual({
      type: 'inputText',
      text: JSON.stringify({
        toolOutcome: { status: 'success', settlement: 'completed', issues: [] }
      })
    })
    const actual = fixture.successorOutput('read-colors')

    expect(actual).toContain('toolOutcome')
    expect(actual).toContain('colors')
    const first = reply.contentItems[0]

    if (!('text' in first)) {
      throw Error('Missing Knowledge text')
    }

    expect(actual).toContain(first.text)
    expect(fixture.toolCalls()).toHaveLength(1)
  } finally {
    await fixture.dispose()
  }
}, 60000)

const knowledgeSteps = [
  {
    type: 'tool_search_call',
    id: 'search',
    call_id: 'search',
    execution: 'client',
    status: 'completed',
    arguments: { query: 'read_knowledge', limit: 1 }
  },
  {
    type: 'function_call',
    id: 'advice',
    call_id: 'advice',
    namespace: 'design_knowledge',
    name: 'read_knowledge',
    arguments: JSON.stringify({ ids: ['colors'] })
  }
]

it.each([undefined, 'advice'])(
  'delivers and reuses Knowledge input through native final selection - %s',
  async (step) => {
    const context = createConversationResults(() => 1).open(
      'native-final-input'
    )
    const selector = {
      ...(step ? { step } : {}),
      source: 'input',
      path: '/ids'
    }

    const request = (id: string, argumentsValue: unknown) => ({
      type: 'function_call',
      id,
      call_id: id,
      namespace: 'design_operations',
      name: 'execute_design',
      arguments: JSON.stringify(argumentsValue)
    })

    const fixture = await createNativeProviderFixture([
      request('save-input', {
        operations: [
          {
            id: 'advice',
            name: 'design_knowledge.read_knowledge',
            arguments: { ids: ['colors'] }
          }
        ],
        retain: { topics: selector },
        delivery: { fields: { topics: selector } }
      }),
      request('reuse-input', {
        operations: [
          {
            id: 'advice',
            name: 'design_knowledge.read_knowledge',
            arguments: {
              ids: { kind: 'named', name: 'topics', path: '' }
            }
          }
        ],
        delivery: { fields: { topics: selector } }
      })
    ])

    try {
      await requestConfiguredAiActionBatch(
        {
          actions: [],
          context: {},
          attempt: 1,
          intent: 'Read and reuse selected topics.',
          metadata: { conversationId: 'native-final-input' }
        },
        {
          environment: fixture.environment,
          signal: AbortSignal.timeout(45000),

          resultContext: async (command) => context.exchange(command)
        }
      )
      for (const id of ['save-input', 'reuse-input']) {
        const actual = fixture
          .successorOutput(id)
          .split('\n')
          .filter(Boolean)
          .map((text) => JSON.parse(text))

        expect(actual).toContainEqual(
          expect.objectContaining({ fields: { topics: ['colors'] } })
        )
        expect(actual).toContainEqual({
          toolOutcome: {
            status: 'success',
            settlement: 'completed',
            issues: []
          }
        })
        expect(fixture.toolReply(id).success).toBe(true)
      }

      expect(fixture.toolCalls()).toHaveLength(2)
    } finally {
      await fixture.dispose()
    }
  },
  60000
)

const assertKnowledgeConsumer = (text: string) => {
  const values: unknown[] = text
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
  const outcome = values
    .filter(isRecord)
    .find((item) => Object.hasOwn(item, 'toolOutcome'))

  expect(outcome, 'Required execution acknowledgement').toEqual({
    toolOutcome: { status: 'success', settlement: 'completed', issues: [] }
  })
  const data = values
    .filter(isRecord)
    .find((item) => Object.hasOwn(item, 'documents'))
  const source = readFileSync(
    new URL('../../../../domain-knowledge/colors.md', import.meta.url),
    'utf8'
  )
  const body = source.split('\n---\n')[1]

  expect(data, 'Required source data').toMatchObject({
    trust: 'untrusted-advice',
    documents: [
      { target: 'colors', source: { id: 'colors', revision: 1 }, text: body }
    ]
  })
}

it.each([undefined, 'omit-outcome', 'alter-data'] as const)(
  'detects damaged Knowledge handoff at the real successor consumer: %s',
  async (fault) => {
    const fixture = await createNativeProviderFixture(knowledgeSteps, fault)

    try {
      await requestConfiguredAiActionBatch(
        { actions: [], context: {}, attempt: 1, intent: 'Read color advice.' },
        { environment: fixture.environment, signal: AbortSignal.timeout(45000) }
      )
      const output = fixture.successorOutput('advice')

      if (fault) {
        expect(() => assertKnowledgeConsumer(output)).toThrow(
          fault === 'omit-outcome'
            ? /Required execution acknowledgement/
            : /Required source data/
        )
      } else {
        assertKnowledgeConsumer(output)
      }
    } finally {
      await fixture.dispose()
    }
  },
  60000
)

it.each(['input', 'owner-failure'])(
  'continues Knowledge recovery with recording armed in the same actual native turn: %s',
  async (failureKind) => {
    const original = knowledgeOwner.createLocalKnowledgeTools
    const factory = vi.spyOn(knowledgeOwner, 'createLocalKnowledgeTools')
    let reads = 0

    if (failureKind === 'owner-failure') {
      factory.mockImplementation((...args) => {
        const owner = original(...args)

        return {
          ...owner,

          call: async (...input) => {
            if (input[0] === 'read_knowledge' && reads++ === 0) {
              throw Error('Transient Knowledge owner unavailable')
            }

            return owner.call(...input)
          }
        }
      })
    }

    const fixture = await createNativeProviderFixture([
      knowledgeSteps[0],
      {
        ...knowledgeSteps[1],
        id: 'bad-input',
        call_id: 'bad-input',
        arguments:
          failureKind === 'input'
            ? JSON.stringify({ ids: 17 })
            : knowledgeSteps[1].arguments
      },
      knowledgeSteps[1]
    ])

    const workDeadlineAt = Date.now() + 60000

    writeFileSync(
      join(fixture.directory, 'evaluation-control.json'),
      JSON.stringify({ workDeadlineAt })
    )
    try {
      await requestConfiguredAiActionBatch(
        {
          actions: [],
          context: {},
          attempt: 1,
          intent: 'Read color advice.',
          metadata: {
            evaluationWindow: { workDeadlineAt, reportTimeoutMs: null }
          }
        },
        {
          environment: fixture.environment,
          signal: AbortSignal.timeout(45000)
        }
      )
      const failure = fixture.toolReply('bad-input')

      expect(failure.success).toBe(false)
      const last = failure.contentItems.at(-1)

      if (!last || !('text' in last)) {
        throw Error('Missing failure acknowledgement')
      }

      expect(JSON.parse(last.text)).toMatchObject({
        toolOutcome: {
          status: 'failed',
          settlement: failureKind === 'input' ? 'not-started' : 'unknown'
        }
      })
      expect(fixture.successorOutput('bad-input')).toContain(
        failureKind === 'input'
          ? 'TOOL_INPUT_INVALID'
          : 'Transient Knowledge owner unavailable'
      )
      expect(
        fixture
          .appPackets()
          .filter((packet) => packet.method === 'turn/interrupt')
      ).toHaveLength(0)
      assertKnowledgeConsumer(fixture.successorOutput('advice'))
      expect(fixture.toolCalls()).toHaveLength(2)
      expect(
        fixture
          .appPackets()
          .filter((packet) => packet.method === 'thread/start')
      ).toHaveLength(1)
      expect(
        fixture.appPackets().filter((packet) => packet.method === 'turn/start')
      ).toHaveLength(2)
      const calls = fixture
        .nativePackets()
        .filter((packet) => packet.method === 'item/tool/call')
        .map((packet) => {
          if (
            !isRecord(packet.params) ||
            typeof packet.params.turnId !== 'string'
          ) {
            throw Error('Missing native work turn identity')
          }

          return packet.params.turnId
        })

      expect(calls).toHaveLength(2)
      expect(new Set(calls).size).toBe(1)
    } finally {
      factory.mockRestore()
      await fixture.dispose()
    }
  },
  60000
)

import sharp from 'sharp'
import { createHash } from 'node:crypto'
import * as referenceNetwork from '../reference-image-download'

it.each([undefined, 'omit-image'] as const)(
  'checks all reference images at the real native successor: %s',
  async (fault) => {
    const images = await Promise.all(
      ['#102030', '#abcdef'].map((background) =>
        sharp({ create: { width: 4, height: 3, channels: 3, background } })
          .png()
          .toBuffer()
      )
    )
    const download = vi
      .spyOn(referenceNetwork, 'downloadReferenceImage')
      .mockImplementation(async (url) => {
        const bytes = images[url.endsWith('one.png') ? 0 : 1]

        return new Response(new Uint8Array(bytes), {
          headers: { 'content-type': 'image/png' }
        })
      })
    const fixture = await createNativeProviderFixture(
      [
        {
          type: 'tool_search_call',
          id: 'images-search',
          call_id: 'images-search',
          execution: 'client',
          status: 'completed',
          arguments: { query: 'import_reference_image', limit: 1 }
        },
        {
          type: 'function_call',
          id: 'images',
          call_id: 'images',
          namespace: 'design_references',
          name: 'import_reference_image',
          arguments: JSON.stringify({
            references: [
              {
                sourceUrl: 'https://example.com/one',
                imageUrl: 'https://example.com/one.png'
              },
              {
                sourceUrl: 'https://example.com/two',
                imageUrl: 'https://example.com/two.png'
              }
            ]
          })
        }
      ],
      fault
    )

    try {
      await requestConfiguredAiActionBatch(
        {
          actions: [],
          context: {},
          attempt: 1,
          intent: 'Import the two supplied references.'
        },
        { environment: fixture.environment, signal: AbortSignal.timeout(45000) }
      )
      const appReply = fixture.toolReply('images')

      expect(appReply.success).toBe(true)
      expect(
        appReply.contentItems.filter((item) => item.type === 'inputImage')
      ).toHaveLength(2)
      const content = fixture.successorContent('images')

      if (!Array.isArray(content)) {
        throw Error('Expected native multimodal output')
      }

      const assertImages = () => {
        const delivered = content
          .filter(isRecord)
          .filter((item) => item.type === 'input_image')

        expect(delivered, 'Required selected image count').toHaveLength(2)
        expect(
          delivered.map((item) => {
            if (typeof item.image_url !== 'string') {
              throw Error('Missing image bytes')
            }

            return createHash('sha256')
              .update(Buffer.from(item.image_url.split(',')[1], 'base64'))
              .digest('hex')
          })
        ).toEqual(
          images.map((bytes) =>
            createHash('sha256').update(bytes).digest('hex')
          )
        )
      }

      if (fault) {
        expect(assertImages).toThrow(/Required selected image count/)
      } else {
        assertImages()
      }

      const text = content
        .filter(isRecord)
        .filter((item) => item.type === 'input_text')
        .map((item) => item.text)
        .join('\n')

      expect(text).not.toContain('base64,')
      expect(text).toContain('"toolOutcome"')
      expect(download).toHaveBeenCalledTimes(2)
    } finally {
      download.mockRestore()
      await fixture.dispose()
    }
  },
  60000
)

import * as knowledgeOwner from '../local-knowledge'
import topicInputs from './fixtures/recorded-101/knowledge-topic-selection-20261021.json'
import reuseInputs from './fixtures/recorded-101/knowledge-dependency-reuse-20261024.json'

function successorData(request: Record<string, unknown>, callId: string) {
  const content = nativeSuccessorContent([request], callId)
  let texts: unknown[] = []

  if (typeof content === 'string') {
    texts = [content]
  } else if (Array.isArray(content)) {
    texts = content
      .filter(isRecord)
      .filter((item) => item.type === 'input_text')
      .map((item) => item.text)
  }

  const first = texts[0]

  if (typeof first !== 'string') {
    throw Error('Missing native textual result')
  }

  const value: unknown = JSON.parse(first)

  if (!isRecord(value)) {
    throw Error('Missing structured owner result')
  }

  return value
}

const knowledgeCall = (id: string, input: unknown) => ({
  type: 'function_call',
  id,
  call_id: id,
  namespace: 'design_knowledge',
  name: 'read_knowledge',
  arguments: JSON.stringify(input)
})

it('uses actual native context keys for dependent Knowledge reuse without resending held bodies', async () => {
  let originalKey: unknown
  const fixture = await createNativeProviderFixture([
    knowledgeSteps[0],
    knowledgeCall('first-advice', reuseInputs.reads[0]),
    (request) => {
      const previous = successorData(request, 'first-advice')

      expect(typeof previous.contextKey).toBe('string')
      originalKey = previous.contextKey

      return knowledgeCall('dependent-advice', {
        ...reuseInputs.reads[1],
        reuseFrom: [previous.contextKey]
      })
    }
  ])

  try {
    await requestConfiguredAiActionBatch(
      {
        actions: [],
        context: {},
        attempt: 1,
        intent: 'Read related architectural advice.'
      },
      { environment: fixture.environment, signal: AbortSignal.timeout(45000) }
    )
    const result = successorData(
      fixture.requests.at(-1) ?? {},
      'dependent-advice'
    )

    expect(result.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target: reuseInputs.duplicateTarget,
          retainedFrom: originalKey
        })
      ])
    )
    expect(fixture.toolCalls()).toHaveLength(2)
    expect(fixture.toolReply('dependent-advice').success).toBe(true)
  } finally {
    await fixture.dispose()
  }
}, 60000)

it('delivers all recorded selected topics through real App ownership and native packaging', async () => {
  const fixture = await createNativeProviderFixture([
    knowledgeSteps[0],
    ...topicInputs.cases.map((entry, index) =>
      knowledgeCall('topic-' + index, entry.input)
    )
  ])

  try {
    await requestConfiguredAiActionBatch(
      {
        actions: [],
        context: {},
        attempt: 1,
        intent: 'Read the selected architectural topics.'
      },
      { environment: fixture.environment, signal: AbortSignal.timeout(45000) }
    )
    topicInputs.cases.forEach((entry, index) => {
      const result = successorData(
        fixture.requests[index + 2],
        'topic-' + index
      )

      expect(result.documents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            target: entry.input.ids[0],
            text: expect.any(String)
          })
        ])
      )
      expect(result.contentDelivery).toBeUndefined()
      expect(fixture.toolReply('topic-' + index).success).toBe(true)
    })
    expect(fixture.toolCalls()).toHaveLength(topicInputs.cases.length)
  } finally {
    await fixture.dispose()
  }
}, 60000)

it('follows actual native Knowledge continuation pages without reloading the source', async () => {
  const advice =
    'Preserve every constraint and every recovery condition. '.repeat(800)
  const load = vi.fn(async () => [
    {
      id: 'test.advice',
      revision: 1,
      markdown:
        '---\n{"description":"Bounded delivery fixture","provenance":["Formal source fixture"]}\n---\n' +
        advice
    }
  ])
  const create = knowledgeOwner.createLocalKnowledgeTools
  const admission = vi
    .spyOn(knowledgeOwner, 'createLocalKnowledgeTools')
    .mockImplementation((requestId) => create(requestId, load))
  let assembled = ''
  let pages = 0

  const readNext = (
    request: Record<string, unknown>
  ): Record<string, unknown> | undefined => {
    const result = successorData(request, 'page-' + pages)
    const page = result.contentDelivery

    if (!isRecord(page) || typeof page.text !== 'string') {
      throw Error('Missing content page')
    }

    assembled += page.text
    pages++
    if (page.lastPage === true) {
      return undefined
    }

    if (!isRecord(page.next)) {
      throw Error('Missing actual continuation')
    }

    expect(page.next.tool).toBe('read_knowledge')

    return knowledgeCall('page-' + pages, page.next.arguments)
  }

  const fixture = await createNativeProviderFixture([
    knowledgeSteps[0],
    knowledgeCall('page-0', { ids: ['test.advice'] }),
    ...Array.from({ length: 6 }, () => readNext)
  ])

  try {
    await requestConfiguredAiActionBatch(
      {
        actions: [],
        context: {},
        attempt: 1,
        intent: 'Read the complete source fixture.'
      },
      { environment: fixture.environment, signal: AbortSignal.timeout(45000) }
    )
    expect(pages).toBeGreaterThan(1)
    expect(JSON.parse(assembled).documents[0].text).toBe(advice)
    expect(fixture.toolCalls()).toHaveLength(pages)
    expect(load).toHaveBeenCalledTimes(1)
  } finally {
    admission.mockRestore()
    await fixture.dispose()
  }
}, 60000)

it('releases an unused offline service without claiming a provider invocation occurred', async () => {
  const fixture = await createNativeProviderFixture([])

  expect(fixture.requests).toHaveLength(0)
  await fixture.dispose()
})

it('rehydrates Knowledge after genuine native context compaction', async () => {
  const fixture = await createNativeProviderFixture(
    [
      knowledgeSteps[0],
      knowledgeSteps[1],
      {
        type: 'message',
        id: 'compact-summary',
        role: 'assistant',
        status: 'completed',
        content: [
          {
            type: 'output_text',
            text: 'The earlier color advice is no longer retained. Read it again before using it.',
            annotations: []
          }
        ]
      },
      { ...knowledgeSteps[0], id: 'rediscover', call_id: 'rediscover' },
      () => {
        const block = fixture.toolReply('advice').contentItems[0]

        if (!('text' in block) || typeof block.text !== 'string') {
          throw Error('Missing original Knowledge receipt')
        }

        const original: unknown = JSON.parse(block.text)

        if (!isRecord(original) || typeof original.contextKey !== 'string') {
          throw Error('Missing original Knowledge context identity')
        }

        return knowledgeCall('stale-reuse', {
          ids: ['colors'],
          reuseFrom: [original.contextKey]
        })
      },
      knowledgeCall('rehydrated', { ids: ['colors'], rehydrate: true })
    ],
    undefined,
    undefined,
    { inputTokens: [1, 300000] }
  )

  try {
    await requestConfiguredAiActionBatch(
      {
        actions: [],
        context: {},
        attempt: 1,
        intent:
          'Read color advice and preserve correct context across compaction.'
      },
      { environment: fixture.environment, signal: AbortSignal.timeout(45000) }
    )
    const packets = fixture.nativePackets()
    const completed = packets.filter(
      (packet) =>
        packet.method === 'item/completed' &&
        isRecord(packet.params) &&
        isRecord(packet.params.item) &&
        packet.params.item.type === 'contextCompaction'
    )

    expect(completed).toHaveLength(1)
    expect(fixture.toolReply('stale-reuse').success).toBe(false)
    expect(fixture.successorOutput('stale-reuse')).toContain(
      'TOOL_INPUT_INVALID'
    )
    expect(fixture.successorOutput('stale-reuse')).toContain('not-started')
    assertKnowledgeConsumer(fixture.successorOutput('rehydrated'))
    expect(fixture.toolCalls()).toHaveLength(3)
  } finally {
    await fixture.dispose()
  }
}, 60000)

it.each([false, true])(
  'keeps actual native assessment free of App execution capabilities - attempted call %s',
  async (attemptCall) => {
    const assessment = {
      overall: 'Only supplied execution evidence was assessed.',
      findings: []
    }
    const fixture = await createNativeProviderFixture([
      ...(attemptCall
        ? [
            {
              type: 'function_call',
              id: 'forbidden',
              call_id: 'forbidden',
              namespace: 'design_operations',
              name: 'execute_design',
              arguments: JSON.stringify({ operations: [] })
            }
          ]
        : []),
      {
        type: 'message',
        id: 'assessment',
        role: 'assistant',
        status: 'completed',
        content: [
          {
            type: 'output_text',
            text: JSON.stringify(assessment),
            annotations: []
          }
        ]
      }
    ])

    try {
      const result = await requestLocalAiAssessment(
        { sourceRequestId: 'offline-observation', calls: [] },
        {
          model: fixture.environment.AI_PROVIDER_MODEL,
          executable: fixture.environment.AI_PROVIDER_EXECUTABLE,
          toolLibraryDirectory: fixture.environment.AI_TOOL_LIBRARY_DIR,
          signal: AbortSignal.timeout(45000)
        }
      )
      const start = fixture
        .appPackets()
        .find((entry) => entry.method === 'thread/start')

      if (!start || !isRecord(start.params)) {
        throw Error('Missing actual assessment request')
      }

      expect(start.params.dynamicTools).toEqual([])
      expect(fixture.requests[0].instructions).toBe(
        start.params.baseInstructions
      )
      expect(fixture.requests[0].instructions).toContain('untrusted evidence')
      const actualTools = fixture.requests[0].tools

      if (!Array.isArray(actualTools)) {
        throw Error('Missing actual assessment capability declarations')
      }

      expect(
        actualTools
          .filter(isRecord)
          .filter(
            (tool) =>
              typeof tool.name === 'string' &&
              /^(design_|tool_library|image_analysis)/.test(tool.name)
          )
      ).toEqual([])
      expect(fixture.toolCalls()).toHaveLength(0)
      expect(result.value).toEqual(assessment)
      if (attemptCall) {
        expect(fixture.successorOutput('forbidden')).toContain(
          'unsupported call'
        )
      }
    } finally {
      await fixture.dispose()
    }
  },
  60000
)

it.each([false, true])(
  'ordinary native requests without a browser executor keep Knowledge available and cannot dispatch drawing - attempted call %s',
  async (attemptCall) => {
    const fixture = await createNativeProviderFixture([
      {
        type: 'tool_search_call',
        id: 'find-advice',
        call_id: 'find-advice',
        execution: 'client',
        status: 'completed',
        arguments: { query: 'design_knowledge.read_knowledge', limit: 1 }
      },
      {
        type: 'function_call',
        id: 'read-advice',
        call_id: 'read-advice',
        namespace: 'design_knowledge',
        name: 'read_knowledge',
        arguments: JSON.stringify({ ids: ['colors'] })
      },
      ...(attemptCall
        ? [
            {
              type: 'function_call',
              id: 'unavailable-drawing',
              call_id: 'unavailable-drawing',
              namespace: 'design_workflow',
              name: 'prepare_and_apply_design',
              arguments: JSON.stringify({
                draft: {
                  type: 'group',
                  name: 'Unavailable drawing',
                  children: [
                    {
                      type: 'rect',
                      key: 'square',
                      name: 'Square',
                      width: 10,
                      height: 10
                    }
                  ]
                },
                inspection: 'defer'
              })
            }
          ]
        : [])
    ])

    try {
      await requestConfiguredAiActionBatch(
        {
          actions: [],
          context: {},
          attempt: 1,
          intent: 'Read advice with no canvas executor.'
        },
        { environment: fixture.environment, signal: AbortSignal.timeout(45000) }
      )
      const start = fixture
        .appPackets()
        .find((entry) => entry.method === 'thread/start')

      if (
        !start ||
        !isRecord(start.params) ||
        !Array.isArray(start.params.dynamicTools)
      ) {
        throw new Error('Missing native registration')
      }

      const names = start.params.dynamicTools
        .filter(isRecord)
        .flatMap((group) =>
          Array.isArray(group.tools)
            ? group.tools.filter(isRecord).map((tool) => tool.name)
            : []
        )

      expect(names).not.toContain('inspect_drawing')
      expect(names).not.toContain('prepare_and_apply_design')
      expect(fixture.toolCalls()).toHaveLength(1)
      assertKnowledgeConsumer(fixture.successorOutput('read-advice'))
      expect(fixture.toolReply('read-advice').success).toBe(true)
      expect(fixture.requests).toHaveLength(attemptCall ? 4 : 3)
    } finally {
      await fixture.dispose()
    }
  },
  60000
)

it('native Knowledge remains usable when durable library loading fails and the model receives that limitation', async () => {
  const fixture = await createNativeProviderFixture([
    {
      type: 'tool_search_call',
      id: 'find-advice',
      call_id: 'find-advice',
      execution: 'client',
      status: 'completed',
      arguments: { query: 'design_knowledge.read_knowledge', limit: 1 }
    },
    {
      type: 'function_call',
      id: 'read-advice',
      call_id: 'read-advice',
      namespace: 'design_knowledge',
      name: 'read_knowledge',
      arguments: JSON.stringify({ ids: ['colors'] })
    }
  ])

  try {
    const { writeFile } = await import('node:fs/promises')
    const { join } = await import('node:path')
    const unavailable = join(fixture.directory, 'unavailable-library')

    await writeFile(
      unavailable,
      'A file cannot be used as a tool library directory.'
    )
    await requestConfiguredAiActionBatch(
      {
        actions: [],
        context: {},
        attempt: 1,
        intent: 'Read advice while saved tools are unavailable.'
      },
      {
        environment: {
          ...fixture.environment,
          AI_TOOL_LIBRARY_DIR: unavailable
        },
        signal: AbortSignal.timeout(45000)
      }
    )
    const start = fixture
      .appPackets()
      .find((entry) => entry.method === 'thread/start')

    if (!start || !isRecord(start.params)) {
      throw new Error('Missing native registration')
    }

    expect(start.params.developerInstructions).toContain(
      'Saved tools could not be loaded'
    )
    expect(JSON.stringify(fixture.requests[0].input)).toContain(
      'Saved tools could not be loaded'
    )
    expect(fixture.requests[0].instructions).toBe(start.params.baseInstructions)
    assertKnowledgeConsumer(fixture.successorOutput('read-advice'))
    expect(fixture.toolReply('read-advice').success).toBe(true)
    expect(fixture.toolCalls()).toHaveLength(1)
  } finally {
    await fixture.dispose()
  }
}, 60000)

it('delivers bindable common-API read values to the actual native successor', async () => {
  const fixture = await createNativeProviderFixture([
    {
      type: 'tool_search_call',
      id: 'read-tool',
      call_id: 'read-tool',
      execution: 'client',
      status: 'completed',
      arguments: { query: 'read_design_contracts', limit: 1 }
    },
    {
      type: 'function_call',
      id: 'read-shape',
      call_id: 'read-shape',
      namespace: 'design_operations',
      name: 'read_design_contracts',
      arguments: JSON.stringify({
        names: ['api_fill_getFillTargetsAtIndex'],
        view: 'full'
      })
    }
  ])

  try {
    vi.stubGlobal('window', {})
    const { createBasicApiActions } =
      await import('../../src/ai/basic-api-actions')
    const { createAiToolContract } = await import('@asyra/ai-agent-runtime')

    await requestConfiguredAiActionBatch(
      {
        actions: createBasicApiActions().map(createAiToolContract),
        context: {},
        attempt: 1,
        intent: 'Inspect the fill target output before composing removal.'
      },
      {
        environment: fixture.environment,
        signal: AbortSignal.timeout(45000),

        executeBatch: async () => {
          throw Error('Contract lookup must not dispatch')
        }
      }
    )
    const received = successorData(fixture.requests.at(-1) ?? {}, 'read-shape')

    if (!Array.isArray(received.apis) || !isRecord(received.apis[0])) {
      throw Error('Missing API contract')
    }

    const output = received.apis[0].outputSchema

    if (!isRecord(output) || !isRecord(output.properties)) {
      throw Error('Missing output properties')
    }

    const schema = output.properties.value

    expect(schema).toMatchObject({
      type: 'array',
      items: {
        required: ['elementId', 'fillId'],
        properties: {
          elementId: { type: 'string' },
          fillId: { type: 'string' }
        }
      }
    })
    expect(
      operationInputIssue([{ elementId: 'a', fillId: 'paint' }], schema)
    ).toBeUndefined()
    for (const invalid of [
      null,
      {},
      [{ elementId: 'a' }],
      [{ elementId: 7, fillId: 'paint' }]
    ]) {
      expect(operationInputIssue(invalid, schema)).toBeDefined()
    }

    expect(fixture.toolCalls()).toHaveLength(1)
  } finally {
    vi.unstubAllGlobals()
    await fixture.dispose()
  }
}, 60000)

it('preserves large selected saved data and outcome in actual native history', async () => {
  const context = createConversationResults(() => 1).open(
    'native-large-selection'
  )
  const snapshot = Array.from({ length: 1800 }, (_, index) => ({
    id: `element-${index}`,
    source: `completed-operation-${index}`,
    description: 'Saved authored geometry available for a later decision'
  }))

  context.exchange({ save: { snapshot } })
  const fixture = await createNativeProviderFixture([
    {
      type: 'function_call',
      id: 'selected-snapshot',
      call_id: 'selected-snapshot',
      namespace: 'design_operations',
      name: 'execute_design',
      arguments: JSON.stringify({
        delivery: { fields: { snapshot: { name: 'snapshot', path: '' } } }
      })
    }
  ])

  try {
    await requestConfiguredAiActionBatch(
      {
        actions: [],
        context: {},
        attempt: 1,
        intent: 'Read the saved snapshot.',
        metadata: { conversationId: 'native-large-selection' }
      },
      {
        environment: fixture.environment,
        signal: AbortSignal.timeout(45000),

        resultContext: async (command) => context.exchange(command)
      }
    )
    const reply = fixture.toolReply('selected-snapshot')
    const text = reply.contentItems.map((item) => {
      if (item.type !== 'inputText' || !('text' in item)) {
        throw Error('Expected a native text item')
      }

      return item.text
    })

    expect(reply.success).toBe(true)
    expect(text).toHaveLength(2)
    expect(JSON.parse(text[0]).fields.snapshot).toEqual(snapshot)
    expect(fixture.successorContent('selected-snapshot')).toEqual(
      text.map((text) => ({ type: 'input_text', text }))
    )
    expect(JSON.parse(text[1]).toolOutcome).toEqual({
      status: 'success',
      settlement: 'completed',
      issues: []
    })
  } finally {
    await fixture.dispose()
  }
}, 60000)

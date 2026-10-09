import { requireBatchSuccess } from '../batch-exchange'
import { expect, it, vi } from 'vitest'
import {
  invokeLocalTool,
  LocalToolInputError,
  observeLocalToolExecution
} from '../local-tool-invocation'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalImageTools } from '../local-image-tools'
import { createLocalReferenceTools } from '../local-reference-tools'
import { createLocalOperationTools } from '../local-operation-tools'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { AiActionNames } from '../../src/constants/ai-actions'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'

const signal = () => new AbortController().signal
const definition = {
  name: 'registered-operation',
  inputSchema: { type: 'object', additionalProperties: false }
}

it('preflights every advertised App tool family before its owner executes', async () => {
  const actions = [
    ...Object.values(AiActionNames).map((name) => ({
      name,
      description: name,
      inputSchema: { type: 'object' }
    })),
    ...basicApiContracts
  ]
  const designs = createLocalDesignTools(actions)
  const images = createLocalImageTools({})
  const operations = createLocalOperationTools(
    actions,
    {
      modelActions: (input) => designs.modelActions(images.modelActions(input)),
      resolveBatch: (input) => designs.resolveBatch(images.resolveBatch(input)),
      resolveTargets: designs.resolveTargets
    },
    vi.fn()
  )
  const owners = [
    designs,
    images,
    operations,
    createLocalReferenceTools(images.addReference),
    createLocalDesignWorkflow(designs, operations)
  ]
  for (const owner of owners) {
    const call = vi.spyOn(owner, 'call')
    for (const tool of owner.definitions) {
      const reply = await invokeLocalTool(owner, tool, null, signal())
      expect(reply.success, tool.name).toBe(false)
      expect(JSON.parse(reply.text), tool.name).toMatchObject({
        recoverable: true,
        code: 'PREPARATION_REJECTED'
      })
    }
    expect(call).not.toHaveBeenCalled()
    // Isolate the post-admission boundary for every actual registered route.
    call.mockRejectedValue(new Error('Owner execution failed'))
    for (const tool of owner.definitions) {
      const reply = await invokeLocalTool(
        owner,
        { ...tool, inputSchema: {} },
        {},
        signal()
      )
      expect(reply.success, tool.name).toBe(false)
      expect(JSON.parse(reply.text), tool.name).toMatchObject({
        code: 'TOOL_EXECUTION_FAILED',
        stage: 'execution',
        settlement: 'unknown'
      })
    }
    expect(call).toHaveBeenCalledTimes(owner.definitions.length)
    call.mockRestore()
  }
})

it('rejects extra fields without guessing aliases and allows a corrected call', async () => {
  const call = vi.fn(async () =>
    JSON.stringify({ available: true, artifactId: 'prepared' })
  )
  const owner = { call }
  expect(
    (
      await invokeLocalTool(
        owner,
        definition,
        { sourceUrl: 'not-a-source-list' },
        signal()
      )
    ).success
  ).toBe(false)
  expect(call).not.toHaveBeenCalled()
  expect((await invokeLocalTool(owner, definition, {}, signal())).success).toBe(
    true
  )
  expect(call).toHaveBeenCalledOnce()
})

it.each([
  [{ available: false, message: 'Source failed' }, false, 'unavailable'],
  [
    { available: true, applicable: false, findings: ['overflow'] },
    false,
    'unavailable'
  ],
  [{ accepted: false, checks: [{ status: 'fail' }] }, true, 'usable'],
  [{ status: 'partial', skipped: ['locked'] }, false, 'partial'],
  [{ available: true, complete: false }, false, 'partial'],
  [{ available: true, partial: true, imageScope: 'region' }, true, 'usable'],
  [{ actionResults: [{ result: { status: 'partial' } }] }, false, 'partial'],
  [
    {
      actionResults: [{ result: { available: false } }],
      batchSummary: {
        acknowledgedActions: [{ actionName: 'update', count: 2 }]
      }
    },
    false,
    'partial'
  ],
  [
    {
      actionResults: [
        { result: { status: 'complete' } },
        { actionName: 'inspect', result: { available: false } }
      ]
    },
    false,
    'partial'
  ]
])(
  'classifies result usability without claiming visual success: %j',
  async (result, success, status) => {
    const reply = await invokeLocalTool(
      { call: async () => JSON.stringify(result) },
      definition,
      {},
      signal()
    )
    expect(reply.success).toBe(success)
    expect(JSON.parse(reply.text)).toMatchObject({
      ...result,
      toolOutcome: { status }
    })
  }
)

it('returns all owner exceptions without retrying uncertain mutations', async () => {
  const call = vi.fn(async () => {
    throw new Error('Unknown artifact')
  })
  const reply = await invokeLocalTool({ call }, definition, {}, signal())
  expect(JSON.parse(reply.text)).toMatchObject({
    recoverable: true,
    message: expect.stringContaining('Unknown artifact')
  })
  expect(call).toHaveBeenCalledOnce()
  expect(
    (await invokeLocalTool({ call }, definition, {}, signal())).success
  ).toBe(false)
  expect(call).toHaveBeenCalledTimes(2)
})

it('keeps explicit pre-dispatch rejections recoverable without a blanket mutation policy', async () => {
  const reply = await invokeLocalTool(
    {
      call: async () => {
        throw new LocalToolInputError('Target not admitted')
      }
    },
    definition,
    {},
    signal()
  )
  expect(JSON.parse(reply.text)).toMatchObject({
    code: 'PREPARATION_REJECTED',
    recoverable: true
  })
})

it('preserves cancellation but returns broken output serialization', async () => {
  const controller = new AbortController()
  const call = vi.fn(async () => {
    controller.abort()
    throw new Error('cancelled work')
  })
  await expect(
    invokeLocalTool({ call }, definition, {}, controller.signal)
  ).rejects.toThrow()
  expect(
    (
      await invokeLocalTool(
        { call: async () => 'not JSON' },
        definition,
        {},
        signal()
      )
    ).success
  ).toBe(false)
})

it('returns malformed preparation output as a tool failure without ending the request', async () => {
  const reply = await invokeLocalTool(
    {
      call: async () => 'invalid JSON'
    },
    definition,
    {},
    signal()
  )
  expect(JSON.parse(reply.text)).toMatchObject({
    recoverable: true,
    code: 'TOOL_RESULT_INVALID'
  })
})

it('contains schema explanation failures at the same boundary', async () => {
  const call = vi.fn()
  const reply = await invokeLocalTool(
    {
      call,
      explainInputIssue: () => {
        throw new Error('Explanation failed')
      }
    },
    definition,
    null,
    signal()
  )
  expect(reply.success).toBe(false)
  expect(JSON.parse(reply.text)).toMatchObject({
    stage: 'admission',
    settlement: 'not-started'
  })
  expect(call).not.toHaveBeenCalled()
})

it('returns canonical failure evidence and completed actions without replay', async () => {
  const receipt = {
    context: { count: 1, token: 'private-value' },
    actionResults: [
      { actionId: 'first', actionName: 'edit', result: { id: 'created-id' } }
    ],
    failure: {
      code: 'AI_EXECUTION_FAILED',
      message: 'Target is locked',
      stage: 'execution',
      actionName: 'edit',
      actionId: 'second',
      actionExecutionMs: 3,
      settlement: 'unknown' as const,
      contextFresh: true
    }
  }
  const call = vi.fn(async () => {
    requireBatchSuccess({ batchId: 'partial', actions: [] }, receipt, 10)
    throw new Error('Must not continue the compound operation')
  })
  const reply = await invokeLocalTool(
    { call },
    definition,
    {},
    signal(),
    () => ({ batches: [receipt] })
  )
  expect(JSON.parse(reply.text)).toMatchObject({
    code: 'AI_EXECUTION_FAILED',
    settlement: 'unknown',
    message: 'Target is locked',
    toolOutcome: { status: 'partial' },
    executionResult: {
      batches: [
        { actionResults: [{ actionId: 'first', result: { id: 'created-id' } }] }
      ]
    }
  })
  expect(reply.text).not.toContain('private-value')
  expect(call).toHaveBeenCalledOnce()
})

it('does not describe a later compound-input failure as zero prior execution', async () => {
  const executionResult = {
    batches: [
      { actionResults: [{ actionId: 'created', result: { id: 'shape' } }] }
    ]
  }
  const reply = await invokeLocalTool(
    {
      call: async () => {
        throw new LocalToolInputError('Inspection target rejected')
      }
    },
    definition,
    {},
    signal(),
    () => executionResult
  )
  expect(JSON.parse(reply.text)).toMatchObject({
    stage: 'admission',
    settlement: 'unknown',
    executionResult
  })
})

it('observes internal input/output once, links the parent and isolates recorder failure', async () => {
  const trace = vi.fn()
  const execute = vi.fn(async () =>
    JSON.stringify({ available: true, artifactId: 'kept' })
  )
  const args = { target: 'prepared', fields: { x: 12 } }
  const result = await observeLocalToolExecution(
    'prepare_design',
    args,
    execute,
    { parentCallId: () => 'native-parent', trace }
  )
  expect(execute).toHaveBeenCalledOnce()
  expect(trace).toHaveBeenCalledTimes(2)
  const start = trace.mock.calls[0][1]
  expect(start).toMatchObject({
    parentCallId: 'native-parent',
    arguments: args,
    actor: 'app-server',
    executor: 'app-server',
    timingScope: 'owner-handoff'
  })
  expect(trace.mock.calls[1][1]).toMatchObject({
    callId: start.callId,
    result: JSON.parse(result),
    executionMs: expect.any(Number)
  })
  expect(
    await observeLocalToolExecution('prepare_design', args, execute, {
      trace: () => {
        throw new Error('Recorder unavailable')
      }
    })
  ).toBe(result)
})

it('keeps parent-context observation failure outside canonical execution', async () => {
  const execute = vi.fn(async () => '{"available":true}')
  await expect(
    observeLocalToolExecution('read', {}, execute, {
      parentCallId: () => {
        throw new Error('Context observer unavailable')
      }
    })
  ).resolves.toBe('{"available":true}')
  expect(execute).toHaveBeenCalledOnce()
})

it('records unusable internal output without changing the returned value or leaving the call open', async () => {
  const trace = vi.fn()
  await expect(
    observeLocalToolExecution('read', {}, async () => 'invalid-json', { trace })
  ).resolves.toBe('invalid-json')
  expect(trace).toHaveBeenCalledTimes(2)
  expect(trace.mock.calls[1]).toEqual([
    'action_completed',
    expect.objectContaining({
      result: 'invalid-json',
      code: 'RESULT_DECODING_FAILED'
    })
  ])
})

import { createLocalKnowledgeTools } from '../local-knowledge'
import { toolSemantics } from '../../src/ai/tool-contract'
import {
  createAiToolContract,
  inspectAiToolResult,
  admitAiRecipe
} from '@asyra/ai-agent-runtime'
import { operationContractIssue } from '../operation-input-schema'
import { requireBatchSuccess } from '../batch-exchange'
import { expect, it, vi } from 'vitest'
import {
  localToolOutcome,
  localToolFailureReply,
  localToolResultSchema,
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
import { AiDesignToolIds } from '../../src/constants/ai-design'
import { AiImageToolIds, AiReferenceToolIds } from '../ai-domain-prompt'
import { createLocalToolLibraryTools } from '../local-tool-library-tools'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'

const signal = () => new AbortController().signal
const definition = {
  ...toolSemantics({ type: 'object' }, 'prepare', ['request-artifacts']),
  description: 'Prepare test data',
  name: 'registered-operation',
  inputSchema: { type: 'object', additionalProperties: false }
}

it('uses the owner outcome once and avoids failure diagnostics for successful domain results', async () => {
  const resultOutcome = vi.fn(() => ({
    status: 'success' as const,
    settlement: 'completed' as const
  }))
  const executionEvidence = vi.fn()
  const reply = await invokeLocalTool(
    {
      call: async () => JSON.stringify({ status: 'unknown', available: false }),
      resultOutcome
    },
    definition,
    {},
    signal(),
    executionEvidence
  )
  expect(reply.success).toBe(true)
  expect(resultOutcome).toHaveBeenCalledOnce()
  expect(executionEvidence).not.toHaveBeenCalled()
})

it('reuses validation only for the exact unchanged invocation reply', async () => {
  const reply = await invokeLocalTool(
    { call: async () => JSON.stringify({ ready: true }) },
    definition,
    {},
    signal()
  )
  expect(localToolResultSchema(reply)).toEqual(definition.outputSchema)
  expect(localToolResultSchema({ ...reply })).toBeUndefined()
  reply.text = JSON.stringify({ ready: false })
  expect(localToolResultSchema(reply)).toBeUndefined()
})

it('preserves an unknown child result and settlement through the native wrapper', async () => {
  const result = {
    actionResults: [
      {
        actionId: 'one',
        actionName: 'edit',
        result: {
          status: 'unknown',
          toolOutcome: { status: 'unknown', settlement: 'unknown' }
        }
      }
    ],
    batchSummary: { acknowledgedActions: [{ actionName: 'edit', count: 1 }] }
  }
  const call = vi.fn(async () => JSON.stringify(result))
  const reply = await invokeLocalTool({ call }, definition, {}, signal())
  expect(JSON.parse(reply.text)).toMatchObject({
    ...result,
    toolOutcome: { status: 'unknown', settlement: 'unknown' }
  })
  expect(reply.success).toBe(false)
  expect(call).toHaveBeenCalledOnce()
})

it('retains owner evidence when optional execution observation throws', async () => {
  const result = {
    settlement: 'completed',
    actionResults: [
      { actionId: 'one', actionName: 'edit', result: { status: 'complete' } }
    ]
  }
  const call = vi.fn(async () => JSON.stringify(result))
  const reply = await invokeLocalTool(
    { call, resultIssue: () => 'Required output identity is missing' },
    definition,
    {},
    signal(),
    () => {
      throw new Error('Observer unavailable')
    }
  )
  expect(JSON.parse(reply.text)).toMatchObject({
    code: 'TOOL_RESULT_INVALID',
    settlement: 'completed',
    executionResult: result
  })
  expect(call).toHaveBeenCalledOnce()
})

it('does not let successful child receipts erase incomplete parent settlement', () => {
  expect(
    localToolOutcome({
      status: 'partial',
      actionResults: [{ result: { status: 'complete' } }]
    })
  ).toMatchObject({ status: 'partial', settlement: 'partial' })
})

it('does not treat obsolete aggregate counts as owner evidence', () => {
  expect(
    localToolOutcome({
      batchSummary: { acknowledgedActions: [{ actionName: 'edit', count: 1 }] },
      actionResults: [
        { result: { status: 'failed', settlement: 'not-started' } }
      ]
    })
  ).toMatchObject({ status: 'failed', settlement: 'not-started' })
})

it.each(
  (['success', 'partial', 'failed', 'unknown'] as const).flatMap((status) =>
    (['not-started', 'completed', 'partial', 'unknown'] as const).map(
      (settlement) => ({ status, settlement })
    )
  )
)(
  'preserves a single normalized child $status/$settlement independently',
  (outcome) => {
    expect(
      localToolOutcome({
        actionResults: [{ result: { toolOutcome: outcome } }]
      })
    ).toMatchObject(outcome)
  }
)

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
      ...designs,
      modelActions: (input) => designs.modelActions(images.modelActions(input)),
      resolveBatch: (input) => designs.resolveBatch(images.resolveBatch(input)),
      resolveTargets: designs.resolveTargets
    },
    vi.fn(),
    {
      referenceImages: images.referenceImages,
      validateReferences: images.validateReferences
    }
  )
  expect(
    operations.definitions.find(
      (tool) => tool.name === AiActionNames.READ_DESIGN_CONTEXT
    )
  ).toMatchObject({ effect: 'read', resources: ['document'] })
  expect(
    operations.definitions.find(
      (tool) => tool.name === AiActionNames.SELECT_ELEMENTS
    )
  ).toMatchObject({ effect: 'mutation', resources: ['selection'] })
  expect(designs.definitions[0].lifecycle.output).toBe('request-artifact')
  const owners = [
    createLocalKnowledgeTools('preflight'),
    designs,
    images,
    operations,
    createLocalReferenceTools(images.addReference),
    createLocalDesignWorkflow(designs, operations),
    createLocalToolLibraryTools(
      () => {
        throw new Error('Rejected controls must not resolve the library')
      },
      () => ({})
    )
  ]
  const browserNames = new Set(actions.map((action) => action.name))
  const nativeNames = new Set(
    owners
      .flatMap((owner) => owner.definitions.map((tool) => tool.name))
      .filter((name) => !browserNames.has(name))
  )
  expect([...nativeNames].sort()).toEqual(
    [
      ...Object.values(AiDesignToolIds),
      ...Object.values(AiImageToolIds),
      AiReferenceToolIds.IMPORT_REFERENCE_IMAGE
    ].sort()
  )
  for (const owner of owners) {
    const call = vi.spyOn(
      owner,
      'callInternal' in owner ? 'callInternal' : 'call'
    )
    for (const tool of owner.definitions) {
      expect(() => createAiToolContract(tool), tool.name).not.toThrow()
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
  [{ available: false, message: 'Source failed' }, false, 'failed'],
  [
    { available: true, applicable: false, findings: ['overflow'] },
    false,
    'failed'
  ],
  [{ accepted: false, checks: [{ status: 'fail' }] }, true, 'success'],
  [{ status: 'partial', skipped: ['locked'] }, false, 'partial'],
  [{ available: true, complete: false }, false, 'partial'],
  [{ available: true, partial: true, imageScope: 'region' }, true, 'success'],
  [{ actionResults: [{ result: { status: 'partial' } }] }, false, 'partial'],
  [
    {
      actionResults: [
        { result: { status: 'complete' } },
        { result: { available: false } }
      ]
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

it('retains a rejected draft at public admission and repairs only the incorrect field', async () => {
  const designs = createLocalDesignTools([
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply',
      inputSchema: {}
    }
  ])
  const definition = designs.definitions[0]
  const invalid = {
    type: 'group',
    name: 'Building',
    children: [
      { type: 'rect', key: 'wall', name: 'Wall', width: -1, height: 10 }
    ]
  }
  const call = vi.spyOn(designs, 'call')
  const failed = JSON.parse(
    (await invokeLocalTool(designs, definition, { draft: invalid }, signal()))
      .text
  )
  expect(failed).toMatchObject({
    available: false,
    settlement: 'not-started',
    draftId: expect.any(String)
  })
  expect(call).not.toHaveBeenCalled()
  const fixed = await invokeLocalTool(
    designs,
    definition,
    {
      repair: {
        draftId: failed.draftId,
        replacements: [{ path: '/children/0/width', value: 10 }]
      }
    },
    signal()
  )
  expect(fixed.success).toBe(true)
  expect(JSON.parse(fixed.text)).toMatchObject({
    artifactId: expect.any(String),
    elementCount: 2,
    preparationInput: {
      kind: 'retained-repair',
      draftId: failed.draftId,
      revision: failed.draftId,
      replacementCount: 1,
      sourceBytes: expect.any(Number)
    }
  })
})

it('rejects a claimed preparation success without its required artifact identity', async () => {
  const designs = createLocalDesignTools([
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply',
      inputSchema: {}
    }
  ])
  vi.spyOn(designs, 'call').mockResolvedValue(
    JSON.stringify({ available: true })
  )
  const result = await invokeLocalTool(
    designs,
    designs.definitions[0],
    { draft: { type: 'group', name: 'Building' } },
    signal()
  )
  expect(result.success).toBe(false)
  expect(JSON.parse(result.text)).toMatchObject({
    code: 'TOOL_RESULT_INVALID',
    stage: 'decoding',
    settlement: 'unknown'
  })
})

it('rejects missing retained identities at each preparation, image and workflow output boundary', async () => {
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
  const operations = createLocalOperationTools(actions, designs, vi.fn())
  const owners = [
    images,
    operations,
    createLocalReferenceTools(images.addReference),
    createLocalDesignWorkflow(designs, operations)
  ]
  for (const owner of owners) {
    const call = vi
      .spyOn(owner, 'callInternal' in owner ? 'callInternal' : 'call')
      .mockResolvedValue(
        JSON.stringify({ available: true, status: 'complete' })
      )
    for (const tool of owner.definitions) {
      const reply = await invokeLocalTool(
        owner,
        { ...tool, inputSchema: {} },
        {},
        signal()
      )
      expect(JSON.parse(reply.text), tool.name).toMatchObject({
        code: 'TOOL_RESULT_INVALID',
        settlement: 'unknown'
      })
      expect(reply.success, tool.name).toBe(false)
    }
    call.mockRestore()
  }
})

it('distinguishes usable discovery pages from incomplete mutations through public admission', async () => {
  const designs = createLocalDesignTools(basicApiContracts)
  const operations = createLocalOperationTools(
    basicApiContracts,
    designs,
    vi.fn()
  )
  const tool = operations.definitions.find(
    (entry) => entry.name === 'describe_design_apis'
  )
  if (!tool) throw new Error('Discovery tool is not registered')
  const first = await invokeLocalTool(
    operations,
    tool,
    { category: 'fill' },
    signal()
  )
  expect(first.success).toBe(true)
  const page = JSON.parse(first.text)
  expect(page).toMatchObject({
    complete: false,
    toolOutcome: { status: 'success' }
  })
  expect(page.next.arguments.offset).toBe(page.apis.length)
  const next = await invokeLocalTool(
    operations,
    tool,
    page.next.arguments,
    signal()
  )
  expect(next.success).toBe(true)
  expect(JSON.parse(next.text).complete).toBe(true)
  const call = vi
    .spyOn(operations, 'callInternal')
    .mockResolvedValue(JSON.stringify({ ...page, next: undefined }))
  expect(
    JSON.parse(
      (await invokeLocalTool(operations, tool, { category: 'fill' }, signal()))
        .text
    ).code
  ).toBe('TOOL_RESULT_INVALID')
  call.mockRestore()
})

it.each([undefined, () => ({ batches: [] })])(
  'preserves acknowledged output when its owner rejects the rest of that output contract with observer %s',
  async (executionEvidence) => {
    const receipt = {
      actionResults: [
        {
          actionId: 'one',
          actionName: 'mutation',
          result: { status: 'complete', value: null }
        }
      ]
    }
    const owner = {
      call: async () => JSON.stringify(receipt),
      resultIssue: () => 'Missing successor identity'
    }
    const reply = JSON.parse(
      (
        await invokeLocalTool(
          owner,
          definition,
          {},
          signal(),
          executionEvidence
        )
      ).text
    )
    expect(reply).toMatchObject({
      code: 'TOOL_RESULT_INVALID',
      settlement: 'unknown',
      executionResult: receipt,
      toolOutcome: { status: 'partial' }
    })
  }
)

it('validates the declared native output schema even when the owner forgot a result callback', async () => {
  const call = vi.fn(async () => JSON.stringify({ wrong: true }))
  const reply = await invokeLocalTool(
    { call },
    {
      ...definition,
      description: 'Prepare a retained artifact',
      revision: 1,
      outputSchema: {
        type: 'object',
        required: ['artifactId'],
        properties: { artifactId: { type: 'string' } }
      },
      effect: 'prepare',
      resources: ['request-artifacts'],
      lifecycle: {
        cancellation: 'cooperative',
        retry: 'never',
        output: 'request-artifact'
      }
    },
    {},
    signal()
  )
  expect(reply.success).toBe(false)
  expect(JSON.parse(reply.text)).toMatchObject({
    code: 'TOOL_RESULT_INVALID',
    message: 'output.artifactId: required field is missing',
    stage: 'decoding',
    settlement: 'unknown',
    executionResult: { wrong: true }
  })
  expect(call).toHaveBeenCalledOnce()
})

it.each(['not-started', 'completed', 'partial', 'unknown'] as const)(
  'preserves explicit failure settlement across native and browser adapters: %s',
  async (settlement) => {
    const { designActionOutcome } = await import('../../src/ai/tool-contract')
    const receipt = {
      status: 'failed',
      settlement,
      message: 'Owner rejected output'
    }
    expect(localToolOutcome(receipt)).toMatchObject({
      status: 'failed',
      settlement
    })
    expect(designActionOutcome(receipt)).toEqual({
      status: 'failed',
      settlement
    })
  }
)
it('keeps an uncertain native receipt unknown instead of claiming failure', () => {
  expect(localToolOutcome({ status: 'unknown' })).toMatchObject({
    status: 'unknown',
    settlement: 'unknown'
  })
})

it.each([false, true])(
  'preserves explicit owner settlement after result rejection, semantic=%s',
  async (semantic) => {
    const value = { status: 'partial', settlement: 'partial', changed: 2 }
    const call = vi.fn(async () => JSON.stringify(value))
    const reply = await invokeLocalTool(
      {
        call,
        ...(semantic
          ? { resultIssue: () => 'Missing required receipt field' }
          : {})
      },
      {
        ...definition,
        ...toolSemantics(
          { type: 'object', required: ['requiredReceipt'] },
          'prepare',
          ['request-artifacts']
        )
      },
      {},
      signal()
    )
    expect(JSON.parse(reply.text)).toMatchObject({
      code: 'TOOL_RESULT_INVALID',
      settlement: 'partial',
      toolOutcome: { settlement: 'partial' },
      executionResult: value
    })
    expect(call).toHaveBeenCalledOnce()
  }
)

it('exposes only successful domain fields to recipe proof and keeps partial evidence separate', () => {
  const schema = {
    type: 'object',
    properties: { count: { type: 'integer' } },
    required: ['count'],
    additionalProperties: true
  }
  const contract = createAiToolContract({
    ...definition,
    ...toolSemantics(schema, 'mutation', ['document']),
    composition: 'allowed'
  })
  expect(contract.outputSchema).toEqual(schema)
  const interrupted = {
    available: false,
    recoverable: true,
    code: 'INTERRUPTED',
    message: 'Stopped after one write',
    settlement: 'partial',
    executionResult: { actionResults: [{}] }
  }
  expect(
    inspectAiToolResult(contract, interrupted, {
      outcome: { status: 'partial', settlement: 'partial' },
      validate: operationContractIssue
    }).status
  ).toBe('partial')
  expect(
    inspectAiToolResult(
      contract,
      { count: 1, status: 'partial' },
      {
        outcome: { status: 'partial', settlement: 'partial' },
        validate: operationContractIssue
      }
    ).status
  ).toBe('partial')
  expect(
    inspectAiToolResult(contract, interrupted, {
      outcome: { status: 'success', settlement: 'completed' },
      validate: operationContractIssue
    })
  ).toMatchObject({ status: 'invalid', settlement: 'completed' })
  const admitted = admitAiRecipe(
    {
      format: 1,
      name: 'count-result',
      revision: 1,
      description: 'Return the count from the registered result.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false
      },
      outputSchema: { type: 'integer' },
      steps: [
        {
          id: 'write',
          tool: contract.name,
          revision: contract.revision,
          input: { kind: 'object', fields: {} }
        }
      ],
      output: { kind: 'step', step: 'write', path: '/count' }
    },
    {
      resolve: () => contract,
      validate: operationContractIssue,
      limits: {
        bytes: 10000,
        steps: 4,
        bindings: 20,
        bindingDepth: 8,
        issues: 4
      }
    }
  )
  expect(admitted).toMatchObject({ ok: true })
})

it('preserves an owner-declared terminal failure without changing retryable failures', () => {
  const terminal = JSON.parse(
    localToolFailureReply('Stop this request.', 'MUTATION_SCOPE_UNAVAILABLE', {
      recoverable: false,
      settlement: 'not-started'
    }).text
  )
  expect(terminal).toMatchObject({
    recoverable: false,
    toolOutcome: { status: 'failed', settlement: 'not-started' }
  })
  const retryable = JSON.parse(
    localToolFailureReply('Correct the input.', 'INVALID_INPUT').text
  )
  expect(retryable.recoverable).toBe(true)
})

it.each(['measurementIssues', 'inspectionIssues'])(
  'preserves completed writes but reports failed %s delivery as partial',
  (field) => {
    const outcome = localToolOutcome({
      actionResults: [
        {
          result: {
            status: 'complete',
            toolOutcome: { status: 'success', settlement: 'completed' }
          }
        }
      ],
      [field]: [
        {
          elementId: 'region',
          message: 'Check delivery failed; recover checks only.'
        }
      ]
    })
    expect(outcome).toMatchObject({
      status: 'partial',
      settlement: 'completed'
    })
    expect(outcome.issues).toContainEqual(
      expect.objectContaining({
        message: 'Check delivery failed; recover checks only.'
      })
    )
  }
)

it('does not reinterpret domain parts as workflow execution receipts', () => {
  expect(
    localToolOutcome({
      parts: [{ status: 'failed', evidence: 'A negative visual judgment.' }]
    })
  ).toMatchObject({ status: 'success', settlement: 'completed' })
  expect(
    localToolOutcome({
      parts: [
        { completedSteps: [], status: 'failed', settlement: 'not-started' }
      ]
    })
  ).toMatchObject({ status: 'failed', settlement: 'not-started' })
})

it.each(['partial', 'unknown', 'completed'] as const)(
  'preserves cancellation with %s owner settlement without replacing the receipt',
  async (settlement) => {
    const controller = new AbortController()
    const result = {
      actionResults: [
        {
          actionId: 'draw',
          actionName: 'draw',
          result: {
            status: 'partial',
            appliedElementCount: 1
          }
        }
      ],
      failure: { code: 'AI_EXECUTION_FAILED', settlement }
    }
    await expect(
      invokeLocalTool(
        {
          call: async () => {
            controller.abort()
            return JSON.stringify(result)
          }
        },
        definition,
        {},
        controller.signal
      )
    ).rejects.toMatchObject({
      receipt: { settlement, result }
    })
  }
)

it('keeps ordinary cancellation without an acknowledged owner result', async () => {
  const controller = new AbortController()
  const reason = new Error('Cancelled before acknowledgement')
  await expect(
    invokeLocalTool(
      {
        call: async () => {
          controller.abort(reason)
          throw reason
        }
      },
      definition,
      {},
      controller.signal,
      () => ({ batches: [] })
    )
  ).rejects.toBe(reason)
})

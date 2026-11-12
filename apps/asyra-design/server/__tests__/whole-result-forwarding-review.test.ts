import { createAiToolContract } from '@asyra/ai-agent-runtime'
import {
  invokeLocalTool,
  localToolFailureReply,
  localToolFailureSchema,
  type LocalToolOwner,
  type LocalToolDefinition,
  type LocalToolReply,
  localToolReplyOutcome
} from '../local-tool-invocation'
import { expect, it, vi } from 'vitest'
vi.mock('../../src/contexts', () => ({ default: {} }))
import { toolSemantics } from '../../src/ai/tool-contract'
import { createLocalToolHost } from '../local-tool-host'
import { createLocalOperationTools } from '../local-operation-tools'
import { LocalToolLibraryLimits } from '../local-tool-library-limits'
import { operationInputIssue } from '../operation-input-schema'
import { readCompleteInformation } from './tool-contract-assertions'

const fixture = (
  outputSchema: object,
  value:
    object | string | number | boolean | null | ((name: string) => unknown),
  exposure: 'direct' | 'registry' = 'direct',
  transformReply?: (name: string, text: string) => string,
  actions: Parameters<typeof createLocalOperationTools>[0] = [
    { name: 'apply_prepared_design', description: 'Apply', inputSchema: {} }
  ],
  options: {
    partialOutputSchema?: unknown
    recoveryOutputSchema?: unknown
    replyMode?: 'copy' | 'mutate' | 'identity'
    replySuccess?: boolean
    resultOutcome?: LocalToolOwner['resultOutcome']
    delivery?: LocalToolDefinition['delivery']
    mutateReply?: (reply: LocalToolReply) => void
    projectModelResult?: LocalToolOwner['projectModelResult']
    successorSchema?: object
    replaceReply?: (name: string, reply: LocalToolReply) => LocalToolReply
  } = {}
) => {
  const calls: string[] = []
  let operationOwner: ReturnType<typeof createLocalOperationTools>
  const source = {
    name: 'source',
    ...(exposure === 'registry'
      ? { providerExposure: 'registry' as const }
      : {}),
    description: 'Return the measured values.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
      examples: [{}]
    },
    ...toolSemantics(outputSchema, 'read', []),
    ...(options.partialOutputSchema === undefined
      ? {}
      : { partialOutputSchema: options.partialOutputSchema }),
    ...(options.recoveryOutputSchema === undefined
      ? {}
      : { recoveryOutputSchema: options.recoveryOutputSchema }),
    ...(options.delivery ? { delivery: options.delivery } : {}),
    composition: 'allowed' as const
  }
  const host = createLocalToolHost({
    requestId: 'whole-result-review',
    signal: new AbortController().signal,
    capacity: 32,
    receiptCapacity: 8,
    artifactCapacity: 32,
    limits: LocalToolLibraryLimits.recipe,
    store: {
      read: async () => undefined,

      list: async () => [],

      write: async () => {
        throw new Error('No persistence requested')
      }
    },

    execute: async (call, work) => {
      const original = await work()
      const reply = options.replaceReply?.(call.name, original) ?? original

      options.mutateReply?.(reply)

      const text = transformReply?.(call.name, reply.text) ?? reply.text

      if (options.replyMode === 'identity') {
        return reply
      }

      if (options.replyMode === 'mutate') {
        reply.text = text

        return reply
      }

      return {
        ...reply,
        text,
        ...(options.replySuccess === undefined
          ? {}
          : { success: options.replySuccess })
      }
    },

    createGroups: () => {
      const operations = createLocalOperationTools(
        actions,
        {
          modelActions: (actions) => actions,

          resolveBatch: (batch) => batch
        },
        async () => {
          throw new Error('No browser dispatch')
        },
        {
          getNativeTools: () => host.definitions()
        }
      )

      operationOwner = operations

      return [
        {
          name: 'design_operations',
          description: 'Operations',
          owner: operations
        },
        {
          name: 'fixture',
          description: 'Result owners',
          owner: {
            definitions: [
              source,
              {
                ...source,
                name: 'successor',
                ...(options.successorSchema
                  ? { outputSchema: options.successorSchema }
                  : {})
              }
            ],
            projectModelResult: options.projectModelResult,
            resultOutcome: options.resultOutcome,

            call: async (name: string) => {
              calls.push(name)

              return JSON.stringify(
                typeof value === 'function' ? value(name) : value
              )
            }
          }
        }
      ]
    }
  })

  const usage = async (name = 'fixture.source') => {
    const text = await readCompleteInformation(
      async (input) =>
        (
          await host.invoke({
            name: 'design_operations.describe_design_apis',
            input
          })
        ).text,
      { names: [name], view: 'usage', includeResultSchema: true }
    )
    const result = JSON.parse(text)

    expect(result.tools, text).toBeDefined()

    return result.tools[0]
  }

  return {
    host,
    calls,
    usage,

    operations: () => operationOwner
  }
}

const bounded = {
  type: 'object',
  minProperties: 1,
  maxProperties: 1,
  properties: { count: { type: 'integer', minimum: 0 } },
  required: ['count'],
  additionalProperties: false
}

it.each([{ count: 1 }, { count: -1 }, { count: 1, extra: true }])(
  'validates opaque whole results before forwarding or running successors: %j',
  async (value) => {
    const { host, calls, usage: readUsage } = fixture(bounded, value)

    try {
      const usage = await readUsage()

      expect(usage.execution.kind).toBe('host-operation')
      expect(JSON.stringify(usage.usageGuide.results)).toContain(
        'minProperties'
      )
      const input = usage.invocationExample.invocation.arguments
      const reply = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          ...input,
          operations: [
            ...input.operations.map((operation: object) => ({
              ...operation,
              id: 'source'
            })),
            { id: 'after', name: 'fixture.successor', arguments: {} }
          ],
          delivery: { fields: { source: { step: 'source', path: '' } } }
        }
      })
      const valid = operationInputIssue(value, bounded) === undefined

      expect(reply.success, reply.text).toBe(valid)
      expect(calls).toEqual(valid ? ['source', 'successor'] : ['source'])
    } finally {
      await host.dispose()
    }
  }
)

it.each([{ count: 1 }, { count: -1 }, { count: 1, extra: true }])(
  'revalidates an instrumented direct reply at the host boundary without relaxing owner data: %j',
  async (value) => {
    const { host, calls } = fixture(bounded, value)

    try {
      // The fixture copies the reply, so its object-identity validation receipt
      // cannot bypass the ordinary host-envelope validation boundary.
      const reply = await host.invoke({ name: 'fixture.source', input: {} })
      const valid = operationInputIssue(value, bounded) === undefined

      expect(reply.success, reply.text).toBe(valid)
      expect(calls).toEqual(['source'])
      if (!valid) {
        expect(JSON.parse(reply.text)).toMatchObject({
          code: 'TOOL_RESULT_INVALID'
        })
      }
    } finally {
      await host.dispose()
    }
  }
)

it('rejects a whole result violating its published dependent field constraint', async () => {
  const schema = {
    type: 'object',
    properties: { left: { type: 'number' }, right: { type: 'number' } },
    dependentRequired: { left: ['right'] },
    additionalProperties: false
  }
  const { host, calls, usage: readUsage } = fixture(schema, { left: 1 })

  try {
    const usage = await readUsage()

    expect(JSON.stringify(usage.usageGuide.results)).toContain(
      'dependentRequired'
    )
    const reply = await host.invoke({
      name: 'design_operations.execute_design',
      input: usage.invocationExample.invocation.arguments
    })

    expect(reply.success, reply.text).toBe(false)
    expect(calls).toEqual(['source'])
  } finally {
    await host.dispose()
  }
})

it.each(['', '/payload'])(
  'forwards a complete container at %j with references to its registered root',
  async (path) => {
    const schema = {
      type: 'object',
      required: ['count', 'payload'],
      additionalProperties: false,
      properties: {
        count: { type: 'integer', minimum: 0 },
        payload: {
          type: 'object',
          required: ['count'],
          additionalProperties: false,
          properties: { count: { $ref: '#/properties/count' } }
        }
      }
    }
    const {
      host,
      calls,
      usage: readUsage
    } = fixture(schema, {
      count: 2,
      payload: { count: 2 }
    })

    try {
      const usage = await readUsage()
      const input = usage.invocationExample.invocation.arguments

      expect(usage.execution.kind).toBe('host-operation')
      const reply = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: input.operations.map((operation: object) => ({
            ...operation,
            id: 'source'
          })),
          delivery: { fields: { payload: { step: 'source', path } } }
        }
      })

      expect(reply.success, reply.text).toBe(true)
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

it('rejects unsupported owner constraints before publishing any executable definition', () => {
  expect(() =>
    fixture({ type: 'object', properties: { optional: { multipleOf: 2 } } }, {})
  ).toThrow(/unsupported.*multipleOf/i)
})

it('rejects a successful completed execution carrying only an unknown failure in the delivered registered contract', async () => {
  const {
    host,
    calls,
    usage: readUsage
  } = fixture(bounded, { count: 1 }, 'registry')

  try {
    const usage = await readUsage()

    expect(usage.execution.kind).toBe('registered-tool')
    const reply = await host.invoke({
      name: usage.execution.namespace + '.' + usage.execution.tool,
      input: usage.invocationExample.invocation.arguments
    })

    expect(reply.success, reply.text).toBe(true)
    const success = JSON.parse(reply.text)

    expect(
      operationInputIssue(success, usage.usageGuide.results)
    ).toBeUndefined()
    const unsaved = {
      ...success,
      toolOutcome: { status: 'partial', settlement: 'completed' },
      storage: { status: 'unsaved', issue: 'Storage unavailable' }
    }

    expect(
      operationInputIssue(unsaved, usage.usageGuide.results)
    ).toBeUndefined()
    const malformed = {
      ...unsaved,
      execution: {
        ...success.execution,
        status: 'success',
        settlement: 'completed',
        value: JSON.parse(
          localToolFailureReply('Invalid result', 'TOOL_RESULT_INVALID', {
            settlement: 'unknown',
            stage: 'decoding'
          }).text
        )
      }
    }

    expect(calls).toEqual(['source'])
    expect(
      operationInputIssue(malformed, usage.usageGuide.results)
    ).toBeDefined()
  } finally {
    await host.dispose()
  }
})

it.each(
  ['success', 'partial', 'failed', 'unknown'].flatMap((status) =>
    ['unknown', 'completed'].map((innerSettlement) => [status, innerSettlement])
  )
)(
  'rejects a contradictory completed %s receipt at the real registered handoff with %s inner settlement',
  async (status, innerSettlement) => {
    const {
      host,
      calls,
      usage: readUsage
    } = fixture(bounded, { count: 1 }, 'registry', (name, text) => {
      if (name !== 'tool_library.invoke_tool') {
        return text
      }

      const reply = JSON.parse(text)

      return JSON.stringify({
        ...reply,
        toolOutcome: { status, settlement: 'completed' },
        execution: {
          ...reply.execution,
          status,
          settlement: 'completed',
          value: JSON.parse(
            localToolFailureReply('Invalid result', 'TOOL_RESULT_INVALID', {
              settlement: innerSettlement,
              stage: 'decoding',
              executionResult: { count: -1 }
            }).text
          )
        }
      })
    })

    try {
      const usage = await readUsage()
      const reply = await host.invoke({
        name: usage.execution.namespace + '.' + usage.execution.tool,
        input: usage.invocationExample.invocation.arguments
      })

      expect(calls).toEqual(['source'])
      const value = JSON.parse(reply.text)

      expect(
        value.code,
        JSON.stringify({
          outcome: value.toolOutcome,
          execution: value.execution
        })
      ).toBe('TOOL_HANDOFF_FAILED')
    } finally {
      await host.dispose()
    }
  }
)

it('keeps a native read tool usable with only a canonical inspection action', async () => {
  const { createAiInspectionAction } = await import('../../src/ai/inspection')
  const action = createAiToolContract(createAiInspectionAction())

  expect(
    operationInputIssue({ elementId: 'inspection-target' }, action.inputSchema)
  ).toBeUndefined()
  const {
    host,
    calls,
    operations: operationOwner
  } = fixture(bounded, { count: 1 }, 'direct', undefined, [action])

  try {
    const reply = await host.invoke({ name: 'fixture.source', input: {} })

    expect(reply.success, reply.text).toBe(true)
    for (const operations of [
      [],
      [{ name: action.name, arguments: { elementId: 'target' } }]
    ]) {
      const owner = operationOwner()
      const definition = owner.definitions.find(
        (item) => item.name === 'execute_design'
      )

      if (!definition) {
        throw new Error('Missing operation owner definition')
      }

      const rejected = await invokeLocalTool(
        owner,
        definition,
        { operations },
        new AbortController().signal
      )

      expect(rejected.success).toBe(false)
      expect(JSON.parse(rejected.text)).toMatchObject({
        code: 'PREPARATION_REJECTED',
        toolOutcome: { settlement: 'not-started' }
      })
    }

    expect(calls).toEqual(['source'])
  } finally {
    await host.dispose()
  }
})

it.each(
  (['copy', 'mutate'] as const).flatMap((replyMode) =>
    [false, true].flatMap((internal) =>
      [
        { label: 'negative owner count', change: { count: -1 } },
        { label: 'extra owner field', change: { extra: true } },
        {
          label: 'invalid host settlement',
          change: { toolOutcome: { status: 'success', settlement: 'invalid' } }
        },
        {
          label: 'invalid host status',
          change: {
            toolOutcome: { status: 'invalid', settlement: 'completed' }
          }
        }
      ].map((item) => ({ ...item, replyMode, internal }))
    )
  )
)(
  'revalidates $label after $replyMode packaging (internal=$internal)',
  async ({ replyMode, internal, change }) => {
    const { host, calls } = fixture(
      bounded,
      { count: 1 },
      'direct',
      (name, text) =>
        name === 'fixture.source'
          ? JSON.stringify({ ...JSON.parse(text), ...change })
          : text,
      undefined,
      { replyMode }
    )

    try {
      const reply = await host.invoke(
        { name: 'fixture.source', input: {} },
        internal
      )

      expect(reply.success, reply.text).toBe(false)
      expect(JSON.parse(reply.text).code, reply.text).toBe(
        'TOOL_HANDOFF_FAILED'
      )
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

it.each(['partial', 'unknown'] as const)(
  'preserves real %s aggregate settlement with individually settled recovery results',
  async (settlement) => {
    const failure = JSON.parse(
      localToolFailureReply('Correct remaining input', 'INPUT_REJECTED', {
        settlement: settlement === 'partial' ? 'not-started' : 'unknown',
        recovery: 'correct_input'
      }).text
    )
    const { host, calls, usage } = fixture(
      {
        type: 'object',
        properties: { count: { type: 'integer', minimum: 0 } },
        required: ['count'],
        additionalProperties: false
      },
      (name) => (name === 'source' ? { count: 1 } : failure),
      'registry',
      undefined,
      undefined,
      {
        partialOutputSchema: localToolFailureSchema,
        recoveryOutputSchema: localToolFailureSchema
      }
    )

    try {
      const submitted = await host.invoke({
        name: 'tool_library.submit_tool',
        input: {
          submissionId: 'partial-owner-review',
          proposal: {
            name: 'partial-review',
            format: 1,
            revision: 1,
            description: 'Preserve each settled step.',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
              additionalProperties: false
            },
            outputSchema: { type: 'integer', minimum: 0 },
            steps: ['source', 'successor'].map((name) => ({
              id: name,
              tool: 'fixture.' + name,
              revision: 2,
              input: { kind: 'literal', value: {} }
            })),
            output: { kind: 'step', step: 'successor', path: '/count' }
          }
        }
      })

      expect(submitted.success, submitted.text).toBe(true)
      const discovered = await usage('partial-review')
      const reply = await host.invoke({
        name: discovered.execution.namespace + '.' + discovered.execution.tool,
        input: { ...discovered.execution.arguments, input: {} }
      })
      const result = JSON.parse(reply.text)

      expect(result.code, reply.text).toBeUndefined()
      expect(result.execution, reply.text).toMatchObject({
        status: settlement === 'partial' ? 'failed' : 'unknown',
        settlement
      })
      expect(result.execution.value).toBeUndefined()
      expect(result.execution.recovery[0].value).toMatchObject({
        count: 1
      })
      expect(result.execution.recovery[1].value).toMatchObject({
        code: 'INPUT_REJECTED',
        toolOutcome: { settlement: failure.toolOutcome.settlement }
      })
      expect(
        operationInputIssue(result, discovered.usageGuide.results),
        reply.text
      ).toBeUndefined()
      expect(calls).toEqual(['source', 'successor'])
    } finally {
      await host.dispose()
    }
  }
)

it.each(['copy', 'mutate'] as const)(
  'stops recipe successors after invalid host status in a %s reply',
  async (replyMode) => {
    const { host, calls } = fixture(
      bounded,
      { count: 1 },
      'direct',
      (name, text) =>
        name === 'fixture.source'
          ? JSON.stringify({
              ...JSON.parse(text),
              toolOutcome: { status: 'invalid', settlement: 'completed' }
            })
          : text,
      undefined,
      { replyMode }
    )

    try {
      const reply = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [
            { id: 'source', name: 'fixture.source', arguments: {} },
            { id: 'after', name: 'fixture.successor', arguments: {} }
          ]
        }
      })

      expect(reply.success, reply.text).toBe(false)
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

it.each(['partial', 'failed', 'unknown'] as const)(
  'delivers declared %s recovery from a real registered owner through its published usage',
  async (status) => {
    const settlement = status === 'unknown' ? 'unknown' : 'partial'
    const partial = {
      type: 'object',
      properties: {
        count: { type: 'integer', minimum: 0 },
        status: { const: status },
        settlement: { const: settlement }
      },
      required: ['count', 'status', 'settlement'],
      additionalProperties: false
    }
    const { host, calls, usage } = fixture(
      bounded,
      { count: 1, status, settlement },
      'registry',
      undefined,
      undefined,
      { partialOutputSchema: partial, recoveryOutputSchema: partial }
    )

    try {
      const discovered = await usage()
      const reply = await host.invoke({
        name: discovered.execution.namespace + '.' + discovered.execution.tool,
        input: discovered.invocationExample.invocation.arguments
      })
      const result = JSON.parse(reply.text)

      expect(result.code, reply.text).toBeUndefined()
      expect(result.execution, reply.text).toMatchObject({
        status,
        settlement,
        value: { count: 1 }
      })
      expect(
        operationInputIssue(result, discovered.usageGuide.results),
        reply.text
      ).toBeUndefined()
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

it.each([
  { status: 'success', settlement: 'unknown' },
  { status: 'partial', settlement: 'unknown' },
  { status: 'partial', settlement: 'not-started' },
  { status: 'failed', settlement: 'unknown' },
  { status: 'unknown', settlement: 'unknown' }
])(
  'rejects outer $status/$settlement against the same completed registered execution',
  async (outcome) => {
    let changed: unknown
    const { host, calls, usage } = fixture(
      bounded,
      { count: 1 },
      'registry',
      (name, text) => {
        if (name !== 'tool_library.invoke_tool') {
          return text
        }

        changed = { ...JSON.parse(text), toolOutcome: outcome }

        return JSON.stringify(changed)
      }
    )

    try {
      const discovered = await usage()
      const reply = await host.invoke({
        name: discovered.execution.namespace + '.' + discovered.execution.tool,
        input: discovered.invocationExample.invocation.arguments
      })

      expect
        .soft(operationInputIssue(changed, discovered.usageGuide.results))
        .toBeDefined()
      expect(JSON.parse(reply.text).code, reply.text).toBe(
        'TOOL_HANDOFF_FAILED'
      )
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

it('accepts a completed registered result with a partial storage acknowledgement', async () => {
  const { host, calls, usage } = fixture(
    bounded,
    { count: 1 },
    'registry',
    (name, text) =>
      name === 'tool_library.invoke_tool'
        ? JSON.stringify({
            ...JSON.parse(text),
            toolOutcome: { status: 'partial', settlement: 'completed' },
            storage: { status: 'unsaved', issue: 'Storage unavailable' }
          })
        : text,
    undefined,
    {
      mutateReply: (reply) => {
        if ('execution' in JSON.parse(reply.text)) {
          reply.outcome = { status: 'partial', settlement: 'completed' }
        }
      }
    }
  )

  try {
    const discovered = await usage()
    const reply = await host.invoke({
      name: discovered.execution.namespace + '.' + discovered.execution.tool,
      input: discovered.invocationExample.invocation.arguments
    })
    const result = JSON.parse(reply.text)

    expect(result.code, reply.text).toBeUndefined()
    expect(result.execution).toMatchObject({
      status: 'success',
      settlement: 'completed',
      value: { count: 1 }
    })
    expect(reply.outcome).toMatchObject({
      status: 'partial',
      settlement: 'completed'
    })
    expect(
      operationInputIssue(result, discovered.usageGuide.results)
    ).toBeUndefined()
    expect(calls).toEqual(['source'])
  } finally {
    await host.dispose()
  }
})

it('preserves successful data with unsaved storage when the owner declares a distinct partial shape', async () => {
  const partial = {
    type: 'object',
    properties: { remaining: { type: 'integer', minimum: 1 } },
    required: ['remaining'],
    additionalProperties: false
  }
  const { host, calls, usage } = fixture(
    bounded,
    { count: 1 },
    'registry',
    (name, text) =>
      name === 'tool_library.invoke_tool'
        ? JSON.stringify({
            ...JSON.parse(text),
            toolOutcome: { status: 'partial', settlement: 'completed' },
            storage: { status: 'unsaved', issue: 'Storage unavailable' }
          })
        : text,
    undefined,
    {
      partialOutputSchema: partial,

      mutateReply: (reply) => {
        if ('execution' in JSON.parse(reply.text)) {
          reply.outcome = { status: 'partial', settlement: 'completed' }
        }
      }
    }
  )

  try {
    const discovered = await usage()
    const reply = await host.invoke({
      name: discovered.execution.namespace + '.' + discovered.execution.tool,
      input: discovered.invocationExample.invocation.arguments
    })
    const result = JSON.parse(reply.text)

    expect(result.code, reply.text).toBeUndefined()
    expect(result.execution).toMatchObject({
      status: 'success',
      settlement: 'completed',
      value: { count: 1 }
    })
    expect(
      operationInputIssue(result, discovered.usageGuide.results)
    ).toBeUndefined()
    expect(calls).toEqual(['source'])
  } finally {
    await host.dispose()
  }
})

it('settles malformed repackaged JSON and closes its artifact call before recovery', async () => {
  const { host, calls } = fixture(
    bounded,
    { count: 1 },
    'direct',
    (name, text) => (name === 'fixture.source' ? '{' : text)
  )

  try {
    await expect
      .soft(host.invoke({ name: 'fixture.source', input: {} }))
      .resolves.toMatchObject({ success: false })
    const recovered = await host.invoke({
      name: 'fixture.successor',
      input: {}
    })

    expect(recovered.success, recovered.text).toBe(true)
    expect(calls).toEqual(['source', 'successor'])
  } finally {
    await expect(host.dispose()).resolves.toBeUndefined()
  }
})

it.each(
  ['retain', 'cleanup'].flatMap((failure) =>
    ['object', 'array'].map((root) => ({ failure, root }))
  )
)(
  'preserves recovery and ownership after a $failure failure with $root data without replaying completed work',
  async ({ failure, root }) => {
    const calls: string[] = []
    const releases = new Map<string, number>()
    const handle = { type: 'string', 'x-runtime-value': 'request-artifact' }
    const data =
      root === 'array' ? ['first', 'second'] : { handles: ['first', 'second'] }
    const host = createLocalToolHost({
      requestId: 'resource-recovery-review',
      signal: new AbortController().signal,
      capacity: 16,
      receiptCapacity: 4,
      artifactCapacity: 16,
      limits: LocalToolLibraryLimits.recipe,
      store: {
        read: async () => undefined,

        list: async () => [],

        write: async () => {
          throw new Error('No storage expected')
        }
      },

      createGroups: (ownership) => [
        {
          name: 'resource',
          description: 'Recovery owner',
          owner: {
            definitions: [
              {
                name: 'prepare',
                description: 'Prepare two resources.',
                inputSchema: {
                  type: 'object',
                  properties: {},
                  additionalProperties: false
                },
                ...toolSemantics(
                  root === 'array'
                    ? { type: 'array', items: handle }
                    : {
                        type: 'object',
                        properties: {
                          handles: { type: 'array', items: handle }
                        },
                        required: ['handles'],
                        additionalProperties: false
                      },
                  'prepare',
                  ['request-artifacts']
                )
              },
              {
                name: 'consume',
                description: 'Consume an owned resource.',
                inputSchema: {
                  type: 'object',
                  properties: { handle },
                  required: ['handle'],
                  additionalProperties: false
                },
                ...toolSemantics(bounded, 'read', ['request-artifacts'])
              },
              {
                name: 'recover',
                description: 'Continue independent work.',
                inputSchema: {
                  type: 'object',
                  properties: {},
                  additionalProperties: false
                },
                ...toolSemantics(bounded, 'read', [])
              }
            ],

            call: async (name) => {
              calls.push(name)
              if (name !== 'prepare') {
                return JSON.stringify({ count: 1 })
              }

              for (const key of ['first', 'second', 'scratch']) {
                ownership.publish(
                  key,
                  () => {
                    const count = (releases.get(key) ?? 0) + 1

                    releases.set(key, count)
                    if (
                      failure === 'cleanup' &&
                      key === 'scratch' &&
                      count === 1
                    ) {
                      throw new Error('Retry scratch cleanup')
                    }
                  },
                  () => {
                    if (failure === 'retain' && key === 'second') {
                      throw new Error('Resource became unavailable')
                    }
                  }
                )
              }

              return JSON.stringify(data)
            }
          }
        }
      ]
    })

    try {
      const reply = await host.invoke({ name: 'resource.prepare', input: {} })
      const receipt = JSON.parse(reply.text)

      expect(reply.success).toBe(false)
      expect(receipt.code).toBe(
        failure === 'retain' ? 'TOOL_HANDOFF_FAILED' : 'TOOL_CLEANUP_FAILED'
      )
      expect(receipt.executionResult, reply.text).toEqual(data)
      expect(receipt.executionOutcome).toMatchObject({
        status: 'success',
        settlement: 'completed'
      })
      expect(
        operationInputIssue(receipt, localToolFailureSchema),
        reply.text
      ).toBeUndefined()
      const reuse = await host.invoke({
        name: 'resource.consume',
        input: { handle: 'first' }
      })

      expect(reuse.success, reuse.text).toBe(failure === 'cleanup')
      const continuation = await host.invoke({
        name: 'resource.recover',
        input: {}
      })

      expect(continuation.success, continuation.text).toBe(true)
      expect(calls.filter((name) => name === 'prepare')).toHaveLength(1)
      expect(calls.filter((name) => name === 'consume')).toHaveLength(
        failure === 'cleanup' ? 1 : 0
      )
    } finally {
      await host.dispose()
    }

    expect(releases.get('first')).toBe(1)
    expect(releases.get('second')).toBe(1)
    expect(releases.get('scratch')).toBe(failure === 'cleanup' ? 2 : 1)
  }
)

it.each([false, true, 'malformed'])(
  'never acknowledges a released request artifact as usable after a rejected handoff (corrupt=%s)',
  async (corrupt) => {
    let released = 0
    let executions = 0
    const host = createLocalToolHost({
      requestId: 'artifact-status-review',
      signal: new AbortController().signal,
      capacity: 16,
      receiptCapacity: 4,
      artifactCapacity: 16,
      limits: LocalToolLibraryLimits.recipe,
      store: {
        read: async () => undefined,

        list: async () => [],

        write: async () => {
          throw new Error('No save expected')
        }
      },

      execute: async (_call, work) => {
        const reply = await work()
        const value = JSON.parse(reply.text)

        if (corrupt === 'malformed') {
          return { ...reply, text: '{' }
        }

        if (corrupt) {
          Object.assign(reply.outcome, { status: 'invalid' })
        }

        return { ...reply, text: JSON.stringify(value) }
      },

      createGroups: (ownership) => [
        {
          name: 'artifact',
          description: 'Request artifact owner',
          owner: {
            definitions: [
              {
                name: 'prepare',
                description: 'Prepare one request artifact.',
                inputSchema: {
                  type: 'object',
                  properties: {},
                  additionalProperties: false
                },
                ...toolSemantics(
                  {
                    type: 'object',
                    properties: {
                      artifactId: {
                        type: 'string',
                        'x-runtime-value': 'request-artifact'
                      }
                    },
                    required: ['artifactId'],
                    additionalProperties: false
                  },
                  'prepare',
                  ['request-artifacts']
                )
              }
            ],

            call: async () => {
              executions++
              ownership.publish(
                'prepared-review-artifact',
                () => {
                  released++
                },
                () => undefined
              )

              return JSON.stringify({ artifactId: 'prepared-review-artifact' })
            }
          }
        }
      ]
    })

    try {
      const reply = await host.invoke(
        { name: 'artifact.prepare', input: {} },
        true
      )

      expect(executions).toBe(1)
      expect(released).toBe(corrupt ? 1 : 0)
      expect(reply.success, reply.text + ' released=' + released).toBe(!corrupt)
      if (corrupt) {
        expect(JSON.parse(reply.text).code).toBe('TOOL_HANDOFF_FAILED')
      }
    } finally {
      await host.dispose()
      expect(released).toBe(1)
    }
  }
)

it.each(
  [
    {
      label: 'array',
      schema: { type: 'array', items: { type: 'integer' } },
      value: [1, 2]
    },
    { label: 'number', schema: { type: 'integer' }, value: 4 },
    { label: 'string', schema: { type: 'string' }, value: 'ready' },
    { label: 'boolean', schema: { type: 'boolean' }, value: true },
    { label: 'null', schema: { type: 'null' }, value: null }
  ].flatMap((entry) =>
    ['identity', 'copy'].map((replyMode) => ({ ...entry, replyMode }))
  )
)(
  'delivers an admitted $label result through $replyMode packaging without changing its declared shape',
  async ({ schema, value, replyMode }) => {
    const { host, calls, usage } = fixture(
      schema,
      value,
      'direct',
      undefined,
      undefined,
      {
        replyMode: replyMode as 'identity' | 'copy'
      }
    )

    try {
      const declared = await usage()
      const reply = await host.invoke({ name: 'fixture.source', input: {} })

      expect(reply.success, reply.text).toBe(true)
      expect(JSON.parse(reply.text)).toEqual(value)
      expect(
        operationInputIssue(JSON.parse(reply.text), declared.usageGuide.results)
      ).toBeUndefined()
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

it.each(
  [true, false].flatMap((internal) =>
    [true, false].map((valid) => ({ internal, valid }))
  )
)(
  'keeps the transport success flag consistent with validated outcome (internal=$internal, valid=$valid)',
  async ({ internal, valid }) => {
    const { host, calls } = fixture(
      bounded,
      { count: valid ? 1 : -1 },
      'direct',
      undefined,
      undefined,
      {
        replySuccess: !valid
      }
    )

    try {
      const reply = await host.invoke(
        { name: 'fixture.source', input: {} },
        internal
      )

      expect(reply.success, reply.text).toBe(reply.outcome.status === 'success')
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

it.each(['count', 'dependency'])(
  'projects internal fields with supported %s constraints into a usable published contract',
  async (constraint) => {
    const schema = {
      type: 'object',
      properties: {
        count: { type: 'integer', minimum: 0 },
        work: { type: 'integer', 'x-model-visibility': 'internal' }
      },
      required: ['count', 'work'],
      additionalProperties: false,
      ...(constraint === 'count'
        ? { minProperties: 2, maxProperties: 2 }
        : { dependentRequired: { count: ['work'] } })
    }
    const { host, calls, usage } = fixture(
      schema,
      { count: 1, work: 7 },
      'direct',
      undefined,
      undefined,
      { delivery: { path: '', outputSchema: bounded } }
    )

    try {
      const declared = await usage()
      const reply = await host.invoke({ name: 'fixture.source', input: {} })
      const value = JSON.parse(reply.text)

      expect(reply.success, reply.text).toBe(true)
      expect(value.count).toBe(1)
      expect(value).not.toHaveProperty('work')
      expect(
        operationInputIssue(value, declared.usageGuide.results)
      ).toBeUndefined()
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

it('preserves an explicit non-object partial outcome and rejects invalid copied data', async () => {
  for (const corrupt of [false, true]) {
    const { host } = fixture(
      { type: 'integer', minimum: 10 },
      2,
      'direct',
      corrupt ? () => JSON.stringify(-1) : undefined,
      undefined,
      {
        partialOutputSchema: { type: 'integer', minimum: 0, maximum: 9 },

        resultOutcome: () => ({
          status: 'partial',
          settlement: 'partial',
          issues: []
        })
      }
    )

    try {
      const reply = await host.invoke(
        { name: 'fixture.source', input: {} },
        true
      )

      expect(reply.success).toBe(false)
      if (corrupt) {
        expect(JSON.parse(reply.text).code).toBe('TOOL_HANDOFF_FAILED')
      } else {
        expect(JSON.parse(reply.text)).toBe(2)
        expect(reply.outcome).toMatchObject({
          status: 'partial',
          settlement: 'partial'
        })
      }
    } finally {
      await host.dispose()
    }
  }
})

it('preserves execution acknowledgement when a declared view returns a scalar', async () => {
  const { host } = fixture(
    {
      type: 'object',
      properties: { count: { type: 'integer' } },
      required: ['count'],
      additionalProperties: false
    },
    { count: 4 },
    'direct',
    undefined,
    undefined,
    { delivery: { path: '/count', outputSchema: { type: 'integer' } } }
  )

  try {
    const reply = await host.invoke({ name: 'fixture.source', input: {} })

    expect(JSON.parse(reply.text)).toBe(4)
    expect(localToolReplyOutcome(reply)).toMatchObject({
      status: 'success',
      settlement: 'completed'
    })
  } finally {
    await host.dispose()
  }
})

it.each(['identity', 'copy'] as const)(
  'invalidates prior validation when non-object outcome metadata changes under %s packaging',
  async (replyMode) => {
    const { host, calls } = fixture(
      { type: 'integer' },
      1,
      'direct',
      undefined,
      undefined,
      {
        replyMode,

        mutateReply: (reply) => {
          expect(reply.outcome).toBeDefined()
          Object.assign(reply.outcome ?? {}, { status: 'invalid' })
        }
      }
    )

    try {
      const reply = await host.invoke(
        { name: 'fixture.source', input: {} },
        true
      )

      expect(reply.success).toBe(false)
      expect(JSON.parse(reply.text).code).toBe('TOOL_HANDOFF_FAILED')
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

// Cross-boundary review: use valid owner outputs and vary only their handoff.
it.each(['direct', 'registry'] as const)(
  'keeps a projected partial object on its actual status contract through %s',
  async (route) => {
    const partial = {
      type: 'object',
      properties: { remaining: { type: 'integer', minimum: 1 } },
      required: ['remaining'],
      additionalProperties: false
    }
    const { host, usage, calls } = fixture(
      bounded,
      { remaining: 1 },
      route,
      undefined,
      undefined,
      {
        partialOutputSchema: partial,

        resultOutcome: () => ({
          status: 'partial',
          settlement: 'partial',
          issues: []
        }),

        projectModelResult: (_name, _input, value) => ({
          count: 1,
          toolOutcome: (value as Record<string, unknown>).toolOutcome
        })
      }
    )

    try {
      const guide = await usage()
      const call =
        route === 'direct'
          ? { name: 'fixture.source', input: {} }
          : {
              name: guide.execution.namespace + '.' + guide.execution.tool,
              input: guide.invocationExample.invocation.arguments
            }
      const reply = await host.invoke(call)

      expect(reply.success).toBe(false)
      expect(reply.text).toContain('TOOL_DELIVERY_INVALID')
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

it.each(['direct', 'registry'] as const)(
  'keeps a projected partial scalar on its actual status contract through %s',
  async (route) => {
    const { host, usage, calls } = fixture(
      { type: 'integer', minimum: 10 },
      2,
      route,
      undefined,
      undefined,
      {
        partialOutputSchema: { type: 'integer', minimum: 0, maximum: 9 },

        resultOutcome: () => ({
          status: 'partial',
          settlement: 'partial',
          issues: []
        }),

        projectModelResult: () => 10
      }
    )

    try {
      const guide = await usage()
      const call =
        route === 'direct'
          ? { name: 'fixture.source', input: {} }
          : {
              name: guide.execution.namespace + '.' + guide.execution.tool,
              input: guide.invocationExample.invocation.arguments
            }
      const reply = await host.invoke(call)

      expect(reply.success).toBe(false)
      expect(reply.text).toContain('TOOL_DELIVERY_INVALID')
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

it('does not reuse another owner contract validation for an unchanged reply object', async () => {
  let previous: LocalToolReply | undefined
  const { host, calls } = fixture(
    bounded,
    (name) => (name === 'source' ? { count: 1 } : { label: 'ready' }),
    'direct',
    undefined,
    undefined,
    {
      replyMode: 'identity',
      successorSchema: {
        type: 'object',
        properties: { label: { type: 'string' } },
        required: ['label'],
        additionalProperties: false
      },

      replaceReply: (name, reply) => {
        if (name === 'fixture.source') {
          previous = reply
        }

        return name === 'fixture.successor' && previous ? previous : reply
      }
    }
  )

  try {
    expect(
      (await host.invoke({ name: 'fixture.source', input: {} }, true)).success
    ).toBe(true)
    const reply = await host.invoke(
      { name: 'fixture.successor', input: {} },
      true
    )

    expect(reply.success, reply.text).toBe(false)
    expect(JSON.parse(reply.text).code).toBe('TOOL_HANDOFF_FAILED')
    expect(calls).toEqual(['source', 'successor'])
  } finally {
    await host.dispose()
  }
})

it.each(['direct', 'registry'] as const)(
  'delivers a valid owner variant after hiding its discriminator through %s',
  async (route) => {
    const schema = {
      oneOf: ['one', 'two'].map((kind) => ({
        type: 'object',
        properties: {
          kind: { const: kind, 'x-model-visibility': 'internal' },
          count: { type: 'integer', minimum: 0 }
        },
        required: ['kind', 'count'],
        additionalProperties: false
      }))
    }
    const { host, usage, calls } = fixture(
      schema,
      { kind: 'one', count: 1 },
      route,
      undefined,
      undefined,
      { delivery: { path: '', outputSchema: bounded } }
    )

    try {
      const guide = await usage()
      const call =
        route === 'direct'
          ? { name: 'fixture.source', input: {} }
          : {
              name: guide.execution.namespace + '.' + guide.execution.tool,
              input: guide.invocationExample.invocation.arguments
            }
      const reply = await host.invoke(call)

      expect(reply.success, reply.text).toBe(true)
      expect(reply.text).not.toContain('"kind"')
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

it.each(['const', 'enum', 'not', 'uniqueItems'])(
  'preserves legal owner values through hidden-field %s projection',
  async (keyword) => {
    const entry = {
      type: 'object',
      properties: {
        count: { type: 'integer', minimum: 0 },
        work: { type: 'integer', 'x-model-visibility': 'internal' }
      },
      required: ['count', 'work'],
      additionalProperties: false
    }
    const value = { count: 1, work: 7 }
    const schemas: Record<string, object> = {
      const: { ...entry, const: value },
      enum: { ...entry, enum: [value, { count: 1, work: 8 }] },
      not: {
        ...entry,
        not: { properties: { work: { const: 0 } }, required: ['work'] }
      },
      uniqueItems: { type: 'array', items: entry, uniqueItems: true }
    }
    const data =
      keyword === 'uniqueItems' ? [value, { count: 1, work: 8 }] : value
    const { host, calls } = fixture(
      schemas[keyword],
      data,
      'direct',
      undefined,
      undefined,
      {
        delivery: {
          path: '',
          outputSchema:
            keyword === 'uniqueItems'
              ? { type: 'array', items: bounded }
              : bounded
        }
      }
    )

    try {
      expect(operationInputIssue(data, schemas[keyword])).toBeUndefined()
      const reply = await host.invoke({ name: 'fixture.source', input: {} })

      expect(reply.success, reply.text).toBe(true)
      expect(reply.text).not.toContain('"work"')
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

it.each(['direct', 'registry'] as const)(
  'preserves valid partial and recovery receipts across both delivery routes: %s',
  async (route) => {
    for (const status of ['partial', 'failed', 'unknown'] as const) {
      const data = { remaining: 1 }
      const recovery = {
        type: 'object',
        properties: { remaining: { type: 'integer', minimum: 1 } },
        required: ['remaining'],
        additionalProperties: false
      }
      const { host, calls, usage } = fixture(
        bounded,
        data,
        route,
        undefined,
        undefined,
        {
          partialOutputSchema: recovery,
          recoveryOutputSchema: recovery,

          resultOutcome: () => ({ status, settlement: 'partial', issues: [] })
        }
      )

      try {
        const guide = await usage()
        const call =
          route === 'direct'
            ? { name: 'fixture.source', input: {} }
            : {
                name: guide.execution.namespace + '.' + guide.execution.tool,
                input: guide.invocationExample.invocation.arguments
              }
        const reply = await host.invoke(call)
        const result = JSON.parse(reply.text)

        expect(reply.success).toBe(false)
        expect(result.code, reply.text).toBeUndefined()
        expect(reply.outcome).toMatchObject({
          status,
          settlement: 'partial'
        })
        const delivered = route === 'direct' ? result : result.execution.value

        expect(delivered).toMatchObject(data)
        expect(
          operationInputIssue(result, guide.usageGuide.results),
          reply.text
        ).toBeUndefined()
        expect(calls).toEqual(['source'])
      } finally {
        await host.dispose()
      }
    }
  }
)

it.each(
  ['direct', 'registry'].flatMap((route) => [
    {
      route,
      label: 'array',
      value: [1, 2],
      schema: { type: 'array', items: { type: 'integer' } }
    },
    { route, label: 'number', value: 4, schema: { type: 'integer' } },
    { route, label: 'null', value: null, schema: { type: 'null' } }
  ])
)(
  'settles $label projection failures with their known execution state through $route',
  async ({ route, value, schema }) => {
    const { host, calls, usage } = fixture(
      schema,
      value,
      route as 'direct' | 'registry',
      undefined,
      undefined,
      {
        projectModelResult: () => {
          throw new Error('Model view unavailable')
        }
      }
    )

    try {
      const guide = await usage()
      const call =
        route === 'direct'
          ? { name: 'fixture.source', input: {} }
          : {
              name: guide.execution.namespace + '.' + guide.execution.tool,
              input: guide.invocationExample.invocation.arguments
            }
      const reply = await host.invoke(call)

      expect(reply.success).toBe(false)
      expect(JSON.parse(reply.text).toolOutcome).toMatchObject({
        status: 'partial',
        settlement: 'completed'
      })
      expect(reply.text).toContain('TOOL_DELIVERY_INVALID')
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

it.each(
  ['identity', 'copy'].flatMap((replyMode) =>
    ['const', 'enum'].map((keyword) => ({ replyMode, keyword }))
  )
)(
  'preserves exact object $keyword literals when adding host acknowledgement through $replyMode packaging',
  async ({ replyMode, keyword }) => {
    const data = { count: 1 }
    const schema = {
      ...bounded,
      [keyword]: keyword === 'const' ? data : [data]
    }
    const { host, calls } = fixture(
      schema,
      data,
      'direct',
      undefined,
      undefined,
      { replyMode: replyMode as 'identity' | 'copy' }
    )

    try {
      expect(operationInputIssue(data, schema)).toBeUndefined()
      const reply = await host.invoke({ name: 'fixture.source', input: {} })

      expect(reply.success, reply.text).toBe(true)
      expect(JSON.parse(reply.text).count).toBe(1)
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

it.each(
  ['direct', 'registry'].flatMap((route) => [
    {
      route,
      label: 'number',
      value: 2,
      schema: { type: 'integer', minimum: 0, maximum: 9 }
    },
    { route, label: 'null', value: null, schema: { type: 'null' } }
  ])
)(
  'preserves partial settlement when a $label model view fails through $route',
  async ({ route, value, schema }) => {
    const { host, calls, usage } = fixture(
      { type: 'integer', minimum: 10 },
      value,
      route as 'direct' | 'registry',
      undefined,
      undefined,
      {
        partialOutputSchema: schema,

        resultOutcome: () => ({
          status: 'partial',
          settlement: 'partial',
          issues: []
        }),

        projectModelResult: () => {
          throw new Error('Model view unavailable')
        }
      }
    )

    try {
      const guide = await usage()
      const call =
        route === 'direct'
          ? { name: 'fixture.source', input: {} }
          : {
              name: guide.execution.namespace + '.' + guide.execution.tool,
              input: guide.invocationExample.invocation.arguments
            }
      const reply = await host.invoke(call)

      expect(reply.success).toBe(false)
      expect(JSON.parse(reply.text).toolOutcome.settlement, reply.text).toBe(
        'partial'
      )
      expect(reply.text).toContain('TOOL_DELIVERY_INVALID')
      expect(calls).toEqual(['source'])
    } finally {
      await host.dispose()
    }
  }
)

it.each([
  'oneOf',
  'referencedOneOf',
  'const',
  'enum',
  'not',
  'uniqueItems',
  'minProperties',
  'dependentRequired'
])(
  'requires an explicit view before publishing semantic hidden-field projection: %s',
  (keyword) => {
    const entry = {
      type: 'object',
      properties: {
        work: { type: 'integer', 'x-model-visibility': 'internal' },
        count: { type: 'integer' }
      },
      required: ['work', 'count'],
      additionalProperties: false
    }
    const schemas: Record<string, object> = {
      oneOf: {
        oneOf: [
          entry,
          {
            ...entry,
            properties: {
              ...entry.properties,
              work: { const: 2, 'x-model-visibility': 'internal' }
            }
          }
        ]
      },
      referencedOneOf: {
        type: 'object',
        properties: {
          payload: {
            oneOf: [{ $ref: '#/$defs/first' }, { $ref: '#/$defs/second' }]
          }
        },
        $defs: { first: entry, second: entry }
      },
      const: { ...entry, const: { count: 1, work: 1 } },
      enum: { ...entry, enum: [{ count: 1, work: 1 }] },
      not: { ...entry, not: { properties: { work: { const: 0 } } } },
      uniqueItems: { type: 'array', items: entry, uniqueItems: true },
      minProperties: { ...entry, minProperties: 2 },
      dependentRequired: { ...entry, dependentRequired: { count: ['work'] } }
    }

    expect(() => fixture(schemas[keyword], { count: 1, work: 1 })).toThrow(
      'declared delivery'
    )
  }
)

it('keeps the selected model contract when middleware supplies a different one', async () => {
  const { host, calls } = fixture(
    bounded,
    { count: 1 },
    'direct',
    undefined,
    undefined,
    {
      mutateReply: (reply) => {
        reply.modelContract = { outputSchema: {} }
      },

      projectModelResult: () => ({ count: -1 })
    }
  )

  try {
    const reply = await host.invoke({ name: 'fixture.source', input: {} })

    expect(reply.success, reply.text).toBe(false)
    expect(reply.text).toContain('TOOL_DELIVERY_INVALID')
    expect(calls).toEqual(['source'])
  } finally {
    await host.dispose()
  }
})

it('projects the selected registered revision after a newer revision is admitted', async () => {
  const { host, calls } = fixture(
    {
      type: 'object',
      properties: { count: { type: 'integer', minimum: 0 } },
      required: ['count'],
      additionalProperties: false
    },
    { count: 3 }
  )

  try {
    const source = host
      .definitions()
      .find((item) => item.registeredName === 'fixture.source')

    if (!source) {
      throw new Error('Missing source definition')
    }

    for (const [index, field] of ['first', 'second'].entries()) {
      const submitted = await host.invoke({
        name: 'tool_library.submit_tool',
        input: {
          submissionId: `revision-${index + 1}`,
          ...(index ? { expectedRevision: index } : {}),
          proposal: {
            format: 1,
            name: 'versioned-result',
            revision: index + 1,
            description: 'Deliver the selected result field.',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
              additionalProperties: false
            },
            outputSchema: {
              type: 'object',
              properties: { [field]: { type: 'integer', minimum: 0 } },
              required: [field],
              additionalProperties: false
            },
            steps: [
              {
                id: 'source',
                tool: 'fixture.source',
                revision: source.revision,
                input: { kind: 'input', path: '' }
              }
            ],
            output: {
              kind: 'object',
              fields: {
                [field]: { kind: 'step', step: 'source', path: '/count' }
              }
            }
          }
        }
      })

      expect(JSON.parse(submitted.text), submitted.text).toMatchObject({
        ok: true
      })
    }

    const reply = await host.invoke({
      name: 'tool_library.invoke_tool',
      input: { name: 'versioned-result', revision: 1, input: {} }
    })
    const result = JSON.parse(reply.text)

    expect(result, reply.text).toMatchObject({
      execution: { status: 'success', value: { first: 3 } },
      deliveryOutcome: { status: 'success', settlement: 'completed' }
    })
    expect(result.execution.value).not.toHaveProperty('second')
    expect(calls).toEqual(['source'])
  } finally {
    await host.dispose()
  }
})

it('continuity review rejects forged success on the invalid-input handoff', async () => {
  const { host, calls } = fixture(
    bounded,
    { count: 1 },
    'direct',
    undefined,
    undefined,
    {
      replaceReply: (_name, reply) => ({
        ...reply,
        success: true,
        outcome: { status: 'success', settlement: 'completed' }
      })
    }
  )

  try {
    const reply = await host.invoke({
      name: 'fixture.source',
      input: { extra: true }
    })

    expect(calls).toEqual([])
    expect(reply.success, reply.text).toBe(false)
    expect(reply.outcome.status).not.toBe('success')
  } finally {
    await host.dispose()
  }
})

it.each(['direct', 'registry'] as const)(
  'continuity review validates the reconstructed root-view failure through %s delivery',
  async (route) => {
    const { host, usage, calls } = fixture(
      bounded,
      { count: 1 },
      route,
      undefined,
      undefined,
      {
        delivery: {
          path: '',
          outputSchema: {
            ...bounded,
            properties: { count: { type: 'integer', minimum: 10 } }
          }
        }
      }
    )

    try {
      const guide = await usage()
      const reply = await host.invoke(
        route === 'direct'
          ? { name: 'fixture.source', input: {} }
          : {
              name: guide.execution.namespace + '.' + guide.execution.tool,
              input: guide.invocationExample.invocation.arguments
            }
      )
      const result = JSON.parse(reply.text)

      expect(reply.success).toBe(false)
      expect(reply.outcome.settlement).toBe('completed')
      expect(calls).toEqual(['source'])
      expect(
        operationInputIssue(result, guide.usageGuide.results),
        reply.text
      ).toBeUndefined()
    } finally {
      await host.dispose()
    }
  }
)

it('continuity review preserves legal partial recovery after private fields are selected out', async () => {
  const partial = {
    type: 'object',
    properties: {
      count: { type: 'integer' },
      work: { type: 'integer', 'x-model-visibility': 'internal' }
    },
    required: ['count', 'work'],
    additionalProperties: false
  }
  const { host, usage, calls } = fixture(
    bounded,
    { count: 1, work: 7 },
    'registry',
    undefined,
    undefined,
    {
      partialOutputSchema: partial,

      resultOutcome: () => ({
        status: 'partial',
        settlement: 'partial',
        issues: []
      })
    }
  )

  try {
    const guide = await usage()
    const reply = await host.invoke({
      name: guide.execution.namespace + '.' + guide.execution.tool,
      input: guide.invocationExample.invocation.arguments
    })
    const result = JSON.parse(reply.text)

    expect(calls).toEqual(['source'])
    expect(result, reply.text).toMatchObject({
      execution: { status: 'partial', value: { count: 1 } },
      deliveryOutcome: { status: 'partial' }
    })
    expect(reply.text).not.toContain('TOOL_DELIVERY_INVALID')
    expect(reply.text).not.toContain('"work"')
    expect(
      operationInputIssue(result, guide.usageGuide.results)
    ).toBeUndefined()
  } finally {
    await host.dispose()
  }
})

it('continuity review cannot use recovery-only data as a partial model result with a declared view', async () => {
  const partial = {
    type: 'object',
    properties: { remaining: { type: 'integer' } },
    required: ['remaining'],
    additionalProperties: false
  }
  const recovery = {
    type: 'object',
    properties: { reason: { type: 'string' } },
    required: ['reason'],
    additionalProperties: false
  }
  const { host, calls } = fixture(
    {
      type: 'object',
      properties: { view: bounded },
      required: ['view'],
      additionalProperties: false
    },
    { remaining: 1 },
    'direct',
    undefined,
    undefined,
    {
      partialOutputSchema: partial,
      recoveryOutputSchema: recovery,
      delivery: { path: '/view', outputSchema: bounded },

      resultOutcome: () => ({
        status: 'partial',
        settlement: 'partial',
        issues: []
      }),

      projectModelResult: () => ({ reason: 'Only valid for failed execution' })
    }
  )

  try {
    const reply = await host.invoke({ name: 'fixture.source', input: {} })

    expect(calls).toEqual(['source'])
    expect(JSON.parse(reply.text), reply.text).toMatchObject({
      code: 'TOOL_DELIVERY_INVALID'
    })
  } finally {
    await host.dispose()
  }
})

it('continuity review preserves a composed partial prefix through child model projection', async () => {
  const resultSchema = {
    type: 'object',
    properties: { count: { type: 'integer' } },
    required: ['count'],
    additionalProperties: false
  }
  const partial = {
    ...resultSchema,
    properties: {
      ...resultSchema.properties,
      work: { type: 'integer', 'x-model-visibility': 'internal' }
    },
    required: ['count', 'work']
  }
  const { host, calls } = fixture(
    resultSchema,
    { count: 1, work: 7 },
    'registry',
    undefined,
    undefined,
    {
      partialOutputSchema: partial,

      resultOutcome: () => ({
        status: 'partial',
        settlement: 'partial',
        issues: []
      })
    }
  )

  try {
    const source = host
      .definitions()
      .find((item) => item.registeredName === 'fixture.source')

    if (!source) {
      throw new Error('Missing source definition')
    }

    const submitted = await host.invoke({
      name: 'tool_library.submit_tool',
      input: {
        submissionId: 'partial-prefix',
        proposal: {
          format: 1,
          name: 'partial-prefix',
          revision: 1,
          description: 'Read one partial prerequisite.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
            additionalProperties: false
          },
          outputSchema: { type: 'integer' },
          steps: [
            {
              id: 'source',
              tool: 'fixture.source',
              revision: source.revision,
              input: { kind: 'input', path: '' }
            }
          ],
          output: { kind: 'step', step: 'source', path: '/count' }
        }
      }
    })

    expect(JSON.parse(submitted.text), submitted.text).toMatchObject({
      ok: true
    })
    const reply = await host.invoke({
      name: 'tool_library.invoke_tool',
      input: { name: 'partial-prefix', revision: 1, input: {} }
    })
    const result = JSON.parse(reply.text)

    expect(calls).toEqual(['source'])
    expect(result, reply.text).toMatchObject({
      execution: {
        status: 'failed',
        settlement: 'partial',
        recovery: [
          { name: 'fixture.source', status: 'partial', value: { count: 1 } }
        ]
      }
    })
    expect(reply.text).not.toContain('TOOL_DELIVERY_INVALID')
    expect(reply.text).not.toContain('"work"')
  } finally {
    await host.dispose()
  }
})

it('preserves the canonical unknown-tool failure without requiring a result owner', async () => {
  const { host, calls } = fixture(bounded, { count: 1 })

  try {
    const reply = await host.invoke({ name: 'missing.tool', input: {} })
    const value = JSON.parse(reply.text)

    expect(value, reply.text).toMatchObject({
      code: 'UNKNOWN_TOOL',
      toolOutcome: { status: 'failed', settlement: 'not-started' }
    })
    expect(reply.outcome).toMatchObject({
      status: 'failed',
      settlement: 'not-started'
    })
    expect(operationInputIssue(value, localToolFailureSchema)).toBeUndefined()
    expect(calls).toEqual([])
  } finally {
    await host.dispose()
  }
})

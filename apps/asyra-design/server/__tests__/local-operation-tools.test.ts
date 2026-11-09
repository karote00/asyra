import { LocalToolInputError } from '../local-tool-invocation'
import * as capabilitySearch from '../capability-search'
import { recordAcquisitionCost } from './tool-contract-assertions'
import { operationInputIssue } from '../operation-input-schema'
import recordedAcquisition from './fixtures/recorded-101/acquisition-recovery-20261019.json'
import recordedClosure from './fixtures/recorded-101/whole-flow-closure-20261019.json'
import { createAiActions } from '../../src/ai/actions'
import { createDesignEditAction } from '../../src/ai/design-edit-action'
import { createBasicApiActions } from '../../src/ai/basic-api-actions'
import recordedDiscovery from '../../test-data/knowledge-evaluation/evidence/architecture-2026-10-18/discovery-replay.json'
import { createRetainedDesignContext } from '../../src/common-apis/retained-design-context'
import sharp from 'sharp'
import {
  createDocumentContextAction,
  createRegionTargetsAction
} from '../../src/ai/context-action'
import {
  prepareOperationBatch,
  runtimeOperationSchema
} from '../local-operation-batch'

import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import { createDesignCheckResults } from '../design-check-results'
import { AiDesignToolIds } from '../../src/constants/ai-design'
import type {
  AiActionBatch,
  AiJsonValue
} from '../../src/ai/action-batch-protocol'
import { describe, expect, it, vi } from 'vitest'
vi.mock('../../src/contexts', () => ({ default: {} }))
import {
  createLocalOperationTools as createOwner,
  localToolContent
} from '../local-operation-tools'
import {
  withToolContractAssertions,
  readCompleteInformation
} from './tool-contract-assertions'

const createLocalOperationTools = (...args: Parameters<typeof createOwner>) =>
  withToolContractAssertions(createOwner(...args))

import { createLocalImageTools } from '../local-image-tools'
import { AiActionNames } from '../../src/constants/ai-actions'
import { toolSemantics } from '../../src/ai/tool-contract'

it('refreshes discovery after recipe registration, revision and removal without repeating unchanged inventory', async () => {
  let generation = 0
  const tools: import('../local-operation-tools').NativeToolDescriptor[] = []
  const getNativeTools = vi.fn(() => tools)
  const owner = createLocalOperationTools(
    basicApiContracts,
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    vi.fn(),
    {
      getNativeTools,

      getNativeToolsRevision: () => generation
    }
  )

  const lookup = async () =>
    JSON.parse(
      await owner.call(
        'describe_design_apis',
        { names: ['repeat-fill'] },
        new AbortController().signal
      )
    )

  expect((await lookup()).missingNames).toEqual(['repeat-fill'])
  tools.push({
    name: 'repeat-fill',
    namespace: 'reusable_tools',
    description: 'Fill a fresh target set.',
    inputSchema: { type: 'number' },
    ...toolSemantics({ type: 'number' }, 'mutation', ['document']),
    execution: {
      kind: 'registered-tool',
      namespace: 'tool_library',
      tool: 'invoke_tool',
      arguments: { name: 'repeat-fill', revision: 2 }
    }
  })
  generation++
  const first = (await lookup()).tools[0]

  expect(first.execution).toEqual(tools[0].execution)
  expect(first.outputSchema).toEqual({ type: 'number' })
  expect((await lookup()).tools[0].definition.state).toBe('included')
  expect(getNativeTools).toHaveBeenCalledTimes(2)
  tools[0] = { ...tools[0], revision: 3, description: 'Updated contract.' }
  generation++
  expect((await lookup()).tools[0].definition.deliveryReason).toBe('requested')
  tools.splice(0)
  generation++
  expect((await lookup()).missingNames).toEqual(['repeat-fill'])
})

it('discovers reusable tools without knowing their names through the existing bounded category menu', async () => {
  const native = Array.from({ length: 19 }, (_, index) => ({
    name: `saved-${index}`,
    namespace: 'reusable_tools',
    description: 'A saved reusable operation.',
    inputSchema: { type: 'number' },
    ...toolSemantics({ type: 'number' }, 'mutation', ['document']),
    execution: {
      kind: 'registered-tool' as const,
      namespace: 'tool_library',
      tool: 'invoke_tool',
      arguments: { name: `saved-${index}`, revision: 2 }
    }
  }))
  const owner = createLocalOperationTools(
    basicApiContracts,
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    vi.fn(),
    { getNativeTools: () => native }
  )

  const call = async (args: unknown) =>
    JSON.parse(
      await owner.call(
        'describe_design_apis',
        args,
        new AbortController().signal
      )
    )

  expect((await call({})).categories).toContainEqual({
    category: 'tools',
    count: 19
  })
  const first = await call({ category: 'tools' })

  expect(first.tools).toHaveLength(16)
  expect(first.complete).toBe(false)
  expect(first.tools[0]).toMatchObject({
    name: 'saved-0',
    execution: native[0].execution
  })
  expect(first.tools[0].inputSchema).toBeUndefined()
  const rest = await call(first.next.arguments)

  expect(rest.tools).toHaveLength(3)
  expect(rest.complete).toBe(true)
  expect((await call({ names: ['saved-18'] })).tools[0].inputSchema).toEqual({
    type: 'number'
  })
})

const basicActionName = (method: string) => {
  const contract = basicApiContracts.find((api) => api.method === method)

  if (!contract) {
    throw new Error(`Missing registered API: ${method}`)
  }

  return contract.name
}

it.each(['success', 'partial', 'failed'] as const)(
  'preserves canonical reference scope in native %s receipts',
  async (status) => {
    const { operationInputIssue } = await import('../operation-input-schema')
    const { localToolReferences } = await import('../local-tool-leases')
    const domain = {
      type: 'object',
      required: ['handle'],
      additionalProperties: false,
      $defs: {
        handle: { type: 'string', 'x-runtime-value': 'request-artifact' }
      },
      properties: { handle: { $ref: '#/$defs/handle' } }
    }
    const semantics = toolSemantics(
      domain,
      'prepare',
      ['request'],
      'request-artifact'
    )
    const action = {
      name: AiActionNames.SELECT_ELEMENTS,
      description: 'Return a canonical retained receipt.',
      inputSchema: { type: 'object' },
      ...semantics,
      recoveryOutputSchema: domain
    }
    const owner = createOwner(
      [action],
      {
        modelActions: (actions) => actions,

        resolveBatch: (value) => value
      },
      vi.fn()
    )
    const definition = owner.definitions.find(
      (tool) => tool.name === action.name
    )

    if (!definition) {
      throw new Error('Missing canonical wrapper')
    }

    const schemas = {
      success: definition.outputSchema,
      partial: definition.partialOutputSchema,
      failed: definition.recoveryOutputSchema
    }
    const schema = schemas[status]
    const value = {
      actionResults: [
        {
          actionId: 'one',
          actionName: action.name,
          result: { handle: 'retained' }
        }
      ]
    }

    expect(operationInputIssue(value, schema)).toBeUndefined()
    expect(localToolReferences(value, schema)).toEqual(['retained'])
    expect(operationInputIssue({ handle: 'retained' }, schema)).toBeDefined()
    expect(
      operationInputIssue(
        {
          actionResults: [
            {
              actionId: 'one',
              actionName: action.name,
              result: { handle: 4 }
            }
          ]
        },
        schema
      )
    ).toBeDefined()
    expect(
      operationInputIssue({ handle: 'retained' }, semantics.partialOutputSchema)
    ).toBeUndefined()
    expect(
      localToolReferences({ handle: 'retained' }, semantics.partialOutputSchema)
    ).toEqual(['retained'])
  }
)

it('binds the native single-action receipt to the canonical browser success contract', async () => {
  const action = {
    name: AiActionNames.SELECT_ELEMENTS,
    description: 'Select explicit targets.',
    inputSchema: {
      type: 'object',
      properties: {
        elementIds: {
          'x-design-element-binding': 'all',
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['elementIds']
    },
    ...toolSemantics(
      {
        type: 'object',
        properties: { selected: { type: 'integer', minimum: 0 } },
        required: ['selected'],
        additionalProperties: false
      },
      'mutation',
      ['selection']
    )
  }
  const execute = vi.fn(async () => ({
    actionResults: [
      { actionId: 'one', actionName: action.name, result: { selected: 2 } }
    ],
    context: {}
  }))
  const owner = createOwner(
    [action],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute
  )
  const definition = owner.definitions.find((tool) => tool.name === action.name)

  if (!definition) {
    throw new Error('Missing native wrapper')
  }

  const { operationInputIssue } = await import('../operation-input-schema')
  const { invokeLocalTool } = await import('../local-tool-invocation')
  const args = { arguments: { elementIds: ['a', 'b'] } }

  expect(
    (
      await invokeLocalTool(
        owner,
        definition,
        args,
        new AbortController().signal
      )
    ).success
  ).toBe(true)
  const schema = definition.outputSchema as {
    properties: {
      actionResults: {
        minItems: number
        prefixItems: { properties: { result: unknown } }[]
      }
    }
  }

  expect(
    operationInputIssue(
      {
        actionResults: [
          { actionId: 'one', actionName: action.name, result: { selected: 2 } },
          {
            actionId: 'two',
            actionName: 'inspection',
            result: { image: 'preview' }
          }
        ]
      },
      definition.outputSchema
    )
  ).toBeDefined()
  expect(
    operationInputIssue(
      {
        actionResults: [
          {
            actionId: 'one',
            actionName: 'wrong-action',
            result: { selected: 2 }
          }
        ]
      },
      definition.outputSchema
    )
  ).toBeDefined()
  expect(schema.properties.actionResults.minItems).toBe(1)
  expect(
    schema.properties.actionResults.prefixItems[0].properties.result
  ).toEqual(action.outputSchema)
  expect(
    operationInputIssue(
      {
        actionResults: [
          { actionId: 'one', actionName: action.name, result: { wrong: 1 } }
        ]
      },
      definition.outputSchema
    )
  ).toBeDefined()
})

it('resolves multiple semantic operations and semantic names from the admitted registry without dispatch', async () => {
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    createBasicApiActions(),
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute
  )
  const selected = basicApiContracts.filter((api) =>
    ['fill.updateFillsAtIndex', 'hierarchy.moveElementsRelative'].includes(
      api.operation
    )
  )

  expect(selected).toHaveLength(2)

  const call = async (args: unknown) =>
    JSON.parse(
      await readCompleteInformation(
        (input) =>
          tools.call(
            'describe_design_apis',
            input,
            new AbortController().signal
          ),
        args
      )
    )

  const result = await call({
    operations: [...selected.map((api) => api.operation), 'missing.operation'],
    view: 'usage'
  })

  expect(result.apis.map((api: { name: string }) => api.name)).toEqual(
    selected.map((api) => api.name)
  )
  expect(result.missingOperations).toEqual(['missing.operation'])
  expect(
    result.apis.every((api: { inputSchema?: unknown }) => !api.inputSchema)
  ).toBe(true)
  const byName = await call({ names: selected.map((api) => api.operation) })

  for (const api of selected) {
    const byQuery = await call({ query: api.operation, view: 'full' })

    expect(byQuery.apis).toHaveLength(1)
    expect(byQuery.apis[0].inputSchema).toEqual(api.inputSchema)
  }

  expect(byName.missingNames).toEqual([])
  expect(byName.apis.map((api: { name: string }) => api.name)).toEqual(
    selected.map((api) => api.name)
  )
  for (let i = 0; i < selected.length; i++) {
    expect(byName.apis[i].inputSchema).toEqual(selected[i].inputSchema)
  }

  expect(execute).not.toHaveBeenCalled()
})

it.each(['names', 'query'])(
  'returns qualified choices for an ambiguous native name through %s instead of selecting a route',
  async (selector) => {
    const native = ['first', 'second'].map((namespace) => ({
      name: 'build',
      namespace,
      description: 'Build',
      inputSchema: { type: 'object' }
    }))
    const tools = createLocalOperationTools(
      basicApiContracts,
      {
        modelActions: (a) => a,

        resolveBatch: (v) => v
      },
      vi.fn(),
      { getNativeTools: () => native }
    )
    const result = JSON.parse(
      await tools.call(
        'describe_design_apis',
        selector === 'names' ? { names: ['build'] } : { query: 'build' },
        new AbortController().signal
      )
    )

    expect(result.tools ?? []).toEqual([])
    expect(result.ambiguousNames).toEqual([
      { name: 'build', candidates: ['first.build', 'second.build'] }
    ])
    expect(result).toMatchObject({ status: 'failed', settlement: 'completed' })
    const { invokeLocalTool } = await import('../local-tool-invocation')
    const definition = tools.definitions.find(
      (d) => d.name === 'describe_design_apis'
    )

    if (!definition) {
      throw new Error('Missing discovery definition')
    }

    const reply = await invokeLocalTool(
      tools,
      definition,
      selector === 'names' ? { names: ['build'] } : { query: 'build' },
      new AbortController().signal
    )

    expect(reply.success).toBe(false)
    expect(JSON.parse(reply.text).toolOutcome).toMatchObject({
      status: 'failed',
      settlement: 'completed'
    })
    const exact = JSON.parse(
      await tools.call(
        'describe_design_apis',
        selector === 'names'
          ? { names: ['first.build'] }
          : { query: 'first.build' },
        new AbortController().signal
      )
    )

    expect(exact.tools[0].execution).toEqual({
      kind: 'native-tool',
      namespace: 'first',
      tool: 'build'
    })
  }
)

it('uses the advertised overview default for any inspection target and preserves explicit native detail', async () => {
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result: { available: false }
    })),
    context: {}
  }))
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.INSPECT_DRAWING,
        description: 'Inspect',
        inputSchema: {}
      }
    ],
    {
      modelActions: (actions) => actions,

      resolveBatch: (value) => value
    },
    execute,
    { reviewTargetId: 'root' }
  )

  for (const extra of [
    {},
    { view: 'detail' },
    { region: { x: 0, y: 0, width: 20, height: 20 } }
  ]) {
    await tools.call(
      AiActionNames.INSPECT_DRAWING,
      { arguments: { elementId: 'another-root', ...extra } },
      new AbortController().signal
    )
  }

  const inputs = execute.mock.calls.map(([batch]) => batch.actions[0].arguments)

  expect(inputs[0]).toMatchObject({ view: 'overview' })
  expect(inputs[1]).toMatchObject({ view: 'detail' })
  expect(inputs[2]).toMatchObject({
    region: { x: 0, y: 0, width: 20, height: 20 },
    view: 'detail'
  })
})

describe('backend operation tools', () => {
  it('keeps explicitly requested diagnostics separate from capture and final verification', async () => {
    let overflow = true
    const executeBatch = vi.fn(async (batch: AiActionBatch) => ({
      actionResults: [
        {
          actionId: batch.actions[0].id,
          actionName: batch.actions[0].name,
          result:
            batch.actions[0].name === AiActionNames.REVIEW_DESIGN
              ? {
                  complete: true,
                  evidence: { sessionId: 'doc', revision: 1 },
                  measuredTextIds: ['t'],
                  findings: overflow
                    ? [{ kind: 'text-overflow', elementId: 't', bottom: 40 }]
                    : []
                }
              : { available: true, compositionId: 'f' }
        }
      ],
      context: {}
    }))
    const operations = createLocalOperationTools(
      [
        AiActionNames.UPDATE_DESIGN_ELEMENT,
        AiActionNames.REVIEW_DESIGN,
        AiActionNames.INSPECT_DRAWING
      ].map((name) => ({ name, description: name, inputSchema: {} })),
      {
        modelActions: (a) => a,

        resolveBatch: (v) => v
      },
      executeBatch
    )
    const signal = new AbortController().signal

    await operations.call(
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      { arguments: { elementId: 't' } },
      signal
    )
    expect(executeBatch.mock.calls.map(([b]) => b.actions[0].name)).toEqual([
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      AiActionNames.INSPECT_DRAWING
    ])
    const outcome = {
      batchId: 'done',
      actions: [
        {
          id: 'done',
          name: AiActionNames.REPORT_OUTCOME,
          arguments: { outcome: 'completed' },
          summary: 'Done'
        }
      ]
    }

    expect(
      operations.settleOutcome(outcome).actions[0].arguments
    ).toMatchObject({ outcome: 'completed' })
    executeBatch.mockImplementationOnce(async (batch) => ({
      actionResults: [
        {
          actionId: batch.actions[0].id,
          actionName: AiActionNames.REVIEW_DESIGN,
          result: {
            complete: true,
            evidence: { sessionId: 'doc', revision: 1 },
            measuredTextIds: ['other'],
            findings: []
          }
        }
      ],
      context: {}
    }))
    await operations.call(
      AiActionNames.REVIEW_DESIGN,
      { arguments: { elementId: 'other' } },
      signal
    )
    expect(
      operations.settleOutcome(outcome).actions[0].arguments
    ).toMatchObject({ outcome: 'completed' })
    overflow = false
    executeBatch.mockClear()
    await operations.call(
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      { arguments: { elementId: 't' } },
      signal
    )
    expect(executeBatch.mock.calls.map(([b]) => b.actions[0].name)).toEqual([
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      AiActionNames.INSPECT_DRAWING
    ])
    expect(
      operations.settleOutcome(outcome).actions[0].arguments
    ).toMatchObject({ outcome: 'completed' })
  })

  it('continues cheap correction cycles beyond eight while preserving read-only review', async () => {
    const executeBatch = vi.fn(async (batch: AiActionBatch) => ({
      actionResults: [
        {
          actionId: batch.actions[0].id,
          actionName: batch.actions[0].name,
          result:
            batch.actions[0].name === AiActionNames.REVIEW_DESIGN
              ? { complete: true, findings: [{ kind: 'text-overflow' }] }
              : { compositionId: 'f' }
        }
      ],
      context: {}
    }))
    const operations = createLocalOperationTools(
      [
        AiActionNames.UPDATE_DESIGN_ELEMENT,
        AiActionNames.REVIEW_DESIGN,
        AiActionNames.INSPECT_DRAWING
      ].map((name) => ({ name, description: name, inputSchema: {} })),
      {
        modelActions: (a) => a,

        resolveBatch: (v) => v
      },
      executeBatch
    )
    const signal = new AbortController().signal

    for (let i = 0; i < 9; i++) {
      await operations.call(
        AiActionNames.UPDATE_DESIGN_ELEMENT,
        { arguments: { elementId: 't' } },
        signal
      )
    }

    expect(
      executeBatch.mock.calls.filter(
        ([b]) => b.actions[0].name === AiActionNames.UPDATE_DESIGN_ELEMENT
      )
    ).toHaveLength(9)
    await operations.call(
      AiActionNames.REVIEW_DESIGN,
      { arguments: { elementId: 'f' } },
      signal
    )
    expect(executeBatch.mock.calls.at(-1)?.[0].actions[0].name).toBe(
      AiActionNames.REVIEW_DESIGN
    )
  })

  it.each(['read_design_context', 'review_design'])(
    'reads %s without automatic inspection or a failed review outcome',
    async (readAction) => {
      const executeBatch = vi.fn(async () => ({
        actionResults: [],
        context: {}
      }))
      const operations = createLocalOperationTools(
        [readAction, AiActionNames.INSPECT_DRAWING].map((name) => ({
          name,
          description: name,
          inputSchema: {}
        })),
        {
          modelActions: (actions) => actions,

          resolveBatch: (value) => value
        },
        executeBatch
      )

      await operations.call(
        readAction,
        { arguments: { scope: 'selection' } },
        new AbortController().signal
      )
      expect(executeBatch).toHaveBeenCalledTimes(1)
      const batch = {
        batchId: 'read',
        actions: [
          {
            id: 'r',
            name: readAction,
            arguments: { scope: 'selection' }
          }
        ]
      }

      expect(operations.settleOutcome(batch)).toBe(batch)
    }
  )

  it('can read after the visual correction budget is exhausted', async () => {
    const executeBatch = vi.fn(async (batch: AiActionBatch) => ({
      actionResults: [
        {
          actionId: 'r',
          actionName: batch.actions[0].name,
          result: { available: true }
        }
      ],
      context: {}
    }))
    const operations = createLocalOperationTools(
      [AiActionNames.READ_DESIGN_CONTEXT, AiActionNames.INSPECT_DRAWING].map(
        (name) => ({ name, description: name, inputSchema: {} })
      ),
      {
        modelActions: (actions) => actions,

        resolveBatch: (value) => value
      },
      executeBatch
    )
    const signal = new AbortController().signal

    for (let i = 0; i < 6; i++) {
      await operations.call(
        AiActionNames.INSPECT_DRAWING,
        { arguments: { elementId: 'drawing' } },
        signal
      )
    }

    await operations.call(
      AiActionNames.READ_DESIGN_CONTEXT,
      { arguments: { scope: 'selection' } },
      signal
    )
    expect(executeBatch).toHaveBeenCalledTimes(7)
    expect(executeBatch.mock.calls[6][0].actions[0].name).toBe(
      AiActionNames.READ_DESIGN_CONTEXT
    )
  })

  it('keeps a hierarchy operation without an acknowledgement unresolved', async () => {
    const executeBatch = vi.fn(async () => ({ actionResults: [], context: {} }))
    const operations = createLocalOperationTools(
      ['organize_design', AiActionNames.INSPECT_DRAWING].map((name) => ({
        name,
        description: name,
        inputSchema: {}
      })),
      {
        modelActions: (actions) => actions,

        resolveBatch: (value) => value
      },
      executeBatch
    )
    const result = await operations.call(
      'organize_design',
      { arguments: { operation: 'group', elementIds: ['a', 'b'] } },
      new AbortController().signal
    )

    expect(JSON.parse(result)).toMatchObject({
      actionResults: [],
      context: {},
      checks: { counts: { unverified: 1 } }
    })
    expect(executeBatch).toHaveBeenCalledTimes(1)
    const batch = {
      batchId: 'organization',
      actions: [
        {
          id: 'g',
          name: 'organize_design',
          arguments: { operation: 'group', elementIds: ['a'] }
        }
      ]
    }

    expect(
      operations.settleOutcome(batch).actions.at(-1)?.arguments.outcome
    ).toBe('unsupported')
  })

  it('prepares a referenced drawing on the backend and returns the acknowledged canonical result', async () => {
    const images = createLocalImageTools(
      {
        metadata: {
          imageAttachments: [
            {
              mediaType: 'image/png',
              size: 1,
              dataUrl: 'data:image/png;base64,YQ=='
            }
          ]
        }
      },
      async () =>
        '<svg width="10" height="10"><path d="M0,0L10,0L10,10Z" fill="#000000"/></svg>'
    )
    const signal = new AbortController().signal
    const artifact = JSON.parse(
      await images.call(
        'vtracer',
        {
          attachmentIndex: 0,
          plan: {
            strategy: 'preserve-vectors',
            reason: 'Preserve the supplied irregular vector artwork.'
          }
        },
        signal
      )
    )
    const executeBatch = vi.fn(async (_batch: AiActionBatch) => ({
      actionResults: [
        {
          actionId: 'a',
          actionName: 'insert',
          result: { compositionId: 'actual-id' }
        }
      ],
      context: { selectedIds: ['actual-id'] }
    }))
    const operations = createLocalOperationTools(
      [
        {
          name: AiActionNames.INSERT_VECTOR_COMPOSITION,
          description: 'Insert',
          inputSchema: {}
        }
      ],
      images,
      executeBatch
    )
    const result = await operations.call(
      AiActionNames.INSERT_VECTOR_COMPOSITION,
      {
        arguments: {
          imageArtifactId: artifact.imageArtifactId,
          compositionRole: 'logo',
          bounds: { x: 0, y: 0, width: 240, height: 240 },
          excludePathIds: []
        },
        message: 'Tracing is complete. I am adding the editable drawing.'
      },
      signal
    )

    expect(JSON.parse(result).context.selectedIds).toEqual(['actual-id'])
    expect(executeBatch).toHaveBeenCalledOnce()
    const prepared = executeBatch.mock.calls[0]?.[0]

    if (!prepared) {
      throw new Error('Missing prepared batch')
    }

    expect(JSON.stringify(prepared)).not.toContain('imageArtifactId')
    expect(prepared.actions[0].summary).toBe(
      'Tracing is complete. I am adding the editable drawing.'
    )
    expect(prepared.actions[0].name).toBe(
      AiActionNames.INSERT_VECTOR_COMPOSITION
    )
  })

  it('executes routine operations with parameters only and supplies the App status', async () => {
    const executeBatch = vi.fn(async (_batch: AiActionBatch) => ({
      actionResults: [],
      context: {}
    }))
    const operations = createLocalOperationTools(
      [
        {
          name: AiActionNames.SELECT_ELEMENTS,
          description: 'Select',
          inputSchema: {}
        }
      ],
      createLocalImageTools({}),
      executeBatch
    )

    expect(
      operations.definitions.find(
        (d) => d.name === AiActionNames.SELECT_ELEMENTS
      )?.inputSchema.anyOf
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ required: ['arguments'] }),
        expect.objectContaining({ required: ['arguments', 'target'] })
      ])
    )
    await operations.call(
      AiActionNames.SELECT_ELEMENTS,
      { arguments: { elementIds: ['a'] } },
      new AbortController().signal
    )
    expect(executeBatch).toHaveBeenCalledOnce()
    expect(executeBatch.mock.calls[0][0].actions[0].summary).toBe(
      'Updating the drawing'
    )
  })

  it.each([null, 1, '', '   ', 'x'.repeat(1001)])(
    'rejects malformed optional operation messages before execution: %s',
    async (message) => {
      const executeBatch = vi.fn(async (_batch: AiActionBatch) => ({
        actionResults: [],
        context: {}
      }))
      const operations = createLocalOperationTools(
        [
          {
            name: AiActionNames.SELECT_ELEMENTS,
            description: 'Select',
            inputSchema: {}
          }
        ],
        createLocalImageTools({}),
        executeBatch
      )

      await expect(
        operations.call(
          AiActionNames.SELECT_ELEMENTS,
          { arguments: {}, message },
          new AbortController().signal
        )
      ).rejects.toThrow('Invalid backend operation')
      expect(executeBatch).not.toHaveBeenCalled()
    }
  )

  it('does not expose or execute an unregistered capability', async () => {
    const executeBatch = vi.fn()
    const operations = createLocalOperationTools(
      [{ name: 'shell', description: 'No', inputSchema: {} }],
      createLocalImageTools({}),
      executeBatch
    )

    expect(operations.definitions.map((tool) => tool.name)).toEqual([
      AiDesignToolIds.RECORD_DESIGN_FACTS,
      AiDesignToolIds.RECORD_DESIGN_CALCULATIONS
    ])
    await expect(
      operations.call(
        'shell',
        { arguments: {}, message: 'Run' },
        new AbortController().signal
      )
    ).rejects.toThrow()
    expect(executeBatch).not.toHaveBeenCalled()
  })
})

const png =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGioAAAAASUVORK5CYII='

it('returns native image content without placing image bytes in text', async () => {
  const receipt = {
    actionResults: [
      {
        actionName: AiActionNames.INSPECT_DRAWING,
        result: {
          available: true,
          image: { dataUrl: png, width: 1, height: 1 }
        }
      }
    ]
  }
  const content = await localToolContent(JSON.stringify(receipt))

  expect(content).toContainEqual({ type: 'inputImage', imageUrl: png })
  expect(
    JSON.stringify(content.filter((item) => item.type === 'inputText'))
  ).not.toContain('base64')
  await expect(
    localToolContent(
      JSON.stringify({
        actionResults: [
          {
            actionName: AiActionNames.INSPECT_DRAWING,
            result: {
              available: true,
              image: {
                dataUrl: 'https://example.com/image.png',
                width: 1,
                height: 1
              }
            }
          }
        ]
      })
    )
  ).rejects.toThrow()
})

it('captures fresh evidence after each mutation using the acknowledged composition ID', async () => {
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: batch.actions.map((action) => {
      if (action.name === AiActionNames.REVIEW_DESIGN) {
        return {
          actionId: action.id,
          actionName: action.name,
          result: {
            complete: true,
            findings: [],
            evidence: { sessionId: 'capture', revision: 1 }
          }
        }
      }

      return {
        actionId: action.id,
        actionName: action.name,
        result:
          action.name === AiActionNames.INSPECT_DRAWING
            ? { available: true, image: { dataUrl: png, width: 1, height: 1 } }
            : { compositionId: 'actual-composition', status: 'complete' }
      }
    }),
    context: {}
  }))
  const tools = createLocalOperationTools(
    [
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.SET_ELEMENT_VISIBILITY
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    createLocalImageTools({}),
    execute
  )

  for (const visible of [true, false]) {
    const receipt = await tools.call(
      AiActionNames.SET_ELEMENT_VISIBILITY,
      {
        arguments: { elementIds: ['shape'], visible },
        message: 'Adjusting the drawing'
      },
      new AbortController().signal
    )

    expect(await localToolContent(receipt)).toContainEqual({
      type: 'inputImage',
      imageUrl: png
    })
  }

  expect(execute).toHaveBeenCalledTimes(4)
  expect(execute.mock.calls[1][0].actions[0]).toMatchObject({
    name: AiActionNames.INSPECT_DRAWING,
    arguments: { elementId: 'actual-composition' }
  })
})

it('continues mutations beyond six reviews and never certifies unavailable evidence', async () => {
  let available = false
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: batch.actions.map((action) => {
      if (action.name === AiActionNames.REVIEW_DESIGN) {
        return {
          actionId: action.id,
          actionName: action.name,
          result: {
            complete: true,
            findings: [],
            evidence: { sessionId: 'capture', revision: 1 }
          }
        }
      }

      return {
        actionId: action.id,
        actionName: action.name,
        result:
          action.name === AiActionNames.INSPECT_DRAWING
            ? { available }
            : { compositionId: 'drawing' }
      }
    }),
    context: {}
  }))
  const tools = createLocalOperationTools(
    [
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.SET_ELEMENT_VISIBILITY
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    createLocalImageTools({}),
    execute
  )
  const completed: AiActionBatch = {
    batchId: 'done',
    actions: [
      {
        id: 'report',
        name: AiActionNames.REPORT_OUTCOME,
        arguments: { outcome: 'completed', message: 'Done' },
        summary: 'Done'
      }
    ]
  }

  const change = () =>
    tools.call(
      AiActionNames.SET_ELEMENT_VISIBILITY,
      {
        arguments: { elementIds: ['shape'], visible: true },
        message: 'Adjusting'
      },
      new AbortController().signal
    )

  await change()
  expect(tools.settleOutcome(completed).actions[0].arguments).toMatchObject({
    outcome: 'unsupported',
    message:
      'A requested drawing capture failed; report the limitation or retry that capture without replaying writes.'
  })
  available = true
  await change()
  expect(tools.settleOutcome(completed).actions[0].arguments).toMatchObject({
    outcome: 'completed'
  })
  for (let index = 2; index < 6; index++) {
    await change()
  }

  expect(execute).toHaveBeenCalledTimes(12)
  await change()
  expect(execute).toHaveBeenCalledTimes(14)
})

it('does not admit canvas writes in the final response', () => {
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    [AiActionNames.INSPECT_DRAWING, AiActionNames.SET_ELEMENT_VISIBILITY].map(
      (name) => ({ name, description: name, inputSchema: {} })
    ),
    createLocalImageTools({}),
    execute
  )

  expect(() =>
    tools.settleOutcome({
      batchId: 'late',
      actions: [
        {
          id: 'late-edit',
          name: AiActionNames.SET_ELEMENT_VISIBILITY,
          arguments: { elementId: 'shape', visible: false },
          summary: 'Late edit'
        }
      ]
    })
  ).toThrow(
    'Canvas writes must execute through the host before the final response'
  )
  expect(execute).not.toHaveBeenCalled()
})

it('does not classify a canonical execution failure as a preparation retry', async () => {
  const failure = new Error('Canonical execution failed')
  const executeBatch = vi.fn(async () => {
    throw failure
  })
  const operations = createLocalOperationTools(
    [
      {
        name: AiActionNames.SELECT_ELEMENTS,
        description: 'Select',
        inputSchema: {}
      }
    ],
    {
      modelActions: (actions) => actions,

      resolveBatch: (value) => value
    },
    executeBatch
  )

  await expect(
    operations.call(
      AiActionNames.SELECT_ELEMENTS,
      { arguments: {} },
      new AbortController().signal
    )
  ).rejects.toBe(failure)
  expect(executeBatch).toHaveBeenCalledOnce()
})

it('leaves final design verification to the AI after a successful capture', async () => {
  const tools = createLocalOperationTools(
    [AiActionNames.INSPECT_DRAWING, AiActionNames.SET_ELEMENT_VISIBILITY].map(
      (name) => ({ name, description: name, inputSchema: {} })
    ),
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    async (batch) => ({
      context: {},
      actionResults: batch.actions.map((action) => ({
        actionId: action.id,
        actionName: action.name,
        result: {
          compositionId: 'drawing',
          available: true,
          image: { dataUrl: png, width: 1, height: 1 }
        }
      }))
    })
  )

  await tools.call(
    AiActionNames.SET_ELEMENT_VISIBILITY,
    { arguments: { elementIds: ['shape'], visible: true } },
    new AbortController().signal
  )
  const result = tools.settleOutcome({
    batchId: 'done',
    actions: [
      {
        id: 'done',
        name: AiActionNames.REPORT_OUTCOME,
        arguments: { outcome: 'completed', message: 'Perfect detail.' },
        summary: 'Done'
      }
    ]
  })

  expect(result.actions[0].arguments).toMatchObject({
    outcome: 'completed',
    message: 'Perfect detail.'
  })
  expect(
    tools.settleOutcome({ batchId: 'silent', actions: [] }).actions
  ).toEqual([])
})

it('issues detail receipts for native regions without certifying the whole drawing', async () => {
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: [
      {
        actionId: 'region',
        actionName: AiActionNames.INSPECT_DRAWING,
        result: {
          available: true,
          partial: true,
          image: { dataUrl: png, width: 1, height: 1 }
        }
      }
    ],
    context: {}
  }))
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.INSPECT_DRAWING,
        description: 'Inspect',
        inputSchema: {}
      }
    ],
    createLocalImageTools({}),
    execute
  )
  const region = { x: 0, y: 0, width: 100, height: 100 }
  const result = JSON.parse(
    await tools.call(
      AiActionNames.INSPECT_DRAWING,
      { arguments: { elementId: 'drawing', region } },
      new AbortController().signal
    )
  )

  expect(execute.mock.calls[0][0].actions[0].arguments).toEqual({
    elementId: 'drawing',
    region,
    view: 'detail'
  })
  expect(result.actionResults[0].result.inspectionId).toEqual(
    expect.any(String)
  )
})

it('follows a new group containing the current review target without switching to unrelated groups', async () => {
  const executeBatch = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: [
      {
        actionId: batch.actions[0].id,
        actionName: batch.actions[0].name,
        result:
          batch.actions[0].name === AiActionNames.ORGANIZE_DESIGN
            ? {
                status: 'complete',
                operation: 'group',
                groupId: 'assembled',
                elementIds: batch.actions[0].arguments.elementIds
              }
            : {
                available: true,
                complete: true,
                findings: [],
                evidence: { sessionId: 'group-follow', revision: 1 }
              }
      }
    ]
  }))
  const operations = createLocalOperationTools(
    [
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.ORGANIZE_DESIGN,
      AiActionNames.INSPECT_DRAWING
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    executeBatch,
    { reviewTargetId: 'original' }
  )

  await operations.call(
    AiActionNames.ORGANIZE_DESIGN,
    { arguments: { operation: 'group', elementIds: ['unrelated'] } },
    new AbortController().signal
  )
  expect(executeBatch.mock.calls.at(-1)?.[0].actions[0].arguments).toEqual({
    elementId: 'original'
  })
  await operations.call(
    AiActionNames.ORGANIZE_DESIGN,
    { arguments: { operation: 'group', elementIds: ['original', 'details'] } },
    new AbortController().signal
  )
  expect(executeBatch.mock.calls.at(-1)?.[0].actions[0].arguments).toEqual({
    elementId: 'assembled'
  })
})

it.each([
  {
    name: AiActionNames.REMOVE_AI_COMPOSITION,
    arguments: { compositionId: 'original' },
    result: { status: 'complete', appliedElementIds: ['original'] }
  },
  {
    name: basicActionName('deleteElements'),
    arguments: { elementIds: ['original'] },
    result: {
      status: 'complete',
      value: { elementId: 'original', removed: [{ elementId: 'original' }] },
      mutationScope: {
        complete: true,
        elementIds: [],
        removedElementIds: ['original']
      }
    }
  },
  {
    name: basicActionName('deleteElements'),
    arguments: { elementIds: ['original', 'another'] },
    result: {
      status: 'complete',
      value: { removed: [{ elementId: 'original' }, { elementId: 'another' }] },
      mutationScope: {
        complete: true,
        elementIds: [],
        removedElementIds: ['original', 'another']
      }
    }
  }
])('retires explicitly removed drawing roots via $name', async (removal) => {
  let capturedScope: unknown
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => {
      let result: unknown = {}

      if (action.name === removal.name) {
        result = removal.result
      }

      if (action.name === AiActionNames.APPLY_PREPARED_DESIGN) {
        result = { compositionId: 'successor' }
      }

      if (action.name === AiActionNames.INSPECT_DRAWING) {
        result = {
          available: true,
          image: { dataUrl: png },
          evidence: { sessionId: 'doc', revision: 1 }
        }
      }

      if (action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE) {
        capturedScope = action.arguments.scope
        result = {
          current: true,
          validatedAt: { sessionId: 'validation-fixture', revision: 1 },
          coverage: { complete: true }
        }
      }

      return { actionId: action.id, actionName: action.name, result }
    })
  }))
  const tools = createLocalOperationTools(
    [
      removal.name,
      AiActionNames.APPLY_PREPARED_DESIGN,
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    execute,
    { reviewTargetId: 'original' }
  )

  const call = (name: string, args: unknown) =>
    tools.call(name, args, new AbortController().signal).then(JSON.parse)

  await call(removal.name, {
    arguments: removal.arguments,
    inspection: 'defer'
  })
  await call(AiActionNames.APPLY_PREPARED_DESIGN, {
    arguments: {},
    inspection: 'defer'
  })
  const image = await call(AiActionNames.INSPECT_DRAWING, {
    arguments: { elementId: 'successor' }
  })

  expect(image.actionResults[0].result.inspectionId).toEqual(expect.any(String))
  expect(capturedScope).toBeUndefined()
  expect(
    execute.mock.calls.filter(([batch]) =>
      batch.actions.some(
        (action) => action.name === AiActionNames.INSPECT_DRAWING
      )
    )
  ).toHaveLength(1)
})

it('rejects unsupported inspection scheduling values before mutation', async () => {
  const executeBatch = vi.fn()
  const operations = createLocalOperationTools(
    [
      {
        name: AiActionNames.APPLY_PREPARED_DESIGN,
        description: 'apply',
        inputSchema: {}
      }
    ],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    executeBatch
  )

  await expect(
    operations.call(
      AiActionNames.APPLY_PREPARED_DESIGN,
      {
        arguments: {},
        inspection: 'skip-forever'
      },
      new AbortController().signal
    )
  ).rejects.toThrow('Invalid backend operation')
  expect(executeBatch).not.toHaveBeenCalled()
})

it('rejects misplaced action fields from the registered schema before dispatch and accepts a corrected call', async () => {
  const executeBatch = vi.fn(async () => ({ actionResults: [], context: {} }))
  const operations = createLocalOperationTools(
    [
      {
        name: AiActionNames.UPDATE_DESIGN_ELEMENT,
        description: 'Update a design',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['elementId', 'properties'],
          properties: {
            elementId: { 'x-design-element-binding': 'each', type: 'string' },
            properties: { type: 'object' }
          }
        }
      }
    ],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    executeBatch
  )
  const signal = new AbortController().signal

  await expect(
    operations.call(
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      {
        arguments: { elementId: 'group', width: 5000, y: 11600 },
        inspection: 'defer'
      },
      signal
    )
  ).rejects.toThrow(LocalToolInputError)
  expect(executeBatch).not.toHaveBeenCalled()
  await operations.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    {
      arguments: { elementId: 'group', properties: { width: 5000, y: 11600 } },
      inspection: 'defer'
    },
    signal
  )
  expect(executeBatch).toHaveBeenCalledTimes(1)
})

it('validates nested batch items and union choices before any canonical dispatch', async () => {
  const execute = vi.fn(async () => ({ actionResults: [], context: {} }))
  const schema = {
    type: 'object',
    required: ['updates'],
    additionalProperties: false,
    properties: {
      updates: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['elementId'],
          properties: {
            elementId: { type: 'string', minLength: 1 },
            style: {
              type: 'object',
              additionalProperties: false,
              required: ['fillColor'],
              properties: { fillColor: { type: 'string' } }
            },
            geometry: {
              type: 'object',
              required: ['scaleX', 'scaleY'],
              properties: {
                scaleX: { type: 'number', exclusiveMinimum: 0 },
                scaleY: { type: 'number', exclusiveMinimum: 0 }
              }
            }
          },
          oneOf: [{ required: ['style'] }, { required: ['geometry'] }]
        }
      }
    }
  }
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.UPDATE_COMPOSITION_ELEMENTS,
        description: 'Update',
        inputSchema: schema
      }
    ],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute
  )
  const valid = { elementId: 'pane', style: { fillColor: '#112233' } }

  for (const bad of [
    { elementId: 'pane', fillColor: '#112233' },
    { elementId: 'pane' },
    { ...valid, geometry: { scaleX: 1, scaleY: 1 } },
    { elementId: 'pane', geometry: { scaleX: 0, scaleY: 1 } }
  ]) {
    await expect(
      tools.call(
        AiActionNames.UPDATE_COMPOSITION_ELEMENTS,
        { arguments: { updates: [valid, bad] }, inspection: 'defer' },
        new AbortController().signal
      )
    ).rejects.toThrow(LocalToolInputError)
  }

  expect(execute).not.toHaveBeenCalled()
  await tools.call(
    AiActionNames.UPDATE_COMPOSITION_ELEMENTS,
    { arguments: { updates: [valid] }, inspection: 'defer' },
    new AbortController().signal
  )
  expect(execute).toHaveBeenCalledTimes(1)
})

it('retains the whole drawing review target after a child refinement', async () => {
  const executeBatch = vi.fn(async (batch: AiActionBatch) => {
    const action = batch.actions[0]

    if (action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE) {
      return {
        context: {},
        actionResults: [
          {
            actionId: action.id,
            actionName: action.name,
            result: {
              current: true,
              validatedAt: { sessionId: 'validation-fixture', revision: 1 },
              coverage: { complete: true }
            }
          }
        ]
      }
    }

    if (action.name === AiActionNames.REVIEW_DESIGN) {
      return {
        context: {},
        actionResults: [
          {
            actionId: action.id,
            actionName: action.name,
            result: {
              complete: true,
              findings: [],
              evidence: { sessionId: 'app-session', revision: 1 }
            }
          }
        ]
      }
    }

    return {
      context: {},
      actionResults: [
        {
          actionId: action.id,
          actionName: action.name,
          result:
            action.name === AiActionNames.UPDATE_DESIGN_ELEMENT
              ? { status: 'complete', compositionId: 'child' }
              : {
                  evidence: { sessionId: 'app-session', revision: 1 },
                  available: true,
                  partial: false,
                  imageScope: action.arguments.view ?? 'overview',
                  elementsTruncated: true,
                  image: { dataUrl: png, width: 10, height: 10 }
                }
        }
      ]
    }
  })
  const operations = createLocalOperationTools(
    [
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    executeBatch,
    { reviewTargetId: 'whole' }
  )
  const signal = new AbortController().signal

  await operations.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    {
      arguments: { elementId: 'child' },
      inspection: 'defer'
    },
    signal
  )

  const capture = async (elementId: string, view: string) =>
    JSON.parse(
      await operations.call(
        AiActionNames.INSPECT_DRAWING,
        { arguments: { elementId, view } },
        signal
      )
    ).actionResults[0].result.inspectionId

  expect(await capture('whole', 'overview')).toEqual(expect.any(String))
  expect(await capture('child', 'detail')).toEqual(expect.any(String))
  await operations.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    { arguments: { elementId: 'child' }, inspection: 'immediate' },
    signal
  )
  expect(
    executeBatch.mock.calls.at(-1)?.[0].actions[0].arguments.elementId
  ).toBe('whole')
})

it('performs layout analysis only when explicitly requested across edits', async () => {
  let impact: Record<string, unknown> = {
    layoutScope: 'subtree',
    targetId: 'section'
  }
  const execute = vi.fn(async (batch: AiActionBatch) => {
    const a = batch.actions[0]

    return {
      context: {},
      actionResults: [
        {
          actionId: a.id,
          actionName: a.name,
          result: (() => {
            if (a.name === AiActionNames.REVIEW_DESIGN) {
              return { complete: true, findings: [], measuredTextIds: [] }
            }

            if (a.name === AiActionNames.INSPECT_DRAWING) {
              return { available: true, image: { dataUrl: png } }
            }

            return {
              compositionId:
                a.name === AiActionNames.UPDATE_DESIGN_ELEMENT
                  ? 'text'
                  : 'root',
              status: 'complete',
              reviewImpact: impact
            }
          })()
        }
      ]
    }
  })
  const names = [
    AiActionNames.APPLY_PREPARED_DESIGN,
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    AiActionNames.REVIEW_DESIGN,
    AiActionNames.INSPECT_DRAWING
  ]
  const tools = createLocalOperationTools(
    names.map((name) => ({ name, description: name, inputSchema: {} })),
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute
  )
  const signal = new AbortController().signal

  await tools.call(
    AiActionNames.APPLY_PREPARED_DESIGN,
    { arguments: {} },
    signal
  )
  execute.mockClear()
  await tools.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    { arguments: { elementId: 'text' }, inspection: 'defer' },
    signal
  )
  await tools.call(
    AiActionNames.INSPECT_DRAWING,
    { arguments: { elementId: 'root' } },
    signal
  )

  const reviews = () =>
    execute.mock.calls
      .filter(([b]) => b.actions[0].name === AiActionNames.REVIEW_DESIGN)
      .map(([b]) => b.actions[0].arguments)

  expect(reviews()).toEqual([])
  await tools.call(
    AiActionNames.REVIEW_DESIGN,
    { arguments: { elementId: 'root' } },
    signal
  )
  expect(reviews()).toMatchObject([{ elementId: 'root' }])
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
    }).actions[0].arguments.outcome
  ).toBe('completed')
  execute.mockClear()
  impact = { layoutScope: 'none' }
  await tools.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    { arguments: { elementId: 'text' }, inspection: 'defer' },
    signal
  )
  await tools.call(
    AiActionNames.INSPECT_DRAWING,
    { arguments: { elementId: 'root' } },
    signal
  )
  expect(reviews()).toEqual([])
  await tools.call(
    AiActionNames.REVIEW_DESIGN,
    { arguments: { elementId: 'root' } },
    signal
  )
  expect(reviews()).toMatchObject([{ elementId: 'root' }])
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
    }).actions[0].arguments.outcome
  ).toBe('completed')
  execute.mockClear()
  impact = { layoutScope: 'subtree', targetId: 'section-a' }
  await tools.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    { arguments: { elementId: 'text' }, inspection: 'defer' },
    signal
  )
  impact = { layoutScope: 'subtree', targetId: 'section-b' }
  await tools.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    { arguments: { elementId: 'text' }, inspection: 'defer' },
    signal
  )
  await tools.call(
    AiActionNames.INSPECT_DRAWING,
    { arguments: { elementId: 'root' } },
    signal
  )
  expect(reviews()).toEqual([])
  await tools.call(
    AiActionNames.REVIEW_DESIGN,
    { arguments: { elementId: 'root' } },
    signal
  )
  expect(reviews()).toMatchObject([{ elementId: 'root' }])
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
    }).actions[0].arguments.outcome
  ).toBe('completed')
  execute.mockClear()
  impact = { layoutScope: 'subtree', targetId: 'section-a' }
  await tools.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    { arguments: { elementId: 'text' }, inspection: 'defer' },
    signal
  )
  impact = { layoutScope: 'composition' }
  await tools.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    { arguments: { elementId: 'text' }, inspection: 'defer' },
    signal
  )
  await tools.call(
    AiActionNames.INSPECT_DRAWING,
    { arguments: { elementId: 'root' } },
    signal
  )
  expect(reviews()).toEqual([])
  await tools.call(
    AiActionNames.REVIEW_DESIGN,
    { arguments: { elementId: 'root' } },
    signal
  )
  expect(reviews()).toMatchObject([{ elementId: 'root' }])
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
    }).actions[0].arguments.outcome
  ).toBe('completed')
})

it('dispatches many registered edits once and captures the completed batch once', async () => {
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((a) => {
      let result: unknown = { available: true }

      if (a.name === AiActionNames.REVIEW_DESIGN) {
        result = {
          complete: true,
          evidence: { sessionId: 'doc', revision: 1 },
          findings: [],
          measuredTextIds: []
        }
      } else if (a.name === AiActionNames.SET_ELEMENT_VISIBILITY) {
        result = { changed: true, elementId: a.arguments.elementId }
      }

      return { actionId: a.id, actionName: a.name, result }
    })
  }))
  const action = {
    name: AiActionNames.SET_ELEMENT_VISIBILITY,
    description: 'visibility',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['elementId', 'visible'],
      properties: {
        elementId: { 'x-design-element-binding': 'each', type: 'string' },
        visible: { type: 'boolean' }
      }
    }
  }
  const tools = createLocalOperationTools(
    [
      action,
      {
        name: AiActionNames.REVIEW_DESIGN,
        description: 'review',
        inputSchema: {}
      },
      {
        name: AiActionNames.INSPECT_DRAWING,
        description: 'inspect',
        inputSchema: {}
      }
    ],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute,
    { reviewTargetId: 'root' }
  )

  await tools.call(
    'execute_design',
    {
      operations: Array.from({ length: 47 }, (_, i) => ({
        name: action.name,
        arguments: { elementId: `id-${i}`, visible: false }
      }))
    },
    new AbortController().signal
  )
  expect(execute.mock.calls.map(([b]) => b.actions.length)).toEqual([47, 1])
  expect(execute.mock.calls[0][0].actions.map((a) => a.arguments)).toEqual(
    Array.from({ length: 47 }, (_, i) => ({
      elementId: `id-${i}`,
      visible: false
    }))
  )
  execute.mockClear()
  await expect(
    tools.call(
      'execute_design',
      {
        operations: [
          { name: action.name, arguments: { elementId: 'ok', visible: false } },
          { name: action.name, arguments: { elementId: 'bad', visible: 'no' } }
        ]
      },
      new AbortController().signal
    )
  ).rejects.toThrow()
  expect(execute).not.toHaveBeenCalled()
})

it('resolves identity families into one exchange with a compact batch summary and retains canonical rejection', async () => {
  const resolveTargets = vi.fn(() => ['a', 'b', 'c'])
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: { unneeded: 'large current selection' },
    actionResults: batch.actions.map((a) => ({
      actionId: a.id,
      actionName: a.name,
      result: { elementId: (a.arguments as { elementId: string }).elementId }
    }))
  }))
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.SET_ELEMENT_VISIBILITY,
        description: 'hide',
        inputSchema: {
          type: 'object',
          required: ['elementId', 'visible'],
          properties: {
            elementId: { 'x-design-element-binding': 'each', type: 'string' },
            visible: { type: 'boolean' }
          }
        }
      }
    ],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v,

      resolveTargets
    },
    execute
  )
  const input = {
    operations: [
      {
        name: AiActionNames.SET_ELEMENT_VISIBILITY,
        arguments: { visible: false },
        target: {
          artifactId: 'saved',
          keyPrefix: 'reflection-',
          field: 'elementId'
        }
      }
    ]
  }
  const result = JSON.parse(
    await tools.call('execute_design', input, new AbortController().signal)
  )

  expect(resolveTargets).toHaveBeenCalledExactlyOnceWith({
    artifactId: 'saved',
    keyPrefix: 'reflection-'
  })
  expect(execute).toHaveBeenCalledTimes(1)
  expect(result.batchSummary).toEqual({ operationCount: 1, actionCount: 3 })
  expect(result.context).toBeUndefined()
  const aborted = new AbortController()

  aborted.abort()
  execute.mockClear()
  await expect(
    tools.call('execute_design', input, aborted.signal)
  ).rejects.toThrow()
  expect(execute).not.toHaveBeenCalled()
  execute.mockRejectedValueOnce(new Error('Target removed or locked'))
  const rejected = JSON.parse(
    await tools.call('execute_design', input, new AbortController().signal)
  )

  expect(rejected).toMatchObject({
    message: 'Target removed or locked',
    recoverable: false,
    toolOutcome: { settlement: 'unknown' }
  })
  expect(execute).toHaveBeenCalledTimes(1)
})

it('discovers every basic API without publishing hundreds of native tools', async () => {
  const operations = createLocalOperationTools(
    basicApiContracts,
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    async () => ({ actionResults: [], context: {} })
  )

  expect(operations.definitions.map((tool) => tool.name)).not.toEqual(
    expect.arrayContaining(basicApiContracts.map(({ name }) => name))
  )
  const signal = new AbortController().signal
  const index = JSON.parse(
    await operations.call('describe_design_apis', {}, signal)
  )

  expect(index.catalogSize).toBe(basicApiContracts.length)
  expect(
    index.categories.reduce(
      (sum: number, entry: { count: number }) => sum + entry.count,
      0
    )
  ).toBe(basicApiContracts.length)
  expect(operations.actionNames).toEqual(
    basicApiContracts.map(({ name }) => name)
  )
  const requested = basicApiContracts.slice(0, 2).map(({ name }) => name)
  const details = JSON.parse(
    await operations.call('describe_design_apis', { names: requested }, signal)
  )

  expect(details.apis.map((entry: { name: string }) => entry.name)).toEqual(
    requested
  )
  expect(details.apis[0].inputSchema).toEqual(basicApiContracts[0].inputSchema)
})

it('searches current API descriptions and names without loading every schema or losing no-match recovery', async () => {
  const custom = {
    ...basicApiContracts[0],
    description: 'Adjust quasar handles using the active App contract',
    inputSchema: {
      type: 'object',
      required: ['quasar'],
      properties: { quasar: { type: 'number' } }
    }
  }
  const actions = [custom, ...basicApiContracts.slice(1)]
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    actions,
    {
      modelActions: (value) => value,

      resolveBatch: (value) => value
    },
    execute
  )
  const signal = new AbortController().signal

  const call = async (args: unknown) =>
    JSON.parse(
      await tools.call(AiDesignToolIds.DESCRIBE_DESIGN_APIS, args, signal)
    )

  const full = await call({})
  const found = await call({ query: 'Quasar HANDLES' })

  expect(found).toMatchObject({
    complete: true,
    catalogSize: actions.length
  })
  expect(found.apis[0]).toMatchObject({
    name: custom.name,
    description: custom.description,
    match: { metadataTerms: ['quasar', 'handles'], unmatchedTerms: [] }
  })
  expect(found.apis[0].inputSchema).toBeUndefined()
  expect((await call({ names: [custom.name] })).apis[0].inputSchema).toEqual(
    custom.inputSchema
  )
  expect(found.count).toBeLessThan(full.catalogSize)
  expect((await call({ names: [custom.name], refresh: true })).apis).toEqual([
    expect.objectContaining(custom)
  ])
  expect((await call({ query: 'getVectorAnchorPoints' })).apis).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'api_element_getVectorAnchorPoints' })
    ])
  )
  const empty = await call({ query: 'unmatched-nebula-blueprint' })

  expect(empty).toMatchObject({
    complete: true,
    count: 0,
    apis: [],
    recovery: { arguments: {} }
  })
  expect(empty.message).toContain('not evidence')
  expect((await call({})).catalogSize).toBe(actions.length)
  expect(execute).not.toHaveBeenCalled()
  await expect(
    call({ query: 'quasar', names: [custom.name] })
  ).rejects.toThrow()
  await expect(call({ query: '   ' })).rejects.toThrow()
})

it('executes discovered APIs in a batch and identifies unknown lookup names', async () => {
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result: { status: 'complete' }
    })),
    context: {}
  }))
  const operations = createLocalOperationTools(
    basicApiContracts,
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute
  )
  const signal = new AbortController().signal

  await operations.call(
    AiDesignToolIds.EXECUTE_DESIGN,
    {
      operations: [
        {
          name: 'api_element_getVectorAnchorPoints',
          arguments: { elementId: 'v' }
        }
      ]
    },
    signal
  )
  expect(execute).toHaveBeenCalledOnce()
  expect(execute.mock.calls[0][0].actions[0].arguments).toEqual({
    elementId: 'v'
  })
  expect(
    JSON.parse(
      await operations.call(
        AiDesignToolIds.DESCRIBE_DESIGN_APIS,
        { names: ['api_core_resetRuntime'] },
        signal
      )
    )
  ).toMatchObject({
    apis: [],
    tools: [],
    missingNames: ['api_core_resetRuntime']
  })
})

it('captures a changed canonical generation without implicitly repeating deterministic checks', async () => {
  let revision = 1
  let changeDuringCapture = true
  const execute = vi.fn(async (batch: AiActionBatch) => {
    const action = batch.actions[0]

    if (action.name === AiActionNames.INSPECT_DRAWING && changeDuringCapture) {
      revision++
      changeDuringCapture = false
    }

    const evidence = { sessionId: 'document', revision }
    const results: Record<string, unknown> = {
      [AiActionNames.REVIEW_DESIGN]: {
        complete: true,
        evidence,
        measuredTextIds: [],
        findings: []
      },
      [AiActionNames.INSPECT_DRAWING]: {
        available: true,
        evidence,
        image: { dataUrl: png }
      },
      [AiActionNames.UPDATE_DESIGN_ELEMENT]: {
        status: 'complete',
        compositionId: 'drawing'
      }
    }

    return {
      context: {},
      actionResults: [
        {
          actionId: action.id,
          actionName: action.name,
          result: results[action.name]
        }
      ]
    }
  })
  const operations = createLocalOperationTools(
    [
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.INSPECT_DRAWING
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute,
    { reviewTargetId: 'drawing' }
  )
  const signal = new AbortController().signal

  await operations.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    { arguments: { elementId: 'drawing' }, inspection: 'defer' },
    signal
  )

  const inspect = () =>
    operations.call(
      AiActionNames.INSPECT_DRAWING,
      { arguments: { elementId: 'drawing' } },
      signal
    )

  const captured = JSON.parse(await inspect())

  expect(captured.actionResults[0].result.evidence.revision).toBe(2)

  const measurements = () =>
    execute.mock.calls.filter(
      ([batch]) => batch.actions[0].name === AiActionNames.REVIEW_DESIGN
    ).length

  expect(measurements()).toBe(0)
  await operations.call(
    AiActionNames.REVIEW_DESIGN,
    { arguments: { elementId: 'drawing' } },
    signal
  )
  expect(measurements()).toBe(1)
  await inspect()
  expect(measurements()).toBe(1)
})

it('does not infer model delivery from a tool name when its declaration is absent', async () => {
  const name = basicActionName('deleteElements')
  const removed = Array.from({ length: 288 }, (_, i) => ({
    elementId: `removed-${i}`,
    data: { points: Array.from({ length: 200 }, (_, n) => ({ x: n, y: n })) }
  }))
  const values = [
    {
      status: 'complete',
      value: { removed, rootParentChildrenAfter: ['keep'] },
      retained: {
        snapshotId: 'structural-receipt',
        leaseId: 'structural-lease',
        total: 0
      },
      mutationScope: {
        complete: true,
        elementIds: [],
        removedElementIds: removed.map((item) => item.elementId)
      }
    },
    {
      status: 'failed',
      value: { removed },
      message: 'retain failure evidence',
      mutationScope: {
        complete: true,
        elementIds: [],
        removedElementIds: removed.map((item) => item.elementId)
      }
    }
  ]
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action, i) => ({
      actionId: action.id,
      actionName: name,
      result: values[i]
    }))
  }))
  const tools = createLocalOperationTools(
    [{ name, description: name, inputSchema: {} }],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute
  )
  const args = {
    inspection: 'defer',
    operations: values.map(() => ({
      name,
      arguments: { elementIds: ['known'] }
    }))
  }
  const compact = JSON.parse(
    await tools.call('execute_design', args, new AbortController().signal)
  )

  expect(
    compact.actionResults.map((entry: { result: unknown }) => entry.result)
  ).toEqual(values)
  const full = JSON.parse(
    await tools.call(
      'execute_design',
      { ...args, response: 'full' },
      new AbortController().signal
    )
  )

  expect(
    full.actionResults.map((entry: { result: unknown }) => entry.result)
  ).toEqual(values)
})

it('retains valueless owner receipts instead of replacing their evidence with successful counts', async () => {
  const write = basicActionName('moveElements')
  const read = basicActionName('getVectorAnchorPoints')
  const count = 5000
  const values = [
    {
      status: 'complete',
      value: 'new-id',
      mutationScope: { complete: true, elementIds: [], removedElementIds: [] }
    },
    {
      status: 'no-change',
      value: false,
      mutationScope: { complete: true, elementIds: [], removedElementIds: [] }
    },
    {
      status: 'complete',
      value: null,
      finding: 'retain unknown data',
      mutationScope: { complete: true, elementIds: [], removedElementIds: [] }
    },
    { status: 'no-change', value: [{ x: 12, y: 34 }] }
  ]
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action, index) => ({
      actionId: action.id,
      actionName: action.name,
      result:
        index < count
          ? {
              status: 'complete',
              value: null,
              application: 'not-reported',
              toolOutcome: { status: 'success', settlement: 'completed' },
              mutationScope: {
                complete: true,
                elementIds: [`existing-${index}`],
                removedElementIds: []
              }
            }
          : values[index - count]
    }))
  }))
  const tools = createLocalOperationTools(
    [write, read].map((name) => ({ name, description: name, inputSchema: {} })),
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute
  )

  expect(
    JSON.stringify(
      tools.definitions.find((tool) => tool.name === 'execute_design')
    )
  ).toContain('preserves ordered owner receipts')
  const args = {
    inspection: 'defer',
    operations: Array.from({ length: count + values.length }, (_, index) => ({
      name: index === count + values.length - 1 ? read : write,
      arguments: {}
    }))
  }
  const compact = JSON.parse(
    await tools.call('execute_design', args, new AbortController().signal)
  )

  expect(compact.batchSummary).toEqual({
    operationCount: count + values.length,
    actionCount: count + values.length
  })
  expect(compact.actionResults).toHaveLength(count + values.length)
  expect(
    compact.actionResults
      .slice(count)
      .map((entry: { result: unknown }) => entry.result)
  ).toEqual(values)
  expect(compact.actionResults[0].result).toMatchObject({
    application: 'not-reported',
    mutationScope: { elementIds: ['existing-0'] }
  })
  const full = JSON.parse(
    await tools.call(
      'execute_design',
      { ...args, response: 'full' },
      new AbortController().signal
    )
  )

  expect(full.actionResults).toHaveLength(count + values.length)
  expect(execute).toHaveBeenCalledTimes(2)
})

it('retrieves retained source facts without canvas reads, captures or repeated verification', async () => {
  const executeBatch = vi.fn(async () => ({ actionResults: [], context: {} }))
  const operations = createLocalOperationTools(
    [AiActionNames.INSPECT_DRAWING].map((name) => ({
      name,
      description: name,
      inputSchema: {}
    })),
    {
      modelActions: (actions) => actions,

      resolveBatch: (batch) => batch
    },
    executeBatch
  )
  const signal = new AbortController().signal
  const fact = {
    id: 'scale',
    statement: 'Use 1 cm = 1 px.',
    scope: 'Requested scale',
    sources: ['current-user-request'],
    verification: 'Explicit scale in the user request.'
  }
  const saved = await operations.call(
    AiDesignToolIds.RECORD_DESIGN_FACTS,
    { facts: [fact] },
    signal
  )

  for (let i = 0; i < 5; i++) {
    expect(
      await operations.call(AiDesignToolIds.RECORD_DESIGN_FACTS, {}, signal)
    ).toEqual(saved)
  }

  expect(executeBatch).not.toHaveBeenCalled()
})

it('preserves typed ordered receipts when one target-bound wrapper expands scalar artifact targets', async () => {
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result: action.arguments
    }))
  }))
  const resolveTargets = vi.fn(() => ['a', 'b'])
  const fields = {
    type: 'object',
    additionalProperties: false,
    required: ['elementId', 'value'],
    properties: {
      elementId: { type: 'string', 'x-design-element-binding': 'each' },
      value: { type: 'number' }
    }
  }
  const tools = createLocalOperationTools(
    [
      {
        name: 'api_core_updateElementData',
        description: 'Change a target value',
        inputSchema: fields,
        ...toolSemantics(fields, 'mutation', ['document']),
        composition: 'allowed'
      }
    ],
    {
      modelActions: (value) => value,

      resolveBatch: (value) => value,

      resolveTargets
    },
    execute
  )
  const args = {
    arguments: { value: 3 },
    target: { artifactId: 'created', field: 'elementId' },
    inspection: 'defer'
  }
  const reply = JSON.parse(
    await tools.call(
      'api_core_updateElementData',
      args,
      new AbortController().signal
    )
  )

  expect(execute).toHaveBeenCalledTimes(1)
  expect(resolveTargets).toHaveBeenCalledTimes(1)
  expect(
    reply.actionResults.map((entry: { result: unknown }) => entry.result)
  ).toEqual([
    { elementId: 'a', value: 3 },
    { elementId: 'b', value: 3 }
  ])
  await expect(
    tools.call(
      'api_core_updateElementData',
      { ...args, arguments: { value: 'invalid' } },
      new AbortController().signal
    )
  ).rejects.toThrow()
  expect(execute).toHaveBeenCalledTimes(1)
})

it('resolves a nested plural target through the registered schema in one canonical exchange', async () => {
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result: { status: 'complete' }
    })),
    context: {}
  }))
  const resolveTargets = vi.fn(() => ['a', 'b'])
  const nested = {
    type: 'object',
    additionalProperties: false,
    required: ['elementIds', 'targetParentId'],
    properties: {
      elementIds: {
        'x-design-element-binding': 'all',
        type: 'array',
        items: { type: 'string' }
      },
      targetParentId: { type: 'string' }
    }
  }
  const tools = createLocalOperationTools(
    [
      {
        name: 'api_hierarchy_moveElements',
        description: 'move',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['request'],
          properties: { request: nested }
        }
      }
    ],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v,

      resolveTargets
    },
    execute
  )
  const args = { request: { targetParentId: 'parent' } }

  const call = (argumentsValue: unknown) =>
    tools.call(
      'execute_design',
      {
        inspection: 'defer',
        operations: [
          {
            name: 'api_hierarchy_moveElements',
            arguments: argumentsValue,
            target: {
              artifactId: 'saved',
              keyPrefix: 'ornament-',
              field: 'elementIds'
            }
          }
        ]
      },
      new AbortController().signal
    )

  await call(args)
  expect(execute).toHaveBeenCalledTimes(1)
  expect(execute.mock.calls[0][0].actions).toHaveLength(1)
  expect(execute.mock.calls[0][0].actions[0].arguments).toEqual({
    request: { targetParentId: 'parent', elementIds: ['a', 'b'] }
  })
  expect(args).toEqual({ request: { targetParentId: 'parent' } })
  expect(resolveTargets).toHaveBeenCalledTimes(1)
  execute.mockClear()
  await expect(
    call({ request: { targetParentId: 'parent', elementIds: ['other'] } })
  ).rejects.toThrow(/conflicting/)
  await expect(call({ request: null })).rejects.toThrow()
  expect(execute).not.toHaveBeenCalled()
})

it('rejects ambiguous identity paths before reading identities', () => {
  const resolve = vi.fn(() => ['a'])

  expect(() =>
    prepareOperationBatch(
      [
        {
          name: 'edit',
          arguments: {},
          target: { artifactId: 'a', field: 'elementId' }
        }
      ],
      [
        {
          name: 'edit',
          description: 'edit',
          inputSchema: {
            type: 'object',
            properties: {
              left: {
                type: 'object',
                properties: {
                  elementId: {
                    'x-design-element-binding': 'each',
                    type: 'string'
                  }
                }
              },
              right: {
                type: 'object',
                properties: {
                  elementId: {
                    'x-design-element-binding': 'each',
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      ],
      resolve
    )
  ).toThrow(/unambiguous/)
  expect(resolve).not.toHaveBeenCalled()
})

it('resolves an exact semantic operation using the admitted schema without a canvas exchange', async () => {
  const execute = vi.fn(async () => ({ actionResults: [], context: {} }))
  const admitted = basicApiContracts.map((api) =>
    api.method === 'updateFillsAtIndex'
      ? {
          ...api,
          description: 'Current uniform row patch',
          inputSchema: { type: 'object', required: ['currentField'] }
        }
      : api
  )
  const tools = createLocalOperationTools(
    admitted,
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute
  )
  const result = JSON.parse(
    await tools.call(
      'describe_design_apis',
      { operation: 'fill.updateFillsAtIndex' },
      new AbortController().signal
    )
  )

  expect(result.apis).toHaveLength(1)
  expect(result.apis[0]).toMatchObject({
    name: 'api_fill_updateFillsAtIndex',
    description: 'Current uniform row patch',
    inputSchema: { required: ['currentField'] }
  })
  expect(execute).not.toHaveBeenCalled()
})

it('publishes categories instead of the full API catalog for an empty lookup', async () => {
  const tools = createLocalOperationTools(
    basicApiContracts,
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    async () => ({ actionResults: [], context: {} })
  )
  const index = JSON.parse(
    await tools.call('describe_design_apis', {}, new AbortController().signal)
  )

  expect(index.apis).toBeUndefined()
  expect(index.categories).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ category: 'fill' }),
      expect.objectContaining({ category: 'vector' })
    ])
  )
})

it('exposes single-object conveniences only inside the batch schema', () => {
  const names = [
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    AiActionNames.SET_ELEMENT_VISIBILITY
  ]
  const tools = createLocalOperationTools(
    names.map((name) => ({ name, description: name, inputSchema: {} })),
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    async () => ({ actionResults: [], context: {} })
  )

  expect(tools.definitions.map((tool) => tool.name)).not.toEqual(
    expect.arrayContaining(names)
  )
  const batch = tools.definitions.find(
    (tool) => tool.name === AiDesignToolIds.EXECUTE_DESIGN
  )

  expect(JSON.stringify(batch?.inputSchema)).toContain(
    AiActionNames.UPDATE_DESIGN_ELEMENT
  )
  expect(JSON.stringify(batch?.inputSchema)).toContain(
    AiActionNames.SET_ELEMENT_VISIBILITY
  )
})

it('discovers batch-only composite schemas without exposing a scalar native tool', async () => {
  const action = {
    name: AiActionNames.UPDATE_DESIGN_ELEMENT,
    description: 'Update selected fields',
    inputSchema: { type: 'object', required: ['elementId'] }
  }
  const tools = createLocalOperationTools(
    [action],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    async () => ({ actionResults: [], context: {} })
  )
  const result = JSON.parse(
    await tools.call(
      'describe_design_apis',
      { operation: action.name },
      new AbortController().signal
    )
  )

  expect(result.apis[0].inputSchema).toEqual(action.inputSchema)
  expect(result.apis[0].category).toBe('design')
  expect(tools.definitions.some((tool) => tool.name === action.name)).toBe(
    false
  )
})

it.each([
  {
    method: 'groupElements',
    args: { elementIds: ['original'] },
    result: {
      status: 'complete',
      value: { groupId: 'assembled', elementIds: ['original'] }
    },
    previous: 'original',
    expected: 'assembled'
  },
  {
    method: 'createElements',
    args: { createOptions: [{ type: 'rectangle' }] },
    result: {
      status: 'complete',
      value: ['created'],
      appliedElementIds: ['created']
    },
    previous: undefined,
    expected: 'created'
  }
])(
  'uses canonical identities from wrapped $method receipts for the next inspection',
  async ({ method, args, result, previous, expected }) => {
    const contract = basicApiContracts.find((api) => api.method === method)

    if (!contract) {
      throw new Error('Missing contract')
    }

    const execute = vi.fn(async (batch: AiActionBatch) => ({
      context: {},
      actionResults: batch.actions.map((action) => ({
        actionId: action.id,
        actionName: action.name,
        result:
          action.name === contract.name
            ? {
                ...result,
                mutationScope: {
                  complete: true,
                  elementIds: [expected],
                  removedElementIds: []
                }
              }
            : {
                available: true,
                complete: true,
                findings: [],
                evidence: { sessionId: 'canonical-receipt', revision: 1 }
              }
      }))
    }))
    const tools = createLocalOperationTools(
      [
        contract,
        {
          name: AiActionNames.REVIEW_DESIGN,
          description: 'Check',
          inputSchema: {}
        },
        {
          name: AiActionNames.INSPECT_DRAWING,
          description: 'Inspect',
          inputSchema: {}
        }
      ],
      {
        modelActions: (a) => a,

        resolveBatch: (v) => v
      },
      execute,
      { reviewTargetId: previous }
    )

    await tools.call(
      'execute_design',
      { operations: [{ name: contract.name, arguments: args }] },
      new AbortController().signal
    )
    expect(execute.mock.calls.at(-1)?.[0].actions[0]).toMatchObject({
      name: AiActionNames.INSPECT_DRAWING,
      arguments: { elementId: expected }
    })
  }
)

it('advertises admitted categories and includes their choices in invalid lookup recovery', async () => {
  const execute = vi.fn(async () => ({ actionResults: [], context: {} }))
  const admitted = basicApiContracts.filter((api) => api.owner === 'fill')
  const tools = createLocalOperationTools(
    admitted,
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute
  )
  const definition = tools.definitions.find(
    (tool) => tool.name === 'describe_design_apis'
  )

  expect(JSON.stringify(definition?.inputSchema)).toContain('"enum":["fill"]')
  expect(
    JSON.parse(
      await tools.call(
        'describe_design_apis',
        { names: ['prepare_design'] },
        new AbortController().signal
      )
    )
  ).toMatchObject({
    missingNames: ['prepare_design'],
    message: expect.stringContaining('Available categories: fill')
  })
  expect(
    JSON.parse(
      await tools.call(
        'describe_design_apis',
        { operation: 'missing.operation' },
        new AbortController().signal
      )
    )
  ).toMatchObject({
    missingOperations: ['missing.operation'],
    message: expect.stringContaining('Available categories: fill')
  })
  for (const selector of [{ category: 'creation' }]) {
    await expect(
      tools.call('describe_design_apis', selector, new AbortController().signal)
    ).rejects.toThrow('Available categories: fill')
  }

  expect(execute).not.toHaveBeenCalled()
})

it('keeps prepared targets and different Fill patches in one plural operation without an ID read', async () => {
  const ids = Array.from({ length: 400 }, (_, index) => `element-${index}`)
  const patches = ids.map((_, index) => ({ opacity: index / ids.length }))
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result: {
        status: 'complete',
        value: null,
        mutationScope: {
          complete: true,
          elementIds: ids,
          removedElementIds: []
        }
      }
    }))
  }))
  const resolveTargets = vi.fn(() => ids)
  const tools = createLocalOperationTools(
    basicApiContracts,
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v,

      resolveTargets
    },
    execute
  )

  for (const [name, args] of [
    ['api_fill_updateFillsAtIndex', { index: 0, patch: patches }],
    ['api_element_setElementsVisible', { visible: false }]
  ] as const) {
    await tools.call(
      'execute_design',
      {
        operations: [
          {
            name,
            arguments: args,
            target: {
              artifactId: 'prepared',
              keyPrefix: 'parts-',
              field: 'elementIds'
            }
          }
        ],
        inspection: 'defer'
      },
      new AbortController().signal
    )
  }

  expect(execute).toHaveBeenCalledTimes(2)
  for (const [batch] of execute.mock.calls) {
    expect(batch.actions).toHaveLength(1)
    expect(batch.actions[0].arguments).toMatchObject({ elementIds: ids })
  }

  expect(execute.mock.calls[0][0].actions[0].arguments).toMatchObject({
    patch: patches
  })
  expect(resolveTargets).toHaveBeenCalledTimes(2)
})

it('retrieves exact admitted category schemas through bounded read-only discovery', async () => {
  const execute = vi.fn(async () => ({ actionResults: [], context: {} }))
  const admitted = basicApiContracts.filter((api) => api.owner === 'fill')
  const tools = createLocalOperationTools(
    admitted,
    {
      modelActions: (actions) => actions,

      resolveBatch: (batch) => batch
    },
    execute
  )

  const call = async (args: unknown) =>
    JSON.parse(
      await readCompleteInformation(
        (input) =>
          tools.call(
            'describe_design_apis',
            input,
            new AbortController().signal
          ),
        args
      )
    )

  const expanded = await call({ category: 'fill', includeSchemas: true })
  const exact = await call({
    names: expanded.apis.map((api: { name: string }) => api.name)
  })

  expect(expanded.apis.length).toBeGreaterThan(0)
  expect(exact.apis.map((api: { name: string }) => api.name)).toEqual(
    expanded.apis.map((api: { name: string }) => api.name)
  )
  for (const api of exact.apis) {
    expect(api.inputSchema).toBeDefined()
  }

  for (const api of expanded.apis) {
    expect(api.inputSchema).toBeDefined()
  }

  const compact = await call({ category: 'fill' })

  expect(compact.apis.map((api: { name: string }) => api.name)).toEqual(
    expanded.apis.map((api: { name: string }) => api.name)
  )
  for (const api of compact.apis) {
    expect(api.inputSchema).toBeUndefined()
  }

  expect(await call({ category: 'fill', includeSchemas: false })).toEqual(
    compact
  )
  for (const args of [
    { includeSchemas: true },
    { names: [], includeSchemas: true },
    { category: 'fill', includeSchemas: 'true' },
    { category: 'fill', query: 'fill', includeSchemas: true },
    { category: 'unavailable', includeSchemas: true }
  ]) {
    await expect(call(args)).rejects.toThrow()
  }

  expect(execute).not.toHaveBeenCalled()
})

it('resolves mixed action and native names without discarding known matches or dispatching', async () => {
  const action = {
    name: AiActionNames.ORGANIZE_DESIGN,
    description: 'Organize',
    inputSchema: { type: 'object', required: ['elementIds'] }
  }
  const native = [
    {
      namespace: 'registered_operations',
      name: AiDesignToolIds.EXECUTE_DESIGN,
      description: 'Dispatch',
      inputSchema: { type: 'object', required: ['operations'] }
    },
    {
      namespace: 'registered_preparation',
      name: 'prepare_new_capability',
      description: 'New tool',
      inputSchema: { type: 'object', required: ['draft'] }
    },
    {
      namespace: 'registered_operations',
      ...action,
      inputSchema: { type: 'object', required: ['arguments'] }
    }
  ]
  const getNativeTools = vi.fn(() => native)
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    [action],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute,
    { getNativeTools }
  )

  const lookup = async (names: string[]) =>
    JSON.parse(
      await tools.call(
        'describe_design_apis',
        { names },
        new AbortController().signal
      )
    )

  const result = await lookup([
    action.name,
    AiDesignToolIds.EXECUTE_DESIGN,
    'prepare_new_capability',
    'unregistered'
  ])

  expect(result.apis).toEqual([
    expect.objectContaining({
      ...action,
      execution: {
        kind: 'batch-action',
        tool: AiDesignToolIds.EXECUTE_DESIGN
      }
    })
  ])
  expect(result.tools).toHaveLength(native.length)
  expect(result.tools).toEqual(
    expect.arrayContaining(
      native.map(
        ({ inputSchema: _schema, description: _description, ...tool }) =>
          expect.objectContaining({
            ...tool,
            execution: {
              kind: 'native-tool',
              namespace: tool.namespace,
              tool: tool.name
            }
          })
      )
    )
  )
  expect(result.missingNames).toEqual(['unregistered'])
  expect(
    (await lookup(['registered_preparation.prepare_new_capability'])).tools[0]
  ).toMatchObject({ name: native[1].name, namespace: native[1].namespace })
  for (const tool of result.tools) {
    const source = native.find(
      (entry) => entry.namespace === tool.namespace && entry.name === tool.name
    )

    expect(tool.inputSchema).toEqual(source?.inputSchema)
    expect(tool.description).toEqual(source?.description)
    expect(tool.definition.state).toBe('included')
  }

  const repeated = (
    await lookup(['registered_preparation.prepare_new_capability'])
  ).tools[0]

  expect(repeated.inputSchema).toBeDefined()
  expect(repeated.definition.state).toBe('included')
  const refreshed = JSON.parse(
    await tools.call(
      'describe_design_apis',
      repeated.definition.refresh.arguments,
      new AbortController().signal
    )
  ).tools[0]

  expect(refreshed.inputSchema).toEqual(native[1].inputSchema)
  expect(refreshed.definition.state).toBe('included')
  expect(getNativeTools).toHaveBeenCalledOnce()
  expect(execute).not.toHaveBeenCalled()
})

it('delivers both same-name route schemas in one lookup and invokes each without recovery discovery', async () => {
  const action = {
    name: AiActionNames.SELECT_ELEMENTS,
    description: 'Select explicit targets.',
    inputSchema: {
      type: 'object',
      properties: {
        elementIds: {
          'x-design-element-binding': 'all',
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['elementIds'],
      additionalProperties: false
    },
    ...toolSemantics(
      {
        type: 'object',
        properties: { selected: { type: 'integer', minimum: 0 } },
        required: ['selected'],
        additionalProperties: false
      },
      'mutation',
      ['selection']
    )
  }
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: batch.actions.map((item) => ({
      actionId: item.id,
      actionName: item.name,
      result: { selected: 2 }
    })),
    context: {}
  }))
  const owner = createOwner(
    [action],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute,
    {
      getNativeTools: () =>
        owner.definitions.map((tool) => ({
          ...tool,
          namespace: 'registered_operations'
        }))
    }
  )
  const signal = new AbortController().signal

  const read = async (args: unknown) =>
    JSON.parse(await owner.call('describe_design_apis', args, signal))

  const lookup = await read({ names: [action.name] })
  const queryLookup = await read({ query: action.name, view: 'full' })

  expect(queryLookup.apis).toEqual(lookup.apis)
  expect(queryLookup.tools).toEqual(lookup.tools)
  const native = lookup.tools[0]
  const batchAction = lookup.apis[0]
  const { operationInputIssue } = await import('../operation-input-schema')
  const { invokeLocalTool } = await import('../local-tool-invocation')
  const values = { elementIds: ['a', 'b'] }

  expect(batchAction.inputSchema).toEqual(action.inputSchema)
  expect(native.inputSchema).toEqual(
    owner.definitions.find((tool) => tool.name === action.name)?.inputSchema
  )
  expect(native.inputSchema).toBeDefined()
  expect(operationInputIssue(values, batchAction.inputSchema)).toBeUndefined()
  expect(operationInputIssue(values, native.inputSchema)).toBeDefined()
  expect(
    operationInputIssue({ arguments: values }, native.inputSchema)
  ).toBeUndefined()
  const result = await invokeLocalTool(
    owner,
    native,
    { arguments: values },
    signal
  )

  expect(result.success).toBe(true)
  await owner.call(
    batchAction.execution.tool,
    { operations: [{ name: batchAction.name, arguments: values }] },
    signal
  )
  expect(execute).toHaveBeenCalledTimes(2)
  for (const [batch] of execute.mock.calls) {
    expect(batch.actions[0]).toMatchObject({
      name: action.name,
      arguments: values
    })
  }

  const repeated = await read({ names: [action.name] })

  expect(repeated.apis[0].definition.state).toBe('included')
  expect(repeated.tools[0].definition.state).toBe('included')
  expect(repeated.apis[0].definition.refresh.arguments.operations).toEqual([
    action.name
  ])
  expect(repeated.tools[0].definition.refresh.arguments.names).toEqual([
    `registered_operations.${action.name}`
  ])
  const restored = await read(repeated.tools[0].definition.refresh.arguments)

  expect(restored.tools[0].inputSchema).toEqual(native.inputSchema)
})

it('retrieves usage and exact schema fragments without consuming full definition delivery', async () => {
  const action = {
    name: AiActionNames.ORGANIZE_DESIGN,
    description: 'Arrange supplied elements.',
    inputSchema: {
      type: 'object',
      required: ['rows'],
      properties: {
        rows: { type: 'array', items: { $ref: '#/$defs/row' } },
        unrelated: {
          description: 'Unrelated detail. '.repeat(300),
          type: 'string'
        }
      },
      $defs: {
        row: { type: 'object', properties: { next: { $ref: '#/$defs/row' } } },
        unused: { type: 'string' }
      }
    }
  }
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    [action],
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    execute
  )

  const read = (args: unknown) =>
    tools
      .call('describe_design_apis', args, new AbortController().signal)
      .then(JSON.parse)

  const usage = (
    await read({ query: 'Arrange supplied elements', view: 'usage' })
  ).apis[0]

  expect(usage.description).toBe(action.description)
  expect(usage.usageGuide.operationParameters).toBeDefined()
  expect(usage.definition.nextAction).toBe('execute-with-delivered-contract')
  expect(usage.inputSchema).toBeUndefined()
  expect(usage.inputFields).toContain('/properties/rows')
  expect(usage.definition.coverage).toBe('usage')
  const partial = (
    await read({
      operation: action.name,
      schemaPaths: ['/properties/rows/items']
    })
  ).apis[0]

  expect(partial.schemaFragments).toEqual([
    { path: '/properties/rows/items', schema: { $ref: '#/$defs/row' } }
  ])
  expect(partial.schemaReferences).toEqual({
    '#/$defs/row': action.inputSchema.$defs.row
  })
  expect(partial.definition.coverage).toBe('partial')
  expect(partial.inputSchema).toBeUndefined()
  const full = (await read({ names: [action.name] })).apis[0]

  expect(full.inputSchema).toEqual(action.inputSchema)
  expect(full.definition).toMatchObject({
    state: 'included',
    coverage: 'full',
    availableInResponse: true
  })
  const repeated = (await read({ names: [action.name] })).apis[0]

  expect(repeated.definition).toMatchObject({
    state: 'included',
    coverage: 'full',
    availableInResponse: true
  })
  expect(repeated.definition.nextAction).toBe(
    'use-response-or-recover-requested-scope'
  )
  expect(
    (await read(repeated.definition.refresh.arguments)).apis[0].inputSchema
  ).toEqual(action.inputSchema)
  expect(JSON.stringify(partial).length).toBeLessThan(
    JSON.stringify(full).length / 2
  )
  const menu = (await read({ query: 'Arrange supplied elements' })).apis[0]

  expect(menu.usageGuide).toBeUndefined()
  expect(JSON.stringify(menu).length).toBeLessThan(
    JSON.stringify(full).length / 2
  )
  expect(
    (await read({ names: [action.name], schemaPaths: ['/properties/missing'] }))
      .apis[0].schemaResolution
  ).toMatchObject({
    status: 'unavailable',
    issues: [{ path: '/properties/missing' }]
  })
  for (const query of [
    { query: 'design', schemaPaths: ['/properties/x'] },
    { names: [action.name], view: ['usage'] },
    { names: [action.name], schemaPaths: [] },
    { names: [action.name], schemaPaths: ['properties/rows'] },
    { names: [action.name], schemaPaths: ['/properties/rows'], view: 'usage' },
    {
      names: [action.name],
      view: 'usage',
      refresh: true,
      refreshReason: 'invalid'
    }
  ]) {
    await expect(read(query)).rejects.toThrow()
  }

  expect(execute).not.toHaveBeenCalled()
})

it('uses exact native schema paths with escaped names and keeps unknown paths recoverable', async () => {
  const native = {
    namespace: 'custom',
    name: 'inspect_custom',
    description: 'Custom input',
    inputSchema: {
      type: 'object',
      properties: { 'a/b~c': { type: 'boolean' }, blocked: false }
    }
  }
  const getNativeTools = vi.fn(() => [native])
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.ORGANIZE_DESIGN,
        description: 'Arrange',
        inputSchema: {}
      }
    ],
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    vi.fn(),
    { getNativeTools }
  )

  const read = (args: unknown) =>
    tools
      .call('describe_design_apis', args, new AbortController().signal)
      .then(JSON.parse)

  const partial = (
    await read({
      names: ['custom.inspect_custom'],
      schemaPaths: ['/properties/a~1b~0c', '/properties/blocked']
    })
  ).tools[0]

  expect(partial.schemaFragments).toEqual([
    { path: '/properties/a~1b~0c', schema: { type: 'boolean' } },
    { path: '/properties/blocked', schema: false }
  ])
  expect(partial.execution).toEqual({
    kind: 'native-tool',
    namespace: 'custom',
    tool: 'inspect_custom'
  })
  expect(
    (
      await read({
        names: ['custom.inspect_custom'],
        schemaPaths: ['/__proto__']
      })
    ).tools[0].schemaResolution
  ).toMatchObject({ status: 'unavailable', issues: [{ path: '/__proto__' }] })
  const full = (await read(partial.definition.refresh.arguments)).tools[0]

  expect(full.inputSchema).toEqual(native.inputSchema)
  expect(full.definition.state).toBe('included')
  expect(
    (await read({ names: ['custom.inspect_custom'], view: 'usage' })).tools[0]
      .definition.coverage
  ).toBe('usage')
  expect(getNativeTools).toHaveBeenCalledOnce()
})

it('returns requested action definitions on repeated reads with explicit context recovery', async () => {
  const action = {
    name: AiActionNames.ORGANIZE_DESIGN,
    description: 'An admitted operation',
    inputSchema: { type: 'object', required: ['value'] }
  }

  const create = () =>
    createLocalOperationTools(
      [action],
      {
        modelActions: (a) => a,

        resolveBatch: (b) => b
      },
      vi.fn()
    )

  const tools = create()

  const read = (args: unknown, owner = tools) =>
    owner
      .call('describe_design_apis', args, new AbortController().signal)
      .then(JSON.parse)

  await read({ category: 'design' })
  const first = (await read({ names: [action.name] })).apis[0]

  expect(first.inputSchema).toEqual(action.inputSchema)
  expect(first.definition.state).toBe('included')
  const repeated = (await read({ operation: action.name })).apis[0]

  expect(repeated.inputSchema).toBeDefined()
  expect(repeated.definition).toMatchObject({
    revision: first.definition.revision,
    state: 'included'
  })
  const recovered = (await read(repeated.definition.refresh.arguments)).apis[0]

  expect(recovered.inputSchema).toEqual(action.inputSchema)
  expect(recovered.definition.revision).toBe(first.definition.revision)
  expect(
    (await read({ names: [action.name] }, create())).apis[0].inputSchema
  ).toEqual(action.inputSchema)
  action.inputSchema.required = ['different']
  const changed = (await read({ names: [action.name] }, create())).apis[0]

  expect(changed.definition.revision).not.toBe(first.definition.revision)
  expect(changed.inputSchema.required).toEqual(['different'])
})

it('projects image receipts without leaking or duplicating identical image bytes', async () => {
  for (const count of [0, 1, 2]) {
    const receipt = {
      actionResults: Array.from({ length: count }, () => ({
        actionName: AiActionNames.INSPECT_DRAWING,
        result: {
          available: true,
          image: { dataUrl: png, width: 1, height: 1 }
        }
      }))
    }
    const content = await localToolContent(JSON.stringify(receipt))
    const texts = content.filter((item) => item.type === 'inputText')

    expect(texts).toHaveLength(1)
    expect(JSON.stringify(texts)).not.toContain('base64')
    expect(JSON.parse(texts[0].text).actionResults).toHaveLength(count)
    expect(content.filter((item) => item.type === 'inputImage')).toEqual(
      Array.from({ length: Math.min(count, 1) }, () => ({
        type: 'inputImage',
        imageUrl: png
      }))
    )
  }
})

it('retains the exact preparation rejection so the next call can correct it without dispatch', async () => {
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.APPLY_PREPARED_DESIGN,
        description: 'Apply',
        inputSchema: {}
      }
    ],
    {
      modelActions: (actions) => actions,

      resolveBatch: () => {
        throw new Error(
          'Prepared artifact expired: prepare a new artifact for this request'
        )
      }
    },
    execute
  )

  await expect(
    tools.call(
      'execute_design',
      {
        operations: [
          {
            name: AiActionNames.APPLY_PREPARED_DESIGN,
            arguments: { artifactId: 'expired' }
          }
        ]
      },
      new AbortController().signal
    )
  ).rejects.toThrow('Prepared artifact expired')
  expect(execute).not.toHaveBeenCalled()
})

it('rejects scalar region references inside target arrays before reading', async () => {
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.RESOLVE_DESIGN_TARGETS,
        description: 'Read',
        inputSchema: {
          type: 'object',
          properties: { scope: { type: 'string' }, bounds: { type: 'object' } }
        }
      },
      ...basicApiContracts
    ],
    {
      modelActions: (actions) => actions,

      resolveBatch: (batch) => batch
    },
    execute
  )

  await expect(
    tools.call(
      'execute_design',
      {
        inspection: 'defer',
        operations: [
          {
            name: basicActionName('deleteElements'),
            arguments: {},
            target: [
              {
                field: 'elementId',
                query: {
                  scope: 'region',
                  bounds: { x: 0, y: 0, width: 1, height: 1 }
                }
              }
            ]
          }
        ]
      },
      new AbortController().signal
    )
  ).rejects.toThrow(/registered argument path/)
  expect(execute).not.toHaveBeenCalled()
})

it.each(['invalid-bounds', 'snapshot', 'ambiguous'])(
  'rejects %s region target admission before any browser exchange',
  async (failure) => {
    const name = basicActionName('deleteElements')
    const read = createRegionTargetsAction(vi.fn())
    const inputSchema =
      failure === 'ambiguous'
        ? {
            anyOf: [
              read.inputSchema,
              {
                type: 'object',
                properties: {
                  scope: { const: 'region' },
                  bounds: { type: 'object' },
                  allMatches: { type: 'boolean' }
                }
              }
            ]
          }
        : read.inputSchema
    const execute = vi.fn()
    const tools = createLocalOperationTools(
      [
        { ...read, inputSchema },
        ...basicApiContracts.filter((api) => api.name === name)
      ],
      {
        modelActions: (actions) => actions,

        resolveBatch: (batch) => batch
      },
      execute
    )

    await expect(
      tools.call(
        'execute_design',
        {
          inspection: 'defer',
          operations: [
            {
              name,
              arguments: {},
              target: {
                field: 'elementIds',
                query:
                  failure === 'snapshot'
                    ? { scope: 'snapshot', snapshotId: 'not-a-region' }
                    : {
                        scope: 'region',
                        bounds: {
                          x: 0,
                          y: 0,
                          width: failure === 'invalid-bounds' ? -1 : 1,
                          height: 1
                        }
                      }
              }
            }
          ]
        },
        new AbortController().signal
      )
    ).rejects.toThrow()
    expect(execute).not.toHaveBeenCalled()
  }
)

it('resolves a region target once internally and supplies all IDs to one plural mutation', async () => {
  const name = basicActionName('deleteElements')
  const ids = Array.from({ length: 600 }, (_, i) => `match-${i}`)
  const read = createRegionTargetsAction(vi.fn())
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result:
        action.name === read.name
          ? {
              available: true,
              total: ids.length,
              nextOffset: null,
              elementIds: ids,
              elements: [],
              missingIds: []
            }
          : {
              status: 'complete',
              value: { removed: ids.map((elementId) => ({ elementId })) }
            }
    }))
  }))
  const tools = createLocalOperationTools(
    [read, ...basicApiContracts.filter((api) => api.name === name)],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute
  )
  const result = JSON.parse(
    await tools.call(
      'execute_design',
      {
        inspection: 'defer',
        operations: [
          {
            name,
            arguments: {},
            target: {
              field: 'elementIds',
              query: {
                scope: 'region',
                bounds: { x: 1, y: 2, width: 3, height: 4 },
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
    filter: { name: { prefix: 'roof-' } }
  })
  expect(execute.mock.calls[1][0].actions).toHaveLength(1)
  expect(execute.mock.calls[1][0].actions[0].arguments).toEqual({
    elementIds: ids
  })
  expect(result.actionResults).toHaveLength(1)
  expect(result.actionResults[0].actionName).toBe(name)
})

it.each([
  'incomplete',
  'empty',
  'cancelled',
  'wrong-count',
  'unknown-settlement'
])('does not mutate after a %s region query', async (failure) => {
  const controller = new AbortController()
  const name = basicActionName('deleteElements')
  const ids = failure === 'empty' ? [] : ['match']
  const read = {
    name: AiActionNames.RESOLVE_DESIGN_TARGETS,
    description: 'Read',
    inputSchema: {
      type: 'object',
      properties: {
        scope: { type: 'string' },
        bounds: { type: 'object' },
        filter: { type: 'object' },
        result: { type: 'string' },
        allMatches: { type: 'boolean' },
        expectedCount: { type: 'integer', minimum: 0 }
      }
    }
  }
  const execute = vi.fn(async (batch: AiActionBatch) => {
    if (failure === 'cancelled') {
      controller.abort()
    }

    return {
      context: {},
      actionResults: batch.actions.map((action) => ({
        actionId: action.id,
        actionName: action.name,
        result:
          action.name === read.name
            ? {
                available: true,
                ...(failure === 'unknown-settlement'
                  ? {
                      toolOutcome: { status: 'unknown', settlement: 'unknown' }
                    }
                  : {}),
                total: ids.length,
                nextOffset: failure === 'incomplete' ? 1 : null,
                elementIds: ids,
                elements: [],
                missingIds: []
              }
            : {
                status: 'complete',
                value: { removed: ids.map((elementId) => ({ elementId })) }
              }
      }))
    }
  })
  const tools = createLocalOperationTools(
    [read, ...basicApiContracts.filter((api) => api.name === name)],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute
  )

  const result = tools.call(
    'execute_design',
    {
      inspection: 'defer',
      operations: [
        {
          name,
          arguments: {},
          target: {
            field: 'elementIds',
            query: {
              scope: 'region',
              bounds: { x: 1, y: 2, width: 3, height: 4 },
              ...(failure === 'wrong-count' ? { expectedCount: 2 } : {})
            }
          }
        }
      ]
    },
    controller.signal
  )

  if (failure === 'empty' || failure === 'wrong-count') {
    expect(JSON.parse(await result)).toMatchObject({
      recovery: 'correct_input',
      settlement: 'not-started',
      toolOutcome: { status: 'failed', settlement: 'not-started' }
    })
    expect(execute.mock.calls[0][0].actions[0].arguments).not.toHaveProperty(
      'expectedCount'
    )
  } else {
    await expect(result).rejects.toThrow()
  }

  expect(execute).toHaveBeenCalledTimes(1)
  expect(execute.mock.calls[0][0].actions[0].name).toBe(read.name)
})

it('recovers only missing definition fields with explicit provenance and a reusable scoped route', async () => {
  const action = {
    name: AiActionNames.ORGANIZE_DESIGN,
    description: 'Arrange supplied elements.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['elementIds'],
      properties: {
        elementIds: { type: 'array', items: { type: 'string' }, minItems: 1 },
        unrelated: {
          type: 'string',
          description: 'Unrelated data. '.repeat(1000)
        }
      }
    }
  }
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    [action],
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    execute
  )

  const read = async (args: unknown) =>
    JSON.parse(
      await readCompleteInformation(
        (input) =>
          tools.call(
            'describe_design_apis',
            input,
            new AbortController().signal
          ),
        args
      )
    )

  const full = (await read({ names: [action.name] })).apis[0]

  expect(full.definition.deliveryReason).toBe('requested')
  const paths = ['/properties/elementIds']
  const partial = (
    await read({
      names: [action.name],
      schemaPaths: paths,
      refresh: true,
      refreshReason: 'missing-fields'
    })
  ).apis[0]

  expect(partial.definition).toMatchObject({
    revision: full.definition.revision,
    coverage: 'partial',
    deliveryReason: 'recovery',
    recoveryReason: 'missing-fields'
  })
  expect(partial.schemaFragments).toEqual([
    { path: paths[0], schema: action.inputSchema.properties.elementIds }
  ])
  expect(JSON.stringify(partial)).not.toContain('Unrelated data.')
  expect(partial.definition.recover.arguments).toMatchObject({
    operations: [action.name],
    schemaPaths: paths,
    refresh: true,
    refreshReason: 'delivery-failure'
  })
  const recovered = (await read(partial.definition.recover.arguments)).apis[0]

  expect(recovered.schemaFragments).toEqual(partial.schemaFragments)
  expect(recovered.inputSchema).toBeUndefined()
  expect(
    (await read({ names: [action.name] })).apis[0].definition.deliveryReason
  ).toBe('requested')
  const restored = (await read(partial.definition.refresh.arguments)).apis[0]

  expect(restored.inputSchema).toEqual(action.inputSchema)
  expect(restored.definition.recoveryReason).toBe('context-loss')
  const unspecified = (await read({ names: [action.name], refresh: true }))
    .apis[0]

  expect(unspecified.definition.recoveryReason).toBe('unknown')
  await expect(
    read({ names: [action.name], refreshReason: 'context-loss' })
  ).rejects.toThrow()
  await expect(
    read({ names: [action.name], refresh: true, refreshReason: 'guessed' })
  ).rejects.toThrow()
  expect(
    (
      await read({
        names: [action.name],
        schemaPaths: ['/missing'],
        refresh: true
      })
    ).apis[0].schemaResolution
  ).toMatchObject({ status: 'unavailable', issues: [{ path: '/missing' }] })
  expect(execute).not.toHaveBeenCalled()
})

it('reuses each exact partial definition scope and retains its parent constraints', async () => {
  const action = {
    name: AiActionNames.ORGANIZE_DESIGN,
    description: 'Change exactly one property',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['elementId'],
      oneOf: [{ required: ['x'] }, { required: ['y'] }],
      properties: {
        elementId: { 'x-design-element-binding': 'each', type: 'string' },
        x: { type: 'number' },
        y: { type: 'number' }
      }
    }
  }
  const tools = createLocalOperationTools(
    [action],
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    vi.fn()
  )

  const read = async (args: unknown) =>
    JSON.parse(
      await readCompleteInformation(
        (input) =>
          tools.call(
            'describe_design_apis',
            input,
            new AbortController().signal
          ),
        args
      )
    ).apis[0]

  const selector = { names: [action.name], schemaPaths: ['/properties/x'] }
  const first = await read(selector)

  expect(first.schemaContext).toContainEqual(
    expect.objectContaining({
      path: '',
      schema: expect.objectContaining({
        required: ['elementId'],
        oneOf: action.inputSchema.oneOf
      })
    })
  )
  const again = await read(selector)

  expect(again.definition).toMatchObject({
    state: 'included',
    availableInResponse: true,
    requestedCoverage: 'partial'
  })
  expect(again.schemaFragments).toEqual(first.schemaFragments)
  const other = await read({
    names: [action.name],
    schemaPaths: ['/properties/y']
  })

  expect(other.definition.availableInResponse).toBe(true)
  const recovered = await read(again.definition.recover.arguments)

  expect(recovered.schemaFragments).toEqual(first.schemaFragments)
  expect(recovered.schemaContext).toEqual(first.schemaContext)
  const full = await read({ names: [action.name] })

  expect(full.inputSchema).toEqual(action.inputSchema)
})

it('pages broad category discovery and gives registry candidates for an unknown operation', async () => {
  const tools = createLocalOperationTools(
    basicApiContracts,
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    vi.fn()
  )

  const read = async (args: unknown) =>
    JSON.parse(
      await readCompleteInformation(
        (input) =>
          tools.call(
            'describe_design_apis',
            input,
            new AbortController().signal
          ),
        args
      )
    )

  const inventory = await read({})
  const category = [...inventory.categories].sort(
    (a, b) => b.count - a.count
  )[0]
  let page = await read({ category: category.category })

  expect(page.apis.length).toBeLessThanOrEqual(16)
  const names: string[] = []

  while (true) {
    names.push(...page.apis.map((api) => api.name))
    if (page.complete) {
      break
    }

    expect(page.next.arguments.offset).toBe(names.length)
    page = await read(page.next.arguments)
  }

  expect(new Set(names).size).toBe(category.count)
  const missing = await read({ operation: 'fill.updateUnknownField' })

  expect(missing.apis).toEqual([])
  expect(missing.missingOperations).toEqual(['fill.updateUnknownField'])
  expect(missing.candidates.length).toBeGreaterThan(0)
  expect(missing.candidates.length).toBeLessThanOrEqual(6)
  for (const candidate of missing.candidates) {
    expect(
      basicApiContracts.some((api) => api.operation === candidate.operation)
    ).toBe(true)
  }
})

describe('registered union target admission', () => {
  it('binds known artifact IDs through the real context union without exporting identities', () => {
    const definition = createDocumentContextAction()
    const resolve = vi.fn(() => ['window-a', 'window-b'])
    const actions = prepareOperationBatch(
      [
        {
          name: definition.name,
          arguments: { scope: 'ids', fields: ['x'], delivery: 'reference' },
          target: { field: 'elementIds', artifactId: 'tower', keys: ['a', 'b'] }
        }
      ],
      [definition],
      resolve
    )

    expect(actions[0].arguments).toEqual({
      scope: 'ids',
      fields: ['x'],
      delivery: 'reference',
      elementIds: ['window-a', 'window-b']
    })
    expect(resolve).toHaveBeenCalledTimes(1)
  })
  it('rejects a target in an incompatible retained snapshot branch before resolution', () => {
    const definition = createDocumentContextAction()
    const resolve = vi.fn(() => ['window-a'])

    expect(() =>
      prepareOperationBatch(
        [
          {
            name: definition.name,
            arguments: { scope: 'snapshot', snapshotId: 'saved' },
            target: { field: 'elementIds', artifactId: 'tower' }
          }
        ],
        [definition],
        resolve
      )
    ).toThrow(/unambiguous/)
    expect(resolve).not.toHaveBeenCalled()
  })
})

it('binds multiple retained target sets to exact nested mapping query slots before complete admission', () => {
  const registered = [
    {
      name: 'mapping-contract',
      description: 'Mapping contract',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['mappings'],
        properties: {
          mappings: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['query'],
              properties: {
                query: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['scope', 'elementIds'],
                  properties: {
                    scope: { const: 'ids' },
                    elementIds: {
                      'x-design-element-binding': 'all',
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  ]
  const resolve = vi.fn((reference: unknown) => [
    (reference as { targetSetId: string }).targetSetId
  ])
  const operations = [
    {
      name: 'mapping-contract',
      arguments: {
        mappings: [{ query: { scope: 'ids' } }, { query: { scope: 'ids' } }]
      },
      target: [
        {
          field: 'elementIds',
          path: ['mappings', 0, 'query', 'elementIds'],
          artifactId: 'a',
          targetSetId: 'one'
        },
        {
          field: 'elementIds',
          path: ['mappings', 1, 'query', 'elementIds'],
          artifactId: 'a',
          targetSetId: 'two'
        }
      ]
    }
  ]
  const prepared = prepareOperationBatch(operations, registered, resolve)

  expect(prepared[0].arguments).toEqual({
    mappings: [
      { query: { scope: 'ids', elementIds: ['one'] } },
      { query: { scope: 'ids', elementIds: ['two'] } }
    ]
  })
  expect(resolve).toHaveBeenCalledTimes(2)
  expect(operations[0].arguments.mappings[0].query).toEqual({ scope: 'ids' })
  operations[0].target[1].path[1] = 3
  expect(() => prepareOperationBatch(operations, registered, resolve)).toThrow(
    /path|slot/i
  )
})

it('carries canonical attachment evidence from prepared review to the exact browser apply action', async () => {
  const stamp = { sessionId: 'scene', revision: 7 }
  const results: Record<string, unknown> = {
    [AiActionNames.READ_DESIGN_ATTACHMENT]: {
      available: true,
      parentId: 'parent',
      workspaceId: 'workspace',
      basis: [
        { x: 10, y: 20 },
        { x: 11, y: 20 },
        { x: 10, y: 21 }
      ],
      evidence: stamp
    },
    [AiActionNames.VALIDATE_INSPECTION_EVIDENCE]: {
      current: true,
      validatedAt: { sessionId: 'validation-fixture', revision: 1 }
    }
  }
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    batchId: batch.batchId,
    context: {},
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result: results[action.name] ?? {
        status: 'complete',
        compositionId: 'drawing'
      }
    }))
  }))
  const assess = vi.fn(async () => ({
    overall: { status: 'pass' as const, evidence: 'Attached local rectangle' },
    checks: [
      { criterionId: 'shape', status: 'pass' as const, evidence: 'Matches' }
    ]
  }))
  const tools = createLocalOperationTools(
    [
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.READ_DESIGN_ATTACHMENT,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
      AiActionNames.APPLY_PREPARED_DESIGN
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b,

      resolveRecipe: () => ({
        recipe: { type: 'rect' },
        findings: [],
        elementCount: 1
      })
    },
    execute,
    { assessPrepared: assess }
  )
  const signal = new AbortController().signal

  await tools.call(
    AiDesignToolIds.REVIEW_PREPARED_DESIGN,
    { artifactId: 'draft', parentId: 'parent' },
    signal
  )
  results[AiActionNames.READ_DESIGN_ATTACHMENT] = {
    ...(results[AiActionNames.READ_DESIGN_ATTACHMENT] as object),
    toolOutcome: { status: 'complete' },
    actionObservation: { handlerMs: 17, executor: 'app-browser' }
  }
  const repeated = JSON.parse(
    await tools.call(
      AiDesignToolIds.REVIEW_PREPARED_DESIGN,
      { artifactId: 'draft', parentId: 'parent' },
      signal
    )
  )

  expect(repeated).toMatchObject({ status: 'pass', reused: true })
  expect(assess).not.toHaveBeenCalled()
  await tools.call(
    AiActionNames.APPLY_PREPARED_DESIGN,
    {
      arguments: { artifactId: 'draft', parentId: 'parent' },
      inspection: 'defer'
    },
    signal
  )
  expect(execute.mock.calls.at(-1)?.[0].actions[0].arguments).toMatchObject({
    attachmentEvidence: {
      parentId: 'parent',
      workspaceId: 'workspace',
      evidence: stamp
    }
  })
  const calls = execute.mock.calls.length

  await expect(
    tools.call(
      AiActionNames.APPLY_PREPARED_DESIGN,
      {
        arguments: { artifactId: 'draft', parentId: 'other' },
        inspection: 'defer'
      },
      signal
    )
  ).rejects.toThrow(/parent/i)
  expect(execute).toHaveBeenCalledTimes(calls)
})

it('reports every target binding conflict before resolving or dispatching the recorded hierarchy edit', async () => {
  const resolveTargets = vi.fn(() => ['roof-a', 'roof-b'])
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result: { status: 'complete' }
    })),
    context: {}
  }))
  const tools = createLocalOperationTools(
    basicApiContracts,
    {
      modelActions: (actions) => actions,

      resolveBatch: (value) => value,

      resolveTargets
    },
    execute
  )
  const operation = {
    name: 'api_hierarchy_moveElementsRelative',
    arguments: {
      request: { elementIds: [], anchorId: 'pending', placement: 'before' }
    },
    target: [
      {
        artifactId: 'roof',
        keys: ['a', 'b'],
        field: 'elementIds',
        path: ['request', 'elementIds']
      },
      {
        artifactId: 'base',
        keys: ['roof'],
        field: 'elementId',
        path: ['request', 'anchorId']
      }
    ]
  }
  const before = structuredClone(operation)
  const error = await tools
    .call(
      'execute_design',
      { operations: [operation], inspection: 'defer' },
      new AbortController().signal
    )
    .then(
      () => {
        throw new Error('Expected target admission rejection')
      },
      (failure: Error) => failure
    )

  expect(error).toBeInstanceOf(LocalToolInputError)
  expect(error).toMatchObject({ recovery: 'correct_input' })
  expect(error.message).toContain('operations[0].target[0]')
  expect(error.message).toContain('arguments ["request","elementIds"]')
  expect(error.message).toMatch(/omit.*empty/i)
  expect(error.message).toContain('operations[0].target[1]')
  expect(error.message).toContain('registered supplied argument slot')
  expect(resolveTargets).not.toHaveBeenCalled()
  expect(execute).not.toHaveBeenCalled()
  expect(operation).toEqual(before)

  await tools.call(
    'execute_design',
    {
      operations: [
        {
          ...operation,
          arguments: {
            request: { anchorId: 'base-roof', placement: 'before' }
          },
          target: operation.target[0]
        }
      ],
      inspection: 'defer'
    },
    new AbortController().signal
  )
  expect(resolveTargets).toHaveBeenCalledTimes(1)
  expect(execute).toHaveBeenCalledTimes(1)
  expect(execute.mock.calls[0][0].actions[0].arguments).toEqual({
    request: {
      elementIds: ['roof-a', 'roof-b'],
      anchorId: 'base-roof',
      placement: 'before'
    }
  })
})

it('preflights later binding paths before resolving earlier valid retained sources', () => {
  const resolve = vi.fn(() => ['a'])
  const slot = {
    type: 'object',
    properties: {
      elementIds: {
        'x-design-element-binding': 'all',
        type: 'array',
        items: { type: 'string' }
      }
    }
  }
  const registered = [
    {
      name: 'pair',
      description: 'Pair',
      inputSchema: {
        type: 'object',
        properties: { source: slot, destination: slot }
      }
    }
  ]

  expect(() =>
    prepareOperationBatch(
      [
        {
          name: 'pair',
          arguments: {},
          target: [
            {
              artifactId: 'first',
              field: 'elementIds',
              path: ['source', 'elementIds']
            },
            {
              artifactId: 'second',
              field: 'elementIds',
              path: ['missing', 'elementIds']
            }
          ]
        }
      ],
      registered,
      resolve
    )
  ).toThrow(/target path/i)
  expect(resolve).not.toHaveBeenCalled()
})

it('reads compiler source checks from the actual preparation owner without another review invocation', async () => {
  const { createDesignPreparationSession } =
    await import('../design-preparation')
  const { createLocalDesignTools } = await import('../local-design-tools')
  const session = createDesignPreparationSession()
  const preparation = createLocalDesignTools(basicApiContracts, session)
  const execute = vi.fn()
  const owner = createLocalOperationTools(
    basicApiContracts,
    preparation,
    execute
  )
  const prepared = session.prepare({
    type: 'frame',
    name: 'Ready part',
    width: 10,
    height: 20,
    children: []
  })
  const result = JSON.parse(
    await owner.call(
      AiDesignToolIds.READ_DESIGN_CHECKS,
      { view: 'details', includePassed: true },
      new AbortController().signal
    )
  )

  expect(result.items).toContainEqual(
    expect.objectContaining({
      id: `prepared:${prepared.artifactId}:data`,
      status: 'pass',
      origin: 'tool',
      scope: [prepared.artifactId]
    })
  )
  expect(result.counts.pass).toBe(1)
  expect(execute).not.toHaveBeenCalled()
})

it.each([false, true])(
  'hands canonical verification through the host envelope (unresolved=%s)',
  async (unresolved) => {
    const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
    const { createDesignReviewAction } =
      await import('../../src/ai/review-action')
    const { createLocalToolHost } = await import('../local-tool-host')
    const signal = new AbortController().signal
    const review = createDesignReviewAction(async () => ({
      complete: true,
      truncated: false,
      checkedElements: 1,
      measuredTextCount: 0,
      measuredTextIds: [],
      findings: unresolved
        ? [
            {
              kind: 'container-overflow',
              elementId: 'part',
              message: 'Outside parent'
            }
          ]
        : []
    }))
    const select = {
      name: AiActionNames.SELECT_ELEMENTS,
      description: 'Select explicit targets.',
      composition: 'allowed' as const,
      inputSchema: {
        type: 'object',
        properties: {
          elementIds: {
            type: 'array',
            items: { type: 'string', 'x-runtime-value': 'document' }
          }
        },
        required: ['elementIds'],
        additionalProperties: false
      },
      ...toolSemantics(
        {
          type: 'object',
          properties: { selected: { type: 'integer', minimum: 0 } },
          required: ['selected'],
          additionalProperties: false
        },
        'mutation',
        ['selection']
      )
    }
    const dispatched: string[] = []
    const host = createLocalToolHost({
      requestId: 'verification-handoff',
      signal,
      capacity: 8,
      receiptCapacity: 4,
      artifactCapacity: 8,
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
          throw new Error('Deliberate storage unavailability')
        }
      },

      createGroups: () => [
        {
          name: 'operations',
          description: 'Canonical browser operations',
          owner: createOwner(
            [createAiToolContract(review), createAiToolContract(select)],
            {
              modelActions: (a) => a,

              resolveBatch: (v) => v
            },
            async (batch) => ({
              context: {},
              actionResults: await Promise.all(
                batch.actions.map(async (action) => {
                  dispatched.push(action.name)

                  return {
                    actionId: action.id,
                    actionName: action.name,
                    result:
                      action.name === review.name
                        ? await review.execute(
                            action.arguments as { elementId: string },
                            { signal }
                          )
                        : { selected: 1 }
                  }
                })
              )
            })
          )
        }
      ]
    })
    let serial = 0

    const invoke = async (name: string, input: unknown) =>
      JSON.parse(
        (await host.invoke({ name, input, callId: 'call-' + ++serial })).text
      )

    const selection = {
      kind: 'object',
      fields: {
        arguments: {
          kind: 'object',
          fields: {
            elementIds: { kind: 'array', items: [{ kind: 'input', path: '' }] }
          }
        }
      }
    }
    const proposal = {
      format: 1,
      name: 'verify-selected-part',
      revision: 1,
      description: 'Verify a selected target without inventing repairs.',
      inputSchema: {
        type: 'string',
        minLength: 1,
        maxLength: 256,
        'x-runtime-value': 'document'
      },
      outputSchema: {
        type: 'string',
        minLength: 1,
        maxLength: 256,
        'x-runtime-value': 'document'
      },
      steps: [
        {
          id: 'select',
          tool: 'operations.' + select.name,
          revision: select.revision + 1,
          input: selection
        }
      ],
      iteration: {
        id: 'verified',
        stateSchema: {
          type: 'string',
          minLength: 1,
          maxLength: 256,
          'x-runtime-value': 'document'
        },
        state: { kind: 'input', path: '' },
        check: {
          id: 'check',
          tool: 'operations.' + review.name,
          revision: review.revision,
          input: {
            kind: 'object',
            fields: {
              arguments: {
                kind: 'object',
                fields: { elementId: { kind: 'state', path: '' } }
              }
            }
          }
        },
        repairs: [
          {
            id: 'reselect',
            tool: 'operations.' + select.name,
            revision: select.revision + 1,
            input: selection
          }
        ],
        next: { kind: 'state', path: '' },
        maxIterations: 2
      },
      output: { kind: 'step', step: 'verified', path: '/state' }
    }

    try {
      const admitted = await invoke('tool_library.submit_tool', {
        submissionId: 'verify',
        proposal
      })

      expect(admitted, JSON.stringify(admitted)).toMatchObject({ ok: true })
      const result = await invoke('tool_library.invoke_tool', {
        name: proposal.name,
        revision: 1,
        input: 'part'
      })

      expect(result.execution, JSON.stringify(result)).toMatchObject({
        status: unresolved ? 'failed' : 'success'
      })
      expect(dispatched).toEqual(
        unresolved
          ? [select.name, review.name, select.name, review.name]
          : [select.name, review.name]
      )
      if (!unresolved) {
        expect(result.storage).toMatchObject({ status: 'unsaved' })
      }
    } finally {
      await host.dispose()
    }
  }
)

it('retains canonical target checks and invalidates only changed dependencies without remeasurement', async () => {
  const revisions = new Map(
    Array.from({ length: 8 }, (_, i) => ['section-' + i, 1])
  )
  const findings = new Map<string, unknown[]>([
    ['section-2', [{ kind: 'text-overflow', elementId: 'deleted-text' }]],
    ['section-5', [{ kind: 'container-overflow', elementId: 'other-part' }]]
  ])
  let incomplete = false
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => {
      const target = String(action.arguments.elementId)
      const evidence = {
        sessionId: 'doc',
        receiptId: target,
        revision: revisions.get(target) ?? 0
      }
      const prior = action.arguments.evidence as typeof evidence

      return {
        actionId: action.id,
        actionName: action.name,
        result:
          action.name === AiActionNames.REVIEW_DESIGN
            ? {
                complete: !incomplete,
                truncated: incomplete,
                findings: findings.get(target) ?? [],
                measuredTextIds: [],
                evidence
              }
            : { current: revisions.get(prior.receiptId) === prior.revision }
      }
    })
  }))
  const owner = createLocalOperationTools(
    [
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute
  )
  const signal = new AbortController().signal

  const review = (elementId: string) =>
    owner.call(
      AiActionNames.REVIEW_DESIGN,
      { arguments: { elementId } },
      signal
    )

  const read = async (includePassed = false) =>
    JSON.parse(
      await owner.call(
        AiDesignToolIds.READ_DESIGN_CHECKS,
        { view: 'details', includePassed },
        signal
      )
    )

  for (const target of revisions.keys()) {
    await review(target)
  }

  expect((await read()).counts).toEqual({
    pass: 6,
    fail: 2,
    unverified: 0,
    stale: 0
  })
  const previous = await read(true)

  execute.mockClear()
  expect((await read(true)).items).toEqual(previous.items)
  expect(
    execute.mock.calls
      .flatMap(([batch]) => batch.actions)
      .every(
        (action) => action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
      )
  ).toBe(true)
  revisions.set('section-2', 2)
  findings.delete('section-2') // The overflowing child was removed, so no measuredTextIds can clear it.
  const stale = await read()

  expect(stale.counts).toEqual({ pass: 6, fail: 1, unverified: 0, stale: 1 })
  expect(
    stale.items.find((item: { status: string }) => item.status === 'stale')
      .scope
  ).toEqual(['section-2'])
  await review('section-2')
  expect((await read()).counts).toEqual({
    pass: 7,
    fail: 1,
    unverified: 0,
    stale: 0
  })
  expect((await read()).items[0].scope).toEqual(['section-5'])
  const outcome = {
    batchId: 'done',
    actions: [
      {
        id: 'done',
        name: AiActionNames.REPORT_OUTCOME,
        arguments: { outcome: 'completed' },
        summary: 'Done'
      }
    ]
  }

  expect(owner.settleOutcome(outcome).actions[0].arguments.outcome).toBe(
    'completed'
  )
  incomplete = true
  findings.delete('section-5')
  await review('section-5')
  expect((await read()).items[0].status).not.toBe('pass')
  expect(owner.settleOutcome(outcome).actions[0].arguments.outcome).toBe(
    'completed'
  )
  incomplete = false
  await review('section-5')
  expect((await read()).counts).toEqual({
    pass: 8,
    fail: 0,
    unverified: 0,
    stale: 0
  })
  expect(owner.settleOutcome(outcome).actions[0].arguments.outcome).toBe(
    'completed'
  )
})

it.each([AiActionNames.REVIEW_DESIGN])(
  'does not retain a cancelled measurement from %s',
  async (name) => {
    const controller = new AbortController()
    const owner = createLocalOperationTools(
      [
        AiActionNames.REVIEW_DESIGN,
        AiActionNames.UPDATE_DESIGN_ELEMENT,
        AiActionNames.VALIDATE_INSPECTION_EVIDENCE
      ].map((action) => ({
        name: action,
        description: action,
        inputSchema: {}
      })),
      {
        modelActions: (a) => a,

        resolveBatch: (v) => v
      },
      async (batch) => ({
        context: {},
        actionResults: batch.actions.map((action) => {
          if (action.name === AiActionNames.REVIEW_DESIGN) {
            controller.abort()
          }

          return {
            actionId: action.id,
            actionName: action.name,
            result:
              action.name === AiActionNames.REVIEW_DESIGN
                ? {
                    complete: true,
                    truncated: false,
                    findings: [],
                    measuredTextIds: [],
                    evidence: { sessionId: 'doc', revision: 1 }
                  }
                : {
                    current: true,
                    validatedAt: {
                      sessionId: 'validation-fixture',
                      revision: 1
                    },
                    compositionId: 'part'
                  }
          }
        })
      })
    )

    await expect(
      owner.call(name, { arguments: { elementId: 'part' } }, controller.signal)
    ).rejects.toThrow()
    const checks = JSON.parse(
      await owner.call(
        AiDesignToolIds.READ_DESIGN_CHECKS,
        { view: 'details', includePassed: true },
        new AbortController().signal
      )
    )

    expect(checks.counts).toEqual({ pass: 0, fail: 0, stale: 0, unverified: 0 })
    expect(checks.items).toEqual([])
  }
)

it('refreshes upstream measurement currency when only a downstream check is requested', async () => {
  const { createDesignCheckResults } = await import('../design-check-results')
  const checks = createDesignCheckResults()
  let current = true
  const owner = createLocalOperationTools(
    [
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v,

      checkResults: checks
    },
    async (batch) => ({
      context: {},
      actionResults: batch.actions.map((action) => ({
        actionId: action.id,
        actionName: action.name,
        result:
          action.name === AiActionNames.REVIEW_DESIGN
            ? {
                complete: true,
                truncated: false,
                findings: [],
                measuredTextIds: [],
                evidence: { sessionId: 'doc', revision: 1, receiptId: 'scope' }
              }
            : { current }
      }))
    })
  )
  const signal = new AbortController().signal

  await owner.call(
    AiActionNames.REVIEW_DESIGN,
    { arguments: { elementId: 'section' } },
    signal
  )
  const upstream = checks.read({ includePassed: true }).items[0]

  checks.record({
    id: 'dependent',
    origin: 'tool',
    status: 'pass',
    evidence: 'Depends on the measured section',
    dependencies: { ['check:' + upstream.id]: String(upstream.revision) }
  })
  current = false
  const result = JSON.parse(
    await owner.call(
      AiDesignToolIds.READ_DESIGN_CHECKS,
      { ids: ['dependent'], includePassed: true },
      signal
    )
  )

  expect(result.items).toHaveLength(1)
  expect(result.items[0]).toMatchObject({ id: 'dependent', status: 'stale' })
})

it('does not schedule quality checks for creation and deletion in the same batch', async () => {
  const checked: string[] = []
  const operations = createLocalOperationTools(
    [
      ...basicApiContracts,
      {
        name: AiActionNames.REVIEW_DESIGN,
        description: 'Check',
        inputSchema: {}
      }
    ],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    async (batch) => ({
      context: {},
      actionResults: batch.actions.map((action) => {
        let result: AiJsonValue

        if (action.name === basicActionName('createElements')) {
          result = {
            status: 'complete',
            value: ['temporary', 'keep'],
            appliedElementIds: ['temporary', 'keep'],
            mutationScope: {
              complete: true,
              elementIds: ['temporary', 'keep'],
              removedElementIds: []
            }
          }
        } else if (action.name === basicActionName('deleteElements')) {
          result = {
            status: 'complete',
            value: { removed: [{ elementId: 'temporary' }] },
            mutationScope: {
              complete: true,
              elementIds: [],
              removedElementIds: ['temporary']
            }
          }
        } else {
          checked.push(String(action.arguments.elementId))
          result = {
            complete: true,
            findings: [],
            evidence: { sessionId: 'surviving-targets', revision: 1 }
          }
        }

        return { actionId: action.id, actionName: action.name, result }
      })
    })
  )

  await operations.call(
    'execute_design',
    {
      inspection: 'defer',
      operations: [
        {
          name: basicActionName('createElements'),
          arguments: {
            createOptions: [{ type: 'rectangle' }, { type: 'rectangle' }]
          }
        },
        {
          name: basicActionName('deleteElements'),
          arguments: { elementIds: ['temporary'] }
        }
      ]
    },
    new AbortController().signal
  )
  expect(checked).toEqual([])
})

it.each([AiActionNames.ARRANGE_DESIGN, AiActionNames.MAP_RETAINED_FILLS])(
  'preserves native mutation results from %s without scheduling quality checks',
  async (name) => {
    const checked: string[] = []
    const tools = createLocalOperationTools(
      [name, AiActionNames.REVIEW_DESIGN].map((name) => ({
        name,
        description: name,
        inputSchema: {}
      })),
      {
        modelActions: (value) => value,

        resolveBatch: (value) => value
      },
      async (batch) => ({
        context: {},
        actionResults: batch.actions.map((action) => {
          if (action.name === name) {
            return {
              actionId: action.id,
              actionName: name,
              result:
                name === AiActionNames.MAP_RETAINED_FILLS
                  ? {
                      status: 'complete',
                      appliedCount: 2,
                      mutationScope: {
                        complete: true,
                        elementIds: ['a', 'b'],
                        removedElementIds: []
                      }
                    }
                  : { status: 'complete', appliedElementIds: ['a', 'b'] }
            }
          }

          checked.push(String(action.arguments.elementId))

          return {
            actionId: action.id,
            actionName: action.name,
            result: {
              available: true,
              complete: true,
              findings: [],
              evidence: { sessionId: 'native-applied', revision: 1 }
            }
          }
        })
      })
    )

    await tools.call(
      'execute_design',
      { inspection: 'defer', operations: [{ name, arguments: {} }] },
      new AbortController().signal
    )
    expect(checked).toEqual([])
  }
)

describe('deterministic regional image checks', () => {
  const region = { x: 10, y: 20, width: 4, height: 4 }

  const setup = async () => {
    const baseline = await sharp({
      create: { width: 8, height: 8, channels: 4, background: 'white' }
    })
      .png()
      .toBuffer()
    const exact = await sharp(baseline)
      .extract({ left: 2, top: 2, width: 4, height: 4 })
      .png()
      .toBuffer()
    let image = exact
    let current = true
    let revision = 1
    let validations = 0

    let validationHook: () => void = () => undefined

    const invalidReceipts = new Set<string>()
    const results = createDesignCheckResults()
    const images = createLocalImageTools({
      metadata: {
        imageAttachments: [
          { dataUrl: `data:image/png;base64,${baseline.toString('base64')}` }
        ]
      }
    })

    await images.call(
      'validate_reference_images',
      { attachmentIndexes: [0] },
      new AbortController().signal
    )
    const tools = createLocalOperationTools(
      [
        AiActionNames.INSPECT_DRAWING,
        AiActionNames.VALIDATE_INSPECTION_EVIDENCE
      ].map((name) => ({ name, description: name, inputSchema: {} })),
      {
        modelActions: (a) => a,

        resolveBatch: (b) => b,

        checkResults: results
      },
      async (batch) => ({
        context: {},
        actionResults: batch.actions.map((action) => ({
          actionId: action.id,
          actionName: action.name,
          result:
            action.name === AiActionNames.INSPECT_DRAWING
              ? {
                  available: true,
                  background: '#ffffff',
                  imageScope: 'region',
                  evidence: {
                    sessionId: 'pixel-check',
                    revision,
                    receiptId: `region-${revision}`
                  },
                  image: {
                    dataUrl: `data:image/png;base64,${image.toString('base64')}`
                  }
                }
              : {
                  current:
                    (++validations,
                    validationHook(),
                    current &&
                      !invalidReceipts.has(
                        String(
                          (
                            action.arguments as {
                              evidence: { receiptId: string }
                            }
                          ).evidence.receiptId
                        )
                      )),
                  validatedAt: { sessionId: 'pixel-check', revision }
                }
        }))
      }),
      {
        validateReferences: images.validateReferences,
        referenceImages: images.referenceImages
      }
    )

    const call = async (
      name: string,
      args: unknown,
      signal = new AbortController().signal
    ) => JSON.parse(await tools.call(name, args, signal))

    const capture = async (
      elementId = 'third-tier',
      captureRegion: typeof region | undefined = region
    ) =>
      (
        await call(AiActionNames.INSPECT_DRAWING, {
          arguments: { elementId, region: captureRegion }
        })
      ).actionResults[0].result.inspectionId as string

    await call(AiDesignToolIds.SELECT_DESIGN_REFERENCES, {
      referenceImageIndexes: [0],
      references: [
        {
          referenceId: images.validateReferences([0])[0].referenceId,
          purpose: 'Aligned pixel comparison',
          region: 'whole'
        }
      ]
    })
    const request = {
      checkId: 'left-windows',
      inspectionId: await capture(),
      referenceImageIndex: 0,
      referenceRegion: { x: 2, y: 2, width: 4, height: 4 },
      channelTolerance: 0,
      maxDifferentFraction: 0
    }

    return {
      tools,
      call,
      results,
      request,
      capture,

      setImage: (value: Buffer) => {
        image = value
        revision++
      },

      setCurrent: (value: boolean) => {
        current = value
      },

      validations: () => validations,

      nextRevision: () => {
        revision++
      },

      invalidate: (receipt: string) => invalidReceipts.add(receipt),

      onValidate: (hook: () => void) => {
        validationHook = hook
      }
    }
  }

  it('rejects an unspecified reference crop before pixel work and preserves the existing check on retry', async () => {
    const f = await setup()
    const first = await f.call(AiDesignToolIds.CHECK_DRAWING_IMAGE, f.request)
    const before = f.results.read({ includePassed: true })
    const invalid = { ...f.request } as Partial<typeof f.request>

    delete invalid.referenceRegion
    await expect(
      f.call(AiDesignToolIds.CHECK_DRAWING_IMAGE, invalid)
    ).rejects.toThrow(/referenceRegion/)
    expect(f.results.read({ includePassed: true })).toEqual(before)
    const retry = await f.call(AiDesignToolIds.CHECK_DRAWING_IMAGE, f.request)

    expect(retry).toMatchObject({
      reused: true,
      resultId: first.resultId,
      pixelReads: 0
    })
  })

  it('registers a strict check and reuses current evidence without repeating pixel work', async () => {
    const f = await setup()

    expect(
      f.tools.definitions.some((tool) => tool.name === 'check_drawing_image')
    ).toBe(true)
    const decode = vi.spyOn(sharp.prototype, 'toBuffer')
    const first = await f.call('check_drawing_image', f.request)

    expect(decode).toHaveBeenCalledTimes(2)
    expect(first).toMatchObject({
      status: 'pass',
      appearance: 'unverified',
      reused: false,
      comparedPixels: 16,
      differentPixels: 0,
      pixelReads: 16
    })
    f.nextRevision() // An unrelated document revision is not an image dependency.
    const again = await f.call('check_drawing_image', {
      ...f.request,
      checkId: first.checkId
    })

    expect(first.resultId).toBe('image:left-windows')
    expect(decode).toHaveBeenCalledTimes(2)
    decode.mockRestore()
    expect(again).toMatchObject({ status: 'pass', reused: true, pixelReads: 0 })
    expect(f.validations()).toBeGreaterThanOrEqual(3)
    expect(
      f.results
        .read({ includePassed: true })
        .items.filter((item) => item.origin === 'tool')
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'image:left-windows',
          origin: 'tool',
          status: 'pass'
        })
      ])
    )
    f.setCurrent(false)
    const stale = await f.call(AiDesignToolIds.READ_DESIGN_CHECKS, {
      ids: ['image:left-windows'],
      includePassed: true
    })

    expect(stale.items[0].status).toBe('stale')
    await expect(f.call('check_drawing_image', f.request)).rejects.toThrow(
      /inspection|evidence/i
    )
  })

  it('keeps a local defect until corrected under the same frozen baseline and tolerance', async () => {
    const f = await setup()
    const raw = Buffer.alloc(4 * 4 * 4, 255)

    raw[4 * (1 + 2 * 4)] = 0
    raw[4 * (1 + 2 * 4) + 1] = 0
    raw[4 * (1 + 2 * 4) + 2] = 0
    f.setImage(
      await sharp(raw, { raw: { width: 4, height: 4, channels: 4 } })
        .png()
        .toBuffer()
    )
    f.request.inspectionId = await f.capture()
    expect(await f.call('check_drawing_image', f.request)).toMatchObject({
      status: 'fail',
      differentPixels: 1,
      differenceBounds: { x: 11, y: 22, width: 1, height: 1 }
    })
    await expect(
      f.call('check_drawing_image', { ...f.request, channelTolerance: 255 })
    ).rejects.toThrow(/baseline|tolerance|configuration/i)
    expect(
      f.results.read().items.filter((item) => item.origin === 'tool')[0].status
    ).toBe('fail')
    f.setImage(
      await sharp({
        create: { width: 4, height: 4, channels: 4, background: 'white' }
      })
        .png()
        .toBuffer()
    )
    f.request.inspectionId = await f.capture()
    expect(await f.call('check_drawing_image', f.request)).toMatchObject({
      status: 'pass',
      pixelReads: 16,
      reused: false
    })
    expect(
      f.results.read().items.filter((item) => item.origin === 'tool')
    ).toHaveLength(0)
  })

  it('does not pass mismatched dimensions or publish a cancelled check', async () => {
    const f = await setup()

    f.setImage(
      await sharp({
        create: { width: 3, height: 4, channels: 4, background: 'white' }
      })
        .png()
        .toBuffer()
    )
    f.request.inspectionId = await f.capture()
    expect(await f.call('check_drawing_image', f.request)).toMatchObject({
      status: 'unverified',
      appearance: 'unverified',
      pixelReads: 0
    })
    const abort = new AbortController()

    abort.abort()
    await expect(
      f.call(
        'check_drawing_image',
        { ...f.request, checkId: 'cancelled' },
        abort.signal
      )
    ).rejects.toThrow()
    expect(
      f.results
        .read({ includePassed: true })
        .items.filter((item) => item.origin === 'tool')
    ).toHaveLength(1)
  })

  it('redisplays historical pixels after invalidation without certifying currency or crossing requests', async () => {
    const f = await setup()
    const id = f.request.inspectionId

    f.invalidate('region-1')
    await expect(f.call('check_drawing_image', f.request)).rejects.toThrow(
      /stale/
    )
    const restored = await f.call(AiDesignToolIds.READ_DESIGN_INSPECTIONS, {
      inspectionIds: [id]
    })

    expect(restored.captureState).toBe('saved-snapshot')
    expect(restored.captures).toEqual([
      { inspectionId: id, elementId: 'third-tier', view: 'detail', region }
    ])
    expect(restored.actionResults[0].result.inspectionId).toBe(id)
    expect(restored.actionResults[0].result.evidence.revision).toBe(1)
    await expect(f.call('check_drawing_image', f.request)).rejects.toThrow(
      /stale/
    )
    const fresh = await setup()

    await expect(
      fresh.call(AiDesignToolIds.READ_DESIGN_INSPECTIONS, {
        inspectionIds: [id]
      })
    ).rejects.toThrow(/unavailable/)
    const cancelled = new AbortController()

    cancelled.abort()
    await expect(
      f.call(
        AiDesignToolIds.READ_DESIGN_INSPECTIONS,
        { inspectionIds: [id] },
        cancelled.signal
      )
    ).rejects.toThrow(/cancelled/)
  })

  it('invalidates only the changed image in default retained-check reads', async () => {
    const f = await setup()

    await f.call('check_drawing_image', f.request)
    f.nextRevision()
    const other = {
      ...f.request,
      checkId: 'eighth-windows',
      inspectionId: await f.capture('eighth-tier')
    }

    await f.call('check_drawing_image', other)
    f.invalidate('region-1')
    const read = await f.call(AiDesignToolIds.READ_DESIGN_CHECKS, {
      view: 'details',
      includePassed: true
    })

    expect(
      read.items.map((item: { id: string; status: string }) => [
        item.id,
        item.status
      ])
    ).toEqual(
      expect.arrayContaining([
        ['image:left-windows', 'stale'],
        ['image:eighth-windows', 'pass']
      ])
    )
    expect(await f.call('check_drawing_image', other)).toMatchObject({
      reused: true,
      pixelReads: 0
    })
  })

  it.each(['changed', 'cancelled'] as const)(
    'refuses a pass when evidence is %s during pixel analysis',
    async (failure) => {
      const f = await setup()
      const abort = new AbortController()

      f.onValidate(() => {
        if (f.validations() === 2) {
          if (failure === 'cancelled') {
            abort.abort()
          } else {
            f.setCurrent(false)
          }
        }
      })
      await expect(
        f.call('check_drawing_image', f.request, abort.signal)
      ).rejects.toThrow()
      expect(
        f.results
          .read({ includePassed: true })
          .items.filter((item) => item.origin === 'tool')
      ).toHaveLength(0)
    }
  )

  it('allows a native capture to resolve an unsupported first overview without relaxing the baseline', async () => {
    const f = await setup()
    const overview = await f.call(AiActionNames.INSPECT_DRAWING, {
      arguments: { elementId: 'third-tier' }
    })
    const initial = {
      ...f.request,
      inspectionId: overview.actionResults[0].result.inspectionId
    }

    expect(await f.call('check_drawing_image', initial)).toMatchObject({
      status: 'unverified'
    })
    expect(await f.call('check_drawing_image', f.request)).toMatchObject({
      status: 'pass'
    })
  })

  it('handles transparent pixels on white and reports unsupported images without visual certification', async () => {
    const f = await setup()

    f.setImage(
      await sharp({
        create: {
          width: 4,
          height: 4,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .png()
        .toBuffer()
    )
    f.request.inspectionId = await f.capture()
    expect(await f.call('check_drawing_image', f.request)).toMatchObject({
      status: 'pass',
      appearance: 'unverified'
    })
    f.setImage(Buffer.from('invalid PNG'))
    const corrupt = {
      ...f.request,
      checkId: 'broken-image',
      inspectionId: await f.capture()
    }

    expect(await f.call('check_drawing_image', corrupt)).toMatchObject({
      status: 'unverified',
      pixelReads: 0
    })
    await expect(
      f.call('check_drawing_image', { ...f.request, referenceImageIndex: 50 })
    ).rejects.toThrow(/reference|attachment/i)
    await expect(
      f.call('check_drawing_image', { ...f.request, channelTolerance: -1 })
    ).rejects.toThrow()
  })
})

it('resolves sixteen region edits through the real query owner with all retained slots pinned', async () => {
  const signal = new AbortController().signal
  const source = {
    getCurrentWorkspaceId: () => 'workspace',

    getSelectedElementIds: () => [],

    getElementChildren: () => ({
      available: true,
      elementIds: [],
      total: 0,
      nextOffset: null
    }),

    getElementIdsInBounds: vi.fn((bounds: { x: number }) => [
      `part-${bounds.x}`
    ]),

    getElementMetadata: (id: string) => ({
      name: id,
      type: 'rectangle',
      parentId: 'workspace',
      lock: false
    }),

    getElementComputedData: () => ({})
  }
  const store = createRetainedDesignContext(source, () => () => undefined)

  const region = (x: number) => ({
    scope: 'region' as const,
    bounds: { x, y: 0, width: 1, height: 1 }
  })

  const pinned = Array.from({ length: 8 }, (_, x) =>
    store.read(
      { ...region(x), result: 'ids', allMatches: true, delivery: 'reference' },
      signal
    )
  )
  const read = createRegionTargetsAction(store.read)
  const write = basicApiContracts.find(
    (api) => api.operation === 'fill.updateFillsAtIndex'
  )

  if (!write) {
    throw new Error('Missing canonical fill operation')
  }

  const writes: unknown[] = []
  const dispatch = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: await Promise.all(
      batch.actions.map(async (action) => {
        if (action.name === read.name) {
          return {
            actionId: action.id,
            actionName: action.name,
            result: (await read.execute(action.arguments as never, {
              signal
            })) as AiJsonValue
          }
        }

        writes.push(action.arguments)

        return {
          actionId: action.id,
          actionName: action.name,
          result: {
            status: 'complete',
            value: null,
            mutationScope: {
              complete: true,
              elementIds: [],
              removedElementIds: []
            },
            toolOutcome: { status: 'success', settlement: 'completed' }
          } as AiJsonValue
        }
      })
    )
  }))
  const tools = createLocalOperationTools(
    [read, write],
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    dispatch
  )

  try {
    await tools.call(
      'execute_design',
      {
        inspection: 'defer',
        operations: Array.from({ length: 17 }, (_, x) => ({
          name: write.name,
          arguments: { index: 0, patch: { opacity: 0.8 } },
          target: {
            field: 'elementIds',
            query:
              x === 16
                ? { bounds: region(15).bounds, scope: 'region' }
                : region(x)
          }
        }))
      },
      signal
    )
    expect(writes).toHaveLength(17)
    expect(
      writes.map((item) => (item as { elementIds: string[] }).elementIds)
    ).toEqual(Array.from({ length: 17 }, (_, x) => [`part-${Math.min(x, 15)}`]))
    expect(source.getElementIdsInBounds).toHaveBeenCalledTimes(16)
    for (const snapshot of pinned) {
      expect(
        store.get(snapshot.snapshotId, snapshot.leaseId, signal)
      ).toBeDefined()
    }
  } finally {
    store.dispose()
  }
})

it.each([
  { toolOutcome: { status: 'partial', settlement: 'partial' } },
  { toolOutcome: { status: 'failed', settlement: 'unknown' } },
  { toolOutcome: { status: 'unknown', settlement: 'unknown' } },
  { toolOutcome: { status: 'success', settlement: 'not-started' } },
  {
    toolOutcome: {
      status: 'success',
      settlement: 'completed',
      evidence: 'keep'
    }
  },
  { delivery: { status: 'unavailable', message: 'Do not replay' } },
  {
    mutationScope: {
      complete: true,
      elementIds: [],
      removedElementIds: [],
      evidence: 'keep'
    }
  }
])(
  'preserves non-aggregate canonical acknowledgement evidence: %j',
  async (extension) => {
    const name = basicActionName('updateFillsAtIndex')
    const result = {
      status: 'complete',
      value: null,
      application: 'not-reported',
      mutationScope: { complete: true, elementIds: [], removedElementIds: [] },
      toolOutcome: { status: 'success', settlement: 'completed' },
      ...extension
    }
    const dispatch = vi.fn(async (batch: AiActionBatch) => ({
      context: {},
      actionResults: batch.actions.map((action) => ({
        actionId: action.id,
        actionName: name,
        result: result as AiJsonValue
      }))
    }))
    const tools = createLocalOperationTools(
      [{ name, description: name, inputSchema: {} }],
      {
        modelActions: (a) => a,

        resolveBatch: (b) => b
      },
      dispatch
    )
    const output = JSON.parse(
      await tools.call(
        'execute_design',
        { inspection: 'defer', operations: [{ name, arguments: {} }] },
        new AbortController().signal
      )
    )

    expect(output.actionResults[0].result).toEqual(result)
    expect(output.batchSummary.acknowledgedActions).toBeUndefined()
    expect(dispatch).toHaveBeenCalledTimes(1)
  }
)

it('advertises only admitted batch routes and actual explicit inspection wrappers across lookup views', async () => {
  const actions = [
    AiActionNames.REVIEW_DESIGN,
    AiActionNames.INSPECT_DRAWING
  ].map((name) => ({
    name,
    description: 'Mechanical geometry inspection',
    inputSchema: {
      type: 'object',
      properties: {
        elementId: { 'x-design-element-binding': 'each', type: 'string' }
      },
      required: ['elementId']
    }
  }))
  const execute = vi.fn(async () => ({ actionResults: [], context: {} }))
  const owner = createLocalOperationTools(
    actions,
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute,
    {
      getNativeTools: () =>
        owner.definitions.map((definition) => ({
          ...definition,
          namespace: 'design_operations',
          registeredName: `design_operations.${definition.name}`
        }))
    }
  )
  const signal = new AbortController().signal

  const read = async (input: unknown) =>
    JSON.parse(await owner.call('describe_design_apis', input, signal))

  for (const name of actions.map((a) => a.name)) {
    for (const selector of [
      { names: [name] },
      { operation: name },
      { operations: [name], view: 'usage' },
      { operations: [name], schemaPaths: ['/properties/elementId'] },
      { names: [name], refresh: true }
    ]) {
      const result = await read(selector)

      expect(result.apis[0].execution).toEqual({
        kind: 'native-tool',
        namespace: 'design_operations',
        tool: name,
        argumentField: 'arguments'
      })
      if (selector.view === 'usage') {
        expect(result.tools ?? []).toEqual([])
      }
    }

    await owner.call(name, { arguments: { elementId: 'target' } }, signal)
  }

  for (const selector of [
    { category: 'design' },
    { query: 'inspection' },
    { names: ['review_missing'] }
  ]) {
    const result = await read(selector)

    for (const entry of [
      ...(result.apis ?? []),
      ...(result.candidates ?? [])
    ]) {
      expect(entry.execution.kind).toBe('native-tool')
      expect(entry.execution.argumentField).toBe('arguments')
    }
  }

  expect(execute).toHaveBeenCalledTimes(2)
  const batch = owner.definitions.find((d) => d.name === 'execute_design')

  expect(JSON.stringify(batch?.inputSchema)).not.toContain('review_design')
})

it('delivers usage pages across native and action discovery without consuming full definitions', async () => {
  const action = {
    ...basicApiContracts[0],
    description: 'Discovery representation probe'
  }
  const native = Array.from({ length: 18 }, (_, index) => ({
    name: `probe-${index}`,
    namespace: 'saved_tools',
    description: 'Discovery representation probe',
    inputSchema: { type: 'object', properties: { target: { type: 'string' } } },
    ...toolSemantics({ type: 'object' }, 'read', []),
    composition: 'control-plane'
  }))
  const execute = vi.fn()
  const owner = createLocalOperationTools(
    [action],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute,
    { getNativeTools: () => native }
  )

  const read = async (args: unknown) =>
    JSON.parse(
      await owner.call(
        'describe_design_apis',
        args,
        new AbortController().signal
      )
    )

  const page = await read({
    query: 'discovery representation probe',
    view: 'usage'
  })

  expect(page.apis[0].definition).toBeUndefined()
  expect(page.apis[0].usage.arguments.view).toBe('usage')
  expect(page.tools[0].inputFields).toBeUndefined()
  expect(page.tools[0].inputSchema).toBeUndefined()
  expect(page.next.arguments.view).toBe('usage')
  expect(owner.resultIssue('describe_design_apis', page)).toBeUndefined()
  const last = await read(page.next.arguments)

  expect(last.complete).toBe(true)
  expect(last.tools.at(-1).usage.arguments.names).toEqual([
    'saved_tools.probe-17'
  ])
  const category = await read({ category: 'tools', view: 'usage' })

  expect(category.tools[0].definition.state).toBe('included')
  const full = await read({ names: ['saved_tools.probe-0'] })

  expect(full.tools[0].definition.state).toBe('included')
  expect(full.tools[0].inputSchema).toEqual(native[0].inputSchema)
  const repeated = await read({
    query: 'discovery representation probe',
    view: 'usage'
  })

  expect(repeated.tools).toEqual(page.tools)
  const restored = await read({
    ...page.next.arguments,
    refresh: true,
    refreshReason: 'delivery-failure'
  })

  expect(restored.tools[0].usage.arguments.names).toEqual(
    last.tools[0].usage.arguments.names
  )
  const acquired = await read(restored.tools[0].usage.arguments)

  expect(acquired.tools[0].inputFields).toContain('/properties/target')
  expect(acquired.tools[0].definition.coverage).toBe('usage')
  expect(execute).not.toHaveBeenCalled()
})

it('searches compact native capability menus with pagination without consuming exact schemas', async () => {
  const native = Array.from({ length: 19 }, (_, index) => ({
    name: `inspect-${index}`,
    namespace: 'saved_tools',
    description: 'Inspect geometry measurements',
    inputSchema: { type: 'object', properties: { target: { type: 'string' } } },
    ...toolSemantics({
      effect: 'read',
      composition: 'control-plane',
      outputSchema: { type: 'object', description: 'x'.repeat(1000) }
    })
  }))
  const admitted = createLocalOperationTools(
    [basicApiContracts[0]],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    vi.fn(),
    { getNativeTools: () => native }
  )

  const read = async (args: unknown) =>
    JSON.parse(
      await admitted.call(
        'describe_design_apis',
        args,
        new AbortController().signal
      )
    )

  const first = await read({ query: 'geometry measurements' })

  expect(first.tools).toHaveLength(16)
  expect(first.tools[0]).toMatchObject({
    name: 'inspect-0',
    execution: { kind: 'native-tool', namespace: 'saved_tools' }
  })
  expect(first.tools[0].inputSchema).toBeUndefined()
  expect(first.tools[0].outputSchema).toBeUndefined()
  expect(first.complete).toBe(false)
  const second = await read(first.next.arguments)

  expect(second.tools).toHaveLength(3)
  expect(second.complete).toBe(true)
  const full = await read({ names: ['saved_tools.inspect-18'] })

  expect(full.tools[0].inputSchema).toEqual(native[18].inputSchema)
  expect(full.tools[0].definition.state).toBe('included')
})

it('keeps subject research distinct from capability lookup without automatically routing a query', async () => {
  const execute = vi.fn()
  const owner = createLocalOperationTools(
    basicApiContracts,
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute
  )
  const result = JSON.parse(
    await owner.call(
      'describe_design_apis',
      { query: 'an unfamiliar building reference photograph' },
      new AbortController().signal
    )
  )

  for (const entry of result.apis) {
    expect(entry.match.unmatchedTerms).toContain('photograph')
    expect(entry.inputSchema).toBeUndefined()
    expect(entry.usageGuide).toBeUndefined()
  }

  expect(result.guidance.capabilities).toContain('operation')
  expect(result.guidance.references).toContain('native web research')
  expect(result.guidance.references).toContain('does not search')
  expect(execute).not.toHaveBeenCalled()
})

it('never substitutes a saved same-name tool for an unavailable explicit action wrapper', async () => {
  const name = AiActionNames.REVIEW_DESIGN
  const owner = createLocalOperationTools(
    [
      {
        name,
        description: 'Mechanical review',
        inputSchema: { type: 'object' }
      }
    ],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    vi.fn(),
    {
      getNativeTools: () => [
        {
          name,
          namespace: 'saved_tools',
          registeredName: 'saved_tools.' + name,
          description: 'A different saved recipe',
          inputSchema: { type: 'object' },
          ...toolSemantics({ type: 'object' }, 'read', []),
          composition: 'allowed'
        }
      ]
    }
  )
  const result = JSON.parse(
    await owner.call(
      'describe_design_apis',
      { operation: name },
      new AbortController().signal
    )
  )

  expect(result.apis[0].execution.kind).toBe('unavailable')
  expect(result.apis[0].recipeDependency).toBeUndefined()
})

it('delivers API, native and mixed discovery pages through the actual invocation boundary', async () => {
  const { invokeLocalTool } = await import('../local-tool-invocation')
  const actions = basicApiContracts.slice(0, 19).map((api) => ({
    ...api,
    description: 'Pagination probe capability'
  }))
  const native = Array.from({ length: 19 }, (_, index) => ({
    name: `pagination-${index}`,
    namespace: 'saved_tools',
    description: 'Pagination probe capability',
    inputSchema: { type: 'object' },
    ...toolSemantics({ type: 'object' }, 'read', [])
  }))
  const execute = vi.fn()
  const owner = createOwner(
    actions,
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute,
    { getNativeTools: () => native }
  )
  const definition = owner.definitions.find(
    (tool) => tool.name === 'describe_design_apis'
  )

  if (!definition) {
    throw new Error('Missing discovery definition')
  }

  const readPage = async (args: unknown) => {
    const reply = await invokeLocalTool(
      owner,
      definition,
      args,
      new AbortController().signal
    )

    expect(reply.success, reply.text).toBe(true)

    return reply.text
  }

  const read = async (args: unknown) =>
    JSON.parse(await readCompleteInformation(readPage, args))

  const menu = await read({})
  const selectors = [
    { query: 'pagination probe' },
    ...menu.categories.map(({ category }: { category: string }) => ({
      category
    }))
  ]

  for (const selector of selectors.flatMap((selector) => [
    selector,
    { ...selector, view: 'usage' },
    { ...selector, view: 'full' }
  ])) {
    let page = await read(selector)
    let delivered = 0
    const identities: string[] = []
    const count = page.count

    do {
      expect(page.offset).toBe(delivered)
      expect(page.count).toBe(count)
      const entries = [...page.apis, ...(page.tools ?? [])]

      expect(entries.length).toBeLessThanOrEqual(16)
      identities.push(
        ...entries.map((entry) => `${entry.namespace ?? 'api'}:${entry.name}`)
      )
      delivered += entries.length
      expect(page.complete).toBe(delivered === count)
      if (page.complete) {
        break
      }

      expect(page.next.arguments.offset).toBe(delivered)
      page = await read(page.next.arguments)
    } while (delivered < count)

    expect(page.next).toBeUndefined()
    expect(new Set(identities).size).toBe(count)
    expect(await read({ ...selector, offset: count })).toMatchObject({
      count,
      offset: count,
      complete: true,
      apis: []
    })
    const invalid = await invokeLocalTool(
      owner,
      definition,
      { ...selector, offset: count + 1 },
      new AbortController().signal
    )

    expect(invalid.success).toBe(false)
  }

  expect(await read({ query: 'unpublishednebula' })).toMatchObject({
    count: 0,
    offset: 0,
    complete: true,
    apis: [],
    tools: []
  })
  expect(
    (await read({ names: ['saved_tools.pagination-0'] })).tools[0].definition
      .state
  ).toBe('included')
  expect(execute).not.toHaveBeenCalled()
})

it.each([
  { complete: undefined },
  { count: 2, complete: true },
  { tools: {} },
  { count: 0 },
  { offset: -1 },
  { offset: 0.5 },
  { next: { tool: 'describe_design_apis', arguments: { offset: 1 } } },
  { count: 2, complete: false },
  ...[
    { offset: 1 },
    { offset: 1, query: 'fill', category: 'fill' },
    { offset: 1, query: '   ' },
    { offset: 1, query: 'fill', unexpected: true },
    { offset: 1, category: 'not-a-registered-category' },
    { offset: 1, query: 'fill', includeSchemas: true }
  ].map((args) => ({
    count: 2,
    complete: false,
    next: {
      tool: 'describe_design_apis',
      arguments: { ...args, registryRevision: 0 }
    }
  })),
  {
    count: 2,
    complete: false,
    next: { tool: 'describe_design_apis', arguments: { offset: 0 } }
  }
])('rejects corrupt discovery output at invocation: %j', async (corruption) => {
  const { invokeLocalTool } = await import('../local-tool-invocation')
  const owner = createOwner(
    [basicApiContracts[0]],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    vi.fn()
  )
  const definition = owner.definitions.find(
    (tool) => tool.name === 'describe_design_apis'
  )

  if (!definition) {
    throw new Error('Missing discovery definition')
  }

  const reply = await invokeLocalTool(
    {
      ...owner,
      callInternal: undefined,

      call: async () =>
        JSON.stringify({
          apis: [],
          tools: [{ name: 'native' }],
          count: 1,
          offset: 0,
          complete: true,
          ...corruption
        })
    },
    definition,
    {},
    new AbortController().signal
  )

  expect(reply.success, reply.text).toBe(false)
  expect(reply.text).toContain('TOOL_RESULT_INVALID')
})

it('rejects a changed registry continuation before silently skipping a capability', async () => {
  const { invokeLocalTool } = await import('../local-tool-invocation')
  let revision = 1
  const schemaRead = vi.fn(() => ({ type: 'object' }))
  const native = Array.from({ length: 19 }, (_, index) => ({
    name: `paged-${index}`,
    namespace: 'saved_tools',
    description: 'Pagination capability',

    get inputSchema() {
      return schemaRead()
    },

    ...toolSemantics({ type: 'object' }, 'read', ['document'])
  }))
  const inventory = vi.fn(() => native)
  const owner = createOwner(
    basicApiContracts,
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    vi.fn(),
    {
      getNativeTools: inventory,

      getNativeToolsRevision: () => revision
    }
  )
  const definition = owner.definitions.find(
    (d) => d.name === 'describe_design_apis'
  )

  if (!definition) {
    throw new Error('Missing discovery definition')
  }

  const invoke = (args: unknown) =>
    invokeLocalTool(owner, definition, args, new AbortController().signal)

  const first = await invoke({ category: 'tools' })

  expect(first.success).toBe(true)
  const page = JSON.parse(first.text)

  expect((await invoke(page.next.arguments)).success).toBe(true)
  expect(inventory).toHaveBeenCalledTimes(1)
  expect(schemaRead).toHaveBeenCalledTimes(19)
  revision++
  expect((await invoke(page.next.arguments)).success).toBe(true)
  expect((await invoke(page.next.arguments)).success).toBe(true)
  expect(inventory).toHaveBeenCalledTimes(2)
  expect(schemaRead).toHaveBeenCalledTimes(38)
  native.shift()
  revision++
  const stale = await invoke(page.next.arguments)

  expect(stale.success).toBe(false)
  expect(stale.text).toContain('restart')
  const restarted = await invoke({ category: 'tools' })

  expect(restarted.success).toBe(true)
  const fresh = JSON.parse(restarted.text)

  expect(fresh.count).toBe(18)
  expect((await invoke(fresh.next.arguments)).success).toBe(true)
  expect(inventory).toHaveBeenCalledTimes(3)
  expect(schemaRead).toHaveBeenCalledTimes(56)
})

it('validates aggregate verification and refuses repair of an already passed selection through the common boundary', async () => {
  let findings: unknown[] = []
  const dispatch = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result:
        action.name === AiActionNames.REVIEW_DESIGN
          ? {
              available: true,
              complete: true,
              findings,
              evidence: {
                sessionId: 'session',
                revision: 1,
                receiptId: 'target'
              }
            }
          : { current: true, status: 'complete', appliedElementIds: ['child'] }
    }))
  }))
  const owner = createLocalOperationTools(
    [
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
      AiActionNames.APPLY_PRESCRIBED_POSITIONS
    ].map((name) => ({
      name,
      description: name,
      inputSchema: { type: 'object' }
    })),
    {
      modelActions: (value) => value,

      resolveBatch: (value) => value
    },
    dispatch
  )
  const signal = new AbortController().signal
  const review = JSON.parse(
    await owner.call(
      AiActionNames.REVIEW_DESIGN,
      { arguments: { elementId: 'target' } },
      signal
    )
  )

  expect(
    JSON.parse(
      await owner.call(
        AiDesignToolIds.VERIFY_DESIGN_CHECKS,
        review.mechanicalSelection,
        signal
      )
    )
  ).toMatchObject({ verification: { status: 'pass' } })
  await expect(
    owner.call(
      AiDesignToolIds.REPAIR_DESIGN_CHECKS,
      {
        ...review.mechanicalSelection,
        policy: {
          capability: 'set-prescribed-child-position',
          positions: [
            {
              elementId: 'child',
              x: 1,
              y: 1,
              attachmentEvidence: {
                parentId: 'target',
                workspaceId: 'workspace',
                evidence: { sessionId: 'session', revision: 1 }
              }
            }
          ]
        }
      },
      signal
    )
  ).rejects.toThrow(/pending repair/)
  expect(
    dispatch.mock.calls.flatMap(([batch]) =>
      batch.actions.map((action) => action.name)
    )
  ).not.toContain(AiActionNames.APPLY_PRESCRIBED_POSITIONS)
  findings = [
    { kind: 'container-overflow', elementId: 'child', parentId: 'target' }
  ]
  const pending = JSON.parse(
    await owner.call(
      AiActionNames.REVIEW_DESIGN,
      { arguments: { elementId: 'target' } },
      signal
    )
  )
  const repaired = JSON.parse(
    await owner.call(
      AiDesignToolIds.REPAIR_DESIGN_CHECKS,
      {
        ...pending.mechanicalSelection,
        policy: {
          capability: 'set-prescribed-child-position',
          positions: [
            {
              elementId: 'child',
              x: 1,
              y: 1,
              attachmentEvidence: {
                parentId: 'target',
                workspaceId: 'workspace',
                evidence: { sessionId: 'session', revision: 1 }
              }
            }
          ]
        }
      },
      signal
    )
  )

  expect(repaired.requestId).toBe(pending.mechanicalSelection.requestId)
  expect(repaired.actionResults[0].result.appliedElementIds).toEqual(['child'])
  expect(repaired.checks).toHaveLength(1)
})

it('preserves successful mixed schema lookups and returns exact recovery for a union root', async () => {
  const action = createDocumentContextAction(vi.fn())
  const dispatch = vi.fn()
  const tools = createLocalOperationTools(
    [action],
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    dispatch,
    {
      getNativeTools: () =>
        tools.definitions
          .filter(
            (definition) => definition.name === AiDesignToolIds.EXECUTE_DESIGN
          )
          .map((definition) => ({
            ...definition,
            namespace: 'design_operations'
          }))
    }
  )

  const read = async (input: unknown) =>
    JSON.parse(
      await tools.call(
        'describe_design_apis',
        input,
        new AbortController().signal
      )
    )

  const input = {
    names: [AiActionNames.READ_DESIGN_CONTEXT, AiDesignToolIds.EXECUTE_DESIGN],
    schemaPaths: ['/properties']
  }
  const first = await read(input)

  expect(first.apis[0]).toMatchObject({
    name: AiActionNames.READ_DESIGN_CONTEXT,
    definition: { state: 'unavailable', availableInResponse: false },
    schemaResolution: {
      status: 'unavailable',
      issues: [{ path: '/properties' }]
    }
  })
  expect(first.apis[0].schemaResolution.rootPaths).toContain('/oneOf')
  expect(first.apis[0].inputSchema).toBeUndefined()
  expect(first.tools[0].definition.state).toBe('included')
  expect(first.tools[0].schemaFragments[0].path).toBe('/properties')
  const repeated = await read(input)

  expect(repeated.apis[0].definition.state).toBe('unavailable')
  expect(repeated.tools[0].definition.state).toBe('included')
  const corrected = await read({
    names: [AiActionNames.READ_DESIGN_CONTEXT],
    schemaPaths: ['/oneOf/0/properties']
  })

  expect(corrected.apis[0].definition.state).toBe('included')
  expect(corrected.apis[0].schemaFragments[0].path).toBe('/oneOf/0/properties')
  expect(
    (await read({ names: [AiActionNames.READ_DESIGN_CONTEXT] })).apis[0]
      .definition.coverage
  ).toBe('full')
  expect(dispatch).not.toHaveBeenCalled()
})

it.each(['allowed', 'control-plane'] as const)(
  'keeps recorded usage schema-free and groups only canonical basic wrapper routes for %s',
  async (composition) => {
    const actions = createBasicApiActions()
    const action = actions.find(
      (item) => item.name === 'api_fill_updateFillsAtIndex'
    )

    if (!action) {
      throw new Error('Missing canonical fill action')
    }

    const wrapperOwner = createLocalOperationTools(
      actions,
      {
        modelActions: (a) => a,

        resolveBatch: (b) => b
      },
      vi.fn()
    )
    const definition = wrapperOwner.definitions.find(
      (item) => item.name === action.name
    )

    if (!definition) {
      throw new Error('Missing canonical wrapper')
    }

    const native = {
      ...definition,
      composition,
      namespace: 'design_operations',
      registeredName: `design_operations.${action.name}`
    }
    const foreign = {
      ...native,
      namespace: 'foreign',
      registeredName: `foreign.${action.name}`
    }
    const execute = vi.fn()
    const tools = createLocalOperationTools(
      actions,
      {
        modelActions: (a) => a,

        resolveBatch: (b) => b
      },
      execute,
      { getNativeTools: () => [native, foreign] }
    )

    const read = async (args: unknown) =>
      JSON.parse(
        await readCompleteInformation(
          (input) =>
            tools.call(
              'describe_design_apis',
              input,
              new AbortController().signal
            ),
          args
        )
      )

    const recorded = recordedDiscovery.calls.find(
      (call) => 'query' in call.input
    )

    if (!recorded) {
      throw new Error('Missing recorded query')
    }

    const menu = await read({
      ...recorded.input,
      query: 'apply fill fields to one row'
    })
    const entry = menu.apis.find(
      (item: { name: string }) => item.name === action.name
    )

    expect(entry.inputFields).toBeUndefined()
    const selected = await read(entry.usage.arguments)

    expect(selected.apis[0].inputFields).toContain('/properties/elementIds')
    expect(entry.execution.kind).toBe('batch-action')
    expect(entry.recipeDependency).toBeUndefined()
    if (composition === 'allowed') {
      expect(
        selected.apis[0].recipeDependency.definition.arguments.names
      ).toEqual([native.registeredName])
    } else {
      expect(selected.apis[0].recipeDependency).toBeUndefined()
    }

    expect(
      menu.tools.some(
        (item: { namespace: string }) => item.namespace === 'design_operations'
      )
    ).toBe(false)
    expect(
      menu.tools.some(
        (item: { namespace: string }) => item.namespace === 'foreign'
      )
    ).toBe(true)
    for (const item of [...menu.apis, ...menu.tools]) {
      expect(JSON.stringify(item)).not.toMatch(
        /"(?:inputSchema|outputSchema|partialOutputSchema|recoveryOutputSchema)":/
      )
    }

    const exact = await read({ names: [native.registeredName] })

    expect(exact.tools[0].definition.coverage).toBe('full')
    expect(exact.tools[0].inputSchema).toEqual(definition.inputSchema)
    expect(exact.tools[0].outputSchema).toEqual(definition.outputSchema)
    expect(exact.tools[0].partialOutputSchema).toEqual(
      definition.partialOutputSchema
    )
    const usage = await read({ names: [native.registeredName], view: 'usage' })

    expect(usage.tools[0].definition.availableInResponse).toBe(true)
    expect(usage.tools[0].inputFields).toContain(
      '/anyOf/0/properties/arguments'
    )
    const reused = await read({ names: [native.registeredName], view: 'usage' })

    expect(reused.tools[0].definition.state).toBe('included')
    const restored = await read(reused.tools[0].definition.recover.arguments)

    expect(restored.tools[0].inputFields).toEqual(usage.tools[0].inputFields)
    expect(restored.tools[0].outputSchema).toBeUndefined()
    expect(execute).not.toHaveBeenCalled()
  }
)

it('replays all recorded discovery selectors without losing exact contracts or dispatching writes', async () => {
  const actions = [
    ...createBasicApiActions(),
    ...createAiActions().filter(
      (action) => action.name === AiActionNames.UPDATE_COMPOSITION_ELEMENTS
    ),
    createDesignEditAction()
  ]
  // Saved responses are evidence, not executable instructions. Restore only
  // admitted descriptors to exercise the real discovery owner offline.
  const saved = JSON.parse(JSON.stringify(recordedDiscovery))
  const native = new Map<
    string,
    import('../local-operation-tools').NativeToolDescriptor
  >()
  const additional = new Map<string, (typeof actions)[number]>()

  for (const call of saved.calls) {
    for (const tool of call.output.tools ?? []) {
      if (!tool.inputSchema) {
        continue
      }

      const {
        definition: _receipt,
        schemaSource: _source,
        ...descriptor
      } = tool

      native.set(`${tool.namespace}.${tool.name}`, descriptor)
    }

    for (const api of call.output.apis ?? []) {
      if (
        api.inputSchema &&
        !actions.some((action) => action.name === api.name)
      ) {
        const { definition: _receipt, ...descriptor } = api

        additional.set(api.name, descriptor)
      }
    }
  }

  const registered = [...actions, ...additional.values()]
  const base = createLocalOperationTools(
    registered,
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    vi.fn()
  )

  for (const definition of base.definitions) {
    if (!definition.name.startsWith('api_')) {
      continue
    }

    const registeredName = `design_operations.${definition.name}`

    native.set(registeredName, {
      ...definition,
      namespace: 'design_operations',
      registeredName
    })
  }

  const dispatch = vi.fn()
  const owner = createLocalOperationTools(
    registered,
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    dispatch,
    { getNativeTools: () => [...native.values()] }
  )
  let bytes = 0
  let usageBytes = 0

  for (const call of saved.calls) {
    const result = JSON.parse(
      await readCompleteInformation(
        (input) =>
          owner.call(
            'describe_design_apis',
            input,
            new AbortController().signal
          ),
        call.input
      )
    )

    const candidates = {
      apis: [...(result.apis ?? [])],
      tools: [...(result.tools ?? [])]
    }
    let next = result.next
    let previousOffset = result.offset ?? 0

    // Historical broad-query members remain reachable; adaptive ranking is not
    // required to preserve every incidental match on the first page.
    while (next) {
      const page = JSON.parse(
        await readCompleteInformation(
          (input) =>
            owner.call(
              'describe_design_apis',
              input,
              new AbortController().signal
            ),
          next.arguments
        )
      )

      expect(page.offset).toBeGreaterThan(previousOffset)
      previousOffset = page.offset
      candidates.apis.push(...(page.apis ?? []))
      candidates.tools.push(...(page.tools ?? []))
      next = page.next
    }

    bytes += Buffer.byteLength(JSON.stringify(result))
    expect(result.missingNames ?? result.missingOperations ?? []).toEqual([])
    for (const expected of call.output.apis ?? []) {
      const actual = candidates.apis.find(
        (item: { name: string }) => item.name === expected.name
      )

      expect(actual, expected.name).toBeDefined()
      if (expected.inputSchema) {
        expect(
          runtimeOperationSchema({ ...actual.inputSchema, examples: undefined })
        ).toEqual({ ...expected.inputSchema, examples: undefined })
      }
    }

    for (const expected of call.output.tools ?? []) {
      const actual = candidates.tools.find(
        (item: { name: string; namespace: string }) =>
          item.name === expected.name && item.namespace === expected.namespace
      )

      if (call.input.view === 'usage' && !actual) {
        expect(
          candidates.apis.some(
            (item: { name: string; execution?: { kind: string } }) =>
              expected.namespace === 'design_operations' &&
              item.name === expected.name &&
              item.execution?.kind === 'batch-action'
          )
        ).toBe(true)
      } else {
        expect(actual, expected.name).toBeDefined()
        if (expected.inputSchema) {
          expect(runtimeOperationSchema(actual.inputSchema)).toEqual(
            expected.inputSchema
          )
        }

        if (expected.outputSchema) {
          expect(actual.outputSchema).toEqual(expected.outputSchema)
        }

        if (expected.partialOutputSchema) {
          expect(actual.partialOutputSchema).toEqual(
            expected.partialOutputSchema
          )
        }
      }
    }

    if (call.input.view === 'usage') {
      recordAcquisitionCost(call.input, JSON.stringify(result), [])
      usageBytes = Buffer.byteLength(JSON.stringify(result))
      expect(usageBytes).toBeLessThan(call.outputBytes / 3)
    }
  }

  expect(saved.calls).toHaveLength(13)
  expect(dispatch).not.toHaveBeenCalled()
  expect(bytes).toBeLessThan(
    recordedDiscovery.calls.reduce((sum, call) => sum + call.outputBytes, 0)
  )
  expect(usageBytes).toBeGreaterThan(0)
})

it('routes exact final-action discovery to the current final-response contract without adding a callable tool', async () => {
  const final = {
    name: AiActionNames.REPORT_OUTCOME,
    description: 'Report current outcome',
    inputSchema: {
      type: 'object',
      required: ['outcome'],
      properties: { outcome: { enum: ['completed', 'unsupported'] } }
    }
  }
  const dispatch = vi.fn()
  const owner = createLocalOperationTools(
    [final],
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    dispatch
  )
  const signal = new AbortController().signal
  const result = JSON.parse(
    await owner.call(
      AiDesignToolIds.DESCRIBE_DESIGN_APIS,
      { names: [final.name] },
      signal
    )
  )

  expect(result.missingNames).toEqual([])
  expect(result.apis[0]).toMatchObject({
    name: final.name,
    inputSchema: final.inputSchema,
    execution: { kind: 'final-response', action: final.name }
  })
  expect(result.apis[0]).not.toHaveProperty('recipeDependency')
  expect(owner.actionNames).not.toContain(final.name)
  expect(owner.definitions.some((d) => d.name === final.name)).toBe(false)
  await expect(
    owner.call(final.name, { arguments: { outcome: 'completed' } }, signal)
  ).rejects.toThrow()
  await expect(
    owner.call(
      AiDesignToolIds.EXECUTE_DESIGN,
      {
        operations: [{ name: final.name, arguments: { outcome: 'completed' } }]
      },
      signal
    )
  ).rejects.toThrow()
  expect(dispatch).not.toHaveBeenCalled()
  const query = JSON.parse(
    await owner.call(
      AiDesignToolIds.DESCRIBE_DESIGN_APIS,
      recordedClosure.calls[3].input,
      signal
    )
  )

  expect(query.apis[0]).toMatchObject({
    name: final.name,
    execution: { kind: 'final-response', action: final.name }
  })
  const repeated = JSON.parse(
    await owner.call(
      AiDesignToolIds.DESCRIBE_DESIGN_APIS,
      { names: [final.name] },
      signal
    )
  )

  expect(repeated.apis[0].definition.availableInResponse).toBe(true)
})

it('replays recorded conflicting and corrected targets without reading or writing the rejected input', async () => {
  const rejected = recordedAcquisition.calls.find((call) => call.index === 31)
  const corrected = recordedAcquisition.calls.find((call) => call.index === 34)

  if (!rejected || !corrected) {
    throw new Error('Recorded target cases are missing')
  }

  const read = createRegionTargetsAction(vi.fn())
  const ids = ['fresh-spire-a', 'fresh-spire-b', 'fresh-spire-c']
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result:
        action.name === read.name
          ? {
              available: true,
              total: ids.length,
              nextOffset: null,
              elementIds: ids,
              elements: [],
              missingIds: []
            }
          : { status: 'complete', value: { count: ids.length } }
    })),
    context: {}
  }))
  const tools = createLocalOperationTools(
    [read, ...basicApiContracts],
    {
      modelActions: (a) => a,

      resolveBatch: (v) => v
    },
    execute
  )

  const restore = (input: unknown) => {
    const value = JSON.parse(JSON.stringify(input))

    value.operations[0].target.query.filter.ancestorId = 'fresh-spire-parent'

    return value
  }

  const bad = restore(rejected.input)
  const before = structuredClone(bad)

  await expect(
    tools.call('execute_design', bad, new AbortController().signal)
  ).rejects.toThrow(/conflicting target binding/)
  expect(execute).not.toHaveBeenCalled()
  expect(bad).toEqual(before)
  const result = JSON.parse(
    await tools.call(
      'execute_design',
      restore(corrected.input),
      new AbortController().signal
    )
  )

  expect(execute).toHaveBeenCalledTimes(2)
  expect(execute.mock.calls[0][0].actions[0].arguments).toMatchObject({
    filter: { ancestorId: 'fresh-spire-parent', name: { prefix: '針尖' } }
  })
  expect(execute.mock.calls[1][0].actions[0].arguments).toEqual({
    elementIds: ids
  })
  expect(result.actionResults[0]).toMatchObject({
    actionName: 'api_element_deleteElements',
    result: { status: 'complete', value: { count: 3 } }
  })
})

it('binds a retained exact-one anchor and moving set through the canonical hierarchy contract', () => {
  const api = basicApiContracts.find(
    (item) => item.operation === 'hierarchy.moveElementsRelative'
  )

  if (!api) {
    throw new Error('Missing hierarchy contract')
  }

  const operation = {
    name: api.name,
    arguments: { request: { placement: 'before' } },
    target: [
      { field: 'elementIds', artifactId: 'moving' },
      { field: 'anchorId', path: ['request', 'anchorId'], artifactId: 'anchor' }
    ]
  }
  const resolve = vi.fn((ref: unknown) =>
    (ref as { artifactId: string }).artifactId === 'moving' ? ['a', 'b'] : ['c']
  )

  expect(
    prepareOperationBatch([operation], [api], resolve)[0].arguments
  ).toEqual({
    request: { placement: 'before', elementIds: ['a', 'b'], anchorId: 'c' }
  })
  resolve.mockImplementation(() => ['a', 'b'])
  expect(() => prepareOperationBatch([operation], [api], resolve)).toThrow(
    /exactly one/
  )
  const misleading = structuredClone(operation)

  misleading.target[1].field = 'elementId'
  resolve.mockClear()
  expect(() => prepareOperationBatch([misleading], [api], resolve)).toThrow(
    /path|slot|unambiguous/
  )
  expect(resolve).not.toHaveBeenCalled()
})

it('preserves schema validation and literal data when adapting App identity annotations for Runtime', () => {
  const source = {
    type: 'object',
    additionalProperties: false,
    required: ['elementId'],
    properties: {
      elementId: {
        type: 'string',
        minLength: 3,
        pattern: '^a',
        'x-runtime-value': 'document',
        'x-design-element-binding': 'one'
      },
      'x-design-element-binding': { const: 'actual-user-field' }
    },
    default: { 'x-design-element-binding': 'literal' }
  }
  const copy = structuredClone(source)
  const runtime = runtimeOperationSchema(source)

  expect(runtime.properties.elementId).toEqual({
    type: 'string',
    minLength: 3,
    pattern: '^a',
    'x-runtime-value': 'document'
  })
  expect(runtime.properties['x-design-element-binding']).toEqual(
    source.properties['x-design-element-binding']
  )
  expect(runtime.default).toEqual(source.default)
  for (const input of [
    { elementId: 'abc' },
    { elementId: 'a' },
    { elementId: 'xxx' },
    { elementId: 7 },
    {}
  ]) {
    expect(operationInputIssue(input, runtime)).toEqual(
      operationInputIssue(input, source)
    )
  }

  expect(source).toEqual(copy)
})

it('rejects generic document identity binding and multiple fan-outs before resolving retained sources', () => {
  const resolve = vi.fn(() => ['a', 'b'])
  const definition = {
    name: 'declared',
    description: 'Exact declaration',
    inputSchema: {
      type: 'object',
      properties: {
        propertyId: { type: 'string', 'x-runtime-value': 'document' },
        left: { type: 'string', 'x-design-element-binding': 'each' },
        right: { type: 'string', 'x-design-element-binding': 'each' },
        anchor: { type: 'string', 'x-design-element-binding': 'one' }
      }
    }
  }

  expect(() =>
    prepareOperationBatch(
      [
        {
          name: 'declared',
          arguments: {},
          target: { field: 'propertyId', artifactId: 'a' }
        }
      ],
      [definition],
      resolve
    )
  ).toThrow(/registered/)
  expect(() =>
    prepareOperationBatch(
      [
        {
          name: 'declared',
          arguments: {},
          target: [
            { field: 'left', artifactId: 'a' },
            { field: 'right', artifactId: 'b' }
          ]
        }
      ],
      [definition],
      resolve
    )
  ).toThrow(/fan-out/)
  expect(resolve).not.toHaveBeenCalled()
  resolve.mockImplementation((ref) =>
    (ref as { artifactId: string }).artifactId === 'anchor' ? ['c'] : ['a', 'b']
  )
  expect(
    prepareOperationBatch(
      [
        {
          name: 'declared',
          arguments: {},
          target: [
            { field: 'left', artifactId: 'a' },
            { field: 'anchor', artifactId: 'anchor' }
          ]
        }
      ],
      [definition],
      resolve
    ).map((action) => action.arguments)
  ).toEqual([
    { left: 'a', anchor: 'c' },
    { left: 'b', anchor: 'c' }
  ])
})

it('delivers a validated usage invocation with canonical identity cardinality and output pointers', async () => {
  const action = {
    name: AiActionNames.ORGANIZE_DESIGN,
    description: 'Arrange elements against one anchor.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['request'],
      properties: {
        request: {
          type: 'object',
          additionalProperties: false,
          required: ['anchorId'],
          properties: {
            anchorId: {
              type: 'string',
              minLength: 1,
              'x-design-element-binding': 'one'
            }
          }
        }
      },
      examples: [{ request: { anchorId: 'example-anchor' } }]
    },
    ...toolSemantics(
      { type: 'object', properties: { applied: { type: 'boolean' } } },
      'read',
      ['document']
    )
  }
  const execute = vi.fn(async () => ({ actions: [] }))
  const tools = createLocalOperationTools(
    [action],
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    execute
  )

  const read = (args: unknown) =>
    tools
      .call('describe_design_apis', args, new AbortController().signal)
      .then(JSON.parse)

  const usage = (await read({ names: [action.name], view: 'usage' })).apis[0]

  expect(usage.inputFields).toContain('/properties/request')
  expect(usage.outputFields).toContain('/properties/applied')
  expect(usage.elementBindings).toContainEqual({
    schemaPath: '/properties/request/properties/anchorId',
    mode: 'one'
  })
  expect(usage.invocationExample).toEqual({
    illustrative: true,
    invocation: {
      tool: 'execute_design',
      arguments: {
        operations: [
          {
            name: action.name,
            arguments: { request: { anchorId: 'example-anchor' } }
          }
        ]
      }
    }
  })
  expect(
    (await read({ names: [action.name], view: 'usage' })).apis[0]
      .invocationExample
  ).toEqual(usage.invocationExample)
  const refreshed = (
    await read({
      names: [action.name],
      view: 'usage',
      refresh: true,
      refreshReason: 'delivery-failure'
    })
  ).apis[0]

  expect(refreshed.invocationExample).toEqual(usage.invocationExample)
  expect((await read({ names: [action.name] })).apis[0].inputSchema).toEqual(
    action.inputSchema
  )
})

it('does not invent usage arguments when owner examples are absent or invalid', async () => {
  for (const examples of [undefined, [{ wrong: true }]]) {
    const action = {
      name: AiActionNames.ORGANIZE_DESIGN,
      description: 'Arrange',
      inputSchema: {
        type: 'object',
        required: ['ids'],
        properties: { ids: { type: 'array', items: { type: 'string' } } },
        ...(examples ? { examples } : {})
      }
    }
    const tools = createLocalOperationTools(
      [action],
      {
        modelActions: (a) => a,

        resolveBatch: (b) => b
      },
      vi.fn()
    )
    const usage = JSON.parse(
      await tools.call(
        'describe_design_apis',
        { names: [action.name], view: 'usage' },
        new AbortController().signal
      )
    ).apis[0]

    expect(usage.invocationExample).toMatchObject({ available: false })
    expect(usage.invocationExample.invocation).toBeUndefined()
    expect(usage.definition.recover.arguments.operations).toEqual([action.name])
  }
})

describe('context entry navigation and recovery', () => {
  const setup = async () => {
    const { default: saved } =
      await import('./fixtures/recorded-101/context-discovery-20261023.json')
    const signal = new AbortController().signal

    let invalidate: () => void = () => undefined

    const source = {
      getCurrentWorkspaceId: () => 'workspace',

      getSelectedElementIds: () => [],

      getElementChildren: () => ({
        available: true,
        elementIds: [],
        total: 0,
        nextOffset: null
      }),

      getElementIdsInBounds: () => [],

      getElementMetadata: (id: string) => ({
        name: id,
        type: 'group',
        parentId: 'workspace'
      }),

      getElementComputedData: () => ({ x: 6438, y: 27554 })
    }
    const store = createRetainedDesignContext(source, (listener) => {
      invalidate = listener

      return () => undefined
    })
    const action = createDocumentContextAction(store.read)
    const execute = vi.fn(async (batch: AiActionBatch) => ({
      context: {},
      actionResults: await Promise.all(
        batch.actions.map(async (item) => {
          if (item.name === 'release_design_context') {
            return {
              actionId: item.id,
              actionName: item.name,
              result: store.read(
                {
                  scope: 'snapshot',
                  snapshotId: (item.arguments as { snapshotId: string })
                    .snapshotId,
                  release: true
                },
                signal
              )
            }
          }

          expect(item.name).toBe(action.name)

          return {
            actionId: item.id,
            actionName: item.name,
            result: await action.execute(item.arguments as never, { signal })
          }
        })
      )
    }))
    const { createLocalToolHost } = await import('../local-tool-host')
    const { LocalToolLibraryLimits } =
      await import('../local-tool-library-limits')
    let owner: ReturnType<typeof createOwner>
    const host = createLocalToolHost({
      requestId: 'context-navigation',
      signal,
      capacity: 32,
      receiptCapacity: 8,
      artifactCapacity: 64,
      limits: LocalToolLibraryLimits.recipe,
      store: {
        read: async () => undefined,

        list: async () => [],

        write: async () => {
          throw Error('No library write')
        }
      },

      createGroups: (ownership) => {
        owner = createOwner(
          [action],
          {
            modelActions: (a) => a,

            resolveBatch: (b) => b
          },
          execute,
          {
            ownership,

            getNativeTools: () =>
              owner.definitions
                .filter((tool) => tool.name === action.name)
                .map((tool) => ({
                  ...tool,
                  namespace: 'design_operations',
                  registeredName: `design_operations.${tool.name}`
                }))
          }
        )

        return [{ name: 'design_operations', description: 'Context', owner }]
      }
    })
    const calls: { input: unknown; text: string }[] = []

    const read = async (input: unknown) =>
      JSON.parse(
        await readCompleteInformation(async (args) => {
          const { invokeLocalTool } = await import('../local-tool-invocation')
          const definition = owner.definitions.find(
            (tool) => tool.name === 'describe_design_apis'
          )

          if (!definition) {
            throw new Error('Missing discovery definition')
          }

          const reply = await invokeLocalTool(owner, definition, args, signal)
          const text = JSON.stringify(
            owner.projectModelResult(
              'describe_design_apis',
              args,
              JSON.parse(reply.text)
            )
          )

          calls.push({ input: args, text })

          return text
        }, input)
      )

    return {
      saved,
      host,
      signal,
      store,
      action,
      owner,
      execute,
      read,
      calls,

      invalidate: () => invalidate()
    }
  }

  it.each(['action', 'native'] as const)(
    'uses delivered %s union navigation through the real context owner without an extra read',
    async (route) => {
      const t = await setup()

      try {
        const usage = await t.read({
          query:
            route === 'action'
              ? 'structural retained output'
              : 'design_operations.read_design_context',
          view: 'usage'
        })
        const entry = route === 'action' ? usage.apis[0] : usage.tools[0]

        expect(entry.inputSchema).toBeUndefined()
        const branch = entry.inputFields.find((path: string) =>
          path.endsWith('/oneOf/0')
        )

        expect(
          branch,
          'usage must expose the selected union boundary'
        ).toBeDefined()
        // Select a delivered path in the actual example, without rebuilding its selector.
        expect(entry.fieldQuery).toBeDefined()
        const queried = await t.read({
          ...entry.fieldQuery.arguments,
          schemaPaths: [branch]
        })

        expect(queried.toolOutcome.status).toBe('success')
        expect([...queried.apis, ...(queried.tools ?? [])]).toHaveLength(1)
        const fragment = [...queried.apis, ...(queried.tools ?? [])][0]

        expect(fragment.schemaFragments[0]).toEqual({
          path: branch,
          schema: t.action.inputSchema.oneOf[0]
        })
        const wrapper =
          route === 'action'
            ? ''
            : branch.slice(0, branch.lastIndexOf('/oneOf'))

        expect(fragment.schemaContext).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: wrapper,
              schema: expect.objectContaining({
                oneOf: t.action.inputSchema.oneOf
              })
            })
          ])
        )
        if (route === 'native') {
          expect(fragment.schemaContext).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                path: '/anyOf/0',
                schema: expect.objectContaining({
                  required: ['arguments'],
                  additionalProperties: false
                })
              })
            ])
          )
        }

        expect(t.calls).toHaveLength(t.saved.baseline.lookupCalls)
        const outputBytes = t.calls.reduce(
          (n, call) => n + Buffer.byteLength(call.text),
          0
        )
        const inputBytes = t.calls.reduce(
          (n, call) => n + Buffer.byteLength(JSON.stringify(call.input)),
          0
        )

        // The current wrapper includes target-bearing admission that the saved
        // baseline did not expose. Keep its byte cost visible; that historical
        // payload is not a ceiling for a different complete contract.
        process.stdout.write(
          'Context discovery measurement ' +
            JSON.stringify({
              route,
              calls: t.calls.length,
              inputBytes,
              outputBytes,
              historicalBytes:
                t.saved.baseline.inputBytes + t.saved.baseline.outputBytes
            }) +
            '\n'
        )
        expect(t.execute).not.toHaveBeenCalled()
        const values = t.saved.invocation.arguments
        const input =
          route === 'native'
            ? t.saved.invocation
            : {
                operations: [{ name: entry.name, arguments: values }]
              }
        const { invokeLocalTool } = await import('../local-tool-invocation')
        const executionDefinition = t.owner.definitions.find(
          (tool) => tool.name === entry.execution.tool
        )

        if (!executionDefinition && route === 'action') {
          throw new Error('Missing execution definition')
        }

        let reply

        try {
          if (route === 'native') {
            expect(entry.execution.kind).toBe('registered-tool')
            reply = await t.host.invoke({
              name: entry.execution.namespace + '.' + entry.execution.tool,
              input: { ...entry.execution.arguments, input }
            })
          } else {
            reply = await invokeLocalTool(
              t.owner,
              executionDefinition,
              input,
              t.signal
            )
          }
        } finally {
          /* Retain request ownership until assertions finish. */
        }

        expect(reply.success, reply.text).toBe(true)
        const raw = JSON.parse(reply.text)

        expect(t.execute).toHaveBeenCalledTimes(1)
        expect(t.execute.mock.calls[0][0].actions[0].arguments).toEqual(values)
        const result = (route === 'native' ? raw.execution.value : raw)
          .actionResults[0].result

        expect(result.elements[0]).toMatchObject({
          id: values.elementIds[0],
          properties: { x: 6438, y: 27554 }
        })
        expect(result.coordinateSpace).toBe('parent-local')
        // Recovery is informational, even after execution: it never repeats work.
        const restored = await t.read(fragment.definition.recover.arguments)

        expect(restored.toolOutcome.status).toBe('success')
        expect(t.execute).toHaveBeenCalledTimes(1)
        t.invalidate()
        await expect(
          t.action.execute(
            { scope: 'snapshot', snapshotId: result.snapshotId },
            { signal: t.signal }
          )
        ).rejects.toThrow()
        expect(t.execute).toHaveBeenCalledTimes(1)
      } finally {
        await t.host.dispose()
        t.store.dispose()
      }
    }
  )

  it('rejects invalid input through both published routes before the context owner reads', async () => {
    const t = await setup()

    try {
      const usage = await t.read({
        ...t.saved.usageQuery,
        names: [t.action.name, 'design_operations.' + t.action.name]
      })
      const { invokeLocalTool } = await import('../local-tool-invocation')
      const invalidValues = [
        { scope: 'ids' },
        { scope: 'ids', elementIds: ['a'], fields: ['unavailable-field'] },
        { scope: 'children', elementIds: ['a'] },
        { ...t.saved.invocation.arguments, unexpected: true }
      ]

      for (const entry of [usage.apis[0], usage.tools[0]]) {
        const native = entry.execution.kind === 'registered-tool'
        const definition = t.owner.definitions.find(
          (tool) => tool.name === entry.execution.tool
        )

        if (!definition && !native) {
          throw new Error('Missing execution definition')
        }

        for (const values of invalidValues) {
          const input = native
            ? { arguments: values }
            : { operations: [{ name: entry.name, arguments: values }] }

          const reply = native
            ? await t.host.invoke({
                name: entry.execution.namespace + '.' + entry.execution.tool,
                input: { ...entry.execution.arguments, input }
              })
            : await invokeLocalTool(
                t.owner,
                definition as NonNullable<typeof definition>,
                input,
                t.signal
              )

          expect(reply.success).toBe(false)
          expect(JSON.parse(reply.text).toolOutcome.settlement).toBe(
            'not-started'
          )
        }

        if (native) {
          for (const input of [
            t.saved.invocation.arguments,
            { arguments: t.saved.invocation }
          ]) {
            expect(
              (
                await t.host.invoke({
                  name: entry.execution.namespace + '.' + entry.execution.tool,
                  input: { ...entry.execution.arguments, input }
                })
              ).success
            ).toBe(false)
          }
        }
      }

      expect(t.execute).not.toHaveBeenCalled()
    } finally {
      await t.host.dispose()
      t.store.dispose()
    }
  })

  it('executes published recovery after the saved mixed query instead of repeating the invalid path', async () => {
    const t = await setup()

    try {
      const mixed = await t.read(t.saved.fragmentQuery)

      expect(mixed.toolOutcome).toMatchObject({
        status: 'partial',
        settlement: 'completed'
      })
      expect(mixed.apis[0].definition.coverage).toBe('partial')
      expect(mixed.tools[0].definition.coverage).toBe('none')
      const restored = await t.read(mixed.tools[0].definition.recover.arguments)

      expect(restored.toolOutcome.status).toBe('success')
      expect(restored.apis).toHaveLength(0)
      expect(restored.tools).toHaveLength(1)
      const entry = restored.tools[0]
      const path = entry.inputFields.find((value: string) =>
        value.endsWith('/oneOf/0')
      )

      expect(path).toBeDefined()
      expect(entry.fieldQuery).toBeDefined()
      expect(
        (await t.read(entry.fieldQuery.arguments)).toolOutcome.status
      ).toBe('success')
      const corrected = await t.read({
        ...entry.fieldQuery.arguments,
        schemaPaths: [path]
      })

      expect(corrected.tools[0].definition.coverage).toBe('partial')
      const mixedPaths = await t.read({
        ...entry.fieldQuery.arguments,
        schemaPaths: [path, '/missing']
      })

      expect(mixedPaths.toolOutcome.status).toBe('failed')
      expect(mixedPaths.tools[0].definition.coverage).toBe('none')
      const narrower = await t.read(
        mixedPaths.tools[0].definition.recover.arguments
      )

      expect(narrower.toolOutcome.status).toBe('success')
      expect(narrower.tools[0].schemaFragments).toEqual(
        corrected.tools[0].schemaFragments
      )
      const full = await t.read({ names: t.saved.usageQuery.names })

      expect(full.apis[0].inputSchema).toEqual(t.action.inputSchema)
      expect(full.tools[0].inputSchema.anyOf[0].properties.arguments).toEqual(
        t.action.inputSchema
      )
      expect(t.execute).not.toHaveBeenCalled()
      const controller = new AbortController()

      controller.abort()
      await expect(
        t.owner.call(
          'describe_design_apis',
          mixed.tools[0].definition.recover.arguments,
          controller.signal
        )
      ).rejects.toThrow()
      expect(t.execute).not.toHaveBeenCalled()
    } finally {
      await t.host.dispose()
      t.store.dispose()
    }
  })
})

it('keeps union navigation compact while fragments preserve escaped references and common restrictions', async () => {
  const inputSchema = {
    type: 'object',
    required: ['token'],
    properties: { token: { type: 'string' } },
    additionalProperties: false,
    oneOf: [{ $ref: '#/$defs/a~1b~0c' }],
    $defs: {
      'a/b~c': {
        type: 'object',
        properties: {
          token: { type: 'string', enum: ['bounded-secret-detail'] }
        },
        required: ['token'],
        additionalProperties: false
      }
    }
  }
  const action = { ...createDocumentContextAction(vi.fn()), inputSchema }
  const dispatch = vi.fn()
  const owner = createOwner(
    [action],
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    dispatch
  )

  const read = async (args: unknown) =>
    JSON.parse(
      await owner.call(
        'describe_design_apis',
        args,
        new AbortController().signal
      )
    )

  const usage = (await read({ category: 'design', view: 'usage' })).apis[0]

  expect(usage.inputFields).toEqual([
    '/oneOf/0',
    '/properties/token',
    '/$defs/a~1b~0c'
  ])
  expect(JSON.stringify(usage)).not.toContain('bounded-secret-detail')
  expect(usage.fieldQuery).toBeDefined()
  const example = (await read(usage.fieldQuery.arguments)).apis[0]

  expect(example.definition.coverage).toBe('partial')
  for (const path of usage.inputFields) {
    const fragment = (
      await read({ ...usage.fieldQuery.arguments, schemaPaths: [path] })
    ).apis[0]

    expect(fragment.definition.state).toBe('included')
    expect(fragment.schemaContext).toContainEqual({
      path: '',
      schema: {
        type: 'object',
        required: ['token'],
        additionalProperties: false,
        oneOf: inputSchema.oneOf,
        allowedProperties: ['token']
      }
    })
    expect(fragment.schemaReferences['#/$defs/a~1b~0c']).toEqual(
      inputSchema.$defs['a/b~c']
    )
    expect(fragment.unresolvedSchemaReferences).toBeUndefined()
  }

  expect(dispatch).not.toHaveBeenCalled()
})

it('discovers opaque names by owner capability and recovers a wrong identity using the supplied purpose', async () => {
  const candidates = [
    ['a', 'Arrange repeated panes', 'windowLayout'],
    ['b', 'Map glass reflection', 'fillStops'],
    ['c', 'Verify coverage of window panes', 'missingCount'],
    ['arrange_window_layout', 'Export a text note', 'note']
  ].map(([name, description, field]) => ({
    namespace: 'fixture',
    name,
    description,
    inputSchema: { type: 'object' },
    ...toolSemantics(
      { type: 'object', properties: { [field]: { type: 'string' } } },
      'read',
      []
    )
  }))
  const owner = createLocalOperationTools(
    basicApiContracts.slice(0, 1),
    {
      modelActions: (a) => a,

      resolveBatch: (b) => b
    },
    vi.fn(),
    { getNativeTools: () => candidates }
  )

  const search = async (args: unknown) =>
    JSON.parse(
      await owner.call(
        'describe_design_apis',
        args,
        new AbortController().signal
      )
    )

  for (const [purpose, expected] of [
    ['arrange window layout', 'a'],
    ['map glass reflection', 'b'],
    ['verify missing count', 'c']
  ]) {
    const found = await search({ query: purpose })

    expect(found.tools[0].name).toBe(expected)
    const recovery = await search({ names: ['unknown_identity'], purpose })

    expect(recovery.missingNames).toEqual(['unknown_identity'])
    expect(recovery.candidates[0]).toMatchObject({
      name: expected,
      namespace: 'fixture'
    })
  }

  const absent = await search({ names: ['xyzqq'] })

  expect(absent.missingNames).toEqual(['xyzqq'])
  expect(absent.candidates).toEqual([])
})

it('ranks partial nested metadata ahead of misleading names and reuses each catalog generation', async () => {
  const corpus = vi.spyOn(capabilitySearch, 'buildCapabilityCorpus')

  try {
    let revision = 0
    const annotation = vi.fn(
      () => 'Map continuous world gradients across glass faces'
    )
    const schema = {
      type: 'object',
      properties: {
        options: {
          type: 'object',
          properties: {
            field: {
              type: 'string',

              get description() {
                return annotation()
              }
            }
          }
        }
      },
      examples: [{ secretExample: 'unpublishednebula' }]
    }
    let candidates = [
      {
        name: 'a',
        description: 'Arrange panes',
        inputSchema: { type: 'object' }
      },
      { name: 'b', description: 'Apply material', inputSchema: schema },
      {
        name: 'c',
        description: 'Review pane coverage',
        inputSchema: { type: 'object' }
      },
      {
        name: 'continuous_world_gradients_faces',
        description: 'Export a text note',
        inputSchema: { type: 'object' }
      }
    ].map((entry) => ({
      ...entry,
      namespace: 'fixture',
      ...toolSemantics({ type: 'object' }, 'read', [])
    }))
    const owner = createLocalOperationTools(
      basicApiContracts.slice(0, 1),
      {
        modelActions: (actions) => actions,

        resolveBatch: (batch) => batch
      },
      vi.fn(),
      {
        getNativeTools: () => candidates,

        getNativeToolsRevision: () => revision
      }
    )

    const search = async (args: unknown) =>
      JSON.parse(
        await owner.call(
          'describe_design_apis',
          args,
          new AbortController().signal
        )
      )

    const input = {
      query: 'continuous world gradients faces efficiently',
      view: 'usage'
    }
    const first = await search(input)

    expect(first.tools[0]).toMatchObject({
      name: 'b',
      match: {
        metadataTerms: ['continuous', 'world', 'gradients', 'faces'],
        unmatchedTerms: ['efficiently']
      }
    })
    expect(first.tools[0].usageGuide).toBeUndefined()
    const reads = annotation.mock.calls.length

    // One registry fingerprint read and one metadata traversal for this generation.
    expect(reads).toBe(2)
    expect((await search(input)).tools).toEqual(first.tools)
    expect(annotation).toHaveBeenCalledTimes(reads)
    expect(corpus).toHaveBeenCalledTimes(1)
    expect((await search({ query: 'unpublishednebula' })).count).toBe(0)
    const unique = await search({ query: 'Arrange', view: 'usage' })

    expect(unique.tools[0].name).toBe('a')
    expect(unique.tools[0].usageGuide.parameters).toBeDefined()
    expect(unique.tools[0].definition.coverage).toBe('usage')
    const explicit = await search({ ...input, view: 'full' })

    expect(explicit.tools[0].inputSchema).toEqual(candidates[1].inputSchema)
    const fingerprintReads = annotation.mock.calls.length

    revision++
    await search(input)
    expect(annotation).toHaveBeenCalledTimes(fingerprintReads + 1)
    expect(corpus).toHaveBeenCalledTimes(1)
    const readsAfterExplicit = annotation.mock.calls.length

    candidates = candidates.filter((entry) => entry.name !== 'b')
    revision++
    const current = await search(input)

    expect(
      current.tools.some((entry: { name: string }) => entry.name === 'b')
    ).toBe(false)
    expect(annotation).toHaveBeenCalledTimes(readsAfterExplicit)
    expect(
      (await search({ names: ['unknown_identity'], purpose: input.query }))
        .missingNames
    ).toEqual(['unknown_identity'])
    expect(corpus).toHaveBeenCalledTimes(2)
  } finally {
    corpus.mockRestore()
  }
})

it('finds existing vector curve editing using the recorded compound purpose query', async () => {
  const { createAiToolContract } = await import('@asyra/ai-agent-runtime')
  const owner = createLocalOperationTools(
    createBasicApiActions().map(createAiToolContract),
    {
      modelActions: (actions) => actions,

      resolveBatch: (batch) => batch
    },
    vi.fn()
  )
  const found = JSON.parse(
    await owner.call(
      'describe_design_apis',
      { query: 'smooth vector path curves', view: 'usage' },
      new AbortController().signal
    )
  )

  expect(
    found.apis.map((api: { operation: string }) => api.operation)
  ).toContain('element.updateVectorAnchorPointHandles')
})

it('stores authored context without a capture or approval prerequisite', async () => {
  const owner = createLocalOperationTools(
    [],
    {
      modelActions: (actions) => actions,

      resolveBatch: (batch) => batch
    },
    async () => {
      throw new Error('Context must not dispatch canvas work')
    }
  )

  expect(
    owner.definitions.some(
      (tool) => tool.name === AiDesignToolIds.SELECT_DESIGN_REFERENCES
    )
  ).toBe(false)
  expect(
    JSON.parse(
      await owner.call(
        AiDesignToolIds.RECORD_DESIGN_FACTS,
        { facts: [{ id: 'shape', statement: 'A tall outline' }] },
        new AbortController().signal
      )
    )
  ).toMatchObject({ facts: [{ id: 'shape' }] })
  expect(
    JSON.parse(
      await owner.call(
        AiDesignToolIds.RECORD_DESIGN_CALCULATIONS,
        { calculations: [{ id: 'spacing', value: 12, unit: 'px' }] },
        new AbortController().signal
      )
    )
  ).toMatchObject({ calculations: [{ value: 12 }] })
})

it.each(['group existing elements preserve positions', 'group elements'])(
  'ranks grouping purpose %s above incidental preservation prose with opaque identities',
  async (query) => {
    const actions = [
      ...createBasicApiActions(),
      ...createAiActions().filter(
        (action) => action.name === 'map_retained_fills'
      )
    ]
    const groupIndex = actions.findIndex((action) =>
      action.description.startsWith('hierarchy.groupElements.')
    )

    expect(groupIndex).toBeGreaterThanOrEqual(0)
    for (const opaque of [false, true]) {
      const owner = createLocalOperationTools(
        opaque ? [] : actions,
        {
          modelActions: (v) => v,

          resolveBatch: (v) => v
        },
        vi.fn(),
        opaque
          ? {
              getNativeTools: () =>
                actions.map((action, i) => ({
                  ...action,
                  namespace: 'opaque',
                  name: `candidate_${i}`
                }))
            }
          : {}
      )
      const result = JSON.parse(
        await owner.call(
          'describe_design_apis',
          {
            query
          },
          new AbortController().signal
        )
      )
      const first = opaque ? result.tools[0] : result.apis[0]

      expect(first.name).toBe(
        opaque ? `candidate_${groupIndex}` : actions[groupIndex].name
      )
      expect(first.rank).toBe(1)
    }
  }
)

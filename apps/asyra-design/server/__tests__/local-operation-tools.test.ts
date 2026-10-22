import recordedAcceptance from './fixtures/recorded-101/acceptance-context-20261020.json'
import { operationInputIssue } from '../operation-input-schema'
import recordedAcquisition from './fixtures/recorded-101/acquisition-recovery-20261019.json'
import recordedClosure from './fixtures/recorded-101/whole-flow-closure-20261019.json'
import { createAiActions } from '../../src/ai/actions'
import { createDesignEditAction } from '../../src/ai/design-edit-action'
import { createBasicApiActions } from '../../src/ai/basic-api-actions'
import recordedDiscovery from '../../test-data/knowledge-evaluation/evidence/architecture-2026-10-18/discovery-replay.json'
import {
  wholeViewJudgments,
  withReviewBindingActor
} from './fixtures/review-inputs'
import { createRetainedDesignContext } from '../../src/common-apis/retained-design-context'
import sharp from 'sharp'
import { reviewPlanExample } from '../local-design-review'
import { runInNewContext } from 'node:vm'
import {
  createDocumentContextAction,
  createRegionTargetsAction
} from '../../src/ai/context-action'
import {
  prepareOperationBatch,
  runtimeOperationSchema
} from '../local-operation-batch'
import { describeBasicApiResult } from '../../src/ai/basic-api-results'
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
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import { createLocalDesignReview } from '../local-design-review'
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
  LocalOperationPreparationError,
  localToolContent,
  localToolResultExample
} from '../local-operation-tools'
import {
  withToolContractAssertions,
  readCompleteInformation
} from './tool-contract-assertions'
const createLocalOperationTools = (...args: Parameters<typeof createOwner>) =>
  withReviewBindingActor(withToolContractAssertions(createOwner(...args)))
import { createLocalImageTools } from '../local-image-tools'
import { AiActionNames } from '../../src/constants/ai-actions'
import { toolSemantics } from '../../src/ai/tool-contract'

it('refreshes discovery after recipe registration, revision and removal without repeating unchanged inventory', async () => {
  let generation = 0
  const tools: import('../local-operation-tools').NativeToolDescriptor[] = []
  const getNativeTools = vi.fn(() => tools)
  const owner = createLocalOperationTools(
    basicApiContracts,
    { modelActions: (a) => a, resolveBatch: (v) => v },
    vi.fn(),
    { getNativeTools, getNativeToolsRevision: () => generation }
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
  if (!contract) throw new Error(`Missing registered API: ${method}`)
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
      { modelActions: (actions) => actions, resolveBatch: (value) => value },
      vi.fn()
    )
    const definition = owner.definitions.find(
      (tool) => tool.name === action.name
    )
    if (!definition) throw new Error('Missing canonical wrapper')
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute
  )
  const definition = owner.definitions.find((tool) => tool.name === action.name)
  if (!definition) throw new Error('Missing native wrapper')
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
  ).toBeUndefined()
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
    basicApiContracts,
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
  expect(byName.missingNames).toEqual([])
  expect(byName.apis.map((api: { name: string }) => api.name)).toEqual(
    selected.map((api) => api.name)
  )
  for (let i = 0; i < selected.length; i++)
    expect(byName.apis[i].inputSchema).toEqual(selected[i].inputSchema)
  expect(execute).not.toHaveBeenCalled()
})

it('returns qualified choices for an ambiguous native name instead of selecting a route', async () => {
  const native = ['first', 'second'].map((namespace) => ({
    name: 'build',
    namespace,
    description: 'Build',
    inputSchema: { type: 'object' }
  }))
  const tools = createLocalOperationTools(
    basicApiContracts,
    { modelActions: (a) => a, resolveBatch: (v) => v },
    vi.fn(),
    { getNativeTools: () => native }
  )
  const result = JSON.parse(
    await tools.call(
      'describe_design_apis',
      { names: ['build'] },
      new AbortController().signal
    )
  )
  expect(result.tools).toEqual([])
  expect(result.ambiguousNames).toEqual([
    { name: 'build', candidates: ['first.build', 'second.build'] }
  ])
  expect(result).toMatchObject({ status: 'failed', settlement: 'completed' })
  const { invokeLocalTool } = await import('../local-tool-invocation')
  const definition = tools.definitions.find(
    (d) => d.name === 'describe_design_apis'
  )
  if (!definition) throw new Error('Missing discovery definition')
  const reply = await invokeLocalTool(
    tools,
    definition,
    { names: ['build'] },
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
      { names: ['first.build'] },
      new AbortController().signal
    )
  )
  expect(exact.tools[0].execution).toEqual({
    kind: 'native-tool',
    namespace: 'first',
    tool: 'build'
  })
})

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
    { modelActions: (actions) => actions, resolveBatch: (value) => value },
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
  it('reviews measurements before images and resolves text overflow before completion', async () => {
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
      { modelActions: (a) => a, resolveBatch: (v) => v },
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
      AiActionNames.REVIEW_DESIGN
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
    ).toMatchObject({ outcome: 'unsupported' })
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
    ).toMatchObject({ outcome: 'unsupported' })
    overflow = false
    executeBatch.mockClear()
    await operations.call(
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      { arguments: { elementId: 't' } },
      signal
    )
    expect(executeBatch.mock.calls.map(([b]) => b.actions[0].name)).toEqual([
      AiActionNames.UPDATE_DESIGN_ELEMENT,
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.INSPECT_DRAWING
    ])
    expect(
      operations.settleOutcome(outcome).actions[0].arguments
    ).toMatchObject({ outcome: 'unsupported' })
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
      { modelActions: (a) => a, resolveBatch: (v) => v },
      executeBatch
    )
    const signal = new AbortController().signal
    for (let i = 0; i < 9; i++)
      await operations.call(
        AiActionNames.UPDATE_DESIGN_ELEMENT,
        { arguments: { elementId: 't' } },
        signal
      )
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
        { modelActions: (actions) => actions, resolveBatch: (value) => value },
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
      { modelActions: (actions) => actions, resolveBatch: (value) => value },
      executeBatch
    )
    const signal = new AbortController().signal
    for (let i = 0; i < 6; i++)
      await operations.call(
        AiActionNames.INSPECT_DRAWING,
        { arguments: { elementId: 'drawing' } },
        signal
      )
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
      { modelActions: (actions) => actions, resolveBatch: (value) => value },
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
    if (!prepared) throw new Error('Missing prepared batch')
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
      )?.inputSchema.required
    ).toEqual(['arguments'])
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
    expect(operations.definitions).toEqual([])
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
      if (action.name === AiActionNames.REVIEW_DESIGN)
        return {
          actionId: action.id,
          actionName: action.name,
          result: {
            complete: true,
            findings: [],
            evidence: { sessionId: 'capture', revision: 1 }
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
  expect(execute).toHaveBeenCalledTimes(6)
  expect(execute.mock.calls[2][0].actions[0]).toMatchObject({
    name: AiActionNames.INSPECT_DRAWING,
    arguments: { elementId: 'actual-composition' }
  })
})

it('continues mutations beyond six reviews and never certifies unavailable evidence', async () => {
  let available = false
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    actionResults: batch.actions.map((action) => {
      if (action.name === AiActionNames.REVIEW_DESIGN)
        return {
          actionId: action.id,
          actionName: action.name,
          result: {
            complete: true,
            findings: [],
            evidence: { sessionId: 'capture', revision: 1 }
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
    message: 'This app could not complete visual review of the drawing.'
  })
  available = true
  await change()
  expect(tools.settleOutcome(completed).actions[0].arguments).toMatchObject({
    outcome: 'unsupported'
  })
  for (let index = 2; index < 6; index++) await change()
  expect(execute).toHaveBeenCalledTimes(18)
  await change()
  expect(execute).toHaveBeenCalledTimes(21)
})

it('does not admit unreviewed mutations in the final response', () => {
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
  ).toThrow('Final response cannot contain unreviewed drawing operations')
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
    { modelActions: (actions) => actions, resolveBatch: (value) => value },
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

it('does not equate an available screenshot with an accepted design review', async () => {
  const tools = createLocalOperationTools(
    [AiActionNames.INSPECT_DRAWING, AiActionNames.SET_ELEMENT_VISIBILITY].map(
      (name) => ({ name, description: name, inputSchema: {} })
    ),
    { modelActions: (a) => a, resolveBatch: (b) => b },
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
  expect(result.actions[0].arguments).toMatchObject({ outcome: 'unsupported' })
  expect(
    tools.settleOutcome({ batchId: 'silent', actions: [] }).actions
  ).toContainEqual(
    expect.objectContaining({
      name: AiActionNames.REPORT_OUTCOME,
      arguments: expect.objectContaining({ outcome: 'unsupported' })
    })
  )
})

it('requires a frozen plan, current overview and detail evidence, and all criteria before completion', async () => {
  const results: Record<string, unknown> = {
    [AiActionNames.REVIEW_DESIGN]: {
      complete: true,
      findings: [],
      measuredTextIds: [],
      evidence: { sessionId: 'app-session', revision: 1 }
    },
    [AiActionNames.INSPECT_DRAWING]: {
      available: true,
      evidence: { sessionId: 'app-session', revision: 1 },
      image: { dataUrl: png, width: 1, height: 1 }
    },
    [AiActionNames.VALIDATE_INSPECTION_EVIDENCE]: {
      current: true,
      validatedAt: { sessionId: 'validation-fixture', revision: 1 },
      coverage: { complete: true }
    }
  }
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result: results[action.name] ?? { compositionId: 'drawing' }
    }))
  }))
  const tools = createLocalOperationTools(
    [
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
      AiActionNames.SET_ELEMENT_VISIBILITY
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (a) => a, resolveBatch: (b) => b },
    execute
  )
  const signal = new AbortController().signal
  const call = (name: string, args: unknown) =>
    tools.call(name, args, signal).then(JSON.parse)
  const plan = {
    phase: 'plan',
    method: 'Trace a verified reference, preserve native background geometry',
    references: ['https://example.com/reference.png'],
    criteria: reviewCriteria([
      'Silhouette and proportions match',
      'Window details match'
    ]),
    structureCriteria: ['Silhouette and proportions match'],
    detailRequired: true
  }
  await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, plan)
  const change = () =>
    call(AiActionNames.SET_ELEMENT_VISIBILITY, {
      arguments: { elementIds: ['shape'], visible: true }
    })
  const getId = (receipt: {
    actionResults: { result: { inspectionId?: string } }[]
  }) =>
    receipt.actionResults.find((entry) => entry.result.inspectionId)?.result
      .inspectionId
  const overviewReceipt = await change()
  const overviewId = getId(overviewReceipt)
  expect(
    await localToolContent(JSON.stringify(overviewReceipt))
  ).toContainEqual({
    type: 'inputImage',
    imageUrl: png
  })
  expect(overviewId).toEqual(expect.any(String))
  const report = {
    phase: 'visual',
    ...wholeViewJudgments(
      [overviewId],
      Object.keys(plan.criteria).map((criterionId) => ({
        criterionId,
        status: 'pass',
        evidence:
          'Compared the rendered outline and repeated window structure with the reference.',
        inspectionIds: [overviewId]
      }))
    )
  }
  await expect(
    call(AiDesignToolIds.REVIEW_DRAWING, report)
  ).resolves.toMatchObject({ accepted: false })

  const detailId = getId(
    await call(AiActionNames.INSPECT_DRAWING, {
      arguments: { elementId: 'windows', view: 'detail' }
    })
  )
  report.inspectionIds.push(detailId)
  await expect(
    call(AiDesignToolIds.REVIEW_DRAWING, {
      ...report,
      checks: report.checks.slice(0, 1)
    })
  ).resolves.toMatchObject({ accepted: true })
  const completed = {
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
  const failed = {
    ...report,
    checks: report.checks.map((check) => ({
      ...check,
      status: 'fail',
      evidence: 'Windows are missing.'
    }))
  }
  await call(AiDesignToolIds.REVIEW_DRAWING, failed)
  expect(tools.settleOutcome(completed).actions[0].arguments).toMatchObject({
    outcome: 'unsupported',
    message: expect.stringContaining('Windows are missing')
  })
  await call(AiDesignToolIds.REVIEW_DRAWING, report)
  expect(tools.settleOutcome(completed)).toBe(completed)
  const rebound = await call(AiDesignToolIds.REVIEW_DRAWING, {
    phase: 'visual',
    bindChecks: [
      {
        criterionId: Object.keys(plan.criteria)[0],
        inspectionIds: report.inspectionIds
      }
    ]
  })
  expect(rebound).toMatchObject({
    reviewOperation: 'bind',
    recordedChecks: [],
    accepted: true
  })
  expect(tools.settleOutcome(completed)).toBe(completed)
  const structureFailure = {
    phase: 'structure',
    ...wholeViewJudgments(report.inspectionIds, [
      {
        ...report.checks[0],
        status: 'fail',
        evidence: 'The base outline needs correction.'
      }
    ])
  }
  await expect(
    call(AiDesignToolIds.REVIEW_DRAWING, structureFailure)
  ).resolves.toMatchObject({ accepted: false, structureAccepted: false })
  expect(tools.settleOutcome(completed).actions[0].arguments).toMatchObject({
    outcome: 'unsupported',
    message: expect.stringContaining('base outline')
  })
  await expect(
    call(AiDesignToolIds.REVIEW_DRAWING, {
      ...report,
      checks: report.checks.slice(0, 1)
    })
  ).resolves.toMatchObject({ accepted: true, coverage: { passed: 2 } })
  expect(tools.settleOutcome(completed)).toBe(completed)
  await change()
  expect(tools.settleOutcome(completed).actions[0].arguments).toMatchObject({
    outcome: 'unsupported'
  })
  await expect(call(AiDesignToolIds.REVIEW_DRAWING, report)).resolves.toEqual(
    expect.objectContaining({ status: 'partial', accepted: false })
  )
  await expect(
    call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, plan)
  ).resolves.toMatchObject({ recorded: true })
  await expect(
    call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
      ...plan,
      criteria: reviewCriteria(['Reduced requirement'])
    })
  ).rejects.toThrow('cannot be rewritten')
  // Inspection must not turn a detail target into the automatic composition target.
  expect(execute.mock.calls.at(-1)?.[0].actions[0].arguments).toEqual({
    elementId: 'drawing'
  })
})

it('accepts intentionally ugly low-detail work against user criteria with only an overview', () => {
  const review = createLocalDesignReview()
  const criterionId =
    'An intentionally ugly, rough, asymmetric face with three crude shapes'
  review.record({
    phase: 'plan',
    method: 'Use three deliberately uneven native shapes',
    references: [],
    criteria: reviewCriteria([criterionId]),
    detailRequired: false
  })
  review.mutate()
  const evidence = review.inspect('face', true, true)
  expect(evidence).toBeDefined()
  if (!evidence) throw new Error('Missing inspection receipt')
  const result = review.record({
    phase: 'visual',
    ...wholeViewJudgments(
      [evidence.inspectionId],
      [
        {
          criterionId,
          status: 'pass',
          evidence:
            'The overview shows exactly three uneven shapes, a crooked mouth and intentionally mismatched eyes.'
        }
      ]
    )
  })
  expect(result.accepted).toBe(true)
  expect(review.getIssue()).toBeUndefined()
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

it('keeps same-revision receipts valid across repeated captures and distinguishes regional detail', () => {
  const review = createLocalDesignReview()
  const criterion = 'The requested composition and local details are present'
  review.record({
    phase: 'plan',
    method: 'Inspect actual output',
    references: [],
    criteria: reviewCriteria([criterion]),
    detailRequired: true
  })
  review.mutate()
  const overview = review.inspect('drawing', true, true)
  const detail = review.inspect('window', true, false)
  if (!overview || !detail) throw new Error('Missing inspection receipts')
  expect(review.inspect('drawing', true, true)).toEqual(overview)
  expect(review.inspect('window', true, false)).toEqual(detail)
  const report = {
    phase: 'visual',
    ...wholeViewJudgments(
      [overview.inspectionId, detail.inspectionId],
      [
        {
          criterionId: criterion,
          status: 'pass',
          evidence: 'Compared the whole composition and the window detail.'
        }
      ]
    )
  }
  expect(review.record(report).accepted).toBe(true)
  review.mutate()
  expect(() => review.record(report)).toThrow('current inspection IDs')
})

it('accepts regional detail on the composition but never promotes it to overview evidence', () => {
  const review = createLocalDesignReview()
  review.record({
    phase: 'plan',
    method: 'Compare overview and native detail',
    references: [],
    criteria: reviewCriteria(['Match the request']),
    detailRequired: true
  })
  review.mutate()
  const overview = review.inspect('drawing', true, true)
  const region = { x: 10, y: 20, width: 100, height: 100 }
  const detail = review.inspect('drawing', true, false, region)
  if (!overview || !detail) throw new Error('Missing inspection receipts')
  expect(detail.inspectionId).not.toBe(overview.inspectionId)
  expect(review.inspect('drawing', true, false, { ...region })).toEqual(detail)
  const checks = [
    {
      criterionId: 'Match the request',
      status: 'pass',
      evidence: 'Whole silhouette and native window detail match.'
    }
  ]
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments([detail.inspectionId], checks)
    })
  ).toMatchObject({
    accepted: false,
    coverage: {
      pending: [expect.objectContaining({ reason: 'whole-view-required' })]
    }
  })
  expect(
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(
        [overview.inspectionId, detail.inspectionId],
        checks
      )
    }).accepted
  ).toBe(true)
  review.mutate()
  expect(() =>
    review.record({
      phase: 'visual',
      ...wholeViewJudgments(
        [overview.inspectionId, detail.inspectionId],
        checks
      )
    })
  ).toThrow('current inspection IDs')
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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

it('accepts the whole drawing after a late detail group is ungrouped and reparented', async () => {
  const stamp = { sessionId: 'regrouped-document', revision: 1 }
  let towerContainsDetail = true
  const moveName = basicActionName('moveElements')
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => {
      let result: Record<string, unknown> = {}
      if (action.name === AiActionNames.ORGANIZE_DESIGN) {
        result = {
          status: 'complete',
          ...action.arguments,
          ...(action.arguments.operation === 'group'
            ? { groupId: 'tower' }
            : {}),
          ...(action.arguments.operation === 'ungroup'
            ? { groupId: 'collar', elementIds: ['collar-face'], removed: true }
            : {})
        }
      } else if (action.name === AiActionNames.APPLY_PREPARED_DESIGN) {
        result = { compositionId: 'collar' }
      } else if (action.name === AiActionNames.INSPECT_DRAWING) {
        result = {
          available: true,
          evidence: stamp,
          imageScope: 'overview',
          image: { dataUrl: png, width: 1, height: 1 }
        }
      } else if (action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE) {
        const scope = action.arguments.scope as
          { overviewIds?: string[] } | undefined
        result = {
          current: true,
          validatedAt: { sessionId: 'validation-fixture', revision: 1 },
          coverage: {
            complete:
              towerContainsDetail && scope?.overviewIds?.includes('tower'),
            missingIds: [],
            uncoveredIds: []
          }
        }
      } else if (action.name === moveName) {
        result = {
          status: 'complete',
          value: null,
          mutationScope: {
            complete: true,
            elementIds: ['collar-face', 'tower'],
            removedElementIds: []
          }
        }
      } else if (action.name === AiActionNames.REVIEW_DESIGN) {
        result = {
          complete: true,
          evidence: stamp,
          findings: [],
          measuredTextIds: []
        }
      }
      return { actionId: action.id, actionName: action.name, result }
    })
  }))
  const tools = createLocalOperationTools(
    [
      AiActionNames.ORGANIZE_DESIGN,
      AiActionNames.APPLY_PREPARED_DESIGN,
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
      moveName
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (a) => a, resolveBatch: (b) => b },
    execute,
    { reviewTargetId: 'body' }
  )
  const call = (name: string, args: unknown) =>
    tools.call(name, args, new AbortController().signal).then(JSON.parse)
  await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
    phase: 'plan',
    method: 'Draw and refine',
    references: [],
    criteria: reviewCriteria(['Shape']),
    detailRequired: false
  })
  await call(AiActionNames.ORGANIZE_DESIGN, {
    arguments: { operation: 'group', elementIds: ['body'] },
    inspection: 'defer'
  })
  await call(AiActionNames.APPLY_PREPARED_DESIGN, {
    arguments: {},
    inspection: 'defer'
  })
  await call(AiActionNames.ORGANIZE_DESIGN, {
    arguments: { operation: 'ungroup', elementIds: ['collar'] },
    inspection: 'defer'
  })
  await call(moveName, {
    arguments: {
      request: {
        elementIds: ['collar-face'],
        targetParentId: 'tower',
        targetIndex: 1
      }
    },
    inspection: 'defer'
  })
  const unrelated = await call(AiActionNames.INSPECT_DRAWING, {
    arguments: { elementId: 'other', view: 'overview' }
  })
  await expect(
    call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: 'visual',
      ...wholeViewJudgments(
        [unrelated.actionResults[0].result.inspectionId],
        [{ criterionId: 'Shape', status: 'pass', evidence: 'Unrelated image' }]
      )
    })
  ).resolves.toMatchObject({
    status: 'partial',
    accepted: false,
    evidenceValidation: { coverage: { complete: false } }
  })
  const inspected = await call(AiActionNames.INSPECT_DRAWING, {
    arguments: { elementId: 'tower', view: 'overview' }
  })
  await expect(
    call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: 'visual',
      ...wholeViewJudgments(
        [inspected.actionResults[0].result.inspectionId],
        [
          {
            criterionId: 'Shape',
            status: 'pass',
            evidence: 'Whole tower visible'
          }
        ]
      )
    })
  ).resolves.toMatchObject({ accepted: true })
  const validation = execute.mock.calls.findLast(
    ([batch]) =>
      batch.actions[0].name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE &&
      'scope' in batch.actions[0].arguments
  )?.[0]
  expect(validation?.actions[0].arguments).toMatchObject({
    scope: { requiredIds: ['tower', 'collar-face'], overviewIds: ['tower'] }
  })
  expect(
    execute.mock.calls
      .filter(
        ([batch]) => batch.actions[0].name === AiActionNames.REVIEW_DESIGN
      )
      .map(([batch]) => batch.actions[0].arguments.elementId)
  ).toEqual(['tower', 'collar', 'collar-face'])
  towerContainsDetail = false
  await tools.validateCompletion()
  const final = tools.settleOutcome({
    batchId: 'done',
    actions: [
      {
        id: 'done',
        name: AiActionNames.REPORT_OUTCOME,
        arguments: { outcome: 'completed' },
        summary: 'Done'
      }
    ]
  })
  expect(final.actions[0].arguments.outcome).toBe('unsupported')
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
      if (action.name === removal.name) result = removal.result
      if (action.name === AiActionNames.APPLY_PREPARED_DESIGN)
        result = { compositionId: 'successor' }
      if (action.name === AiActionNames.INSPECT_DRAWING)
        result = {
          available: true,
          image: { dataUrl: png },
          evidence: { sessionId: 'doc', revision: 1 }
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
    { modelActions: (a) => a, resolveBatch: (b) => b },
    execute,
    { reviewTargetId: 'original' }
  )
  const call = (name: string, args: unknown) =>
    tools.call(name, args, new AbortController().signal).then(JSON.parse)
  await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
    phase: 'plan',
    method: 'Refine',
    references: [],
    criteria: reviewCriteria(['Shape']),
    detailRequired: false
  })
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
  await call(AiDesignToolIds.REVIEW_DRAWING, {
    phase: 'visual',
    ...wholeViewJudgments(
      [image.actionResults[0].result.inspectionId],
      [{ criterionId: 'Shape', status: 'pass', evidence: 'Refined shape' }]
    )
  })
  expect(capturedScope).toEqual({
    requiredIds: ['successor'],
    overviewIds: ['successor']
  })
})

it('checks each deferred mutation and reuses current measurements for capture and final assessment', async () => {
  const results: Record<string, unknown> = {
    [AiActionNames.INSPECT_DRAWING]: {
      available: true,
      evidence: { sessionId: 'app-session', revision: 1 },
      imageScope: 'overview',
      image: { dataUrl: png, width: 1, height: 1 }
    },
    [AiActionNames.VALIDATE_INSPECTION_EVIDENCE]: {
      current: true,
      validatedAt: { sessionId: 'validation-fixture', revision: 1 },
      coverage: { complete: true }
    },
    [AiActionNames.REVIEW_DESIGN]: {
      complete: true,
      evidence: { sessionId: 'app-session', revision: 1 },
      measuredTextIds: [],
      findings: []
    },
    [AiActionNames.APPLY_PREPARED_DESIGN]: {
      compositionId: 'drawing',
      applied: true
    }
  }
  let revision = 1
  const executeBatch = vi.fn(async (batch: AiActionBatch) => {
    const action = batch.actions[0]
    if (action.name === AiActionNames.APPLY_PREPARED_DESIGN) revision++
    const value = results[action.name] as Record<string, unknown>
    let result = value
    if (action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE)
      result = {
        ...value,
        current:
          (action.arguments.evidence as { revision: number }).revision ===
          revision
      }
    else if (value && 'evidence' in value)
      result = { ...value, evidence: { sessionId: 'app-session', revision } }
    return {
      context: {},
      actionResults: [
        {
          actionId: action.id,
          actionName: action.name,
          result
        }
      ]
    }
  })
  const operations = createLocalOperationTools(
    [
      AiActionNames.APPLY_PREPARED_DESIGN,
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (a) => a, resolveBatch: (v) => v },
    executeBatch
  )
  const signal = new AbortController().signal
  await operations.call(
    AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
    {
      phase: 'plan',
      method: 'Build one stage',
      references: [],
      criteria: reviewCriteria(['Match the requested design']),
      detailRequired: false
    },
    signal
  )
  for (let i = 0; i < 3; i++) {
    const result = JSON.parse(
      await operations.call(
        AiActionNames.APPLY_PREPARED_DESIGN,
        {
          arguments: { artifactId: 'prepared-' + i },
          inspection: 'defer'
        },
        signal
      )
    )
    expect(result.actionResults[0].result).toMatchObject({ applied: true })
    expect(result.inspectionDeferred).toBe(true)
  }
  const names = () =>
    executeBatch.mock.calls.map(([batch]) => batch.actions[0].name)
  expect(
    names().filter((name) => name === AiActionNames.APPLY_PREPARED_DESIGN)
  ).toHaveLength(3)
  expect(
    names().filter((name) => name === AiActionNames.REVIEW_DESIGN)
  ).toHaveLength(3)
  expect(
    names().filter((name) => name === AiActionNames.INSPECT_DRAWING)
  ).toHaveLength(0)
  const outcome: AiActionBatch = {
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
  expect(operations.settleOutcome(outcome).actions[0].arguments.outcome).toBe(
    'unsupported'
  )
  const capture = JSON.parse(
    await operations.call(
      AiActionNames.INSPECT_DRAWING,
      {
        arguments: { elementId: 'drawing' }
      },
      signal
    )
  )
  expect(
    names().filter((name) => name === AiActionNames.INSPECT_DRAWING)
  ).toHaveLength(1)
  const inspectionId = capture.actionResults[0].result.inspectionId
  expect(
    names().filter((name) => name === AiActionNames.REVIEW_DESIGN)
  ).toHaveLength(3)
  expect(
    names().filter((name) => name === AiActionNames.INSPECT_DRAWING)
  ).toHaveLength(1)
  await operations.call(
    AiDesignToolIds.REVIEW_DRAWING,
    {
      phase: 'visual',
      ...wholeViewJudgments(
        [inspectionId],
        [
          {
            criterionId: 'Match the requested design',
            status: 'pass',
            evidence: 'Checked the final combined stage'
          }
        ]
      )
    },
    signal
  )
  expect(
    names().filter((name) => name === AiActionNames.REVIEW_DESIGN)
  ).toHaveLength(3)
  expect(operations.settleOutcome(outcome)).toEqual(outcome)
  await operations.call(
    AiActionNames.INSPECT_DRAWING,
    { arguments: { elementId: 'drawing' } },
    signal
  )
  expect(
    names().filter((name) => name === AiActionNames.REVIEW_DESIGN)
  ).toHaveLength(3)

  results[AiActionNames.REVIEW_DESIGN] = {
    complete: false,
    findings: [],
    measuredTextIds: []
  }
  await operations.call(
    AiActionNames.APPLY_PREPARED_DESIGN,
    {
      arguments: { artifactId: 'correction' },
      inspection: 'defer'
    },
    signal
  )
  expect(operations.settleOutcome(outcome).actions[0].arguments.outcome).toBe(
    'unsupported'
  )
  const failedCapture = JSON.parse(
    await operations.call(
      AiActionNames.INSPECT_DRAWING,
      { arguments: { elementId: 'drawing' } },
      signal
    )
  )
  expect(
    names().filter((name) => name === AiActionNames.REVIEW_DESIGN)
  ).toHaveLength(4)
  await operations.call(
    AiDesignToolIds.REVIEW_DRAWING,
    {
      phase: 'visual',
      ...wholeViewJudgments(
        [failedCapture.actionResults[0].result.inspectionId],
        [
          {
            criterionId: 'Match the requested design',
            status: 'pass',
            evidence: 'Image inspected but measurement incomplete'
          }
        ]
      )
    },
    signal
  )
  expect(
    names().filter((name) => name === AiActionNames.REVIEW_DESIGN)
  ).toHaveLength(5)
  expect(operations.settleOutcome(outcome).actions[0].arguments).toMatchObject({
    outcome: 'unsupported',
    message: 'The latest drawing still needs layout measurement.'
  })
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
  ).rejects.toThrow(LocalOperationPreparationError)
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
    ).rejects.toThrow(LocalOperationPreparationError)
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
    if (action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE)
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
    if (action.name === AiActionNames.REVIEW_DESIGN)
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
    executeBatch,
    { reviewTargetId: 'whole' }
  )
  const signal = new AbortController().signal
  await operations.call(
    AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
    {
      phase: 'plan',
      method: 'Refine the glass',
      references: [],
      criteria: reviewCriteria(['Reflective glass']),
      detailRequired: true
    },
    signal
  )
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
  const overview = await capture('whole', 'overview')
  const detail = await capture('child', 'detail')
  const review = JSON.parse(
    await operations.call(
      AiDesignToolIds.REVIEW_DRAWING,
      {
        phase: 'visual',
        ...wholeViewJudgments(
          [overview, detail],
          [
            {
              criterionId: 'Reflective glass',
              status: 'pass',
              evidence: 'Current overview and native glass detail inspected'
            }
          ]
        )
      },
      signal
    )
  )
  expect(review.accepted).toBe(true)
  await operations.call(
    AiActionNames.UPDATE_DESIGN_ELEMENT,
    {
      arguments: { elementId: 'child' },
      inspection: 'defer'
    },
    signal
  )
  await expect(
    operations.call(
      AiDesignToolIds.REVIEW_DRAWING,
      {
        phase: 'visual',
        ...wholeViewJudgments(
          [overview, detail],
          [
            {
              criterionId: 'Reflective glass',
              status: 'pass',
              evidence: 'Old inspection'
            }
          ]
        )
      },
      signal
    )
  ).resolves.toContain('"accepted":false')
})

it('does not reuse layout results across edits without canonical revision evidence', async () => {
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
            if (a.name === AiActionNames.REVIEW_DESIGN)
              return { complete: true, findings: [], measuredTextIds: [] }
            if (a.name === AiActionNames.INSPECT_DRAWING)
              return { available: true, image: { dataUrl: png } }
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
  expect(reviews()).toEqual([{ elementId: 'text' }])
  await tools.call(
    AiActionNames.REVIEW_DESIGN,
    { arguments: { elementId: 'root' } },
    signal
  )
  expect(reviews()).toEqual([{ elementId: 'text' }, { elementId: 'root' }])
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
  ).toBe('unsupported')
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
  expect(reviews()).toEqual([{ elementId: 'text' }])
  await tools.call(
    AiActionNames.REVIEW_DESIGN,
    { arguments: { elementId: 'root' } },
    signal
  )
  expect(reviews()).toEqual([{ elementId: 'text' }, { elementId: 'root' }])
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
  ).toBe('unsupported')
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
  expect(reviews()).toEqual([{ elementId: 'text' }, { elementId: 'text' }])
  await tools.call(
    AiActionNames.REVIEW_DESIGN,
    { arguments: { elementId: 'root' } },
    signal
  )
  expect(reviews()).toEqual([
    { elementId: 'text' },
    { elementId: 'text' },
    { elementId: 'root' }
  ])
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
  ).toBe('unsupported')
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
  expect(reviews()).toEqual([{ elementId: 'text' }, { elementId: 'text' }])
  await tools.call(
    AiActionNames.REVIEW_DESIGN,
    { arguments: { elementId: 'root' } },
    signal
  )
  expect(reviews()).toEqual([
    { elementId: 'text' },
    { elementId: 'text' },
    { elementId: 'root' }
  ])
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
  ).toBe('unsupported')
})

it('dispatches many registered edits once and reviews the completed batch once', async () => {
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((a) => {
      let result: unknown = { available: true }
      if (a.name === AiActionNames.REVIEW_DESIGN)
        result = {
          complete: true,
          evidence: { sessionId: 'doc', revision: 1 },
          findings: [],
          measuredTextIds: []
        }
      else if (a.name === AiActionNames.SET_ELEMENT_VISIBILITY)
        result = { changed: true, elementId: a.arguments.elementId }
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute,
    { reviewTargetId: 'root' }
  )
  await tools.call(
    'execute_design_batch',
    {
      operations: Array.from({ length: 47 }, (_, i) => ({
        name: action.name,
        arguments: { elementId: `id-${i}`, visible: false }
      }))
    },
    new AbortController().signal
  )
  expect(execute.mock.calls.map(([b]) => b.actions.length)).toEqual([47, 47, 1])
  expect(execute.mock.calls[0][0].actions.map((a) => a.arguments)).toEqual(
    Array.from({ length: 47 }, (_, i) => ({
      elementId: `id-${i}`,
      visible: false
    }))
  )
  execute.mockClear()
  await expect(
    tools.call(
      'execute_design_batch',
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
    { modelActions: (a) => a, resolveBatch: (v) => v, resolveTargets },
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
    await tools.call(
      'execute_design_batch',
      input,
      new AbortController().signal
    )
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
    tools.call('execute_design_batch', input, aborted.signal)
  ).rejects.toThrow()
  expect(execute).not.toHaveBeenCalled()
  execute.mockRejectedValueOnce(new Error('Target removed or locked'))
  const rejected = JSON.parse(
    await tools.call(
      'execute_design_batch',
      input,
      new AbortController().signal
    )
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
    { modelActions: (value) => value, resolveBatch: (value) => value },
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
    count: 1,
    catalogSize: actions.length,
    apis: [{ name: custom.name, description: custom.description }]
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
  const empty = await call({ query: 'unmatched-quasar-blueprint' })
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute
  )
  const signal = new AbortController().signal
  await operations.call(
    AiDesignToolIds.EXECUTE_DESIGN_BATCH,
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

it('reports exact review input fields before stateful evidence validation', async () => {
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.INSPECT_DRAWING,
        description: 'Inspect',
        inputSchema: {}
      }
    ],
    { modelActions: (a) => a, resolveBatch: (b) => b },
    async () => ({ actionResults: [], context: {} })
  )
  await expect(
    tools.call(
      AiDesignToolIds.REVIEW_DRAWING,
      {
        phase: 'visual',
        ...wholeViewJudgments(
          ['current'],
          [{ status: 'pass', evidence: 'Visible' }]
        )
      },
      new AbortController().signal
    )
  ).rejects.toThrow('bindChecks[0].criterionId')
})

it.each(['assessment', 'completion'])(
  'rejects stale %s when the App reports an external change after capture',
  async (stage) => {
    let current = true
    const validateName = AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    const execute = vi.fn(async (batch: AiActionBatch) => ({
      context: {},
      actionResults: batch.actions.map((action) => ({
        actionId: action.id,
        actionName: action.name,
        result:
          action.name === validateName
            ? {
                current,
                validatedAt: { sessionId: 'validation-fixture', revision: 1 },
                coverage: { complete: current }
              }
            : {
                available: true,
                image: { dataUrl: 'data:image/png;base64,AA==' },
                evidence: { sessionId: 'app-session', revision: 1 }
              }
      }))
    }))
    const operations = createLocalOperationTools(
      [AiActionNames.INSPECT_DRAWING, validateName].map((name) => ({
        name,
        description: name,
        inputSchema: {}
      })),
      { modelActions: (actions) => actions, resolveBatch: (value) => value },
      execute,
      { reviewTargetId: 'drawing' }
    )
    const signal = new AbortController().signal
    await operations.call(
      AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
      {
        phase: 'plan',
        method: 'Match the brief',
        references: [],
        criteria: reviewCriteria(['Appearance']),
        detailRequired: false
      },
      signal
    )
    const capture = JSON.parse(
      await operations.call(
        AiActionNames.INSPECT_DRAWING,
        {
          arguments: { elementId: 'drawing' }
        },
        signal
      )
    )
    const assessment = {
      phase: 'visual',
      ...wholeViewJudgments(
        [capture.actionResults[0].result.inspectionId],
        [{ criterionId: 'Appearance', status: 'pass', evidence: 'Matches' }]
      )
    }
    expect(
      JSON.parse(
        await operations.call(
          AiDesignToolIds.REVIEW_DRAWING,
          assessment,
          signal
        )
      )
    ).toMatchObject({ accepted: true })
    current = false
    if (stage === 'assessment') {
      expect(
        JSON.parse(
          await operations.call(
            AiDesignToolIds.REVIEW_DRAWING,
            assessment,
            signal
          )
        )
      ).toMatchObject({
        status: 'partial',
        accepted: false,
        evidenceValidation: { current: false }
      })
    } else {
      await operations.validateCompletion(signal)
      const settled = operations.settleOutcome({
        batchId: 'done',
        actions: [
          {
            id: 'done',
            name: AiActionNames.REPORT_OUTCOME,
            arguments: { outcome: 'completed', message: 'Done' },
            summary: 'Done'
          }
        ]
      })
      expect(settled.actions[0].arguments).toMatchObject({
        outcome: 'unsupported'
      })
    }
    expect(
      execute.mock.calls.filter(
        ([batch]) => batch.actions[0].name === validateName
      )
    ).toHaveLength(3)
  }
)

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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
  expect(measurements()).toBe(1)
  await operations.call(
    AiActionNames.REVIEW_DESIGN,
    { arguments: { elementId: 'drawing' } },
    signal
  )
  expect(measurements()).toBe(2)
  await inspect()
  expect(measurements()).toBe(2)
})

it.each(['missing stamp', 'missing validation action'])(
  'cannot approve evidence with %s',
  async (missing) => {
    const execute = vi.fn(async (batch: AiActionBatch) => ({
      context: {},
      actionResults: [
        {
          actionId: batch.actions[0].id,
          actionName: AiActionNames.INSPECT_DRAWING,
          result: {
            available: true,
            image: { dataUrl: png },
            ...(missing === 'missing stamp'
              ? {}
              : { evidence: { sessionId: 'app', revision: 1 } })
          }
        }
      ]
    }))
    const names: string[] = [AiActionNames.INSPECT_DRAWING]
    const actions = names.map((name) => ({
      name,
      description: name,
      inputSchema: {}
    }))
    if (missing === 'missing stamp')
      actions.push({
        name: AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
        description: 'Validate',
        inputSchema: {}
      })
    const tools = createLocalOperationTools(
      actions,
      { modelActions: (a) => a, resolveBatch: (v) => v },
      execute,
      { reviewTargetId: 'drawing' }
    )
    const signal = new AbortController().signal
    await tools.call(
      AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
      {
        phase: 'plan',
        method: 'Match',
        references: [],
        criteria: reviewCriteria(['Appearance']),
        detailRequired: false
      },
      signal
    )
    const capture = JSON.parse(
      await tools.call(
        AiActionNames.INSPECT_DRAWING,
        { arguments: { elementId: 'drawing' } },
        signal
      )
    )
    await expect(
      tools.call(
        AiDesignToolIds.REVIEW_DRAWING,
        {
          phase: 'visual',
          ...wholeViewJudgments(
            [capture.actionResults[0].result.inspectionId],
            [{ criterionId: 'Appearance', status: 'pass', evidence: 'Matches' }]
          )
        },
        signal
      )
    ).resolves.toContain('"accepted":false')
    expect(execute).toHaveBeenCalledOnce()
  }
)

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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
    await tools.call('execute_design_batch', args, new AbortController().signal)
  )
  expect(
    compact.actionResults.map((entry: { result: unknown }) => entry.result)
  ).toEqual(values)
  const full = JSON.parse(
    await tools.call(
      'execute_design_batch',
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute
  )
  expect(
    JSON.stringify(
      tools.definitions.find((tool) => tool.name === 'execute_design_batch')
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
    await tools.call('execute_design_batch', args, new AbortController().signal)
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
      'execute_design_batch',
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
    { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
    executeBatch
  )
  const signal = new AbortController().signal
  const fact = {
    id: 'scale',
    statement: 'Use 1 cm = 1 px.',
    scope: 'Requested scale',
    sources: ['current-user-request'],
    verification: 'Explicit scale in the user request.',
    dependencies: [{ key: 'request:scale', version: '1' }]
  }
  const saved = await operations.call(
    AiDesignToolIds.RECORD_DESIGN_FACTS,
    { phase: 'facts', facts: [fact] },
    signal
  )
  for (let i = 0; i < 5; i++) {
    expect(
      await operations.call(
        AiDesignToolIds.RECORD_DESIGN_FACTS,
        { phase: 'facts' },
        signal
      )
    ).toEqual(saved)
  }
  expect(executeBatch).not.toHaveBeenCalled()
})

it('includes bound fact targets in one canonical coverage check before visual acceptance', async () => {
  let covered = false
  const stamp = { sessionId: 'binding-test', revision: 1 }
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => ({
      actionId: action.id,
      actionName: action.name,
      result:
        action.name === AiActionNames.INSPECT_DRAWING
          ? {
              available: true,
              imageScope: 'overview',
              evidence: stamp,
              image: {
                dataUrl: 'data:image/png;base64,YQ==',
                width: 1,
                height: 1
              }
            }
          : {
              current: true,
              validatedAt: { sessionId: 'validation-fixture', revision: 1 },
              coverage: { complete: covered }
            }
    }))
  }))
  const tools = createLocalOperationTools(
    [
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
    execute,
    { reviewTargetId: 'root' }
  )
  const call = (name: string, args: unknown) =>
    tools.call(name, args, new AbortController().signal).then(JSON.parse)
  await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
    phase: 'plan',
    method: 'Edit',
    references: [],
    criteria: reviewCriteria(['Axis']),
    detailRequired: false,
    facts: [
      {
        id: 'axis',
        statement: 'Retain source axis',
        scope: 'crown',
        sources: ['source'],
        verification: 'Measured source',
        dependencies: [{ key: 'source', version: '1' }]
      }
    ],
    factBindings: [
      { factId: 'axis', criterionId: 'Axis', elementIds: ['crown', 'shaft'] }
    ]
  })
  expect(execute).not.toHaveBeenCalled()
  const image = await call(AiActionNames.INSPECT_DRAWING, {
    arguments: { elementId: 'root', view: 'overview' }
  })
  const visual = {
    phase: 'visual',
    ...wholeViewJudgments(
      [image.actionResults[0].result.inspectionId],
      [
        {
          criterionId: 'Axis',
          status: 'pass',
          evidence: 'Axes match'
        }
      ]
    )
  }
  await expect(
    call(AiDesignToolIds.REVIEW_DRAWING, visual)
  ).resolves.toMatchObject({
    status: 'partial',
    accepted: false,
    evidenceValidation: { coverage: { complete: false } }
  })
  const coverageCall = execute.mock.calls.at(-1)
  if (!coverageCall) throw new Error('Missing coverage validation call')
  expect(coverageCall[0].actions[0].arguments).toMatchObject({
    scope: { requiredIds: ['root', 'crown', 'shaft'], overviewIds: ['root'] }
  })
  covered = true
  expect(await call(AiDesignToolIds.REVIEW_DRAWING, visual)).toMatchObject({
    accepted: true
  })
  expect(execute).toHaveBeenCalledTimes(5)
  expect(
    execute.mock.calls
      .flatMap(([batch]) => batch.actions)
      .filter((action) => action.arguments.scope)
  ).toHaveLength(2)
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
    { modelActions: (a) => a, resolveBatch: (v) => v, resolveTargets },
    execute
  )
  const args = { request: { targetParentId: 'parent' } }
  const call = (argumentsValue: unknown) =>
    tools.call(
      'execute_design_batch',
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

it.each(['visual', 'data', 'reference-change', 'uncovered'] as const)(
  'records primary-agent %s findings and rejects stale or incomplete evidence without nested assessment',
  async (verification) => {
    let current = true
    let completeCoverage = true
    const png = 'data:image/png;base64,YQ=='
    const tools = createLocalOperationTools(
      [
        AiActionNames.INSPECT_DRAWING,
        AiActionNames.VALIDATE_INSPECTION_EVIDENCE
      ].map((name) => ({ name, description: name, inputSchema: {} })),
      { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
      async (batch) => ({
        context: {},
        actionResults: batch.actions.map((action) => ({
          actionId: action.id,
          actionName: action.name,
          result:
            action.name === AiActionNames.INSPECT_DRAWING
              ? {
                  available: true,
                  imageScope: 'overview',
                  evidence: { sessionId: 'test', revision: 1 },
                  image: { dataUrl: png }
                }
              : {
                  current,
                  validatedAt: { sessionId: 'validation-fixture', revision: 1 },
                  coverage: { complete: completeCoverage }
                }
        }))
      }),
      {
        reviewTargetId: 'root',
        validateReferences: (indexes) =>
          indexes.map((attachmentIndex) => ({
            attachmentIndex,
            referenceId: `reference:fixture-${attachmentIndex}`,
            validation: { width: 100, height: 100 }
          }))
      }
    )
    const signal = new AbortController().signal
    const call = (name: string, args: unknown) =>
      tools.call(name, args, signal).then(JSON.parse)
    await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
      phase: 'plan',
      method: 'I am correct',
      referenceImageIndexes: [1],
      references: [],
      criteria: {
        view: {
          requirement: 'solid tower',
          description: 'correct',
          verification: verification === 'data' ? 'data' : 'visual',
          ...(verification === 'data' ? {} : { requiredUnits: [] })
        }
      },
      structureCriteria: ['view'],
      detailRequired: false
    })
    const sourceSelection = await call(
      AiDesignToolIds.SELECT_DESIGN_REFERENCES,
      {
        referenceImageIndexes: [1],
        requirementRevision: 1,
        referenceDecisions: [
          {
            referenceId: 'reference:fixture-1',
            status: 'accepted',
            reason: 'Visible target matches the requested object',
            uses: [
              {
                id: 'view',
                criterionId: 'view',
                purpose: 'visual',
                region: 'whole',
                limitations: []
              }
            ]
          }
        ]
      }
    )
    const image = await call(AiActionNames.INSPECT_DRAWING, {
      arguments: { elementId: 'root' }
    })
    const review = {
      phase: 'structure',
      ...wholeViewJudgments(
        [image.actionResults[0].result.inspectionId],
        [
          {
            criterionId: 'view',
            referenceUses: [
              sourceSelection.referenceDecisions[0].uses[0].receipt
            ],
            status: 'pass',
            evidence: 'I did it correctly'
          }
        ]
      )
    }

    expect(await call(AiDesignToolIds.REVIEW_DRAWING, review)).toMatchObject({
      structureAccepted: true
    })
    expect(
      await call(AiDesignToolIds.REVIEW_DRAWING, { ...review, phase: 'visual' })
    ).toMatchObject({ accepted: true })
    const saved = await call(AiDesignToolIds.READ_DESIGN_CHECKS, {
      view: 'details',
      includePassed: true
    })
    expect(saved.items).toContainEqual(
      expect.objectContaining({ origin: 'main-agent', status: 'pass' })
    )
    if (verification === 'reference-change') {
      await call(AiDesignToolIds.SELECT_DESIGN_REFERENCES, {
        referenceImageIndexes: [1],
        requirementRevision: 1,
        referenceDecisions: [
          {
            referenceId: 'reference:fixture-1',
            status: 'rejected',
            reason: 'Wrong subject',
            uses: []
          }
        ]
      })
      expect(
        (await call(AiDesignToolIds.READ_DESIGN_CHECKS, { view: 'details' }))
          .items
      ).toContainEqual(
        expect.objectContaining({ id: 'visual:view', status: 'stale' })
      )
    } else {
      if (verification === 'uncovered') completeCoverage = false
      else {
        current = false
        expect(
          (await call(AiDesignToolIds.READ_DESIGN_CHECKS, { view: 'details' }))
            .items
        ).toContainEqual(
          expect.objectContaining({ id: 'visual:view', status: 'stale' })
        )
      }
      expect(await call(AiDesignToolIds.REVIEW_DRAWING, review)).toMatchObject({
        accepted: false,
        status: 'partial'
      })
    }
  }
)

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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
    async () => ({ actionResults: [], context: {} })
  )
  expect(tools.definitions.map((tool) => tool.name)).not.toEqual(
    expect.arrayContaining(names)
  )
  const batch = tools.definitions.find(
    (tool) => tool.name === AiDesignToolIds.EXECUTE_DESIGN_BATCH
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
    if (!contract) throw new Error('Missing contract')
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
      { modelActions: (a) => a, resolveBatch: (v) => v },
      execute,
      { reviewTargetId: previous }
    )
    await tools.call(
      'execute_design_batch',
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
      'execute_design_batch',
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

it.each([
  {
    statuses: ['changed', 'changed'],
    status: 'complete',
    ids: ['a', 'b'],
    defer: false
  },
  {
    statuses: ['unchanged', 'unchanged'],
    status: 'no-change',
    ids: ['a', 'b'],
    defer: false
  },
  {
    statuses: ['unavailable', 'changed', 'unchanged'],
    status: 'partial',
    ids: ['missing', 'a', 'b'],
    defer: false
  },
  {
    statuses: ['changed', 'changed'],
    status: 'complete',
    ids: ['a', 'b'],
    defer: true
  }
])(
  'reviews all confirmed visibility targets without a prior composition ($status, defer=$defer)',
  async ({ statuses, status, ids, defer }) => {
    const contract = basicApiContracts.find(
      (api) => api.method === 'setElementsVisible'
    )
    if (!contract) throw new Error('Missing visibility contract')
    const execute = vi.fn(async (batch: AiActionBatch) => ({
      context: {},
      actionResults: batch.actions.map((action) => {
        const args = action.arguments as Record<string, unknown>
        let result: unknown
        if (action.name === contract.name) {
          result = {
            ...describeBasicApiResult(contract, statuses, args.elementIds),
            mutationScope: {
              complete: true,
              elementIds: status === 'no-change' ? [] : ['a', 'b'],
              removedElementIds: []
            }
          }
        } else if (action.name === AiActionNames.INSPECT_DRAWING) {
          result = {
            available: true,
            imageScope: 'overview',
            evidence: { sessionId: 'visibility', revision: 1 },
            image: {
              dataUrl: 'data:image/png;base64,YQ==',
              width: 1,
              height: 1
            }
          }
        } else if (action.name === AiActionNames.REVIEW_DESIGN) {
          result = {
            complete: true,
            findings: [],
            measuredTextIds: [],
            evidence: { sessionId: 'visibility', revision: 1 }
          }
        } else {
          const scope = args.scope as {
            requiredIds: string[]
            overviewIds: string[]
          }
          result = {
            current: true,
            validatedAt: { sessionId: 'validation-fixture', revision: 1 },
            coverage: {
              complete:
                scope?.requiredIds.every((id) =>
                  scope.overviewIds.includes(id)
                ) ?? true
            }
          }
        }
        return {
          actionId: action.id,
          actionName: action.name,
          result: result as AiJsonValue
        }
      })
    }))
    const tools = createLocalOperationTools(
      [
        contract,
        ...[
          AiActionNames.REVIEW_DESIGN,
          AiActionNames.INSPECT_DRAWING,
          AiActionNames.VALIDATE_INSPECTION_EVIDENCE
        ].map((name) => ({ name, description: name, inputSchema: {} }))
      ],
      { modelActions: (a) => a, resolveBatch: (b) => b },
      execute
    )
    const call = (name: string, args: unknown) =>
      tools.call(name, args, new AbortController().signal).then(JSON.parse)
    await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
      phase: 'plan',
      method: 'Change visibility',
      references: [],
      criteria: reviewCriteria(['Visibility']),
      detailRequired: false
    })
    const receipt = await call('execute_design_batch', {
      operations: [
        { name: contract.name, arguments: { elementIds: ids, visible: false } }
      ],
      ...(defer ? { inspection: 'defer', response: 'full' } : {})
    })
    expect(receipt.actionResults[0].result).toMatchObject({
      status,
      value: statuses,
      mutationScope: {
        complete: true,
        elementIds: status === 'no-change' ? [] : ['a', 'b'],
        removedElementIds: []
      }
    })
    expect(execute.mock.calls[0][0].actions).toHaveLength(1)
    if (status === 'no-change') {
      expect(execute).toHaveBeenCalledTimes(1)
      expect(receipt).not.toHaveProperty('measurementDeferred')
      return
    }
    let inspected = receipt
    if (defer) {
      expect(execute).toHaveBeenCalledTimes(2)
      expect(receipt.inspectionDeferred).toBe(true)
      inspected = await call(AiActionNames.INSPECT_DRAWING, {
        arguments: { elementId: 'a' }
      })
    } else {
      expect(execute).toHaveBeenCalledTimes(3)
      expect(execute.mock.calls[2][0].actions[0]).toMatchObject({
        name: AiActionNames.INSPECT_DRAWING,
        arguments: { elementId: 'a' }
      })
    }
    const firstImage = inspected.actionResults.find(
      (entry: { actionName: string }) =>
        entry.actionName === AiActionNames.INSPECT_DRAWING
    ).result.inspectionId
    const review = (inspectionIds: string[]) =>
      call(AiDesignToolIds.REVIEW_DRAWING, {
        phase: 'visual',
        ...wholeViewJudgments(inspectionIds, [
          {
            criterionId: 'Visibility',
            status: 'pass',
            evidence: 'Requested visibility checked'
          }
        ])
      })
    expect(await review([firstImage])).toMatchObject({ accepted: false })
    expect(execute.mock.calls.at(-1)?.[0].actions[0].arguments).toMatchObject({
      scope: { requiredIds: ['a', 'b'], overviewIds: ['a'] }
    })
    const second = await call(AiActionNames.INSPECT_DRAWING, {
      arguments: { elementId: 'b' }
    })
    expect(
      await review([firstImage, second.actionResults[0].result.inspectionId])
    ).toMatchObject({ accepted: true })
    await tools.validateCompletion()
    expect(execute.mock.calls.at(-1)?.[0].actions[0].arguments).toMatchObject({
      scope: { requiredIds: ['a', 'b'], overviewIds: ['a', 'b'] }
    })
    if (status !== 'partial') {
      const final = {
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
      expect(tools.settleOutcome(final)).toEqual(final)
    }
  }
)

it('retrieves exact admitted category schemas through bounded read-only discovery', async () => {
  const execute = vi.fn(async () => ({ actionResults: [], context: {} }))
  const admitted = basicApiContracts.filter((api) => api.owner === 'fill')
  const tools = createLocalOperationTools(
    admitted,
    { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
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
  for (const api of exact.apis) expect(api.inputSchema).toBeDefined()
  for (const api of expanded.apis) expect(api.inputSchema).toBeDefined()
  const compact = await call({ category: 'fill' })
  expect(compact.apis.map((api: { name: string }) => api.name)).toEqual(
    expanded.apis.map((api: { name: string }) => api.name)
  )
  for (const api of compact.apis) expect(api.inputSchema).toBeUndefined()
  expect(await call({ category: 'fill', includeSchemas: false })).toEqual(
    compact
  )
  for (const args of [
    { includeSchemas: true },
    { names: [], includeSchemas: true },
    { category: 'fill', includeSchemas: 'true' },
    { category: 'fill', query: 'fill', includeSchemas: true },
    { category: 'unavailable', includeSchemas: true }
  ])
    await expect(call(args)).rejects.toThrow()
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
      name: AiDesignToolIds.EXECUTE_DESIGN_BATCH,
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
    AiDesignToolIds.EXECUTE_DESIGN_BATCH,
    'prepare_new_capability',
    'unregistered'
  ])
  expect(result.apis).toEqual([
    expect.objectContaining({
      ...action,
      execution: {
        kind: 'batch-action',
        tool: AiDesignToolIds.EXECUTE_DESIGN_BATCH
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
  for (const [batch] of execute.mock.calls)
    expect(batch.actions[0]).toMatchObject({
      name: action.name,
      arguments: values
    })
  const repeated = await read({ names: [action.name] })
  expect(repeated.apis[0].definition.state).toBe('included')
  expect(repeated.tools[0].definition.state).toBe('included')
  expect(repeated.apis[0].definition.refresh.arguments.names).toEqual([
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
    { modelActions: (a) => a, resolveBatch: (b) => b },
    execute
  )
  const read = (args: unknown) =>
    tools
      .call('describe_design_apis', args, new AbortController().signal)
      .then(JSON.parse)
  const usage = (await read({ names: [action.name], view: 'usage' })).apis[0]
  expect(usage.description).toBe(action.description)
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
  expect(JSON.stringify(usage).length).toBeLessThan(
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
  ])
    await expect(read(query)).rejects.toThrow()
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
    { modelActions: (a) => a, resolveBatch: (b) => b },
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
      { modelActions: (a) => a, resolveBatch: (b) => b },
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

it('executes the advertised Code Mode recipe for image, multi-image and text-only results without leaking image bytes', async () => {
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
    // Actual native Code Mode adapter shape, independently verified by live probe.
    const result = content
      .map((item) => (item.type === 'inputText' ? item.text : item.imageUrl))
      .join('\n')
    const text = vi.fn()
    const image = vi.fn()
    runInNewContext(localToolResultExample, { result, text, image })
    expect(text).toHaveBeenCalledOnce()
    expect(JSON.stringify(text.mock.calls)).not.toContain('base64')
    expect(image).toHaveBeenCalledTimes(count)
    for (const call of image.mock.calls) expect(call).toEqual([png])
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
      'execute_design_batch',
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
    { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
    execute
  )
  await expect(
    tools.call(
      'execute_design_batch',
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
      { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
      execute
    )
    await expect(
      tools.call(
        'execute_design_batch',
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute
  )
  const result = JSON.parse(
    await tools.call(
      'execute_design_batch',
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
    filter: { name: { prefix: 'roof-' } },
    expectedCount: ids.length
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
    if (failure === 'cancelled') controller.abort()
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute
  )
  await expect(
    tools.call(
      'execute_design_batch',
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
  ).rejects.toThrow()
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
    { modelActions: (a) => a, resolveBatch: (b) => b },
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
    names: [action.name],
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

it('advertises distinct evidence responsibilities and rejects facts sent to drawing review', async () => {
  const tools = createLocalOperationTools(
    [AiActionNames.INSPECT_DRAWING].map((name) => ({
      name,
      description: name,
      inputSchema: {}
    })),
    { modelActions: (a) => a, resolveBatch: (b) => b },
    vi.fn()
  )
  const definitions = new Map(
    tools.definitions.map((tool) => [tool.name, tool])
  )
  for (const name of [
    'define_design_criteria',
    'record_design_facts',
    'record_design_calculations',
    'select_design_references',
    'review_drawing'
  ]) {
    expect(definitions.has(name)).toBe(true)
  }
  expect(definitions.has('record_design_review')).toBe(false)
  await expect(
    tools.call(
      'review_drawing',
      { phase: 'facts', facts: [] },
      new AbortController().signal
    )
  ).rejects.toThrow()
  const criteria = { ...reviewPlanExample }
  const { phase: _phase, ...input } = criteria
  const result = JSON.parse(
    await tools.call(
      'define_design_criteria',
      input,
      new AbortController().signal
    )
  )
  expect(result.recorded).toBe(true)
})

it('returns a reference-selection receipt without retransmitting retained source facts', async () => {
  const execute = vi.fn()
  const tools = createLocalOperationTools(
    [
      {
        name: AiActionNames.INSPECT_DRAWING,
        description: 'Inspect',
        inputSchema: {}
      }
    ],
    { modelActions: (a) => a, resolveBatch: (b) => b },
    execute
  )
  const call = async (name: string, args: unknown) =>
    JSON.parse(await tools.call(name, args, new AbortController().signal))
  await expect(
    call(AiDesignToolIds.SELECT_DESIGN_REFERENCES, {
      referenceImageIndexes: [0]
    })
  ).rejects.toThrow('criteria')
  await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, reviewPlanExample)
  const fact = {
    id: 'height',
    statement: 'Verified height',
    scope: 'Building height',
    sources: ['reference:survey'],
    verification: 'Read source dimensions',
    dependencies: [{ key: 'reference:survey', version: '1' }]
  }
  const facts = await call(AiDesignToolIds.RECORD_DESIGN_FACTS, {
    facts: [fact]
  })
  const calculations = await call(AiDesignToolIds.RECORD_DESIGN_CALCULATIONS, {
    calculations: [
      {
        id: 'scaled-height',
        value: 80,
        unit: 'px',
        sourceFactIds: ['height'],
        verification: 'Apply the documented scale'
      }
    ]
  })
  expect(calculations).toMatchObject({
    diagnosticOnly: true,
    calculations: [{ id: 'scaled-height', value: 80, status: 'valid' }]
  })
  const selected = await call(AiDesignToolIds.SELECT_DESIGN_REFERENCES, {
    referenceImageIndexes: [0]
  })
  expect(selected).toMatchObject({
    referenceImageIndexes: [0],
    changed: true,
    review: {
      accepted: false,
      requiresFreshReview: true,
      next: { tool: AiDesignToolIds.SELECT_DESIGN_REFERENCES }
    }
  })
  expect(selected).not.toHaveProperty('facts')
  expect(selected).not.toHaveProperty('factBindings')
  expect(selected).not.toHaveProperty('phase')
  expect(
    await call(AiDesignToolIds.SELECT_DESIGN_REFERENCES, {
      referenceImageIndexes: [0]
    })
  ).toMatchObject({ changed: false })
  await expect(
    call(AiDesignToolIds.SELECT_DESIGN_REFERENCES, {
      referenceImageIndexes: [0, 0]
    })
  ).rejects.toThrow()
  await expect(
    call(AiDesignToolIds.RECORD_DESIGN_FACTS, { referenceImageIndexes: [1] })
  ).rejects.toThrow()
  expect(await call(AiDesignToolIds.RECORD_DESIGN_FACTS, {})).toEqual(facts)
  await call(AiDesignToolIds.RECORD_DESIGN_FACTS, {
    dependencyChanges: [
      {
        key: 'reference:survey',
        version: '2',
        reason: 'source_changed',
        evidence: 'New survey'
      }
    ]
  })
  expect(
    await call(AiDesignToolIds.SELECT_DESIGN_REFERENCES, {
      referenceImageIndexes: [1]
    })
  ).toMatchObject({
    review: {
      next: {
        tool: AiDesignToolIds.RECORD_DESIGN_FACTS,
        invalidatedFactIds: ['height']
      }
    }
  })
  expect(execute).not.toHaveBeenCalled()
})

describe('capture-to-review handoff', () => {
  const setup = async (requiredUnits: string[] = []) => {
    const unavailable = new Set<string>()
    const state = { current: true }
    const execute = vi.fn(async (batch: AiActionBatch) => ({
      context: {},
      actionResults: batch.actions.map((action) => {
        const base = { actionId: action.id, actionName: action.name }
        if (action.name !== AiActionNames.INSPECT_DRAWING)
          return {
            ...base,
            result: {
              current: state.current,
              validatedAt: { sessionId: 'validation-fixture', revision: 1 },
              coverage: { complete: true }
            }
          }
        if (unavailable.has(String(action.arguments.elementId)))
          return {
            ...base,
            result: {
              available: false,
              message:
                'Native detail exceeds 1024 pixels; choose a smaller target-local region.'
            }
          }
        return {
          ...base,
          result: {
            available: true,
            imageScope: action.arguments.region
              ? 'region'
              : (action.arguments.view ?? 'overview'),
            evidence: { sessionId: 'live', revision: 1 },
            image: { dataUrl: 'data:image/png;base64,AA==' }
          }
        }
      })
    }))
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
    const call = (name: string, args: unknown) =>
      tools.call(name, args, signal).then(JSON.parse)
    await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
      phase: 'plan',
      method: 'Compare the drawing',
      references: [],
      criteria: {
        ...(requiredUnits.length ? reviewCriteria(['whole']) : {}),
        view: { ...reviewCriteria(['view']).view, requiredUnits }
      },
      detailRequired: true
    })
    const review = {
      phase: 'visual',
      checks: [
        {
          criterionId: 'view',
          status: 'pass',
          evidence: 'Compare all requested parts'
        }
      ]
    }
    const targets = [
      { elementId: 'drawing', checks: [{ criterionId: 'view' }] },
      {
        elementId: 'window',
        checks: [{ criterionId: 'view' }],
        region: { x: 0, y: 0, width: 100, height: 100 }
      }
    ]
    return {
      tools,
      call,
      execute,
      unavailable,
      state,
      review,
      targets
    }
  }

  it('projects saved representative meaning without mistaking it for visual approval', async () => {
    const f = await setup()
    await f.call(
      AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
      recordedAcceptance.input
    )
    const capture = await f.call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: 'visual',
      final: false,
      inspections: [
        {
          elementId: 'drawing',
          checks: [{ criterionId: 'material', unitId: 'representative' }]
        }
      ]
    })
    expect(capture.acceptanceContext).toEqual({
      method: recordedAcceptance.input.method,
      requirementRevision:
        capture.next.arguments.checks[0].binding.requirementRevision,
      checks: [
        {
          criterionId: 'material',
          unitId: 'representative',
          requirement: recordedAcceptance.input.criteria.material.requirement,
          description: recordedAcceptance.input.criteria.material.description
        }
      ]
    })
    expect(capture.recordedChecks).toEqual([])
    expect(capture.accepted).toBe(false)
  })

  it('delivers exact current acceptance meaning beside executable bound judgments', async () => {
    const f = await setup(['tiers', 'base'])
    const capture = await f.call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: 'visual',
      final: false,
      inspections: ['tiers', 'base'].map((unitId, index) => ({
        elementId: 'drawing',
        region: { x: index * 20, y: 0, width: 10, height: 10 },
        checks: [{ criterionId: 'view', unitId }]
      }))
    })
    expect(capture.acceptanceContext).toEqual({
      method: 'Compare the drawing',
      requirementRevision:
        capture.next.arguments.checks[0].binding.requirementRevision,
      checks: ['tiers', 'base'].map((unitId) => ({
        criterionId: 'view',
        unitId,
        requirement: 'view',
        description: 'view'
      }))
    })
    expect(capture.next.arguments).not.toHaveProperty('acceptanceContext')
    const rebound = await f.call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: 'visual',
      final: false,
      bindChecks: capture.next.arguments.checks.map(
        ({ binding: _binding, ...check }: Record<string, unknown>) => check
      )
    })
    expect(rebound.acceptanceContext).toEqual(capture.acceptanceContext)
    const recorded = await f.call(AiDesignToolIds.REVIEW_DRAWING, {
      ...rebound.next.arguments,
      checks: rebound.next.arguments.checks.map((check: object) => ({
        ...check,
        status: 'pass',
        evidence: 'Observed the requested local appearance.'
      }))
    })
    expect(recorded.recordedChecks).toHaveLength(2)
    expect(recorded.accepted).toBe(false)
    expect(recorded.coverage.passed).toBe(2)
  })

  it('retains successful captures after recorded stale supersession and rebinds without recapture', async () => {
    const f = await setup(['tiers', 'base'])
    const targets = ['tiers', 'base'].map((unitId, i) => ({
      elementId: 'drawing',
      region: { x: i * 20, y: 0, width: 10, height: 10 },
      checks: [{ criterionId: 'view', unitId }]
    }))
    const initial = await f.call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: 'visual',
      final: false,
      inspections: targets
    })
    await f.call(AiDesignToolIds.REVIEW_DRAWING, {
      ...initial.next.arguments,
      checks: initial.next.arguments.checks.map((check: object) => ({
        ...check,
        status: 'pass',
        evidence: 'Observed current local surface'
      }))
    })
    const ids = ['tiers', 'base'].map(
      (unitId) => 'visual-unit:' + JSON.stringify(['view', unitId])
    )
    const before = await f.call(AiDesignToolIds.READ_DESIGN_CHECKS, {
      view: 'details',
      ids,
      includePassed: true
    })
    const saved = recordedAcquisition.calls.find((call) => call.index === 37)
    const savedInput = saved?.input as {
      inspections: {
        checks: {
          unitId: string
          supersedes?: { revision: number; reason: string }
        }[]
      }[]
    }
    const stale = savedInput.inspections
      .flatMap((item) => item.checks)
      .find((check) => check.unitId === 'tiers')?.supersedes
    expect(stale?.revision).toBeLessThan(before.items[0].revision)
    const result = await f.call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: 'visual',
      final: false,
      inspections: [
        {
          ...targets[0],
          region: { x: 1, y: 0, width: 10, height: 10 },
          checks: [{ criterionId: 'view', unitId: 'tiers', supersedes: stale }]
        }
      ]
    })
    expect(result).toMatchObject({
      status: 'partial',
      accepted: false,
      next: { requiredInputs: ['bindChecks'] }
    })
    expect(result.message).toContain('supersession revision')
    expect(result.inspectionIds).toHaveLength(1)
    expect(result.actionResults[0].result.inspectionId).toBe(
      result.inspectionIds[0]
    )
    expect(
      await f.call(AiDesignToolIds.READ_DESIGN_CHECKS, {
        view: 'details',
        ids,
        includePassed: true
      })
    ).toEqual(before)
    const captureCount = () =>
      f.execute.mock.calls
        .flatMap(([batch]) => batch.actions)
        .filter((action) => action.name === AiActionNames.INSPECT_DRAWING)
        .length
    const count = captureCount()
    const rebound = await f.call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: 'visual',
      final: false,
      bindChecks: [
        {
          criterionId: 'view',
          unitId: 'tiers',
          inspectionIds: result.inspectionIds,
          supersedes: {
            revision: before.items[0].revision,
            reason: 'Use the current requested crop'
          }
        }
      ]
    })
    expect(captureCount()).toBe(count)
    await f.call(AiDesignToolIds.REVIEW_DRAWING, {
      ...rebound.next.arguments,
      checks: rebound.next.arguments.checks.map((check: object) => ({
        ...check,
        status: 'pass',
        evidence: 'Observed corrected crop'
      }))
    })
    const after = await f.call(AiDesignToolIds.READ_DESIGN_CHECKS, {
      view: 'details',
      ids,
      includePassed: true
    })
    expect(
      after.items.find((item: { unitId: string }) => item.unitId === 'base')
    ).toEqual(
      before.items.find((item: { unitId: string }) => item.unitId === 'base')
    )
    expect(
      after.items.find((item: { unitId: string }) => item.unitId === 'tiers')
        .scope
    ).toEqual(result.inspectionIds)
  })

  it('captures requested targets once and passes only admitted images to review', async () => {
    const f = await setup()
    const result = await f.call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: f.review.phase,
      inspections: f.targets
    })
    expect(result.accepted).toBe(false)
    const { designEvidenceDefinitions } = await import('../local-design-review')
    const { operationInputIssue } = await import('../operation-input-schema')
    const declaration = designEvidenceDefinitions.find(
      (tool) => tool.name === AiDesignToolIds.REVIEW_DRAWING
    )
    if (!declaration) throw new Error('Missing review contract')
    expect(
      operationInputIssue(result, declaration.outputSchema)
    ).toBeUndefined()
    const incomplete = structuredClone(result)
    delete incomplete.next.arguments.checks[0].binding.dependencies
    expect(
      operationInputIssue(incomplete, declaration.outputSchema)
    ).toBeDefined()
    expect(result.actionResults).toHaveLength(2)
    expect(result.next.arguments.checks).toMatchObject([
      {
        criterionId: 'view',
        inspectionIds: result.inspectionIds,
        binding: {
          requirementRevision: 1,
          checkRevision: 1,
          dependencies: [
            {
              inspectionId: result.inspectionIds[0],
              elementId: 'drawing',
              scope: 'overview:whole'
            },
            {
              inspectionId: result.inspectionIds[1],
              elementId: 'window',
              scope: 'detail:[0,0,100,100]'
            }
          ]
        }
      }
    ])
    expect(
      await f.call(AiDesignToolIds.REVIEW_DRAWING, {
        ...result.next.arguments,
        final: true,
        checks: result.next.arguments.checks.map(
          (check: Record<string, unknown>) => ({
            ...check,
            status: 'pass',
            evidence: 'Compare all requested parts'
          })
        )
      })
    ).toMatchObject({ accepted: true })
    expect(
      f.execute.mock.calls
        .flatMap(([batch]) => batch.actions)
        .filter((action) => action.name === AiActionNames.INSPECT_DRAWING)
        .map((action) => action.arguments)
    ).toEqual([
      { elementId: 'drawing', view: 'overview' },
      { elementId: 'window', region: f.targets[1].region, view: 'detail' }
    ])
  })

  it('rejects an older verdict after a concurrent bound verdict commits during evidence validation', async () => {
    const f = await setup()
    const capture = await f.call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: 'visual',
      inspections: f.targets
    })
    const draft = capture.next.arguments
    const execution = f.execute.getMockImplementation()
    if (!execution) throw new Error('Missing execution fixture')
    let release: () => void = () => {
      throw new Error('Validation has not started')
    }
    let entered: () => void = () => {
      throw new Error('Validation gate unavailable')
    }
    const started = new Promise<void>((resolve) => {
      entered = resolve
    })
    const blocked = new Promise<void>((resolve) => {
      release = resolve
    })
    let hold = true
    f.execute.mockImplementation(async (batch) => {
      const receipt = await execution(batch)
      if (
        hold &&
        batch.actions.some(
          (action) => action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE
        )
      ) {
        hold = false
        entered()
        await blocked
      }
      return receipt
    })
    const verdict = (status: string) => ({
      ...draft,
      checks: draft.checks.map((check: Record<string, unknown>) => ({
        ...check,
        status,
        evidence: `Observed ${status}`
      }))
    })
    const older = f.call(AiDesignToolIds.REVIEW_DRAWING, verdict('pass')).then(
      () => 'accepted',
      (error: Error) => error.message
    )
    await started
    try {
      await f.call(AiDesignToolIds.REVIEW_DRAWING, verdict('fail'))
    } finally {
      release()
    }
    expect(await older).toContain('stale')
    const stored = await f.call(AiDesignToolIds.READ_DESIGN_CHECKS, {
      view: 'details',
      includePassed: true
    })
    expect(
      stored.items.find(
        (item: { criterionId?: string }) => item.criterionId === 'view'
      )
    ).toMatchObject({ status: 'fail', evidence: 'Observed fail' })
  })

  it('returns missing captures without assessment and reuses successful IDs on corrected retry', async () => {
    const f = await setup()
    f.unavailable.add('window')
    const failed = await f.call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: f.review.phase,
      inspections: f.targets
    })
    expect(failed).toMatchObject({
      available: false,
      accepted: false,
      inspectionIds: [expect.any(String)],
      failedInspections: [
        { inspection: f.targets[1], message: expect.stringContaining('1024') }
      ]
    })
    expect(failed.actionResults).toHaveLength(2)
    expect(failed.actionResults[0].result.image.dataUrl).toContain(
      'data:image/png'
    )
    expect(failed.actionResults[1].result.available).toBe(false)
    f.unavailable.clear()
    const result = await f.call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: f.review.phase,
      inspectionIds: failed.inspectionIds,
      inspections: [f.targets[1]]
    })
    expect(result.accepted).toBe(false)
    expect(
      await f.call(AiDesignToolIds.REVIEW_DRAWING, {
        ...f.review,
        ...wholeViewJudgments(result.inspectionIds, f.review.checks)
      })
    ).toMatchObject({ accepted: true })
    const captures = f.execute.mock.calls
      .flatMap(([batch]) => batch.actions)
      .filter((action) => action.name === AiActionNames.INSPECT_DRAWING)
    expect(
      captures.filter((action) => action.arguments.elementId === 'drawing')
    ).toHaveLength(1)
    expect(
      captures.filter((action) => action.arguments.elementId === 'window')
    ).toHaveLength(2)
  })

  it('returns every unavailable target without manufacturing evidence or mutating input', async () => {
    const f = await setup()
    for (const target of f.targets) f.unavailable.add(target.elementId)
    const input = { phase: f.review.phase, inspections: f.targets }
    const original = structuredClone(input)
    const result = await f.call(AiDesignToolIds.REVIEW_DRAWING, input)
    expect(result).toMatchObject({
      available: false,
      accepted: false,
      inspectionIds: [],
      failedInspections: f.targets.map((inspection) => ({
        inspection,
        message: expect.any(String)
      }))
    })
    expect(input).toEqual(original)
  })

  it('retains successful captures when a later capture throws', async () => {
    const f = await setup()
    const execute = f.execute.getMockImplementation()
    if (!execute) throw new Error('Missing capture fixture')
    f.execute.mockImplementation(async (batch) => {
      if (
        batch.actions.some((action) => action.arguments.elementId === 'window')
      )
        throw new Error('Capture transport failed')
      return execute(batch)
    })
    const result = await f.call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: f.review.phase,
      inspections: f.targets
    })
    expect(result).toMatchObject({
      accepted: false,
      inspectionIds: [expect.any(String)],
      failedInspections: [
        { inspection: f.targets[1], message: 'Capture transport failed' }
      ]
    })
  })

  it('stops the handoff on cancellation during capture', async () => {
    const f = await setup()
    const controller = new AbortController()
    const execute = f.execute.getMockImplementation()
    if (!execute) throw new Error('Missing capture fixture')
    let cancelledReceipt: Awaited<ReturnType<typeof execute>> | undefined
    f.execute.mockImplementation(async (batch) => {
      const result = await execute(batch)
      cancelledReceipt = result
      controller.abort()
      return result
    })
    await expect(
      f.tools.call(
        AiDesignToolIds.REVIEW_DRAWING,
        { phase: f.review.phase, inspections: f.targets },
        controller.signal
      )
    ).rejects.toThrow()
    expect(f.execute).toHaveBeenCalledTimes(1)
    for (const entry of cancelledReceipt?.actionResults ?? [])
      expect(entry.result).not.toHaveProperty('inspectionId')
  })

  it('keeps stale evidence rejection after composed captures', async () => {
    const f = await setup()
    f.state.current = false
    const result = await f.call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: f.review.phase,
      inspections: f.targets
    })
    expect(result.accepted).toBe(false)
  })

  it('validates capture targets and reusable IDs before any capture', async () => {
    const f = await setup()
    for (const input of [
      {
        inspections: [
          {
            elementId: 'drawing',
            region: { x: 0, y: 0, width: 2048, height: 100 }
          }
        ]
      },
      { inspectionIds: [undefined], inspections: f.targets },
      { inspectionIds: [''], inspections: f.targets },
      { inspectionIds: ['same', 'same'], inspections: f.targets },
      { inspections: [] },
      {
        inspections: Array.from({ length: 24 }, () => f.targets[0]),
        inspectionIds: ['unknown']
      }
    ])
      await expect(
        f.call(AiDesignToolIds.REVIEW_DRAWING, { ...f.review, ...input })
      ).rejects.toThrow()
    expect(
      await f.call(AiDesignToolIds.REVIEW_DRAWING, {
        phase: f.review.phase,
        inspections: f.targets,
        inspectionIds: ['unknown']
      })
    ).toMatchObject({ accepted: false, status: 'partial' })
    expect(f.execute).not.toHaveBeenCalled()
  })

  it('does not start captures when the request is cancelled', async () => {
    const f = await setup()
    const controller = new AbortController()
    controller.abort()
    await expect(
      f.tools.call(
        AiDesignToolIds.REVIEW_DRAWING,
        { phase: f.review.phase, inspections: f.targets },
        controller.signal
      )
    ).rejects.toThrow()
    expect(f.execute).not.toHaveBeenCalled()
  })
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
    { modelActions: (a) => a, resolveBatch: (b) => b },
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
    { modelActions: (a) => a, resolveBatch: (b) => b },
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
    if (page.complete) break
    expect(page.next.arguments.offset).toBe(names.length)
    page = await read(page.next.arguments)
  }
  expect(new Set(names).size).toBe(category.count)
  const missing = await read({ operation: 'fill.updateUnknownField' })
  expect(missing.apis).toEqual([])
  expect(missing.missingOperations).toEqual(['fill.updateUnknownField'])
  expect(missing.candidates.length).toBeGreaterThan(0)
  expect(missing.candidates.length).toBeLessThanOrEqual(6)
  for (const candidate of missing.candidates)
    expect(
      basicApiContracts.some((api) => api.operation === candidate.operation)
    ).toBe(true)
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
    AiDesignToolIds.DEFINE_DESIGN_CRITERIA,
    {
      phase: 'plan',
      method: 'Attach one local rectangle',
      references: [],
      criteria: reviewCriteria(['shape']),
      detailRequired: false
    },
    signal
  )
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
      'execute_design_batch',
      { operations: [operation], inspection: 'defer' },
      new AbortController().signal
    )
    .then(
      () => {
        throw new Error('Expected target admission rejection')
      },
      (failure: Error) => failure
    )
  expect(error).toBeInstanceOf(LocalOperationPreparationError)
  expect(error.message).toContain('operations[0].target[0]')
  expect(error.message).toContain('arguments ["request","elementIds"]')
  expect(error.message).toMatch(/omit.*empty/i)
  expect(error.message).toContain('operations[0].target[1]')
  expect(error.message).toContain('registered supplied argument slot')
  expect(resolveTargets).not.toHaveBeenCalled()
  expect(execute).not.toHaveBeenCalled()
  expect(operation).toEqual(before)

  await tools.call(
    'execute_design_batch',
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

it('reuses independent measurement receipts and rechecks only an affected final target', async () => {
  const versions: Record<string, number> = { a: 1, b: 1 }
  let changeDuringMeasurement = false
  const measured: string[] = []
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => {
      const target = String(action.arguments.elementId)
      let result: Record<string, unknown>
      if (action.name === AiActionNames.VALIDATE_INSPECTION_EVIDENCE) {
        const stamp = action.arguments.evidence as {
          receiptId: string
          revision: number
        }
        const owner = stamp.receiptId.split(':')[1]
        result = {
          current: stamp.revision === versions[owner],
          validatedAt: { sessionId: 'validation-fixture', revision: 1 },
          coverage: { complete: true }
        }
      } else if (action.name === AiActionNames.REVIEW_DESIGN) {
        measured.push(target)
        if (changeDuringMeasurement) versions[target]++
        result = {
          complete: true,
          findings: [],
          measuredTextIds: [],
          evidence: {
            sessionId: 'document',
            revision: versions[target],
            receiptId: `measurement:${target}`
          }
        }
      } else if (action.name === AiActionNames.UPDATE_DESIGN_ELEMENT) {
        versions[target]++
        result = { compositionId: target }
      } else {
        result = {
          available: true,
          imageScope: 'overview',
          image: { dataUrl: png },
          evidence: {
            sessionId: 'document',
            revision: versions[target],
            receiptId: `image:${target}`
          }
        }
      }
      return { actionId: action.id, actionName: action.name, result }
    })
  }))
  const names = [
    AiActionNames.INSPECT_DRAWING,
    AiActionNames.REVIEW_DESIGN,
    AiActionNames.VALIDATE_INSPECTION_EVIDENCE,
    AiActionNames.UPDATE_DESIGN_ELEMENT
  ]
  const owner = createLocalOperationTools(
    names.map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (actions) => actions, resolveBatch: (batch) => batch },
    execute,
    { reviewTargetId: 'a' }
  )
  const call = async (name: string, input: unknown) =>
    JSON.parse(await owner.call(name, input, new AbortController().signal))
  await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
    phase: 'plan',
    method: 'Check independent targets',
    references: [],
    criteria: reviewCriteria(['Appearance']),
    detailRequired: false
  })
  for (const target of ['a', 'b'])
    await call(AiActionNames.REVIEW_DESIGN, {
      arguments: { elementId: target }
    })
  await call(AiActionNames.UPDATE_DESIGN_ELEMENT, {
    arguments: { elementId: 'a' },
    inspection: 'defer'
  })
  const capture = async () => {
    const ids: string[] = []
    for (const target of ['a', 'b']) {
      const result = await call(AiActionNames.INSPECT_DRAWING, {
        arguments: { elementId: target }
      })
      ids.push(result.actionResults[0].result.inspectionId)
    }
    return ids
  }
  const assess = (inspectionIds: string[], final = true) =>
    call(AiDesignToolIds.REVIEW_DRAWING, {
      phase: 'visual',
      final,
      ...wholeViewJudgments(inspectionIds, [
        {
          criterionId: 'Appearance',
          status: 'pass',
          evidence: 'Both targets inspected'
        }
      ])
    })
  let ids = await capture()
  expect(measured).toEqual(['a', 'b', 'a'])
  await assess(ids, false)
  expect(measured).toEqual(['a', 'b', 'a'])
  expect(await assess(ids)).toMatchObject({ accepted: true })
  expect(measured).toEqual(['a', 'b', 'a'])
  ids = await capture()
  expect(await assess(ids)).toMatchObject({ accepted: true })
  expect(measured).toEqual(['a', 'b', 'a'])
  await call(AiActionNames.UPDATE_DESIGN_ELEMENT, {
    arguments: { elementId: 'a' },
    inspection: 'defer'
  })
  versions.a++
  ids = await capture()
  changeDuringMeasurement = true
  expect(await assess(ids)).toMatchObject({
    accepted: false,
    status: 'partial',
    evidenceValidation: { current: false }
  })
  expect(measured).toEqual(['a', 'b', 'a', 'a', 'a'])
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
            { modelActions: (a) => a, resolveBatch: (v) => v },
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
          revision: select.revision,
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
            revision: select.revision,
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
      if (!unresolved)
        expect(result.storage).toMatchObject({ status: 'unsaved' })
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
  for (const target of revisions.keys()) await review(target)
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
    'unsupported'
  )
  incomplete = true
  findings.delete('section-5')
  await review('section-5')
  expect((await read()).items[0].status).not.toBe('pass')
  expect(owner.settleOutcome(outcome).actions[0].arguments.outcome).toBe(
    'unsupported'
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

it.each([AiActionNames.REVIEW_DESIGN, AiActionNames.UPDATE_DESIGN_ELEMENT])(
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
      { modelActions: (a) => a, resolveBatch: (v) => v },
      async (batch) => ({
        context: {},
        actionResults: batch.actions.map((action) => {
          if (action.name === AiActionNames.REVIEW_DESIGN) controller.abort()
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
    { modelActions: (a) => a, resolveBatch: (v) => v, checkResults: checks },
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
    origin: 'main-agent',
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

it('checks only surviving targets after creation and deletion in the same batch', async () => {
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
    async (batch) => ({
      context: {},
      actionResults: batch.actions.map((action) => {
        let result: AiJsonValue
        if (action.name === basicActionName('createElements'))
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
        else if (action.name === basicActionName('deleteElements'))
          result = {
            status: 'complete',
            value: { removed: [{ elementId: 'temporary' }] },
            mutationScope: {
              complete: true,
              elementIds: [],
              removedElementIds: ['temporary']
            }
          }
        else {
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
    'execute_design_batch',
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
  expect(checked).toEqual(['keep'])
})

it.each([false, true])(
  'retires the removed group from pending checks with ordered=%s',
  async (ordered) => {
    const checked: string[] = []
    const pending = ordered ? new Set<string>(['temporary']) : undefined
    const operations = createOwner(
      [
        ...basicApiContracts,
        {
          name: AiActionNames.REVIEW_DESIGN,
          description: 'Check',
          inputSchema: {}
        }
      ],
      { modelActions: (a) => a, resolveBatch: (v) => v },
      async (batch) => ({
        context: {},
        actionResults: batch.actions.map((action) => {
          let result: AiJsonValue
          if (action.name === basicActionName('createElements'))
            result = {
              status: 'complete',
              value: ['temporary'],
              appliedElementIds: ['temporary'],
              mutationScope: {
                complete: true,
                elementIds: ['temporary'],
                removedElementIds: []
              }
            }
          else if (action.name === basicActionName('ungroupElement')) {
            const contract = basicApiContracts.find(
              (entry) => entry.name === action.name
            )
            if (!contract) throw new Error('Missing ungroup contract')
            result = {
              ...describeBasicApiResult(contract, {
                groupId: 'temporary',
                elementIds: ['child'],
                removed: true
              }),
              mutationScope: {
                complete: true,
                elementIds: ['child'],
                removedElementIds: ['temporary']
              }
            }
          } else {
            checked.push(String(action.arguments.elementId))
            result = {
              complete: true,
              findings: [],
              evidence: { sessionId: 'ungroup-target', revision: 1 }
            }
          }
          return { actionId: action.id, actionName: action.name, result }
        })
      })
    )
    const signal = new AbortController().signal
    await operations.call(
      'execute_design_batch',
      {
        inspection: 'defer',
        operations: [
          {
            name: basicActionName('createElements'),
            arguments: { createOptions: [{ type: 'group' }] }
          },
          {
            name: basicActionName('ungroupElement'),
            arguments: { groupId: 'temporary' }
          }
        ]
      },
      signal,
      pending
    )
    if (pending)
      await operations.finishInspection(pending, undefined, true, signal)
    expect(checked).toEqual(['child'])
  }
)

it.each(['complete', 'partial'])(
  'retires a replaced composition only on confirmed completion: %s',
  async (status) => {
    const checked: string[] = []
    const pending = new Set<string>()
    const operations = createOwner(
      [
        AiActionNames.APPLY_PREPARED_DESIGN,
        AiActionNames.REPLACE_VECTOR_COMPOSITION,
        AiActionNames.REVIEW_DESIGN
      ].map((name) => ({ name, description: name, inputSchema: {} })),
      { modelActions: (a) => a, resolveBatch: (v) => v },
      async (batch) => ({
        context: {},
        actionResults: batch.actions.map((action) => {
          if (action.name === AiActionNames.REVIEW_DESIGN) {
            checked.push(String(action.arguments.elementId))
            return {
              actionId: action.id,
              actionName: action.name,
              result: {
                complete: true,
                findings: [],
                evidence: { sessionId: 'replacement', revision: 1 }
              }
            }
          }
          return {
            actionId: action.id,
            actionName: action.name,
            result: {
              status,
              compositionId:
                action.name === AiActionNames.APPLY_PREPARED_DESIGN
                  ? 'old'
                  : 'new'
            }
          }
        })
      })
    )
    const signal = new AbortController().signal
    await operations.call(
      AiActionNames.APPLY_PREPARED_DESIGN,
      { arguments: {} },
      signal,
      pending
    )
    await operations.call(
      AiActionNames.REPLACE_VECTOR_COMPOSITION,
      { arguments: { compositionId: 'old' } },
      signal,
      pending
    )
    await operations.finishInspection(pending, undefined, true, signal)
    expect(checked).toEqual(status === 'complete' ? ['new'] : ['old', 'new'])
  }
)

it.each([AiActionNames.ARRANGE_DESIGN, AiActionNames.MAP_RETAINED_FILLS])(
  'checks the native applied identities from %s without a previous drawing',
  async (name) => {
    const checked: string[] = []
    const tools = createLocalOperationTools(
      [name, AiActionNames.REVIEW_DESIGN].map((name) => ({
        name,
        description: name,
        inputSchema: {}
      })),
      { modelActions: (value) => value, resolveBatch: (value) => value },
      async (batch) => ({
        context: {},
        actionResults: batch.actions.map((action) => {
          if (action.name === name)
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
      'execute_design_batch',
      { inspection: 'defer', operations: [{ name, arguments: {} }] },
      new AbortController().signal
    )
    expect(checked).toEqual(['a', 'b'])
  }
)

it('keeps review replies and final settlement blocked by tool findings without repeating visual judgments', async () => {
  const checkResults = createDesignCheckResults()
  const tools = createLocalOperationTools(
    [
      AiActionNames.INSPECT_DRAWING,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (a) => a, resolveBatch: (b) => b, checkResults },
    async (batch) => ({
      context: {},
      actionResults: batch.actions.map((action) => ({
        actionId: action.id,
        actionName: action.name,
        result:
          action.name === AiActionNames.INSPECT_DRAWING
            ? {
                available: true,
                imageScope: 'overview',
                evidence: {
                  sessionId: 'mechanical',
                  revision: 1,
                  receiptId: 'root'
                },
                image: { dataUrl: png }
              }
            : {
                current: true,
                validatedAt: { sessionId: 'mechanical', revision: 1 },
                coverage: { complete: true }
              }
      }))
    }),
    { reviewTargetId: 'root' }
  )
  const signal = new AbortController().signal
  const call = async (name: string, args: unknown) =>
    JSON.parse(await tools.call(name, args, signal))
  await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
    method: 'Match',
    references: [],
    criteria: reviewCriteria(['Appearance']),
    detailRequired: false
  })
  const image = await call(AiActionNames.INSPECT_DRAWING, {
    arguments: { elementId: 'root' }
  })
  const failed = {
    id: 'prepared:source:data',
    origin: 'tool' as const,
    status: 'fail' as const,
    evidence: 'Invalid polygon',
    dependencies: { source: '1' }
  }
  checkResults.record(failed)
  const result = await call(AiDesignToolIds.REVIEW_DRAWING, {
    phase: 'visual',
    ...wholeViewJudgments(
      [image.actionResults[0].result.inspectionId],
      [
        {
          criterionId: 'Appearance',
          status: 'pass',
          evidence: 'Observed the requested drawing'
        }
      ]
    )
  })
  expect(result.accepted).toBe(false)
  const final = {
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
  expect(tools.settleOutcome(final).actions[0].arguments).toMatchObject({
    outcome: 'unsupported'
  })
  const visual = checkResults
    .read({ includePassed: true })
    .items.filter((item) => item.origin === 'main-agent')
  checkResults.record({
    ...failed,
    status: 'pass',
    evidence: 'Source corrected'
  })
  await tools.validateCompletion(signal)
  expect(tools.settleOutcome(final)).toEqual(final)
  expect(
    checkResults
      .read({ includePassed: true })
      .items.filter((item) => item.origin === 'main-agent')
  ).toEqual(visual)
})

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
      { modelActions: (a) => a, resolveBatch: (b) => b, checkResults: results },
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
    await call(AiDesignToolIds.DEFINE_DESIGN_CRITERIA, {
      phase: 'plan',
      method: 'Compare an explicitly aligned crop',
      references: [],
      detailRequired: false,
      criteria: {
        surface: {
          requirement: 'Exact surface',
          description: 'Compare source crop',
          verification: 'visual',
          requiredUnits: []
        }
      }
    })
    const selected = await call(AiDesignToolIds.SELECT_DESIGN_REFERENCES, {
      referenceImageIndexes: [0],
      requirementRevision: 1,
      referenceDecisions: [
        {
          referenceId: images.validateReferences([0])[0].referenceId,
          status: 'accepted',
          reason: 'Explicit aligned fixture source',
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
    const request = {
      referenceUse: selected.referenceDecisions[0].uses[0].receipt,
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
          if (failure === 'cancelled') abort.abort()
          else f.setCurrent(false)
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

it('checks a large exact mutation set in bounded exchanges and reuses independent stamps', async () => {
  const targets = new Set(Array.from({ length: 7718 }, (_, n) => `target-${n}`))
  const measured: string[] = []
  let stale: string | undefined = undefined
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: batch.actions.map((action) => {
      const id = String(action.arguments.elementId)
      let result: AiJsonValue
      if (action.name === AiActionNames.REVIEW_DESIGN) {
        measured.push(id)
        result = {
          complete: true,
          findings: [],
          measuredTextIds: [],
          evidence: { sessionId: 'bulk', revision: 1, receiptId: id }
        }
      } else {
        const stamp = action.arguments.evidence as { receiptId: string }
        result = { current: stamp.receiptId !== stale }
      }
      return { actionId: action.id, actionName: action.name, result }
    })
  }))
  const owner = createOwner(
    [
      AiActionNames.REVIEW_DESIGN,
      AiActionNames.VALIDATE_INSPECTION_EVIDENCE
    ].map((name) => ({ name, description: name, inputSchema: {} })),
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute
  )
  const check = () =>
    owner.finishInspection(
      targets,
      undefined,
      true,
      new AbortController().signal
    )
  const cold = await check()
  expect(cold.checks.counts).toEqual({
    pass: 7718,
    fail: 0,
    stale: 0,
    unverified: 0
  })
  expect(new Set(measured)).toEqual(targets)
  expect(measured).toHaveLength(targets.size)
  expect(execute.mock.calls.length).toBeLessThanOrEqual(
    Math.ceil(targets.size / 64)
  )
  expect(
    execute.mock.calls.every(([batch]) => batch.actions.length <= 64)
  ).toBe(true)
  execute.mockClear()
  measured.length = 0
  await check()
  expect(measured).toHaveLength(0)
  expect(execute.mock.calls.length).toBeLessThanOrEqual(
    Math.ceil(targets.size / 64)
  )
  execute.mockClear()
  stale = 'target-4000'
  await check()
  expect(measured).toEqual([stale])
  expect(execute.mock.calls.length).toBeLessThanOrEqual(
    Math.ceil(targets.size / 64) + 1
  )
})

it('preserves acknowledged checks before a failed chunk member without replaying or accepting missing results', async () => {
  const targets = new Set(Array.from({ length: 130 }, (_, n) => `item-${n}`))
  let exchanges = 0
  const execute = vi.fn(async (batch: AiActionBatch) => {
    const failed = exchanges++ === 0
    const completed = failed ? batch.actions.slice(0, 3) : batch.actions
    return {
      context: {},
      ...(failed
        ? {
            failure: {
              code: 'CHECK_FAILED',
              message: 'Check unavailable',
              stage: 'execution',
              actionName: batch.actions[3].name,
              actionId: batch.actions[3].id,
              actionExecutionMs: 0,
              settlement: 'partial' as const,
              contextFresh: true
            }
          }
        : {}),
      actionResults: completed.map((action) => ({
        actionId: action.id,
        actionName: action.name,
        result: {
          complete: true,
          findings: [],
          evidence: { sessionId: 'partial', revision: 1 }
        }
      }))
    }
  })
  const owner = createOwner(
    [
      {
        name: AiActionNames.REVIEW_DESIGN,
        description: 'Check',
        inputSchema: {}
      }
    ],
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute
  )
  const result = await owner.finishInspection(
    targets,
    undefined,
    true,
    new AbortController().signal
  )
  expect(execute).toHaveBeenCalledTimes(4)
  expect(result.checks.counts).toEqual({
    pass: 129,
    fail: 0,
    stale: 0,
    unverified: 1
  })
  expect(result.measurementIssues?.map((issue) => issue.elementId)).toEqual([
    'item-3'
  ])
  expect(
    execute.mock.calls
      .slice(1)
      .flatMap(([batch]) => batch.actions.map((a) => a.arguments.elementId))
  ).toEqual([...targets].slice(4))
})

it('cancels a bulk check before admitting late results or dispatching the next chunk', async () => {
  const controller = new AbortController()
  const results = createDesignCheckResults()
  const execute = vi.fn(async (batch: AiActionBatch) => {
    controller.abort(new Error('Cancelled'))
    return {
      context: {},
      actionResults: batch.actions.map((action) => ({
        actionId: action.id,
        actionName: action.name,
        result: {
          complete: true,
          findings: [],
          evidence: { sessionId: 'late', revision: 1 }
        }
      }))
    }
  })
  const owner = createOwner(
    [
      {
        name: AiActionNames.REVIEW_DESIGN,
        description: 'Check',
        inputSchema: {}
      }
    ],
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute,
    { checkResults: results }
  )
  await expect(
    owner.finishInspection(
      new Set(Array.from({ length: 130 }, (_, n) => `item-${n}`)),
      undefined,
      true,
      controller.signal
    )
  ).rejects.toThrow('Cancelled')
  expect(execute).toHaveBeenCalledTimes(1)
  expect(results.summary([]).counts.pass).toBe(0)
})

it('exposes mechanical inspection activity for the entire bounded read and always closes it', async () => {
  const onInspection = vi.fn()
  const execute = vi.fn(async () => {
    expect(onInspection).toHaveBeenLastCalledWith(
      'running',
      AiActionNames.REVIEW_DESIGN
    )
    throw new Error('Read transport unavailable')
  })
  const owner = createOwner(
    [
      {
        name: AiActionNames.REVIEW_DESIGN,
        description: 'Check',
        inputSchema: {}
      }
    ],
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute,
    { onInspection }
  )
  const result = await owner.finishInspection(
    new Set(['window']),
    undefined,
    true,
    new AbortController().signal
  )
  expect(result.checks.counts.unverified).toBe(1)
  expect(onInspection.mock.calls).toEqual([
    ['running', AiActionNames.REVIEW_DESIGN],
    ['completed', AiActionNames.REVIEW_DESIGN]
  ])
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
  if (!write) throw new Error('Missing canonical fill operation')
  const writes: unknown[] = []
  const dispatch = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: await Promise.all(
      batch.actions.map(async (action) => {
        if (action.name === read.name)
          return {
            actionId: action.id,
            actionName: action.name,
            result: (await read.execute(action.arguments as never, {
              signal
            })) as AiJsonValue
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
    { modelActions: (a) => a, resolveBatch: (b) => b },
    dispatch
  )
  try {
    await tools.call(
      'execute_design_batch',
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
    for (const snapshot of pinned)
      expect(
        store.get(snapshot.snapshotId, snapshot.leaseId, signal)
      ).toBeDefined()
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
      { modelActions: (a) => a, resolveBatch: (b) => b },
      dispatch
    )
    const output = JSON.parse(
      await tools.call(
        'execute_design_batch',
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
  const batch = owner.definitions.find((d) => d.name === 'execute_design_batch')
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
    ...toolSemantics({
      effect: 'read',
      composition: 'control-plane',
      outputSchema: { type: 'object' }
    })
  }))
  const execute = vi.fn()
  const owner = createLocalOperationTools(
    [action],
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
  expect(page.apis[0].definition.coverage).toBe('usage')
  expect(page.tools[0].inputFields).toContain('/properties/target')
  expect(page.tools[0].inputSchema).toBeUndefined()
  expect(page.next.arguments.view).toBe('usage')
  expect(owner.resultIssue('describe_design_apis', page)).toBeUndefined()
  const last = await read(page.next.arguments)
  expect(last.complete).toBe(true)
  expect(last.tools.at(-1).definition.coverage).toBe('usage')
  const category = await read({ category: 'tools', view: 'usage' })
  expect(category.tools[0].definition.state).toBe('included')
  const full = await read({ names: ['saved_tools.probe-0'] })
  expect(full.tools[0].definition.state).toBe('included')
  expect(full.tools[0].inputSchema).toEqual(native[0].inputSchema)
  const repeated = await read({
    query: 'discovery representation probe',
    view: 'usage'
  })
  expect(repeated.tools[0].definition.state).toBe('included')
  const restored = await read({
    ...page.next.arguments,
    refresh: true,
    refreshReason: 'delivery-failure'
  })
  expect(restored.tools[0].inputFields).toContain('/properties/target')
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute
  )
  const result = JSON.parse(
    await owner.call(
      'describe_design_apis',
      { query: 'an unfamiliar building reference photograph' },
      new AbortController().signal
    )
  )
  expect(result.apis).toEqual([])
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
    vi.fn(),
    {
      getNativeTools: () => [
        {
          name,
          namespace: 'saved_tools',
          description: 'A different saved recipe',
          inputSchema: { type: 'object' },
          ...toolSemantics({
            effect: 'read',
            composition: 'control-plane',
            outputSchema: { type: 'object' }
          })
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
    execute,
    { getNativeTools: () => native }
  )
  const definition = owner.definitions.find(
    (tool) => tool.name === 'describe_design_apis'
  )
  if (!definition) throw new Error('Missing discovery definition')
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
      if (page.complete) break
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
  expect(await read({ query: 'absent capability' })).toMatchObject({
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
    vi.fn()
  )
  const definition = owner.definitions.find(
    (tool) => tool.name === 'describe_design_apis'
  )
  if (!definition) throw new Error('Missing discovery definition')
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
    vi.fn(),
    { getNativeTools: inventory, getNativeToolsRevision: () => revision }
  )
  const definition = owner.definitions.find(
    (d) => d.name === 'describe_design_apis'
  )
  if (!definition) throw new Error('Missing discovery definition')
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
    { modelActions: (value) => value, resolveBatch: (value) => value },
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
    { modelActions: (a) => a, resolveBatch: (b) => b },
    dispatch,
    {
      getNativeTools: () =>
        tools.definitions
          .filter(
            (definition) =>
              definition.name === AiDesignToolIds.EXECUTE_DESIGN_BATCH
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
    names: [
      AiActionNames.READ_DESIGN_CONTEXT,
      AiDesignToolIds.EXECUTE_DESIGN_BATCH
    ],
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

it('keeps recorded usage schema-free and groups only canonical basic wrapper routes', async () => {
  const actions = createBasicApiActions()
  const action = actions.find(
    (item) => item.name === 'api_fill_updateFillsAtIndex'
  )
  if (!action) throw new Error('Missing canonical fill action')
  const wrapperOwner = createLocalOperationTools(
    actions,
    { modelActions: (a) => a, resolveBatch: (b) => b },
    vi.fn()
  )
  const definition = wrapperOwner.definitions.find(
    (item) => item.name === action.name
  )
  if (!definition) throw new Error('Missing canonical wrapper')
  const native = {
    ...definition,
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
    { modelActions: (a) => a, resolveBatch: (b) => b },
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
  const recorded = recordedDiscovery.calls.find((call) => 'query' in call.input)
  if (!recorded) throw new Error('Missing recorded query')
  const menu = await read(recorded.input)
  const entry = menu.apis.find(
    (item: { name: string }) => item.name === action.name
  )
  expect(entry.inputFields).toContain('/properties/elementIds')
  expect(entry.execution.kind).toBe('batch-action')
  expect(entry.recipeDependency.definition.arguments.names).toEqual([
    native.registeredName
  ])
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
  expect(usage.tools[0].inputFields).toContain('/properties/arguments')
  const reused = await read({ names: [native.registeredName], view: 'usage' })
  expect(reused.tools[0].definition.state).toBe('included')
  const restored = await read(reused.tools[0].definition.recover.arguments)
  expect(restored.tools[0].inputFields).toEqual(usage.tools[0].inputFields)
  expect(restored.tools[0].outputSchema).toBeUndefined()
  expect(execute).not.toHaveBeenCalled()
})

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
      if (!tool.inputSchema) continue
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
    { modelActions: (a) => a, resolveBatch: (b) => b },
    vi.fn()
  )
  for (const definition of base.definitions) {
    if (!definition.name.startsWith('api_')) continue
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
    { modelActions: (a) => a, resolveBatch: (b) => b },
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
    bytes += Buffer.byteLength(JSON.stringify(result))
    expect(result.missingNames ?? result.missingOperations ?? []).toEqual([])
    for (const expected of call.output.apis ?? []) {
      const actual = result.apis.find(
        (item: { name: string }) => item.name === expected.name
      )
      expect(actual, expected.name).toBeDefined()
      if (expected.inputSchema)
        expect(
          runtimeOperationSchema({ ...actual.inputSchema, examples: undefined })
        ).toEqual({ ...expected.inputSchema, examples: undefined })
    }
    for (const expected of call.output.tools ?? []) {
      const actual = result.tools.find(
        (item: { name: string; namespace: string }) =>
          item.name === expected.name && item.namespace === expected.namespace
      )
      if (call.input.view === 'usage' && !actual) {
        expect(
          result.apis.some(
            (item: { recipeDependency?: { name: string } }) =>
              item.recipeDependency?.name === expected.registeredName
          )
        ).toBe(true)
      } else {
        expect(actual, expected.name).toBeDefined()
        if (expected.inputSchema)
          expect(runtimeOperationSchema(actual.inputSchema)).toEqual(
            expected.inputSchema
          )
        if (expected.outputSchema)
          expect(actual.outputSchema).toEqual(expected.outputSchema)
        if (expected.partialOutputSchema)
          expect(actual.partialOutputSchema).toEqual(
            expected.partialOutputSchema
          )
      }
    }
    if (call.input.view === 'usage') {
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
    { modelActions: (a) => a, resolveBatch: (b) => b },
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
      AiDesignToolIds.EXECUTE_DESIGN_BATCH,
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

it('declares the shared bounded result projection in visual review outcomes', async () => {
  const { designEvidenceDefinitions } = await import('../local-design-review')
  const { operationInputIssue } = await import('../operation-input-schema')
  const definition = designEvidenceDefinitions.find(
    (tool) => tool.name === AiDesignToolIds.REVIEW_DRAWING
  )
  if (!definition) throw new Error('Missing review definition')
  const base = {
    phase: 'visual',
    reviewOperation: 'record',
    recordedChecks: [],
    accepted: true,
    inspectionIds: ['inspection']
  }
  const results = createDesignCheckResults().deliver()
  expect(operationInputIssue(base, definition.outputSchema)).toBeUndefined()
  expect(
    operationInputIssue({ ...base, results }, definition.outputSchema)
  ).toBeUndefined()
  expect(
    operationInputIssue(
      { ...base, results: { ...results, counts: 'invalid' } },
      definition.outputSchema
    )
  ).toBeDefined()
  expect(
    operationInputIssue(
      { ...base, results: { counts: results.counts } },
      definition.outputSchema
    )
  ).toBeDefined()
  expect(definition.revision).toBeGreaterThan(8)
})

it('replays recorded conflicting and corrected targets without reading or writing the rejected input', async () => {
  const rejected = recordedAcquisition.calls.find((call) => call.index === 31)
  const corrected = recordedAcquisition.calls.find((call) => call.index === 34)
  if (!rejected || !corrected)
    throw new Error('Recorded target cases are missing')
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
    { modelActions: (a) => a, resolveBatch: (v) => v },
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
    tools.call(rejected.tool, bad, new AbortController().signal)
  ).rejects.toThrow(/conflicting target binding/)
  expect(execute).not.toHaveBeenCalled()
  expect(bad).toEqual(before)
  const result = JSON.parse(
    await tools.call(
      corrected.tool,
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
  if (!api) throw new Error('Missing hierarchy contract')
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
  ])
    expect(operationInputIssue(input, runtime)).toEqual(
      operationInputIssue(input, source)
    )
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
    { modelActions: (a) => a, resolveBatch: (b) => b },
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
      tool: 'execute_design_batch',
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
      { modelActions: (a) => a, resolveBatch: (b) => b },
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
    expect(usage.definition.recover.arguments.names).toEqual([action.name])
  }
})

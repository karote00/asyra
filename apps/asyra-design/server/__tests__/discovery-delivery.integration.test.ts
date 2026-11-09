import historical_referenceChain from '../../test-data/ai-drawing/fixtures/reference-chain-20261108.json'
import historical_deliveryHandoff from '../../test-data/ai-drawing/fixtures/result-delivery-20261108.json'
import {
  ownerInvocation,
  recordAcquisitionCost
} from './tool-contract-assertions'
import historical_acquisitionQuery from '../../test-data/ai-drawing/fixtures/capability-acquisition-20261106.json'
import historical_strictNativeDetail from './fixtures/recorded-101/strict-native-detail-20261106.json'
import { createAiInspectionAction } from '../../src/ai/inspection'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import { inspectionInputSchema } from '../../src/ai/inspection-schema'
import historical_strictMixedQuery from './fixtures/recorded-101/strict-mixed-query-20261106.json'
import { completeUsageBudget } from './tool-contract-assertions'
import * as workflowDiscovery from '../design-workflow-discovery'
import historical_usageAcquisition from './fixtures/recorded-101/usage-acquisition-20261028.json'
import historical_fieldRecovery from './fixtures/recorded-101/field-query-recovery-20261027.json'
import { createLocalKnowledgeTools } from '../local-knowledge'
import historical_sampledEllipse from './fixtures/recorded-101/projected-ellipse-20261024.json'
import { constructDesign } from '../design-construction'
import { measureDesignBudget } from '../design-budget'
import historical_layeredPattern from './fixtures/recorded-101/layered-pattern-20261023.json'
import { expectEquivalentPatternEntries } from './layered-pattern-assertions'
import historical_recoveryFixture from './fixtures/recorded-101/pattern-budget-recovery-20261023.json'
import historical_compositionMaterials from './fixtures/recorded-101/composition-materials-20261022.json'
import historical_componentSelection from './fixtures/recorded-101/component-selection-20261022.json'
import historical_expansionBudget from './fixtures/recorded-101/expansion-budget-20261022.json'
import { DesignPreparationLimits } from '../../src/ai/prepared-design'
import {
  projectWorkflowInput,
  workflowQueryGuidance
} from '../design-workflow-discovery'
import historical_invalidQueryScope from './fixtures/recorded-101/invalid-query-scope-20261022.json'
import historical_exactQueryScope from './fixtures/recorded-101/exact-query-scope-20261027.json'
import historical_operationSelection from './fixtures/recorded-101/operation-selection-20261022.json'
import historical_inspectionDiscovery from './fixtures/recorded-101/inspection-discovery-20261022.json'
import { createHash } from 'node:crypto'
import { designPreparationExamples } from '../design-preparation-examples'
import historical_orderedPreparation from './fixtures/recorded-101/ordered-preparation-20261019.json'
import { readCompleteInformation } from './tool-contract-assertions'
import { expect, it, vi } from 'vitest'
vi.mock('../../src/contexts', () => ({ default: {} }))
import { createPreparedDesignAction } from '../../src/ai/design-actions'
import type { PreparedElementDescriptor } from '../../src/common-apis'
import historical_recorded from './fixtures/recorded-101/discovery-delivery-20261020.json'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { createLocalOperationTools } from '../local-operation-tools'
import { invokeLocalTool } from '../local-tool-invocation'
import { operationInputIssue } from '../operation-input-schema'
import {
  createDesignPreparationSession,
  prepareDesign,
  prepareDesignAsync
} from '../design-preparation'
import { AiActionNames } from '../../src/constants/ai-actions'
import type { AiActionBatch } from '../../src/ai/action-batch-protocol'

// Recorded geometry and intent are unchanged; retired approval parameters are
// removed from replay inputs. Historical response payloads remain evidence only.
const currentRecordedInput = (value: any): any => {
  if (Array.isArray(value)) return value.map(currentRecordedInput)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'plan')
      .map(([key, child]) => [
        key,
        key === 'optionalInputs' && Array.isArray(child)
          ? child.filter((name) => name !== 'plan')
          : currentRecordedInput(child)
      ])
  )
}
const currentFixture = (source: any) => {
  const value = structuredClone(source)
  for (const key of [
    'input',
    'query',
    'selectedInput',
    'captureQuery',
    'constructionQuery',
    'usage'
  ])
    if (value[key]) value[key] = currentRecordedInput(value[key])
  if (value.queries) value.queries = value.queries.map(currentRecordedInput)
  if (value.calls)
    value.calls = value.calls.map((call: any) => ({
      ...call,
      ...(call.input ? { input: currentRecordedInput(call.input) } : {})
    }))
  return value
}
const referenceChain = currentFixture(historical_referenceChain)
const deliveryHandoff = currentFixture(historical_deliveryHandoff)
const acquisitionQuery = currentFixture(historical_acquisitionQuery)
const strictNativeDetail = currentFixture(historical_strictNativeDetail)
const strictMixedQuery = currentFixture(historical_strictMixedQuery)
const usageAcquisition = currentFixture(historical_usageAcquisition)
const fieldRecovery = currentFixture(historical_fieldRecovery)
const sampledEllipse = currentFixture(historical_sampledEllipse)
const layeredPattern = currentFixture(historical_layeredPattern)
const recoveryFixture = currentFixture(historical_recoveryFixture)
const compositionMaterials = currentFixture(historical_compositionMaterials)
const componentSelection = currentFixture(historical_componentSelection)
const expansionBudget = currentFixture(historical_expansionBudget)
const invalidQueryScope = currentFixture(historical_invalidQueryScope)
const exactQueryScope = currentFixture(historical_exactQueryScope)
const operationSelection = currentFixture(historical_operationSelection)
const inspectionDiscovery = currentFixture(historical_inspectionDiscovery)
const orderedPreparation = currentFixture(historical_orderedPreparation)
const recorded = currentFixture(historical_recorded)

inspectionDiscovery.query = {
  names: ['inspect_drawing', 'record_design_facts'],
  schemaPaths: [
    '/properties/arguments',
    '/properties/facts',
    '/properties/unknown'
  ]
}
fieldRecovery.usage.input.names = [
  'discover_knowledge',
  'select_design_references',
  'record_design_facts'
]
fieldRecovery.query.input = {
  ...fieldRecovery.query.input,
  schemaPaths: ['/properties/referenceImageIndexes', '/properties/references']
}

const setup = (
  unrelatedCount = 0,
  description = 'Unrelated capability',
  expandedNodeLimit = 10000,
  includeKnowledge = false,
  additionalNative: {
    name: string
    namespace: string
    description: string
    inputSchema: object
    outputSchema?: object
  }[] = [],
  materialRevision = false
) => {
  const actions = [
    ...(materialRevision
      ? [
          {
            name: AiActionNames.APPLY_PREPARED_MATERIAL,
            description: 'Apply prepared material',
            inputSchema: {}
          }
        ]
      : []),
    {
      name: AiActionNames.APPLY_PREPARED_DESIGN,
      description: 'Apply',
      inputSchema: {}
    },
    createAiToolContract(createAiInspectionAction())
  ]
  const compile = vi.fn(prepareDesignAsync)
  const designs = createLocalDesignTools(
    actions,
    createDesignPreparationSession(
      prepareDesign,
      compile,
      undefined,
      expandedNodeLimit
    )
  )
  const created: PreparedElementDescriptor[] = []
  const elements = new Map<string, PreparedElementDescriptor>()
  const parents = new Map<string, string>()
  const apply = createPreparedDesignAction(
    {
      getWorkspaceId: () => 'workspace',

      getElementType: (id) => elements.get(id)?.type,

      getElementMetadata: (id) => {
        const entry = elements.get(id)

        return entry
          ? { type: entry.type, parentId: parents.get(id) }
          : undefined
      },

      getPlacement: (id) => elements.get(id),

      isContainerType: (type) => ['group', 'frame'].includes(type),

      isLocked: () => false,

      create: (entries, parentId) => {
        for (const entry of entries) {
          parents.set(entry.id, parentId)
          elements.set(entry.id, entry)
        }

        created.push(...entries)

        return entries.map((entry) => entry.id)
      },

      select: () => undefined
    },
    async () => undefined
  )
  const execute = vi.fn(async (batch: AiActionBatch) => ({
    context: {},
    actionResults: await Promise.all(
      batch.actions.map(async (action) => ({
        actionId: action.id,
        actionName: action.name,
        result:
          action.name === AiActionNames.INSPECT_DRAWING
            ? {
                available: true,
                image: {
                  dataUrl: 'data:image/png;base64,AA==',
                  width: 1,
                  height: 1
                }
              }
            : await apply.execute(action.arguments, {
                signal: new AbortController().signal
              } as never)
      }))
    )
  }))
  const operations = createLocalOperationTools(actions, designs, execute, {
    validateReferences: () => [],
    getNativeTools: () => [
      ...additionalNative,
      ...Array.from({ length: unrelatedCount }, (_, index) => ({
        name: `unrelated_${index}`,
        namespace: 'unrelated',
        description,
        inputSchema: { type: 'object' }
      })),
      ...owners.flatMap((owner) =>
        owner.definitions.map((definition) => ({
          ...definition,
          namespace: 'design'
        }))
      )
    ]
  })
  const trace = vi.fn()
  const workflow = createLocalDesignWorkflow(designs, operations, { trace })
  const owners = [
    designs,
    operations,
    workflow,
    ...(includeKnowledge
      ? [createLocalKnowledgeTools('field-query-proof', async () => [])]
      : [])
  ]
  const calls: string[] = []
  const deliveries: number[] = []
  const replies: { input: unknown; raw: string }[] = []

  const call = async (
    name: string,
    args: unknown,
    signal = new AbortController().signal
  ) => {
    calls.push(name)
    const owner = owners.find((candidate) =>
      candidate.definitions.some((definition) => definition.name === name)
    )

    if (!owner) {
      throw new Error(`Missing owner: ${name}`)
    }

    const definition = owner.definitions.find((item) => item.name === name)

    if (!definition) {
      throw new Error(`Missing definition: ${name}`)
    }

    const reply = await invokeLocalTool(owner, definition, args, signal)

    deliveries.push(Buffer.byteLength(reply.text))
    replies.push({ input: args, raw: reply.text })
    const text = await readCompleteInformation(async (input) => {
      if (input === args) {
        return reply.text
      }

      const next = await invokeLocalTool(owner, definition, input, signal)

      deliveries.push(Buffer.byteLength(next.text))
      replies.push({ input, raw: next.text })
      expect(next.success).toBe(reply.success)

      return next.text
    }, args)

    return { ...reply, value: JSON.parse(text) }
  }

  return {
    call,
    trace,
    compile,
    execute,
    owners,
    created,
    parents,
    calls,
    deliveries,
    replies
  }
}

it('finds the recorded compound material purpose and follows its exact acquisition route', async () => {
  const { call, compile, created, deliveries } = setup()
  const found = (
    await call('describe_design_apis', acquisitionQuery.compound.input)
  ).value
  const candidate = found.tools.find(
    (tool: { name: string }) => tool.name === 'prepare_and_apply_design'
  )

  expect(candidate).toBeDefined()
  expect(candidate.match.metadataTerms).toContain('world')
  expect(candidate.usage.arguments.names).toEqual([
    'design.prepare_and_apply_design'
  ])
  expect(candidate.parameters).toBeUndefined()
  expect(compile).not.toHaveBeenCalled()
  const menuBytes = deliveries.reduce((total, bytes) => total + bytes, 0)
  const menuCalls = deliveries.length

  expect(menuCalls).toBe(1)
  expect(menuBytes).toBeLessThan(acquisitionQuery.broad.responseTextBytes)
  const selected = (
    await call('describe_design_apis', {
      ...candidate.usage.arguments,
      inputScope: acquisitionQuery.selectedInput.inputScope
    })
  ).value.tools[0]
  const invocation = ownerInvocation(selected.invocationExample.invocation)

  expect(selected.usageGuide.parameters).toBeDefined()
  expect(selected.usageGuide.results.guaranteedFields).toBeDefined()
  expect(
    operationInputIssue(invocation.arguments, selected.usageGuide.parameters)
  ).toBeUndefined()
  process.stdout.write(
    JSON.stringify({
      measurement: 'recorded-compound-acquisition',
      candidates: [...found.apis, ...found.tools].map((entry) => ({
        name: entry.name,
        bytes: Buffer.byteLength(JSON.stringify(entry)),
        descriptionBytes: Buffer.byteLength(entry.description ?? ''),
        scopeBytes: Buffer.byteLength(JSON.stringify(entry.inputScopes ?? {}))
      })),
      menuBytes,
      menuCalls,
      completeAcquisitionBytes: deliveries.reduce(
        (total, bytes) => total + bytes,
        0
      ),
      completeAcquisitionCalls: deliveries.length
    }) + '\n'
  )
  const reply = await call(invocation.tool, invocation.arguments)

  // This harness has no browser inspection service; the actual write still settles.
  expect(reply.value.actionResults[0].result.status).toBe('complete')
  expect(compile).toHaveBeenCalledTimes(1)
  expect(created.length).toBeGreaterThan(0)
})

it('keeps recorded broad material usage as candidate menus without projecting every contract', async () => {
  const { call, compile, deliveries, owners } = setup()
  const project = vi.spyOn(workflowDiscovery, 'workflowUsageParameters')

  try {
    const reply = await call(
      'describe_design_apis',
      acquisitionQuery.broad.input
    )

    expect(reply.success).toBe(true)
    expect(reply.value.count).toBeGreaterThan(1)
    expect(reply.value.tools.length).toBeGreaterThan(0)
    for (const tool of reply.value.tools) {
      expect(tool.usageGuide).toBeUndefined()
      expect(tool.inputSchema).toBeUndefined()
      expect(tool.usage.arguments.names).toEqual([
        `${tool.namespace}.${tool.name}`
      ])
    }

    expect(deliveries).toHaveLength(1)
    expect(deliveries[0]).toBeLessThan(acquisitionQuery.broad.responseTextBytes)
    process.stdout.write(
      JSON.stringify({
        measurement: 'recorded-broad-material-menu',
        responseBytes: deliveries[0],
        replies: deliveries.length,
        baselineFirstReplyBytes: acquisitionQuery.broad.responseTextBytes,
        baselineContentBytes: acquisitionQuery.broad.declaredContentBytes
      }) + '\n'
    )
    expect(project).not.toHaveBeenCalled()
    expect(compile).not.toHaveBeenCalled()
    const exact = (
      await call('describe_design_apis', {
        names: ['design.prepare_and_apply_design'],
        view: 'full'
      })
    ).value.tools[0]

    expect(exact.inputSchema).toEqual(
      owners[2].definitions.find(
        (definition) => definition.name === 'prepare_and_apply_design'
      )?.inputSchema
    )
  } finally {
    project.mockRestore()
  }
})

it('delivers recorded full contracts and publishes executable high-level usage without replay on recovery', async () => {
  const { call, compile, execute, owners, created, calls } = setup()
  const full = (await call('describe_design_apis', recorded.calls[0].input))
    .value

  for (const name of ['prepare_and_apply_design']) {
    const definition = owners
      .flatMap((owner) => owner.definitions)
      .find((item) => item.name === name)

    if (!definition) {
      throw new Error(`Missing definition: ${name}`)
    }

    expect(
      full.tools.find((tool: { name: string }) => tool.name === name)
        .inputSchema
    ).toEqual(definition.inputSchema)
    const usage = (
      await call('describe_design_apis', {
        names: [name],
        view: 'usage',
        includeResultSchema: true
      })
    ).value.tools[0]

    if (usage.usageGuide) {
      // Exact non-scoped usage now promises the whole input, not a smaller menu.
      expect(usage.usageGuide.parameters).toBeDefined()
      expect(usage.definition.nextAction).toBe(
        'execute-with-delivered-contract'
      )
    } else {
      expect(Buffer.byteLength(JSON.stringify(usage))).toBeLessThan(
        Buffer.byteLength(
          JSON.stringify(
            full.tools.find((tool: { name: string }) => tool.name === name)
          )
        )
      )
      expect(usage.definition.nextAction).toBe('select-operation-scope')
    }

    expect(usage.invocationExample.illustrative).toBe(true)
    const invocation = ownerInvocation(usage.invocationExample.invocation)

    expect(invocation.tool).toBe(name)
    expect(
      operationInputIssue(invocation.arguments, definition.inputSchema)
    ).toBeUndefined()
    const reply = await call(invocation.tool, invocation.arguments)

    if (name === 'prepare_and_apply_design') {
      expect(reply.success).toBe(true)
      expect(reply.value).toMatchObject({
        toolOutcome: {
          status: 'success',
          settlement: 'completed',
          issues: []
        },
        actionResults: expect.arrayContaining([
          {
            actionId: expect.any(String),
            actionName: 'apply_prepared_design',
            result: expect.objectContaining({ status: 'complete' })
          }
        ])
      })
      expect(created.map((entry) => entry.id)).toContain(
        reply.value.actionResults[0].result.compositionId
      )
      expect(created.some((entry) => entry.type === 'vector')).toBe(true)
    } else {
      expect(reply.success).toBe(true)
      expect(reply.value.recorded).toBe(true)
    }

    const recovered = (
      await call('describe_design_apis', usage.definition.recover.arguments)
    ).value.tools[0]

    expect(recovered.invocationExample).toEqual(usage.invocationExample)
    expect(recovered.definition.coverage).toBe('usage')
  }

  expect(compile).toHaveBeenCalledTimes(1)
  expect(
    execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
  const restored = (await call('describe_design_apis', recorded.calls[1].input))
    .value.tools[0]

  expect(restored.inputSchema).toEqual(full.tools[0].inputSchema)
  expect(calls.filter((name) => name === 'describe_design_apis')).toHaveLength(
    4
  )
  expect(
    execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
})

it('navigates actual local definitions and preserves selected constraints and recovery scope', async () => {
  const { call, execute } = setup()
  const names = ['prepare_and_apply_design']
  const usage = (
    await call('describe_design_apis', {
      names,
      view: 'usage',
      includeResultSchema: true
    })
  ).value.tools[0]
  const path = '/$defs/node/anyOf/0/properties/type'

  expect(usage.inputFields).toContain('/properties/draft')
  expect(
    usage.inputFields.every(
      (field: string) =>
        field.split('/').length === 3 ||
        /^\/properties\/delivery\/anyOf\/[01]$/.test(field)
    )
  ).toBe(true)
  const args = { names, schemaPaths: [path] }
  const fragment = (await call('describe_design_apis', args)).value.tools[0]

  expect(fragment.schemaFragments[0].path).toBe(path)
  expect(
    fragment.schemaContext.some((entry: { schema: { required?: string[] } }) =>
      entry.schema.required?.includes('type')
    )
  ).toBe(true)
  const repeated = (await call('describe_design_apis', args)).value.tools[0]

  expect(repeated.definition.availableInResponse).toBe(true)
  const recovery = repeated.definition.recover.arguments

  expect(recovery.schemaPaths).toEqual([path])
  const recovered = (await call('describe_design_apis', recovery)).value
    .tools[0]

  expect(recovered.schemaFragments).toEqual(fragment.schemaFragments)
  expect(recovered.schemaContext).toEqual(fragment.schemaContext)
  const missing = (
    await call('describe_design_apis', { names, schemaPaths: ['/missing'] })
  ).value.tools[0]

  expect(missing.definition.availableInResponse).toBe(false)
  expect(missing.schemaResolution.inputFields).toEqual(usage.inputFields)
  expect(missing.schemaResolution.inputFields).not.toContain(path)
  const full = (await call('describe_design_apis', { names })).value.tools[0]
  const draft = (
    await call('describe_design_apis', {
      names,
      schemaPaths: ['/properties/draft']
    })
  ).value.tools[0]

  expect(draft.schemaFragments[0].schema).toEqual(
    full.inputSchema.properties.draft
  )
  expect(draft.schemaReferences['#/$defs/node']).toEqual(
    full.inputSchema.$defs.node
  )
  expect(
    draft.schemaContext.find((entry: { path: string }) => entry.path === '')
      .schema
  ).toMatchObject({
    additionalProperties: false,
    oneOf: full.inputSchema.oneOf
  })
  expect(execute).not.toHaveBeenCalled()
})

it('rejects invalid and cancelled invocations before writes and does not revive expired preparation credentials', async () => {
  const first = setup()
  const usage = (
    await first.call('describe_design_apis', {
      names: ['prepare_design'],
      view: 'usage',
      includeResultSchema: true
    })
  ).value.tools[0]
  const args = ownerInvocation(usage.invocationExample.invocation).arguments
  const invalid = await first.call('prepare_and_apply_design', {
    ...args,
    unexpected: true
  })

  expect(invalid.success).toBe(false)
  expect(invalid.value.settlement).toBe('not-started')
  expect(first.compile).not.toHaveBeenCalled()
  const controller = new AbortController()

  controller.abort()
  await expect(
    first.call('prepare_and_apply_design', args, controller.signal)
  ).rejects.toThrow()
  expect(first.execute).not.toHaveBeenCalled()
  const prepared = await first.call('prepare_design', args)

  expect(prepared.success).toBe(true)
  const second = setup()
  const expired = await second.call('apply_prepared_design', {
    arguments: { artifactId: prepared.value.artifactId }
  })

  expect(expired.success).toBe(false)
  expect(second.execute).not.toHaveBeenCalled()
  const recovery = (
    await second.call(
      'describe_design_apis',
      usage.definition.recover.arguments
    )
  ).value.tools[0]

  expect(recovery.definition.coverage).toBe('usage')
  const retry = await second.call('prepare_and_apply_design', {
    ...ownerInvocation(recovery.invocationExample.invocation).arguments,
    inspection: 'defer'
  })

  expect(retry.success).toBe(true)
  expect(retry.value).toMatchObject({
    toolOutcome: {
      status: 'success',
      settlement: 'completed',
      issues: []
    },
    actionResults: [{ result: { status: 'complete' } }]
  })
  expect(second.compile).toHaveBeenCalledTimes(1)
  expect(second.execute).toHaveBeenCalledTimes(1)
  expect(first.execute).not.toHaveBeenCalled()
})

it('uses direct delivered contracts to invoke the owner and recover information without replaying writes', async () => {
  const { call, owners, execute, created } = setup()
  const operations = owners.find((owner) =>
    owner.definitions.some((d) => d.name === 'describe_design_apis')
  )

  if (!operations) {
    throw new Error('Missing discovery owner')
  }

  const definition = operations.definitions.find(
    (d) => d.name === 'describe_design_apis'
  )

  if (!definition) {
    throw new Error('Missing discovery definition')
  }

  expect(definition.description).toContain('Each page is delivered directly')
  expect(definition.description).not.toContain('Code Mode')
  const retained = new Map<
    string,
    {
      value?: {
        tools: {
          invocationExample: {
            invocation: { tool: string; arguments: Record<string, unknown> }
          }
        }[]
      }
    }
  >()

  const read = async (query: Record<string, unknown>, key: string) => {
    let input = query
    const pages: string[] = []

    for (let i = 0; i < 20; i++) {
      const reply = await invokeLocalTool(
        operations,
        definition,
        input,
        new AbortController().signal
      )

      expect(reply.success).toBe(true)
      pages.push(reply.text)
      const page = JSON.parse(reply.text).contentDelivery

      if (!page || page.lastPage) {
        retained.set(key, {
          value: page
            ? JSON.parse(
                pages
                  .map((raw) => JSON.parse(raw).contentDelivery.text)
                  .join('')
              )
            : JSON.parse(reply.text)
        })

        return pages
      }

      input = page.next.arguments
    }

    throw new Error('Missing terminal information page')
  }

  const pages = await read(
    {
      names: ['prepare_and_apply_design'],
      view: 'usage',
      includeResultSchema: true
    },
    'usage'
  )
  const invocation = ownerInvocation(
    retained.get('usage')?.value?.tools[0].invocationExample.invocation
  )

  if (!invocation) {
    throw new Error('Missing delivered invocation')
  }

  const invalid = await call(invocation.tool, {})

  expect(invalid.success).toBe(false)
  expect(execute).not.toHaveBeenCalled()
  const applied = await call(invocation.tool, {
    ...invocation.arguments,
    inspection: 'defer'
  })

  expect(applied.value.toolOutcome.settlement).toBe('completed')
  expect(execute).toHaveBeenCalledOnce()
  expect(created.length).toBeGreaterThan(0)
  const before = structuredClone(created)

  expect(pages.length).toBeGreaterThan(0)
  retained.clear()
  await read(
    {
      names: ['prepare_and_apply_design'],
      view: 'usage',
      includeResultSchema: true,
      refresh: true,
      refreshReason: 'delivery-failure'
    },
    'restored'
  )
  expect(
    ownerInvocation(
      retained.get('restored')?.value?.tools[0].invocationExample.invocation
    )
  ).toEqual(invocation)
  expect(execute).toHaveBeenCalledOnce()
  expect(created).toEqual(before)
})

it('delivers a complete selected operation with fewer first-use bytes and calls', async () => {
  const baseline = setup()
  const names = ['prepare_and_apply_design']

  await baseline.call('describe_design_apis', {
    names,
    view: 'usage',
    includeResultSchema: true
  })
  const full = (await baseline.call('describe_design_apis', { names })).value
    .tools[0]
  const run = setup()
  const usage = (
    await run.call('describe_design_apis', {
      names,
      view: 'usage',
      includeResultSchema: true
    })
  ).value.tools[0]
  const inputScope = { operation: 'draft', nodeTypes: ['vector'] }

  expect(usage.inputScopes.operations).toContain('draft')
  const selected = await run.call('describe_design_apis', { names, inputScope })

  expect(selected.success).toBe(true)
  const tool = selected.value.tools[0]

  expect(tool.definition.coverage).toBe('scoped')
  for (const field of [
    'outputSchema',
    'partialOutputSchema',
    'recoveryOutputSchema',
    'lifecycle',
    'execution'
  ]) {
    expect(tool[field]).toEqual(full[field])
  }

  const example = ownerInvocation(usage.invocationExample.invocation)

  expect(
    operationInputIssue(example.arguments, tool.inputSchema)
  ).toBeUndefined()
  expect(
    operationInputIssue({ ...example.arguments, repair: {} }, tool.inputSchema)
  ).toBeDefined()
  process.stdout.write(
    JSON.stringify({
      measurement: 'selected-contract-first-use',
      fullWithUsage: {
        calls: baseline.deliveries.length,
        bytes: baseline.deliveries.reduce((n, d) => n + d, 0)
      },
      selectedWithUsage: {
        calls: run.deliveries.length,
        bytes: run.deliveries.reduce((n, d) => n + d, 0)
      },
      usage: { calls: 1, bytes: run.deliveries[0] }
    }) + '\n'
  )
  expect(run.deliveries.length).toBeLessThan(baseline.deliveries.length)
  expect(run.deliveries.reduce((n, d) => n + d, 0)).toBeLessThan(
    baseline.deliveries.reduce((n, d) => n + d, 0)
  )
  const result = await run.call(example.tool, example.arguments)

  expect(result.value.toolOutcome).toMatchObject({
    status: 'success',
    settlement: 'completed'
  })
  const recovered = (
    await run.call('describe_design_apis', tool.definition.recover.arguments)
  ).value.tools[0]

  expect(recovered.inputSchema).toEqual(tool.inputSchema)
  expect(recovered.definition.recover.arguments.inputScope).toEqual(inputScope)
  expect(
    run.execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
})

it('keeps purpose discovery bounded with unrelated tools and preserves intentional inventory', async () => {
  const small = setup()
  const large = setup(10000)
  const args = { query: 'ready part' }
  const a = await small.call('describe_design_apis', args)
  const b = await large.call('describe_design_apis', args)

  const names = (tools: { name: string }[]) =>
    tools.map((tool) => tool.name).sort()

  expect(names(b.value.tools)).toEqual(names(a.value.tools))
  expect(large.deliveries).toHaveLength(small.deliveries.length)
  expect(
    b.value.tools.some(
      (tool: { name: string }) => tool.name === 'prepare_and_apply_design'
    )
  ).toBe(true)
  expect(
    b.value.tools.every(
      (tool: { namespace: string }) => tool.namespace !== 'unrelated'
    )
  ).toBe(true)
  const categories = (await large.call('describe_design_apis', {})).value
    .categories
  const native = categories.find(
    (entry: { count: number }) => entry.count > 10000
  )

  expect(native).toBeDefined()
  const inventory = await large.call('describe_design_apis', {
    category: native.category
  })

  expect(inventory.value.tools.length).toBeGreaterThan(0)
  expect(inventory.value.complete).toBe(false)
})

it('preserves canonical restrictions across selected representations and ordered recovery', async () => {
  const run = setup()
  const names = ['prepare_and_apply_design']
  const full = (await run.call('describe_design_apis', { names })).value
    .tools[0]
  const usage = (
    await run.call('describe_design_apis', {
      names,
      view: 'usage',
      includeResultSchema: true
    })
  ).value.tools[0]
  const cases = [...designPreparationExamples, orderedPreparation.input]

  for (const input of cases) {
    const nodeTypes = new Set<string>()
    const optionalInputs = new Set<string>()

    const visit = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(visit)
      } else if (value && typeof value === 'object') {
        const object = value as Record<string, unknown>

        if (usage.inputScopes.nodeTypes.includes(object.type)) {
          nodeTypes.add(String(object.type))
        }

        for (const key of usage.inputScopes.optionalInputs) {
          if (Object.hasOwn(object, key)) {
            optionalInputs.add(key)
          }
        }

        Object.values(object).forEach(visit)
      }
    }

    visit(input)
    const inputScope = {
      operation: 'parts' in input ? 'parts' : 'draft',
      nodeTypes: [...nodeTypes],
      optionalInputs: [...optionalInputs]
    }
    const selected = (
      await run.call('describe_design_apis', { names, inputScope })
    ).value.tools[0]

    expect(operationInputIssue(input, full.inputSchema)).toBeUndefined()
    expect(operationInputIssue(input, selected.inputSchema)).toBeUndefined()
    const invalid = { ...input, unexpected: true }

    expect(operationInputIssue(invalid, full.inputSchema)).toBeDefined()
    expect(operationInputIssue(invalid, selected.inputSchema)).toBeDefined()
    const refreshed = (
      await run.call(
        'describe_design_apis',
        selected.definition.refresh.arguments
      )
    ).value.tools[0]

    expect(refreshed.inputSchema).toEqual(selected.inputSchema)
  }

  for (const args of [
    { names, inputScope: { operation: 'missing', nodeTypes: ['vector'] } },
    { names, inputScope: { operation: 'draft', nodeTypes: ['missing'] } },
    {
      names,
      inputScope: { operation: 'draft', nodeTypes: ['vector', 'vector'] }
    },
    {
      names,
      inputScope: { operation: 'draft', nodeTypes: ['vector'] },
      schemaPaths: ['/properties/draft']
    },
    {
      names: ['prepare_design'],
      inputScope: { operation: 'draft', nodeTypes: ['vector'] }
    }
  ]) {
    expect((await run.call('describe_design_apis', args)).success).toBe(false)
  }

  expect(run.execute).not.toHaveBeenCalled()
})

it
  .runIf(Boolean(process.env.NATIVE_DELIVERY_CODEX))
  .each([
    { nodeTypes: ['group', 'projected-face', 'pattern'] },
    { nodeTypes: ['group', 'surface-grid'] }
  ])(
  'delivers the actual selected usage guide through native direct calls without truncation $nodeTypes',
  async ({ nodeTypes }) => {
    const run = setup()
    const inputScope = { operation: 'draft', nodeTypes }

    await run.call('describe_design_apis', {
      names: ['prepare_and_apply_design'],
      inputScope,
      view: 'usage',
      includeResultSchema: true
    })
    const definition = run.owners
      .flatMap((owner) => owner.definitions)
      .find((tool) => tool.name === 'describe_design_apis')

    if (!definition) {
      throw new Error('Missing discovery definition')
    }

    expect(definition.description).toContain('Each page is delivered directly')
    const namespace = 'design_operations'
    const executions = run.replies.map((page) => ({
      input: page.input,
      reply: page.raw,
      expected: page.raw
    }))
    const nativeModule = new URL(
      '../../test-data/knowledge-evaluation/native-delivery.mjs',
      import.meta.url
    ).href
    const { runNativeDelivery } = await import(/* @vite-ignore */ nativeModule)
    const result = await runNativeDelivery({
      mode: 'direct',
      executions,
      fixture: {
        tool: definition.name,
        namespace,
        input: run.replies[0].input,
        raw: run.replies[0].raw,
        sha256: createHash('sha256').update(run.replies[0].raw).digest('hex'),
        nativeVersion: 'codex-cli 0.160.0',
        kind: 'selected-operation-contract',
        declaration: {
          type: 'namespace',
          name: namespace,
          description: 'Actual discovery owner',
          tools: [
            {
              type: 'function',
              name: definition.name,
              description: definition.description,
              inputSchema: definition.inputSchema,
              deferLoading: true
            }
          ]
        }
      }
    })

    expect(result.nativeReplies).toBe(run.replies.length)
    for (const comparison of result.comparisons) {
      expect(comparison.exact, result.directory).toBe(true)
      expect(comparison.truncationMarker).toBe(false)
    }

    expect(result.cleanup.errors).toEqual([])
    expect(result.receipt.status).toBe('saved')
  },
  60000
)

it('uses the selected repair contract after a real preparation rejection without replay', async () => {
  const run = setup()
  const original = designPreparationExamples[0].draft
  const rejected = await run.call('prepare_and_apply_design', {
    draft: {
      ...original,
      children: [original.children[0], original.children[0]]
    },
    inspection: 'defer'
  })

  expect(rejected.success).toBe(false)
  expect(run.execute).not.toHaveBeenCalled()
  const names = ['prepare_and_apply_design']
  const inputScope = { operation: 'repair', nodeTypes: ['vector'] }
  const scoped = (await run.call('describe_design_apis', { names, inputScope }))
    .value.tools[0]
  const args = {
    repair: {
      draftId: rejected.value.draftId,
      replacements: [{ path: '/children/1/key', value: 'second-surface' }]
    },
    inspection: 'defer'
  }

  expect(operationInputIssue(args, scoped.inputSchema)).toBeUndefined()
  const repaired = await run.call('prepare_and_apply_design', args)

  expect(repaired.value.toolOutcome).toMatchObject({
    status: 'success',
    settlement: 'completed',
    issues: []
  })
  expect(repaired.success).toBe(true)
  expect(repaired.value.completedSteps).toEqual([
    'prepare_design',
    'apply_prepared_design'
  ])
  expect(
    run.execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
  const guide = (
    await run.call('describe_design_apis', {
      names,
      inputScope,
      view: 'usage',
      includeResultSchema: true
    })
  ).value.tools[0]

  expect(guide.usageGuide.recovery).toContain('Never replay completed writes')
  await run.call('describe_design_apis', guide.definition.recover.arguments)
  const expired = await run.call('prepare_and_apply_design', {
    repair: { ...args.repair, draftId: 'missing-retained-draft' },
    inspection: 'defer'
  })

  expect(expired.success).toBe(false)
  expect(
    run.execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
  await run.call('describe_design_apis', scoped.definition.recover.arguments)
  const cancellation = new AbortController()

  cancellation.abort()
  await expect(
    run.call('describe_design_apis', { names, inputScope }, cancellation.signal)
  ).rejects.toMatchObject({ name: 'AbortError' })
  expect(
    run.execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
})

it('preserves writes for a completed draft and a later invalid part without approval gates', async () => {
  const run = setup()
  const draft = {
    type: 'group',
    name: 'Editable part',
    children: designPreparationExamples[0].draft.children
  }
  const names = ['prepare_and_apply_design']

  for (const operation of ['draft', 'parts']) {
    const scoped = (
      await run.call('describe_design_apis', {
        names,
        inputScope: { operation, nodeTypes: ['vector'] }
      })
    ).value.tools[0]
    const args =
      operation === 'draft'
        ? { draft, inspection: 'defer' }
        : {
            parts: [
              { key: 'ready', draft },
              {
                key: 'invalid',
                draft: {
                  ...draft,
                  children: [...draft.children, ...draft.children]
                }
              }
            ],
            inspection: 'defer'
          }

    expect(operationInputIssue(args, scoped.inputSchema)).toBeUndefined()
    const reply = await run.call('prepare_and_apply_design', args)

    expect(reply.success).toBe(operation === 'draft')
    expect(reply.value.toolOutcome.status).toBe(
      operation === 'draft' ? 'success' : 'partial'
    )
    const guide = (
      await run.call('describe_design_apis', {
        names,
        inputScope: { operation, nodeTypes: ['vector'] },
        view: 'usage',
        includeResultSchema: true
      })
    ).value.tools[0]

    expect(guide.usageGuide.instructions).toContain(
      'partial preserves completed work'
    )
    await run.call('describe_design_apis', guide.definition.recover.arguments)
    await run.call('describe_design_apis', scoped.definition.recover.arguments)
  }

  expect(run.execute).toHaveBeenCalledTimes(2)
})

it('delivers and executes one selected usage guide without validation schema baggage', async () => {
  for (const nodeTypes of [
    ['vector'],
    ['group', 'projected-face', 'pattern']
  ]) {
    const run = setup()
    const names = ['prepare_and_apply_design']
    const inputScope = { operation: 'draft', nodeTypes }

    await run.call('describe_design_apis', {
      query: 'prepare_and_apply_design'
    })
    const baseline = setup()

    await baseline.call('describe_design_apis', {
      query: 'prepare_and_apply_design'
    })
    await baseline.call('describe_design_apis', { names, inputScope })
    const before = run.deliveries.length
    const reply = await run.call('describe_design_apis', {
      names,
      inputScope,
      view: 'usage'
    })

    expect(reply.success).toBe(true)
    process.stdout.write(
      JSON.stringify({
        measurement: 'guide-sections',
        nodeTypes,
        sections: Object.fromEntries(
          Object.entries(reply.value.tools[0]).map(([key, value]) => [
            key,
            Buffer.byteLength(JSON.stringify(value))
          ])
        )
      }) + '\n'
    )
    expect(run.deliveries.slice(before).every((bytes) => bytes <= 24000)).toBe(
      true
    )
    expect(run.deliveries.length).toBeLessThan(baseline.deliveries.length)
    expect(run.deliveries.reduce((sum, bytes) => sum + bytes, 0)).toBeLessThan(
      baseline.deliveries.reduce((sum, bytes) => sum + bytes, 0)
    )
    const machine = setup()
    const machineReply = await machine.call('describe_design_apis', {
      names,
      inputScope,
      view: 'usage',
      includeResultSchema: true
    })

    expect(reply.value.tools[0].usageGuide.parameters).toEqual(
      machineReply.value.tools[0].usageGuide.parameters
    )
    expect(Buffer.byteLength(JSON.stringify(reply.value))).toBeLessThan(
      Buffer.byteLength(JSON.stringify(machineReply.value)) * 0.85
    )
    process.stdout.write(
      JSON.stringify({
        measurement: 'default-versus-machine-draft',
        nodeTypes,
        defaultBytes: Buffer.byteLength(JSON.stringify(reply.value)),
        machineBytes: Buffer.byteLength(JSON.stringify(machineReply.value)),
        defaultCalls: run.deliveries.length - before,
        machineCalls: machine.deliveries.length
      }) + '\n'
    )
    const tool = reply.value.tools[0]

    expect(tool.definition.coverage).toBe('scoped-usage')
    expect(tool.inputSchema).toBeUndefined()
    expect(tool.outputSchema).toBeUndefined()
    expect(tool.partialOutputSchema).toBeUndefined()
    expect(tool.recoveryOutputSchema).toBeUndefined()
    expect(JSON.stringify(tool.usageGuide.parameters)).toContain('required')
    expect(JSON.stringify(tool.usageGuide.parameters)).toContain('100000')
    expect(tool.usageGuide.recovery).toContain('Never replay completed writes')
    expect(tool.description).not.toContain('without changing the canvas')
    const example = ownerInvocation(tool.invocationExample.invocation)

    expect(example.tool).toBe('prepare_and_apply_design')
    const full = (await run.call('describe_design_apis', { names, inputScope }))
      .value.tools[0]

    expect(
      operationInputIssue(example.arguments, full.inputSchema)
    ).toBeUndefined()
    const result = await run.call(example.tool, example.arguments)

    expect(result.value.toolOutcome.settlement).toBe('completed')
    expect(run.created.length).toBeGreaterThan(0)
    expect(
      run.execute.mock.calls.filter(([batch]) =>
        batch.actions.some((action) => action.name === 'apply_prepared_design')
      )
    ).toHaveLength(1)
    const created = structuredClone(run.created)
    const restored = await run.call(
      'describe_design_apis',
      tool.definition.recover.arguments
    )

    expect(restored.value.tools[0].usageGuide).toEqual(tool.usageGuide)
    expect(restored.value.tools[0].definition.recover.arguments.view).toBe(
      'usage'
    )
    expect(run.created).toEqual(created)
    expect(
      run.execute.mock.calls.filter(([batch]) =>
        batch.actions.some((action) => action.name === 'apply_prepared_design')
      )
    ).toHaveLength(1)
    process.stdout.write(
      JSON.stringify({
        measurement: 'selected-usage-guide',
        nodeTypes,
        bytes: run.deliveries[before],
        calls: 1
      }) + '\n'
    )
  }
})

it.each([
  { nodeTypes: ['group', 'projected-face', 'pattern'] },
  { nodeTypes: ['group', 'surface-grid'] }
])(
  'preserves every selected schema restriction and note in the delivered parameter reference $nodeTypes',
  async ({ nodeTypes }) => {
    const run = setup()
    const names = ['prepare_and_apply_design']
    const inputScope = { operation: 'draft', nodeTypes }
    const full = (await run.call('describe_design_apis', { names, inputScope }))
      .value.tools[0]
    const guide = (
      await run.call('describe_design_apis', {
        names,
        inputScope,
        view: 'usage',
        includeResultSchema: true
      })
    ).value.tools[0]
    const node = full.inputSchema.$defs.node.anyOf.find(
      (entry: { properties?: { type?: { enum?: string[] } } }) =>
        entry.properties?.type?.enum
    )

    expect(
      node.anyOf.every((entry: { properties: { type: { const: string } } }) =>
        nodeTypes.includes(entry.properties.type.const)
      )
    ).toBe(true)
    expect(node.properties).not.toHaveProperty('fontFamily')
    const delivered = guide.usageGuide.parameters

    expect(typeof delivered).toBe('object')
    // Resolve only generated factoring references. Canonical recursive references
    // stay intact, so this comparison proves every restriction and description.
    const canonicalDefinitions = full.inputSchema.$defs ?? {}
    const definitions = delivered.$defs ?? {}

    const expand = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        return value.map(expand)
      }

      if (!value || typeof value !== 'object') {
        return value
      }

      const object = value as Record<string, unknown>

      if (
        typeof object.$ref === 'string' &&
        object.$ref.startsWith('#/$defs/')
      ) {
        const key = object.$ref.slice(8)

        if (!Object.hasOwn(canonicalDefinitions, key)) {
          return expand(definitions[key])
        }
      }

      return Object.fromEntries(
        Object.entries(object)
          .filter(([key]) => key !== 'examples')
          .map(([key, child]) => [key, expand(child)])
      )
    }

    const expanded = expand({
      ...delivered,
      $defs: Object.fromEntries(
        Object.keys(canonicalDefinitions).map((key) => [key, definitions[key]])
      )
    })

    expect(expanded).toEqual(expand(full.inputSchema))
    const example = ownerInvocation(
      guide.invocationExample.invocation
    ).arguments

    for (const args of [
      { ...example, repair: {} },
      { ...example, parts: [] },
      { ...example, plan: {} }
    ]) {
      expect(operationInputIssue(args, full.inputSchema)).toBeDefined()
      expect(operationInputIssue(args, delivered)).toBeDefined()
    }

    expect(operationInputIssue(example, delivered)).toBeUndefined()
    const invalid = await run.call('prepare_and_apply_design', {
      ...example,
      repair: {}
    })

    expect(invalid.success).toBe(false)
    expect(run.execute).not.toHaveBeenCalled()
    const cancelled = new AbortController()

    cancelled.abort()
    await expect(
      run.call('prepare_and_apply_design', example, cancelled.signal)
    ).rejects.toThrow()
    expect(run.execute).not.toHaveBeenCalled()
  }
)

it('bounds selected usage delivery under unrelated catalog growth and exposes explicit full retrieval', async () => {
  const small = setup()
  const large = setup(10000)
  const args = {
    names: ['prepare_and_apply_design'],
    inputScope: { operation: 'draft', nodeTypes: ['vector'] },
    view: 'usage',
    includeResultSchema: true
  }
  const a = await small.call('describe_design_apis', args)
  const b = await large.call('describe_design_apis', args)

  expect(b.value.resultKey).toEqual(expect.any(String))
  expect(a.value.resultKey).toEqual(expect.any(String))
  expect(b.value.resultKey).not.toBe(a.value.resultKey)
  expect({ ...b.value, resultKey: a.value.resultKey }).toEqual(a.value)
  expect(large.deliveries).toEqual(small.deliveries)
  // Necessary failure evidence may paginate; unrelated catalog entries must not
  // change a single byte or continuation, and the transport budget is unchanged.
  expect(large.deliveries.every((bytes) => bytes <= 24000)).toBe(true)
  const complete = await large.call('describe_design_apis', {
    names: args.names
  })

  expect(complete.value.tools[0].inputSchema.properties.plan).toBeUndefined()
  expect(complete.value.tools[0].outputSchema).toBeDefined()
  expect(large.execute).not.toHaveBeenCalled()
})

it('rejects recorded foreign inspection fields and executes each narrower recovery without writes', async () => {
  const { call, execute, owners } = setup()
  const definition = owners
    .flatMap((owner) => owner.definitions)
    .find((d) => d.name === 'describe_design_apis')

  if (!definition) {
    throw new Error('Missing discovery definition')
  }

  const failed = await call('describe_design_apis', inspectionDiscovery.query)

  expect(failed.value.tools).toHaveLength(2)
  expect(
    failed.value.tools.every(
      (t: { definition: { coverage: string } }) =>
        t.definition.coverage === 'none'
    )
  ).toBe(true)
  expect(failed.success).toBe(false)
  expect(definition.description).toContain('same schemaPaths list')
  expect(definition.description).toContain('independent per-tool queries')
  expect(failed.value.toolOutcome).toMatchObject({
    status: 'failed',
    settlement: 'completed'
  })
  expect(failed.value.toolOutcome.issues.length).toBeGreaterThan(0)
  const expectedPaths: Record<string, string[]> = {
    inspect_drawing: ['/properties/arguments'],
    record_design_facts: ['/properties/facts']
  }

  for (const tool of failed.value.tools) {
    const paths = expectedPaths[tool.name]

    expect(paths).toBeDefined()
    expect(tool.definition.recover.arguments.schemaPaths).toEqual(paths)
    expect(
      tool.schemaResolution.issues.map((issue: { path: string }) => issue.path)
    ).toEqual(
      inspectionDiscovery.query.schemaPaths
        .filter((path) => !paths.includes(path))
        .sort()
    )
    const narrowed = tool.schemaResolution.narrowerQuery

    expect(tool.definition.recover).toEqual(narrowed)
    expect(narrowed.arguments.names).toHaveLength(1)
    // Follow the primary delivered correction, not a test-authored replacement.
    const corrected = await call(
      tool.definition.recover.tool,
      tool.definition.recover.arguments
    )

    expect(corrected.success).toBe(true)
    expect(corrected.value.tools[0].definition.coverage).toBe('partial')
    expect(
      corrected.value.tools[0].schemaFragments.map(
        (f: { path: string }) => f.path
      )
    ).toEqual(narrowed.arguments.schemaPaths)
    const canonical = owners
      .flatMap((owner) => owner.definitions)
      .find((entry) => entry.name === tool.name)

    if (!canonical) {
      throw new Error('Missing selected canonical owner')
    }

    for (const fragment of corrected.value.tools[0].schemaFragments) {
      const field = fragment.path.split('/').at(-1)

      expect(fragment.schema).toEqual(canonical.inputSchema.properties[field])
    }

    expect(corrected.value.tools[0].schemaContext.length).toBeGreaterThan(0)
    const recovery = corrected.value.tools[0].definition.recover

    expect(recovery.arguments.schemaPaths).toEqual(paths)
    const refreshed = await call(recovery.tool, recovery.arguments)

    expect(refreshed.success).toBe(true)
    expect(refreshed.value.tools[0].schemaFragments).toEqual(
      corrected.value.tools[0].schemaFragments
    )
    expect(tool.definition.coverage).toBe('none')
  }

  const repeated = await call('describe_design_apis', inspectionDiscovery.query)

  expect(repeated.value.toolOutcome.status).toBe('failed')
  expect(execute).not.toHaveBeenCalled()
})

it('distinguishes mixed exact coverage from successful shared paths and empty discovery', async () => {
  const { call, execute } = setup()
  const names = ['design.inspect_drawing', 'prepare_and_apply_design']
  const mixed = await call('describe_design_apis', {
    names,
    schemaPaths: ['/properties/arguments']
  })

  expect(mixed.success).toBe(false)
  // Outcome belongs to the actual invocation envelope, including paged results.
  expect(JSON.parse(mixed.text).toolOutcome).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(mixed.value.tools[0].schemaFragments[0].path).toBe(
    '/properties/arguments'
  )
  expect(mixed.value.tools[1].definition.coverage).toBe('none')
  const shared = await call('describe_design_apis', {
    names,
    schemaPaths: ['/properties/inspection']
  })

  expect(shared.success, shared.text).toBe(true)
  expect(
    shared.value.tools.every(
      (t: { definition: { coverage: string } }) =>
        t.definition.coverage === 'partial'
    )
  ).toBe(true)
  for (const args of [
    { names: [] },
    { query: 'no lexical capability match xyz' },
    {}
  ]) {
    expect((await call('describe_design_apis', args)).success).toBe(true)
  }

  expect(
    (await call('describe_design_apis', { names: ['missing-tool'] })).value
      .toolOutcome.status
  ).toBe('failed')
  expect(
    JSON.parse(
      (
        await call('describe_design_apis', {
          names: ['design.inspect_drawing', 'missing-tool'],
          view: 'usage',
          includeResultSchema: true
        })
      ).text
    ).toolOutcome.status
  ).toBe('partial')
  await expect(
    call('describe_design_apis', { names }, AbortSignal.abort())
  ).rejects.toThrow()
  expect(execute).not.toHaveBeenCalled()
})

it('delivers paged partial discovery directly without promoting coverage or replaying writes', async () => {
  const { owners, call, execute } = setup()
  const usage = (
    await call('describe_design_apis', {
      names: ['prepare_and_apply_design'],
      view: 'usage',
      includeResultSchema: true,
      inputScope: { operation: 'draft', nodeTypes: ['vector'] }
    })
  ).value.tools[0]

  await call(
    ownerInvocation(usage.invocationExample.invocation).tool,
    ownerInvocation(usage.invocationExample.invocation).arguments
  )
  const writes = execute.mock.calls.length
  const owner = owners.find((o) =>
    o.definitions.some((d) => d.name === 'describe_design_apis')
  )

  if (!owner) {
    throw new Error('Missing discovery owner')
  }

  const definition = owner.definitions.find(
    (d) => d.name === 'describe_design_apis'
  )

  if (!definition) {
    throw new Error('Missing discovery definition')
  }

  expect(definition.description).toContain('Each page is delivered directly')
  const fragments: string[] = []
  let args: Record<string, unknown> = {
    names: ['prepare_and_apply_design', 'missing-tool']
  }
  let pages = 0

  for (; pages < 30; pages++) {
    const reply = await invokeLocalTool(
      owner,
      definition,
      args,
      new AbortController().signal
    )
    const receipt = JSON.parse(reply.text)

    expect(reply.success).toBe(false)
    expect(receipt.toolOutcome).toMatchObject({
      status: 'partial',
      settlement: 'completed'
    })
    expect(Buffer.byteLength(reply.text)).toBeLessThanOrEqual(24000)
    fragments.push(receipt.contentDelivery?.text ?? reply.text)
    if (!receipt.contentDelivery || receipt.contentDelivery.lastPage) {
      break
    }

    args = receipt.contentDelivery.next.arguments
  }

  expect(pages).toBeGreaterThan(0)
  expect(pages).toBeLessThan(30)
  expect(JSON.parse(fragments.join(''))).toMatchObject({
    status: 'partial',
    missingNames: ['missing-tool']
  })
  const refresh = await call('describe_design_apis', {
    names: ['design.inspect_drawing'],
    schemaPaths: ['/properties/inspection'],
    refresh: true,
    refreshReason: 'delivery-failure'
  })

  expect(refresh.success, refresh.text).toBe(true)
  expect(execute).toHaveBeenCalledTimes(writes)
})

it('keeps purpose menus compact and gives representation choices on exact navigation', async () => {
  for (const input of [
    operationSelection.query,
    { query: 'ready part' },
    {
      names: ['prepare_and_apply_design'],
      view: 'usage',
      includeResultSchema: true
    }
  ]) {
    const run = setup()
    const reply = await run.call('describe_design_apis', input)
    let tool = reply.value.tools.find(
      (entry: { name: string }) => entry.name === 'prepare_and_apply_design'
    )

    if ('query' in input && !tool.inputScopes?.selection) {
      expect(tool.usage.arguments.names).toEqual([
        'design.prepare_and_apply_design'
      ])
      tool = (await run.call(tool.usage.tool, tool.usage.arguments)).value
        .tools[0]
    }

    expect(tool.inputScopes.selection).toEqual(expect.any(String))
    expect(tool.inputScopes.selection).toContain('next submitted part')
    expect(tool.inputScopes.selection).toContain('root group/frame')
    expect(tool.inputScopes.selection).toContain('nodeTypes selects children')
    expect(tool.inputScopes.selection).toContain(
      'Omit unused optional inputs without rereading'
    )
    expect(tool.inputScopes.selection).toContain('projected-face')
    expect(tool.inputScopes.selection.toLowerCase()).toContain('translation')
    expect(tool.inputScopes.selection).toContain('four-corner')
    expect(tool.inputScopes.selection).toContain('surface-grid')
    expect(tool.inputScopes.selection).toContain('No Knowledge')
    expect(run.deliveries.length).toBeLessThanOrEqual(2)
    expect(tool.inputSchema).toBeUndefined()
    expect(tool.outputSchema).toBeUndefined()
    expect(tool.outputFields).toBeUndefined()
    expect(run.compile).not.toHaveBeenCalled()
    expect(run.execute).not.toHaveBeenCalled()
  }
})

it('selects complete next-part guides in two replies without unrelated catalog growth', async () => {
  for (const nodeTypes of [
    ['group', 'projected-face'],
    ['group', 'surface-grid'],
    operationSelection.selectedScope.nodeTypes
  ]) {
    const small = setup()
    const large = setup(10000)

    for (const run of [small, large]) {
      await run.call('describe_design_apis', operationSelection.query)
      const reply = await run.call('describe_design_apis', {
        names: ['prepare_and_apply_design'],
        view: 'usage',
        includeResultSchema: true,
        inputScope: { operation: 'draft', nodeTypes }
      })

      expect(run.calls).toHaveLength(2)
      expect(run.deliveries.every((bytes) => bytes <= 24000)).toBe(true)
      expect(Buffer.byteLength(JSON.stringify(reply.value))).toBeLessThan(
        operationSelection.firstQueryBytes +
          completeUsageBudget(operationSelection.selectedGuideBytes, 'draft')
      )
      const guide = reply.value.tools[0]

      expect(ownerInvocation(guide.invocationExample.invocation)).toBeDefined()
      expect(guide.usageGuide.instructions).toContain(
        'partial preserves completed work'
      )
      expect(guide.usageGuide.recovery).toContain(
        'Never replay completed writes'
      )
    }

    expect(large.deliveries).toEqual(small.deliveries)
    process.stdout.write(
      JSON.stringify({
        measurement: 'next-part-first-use',
        nodeTypes,
        calls: small.deliveries.length,
        bytes: small.deliveries.reduce((n, b) => n + b, 0),
        replies: small.deliveries
      }) + '\n'
    )
  }
})

it.each([false, true])(
  'executes published grid example with ready-part continuation=%s and no replay',
  async (continuePart) => {
    const run = setup()
    const names = ['prepare_and_apply_design']
    let parentId: string | undefined

    if (continuePart) {
      const first = ownerInvocation(
        (
          await run.call('describe_design_apis', {
            names,
            view: 'usage',
            includeResultSchema: true,
            inputScope: {
              operation: 'draft',
              nodeTypes: ['group', 'projected-face']
            }
          })
        ).value.tools[0].invocationExample.invocation
      )
      const result = await run.call(first.tool, {
        ...first.arguments,
        inspection: 'defer'
      })

      parentId = result.value.actionResults[0].result.compositionId
      expect(parentId).toEqual(expect.any(String))
      expect(run.created.length).toBeGreaterThan(0)
    }

    const before = structuredClone(run.created)
    const scope = { operation: 'draft', nodeTypes: ['group', 'surface-grid'] }
    const guide = (
      await run.call('describe_design_apis', {
        names,
        view: 'usage',
        includeResultSchema: true,
        inputScope: scope
      })
    ).value.tools[0]

    expect(ownerInvocation(guide.invocationExample.invocation)).toBeDefined()
    const example = ownerInvocation(guide.invocationExample.invocation)

    expect(
      example.arguments.draft.children.some(
        (n: { type: string }) => n.type === 'surface-grid'
      )
    ).toBe(true)
    const full = (
      await run.call('describe_design_apis', { names, inputScope: scope })
    ).value.tools[0]
    const args = {
      ...example.arguments,
      ...(parentId ? { parentId } : {}),
      inspection: 'defer'
    }

    expect(operationInputIssue(args, full.inputSchema)).toBeUndefined()
    const invalid = structuredClone(args)

    invalid.draft.children[0].rows = 0
    expect(operationInputIssue(invalid, full.inputSchema)).toBeDefined()
    const count = run.execute.mock.calls.length

    expect((await run.call(example.tool, invalid)).success).toBe(false)
    expect(run.execute).toHaveBeenCalledTimes(count)
    const result = await run.call(example.tool, args)

    expect(result.value.toolOutcome).toMatchObject({
      status: 'success',
      settlement: 'completed'
    })
    expect(result.value.completedSteps).toEqual([
      'prepare_design',
      'apply_prepared_design'
    ])
    expect(run.created.slice(0, before.length)).toEqual(before)
    expect(run.created.length).toBeGreaterThan(before.length)
    if (parentId) {
      expect(
        run.created
          .slice(before.length)
          .some((n) => run.parents.get(n.id) === parentId)
      ).toBe(true)
    }

    const after = structuredClone(run.created)

    for (const input of [
      guide.definition.recover.arguments,
      guide.definition.refresh.arguments
    ]) {
      await run.call('describe_design_apis', input)
    }

    expect(run.execute).toHaveBeenCalledTimes(count + 1)
    expect(run.created).toEqual(after)
  }
)

it.each(['group', 'frame'])(
  'uses delivered child contracts with a %s root and omitted optional plan without rereading',
  async (rootType) => {
    const run = setup()
    const guide = (
      await run.call('describe_design_apis', {
        names: ['prepare_and_apply_design'],
        view: 'usage',
        includeResultSchema: true,
        inputScope: {
          operation: 'draft',
          nodeTypes: ['surface-grid'],
          optionalInputs: []
        }
      })
    ).value.tools[0]

    expect(guide.usageGuide.instructions).toContain('root group/frame')
    expect(guide.usageGuide.instructions).toContain(
      'nodeTypes selects children'
    )
    expect(guide.usageGuide.selection).toContain('does not require sending')
    expect(guide.usageGuide.selection).toContain('without rereading')
    const invocation = ownerInvocation(guide.invocationExample.invocation)
    const args = structuredClone(invocation.arguments)

    args.draft.type = rootType
    if (rootType === 'frame') {
      Object.assign(args.draft, { width: 100, height: 100 })
    }

    args.inspection = 'defer'
    expect(args.plan).toBeUndefined()
    const result = await run.call(invocation.tool, args)

    expect(result.value.toolOutcome).toMatchObject({
      status: 'success',
      settlement: 'completed'
    })
    expect(result.value.actionResults[0].result.status).toBe('complete')
    const rootId = result.value.actionResults[0].result.compositionId

    expect(run.created.find((entry) => entry.id === rootId)?.type).toBe(
      rootType
    )
    expect(
      run.execute.mock.calls.filter(([batch]) =>
        batch.actions.some((action) => action.name === 'apply_prepared_design')
      )
    ).toHaveLength(1)
    expect(
      run.calls.filter((name) => name === 'describe_design_apis')
    ).toHaveLength(1)
    const saved = structuredClone(run.created)

    await run.call('describe_design_apis', guide.definition.refresh.arguments)
    expect(run.created).toEqual(saved)
    expect(
      run.execute.mock.calls.filter(([batch]) =>
        batch.actions.some((action) => action.name === 'apply_prepared_design')
      )
    ).toHaveLength(1)
  }
)

it('keeps root and nested frame constraints distinct from optional plan documentation', async () => {
  const run = setup()
  const names = ['prepare_and_apply_design']
  const inputScope = {
    operation: 'draft',
    nodeTypes: ['group', 'projected-face'],
    optionalInputs: []
  }
  const first = (await run.call('describe_design_apis', { names, inputScope }))
    .value.tools[0]
  const usage = (
    await run.call('describe_design_apis', {
      names,
      inputScope,
      view: 'usage',
      includeResultSchema: true
    })
  ).value.tools[0]
  const args = structuredClone(
    ownerInvocation(usage.invocationExample.invocation).arguments
  )

  Object.assign(args.draft, { type: 'frame', width: 100, height: 100 })
  expect(operationInputIssue(args, first.inputSchema)).toBeUndefined()
  const missingHeight = structuredClone(args)

  delete missingHeight.draft.height
  expect(operationInputIssue(missingHeight, first.inputSchema)).toBeDefined()
  const sizedGroup = structuredClone(args)

  sizedGroup.draft.type = 'group'
  expect(operationInputIssue(sizedGroup, first.inputSchema)).toBeDefined()
  const invalidPlan = { ...args, plan: {} }

  expect(operationInputIssue(invalidPlan, first.inputSchema)).toBeDefined()
  for (const invalid of [missingHeight, sizedGroup, invalidPlan]) {
    expect((await run.call('prepare_and_apply_design', invalid)).success).toBe(
      false
    )
  }

  expect(run.execute).not.toHaveBeenCalled()
  args.draft.children.push({
    key: 'container',
    name: 'Nested container',
    type: 'frame',
    width: 10,
    height: 10,
    children: []
  })
  expect(operationInputIssue(args, first.inputSchema)).toBeDefined()
  const expanded = (
    await run.call('describe_design_apis', {
      names,
      inputScope: {
        ...inputScope,
        nodeTypes: [...inputScope.nodeTypes, 'frame']
      }
    })
  ).value.tools[0]

  expect(operationInputIssue(args, expanded.inputSchema)).toBeUndefined()
  const result = await run.call('prepare_and_apply_design', {
    ...args,
    inspection: 'defer'
  })

  expect(result.value.toolOutcome).toMatchObject({
    status: 'success',
    settlement: 'completed'
  })
  expect(run.created.filter((entry) => entry.type === 'frame')).toHaveLength(2)
  expect(
    run.execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
})

it('delivers the recorded exact query without descriptive matches or catalog growth', async () => {
  const small = setup()
  const large = setup(10000, 'Related capability for prepare_and_apply_design')

  for (const run of [small, large]) {
    const reply = await run.call(
      'describe_design_apis',
      operationSelection.query
    )

    expect(reply.success).toBe(true)
    expect(
      reply.value.tools.map((tool: { name: string }) => tool.name)
    ).toEqual(['prepare_and_apply_design'])
    expect(reply.value.apis).toEqual([])
    expect(run.deliveries).toHaveLength(1)
    // The executable host route includes its qualified operation identity.
    expect(run.deliveries[0]).toBeLessThan(5200)
    const guide = reply.value.tools[0]

    expect(guide.inputScopes.selection).toContain('nodeTypes selects children')
    const invocation = ownerInvocation(guide.invocationExample.invocation)
    const result = await run.call(invocation.tool, {
      ...invocation.arguments,
      inspection: 'defer'
    })

    expect(result.value.toolOutcome).toMatchObject({
      status: 'success',
      settlement: 'completed'
    })
    expect(run.created.length).toBeGreaterThan(0)
    const saved = structuredClone(run.created)

    await run.call('describe_design_apis', {
      ...operationSelection.query,
      refresh: true,
      refreshReason: 'delivery-failure'
    })
    expect(run.created).toEqual(saved)
    expect(
      run.execute.mock.calls.filter(([batch]) =>
        batch.actions.some((action) => action.name === 'apply_prepared_design')
      )
    ).toHaveLength(1)
  }

  expect(large.deliveries[0]).toBe(small.deliveries[0])
  process.stdout.write(
    JSON.stringify({
      measurement: 'exact-query',
      bytes: small.deliveries[0],
      calls: 1,
      relatedTools: 10000
    }) + '\n'
  )
  const explore = await large.call('describe_design_apis', {
    query: 'Related capability'
  })
  const baselineExplore = await small.call('describe_design_apis', {
    query: 'Related capability'
  })

  expect(explore.value.count).toBe(baselineExplore.value.count + 10000)
  expect(explore.value.tools).toHaveLength(16)
  const next = await large.call(
    'describe_design_apis',
    explore.value.next.arguments
  )

  expect(next.value.offset).toBe(16)
  expect(next.value.tools[0].name).not.toBe(explore.value.tools[0].name)
  const category = await large.call('describe_design_apis', {
    category: 'tools'
  })

  expect(category.value.count).toBeGreaterThan(10000)
  expect(category.value.next).toBeDefined()
})

it('preserves exact query representations, full constraints and bounded recovery', async () => {
  const run = setup()
  const name = 'prepare_and_apply_design'
  const menu = await run.call('describe_design_apis', { query: name })

  expect(menu.value.tools).toHaveLength(1)
  expect(menu.value.tools[0].inputSchema).toBeUndefined()
  const full = (
    await run.call('describe_design_apis', {
      query: 'design.' + name,
      view: 'full'
    })
  ).value.tools[0]
  const exact = (await run.call('describe_design_apis', { names: [name] }))
    .value.tools[0]

  for (const key of [
    'inputSchema',
    'outputSchema',
    'partialOutputSchema',
    'recoveryOutputSchema',
    'execution'
  ]) {
    expect(full[key]).toEqual(exact[key])
  }

  const repeated = await run.call('describe_design_apis', {
    query: '  ' + name + '  ',
    view: 'usage',
    includeResultSchema: true
  })

  expect(repeated.value.tools).toHaveLength(1)
  expect(
    (await run.call('describe_design_apis', { query: name, offset: 1 })).success
  ).toBe(false)
  expect(
    (
      await run.call('describe_design_apis', {
        query: name,
        registryRevision: -1
      })
    ).success
  ).toBe(false)
  expect(
    (
      await run.call('describe_design_apis', {
        query: name,
        registryRevision: 99999
      })
    ).success
  ).toBe(false)
  const controller = new AbortController()

  controller.abort()
  await expect(
    run.call('describe_design_apis', { query: name }, controller.signal)
  ).rejects.toThrow()
  expect(run.execute).not.toHaveBeenCalled()
})

it.each(exactQueryScope.calls)(
  'executes saved exact query scope $runId without a corrective lookup or replay',
  async ({ input }) => {
    const baseline = setup()
    const { query, ...options } = input
    const expected = await baseline.call('describe_design_apis', {
      names: [query],
      ...options
    })

    process.stdout.write(
      JSON.stringify({
        measurement: 'exact-query-scope',
        nodeTypes: input.inputScope.nodeTypes,
        replyBytes: baseline.deliveries[0],
        replies: baseline.deliveries.length
      }) + '\n'
    )
    for (const run of [setup(), setup(10000, `Related to ${query}`)]) {
      const reply = await run.call('describe_design_apis', input)

      expect(reply.success).toBe(true)
      expect(reply.value.tools).toEqual(expected.value.tools)
      // The selected contract is identical; continuation arguments can differ by query spelling.
      expect(run.deliveries).toHaveLength(baseline.deliveries.length)
      expect(run.deliveries.every((bytes) => bytes <= 24000)).toBe(true)
      const guide = reply.value.tools[0]
      const invocation = ownerInvocation(guide.invocationExample.invocation)
      const applied = await run.call(invocation.tool, invocation.arguments)

      expect(applied.value.completedSteps).toContain('apply_prepared_design')
      expect(applied.value.toolOutcome).toMatchObject({
        status: 'success',
        settlement: 'completed'
      })
      expect(applied.value.actionResults[0].result.status).toBe('complete')
      expect(run.created.length).toBeGreaterThan(0)
      const saved = structuredClone(run.created)
      const restored = await run.call(
        guide.definition.recover.tool,
        guide.definition.recover.arguments
      )

      expect(restored.value.tools[0].usageGuide).toEqual(guide.usageGuide)
      expect(restored.value.tools[0].definition.inputScope).toEqual(
        input.inputScope
      )
      await run.call('describe_design_apis', input)
      const retained = await run.call('describe_design_apis', {
        fromResult: reply.value.resultKey,
        names: [query]
      })

      expect(retained.success).toBe(true)
      expect(retained.value.tools[0].usageGuide).toEqual(guide.usageGuide)
      expect(run.created).toEqual(saved)
      expect(
        run.execute.mock.calls.filter(([batch]) =>
          batch.actions.some(
            (action) => action.name === 'apply_prepared_design'
          )
        )
      ).toHaveLength(1)
      expect(run.compile).toHaveBeenCalledOnce()
    }
  }
)

it('preserves full exact query scope constraints, paging, refresh and invalidation', async () => {
  const run = setup()
  const { query, inputScope } = exactQueryScope.calls[0].input
  const names = [query]
  const expected = await run.call('describe_design_apis', { names, inputScope })

  for (const selection of [query, `design.${query}`, `  ${query}  `]) {
    const input = { query: selection, inputScope }
    const start = run.replies.length
    const full = await run.call('describe_design_apis', input)

    expect(full.success).toBe(true)
    expect(full.value.tools).toEqual(expected.value.tools)
    expect(full.value.tools[0].definition.coverage).toBe('scoped')
    const pages = run.replies.slice(start)

    expect(pages.length).toBeGreaterThan(1)
    for (const page of pages) {
      const value = JSON.parse(page.raw)

      if (value.contentDelivery.next) {
        expect(value.contentDelivery.next.arguments).toMatchObject(input)
      }
    }

    const refreshed = await run.call('describe_design_apis', {
      ...input,
      refresh: true,
      refreshReason: 'delivery-failure'
    })

    expect(refreshed.value.tools[0].inputSchema).toEqual(
      expected.value.tools[0].inputSchema
    )
  }

  for (const extra of [
    { offset: 1 },
    { registryRevision: 99999 },
    { schemaPaths: ['/properties/draft'] },
    { contentPage: { revision: 'stale', offset: 1 } }
  ]) {
    const reply = await run.call('describe_design_apis', {
      query,
      inputScope,
      ...extra
    })

    expect(reply.success).toBe(false)
  }

  const controller = new AbortController()

  controller.abort()
  await expect(
    run.call('describe_design_apis', { query, inputScope }, controller.signal)
  ).rejects.toThrow()
  expect(run.execute).not.toHaveBeenCalled()
})

it('keeps fuzzy query scope rejected and recovers invalid exact scope from owner choices', async () => {
  const run = setup(2, 'Related construction')
  const { input } = exactQueryScope.calls[0]
  const fuzzy = await run.call('describe_design_apis', {
    ...input,
    query: 'Related construction'
  })

  expect(fuzzy.success).toBe(false)
  expect(fuzzy.value.message).toContain('inputScope')
  expect(fuzzy.value.message).toContain('Omit inputScope')
  const search = await run.call('describe_design_apis', {
    query: 'Related construction'
  })

  expect(search.success).toBe(true)
  expect(search.value.count).toBeGreaterThanOrEqual(2)
  const bad = await run.call('describe_design_apis', {
    ...input,
    inputScope: { operation: 'create', nodeTypes: ['pattern'] }
  })

  expect(bad.success).toBe(false)
  const correction = JSON.parse(bad.value.message.split('Scope guidance: ')[1])
  const corrected = await run.call(
    correction.example.tool,
    correction.example.arguments
  )

  expect(corrected.success).toBe(true)
  expect(
    ownerInvocation(corrected.value.tools[0].invocationExample.invocation)
  ).toBeDefined()
  const actionOwner = createLocalOperationTools(
    [
      {
        name: AiActionNames.APPLY_PREPARED_DESIGN,
        description: 'Apply',
        inputSchema: {}
      }
    ],
    {
      modelActions: (actions) => actions,

      resolveBatch: (actions) => actions
    },
    vi.fn(),
    { getNativeTools: () => [] }
  )
  const actionDefinition = actionOwner.definitions.find(
    (item) => item.name === 'describe_design_apis'
  )

  if (!actionDefinition) {
    throw new Error('Missing discovery definition')
  }

  const actionOnly = await invokeLocalTool(
    actionOwner,
    actionDefinition,
    {
      query: AiActionNames.APPLY_PREPARED_DESIGN,
      inputScope: input.inputScope
    },
    new AbortController().signal
  )

  expect(actionOnly.success).toBe(false)
  expect(JSON.parse(actionOnly.text).message).toContain('native tool')
  expect(run.execute).not.toHaveBeenCalled()
})

it('preserves scoped exact query ambiguity and qualified recovery without selecting a namespace', async () => {
  const run = setup()
  const { input } = exactQueryScope.calls[0]
  const main = run.owners
    .flatMap((owner) => owner.definitions)
    .find((definition) => definition.name === input.query)

  if (!main) {
    throw new Error('Missing workflow definition')
  }

  const owner = createLocalOperationTools(
    [
      {
        name: AiActionNames.APPLY_PREPARED_DESIGN,
        description: 'Apply',
        inputSchema: {}
      }
    ],
    {
      modelActions: (actions) => actions,

      resolveBatch: (actions) => actions
    },
    vi.fn(),
    {
      getNativeTools: () =>
        ['first', 'second'].map((namespace) => ({ ...main, namespace }))
    }
  )
  const definition = owner.definitions.find(
    (item) => item.name === 'describe_design_apis'
  )

  if (!definition) {
    throw new Error('Missing discovery definition')
  }

  for (const selector of [{ query: input.query }, { names: [input.query] }]) {
    const reply = await invokeLocalTool(
      owner,
      definition,
      {
        ...selector,
        view: 'usage',
        includeResultSchema: true,
        inputScope: input.inputScope
      },
      new AbortController().signal
    )
    const value = JSON.parse(reply.text)

    expect(reply.success).toBe(false)
    expect(value.tools, reply.text).toEqual([])
    expect(value.ambiguousNames).toEqual([
      {
        name: input.query,
        candidates: [`first.${input.query}`, `second.${input.query}`]
      }
    ])
    const recovered = await readCompleteInformation(
      async (arguments_) => {
        const result = await invokeLocalTool(
          owner,
          definition,
          arguments_,
          new AbortController().signal
        )

        expect(result.success).toBe(true)

        return result.text
      },
      {
        query: value.ambiguousNames[0].candidates[0],
        view: 'usage',
        includeResultSchema: true,
        inputScope: input.inputScope
      }
    )
    const guide = JSON.parse(recovered).tools[0]

    expect(guide.namespace).toBe('first')
    expect(guide.definition.inputScope).toEqual(input.inputScope)
  }

  expect(run.execute).not.toHaveBeenCalled()
})

it('recovers the recorded invalid query scope from owner choices without a menu or replay', async () => {
  const run = setup()
  const rejected = await run.call(
    'describe_design_apis',
    invalidQueryScope.input
  )

  expect(rejected.success).toBe(false)
  expect(rejected.value.toolOutcome).toMatchObject({
    status: 'failed',
    settlement: 'not-started'
  })
  expect(rejected.value.message).toContain('operation')
  const marker = 'Scope guidance: '

  expect(rejected.value.message).toContain(marker)
  const guidance = JSON.parse(rejected.value.message.split(marker)[1])

  expect(guidance.inputScopes.operations).toEqual(['draft', 'repair', 'parts'])
  const ready = await run.call(
    guidance.example.tool,
    guidance.example.arguments
  )

  expect(ready.success).toBe(true)
  const invocation = ownerInvocation(
    ready.value.tools[0].invocationExample.invocation
  )

  expect(invocation).toBeDefined()
  expect(run.execute).not.toHaveBeenCalled()
  const applied = await run.call(invocation.tool, {
    ...invocation.arguments,
    inspection: 'defer'
  })

  expect(applied.value.toolOutcome).toMatchObject({
    status: 'success',
    settlement: 'completed'
  })
  expect(applied.value.completedSteps).toContain('apply_prepared_design')

  expect(run.created.length).toBeGreaterThan(0)
  const writes = run.execute.mock.calls.length

  await run.call(guidance.example.tool, {
    ...guidance.example.arguments,
    refresh: true,
    refreshReason: 'delivery-failure'
  })
  expect(run.execute).toHaveBeenCalledTimes(writes)
})

it('keeps first-query scope guidance owner-derived and independent of unrelated tools', async () => {
  const small = setup()
  const large = setup(10000)

  const guidance = (run: ReturnType<typeof setup>) => {
    const definition = run.owners
      .flatMap((owner) => owner.definitions)
      .find((item) => item.name === 'prepare_and_apply_design')

    if (!definition) {
      throw new Error('Missing main tool')
    }

    const value = workflowQueryGuidance(definition.name, definition.inputSchema)

    if (!value) {
      throw new Error('Missing scope guidance')
    }

    return value
  }

  const original = guidance(small)

  expect(guidance(large)).toEqual(original)
  const { selection, ...choicesWithoutSelection } =
    original.inputScopes as typeof original.inputScopes & { selection: string }

  expect(selection).toContain('pattern with members')
  expect(selection).toContain('Component order:')
  expect(selection).toContain('Layer order: sibling patterns')
  expect(Buffer.byteLength(selection)).toBeLessThanOrEqual(2363)
  // Only the existing owner prose is added; no schema payload or catalog growth.
  expect(
    Buffer.byteLength(
      JSON.stringify({
        ...original,
        inputScopes: choicesWithoutSelection
      })
    )
  ).toBeLessThan(2000)
  for (const run of [small, large]) {
    const before = run.deliveries.length
    const result = await run.call(
      original.example.tool,
      original.example.arguments
    )

    expect(result.success).toBe(true)
    expect(run.deliveries.slice(before).every((bytes) => bytes <= 24000)).toBe(
      true
    )
  }

  expect(large.deliveries).toEqual(small.deliveries)
  const definition = small.owners
    .flatMap((owner) => owner.definitions)
    .find((item) => item.name === 'prepare_and_apply_design')

  if (!definition) {
    throw new Error('Missing main tool')
  }

  const schema = definition.inputSchema as {
    'x-design-input-scope': {
      selection: string
      optionalInputs: string[]
      optionalInputPaths?: Record<string, string[]>
      queryExample: { operation: string; nodeTypes: string[] }
    }
  }
  const choices = schema['x-design-input-scope']

  expect(selection).toBe(choices.selection)
  choices.optionalInputs = []
  delete choices.optionalInputPaths
  expect(guidance(small).inputScopes.optionalInputs).toEqual([])
  const rejected = await small.call('describe_design_apis', {
    ...original.example.arguments,
    inputScope: {
      operation: 'draft',
      nodeTypes: ['vector'],
      optionalInputs: ['plan']
    }
  })

  expect(rejected.value.message).toContain('optionalInputs')
  const recovered = JSON.parse(
    rejected.value.message.split('Scope guidance: ')[1]
  )

  expect(recovered.inputScopes.optionalInputs).toEqual([])
  choices.queryExample = { operation: 'create', nodeTypes: ['vector'] }
  expect(() => guidance(small)).toThrow('operation')
})

it.each([
  ['nodeTypes', { operation: 'draft', nodeTypes: ['missing'] }],
  [
    'optionalInputs',
    { operation: 'draft', nodeTypes: ['vector'], optionalInputs: ['missing'] }
  ]
])(
  'names the rejected %s field and supplies a complete recovery example',
  async (field, inputScope) => {
    const run = setup()
    const rejected = await run.call('describe_design_apis', {
      names: ['prepare_and_apply_design'],
      view: 'usage',
      includeResultSchema: true,
      inputScope
    })

    expect(rejected.value.toolOutcome).toMatchObject({
      status: 'failed',
      settlement: 'not-started'
    })
    expect(rejected.value.message).toContain(`Unsupported inputScope: ${field}`)
    const recovery = JSON.parse(
      rejected.value.message.split('Scope guidance: ')[1]
    )

    expect(
      (await run.call(recovery.example.tool, recovery.example.arguments))
        .success
    ).toBe(true)
    expect(run.execute).not.toHaveBeenCalled()
  }
)

it('corrects only the rejected operation while preserving the requested scope', async () => {
  const run = setup()
  const rejected = await run.call(
    'describe_design_apis',
    invalidQueryScope.input
  )
  const guidance = JSON.parse(
    rejected.value.message.split('Scope guidance: ')[1]
  )
  const inputScope = {
    ...invalidQueryScope.input.inputScope,
    operation: guidance.inputScopes.operations[0]
  }
  const corrected = await run.call('describe_design_apis', {
    ...invalidQueryScope.input,
    inputScope
  })

  expect(corrected.success).toBe(true)
  expect(
    corrected.value.tools[0].definition.recover.arguments.inputScope
  ).toEqual(inputScope)
  expect(
    JSON.stringify(corrected.value.tools[0].usageGuide.parameters)
  ).toContain('plan')
  expect(
    run.replies.every(
      (reply) =>
        (reply.input as { inputScope?: unknown }).inputScope !== undefined
    )
  ).toBe(true)
  expect(run.execute).not.toHaveBeenCalled()
})

it('delivers expansion accounting and parts selection before the recorded oversized submission', async () => {
  const run = setup()
  const definition = run.owners
    .flatMap((owner) => owner.definitions)
    .find((item) => item.name === 'prepare_and_apply_design')

  if (!definition) {
    throw new Error('Missing workflow definition')
  }

  const guidance = workflowQueryGuidance(
    definition.name,
    definition.inputSchema
  )

  if (!guidance) {
    throw new Error('Missing workflow guidance')
  }

  expect(guidance.operationUsage.draft).toContain(
    String(DesignPreparationLimits.expandedNodes)
  )
  expect(guidance.operationUsage.parts).toContain('each part')
  const result = await run.call('describe_design_apis', {
    names: [definition.name],
    view: 'usage',
    includeResultSchema: true,
    inputScope: {
      operation: 'draft',
      nodeTypes: ['surface-grid', 'projected-face']
    }
  })
  const guide = result.value.tools[0].usageGuide

  expect(JSON.stringify(guide.parameters)).toContain(
    'rows*columns*resolved motifs'
  )
  expect(JSON.stringify(guide.parameters)).toContain('surfaceMotifs')
  expect(JSON.stringify(guide.parameters)).toContain('motifTemplates')
  expect(JSON.stringify(guide.parameters)).toContain(
    'root and nested containers'
  )
  expect(JSON.stringify(guide.parameters)).toContain(
    'not increase artifact capacity'
  )
  expect(guide.instructions).toContain('execute_design.operations')
  expect(guide.instructions).toContain('same draft arguments')
  expect(guide.recovery).toContain('parts')
  expect(run.execute).not.toHaveBeenCalled()
  const invocation = ownerInvocation(
    result.value.tools[0].invocationExample.invocation
  )
  const source = structuredClone(invocation.arguments.draft)
  const grid = source.children[2].members[1]
  const motifs = source.motifTemplates[grid.motifs.template]

  expect(motifs).toHaveLength(1)
  motifs.push({ ...structuredClone(motifs[0]), key: 'accent', fill: '#654321' })
  const inline = structuredClone(source)

  inline.children[2].members[1].motifs = structuredClone(motifs).map(
    (motif: { key: string }) => ({
      ...motif,
      ...(grid.motifs.overrides[motif.key]?.materialField
        ? { fill: undefined }
        : {}),
      ...grid.motifs.overrides[motif.key]
    })
  )
  delete inline.motifTemplates
  // Root + two panels + cap + two instances of a surface and 2x3 grid with two motifs.
  for (const input of [source, inline]) {
    const budget = measureDesignBudget(input)

    expect(budget.observed.expandedNodes).toBe(30)
    expect(budget.lowerBound).toBe(false)
    expect(budget.allowed.expandedNodes).toBe(
      DesignPreparationLimits.expandedNodes
    )
    expect(budget.exceeded).toEqual([])
  }

  const submitted = await run.call(invocation.tool, {
    ...invocation.arguments,
    draft: source,
    inspection: 'defer'
  })

  expect(submitted.value.toolOutcome.settlement).toBe('completed')
  const expected = prepareDesign(inline, submitted.value.artifactId)

  expect(expected.entries).toHaveLength(30)
  expect(prepareDesign(source, submitted.value.artifactId)).toEqual(expected)
  expect(run.created).toEqual(expected.entries.map((entry) => entry.descriptor))
})

it('rejects the recorded expansion budget before compilation and explains existing parts recovery', async () => {
  const run = setup()
  const rejected = await run.call('prepare_and_apply_design', {
    draft: expansionBudget.draft
  })

  expect(rejected.value.budget.observed.expandedNodes).toBe(10078)
  expect(rejected.value.budget.lowerBound).toBe(false)
  expect(rejected.value.completedSteps).toEqual([])
  expect(rejected.value.toolOutcome).toMatchObject({
    status: 'failed',
    settlement: 'not-started'
  })
  expect(rejected.value.message).toContain('parts')
  expect(rejected.value.retainedDraft.draftId).toBeDefined()
  expect(run.compile).not.toHaveBeenCalled()
  expect(run.execute).not.toHaveBeenCalled()
})

it('executes the delivered parts example without a preflight and preserves completed writes on refresh', async () => {
  const run = setup()
  const result = await run.call('describe_design_apis', {
    names: ['prepare_and_apply_design'],
    view: 'usage',
    includeResultSchema: true,
    inputScope: { operation: 'parts', nodeTypes: ['group', 'rect'] }
  })
  const invocation = ownerInvocation(
    result.value.tools[0].invocationExample.invocation
  )

  expect(
    invocation,
    JSON.stringify(result.value.tools[0].invocationExample)
  ).toBeDefined()
  expect(invocation.arguments.parts.length).toBeGreaterThan(1)
  const reply = await run.call(invocation.tool, {
    ...invocation.arguments,
    inspection: 'defer'
  })

  expect(reply.value.parts.length).toBe(invocation.arguments.parts.length)
  expect(
    reply.value.parts.every((part: { completedSteps: string[] }) =>
      part.completedSteps.includes('apply_prepared_design')
    )
  ).toBe(true)
  expect(run.created.length).toBeGreaterThan(0)
  const writes = run.execute.mock.calls.length

  await run.call('describe_design_apis', {
    names: ['prepare_and_apply_design'],
    view: 'usage',
    includeResultSchema: true,
    inputScope: { operation: 'parts', nodeTypes: ['group', 'rect'] },
    refresh: true,
    refreshReason: 'delivery-failure'
  })
  expect(run.execute).toHaveBeenCalledTimes(writes)
})

it('admits exactly the artifact budget and preserves a successful part before a recorded excess', async () => {
  const run = setup()
  const source = expansionBudget.draft.children.find(
    (node) => node.type === 'surface-grid'
  )

  if (!source) {
    throw new Error('Missing recorded grid')
  }

  const draft = {
    type: 'group',
    name: 'Exact capacity',
    projection: expansionBudget.draft.projection,
    fillTemplates: expansionBudget.draft.fillTemplates,
    children: [{ ...source, rows: 1, columns: 3333 }]
  }
  const exact = await run.call('prepare_design', { draft })

  expect(exact.value.available).toBe(true)
  expect(exact.value.elementCount).toBe(DesignPreparationLimits.expandedNodes)
  expect(run.execute).not.toHaveBeenCalled()
  const guide = await run.call('describe_design_apis', {
    names: ['prepare_and_apply_design'],
    view: 'usage',
    includeResultSchema: true,
    inputScope: { operation: 'parts', nodeTypes: ['group', 'rect'] }
  })
  const invocation = ownerInvocation(
    guide.value.tools[0].invocationExample.invocation
  )
  const firstPart = invocation.arguments.parts[0]
  const result = await run.call(invocation.tool, {
    parts: [firstPart, { key: 'oversized', draft: expansionBudget.draft }],
    inspection: 'defer'
  })

  expect(result.value.toolOutcome.status, JSON.stringify(result.value)).toBe(
    'partial'
  )
  expect(result.value.parts[0].completedSteps).toContain(
    'apply_prepared_design'
  )
  expect(result.value.parts[1].code).toBe('DESIGN_BUDGET_EXCEEDED')
  expect(result.value.parts[1].completedSteps).toEqual([])
  expect(
    run.execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
  const retained = run.created.map((entry) => structuredClone(entry))
  const remaining = invocation.arguments.parts[1]
  const parentId = result.value.parts[0].actionResults[0].result.compositionId
  const { parentPart: _parentPart, ...next } = remaining

  await run.call(invocation.tool, {
    parts: [{ ...next, parentId }],
    inspection: 'defer'
  })
  expect(run.execute).toHaveBeenCalledTimes(2)
  expect(run.created.slice(0, retained.length)).toEqual(retained)
  expect(run.parents.get(run.created[retained.length].id)).toBe(parentId)
})

it('delivers and executes a complete mixed component example and recovers only the unfinished part', async () => {
  const run = setup()
  const definition = run.owners
    .flatMap((owner) => owner.definitions)
    .find((entry) => entry.name === 'prepare_and_apply_design')

  if (!definition) {
    throw new Error('Missing main tool')
  }

  const initial = workflowQueryGuidance(definition.name, definition.inputSchema)

  if (!initial) {
    throw new Error('Missing owner query example')
  }

  const query = initial.example.arguments

  expect(query.inputScope).toEqual({
    operation: 'draft',
    nodeTypes: ['pattern']
  })
  expect(initial.inputScopes.selection).toContain('outer repetition')
  const guide = (await run.call('describe_design_apis', query)).value.tools[0]
  const invocation = ownerInvocation(guide.invocationExample.invocation)

  expect(
    invocation.arguments.draft.children[0].members?.map(
      (member: { type: string }) => member.type
    )
  ).toEqual(['projected-face', 'surface-grid'])
  const full = (
    await run.call('describe_design_apis', {
      names: query.names,
      inputScope: query.inputScope
    })
  ).value.tools[0]

  expect(
    operationInputIssue(invocation.arguments, full.inputSchema)
  ).toBeUndefined()
  const invalid = structuredClone(invocation.arguments.draft)

  invalid.children[0].members[1].rows = 1000
  invalid.children[0].members[1].columns = 1000
  const result = await run.call(invocation.tool, {
    parts: [
      { key: 'ready', draft: invocation.arguments.draft },
      { key: 'remaining', draft: invalid }
    ],
    inspection: 'defer'
  })

  expect(result.value.toolOutcome.status, JSON.stringify(result.value)).toBe(
    'partial'
  )
  expect(result.value.parts[0].completedSteps).toContain(
    'apply_prepared_design'
  )
  expect(result.value.parts[1].completedSteps).toEqual([])
  expect(
    run.execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
  const retained = structuredClone(run.created)

  expect(retained).toHaveLength(15)
  await run.call('describe_design_apis', {
    ...query,
    refresh: true,
    refreshReason: 'delivery-failure'
  })
  expect(
    run.execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
  const parentId = result.value.parts[0].actionResults[0].result.compositionId
  const recovery = await run.call(invocation.tool, {
    parts: [{ key: 'remaining', parentId, draft: invocation.arguments.draft }],
    inspection: 'defer'
  })

  expect(recovery.value.parts[0].completedSteps).toContain(
    'apply_prepared_design'
  )
  expect(run.execute).toHaveBeenCalledTimes(2)
  expect(run.created.slice(0, retained.length)).toEqual(retained)
  expect(run.parents.get(run.created[retained.length].id)).toBe(parentId)
})

it('continues the saved massing and grid layers in order without extra roots or replay', async () => {
  const run = setup()
  const input = {
    parts: [
      { key: 'massing', draft: componentSelection.compactMassing },
      { key: 'grids', draft: componentSelection.compactGrids }
    ],
    inspection: 'defer'
  }
  const original = structuredClone(input)
  const result = await run.call('prepare_and_apply_design', input)

  expect(input).toEqual(original)
  expect(
    result.value.parts.every(
      (part: { toolOutcome: { status: string } }) =>
        part.toolOutcome.status === 'success'
    )
  ).toBe(true)
  expect(result.value.toolOutcome).toMatchObject({
    status: 'success',
    settlement: 'completed'
  })

  expect(result.value.recoveryInvocation).toBeUndefined()
  expect(run.created).toHaveLength(91 + 12801)
  const roots = run.created.filter(
    (entry) => run.parents.get(entry.id) === 'workspace'
  )

  expect(roots.map((entry) => run.created.indexOf(entry))).toEqual([0, 91])
  const retained = structuredClone(run.created)

  await run.call('describe_design_apis', {
    names: ['prepare_and_apply_design'],
    view: 'usage',
    includeResultSchema: true,
    inputScope: { operation: 'parts', nodeTypes: ['pattern'] },
    refresh: true,
    refreshReason: 'delivery-failure'
  })
  expect(run.created).toEqual(retained)
})

it.each([false, true])(
  'delivers root materials and optional repetition without a separate selection (explicit=%s)',
  async (explicit) => {
    const run = setup()
    const query = {
      names: ['prepare_and_apply_design'],
      view: 'usage',
      includeResultSchema: true,
      inputScope: {
        operation: 'draft',
        nodeTypes: [
          'projected-face',
          'surface-grid',
          ...(explicit ? ['pattern'] : [])
        ]
      }
    }
    const response = await run.call('describe_design_apis', query)
    const tool = response.value.tools[0]
    const invocation = ownerInvocation(tool.invocationExample.invocation)
    const source = invocation.arguments.draft

    process.stdout.write(
      JSON.stringify({
        measurement: 'composition-guide',
        bytes: run.deliveries[0],
        explicit,
        replies: run.deliveries.length
      }) + '\n'
    )
    expect(run.deliveries.every((bytes) => bytes <= 24000)).toBe(true)
    // Compare complete acquisition cost: required host acknowledgement changes
    // the selected schema, while removing the prior prerequisite must still save bytes.
    // Pre-edit same-dispatcher content guide (16297) plus combined guide (20146).
    expect(run.deliveries.reduce((sum, bytes) => sum + bytes, 0)).toBeLessThan(
      16297 + 20146
    )
    expect(source.linearFields).toBeDefined()
    expect(source.fillTemplates).toBeDefined()
    expect(
      source.children.map((child: { type: string }) => child.type)
    ).toEqual(['pattern', 'projected-face', 'pattern'])
    const pattern = source.children[0]
    const grid = source.children[2].members[1]

    expect(
      pattern.members.map((member: { type: string }) => member.type)
    ).toEqual(['projected-face'])
    expect(pattern.members[0].ellipse).toEqual({
      center: { x: 5, y: 0, z: 10 },
      u: { x: 5, y: 0, z: 0 },
      v: { x: 0, y: 0, z: 10 }
    })
    expect(source.children[1].vertices).toHaveLength(3)
    expect(source.linearFields[pattern.members[0].materialField]).toBeDefined()
    expect(source.fillTemplates[source.children[1].fill.template]).toBeDefined()
    const motifs = source.motifTemplates[grid.motifs.template]

    expect(motifs).toHaveLength(1)
    expect(source.fillTemplates[motifs[0].fill.template]).toBeDefined()
    const inline = structuredClone(source)

    inline.children[2].members[1].motifs = structuredClone(motifs).map(
      (motif: { key: string }) => ({
        ...motif,
        ...(grid.motifs.overrides[motif.key]?.materialField
          ? { fill: undefined }
          : {}),
        ...grid.motifs.overrides[motif.key]
      })
    )
    delete inline.motifTemplates
    const full = (
      await run.call('describe_design_apis', {
        ...Object.fromEntries(
          Object.entries(query).filter(([key]) => key !== 'includeResultSchema')
        ),
        view: 'full'
      })
    ).value.tools[0]

    expect(
      operationInputIssue(invocation.arguments, full.inputSchema)
    ).toBeUndefined()
    const result = await run.call(invocation.tool, {
      ...invocation.arguments,
      inspection: 'defer'
    })

    expect(result.value.toolOutcome.settlement).toBe('completed')
    expect(
      run.execute.mock.calls.filter(([batch]) =>
        batch.actions.some((action) => action.name === 'apply_prepared_design')
      )
    ).toHaveLength(1)
    const expected = prepareDesign(inline, result.value.artifactId)

    expect(expected.entries.map((entry) => entry.key)).toContain(
      'windows-1-surface'
    )
    expect(prepareDesign(source, result.value.artifactId)).toEqual(expected)
    expect(run.created).toEqual(
      expected.entries.map((entry) => entry.descriptor)
    )
    expect([...run.parents]).toEqual(
      expected.entries.map((entry) => [
        entry.descriptor.id,
        entry.parentId ?? 'workspace'
      ])
    )
    const retained = structuredClone(run.created)

    expect(
      run.created
        .slice(1)
        .every((entry) => run.parents.get(entry.id) === run.created[0].id)
    ).toBe(true)
    const restored = await run.call('describe_design_apis', {
      ...query,
      refresh: true,
      refreshReason: 'delivery-failure'
    })

    expect(restored.value.tools[0].invocationExample).toEqual(
      tool.invocationExample
    )
    expect(run.created).toEqual(retained)
    expect(
      run.execute.mock.calls.filter(([batch]) =>
        batch.actions.some((action) => action.name === 'apply_prepared_design')
      )
    ).toHaveLength(1)
    const broken = structuredClone(source)

    broken.children[2].members[1].motifs.template = 'missing'
    const invalid = await run.call(invocation.tool, {
      draft: broken,
      inspection: 'defer'
    })

    expect(invalid.success).toBe(false)
    expect(run.created).toEqual(retained)
    expect(
      run.execute.mock.calls.filter(([batch]) =>
        batch.actions.some((action) => action.name === 'apply_prepared_design')
      )
    ).toHaveLength(1)
    const large = setup(10000)
    const enlarged = await large.call('describe_design_apis', query)

    expect(large.deliveries[0]).toBe(run.deliveries[0])
    expect(enlarged.value.tools[0].invocationExample).toEqual(
      tool.invocationExample
    )
  }
)

it('continues recorded material composition without asking for rewritten ranges', async () => {
  const run = setup()
  const original = compositionMaterials.draft
  const source = {
    ...original,
    children: [
      ...original.children.slice(0, 7),
      compositionMaterials.pattern,
      ...original.children.slice(63)
    ]
  }
  const result = await run.call('prepare_and_apply_design', {
    draft: source,
    inspection: 'defer'
  })

  expect(
    result.value.parts.every(
      (part: { toolOutcome: { status: string } }) =>
        part.toolOutcome.status === 'success'
    )
  ).toBe(true)
  expect(result.value.toolOutcome).toMatchObject({
    status: 'success',
    settlement: 'completed'
  })
  expect(result.value.recoveryInvocation).toBeUndefined()
  expect(run.created).toHaveLength(13117)
  expect(
    run.created.filter((entry) => run.parents.get(entry.id) === 'workspace')
  ).toHaveLength(1)
  expect(run.calls).toEqual(['prepare_and_apply_design'])
})

it.each(['projected-face', 'surface-grid'])(
  'includes only selected %s members in the optional translation loop',
  async (memberType) => {
    const run = setup()
    const query = {
      names: ['prepare_and_apply_design'],
      view: 'usage',
      includeResultSchema: true,
      inputScope: { operation: 'draft', nodeTypes: [memberType] }
    }
    const guide = (await run.call('describe_design_apis', query)).value.tools[0]

    expect(run.calls).toHaveLength(1)
    expect(run.deliveries.every((bytes) => bytes <= 24000)).toBe(true)
    const full = (
      await run.call('describe_design_apis', {
        ...Object.fromEntries(
          Object.entries(query).filter(([key]) => key !== 'includeResultSchema')
        ),
        view: 'full'
      })
    ).value.tools[0]
    const wrapper = full.inputSchema.$defs.node.anyOf.find(
      (node: { properties: { type: { const: string } } }) =>
        node.properties.type.const === 'pattern'
    )

    expect(wrapper).toBeDefined()
    expect(
      wrapper.properties.members.items.anyOf.map(
        (node: { properties: { type: { const: string } } }) =>
          node.properties.type.const
      )
    ).toEqual([memberType])
    expect(wrapper.properties.faces).toBe(false)
    expect(wrapper.properties.fills).toBe(false)
    expect(JSON.stringify(guide.usageGuide.parameters)).toContain(
      'instanceRanges'
    )
    expect(guide.usageGuide.recovery).toContain('Never replay completed writes')
    const draft = ownerInvocation(guide.invocationExample.invocation).arguments
      .draft
    const single = draft.children[0]

    expect(single.type).toBe(memberType)
    const loop = {
      type: 'pattern',
      key: 'repeat',
      name: 'Repeat',
      origin: { x: 0, y: 0, z: 0 },
      axes: [{ count: 2, step: { x: 0, y: 0, z: 30 } }],
      members: [single]
    }
    const args = { draft: { ...draft, children: [loop] }, inspection: 'defer' }

    expect(operationInputIssue(args, full.inputSchema)).toBeUndefined()
    const definition = run.owners
      .flatMap((owner) => owner.definitions)
      .find((owner) => owner.name === 'prepare_and_apply_design')

    if (!definition) {
      throw new Error('Missing main tool')
    }

    expect(operationInputIssue(args, definition.inputSchema)).toBeUndefined()
    for (const change of [
      { axes: [{ count: 0, step: { x: 0, y: 0, z: 30 } }] },
      { axes: [{ count: 2, step: { x: 0, y: 0, z: 30 }, extra: true }] },
      { faces: [] },
      { fills: ['#123456'] },
      { members: [loop] },
      { members: [{ ...single, key: 'x'.repeat(81) }] }
    ]) {
      const invalid = {
        ...args,
        draft: { ...args.draft, children: [{ ...loop, ...change }] }
      }

      expect(operationInputIssue(invalid, full.inputSchema)).toBeDefined()
      expect(operationInputIssue(invalid, definition.inputSchema)).toBeDefined()
      const rejected = await run.call('prepare_and_apply_design', invalid)

      expect(rejected.success).toBe(false)
      expect(run.execute).not.toHaveBeenCalled()
    }

    const result = await run.call('prepare_and_apply_design', args)

    expect(result.value.toolOutcome.settlement).toBe('completed')
    expect(
      run.execute.mock.calls.filter(([batch]) =>
        batch.actions.some((action) => action.name === 'apply_prepared_design')
      )
    ).toHaveLength(1)
    expect(run.created).toHaveLength(memberType === 'projected-face' ? 3 : 13)
    const other =
      memberType === 'surface-grid' ? 'projected-face' : 'surface-grid'

    expect(JSON.stringify(wrapper.properties.members)).not.toContain(
      '"const":"' + other + '"'
    )
    const unrelated = projectWorkflowInput(definition.inputSchema, {
      operation: 'draft',
      nodeTypes: ['rect']
    })

    expect(JSON.stringify(unrelated)).not.toContain('"const":"pattern"')
    const repair = projectWorkflowInput(definition.inputSchema, {
      operation: 'repair',
      nodeTypes: [memberType]
    })

    expect(JSON.stringify(repair)).not.toContain('"const":"pattern"')
  }
)

it('rejects malformed owner repetition declarations without changing canonical contracts', () => {
  const run = setup()
  const owner = run.owners
    .flatMap((item) => item.definitions)
    .find((item) => item.name === 'prepare_and_apply_design')

  if (!owner) {
    throw new Error('Missing main tool')
  }

  const input = JSON.parse(JSON.stringify(owner.inputSchema))
  const original = JSON.stringify(input)
  const scope = { operation: 'draft', nodeTypes: ['surface-grid'] }

  projectWorkflowInput(input, scope)
  expect(JSON.stringify(input)).toBe(original)
  for (const repetition of [
    null,
    {},
    { type: 'missing', memberField: 'members' },
    { type: 'pattern', memberField: 'faces' },
    { type: 'pattern', memberField: 'missing' }
  ]) {
    const invalid = {
      ...input,
      'x-design-input-scope': { ...input['x-design-input-scope'], repetition }
    }

    expect(() => projectWorkflowInput(invalid, scope)).toThrow(/repetition/)
  }

  const explicit = projectWorkflowInput(input, {
    operation: 'draft',
    nodeTypes: ['pattern']
  })
  const canonicalPattern = input.$defs.node.anyOf.find(
    (node: { properties: { type: { const: string } } }) =>
      node.properties.type.const === 'pattern'
  )

  expect(explicit.$defs).toMatchObject({ node: { anyOf: [canonicalPattern] } })
})

it.each([10000, 2000])(
  'executes safe capacity in one public invocation with truthful progress at %i',
  async (limit) => {
    const run = setup(0, undefined, limit)
    const completed = await run.call(
      'prepare_and_apply_design',
      recoveryFixture.input
    )

    expect(completed.value.toolOutcome).toMatchObject({
      status: 'success',
      settlement: 'completed'
    })
    expect(completed.value).not.toHaveProperty('measurementIssues')
    expect(completed.value.recoveryInvocation).toBeUndefined()
    expect(run.calls).toEqual(['prepare_and_apply_design'])
    expect(
      completed.value.parts.every(
        (part: { toolOutcome: { status: string } }) =>
          part.toolOutcome.status === 'success'
      )
    ).toBe(true)
    expect(
      run.trace.mock.calls.filter(([stage]) => stage === 'action_failed')
    ).toEqual([])
    const planning = run.trace.mock.calls.find(
      ([stage, value]) =>
        stage === 'action_completed' && value.result?.retainedDraft?.partitions
    )

    expect(planning?.[1].result.toolOutcome.status).toBe('success')
    expect(run.created).toHaveLength(13095)
    const roots = run.created.filter(
      (entry) => run.parents.get(entry.id) === 'workspace'
    )

    expect(roots).toHaveLength(1)
    expect(
      run.created
        .slice(1)
        .every((entry) => run.parents.get(entry.id) === roots[0].id)
    ).toBe(true)
    expect(run.compile).toHaveBeenCalledTimes(completed.value.parts.length)
    expect(
      run.execute.mock.calls.filter(([batch]) =>
        batch.actions.some((action) => action.name === 'apply_prepared_design')
      )
    ).toHaveLength(completed.value.parts.length)
    const first = completed.value.parts[0]
    const before = structuredClone(run.created)
    const duplicate = await run.call('prepare_and_apply_design', {
      repair: { draftId: first.preparationInput.draftId, partition: 0 },
      inspection: 'defer'
    })

    expect(duplicate.value.toolOutcome.status).not.toBe('success')
    expect(duplicate.value.recoveryInvocation).toBeUndefined()
    expect(run.created).toEqual(before)
    expect(run.compile).toHaveBeenCalledTimes(completed.value.parts.length)
  }
)

const unstartedCapacityRecovery = async (run: ReturnType<typeof setup>) => {
  run.compile.mockRejectedValueOnce(new Error('Temporary preparation failure'))
  const stopped = await run.call(
    'prepare_and_apply_design',
    recoveryFixture.input
  )

  expect(stopped.value.toolOutcome.settlement).toBe('not-started')
  expect(run.created).toHaveLength(0)
  expect(stopped.value.recoveryInvocation).toBeDefined()
  run.compile.mockClear()

  return stopped.value.recoveryInvocation
}

it.each([10000, 2000])(
  'returns remaining source references after a later preparation failure without replaying the first partition at %i',
  async (limit) => {
    const run = setup(0, undefined, limit)

    run.compile
      .mockImplementationOnce(prepareDesignAsync)
      .mockRejectedValueOnce(new Error('Temporary preparation failure'))
    const partial = await run.call(
      'prepare_and_apply_design',
      recoveryFixture.input
    )

    expect(partial.value.toolOutcome.status).toBe('partial')
    expect(partial.value.parts[0].toolOutcome.status).toBe('success')
    expect(partial.value.parts[1].toolOutcome.settlement).toBe('not-started')
    const first = structuredClone(run.created)
    const remaining = partial.value.recoveryInvocation

    expect(remaining.arguments.parts).toHaveLength(
      partial.value.parts[0].preparationInput.partitions.length - 1
    )
    expect(remaining.arguments.parts[0].repair.partition).toBe(1)
    expect(remaining.arguments.parts[0].repair.continueFromArtifact).toBe(
      partial.value.parts[0].artifactId
    )
    const recovered = await run.call(remaining.name, remaining.arguments)

    expect(recovered.value.parts[0].toolOutcome.status).toBe('success')
    expect(run.created).toHaveLength(13095)
    expect(run.created.slice(0, first.length)).toEqual(first)
    expect(
      run.execute.mock.calls.filter(([batch]) =>
        batch.actions.some((action) => action.name === 'apply_prepared_design')
      )
    ).toHaveLength(partial.value.parts[0].preparationInput.partitions.length)
  }
)

it('retains acknowledged partition receipts when cancellation arrives between parts', async () => {
  const run = setup()
  const invocation = await unstartedCapacityRecovery(run)
  const controller = new AbortController()
  const execute = run.execute.getMockImplementation()

  if (!execute) {
    throw new Error('Missing execution owner')
  }

  run.execute.mockImplementationOnce(async (batch) => {
    const result = await execute(batch)

    controller.abort()

    return result
  })
  await expect(
    run.call(invocation.name, invocation.arguments, controller.signal)
  ).rejects.toThrow(/aborted/i)
  expect(run.created).toHaveLength(9418)
  expect(
    run.execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
  const acknowledged = await run.execute.mock.results[0].value

  expect(acknowledged.actionResults[0].result.status).toBe('complete')
  expect(acknowledged.actionResults[0].result.compositionId).toBe(
    run.created[0].id
  )
  expect(run.compile).toHaveBeenCalledOnce()
})

it('does not offer automatic replay after a lost application acknowledgement or foreign source', async () => {
  const run = setup()
  const invocation = await unstartedCapacityRecovery(run)
  const foreign = setup()
  const unavailable = await foreign.call(invocation.name, invocation.arguments)

  expect(unavailable.value.toolOutcome.status).not.toBe('success')
  expect(unavailable.value.recoveryInvocation).toBeUndefined()
  expect(foreign.created).toHaveLength(0)
  const execute = run.execute.getMockImplementation()

  if (!execute) {
    throw new Error('Missing execution owner')
  }

  run.execute
    .mockImplementationOnce(execute)
    .mockImplementationOnce(async (batch) => {
      await execute(batch)
      throw new Error('Application acknowledgement lost')
    })
  const uncertain = await run.call(invocation.name, invocation.arguments)

  expect(run.created).toHaveLength(13095)
  expect(uncertain.value.toolOutcome.status).not.toBe('success')
  expect(uncertain.value.recoveryInvocation).toBeUndefined()
  expect(run.execute).toHaveBeenCalledTimes(2)
})

it('retains backward partition references when the first preparation has not started', async () => {
  const run = setup()
  const invocation = await unstartedCapacityRecovery(run)

  run.compile.mockRejectedValueOnce(
    new Error('Temporary first preparation failure')
  )
  const stopped = await run.call(invocation.name, invocation.arguments)

  expect(stopped.value.toolOutcome.settlement).toBe('not-started')
  expect(run.created).toHaveLength(0)
  const remaining = stopped.value.recoveryInvocation

  expect(remaining.arguments.parts).toEqual(invocation.arguments.parts)
  const recovered = await run.call(remaining.name, remaining.arguments)

  expect(
    recovered.value.parts.map(
      (part: { toolOutcome: { status: string } }) => part.toolOutcome.status
    )
  ).toEqual(['success', 'success'])
  expect(run.created).toHaveLength(13095)
})

it('does not propose retrying a continuation whose first artifact was released', async () => {
  const run = setup()
  const invocation = await unstartedCapacityRecovery(run)
  const first = await run.call(invocation.name, {
    ...invocation.arguments,
    parts: invocation.arguments.parts.slice(0, 1)
  })
  const artifactId = first.value.parts[0].artifactId

  await run.call('release_design_artifacts', { artifactIds: [artifactId] })
  const source = invocation.arguments.parts[1]
  const remaining = {
    key: source.key,
    repair: { ...source.repair, continueFromArtifact: artifactId }
  }
  const before = run.created.length
  const stopped = await run.call(invocation.name, {
    parts: [remaining],
    inspection: 'defer'
  })

  expect(stopped.value.toolOutcome.status).not.toBe('success')
  expect(stopped.value.recoveryInvocation).toBeUndefined()
  expect(run.created).toHaveLength(before)
})

it('recovers only retained capacity work after an earlier independent part', async () => {
  const run = setup()

  run.compile
    .mockImplementationOnce(prepareDesignAsync)
    .mockRejectedValueOnce(new Error('Temporary partition failure'))
  const result = await run.call('prepare_and_apply_design', {
    parts: [
      {
        key: 'independent',
        draft: {
          type: 'group',
          name: 'Existing work',
          children: [
            {
              type: 'rect',
              key: 'panel',
              name: 'Panel',
              x: 0,
              y: 0,
              width: 10,
              height: 10
            }
          ]
        }
      },
      { key: 'capacity', draft: recoveryFixture.input.draft }
    ],
    inspection: 'defer'
  })

  expect(result.value.toolOutcome.status, JSON.stringify(result.value)).toBe(
    'partial'
  )
  expect(run.created).toHaveLength(2)
  expect(result.value.recoveryInvocation).toBeDefined()
  const invocation = result.value.recoveryInvocation

  expect(
    invocation.arguments.parts.every(
      (part: { repair?: unknown; draft?: unknown }) =>
        part.repair && !part.draft
    )
  ).toBe(true)
  const before = structuredClone(run.created)

  await run.call(invocation.name, invocation.arguments)
  expect(run.created).toHaveLength(13097)
  expect(run.created.slice(0, 2)).toEqual(before)
})

it('preserves explicit parent links and reserved keys across capacity continuation', async () => {
  const run = setup(0, undefined, 2000)
  const input = {
    parts: [
      {
        key: 'large',
        draft: {
          type: 'group',
          key: 'root',
          name: 'Panels',
          projection: recoveryFixture.input.draft.projection,
          children: [
            {
              type: 'pattern',
              key: 'panels',
              name: 'Panels',
              origin: { x: 0, y: 0, z: 0 },
              axes: [{ count: 2000, step: { x: 0, y: 0, z: 1 } }],
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
        }
      },
      {
        key: 'large:partition-1',
        parentPart: 'large',
        draft: {
          type: 'group',
          name: 'Detail',
          children: [
            {
              type: 'rect',
              key: 'detail',
              name: 'Detail',
              x: 0,
              y: 0,
              width: 1,
              height: 1
            }
          ]
        }
      }
    ],
    inspection: 'defer'
  }
  const original = structuredClone(input)
  const result = await run.call('prepare_and_apply_design', input)

  expect(input).toEqual(original)
  expect(result.value.parts.map((part: { key: string }) => part.key)).toEqual([
    'large',
    'large:partition-1:',
    'large:partition-1'
  ])
  expect(
    result.value.parts.every(
      (part: { toolOutcome: { status: string } }) =>
        part.toolOutcome.status === 'success'
    )
  ).toBe(true)
  expect(run.created).toHaveLength(2003)
  expect(run.parents.get(run.created[2001].id)).toBe(run.created[0].id)
  expect(
    run.created.filter((entry) => run.parents.get(entry.id) === 'workspace')
  ).toHaveLength(1)
})

it('preserves the saved layered source through compact preparation and canonical target references', async () => {
  const before = structuredClone(layeredPattern)
  const original = prepareDesign(layeredPattern.input.draft, 'layered')
  const compact = await prepareDesignAsync(
    new AbortController().signal,
    layeredPattern.compact.draft,
    'layered'
  )
  const sourceWork = constructDesign(
    layeredPattern.input.draft,
    'layered'
  ).sourceWork
  const compactWork = constructDesign(
    layeredPattern.compact.draft,
    'layered'
  ).sourceWork

  expect(sourceWork).toMatchObject({ nodes: 103, projectionCalls: 336 })
  expect(compactWork).toMatchObject({ nodes: 33, projectionCalls: 130 })
  expect(compact.entries).toHaveLength(1443)
  expect(compact.findings).toEqual(original.findings)
  expectEquivalentPatternEntries(compact, original)
  expect(compact.entries.map((e) => e.descriptor.fills)).toEqual(
    original.entries.map((e) => e.descriptor.fills)
  )
  expect(
    compact.entries.filter((e, i) => e.key !== original.entries[i].key)
  ).toHaveLength(1328)
  expect(
    compact.entries.filter(
      (e, i) => e.descriptor.name !== original.entries[i].descriptor.name
    )
  ).toHaveLength(1328)
  expect(
    Buffer.byteLength(JSON.stringify(layeredPattern.compact))
  ).toBeLessThanOrEqual(layeredPattern.baseline.inputBytes / 2)
  expect(compact).toEqual(
    prepareDesign(layeredPattern.compact.draft, 'layered')
  )
  expect(layeredPattern).toEqual(before)

  const run = setup()
  const result = await run.call('prepare_and_apply_design', {
    draft: layeredPattern.compact.draft,
    inspection: 'defer'
  })

  expect(result.value.actionResults[0].result).toMatchObject({
    status: 'complete',
    appliedElementCount: 1443
  })
  expect(run.created).toHaveLength(1443)
  const targets = await run.call('retain_design_targets', {
    targets: [
      { artifactId: result.value.artifactId, keyPrefix: 'window-layer-7-' }
    ]
  })
  const owner = run.owners[0]

  if (!('resolveTargets' in owner)) {
    throw new Error('Missing design owner')
  }

  const target = targets.value.targets[0]
  const ids = owner.resolveTargets({
    artifactId: target.artifactId,
    targetSetId: target.targetSetId
  })

  expect(ids).toEqual(run.created.slice(1187, 1347).map((e) => e.id))
  const retained = structuredClone(run.created)

  await run.call('describe_design_apis', {
    ...layeredPattern.query,
    refresh: true,
    refreshReason: 'delivery-failure'
  })
  expect(run.created).toEqual(retained)
  expect(
    run.execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
  await run.call('release_design_artifacts', {
    artifactIds: [result.value.artifactId]
  })
  expect(() =>
    owner.resolveTargets({
      artifactId: target.artifactId,
      targetSetId: target.targetSetId
    })
  ).toThrow()
})

it.each([false, true])(
  'delivers executable layered order in the first page without extra reading (plan=%s)',
  async (plan) => {
    const run = setup()
    const query = structuredClone(layeredPattern.query)

    if (!plan) {
      query.inputScope.optionalInputs = []
    }

    const response = await run.call('describe_design_apis', query)
    const tool = response.value.tools[0]

    process.stdout.write(
      JSON.stringify({
        measurement: 'layered-usage',
        plan,
        bytes: run.deliveries.reduce((a, b) => a + b, 0),
        bodyBytes: Buffer.byteLength(JSON.stringify(response.value)),
        replies: run.deliveries.length
      }) + '\n'
    )
    expect(
      Buffer.byteLength(JSON.stringify(response.value))
    ).toBeLessThanOrEqual(completeUsageBudget(25604, 'draft'))
    const invocation = ownerInvocation(tool.invocationExample.invocation)
    const first = JSON.parse(run.replies[0].raw)
    const body = first.contentDelivery?.text ?? run.replies[0].raw

    expect(body).toContain(JSON.stringify(tool.invocationExample))
    expect(body.indexOf('"invocationExample"')).toBeLessThan(
      body.indexOf('"parameters"')
    )
    expect(run.calls).toHaveLength(1)
    expect(run.deliveries.every((bytes) => bytes <= 24000)).toBe(true)
    expect(
      Buffer.byteLength(JSON.stringify(response.value))
    ).toBeLessThanOrEqual(completeUsageBudget(plan ? 27702 : 20087, 'draft'))
    const calls = run.replies.length
    const outcome = await run.call(invocation.tool, {
      ...invocation.arguments,
      inspection: 'defer'
    })

    expect(outcome.value.actionResults[0].result.status).toBe('complete')
    expect(run.replies).toHaveLength(calls + 1)
    const session = createDesignPreparationSession()
    const prepared = session.prepare(invocation.arguments.draft)
    const entries = session.resolve(prepared.artifactId).entries

    // The first layer is complete before the independent cap, then the grid layer.
    expect(entries.slice(1, 4).map((e) => e.key)).toEqual([
      'unit-0-panel',
      'unit-1-panel',
      'cap'
    ])
    expect(entries.slice(4).map((e) => e.key)).toEqual(
      Array.from({ length: 2 }, (_, i) => [
        `windows-${i}-surface`,
        ...Array.from(
          { length: 6 },
          (_, cell) => `windows-${i}-grid-${cell}-inset`
        )
      ]).flat()
    )
    expect(run.created.map((e) => e.name)).toEqual(
      entries.map((e) => e.descriptor.name)
    )
    expect(new Set(run.parents.values()).has(run.created[0].id)).toBe(true)
    const source = invocation.arguments.draft

    expect(
      source.linearFields[source.children[0].members[0].materialField]
    ).toBeDefined()
    const grid = source.children[2].members[1]
    const motifs = source.motifTemplates[grid.motifs.template]

    expect(motifs).toHaveLength(1)
    expect(source.fillTemplates[motifs[0].fill.template]).toBeDefined()
    const inline = structuredClone(source)

    inline.children[2].members[1].motifs = structuredClone(motifs).map(
      (motif: { key: string }) => ({
        ...motif,
        ...(grid.motifs.overrides[motif.key]?.materialField
          ? { fill: undefined }
          : {}),
        ...grid.motifs.overrides[motif.key]
      })
    )
    delete inline.motifTemplates
    const expected = prepareDesign(inline, outcome.value.artifactId)

    expect(prepareDesign(source, outcome.value.artifactId)).toEqual(expected)
    expect(run.created).toEqual(
      expected.entries.map((entry) => entry.descriptor)
    )
    expect([...run.parents]).toEqual(
      expected.entries.map((entry) => [
        entry.descriptor.id,
        entry.parentId ?? 'workspace'
      ])
    )
    const large = setup(10000)

    await large.call('describe_design_apis', query)
    expect(large.deliveries).toEqual(run.deliveries.slice(0, calls))
  }
)

it('detects the semantic loss from combining separate saved painter layers', () => {
  const draft = structuredClone(layeredPattern.compact.draft)
  const face = draft.children.find((child) => child.key === 'tier-layer')
  const grid = draft.children.find((child) => child.key === 'window-layer')

  if (!face || !grid || !('members' in face) || !('members' in grid)) {
    throw new Error('Missing saved layer patterns')
  }

  Object.assign(face, { members: [...face.members, ...grid.members] })
  draft.children = draft.children.filter((child) => child !== grid)
  const wrong = prepareDesign(draft, 'layered')
  const expected = prepareDesign(layeredPattern.compact.draft, 'layered')

  expect(wrong.entries).toHaveLength(expected.entries.length)
  expect(() => expectEquivalentPatternEntries(wrong, expected)).toThrow()
})

it.each([
  { count: 2, step: { x: -17, y: 3, z: 9 } },
  { count: 3, step: { x: 11, y: -5, z: -7 } }
])(
  'preserves generic layered translation and explicit alternatives %j',
  async ({ count, step }) => {
    const run = setup()
    const guide = await run.call('describe_design_apis', layeredPattern.query)
    const draft = ownerInvocation(
      guide.value.tools[0].invocationExample.invocation
    ).arguments.draft
    const compact = structuredClone(draft)
    const explicit = structuredClone(draft)

    for (const pattern of [compact.children[0], compact.children[2]]) {
      pattern.axes = [{ count, step }]
      pattern.origin = { x: 7, y: -2, z: 5 }
    }

    explicit.children = compact.children.flatMap(
      (child: (typeof draft.children)[number]) => {
        if (child.type !== 'pattern') {
          return [structuredClone(child)]
        }

        return Array.from({ length: count }, (_, index) =>
          child.members.map((member: (typeof child.members)[number]) => {
            const node = structuredClone(member)

            node.key = `${child.key}-${index}-${member.key}`
            node.name = `Explicit ${child.key} ${index}`
            const field =
              member.type === 'projected-face' ? 'vertices' : 'boundary'

            if (member.ellipse) {
              const p = member.ellipse.center

              node.ellipse.center = {
                x: p.x + 7 + step.x * index,
                y: p.y - 2 + step.y * index,
                z: p.z + 5 + step.z * index
              }

              return node
            }

            const sourcePoints = Array.isArray(member[field])
              ? member[field]
              : child.members.find(
                  (item: (typeof child.members)[number]) =>
                    item.key === member.boundary.face
                ).vertices

            node[field] = sourcePoints.map(
              (point: { x: number; y: number; z: number }) => ({
                x: point.x + 7 + step.x * index,
                y: point.y - 2 + step.y * index,
                z: point.z + 5 + step.z * index
              })
            )

            return node
          })
        ).flat()
      }
    )
    const expected = prepareDesign(explicit, 'generic')

    expectEquivalentPatternEntries(prepareDesign(compact, 'generic'), expected)
    const source = structuredClone(explicit)
    const result = await run.call('prepare_and_apply_design', {
      draft: explicit,
      inspection: 'defer'
    })

    expect(result.value.toolOutcome.settlement).toBe('completed')
    expect(explicit).toEqual(source)
    expect(run.created.map((entry) => entry.name)).toEqual(
      expected.entries.map((entry) => entry.descriptor.name)
    )
  }
)

it('delivers and executes the projected oval example in one selected acquisition', async () => {
  const run = setup()
  const query = {
    names: ['prepare_and_apply_design'],
    view: 'usage',
    includeResultSchema: true,
    inputScope: { operation: 'draft', nodeTypes: ['projected-face', 'pattern'] }
  }
  const response = await run.call('describe_design_apis', query)

  process.stdout.write(
    JSON.stringify({
      measurement: 'ellipse-selected-delivery',
      bytes: run.deliveries.reduce((a, b) => a + b, 0),
      replies: run.deliveries.length
    }) + '\n'
  )
  expect(run.deliveries.every((bytes) => bytes <= 24000)).toBe(true)
  // Preserve the fixed full exchange budget, including authored geometry;
  // the new guaranteed result contract is part of that same acquisition.
  expect(
    Buffer.byteLength(JSON.stringify(response.value)) +
      Buffer.byteLength(
        JSON.stringify(sampledEllipse.compact, (key, value) =>
          key === 'ellipse'
            ? { center: value.center, u: value.u, v: value.v }
            : value
        )
      )
  ).toBeLessThan(
    completeUsageBudget(sampledEllipse.source.selectedDeliveryBytes, 'draft') +
      sampledEllipse.source.inputBytes
  )
  const invocation = ownerInvocation(
    response.value.tools[0].invocationExample.invocation
  )

  expect(JSON.stringify(invocation.arguments)).toContain('"ellipse"')
  const calls = run.replies.length
  const outcome = await run.call(invocation.tool, {
    ...invocation.arguments,
    inspection: 'defer'
  })

  expect(outcome.value.actionResults[0].result.status).toBe('complete')
  expect(run.replies).toHaveLength(calls + 1)
  expect(
    run.execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
})

it('rejects invalid projected ovals before canonical writes and executes the corrected retained geometry once', async () => {
  const run = setup()
  const response = await run.call('describe_design_apis', sampledEllipse.query)
  const invocation = ownerInvocation(
    response.value.tools[0].invocationExample.invocation
  )
  const correct = { ...invocation.arguments, inspection: 'defer' }

  for (const patch of [
    {
      ellipse: {
        center: { x: 0, y: 0, z: 0 },
        u: { x: 1, y: 0, z: 0 },
        v: { x: 2, y: 0, z: 0 }
      }
    },
    {
      vertices: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 }
      ]
    }
  ]) {
    const invalid = structuredClone(correct)

    Object.assign(invalid.draft.children[0].members[0], patch)
    const rejected = await run.call(invocation.tool, invalid)

    expect(rejected.success).toBe(false)
    expect(run.created).toHaveLength(0)
    expect(run.execute).not.toHaveBeenCalled()
  }

  const repaired = await run.call(invocation.tool, correct)

  expect(repaired.value.actionResults[0].result.status).toBe('complete')
  expect(
    run.execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
  const retained = structuredClone(run.created)

  await run.call('describe_design_apis', {
    ...sampledEllipse.query,
    refresh: true,
    refreshReason: 'delivery-failure'
  })
  expect(run.created).toEqual(retained)
  expect(
    run.execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
})

it('replays saved cross-tool field queries in one bounded reply and executes owner-delivered queries', async () => {
  const t = setup(0, 'Unrelated capability', 10000, true)

  for (const saved of [
    historical_fieldRecovery.usage,
    historical_fieldRecovery.query
  ]) {
    const raw = JSON.stringify(saved.input)

    expect(Buffer.byteLength(raw)).toBe(saved.bytes)
    expect(createHash('sha256').update(raw).digest('hex')).toBe(saved.sha256)
  }

  const declaration = t.owners
    .flatMap((owner) => owner.definitions)
    .find((entry) => entry.name === 'describe_design_apis')

  if (!declaration) {
    throw new Error('Missing discovery declaration')
  }

  expect(declaration.description).toContain('fieldQuery example')
  const usage = await t.call('describe_design_apis', fieldRecovery.usage.input)

  expect(usage.success).toBe(true)
  const mixed = await t.call('describe_design_apis', fieldRecovery.query.input)

  expect(JSON.parse(mixed.text).toolOutcome).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(
    mixed.value.tools.map(
      (entry: { definition: { coverage: string } }) => entry.definition.coverage
    )
  ).toEqual(['partial', 'none'])
  expect(t.calls).toHaveLength(2)
  expect(JSON.parse(mixed.text).contentDelivery).toBeUndefined()
  expect(Buffer.byteLength(mixed.text)).toBeLessThanOrEqual(24000)
  const handoffBytes = t.replies.reduce(
    (sum, reply) =>
      sum +
      Buffer.byteLength(JSON.stringify(reply.input)) +
      Buffer.byteLength(reply.raw),
    0
  )

  // Compare the failed-field reply itself; historical usage lacked full results.
  expect(Buffer.byteLength(mixed.text)).toBeLessThan(
    fieldRecovery.baseline.mixedContentBytes
  )
  const selected = usage.value.tools.find(
    (entry: { name: string }) => entry.name === 'select_design_references'
  )

  expect(selected.fieldQuery).toBeDefined()
  const example = await t.call(
    selected.fieldQuery.tool,
    selected.fieldQuery.arguments
  )

  expect(example.success).toBe(true)
  expect(example.value.tools).toHaveLength(1)
  const required = await t.call(selected.fieldQuery.tool, {
    ...selected.fieldQuery.arguments,
    schemaPaths: selected.inputFields
  })

  expect(required.success).toBe(true)
  expect(required.value.tools[0].schemaFragments).toEqual(
    mixed.value.tools[0].schemaFragments
  )
  expect(required.value.tools[0].schemaContext).toEqual(
    mixed.value.tools[0].schemaContext
  )
  expect(required.value.tools[0].schemaReferences).toEqual(
    mixed.value.tools[0].schemaReferences
  )
  const failed = mixed.value.tools[1]

  expect(
    failed.schemaResolution.issues.map((issue: { path: string }) => issue.path)
  ).toEqual([...fieldRecovery.query.input.schemaPaths].sort())
  const recovered = await t.call(
    failed.definition.recover.tool,
    failed.definition.recover.arguments
  )

  expect(recovered.value.tools).toHaveLength(1)
  const next = recovered.value.tools[0].fieldQuery

  expect((await t.call(next.tool, next.arguments)).success).toBe(true)
  process.stdout.write(
    JSON.stringify({
      measurement: 'field-query-handoff',
      handoffBytes,
      mixedBytes: Buffer.byteLength(mixed.text),
      baselineBytes: fieldRecovery.baseline.handoffBytes
    }) + '\n'
  )
  expect(t.execute).not.toHaveBeenCalled()
  expect(t.compile).not.toHaveBeenCalled()
})

it('bounds failed field navigation and traversal independently of unrelated nested leaves', async () => {
  const measure = async (count: number) => {
    const leafMaps = new Set<object>()
    const properties = Object.fromEntries(
      Array.from({ length: count }, (_, index) => {
        const leaves = { detail: { type: 'string' } }

        leafMaps.add(leaves)

        return [`item${index}`, { type: 'object', properties: leaves }]
      })
    )

    leafMaps.add(properties)
    const schema = {
      type: 'object',
      properties: {
        unrelated: { type: 'object', properties },
        requiredToken: { type: 'string' }
      },
      required: ['requiredToken'],
      additionalProperties: false
    }
    const dispatch = vi.fn()
    const owner = createLocalOperationTools(
      [
        {
          name: AiActionNames.INSPECT_DRAWING,
          description: 'Inspect',
          inputSchema: {}
        }
      ],
      {
        modelActions: (a) => a,

        resolveBatch: (b) => b
      },
      dispatch,
      {
        getNativeTools: () => [
          {
            name: 'nested',
            namespace: 'extension',
            description: 'Nested input',
            inputSchema: schema
          }
        ]
      }
    )
    const definition = owner.definitions.find(
      (entry) => entry.name === 'describe_design_apis'
    )

    if (!definition) {
      throw new Error('Missing discovery definition')
    }

    const entries = vi.spyOn(Object, 'entries')

    try {
      const reply = await invokeLocalTool(
        owner,
        definition,
        { names: ['extension.nested'], schemaPaths: ['/properties/foreign'] },
        new AbortController().signal
      )
      const traversals = entries.mock.calls.filter(([value]) =>
        leafMaps.has(value)
      ).length
      const value = JSON.parse(reply.text)

      expect(traversals).toBe(0)
      expect(value.contentDelivery).toBeUndefined()
      expect(value.tools[0].schemaResolution.inputFields).toEqual([
        '/properties/unrelated',
        '/properties/requiredToken'
      ])
      expect(value.toolOutcome.status).toBe('failed')
      expect(dispatch).not.toHaveBeenCalled()

      return { bytes: Buffer.byteLength(reply.text), traversals }
    } finally {
      entries.mockRestore()
    }
  }

  const large = await measure(1000)
  const small = await measure(1)

  expect(large).toEqual(small)
  process.stdout.write(
    JSON.stringify({ measurement: 'failed-navigation-work', small, large }) +
      '\n'
  )
})

it('delivers complete exact usage without examples and lowers the saved acquisition cost without extra owner work', async () => {
  const run = setup()
  const acquisitionStart = run.deliveries.length
  const queryStart = run.calls.length
  const input = usageAcquisition.calls[0].input
  const query = await run.call('describe_design_apis', input)
  const tool = query.value.tools[0]

  expect(tool.usageGuide?.parameters).toBeDefined()
  expect(tool.definition.nextAction).toBe('execute-with-delivered-contract')
  expect(tool.invocationExample.available).toBe(false)
  const parameters = tool.usageGuide.parameters

  expect(parameters.properties.references.items.required).toEqual([
    'referenceId'
  ])
  expect(
    operationInputIssue({ referenceImageIndexes: [-1] }, parameters)
  ).toBeDefined()
  expect(
    operationInputIssue({ referenceImageIndexes: [], extra: true }, parameters)
  ).toBeDefined()
  // No full/schema-path query supplies the execution input.
  const reply = await run.call(tool.name, {
    referenceImageIndexes: []
  })

  expect(reply.success, reply.text).toBe(true)
  expect(reply.value.referenceImageIndexes).toEqual([])
  expect(run.compile).not.toHaveBeenCalled()
  expect(run.execute).not.toHaveBeenCalled()

  const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value))

  const before = usageAcquisition.calls.reduce(
    (sum, call) => sum + bytes(call.input) + bytes(call.output),
    0
  )
  const acquisition = run.replies
    .slice(acquisitionStart, -1)
    .reduce(
      (total, delivery) =>
        total + bytes(delivery.input) + Buffer.byteLength(delivery.raw),
      0
    )
  const withoutRepeatedUsage = usageAcquisition.calls
    .slice(0, 2)
    .reduce((sum, call) => sum + bytes(call.input) + bytes(call.output), 0)

  expect(acquisition).toBeLessThan(before)
  // The historical two-call reply did not contain the complete result contract.
  expect(
    run.calls
      .slice(queryStart)
      .filter((name) => name === 'describe_design_apis')
  ).toHaveLength(1)
  expect(run.calls.length - queryStart).toBe(2)
  expect(
    run.deliveries.slice(acquisitionStart).every((bytes) => bytes <= 24000)
  ).toBe(true)
  const restored = await run.call(
    'describe_design_apis',
    tool.definition.recover.arguments
  )

  expect(restored.value.tools[0].usageGuide).toEqual(tool.usageGuide)
  const enlarged = setup(1000)
  const more = await enlarged.call('describe_design_apis', input)

  expect(more.value.tools[0]).toEqual(tool)
  expect(enlarged.deliveries.every((bytes) => bytes <= 24000)).toBe(true)
  expect(enlarged.calls).toHaveLength(1)
  expect(run.compile).not.toHaveBeenCalled()
  expect(run.execute).not.toHaveBeenCalled()
  process.stdout.write(
    JSON.stringify({
      measurement: 'complete-usage-acquisition',
      before,
      withoutRepeatedUsage,
      after: acquisition,
      beforeCalls: usageAcquisition.calls.length,
      afterCalls: 1
    }) + '\n'
  )
})

it('keeps exploration separate from executable exact usage and preserves qualified query and partial lookup', async () => {
  const run = setup()
  const exact = (
    await run.call('describe_design_apis', {
      query: 'design.select_design_references',
      view: 'usage',
      includeResultSchema: true
    })
  ).value.tools[0]

  expect(exact.usageGuide.parameters).toBeDefined()
  expect(exact.definition.nextAction).toBe('execute-with-delivered-contract')
  const menu = (
    await run.call('describe_design_apis', {
      query: 'comparison references',
      view: 'usage',
      includeResultSchema: true
    })
  ).value

  expect(menu.tools.length).toBeGreaterThan(0)
  for (const entry of menu.tools) {
    expect(entry.usageGuide).toBeUndefined()
    for (const path of entry.outputFields ?? []) {
      expect(path.split('/properties/').length, path).toBeLessThanOrEqual(2)
    }

    expect(entry.definition).toBeUndefined()
    expect(entry.usage.arguments.names).toEqual([
      `${entry.namespace}.${entry.name}`
    ])
  }

  const partial = await run.call('describe_design_apis', {
    names: ['select_design_references', 'missing_tool'],
    view: 'usage',
    includeResultSchema: true
  })

  expect(partial.value.toolOutcome.status).toBe('partial')
  expect(partial.value.tools[0].usageGuide.parameters).toEqual(
    exact.usageGuide.parameters
  )
  const fields = await run.call(exact.fieldQuery.tool, {
    ...exact.fieldQuery.arguments,
    schemaPaths: ['/properties/references'],
    refresh: true,
    refreshReason: 'missing-fields'
  })

  expect(fields.value.tools[0].definition.coverage).toBe('partial')
  expect(
    fields.value.tools[0].schemaFragments[0].schema.items.required
  ).toContain('referenceId')
  expect(run.execute).not.toHaveBeenCalled()
  expect(run.compile).not.toHaveBeenCalled()
})

it('derives usage scope navigation only for usage and reuses retained delivery without reprojection', async () => {
  const run = setup()
  const scopes = vi.spyOn(workflowDiscovery, 'workflowInputScopes')

  try {
    const full = await run.call('describe_design_apis', {
      names: ['read_design_checks']
    })

    expect(full.value.tools[0].inputSchema).toBeDefined()
    expect(scopes).not.toHaveBeenCalled()
    const fields = await run.call('describe_design_apis', {
      names: ['read_design_checks'],
      schemaPaths: ['/properties']
    })

    expect(fields.value.tools[0].schemaFragments).toHaveLength(1)
    expect(scopes).not.toHaveBeenCalled()
    const usage = await run.call('describe_design_apis', {
      names: ['read_design_checks'],
      view: 'usage',
      includeResultSchema: true
    })

    expect(usage.value.tools[0].usageGuide.parameters).toBeDefined()
    expect(scopes).toHaveBeenCalledTimes(1)
    scopes.mockClear()
    const retained = await run.call('describe_design_apis', {
      fromResult: usage.value.resultKey,
      names: ['read_design_checks']
    })

    expect(retained.value.tools[0].usageGuide).toEqual(
      usage.value.tools[0].usageGuide
    )
    expect(scopes).not.toHaveBeenCalled()
    expect(run.compile).not.toHaveBeenCalled()
    expect(run.execute).not.toHaveBeenCalled()
  } finally {
    scopes.mockRestore()
  }
})

it('assembles selected input once at the final executable usage boundary', async () => {
  const run = setup()
  const definition = run.owners
    .flatMap((owner) => owner.definitions)
    .find((entry) => entry.name === 'prepare_and_apply_design')

  if (!definition) {
    throw new Error('Missing main workflow')
  }

  const scope = { operation: 'draft', nodeTypes: ['rect'] }
  // Guidance owns explanations, not a second parameter preparation that the
  // actual-route assembler would discard or rewrap.
  const guidance = workflowDiscovery.workflowUsageGuide(
    definition.inputSchema,
    scope
  )

  expect(guidance).not.toHaveProperty('parameters')
  const stringify = JSON.stringify
  let preparedRoots = 0

  JSON.stringify = new Proxy(stringify, {
    apply(target, receiver, args) {
      const schema = args[0]

      if (
        schema?.type === 'object' &&
        schema.properties?.draft?.$ref === '#/$defs/readyDraft' &&
        schema.properties?.parts === false
      ) {
        preparedRoots++
      }

      return Reflect.apply(target, receiver, args)
    }
  })
  let response: Awaited<ReturnType<typeof run.call>>

  try {
    response = await run.call('describe_design_apis', {
      names: [definition.name],
      view: 'usage',
      includeResultSchema: true,
      inputScope: scope
    })
  } finally {
    JSON.stringify = stringify
  }

  expect(preparedRoots).toBe(1)
  const tool = response.value.tools[0]
  const invocation = ownerInvocation(tool.invocationExample.invocation)

  expect(
    operationInputIssue(invocation.arguments, tool.usageGuide.parameters)
  ).toBeUndefined()
  const completed = await run.call(invocation.tool, invocation.arguments)

  expect(completed.success).toBe(true)
  expect(completed.value.toolOutcome).toMatchObject({
    status: 'success',
    settlement: 'completed'
  })
  expect(completed.value.completedSteps).toEqual([
    'prepare_design',
    'apply_prepared_design'
  ])
  expect(
    operationInputIssue(completed.value, tool.usageGuide.results)
  ).toBeUndefined()
  expect(
    run.execute.mock.calls.filter(([batch]) =>
      batch.actions.some((action) => action.name === 'apply_prepared_design')
    )
  ).toHaveLength(1)
})

it('preserves composition coverage when the recorded mixed query also permits vectors', async () => {
  const run = setup()
  const guide = (await run.call('describe_design_apis', strictMixedQuery.query))
    .value.tools[0]
  const invocation = ownerInvocation(guide.invocationExample.invocation)
  const draft = invocation.arguments.draft

  expect(draft.linearFields).toBeDefined()
  expect(
    draft.children.some((child: { type: string }) => child.type === 'pattern')
  ).toBe(true)
  expect(JSON.stringify(draft)).toContain('surface-grid')
  expect(JSON.stringify(draft)).toContain(
    '"Glass variant","materialField":"glass"'
  )
  expect(run.deliveries.every((bytes) => bytes <= 24000)).toBe(true)
  // Preserve the owner guidance and explicit creation-map contract together.
  // This mixed four-node contract uses the existing bounded continuation.
  expect(run.deliveries.length).toBeLessThanOrEqual(2)
  recordAcquisitionCost(
    strictMixedQuery.query,
    JSON.stringify(guide),
    run.deliveries
  )
  const result = await run.call(invocation.tool, {
    ...invocation.arguments,
    inspection: 'defer'
  })

  expect(result.value.completedSteps).toContain('apply_prepared_design')
  expect(result.value.toolOutcome.issues).toEqual([])
  expect(run.created.length).toBeGreaterThan(1)
  const vector = ownerInvocation(
    (
      await run.call('describe_design_apis', {
        ...strictMixedQuery.query,
        inputScope: { operation: 'draft', nodeTypes: ['vector'] }
      })
    ).value.tools[0].invocationExample.invocation
  )

  expect(
    vector.arguments.draft.children.map((child: { type: string }) => child.type)
  ).toEqual(['vector'])
  expect(vector.arguments).toEqual(
    strictMixedQuery.receivedExample.invocation.arguments
  )
  const vectorResult = await run.call(vector.tool, {
    ...vector.arguments,
    inspection: 'defer'
  })

  expect(vectorResult.value.completedSteps).toContain('apply_prepared_design')
})

it('delivers the recorded native-detail size condition before capture', async () => {
  const run = setup()
  const tool = (
    await run.call('describe_design_apis', {
      names: ['inspect_drawing'],
      view: 'usage'
    })
  ).value.tools[0]

  expect(inspectionInputSchema.properties.view).toMatchObject({
    description: expect.stringMatching(/entire target.*1024/)
  })
  const description = (
    inspectionInputSchema.properties.view as { description?: string }
  ).description

  expect(JSON.stringify(tool.usageGuide.parameters)).toContain(description)
  expect(run.execute).not.toHaveBeenCalled()
  expect(run.deliveries).toHaveLength(1)
})

// These cases exercise leaf parameter semantics. Host routing is covered by the
// request-sequence integration cases, not by this leaf fixture dispatcher.

it('delivers the recorded phase construction scope without unused authoring groups', async () => {
  const { default: recorded } =
    await import('../../test-data/ai-drawing/fixtures/phase-continuity-20261108.json')
  const f = setup()
  const query = {
    names: ['prepare_and_apply_design'],
    view: 'usage',
    inputScope: {
      operation: 'draft',
      nodeTypes: ['projected-face', 'surface-grid', 'pattern'],
      optionalInputs: []
    }
  }
  const reply = await f.call('describe_design_apis', query)
  const selected = reply.value.tools[0]
  const parameters = selected.usageGuide.parameters

  expect(
    operationInputIssue(
      currentRecordedInput(recorded.body.operations[0].arguments),
      parameters
    )
  ).toBeUndefined()
  expect(
    operationInputIssue(
      {
        ...currentRecordedInput(recorded.body.operations[0].arguments),
        draft: { ...recorded.body.operations[0].arguments.draft, relations: [] }
      },
      parameters
    )
  ).toBeDefined()
  expect(selected.usageGuide.optionalInputs).toEqual(
    expect.arrayContaining(['layout', 'relations', 'sharedFills'])
  )
  const full = await f.call('describe_design_apis', {
    names: query.names,
    view: 'usage',
    inputScope: {
      ...query.inputScope,
      optionalInputs: ['layout', 'relations', 'sharedFills']
    }
  })

  expect(
    operationInputIssue(
      {
        ...currentRecordedInput(recorded.body.operations[0].arguments),
        draft: { ...recorded.body.operations[0].arguments.draft, relations: [] }
      },
      full.value.tools[0].usageGuide.parameters
    )
  ).toBeUndefined()
  const bytes = Buffer.byteLength(JSON.stringify(parameters))
  const expanded = Buffer.byteLength(
    JSON.stringify(full.value.tools[0].usageGuide.parameters)
  )

  expect(bytes).toBeLessThan(expanded)
  process.stdout.write(
    JSON.stringify({
      measurement: 'phase-selected-parameters',
      bytes,
      expanded
    }) + '\n'
  )
})

it('publishes canonical target mapping structure in the recorded construction usage without all result schemas', async () => {
  const { call, created } = setup()
  const result = (
    await call('describe_design_apis', deliveryHandoff.constructionQuery)
  ).value

  expect(result.tools).toHaveLength(1)
  const navigation = result.tools[0].usageGuide.results.structures

  expect(navigation['/createdTargets']).toMatchObject({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        compositionId: expect.any(Object),
        keyToId: { type: 'object', additionalProperties: expect.any(Object) }
      }
    }
  })
  expect(
    operationInputIssue(
      [{ compositionId: 'body', keyToId: { 'panel/x~y': 'element-1' } }],
      navigation['/createdTargets']
    )
  ).toBeUndefined()
  expect(
    operationInputIssue(
      [{ compositionId: 'body', keyToId: { 'panel/x~y': 42 } }],
      navigation['/createdTargets']
    )
  ).toBeDefined()
  expect(JSON.stringify(navigation)).not.toContain('vertices')
  expect(created).toEqual([])
})

it('preserves subtree membership and target-local coordinates in the recorded capture query', async () => {
  const { call, created } = setup()
  const result = (
    await call('describe_design_apis', {
      names: ['inspect_drawing'],
      view: 'usage'
    })
  ).value
  const capture = JSON.stringify(result.tools[0].usageGuide)

  expect(inspectionInputSchema.properties.elementId.description).toContain(
    'subtree'
  )
  expect(inspectionInputSchema.properties.elementId.description).toContain(
    'siblings'
  )
  expect(capture).toContain(
    inspectionInputSchema.properties.elementId.description
  )
  expect(capture).toContain('target-local')
  expect(created).toEqual([])
})

it('keeps the recorded material query a compact navigable candidate menu', async () => {
  const run = setup(0, 'Unrelated capability', 10000, false, [], true)
  const found = (
    await run.call('describe_design_apis', referenceChain.queries[7])
  ).value

  for (const tool of found.tools) {
    expect(tool.usage.arguments.names).toEqual([
      `${tool.namespace}.${tool.name}`
    ])
    expect(tool.inputScopes?.selection).toBeUndefined()
    expect(tool.usageGuide).toBeUndefined()
  }

  const revision = found.tools.find(
    (tool: { name: string }) => tool.name === 'prepare_material_revision'
  )

  expect(revision).toBeDefined()
  expect(revision.match.unmatchedTerms.length).toBeGreaterThan(0)
  const contract = (
    await run.call('describe_design_apis', revision.usage.arguments)
  ).value.tools[0]

  expect(contract.usageGuide.parameters).toBeDefined()
  expect(contract.description).toContain('existing explicit world linear field')
  expect(run.compile).not.toHaveBeenCalled()
  process.stdout.write(
    JSON.stringify({
      measurement: 'reference-run-material-query',
      bytes: Buffer.byteLength(run.replies[0].raw),
      candidates: found.total
    }) + '\n'
  )
})

it('ranks an opaque purpose owner above complete incidental output vocabulary', async () => {
  const run = setup(0, 'Unrelated capability', 10000, false, [
    {
      name: 'a',
      namespace: 'proof',
      description: 'Apply world material fields to existing projected faces',
      inputSchema: {}
    },
    {
      name: 'b',
      namespace: 'proof',
      description: 'Export a receipt',
      inputSchema: {},
      outputSchema: {
        type: 'object',
        properties: {
          note: {
            type: 'string',
            description: 'apply world material field existing projected faces'
          }
        }
      }
    }
  ])
  const found = (
    await run.call('describe_design_apis', referenceChain.queries[7])
  ).value
  const target = found.tools.find((tool: { name: string }) => tool.name === 'a')
  const incidental = found.tools.find(
    (tool: { name: string }) => tool.name === 'b'
  )

  expect(target).toBeDefined()
  expect(incidental).toBeDefined()
  expect(target.rank).toBeLessThan(incidental.rank)
  expect(target.match.nameTerms).toEqual([])
  expect(target.match.unmatchedTerms).toEqual(['field'])
})

it('does not auto-acquire an incidental complete match over the stronger partial purpose', async () => {
  const run = setup(0, 'Unrelated capability', 10000, false, [
    {
      name: 'a',
      namespace: 'proof',
      description: 'Engrave basalt facets with spectral glazes',
      inputSchema: {}
    },
    {
      name: 'b',
      namespace: 'proof',
      description: 'Export a receipt',
      inputSchema: {},
      outputSchema: {
        type: 'object',
        properties: {
          note: {
            type: 'string',
            description: 'engrave basalt facets spectral glaze'
          }
        }
      }
    }
  ])
  const found = (
    await run.call('describe_design_apis', {
      query: 'engrave basalt facets spectral glaze',
      view: 'usage'
    })
  ).value

  expect(found.tools.map((tool: { name: string }) => tool.name)).toEqual([
    'a',
    'b'
  ])
  expect(found.tools[0].match.unmatchedTerms).toEqual(['glaze'])
  expect(found.tools[1].match.unmatchedTerms).toEqual([])
  expect(
    found.tools.every((tool: { usageGuide?: unknown }) => !tool.usageGuide)
  ).toBe(true)
})

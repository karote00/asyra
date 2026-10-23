import { constructDesign } from '../design-construction'
import { measureDesignBudget } from '../design-budget'
import layeredPattern from './fixtures/recorded-101/layered-pattern-20261023.json'
import { expectEquivalentPatternEntries } from './layered-pattern-assertions'
import recoveryFixture from './fixtures/recorded-101/pattern-budget-recovery-20261023.json'
import compositionMaterials from './fixtures/recorded-101/composition-materials-20261022.json'
import componentSelection from './fixtures/recorded-101/component-selection-20261022.json'
import expansionBudget from './fixtures/recorded-101/expansion-budget-20261022.json'
import { DesignPreparationLimits } from '../../src/ai/prepared-design'
import {
  projectWorkflowInput,
  workflowQueryGuidance
} from '../design-workflow-discovery'
import invalidQueryScope from './fixtures/recorded-101/invalid-query-scope-20261022.json'
import operationSelection from './fixtures/recorded-101/operation-selection-20261022.json'
import { runInNewContext } from 'node:vm'
import inspectionDiscovery from './fixtures/recorded-101/inspection-discovery-20261022.json'
import { createHash } from 'node:crypto'
import { designPreparationExamples } from '../design-preparation-examples'
import orderedPreparation from './fixtures/recorded-101/ordered-preparation-20261019.json'
import { readCompleteInformation } from './tool-contract-assertions'
import { expect, it, vi } from 'vitest'
vi.mock('../../src/contexts', () => ({ default: {} }))
import { createPreparedDesignAction } from '../../src/ai/design-actions'
import type { PreparedElementDescriptor } from '../../src/common-apis'
import recorded from './fixtures/recorded-101/discovery-delivery-20261020.json'
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

const setup = (
  unrelatedCount = 0,
  description = 'Unrelated capability',
  expandedNodeLimit = 10000
) => {
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
  const parents = new Map<string, string>()
  const apply = createPreparedDesignAction(
    {
      getWorkspaceId: () => 'workspace',
      getElementType: (id) => created.find((entry) => entry.id === id)?.type,
      getElementMetadata: (id) => {
        const entry = created.find((item) => item.id === id)
        return entry
          ? { type: entry.type, parentId: parents.get(id) }
          : undefined
      },
      getPlacement: (id) => created.find((entry) => entry.id === id),
      isContainerType: (type) => ['group', 'frame'].includes(type),
      isLocked: () => false,
      create: (entries, parentId) => {
        for (const entry of entries) parents.set(entry.id, parentId)
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
        result: await apply.execute(action.arguments, {
          signal: new AbortController().signal
        } as never)
      }))
    )
  }))
  const operations = createLocalOperationTools(actions, designs, execute, {
    getNativeTools: () => [
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
  const owners = [designs, operations, workflow]
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
    if (!owner) throw new Error(`Missing owner: ${name}`)
    const definition = owner.definitions.find((item) => item.name === name)
    if (!definition) throw new Error(`Missing definition: ${name}`)
    const reply = await invokeLocalTool(owner, definition, args, signal)
    deliveries.push(Buffer.byteLength(reply.text))
    replies.push({ input: args, raw: reply.text })
    const text = await readCompleteInformation(async (input) => {
      if (input === args) return reply.text
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

it('delivers recorded full contracts and publishes executable high-level usage without replay on recovery', async () => {
  const { call, compile, execute, owners, created, calls } = setup()
  const full = (await call('describe_design_apis', recorded.calls[0].input))
    .value
  for (const name of ['prepare_and_apply_design', 'define_design_criteria']) {
    const definition = owners
      .flatMap((owner) => owner.definitions)
      .find((item) => item.name === name)
    if (!definition) throw new Error(`Missing definition: ${name}`)
    expect(
      full.tools.find((tool: { name: string }) => tool.name === name)
        .inputSchema
    ).toEqual(definition.inputSchema)
    const usage = (
      await call('describe_design_apis', { names: [name], view: 'usage' })
    ).value.tools[0]
    expect(Buffer.byteLength(JSON.stringify(usage))).toBeLessThan(
      Buffer.byteLength(
        JSON.stringify(
          full.tools.find((tool: { name: string }) => tool.name === name)
        )
      )
    )
    expect(usage.invocationExample.illustrative).toBe(true)
    const invocation = usage.invocationExample.invocation
    expect(invocation.tool).toBe(name)
    expect(
      operationInputIssue(invocation.arguments, definition.inputSchema)
    ).toBeUndefined()
    const reply = await call(invocation.tool, invocation.arguments)
    if (name === 'prepare_and_apply_design') {
      expect(reply.success).toBe(false)
      expect(reply.value).toMatchObject({
        toolOutcome: {
          status: 'partial',
          settlement: 'completed',
          issues: [expect.objectContaining({ code: 'FOLLOWUP_UNAVAILABLE' })]
        },
        actionResults: [{ result: { status: 'complete' } }]
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
  expect(execute).toHaveBeenCalledTimes(1)
  const restored = (await call('describe_design_apis', recorded.calls[1].input))
    .value.tools[0]
  expect(restored.inputSchema).toEqual(full.tools[0].inputSchema)
  expect(calls.filter((name) => name === 'describe_design_apis')).toHaveLength(
    6
  )
  expect(execute).toHaveBeenCalledTimes(1)
})

it('navigates actual local definitions and preserves selected constraints and recovery scope', async () => {
  const { call, execute } = setup()
  const names = ['prepare_and_apply_design']
  const usage = (await call('describe_design_apis', { names, view: 'usage' }))
    .value.tools[0]
  const path = '/$defs/node/anyOf/0/properties/type'
  expect(usage.inputFields).toContain('/properties/draft')
  expect(
    usage.inputFields.every((field: string) => field.split('/').length === 3)
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
  expect(missing.schemaResolution.inputFields).toContain(path)
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
      view: 'usage'
    })
  ).value.tools[0]
  const args = usage.invocationExample.invocation.arguments
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
    ...recovery.invocationExample.invocation.arguments,
    inspection: 'defer'
  })
  expect(retry.success).toBe(false)
  expect(retry.value).toMatchObject({
    toolOutcome: {
      status: 'partial',
      settlement: 'completed',
      issues: [expect.objectContaining({ code: 'FOLLOWUP_UNAVAILABLE' })]
    },
    actionResults: [{ result: { status: 'complete' } }]
  })
  expect(second.compile).toHaveBeenCalledTimes(1)
  expect(second.execute).toHaveBeenCalledTimes(1)
  expect(first.execute).not.toHaveBeenCalled()
})

it('navigates the criteria dictionary without dropping its conditional required fields', async () => {
  const { call } = setup()
  const names = ['define_design_criteria']
  const usage = (await call('describe_design_apis', { names, view: 'usage' }))
    .value.tools[0]
  const path =
    '/properties/criteria/additionalProperties/properties/requirement'
  expect(usage.inputFields).toContain('/properties/criteria')
  expect(
    usage.inputFields.every((field: string) => field.split('/').length === 3)
  ).toBe(true)
  const full = (await call('describe_design_apis', { names })).value.tools[0]
  const partial = (
    await call('describe_design_apis', { names, schemaPaths: [path] })
  ).value.tools[0]
  const criterion = full.inputSchema.properties.criteria.additionalProperties
  expect(partial.schemaFragments[0].schema).toEqual(
    criterion.properties.requirement
  )
  expect(partial.schemaContext).toContainEqual({
    path: '/properties/criteria/additionalProperties',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: criterion.required,
      oneOf: criterion.oneOf,
      allowedProperties: Object.keys(criterion.properties)
    }
  })
})

import { runInNewContext } from 'node:vm'

it('uses the delivered forwarding example to invoke the owner and recover information without replaying writes', async () => {
  const { call, owners, execute, created } = setup()
  const operations = owners.find((owner) =>
    owner.definitions.some((d) => d.name === 'describe_design_apis')
  )
  if (!operations) throw new Error('Missing discovery owner')
  const definition = operations.definitions.find(
    (d) => d.name === 'describe_design_apis'
  )
  if (!definition) throw new Error('Missing discovery definition')
  const code =
    /Information forwarding example[^\n]*\n```javascript\n([\s\S]*?)\n```/.exec(
      definition.description
    )?.[1]
  expect(code).toBeTruthy()
  if (!code) throw new Error('Missing advertised example')
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
  const outputs: string[] = []
  const forward = (result: string, deliveryKey: string) =>
    runInNewContext(code, {
      result,
      deliveryKey,
      load: (key: string) => retained.get(key),
      store: (key: string, value: never) => retained.set(key, value),
      text: (value: string) => outputs.push(value)
    })
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
      forward(reply.text, key)
      pages.push(reply.text)
      const page = JSON.parse(reply.text).contentDelivery
      if (!page || page.lastPage) return pages
      input = page.next.arguments
    }
    throw new Error('Missing terminal information page')
  }
  const pages = await read(
    { names: ['prepare_and_apply_design'], view: 'usage' },
    'usage'
  )
  const invocation =
    retained.get('usage')?.value?.tools[0].invocationExample.invocation
  if (!invocation) throw new Error('Missing delivered invocation')
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
  for (const page of pages) forward(page, 'usage')
  expect(outputs.slice(-pages.length)).toEqual(pages)
  retained.clear()
  await read(
    {
      names: ['prepare_and_apply_design'],
      view: 'usage',
      refresh: true,
      refreshReason: 'delivery-failure'
    },
    'restored'
  )
  expect(
    retained.get('restored')?.value?.tools[0].invocationExample.invocation
  ).toEqual(invocation)
  expect(execute).toHaveBeenCalledOnce()
  expect(created).toEqual(before)
})

it('delivers a complete selected operation with fewer first-use bytes and calls', async () => {
  const baseline = setup()
  const names = ['prepare_and_apply_design']
  await baseline.call('describe_design_apis', { names, view: 'usage' })
  const full = (await baseline.call('describe_design_apis', { names })).value
    .tools[0]
  const run = setup()
  const usage = (
    await run.call('describe_design_apis', { names, view: 'usage' })
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
  ])
    expect(tool[field]).toEqual(full[field])
  const example = usage.invocationExample.invocation
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
    status: 'partial',
    settlement: 'completed'
  })
  const recovered = (
    await run.call('describe_design_apis', tool.definition.recover.arguments)
  ).value.tools[0]
  expect(recovered.inputSchema).toEqual(tool.inputSchema)
  expect(recovered.definition.recover.arguments.inputScope).toEqual(inputScope)
  expect(run.execute).toHaveBeenCalledTimes(1)
})

it('keeps purpose discovery bounded with unrelated tools and preserves intentional inventory', async () => {
  const small = setup()
  const large = setup(10000)
  const args = { query: 'ready part' }
  const a = await small.call('describe_design_apis', args)
  const b = await large.call('describe_design_apis', args)
  expect(b.value.tools).toEqual(a.value.tools)
  expect(large.deliveries).toEqual(small.deliveries)
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
    await run.call('describe_design_apis', { names, view: 'usage' })
  ).value.tools[0]
  const cases = [...designPreparationExamples, orderedPreparation.input]
  for (const input of cases) {
    const nodeTypes = new Set<string>()
    const visit = (value: unknown) => {
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') {
        const object = value as Record<string, unknown>
        if (usage.inputScopes.nodeTypes.includes(object.type))
          nodeTypes.add(String(object.type))
        Object.values(object).forEach(visit)
      }
    }
    visit(input)
    const inputScope = {
      operation: 'parts' in input ? 'parts' : 'draft',
      nodeTypes: [...nodeTypes]
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
  ])
    expect((await run.call('describe_design_apis', args)).success).toBe(false)
  expect(run.execute).not.toHaveBeenCalled()
})

it.each([
  { nodeTypes: ['group', 'projected-face', 'pattern'] },
  { nodeTypes: ['group', 'surface-grid'] }
])(
  'forwards the actual selected usage guide through native Code Mode without truncation $nodeTypes',
  async ({ nodeTypes }) => {
    const run = setup()
    const inputScope = { operation: 'draft', nodeTypes }
    await run.call('describe_design_apis', {
      names: ['prepare_and_apply_design'],
      inputScope,
      view: 'usage'
    })
    const definition = run.owners
      .flatMap((owner) => owner.definitions)
      .find((tool) => tool.name === 'describe_design_apis')
    if (!definition) throw new Error('Missing discovery definition')
    const code =
      /Information forwarding example[^\n]*\n```javascript\n([\s\S]*?)\n```/.exec(
        definition.description
      )?.[1]
    if (!code) throw new Error('Missing delivered forwarding example')
    const namespace = 'design_operations'
    const executions = run.replies.map((page, index) => ({
      input: page.input,
      reply: page.raw,
      code: `const deliveryKey = "selected"; const result = await tools.${namespace}__${definition.name}(${index ? 'load(deliveryKey).next.arguments' : JSON.stringify(page.input)});\n${code}`,
      expected: page.raw
    }))
    const nativeModule = new URL(
      '../../test-data/knowledge-evaluation/native-delivery.mjs',
      import.meta.url
    ).href
    const { runNativeDelivery } = await import(/* @vite-ignore */ nativeModule)
    const result = await runNativeDelivery({
      mode: 'code',
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
    status: 'partial',
    settlement: 'completed',
    issues: [expect.objectContaining({ code: 'FOLLOWUP_UNAVAILABLE' })]
  })
  expect(repaired.success).toBe(false)
  expect(repaired.value.completedSteps).toEqual([
    'prepare_design',
    'apply_prepared_design'
  ])
  expect(run.execute).toHaveBeenCalledTimes(1)
  const guide = (
    await run.call('describe_design_apis', { names, inputScope, view: 'usage' })
  ).value.tools[0]
  expect(guide.usageGuide.recovery).toContain('Never replay completed writes')
  await run.call('describe_design_apis', guide.definition.recover.arguments)
  const expired = await run.call('prepare_and_apply_design', {
    repair: { ...args.repair, draftId: 'missing-retained-draft' },
    inspection: 'defer'
  })
  expect(expired.success).toBe(false)
  expect(run.execute).toHaveBeenCalledTimes(1)
  await run.call('describe_design_apis', scoped.definition.recover.arguments)
  const cancellation = new AbortController()
  cancellation.abort()
  await expect(
    run.call('describe_design_apis', { names, inputScope }, cancellation.signal)
  ).rejects.toMatchObject({ name: 'AbortError' })
  expect(run.execute).toHaveBeenCalledTimes(1)
})

it('retains actual writes when selected draft and parts follow-up is unavailable', async () => {
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
    expect(reply.success).toBe(false)
    expect(reply.value.toolOutcome.status).toBe('partial')
    const guide = (
      await run.call('describe_design_apis', {
        names,
        inputScope: { operation, nodeTypes: ['vector'] },
        view: 'usage'
      })
    ).value.tools[0]
    expect(guide.usageGuide.results).toContain(
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
    expect(run.deliveries.length - before).toBe(1)
    expect(run.deliveries.at(-1)).toBeLessThan(23000)
    expect(run.deliveries.length).toBeLessThan(baseline.deliveries.length)
    expect(run.deliveries.reduce((sum, bytes) => sum + bytes, 0)).toBeLessThan(
      baseline.deliveries.reduce((sum, bytes) => sum + bytes, 0)
    )
    const tool = reply.value.tools[0]
    expect(tool.definition.coverage).toBe('scoped-usage')
    expect(tool.inputSchema).toBeUndefined()
    expect(tool.outputSchema).toBeUndefined()
    expect(tool.partialOutputSchema).toBeUndefined()
    expect(tool.recoveryOutputSchema).toBeUndefined()
    expect(tool.usageGuide.parameters).toContain('required')
    expect(tool.usageGuide.parameters).toContain('100000')
    expect(tool.usageGuide.recovery).toContain('Never replay completed writes')
    expect(tool.description).not.toContain('without changing the canvas')
    const example = tool.invocationExample.invocation
    expect(example.tool).toBe('prepare_and_apply_design')
    const full = (await run.call('describe_design_apis', { names, inputScope }))
      .value.tools[0]
    expect(
      operationInputIssue(example.arguments, full.inputSchema)
    ).toBeUndefined()
    const result = await run.call(example.tool, example.arguments)
    expect(result.value.toolOutcome.settlement).toBe('completed')
    expect(run.created.length).toBeGreaterThan(0)
    expect(run.execute).toHaveBeenCalledOnce()
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
    expect(run.execute).toHaveBeenCalledOnce()
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

it('selects optional criteria in the same read without omitting required drawing constraints', async () => {
  const run = setup()
  const names = ['prepare_and_apply_design']
  const scope = { operation: 'draft', nodeTypes: ['vector'] }
  const plain = (
    await run.call('describe_design_apis', { names, inputScope: scope })
  ).value.tools[0]
  expect(plain.inputSchema.properties.plan).toBe(false)
  const selected = await run.call('describe_design_apis', {
    names,
    inputScope: { ...scope, optionalInputs: ['plan'] }
  })
  expect(selected.success).toBe(true)
  expect(selected.value.tools[0].inputSchema.properties.plan).toMatchObject({
    type: 'object'
  })
  for (const optionalInputs of [['missing'], ['plan', 'plan'], ['draft']]) {
    const rejected = await run.call('describe_design_apis', {
      names,
      inputScope: { ...scope, optionalInputs }
    })
    expect(rejected.success).toBe(false)
  }
  expect(run.execute).not.toHaveBeenCalled()
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
        view: 'usage'
      })
    ).value.tools[0]
    const text = guide.usageGuide.parameters
    const structural = new Set([
      '$defs',
      '$ref',
      'type',
      'properties',
      'items',
      'additionalProperties',
      'propertyNames',
      'anyOf',
      'oneOf',
      'allOf',
      'description',
      'examples'
    ])
    const check = (schema: unknown) => {
      if (!schema || typeof schema !== 'object') return
      if (Array.isArray(schema)) {
        schema.forEach(check)
        return
      }
      for (const [key, value] of Object.entries(schema)) {
        if (key === 'examples') continue
        if (key === 'description') expect(text).toContain(value)
        else if (key === '$ref')
          expect(text).toContain(String(value).replace('#/$defs/', ''))
        else if (!structural.has(key))
          expect(text).toContain(`${key}=${JSON.stringify(value)}`)
        else if (key === 'properties' || key === '$defs')
          Object.values(value as object).forEach(check)
        else check(value)
      }
    }
    check(full.inputSchema)
    expect(text).toContain('oneOf exactly one')
    expect(text).toContain('oneOf(')
    expect(text).toContain('additional=forbidden')
    const example = guide.invocationExample.invocation.arguments
    for (const args of [
      { ...example, repair: {} },
      { ...example, parts: [] },
      { ...example, plan: {} }
    ]) {
      expect(operationInputIssue(args, full.inputSchema)).toBeDefined()
    }
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
    view: 'usage'
  }
  const a = await small.call('describe_design_apis', args)
  const b = await large.call('describe_design_apis', args)
  expect(b.value).toEqual(a.value)
  expect(large.deliveries).toEqual(small.deliveries)
  expect(large.deliveries).toHaveLength(1)
  const complete = await large.call('describe_design_apis', {
    names: args.names
  })
  expect(complete.value.tools[0].inputSchema.properties.plan).not.toBe(false)
  expect(complete.value.tools[0].outputSchema).toBeDefined()
  expect(large.execute).not.toHaveBeenCalled()
})

it('rejects recorded foreign inspection fields and executes each narrower recovery without writes', async () => {
  const { call, execute, owners } = setup()
  const definition = owners
    .flatMap((owner) => owner.definitions)
    .find((d) => d.name === 'describe_design_apis')
  if (!definition) throw new Error('Missing discovery definition')
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
  expect(definition.description).toContain('parallel')
  expect(failed.value.toolOutcome).toMatchObject({
    status: 'failed',
    settlement: 'completed'
  })
  expect(failed.value.toolOutcome.issues.length).toBeGreaterThan(0)
  const expectedPaths: Record<string, string[]> = {
    review_drawing: ['/properties/inspections'],
    define_design_criteria: [
      '/properties/criteria',
      '/properties/detailRequired',
      '/properties/method'
    ]
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
    if (!canonical) throw new Error('Missing selected canonical owner')
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
  const names = inspectionDiscovery.query.names
  const mixed = await call('describe_design_apis', {
    names,
    schemaPaths: ['/properties/inspections']
  })
  expect(mixed.success).toBe(false)
  expect(mixed.value.toolOutcome).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(mixed.value.tools[0].schemaFragments[0].path).toBe(
    '/properties/inspections'
  )
  expect(mixed.value.tools[1].definition.coverage).toBe('none')
  const shared = await call('describe_design_apis', {
    names,
    schemaPaths: ['/properties/phase']
  })
  expect(shared.success).toBe(true)
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
    (
      await call('describe_design_apis', {
        names: ['review_drawing', 'missing-tool'],
        view: 'usage'
      })
    ).value.toolOutcome.status
  ).toBe('partial')
  await expect(
    call('describe_design_apis', { names }, AbortSignal.abort())
  ).rejects.toThrow()
  expect(execute).not.toHaveBeenCalled()
})

it('forwards paged partial discovery through the published example without promoting coverage or replaying writes', async () => {
  const { owners, call, execute } = setup()
  const usage = (
    await call('describe_design_apis', {
      names: ['prepare_and_apply_design'],
      view: 'usage',
      inputScope: { operation: 'draft', nodeTypes: ['vector'] }
    })
  ).value.tools[0]
  await call(
    usage.invocationExample.invocation.tool,
    usage.invocationExample.invocation.arguments
  )
  const writes = execute.mock.calls.length
  const owner = owners.find((o) =>
    o.definitions.some((d) => d.name === 'describe_design_apis')
  )
  if (!owner) throw new Error('Missing discovery owner')
  const definition = owner.definitions.find(
    (d) => d.name === 'describe_design_apis'
  )
  if (!definition) throw new Error('Missing discovery definition')
  const example =
    /Information forwarding example[^\n]*\n```javascript\n([\s\S]*?)\n```/.exec(
      definition.description
    )?.[1]
  if (!example) throw new Error('Missing forwarding example')
  const values = new Map<string, unknown>()
  const printed: string[] = []
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
    runInNewContext(example, {
      result: reply.text,
      deliveryKey: 'partial-contract',
      text: (v: string) => printed.push(v),
      load: (k: string) => values.get(k),
      store: (k: string, v: unknown) => values.set(k, v)
    })
    expect(printed.at(-1)).toBe(reply.text)
    if (!receipt.contentDelivery || receipt.contentDelivery.lastPage) break
    args = receipt.contentDelivery.next.arguments
  }
  expect(pages).toBeGreaterThan(0)
  expect(pages).toBeLessThan(30)
  expect(values.get('partial-contract')).toMatchObject({
    complete: true,
    value: { status: 'partial', missingNames: ['missing-tool'] }
  })
  const refresh = await call('describe_design_apis', {
    names: ['review_drawing'],
    schemaPaths: ['/properties/phase'],
    refresh: true,
    refreshReason: 'delivery-failure'
  })
  expect(refresh.success).toBe(true)
  expect(execute).toHaveBeenCalledTimes(writes)
})

it('explains next-part representation choices in the first existing discovery reply', async () => {
  for (const input of [
    operationSelection.query,
    { query: 'ready part' },
    { names: ['prepare_and_apply_design'], view: 'usage' }
  ]) {
    const run = setup()
    const reply = await run.call('describe_design_apis', input)
    const tool = reply.value.tools.find(
      (entry: { name: string }) => entry.name === 'prepare_and_apply_design'
    )
    expect(tool.inputScopes.selection).toEqual(expect.any(String))
    expect(tool.inputScopes.selection).toContain('next submitted part')
    expect(tool.inputScopes.selection).toContain('root group/frame')
    expect(tool.inputScopes.selection).toContain('nodeTypes selects children')
    expect(tool.inputScopes.selection).toContain('does not require sending')
    expect(tool.inputScopes.selection).toContain('projected-face')
    expect(tool.inputScopes.selection.toLowerCase()).toContain('translation')
    expect(tool.inputScopes.selection).toContain('four-corner')
    expect(tool.inputScopes.selection).toContain('surface-grid')
    expect(tool.inputScopes.selection).toContain('No Knowledge')
    expect(run.deliveries).toHaveLength(1)
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
        inputScope: { operation: 'draft', nodeTypes }
      })
      expect(run.deliveries).toHaveLength(2)
      expect(run.deliveries.reduce((n, bytes) => n + bytes, 0)).toBeLessThan(
        operationSelection.firstQueryBytes +
          operationSelection.selectedGuideBytes
      )
      const guide = reply.value.tools[0]
      expect(guide.invocationExample.invocation).toBeDefined()
      expect(guide.usageGuide.results).toContain(
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
      const first = (
        await run.call('describe_design_apis', {
          names,
          view: 'usage',
          inputScope: {
            operation: 'draft',
            nodeTypes: ['group', 'projected-face']
          }
        })
      ).value.tools[0].invocationExample.invocation
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
        inputScope: scope
      })
    ).value.tools[0]
    expect(guide.invocationExample.invocation).toBeDefined()
    const example = guide.invocationExample.invocation
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
      status: 'partial',
      settlement: 'completed'
    })
    expect(result.value.completedSteps).toEqual([
      'prepare_design',
      'apply_prepared_design'
    ])
    expect(run.created.slice(0, before.length)).toEqual(before)
    expect(run.created.length).toBeGreaterThan(before.length)
    if (parentId)
      expect(
        run.created
          .slice(before.length)
          .some((n) => run.parents.get(n.id) === parentId)
      ).toBe(true)
    const after = structuredClone(run.created)
    for (const input of [
      guide.definition.recover.arguments,
      guide.definition.refresh.arguments
    ])
      await run.call('describe_design_apis', input)
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
        inputScope: {
          operation: 'draft',
          nodeTypes: ['surface-grid'],
          optionalInputs: ['plan']
        }
      })
    ).value.tools[0]
    expect(guide.usageGuide.instructions).toContain('root group/frame')
    expect(guide.usageGuide.instructions).toContain(
      'nodeTypes selects children'
    )
    expect(guide.usageGuide.selection).toContain('does not require sending')
    expect(guide.usageGuide.selection).toContain('without rereading')
    const invocation = guide.invocationExample.invocation
    const args = structuredClone(invocation.arguments)
    args.draft.type = rootType
    if (rootType === 'frame')
      Object.assign(args.draft, { width: 100, height: 100 })
    args.inspection = 'defer'
    expect(args.plan).toBeUndefined()
    const result = await run.call(invocation.tool, args)
    expect(result.value.toolOutcome).toMatchObject({
      status: 'partial',
      settlement: 'completed'
    })
    expect(result.value.actionResults[0].result.status).toBe('complete')
    const rootId = result.value.actionResults[0].result.compositionId
    expect(run.created.find((entry) => entry.id === rootId)?.type).toBe(
      rootType
    )
    expect(run.execute).toHaveBeenCalledOnce()
    expect(
      run.calls.filter((name) => name === 'describe_design_apis')
    ).toHaveLength(1)
    const saved = structuredClone(run.created)
    await run.call('describe_design_apis', guide.definition.refresh.arguments)
    expect(run.created).toEqual(saved)
    expect(run.execute).toHaveBeenCalledOnce()
  }
)

it('keeps root and nested frame constraints distinct from optional plan documentation', async () => {
  const run = setup()
  const names = ['prepare_and_apply_design']
  const inputScope = {
    operation: 'draft',
    nodeTypes: ['group', 'projected-face'],
    optionalInputs: ['plan']
  }
  const first = (await run.call('describe_design_apis', { names, inputScope }))
    .value.tools[0]
  const usage = (
    await run.call('describe_design_apis', { names, inputScope, view: 'usage' })
  ).value.tools[0]
  const args = structuredClone(usage.invocationExample.invocation.arguments)
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
  for (const invalid of [missingHeight, sizedGroup, invalidPlan])
    expect((await run.call('prepare_and_apply_design', invalid)).success).toBe(
      false
    )
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
    status: 'partial',
    settlement: 'completed'
  })
  expect(run.created.filter((entry) => entry.type === 'frame')).toHaveLength(2)
  expect(run.execute).toHaveBeenCalledOnce()
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
    expect(run.deliveries[0]).toBeLessThan(5000)
    const guide = reply.value.tools[0]
    expect(guide.inputScopes.selection).toContain('nodeTypes selects children')
    const invocation = guide.invocationExample.invocation
    const result = await run.call(invocation.tool, {
      ...invocation.arguments,
      inspection: 'defer'
    })
    expect(result.value.toolOutcome).toMatchObject({
      status: 'partial',
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
    expect(run.execute).toHaveBeenCalledOnce()
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
  ])
    expect(full[key]).toEqual(exact[key])
  const repeated = await run.call('describe_design_apis', {
    query: '  ' + name + '  ',
    view: 'usage'
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
  const invocation = ready.value.tools[0].invocationExample.invocation
  expect(invocation).toBeDefined()
  expect(run.execute).not.toHaveBeenCalled()
  const applied = await run.call(invocation.tool, {
    ...invocation.arguments,
    inspection: 'defer'
  })
  expect(applied.value.toolOutcome).toMatchObject({
    status: 'partial',
    settlement: 'completed'
  })
  expect(applied.value.completedSteps).toContain('apply_prepared_design')
  expect(applied.value.measurementIssues[0].recovery).toContain(
    'Do not replay writes'
  )
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
    if (!definition) throw new Error('Missing main tool')
    const value = workflowQueryGuidance(definition.name, definition.inputSchema)
    if (!value) throw new Error('Missing scope guidance')
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
    expect(run.deliveries.length - before).toBe(1)
  }
  expect(large.deliveries).toEqual(small.deliveries)
  const definition = small.owners
    .flatMap((owner) => owner.definitions)
    .find((item) => item.name === 'prepare_and_apply_design')
  if (!definition) throw new Error('Missing main tool')
  const schema = definition.inputSchema as {
    'x-design-input-scope': {
      selection: string
      optionalInputs: string[]
      queryExample: { operation: string; nodeTypes: string[] }
    }
  }
  const choices = schema['x-design-input-scope']
  expect(selection).toBe(choices.selection)
  choices.optionalInputs = []
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
  expect(corrected.value.tools[0].usageGuide.parameters).toContain('plan')
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
  if (!definition) throw new Error('Missing workflow definition')
  const guidance = workflowQueryGuidance(
    definition.name,
    definition.inputSchema
  )
  if (!guidance) throw new Error('Missing workflow guidance')
  expect(guidance.operationUsage.draft).toContain(
    String(DesignPreparationLimits.expandedNodes)
  )
  expect(guidance.operationUsage.parts).toContain('each part')
  const result = await run.call('describe_design_apis', {
    names: [definition.name],
    view: 'usage',
    inputScope: {
      operation: 'draft',
      nodeTypes: ['surface-grid', 'projected-face']
    }
  })
  const guide = result.value.tools[0].usageGuide
  expect(guide.parameters).toContain('rows*columns*resolved motifs')
  expect(guide.parameters).toContain('surfaceMotifs')
  expect(guide.parameters).toContain('motifTemplates')
  expect(guide.instructions).toContain('root and nested containers')
  expect(guide.instructions).toContain('not increase artifact capacity')
  expect(guide.recovery).toContain('parts')
  expect(run.execute).not.toHaveBeenCalled()
  const invocation = result.value.tools[0].invocationExample.invocation
  const source = structuredClone(invocation.arguments.draft)
  const grid = source.children[2].members[0]
  const motifs = source.motifTemplates[grid.motifs.template]
  expect(motifs).toHaveLength(1)
  motifs.push({ ...structuredClone(motifs[0]), key: 'accent', fill: '#654321' })
  const inline = structuredClone(source)
  inline.children[2].members[0].motifs = structuredClone(motifs)
  delete inline.motifTemplates
  // Root + two panels + cap + two instances of a 2x3 grid with two motifs.
  for (const input of [source, inline]) {
    const budget = measureDesignBudget(input)
    expect(budget.observed.expandedNodes).toBe(28)
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
  expect(expected.entries).toHaveLength(28)
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
    inputScope: { operation: 'parts', nodeTypes: ['group', 'rect'] }
  })
  const invocation = result.value.tools[0].invocationExample.invocation
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
  if (!source) throw new Error('Missing recorded grid')
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
    inputScope: { operation: 'parts', nodeTypes: ['group', 'rect'] }
  })
  const invocation = guide.value.tools[0].invocationExample.invocation
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
  expect(run.execute).toHaveBeenCalledTimes(1)
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
  if (!definition) throw new Error('Missing main tool')
  const initial = workflowQueryGuidance(definition.name, definition.inputSchema)
  if (!initial) throw new Error('Missing owner query example')
  const query = initial.example.arguments
  expect(query.inputScope).toEqual({
    operation: 'draft',
    nodeTypes: ['pattern']
  })
  expect(initial.inputScopes.selection).toContain('outer repetition')
  const guide = (await run.call('describe_design_apis', query)).value.tools[0]
  const invocation = guide.invocationExample.invocation
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
  expect(run.execute).toHaveBeenCalledTimes(1)
  const retained = structuredClone(run.created)
  expect(retained).toHaveLength(15)
  await run.call('describe_design_apis', {
    ...query,
    refresh: true,
    refreshReason: 'delivery-failure'
  })
  expect(run.execute).toHaveBeenCalledTimes(1)
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
    status: 'partial',
    settlement: 'completed'
  })
  expect(result.value.measurementIssues[0].recovery).toContain(
    'Do not replay writes'
  )
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
    const invocation = tool.invocationExample.invocation
    const source = invocation.arguments.draft
    process.stdout.write(
      JSON.stringify({
        measurement: 'composition-guide',
        bytes: run.deliveries[0],
        explicit,
        replies: run.deliveries.length
      }) + '\n'
    )
    expect(run.deliveries).toHaveLength(1)
    expect(run.deliveries[0]).toBeLessThanOrEqual(20148)
    // Pre-edit same-dispatcher content guide (16297) plus combined guide (20146).
    expect(run.deliveries[0]).toBeLessThan(16297 + 20146)
    expect(source.linearFields).toBeDefined()
    expect(source.fillTemplates).toBeDefined()
    expect(
      source.children.map((child: { type: string }) => child.type)
    ).toEqual(['pattern', 'projected-face', 'pattern'])
    const pattern = source.children[0]
    const grid = source.children[2].members[0]
    expect(
      pattern.members.map((member: { type: string }) => member.type)
    ).toEqual(['projected-face'])
    expect(pattern.members[0].vertices).toEqual(grid.boundary)
    expect(source.linearFields[pattern.members[0].materialField]).toBeDefined()
    expect(source.fillTemplates[source.children[1].fill.template]).toBeDefined()
    const motifs = source.motifTemplates[grid.motifs.template]
    expect(motifs).toHaveLength(1)
    expect(source.fillTemplates[motifs[0].fill.template]).toBeDefined()
    const inline = structuredClone(source)
    inline.children[2].members[0].motifs = structuredClone(motifs)
    delete inline.motifTemplates
    const full = (
      await run.call('describe_design_apis', { ...query, view: 'full' })
    ).value.tools[0]
    expect(
      operationInputIssue(invocation.arguments, full.inputSchema)
    ).toBeUndefined()
    const result = await run.call(invocation.tool, {
      ...invocation.arguments,
      inspection: 'defer'
    })
    expect(result.value.toolOutcome.settlement).toBe('completed')
    expect(run.execute).toHaveBeenCalledOnce()
    expect(run.created).toHaveLength(16)
    const expected = prepareDesign(inline, result.value.artifactId)
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
    expect(run.execute).toHaveBeenCalledOnce()
    const broken = structuredClone(source)
    broken.children[2].members[0].motifs.template = 'missing'
    const invalid = await run.call(invocation.tool, {
      draft: broken,
      inspection: 'defer'
    })
    expect(invalid.success).toBe(false)
    expect(run.created).toEqual(retained)
    expect(run.execute).toHaveBeenCalledOnce()
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
    status: 'partial',
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
      inputScope: { operation: 'draft', nodeTypes: [memberType] }
    }
    const guide = (await run.call('describe_design_apis', query)).value.tools[0]
    expect(run.deliveries).toHaveLength(1)
    const full = (
      await run.call('describe_design_apis', { ...query, view: 'full' })
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
    expect(guide.usageGuide.parameters).toContain('instanceRanges')
    expect(guide.usageGuide.recovery).toContain('Never replay completed writes')
    const draft = guide.invocationExample.invocation.arguments.draft
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
    if (!definition) throw new Error('Missing main tool')
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
    expect(run.execute).toHaveBeenCalledOnce()
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
  if (!owner) throw new Error('Missing main tool')
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
    // The fixture deliberately has no review owner; do not hide its genuine follow-up gap.
    expect(completed.value.toolOutcome).toMatchObject({
      status: 'partial',
      settlement: 'completed'
    })
    expect(completed.value.measurementIssues[0].message).toContain(
      'not registered'
    )
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
    expect(run.execute).toHaveBeenCalledTimes(completed.value.parts.length)
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
    expect(run.execute).toHaveBeenCalledTimes(
      partial.value.parts[0].preparationInput.partitions.length
    )
  }
)

it('retains acknowledged partition receipts when cancellation arrives between parts', async () => {
  const run = setup()
  const invocation = await unstartedCapacityRecovery(run)
  const controller = new AbortController()
  const execute = run.execute.getMockImplementation()
  if (!execute) throw new Error('Missing execution owner')
  run.execute.mockImplementationOnce(async (batch) => {
    const result = await execute(batch)
    controller.abort()
    return result
  })
  await expect(
    run.call(invocation.name, invocation.arguments, controller.signal)
  ).rejects.toThrow(/aborted/i)
  expect(run.created).toHaveLength(9418)
  expect(run.execute).toHaveBeenCalledOnce()
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
  if (!execute) throw new Error('Missing execution owner')
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
  if (!('resolveTargets' in owner)) throw new Error('Missing design owner')
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
  expect(run.execute).toHaveBeenCalledOnce()
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
    if (!plan) query.inputScope.optionalInputs = []
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
    ).toBeLessThanOrEqual(25604)
    const invocation = tool.invocationExample.invocation
    const first = JSON.parse(run.replies[0].raw)
    const body = first.contentDelivery?.text ?? run.replies[0].raw
    expect(body).toContain(JSON.stringify(tool.invocationExample))
    expect(body.indexOf('"invocationExample"')).toBeLessThan(
      body.indexOf('"parameters"')
    )
    expect(run.deliveries.length).toBeLessThanOrEqual(plan ? 2 : 1)
    expect(run.deliveries.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(
      plan ? 27702 : 20087
    )
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
      Array.from({ length: 2 }, (_, i) =>
        Array.from(
          { length: 6 },
          (_, cell) => `windows-${i}-grid-${cell}-inset`
        )
      ).flat()
    )
    expect(run.created.map((e) => e.name)).toEqual(
      entries.map((e) => e.descriptor.name)
    )
    expect(new Set(run.parents.values()).has(run.created[0].id)).toBe(true)
    const source = invocation.arguments.draft
    expect(
      source.linearFields[source.children[0].members[0].materialField]
    ).toBeDefined()
    const grid = source.children[2].members[0]
    const motifs = source.motifTemplates[grid.motifs.template]
    expect(motifs).toHaveLength(1)
    expect(source.fillTemplates[motifs[0].fill.template]).toBeDefined()
    const inline = structuredClone(source)
    inline.children[2].members[0].motifs = structuredClone(motifs)
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
  if (!face || !grid || !('members' in face) || !('members' in grid))
    throw new Error('Missing saved layer patterns')
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
    const draft =
      guide.value.tools[0].invocationExample.invocation.arguments.draft
    const compact = structuredClone(draft)
    const explicit = structuredClone(draft)
    for (const pattern of [compact.children[0], compact.children[2]]) {
      pattern.axes = [{ count, step }]
      pattern.origin = { x: 7, y: -2, z: 5 }
    }
    explicit.children = compact.children.flatMap(
      (child: (typeof draft.children)[number]) => {
        if (child.type !== 'pattern') return [structuredClone(child)]
        return Array.from({ length: count }, (_, index) =>
          child.members.map((member: (typeof child.members)[number]) => {
            const node = structuredClone(member)
            node.key = `${child.key}-${index}-${member.key}`
            node.name = `Explicit ${child.key} ${index}`
            const field =
              member.type === 'projected-face' ? 'vertices' : 'boundary'
            node[field] = member[field].map(
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

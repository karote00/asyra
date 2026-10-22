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

const setup = (unrelatedCount = 0) => {
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
    createDesignPreparationSession(prepareDesign, compile)
  )
  const created: PreparedElementDescriptor[] = []
  const apply = createPreparedDesignAction(
    {
      getWorkspaceId: () => 'workspace',
      getElementType: (id) => created.find((entry) => entry.id === id)?.type,
      getElementMetadata: () => undefined,
      isContainerType: (type) => ['group', 'frame'].includes(type),
      isLocked: () => false,
      create: (entries) => {
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
        description: 'Unrelated capability',
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
  const workflow = createLocalDesignWorkflow(designs, operations)
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
      expect(next.success).toBe(true)
      return next.text
    }, args)
    return { ...reply, value: JSON.parse(text) }
  }
  return { call, compile, execute, owners, created, calls, deliveries, replies }
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

it('forwards the actual selected usage guide through native Code Mode without truncation', async () => {
  const run = setup()
  const inputScope = {
    operation: 'draft',
    nodeTypes: ['group', 'projected-face', 'pattern']
  }
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
}, 60000)

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

it('preserves every selected schema restriction and note in the delivered parameter reference', async () => {
  const run = setup()
  const names = ['prepare_and_apply_design']
  const inputScope = {
    operation: 'draft',
    nodeTypes: ['group', 'projected-face', 'pattern']
  }
  const full = (await run.call('describe_design_apis', { names, inputScope }))
    .value.tools[0]
  const guide = (
    await run.call('describe_design_apis', { names, inputScope, view: 'usage' })
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
  expect(text).toContain('exactly one of')
  expect(text).toContain('extra fields: forbidden')
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
})

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

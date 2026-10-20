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

const setup = () => {
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
    getNativeTools: () =>
      owners.flatMap((owner) =>
        owner.definitions.map((definition) => ({
          ...definition,
          namespace: 'design'
        }))
      )
  })
  const workflow = createLocalDesignWorkflow(designs, operations)
  const owners = [designs, operations, workflow]
  const calls: string[] = []
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
    return { ...reply, value: JSON.parse(reply.text) }
  }
  return { call, compile, execute, owners, created, calls }
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
  expect(usage.inputFields).toContain(path)
  const args = { names, schemaPaths: [path] }
  const fragment = (await call('describe_design_apis', args)).value.tools[0]
  expect(fragment.schemaFragments[0].path).toBe(path)
  expect(
    fragment.schemaContext.some((entry: { schema: { required?: string[] } }) =>
      entry.schema.required?.includes('type')
    )
  ).toBe(true)
  const repeated = (await call('describe_design_apis', args)).value.tools[0]
  expect(repeated.definition.availableInResponse).toBe(false)
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
  expect(usage.inputFields).toContain(path)
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

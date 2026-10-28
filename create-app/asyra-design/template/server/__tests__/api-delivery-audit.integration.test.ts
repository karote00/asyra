import {
  workflowInputScopes,
  workflowUsageParameters
} from '../design-workflow-discovery'
import { readCompleteInformation } from './tool-contract-assertions'
// @vitest-environment jsdom
import { createLocalToolLibraryTools } from '../local-tool-library-tools'
import { createLocalReferenceTools } from '../local-reference-tools'
import { createLocalKnowledgeTools } from '../local-knowledge'
import { afterAll, expect, it, vi } from 'vitest'
import { createAiToolContract } from '@asyra/ai-agent-runtime'
import { createAiRuntimeInput } from '../../src/ai/runtime-input'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import { createLocalDesignTools } from '../local-design-tools'
import { createLocalOperationTools } from '../local-operation-tools'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { createLocalImageTools } from '../local-image-tools'
import { invokeLocalTool } from '../local-tool-invocation'
import { operationInputIssue } from '../operation-input-schema'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const runtime = createAiRuntimeInput({
  permissionRules: {},
  provider: { requestActionBatch: vi.fn() }
})
const actions = runtime.actionDefinitions.map(createAiToolContract)
const designs = createLocalDesignTools(actions)
const execute = vi.fn(async () => {
  throw new Error('Invalid input reached browser dispatch')
})
const operations = createLocalOperationTools(actions, designs, execute, {
  getNativeTools: () =>
    owners.flatMap((owner) =>
      owner.definitions.map((d) => ({
        ...d,
        namespace: owner === operations ? 'design_operations' : 'design'
      }))
    )
})
const main = createLocalDesignWorkflow(designs, operations)
const images = createLocalImageTools({})
const signal = new AbortController().signal
const references = createLocalReferenceTools(() => {
  throw new Error('Invalid reference admission')
})
const knowledge = createLocalKnowledgeTools('api-delivery-audit')
const library = createLocalToolLibraryTools(() => {
  throw new Error('Invalid library admission reached its owner')
})
const owners = [
  designs,
  operations,
  main,
  images,
  references,
  knowledge,
  library
]
const native = owners.flatMap((owner) =>
  owner.definitions.map((definition) => ({ owner, definition }))
)
afterAll(async () => {
  for (const owner of runtime.ownedResources ?? []) await owner.dispose()
  knowledge.dispose()
})

it.each(runtime.actionDefinitions)(
  '$name rejects malformed input at its real App boundary',
  async (action) => {
    expect(operationInputIssue(null, action.inputSchema)).toBeTruthy()
    await expect(action.execute(null as never, { signal })).rejects.toThrow()
    expect(action.outputSchema, action.name).toBeDefined()
    expect(action.description.trim().length).toBeGreaterThan(0)
    const schema = action.inputSchema as { examples?: unknown[] }
    for (const example of schema.examples ?? [])
      expect(
        operationInputIssue(example, action.inputSchema),
        action.name
      ).toBeUndefined()
  }
)

it.each(native)(
  '$definition.name rejects malformed input without dispatch',
  async ({ owner, definition }) => {
    const reply = JSON.parse(
      (await invokeLocalTool(owner, definition, null, signal)).text
    )
    expect(reply.toolOutcome.status).toBe('failed')
    expect(reply.toolOutcome.settlement).toBe('not-started')
    expect(execute).not.toHaveBeenCalled()
    for (const example of (definition.inputSchema as { examples?: unknown[] })
      .examples ?? [])
      expect(
        operationInputIssue(example, definition.inputSchema),
        definition.name
      ).toBeUndefined()
  }
)

it.each(basicApiContracts)(
  '$name delivers the same owner parameters and an executable batch route',
  async (contract) => {
    const definition = operations.definitions.find(
      (d) => d.name === 'describe_design_apis'
    )
    if (!definition) throw new Error('Missing discovery owner')
    let response = JSON.parse(
      (
        await invokeLocalTool(
          operations,
          definition,
          { names: [contract.name], view: 'usage' },
          signal
        )
      ).text
    )
    let serialized = ''
    while (response.contentDelivery) {
      serialized += response.contentDelivery.text
      const next = response.contentDelivery.next
      if (!next) break
      response = JSON.parse(
        (await invokeLocalTool(operations, definition, next.arguments, signal))
          .text
      )
    }
    const tool = (serialized ? JSON.parse(serialized) : response).apis[0]
    expect(tool, JSON.stringify(response).slice(0, 1600)).toBeDefined()
    expect(tool.name).toBe(contract.name)
    expect(tool.execution.kind).toBe('batch-action')
    expect(tool.description).toBe(contract.description)
    if (tool.invocationExample?.invocation) {
      const invocation = tool.invocationExample.invocation
      const target = operations.definitions.find(
        (d) => d.name === invocation.tool
      )
      if (!target) throw new Error('Missing invocation owner')
      expect(target).toBeDefined()
      expect(
        operationInputIssue(invocation.arguments, target.inputSchema)
      ).toBeUndefined()
    }
  }
)

it('retains an explicit per-API audit inventory from actual registrations when requested', () => {
  if (!process.env.API_DELIVERY_AUDIT) return
  writeFileSync(
    resolve('../../tmp/api-delivery-audit.json'),
    JSON.stringify(
      {
        actions: runtime.actionDefinitions.map((d) => ({
          name: d.name,
          description: d.description,
          inputSchema: d.inputSchema,
          outputSchema: d.outputSchema
        })),
        basics: basicApiContracts,
        native: native.map(({ definition: d }) => ({
          name: d.name,
          description: d.description,
          inputSchema: d.inputSchema,
          outputSchema: d.outputSchema
        }))
      },
      null,
      2
    )
  )
})

it.each(native)(
  '$definition.name delivers a complete exact usage or explicit owner scope menu',
  async ({ definition }) => {
    const query = operations.definitions.find(
      (d) => d.name === 'describe_design_apis'
    )
    if (!query) throw new Error('Missing discovery definition')
    const namespace = operations.definitions.includes(definition)
      ? 'design_operations'
      : 'design'
    const args = { names: [`${namespace}.${definition.name}`], view: 'usage' }
    const text = await readCompleteInformation(
      async (input) =>
        (await invokeLocalTool(operations, query, input, signal)).text,
      args
    )
    const entry = JSON.parse(text).tools[0]
    expect(entry, text.slice(0, 1000)).toBeDefined()
    const scopes = workflowInputScopes(definition.inputSchema)
    if (scopes) {
      expect(entry.inputScopes).toEqual(scopes)
      expect(entry.definition.nextAction).toBe('select-operation-scope')
    } else {
      expect(entry.usageGuide?.parameters, definition.name).toEqual(
        workflowUsageParameters(definition.inputSchema)
      )
      expect(entry.definition.nextAction).toBe(
        'execute-with-delivered-contract'
      )
      expect(entry.usageGuide.results.success).toEqual(
        workflowUsageParameters(definition.outputSchema)
      )
    }
    expect(execute).not.toHaveBeenCalled()
  }
)

it.each(runtime.actionDefinitions)(
  '$name selected action usage retains parameters independently of its effect',
  async (action) => {
    const query = operations.definitions.find(
      (d) => d.name === 'describe_design_apis'
    )
    if (!query) throw new Error('Missing discovery definition')
    const args = { names: [action.name], view: 'usage' }
    const text = await readCompleteInformation(
      async (input) =>
        (await invokeLocalTool(operations, query, input, signal)).text,
      args
    )
    const entry = JSON.parse(text).apis[0]
    expect(entry, text.slice(0, 1000)).toBeDefined()
    expect(entry.usageGuide).toBeDefined()
    const admitted = designs
      .modelActions(actions)
      .find((entry) => entry.name === action.name)
    if (!admitted) throw new Error('Missing admitted action')
    expect(
      entry.usageGuide.operationParameters ?? entry.usageGuide.parameters
    ).toEqual(workflowUsageParameters(admitted.inputSchema))
    expect(entry.definition.nextAction).toBe('execute-with-delivered-contract')
    expect(execute).not.toHaveBeenCalled()
  }
)

it('executes a delivered final-response contract through its real control owner without a batch', async () => {
  const definition = operations.definitions.find(
    (d) => d.name === 'describe_design_apis'
  )
  if (!definition) throw new Error('Missing discovery definition')
  const args = { names: ['report_outcome'], view: 'usage' }
  const text = await readCompleteInformation(
    async (input) =>
      (await invokeLocalTool(operations, definition, input, signal)).text,
    args
  )
  const tool = JSON.parse(text).apis[0]
  expect(tool.execution.kind).toBe('final-response')
  const input = {
    outcome: 'unsupported',
    message: 'This request is outside the available capability.'
  }
  expect(operationInputIssue(input, tool.usageGuide.parameters)).toBeUndefined()
  expect(
    operationInputIssue(
      { ...input, message: '   ' },
      tool.usageGuide.parameters
    )
  ).toBeDefined()
  const owner = runtime.actionDefinitions.find(
    (d) => d.name === tool.execution.action
  )
  if (!owner) throw new Error('Missing final response owner')
  const reply = await owner.execute(input as never, { signal } as never)
  expect(reply).toMatchObject({
    status: 'no-change',
    outcome: 'unsupported',
    message: input.message
  })
  expect(execute).not.toHaveBeenCalled()
})

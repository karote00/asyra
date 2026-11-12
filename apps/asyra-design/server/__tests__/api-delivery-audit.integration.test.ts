import { AiActionNames } from '../../src/constants/ai-actions'
import lodash from 'lodash'
const { isEqual } = lodash

import { runtimeOperationSchema } from '../local-operation-batch'
import { setImmediate } from 'node:timers/promises'
import {
  modelToolResultSchemas,
  modelToolDeliveryFailureSchema,
  toolResultObject,
  toolResultString
} from '../../src/ai/tool-contract'
import { createLocalToolHost } from '../local-tool-host'
import {
  workflowInputScopes,
  projectWorkflowInput,
  workflowUsageParameters
} from '../design-workflow-discovery'
import { readCompleteInformation } from './tool-contract-assertions'
// @vitest-environment jsdom
import {
  createLocalToolLibraryTools,
  registeredToolInvocationSchemas
} from '../local-tool-library-tools'
import { createLocalReferenceTools } from '../local-reference-tools'
import { createLocalKnowledgeTools } from '../local-knowledge'
import { afterAll, afterEach, expect, it, vi } from 'vitest'
import {
  createAiToolContract,
  registeredRecipeOutputAt,
  embedAiToolSchema,
  type AiJsonValue
} from '@asyra/ai-agent-runtime'
import { createAiRuntimeInput } from '../../src/ai/runtime-input'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import { createLocalDesignTools } from '../local-design-tools'
import {
  createLocalOperationTools,
  singleActionSemantics
} from '../local-operation-tools'
import { createLocalDesignWorkflow } from '../local-design-workflow'
import { createLocalImageTools } from '../local-image-tools'
import {
  invokeLocalTool,
  localToolFailureSchema
} from '../local-tool-invocation'
import {
  operationInputIssue,
  nativeToolInputSchema
} from '../operation-input-schema'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Let progress RPC acknowledgements drain between the synchronous contract cases.
// Keep the runner timeout and every contract/work-count assertion unchanged.
afterEach(() => setImmediate())

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
  getNativeTools: () => host.definitions()
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
const host = createLocalToolHost({
  requestId: 'api-delivery-audit',
  signal,
  capacity: 1024,
  receiptCapacity: 32,
  artifactCapacity: 128,
  limits: {
    steps: 32,
    bindings: 128,
    bindingDepth: 32,
    bytes: 24000,
    issues: 8
  },
  store: {
    read: async () => undefined,

    list: async () => [],

    write: async () => {
      throw new Error('No recipe write in discovery audit')
    }
  },

  createGroups: () =>
    owners.map((owner) => ({
      name: owner === operations ? 'design_operations' : 'design',
      description: 'Registered audit owner',
      owner
    }))
})
const observerActions = actions
  .filter((action) =>
    [AiActionNames.REVIEW_DESIGN, AiActionNames.INSPECT_DRAWING].includes(
      action.name as never
    )
  )
  .map((action) => {
    const wrapper = operations.definitions.find(
      (entry) => entry.name === action.name
    )

    if (!wrapper) {
      throw new Error('Missing registered observation owner')
    }

    return {
      ...action,
      outputSchema: registeredRecipeOutputAt(
        wrapper.outputSchema,
        '/actionResults/0/result'
      )
    }
  })
const observerResults = {
  anyOf: observerActions.map((action, index) => {
    const results = modelToolResultSchemas(action)
    const alternatives = Object.values(results).filter(
      (schema) => schema !== undefined
    )

    return toolResultObject({
      actionId: toolResultString,
      actionName: { const: action.name },
      result: embedAiToolSchema(
        {
          anyOf: alternatives.map((schema, branch) =>
            embedAiToolSchema(schema as AiJsonValue, '#/anyOf/' + branch)
          )
        },
        '#/anyOf/' + index + '/properties/result'
      )
    })
  })
}

const native = owners.flatMap((owner) =>
  owner.definitions.map((definition) => ({ owner, definition }))
)

afterAll(async () => {
  await host.dispose()
  for (const owner of runtime.ownedResources ?? []) {
    await owner.dispose()
  }

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

    for (const example of schema.examples ?? []) {
      expect(
        operationInputIssue(example, action.inputSchema),
        action.name
      ).toBeUndefined()
    }
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
      .examples ?? []) {
      expect(
        operationInputIssue(example, definition.inputSchema),
        definition.name
      ).toBeUndefined()
    }
  }
)

it.each(basicApiContracts)(
  '$name delivers the same owner parameters and an executable batch route',
  async (contract) => {
    const definition = operations.definitions.find(
      (d) => d.name === 'describe_design_apis'
    )

    if (!definition) {
      throw new Error('Missing discovery owner')
    }

    let response = JSON.parse(
      (
        await invokeLocalTool(
          operations,
          definition,
          { names: [contract.name], view: 'usage', includeResultSchema: true },
          signal
        )
      ).text
    )
    let serialized = ''

    while (response.contentDelivery) {
      serialized += response.contentDelivery.text
      const next = response.contentDelivery.next

      if (!next) {
        break
      }

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

      if (!target) {
        throw new Error('Missing invocation owner')
      }

      expect(target).toBeDefined()
      expect(
        operationInputIssue(invocation.arguments, target.inputSchema)
      ).toBeUndefined()
    }
  }
)

it('retains an explicit per-API audit inventory from actual registrations when requested', () => {
  if (!process.env.API_DELIVERY_AUDIT) {
    return
  }

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
        registrations: host.definitions(),
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

// A complete result union need not preserve wrapper nesting or branch indices.
// Alternatives must match exactly; unregistered branches are not additional capabilities.
const unionAlternatives = (schema: unknown): unknown[] => {
  if (schema && typeof schema === 'object' && !Array.isArray(schema)) {
    // Distribute shared parent constraints before comparing alternatives; never
    // discard them when a compact result shares host metadata at the parent.
    const value = nativeToolInputSchema(schema) as Record<string, unknown>

    if (Object.keys(value).length === 1 && Array.isArray(value.anyOf)) {
      return value.anyOf.flatMap(unionAlternatives)
    }

    return [value]
  }

  return [schema]
}

// Recurse through schema positions only. Literal data may itself contain schema-like keys.
const schemaMapKeys = new Set([
  'properties',
  'patternProperties',
  '$defs',
  'definitions',
  'dependentSchemas'
])
const schemaChildKeys = new Set([
  'items',
  'additionalProperties',
  'propertyNames',
  'not',
  'if',
  'then',
  'else'
])
const schemaArrayKeys = new Set(['anyOf', 'oneOf', 'allOf', 'prefixItems'])

const schemaEntry = (
  key: string,
  value: unknown,
  visit: (value: unknown) => unknown
): unknown => {
  if (schemaMapKeys.has(key) && schemaRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, child]) => [name, visit(child)])
    )
  }

  if (schemaChildKeys.has(key)) {
    return visit(value)
  }

  if (schemaArrayKeys.has(key) && Array.isArray(value)) {
    return value.map(visit)
  }

  return value
}

// Compare schema meaning, not compression-local definition names or locations.
const resolvedSchema = (
  schema: unknown,
  root: unknown = schema,
  references: readonly unknown[] = []
): unknown => {
  if (Array.isArray(schema)) {
    return schema.map((entry) => resolvedSchema(entry, root, references))
  }

  if (!schema || typeof schema !== 'object') {
    return schema
  }

  const value = schema as Record<string, unknown>
  const { $ref, $defs: _definitions, ...rest } = value

  if (typeof $ref === 'string') {
    let target = root as Record<string, unknown>

    for (const token of $ref === '#' ? [] : $ref.slice(2).split('/')) {
      target = target[token.replace(/~1/g, '/').replace(/~0/g, '~')] as Record<
        string,
        unknown
      >
    }

    expect(target, $ref).toBeDefined()
    if (references.includes(target)) {
      return { recursive: references.indexOf(target) }
    }

    const resolved = resolvedSchema(target, root, [...references, target])

    return Object.keys(rest).length
      ? { allOf: [resolved, resolvedSchema(rest, root, references)] }
      : resolved
  }

  const resolved = Object.fromEntries(
    Object.entries(rest).map(([key, entry]) => [
      key,
      key === 'required' && Array.isArray(entry)
        ? [...entry].sort()
        : schemaEntry(key, entry, (child) =>
            resolvedSchema(child, root, references)
          )
    ])
  )

  // Normalize shared same-instance constraints at every nested result union.
  // AnyOf membership is idempotent; oneOf multiplicity remains exact.
  return Array.isArray(resolved.anyOf)
    ? nativeToolInputSchema(resolved)
    : resolved
}

const schemaRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const schemaSets = (schema: unknown): unknown => {
  if (Array.isArray(schema)) {
    return schema.map(schemaSets)
  }

  if (!schemaRecord(schema)) {
    return schema
  }

  return Object.fromEntries(
    Object.entries(schema)
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(
        ([key, value]) => !(key === 'additionalProperties' && value === true)
      )
      .map(([key, value]) => [
        key,
        ['required', 'type', 'enum', 'anyOf', 'allOf', 'oneOf'].includes(key) &&
        Array.isArray(value)
          ? (schemaArrayKeys.has(key)
              ? value.map(schemaSets)
              : [...value]
            ).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
          : schemaEntry(key, value, schemaSets)
      ])
  )
}

const exactResultAlternatives = (schema: unknown) => {
  const alternatives = unionAlternatives(resolvedSchema(schema)).map(schemaSets)
  const unique = alternatives.filter(
    (value, index) =>
      !alternatives.slice(0, index).some((previous) => isEqual(previous, value))
  )

  return unique.sort((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b))
  )
}

it('audits unordered requirements without losing required fields or value constraints', () => {
  const owner = {
    type: 'object',
    additionalProperties: false,
    properties: {
      count: { type: 'integer', minimum: 1 },
      status: { enum: ['complete', 'partial'] }
    },
    required: ['status', 'count']
  }
  const equivalent = { ...owner, required: ['count', 'status'] }

  expect(resolvedSchema(owner)).toEqual(resolvedSchema(equivalent))
  for (const value of [
    { count: 1 },
    { status: 'complete' },
    { count: '1', status: 'complete' },
    { count: 0, status: 'complete' },
    { count: 1, status: 'failed' },
    { count: 1, status: 'complete', extra: true }
  ]) {
    expect(operationInputIssue(value, equivalent)).toBeDefined()
  }

  expect(
    operationInputIssue({ count: 1, status: 'partial' }, equivalent)
  ).toBeUndefined()
  for (const changed of [
    { ...owner, required: ['count'] },
    { ...owner, additionalProperties: true },
    {
      ...owner,
      properties: { ...owner.properties, count: { type: 'number', minimum: 1 } }
    },
    {
      ...owner,
      properties: {
        ...owner.properties,
        status: { enum: ['complete', 'failed'] }
      }
    }
  ]) {
    expect(resolvedSchema(changed)).not.toEqual(resolvedSchema(owner))
  }

  const observed = owner

  expect(
    operationInputIssue({ count: 1, status: 'complete' }, observed)
  ).toBeUndefined()
  expect(
    operationInputIssue(
      {
        count: 1,
        status: 'complete',
        toolOutcome: { status: 'success', settlement: 'completed', issues: [] }
      },
      observed
    )
  ).toBeDefined()
})

it('keeps literal arrays ordered and preserves reference sibling intersections in the audit', () => {
  const literal = { const: { required: ['a', 'b'], $ref: 'literal' } }

  expect(exactResultAlternatives(literal)).not.toEqual(
    exactResultAlternatives({
      const: { required: ['b', 'a'], $ref: 'literal' }
    })
  )
  expect(
    exactResultAlternatives({ enum: [{ required: ['a', 'b'] }] })
  ).not.toEqual(exactResultAlternatives({ enum: [{ required: ['b', 'a'] }] }))
  const bounded = {
    $ref: '#/$defs/base',
    minimum: 0,
    $defs: { base: { type: 'number', minimum: 5 } }
  }

  expect(exactResultAlternatives(bounded)).not.toEqual(
    exactResultAlternatives({ type: 'number', minimum: 0 })
  )
  expect(
    exactResultAlternatives({ oneOf: [{ type: 'number' }, { type: 'number' }] })
  ).not.toEqual(exactResultAlternatives({ oneOf: [{ type: 'number' }] }))
})

it('rejects an extra permissive result branch in the delivered contract audit', () => {
  const canonical = {
    type: 'object',
    properties: { count: { type: 'integer', minimum: 0 } },
    required: ['count'],
    additionalProperties: false
  }
  const acceptsCanonical = isEqual(
    exactResultAlternatives({ anyOf: [canonical, {}] }),
    exactResultAlternatives(canonical)
  )

  expect(operationInputIssue({ count: -1 }, canonical)).toBeDefined()
  expect(
    operationInputIssue({ count: -1 }, { anyOf: [canonical, {}] })
  ).toBeUndefined()
  expect(acceptsCanonical).toBe(false)
})

it.each(native)(
  '$definition.name delivers a complete exact usage or explicit owner scope menu',
  async ({ definition }) => {
    const query = operations.definitions.find(
      (d) => d.name === 'describe_design_apis'
    )

    if (!query) {
      throw new Error('Missing discovery definition')
    }

    const namespace = operations.definitions.some(
      (entry) => entry === definition
    )
      ? 'design_operations'
      : 'design'
    const args = {
      names: [`${namespace}.${definition.name}`],
      view: 'usage',
      includeResultSchema: true
    }
    const text = await readCompleteInformation(
      async (input) =>
        (
          await host.invoke({
            name: 'design_operations.describe_design_apis',
            input
          })
        ).text,
      args
    )
    const entry = JSON.parse(text).tools[0]

    expect(entry, text.slice(0, 1000)).toBeDefined()
    const registeredDefinition = host
      .definitions()
      .find((d) => d.registeredName === `${namespace}.${definition.name}`)

    if (!registeredDefinition) {
      throw new Error('Missing host registration')
    }

    const scopes = workflowInputScopes(registeredDefinition.inputSchema)

    if (scopes) {
      expect(entry.inputScopes).toEqual(scopes)
      expect(entry.definition.nextAction).toBe('select-operation-scope')
      for (const operation of scopes.operations) {
        const inputScope = {
          operation,
          ...(scopes.nodeTypes.length ? { nodeTypes: scopes.nodeTypes } : {})
        }
        const selected = JSON.parse(
          await readCompleteInformation(
            async (input) =>
              (
                await host.invoke({
                  name: 'design_operations.describe_design_apis',
                  input
                })
              ).text,
            { ...args, inputScope }
          )
        ).tools[0]
        const invocation = selected.invocationExample?.invocation

        if (invocation) {
          expect(
            operationInputIssue(
              selected.execution.kind === 'host-operation'
                ? invocation.arguments.operations[0].arguments
                : invocation.arguments,
              selected.usageGuide.parameters
            ),
            `${definition.name}:${operation}`
          ).toBeUndefined()
        }

        const params =
          selected.execution.kind === 'registered-tool'
            ? selected.usageGuide.parameters.properties.input
            : selected.usageGuide.parameters

        expect(resolvedSchema(params, selected.usageGuide.parameters)).toEqual(
          resolvedSchema(
            workflowUsageParameters(
              projectWorkflowInput(registeredDefinition.inputSchema, inputScope)
            )
          )
        )
        expect(selected.usageGuide.results.anyOf).toEqual(expect.any(Array))
        const rejected = await host.invoke({
          name: `${namespace}.${definition.name}`,
          input: null
        })
        // Registered tools are checked through the actual advertised outer route.
        const boundary =
          selected.execution.kind === 'registered-tool'
            ? await host.invoke({
                name: 'tool_library.invoke_tool',
                input: {
                  ...selected.execution.arguments,
                  revision: 0,
                  input: {}
                }
              })
            : rejected

        expect(
          operationInputIssue(
            JSON.parse(boundary.text),
            selected.usageGuide.results
          ),
          `${definition.name}:${operation} rejection`
        ).toBeUndefined()
      }
    } else {
      const registered = entry.execution.kind === 'registered-tool'
      const parameters = registered
        ? entry.usageGuide?.parameters.properties.input
        : entry.usageGuide?.parameters

      expect(
        resolvedSchema(parameters, entry.usageGuide.parameters),
        definition.name
      ).toEqual(
        resolvedSchema(
          workflowUsageParameters(registeredDefinition.inputSchema)
        )
      )
      expect(entry.definition.nextAction).toBe(
        'execute-with-delivered-contract'
      )
      let canonical = modelToolResultSchemas(registeredDefinition)
      const action = actions.find((action) => action.name === definition.name)

      if (namespace === 'design_operations' && action?.delivery) {
        canonical = modelToolResultSchemas(
          singleActionSemantics(
            {
              ...action,
              ...modelToolResultSchemas(action),
              delivery: undefined
            },
            observerResults,
            !observerActions.some((observer) => observer.name === action.name)
          )
        )
      }

      const routed = registered
        ? registeredToolInvocationSchemas(
            { ...canonical, inputSchema: registeredDefinition.inputSchema },
            entry.execution.arguments,
            undefined,
            modelToolDeliveryFailureSchema(registeredDefinition)
          )
        : canonical
      // Parameters are audited separately; result alternatives come only from
      // the registered success/partial/recovery owners and invocation boundary.
      const alternatives = [
        routed.outputSchema,
        routed.partialOutputSchema,
        routed.recoveryOutputSchema,
        modelToolResultSchemas({ outputSchema: localToolFailureSchema })
          .outputSchema
      ]
        .filter((schema) => schema !== undefined)
        .flatMap((schema) =>
          unionAlternatives(resolvedSchema(workflowUsageParameters(schema)))
        )

      expect(
        exactResultAlternatives(entry.usageGuide.results),
        definition.name
      ).toEqual(exactResultAlternatives({ anyOf: alternatives }))
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

    if (!query) {
      throw new Error('Missing discovery definition')
    }

    const args = {
      names: [action.name],
      view: 'usage',
      includeResultSchema: true
    }
    const text = await readCompleteInformation(
      async (input) =>
        (
          await host.invoke({
            name: 'design_operations.describe_design_apis',
            input
          })
        ).text,
      args
    )
    const entry = JSON.parse(text).apis[0]

    expect(entry, text.slice(0, 1000)).toBeDefined()
    expect(entry.usageGuide).toBeDefined()
    const admitted = designs
      .modelActions(actions)
      .find((entry) => entry.name === action.name)

    if (!admitted) {
      throw new Error('Missing admitted action')
    }

    const parameters =
      entry.usageGuide.operationParameters ?? entry.usageGuide.parameters
    const ordinary =
      entry.execution.kind === 'host-operation' &&
      !entry.usageGuide.operationParameters
        ? parameters.properties.arguments
        : parameters

    expect(resolvedSchema(ordinary, parameters)).toEqual(
      resolvedSchema(
        workflowUsageParameters(
          entry.usageGuide.operationParameters
            ? admitted.inputSchema
            : runtimeOperationSchema(admitted.inputSchema)
        )
      )
    )
    if ('delivery' in admitted && admitted.delivery) {
      const complete = resolvedSchema(entry.usageGuide.results) as {
        anyOf: {
          properties: {
            actionResults: {
              items: {
                anyOf: { properties: { result: { anyOf: unknown[] } } }[]
              }
            }
          }
        }[]
      }
      const operation =
        complete.anyOf[0].properties.actionResults.items.anyOf[0].properties
          .result.anyOf[0]

      expect(operation).toMatchObject(
        resolvedSchema(
          workflowUsageParameters(modelToolResultSchemas(admitted).outputSchema)
        ) as object
      )
      expect(entry.outputFields).not.toContain('/properties/modelResult')
      expect(entry.result).toBeUndefined()
      // A view missing its owner-required fields must not pass through a
      // permissive internal resource branch.
      expect(operationInputIssue({}, operation), action.name).toBeDefined()
    }

    if (!('delivery' in admitted && admitted.delivery)) {
      const canonical = basicApiContracts.find(
        (contract) => contract.name === action.name
      )

      if (canonical) {
        expect(entry.result).toEqual(canonical.result)
      }
    }

    expect(entry.definition.nextAction).toBe('execute-with-delivered-contract')
    expect(execute).not.toHaveBeenCalled()
  }
)

it('executes a delivered final-response contract through its real control owner without a batch', async () => {
  const definition = operations.definitions.find(
    (d) => d.name === 'describe_design_apis'
  )

  if (!definition) {
    throw new Error('Missing discovery definition')
  }

  const args = {
    names: ['report_outcome'],
    view: 'usage',
    includeResultSchema: true
  }
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

  if (!owner) {
    throw new Error('Missing final response owner')
  }

  const reply = await owner.execute(input as never, { signal } as never)

  expect(reply).toMatchObject({
    status: 'no-change',
    outcome: 'unsupported',
    message: input.message
  })
  expect(execute).not.toHaveBeenCalled()
})

it.each(host.definitions())(
  '$registeredName declares its actual admission failure without dispatch',
  async (registration) => {
    const scopes = workflowInputScopes(registration.inputSchema)
    const inputScope = scopes
      ? {
          operation: scopes.operations[0],
          ...(scopes.nodeTypes.length ? { nodeTypes: scopes.nodeTypes } : {})
        }
      : undefined
    const query = {
      names: [registration.registeredName],
      view: 'usage',
      includeResultSchema: true,
      ...(inputScope ? { inputScope } : {})
    }
    const entry = JSON.parse(
      await readCompleteInformation(
        async (input) =>
          (
            await host.invoke({
              name: 'design_operations.describe_design_apis',
              input
            })
          ).text,
        query
      )
    ).tools[0]
    const registered = entry.execution.kind === 'registered-tool'
    const reply = await host.invoke({
      name: registered
        ? 'tool_library.invoke_tool'
        : registration.registeredName,
      input: registered
        ? { ...entry.execution.arguments, revision: 0, input: {} }
        : null
    })

    expect(reply.success).toBe(false)
    expect(JSON.parse(reply.text).toolOutcome.settlement).toBe('not-started')
    expect(entry.usageGuide.results.anyOf).toEqual(expect.any(Array))
    expect(
      operationInputIssue(JSON.parse(reply.text), entry.usageGuide.results),
      registration.registeredName
    ).toBeUndefined()
    expect(execute).not.toHaveBeenCalled()
  }
)

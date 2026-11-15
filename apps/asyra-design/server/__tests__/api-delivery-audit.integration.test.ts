import { isRecord } from '@asyra/utils'
import { createDeliveryAuditFixture } from './delivery-audit-fixture'

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
import {
  workflowInputScopes,
  projectWorkflowInput,
  workflowUsageParameters
} from '../design-workflow-discovery'
import { readCompleteInformation } from './tool-contract-assertions'
// @vitest-environment jsdom
import { registeredToolInvocationSchemas } from '../local-tool-library-tools'
import { afterAll, afterEach, expect, it } from 'vitest'
import {
  registeredRecipeOutputAt,
  embedAiToolSchema,
  type AiJsonValue
} from '@asyra/ai-agent-runtime'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import { singleActionSemantics } from '../local-operation-tools'
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

const fixture = createDeliveryAuditFixture()
const { runtime, actions, preparation, execute, operations, signal, host } =
  fixture

// Canonical input rejection is a continuation contract, not merely a thrown error.
it.each(
  [
    {
      name: 'record_design_facts',
      key: 'facts',
      note: { statement: 'Original' }
    },
    {
      name: 'record_design_calculations',
      key: 'calculations',
      note: { value: 12, unit: 'px' }
    }
  ].flatMap((entry) =>
    ['native', 'registered', 'sequence', 'staged'].map((route) => ({
      ...entry,
      route
    }))
  )
)(
  '$name keeps duplicate note IDs correctable through $route Host delivery',
  async ({ name, key, note, route }) => {
    const current = createDeliveryAuditFixture()

    try {
      const qualifiedName = 'design_operations.' + name
      const input = {
        [key]: [
          { id: 'same', ...note },
          { id: 'same', ...note }
        ]
      }
      const definition = current.host
        .definitions()
        .find((entry) => entry.registeredName === qualifiedName)

      if (!definition) {
        throw new Error('Missing registered note owner: ' + qualifiedName)
      }

      expect(operationInputIssue(input, definition.inputSchema)).toBeUndefined()

      const call = (value: unknown) => {
        if (route === 'registered') {
          return current.host.invoke({
            name: 'tool_library.invoke_tool',
            input: {
              name: qualifiedName,
              revision: definition.revision,
              input: value
            }
          })
        }

        if (route === 'sequence' || route === 'staged') {
          const operations = [
            { id: 'notes', name: qualifiedName, arguments: value }
          ]

          return current.host.invoke({
            name: 'design_operations.execute_design',
            input:
              route === 'sequence'
                ? { operations }
                : {
                    stages: [
                      {
                        id: 'notes',
                        operations,
                        apply: [
                          {
                            id: 'read-notes',
                            name: qualifiedName,
                            arguments: {}
                          }
                        ]
                      }
                    ]
                  }
          })
        }

        return current.host.invoke({ name: qualifiedName, input: value })
      }

      const rejected = await call(input)

      expect.soft(rejected.text).toContain('TOOL_INPUT_INVALID')
      expect
        .soft(rejected.outcome.settlement, rejected.text)
        .toBe('not-started')

      const unchanged = await current.host.invoke({
        name: qualifiedName,
        input: {}
      })

      expect(JSON.parse(unchanged.text)[key]).toEqual([])
      const corrected = await call({ [key]: [{ id: 'same', ...note }] })

      expect(corrected.success, corrected.text).toBe(true)
      const stored = await current.host.invoke({
        name: qualifiedName,
        input: {}
      })

      expect(JSON.parse(stored.text)[key]).toEqual([{ id: 'same', ...note }])
      expect(current.execute).not.toHaveBeenCalled()
    } finally {
      await current.dispose()
    }
  }
)
it.each(['sequence', 'staged'])(
  'preserves completed note updates when a later %s update needs correction',
  async (route) => {
    const current = createDeliveryAuditFixture()
    const name = 'design_operations.record_design_facts'

    const writes = () =>
      current.operationCalls.mock.calls.filter(
        ([operation, input]) =>
          operation === 'record_design_facts' &&
          Object.hasOwn(input as object, 'facts')
      ).length

    try {
      const first = { id: 'first', statement: 'Keep this completed note' }
      const second = { id: 'second', statement: 'Correct this note' }
      const operations = [
        { id: 'first', name, arguments: { facts: [first] } },
        { id: 'second', name, arguments: { facts: [second, second] } }
      ]
      const rejected = await current.host.invoke({
        name: 'design_operations.execute_design',
        input:
          route === 'sequence'
            ? { operations }
            : {
                stages: [
                  {
                    id: 'notes',
                    operations: [operations[0]],
                    apply: [operations[1]]
                  }
                ]
              }
      })

      expect(rejected.success).toBe(false)
      expect(rejected.outcome.settlement, rejected.text).toBe('partial')

      expect(writes()).toBe(2)
      const retained = await current.host.invoke({ name, input: {} })

      expect(JSON.parse(retained.text).facts).toEqual([first])
      const corrected = await current.host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [{ id: 'second', name, arguments: { facts: [second] } }]
        }
      })

      expect(corrected.success, corrected.text).toBe(true)
      expect(writes()).toBe(3)
      const result = await current.host.invoke({ name, input: {} })

      expect(JSON.parse(result.text).facts).toEqual([first, second])
      expect(current.execute).not.toHaveBeenCalled()
    } finally {
      await current.dispose()
    }
  }
)

it.each([false, true])(
  'keeps native-only lookup rejection and native correction consistent with a known sibling: %s',
  async (includeKnown) => {
    const current = createDeliveryAuditFixture()
    const definition = current.host
      .definitions()
      .find(
        (tool) =>
          tool.registeredName === 'design_operations.read_design_contracts'
      )

    if (!definition) {
      throw new Error('Missing contract lookup registration')
    }

    try {
      const input = {
        names: [
          ...(includeKnown ? ['design_operations.record_design_facts'] : []),
          'design_operations.missing_note_owner'
        ],
        view: 'usage'
      }
      const rejected = await current.host.invoke({
        name: 'tool_library.invoke_tool',
        input: {
          name: definition.registeredName,
          revision: definition.revision,
          input
        }
      })

      expect(rejected.outcome.settlement, rejected.text).toBe('not-started')
      expect(rejected.text).toContain('TOOL_INPUT_INVALID')

      const reply = await current.host.invoke({
        name: definition.registeredName,
        input
      })

      expect(reply.outcome.settlement, reply.text).toBe('completed')
      expect(reply.text).toContain('IDENTITY_UNRESOLVED')

      expect(current.execute).not.toHaveBeenCalled()
    } finally {
      await current.dispose()
    }
  }
)

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

const native = host.groups.flatMap(({ name: namespace, owner }) =>
  owner.definitions.map((definition) => ({ namespace, owner, definition }))
)

afterAll(() => fixture.dispose())

it.each(runtime.actionDefinitions)(
  '$name rejects malformed input at its real App boundary - case %#',
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
  '$definition.name rejects malformed input without dispatch - case %#',
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
  '$name delivers the same owner parameters and an executable batch route - case %#',
  async (contract) => {
    const definition = operations.definitions.find(
      (d) => d.name === 'read_design_contracts'
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
  '$definition.name delivers a complete exact usage or explicit owner scope menu - case %#',
  async ({ definition, namespace }) => {
    const query = operations.definitions.find(
      (d) => d.name === 'read_design_contracts'
    )

    if (!query) {
      throw new Error('Missing discovery definition')
    }

    const args = {
      names: [`${namespace}.${definition.name}`],
      view: 'usage',
      includeResultSchema: true
    }
    const text = await readCompleteInformation(
      async (input, requestedTool) =>
        (
          await host.invoke({
            name: 'design_operations.' + requestedTool,
            input
          })
        ).text,
      args,
      'read_design_contracts'
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
            async (input, requestedTool) =>
              (
                await host.invoke({
                  name: 'design_operations.' + requestedTool,
                  input
                })
              ).text,
            {
              ...args,
              scopes: Object.fromEntries(
                args.names.map((name) => [name, { inputScope }])
              )
            },
            'read_design_contracts'
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
  '$name selected action usage retains parameters independently of its effect - case %#',
  async (action) => {
    const query = operations.definitions.find(
      (d) => d.name === 'read_design_contracts'
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
      async (input, requestedTool) =>
        (
          await host.invoke({
            name: 'design_operations.' + requestedTool,
            input
          })
        ).text,
      args,
      'read_design_contracts'
    )
    const entry = JSON.parse(text).apis[0]

    expect(entry, text.slice(0, 1000)).toBeDefined()
    expect(entry.usageGuide).toBeDefined()
    const admitted = preparation
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
    (d) => d.name === 'read_design_contracts'
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
    async (input, requestedTool) =>
      (
        await invokeLocalTool(
          operations,
          definition.name === requestedTool
            ? definition
            : (() => {
                throw new Error('Unknown continuation tool: ' + requestedTool)
              })(),
          input,
          signal
        )
      ).text,
    args,
    definition.name
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

it.each(['export_document', 'api_core_getCurrentWorkspaceId'])(
  '%s rejects null ordinary arguments consistently before dispatch',
  async (name) => {
    const registration = host.definitions().find((tool) => tool.name === name)

    if (!registration) {
      throw new Error('Missing audit registration: ' + name)
    }

    expect(
      operationInputIssue({ arguments: null }, registration.inputSchema)
    ).toBeTruthy()
    const before = execute.mock.calls.length
    const reply = await host.invoke({
      name: 'design_operations.execute_design',
      input: {
        operations: [
          { id: 'invalid', name: registration.registeredName, arguments: null }
        ]
      }
    })

    expect(execute.mock.calls.length, reply.text).toBe(before)
    expect(reply.outcome.settlement, reply.text).toBe('not-started')
    expect(reply.outcome.status, reply.text).toBe('failed')
  }
)

it.each(host.definitions())(
  '$registeredName rejects invalid library input and enforces its composition boundary - case %#',
  async (registration) => {
    const invoked = await host.invoke({
      name: 'tool_library.invoke_tool',
      input: {
        name: registration.registeredName,
        revision: registration.revision,
        input: null
      }
    })

    expect(invoked.success, registration.registeredName).toBe(false)
    expect(invoked.outcome.settlement).toBe('not-started')
    const composable =
      registration.composition === 'allowed' ||
      registration.composition === 'request'
    const canonicalAction = runtime.actionDefinitions.some(
      (action) => action.name === registration.name
    )
    const controlOnly = !composable && !canonicalAction
    const composed = await host.invoke({
      name: 'design_operations.execute_design',
      input: {
        operations: [
          {
            id: 'probe',
            name: registration.registeredName,
            arguments: controlOnly ? {} : 42
          }
        ]
      }
    })

    expect(composed.success, registration.registeredName).toBe(false)
    expect(composed.outcome.settlement).toBe('not-started')
    if (controlOnly) {
      expect(composed.text).toMatch(/compos|native control|recipe/i)
    }

    expect(execute).not.toHaveBeenCalled()
  }
)

it.each(host.definitions())(
  '$registeredName declares its actual admission failure without dispatch - case %#',
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
      ...(inputScope
        ? { scopes: { [registration.registeredName]: { inputScope } } }
        : {})
    }
    const entry = JSON.parse(
      await readCompleteInformation(
        async (input, requestedTool) =>
          (
            await host.invoke({
              name: 'design_operations.' + requestedTool,
              input
            })
          ).text,
        query,
        'read_design_contracts'
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

it('exposes only current result delivery controls across the registered tool inventory', async () => {
  const current = createDeliveryAuditFixture()
  const retiredTools = [
    'run_recipe',
    'execute_design_batch',
    'describe_design_apis'
  ]

  const inspect = (value: unknown, path: string): void => {
    if (!isRecord(value)) {
      return
    }

    if (isRecord(value.properties)) {
      expect(value.properties, path).not.toHaveProperty('response')
      expect(value.properties, path).not.toHaveProperty('includeTargets')
      inspect(value.properties.arguments, path + '/arguments')
    }

    for (const key of ['anyOf', 'oneOf', 'allOf']) {
      if (Array.isArray(value[key])) {
        value[key].forEach((child, index) =>
          inspect(child, path + '/' + key + '/' + index)
        )
      }
    }
  }

  const deliveryOwners = new Set([
    'execute_design',
    'prepare_and_apply_design',
    'apply_prepared_design'
  ])

  try {
    for (const definition of current.host.definitions()) {
      expect(retiredTools).not.toContain(definition.name)
      if (deliveryOwners.has(definition.name)) {
        inspect(definition.inputSchema, definition.registeredName)
      }
    }

    for (const action of current.designs.modelActions(current.actions)) {
      if (deliveryOwners.has(action.name)) {
        inspect(action.inputSchema, action.name)
      }
    }
  } finally {
    await current.dispose()
  }
})

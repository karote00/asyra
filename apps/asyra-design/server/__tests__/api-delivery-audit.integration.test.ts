import { equivalentDeliveredSchema } from './schema-equivalence'
import { isRecord } from '@asyra/utils'
import { createDeliveryAuditFixture } from './delivery-audit-fixture'

import lodash from 'lodash'
const { isEqual } = lodash

import { setImmediate } from 'node:timers/promises'
import { workflowInputScopes } from '../design-workflow-discovery'
import * as workflowOwner from '../design-workflow-discovery'
import { readCompleteInformation } from './tool-contract-assertions'
// @vitest-environment jsdom
import { afterAll, afterEach, expect, it, vi } from 'vitest'
import * as nativeSchemaOwner from '@asyra/ai-agent-runtime/schema'
import { basicApiContracts } from '../../src/ai/basic-api-catalog'
import {
  invokeLocalTool,
  localToolFailureSchema
} from '../local-tool-invocation'
import { operationInputIssue } from '@asyra/ai-agent-runtime/schema'
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
          tool.registeredName === 'design_operations.read_design_resources'
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
      (d) => d.name === 'read_design_resources'
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
    // Flatten only a pure union. Sibling constraints remain attached; this
    // independent comparator does not call a production schema transform.
    const value = schema as Record<string, unknown>

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
  const { $ref, $defs: _definitions, examples: _examples, ...rest } = value

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

  // Ignore only representation order and duplicate inclusive alternatives.
  // Exclusive-union multiplicity and literal array order remain exact.
  return schemaSets(resolved)
}

const schemaRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const flattenPureAlternatives = (schema: unknown): unknown[] =>
  schemaRecord(schema) &&
  Object.keys(schema).length === 1 &&
  Array.isArray(schema.anyOf)
    ? schema.anyOf.flatMap(flattenPureAlternatives)
    : [schema]

const schemaSets = (schema: unknown): unknown => {
  if (Array.isArray(schema)) {
    return schema.map(schemaSets)
  }

  if (!schemaRecord(schema)) {
    return schema
  }

  const normalized = Object.fromEntries(
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

  if (Array.isArray(normalized.anyOf)) {
    const alternatives = normalized.anyOf.flatMap(flattenPureAlternatives)

    normalized.anyOf = alternatives
      .filter(
        (value, index) =>
          !alternatives
            .slice(0, index)
            .some((previous) => isEqual(previous, value))
      )
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  }

  return normalized
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

// Authority: ai-execution-flow.md, Selected operation contract delivery; and
// ai-conversation-verification.md, Required proof for every verification method.
// Observe the actual discovery producer and compare its delivered schema using
// the independent structural oracle. Lineage alone cannot prove preservation.
// Independent semantic controls and formal owner/provider suites remain required.
const originalUsageProjection = workflowOwner.workflowUsageParameters
const usageProjection = vi.spyOn(workflowOwner, 'workflowUsageParameters')
const originalScopeProjection = workflowOwner.projectWorkflowInput
const scopeProjection = vi.spyOn(workflowOwner, 'projectWorkflowInput')

afterEach(() => {
  usageProjection.mockClear()
  scopeProjection.mockClear()
})
afterAll(() => {
  usageProjection.mockRestore()
  scopeProjection.mockRestore()
})

const schemaProperty = (schema: unknown, name: string): unknown => {
  if (
    !isRecord(schema) ||
    !isRecord(schema.properties) ||
    !Object.hasOwn(schema.properties, name)
  ) {
    throw new Error('Missing declared schema property: ' + name)
  }

  return schema.properties[name]
}

const observedUsageSource = (delivered: unknown): unknown => {
  const index = usageProjection.mock.results.findIndex(
    (result) => result.type === 'return' && isEqual(result.value, delivered)
  )

  expect(
    index,
    'Delivered schema must be an actual producer output'
  ).toBeGreaterThanOrEqual(0)

  const source = usageProjection.mock.calls[index][0]

  expect(
    equivalentDeliveredSchema(delivered, source),
    'Delivered schema must preserve source constraints'
  ).toBe(true)

  return source
}

// Independent expectations for the sole opted-in owner. Never call its scope
// selector/projector or inspect their returned values to construct an oracle.
// All node kinds are selected here, so their complete canonical contracts remain.
// Narrow node/repetition behavior has separate semantic owner regressions.
const canonicalWorkflowScope = (input: unknown, scope: unknown): unknown => {
  if (!isRecord(input) || !isRecord(scope) || !Array.isArray(input.oneOf)) {
    throw new Error('Missing canonical workflow scope')
  }

  const expected = structuredClone(input)
  const properties = expected.properties
  const definitions = expected.$defs

  if (!isRecord(properties) || !isRecord(definitions)) {
    throw new Error('Missing canonical workflow properties')
  }

  const operations = input.oneOf.filter(isRecord)

  expect(operations.map((branch) => branch.required)).toEqual([
    ['draft'],
    ['repair'],
    ['parts']
  ])
  const branch = operations.find((entry) =>
    isEqual(entry.required, [scope.operation])
  )

  if (!branch || !isRecord(branch.properties)) {
    throw new Error('Missing canonical operation alternative')
  }

  expected.oneOf = [structuredClone(branch)]
  delete expected['x-design-input-scope']
  for (const [name, constraint] of Object.entries(branch.properties)) {
    expect(constraint, 'Operation exclusions must be explicit').toBe(false)
    properties[name] = false
  }

  const selected = Array.isArray(scope.optionalInputs)
    ? scope.optionalInputs
    : []

  for (const name of ['retain', 'delivery']) {
    expect(Object.hasOwn(properties, name)).toBe(true)
    if (!selected.includes(name)) {
      properties[name] = false
    }
  }

  const draft = definitions.readyDraft
  const node = definitions.node

  if (!isRecord(draft) || !isRecord(node) || !Array.isArray(node.anyOf)) {
    throw new Error('Missing canonical draft and node contracts')
  }

  const nodes = node.anyOf.filter(isRecord)
  const kinds = nodes.flatMap((entry) => {
    const type = schemaProperty(entry, 'type')

    if (!isRecord(type)) {
      throw new Error('Missing canonical node discriminator')
    }

    return Array.isArray(type.enum) ? type.enum : [type.const]
  })

  expect(scope.nodeTypes).toEqual(kinds)
  const ordinaryNode = nodes.find((entry) => {
    const type = schemaProperty(entry, 'type')

    return (
      isRecord(type) &&
      Array.isArray(type.enum) &&
      type.enum.includes('group') &&
      type.enum.includes('frame')
    )
  })

  if (!ordinaryNode) {
    throw new Error('Missing canonical ordinary-node contract')
  }

  const optionalGroups = [
    {
      name: 'layout',
      owners: [draft, ordinaryNode],
      fields: ['layout', 'padding', 'gap', 'columns', 'align']
    },
    { name: 'relations', owners: [draft], fields: ['relations'] },
    { name: 'sharedFills', owners: [draft], fields: ['sharedFills'] }
  ]

  for (const group of optionalGroups) {
    for (const owner of group.owners) {
      if (!isRecord(owner.properties)) {
        throw new Error('Missing canonical authoring fields')
      }

      for (const name of group.fields) {
        expect(Object.hasOwn(owner.properties, name)).toBe(true)
        if (!selected.includes(group.name)) {
          owner.properties[name] = false
        }
      }
    }
  }

  return expected
}

const assertScopedParameters = (
  delivered: unknown,
  canonical: unknown,
  scope: unknown,
  registered = false
) => {
  const parameterSource = observedUsageSource(delivered)

  if (!isRecord(parameterSource)) {
    throw new Error('Missing actual parameter source')
  }

  const params = registered
    ? schemaProperty(parameterSource, 'input')
    : parameterSource

  expect(
    equivalentDeliveredSchema(params, canonicalWorkflowScope(canonical, scope)),
    'Selected contract must preserve canonical scope constraints'
  ).toBe(true)
}

it.each([
  'unchanged',
  'equivalent-reference',
  'equivalent-intersection',
  'equivalent-union',
  'weaken-message',
  'open-draft',
  'remove-operation'
])(
  'checks canonical scope preservation through discovery - %s',
  async (fault) => {
    const current = createDeliveryAuditFixture()
    const name = 'design_workflow.prepare_and_apply_design'
    const definition = current.host
      .definitions()
      .find((item) => item.registeredName === name)

    if (!definition) {
      throw new Error('Missing workflow registration')
    }

    const choices = workflowInputScopes(definition.inputSchema)

    if (!choices) {
      throw new Error('Missing workflow choices')
    }

    const scope = { operation: 'draft', nodeTypes: choices.nodeTypes }
    let reached = 0

    scopeProjection.mockImplementation((input, selection) => {
      const selected = structuredClone(
        originalScopeProjection(input, selection)
      )

      if (
        !isRecord(selected.properties) ||
        !isRecord(selected.$defs) ||
        !isRecord(selected.$defs.readyDraft) ||
        !isRecord(selected.properties.message)
      ) {
        throw new Error('Missing selected workflow constraints')
      }

      reached++
      if (fault === 'weaken-message') {
        selected.properties.message.maxLength = 2000
      } else if (fault === 'open-draft') {
        selected.$defs.readyDraft.additionalProperties = true
      } else if (fault === 'remove-operation') {
        delete selected.oneOf
      } else if (fault === 'equivalent-reference') {
        selected.$defs.auditMessage = selected.properties.message
        selected.properties.message = { $ref: '#/$defs/auditMessage' }
      } else if (fault === 'equivalent-intersection') {
        selected.properties.message = {
          allOf: [{ allOf: [selected.properties.message] }]
        }
      } else if (fault === 'equivalent-union') {
        selected.properties.message = {
          anyOf: [
            selected.properties.message,
            { anyOf: [selected.properties.message] }
          ]
        }
      }

      return selected
    })
    try {
      const responseText = await readCompleteInformation(
        async (input, tool) =>
          (
            await current.host.invoke({
              name: 'design_operations.' + tool,
              input
            })
          ).text,
        {
          names: [name],
          view: 'usage',
          scopes: { [name]: { inputScope: scope } }
        },
        'read_design_resources'
      )
      const response = JSON.parse(responseText).tools?.[0]

      expect(response, responseText).toBeDefined()
      expect(reached).toBeGreaterThan(0)
      expect(response.execution.kind).toBe('host-operation')

      if (fault === 'weaken-message') {
        const invocation = response.invocationExample.invocation
        const input = {
          ...invocation.arguments.operations[0].arguments,
          message: 'x'.repeat(1001)
        }

        expect(operationInputIssue(input, definition.inputSchema)).toContain(
          'string is too long'
        )
        expect(
          operationInputIssue(input, response.usageGuide.parameters)
        ).toBeUndefined()
      }

      const audit = () =>
        assertScopedParameters(
          response.usageGuide.parameters,
          definition.inputSchema,
          scope
        )

      if (
        ['weaken-message', 'open-draft', 'remove-operation'].includes(fault)
      ) {
        expect(audit).toThrow(
          /Selected contract must preserve canonical scope constraints/
        )
      } else {
        audit()
      }

      expect(current.execute).not.toHaveBeenCalled()
    } finally {
      scopeProjection.mockReset()
      scopeProjection.mockImplementation(originalScopeProjection)
      await current.dispose()
    }
  }
)

it.each(
  ['parameters', 'results'].flatMap((field) =>
    ['accepts healthy', 'rejects corrupted'].map((expectation) => [
      expectation,
      field
    ])
  )
)(
  '%s calculation %s in the shared delivered-contract audit',
  async (expectation, field) => {
    const current = createDeliveryAuditFixture()

    const read = async () => {
      const text = await readCompleteInformation(
        async (input, tool) =>
          (
            await current.host.invoke({
              name: 'design_operations.' + tool,
              input
            })
          ).text,
        {
          names: ['design_operations.record_design_calculations'],
          view: 'usage',
          includeResultSchema: true
        },
        'read_design_resources'
      )

      return JSON.parse(text).tools[0].usageGuide
    }

    const rewrite = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        return value.map(rewrite)
      }

      if (!isRecord(value)) {
        return value
      }

      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [
          key,
          key === 'maxLength' && child === 1000 ? 2000 : rewrite(child)
        ])
      )
    }

    try {
      if (expectation === 'rejects corrupted') {
        usageProjection.mockImplementation((input) => {
          const projected = originalUsageProjection(input)

          if (field === 'results' && Array.isArray(projected.anyOf)) {
            return { ...projected, anyOf: [...projected.anyOf, {}] }
          }

          const rewritten =
            field === 'parameters' ? rewrite(projected) : projected

          if (!isRecord(rewritten)) {
            throw new Error('Malformed audit fault')
          }

          return rewritten
        })
      }

      const delivered = await read()
      const probe =
        field === 'parameters'
          ? {
              calculations: [{ id: 'probe', value: 1, unit: 'a'.repeat(1001) }]
            }
          : {}

      if (expectation === 'accepts healthy') {
        expect(operationInputIssue(probe, delivered[field])).toBeDefined()
        expect(() => observedUsageSource(delivered[field])).not.toThrow()
      } else {
        expect(operationInputIssue(probe, delivered[field])).toBeUndefined()
        expect(() => observedUsageSource(delivered[field])).toThrow(
          /Delivered schema must preserve source constraints/
        )
      }

      expect(current.execute).not.toHaveBeenCalled()
    } finally {
      usageProjection.mockReset()
      usageProjection.mockImplementation(originalUsageProjection)
      await current.dispose()
    }
  }
)

it('keeps the audit oracle independent when native schema conversion drops a constraint', () => {
  const converter = vi
    .spyOn(nativeSchemaOwner, 'nativeToolInputSchema')
    .mockImplementation(() => ({ type: 'number' }))

  try {
    const required = { type: 'number', minimum: 5 }
    const weakened = { type: 'number', minimum: 0 }

    expect(exactResultAlternatives(required)).not.toEqual(
      exactResultAlternatives(weakened)
    )
    expect(converter).not.toHaveBeenCalled()
  } finally {
    converter.mockRestore()
  }
})

it.each(['none', 'weaken-input', 'open-result'])(
  'detects %s at the actual discovery-to-owner handoff with independent semantics',
  async (fault) => {
    const current = createDeliveryAuditFixture()
    const original = originalUsageProjection

    const rewrite = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        return value.map(rewrite)
      }

      if (!isRecord(value)) {
        return value
      }

      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [
          key,
          key === 'maxLength' && child === 1000 ? 2000 : rewrite(child)
        ])
      )
    }

    usageProjection.mockImplementation((input) => {
      const value = original(input)

      if (fault === 'weaken-input') {
        const rewritten = rewrite(value)

        if (!isRecord(rewritten)) {
          throw new Error('Malformed fault fixture')
        }

        return rewritten
      }

      if (fault === 'open-result' && Array.isArray(value.anyOf)) {
        return { ...value, anyOf: [...value.anyOf, {}] }
      }

      return value
    })
    try {
      const text = await readCompleteInformation(
        async (input, tool) =>
          (
            await current.host.invoke({
              name: 'design_operations.' + tool,
              input
            })
          ).text,
        {
          names: ['design_operations.record_design_facts'],
          view: 'usage',
          includeResultSchema: true
        },
        'read_design_resources'
      )
      const guide = JSON.parse(text).tools[0].usageGuide
      const facts = [{ id: 'source', statement: 'Requested dimensions' }]
      const settled = await current.host.invoke({
        name: 'design_operations.record_design_facts',
        input: { facts }
      })

      expect(settled.outcome).toMatchObject({
        status: 'success',
        settlement: 'completed'
      })
      expect(JSON.parse(settled.text).facts).toEqual(facts)

      const assertSemantics = () => {
        for (const [length, accepted] of [
          [1000, true],
          [1001, false]
        ] as const) {
          expect(
            operationInputIssue(
              { facts: [{ id: 'source', statement: 'a'.repeat(length) }] },
              guide.parameters
            ) === undefined,
            'Declared fact character boundary'
          ).toBe(accepted)
        }

        expect(
          operationInputIssue(JSON.parse(settled.text), guide.results)
        ).toBeUndefined()
        expect(
          operationInputIssue({}, guide.results),
          'Missing owner result must reject'
        ).toBeDefined()
      }

      if (fault === 'none') {
        assertSemantics()
      } else {
        expect(assertSemantics).toThrow(
          fault === 'weaken-input'
            ? /Declared fact character boundary/
            : /Missing owner result must reject/
        )
      }

      expect(current.execute).not.toHaveBeenCalled()
    } finally {
      usageProjection.mockReset()
      usageProjection.mockImplementation(original)
      await current.dispose()
    }
  }
)

it('requires independent operation-scope coverage for every opted-in registered owner', () => {
  const scopedOwners = host
    .definitions()
    .filter(
      (definition) =>
        isRecord(definition.inputSchema) &&
        Object.hasOwn(definition.inputSchema, 'x-design-input-scope')
    )
    .map((definition) => definition.registeredName)
    .sort()

  // Current selected-operation specification: this is the only opted-in owner.
  // New owners require independent scope semantics before catalog totals can pass.
  expect(scopedOwners).toEqual(['design_workflow.prepare_and_apply_design'])
})

it.each(['none', 'omit-parts'])(
  'detects %s in delivered operation scopes without deriving expectations from the selector',
  async (fault) => {
    const original = workflowOwner.workflowInputScopes
    const selector = vi
      .spyOn(workflowOwner, 'workflowInputScopes')
      .mockImplementation((input) => {
        const scopes = original(input)

        return scopes && fault === 'omit-parts'
          ? {
              ...scopes,
              operations: scopes.operations.filter(
                (operation) => operation !== 'parts'
              )
            }
          : scopes
      })
    const current = createDeliveryAuditFixture()

    try {
      const text = await readCompleteInformation(
        async (input, tool) =>
          (
            await current.host.invoke({
              name: 'design_operations.' + tool,
              input
            })
          ).text,
        { names: ['design_workflow.prepare_and_apply_design'], view: 'usage' },
        'read_design_resources'
      )

      const assertScopes = () =>
        expect(
          JSON.parse(text).tools[0].inputScopes.operations,
          'All declared workflow operations must remain selectable'
        ).toEqual(['draft', 'repair', 'parts'])

      if (fault === 'none') {
        assertScopes()
      } else {
        expect(assertScopes).toThrow(
          /All declared workflow operations must remain selectable/
        )
      }

      expect(selector).toHaveBeenCalled()
      expect(current.execute).not.toHaveBeenCalled()
    } finally {
      selector.mockRestore()
      await current.dispose()
    }
  }
)

it('compares complete owner unions independent of nesting and rejects destructive contract edits', () => {
  const success = {
    type: 'object',
    additionalProperties: false,
    required: ['status', 'count'],
    properties: {
      status: { const: 'complete' },
      count: { type: 'integer', minimum: 0 }
    }
  }
  const failed = {
    type: 'object',
    additionalProperties: false,
    required: ['status', 'message'],
    properties: { status: { const: 'failed' }, message: { type: 'string' } }
  }
  const owner = { anyOf: [success, failed] }

  expect(
    exactResultAlternatives({ anyOf: [{ anyOf: [failed, success] }] })
  ).toEqual(exactResultAlternatives(owner))
  expect(
    exactResultAlternatives({
      type: 'object',
      required: ['result'],
      additionalProperties: false,
      properties: { result: { anyOf: [success, { anyOf: [failed, success] }] } }
    })
  ).toEqual(
    exactResultAlternatives({
      type: 'object',
      required: ['result'],
      additionalProperties: false,
      properties: { result: owner }
    })
  )
  expect(
    exactResultAlternatives({
      type: 'object',
      required: ['result'],
      additionalProperties: false,
      properties: {
        result: { anyOf: [{ anyOf: [failed, success], required: ['count'] }] }
      }
    })
  ).not.toEqual(
    exactResultAlternatives({
      type: 'object',
      required: ['result'],
      additionalProperties: false,
      properties: { result: owner }
    })
  )
  for (const broken of [
    { anyOf: [success] },
    { anyOf: [success, failed, {}] },
    { anyOf: [{ ...success, required: ['status'] }, failed] },
    {
      anyOf: [
        {
          ...success,
          properties: { ...success.properties, count: { type: 'number' } }
        },
        failed
      ]
    }
  ]) {
    expect(exactResultAlternatives(broken)).not.toEqual(
      exactResultAlternatives(owner)
    )
  }
})

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

it('compares distributed inclusive branches without dropping their common constraints', () => {
  const count = { type: 'integer', minimum: 1 }
  const text = { type: 'string', minLength: 2 }
  const common = { description: 'Bounded value', not: { const: null } }
  const separate = {
    anyOf: [
      { ...common, anyOf: [count] },
      { ...common, anyOf: [text, count] }
    ]
  }
  const grouped = { anyOf: [{ ...common, anyOf: [count, text] }] }

  expect(equivalentDeliveredSchema(separate, grouped)).toBe(true)
  expect(equivalentDeliveredSchema(grouped, { anyOf: [count, text] })).toBe(
    false
  )
  expect(
    equivalentDeliveredSchema({ allOf: [count, { allOf: [count] }] }, count)
  ).toBe(true)
  expect(equivalentDeliveredSchema({ oneOf: [count, count] }, count)).toBe(
    false
  )
})

it('compares recursive delivered graphs without reference-index identities or hidden constraint loss', () => {
  const source = {
    type: 'object',
    properties: {
      value: { type: 'string', maxLength: 3 },
      children: { type: 'array', items: { $ref: '#' } }
    }
  }
  const delivered = {
    $ref: '#/$defs/node',
    $defs: {
      node: {
        type: 'object',
        properties: {
          value: { $ref: '#/$defs/text' },
          children: { $ref: '#/$defs/children' }
        }
      },
      text: { type: 'string', maxLength: 3 },
      children: { type: 'array', items: { $ref: '#/$defs/node' } }
    }
  }

  expect(equivalentDeliveredSchema(delivered, source)).toBe(true)
  expect(equivalentDeliveredSchema(source, delivered)).toBe(true)
  const changed = structuredClone(delivered)

  changed.$defs.text.maxLength = 4
  expect(equivalentDeliveredSchema(changed, source)).toBe(false)
  const sibling = {
    $ref: '#/$defs/value',
    maxLength: 2,
    $defs: { value: { type: 'string' } }
  }

  expect(
    equivalentDeliveredSchema(sibling, {
      allOf: [{ type: 'string' }, { maxLength: 2 }]
    })
  ).toBe(true)
  expect(equivalentDeliveredSchema(sibling, { type: 'string' })).toBe(false)
  expect(
    equivalentDeliveredSchema(
      { const: { required: ['a', 'b'] } },
      { const: { required: ['b', 'a'] } }
    )
  ).toBe(false)
  expect(() =>
    equivalentDeliveredSchema({ $ref: '#/$defs/missing' }, {})
  ).toThrow(/Missing schema reference/)
})

it('does not multiply leaf comparisons through nested equivalent inclusive branches', () => {
  let reads = 0
  const leftLeaf = {
    const: {
      get value() {
        reads++

        return 'literal'
      }
    }
  }
  const rightLeaf = { const: { value: 'literal' } }

  expect(equivalentDeliveredSchema(leftLeaf, rightLeaf)).toBe(true)
  const leafReads = reads
  let left: unknown = leftLeaf
  let right: unknown = rightLeaf

  for (let level = 0; level < 12; level++) {
    left = {
      anyOf: [{ type: 'null' }, { type: 'object', properties: { next: left } }]
    }
    right = {
      anyOf: [{ type: 'null' }, { type: 'object', properties: { next: right } }]
    }
  }

  reads = 0
  expect(equivalentDeliveredSchema(left, right)).toBe(true)
  expect(reads).toBe(leafReads)
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
  '$definition.name delivers observed usage parameters and results through its advertised route - case %#',
  async ({ definition, namespace }) => {
    const query = operations.definitions.find(
      (d) => d.name === 'read_design_resources'
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
      'read_design_resources'
    )
    const registeredDefinition = host
      .definitions()
      .find((d) => d.registeredName === `${namespace}.${definition.name}`)

    if (!registeredDefinition) {
      throw new Error('Missing host registration')
    }

    const menu = JSON.parse(text)

    if (namespace === 'design_knowledge') {
      expect(menu.missingNames).toEqual([registeredDefinition.registeredName])
      expect(menu.tools).toEqual([])
      expect(registeredDefinition.inputSchema).toEqual(definition.inputSchema)
      const input = { ids: ['colors'] }

      expect(
        operationInputIssue(input, registeredDefinition.inputSchema)
      ).toBeUndefined()
      // Successful knowledge responses are exercised at their separately published
      // provider entries. This reader must return neither tool nor advice here.
      expect(menu.code).toBe('IDENTITY_UNRESOLVED')
      expect(execute).not.toHaveBeenCalled()

      return
    }

    const entry = menu.tools[0]

    expect(entry, text.slice(0, 1000)).toBeDefined()

    const scopes = workflowInputScopes(registeredDefinition.inputSchema)

    if (scopes) {
      expect(entry.inputScopes).toEqual(scopes)
      expect(entry.definition.nextAction).toBe('select-operation-scope')
      const selections = scopes.operations.flatMap((operation) => [
        { operation, optionalInputs: undefined },
        {
          operation,
          optionalInputs: [
            'retain',
            'delivery',
            'layout',
            'relations',
            'sharedFills'
          ]
        }
      ])

      for (const { operation, optionalInputs } of selections) {
        const inputScope = {
          operation,
          ...(scopes.nodeTypes.length ? { nodeTypes: scopes.nodeTypes } : {}),
          ...(optionalInputs ? { optionalInputs } : {})
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
            'read_design_resources'
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

        assertScopedParameters(
          selected.usageGuide.parameters,
          registeredDefinition.inputSchema,
          inputScope,
          selected.execution.kind === 'registered-tool'
        )
        observedUsageSource(selected.usageGuide.results)
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
      const parameterSource = observedUsageSource(entry.usageGuide.parameters)

      if (!isRecord(parameterSource)) {
        throw new Error('Missing actual parameter source')
      }

      const parameters = registered
        ? schemaProperty(parameterSource, 'input')
        : parameterSource

      expect(
        resolvedSchema(parameters, parameterSource),
        definition.name
      ).toEqual(resolvedSchema(registeredDefinition.inputSchema))
      expect(entry.definition.nextAction).toBe(
        'execute-with-delivered-contract'
      )
      observedUsageSource(entry.usageGuide.results)
      // Exercise the advertised error consumer as well as observing its schema.
      const rejected = registered
        ? await host.invoke({
            name: 'tool_library.invoke_tool',
            input: { ...entry.execution.arguments, revision: 0, input: {} }
          })
        : await host.invoke({
            name: registeredDefinition.registeredName,
            input: null
          })

      expect(rejected.outcome.settlement).toBe('not-started')
      expect(
        operationInputIssue(JSON.parse(rejected.text), entry.usageGuide.results)
      ).toBeUndefined()
    }

    expect(execute).not.toHaveBeenCalled()
  }
)

it.each(runtime.actionDefinitions)(
  '$name selected action usage retains parameters independently of its effect - case %#',
  async (action) => {
    const query = operations.definitions.find(
      (d) => d.name === 'read_design_resources'
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
      'read_design_resources'
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

    const parameterSource = observedUsageSource(
      entry.usageGuide.operationParameters ?? entry.usageGuide.parameters
    )

    if (!isRecord(parameterSource)) {
      throw new Error('Missing actual action parameter source')
    }

    // Follow the declared route, not an assumed conversion for every action.
    // Final responses use the action contract; explicit native observers use
    // their registered wrapper; batch operations use their admitted arguments.
    if (entry.execution.kind === 'host-operation') {
      const owner = host
        .definitions()
        .find(
          (candidate) => candidate.registeredName === entry.execution.operation
        )

      expect(
        owner,
        'Published operation must have its actual registered owner'
      ).toBeDefined()
      expect(resolvedSchema(parameterSource)).toEqual(
        resolvedSchema(owner?.inputSchema)
      )
    } else {
      expect(['batch-action', 'final-response']).toContain(entry.execution.kind)
      expect(resolvedSchema(parameterSource)).toEqual(
        resolvedSchema(admitted.inputSchema)
      )
    }

    observedUsageSource(entry.usageGuide.results)
    if ('delivery' in admitted && admitted.delivery) {
      expect(entry.outputFields).not.toContain('/properties/modelResult')
      expect(entry.result).toBeUndefined()
      // A view missing its owner-required fields must not pass through a
      // permissive internal resource branch.
      expect(
        operationInputIssue({}, entry.usageGuide.results),
        action.name
      ).toBeDefined()
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
    (d) => d.name === 'read_design_resources'
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
  const unicodeInput = { ...input, message: '\u{2000B}'.repeat(1000) }

  expect(
    operationInputIssue(unicodeInput, tool.usageGuide.parameters)
  ).toBeUndefined()
  expect(await owner.execute(unicodeInput, { signal })).toMatchObject({
    status: 'no-change',
    outcome: 'unsupported',
    message: unicodeInput.message
  })
  expect(
    operationInputIssue(
      { ...unicodeInput, message: unicodeInput.message + '\u{2000B}' },
      tool.usageGuide.parameters
    )
  ).toBeDefined()
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
    if (registration.namespace === 'design_knowledge') {
      const reply = await host.invoke({
        name: registration.registeredName,
        input: null
      })
      const result = JSON.parse(reply.text)

      expect(reply.success).toBe(false)
      expect(result).toMatchObject({
        code: 'TOOL_INPUT_INVALID',
        toolOutcome: { status: 'failed', settlement: 'not-started' }
      })
      expect(
        operationInputIssue(result, localToolFailureSchema)
      ).toBeUndefined()
      expect(execute).not.toHaveBeenCalled()

      return
    }

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
        'read_design_resources'
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

it('delivers the complete execution input for every independently registered action and native tool through exact search', async () => {
  const catalog = host.definitions()
  const measurements: { query: string; pages: number; bytes: number }[] = []
  const allTools = catalog.filter(
    (tool) => tool.namespace !== 'design_knowledge'
  )
  const visibleNames = native
    .filter((tool) => tool.namespace !== 'design_knowledge')
    .map((tool) => tool.namespace + '.' + tool.definition.name)

  expect(allTools.map((tool) => tool.registeredName)).toEqual(
    expect.arrayContaining(visibleNames)
  )

  const check = async (
    query: string,
    category: string | undefined,
    kind: 'apis' | 'tools',
    expected: unknown
  ) => {
    let pages = 0
    const text = await readCompleteInformation(
      async (input, tool) => {
        const response = await host.invoke({
          name: 'design_operations.' + tool,
          input
        })

        pages++
        expect(response.outcome.status, query).toBe('success')

        return response.text
      },
      category ? { query, category } : { query },
      'search_design_tools'
    )
    const page = JSON.parse(text)

    expect(page.count, query).toBe(1)
    const item = page[kind][0]

    expect(item.operationParameters, query).toBeDefined()
    const routeOwner =
      kind === 'apis' && item.execution.kind === 'host-operation'
        ? catalog.find(
            (tool) => tool.registeredName === item.execution.operation
          )?.inputSchema
        : expected

    expect(routeOwner, query).toBeDefined()
    if (!isRecord(routeOwner)) {
      throw new Error('Missing admitted input for ' + query)
    }

    const {
      'x-design-discovery': _metadata,
      'x-design-input-scope': _scopes,
      ...ordinary
    } = routeOwner

    expect(
      equivalentDeliveredSchema(item.operationParameters, ordinary),
      query
    ).toBe(true)
    measurements.push({ query, pages, bytes: Buffer.byteLength(text) })
  }

  for (const action of preparation.modelActions(actions)) {
    const basic = basicApiContracts.find((entry) => entry.name === action.name)

    await check(
      basic?.operation ?? action.name,
      basic?.category ?? 'design',
      'apis',
      action.inputSchema
    )
  }

  for (const tool of allTools) {
    await check(tool.registeredName, undefined, 'tools', tool.inputSchema)
  }

  process.stdout.write(
    JSON.stringify({
      measurement: 'search-catalog',
      actions: actions.length,
      tools: allTools.length,
      searches: measurements.length,
      paged: measurements.filter((m) => m.pages > 1),
      maximum: Math.max(...measurements.map((m) => m.pages))
    }) + '\n'
  )
  expect(execute).not.toHaveBeenCalled()
}, 60000)

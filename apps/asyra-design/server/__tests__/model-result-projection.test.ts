import { expect, it } from 'vitest'
import {
  modelToolResultSchemas,
  modelToolDeliveryFailureSchema,
  projectToolDelivery,
  projectToolResultFields,
  toolDeliveryFailure,
  toolInternalResult,
  toolResultObject
} from '../../src/ai/tool-contract'
import { operationContractIssue } from '../operation-input-schema'

it('keeps missing-owner delivery failures valid without admitting undeclared evidence', () => {
  const schema = modelToolDeliveryFailureSchema({})
  const failure = {
    available: false,
    recoverable: true,
    code: 'TOOL_DELIVERY_INVALID',
    message:
      'The selected owner is unavailable; execution must not be replayed.',
    settlement: 'not-started',
    toolOutcome: { status: 'partial', settlement: 'not-started' }
  }

  expect(
    operationContractIssue(failure, schema, { stage: 'output' })
  ).toBeUndefined()
  for (const executionResult of [null, {}, [], 'unverified']) {
    expect(
      operationContractIssue({ ...failure, executionResult }, schema, {
        stage: 'output'
      })
    ).toBeDefined()
  }
})

it('projects variant envelopes while preserving explicitly open domain keys', () => {
  const schema = {
    anyOf: ['partial', 'complete'].map((kind) =>
      toolResultObject({
        kind: { const: kind },
        ...(kind === 'partial'
          ? { remaining: { type: 'array', items: { type: 'string' } } }
          : { handle: { type: 'string' } }),
        values: { type: 'object', additionalProperties: true }
      })
    )
  }

  for (const result of [
    {
      kind: 'partial',
      remaining: ['second'],
      values: { 'user:a': { context: 1, timing: 2 } }
    },
    {
      kind: 'complete',
      handle: 'result',
      values: { 'user:b': { source: 'user value' } }
    }
  ]) {
    // Selection follows a valid branch. Host metadata is not an owner data field.
    const actual = projectToolResultFields(result, schema)

    expect(actual).toEqual(result)
    expect(
      operationContractIssue(actual, schema, { stage: 'output' })
    ).toBeUndefined()
  }
})

it.each(['patternProperties', 'if', 'then', 'else'])(
  'rejects unsupported %s rather than treating an unevaluated constraint as valid',
  (keyword) => {
    expect(
      operationContractIssue(
        {},
        { type: 'object', [keyword]: {} },
        { stage: 'output' }
      )
    ).toContain('unsupported schema keyword ' + keyword)
  }
)

it.each(['inline', 'allOf', 'reference'])(
  'projects required internal dependencies and counts across %s constraints',
  (placement) => {
    const constraints = {
      minProperties: 2,
      maxProperties: 3,
      dependentRequired: { work: ['count'], count: ['work', 'label'] }
    }
    const raw = {
      type: 'object',
      properties: {
        work: toolInternalResult({ type: 'number' }),
        count: { type: 'integer', minimum: 0 },
        label: { type: 'string' }
      },
      required: ['work'],
      additionalProperties: false,
      ...(placement === 'inline' ? constraints : { allOf: [constraints] })
    }
    const ownerSchema =
      placement === 'reference'
        ? {
            $defs: { fields: raw },
            $ref: '#/$defs/fields',
            minProperties: 2,
            maxProperties: 3
          }
        : raw
    const published = modelToolResultSchemas({
      outputSchema: ownerSchema,
      delivery: {
        path: '',
        outputSchema: {
          type: 'object',
          properties: {
            count: { type: 'integer', minimum: 0 },
            label: { type: 'string' }
          },
          required: ['count', 'label'],
          additionalProperties: false
        }
      }
    }).outputSchema
    const outcome = { status: 'success', settlement: 'completed' }
    const valid = { count: 1, label: 'ready' }

    expect(
      operationContractIssue({ work: 2, count: 1, label: 'ready' }, raw, {
        stage: 'output'
      })
    ).toBeUndefined()
    expect(
      operationContractIssue(valid, published, { stage: 'output' })
    ).toBeUndefined()
    for (const value of [
      { toolOutcome: outcome },
      { count: 1, toolOutcome: outcome },
      { ...valid, count: -1 }
    ]) {
      expect(
        operationContractIssue(value, published, { stage: 'output' })
      ).toBeDefined()
    }
  }
)

it('projects dynamic map values and references without losing names or mutating evidence', () => {
  const schema = {
    $defs: {
      result: toolResultObject({
        id: { type: 'string' },
        work: toolInternalResult({ type: 'number' })
      })
    },
    type: 'object',
    additionalProperties: { $ref: '#/$defs/result' }
  }
  const input = JSON.parse(
    '{"__proto__":{"id":"first","work":3},"context":{"id":"second","work":4}}'
  )
  const before = JSON.stringify(input)
  const actual = projectToolResultFields(input, schema)

  expect(actual).toEqual(
    JSON.parse('{"__proto__":{"id":"first"},"context":{"id":"second"}}')
  )
  expect(JSON.stringify(input)).toBe(before)
})

it('does not publish a declared internal-only envelope or its required keys', () => {
  const schema = toolResultObject({
    work: toolInternalResult({ type: 'number' })
  })

  const projected = projectToolResultFields({ work: 4 }, schema)

  expect(projected).toEqual({})
  const published = modelToolResultSchemas({
    outputSchema: schema
  }).outputSchema

  expect(JSON.stringify(published)).not.toContain('work')
  expect(
    operationContractIssue(projected, published, { stage: 'output' })
  ).toBeUndefined()
})

it.each(['partial', 'failed'])(
  'publishes and preserves a closed %s owner receipt without a success view',
  (status) => {
    const partial = {
      type: 'object',
      additionalProperties: false,
      properties: {
        status: { enum: ['partial', 'failed'] },
        settlement: { const: 'partial' },
        completed: { type: 'array', items: { type: 'string' } },
        remaining: { type: 'array', items: { type: 'string' } },
        observation: toolInternalResult({ type: 'number' })
      },
      required: [
        'status',
        'settlement',
        'completed',
        'remaining',
        'observation'
      ]
    }
    const contract = {
      outputSchema: toolResultObject({ view: { type: 'object' } }),
      ...(status === 'partial'
        ? { partialOutputSchema: partial }
        : { recoveryOutputSchema: partial }),
      delivery: {
        path: '/view',
        outputSchema: toolResultObject({ id: { type: 'string' } })
      }
    }

    {
      const original = {
        status,
        settlement: 'partial',
        completed: ['one'],
        remaining: ['two'],
        observation: 8
      }
      const projected = projectToolDelivery(contract, original, {
        status: status as 'partial' | 'failed',
        settlement: 'partial'
      }).value

      expect(projected).toEqual({
        status,
        settlement: 'partial',
        completed: ['one'],
        remaining: ['two']
      })
      expect(
        operationContractIssue(
          projected,
          status === 'partial'
            ? modelToolResultSchemas(contract).partialOutputSchema
            : modelToolResultSchemas(contract).recoveryOutputSchema,
          { stage: 'output' }
        )
      ).toBeUndefined()
      expect(original.observation).toBe(8)
    }
  }
)

it('preserves local result references inside acknowledged delivery failure evidence', () => {
  const contract = {
    outputSchema: {
      ...toolResultObject({ id: { $ref: '#/$defs/identity' } }),
      $defs: { identity: { type: 'string' } }
    }
  }
  const original = {
    id: 'acknowledged'
  }
  const failure = toolDeliveryFailure(
    original,
    'Delivery interrupted',
    contract,
    { status: 'success', settlement: 'completed' }
  )

  expect(failure.executionResult).toEqual(original)
  expect(
    operationContractIssue(
      failure,
      modelToolResultSchemas(contract).partialOutputSchema,
      { stage: 'output' }
    )
  ).toBeUndefined()
})

it('keeps nested reference counts in their own projection scope', () => {
  const raw = {
    $defs: {
      entry: toolResultObject({
        count: { type: 'integer', minimum: 0 },
        work: toolInternalResult({ type: 'number' })
      })
    },
    ...toolResultObject({
      item: { $ref: '#/$defs/entry', minProperties: 2, maxProperties: 2 }
    })
  }
  const published = modelToolResultSchemas({
    outputSchema: raw,
    delivery: {
      path: '',
      outputSchema: toolResultObject({
        item: toolResultObject({ count: { type: 'integer', minimum: 0 } })
      })
    }
  }).outputSchema
  const result = {
    item: { count: 1 },
    toolOutcome: { status: 'success', settlement: 'completed' }
  }

  expect(
    operationContractIssue(result, published, { stage: 'output' })
  ).toBeUndefined()
  expect(
    operationContractIssue({ ...result, item: { count: -1 } }, published, {
      stage: 'output'
    })
  ).toBeDefined()
  expect(
    operationContractIssue({ item: { count: 1, work: 'bad' } }, raw, {
      stage: 'output'
    })
  ).toBeDefined()
})

it('retains a completed child view without selecting it again and still rejects invalid values', () => {
  let reads = 0
  const value = {
    execution: {
      value: {
        get count() {
          reads++

          return -1
        }
      }
    }
  }
  const schema = toolResultObject({
    execution: toolResultObject({
      value: toolResultObject({ count: { type: 'integer', minimum: 0 } })
    })
  })
  const projected = projectToolResultFields(value, schema, [
    '/execution/value'
  ]) as typeof value

  expect(projected.execution.value).toBe(value.execution.value)
  expect(reads).toBe(0)
  expect(
    operationContractIssue(projected, schema, { stage: 'output' })
  ).toBeDefined()
  expect(reads).toBeGreaterThan(0)
})

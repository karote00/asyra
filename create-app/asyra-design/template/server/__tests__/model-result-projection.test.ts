import { expect, it } from 'vitest'
import {
  modelToolResultSchemas,
  projectToolDelivery,
  projectToolResultFields,
  toolInternalResult,
  toolResultObject
} from '../../src/ai/tool-contract'
import { operationContractIssue } from '../operation-input-schema'

it('projects conditional and pattern-addressed envelopes without discarding domain keys', () => {
  const schema = {
    type: 'object',
    properties: { kind: { enum: ['partial', 'complete'] } },
    required: ['kind'],
    patternProperties: {
      '^user:': { type: 'object', additionalProperties: true }
    },
    if: { properties: { kind: { const: 'partial' } } },
    then: {
      properties: { remaining: { type: 'array', items: { type: 'string' } } },
      required: ['remaining']
    },
    else: { properties: { handle: { type: 'string' } }, required: ['handle'] }
  }
  for (const result of [
    {
      kind: 'partial',
      remaining: ['second'],
      'user:a': { context: 1, timing: 2 }
    },
    { kind: 'complete', handle: 'result', 'user:b': { source: 'user value' } }
  ]) {
    const actual = projectToolResultFields(
      { ...result, hostCounter: 99 },
      schema
    )
    expect(actual).toEqual(result)
    expect(
      operationContractIssue(actual, schema, { stage: 'output' })
    ).toBeUndefined()
  }
})

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
  expect(projectToolResultFields({ work: 4 }, schema)).toEqual({})
  const published = modelToolResultSchemas({
    outputSchema: schema
  }).outputSchema
  expect(JSON.stringify(published)).not.toContain('work')
  expect(
    operationContractIssue({}, published, { stage: 'output' })
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
      partialOutputSchema: partial,
      delivery: {
        path: '/view',
        outputSchema: toolResultObject({ id: { type: 'string' } })
      }
    }
    for (const metadata of [false, true]) {
      const original = {
        status,
        settlement: 'partial',
        completed: ['one'],
        remaining: ['two'],
        observation: 8,
        ...(metadata ? { toolOutcome: { status, settlement: 'partial' } } : {})
      }
      const projected = projectToolDelivery(contract, original)
      expect(projected).toEqual({
        status,
        settlement: 'partial',
        completed: ['one'],
        remaining: ['two'],
        ...(metadata ? { toolOutcome: { status, settlement: 'partial' } } : {})
      })
      expect(
        operationContractIssue(
          projected,
          modelToolResultSchemas(contract).partialOutputSchema,
          { stage: 'output' }
        )
      ).toBeUndefined()
      expect(original.observation).toBe(8)
    }
  }
)

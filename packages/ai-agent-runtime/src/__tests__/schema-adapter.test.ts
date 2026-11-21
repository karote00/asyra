import { expect, it } from 'vitest'
import { createAiToolContract, inspectAiToolResult } from '../index.js'
import {
  operationContractIssue,
  operationInputIssue,
  nativeToolInputSchema,
  projectToolDelivery
} from '@asyra/ai-agent-runtime/schema'

it('preserves complete internal results while selecting an independent provider view', () => {
  const contract = createAiToolContract({
    name: 'reserve',
    revision: 1,
    description: 'Reserve inventory',
    inputSchema: { type: 'object' },
    outputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        secret: { type: 'string', 'x-model-visibility': 'internal' }
      },
      required: ['id', 'secret']
    },
    effect: 'read',
    resources: [],
    lifecycle: { cancellation: 'cooperative', retry: 'never', output: 'value' }
  })
  const value = { id: 'reservation-1', secret: 'internal' }
  const outcome = { status: 'success', settlement: 'completed' } as const

  expect(
    inspectAiToolResult(contract, value, {
      outcome,
      validate: operationContractIssue
    }).status
  ).not.toBe('invalid')
  expect(projectToolDelivery(contract, value, outcome).value).toEqual({
    id: 'reservation-1'
  })
  expect(value.secret).toBe('internal')
  expect(
    inspectAiToolResult(
      contract,
      { id: 'reservation-1' },
      { outcome, validate: operationContractIssue }
    ).status
  ).toBe('invalid')
})

it('preserves equality, Unicode and sibling constraints through the optional schema entry', () => {
  expect(
    operationInputIssue({ b: 2, a: 1 }, { const: { a: 1, b: 2 } })
  ).toBeUndefined()
  expect(
    operationInputIssue([{ a: 1 }, { a: 1 }], { uniqueItems: true })
  ).toBeDefined()
  expect(
    operationInputIssue('😀', { type: 'string', maxLength: 1 })
  ).toBeUndefined()
  const schema = {
    type: 'object',
    properties: { count: { type: 'integer', minimum: 1 } },
    required: ['count'],
    anyOf: [{ required: ['count'] }]
  }

  expect(
    operationInputIssue({ count: 0 }, nativeToolInputSchema(schema))
  ).toBeDefined()
  expect(
    operationInputIssue({ count: 1 }, nativeToolInputSchema(schema))
  ).toBeUndefined()
})

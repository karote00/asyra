import { expect, it } from 'vitest'
import {
  operationInputIssue,
  operationInputIssues,
  formatOperationInputIssues
} from '../tool-schema'

it('enforces negative constraints together with ordinary sibling constraints', () => {
  const schema = {
    type: 'object',
    properties: { draft: {}, repair: {}, plan: { type: 'object' } },
    additionalProperties: false,
    not: { required: ['draft', 'repair'] }
  }
  expect(operationInputIssue({ draft: {}, repair: {} }, schema)).toBeDefined()
  expect(operationInputIssue({ draft: {} }, schema)).toBeUndefined()
  expect(operationInputIssue({ repair: {} }, schema)).toBeUndefined()
  expect(operationInputIssue({ draft: {}, extra: true }, schema)).toBeDefined()
  expect(operationInputIssue({}, { not: true })).toBeDefined()
  expect(operationInputIssue({}, { not: false })).toBeUndefined()
})

it('validates dynamic property names through the same local reference root', () => {
  const schema = {
    type: 'object',
    propertyNames: { $ref: '#/$defs/key' },
    additionalProperties: { type: 'number', minimum: 0 },
    $defs: { key: { type: 'string', minLength: 1, maxLength: 3 } }
  }
  expect(operationInputIssue({ '': 1 }, schema)).toBeDefined()
  expect(operationInputIssue({ long: 1 }, schema)).toBeDefined()
  expect(operationInputIssue({ key: -1 }, schema)).toBeDefined()
  expect(operationInputIssue({ key: 0 }, schema)).toBeUndefined()
  expect(
    operationInputIssue({}, { type: 'object', propertyNames: false })
  ).toBeUndefined()
  expect(
    operationInputIssue({ key: 0 }, { propertyNames: false })
  ).toBeDefined()
})

it('reports escaped missing-field pointers from the selected branch and preserves reference siblings', () => {
  const schema = {
    type: 'object',
    properties: { items: { type: 'array', items: { $ref: '#/$defs/item' } } },
    $defs: {
      item: {
        type: 'object',
        anyOf: [
          { properties: { kind: { const: 'first' } }, required: ['a/b~c'] },
          { properties: { kind: { const: 'second' } }, required: ['other'] }
        ]
      }
    }
  }
  const issues = operationInputIssues({ items: [{ kind: 'first' }] }, schema)
  if (!issues) {
    throw new Error('Expected required-field issues')
  }
  expect(
    issues
      .filter((issue) => issue.keyword === 'required')
      .map((issue) => issue.instancePath)
  ).toEqual(['/items/0/a~1b~0c'])
  const outputIssues = operationInputIssues(
    { items: [{ kind: 'first' }] },
    schema,
    schema,
    'output'
  )
  if (!outputIssues) {
    throw new Error('Expected output issues')
  }
  expect(formatOperationInputIssues(outputIssues)).toContain('output.items[0]')
  expect(
    operationInputIssues({ items: [{ kind: 'first', 'a/b~c': 1 }] }, schema)
  ).toBeUndefined()
  const bounded = {
    $defs: { number: { type: 'number' } },
    $ref: '#/$defs/number',
    minimum: 3
  }
  expect(operationInputIssue(2, bounded)).toBeDefined()
  expect(operationInputIssue(3, bounded)).toBeUndefined()
})

it('retains ambiguous union failures and bounds repeated diagnostics without claiming valid input', () => {
  expect(
    operationInputIssue(1, { oneOf: [{ type: 'number' }, { type: 'integer' }] })
  ).toBeDefined()
  const issues = operationInputIssues(
    Array.from({ length: 50 }, () => ({})),
    { type: 'array', items: { type: 'object', required: ['value'] } }
  )
  if (!issues) {
    throw new Error('Expected bounded issues')
  }
  expect(issues.some((issue) => issue.keyword === 'diagnosticLimit')).toBe(true)
  expect(issues.length).toBeLessThan(50)
  expect(formatOperationInputIssues(issues).length).toBeLessThanOrEqual(3000)
})

it.each(['constructor', '__proto__', 'toString'])(
  'validates own dictionary key %s against additionalProperties rather than the object prototype',
  (key) => {
    const schema = {
      type: 'object',
      additionalProperties: {
        type: 'array',
        minItems: 1,
        items: { type: 'number' }
      }
    }
    const invalid = Object.fromEntries([[key, []]])
    const issues = operationInputIssues(invalid, schema)
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ instancePath: '/' + key })
      ])
    )
    expect(
      operationInputIssue(Object.fromEntries([[key, [1]]]), schema)
    ).toBeUndefined()
    expect(
      operationInputIssue(invalid, {
        type: 'object',
        additionalProperties: false
      })
    ).toBeDefined()
    const explicit = {
      type: 'object',
      properties: Object.fromEntries([[key, { type: 'string' }]]),
      additionalProperties: false
    }
    expect(
      operationInputIssue(Object.fromEntries([[key, 'valid']]), explicit)
    ).toBeUndefined()
    expect(
      operationInputIssue(Object.fromEntries([[key, 1]]), explicit)
    ).toBeDefined()
  }
)

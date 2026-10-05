import { expect, it } from 'vitest'
import {
  nativeToolInputSchema,
  operationInputIssue
} from '../operation-input-schema'

it('does not bypass overlapping oneOf branches when one branch has a matching discriminator', () => {
  expect(
    operationInputIssue(
      { type: 'rect' },
      {
        oneOf: [
          { type: 'object', properties: { type: { const: 'rect' } } },
          { type: 'object' }
        ]
      }
    )
  ).toContain('oneOf mismatch')
})
it('accepts a general anyOf branch even if a matching discriminator branch fails', () => {
  expect(
    operationInputIssue(
      { type: 'rect' },
      {
        anyOf: [
          { properties: { type: { const: 'rect' } }, required: ['width'] },
          { type: 'object' }
        ]
      }
    )
  ).toBeUndefined()
})
it('collects independent nested errors and identifies their fields', () => {
  const issue = operationInputIssue(
    { rows: [{ x: -1 }, { x: 'bad' }] },
    {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              x: { type: 'number', minimum: 0 }
            }
          }
        }
      }
    }
  )
  for (const path of ['rows[0].name', 'rows[0].x', 'rows[1].name', 'rows[1].x'])
    expect(issue).toContain(path)
})

it('does not prune overlapping enum and const branches of oneOf', () => {
  expect(
    operationInputIssue(
      { type: 'rect' },
      {
        oneOf: [
          { properties: { type: { enum: ['rect', 'oval'] } } },
          { properties: { type: { const: 'rect' } } }
        ]
      }
    )
  ).toContain('oneOf mismatch')
})
it('keeps a general branch when another branch constrains a type enum', () => {
  expect(
    operationInputIssue(
      { type: 'rect' },
      {
        anyOf: [
          {
            properties: { type: { enum: ['rect', 'oval'] } },
            required: ['width']
          },
          { type: 'object' }
        ]
      }
    )
  ).toBeUndefined()
})

it('reports only the selected phase branch without weakening overlapping unions', () => {
  const issue = operationInputIssue(
    { phase: 'visual', checks: 'invalid' },
    {
      oneOf: [
        {
          properties: { phase: { const: 'facts' }, facts: { type: 'array' } },
          required: ['facts']
        },
        {
          properties: {
            phase: { enum: ['visual', 'structure'] },
            checks: { type: 'array' }
          },
          required: ['checks']
        }
      ]
    }
  )
  expect(issue).toContain('arguments.checks: expected array')
  expect(issue).not.toContain('facts')
  expect(issue).not.toContain('unexpected constant')
})

it('reports each shared phase field error once and still checks outer constraints', () => {
  const properties = { phase: { const: 'facts' }, scope: { type: 'string' } }
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['phase'],
    properties,
    oneOf: [{ type: 'object', properties, required: ['phase', 'scope'] }]
  }
  const issue = operationInputIssue(
    { phase: 'facts', scope: 1, extra: true },
    schema
  )
  expect(issue?.match(/arguments.scope: expected string/g)).toHaveLength(1)
  expect(issue).toContain('arguments.extra: unknown field')
  expect(issue).not.toContain('arguments.extra: disallowed value')
  expect(
    operationInputIssue({ phase: 'facts', scope: 'tower' }, schema)
  ).toBeUndefined()
})

it('keeps unknown-field diagnostics bounded without repeating disallowed-value errors', () => {
  const issue = operationInputIssue(
    Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`field${i}`, i])),
    { type: 'object', additionalProperties: false }
  )
  expect(issue).toContain('retry for remaining diagnostics')
  expect(issue).not.toContain('field19:')
  expect(issue).not.toContain('disallowed value')
})

it.each(['segment-control', null])(
  'accepts declared nullable vector control IDs: %j',
  (value) => {
    expect(
      operationInputIssue(value, { type: ['string', 'null'] })
    ).toBeUndefined()
  }
)
it.each([3, {}, [], true])(
  'rejects invalid nullable vector control IDs at admission: %j',
  (value) => {
    expect(operationInputIssue(value, { type: ['string', 'null'] })).toContain(
      'expected string or null'
    )
  }
)
it('enforces unique IDs before shared target operations reach their owner', () => {
  const schema = { type: 'array', uniqueItems: true, items: { type: 'string' } }
  expect(operationInputIssue(['a', 'b'], schema)).toBeUndefined()
  expect(operationInputIssue(['a', 'a'], schema)).toContain('duplicate item')
  expect(
    operationInputIssue(['a', 'a'], { ...schema, uniqueItems: false })
  ).toBeUndefined()
})
it('compares unique structured items independently of object key order', () => {
  const schema = { type: 'array', uniqueItems: true }
  expect(
    operationInputIssue(
      [
        { a: 1, b: 2 },
        { b: 2, a: 1 }
      ],
      schema
    )
  ).toContain('duplicate item')
  expect(operationInputIssue([{ a: 1 }, { a: 2 }], schema)).toBeUndefined()
})

it('materializes common union fields for native declarations without weakening admission', () => {
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'type'],
    properties: {
      name: { type: 'string' },
      type: { enum: ['group', 'frame'] },
      width: { type: 'number', minimum: 0 }
    },
    anyOf: [
      { properties: { type: { const: 'group' }, width: false } },
      { properties: { type: { const: 'frame' } }, required: ['width'] }
    ]
  }
  const native = nativeToolInputSchema(schema) as {
    anyOf: { properties: Record<string, unknown>; required: string[] }[]
  }
  expect(native.anyOf[0].properties.name).toEqual({ type: 'string' })
  expect(native.anyOf[0].properties).not.toHaveProperty('width')
  expect(native.anyOf[1].required).toEqual(['name', 'type', 'width'])
  for (const input of [
    { name: 'g', type: 'group' },
    { name: 'f', type: 'frame', width: 10 },
    { type: 'group' },
    { name: 'g', type: 'group', width: 10 },
    { name: 'f', type: 'frame' },
    { name: 'f', type: 'frame', width: -1 },
    { name: 'g', type: 'group', extra: true }
  ])
    expect(!operationInputIssue(input, native), JSON.stringify(input)).toBe(
      !operationInputIssue(input, schema)
    )
  expect(schema.properties).toHaveProperty('width')
})
it('retains nullable control IDs, definitions and nested array union fields in native schemas', () => {
  const schema = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            control: { type: ['string', 'null'] },
            kind: { type: 'string' }
          },
          oneOf: [{ required: ['control'] }, { required: ['kind'] }]
        }
      }
    },
    $defs: { node: { type: 'string' } }
  }
  const native = nativeToolInputSchema(schema) as {
    $defs: unknown
    properties: {
      items: {
        items: { oneOf: { properties: { control: { type: string[] } } }[] }
      }
    }
  }
  expect(native.$defs).toEqual(schema.$defs)
  expect(
    native.properties.items.items.oneOf[0].properties.control.type
  ).toEqual(['string', 'null'])
})

it('does not admit extra union fields by merging two independently closed objects', () => {
  for (const schema of [
    {
      type: 'object',
      additionalProperties: false,
      properties: { a: { type: 'string' } },
      anyOf: [{ properties: { b: { type: 'string' } } }]
    },
    {
      type: 'object',
      properties: { a: { type: 'string' } },
      anyOf: [
        { additionalProperties: false, properties: { b: { type: 'string' } } }
      ]
    }
  ]) {
    for (const value of [{}, { a: 'a' }, { b: 'b' }, { a: 'a', b: 'b' }]) {
      expect(
        !operationInputIssue(value, nativeToolInputSchema(schema)),
        JSON.stringify({ schema, value })
      ).toBe(!operationInputIssue(value, schema))
    }
  }
})

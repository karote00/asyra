import { expect, it } from 'vitest'
import { admitAiRecipe } from '../recipe-admission.js'
import { createAiToolContract } from '../tool-contract.js'

const object = (properties: Record<string, unknown>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false
})

const point = object({ x: { type: 'number' }, y: { type: 'number' } })
const bounded = object({
  x: { type: 'number', minimum: -100000, maximum: 100000 },
  y: { type: 'number', minimum: -100000, maximum: 100000 }
})

const admit = (
  source: object,
  target: object,
  fields: boolean,
  mode: 'sequence' | 'registered' = 'sequence'
) => {
  const tools = [
    createAiToolContract({
      name: 'source',
      description: 'Produce coordinates',
      revision: 1,
      inputSchema: object({}),
      outputSchema: source,
      effect: 'read',
      resources: [],
      composition: 'allowed',
      lifecycle: {
        cancellation: 'cooperative',
        retry: 'never',
        output: 'value'
      }
    }),
    createAiToolContract({
      name: 'destination',
      description: 'Consume bounded coordinates',
      revision: 1,
      inputSchema: target,
      outputSchema: target,
      effect: 'read',
      resources: [],
      composition: 'allowed',
      lifecycle: {
        cancellation: 'cooperative',
        retry: 'never',
        output: 'value'
      }
    })
  ]

  return admitAiRecipe(
    {
      format: 1,
      name: 'coordinate',
      revision: 1,
      description: 'Forward coordinates',
      inputSchema: object({}),
      outputSchema: { type: 'null' },
      steps: [
        {
          id: 'source',
          tool: 'source',
          revision: 1,
          input: { kind: 'literal', value: {} }
        },
        {
          id: 'destination',
          tool: 'destination',
          revision: 1,
          input: fields
            ? {
                kind: 'object',
                fields: {
                  x: { kind: 'step', step: 'source', path: '/x' },
                  y: { kind: 'step', step: 'source', path: '/y' }
                }
              }
            : { kind: 'step', step: 'source', path: '' }
        }
      ],
      output: { kind: 'literal', value: null }
    },
    {
      resolve: (name) => tools.find((tool) => tool.name === name),

      validate: () => undefined,

      limits: {
        steps: 8,
        bindings: 32,
        bindingDepth: 8,
        bytes: 12000,
        issues: 8
      }
    },
    mode
  )
}

it.each([false, true])(
  'admits equivalent point bindings without changing durable guarantees (fields %s)',
  (fields) => {
    const result = admit(point, bounded, fields)

    expect(result.ok, JSON.stringify(result.ok ? {} : result.issues)).toBe(true)
    expect(admit(point, bounded, fields, 'registered').ok).toBe(false)
  }
)

it.each([
  [object({ point }), object({ point: bounded })],
  [
    { type: 'array', items: point },
    { type: 'array', items: bounded }
  ],
  [
    {
      type: 'array',
      prefixItems: [point],
      items: false,
      minItems: 1,
      maxItems: 1
    },
    {
      type: 'array',
      prefixItems: [bounded],
      items: false,
      minItems: 1,
      maxItems: 1
    }
  ],
  [
    { type: 'object', additionalProperties: point },
    { type: 'object', additionalProperties: bounded }
  ],
  [{ anyOf: [point, { type: 'null' }] }, { anyOf: [bounded, { type: 'null' }] }]
])(
  'refines nested numeric values without discarding their structure: %j',
  (source, target) => {
    const result = admit(source, target, false)

    expect(result.ok, JSON.stringify(result.ok ? {} : result.issues)).toBe(true)
    expect(admit(source, target, false, 'registered').ok).toBe(false)
  }
)

it.each([
  object({ x: { type: 'string' }, y: { type: 'number' } }),
  object({
    x: { type: 'number', 'x-runtime-value': 'request' },
    y: { type: 'number' }
  }),
  object({ x: { type: 'number' } }),
  object({
    x: { type: 'number' },
    y: { type: 'number' },
    extra: { type: 'number' }
  }),
  object({ x: { type: 'number', minimum: 200000 }, y: { type: 'number' } })
])('rejects structurally incompatible or disjoint points: %j', (source) => {
  expect(admit(source, bounded, false).ok).toBe(false)
})

import { describe, expect, it, vi } from 'vitest'
import type { AiRecipeBinding } from '../recipe-types.js'
import { admitAiRecipe } from '../recipe-admission.js'
import { createAiToolContract } from '../tool-contract.js'

const object = (properties: Record<string, unknown>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false
})
const number = { type: 'number' }
const reference = { type: 'string', 'x-runtime-value': 'document' }
const find = createAiToolContract({
  name: 'find',
  description: 'Find a current target.',
  revision: 2,
  inputSchema: object({ query: { type: 'string' } }),
  outputSchema: object({ target: reference, count: { type: 'integer' } }),
  effect: 'read',
  resources: ['document'],
  composition: 'allowed',
  lifecycle: {
    cancellation: 'cooperative',
    retry: 'read-only',
    output: 'value'
  }
})
const edit = createAiToolContract({
  name: 'edit',
  description: 'Set a target value.',
  revision: 3,
  inputSchema: object({ target: reference, value: number }),
  outputSchema: number,
  effect: 'mutation',
  resources: ['document'],
  composition: 'allowed',
  lifecycle: { cancellation: 'cooperative', retry: 'never', output: 'value' }
})
const proposal = (): {
  format: number
  name: string
  description: string
  revision: number
  inputSchema: ReturnType<typeof object>
  outputSchema: typeof number
  steps: {
    id: string
    tool: string
    revision: number
    input: { kind: string; fields: Record<string, AiRecipeBinding> }
  }[]
  output: AiRecipeBinding
} => ({
  format: 1,
  name: 'find-and-edit',
  description: 'Find a current target and edit it.',
  revision: 1,
  inputSchema: object({ query: { type: 'string' }, value: number }),
  outputSchema: number,
  steps: [
    {
      id: 'locate',
      tool: 'find',
      revision: 2,
      input: {
        kind: 'object',
        fields: {
          query: { kind: 'input', path: '/query' }
        }
      }
    },
    {
      id: 'change',
      tool: 'edit',
      revision: 3,
      input: {
        kind: 'object',
        fields: {
          target: { kind: 'step', step: 'locate', path: '/target' },
          value: { kind: 'input', path: '/value' }
        }
      }
    }
  ],
  output: { kind: 'step', step: 'change', path: '' }
})
const options = (overrides = {}) => ({
  resolve: (name: string) => {
    if (name === 'find') return find
    if (name === 'edit') return edit
    return undefined
  },
  validate: vi.fn((): string | undefined => undefined),
  limits: {
    steps: 8,
    bindingDepth: 12,
    bindings: 100,
    bytes: 16000,
    issues: 8
  },
  ...overrides
})
const rejected = (input: unknown, overrides = {}) => {
  const result = admitAiRecipe(input, options(overrides))
  expect(result.ok).toBe(false)
  if (result.ok) throw new Error('Expected admission issues')
  return result
}

describe('typed recipe admission', () => {
  it('admits a finite typed chain and derives immutable effects without execution', () => {
    const input = proposal()
    const result = admitAiRecipe(input, options())
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(JSON.stringify(result))
    expect(result.value.contract).toMatchObject({
      effect: 'mutation',
      resources: ['document'],
      lifecycle: { retry: 'never' }
    })
    expect(
      result.value.dependencies.map((item) => [item.name, item.revision])
    ).toEqual([
      ['find', 2],
      ['edit', 3]
    ])
    input.steps[0].tool = 'changed'
    expect(result.value.recipe.steps[0].tool).toBe('find')
    expect(Object.isFrozen(result.value.recipe.steps[0].input)).toBe(true)
  })

  it('reports the exact bad output binding without guessing a replacement', () => {
    const input = proposal()
    input.steps[1].input.fields.target = {
      kind: 'step',
      step: 'locate',
      path: '/count'
    }
    expect(rejected(input).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          step: 'change',
          path: '/steps/1/input/fields/target',
          code: 'binding',
          recovery: expect.any(String)
        })
      ])
    )
  })

  it('rejects optional paths and unknown schemas instead of inspecting a live result', () => {
    const optional = createAiToolContract({
      ...find,
      outputSchema: { ...object({ target: reference }), required: [] }
    })
    expect(
      rejected(proposal(), {
        resolve: (name: string) => (name === 'find' ? optional : edit)
      }).issues[0].code
    ).toBe('binding')
    const opaque = createAiToolContract({ ...find, outputSchema: true })
    expect(
      rejected(proposal(), {
        resolve: (name: string) => (name === 'find' ? opaque : edit)
      }).issues[0].code
    ).toBe('schema')
  })

  it('rejects captured document references but accepts fresh typed input', () => {
    const input = proposal()
    input.steps[1].input.fields.target = {
      kind: 'literal',
      value: 'current-id'
    }
    expect(
      rejected(input).issues.some((item) => item.code === 'captured-value')
    ).toBe(true)
    input.inputSchema = object({
      query: { type: 'string' },
      value: number,
      target: reference
    })
    input.steps[1].input.fields.target = { kind: 'input', path: '/target' }
    expect(admitAiRecipe(input, options()).ok).toBe(true)
  })

  it('rejects future outputs, duplicate identities and unknown dependency revisions', () => {
    const input = proposal()
    input.steps[0].input.fields.query = {
      kind: 'step',
      step: 'change',
      path: ''
    }
    input.steps[1].id = 'locate'
    input.steps[1].revision = 99
    expect(rejected(input).issues.map((item) => item.code)).toEqual(
      expect.arrayContaining(['binding', 'step', 'dependency'])
    )
  })

  it('requires canonical opt-in and rejects self reference and control-plane dependencies', () => {
    const denied = createAiToolContract({
      ...find,
      composition: 'control-plane'
    })
    expect(
      rejected(proposal(), {
        resolve: (name: string) => (name === 'find' ? denied : edit)
      }).issues[0].code
    ).toBe('dependency')
    const input = proposal()
    input.steps[0].tool = input.name
    expect(
      rejected(input).issues.some((item) => item.code === 'dependency')
    ).toBe(true)
  })

  it('rejects unsupported keywords and never weakens the host validator', () => {
    const input = proposal()
    input.inputSchema.properties.query = { type: 'string', pattern: '^x' }
    expect(rejected(input).issues[0].code).toBe('schema')
    input.inputSchema.properties.query = { type: 'string' }
    input.steps[0].input.fields.query = { kind: 'literal', value: 4 }
    const validate = vi.fn(() => 'Expected string')
    expect(rejected(input, { validate }).issues[0].code).toBe('binding')
    expect(validate).toHaveBeenCalledOnce()
  })

  it('returns bounded independent issues with an explicit omitted count', () => {
    const input = proposal()
    input.steps[0].tool = 'missing-a'
    input.steps[1].tool = 'missing-b'
    const result = rejected(input, {
      limits: { ...options().limits, issues: 1 }
    })
    expect(result.issues).toHaveLength(1)
    expect(result.omittedIssues).toBeGreaterThan(0)
  })

  it.each([
    null,
    {},
    { ...proposal(), steps: [] },
    { ...proposal(), format: 2 },
    { ...proposal(), extra: 'unrecognized' }
  ])('rejects malformed proposals without registration: %j', (input) => {
    expect(rejected(input).issues.length).toBeGreaterThan(0)
  })

  it('enforces finite byte, step and binding limits before registration', () => {
    expect(
      rejected(proposal(), { limits: { ...options().limits, bytes: 5 } })
        .issues[0].code
    ).toBe('limit')
    expect(
      rejected(proposal(), { limits: { ...options().limits, steps: 1 } })
        .issues[0].code
    ).toBe('limit')
    expect(
      rejected(proposal(), {
        limits: { ...options().limits, bindings: 1 }
      }).issues.some((item) => item.code === 'limit')
    ).toBe(true)
  })

  it('rejects non-JSON and executable values without running them', () => {
    const run = vi.fn()
    expect(rejected({ ...proposal(), output: run }).issues[0].code).toBe(
      'format'
    )
    expect(run).not.toHaveBeenCalled()
  })
})

describe('binding boundary preservation', () => {
  const bindInput = (source: unknown, target: unknown, path = '') => {
    const tool = createAiToolContract({
      ...edit,
      inputSchema: target,
      outputSchema: target
    })
    return admitAiRecipe(
      {
        ...proposal(),
        inputSchema: source,
        outputSchema: target,
        steps: [
          {
            id: 'write',
            tool: 'edit',
            revision: 3,
            input: { kind: 'input', path }
          }
        ],
        output: { kind: 'step', step: 'write', path: '' }
      },
      options({ resolve: () => tool })
    )
  }

  it.each([
    [
      { type: 'integer', minimum: 2, maximum: 4 },
      { type: 'number', minimum: 1, maximum: 5 },
      true
    ],
    [{ type: 'number' }, { type: 'integer' }, false],
    [{ type: 'number' }, { type: 'number', minimum: 0 }, false],
    [{ type: 'string', maxLength: 4 }, { type: 'string', maxLength: 3 }, false],
    [
      { type: 'string', enum: ['a'] },
      { type: 'string', enum: ['a', 'b'] },
      true
    ],
    [{ type: 'string' }, { type: 'string', enum: ['a'] }, false],
    [object({ a: number, b: number }), object({ a: number }), false],
    [
      { type: 'array', items: number, minItems: 1 },
      { type: 'array', items: number, minItems: 2 },
      false
    ],
    [
      { type: 'array', items: { type: 'integer' }, maxItems: 3 },
      { type: 'array', items: number, maxItems: 4 },
      true
    ]
  ])(
    'preserves structural implication for %j to %j',
    (source, target, expected) => {
      expect(bindInput(source, target).ok).toBe(expected)
    }
  )

  it('requires guaranteed array positions and decodes exact escaped property names', () => {
    expect(
      bindInput({ type: 'array', items: number, minItems: 1 }, number, '/0').ok
    ).toBe(true)
    expect(
      bindInput({ type: 'array', items: number, minItems: 1 }, number, '/1').ok
    ).toBe(false)
    expect(bindInput(object({ 'a/b~c': number }), number, '/a~1b~0c').ok).toBe(
      true
    )
    expect(bindInput(object({ a: number }), number, '/constructor').ok).toBe(
      false
    )
  })

  it('does not erase an ancestor reference classification by selecting its child', () => {
    const source = {
      ...object({ value: { type: 'string' } }),
      'x-runtime-value': 'secret'
    }
    expect(bindInput(source, { type: 'string' }, '/value').ok).toBe(false)
    expect(
      bindInput(
        source,
        { type: 'string', 'x-runtime-value': 'secret' },
        '/value'
      ).ok
    ).toBe(true)
  })

  it('checks nested literals for captured values and rejects defaults', () => {
    const input = proposal()
    input.steps[1].input = {
      kind: 'object',
      fields: {
        target: { kind: 'literal', value: 'do-not-save' },
        value: { kind: 'literal', value: 2 }
      }
    }
    expect(
      rejected(input).issues.some((issue) => issue.code === 'captured-value')
    ).toBe(true)
    input.inputSchema.properties.query = { type: 'string', default: 'captured' }
    expect(rejected(input).issues[0].code).toBe('schema')
  })

  it('reports throwing validators and resolvers as repairable failures', () => {
    const input = proposal()
    input.steps[0].input.fields.query = { kind: 'literal', value: 'window' }
    expect(
      rejected(input, {
        validate: () => {
          throw new Error('validator unavailable')
        }
      }).issues[0].actual
    ).toContain('validator unavailable')
    expect(
      rejected(input, {
        resolve: () => {
          throw new Error('registry unavailable')
        }
      }).issues[0].code
    ).toBe('dependency')
  })

  it('rejects invalid host limits instead of disabling a guard', () => {
    expect(() => admitAiRecipe(proposal(), options({ limits: {} }))).toThrow(
      'limits'
    )
    expect(() =>
      admitAiRecipe(
        proposal(),
        options({ limits: { ...options().limits, bytes: NaN } })
      )
    ).toThrow('limits')
  })
})

it('publishes the exact submission fields and binding variants used by admission', async () => {
  const { aiRecipeInputSchema, recipeFormatKeys } =
    await import('../recipe-format.js')
  const schema = aiRecipeInputSchema as unknown as {
    required: string[]
    properties: Record<string, unknown>
    $defs: {
      binding: {
        oneOf: { properties: { kind: { const: string } }; required: string[] }[]
      }
    }
  }
  expect(schema.required).toEqual(recipeFormatKeys.proposal)
  expect(Object.keys(schema.properties)).toEqual(recipeFormatKeys.proposal)
  for (const variant of schema.$defs.binding.oneOf) {
    expect(variant.required).toEqual(
      recipeFormatKeys.bindings[variant.properties.kind.const]
    )
  }
  expect(
    schema.$defs.binding.oneOf.map((item) => item.properties.kind.const)
  ).toEqual(['literal', 'input', 'step', 'object', 'array'])
  expect(Object.isFrozen(aiRecipeInputSchema)).toBe(true)
  expect(JSON.stringify(aiRecipeInputSchema)).toContain('#/$defs/binding')
})

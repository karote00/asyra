import { describe, expect, it, vi } from 'vitest'
import type { AiRecipeBinding } from '../recipe-types.js'
import { detachAiJsonValue } from '../json-value.js'
import { admitAiRecipe } from '../recipe-admission.js'
import { createAiToolContract } from '../tool-contract.js'
import { readRegisteredRecipeSchema, recipeSchemaAt } from '../recipe-schema.js'

const admitStructured = (
  schema: unknown,
  source: unknown,
  binding: unknown
) => {
  const dependency = createAiToolContract({
    ...edit,
    name: 'structured',
    inputSchema: schema
  })
  return admitAiRecipe(
    {
      format: 1,
      name: 'structured-input',
      revision: 1,
      description: 'Use a registered structured contract.',
      inputSchema: source,
      outputSchema: number,
      steps: [
        {
          id: 'write',
          tool: dependency.name,
          revision: dependency.revision,
          input: binding
        }
      ],
      output: { kind: 'step', step: 'write', path: '' }
    },
    options({ resolve: () => dependency })
  )
}

describe('registered structured contract constraints', () => {
  it.each(['anyOf', 'oneOf'])(
    'excludes only provably disjoint opaque siblings in %s without admitting their unsupported bindings',
    (mode) => {
      const flat = object({
        kind: { type: 'string', enum: ['flat'] },
        value: number
      })
      const opaque = {
        ...object({ kind: { const: 'curved' }, value: number }),
        allOf: [{ properties: { value: { minimum: 0 } } }]
      }
      const binding = {
        kind: 'object',
        fields: {
          kind: { kind: 'input', path: '/kind' },
          value: { kind: 'input', path: '/value' }
        }
      }
      const schema = { [mode]: [flat, opaque] }
      expect(admitStructured(schema, flat, binding)).toMatchObject({ ok: true })
      for (const source of [
        object({ kind: { type: 'string', enum: ['curved'] }, value: number }),
        object({
          kind: { type: 'string', enum: ['flat', 'curved'] },
          value: number
        }),
        { ...flat, required: ['value'] }
      ]) {
        expect(admitStructured(schema, source, binding).ok).toBe(false)
      }
      for (const sibling of [
        { ...opaque, properties: { kind: { const: 'flat' }, value: number } },
        { allOf: [opaque] },
        { ...opaque, properties: { value: number }, required: ['value'] }
      ]) {
        expect(
          admitStructured({ [mode]: [flat, sibling] }, flat, binding).ok
        ).toBe(false)
      }
    }
  )

  it('resolves a recursive definition once across repeated guaranteed paths', () => {
    let definitionReads = 0
    const node = object({ value: number, next: { $ref: '#/$defs/node' } })
    const schema = readRegisteredRecipeSchema({
      ...object({
        first: { $ref: '#/$defs/node' },
        second: { $ref: '#/$defs/node' }
      }),
      $defs: {
        get node() {
          definitionReads += 1
          return node
        }
      }
    })
    for (let index = 0; index < 100; index += 1) {
      expect(recipeSchemaAt(schema, '/first/next/next/value').type).toBe(
        'number'
      )
      expect(recipeSchemaAt(schema, '/second/next/value').type).toBe('number')
    }
    expect(definitionReads).toBe(1)
  })
  it('preserves common and branch constraints instead of replacing overlapping fields', () => {
    const schema = {
      ...object({ mode: { type: 'string', enum: ['a', 'b'] }, value: number }),
      anyOf: [
        { properties: { mode: { const: 'a' } } },
        { properties: { mode: { const: 'b' }, value: false } }
      ]
    }
    const binding = {
      kind: 'object',
      fields: {
        mode: { kind: 'input', path: '/mode' },
        value: { kind: 'input', path: '/value' }
      }
    }
    expect(
      admitStructured(
        schema,
        object({ mode: { type: 'string', enum: ['a'] }, value: number }),
        binding
      ).ok
    ).toBe(true)
    expect(
      admitStructured(
        schema,
        object({ mode: { type: 'string', enum: ['b'] }, value: number }),
        binding
      ).ok
    ).toBe(false)
    expect(
      admitStructured(
        schema,
        object({ mode: { type: 'string', enum: ['c'] }, value: number }),
        binding
      ).ok
    ).toBe(false)
  })

  it('does not widen either closed property set when intersecting a union branch', () => {
    for (const schema of [
      {
        ...object({ value: number }),
        anyOf: [object({ value: number, extra: number })]
      },
      {
        ...object({ value: number }),
        anyOf: [{ type: 'object', additionalProperties: false }]
      },
      {
        type: 'object',
        additionalProperties: false,
        anyOf: [object({ value: number })]
      }
    ]) {
      expect(
        admitStructured(schema, object({ value: number, extra: number }), {
          kind: 'object',
          fields: {
            value: { kind: 'input', path: '/value' },
            extra: { kind: 'input', path: '/extra' }
          }
        }).ok
      ).toBe(false)
    }
  })

  it('proves strict numeric bounds and string patterns without relaxing them', () => {
    const input = { kind: 'input', path: '' }
    expect(
      admitStructured(
        { type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 10 },
        { type: 'number', minimum: 1, maximum: 9 },
        input
      ).ok
    ).toBe(true)
    expect(
      admitStructured(
        { type: 'number', exclusiveMinimum: 0 },
        { type: 'number', minimum: 0 },
        input
      ).ok
    ).toBe(false)
    expect(
      admitStructured(
        { type: 'number', exclusiveMaximum: 10 },
        { type: 'number', maximum: 10 },
        input
      ).ok
    ).toBe(false)
    expect(
      admitStructured(
        { type: 'string', pattern: '^#[a-f0-9]{6}$' },
        { type: 'string', enum: ['#abcdef'] },
        input
      ).ok
    ).toBe(true)
    expect(
      admitStructured(
        { type: 'string', pattern: '^#[a-f0-9]{6}$' },
        { type: 'string', enum: ['#abcdef', 'bad'] },
        input
      ).ok
    ).toBe(false)
  })

  it('resolves only declared local references and rejects recursive uncertainty and captured values', () => {
    const schema = {
      ...object({ child: { $ref: '#/$defs/node' } }),
      $defs: { node: object({ value: reference }) }
    }
    expect(
      admitStructured(schema, reference, {
        kind: 'object',
        fields: {
          child: {
            kind: 'object',
            fields: { value: { kind: 'input', path: '' } }
          }
        }
      }).ok
    ).toBe(true)
    expect(
      admitStructured(schema, reference, {
        kind: 'literal',
        value: { child: { value: 'captured-id' } }
      }).ok
    ).toBe(false)
    for (const target of [
      { $ref: '#/$defs/missing' },
      { $ref: '#/$defs/loop', $defs: { loop: { $ref: '#/$defs/loop' } } },
      { $ref: 'https://example.invalid/schema' }
    ]) {
      expect(
        admitStructured(target, number, { kind: 'input', path: '' }).ok
      ).toBe(false)
    }
  })
})

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
    if (name === 'find') {
      return find
    }
    if (name === 'edit') {
      return edit
    }
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
  if (result.ok) {
    throw new Error('Expected admission issues')
  }
  return result
}

describe('typed recipe admission', () => {
  it('admits a finite typed chain and derives immutable effects without execution', () => {
    const input = proposal()
    const result = admitAiRecipe(input, options())
    expect(result.ok).toBe(true)
    if (!result.ok) {
      throw new Error(JSON.stringify(result))
    }
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
  expect(Object.keys(schema.properties)).toEqual([
    ...recipeFormatKeys.proposal,
    'iteration'
  ])
  for (const variant of schema.$defs.binding.oneOf) {
    expect(variant.required).toEqual(
      recipeFormatKeys.bindings[variant.properties.kind.const]
    )
  }
  expect(
    schema.$defs.binding.oneOf.map((item) => item.properties.kind.const)
  ).toEqual(['literal', 'input', 'state', 'step', 'object', 'array'])
  expect(Object.isFrozen(aiRecipeInputSchema)).toBe(true)
  expect(JSON.stringify(aiRecipeInputSchema)).toContain('#/$defs/binding')
})

describe('registered dependency schema projection', () => {
  const chain = (
    outputSchema: unknown,
    inputSchema: unknown = edit.inputSchema
  ) =>
    options({
      resolve: (name: string) =>
        createAiToolContract(
          name === 'find' ? { ...find, outputSchema } : { ...edit, inputSchema }
        )
    })

  it('projects required fields without traversing opaque unused siblings', () => {
    const schema = {
      ...object({
        target: reference,
        ignored: { allOf: [{ type: 'string' }, { pattern: '^x' }] }
      }),
      additionalProperties: true
    }
    expect(admitAiRecipe(proposal(), chain(schema)).ok).toBe(true)
    expect(
      admitAiRecipe(proposal(), chain({ ...schema, required: ['ignored'] })).ok
    ).toBe(false)
    expect(
      admitAiRecipe(
        proposal(),
        chain({
          ...schema,
          properties: {
            ...schema.properties,
            target: { type: 'string', pattern: '^x' }
          }
        })
      ).ok
    ).toBe(false)
  })

  it('requires a source field in every successful union variant', () => {
    const schema = {
      anyOf: [
        {
          ...object({ target: reference, ignored: true }),
          additionalProperties: true
        },
        object({ target: reference })
      ]
    }
    expect(admitAiRecipe(proposal(), chain(schema)).ok).toBe(true)
    expect(
      admitAiRecipe(
        proposal(),
        chain({
          anyOf: [...schema.anyOf, object({ released: { type: 'boolean' } })]
        })
      ).ok
    ).toBe(false)
    expect(
      admitAiRecipe(
        proposal(),
        chain({
          anyOf: [...schema.anyOf, object({ target: { type: 'number' } })]
        })
      ).ok
    ).toBe(false)
  })

  it('selects a disjoint destination using a literal discriminator and preserves required fields', () => {
    const input = proposal()
    input.steps[1].input.fields.mode = { kind: 'literal', value: 'edit' }
    const schema = {
      oneOf: [
        object({ mode: { const: 'edit' }, target: reference, value: number }),
        object({ mode: { enum: ['release'] }, target: reference })
      ]
    }
    expect(admitAiRecipe(input, chain(find.outputSchema, schema)).ok).toBe(true)
    delete input.steps[1].input.fields.value
    expect(admitAiRecipe(input, chain(find.outputSchema, schema)).ok).toBe(
      false
    )
  })

  it('selects bound discriminators without erasing uncertainty or captured values', () => {
    const input = proposal()
    input.inputSchema.properties.mode = { type: 'string', enum: ['edit'] }
    input.steps[1].input.fields.mode = { kind: 'input', path: '/mode' }
    input.inputSchema.required.push('mode')
    const schema = {
      oneOf: [
        object({ mode: { const: 'edit' }, target: reference, value: number }),
        object({ mode: { const: 'release' }, target: reference })
      ]
    }
    expect(admitAiRecipe(input, chain(find.outputSchema, schema)).ok).toBe(true)
    input.steps[1].input.fields.target = {
      kind: 'literal',
      value: 'captured-id'
    }
    expect(admitAiRecipe(input, chain(find.outputSchema, schema)).ok).toBe(
      false
    )
    input.steps[1].input.fields.target = {
      kind: 'step',
      step: 'locate',
      path: '/target'
    }
    input.inputSchema.properties.mode = {
      type: 'string',
      enum: ['edit', 'release']
    }
    expect(admitAiRecipe(input, chain(find.outputSchema, schema)).ok).toBe(
      false
    )
  })

  it('rejects ambiguous unions and additional constraints on union siblings', () => {
    const input = proposal()
    input.steps[1].input.fields.mode = { kind: 'literal', value: 'edit' }
    const branch = object({
      mode: { const: 'edit' },
      target: reference,
      value: number
    })
    expect(
      admitAiRecipe(
        input,
        chain(find.outputSchema, { oneOf: [branch, branch] })
      ).ok
    ).toBe(false)
    expect(
      admitAiRecipe(
        input,
        chain(find.outputSchema, { oneOf: [branch], not: branch })
      ).ok
    ).toBe(false)
  })

  it('keeps opaque fields unusable even when given a literal', () => {
    const input = proposal()
    input.steps[1].input.fields.value = { kind: 'literal', value: 'x' }
    expect(
      admitAiRecipe(
        input,
        chain(
          find.outputSchema,
          object({ target: reference, value: { $ref: '#/$defs/secret' } })
        )
      ).ok
    ).toBe(false)
  })

  it('accepts omitted optional required arrays but does not invent optional source paths', () => {
    const input = proposal()
    input.steps[1].input.fields.settings = { kind: 'object', fields: {} }
    const schema = object({
      target: reference,
      value: number,
      settings: {
        type: 'object',
        properties: { label: { type: 'string' } },
        additionalProperties: false
      }
    })
    expect(admitAiRecipe(input, chain(find.outputSchema, schema)).ok).toBe(true)
  })

  it('rejects an open source object forwarded into a closed destination', () => {
    const input = proposal()
    input.steps[1].input = { kind: 'step', step: 'locate', path: '' } as never
    const source = {
      ...object({ target: reference, value: number }),
      additionalProperties: true
    }
    expect(admitAiRecipe(input, chain(source)).ok).toBe(false)
  })

  it('preserves uniqueness for literals and refuses unproven constructed arrays', () => {
    const input = proposal()
    const schema = object({
      target: reference,
      value: number,
      tags: { type: 'array', items: { type: 'string' }, uniqueItems: true }
    })
    input.steps[1].input.fields.tags = {
      kind: 'array',
      items: [
        { kind: 'literal', value: 'a' },
        { kind: 'literal', value: 'b' }
      ]
    }
    expect(admitAiRecipe(input, chain(find.outputSchema, schema)).ok).toBe(true)
    input.steps[1].input.fields.tags = {
      kind: 'array',
      items: [
        { kind: 'input', path: '/query' },
        { kind: 'input', path: '/query' }
      ]
    }
    expect(admitAiRecipe(input, chain(find.outputSchema, schema)).ok).toBe(
      false
    )
  })
})

it('preserves runtime classifications carried by a registered union wrapper', () => {
  const input = proposal()
  input.steps[1].input.fields.value = { kind: 'input', path: '/value' }
  const union = { anyOf: [{ type: 'number' }], 'x-runtime-value': 'secret' }
  const resolve = (name: string) =>
    name === 'find'
      ? find
      : createAiToolContract({
          ...edit,
          inputSchema: object({ target: reference, value: union })
        })
  expect(admitAiRecipe(input, options({ resolve })).ok).toBe(false)
  input.inputSchema.properties.value = {
    type: 'number',
    'x-runtime-value': 'secret'
  }
  expect(admitAiRecipe(input, options({ resolve })).ok).toBe(true)
})

describe('registered ordered receipt bindings', () => {
  const receipt = (prefix: unknown, minItems = 1) =>
    createAiToolContract({
      ...find,
      outputSchema: object({
        receipts: {
          type: 'array',
          minItems,
          prefixItems: [prefix],
          items: { type: 'string' }
        }
      })
    })
  const bound = (path = '/receipts/0/target') => {
    const input = proposal()
    input.steps[1].input.fields.target = { kind: 'step', step: 'locate', path }
    return input
  }
  const resolve = (contract: ReturnType<typeof receipt>) => (name: string) =>
    name === 'find' ? contract : edit

  it('binds a guaranteed primary receipt independently of later diagnostics', () => {
    const contract = receipt(object({ target: reference }))
    expect(
      admitAiRecipe(bound(), options({ resolve: resolve(contract) })).ok
    ).toBe(true)
    expect(
      admitAiRecipe(
        bound('/receipts/1/target'),
        options({ resolve: resolve(contract) })
      ).ok
    ).toBe(false)
    expect(
      admitAiRecipe(
        bound(),
        options({ resolve: resolve(receipt(object({ target: reference }), 0)) })
      ).ok
    ).toBe(false)
    expect(
      admitAiRecipe(
        bound(),
        options({
          resolve: resolve(receipt(object({ target: { type: 'number' } })))
        })
      ).ok
    ).toBe(false)
  })

  it('does not treat a heterogeneous prefix as a homogeneous whole array', () => {
    const input = proposal()
    input.steps.splice(1)
    input.outputSchema = { type: 'array', items: { type: 'string' } } as never
    input.output = { kind: 'step', step: 'locate', path: '/receipts' }
    expect(
      admitAiRecipe(
        input,
        options({ resolve: resolve(receipt({ type: 'number' })) })
      ).ok
    ).toBe(false)
    expect(
      admitAiRecipe(
        input,
        options({ resolve: resolve(receipt({ type: 'string' })) })
      ).ok
    ).toBe(true)
  })

  it('rejects captured runtime values in registered prefix inputs', () => {
    const contract = createAiToolContract({
      ...find,
      inputSchema: {
        type: 'array',
        minItems: 1,
        prefixItems: [{ type: 'string', 'x-runtime-value': 'request' }],
        items: { type: 'string' }
      }
    })
    const input = proposal()
    input.steps[0].input = { kind: 'literal', value: ['old-request'] } as never
    expect(
      admitAiRecipe(input, options({ resolve: resolve(contract) })).ok
    ).toBe(false)
  })
})

it('checks constructed items against registered positional constraints', () => {
  const contract = createAiToolContract({
    ...find,
    inputSchema: {
      type: 'array',
      minItems: 1,
      prefixItems: [{ type: 'number' }],
      items: { type: 'string' }
    }
  })
  const input = proposal()
  input.steps[0].input = {
    kind: 'array',
    items: [{ kind: 'input', path: '/query' }]
  } as never
  const resolve = (name: string) => (name === 'find' ? contract : edit)
  expect(admitAiRecipe(input, options({ resolve })).ok).toBe(false)
  input.steps[0].input = {
    kind: 'array',
    items: [
      { kind: 'literal', value: 4 },
      { kind: 'literal', value: 'diagnostic' }
    ]
  } as never
  expect(admitAiRecipe(input, options({ resolve })).ok).toBe(true)
})

it('requires fresh typed values for undeclared fields of an open registered object', () => {
  const schema = {
    type: 'object',
    properties: { label: { type: 'string' } },
    additionalProperties: true
  }
  expect(
    admitStructured(schema, number, {
      kind: 'literal',
      value: { label: 'Part' }
    }).ok
  ).toBe(true)
  const captured = admitStructured(schema, number, {
    kind: 'literal',
    value: { label: 'Part', ref: 'prior-document-id' }
  })
  expect(captured.ok).toBe(false)
  if (!captured.ok) {
    expect(
      captured.issues.some((issue) => issue.code === 'captured-value')
    ).toBe(true)
  }
  expect(
    admitStructured(
      schema,
      object({ label: { type: 'string' }, ref: { type: 'string' } }),
      { kind: 'input', path: '' }
    ).ok
  ).toBe(true)
})

describe('bounded repair admission', () => {
  const scalar = { type: 'number' }
  const outcome = object({
    status: {
      type: 'string',
      enum: ['pass', 'repairable', 'decision-required']
    },
    progress: { type: 'string', minLength: 1 },
    remaining: scalar
  })
  const fixture = () => {
    const common = {
      description: 'A deterministic scalar operation.',
      revision: 1,
      inputSchema: scalar,
      outputSchema: scalar,
      resources: ['scalar'],
      composition: 'allowed' as const,
      lifecycle: {
        cancellation: 'cooperative' as const,
        retry: 'never' as const,
        output: 'value' as const
      }
    }
    const contracts = new Map([
      [
        'write',
        createAiToolContract({ ...common, name: 'write', effect: 'mutation' })
      ],
      [
        'check',
        createAiToolContract({
          ...common,
          name: 'check',
          effect: 'read',
          outputSchema: outcome,
          verification: { statusPath: '/status', progressPath: '/progress' }
        })
      ]
    ])
    const proposal = {
      format: 1,
      name: 'repair-scalar',
      description: 'Apply and mechanically repair a scalar.',
      revision: 1,
      inputSchema: scalar,
      outputSchema: scalar,
      steps: [
        {
          id: 'initial',
          tool: 'write',
          revision: 1,
          input: { kind: 'input', path: '' }
        }
      ],
      iteration: {
        id: 'verified',
        stateSchema: scalar,
        state: { kind: 'step', step: 'initial', path: '' },
        check: {
          id: 'verification',
          tool: 'check',
          revision: 1,
          input: { kind: 'state', path: '' }
        },
        repairs: [
          {
            id: 'correction',
            tool: 'write',
            revision: 1,
            input: { kind: 'step', step: 'verification', path: '/remaining' }
          }
        ],
        next: { kind: 'step', step: 'correction', path: '' },
        maxIterations: 3
      },
      output: { kind: 'step', step: 'verified', path: '/state' }
    }
    const admit = () =>
      admitAiRecipe(proposal, {
        resolve: (name) => contracts.get(name),
        validate: () => undefined,
        limits: {
          bytes: 20000,
          steps: 8,
          bindings: 100,
          bindingDepth: 12,
          issues: 20
        }
      })
    return { contracts, proposal, admit }
  }

  it('admits a typed bounded repair with owner-declared check semantics', () => {
    const { admit } = fixture()
    const result = admit()
    expect(result).toMatchObject({
      ok: true,
      value: { contract: { effect: 'mutation' } }
    })
    if (result.ok) {
      expect(result.value.dependencies).toHaveLength(2)
      expect(
        result.value.dependencies.find((item) => item.name === 'check')
          ?.verification
      ).toEqual({ statusPath: '/status', progressPath: '/progress' })
    }
  })

  it.each([
    'missing',
    'mutation',
    'optional',
    'wrong-status',
    'empty-progress'
  ])('rejects a %s verification contract without executing it', (mode) => {
    const { contracts, admit } = fixture()
    const original = contracts.get('check')
    if (!original) {
      throw new Error('Missing checker')
    }
    const replacement = { ...original, outputSchema: structuredClone(outcome) }
    if (mode === 'missing') {
      delete replacement.verification
    }
    if (mode === 'mutation') {
      replacement.effect = 'mutation'
    }
    if (mode === 'optional') {
      replacement.outputSchema.required = ['remaining']
    }
    if (mode === 'wrong-status') {
      replacement.outputSchema.properties.status = {
        type: 'string',
        enum: ['done']
      }
    }
    if (mode === 'empty-progress') {
      replacement.outputSchema.properties.progress = {
        type: 'string',
        minLength: 0
      }
    }
    // Malformed host descriptors must also fail admission, not just registration.
    contracts.set('check', {
      ...replacement,
      outputSchema: detachAiJsonValue(replacement.outputSchema)
    })
    expect(admit().ok).toBe(false)
  })

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER, 4])(
    'rejects invalid or over-budget rounds %s',
    (rounds) => {
      const { proposal, admit } = fixture()
      proposal.iteration.maxIterations = rounds
      expect(admit().ok).toBe(false)
    }
  )

  it.each([
    'state-outside',
    'forward',
    'optional-repair-output',
    'next-type',
    'duplicate',
    'captured-state'
  ])('rejects %s without weakening binding rules', (mode) => {
    const { proposal, admit } = fixture()
    if (mode === 'state-outside') {
      proposal.steps[0].input.kind = 'state'
    }
    if (mode === 'forward') {
      proposal.iteration.check.input = {
        kind: 'step',
        step: 'correction',
        path: ''
      } as never
    }
    if (mode === 'optional-repair-output') {
      proposal.output.step = 'correction'
    }
    if (mode === 'next-type') {
      proposal.iteration.next.path = '/missing'
    }
    if (mode === 'duplicate') {
      proposal.iteration.check.id = 'initial'
    }
    if (mode === 'captured-state') {
      proposal.iteration.stateSchema = {
        type: 'string',
        'x-runtime-value': 'request'
      } as never
      proposal.iteration.state = {
        kind: 'literal',
        value: 'old-request'
      } as never
    }
    expect(admit().ok).toBe(false)
  })
})

it('admits fresh leased handles without accepting captured or plain request values', () => {
  const artifact = { type: 'string', 'x-runtime-value': 'request-artifact' }
  const request = { type: 'string', 'x-runtime-value': 'request' }
  expect(
    admitStructured(artifact, artifact, { kind: 'input', path: '' }).ok
  ).toBe(true)
  expect(
    admitStructured(artifact, request, { kind: 'input', path: '' }).ok
  ).toBe(false)
  expect(
    admitStructured(request, artifact, { kind: 'input', path: '' }).ok
  ).toBe(false)
  expect(
    admitStructured(artifact, number, { kind: 'literal', value: 'captured' }).ok
  ).toBe(false)
})

it('preserves unique request selections through finite recipe input schemas', () => {
  const schema = {
    type: 'array',
    minItems: 1,
    uniqueItems: true,
    items: { type: 'string', 'x-runtime-value': 'request' }
  }
  expect(admitStructured(schema, schema, { kind: 'input', path: '' }).ok).toBe(
    true
  )
  expect(
    admitStructured(
      schema,
      { ...schema, uniqueItems: false },
      { kind: 'input', path: '' }
    ).ok
  ).toBe(false)
  expect(
    admitStructured(
      schema,
      { ...schema, uniqueItems: 'true' },
      { kind: 'input', path: '' }
    ).ok
  ).toBe(false)
})

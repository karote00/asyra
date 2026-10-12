import { describe, expect, it, vi } from 'vitest'
import {
  AiActionRegistryError,
  createAiActionRegistry,
  type AiActionDefinition
} from '..'

interface ResizeArgs {
  width: number
}

const inputSchema = () => ({
  additionalProperties: false,
  properties: {
    width: {
      type: 'number'
    }
  },
  required: ['width'],
  type: 'object'
})

const action = (
  name: string,
  schema: unknown = inputSchema()
): AiActionDefinition<ResizeArgs, { resized: true }> => ({
  revision: 1,
  outputSchema: {
    type: 'object',
    required: ['resized'],
    properties: { resized: { const: true } }
  },
  effect: 'mutation',
  resources: ['document'],
  lifecycle: {
    cancellation: 'before-dispatch',
    retry: 'never',
    output: 'value'
  },
  description: `Execute ${name}`,
  execute: vi.fn(async (): Promise<{ resized: true }> => ({
    resized: true
  })),
  inputSchema: schema,
  name
})

const expectRegistryError = (
  execute: () => unknown,
  code: AiActionRegistryError['code']
) => {
  expect(execute).toThrowError(
    expect.objectContaining({
      code
    })
  )
}

describe('AI action registry', () => {
  it('lists detached immutable backend-facing input schemas in registration order', () => {
    const schema = inputSchema()
    const first = action('resize', schema)
    const registry = createAiActionRegistry()

    registry.register(first)
    registry.register(action('rotate'))
    schema.properties.width.type = 'string'
    first.description = 'mutated after registration'

    const descriptions = registry.list()

    expect(descriptions).toEqual([
      {
        description: 'Execute resize',
        inputSchema: {
          additionalProperties: false,
          properties: {
            width: {
              type: 'number'
            }
          },
          required: ['width'],
          type: 'object'
        },
        name: 'resize'
      },
      {
        description: 'Execute rotate',
        inputSchema: inputSchema(),
        name: 'rotate'
      }
    ])
    expect('execute' in descriptions[0]).toBe(false)
    expect('schema' in descriptions[0]).toBe(false)
    expect(Object.isFrozen(descriptions)).toBe(true)
    expect(Object.isFrozen(descriptions[0])).toBe(true)
    expect(Object.isFrozen(descriptions[0].inputSchema)).toBe(true)
  })

  it('registers the common contract and executor without an alternate schema surface', () => {
    const registry = createAiActionRegistry()
    const resize = action('resize')

    registry.register(resize)

    const registered = registry.get('resize')
    expect(registered).toEqual(resize)
    expect(registered).not.toHaveProperty('schema')
    expect(registered).not.toHaveProperty('parse')
    expect(registered).not.toHaveProperty('prepare')
  })

  it('rejects duplicate names without replacing the original action', () => {
    const registry = createAiActionRegistry()
    const original = action('resize')
    const duplicate = action('resize')

    registry.register(original)

    expectRegistryError(
      () => registry.register(duplicate),
      'AI_ACTION_DUPLICATE'
    )
    expect(registry.get('resize')?.execute).toBe(original.execute)
    expect(registry.list()).toHaveLength(1)
  })

  it('rejects invalid definitions before changing the registry', () => {
    const registry = createAiActionRegistry()
    const cyclicSchema: Record<string, unknown> = {}
    cyclicSchema.self = cyclicSchema

    expectRegistryError(
      () => registry.register(action('   ')),
      'AI_ACTION_INVALID_NAME'
    )
    expectRegistryError(
      () =>
        registry.register({
          ...action('missing-description'),
          description: ' '
        }),
      'AI_ACTION_INVALID_DESCRIPTION'
    )
    expectRegistryError(
      () => registry.register(action('cyclic-schema', cyclicSchema)),
      'AI_ACTION_INVALID_INPUT_SCHEMA'
    )
    expectRegistryError(() => registry.list(), 'AI_ACTION_REGISTRY_EMPTY')
  })

  it('isolates registrations and disposal between registry instances', () => {
    const first = createAiActionRegistry()
    const second = createAiActionRegistry()

    first.register(action('resize'))
    first.dispose()

    expectRegistryError(
      () => first.get('resize'),
      'AI_ACTION_REGISTRY_DISPOSED'
    )
    expectRegistryError(
      () => first.register(action('rotate')),
      'AI_ACTION_REGISTRY_DISPOSED'
    )
    expectRegistryError(() => second.list(), 'AI_ACTION_REGISTRY_EMPTY')
  })
})

it('retains the common immutable contract while projecting only provider input fields', () => {
  const registry = createAiActionRegistry()
  const outputSchema = {
    type: 'object',
    required: ['resized'],
    properties: { resized: { const: true } }
  }
  registry.register({
    ...action('resize'),
    revision: 1,
    outputSchema,
    effect: 'mutation',
    resources: ['document'],
    lifecycle: {
      cancellation: 'before-dispatch',
      retry: 'never',
      output: 'value'
    }
  })
  outputSchema.required.push('unexpected')
  expect(registry.get('resize')).toMatchObject({
    revision: 1,
    outputSchema: { required: ['resized'] },
    effect: 'mutation'
  })
  expect(registry.list()[0]).not.toHaveProperty('outputSchema')
  expect(Object.isFrozen(registry.get('resize')?.outputSchema)).toBe(true)
})

describe('revisioned request visibility', () => {
  it('keeps a candidate private in both lookup and compact discovery', () => {
    const registry = createAiActionRegistry()
    registry.register(action('basic'))
    registry.register(action('recipe'), {
      kind: 'composition',
      requestId: 'author'
    })
    expect(registry.get('recipe')).toBeUndefined()
    expect(registry.list().map((item) => item.name)).toEqual(['basic'])
    expect(registry.get('recipe', { requestId: 'other' })).toBeUndefined()
    expect(registry.get('recipe', { requestId: 'author' })).toBeDefined()
    expect(
      registry.list({ requestId: 'author' }).map((item) => item.name)
    ).toEqual(['basic', 'recipe'])
    expect(registry.registration('recipe', { requestId: 'author' })?.kind).toBe(
      'composition'
    )
  })

  it('preserves immutable revisions and refuses stale revision replacement', () => {
    const registry = createAiActionRegistry()
    registry.register(action('basic'))
    const first = registry.get('basic')
    registry.register(
      { ...action('basic'), revision: 2 },
      { expectedRevision: 1 }
    )
    expect(registry.get('basic')?.revision).toBe(2)
    expect(registry.get('basic', { revision: 1 })).toBe(first)
    expect(() =>
      registry.register(
        { ...action('basic'), revision: 3 },
        { expectedRevision: 1 }
      )
    ).toThrow()
    expect(registry.get('basic')?.revision).toBe(2)
  })

  it('publishes only an explicit eligible transition and preserves pinned definitions', () => {
    const registry = createAiActionRegistry()
    registry.register(action('recipe'), {
      kind: 'composition',
      requestId: 'author'
    })
    registry.setAvailability('recipe', 1, 'eligible')
    const pinned = registry.get('recipe')
    expect(pinned).toBeDefined()
    registry.setAvailability('recipe', 1, 'suspended')
    expect(registry.get('recipe')).toBeUndefined()
    expect(registry.get('recipe', { requestId: 'author' })).toBeUndefined()
    expect(pinned?.revision).toBe(1)
    registry.setAvailability('recipe', 1, 'retired')
    expect(() => registry.setAvailability('recipe', 1, 'eligible')).toThrow()
  })

  it('does not let another request replace a private candidate', () => {
    const registry = createAiActionRegistry()
    registry.register(action('recipe'), {
      kind: 'composition',
      requestId: 'author'
    })
    expect(() =>
      registry.register(
        { ...action('recipe'), revision: 2 },
        {
          kind: 'composition',
          requestId: 'other',
          expectedRevision: 1
        }
      )
    ).toThrow()
    expect(registry.get('recipe', { requestId: 'author' })?.revision).toBe(1)
  })
})

it('does not silently reactivate an older revision after a newer one is suspended', () => {
  const registry = createAiActionRegistry()
  registry.register(action('basic'))
  registry.register(
    { ...action('basic'), revision: 2 },
    { expectedRevision: 1 }
  )
  registry.setAvailability('basic', 2, 'suspended')
  expect(registry.get('basic')).toBeUndefined()
  expect(registry.get('basic', { revision: 1 })?.revision).toBe(1)
})

import { expect, it } from 'vitest'
import {
  readRegisteredRecipeSchema,
  recipeAssignable,
  recipeCapturesValue,
  recipeSchemaAt
} from '../recipe-schema.js'

const names = { type: 'string', minLength: 1, maxLength: 160 }
const value = { type: 'array', items: { type: 'number' }, minItems: 1 }

const map = (items: unknown = value, propertyNames: unknown = names) => ({
  type: 'object',
  propertyNames,
  additionalProperties: items
})

const read = readRegisteredRecipeSchema

it('proves registered map forwarding while preserving key and value restrictions', () => {
  expect(recipeAssignable(read(map()), read(map()))).toBe(true)
  expect(
    recipeAssignable(read(map(value, { type: 'string' })), read(map()))
  ).toBe(false)
  expect(recipeAssignable(read(map({ type: 'string' })), read(map()))).toBe(
    false
  )
  expect(
    recipeAssignable(
      read({ type: 'object', additionalProperties: true }),
      read(map())
    )
  ).toBe(false)
  expect(() => recipeSchemaAt(read(map()), '/unknown')).toThrow(
    /not guaranteed/
  )
})

it('preserves runtime lifetimes inside maps and rejects captured references', () => {
  const reference = { type: 'string', 'x-runtime-value': 'request-artifact' }

  expect(recipeAssignable(read(map(reference)), read(map(reference)))).toBe(
    true
  )
  expect(
    recipeAssignable(read(map(reference)), read(map({ type: 'string' })))
  ).toBe(false)
  expect(
    recipeAssignable(
      read(map(reference)),
      read({ type: 'object', additionalProperties: true })
    )
  ).toBe(false)
  expect(recipeCapturesValue({ a: 'request-id' }, read(map(reference)))).toBe(
    true
  )
  expect(recipeCapturesValue({ a: [1] }, read(map()))).toBe(false)
})

it('forwards mutually exclusive optional fields without allowing forbidden values', () => {
  const choice = {
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    properties: {
      name: { type: 'string' },
      fill: { type: 'string' },
      material: { type: 'string' }
    },
    anyOf: [
      { properties: { material: false } },
      { properties: { fill: false } }
    ]
  }

  expect(recipeAssignable(read(map(choice)), read(map(choice)))).toBe(true)
  const unrestricted = { ...choice }

  Reflect.deleteProperty(unrestricted, 'anyOf')
  expect(recipeAssignable(read(map(unrestricted)), read(map(choice)))).toBe(
    false
  )
  expect(recipeAssignable(read(false), read(false))).toBe(false)
})

it('keeps guarded request paths typed while rejecting unknown paths and impossible indices', () => {
  const schema = read({
    type: 'object',
    properties: {
      ids: { type: 'array', items: { type: 'string' }, maxItems: 1 }
    }
  })

  expect(() => recipeSchemaAt(schema, '/ids/0')).toThrow()
  expect(recipeSchemaAt(schema, '/ids/0', true).type).toBe('string')
  expect(() => recipeSchemaAt(schema, '/unknown', true)).toThrow()
  expect(() => recipeSchemaAt(schema, '/ids/1', true)).toThrow()
})

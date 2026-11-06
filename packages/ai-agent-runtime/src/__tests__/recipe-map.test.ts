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

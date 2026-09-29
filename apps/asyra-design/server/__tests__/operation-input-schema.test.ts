import { expect, it } from 'vitest'
import { operationInputIssue } from '../operation-input-schema'

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

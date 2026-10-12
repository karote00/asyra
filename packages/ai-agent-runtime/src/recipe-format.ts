import { detachAiJsonValue } from './json-value.js'
import type { AiJsonValue } from './types.js'

const object = (properties: Record<string, AiJsonValue>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false
})
const text = { type: 'string', minLength: 1, pattern: '\\S' }
const revision = {
  type: 'integer',
  minimum: 1,
  maximum: Number.MAX_SAFE_INTEGER
}
const pointer = { type: 'string', pattern: '^(?:/(?:[^~]|~[01])*)*$' }
const binding = { $ref: '#/$defs/binding' }
const contractSchema = {
  type: 'object',
  description:
    'Concrete structural schema: closed objects, homogeneous arrays, primitives, enums and bounds. Admission checks the supported subset and proven bindings.'
}
const bindingVariants = {
  literal: object({ kind: { const: 'literal' }, value: {} }),
  input: object({ kind: { const: 'input' }, path: pointer }),
  step: object({ kind: { const: 'step' }, step: text, path: pointer }),
  object: object({
    kind: { const: 'object' },
    fields: { type: 'object', additionalProperties: binding }
  }),
  array: object({
    kind: { const: 'array' },
    items: { type: 'array', items: binding }
  })
}
const step = object({ id: text, tool: text, revision, input: binding })
const proposal = object({
  format: { const: 1 },
  name: text,
  description: text,
  revision,
  inputSchema: contractSchema,
  outputSchema: contractSchema,
  steps: { type: 'array', minItems: 1, items: step },
  output: binding
})

/** Canonical transport shape; semantic admission is required after schema validation. */
export const aiRecipeInputSchema = detachAiJsonValue({
  ...proposal,
  $defs: { binding: { oneOf: Object.values(bindingVariants) } }
})

// Admission uses these same field inventories rather than a second format definition.
export const recipeFormatKeys = Object.freeze({
  proposal: Object.freeze(proposal.required),
  step: Object.freeze(step.required),
  bindings: Object.freeze(
    Object.fromEntries(
      Object.entries(bindingVariants).map(([name, value]) => [
        name,
        Object.freeze(value.required)
      ])
    )
  )
})

import { expect, it } from 'vitest'
import {
  AiToolInputError,
  type AiToolContractInput
} from '@asyra/ai-agent-runtime'
import {
  invokeAiToolOwner,
  projectToolDelivery
} from '@asyra/ai-agent-runtime/schema'

const definition: AiToolContractInput = {
  name: 'reserve',
  revision: 1,
  description: 'Reserve inventory',
  inputSchema: { type: 'integer', minimum: 1 },
  outputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      secret: { type: 'number', 'x-model-visibility': 'internal' }
    },
    required: ['id', 'secret'],
    additionalProperties: false
  },
  partialOutputSchema: {
    type: 'object',
    properties: { completed: { type: 'integer', minimum: 1 } },
    required: ['completed'],
    additionalProperties: false
  },
  effect: 'mutation',
  resources: ['inventory'],
  lifecycle: { cancellation: 'cooperative', retry: 'never', output: 'value' }
}

it('pins and validates complete owner results before projection and isolates phase observers', async () => {
  let writes = 0

  const invoke = (input: number, value: unknown) =>
    invokeAiToolOwner({
      definition,
      input,
      signal: new AbortController().signal,

      execute: async () => {
        writes++

        return value
      },

      inspectOwner: (value) => ({
        value,
        outcome: { status: 'success', settlement: 'completed' }
      }),

      onPhase: () => {
        throw Error('Observer unavailable')
      }
    })

  await expect(invoke(0, { id: 'one', secret: 3 })).rejects.toBeInstanceOf(
    AiToolInputError
  )
  expect(writes).toBe(0)
  await expect(invoke(1, { id: 'one' })).rejects.toMatchObject({
    stage: 'output'
  })
  const result = await invoke(1, { id: 'one', secret: 3 })

  expect(writes).toBe(2)
  expect(result.value).toEqual({ id: 'one', secret: 3 })
  expect(
    projectToolDelivery(result.contract, result.value, result.outcome).value
  ).toEqual({ id: 'one' })
})

it('keeps legal partial output distinct from malformed success without replay', async () => {
  let calls = 0
  const result = await invokeAiToolOwner({
    definition,
    input: 1,
    signal: new AbortController().signal,

    execute: async () => {
      calls++

      return { completed: 1 }
    },

    inspectOwner: (value) => ({
      value,
      outcome: { status: 'partial', settlement: 'partial' }
    })
  })

  expect(result.outcome).toEqual({ status: 'partial', settlement: 'partial' })
  expect(result.value).toEqual({ completed: 1 })
  expect(calls).toBe(1)
})

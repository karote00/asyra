import { expect, it } from 'vitest'
import { isRecord } from '@asyra/utils'
import { toolSemantics } from '../../src/ai/tool-contract'
import { createToolHostFixture } from './tool-host-fixture'

const inputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: { expected: { type: 'number' } },
  required: ['expected']
}
const outputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: { value: { type: 'number' } },
  required: ['value']
}

it('rejects an owner result against the selected invocation contract', async () => {
  const owner = {
    definitions: [
      {
        name: 'read_knowledge',
        description: 'Selected result',
        inputSchema,
        ...toolSemantics(outputSchema, 'read', [])
      }
    ],

    call: async () => JSON.stringify({ value: 2 }),

    invocationSchemas: () => ({
      inputSchema,
      outputSchema: {
        ...outputSchema,
        properties: { value: { const: 1 } }
      }
    })
  }
  const host = createToolHostFixture(() => [
    { name: 'knowledge', description: 'Knowledge', owner }
  ])
  const reply = await host.invoke({
    name: 'knowledge.read_knowledge',
    input: { expected: 1 }
  })
  const result = JSON.parse(reply.text)

  expect(reply.success).toBe(false)

  expect(result).toMatchObject({ code: 'TOOL_RESULT_INVALID' })
})

it('rejects invalid model projection while preserving completed execution', async () => {
  const owner = {
    definitions: [
      {
        name: 'read_knowledge',
        description: 'Projected result',
        inputSchema,
        ...toolSemantics(outputSchema, 'read', [])
      }
    ],

    call: async () => JSON.stringify({ value: 1 }),

    projectModelResult: () => ({ value: 'invalid-number' })
  }
  const host = createToolHostFixture(() => [
    { name: 'knowledge', description: 'Knowledge', owner }
  ])
  const reply = await host.invoke({
    name: 'knowledge.read_knowledge',
    input: { expected: 1 }
  })
  const result = JSON.parse(reply.text)

  expect(reply.success).toBe(false)

  expect(result).toMatchObject({
    code: 'TOOL_DELIVERY_INVALID',
    settlement: 'completed'
  })
})

it('rejects an unavailable continuation tool instead of reusing the original reader', async () => {
  const { readCompleteInformation } = await import('./tool-contract-assertions')
  const { deliverInformation } = await import('../local-information-delivery')
  const text = JSON.stringify({ value: 'x'.repeat(48000) })

  const read = async (input: unknown, requestedTool: string) => {
    if (requestedTool !== 'read_knowledge' || !isRecord(input)) {
      throw Error('Unknown continuation tool')
    }

    const page = JSON.parse(
      deliverInformation(text, 'read_knowledge', input, 'pages')
    )

    if (page.contentDelivery.next) {
      page.contentDelivery.next.tool = 'missing_tool'
    }

    return JSON.stringify(page)
  }

  let rejected = false

  try {
    await readCompleteInformation(read, {}, 'read_knowledge')
  } catch {
    rejected = true
  }

  expect(rejected).toBe(true)
})

it('accepts valid selected model output without dispatching twice', async () => {
  let calls = 0
  const host = createToolHostFixture(() => [
    {
      name: 'fixture',
      description: 'Selected owner',
      owner: {
        definitions: [
          {
            name: 'read_value',
            description: 'Read a value',
            inputSchema,
            ...toolSemantics(outputSchema, 'read', [])
          }
        ],

        invocationSchemas: () => ({
          inputSchema,
          outputSchema: {
            ...outputSchema,
            properties: { value: { const: 1 } }
          }
        }),

        call: async () => {
          calls++

          return JSON.stringify({ value: 1 })
        },

        projectModelResult: (_name, _input, value) => value
      }
    }
  ])
  const reply = await host.invoke({
    name: 'fixture.read_value',
    input: { expected: 1 }
  })

  expect(reply.success).toBe(true)
  expect(JSON.parse(reply.text)).toEqual({ value: 1 })
  expect(calls).toBe(1)
})

it('carries real Knowledge through the Host and reuses its current result', async () => {
  const { createLocalKnowledgeTools } = await import('../local-knowledge')
  const host = createToolHostFixture(() => [
    {
      name: 'knowledge',
      description: 'Knowledge',
      owner: createLocalKnowledgeTools('verification-knowledge')
    }
  ])
  const first = await host.invoke({
    name: 'knowledge.read_knowledge',
    input: { ids: ['typography'] }
  })

  expect(first.success, first.text).toBe(true)
  const read = JSON.parse(first.text)

  expect(read.documents.length).toBeGreaterThan(0)
  const second = await host.invoke({
    name: 'knowledge.read_knowledge',
    input: { ids: ['typography'], fromResult: read.contextKey }
  })

  expect(second.success, second.text).toBe(true)
  expect(JSON.parse(second.text).documents).toEqual(read.documents)
})

import { expect, it, vi } from 'vitest'
import * as runtime from '@asyra/ai-agent-runtime'
import { runtimeOperationSchema } from '../local-operation-batch'
import { createLocalOperationTools } from '../local-operation-tools'
import { toolSemantics, toolResultObject } from '../../src/ai/tool-contract'

const result = {
  type: 'object',
  additionalProperties: false,
  required: ['value'],
  properties: { value: { type: 'number' }, optional: { type: 'string' } }
}

it('strips discovery annotations for output proofs without changing request lifetimes or owner fields', () => {
  const source = {
    ...result,
    'x-design-operation': 'sample',
    properties: {
      ...result.properties,
      handle: {
        type: 'string',
        'x-runtime-value': 'request-artifact',
        'x-design-operation': 'handle'
      }
    }
  }
  const projected = runtimeOperationSchema(source)

  expect(runtime.registeredRecipeOutputAt(projected, '/value')).toEqual({
    type: 'number'
  })
  expect(projected).not.toHaveProperty('x-design-operation')
  expect(projected.properties.handle).toEqual({
    type: 'string',
    'x-runtime-value': 'request-artifact'
  })
  expect(source).toHaveProperty('x-design-operation', 'sample')
})

it('distinguishes conditional or invalid paths from unsupported registered schemas', () => {
  expect(runtime).toHaveProperty('RecipeReferenceError')
  for (const path of ['/optional', '/missing', 'invalid']) {
    try {
      runtime.registeredRecipeOutputAt(result, path)
      throw Error('Expected path rejection')
    } catch (error) {
      expect(error).toBeInstanceOf(runtime.RecipeReferenceError)
    }
  }

  try {
    runtime.registeredRecipeOutputAt(
      { ...result, 'x-runtime-value': 'invalid' },
      '/value'
    )
    throw Error('Expected schema rejection')
  } catch (error) {
    expect(error).not.toBeInstanceOf(runtime.RecipeReferenceError)
    expect(String(error)).toContain('runtime value annotation')
  }
})

const discover = (outputSchema: object) => {
  const owner = createLocalOperationTools(
    [{ name: 'read_design_context', description: 'Context', inputSchema: {} }],
    {
      modelActions: (value) => value,

      resolveBatch: (value) => value
    },
    vi.fn(),
    {
      getNativeTools: () => [
        {
          name: 'a',
          namespace: 'numbers',
          registeredName: 'numbers.a',
          revision: 1,
          description: 'Produce one numeric value',
          inputSchema: toolResultObject({}),
          ...toolSemantics(outputSchema, 'read', []),
          composition: 'allowed'
        }
      ]
    }
  )

  return () =>
    owner.call(
      'describe_design_apis',
      { names: ['numbers.a'], view: 'usage' },
      new AbortController().signal
    )
}

it('does not present an invalid owner schema as merely conditional result fields', async () => {
  await expect(
    discover({ ...result, 'x-runtime-value': 'invalid' })()
  ).rejects.toThrow('runtime value annotation')
})

it('keeps valid optional fields distinct from guaranteed numeric results', async () => {
  const reply = JSON.parse(await discover(result)())
  const usage = reply.tools[0].usageGuide

  expect(JSON.stringify(usage)).toContain('/value')
  expect(usage.retention.guaranteedResultFields).toContain('/value')
  expect(usage.retention.guaranteedResultFields).not.toContain('/optional')
})

import { createLocalToolHost } from '../local-tool-host'
import { LocalToolLibraryLimits } from '../local-tool-library-limits'

it.each(['value', 'optional', 'missing', 'absent', 'broken'] as const)(
  'classifies selected %s results at the real host boundary without replay',
  async (mode) => {
    const call = vi.fn(async () =>
      JSON.stringify({
        value: 3,
        ...(mode === 'absent' ? {} : { optional: 'ready' })
      })
    )
    const output = {
      ...result,
      ...(mode === 'broken'
        ? { 'x-runtime-value': 'invalid' }
        : { 'x-design-operation': 'result' })
    }
    const host = createLocalToolHost({
      requestId: 'projection-' + mode,
      signal: new AbortController().signal,
      capacity: 32,
      receiptCapacity: 8,
      artifactCapacity: 64,
      limits: LocalToolLibraryLimits.recipe,
      store: {
        read: async () => undefined,

        list: async () => [],

        write: async () => {
          throw Error('No write')
        }
      },

      createGroups: () => [
        {
          name: 'numbers',
          description: 'Numbers',
          owner: {
            definitions: [
              {
                name: 'a',
                description: 'Produce data',
                inputSchema: toolResultObject({}),
                ...toolSemantics(output, 'read', []),
                composition: 'allowed'
              }
            ],
            call
          }
        }
      ]
    })

    try {
      const specialPaths: Record<string, string> = {
        broken: '/value',
        absent: '/optional'
      }
      const path = specialPaths[mode] ?? '/' + mode
      const reply = await host.invoke({
        name: 'design_operations.execute_design',
        input: {
          operations: [{ id: 'produce', name: 'numbers.a', arguments: {} }],
          delivery: { fields: { selected: { step: 'produce', path } } }
        }
      })
      const value = JSON.parse(reply.text)

      if (mode === 'value' || mode === 'optional') {
        expect(reply.success, reply.text).toBe(true)
        expect(value.fields.selected).toBe(mode === 'value' ? 3 : 'ready')
        expect(call).toHaveBeenCalledTimes(1)
      } else if (mode === 'missing') {
        expect(reply.success).toBe(false)
        expect(value.recovery).toBe('correct_input')
        expect(call).not.toHaveBeenCalled()
      } else if (mode === 'broken') {
        expect(reply.success).toBe(false)
        expect(value.recovery).not.toBe('correct_input')
        expect(call).not.toHaveBeenCalled()
      } else {
        expect(reply.success).toBe(false)
        expect(call).toHaveBeenCalledTimes(1)
        expect(reply.text).toContain('optional')
      }
    } finally {
      await host.dispose()
    }
  }
)

it('preserves inherited request lifetime when selecting a nested value through a union', () => {
  const schema = {
    'x-runtime-value': 'request',
    anyOf: ['a', 'b'].map((kind) => ({
      type: 'object',
      required: ['kind', 'value'],
      properties: { kind: { const: kind }, value: { type: 'string' } }
    }))
  }
  const selected = runtime.registeredRecipeOutputAt(schema, '/value', true) as {
    anyOf: Record<string, unknown>[]
  }

  expect(selected.anyOf).toHaveLength(2)
  for (const variant of selected.anyOf) {
    expect(variant).toMatchObject({
      type: 'string',
      'x-runtime-value': 'request'
    })
  }
})

import { describe, expect, it, vi } from 'vitest'
import {
  AiToolContractError,
  createAiToolContract,
  createAiToolMiddleware,
  describeAiTool,
  embedAiToolSchema,
  inspectAiToolResult,
  type AiToolContractInput
} from '../tool-contract.js'
import { createAiInvoker } from '../invocation.js'

const definition = (): AiToolContractInput => ({
  name: 'set-values',
  description: 'Set supplied values on current targets.',
  revision: 1,
  inputSchema: { type: 'object', properties: { value: { type: 'number' } } },
  outputSchema: { type: 'boolean' },
  effect: 'mutation',
  resources: ['document'],
  lifecycle: { cancellation: 'cooperative', retry: 'never', output: 'value' }
})

describe('common tool contracts', () => {
  it('retains a detached model delivery declaration without replacing internal output', () => {
    const delivery = {
      path: '/modelResult',
      outputSchema: { type: 'object' },
      receipt: { path: '/retained', owner: 'context' }
    }
    const contract = createAiToolContract({
      ...definition(),
      delivery
    } as AiToolContractInput)
    expect(contract).toMatchObject({
      outputSchema: { type: 'boolean' },
      delivery
    })
    delivery.receipt.owner = 'changed'
    expect(contract.delivery?.receipt?.owner).toBe('context')
    expect(Object.isFrozen(contract.delivery?.receipt)).toBe(true)
    delivery.outputSchema.type = 'string'
    expect(contract).toMatchObject({
      delivery: { outputSchema: { type: 'object' } }
    })
    expect(
      Object.isFrozen((contract as unknown as { delivery: object }).delivery)
    ).toBe(true)
  })

  it.each([
    {
      path: '/summary',
      outputSchema: {},
      receipt: { path: 'wrong', owner: 'context' }
    },
    {
      path: '/summary',
      outputSchema: {},
      receipt: { path: '/retained', owner: '' }
    },
    {
      path: '/summary',
      outputSchema: {},
      receipt: { path: '/retained', owner: 'context', callback: 'unsafe' }
    },
    { path: '', outputSchema: {} },
    { path: 'summary', outputSchema: {} },
    { path: '/bad~2pointer', outputSchema: {} },
    { path: '/summary', outputSchema: undefined },
    { path: '/summary', outputSchema: {}, callback: 'unsafe' }
  ])(
    'rejects invalid model delivery declarations before invocation %j',
    (delivery) => {
      expect(() =>
        createAiToolContract({
          ...definition(),
          delivery
        } as AiToolContractInput)
      ).toThrow()
    }
  )

  it('relocates schema references without rewriting user literals or mutating the descriptor', () => {
    const schema = {
      type: 'object',
      $defs: { handle: { type: 'string' } },
      properties: {
        handle: { $ref: '#/$defs/handle' },
        literal: { const: { $ref: '#/user-authored' } },
        options: { anyOf: [{ $ref: '#/$defs/handle' }, { type: 'number' }] }
      }
    } as const
    expect(embedAiToolSchema(schema, '#/properties/value')).toMatchObject({
      properties: {
        handle: { $ref: '#/properties/value/$defs/handle' },
        literal: { const: { $ref: '#/user-authored' } },
        options: {
          anyOf: [
            { $ref: '#/properties/value/$defs/handle' },
            { type: 'number' }
          ]
        }
      }
    })
    expect(schema.properties.handle.$ref).toBe('#/$defs/handle')
  })

  it.each(['failed', 'unknown'] as const)(
    'validates declared %s recovery without promoting its outcome',
    (status) => {
      const recoveryOutputSchema = { type: 'string' }
      const contract = createAiToolContract({
        ...definition(),
        recoveryOutputSchema
      })
      const inspect = (value: unknown) =>
        inspectAiToolResult(contract, value, {
          outcome: { status, settlement: 'unknown' },
          validate: (value, schema) =>
            typeof value === (schema as { type: string }).type
              ? undefined
              : 'Wrong recovery type'
        })
      expect(inspect('repair-reference')).toMatchObject({
        status,
        settlement: 'unknown'
      })
      expect(inspect(false)).toMatchObject({
        status: 'invalid',
        reportedStatus: status,
        settlement: 'unknown'
      })
      recoveryOutputSchema.type = 'number'
      expect(contract.recoveryOutputSchema).toEqual({ type: 'string' })
      expect(Object.isFrozen(contract.recoveryOutputSchema)).toBe(true)
    }
  )

  it('selects a declared partial schema without weakening successful output', () => {
    const partialOutputSchema = { type: 'string' }
    const contract = createAiToolContract({
      ...definition(),
      partialOutputSchema
    })
    const validate = (value: unknown, schema: unknown) => {
      const type = (schema as { type: string }).type
      return typeof value === type ? undefined : `Expected ${type}`
    }
    const inspect = (status: 'success' | 'partial', value: unknown) =>
      inspectAiToolResult(contract, value, {
        outcome: { status, settlement: 'partial' },
        validate
      })
    expect(inspect('partial', 'Three writes completed')).toMatchObject({
      status: 'partial',
      settlement: 'partial'
    })
    expect(inspect('success', 'Three writes completed')).toMatchObject({
      status: 'invalid',
      reportedStatus: 'success',
      settlement: 'partial'
    })
    expect(inspect('partial', false)).toMatchObject({
      status: 'invalid',
      reportedStatus: 'partial'
    })
    expect(inspect('success', false)).toMatchObject({ status: 'success' })
    partialOutputSchema.type = 'number'
    expect(contract.partialOutputSchema).toEqual({ type: 'string' })
    expect(Object.isFrozen(contract.partialOutputSchema)).toBe(true)
  })

  it('rejects executable partial schemas during registration', () => {
    expect(() =>
      createAiToolContract({
        ...definition(),
        partialOutputSchema: { validate: () => true }
      })
    ).toThrow()
  })

  it('validates both sides through the existing invoker without replaying a write', async () => {
    const contract = createAiToolContract(definition())
    const execute = vi.fn(async () => ({ unexpected: true }))
    const observe = vi.fn()
    const invoke = createAiInvoker({
      execute,
      observe,
      middleware: [
        createAiToolMiddleware({
          resolve: () => contract,
          validate: (value, schema) =>
            schema === contract.outputSchema && typeof value !== 'boolean'
              ? 'result: expected boolean'
              : undefined,
          classify: () => ({ status: 'success', settlement: 'completed' })
        })
      ]
    })
    await expect(
      invoke.invoke({ name: contract.name, input: {} })
    ).rejects.toMatchObject({
      stage: 'output',
      inspection: {
        status: 'invalid',
        settlement: 'completed',
        value: { unexpected: true }
      }
    })
    expect(execute).toHaveBeenCalledOnce()
    expect(observe).toHaveBeenLastCalledWith(
      expect.objectContaining({ phase: 'failed' })
    )
  })

  it('rejects unknown operations and invalid inputs before invoking the owner', async () => {
    const contract = createAiToolContract(definition())
    const execute = vi.fn(async () => true)
    const invoke = createAiInvoker({
      execute,
      middleware: [
        createAiToolMiddleware({
          resolve: (name) => (name === contract.name ? contract : undefined),
          validate: () => 'arguments.value: expected number',
          classify: () => ({ status: 'success', settlement: 'completed' })
        })
      ]
    })
    await expect(
      invoke.invoke({ name: 'missing', input: {} })
    ).rejects.toMatchObject({ stage: 'registration' })
    await expect(
      invoke.invoke({ name: contract.name, input: {} })
    ).rejects.toMatchObject({ stage: 'input' })
    expect(execute).not.toHaveBeenCalled()
  })

  it('retains explicit unknown settlement without inventing a successful output', async () => {
    const contract = createAiToolContract(definition())
    const output = { interrupted: true }
    const invoke = createAiInvoker({
      execute: async () => output,
      middleware: [
        createAiToolMiddleware({
          resolve: () => contract,
          validate: () => undefined,
          classify: () => ({ status: 'unknown', settlement: 'unknown' })
        })
      ]
    })
    expect(await invoke.invoke({ name: contract.name, input: {} })).toBe(output)
  })
  it('owns an immutable descriptor while keeping provider delivery compact', () => {
    const input = definition()
    const contract = createAiToolContract(input)
    ;(input.outputSchema as { type: string }).type = 'string'
    ;(input.resources as string[]).push('network')
    expect(createAiToolContract(contract)).toBe(contract)
    expect(contract.outputSchema).toEqual({ type: 'boolean' })
    expect(contract.resources).toEqual(['document'])
    expect(Object.isFrozen(contract)).toBe(true)
    expect(Object.isFrozen(contract.outputSchema)).toBe(true)
    expect(Object.isFrozen(contract.lifecycle)).toBe(true)
    expect(describeAiTool(contract)).toEqual({
      name: input.name,
      description: input.description,
      inputSchema: input.inputSchema
    })
  })

  it.each([
    { name: '' },
    { description: ' ' },
    { revision: 0 },
    { revision: 1.5 },
    { outputSchema: undefined },
    { inputSchema: { minimum: NaN } },
    { resources: [''] },
    { effect: 'assumed-safe' },
    {
      lifecycle: {
        cancellation: 'cooperative',
        retry: 'always',
        output: 'value'
      }
    }
  ])('rejects a malformed descriptor: %j', (patch) => {
    expect(() =>
      createAiToolContract({ ...definition(), ...patch } as AiToolContractInput)
    ).toThrow()
  })

  it('rejects cyclic and executable schema values', () => {
    const cycle: Record<string, unknown> = {}
    cycle.self = cycle
    for (const outputSchema of [cycle, { parse: () => true }, new Date()])
      expect(() =>
        createAiToolContract({ ...definition(), outputSchema })
      ).toThrow()
  })

  it('validates false as a successful value without interpreting its truthiness', () => {
    const contract = createAiToolContract(definition())
    const validate = vi.fn(() => undefined)
    const result = inspectAiToolResult(contract, false, {
      outcome: { status: 'success', settlement: 'completed' },
      validate
    })
    expect(result).toEqual({
      status: 'success',
      settlement: 'completed',
      value: false
    })
    expect(validate).toHaveBeenCalledExactlyOnceWith(
      false,
      contract.outputSchema
    )
  })

  it('preserves partial settlement and actual data when output validation fails', () => {
    const value = { applied: ['one'], remaining: ['two'] }
    const result = inspectAiToolResult(
      createAiToolContract(definition()),
      value,
      {
        outcome: { status: 'partial', settlement: 'partial' },
        validate: () => '$.remaining: expected an array of identities'
      }
    )
    expect(result).toEqual({
      status: 'invalid',
      settlement: 'partial',
      value,
      issue: '$.remaining: expected an array of identities',
      reportedStatus: 'partial'
    })
  })

  it.each(['failed', 'unknown'] as const)(
    'preserves %s rather than validating it as a success',
    (status) => {
      const validate = vi.fn(() => 'not a success value')
      const value = { reason: 'Delivery interrupted' }
      const outcome = { status, settlement: 'unknown' as const }
      expect(
        inspectAiToolResult(createAiToolContract(definition()), value, {
          outcome,
          validate
        })
      ).toEqual({ ...outcome, value })
      expect(validate).not.toHaveBeenCalled()
    }
  )

  it('reports validator failure without discarding acknowledged execution', () => {
    const result = inspectAiToolResult(
      createAiToolContract(definition()),
      true,
      {
        outcome: { status: 'success', settlement: 'completed' },
        validate: () => {
          throw new Error('Validator unavailable')
        }
      }
    )
    expect(result).toMatchObject({
      status: 'invalid',
      settlement: 'completed',
      value: true
    })
    expect(result).toHaveProperty('issue', 'Validator unavailable')
  })

  it('does not accept malformed host outcome metadata as a successful result', () => {
    const result = inspectAiToolResult(
      createAiToolContract(definition()),
      true,
      {
        outcome: { status: 'approved', settlement: 'completed' } as never,
        validate: () => undefined
      }
    )
    expect(result).toMatchObject({
      status: 'invalid',
      settlement: 'completed',
      value: true
    })
  })
})

it('preserves a classified output rejection and its settlement without replay', async () => {
  const contract = createAiToolContract(definition())
  const value = { incomplete: true }
  const error = new AiToolContractError('output', 'Invalid receipt', {
    status: 'invalid',
    reportedStatus: 'partial',
    settlement: 'partial',
    issue: 'Invalid receipt',
    value
  })
  const execute = vi.fn(async () => value)
  const invoker = createAiInvoker({
    execute,
    middleware: [
      createAiToolMiddleware({
        resolve: () => contract,
        validate: () => undefined,
        classify: () => {
          throw error
        }
      })
    ]
  })
  await expect(invoker.invoke({ name: contract.name, input: {} })).rejects.toBe(
    error
  )
  expect(execute).toHaveBeenCalledOnce()
})

it('validates the explicit value projection of a host receipt without changing its settlement', async () => {
  const contract = createAiToolContract({
    ...definition(),
    inputSchema: true,
    outputSchema: { type: 'number' }
  })
  const receipt = {
    value: 7,
    status: 'success' as const,
    settlement: 'completed' as const
  }
  const validate = vi.fn((value, schema) =>
    schema === contract.outputSchema && typeof value !== 'number'
      ? 'Expected number'
      : undefined
  )
  const invoker = createAiInvoker({
    execute: async () => receipt,
    middleware: [
      createAiToolMiddleware({
        resolve: () => contract,
        validate,
        classify: (value) => value,
        selectValue: (value) => value.value
      })
    ]
  })
  expect(await invoker.invoke({ name: contract.name, input: {} })).toBe(receipt)
  expect(validate).toHaveBeenLastCalledWith(7, contract.outputSchema)
})

it('retains immutable domain verification metadata and rejects non-check owners', () => {
  const verification = { statusPath: '/status', progressPath: '/progress' }
  const contract = createAiToolContract({
    ...definition(),
    effect: 'read',
    verification
  })
  verification.statusPath = '/changed'
  expect(contract.verification).toEqual({
    statusPath: '/status',
    progressPath: '/progress'
  })
  expect(Object.isFrozen(contract.verification)).toBe(true)
  for (const value of [
    { statusPath: '', progressPath: '/progress' },
    { statusPath: '/bad~2', progressPath: '/progress' },
    { statusPath: '/same', progressPath: '/same' }
  ])
    expect(() =>
      createAiToolContract({
        ...definition(),
        effect: 'read',
        verification: value
      })
    ).toThrow()
  expect(() =>
    createAiToolContract({ ...definition(), verification })
  ).toThrow()
})

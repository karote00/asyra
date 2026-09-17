import { describe, expect, it, vi } from 'vitest'
import {
  AiProviderError,
  createAiAgentRuntime,
  type AiProvider,
  type AiActionBatch
} from '..'

const batch = (id: string): AiActionBatch => ({
  batchId: id,
  actions: [{ id, name: 'edit', arguments: { id }, summary: 'Edit drawing' }]
})

describe('one invocation with dependent prepared batches', () => {
  const setup = (provider: AiProvider, rollbackFails = false) => {
    const writes: string[] = []
    const history: string[][] = []
    let open = false
    const permission = vi.fn(() => 'allow' as const)
    const runtime = createAiAgentRuntime({
      provider,
      options: { retryPolicy: { maxAttempts: 3 } },
      actionDefinitions: [
        {
          name: 'edit',
          description: 'Edit',
          inputSchema: {},
          execute: async (args: { id: string }) => {
            expect(open).toBe(true)
            writes.push(args.id)
            return { status: 'complete', elementId: args.id }
          }
        }
      ],
      contextProvider: { getContext: async () => ({ ids: [...writes] }) },
      permissionPolicy: { evaluate: permission },
      confirmationHandler: { confirm: async () => true },
      transactionRunner: {
        run: async (_label, execute) => {
          expect(open).toBe(false)
          open = true
          try {
            const result = await execute()
            history.push([...writes])
            return result
          } catch (error) {
            if (rollbackFails) throw new Error('Rollback failed')
            writes.length = 0
            throw error
          } finally {
            open = false
          }
        }
      }
    })
    return { runtime, writes, history, permission, isOpen: () => open }
  }

  it('returns actual execution receipts before the next batch and commits once', async () => {
    const state = setup({
      requestActionBatch: async (_input, options) => {
        if (!options.executeBatch) throw new Error('Missing batch executor')
        const receipt = await options.executeBatch(batch('first'))
        expect(receipt.actionResults[0]?.result).toEqual({
          status: 'complete',
          elementId: 'first'
        })
        expect(receipt.context).toEqual({ ids: ['first'] })
        expect(state.isOpen()).toBe(true)
        expect(state.history).toEqual([])
        return batch('second')
      }
    })
    const result = await state.runtime.run({
      intent: 'draw then refine',
      signal: new AbortController().signal
    })
    expect(result.status).toBe('executed')
    expect(state.history).toEqual([['first', 'second']])
    expect(state.permission).toHaveBeenCalledTimes(2)
    if (result.status === 'executed')
      expect(result.actionResults).toHaveLength(2)
    expect(state.isOpen()).toBe(false)
  })

  it('rolls back earlier batches when a later provider operation fails without retry', async () => {
    let applied = false
    const request = vi.fn<AiProvider['requestActionBatch']>(
      async (_input, options) => {
        if (!options.executeBatch) throw new Error('Missing batch executor')
        await options.executeBatch(batch('first'))
        applied = true
        throw new AiProviderError({
          code: 'AI_PROVIDER_TRANSPORT_FAILED',
          message: 'Connection lost',
          retryable: true
        })
      }
    )
    const state = setup({ requestActionBatch: request })
    const result = await state.runtime.run({
      intent: 'draw then refine',
      signal: new AbortController().signal
    })
    expect(result.status).toBe('failed')
    expect(applied).toBe(true)
    expect(request).toHaveBeenCalledTimes(1)
    expect(state.writes).toEqual([])
    expect(state.history).toEqual([])
    expect(state.isOpen()).toBe(false)
  })

  it('does not claim rollback or a retryable provider failure when rollback itself fails', async () => {
    const state = setup(
      {
        requestActionBatch: async (_input, options) => {
          if (!options.executeBatch) throw new Error('Missing batch executor')
          await options.executeBatch(batch('first'))
          throw new AiProviderError({
            code: 'AI_PROVIDER_TRANSPORT_FAILED',
            message: 'Connection lost',
            retryable: true
          })
        }
      },
      true
    )
    const result = await state.runtime.run({
      intent: 'draw',
      signal: new AbortController().signal
    })
    expect(state.writes).toEqual(['first'])
    expect(result).toMatchObject({
      status: 'failed',
      stage: 'transaction',
      transaction: { status: 'unknown' }
    })
  })

  it('rejects a repeated batch rather than applying it twice', async () => {
    const state = setup({
      requestActionBatch: async (_input, options) => {
        if (!options.executeBatch) throw new Error('Missing batch executor')
        await options.executeBatch(batch('first'))
        return batch('first')
      }
    })
    const result = await state.runtime.run({
      intent: 'draw',
      signal: new AbortController().signal
    })
    expect(result.status).toBe('failed')
    expect(state.writes).toEqual([])
    expect(state.history).toEqual([])
  })
  it('rolls back all batches and closes the transaction when stopped between operations', async () => {
    const controller = new AbortController()
    let applied = false
    const state = setup({
      requestActionBatch: async (_input, options) => {
        if (!options.executeBatch) throw new Error('Missing batch executor')
        await options.executeBatch(batch('first'))
        applied = true
        controller.abort()
        return batch('second')
      }
    })
    const result = await state.runtime.run({
      intent: 'draw then refine',
      signal: controller.signal
    })
    expect(applied).toBe(true)
    expect(result.status).toBe('cancelled')
    expect(state.writes).toEqual([])
    expect(state.history).toEqual([])
    expect(state.isOpen()).toBe(false)
  })
})

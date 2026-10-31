import { expect, it } from 'vitest'
import {
  AiActionExecutionError,
  AiTransactionSettlementError,
  createAiAgentRuntime,
  type AiBatchReceipt,
  type AiMutationExecutor
} from '..'

it.each(['callback', 'cancel-committed', 'cancel-rolled-back'] as const)(
  'retains owner interruption evidence with authoritative %s settlement',
  async (mode) => {
    const controller = new AbortController()
    let receipt: AiBatchReceipt | undefined
    let writes = 0
    const runtime = createAiAgentRuntime({
      provider: {
        requestActionBatch: async (_input, options) => {
          receipt = await options.executeBatch?.({
            batchId: 'work',
            actions: [
              { id: 'draw', name: 'draw', arguments: {}, summary: 'Draw' }
            ]
          })
          return { batchId: 'report', actions: [] }
        }
      },
      actionDefinitions: [
        {
          name: 'draw',
          description: 'Draw',
          inputSchema: {},
          outputSchema: true,
          revision: 1,
          effect: 'mutation',
          resources: ['document'],
          lifecycle: {
            cancellation: 'cooperative',
            retry: 'never',
            output: 'value'
          },
          execute: async () => {
            writes++
            if (mode !== 'callback') {
              controller.abort()
            }
            throw new AiActionExecutionError('Drawing interrupted.', {
              settlement: 'partial',
              result: {
                status: 'partial',
                compositionId: 'root',
                appliedElementCount: 1
              }
            })
          }
        }
      ],
      contextProvider: { getContext: async () => ({}) },
      permissionPolicy: { evaluate: () => 'allow' },
      confirmationHandler: { confirm: async () => true },
      transactionRunner: {
        run: async (_label, execute) => {
          const mutate: AiMutationExecutor = async (work, settled) => {
            const value = work()
            settled?.(value)
            return value
          }
          try {
            return await execute(mutate)
          } catch (error) {
            throw new AiTransactionSettlementError(
              error,
              mode === 'cancel-rolled-back' ? 'rolled-back' : 'committed'
            )
          }
        }
      }
    })
    const result = await runtime.run({
      intent: 'Draw',
      signal: controller.signal
    })
    expect(writes).toBe(1)
    if (mode === 'callback') {
      expect(receipt).toMatchObject({
        actionResults: [
          {
            actionId: 'draw',
            result: { status: 'partial', appliedElementCount: 1 }
          }
        ],
        failure: { settlement: 'partial', actionId: 'draw' }
      })
    } else {
      expect(result).toMatchObject({
        status: 'cancelled',
        transaction: {
          status: mode === 'cancel-rolled-back' ? 'rolled-back' : 'committed'
        }
      })
      if (mode === 'cancel-rolled-back') {
        expect(result).not.toHaveProperty('actionResults')
      } else {
        expect(result).toMatchObject({
          actionResults: [{ result: { appliedElementCount: 1 } }]
        })
      }
    }
    await runtime.dispose()
  }
)

it('retains a returned action result when cancellation arrives at the delivery boundary', async () => {
  const controller = new AbortController()
  const runtime = createAiAgentRuntime({
    provider: {
      requestActionBatch: async () => ({
        batchId: 'draw',
        actions: [{ id: 'draw', name: 'draw', arguments: {}, summary: 'Draw' }]
      })
    },
    actionDefinitions: [
      {
        name: 'draw',
        description: 'Draw',
        inputSchema: {},
        outputSchema: true,
        revision: 1,
        effect: 'mutation',
        resources: ['document'],
        lifecycle: {
          cancellation: 'cooperative',
          retry: 'never',
          output: 'value'
        },
        execute: async () => {
          controller.abort()
          return { status: 'complete', appliedElementCount: 2 }
        }
      }
    ],
    contextProvider: { getContext: async () => ({}) },
    permissionPolicy: { evaluate: () => 'allow' },
    confirmationHandler: { confirm: async () => true },
    transactionRunner: {
      run: async (_label, execute) => {
        try {
          return await execute()
        } catch (error) {
          throw new AiTransactionSettlementError(error, 'committed')
        }
      }
    }
  })
  const result = await runtime.run({
    intent: 'Draw',
    signal: controller.signal
  })
  expect(result).toMatchObject({
    status: 'cancelled',
    transaction: { status: 'committed' },
    actionResults: [{ result: { status: 'complete', appliedElementCount: 2 } }]
  })
  await runtime.dispose()
})

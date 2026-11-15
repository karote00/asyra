import {
  createAiAgentRuntime,
  type AiActionBatch,
  type AiBatchReceipt
} from '@asyra/ai-agent-runtime'
import { createAiRuntimeInput } from '../../src/ai/runtime-input'
import { createAiPermissionPolicy } from '../../src/ai/permission'

// Script only provider decisions; admission, permissions, execution, receipts and
// cleanup belong to the actual Runtime. This fixture does not model HTTP or UI.
export function createRepeatedDetailRuntime(deniedActions: readonly string[]) {
  const requests = new Map<
    string,
    { batch: AiActionBatch; receipt?: AiBatchReceipt }
  >()
  let sequence = 0
  const input = createAiRuntimeInput({
    permissionRules: {},
    provider: {
      requestActionBatch: async (request, options) => {
        const pending = requests.get(request.intent)

        if (!pending || !options.executeBatch) {
          throw new Error('Missing Runtime batch boundary')
        }

        pending.receipt = await options.executeBatch(pending.batch)

        return {
          batchId: 'fixture-report',
          actions: [
            {
              id: 'report',
              name: 'report_outcome',
              arguments: {
                outcome: 'completed',
                message: 'Scripted batch settled.'
              },
              summary: 'Report the scripted batch'
            }
          ]
        }
      }
    }
  })

  input.permissionPolicy = createAiPermissionPolicy(
    Object.fromEntries(
      input.actionDefinitions.map(({ name }) => [
        name,
        deniedActions.includes(name) ? 'deny' : 'allow'
      ])
    )
  )
  const agent = createAiAgentRuntime(input)

  const execute = async (batch: AiActionBatch): Promise<AiBatchReceipt> => {
    const intent = `Scripted owner batch ${++sequence}`
    const pending: { batch: AiActionBatch; receipt?: AiBatchReceipt } = {
      batch
    }

    requests.set(intent, pending)
    try {
      const result = await agent.run({
        intent,
        signal: new AbortController().signal
      })

      if (!pending.receipt || result.status !== 'executed') {
        throw new Error(
          `Runtime did not settle the scripted batch: ${JSON.stringify(result)}`
        )
      }

      return pending.receipt
    } finally {
      requests.delete(intent)
    }
  }

  return {
    actions: input.actionDefinitions,
    execute,

    dispose: () => agent.dispose()
  }
}

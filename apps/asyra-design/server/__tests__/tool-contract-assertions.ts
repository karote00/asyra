import { expect } from 'vitest'
import {
  createAiToolContract,
  inspectAiToolResult
} from '@asyra/ai-agent-runtime'
import { operationInputIssue } from '../operation-input-schema'
import {
  localToolOutcome,
  type LocalToolOwner,
  type LocalToolDefinition
} from '../local-tool-invocation'

/** Exercise real owner fixtures against the exact contracts advertised to the model. */
export const withToolContractAssertions = <
  T extends LocalToolOwner & { definitions: LocalToolDefinition[] }
>(
  owner: T
): T => {
  const call = owner.call.bind(owner)
  owner.call = async (name, input, signal) => {
    const text = await call(name, input, signal)
    const value = JSON.parse(text)
    const outcome =
      owner.resultOutcome?.(name, value) ?? localToolOutcome(value)
    // Rejection fixtures deliberately bypass admission to test the owner's guards.
    if (outcome.status === 'success' || outcome.status === 'partial') {
      const definition = owner.definitions.find((tool) => tool.name === name)
      // Some owner tests exercise internal batch-only routes, not advertised native tools.
      if (!definition) return text
      const contract = createAiToolContract(definition)
      expect(
        operationInputIssue(input, contract.inputSchema),
        `${name} input`
      ).toBeUndefined()
      const inspected = inspectAiToolResult(contract, value, {
        outcome,
        validate: operationInputIssue
      })
      expect(
        inspected.status === 'invalid' ? inspected.issue : undefined,
        `${name} output`
      ).toBeUndefined()
    }
    return text
  }
  return owner
}

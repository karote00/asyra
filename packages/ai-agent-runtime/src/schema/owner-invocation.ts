import {
  createAiToolContract,
  inspectAiToolResult,
  selectAiToolResultSchema,
  AiToolContractError,
  type AiToolContractInput,
  type AiToolOutcome
} from '../tool-contract.js'
import { AiToolInputError } from '../tool-input-error.js'
import {
  operationInputIssues,
  formatOperationInputIssues,
  operationContractIssue
} from './validation.js'

/** Pin once and validate complete values before any consumer selects an external view. */
export async function invokeAiToolOwner<T>(options: {
  definition: AiToolContractInput
  input: unknown
  signal: AbortSignal
  execute: () => Promise<T>
  inspectOwner: (result: T) => { value: unknown; outcome: AiToolOutcome }
  onPhase?: (phase: 'admission' | 'execution' | 'decoding') => void
}) {
  const phase = (value: 'admission' | 'execution' | 'decoding') => {
    try {
      options.onPhase?.(value)
    } catch {
      /* Observers do not own execution. */
    }
  }

  options.signal.throwIfAborted()
  phase('admission')
  const contract = createAiToolContract(options.definition)
  const issues = operationInputIssues(options.input, contract.inputSchema)

  if (issues) {
    throw new AiToolInputError(
      formatOperationInputIssues(issues),
      'TOOL_INPUT_INVALID',
      issues
    )
  }

  phase('execution')
  const raw = await options.execute()

  phase('decoding')
  const { value, outcome } = options.inspectOwner(raw)

  options.signal.throwIfAborted()
  const inspection = inspectAiToolResult(contract, value, {
    outcome,
    validate: operationContractIssue
  })

  if (inspection.status === 'invalid') {
    throw new AiToolContractError('output', inspection.issue, inspection)
  }

  return {
    contract,
    value,
    outcome,
    outputSchema: selectAiToolResultSchema(contract, outcome.status)
  }
}

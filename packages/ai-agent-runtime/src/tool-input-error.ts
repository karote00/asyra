import { AiToolContractError } from './tool-contract.js'
/** A known rejection before canonical dispatch; never use for uncertain writes. */
export class AiToolInputError extends AiToolContractError {
  constructor(
    message: string,
    readonly code = 'TOOL_INPUT_INVALID',
    readonly inputIssues?: readonly unknown[]
  ) {
    super('input', message)
  }
}

import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import core from '../contexts'
import {
  elementApis,
  fillApis,
  strokeApis,
  selectionApis,
  hierarchyApis,
  viewportApis
} from '../common-apis'
import { basicApiContracts } from './basic-api-catalog'
import type { BasicApiOwner } from './basic-api-contracts'

type ApiOwners = Record<BasicApiOwner, object>
const owners = (): ApiOwners => ({
  core,
  element: elementApis,
  fill: fillApis,
  stroke: strokeApis,
  selection: selectionApis,
  hierarchy: hierarchyApis,
  viewport: viewportApis
})

/** Runtime already owns permission, confirmation and the invocation transaction.
 * Backend admission validates the same contract. Never execute a model-supplied
 * method path: only these closed catalogue entries can produce an executor.
 */
export const createBasicApiActions = (
  getOwners: () => ApiOwners = owners
): AiActionDefinition[] =>
  basicApiContracts.map((contract) => ({
    name: contract.name,
    description: contract.description,
    inputSchema: contract.inputSchema,
    execute: async (input, { signal }) => {
      signal.throwIfAborted()
      const args = input as Record<string, unknown>
      const owner = getOwners()[contract.owner]
      const method = (owner as Record<string, unknown>)[contract.method]
      if (typeof method !== 'function')
        throw new Error(
          `Public API unavailable: ${contract.owner}.${contract.method}`
        )
      const value: unknown = await Reflect.apply(
        method,
        owner,
        contract.parameters.map((name) => args[name])
      )
      let elementId: string | undefined
      if (typeof args.elementId === 'string') elementId = args.elementId
      else if (typeof args.parentId === 'string') elementId = args.parentId
      else if (contract.effect === 'write' && typeof value === 'string')
        elementId = value
      return {
        status:
          (contract.effect === 'write' || contract.effect === 'delete') &&
          value !== false &&
          value !== null
            ? 'complete'
            : 'no-change',
        value: value ?? null,
        ...(elementId ? { elementId } : {})
      }
    }
  }))

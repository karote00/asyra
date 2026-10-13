import { runAiMutation, type AiActionDefinition } from '@asyra/ai-agent-runtime'
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
import { toolSemantics } from './tool-contract'
import {
  describeBasicApiResult,
  basicApiResultSchema
} from './basic-api-results'
import { observeInspectionChanges } from '../common-apis/inspection-evidence'
import type { InspectionDependencyChange } from '../common-apis/inspection-dependencies'
import type { BasicApiOwner } from './basic-api-contracts'

interface MutationScopeSource {
  observe(listener: (change?: InspectionDependencyChange) => void): () => void
  resolve(id: string): 'live' | 'removed' | 'workspace'
}
const mutationScopeSource: MutationScopeSource = {
  observe: observeInspectionChanges,
  resolve: (id) => {
    if (id === core.getCurrentWorkspaceId()) return 'workspace'
    return core.getElementMetadata(id) ? 'live' : 'removed'
  }
}

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

/** Runtime owns permission, confirmation and the invocation-local mutation scope.
 * Backend admission validates the same contract. Never execute a model-supplied
 * method path: only these closed catalogue entries can produce an executor.
 */
export const createBasicApiActions = (
  getOwners: () => ApiOwners = owners,
  scopeSource: MutationScopeSource = mutationScopeSource
): AiActionDefinition[] =>
  basicApiContracts.map((contract) => ({
    ...toolSemantics(
      basicApiResultSchema(contract),
      contract.effect === 'read' ? 'read' : 'mutation',
      ['viewport', 'selection'].includes(contract.effect)
        ? [contract.effect]
        : ['document']
    ),
    revision: ['write', 'delete'].includes(contract.effect) ? 3 : 2,
    composition: 'allowed',
    name: contract.name,
    description: contract.description,
    inputSchema: contract.inputSchema,
    execute: async (input, context) => {
      context.signal.throwIfAborted()
      const args = input as Record<string, unknown>
      const owner = getOwners()[contract.owner]
      const method = (owner as Record<string, unknown>)[contract.method]
      if (typeof method !== 'function')
        throw new Error(
          `Public API unavailable: ${contract.owner}.${contract.method}`
        )
      const call = () =>
        Reflect.apply(
          method,
          owner,
          contract.parameters.map((name) => args[name])
        )
      const documentMutation = ['write', 'delete'].includes(contract.effect)
      const touched = new Set<string>()
      let complete = true
      let stop: (() => void) | undefined
      const mutate = () => {
        if (documentMutation) {
          // Start only after idle-boundary admission. Keep the listener through
          // synchronous transaction publication after this callback returns.
          stop = scopeSource.observe((change) => {
            if (!change) {
              complete = false
              return
            }
            for (const id of [
              ...change.elementIds,
              ...(change.parentIds ?? [])
            ])
              if (id) touched.add(id)
          })
        }
        return call()
      }
      let value: unknown
      try {
        value = await (contract.effect === 'read' ||
        contract.effect === 'viewport'
          ? call()
          : runAiMutation(context, mutate))
      } finally {
        stop?.()
      }
      const result = describeBasicApiResult(contract, value, args.elementIds)
      if (!documentMutation) return result
      const elementIds: string[] = [],
        removedElementIds: string[] = []
      for (const id of touched) {
        try {
          const state = scopeSource.resolve(id)
          if (state === 'live') elementIds.push(id)
          else if (state === 'removed') removedElementIds.push(id)
        } catch {
          complete = false
        }
      }
      return {
        ...result,
        mutationScope: { complete, elementIds, removedElementIds }
      }
    }
  }))

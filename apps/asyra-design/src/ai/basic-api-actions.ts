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
  basicApiResultSchema,
  basicApiDeliverySchema
} from './basic-api-results'
import { observeInspectionChanges } from '../common-apis/inspection-evidence'
import type { InspectionDependencyChange } from '../common-apis/inspection-dependencies'
import {
  retainedElementSetSchema,
  hasElementTargetSchema,
  isElementTargetSchema,
  type BasicApiContract,
  type BasicApiOwner
} from './basic-api-contracts'
import { operationInputIssue } from './tool-schema'
import type { createRetainedDesignContext } from '../common-apis/retained-design-context'

interface MutationScopeSource {
  observe(listener: (change?: InspectionDependencyChange) => void): () => void
  resolve(id: string): 'live' | 'removed' | 'workspace'
}
const mutationScopeSource: MutationScopeSource = {
  observe: observeInspectionChanges,
  resolve: (id) => {
    if (id === core.getCurrentWorkspaceId()) {
      return 'workspace'
    }
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

const basicApiToolEffect = (effect: BasicApiContract['effect']) => {
  if (effect === 'read') {
    return 'read'
  }
  if (effect === 'prepare') {
    return 'prepare'
  }
  return 'mutation'
}

const basicApiResources = (effect: BasicApiContract['effect']) => {
  if (effect === 'prepare') {
    return ['request']
  }
  if (effect === 'viewport' || effect === 'selection') {
    return [effect]
  }
  return ['document']
}

const basicApiRevision = (contract: BasicApiContract): number => {
  if (contract.result.kind === 'mutation-receipt') {
    return 9
  }
  if (
    [
      'property-mutation',
      'change-flag',
      'created-items',
      'moves',
      'removed'
    ].includes(contract.result.kind)
  ) {
    return 8
  }
  if (
    ['created-items', 'status-items'].includes(contract.result.kind) &&
    ['write', 'delete'].includes(contract.effect)
  ) {
    return 7
  }
  if (
    contract.effect === 'write' &&
    (['fill', 'stroke'].includes(contract.owner) ||
      (contract.owner === 'core' &&
        ['updateElementProperties', 'patchElementProperties'].includes(
          contract.method
        )))
  ) {
    return 7
  }
  if (
    ['grouped', 'ungrouped', 'moves', 'removed'].includes(contract.result.kind)
  ) {
    return 5
  }
  if (hasElementTargetSchema(contract.inputSchema)) {
    return 4
  }
  return ['write', 'delete'].includes(contract.effect) ? 3 : 2
}

/** Runtime owns permission, confirmation and the invocation-local mutation scope.
 * Backend admission validates the same contract. Never execute a model-supplied
 * method path: only these closed catalogue entries can produce an executor.
 */
export const createBasicApiActions = (
  getOwners: () => ApiOwners = owners,
  scopeSource: MutationScopeSource = mutationScopeSource,
  queries?: ReturnType<typeof createRetainedDesignContext>
): AiActionDefinition[] =>
  basicApiContracts.map((contract) => ({
    ...toolSemantics(
      basicApiResultSchema(contract),
      basicApiToolEffect(contract.effect),
      basicApiResources(contract.effect)
    ),
    partialOutputSchema: basicApiResultSchema(contract, true),
    ...(basicApiDeliverySchema(contract)
      ? {
          delivery: {
            path: '/modelResult',
            outputSchema: basicApiDeliverySchema(contract),
            receipt: { path: '/retained', owner: 'design-context' }
          }
        }
      : {}),
    revision: basicApiRevision(contract),
    composition: 'allowed',
    name: contract.name,
    description: contract.description,
    inputSchema: contract.inputSchema,
    execute: async (input, context) => {
      context.signal.throwIfAborted()
      const args = input as Record<string, unknown>
      const owner = getOwners()[contract.owner]
      const method = (owner as Record<string, unknown>)[contract.method]
      if (typeof method !== 'function') {
        throw new Error(
          `Public API unavailable: ${contract.owner}.${contract.method}`
        )
      }
      let resolvedArgs = args
      const resolve = (value: unknown, schema: unknown): unknown => {
        if (!schema || typeof schema !== 'object') {
          return value
        }
        const shape = schema as Record<string, unknown>
        if (
          isElementTargetSchema(schema) &&
          value !== undefined &&
          !Array.isArray(value)
        ) {
          const issue = operationInputIssue(value, retainedElementSetSchema)
          if (issue) {
            throw new Error(issue)
          }
          if (!queries) {
            throw new Error('Retained targets unavailable.')
          }
          const reference = value as {
            snapshotId: string
            leaseId: string
            total: number
          }
          const snapshot = queries.get(
            reference.snapshotId,
            reference.leaseId,
            context.signal
          )
          if (
            snapshot.result.missingIds.length ||
            reference.total !== snapshot.orderedIds.length
          ) {
            throw new Error(
              'Retained targets are incomplete or have a different count.'
            )
          }
          return [...snapshot.orderedIds]
        }
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          shape.properties
        ) {
          const properties = shape.properties as Record<string, unknown>
          const entries = Object.entries(value).map(
            ([key, child]) => [key, resolve(child, properties[key])] as const
          )
          return entries.every(
            ([key, child]) => child === (value as Record<string, unknown>)[key]
          )
            ? value
            : Object.fromEntries(entries)
        }
        return value
      }
      const call = () => {
        // Resolve in the admitted callback, never before the idle-boundary wait.
        resolvedArgs = resolve(args, contract.inputSchema) as Record<
          string,
          unknown
        >
        return Reflect.apply(
          method,
          owner,
          contract.parameters.map((name) => resolvedArgs[name])
        )
      }
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
            ]) {
              if (id) {
                touched.add(id)
              }
            }
          })
        }
        return call()
      }
      const finish = (value: unknown, atSettlement: boolean) => {
        const result = describeBasicApiResult(
          contract,
          value,
          resolvedArgs[contract.parameters[0]]
        )
        if (!documentMutation) {
          return result
        }
        const elementIds: string[] = [],
          removedElementIds: string[] = []
        for (const id of touched) {
          try {
            const state = scopeSource.resolve(id)
            if (state === 'live') {
              elementIds.push(id)
            } else if (state === 'removed') {
              removedElementIds.push(id)
            }
          } catch {
            complete = false
          }
        }
        const receipt = {
          ...result,
          ...(atSettlement &&
          'code' in result &&
          result.code === 'OWNER_RESULT_INVALID'
            ? { settlement: 'completed' }
            : {}),
          mutationScope: { complete, elementIds, removedElementIds }
        }
        const kind = contract.result.kind
        if (
          !['grouped', 'ungrouped', 'moves', 'removed'].includes(kind) ||
          !['complete', 'no-change'].includes(result.status)
        ) {
          return receipt
        }
        const structural = value as Record<string, unknown>
        let count = 0
        if (kind === 'removed' && Array.isArray(structural.removed)) {
          count = structural.removed.length
        } else if (Array.isArray(structural.elementIds)) {
          count = structural.elementIds.length
        } else if (Array.isArray(structural.moves)) {
          count = structural.moves.length
        }
        const summary = {
          status: receipt.status,
          value: {
            count,
            ...(typeof structural.groupId === 'string'
              ? { groupId: structural.groupId }
              : {}),
            ...(typeof structural.removed === 'boolean'
              ? { removed: structural.removed }
              : {})
          },
          mutationScope: {
            complete,
            elementCount: elementIds.length,
            removedElementCount: removedElementIds.length
          }
        }
        try {
          if (!atSettlement) {
            throw new Error(
              'The mutation executor did not report synchronous settlement.'
            )
          }
          if (!queries) {
            throw new Error('Retained structural delivery is unavailable.')
          }
          let ids: string[] = []
          if (kind === 'grouped' || kind === 'ungrouped') {
            ids = structural.elementIds as string[]
          }
          if (kind === 'moves') {
            ids = (structural.moves as { elementId: string }[]).map(
              (item) => item.elementId
            )
          }
          const retained = queries.retainReceipt(ids, receipt, context.signal)
          return { ...receipt, retained, modelResult: { ...summary, retained } }
        } catch (error) {
          const delivery = {
            status: 'unavailable',
            message: `${error instanceof Error ? error.message : 'Structural delivery failed.'} The mutation already settled; do not replay it.`
          }
          return { ...receipt, delivery, modelResult: { ...summary, delivery } }
        }
      }
      let settledResult: ReturnType<typeof finish> | undefined
      try {
        const value = await (contract.effect === 'read' ||
        contract.effect === 'prepare' ||
        contract.effect === 'viewport'
          ? call()
          : runAiMutation(context, mutate, (value) => {
              stop?.()
              stop = undefined
              settledResult = finish(value, true)
            }))
        return settledResult ?? finish(value, false)
      } finally {
        stop?.()
      }
    }
  }))

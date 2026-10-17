import { designActionOutcome } from '../src/ai/tool-contract'
import type { AiJsonValue } from '@asyra/ai-agent-runtime'
import type {
  AiActionDescription,
  AiActionBatch,
  AiBatchReceipt
} from '../src/ai/action-batch-protocol'
import { AiActionNames } from '../src/constants/ai-actions'
import {
  localToolReferences,
  type LocalToolOwnership
} from './local-tool-leases'
import { getBasicApiContract } from '../src/ai/basic-api-catalog'

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/** Ownership bridge only: the browser remains the query, revision and data owner. */
export const createLocalQueryArtifacts = (options: {
  actions?: readonly AiActionDescription[]
  ownership: LocalToolOwnership
  release: (snapshotId: string) => Promise<void>
}) => {
  const receiptFields = new Map<string, { receipt: string; view: string }>()
  for (const action of options.actions ?? []) {
    if (
      !('delivery' in action) ||
      action.delivery?.receipt?.owner !== 'design-context'
    )
      continue
    // This adapter owns the declared top-level retained receipt shape.
    const path = action.delivery.receipt.path
    if (!/^\/[^/]+$/.test(path))
      throw new Error('Query receipt must name one top-level field')
    if (!/^\/[^/]+$/.test(action.delivery.path))
      throw new Error('Query delivery must name one top-level field')
    const decode = (value: string) =>
      value.slice(1).replace(/~1/g, '/').replace(/~0/g, '~')
    receiptFields.set(action.name, {
      receipt: decode(path),
      view: decode(action.delivery.path)
    })
  }
  const snapshots = new Map<string, Set<string>>()
  return {
    admit(batch: AiActionBatch) {
      for (const action of batch.actions) {
        const contract = getBasicApiContract(action.name)
        if (contract)
          for (const handle of localToolReferences(
            action.arguments,
            contract.inputSchema
          ))
            options.ownership.assertOwned(handle)
        if (
          ![
            AiActionNames.READ_DESIGN_CONTEXT,
            AiActionNames.RELEASE_DESIGN_CONTEXT
          ].includes(action.name as never) ||
          !record(action.arguments)
        )
          continue
        const query = action.arguments
        if (
          (action.name === AiActionNames.READ_DESIGN_CONTEXT &&
            query.scope !== 'snapshot') ||
          typeof query.snapshotId !== 'string'
        )
          continue
        options.ownership.assertOwned(query.snapshotId)
        if (action.name === AiActionNames.RELEASE_DESIGN_CONTEXT)
          options.ownership.assertRelease(query.snapshotId)
      }
    },
    async accept(batch: AiActionBatch, receipt: AiBatchReceipt) {
      const deliveryFailures = new Map<
        string,
        AiBatchReceipt['actionResults'][number]['result']
      >()
      const submitted = new Map(
        batch.actions.map((action) => [action.id, action])
      )
      for (const entry of receipt.actionResults) {
        const action = submitted.get(entry.actionId)
        const fields = action && receiptFields.get(action.name)
        const receiptField = fields?.receipt
        const structural = receiptField !== undefined
        if (
          !action ||
          (!structural &&
            ![
              AiActionNames.READ_DESIGN_CONTEXT,
              AiActionNames.RELEASE_DESIGN_CONTEXT
            ].includes(action.name as never)) ||
          entry.actionName !== action.name ||
          !record(action.arguments) ||
          !record(entry.result)
        )
          continue
        const original = entry.result
        const result = receiptField ? original[receiptField] : original
        if (!record(result)) continue
        try {
          if (
            action.name === AiActionNames.RELEASE_DESIGN_CONTEXT &&
            typeof result.released === 'boolean'
          ) {
            const id = action.arguments.snapshotId
            if (typeof id === 'string') {
              if (result.snapshotId !== id)
                throw new Error('Query release receipt identity mismatch')
              options.ownership.retire(id)
              snapshots.delete(id)
            }
            continue
          }
          if (
            typeof result.snapshotId !== 'string' ||
            typeof result.leaseId !== 'string'
          )
            continue
          const id = result.snapshotId
          let aliases = snapshots.get(id)
          const fresh = !aliases
          if (aliases) options.ownership.borrow(id)
          else {
            aliases = new Set()
            snapshots.set(id, aliases)
            try {
              options.ownership.publish(
                id,
                async () => {
                  await options.release(id)
                  snapshots.delete(id)
                },
                () => {
                  if (!snapshots.has(id))
                    throw new Error('Query reference has been released')
                }
              )
            } catch (error) {
              snapshots.delete(id)
              try {
                await options.release(id)
              } catch (cleanup) {
                throw new AggregateError(
                  [error, cleanup],
                  'Query publication and browser cleanup failed'
                )
              }
              throw error
            }
          }
          if (!aliases.has(result.leaseId)) {
            try {
              options.ownership.publishAliases([
                { handle: result.leaseId, ownerHandle: id }
              ])
              aliases.add(result.leaseId)
            } catch (error) {
              // An existing shared query belongs to its original consumers.
              if (fresh) {
                try {
                  await options.release(id)
                  options.ownership.retire(id)
                  snapshots.delete(id)
                } catch (cleanup) {
                  throw new AggregateError(
                    [error, cleanup],
                    'Query alias publication and cleanup failed'
                  )
                }
              }
              throw error
            }
          }
        } catch (error) {
          if (!receiptField) throw error
          const { [receiptField]: _retained, ...receipt } = original
          const failedDelivery: Record<string, AiJsonValue> = {
            ...(receipt as Record<string, AiJsonValue>),
            delivery: {
              status: 'unavailable',
              message: `${error instanceof Error ? error.message : 'Host publication failed.'} The acknowledged mutation must not be replayed.`
            }
          }
          if (fields && record(failedDelivery[fields.view])) {
            const { [fields.receipt]: _summaryReference, ...summary } =
              failedDelivery[fields.view] as Record<string, AiJsonValue>
            failedDelivery[fields.view] = {
              ...summary,
              delivery: failedDelivery.delivery
            }
          }
          deliveryFailures.set(entry.actionId, {
            ...failedDelivery,
            toolOutcome: designActionOutcome(
              failedDelivery
            ) as unknown as AiJsonValue
          })
        }
      }
      return deliveryFailures.size
        ? {
            ...receipt,
            actionResults: receipt.actionResults.map((entry) =>
              deliveryFailures.has(entry.actionId)
                ? {
                    ...entry,
                    result: deliveryFailures.get(entry.actionId) ?? entry.result
                  }
                : entry
            )
          }
        : receipt
    }
  }
}

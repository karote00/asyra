import type {
  AiActionBatch,
  AiBatchReceipt
} from '../src/ai/action-batch-protocol'
import { AiActionNames } from '../src/constants/ai-actions'
import type { LocalToolOwnership } from './local-tool-leases'

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

/** Ownership bridge only: the browser remains the query, revision and data owner. */
export const createLocalQueryArtifacts = (options: {
  ownership: LocalToolOwnership
  release: (snapshotId: string) => Promise<void>
}) => {
  const snapshots = new Map<string, Set<string>>()
  return {
    admit(batch: AiActionBatch) {
      for (const action of batch.actions) {
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
      const submitted = new Map(
        batch.actions.map((action) => [action.id, action])
      )
      for (const entry of receipt.actionResults) {
        const action = submitted.get(entry.actionId)
        if (
          !action ||
          ![
            AiActionNames.READ_DESIGN_CONTEXT,
            AiActionNames.RELEASE_DESIGN_CONTEXT
          ].includes(action.name as never) ||
          entry.actionName !== action.name ||
          !record(action.arguments) ||
          !record(entry.result)
        )
          continue
        const result = entry.result
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
      }
    }
  }
}

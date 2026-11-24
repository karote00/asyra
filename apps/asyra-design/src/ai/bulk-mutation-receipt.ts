import type { AiActionDefinition } from '@asyra/ai-agent-runtime'
import { isRecord } from '@asyra/utils'
import { receiptPageLength } from '../common-apis/design-context-fields'
import type { createRetainedDesignContext } from '../common-apis/retained-design-context'
import { retainedElementSetSchema } from './basic-api-contracts'
import {
  actionToolSemantics,
  toolResultCount,
  toolResultObject,
  toolResultStatus,
  toolResultString
} from './tool-contract'

type RetainReceipt = ReturnType<
  typeof createRetainedDesignContext
>['retainReceipt']

export function fitsReceiptPage(receipt: unknown, itemCount: number) {
  // Above one page even the JSON array punctuation exceeds the page length.
  return (
    itemCount < receiptPageLength &&
    JSON.stringify(receipt).length <= receiptPageLength
  )
}

export function retainBulkReceipt<R extends object, S extends object>(
  receipt: R,
  summary: S,
  ids: readonly string[],
  signal: AbortSignal,
  retain?: RetainReceipt
) {
  try {
    if (!retain) {
      throw Error('Document receipt storage is unavailable at settlement.')
    }

    const retained = retain([...new Set(ids)], receipt, signal)

    return { ...receipt, retained, modelResult: { ...summary, retained } }
  } catch (error) {
    const delivery = {
      status: 'unavailable',
      message:
        (error instanceof Error
          ? error.message
          : 'Document receipt storage failed.') +
        ' Do not replay the acknowledged mutation.'
    }

    return { ...receipt, delivery, modelResult: { ...summary, delivery } }
  }
}

/** Keep full execution values available for bindings, and page bulky mutation receipts through the document owner. */
export function publishBulkMutationReceipt<T>(
  action: AiActionDefinition<T>,
  retain?: RetainReceipt
): AiActionDefinition<T> {
  const raw = action.outputSchema

  if (
    !isRecord(raw) ||
    !isRecord(raw.properties) ||
    !Array.isArray(raw.required)
  ) {
    throw Error('Missing bulk mutation result contract')
  }

  const full = {
    ...raw,
    properties: {
      ...raw.properties,
      action: toolResultString,
      settlement: { enum: ['completed', 'partial', 'not-started', 'unknown'] },
      message: toolResultString
    }
  }
  const unavailable = toolResultObject({
    status: { const: 'unavailable' },
    message: toolResultString
  })
  const compact = toolResultObject(
    {
      action: toolResultString,
      status: toolResultStatus,
      compositionId: toolResultString,
      changed: { type: 'boolean' },
      unavailableCount: toolResultCount,
      firstUnavailableId: toolResultString,
      materialProvenance: toolResultObject({
        status: { enum: ['available', 'unavailable'] },
        unavailableCount: toolResultCount
      }),
      settlement: { enum: ['completed', 'partial', 'not-started', 'unknown'] },
      message: toolResultString,
      appliedCount: toolResultCount,
      skippedCount: toolResultCount,
      firstSkipped: { type: 'object' },
      retained: retainedElementSetSchema,
      delivery: unavailable
    },
    ['action', 'status', 'appliedCount']
  )
  const view = {
    anyOf: [
      full,
      {
        ...compact,
        anyOf: [{ required: ['retained'] }, { required: ['delivery'] }]
      }
    ]
  }

  return {
    ...action,
    ...actionToolSemantics(action.name, {
      ...full,
      required: [...raw.required, 'modelResult'],
      properties: {
        ...full.properties,
        modelResult: view,
        retained: retainedElementSetSchema,
        delivery: unavailable
      }
    }),
    revision: action.revision + 1,
    delivery: {
      path: '/modelResult',
      outputSchema: view,
      receipt: { owner: 'design-context', path: '/retained' }
    },

    async execute(input, context) {
      const receipt = await action.execute(input, context)

      // Return invalid owner values to the ordinary contract validator without retaining them.
      if (!isRecord(receipt) || !Array.isArray(receipt.appliedElementIds)) {
        return receipt
      }

      const ids = receipt.appliedElementIds

      if (fitsReceiptPage(receipt, ids.length)) {
        return { ...receipt, modelResult: receipt }
      }

      const skipped = receipt.skipped
      const unavailableIds = receipt.unavailableIds
      const provenance = receipt.materialProvenance
      const summary = {
        action: action.name,
        status: receipt.status,
        appliedCount: ids.length,
        ...(typeof receipt.compositionId === 'string'
          ? { compositionId: receipt.compositionId }
          : {}),
        ...(typeof receipt.changed === 'boolean'
          ? { changed: receipt.changed }
          : {}),
        ...(receipt.settlement ? { settlement: receipt.settlement } : {}),
        ...(receipt.message ? { message: receipt.message } : {}),
        ...(Array.isArray(skipped)
          ? {
              skippedCount: skipped.length,
              ...(skipped.length ? { firstSkipped: skipped[0] } : {})
            }
          : {}),
        ...(Array.isArray(unavailableIds)
          ? {
              unavailableCount: unavailableIds.length,
              ...(unavailableIds.length
                ? { firstUnavailableId: unavailableIds[0] }
                : {})
            }
          : {}),
        ...(isRecord(provenance) &&
        Array.isArray(provenance.unavailableElementIds)
          ? {
              materialProvenance: {
                status: provenance.status,
                unavailableCount: provenance.unavailableElementIds.length
              }
            }
          : {})
      }

      return retainBulkReceipt(receipt, summary, ids, context.signal, retain)
    }
  }
}

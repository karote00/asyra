import {
  toolResultObject,
  toolMutationScope,
  toolResultStatus,
  toolDocumentReference,
  toolDocumentReferences
} from './tool-contract'
import type { BasicApiContract } from './basic-api-contracts'

/** Interpret only declared owner return contracts. Never reread the document or invent before/after data. */
export const describeBasicApiResult = (
  contract: BasicApiContract,
  value: unknown,
  targetElementIds?: unknown
) => {
  const kind = contract.result.kind
  const raw = { value: value ?? null }
  if (kind === 'transient')
    return {
      ...raw,
      status: 'no-change',
      execution: 'complete',
      application: 'transient'
    }
  if (kind === 'value')
    return {
      ...raw,
      status: 'no-change',
      execution: 'complete',
      application: 'read-only'
    }
  if (kind === 'created-items') {
    if (!Array.isArray(value))
      return {
        ...raw,
        status: 'failed',
        message: 'The creation owner returned no identity list.'
      }
    const items = value.map((item: unknown, index: number) => ({
      index,
      status:
        typeof item === 'string' && item.length > 0 ? 'complete' : 'failed',
      value: item
    }))
    const appliedElementIds = value.filter(
      (item: unknown): item is string =>
        typeof item === 'string' && item.length > 0
    )
    const failed = items.filter((item) => item.status === 'failed').length
    let status = 'complete'
    if (value.length === 0) status = 'no-change'
    else if (failed === value.length) status = 'failed'
    else if (failed > 0) status = 'partial'
    return {
      ...raw,
      items,
      appliedElementIds,
      status,
      ...(failed
        ? {
            message: `${failed} creation items returned no usable identity; successful IDs are retained in input order.`
          }
        : {})
    }
  }
  if (kind === 'status-items') {
    if (
      !Array.isArray(value) ||
      value.some(
        (item) => !['changed', 'unchanged', 'unavailable'].includes(item)
      ) ||
      !Array.isArray(targetElementIds) ||
      targetElementIds.length !== value.length ||
      targetElementIds.some((id) => typeof id !== 'string' || id.length === 0)
    )
      return {
        ...raw,
        status: 'failed',
        message:
          'The owner returned invalid target statuses or target alignment.'
      }
    const unavailable = value.filter((item) => item === 'unavailable').length
    const changed = value.filter((item) => item === 'changed').length
    let status = changed ? 'complete' : 'no-change'
    if (unavailable)
      status = unavailable === value.length ? 'failed' : 'partial'
    return {
      ...raw,
      status,
      ...(unavailable
        ? {
            message: `${unavailable} targets were unavailable; see ordered target statuses.`
          }
        : {})
    }
  }
  if (kind === 'boolean-items') {
    if (
      !Array.isArray(value) ||
      value.some((item) => typeof item !== 'boolean')
    )
      return {
        ...raw,
        status: 'failed',
        message: 'The owner returned an invalid per-item application receipt.'
      }
    const items = value.map((applied: boolean, index: number) => ({
      index,
      status: applied ? 'complete' : 'no-change',
      value: applied,
      ...(!applied ? { reason: 'unchanged-or-unavailable' } : {})
    }))
    return {
      ...raw,
      items,
      status: value.some(Boolean) ? 'complete' : 'no-change',
      ...(value.includes(false)
        ? {
            message:
              'Some items reported no application: unchanged values and unavailable targets are not distinguished by this owner. Check those items before claiming the requested state.'
          }
        : {})
    }
  }
  if (kind === 'moves' || kind === 'removed') {
    const entries =
      value && typeof value === 'object'
        ? (value as Record<string, unknown>)[kind]
        : undefined
    if (!Array.isArray(entries))
      return {
        ...raw,
        status: 'failed',
        message: 'The owner returned no structural change receipt.'
      }
    return { ...raw, status: entries.length ? 'complete' : 'no-change' }
  }
  const reported = value !== false && value !== null
  let application = 'not-confirmed'
  if (value === undefined) application = 'not-reported'
  else if (reported) application = 'owner-result'
  return {
    ...raw,
    status: reported ? 'complete' : 'no-change',
    application,
    ...(!reported
      ? {
          message:
            'The owner reported no application. The target may be unchanged or unavailable; this receipt does not distinguish them.'
        }
      : {})
  }
}

/** The value column is intentionally opaque only for polymorphic public getters. */
export const basicApiResultSchema = (contract: BasicApiContract) => {
  const kind = contract.result.kind
  let valueSchema: unknown = true
  if (kind === 'created-items')
    valueSchema = {
      type: 'array',
      items: { anyOf: [toolDocumentReference, { type: 'null' }] }
    }
  else if (kind === 'boolean-items')
    valueSchema = { type: 'array', items: { type: 'boolean' } }
  else if (kind === 'status-items')
    valueSchema = {
      type: 'array',
      items: { enum: ['changed', 'unchanged', 'unavailable'] }
    }
  else if (kind === 'moves' || kind === 'removed')
    valueSchema = toolResultObject({ [kind]: { type: 'array' } })
  const fields: Record<string, unknown> = {
    status: toolResultStatus,
    value: valueSchema
  }
  if (['write', 'delete'].includes(contract.effect))
    fields.mutationScope = toolMutationScope
  if (kind === 'created-items')
    fields.appliedElementIds = toolDocumentReferences
  if (kind === 'created-items' || kind === 'boolean-items')
    fields.items = {
      type: 'array',
      items: toolResultObject({
        index: { type: 'integer', minimum: 0 },
        status: toolResultStatus,
        value:
          kind === 'created-items'
            ? { anyOf: [toolDocumentReference, { type: 'null' }] }
            : { type: 'boolean' }
      })
    }
  if (kind === 'transient' || kind === 'value') {
    fields.execution = { const: 'complete' }
    fields.application = { const: kind === 'value' ? 'read-only' : 'transient' }
  }
  return toolResultObject(fields)
}

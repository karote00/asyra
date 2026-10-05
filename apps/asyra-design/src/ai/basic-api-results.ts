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
    // Confirmed identity is review scope, not proof that a value changed or looks correct.
    const reviewElementIds = [
      ...new Set(
        targetElementIds.filter((_, index) => value[index] !== 'unavailable')
      )
    ]
    const unavailable = value.filter((item) => item === 'unavailable').length
    const changed = value.filter((item) => item === 'changed').length
    let status = changed ? 'complete' : 'no-change'
    if (unavailable)
      status = unavailable === value.length ? 'failed' : 'partial'
    return {
      ...raw,
      status,
      reviewElementIds,
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

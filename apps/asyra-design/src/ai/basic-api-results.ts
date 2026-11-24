import { AiToolContractError } from '@asyra/ai-agent-runtime'
import {
  toolResultObject,
  toolMutationScope,
  toolResultStatus,
  toolDocumentReference,
  toolDocumentReferences
} from './tool-contract'
import {
  retainedElementSetSchema,
  type BasicApiContract
} from './basic-api-contracts'

/** One interpretation for direct APIs and their composed consumers. */
export const describeMutationReceipt = (
  value: unknown,
  targets: readonly string[] | undefined
) => {
  const expected = new Set(targets)
  const raw = { value: value ?? null }
  const receipt = value as Record<string, unknown> | null
  const acceptedIds = receipt?.acceptedIds
  const unavailableIds = receipt?.unavailableIds

  const ids = (items: unknown): items is string[] =>
    Array.isArray(items) &&
    items.every((id) => typeof id === 'string' && id.length > 0) &&
    new Set(items).size === items.length

  if (
    !targets ||
    !receipt ||
    Array.isArray(receipt) ||
    !Object.prototype.hasOwnProperty.call(receipt, 'value') ||
    !ids(acceptedIds) ||
    !ids(unavailableIds) ||
    typeof receipt.changed !== 'boolean' ||
    (receipt.changed && !acceptedIds.length) ||
    targets.some((id) => typeof id !== 'string' || !id) ||
    new Set([...acceptedIds, ...unavailableIds]).size !==
      acceptedIds.length + unavailableIds.length ||
    acceptedIds.length + unavailableIds.length !== expected.size ||
    [...acceptedIds, ...unavailableIds].some((id) => !expected.has(id))
  ) {
    return {
      ...raw,
      status: 'failed',
      code: 'OWNER_RESULT_INVALID',
      message:
        'The owner returned an invalid mutation receipt. Preserve settled evidence; do not replay the operation.'
    }
  }

  const { changed } = receipt
  let status = changed ? 'complete' : 'no-change'

  if (unavailableIds.length) {
    status = acceptedIds.length ? 'partial' : 'failed'
  }

  let settlement = 'completed'

  if (unavailableIds.length) {
    settlement = changed ? 'partial' : 'not-started'
  }

  return {
    value: receipt.value,
    acceptedIds,
    unavailableIds,
    changed,
    status,
    settlement,
    ...(unavailableIds.length
      ? {
          message:
            'Some requested targets were unavailable; preserve accepted targets without replay.'
        }
      : {})
  }
}

export const requireMutationReceipt = (
  value: unknown,
  targets: readonly string[]
) => {
  const result = describeMutationReceipt(value, targets)

  if ('code' in result) {
    throw new AiToolContractError(
      'output',
      'The owner receipt does not cover the requested targets. Preserve settled evidence; do not replay the operation.',
      {
        status: 'invalid',
        reportedStatus: 'unknown',
        settlement: 'completed',
        issue: 'Invalid canonical mutation receipt',
        value
      }
    )
  }

  return result
}

const receiptTargets = (
  contract: BasicApiContract,
  args: Readonly<Record<string, unknown>>,
  value: unknown
): readonly string[] | undefined => {
  const target = contract.result.targets

  if (!target) {
    return undefined
  }

  const input = args[target.parameter]
  let ids: unknown

  if (target.kind === 'created-id') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined
    }

    const created = Reflect.get(value, 'value')
    const changed = Reflect.get(value, 'changed')

    if (typeof created === 'string' && created && changed === true) {
      return [created]
    }

    if (
      created !== null ||
      changed !== false ||
      !Array.isArray(Reflect.get(value, 'acceptedIds')) ||
      Reflect.get(value, 'acceptedIds').length !== 0
    ) {
      return undefined
    }

    ids = [input]
  } else if (target.kind === 'id') {
    ids = [input]
  } else if (target.kind === 'keys') {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return undefined
    }

    ids = Object.keys(input)
  } else if (target.kind === 'records') {
    if (!Array.isArray(input)) {
      return undefined
    }

    ids = input.map((item: unknown) =>
      target.identityPath.reduce<unknown>(
        (entry, key) =>
          entry && typeof entry === 'object'
            ? Reflect.get(entry, key)
            : undefined,
        item
      )
    )
  } else {
    ids = input
  }

  if (
    !Array.isArray(ids) ||
    !ids.every((id): id is string => typeof id === 'string' && id.length > 0)
  ) {
    return undefined
  }

  if ('excludeParameter' in target && target.excludeParameter) {
    const sourceId = args[target.excludeParameter]

    return ids.filter((id) => id !== sourceId)
  }

  return ids
}

// JavaScript read owners may explicitly contain optional undefined properties.
// JSON object omission preserves absence; array slots and non-JSON values remain
// invalid and are never converted to fabricated nulls or string values.
const readJsonValue = (
  value: unknown,
  ancestors = new Set<object>()
): unknown => {
  if (!value || typeof value !== 'object') {
    return value
  }

  const prototype = Object.getPrototypeOf(value)

  if (
    !Array.isArray(value) &&
    prototype !== Object.prototype &&
    prototype !== null
  ) {
    return value
  }

  if (ancestors.has(value)) {
    throw new TypeError('Read value must not contain cycles')
  }

  ancestors.add(value)
  try {
    return Array.isArray(value)
      ? value.map((item) => readJsonValue(item, ancestors))
      : Object.fromEntries(
          Object.entries(value)
            .filter(([, item]) => item !== undefined)
            .map(([key, item]) => [key, readJsonValue(item, ancestors)])
        )
  } finally {
    ancestors.delete(value)
  }
}

/** Interpret only declared owner return contracts. Never reread the document or invent before/after data. */
export const describeBasicApiResult = (
  contract: BasicApiContract,
  value: unknown,
  targetElementIds?: unknown,
  args: Readonly<Record<string, unknown>> = {}
) => {
  const kind = contract.result.kind
  const projected =
    contract.result.valueFields && value !== null && typeof value === 'object'
      ? Object.fromEntries(
          contract.result.valueFields
            .filter((field) => field in value)
            .map((field) => [field, Reflect.get(value, field)])
        )
      : value
  const raw = {
    value:
      (contract.effect === 'read' ? readJsonValue(projected) : projected) ??
      null
  }

  if (kind === 'allocated-ids') {
    if (
      !Array.isArray(value) ||
      !Array.isArray(targetElementIds) ||
      value.length !== targetElementIds.length ||
      value.some((id) => typeof id !== 'string' || !id) ||
      new Set(value).size !== value.length
    ) {
      throw new Error(
        'Invalid allocated identity receipt; retain known IDs and do not infer document creation.'
      )
    }

    return {
      ...raw,
      status: 'no-change',
      execution: 'complete',
      application: 'prepared'
    }
  }

  if (kind === 'mutation-receipt') {
    const targets = receiptTargets(contract, args, value)

    // A missing declaration/input cannot certify any owner identities.
    return describeMutationReceipt(value, targets)
  }

  if (kind === 'property-mutation' || kind === 'change-flag') {
    const invalid = () => ({
      ...raw,
      status: 'failed',
      code: 'OWNER_RESULT_INVALID',
      message:
        'The owner result does not match its declared contract. Preserve the original value and settled mutation evidence; inspect current state without replaying this operation.'
    })

    if (kind === 'change-flag') {
      return typeof value === 'boolean'
        ? { ...raw, status: value ? 'complete' : 'no-change' }
        : invalid()
    }

    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      !Array.isArray(targetElementIds) ||
      !contract.result.identityPath
    ) {
      return invalid()
    }

    const result = value as { acceptedIds?: unknown; changed?: unknown }
    const expected = [
      ...new Set(
        targetElementIds.map((target: unknown) =>
          contract.result.identityPath?.reduce<unknown>(
            (item, key) =>
              item && typeof item === 'object'
                ? (item as Record<string, unknown>)[key]
                : undefined,
            target
          )
        )
      )
    ]

    if (
      expected.some((id) => typeof id !== 'string' || !id) ||
      !Array.isArray(result.acceptedIds) ||
      result.acceptedIds.length !== expected.length ||
      result.acceptedIds.some((id, index) => id !== expected[index]) ||
      typeof result.changed !== 'boolean' ||
      (!expected.length && result.changed)
    ) {
      return invalid()
    }

    return { ...raw, status: result.changed ? 'complete' : 'no-change' }
  }

  if (kind === 'transient') {
    return {
      ...raw,
      status: 'no-change',
      execution: 'complete',
      application: 'transient'
    }
  }

  if (kind === 'value') {
    return {
      ...raw,
      status: 'no-change',
      execution: 'complete',
      application: 'read-only'
    }
  }

  if (kind === 'created-items') {
    if (!Array.isArray(value)) {
      return {
        ...raw,
        status: 'failed',
        code: 'OWNER_RESULT_INVALID',
        items: [],
        appliedElementIds: [],
        message:
          'The creation owner returned no identity list. Preserve settled evidence; do not replay creation.'
      }
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

    if (value.length === 0) {
      status = 'no-change'
    } else if (failed === value.length) {
      status = 'failed'
    } else if (failed > 0) {
      status = 'partial'
    }

    const aligned =
      Array.isArray(targetElementIds) &&
      targetElementIds.length === value.length

    if (!aligned) {
      status = 'failed'
    }

    let message: string | undefined

    if (failed) {
      message = `${failed} creation items returned no usable identity; successful IDs are retained in input order.`
    }

    if (!aligned) {
      message =
        'Creation results are not aligned with the input count. Preserve returned IDs and inspect acknowledged state; do not replay creation.'
    }

    return {
      ...raw,
      items,
      appliedElementIds,
      status,
      ...(!aligned ? { code: 'OWNER_RESULT_INVALID' } : {}),
      ...(message ? { message } : {})
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
      targetElementIds.some((item) => {
        const id = typeof item === 'string' ? item : item?.elementId

        return typeof id !== 'string' || id.length === 0
      })
    ) {
      return {
        ...raw,
        status: 'failed',
        message:
          'The owner returned invalid target statuses or target alignment.'
      }
    }

    const unavailable = value.filter((item) => item === 'unavailable').length
    const changed = value.filter((item) => item === 'changed').length
    let status = changed ? 'complete' : 'no-change'

    if (unavailable) {
      status = unavailable === value.length ? 'failed' : 'partial'
    }

    let settlement = 'completed'

    if (unavailable) {
      settlement = changed ? 'partial' : 'not-started'
    }

    return {
      ...raw,
      status,
      settlement,
      ...(unavailable
        ? {
            message: `${unavailable} targets were unavailable; see ordered target statuses.`
          }
        : {})
    }
  }

  if (kind === 'grouped' || kind === 'ungrouped') {
    const item = value as Record<string, unknown> | null
    const valid =
      item &&
      typeof item.groupId === 'string' &&
      item.groupId.length > 0 &&
      Array.isArray(item.elementIds) &&
      item.elementIds.every((id) => typeof id === 'string' && id.length > 0) &&
      new Set(item.elementIds).size === item.elementIds.length &&
      (kind === 'grouped' || item.removed === true)

    return { ...raw, status: valid ? 'complete' : 'failed' }
  }

  if (kind === 'moves' || kind === 'removed') {
    const entries =
      value && typeof value === 'object'
        ? (value as Record<string, unknown>)[kind]
        : undefined

    if (!Array.isArray(entries)) {
      return {
        ...raw,
        status: 'failed',
        code: 'OWNER_RESULT_INVALID',
        message:
          'The owner returned no structural change receipt. Preserve settled evidence; do not replay the operation.'
      }
    }

    return { ...raw, status: entries.length ? 'complete' : 'no-change' }
  }

  throw new Error('Unsupported owner result contract.')
}

/** Domain values retain their public shape; mutation status is validated separately from that value. */
export const basicApiResultSchema = (
  contract: BasicApiContract,
  partial = false,
  includeDelivery = true
): ReturnType<typeof toolResultObject> & { anyOf?: unknown[] } => {
  const kind = contract.result.kind
  let valueSchema: unknown = contract.result.valueSchema ?? true

  if (kind === 'created-items') {
    valueSchema = partial
      ? true
      : {
          type: 'array',
          items: { anyOf: [toolDocumentReference, { type: 'null' }] }
        }
  } else if (kind === 'property-mutation') {
    valueSchema = partial
      ? true
      : toolResultObject({
          acceptedIds: toolDocumentReferences,
          changed: { type: 'boolean' }
        })
  } else if (kind === 'change-flag') {
    valueSchema = partial ? true : { type: 'boolean' }
  } else if (kind === 'status-items') {
    valueSchema = {
      type: 'array',
      items: { enum: ['changed', 'unchanged', 'unavailable'] }
    }
  } else if (kind === 'moves' || kind === 'removed') {
    valueSchema = toolResultObject({ [kind]: { type: 'array' } })
  }

  if (kind === 'grouped' || kind === 'ungrouped') {
    valueSchema = toolResultObject({
      groupId: toolDocumentReference,
      elementIds: toolDocumentReferences
    })
  }

  const fields: Record<string, unknown> = {
    status: toolResultStatus,
    value: valueSchema
  }

  if (['write', 'delete'].includes(contract.effect)) {
    fields.mutationScope = toolMutationScope
  }

  if (kind === 'mutation-receipt') {
    fields.acceptedIds = toolDocumentReferences
    fields.unavailableIds = toolDocumentReferences
    fields.changed = { type: 'boolean' }
  }

  if (kind === 'created-items') {
    fields.appliedElementIds = toolDocumentReferences
  }

  if (kind === 'created-items') {
    fields.items = {
      type: 'array',
      items: toolResultObject({
        index: { type: 'integer', minimum: 0 },
        status: toolResultStatus,
        value: { anyOf: [toolDocumentReference, { type: 'null' }] }
      })
    }
  }

  if (kind === 'allocated-ids') {
    fields.value = {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      uniqueItems: true
    }
    fields.execution = { const: 'complete' }
    fields.application = { const: 'prepared' }
  }

  if (kind === 'transient' || kind === 'value') {
    fields.execution = { const: 'complete' }
    fields.application = { const: kind === 'value' ? 'read-only' : 'transient' }
  }

  const required = Object.keys(fields)

  fields.code = { type: 'string' }
  fields.message = { type: 'string' }
  fields.settlement = {
    enum: ['not-started', 'completed', 'partial', 'unknown']
  }
  const delivery = includeDelivery && basicApiDeliverySchema(contract)

  if (delivery) {
    fields.value = valueSchema
    fields.mutationScope = toolMutationScope
    fields.modelResult = delivery
    fields.retained = retainedElementSetSchema
    if (
      !partial &&
      !['mutation-receipt', 'created-items', 'status-items'].includes(kind)
    ) {
      required.push('retained')
    }

    if (partial && !['created-items', 'status-items'].includes(kind)) {
      fields.value = true
    }

    fields.delivery = toolResultObject({
      status: { const: 'unavailable' },
      message: { type: 'string' }
    })
  }

  return {
    ...toolResultObject(
      fields,
      kind === 'mutation-receipt'
        ? required.filter(
            (key) => !['acceptedIds', 'unavailableIds', 'changed'].includes(key)
          )
        : required
    ),
    ...(kind === 'mutation-receipt'
      ? {
          anyOf: [
            { required: ['acceptedIds', 'unavailableIds', 'changed'] },
            {
              properties: {
                status: { const: 'failed' },
                code: { const: 'OWNER_RESULT_INVALID' }
              },
              required: ['code']
            }
          ]
        }
      : {})
  }
}

/** A model view never substitutes for a complete typed owner result. */
export const basicApiDeliverySchema = (contract: BasicApiContract) => {
  if (['created-items', 'status-items'].includes(contract.result.kind)) {
    const count = { type: 'integer', minimum: 0 }
    const counts =
      contract.result.kind === 'created-items'
        ? { createdCount: count, failedCount: count }
        : {
            changedCount: count,
            unchangedCount: count,
            unavailableCount: count
          }

    return {
      anyOf: [
        basicApiResultSchema(contract, false, false),
        {
          ...toolResultObject(
            {
              status: toolResultStatus,
              ...counts,
              settlement: {
                enum: ['not-started', 'completed', 'partial', 'unknown']
              },
              message: { type: 'string' },
              firstIssueIndex: count,
              retained: retainedElementSetSchema,
              delivery: toolResultObject({
                status: { const: 'unavailable' },
                message: { type: 'string' }
              })
            },
            ['status', ...Object.keys(counts)]
          ),
          anyOf: [{ required: ['retained'] }, { required: ['delivery'] }]
        }
      ]
    }
  }

  if (
    !['grouped', 'ungrouped', 'moves', 'removed', 'mutation-receipt'].includes(
      contract.result.kind
    )
  ) {
    return undefined
  }

  const valid = toolResultObject(
    {
      status: toolResultStatus,
      ...(contract.result.kind === 'mutation-receipt'
        ? {
            changed: { type: 'boolean' },
            acceptedCount: { type: 'integer', minimum: 0 },
            unavailableCount: { type: 'integer', minimum: 0 },
            settlement: {
              enum: ['not-started', 'completed', 'partial', 'unknown']
            },
            message: { type: 'string' }
          }
        : {
            value: toolResultObject(
              {
                count: { type: 'integer', minimum: 0 },
                groupId: toolDocumentReference,
                removed: { type: 'boolean' }
              },
              ['count']
            )
          }),
      mutationScope: toolResultObject({
        complete: { type: 'boolean' },
        elementCount: { type: 'integer', minimum: 0 },
        removedElementCount: { type: 'integer', minimum: 0 }
      }),
      retained: retainedElementSetSchema,
      delivery: toolResultObject({
        status: { const: 'unavailable' },
        message: { type: 'string' }
      })
    },
    contract.result.kind === 'mutation-receipt'
      ? ['status', 'mutationScope']
      : ['status', 'value', 'mutationScope']
  )

  if (contract.result.kind !== 'mutation-receipt') {
    return valid
  }

  return {
    anyOf: [
      valid,
      toolResultObject({
        status: { const: 'failed' },
        code: { const: 'OWNER_RESULT_INVALID' },
        message: { type: 'string' },
        settlement: { const: 'completed' },
        ownerResult: true,
        mutationScope: toolResultObject({
          complete: { type: 'boolean' },
          elementCount: { type: 'integer', minimum: 0 },
          removedElementCount: { type: 'integer', minimum: 0 }
        })
      })
    ]
  }
}

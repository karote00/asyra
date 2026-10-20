import { toolDocumentReference, toolRequestReference } from './tool-contract'
/** Data-only contracts shared by native tool admission and browser API adapters.
 * Names identify existing public methods; no geometry implementation lives here.
 */
export type BasicApiEffect =
  'read' | 'write' | 'delete' | 'selection' | 'viewport'
export type BasicApiOwner =
  | 'core'
  | 'element'
  | 'selection'
  | 'hierarchy'
  | 'viewport'
  | 'fill'
  | 'stroke'
export type BasicApiResultKind =
  | 'value'
  | 'mutation-receipt'
  | 'transient'
  | 'created-items'
  | 'status-items'
  | 'property-mutation'
  | 'change-flag'
  | 'moves'
  | 'removed'
  | 'grouped'
  | 'ungrouped'
const resultDescriptions: Record<BasicApiResultKind, string> = {
  transient:
    'Selection or viewport execution only. value preserves the owner result; this is not a document change.',
  value:
    'Successful read. value preserves the owner result, including false or null; no document mutation is implied.',
  'mutation-receipt':
    'value + acceptedIds/unavailableIds + actual changed. Valid unchanged=no-change; some/all unavailable=partial/failed. Retain acknowledged work; never replay.',
  'created-items':
    'Ordered items retain each ID or null. Null is failed creation; mixed results are partial. appliedElementIds includes successful identities only. Empty input is no-change. Missing or misaligned output is a result-contract failure; retain successful IDs and never replay creation.',
  'property-mutation':
    'Canonical acceptedIds and changed preserve validated targets and actual apply evidence. Empty or unchanged valid requests are no-change; invalid output is a result-contract failure, never a write retry.',
  'change-flag':
    'The canonical owner validates the target before returning true for changed or false for unchanged. Missing or invalid targets reject; false is a valid no-op.',
  'status-items':
    'Ordered changed/unchanged/unavailable values preserve each target outcome without per-item action envelopes. Unavailable targets make the operation partial or failed.',
  grouped:
    'A group and its ordered child identities, with a retained target set and full receipt.',
  ungrouped:
    'Removed group and released child identities, with a retained target set and full receipt.',
  moves:
    'value contains the owner movement receipt; an empty moves list is no-change.',
  removed:
    'value contains the owner removal receipt; an empty removed list is no-change.'
}
export interface BasicApiContract {
  owner: BasicApiOwner
  category: string
  operation: string
  method: string
  name: string
  description: string
  parameters: readonly string[]
  effect: BasicApiEffect
  result: {
    kind: BasicApiResultKind
    description: string
    identityPath?: readonly string[]
  }
  inputSchema: Record<string, unknown>
}
export const apiString = { type: 'string', minLength: 1 }
export const apiId = toolDocumentReference
/** Retained element binding is an App capability, not a generic document ID. */
export const apiElementId = { ...apiId, 'x-design-element-binding': 'each' }
export const apiSingleElementId = {
  ...apiId,
  'x-design-element-binding': 'one'
}
export const apiNumber = { type: 'number' }
export const apiBoolean = { type: 'boolean' }
export const apiObject = (
  properties: Record<string, unknown>,
  required = Object.keys(properties)
) => ({
  type: 'object',
  additionalProperties: false,
  properties,
  required
})
export const apiArray = (items: unknown) => ({ type: 'array', items })
export const apiPosition = apiObject({ x: apiNumber, y: apiNumber })
export const apiIds = apiArray(apiId)
export const retainedElementSetSchema = apiObject({
  snapshotId: toolRequestReference,
  leaseId: toolRequestReference,
  total: { type: 'integer', minimum: 0 }
})
/** Element membership only; point/segment identity lists remain explicit. */
export const apiElementIds = {
  'x-design-element-binding': 'all',
  anyOf: [apiIds, retainedElementSetSchema]
}
export const apiUniqueElementIds = {
  'x-design-element-binding': 'all',
  anyOf: [{ ...apiIds, uniqueItems: true }, retainedElementSetSchema]
}
/** These canonical declaration objects identify element membership at the App boundary. */
export const isElementTargetSchema = (schema: unknown): boolean =>
  schema === apiElementIds || schema === apiUniqueElementIds
export const hasElementTargetSchema = (schema: unknown): boolean => {
  if (isElementTargetSchema(schema)) return true
  if (!schema || typeof schema !== 'object' || Array.isArray(schema))
    return false
  const properties = (schema as Record<string, unknown>).properties
  return (
    !!properties &&
    typeof properties === 'object' &&
    Object.values(properties).some(hasElementTargetSchema)
  )
}
export const apiRecord = { type: 'object', additionalProperties: true }
/** Declaration order is the public method's positional argument order. */
export interface BasicApiParameterDefinition {
  name: string
  schema: Record<string, unknown>
  optional?: boolean
}

export interface BasicApiDefinition {
  examples?: readonly Record<string, unknown>[]
  category?: string
  resultKind?: BasicApiResultKind
  resultIdentityPath?: readonly string[]
  owner: BasicApiOwner
  method: string
  effect: BasicApiEffect
  parameters: readonly BasicApiParameterDefinition[]
  description?: string
}

const describeResultContract = (
  effect: BasicApiEffect,
  declared?: BasicApiResultKind
) => {
  let kind = declared
  if (!declared && effect === 'read') kind = 'value'
  if (!declared && (effect === 'selection' || effect === 'viewport'))
    kind = 'transient'
  if (!kind)
    throw new Error('Document writers must declare an owner result contract.')
  return { kind, description: resultDescriptions[kind] }
}

export const defineBasicApi = ({
  owner,
  category = owner,
  method,
  effect,
  parameters,
  resultKind,
  resultIdentityPath,
  examples,
  description = ''
}: BasicApiDefinition): BasicApiContract => ({
  owner,
  category,
  operation: `${owner}.${method}`,
  method,
  effect,
  result: {
    ...describeResultContract(effect, resultKind),
    ...(resultIdentityPath ? { identityPath: resultIdentityPath } : {})
  },
  name: `api_${owner}_${method}`,
  description: `${owner}.${method}. ${description} Uses the existing public API. Event/history suppression options are not model inputs.${resultKind === 'mutation-receipt' ? ` ${resultDescriptions[resultKind]}` : ''}`,
  parameters: parameters.map((parameter) => parameter.name),
  inputSchema: {
    ...apiObject(
      Object.fromEntries(
        parameters.map((parameter) => [parameter.name, parameter.schema])
      ),
      parameters
        .filter((parameter) => !parameter.optional)
        .map((parameter) => parameter.name)
    ),
    ...(examples ? { examples } : {})
  }
})

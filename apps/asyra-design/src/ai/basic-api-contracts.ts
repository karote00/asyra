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
  | 'owner'
  | 'transient'
  | 'created-items'
  | 'boolean-items'
  | 'status-items'
  | 'moves'
  | 'removed'
const resultDescriptions: Record<BasicApiResultKind, string> = {
  transient:
    'Selection or viewport execution only. value preserves the owner result; this is not a document change.',
  value:
    'Successful read. value preserves the owner result, including false or null; no document mutation is implied.',
  owner:
    'value preserves the owner result. Void confirms return only, not a measured change. false/null report no application; unchanged and unavailable may be indistinguishable.',
  'created-items':
    'Ordered items retain each ID or null. Null is failed creation; mixed results are partial. appliedElementIds includes successful identities only. Empty input is no-change.',
  'status-items':
    'Ordered changed/unchanged/unavailable values preserve each target outcome without per-item action envelopes. Unavailable targets make the operation partial or failed.',
  'boolean-items':
    'Ordered booleans report each application. false means unchanged or unavailable, not proof of a valid target. Items preserve that distinction; empty input is no-change.',
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
  result: { kind: BasicApiResultKind; description: string }
  inputSchema: Record<string, unknown>
}
export const apiString = { type: 'string', minLength: 1 }
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
export const apiIds = apiArray(apiString)
export const apiRecord = { type: 'object', additionalProperties: true }
/** Declaration order is the public method's positional argument order. */
export interface BasicApiParameterDefinition {
  name: string
  schema: Record<string, unknown>
  optional?: boolean
}

export interface BasicApiDefinition {
  category?: string
  resultKind?: BasicApiResultKind
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
  let kind: BasicApiResultKind = declared ?? 'owner'
  if (!declared && effect === 'read') kind = 'value'
  if (!declared && (effect === 'selection' || effect === 'viewport'))
    kind = 'transient'
  return { kind, description: resultDescriptions[kind] }
}

export const defineBasicApi = ({
  owner,
  category = owner,
  method,
  effect,
  parameters,
  resultKind,
  description = ''
}: BasicApiDefinition): BasicApiContract => ({
  owner,
  category,
  operation: `${owner}.${method}`,
  method,
  effect,
  result: describeResultContract(effect, resultKind),
  name: `api_${owner}_${method}`,
  description: `${owner}.${method}. ${description} Uses the existing public API. Event/history suppression options are not model inputs.`,
  parameters: parameters.map((parameter) => parameter.name),
  inputSchema: apiObject(
    Object.fromEntries(
      parameters.map((parameter) => [parameter.name, parameter.schema])
    ),
    parameters
      .filter((parameter) => !parameter.optional)
      .map((parameter) => parameter.name)
  )
})

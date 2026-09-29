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
export interface BasicApiContract {
  owner: BasicApiOwner
  method: string
  name: string
  description: string
  parameters: readonly string[]
  effect: BasicApiEffect
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
  owner: BasicApiOwner
  method: string
  effect: BasicApiEffect
  parameters: readonly BasicApiParameterDefinition[]
  description?: string
}

export const defineBasicApi = ({
  owner,
  method,
  effect,
  parameters,
  description = ''
}: BasicApiDefinition): BasicApiContract => ({
  owner,
  method,
  effect,
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

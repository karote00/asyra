import { toolDocumentReference } from './tool-contract'

/** Read values keep extension fields; selected delivery remains a separate choice. */
export const readObject = (
  properties: Record<string, unknown> = {},
  required = Object.keys(properties)
) => ({ type: 'object', properties, required, additionalProperties: {} })

export const readNullable = (schema: Record<string, unknown>) => ({
  anyOf: [schema, { type: 'null' }]
})

export const readArray = (items: Record<string, unknown>) => ({
  type: 'array',
  items
})

export const readNumber = { type: 'number' }
export const readBoolean = { type: 'boolean' }
export const readString = { type: 'string' }
export const readId = toolDocumentReference
export const readIds = readArray(readId)
export const readPosition = {
  ...readObject({ x: readNumber, y: readNumber }),
  additionalProperties: false
}
export const readRect = readObject({
  x: readNumber,
  y: readNumber,
  width: readNumber,
  height: readNumber
})
export const readBounds = readObject({
  minX: readNumber,
  minY: readNumber,
  maxX: readNumber,
  maxY: readNumber
})
export const readElementMetadata = readObject({
  id: readId,
  type: readString,
  name: readString,
  parentId: readString,
  visible: readBoolean,
  lock: readBoolean,
  childCount: readNumber
})
export const readElementData = readObject({
  id: readId,
  type: readString,
  name: readString,
  parentId: readString,
  visible: readBoolean,
  lock: readBoolean
})
export const readRegistrationRef = readObject({
  kind: readString,
  key: readString
})
export const readRegistration = readObject({
  ref: readRegistrationRef,
  owner: readObject()
})
export const readRegistrationRelation = readObject({
  name: readString,
  source: readRegistrationRef,
  target: readRegistrationRef,
  onTargetUnregister: { enum: ['detach', 'unregister-source'] }
})
/** The registration selects T; there is no universal shape to promise for T. */
export const readRegisteredValue = {
  description:
    'Registration-dependent JSON value. Select known fields only when the specific registration guarantees them; inspect unknown values before constructing dependent input.'
}

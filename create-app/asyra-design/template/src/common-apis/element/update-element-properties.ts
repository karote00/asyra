import { runTransaction, type PropertyMutationReceipt } from '@asyra/core'
import { projectGroupGeometryPropertyUpdates } from '@asyra/preset'
import {
  EntityTypes,
  measureBrowserDragPhase,
  type DataTypes,
  type EVENT_OPTIONS
} from '@asyra/utils'
import core from '../../contexts'
import { projectTextLayoutUpdate } from '../text-layout'

const GROUP_GEOMETRY_KEYS = new Set(['x', 'y', 'width', 'height'])

export const updateElementProperties = (
  elementIds: readonly string[],
  values: Readonly<Record<string, DataTypes>>,
  options?: EVENT_OPTIONS
): PropertyMutationReceipt => {
  const entries = Object.entries(values ?? {})
  if (elementIds.length === 0) {
    return Object.freeze({ acceptedIds: Object.freeze([]), changed: false })
  }

  return measureBrowserDragPhase('canonical:updateElementProperties', () => {
    return runTransaction(() => {
      const directRequest = elementIds.map((elementId) => ({
        elementId,
        values: projectTextLayoutUpdate(elementId, values)
      }))
      const explicitGroupElementIds = entries.some(([key]) =>
        GROUP_GEOMETRY_KEYS.has(key)
      )
        ? elementIds.filter(
            (elementId) =>
              core.getElementData(elementId)?.type === EntityTypes.GROUP
          )
        : []
      const request =
        explicitGroupElementIds.length > 0
          ? projectGroupGeometryPropertyUpdates(
              core,
              directRequest,
              explicitGroupElementIds
            )
          : directRequest
      const result = core.updateElementProperties(request, options)
      return Object.freeze({
        acceptedIds: Object.freeze([...new Set(elementIds)]),
        changed: result.changed
      })
    })
  })
}

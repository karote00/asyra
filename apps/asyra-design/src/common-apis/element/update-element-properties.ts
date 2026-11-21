import { CommonApiInputError } from '../common-api-input-error'
import { hasSizeEdit, requireSizeEditTarget } from './geometry-policy'
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
      if (hasSizeEdit(values)) {
        for (const id of elementIds) {
          requireSizeEditTarget(id, core.getElementData(id)?.type)
        }
      }

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
      let request: Parameters<typeof core.updateElementProperties>[0] =
        directRequest

      if (explicitGroupElementIds.length) {
        try {
          request = projectGroupGeometryPropertyUpdates(
            core,
            directRequest,
            explicitGroupElementIds
          )
        } catch (error) {
          if (error instanceof RangeError) {
            throw new CommonApiInputError(error.message, {
              operation: 'resize-group'
            })
          }

          throw error
        }

        if ('width' in values || 'height' in values) {
          request = request.map((update) => {
            const { width, height } = update.values

            if (
              typeof width !== 'number' ||
              typeof height !== 'number' ||
              core.getElementMetadata(update.elementId)?.type !== 'text'
            ) {
              return update
            }

            return {
              ...update,
              values: {
                ...update.values,
                ...projectTextLayoutUpdate(update.elementId, { width, height })
              }
            }
          })
        }
      }

      const result = core.updateElementProperties(request, options)

      return Object.freeze({
        acceptedIds: Object.freeze([...new Set(elementIds)]),
        changed: result.changed
      })
    })
  })
}

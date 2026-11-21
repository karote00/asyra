import core from '../contexts'
import { CommonApiInputError } from '../common-apis/common-api-input-error'
import {
  hasSizeEdit,
  requireSizeEditTarget
} from '../common-apis/element/geometry-policy'

const checkRawGeometry = (
  id: string,
  type: string | undefined,
  values: object
) => {
  requireSizeEditTarget(id, type)
  if (type === 'group' && ('width' in values || 'height' in values)) {
    throw new CommonApiInputError(
      'Use element.changeElementGeometry for Group dimensions so its contents resize together.',
      { elementId: id }
    )
  }
}

const checkElementWrites = (
  updates: readonly { elementId: string; values?: object }[]
) => {
  for (const { elementId, values } of updates) {
    if (values && hasSizeEdit(values)) {
      checkRawGeometry(
        elementId,
        core.getElementMetadata(elementId)?.type,
        values
      )
    }
  }
}

// Keep low-level property tools from bypassing the Design geometry owner.
export const designPropertyTools = {
  updateElementProperties(
    ...args: Parameters<typeof core.updateElementProperties>
  ) {
    checkElementWrites(args[0])

    return core.updateElementProperties(...args)
  },

  patchElementProperties(
    ...args: Parameters<typeof core.patchElementProperties>
  ) {
    checkElementWrites(args[0])

    return core.patchElementProperties(...args)
  },

  updatePropertyComponents(
    ...args: Parameters<typeof core.updatePropertyComponents>
  ) {
    for (const { propertyId, values } of args[0]) {
      if (!hasSizeEdit(values)) {
        continue
      }

      for (const id of core.getPropertyOwnerElementIds([propertyId])) {
        const element = core.getElementData(id)

        if (
          element?.props?.dimension === propertyId ||
          element?.props?.position === propertyId
        ) {
          checkRawGeometry(id, element.type, values)
        }
      }
    }

    return core.updatePropertyComponents(...args)
  }
}

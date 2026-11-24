import { defineFeature, runTransaction } from '@asyra/core'
import {
  elementApis,
  selectionApis,
  systemContextApis
} from '../../common-apis'
import { FeatureNames, InputSystemEvents } from '../../constants'
import type { SystemContextSnapshot } from '@asyra/utils'
import { refreshElementHover } from '../../controllers/hovered-element'

function deleteSelectedElement(snapshot: SystemContextSnapshot) {
  if (systemContextApis.getPathEditingMode()) {
    return null
  }

  const selectedIds = selectionApis.getSelectedIds()

  if (selectedIds.length !== 1) {
    return null
  }

  const elementId = selectedIds[0]

  return runTransaction(() => {
    const deleted = elementApis.deleteElement(elementId)

    if (!deleted) {
      return null
    }

    selectionApis.selectElements([])
    refreshElementHover(snapshot)

    return { deletedElementId: elementId }
  })
}

export const deleteElementFeature = defineFeature(
  FeatureNames.DELETE_SELECTED_ELEMENT,
  InputSystemEvents.INPUT_SHORTCUT_DELETE,
  {
    priority: 100,
    exclusive: true,

    api: {
      deleteSelectedElement: () =>
        deleteSelectedElement(systemContextApis.getSystemContextSnapshot())
    },
    execution: deleteSelectedElement
  }
)

export default deleteElementFeature

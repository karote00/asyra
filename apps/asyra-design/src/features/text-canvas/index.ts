import { defineFeature } from '@asyra/core'
import {
  rectFromPoints,
  SessionCancelPolicies,
  type SystemContextSnapshot,
  type SystemContextSnapshotWithDetail
} from '@asyra/utils'
import { TEXT_COMPONENT_TYPE } from '@asyra/preset'
import {
  elementApis,
  selectionApis,
  systemContextApis,
  viewportApis
} from '../../common-apis'
import { textCanvasApis } from '../../common-apis/text-canvas'
import {
  FeatureNames,
  InputSystemEvents,
  PrimaryToolType,
  FEATURE_MOVEMENT_THRESHOLD
} from '../../constants'

export const textCanvasFeature = defineFeature(
  FeatureNames.EDIT_TEXT,
  InputSystemEvents.INPUT_DOUBLE_CLICK,
  {
    priority: 110,
    exclusive: true,
    api: {
      editSelected: () => {
        const ids = selectionApis.getSelectedIds()
        if (ids.length === 1) textCanvasApis.beginEdit(ids[0])
      },
      finish: textCanvasApis.finish,
      cancel: () => {
        textCanvasApis.cancel()
        systemContextApis.switchPrimaryTool(PrimaryToolType.SELECT)
      }
    },
    execution: (snapshot: SystemContextSnapshot) => {
      if (
        snapshot.primaryTool !== PrimaryToolType.SELECT ||
        snapshot.keyMeta ||
        snapshot.keyCtrl ||
        snapshot.keyShift ||
        snapshot.keyAlt
      )
        return null
      const id = elementApis.getRenderElementIdAtClientPos(
        snapshot.mousePosition
      )
      if (!id || elementApis.getElementType(id) !== TEXT_COMPONENT_TYPE)
        return null
      const selected = selectionApis.getSelectedIds()
      if (selected.length !== 1 || selected[0] !== id) return null
      textCanvasApis.beginEdit(id)
      return textCanvasApis.getSnapshot() ? { elementId: id } : null
    }
  }
)

export const createTextFeature = defineFeature(
  FeatureNames.CREATE_TEXT,
  InputSystemEvents.INPUT_DRAG,
  {
    priority: 20,
    exclusive: true,
    cancelPolicy: SessionCancelPolicies.ROLLBACK,
    session: {
      onStart: (snapshot: SystemContextSnapshot) => {
        if (snapshot.primaryTool !== PrimaryToolType.TEXT) return null
        const position = elementApis.getMousePosInWorkspace(
          snapshot.mousePosition
        )
        if (!position) return null
        return { position, clientPosition: { ...snapshot.mousePosition } }
      },
      onEnd: (snapshot: SystemContextSnapshotWithDetail, state) => {
        if (snapshot.detail?.cancelled) return
        const position = elementApis.getMousePosInWorkspace(
          snapshot.mousePosition
        )
        if (!position) return
        const dragged = elementApis.hasMovedBeyondThreshold(
          state.clientPosition,
          snapshot.mousePosition,
          FEATURE_MOVEMENT_THRESHOLD.createElement
        )
        let bounds = { ...state.position, width: 240, height: 80 }
        if (dragged) {
          const rectangle = rectFromPoints(state.position, position)
          const minimum = 4 / viewportApis.getScale()
          bounds = {
            ...rectangle,
            width: Math.max(minimum, rectangle.width),
            height: Math.max(minimum, rectangle.height)
          }
        }
        textCanvasApis.beginCreate(bounds)
      },
      onCancel: (): undefined => {
        textCanvasApis.cancel()
      }
    }
  }
)

export const cancelTextToolFeature = defineFeature(
  FeatureNames.CANCEL_TEXT,
  InputSystemEvents.INPUT_SHORTCUT_CANCEL,
  {
    priority: 110,
    exclusive: true,
    execution: (snapshot: SystemContextSnapshot) => {
      if (snapshot.primaryTool !== PrimaryToolType.TEXT) return null
      textCanvasApis.cancel()
      systemContextApis.switchPrimaryTool(PrimaryToolType.SELECT)
      return { cancelled: true }
    }
  }
)

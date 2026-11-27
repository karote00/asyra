import type { PositionData } from '@asyra/utils'
import core from '../contexts'
import { fillApis, type FillPatch } from '../common-apis/fills'
import { strokeApis, type StrokePatch } from '../common-apis/strokes'
import { systemContextApis } from '../common-apis/system-context'
import { edit, enabled, editable, position } from './command-inputs'

function appearance(feature: 'fills' | 'strokes', elementId: string) {
  enabled(feature)
  editable(elementId)
  if (
    !Array.isArray(core.getElementComputedData(elementId, [feature])?.[feature])
  ) {
    throw new Error('The element does not support ' + feature)
  }
}

export const appearanceCommands = {
  addFill(elementId: string) {
    appearance('fills', elementId)

    return fillApis.addFill(elementId, edit)
  },

  updateFill(elementId: string, fillId: string, patch: FillPatch) {
    appearance('fills', elementId)

    return fillApis.updateFillFields(
      elementId,
      fillId,
      structuredClone(patch),
      edit
    ).changed
  },

  removeFill(elementId: string, fillId: string) {
    appearance('fills', elementId)

    return fillApis.removeFill(elementId, fillId, edit)
  },

  setActiveGradient(elementId: string | null, fillId: string | null) {
    enabled('fills')
    if (elementId === null && fillId === null) {
      systemContextApis.clearGradientFillEditingState()

      return
    }

    if (
      !elementId ||
      !fillId ||
      !fillApis.getGradientHandleGeometry(elementId, fillId)
    ) {
      throw new Error('Unknown gradient fill')
    }

    editable(elementId)
    systemContextApis.setActiveGradientFill({ elementId, fillId })
  },

  getGradientHandles(elementId: string, fillId: string) {
    return structuredClone(
      fillApis.getGradientHandleGeometry(elementId, fillId)?.canvasHandles ??
        null
    )
  },

  moveGradientHandle(
    elementId: string,
    fillId: string,
    index: 0 | 1,
    point: PositionData
  ) {
    appearance('fills', elementId)
    if (index !== 0 && index !== 1) {
      throw new TypeError('Unknown gradient handle')
    }

    return fillApis.updateGradientHandleAtClientPosition(
      elementId,
      fillId,
      index,
      position(point),
      edit
    ).changed
  },

  addStroke(elementId: string) {
    appearance('strokes', elementId)

    return strokeApis.addStroke(elementId, edit).value
  },

  updateStroke(elementId: string, strokeId: string, patch: StrokePatch) {
    appearance('strokes', elementId)

    return strokeApis.updateStrokeFields(
      elementId,
      strokeId,
      structuredClone(patch),
      edit
    ).changed
  },

  removeStroke(elementId: string, strokeId: string) {
    appearance('strokes', elementId)

    return strokeApis.removeStroke(elementId, strokeId, edit).value
  }
}

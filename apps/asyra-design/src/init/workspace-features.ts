import {
  FeatureNames,
  VectorPathFeatureNames,
  GradientFeatureNames
} from '../constants'
import { getFeatureRegistry, getSessionManager } from '@asyra/core'
import { systemContextApis } from '../common-apis/system-context'
import { textCanvasApis } from '../common-apis/text-canvas'
import core from '../contexts'
import {
  setDisabledFeatures,
  defaultPrimaryTool,
  toolId
} from '../workspace-features'
import { PresetSystemPropertyKeys as Keys } from '@asyra/preset'
const registrations: Record<string, readonly string[]> = {
  select: [
    FeatureNames.SELECTION,
    FeatureNames.SELECT_CONTAINER_CHILD,
    FeatureNames.CLEAR_ELEMENT_SELECTION
  ],
  pen: Object.values(VectorPathFeatureNames),
  hoverElement: [
    FeatureNames.HOVER_ELEMENT,
    FeatureNames.HOVER_ELEMENT + '.render.hover',
    FeatureNames.HOVER_ELEMENT + '.render.leave'
  ],
  text: [
    FeatureNames.CREATE_TEXT,
    FeatureNames.EDIT_TEXT,
    FeatureNames.CANCEL_TEXT
  ],
  moveElements: [FeatureNames.MOVE_ELEMENTS],
  deleteSelectedElement: [FeatureNames.DELETE_SELECTED_ELEMENT],
  moveLayerHierarchy: [FeatureNames.MOVE_LAYER_HIERARCHY],
  fills: Object.values(GradientFeatureNames),
  pan: [FeatureNames.PAN],
  zoom: [FeatureNames.ZOOM],
  zoomFit: [FeatureNames.ZOOM_FIT]
}

function registrationNames(ids: readonly string[]) {
  return new Set(ids.flatMap((id) => registrations[id] ?? []))
}

export function configureWorkspaceFeatures(ids: readonly string[]) {
  const names = registrationNames(ids)
  const registry = getFeatureRegistry()

  for (const group of Object.values(registrations)) {
    for (const name of group) {
      registry.setInteractionEnabled(name, !names.has(name))
    }
  }

  setDisabledFeatures(ids)
  if (ids.includes('text')) {
    textCanvasApis.cancel()
  }

  const primary = core.getSystemProperty<string>(Keys.PRIMARY_TOOL)

  if (ids.includes('pen') && systemContextApis.getPathEditingMode()) {
    systemContextApis.exitPathEditingMode()
  }

  if (!primary || ids.includes(toolId(primary)) || primary === 'none') {
    systemContextApis.switchPrimaryTool(defaultPrimaryTool)
  }
}

export async function updateWorkspaceFeatures(ids: readonly string[]) {
  const sessions = getSessionManager()
  const primary = core.getSystemProperty<string>(Keys.PRIMARY_TOOL)

  if (
    (primary && ids.includes(toolId(primary))) ||
    [...registrationNames(ids)].some((name) => sessions.isFeatureActive(name))
  ) {
    await sessions.cancelActiveSessions(core.getSystemContextSnapshot())
  }

  configureWorkspaceFeatures(ids)
}

import {
  FeatureNames,
  VectorPathFeatureNames,
  GradientFeatureNames
} from '../constants'
import core from '../contexts'
import { setDisabledFeatures, featureEnabled } from '../workspace-features'
import { PresetSystemPropertyKeys as Keys } from '@asyra/preset'
const registrations: Record<string, readonly string[]> = {
  select: [FeatureNames.SELECTION, FeatureNames.SELECT_CONTAINER_CHILD],
  // Escape also clears ordinary element selection outside a path session.
  pen: Object.values(VectorPathFeatureNames).filter(
    (name) => name !== FeatureNames.CANCEL_PEN_EDITING
  ),
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

export function configureWorkspaceFeatures(ids: readonly string[]) {
  setDisabledFeatures(ids)
  for (const id of ids) {
    if (Object.hasOwn(registrations, id)) {
      for (const name of registrations[id]) {
        core.unregisterFeature(name)
      }
    }
  }

  // Primary tool and path editing state are runtime-only managed properties.
  if (!featureEnabled('select')) {
    core.setSystemProperty(Keys.PRIMARY_TOOL, 'none')
  }
}

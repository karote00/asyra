import { getFeatureRegistry } from '@asyra/core'
import { FeatureNames } from '../constants'
import type { hoverElementFeature } from '../features/hover-element'

function hoverCommands() {
  return getFeatureRegistry().getAPI(FeatureNames.HOVER_ELEMENT) as Partial<
    typeof hoverElementFeature.api
  >
}

export const setHoveredElementId = (id: string | null) =>
  hoverCommands().setHoveredElementId?.(id)

export const refreshElementHover = (
  snapshot: Parameters<typeof hoverElementFeature.api.refreshHoverAtPointer>[0]
) => hoverCommands().refreshHoverAtPointer?.(snapshot)

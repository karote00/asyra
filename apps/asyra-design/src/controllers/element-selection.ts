import { getFeatureRegistry } from '@asyra/core'
import type { EVENT_OPTIONS } from '@asyra/utils'
import { FeatureNames } from '../constants'
import type { selectionFeature } from '../features/selection'

function selectionCommands() {
  return getFeatureRegistry().getAPI(FeatureNames.SELECTION) as Partial<
    typeof selectionFeature.api
  >
}

export function selectElements(
  elementIds: string[],
  options?: EVENT_OPTIONS,
  required = false
) {
  const select = selectionCommands().selectElements

  if (required && !select) {
    throw new Error('Disabled Design feature: select')
  }

  select?.(elementIds, options)
}

export const toggleElementSelection = (id: string) =>
  selectionCommands().toggleSelection?.(id)

export const clearSelection = () => selectionCommands().clearSelection?.()

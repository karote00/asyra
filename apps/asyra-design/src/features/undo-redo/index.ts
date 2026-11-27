import {
  featureEnabled,
  type DisabledCommandBehavior
} from '../../workspace-features'
import { defineFeature } from '@asyra/core'
import { historyApis } from '../../common-apis'
import { FeatureNames, InputSystemEvents } from '../../constants'
import type { SystemContextSnapshotWithDetail } from '@asyra/utils'

export async function runHistoryCommand(
  direction: 'undo' | 'redo',
  behavior?: DisabledCommandBehavior
) {
  if (!featureEnabled(direction, behavior)) {
    return null
  }

  await historyApis[direction]()

  return direction === 'undo' ? { undid: true } : { redid: true }
}

export const undoRedoFeature = defineFeature(
  FeatureNames.UNDO_REDO,
  InputSystemEvents.INPUT_SHORTCUT_UNDOREDO,
  {
    priority: 100,
    executionMode: 'immediate',
    exclusive: true,

    execution: async (snapshot: SystemContextSnapshotWithDetail) => {
      const direction = snapshot.detail?.historyDirection

      if (direction !== 'undo' && direction !== 'redo') {
        return null
      }

      return runHistoryCommand(direction)
    }
  }
)

export default undoRedoFeature
